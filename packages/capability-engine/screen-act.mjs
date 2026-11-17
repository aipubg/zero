/**
 * screen_act: carry out a goal on screen with Gemini Computer Use.
 *
 * Loop: screenshot -> Gemini proposes UI actions -> Zero performs them with
 * its own hands -> new screenshot -> ... until Gemini answers without an
 * action (goal done), a step limit is hit, or something must stop it.
 *
 * Facts this relies on (verified on the owner's key, 2026-11-17):
 * - Coordinates are on a 0-999 grid over the screenshot.
 * - The "browser" environment works; "desktop" was refused. Navigation
 *   actions are excluded and launching apps goes through our open_app.
 *
 * Rules kept here:
 * - No screenshot is sent while an excluded app (password manager, ...) is in front.
 * - Typing and keys go only to the window Zero last clicked in this run.
 * - An action Gemini marks `require_confirmation` is not performed until the
 *   owner confirms; the run pauses and returns a confirm token.
 */

import { randomUUID } from 'node:crypto';
import { postInteraction as defaultPostInteraction } from '../model-fabric/gemini-screen-share.mjs';

const POINTER_ACTIONS = new Set(['click', 'double_click', 'triple_click', 'middle_click', 'right_click', 'drag_and_drop']);
const KEY_NAMES = { control: 'ctrl', ctl: 'ctrl', meta: 'win', command: 'win', cmd: 'win', super: 'win', windows: 'win', return: 'enter', esc: 'escape', arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', del: 'delete' };
const normKey = key => { const k = String(key || '').trim().toLowerCase().replace(/\s+/g, ''); return KEY_NAMES[k] || k; };

const instructions = ({ goal, width, height }) => [
  `You are operating a Windows desktop (not a web page) through screenshots of the whole ${width}x${height} screen.`,
  'Use Windows shortcuts (Ctrl, not Cmd/Meta). To start an application, call open_app instead of searching for it.',
  'Click into a text field before typing into it.',
  'When the goal is complete, or cannot be completed, reply with one or two plain sentences and no action.',
  `Goal: ${goal}`,
].join('\n');

/**
 * @param {object} deps
 * @param {() => ({ apiKey: string, config: object } | null)} deps.getSettings
 * @param {(action: string, args: object, signal?: AbortSignal) => Promise<object>} deps.act   Zero's hands (zero_computer_action)
 * @param {(app: string, signal?: AbortSignal) => Promise<object>} deps.openApp
 * @param {(signal?: AbortSignal) => Promise<{ base64: string, mimeType: string }>} deps.capture
 * @param {(signal?: AbortSignal) => Promise<{ width: number, height: number }>} deps.screenSize
 * @param {(signal?: AbortSignal) => Promise<{ title?: string, process?: string }>} deps.foreground
 */
export function createScreenAct({
  getSettings, act, openApp, capture, screenSize, foreground,
  postInteraction = defaultPostInteraction, interactionsUrl, maxSteps = 15,
  retryDelaysMs, confirmTtlMs = 10 * 60 * 1000,
} = {}) {
  const pending = new Map();

  const excludedInFront = async (config, signal) => {
    const front = await foreground(signal).catch(() => ({}));
    const haystack = `${front.title || ''} ${front.process || ''}`.toLowerCase();
    const hit = (config.excludedApps || []).find(app => app && haystack.includes(app.toLowerCase()));
    return hit ? { app: hit, title: front.title || '' } : null;
  };

  const tools = config => [
    { type: 'computer_use', environment: config.computerUseEnvironment || 'browser', excluded_predefined_functions: ['navigate', 'go_back', 'go_forward'] },
    { type: 'function', name: 'open_app', description: 'Launch a Windows application by name, e.g. "notepad", "calc", "chrome", "spotify".', parameters: { type: 'object', properties: { app: { type: 'string' } }, required: ['app'] } },
  ];

  async function perform(call, state, signal) {
    const a = call.arguments || {};
    const toPx = (x, y) => ({ x: Math.round(Number(x) / 1000 * state.width), y: Math.round(Number(y) / 1000 * state.height) });
    const keyTarget = () => state.clickedWindow;
    const needsTarget = () => ({ ok: false, error: 'Click the field or window first; keys only go to the window Zero clicked in this task.' });
    switch (call.name) {
      case 'click': return act('left_click', toPx(a.x, a.y), signal);
      case 'double_click': return act('double_click', toPx(a.x, a.y), signal);
      case 'triple_click': return act('left_click', { ...toPx(a.x, a.y), count: 3 }, signal);
      case 'right_click': return act('right_click', toPx(a.x, a.y), signal);
      case 'middle_click': return act('middle_click', toPx(a.x, a.y), signal);
      case 'move': return act('mouse_move', toPx(a.x, a.y), signal);
      case 'drag_and_drop': {
        const from = toPx(a.start_x, a.start_y); const to = toPx(a.end_x, a.end_y);
        return act('mouse_drag', { from_x: from.x, from_y: from.y, to_x: to.x, to_y: to.y }, signal);
      }
      case 'scroll': {
        const at = toPx(a.x ?? 500, a.y ?? 500);
        const amount = Math.max(1, Math.min(15, Math.round(Number(a.magnitude_in_pixels ?? 300) / 100)));
        return act('scroll', { ...at, direction: String(a.direction || 'down'), amount }, signal);
      }
      case 'type': {
        if (!keyTarget()) return needsTarget();
        const typed = await act('type_text', { text: String(a.text ?? ''), target: keyTarget() }, signal);
        if (typed?.ok !== false && a.press_enter) return act('press_key', { key: 'enter', target: keyTarget() }, signal);
        return typed;
      }
      case 'press_key':
        if (!keyTarget()) return needsTarget();
        return act('press_key', { key: normKey(a.key), target: keyTarget() }, signal);
      case 'hotkey':
        if (!keyTarget()) return needsTarget();
        return act('hotkey', { key: (Array.isArray(a.keys) ? a.keys : [a.keys]).map(normKey).join('+'), target: keyTarget() }, signal);
      case 'wait':
        return act('wait', { ms: Math.min(10_000, Math.max(0, Number(a.seconds ?? 1) * 1000)) }, signal);
      case 'take_screenshot':
        return { ok: true };
      case 'open_app':
        return openApp(String(a.app || ''), signal);
      case 'mouse_down': case 'mouse_up': case 'key_down': case 'key_up':
        return { ok: false, error: `${call.name} is not available yet; use click, drag_and_drop or hotkey instead.` };
      default:
        return { ok: false, error: `Unknown action ${call.name}` };
    }
  }

  const resultText = (res, extra = {}) => JSON.stringify({ ok: res?.ok !== false, ...(res?.ok === false ? { error: res.error || res.message || 'failed' } : {}), ...extra });

  async function run({ goal, settings, state, interactionId, input, log }, signal) {
    const { apiKey, config } = settings;
    for (let step = log.length; step < maxSteps; step++) {
      signal?.throwIfAborted?.();
      const res = await postInteraction(apiKey, {
        model: config.computerUseModel, tools: tools(config), input,
        ...(interactionId ? { previous_interaction_id: interactionId } : {}),
      }, { signal, ...(interactionsUrl ? { url: interactionsUrl } : {}), ...(retryDelaysMs ? { retryDelaysMs } : {}) });
      if (!res?.ok) {
        return { ok: false, executed: log.length > 0, verified: false, completed: false, outcome: 'FAILED', error: 'computer-use-request-failed', message: `Gemini Computer Use did not answer: ${res?.body?.error?.message || `HTTP ${res?.status}`}`, steps: log };
      }
      interactionId = res.body.id;
      const steps = Array.isArray(res.body.steps) ? res.body.steps : [];
      const calls = steps.filter(s => s.type === 'function_call');
      if (!calls.length) {
        const summary = steps.filter(s => s.type === 'model_output').flatMap(s => (s.content || []).map(c => c.text || '')).join(' ').trim();
        return { ok: true, executed: log.length > 0, verified: false, completed: true, outcome: 'COMPLETED', summary: summary || 'Done.', steps: log, message: summary || 'Done.' };
      }

      const results = [];
      for (const [index, call] of calls.entries()) {
        const safety = call.arguments?.safety_decision;
        if (safety?.decision === 'require_confirmation' && !call.__acknowledged) {
          const token = randomUUID();
          pending.set(token, { goal, settings, state, interactionId, calls: calls.slice(index), doneResults: results, log, expires: Date.now() + confirmTtlMs });
          return {
            ok: false, executed: log.length > 0, verified: false, completed: false, outcome: 'BLOCKED',
            needsConfirmation: true, confirm_token: token,
            proposedAction: { name: call.name, intent: call.arguments?.intent || '' },
            explanation: safety.explanation || '',
            message: `Gemini wants to ${call.arguments?.intent || call.name} and asks for the owner's confirmation first (${safety.explanation || 'sensitive action'}). Ask the owner; if they agree, call screen_act again with this confirm_token.`,
            steps: log,
          };
        }
        const outcome = await perform(call, state, signal).catch(error => ({ ok: false, error: error.message }));
        if (POINTER_ACTIONS.has(call.name) && outcome?.ok !== false) {
          const front = await foreground(signal).catch(() => ({}));
          if (front.title) state.clickedWindow = front.title;
        }
        if (call.name === 'open_app' && outcome?.ok !== false) {
          const title = typeof outcome.window === 'string' ? outcome.window : outcome.window?.title;
          if (title) state.clickedWindow = title;
        }
        log.push({ action: call.name, intent: call.arguments?.intent || '', ok: outcome?.ok !== false, ...(outcome?.ok === false ? { error: outcome.error || outcome.message } : {}) });
        results.push({ call, outcome, acknowledged: Boolean(call.__acknowledged) });
      }

      const blocked = await excludedInFront(config, signal);
      if (blocked) {
        return { ok: false, executed: true, verified: false, completed: false, outcome: 'BLOCKED', error: 'excluded-app-in-front', message: `Stopped: ${blocked.app} is in front, so the screen is not sent to Gemini.`, steps: log };
      }
      const shot = await capture(signal);
      input = results.map(({ call, outcome, acknowledged }, i) => ({
        type: 'function_result', name: call.name, call_id: call.id,
        result: [
          { type: 'text', text: resultText(outcome, acknowledged ? { safety_acknowledgement: true } : {}) },
          ...(i === results.length - 1 ? [{ type: 'image', data: shot.base64, mime_type: shot.mimeType }] : []),
        ],
      }));
    }
    return { ok: false, executed: true, verified: false, completed: false, outcome: 'PARTIAL', error: 'step-limit', message: `Stopped after ${maxSteps} steps without finishing.`, steps: log };
  }

  return async function screenAct(params = {}, signal = null) {
    const settings = getSettings();
    if (!settings) {
      return { ok: false, executed: false, verified: false, completed: false, outcome: 'FAILED', error: 'screen-share-offline', message: 'Online screen share is off: add a Gemini provider and turn on Screen Share (Online) in Settings → Models. Use zero_computer_action and see_screen instead.' };
    }
    if (params.confirm_token) {
      const saved = pending.get(params.confirm_token);
      pending.delete(params.confirm_token);
      if (!saved || saved.expires < Date.now()) return { ok: false, executed: false, outcome: 'FAILED', error: 'confirm-token-expired', message: 'That confirmation has expired; start the task again.' };
      // Perform the confirmed action and any calls after it, then continue.
      const results = [...saved.doneResults];
      for (const [index, call] of saved.calls.entries()) {
        const acknowledged = index === 0;
        const outcome = await perform(call, saved.state, signal).catch(error => ({ ok: false, error: error.message }));
        saved.log.push({ action: call.name, intent: call.arguments?.intent || '', ok: outcome?.ok !== false, confirmedByOwner: acknowledged });
        results.push({ call, outcome, acknowledged });
      }
      const shot = await capture(signal);
      const input = results.map(({ call, outcome, acknowledged }, i) => ({
        type: 'function_result', name: call.name, call_id: call.id,
        result: [
          { type: 'text', text: resultText(outcome, acknowledged ? { safety_acknowledgement: true } : {}) },
          ...(i === results.length - 1 ? [{ type: 'image', data: shot.base64, mime_type: shot.mimeType }] : []),
        ],
      }));
      return run({ goal: saved.goal, settings: saved.settings, state: saved.state, interactionId: saved.interactionId, input, log: saved.log }, signal);
    }

    const goal = String(params.goal || '').trim();
    if (!goal) return { ok: false, executed: false, outcome: 'FAILED', error: 'missing-goal', message: 'screen_act needs `goal`: what to do on screen.' };
    const blocked = await excludedInFront(settings.config, signal);
    if (blocked) return { ok: false, executed: false, outcome: 'BLOCKED', error: 'excluded-app-in-front', message: `Not started: ${blocked.app} is in front, so the screen is not sent to Gemini.` };
    const { width, height } = await screenSize(signal);
    const shot = await capture(signal);
    const state = { width, height, clickedWindow: null };
    const input = [
      { type: 'text', text: instructions({ goal, width, height }) },
      { type: 'image', data: shot.base64, mime_type: shot.mimeType },
    ];
    return run({ goal, settings, state, interactionId: null, input, log: [] }, signal);
  };
}
