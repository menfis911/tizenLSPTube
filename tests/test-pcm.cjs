const assert = require('assert'), fs = require('fs'), vm = require('vm');
const {createPcmStore} = require('../packages/launcher/service/dist/vot.js');
const settle = () => new Promise(resolve => setImmediate(resolve));
async function main() {
    let resets = 0, loads = 0;
    class Decoder {
        constructor() { this.ready = Promise.resolve(); }
        decode() { return {samplesDecoded: 1000, sampleRate: 1000, channelData: [new Float32Array(1000).fill(.25)]}; }
        reset() { resets++; return Promise.resolve(); }
        free() {}
    }
    const store = createPcmStore(async () => {loads++; return Buffer.alloc(100 * 4096);}, Decoder);
    const token = store.register('https://storage.yandexcloud.net/fixture', 'video-1', false);
    const first = await store.read(token, 0);
    assert.equal(first.frames, 480000); assert.equal(first.data.readFloatLE(0), .25);
    for (const index of [1, 2, 3]) assert.equal((await store.read(token, index)).frames, 480000);
    assert.equal(loads, 1);
    assert.equal(store.status(token).percent, 100);
    assert.equal((await store.read(token, 0)).data.readFloatLE(479999 * 4), .25);
    assert.throws(() => store.status('invalid'), /Сеанс/);
    assert.equal(resets, 1, 'backward seeking outside the three-chunk cache resets the decoder');
    assert.equal(store.register('https://storage.yandexcloud.net/renewed', 'video-1', false), token);
    store.register('https://storage.yandexcloud.net/fixture', 'video-2', false);
    await assert.rejects(store.read(token, 0), /Сеанс аудио завершён/);

    let finishDownload;
    const loading = createPcmStore((url, progress) => { progress({stage: 'Загрузка звука', percent: 63});
        return new Promise(resolve => {finishDownload = resolve;}); }, Decoder);
    const loadingToken = loading.register('https://storage.yandexcloud.net/fixture', 'loading', false);
    const waiting = loading.read(loadingToken, 0); await settle();
    assert.equal(loading.status(loadingToken).percent, 63);
    finishDownload(Buffer.alloc(4096)); await waiting; assert.equal(loading.status(loadingToken).percent, 100);
    let interval, node, nodeCount = 0, bufferCount = 0;
    const context = {currentTime: 0, destination: {},
        createBuffer(channels, length, rate) { bufferCount++; assert.equal(channels, 1); const data = new Float32Array(length);
            return {length, sampleRate: rate, samples: data,
                copyToChannel(samples, channel, start) { assert.equal(channel, 0); assert.equal(start, 0); data.set(samples, start); }}; },
        createBufferSource() { nodeCount++; return {
            connect() {}, disconnect() {}, stop(when) { assert.equal(when, 0); },
            start(...args) { assert.deepEqual(args, [0], 'Cobalt supports only start(0)'); node = this; }
        }; }};
    const sandbox = {Promise, Number, Math, Map, Float32Array,
        setInterval(fn) {interval = fn; return 1;}, clearInterval() {interval = null;}};
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(__dirname + '/../src/mods/features/pcmAudio.js', 'utf8').replace('export function', 'function'), sandbox);
    const fetched = [];
    const audio = sandbox.createPcmAudio(context, 11.5, (url, index) => {
        fetched.push(index);
        return {promise: Promise.resolve({samples: new Float32Array(480000).fill(.2), frames: 480000,
            rate: 48000, start: index * 10, ended: false}), cancel() {}};
    });
    audio.src = '/lsptube/pcm?token=fixture'; audio.load(); await audio.play();
    assert.equal(audio.sourceActive, true);
    assert.equal(node.buffer.length, 408000); assert.equal(node.buffer.sampleRate, 48000);
    assert(Math.abs(node.buffer.samples[0] - .2) < 1e-7);
    assert(Math.abs(node.buffer.samples[node.buffer.length - 1] - .2) < 1e-7);
    assert.equal(audio.readyState, 4); assert.equal(fetched[0], 1);
    context.currentTime = 1; assert.equal(audio.currentTime, 12.5);
    audio.pause(); assert.equal(audio.sourceActive, false); context.currentTime = 3; assert.equal(audio.currentTime, 12.5);
    audio.currentTime = 35.25; await audio.play(); assert.equal(node.buffer.length, 228000);
    audio.playbackRate = 2; await settle(); assert.equal(node.buffer.sampleRate, 96000);
    context.currentTime += 1; assert.equal(audio.currentTime, 37.25);
    interval(); await settle();
    const preparedCount = bufferCount;
    node.onended(); await settle();
    assert.equal(bufferCount, preparedCount, 'chunk handoff reuses the buffer prepared before the previous chunk ends'); assert.equal(audio.currentTime, 40); assert.equal(node.buffer.length, 480000);
    audio.volume = .5; await settle();
    assert(Math.abs(node.buffer.samples[0] - .1) < 1e-7, 'translation volume scales PCM without GainNode');
    audio.muted = true; const before = nodeCount; context.currentTime += 1;
    assert.equal(audio.currentTime, 42); assert.equal(nodeCount, before);
    audio.muted = false; await settle(); assert(nodeCount > before);
    audio.removeAttribute('src'); audio.load(); assert.equal(interval, null); assert.equal(audio.networkState, 0);
    const smooth = sandbox.createPcmAudio(context, 0, (url, index) => ({cancel() {}, promise: Promise.resolve({
        samples: new Float32Array(480000), frames: 480000, rate: 48000, start: index * 10})}));
    smooth.src = '/lsptube/pcm?token=smooth'; smooth.load(); await smooth.play();
    const originalNode = node, originalCount = nodeCount;
    smooth.driftRate = 1.03; interval(); await settle();
    assert.equal(node, originalNode); assert.equal(nodeCount, originalCount, 'soft correction cannot restart the active source');
    context.currentTime += 1; assert.equal(smooth.currentTime, 1, 'active clock keeps its original buffer speed');
    node.onended(); await settle(); assert.equal(node.buffer.sampleRate, 49440);
    context.currentTime += 1; assert(Math.abs(smooth.currentTime - 11.03) < 1e-8);
    smooth.driftRate = .97; interval(); await settle(); node.onended(); await settle();
    assert.equal(node.buffer.sampleRate, 46560);
    smooth.removeAttribute('src'); smooth.load();
    let failures = 0;
    const failing = sandbox.createPcmAudio(context, 0, (url, index) => ({cancel() {},
        promise: index === 0 ? Promise.resolve({samples: new Float32Array(480000), frames: 480000, rate: 48000, start: 0}) :
            (failures++, Promise.reject(new Error('network failure')))}));
    failing.src = '/lsptube/pcm?token=fixture'; failing.load(); await failing.play();
    for (let i = 0; i < 3; i++) { interval(); await settle(); }
    assert.equal(failures, 1, 'failed prefetch must not retry every 200 ms');
    failing.removeAttribute('src'); failing.load();
    console.log('PASS: PCM resampling, bounded cache, backward seek, token isolation, Cobalt start(0), crop, pause, speed, chunk handoff, mute and cleanup');
}
main().catch(error => {console.error(error);process.exitCode = 1});
