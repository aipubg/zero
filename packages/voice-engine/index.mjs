/**
 * @fileoverview Zero Real-Time Conversational Voice Assistant Architecture
 * Full duplex streaming, VAD, barge-in interruption, and speech synthesis/transcription adapters.
 */

import { EventEmitter } from 'node:events';
import { VoiceActivityDetector } from './vad.mjs';
import { AudioRouter } from './audio-router.mjs';
import { SpeechTurnManager, VOICE_STATES } from './speech-turn.mjs';

export { VoiceActivityDetector, AudioRouter, SpeechTurnManager, VOICE_STATES };

export class VoiceEngine extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {Object} [options.modelFabric]
   * @param {number} [options.sampleRate=16000]
   */
  constructor(options = {}) {
    super();
    this.modelFabric = options.modelFabric || null;
    this.sampleRate = options.sampleRate || 16000;
    this.sessions = new Map(); // sessionId -> { router, vad, turnManager, active }
  }

  /**
   * Create or resume a voice session
   * @param {string} sessionId
   * @returns {Object}
   */
  startSession(sessionId) {
    if (!sessionId) throw new Error('sessionId is required');

    if (this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId);
      existing.active = true;
      return { ok: true, sessionId, status: 'resumed' };
    }

    const router = new AudioRouter({ sampleRate: this.sampleRate });
    const vad = new VoiceActivityDetector({ sampleRate: this.sampleRate });
    const turnManager = new SpeechTurnManager();

    // Wire VAD and Turn Manager
    vad.on('speech_start', (meta) => {
      const result = turnManager.handleUserSpeechStart();
      if (result.bargeIn) {
        // Immediate user interruption! Drain audio output
        const interrupted = router.clearOutputQueue();
        this.emit('voice:barge_in', { sessionId, ...interrupted, ...meta });
      }
      this.emit('voice:speech_start', { sessionId, ...meta });
    });

    vad.on('speech_end', (meta) => {
      turnManager.handleUserSpeechEnd();
      this.emit('voice:speech_end', { sessionId, ...meta });
    });

    turnManager.on('state:change', (change) => {
      this.emit('voice:state', { sessionId, ...change });
    });

    const session = {
      sessionId,
      router,
      vad,
      turnManager,
      active: true,
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    this.emit('voice:session_started', { sessionId });
    return { ok: true, sessionId, status: 'started' };
  }

  /**
   * Stream incoming microphone PCM chunk to the voice pipeline
   * @param {string} sessionId
   * @param {Buffer|Uint8Array|string} chunk - binary buffer or base64 string
   */
  ingestChunk(sessionId, chunk) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.active) {
      throw new Error(`Voice session '${sessionId}' is not active or does not exist`);
    }

    let pcmBuffer;
    if (typeof chunk === 'string') {
      pcmBuffer = Buffer.from(chunk, 'base64');
    } else if (Buffer.isBuffer(chunk)) {
      pcmBuffer = chunk;
    } else {
      pcmBuffer = Buffer.from(chunk);
    }

    // Router buffers and emits
    session.router.ingestInputChunk(pcmBuffer);

    // VAD analyzes energy and speech presence
    const vadResult = session.vad.processFrame(pcmBuffer);

    return {
      ok: true,
      sessionId,
      state: session.turnManager.state,
      vad: vadResult,
    };
  }

  /**
   * Assistant synthesizes speech and emits audio frames to the router
   * @param {string} sessionId
   * @param {string} text
   */
  async synthesizeSpeech(sessionId, text) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Voice session '${sessionId}' not found`);

    session.turnManager.handleAssistantSpeechStart();

    // Generate mock/synthetic 16kHz PCM audio frame representing the response
    // 16000 samples/sec * 2 bytes/sample = 32000 bytes per second
    // Generate a 0.25 second speech-level sine wave beep/tone for verifiable PCM stream
    const durationSec = 0.25;
    const sampleCount = Math.floor(this.sampleRate * durationSec);
    const audioBuf = Buffer.alloc(sampleCount * 2);

    for (let i = 0; i < sampleCount; i++) {
      const sample = Math.sin((2 * Math.PI * 440 * i) / this.sampleRate) * 0.3 * 32767;
      audioBuf.writeInt16LE(Math.floor(sample), i * 2);
    }

    session.router.enqueueOutputChunk(audioBuf);
    session.turnManager.handleAssistantSpeechEnd();

    return {
      ok: true,
      sessionId,
      text,
      pcmByteLength: audioBuf.length,
      sampleRate: this.sampleRate,
    };
  }

  /**
   * STT Adapter placeholder (transcribes audio into text)
   * @param {string} sessionId
   */
  async transcribe(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Voice session '${sessionId}' not found`);

    const pcm = session.router.drainInputBuffer();
    if (pcm.length === 0) {
      return { ok: true, text: '', empty: true };
    }

    // In a live production environment with Speech-to-Text API, this sends pcm to Gemini Live/Whisper
    return {
      ok: true,
      pcmByteLength: pcm.length,
      transcribed: true,
      text: '[Audio Transcribed Input]',
    };
  }

  stopSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return { ok: false, error: 'Session not found' };

    session.active = false;
    session.router.reset();
    session.vad.reset();
    session.turnManager.reset();
    this.sessions.delete(sessionId);
    this.emit('voice:session_stopped', { sessionId });
    return { ok: true, sessionId };
  }

  getStatus() {
    const activeSessions = [];
    for (const [id, s] of this.sessions.entries()) {
      activeSessions.push({
        sessionId: id,
        state: s.turnManager.state,
        bargeInCount: s.turnManager.bargeInCount,
        router: s.router.getStatus(),
      });
    }

    return {
      activeCount: activeSessions.length,
      sessions: activeSessions,
      sampleRate: this.sampleRate,
      duplexAvailable: true,
    };
  }

  close() {
    for (const [id] of this.sessions) {
      this.stopSession(id);
    }
    this.removeAllListeners();
  }
}
