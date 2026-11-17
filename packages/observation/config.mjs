/**
 * Zero observation plugin config schema (shared by the runtime entry and tests).
 * The suggestion policy is disabled unless the owner explicitly writes config.
 */
export const OBSERVATION_CONFIG_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: {
    observationSuggestions: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean", default: false },
        minEvidence: { type: "integer", minimum: 2, maximum: 50, default: 3 },
        cooldownSeconds: { type: "integer", minimum: 60, maximum: 86_400, default: 600 },
        maxSuggestions: { type: "integer", minimum: 1, maximum: 3, default: 3 },
      },
    },
  },
});

export const DEFAULT_SUGGESTION_CONFIG = Object.freeze({
  enabled: false,
  minEvidence: 3,
  cooldownSeconds: 600,
  maxSuggestions: 3,
});

export function normalizeSuggestionConfig(value) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const enabled = raw.enabled === true;
  const integer = (candidate, fallback, min, max) =>
    Number.isInteger(candidate) && candidate >= min && candidate <= max ? candidate : fallback;
  return {
    enabled,
    minEvidence: integer(raw.minEvidence, DEFAULT_SUGGESTION_CONFIG.minEvidence, 2, 50),
    cooldownSeconds: integer(
      raw.cooldownSeconds,
      DEFAULT_SUGGESTION_CONFIG.cooldownSeconds,
      60,
      86_400,
    ),
    maxSuggestions: integer(raw.maxSuggestions, DEFAULT_SUGGESTION_CONFIG.maxSuggestions, 1, 3),
  };
}
