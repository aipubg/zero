import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { VoiceEngine, AudioRouter, WindowsSpeechBackend, VoiceError } from '../index.mjs';

const samples = Buffer.from([0, 0, 20, 1, 40, 2, 20, 1]);
const cancelled = () => new VoiceError('VOICE_CANCELLED', 'Cancelled by test');
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function untilAborted(signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) reject(cancelled());
    else signal.addEventListener('abort', () => reject(cancelled()), { once: true });
  });
}
function backend(overrides = {}) {
  return {
    getAvailability: async () => ({ checked: true, synthesis: { available: true }, recognition: { available: true } }),
    synthesize: async () => ({ pcm: samples, sampleRate: 16000, voice: 'test adapter' }),
    transcribe: async () => ({ text: '', transcribed: false, segments: [], reason: 'no_speech_recognized' }),
    play: async (pcm, { onStarted }) => { onStarted?.(); return { played: true }; },
    startMicrophone: () => { throw new Error('A test unexpectedly tried to open a microphone'); },
    ...overrides,
  };
}
function engineFor(t, overrides, options) {
  const engine = new VoiceEngine({ backend: backend(overrides), ...options });
  t.after(() => engine.close());
  engine.startSession('session');
  return engine;
}

test('session creation enumerates capabilities without opening microphone/output', async t => {
  const engine = engineFor(t, { play: () => assert.fail('Playback is opt-in to speech') });
  await engine.refreshAvailability();
  const status = engine.getStatus();
  assert.equal(status.availability.checked, true);
  assert.equal(status.duplexAvailable, false);
  assert.equal(status.sessions[0].microphoneActive, false);
  assert.equal(status.echoCancellation, false);
});

test('speech routes adapter PCM and default playback consumes output queue', async t => {
  let played;
  const engine = engineFor(t, { play: async (pcm, { onStarted }) => { played = Buffer.from(pcm); onStarted(); return { played: true }; } });
  const chunks = [];
  engine.on('voice:audio', event => chunks.push(Buffer.from(event.chunk, 'base64')));
  const result = await engine.synthesizeSpeech('session', 'Read these words');
  assert.deepEqual(played, samples);
  assert.deepEqual(Buffer.concat(chunks), samples);
  assert.equal(result.played, true);
  assert.equal(result.encoding, 'pcm_s16le');
  assert.equal(engine.getStatus().sessions[0].router.bufferedOutputBytes, 0);
  assert.equal(engine.getStatus().sessions[0].state, 'idle');
});

test('playback:false exposes PCM without accessing audio hardware', async t => {
  const engine = engineFor(t, { play: () => assert.fail('Must not play') });
  const result = await engine.synthesizeSpeech('session', 'Read into the client stream', { playback: false });
  assert.equal(result.played, false);
  assert.equal(engine.getStatus().sessions[0].router.bufferedOutputBytes, samples.length);
});

test('speech errors reject, return to idle, and preserve the actual error in status', async t => {
  const engine = engineFor(t, { synthesize: async () => { throw new VoiceError('VOICE_SYNTHESIZE_FAILED', 'No installed voices'); } });
  await assert.rejects(engine.synthesizeSpeech('session', 'Speak'), { code: 'VOICE_SYNTHESIZE_FAILED' });
  const status = engine.getStatus().sessions[0];
  assert.equal(status.state, 'idle');
  assert.equal(status.synthesisActive, false);
  assert.equal(status.lastError.message, 'No installed voices');
});

test('VAD barge-in cancels pending synthesis without publishing late audio', async t => {
  const pending = deferred();
  let signal;
  const engine = engineFor(t, { synthesize: async (text, options) => { signal = options.signal; return pending.promise; } });
  let published = false;
  engine.on('voice:audio', () => { published = true; });
  const speech = engine.synthesizeSpeech('session', 'A long response');
  const rejected = assert.rejects(speech, { code: 'VOICE_CANCELLED' });
  // Constant PCM amplitude is used solely to exercise the energy detector.
  const frames = Buffer.alloc(960 * 3);
  for (let i = 0; i < frames.length; i += 2) frames.writeInt16LE(10000, i);
  engine.ingestChunk('session', frames);
  assert.equal(signal.aborted, true);
  pending.resolve({ pcm: samples });
  await rejected;
  assert.equal(published, false);
  assert.equal(engine.getStatus().sessions[0].state, 'listening');
  assert.equal(engine.getStatus().sessions[0].bargeInCount, 1);
});

