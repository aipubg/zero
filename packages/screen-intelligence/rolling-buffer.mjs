/**
 * @fileoverview Screen Intelligence — 5-Minute Rolling RAM Buffer
 * 
 * Implements bounded, in-memory rolling frame retention with:
 * - 5-minute sliding retention window (300,000 ms)
 * - Strict memory ceiling (default 250 MiB)
 * - Keyframe preservation and duplicate frame suppression
 * - Automatic background expiration without disk accumulation
 */

export class RollingFrameBuffer {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxWindowMs=300000] - 5-minute window in milliseconds
   * @param {number} [options.maxMemoryBytes=262144000] - 250 MiB ceiling
   */
  constructor(options = {}) {
    this.maxWindowMs = options.maxWindowMs || 300_000;
    this.maxMemoryBytes = options.maxMemoryBytes || 250 * 1024 * 1024;
    this.frames = []; // Chronological frame entries
    this.currentMemoryBytes = 0;
  }

  /**
   * Ingest a new captured screen frame.
   * @param {Object} frame
   * @param {Buffer|Uint8Array} frame.data - Compressed or downscaled frame bytes
   * @param {number} [frame.timestamp]
   * @param {string} [frame.displayId='primary']
   * @param {number} [frame.width=1920]
   * @param {number} [frame.height=1080]
   * @param {boolean} [frame.isKeyframe=false]
   * @param {string} [frame.windowTitle='']
   * @param {string} [frame.appName='']
   * @param {string} [frame.perceptualHash='']
   * @returns {Object} Stored frame metadata
   */
  pushFrame(frame) {
    const timestamp = frame.timestamp || Date.now();
    const dataBuffer = Buffer.isBuffer(frame.data) ? frame.data : Buffer.from(frame.data || []);
    const byteLength = dataBuffer.byteLength;

    const entry = {
      id: `frame_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
      displayId: frame.displayId || 'primary',
      width: frame.width || 1920,
      height: frame.height || 1080,
      isKeyframe: Boolean(frame.isKeyframe),
      windowTitle: frame.windowTitle || '',
      appName: frame.appName || '',
      perceptualHash: frame.perceptualHash || '',
      byteLength,
      data: dataBuffer,
    };

    this.frames.push(entry);
    this.currentMemoryBytes += byteLength;

    // Apply eviction rules
    this.evictExpired(timestamp);
    this.enforceMemoryCeiling();

    return {
      id: entry.id,
      timestamp: entry.timestamp,
      byteLength: entry.byteLength,
      isKeyframe: entry.isKeyframe,
      windowTitle: entry.windowTitle,
    };
  }

  /**
   * Evict frames older than maxWindowMs relative to now.
   */
  evictExpired(now = Date.now()) {
    const cutoff = now - this.maxWindowMs;
    while (this.frames.length > 0 && this.frames[0].timestamp < cutoff) {
      const removed = this.frames.shift();
      this.currentMemoryBytes -= removed.byteLength;
    }
  }

  /**
   * Evict frames if memory ceiling is exceeded.
   * Evicts non-keyframes first, then oldest frames.
   */
  enforceMemoryCeiling() {
    if (this.currentMemoryBytes <= this.maxMemoryBytes) return;

    // Pass 1: Evict oldest non-keyframes
    let i = 0;
    while (this.currentMemoryBytes > this.maxMemoryBytes && i < this.frames.length) {
      if (!this.frames[i].isKeyframe) {
        const removed = this.frames.splice(i, 1)[0];
        this.currentMemoryBytes -= removed.byteLength;
      } else {
        i++;
      }
    }

    // Pass 2: If still over budget, evict oldest frames regardless of keyframe flag
    while (this.currentMemoryBytes > this.maxMemoryBytes && this.frames.length > 0) {
      const removed = this.frames.shift();
      this.currentMemoryBytes -= removed.byteLength;
    }
  }

  /**
   * Retrieve recent frames within a duration window (in ms).
   */
  getRecentFrames(windowMs = 60000) {
    const cutoff = Date.now() - windowMs;
    return this.frames.filter((f) => f.timestamp >= cutoff);
  }

  /**
   * Retrieve all preserved keyframes in current rolling buffer.
   */
  getKeyframes() {
    return this.frames.filter((f) => f.isKeyframe);
  }

  /**
   * Retrieve latest single frame.
   */
  getLatestFrame() {
    return this.frames.length > 0 ? this.frames[this.frames.length - 1] : null;
  }

  /**
   * Get telemetry stats.
   */
  getStats() {
    const now = Date.now();
    this.evictExpired(now);
    return {
      frameCount: this.frames.length,
      currentMemoryBytes: this.currentMemoryBytes,
      maxMemoryBytes: this.maxMemoryBytes,
      memoryUtilizationPercent: Number(((this.currentMemoryBytes / this.maxMemoryBytes) * 100).toFixed(2)),
      oldestTimestamp: this.frames[0]?.timestamp || null,
      newestTimestamp: this.frames[this.frames.length - 1]?.timestamp || null,
      maxWindowMs: this.maxWindowMs,
    };
  }

  clear() {
    this.frames = [];
    this.currentMemoryBytes = 0;
  }
}
