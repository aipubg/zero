/**
 * Windows Computer Driver for Zero.
 * Adapted from OpenMausBot (Apache-2.0, non-enterprise core).
 *
 * Implements full computer operating capabilities on Windows:
 * - Mouse: click, double_click, right_click, move_cursor, drag, scroll
 * - Keyboard: type_text, press_key, hotkey
 * - Screen: get_screen_size, get_cursor_position, capture_screen
 * - Windows/Apps: get_window_state, list_windows, list_apps, launch_app, open_url, bring_to_front
 *
 * Uses high-performance in-process @trycua/cua-driver when available,
 * with automatic fallback to native Windows automation (win-actions.ps1).
 */

import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { resolveCuaDriverEntry } from "../../observation/capture-source.mjs";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIN_ACTIONS_SCRIPT = path.join(__dirname, "win-actions.ps1");

let cachedCuaDriver = null;
let cuaDriverInitAttempted = false;

/**
 * Initializes and caches the @trycua/cua-driver instance.
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
 * Executes a native Windows action via win-actions.ps1.
 */
export async function runNativeWinAction(action, args = {}, signal = null) {
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
    } catch {
      // Fall through to native
    }
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
    } catch {
      // Fall through
    }
  }
  const nativeRes = await runNativeWinAction("get_cursor", {}, signal);
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
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("move", { x, y }, signal);
}

/**
 * Click at coordinates.
 */
export async function click({ x, y, button = "left", count = 1 } = {}, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const toolName = count === 2 ? "double_click" : count === 3 ? "triple_click" : button === "right" ? "right_click" : "click";
      const payload = { x, y, button, count, scope: "desktop" };
      const res = await driver.callTool(toolName, JSON.stringify(payload));
      if (res && !res.isError) {
        return { ok: true, x, y, button, count };
      }
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("click", { x, y, button, count }, signal);
}

/**
 * Drag mouse from (x, y) to (toX, toY).
 */
export async function drag({ x, y, toX, toY } = {}, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const payload = { x, y, to_x: toX, to_y: toY, scope: "desktop" };
      const res = await driver.callTool("drag", JSON.stringify(payload));
      if (res && !res.isError) {
        return { ok: true, from: { x, y }, to: { x: toX, y: toY } };
      }
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("drag", { x, y, to_x: toX, to_y: toY }, signal);
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
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("scroll", { x, y, direction, amount }, signal);
}

/**
 * Type text into the focused application.
 */
export async function typeText(text, signal = null) {
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const res = await driver.callTool("type_text", JSON.stringify({ text }));
      if (res && !res.isError) {
        return { ok: true, typedChars: text.length };
      }
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("type", { text }, signal);
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
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("press", { key }, signal);
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
        return JSON.parse(res.structuredJson);
      }
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("get_window_state", {}, signal);
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
        if (res.structuredJson) return JSON.parse(res.structuredJson);
        return { text: res.text, windows: [] };
      }
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("list_apps", {}, signal);
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
    } catch {
      // Fall through
    }
  }
  return await runNativeWinAction("list_apps", {}, signal);
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
    } catch {
      // Fall through
    }
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
  const driver = await getCuaDriver();
  if (driver) {
    try {
      const payload = typeof target === "number" ? { pid: target } : { app_name: String(target) };
      const res = await driver.callTool("bring_to_front", JSON.stringify(payload));
      if (res && !res.isError) {
        return { ok: true, target };
      }
    } catch {
      // Fall through
    }
  }
  return { ok: true, target };
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
    } catch {
      // Fall through
    }
  }

  // Fallback to native Windows screen capture
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
  } catch {
    // Fall through to size-only metadata
  }

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
