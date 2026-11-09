import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { VoiceEngine } from '../packages/voice-engine/index.mjs';

test('[REAL_OS] actual headset speech interrupts native playback and next playback recovers', {
  skip: process.platform !== 'win32' || process.env.ZERO_VOICE_HUMAN_BARGE_IN !== '1', timeout: 90000,
}, async () => {
  const output = path.resolve('artifacts/voice-human-barge-in', String(Date.now())); fs.mkdirSync(output, { recursive: true });
  const report = { classification: ['REAL_OS', 'INTEGRATION'], status: 'RUNNING', rawMicrophoneSaved: false, transcriptOmitted: true, backend: 'whisper.cpp', echoCancellation: false, scope: 'Actual microphone energy VAD interruption during native headphone playback, adjacent prompted speech recognition and subsequent playback recovery; not intent-aware or noise-resistant barge-in accuracy' };
  const engine = new VoiceEngine({ recognitionBackend: 'whisper' });
  let speechOutcome;
  let interruption;
  let timeout;
  try {
    engine.startSession('human-interrupt');
    const interrupted = new Promise((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error('No actual VAD interruption within 25 seconds')), 25000);
      engine.once('voice:barge_in', event => { interruption = { observedAt: Date.now(), event }; resolve(); });
    });
    interrupted.catch(() => {});
    // No target interruption phrase appears in the synthesized output.
    speechOutcome = engine.synthesizeSpeech('human-interrupt', 'Zero is speaking. Please interrupt after the instruction in the chat. '.repeat(15)).then(value => ({ value }), error => ({ error }));
    const deadline = Date.now() + 15000;
    while (!engine.getStatus().sessions[0].playbackActive && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(engine.getStatus().sessions[0].playbackActive, true, 'Actual native playback must start before microphone interruption');
    report.playbackObservedAt = Date.now();
    await engine.startMicrophone('human-interrupt', { deviceId: 0, durationMs: 25000 });
    console.log('HUMAN_BARGE_IN_READY: while Zero speaks, say Stop Zero, blue bird.');
    await interrupted; clearTimeout(timeout);
    const outcome = await speechOutcome;
    assert.equal(outcome.error?.code, 'VOICE_CANCELLED', 'VAD must cancel the actual native playback operation');
    assert.equal(engine.getStatus().sessions[0].playbackActive, false);
    report.actualNativePlaybackCancelled = true;
    // Collect the end of the actual interruption phrase, then release capture.
    await new Promise(resolve => setTimeout(resolve, 5000));
    await engine.stopMicrophone('human-interrupt');
    report.capture = engine.getStatus().sessions[0].capture;
    assert.ok(report.capture.frames > 0 && report.capture.bytes > 3200);
    const transcript = await engine.transcribe('human-interrupt', { language: 'en-US' });
    const normalized = transcript.text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ');
    report.expectedWordsDetected = ['stop', 'zero', 'blue', 'bird'].filter(word => new RegExp(`\\b${word}\\b`).test(normalized));
    report.expectedInterruptionWordsRecognized = /\bstop\b/.test(normalized) && /\bblue\s*bird\b/.test(normalized);
    assert.equal(report.expectedInterruptionWordsRecognized, true, 'Adjacent microphone audio must include actual prompted interruption words, absent from playback');
    const recovered = await engine.synthesizeSpeech('human-interrupt', 'Interruption confirmed. I can speak again.');
    assert.equal(recovered.played, true);
    Object.assign(report, { status: 'PASS', actualNativePlaybackCancelled: true, interruption, recoveredPlayback: true, bargeInCount: engine.getStatus().sessions[0].bargeInCount });
  } catch (error) { Object.assign(report, { status: 'FAIL', error: error.message, interruption }); throw error; }
  finally {
    clearTimeout(timeout);
    try { await engine.stopMicrophone('human-interrupt'); } catch {}
    engine.close();
    await speechOutcome;
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  }
});
