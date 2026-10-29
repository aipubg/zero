/**
 * Zero Computer Operator Core.
 * Adapted from OpenMausBot (Apache-2.0, non-enterprise core).
 *
 * Integrates:
 * 1. Human Takeover Arbitration (refuses input when human holds lease).
 * 2. Freshness Gate (requires screenshot after hand-back).
 * 3. Frame Deduplication & Metrics (ObservationCoordinator).
 * 4. Multi-tier Windows Execution (CUA Driver + Native Fallback).
 */

import { ObservationCoordinator } from "./observation-coordinator.js";
import * as Driver from "./windows-driver.js";

export const COMPUTER_ACTIONS = Object.freeze([
  "screenshot",
  "get_screen_size",
  "get_cursor_position",
  "click",
  "move",
  "drag",
  "scroll",
  "type_text",
  "press_key",
  "get_window_state",
  "list_windows",
  "list_apps",
  "launch_app",
  "open_url",
  "bring_to_front",
]);

export const OBSERVATION_ACTIONS = Object.freeze([
  "screenshot",
  "get_screen_size",
  "get_cursor_position",
  "get_window_state",
  "list_windows",
  "list_apps",
]);

export class ComputerOperator {
  constructor({ getPolicyState = null, logger = console, requireFreshSnapshotAfterRelease = false } = {}) {
    this.getPolicyState = getPolicyState;
    this.logger = logger;
    this.humanHold = false;
    this.requireFreshSnapshot = false;
    this.requireFreshSnapshotAfterRelease = requireFreshSnapshotAfterRelease;
    this.coordinator = new ObservationCoordinator();
  }

  setHumanHold(active) {
    const wasActive = this.humanHold;
    this.humanHold = Boolean(active);
    if (wasActive && !this.humanHold && this.requireFreshSnapshotAfterRelease) {
      this.requireFreshSnapshot = true;
    }
  }

  setFreshSnapshotRequired(required) {
    this.requireFreshSnapshot = Boolean(required);
  }

