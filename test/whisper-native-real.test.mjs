import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { WindowsSpeechBackend } from '../packages/voice-engine/windows-speech.mjs';
import { WHISPER_VERSION, WHISPER_NATIVE_FILES } from '../packages/voice-engine/whisper-assets.mjs';
import { VoiceEngine, WhisperSpeechBackend } from '../packages/voice-engine/index.mjs';

test('[REAL_OS] pinned Whisper CPU decodes actual Windows synthesized speech', {
  skip: process.platform !== 'win32' || process.env.ZERO_WHISPER_TESTS !== '1', timeout: 150000,
}, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-whisper-proof-'));
  const output = path.resolve('artifacts/whisper-native', String(Date.now()));
  fs.mkdirSync(output, { recursive: true });
  const report = { classification: ['REAL_OS', 'INTEGRATION'], status: 'RUNNING', runtime: `whisper.cpp ${WHISPER_VERSION}`, inputSource: 'Actual Windows TTS; not human microphone', hostVoiceEngineChanged: false };
  try {
    const root = path.resolve('artifacts/local-runtime/whisper-cpp');
    const runtime = path.join(root, `v${WHISPER_VERSION}`, 'Release');
    for (const [filename, expected] of Object.entries(WHISPER_NATIVE_FILES)) {
      assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(runtime, filename))).digest('hex'), expected);
    }
    const model = path.join(root, 'ggml-base.bin');
    const hash = crypto.createHash('sha256');
    for await (const chunk of fs.createReadStream(model)) hash.update(chunk);
    assert.equal(hash.digest('hex'), '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe');
    const phrase = 'The voice engine can now speak real words.';
    const audio = await new WindowsSpeechBackend().synthesize(phrase);
    assert.ok(audio.pcm.length > 3200);
    const header = Buffer.alloc(44);
    header.write('RIFF'); header.writeUInt32LE(audio.pcm.length + 36, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
    header.writeUInt32LE(audio.sampleRate, 24); header.writeUInt32LE(audio.sampleRate * 2, 28);
    header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(audio.pcm.length, 40);
    const wav = path.join(directory, 'public-tts.wav');
    fs.writeFileSync(wav, Buffer.concat([header, audio.pcm]));
    const { stdout } = await promisify(execFile)(path.join(runtime, 'whisper-cli.exe'), ['-m', model, '-f', wav, '-l', 'en', '-t', '2', '-bo', '1', '-bs', '1', '-ng', '-np', '-nt'], { windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 });
    report.actualTranscript = stdout.trim();
    const normalize = value => value.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
    assert.equal(normalize(stdout), normalize(phrase));
    // Exercise ZERO's actual selectable backend using binary stdin, not a WAV file.
    const engine = new VoiceEngine({ recognitionBackend: 'whisper', playback: false });
    assert.ok(engine.backend instanceof WhisperSpeechBackend);
    try {
      engine.startSession('whisper-proof');
      engine.ingestChunk('whisper-proof', audio.pcm);
      const actual = await engine.transcribe('whisper-proof', { language: 'en-US' });
      assert.equal(normalize(actual.text), normalize(phrase));
      assert.equal(actual.nativeLanguage, 'en');
      assert.equal(actual.backend, 'whisper.cpp');
      const controller = new AbortController();
      let started = false;
      await assert.rejects(engine.backend.transcribe(audio.pcm, { signal: controller.signal, onStarted: () => { started = true; controller.abort(); } }), { code: 'VOICE_CANCELLED' });
      assert.equal(started, true, 'Real decoder must spawn before cancellation');
      const recovered = await engine.backend.transcribe(audio.pcm, { language: 'en-US' });
      assert.equal(normalize(recovered.text), normalize(phrase));
      await assert.rejects(engine.backend.transcribe(audio.pcm, { language: 'zz-ZZ' }), /language|unknown|unsupported/i);
      Object.assign(report, { zeroEngineStdinTranscript: actual.text, realSpawnCancellation: true, afterCancellationRecovery: true, unknownLanguageRejected: true });
    } finally { engine.close(); }
    Object.assign(report, { status: 'PASS', expectedWordsMatched: true, cpuThreads: 2, gpu: false, pcmBytes: audio.pcm.length, humanMicrophone: 'UNVERIFIED' });
  } catch (error) {
    Object.assign(report, { status: 'FAIL', error: error.message });
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('zero-whisper-proof-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
