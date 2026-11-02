import {createAacTranslation} from './aacTranslationController.js';
import {readAacVoice} from './aacRemux.js';
import {startSinglePlayerVoice, stopSinglePlayerVoice, singlePlayerVoiceDetails} from './singlePlayerTest.js';
import { configRead } from '../config.js';
import showTranslationProgress from '../ui/translationProgress.js';
import { createTranslationController } from './translationController.js';
import { showToast } from '../ui/ytUI.js';
import showTranslationDiagnostics from '../ui/translationDiagnostics.js';
import { createPcmAudio } from './pcmAudio.js';
let audioContext, progressTimer, progressRequest;
function clearProgressRequest() {
    clearInterval(progressTimer);
    if (progressRequest) { progressRequest.onload = null; progressRequest.abort(); progressRequest = null; }
}

const translation = createTranslationController({
    options() { return {original: Number(configRead('translationOriginalVolume')), voice: Number(configRead('translationVoiceVolume')),
        pause: configRead('translationPauseUntilReady')}; },
    progress(message) { if (!message) clearProgressRequest(); showTranslationProgress(message); },
    current() {
        const player = document.querySelector('.html5-video-player');
        const video = (player && player.querySelector('video')) || document.querySelector('video');
        const data = player && player.getVideoData ? player.getVideoData() : null;
        return video && data ? { video, player, id: data.video_id, live: data.isLive || data.isLiveContent } : null;
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
    createAudio(position) {
        if (!audioContext) {
            const Context = window.AudioContext || window.webkitAudioContext;
            if (!Context) throw new Error('Web Audio не поддерживается');
            audioContext = new Context();
        }
        const audio = createPcmAudio(audioContext, position);
        audio.addEventListener('loadstart', () => {
            clearProgressRequest();
            const update = () => {
                if (progressRequest || !audio.src) return;
                const xhr = progressRequest = new XMLHttpRequest();
                xhr.open('GET', audio.src.replace('/lsptube/pcm?', '/lsptube/pcm-status?'));
                xhr.setRequestHeader('X-LSPTube', '1'); xhr.timeout = 3000;
                xhr.onload = () => {
                    progressRequest = null;
                    if (xhr.status !== 200) return;
                    try { const state = JSON.parse(xhr.responseText);
                        const message = state.stage + (state.percent === null ? '…' : ': ' + state.percent + '%');
                        audio.progress = message;
                        showTranslationProgress(message);
                    } catch (_) {}
                };
                xhr.onerror = xhr.ontimeout = () => { progressRequest = null; };
                xhr.send();
            };
            progressTimer = setInterval(update, 200); update();
        });
        audio.addEventListener('loadedmetadata', () => {
            clearProgressRequest();
            audio.progress = 'Звук загружен: 100%';
            showTranslationProgress(audio.progress);
        });
        return audio;
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
    notify(message) { showToast('LSPTube 0.8.0 · Яндекс Перевод', message); }
});
window.addEventListener('pagehide', () => translation.stop());
export default translation;

// The confirmed PCM path stays available while native AAC is calibrated on Freestyle.
export const aacTranslation = createAacTranslation({
    current() {
        const player = document.querySelector('.html5-video-player');
        const video = player && player.querySelector('video'), data = player && player.getVideoData && player.getVideoData();
        return video && data ? {player, video, id: data.video_id, live: data.isLive || data.isLiveContent} : null;
    },
    options: () => ({voice: Number(configRead('translationVoiceVolume')), pause: configRead('translationPauseUntilReady')}),
    request(path, binary) {
        const xhr = new XMLHttpRequest();
        const promise = new Promise((resolve, reject) => {
            xhr.open('GET', path); xhr.setRequestHeader('X-LSPTube', '1'); xhr.timeout = binary ? 120000 : 45000;
            if (binary) xhr.responseType = 'arraybuffer';
            xhr.onload = () => {
                try {
                    if (xhr.status !== 200) {
                        const message = binary ? 'Не удалось загрузить AAC: HTTP ' + xhr.status : (JSON.parse(xhr.responseText).error || 'Ошибка AAC');
                        throw new Error(message);
                    }
                    resolve(binary ? xhr.response : JSON.parse(xhr.responseText));
                } catch (error) { reject(error); }
            };
            xhr.onerror = xhr.ontimeout = () => reject(new Error('Служба AAC не ответила'));
            xhr.onabort = () => reject(new Error('Запрос отменён')); xhr.send();
        });
        return {promise, cancel: () => xhr.abort()};
    },
    reload(id, position, paused) {
        const mappings = Object.values(window._yttv || {}).find(value => value && value.mappings);
        const service = mappings && mappings.get('PlayerService');
        const player = document.querySelector('.html5-video-player');
        if (!service || !service.loadedPlaybackConfig || !service.loadVideo || !player || typeof player.stopVideo !== 'function') {
            throw new Error('Не найден способ перезапустить текущий ролик');
        }
        const config = JSON.parse(JSON.stringify(service.loadedPlaybackConfig));
        if (!config.watchEndpoint || config.watchEndpoint.videoId !== id) throw new Error('Конфигурация текущего ролика изменилась');
        config.watchEndpoint.startTimeSeconds = Math.floor(position);
        player.stopVideo(); service.loadVideo(config);
        if (paused && player.pauseVideo) player.pauseVideo();
    },
    readVoice: readAacVoice, startAudio: startSinglePlayerVoice, stopAudio: stopSinglePlayerVoice, audioDetails: singlePlayerVoiceDetails,
    progress: showTranslationProgress, diagnose: showTranslationDiagnostics,
    notify: message => showToast('LSPTube · Яндекс Перевод', message)
});
window.addEventListener('pagehide', () => aacTranslation.stop(false));
