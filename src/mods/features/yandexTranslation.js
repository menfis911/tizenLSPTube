import { createTranslationController } from './translationController.js';
import { showToast } from '../ui/ytUI.js';
import showTranslationDiagnostics from '../ui/translationDiagnostics.js';

const translation = createTranslationController({
    current() {
        const player = document.querySelector('.html5-video-player');
        const video = (player && player.querySelector('video')) || document.querySelector('video');
        const data = player && player.getVideoData ? player.getVideoData() : null;
        return video && data ? { video, id: data.video_id, live: data.isLive || data.isLiveContent } : null;
    },
    request(id, duration) {
        const xhr = new XMLHttpRequest();
        const promise = new Promise((resolve, reject) => {
            xhr.open('GET', '/lsptube/vot?id=' + encodeURIComponent(id) + '&duration=' + Math.ceil(duration) + '&lang=en');
            xhr.setRequestHeader('X-LSPTube', '1'); xhr.timeout = 45000;
            xhr.onload = () => {
                try { const data = JSON.parse(xhr.responseText);
                    if (xhr.status !== 200) throw new Error(data.error || 'Ошибка перевода'); resolve(data);
                } catch (error) { reject(error); }
            };
            xhr.onerror = xhr.ontimeout = () => reject(new Error('Служба перевода не ответила'));
            xhr.onabort = () => reject(new Error('Запрос отменён'));
            xhr.send();
        });
        return { promise, cancel: () => xhr.abort() };
    },
    createAudio() {
        const audio = document.createElement('audio');
        if (typeof audio.play !== 'function') throw new Error('Аудиоплеер не поддерживается');
        audio.setAttribute('aria-hidden', 'true'); audio.preload = 'auto'; audio.volume = 1;
        document.body.appendChild(audio); return audio;
    },
    diagnose(message, details) {
        try {
            const player = document.querySelector('.html5-video-player');
            const state = player && player.getPlayerStateObject ? player.getPlayerStateObject() : null;
            details += '\nYouTube isPlaying: ' + (state ? state.isPlaying : 'нет данных') +
                '; видеоэлементов: ' + document.querySelectorAll('video').length;
        } catch (_) {}
        showTranslationDiagnostics(message, details);
    },
    notify(message) { showToast('LSPTube 0.4.3 · Яндекс Перевод', message); }
});
window.addEventListener('pagehide', () => translation.stop());
export default translation;
