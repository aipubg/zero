/**
 * @fileoverview Computer Control: UI Automation tree, OS input and screen vision.
 *
 * This is the single home for every physical-computer capability in Zero:
 *   - UiaRootTreeExtractor  UI Automation root tree and element resolution
 *   - OsController          Win32 mouse/keyboard, windows, clipboard
 *   - ScreenVision          live capture, OCR and visual change detection
 *
 * They are exported together because the Human-Reflex chain always moves
 * between them: DOM/UIA first, then screen vision, then physical input.
 */

import { ZeroDesktop, DESKTOP_COMMANDS } from './zero-desktop.mjs';
import {
  runNativeWinAction,
  getWindowState,
  listWindows,
  focusWindow,
  launchApp,
  getCursorPosition,
  getScreenSize,
} from './windows-driver.mjs';
import { captureDriverDesktop, pngDimensions } from '../screen-intelligence/windows-capture.mjs';
import { LocalVisionExtractor } from '../screen-intelligence/ocr-vision.mjs';
import crypto from 'node:crypto';

export class UiaRootTreeExtractor {
  constructor(options = {}) {
    this.maxNodes = options.maxNodes || 250;
    this.maxDepth = options.maxDepth || 6;
  }

  /**
   * Diagnostic check verifying UI Automation subsystem health
   */
  async getStatus() {
    try {
      const state = await this.extractRootTree({ maxElements: 10 });
      return {
        healthy: true,
        module: 'capability-engine/computer-control#uia',
        status: 'online',
        activeWindow: state.activeWindow,
        elementCount: state.elements.length,
        foregroundApp: state.app,
      };
    } catch (err) {
      return {
        healthy: false,
        module: 'capability-engine/computer-control#uia',
        status: 'degraded',
        error: err.message,
      };
    }
  }

  /**
   * Extracts the full active window or desktop UI Automation root tree with UI Automation formatted state
   */
  async extractRootTree({ maxElements = 150, target = null, hwnd = null, signal = null } = {}) {
    signal?.throwIfAborted();

    const uiaRes = await runNativeWinAction('get_elements', { max_elements: maxElements, target, hwnd }, signal);
    const winState = await runNativeWinAction('get_window_state', {}, signal).catch(() => ({}));

    const rawElements = Array.isArray(uiaRes?.elements) ? uiaRes.elements : [];

    // Parse and structure into UI Automation state format
    const parsedElements = [];
    const elementIndex = new Map();

    for (let i = 0; i < rawElements.length; i++) {
      const el = rawElements[i];
      const uiaId = el.uia_id || `uia_${i + 1}`;
      const ref = `@uia:e${i}`;
      
      const bounds = {
        left: Number(el.x || 0),
        top: Number(el.y || 0),
        right: Number((el.x || 0) + (el.width || 0)),
        bottom: Number((el.y || 0) + (el.height || 0)),
        x: Number(el.x || 0),
        y: Number(el.y || 0),
        width: Number(el.width || 0),
        height: Number(el.height || 0),
      };

      const center = {
        x: Number(el.centerX || el.cx || bounds.x + Math.floor(bounds.width / 2)),
        y: Number(el.centerY || el.cy || bounds.y + Math.floor(bounds.height / 2)),
        cx: Number(el.centerX || el.cx || bounds.x + Math.floor(bounds.width / 2)),
        cy: Number(el.centerY || el.cy || bounds.y + Math.floor(bounds.height / 2)),
      };

      const entry = {
        uia_id: uiaId,
        id: uiaId,
        ref,
        index: i,
        name: String(el.name || '').trim(),
        controlType: String(el.type || el.controlType || 'Custom').trim(),
        automationId: String(el.automationId || '').trim(),
        className: String(el.className || '').trim(),
        bounds,
        center,
        cx: center.x,
        cy: center.y,
        isEnabled: el.isEnabled !== undefined ? Boolean(el.isEnabled) : true,
        hasKeyboardFocus: Boolean(el.hasKeyboardFocus),
        value: String(el.value || '').trim(),
        isInteractive: ['Button', 'Edit', 'Document', 'Hyperlink', 'MenuItem', 'CheckBox', 'ComboBox', 'TabItem', 'ListItem'].includes(el.type || el.controlType),
      };

      parsedElements.push(entry);
      elementIndex.set(uiaId, entry);
      elementIndex.set(ref, entry);
      if (entry.name) {
        elementIndex.set(entry.name.toLowerCase(), entry);
      }
    }

    const resolvedApp = winState.process || winState.app || winState.window?.process || winState.window?.processName || winState.processName || 'system';

    return {
      ok: true,
      timestamp: Date.now(),
      activeWindow: {
        title: winState.title || winState.window?.title || 'Desktop',
        hwnd: winState.hwnd || hwnd || null,
        app: resolvedApp,
        bounds: winState.bounds || null,
      },
      app: resolvedApp,
      totalCount: parsedElements.length,
      elements: parsedElements,
      // Lookup helpers
      getElementById: (idOrRef) => elementIndex.get(idOrRef) || elementIndex.get(String(idOrRef).toLowerCase()) || null,
      filterByName: (query) => {
        const q = String(query).toLowerCase();
        return parsedElements.filter(e => e.name.toLowerCase().includes(q) || e.automationId.toLowerCase().includes(q));
      },
      filterByType: (type) => {
        const t = String(type).toLowerCase();
        return parsedElements.filter(e => e.controlType.toLowerCase() === t);
      },
    };
  }

