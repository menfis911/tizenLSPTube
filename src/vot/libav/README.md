# libav.js 4.8.6 corresponding source

Unmodified npm release libav.js 4.8.6, runtime build identifier 4.8.6.0.1.
Origin: https://registry.npmjs.org/libav.js/-/libav.js-4.8.6.tgz
Project: https://github.com/Yahweasel/libav.js

LSPTube ships only the obsolete variant's plain WebAssembly frontend, factory and binary.
SIMD, worker threads, browser workers and native executables are not used.
The original build configuration, Emscripten instructions and complete wrapper/build tree are in libav.js.tar.xz.
Its configs/obsolete lists the exact enabled codecs, libraries and flags. Run its documented Makefile build for the obsolete variant to produce replacement runtime files. Replace the three files under service/dist/libav; the separate unbundled module is intentionally replaceable.

The original FFmpeg and dependency source archives are included unchanged. License headers are preserved in shipped JavaScript. LSPTube's AAC adapter is separately maintained in src/vot/aac.js in the public repository; there are no changes to libav.js or its libraries.

Runtime SHA-256:
409b99d4d8b4ddbc87faca21e1a44d9316fe9363ee2b0b33364de671f1413c5a  libav-4.8.6.0.1-obsolete.js
df4ad50ae1fa3c2ed5129fff5c74155f43eb5fac9a382ed3544909090176b902  libav-4.8.6.0.1-obsolete.wasm.js
2475f35bb50f0d0ab6a4eea3551fd63265c314ad2e03d8c30e4e5aa1b0f3424d  libav-4.8.6.0.1-obsolete.wasm.wasm

Source archive: licenses/libav-4.8.6-corresponding-source.tar.gz at the repository root.
