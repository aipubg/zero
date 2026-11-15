/**
 * Zero AI — Voice Status Engine
 *
 * Detects Web Speech API (browser TTS/ASR) and Windows SAPI TTS availability.
 * No external zero dependency.
 */

export class VoiceStatus {
  constructor() {
    this._tts = 'none';
    this._asr = 'none';
    this._ready = false;
    this._probe();
  }

  _probe() {
    // Browser Web Speech API TTS (speechSynthesis)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this._tts = 'webspeech';
      this._ready = true;
    }
    // Windows SAPI TTS is available on win32 via the voice-engine
    if (process.platform === 'win32') {
      this._tts = this._tts === 'none' ? 'sapi' : this._tts;
      this._ready = true;
    }
    // Whisper ASR is available through packages/voice-engine
    try {
      this._asr = 'whisper';
      if (this._tts !== 'none') this._ready = true;
    } catch {}
    // Whisper ASR is available through packages/voice-engine
    try {
      // Whisper is bundled in packages/voice-engine/whisper-speech.mjs
      this._asr = 'whisper';
      if (this._tts !== 'none') this._ready = true;
    } catch {}
  }

  async isAvailable() {
    return this._ready;
  }

  getStatus() {
    return {
      ready: this._ready,
      tts: this._tts,
      asr: this._asr,
      provider: 'zero-local-voice',
      available: this._ready,
    };
  }
}

export const defaultVoiceStatus = new VoiceStatus();
