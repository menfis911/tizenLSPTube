const fs = require('fs'), vm = require('vm'), assert = require('assert');
const base = __dirname + '/../';
const core = fs.readFileSync(base + 'src/mods/features/aacRemux.js', 'utf8').replace(/export function/g, 'function');
const api = vm.createContext({Uint8Array, ArrayBuffer, DataView, Number, Math});
vm.runInContext(core, api);
function top(data) {
    const result = []; for (let pos = 0; pos < data.length;) {
        const size = data.readUInt32BE(pos); assert(size >= 8); result.push({type: data.toString('ascii', pos + 4, pos + 8), pos, size}); pos += size;
    } return result;
}
function timeline(data) {
    const moofs = top(data).filter(box => box.type === 'moof');
    return moofs.map(box => {
        const traf = top(data.subarray(box.pos + 8, box.pos + box.size)).find(value => value.type === 'traf');
        const start = box.pos + 8 + traf.pos + 8;
        const tfdt = top(data.subarray(start, box.pos + 8 + traf.pos + traf.size)).find(value => value.type === 'tfdt');
        const pos = start + tfdt.pos + 8;
        return data[pos] === 1 ? data.readUInt32BE(pos + 4) * 4294967296 + data.readUInt32BE(pos + 8) : data.readUInt32BE(pos + 4);
    });
}
for (const rate of [44100, 48000]) for (const channels of [1, 2]) {
    const input = fs.readFileSync(base + `assets/audio/aac-replace-${rate}-${channels}.mp4`), before = Buffer.from(input);
    const init = api.parseAacInit(input), preset = api.readAacPreset(input), replacement = api.replaceAacFragments(input, init, preset);
    assert.equal(init.rate, rate); assert.equal(init.channels, channels);
    assert(replacement.sampleCount > 2000); const output = Buffer.from(replacement.bytes);
    assert.deepStrictEqual(timeline(output), timeline(input));
    const first = top(input).find(box => box.type === 'moof').pos;
    assert(output.subarray(0, first).equals(input.subarray(0, first)), 'native init must be byte-identical');
    assert.equal(api.readAacPreset(output).frames.length, preset.frames.length, 'sample count is retained');
    assert(input.equals(before), 'native packet must not be mutated');
    const shifted = Buffer.from(input);
    for (const moof of top(shifted).filter(box => box.type === 'moof')) {
        const traf = top(shifted.subarray(moof.pos + 8, moof.pos + moof.size)).find(box => box.type === 'traf');
        const start = moof.pos + 8 + traf.pos + 8;
        const tfdt = top(shifted.subarray(start, moof.pos + 8 + traf.pos + traf.size)).find(box => box.type === 'tfdt');
        const pos = start + tfdt.pos + 8; assert.equal(shifted[pos], 1);
        shifted.writeUInt32BE(shifted.readUInt32BE(pos + 4) + 1, pos + 4);
    }
    const highDts = api.replaceAacFragments(shifted, init, preset);
    assert.deepStrictEqual(timeline(Buffer.from(highDts.bytes)), timeline(shifted), 'timestamps above 32 bits remain intact');

    assert.throws(() => api.parseAacInit(input.subarray(0, 7)), /MP4/);
    assert.throws(() => api.replaceAacFragments(input, {...init, rate: 123}, preset), /не совпали/);
}
const initData = fs.readFileSync(base + 'assets/audio/aac-replace-48000-2.mp4');
const offset = top(initData).find(box => box.type === 'moof').pos;
const header = initData.subarray(0, offset), media = initData.subarray(offset);
let now = 0, interval, id = 'UF8uR6Z6KLc', creations = 0, applied = [], reports = [], progress = [];
const video = {src: '', currentTime: 0, paused: false, readyState: 4, error: null};
const player = {querySelector: () => video, getVideoData: () => ({video_id: id})};
class MediaSource {
    constructor() {creations++;}
    addSourceBuffer(type) {return {type, appendBuffer(data) {applied.push({buffer: this, data});}};}
}
let urlNumber = 0;
const window = {MediaSource, URL: {createObjectURL: () => 'blob:' + (++urlNumber)}, addEventListener() {}};
class XHR {
    open(method, url) {this.url = url;}
    send() {const data = fs.readFileSync(base + 'assets/audio/' + this.url.split('/').pop());
        this.status = 200; this.response = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength); this.onload();}
    abort() {if (this.onabort) this.onabort();}
}
const context = vm.createContext({window, Uint8Array, ArrayBuffer, DataView, Number, Math, Map, Promise, XMLHttpRequest: XHR,
    parseAacInit: api.parseAacInit, readAacPreset: api.readAacPreset, replaceAacFragments: api.replaceAacFragments,
    Date: {now: () => now}, setInterval(fn) {interval = fn; return 1;}, clearInterval() {interval = null;},
    document: {querySelector: selector => selector === '.html5-video-player' ? player : video,
        querySelectorAll: selector => selector === 'video' ? [video] : [], createElement() {throw new Error('second player forbidden');}},
    showTranslationDiagnostics: (title, text) => reports.push(text), showTranslationProgress: text => progress.push(text)});
