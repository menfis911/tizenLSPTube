const fs = require('fs'), vm = require('vm'), assert = require('assert');
const {encodeVoice, createAacStore} = require('../packages/launcher/service/dist/vot.js');
const api = vm.createContext({Uint8Array, ArrayBuffer, DataView, Number, Math});
vm.runInContext(fs.readFileSync(__dirname + '/../src/mods/features/aacRemux.js', 'utf8').replace(/export function/g, 'function'), api);
(async () => {
    let read = 0, checked = 0;
    const binary = await encodeVoice(async index => {
        assert.equal(index, read++);
        const samples = new Float32Array(48000 * 2);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i * 2 * Math.PI * 440 / 48000) * .2;
        return {data: Buffer.from(samples.buffer), frames: samples.length, sampleRate: 48000, ended: true};
    }, 75, seconds => { checked++; assert(seconds > 0 && seconds <= 2); });
    assert.equal(read, 1); assert(checked > 10);
    const voice = api.readAacVoice(binary); assert.equal(voice.loop, false);
    assert.equal(voice.rate, 44100); assert.equal(voice.channels, 2);
    assert(voice.frames.length >= 90 && voice.frames.length < 105);
    assert(voice.frames[voice.frames.length - 1].length < 30, 'the terminal frame must be silence, not looped speech');
    assert.throws(() => api.readAacVoice(binary.subarray(0, binary.length - 1)), /AAC/);
    const malformed = Buffer.from(binary); malformed.writeUInt32LE(0xffffffff, 12);
    assert.throws(() => api.readAacVoice(malformed), /AAC/);
    await assert.rejects(encodeVoice(async () => {throw new Error('must not read');}, 100, () => {}, () => false), /отменена/);
    let resolve, alive, encoded = 0;
    const pcm = {status: () => ({stage: 'Загрузка звука', percent: 50})};
    const store = createAacStore(pcm, (reader, volume, progress, active) => {
        encoded++; alive = active; progress(20); return new Promise(r => {resolve = r;});
    });
    assert.equal(store.prepare('first', 100, 100).percent, 50);
    await Promise.resolve(); assert.equal(store.status('first').percent, 20);
    store.prepare('first', 100, 100); assert.equal(encoded, 1, 'status polling must not restart encoding');
    resolve(binary); for (let i = 0; i < 5; i++) await Promise.resolve();
    assert(store.status('first').ready); assert.equal(store.data('first'), binary);
    store.cancel('first'); assert(!alive()); assert.throws(() => store.data('first'), /завершён/);
    store.prepare('second', 50, 100); await Promise.resolve(); assert.equal(encoded, 2);
    store.cancel('second'); resolve(binary); await Promise.resolve();
    assert.throws(() => store.status('second'), /завершён/);
    console.log('PASS: real Node/WASM AAC encoding, priming removal, terminal silence, bounded voice format, preparation cache and cancellation');
})().catch(error => {console.error(error); process.exitCode = 1;});
