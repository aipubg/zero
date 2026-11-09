import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WindowsSpeechBackend } from '../packages/voice-engine/windows-speech.mjs';
import { WhisperSpeechBackend } from '../packages/voice-engine/whisper-speech.mjs';

test('[REAL_OS] actual speaker to microphone acoustic speech recognition probe', {
  skip: process.platform !== 'win32' || process.env.ZERO_VOICE_ACOUSTIC_TESTS !== '1', timeout: 150000,
}, async () => {
  const directory = path.resolve('artifacts/voice-acoustic', String(Date.now())); fs.mkdirSync(directory, { recursive: true });
  const report = { classification: ['REAL_OS'], status: 'RUNNING', scope: 'Actual speaker/microphone acoustic path and selected phrase recognition; not human conversation or barge-in', rawMicrophoneSaved: false, humanConversation: 'UNVERIFIED', bargeIn: 'UNVERIFIED' };
  const selection = process.env.ZERO_VOICE_RECOGNITION_BACKEND || 'windows';
  if (!['windows', 'whisper'].includes(selection)) throw new Error('Unknown voice recognition backend');
  report.recognitionBackend = selection;
  const backend = selection === 'whisper' ? new WhisperSpeechBackend() : new WindowsSpeechBackend(); const frames = []; let capture; let audio;
  try {
    audio = await backend.synthesize('The voice engine can now speak real words.', { sampleRate: 16000 });
    capture = backend.startMicrophone({ sampleRate: 16000, durationMs: 10000, onFrame: pcm => frames.push(pcm) });
    await capture.ready;
    let outputStarted = false;
    const playback = await backend.play(audio.pcm, { sampleRate: 16000, onStarted: () => { outputStarted = true; } });
    await capture.done;
    assert.equal(outputStarted, true); assert.equal(playback.played, true);
    const pcm = Buffer.concat(frames);
    try {
      report.microphoneFrames = frames.length; report.microphoneBytes = pcm.length;
      assert.ok(pcm.length > 32000, 'Actual microphone frames required');
      let squares = 0; for (let i = 0; i < pcm.length; i += 2) squares += pcm.readInt16LE(i) ** 2;
      report.rms = Math.sqrt(squares / (pcm.length / 2));
      const transcript = await backend.transcribe(pcm, { sampleRate: 16000, language: 'en-US' });
      const words = new Set((transcript.text || '').toLowerCase().match(/[a-z]+/g) || []);
      const expected = 'the voice engine can now speak real words'.split(' ');
      report.expectedWordAgreement = expected.filter(word => words.has(word)).length / expected.length;
      report.expectedPhraseRecognized = /speak real words/i.test(transcript.text || '');
      report.recognizedSegmentCount = transcript.segments?.length || 0;
      // Do not persist unrelated ambient speech if recognition does not match.
      report.transcriptOmitted = true;
      assert.ok(transcript.transcribed && report.expectedWordAgreement >= 0.75 && report.expectedPhraseRecognized, 'Expected acoustic phrase not recognized; inspect device routing before claiming microphone STT');
      report.status = 'PASS';
    } finally { pcm.fill(0); }
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    if (capture) { capture.stop(); await capture.done.catch(() => {}); }
    for (const frame of frames) frame.fill(0); audio?.pcm.fill(0);
    report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
  }
});
