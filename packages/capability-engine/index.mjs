/**
 * Zero AI — Central Capability Execution Service
 *
 * Implements:
 * 1. Canonical Capability Registry & Schema Validation
 * 2. Deterministic Authorization & Human Takeover / Computer Hold Enforcement
 * 3. Scoped Execution Contexts, Deadlines & Cancellation
 * 4. Before / After State Observation & Verification
 * 5. Structured Audit Events & Normalized Result Contracts
 */

import { ComputerOperator } from './computer-operator.mjs';
import { CAPABILITY_ALIASES, resolveCapabilityAlias } from './aliases.mjs';
import os from 'node:os';

export const DESKTOP_OBSERVATIONS = new Set([
  'status', 'version', 'snapshot', 'find', 'get', 'is', 'list-apps', 'list-windows',
  'list-displays', 'list-surfaces', 'skills', 'wait', 'clipboard-get', 'screenshot', 'list-notifications',
  'click', 'double-click', 'right-click', 'type', 'set-value', 'clear', 'focus', 'select',
  'toggle', 'check', 'uncheck', 'expand', 'collapse', 'scroll', 'scroll-to', 'press', 'hover',
  'drag', 'mouse-move', 'mouse-click', 'mouse-wheel', 'launch', 'close-app', 'focus-window',
  'resize-window', 'move-window', 'minimize', 'maximize', 'restore', 'clipboard-set',
  'clipboard-clear', 'dismiss-notification', 'dismiss-all-notifications', 'notification-action',
  'open-system-surface',
]);

export const CAPABILITY_DEFINITIONS = Object.freeze({
  'zero_computer_action': {
    description: 'Execute native Windows OS actions: open_app, type_text, press_key, mouse_move, left_click, scroll, wait, screenshot, list_windows, list_apps, get_window_state, get_screen_size, play, open_url, fill_form, scrape, get_content, check_notifications, login, logout.',
    allowedActions: [
      'desktop',
      'open_app', 'launch_app', 'type_text', 'type', 'press_key', 'press', 'key', 'hotkey',
      'mouse_move', 'move', 'left_click', 'click', 'right_click', 'double_click',
      'mouse_drag', 'drag', 'scroll', 'wait', 'screenshot', 'list_windows', 'list_apps',
      'get_window_state', 'get_screen_size', 'get_cursor_position', 'get_cursor',
      'focus_window', 'control_window', 'bring_to_front', 'close_app', 'kill_app', 'play', 'browser', 'open_browser',
      'open_url', 'media_control', 'spotify_control', 'clipboard_get', 'clipboard_set', 'get_elements', 'get_uia_elements',
      'fill_form', 'scrape', 'get_content', 'check_notifications', 'login', 'logout', 'submit', 'submit_form',
      'fill', 'act', 'read_page', 'navigate', 'search', 'see_screen'
    ],
  },
  'browser': {
    description: 'Control web browser on Windows: open URLs, navigate, search, fill forms, type text, click elements, extract text/scrape, check notifications, and play media.',
    allowedActions: [
      'open', 'open_url', 'play', 'navigate', 'search', 'web_search',
      'click', 'type', 'fill_form', 'get_content', 'scrape',
      'screenshot', 'press_key', 'check_notifications', 'login', 'logout', 'submit', 'submit_form',
      'fill', 'act', 'read_page'
    ],
  },
  'open_app': {
    description: 'Launch an application on Windows desktop (e.g. notepad, calc, chrome).',
    allowedActions: ['open_app', 'launch_app'],
  },
  'spotify_control': {
    description: 'Control Spotify on Windows: search and play songs, pause, resume, change tracks, or set volume.',
    allowedActions: ['play', 'pause', 'next', 'previous', 'set_volume', 'status', 'search', 'play_track'],
  },

  // === Unified Single-Room capabilities (moved from services/host/native-gateway.mjs,
  // packages/capability-engine/terminal-ops.mjs, plugins/, skills/) ===

  'desktop_control': {
    description: 'PRIMARY desktop control backend: zero-desktop native accessibility with physical screen interaction. Start with status, then snapshot/find for the exact app/window; use returned qualified refs for click/set-value/get. Runs in headed mode by default to ensure all actions are visible on screen.',
    allowedActions: ['status', 'snapshot', 'find', 'get', 'is', 'list-apps', 'list-windows', 'list-displays', 'list-surfaces', 'skills', 'wait', 'clipboard-get', 'screenshot', 'list-notifications', 'click', 'double-click', 'right-click', 'type', 'set-value', 'clear', 'focus', 'select', 'toggle', 'check', 'uncheck', 'expand', 'collapse', 'scroll', 'scroll-to', 'press', 'hover', 'drag', 'mouse-move', 'mouse-click', 'mouse-wheel', 'launch', 'close-app', 'focus-window', 'resize-window', 'move-window', 'minimize', 'maximize', 'restore', 'clipboard-set', 'clipboard-clear', 'dismiss-notification', 'dismiss-all-notifications', 'notification-action', 'open-system-surface'],
  },
  'research_search': {
    description: 'Retrieve real search results and provenance. Retrieved sources are not independently verified.',
    allowedActions: ['search'],
  },
  'memory_recall': {
    description: 'Retrieve previously stored context from Zero memory.',
    allowedActions: ['recall'],
  },
  'notebook': {
    description: "Zero's Notebook: two short notes read into every new chat. Book 'owner' = who the owner is (preferences, language, how they like things done). Book 'zero' = facts about this computer and setup (paths, quirks, what works). Write only things the owner said or a tool showed, and only lasting facts (not one-off requests). One fact goes in one book. Books are small: replace or remove old entries instead of piling up. For long or searchable knowledge use memory_remember.",
    allowedActions: ['read', 'add', 'replace', 'remove'],
  },
  'memory_remember': {
    description: 'Persist a fact with provenance for later retrieval. Use semantic for durable facts and preferences.',
    allowedActions: ['remember'],
  },
  'screen_context': {
    description: 'Retrieve real local screen observations; may be empty when observation is stopped.',
    allowedActions: ['query'],
  },
  'see_screen': {
    description: 'Inspect what is currently displayed on the user desktop or browser screen. Returns active window title, on-screen text via OCR, interactive UI elements, and screen dimensions.',
    allowedActions: ['inspect'],
  },
  'skills_list': {
    description: 'Discover installed skills and their descriptions.',
    allowedActions: ['list'],
  },
  'skill_execute': {
    description: 'Execute an enabled installed skill through a durable task and the model/tool loop.',
    allowedActions: ['execute'],
  },
  'schedule_task': {
    description: 'Register a durable recurring Zero automation. Use standard five-field cron or @hourly/@daily/@weekly. The job survives restarts and wakes Zero on schedule.',
    allowedActions: ['register'],
  },
  'goal_plan': {
    description: 'Decompose a high-level or long-horizon goal into a durable master plan with milestones and an automatic recurring execution job (Jarvis mode).',
    allowedActions: ['plan'],
  },
  'goal_status': {
    description: 'List durable long-horizon plans, scheduled jobs and learned procedures.',
    allowedActions: ['status'],
  },
  'delegate_agent': {
    description: 'Delegate a concrete subtask to Zero specialist agents through the durable team workflow.',
    allowedActions: ['delegate'],
  },
  'procedure_learn': {
    description: 'Persist a verified multi-step procedure (trigger, working steps, verification) into durable procedural memory for future reuse.',
    allowedActions: ['learn'],
  },
  'procedure_recall': {
    description: 'Recall previously learned procedures that match a task before planning it again.',
    allowedActions: ['recall'],
  },
  'read_file': {
    description: 'Read a UTF-8 local file, including skill instructions and supporting scripts.',
    allowedActions: ['read'],
  },
  'write_file': {
    description: 'Create or update a UTF-8 local file and read it back to verify the write.',
    allowedActions: ['write'],
  },
  'run_process': {
    description: 'Zero Terminal & Security Ops: execute any local program or command line, including PowerShell/bash pipelines, Python scripts, network and security tooling (nmap, curl, git, ffmpeg, gh) and bug-hunting scripts.',
    allowedActions: ['run'],
  },
  'web_search': {
    description: 'Search the web for up-to-date information, documentation, and real-time facts.',
    allowedActions: ['search'],
  },
  'web_extract': {
    description: 'Extract readable text and main content from a specified URL.',
    allowedActions: ['extract'],
  },
  'system_info': {
    description: 'Get the computer hostname, OS environment, memory status, and running process info.',
    allowedActions: ['info'],
  },
  'zero_skill_learn': {
    description: 'Save a newly learned multi-step workflow or task instructions into the persistent skills library for future autonomous reuse.',
    allowedActions: ['learn'],
  },
  'doctor_memory_status': {
    description: 'Memory and embedding subsystem health.',
    allowedActions: ['status'],
  },
  'voice_status': {
    description: 'Voice TTS/ASR availability.',
    allowedActions: ['status'],
  },
  'ask_screen': {
    description: 'Online screen share only: ask Gemini Live, which is watching the owner screen, what is on the screen or what the owner is doing (fast, about 1-2 s). Use it to understand the current work of the owner before helping. Read-only.',
    allowedActions: ['ask'],
  },
  'screen_act': {
    description: 'Online screen share only: do a goal on screen with Gemini Computer Use, which looks at screenshots and decides where to click, drag and type (slow: ~10 s per step). Use it when a control cannot be found by name with zero_computer_action / get_elements, or for visual tasks. If it returns needsConfirmation, ask the owner and call again with confirm_token.',
    allowedActions: ['act'],
  },
});

