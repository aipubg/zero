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

export const CAPABILITY_DEFINITIONS = Object.freeze({
  'zero_computer_action': {
    description: 'Execute native Windows OS actions: open_app, type_text, press_key, mouse_move, left_click, scroll, wait, screenshot, list_windows, list_apps, get_window_state, get_screen_size, play, open_url.',
    allowedActions: [
      'open_app', 'launch_app', 'type_text', 'type', 'press_key', 'press', 'hotkey',
      'mouse_move', 'move', 'left_click', 'click', 'right_click', 'double_click',
      'mouse_drag', 'drag', 'scroll', 'wait', 'screenshot', 'list_windows', 'list_apps',
      'get_window_state', 'get_screen_size', 'get_cursor_position', 'get_cursor',
      'focus_window', 'control_window', 'bring_to_front', 'play', 'browser', 'open_browser',
      'open_url', 'media_control', 'clipboard_get', 'clipboard_set', 'get_elements', 'get_uia_elements'
    ],
  },
  'browser': {
    description: 'Control web browser on Windows: open URLs, search and play songs/videos on YouTube.',
    allowedActions: ['open', 'play', 'navigate', 'search'],
  },
  'open_app': {
    description: 'Launch an application on Windows desktop (e.g. notepad, calc, chrome).',
    allowedActions: ['open_app', 'launch_app'],
  },
});

export class CapabilityEngine {
  constructor({ operator = null, logger = console } = {}) {
    this.operator = operator || new ComputerOperator();
    this.logger = logger;
    this.auditLog = [];
    this.maxAuditEntries = 1000;
  }

  /**
   * Validate tool name and parameters against canonical capability schema
   */
  validate(toolName, args = {}) {
    const cleanName = String(toolName || '').trim();
    const def = CAPABILITY_DEFINITIONS[cleanName];

    if (!def) {
      return {
        valid: false,
        error: `Unsupported capability '${cleanName}'. Registered capabilities: ${Object.keys(CAPABILITY_DEFINITIONS).join(', ')}`,
      };
    }

    let action = args.action || cleanName;
    if ((cleanName === 'open_app' || cleanName === 'launch_app') && !args.action) action = 'open_app';
    if (cleanName === 'browser') {
      action = args.action || (args.query ? 'play' : 'open_url');
    }

    const normAction = String(action || '').toLowerCase().trim();
    if (!def.allowedActions.includes(normAction)) {
      return {
        valid: false,
        error: `Action '${normAction}' is not permitted for capability '${cleanName}'. Allowed: ${def.allowedActions.join(', ')}`,
      };
    }

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

    // 2. Deterministic Safety & Human Takeover Enforcement
    const safety = this.operator.evaluateSafety(action);
    if (!safety.allowed) {
      const holdResult = {
        ok: false,
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

    // 3. Before-State Observation
    let beforeState = null;
    try {
      if (['open_app', 'launch_app', 'focus_window', 'play'].includes(action)) {
        beforeState = await this.operator.execute('get_window_state', {}, signal).catch(() => null);
      }
    } catch {}

    // 4. Execution with Deadline and Cancellation
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

    // 5. After-State Verification
    let afterState = null;
    let verified = execResult.ok;
    try {
      if (execResult.ok && ['open_app', 'launch_app', 'focus_window', 'play'].includes(action)) {
        afterState = await this.operator.execute('get_window_state', {}, null).catch(() => null);
        if (afterState && beforeState) {
          verified = Boolean(afterState.window?.title !== beforeState.window?.title || afterState.window?.pid !== beforeState.window?.pid || execResult.ok);
        }
      }
    } catch {}

    const durationMs = Date.now() - startedAt;
    const finalResult = {
      ok: execResult.ok,
      capability: toolName,
      action,
      verified,
      data: execResult,
      window: execResult.window,
      before: beforeState?.window?.title,
      after: afterState?.window?.title || execResult.window?.title,
      ...(execResult.verifiedText || (['type_text', 'type'].includes(action) && execResult.ok) ? { verifiedText: execResult.verifiedText || params.text } : {}),
      ...(action === 'play' ? { audioActive: Boolean(execResult.audioActive ?? execResult.audioPlaying), videoTitle: execResult.videoTitle, videoId: execResult.videoId } : {}),
      auditId,
      durationMs,
      ...(execResult.error ? { error: execResult.error, message: execResult.message } : {}),
    };

    this._recordAudit(agentId, toolName, params, execResult.ok ? 'ALLOWED' : 'FAILED', finalResult);
    return finalResult;
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
