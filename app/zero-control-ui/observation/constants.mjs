/**
 * Zero screen-observation constants.
 *
 * These are operational bounds, not performance guarantees. Capture is disabled
 * until the owner starts it; Private Mode always wins.
 */

export const OBSERVATION_METHODS = Object.freeze({
  status: "zero.observation.status",
  control: "zero.observation.control",
  recent: "zero.observation.recent",
});

export const OBSERVATION_ACTIONS = Object.freeze([
  "start",
  "stop",
  "private-on",
  "private-off",
]);

export const OBSERVATION_LIMITS = Object.freeze({
  horizonMs: 5 * 60_000,
  maxRingBytes: 500 * 1024 * 1024,
  maxRingFrames: 600,
  maxFramesPerMinute: 120,
  minFrameIntervalMs: 500,
  maxSourceBytes: 250 * 1024 * 1024,
  maxWorkerPending: 8,
  maxWorkerConcurrency: 1,
  captureIntervalMs: 1_000,
  idleIntervalMs: 5_000,
  idleAfterUnchanged: 3,
  maxImageDimension: 1_280,
  maxObservedTextChars: 4_000,
  maxRecentRows: 20,
  maxConsecutiveErrors: 3,
  cleanupTimeoutMs: 2_000,
});

export const OBSERVATION_STATES = Object.freeze({
  idle: "idle",
  capturing: "capturing",
  private: "private",
  stopped: "stopped",
  error: "error",
  unavailable: "unavailable",
});