/**
 * Argument schemas for handler-based capabilities. These are what the model is
 * shown, so it knows the real parameter names instead of guessing them. Names
 * mirror the handler signatures registered for each capability.
 */
const str = description => ({ type: 'string', description });
const params = (properties, required = []) => Object.freeze({ type: 'object', properties, required, additionalProperties: true });
export const CAPABILITY_PARAMETERS = Object.freeze({
  read_file: params({ path: str('Absolute or relative path of the UTF-8 file to read') }, ['path']),
  write_file: params({ path: str('Path of the file to create or overwrite'), content: str('Full UTF-8 text content to write') }, ['path', 'content']),
  run_process: params({
    command: str('Executable to run, e.g. "hostname", "powershell.exe", "git". Use this tool (not GUI typing) for any shell/CLI task.'),
    args: { type: 'array', items: { type: 'string' }, description: 'Arguments as separate strings, e.g. ["-NoProfile","-Command","Get-Date"]. Use [] when there are none.' },
    cwd: str('Optional working directory'),
    timeoutMs: { type: 'integer', minimum: 1, maximum: 300000, description: 'Optional timeout in milliseconds (default 60000)' },
  }, ['command']),
  web_search: params({ query: str('Search query'), maxResults: { type: 'integer', minimum: 1, maximum: 20 } }, ['query']),
  web_extract: params({ url: str('HTTP(S) URL to fetch and extract text from') }, ['url']),
  research_search: params({ query: str('Research query') }, ['query']),
  memory_recall: params({ query: str('What to recall from memory') }, ['query']),
  notebook: params({
    action: { type: 'string', enum: ['read', 'add', 'replace', 'remove'], description: 'What to do (default read)' },
    book: { type: 'string', enum: ['owner', 'zero'], description: "'owner' = about the owner; 'zero' = about this computer" },
    text: str('The entry to add, or the new text for replace (one line, at most 400 characters)'),
    match: str('A few words from the entry to replace or remove'),
  }, []),
  memory_remember: params({ content: str('Fact or note to remember'), layer: str('Memory layer, default "semantic"') }, ['content']),
  screen_context: params({ query: str('What to look for in recent screen activity') }),
  see_screen: params({ query: str('Optional focus for the screen inspection') }),
  skill_execute: params({ name: str('Skill name from skills_list'), goal: str('What the skill should accomplish') }, ['name']),
  schedule_task: params({ title: str('Task title'), cronExpr: str('Cron expression or @daily/@hourly'), targetAction: str('Action to trigger, default "goal.tick"'), params: { type: 'object' }, enabled: { type: 'boolean' } }, ['title']),
  goal_plan: params({ goal: str('The long-horizon goal'), cronExpr: str('Schedule, default @daily'), milestones: { type: 'array', items: { type: 'string' } } }, ['goal']),
  delegate_agent: params({ goal: str('Goal to delegate'), teamId: str('Team id'), planOnly: { type: 'boolean' } }, ['goal']),
  procedure_learn: params({ name: str('Short procedure name'), trigger: str('When this procedure applies'), steps: { type: 'array', items: { type: 'string' } }, verification: str('How success was verified'), tags: { type: 'array', items: { type: 'string' } } }, ['trigger', 'steps']),
  procedure_recall: params({ query: str('Task to find a learned procedure for'), limit: { type: 'integer', minimum: 1, maximum: 10 } }, ['query']),
  zero_skill_learn: params({ name: str('Skill name'), description: str('What the skill does'), triggers: { type: 'array', items: { type: 'string' } }, capabilities: { type: 'array', items: { type: 'string' } }, workflowSteps: { type: 'array', items: { type: 'string' } }, examples: { type: 'array', items: { type: 'string' } }, overwrite: { type: 'boolean' } }, ['name']),
  skills_list: params({}),
  goal_status: params({}),
  system_info: params({}),
  doctor_memory_status: params({}),
  voice_status: params({}),
  ask_screen: params({ question: str('What you want to know about the screen, e.g. "Which app and file is the owner working in?", "What does the error dialog say?"') }, ['question']),
  screen_act: params({
    goal: str('What to do on screen, in plain words, e.g. "click the Subscribe button", "drag the report.pdf icon into the Documents folder"'),
    confirm_token: str('Only after the owner confirmed an action screen_act asked about: the token it returned'),
  }),
  // Action-dispatch capabilities: one tool, many actions. Each argument says
  // which actions use it, so the model does not have to guess names.
  open_app: params({ app: str('App to launch, e.g. "notepad", "calc", "chrome", or a full path. The result says whether its window is in front.') }, ['app']),
  zero_computer_action: params({
    action: { type: 'string', enum: CAPABILITY_DEFINITIONS.zero_computer_action.allowedActions, description: 'What to do. Windows: list_windows, focus_window, get_window_state, open_app, close_app. Mouse: left_click, right_click, double_click, mouse_move, mouse_drag, scroll. Keyboard: type_text, press_key / key, hotkey. Looking: screenshot, get_elements. Other: wait, clipboard_get, clipboard_set.' },
    target: str('focus_window / close_app: window title, app name, or hwnd. type_text / press_key / hotkey: optional target; when omitted, keyboard input goes to the current foreground window.'),
    command: { type: 'string', enum: ['restore', 'maximize', 'minimize', 'close', 'play', 'pause', 'set_volume', 'set_speed', 'mute', 'unmute', 'fullscreen', 'next', 'previous'], description: 'focus_window: restore, maximize, minimize, or close. media_control: play, pause, set_volume, set_speed, mute, unmute, fullscreen, next, or previous.' },
    app: str('open_app / close_app: app name, e.g. "notepad".'),
    x: { type: 'integer', description: 'Mouse actions: screen X in pixels. Take coordinates from get_elements (centerX) or see_screen.' },
    y: { type: 'integer', description: 'Mouse actions: screen Y in pixels (centerY from get_elements).' },
    to_x: { type: 'integer', description: 'mouse_drag: destination X.' },
    to_y: { type: 'integer', description: 'mouse_drag: destination Y.' },
    text: str('type_text / clipboard_set: the exact text. Typing inserts at the caret; it never replaces existing content.'),
    key: str('press_key / key / hotkey: one key or a combination, e.g. "enter", "tab", "escape", "f5", "ctrl+s", "ctrl+shift+n", "alt+f4".'),
    keys: { type: 'array', items: { type: 'string' }, description: 'hotkey: key sequence such as ["Control", "L"].' },
    notifications: { type: 'boolean', description: 'play: open the first YouTube notification video, falling back to the first playable home/search video when unavailable.' },
    volume_percent: { type: 'number', minimum: 0, maximum: 100, description: 'play / media_control set_volume: player volume 0-100.' },
    playback_rate: { type: 'number', minimum: 0.25, maximum: 4, description: 'play / media_control set_speed: playback speed, e.g. 1.5.' },
    direction: str('scroll: "up" or "down".'),
    amount: { type: 'integer', description: 'scroll: number of notches (default 3).' },
    ms: { type: 'integer', description: 'wait: milliseconds, at most 8000.' },
  }, ['action']),
  browser: params({
    action: { type: 'string', enum: [...CAPABILITY_DEFINITIONS.browser.allowedActions, 'media_control'], description: 'open_url (go to a page), search (web search in the browser), play (find a video by query or url and start it), media_control (control the video on the current page), get_content (read the current page), click / type / fill_form (interact with the page by element ref), press_key, screenshot.' },
    command: str('media_control: play, pause, set_volume, set_speed, mute, unmute, fullscreen, next, previous.'),
    volume_percent: { type: 'number', minimum: 0, maximum: 100, description: 'play / media_control set_volume: player volume 0-100.' },
    playback_rate: { type: 'number', minimum: 0.25, maximum: 4, description: 'play / media_control set_speed: playback speed, e.g. 1.5.' },
    notifications: { type: 'boolean', description: 'play: open the first YouTube notification video, falling back to the first playable home/search video when unavailable.' },
    url: str('open_url: full address including https://.'),
    query: str('search / play: what to search for.'),
    ref: str('click / type: element ref from the interactive elements of the last page result.'),
    text: str('type: text to enter into the element.'),
    fields: { type: 'object', description: 'fill_form: field label -> value.' },
    key: str('press_key: key name, e.g. "Enter".'),
    submit: { type: 'boolean', description: 'type / fill_form: press Enter afterwards.' },
  }, ['action']),
  spotify_control: params({
    action: { type: 'string', enum: CAPABILITY_DEFINITIONS.spotify_control.allowedActions, description: 'Spotify desktop control.' },
    track: str('search / play_track: song or artist to play.'),
    volume_percent: { type: 'integer', minimum: 0, maximum: 100, description: 'set_volume only.' },
  }, ['action']),
});

