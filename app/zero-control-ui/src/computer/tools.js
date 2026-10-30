/**
 * Model-Facing Computer Tools for Zero.
 * Adapted from OpenMausBot (Apache-2.0, non-enterprise core).
 *
 * Exposes full computer-use and desktop automation to the Zero agent:
 * - zero_computer_action: Primary native OS executor
 * - zero_computer: Unified action dispatcher (alias)
 */

import { ComputerOperator } from "./operator.js";

const coordinate = { type: "integer", minimum: 0, maximum: 32767 };

export const ZERO_COMPUTER_ACTION_TOOL_NAME = "zero_computer_action";
export const ZERO_COMPUTER_TOOL_NAME = "zero_computer";

export const ZERO_COMPUTER_TOOL_PARAMETERS = Object.freeze({
  type: "object",
  required: ["action"],
  additionalProperties: false,
  properties: {
    action: {
      type: "string",
      enum: [
        "mouse_move",
        "move",
        "left_click",
        "right_click",
        "double_click",
        "middle_click",
        "click",
        "mouse_drag",
        "drag",
        "scroll",
        "type_text",
        "type",
        "press_key",
        "press",
        "hotkey",
        "wait",
        "screenshot",
        "get_screen_size",
        "get_cursor_position",
        "get_cursor",
        "get_window_state",
        "list_windows",
        "list_apps",
        "focus_window",
        "control_window",
        "bring_to_front",
        "open_app",
        "launch_app",
        "open_url",
        "clipboard_get",
        "clipboard_set",
        "get_elements",
        "get_uia_elements",
      ],
      description: "Computer action to perform on the user's PC.",
    },
    x: { ...coordinate, description: "X pixel coordinate on primary screen." },
    y: { ...coordinate, description: "Y pixel coordinate on primary screen." },
    to_x: { ...coordinate, description: "Drag destination X coordinate." },
    to_y: { ...coordinate, description: "Drag destination Y coordinate." },
    from_x: { ...coordinate, description: "Drag start X coordinate." },
    from_y: { ...coordinate, description: "Drag start Y coordinate." },
    button: {
      type: "string",
      enum: ["left", "middle", "right"],
      default: "left",
      description: "Mouse button to click.",
    },
    count: {
      type: "integer",
      minimum: 1,
      maximum: 3,
      default: 1,
      description: "Click count: 1 for single click, 2 for double click, 3 for triple click.",
    },
    text: {
      type: "string",
      maxLength: 10000,
      description: "Unicode text to type into the focused application or set to clipboard.",
    },
    key: {
      type: "string",
      maxLength: 100,
      description: "Key or shortcut to press (e.g. 'enter', 'tab', 'escape', 'ctrl+c', 'ctrl+v', 'alt+tab', 'win+r').",
    },
    direction: {
      type: "string",
      enum: ["up", "down", "left", "right"],
      default: "down",
      description: "Wheel scroll direction.",
    },
    amount: {
      type: "integer",
      minimum: 1,
      maximum: 30,
      default: 3,
      description: "Wheel scroll amount.",
    },
    ms: {
      type: "integer",
      minimum: 50,
      maximum: 10000,
      default: 500,
      description: "Wait time in milliseconds.",
    },
    app: {
      type: "string",
      maxLength: 500,
      description: "Name or path of application to launch (e.g. 'notepad', 'calc', 'chrome').",
    },
    url: {
      type: "string",
      maxLength: 2000,
      description: "Web URL to open in default browser (must start with http:// or https://).",
    },
    target: {
      description: "Window title or process ID to focus or control.",
    },
    command: {
      type: "string",
      enum: ["restore", "minimize", "maximize", "close"],
      default: "restore",
      description: "Window control command.",
    },
  },
});

function toolResult(text, details = {}, extraContent = []) {
  const content = [{ type: "text", text }, ...extraContent];
  return { content, details };
}

/**
 * Creates a computer action tool for the agent.
 */
export function createComputerTool({ toolName = ZERO_COMPUTER_TOOL_NAME, operator } = {}) {
  const op = operator || new ComputerOperator();

  return {
    name: toolName,
    label: toolName === ZERO_COMPUTER_ACTION_TOOL_NAME ? "Execute Computer Action" : "Operate Computer",
    description:
      "Directly operate the user's Windows computer: move mouse, click, drag, scroll, type text, press keyboard shortcuts, list/focus windows, launch applications, manipulate clipboard, and inspect clickable UI Automation elements.",
    parameters: ZERO_COMPUTER_TOOL_PARAMETERS,
    async execute(_toolCallId, params, signal) {
      signal?.throwIfAborted?.();
      const actualParams =
        params && typeof params === "object" && params.args && typeof params.args === "object"
          ? { ...params.args, ...params }
          : params || {};
      const action = actualParams?.action;
      if (!action) {
        return toolResult("Missing required parameter: 'action'.", { ok: false });
      }

      const res = await op.execute(action, actualParams, signal);
      if (!res.ok) {
        return toolResult(`Computer action '${action}' failed: ${res.message || res.error}`, res);
      }

      if (action === "screenshot" && res.data) {
        return toolResult(
          `Screenshot captured successfully (${res.width || 1920}x${res.height || 1080}, ${res.mimeType || "image/png"}).`,
          res,
          [{ type: "image", mimeType: res.mimeType || "image/png", data: res.data }],
        );
      }

      if (action === "get_elements" || action === "get_uia_elements") {
        const count = res.count || 0;
        const summary = (res.elements || [])
          .slice(0, 15)
          .map(
            (e) =>
              `- [${e.type}] "${e.name}" at center (${e.centerX}, ${e.centerY}), bounds: (${e.x}, ${e.y}, ${e.width}x${e.height})`,
          )
          .join("\n");
        return toolResult(
          `Found ${count} clickable elements in foreground window:\n${summary}${count > 15 ? `\n...and ${count - 15} more` : ""}`,
          res,
        );
      }

      if (action === "list_windows") {
        const count = res.count || 0;
        const summary = (res.windows || [])
          .slice(0, 10)
          .map((w) => `- "${w.title}" (Process: ${w.process}, PID: ${w.pid}${w.isForeground ? ", Active" : ""})`)
          .join("\n");
        return toolResult(`Open desktop windows (${count}):\n${summary}`, res);
      }

      return toolResult(
        `Computer action '${action}' succeeded: ${JSON.stringify(res)}`,
        res,
      );
    },
  };
}

/**
 * Create all computer tools for registration.
 */
export function createAllComputerTools({ getPolicyState = null, logger = console } = {}) {
  const operator = new ComputerOperator({ getPolicyState, logger });
  return [
    createComputerTool({ toolName: ZERO_COMPUTER_ACTION_TOOL_NAME, operator }),
    createComputerTool({ toolName: ZERO_COMPUTER_TOOL_NAME, operator }),
  ];
}
