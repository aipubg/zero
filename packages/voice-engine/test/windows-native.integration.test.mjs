import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VoiceEngine, WindowsSpeechBackend } from '../index.mjs';

function assertRecognizedPhrase(text) {
  // Dictation is probabilistic; assess word agreement rather than force an exact
  // transcript. In particular, this installed recognizer sometimes hears "boys"
  // in place of "voice" in Microsoft David's rendition of this sentence.
  const words = new Set(text.toLowerCase().match(/[a-z]+/g));
  const expected = 'the voice engine can now speak real words'.split(' ');
  assert.ok(expected.filter(word => words.has(word)).length / expected.length >= 0.75, `Unexpected recognition: ${text}`);
  assert.match(text, /speak real words/i);
}

// These tests use real installed Windows speech engines. They never open a
// microphone or a speaker. Set ZERO_VOICE_NATIVE_TESTS=1 to explicitly opt in.
test('[REAL_OS] real Windows synthesis and recognition, with a WAV proof artifact', {
  skip: process.platform !== 'win32' || process.env.ZERO_VOICE_NATIVE_TESTS !== '1',
  timeout: 120000,
}, async t => {
  const backend = new WindowsSpeechBackend();
  const availability = await backend.getAvailability();
  assert.equal(availability.checked, true);
  assert.equal(availability.microphone.permission, 'not-checked');
  assert.equal(availability.output.verified, false);
  assert.equal(availability.microphone.devices.length, availability.microphone.deviceCount);
  assert.equal(availability.output.devices.length, availability.output.deviceCount);
  for (const device of [...availability.microphone.devices, ...availability.output.devices]) {
    assert.ok(Number.isInteger(device.id)); assert.ok(device.name.trim()); assert.ok(device.channels > 0);
  }
  assert.equal(availability.microphone.selection, 'windows-default-mapper');
  assert.equal(availability.synthesis.available, true, availability.synthesis.reason);

  const phrase = 'The voice engine can now speak real words.';
  const audio = await backend.synthesize(phrase);
  assert.ok(audio.pcm.length > 3200);
  assert.equal(audio.pcm.length % 2, 0);
  assert.equal(audio.sampleRate, 16000);
  assert.notEqual(audio.pcm.subarray(0, 4).toString(), 'RIFF');
  const other = await backend.synthesize('Good morning.');
  assert.notDeepEqual(audio.pcm, other.pcm);

  const wav = Buffer.alloc(44 + audio.pcm.length);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(16000, 24); wav.writeUInt32LE(32000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(audio.pcm.length, 40); audio.pcm.copy(wav, 44);
  const proof = join(await mkdtemp(join(tmpdir(), 'zero-voice-proof-')), 'windows-tts-proof.wav');
  await writeFile(proof, wav);
  t.diagnostic(`REAL_WINDOWS_TTS_PROOF ${JSON.stringify({ file: proof, pcmBytes: audio.pcm.length, sampleRate: audio.sampleRate, voice: audio.voice })}`);

  await t.test('real dictation recognizes the synthesized words or reports a missing recognizer', async () => {
    if (!availability.recognition.available) {
      await assert.rejects(backend.transcribe(audio.pcm), { code: 'VOICE_TRANSCRIBE_FAILED' });
      t.diagnostic(`Recognition unavailable: ${availability.recognition.reason}`);
      return;
    }
    const result = await backend.transcribe(audio.pcm, { language: 'en-US' });
    assert.equal(result.transcribed, true);
    assertRecognizedPhrase(result.text);
    assert.ok(result.segments.length > 0);
    assert.ok(result.segments[0].confidence >= 0 && result.segments[0].confidence <= 1);
    t.diagnostic(`REAL_WINDOWS_STT ${JSON.stringify(result)}`);
    const silence = await backend.transcribe(Buffer.alloc(32000));
    assert.equal(silence.transcribed, false);
    assert.equal(silence.text, '');
    await assert.rejects(backend.transcribe(audio.pcm, { language: 'zz-ZZ' }), { code: 'VOICE_TRANSCRIBE_FAILED' });
  });

  await t.test('legacy session APIs route real speech into real STT without device access', async () => {
    const engine = new VoiceEngine({ backend, playback: false });
    try {
      engine.startSession('native-proof');
      const frames = [];
      engine.on('voice:audio', event => frames.push(Buffer.from(event.chunk, 'base64')));
      const result = await engine.synthesizeSpeech('native-proof', phrase);
      assert.equal(result.played, false);
      assert.equal(Buffer.concat(frames).length, result.pcmByteLength);
      engine.ingestChunk('native-proof', Buffer.concat(frames));
      if (availability.recognition.available) {
        const transcript = await engine.transcribe('native-proof');
        assertRecognizedPhrase(transcript.text);
      }
      assert.equal(engine.getStatus().sessions[0].microphoneActive, false);
    } finally { engine.close(); }
  });

  await t.test('real unavailable voice and cancellation fail truthfully', async () => {
    await assert.rejects(backend.synthesize('Hello', { voice: '__nonexistent_voice__' }), { code: 'VOICE_SYNTHESIZE_FAILED' });
    const controller = new AbortController();
    const speech = backend.synthesize('Cancel this long speech. '.repeat(500), { signal: controller.signal });
    const rejection = assert.rejects(speech, { code: 'VOICE_CANCELLED' });
    setTimeout(() => controller.abort(), 50);
    await rejection;
  });
});
