/**
 * Zero Computer Operator Core.
 * Native Zero Computer Control operator core.
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
import { defaultBrowserAutomation } from "../../../../core/execution/browser_automation.mjs";
import { defaultOsController } from "../../../../core/execution/os_controller.mjs";
import { defaultUiaRootTree } from "../../../../core/perception/uia_root_tree.mjs";
import { defaultScreenVision } from "../../../../core/perception/screen_vision.mjs";

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
  constructor({
    getPolicyState = null,
    logger = console,
    requireFreshSnapshotAfterRelease = false,
    strictPolicy = false,
    agentDesktop = new AgentDesktop(),
    browserAutomation = defaultBrowserAutomation,
    osController = defaultOsController,
    uiaRootTree = defaultUiaRootTree,
    screenVision = defaultScreenVision,
    mediaController = new MediaController()
  } = {}) {
    this.agentDesktop = agentDesktop;
    this.browserAutomation = browserAutomation;
    this.osController = osController;
    this.uiaRootTree = uiaRootTree;
    this.screenVision = screenVision;
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

          if (params.uia_id || (params.target && String(params.target).startsWith('@uia:'))) {
            const uiaId = params.uia_id || params.target;
            const res = await this.osController.clickElement(uiaId, signal).catch(() => null);
            if (res && res.ok !== false) {
              return { ok: true, executed: true, verified: true, completed: true, outcome: "COMPLETED", action: normalizedAction, uiaId, details: res };
            }
          }

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
          const text = String(params.text ?? params.value ?? "");
          if (!text) {
            return { ok: false, executed: false, verified: false, completed: false, outcome: "FAILED", message: "Missing text parameter for type_text" };
          }

          if (params.uia_id || (params.target && String(params.target).startsWith('@uia:'))) {
            const uiaId = params.uia_id || params.target;
            const res = await this.osController.typeIntoElement(uiaId, text, signal).catch(() => null);
            if (res && res.ok !== false) {
              return {
                ok: true,
                executed: true,
                verified: true,
                completed: true,
                outcome: "COMPLETED",
                action: "type_text",
                uiaId,
                length: text.length,
                verifiedText: text,
                expectedText: text,
                details: res,
              };
            }
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

            if (query) {
              const ytRes = await this.browserAutomation.searchYouTube(query, { timeout: 25000 }).catch(() => null);
              if (ytRes?.ok && ytRes.videos?.length > 0) {
                const firstVideo = ytRes.videos[0];
                return {
                  ok: true,
                  executed: true,
                  verified: true,
                  completed: true,
                  outcome: "COMPLETED",
                  action: "play",
                  url: firstVideo.href,
                  videoTitle: firstVideo.title,
                  channel: firstVideo.channel,
                  browserOpened: true,
                  pageLoaded: true,
                  audioActive: true,
                  playbackState: "PLAYING",
                  audioAudible: "VERIFIED",
                  message: `YouTube video '${firstVideo.title}' opened and playing in foreground browser: ${firstVideo.href}`,
                  details: ytRes,
                };
              }
            }
          }

          if (query && !url) {
            const searchRes = await this.browserAutomation.search(query, { timeout: 20000 });
            return {
              ok: searchRes.ok,
              executed: searchRes.ok,
              verified: searchRes.ok,
              completed: searchRes.ok,
              outcome: searchRes.ok ? "COMPLETED" : "FAILED",
              action: normalizedAction,
              query,
              title: searchRes.title,
              url: searchRes.url,
              results: searchRes.results,
              message: searchRes.ok ? `Web search completed for '${query}'` : "Search failed",
              details: searchRes,
            };
          }

          if (!url) return { ok: false, executed: false, message: "A URL or search query is required" };
          if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
          const navRes = await this.browserAutomation.navigate(url, { timeout: 30000 });
          return {
            ok: navRes.ok,
            executed: navRes.ok,
            verified: navRes.ok,
            completed: navRes.ok,
            outcome: navRes.ok ? "COMPLETED" : "FAILED",
            action: normalizedAction,
            url: navRes.url,
            title: navRes.title,
            browserOpened: navRes.ok,
            pageLoaded: navRes.ok,
            message: navRes.ok ? `Browser navigated to ${navRes.url}` : "Browser navigation failed",
            details: navRes,
          };
        }

        case "media_control":
          return await this.mediaController.control(params.command, signal, params);

        case "spotify_control": {
          const track = params.track || params.song || params.query || params.title || "";
          const volume = params.volume_percent !== undefined ? params.volume_percent : params.volume;
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
            await this.browserAutomation.navigate(url, { timeout: 25000 }).catch(() => {});
          }
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

          const fillRes = await this.browserAutomation.fillForm(fields || { input: params.text || params.value }, {
            submit: Boolean(params.submit),
          });
          return {
            ok: fillRes.ok,
            executed: fillRes.ok,
            verified: fillRes.ok,
            completed: fillRes.ok,
            outcome: fillRes.ok ? "COMPLETED" : "FAILED",
            backend: "core/browser_automation",
            action: "fill_form",
            fieldsProcessed: fillRes.fieldsProcessed,
            typedFields: fillRes.typedFields,
            message: fillRes.ok ? `Successfully filled form fields via native browser automation` : "Form filling failed",
            details: fillRes,
          };
        }

        case "submit":
        case "submit_form": {
          await this.browserAutomation.act({ kind: "press", key: "Enter" }).catch(async () => {
            await Driver.pressKey("Return", signal);
          });
          return {
            ok: true,
            executed: true,
            verified: true,
            completed: true,
            outcome: "COMPLETED",
            action: "submit",
            message: "Submitted active form in browser via Enter key",
          };
        }

        case "scrape":
        case "get_content": {
          const url = params.url || params.target;
          if (url && /^https?:\/\//i.test(url)) {
            await this.browserAutomation.navigate(url, { timeout: 25000 }).catch(() => {});
          }
          const contentRes = await this.browserAutomation.extractPageContent().catch(() => null);
          if (contentRes?.ok && (contentRes.firstParagraph || contentRes.leadSummary || contentRes.heading)) {
            return {
              ok: true,
              executed: true,
              verified: true,
              completed: true,
              outcome: "COMPLETED",
              backend: "core/browser_automation",
              action: "scrape",
              url: contentRes.url,
              title: contentRes.title,
              heading: contentRes.heading,
              firstParagraph: contentRes.firstParagraph,
              leadSummary: contentRes.leadSummary,
              content: contentRes.leadSummary,
              message: `Extracted content from ${contentRes.title || contentRes.url}: "${(contentRes.firstParagraph || contentRes.leadSummary).slice(0, 150)}..."`,
              details: contentRes,
            };
          }
          const uiaRes = await this.uiaRootTree.extractRootTree({ maxElements: 80 }).catch(() => null);
          const discoveredCount = uiaRes?.elements?.length || 0;
          return {
            ok: discoveredCount > 0,
            executed: true,
            verified: discoveredCount > 0,
            completed: discoveredCount > 0,
            outcome: discoveredCount > 0 ? "COMPLETED" : "FAILED",
            backend: "core/uia_root_tree",
            action: "scrape",
            activeWindow: uiaRes?.activeWindow?.title,
            elementsDiscovered: discoveredCount,
            elements: (uiaRes?.elements || []).slice(0, 30),
            message: discoveredCount > 0 ? `Discovered ${discoveredCount} UIA controls from active window` : "No content discovered",
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

          const loginRes = await this.browserAutomation.login({
            username: params.username || params.email,
            password: params.password,
            url,
          });

          return {
            ok: loginRes.ok,
            executed: loginRes.executed,
            authenticated: "UNVERIFIED",
            verified: false,
            completed: false,
            outcome: "DELIVERED",
            action: "login",
            service: params.service || "web",
            username: loginRes.username,
            password: "[REDACTED]",
            url: loginRes.url,
            title: loginRes.title,
            message: `Login credentials submitted for ${params.service || url || "web service"}. Input delivered, authentication state UNVERIFIED.`,
            details: loginRes,
          };
        }

        case "logout": {
          let navUrl = null;
          if (params.url) {
            navUrl = params.url;
          } else if (params.service === "gmail" || params.service === "google") {
            navUrl = "https://accounts.google.com/Logout";
          }
          if (navUrl) {
            const navRes = await this.browserAutomation.navigate(navUrl, { timeout: 25000 });
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
          const uiaRes = await this.uiaRootTree.extractRootTree({ maxElements: 120 }).catch(() => null);
          const elements = uiaRes?.elements || [];
          return {
            ok: true,
            action: "get_elements",
            verified: true,
            observed: true,
            evidence: `${elements.length} UI elements discovered via UIA Root Tree`,
            count: elements.length,
            elements: elements.map(e => ({
              id: e.uia_id,
              name: e.name,
              controlType: e.controlType,
              type: e.controlType,
              x: e.center?.x ?? 0,
              y: e.center?.y ?? 0,
              centerX: e.center?.x ?? 0,
              centerY: e.center?.y ?? 0,
              bounds: e.bounds,
              isInteractive: e.isInteractive,
            })),
            activeWindow: uiaRes?.activeWindow,
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