  /**
   * Resolves an interactive target's center coordinates from either a reference (`uia_1` or `@uia:e1`) or a query
   */
  async resolveTargetPoint(target, signal = null) {
    if (typeof target === 'object' && typeof target.x === 'number' && typeof target.y === 'number') {
      return { x: target.x, y: target.y };
    }

    const tree = await this.extractRootTree({ maxElements: 200, signal });
    if (typeof target === 'string') {
      const match = tree.getElementById(target);
      if (match) return match.center;
    }

    const matches = tree.filterByName(String(target));
    if (matches.length > 0) {
      return matches[0].center;
    }

    throw new Error(`Target '${target}' could not be resolved to an active UI Automation element`);
  }
}

export const defaultUiaRootTree = new UiaRootTreeExtractor();

export class ScreenVision {
  constructor(options = {}) {
    this.maxFrameBytes = options.maxFrameBytes || 16 * 1024 * 1024;
    this.cachedFrame = null;
    this.cachedMetadata = null;
    this.lastCaptureTime = 0;
    this.minCaptureIntervalMs = options.minCaptureIntervalMs || 50;
    this.visionExtractor = new LocalVisionExtractor(options);
    
    // Low-latency ring buffer of latest 30 frames
    this.ringBuffer = [];
    this.maxRingBufferSize = options.maxRingBufferSize || 30;
  }

  /**
   * Diagnostic check verifying screen vision pipeline health and hardware metrics
   */
  async getStatus() {
    try {
      const geometry = await this.getScreenGeometry();
      const frameCheck = await this.captureFrame({ forceFresh: true });
      return {
        healthy: true,
        module: 'capability-engine/computer-control#vision',
        status: 'online',
        geometry: {
          width: geometry.width,
          height: geometry.height,
          dpi: geometry.dpi,
          scaleFactor: geometry.scaleFactor,
        },
        frameBuffer: {
          bytes: frameCheck.bytes,
          format: frameCheck.mimeType,
          capturedAt: frameCheck.timestamp,
          source: frameCheck.source,
          ringBufferSize: this.ringBuffer.length,
        },
      };
    } catch (err) {
      return {
        healthy: false,
        module: 'capability-engine/computer-control#vision',
        status: 'degraded',
        error: err.message,
      };
    }
  }

  /**
   * Discovers exact screen resolution, virtual bounds, and system DPI scaling factor
   */
  async getScreenGeometry(signal = null) {
    const sizeRes = await runNativeWinAction('get_screen_size', {}, signal);
    if (!sizeRes || !sizeRes.width || !sizeRes.height) {
      throw new Error(`Failed to acquire screen geometry from Win32 subsystem: ${sizeRes?.error || 'Unknown error'}`);
    }

    const width = Number(sizeRes.width);
    const height = Number(sizeRes.height);
    const dpi = Number(sizeRes.dpi || 96);
    const scaleFactor = Math.round((dpi / 96) * 100) / 100;

    return {
      width,
      height,
      dpi,
      scaleFactor,
      bounds: { left: 0, top: 0, right: width, bottom: height },
    };
  }

