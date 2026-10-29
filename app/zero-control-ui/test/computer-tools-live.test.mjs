import test from "node:test";
import assert from "node:assert/strict";
import { ComputerOperator } from "../src/computer/operator.js";
import { createComputerTool, ZERO_COMPUTER_TOOL_NAME } from "../src/computer/tools.js";

test("ComputerOperator: initial state and driver setup", () => {
  const op = new ComputerOperator();
  assert.equal(op.humanHold, false);
  assert.equal(op.requireFreshSnapshot, false);
  assert.ok(op.coordinator);
});

test("ComputerOperator: get_screen_size returns valid dimensions", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("get_screen_size", {});
  assert.equal(res.ok, true);
  assert.equal(res.action, "get_screen_size");
  assert.ok(typeof res.width === "number" && res.width > 0);
  assert.ok(typeof res.height === "number" && res.height > 0);
  assert.ok(typeof res.scaleFactor === "number" && res.scaleFactor >= 1);
});

test("ComputerOperator: get_cursor_position returns coordinates", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("get_cursor_position", {});
  assert.equal(res.ok, true);
  assert.equal(res.action, "get_cursor_position");
  assert.ok(typeof res.x === "number");
  assert.ok(typeof res.y === "number");
});

test("ComputerOperator: move cursor within bounds", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("move", { x: 500, y: 500 });
  assert.equal(res.ok, true);
  assert.equal(res.action, "move");
  assert.equal(res.x, 500);
  assert.equal(res.y, 500);
});

test("ComputerOperator: click mouse safely", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("click", { x: 500, y: 500, button: "left", count: 1 });
  assert.equal(res.ok, true);
  assert.equal(res.action, "click");
  assert.equal(res.button, "left");
});

test("ComputerOperator: drag mouse", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("drag", { x: 400, y: 400, to_x: 450, to_y: 450 });
  assert.equal(res.ok, true);
  assert.equal(res.action, "drag");
});

test("ComputerOperator: scroll mouse wheel", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("scroll", { direction: "down", amount: 2 });
  assert.equal(res.ok, true);
  assert.equal(res.action, "scroll");
  assert.equal(res.direction, "down");
});

test("ComputerOperator: get_window_state returns foreground info", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("get_window_state", {});
  assert.equal(res.ok, true);
  assert.equal(res.action, "get_window_state");
  assert.ok(res.window);
  assert.ok(typeof res.window.title === "string");
});

test("ComputerOperator: list_apps returns application list or report", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("list_apps", {});
  assert.equal(res.ok, true);
  assert.equal(res.action, "list_apps");
  assert.ok(Array.isArray(res.apps) || typeof res.text === "string");
});

test("ComputerOperator: screenshot produces base64 image", async () => {
  const op = new ComputerOperator();
  const res = await op.execute("screenshot", {});
  assert.equal(res.ok, true);
  assert.equal(res.action, "screenshot");
  assert.ok(res.data && res.data.length > 0);
  assert.equal(res.mimeType, "image/png");
});

test("ComputerOperator: human hold blocks actions", async () => {
  const op = new ComputerOperator();
  op.setHumanHold(true);
  const res = await op.execute("click", { x: 100, y: 100 });
  assert.equal(res.ok, false);
  assert.equal(res.error, "computer-hold:human-control");
  op.setHumanHold(false);
  const resAfter = await op.execute("get_cursor_position", {});
  assert.equal(resAfter.ok, true);
});

test("ComputerOperator: freshness gate blocks input before observation after hold release", async () => {
  const op = new ComputerOperator({ requireFreshSnapshotAfterRelease: true });
  op.setHumanHold(true);
  op.setHumanHold(false); // Released: requireFreshSnapshot is now true
  assert.equal(op.requireFreshSnapshot, true);

  // Should block input actions
  const blocked = await op.execute("click", { x: 100, y: 100 });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error, "computer-hold:stale-frame");

  // An observation action clears the freshness requirement
  const obs = await op.execute("screenshot", {});
  assert.equal(obs.ok, true);
  assert.equal(op.requireFreshSnapshot, false);

  // Now input action succeeds
  const unblocked = await op.execute("click", { x: 100, y: 100 });
  assert.equal(unblocked.ok, true);
});

test("createComputerTool: tool executes zero_computer actions cleanly", async () => {
  const tool = createComputerTool();
  assert.equal(tool.name, ZERO_COMPUTER_TOOL_NAME);

  const res1 = await tool.execute("call-1", { action: "get_screen_size" });
  assert.ok(res1.content);
  assert.equal(res1.content[0].type, "text");
  assert.ok(res1.content[0].text.includes("succeeded"));
  assert.equal(res1.details.ok, true);

  const res2 = await tool.execute("call-2", { action: "get_cursor_position" });
  assert.equal(res2.details.ok, true);

  const res3 = await tool.execute("call-3", { action: "screenshot" });
  assert.equal(res3.details.ok, true);
  assert.ok(res3.content.some((c) => c.type === "image"));

  const resInvalid = await tool.execute("call-4", {});
  assert.equal(resInvalid.details.ok, false);
});
