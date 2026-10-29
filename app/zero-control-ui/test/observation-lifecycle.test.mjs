import assert from "node:assert/strict";
import test from "node:test";
import { createFakeCaptureSource } from "../observation/capture-source.mjs";
import { createObservationEngine } from "../observation/engine.mjs";
import {
  createObservationLifecycle,
  ObservationPreferenceError,
} from "../observation/lifecycle.mjs";
import { createObservationStore } from "../observation/memory-store.mjs";
import {
  OBSERVATION_PREFERENCE_KEY,
  OBSERVATION_PREFERENCE_SCHEMA_VERSION,
  readPreferenceRecord,
} from "../observation/preference.mjs";
import { createObservationTool } from "../observation/tool.mjs";

const VALID_PREFERENCE = Object.freeze({
  schemaVersion: OBSERVATION_PREFERENCE_SCHEMA_VERSION,
  enabled: false,
  privateMode: false,
  updatedAt: "2026-10-27T00:00:00.000Z",
});

function createFakeEngine() {
  const events = [];
  const state = {
    state: "idle",
    enabled: false,
    privateMode: false,
    running: false,
    inFlight: false,
    cleanupPending: false,
    ring: { frames: 0, bytes: 0 },
    queue: { active: 0, pending: 0 },
    counters: {},
  };
  let active = 0;
  let maxActive = 0;
  const run = async (name, body) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    events.push(`${name}:start`);
    try {
      await body();
    } finally {
      events.push(`${name}:end`);
      active -= 1;
    }
  };
  return {
    events,
    state,
    startMode: "success",
    recentRows: [],
    get maxActive() {
      return maxActive;
    },
    status() {
      return {
        ...state,
        ring: { ...state.ring },
        queue: { ...state.queue },
        counters: { ...state.counters },
      };
    },
    async start() {
      await run("start", async () => {
        if (this.startMode === "reject") throw new Error("Bearer reject-start-secret");
        if (this.startMode === "unavailable") {
          state.enabled = false;
          state.running = false;
          state.state = "unavailable";
          state.lastError = "CUA_DRIVER_UNAVAILABLE: Bearer unavailable-start-secret";
          return;
        }
        if (this.startMode === "error") {
          state.enabled = false;
          state.running = false;
          state.state = "error";
          state.lastError = "CUA_START_ERROR: token=error-start-secret";
          return;
        }
        if (state.privateMode) return;
        state.enabled = true;
        state.running = true;
        state.state = "capturing";
      });
      return this.status();
    },
    async stop() {
      await run("stop", async () => {
        state.enabled = false;
        state.running = false;
        state.cleanupPending = false;
        state.state = "stopped";
      });
    },
    async setPrivateMode(next) {
      await run(next === true ? "private-on" : "private-off", async () => {
        state.privateMode = next === true;
        if (state.privateMode) {
          state.running = false;
          state.state = "private";
        } else {
          state.state = state.enabled ? "idle" : "stopped";
        }
      });
    },
    async dispose() {
      await run("dispose", async () => {
        state.enabled = false;
        state.running = false;
        state.state = "stopped";
        state.disposed = true;
      });
    },
    recent(params = {}) {
      const limit = Number.isInteger(params.limit) ? params.limit : this.recentRows.length;
      return this.recentRows.slice(0, limit);
    },
  };
}

function createMemoryStore({
  initial,
  lookupError = null,
  registerError = null,
  events = null,
} = {}) {
  const map = new Map();
  if (initial !== undefined) map.set(OBSERVATION_PREFERENCE_KEY, initial);
  const store = {
    failWrites: false,
    writes: [],
    async lookup(key) {
      if (lookupError) throw lookupError;
      return map.get(key);
    },
    async register(key, value) {
      events?.push(`persist:${value.enabled}:${value.privateMode}`);
      if (store.failWrites || registerError) {
        throw registerError ?? new Error("register failed");
      }
      const copy = JSON.parse(JSON.stringify(value));
      map.set(key, copy);
      store.writes.push(copy);
      return copy;
    },
    async delete(key) {
      return map.delete(key);
    },
    read() {
      return map.get(OBSERVATION_PREFERENCE_KEY);
    },
  };
  return store;
}

