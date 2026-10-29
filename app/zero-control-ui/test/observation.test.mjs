import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createChangeDetector } from "../observation/change-detector.mjs";
import {
  createFakeCaptureSource,
  readImageDimensions,
} from "../observation/capture-source.mjs";
import { createDefaultObservationEngine, createObservationEngine } from "../observation/engine.mjs";
import { createObservationStore } from "../observation/memory-store.mjs";
import {
  createPerceptionPipeline,
  createPowerShellUiaAdapter,
  createWindowsOcrAdapter,
  sanitizeObservedText,
} from "../observation/perception.mjs";
import { createFrameRing } from "../observation/ring-buffer.mjs";
import { createWorkerQueue } from "../observation/worker-queue.mjs";

function frame(text = "frame", capturedAtMs = 1_000, extra = {}) {
  const buffer = Buffer.from(text);
  return {
    id: `frame-${capturedAtMs}-${text.length}-${Math.random().toString(16).slice(2)}`,
    capturedAtMs,
    buffer,
    bytes: buffer.length,
    mimeType: "image/png",
    width: 2,
    height: 2,
    sourceKey: "display:primary",
    sceneKey: "app:test",
    ...extra,
  };
}

test("frame ring enforces horizon, byte, frame, rate, and source caps and clears buffers", () => {
  let now = 1_000;
  const ring = createFrameRing({
    horizonMs: 2_000,
    maxBytes: 10,
    maxFrames: 4,
    maxFramesPerMinute: 100,
    minFrameIntervalMs: 0,
    maxBytesPerSource: 100,
    clock: () => now,
  });
  const first = frame("aaaa", 1_000);
  const second = frame("bbbb", 1_100);
  assert.equal(ring.add(first).accepted, true);
  assert.equal(ring.add(second).accepted, true);
  assert.equal(ring.stats().bytes, 8);
  const evicting = ring.add(frame("cccc", 1_200));
  assert.equal(evicting.accepted, true);
  assert.equal(ring.stats().bytes <= 10, true, "byte cap evicts the oldest frame");
  const tooLarge = ring.add(frame("x".repeat(12), 1_300));
  assert.equal(tooLarge.accepted, false);
  assert.equal(tooLarge.reason, "too-large");
  now = 3_500;
  ring.prune(now);
  assert.equal(ring.stats().frames, 0, "horizon prune removes expired frames");
  assert.equal(first.buffer.every((value) => value === 0), true, "prune zeroes evicted buffers");

  const rateRing = createFrameRing({
    maxBytes: 100,
    maxFrames: 10,
    maxFramesPerMinute: 100,
    minFrameIntervalMs: 100,
    clock: () => now,
  });
  assert.equal(rateRing.add(frame("r1", 4_000)).accepted, true);
  const rate = rateRing.add(frame("r2", 4_050));
  assert.equal(rate.accepted, false);
  assert.equal(rate.reason, "rate");

  const cleared = frame("clear");
  const clearRing = createFrameRing({ maxBytes: 100, maxFrames: 10, minFrameIntervalMs: 0 });
  assert.equal(clearRing.add(cleared).accepted, true);
  clearRing.clear();
  assert.equal(clearRing.stats().frames, 0);
  assert.equal(cleared.buffer.every((value) => value === 0), true, "clear zeroes app-owned buffers");

  const sourceRing = createFrameRing({
    maxBytes: 1_000,
    maxFrames: 10,
    maxBytesPerSource: 5,
    minFrameIntervalMs: 0,
  });
  assert.equal(sourceRing.add(frame("1234", 5_000, { sourceKey: "a" })).accepted, true);
  const sourceCap = sourceRing.add(frame("123456", 5_100, { sourceKey: "a" }));
  assert.equal(sourceCap.accepted, false);
  assert.equal(sourceCap.reason, "source-cap");
});

