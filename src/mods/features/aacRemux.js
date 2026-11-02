// AAC-only ISO BMFF prototype: retain native timing/configuration, replace compressed audio samples.
const LIMIT = 16 * 1024 * 1024;
function bytes(data) {
    const result = ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
    if (result.length > LIMIT) throw new Error('Аудиопакет превышает 16 МиБ');
    return result;
}
function check(data, offset, length, end = data.length) {
    if (!Number.isSafeInteger(offset) || offset < 0 || length < 0 || offset + length > end) throw new Error('Неполный MP4-пакет');
}
function u32(data, offset) { check(data, offset, 4); return new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(offset); }
function u64(data, offset) {
    const result = u32(data, offset) * 4294967296 + u32(data, offset + 4);
    if (!Number.isSafeInteger(result)) throw new Error('Слишком большая временная метка MP4');
    return result;
}
function boxes(data, start = 0, end = data.length) {
    const result = [];
    while (start < end) {
        check(data, start, 8, end);
        let size = u32(data, start), header = 8;
        if (size === 1) { check(data, start, 16, end); size = u64(data, start + 8); header = 16; }
        if (size === 0) size = end - start;
        if (size < header || start + size > end || result.length >= 4096) throw new Error('Некорректная структура MP4');
        const type = String.fromCharCode(...data.subarray(start + 4, start + 8));
        result.push({type, start, end: start + size, payload: start + header}); start += size;
    }
    return result;
}
// Keep split boxes and moof/mdat pairs together before rewriting their payloads.
export function collectAacPacket(state, input) {
    const incoming = bytes(input);
    let data = incoming;
    if (state.pending) {
        data = new Uint8Array(state.pending.length + incoming.length);
        data.set(state.pending); data.set(incoming, state.pending.length);
    }
    state.pending = data;
    if (data.length > LIMIT) throw new Error('Сборка MP4 превышает 16 МиБ');
    let offset = 0, awaitingData = false;
    while (offset < data.length) {
        if (data.length - offset < 8) return null;
        let size = u32(data, offset), header = 8;
        if (size === 1) {
            if (data.length - offset < 16) return null;
            size = u64(data, offset + 8); header = 16;
        }
        if (!size) size = data.length - offset;
        const type = String.fromCharCode(...data.subarray(offset + 4, offset + 8));
        if (size < header || size > LIMIT) throw new Error('Некорректный MP4: ' + type + ', размер ' + size + ', получено ' + (data.length - offset));
        if (offset + size > data.length) return null;
        if (type === 'moof') awaitingData = true;
        if (type === 'mdat') awaitingData = false;
        offset += size;
    }
    if (awaitingData) return null;
    state.pending = null;
    return data;
}
function children(data, box, skip = 0) { return boxes(data, box.payload + skip, box.end); }
function required(list, type) {
    const box = list.find(value => value.type === type);
    if (!box) throw new Error('Нет блока MP4 ' + type);
    return box;
}
function descriptor(data, start, end) {
    check(data, start, 2, end);
    const tag = data[start++]; let length = 0, count = 0, value;
    do { check(data, start, 1, end); value = data[start++]; length = length * 128 + (value & 127);
        if (++count > 4) throw new Error('Некорректный дескриптор AAC');
    } while (value & 128);
    check(data, start, length, end); return {tag, start, end: start + length};
}
function asc(data, esds) {
    let es = descriptor(data, esds.payload + 4, esds.end);
    if (es.tag !== 3) throw new Error('Нет описания AAC');
    check(data, es.start, 3, es.end);
    const flags = data[es.start + 2]; let position = es.start + 3;
    if (flags & 128) position += 2;
    if (flags & 64) { check(data, position, 1, es.end); position += 1 + data[position]; }
    if (flags & 32) position += 2;
    const config = descriptor(data, position, es.end);
    if (config.tag !== 4) throw new Error('Нет конфигурации AAC');
    const specific = descriptor(data, config.start + 13, config.end);
    if (specific.tag !== 5) throw new Error('Нет AudioSpecificConfig');
    check(data, specific.start, 2, specific.end);
    const first = data[specific.start], second = data[specific.start + 1];
    if ((first >> 3) !== 2 || (second & 4)) throw new Error('Проверка поддерживает только AAC-LC / 1024');
    const rates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
    return {rate: rates[((first & 7) << 1) | (second >> 7)], channels: (second >> 3) & 15};
}
export function parseAacInit(input) {
    const data = bytes(input), top = boxes(data), moov = top.find(box => box.type === 'moov');
    if (!moov) return null;
    const movie = children(data, moov), tracks = movie.filter(box => box.type === 'trak');
    if (tracks.length !== 1) throw new Error('Нужна отдельная аудиодорожка');
    const media = children(data, required(children(data, tracks[0]), 'mdia'));
    const mdhd = required(media, 'mdhd');
    const scaleOffset = mdhd.payload + (data[mdhd.payload] === 1 ? 20 : 12);
    check(data, scaleOffset, 4, mdhd.end); const timeScale = u32(data, scaleOffset);
    const table = children(data, required(children(data, required(media, 'minf')), 'stbl'));
    const stsd = required(table, 'stsd'), entry = required(children(data, stsd, 8), 'mp4a');
    const config = asc(data, required(children(data, entry, 28), 'esds'));
    if (!timeScale || ![44100, 48000].includes(config.rate) || ![1, 2].includes(config.channels)) throw new Error('Неподдерживаемая частота или число каналов AAC');
    const trex = required(children(data, required(movie, 'mvex')), 'trex');
    check(data, trex.payload, 24, trex.end);
    return {...config, timeScale, trackId: u32(data, trex.payload + 4),
        defaultDuration: u32(data, trex.payload + 12), defaultSize: u32(data, trex.payload + 16)};
}
function fragment(data, moof, init) {
    const movie = children(data, moof), trafs = movie.filter(box => box.type === 'traf');
    if (trafs.length !== 1) throw new Error('Нужен один AAC-трек во фрагменте');
    const track = children(data, trafs[0]);
    if (track.some(box => ['senc', 'saiz', 'saio'].includes(box.type))) throw new Error('Защищённый трек не заменяется');
    const tfhd = required(track, 'tfhd'), flags = u32(data, tfhd.payload) & 0xffffff;
    check(data, tfhd.payload, 8, tfhd.end);
    const trackId = u32(data, tfhd.payload + 4); let position = tfhd.payload + 8, base = moof.start;
    if (trackId !== init.trackId) throw new Error('Изменился ID аудиотрека');
    if (flags & 1) { check(data, position, 8, tfhd.end); base = u64(data, position); position += 8; }
    if (flags & 2) position += 4;
    let duration = init.defaultDuration, size = init.defaultSize;
    if (flags & 8) { check(data, position, 4, tfhd.end); duration = u32(data, position); position += 4; }
    if (flags & 16) { check(data, position, 4, tfhd.end); size = u32(data, position); position += 4; }
    const tfdt = required(track, 'tfdt'), version = data[tfdt.payload];
    if (version > 1) throw new Error('Неизвестная версия tfdt');
    check(data, tfdt.payload, version ? 12 : 8, tfdt.end);
    const dts = version ? u64(data, tfdt.payload + 4) : u32(data, tfdt.payload + 4);
    const samples = []; let dataPosition = null;
    for (const run of track.filter(box => box.type === 'trun')) {
        check(data, run.payload, 8, run.end);
        const runFlags = u32(data, run.payload) & 0xffffff, count = u32(data, run.payload + 4);
        if (count > 20000 || samples.length + count > 20000) throw new Error('Слишком много AAC-кадров');
        position = run.payload + 8;
        if (runFlags & 1) { check(data, position, 4, run.end);
            const offset = new DataView(data.buffer, data.byteOffset, data.byteLength).getInt32(position);
            dataPosition = base + offset; position += 4;
        }
        if (runFlags & 4) position += 4;
        for (let i = 0; i < count; i++) {
            let sampleDuration = duration, sampleSize = size;
            if (runFlags & 256) { check(data, position, 4, run.end); sampleDuration = u32(data, position); position += 4; }
            if (runFlags & 512) { check(data, position, 4, run.end); sampleSize = u32(data, position); position += 4; }
            if (runFlags & 1024) position += 4;
            if (runFlags & 2048) { check(data, position, 4, run.end); if (u32(data, position)) throw new Error('AAC с ненулевым CTS не заменяется'); position += 4; }
            if (position > run.end || !sampleDuration || !sampleSize) throw new Error('Неполное описание AAC-кадра');
            samples.push({duration: sampleDuration, size: sampleSize, position: dataPosition});
            if (dataPosition !== null) dataPosition += sampleSize;
        }
    }
    const mfhd = required(movie, 'mfhd'); check(data, mfhd.payload, 8, mfhd.end);
    return {dts, trackId, sequence: u32(data, mfhd.payload + 4), samples};
}
function join(parts) {
    const length = parts.reduce((sum, value) => sum + value.length, 0);
    if (length > LIMIT) throw new Error('Результат MP4 превышает 16 МиБ');
    const result = new Uint8Array(length); let offset = 0;
    for (const part of parts) { result.set(part, offset); offset += part.length; } return result;
}
function box(type, ...parts) {
    const payload = join(parts), result = new Uint8Array(payload.length + 8);
    new DataView(result.buffer).setUint32(0, result.length);
    for (let i = 0; i < 4; i++) result[4 + i] = type.charCodeAt(i);
    result.set(payload, 8); return result;
}
function words(...values) { const result = new Uint8Array(values.length * 4), view = new DataView(result.buffer);
    values.forEach((value, index) => view.setUint32(index * 4, value)); return result; }
