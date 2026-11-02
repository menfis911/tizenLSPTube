export function createTranslationController({ current, request, createAudio, notify, diagnose, options = () => ({original: 15, voice: 100, pause: false}), progress = () => {} }) {
    let run = null;
    let lastDetails = 'Перевод ещё не запускался';
    function release(audio) {
        for (const action of [() => audio.pause(), () => audio.removeAttribute('src'), () => audio.load(),
            () => { if (audio.parentNode) audio.parentNode.removeChild(audio); }]) {
            try { action(); } catch (_) { /* Cleanup must not hide the playback error. */ }
        }
    }
    function setOriginalMuted(s, muted) {
        const method = muted ? 'mute' : 'unMute';
        if (s.player && typeof s.player[method] === 'function') {
            try { s.player[method](); } catch (_) {}
        }
        s.video.muted = muted;
    }
    function restore(s) {
        if (s.lowered !== null && Math.abs(s.video.volume - s.lowered) < 0.001) {
            if (s.player && typeof s.player.setVolume === 'function') {
                try { s.player.setVolume(s.volume * 100); } catch (_) {}
            }
            s.video.volume = s.volume;
        }
        if (s.forcedMuted || (s.lowered !== null && s.originalMuted)) setOriginalMuted(s, s.originalMuted);
        s.forcedMuted = false;
        s.lowered = null;
    }
    function duck(s) {
        const v = s.video;
        if (s.lowered === null) { s.volume = v.volume; s.originalMuted = v.muted; }
        const muteOriginal = options().original === 0;
        s.lowered = s.volume * options().original / 100;
        if (s.player && typeof s.player.setVolume === 'function') {
            try { s.player.setVolume(s.lowered * 100); } catch (_) {}
        }
        v.volume = s.lowered;
        if (muteOriginal) { s.forcedMuted = true; setOriginalMuted(s, true); }
        else if (s.forcedMuted) { setOriginalMuted(s, s.originalMuted); s.forcedMuted = false; }
        else if (s.originalMuted) setOriginalMuted(s, true);
    }
    function resume(s) {
        if (!s.preparing) return;
        s.preparing = false;
        const now = current();
        if (now && now.video === s.video && now.id === s.id && s.video.paused) {
            try { Promise.resolve(s.video.play()).catch(() => {}); } catch (_) {}
        }
    }
    function stop(message) {
        const s = run; run = null;
        if (s) {
            if (message) s.lastError = message;
            lastDetails = details(s);
            clearTimeout(s.poll); clearTimeout(s.watchdog); clearInterval(s.clock);
            restore(s); resume(s); progress(null);
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
            'Формат: ' + mp3,
            'Загрузка: ' + (a.progress || 'нет данных'),
            'Оригинал: задано ' + options().original + '%; volume=' + s.video.volume + '; muted=' + s.video.muted,
            'Перевод: ' + options().voice + '%; принудительное отключение оригинала=' + !!s.forcedMuted,
            'PCM sourceActive: ' + a.sourceActive,
            'readyState: ' + a.readyState + '; networkState: ' + a.networkState,
            'paused: ' + a.paused + '; error: ' + (a.error ? a.error.code : 0),
            'Аудио: ' + Number(a.currentTime).toFixed(2) + ' с; видео: ' + Number(s.video.currentTime).toFixed(2) + ' с',
            'Видео paused: ' + s.video.paused + '; seeking: ' + s.video.seeking + '; readyState: ' + s.video.readyState,
            'Вызовов синхронизации: ' + s.ticks + '; выравниваний: ' + s.alignments + '; без движения: ' + s.silentFor + ' мс',
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
            a.muted = s.forcedMuted ? s.originalMuted : v.muted;
            a.volume = options().voice / 100;
            a.playbackRate = v.playbackRate;
            const now = Date.now(), elapsed = Math.min(1000, now - s.lastSync);
            s.lastSync = now;
            if (v.paused || v.seeking || v.readyState < 3) { a.pause(); restore(s); return; }
            const sourceActive = a.sourceActive === true;
            const clockAdvanced = s.lastAudioTime !== null && a.currentTime > s.lastAudioTime + 0.01;
            let aligned = false;
            if (a.readyState >= 1 && Math.abs(a.currentTime - v.currentTime) > 0.7) {
                a.currentTime = v.currentTime; aligned = true; s.alignments++;
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
                    progress(null);
                    notify(s.partial ? 'Включён перевод первой части. Остальное готовится' : 'Перевод на русский включён');
                }
            } else {
                s.silentFor = sourceActive || (aligned && clockAdvanced) ? 0 : s.silentFor + elapsed;
                if (a.paused || a.readyState < 2 || s.silentFor >= 1500) restore(s);
                if (s.confirmed && s.silentFor >= 20000) { fail(s, 'Аудио перевода не воспроизводится'); return; }
            }
            if (s.confirmed && !a.paused && a.readyState >= 2 && s.silentFor < 1500) duck(s);
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
                const a = s.audio = createAudio(s.video.currentTime); s.partial = result.partial;
                s.mediaEvents = []; s.alignments = 0; s.lastSync = Date.now(); s.silentFor = 0; s.lastAudioTime = null; s.confirmed = false;
                // Independent of video readiness, play() promises and the synchronization loop.
                s.watchdog = setTimeout(() => { if (run === s && !s.confirmed) fail(s, 'PCM-звук не запустился за 60 секунд'); }, 60000);
                ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'waiting', 'stalled', 'error'].forEach(name => {
                    a.addEventListener(name, () => { s.mediaEvents.push(name); if (s.mediaEvents.length > 8) s.mediaEvents.shift(); });
                });
                a.onerror = () => { if (same(s) && s.audio === a) fail(s,
                    'Не удалось загрузить аудио перевода' + (a.error && a.error.message ? ': ' + a.error.message : '')); };
                a.onended = () => { if (same(s) && s.audio === a && !s.video.ended) stop('Эта часть видео ещё не переведена. Попробуйте позже'); };
                a.onloadedmetadata = () => { if (same(s) && s.audio === a) { resume(s); sync(s); } };

                a.src = result.url; a.volume = options().voice / 100; a.load();
                s.phase = 'Запуск аудио';
                progress('Загрузка звука…');
                sync(s);
            } else if (!s.audio) { s.phase = 'Яндекс готовит перевод'; progress('Яндекс готовит перевод…'); }
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
            s.preparing = options().pause && !s.video.paused;
            if (s.preparing) s.video.pause();
            progress('Запрашиваем перевод…');
            s.clock = setInterval(() => sync(s), 500);
            poll(s);
        }
    };
}
