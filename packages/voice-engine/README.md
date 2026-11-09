# Windows voice engine

Uses installed Windows `System.Speech` voices and dictation recognizers, with
WinMM (`waveIn`/`waveOut`) for the default recording and playback devices. No
network speech service, generated tone, or replacement transcript is used.
Windows PowerShell 5.1 and .NET Framework System.Speech are required. Recognition
requires an installed Windows speech language pack. Device enumeration does not
prove microphone privacy permission or that a device can be opened.

The existing synchronous `startSession(sessionId)`, `stopSession(sessionId)`,
`ingestChunk(sessionId, pcmOrBase64)`, and `getStatus()` contracts remain. Session
creation enumerates capabilities in the background and never opens a microphone.
Audio is signed little-endian PCM16, mono, at the engine's sample rate (default
16000 Hz). Network chunks must contain whole samples; VAD reassembles 30 ms frames.

- `await synthesizeSpeech(sessionId, text, options?)`: synthesizes real words,
  emits `voice:audio` frames, and plays them through the default Windows output.
  Resolves after playback completes. `options.playback: false` routes PCM without
  opening speakers. Supports `signal`, installed `voice` name, and `rate` (-10..10).
  Result contains PCM byte length, format, voice name, and `played`.
- `await transcribe(sessionId, options?)`: consumes buffered PCM using actual
  Windows dictation. Supports `signal` and `language` (e.g. `en-US`). Returns text,
  confidence/timing segments, and `transcribed`. Empty audio and unrecognized
  speech return empty text with `transcribed: false`. Recognition errors restore
  buffered input for retry; cancelled recognition is discarded. Existing
  `transcribe(sessionId)` remains supported.
- `await startMicrophone(sessionId, options?)`: explicitly opens the default
  Windows microphone and streams its PCM into this session's router/VAD. Resolves
  only after Windows starts capture. Supports `signal` and `durationMs` (0 means
  until stopped, with a one-hour safety limit). One session owns capture at a time.
  Does not automatically transcribe or send audio to a model. Hosts can call
  `transcribe` on `voice:speech_end` or on a user action.
- `await stopMicrophone(sessionId)`: cancels capture and waits for native cleanup.
- `cancelSpeech(sessionId)`: cancels synthesis/playback and clears queued output.
- `await refreshAvailability()`: enumerates installed voices, recognizer languages,
  and device counts without recording or playback.
- `close()`: stops all sessions and requests cancellation of their native work.

`getStatus()` includes `availability` (`checked` is initially false; unchecked
capabilities have `available: null`), per-session `microphoneActive`,
`synthesisActive`, `playbackActive`, `transcriptionActive`, and `lastError`.
`duplexAvailable` is true only while capture and native playback have actually
started concurrently. Echo cancellation is **not** implemented and is reported as
false; use headphones to avoid feedback. Microphone availability from enumeration
means a device was detected; `permission: not-checked` remains explicit.

Errors reject with a stable `VoiceError.code` and the underlying Windows error
message; session failures also emit `voice:error` and appear in `lastError`.
Cancellation rejects with `VOICE_CANCELLED`. VAD barge-in aborts playback and
pending synthesis; new speech also cancels obsolete recognition. Native audio
loops reset/close their handles on cancellation, with process termination as a
fallback. No audio is written to disk by production operations.

Events: `voice:availability`, `voice:session_started`, `voice:session_stopped`,
`voice:state`, `voice:speech_start`, `voice:speech_end`, `voice:barge_in`,
`voice:audio` (`chunk` is base64 PCM with format metadata), `voice:transcript`,
`voice:microphone_started`, `voice:microphone_stopped`, and `voice:error`.

Run isolated tests (no database or gateway required):

```powershell
node --test packages/voice-engine/test/windows-voice.test.mjs
$env:ZERO_VOICE_NATIVE_TESTS = '1'
node --test packages/voice-engine/test/windows-native.integration.test.mjs
```

The opt-in integration suite uses real synthesis and recognition in memory and
creates a temporary WAV proof file. It never opens a microphone or speakers.
Actual microphone permissions, audible playback, and acoustic barge-in require a
separate user-initiated hardware test.

Availability now reports WinMM input/output names, channel counts and current
session device indices. These indices can change after reconnecting a headset;
playback and capture without `deviceId` use the Windows default mapper. Enumeration does not
establish microphone permission, speech recognition or audible playback.

`WindowsSpeechBackend.startMicrophone`, `VoiceEngine.startMicrophone` and
`voice.microphone.start` accept an optional current input `deviceId`. An unavailable
index fails instead of silently choosing another input. The actual selected index
is reported on readiness/start. This does not persist a device preference or add
a selector to the existing UI.

Session status includes the latest capture's lifecycle state, selected index,
frame/byte counts, last-frame timestamp and PCM16 RMS signal measurements. These
are input diagnostics; `speechRecognition: unverified` means capture alone has
not established that words were understood. No sample audio is stored in status.

Two opt-in hardware probes keep captured audio in RAM and omit ambient transcripts
from their JSON reports under `artifacts/`:

```powershell
$env:ZERO_VOICE_ACOUSTIC_TESTS = '1'
node --test test/voice-acoustic-real.test.mjs
$env:ZERO_VOICE_HUMAN_TESTS = '1'
node --test test/voice-human-microphone-real.test.mjs
```

The first plays a phrase and checks acoustic microphone reception; headphones
may isolate that signal from the microphone. The second opens a 40-second input
window and requires the prompted phrase. Neither proves full voice/chat
continuity or acoustic barge-in. Preserve failed reports as failures.
