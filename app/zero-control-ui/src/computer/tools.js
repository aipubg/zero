/**
 * Model-Facing Computer Tools for Zero.
 * Adapted from OpenMausBot (Apache-2.0, non-enterprise core).
 *
 * Exposes full computer-use and desktop automation to the Zero agent:
 * - zero_computer: Unified action dispatcher
 * - zero_computer_click: Fast coordinate mouse clicks
 * - zero_computer_type: Fast Unicode text typing
 * - zero_computer_key: Keyboard shortcuts and keys
 * - zero_computer_screenshot: Desktop screen observation
 * - zero_computer_app: Application and window management
 */

import { ComputerOperator } from "./operator.js";

const coordinate = { type: "integer", minimum: 0, maximum: 32767 };

export const ZERO_COMPUTER_TOOL_NAME = "zero_computer";

export const ZERO_COMPUTER_TOOL_PARAMETERS = Object.freeze({
  type: "object",
  required: ["action"],
  additionalProperties: false,
  properties: {
    action: {
      type: "string",
      enum: [
        "screenshot",
        "get_screen_size",
        "get_cursor_position",
        "click",
        "move",
        "drag",
        "scroll",
        "type_text",
        "press_key",
        "get_window_state",
        "list_windows",
        "list_apps",
        "launch_app",
        "open_url",
        "bring_to_front",
      ],
      description: "Computer action to perform on the user's PC.",
    },
    x: { ...coordinate, description: "X pixel coordinate on primary screen." },
    y: { ...coordinate, description: "Y pixel coordinate on primary screen." },
    to_x: { ...coordinate, description: "Drag destination X coordinate." },
    to_y: { ...coordinate, description: "Drag destination Y coordinate." },
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
      description: "Unicode text to type into the focused input or application.",
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
      description: "Window title or process ID to bring to front.",
    },
  },
});

function toolResult(text, details = {}, extraContent = []) {
  const content = [{ type: "text", text }, ...extraContent];
  return { content, details };
}

/**
 * Creates the main zero_computer tool.
 */
export function createComputerTool({ operator } = {}) {
  const op = operator || new ComputerOperator();

  return {
    name: ZERO_COMPUTER_TOOL_NAME,
    label: "Operate Computer",
    description:
      "Directly operate the user's computer: take screenshots, move pointer, click, drag, scroll, type text, press keyboard shortcuts, list/launch applications, and manage windows.",
    parameters: ZERO_COMPUTER_TOOL_PARAMETERS,
    async execute(_toolCallId, params, signal) {
      signal?.throwIfAborted?.();
      const actualParams = (params && typeof params === "object" && params.args && typeof params.args === "object")
        ? { ...params.args, ...params }
        : (params || {});
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
          [{ type: "image", mimeType: res.mimeType || "image/png", data: res.data }]
        );
      }

      return toolResult(
        `Computer action '${action}' succeeded: ${JSON.stringify(res)}`,
        res
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
    createComputerTool({ operator }),
  ];
}
