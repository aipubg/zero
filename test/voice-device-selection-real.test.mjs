import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WindowsSpeechBackend } from '../packages/voice-engine/windows-speech.mjs';
import { VoiceEngine } from '../packages/voice-engine/index.mjs';

test('[REAL_OS] explicit enumerated microphone opens and unavailable index fails without fallback', {
  skip: process.platform !== 'win32' || process.env.ZERO_VOICE_DEVICE_TESTS !== '1', timeout: 40000,
}, async () => {
  const directory = path.resolve('artifacts/voice-device-selection', String(Date.now())); fs.mkdirSync(directory, { recursive: true });
  const report = { classification: ['REAL_OS'], status: 'RUNNING', rawMicrophoneSaved: false, scope: 'Explicit WinMM input selection and capture; not speech understanding' };
  const backend = new WindowsSpeechBackend(); let capture; let engine;
  try {
    const available = await backend.getAvailability();
    const device = available.microphone.devices[0]; assert.ok(device);
    let frames = 0; let bytes = 0;
    capture = backend.startMicrophone({ deviceId: device.id, durationMs: 3000, onFrame: pcm => { frames++; bytes += pcm.length; pcm.fill(0); } });
    const ready = await capture.ready; assert.equal(ready.deviceId, device.id);
    await capture.done;
    report.capture = { device, frames, bytes, readyDeviceId: ready.deviceId };
    assert.ok(frames > 0 && bytes > 0);
    assert.ok(available.microphone.deviceCount < 255);
    const invalid = backend.startMicrophone({ deviceId: 255, durationMs: 100 });
    const failure = invalid.done.catch(error => error);
    await assert.rejects(invalid.ready, { code: 'VOICE_CAPTURE_FAILED' });
    assert.equal((await failure).code, 'VOICE_CAPTURE_FAILED');
    report.unavailableIndexRejected = true;
    engine = new VoiceEngine({ backend, playback: false });
    engine.startSession('first'); engine.startSession('second');
    await assert.rejects(engine.startMicrophone('first', { deviceId: 255 }), { code: 'VOICE_CAPTURE_FAILED' });
    assert.equal(engine.getStatus().sessions.some(session => session.microphoneActive), false);
    await engine.startMicrophone('first', { deviceId: device.id });
    engine.stopSession('first');
    const secondStopped = new Promise(resolve => engine.on('voice:microphone_stopped', event => { if (event.sessionId === 'second') resolve(); }));
    const restarted = await engine.startMicrophone('second', { deviceId: device.id, durationMs: 3000 });
    assert.equal(restarted.deviceId, device.id); assert.equal(restarted.microphoneActive, true);
    await secondStopped;
    const secondStatus = engine.getStatus().sessions.find(session => session.sessionId === 'second');
    assert.ok(secondStatus.router.bufferedInputBytes > 0);
    report.sessionRecovery = { invalidSelectionReleasedOwnership: true, stoppedSessionRemoved: true, nextNativeCapture: true, secondSessionBytes: secondStatus.router.bufferedInputBytes };
    report.status = 'PASS';
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    if (capture) { capture.stop(); await capture.done.catch(() => {}); }
    if (engine) { if (engine.sessions.has('second')) await engine.stopMicrophone('second').catch(() => {}); engine.close(); }
    report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
  }
});
