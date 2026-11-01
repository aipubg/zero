/**
 * Windows Computer Driver for Zero.
 * Adapted from OpenMausBot (Apache-2.0, non-enterprise core).
 *
 * Implements full computer operating capabilities on Windows:
 * - Mouse: mouse_move, left_click, right_click, double_click, middle_click, mouse_drag, scroll
 * - Keyboard: type_text, press_key, hotkey
 * - Screen: get_screen_size, get_cursor_position, captureScreen
 * - Windows/Apps: get_window_state, list_windows, focus_window, launch_app, open_url
 * - Clipboard: clipboard_get, clipboard_set
 * - UI Automation: get_elements (interactive elements with exact center coordinates)
 * - Human Bailout: instantly detects physical user mouse movement or Escape key.
 *
 * High-performance architecture:
 * Uses a persistent WindowsInputDaemon (PowerShell + Win32 user32.dll SendInput / DPI aware)
 * executing commands in 1-5ms without cold-starting a process per click.
 */

import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { resolveCuaDriverEntry } from "../../observation/capture-source.mjs";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIN_ACTIONS_SCRIPT = path.join(__dirname, "win-actions.ps1");
const WIN_ACTIONS_DAEMON_SCRIPT = path.join(__dirname, "win-actions-daemon.ps1");

let cachedCuaDriver = null;
let cuaDriverInitAttempted = false;

/**
 * Initializes and caches the @trycua/cua-driver instance if installed.
 */
export async function getCuaDriver() {
  if (cachedCuaDriver) return cachedCuaDriver;
  if (cuaDriverInitAttempted) return null;
  cuaDriverInitAttempted = true;

  try {
    const entryPath = resolveCuaDriverEntry({ cwd: process.cwd() });
    if (!entryPath) return null;
    const sdk = await import(pathToFileURL(entryPath).href);
    if (typeof sdk.CuaDriver?.create === "function") {
      cachedCuaDriver = sdk.CuaDriver.create();
      return cachedCuaDriver;
    }
  } catch {
    // Falls back to native Windows execution
  }
  return null;
}

/**
 * Persistent high-performance Windows input daemon.
 */
class WindowsInputDaemon {
  constructor() {
    this.process = null;
    this.pendingQueue = [];
    this.buffer = "";
    this.ready = false;
    this.startPromise = null;
  }

