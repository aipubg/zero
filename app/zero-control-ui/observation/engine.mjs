import os from "node:os";
import path from "node:path";
import { createCuaCaptureSource } from "./capture-source.mjs";
import { createChangeDetector } from "./change-detector.mjs";
import { OBSERVATION_LIMITS, OBSERVATION_STATES } from "./constants.mjs";
import { createObservationStore, DEFAULT_PRUNE_BATCH } from "./memory-store.mjs";
import {
  createPerceptionPipeline,
  createPowerShellUiaAdapter,
  createWindowsOcrAdapter,
} from "./perception.mjs";
import { createFrameRing } from "./ring-buffer.mjs";
import { createWorkerQueue } from "./worker-queue.mjs";

function defaultDbPath(env = process.env) {
  const base = env.LOCALAPPDATA || path.join(os.homedir(), ".zero");
  return path.join(base, "Zero", "observation", "observations.sqlite");
}

function isAbort(error) {
  return error?.name === "AbortError" || error?.code === "ABORT_ERR";
}

/**
 * In-process observation engine.
 *
 * Capture is off until `start()` is called through the owner-facing control
 * method. The engine owns only volatile compressed frames, a bounded worker
 * queue, and local summary memory. It has no network client and no cloud
 * fallback.
 */
export function createObservationEngine({
  source,
  ring = createFrameRing(),
  detector = createChangeDetector(),
  queue = createWorkerQueue({
    concurrency: OBSERVATION_LIMITS.maxWorkerConcurrency,
    maxPending: OBSERVATION_LIMITS.maxWorkerPending,
  }),
  perception = createPerceptionPipeline(),
  store = createObservationStore({ dbPath: defaultDbPath() }),
  clock = Date.now,
  setTimeoutFn = typeof setTimeout === "function" ? setTimeout : null,
  clearTimeoutFn = typeof clearTimeout === "function" ? clearTimeout : null,
  captureIntervalMs = OBSERVATION_LIMITS.captureIntervalMs,
  idleIntervalMs = OBSERVATION_LIMITS.idleIntervalMs,
  idleAfterUnchanged = OBSERVATION_LIMITS.idleAfterUnchanged,
  maxConsecutiveErrors = OBSERVATION_LIMITS.maxConsecutiveErrors,
  cleanupTimeoutMs = OBSERVATION_LIMITS.cleanupTimeoutMs,
  pruneIntervalMs = 15 * 60_000,
  pruneBatch = DEFAULT_PRUNE_BATCH,
  autoCapture = true,
  logger = null,
} = {}) {
  let enabled = false;
  let privateMode = false;
  let running = false;
  let inFlight = false;
  let timer = null;
  let generation = 0;
  let activeController = null;
  let lastSignature = null;
  let unchangedCount = 0;
  let lastCaptureAtMs = null;
  let lastChangeAtMs = null;
  let lastError = null;
  let consecutiveErrors = 0;
  let captureDone = null;
  let resolveCaptureDone = null;
  let pruneTimer = null;
  let lastPruneAtMs = null;
  let lastPruneDeleted = 0;
  let lastPruneError = null;
  let sourceStopPending = false;
  let storeClosed = false;
  let disposeRequested = false;
  let lastSettlement = null;
  let state = OBSERVATION_STATES.idle;
  const workflowCounts = new Map();
  const counters = {
    captureAttempts: 0,
    captured: 0,
    deduped: 0,
    accepted: 0,
    processed: 0,
    droppedRate: 0,
    droppedCap: 0,
    droppedBackpressure: 0,
    errors: 0,
    privateClears: 0,
  };

  const sourceAvailable = () => source?.available !== false;

  const status = () => ({
    state,
    enabled,
    privateMode,
    running,
    inFlight,
    sourceAvailable: sourceAvailable(),
    sourceKind: typeof source?.kind === "string" ? source.kind : "unknown",
    ring: ring.stats(),
    queue: queue.stats(),
    store: storeClosed ? { opened: false, closed: true } : store.stats(),
    counters: { ...counters },
    consecutiveErrors,
    cleanupPending:
      inFlight || sourceStopPending || queue.stats().active > 0 || queue.stats().pending > 0,
    lastSettlement,
    storeClosed,
    lastCaptureAtMs,
    lastChangeAtMs,
    lastError,
    lastPruneAtMs,
    lastPruneDeleted,
    lastPruneError,
    limits: { ...OBSERVATION_LIMITS },
  });

  const clearTimer = () => {
    if (timer != null && typeof clearTimeoutFn === "function") clearTimeoutFn(timer);
    timer = null;
  };

  const clearPruneTimer = () => {
    if (pruneTimer != null && typeof clearTimeoutFn === "function") clearTimeoutFn(pruneTimer);
    pruneTimer = null;
  };

  const pruneOnce = () => {
    if (storeClosed) return { ok: false, deleted: 0, more: false, reason: "store-closed" };
    try {
      const result = store.prune({ limit: pruneBatch });
      lastPruneAtMs = clock();
      lastPruneDeleted = result.deleted;
      lastPruneError = null;
      return result;
    } catch (error) {
      lastPruneAtMs = clock();
      lastPruneError = error instanceof Error ? error.message : "prune failed";
      logger?.warn?.(`[zero-observation] retention prune failed: ${lastPruneError}`);
      return { ok: false, deleted: 0, more: false };
    }
  };

  const schedulePrune = (delayMs = pruneIntervalMs) => {
    if (typeof setTimeoutFn !== "function") return;
    clearPruneTimer();
    pruneTimer = setTimeoutFn(() => {
      pruneTimer = null;
      const result = pruneOnce();
      schedulePrune(result?.more ? 1_000 : pruneIntervalMs);
    }, Math.max(0, Math.min(pruneIntervalMs, Number(delayMs) || pruneIntervalMs)));
  };

  const delay = (ms) =>
    new Promise((resolve) => {
      const timer = typeof setTimeoutFn === "function" ? setTimeoutFn : globalThis.setTimeout;
      if (typeof timer === "function") timer(resolve, Math.max(0, ms));
      else resolve();
    });

  const waitForSettlement = async (promise, timeoutMs) => {
    let settled = false;
    const observed = Promise.resolve(promise).then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    await Promise.race([observed, delay(timeoutMs)]);
    return settled;
  };

  const maybeCloseStore = () => {
    if (!disposeRequested || storeClosed) return false;
    if (
      inFlight ||
      sourceStopPending ||
      queue.stats().active > 0 ||
      queue.stats().pending > 0
    ) {
      return false;
    }
    try {
      store.close();
      storeClosed = true;
      disposeRequested = false;
      return true;
    } catch {
      return false;
    }
  };

  const settleWork = async () => {
    const deadline = Date.now() + Math.max(0, cleanupTimeoutMs);
    const remaining = () => Math.max(0, deadline - Date.now());
    const captureSettled = captureDone
      ? await waitForSettlement(captureDone, remaining())
      : true;
    const queueSettled = await waitForSettlement(queue.whenIdle(), remaining());
    const settled = captureSettled && queueSettled;
    lastSettlement = {
      captureSettled,
      queueSettled,
      settled,
      timedOut: !settled,
      timeoutMs: cleanupTimeoutMs,
    };
    if (settled) maybeCloseStore();
    return lastSettlement;
  };

  const stopSourceBounded = async () => {
    sourceStopPending = true;
    const stopped = Promise.resolve().then(() => source?.stop?.());
    const settled = await waitForSettlement(stopped, cleanupTimeoutMs);
    if (settled) {
      sourceStopPending = false;
      maybeCloseStore();
      return true;
    }
    void stopped.then(
      () => {
        sourceStopPending = false;
        maybeCloseStore();
      },
      () => {
        sourceStopPending = false;
        maybeCloseStore();
      },
    );
    return false;
  };

  const abortActive = (reason) => {
    generation += 1;
    try {
      activeController?.abort(new Error(reason));
    } catch {
      // ignore
    }
    activeController = null;
  };

  const clearVolatile = (reason) => {
    abortActive(reason);
    queue.clear(reason);
    ring.clear();
    lastSignature = null;
    unchangedCount = 0;
    workflowCounts.clear();
    counters.privateClears += reason === "private-mode" ? 1 : 0;
  };

  const rememberWorkflow = (observation) => {
    const app = String(observation?.app ?? "").trim();
    const window = String(observation?.window ?? "").trim();
    if (!app && !window) return;
    const key = `${app}|${window}`;
    const next = (workflowCounts.get(key) ?? 0) + 1;
    workflowCounts.set(key, next);
    if (next === 3 || next === 10 || next === 25) {
      store.recordWorkflowCandidate({
        key,
        app,
        window,
        evidenceCount: next,
        confidence: Math.min(0.9, 0.25 + next * 0.1),
      });
    }
    if (workflowCounts.size > 128) {
      const oldest = workflowCounts.keys().next().value;
      if (oldest !== undefined) workflowCounts.delete(oldest);
    }
  };

  const processFrame = async (frame, { signal, generation: jobGeneration } = {}) => {
    signal?.throwIfAborted?.();
    const observation = await perception.processFrame(frame, { signal });
    if (privateMode || disposeRequested || storeClosed || jobGeneration !== generation) {
      return { stored: false, reason: "cancelled" };
    }
    store.insertObservation(observation);
    counters.processed += 1;
    rememberWorkflow(observation);
    return { stored: true, observation };
  };

  const scheduleNext = () => {
    if (!running || privateMode || typeof setTimeoutFn !== "function") return;
    clearTimer();
    const interval =
      unchangedCount >= idleAfterUnchanged ? idleIntervalMs : captureIntervalMs;
    timer = setTimeoutFn(() => {
      timer = null;
      void captureOnce();
    }, interval);
  };

  const captureOnce = async () => {
    if (!running || privateMode || inFlight || disposeRequested) return status();
    if (!sourceAvailable()) {
      state = OBSERVATION_STATES.unavailable;
      lastError = "CUA_DRIVER_UNAVAILABLE: no installed capture source";
      running = false;
      return status();
    }
    inFlight = true;
    captureDone = new Promise((resolve) => { resolveCaptureDone = resolve; });
    const runGeneration = generation;
    const controller = new AbortController();
    activeController = controller;
    counters.captureAttempts += 1;
    try {
      const frame = await source.capture({ signal: controller.signal });
      controller.signal.throwIfAborted();
      if (privateMode || runGeneration !== generation) return status();
      consecutiveErrors = 0;
      lastCaptureAtMs = clock();
      counters.captured += 1;
      const result = detector.evaluate(lastSignature, frame);
      if (!result.changed) {
        counters.deduped += 1;
        unchangedCount += 1;
        lastSignature = detector.remember(frame, result);
        return status();
      }
      unchangedCount = 0;
      lastChangeAtMs = clock();
      lastSignature = detector.remember(frame, result);
      const added = ring.add(frame);
      if (!added.accepted) {
        if (added.reason === "rate" || added.reason === "too-large") counters.droppedRate += 1;
        else counters.droppedCap += 1;
        return status();
      }
      counters.accepted += 1;
      const queued = queue.enqueue(
        ({ signal }) => processFrame(frame, { signal, generation: runGeneration }),
        { capturedAtMs: frame.capturedAtMs },
      );
      if (!queued.accepted) counters.droppedBackpressure += 1;
      lastError = null;
    } catch (error) {
      if (isAbort(error) || controller.signal.aborted) return status();
      counters.errors += 1;
      consecutiveErrors += 1;
      lastError = error instanceof Error ? error.message : "capture failed";
      logger?.warn?.(`[zero-observation] ${lastError}`);
      if (consecutiveErrors >= maxConsecutiveErrors) {
        running = false;
        state = OBSERVATION_STATES.error;
      }
    } finally {
      if (activeController === controller) activeController = null;
      inFlight = false;
      resolveCaptureDone?.();
      resolveCaptureDone = null;
      captureDone = null;
      scheduleNext();
    }
    return status();
  };

  const start = async () => {
    if (disposeRequested) return status();
    if (privateMode) {
      state = OBSERVATION_STATES.private;
      return status();
    }
    if (running) return status();
    if (!sourceAvailable()) {
      state = OBSERVATION_STATES.unavailable;
      lastError = "CUA_DRIVER_UNAVAILABLE: no installed capture source";
      return status();
    }
    enabled = true;
    try {
      await source.start();
    } catch (error) {
      enabled = false;
      state = OBSERVATION_STATES.error;
      lastError = error instanceof Error ? error.message : "capture start failed";
      return status();
    }
    running = true;
    state = OBSERVATION_STATES.capturing;
    consecutiveErrors = 0;
    schedulePrune(0);
    if (autoCapture) void captureOnce();
    return status();
  };

  const stop = async () => {
    enabled = false;
    running = false;
    clearTimer();
    clearPruneTimer();
    clearVolatile("stop");
    consecutiveErrors = 0;
    await stopSourceBounded();
    await settleWork();
    state = OBSERVATION_STATES.stopped;
    maybeCloseStore();
    return status();
  };

  const setPrivateMode = async (next) => {
    const value = next === true;
    if (value === privateMode) return status();
    privateMode = value;
    if (value) {
      running = false;
      clearTimer();
      clearPruneTimer();
      clearVolatile("private-mode");
      consecutiveErrors = 0;
      await stopSourceBounded();
      await settleWork();
      state = OBSERVATION_STATES.private;
      maybeCloseStore();
      return status();
    }
    // Exiting Private Mode only clears the flag. The lifecycle owner decides
    // whether to resume capture so there is exactly one start attempt.
    state = enabled ? OBSERVATION_STATES.idle : OBSERVATION_STATES.stopped;
    return status();
  };

  const recent = (params = {}) => (storeClosed ? [] : store.recent(params));
  const workflowCandidates = (params = {}) =>
    storeClosed ? [] : store.listWorkflowCandidates(params);

  const killSwitch = async () => {
    enabled = false;
    running = false;
    privateMode = true;
    clearTimer();
    clearPruneTimer();
    clearVolatile("kill-switch");
    ring.clear();
    consecutiveErrors = 0;
    try {
      source.stop?.();
    } catch {}
    state = OBSERVATION_STATES.stopped;
    return { ok: true, stopped: true, ringCleared: true, timestamp: clock() };
  };

  const dispose = async () => {
    disposeRequested = true;
    await stop();
    const current = status();
    if (!current.cleanupPending) {
      maybeCloseStore();
    } else {
      if (captureDone) {
        void Promise.resolve(captureDone).then(maybeCloseStore, maybeCloseStore);
      }
      void queue.whenIdle().then(maybeCloseStore, maybeCloseStore);
    }
    return status();
  };

  return {
    start,
    stop,
    setPrivateMode,
    killSwitch,
    captureOnce,
    pruneOnce,
    status,
    recent,
    workflowCandidates,
    dispose,
    processFrame,
  };
}

export function createDefaultObservationEngine(options = {}) {
  const source = options.source ?? createCuaCaptureSource();
  return createObservationEngine({
    ...options,
    source,
    perception:
      options.perception ??
      createPerceptionPipeline({
        uia: createPowerShellUiaAdapter(),
        ocr: createWindowsOcrAdapter(),
      }),
    store: options.store ?? createObservationStore({ dbPath: options.dbPath ?? defaultDbPath() }),
  });
}
