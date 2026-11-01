export function createTranslationController({ current, request, createAudio, notify, diagnose }) {
    let run = null;
    let lastDetails = 'Перевод ещё не запускался';
    function release(audio) {
        for (const action of [() => audio.pause(), () => audio.removeAttribute('src'), () => audio.load(),
            () => { if (audio.parentNode) audio.parentNode.removeChild(audio); }]) {
            try { action(); } catch (_) { /* Cleanup must not hide the playback error. */ }
        }
    }
    function restore(s) {
        if (s.lowered !== null && Math.abs(s.video.volume - s.lowered) < 0.001) s.video.volume = s.volume;
        s.lowered = null;
    }
    function stop(message) {
        const s = run; run = null;
        if (s) {
            if (message) s.lastError = message;
            lastDetails = details(s);
            clearTimeout(s.poll); clearTimeout(s.watchdog); clearInterval(s.clock);
            restore(s);
            if (s.cancel) { try { s.cancel(); } catch (_) {} }
            if (s.audio) release(s.audio);
            s.events.forEach(([name, fn]) => { try { s.video.removeEventListener(name, fn); } catch (_) {} });
        }
        if (message) notify(message);
    }
    function same(s) {
        const now = current();
        return run === s && now && now.id === s.id && now.video === s.video;
    }
    function details(s) {
        const a = s.audio;
        let mp3 = 'нет метода';
        try { if (a && a.canPlayType) mp3 = a.canPlayType('audio/mpeg') || 'не заявлен'; }
        catch (_) { mp3 = 'ошибка проверки'; }
        const phase = 'Этап: ' + s.phase + (s.lastError ? '\nПричина: ' + s.lastError : '');
        return phase + '\n' + (a ? [
            'Элемент: ' + (a.tagName || 'audio'),
            'MP3: ' + mp3,
            'readyState: ' + a.readyState + '; networkState: ' + a.networkState,
            'paused: ' + a.paused + '; error: ' + (a.error ? a.error.code : 0),
            'Аудио: ' + Number(a.currentTime).toFixed(2) + ' с; видео: ' + Number(s.video.currentTime).toFixed(2) + ' с',
            'Видео paused: ' + s.video.paused + '; seeking: ' + s.video.seeking + '; readyState: ' + s.video.readyState,
            'Вызовов синхронизации: ' + s.ticks,
            'События: ' + s.mediaEvents.join(' → ')
        ].join('\n') : 'Аудиоплеер не создан');
    }
    function fail(s, message) {
        if (run !== s) return;
        s.lastError = message;
        stop();
        if (diagnose) diagnose(message, lastDetails);
        notify(message);
    }
    function sync(s) {
        if (!same(s)) { if (run === s) { s.phase = 'Плеер или ролик изменился'; stop(); } return; }
        try {
            s.ticks++;
            const v = s.video, a = s.audio;
            if (v.ended) { stop(); return; }
            if (!a) return;
            a.muted = v.muted;
            a.playbackRate = v.playbackRate;
            const now = Date.now(), elapsed = Math.min(1000, now - s.lastSync);
            s.lastSync = now;
            if (v.paused || v.seeking || v.readyState < 3) { a.pause(); restore(s); return; }
            let aligned = false;
            if (a.readyState >= 1 && Math.abs(a.currentTime - v.currentTime) > 0.7) {
                a.currentTime = v.currentTime; aligned = true;
            }
            const advancing = !aligned && !a.paused && a.readyState >= 2 &&
                s.lastAudioTime !== null && a.currentTime > s.lastAudioTime + 0.01 &&
                a.currentTime - s.lastAudioTime < Math.max(2, Math.abs(v.playbackRate) * 1.5) &&
                Math.abs(a.currentTime - v.currentTime) <= 0.7;
            s.lastAudioTime = a.currentTime;
            if (advancing) {
                s.silentFor = 0;
                s.phase = 'Воспроизведение перевода';
                if (!s.confirmed) {
                    s.confirmed = true;
                    clearTimeout(s.watchdog);
                    notify(s.partial ? 'Включён перевод первой части. Остальное готовится' : 'Перевод на русский включён');
                }
                if (s.lowered === null) {
                    s.volume = v.volume; s.lowered = s.volume * 0.15; v.volume = s.lowered;
                }
            } else {
                s.silentFor += elapsed;
                if (a.paused || a.readyState < 3 || s.silentFor >= 1500) restore(s);
                if (s.silentFor >= 20000) { fail(s, 'Аудио перевода не воспроизводится'); return; }
            }
            if (a.paused && !s.playing) {
                s.playing = true;
                // Cobalt may return void and may need play() before metadata is available.
                Promise.resolve(a.play()).then(() => {
                    s.playing = false;
                    if (!same(s) || s.audio !== a) { a.pause(); return; }
                    if (v.paused || v.seeking || v.readyState < 3) { a.pause(); restore(s); return; }
                }, () => { s.playing = false; if (same(s) && s.audio === a) fail(s, 'Не удалось включить звук перевода'); });
            }
        } catch (error) { fail(s, 'Ошибка аудиоплеера: ' + (error.name || 'Error')); }
    }
    async function poll(s) {
        if (!same(s)) return;
        if (Date.now() - s.started > 15 * 60 * 1000) { stop('Перевод пока не готов. Попробуйте позже'); return; }
        try {
            s.phase = 'Запрос к Яндексу';
            const pending = request(s.id, s.video.duration);
            s.cancel = pending.cancel;
            const result = await pending.promise;
            s.cancel = null;
            if (!same(s)) return;
            if (result.error) throw new Error(result.error);
            // Keep playing a partial track even if polling renews its signed URL.
            if (result.url && (!s.audio || (s.partial && !result.partial))) {
                s.phase = 'Создание аудиоплеера';
                if (s.audio) { restore(s); release(s.audio); }
                clearTimeout(s.watchdog);
                const a = s.audio = createAudio(); s.partial = result.partial;
                s.mediaEvents = []; s.lastSync = Date.now(); s.silentFor = 0; s.lastAudioTime = null; s.confirmed = false;
                // Independent of video readiness, play() promises and the synchronization loop.
                s.watchdog = setTimeout(() => { if (run === s && !s.confirmed) fail(s, 'Аудио перевода не запустилось за 20 секунд'); }, 20000);
                ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'waiting', 'stalled', 'error'].forEach(name => {
                    a.addEventListener(name, () => { s.mediaEvents.push(name); if (s.mediaEvents.length > 8) s.mediaEvents.shift(); });
                });
                a.onerror = () => { if (same(s) && s.audio === a) fail(s, 'Не удалось загрузить аудио перевода'); };
                a.onended = () => { if (same(s) && s.audio === a && !s.video.ended) stop('Эта часть видео ещё не переведена. Попробуйте позже'); };
                a.onloadedmetadata = () => { if (same(s) && s.audio === a) sync(s); };
                a.onwaiting = () => { if (same(s) && s.audio === a) restore(s); };
                a.src = result.url; a.load();
                s.phase = 'Запуск аудио';
                notify('Перевод готов. Запускаем звук…');
                sync(s);
            } else if (!s.audio) { s.phase = 'Яндекс готовит перевод'; notify('Яндекс готовит перевод… Можно продолжать просмотр'); }
            if (result.status !== 1) s.poll = setTimeout(() => poll(s), Math.max(5, Math.min(60, result.retryAfter || 10)) * 1000);
        } catch (error) { if (same(s)) { s.phase = 'Ошибка: ' + s.phase; stop(error.message || 'Ошибка перевода'); } }
    }
    return {
        active: () => !!run,
        inspect() { if (diagnose) diagnose('Проверка звука перевода', run ? details(run) : lastDetails); },
        stop,
        toggle() {
            if (run) { stop('Перевод выключен'); return; }
            const now = current();
            if (!now || !/^[\w-]{11}$/.test(now.id || '') || !Number.isFinite(now.video.duration) ||
                now.video.duration <= 0 || now.video.duration > 14400 || now.live) {
                notify('Откройте обычный ролик длительностью до 4 часов'); return;
            }
            const s = run = { ...now, events: [], started: Date.now(), lowered: null, volume: now.video.volume, ticks: 0, phase: 'Запуск запроса' };
            ['pause', 'play', 'seeking', 'seeked', 'ratechange', 'waiting', 'playing', 'ended'].forEach(name => {
                const fn = () => sync(s); s.events.push([name, fn]); s.video.addEventListener(name, fn);
            });
            s.clock = setInterval(() => sync(s), 500);
            notify('Запрашиваем перевод у Яндекса…'); poll(s);
        }
    };
}
