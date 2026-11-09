# Voice device diagnostics and real hardware gates — 2026-11-09

- Added read-only WinMM Unicode input/output capability enumeration (names, channel counts, session device indices) to actual Windows speech availability. Default mapper remains explicit; names/counts do not certify microphone speech or playback. Microsoft WAVEINCAPSW/WAVEOUTCAPSW layouts checked against primary API documentation.
- Actual fresh probe reports one Headset (Rockerz480) input and two playback devices; see voice-device-enumeration.json. Earlier probe had different counts. Device enumeration alone cannot establish which physical microphone received prior speech.
- Native synthesis/recognition/device tests plus existing voice contract tests:29 checks PASS. Real in-memory Windows dictation recognized synthesized sentence. This is not human microphone acceptance.
- Added opt-in REAL_OS acoustic and prompted-human probes. Raw microphone audio stays in RAM and is cleared; unrelated recognized text omitted from reports. Acoustic report artifacts/voice-acoustic/1793694059439/report.json FAIL,332frames318720bytes, no expected phrase. User reports headphones/headset mic, so speaker isolation is a possible cause, not established STT implementation failure.
- Prompted human reports1793694199498 and1793694334021 both FAIL,1332frames1278720bytes each, one recognition segment but expected phrase not matched. User explicitly confirmed speaking expected phrase during FIRST capture. Second probe normalizes punctuation and logs only expected-word matches; zero expected words. Neither failure converted to PASS. Human speech and acoustic barge-in remain unresolved; no more repeated phrase requests in this change.
- Endurance PID16016 absent in Get-Process/CIM and runner inventory. Last checkpoint0.478242h, not24h. New actual24h capture/OCR/localvision PID24180 launched2026-11-09T17:31:32Z, independently live with initial checkpoint; all prior artifacts retained. Current statusIN_PROGRESS/resourceAcceptancePARTIAL. See endurance-process-transition.json.
- Existing owner edits in models/gateway-defaults.json, zero-system/config/zero.json and zero.template.json are preserved and excluded from this commit. No user data deletion or new approval popup.
- Runner classification integrity VALID. Full master acceptance, human voice interaction, barge-in, local exact recall, mobile/cloud prerequisites and24h gate remain open.

## Explicit current microphone selection
- Added optional deviceId throughout Windows backend, VoiceEngine and native voice.microphone.start RPC. Native WinMM validates current index against actual device count; missing device fails rather than choosing default. Omission retains mapper behavior. Readiness/start reports selected index.
- Actual REAL_OS probe1794245643946 FAIL:900ms capture produced no frames. Preserved. Increased capture observation to3seconds, not reduced assertions. Probe1794245658484 PASS:actual enumerated device opened, PCM frames observed/cleared in RAM, unavailable index255 rejected. Evidence voice-device-selection.json. No speech-recognition claim.
- Existing25voice unit/contract checks passed alongside first probe; actual successful selection test rerun independently. No raw microphone saved. UI/API layout preserved; no persisted device preference or UI selector claimed.
- Actual browser --devices artifacts/functional-browser/1794245683019/report.json PASS,nineworkflows including real microphone toolbar start/stop/disconnect and restart. This tests default UI route; explicit index route proved by native test, not a UI selection control.
- Runner integrity VALID. Endurance PID24180 independently live. Existing owner config changes remain excluded. Human STT, acoustic barge-in, local strict recall and full24h/master acceptance still open.

## Microphone ownership outlives removed session until native close
- Found session map ownership gap: stopSession removes its entry synchronously while native capture cancellation/handle close remains pending. A new session could acquire the microphone before old native teardown.
- Added engine-wide microphone operation ownership, released only on actual job settlement. Start waits for an already-cancelled owner to finish; active owner still rejects concurrent acquisition. Deleted sessions cannot hide an outstanding native operation.
- Added UNIT deferred-native-close regression, explicitly not hardware proof. Existing26voice unit/contract checks PASS.
- REAL_OS actual native selection/recovery artifact1794245891812 PASS: invalid index releases session ownership, valid first capture starts, stopSession removes it, second session waits/opens actual device and receives real PCM bytes. No raw audio saved. Evidence voice-microphone-session-recovery.json.
- Existing actual browser --devices artifact1794245918908 PASS,nineworkflows including real UI capture start/stop/disconnect and reconnect. No human recognition/barge-in acceptance claim.
- Runner integrity VALID; current endurance PID24180 independently alive. Owner configuration edits remain untouched/excluded. Full objective still active.

## Actual capture lifecycle, frame counts and signal diagnostics
- Voice session status now distinguishes opening/active/stopped/cancelled/failed capture, reports selected index, cumulative frames/bytes, last-frame timestamp and last/max PCM16 RMS. Capture statistics use actual ingested PCM; no raw audio or ambient words stored.
- Capture explicitly labels speechRecognition unverified, so nonzero input is not advertised as successful STT. Cancellation before backend start reports cancelled and does not open a device.
- Actual REAL_OS probe artifacts/voice-device-selection/1794246052167/report.json PASS:invalid input failed state, subsequent real capture/ownership recovery, stopped state, frame counts, byte total equals actual router buffer and bounded finite RMS. Evidence voice-capture-diagnostics.json.
- Existing26unit/contract checks PASS, including cancelled-before-open state and native ownership wait. These are not human speech/barge-in acceptance.
- Runner integrity VALID; endurance PID24180 independently live. Owner config edits excluded, full acceptance still open.

## Actual recognizer language forwarded and reported through RPC
- Found direct voice.transcribe RPC ignored params.language while conversation binding already forwarded it. RPC now passes requested language; actual native recognition result reports selected Windows culture.
- C# result carries culture+segments together, avoiding an inferred or separately enumerated language. Missing culture still fails explicitly without fallback. PowerShell preserves same text/segments/transcribed/no-speech behavior.
-30existing voice native/unit/contract checks PASS. Genuine native recognition reported en-US; selected phrase had probabilistic voice/boys substitution retained in test output, not rewritten.
- New REAL_OS/INTEGRATION actual authenticated WebSocket test artifacts/voice-language-rpc/1794246256010/report.json PASS: real Windows TTS PCM uploaded, zz-ZZ rejected, exact input bytes restored, same input recognized with en-US and reported culture, buffer drained, cloudRequests0. No mock recognizer or provider. Manual isolated engine session prevents automatic conversation execution; not full voice conversation or microphone proof.
- Evidence voice-language-rpc.json, documentation updated. Inventory VALID; endurance PID24180 independently live. Human STT, barge-in, local strict recall and24h/master gates remain open.