function createLifecycle(options = {}) {
  const engine = options.engine ?? createFakeEngine();
  const store = options.store ?? createMemoryStore({ events: engine.events });
  const lifecycle = createObservationLifecycle({
    engine,
    getStore: async () => {
      if (options.openError) throw options.openError;
      return store;
    },
    clock: () => Date.UTC(2026, 9, 27, 0, 0, 0),
    logger: { warn() {} },
  });
  return { engine, store, lifecycle };
}

test("first run is disabled by default and writes no preference record", async () => {
  const { engine, store, lifecycle } = createLifecycle();
  const status = await lifecycle.initialize();

  assert.equal(status.preferenceStatus, "missing");
  assert.equal(status.preferenceEnabled, false);
  assert.equal(status.preferencePrivateMode, false);
  assert.equal(status.enabled, false);
  assert.equal(status.privateMode, false);
  assert.deepEqual(engine.events, [], "startup must not start or stop a fresh installation");
  assert.equal(store.writes.length, 0, "no default record is persisted until the owner opts in");
  assert.equal(store.read(), undefined);

  await lifecycle.dispose();
  assert.equal(engine.state.disposed, true);
});

test("startup resumes capture only when the persisted preference is explicitly enabled", async () => {
  const store = createMemoryStore({
    initial: { ...VALID_PREFERENCE, enabled: true, privateMode: false },
  });
  const { engine, lifecycle } = createLifecycle({ store });
  const status = await lifecycle.initialize();

  assert.equal(status.preferenceStatus, "stored");
  assert.equal(status.preferenceEnabled, true);
  assert.equal(status.enabled, true);
  assert.equal(status.running, true);
  assert.equal(status.state, "capturing");
  assert.deepEqual(engine.events, ["start:start", "start:end"]);
  assert.equal(store.writes.length, 0, "startup recovery does not rewrite the preference");
  await lifecycle.dispose();
});

test("startup honors persisted Private Mode and private-off resumes only the persisted enabled preference", async () => {
  const store = createMemoryStore({
    initial: { ...VALID_PREFERENCE, enabled: true, privateMode: true },
  });
  const { engine, lifecycle } = createLifecycle({ store });
  const first = await lifecycle.initialize();

  assert.equal(first.preferencePrivateMode, true);
  assert.equal(first.preferenceEnabled, true);
  assert.equal(first.privateMode, true);
  assert.equal(first.running, false);
  assert.deepEqual(engine.events, ["private-on:start", "private-on:end"]);
  assert.equal(store.writes.length, 0);
  assert.match(JSON.stringify(first), /"preferenceEnabled":true/);

  engine.events.length = 0;
  const resumed = await lifecycle.setPrivateMode(false);
  assert.deepEqual(store.writes.at(-1), {
    schemaVersion: OBSERVATION_PREFERENCE_SCHEMA_VERSION,
    enabled: true,
    privateMode: false,
    updatedAt: "2026-10-27T00:00:00.000Z",
  });
  assert.deepEqual(engine.events, [
    "private-off:start",
    "private-off:end",
    "start:start",
    "start:end",
  ]);
  assert.equal(resumed.privateMode, false);
  assert.equal(resumed.enabled, true);
  assert.equal(resumed.running, true);
  assert.equal(resumed.preferencePrivateMode, false);
  await lifecycle.dispose();
});

test("Private Mode persists before stopping capture and stop persists disabled before stopping", async () => {
  const { engine, store, lifecycle } = createLifecycle();
  await lifecycle.initialize();
  await lifecycle.start();
  engine.events.length = 0;
  store.writes.length = 0;

  const privateStatus = await lifecycle.setPrivateMode(true);
  const persistIndex = engine.events.indexOf("persist:true:true");
  const stopIndex = engine.events.indexOf("private-on:start");
  assert.ok(persistIndex >= 0, "the preference write is attempted");
  assert.ok(stopIndex > persistIndex, "Private Mode stops capture only after the write is attempted");
  assert.equal(store.writes[0].enabled, true);
  assert.equal(store.writes[0].privateMode, true);
  assert.equal(privateStatus.privateMode, true);
  assert.equal(privateStatus.running, false);
  assert.equal(store.read().privateMode, true);

  engine.events.length = 0;
  store.writes.length = 0;
  const stopped = await lifecycle.stop();
  assert.ok(
    engine.events.indexOf("persist:false:true") < engine.events.indexOf("stop:start"),
    "Stop records the disabled preference before stopping capture",
  );
  assert.equal(store.writes[0].enabled, false);
  assert.equal(stopped.enabled, false);
  assert.equal(stopped.running, false);
  await lifecycle.dispose();
});

