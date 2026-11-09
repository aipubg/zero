import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WindowsSpeechBackend } from '../packages/voice-engine/windows-speech.mjs';
import { WhisperSpeechBackend } from '../packages/voice-engine/whisper-speech.mjs';

test('[REAL_OS] prompted headset microphone speech reaches actual local STT', {
  skip: process.platform !== 'win32' || process.env.ZERO_VOICE_HUMAN_TESTS !== '1', timeout: 170000,
}, async () => {
  const directory = path.resolve('artifacts/voice-human-microphone', String(Date.now())); fs.mkdirSync(directory, { recursive: true });
  const report = { classification: ['REAL_OS'], status: 'RUNNING', expectedPhrase: 'Hello Zero, please remember blue bird.', rawMicrophoneSaved: false, transcriptOmitted: true, scope: 'Prompted real microphone STT only; not full chat/voice continuity or barge-in' };
  const selection = process.env.ZERO_VOICE_RECOGNITION_BACKEND || 'windows';
  if (!['windows', 'whisper'].includes(selection)) throw new Error('Unknown voice recognition backend');
  const backend = selection === 'whisper' ? new WhisperSpeechBackend() : new WindowsSpeechBackend(); const frames = []; let capture;
  report.recognitionBackend = selection;
  try {
    // The cue deliberately omits the expected phrase so acoustic echo cannot
    // satisfy the phrase assertion. Only the public cue is synthesized.
    const cue = process.env.ZERO_VOICE_HUMAN_PROMPT_AUDIO === '1'
      ? await backend.synthesize('The headset microphone is now listening. Say the sentence shown in the chat.') : null;
    const selectedDevice = process.env.ZERO_VOICE_INPUT_DEVICE_ID;
    const deviceId = selectedDevice === undefined ? undefined : Number(selectedDevice);
    if (deviceId !== undefined && (!Number.isInteger(deviceId) || deviceId < 0)) throw new Error('Invalid explicit microphone device');
    report.deviceId = deviceId ?? 'windows-default-mapper';
    capture = backend.startMicrophone({ durationMs: 40000, sampleRate: 16000, deviceId, onFrame: pcm => frames.push(pcm) });
    await capture.ready;
    console.log('HEADSET_MICROPHONE_READY: say Hello Zero, please remember blue bird.');
    report.readyAt = new Date().toISOString();
    if (cue) { await backend.play(cue.pcm); report.audibleCuePlayed = true; }
    await capture.done;
    const pcm = Buffer.concat(frames);
    try {
      report.frames = frames.length; report.pcmBytes = pcm.length;
      let squares = 0; let peak = 0; let nonzeroSamples = 0;
      for (let i = 0; i < pcm.length; i += 2) { const value = pcm.readInt16LE(i); squares += value * value; peak = Math.max(peak, Math.abs(value)); if (value) nonzeroSamples++; }
      report.inputLevels = { rms: Math.sqrt(squares / Math.max(1, pcm.length / 2)) / 32768, peak: peak / 32768, nonzeroSamples };
      const result = await backend.transcribe(pcm, { sampleRate: 16000, language: 'en-US' });
      report.segments = result.segments?.length || 0;
      const normalized = (result.text || '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ');
      report.expectedWordsDetected = ['hello', 'zero', 'please', 'remember', 'blue', 'bird'].filter(word => new RegExp(`\\b${word}\\b`).test(normalized));
      report.expectedMeaningRecognized = /\bhello\b/.test(normalized) && /\bplease\b/.test(normalized) && /\bremember\s+blue\s*bird\b/.test(normalized);
      assert.ok(result.transcribed && report.expectedMeaningRecognized, 'Prompted microphone phrase not recognized');
      report.status = 'PASS';
    } finally { pcm.fill(0); }
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    if (capture) { capture.stop(); await capture.done.catch(() => {}); }
    for (const frame of frames) frame.fill(0);
    report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
  }
});
