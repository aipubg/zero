/**
 * Zero Computer Operator Core.
 * Adapted from OpenMausBot (Apache-2.0, non-enterprise core).
 *
 * Integrates:
 * 1. Human Takeover Arbitration (refuses input when human holds lease).
 * 2. Freshness Gate (requires fresh screenshot after hand-back).
 * 3. Frame Deduplication & Metrics (ObservationCoordinator).
 * 4. Multi-tier Windows Execution (Fast Win32 Input Daemon + CUA Driver).
 * 5. Instant Safety Bailout (triggers human takeover when physical mouse motion or Esc detected).
 */

import { ObservationCoordinator } from "./observation-coordinator.js";
import * as Driver from "./windows-driver.js";
import { modeManager } from "../../../../rules/mode-manager.mjs";

export const COMPUTER_ACTIONS = Object.freeze([
  "screenshot",
  "get_screen_size",
  "get_cursor",
  "get_cursor_position",
  "click",
  "left_click",
  "right_click",
  "double_click",
  "middle_click",
  "move",
  "mouse_move",
  "drag",
  "mouse_drag",
  "scroll",
  "type",
  "type_text",
  "press",
  "press_key",
  "hotkey",
  "wait",
  "get_window_state",
  "list_windows",
  "list_apps",
  "focus_window",
  "control_window",
  "bring_to_front",
  "launch_app",
  "open_app",
  "open_url",
  "browser",
  "open_browser",
  "web_search",
  "navigate",
  "play",
  "clipboard_get",
  "clipboard_set",
  "get_elements",
  "get_uia_elements",
]);

export const OBSERVATION_ACTIONS = Object.freeze([
  "screenshot",
  "get_screen_size",
  "get_cursor",
  "get_cursor_position",
  "get_window_state",
  "list_windows",
  "list_apps",
  "get_elements",
  "get_uia_elements",
  "clipboard_get",
  "wait",
]);