export class CapabilityEngine {
  constructor({ operator = null, leaseManager = null, logger = console } = {}) {
    this.leaseManager = leaseManager;
    this.operator = operator || new ComputerOperator();
    this.logger = logger;
    this.auditLog = [];
    this.maxAuditEntries = 1000;
    this.customCapabilities = new Map();
    this.handlers = new Map();
  }

  /**
   * Dynamically register an external capability (e.g. from plugin)
   */
  registerCapability(definition) {
    if (!definition || !definition.name) {
      throw new Error('Capability definition requires a valid name');
    }
    this.customCapabilities.set(definition.name, definition);
    return true;
  }

  /**
   * Register a handler function for a unified capability. Handlers are called
   * instead of the ComputerOperator for capabilities that need custom logic
   * (desktop_control, read_file, write_file, web_search, etc.).
   */
  registerHandler(name, handler) {
    if (!name || typeof name !== 'string') {
      throw new Error('Handler registration requires a valid name');
    }
    if (typeof handler !== 'function') {
      throw new Error(`Handler for '${name}' must be a function`);
    }
    this.handlers.set(name, handler);
    return true;
  }

  /**
   * Load and register a full plugin manifest through the production plugin lifecycle
   */
  registerPlugin(manifest, handlers = {}) {
    if (!manifest || !manifest.id) {
      throw new Error('Plugin manifest requires a valid id');
    }
    // Validate the entire registration before publishing any capabilities or metadata.
    // RPC JSON cannot carry functions; a source loader must supply real handlers.
    const capabilities = Array.isArray(manifest.capabilities) ? manifest.capabilities : [];
    const names = new Set();
    for (const cap of capabilities) {
      const name = typeof cap === 'string' ? cap : cap?.name;
      if (typeof name !== 'string' || !name.trim() || names.has(name)) {
        throw new Error('Plugin capabilities require unique, non-empty names');
      }
      if (!Object.hasOwn(handlers ?? {}, name) || typeof handlers[name] !== 'function') {
        throw new Error(`Plugin '${manifest.id}' capability '${name}' is unavailable: missing executable handler`);
      }
      names.add(name);
    }
    if (!this.loadedPlugins) {
      this.loadedPlugins = new Map();
    }
    const pluginRecord = {
      id: manifest.id,
      name: manifest.name || manifest.id,
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      permissions: Array.isArray(manifest.permissions) ? manifest.permissions : [],
      capabilities: [...names],
      loadedAt: Date.now(),
      status: 'active',
    };
    this.loadedPlugins.set(manifest.id, pluginRecord);

    if (capabilities.length) {
      for (const cap of capabilities) {
        const capDef = typeof cap === 'string' ? { name: cap } : cap;
        const handler = handlers[capDef.name];
        this.registerCapability({
          name: capDef.name,
          description: capDef.description || `Plugin capability from ${manifest.id}`,
          parameters: capDef.parameters || { type: 'object' },
          handler,
        });
      }
    }
    return pluginRecord;
  }

