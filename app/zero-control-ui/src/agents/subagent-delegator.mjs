/**
 * Semantic Role Alias Sub-Agent Delegator for Project Zero
 * Routes tasks to specialized models/subagents based on semantic aliases:
 * - @fast: Ultra-fast lightweight execution
 * - @coder: Deep code synthesis & refactoring
 * - @reasoning: Complex multi-step reasoning & architecture
 * - @vision: Multimodal image & screen perception
 * - @offline: 100% air-gapped local GGUF models
 */

export const ROLE_ALIASES = Object.freeze({
  FAST: "@fast",
  CODER: "@coder",
  REASONING: "@reasoning",
  VISION: "@vision",
  OFFLINE: "@offline",
});

export const DEFAULT_ROLE_MODELS = Object.freeze({
  [ROLE_ALIASES.FAST]: "fast-mode-default",
  [ROLE_ALIASES.CODER]: "qwen2.5-coder-7b",
  [ROLE_ALIASES.REASONING]: "thinking-default",
  [ROLE_ALIASES.VISION]: "moondream2",
  [ROLE_ALIASES.OFFLINE]: "local-gguf-default",
});

/**
 * Extracts role alias from a prompt if present
 */
export function extractRoleAlias(prompt) {
  if (!prompt || typeof prompt !== "string") {
    return { alias: null, cleanPrompt: "" };
  }

  const match = prompt.match(/(?:^|\s)(@(fast|coder|reasoning|vision|offline))\b/i);
  if (!match) {
    return { alias: null, cleanPrompt: prompt };
  }

  const alias = match[1].toLowerCase();
  const cleanPrompt = prompt.replace(match[0], " ").replace(/\s+/g, " ").trim();
  return { alias, cleanPrompt };
}

/**
 * Resolves the target model ID for a given alias based on preferences
 */
export function resolveModelForAlias(alias, preferences = {}) {
  if (!alias) return preferences.primary || "auto";

  switch (alias.toLowerCase()) {
    case ROLE_ALIASES.FAST:
      return preferences.fastMode || DEFAULT_ROLE_MODELS[ROLE_ALIASES.FAST];
    case ROLE_ALIASES.REASONING:
      return preferences.thinkingDefault || DEFAULT_ROLE_MODELS[ROLE_ALIASES.REASONING];
    case ROLE_ALIASES.CODER:
      return preferences.coderModel || DEFAULT_ROLE_MODELS[ROLE_ALIASES.CODER];
    case ROLE_ALIASES.VISION:
      return preferences.visionModel || DEFAULT_ROLE_MODELS[ROLE_ALIASES.VISION];
    case ROLE_ALIASES.OFFLINE:
      return preferences.offlineModel || DEFAULT_ROLE_MODELS[ROLE_ALIASES.OFFLINE];
    default:
      return preferences.primary || "auto";
  }
}

/**
 * Delegator class for sub-agent dispatches
 */
export class SubagentDelegator {
  constructor({ gatewayUrl = "http://127.0.0.1:18790", preferences = {} } = {}) {
    this.gatewayUrl = gatewayUrl;
    this.preferences = preferences;
  }

  async delegate({ prompt, role = null, messages = [], signal = null }) {
    const { alias, cleanPrompt } = extractRoleAlias(prompt);
    const targetAlias = role || alias;
    const model = resolveModelForAlias(targetAlias, this.preferences);

    const effectiveMessages = messages.length > 0
      ? messages
      : [{ role: "user", content: cleanPrompt || prompt }];

    const payload = {
      model,
      messages: effectiveMessages,
      temperature: targetAlias === ROLE_ALIASES.CODER ? 0.2 : 0.7,
    };

    return {
      delegated: true,
      alias: targetAlias,
      model,
      payload,
    };
  }
}