  /**
   * Captures a live screen frame buffer from the primary desktop
   */
  async captureFrame({ forceFresh = false, extractOcr = false, signal = null } = {}) {
    const now = Date.now();
    if (!forceFresh && this.cachedFrame && (now - this.lastCaptureTime < this.minCaptureIntervalMs)) {
      return this.cachedFrame;
    }

    signal?.throwIfAborted();
    const rawCapture = await captureDriverDesktop({ signal });
    if (!rawCapture || !rawCapture.ok || (!rawCapture.base64 && !rawCapture.data)) {
      throw new Error(`Screen capture pipeline failed: ${rawCapture?.error || 'Empty buffer returned'}`);
    }

    const base64Data = (rawCapture.base64 || rawCapture.data).replace(/^data:[^;]+;base64,/u, '');
    const buffer = Buffer.from(base64Data, 'base64');
    if (!buffer.length) {
      throw new Error('Screen capture frame buffer contains 0 bytes');
    }

    let dimensions = { width: rawCapture.width, height: rawCapture.height };
    if (!dimensions.width || !dimensions.height) {
      try {
        dimensions = pngDimensions(buffer);
      } catch {
        dimensions = await this.getScreenGeometry(signal);
      }
    }

    const geometry = await this.getScreenGeometry(signal).catch(() => ({ dpi: 96, scaleFactor: 1.0 }));
    const frameHash = crypto.createHash('sha256').update(buffer).digest('hex');

    let ocrResult = null;
    if (extractOcr) {
      try {
        ocrResult = await this.visionExtractor.extractText(buffer, { signal });
      } catch {}
    }

    const frameEntry = {
      buffer,
      base64: base64Data,
      mimeType: rawCapture.mimeType || 'image/png',
      bytes: buffer.length,
      width: dimensions.width,
      height: dimensions.height,
      dpi: geometry.dpi,
      scaleFactor: geometry.scaleFactor,
      hash: frameHash,
      source: rawCapture.captureSource || 'native-win32',
      timestamp: now,
      ocrText: ocrResult?.ok ? ocrResult.text : '',
    };

    this.cachedFrame = frameEntry;
    this.lastCaptureTime = now;

    // Maintain in low-latency ring buffer
    this.ringBuffer.push(frameEntry);
    if (this.ringBuffer.length > this.maxRingBufferSize) {
      this.ringBuffer.shift();
    }

    return frameEntry;
  }

  /**
   * Returns latest frame from the low-latency ring buffer
   */
  getLatestFrame() {
    return this.ringBuffer[this.ringBuffer.length - 1] || this.cachedFrame || null;
  }

  /**
   * Visual State Change Detection:
   * Compares Frame T0 and Frame T1 to detect:
   * - Pixel hash change
   * - Window context change
   * - Active dialog/modal/popup appearance
   * - Text diff
   */
  async detectVisualChange(frameT0, frameT1 = null, signal = null) {
    if (!frameT0) throw new Error('frameT0 is required for visual state change detection');
    const t1 = frameT1 || await this.captureFrame({ forceFresh: true, extractOcr: true, signal });

    const hashMatch = frameT0.hash === t1.hash;
    const timeDeltaMs = t1.timestamp - frameT0.timestamp;

    let textDiff = { added: [], removed: [] };
    if (frameT0.ocrText || t1.ocrText) {
      const words0 = new Set((frameT0.ocrText || '').split(/\s+/).filter(w => w.length > 2));
      const words1 = new Set((t1.ocrText || '').split(/\s+/).filter(w => w.length > 2));

      for (const w of words1) {
        if (!words0.has(w)) textDiff.added.push(w);
      }
      for (const w of words0) {
        if (!words1.has(w)) textDiff.removed.push(w);
      }
    }

    const hasSignificantChange = !hashMatch || textDiff.added.length > 0;

    return {
      changed: hasSignificantChange,
      timeDeltaMs,
      hashT0: frameT0.hash,
      hashT1: t1.hash,
      textDiff: {
        addedCount: textDiff.added.length,
        removedCount: textDiff.removed.length,
        newKeywords: textDiff.added.slice(0, 20),
      },
      frameT1: t1,
    };
  }

  /**
   * Normalizes client/window coordinates to physical screen coordinates based on DPI scaling
   */
  normalizeCoordinates(point, { fromScale = 1.0, toScale = 1.0 } = {}) {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      throw new Error('Invalid point coordinates supplied to normalizeCoordinates');
    }
    const ratio = toScale / fromScale;
    return {
      x: Math.round(point.x * ratio),
      y: Math.round(point.y * ratio),
    };
  }

  /**
   * Scales normalized relative coordinates (0.0 - 1.0) to absolute screen pixels
   */
  denormalizeToPixels(relativeX, relativeY, width, height) {
    return {
      x: Math.round(Math.max(0, Math.min(1.0, relativeX)) * width),
      y: Math.round(Math.max(0, Math.min(1.0, relativeY)) * height),
    };
  }
}