test('barge-in stops in-progress native playback and clears queued PCM', async t => {
  const started = deferred();
  const engine = engineFor(t, { play: (pcm, { signal, onStarted }) => { onStarted(); started.resolve(); return untilAborted(signal); } });
  const speech = engine.synthesizeSpeech('session', 'Speaking now');
  const rejected = assert.rejects(speech, { code: 'VOICE_CANCELLED' });
  await started.promise;
  assert.equal(engine.getStatus().sessions[0].playbackActive, true);
  const frames = Buffer.alloc(960 * 3);
  for (let i = 0; i < frames.length; i += 2) frames.writeInt16LE(9000, i);
  engine.ingestChunk('session', frames);
  await rejected;
  assert.equal(engine.getStatus().sessions[0].router.bufferedOutputBytes, 0);
  assert.equal(engine.getStatus().sessions[0].playbackActive, false);
});

test('superseded synthesis cannot reset the newer turn or publish stale audio', async t => {
  const first = deferred(), second = deferred();
  let count = 0;
  const engine = engineFor(t, { synthesize: () => ++count === 1 ? first.promise : second.promise });
  const old = engine.synthesizeSpeech('session', 'First', { playback: false });
  const rejected = assert.rejects(old, { code: 'VOICE_CANCELLED' });
  const current = engine.synthesizeSpeech('session', 'Second', { playback: false });
  first.resolve({ pcm: samples });
  await rejected;
  assert.equal(engine.getStatus().sessions[0].state, 'speaking');
  second.resolve({ pcm: samples });
  await current;
  assert.equal(engine.getStatus().sessions[0].state, 'idle');
});

test('stopping a session cancels speech and never emits late audio', async t => {
  const engine = engineFor(t, { synthesize: (text, { signal }) => untilAborted(signal) });
  const speech = engine.synthesizeSpeech('session', 'Speak');
  const rejected = assert.rejects(speech, { code: 'VOICE_CANCELLED' });
  engine.stopSession('session');
  await rejected;
  assert.equal(engine.getStatus().activeCount, 0);
});

test('external cancellation and explicit cancelSpeech stop operations', async t => {
  const engine = engineFor(t, { synthesize: (text, { signal }) => untilAborted(signal) });
  const controller = new AbortController();
  const speech = engine.synthesizeSpeech('session', 'Speak', { signal: controller.signal });
  const rejected = assert.rejects(speech, { code: 'VOICE_CANCELLED' });
  controller.abort();
  await rejected;
  const next = engine.synthesizeSpeech('session', 'Again');
  const rejectedAgain = assert.rejects(next, { code: 'VOICE_CANCELLED' });
  engine.cancelSpeech('session');
  await rejectedAgain;
});

test('empty and unrecognized audio never claim successful transcription', async t => {
  const engine = engineFor(t);
  const empty = await engine.transcribe('session');
  assert.equal(empty.empty, true);
  assert.equal(empty.transcribed, false);
  engine.ingestChunk('session', Buffer.alloc(960));
  const result = await engine.transcribe('session');
  assert.equal(result.text, '');
  assert.equal(result.transcribed, false);
  assert.equal(result.reason, 'no_speech_recognized');
});

test('failed transcription restores exact input ahead of newly arriving audio', async t => {
  let engine;
  engine = engineFor(t, { transcribe: async pcm => {
    assert.deepEqual(pcm, samples);
    engine.ingestChunk('session', Buffer.from([8, 0]));
    throw new VoiceError('VOICE_TRANSCRIBE_FAILED', 'Missing language pack');
  } });
  engine.ingestChunk('session', samples);
  await assert.rejects(engine.transcribe('session'), { code: 'VOICE_TRANSCRIBE_FAILED' });
  assert.deepEqual(engine.sessions.get('session').router.drainInputBuffer(), Buffer.concat([samples, Buffer.from([8, 0])]));
});

