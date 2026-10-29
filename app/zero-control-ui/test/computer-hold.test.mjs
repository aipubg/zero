import assert from "node:assert/strict";
import test from "node:test";

import {
  createComputerHold,
  holdView,
  mountComputerHold,
  normalizeSnapshot,
} from "../src/computer/hold.js";
import { COMPUTER_CONTROL_METHOD } from "../src/constants.js";
import {
  canReuseComputerHold,
  computerSurfaceAction,
  handBackComputer,
} from "../src/native-surfaces.js";
import { FakeElement, installFakeDocument } from "./fake-dom.mjs";

/*
 * Offline coverage for the Zero computer-control hold client.
 *
 * These tests exercise the RPC state machine and the native-surface mount
 * against a fake Gateway. They prove client behavior only: no desktop was
 * observed, no CUA action ran, and no live Gateway was contacted.
 */

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function fakeGateway() {
  const calls = [];
  const queue = [];
  const request = (method, params) => {
    calls.push({ method, params });
    const next = queue.shift();
    if (!next) return Promise.reject(new Error(`unexpected request: ${method}`));
    if (next instanceof Error) return Promise.reject(next);
    if (typeof next === "function") return next();
    return Promise.resolve(next);
  };
  return { calls, queue, request };
}

function freeSnapshot() {
  return {
    held: false,
    owned: false,
    scope: "global",
    resumeSnapshotRequired: true,
    stats: { takes: 1, refusals: 0 },
    recent: [],
  };
}

function heldSnapshot(leaseId = "lease-1") {
  return {
    held: true,
    owned: true,
    scope: "global",
    controlLeaseId: leaseId,
    since: 1761450000000,
    resumeSnapshotRequired: false,
    stats: { takes: 1, refusals: 0 },
    recent: [],
  };
}

function otherSnapshot() {
  return {
    held: true,
    owned: false,
    scope: "global",
    since: 1761450000000,
    resumeSnapshotRequired: false,
    stats: { takes: 1, refusals: 0 },
    recent: [],
  };
}

/** Minimal window for the pagehide/online/offline listeners in mountComputerHold. */
function installFakeWindow() {
  const listeners = new Map();
  const win = {
    addEventListener(type, listener) {
      const list = listeners.get(type) ?? [];
      list.push(listener);
      listeners.set(type, list);
    },
    removeEventListener(type, listener) {
      const list = listeners.get(type) ?? [];
      const index = list.indexOf(listener);
      if (index >= 0) list.splice(index, 1);
    },
    dispatch(type) {
      for (const listener of [...(listeners.get(type) ?? [])]) listener({ type });
    },
    listenerCount(type) {
      return (listeners.get(type) ?? []).length;
    },
  };
  globalThis.window = win;
  return win;
}

test("normalizeSnapshot rejects unusable payloads instead of guessing", () => {
  assert.equal(normalizeSnapshot(null), null);
  assert.equal(normalizeSnapshot(undefined), null);
  assert.equal(normalizeSnapshot("held"), null);
  assert.equal(normalizeSnapshot([]), null);
  assert.equal(normalizeSnapshot({}), null);
  assert.equal(normalizeSnapshot({ held: "true" }), null);
});

test("normalizeSnapshot keeps canonical fields and drops lease aliases", () => {
  const snapshot = normalizeSnapshot({
    held: true,
    owned: true,
    scope: "global",
    controlLeaseId: "lease-9",
    leaseId: "alias-must-not-be-used",
    since: "not-a-number",
    reason: "owner",
  });
  assert.equal(snapshot.held, true);
  assert.equal(snapshot.owned, true);
  assert.equal(snapshot.scope, "global");
  assert.equal(snapshot.controlLeaseId, "lease-9");
  assert.equal(snapshot.leaseId, undefined);
  assert.equal(snapshot.since, null);
  assert.equal(snapshot.reason, "owner");
});

test("holdView reports every explicit state without inferring ownership", () => {
  assert.equal(holdView({ phase: "loading" }).state, "loading");
  assert.equal(holdView({ phase: "unavailable" }).state, "unavailable");
  assert.equal(holdView({ phase: "ready", snapshot: null }).state, "unknown");
  assert.equal(
    holdView({ phase: "ready", snapshot: normalizeSnapshot(freeSnapshot()) }).state,
    "free",
  );
  assert.equal(
    holdView({ phase: "ready", snapshot: normalizeSnapshot(heldSnapshot()) }).state,
    "held-this-client",
  );
  assert.equal(
    holdView({ phase: "ready", snapshot: normalizeSnapshot(otherSnapshot()) }).state,
    "held-other",
  );

  // owned=true without a lease is not this client's hold.
  const noLease = holdView({
    phase: "ready",
    snapshot: normalizeSnapshot({ held: true, owned: true, scope: "global" }),
  });
  assert.equal(noLease.state, "held-other");
  assert.equal(noLease.canRelease, false);
  assert.equal(noLease.releaseLeaseId, null);
  assert.match(noLease.detail, /no usable release lease/i);
});

