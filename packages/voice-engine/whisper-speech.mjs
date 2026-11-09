import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { WindowsSpeechBackend, VoiceError, abortError, validateFormat, validatePcm } from './windows-speech.mjs';
import { WHISPER_VERSION, WHISPER_NATIVE_FILES } from './whisper-assets.mjs';

/** Windows devices/TTS with explicitly selected, offline Whisper recognition. */
export class WhisperSpeechBackend extends WindowsSpeechBackend {
  constructor(options = {}) {
    super(options);
    this.whisperRoot = options.whisperRoot ?? fileURLToPath(new URL('../../artifacts/local-runtime/whisper-cpp/', import.meta.url));
  }

  async verifyRecognitionAssets(signal) {
    if (process.platform !== 'win32' || process.arch !== 'x64') throw new VoiceError('VOICE_PLATFORM_UNSUPPORTED', 'Pinned Whisper runtime requires Windows x64');
    const runtime = path.join(this.whisperRoot, `v${WHISPER_VERSION}`, 'Release');
    const model = path.join(this.whisperRoot, 'ggml-base.bin');
    for (const [file, expected] of [...Object.entries(WHISPER_NATIVE_FILES).map(([name, hash]) => [path.join(runtime, name), hash]), [model, '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe']]) {
      signal?.throwIfAborted();
      const hash = crypto.createHash('sha256');
      for await (const chunk of fs.createReadStream(file)) { signal?.throwIfAborted(); hash.update(chunk); }
      if (hash.digest('hex') !== expected) throw new VoiceError('VOICE_ASSET_MISMATCH', 'Whisper asset differs from pinned release');
    }
    return { executable: path.join(runtime, 'whisper-cli.exe'), model };
  }

  async getAvailability(options = {}) {
    const availability = await super.getAvailability(options);
    try {
      await this.verifyRecognitionAssets(options.signal);
      availability.recognition = { available: true, backend: 'whisper.cpp', version: WHISPER_VERSION, model: 'base', inferenceVerified: false };
    } catch (error) {
      availability.recognition = { available: false, backend: 'whisper.cpp', reason: error.code || 'VOICE_ASSETS_UNAVAILABLE' };
    }
    return availability;
  }

  async transcribe(pcm, { sampleRate = 16000, signal, language = 'en', onStarted } = {}) {
    validateFormat(sampleRate); validatePcm(pcm);
    if (signal?.aborted) throw abortError();
    if (!pcm.length) return { text: '', segments: [], transcribed: false, reason: 'empty_audio' };
    if (typeof language !== 'string' || !/^(?:auto|[a-z]{2,3}(?:-[A-Za-z]{2})?)$/.test(language)) throw new VoiceError('VOICE_LANGUAGE_UNAVAILABLE', 'Expected an ISO language code or locale');
    const nativeLanguage = language.split('-')[0];
    let assets;
    try { assets = await this.verifyRecognitionAssets(signal); }
    catch (error) { if (signal?.aborted) throw abortError(); throw error; }
    if (signal?.aborted) throw abortError();
    const header = Buffer.alloc(44);
    header.write('RIFF'); header.writeUInt32LE(pcm.length + 36, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
    header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
    // Upstream's binary stdin WAV reader keeps microphone audio off disk.
    return new Promise((resolve, reject) => {
      // A non-"-" output basename enables the stdout segment callback. No
      // output-format switches are enabled, so the CLI creates no output file.
      const child = spawn(assets.executable, ['-m', assets.model, '-f', '-', '-of', 'zero-ram-transcript', '-l', nativeLanguage, '-t', '2', '-bo', '1', '-bs', '1', '-ng', '-np', '-nt'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
      let output = ''; let diagnostics = ''; let failure; let inputFailure;
      const stop = error => { if (!failure) failure = error; child.kill(); };
      const cancel = () => stop(abortError());
      const timer = setTimeout(() => stop(new VoiceError('VOICE_TIMEOUT', 'Whisper recognition exceeded 120 seconds')), 120000);
      timer.unref?.();
      signal?.addEventListener('abort', cancel, { once: true });
      child.once('spawn', () => { try { if (!failure) onStarted?.(); } catch (error) { stop(error); } });
      child.once('error', error => { failure ||= new VoiceError('VOICE_BACKEND_UNAVAILABLE', error.message); });
      // An early native refusal can close stdin before Node finishes writing.
      // Preserve its actual diagnostic instead of replacing it with write EOF.
      child.stdin.on('error', error => { inputFailure = new VoiceError('VOICE_BACKEND_IO', error.message); });
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      child.stdout.on('data', chunk => { if (output.length + chunk.length > 1024 * 1024) stop(new VoiceError('VOICE_BACKEND_PROTOCOL', 'Whisper output exceeds limit')); else output += chunk; });
      child.stderr.on('data', chunk => { diagnostics = (diagnostics + chunk).slice(-8192); });
      child.once('close', code => {
        clearTimeout(timer); signal?.removeEventListener('abort', cancel);
        if (failure) reject(failure);
        // This pinned CLI returns zero for some errors (including unknown
        // language). Process exit alone is not a recognition-success signal.
        else if (code !== 0 || /^error:/im.test(diagnostics)) reject(new VoiceError(/unknown language/i.test(diagnostics) ? 'VOICE_LANGUAGE_UNAVAILABLE' : 'VOICE_TRANSCRIBE_FAILED', diagnostics.trim() || `Whisper exited ${code}`));
        else if (inputFailure) reject(inputFailure);
        else resolve({ text: output.trim(), segments: [], transcribed: !!output.trim(), backend: 'whisper.cpp', language, nativeLanguage, confidence: null });
      });
      if (signal?.aborted) cancel();
      child.stdin.end(Buffer.concat([header, Buffer.from(pcm)]));
    });
  }
}
