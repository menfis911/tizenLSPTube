const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(__dirname + '/../src/mods/features/translationController.js', 'utf8').replace('export function', 'function');
let tick, now = 0, nextTimer = 0;
const timers = new Map();
function fireTimer(delay) {
    const entry = Array.from(timers).reverse().find(([, timer]) => timer.delay === delay);
    assert(entry, 'expected timer: ' + delay); timers.delete(entry[0]); entry[1].fn();
}
const poll = () => fireTimer(10000);
const context = { Promise, Number, Math, Date: {now: () => now},
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, {fn, delay}); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn) { tick = fn; return 2; }, clearInterval() {} };
vm.createContext(context); vm.runInContext(source, context);
const settle = () => new Promise(resolve => setImmediate(resolve));
function media() {
    return {tagName: 'AUDIO', canPlayType: () => 'probably', volume: .8, muted: false, playbackRate: 1, currentTime: 12, duration: 90,
        paused: false, readyState: 4, seeking: false, ended: false, listeners: {},
        addEventListener(n, f) { this.listeners[n] = f; }, removeEventListener(n) { delete this.listeners[n]; },
        pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); },
        removeAttribute() {}, load() {}, parentNode: {removeChild(child) { child.removed = true; child.parentNode = null; }}};
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
    assert(!Array.from(timers.values()).some(timer => timer.delay === 60000), 'confirmed audio must cancel the startup watchdog');
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
    controller.inspect();
    assert(diagnostics.pop().details.includes('Яндекс отклонил ролик'), 'request errors must survive without an audio element');
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
    assert(controller.active()); fireTimer(60000);
    assert(!controller.active()); assert.equal(video.volume, .8);
    assert(diagnostics[0].details.includes('readyState: 0'));
    controller.toggle(); resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/stationary'}); await settle();
    const successes = messages.filter(message => message.includes('на русский включён')).length;
    for (let i = 0; i < 21; i++) { now += 1000; tick(); }
    assert(controller.active()); fireTimer(60000);
    assert(!controller.active()); assert.equal(video.volume, .8);
    assert.equal(messages.filter(message => message.includes('на русский включён')).length, successes);
    assert(diagnostics[1].details.includes('readyState: 4'));
    // Readiness and paused flags must not prevent the independent startup deadline.
    video = media(); video.readyState = 2; video.paused = true;
    controller.toggle(); resolveRequest({status: 1, url: 'https://storage.yandexcloud.net/blocked'}); await settle();
    audio.load = () => { throw new Error('cleanup load failed'); };
    fireTimer(60000);
    assert(!controller.active()); assert(audio.removed); assert.equal(video.volume, .8);
    assert(diagnostics[2].details.includes('Видео paused: true'));
    const beforeInspect = diagnostics.length; controller.inspect();
    assert.equal(diagnostics.length, beforeInspect + 1);
    assert(diagnostics[diagnostics.length - 1].details.includes('readyState: 2'));
    video = media(); video.duration = Infinity; controller.toggle(); assert(!controller.active());
    assert(messages.some(message => message.includes('4 часов')));
    console.log('Translation: cancellation, pause, seek, rate, video change, volume restoration and live rejection passed');
    // Diagnostics must display and close without YouTube's command router or Element.remove().
    function element(tagName) {
        return {tagName, style: {}, children: [], setAttribute() {},
            appendChild(child) { child.parentNode = this; this.children.push(child); },
            removeChild(child) { this.children = this.children.filter(item => item !== child); child.parentNode = null; }};
    }
    const listeners = {};
    const document = {body: element('body'), createElement: element,
        addEventListener(name, fn) { listeners[name] = fn; }, removeEventListener(name) { delete listeners[name]; }};
    const ui = vm.createContext({document});
    vm.runInContext(fs.readFileSync(__dirname + '/../src/mods/ui/translationDiagnostics.js', 'utf8').replace('export default function', 'function'), ui);
    ui.showTranslationDiagnostics('Проверка', 'readyState: 0');
    assert.equal(document.body.children.length, 1);
    assert.equal(document.body.children[0].children[1].textContent, 'readyState: 0');
    ui.showTranslationDiagnostics('Повтор', 'readyState: 2'); assert.equal(document.body.children.length, 1);
    listeners.keydown({keyCode: 10009, preventDefault() {}, stopImmediatePropagation() {}});
    assert.equal(document.body.children.length, 0); assert(!listeners.keydown);
    console.log('PASS: independent startup watchdog, cleanup failure, manual inspection and standalone diagnostic screen');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