test("holdView exposes the global scope and never exposes a lease in the label", () => {
  const view = holdView({
    phase: "ready",
    snapshot: normalizeSnapshot(heldSnapshot("lease-secret")),
  });
  assert.equal(view.scope, "Global hold · all sessions");
  assert.equal(view.label, "Held by you");
  assert.equal(view.releaseLeaseId, "lease-secret");
  assert.doesNotMatch(JSON.stringify({ ...view, releaseLeaseId: null }), /lease-secret/);
  assert.equal(
    holdView({ phase: "ready", snapshot: normalizeSnapshot({ ...freeSnapshot(), scope: "session" }) })
      .scope,
    "Session hold",
  );
});

test("disconnected state overrides a cached snapshot and forbids actions", () => {
  const view = holdView({
    phase: "ready",
    snapshot: normalizeSnapshot(heldSnapshot()),
    connected: false,
  });
  assert.equal(view.state, "unknown");
  assert.equal(view.connected, false);
  assert.equal(view.canTake, false);
  assert.equal(view.canRelease, false);
  assert.equal(view.releaseLeaseId, null);
  assert.match(view.detail, /disconnected/i);
});

test("refresh uses the canonical method and action and applies the snapshot", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: freeSnapshot() });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });

  const view = await hold.refresh();
  assert.deepEqual(gateway.calls, [
    { method: COMPUTER_CONTROL_METHOD, params: { action: "status" } },
  ]);
  assert.equal(view.state, "free");
  assert.equal(view.canTake, true);
  assert.equal(view.resumeSnapshotRequired, true);
  hold.dispose();
});

test("take and release use action/controlLeaseId with no leaseId alias", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: freeSnapshot() });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();

  gateway.queue.push({ result: heldSnapshot("lease-1") });
  const held = await hold.take();
  assert.equal(held.state, "held-this-client");
  assert.equal(held.canRelease, true);
  assert.deepEqual(gateway.calls[1], {
    method: COMPUTER_CONTROL_METHOD,
    params: { action: "take" },
  });

  gateway.queue.push({ result: freeSnapshot() });
  const released = await hold.release();
  assert.equal(released.state, "free");
  assert.deepEqual(gateway.calls[2], {
    method: COMPUTER_CONTROL_METHOD,
    params: { action: "release", controlLeaseId: "lease-1" },
  });
  assert.equal("leaseId" in gateway.calls[2].params, false);
  hold.dispose();
});

test("a duplicate take click while one is in flight sends only one request", async () => {
  const gateway = fakeGateway();
  const pending = deferred();
  gateway.queue.push(() => pending.promise);
  const hold = createComputerHold({ request: gateway.request, autoStart: false });

  const first = hold.take();
  const second = hold.take();
  assert.equal(gateway.calls.length, 1);
  assert.equal(hold.view().busy, true);
  assert.equal(hold.view().canTake, false);

  pending.resolve({ result: heldSnapshot() });
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a.state, "held-this-client");
  assert.equal(b.state, "loading", "the duplicate click observed the in-flight state");
  assert.equal(hold.view().state, "held-this-client");
  assert.equal(gateway.calls.length, 1);
  hold.dispose();
});

test("a status response that predates take is ignored", async () => {
  const gateway = fakeGateway();
  const stale = deferred();
  gateway.queue.push(() => stale.promise);
  const hold = createComputerHold({ request: gateway.request, autoStart: false });

  const refreshing = hold.refresh();
  gateway.queue.push({ result: heldSnapshot("lease-2") });
  const taken = await hold.take();
  assert.equal(taken.state, "held-this-client");

  stale.resolve({ result: freeSnapshot() });
  await refreshing;
  assert.equal(hold.view().state, "held-this-client");
  assert.equal(hold.view().releaseLeaseId, "lease-2");
  hold.dispose();
});

test("a take conflict re-reads status instead of claiming success", async () => {
  const gateway = fakeGateway();
  gateway.queue.push(new Error("computer-hold:already-held"));
  gateway.queue.push({ result: otherSnapshot() });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });

  const view = await hold.take();
  assert.equal(view.state, "held-other");
  assert.equal(view.canRelease, false);
  assert.match(view.detail, /global and affects all sessions/i);
  assert.deepEqual(
    gateway.calls.map((call) => call.params.action),
    ["take", "status"],
  );
  hold.dispose();
});

