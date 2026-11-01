// Optional real API check: sends only this public test video's link to Yandex.
const assert = require('assert');
const https = require('https');
const {handle} = require('../packages/launcher/service/dist/vot.js');
handle({url:'/lsptube/vot?id=jNQXAC9IVRw&duration=19&lang=en',method:'GET',headers:{'x-lsptube':'1'}}, {
    writeHead(code) { this.code = code; },
    end(body) {
        const data = JSON.parse(body);
        assert.equal(this.code, 200, data.error);
        if (!data.url) { console.log('Yandex accepted request; translation is still preparing, status=' + data.status); return; }
        const req = https.get(data.url, {headers: {Range: 'bytes=0-63'}, timeout: 15000}, res => {
            assert([200,206].includes(res.statusCode));
            assert(/audio|octet-stream/.test(res.headers['content-type']));
            res.once('data', chunk => {
                assert(chunk.length > 0);
                console.log('PASS: Yandex returned translated audio; HTTPS audio download works (' + res.headers['content-type'] + ')');
                res.destroy(); req.destroy();
            });
            res.on('error', () => {});
        });
        req.on('timeout', () => req.destroy(new Error('Audio request timed out')));
        req.on('error', error => { console.error(error.message); process.exitCode = 1; });
    }
});
