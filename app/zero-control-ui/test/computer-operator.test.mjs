process.env.ZERO_STRICT_POLICY_TEST = "1";
import assert from "node:assert/strict";
import test from "node:test";

import {
  screenFrameHash,
  settledFrameIsNews,
  ObservationCoordinator,
} from "../src/computer/observation-coordinator.js";
import {
  ComputerOperator,
  COMPUTER_ACTIONS,
  OBSERVATION_ACTIONS,
} from "../src/computer/operator.js";
import {
  createComputerTool,
  ZERO_COMPUTER_TOOL_NAME,
  ZERO_COMPUTER_ACTION_TOOL_NAME,
  ZERO_COMPUTER_TOOL_PARAMETERS,
  createAllComputerTools,
} from "../src/computer/tools.js";

test("Observation Coordinator: frame hashing and deduplication", () => {
  const frame1 = "sample-png-data-turn-1";
  const frame2 = "sample-png-data-turn-2";

  const hash1 = screenFrameHash(frame1);
  const hash2 = screenFrameHash(frame2);

  assert.ok(hash1 && typeof hash1 === "string", "hash1 should be a non-empty string");
  assert.ok(hash2 && typeof hash2 === "string", "hash2 should be a non-empty string");
  assert.notEqual(hash1, hash2, "different frames must produce different hashes");
  assert.equal(screenFrameHash(frame1), hash1, "identical frames must produce identical hashes");

  // settledFrameIsNews
  assert.equal(settledFrameIsNews(undefined, frame1), true, "first frame is always news");
  assert.equal(settledFrameIsNews(hash1, frame1), false, "same frame hash is not news");
  assert.equal(settledFrameIsNews(hash1, frame2), true, "different frame is news");
});

test("Observation Coordinator: metrics and coordinate tracking", () => {
  const coord = new ObservationCoordinator();
  assert.equal(coord.metrics.screenshotsCaptured, 0);
  assert.equal(coord.metrics.screenshotsSentToModel, 0);

  // First observation
  const obs1 = coord.observeFrame("frame-alpha");
  assert.equal(obs1.changed, true);
  assert.equal(coord.metrics.screenshotsCaptured, 1);
  assert.equal(coord.metrics.screenshotsSentToModel, 1);

  // Same frame
  const obs2 = coord.observeFrame("frame-alpha");
  assert.equal(obs2.changed, false);
  assert.equal(coord.metrics.screenshotsCaptured, 2);
  assert.equal(coord.metrics.screenshotsSentToModel, 1); // Not sent again!

  // Note actions
  coord.noteAction(3);
  assert.equal(coord.metrics.computerActions, 3);

  // Reset
  coord.reset();
  assert.equal(coord.metrics.screenshotsCaptured, 0);
  assert.equal(coord.metrics.computerActions, 0);
});

test("Computer Operator: safety arbitration with human hold", () => {
  let policyState = {
    hold: null,
    needsFreshSnapshot: false,
  };

  const operator = new ComputerOperator({
    getPolicyState: () => policyState,
  });

  // 1. When free: input is allowed
  const freeCheck = operator.evaluateSafety("click");
  assert.equal(freeCheck.allowed, true);

  // 2. When held by human: input actions are refused immediately
  policyState.hold = { owner: "operator-1", since: Date.now() };

  const inputCheck = operator.evaluateSafety("click");
  assert.equal(inputCheck.allowed, false);
  assert.equal(inputCheck.error, "computer-hold:human-control");

  const typeCheck = operator.evaluateSafety("type_text");
  assert.equal(typeCheck.allowed, false);
  assert.equal(typeCheck.error, "computer-hold:human-control");

  // Observation is still allowed so operator can monitor
  const observeCheck = operator.evaluateSafety("screenshot");
  assert.equal(observeCheck.allowed, true);

  const windowCheck = operator.evaluateSafety("get_window_state");
  assert.equal(windowCheck.allowed, true);

  // 3. Post-handover freshness gate
  policyState.hold = null;
  policyState.needsFreshSnapshot = true;

  // Non-observation actions are refused until fresh capture
  const staleCheck = operator.evaluateSafety("click");
  assert.equal(staleCheck.allowed, false);
  assert.equal(staleCheck.error, "computer-hold:stale-frame");

  // Screenshot clears the freshness gate
  const clearCheck = operator.evaluateSafety("screenshot");
  assert.equal(clearCheck.allowed, true);
  assert.equal(policyState.needsFreshSnapshot, false, "screenshot should clear needsFreshSnapshot");

  // Now input is allowed again
  const resumeCheck = operator.evaluateSafety("click");
  assert.equal(resumeCheck.allowed, true);
});

test("Computer Tool: declaration and schema contract", () => {
  const tool = createComputerTool();
  assert.equal(tool.name, ZERO_COMPUTER_TOOL_NAME);
  assert.ok(tool.label);
  assert.ok(tool.description);
  assert.deepEqual(tool.parameters, ZERO_COMPUTER_TOOL_PARAMETERS);
  assert.equal(typeof tool.execute, "function");
});

test("Computer Tool: parameter validation and execution", async () => {
  const tool = createComputerTool();

  // Missing action
  const missingRes = await tool.execute("call-1", {});
  assert.ok(missingRes.content[0].text.includes("Missing required parameter"));
  assert.equal(missingRes.details.ok, false);

  // Unknown action
  const unknownRes = await tool.execute("call-2", { action: "fly_to_moon" });
  assert.ok(unknownRes.content[0].text.includes("Unknown action"));
  assert.equal(unknownRes.details.ok, false);

  // Screen size query
  const sizeRes = await tool.execute("call-3", { action: "get_screen_size" });
  assert.equal(sizeRes.details.ok, true);
  assert.ok(sizeRes.details.width > 0);
  assert.ok(sizeRes.details.height > 0);

  // Cursor position query
  const cursorRes = await tool.execute("call-4", { action: "get_cursor_position" });
  assert.equal(cursorRes.details.ok, true);
  assert.equal(typeof cursorRes.details.x, "number");
  assert.equal(typeof cursorRes.details.y, "number");
});

test("Computer Tool: createAllComputerTools factory", () => {
  const tools = createAllComputerTools();
  assert.ok(Array.isArray(tools));
  assert.ok(tools.length >= 1);
  assert.ok(tools.some((t) => t.name === ZERO_COMPUTER_TOOL_NAME));
  assert.ok(tools.some((t) => t.name === ZERO_COMPUTER_ACTION_TOOL_NAME));
});
