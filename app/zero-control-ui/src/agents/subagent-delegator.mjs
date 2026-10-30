/**
 * Semantic Role Alias Sub-Agent Delegator & Background Team Dispatcher for Project Zero
 * Zero is the sole Commander in /chat/zero, directing his specialized background team:
 * 1. team.researcher (Deep Web Research, Sources & Synthesis — @reasoning / @fast)
 * 2. team.coder (Codebase Architecture, Refactoring, CLI Execution — @coder)
 * 3. team.media_browser (YouTube, Browser DOM/UIA Fast Control, Audio/Video Watcher — @fast / @vision)
 * 4. team.operator (Windows OS Background Shell, Files, Apps & High-Speed Mouse/Keyboard — @fast)
 * 5. team.vision_memory (5-Min RAM Ring Buffer, Point-at-Cursor & Workflow Learner — @vision)
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

export const TEAM_MEMBERS = Object.freeze({
  RESEARCHER: "team.researcher",
  CODER: "team.coder",
  MEDIA_BROWSER: "team.media_browser",
  OPERATOR: "team.operator",
  VISION_MEMORY: "team.vision_memory",
});

export const TEAM_ROSTER = Object.freeze({
  [TEAM_MEMBERS.RESEARCHER]: {
    id: "team.researcher",
    name: "Zero Researcher",
    role: "Deep Web Research, Sources & Synthesis",
    defaultAlias: ROLE_ALIASES.REASONING,
    tools: ["web_search", "web_extract", "zero_screen_context"],
  },
  [TEAM_MEMBERS.CODER]: {
    id: "team.coder",
    name: "Zero Coder",
    role: "Codebase Architecture, Refactoring, CLI Execution",
    defaultAlias: ROLE_ALIASES.CODER,
    tools: ["zero_computer_action", "terminal", "read_file", "write_file", "patch"],
  },
  [TEAM_MEMBERS.MEDIA_BROWSER]: {
    id: "team.media_browser",
    name: "Zero Media & Browser",
    role: "YouTube, Browser DOM/UIA Fast Control, Audio/Video Watcher",
    defaultAlias: ROLE_ALIASES.FAST,
    tools: ["zero_computer_action", "zero_screen_context", "video_analyze"],
  },
  [TEAM_MEMBERS.OPERATOR]: {
    id: "team.operator",
    name: "Zero Operator",
    role: "Windows OS Background Shell, Files, Apps & High-Speed Mouse/Keyboard",
    defaultAlias: ROLE_ALIASES.FAST,
    tools: ["zero_computer_action", "zero_screen_context", "system_info"],
  },
  [TEAM_MEMBERS.VISION_MEMORY]: {
    id: "team.vision_memory",
    name: "Zero Vision & Memory",
    role: "5-Min RAM Ring Buffer, Point-at-Cursor & Workflow Learner",
    defaultAlias: ROLE_ALIASES.VISION,
    tools: ["zero_screen_context", "zero_watch_workflow", "zero_skill_learn"],
  },
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
 * Detects team member from task prompt intent if no explicit alias or role
 */
export function detectTeamMember(prompt = "") {
  const text = String(prompt).toLowerCase();
  if (text.includes("youtube") || text.includes("video") || text.includes("browser") || text.includes("play")) {
    return TEAM_MEMBERS.MEDIA_BROWSER;
  }
  if (text.includes("code") || text.includes("refactor") || text.includes("git") || text.includes("bug") || text.includes("test")) {
    return TEAM_MEMBERS.CODER;
  }
  if (text.includes("research") || text.includes("search") || text.includes("find info") || text.includes("who is") || text.includes("documentation")) {
    return TEAM_MEMBERS.RESEARCHER;
  }
  if (text.includes("cursor") || text.includes("what is this") || text.includes("watch me") || text.includes("learn skill") || text.includes("remember")) {
    return TEAM_MEMBERS.VISION_MEMORY;
  }
  if (text.includes("click") || text.includes("mouse") || text.includes("open app") || text.includes("window") || text.includes("type")) {
    return TEAM_MEMBERS.OPERATOR;
  }
  return TEAM_MEMBERS.OPERATOR;
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
 * Subagent Delegator for dispatching work to background team members
 */
export class SubagentDelegator {
  constructor({ gatewayUrl = "http://127.0.0.1:18790", preferences = {} } = {}) {
    this.gatewayUrl = gatewayUrl;
    this.preferences = preferences;
  }

  async delegate({ prompt, role = null, messages = [], signal = null }) {
    const { alias, cleanPrompt } = extractRoleAlias(prompt);
    const assignedMemberId = role || (alias ? null : detectTeamMember(cleanPrompt || prompt));
    const member = assignedMemberId ? TEAM_ROSTER[assignedMemberId] : null;

    const targetAlias = alias || member?.defaultAlias || ROLE_ALIASES.FAST;
    const model = resolveModelForAlias(targetAlias, this.preferences);

    const effectiveMessages = messages.length > 0
      ? messages
      : [{ role: "user", content: cleanPrompt || prompt }];

    const payload = {
      model,
      messages: effectiveMessages,
      temperature: targetAlias === ROLE_ALIASES.CODER ? 0.2 : 0.7,
      teamMember: member ? member.id : null,
      teamRole: member ? member.role : null,
    };

    return {
      delegated: true,
      alias: targetAlias,
      teamMember: member ? member.id : null,
      teamName: member ? member.name : "Zero Assistant",
      model,
      payload,
    };
  }
}

export const subagentDelegator = new SubagentDelegator();