test("a rejected release drops the lease and never renders success", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: heldSnapshot("lease-3") });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();

  gateway.queue.push(new Error("computer-hold:lease-invalid"));
  gateway.queue.push({ result: otherSnapshot() });
  const view = await hold.release();
  assert.equal(view.state, "held-other");
  assert.equal(view.releaseLeaseId, null);
  assert.equal(view.canRelease, false);
  // The authoritative re-read clears the transient error; it never shows success.
  assert.equal(view.error, null);
  assert.deepEqual(
    gateway.calls.map((call) => call.params.action),
    ["status", "release", "status"],
  );
  hold.dispose();
});

test("release without a lease never calls the Gateway", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: freeSnapshot() });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();
  const callsBefore = gateway.calls.length;

  const view = await hold.release();
  assert.equal(view.state, "unknown");
  assert.equal(gateway.calls.length, callsBefore);
  hold.dispose();
});

test("a missing method renders unavailable, not free", async () => {
  const gateway = fakeGateway();
  gateway.queue.push(new Error("unknown method zero.computer.control"));
  const hold = createComputerHold({ request: gateway.request, autoStart: false });

  const view = await hold.refresh();
  assert.equal(view.state, "unavailable");
  assert.equal(view.canTake, false);
  assert.match(view.detail, /does not expose zero\.computer\.control/i);
  hold.dispose();
});

test("a malformed snapshot renders unknown, not free", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: { held: "no" } });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });

  const view = await hold.refresh();
  assert.equal(view.state, "unknown");
  assert.equal(view.canRelease, false);
  // A take is still offered: the backend arbitrates it authoritatively.
  assert.equal(view.canTake, true);
  assert.match(view.detail, /unknown, not free/i);
  hold.dispose();
});

test("disconnect clears the lease, blocks actions, and reconnect re-reads state", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: heldSnapshot("lease-4") });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();
  assert.equal(hold.view().state, "held-this-client");

  const offline = hold.setConnected(false);
  assert.equal(offline.state, "unknown");
  assert.equal(offline.releaseLeaseId, null);
  assert.equal(offline.canRelease, false);
  assert.equal(offline.canTake, false);

  const callsBefore = gateway.calls.length;
  const refused = await hold.release();
  assert.equal(refused.state, "unknown");
  assert.equal(gateway.calls.length, callsBefore, "no release attempt while offline");

  gateway.queue.push({ result: freeSnapshot() });
  const online = await hold.setConnected(true);
  assert.equal(online.state, "free");
  assert.equal(gateway.calls.length, callsBefore + 1);
  assert.deepEqual(gateway.calls.at(-1).params, { action: "status" });
  hold.dispose();
});

test("a stale status that resolves after a disconnect is ignored", async () => {
  const gateway = fakeGateway();
  const stale = deferred();
  gateway.queue.push(() => stale.promise);
  const hold = createComputerHold({ request: gateway.request, autoStart: false });

  const refreshing = hold.refresh();
  hold.setConnected(false);
  stale.resolve({ result: heldSnapshot("lease-5") });
  await refreshing;
  assert.equal(hold.view().state, "unknown");
  assert.equal(hold.view().releaseLeaseId, null);
  hold.dispose();
});

test("dispose stops emitting and ignores late responses", async () => {
  const gateway = fakeGateway();
  const pending = deferred();
  gateway.queue.push(() => pending.promise);
  let updates = 0;
  const hold = createComputerHold({
    request: gateway.request,
    autoStart: false,
    onState: () => {
      updates += 1;
    },
  });

  const refreshing = hold.refresh();
  const before = updates;
  hold.dispose();
  pending.resolve({ result: freeSnapshot() });
  await refreshing;
  assert.equal(updates, before);
});

test("the hold wrapper is reused only while attached and populated", () => {
  const desktop = new FakeElement("div");
  const hostEl = new FakeElement("div");
  const bar = new FakeElement("section");
  bar.className = "zero-computer-hold";

  desktop.append(hostEl);
  assert.equal(canReuseComputerHold(desktop, { hostEl }), false, "empty wrapper");
  hostEl.append(bar);
  assert.equal(canReuseComputerHold(desktop, { hostEl }), true, "attached and populated");

  hostEl.remove();
  assert.equal(canReuseComputerHold(desktop, { hostEl }), false, "detached wrapper");

  // The bar itself is never the wrapper; the old check assumed its parent was
  // the Desktop element, which re-mounted on every observer tick.
  desktop.append(bar);
  assert.equal(canReuseComputerHold(desktop, { hostEl: bar }), false);
  assert.equal(canReuseComputerHold(desktop, null), false);
});

