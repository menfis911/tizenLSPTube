# Changes

## 0.6.2 preview — 2026-11-02

- Keep playback translation controls together at the top: enable/disable, sound/loading settings, audio diagnostics. Add them after the other playback menu insertions so mini-player/share/screen-off cannot split the group.

## 0.6.1 preview — 2026-11-02

- Give translation settings and each volume submenu a distinct popup ID. Serialize integer radio choices as intValue, matching the native setting field.
- Poll audio download status every 200 ms and mirror progress into native YouTube notifications. Report 100% once PCM metadata arrives, including downloads that finish between polls; retain the last state in audio diagnostics.
- Add checks against actual settings/menu rendering and the progress adapter, including selection refresh and cancellation of pending status requests.
- User confirmed translation playback and preparation pause on 0.6.0; this update leaves those paths intact. Device confirmation of the repaired controls/progress remains pending.

## 0.6.0 preview — 2026-11-02

- Freestyle playback and seeking confirmed by the user on 0.5.1.
- Show persistent preparation stages and actual audio download percentage when Content-Length is available; do not invent a translation-generation percentage.
- Add saved original/translation volume choices in playback and LSPTube settings; default to 5% original and 100% translation. Reapply original attenuation while translated audio advances, and scale PCM samples for Cobalt-compatible voice volume.
- Optional preparation pause (on by default) resumes after PCM metadata arrives; preserve an existing user pause and restore playback on cancellation/failure.
- Token-validated status endpoint reports no signed audio URLs. Automated checks cover progress, volume scaling, original mute, pause/resume and cancellation; projector verification remains pending.

## 0.5.1 preview — 2026-11-02

- Fill PCM buffers using Cobalt AudioBuffer.copyToChannel; getChannelData is unavailable on the projector.
- Match the playback test double to the Cobalt API and verify copied audio samples. No backend or Engine changes are required.
- Audible output on the Freestyle still needs device confirmation.

## 0.5.0 preview — 2026-11-01

- Replace native MP3 playback, rejected with MEDIA_ERR_SRC_NOT_SUPPORTED on the Freestyle, with service-side MP3 decoding and chunked PCM through Cobalt Web Audio.
- Use mpg123-decoder 1.0.3 on Node 12; no Mac transcoder, external relay, native executable or video-player replacement.
- Serve 10-second mono PCM buffers at 48 kHz using opaque tokens. Bound compressed audio to 64 MiB and the decoded cache to three chunks; clear idle PCM after two minutes.
- Crop buffers and use start(0), respecting Cobalt 22 limitations. Resample via AudioBuffer sample rate for speed changes. Support pause, seeking, mute, cancellation and chunk handoff. Allow up to 60 seconds for initial download/decode.
- Preserve decoder/library licenses and corresponding source in the packages. Real Node-12 checks cover a decoded signal and forward/backward seeking; actual Freestyle output remains to be verified.

## 0.4.3 preview — 2026-11-01

- On a signed Yandex API request rejected with HTTP 403, refresh the session and retry once. Persistent denials are still reported; no proxy, account or TLS bypass is introduced.
- Include the failed API stage in HTTP errors, and preserve request errors and lifecycle phases in diagnostics even when no audio element exists.
- Add regression coverage for successful session refresh, a persistent 403, transport-stage reporting, and preserved pre-playback errors.
- The user-provided video fjeys2xEfJA returned a ready translation and downloadable audio through Node 12.16.3 on the Mac. Projector access and playback remain unverified.

## 0.4.2 preview — 2026-11-01

- Make the 20-second audio startup deadline independent of video readiness and the synchronization loop.
- Keep cleanup errors from hiding diagnostics; remove media through parentNode.removeChild for Cobalt compatibility.
- Display diagnostics directly above the player without YouTube command routing. Add a manual audio-check button in playback and LSPTube settings.
- Report video readiness/paused/seeking, YouTube playing state, media events and synchronization call count. No signed media URLs are shown.
- This is a diagnostic repair for the reported silent startup; translated audio on the Freestyle is not yet verified.

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
