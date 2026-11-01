// Protocol and protobuf definitions: FOSWLY/vot.js (MIT), pinned in vendor/README.md.
import crypto from 'crypto';
import config from './vendor/config.ts';
import { YandexSessionRequest, YandexSessionResponse, VideoTranslationRequest,
    VideoTranslationResponse, VideoTranslationAudioRequest } from './vendor/yandex.ts';

export function createClient(request) {
    let session, sessionPromise;
    const sign = body => crypto.createHmac('sha256', config.hmac).update(body).digest('hex');
    const headers = { 'User-Agent': config.userAgent, Accept: 'application/x-protobuf',
        'Content-Type': 'application/x-protobuf', 'Cache-Control': 'no-cache' };
    async function getSession() {
        if (session && session.until > Date.now()) return session;
        if (!sessionPromise) sessionPromise = (async () => {
            const uuid = crypto.randomBytes(16).toString('hex').toUpperCase();
            const body = YandexSessionRequest.encode({ uuid, module: 'video-translation' }).finish();
            const data = YandexSessionResponse.decode(await request('/session/create', body,
                { ...headers, 'Vtrans-Signature': sign(body) }));
            if (!data.secretKey || data.expires <= 0) throw new Error('Яндекс не создал сеанс перевода');
            session = { uuid, secretKey: data.secretKey, until: Date.now() + data.expires * 1000 - 1000 };
            return session;
        })().finally(() => { sessionPromise = null; });
        return sessionPromise;
    }
    async function signed(path, body, method) {
        const s = await getSession();
        const token = s.uuid + ':' + path + ':' + config.componentVersion;
        return request(path, body, { ...headers, 'Vtrans-Signature': sign(body),
            'Sec-Vtrans-Sk': s.secretKey, 'Sec-Vtrans-Token': sign(token) + ':' + token }, method);
    }
    return async function translate(id, duration, language) {
        const url = 'https://youtu.be/' + id;
        const body = VideoTranslationRequest.encode({ url, duration, language,
            firstRequest: true, unknown0: true, forceSourceLang: false, unknown1: false,
            translationHelp: [], wasStream: false, responseLanguage: 'ru', unknown2: true,
            configVersion: 2, bypassCache: false, useLivelyVoice: false, videoTitle: '' }).finish();
        let result = VideoTranslationResponse.decode(await signed('/video-translation/translate', body));
        if (result.status === 6) {
            // Yandex's fallback lets its server obtain audio when the client cannot upload it.
            await request('/video-translation/fail-audio-js', Buffer.from(JSON.stringify({ video_url: url })),
                { ...headers, Accept: 'application/json', 'Content-Type': 'application/json' }, 'PUT');
            const audio = VideoTranslationAudioRequest.encode({ translationId: result.translationId, url,
                audioInfo: { audioFile: new Uint8Array(0), fileId: 'fallback-empty-audio:video-translation:' + id } }).finish();
            await signed('/video-translation/audio', audio, 'PUT');
            result = VideoTranslationResponse.decode(await signed('/video-translation/translate', body));
        }
        if (result.status === 7) { session = null; throw new Error('Яндекс требует входа в аккаунт. Этот режим пока не поддерживается'); }
        if (![1, 2, 3, 5, 6].includes(result.status)) throw new Error('Яндекс не смог перевести это видео');
        if (result.status === 1 || result.status === 5) {
            const audio = new URL(result.url || '');
            if (audio.protocol !== 'https:' || audio.username || audio.password || audio.port ||
                !/(^|\.)(yandex\.(ru|net|com)|yandexcloud\.net)$/.test(audio.hostname)) {
                throw new Error('Яндекс вернул неизвестный адрес аудио');
            }
        }
        return { status: result.status, url: result.url || null,
            retryAfter: Math.max(5, Math.min(60, result.remainingTime || 10)), partial: result.status === 5 };
    };
}
