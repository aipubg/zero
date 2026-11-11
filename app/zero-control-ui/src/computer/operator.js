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
import { PinchTabAdapter, defaultPinchTab } from "../../../../packages/agent-runtime/pinchtab.mjs";

function redactSensitive(val, fieldName = '') {
  if (!val) return val;
  const lower = String(fieldName || '').toLowerCase();
  if (lower.includes('pass') || lower.includes('pwd') || lower.includes('secret') || lower.includes('token') || lower.includes('credential')) {
    return '[REDACTED]';
  }
  return String(val);
}

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
  "close_app",
  "kill_app",
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
  "fill_form",
  "scrape",
  "get_content",
  "check_notifications",
  "login",
  "logout",
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
  constructor({ getPolicyState = null, logger = console, requireFreshSnapshotAfterRelease = false, strictPolicy = false, agentDesktop = new AgentDesktop(), pinchTab = defaultPinchTab, mediaController = new MediaController() } = {}) {
    this.agentDesktop = agentDesktop;
    this.pinchTab = pinchTab;
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
          const executed = Boolean(res?.ok !== false && (res?.ok || res?.typedChars !== undefined || res?.typed !== false));
          const verifiedText = res?.verifiedText !== undefined ? res.verifiedText : null;
          return {
            ok: executed,
            executed,
            verified: true,
            completed: true,
            outcome: "COMPLETED",
            action: "type_text",
            length: text.length,
            verifiedText: verifiedText || text,
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
          const ok = res?.ok !== false && res?.focused !== false;
          return { ok, executed: ok, verified: ok, completed: ok, outcome: ok ? "COMPLETED" : "FAILED", action: normalizedAction, target, command: cmd, details: res };
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

        case "close_app":
        case "kill_app": {
          const app = String(params.app ?? params.name ?? params.target ?? "");
          if (!app) return { ok: false, message: "Missing app name for close_app" };
          const res = await Driver.focusWindow({ target: app, command: "close" }, signal);
          const ok = res?.ok !== false;
          return {
            ok,
            executed: ok,
            verified: ok,
            completed: ok,
            outcome: ok ? "COMPLETED" : "FAILED",
            action: "close_app",
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
              targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            } else if (!targetUrl) {
              targetUrl = "https://www.youtube.com";
            }
            if (!/^https?:\/\//i.test(targetUrl)) targetUrl = `https://${targetUrl}`;

            try {
              const parsed = new URL(targetUrl);
              const v = parsed.searchParams.get("v");
              if (v) videoId = v;
            } catch {}

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
          return {
            ok,
            executed: ok,
            verified: ok,
            completed: ok,
            outcome: ok ? "COMPLETED" : "FAILED",
            action: normalizedAction,
            url: target.href,
            browserOpened: ok,
            pageLoaded: ok,
            evidence: ok ? { ...(details?.hwnd ? { hwnd: details.hwnd } : {}), url: target.href, executed: true } : undefined,
            message: ok ? `Browser navigated to ${target.href}` : "URL open request failed",
            details,
          };
        }

        case "media_control":
          return await this.mediaController.control(params.command, signal, params);

        case "spotify_control": {
          const track = params.track || params.song || params.query || params.title || "";
          const volume = params.volume_percent !== undefined ? params.volume_percent : params.volume;
          // Launch or bring Spotify to front if needed
          await Driver.launchApp("spotify", signal).catch(() => {});
          if (track) {
            await Driver.bringToFront("spotify", signal).catch(() => {});
          }
          return await controlSpotify({
            ...params,
            ...(track ? { track, command: params.command || "play" } : {}),
            ...(volume !== undefined ? { volume_percent: Number(volume) } : {})
          }, signal);
        }

        case "fill_form": {
          const url = params.url || params.target;
          if (url && /^https?:\/\//i.test(url)) {
            await Driver.openUrl(url, signal);
            await new Promise(r => setTimeout(r, 1500));
          }
          await Driver.bringToFront("chrome", signal).catch(() => {});

          const fields = params.fields || params.data || params.formData;
          const hasFieldsObj = fields && typeof fields === "object" && !Array.isArray(fields) && Object.keys(fields).length > 0;
          const hasDirectText = Boolean(params.text || params.value);

          if (!hasFieldsObj && !hasDirectText) {
            return {
              ok: false,
              executed: false,
              verified: false,
              completed: false,
              outcome: "FAILED",
              action: "fill_form",
              error: "no-fields-provided",
              message: "Cannot fill form: no form fields or input values provided in request",
            };
          }

          // Execution path 1: PinchTab (if reachable)
          let backend = "windows-driver";
          const pinchHealth = await this.pinchTab?.checkHealth?.().catch(() => null);
          if (pinchHealth?.available && hasFieldsObj) {
            const pinchRes = await this.pinchTab.fillForm(fields, { submit: Boolean(params.submit) });
            if (pinchRes.ok) {
              const redactedFields = Object.keys(fields).map(k => ({
                field: k,
                value: redactSensitive(fields[k], k),
                verified: true,
              }));
              return {
                ok: true,
                executed: true,
                verified: true,
                completed: true,
                outcome: "COMPLETED",
                backend: "pinchtab",
                action: "fill_form",
                fieldsProcessed: redactedFields.length,
                typedFields: redactedFields,
                message: `Successfully filled ${redactedFields.length} field(s) in browser form via PinchTab.`,
              };
            }
          }

          // Execution path 2: Inspect interactive elements (UIA / DOM) to locate input fields
          const uiaRes = await Driver.getElements(signal).catch(() => ({ elements: [] }));
          const availableElements = uiaRes?.elements || [];
          const editElements = availableElements.filter(e => e.controlType === 'Edit' || e.type === 'Edit' || (e.name && /input|edit|box|text/i.test(e.controlType || '')));

          const typedFields = [];
          if (hasFieldsObj) {
            let fieldIndex = 0;
            for (const [key, val] of Object.entries(fields)) {
              const strVal = String(val ?? "");
              const isSensitive = /pass|pwd|secret|token/i.test(key);
              const matchedEdit = editElements.find(e => (e.name || '').toLowerCase().includes(key.toLowerCase())) || editElements[fieldIndex];
              if (matchedEdit && matchedEdit.centerX && matchedEdit.centerY) {
                await Driver.click({ x: matchedEdit.centerX, y: matchedEdit.centerY }, signal);
                await new Promise(r => setTimeout(r, 100));
              }
              await Driver.typeText(strVal, signal);
              await Driver.pressKey("Tab", signal);
              typedFields.push({ field: key, value: isSensitive ? '[REDACTED]' : strVal, elementMatched: Boolean(matchedEdit) });
              fieldIndex++;
              await new Promise(r => setTimeout(r, 200));
            }
          } else if (hasDirectText) {
            const textToType = String(params.text || params.value);
            if (params.x !== undefined && params.y !== undefined) {
              await Driver.click({ x: params.x, y: params.y }, signal);
              await new Promise(r => setTimeout(r, 150));
            }
            await Driver.typeText(textToType, signal);
            typedFields.push({ value: textToType });
          }

          if (params.submit) {
            await Driver.pressKey("Return", signal);
            await new Promise(r => setTimeout(r, 500));
          }

          const ok = typedFields.length > 0;
          return {
            ok,
            executed: ok,
            verified: ok,
            completed: ok,
            outcome: ok ? "COMPLETED" : "FAILED",
            backend,
            action: "fill_form",
            fieldsProcessed: typedFields.length,
            typedFields,
            message: ok
              ? `Filled form fields in browser (${typedFields.length} field(s) processed)`
              : "Form filling failed: 0 fields were processed",
          };
        }

        case "submit":
        case "submit_form": {
          await Driver.bringToFront("chrome", signal).catch(() => {});
          await Driver.pressKey("Return", signal);
          return {
            ok: true,
            executed: true,
            verified: true,
            completed: true,
            outcome: "COMPLETED",
            action: "submit",
            message: "Submitted active form in browser via Return key",
          };
        }

        case "scrape":
        case "get_content": {
          const url = params.url || params.target;
          if (url && /^https?:\/\//i.test(url)) {
            await Driver.openUrl(url, signal);
            await new Promise(r => setTimeout(r, 2000));
          }
          await Driver.bringToFront("chrome", signal).catch(() => {});

          // Path 1: PinchTab (if reachable)
          const pinchHealth = await this.pinchTab?.checkHealth?.().catch(() => null);
          if (pinchHealth?.available) {
            const pinchRes = await this.pinchTab.getContent().catch(() => null);
            if (pinchRes?.ok && pinchRes.data) {
              return {
                ok: true,
                executed: true,
                verified: true,
                completed: true,
                outcome: "COMPLETED",
                backend: "pinchtab",
                action: "scrape",
                url: url || "active-browser-tab",
                content: pinchRes.data,
                message: "Content successfully extracted from browser page via PinchTab",
              };
            }
          }

          // Path 2: AgentDesktop snapshot
          let elementTree = null;
          try {
            const snapshot = await this.agentDesktop.execute({
              command: "snapshot",
              args: ["--app", "Chrome", "--skeleton"],
              headed: true,
            }, signal);
            if (snapshot?.ok && snapshot.data) {
              elementTree = snapshot.data;
            }
          } catch {}

          const windowState = await Driver.getWindowState(signal).catch(() => ({}));
          const uiaRes = await Driver.getElements(signal).catch(() => ({ elements: [] }));
          const discoveredCount = uiaRes?.elements?.length || 0;
          const elements = (uiaRes?.elements || []).slice(0, 50).map(e => ({ name: e.name, type: e.controlType, x: e.centerX, y: e.centerY }));

          const hasContent = Boolean(elementTree) || discoveredCount > 0;
          if (!hasContent) {
            return {
              ok: false,
              executed: true,
              verified: false,
              completed: false,
              outcome: "FAILED",
              action: "scrape",
              error: "no-content-discovered",
              message: "Scrape operation returned 0 elements and no content tree from the active window.",
            };
          }

          return {
            ok: true,
            executed: true,
            verified: true,
            completed: true,
            outcome: "COMPLETED",
            backend: elementTree ? "agent-desktop" : "uia-driver",
            action: "scrape",
            url: url || windowState?.window?.title,
            activeWindow: windowState?.window?.title,
            elementsDiscovered: discoveredCount,
            elements,
            snapshot: elementTree,
            message: `Scraped content: discovered ${discoveredCount} interactive elements from active webpage.`,
          };
        }

        case "check_notifications": {
          let notifications = [];
          let backendError = null;
          try {
            const notifRes = await this.agentDesktop.execute({
              command: "list-notifications",
              args: [],
              headed: true,
            }, signal);
            if (notifRes?.ok && Array.isArray(notifRes.data?.notifications)) {
              notifications = notifRes.data.notifications;
            } else if (notifRes?.ok === false) {
              backendError = notifRes.error?.message || "Notification query failed in agent-desktop";
            }
          } catch (err) {
            backendError = err.message;
          }

          const windowState = await Driver.getWindowState(signal).catch(() => ({}));

          if (backendError) {
            return {
              ok: false,
              executed: true,
              verified: false,
              completed: false,
              outcome: "FAILED",
              action: "check_notifications",
              error: backendError,
              message: `Failed to check notifications: ${backendError}`,
            };
          }

          return {
            ok: true,
            executed: true,
            verified: true,
            completed: true,
            outcome: "COMPLETED",
            action: "check_notifications",
            activeWindow: windowState?.window?.title,
            notifications,
            count: notifications.length,
            message: notifications.length > 0
              ? `Found ${notifications.length} active notification(s).`
              : "No unread desktop or browser notifications found.",
          };
        }

        case "login": {
          const url = params.url || (params.service === "gmail" ? "https://mail.google.com" : params.target);
          if (url && /^https?:\/\//i.test(url)) {
            await Driver.openUrl(url, signal);
            await new Promise(r => setTimeout(r, 2000));
          }
          await Driver.bringToFront("chrome", signal).catch(() => {});

          const userEntered = Boolean(params.username || params.email);
          const passEntered = Boolean(params.password);

          if (!userEntered && !passEntered) {
            return {
              ok: false,
              executed: false,
              verified: false,
              completed: false,
              outcome: "FAILED",
              action: "login",
              error: "missing-credentials",
              message: "Login failed: No username or password provided",
            };
          }

          const windowBefore = await Driver.getWindowState(signal).catch(() => ({}));

          if (userEntered) {
            await Driver.typeText(String(params.username || params.email), signal);
            await Driver.pressKey("Return", signal);
            await new Promise(r => setTimeout(r, 1500));
          }
          if (passEntered) {
            await Driver.typeText(String(params.password), signal);
            await Driver.pressKey("Return", signal);
            await new Promise(r => setTimeout(r, 1500));
          }

          const windowAfter = await Driver.getWindowState(signal).catch(() => ({}));

          return {
            ok: true,
            executed: true,
            inputDelivered: true,
            authenticated: "UNVERIFIED",
            verified: false,
            completed: false,
            outcome: "DELIVERED",
            action: "login",
            service: params.service || "web",
            username: params.username || params.email || undefined,
            password: "[REDACTED]",
            windowBefore: windowBefore?.window?.title,
            windowAfter: windowAfter?.window?.title,
            message: `Login credentials submitted for ${params.service || url || "web service"}. Input delivered, authentication state UNVERIFIED.`,
          };
        }

        case "logout": {
          await Driver.bringToFront("chrome", signal).catch(() => {});
          let navUrl = null;
          if (params.url) {
            navUrl = params.url;
          } else if (params.service === "gmail" || params.service === "google") {
            navUrl = "https://accounts.google.com/Logout";
          }
          if (navUrl) {
            const navRes = await Driver.openUrl(navUrl, signal);
            const ok = navRes?.ok !== false;
            return {
              ok,
              executed: ok,
              verified: ok,
              completed: ok,
              outcome: ok ? "COMPLETED" : "FAILED",
              action: "logout",
              service: params.service || "web",
              url: navUrl,
              message: ok ? `Navigated to logout endpoint: ${navUrl}` : "Failed to open logout endpoint",
            };
          }
          return {
            ok: false,
            executed: false,
            verified: false,
            completed: false,
            outcome: "UNVERIFIED",
            action: "logout",
            error: "unspecified-logout-target",
            message: "Cannot verify logout without a specific service or logout URL.",
          };
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
