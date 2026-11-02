const LIMIT = 64 * 1024 * 1024, RATE = 44100;
const yieldTask = () => new Promise(resolve => setImmediate(resolve));

// Encode on the projector, without a second playback clock or external server.
export async function encodeVoice(read, volume, progress, alive = () => true) {
    const LibAV = require('./libav/libav-4.8.6.0.1-obsolete.js');
    const lib = await LibAV.LibAV({noworker: true, nothreads: true, nosimd: true});
    let context, frame, packet;
    try {
        let frameSize;
        [, context, frame, packet, frameSize] = await lib.ff_init_encoder('aac', {ctx: {
            sample_rate: RATE, sample_fmt: lib.AV_SAMPLE_FMT_FLTP, channel_layout: 3, bit_rate: 96000}});
        if (frameSize !== 1024) throw new Error('Неподдерживаемый размер кадра AAC');
        const frames = []; let total = 16, pending = new Float32Array(0), timestamp = 0;
        function save(packets) {
            for (const value of packets) {
                if (value.ptshi < 0 || value.pts < 0) continue; // Discard encoder priming, retain sample zero.
                const data = Buffer.from(value.data);
                total += data.length + 4;
                if (total > LIMIT) throw new Error('AAC-перевод превышает 64 МиБ');
                frames.push(data);
            }
        }
        async function feed(data, final = false) {
            const all = new Float32Array(pending.length + data.length);
            all.set(pending); all.set(data, pending.length);
            let offset = 0;
            while (offset + frameSize <= all.length) {
                if (!alive()) throw new Error('Подготовка AAC отменена');
                const batch = [];
                for (let count = 0; count < 32 && offset + frameSize <= all.length; count++) {
                    const samples = all.slice(offset, offset + frameSize); offset += frameSize;
                    batch.push({data: [samples, samples], format: lib.AV_SAMPLE_FMT_FLTP,
                        channel_layout: 3, sample_rate: RATE, pts: timestamp}); timestamp += frameSize;
                }
                save(await lib.ff_encode_multi(context, frame, packet, batch, false));
                await yieldTask();
            }
            pending = all.slice(offset);
            if (final) save(await lib.ff_encode_multi(context, frame, packet, [], true));
        }
        for (let index = 0; index < 1440; index++) {
            if (!alive()) throw new Error('Подготовка AAC отменена');
            const part = await read(index);
            const source = new Float32Array(part.data.buffer, part.data.byteOffset, part.frames);
            const count = Math.ceil(part.frames * RATE / part.sampleRate), samples = new Float32Array(count);
            for (let i = 0; i < count; i++) {
                const pos = i * part.sampleRate / RATE, lo = Math.min(Math.floor(pos), source.length - 1), hi = Math.min(lo + 1, source.length - 1);
                samples[i] = Math.max(-1, Math.min(1, (source[lo] + (source[hi] - source[lo]) * (pos - lo)) * volume / 100));
            }
            await feed(samples); progress(index * 10 + part.frames / part.sampleRate);
            if (part.ended) break;
            if (index === 1439) throw new Error('Слишком длинная дорожка AAC');
        }
        // End on independently decodable silence; never loop the last spoken syllable.
        await feed(new Float32Array(10240 + (1024 - pending.length) % 1024), true);
        if (frames.length < 10) throw new Error('Пустая дорожка AAC');
        const header = Buffer.alloc(16 + frames.length * 4);
        header.write('LSPA'); header.writeUInt32LE(RATE, 4); header.writeUInt32LE(2, 8); header.writeUInt32LE(frames.length, 12);
        frames.forEach((data, index) => header.writeUInt32LE(data.length, 16 + index * 4));
        return Buffer.concat([header, ...frames]);
    } finally {
        if (context) await lib.ff_free_encoder(context, frame, packet);
        lib.terminate();
    }
}

export function createAacStore(pcm, encode = encodeVoice) {
    let active;
    return {
        prepare(token, volume, duration) {
            if (active && active.token === token && active.volume === volume) return this.status(token);
            const previous = active;
            if (previous) { previous.cancelled = true; clearTimeout(previous.idle); }
            const entry = active = {token, volume, stage: 'Загрузка звука', percent: null};
            entry.promise = Promise.resolve(previous && previous.promise).then(() => {
                if (active !== entry || entry.cancelled) throw new Error('Подготовка AAC отменена');
                return encode(index => pcm.read(token, index), volume, seconds => {
                    entry.stage = 'Подготовка AAC'; entry.percent = Math.min(99, Math.floor(seconds * 100 / duration));
                }, () => active === entry && !entry.cancelled);
            }).then(data => {
                entry.data = data; entry.stage = 'AAC готов'; entry.percent = 100;
            }, error => { entry.error = error.message; });
            entry.idle = setTimeout(() => { if (active === entry) { entry.cancelled = true; active = null; } }, 30 * 60 * 1000);
            if (entry.idle.unref) entry.idle.unref();
            return this.status(token);
        },
        status(token) {
            if (!active || active.token !== token) throw new Error('Сеанс AAC завершён');
            if (active.error) throw new Error(active.error);
            const state = active.percent === null ? pcm.status(token) : active;
            return {ready: !!active.data, stage: state.stage, percent: active.data ? 100 : state.percent};
        },
        data(token) {
            this.status(token);
            if (!active.data) throw new Error('AAC ещё не готов');
            clearTimeout(active.idle);
            active.idle = setTimeout(() => { if (active && active.token === token) active = null; }, 120000);
            if (active.idle.unref) active.idle.unref();
            return active.data;
        },
        cancel(token) { if (active && active.token === token) { active.cancelled = true; clearTimeout(active.idle); active = null; } }
    };
}