  /**
   * Check whether an action is allowed given current takeover and freshness policies.
   */
  evaluateSafety(action) {
    const isObserve = OBSERVATION_ACTIONS.includes(action);
    const policy = typeof this.getPolicyState === "function" ? this.getPolicyState() : null;

    const holdActive = this.humanHold || (policy && policy.hold);
    const freshnessNeeded = this.requireFreshSnapshot || (policy && policy.needsFreshSnapshot);

    // 1. Human takeover hold active: refuse all input actions
    if (holdActive && !isObserve) {
      return {
        allowed: false,
        error: "computer-hold:human-control",
        message: "Human is currently operating the computer. Agent actions are paused.",
      };
    }

    // 2. Post-handover freshness gate: require a fresh screenshot before taking input
    if (freshnessNeeded) {
      if (action === "screenshot" || action === "get_window_state") {
        this.requireFreshSnapshot = false;
        if (policy) policy.needsFreshSnapshot = false;
      } else if (!isObserve) {
        return {
          allowed: false,
          error: "computer-hold:stale-frame",
          message: "Control was recently released by a human. Take a fresh screenshot before executing actions.",
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Main entrypoint for computer tool executions.
   */
  async execute(action, params = {}, signal = null) {
    signal?.throwIfAborted?.();
    const normalizedAction = String(action || "").toLowerCase().trim();

    if (!COMPUTER_ACTIONS.includes(normalizedAction)) {
      return {
        ok: false,
        error: "zero-computer:unknown-action",
        message: `Unknown action '${normalizedAction}'. Allowed actions: ${COMPUTER_ACTIONS.join(", ")}`,
      };
    }

    // Evaluate safety against human hold and freshness
    const safety = this.evaluateSafety(normalizedAction);
    if (!safety.allowed) {
      return {
        ok: false,
        error: safety.error,
        message: safety.message,
      };
    }

    this.coordinator.noteAction(1);

    try {
      switch (normalizedAction) {
        case "screenshot": {
          const shot = await Driver.captureScreen({
            format: params.format ?? "png",
            maxWidth: params.max_width ?? 1600,
          }, signal);

          const { changed, hash } = this.coordinator.observeFrame(shot.base64);
          return {
            ok: true,
            action: "screenshot",
            mimeType: shot.mimeType,
            data: shot.base64,
            bytes: shot.bytes,
            hash,
            isNewFrame: changed,
            width: shot.width,
            height: shot.height,
            notice: shot.notice,
          };
        }

        case "get_screen_size": {
          const size = await Driver.getScreenSize(signal);
          return { ok: true, action: "get_screen_size", ...size };
        }

        case "get_cursor_position": {
          const pos = await Driver.getCursorPosition(signal);
          return { ok: true, action: "get_cursor_position", ...pos };
        }

        case "click": {
          const x = Number(params.x ?? 0);
          const y = Number(params.y ?? 0);
          const button = String(params.button ?? "left").toLowerCase();
          const count = Math.max(1, Math.min(3, Number(params.count ?? 1)));
          const res = await Driver.click({ x, y, button, count }, signal);
          return { ok: true, action: "click", x, y, button, count, details: res };
        }

        case "move": {
          const x = Number(params.x ?? 0);
          const y = Number(params.y ?? 0);
          const res = await Driver.moveCursor(x, y, signal);
          return { ok: true, action: "move", x, y, details: res };
        }

        case "drag": {
          const x = Number(params.x ?? 0);
          const y = Number(params.y ?? 0);
          const toX = Number(params.to_x ?? params.toX ?? x);
          const toY = Number(params.to_y ?? params.toY ?? y);
          const res = await Driver.drag({ x, y, toX, toY }, signal);
          return { ok: true, action: "drag", from: { x, y }, to: { x: toX, y: toY }, details: res };
        }

        case "scroll": {
          const x = Number(params.x ?? 0);
          const y = Number(params.y ?? 0);
          const direction = String(params.direction ?? "down").toLowerCase();
          const amount = Math.max(1, Math.min(30, Number(params.amount ?? 3)));
          const res = await Driver.scroll({ x, y, direction, amount }, signal);
          return { ok: true, action: "scroll", x, y, direction, amount, details: res };
        }

        case "type_text": {
          const text = String(params.text ?? "");
          if (!text) return { ok: false, message: "Missing text parameter for type_text" };
          const res = await Driver.typeText(text, signal);
          return { ok: true, action: "type_text", length: text.length, details: res };
        }

        case "press_key": {
          const key = String(params.key ?? "");
          if (!key) return { ok: false, message: "Missing key parameter for press_key" };
          const res = await Driver.pressKey(key, signal);
          return { ok: true, action: "press_key", key, details: res };
        }

        case "get_window_state": {
          const state = await Driver.getWindowState(signal);
          return { ok: true, action: "get_window_state", window: state };
        }

        case "list_windows": {
          const windows = await Driver.listWindows(signal);
          return { ok: true, action: "list_windows", ...windows };
        }

        case "list_apps": {
          const apps = await Driver.listApps(signal);
          return { ok: true, action: "list_apps", ...apps };
        }

        case "launch_app": {
          const app = String(params.app ?? params.name ?? params.command ?? "");
          if (!app) return { ok: false, message: "Missing app name for launch_app" };
          const res = await Driver.launchApp(app, signal);
          return { ok: true, action: "launch_app", app, details: res };
        }

        case "open_url": {
          const url = String(params.url ?? "");
          if (!url || !/^https?:\/\//i.test(url)) {
            return { ok: false, message: "Missing or invalid http/https URL for open_url" };
          }
          const res = await Driver.openUrl(url, signal);
          return { ok: true, action: "open_url", url, details: res };
        }

        case "bring_to_front": {
          const target = params.target ?? params.app ?? params.pid;
          const res = await Driver.bringToFront(target, signal);
          return { ok: true, action: "bring_to_front", target, details: res };
        }

        default:
          return { ok: false, message: `Action '${normalizedAction}' not implemented.` };
      }
    } catch (error) {
      this.logger?.error?.(`[ComputerOperator] ${normalizedAction} failed:`, error);
      return {
        ok: false,
        error: "zero-computer:execution-failed",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getMetrics() {
    return { ...this.coordinator.metrics };
  }
}
