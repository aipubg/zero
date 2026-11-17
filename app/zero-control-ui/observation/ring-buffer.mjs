import { OBSERVATION_LIMITS } from "./constants.mjs";

function frameBytes(frame) {
  return Buffer.isBuffer(frame?.buffer) ? frame.buffer.length : 0;
}

function zeroFrame(frame) {
  try {
    frame?.buffer?.fill?.(0);
  } catch {
    // App-level purge only; never claim forensic erasure.
  }
}

/**
 * Bounded compressed-frame ring.
 *
 * Invariants:
 *  - frames older than `horizonMs` are evicted;
 *  - total bytes never exceed `maxBytes`;
 *  - total frames never exceed `maxFrames`;
 *  - at most `maxFramesPerMinute` accepted frames and no more than one per
 *    `minFrameIntervalMs`;
 *  - each source respects `maxBytesPerSource`;
 *  - when a cap is hit the caller receives an explicit reason; nothing grows
 *    silently.
 */
export function createFrameRing({
  horizonMs = OBSERVATION_LIMITS.horizonMs,
  maxBytes = OBSERVATION_LIMITS.maxRingBytes,
  maxFrames = OBSERVATION_LIMITS.maxRingFrames,
  maxFramesPerMinute = OBSERVATION_LIMITS.maxFramesPerMinute,
  minFrameIntervalMs = OBSERVATION_LIMITS.minFrameIntervalMs,
  maxBytesPerSource = OBSERVATION_LIMITS.maxSourceBytes,
  clock = Date.now,
} = {}) {
  let frames = [];
  let totalBytes = 0;
  let acceptedAt = [];
  let lastAcceptedAt = 0;

  const sourceBytes = (sourceKey, exceptId) =>
    frames.reduce(
      (sum, frame) =>
        frame.sourceKey === sourceKey && frame.id !== exceptId ? sum + frameBytes(frame) : sum,
      0,
    );

  const evictAt = (index) => {
    const [removed] = frames.splice(index, 1);
    if (!removed) return null;
    totalBytes -= frameBytes(removed);
    zeroFrame(removed);
    return removed;
  };

  const evictOldest = () => (frames.length > 0 ? evictAt(0) : null);

  const prune = (now = clock()) => {
    const cutoff = now - horizonMs;
    let removed = 0;
    while (frames.length > 0 && frames[0].capturedAtMs < cutoff) {
      evictAt(0);
      removed += 1;
    }
    acceptedAt = acceptedAt.filter((timestamp) => now - timestamp < 60_000);
    return removed;
  };

  const enforceCaps = () => {
    let removed = 0;
    while (frames.length > maxFrames) {
      if (!evictOldest()) break;
      removed += 1;
    }
    while (totalBytes > maxBytes) {
      if (!evictOldest()) break;
      removed += 1;
    }
    return removed;
  };

  const add = (frame) => {
    const now = frame?.capturedAtMs ?? clock();
    prune(now);
    if (!frame || typeof frame.id !== "string" || !Buffer.isBuffer(frame.buffer)) {
      return { accepted: false, reason: "invalid", bytes: 0, evicted: 0 };
    }
    const bytes = frame.buffer.length;
    if (bytes <= 0) return { accepted: false, reason: "empty", bytes: 0, evicted: 0 };
    if (bytes > maxBytes) return { accepted: false, reason: "too-large", bytes, evicted: 0 };
    if (lastAcceptedAt > 0 && now - lastAcceptedAt < minFrameIntervalMs) {
      return { accepted: false, reason: "rate", bytes, evicted: 0 };
    }
    if (acceptedAt.length >= maxFramesPerMinute) {
      return { accepted: false, reason: "rate", bytes, evicted: 0 };
    }
    const sourceKey = typeof frame.sourceKey === "string" ? frame.sourceKey : "display";
    let evicted = 0;
    while (sourceBytes(sourceKey) + bytes > maxBytesPerSource) {
      const index = frames.findIndex((candidate) => candidate.sourceKey === sourceKey);
      if (index < 0 || !evictAt(index)) break;
      evicted += 1;
    }
    if (sourceBytes(sourceKey) + bytes > maxBytesPerSource) {
      return { accepted: false, reason: "source-cap", bytes, evicted };
    }
    const stored = {
      ...frame,
      id: frame.id,
      capturedAtMs: now,
      bytes,
      sourceKey,
    };
    frames.push(stored);
    totalBytes += bytes;
    acceptedAt.push(now);
    lastAcceptedAt = now;
    evicted += enforceCaps();
    return { accepted: true, reason: null, bytes, evicted };
  };

  const clear = () => {
    for (const frame of frames) zeroFrame(frame);
    frames = [];
    totalBytes = 0;
    acceptedAt = [];
    lastAcceptedAt = 0;
  };

  const stats = () => {
    const now = clock();
    prune(now);
    return {
      frames: frames.length,
      bytes: totalBytes,
      oldestAtMs: frames.length > 0 ? frames[0].capturedAtMs : null,
      newestAtMs: frames.length > 0 ? frames[frames.length - 1].capturedAtMs : null,
      maxBytes,
      maxFrames,
      horizonMs,
      maxFramesPerMinute,
      minFrameIntervalMs,
      maxBytesPerSource,
    };
  };

  return {
    add,
    clear,
    stats,
    list: () => frames.slice(),
    prune,
    get bytes() {
      return totalBytes;
    },
    get length() {
      return frames.length;
    },
  };
}