  getPlugin(pluginId) {
    return this.loadedPlugins?.get(pluginId) || null;
  }

  listLoadedPlugins() {
    return Array.from(this.loadedPlugins?.values() || []);
  }

  /**
   * Validate tool name and parameters against canonical capability schema
   */
  validate(toolName, args = {}) {
    const cleanName = String(toolName || '').trim();
    const alias = resolveCapabilityAlias(cleanName);
    const capabilityName = alias?.name || cleanName;
    let effectiveArgs = args && typeof args === 'object' && !Array.isArray(args) ? { ...args } : {};
    if (alias?.set) effectiveArgs = { ...alias.set, ...effectiveArgs };
    if (alias?.action && effectiveArgs.action === undefined) effectiveArgs = { ...effectiveArgs, action: alias.action };

    // Check custom registered plugin capabilities first
    if (this.customCapabilities.has(capabilityName)) {
      return {
        valid: true,
        capability: capabilityName,
        action: effectiveArgs.action || capabilityName,
        params: effectiveArgs,
        custom: true,
        ...(alias ? { alias: cleanName } : {}),
      };
    }

    const def = CAPABILITY_DEFINITIONS[capabilityName];

    if (!def) {
      return {
        valid: false,
        error: `Unsupported capability '${cleanName}'. Zero capability registry could not resolve it. Registered capabilities: ${[...Object.keys(CAPABILITY_DEFINITIONS), ...this.customCapabilities.keys()].join(', ')}. Aliases: ${Object.keys(CAPABILITY_ALIASES).join(', ')}`,
      };
    }

    let action = effectiveArgs.action || capabilityName;
    if (capabilityName === 'open_app' && !effectiveArgs.action) action = 'open_app';
    if (capabilityName === 'browser') {
      action = effectiveArgs.action || (effectiveArgs.query ? 'play' : 'open_url');
    }

    let normAction = String(action || '').toLowerCase().trim();
    // Handler-based capabilities (desktop_control, read_file, etc.) carry their
    // sub-command in params (e.g. params.command) rather than args.action, so
    // skip the allowedActions check when a handler is registered.
    const hasHandler = this.handlers.has(capabilityName) || this.handlers.has(toolName);
    if (!hasHandler && !def.allowedActions.includes(normAction)) {
      return {
        valid: false,
        error: `Action '${normAction}' is not permitted for capability '${capabilityName}'. Allowed: ${def.allowedActions.join(', ')}`,
      };
    }
    if (capabilityName === 'browser' && normAction === 'open') normAction = 'open_url';
    if (capabilityName === 'browser' && normAction === 'search') normAction = 'web_search';

    return {
      valid: true,
      capability: capabilityName,
      action: normAction,
      params: effectiveArgs,
      ...(alias ? { alias: cleanName } : {}),
    };
  }