test("change detector dedupes identical frames and reports scene/pixel changes", () => {
  const detector = createChangeDetector({ threshold: 0.1, samples: 8 });
  const first = frame("same-frame", 1);
  const firstResult = detector.evaluate(null, first);
  assert.equal(firstResult.changed, true);
  assert.equal(firstResult.reason, "initial");
  const remembered = detector.remember(first, firstResult);
  const same = frame("same-frame", 2);
  const duplicate = detector.evaluate(remembered, same);
  assert.equal(duplicate.changed, false);
  assert.equal(duplicate.reason, "identical");

  const scene = frame("same-frame", 3, { sceneKey: "app:other" });
  assert.equal(detector.evaluate(remembered, scene).reason, "scene");

  const changed = frame("different-frame", 4);
  const pixel = detector.evaluate(remembered, changed);
  assert.equal(pixel.changed, true);
  assert.equal(pixel.reason, "pixels");
});

test("worker queue is bounded, aborts active work, and drops excess jobs", async () => {
  let release;
  const active = new Promise((resolve) => {
    release = resolve;
  });
  const order = [];
  const queue = createWorkerQueue({ concurrency: 1, maxPending: 1 });
  const first = queue.enqueue(async ({ signal }) => {
    order.push("first-start");
    await active;
    if (signal.aborted) order.push("first-aborted");
    order.push("first-end");
  });
  const second = queue.enqueue(async () => {
    order.push("second");
  });
  const third = queue.enqueue(async () => {
    order.push("third");
  });
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, true);
  assert.equal(third.accepted, false);
  assert.equal(third.reason, "full");
  assert.equal(queue.stats().active, 1);
  assert.equal(queue.stats().pending, 1);
  queue.clear("private-mode");
  release();
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(order.includes("first-aborted"), true);
  assert.equal(order.includes("second"), false, "pending work is cleared");
  assert.equal(queue.stats().pending, 0);
});

test("perception sanitizes secrets, uses UIA first, OCR fallback, and never calls the cloud", async () => {
  const redacted = sanitizeObservedText(
    "Authorization: Bearer abcdefghijklmnop\npassword=hunter2\nnormal text",
  );
  assert.match(redacted, /Bearer \[redacted\]/);
  assert.match(redacted, /password: \[redacted\]/);
  assert.doesNotMatch(redacted, /hunter2|abcdefghijklmnop/);

  const abortController = new AbortController();
  const abortingUia = createPowerShellUiaAdapter({
    run: ({ signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted child")), { once: true });
      }),
  });
  const pendingAbort = abortingUia.read({ signal: abortController.signal });
  abortController.abort();
  await assert.rejects(pendingAbort, /aborted child/);

  const uia = createPowerShellUiaAdapter({
    run: async () => JSON.stringify({ ok: true, app: "notepad", window: "Note", text: "hello" }),
  });
  const uiaValue = await uia.read({});
  assert.equal(uiaValue.ok, true);
  assert.equal(uiaValue.text, "hello");

  const ocr = createWindowsOcrAdapter({
    run: async () => JSON.stringify({ ok: true, app: "", window: "", text: "ocr text" }),
  });
  const ocrValue = await ocr.read({ buffer: Buffer.from("image") });
  assert.equal(ocrValue.ok, true);
  assert.equal(ocrValue.text, "ocr text");

  const pipeline = createPerceptionPipeline({
    uia: { read: async () => ({ ok: false, text: "" }) },
    ocr,
  });
  const observation = await pipeline.processFrame(frame("image"));
  assert.equal(observation.source, "ocr");
  assert.equal(observation.summary, "ocr text");

  const failed = createPerceptionPipeline({
    uia: { read: async () => Promise.reject(new Error("uia offline")) },
    ocr: { read: async () => Promise.reject(new Error("ocr offline")) },
  });
  const fallback = await failed.processFrame(frame("image"));
  assert.equal(fallback.source, "window");
  assert.match(fallback.summary, /no readable text/i);
});

