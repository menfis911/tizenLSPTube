const esbuild = require('esbuild');
esbuild.buildSync({ entryPoints: [__dirname + '/service.js'], bundle: true, platform: 'node',
    target: 'node12', format: 'cjs', external: ['./compat-https.js'],
    alias: {'@wasm-audio-decoders/common': __dirname + '/decoder-common.js'},
    banner: { js: "if (!global.TextEncoder) global.TextEncoder = require('util').TextEncoder;\nif (!global.TextDecoder) global.TextDecoder = require('util').TextDecoder;" },
    outfile: __dirname + '/../../packages/launcher/service/dist/vot.js' });