test("malformed, unreadable, and unavailable preference storage fail closed and never expose raw errors", async () => {
  const malformed = createLifecycle({
    store: createMemoryStore({
      initial: {
        schemaVersion: OBSERVATION_PREFERENCE_SCHEMA_VERSION,
        enabled: true,
        privateMode: false,
        updatedAt: null,
        summary: "must not be read or copied",
      },
    }),
  });
  const malformedStatus = await malformed.lifecycle.initialize();
  assert.equal(malformedStatus.preferenceStatus, "malformed");
  assert.equal(malformedStatus.preferenceEnabled, false);
  assert.equal(malformedStatus.privateMode, true);
  assert.equal(malformedStatus.running, false);
  assert.deepEqual(malformed.engine.events, ["private-on:start", "private-on:end"]);
  assert.equal(malformed.store.writes.length, 0, "malformed data is never rewritten implicitly");
  assert.doesNotMatch(JSON.stringify(malformedStatus), /must not be read or copied/);

  const secret = "C:\\private\\token=super-secret";
  const unreadable = createLifecycle({
    store: createMemoryStore({ lookupError: new Error(secret) }),
  });
  const unreadableStatus = await unreadable.lifecycle.initialize();
  assert.equal(unreadableStatus.preferenceStatus, "unreadable");
  assert.equal(unreadableStatus.privateMode, true);
  assert.equal(unreadableStatus.safeError, "preference-unavailable");
  assert.doesNotMatch(JSON.stringify(unreadableStatus), /super-secret/);

  const unavailable = createLifecycle({ openError: new Error(secret) });
  const unavailableStatus = await unavailable.lifecycle.initialize();
  assert.equal(unavailableStatus.preferenceStatus, "unavailable");
  assert.equal(unavailableStatus.privateMode, true);
  assert.equal(unavailableStatus.running, false);
  assert.doesNotMatch(JSON.stringify(unavailableStatus), /super-secret/);

  const invalidStore = createLifecycle({ store: { lookup: async () => undefined } });
  const invalidStatus = await invalidStore.lifecycle.initialize();
  assert.equal(invalidStatus.preferenceStatus, "unavailable");
  assert.equal(invalidStatus.privateMode, true);

  await malformed.lifecycle.dispose();
  await unreadable.lifecycle.dispose();
  await unavailable.lifecycle.dispose();
  await invalidStore.lifecycle.dispose();
});

test("start fails closed when the preference write fails and still stops capture", async () => {
  const store = createMemoryStore({ registerError: new Error("Bearer secret-register-token") });
  const { engine, lifecycle } = createLifecycle({ store });
  await lifecycle.initialize();

  await assert.rejects(
    () => lifecycle.start(),
    (error) =>
      error instanceof ObservationPreferenceError &&
      error.code === "observation-preference-unavailable" &&
      /capture was not started/.test(error.message),
  );
  assert.equal(engine.events.includes("start:start"), false, "capture is never started");
  assert.ok(engine.events.includes("stop:start"), "fail-closed cleanup stops the engine");
  assert.ok(engine.events.includes("private-on:start"), "fail-closed cleanup applies Private Mode");
  const status = lifecycle.status();
  assert.equal(status.preferenceStatus, "write-failed");
  assert.equal(status.preferenceEnabled, false);
  assert.equal(status.preferencePrivateMode, true);
  assert.equal(status.privateMode, true);
  assert.equal(status.safeError, "preference-write-failed");
  assert.doesNotMatch(JSON.stringify(status), /secret-register-token/);
  await lifecycle.dispose();
});