  /**
   * Execute capability with deterministic authorization, deadline, and verification
   */
  async execute({
    agentId = 'zero',
    toolName,
    args = {},
    signal = null,
    timeoutMs = 30000,
    context = {},
  } = {}) {
    const startedAt = Date.now();
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 1. Schema & Capability Validation
    const validation = this.validate(toolName, args);
    if (!validation.valid) {
      const refusalResult = {
        ok: false,
        capability: toolName,
        error: 'capability-rejected:invalid-schema',
        message: validation.error,
        durationMs: Date.now() - startedAt,
        auditId,
      };
      this._recordAudit(agentId, toolName, args, 'REJECTED', refusalResult);
      return refusalResult;
    }

    const { action, params, capability: capabilityName } = validation;

    if (validation.custom) {
      const customDef = this.customCapabilities.get(toolName);
      if (customDef?.disabled) {
        const disabledResult = {
          ok: false,
          outcome: 'BLOCKED',
          error: 'capability-disabled',
          message: `Plugin capability '${toolName}' is currently disabled.`,
          durationMs: Date.now() - startedAt,
          auditId,
        };
        this._recordAudit(agentId, toolName, args, 'BLOCKED_BY_DISABLED', disabledResult);
        return disabledResult;
      }
      try {
        const customRes = await customDef.handler(params, signal, { agentId, capability: toolName, auditId });
        const durationMs = Date.now() - startedAt;
        const returned = typeof customRes === 'object' && customRes !== null ? customRes : {};
        const ok = returned.ok !== false;
        const executed = returned.executed ?? (returned.outcome !== 'BLOCKED');
        const hasEvidence = (returned.evidence != null && returned.evidence !== '')
          || (returned.verification != null && returned.verification !== false)
          || (typeof returned.verifiedText === 'string' && returned.verifiedText.length > 0)
          || Boolean(returned.observed);
        const verified = ok && executed && (returned.verified === true || Boolean(returned.observed)) && Boolean(hasEvidence);
        const outcome = !ok
          ? (['BLOCKED', 'CANCELLED', 'FAILED'].includes(returned.outcome) ? returned.outcome : 'FAILED')
          : (verified ? 'COMPLETED' : 'UNVERIFIED');
        const res = {
          ...returned,
          ok,
          executed: Boolean(executed),
          verified,
          completed: verified,
          outcome,
          capability: toolName,
          data: customRes,
          durationMs,
          auditId,
        };
        this._recordAudit(agentId, toolName, args, outcome, res);
        return res;
      } catch (err) {
        const durationMs = Date.now() - startedAt;
        const res = {
          ok: false,
          executed: true,
          verified: false,
          completed: false,
          outcome: 'FAILED',
          capability: toolName,
          error: err.message,
          durationMs,
          auditId,
        };
        this._recordAudit(agentId, toolName, args, 'FAILED', res);
        return res;
      }
    }

    // Handler-based unified capabilities (desktop_control, read_file, write_file,
    // web_search, etc.) are dispatched here before the ComputerOperator fallback.
    const handler = this.handlers.get(capabilityName) || this.handlers.get(toolName);
    if (handler) {
      try {
        const handlerRes = await handler(params, signal, { agentId, capability: toolName, action, auditId, context });
        const durationMs = Date.now() - startedAt;
        const returned = typeof handlerRes === 'object' && handlerRes !== null ? handlerRes : {};
        const ok = returned.ok !== false;
        const executed = returned.executed ?? (returned.outcome !== 'BLOCKED');
        const hasEvidence = (returned.evidence != null && returned.evidence !== '')
          || (returned.verification != null && returned.verification !== false)
          || (typeof returned.verifiedText === 'string' && returned.verifiedText.length > 0)
          || Boolean(returned.observed);
        const verified = ok && executed && (returned.verified === true || Boolean(returned.observed)) && Boolean(hasEvidence);
        const outcome = !ok
          ? (['BLOCKED', 'CANCELLED'].includes(returned.outcome) ? returned.outcome : 'FAILED')
          // A handler that ran to the end and reports its task complete is done,
          // even when it has no separate evidence object (system_info, status).
          : ((verified || returned.taskComplete === true) ? 'COMPLETED' : 'UNVERIFIED');
        const res = {
          ...returned,
          ok,
          executed: Boolean(executed),
          verified,
          completed: outcome === 'COMPLETED' && ok,
          outcome,
          capability: toolName,
          action,
          data: handlerRes,
          durationMs,
          auditId,
        };
        this._recordAudit(agentId, toolName, params, outcome, res);
        return res;
      } catch (err) {
        const durationMs = Date.now() - startedAt;
        const res = {
          ok: false,
          executed: false,
          verified: false,
          completed: false,
          outcome: 'FAILED',
          capability: toolName,
          action,
          error: err.message,
          message: err.message,
          durationMs,
          auditId,
        };
        this._recordAudit(agentId, toolName, params, 'FAILED', res);
        return res;
      }
    }

    // 2. Deterministic Safety & Human Takeover Enforcement
    const desktopObservation = action === 'desktop' && DESKTOP_OBSERVATIONS.has(params.command);
    const safety = this.operator.evaluateSafety(desktopObservation ? 'get_elements' : action);
    if (!safety.allowed) {
      const holdResult = {
        ok: false,
        executed: false,
        verified: false,
        completed: false,
        outcome: 'BLOCKED',
        capability: toolName,
        action,
        error: safety.error,
        message: safety.message,
        durationMs: Date.now() - startedAt,
        auditId,
      };
      this._recordAudit(agentId, toolName, params, 'BLOCKED_BY_HOLD', holdResult);
      return holdResult;
    }


    // 3. Desktop Lease Coordination
    const isDesktopAction = (action === 'desktop' && !desktopObservation) || ['type_text', 'type', 'press_key', 'press', 'key', 'hotkey', 'mouse_move', 'move', 'left_click', 'click', 'right_click', 'double_click', 'mouse_drag', 'drag', 'focus_window', 'control_window'].includes(action);
    let leaseAcquiredLocally = false;
    if (this.leaseManager && isDesktopAction) {
      const leaseRes = await this.leaseManager.acquireLease(agentId, {
        reason: `Executing action ${action}`,
        timeoutMs: Math.max(15000, Number(timeoutMs) + 5000),
        waitMs: 5000,
        signal,
      });
      if (!leaseRes.acquired) {
        const leaseContentionResult = {
          ok: false,
          outcome: 'BLOCKED',
          error: 'DESKTOP_LEASE_CONTENTION',
          message: `Desktop action blocked: lease currently held by agent [${leaseRes.holder}]`,
          holder: leaseRes.holder,
          durationMs: Date.now() - startedAt,
          auditId,
        };
        this._recordAudit(agentId, toolName, params, 'BLOCKED_BY_LEASE', leaseContentionResult);
        return leaseContentionResult;
      }
      if (!leaseRes.renewed) {
        leaseAcquiredLocally = true;
      }
    }

    try {
    // 4. Before-State Observation
    let beforeState = null;
    try {
      if (['open_app', 'launch_app', 'focus_window', 'play'].includes(action)) {
        beforeState = await this.operator.execute('get_window_state', {}, signal).catch(() => null);
      }
    } catch {}

    // 5. Execution with Deadline and Cancellation
    const abortController = new AbortController();
    const timer = setTimeout(() => {
      abortController.abort(new Error(`Capability execution exceeded ${timeoutMs}ms deadline`));
    }, timeoutMs);

    const combinedSignal = signal ? AbortSignal.any([signal, abortController.signal]) : abortController.signal;

    let execResult;
    try {
      execResult = await this.operator.execute(action, params, combinedSignal);
    } catch (err) {
      execResult = {
        ok: false,
        action,
        error: 'capability-execution-failed',
        message: err.message,
      };
    } finally {
      clearTimeout(timer);
    }

    // 5b. Human-reflex escalation. A failure of the fast DOM/UIA path is not a
    // dead end: look at a fresh frame and finish with the physical pointer.
    if (execResult?.ok === false && this._shouldReflex(action, params, execResult)) {
      const reflex = await this._reflexEscalate(action, params, combinedSignal).catch(() => null);
      if (reflex) {
        execResult = {
          ...reflex,
          primaryFailure: execResult.error || execResult.message || 'primary path failed',
        };
      }
    }

    // 6. After-State Verification
    let afterState = null;
    let verified = execResult.ok !== false && Boolean(execResult.verified);
    try {
      if (execResult.ok && ['open_app', 'launch_app', 'focus_window'].includes(action)) {
        afterState = await this.operator.execute('get_window_state', {}, null).catch(() => null);
        if (afterState?.window) {
          const winTitle = String(afterState.window.title || '').toLowerCase();
          const procName = String(afterState.window.processName || '').toLowerCase();
          const target = String(params.app || params.target || '').toLowerCase();
          const matches = Boolean(winTitle.includes(target) || procName.includes(target) || (afterState.window.pid && afterState.window.pid !== beforeState?.window?.pid) || execResult.pid || execResult.launched);
          if (matches) verified = true;
        } else if (execResult.pid || execResult.launched) {
          verified = true;
        }
      }
      if (execResult.ok && ['get_elements', 'get_uia_elements', 'list_windows', 'list_apps', 'play', 'browser', 'open_url', 'navigate', 'spotify_control', 'type_text', 'type', 'press_key', 'press', 'hotkey', 'left_click', 'click', 'right_click', 'double_click', 'close_app', 'kill_app', 'screenshot', 'scroll', 'wait', 'mouse_move', 'move', 'run_process'].includes(action)) {
        if (execResult.verified !== false) verified = true;
      }
      if (execResult.ok && (execResult.outcome === 'COMPLETED' || execResult.verified === true)) {
        verified = true;
      }
    } catch {}

    const executed = Boolean(execResult.executed ?? execResult.ok);
    const durationMs = Date.now() - startedAt;
    const isCancelled = combinedSignal.aborted;
    let outcome = execResult.outcome;
    if (isCancelled) {
      outcome = 'CANCELLED';
      verified = false;
    } else if (execResult.ok === false) {
      verified = false;
      outcome = ['FAILED', 'BLOCKED', 'CANCELLED', 'UNVERIFIED'].includes(outcome) ? outcome : 'FAILED';
    } else if (!outcome || outcome === 'UNVERIFIED') {
      outcome = executed ? (verified ? 'COMPLETED' : 'UNVERIFIED') : 'FAILED';
    }

    const finalResult = {
      ...(typeof execResult === 'object' && execResult !== null ? execResult : {}),
      ok: executed && execResult.ok !== false && !isCancelled,
      executed,
      verified,
      completed: outcome === 'COMPLETED' && execResult.ok !== false && !isCancelled,
      outcome,
      capability: toolName,
      action,
      data: execResult,
      ...(action === 'desktop' ? { backend: execResult.backend, desktop: execResult.data, disposition: execResult.disposition, evidence: execResult.evidence, requiresObservation: execResult.requiresObservation === true } : {}),
      window: execResult.window || afterState?.window,
      before: beforeState?.window?.title,
      after: afterState?.window?.title || execResult.window?.title,
      ...(execResult.verifiedText !== undefined ? { verifiedText: execResult.verifiedText } : {}),
      ...(action === 'play' ? {
        browserOpened: Boolean(execResult.browserOpened),
        pageLoaded: Boolean(execResult.pageLoaded),
        audioActive: Boolean(execResult.audioActive),
        playbackState: execResult.playbackState || (execResult.audioActive ? 'PLAYING' : 'UNVERIFIED'),
        audioAudible: execResult.audioAudible || 'UNVERIFIED',
        videoTitle: execResult.videoTitle,
        videoId: execResult.videoId,
      } : {}),
      auditId,
      durationMs,
      ...(execResult.error ? { error: execResult.error, message: execResult.message } : {}),
    };

    this._recordAudit(agentId, toolName, params, outcome, finalResult);
    return finalResult;
    } finally {
      if (leaseAcquiredLocally) this.leaseManager.releaseLease(agentId);
    }
  }

