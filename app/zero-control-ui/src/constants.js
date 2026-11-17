/**
 * Shared constants for the native Zero Control UI contribution.
 */

const PLUGIN_ID = "zero-control-ui";

/**
 * Gateway method owned by the Zero policy plugin (backend/plugin). The control
 * panel below is only a thin client for the canonical hold state; the built-in
 * Desktop panel still owns viewing and input. Never open a second transport.
 */
const COMPUTER_CONTROL_METHOD = "zero.computer.control";

/** Reviewed first skill candidate from built-in intake. This is a
 * display/lifecycle link only; install, enable, and updates remain native. */
const REVIEWED_SKILL = "subagent-echo-check";
const TEAM_ROLES = ["Lead", "Researcher", "Operator"];

export { PLUGIN_ID, COMPUTER_CONTROL_METHOD, REVIEWED_SKILL, TEAM_ROLES };
