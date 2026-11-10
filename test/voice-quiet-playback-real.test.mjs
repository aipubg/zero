import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { VoiceEngine } from '../packages/voice-engine/index.mjs';

test('[REAL_OS] native playback survives requested-quiet microphone capture and cancellation recovers', {
  skip: process.platform !== 'win32' || process.env.ZERO_VOICE_QUIET_TESTS !== '1', timeout: 60000,
}, async () => {
  const output = path.resolve('artifacts/voice-quiet-probe', String(Date.now())); fs.mkdirSync(output, { recursive: true });
  const engine = new VoiceEngine({ recognitionBackend: 'whisper' });
  const report = { classification: ['REAL_OS', 'INTEGRATION'], status: 'RUNNING', rawMicrophoneSaved: false,
    scope: 'Actual native playback/capture during an eight-second requested-quiet window, explicit cancellation and real output recovery; not general noise immunity, echo cancellation or human barge-in acceptance' };
  let speech;
  try {
    engine.startSession('quiet-probe');
    speech = engine.synthesizeSpeech('quiet-probe', 'This is a quiet microphone timing test. Please remain silent while Zero is speaking. '.repeat(8)).then(value => ({ value }), error => ({ error }));
    const deadline = Date.now() + 10000;
    while (!engine.getStatus().sessions[0].playbackActive && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(engine.getStatus().sessions[0].playbackActive, true, 'Native playback must actually start');
    await engine.startMicrophone('quiet-probe', { deviceId: 0, durationMs: 8000 });
    await engine.sessions.get('quiet-probe').microphone.done;
    report.observation = engine.getStatus().sessions[0];
    assert.ok(report.observation.capture.frames >= 200, 'Actual native capture frames required');
    assert.equal(report.observation.bargeInCount, 0, 'Requested-quiet microphone fluctuations must not cancel playback');
    assert.equal(report.observation.playbackActive, true);
    engine.cancelSpeech('quiet-probe');
    assert.equal((await speech).error?.code, 'VOICE_CANCELLED');
    const recovered = await engine.synthesizeSpeech('quiet-probe', 'The quiet playback check is complete.');
    assert.equal(recovered.played, true);
    Object.assign(report, { status: 'PASS', explicitCancellationConfirmed: true, recoveredPlayback: true });
  } catch (error) { Object.assign(report, { status: 'FAIL', error: error.message }); throw error; }
  finally {
    try { await engine.stopMicrophone('quiet-probe'); } catch {}
    engine.close(); await speech;
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  }
});
