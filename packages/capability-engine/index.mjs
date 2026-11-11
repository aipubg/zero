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

import { ComputerOperator } from '../../app/zero-control-ui/src/computer/operator.js';
import { DESKTOP_OBSERVATIONS } from '../agent-runtime/agent-desktop.mjs';

export const CAPABILITY_DEFINITIONS = Object.freeze({
  'zero_computer_action': {
    description: 'Execute native Windows OS actions: open_app, type_text, press_key, mouse_move, left_click, scroll, wait, screenshot, list_windows, list_apps, get_window_state, get_screen_size, play, open_url.',
    allowedActions: [
      'desktop',
      'open_app', 'launch_app', 'type_text', 'type', 'press_key', 'press', 'hotkey',
      'mouse_move', 'move', 'left_click', 'click', 'right_click', 'double_click',
      'mouse_drag', 'drag', 'scroll', 'wait', 'screenshot', 'list_windows', 'list_apps',
      'get_window_state', 'get_screen_size', 'get_cursor_position', 'get_cursor',
      'focus_window', 'control_window', 'bring_to_front', 'close_app', 'kill_app', 'play', 'browser', 'open_browser',
      'open_url', 'media_control', 'spotify_control', 'clipboard_get', 'clipboard_set', 'get_elements', 'get_uia_elements'
    ],
  },
  'browser': {
    description: 'Control web browser on Windows: open URLs, search and play songs/videos on YouTube.',
    allowedActions: ['open', 'open_url', 'play', 'navigate', 'search'],
  },
  'open_app': {
    description: 'Launch an application on Windows desktop (e.g. notepad, calc, chrome).',
    allowedActions: ['open_app', 'launch_app'],
  },
});

export class CapabilityEngine {
  constructor({ operator = null, leaseManager = null, logger = console } = {}) {
    this.leaseManager = leaseManager;
    this.operator = operator || new ComputerOperator();
    this.logger = logger;
    this.auditLog = [];
    this.maxAuditEntries = 1000;
    this.customCapabilities = new Map();
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

    // Check custom registered plugin capabilities first
    if (this.customCapabilities.has(cleanName)) {
      return {
        valid: true,
        capability: cleanName,
        action: args.action || cleanName,
        params: args,
        custom: true,
      };
    }

    const def = CAPABILITY_DEFINITIONS[cleanName];

    if (!def) {
      return {
        valid: false,
        error: `Unsupported capability '${cleanName}'. Registered capabilities: ${[...Object.keys(CAPABILITY_DEFINITIONS), ...this.customCapabilities.keys()].join(', ')}`,
      };
    }

    let action = args.action || cleanName;
    if ((cleanName === 'open_app' || cleanName === 'launch_app') && !args.action) action = 'open_app';
    if (cleanName === 'browser') {
      action = args.action || (args.query ? 'play' : 'open_url');
    }

    let normAction = String(action || '').toLowerCase().trim();
    if (!def.allowedActions.includes(normAction)) {
      return {
        valid: false,
        error: `Action '${normAction}' is not permitted for capability '${cleanName}'. Allowed: ${def.allowedActions.join(', ')}`,
      };
    }
    if (cleanName === 'browser' && normAction === 'open') normAction = 'open_url';
    if (cleanName === 'browser' && normAction === 'search') normAction = 'web_search';

    return {
      valid: true,
      capability: cleanName,
      action: normAction,
      params: args,
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

    const { action, params } = validation;

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
    const isDesktopAction = (action === 'desktop' && !desktopObservation) || ['type_text', 'type', 'press_key', 'press', 'hotkey', 'mouse_move', 'move', 'left_click', 'click', 'right_click', 'double_click', 'mouse_drag', 'drag', 'focus_window', 'control_window'].includes(action);
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
      if (execResult.ok && ['get_elements', 'get_uia_elements', 'get_window_state', 'list_windows', 'list_apps', 'get_cursor_position', 'get_screen_size', 'play', 'browser', 'open_url', 'navigate', 'spotify_control', 'type_text', 'type', 'press_key', 'press', 'hotkey', 'left_click', 'click', 'right_click', 'double_click', 'close_app', 'kill_app', 'screenshot', 'scroll', 'wait', 'mouse_move', 'move', 'run_process'].includes(action)) {
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
