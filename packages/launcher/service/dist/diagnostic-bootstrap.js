'use strict';
// Diagnostic build only: keep the status server alive after a startup failure.
var http = require('http');
var net = require('net');
var state = {build: 'LSPTube-0.6.3', runtime: process.version, phase: 'bootstrap', errors: [], trace: []};
var started = Date.now();
global.__ttTrace = function (message) {
    state.trace.push(Math.round((Date.now() - started) / 1000) + 's ' + String(message).slice(0, 250));
    if (state.trace.length > 12) state.trace.shift();
};
function failure(error) {
    state.phase = 'failed';
    state.errors.push(String(error && (error.stack || error.message) || error).slice(0, 1500));
    if (state.errors.length > 4) state.errors.shift();
}
process.on('uncaughtException', failure);
process.on('unhandledRejection', failure);
function probePort(port, callback) {
    var done = false;
    var socket = net.connect(port, '127.0.0.1');
    function finish(value) {
        if (done) return;
        done = true;
        socket.destroy();
        callback(value);
    }
    socket.setTimeout(2000);
    socket.once('connect', function () { finish('open'); });
    socket.once('timeout', function () { finish('timeout'); });
    socket.once('error', function (error) { finish(error.code || error.message); });
}
var server = http.createServer(function (req, res) {
    if (req.url !== '/health') { res.writeHead(404); res.end(); return; }
    probePort(8100, function (proxy) {
        probePort(8101, function (cobalt) {
            res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store'});
            res.end(JSON.stringify({build: state.build, runtime: state.runtime, phase: state.phase,
                proxy8100: proxy, cobalt8101: cobalt, errors: state.errors, trace: state.trace}));
        });
    });
});
server.on('error', failure);
var original;
server.listen(18103, '127.0.0.1', function () {
    state.phase = 'loading original service';
    try { original = require('./index.js'); if (state.phase !== 'failed') state.phase = 'original service loaded'; }
    catch (error) { failure(error); }
});
module.exports = {
    onStart: function () { if (original && original.onStart) return original.onStart.apply(original, arguments); },
    onRequest: function () { if (original && original.onRequest) return original.onRequest.apply(original, arguments); },
    onStop: function () {
        server.close();
        if (original && original.onStop) return original.onStop.apply(original, arguments);
    }
};
