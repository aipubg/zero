/**
 * @fileoverview Screen Intelligence — Lightweight Visual & Contextual Change Detector
 * 
 * Gates persistent observations through:
 * - Active application & foreground window title comparison
 * - Full encoded-image SHA-256 equality (not a perceptual/semantic score)
 */

import crypto from 'node:crypto';

export class ChangeDetector {
  /**
   * @param {Object} [options]
   * @param {number} [options.threshold=0.05] - Retained for compatibility; byte equality has no perceptual threshold
   */
  constructor(options = {}) {
    this.threshold = options.threshold !== undefined ? options.threshold : 0.05;
    this.lastWindowTitle = '';
    this.lastAppName = '';
    this.lastHash = '';
    this.lastOcrText = '';
    this.lastOcrStatus = '';
    this.lastSample = null;
  }

  /**
   * Evaluate whether a frame represents a significant visual or contextual state change.
   * @param {Object} frameMetadata
   * @param {string} [frameMetadata.windowTitle='']
   * @param {string} [frameMetadata.appName='']
   * @param {Buffer|Uint8Array} [frameMetadata.data]
   * @returns {Object} { hasChanged: boolean, reason: string, score: null }
   */
  detectChange(frameMetadata = {}) {
    const windowTitle = frameMetadata.windowTitle || '';
    const appName = frameMetadata.appName || '';
    const data = frameMetadata.data;

    if (!data?.length) return { hasChanged: false, reason: 'static', score: null };
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    let reason = 'identical_hash';
    if (!this.lastHash) reason = 'initial_frame';
    else if (appName !== this.lastAppName) reason = 'app_switched';
    else if (windowTitle !== this.lastWindowTitle) reason = 'window_title_changed';
    else if (hash !== this.lastHash) reason = 'visual_delta';
    else if ((frameMetadata.ocrText || '') !== this.lastOcrText || (frameMetadata.ocr?.status || '') !== this.lastOcrStatus) reason = 'ocr_changed';
    this.lastHash = hash;
    this.lastAppName = appName;
    this.lastWindowTitle = windowTitle;
    this.lastOcrText = String(frameMetadata.ocrText || '').slice(0, 12000);
    this.lastOcrStatus = frameMetadata.ocr?.status || '';
    return { hasChanged: reason !== 'identical_hash', reason, score: null, imageHash: hash };
  }

  reset() {
    this.lastWindowTitle = '';
    this.lastAppName = '';
    this.lastHash = '';
    this.lastOcrText = '';
    this.lastOcrStatus = '';
    this.lastSample = null;
  }
}
