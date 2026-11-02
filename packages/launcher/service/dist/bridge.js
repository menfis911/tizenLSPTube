'use strict';
var fs = require('fs');
var vot = require('./vot.js');
var aacFixture = require('./aac-fixture.js');
var script = fs.readFileSync(__dirname + '/userscript.js');
var icon = fs.readFileSync(__dirname + '/../../icon.png');
exports.handle = function (req, res) {
    if (aacFixture.handle(req, res)) return true;
    if (req.url === '/lsptube/userscript.js' || req.url === '/lsptube/icon.png') {
        var isScript = req.url === '/lsptube/userscript.js';
        res.writeHead(200, {'Content-Type': isScript ? 'application/javascript; charset=utf-8' : 'image/png', 'Cache-Control': 'no-store'});
        res.end(isScript ? script : icon); return true;
    }
    return vot.handle(req, res);
};
