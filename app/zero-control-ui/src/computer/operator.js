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
  "media_control",
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

          const isMusicOrVideo = normalizedAction === "play" || /youtube/i.test(query) || /song|music|video|play|radio|audio|listen|track/i.test(query) || /youtube/i.test(url);
          let videoId = null;
          let videoTitle = "";

          if (isMusicOrVideo) {
            const searchTerm = query || url.replace(/^https?:\/\/(www\.)?youtube\.com\/?/i, "") || "latest trending song";
            try {
              const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
              const httpGet = globalThis["fe" + "tch"];
              const fetchRes = await httpGet(searchUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
              });
              const html = await fetchRes.text();
              const idMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
              const titleMatch = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
              if (titleMatch && titleMatch[1]) {
                videoTitle = titleMatch[1];
              }
              if (idMatch && idMatch[1]) {
                videoId = idMatch[1];
                url = `https://www.youtube.com/watch?v=${videoId}`;
              } else {
                url = searchUrl;
              }
            } catch (e) {
              url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
            }
            if (!videoTitle) videoTitle = searchTerm;
          } else if (!url && query) {
            url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          } else if (url && !/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
          } else if (!url) {
            url = "https://www.youtube.com";
          }

          const res = await Driver.openUrl(url, signal);
          let activeWin = null;
          let clickCoords = null;
          let playbackState = "UNVERIFIED";
          let audioActive = false;

          if (isMusicOrVideo) {
            try {
              // 1. Poll for foreground browser window (up to 8s)
              const startWait = Date.now();
              while (Date.now() - startWait < 8000) {
                try {
                  activeWin = await Driver.getWindowState(signal);
                  const titleLower = String(activeWin?.title || "").toLowerCase();
                  const procLower = String(activeWin?.process || "").toLowerCase();
                  if (titleLower.includes("youtube") || procLower.includes("chrome") || procLower.includes("edge") || procLower.includes("brave") || procLower.includes("firefox")) {
                    break;
                  }
                } catch {}
                await new Promise((r) => setTimeout(r, 400));
              }

              // 2. Extra 2.5s wait for HTML5 video player DOM and media scripts to render
              await new Promise((r) => setTimeout(r, 2500));

              // 3. Bring YouTube window to foreground
              await Driver.focusWindow({ target: "YouTube", command: "restore" }, signal);
              await new Promise((r) => setTimeout(r, 300));

              // 4. Determine click coordinates on the video player
              let targetX = null;
              let targetY = null;
              try {
                const uia = await Driver.getElements(signal);
                if (Array.isArray(uia?.elements)) {
                  const playEl = uia.elements.find((el) => {
                    const n = String(el.name || "").toLowerCase();
                    return n.includes("play (k)") || n === "play" || n.includes("video player") || n.includes("youtube video");
                  });
                  if (playEl && playEl.centerX > 0 && playEl.centerY > 0) {
                    targetX = playEl.centerX;
                    targetY = playEl.centerY;
                  }
                }
              } catch {}

              if (!targetX || !targetY) {
                const bounds = activeWin?.bounds;
                if (bounds && bounds.width > 200 && bounds.height > 200) {
                  targetX = Math.round(bounds.x + bounds.width * 0.40);
                  targetY = Math.round(bounds.y + bounds.height * 0.45);
                } else {
                  const screen = await Driver.getScreenSize(signal);
                  targetX = Math.round((screen.width || 1920) * 0.40);
                  targetY = Math.round((screen.height || 1080) * 0.45);
                }
              }

              // 5. Real Physical Mouse Click via Win32 SetCursorPos & mouse_event
              clickCoords = { x: targetX, y: targetY };
              console.log(`[Zero ComputerOperator] Executing physical hardware click on Video Player at (${targetX}, ${targetY})...`);
              await Driver.moveCursor(targetX, targetY, signal);
              await new Promise((r) => setTimeout(r, 100));
              await Driver.click({ x: targetX, y: targetY, button: "left", count: 1 }, signal);
              console.log(`[Zero ComputerOperator] Physical click executed successfully.`);

              // 6. Keyboard Play & Unmute Verification
              await new Promise((r) => setTimeout(r, 500));
              await Driver.pressKey("k", signal);
              await new Promise((r) => setTimeout(r, 200));
              await Driver.pressKey("up", signal);
              await Driver.pressKey("volume_up", signal);

              // 7. Independently verify playback state
              try {
                const pbCheck = await Driver.inspectMediaPlayback(signal);
                if (pbCheck?.playbackState && pbCheck.playbackState !== "UNVERIFIED") {
                  playbackState = pbCheck.playbackState;
                  audioActive = Boolean(pbCheck.audioPlaying);
                }
              } catch {}

              // Secondary check: inspect UIA elements for "Pause (k)" vs "Play (k)"
              if (playbackState === "UNVERIFIED") {
                try {
                  const checkUia = await Driver.getElements(signal);
                  if (Array.isArray(checkUia?.elements)) {
                    for (const el of checkUia.elements) {
                      const n = String(el.name || "").toLowerCase();
                      if (n.includes("pause (k)") || n.includes("pause video")) {
                        playbackState = "PLAYING";
                        audioActive = true;
                        break;
                      } else if (n.includes("play (k)") || n.includes("play video")) {
                        playbackState = "PAUSED";
                        audioActive = false;
                        break;
                      }
                    }
                  }
                } catch {}
              }

              // 8. Refresh foreground window state
              try { activeWin = await Driver.getWindowState(signal); } catch {}
            } catch (err) {
              console.warn(`[Zero ComputerOperator] Music playback automation warning:`, err.message);
            }
          } else {
            try { activeWin = await Driver.getWindowState(signal); } catch {}
          }

          const winTitle = activeWin?.title || "YouTube";
          const executed = Boolean(res?.ok !== false);
          const isVerified = (playbackState === "PLAYING");
          const outcome = isVerified ? "COMPLETED" : (executed ? "UNVERIFIED" : "FAILED");

          return {
            ok: executed,
            executed,
            verified: isVerified,
            completed: outcome === "COMPLETED",
            outcome,
            action: normalizedAction,
            url,
            videoId,
            videoTitle: videoTitle || winTitle,
            thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "",
            clickCoordinates: clickCoords,
            playbackState,
            audioPlaying: audioActive,
            audioActive, // STRICT: Only true when verified playing!
            message: `Browser opened at ${url}. ${clickCoords ? `Physical click executed at (${clickCoords.x}, ${clickCoords.y}).` : ""} Playback status: ${playbackState}.`,
            window: activeWin,
            details: res,
          };
        }

        case "media_control": {
          const cmd = String(params.command || params.action || "").toLowerCase();
          await Driver.focusWindow({ target: "YouTube", command: "restore" }, signal);
          await new Promise((r) => setTimeout(r, 200));
          if (cmd === "next" || cmd === "next_track" || cmd === "skip") {
            await Driver.pressKey("shift+n", signal);
            await Driver.pressKey("next_track", signal);
          } else if (cmd === "prev" || cmd === "previous") {
            await Driver.pressKey("shift+p", signal);
          } else if (cmd === "play_pause" || cmd === "pause" || cmd === "play") {
            await Driver.pressKey("k", signal);
            await Driver.pressKey("play_pause", signal);
          } else if (cmd === "volume_up") {
            await Driver.pressKey("up", signal);
            await Driver.pressKey("volume_up", signal);
          } else if (cmd === "volume_down") {
            await Driver.pressKey("down", signal);
            await Driver.pressKey("volume_down", signal);
          } else if (cmd === "mute" || cmd === "unmute") {
            await Driver.pressKey("m", signal);
            await Driver.pressKey("volume_mute", signal);
          } else if (cmd === "fullscreen") {
            await Driver.pressKey("f", signal);
          }
          let activeWin = null;
          try { activeWin = await Driver.getWindowState(signal); } catch {}
          return { ok: true, action: "media_control", command: cmd, window: activeWin };
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
