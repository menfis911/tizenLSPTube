export function createTranslationController({ current, request, createAudio, notify, diagnose }) {
    let run = null;
    function restore(s) {
        if (s.lowered !== null && Math.abs(s.video.volume - s.lowered) < 0.001) s.video.volume = s.volume;
        s.lowered = null;
    }
    function stop(message) {
        const s = run; run = null;
        if (s) {
            clearTimeout(s.poll); clearInterval(s.clock);
            if (s.cancel) s.cancel();
            if (s.audio) { s.audio.pause(); s.audio.removeAttribute('src'); s.audio.load(); s.audio.remove(); }
            s.events.forEach(([name, fn]) => s.video.removeEventListener(name, fn));
            restore(s);
        }
        if (message) notify(message);
    }
    function same(s) {
        const now = current();
        return run === s && now && now.id === s.id && now.video === s.video;
    }
    function fail(s, message) {
        if (!same(s)) return;
        const a = s.audio;
        let mp3 = 'нет метода';
        try { if (a && a.canPlayType) mp3 = a.canPlayType('audio/mpeg') || 'не заявлен'; }
        catch (_) { mp3 = 'ошибка проверки'; }
        const details = a ? [
            'Элемент: ' + (a.tagName || 'audio'),
            'MP3: ' + mp3,
            'readyState: ' + a.readyState + '; networkState: ' + a.networkState,
            'paused: ' + a.paused + '; error: ' + (a.error ? a.error.code : 0),
            'Аудио: ' + Number(a.currentTime).toFixed(2) + ' с; видео: ' + Number(s.video.currentTime).toFixed(2) + ' с',
            'События: ' + s.mediaEvents.join(' → ')
        ].join('\n') : 'Аудиоплеер не создан';
        stop(message);
        if (diagnose) diagnose(message, details);
    }
    function sync(s) {
        if (!same(s)) { if (run === s) stop(); return; }
        try {
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
                if (!s.confirmed) {
                    s.confirmed = true;
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
            const pending = request(s.id, s.video.duration);
            s.cancel = pending.cancel;
            const result = await pending.promise;
            s.cancel = null;
            if (!same(s)) return;
            if (result.error) throw new Error(result.error);
            // Keep playing a partial track even if polling renews its signed URL.
            if (result.url && (!s.audio || (s.partial && !result.partial))) {
                if (s.audio) { s.audio.pause(); restore(s); s.audio.removeAttribute('src'); s.audio.load(); s.audio.remove(); }
                const a = s.audio = createAudio(); s.partial = result.partial;
                s.mediaEvents = []; s.lastSync = Date.now(); s.silentFor = 0; s.lastAudioTime = null; s.confirmed = false;
                ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'waiting', 'stalled', 'error'].forEach(name => {
                    a.addEventListener(name, () => { s.mediaEvents.push(name); if (s.mediaEvents.length > 8) s.mediaEvents.shift(); });
                });
                a.onerror = () => { if (same(s) && s.audio === a) fail(s, 'Не удалось загрузить аудио перевода'); };
                a.onended = () => { if (same(s) && s.audio === a && !s.video.ended) stop('Эта часть видео ещё не переведена. Попробуйте позже'); };
                a.onloadedmetadata = () => { if (same(s) && s.audio === a) sync(s); };
                a.onwaiting = () => { if (same(s) && s.audio === a) restore(s); };
                a.src = result.url; a.load();
                notify('Перевод готов. Запускаем звук…');
                sync(s);
            } else if (!s.audio) notify('Яндекс готовит перевод… Можно продолжать просмотр');
            if (result.status !== 1) s.poll = setTimeout(() => poll(s), Math.max(5, Math.min(60, result.retryAfter || 10)) * 1000);
        } catch (error) { if (same(s)) stop(error.message || 'Ошибка перевода'); }
    }
    return {
        active: () => !!run,
        stop,
        toggle() {
            if (run) { stop('Перевод выключен'); return; }
            const now = current();
            if (!now || !/^[\w-]{11}$/.test(now.id || '') || !Number.isFinite(now.video.duration) ||
                now.video.duration <= 0 || now.video.duration > 14400 || now.live) {
                notify('Откройте обычный ролик длительностью до 4 часов'); return;
            }
            const s = run = { ...now, events: [], started: Date.now(), lowered: null, volume: now.video.volume };
            ['pause', 'play', 'seeking', 'seeked', 'ratechange', 'waiting', 'playing', 'ended'].forEach(name => {
                const fn = () => sync(s); s.events.push([name, fn]); s.video.addEventListener(name, fn);
            });
            s.clock = setInterval(() => sync(s), 500);
            notify('Запрашиваем перевод у Яндекса…'); poll(s);
        }
    };
}
