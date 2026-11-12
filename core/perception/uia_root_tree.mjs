/**
 * @fileoverview Windows UI Automation Root Tree Extractor & Zero UIA State Parser
 *
 * Production-grade implementation:
 * - Direct UI Automation COM Root Tree extraction (ControlViewWalker / RawViewWalker)
 * - Traverses desktop windows, dialogs, controls, actionable elements, inputs, and text blocks
 * - Parses and indexes elements according to Zero UIA state specifications:
 *   - Deterministic Element IDs (`uia_1`, `uia_2`, ...) and refs (`@uia:e0`, `@uia:e1`...)
 *   - Bounding boxes `(x, y, width, height)` and exact clickable center points `(cx, cy)`
 *   - Control types (Button, Edit, Document, ComboBox, CheckBox, MenuItem, TabItem, ListItem, Hyperlink)
 *   - AutomationId, Name, ClassName
 *   - IsEnabled, HasKeyboardFocus, and Value state
 * - Clean zero-middleware native execution via Win32 UIAutomation COM layer.
 */

import { runNativeWinAction } from '../../app/zero-control-ui/src/computer/windows-driver.js';

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
        module: 'core/perception/uia_root_tree',
        status: 'online',
        activeWindow: state.activeWindow,
        elementCount: state.elements.length,
        foregroundApp: state.app,
      };
    } catch (err) {
      return {
        healthy: false,
        module: 'core/perception/uia_root_tree',
        status: 'degraded',
        error: err.message,
      };
    }
  }

  /**
   * Extracts the full active window or desktop UI Automation root tree with Zero UIA formatted state
   */
  async extractRootTree({ maxElements = 150, target = null, hwnd = null, signal = null } = {}) {
    signal?.throwIfAborted();

    const uiaRes = await runNativeWinAction('get_elements', { max_elements: maxElements, target, hwnd }, signal);
    const winState = await runNativeWinAction('get_window_state', {}, signal).catch(() => ({}));

    const rawElements = Array.isArray(uiaRes?.elements) ? uiaRes.elements : [];

    // Parse and structure into Zero UIA state format
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
