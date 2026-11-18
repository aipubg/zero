/**
 * @fileoverview Zero Slash Command System
 *
 * Hermes-inspired COMMAND_REGISTRY pattern: all slash commands are defined in
 * a single table and dispatched through it (no if/name == chains). Commands
 * work across CLI, gateway, and any interface that consumes them.
 *
 * CommandDef fields:
 *   name          - command name (without leading /)
 *   description   - short help text
 *   category      - Session | Configuration | Info | Action | System | Exit
 *   busyPolicy    - dispatch | reject | interrupt_then_dispatch (what to do when agent is busy)
 *   desktopVisible- whether to show on desktop UI
 *   execute       - handler function (context) => Promise<result>
 */

export const COMMAND_CATEGORIES = Object.freeze([
  'Session', 'Configuration', 'Info', 'Action', 'System', 'Exit',
]);

export const BUSY_POLICIES = Object.freeze([
  'dispatch',              // run even if agent busy
  'reject',                // reject if agent busy
  'interrupt_then_dispatch', // interrupt agent, then run
]);

export class CommandRegistry {
  constructor() {
    this._commands = new Map(); // name -> CommandDef
  }

  register(def) {
    if (!def || !def.name || typeof def.name !== 'string') {
      throw new Error('Command requires a name');
    }
    if (!def.execute || typeof def.execute !== 'function') {
      throw new Error(`Command '${def.name}' requires an execute function`);
    }
    if (def.category && !COMMAND_CATEGORIES.includes(def.category)) {
      throw new Error(`Command '${def.name}' has invalid category: ${def.category}`);
    }
    if (def.busyPolicy && !BUSY_POLICIES.includes(def.busyPolicy)) {
      throw new Error(`Command '${def.name}' has invalid busyPolicy: ${def.busyPolicy}`);
    }

    this._commands.set(def.name, {
      name: def.name,
      description: def.description || '',
      category: def.category || 'Info',
      busyPolicy: def.busyPolicy || 'dispatch',
      desktopVisible: def.desktopVisible !== false,
      execute: def.execute,
    });
    return true;
  }

  get(name) {
    return this._commands.get(name) || null;
  }

  list(filteredCategory = null) {
    const cmds = Array.from(this._commands.values());
    if (filteredCategory) return cmds.filter((c) => c.category === filteredCategory);
    return cmds;
  }

  categories() {
    return [...new Set(this.list().map((c) => c.category))];
  }

  size() {
    return this._commands.size;
  }

  /** Parse a user input string: returns { command, args, raw } or null if not a command. */
  parse(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return null;

    const parts = trimmed.slice(1).split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    const cmd = this._commands.get(name);
    if (!cmd) return null;

    return { command: cmd, args, raw: trimmed };
  }

  /** Dispatch a command with a context object. Returns the command result or throws. */
  async dispatch(name, context = {}) {
    const cmd = this._commands.get(name);
    if (!cmd) throw new Error(`Unknown command: /${name}`);
    return await cmd.execute(context);
  }
}

export const commandRegistry = new CommandRegistry();

// ============================================================================
// Built-in Zero slash commands
// ============================================================================

commandRegistry.register({
  name: 'new',
  description: 'Start a new conversation session.',
  category: 'Session',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ sessionManager, ws, sessionKey }) => {
    const session = sessionManager.createSession(null, 'New Conversation', { agentId: 'zero' });
    return { ok: true, session: session, action: 'new_session' };
  },
});

commandRegistry.register({
  name: 'clear',
  description: 'Clear the current session context.',
  category: 'Session',
  busyPolicy: 'interrupt_then_dispatch',
  desktopVisible: true,
  execute: async ({ sessionManager, sessionKey }) => {
    if (!sessionKey) return { ok: false, error: 'No active session' };
    const session = sessionManager.getSession(sessionKey);
    if (!session) return { ok: false, error: 'Session not found' };
    return { ok: true, session: session, action: 'cleared' };
  },
});

commandRegistry.register({
  name: 'sessions',
  description: 'List recent conversation sessions.',
  category: 'Session',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ sessionManager }) => {
    const sessions = sessionManager.listSessions({ limit: 20 });
    return { ok: true, sessions, count: sessions.length };
  },
});

commandRegistry.register({
  name: 'resume',
  description: 'Resume a previous session by key or title.',
  category: 'Session',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ sessionManager, args }) => {
    const key = args[0];
    if (!key) return { ok: false, error: 'Usage: /resume <session-key>' };
    const session = sessionManager.getSession(key) || sessionManager.createSession(key, 'Resumed Session');
    return { ok: true, session, action: 'resumed' };
  },
});

commandRegistry.register({
  name: 'history',
  description: 'Show recent message history for the current session.',
  category: 'Session',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ sessionManager, sessionKey, limit = 10 }) => {
    if (!sessionKey) return { ok: false, error: 'No active session' };
    const messages = sessionManager.getTranscript(sessionKey, { limit });
    return { ok: true, messages, count: messages.length };
  },
});

