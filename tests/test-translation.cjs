const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(__dirname + '/../src/mods/features/translationController.js', 'utf8').replace('export function', 'function');
let tick, poll, now = 0;
const context = { Promise, Number, Math, Date: {now: () => now}, setTimeout: fn => { poll = fn; return 1; }, clearTimeout() {},
    setInterval(fn) { tick = fn; return 2; }, clearInterval() {} };
vm.createContext(context); vm.runInContext(source, context);
const settle = () => new Promise(resolve => setImmediate(resolve));
function media() {
    return {tagName: 'AUDIO', canPlayType: () => 'probably', volume: .8, muted: false, playbackRate: 1, currentTime: 12, duration: 90,
        paused: false, readyState: 4, seeking: false, ended: false, listeners: {},
        addEventListener(n, f) { this.listeners[n] = f; }, removeEventListener(n) { delete this.listeners[n]; },
        pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); },
        removeAttribute() {}, load() {}, remove() { this.removed = true; }};
}
async function main() {
    let video = media(), id = 'UF8uR6Z6KLc', resolveRequest, audio, nextPlay, nextReady;
    const messages = [], diagnostics = [];
    const controller = context.createTranslationController({
        current: () => ({video, id}), notify: message => messages.push(message),
        request: () => ({promise: new Promise(resolve => { resolveRequest = resolve; }), cancel() {}}),
        createAudio: () => { audio = media(); audio.paused = true;
            if (nextPlay) { audio.play = nextPlay; nextPlay = null; }
            if (nextReady !== undefined) { audio.readyState = nextReady; nextReady = undefined; }
            return audio; },
        diagnose: (message, details) => diagnostics.push({message, details})
    });
    const advance = async () => { now += 500; video.currentTime += .5; audio.currentTime += .5; tick(); await settle(); };
    controller.toggle(); controller.toggle();
    resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/fixture'}); await settle();
    assert(!audio, 'cancelled response must not start playback');
    controller.toggle(); resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/fixture'}); await settle();
    assert.equal(video.volume, .8, 'a ready URL and a resolved play promise are not proof of playback');
    assert(!messages.some(message => message.includes('на русский включён')));
    await advance(); assert.equal(audio.currentTime, 12.5); assert.equal(video.volume, .12);
    assert(messages.some(message => message.includes('на русский включён')));
    video.paused = true; tick(); assert(audio.paused); assert.equal(video.volume, .8);
    video.currentTime = 50; video.paused = false; video.playbackRate = 1.5;
    tick(); await settle(); assert.equal(audio.currentTime, 50); assert.equal(audio.playbackRate, 1.5);
    assert.equal(video.volume, .8); await advance(); assert.equal(video.volume, .12);
    // A late play completion must never mute the next video.
    id = 'dQw4w9WgXcQ'; tick(); assert(!controller.active()); assert.equal(video.volume, .8); assert(audio.removed);
    let played;
    nextPlay = () => new Promise(resolve => { played = resolve; });
    video = media(); controller.toggle();
    resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/fixture'}); await settle();
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
    let startedWithoutMetadata = false;
    nextReady = 0; nextPlay = () => { startedWithoutMetadata = true; audio.paused = false; };
    controller.toggle(); resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/unloaded'}); await settle();
    assert(startedWithoutMetadata, 'play must be called before metadata to avoid a preload deadlock');
    for (let i = 0; i < 21; i++) { now += 1000; tick(); }
    assert(!controller.active()); assert.equal(video.volume, .8);
    assert(diagnostics[0].details.includes('readyState: 0'));
    controller.toggle(); resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/stationary'}); await settle();
    const successes = messages.filter(message => message.includes('на русский включён')).length;
    for (let i = 0; i < 21; i++) { now += 1000; tick(); }
    assert(!controller.active()); assert.equal(video.volume, .8);
    assert.equal(messages.filter(message => message.includes('на русский включён')).length, successes);
    assert(diagnostics[1].details.includes('readyState: 4'));
    video = media(); video.duration = Infinity; controller.toggle(); assert(!controller.active());
    assert(messages.some(message => message.includes('4 часов')));
    console.log('Translation: cancellation, pause, seek, rate, video change, volume restoration and live rejection passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
