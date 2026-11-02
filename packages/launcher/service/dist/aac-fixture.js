'use strict';
var fs = require('fs');
var files = {
    '/lsptube/aac-replace-44100-1.mp4': fs.readFileSync(__dirname + '/aac-replace-44100-1.mp4'),
    '/lsptube/aac-replace-44100-2.mp4': fs.readFileSync(__dirname + '/aac-replace-44100-2.mp4'),
    '/lsptube/aac-replace-48000-1.mp4': fs.readFileSync(__dirname + '/aac-replace-48000-1.mp4'),
    '/lsptube/aac-replace-48000-2.mp4': fs.readFileSync(__dirname + '/aac-replace-48000-2.mp4'),
    '/lsptube/aac-test.mp4': fs.readFileSync(__dirname + '/aac-test.mp4'),
    '/lsptube/aac-test-fragmented.mp4': fs.readFileSync(__dirname + '/aac-test-fragmented.mp4')
};
exports.handle = function (req, res) {
    if (!Object.prototype.hasOwnProperty.call(files, req.url)) return false;
    var data = files[req.url];
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, {Allow: 'GET, HEAD', 'Content-Length': '0'}); res.end(); return true;
    }
    var start = 0, end = data.length - 1;
    var range = (req.headers || {}).range;
    if (range) {
        var match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match && (match[1] || match[2])) {
            if (!match[1]) start = Math.max(0, data.length - Number(match[2]));
            else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
        } else start = -1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= data.length) {
            res.writeHead(416, {'Content-Range': 'bytes */' + data.length, 'Content-Length': '0'}); res.end(); return true;
        }
    }
    var headers = {'Content-Type': 'audio/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store',
        'Content-Length': String(end - start + 1)};
    if (range) headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + data.length;
    res.writeHead(range ? 206 : 200, headers);
    res.end(req.method === 'HEAD' ? undefined : data.slice(start, end + 1)); return true;
};