export function readAacPreset(input) {
    const data = bytes(input), init = parseAacInit(data), top = boxes(data);
    if (!init) throw new Error('Нет init тестового AAC');
    const frames = [];
    for (const moof of top.filter(value => value.type === 'moof')) {
        for (const sample of fragment(data, moof, init).samples) {
            if (sample.position === null) throw new Error('Нет смещения AAC-кадров');
            check(data, sample.position, sample.size);
            if (frames.length >= 20000) throw new Error('Слишком много тестовых AAC-кадров');
            if (!top.some(box => box.type === 'mdat' && sample.position >= box.payload && sample.position + sample.size <= box.end)) throw new Error('AAC-кадр вне mdat');
            frames.push(data.subarray(sample.position, sample.position + sample.size));
        }
    }
    if (frames.length < 10) throw new Error('Недостаточно тестовых AAC-кадров');
    return {...init, frames: frames.slice(2)};
}
export function replaceAacFragments(input, init, preset, origin = null) {
    if (init.rate !== preset.rate || init.channels !== preset.channels) throw new Error('Конфигурации AAC не совпали');
    const data = bytes(input), top = boxes(data), result = [];
    let sampleCount = 0, firstTime = null;
    for (const item of top) {
        if (item.type === 'ftyp' || item.type === 'moov') result.push(data.subarray(item.start, item.end));
        if (item.type !== 'moof') continue;
        const part = fragment(data, item, init), frames = [], durations = [];
        if (sampleCount + part.samples.length > 20000) throw new Error('Слишком много AAC-кадров в пакете');
        if (firstTime === null) firstTime = part.dts / init.timeScale;
        if (origin === null) origin = firstTime;
        let timestamp = part.dts;
        for (const sample of part.samples) {
            const index = Math.round((timestamp / init.timeScale - origin) * preset.rate / 1024);
            frames.push(preset.frames[((index % preset.frames.length) + preset.frames.length) % preset.frames.length]);
            durations.push(sample.duration); timestamp += sample.duration; sampleCount++;
        }
        const run = new Uint8Array(12 + frames.length * 8), runView = new DataView(run.buffer);
        runView.setUint32(0, 0x301); runView.setUint32(4, frames.length);
        durations.forEach((duration, index) => { runView.setUint32(12 + index * 8, duration); runView.setUint32(16 + index * 8, frames[index].length); });
        const moof = box('moof', box('mfhd', words(0, part.sequence)), box('traf',
            box('tfhd', words(0x020000, part.trackId)),
            box('tfdt', words(0x01000000, Math.floor(part.dts / 4294967296), part.dts % 4294967296)), box('trun', run)));
        new DataView(moof.buffer).setUint32(moof.length - run.length + 8, moof.length + 8);
        result.push(moof, box('mdat', join(frames)));
    }
    return {bytes: sampleCount ? join(result) : data, sampleCount, firstTime};
}
