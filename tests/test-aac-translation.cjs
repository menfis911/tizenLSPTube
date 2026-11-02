const assert = require('assert'), fs = require('fs'), vm = require('vm');
let watch, id = 'fjeys2xEfJA', state, stopped = 0, reloaded = [], requests = [], messages = [], errors = [];
const video = {currentTime: 487, duration: 900, paused: false, readyState: 4, pause() {this.paused = true;}, play() {this.paused = false;}};
const api = vm.createContext({Number, Date, Promise, JSON,
    setInterval(fn) {watch = fn; return 1;}, clearInterval() {watch = null;}});
vm.runInContext(fs.readFileSync(__dirname + '/../src/mods/features/aacTranslationController.js', 'utf8').replace('export function', 'function'), api);
let pendingRequest, cancel = 0, prepareFailures = 1;
const controller = api.createAacTranslation({
    current: () => ({id, video}), options: () => ({pause: true, voice: 75}),
    request(path, binary) {
        requests.push(path);
        if (path.includes('aac-prepare') && prepareFailures-- > 0) {
            const error = new Error('temporary status timeout'); error.transient = true;
            return {promise: Promise.reject(error), cancel() {cancel++;}};
        }
        let result = path.includes('/vot?') ? {url: '/lsptube/pcm?token=' + 'a'.repeat(32)} :
            path.includes('aac-prepare') ? {ready: true, stage: 'AAC готов', percent: 100} : binary ? 'voice-bytes' : {};
        return {promise: pendingRequest || Promise.resolve(result), cancel() {cancel++;}};
    },
    readVoice(value) {assert.equal(value, 'voice-bytes'); return {frames: ['voice']};},
    startAudio(preset, target, onStop) {assert.equal(target, id); state = {packets: 1};},
    stopAudio() {state = null; stopped++;}, audioDetails: () => state,
    reload(...args) {reloaded.push(args);}, progress() {}, notify: text => messages.push(text), diagnose: (title, text) => errors.push(text),
    delay: () => Promise.resolve()
});
const tick = async () => {for (let i = 0; i < 20; i++) await Promise.resolve();};
(async () => {
    controller.toggle(); assert(video.paused); await tick();
    assert.equal(reloaded.length, 1); assert.deepStrictEqual(reloaded[0], [id, 487, false]);
    assert(requests.some(path => path.includes('volume=75')));
    assert.equal(requests.filter(path => path.includes('aac-prepare')).length, 2, 'transient status failure retries without restarting the translation');
    watch(); assert(messages.some(value => value.includes('включён'))); assert(controller.active());
    video.currentTime = 503; video.paused = false; controller.stop();
    assert.deepStrictEqual(reloaded[1], [id, 503, false]); assert.equal(stopped, 1); assert.equal(watch, null);
    pendingRequest = new Promise(() => {}); controller.toggle(); controller.stop(); assert(cancel > 0); assert(!video.paused);
    pendingRequest = null; controller.toggle(); id = 'dQw4w9WgXcQ'; watch(); await tick();
    assert(!controller.active()); assert.equal(reloaded.length, 2, 'do not reload a different video after cancellation');
    assert.equal(errors.length, 0);
    console.log('PASS: same-video position, preparation pause, native activation, stop/restoration, request cancellation and video change');
})().catch(error => {console.error(error);process.exitCode = 1;});