test('concurrent transcription is rejected and stop cancels a running recognizer', async t => {
  const engine = engineFor(t, { transcribe: (pcm, { signal }) => untilAborted(signal) });
  engine.ingestChunk('session', samples);
  const transcription = engine.transcribe('session');
  const rejected = assert.rejects(transcription, { code: 'VOICE_CANCELLED' });
  await assert.rejects(engine.transcribe('session'), { code: 'VOICE_BUSY' });
  engine.stopSession('session');
  await rejected;
});

test('microphone starts explicitly, streams PCM, and waits for stop cleanup', async t => {
  const capture = deferred();
  let onFrame;
  const engine = engineFor(t, { startMicrophone: options => {
    onFrame = options.onFrame;
    options.signal.addEventListener('abort', () => capture.reject(cancelled()), { once: true });
    return { ready: Promise.resolve(), done: capture.promise };
  } });
  await engine.startMicrophone('session');
  assert.equal(engine.getStatus().sessions[0].microphoneActive, true);
  onFrame(samples);
  assert.equal(engine.getStatus().sessions[0].router.bufferedInputBytes, samples.length);
  engine.startSession('other');
  await assert.rejects(engine.startMicrophone('other'), { code: 'VOICE_MICROPHONE_BUSY' });
  await engine.stopMicrophone('session');
  assert.equal(engine.getStatus().sessions[0].microphoneActive, false);
  onFrame(samples);
  assert.equal(engine.getStatus().sessions[0].router.bufferedInputBytes, samples.length);
});

test('capture failure is exposed without claiming microphone or duplex availability', async t => {
  const error = new VoiceError('VOICE_CAPTURE_FAILED', 'Access denied by Windows microphone privacy settings');
  const engine = engineFor(t, { startMicrophone: () => ({ ready: Promise.reject(error), done: Promise.reject(error) }) });
  await assert.rejects(engine.startMicrophone('session'), { code: 'VOICE_CAPTURE_FAILED' });
  assert.equal(engine.getStatus().sessions[0].microphoneActive, false);
  assert.equal(engine.getStatus().sessions[0].lastError.message, error.message);
  assert.equal(engine.getStatus().duplexAvailable, false);
});

test('duplex requires simultaneous started capture and playback, not synthesis alone', async t => {
  const synthesis = deferred(), capture = deferred(), playing = deferred();
  const engine = engineFor(t, {
    synthesize: () => synthesis.promise,
    startMicrophone: ({ signal }) => {
      signal.addEventListener('abort', () => capture.reject(cancelled()), { once: true });
      return { ready: Promise.resolve(), done: capture.promise };
    },
    play: (pcm, { signal, onStarted }) => { onStarted(); playing.resolve(); return untilAborted(signal); },
  });
  await engine.startMicrophone('session');
  const speech = engine.synthesizeSpeech('session', 'Speak');
  const rejected = assert.rejects(speech, { code: 'VOICE_CANCELLED' });
  assert.equal(engine.getStatus().duplexAvailable, false);
  synthesis.resolve({ pcm: samples });
  await playing.promise;
  assert.equal(engine.getStatus().duplexAvailable, true);
  engine.cancelSpeech('session');
  await rejected;
  assert.equal(engine.getStatus().duplexAvailable, false);
});

test('PCM validation rejects malformed data and VAD handles split network frames', t => {
  const engine = engineFor(t);
  for (const value of ['not base64!', 'AQ==', 'AB==', Buffer.alloc(3), null]) assert.throws(() => engine.ingestChunk('session', value), { code: 'VOICE_INVALID_AUDIO' });
  const frame = Buffer.alloc(960 * 3);
  for (let i = 0; i < frame.length; i += 2) frame.writeInt16LE(11000, i);
  engine.ingestChunk('session', frame.subarray(0, 100));
  assert.equal(engine.getStatus().sessions[0].state, 'idle');
  engine.ingestChunk('session', frame.subarray(100));
  assert.equal(engine.getStatus().sessions[0].state, 'listening');
  assert.doesNotThrow(() => engine.ingestChunk('session', Buffer.alloc(1024 * 1024).toString('base64')));
});

