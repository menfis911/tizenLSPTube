import showTranslationDiagnostics from '../ui/translationDiagnostics.js';
import showTranslationProgress from '../ui/translationProgress.js';
let stopPrevious;

export default function startAacTest(mode = 'file') {
    if (stopPrevious) stopPrevious();
    const video = document.querySelector('video');
    if (!video) { showTranslationDiagnostics('Проверка AAC', 'Откройте ролик YouTube и повторите проверку.'); return; }
    const audio = document.createElement('audio');
    const mseMode = mode === 'mse', events = [];
    const paused = video.paused, videoStart = video.currentTime;
    let done = false, timer, xhr, objectUrl, mediaSource, peakTime = 0;
    const started = Date.now(), label = mseMode ? 'AAC / MediaSource' : 'AAC / MP4-файл';
    const Url = window.URL;
    audio.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    audio.preload = 'auto'; audio.volume = 1;
    function finish(message, report = true) {
        if (done) return;
        done = true;
        const details = [label + ' · 20 секунд ровного двухтонального сигнала',
            message, 'Это проверка формата, не перевод ролика.',
            'AAC: ' + (audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') || 'не заявлен'),
            'Аудио: ' + Number(audio.currentTime).toFixed(2) + ' с; максимум: ' + peakTime.toFixed(2) + ' с',
            'YouTube продвинулся: ' + Number(video.currentTime - videoStart).toFixed(2) + ' с; paused=' + video.paused,
            'readyState=' + audio.readyState + '; networkState=' + audio.networkState + '; paused=' + audio.paused + '; error=' + (audio.error ? audio.error.code : 0),
            'События: ' + events.join(' → '),
            'Сообщите: был ли сигнал непрерывным и продолжал ли играть ролик.'
        ].join('\n');
        clearInterval(timer);
        document.removeEventListener('keydown', onKey, true);
        audio.onerror = audio.onended = null;
        if (xhr) xhr.abort();
        try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch (_) {}
        if (audio.parentNode) audio.parentNode.removeChild(audio);
        if (objectUrl && Url.revokeObjectURL) { try { Url.revokeObjectURL(objectUrl); } catch (_) {} }
        if (document.querySelector('video') === video) {
            try {
                if (paused) video.pause();
                else if (video.paused && !video.ended) Promise.resolve(video.play()).catch(() => {});
            } catch (_) {}
        }
        stopPrevious = null; showTranslationProgress(null);
        if (report) showTranslationDiagnostics('Проверка ' + label, details);
    }
    function onKey(event) {
        if (![27, 8, 461, 10009].includes(event.keyCode)) return;
        event.preventDefault(); event.stopImmediatePropagation(); finish('Проверка остановлена кнопкой Назад');
    }
    ['loadstart', 'loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'ended', 'error'].forEach(name => {
        audio.addEventListener(name, () => { if (!done) { events.push(name); if (events.length > 12) events.shift(); } });
    });
    audio.onerror = () => finish('Плеер отклонил AAC или не смог загрузить файл');
    audio.onended = () => { peakTime = Math.max(peakTime, audio.currentTime); finish('Дорожка дошла до конца. Непрерывность звука нужно оценить на слух.'); };
    document.body.appendChild(audio); document.addEventListener('keydown', onKey, true);
    stopPrevious = () => finish('Проверка отменена', false);
    timer = setInterval(() => {
        if (document.querySelector('video') !== video || video.ended) { finish('Ролик YouTube завершён или сменился'); return; }
        peakTime = Math.max(peakTime, audio.currentTime);
        showTranslationProgress(label + ': ' + Number(audio.currentTime).toFixed(0) + ' / 20 с · Назад — остановить');
        if (Date.now() - started >= 45000) finish('Тайм-аут: дорожка не завершилась за 45 секунд');
    }, 500);
    try {
        if (mseMode) {
            const Type = window.MediaSource;
            if (!Type || !Url || !Url.createObjectURL || !Type.isTypeSupported('audio/mp4; codecs="mp4a.40.2"')) {
                finish('MediaSource с AAC не заявлен на этом устройстве'); return;
            }
            mediaSource = new Type(); objectUrl = Url.createObjectURL(mediaSource);
            mediaSource.addEventListener('sourceopen', () => {
                if (done) return;
                try {
                    const buffer = mediaSource.addSourceBuffer('audio/mp4; codecs="mp4a.40.2"');
                    buffer.addEventListener('error', () => finish('Ошибка SourceBuffer AAC'));
                    buffer.addEventListener('updateend', () => {
                        if (!done && mediaSource.readyState === 'open') {
                            try { mediaSource.endOfStream(); } catch (error) { finish(error.message); }
                        }
                    });
                    xhr = new XMLHttpRequest(); xhr.open('GET', '/lsptube/aac-test-fragmented.mp4');
                    xhr.responseType = 'arraybuffer'; xhr.timeout = 10000;
                    xhr.onload = () => {
                        if (done) return;
                        if (xhr.status !== 200) { finish('Файл AAC: HTTP ' + xhr.status); return; }
                        try { buffer.appendBuffer(xhr.response); } catch (error) { finish(error.message); }
                    };
                    xhr.onerror = xhr.ontimeout = () => finish('Не удалось получить тестовый файл AAC'); xhr.send();
                } catch (error) { finish(error.message); }
            });
            audio.src = objectUrl;
        } else audio.src = '/lsptube/aac-test.mp4';
        audio.load();
        if (done) return;
        Promise.resolve(audio.play()).catch(error => { if (!done) finish('Не удалось запустить AAC: ' + error.message); });
        if (paused) Promise.resolve(video.play()).catch(error => { if (!done) finish('Не удалось продолжить YouTube: ' + error.message); });
        showTranslationProgress(label + ' · ожидается ровный сигнал, 20 секунд');
    } catch (error) { finish(error.message); }
}
window.addEventListener('pagehide', () => { if (stopPrevious) stopPrevious(); });
