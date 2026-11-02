/**
 * @fileoverview Screen Intelligence — 5-Minute Rolling RAM Buffer
 * 
 * Implements bounded, in-memory rolling frame retention with:
 * - 5-minute sliding retention window (300,000 ms)
 * - Strict memory ceiling (default 250 MiB)
 * - Keyframe preservation; count and metadata bounds
 * - Expiration on push and read, without disk accumulation
 */

export class RollingFrameBuffer {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxWindowMs=300000] - 5-minute window in milliseconds
   * @param {number} [options.maxMemoryBytes=262144000] - 250 MiB ceiling
   */
  constructor(options = {}) {
    this.maxWindowMs = options.maxWindowMs ?? 300_000;
    this.maxMemoryBytes = options.maxMemoryBytes ?? 250 * 1024 * 1024;
    this.maxFrames = options.maxFrames ?? 4096;
    for (const value of [this.maxWindowMs, this.maxMemoryBytes, this.maxFrames]) {
      if (!Number.isSafeInteger(value) || value < 1) throw new RangeError('Buffer limits must be positive integers');
    }
    this.frames = []; // Chronological frame entries
    this.currentMemoryBytes = 0;
    this.retainedMemoryBytes = 0;
  }

  /**
   * Ingest a new captured screen frame.
   * @param {Object} frame
   * @param {Buffer|Uint8Array} frame.data - Compressed or downscaled frame bytes
   * @param {number} [frame.timestamp]
   * @param {string} [frame.displayId='primary']
   * @param {number} [frame.width]
   * @param {number} [frame.height]
   * @param {boolean} [frame.isKeyframe=false]
   * @param {string} [frame.windowTitle='']
   * @param {string} [frame.appName='']
   * @param {string} [frame.perceptualHash='']
   * @returns {Object} Stored frame metadata
   */
  pushFrame(frame) {
    const now = Date.now();
    const timestamp = Number.isFinite(frame.timestamp) ? Math.min(frame.timestamp, now) : now;
    const byteLength = frame.data?.byteLength ?? 0;
    this.evictExpired(now);
    if (!byteLength || byteLength > this.maxMemoryBytes || timestamp < now - this.maxWindowMs) {
      return { retained: false, reason: 'empty-oversize-or-expired-frame' };
    }
    // An owned allocation prevents a tiny subarray retaining a huge parent buffer.
    const dataBuffer = Buffer.allocUnsafeSlow(byteLength);
    dataBuffer.set(frame.data);

    const entry = {
      id: `frame_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
      displayId: String(frame.displayId || 'unknown').slice(0, 128),
      width: frame.width ?? null,
      height: frame.height ?? null,
      isKeyframe: Boolean(frame.isKeyframe),
      windowTitle: String(frame.windowTitle || '').slice(0, 1024),
      appName: String(frame.appName || '').slice(0, 256),
      perceptualHash: String(frame.perceptualHash || '').slice(0, 64),
      byteLength,
      data: dataBuffer,
    };
    entry.retainedBytes = byteLength + 512 + 2 * (entry.id.length + entry.displayId.length + entry.windowTitle.length + entry.appName.length + entry.perceptualHash.length);
    if (entry.retainedBytes > this.maxMemoryBytes) return { retained: false, reason: 'frame-exceeds-budget' };

    this.frames.push(entry);
    this.currentMemoryBytes += byteLength;
    this.retainedMemoryBytes += entry.retainedBytes;

    // Apply eviction rules
    this.evictExpired(timestamp);
    this.enforceMemoryCeiling();

    return {
      id: entry.id,
      retained: this.frames.includes(entry),
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
    for (let i = this.frames.length - 1; i >= 0; i--) {
      if (this.frames[i].timestamp < cutoff) this._remove(i);
    }
  }

  /**
   * Evict frames if memory ceiling is exceeded.
   * Evicts non-keyframes first, then oldest frames.
   */
  enforceMemoryCeiling() {
    if (this.retainedMemoryBytes <= this.maxMemoryBytes && this.frames.length <= this.maxFrames) return;

    // Pass 1: Evict oldest non-keyframes
    let i = 0;
    while ((this.retainedMemoryBytes > this.maxMemoryBytes || this.frames.length > this.maxFrames) && i < this.frames.length) {
      if (!this.frames[i].isKeyframe) {
        this._remove(i);
      } else {
        i++;
      }
    }

    // Pass 2: If still over budget, evict oldest frames regardless of keyframe flag
    while ((this.retainedMemoryBytes > this.maxMemoryBytes || this.frames.length > this.maxFrames) && this.frames.length > 0) {
      this._remove(0);
    }
  }

  /**
   * Retrieve recent frames within a duration window (in ms).
   */
  getRecentFrames(windowMs = 60000) {
    this.evictExpired();
    const cutoff = Date.now() - windowMs;
    return this.frames.filter((f) => f.timestamp >= cutoff);
  }

  /**
   * Retrieve all preserved keyframes in current rolling buffer.
   */
  getKeyframes() {
    this.evictExpired();
    return this.frames.filter((f) => f.isKeyframe);
  }

  /**
   * Retrieve latest single frame.
   */
  getLatestFrame() {
    this.evictExpired();
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
      retainedMemoryBytes: this.retainedMemoryBytes,
      accounting: 'owned-image-bytes-plus-conservative-metadata-estimate; excludes process/driver/OCR working memory',
      maxFrames: this.maxFrames,
      maxMemoryBytes: this.maxMemoryBytes,
      memoryUtilizationPercent: Number(((this.retainedMemoryBytes / this.maxMemoryBytes) * 100).toFixed(2)),
      oldestTimestamp: this.frames[0]?.timestamp || null,
      newestTimestamp: this.frames[this.frames.length - 1]?.timestamp || null,
      maxWindowMs: this.maxWindowMs,
    };
  }

  clear() {
    this.frames = [];
    this.currentMemoryBytes = 0;
    this.retainedMemoryBytes = 0;
  }

  _remove(index) {
    const [entry] = this.frames.splice(index, 1);
    this.currentMemoryBytes -= entry.byteLength;
    this.retainedMemoryBytes -= entry.retainedBytes;
  }
}
