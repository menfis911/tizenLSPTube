# Changes

## 0.7.1 single-player test — 2026-11-02

- Add an opt-in next-video prototype that replaces AAC sample payloads in the existing YouTube audio SourceBuffer. Create no second media element or MediaSource; leave video packets and native append/update behavior unchanged.
- Preserve original AAC initialization, track ID, decoding timestamps and sample durations. Supply original synthetic AAC-LC presets matching 44.1/48 kHz mono/stereo; request AAC only while the test is armed. Do not touch protected or unsupported tracks.
- Bind replacement to the MediaSource attached to the current video. Outside the opt-in test, delegate original bytes; parser failures stop the test and fall back to original packets.
- Report replaced packets/frames, audio format, video movement and element counts. This is a feasibility test, not translated AAC or a runtime encoder. Buffered test audio can persist until another video is opened.
- Verify all four remuxed files with a real decoder; automated tests cover timestamps/init preservation, configuration matching, source routing, video pass-through, native append semantics and safe cancellation/fallback. Freestyle compatibility remains unverified.

## 0.7.0 AAC test — 2026-11-02

- Add isolated native AAC-LC/MP4 and MediaSource tests alongside YouTube, using bundled original 20-second synthetic tones. Translation still uses the existing PCM path; no transcoder is installed or enabled on the projector yet.
- Serve local fixtures with GET/HEAD and byte ranges. Report audio events/error/clock and YouTube movement after the test; Back stops the test, and errors/timeouts release media, pending requests and object URLs.
- Add format, packaging, fixture-route and lifecycle tests. Hardware support, audible continuity and simultaneous decoding must be confirmed by the Freestyle test before implementing the replacement translation path.

## 0.6.7 preview — 2026-11-02

- Replace moderate PCM drift seeks with 0.97/1.00/1.03 speed correction applied to upcoming buffers only. The current source is never restarted by drift-rate changes; its clock uses the speed captured at its own start.
- Keep immediate position alignment for explicit user seeks, initial alignment and discontinuities over three seconds. Use a deadband to avoid needless speed switching near sync.
- Include the soft correction rate in diagnostics. Tests verify no syllable-skipping position changes during moderate drift, prepared-buffer rate invalidation, active-source continuity and correct per-source clocks.
- User reports fewer interruptions on 0.6.6; audible output on 0.6.7 still needs Freestyle validation. Resampling by 3% can slightly change voice pitch; callback-sized chunk handoff gaps remain possible.

## 0.6.6 preview — 2026-11-02

- Avoid restarting translated audio for brief drift: require two seconds of sustained drift and a five-second correction cooldown. Explicit user seeks and large discontinuities still align immediately.
- Prepare the next cached PCM AudioBuffer before the current chunk ends, including volume/rate conversion, and reuse it on handoff. Keep the three-chunk cache bound and Cobalt start(0) compatibility.
- Regression checks cover transient drift, sustained corrections, cooldown, immediate seeks and no AudioBuffer allocation during a prefetched handoff.
- User confirmed translation, original-volume controls and progress on 0.6.5. Audible stutter improvement on the projector remains unverified.
- Record the requested clean launch screen, automatic foreground reopening and unified-app work in docs/ROADMAP.md for a later change.

## 0.6.5 preview — 2026-11-02

- Use the actual active PCM source when detecting a stalled translation, rather than treating coarse or repeatedly aligned audio-clock readings as silence. Preserve original attenuation while that source is active.
- Expose sourceActive in diagnostics and test active-source/coarse-clock playback separately from actual buffering with no active source. Device verification remains pending.

## 0.6.4 preview — 2026-11-02

- Keep original-volume attenuation active through normal PCM clock alignment after playback has been confirmed. An advancing but realigned clock is not an audio stall.
- Do not restore full original volume on every short chunk waiting event; preserve the existing pause/error/actual-stall recovery.
- Add alignment/stall counters to audio diagnostics and regression coverage that fails against 0.6.3 for repeated realignments and still restores sound for a truly stuck clock.
- Move the live progress panel to the upper-right corner as requested. Projector volume behavior still requires hardware confirmation.

## 0.6.3 preview — 2026-11-02

- Mute the original media element explicitly for the zero-original setting while keeping translated PCM independent of that forced mute. Restore the previous mute state on pause, failure, disabling translation or returning to a nonzero level.
- Apply/restore volume through the YouTube player API when available as well as the native video element; include requested/actual volume and mute state in diagnostics.
- Stop enqueueing native loading toasts. Use the single updated progress panel and clear it at confirmed playback, avoiding stale percentages after the translated audio starts.
- Add checks for forced original mute without muting translation, restoration, player volume calls, and absence of queued loading notifications. Hardware output remains to be confirmed.

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
