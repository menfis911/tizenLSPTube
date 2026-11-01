const assert = require('assert');
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
    console.log('VOT: session reuse, protobuf request, URL validation, input validation and request deduplication passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
