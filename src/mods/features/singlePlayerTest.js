import {collectAacPacket, parseAacInit, readAacPreset, replaceAacFragments} from './aacRemux.js';
import showTranslationDiagnostics from '../ui/translationDiagnostics.js';
import showTranslationProgress from '../ui/translationProgress.js';
let active = null, hookError = '', timer;
const recentTypes = [], sources = new Map();
const aac = type => /^audio\/mp4\b.*mp4a\.40\.2\b/i.test(type || '');
function current() {
    const player = document.querySelector('.html5-video-player');
    const video = (player && player.querySelector('video')) || document.querySelector('video');
    const data = player && player.getVideoData ? player.getVideoData() : null;
    return {video, id: data && data.video_id};
}
function finish(message, report = true) {
    const s = active; if (!s) return;
    active = null; clearInterval(timer);
    for (const job of s.jobs) { try { job.abort(); } catch (_) {} }
    showTranslationProgress(null);
    if (s.mode === 'voice') {
        if (s.onStop) s.onStop(message);
        return;
    }
    if (!report) return;
    const now = current(), video = now.video;
    showTranslationDiagnostics('Проверка одного плеера', [message,
        'Это тестовый сигнал, не перевод. Для возврата оригинала откройте другой ролик.',
        'Подменено пакетов: ' + s.packets + '; AAC-кадров: ' + s.samples,
        'AAC: ' + (s.format || 'ещё не определён'),
        'YouTube продвинулся: ' + (s.videoStart === null || !video ? 'нет данных' : (video.currentTime - s.videoStart).toFixed(2) + ' с'),
        'Видео: paused=' + (video && video.paused) + '; readyState=' + (video && video.readyState) + '; error=' + (video && video.error ? video.error.code : 0),
        'Элементы video: ' + document.querySelectorAll('video').length + '; audio: ' + document.querySelectorAll('audio').length,
        'Наблюдаемые форматы: ' + recentTypes.join(', '),
        'Сообщите: был ли ровный сигнал и двигалась ли картинка одновременно.'
    ].join('\n'));
}
function transform(info, input) {
    const s = active, now = current();
    const eligible = s && s.ready && now.id && now.id !== s.fromId && now.video &&
        sources.get(now.video.currentSrc || now.video.src) === info.source && !(s.mode === 'voice' && info.source === s.blockedSource);
    if (aac(info.type)) {
        try { const init = parseAacInit(input); if (init) info.init = init; }
        catch (error) { if (eligible) throw error; }
    }
    if (!eligible) return input;
    if (s.targetId && s.targetId !== now.id) { finish('Ролик сменился'); return input; }
    if (!aac(info.type)) { finish('Выбран не AAC-LC: ' + info.type); return input; }
    if (!info.init) return input;
    const preset = s.presets[info.init.rate + '-' + info.init.channels];
    if (!preset) { finish(s.mode === 'voice' ? 'AAC-перевод пока поддерживает только 44,1 кГц / стерео' : 'Нет тестового AAC для этой конфигурации'); return input; }
    const result = replaceAacFragments(input, info.init, preset, s.origin);
    if (!result.sampleCount) return input;
    if (s.origin === null) s.origin = result.firstTime;
    if (!s.targetId) { s.targetId = now.id; s.firstPacketAt = Date.now(); }
    s.format = info.init.rate + ' Гц / ' + info.init.channels + ' канал(а)';
    s.packets++; s.samples += result.sampleCount;
    return result.bytes;
}
try {
    const Type = window.MediaSource;
    if (!Type || !Type.prototype.addSourceBuffer) hookError = 'MediaSource недоступен';
    else {
        const Url = window.URL;
        if (!Url || !Url.createObjectURL) throw new Error('Нет createObjectURL');
        const create = Url.createObjectURL;
        const createWrapped = function(source) {
            const url = create.apply(this, arguments);
            if (source && typeof source.addSourceBuffer === 'function') {
                const remember = () => { sources.set(url, source); while (sources.size > 4) sources.delete(sources.keys().next().value); };
                remember();
                if (source.addEventListener) {
                    source.addEventListener('sourceclose', () => sources.delete(url));
                    source.addEventListener('sourceopen', remember);
                }
            }
            return url;
        };
        Url.createObjectURL = createWrapped;
        if (Url.createObjectURL !== createWrapped) throw new Error('createObjectURL нельзя перехватить');
        const add = Type.prototype.addSourceBuffer;
        const wrapped = function(type) {
            const buffer = add.apply(this, arguments);
            if (!recentTypes.includes(type)) { recentTypes.push(type); if (recentTypes.length > 8) recentTypes.shift(); }
            if (!/^audio\//i.test(type)) return buffer;
            const append = buffer.appendBuffer, info = {type, init: null, source: this};
            const abort = buffer.abort;
            if (abort) buffer.abort = function() {
                const result = abort.apply(this, arguments);
                info.pending = null; // A seek discards partial native segments too.
                return result;
            };
            const wrappedAppend = function(input) {
                let data = input;
                try {
                    const now = current();
                    const replacing = active && active.ready && now.id && now.id !== active.fromId &&
                        now.video && sources.get(now.video.currentSrc || now.video.src) === info.source && aac(info.type) &&
                        !(active.mode === 'voice' && info.source === active.blockedSource);
                    if (replacing || info.pending) {
                        if (replacing) {
                            data = collectAacPacket(info, input);
                            if (data === null) data = new Uint8Array(0);
                        } else {
                            const pending = info.pending; info.pending = null;
                            data = new Uint8Array(pending.length + input.byteLength);
                            data.set(pending); data.set(ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : new Uint8Array(input), pending.length);
                        }
                    }
                    data = transform(info, data);
                }
                catch (error) {
                    if (info.pending) { data = info.pending; info.pending = null; }
                    const id = current().id;
                    if (active && active.ready && id && id !== active.fromId) finish('Подмена не выполнена: ' + error.message);
                }
                try { return append.call(this, data); }
                catch (error) { if (active) finish('SourceBuffer: ' + error.message); throw error; }
            };
            try {
                buffer.appendBuffer = wrappedAppend;
                if (buffer.appendBuffer !== wrappedAppend) hookError = 'appendBuffer нельзя перехватить';
            } catch (error) { hookError = 'appendBuffer: ' + error.message; }
            return buffer;
        };
        Type.prototype.addSourceBuffer = wrapped;
        if (Type.prototype.addSourceBuffer !== wrapped) hookError = 'addSourceBuffer нельзя перехватить';
    }
} catch (error) { hookError = error.message; }

export function preferAacForSinglePlayerTest(response) {
    if (!active) return;
    const formats = response && response.streamingData && response.streamingData.adaptiveFormats;
    if (Array.isArray(formats) && formats.some(format => format && aac(format.mimeType))) {
        response.streamingData.adaptiveFormats = formats.filter(format => !format ||
            typeof format.mimeType !== 'string' || !format.mimeType.startsWith('audio/') ||
            (aac(format.mimeType) && (active.mode !== 'voice' ||
                ((!format.audioSampleRate || Number(format.audioSampleRate) === 44100) && (!format.audioChannels || format.audioChannels === 2)))));
    }
}
export default async function startSinglePlayerTest() {
    if (active) { finish('Проверка отменена'); return; }
    if (hookError) { showTranslationDiagnostics('Проверка одного плеера', hookError); return; }
    const now = current();
    if (!now.id || !now.video) { showTranslationDiagnostics('Проверка одного плеера', 'Сначала откройте обычный ролик.'); return; }
    const s = active = {fromId: now.id, targetId: null, ready: false, presets: {}, jobs: [], origin: null,
        packets: 0, samples: 0, videoStart: null, previousTime: null, watchAt: null, firstPacketAt: null, createdAt: Date.now()};
    showTranslationProgress('Подготавливаем проверку одного плеера…');
    try {
        await Promise.all([44100, 48000].flatMap(rate => [1, 2].map(channels => new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest(); s.jobs.push(xhr);
            xhr.open('GET', '/lsptube/aac-replace-' + rate + '-' + channels + '.mp4');
            xhr.responseType = 'arraybuffer'; xhr.timeout = 10000;
            xhr.onload = () => {
                if (active !== s) { resolve(); return; }
                if (xhr.status !== 200) { reject(new Error('Тестовый AAC: HTTP ' + xhr.status)); return; }
                try { s.presets[rate + '-' + channels] = readAacPreset(xhr.response); resolve(); } catch (error) { reject(error); }
            };
            xhr.onerror = xhr.ontimeout = () => reject(new Error('Не удалось загрузить тестовый AAC'));
            xhr.onabort = () => reject(new Error('Проверка отменена')); xhr.send();
        }))));
        if (active !== s) return;
        s.ready = true; showTranslationProgress('Готово. Откройте ДРУГОЙ ролик — оригинал заменится тестовым сигналом.');
        timer = setInterval(() => {
            if (active !== s) return;
            const now = current(), time = Date.now(), video = now.video;
            if (hookError) { finish(hookError); return; }
            if (s.targetId && now.id !== s.targetId) { finish('Ролик сменился'); return; }
            if (video && video.error) { finish('Ошибка основного видеоплеера: ' + video.error.code); return; }
            if (s.targetId && video) {
                if (s.watchAt === null && !video.paused && video.readyState >= 3 && s.previousTime !== null &&
                    video.currentTime > s.previousTime && video.currentTime - s.previousTime < 2) {
                    s.watchAt = time; s.videoStart = s.previousTime;
                }
                s.previousTime = video.currentTime;
                if (s.watchAt !== null) {
                    showTranslationProgress('Один плеер: ' + Math.min(15, Math.floor((time - s.watchAt) / 1000)) + ' / 15 с');
                    if (time - s.watchAt >= 15000) finish('Наблюдение завершено. Оцените на слух сигнал и движение картинки.');
                } else if (time - s.firstPacketAt > 20000) finish('Пакеты заменены, но движение видео не подтверждено');
            }
            if (time - s.createdAt >= 90000) finish('Тайм-аут: проверка не завершилась за 90 секунд');
        }, 500);
    } catch (error) { if (active === s) finish(error.message); }
}
export function cancelSinglePlayerTest() { finish('Проверка отменена', false); }
window.addEventListener('pagehide', () => {
    if (active && active.mode === 'voice') active.onStop = null;
    cancelSinglePlayerTest();
});


export function startSinglePlayerVoice(preset, id, onStop) {
    if (hookError) throw new Error(hookError);
    if (active) finish('Проверка остановлена', false);
    const now = current();
    active = {mode: 'voice', ready: true, fromId: null, targetId: id,
        blockedSource: now.video && sources.get(now.video.currentSrc || now.video.src),
        presets: {'44100-2': preset}, origin: 0, jobs: [], packets: 0, samples: 0, onStop};
}
export function singlePlayerVoiceDetails() {
    return active && active.mode === 'voice' ? {packets: active.packets, samples: active.samples, format: active.format || 'ожидание AAC'} : null;
}
export function stopSinglePlayerVoice() { if (active && active.mode === 'voice') finish('Перевод выключен', false); }
