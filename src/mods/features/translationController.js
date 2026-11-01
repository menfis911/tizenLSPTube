export function createTranslationController({ current, request, createAudio, notify }) {
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
    function sync(s) {
        if (!same(s)) { if (run === s) stop(); return; }
        const v = s.video, a = s.audio;
        if (v.ended) { stop(); return; }
        if (!a) return;
        a.muted = v.muted;
        a.playbackRate = v.playbackRate;
        if (v.paused || v.seeking || v.readyState < 3) { a.pause(); restore(s); return; }
        if (a.readyState < 1) return;
        if (Math.abs(a.currentTime - v.currentTime) > 0.45) a.currentTime = v.currentTime;
        if (a.paused && !s.playing) {
            s.playing = true;
            Promise.resolve(a.play()).then(() => {
                s.playing = false;
                if (!same(s) || s.audio !== a) { a.pause(); return; }
                if (v.paused || v.seeking || v.readyState < 3) { a.pause(); restore(s); return; }
                if (s.lowered === null) {
                    s.volume = v.volume;
                    s.lowered = s.volume * 0.15; v.volume = s.lowered;
                }
            }, () => { s.playing = false; if (same(s) && s.audio === a) stop('Не удалось включить звук перевода'); });
        }
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
                a.onerror = () => { if (same(s) && s.audio === a) stop('Не удалось загрузить аудио перевода'); };
                a.onended = () => { if (same(s) && s.audio === a && !s.video.ended) stop('Эта часть видео ещё не переведена. Попробуйте позже'); };
                a.onloadedmetadata = () => { if (same(s) && s.audio === a) sync(s); };
                a.onwaiting = () => { if (same(s) && s.audio === a) restore(s); };
                a.onplaying = () => {
                    if (same(s) && s.audio === a && s.lowered === null && !s.video.paused) {
                        s.volume = s.video.volume; s.lowered = s.volume * 0.15; s.video.volume = s.lowered;
                    }
                };
                a.src = result.url; a.load();
                notify(result.partial ? 'Включён перевод первой части. Остальное готовится' : 'Перевод на русский включён');
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
