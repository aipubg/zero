import { EventEmitter } from 'node:events';
import { VoiceActivityDetector } from './vad.mjs';
import { AudioRouter } from './audio-router.mjs';
import { SpeechTurnManager, VOICE_STATES } from './speech-turn.mjs';
import { WindowsSpeechBackend, VoiceError, abortError, validateFormat, validatePcm } from './windows-speech.mjs';

export { VoiceActivityDetector, AudioRouter, SpeechTurnManager, VOICE_STATES, WindowsSpeechBackend, VoiceError };

/** PCM16 mono sessions. Session creation never opens a microphone. */
export class VoiceEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.modelFabric = options.modelFabric || null;
    this.sampleRate = options.sampleRate ?? 16000;
    validateFormat(this.sampleRate);
    this.backend = options.backend ?? new WindowsSpeechBackend();
    this.playback = options.playback ?? true;
    this.sessions = new Map();
    this.availability = this.backend.availability ?? { checked: false };
    this._availabilityPending = null;
  }

  async refreshAvailability(options = {}) {
    if (!this._availabilityPending) {
      this._availabilityPending = this.backend.getAvailability(options).then(availability => {
        this.availability = availability;
        this.emit('voice:availability', availability);
        return availability;
      }).finally(() => { this._availabilityPending = null; });
    }
    return this._availabilityPending;
  }

  _session(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session?.active) throw new VoiceError('VOICE_SESSION_NOT_FOUND', `Voice session '${sessionId}' is not active or does not exist`);
    return session;
  }

  _reportError(session, operation, error) {
    if (error.code === 'VOICE_CANCELLED' || !session.active) return;
    session.lastError = { operation, code: error.code || 'VOICE_FAILED', message: error.message };
    this.emit('voice:error', { sessionId: session.sessionId, ...session.lastError });
  }

  _operation(signal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    return { controller, release: () => signal?.removeEventListener('abort', abort) };
  }

  _checkOperation(session, operation) {
    if (!session.active || operation.controller.signal.aborted) throw abortError();
  }

  startSession(sessionId) {
    if (typeof sessionId !== 'string' || !sessionId.trim()) throw new VoiceError('VOICE_INVALID_SESSION', 'sessionId is required');
    if (this.sessions.has(sessionId)) return { ok: true, sessionId, status: 'resumed', microphoneActive: Boolean(this.sessions.get(sessionId).microphone?.started) };
    const router = new AudioRouter({ sampleRate: this.sampleRate });
    const vad = new VoiceActivityDetector({ sampleRate: this.sampleRate });
    const turnManager = new SpeechTurnManager();
    const session = { sessionId, router, vad, turnManager, active: true, createdAt: Date.now(), output: null, transcription: null, microphone: null, lastError: null, vadPending: Buffer.alloc(0) };
    vad.on('speech_start', meta => {
      const result = turnManager.handleUserSpeechStart();
      session.transcription?.controller.abort();
      if (result.bargeIn) {
        session.output?.controller.abort();
        const interrupted = router.clearOutputQueue();
        this.emit('voice:barge_in', { sessionId, ...interrupted, ...meta });
      }
      this.emit('voice:speech_start', { sessionId, ...meta });
    });
    vad.on('speech_end', meta => {
      turnManager.handleUserSpeechEnd();
      this.emit('voice:speech_end', { sessionId, ...meta });
    });
    turnManager.on('state:change', change => this.emit('voice:state', { sessionId, ...change }));
    router.on('output:chunk', chunk => this.emit('voice:audio', { sessionId, chunk: chunk.toString('base64'), encoding: 'pcm_s16le', sampleRate: this.sampleRate, channels: 1 }));
    this.sessions.set(sessionId, session);
    this.emit('voice:session_started', { sessionId, microphoneActive: false });
    // Enumeration is safe: it does not open recording or playback devices.
    this.refreshAvailability().catch(error => this._reportError(session, 'availability', error));
    return { ok: true, sessionId, status: 'started', microphoneActive: false, availability: this.availability };
  }

  ingestChunk(sessionId, chunk) {
    const session = this._session(sessionId);
    let pcm;
    if (typeof chunk === 'string') {
      if (chunk.length > 24 * 1024 * 1024 || chunk.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(chunk)) throw new VoiceError('VOICE_INVALID_AUDIO', 'Audio must be valid base64 PCM16');
      pcm = Buffer.from(chunk, 'base64');
      if (pcm.toString('base64') !== chunk) throw new VoiceError('VOICE_INVALID_AUDIO', 'Audio must be canonical base64 PCM16');
    } else if (chunk instanceof Uint8Array) pcm = Buffer.from(chunk);
    else throw new VoiceError('VOICE_INVALID_AUDIO', 'Audio must be PCM16 bytes or base64');
    validatePcm(pcm);
    session.router.ingestInputChunk(pcm);
    // Network packets can contain many frames or partial frames. VAD timing is
    // measured in 30 ms audio frames, not in calls to this method.
    session.vadPending = Buffer.concat([session.vadPending, pcm]);
    const frameBytes = Math.floor(this.sampleRate * 0.03) * 2;
    let vad = { isSpeaking: session.vad.isSpeaking, energy: 0, zcr: 0, event: null };
    while (session.vadPending.length >= frameBytes) {
      vad = session.vad.processFrame(session.vadPending.subarray(0, frameBytes));
      session.vadPending = session.vadPending.subarray(frameBytes);
    }
    session.vadPending = Buffer.from(session.vadPending);
    return { ok: true, sessionId, state: session.turnManager.state, vad };
  }

  /** Defaults to actual default-device playback; playback:false routes PCM only. */
  async synthesizeSpeech(sessionId, text, options = {}) {
    const session = this._session(sessionId);
    if (typeof text !== 'string' || !text.trim()) throw new VoiceError('VOICE_INVALID_TEXT', 'Speech text is required');
    session.output?.controller.abort();
    session.router.clearOutputQueue();
    const operation = this._operation(options.signal);
    session.output = operation;
    session.turnManager.handleAssistantSpeechStart();
    try {
      this._checkOperation(session, operation);
      const audio = await this.backend.synthesize(text, { ...options, sampleRate: this.sampleRate, signal: operation.controller.signal });
      this._checkOperation(session, operation);
      if (audio?.ok === false) throw new VoiceError('VOICE_SYNTHESIS_FAILED', audio.error || 'Speech synthesis failed');
      validatePcm(audio.pcm);
      if (!audio.pcm.length) throw new VoiceError('VOICE_EMPTY_AUDIO', 'Speech synthesis returned no audio');
      const frameBytes = Math.floor(this.sampleRate * 0.03) * 2;
      for (let offset = 0; offset < audio.pcm.length; offset += frameBytes) {
        this._checkOperation(session, operation);
        session.router.enqueueOutputChunk(audio.pcm.subarray(offset, offset + frameBytes));
      }
      let played = false;
      if (options.playback ?? this.playback) {
        const playback = await this.backend.play(audio.pcm, { sampleRate: this.sampleRate, signal: operation.controller.signal, onStarted: () => {
          if (session.output === operation && !operation.controller.signal.aborted) operation.playbackStarted = true;
        } });
        this._checkOperation(session, operation);
        if (!operation.playbackStarted || playback?.played !== true || playback?.ok === false) throw new VoiceError('VOICE_PLAYBACK_INCOMPLETE', 'Audio device playback did not report start and successful completion');
        played = true;
        session.router.drainOutputBuffer();
      }
      session.lastError = null;
      return { ok: true, sessionId, text, pcmByteLength: audio.pcm.length, sampleRate: this.sampleRate, channels: 1, encoding: 'pcm_s16le', voice: audio.voice, played };
    } catch (error) {
      if (session.output === operation) session.router.clearOutputQueue();
      this._reportError(session, 'synthesize', error);
      throw error;
    } finally {
      operation.release();
      if (session.output === operation) {
        session.output = null;
        if (session.active) session.turnManager.handleAssistantSpeechEnd();
      }
    }
  }

  async transcribe(sessionId, options = {}) {
    const session = this._session(sessionId);
    if (session.transcription) throw new VoiceError('VOICE_BUSY', 'A transcription is already running for this session');
    if (options.signal?.aborted) throw abortError();
    const pcm = session.router.drainInputBuffer();
    if (!pcm.length) return { ok: true, sessionId, text: '', empty: true, transcribed: false, pcmByteLength: 0 };
    const operation = this._operation(options.signal);
    session.transcription = operation;
    try {
      const result = await this.backend.transcribe(pcm, { ...options, sampleRate: this.sampleRate, signal: operation.controller.signal });
      this._checkOperation(session, operation);
      if (result?.ok === false) throw new VoiceError('VOICE_TRANSCRIPTION_FAILED', result.error || 'Speech transcription failed');
      if (typeof result.text !== 'string') throw new VoiceError('VOICE_BACKEND_PROTOCOL', 'Recognizer returned no text field');
      const response = { ...result, ok: true, sessionId, pcmByteLength: pcm.length, transcribed: Boolean(result.text.trim()) };
      session.lastError = null;
      this.emit('voice:transcript', response);
      return response;
    } catch (error) {
      if (session.active && !operation.controller.signal.aborted) session.router.restoreInputBuffer(pcm);
      this._reportError(session, 'transcribe', error);
      throw error;
    } finally {
      operation.release();
      if (session.transcription === operation) session.transcription = null;
      if (session.active && session.turnManager.state === VOICE_STATES.PROCESSING) session.turnManager.transitionTo(VOICE_STATES.IDLE, { reason: 'transcription_complete' });
    }
  }

  /** Explicit opt-in only. Resolves after Windows has opened and started input. */
  async startMicrophone(sessionId, options = {}) {
    const session = this._session(sessionId);
    if (session.microphone) throw new VoiceError('VOICE_BUSY', 'This session already has a microphone capture');
    for (const other of this.sessions.values()) {
      if (other.microphone) throw new VoiceError('VOICE_MICROPHONE_BUSY', 'The microphone is already assigned to another voice session');
    }
    const operation = this._operation(options.signal);
    session.microphone = operation;
    operation.started = false;
    const cleanup = () => {
      operation.release();
      if (session.microphone === operation) {
        session.microphone = null;
        this.emit('voice:microphone_stopped', { sessionId });
      }
    };
    try {
      this._checkOperation(session, operation);
      const job = this.backend.startMicrophone({ ...options, sampleRate: this.sampleRate, signal: operation.controller.signal, onFrame: pcm => {
        if (session.active && !operation.controller.signal.aborted) this.ingestChunk(sessionId, pcm);
      } });
      operation.done = job.done;
      job.done.then(cleanup, error => { this._reportError(session, 'microphone', error); cleanup(); });
      await job.ready;
      this._checkOperation(session, operation);
      if (session.microphone !== operation) throw new VoiceError('VOICE_CAPTURE_ENDED', 'Microphone capture ended before becoming ready');
      operation.started = true;
      const selectedDevice = options.deviceId === undefined ? {} : { deviceId: options.deviceId };
      this.emit('voice:microphone_started', { sessionId, sampleRate: this.sampleRate, ...selectedDevice });
      return { ok: true, sessionId, microphoneActive: true, sampleRate: this.sampleRate, encoding: 'pcm_s16le', channels: 1, ...selectedDevice };
    } catch (error) {
      operation.controller.abort();
      if (!operation.done) { this._reportError(session, 'microphone', error); cleanup(); }
      throw error;
    }
  }

  async stopMicrophone(sessionId) {
    const session = this._session(sessionId);
    const operation = session.microphone;
    if (operation) {
      operation.controller.abort();
      try { await operation.done; } catch (error) { if (error.code !== 'VOICE_CANCELLED') throw error; }
    }
    return { ok: true, sessionId, microphoneActive: false };
  }

  cancelSpeech(sessionId) {
    const session = this._session(sessionId);
    session.output?.controller.abort();
    const dropped = session.router.clearOutputQueue();
    session.turnManager.handleAssistantSpeechEnd();
    return { ok: true, sessionId, ...dropped };
  }

  stopSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return { ok: false, error: 'Session not found' };
    session.active = false;
    session.output?.controller.abort();
    session.transcription?.controller.abort();
    session.microphone?.controller.abort();
    session.router.reset();
    session.vad.reset();
    session.turnManager.reset();
    this.sessions.delete(sessionId);
    this.emit('voice:session_stopped', { sessionId });
    return { ok: true, sessionId };
  }

  getStatus() {
    return {
      activeCount: this.sessions.size,
      sessions: [...this.sessions.values()].map(s => ({ sessionId: s.sessionId, state: s.turnManager.state, bargeInCount: s.turnManager.bargeInCount, router: s.router.getStatus(), microphoneActive: Boolean(s.microphone?.started && !s.microphone.controller.signal.aborted), synthesisActive: Boolean(s.output), playbackActive: Boolean(s.output?.playbackStarted && !s.output.controller.signal.aborted), transcriptionActive: Boolean(s.transcription), lastError: s.lastError })),
      sampleRate: this.sampleRate,
      encoding: 'pcm_s16le',
      channels: 1,
      availability: this.availability,
      duplexAvailable: [...this.sessions.values()].some(s => s.microphone?.started && !s.microphone.controller.signal.aborted && s.output?.playbackStarted && !s.output.controller.signal.aborted),
      echoCancellation: false,
    };
  }

  close() {
    for (const id of this.sessions.keys()) this.stopSession(id);
    this.removeAllListeners();
  }
}