test("observation memory stores summaries only, prunes retention, and records workflow candidates", () => {
  const store = createObservationStore({ dbPath: ":memory:" });
  assert.equal(store.stats().opened, false);
  store.insertObservation({
    capturedAtMs: 1_000,
    app: "notepad",
    window: "Note",
    summary: "hello",
    source: "uia",
    confidence: 0.8,
    textLength: 5,
  });
  store.insertObservation({
    capturedAtMs: 2_000,
    app: "browser",
    window: "Docs",
    summary: "world",
    source: "ocr",
    confidence: 0.6,
    textLength: 5,
  });
  assert.equal(store.stats().observations, 2);
  assert.equal(store.recent({ limit: 1 })[0].summary, "world");
  assert.equal(store.recent({ query: "hello" }).length, 1);
  assert.equal("buffer" in store.recent({ limit: 1 })[0], false, "raw frames are not persisted");
  store.recordWorkflowCandidate({ key: "notepad|Note", app: "notepad", window: "Note", evidenceCount: 3, confidence: 0.6 });
  store.recordWorkflowCandidate({ key: "notepad|Note", app: "notepad", window: "Note", evidenceCount: 4, confidence: 0.7 });
  assert.equal(store.listWorkflowCandidates()[0].evidence_count, 4);
  const pruned = store.prune({ beforeMs: 1_500 });
  assert.equal(pruned.deleted, 1);
  assert.equal(store.stats().observations, 1);
  store.deleteAll();
  assert.equal(store.stats().observations, 0);
  assert.equal(store.stats().workflowCandidates, 0);
  store.close();
});

test("engine captures changed frames, dedupes identical frames, and applies Private Mode cleanup", async () => {
  const frames = [
    frame("one", 1_000),
    frame("one", 1_100),
    frame("two", 1_200),
  ];
  const source = createFakeCaptureSource({ frames });
  const ring = createFrameRing({ maxBytes: 1_000, maxFrames: 10, minFrameIntervalMs: 0, clock: () => 1_200 });
  const store = createObservationStore({ dbPath: ":memory:" });
  const queue = createWorkerQueue({ concurrency: 1, maxPending: 1 });
  const engine = createObservationEngine({
    source,
    ring,
    queue,
    store,
    perception: {
      processFrame: async (value) => ({
        capturedAtMs: value.capturedAtMs,
        app: "test",
        window: "window",
        summary: value.buffer.toString(),
        source: "uia",
        confidence: 0.8,
        textLength: value.buffer.length,
      }),
    },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
  });
  await engine.start();
  await engine.captureOnce();
  await engine.captureOnce();
  await engine.captureOnce();
  await new Promise((resolve) => setTimeout(resolve, 10));
  const status = engine.status();
  assert.equal(status.enabled, true);
  assert.equal(status.counters.captured, 3);
  assert.equal(status.counters.deduped, 1);
  assert.equal(status.counters.accepted, 2);
  assert.equal(status.ring.frames, 2);
  assert.equal(status.store.observations, 2);

  const retained = ring.list()[0]?.buffer;
  assert.ok(retained, "a compressed frame is retained in the volatile ring");
  await engine.setPrivateMode(true);
  assert.equal(retained.every((value) => value === 0), true, "Private Mode zeroes retained frames");
  const privateStatus = engine.status();
  assert.equal(privateStatus.privateMode, true);
  assert.equal(privateStatus.ring.frames, 0);
  assert.equal(privateStatus.queue.pending, 0);
  assert.equal(source.started, false);
  assert.ok(privateStatus.counters.privateClears >= 1);

  await engine.setPrivateMode(false);
  assert.equal(engine.status().privateMode, false);
  assert.equal(
    engine.status().running,
    false,
    "engine Private Mode exit does not start capture; the lifecycle owns the single resume attempt",
  );
  await engine.stop();
  assert.equal(engine.status().enabled, false);
  assert.equal(engine.status().ring.frames, 0);
  engine.dispose();
});

test("engine records backpressure drops without unbounded queue growth", async () => {
  const source = createFakeCaptureSource({ frames: [frame("bp-one", 1_000), frame("bp-two", 1_100)] });
  const queue = createWorkerQueue({ concurrency: 1, maxPending: 0 });
  const engine = createObservationEngine({
    source,
    ring: createFrameRing({ maxBytes: 1_000, maxFrames: 10, minFrameIntervalMs: 0, clock: () => 1_100 }),
    queue,
    store: createObservationStore({ dbPath: ":memory:" }),
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
  });
  await engine.start();
  await engine.captureOnce();
  await engine.captureOnce();
  const status = engine.status();
  assert.equal(status.counters.accepted, 2);
  assert.equal(status.counters.droppedBackpressure, 2);
  assert.equal(status.queue.pending, 0);
  await engine.dispose();
});

