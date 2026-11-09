import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export class VoiceError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = 'VoiceError';
    this.code = code;
  }
}

export function abortError() {
  return new VoiceError('VOICE_CANCELLED', 'Voice operation cancelled');
}

export function validateFormat(sampleRate) {
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 48000) {
    throw new VoiceError('VOICE_FORMAT_UNSUPPORTED', 'Expected mono PCM16 at 8000–48000 Hz');
  }
}

export function validatePcm(pcm) {
  if (!(pcm instanceof Uint8Array) || pcm.length % 2 || pcm.length > 16 * 1024 * 1024) {
    throw new VoiceError('VOICE_INVALID_AUDIO', 'Expected at most 16 MiB of aligned little-endian PCM16 audio');
  }
}

function decodePcm(value) {
  if (typeof value !== 'string' || value.length > 24 * 1024 * 1024 || value.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new VoiceError('VOICE_BACKEND_PROTOCOL', 'Windows speech returned invalid base64 PCM');
  }
  const pcm = Buffer.from(value, 'base64');
  if (pcm.toString('base64') !== value) throw new VoiceError('VOICE_BACKEND_PROTOCOL', 'Windows speech returned noncanonical base64 PCM');
  validatePcm(pcm);
  return pcm;
}

/** Runs only our fixed script; text and audio travel over stdin, never as PowerShell code. */
export class WindowsSpeechBackend {
  constructor(options = {}) {
    this.platform = options.platform ?? process.platform;
    this.spawn = options.spawn ?? spawn;
    this.executable = options.executable ?? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    this.script = fileURLToPath(new URL('./windows-speech.ps1', import.meta.url));
    this.availability = {
      backend: 'windows-system-speech',
      platform: this.platform,
      checked: false,
      synthesis: { available: null },
      recognition: { available: null },
      microphone: { available: null, permission: 'not-checked' },
      output: { available: null, verified: false },
      echoCancellation: false,
    };
  }