test('router bounds input/output, preserves the newest input, and reports dropped bytes', () => {
  const router = new AudioRouter({ maxBufferSize: 4 });
  router.ingestInputChunk(samples);
  assert.deepEqual(router.drainInputBuffer(), samples.subarray(4));
  assert.equal(router.getStatus().droppedInputBytes, 4);
  router.enqueueOutputChunk(samples.subarray(0, 4));
  router.enqueueOutputChunk(samples.subarray(4));
  assert.equal(router.getStatus().bufferedOutputBytes, 4);
  assert.equal(router.getStatus().droppedOutputBytes, 4);
  router.reset();
  assert.equal(router.getStatus().bufferedOutputBytes, 0);
});

function fakeProcess(onRequest) {
  const child = new EventEmitter();
  child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
  child.kill = () => { child.emit('close', null); return true; };
  let input = '';
  child.stdin.on('data', data => {
    input += data;
    const lines = input.split('\n'); input = lines.pop();
    for (const line of lines) onRequest(line, child);
  });
  return child;
}
function response(child, message) {
  child.stdout.write(`${JSON.stringify(message)}\n`);
  child.emit('close', 0);
}

test('PowerShell receives hostile text only as JSON stdin; output is PCM16', async () => {
  const text = 'Hello "; $(throw "injected"); 中文';
  const native = new WindowsSpeechBackend({ platform: 'win32', spawn: (file, args, options) => {
    assert.equal(options.windowsHide, true);
    assert.equal(args.includes(text), false);
    return fakeProcess((line, child) => {
      const request = JSON.parse(line);
      assert.equal(request.text, text);
      setImmediate(() => response(child, { type: 'result', pcm: samples.toString('base64'), voice: 'test adapter' }));
    });
  } });
  const result = await native.synthesize(text);
  assert.deepEqual(result.pcm, samples);
});

test('unsupported platforms and missing PowerShell report unavailability', async () => {
  const unsupported = new WindowsSpeechBackend({ platform: 'linux', spawn: () => assert.fail('Must not spawn') });
  const availability = await unsupported.getAvailability();
  assert.equal(availability.synthesis.available, false);
  assert.equal(availability.synthesis.code, 'VOICE_PLATFORM_UNSUPPORTED');
  await assert.rejects(unsupported.synthesize('Hello'), { code: 'VOICE_PLATFORM_UNSUPPORTED' });
  const missing = new WindowsSpeechBackend({ platform: 'win32', spawn: () => {
    const child = fakeProcess(() => {});
    setImmediate(() => child.emit('error', new Error('ENOENT')));
    return child;
  } });
  await assert.rejects(missing.synthesize('Hello'), { code: 'VOICE_BACKEND_UNAVAILABLE' });
});

test('native cancellation requests device cleanup and rejects even after a late success', async () => {
  const controller = new AbortController();
  const requested = deferred();
  let cleanups = 0;
  const native = new WindowsSpeechBackend({ platform: 'win32', spawn: () => fakeProcess((line, child) => {
    if (line === 'cancel') { cleanups++; setImmediate(() => response(child, { type: 'result', pcm: samples.toString('base64') })); }
    else requested.resolve();
  }) });
  const speech = native.synthesize('Hello', { signal: controller.signal });
  const rejected = assert.rejects(speech, { code: 'VOICE_CANCELLED' });
  await requested.promise;
  controller.abort();
  await rejected;
  assert.equal(cleanups, 1);
});

test('native protocol errors and Windows API errors are never replaced by success', async () => {
  const native = new WindowsSpeechBackend({ platform: 'win32', spawn: () => fakeProcess((line, child) => {
    if (line === 'cancel') setImmediate(() => child.emit('close', 1));
    else setImmediate(() => child.stdout.write('not JSON\n'));
  }) });
  await assert.rejects(native.synthesize('Hello'), { code: 'VOICE_BACKEND_PROTOCOL' });
  const denied = new WindowsSpeechBackend({ platform: 'win32', spawn: () => fakeProcess((line, child) => {
    if (line === 'cancel') return;
    setImmediate(() => response(child, { type: 'error', code: 'VOICE_CAPTURE_FAILED', message: 'Windows denied input' }));
  }) });
  const capture = denied.startMicrophone();
  await assert.rejects(capture.ready, { code: 'VOICE_CAPTURE_FAILED' });
  await assert.rejects(capture.done, { code: 'VOICE_CAPTURE_FAILED' });
});