test("stop reports a safe failure when the disabled preference cannot be recorded", async () => {
  const { engine, store, lifecycle } = createLifecycle();
  await lifecycle.initialize();
  await lifecycle.start();
  await assert.doesNotReject(() => lifecycle.stop(), "precondition: stop succeeds");
  await lifecycle.start();
  store.failWrites = true;
  engine.events.length = 0;

  await assert.rejects(
    () => lifecycle.stop(),
    (error) =>
      error instanceof ObservationPreferenceError && /disabled preference could not be recorded/.test(
        error.message,
      ),
  );
  assert.ok(engine.events.includes("stop:start"), "capture is stopped even when persistence fails");
  assert.ok(engine.events.includes("private-on:start"), "the failure falls back to Private Mode");
  const status = lifecycle.status();
  assert.equal(status.preferenceStatus, "write-failed");
  assert.equal(status.enabled, false);
  assert.equal(status.running, false);
  assert.equal(status.privateMode, true);
  await lifecycle.dispose();
});

test("Private Mode write failures apply and keep the private state", async () => {
  const enabled = createLifecycle({ store: createMemoryStore({ initial: { ...VALID_PREFERENCE } }) });
  await enabled.lifecycle.initialize();
  enabled.store.failWrites = true;
  await assert.rejects(
    () => enabled.lifecycle.setPrivateMode(true),
    (error) => error instanceof ObservationPreferenceError && /Private Mode was applied/.test(error.message),
  );
  assert.ok(enabled.engine.events.includes("private-on:start"));
  assert.equal(enabled.lifecycle.status().privateMode, true);
  assert.equal(enabled.lifecycle.status().preferencePrivateMode, true);
  await enabled.lifecycle.dispose();

  const privateStore = createMemoryStore({
    initial: { ...VALID_PREFERENCE, enabled: true, privateMode: true },
  });
  const privateLifecycle = createLifecycle({ store: privateStore });
  await privateLifecycle.lifecycle.initialize();
  privateLifecycle.engine.events.length = 0;
  privateStore.failWrites = true;
  await assert.rejects(
    () => privateLifecycle.lifecycle.setPrivateMode(false),
    (error) => error instanceof ObservationPreferenceError && /Private Mode remains active/.test(error.message),
  );
  assert.equal(
    privateLifecycle.engine.events.includes("private-off:start"),
    false,
    "Private Mode is not cleared when the preference cannot be recorded",
  );
  assert.equal(privateLifecycle.lifecycle.status().privateMode, true);
  await privateLifecycle.lifecycle.dispose();
});

test("explicit start reports unavailable instead of an unqualified success", async () => {
  const { engine, store, lifecycle } = createLifecycle();
  await lifecycle.initialize();
  engine.startMode = "unavailable";

  const status = await lifecycle.start();
  assert.equal(store.read().enabled, true, "the explicit owner preference is preserved");
  assert.equal(store.read().privateMode, false);
  assert.equal(status.preferenceEnabled, true);
  assert.equal(status.privateMode, false);
  assert.equal(status.running, false);
  assert.equal(status.captureRunning, false);
  assert.equal(status.state, "unavailable");
  assert.equal(status.startFailed, true);
  assert.equal(status.startFailure.origin, "explicit");
  assert.equal(status.startFailure.reason, "unavailable");
  assert.equal(status.startFailure.state, "unavailable");
  assert.match(status.startFailure.message, /source is unavailable/i);
  assert.equal(status.safeError, "capture-start-unavailable");
  assert.doesNotMatch(JSON.stringify(status), /unavailable-start-secret/);
  assert.match(status.lastError, /Bearer \[redacted\]/);

  const { createZeroUiRuntimeHandlers, METHODS } = await import("../runtime-core.mjs");
  const handlers = createZeroUiRuntimeHandlers({
    getObservationEngine: () => engine,
    getObservationLifecycle: () => lifecycle,
  });
  const responses = [];
  await handlers[METHODS.observationControl]({
    params: { action: "start" },
    respond: (ok, payload, error) => responses.push({ ok, payload, error }),
  });
  assert.equal(responses.at(-1).ok, true);
  const payload = responses.at(-1).payload;
  assert.equal(payload.ok, false, "failed start is not reported as an unqualified success");
  assert.equal(payload.startFailed, true);
  assert.equal(payload.captureRunning, false);
  assert.equal(payload.safeError, "capture-start-unavailable");
  assert.match(payload.startFailure.message, /source is unavailable/i);
  assert.doesNotMatch(JSON.stringify(payload), /unavailable-start-secret/);
  await lifecycle.dispose();
});

