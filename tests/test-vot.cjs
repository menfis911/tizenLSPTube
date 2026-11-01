const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const {EventEmitter} = require('events');
const {createClient, makeHandler} = require('../packages/launcher/service/dist/vot.js');
const text = (n, value) => Buffer.concat([Buffer.from([n * 8 + 2, Buffer.byteLength(value)]), Buffer.from(value)]);
const reply = (status, url) => Buffer.concat([url ? text(1, url) : Buffer.alloc(0), Buffer.from([32, status, 40, 10]), text(7, 'translation-fixture')]);
async function main() {
    const paths = [];
    const client = createClient(async (path, body, headers) => {
        paths.push(path);
        assert(headers['Vtrans-Signature']);
        if (path === '/session/create') return Buffer.concat([text(1, 'fixture-secret'), Buffer.from([16, 120])]);
        assert(headers['Sec-Vtrans-Token'].includes(':/video-translation/translate:'));
        assert(Buffer.from(body).includes(Buffer.from('https://youtu.be/UF8uR6Z6KLc')));
        return reply(1, 'https://storage.yandexcloud.net/fixture/audio.mp3');
    });
    assert.equal((await client('UF8uR6Z6KLc', 900, 'en')).status, 1);
    await client('UF8uR6Z6KLc', 900, 'en');
    assert.equal(paths.filter(p => p === '/session/create').length, 1);
    let sessions = 0, attempts = 0;
    const refreshing = createClient(async path => {
        if (path === '/session/create') { sessions++; return Buffer.concat([text(1, 'session-' + sessions), Buffer.from([16, 120])]); }
        attempts++;
        if (attempts === 1) { const error = new Error('Яндекс: HTTP 403'); error.status = 403; throw error; }
        return reply(1, 'https://storage.yandexcloud.net/fixture/audio.mp3');
    });
    assert.equal((await refreshing('UF8uR6Z6KLc', 900, 'en')).status, 1);
    assert.equal(sessions, 2); assert.equal(attempts, 2);
    let forbiddenCalls = 0;
    const forbidden = createClient(async path => {
        if (path === '/session/create') return Buffer.concat([text(1, 'session'), Buffer.from([16, 120])]);
        forbiddenCalls++; const error = new Error('Яндекс: HTTP 403 · запрос перевода'); error.status = 403; throw error;
    });
    await assert.rejects(forbidden('UF8uR6Z6KLc', 900, 'en'), /403.*запрос перевода/);
    assert.equal(forbiddenCalls, 2, '403 recovery must stop after one fresh session');
    const sandbox = {module: {exports: {}}, Buffer, URL, setTimeout, clearTimeout,
        global, TextEncoder: require('util').TextEncoder, TextDecoder: require('util').TextDecoder,
        require(name) {
            if (name !== './compat-https.js') return require(name);
            return {request(options, callback) {
                const req = new EventEmitter(); req.abort = () => {};
                req.end = () => process.nextTick(() => {
                    const res = new EventEmitter(); res.statusCode = 403;
                    callback(res); res.emit('end');
                });
                return req;
            }};
        }};
    vm.runInNewContext(fs.readFileSync(__dirname + '/../packages/launcher/service/dist/vot.js', 'utf8'), sandbox);
    const rejection = await new Promise(resolve => sandbox.module.exports.handle({
        url: '/lsptube/vot?id=UF8uR6Z6KLc&duration=900', method: 'GET', headers: {'x-lsptube': '1'}
    }, {writeHead() {}, end(body) { resolve(JSON.parse(body)); }}));
    assert(rejection.error.includes('HTTP 403 · создание сеанса'));
    const bad = createClient(async path => path === '/session/create' ? Buffer.concat([text(1, 's'), Buffer.from([16, 120])]) : reply(1, 'https://evil.example/audio'));
    await assert.rejects(bad('UF8uR6Z6KLc', 900, 'en'), /неизвестный/);
    let calls = 0;
    const handler = makeHandler(async () => { calls++; return {status: 2, retryAfter: 10}; });
    function call(url, headers = {'x-lsptube': '1'}) {
        return new Promise(resolve => handler({url, method: 'GET', headers}, {
            writeHead(code) { this.code = code; }, end(data) { resolve({code: this.code, data: JSON.parse(data)}); }
        }));
    }
    const url = '/lsptube/vot?id=UF8uR6Z6KLc&duration=900';
    assert.equal((await call(url, {})).code, 400);
    assert.equal((await call('/lsptube/vot?id=http://evil&duration=4')).code, 400);
    assert.equal((await call(url + '000')).code, 400);
    const [a, b] = await Promise.all([call(url), call(url)]);
    assert.equal(a.data.status, 2); assert.equal(b.code, 200); assert.equal(calls, 1);
    const bridge = require('../packages/launcher/service/dist/bridge.js');
    for (const path of ['/lsptube/userscript.js', '/lsptube/icon.png']) {
        assert(bridge.handle({url: path}, {writeHead(code) { assert.equal(code, 200); }, end(data) { assert(data.length > 100); }}));
    }
    assert.equal(bridge.handle({url: '/youtubei/v1/player'}, {}), false);
    console.log('VOT: session reuse, protobuf request, URL validation, input validation and request deduplication passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
