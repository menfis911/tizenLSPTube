import { createTranslationController } from './translationController.js';
import { showToast } from '../ui/ytUI.js';

const translation = createTranslationController({
    current() {
        const player = document.querySelector('.html5-video-player');
        const video = document.querySelector('video');
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
        const audio = document.createElement('video');
        audio.setAttribute('aria-hidden', 'true'); audio.preload = 'auto';
        audio.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
        document.body.appendChild(audio); return audio;
    },
    notify(message) { showToast('LSPTube · Яндекс Перевод', message); }
});
window.addEventListener('pagehide', () => translation.stop());
export default translation;
