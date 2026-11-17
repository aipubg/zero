import { sanitizeObservedText } from "./perception.mjs";

export function createSuggestionPolicy({
  enabled = false,
  minEvidence = 3,
  cooldownSeconds = 600,
  maxSuggestions = 3,
  clock = Date.now,
} = {}) {
  const lastShown = new Map();
  const cooldownMs = Math.max(0, cooldownSeconds) * 1_000;
  const boundedMax = Math.min(3, Math.max(1, maxSuggestions));
  const boundedEvidence = Math.max(2, minEvidence);

  const select = ({ candidates = [] } = {}) => {
    if (!enabled) return { enabled: false, suggestions: [] };
    const now = clock();
    const suggestions = [];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate.key !== "string") continue;
      const evidence = Number(candidate.evidence_count);
      const confidence = Number(candidate.confidence);
      if (!Number.isFinite(evidence) || evidence < boundedEvidence) continue;
      if (!Number.isFinite(confidence) || confidence < 0.5) continue;
      const last = lastShown.get(candidate.key);
      if (last !== undefined && now - last < cooldownMs) continue;
      const app = sanitizeObservedText(candidate.app ?? "", 120);
      const window = sanitizeObservedText(candidate.window ?? "", 160);
      suggestions.push({
        key: candidate.key.slice(0, 300),
        app,
        window,
        evidenceCount: evidence,
        confidence: Math.min(1, Math.max(0, confidence)),
        lastSeenMs: Number.isFinite(Number(candidate.last_seen_ms))
          ? Number(candidate.last_seen_ms)
          : null,
        text: `Repeated pattern: app ${JSON.stringify(app)} / window ${JSON.stringify(window)} observed ${evidence} times (confidence ${confidence.toFixed(2)}). Candidate only; no action was taken.`,
      });
      if (suggestions.length >= boundedMax) break;
    }
    for (const suggestion of suggestions) lastShown.set(suggestion.key, now);
    if (lastShown.size > 256) {
      const oldest = lastShown.keys().next().value;
      if (oldest !== undefined) lastShown.delete(oldest);
    }
    return { enabled: true, suggestions };
  };

  const reset = () => lastShown.clear();

  return {
    enabled,
    select,
    reset,
    limits: { minEvidence: boundedEvidence, cooldownMs, maxSuggestions: boundedMax },
  };
}
