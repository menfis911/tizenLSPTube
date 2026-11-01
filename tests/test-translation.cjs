const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(__dirname + '/../src/mods/features/translationController.js', 'utf8').replace('export function', 'function');
let tick, poll;
const context = { Promise, Number, Math, Date, setTimeout: fn => { poll = fn; return 1; }, clearTimeout() {},
    setInterval(fn) { tick = fn; return 2; }, clearInterval() {} };
vm.createContext(context); vm.runInContext(source, context);
const settle = () => new Promise(resolve => setImmediate(resolve));
function media() {
    return {volume: .8, muted: false, playbackRate: 1, currentTime: 12, duration: 90,
        paused: false, readyState: 4, seeking: false, ended: false, listeners: {},
        addEventListener(n, f) { this.listeners[n] = f; }, removeEventListener(n) { delete this.listeners[n]; },
        pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); },
        removeAttribute() {}, load() {}, remove() { this.removed = true; }};
}
async function main() {
    let video = media(), id = 'UF8uR6Z6KLc', resolveRequest, audio;
    const messages = [];
    const controller = context.createTranslationController({
        current: () => ({video, id}), notify: message => messages.push(message),
        request: () => ({promise: new Promise(resolve => { resolveRequest = resolve; }), cancel() {}}),
        createAudio: () => { audio = media(); audio.paused = true; return audio; }
    });
    controller.toggle(); controller.toggle();
    resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/fixture'}); await settle();
    assert(!audio, 'cancelled response must not start playback');
    controller.toggle(); resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/fixture'}); await settle();
    tick(); await settle(); assert.equal(audio.currentTime, 12); assert.equal(video.volume, .12);
    video.paused = true; tick(); assert(audio.paused); assert.equal(video.volume, .8);
    video.currentTime = 50; video.paused = false; video.playbackRate = 1.5;
    tick(); await settle(); assert.equal(audio.currentTime, 50); assert.equal(audio.playbackRate, 1.5);
    // A late play completion must never mute the next video.
    id = 'dQw4w9WgXcQ'; tick(); assert(!controller.active()); assert.equal(video.volume, .8); assert(audio.removed);
    video = media(); controller.toggle();
    resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/fixture'}); await settle();
    let played;
    audio.play = () => new Promise(resolve => { played = resolve; });
    tick(); controller.stop(); played(); await settle();
    assert.equal(video.volume, .8); assert(audio.paused);
    controller.toggle(); resolveRequest({error: 'Яндекс отклонил ролик'}); await settle();
    assert(!controller.active()); assert.equal(video.volume, .8);
    controller.toggle(); resolveRequest({status: 5, partial: true, url: 'https://storage.yandexcloud.net/partial?token=1'}); await settle();
    const partial = audio;
    poll(); resolveRequest({status: 5, partial: true, url: 'https://storage.yandexcloud.net/partial?token=2'}); await settle();
    assert.strictEqual(audio, partial, 'renewed signed URLs must not interrupt the partial audio');
    poll(); resolveRequest({status: 1, partial: false, url: 'https://storage.yandexcloud.net/full'}); await settle();
    assert.notStrictEqual(audio, partial); assert(partial.removed); controller.stop();
    video = media(); video.duration = Infinity; controller.toggle(); assert(!controller.active());
    assert(messages.some(message => message.includes('4 часов')));
    console.log('Translation: cancellation, pause, seek, rate, video change, volume restoration and live rejection passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