test("engine reports offline capture failure without a cloud fallback and stops after bounded errors", async () => {
  const source = {
    kind: "fake",
    available: true,
    started: false,
    async start() {
      this.started = true;
    },
    async capture() {
      throw new Error("local capture unavailable");
    },
    async stop() {
      this.started = false;
    },
  };
  const engine = createObservationEngine({
    source,
    ring: createFrameRing({ maxBytes: 1_000, maxFrames: 10, minFrameIntervalMs: 0 }),
    store: createObservationStore({ dbPath: ":memory:" }),
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
  });
  await engine.start();
  await engine.captureOnce();
  await engine.captureOnce();
  await engine.captureOnce();
  const status = engine.status();
  assert.equal(status.counters.errors, 3);
  assert.equal(status.consecutiveErrors, 3);
  assert.equal(status.running, false);
  assert.equal(status.state, "error");
  assert.match(status.lastError, /local capture unavailable/);
  await engine.dispose();
});

test("engine counts consecutive failures separately and recovers after a successful capture", async () => {
  const steps = ["error-1", "ok-1", "error-2", "error-3", "error-4", "ok-2"];
  let index = 0;
  const source = {
    kind: "fake",
    available: true,
    started: false,
    async start() {
      this.started = true;
    },
    async capture() {
      const step = steps[index++];
      if (!step) throw new Error("sequence exhausted");
      if (step.startsWith("error")) throw new Error(step);
      return frame(step, 1_000 + index);
    },
    async stop() {
      this.started = false;
    },
  };
  const engine = createObservationEngine({
    source,
    ring: createFrameRing({ maxBytes: 1_000, maxFrames: 10, minFrameIntervalMs: 0, clock: () => 1_000 }),
    store: createObservationStore({ dbPath: ":memory:" }),
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
    maxConsecutiveErrors: 3,
  });
  await engine.start();
  await engine.captureOnce();
  await engine.captureOnce();
  await engine.captureOnce();
  await engine.captureOnce();
  let status = engine.status();
  assert.equal(status.running, true, "an intervening success prevents the lifetime counter from stopping capture");
  assert.equal(status.consecutiveErrors, 2, "only failures since the last success count toward the stop rule");
  assert.equal(status.counters.errors, 3, "lifetime error count is retained");
  await engine.captureOnce();
  status = engine.status();
  assert.equal(status.running, false);
  assert.equal(status.state, "error");
  assert.equal(status.consecutiveErrors, 3);
  assert.equal(status.counters.errors, 4);
  await engine.start();
  await engine.captureOnce();
  status = engine.status();
  assert.equal(status.running, true);
  assert.equal(status.state, "capturing");
  assert.equal(status.consecutiveErrors, 0, "start/resume resets the consecutive streak");
  assert.equal(status.counters.errors, 4, "lifetime errors survive recovery");
  await engine.dispose();
});

test("engine start prunes expired summary rows and exposes bounded prune results", async () => {
  const now = 20 * 24 * 60 * 60_000;
  const store = createObservationStore({
    dbPath: ":memory:",
    clock: () => now,
    observationRetentionMs: 7 * 24 * 60 * 60_000,
  });
  store.insertObservation({
    capturedAtMs: now - 8 * 24 * 60 * 60_000,
    summary: "expired",
    app: "old",
    window: "old",
  });
  store.insertObservation({ capturedAtMs: now - 1_000, summary: "fresh", app: "new", window: "new" });
  const timers = [];
  const engine = createObservationEngine({
    source: createFakeCaptureSource({ frames: [frame("x")] }),
    store,
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: (callback) => {
      timers.push(callback);
      return timers.length;
    },
    clearTimeoutFn: () => {},
    autoCapture: false,
    pruneIntervalMs: 60_000,
  });
  await engine.start();
  assert.equal(store.stats().observations, 2, "capture start is not blocked by pruning");
  assert.ok(timers.length > 0, "a bounded prune is scheduled");
  timers.shift()();
  const status = engine.status();
  assert.equal(status.store.observations, 1, "scheduled prune enforces retention");
  assert.equal(status.lastPruneDeleted, 1);
  const pruned = engine.pruneOnce();
  assert.equal(pruned.ok, true);
  assert.equal(pruned.deleted, 0);
  assert.equal(pruned.more, false);
  await engine.dispose();
});

