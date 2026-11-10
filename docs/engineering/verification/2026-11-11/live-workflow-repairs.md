# Live workflow repairs and listening indicator

The owner's live YouTube/Spotify/Camera report exposed real integration gaps. The current correction connects exact parameters through model schemas, canonical capabilities and execution rather than merely advertising commands.

- YouTube selects the main watch player instead of treating previews as equally valid targets. A home/search URL resolves to a real organic video result. A bounded, idempotent play handles source-loading interruption. Normal visible skip-ad controls may be used once; an advertisement is never counted as verification of the requested video.
- Browser playback accepts exact `volume_percent` and `playback_rate` on initial play or `media_control` commands `set_volume` and `set_speed`. Parameters are validated before effects and read back from the same media element.
- `spotify_control` uses the exact Spotify Windows transport session for status/play/pause/track commands and process-matched Core Audio sessions for exact app volume. It does not send global media keys or adjust another application's volume.
- Spotify and Camera launch through their installed Windows app IDs rather than guessed executable names. Actual foreground handles are inspected. Opening Camera does not imply a photo was taken.
- Agent-desktop initializes its own state directory with current-user/System-only inheritable access. This fixes the observed native rejection of a private snapshot file with inherited broad access. Other-owned/reparse directories are refused; no unrelated directory permissions are changed.
- The voice button shows a green listening ring and five level-reactive bars only while the server reports an active microphone and fresh actual capture metadata. Stale frames show amber waiting; disconnection stops the effect. Reduced-motion preferences disable animation. No new audio recording or permission popup is introduced by rendering the indicator.

## Actual execution

`artifacts/ui-design/youtube-exact-control-release.json`: real YouTube content playback, advertisement=false, same-player volume=0.05 and playbackRate=2, verified=true. Earlier source-load failure and ad-only UNVERIFIED attempts remain separate artifacts. The search selects an actual result; global music recency/relevance is not independently certified.

`artifacts/ui-design/spotify-native-repair.json`: real Spotify play, process27780 app volume100→50%, observed Playing and subsequent Pause all verified. This proves Windows session state/volume, not physical audibility. The test restored the initially paused playback state.

Actual installed Spotify and Camera launches both returned real foreground HWNDs. Camera device enumeration found zero available devices and photoCaptured=false. Photo capture on this PC is therefore BLOCKED by missing hardware, not counted as PASS or replaced with a web-camera workaround.

`artifacts/ui-design/working-fixes-model.json`: actual configured external model invoked canonical play with volume_percent=5/playback_rate=2 and spotify_control status; both actual tool results verified, with independent player property readback. No owner conversation was used for this isolated task.

`artifacts/ui-design/working-fixes-final-regression.log`:24 PASS across same-player media/multiple previews/exact controls/cancellation, voice visual projection, capability outcomes/leases, assistant batch handling and classification tooling. Supplied voice-status projection is a browser contract, not a new hardware capture test. `working-fixes-ui.log`:104 UI-package PASS. `working-fixes-real-desktop.log`:2 actual native UIA effect/cancellation PASS after state-directory correction. Overlapping counts are not additive acceptance totals.

Subsequent [actual native microphone meter proof](native-microphone-meter.json) is PASS:122 real device0 input frames,12 real browser observations with varying visual level, active listening animation and animation stopped after capture ended. This uses the production voice-status Gateway path without supplied capture metadata. No STT/model conversation or raw audio file was produced; the owner runtime was not restarted. This closes the hardware-to-visual-meter gap left by the earlier supplied-status projection, without extending the result into full speech or audibility acceptance.

The source audit also reviewed preexisting committed b7a3476a phase4/phase6 changes so inventory integrity no longer fails on stale fingerprints. Those legacy fixed-port suites were NOT_RUN against the owner host; the local plugin fixture still does not assert its expected dot product or prove a real third-party installation.

## Requested preservation cleanup

Identified disposable copies:24 directories under `.backup`, the unused upstream source clone `artifacts/agent-desktop-source`, old fresh-install source/archive under `artifacts/installation-proof/1794269377456`, dependency staging copies and obsolete generated UI versions. Active source, chats, current settings, model assets, the pinned desktop runtime and package dependencies are excluded.

Cleanup execution is **BLOCKED_BY_AUTOMATIC_APPROVAL_REVIEW**. Both a guarded batch and a narrower exact source-clone deletion were rejected before execution with only “blocked by policy.” No identified backup/source copy was deleted, and no alternate tool was used to bypass that rejection. This incomplete cleanup must not be presented as finished.

Full product acceptance remains PARTIAL. The withdrawn endurance test was not run. The current UI/native/model fixes have the exact scoped evidence above; missing camera hardware and policy-blocked cleanup remain explicit.

API references: [Windows media transport sessions](https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssession), [per-session app volume](https://learn.microsoft.com/en-us/windows/win32/api/audioclient/nf-audioclient-isimpleaudiovolume-setmastervolume).
