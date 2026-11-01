import crypto from 'crypto';
import MPEGDecoder from './node_modules/mpg123-decoder/src/MPEGDecoder.js';
const https = require('./compat-https.js');
export const PCM_RATE = 48000;
export const PCM_SECONDS = 10;

function download(url) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        let size = 0, done = false; const chunks = [];
        const timer = setTimeout(() => finish(new Error('Не удалось скачать перевод за 45 секунд')), 45000);
        function finish(error, data) {
            if (done) return; done = true; clearTimeout(timer);
            if (error) { req.abort(); reject(error); } else resolve(data);
        }
        const req = https.request({hostname: parsed.hostname, port: 443, path: parsed.pathname + parsed.search,
            method: 'GET', rejectUnauthorized: true}, res => {
            if (res.statusCode !== 200) { finish(new Error('Аудио Яндекса: HTTP ' + res.statusCode)); return; }
            res.on('data', chunk => {
                size += chunk.length;
                if (size > 64 * 1024 * 1024) finish(new Error('Аудио перевода превышает лимит 64 МиБ'));
                else chunks.push(chunk);
            });
            res.on('error', finish);
            res.on('end', () => finish(null, Buffer.concat(chunks)));
        });
        req.on('error', finish); req.end();
    });
}

export function createPcmStore(load = download, Decoder = MPEGDecoder) {
    let active;
    function clear(entry) {
        clearTimeout(entry.idle);
        entry.data = null; entry.block = null; entry.cache.clear(); entry.prepared = null;
        if (entry.decoder) { try { entry.decoder.free(); } catch (_) {} entry.decoder = null; }
    }
    async function read(entry, index) {
        if (entry !== active) throw new Error('Ролик изменился');
        clearTimeout(entry.idle);
        if (entry.cache.has(index)) return entry.cache.get(index);
        if (!entry.prepared) entry.prepared = (async () => {
            const data = await load(entry.url);
            if (entry !== active) throw new Error('Ролик изменился');
            entry.data = data; entry.offset = 0; entry.samples = 0; entry.next = 0;
            entry.decoder = new Decoder(); await entry.decoder.ready;
        })();
        await entry.prepared;
        if (index < entry.next) {
            // shortcut: distant backward seeks re-decode the prefix; add a frame index if hardware seeks are too slow.
            await entry.decoder.reset(); entry.offset = 0; entry.samples = 0; entry.block = null;
        }
        const start = index * PCM_SECONDS * PCM_RATE, end = start + PCM_SECONDS * PCM_RATE;
        const output = new Float32Array(end - start); let written = 0, batches = 0;
        while (written < output.length) {
            if (entry !== active) throw new Error('Ролик изменился');
            if (++batches % 8 === 0) await new Promise(resolve => setImmediate(resolve));
            if (!entry.block) {
                if (entry.offset >= entry.data.length) break;
                const decoded = entry.decoder.decode(entry.data.subarray(entry.offset, entry.offset + 4096));
                entry.offset += 4096;
                if (!decoded.samplesDecoded) continue;
                if (!decoded.sampleRate || !decoded.channelData.length) throw new Error('MP3-декодер не вернул звук');
                entry.block = { ...decoded, from: entry.samples };
                entry.samples += decoded.samplesDecoded;
            }
            const block = entry.block, from = Math.max(start + written, Math.ceil(block.from * PCM_RATE / block.sampleRate));
            const to = Math.min(end, Math.ceil((block.from + block.samplesDecoded) * PCM_RATE / block.sampleRate));
            for (let frame = from; frame < to; frame++) {
                const position = frame * block.sampleRate / PCM_RATE - block.from;
                const lo = Math.max(0, Math.floor(position)), hi = Math.min(lo + 1, block.samplesDecoded - 1);
                let sample = 0;
                for (const channel of block.channelData) sample += channel[lo] + (channel[hi] - channel[lo]) * (position - lo);
                output[frame - start] = sample / block.channelData.length;
            }
            written = Math.max(written, to - start);
            if (to >= end) break;
            entry.block = null;
        }
        if (!written && index === 0) throw new Error('Не удалось декодировать MP3 перевода');
        const result = {start: index * PCM_SECONDS, frames: written, sampleRate: PCM_RATE,
            data: Buffer.from(output.buffer, 0, written * 4), ended: written < output.length};
        entry.next = index + 1; entry.cache.set(index, result);
        while (entry.cache.size > 3) entry.cache.delete(entry.cache.keys().next().value);
        return result;
    }
    return {
        register(url, id, partial) {
            if (active && active.id === id && active.partial === partial) { active.url = url; return active.token; }
            if (active) {
                const old = active;
                clearTimeout(old.idle);
                old.queue.then(() => clear(old), () => clear(old));
            }
            active = {url, id, partial, token: crypto.randomBytes(16).toString('hex'), cache: new Map(), queue: Promise.resolve()};
            return active.token;
        },
        read(token, index) {
            const entry = active;
            if (!entry || entry.token !== token) return Promise.reject(new Error('Сеанс аудио завершён. Включите перевод снова'));
            const job = entry.queue.then(() => read(entry, index)).catch(error => { clear(entry); throw error; });
            entry.queue = job.catch(() => {});
            return job.finally(() => {
                clearTimeout(entry.idle);
                entry.idle = setTimeout(() => clear(entry), 120000);
                if (entry.idle.unref) entry.idle.unref();
            });
        }
    };
}
