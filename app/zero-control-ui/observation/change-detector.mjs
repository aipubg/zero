import { createHash } from "node:crypto";

function sampledDifference(previous, next, samples = 256) {
  const left = previous.buffer;
  const right = next.buffer;
  if (!Buffer.isBuffer(left) || !Buffer.isBuffer(right)) return 1;
  const length = Math.min(left.length, right.length);
  if (length === 0) return 1;
  const step = Math.max(1, Math.floor(length / Math.max(1, samples)));
  let compared = 0;
  let different = 0;
  for (let index = 0; index < length; index += step) {
    compared += 1;
    if (left[index] !== right[index]) different += 1;
  }
  const lengthPenalty = Math.abs(left.length - right.length) / Math.max(left.length, right.length);
  return Math.min(1, different / Math.max(1, compared) + lengthPenalty);
}

/**
 * Coarse, local change detector.
 *
 * The exact hash deduplicates identical compressed frames. The sampled-byte
 * ratio catches larger scene changes without decoding the image. It is a
 * conservative first-slice signal, not a perceptual image hash; UIA/window
 * metadata is the primary semantic event source in the perception step.
 */
export function createChangeDetector({
  threshold = 0.08,
  samples = 256,
  clock = Date.now,
} = {}) {
  if (!(threshold >= 0 && threshold <= 1)) {
    throw new Error("change threshold must be between 0 and 1");
  }
  const evaluate = (previous, next) => {
    if (!next || !Buffer.isBuffer(next.buffer)) {
      return { changed: false, reason: "invalid-frame", score: 0 };
    }
    if (!previous) {
      return { changed: true, reason: "initial", score: 1 };
    }
    if (
      typeof previous.sceneKey === "string" &&
      typeof next.sceneKey === "string" &&
      previous.sceneKey !== next.sceneKey
    ) {
      return { changed: true, reason: "scene", score: 1 };
    }
    const nextHash = createHash("sha256").update(next.buffer).digest("hex");
    if (previous.hash && previous.hash === nextHash) {
      return { changed: false, reason: "identical", score: 0, hash: nextHash };
    }
    const score = sampledDifference(previous, next, samples);
    return {
      changed: score >= threshold,
      reason: score >= threshold ? "pixels" : "below-threshold",
      score,
      hash: nextHash,
    };
  };
  const remember = (frame, result) => ({
    ...frame,
    hash: result.hash ?? createHash("sha256").update(frame.buffer).digest("hex"),
    comparedAtMs: clock(),
  });
  return { evaluate, remember, threshold };
}