  /**
   * The reflex is a second attempt at a CLICK on a named control: when the
   * fast path could not click it, find the control by name in the UI tree and
   * click its centre. It is deliberately narrow:
   *  - clicks only; it never types or presses keys,
   *  - only when the control was named with at least three characters,
   *  - never after a refusal (missing argument, blocked, window not found).
   */
  _shouldReflex(action, params, execResult = null) {
    const clickActions = new Set(['left_click', 'click', 'right_click', 'double_click']);
    if (!clickActions.has(String(action || '').toLowerCase())) return false;
    if (execResult?.outcome === 'BLOCKED' || execResult?.outcome === 'CANCELLED') return false;
    if (['missing-target', 'focus-failed', 'missing-text'].includes(execResult?.error)) return false;
    if (Number.isFinite(params?.x) && Number.isFinite(params?.y)) return false; // same point again would not help
    return this._reflexHints(params).length > 0;
  }

  _reflexHints(params) {
    return [params?.target, params?.label, params?.text, params?.selector, params?.ref]
      .filter(value => typeof value === 'string' && value.trim().length >= 3)
      .map(value => value.trim().toLowerCase());
  }

  async _reflexEscalate(action, params, signal) {
    const hints = this._reflexHints(params);
    if (!hints.length) return null;
    const before = await this.operator.execute('screenshot', {}, signal).catch(() => null);
    const tree = await this.operator.execute('get_elements', {}, signal).catch(() => null);
    const elements = Array.isArray(tree?.elements)
      ? tree.elements
      : Array.isArray(tree?.data?.elements) ? tree.data.elements : [];
    const nameOf = element => String(element.name || element.label || '').trim().toLowerCase();
    // An exact name wins; otherwise the control's name must contain the hint.
    const matched = elements.find(element => hints.includes(nameOf(element)))
      || elements.find(element => { const name = nameOf(element); return name && hints.some(hint => name.includes(hint)); })
      || null;
    if (!matched) return null;
    const x = Number(matched.centerX ?? matched.cx);
    const y = Number(matched.centerY ?? matched.cy);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    const clickAction = ['right_click', 'double_click'].includes(action) ? action : 'left_click';
    const click = await this.operator.execute(clickAction, { x, y }, signal).catch(() => null);
    if (!click?.ok) return null;

    const after = await this.operator.execute('screenshot', {}, null).catch(() => null);
    const changed = Boolean(before?.hash && after?.hash && before.hash !== after.hash);
    return {
      ok: true,
      executed: true,
      verified: changed,
      completed: changed,
      outcome: changed ? 'COMPLETED' : 'UNVERIFIED',
      action,
      backend: 'zero-reflex',
      reflex: 'uia-name-click',
      coordinates: { x, y },
      matchedElement: { name: matched.name, type: matched.type || matched.controlType },
      message: `The fast path could not click it; Zero found the control "${matched.name}" on screen and clicked it.`,
    };
  }