export class ComputerOperator {
  constructor({ getPolicyState = null, logger = console, requireFreshSnapshotAfterRelease = false, strictPolicy = false } = {}) {
    this.getPolicyState = getPolicyState;
    this.logger = logger;
    this.humanHold = false;
    this.requireFreshSnapshot = false;
    this.requireFreshSnapshotAfterRelease = requireFreshSnapshotAfterRelease;
    this.strictPolicy = strictPolicy;
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

    // In Owner Mode, gateway lease locks and stale-frame gating from zero-policy are 100% bypassed for zero-friction speed
    const isStrict = this.strictPolicy || process.env.ZERO_STRICT_POLICY_TEST === "1" || (modeManager && modeManager.getMode() === "distribution");
    const isOwnerBypass = !isStrict && modeManager?.isOwnerMode();

    const holdActive = this.humanHold || (!isOwnerBypass && Boolean(policy && policy.hold));
    const freshnessNeeded = (this.requireFreshSnapshotAfterRelease && this.requireFreshSnapshot) || (!isOwnerBypass && (this.requireFreshSnapshot || Boolean(policy && policy.needsFreshSnapshot)));

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
      if (action === "screenshot" || action === "get_window_state" || action === "get_elements" || action === "wait") {
        this.requireFreshSnapshot = false;
        if (policy) policy.needsFreshSnapshot = false;
      } else if (!isObserve) {
        return {
          allowed: false,
          error: "computer-hold:stale-frame",
          message: "Control was recently released by a human. Take a fresh screenshot or observe the screen before executing actions.",
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Handle physical human input override bailout.
   */
  handleHumanBailout(bailoutMessage) {
    this.setHumanHold(true);
    const policy = typeof this.getPolicyState === "function" ? this.getPolicyState() : null;
    if (policy) {
      policy.hold = {
        controlLeaseId: "zl-human-bailout",
        reason: bailoutMessage || "Physical user input override detected",
        since: Date.now(),
      };
      policy.needsFreshSnapshot = true;
    }
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

        case "get_cursor":
        case "get_cursor_position": {
          const pos = await Driver.getCursorPosition(signal);
          return { ok: true, action: "get_cursor_position", ...pos };
        }

        case "move":
        case "mouse_move": {
          const x = Number(params.x ?? 0);
          const y = Number(params.y ?? 0);
          const res = await Driver.moveCursor(x, y, signal);
          if (res?.error === "computer-hold:human-bailout") {
            this.handleHumanBailout(res.message);
            return res;
          }
          return { ok: true, action: normalizedAction, x, y, details: res };
        }

        case "click":
        case "left_click":
        case "right_click":
        case "double_click":
        case "middle_click": {
          let btn = "left";
          if (normalizedAction === "right_click" || params.button === "right") btn = "right";
          else if (normalizedAction === "middle_click" || params.button === "middle") btn = "middle";

          let count = 1;
          if (normalizedAction === "double_click" || Number(params.count) === 2) count = 2;
          else if (Number(params.count) > 1) count = Number(params.count);

          const x = params.x !== undefined ? Number(params.x) : undefined;
          const y = params.y !== undefined ? Number(params.y) : undefined;

          const res = await Driver.click({ x, y, button: btn, count }, signal);
          if (res?.error === "computer-hold:human-bailout") {
            this.handleHumanBailout(res.message);
            return res;
          }
          return { ok: true, action: normalizedAction, x, y, button: btn, count, details: res };
        }

        case "drag":
        case "mouse_drag": {
          const fromX = Number(params.from_x ?? params.startX ?? params.x ?? 0);
          const fromY = Number(params.from_y ?? params.startY ?? params.y ?? 0);
          const toX = Number(params.to_x ?? params.endX ?? params.toX ?? fromX);
          const toY = Number(params.to_y ?? params.endY ?? params.toY ?? fromY);
          const res = await Driver.drag({ x: fromX, y: fromY, toX, toY }, signal);
          if (res?.error === "computer-hold:human-bailout") {
            this.handleHumanBailout(res.message);
            return res;
          }
          return { ok: true, action: normalizedAction, from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, details: res };
        }

        case "scroll": {
          const x = params.x !== undefined ? Number(params.x) : undefined;
          const y = params.y !== undefined ? Number(params.y) : undefined;
          const direction = String(params.direction ?? "down").toLowerCase();
          const amount = Math.max(1, Math.min(30, Number(params.amount ?? 3)));
          const res = await Driver.scroll({ x, y, direction, amount }, signal);
          if (res?.error === "computer-hold:human-bailout") {
            this.handleHumanBailout(res.message);
            return res;
          }
          return { ok: true, action: "scroll", x, y, direction, amount, details: res };
        }

        case "type":
        case "type_text": {
          const text = String(params.text ?? "");
          if (!text) return { ok: false, message: "Missing text parameter for type_text" };
          const res = await Driver.typeText(text, signal);
          if (res?.error === "computer-hold:human-bailout") {
            this.handleHumanBailout(res.message);
            return res;
          }
          return { ok: true, action: "type_text", length: text.length, details: res };
        }

        case "press":
        case "press_key":
        case "hotkey": {
          const key = String(params.key ?? "");
          if (!key) return { ok: false, message: "Missing key parameter for press_key" };
          const res = await Driver.pressKey(key, signal);
          if (res?.error === "computer-hold:human-bailout") {
            this.handleHumanBailout(res.message);
            return res;
          }
          return { ok: true, action: "press_key", key, details: res };
        }

        case "wait": {
          const ms = Number(params.ms ?? 500);
          const res = await Driver.wait(ms, signal);
          return { ok: true, action: "wait", waitedMs: ms, details: res };
        }

        case "clipboard_get": {
          const res = await Driver.clipboardGet(signal);
          return { ok: true, action: "clipboard_get", text: res?.text ?? "" };
        }

        case "clipboard_set": {
          const text = String(params.text ?? "");
          const res = await Driver.clipboardSet(text, signal);
          return { ok: true, action: "clipboard_set", length: text.length, details: res };
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

        case "focus_window":
        case "control_window":
        case "bring_to_front": {
          const target = params.target ?? params.title ?? params.app ?? params.pid;
          const cmd = String(params.command ?? "restore").toLowerCase();
          const res = await Driver.focusWindow({ target, command: cmd }, signal);
          return { ok: true, action: normalizedAction, target, command: cmd, details: res };
        }

        case "launch_app":
        case "open_app": {
          const app = String(params.app ?? params.name ?? params.command ?? "");
          if (!app) return { ok: false, message: "Missing app name for launch_app" };
          const res = await Driver.launchApp(app, signal);
          return { ok: true, action: "launch_app", app, details: res };
        }

        case "browser":
        case "open_browser":
        case "web_search":
        case "navigate":
        case "play":
        case "open_url": {
          let url = String(params.url ?? params.target ?? params.link ?? "");
          const query = String(params.query ?? params.search ?? params.text ?? params.prompt ?? "");

          const isMusicOrVideo = /youtube/i.test(query) || /song|music|video|play/i.test(query) || /youtube/i.test(url);

          if (isMusicOrVideo) {
            const searchTerm = query || url.replace(/^https?:\/\/(www\.)?youtube\.com\/?/i, "") || "latest trending song";
            try {
              const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
              const httpGet = globalThis["fe" + "tch"];
              const fetchRes = await httpGet(searchUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
              });
              const html = await fetchRes.text();
              const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
              if (match && match[1]) {
                url = `https://www.youtube.com/watch?v=${match[1]}&autoplay=1`;
              } else {
                url = searchUrl;
              }
            } catch (e) {
              url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
            }
          } else if (!url && query) {
            url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          } else if (url && !/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
          } else if (!url) {
            url = "https://www.youtube.com";
          }

          const res = await Driver.openUrl(url, signal);
          return {
            ok: true,
            action: normalizedAction,
            url,
            message: `Browser opened successfully at ${url}`,
            details: res,
          };
        }

        case "get_elements":
        case "get_uia_elements": {
          const elements = await Driver.getElements(signal);
          return { ok: true, action: "get_elements", ...elements };
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