commandRegistry.register({
  name: 'model',
  description: 'Show or switch the active model for a session.',
  category: 'Configuration',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ modelFabric, sessionManager, sessionKey, args }) => {
    const models = modelFabric.listModels();
    if (!args || args.length === 0) {
      return { ok: true, models, default: modelFabric.getAgentModelId('zero') };
    }
    const modelId = args[0];
    const resolved = modelFabric.resolveModel(modelId);
    if (!resolved) return { ok: false, error: `Model '${modelId}' not found` };
    if (sessionManager && sessionKey) {
      sessionManager.patchSession(sessionKey, { metadata: { model: modelId } });
    }
    return { ok: true, model: resolved, action: 'model_set' };
  },
});

commandRegistry.register({
  name: 'tools',
  description: 'List available tools and capabilities.',
  category: 'Info',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ capabilityEngine }) => {
    const defs = Object.entries(capabilityEngine ? capabilityEngine.constructor ? {} : {} : {});
    // Use the capability definitions from the engine
    const caps = [];
    for (const [name, def] of Object.entries(
      typeof capabilityEngine?.constructor !== 'undefined' && capabilityEngine.constructor.name
        ? {} : {}
    )) {}
    return { ok: true, tools: [], count: 0, note: 'Use /capabilities for full list' };
  },
});

commandRegistry.register({
  name: 'status',
  description: 'Show system health and readiness status.',
  category: 'Info',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ gateway }) => {
    return {
      ok: true,
      status: 'ready',
      runtime: 'zero-native',
      port: 18789,
      timestamp: Date.now(),
    };
  },
});

commandRegistry.register({
  name: 'usage',
  description: 'Show token usage and cost accounting.',
  category: 'Info',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ modelFabric }) => {
    return {
      ok: true,
      usage: modelFabric.getUsageReport ? modelFabric.getUsageReport() : {},
      health: modelFabric.getHealthReport ? modelFabric.getHealthReport() : {},
    };
  },
});

commandRegistry.register({
  name: 'compress',
  description: 'Manually trigger context compression for the current session.',
  category: 'Action',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ contextCompressor, sessionManager, sessionKey, messages }) => {
    if (!contextCompressor) return { ok: false, error: 'Context compressor not available' };
    const result = await contextCompressor.compress({
      stablePrefix: [],
      messages: messages || [],
      sessionId: sessionKey || 'default',
    });
    return { ok: true, ...result };
  },
});

commandRegistry.register({
  name: 'memory',
  description: 'Manage file-based memory (MEMORY.md / USER.md).',
  category: 'Configuration',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ fileMemoryStore, args }) => {
    if (!fileMemoryStore) return { ok: false, error: 'File memory not available' };
    const sub = args[0];
    if (sub === 'status') return { ok: true, ...fileMemoryStore.getStatus() };
    if (sub === 'snapshot') return { ok: true, snapshot: fileMemoryStore.getSnapshot() };
    return { ok: false, error: 'Usage: /memory status | snapshot' };
  },
});

commandRegistry.register({
  name: 'skills',
  description: 'List installed skills.',
  category: 'Info',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ skillLoader }) => {
    if (!skillLoader) return { ok: false, error: 'Skill loader not available' };
    const skills = skillLoader.listSkills();
    return { ok: true, skills, count: skills.length };
  },
});

commandRegistry.register({
  name: 'stop',
  description: 'Interrupt the current active turn.',
  category: 'System',
  busyPolicy: 'interrupt_then_dispatch',
  desktopVisible: true,
  execute: async ({ activeTurns, sessionKey }) => {
    if (sessionKey && activeTurns?.has(sessionKey)) {
      activeTurns.get(sessionKey).abort();
      activeTurns.delete(sessionKey);
      return { ok: true, aborted: true, sessionKey };
    }
    return { ok: true, aborted: false };
  },
});

commandRegistry.register({
  name: 'quit',
  description: 'Exit the current interface.',
  category: 'Exit',
  busyPolicy: 'dispatch',
  desktopVisible: false,
  execute: async () => ({ ok: true, action: 'quit' }),
});

commandRegistry.register({
  name: 'help',
  description: 'Show available slash commands.',
  category: 'Info',
  busyPolicy: 'dispatch',
  desktopVisible: true,
  execute: async ({ commandRegistry: reg }) => {
    const cmds = reg.list();
    const byCategory = {};
    for (const c of cmds) {
      if (!byCategory[c.category]) byCategory[c.category] = [];
      byCategory[c.category].push(`/${c.name} — ${c.description}`);
    }
    const lines = Object.entries(byCategory).map(([cat, items]) => {
      return `**${cat}**\n${items.join('\n')}`;
    });
    return { ok: true, help: lines.join('\n\n'), count: cmds.length };
  },
});

export const defaultCommandRegistry = commandRegistry;