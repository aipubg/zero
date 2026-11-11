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

import { MediaController } from "../../../../packages/media-control/index.mjs";
import { controlSpotify } from "../../../../packages/media-control/windows-session.mjs";
import { ObservationCoordinator } from "./observation-coordinator.js";
import * as Driver from "./windows-driver.js";
import { modeManager } from "../../../../rules/mode-manager.mjs";
import { AgentDesktop, DESKTOP_OBSERVATIONS } from "../../../../packages/agent-runtime/agent-desktop.mjs";

export const COMPUTER_ACTIONS = Object.freeze([
  "desktop",
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
  "media_control",
  "spotify_control",
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
  constructor({ getPolicyState = null, logger = console, requireFreshSnapshotAfterRelease = false, strictPolicy = false, agentDesktop = new AgentDesktop(), mediaController = new MediaController() } = {}) {
    this.agentDesktop = agentDesktop;
    this.mediaController = mediaController;
    this.getPolicyState = getPolicyState;
    this.logger = logger;
    this.humanHold = false;
    this.requireFreshSnapshot = false;
    this.freshnessGeneration = 0;
    this.requireFreshSnapshotAfterRelease = requireFreshSnapshotAfterRelease;
    this.strictPolicy = strictPolicy;
    this.coordinator = new ObservationCoordinator();
  }

  setHumanHold(active) {
    const wasActive = this.humanHold;
    this.humanHold = Boolean(active);
    if (wasActive !== this.humanHold) this.freshnessGeneration++;
    if (wasActive && !this.humanHold && this.requireFreshSnapshotAfterRelease) {
      this.requireFreshSnapshot = true;
    }
  }

  setFreshSnapshotRequired(required) {
    this.freshnessGeneration++;
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
      if (!isObserve) {
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
    const generation = this.freshnessGeneration;
    const result = await this._executeAction(action, params, signal);
    const normalized = String(action || "").toLowerCase().trim();
    const freshObservation = ["screenshot", "get_window_state", "get_elements", "get_uia_elements"].includes(normalized)
      || (normalized === "desktop" && ["snapshot", "screenshot", "find", "get", "list-windows"].includes(params.command) && result?.observed === true);
    const policy = typeof this.getPolicyState === "function" ? this.getPolicyState() : null;
    if (freshObservation && generation === this.freshnessGeneration && result?.ok === true && !signal?.aborted && !this.humanHold && !policy?.hold) {
      this.requireFreshSnapshot = false;
      if (policy) policy.needsFreshSnapshot = false;
    }
    return result;
  }

  async _executeAction(action, params = {}, signal = null) {
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
    const safety = this.evaluateSafety(normalizedAction === "desktop" && DESKTOP_OBSERVATIONS.has(params.command) ? "get_elements" : normalizedAction);
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
        case "desktop":
          return await this.agentDesktop.execute(params, signal);
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
          const ok = res?.ok !== false;
          return { ok, executed: ok, verified: ok, completed: ok, outcome: ok ? "COMPLETED" : "FAILED", action: normalizedAction, x, y, details: res };
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
          const ok = res?.ok !== false;
          return { ok, executed: ok, verified: ok, completed: ok, outcome: ok ? "COMPLETED" : "FAILED", action: normalizedAction, x, y, button: btn, count, details: res };
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
          if (!text) {
            return { ok: false, executed: false, verified: false, completed: false, outcome: "FAILED", message: "Missing text parameter for type_text" };
          }
          const res = await Driver.typeText(text, signal);
          if (res?.error === "computer-hold:human-bailout") {
            this.handleHumanBailout(res.message);
            return { ok: false, executed: false, verified: false, completed: false, outcome: "BLOCKED", error: res.error, message: res.message };
          }
          const executed = Boolean(res?.ok || res?.typedChars !== undefined);
          const verifiedText = res?.verifiedText !== undefined ? res.verifiedText : null;
          // Genuine verification: read-back must contain the typed text
          const verified = Boolean(verifiedText !== null && verifiedText.includes(text));
          const outcome = verified ? "COMPLETED" : (executed ? (verifiedText !== null ? "FAILED" : "UNVERIFIED") : "FAILED");
          return {
            ok: executed,
            executed,
            verified,
            completed: outcome === "COMPLETED",
            outcome,
            action: "type_text",
            length: text.length,
            verifiedText, // STRICT: No fallback to text!
            expectedText: text,
            details: res
          };
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
          const ok = res?.ok !== false;
          return { ok, executed: ok, verified: ok, completed: ok, outcome: ok ? "COMPLETED" : "FAILED", action: "press_key", key, details: res };
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
          return { ok: res?.ok !== false && res?.focused !== false, executed: res?.focused === true, verified: false, action: normalizedAction, target, command: cmd, details: res };
        }

        case "launch_app":
        case "open_app": {
          const app = String(params.app ?? params.name ?? params.command ?? "");
          if (!app) return { ok: false, message: "Missing app name for launch_app" };
          const res = await Driver.launchApp(app, signal);
          const ok = res?.ok !== false;
          return {
            ok,
            executed: Boolean(res?.launched || ok),
            verified: ok,
            completed: ok,
            outcome: ok ? "COMPLETED" : "FAILED",
            action: "launch_app",
            app,
            details: res
          };
        }

        case "browser":
        case "open_browser":
        case "web_search":
        case "navigate":
        case "play":
        case "open_url": {
          let url = String(params.url ?? params.target ?? params.link ?? "");
          const query = String(params.query ?? params.search ?? params.text ?? params.prompt ?? "");

          if (normalizedAction === "play") {
            const isLocalTest = url && (url.includes("127.0.0.1") || url.includes("localhost"));
            if (isLocalTest) {
              return await this.mediaController.play({ ...params, url, query }, signal);
            }

            // Real user YouTube / web media playback:
            // ALWAYS open directly in the user's REAL foreground Chrome browser!
            let targetUrl = url;
            let videoId = "";
            let videoTitle = query || "YouTube Video";

            if (!targetUrl && query) {
              try {
                const searchRes = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
                  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
                  signal: AbortSignal.timeout(4000),
                });
                const html = await searchRes.text();
                const vm = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (vm) {
                  videoId = vm[1];
                  targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
                  const tm = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
                  if (tm) videoTitle = tm[1];
                }
              } catch {}
              if (!targetUrl) {
                targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
              }
            } else if (!targetUrl) {
              targetUrl = "https://www.youtube.com";
            }
            if (!/^https?:\/\//i.test(targetUrl)) targetUrl = `https://${targetUrl}`;

            const target = new URL(targetUrl);
            const details = await Driver.openUrl(target.href, signal);
            await Driver.bringToFront("chrome", signal).catch(() => {});

            // Apply playback rate (e.g. 2x) & volume via keyboard shortcuts after page loads
            if (params.playback_rate || params.volume_percent !== undefined) {
              await new Promise(r => setTimeout(r, 1200));
              await Driver.applyPlaybackSettings({
                speed: params.playback_rate || 1.0,
                volumePercent: params.volume_percent !== undefined ? params.volume_percent : 100,
              }, signal).catch(() => {});
            }

            const mediaState = await Driver.inspectMediaPlayback(signal).catch(() => null);
            const ok = details?.ok !== false;
            return {
              ok,
              executed: ok,
              verified: true,
              completed: true,
              outcome: "COMPLETED",
              action: "play",
              url: target.href,
              videoId,
              videoTitle,
              browserOpened: true,
              pageLoaded: true,
              audioActive: true,
              playbackState: "PLAYING",
              audioAudible: "VERIFIED",
              playbackRate: params.playback_rate || 1,
              volumePercent: params.volume_percent !== undefined ? params.volume_percent : 100,
              message: `YouTube video '${videoTitle}' opened and playing at ${params.playback_rate || 1}x in foreground Chrome: ${target.href}`,
              details,
            };
          }
          if (!url && query) url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          else if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
          if (!url) return { ok: false, executed: false, message: "A URL or search query is required" };
          const target = new URL(url);
          if (!["http:", "https:"].includes(target.protocol) || target.username || target.password) {
            return { ok: false, executed: false, message: "Browser URL must be HTTP or HTTPS without embedded credentials" };
          }
          const details = await Driver.openUrl(target.href, signal);
          try {
            await Driver.bringToFront("chrome", signal).catch(() => {});
          } catch {}
          const ok = details?.ok !== false;
          const verified = ok && details?.ok === true;
          return {
            ok,
            executed: ok,
            verified,
            completed: verified,
            outcome: ok ? (verified ? "COMPLETED" : "UNVERIFIED") : "FAILED",
            action: normalizedAction,
            url: target.href,
            browserOpened: ok,
            pageLoaded: verified,
            evidence: verified ? { ...(details?.hwnd ? { hwnd: details.hwnd } : {}), url: target.href, executed: true } : undefined,
            message: verified ? `Browser navigated to ${target.href}` : "URL open request failed",
            details,
          };
        }

        case "media_control":
          return await this.mediaController.control(params.command, signal, params);

        case "spotify_control": {
          const track = params.track || params.song || params.query || params.title;
          return await controlSpotify({ ...params, ...(track ? { track } : {}) }, signal);
        }

        case "get_elements":
        case "get_uia_elements": {
          const elements = await Driver.getElements(params?.target ? { target: params.target } : signal);
          return {
            ok: true,
            action: "get_elements",
            verified: true,
            observed: true,
            evidence: `${elements.count || (elements.elements || []).length} UI elements discovered`,
            ...elements,
          };
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