vm.runInContext(fs.readFileSync(base + 'src/mods/features/singlePlayerTest.js', 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/export function/g, 'function').replace('export default async function', 'async function'), context);
function response() {return {streamingData: {adaptiveFormats: [
    {mimeType: 'video/mp4; codecs="avc1.640028"'}, {mimeType: 'audio/webm; codecs="opus"'}, {mimeType: 'audio/mp4; codecs="mp4a.40.2"'}]}};}
(async () => {
    const mse = new window.MediaSource(); video.src = window.URL.createObjectURL(mse);
    const audio = mse.addSourceBuffer('audio/mp4; codecs="mp4a.40.2"'); audio.appendBuffer(header);
    const untouched = response(); context.preferAacForSinglePlayerTest(untouched); assert.equal(untouched.streamingData.adaptiveFormats.length, 3);
    await context.startSinglePlayerTest();
    const selection = response(); context.preferAacForSinglePlayerTest(selection); assert.equal(selection.streamingData.adaptiveFormats.length, 2);
    audio.appendBuffer(media); assert.equal(applied.pop().data, media, 'current clip must stay untouched while armed');
    id = 'fjeys2xEfJA';
    const otherMse = new window.MediaSource(); window.URL.createObjectURL(otherMse);
    const otherAudio = otherMse.addSourceBuffer('audio/mp4; codecs="mp4a.40.2"'); otherAudio.appendBuffer(initData);
    assert.equal(applied.pop().data, initData, 'a foreign MediaSource must not be changed');
    const nativeVideo = mse.addSourceBuffer('video/mp4; codecs="avc1.640028"');
    const opaqueVideo = new Uint8Array([1, 2, 3]); nativeVideo.appendBuffer(opaqueVideo);
    assert.equal(applied.pop().data, opaqueVideo, 'video bytes are never parsed or modified');
    const calls = applied.length; audio.appendBuffer(media);
    assert.equal(applied.length, calls + 1, 'one native append and its normal events per original call');
    const changed = applied.pop().data; assert.notEqual(changed, media);
    assert.deepStrictEqual(timeline(Buffer.from(changed)), timeline(media)); assert.equal(creations, 2, 'test creates no MediaSource');
    for (let i = 0; i < 40 && interval; i++) {now += 500; video.currentTime += .5; interval();}
    assert(reports[0].includes('Подменено пакетов: 1')); assert(reports[0].includes('audio: 0'));
    assert(reports[0].includes('15.50 с')); assert.equal(interval, null);
    audio.appendBuffer(media); assert.equal(applied.pop().data, media, 'after test packets pass through');
    const restored = response(); context.preferAacForSinglePlayerTest(restored); assert.equal(restored.streamingData.adaptiveFormats.length, 3);
    await context.startSinglePlayerTest(); id = 'dQw4w9WgXcQ';
    const malformed = new Uint8Array([1, 2]); audio.appendBuffer(malformed);
    assert.equal(applied.pop().data, malformed, 'failure must fall back to original native bytes');
    assert(reports[1].includes('Подмена не выполнена')); assert.equal(interval, null);
    await context.startSinglePlayerTest(); context.cancelSinglePlayerTest(); assert.equal(interval, null);
    console.log('PASS: AAC configurations/timestamps/native init, read-only packets, single-player routing, pass-through, original events, cancellation and safe fallback');
})().catch(error => {console.error(error);process.exitCode = 1;});
