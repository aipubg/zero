/**
 * @fileoverview Local desktop capture, native OCR and persistent observations
 * 
 * Provides continuous local desktop awareness:
 * 1. Native Windows capture loop & ingestion
 * 2. Five-minute rolling frame buffer with a 250 MiB retention budget
 * 3. Encoded-image, metadata and OCR change detection
 * 4. Persistent semantic observation memory in SQLite
 * 5. On-demand contextual query interface for ZERO agents
 */

import { EventEmitter } from 'node:events';
import path from 'node:path';
import { RollingFrameBuffer } from './rolling-buffer.mjs';
import { ChangeDetector } from './change-detector.mjs';
import { SemanticObservationStore } from './semantic-store.mjs';
import { captureRealDesktopFrame } from './windows-capture.mjs';
import { LocalVisionExtractor } from './ocr-vision.mjs';

export class ScreenObserver extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxMemoryBytes=262144000] - 250 MiB ceiling
   * @param {number} [options.maxWindowMs=300000] - 5-minute rolling window
   * @param {string} [options.dbPath] - Path to SQLite observation store
   * @param {number} [options.captureIntervalMs=2000]
   */
  constructor(options = {}) {
    super();
    this.captureIntervalMs = options.captureIntervalMs ?? 2000;
    if (!Number.isSafeInteger(this.captureIntervalMs) || this.captureIntervalMs < 1 || this.captureIntervalMs > 2_147_483_647) throw new RangeError('captureIntervalMs must be a valid positive timer interval');
    this.contextMaxAgeMs = options.contextMaxAgeMs ?? Math.max(30_000, this.captureIntervalMs * 3);
    this.maxFrameBytes = options.maxFrameBytes ?? 8 * 1024 * 1024;
    if (!Number.isSafeInteger(this.maxFrameBytes) || this.maxFrameBytes < 1 || !Number.isFinite(this.contextMaxAgeMs) || this.contextMaxAgeMs < 1) throw new RangeError('Frame size and context age limits must be positive');
    this.buffer = new RollingFrameBuffer(options);
    this.detector = new ChangeDetector(options);
    this.store = new SemanticObservationStore(options);
    this.visionExtractor = new LocalVisionExtractor(options);
    this.localVisionRuntime = options.localVisionRuntime ?? null;
    this.localVisionPrompt = options.localVisionPrompt;
    if (this.localVisionPrompt !== undefined && (typeof this.localVisionPrompt !== 'string' || !this.localVisionPrompt.trim() || this.localVisionPrompt.length > 1000)) throw new Error('Local vision prompt must contain 1..1000 characters');
    this.localVisionMinIntervalMs = options.localVisionMinIntervalMs ?? 30000;
    if (!Number.isFinite(this.localVisionMinIntervalMs) || this.localVisionMinIntervalMs < 1000) throw new Error('Local vision interval must be at least 1000 ms');
    this._visionPending = null;
    this._visionAbort = null;
    this.visionStats = { attempted: 0, completed: 0, failed: 0, lastStartedAt: 0, lastCompletedAt: null, lastError: null, retainedImageBytes: 0 };
    this._capture = options.captureFrame ?? (args => captureRealDesktopFrame({ ...options, ...args, visionExtractor: this.visionExtractor }));
    this.running = false;
    this._captureTimer = null;
    this._generation = 0;
    this._inFlight = null;
    this._abort = null;
    this._destroyed = false;
    this.stats = {
      totalCaptureAttempts: 0,
      totalCaptureFailures: 0,
      totalCapturesDiscarded: 0,
      lastCaptureError: null,
      lastCaptureTimestamp: null,
      lastOcrStatus: 'not-attempted',
      lastMetadataStatus: 'not-attempted',
      lastFrameTimestamp: null,
      totalFramesIngested: 0,
      totalChangesDetected: 0,
      totalObservationsStored: 0,
      lastChangeTimestamp: null,
      activeApplication: 'unknown',
      activeWindowTitle: '',
    };
  }

  /**
   * Start the continuous observation pipeline with a real Windows capture loop.
   * @param {Object} [options]
   * @param {number} [options.intervalMs]
   */
  start(options = {}) {
    if (this._destroyed) throw new Error('Observer is destroyed');
    if (this.running) return;
    const interval = options.intervalMs ?? this.captureIntervalMs;
    if (!Number.isSafeInteger(interval) || interval < 1 || interval > 2_147_483_647) throw new RangeError('intervalMs must be a valid positive timer interval');
    this.running = true;
    const generation = ++this._generation;
    const schedule = (delay) => {
      this._captureTimer = setTimeout(async () => {
        this._captureTimer = null;
        try { await this.captureTick(); }
        finally {
          if (this.running && generation === this._generation) schedule(interval);
        }
      }, delay);
      this._captureTimer.unref?.();
    };
    schedule(0);
    this.emit('started', { timestamp: Date.now(), intervalMs: interval });
  }

  /**
   * Execute an immediate capture tick.
   * @returns {Promise<Object|null>}
   */
  captureTick() {
    if (!this.running || this._destroyed) return Promise.resolve(null);
    // Manual ticks and the loop share a single operation; there is no queue.
    if (this._inFlight) return this._inFlight;
    const generation = this._generation;
    const abort = this._abort = new AbortController();
    this.stats.totalCaptureAttempts++;
    this._inFlight = Promise.resolve().then(async () => {
      try {
        if (abort.signal.aborted) { this.stats.totalCapturesDiscarded++; return null; }
        const frame = await this._capture({ signal: abort.signal });
        if (!this.running || this._destroyed || generation !== this._generation || abort.signal.aborted) {
          this.stats.totalCapturesDiscarded++;
          return null;
        }
        if (!frame || frame.ok !== true) throw new Error(frame?.error || 'capture-failed');
        const result = this.ingestFrame(frame);
        this.stats.lastCaptureError = null;
        this.stats.lastCaptureTimestamp = frame.timestamp;
        this.stats.lastOcrStatus = frame.ocr?.status ?? 'unavailable';
        this.stats.lastMetadataStatus = frame.metadataStatus ?? 'unavailable';
        return result;
      } catch (error) {
        if (abort.signal.aborted || generation !== this._generation) {
          this.stats.totalCapturesDiscarded++;
          return null;
        }
        this.stats.totalCaptureFailures++;
        this.stats.lastCaptureError = { message: error.message, timestamp: Date.now() };
        this.emit('capture-error', this.stats.lastCaptureError);
        if (this.listenerCount('error')) this.emit('error', error);
        return null;
      }
    }).finally(() => {
      this._inFlight = null;
      if (this._abort === abort) this._abort = null;
    });
    return this._inFlight;
  }

  /**
   * Stop the continuous observation pipeline.
   */
  stop() {
    if (this._captureTimer) {
      clearTimeout(this._captureTimer);
      this._captureTimer = null;
    }
    const wasRunning = this.running;
    this.running = false;
    ++this._generation;
    this._abort?.abort();
    if (wasRunning) this.emit('stopped', { timestamp: Date.now() });
    this._visionAbort?.abort();
    const generation = this._generation;
    return Promise.allSettled([this._inFlight, this._visionPending]).then(async () => {
      if (generation === this._generation) await this.localVisionRuntime?.stop();
    });
  }

  /**
   * Ingest a desktop frame sample from capture source.
   * @param {Object} frame
   * @param {Buffer|Uint8Array} frame.data - Raw or compressed frame bytes
   * @param {string} [frame.windowTitle=''] - Active window title
   * @param {string} [frame.appName=''] - Active application name
   * @param {string} [frame.displayId='primary']
   * @param {string} [frame.ocrText=''] - Extracted text (if available)
   */
  ingestFrame(frame = {}) {
    if (this._destroyed) throw new Error('Observer is destroyed');
    if (frame.ok === false || !frame.data?.byteLength) throw new Error('Cannot ingest a failed or empty capture');
    if (frame.data.byteLength > this.maxFrameBytes) throw new Error('Frame exceeds maxFrameBytes');
    frame = { ...frame, appName: String(frame.appName ?? '').slice(0, 256),
      windowTitle: String(frame.windowTitle ?? '').slice(0, 4096), ocrText: String(frame.ocrText ?? '').slice(0, 12000) };
    const timestamp = frame.timestamp ?? Date.now();
    const generation = this._generation;
    const change = this.detector.detectChange(frame);
    const isKeyframe = change.hasChanged;

    let changeEvent = null;
    // Persist before advancing the frame buffer/context, so failures remain retryable.
    if (change.hasChanged) {
      const summary = this.visionExtractor.summarizeFrame({
        appName: frame.appName,
        windowTitle: frame.windowTitle,
        reason: change.reason,
        ocrText: frame.ocrText,
      });

      let obsId;
      try { obsId = this.store.insertObservation({
        timestamp,
        source_device: 'local-windows-host',
        display_id: frame.displayId || 'unknown',
        application_id: frame.appName || 'unknown',
        window_context: frame.windowTitle || '',
        observed_text: frame.ocrText || '',
        semantic_summary: summary,
        event_type: change.reason,
        confidence: null,
        ocr_engine: frame.ocr?.engine ?? null,
        ocr_status: frame.ocr?.status ?? 'unavailable',
        local_vision_status: this.localVisionRuntime?.enabled ? 'not-sampled' : 'unavailable',
        metadata: {
          width: frame.width ?? null, height: frame.height ?? null, pid: frame.pid ?? null,
          hwnd: frame.hwnd ?? null, bounds: frame.bounds ?? null,
          captureSource: frame.captureSource ?? 'external-ingestion',
          captureStartedAt: frame.captureStartedAt ?? null, captureDurationMs: frame.captureDurationMs ?? null,
          metadataTimestamp: frame.metadataTimestamp ?? null, metadataStatus: frame.metadataStatus ?? 'unavailable',
          metadataError: frame.metadataError ?? null, ocrReason: frame.ocr?.reason ?? null,
          ocrLanguage: frame.ocr?.language ?? null, changeMethod: 'encoded-image-sha256-window-metadata-and-ocr',
          localVision: this.visionExtractor.getStatus(),
        },
      }); } catch (error) {
        // Retry an identical frame after a persistence failure instead of losing its observation.
        this.detector.reset();
        throw error;
      }

      this.stats.totalObservationsStored++;
      this.stats.totalChangesDetected++;
      this.stats.lastChangeTimestamp = timestamp;

      changeEvent = {
        observationId: obsId,
        reason: change.reason,
        score: change.score,
        appName: frame.appName,
        windowTitle: frame.windowTitle,
        ocrText: frame.ocrText,
        timestamp,
      };
    }

    this.buffer.pushFrame({ ...frame, isKeyframe, perceptualHash: change.imageHash });
    this.stats.activeApplication = frame.appName || 'unknown';
    this.stats.activeWindowTitle = frame.windowTitle || '';
    this.stats.lastFrameTimestamp = timestamp;
    this.stats.totalFramesIngested++;
    if (changeEvent) this.emit('change', changeEvent);
    if (changeEvent && generation === this._generation) this._scheduleVision(changeEvent.observationId, frame);
    if (generation === this._generation) this.emit('frame', {
      timestamp,
      hasChanged: change.hasChanged,
      appName: frame.appName,
      windowTitle: frame.windowTitle,
    });

    return {
      ingested: true,
      hasChanged: change.hasChanged,
      reason: change.reason,
      bufferStats: this.buffer.getStats(),
    };
  }

  _scheduleVision(observationId, frame) {
    if (!this.running || !this.localVisionRuntime?.enabled || this._visionPending || Date.now() - this.visionStats.lastStartedAt < this.localVisionMinIntervalMs) return;
    const generation = this._generation;
    const controller = this._visionAbort = new AbortController();
    const pixels = Buffer.from(frame.data);
    const capturedAt = frame.timestamp;
    this.visionStats.lastStartedAt = Date.now(); this.visionStats.attempted++;
    this.visionStats.retainedImageBytes = pixels.length;
    this._visionPending = (async () => {
      try {
        const result = await this.localVisionRuntime.describe(pixels, { signal: controller.signal, ...(this.localVisionPrompt ? { prompt: this.localVisionPrompt } : {}) });
        if (!this.running || this._destroyed || generation !== this._generation || controller.signal.aborted) return;
        const inferredAt = Date.now();
        if (this.store.attachVision(observationId, { ...result, inferredAt, imageSha256: this.visionExtractor.computeImageHash(pixels) })) {
          this.visionStats.completed++; this.visionStats.lastCompletedAt = inferredAt; this.visionStats.lastError = null;
          this.emit('vision-observation', { observationId, capturedAt, inferredAt, model: result.model });
        }
      } catch (error) {
        if (!controller.signal.aborted && generation === this._generation) { this.visionStats.failed++; this.visionStats.lastError = error.message; }
      } finally { this._visionPending = null; this._visionAbort = null; this.visionStats.retainedImageBytes = 0; }
    })();
  }

  /**
   * Query contextual environment state for ZERO agents and assistants.
   * @param {string} query - Query string or intent
   * @returns {Object} Context report
   */
  queryContext(query = '') {
    const q = String(query || '').toLowerCase().trim();
    const latest = this.store.getLatestContext();
    const recent = this.store.getRecentObservations(10);

    let answer = '';
    if (q.includes('active') || q.includes('current') || q.includes('window')) {
      answer = latest
        ? `Last recorded application: ${latest.application_id}, Window title: "${latest.window_context}" (observed ${new Date(latest.timestamp).toISOString()}; capture ${this.running ? 'running' : 'stopped'})`
        : 'No desktop window context recorded yet.';
    } else if (q.includes('change') || q.includes('recent')) {
      answer = recent.length > 0
        ? `Recent desktop activity: ${recent.map(r => `${r.application_id} (${r.event_type})`).join(', ')}`
        : 'No recent screen changes detected.';
    } else {
      const results = this.store.searchObservations(query, 5);
      answer = results.length > 0
        ? `Found ${results.length} relevant observation(s): ${results[0].semantic_summary}`
        : 'No matching observations found.';
    }

    return {
      query,
      answer,
      ...this._contextStatus(),
      observationStore: this.store.getStatus(),
      localVision: this.visionExtractor.getStatus(),
      visionInference: { ...this.visionStats, pending: Boolean(this._visionPending), minIntervalMs: this.localVisionMinIntervalMs },
      latestObservation: latest,
      recentObservations: recent,
      bufferFrames: this.buffer.getStats().frameCount,
    };
  }

  /**
   * Telemetry and health status report.
   */
  getStatus() {
    return {
      running: this.running,
      state: this._destroyed ? 'destroyed' : !this.running ? 'stopped' : this.stats.lastCaptureError ? 'capture-failed' : !this.stats.lastCaptureTimestamp ? 'awaiting-capture' : this._contextStatus().current ? 'observing' : 'context-unavailable',
      ...this._contextStatus(),
      captureInFlight: this._inFlight !== null,
      localVision: this.visionExtractor.getStatus(),
      visionInference: { ...this.visionStats, pending: Boolean(this._visionPending), minIntervalMs: this.localVisionMinIntervalMs },
      stats: { ...this.stats },
      buffer: this.buffer.getStats(),
      observationStore: this.store.getStatus(),
    };
  }

  destroy() {
    const pending = this.stop();
    this._destroyed = true;
    this.buffer.clear();
    return Promise.resolve(pending).finally(async () => { this.store.close(); await this.localVisionRuntime?.close(); });
  }

  _contextStatus() {
    const ageMs = this.stats.lastFrameTimestamp === null ? null : Math.max(0, Date.now() - this.stats.lastFrameTimestamp);
    const current = this.running && ageMs !== null && ageMs <= this.contextMaxAgeMs &&
      this.stats.lastCaptureError === null && this.stats.lastMetadataStatus === 'available';
    return { current, ageMs, activeApplication: current ? this.stats.activeApplication : null,
      activeWindowTitle: current ? this.stats.activeWindowTitle : null,
      contextSource: current ? 'recent-os-capture' : 'historical-or-unavailable', running: this.running };
  }
}

/** Construction never starts capture. Host owners must apply their opt-in preference explicitly. */
export function createScreenObserver(options = {}) { return new ScreenObserver(options); }

let canonicalInstance;
/** Resolve lazily so importing classes/tests never opens the owner's live database. */
export function getCanonicalScreenObserver(options = {}) {
  if (!canonicalInstance) canonicalInstance = createScreenObserver(options);
  else if (options.dataDir || options.dbPath) {
    const requestedPath = options.dbPath === ':memory:' ? ':memory:' : path.resolve(options.dbPath ?? path.join(options.dataDir, 'screen-observations.sqlite'));
    if (requestedPath !== canonicalInstance.store.dbPath) throw new Error('Canonical observer already initialized with another path; configure dataDir before its first use or use createScreenObserver');
  }
  return canonicalInstance;
}

// Backwards-compatible method/property access for the host's existing singleton import.
export const canonicalScreenObserver = new Proxy({}, {
  get(_target, key) {
    const instance = getCanonicalScreenObserver();
    const value = Reflect.get(instance, key, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
  set(_target, key, value) { return Reflect.set(getCanonicalScreenObserver(), key, value); },
});
export { RollingFrameBuffer, ChangeDetector, SemanticObservationStore };
