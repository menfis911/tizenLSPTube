# Development and provenance

## Baseline

- Upstream repository: https://github.com/reisxd/TizenTube
- Tag: v2.1.1; commit: `893b663d35efa558d8bdf9f54f0c4f9a31ab6a07`.
- Official release package: https://github.com/reisxd/TizenTube/releases/download/v2.1.1/TizenTubeCobalt.wgt
- `upstream/` preserves the upstream source (excluding Git internals and node_modules). Lock files are included; the exact release's standalone dependency lock is also in `docs/upstream-release-package-lock.json`.
- `packages/launcher/service/dist/index.js` is the historical official ncc bundle with our small, documented compatibility/trace patches. It is tracked intentionally to preserve the user-tested baseline, not presented as hand-written source.
- Original editable service source is preserved alongside the bundle and in upstream/. `compat-https.js`, `diagnostic-bootstrap.js`, `start.js` and tests are directly editable. The bundle still references the original upstream CDN; it is not yet a fully pinned custom YouTube client.

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
