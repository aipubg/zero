/**
 * @fileoverview Zero Screen Intelligence Engine (Screenpipe-Class Continuous Observation)
 * 
 * Provides continuous local desktop awareness:
 * 1. Capture abstraction & ingestion
 * 2. 5-Minute rolling RAM buffer with 250MB memory ceiling
 * 3. Lightweight change detection before model inference
 * 4. Persistent semantic observation memory in SQLite
 * 5. On-demand contextual query interface for ZERO agents
 */

import { EventEmitter } from 'node:events';
import { RollingFrameBuffer } from './rolling-buffer.mjs';
import { ChangeDetector } from './change-detector.mjs';
import { SemanticObservationStore } from './semantic-store.mjs';

export class ScreenObserver extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxMemoryBytes=262144000] - 250 MiB ceiling
   * @param {number} [options.maxWindowMs=300000] - 5-minute rolling window
   * @param {string} [options.dbPath] - Path to SQLite observation store
   */
  constructor(options = {}) {
    super();
    this.buffer = new RollingFrameBuffer(options);
    this.detector = new ChangeDetector(options);
    this.store = new SemanticObservationStore(options);
    this.running = false;
    this.captureIntervalMs = options.captureIntervalMs || 1000;
    this.stats = {
      totalFramesIngested: 0,
      totalChangesDetected: 0,
      totalObservationsStored: 0,
      lastChangeTimestamp: null,
      activeApplication: 'unknown',
      activeWindowTitle: '',
    };
  }

  /**
   * Start the continuous observation pipeline.
   */
  start() {
    if (this.running) return;
    this.running = true;
    this.emit('started', { timestamp: Date.now() });
  }

  /**
   * Stop the observation pipeline.
   */
  stop() {
    this.running = false;
    this.emit('stopped', { timestamp: Date.now() });
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
    this.stats.totalFramesIngested++;

    const change = this.detector.detectChange(frame);
    const isKeyframe = change.hasChanged;

    // 1. Push into 5-minute rolling RAM buffer
    this.buffer.pushFrame({
      ...frame,
      isKeyframe,
      perceptualHash: change.reason,
    });

    // Update active context
    if (frame.appName) this.stats.activeApplication = frame.appName;
    if (frame.windowTitle) this.stats.activeWindowTitle = frame.windowTitle;

    // 2. If significant change detected, persist structured semantic observation
    if (change.hasChanged) {
      this.stats.totalChangesDetected++;
      this.stats.lastChangeTimestamp = Date.now();

      const obsId = this.store.insertObservation({
        timestamp: Date.now(),
        source_device: 'local-windows-host',
        display_id: frame.displayId || 'primary',
        application_id: frame.appName || 'unknown',
        window_context: frame.windowTitle || '',
        observed_text: frame.ocrText || '',
        semantic_summary: `Desktop changed: ${change.reason} in ${frame.appName || 'application'} ("${frame.windowTitle || ''}")`,
        event_type: change.reason,
        confidence: change.score,
      });

      this.stats.totalObservationsStored++;

      this.emit('change', {
        observationId: obsId,
        reason: change.reason,
        score: change.score,
        appName: frame.appName,
        windowTitle: frame.windowTitle,
        timestamp: Date.now(),
      });
    }

    return {
      ingested: true,
      hasChanged: change.hasChanged,
      reason: change.reason,
      bufferStats: this.buffer.getStats(),
    };
  }

  /**
   * Query contextual environment state for ZERO agents and assistants.
   * @param {string} query - Query string or intent
   * @returns {Object} Context report
   */
  queryContext(query = '') {
    const q = (query || '').toLowerCase().trim();
    const latest = this.store.getLatestContext();
    const recent = this.store.getRecentObservations(10);

    let answer = '';
    if (q.includes('active') || q.includes('current') || q.includes('window')) {
      answer = latest
        ? `Active application: ${latest.application_id}, Window title: "${latest.window_context}"`
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
      activeApplication: this.stats.activeApplication,
      activeWindowTitle: this.stats.activeWindowTitle,
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
      stats: { ...this.stats },
      buffer: this.buffer.getStats(),
      observationStore: {
        active: true,
        path: this.store.dbPath,
      },
    };
  }

  destroy() {
    this.stop();
    this.buffer.clear();
    this.store.close();
  }
}

export const canonicalScreenObserver = new ScreenObserver();
export { RollingFrameBuffer, ChangeDetector, SemanticObservationStore };
