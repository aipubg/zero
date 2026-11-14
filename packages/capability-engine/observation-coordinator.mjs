/**
 * Screen observation coordinator and frame deduplication gate.
 * Adapted from OpenMausBot (Apache-2.0, non-enterprise core).
 *
 * Provides:
 * 1. SHA-256 frame hashing (`screenFrameHash`)
 * 2. Freshness check (`settledFrameIsNews`)
 * 3. Metrics tracking (`ObservationCoordinator`)
 */

import { createHash } from "node:crypto";

export function screenFrameHash(bufferOrBase64) {
  if (!bufferOrBase64) return "";
  const hash = createHash("sha256");
  if (Buffer.isBuffer(bufferOrBase64)) {
    hash.update(bufferOrBase64);
  } else {
    hash.update(String(bufferOrBase64));
  }
  return hash.digest("hex");
}

export function settledFrameIsNews(lastHash, currentBufferOrBase64) {
  if (!lastHash) return true;
  return screenFrameHash(currentBufferOrBase64) !== lastHash;
}

export const emptyObservationMetrics = () => ({
  screenshotsCaptured: 0,
  screenshotsSentToModel: 0,
  fullScreenObservations: 0,
  croppedObservations: 0,
  computerActions: 0,
  retries: 0,
  verificationSuccesses: 0,
  verificationFailures: 0,
});

export class ObservationCoordinator {
  constructor() {
    this.metrics = emptyObservationMetrics();
    this.lastObservation = null;
    this.lastHash = null;
  }

  noteAction(count = 1) {
    this.metrics.computerActions += Math.max(0, Math.trunc(count));
  }

  noteRetry() {
    this.metrics.retries += 1;
  }

  noteVerification(ok) {
    if (ok) this.metrics.verificationSuccesses += 1;
    else this.metrics.verificationFailures += 1;
  }

  observeFrame(frameBufferOrBase64, crop = null) {
    this.metrics.screenshotsCaptured += 1;
    const hash = frameBufferOrBase64 ? screenFrameHash(frameBufferOrBase64) : null;
    const view = crop ? `${crop.x},${crop.y},${crop.width},${crop.height}` : "full";
    const signature = hash ? `${hash}:${view}` : null;

    const changed = signature === null || signature !== this.lastObservation;
    if (signature) {
      this.lastObservation = signature;
      this.lastHash = hash;
    }
    if (changed) {
      this.metrics.screenshotsSentToModel += 1;
      if (crop) this.metrics.croppedObservations += 1;
      else this.metrics.fullScreenObservations += 1;
    }
    return { changed, hash };
  }

  reset() {
    this.metrics = emptyObservationMetrics();
    this.lastObservation = null;
    this.lastHash = null;
  }
}