test('missing or malformed PCM from the native bridge is a structured protocol failure', async () => {
  for (const pcm of [undefined, 'broken!', 'AB==']) {
    const native = new WindowsSpeechBackend({ platform: 'win32', spawn: () => fakeProcess((line, child) => {
      setImmediate(() => response(child, { type: 'result', pcm }));
    }) });
    await assert.rejects(native.synthesize('Hello'), { code: 'VOICE_BACKEND_PROTOCOL' });
  }
});

test('new user speech cancels obsolete STT without publishing a late transcript', async t => {
  const result = deferred();
  let signal, published = false;
  const engine = engineFor(t, { transcribe: (pcm, options) => { signal = options.signal; return result.promise; } });
  engine.ingestChunk('session', samples);
  engine.on('voice:transcript', () => { published = true; });
  const transcription = engine.transcribe('session');
  const rejected = assert.rejects(transcription, { code: 'VOICE_CANCELLED' });
  const frames = Buffer.alloc(960 * 3);
  for (let i = 0; i < frames.length; i += 2) frames.writeInt16LE(10000, i);
  engine.ingestChunk('session', frames);
  assert.equal(signal.aborted, true);
  result.resolve({ text: 'stale test adapter result' });
  await rejected;
  assert.equal(published, false);
  assert.equal(engine.getStatus().sessions[0].state, 'listening');
});

test('native capture streams PCM only after explicit start and handles split protocol lines', async () => {
  const received = [];
  let child;
  const native = new WindowsSpeechBackend({ platform: 'win32', spawn: () => {
    child = fakeProcess(() => {
      setImmediate(() => {
        child.stdout.write('{"type":"rea');
        child.stdout.write('dy"}\n');
        child.stdout.write(`${JSON.stringify({ type: 'audio', pcm: samples.toString('base64') })}\n`);
        response(child, { type: 'result', captured: true });
      });
    });
    return child;
  } });
  const capture = native.startMicrophone({ durationMs: 30, onFrame: pcm => received.push(pcm) });
  await capture.ready;
  await capture.done;
  assert.deepEqual(Buffer.concat(received), samples);
});

test('[UNIT] a new session waits for cancelled microphone native ownership to finish', async t => {
  const first = deferred(); const second = deferred(); let opens = 0;
  const engine = new VoiceEngine({ backend: backend({ startMicrophone: () => ({ ready: Promise.resolve({}), done: ++opens === 1 ? first.promise : second.promise }) }) });
  t.after(() => { first.resolve(); second.resolve(); engine.close(); });
  engine.startSession('first'); await engine.startMicrophone('first');
  engine.stopSession('first'); engine.startSession('second');
  const pending = engine.startMicrophone('second');
  await Promise.resolve();
  assert.equal(opens, 1, 'Native capture must not reopen while previous handle teardown is pending');
  first.reject(cancelled()); await pending;
  assert.equal(opens, 2);
  assert.equal(engine.getStatus().sessions.find(session => session.sessionId === 'second').microphoneActive, true);
  second.resolve(); await engine.stopMicrophone('second');
});

test('invalid synthesis, format and capture options fail before any native process', async () => {
  const native = new WindowsSpeechBackend({ spawn: () => assert.fail('Must not spawn') });
  await assert.rejects(native.synthesize(''), { code: 'VOICE_INVALID_TEXT' });
  await assert.rejects(native.synthesize('Hello', { rate: 11 }), { code: 'VOICE_INVALID_RATE' });
  await assert.rejects(native.synthesize('Hello', { sampleRate: 0 }), { code: 'VOICE_FORMAT_UNSUPPORTED' });
  await assert.rejects(native.transcribe(Buffer.alloc(1)), { code: 'VOICE_INVALID_AUDIO' });
  assert.throws(() => native.startMicrophone({ durationMs: -1 }), { code: 'VOICE_INVALID_DURATION' });
});