test("explicit start distinguishes error, rejection, and running success", async () => {
  const errored = createLifecycle();
  await errored.lifecycle.initialize();
  errored.engine.startMode = "error";
  const errorStatus = await errored.lifecycle.start();
  assert.equal(errorStatus.startFailed, true);
  assert.equal(errorStatus.startFailure.reason, "error");
  assert.equal(errorStatus.startFailure.state, "error");
  assert.equal(errorStatus.safeError, "capture-start-error");
  assert.equal(errorStatus.running, false);
  assert.equal(errorStatus.preferenceEnabled, true);
  assert.doesNotMatch(JSON.stringify(errorStatus), /error-start-secret/);
  assert.match(errorStatus.lastError, /token: \[redacted\]/);
  await errored.lifecycle.dispose();

  const rejected = createLifecycle();
  await rejected.lifecycle.initialize();
  rejected.engine.startMode = "reject";
  const rejectedStatus = await rejected.lifecycle.start();
  assert.equal(rejectedStatus.startFailed, true);
  assert.equal(rejectedStatus.startFailure.reason, "rejected");
  assert.equal(rejectedStatus.safeError, "capture-start-rejected");
  assert.equal(rejectedStatus.captureRunning, false);
  assert.equal(rejectedStatus.preferenceEnabled, true);
  assert.doesNotMatch(JSON.stringify(rejectedStatus), /reject-start-secret/);
  await rejected.lifecycle.dispose();

  const successful = createLifecycle();
  await successful.lifecycle.initialize();
  const running = await successful.lifecycle.start();
  assert.equal(running.startFailed, false);
  assert.equal(running.captureRunning, true);
  assert.equal(running.running, true);
  assert.equal(running.state, "capturing");
  assert.equal(running.safeError, undefined);
  assert.equal(running.preferenceEnabled, true);

  successful.engine.startMode = "unavailable";
  await successful.lifecycle.start();
  assert.equal(successful.lifecycle.status().startFailed, true);
  successful.engine.startMode = "success";
  const recovered = await successful.lifecycle.start();
  assert.equal(recovered.startFailed, false);
  assert.equal(recovered.captureRunning, true);
  assert.equal(recovered.safeError, undefined);
  await successful.lifecycle.dispose();
});

test("startup auto-resume failure preserves the enabled preference and retries on the next startup", async () => {
  const store = createMemoryStore({
    initial: { ...VALID_PREFERENCE, enabled: true, privateMode: false },
  });
  const firstEngine = createFakeEngine();
  firstEngine.startMode = "unavailable";
  const first = createLifecycle({ engine: firstEngine, store });
  const firstStatus = await first.lifecycle.initialize();

  assert.equal(firstStatus.preferenceStatus, "stored");
  assert.equal(firstStatus.preferenceEnabled, true);
  assert.equal(firstStatus.captureRunning, false);
  assert.equal(firstStatus.running, false);
  assert.equal(firstStatus.state, "unavailable");
  assert.equal(firstStatus.startFailed, true);
  assert.equal(firstStatus.startFailure.origin, "startup");
  assert.equal(firstStatus.safeError, "capture-start-unavailable");
  assert.equal(store.read().enabled, true, "startup failure does not disable the owner preference");
  assert.equal(store.writes.length, 0, "startup failure does not rewrite the preference");
  await first.lifecycle.dispose();

  const secondEngine = createFakeEngine();
  const second = createLifecycle({ engine: secondEngine, store });
  const secondStatus = await second.lifecycle.initialize();
  assert.equal(secondStatus.captureRunning, true);
  assert.equal(secondStatus.running, true);
  assert.equal(secondStatus.startFailed, false);
  assert.equal(secondStatus.preferenceEnabled, true);
  assert.equal(store.writes.length, 0);
  await second.lifecycle.dispose();
});

