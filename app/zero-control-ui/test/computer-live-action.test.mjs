process.env.ZERO_STRICT_POLICY_TEST = "1";
import assert from "node:assert/strict";
import test from "node:test";
import * as Driver from "../src/computer/windows-driver.js";
import { ComputerOperator } from "../src/computer/operator.js";
import {
  createComputerTool,
  createAllComputerTools,
  ZERO_COMPUTER_ACTION_TOOL_NAME,
  ZERO_COMPUTER_TOOL_NAME,
} from "../src/computer/tools.js";

test("Live Windows Driver: Screen geometry and cursor coordinates", async () => {
  const size = await Driver.getScreenSize();
  assert.ok(size.width >= 800, `width should be at least 800, got ${size.width}`);
  assert.ok(size.height >= 600, `height should be at least 600, got ${size.height}`);
  assert.ok(size.scaleFactor >= 1.0, `scale factor should be at least 1.0, got ${size.scaleFactor}`);

  const cursor = await Driver.getCursorPosition();
  assert.equal(typeof cursor.x, "number");
  assert.equal(typeof cursor.y, "number");
});

test("Live Windows Driver: Mouse move, scroll, and wait", async () => {
  const moveRes = await Driver.moveCursor(400, 300);
  assert.equal(moveRes.ok, true);

  const curPos = await Driver.getCursorPosition();
  // Within boundary
  assert.ok(curPos.x >= 0 && curPos.y >= 0);

  const scrollRes = await Driver.scroll({ direction: "down", amount: 2 });
  assert.equal(scrollRes.ok, true);

  const waitRes = await Driver.wait(100);
  assert.equal(waitRes.ok, true);
  assert.equal(waitRes.waitedMs, 100);
});

test("Live Windows Driver: Clipboard set and get roundtrip", async () => {
  const marker = `zero-test-${Date.now()}`;
  const setRes = await Driver.clipboardSet(marker);
  assert.equal(setRes.ok, true);

  const getRes = await Driver.clipboardGet();
  assert.equal(getRes.ok, true);
  assert.equal(getRes.text, marker);
});

test("Live Windows Driver: Window state, window list, and UIA elements", async () => {
  const winState = await Driver.getWindowState();
  assert.equal(winState.ok, true);
  assert.ok("title" in winState);
  assert.ok("bounds" in winState);

  const winList = await Driver.listWindows();
  assert.equal(winList.ok, true);
  assert.ok(Array.isArray(winList.windows));

  const elements = await Driver.getElements();
  assert.equal(elements.ok, true);
  assert.ok(Array.isArray(elements.elements));
  if (elements.elements.length > 0) {
    const el = elements.elements[0];
    assert.ok("name" in el);
    assert.ok("type" in el);
    assert.ok(typeof el.centerX === "number");
    assert.ok(typeof el.centerY === "number");
  }
});

test("ComputerOperator: Human safety bailout integration", async () => {
  let policyState = { hold: null, needsFreshSnapshot: false };
  const operator = new ComputerOperator({ getPolicyState: () => policyState });

  // Simulate human bailout trigger
  operator.handleHumanBailout("Physical mouse movement detected");
  assert.equal(operator.humanHold, true);
  assert.ok(policyState.hold);
  assert.equal(policyState.needsFreshSnapshot, true);

  // Subsequent input must be refused immediately
  const res = await operator.execute("click", { x: 100, y: 100 });
  assert.equal(res.ok, false);
  assert.equal(res.error, "computer-hold:human-control");

  // Observation is still permitted
  const obsRes = await operator.execute("get_screen_size", {});
  assert.equal(obsRes.ok, true);

  // Releasing hold requires fresh snapshot
  operator.setHumanHold(false);
  policyState.hold = null;
  const staleRes = await operator.execute("click", { x: 100, y: 100 });
  assert.equal(staleRes.ok, false);
  assert.equal(staleRes.error, "computer-hold:stale-frame");

  // Screenshot clears fresh snapshot gate
  await operator.execute("screenshot", {});
  const allowedRes = await operator.execute("move", { x: 200, y: 200 });
  assert.equal(allowedRes.ok, true);
});

test("zero_computer_action Tool: Execute Observe -> Act -> Verify pattern", async () => {
  const tools = createAllComputerTools();
  const actionTool = tools.find((t) => t.name === ZERO_COMPUTER_ACTION_TOOL_NAME);
  assert.ok(actionTool, "zero_computer_action tool must be registered");

  // 1. Observe
  const observeRes = await actionTool.execute("call-obs", { action: "get_elements" });
  assert.equal(observeRes.details.ok, true);
  assert.ok(observeRes.content[0].text.length > 0);

  // 2. Act (type text into clipboard/active app)
  const actRes = await actionTool.execute("call-act", {
    action: "clipboard_set",
    text: "Hello from Zero Computer Action",
  });
  assert.equal(actRes.details.ok, true);

  // 3. Verify
  const verifyRes = await actionTool.execute("call-ver", { action: "clipboard_get" });
  assert.equal(verifyRes.details.ok, true);
  assert.equal(verifyRes.details.text, "Hello from Zero Computer Action");

  // Clean up daemon
  Driver.getInputDaemon().stop();
});
