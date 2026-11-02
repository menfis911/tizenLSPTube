# Development and provenance

## Baseline

- Upstream repository: https://github.com/reisxd/TizenTube
- Tag: v2.1.1; commit: `893b663d35efa558d8bdf9f54f0c4f9a31ab6a07`.
- Official release package: https://github.com/reisxd/TizenTube/releases/download/v2.1.1/TizenTubeCobalt.wgt
- `upstream/` preserves the upstream source (excluding Git internals and node_modules). Lock files are included; the exact release's standalone dependency lock is also in `docs/upstream-release-package-lock.json`.
- `packages/launcher/service/dist/index.js` is the historical official ncc bundle with our small, documented compatibility/trace patches. It is tracked intentionally to preserve the user-tested baseline, not presented as hand-written source.
- Original editable service source is preserved alongside the bundle and in upstream/. `compat-https.js`, `diagnostic-bootstrap.js`, `start.js` and tests are directly editable. Cobalt's script injection is replaced by a same-origin route serving our pinned local userscript. The unused fallback web path retains upstream behaviour.

## Local enhancements and translation

`sh scripts/build-userscript.sh` rebuilds `src/mods` (upstream mods plus LSPTube changes) and `src/vot` using lockfiles, then applies the small Cobalt route/injection patch to both editable proxy source and historical bundle. Generated runtime files are tracked. `bridge.js` serves the local script/icon and intercepts `/lsptube/vot` before any request reaches YouTube. Same-origin routing avoids mixed-content requests from Cobalt to a LAN HTTP service.

`src/vot/vendor` preserves the MIT-licensed protocol schema, generated code and public browser configuration at the documented revision. Node's crypto replaces WebCrypto; the existing verified-TLS transport replaces modern fetch/Blob dependencies. Only validated YouTube IDs and durations reach Yandex. Responses are bounded, requests have deadlines, duplicate requests share one promise, and ready audio must use HTTPS on Yandex domains. No OAuth tokens, worker or local Mac service are used.

The playback controller has an explicit lifetime per video. Cancellation invalidates pending responses; pause, seeking, speed changes, errors and navigation restore or resynchronize media. Partial translations continue polling. The PCM/Web Audio replacement avoids a second media element; actual mixed audio output must still be established on the Freestyle. Do not mark hardware playback tested from mock tests or a decoded signal.

Checks: `node tests/test-vot.cjs`, `node tests/test-translation.cjs`, existing launcher/HTTPS checks and Python packaging tests. CI also runs translation tests with Node 12.16.3. Optional `node tests/check-yandex-network.cjs` sends a public fixture video link to the real API and checks audio delivery without printing the temporary signed URL. Build dependencies currently retain two low-severity advisories through deepmerge; the build consumes trusted repository configuration, not user-supplied configuration. Avoid forced dependency downgrades; revisit when upstream node-resolve replaces deepmerge.

## What differs

Start owns the background service, checks health and port readiness, then launches Player. Player has Cobalt native metadata but no service declaration, so two servers do not compete for the same ports. All state remains on the projector. SDB self-injection/Host PC IP localhost is not used.

Node 12 compatibility: the bundle's external HTTPS import selects `compat-https.js` on Node <=12; the Cobalt proxy also uses it. Changes preserve TLS certificate verification, enforce a response-header bound, preserve raw headers and cookies, emit the `response` event node-fetch expects, and handle fragmented chunk terminators. Bootstrap diagnostics are bounded and loopback-only; caught startup errors remain visible rather than silently exiting. These are diagnostic semantics, not production fault recovery.

## Building

`python3 scripts/build.py --projector-ip <IPv4>` assembles deterministic unsigned WGTs from tracked files. This packaging is reproducible byte-for-byte on one Python/zlib toolchain. It does **not** claim that rebuilding the historical ncc bundle is byte-identical.

To rebuild service code, start from upstream's build workflow: install the two service dependency trees, build the DIAL bundle with Rollup, transpile/bundle standalone using Babel and ncc, then port the explicitly documented compatibility patches before replacing the tracked bundle. Dependency updates must be tested separately on Node 12/Tizen 6.5. Do not silently rebuild with current floating npm versions and assume the output matches the tested artifact.