test("Private Mode exit reports the start failure without falling back to unsafe capture", async () => {
  const enabledStore = createMemoryStore({
    initial: { ...VALID_PREFERENCE, enabled: true, privateMode: true },
  });
  const enabled = createLifecycle({ store: enabledStore });
  enabled.engine.startMode = "unavailable";
  const privateStatus = await enabled.lifecycle.initialize();
  assert.equal(privateStatus.privateMode, true);
  assert.equal(privateStatus.startFailed, false);

  enabled.engine.events.length = 0;
  const resumed = await enabled.lifecycle.setPrivateMode(false);
  assert.equal(enabledStore.read().enabled, true);
  assert.equal(enabledStore.read().privateMode, false);
  assert.equal(resumed.privateMode, false, "Private Mode is accurately reported as off");
  assert.equal(resumed.preferencePrivateMode, false);
  assert.equal(resumed.preferenceEnabled, true);
  assert.equal(resumed.captureRunning, false);
  assert.equal(resumed.running, false);
  assert.equal(resumed.state, "unavailable");
  assert.equal(resumed.startFailed, true);
  assert.equal(resumed.startFailure.origin, "private-off");
  assert.equal(resumed.safeError, "capture-start-unavailable");
  assert.ok(enabled.engine.events.includes("private-off:start"));
  assert.ok(enabled.engine.events.includes("start:start"));
  assert.doesNotMatch(JSON.stringify(resumed), /unavailable-start-secret/);
  await enabled.lifecycle.dispose();

  const disabledStore = createMemoryStore({
    initial: { ...VALID_PREFERENCE, enabled: false, privateMode: true },
  });
  const disabled = createLifecycle({ store: disabledStore });
  await disabled.lifecycle.initialize();
  disabled.engine.events.length = 0;
  const stopped = await disabled.lifecycle.setPrivateMode(false);
  assert.equal(disabledStore.read().enabled, false);
  assert.equal(disabledStore.read().privateMode, false);
  assert.equal(stopped.privateMode, false);
  assert.equal(stopped.startFailed, false);
  assert.equal(stopped.captureRunning, false);
  assert.equal(stopped.state, "stopped");
  assert.equal(disabled.engine.events.includes("start:start"), false);
  await disabled.lifecycle.dispose();
});

test("Private Mode exit makes exactly one start attempt and reports success or failure", async () => {
  const source = createFakeCaptureSource({ frames: [], available: true });
  const engine = createObservationEngine({
    source,
    store: createObservationStore({ dbPath: ":memory:" }),
    perception: { processFrame: async () => ({}) },
    setTimeoutFn: null,
    clearTimeoutFn: null,
    autoCapture: false,
  });
  const { lifecycle } = createLifecycle({ engine, store: createMemoryStore() });
  await lifecycle.initialize();
  await lifecycle.start();
  await lifecycle.setPrivateMode(true);
  assert.equal(engine.status().privateMode, true);

  let starts = 0;
  const originalStart = engine.start;
  engine.start = (...args) => {
    starts += 1;
    return originalStart(...args);
  };

  const resumed = await lifecycle.setPrivateMode(false);
  assert.equal(starts, 1, "one Private Mode exit performs exactly one start attempt");
  assert.equal(resumed.privateMode, false);
  assert.equal(resumed.captureRunning, true);
  assert.equal(resumed.startFailed, false);
  assert.equal(source.started, true);

  await lifecycle.setPrivateMode(true);
  source.available = false;
  starts = 0;
  const failed = await lifecycle.setPrivateMode(false);
  assert.equal(starts, 1, "a failed resume is not retried implicitly");
  assert.equal(failed.privateMode, false);
  assert.equal(failed.captureRunning, false);
  assert.equal(failed.startFailed, true);
  assert.equal(failed.startFailure.origin, "private-off");
  assert.equal(failed.startFailure.reason, "unavailable");
  await lifecycle.dispose();
});

