/**
 * @fileoverview Duplex Turn-Taking and Barge-in Manager
 * Coordinates conversational states: IDLE -> LISTENING -> PROCESSING -> SPEAKING.
 * Handles instant user interruption / barge-in.
 */

import { EventEmitter } from 'node:events';

export const VOICE_STATES = Object.freeze({
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
});

export class SpeechTurnManager extends EventEmitter {
  constructor() {
    super();
    this.state = VOICE_STATES.IDLE;
    this.bargeInCount = 0;
    this.turnIndex = 0;
  }

  transitionTo(newState, meta = {}) {
    if (!Object.values(VOICE_STATES).includes(newState)) {
      throw new Error(`Invalid voice state: ${newState}`);
    }
    const oldState = this.state;
    this.state = newState;
    this.emit('state:change', { from: oldState, to: newState, ...meta });
  }

  /**
   * Called when user starts speaking (from VAD)
   */
  handleUserSpeechStart() {
    if (this.state === VOICE_STATES.SPEAKING) {
      // Barge-in detected!
      this.bargeInCount++;
      this.emit('barge_in', { turnIndex: this.turnIndex, count: this.bargeInCount });
      this.transitionTo(VOICE_STATES.LISTENING, { reason: 'barge_in' });
      return { bargeIn: true };
    }

    if (this.state === VOICE_STATES.IDLE || this.state === VOICE_STATES.PROCESSING) {
      this.turnIndex++;
      this.transitionTo(VOICE_STATES.LISTENING, { reason: 'user_speech_start' });
    }

    return { bargeIn: false };
  }

  /**
   * Called when user finishes speaking (from VAD)
   */
  handleUserSpeechEnd() {
    if (this.state === VOICE_STATES.LISTENING) {
      this.transitionTo(VOICE_STATES.PROCESSING, { reason: 'user_speech_end' });
    }
  }

  /**
   * Called when assistant begins streaming audio synthesis
   */
  handleAssistantSpeechStart() {
    this.transitionTo(VOICE_STATES.SPEAKING, { reason: 'assistant_speech_start' });
  }

  /**
   * Called when assistant finishes audio synthesis
   */
  handleAssistantSpeechEnd() {
    if (this.state === VOICE_STATES.SPEAKING) {
      this.transitionTo(VOICE_STATES.IDLE, { reason: 'assistant_speech_complete' });
    }
  }

  reset() {
    this.state = VOICE_STATES.IDLE;
    this.bargeInCount = 0;
    this.turnIndex = 0;
  }
}
