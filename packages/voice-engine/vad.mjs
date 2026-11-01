/**
 * @fileoverview Energy and Zero-Crossing Rate Voice Activity Detector (VAD)
 * Analyzes raw linear PCM audio frames (16-bit signed integer or Float32).
 */

import { EventEmitter } from 'node:events';

export class VoiceActivityDetector extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {number} [options.sampleRate=16000]
   * @param {number} [options.frameDurationMs=30]
   * @param {number} [options.energyThreshold=0.015]
   * @param {number} [options.speechFramesThreshold=3]
   * @param {number} [options.silenceFramesThreshold=10]
   */
  constructor(options = {}) {
    super();
    this.sampleRate = options.sampleRate || 16000;
    this.frameDurationMs = options.frameDurationMs || 30;
    this.energyThreshold = options.energyThreshold ?? 0.015;
    this.speechFramesThreshold = options.speechFramesThreshold || 3;
    this.silenceFramesThreshold = options.silenceFramesThreshold || 10;

    this.isSpeaking = false;
    this._speechCount = 0;
    this._silenceCount = 0;
  }

  /**
   * Calculate Root Mean Square (RMS) energy of PCM sample buffer (normalized 0.0 - 1.0)
   * @param {Buffer|Int16Array|Float32Array} pcmData
   * @returns {number}
   */
  calculateRMS(pcmData) {
    if (!pcmData || pcmData.length === 0) return 0;

    let sumSquares = 0;
    let sampleCount = 0;

    if (pcmData instanceof Float32Array) {
      sampleCount = pcmData.length;
      for (let i = 0; i < sampleCount; i++) {
        sumSquares += pcmData[i] * pcmData[i];
      }
    } else if (pcmData instanceof Int16Array) {
      sampleCount = pcmData.length;
      for (let i = 0; i < sampleCount; i++) {
        const norm = pcmData[i] / 32768.0;
        sumSquares += norm * norm;
      }
    } else if (Buffer.isBuffer(pcmData)) {
      // 16-bit signed integer little-endian
      sampleCount = Math.floor(pcmData.length / 2);
      for (let i = 0; i < sampleCount; i++) {
        const val = pcmData.readInt16LE(i * 2);
        const norm = val / 32768.0;
        sumSquares += norm * norm;
      }
    }

    if (sampleCount === 0) return 0;
    return Math.sqrt(sumSquares / sampleCount);
  }

  /**
   * Calculate Zero-Crossing Rate (ZCR)
   * @param {Buffer|Int16Array} pcmData
   * @returns {number}
   */
  calculateZCR(pcmData) {
    let crossings = 0;
    let sampleCount = 0;
    let prevVal = 0;

    if (Buffer.isBuffer(pcmData)) {
      sampleCount = Math.floor(pcmData.length / 2);
      if (sampleCount < 2) return 0;
      prevVal = pcmData.readInt16LE(0);
      for (let i = 1; i < sampleCount; i++) {
        const curVal = pcmData.readInt16LE(i * 2);
        if ((curVal >= 0 && prevVal < 0) || (curVal < 0 && prevVal >= 0)) {
          crossings++;
        }
        prevVal = curVal;
      }
    } else if (pcmData instanceof Int16Array || pcmData instanceof Float32Array) {
      sampleCount = pcmData.length;
      if (sampleCount < 2) return 0;
      prevVal = pcmData[0];
      for (let i = 1; i < sampleCount; i++) {
        const curVal = pcmData[i];
        if ((curVal >= 0 && prevVal < 0) || (curVal < 0 && prevVal >= 0)) {
          crossings++;
        }
        prevVal = curVal;
      }
    }

    return sampleCount > 0 ? crossings / sampleCount : 0;
  }

  /**
   * Process a single audio frame and determine speech presence
   * @param {Buffer|Int16Array|Float32Array} frame
   * @returns {{ isSpeaking: boolean, energy: number, zcr: number, event: string|null }}
   */
  processFrame(frame) {
    const energy = this.calculateRMS(frame);
    const zcr = this.calculateZCR(frame);
    let event = null;

    const speechCandidate = energy >= this.energyThreshold;

    if (speechCandidate) {
      this._speechCount++;
      this._silenceCount = 0;

      if (!this.isSpeaking && this._speechCount >= this.speechFramesThreshold) {
        this.isSpeaking = true;
        event = 'speech_start';
        this.emit('speech_start', { energy, zcr, timestamp: Date.now() });
      } else if (this.isSpeaking) {
        this.emit('speech_frame', { frame, energy, zcr });
      }
    } else {
      this._silenceCount++;
      this._speechCount = 0;

      if (this.isSpeaking && this._silenceCount >= this.silenceFramesThreshold) {
        this.isSpeaking = false;
        event = 'speech_end';
        this.emit('speech_end', { energy, zcr, timestamp: Date.now() });
      }
    }

    return {
      isSpeaking: this.isSpeaking,
      energy,
      zcr,
      event,
    };
  }

  reset() {
    this.isSpeaking = false;
    this._speechCount = 0;
    this._silenceCount = 0;
  }
}