  async ensureStarted() {
    if (this.process && this.ready && !this.process.killed) return true;
    if (this.startPromise) return this.startPromise;

    this.startPromise = new Promise((resolve) => {
      try {
        this.process = spawn(
          "powershell.exe",
          [
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            WIN_ACTIONS_DAEMON_SCRIPT,
          ],
          {
            stdio: ["pipe", "pipe", "ignore"],
            windowsHide: true,
          },
        );
        this.process.unref();
        try { this.process.stdin?.unref?.(); } catch {}
        try { this.process.stdout?.unref?.(); } catch {}

        this.process.stdout.on("data", (chunk) => {
          this.buffer += chunk.toString("utf8");
          const lines = this.buffer.split("\n");
          this.buffer = lines.pop();
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const data = JSON.parse(trimmed);
              if (data.ready) {
                this.ready = true;
                resolve(true);
                continue;
              }
              const pending = this.pendingQueue.shift();
              if (pending) {
                pending.resolve(data);
              }
            } catch {
              // Ignore non-json lines
            }
          }
        });

        this.process.on("error", (err) => {
          this.ready = false;
          this.process = null;
          this.startPromise = null;
          while (this.pendingQueue.length > 0) {
            this.pendingQueue.shift().reject(err);
          }
          resolve(false);
        });

        this.process.on("exit", () => {
          this.ready = false;
          this.process = null;
          this.startPromise = null;
          while (this.pendingQueue.length > 0) {
            this.pendingQueue.shift().reject(new Error("Input daemon process exited."));
          }
        });

        setTimeout(() => {
          if (!this.ready) resolve(false);
        }, 4000);
      } catch {
        resolve(false);
      }
    });

    return this.startPromise;
  }

  async send(action, params = {}, timeoutMs = 8000) {
    const started = await this.ensureStarted();
    if (!started || !this.process || !this.ready || !this.process.stdin.writable) {
      return runNativeWinActionOneOff(action, params);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.pendingQueue.findIndex((p) => p.resolve === resolve);
        if (idx !== -1) this.pendingQueue.splice(idx, 1);
        reject(new Error(`Action '${action}' timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      this.pendingQueue.push({
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });

      const payload = JSON.stringify({ action, ...params }) + "\n";
      this.process.stdin.write(payload);
    });
  }

  stop() {
    if (this.process) {
      try {
        this.process.kill();
      } catch {}
      this.process = null;
      this.ready = false;
    }
  }
}

let daemonInstance = null;
export function getInputDaemon() {
  if (!daemonInstance) {
    daemonInstance = new WindowsInputDaemon();
  }
  return daemonInstance;
}

export function stopDaemon() {
  if (daemonInstance) {
    daemonInstance.stop();
    daemonInstance = null;
  }
}

/**
 * Fallback one-off execution via win-actions.ps1 if daemon cannot run.
 */
export async function runNativeWinActionOneOff(action, args = {}, signal = null) {
  const params = [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    WIN_ACTIONS_SCRIPT,
    "-Action",
    action,
  ];

  if (args.x !== undefined) params.push("-X", String(Math.round(args.x)));
  if (args.y !== undefined) params.push("-Y", String(Math.round(args.y)));
  if (args.to_x !== undefined) params.push("-ToX", String(Math.round(args.to_x)));
  if (args.to_y !== undefined) params.push("-ToY", String(Math.round(args.to_y)));
  if (args.button !== undefined) params.push("-Button", String(args.button));
  if (args.count !== undefined) params.push("-Count", String(args.count));
  if (args.text !== undefined) params.push("-Text", String(args.text));
  if (args.key !== undefined) params.push("-Key", String(args.key));
  if (args.app !== undefined) params.push("-App", String(args.app));
  if (args.url !== undefined) params.push("-Url", String(args.url));
  if (args.direction !== undefined) params.push("-Direction", String(args.direction));
  if (args.amount !== undefined) params.push("-Amount", String(args.amount));

  const { stdout } = await execFileAsync("powershell.exe", params, {
    windowsHide: true,
    timeout: 10_000,
    signal: signal || undefined,
  });

  try {
    return JSON.parse(stdout.trim());
  } catch {
    return { ok: true, action, raw: stdout.trim() };
  }
}

/**
 * Executes a native Windows action via the fast daemon.
 */
export async function runNativeWinAction(action, args = {}, signal = null) {
  signal?.throwIfAborted?.();
  const daemon = getInputDaemon();
  try {
    return await daemon.send(action, args);
  } catch {
    return await runNativeWinActionOneOff(action, args, signal);
  }
}

/**
 * Get display screen size.
 */
export async function getScreenSize(signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("get_screen_size", "{}");
      if (res && !res.isError && res.structuredJson) {
        const parsed = JSON.parse(res.structuredJson);
        return {
          width: parsed.width ?? 1920,
          height: parsed.height ?? 1080,
          scaleFactor: parsed.scale_factor ?? 1.0,
        };
      }
    } catch {}
  }
  const nativeRes = await runNativeWinAction("get_screen_size", {}, signal);
  return {
    width: nativeRes.width ?? 1920,
    height: nativeRes.height ?? 1080,
    scaleFactor: nativeRes.scale_factor ?? 1.0,
  };
}

/**
 * Get current cursor coordinates.
 */
export async function getCursorPosition(signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("get_cursor_position", "{}");
      if (res && !res.isError && res.structuredJson) {
        const parsed = JSON.parse(res.structuredJson);
        return { x: parsed.x ?? 0, y: parsed.y ?? 0 };
      }
    } catch {}
  }
  const nativeRes = await runNativeWinAction("get_cursor_position", {}, signal);
  return { x: nativeRes.x ?? 0, y: nativeRes.y ?? 0 };
}

/**
 * Move mouse pointer.
 */
export async function moveCursor(x, y, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("move_cursor", JSON.stringify({ x, y }));
      if (res && !res.isError) {
        return { ok: true, x, y };
      }
    } catch {}
  }
  return await runNativeWinAction("mouse_move", { x, y }, signal);
}

/**
 * Click at coordinates (left, right, double, middle).
 */
export async function click({ x, y, button = "left", count = 1 } = {}, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const toolName =
        count === 2
          ? "double_click"
          : count === 3
            ? "triple_click"
            : button === "right"
              ? "right_click"
              : "click";
      const payload = { x, y, button, count, scope: "desktop" };
      const res = await driver.callTool(toolName, JSON.stringify(payload));
      if (res && !res.isError) {
        return { ok: true, x, y, button, count };
      }
    } catch {}
  }
  return await runNativeWinAction("click", { x, y, button, count }, signal);
}

/**
 * Drag mouse from (x, y) to (toX, toY).
 */
export async function drag({ x, y, toX, toY, fromX, fromY } = {}, signal = null) {
  const startX = fromX ?? x;
  const startY = fromY ?? y;
  const endX = toX;
  const endY = toY;
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const payload = { x: startX, y: startY, to_x: endX, to_y: endY, scope: "desktop" };
      const res = await driver.callTool("drag", JSON.stringify(payload));
      if (res && !res.isError) {
        return { ok: true, from: { x: startX, y: startY }, to: { x: endX, y: endY } };
      }
    } catch {}
  }
  return await runNativeWinAction("mouse_drag", { from_x: startX, from_y: startY, to_x: endX, to_y: endY }, signal);
}

/**
 * Scroll mouse wheel.
 */
export async function scroll({ x, y, direction = "down", amount = 3 } = {}, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const payload = { x, y, direction, amount, scope: "desktop" };
      const res = await driver.callTool("scroll", JSON.stringify(payload));
      if (res && !res.isError) {
        return { ok: true, x, y, direction, amount };
      }
    } catch {}
  }
  return await runNativeWinAction("scroll", { x, y, direction, amount }, signal);
}

/**
 * Type text into the focused application.
 */
export async function typeText(text, signal = null) {
  return await runNativeWinAction("type_text", { text }, signal);
}

/**
 * Press key or shortcut.
 */
export async function pressKey(key, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("press_key", JSON.stringify({ key }));
      if (res && !res.isError) {
        return { ok: true, key };
      }
    } catch {}
  }
  return await runNativeWinAction("press_key", { key }, signal);
}

/**
 * Wait for milliseconds.
 */
export async function wait(ms = 500, signal = null) {
  return await runNativeWinAction("wait", { ms }, signal);
}

/**
 * Read text from clipboard.
 */
export async function clipboardGet(signal = null) {
  return await runNativeWinAction("clipboard_get", {}, signal);
}

/**
 * Set text to clipboard.
 */
export async function clipboardSet(text, signal = null) {
  return await runNativeWinAction("clipboard_set", { text }, signal);
}

/**
 * Get active foreground window state.
 */
export async function getWindowState(signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("get_window_state", "{}");
      if (res && !res.isError && res.structuredJson) {
        const parsed = JSON.parse(res.structuredJson);
        return { ok: true, ...parsed };
      }
    } catch {}
  }
  const native = await runNativeWinAction("get_window_state", {}, signal);
  return { ok: true, ...native };
}

/**
 * List running or open desktop windows.
 */
export async function listWindows(signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("list_windows", "{}");
      if (res && !res.isError) {
        if (res.structuredJson) {
          const parsed = JSON.parse(res.structuredJson);
          return { ok: true, windows: parsed.windows || [], ...parsed };
        }
        return { ok: true, text: res.text, windows: [] };
      }
    } catch {}
  }
  const native = await runNativeWinAction("list_windows", {}, signal);
  return { ok: true, ...native };
}

/**
 * List installed and running applications.
 */
export async function listApps(signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("list_apps", "{}");
      if (res && !res.isError) {
        return { text: res.text };
      }
    } catch {}
  }
  return await runNativeWinAction("list_windows", {}, signal);
}

/**
 * Focus, minimize, maximize, restore, or close window.
 */
export async function focusWindow({ target, command = "restore" } = {}, signal = null) {
  return await runNativeWinAction("focus_window", { target, command }, signal);
}

/**
 * Launch an application or executable.
 */
export async function launchApp(appNameOrPath, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("launch_app", JSON.stringify({ app_name: appNameOrPath }));
      if (res && !res.isError) {
        return { ok: true, app: appNameOrPath };
      }
    } catch {}
  }
  return await runNativeWinAction("launch_app", { app: appNameOrPath }, signal);
}

/**
 * Open a URL in default web browser.
 */
export async function openUrl(url, signal = null) {
  return await runNativeWinAction("open_url", { url }, signal);
}

/**
 * Bring application or window to front.
 */
export async function bringToFront(target, signal = null) {
  return await focusWindow({ target, command: "restore" }, signal);
}

/**
 * Get clickable UI Automation elements with coordinates.
 */
export async function getElements(signal = null) {
  return await runNativeWinAction("get_elements", {}, signal);
}

/**
 * Inspect live media playback state (checks YouTube play/pause UI state).
 */
export async function inspectMediaPlayback(signal = null) {
  return await runNativeWinAction("inspect_media_playback", {}, signal);
}

/**
 * Inspect the exact target element and window under current cursor (Point & Ask).
 */
export async function getCursorTarget(signal = null) {
  const cursor = await getCursorPosition(signal);
  const elementsRes = await getElements(signal).catch(() => ({ elements: [] }));
  const windowState = await getWindowState(signal).catch(() => ({}));

  let targetElement = null;
  if (elementsRes && Array.isArray(elementsRes.elements)) {
    for (const el of elementsRes.elements) {
      const b = el.bounds;
      if (b && cursor.x >= b.left && cursor.x <= b.right && cursor.y >= b.top && cursor.y <= b.bottom) {
        targetElement = el;
        break;
      }
    }
  }

  return {
    cursor,
    targetElement,
    window: windowState?.title || windowState?.app || "Desktop",
  };
}

/**
 * Capture full desktop screen.
 */
export async function captureScreen({ format = "png", maxWidth = 1600 } = {}, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("get_desktop_state", "{}");
      if (res && !res.isError && Array.isArray(res.images) && res.images.length > 0) {
        const img = res.images[0];
        const data = String(img.dataBase64 || "").replace(/^data:[^;]+;base64,/u, "");
        const buffer = Buffer.from(data, "base64");
        return {
          ok: true,
          mimeType: img.mimeType || "image/png",
          base64: data,
          bytes: buffer.length,
          buffer,
        };
      }
    } catch {}
  }

  // Fallback to native Windows screen capture via daemon
  try {
    const nativeShot = await runNativeWinAction("screenshot", {}, signal);
    if (nativeShot && nativeShot.base64) {
      return {
        ok: true,
        mimeType: nativeShot.mimeType || "image/png",
        width: nativeShot.width || 1920,
        height: nativeShot.height || 1080,
        base64: nativeShot.base64,
        bytes: nativeShot.bytes || 0,
        buffer: Buffer.from(nativeShot.base64, "base64"),
      };
    }
  } catch {}

  const size = await getScreenSize(signal);
  return {
    ok: true,
    mimeType: "image/png",
    width: size.width,
    height: size.height,
    base64: "",
    notice: "Screen geometry acquired; full pixel buffer requires interactive GUI session.",
  };
}