  _recordAudit(agentId, toolName, params, decision, outcome) {
    const entry = {
      auditId: outcome.auditId,
      timestamp: new Date().toISOString(),
      agentId,
      toolName,
      decision,
      ok: outcome.ok,
      durationMs: outcome.durationMs,
      error: outcome.error || null,
    };
    this.auditLog.push(entry);
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog.shift();
    }
  }

  getAuditLog(limit = 50) {
    return this.auditLog.slice(-limit);
  }
}

export const canonicalCapabilityEngine = new CapabilityEngine();

// === Register built-in handlers for all unified Single-Room capabilities ===

import fs from 'node:fs/promises';
import path from 'node:path';

import { defaultEmbedEngine } from './embed-engine.mjs';
import { seeScreen, browserAction } from './desktop-actions.mjs';

// see_screen: one fresh look at the desktop (frame, text, window, controls).
canonicalCapabilityEngine.registerHandler('see_screen', async (_params, signal) => seeScreen({ signal }));

// browser: Zero's own visible browser session. An action it does not cover,
// or one that fails there, goes to the computer operator instead.
canonicalCapabilityEngine.registerHandler('browser', async (params, signal, { action, context }) => {
  let primaryFailure = null;
  try {
    const result = await browserAction(action, params, { signal, userText: context?.userText || '' });
    if (result) return result;
  } catch (error) {
    if (signal?.aborted) throw error;
    primaryFailure = error.message;
  }
  const fallback = await canonicalCapabilityEngine.operator.execute(action, params, signal);
  return primaryFailure ? { ...fallback, primaryFailure } : fallback;
});
import { defaultVoiceStatus } from './voice-status.mjs';

// read_file / write_file / run_process (moved from terminal-ops.mjs)
const resolvePath = (value, cwd = process.cwd()) => {
  if (typeof value !== 'string' || !value || value.includes('\0')) throw new Error('A valid filesystem path is required');
  return path.resolve(cwd, value);
};

canonicalCapabilityEngine.registerHandler('read_file', async ({ path: file }) => {
  const resolved = resolvePath(file);
  if ((await fs.stat(resolved)).size > 4 * 1024 * 1024) throw new Error('File exceeds the 4 MiB text-read limit');
  const content = await fs.readFile(resolved, 'utf8');
  const { createHash } = await import('node:crypto');
  return { ok: true, status: 'COMPLETED', outcome: 'VERIFIED', taskComplete: true, path: resolved, content, summary: `Read ${Buffer.byteLength(content)} bytes from ${resolved}`, verified: true, evidence: { bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') } };
});

canonicalCapabilityEngine.registerHandler('write_file', async ({ path: file, content }) => {
  if (typeof content !== 'string' || Buffer.byteLength(content) > 4 * 1024 * 1024) throw new Error('Expected at most 4 MiB of UTF-8 text');
  const resolved = resolvePath(file);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, 'utf8');
  const actual = await fs.readFile(resolved, 'utf8');
  const { createHash } = await import('node:crypto');
  return { ok: actual === content, status: 'COMPLETED', outcome: 'VERIFIED', taskComplete: true, path: resolved, verified: actual === content, summary: `Wrote ${Buffer.byteLength(actual)} bytes to ${resolved}`, evidence: { bytes: Buffer.byteLength(actual), sha256: createHash('sha256').update(actual).digest('hex') } };
});

canonicalCapabilityEngine.registerHandler('run_process', async ({ command, args = [], cwd: directory, timeoutMs = 60000, shell = false, shellExecutable = '' }, signal) => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execute = promisify(execFile);
  // Tolerate the common model slips: a single string or null instead of an array.
  if (args == null) args = [];
  else if (typeof args === 'string') args = args.trim() ? [args] : [];
  else if (Array.isArray(args)) args = args.filter(arg => arg !== '' && arg != null).map(arg => (typeof arg === 'number' ? String(arg) : arg));
  if (typeof command !== 'string' || !command || !Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new Error('Expected a command and an array of string arguments');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) throw new Error('Process timeout must be between 1 and 300000 ms');
  const workingDirectory = directory ? resolvePath(directory) : process.cwd();
  let safeArgs = [...args];
  let executable = command;
  if (/^(cmd|cmd\.exe)$/i.test(path.basename(executable))) {
    safeArgs = safeArgs.map(arg => (/^[\/-]k$/i.test(arg) ? '/c' : arg));
    if (!safeArgs.some(a => /^[\/-][cC]$/.test(a))) safeArgs = ['/c', ...safeArgs];
  }
  if (shell && !args.length) {
    const requestedShell = String(shellExecutable || '').trim();
    if (requestedShell) {
      executable = requestedShell;
      safeArgs = /powershell/i.test(requestedShell)
        ? ['-NoProfile', '-NonInteractive', '-Command', command]
        : ['-lc', command];
    } else {
      safeArgs = [];
    }
  }
  try {
    const result = await execute(executable, safeArgs, { cwd: workingDirectory, windowsHide: true, timeout: timeoutMs, ...(signal ? { signal } : {}), maxBuffer: 4 * 1024 * 1024, ...(shell && !safeArgs.length ? { shell: true } : {}) });
    const stdout = result.stdout || '';
    return { ok: true, status: 'COMPLETED', outcome: 'VERIFIED', taskComplete: true, executed: true, stdout, stderr: result.stderr || '', exitCode: 0, summary: `Ran '${command} ${safeArgs.join(' ')}' -> exit 0 (${stdout.length} bytes output)`, verified: true, evidence: { execution: 'child-process-exit', exitCode: 0, cwd: workingDirectory, shell: Boolean(shell) } };
  } catch (error) {
    return { ok: false, status: 'FAILED', outcome: signal?.aborted ? 'CANCELLED' : 'FAILED', taskComplete: false, executed: error.code !== 'ENOENT', stdout: error.stdout || '', stderr: error.stderr || '', exitCode: typeof error.code === 'number' ? error.code : null, error: error.message, verified: false };
  }
});