test("recent history uses lifecycle policy, sanitizes records, and stays empty when blocked", async () => {
  const { engine, lifecycle } = createLifecycle();
  engine.recentRows = [
    {
      id: 7,
      captured_at_ms: Date.UTC(2026, 9, 27, 1, 2, 3),
      app: "notepad",
      window: "Note",
      summary: "Authorization: Bearer recent-secret-token normal text",
      source: "uia",
      confidence: 2,
      text_length: 20,
      buffer: Buffer.from("raw-frame"),
      dbPath: "C:\\private\\observations.sqlite",
    },
  ];
  await lifecycle.initialize();
  const tool = createObservationTool({ getObservationEngine: () => engine });
  const { createZeroUiRuntimeHandlers, METHODS } = await import("../runtime-core.mjs");
  const handlers = createZeroUiRuntimeHandlers({
    getObservationEngine: () => engine,
    getObservationLifecycle: () => lifecycle,
  });
  const responses = [];
  const respond = (ok, payload, error) => responses.push({ ok, payload, error });
  const callRecent = async () => {
    await handlers[METHODS.observationRecent]({ params: { limit: 5 }, respond });
    return responses.at(-1);
  };

  const disabled = lifecycle.recent({ limit: 5 });
  assert.equal(disabled.ok, false);
  assert.equal(disabled.reason, "observation-disabled");
  assert.equal(disabled.count, 0);
  assert.deepEqual(disabled.observations, []);
  const toolDisabled = await tool.execute("id", { limit: 5 });
  assert.equal(toolDisabled.details.ok, false);
  assert.equal(toolDisabled.details.reason, "observation-disabled");
  assert.equal(toolDisabled.details.count, 0);
  const disabledResponse = await callRecent();
  assert.equal(disabledResponse.ok, true);
  assert.equal(disabledResponse.payload.ok, false);
  assert.equal(disabledResponse.payload.reason, "observation-disabled");
  assert.equal(disabledResponse.payload.count, 0);
  assert.deepEqual(disabledResponse.payload.observations, []);

  await lifecycle.start();
  const allowed = lifecycle.recent({ limit: 5 });
  assert.equal(allowed.ok, true);
  assert.equal(allowed.count, 1);
  const record = allowed.observations[0];
  assert.deepEqual(Object.keys(record).sort(), [
    "app",
    "capturedAt",
    "confidence",
    "source",
    "summary",
    "window",
  ]);
  assert.equal(record.capturedAt, "2026-10-27T01:02:03.000Z");
  assert.equal(record.confidence, 1);
  assert.doesNotMatch(JSON.stringify(record), /recent-secret-token|raw-frame|C:\\\\private/);
  assert.match(record.summary, /Bearer \[redacted\]/);
  const toolAllowed = await tool.execute("id", { limit: 5 });
  assert.equal(toolAllowed.details.ok, true);
  assert.equal(toolAllowed.details.count, 1);
  const allowedResponse = await callRecent();
  assert.equal(allowedResponse.payload.ok, true);
  assert.equal(allowedResponse.payload.count, 1);
  assert.deepEqual(Object.keys(allowedResponse.payload.observations[0]).sort(), [
    "app",
    "capturedAt",
    "confidence",
    "source",
    "summary",
    "window",
  ]);
  assert.doesNotMatch(JSON.stringify(allowedResponse.payload), /recent-secret-token|raw-frame|C:\\\\private/);

  await lifecycle.setPrivateMode(true);
  const privateRecent = lifecycle.recent({ limit: 5 });
  assert.equal(privateRecent.ok, false);
  assert.equal(privateRecent.reason, "private-mode");
  assert.equal(privateRecent.count, 0);
  assert.deepEqual(privateRecent.observations, []);
  const toolPrivate = await tool.execute("id", { limit: 5 });
  assert.equal(toolPrivate.details.ok, false);
  assert.equal(toolPrivate.details.reason, "private-mode");
  assert.equal(toolPrivate.details.count, 0);
  assert.doesNotMatch(toolPrivate.content[0].text, /recent-secret-token|raw-frame/);
  const privateResponse = await callRecent();
  assert.equal(privateResponse.payload.ok, false);
  assert.equal(privateResponse.payload.reason, "private-mode");
  assert.equal(privateResponse.payload.count, 0);
  assert.deepEqual(privateResponse.payload.observations, []);
  await lifecycle.dispose();
});

test("lifecycle serializes concurrent start, private, stop, and private-off calls", async () => {
  const { engine, store, lifecycle } = createLifecycle();
  await lifecycle.initialize();

  const [started, privateOn, stopped, privateOff] = await Promise.all([
    lifecycle.start(),
    lifecycle.setPrivateMode(true),
    lifecycle.stop(),
    lifecycle.setPrivateMode(false),
  ]);
  assert.equal(engine.maxActive, 1, "engine operations never overlap");
  assert.equal(started.enabled, true);
  assert.equal(privateOn.privateMode, true);
  assert.equal(stopped.enabled, false);
  assert.equal(privateOff.privateMode, false);
  assert.deepEqual(store.read(), {
    schemaVersion: OBSERVATION_PREFERENCE_SCHEMA_VERSION,
    enabled: false,
    privateMode: false,
    updatedAt: "2026-10-27T00:00:00.000Z",
  });
  assert.equal(lifecycle.status().running, false);
  assert.equal(lifecycle.status().state, "stopped");
  assert.equal(store.writes.length, 4);

  engine.events.length = 0;
  await Promise.all([lifecycle.start(), lifecycle.start()]);
  assert.equal(engine.maxActive, 1);
  assert.equal(lifecycle.status().running, true, "duplicate starts settle to one running state");
  assert.equal(store.read().enabled, true);
  await lifecycle.dispose();
});