A subsequent development task is to move all bundle patches into a pinned source build and verify its output on hardware. This first repository preserves the exact working runtime to avoid losing the known-good path during that work.

## One application

Currently two WGTs are required. The native Player metadata makes Samsung launch Cobalt directly, bypassing the web entry page; that page therefore cannot start its own service first. Start is a separate web entry with an owned service. No supported single-WGT alternative has been confirmed on the Freestyle firmware. Do not advertise a ZIP containing two WGTs as one application.

## Package identities

The initial branded release retains `TTLaunch01` and `xvvl3S1TT1` to update the tested installations. These are inherited experimental identities, not an assertion that LSPTube is official TizenTube. New identities and migration need an explicit compatibility test; changing package IDs blindly can change Samsung privileges or native dispatch.

## Secrets and redistribution

Never commit signing certificates, device-profile XML, OAuth tokens or passwords. Packages are unsigned and must be signed on the installing machine. Preserve GPL and dependency notices when distributing modified packages. This repository does not contain the Samsung Cobalt binary; it uses the runtime already present on the device.

## Validation limits

User-observed baseline: launch and TizenTube settings on SP-LSP3BLAXCE / Tizen 6.5 / firmware 1720.7. No measured endurance, account-login, casting, memory-pressure or multi-model certification. Branded builds are unverified until installed and checked on that projector.

## PCM output (0.5.0)

The projector reported AUDIO, unsupported MP3, readyState=0, networkState=3, error=4. Native MP3 playback is therefore replaced in the translation integration rather than retried. The Node service downloads the validated Yandex URL (64 MiB/45-second bound), decodes through the pinned synchronous mpg123 WASM decoder, resamples to mono 48 kHz and serves 10-second Float32 PCM chunks. Random per-video tokens and same-origin X-LSPTube requests select audio; arbitrary source URLs are not accepted.

Only one translation is retained. Decoded caches hold three chunks, compressed data/decoder are released after two idle minutes, and future requests re-download/re-decode. Distant seeks outside cache scan the compressed prefix; hardware latency must be measured before replacing this with an MP3 frame index. Decode yields to Node periodically so the YouTube proxy remains responsive.

Cobalt 22 supports only AudioBufferSourceNode.start(0). The frontend crops the buffer for seeks instead of using a nonzero offset, starts the next preloaded chunk on ended, and creates buffers at adjusted sample rates for playback speed. It does not assume scheduled future starts, GainNode, AudioContext.close or worker_threads. Context reuse and explicit source/timer cleanup avoid an extra video decoder. Small chunk-boundary gaps and deep-seek latency still need hardware measurement. Initial preparation has a 60-second watchdog; a confirmed stream stalled for 20 seconds is reported separately.

Licensing/source: licenses/mpg123-decoder-corresponding-source.tar.gz contains the pinned decoder/common JS+C build tree, complete libmpg123 submodule source, puff, simple-yenc, source notices and relinking instructions. The generated WASM comes from the pinned npm package. Original source and Makefile are supplied for a replacement build with Emscripten 4.0.7; byte-identical rebuilding of the upstream WASM was not performed. After replacing EmscriptenWasm.js in the installed build dependency, rebuild src/vot and package normally.

Validation: tests/test-pcm.cjs enforces Cobalt start(0), cropped offsets, pause, seek, speed, mute, chunk handoff, cleanup, bounded cache and token isolation. tests/check-yandex-network.cjs now verifies actual Yandex-to-PCM decoding and nonzero signal energy through Node 12.16.3. A real 8-minute seek was decoded as well; this does not prove audio output on the Freestyle.

PCM handoff now prepares the next AudioBuffer during playback; decoded samples and prepared buffers share the same three-entry client cache. Native scheduled starts remain unavailable, so a callback-sized handoff gap can still occur. Small drift corrections require two seconds outside 0.7 s with a five-second cooldown; user seeks and discontinuities over three seconds bypass this delay.
