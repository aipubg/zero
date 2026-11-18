/**
 * Keyboard destination rule.
 *
 * Within one request (a chat turn, a live screen-share session step, a
 * screen_act run), keyboard input is only sent to a window that was named
 * in the call, or to one Zero itself opened, focused or drove in its browser
 * earlier in the same request. It is never sent to "whatever is in front":
 * that window is the owner's, and a stray Alt+F4 or text there cannot be
 * taken back.
 *
 * A scope is created per request and passed to every tool call of that
 * request. Direct owner-invoked tool calls without a scope are the owner's
 * own choice and are not limited by this rule.
 */

import { defaultOsController } from './computer-control.mjs';

export const KEYBOARD_ACTIONS = Object.freeze(new Set(['type_text', 'type', 'press_key', 'press', 'key', 'hotkey', 'key_down', 'key_up']));
const WINDOW_ACTIONS = new Set(['open_app', 'launch_app', 'focus_window', 'control_window', 'bring_to_front', 'set_window_bounds', 'move_window', 'resize_window', 'snap_window']);

const refusal = (action, error, message) => ({
  ok: false, executed: false, verified: false, completed: false, outcome: 'FAILED', action, error, message,
});

export class KeyboardTargetScope {
  constructor({ osController = defaultOsController } = {}) {
    this.osController = osController;
    this.window = null;
  }

  /** The window keystrokes in this request go to, if one is known. */
  get currentWindow() {
    return this.window;
  }

  /**
   * Check a call before it runs. Returns `{ refusal }` when it must not run,
   * otherwise `{ args }` with the destination filled in.
   *
   * @param {{ action: string, args: object, capability?: string, ownHandler?: boolean, signal?: AbortSignal }} call
   */
  async before({ action, args = {}, capability = 'zero_computer_action', ownHandler = false, signal = null }) {
    if (ownHandler || capability === 'browser' || !KEYBOARD_ACTIONS.has(action)) return { args };
    const next = { ...args };
    const named = next.target || next.app || next.window || next.window_title || null;
    const hasPoint = next.x !== undefined && next.y !== undefined;
    if (!named && !hasPoint) {
      if (!this.window) {
        const active = await this.osController.getActiveWindow(signal).catch(error => ({ ok: false, error: error.message }));
        const title = active?.title || active?.window?.title || active?.data?.window?.title || null;
        if (!title) {
          return { refusal: refusal(action, 'keyboard-target-required', `${action} was not sent: no active foreground window could be resolved. Open or focus a destination window first.`) };
        }
        this.window = String(title);
      }
      next.target = this.window;
    }
    // Typing focuses its own destination; keys and hotkeys need it in front first.
    if (!['type_text', 'type'].includes(action) && (next.target || next.app)) {
      const focus = await this.osController.focusWindow(String(next.target || next.app), 'restore', signal).catch(error => ({ ok: false, error: error.message }));
      if (focus?.ok === false) {
        return { refusal: refusal(action, 'focus-failed', `${action} was not sent: ${focus.error || 'the destination window could not be brought to the front'}.`) };
      }
    }
    return { args: next };
  }

  /** Learn from a finished call which window Zero put in front. */
  after({ action, args = {}, capability = 'zero_computer_action', result }) {
    if (!result || result.ok !== true) return;
    if (capability === 'browser') {
      const pageTitle = result.title || result.pageTitle || result.videoTitle || null;
      if (pageTitle) this.window = String(pageTitle);
      return;
    }
    if (!WINDOW_ACTIONS.has(action)) return;
    if (['minimize', 'close'].includes(String(args.command || '').toLowerCase())) return;
    const title = (typeof result.window === 'string' ? result.window : result.window?.title)
      || result.data?.window?.title || result.details?.title || null;
    if (title) this.window = String(title);
  }
}