export const defaultScreenVision = new ScreenVision();

export class OsController {
  constructor(options = {}) {
    this.ZeroDesktop = new ZeroDesktop();
    this.uiaTree = options.uiaTree || defaultUiaRootTree;
    this.defaultTimeoutMs = options.defaultTimeoutMs || 15000;
  }

  /**
   * Diagnostic check verifying OS Controller and zero-desktop subsystem health
   */
  async getStatus() {
    try {
      const desktopStatus = await this.ZeroDesktop.execute({ command: 'status' });
      const cursor = await getCursorPosition();
      const screen = await getScreenSize();

      return {
        healthy: desktopStatus.ok === true,
        module: 'capability-engine/computer-control#os',
        status: 'online',
        ZeroDesktop: {
          ok: desktopStatus.ok,
          version: desktopStatus.data?.version || '1.2.0',
          platform: desktopStatus.data?.platform || 'windows',
        },
        cursor: { x: cursor.x, y: cursor.y },
        screen: { width: screen.width, height: screen.height, dpi: screen.dpi },
      };
    } catch (err) {
      return {
        healthy: false,
        module: 'capability-engine/computer-control#os',
        status: 'degraded',
        error: err.message,
      };
    }
  }

  /**
   * Move mouse cursor to absolute screen coordinates
   */
  async mouseMove(x, y, signal = null) {
    return await runNativeWinAction('mouse_move', { x: Math.round(x), y: Math.round(y) }, signal);
  }

  /**
   * Perform click (left, right, double, middle)
   */
  async click(options = {}, signal = null) {
    const { x, y, button = 'left', double = false } = options;
    if (typeof x === 'number' && typeof y === 'number') {
      await this.mouseMove(x, y, signal);
    }
    const action = double ? 'double_click' : (button === 'right' ? 'right_click' : (button === 'middle' ? 'middle_click' : 'left_click'));
    return await runNativeWinAction(action, {}, signal);
  }

  /**
   * Click an element from the UIA Root Tree by uia_id (e.g. 'uia_1') or name
   * Uses Tier 1 (Direct UIA InvokePattern) with automatic fallback to Tier 2 (Precision SendInput click at (cx, cy))
   */
  async clickElement(uiaIdOrName, signal = null) {
    signal?.throwIfAborted();
    const tree = await this.uiaTree.extractRootTree({ maxElements: 150, signal });
    const el = tree.getElementById(uiaIdOrName);
    if (!el) {
      throw new Error(`UIA Element '${uiaIdOrName}' not found in current window root tree`);
    }

    // Try Tier 1: Direct UIA Invoke
    try {
      const uiaInvokeRes = await runNativeWinAction('uia_invoke', { uia_id: el.uia_id }, signal);
      if (uiaInvokeRes?.ok && uiaInvokeRes.invoked) {
        return {
          ok: true,
          tier: 'tier1-uia-invoke',
          uia_id: el.uia_id,
          name: el.name,
          controlType: el.controlType,
        };
      }
    } catch {}

    // Tier 2: Precision physical click at exact bounding box center (cx, cy)
    await this.click({ x: el.cx, y: el.cy, button: 'left' }, signal);
    return {
      ok: true,
      tier: 'tier2-precision-click',
      uia_id: el.uia_id,
      name: el.name,
      point: { x: el.cx, y: el.cy },
    };
  }

  /**
   * Type text into an element from the UIA Root Tree by uia_id (e.g. 'uia_2') or name
   * Uses Tier 1 (ValuePattern.SetValue) with fallback to Tier 2 (Focus -> Click -> SendInput text)
   */
  async typeIntoElement(uiaIdOrName, text, signal = null) {
    signal?.throwIfAborted();
    const tree = await this.uiaTree.extractRootTree({ maxElements: 150, signal });
    const el = tree.getElementById(uiaIdOrName);
    if (!el) {
      throw new Error(`UIA Element '${uiaIdOrName}' not found in current window root tree`);
    }

    // Try Tier 1: Direct UIA SetValue
    try {
      const uiaSetRes = await runNativeWinAction('uia_set_value', { uia_id: el.uia_id, text }, signal);
      if (uiaSetRes?.ok && uiaSetRes.setSuccess) {
        return {
          ok: true,
          tier: 'tier1-uia-set-value',
          uia_id: el.uia_id,
          name: el.name,
          text,
        };
      }
    } catch {}

    // Tier 2: Precision Click at center + SendInput typing
    await this.click({ x: el.cx, y: el.cy }, signal);
    await this.typeText(text, {}, signal);
    return {
      ok: true,
      tier: 'tier2-precision-type',
      uia_id: el.uia_id,
      name: el.name,
      text,
      point: { x: el.cx, y: el.cy },
    };
  }