test("retention is bounded, restart-safe, and raw frames never enter SQLite", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zero-observation-retention-"));
  const dbPath = path.join(dir, "observations.sqlite");
  const now = 10 * 24 * 60 * 60_000;
  const store = createObservationStore({
    dbPath,
    clock: () => now,
    observationRetentionMs: 7 * 24 * 60 * 60_000,
    workflowRetentionMs: 30 * 24 * 60 * 60_000,
    maxObservationRows: 2,
    pruneBatch: 1,
  });
  for (let i = 0; i < 5; i += 1) {
    store.insertObservation({
      capturedAtMs: now - 8 * 24 * 60 * 60_000 + i,
      summary: `old-${i}`,
      app: "old",
      window: "old",
    });
  }
  store.insertObservation({ capturedAtMs: now, summary: "fresh", app: "new", window: "new" });
  const first = store.prune({ now });
  assert.equal(first.deleted, 1, "prune is bounded by pruneBatch");
  assert.equal(first.more, true);
  let guard = 0;
  while (store.stats().observations > 2 && guard < 20) {
    store.prune({ now });
    guard += 1;
  }
  assert.equal(store.stats().observations, 2, "row-count bound is enforced");
  assert.equal("buffer" in store.recent({ limit: 1 })[0], false);
  store.close();
  const reopened = createObservationStore({ dbPath, clock: () => now });
  assert.equal(reopened.stats().observations, 2, "retention survives a reopen");
  reopened.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("Private Mode during in-flight capture cancels work, clears buffers, and reports final cleanup", async () => {
  let capturedSignal;
  const source = {
    kind: "fake",
    available: true,
    started: false,
    async start() {
      this.started = true;
    },
    async capture({ signal }) {
      capturedSignal = signal;
      return await new Promise((_, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    },
    async stop() {
      this.started = false;
    },
  };
  const engine = createObservationEngine({
    source,
    ring: createFrameRing({ maxBytes: 1_000, maxFrames: 10, minFrameIntervalMs: 0 }),
    store: createObservationStore({ dbPath: ":memory:" }),
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
  });
  await engine.start();
  const capture = engine.captureOnce();
  await new Promise((resolve) => setImmediate(resolve));
  await engine.setPrivateMode(true);
  await capture;
  const status = engine.status();
  assert.equal(capturedSignal.aborted, true, "capture signal is aborted");
  assert.equal(status.state, "private");
  assert.equal(status.privateMode, true);
  assert.equal(status.inFlight, false);
  assert.equal(status.cleanupPending, false);
  assert.equal(status.ring.frames, 0);
  assert.equal(status.queue.pending, 0);
  assert.equal(status.store.observations, 0);
  assert.equal(source.started, false);
  await engine.dispose();
});

test("Private Mode cancels queued OCR work and no summary commits after it begins", async () => {
  let perceptionSignal;
  const source = createFakeCaptureSource({ frames: [frame("ocr-race", 1_000)] });
  const store = createObservationStore({ dbPath: ":memory:" });
  const engine = createObservationEngine({
    source,
    ring: createFrameRing({ maxBytes: 1_000, maxFrames: 10, minFrameIntervalMs: 0, clock: () => 1_000 }),
    store,
    perception: {
      processFrame: async (_frame, { signal }) => {
        perceptionSignal = signal;
        await new Promise((_, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        });
        return { summary: "must not commit" };
      },
    },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
  });
  await engine.start();
  await engine.captureOnce();
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(perceptionSignal, "the queued OCR worker received a signal");
  await engine.setPrivateMode(true);
  const status = engine.status();
  assert.equal(perceptionSignal.aborted, true, "queued OCR work is cancelled");
  assert.equal(status.store.observations, 0, "no summary is committed after Private Mode begins");
  assert.equal(status.queue.active, 0);
  assert.equal(status.queue.pending, 0);
  await engine.dispose();
});

test("dispose during in-flight capture settles without committing a summary", async () => {
  const source = {
    kind: "fake",
    available: true,
    started: false,
    async start() {
      this.started = true;
    },
    async capture({ signal }) {
      return await new Promise((_, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    },
    async stop() {
      this.started = false;
    },
  };
  const store = createObservationStore({ dbPath: ":memory:" });
  const engine = createObservationEngine({
    source,
    store,
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
  });
  await engine.start();
  const capture = engine.captureOnce();
  await new Promise((resolve) => setImmediate(resolve));
  await engine.dispose();
  await capture.catch(() => {});
  const status = engine.status();
  assert.equal(status.state, "stopped");
  assert.equal(status.inFlight, false);
  assert.equal(status.cleanupPending, false);
  assert.equal(status.ring.frames, 0);
  assert.equal(status.store.closed, true);
  assert.equal(source.started, false);
});

test("dispose bounds a capture that ignores AbortSignal and keeps the store open until it settles", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zero-observation-hung-capture-"));
  const dbPath = path.join(dir, "observations.sqlite");
  const store = createObservationStore({ dbPath });
  store.insertObservation({ capturedAtMs: 1_000, summary: "before", app: "a", window: "w" });
  let resolveCapture;
  const source = {
    kind: "fake",
    available: true,
    started: false,
    async start() {
      this.started = true;
    },
    async capture() {
      return await new Promise((resolve) => {
        resolveCapture = resolve;
      });
    },
    async stop() {
      this.started = false;
    },
  };
  const engine = createObservationEngine({
    source,
    store,
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
    cleanupTimeoutMs: 20,
  });
  await engine.start();
  const capture = engine.captureOnce();
  await new Promise((resolve) => setImmediate(resolve));
  const status = await engine.dispose();
  assert.equal(status.state, "stopped");
  assert.equal(status.inFlight, true);
  assert.equal(status.cleanupPending, true, "a timed-out capture is not reported as settled");
  assert.equal(status.lastSettlement.timedOut, true);
  assert.equal(store.opened, true, "dispose must not close the store while capture is still running");

  resolveCapture(frame("late-capture", 1_100));
  await capture.catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(engine.status().cleanupPending, false);
  assert.equal(store.opened, false, "the store closes only after the late capture settles");

  const reopened = createObservationStore({ dbPath });
  assert.equal(reopened.stats().observations, 1, "late capture did not commit an observation");
  reopened.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("dispose closes the store when capture settles within the cleanup bound", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zero-observation-bounded-capture-"));
  const dbPath = path.join(dir, "observations.sqlite");
  const store = createObservationStore({ dbPath });
  store.insertObservation({ capturedAtMs: 1_000, summary: "before", app: "a", window: "w" });
  const source = {
    kind: "fake",
    available: true,
    started: false,
    async start() {
      this.started = true;
    },
    async capture() {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return frame("bounded-capture", 1_100);
    },
    async stop() {
      this.started = false;
    },
  };
  const engine = createObservationEngine({
    source,
    store,
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
    cleanupTimeoutMs: 100,
  });
  await engine.start();
  const capture = engine.captureOnce();
  const status = await engine.dispose();
  await capture.catch(() => {});
  assert.equal(status.state, "stopped");
  assert.equal(status.cleanupPending, false);
  assert.equal(status.lastSettlement.timedOut, false);
  assert.equal(store.opened, false);

  const reopened = createObservationStore({ dbPath });
  assert.equal(reopened.stats().observations, 1, "aborted capture committed no observation");
  reopened.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("queued perception that settles after Private Mode cannot commit a summary", async () => {
  const store = createObservationStore({ dbPath: ":memory:" });
  const source = createFakeCaptureSource({ frames: [frame("late-perception", 1_000)] });
  const engine = createObservationEngine({
    source,
    ring: createFrameRing({ maxBytes: 1_000, maxFrames: 10, minFrameIntervalMs: 0, clock: () => 1_000 }),
    store,
    perception: {
      processFrame: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          capturedAtMs: 1_000,
          app: "late",
          window: "late",
          summary: "late summary",
          source: "uia",
          confidence: 0.8,
          textLength: 12,
        };
      },
    },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
    cleanupTimeoutMs: 100,
  });
  await engine.start();
  await engine.captureOnce();
  await new Promise((resolve) => setImmediate(resolve));
  const status = await engine.setPrivateMode(true);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(status.state, "private");
  assert.equal(status.cleanupPending, false);
  assert.equal(status.lastSettlement.timedOut, false);
  assert.equal(store.stats().observations, 0, "late perception did not commit after Private Mode");
  assert.equal(engine.status().cleanupPending, false);
  await engine.dispose();
});

test("dispose defers store close while queued perception is still running and cannot write later", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zero-observation-late-worker-"));
  const dbPath = path.join(dir, "observations.sqlite");
  const store = createObservationStore({ dbPath });
  store.insertObservation({ capturedAtMs: 1_000, summary: "before", app: "a", window: "w" });
  const source = createFakeCaptureSource({ frames: [frame("late-worker", 1_000)] });
  const engine = createObservationEngine({
    source,
    ring: createFrameRing({ maxBytes: 1_000, maxFrames: 10, minFrameIntervalMs: 0, clock: () => 1_000 }),
    store,
    perception: {
      processFrame: async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          capturedAtMs: 1_000,
          app: "late",
          window: "late",
          summary: "late summary",
          source: "uia",
          confidence: 0.8,
          textLength: 12,
        };
      },
    },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
    cleanupTimeoutMs: 5,
  });
  await engine.start();
  await engine.captureOnce();
  await new Promise((resolve) => setImmediate(resolve));
  const status = await engine.dispose();
  assert.equal(status.cleanupPending, true);
  assert.equal(status.lastSettlement.queueSettled, false);
  assert.equal(store.opened, true, "store stays open while the worker is still able to write");
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(engine.status().cleanupPending, false);
  assert.equal(store.opened, false, "store closes after the worker settles");
  const reopened = createObservationStore({ dbPath });
  assert.equal(reopened.stats().observations, 1, "late worker did not commit a summary");
  reopened.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("observation modules contain no cloud/network fallback path", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "observation");
  const files = await fs.readdir(root);
  for (const file of files) {
    if (!file.endsWith(".mjs") && !file.endsWith(".ps1")) continue;
    const text = await fs.readFile(path.join(root, file), "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(|XMLHttpRequest|new WebSocket|EventSource|api\.openai|api\.anthropic|screenpipe/iu, file);
  }
});

test("default observation engine is lazy and reports unavailable/off without starting capture", async () => {
  const engine = createDefaultObservationEngine({
    store: createObservationStore({ dbPath: ":memory:" }),
    setTimeoutFn: null,
    clearTimeoutFn: null,
  });
  const status = engine.status();
  assert.equal(status.enabled, false);
  assert.equal(status.privateMode, false);
  assert.equal(status.running, false);
  assert.equal(typeof status.sourceAvailable, "boolean");
  assert.equal(status.ring.frames, 0);
  await engine.dispose();
});

test("capture adapter parses PNG dimensions and the fake source is deterministic", async () => {
  const png = Buffer.alloc(24);
  png.writeUInt32BE(0x89504e47, 0);
  png.write("PNG", 1, "ascii");
  png.write("IHDR", 12, "ascii");
  png.writeUInt32BE(640, 16);
  png.writeUInt32BE(480, 20);
  assert.deepEqual(readImageDimensions(png), { width: 640, height: 480 });
  const source = createFakeCaptureSource({ frames: [frame("abc", 1)] });
  await source.start();
  const captured = await source.capture();
  assert.equal(captured.buffer.toString(), "abc");
  await source.stop();
});