  _run(operation, request = {}, { signal, onFrame, timeoutMs = 60000 } = {}) {
    let child;
    let timer;
    let killTimer;
    let readyTimer;
    let settled = false;
    let cancellation;
    let result;
    let pending = '';
    let stderr = '';
    let resolveReady;
    let rejectReady;
    let stopJob;
    const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
    // Capture callers can await readiness separately; other operations only await completion.
    ready.catch(() => {});
    const done = new Promise((resolve, reject) => {
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearTimeout(killTimer);
        clearTimeout(readyTimer);
        signal?.removeEventListener('abort', cancel);
        if (error) { rejectReady(error); reject(error); }
        else { resolveReady(value); resolve(value); }
      };
      const stop = (error) => {
        if (settled || cancellation) return;
        cancellation = error;
        // Native input/output loops reset and close their devices on this message.
        try { child?.stdin?.write('cancel\n'); } catch { /* process already closed */ }
        killTimer = setTimeout(() => child?.kill(), 500);
        killTimer.unref?.();
      };
      const cancel = () => stop(abortError());
      stopJob = cancel;
      if (this.platform !== 'win32') {
        finish(new VoiceError('VOICE_PLATFORM_UNSUPPORTED', 'Windows speech requires Windows'));
        return;
      }
      if (signal?.aborted) { finish(abortError()); return; }
      try {
        child = this.spawn(this.executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', this.script, '-Operation', operation], {
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (error) {
        finish(new VoiceError('VOICE_BACKEND_UNAVAILABLE', `Cannot start Windows PowerShell: ${error.message}`, { cause: error }));
        return;
      }
      signal?.addEventListener('abort', cancel, { once: true });
      child.on('error', error => finish(new VoiceError('VOICE_BACKEND_UNAVAILABLE', `Cannot start Windows PowerShell: ${error.message}`, { cause: error })));
      child.stdin.on('error', error => {
        if (!cancellation && error.code !== 'EPIPE') stop(new VoiceError('VOICE_BACKEND_IO', error.message));
      });
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', data => { stderr = (stderr + data).slice(-8192); });
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', data => {
        if (settled || cancellation) return;
        pending += data;
        if (pending.length > 24 * 1024 * 1024) {
          stop(new VoiceError('VOICE_BACKEND_PROTOCOL', 'Windows speech response exceeded the size limit'));
          return;
        }
        let newline;
        while ((newline = pending.indexOf('\n')) !== -1) {
          const line = pending.slice(0, newline).trim();
          pending = pending.slice(newline + 1);
          if (!line) continue;
          try {
            const message = JSON.parse(line);
            if (message.type === 'ready') { clearTimeout(readyTimer); resolveReady(message); }
            else if (message.type === 'audio') {
              const pcm = decodePcm(message.pcm);
              onFrame?.(pcm);
            } else if (message.type === 'result') {
              result = message;
            } else if (message.type === 'error') {
              stop(new VoiceError(message.code || 'VOICE_BACKEND_FAILED', message.message || 'Windows speech failed'));
            } else throw new Error('Unknown message type');
          } catch (error) {
            stop(error instanceof VoiceError ? error : new VoiceError('VOICE_BACKEND_PROTOCOL', `Invalid Windows speech response: ${error.message}`));
          }
          if (cancellation) break;
        }
      });
      child.on('close', code => {
        if (cancellation) finish(cancellation);
        else if (code !== 0 || !result) finish(new VoiceError('VOICE_BACKEND_FAILED', stderr.trim() || `Windows speech exited (${code}) without a result`));
        else finish(null, result);
      });
      timer = setTimeout(() => stop(new VoiceError('VOICE_TIMEOUT', `${operation} timed out after ${timeoutMs} ms`)), timeoutMs);
      timer.unref?.();
      if (operation === 'capture') {
        readyTimer = setTimeout(() => stop(new VoiceError('VOICE_TIMEOUT', 'Opening the Windows microphone timed out')), 30000);
        readyTimer.unref?.();
      }
      child.stdin.write(`${JSON.stringify(request)}\n`);
    });
    return { ready, done, stop: () => stopJob?.() };
  }

  async getAvailability({ signal } = {}) {
    try {
      const { type, ...details } = await this._run('probe', {}, { signal, timeoutMs: 30000 }).done;
      this.availability = { ...this.availability, ...details, checked: true, checkedAt: Date.now() };
    } catch (error) {
      if (error.code === 'VOICE_CANCELLED') throw error;
      const unavailable = { available: false, reason: error.message, code: error.code };
      this.availability = { ...this.availability, checked: true, checkedAt: Date.now(), synthesis: unavailable, recognition: unavailable, microphone: { ...unavailable, permission: 'not-checked' }, output: { ...unavailable, verified: false } };
    }
    return this.availability;
  }

  async synthesize(text, { sampleRate = 16000, signal, voice, rate = 0 } = {}) {
    validateFormat(sampleRate);
    if (typeof text !== 'string' || !text.trim() || text.length > 20000) throw new VoiceError('VOICE_INVALID_TEXT', 'Speech text must contain 1–20000 characters');
    if (!Number.isInteger(rate) || rate < -10 || rate > 10) throw new VoiceError('VOICE_INVALID_RATE', 'Speech rate must be an integer from -10 to 10');
    const result = await this._run('synthesize', { text, sampleRate, voice, rate }, { signal }).done;
    const pcm = decodePcm(result.pcm);
    if (!pcm.length) throw new VoiceError('VOICE_EMPTY_AUDIO', 'Windows synthesis produced no audio');
    return { pcm, sampleRate, channels: 1, bitsPerSample: 16, voice: result.voice };
  }

  async transcribe(pcm, { sampleRate = 16000, signal, language, onStarted } = {}) {
    validateFormat(sampleRate);
    validatePcm(pcm);
    if (!pcm.length) return { text: '', segments: [], transcribed: false, reason: 'empty_audio' };
    const job = this._run('transcribe', { pcm: Buffer.from(pcm).toString('base64'), sampleRate, language }, { signal, timeoutMs: 120000 });
    job.ready.then(() => onStarted?.(), () => {});
    return job.done;
  }

  async play(pcm, { sampleRate = 16000, signal, onStarted } = {}) {
    validateFormat(sampleRate);
    validatePcm(pcm);
    if (!pcm.length) return { played: false, pcmByteLength: 0 };
    const job = this._run('play', { pcm: Buffer.from(pcm).toString('base64'), sampleRate }, { signal, timeoutMs: Math.ceil(pcm.length / (sampleRate * 2) * 1000) + 30000 });
    job.ready.then(() => onStarted?.(), () => {});
    return job.done;
  }

  startMicrophone({ sampleRate = 16000, signal, onFrame, durationMs = 0, deviceId } = {}) {
    validateFormat(sampleRate);
    if (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > 3600000) throw new VoiceError('VOICE_INVALID_DURATION', 'Microphone duration must be 0 (until stopped) or at most one hour');
    if (deviceId !== undefined && (!Number.isInteger(deviceId) || deviceId < 0 || deviceId > 255)) throw new VoiceError('VOICE_INVALID_DEVICE', 'Expected an enumerated recording device index from 0 to 255');
    return this._run('capture', { sampleRate, durationMs, deviceId }, { signal, onFrame, timeoutMs: durationMs ? durationMs + 30000 : 3600000 });
  }
}