  /**
   * Type text into active control
   */
  async typeText(text, options = {}, signal = null) {
    return await runNativeWinAction('type_text', { text: String(text || '') }, signal);
  }

  /**
   * Press key or execute keyboard shortcut (e.g. ['Control', 'c'], 'Enter')
   */
  async pressKey(key, signal = null) {
    if (Array.isArray(key)) {
      return await runNativeWinAction('hotkey', { keys: key }, signal);
    }
    return await runNativeWinAction('press_key', { key: String(key) }, signal);
  }

  /**
   * Mouse drag from start to end coordinates
   */
  async mouseDrag(fromX, fromY, toX, toY, signal = null) {
    await this.mouseMove(fromX, fromY, signal);
    return await runNativeWinAction('mouse_drag', {
      fromX: Math.round(fromX),
      fromY: Math.round(fromY),
      toX: Math.round(toX),
      toY: Math.round(toY),
    }, signal);
  }

  /**
   * Mouse scroll (delta)
   */
  async scroll(delta = 120, direction = 'down', signal = null) {
    return await runNativeWinAction('scroll', { delta: Number(delta), direction }, signal);
  }

  /**
   * List all visible desktop windows
   */
  async listWindows(signal = null) {
    return await listWindows(signal);
  }

  /**
   * Get active/foreground window state
   */
  async getActiveWindow(signal = null) {
    return await getWindowState(signal);
  }

  /**
   * Focus a target window by title or HWND
   */
  async focusWindow(target, command = 'restore', signal = null) {
    return await focusWindow({ target, command }, signal);
  }

  /**
   * Launch application or process
   */
  async launch(appPathOrName, signal = null) {
    return await launchApp(appPathOrName, signal);
  }

  /**
   * Launch application and wait until verified with confirmed HWND
   */
  async launchAndVerify(appPathOrName, { timeoutMs = 10000, signal = null } = {}) {
    const launchRes = await this.launch(appPathOrName, signal);
    const start = Date.now();
    const appClean = String(appPathOrName || '').toLowerCase().replace(/\.exe$/i, '');
    let matchedWin = null;

    while (Date.now() - start < timeoutMs) {
      signal?.throwIfAborted();
      const wins = await this.listWindows(signal);
      const list = Array.isArray(wins?.windows) ? wins.windows : [];
      matchedWin = list.find(w => {
        const title = String(w.title || '').toLowerCase();
        const proc = String(w.process || '').toLowerCase();
        return title.includes(appClean) || proc.includes(appClean);
      });
      if (matchedWin && matchedWin.hwnd) {
        break;
      }
      await new Promise(r => setTimeout(r, 250));
    }

    if (matchedWin && matchedWin.hwnd) {
      await this.focusWindow(matchedWin.hwnd, 'restore', signal);
      await new Promise(r => setTimeout(r, 200));
      return {
        ok: true,
        launched: appPathOrName,
        hwnd: matchedWin.hwnd,
        title: matchedWin.title,
        process: matchedWin.process,
        pid: matchedWin.pid,
      };
    }

    return {
      ok: launchRes?.ok !== false,
      launched: appPathOrName,
      hwnd: launchRes?.hwnd || 0,
      pid: launchRes?.pid || 0,
    };
  }

  /**
   * Clipboard read/write
   */
  async clipboardGet(signal = null) {
    return await runNativeWinAction('clipboard_get', {}, signal);
  }

  async clipboardSet(text, signal = null) {
    return await runNativeWinAction('clipboard_set', { text: String(text || '') }, signal);
  }

  /**
   * Delegate semantic desktop commands directly to ZeroDesktop engine
   */
  async executeSemanticCommand(command, args = [], input = undefined, signal = null) {
    return await this.ZeroDesktop.execute({ command, args, input, headed: true }, signal);
  }
}

export const defaultOsController = new OsController();
