export function createAacTranslation({current, request, reload, startAudio, stopAudio, audioDetails, readVoice,
    options, progress, notify, diagnose, delay = ms => new Promise(resolve => setTimeout(resolve, ms))}) {
    let run = null, last = 'Непрерывный AAC-перевод ещё не запускался';
    function stop(restore = true) {
        const s = run; if (!s) return;
        run = null; clearInterval(s.watch);
        if (s.cancel) s.cancel();
        stopAudio(); progress(null);
        if (s.token) { const job = request('/lsptube/aac-cancel?token=' + s.token); job.promise.catch(() => {}); }
        const now = current();
        if (now && now.id === s.id) {
            if (restore && s.reloaded) {
                try { reload(s.id, now.video.currentTime, now.video.paused); } catch (error) { notify(error.message); }
            } else if (s.preparing && !s.wasPaused) {
                try { Promise.resolve(now.video.play()).catch(() => {}); } catch (_) {}
            }
        }
    }
    function fail(s, error) {
        if (run !== s) return;
        last = s.phase + '\n' + (error.message || error); stop(); diagnose('Непрерывный перевод · ошибка', last);
    }
    async function get(s, path, binary = false) {
        if (run !== s) throw new Error('Перевод отменён');
        const job = request(path, binary); s.cancel = job.cancel;
        const result = await job.promise;
        if (run !== s) throw new Error('Перевод отменён');
        s.cancel = null; return result;
    }
    async function prepare(s) {
        try {
            let result;
            const deadline = Date.now() + 15 * 60 * 1000;
            do {
                s.phase = 'Яндекс готовит перевод'; progress(s.phase + '…');
                result = await get(s, '/lsptube/vot?id=' + s.id + '&duration=' + Math.ceil(s.duration) + '&lang=en');
                if (result.url && !result.partial) break;
                if (Date.now() > deadline) throw new Error('Яндекс пока не подготовил полный перевод');
                await delay(Math.max(5, Math.min(60, result.retryAfter || 10)) * 1000);
            } while (run === s);
            if (run !== s) return;
            const match = /^\/lsptube\/pcm\?token=([a-f0-9]{32})$/.exec(result.url || '');
            if (!match) throw new Error('Служба не вернула дорожку перевода');
            s.token = match[1];
            const path = '/lsptube/aac-prepare?token=' + s.token + '&volume=' + options().voice + '&duration=' + Math.ceil(s.duration);
            const encodeDeadline = Date.now() + 30 * 60 * 1000;
            do {
                const status = await get(s, path);
                s.phase = status.stage; progress(status.stage + (status.percent === null ? '…' : ': ' + status.percent + '%'));
                if (status.ready) break;
                if (Date.now() > encodeDeadline) throw new Error('Подготовка AAC заняла больше 30 минут');
                await delay(1000);
            } while (run === s);
            if (run !== s) return;
            s.phase = 'Загрузка AAC'; progress(s.phase + '…');
            const preset = readVoice(await get(s, '/lsptube/aac-data?token=' + s.token, true));
            const now = current();
            if (!now || now.id !== s.id) { stop(false); return; }
            const position = now.video.currentTime;
            if (!s.preparing) s.wasPaused = now.video.paused;
            startAudio(preset, s.id, message => { if (run === s) fail(s, new Error(message)); });
            s.reloaded = true; s.preparing = false; s.playAt = Date.now(); s.phase = 'Переключение аудиодорожки';
            progress(s.phase + '…'); reload(s.id, position, s.wasPaused);
        } catch (error) { fail(s, error); }
    }
    return {
        active: () => !!run,
        stop,
        inspect() { diagnose('Непрерывный перевод · AAC', run ? run.phase + '\n' + JSON.stringify(audioDetails() || {}) : last); },
        toggle() {
            if (run) { stop(); notify('Перевод выключен'); return; }
            const now = current();
            if (!now || !/^[\w-]{11}$/.test(now.id || '') || now.live || !Number.isFinite(now.video.duration) || now.video.duration <= 0 || now.video.duration > 14400) {
                notify('Откройте обычный ролик длительностью до 4 часов'); return;
            }
            const s = run = {id: now.id, duration: now.video.duration, wasPaused: now.video.paused, phase: 'Запрос перевода'};
            s.preparing = options().pause && !s.wasPaused;
            if (s.preparing) now.video.pause();
            s.watch = setInterval(() => {
                const now = current();
                if (now && now.id && now.id !== s.id) { stop(false); return; }
                if (!s.reloaded) return;
                const state = audioDetails();
                if (now && now.video.error) { fail(s, new Error('Ошибка видеоплеера: ' + now.video.error.code)); return; }
                if (!s.started && state && state.packets > 0 && now && now.video.readyState >= 3) {
                    s.started = true; s.phase = 'Воспроизведение AAC-перевода'; progress(null);
                    if (s.wasPaused) now.video.pause();
                    notify('Непрерывный перевод включён · без оригинала');
                }
                if (!s.started && Date.now() - s.playAt > 30000) fail(s, new Error('YouTube не открыл новую AAC-дорожку за 30 секунд'));
            }, 500);
            prepare(s);
        }
    };
}
