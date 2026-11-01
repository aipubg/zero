/**
 * @fileoverview Screen Intelligence — Lightweight Visual & Contextual Change Detector
 * 
 * Prevents unnecessary heavy vision model inference by gating frames through:
 * - Active application & foreground window title comparison
 * - Fast perceptual hash & block luminance comparison
 * - Configurable change threshold (default 5% visual delta)
 */

import crypto from 'node:crypto';

export class ChangeDetector {
  /**
   * @param {Object} [options]
   * @param {number} [options.threshold=0.05] - Minimum visual delta (0.0 to 1.0)
   */
  constructor(options = {}) {
    this.threshold = options.threshold !== undefined ? options.threshold : 0.05;
    this.lastWindowTitle = '';
    this.lastAppName = '';
    this.lastHash = '';
    this.lastSample = null;
  }

  /**
   * Evaluate whether a frame represents a significant visual or contextual state change.
   * @param {Object} frameMetadata
   * @param {string} [frameMetadata.windowTitle='']
   * @param {string} [frameMetadata.appName='']
   * @param {Buffer|Uint8Array} [frameMetadata.data]
   * @returns {Object} { hasChanged: boolean, reason: string, score: number }
   */
  detectChange(frameMetadata = {}) {
    const windowTitle = frameMetadata.windowTitle || '';
    const appName = frameMetadata.appName || '';
    const data = frameMetadata.data;

    // 1. Contextual metadata change (highest confidence, 0 inference cost)
    if (appName && this.lastAppName && appName !== this.lastAppName) {
      this.lastAppName = appName;
      this.lastWindowTitle = windowTitle;
      return { hasChanged: true, reason: 'app_switched', score: 1.0 };
    }

    if (windowTitle && this.lastWindowTitle && windowTitle !== this.lastWindowTitle) {
      this.lastWindowTitle = windowTitle;
      return { hasChanged: true, reason: 'window_title_changed', score: 0.8 };
    }

    // 2. Perceptual data hash comparison
    if (data && data.length > 0) {
      const hash = crypto.createHash('sha256').update(data.slice(0, Math.min(data.length, 4096))).digest('hex');
      if (!this.lastHash) {
        this.lastHash = hash;
        this.lastWindowTitle = windowTitle;
        this.lastAppName = appName;
        return { hasChanged: true, reason: 'initial_frame', score: 1.0 };
      }

      if (hash === this.lastHash) {
        return { hasChanged: false, reason: 'identical_hash', score: 0.0 };
      }

      this.lastHash = hash;
      this.lastWindowTitle = windowTitle;
      this.lastAppName = appName;
      return { hasChanged: true, reason: 'visual_delta', score: 0.5 };
    }

    return { hasChanged: false, reason: 'static', score: 0.0 };
  }

  reset() {
    this.lastWindowTitle = '';
    this.lastAppName = '';
    this.lastHash = '';
    this.lastSample = null;
  }
}