test("mountComputerHold renders the hold bar with explicit state and actions", async () => {
  installFakeDocument();
  try {
    const gateway = fakeGateway();
    const container = new FakeElement("div");
    const host = { request: gateway.request, connection: { connected: true } };
    const mounted = mountComputerHold(container, host, { autoStart: false });

    const section = container.children[0];
    assert.equal(section.className, "zero-computer-hold");
    assert.equal(section.getAttribute("data-zero-computer-hold"), "");
    assert.equal(section.getAttribute("data-state"), "loading");

    const buttons = section.children
      .flatMap((child) => child.children ?? [])
      .filter((node) => node.className === "zero-computer-hold__button");
    assert.deepEqual(
      buttons.map((button) => button.getAttribute("data-action")),
      ["take", "release", "refresh"],
    );
    assert.equal(buttons[0].disabled, true, "take is disabled while loading");
    assert.equal(buttons[1].disabled, true, "release is disabled while loading");

    gateway.queue.push({ result: freeSnapshot() });
    await mounted.refresh();
    assert.equal(section.getAttribute("data-state"), "free");
    assert.equal(buttons[0].disabled, false);
    assert.equal(buttons[1].disabled, true);
    assert.match(section.textContent, /Global hold · all sessions/);
    assert.match(section.textContent, /fresh desktop/i);

    gateway.queue.push({ result: heldSnapshot("lease-6") });
    await mounted.take();
    assert.equal(section.getAttribute("data-state"), "held-this-client");
    assert.match(section.textContent, /You hold computer control/);
    assert.equal(buttons[0].disabled, true);
    assert.equal(buttons[1].disabled, false);

    gateway.queue.push({ result: freeSnapshot() });
    await mounted.release();
    assert.equal(section.getAttribute("data-state"), "free");
    assert.match(section.textContent, /Computer control is free/);
    assert.equal(buttons[1].disabled, true);

    mounted.dispose();
    assert.equal(container.children.length, 0);
  } finally {
    delete globalThis.document;
  }
});

test("mountComputerHold shows a Gateway error instead of a success state", async () => {
  installFakeDocument();
  try {
    const gateway = fakeGateway();
    const container = new FakeElement("div");
    const mounted = mountComputerHold(
      container,
      { request: gateway.request, connection: { connected: true } },
      { autoStart: false },
    );

    gateway.queue.push(new Error("Gateway connection is unavailable."));
    await mounted.refresh();
    const section = container.children[0];
    assert.equal(section.getAttribute("data-state"), "unknown");
    assert.match(section.textContent, /Gateway connection is unavailable/);
    assert.doesNotMatch(section.textContent, /Computer control is free/);
    mounted.dispose();
  } finally {
    delete globalThis.document;
  }
});

/*
 * Leaving the Desktop surface. OpenMausBot's Apache-2.0 computer-takeover
 * pattern (behavior only, no source copied): closing the panel, leaving the
 * view, or closing the page hands back only the hold this view took.
 */

test("leave hands back this client's hold once and stops acting", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: heldSnapshot("lease-leave") });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();
  const callsBefore = gateway.calls.length;

  gateway.queue.push({ result: freeSnapshot() });
  hold.leave();
  assert.equal(gateway.calls.length, callsBefore + 1);
  assert.deepEqual(gateway.calls.at(-1), {
    method: COMPUTER_CONTROL_METHOD,
    params: { action: "release", controlLeaseId: "lease-leave" },
  });

  // Disposed: no poll, take, or second release may follow the hand-back.
  await hold.refresh();
  await hold.take();
  assert.equal(gateway.calls.length, callsBefore + 1);
  hold.dispose();
});

test("leave never releases a hold this client does not own", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: otherSnapshot() });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();
  const callsBefore = gateway.calls.length;

  hold.leave();
  assert.equal(gateway.calls.length, callsBefore, "another client's hold is untouched");

  gateway.queue.push({ result: freeSnapshot() });
  const free = createComputerHold({ request: gateway.request, autoStart: false });
  await free.refresh();
  const freeCalls = gateway.calls.length;
  free.leave();
  assert.equal(gateway.calls.length, freeCalls, "a free computer needs no release");
  hold.dispose();
  free.dispose();
});

test("leave while disconnected sends nothing", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: heldSnapshot("lease-offline") });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();
  hold.setConnected(false);
  const callsBefore = gateway.calls.length;

  hold.leave();
  assert.equal(gateway.calls.length, callsBefore);
  hold.dispose();
});