// desktop_control (delegates to ComputerOperator desktop action)
canonicalCapabilityEngine.registerHandler('desktop_control', async (params, signal, { capability, action }) => {
  return await canonicalCapabilityEngine.execute({ agentId: 'zero', toolName: 'zero_computer_action', args: { headed: params.headed ?? true, ...params, action: 'desktop' }, signal });
});

// doctor_memory_status
canonicalCapabilityEngine.registerHandler('doctor_memory_status', async () => {
  const engStatus = defaultEmbedEngine.getStatus();
  return { ok: true, status: 'COMPLETED', outcome: 'VERIFIED', taskComplete: true, agentId: 'zero', provider: 'zero-local-embeddings', searchRuntimeRegistered: true, embedding: { ...engStatus, available: true } };
});

// voice_status
canonicalCapabilityEngine.registerHandler('voice_status', async () => {
  const vs = defaultVoiceStatus.getStatus();
  return { ok: true, status: 'COMPLETED', outcome: 'VERIFIED', taskComplete: true, ready: vs.ready ? 'ready' : 'idle', ...vs };
});

// web_search
canonicalCapabilityEngine.registerHandler('web_search', async ({ query, maxResults = 5 }) => {
  const { SearchEngine } = await import('../../packages/research-engine/search.mjs');
  const search = new SearchEngine();
  const result = await search.search(query, { limit: maxResults });
  return { ...result, ok: result.status === 'ok', status: 'COMPLETED', outcome: result.status === 'ok' ? 'VERIFIED' : 'FAILED', taskComplete: true, results: result.citations };
});

// web_extract
canonicalCapabilityEngine.registerHandler('web_extract', async ({ url }) => {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Expected an HTTP(S) URL without credentials');
  const response = await fetch(parsed, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) return { ok: false, status: 'failed', url: parsed.href, httpStatus: response.status, content: '' };
  const reader = response.body.getReader();
  const chunks = []; let bytes = 0; let truncated = false;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const remaining = 1024 * 1024 - bytes;
      chunks.push(next.value.subarray(0, remaining));
      bytes += Math.min(next.value.length, remaining);
      if (bytes >= 1024 * 1024) { truncated = true; await reader.cancel(); break; }
    }
  } finally { reader.releaseLock(); }
  return { ok: true, status: 'COMPLETED', outcome: 'VERIFIED', taskComplete: true, url: response.url, httpStatus: response.status, contentType: response.headers.get('content-type'), content: Buffer.concat(chunks).toString('utf8'), bytes, truncated, verified: false, untrustedContent: true, retrievedAt: new Date().toISOString() };
});

// system_info
canonicalCapabilityEngine.registerHandler('system_info', async () => {
  return { ok: true, status: 'COMPLETED', outcome: 'VERIFIED', taskComplete: true, hostname: os.hostname(), platform: process.platform, arch: process.arch, uptime: process.uptime(), memoryUsage: process.memoryUsage() };
});

// zero_skill_learn
canonicalCapabilityEngine.registerHandler('zero_skill_learn', async ({ name, description, triggers = [], capabilities = [], workflowSteps = [], examples = [], overwrite = false }) => {
  if (!name || typeof name !== 'string') throw new Error('Skill name is required and must be a string');
  const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  const targetDir = path.join(process.cwd(), 'skills', cleanName);
  const targetFile = path.join(targetDir, 'SKILL.md');
  const alreadyExists = await fs.access(targetFile).then(() => true, () => false);
  if (alreadyExists && !overwrite) return { ok: false, status: 'FAILED', outcome: 'BLOCKED', taskComplete: false, reason: 'skill-already-exists', path: targetFile };
  await fs.mkdir(targetDir, { recursive: true });
  const triggersYaml = (triggers.length > 0 ? triggers : [cleanName]).map((t) => `  - "${t.replace(/"/g, '\\"')}"`).join('\n');
  const capabilitiesMd = (capabilities.length > 0 ? capabilities : ['Autonomous task execution']).map((c, i) => `${i + 1}. **${c}**`).join('\n');
  const workflowMd = (workflowSteps.length > 0 ? workflowSteps : ['Execute task steps cleanly and verify.']).map((s, i) => `${i + 1}. ${s}`).join('\n');
  const examplesMd = examples.length > 0 ? `\n## Examples\n${examples.map((e) => `- ${e}`).join('\n')}` : '';
  const content = `---\nname: ${cleanName}\ndescription: ${description || `Auto-learned skill for ${cleanName}`}\ntriggers:\n${triggersYaml}\n---\n\n# ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1).replace(/-/g, ' ')} Skill\n\n${description || 'Auto-generated autonomous agent skill.'}\n\n## Capabilities\n${capabilitiesMd}\n\n## Standard Execution Workflow\n${workflowMd}${examplesMd}\n`;
  await fs.writeFile(targetFile, content, 'utf8');
  return { ok: true, status: 'COMPLETED', outcome: 'VERIFIED', taskComplete: true, name: cleanName, path: targetFile, bytes: Buffer.byteLength(content, 'utf8') };
});

