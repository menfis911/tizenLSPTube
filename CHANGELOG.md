# Changes

## 0.4.1 preview — 2026-11-01

- Fix premature translation success: a received URL or resolved/void play() result no longer counts as playback. Confirm only after the audio clock advances in sync with video.
- Use an audio element instead of an invisible second video element. Call play() without waiting for metadata, avoiding a preload deadlock.
- Restore original volume on stalls; report media errors and a 20-second playback timeout in a persistent diagnostic screen.
- Regression tests cover unloaded media, void play(), a stationary audio clock, pause/seek and late completion. Freestyle audio output still requires user verification.

## 0.4.0 preview — 2026-11-01

- Preserve the working two-WGT launcher/Engine architecture; no web-player replacement.
- Restore the amber lens icon, dark slate launcher and branded LSPTube settings.
- Bundle editable enhancements locally instead of loading the Cobalt userscript from upstream CDN.
- Add Russian Yandex voice translation to playback settings, with preparation, cancellation, pause/seek/rate synchronization and original-volume restoration.
- Use a Node-12-compatible direct Yandex protocol client based on MIT-licensed vot.js; no Mac server, public worker or account token.
- Test real translated audio delivery and automated playback state transitions. Actual simultaneous media playback on the Freestyle remains unverified.

## 0.2.1 — 2026-11-01

- Establish independent LSPTube repository with preserved TizenTube v2.1.1 sources and attribution.
- Brand the working two-package autonomous architecture; add original projection/play icon.
- Preserve Node 12 HTTPS fixes: response event, bounded headers, raw headers/cookies and fragmented chunk handling.
- Add deterministic unsigned packaging, tests, upstream provenance and dependency license notices.
- Single-WGT packaging and Yandex voice translation remain unimplemented.

## Working prototype — 2026-11-01

User reported successful autonomous launch and TizenTube settings with Start 0.1.0 + Player 2.2.0 on SP-LSP3BLAXCE / Tizen 6.5. This is a manual observation, not comprehensive hardware certification.
