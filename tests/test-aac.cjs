const assert = require('assert'), fs = require('fs'), vm = require('vm');
const route = require('../packages/launcher/service/dist/aac-fixture.js');
function request(url, method = 'GET', range) {
    const result = {};
    result.handled = route.handle({url, method, headers: range ? {range} : {}}, {
        writeHead(code, headers) {result.code = code; result.headers = headers;}, end(body) {result.body = body;}
    }); return result;
}
for (const name of ['aac-test.mp4', 'aac-test-fragmented.mp4', 'aac-replace-44100-1.mp4', 'aac-replace-44100-2.mp4', 'aac-replace-48000-1.mp4', 'aac-replace-48000-2.mp4']) {
    const url = '/lsptube/' + name, full = request(url);
    assert.equal(full.code, 200); assert.equal(full.headers['Content-Type'], 'audio/mp4');
    assert(full.body.equals(fs.readFileSync(__dirname + '/../assets/audio/' + name)));
    assert.equal(request(url, 'HEAD').body, undefined);
    const partial = request(url, 'GET', 'bytes=0-31'); assert.equal(partial.code, 206);
    assert(partial.body.equals(full.body.slice(0, 32)));
    assert(request(url, 'GET', 'bytes=-32').body.equals(full.body.slice(-32)));
    assert(request(url, 'GET', 'bytes=32-').body.equals(full.body.slice(32)));
    for (const range of ['bytes=9-2', 'bytes=999999999-', 'bytes=0-2,4-6', 'bytes=-0', 'nonsense']) assert.equal(request(url, 'GET', range).code, 416);
    assert.equal(request(url, 'POST').code, 405);
}
assert.equal(request('/lsptube/not-a-fixture').handled, false);
assert.equal(request('__proto__').handled, false);
const source = fs.readFileSync(__dirname + '/../src/mods/features/aacTest.js', 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export default function', 'function');
function scenario({mse = false, unsupported = false, paused = false} = {}) {
    let interval, key, currentAudio, opened, xhr, revoked = false, endOfStream = false, appended = false, at = 0;
    const reports = [], progress = [];
    const video = {paused, currentTime: 4, ended: false, play() {this.paused = false; return Promise.resolve();}, pause() {this.paused = true;}};
    const body = {appendChild(a) {a.parentNode = this;}, removeChild(a) {a.parentNode = null;}};
    const document = {body, querySelector: () => video,
        addEventListener(type, fn) {key = fn;}, removeEventListener() {key = null;},
        createElement() {currentAudio = {style: {}, currentTime: 0, readyState: 4, networkState: 1,
            canPlayType: () => 'probably', addEventListener() {}, load() {}, play: () => Promise.resolve(), pause() {},
            removeAttribute() {this.src = '';}}; return currentAudio;}};
    class MediaSource {
        constructor() {this.readyState = 'open';}
        static isTypeSupported() {return !unsupported;}
        addEventListener(type, fn) {opened = fn;}
        addSourceBuffer() {const events = {}; return {addEventListener(type, fn) {events[type] = fn;}, appendBuffer() {appended = true; events.updateend();}};}
        endOfStream() {endOfStream = true;}
    }
    class XHR {constructor() {xhr = this;} open(method, url) {this.url = url;} send() {} abort() {this.aborted = true;}}
    const window = {MediaSource, URL: {createObjectURL: () => 'blob:test', revokeObjectURL() {revoked = true;}}, addEventListener() {}};
    const context = vm.createContext({window, document, Promise, Math, Number, Date: {now: () => at}, XMLHttpRequest: XHR,
        setInterval(fn) {interval = fn; return 1;}, clearInterval() {interval = null;},
        showTranslationProgress: value => progress.push(value), showTranslationDiagnostics: (title, details) => reports.push(details)});
    vm.runInContext(source, context); context.startAacTest(mse ? 'mse' : 'file');
    return {video, reports, progress, get audio() {return currentAudio;},
        open() {opened();}, respond() {xhr.status = 200; xhr.response = new ArrayBuffer(4); xhr.onload();},
        tick(time = 2000) {at = time; interval();}, back() {key({keyCode: 10009, preventDefault() {}, stopImmediatePropagation() {}});},
        state: () => ({interval, key, xhr, revoked, endOfStream, appended})};
}
const file = scenario({paused: true}); assert(!file.video.paused); assert.equal(file.audio.src, '/lsptube/aac-test.mp4');
file.audio.currentTime = 20; file.video.currentTime += 20; file.audio.onended();
assert(file.reports[0].includes('YouTube продвинулся: 20.00')); assert(file.video.paused); assert.equal(file.audio.parentNode, null);
assert.equal(file.state().interval, null);
const error = scenario(); error.audio.error = {code: 4}; error.audio.onerror(); assert(error.reports[0].includes('error=4'));
const cancelled = scenario(); cancelled.back(); assert(cancelled.reports[0].includes('остановлена')); assert.equal(cancelled.audio.src, '');
const timed = scenario(); timed.tick(45000); assert(timed.reports[0].includes('Тайм-аут'));
const unsupported = scenario({mse: true, unsupported: true}); assert(unsupported.reports[0].includes('не заявлен'));
const streaming = scenario({mse: true}); streaming.open(); streaming.respond();
assert(streaming.state().appended); assert(streaming.state().endOfStream);
streaming.audio.currentTime = 20; streaming.audio.onended(); assert(streaming.state().revoked); assert(streaming.state().xhr.aborted);
console.log('PASS: AAC GET/HEAD/ranges, file and MSE setup, completion, errors, cancellation, timeout and cleanup');