test("dispose is idempotent, blocks later operations, and never releases a late start", async () => {
  const { engine, lifecycle } = createLifecycle();
  const start = lifecycle.start();
  const disposed = await lifecycle.dispose();
  await start.catch(() => {});
  assert.equal(disposed.disposed, true);
  assert.equal(engine.state.disposed, true);
  assert.equal(engine.events.includes("start:start"), false, "dispose wins over a queued start");

  engine.events.length = 0;
  const after = await lifecycle.start();
  assert.equal(after.disposed, true);
  assert.deepEqual(engine.events, [], "operations after dispose do nothing");
  const again = await lifecycle.dispose();
  assert.equal(again.disposed, true);
});

test("the persisted record contains only schema, enabled, private-mode, and a timestamp", async () => {
  const engine = createFakeEngine();
  const store = createMemoryStore({ events: engine.events });
  const lifecycle = createObservationLifecycle({
    engine,
    getStore: async () => store,
    clock: () => Date.UTC(2026, 9, 27, 0, 0, 0),
    logger: { warn() {} },
  });
  await lifecycle.initialize();
  await lifecycle.start();
  await lifecycle.setPrivateMode(true);
  await lifecycle.setPrivateMode(false);
  await lifecycle.stop();

  assert.ok(store.writes.length >= 4);
  const sensitive = /frame|buffer|screenshot|ocr|summary|token|password|secret|credential|bearer/i;
  for (const write of store.writes) {
    assert.deepEqual(Object.keys(write).sort(), [
      "enabled",
      "privateMode",
      "schemaVersion",
      "updatedAt",
    ]);
    assert.equal(write.schemaVersion, OBSERVATION_PREFERENCE_SCHEMA_VERSION);
    assert.equal(typeof write.enabled, "boolean");
    assert.equal(typeof write.privateMode, "boolean");
    assert.equal(typeof write.updatedAt, "string");
    assert.doesNotMatch(JSON.stringify(write), sensitive);
  }
  assert.equal(readPreferenceRecord(store.read()).status, "ok");
  await lifecycle.dispose();
});

test("runtime handlers initialize and control through the lifecycle and surface safe errors", async () => {
  const { createZeroUiRuntimeHandlers, METHODS } = await import("../runtime-core.mjs");
  const engine = createFakeEngine();
  const store = createMemoryStore();
  const lifecycle = createObservationLifecycle({
    engine,
    getStore: async () => store,
    clock: () => Date.UTC(2026, 9, 27, 0, 0, 0),
    logger: { warn() {} },
  });
  const handlers = createZeroUiRuntimeHandlers({
    getObservationEngine: () => engine,
    getObservationLifecycle: () => lifecycle,
  });
  const responses = [];
  const respond = (ok, payload, error) => responses.push({ ok, payload, error });

  await handlers[METHODS.observationStatus]({ params: {}, respond });
  assert.equal(responses.at(-1).ok, true);
  assert.equal(responses.at(-1).payload.preferenceStatus, "missing");

  await handlers[METHODS.observationControl]({ params: { action: "start" }, respond });
  assert.equal(responses.at(-1).ok, true);
  assert.equal(responses.at(-1).payload.enabled, true);
  assert.equal(store.read().enabled, true);

  store.failWrites = true;
  await handlers[METHODS.observationControl]({ params: { action: "private-on" }, respond });
  assert.equal(responses.at(-1).ok, false);
  assert.equal(responses.at(-1).error.code, "observation-preference-unavailable");
  assert.match(responses.at(-1).error.message, /Private Mode was applied/);
  assert.equal(lifecycle.status().privateMode, true);
  await lifecycle.dispose();
});
