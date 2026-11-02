const fs = require('fs'), vm = require('vm'), assert = require('assert');
let dependencies, interval, delay, request;
const toasts = [], panels = [], audio = {src: '/lsptube/pcm?token=fixture', listeners: {},
    addEventListener(name, listener) {this.listeners[name] = listener;}};
class XHR {
    constructor() {request = this;}
    open(method, url) {this.url = url;}
    setRequestHeader() {}
    send() {}
    abort() {this.aborted = true;}
}
const context = vm.createContext({window: {AudioContext: function() {}, addEventListener() {}},
    createTranslationController(value) {dependencies = value; return {stop() {}};}, createPcmAudio: () => audio,
    configRead: key => ({translationOriginalVolume: 5, translationVoiceVolume: 100, translationPauseUntilReady: true})[key],
    showTranslationProgress: value => panels.push(value), showToast: (title, message) => toasts.push(message),
    XMLHttpRequest: XHR, Number, Date, setInterval(fn, ms) {interval = fn; delay = ms; return 1;},
    clearInterval() {interval = null;}});
vm.runInContext(fs.readFileSync(__dirname + '/../src/mods/features/yandexTranslation.js', 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export default translation;', ''), context);
dependencies.createAudio(0); audio.listeners.loadstart();
assert.equal(delay, 200); assert.equal(request.url, '/lsptube/pcm-status?token=fixture');
request.status = 200; request.responseText = JSON.stringify({stage: 'Загрузка звука', percent: 63}); request.onload();
assert(panels.pop().includes('63%')); assert.equal(toasts.length, 0, 'progress must not queue native toasts');
interval(); const pending = request; audio.listeners.loadedmetadata();
assert(pending.aborted); assert.equal(interval, null); assert(panels.pop().includes('100%'));
const lateReply = pending.onload; if (lateReply) lateReply();
assert.equal(toasts.length, 0);
assert.equal(audio.progress, 'Звук загружен: 100%');
dependencies.progress(null); assert.equal(panels.pop(), null);
console.log('PASS: real progress adapter polls status, updates percentage without a toast queue, completes and cancels requests');