test("dispose alone never hands back a hold", async () => {
  // A host re-render removes and re-creates the wrapper while the user is
  // still on Systems. Releasing there would silently end a human hold.
  const gateway = fakeGateway();
  gateway.queue.push({ result: heldSnapshot("lease-render") });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();
  const callsBefore = gateway.calls.length;

  hold.dispose();
  assert.equal(gateway.calls.length, callsBefore);
});

test("a take in flight when leaving releases the lease it returns", async () => {
  const gateway = fakeGateway();
  const pending = deferred();
  gateway.queue.push(() => pending.promise);
  const hold = createComputerHold({ request: gateway.request, autoStart: false });

  const taking = hold.take();
  hold.leave();
  assert.equal(gateway.calls.length, 1, "only the take has been sent");

  gateway.queue.push({ result: freeSnapshot() });
  pending.resolve({ result: heldSnapshot("lease-late") });
  await taking;
  await Promise.resolve();
  assert.deepEqual(gateway.calls.at(-1).params, {
    action: "release",
    controlLeaseId: "lease-late",
  });
  hold.dispose();
});

test("a release already in flight is not duplicated when leaving", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: heldSnapshot("lease-dup") });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();

  const pending = deferred();
  gateway.queue.push(() => pending.promise);
  const releasing = hold.release();
  hold.leave();
  assert.equal(gateway.calls.length, 2, "status and the single release");

  pending.resolve({ result: freeSnapshot() });
  await releasing;
  assert.equal(gateway.calls.length, 2);
  hold.dispose();
});

test("pagehide hands back this view's hold and dispose removes the listener", async () => {
  installFakeDocument();
  const win = installFakeWindow();
  try {
    const gateway = fakeGateway();
    const container = new FakeElement("div");
    const mounted = mountComputerHold(
      container,
      { request: gateway.request, connection: { connected: true } },
      { autoStart: false },
    );

    gateway.queue.push({ result: heldSnapshot("lease-page") });
    await mounted.refresh();
    const section = container.children[0];
    assert.equal(section.getAttribute("data-state"), "held-this-client");
    assert.match(section.textContent, /leave this screen/i);

    gateway.queue.push({ result: freeSnapshot() });
    win.dispatch("pagehide");
    assert.deepEqual(gateway.calls.at(-1).params, {
      action: "release",
      controlLeaseId: "lease-page",
    });

    const callsAfterPageHide = gateway.calls.length;
    mounted.dispose();
    assert.equal(gateway.calls.length, callsAfterPageHide);
    assert.equal(container.children.length, 0);
    assert.equal(win.listenerCount("pagehide"), 0);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("handBackComputer is best-effort and null-safe", () => {
  let calls = 0;
  assert.equal(
    handBackComputer({
      handle: {
        leave() {
          calls += 1;
        },
      },
    }),
    true,
  );
  assert.equal(calls, 1);
  assert.equal(handBackComputer({ handle: {} }), false);
  assert.equal(handBackComputer(null), false);
  assert.equal(
    handBackComputer({
      handle: {
        leave() {
          throw new Error("navigation must continue");
        },
      },
    }),
    false,
  );
});

test("computerSurfaceAction hands back only on a real route departure", () => {
  const desktop = new FakeElement("div");
  const hostEl = new FakeElement("div");
  const bar = new FakeElement("section");
  bar.className = "zero-computer-hold";
  desktop.append(hostEl);
  hostEl.append(bar);

  assert.equal(computerSurfaceAction(false, null, { hostEl }), "leave");
  assert.equal(computerSurfaceAction(true, null, { hostEl }), "unmount");
  assert.equal(computerSurfaceAction(true, desktop, { hostEl }), "reuse");
  assert.equal(computerSurfaceAction(true, desktop, null), "remount");
});

test("a failed take in flight still hands back the hold this view had", async () => {
  const gateway = fakeGateway();
  gateway.queue.push({ result: heldSnapshot("lease-existing") });
  const hold = createComputerHold({ request: gateway.request, autoStart: false });
  await hold.refresh();

  const pending = deferred();
  gateway.queue.push(() => pending.promise);
  const taking = hold.take();
  hold.leave();

  gateway.queue.push({ result: freeSnapshot() });
  pending.reject(new Error("Gateway connection is unavailable."));
  await taking;
  await Promise.resolve();
  assert.deepEqual(gateway.calls.at(-1).params, {
    action: "release",
    controlLeaseId: "lease-existing",
  });
  hold.dispose();
});
