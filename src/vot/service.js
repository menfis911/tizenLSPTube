import { createClient } from './client.js';
export { createClient } from './client.js';
import { createPcmStore } from './pcm.js';
export { createPcmStore } from './pcm.js';
const https = require('./compat-https.js');

function request(path, body, headers, method = 'POST') {
    return new Promise((resolve, reject) => {
        let finished = false;
        const timer = setTimeout(() => finish(new Error('Яндекс не ответил за 30 секунд')), 30000);
        function finish(error, data) {
            if (finished) return;
            finished = true; clearTimeout(timer);
            if (error) { req.abort(); reject(error); } else resolve(data);
        }
        const req = https.request({ hostname: 'api.browser.yandex.ru', port: 443, path, method,
            headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }, rejectUnauthorized: true }, res => {
            let size = 0; const chunks = [];
            res.on('data', chunk => { size += chunk.length;
                if (size > 1024 * 1024) finish(new Error('Слишком большой ответ Яндекса')); else chunks.push(chunk); });
            res.on('error', finish);
            res.on('end', () => {
                if (res.statusCode === 200) { finish(null, Buffer.concat(chunks)); return; }
                const stage = {
                    '/session/create': 'создание сеанса',
                    '/video-translation/translate': 'запрос перевода',
                    '/video-translation/fail-audio-js': 'получение исходного аудио',
                    '/video-translation/audio': 'подготовка аудио'
                }[path] || 'запрос';
                const error = new Error('Яндекс: HTTP ' + res.statusCode + ' · ' + stage);
                error.status = res.statusCode;
                finish(error);
            });
        });
        req.on('error', finish);
        req.end(Buffer.from(body));
    });
}

export function makeHandler(translate = createClient(request)) {
    const jobs = new Map();
    const pcm = createPcmStore();
    return function handle(req, res) {
        if (!req.url.startsWith('/lsptube/vot') && !req.url.startsWith('/lsptube/pcm')) return false;
        function send(code, data) {
            if (res.destroyed) return;
            res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify(data));
        }
        const url = new URL(req.url, 'https://www.youtube.com');
        if (url.pathname === '/lsptube/pcm') {
            const token = url.searchParams.get('token') || '', index = Number(url.searchParams.get('chunk'));
            if (req.method !== 'GET' || req.headers['x-lsptube'] !== '1' || !/^[a-f0-9]{32}$/.test(token) ||
                !Number.isInteger(index) || index < 0 || index >= 1440) {
                send(400, {error: 'Некорректный запрос аудио'}); return true;
            }
            pcm.read(token, index).then(part => {
                if (res.destroyed) return;
                res.writeHead(200, {'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store',
                    'X-LSP-Frames': String(part.frames), 'X-LSP-Rate': String(part.sampleRate),
                    'X-LSP-End': part.ended ? '1' : '0'});
                res.end(part.data);
            }, error => send(502, {error: error.message}));
            return true;
        }
        const id = url.searchParams.get('id'), duration = Number(url.searchParams.get('duration'));
        const language = url.searchParams.get('lang') || 'en';
        if (req.method !== 'GET' || req.headers['x-lsptube'] !== '1' || url.pathname !== '/lsptube/vot' ||
            !/^[a-zA-Z0-9_-]{11}$/.test(id || '') || !Number.isFinite(duration) || duration <= 0 || duration > 14400 ||
            !/^(en|de|fr|es|it|ja|ko|zh|pt|tr|uk|ru)$/.test(language)) {
            send(400, { error: 'Нужен обычный ролик YouTube длительностью до 4 часов' }); return true;
        }
        const key = id + ':' + duration + ':' + language;
        let job = jobs.get(key);
        for (const [k, value] of jobs) if (value.until < Date.now()) jobs.delete(k);
        if (!job || job.until < Date.now()) {
            if (jobs.size >= 4) { send(429, { error: 'Дождитесь предыдущего запроса перевода' }); return true; }
            job = { until: Date.now() + 35000 };
            job.promise = translate(id, duration, language).then(data => {
                job.until = Date.now() + Math.max(5000, data.retryAfter * 1000); return data;
            }).catch(error => { jobs.delete(key); throw error; });
            jobs.set(key, job);
        }
        job.promise.then(data => {
            const result = {...data};
            if (data.url) {
                const token = pcm.register(data.url, id, !!data.partial);
                result.url = '/lsptube/pcm?token=' + token;
            }
            send(200, result);
        }, error => send(502, { error: error.message }));
        return true;
    };
}
export const handle = makeHandler();
