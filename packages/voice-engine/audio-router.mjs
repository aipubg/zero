/**
 * @fileoverview Zero Audio Stream Router & Buffer
 * Manages low-latency audio chunk ingress/egress, format negotiation, and playback queuing.
 */

import { EventEmitter } from 'node:events';

export class AudioRouter extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {number} [options.sampleRate=16000]
   * @param {number} [options.channels=1]
   * @param {number} [options.maxBufferSize=1048576] // 1MB buffer max
   */
  constructor(options = {}) {
    super();
    this.sampleRate = options.sampleRate || 16000;
    this.channels = options.channels || 1;
    this.maxBufferSize = options.maxBufferSize || 1048576;

    this._inputChunks = [];
    this._inputBytes = 0;
    this._outputQueue = [];
    this._outputBytes = 0;
    this._droppedInputBytes = 0;
    this._droppedOutputBytes = 0;
  }

  /**
   * Ingest incoming PCM chunk from microphone / client stream
   * @param {Buffer|Uint8Array} chunk
   * @returns {{ bytesIngested: number, totalBuffered: number }}
   */
  ingestInputChunk(chunk) {
    if (!chunk || chunk.length === 0) return { bytesIngested: 0, totalBuffered: this._inputBytes };

    const buf = Buffer.from(chunk);
    this._inputChunks.push(buf);
    this._inputBytes += buf.length;

    // Prune if exceeded max
    while (this._inputBytes > this.maxBufferSize && this._inputChunks.length > 0) {
      const removed = this._inputChunks[0];
      const bytes = Math.min(removed.length, this._inputBytes - this.maxBufferSize);
      if (bytes === removed.length) this._inputChunks.shift();
      else this._inputChunks[0] = Buffer.from(removed.subarray(bytes));
      this._inputBytes -= bytes;
      this._droppedInputBytes += bytes;
    }

    this.emit('input:chunk', buf);
    return { bytesIngested: buf.length, totalBuffered: this._inputBytes };
  }

  /**
   * Drain input buffer as a single contiguous PCM buffer
   * @returns {Buffer}
   */
  drainInputBuffer() {
    if (this._inputChunks.length === 0) return Buffer.alloc(0);
    const combined = Buffer.concat(this._inputChunks);
    this._inputChunks = [];
    this._inputBytes = 0;
    return combined;
  }

  // Restore failed recognition ahead of any newly arriving audio.
  restoreInputBuffer(pcm) {
    this._inputChunks.unshift(Buffer.from(pcm));
    this._inputBytes += pcm.length;
    while (this._inputBytes > this.maxBufferSize && this._inputChunks.length) {
      const dropped = this._inputChunks[0];
      const bytes = Math.min(dropped.length, this._inputBytes - this.maxBufferSize);
      if (bytes === dropped.length) this._inputChunks.shift();
      else this._inputChunks[0] = Buffer.from(dropped.subarray(bytes));
      this._inputBytes -= bytes;
      this._droppedInputBytes += bytes;
    }
  }

  /**
   * Queue audio chunk for output playback
   * @param {Buffer|Uint8Array} chunk
   */
  enqueueOutputChunk(chunk) {
    if (!chunk || chunk.length === 0) return;
    const buf = Buffer.from(chunk);
    this._outputQueue.push(buf);
    this._outputBytes += buf.length;
    while (this._outputBytes > this.maxBufferSize && this._outputQueue.length) {
      const dropped = this._outputQueue.shift().length;
      this._outputBytes -= dropped;
      this._droppedOutputBytes += dropped;
    }
    this.emit('output:chunk', buf);
  }

  drainOutputBuffer() {
    const pcm = Buffer.concat(this._outputQueue, this._outputBytes);
    this._outputQueue = [];
    this._outputBytes = 0;
    return pcm;
  }

  /**
   * Clear output queue immediately (used on barge-in / interruption)
   */
  clearOutputQueue() {
    const droppedCount = this._outputQueue.length;
    const droppedBytes = this._outputBytes;
    this._outputQueue = [];
    this._outputBytes = 0;
    this.emit('output:interrupted', { droppedCount, droppedBytes });
    return { droppedCount, droppedBytes };
  }

  getStatus() {
    return {
      sampleRate: this.sampleRate,
      channels: this.channels,
      bufferedInputBytes: this._inputBytes,
      bufferedOutputBytes: this._outputBytes,
      outputQueueLength: this._outputQueue.length,
      droppedInputBytes: this._droppedInputBytes,
      droppedOutputBytes: this._droppedOutputBytes,
    };
  }

  reset() {
    this._inputChunks = [];
    this._inputBytes = 0;
    this._outputQueue = [];
    this._outputBytes = 0;
    this._droppedInputBytes = 0;
    this._droppedOutputBytes = 0;
  }
}
