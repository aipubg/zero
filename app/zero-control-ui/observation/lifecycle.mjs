import { sanitizeObservationError } from "../src/shared/observation-errors.js";
import { OBSERVATION_ACTIONS } from "./constants.mjs";
import { mapObservationRecord } from "./tool.mjs";
import {
  OBSERVATION_PREFERENCE_SCHEMA_VERSION,
  defaultPreference,
  readPreferenceRecord,
  readStoredPreference,
  writeStoredPreference,
} from "./preference.mjs";

export const OBSERVATION_PREFERENCE_ERROR_CODE = "observation-preference-unavailable";

const SAFE_ERROR = Object.freeze({
  preferenceUnavailable: "preference-unavailable",
  preferenceWriteFailed: "preference-write-failed",
  engineStartUnavailable: "capture-start-unavailable",
  engineStartError: "capture-start-error",
  engineStartRejected: "capture-start-rejected",
  engineStartNotRunning: "capture-start-not-running",
  engineStartPrivate: "capture-start-private",
  enginePrivateFailed: "engine-private-failed",
  engineStatusUnavailable: "engine-status-unavailable",
});

const START_FAILURE_MESSAGE = Object.freeze({
  unavailable: "Capture source is unavailable; no capture was started.",
  error: "Capture failed to start; no capture is running.",
  rejected: "Capture start was rejected; no capture is running.",
  private: "Private Mode is active; capture was not started.",
  "not-running": "Capture did not enter the running state; no capture is running.",
});

const START_SAFE_ERRORS = Object.freeze({
  unavailable: SAFE_ERROR.engineStartUnavailable,
  error: SAFE_ERROR.engineStartError,
  rejected: SAFE_ERROR.engineStartRejected,
  private: SAFE_ERROR.engineStartPrivate,
  "not-running": SAFE_ERROR.engineStartNotRunning,
});

const SAFE_OBSERVATION_STATES = new Set([
  "idle",
  "capturing",
  "private",
  "stopped",
  "error",
  "unavailable",
]);

const SAFE_MESSAGE = Object.freeze({
  start: "Observation preference storage is unavailable; capture was not started.",
  stop:
    "Observation preference storage is unavailable; capture was stopped but the disabled preference could not be recorded.",
  "private-on":
    "Observation preference storage is unavailable; Private Mode was applied but could not be recorded.",
  "private-off":
    "Observation preference storage is unavailable; Private Mode remains active.",
  default: "Observation preference storage is unavailable; capture was not started.",
});

export class ObservationPreferenceError extends Error {
  constructor(message, { operation = "control", cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ObservationPreferenceError";
    this.code = OBSERVATION_PREFERENCE_ERROR_CODE;
    this.operation = operation;
  }
}

function engineUnavailableStatus() {
  return {
    state: "unavailable",
    enabled: false,
    privateMode: true,
    running: false,
    inFlight: false,
    cleanupPending: false,
    store: { opened: false },
    ring: { frames: 0, bytes: 0 },
    queue: { active: 0, pending: 0 },
    counters: {},
  };
}

function safeObservationState(value) {
  return SAFE_OBSERVATION_STATES.has(value) ? value : "unknown";
}

function isCaptureRunning(status) {
  return status?.running === true && status?.state === "capturing";
}

function normalizeEngineStatus(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return engineUnavailableStatus();
  }
  const status = { ...value };
  if (typeof status.lastError === "string") {
    status.lastError = sanitizeObservationError(status.lastError, 200);
  }
  if (typeof status.lastPruneError === "string") {
    status.lastPruneError = sanitizeObservationError(status.lastPruneError, 200);
  }
  return status;
}

/**
 * Durable owner opt-in for continuous observation.
 *
 * The lifecycle serializes every owner action, persists the strict preference
 * record before reporting success, and fails closed when the preference store is
 * missing, malformed, unreadable, or cannot be written. It never stores frames,
 * OCR text, summaries, or credentials; only the preference module's exact keys
 * are written.
 */
export function createObservationLifecycle({
  engine,
  getStore,
  clock = Date.now,
  logger = null,
} = {}) {
  if (!engine || typeof engine.status !== "function") {
    throw new Error("observation engine is required");
  }

  let preference = null;
  let preferenceStatus = "uninitialized";
  let initialized = false;
  let disposed = false;
  let store = null;
  let safeError = null;
  let startFailure = null;
  let queueDepth = 0;
  let chain = Promise.resolve();

  const enqueue = (task) => {
    queueDepth += 1;
    const run = chain.then(task, task).finally(() => {
      queueDepth -= 1;
    });
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };

  const readEngineStatus = () => {
    try {
      return normalizeEngineStatus(engine.status());
    } catch {
      safeError = SAFE_ERROR.engineStatusUnavailable;
      return engineUnavailableStatus();
    }
  };

  const snapshot = () => {
    const engineStatus = readEngineStatus();
    const captureRunning = isCaptureRunning(engineStatus);
    return {
      ...engineStatus,
      captureRunning,
      startFailed: startFailure !== null,
      ...(startFailure ? { startFailure: { ...startFailure } } : {}),
      preferenceEnabled: preference?.enabled === true,
      preferencePrivateMode: preference?.privateMode === true,
      preferenceSchemaVersion: OBSERVATION_PREFERENCE_SCHEMA_VERSION,
      preferenceStatus,
      preferenceUpdatedAt: preference?.updatedAt ?? null,
      lifecycle: {
        initialized,
        disposed,
        pendingOperations: queueDepth,
      },
      ...(safeError ? { safeError } : {}),
    };
  };

  const resolveStore = async () => {
    if (store) return store;
    if (typeof getStore !== "function") {
      throw new Error("observation preference store is unavailable");
    }
    const opened = await getStore();
    if (!opened || typeof opened.lookup !== "function" || typeof opened.register !== "function") {
      throw new Error("observation preference store is unavailable");
    }
    store = opened;
    return store;
  };

  const applyPrivate = async (errorCode = SAFE_ERROR.enginePrivateFailed) => {
    try {
      await engine.setPrivateMode(true);
      return true;
    } catch {
      safeError = errorCode;
      return false;
    }
  };

  const stopEngine = async () => {
    try {
      await engine.stop();
      return true;
    } catch {
      safeError = "engine-stop-failed";
      return false;
    }
  };

  const clearStartFailure = () => {
    startFailure = null;
    if (safeError && Object.values(START_SAFE_ERRORS).includes(safeError)) {
      safeError = null;
    }
  };

  const startFailureReason = (status) => {
    if (status?.privateMode === true || status?.state === "private") return "private";
    if (status?.state === "unavailable" || status?.sourceAvailable === false) return "unavailable";
    if (status?.state === "error") return "error";
    return "not-running";
  };

  const recordStartFailure = (origin, reason, status) => {
    startFailure = {
      origin,
      reason,
      state: safeObservationState(status?.state),
      message: START_FAILURE_MESSAGE[reason] ?? START_FAILURE_MESSAGE["not-running"],
    };
    safeError = START_SAFE_ERRORS[reason] ?? SAFE_ERROR.engineStartNotRunning;
    logger?.warn?.(`[zero-observation] capture start failed (${origin}/${reason})`);
  };

  const startEngine = async (origin = "explicit") => {
    let returned;
    try {
      returned = await engine.start();
    } catch {
      const status = readEngineStatus();
      recordStartFailure(origin, "rejected", status);
      return { ok: false, status };
    }
    const status = normalizeEngineStatus(
      returned && typeof returned === "object" ? returned : readEngineStatus(),
    );
    if (isCaptureRunning(status)) {
      clearStartFailure();
      return { ok: true, status };
    }
    recordStartFailure(origin, startFailureReason(status), status);
    return { ok: false, status };
  };

  const markStoreFailure = (operation) => {
    preference = defaultPreference({ privateMode: true });
    preferenceStatus = "write-failed";
    startFailure = null;
    safeError = SAFE_ERROR.preferenceWriteFailed;
    logger?.warn?.(`[zero-observation] preference persistence failed during ${operation}`);
  };

  const persist = async (next, operation) => {
    let currentStore;
    try {
      currentStore = await resolveStore();
    } catch (error) {
      markStoreFailure(operation);
      throw new ObservationPreferenceError(SAFE_MESSAGE[operation] ?? SAFE_MESSAGE.default, {
        operation,
        cause: error,
      });
    }
    try {
      const record = await writeStoredPreference(currentStore, next, clock);
      preference = readPreferenceRecord(record).preference;
      preferenceStatus = "stored";
      safeError = null;
      return record;
    } catch (error) {
      markStoreFailure(operation);
      throw new ObservationPreferenceError(SAFE_MESSAGE[operation] ?? SAFE_MESSAGE.default, {
        operation,
        cause: error,
      });
    }
  };

  const doInitialize = async () => {
    if (initialized) return snapshot();
    initialized = true;
    if (disposed) return snapshot();

    if (preferenceStatus === "uninitialized") preferenceStatus = "loading";
    try {
      const currentStore = await resolveStore();
      const read = await readStoredPreference(currentStore);
      preference = read.preference;
      preferenceStatus = read.status === "ok" ? "stored" : read.status;
      if (disposed) return snapshot();
      if (read.status === "malformed" || read.status === "unreadable") {
        preference = defaultPreference({ privateMode: true });
        startFailure = null;
        safeError = SAFE_ERROR.preferenceUnavailable;
        await applyPrivate();
        return snapshot();
      }
      if (read.preference.privateMode) {
        startFailure = null;
        await applyPrivate();
        return snapshot();
      }
      if (read.preference.enabled) {
        await startEngine("startup");
      } else {
        clearStartFailure();
      }
      return snapshot();
    } catch {
      preference = defaultPreference({ privateMode: true });
      preferenceStatus = "unavailable";
      startFailure = null;
      safeError = SAFE_ERROR.preferenceUnavailable;
      await applyPrivate();
      return snapshot();
    }
  };

  const ensureInitialized = async () => {
    if (!initialized) await doInitialize();
  };

  const initialize = () =>
    enqueue(async () => {
      if (disposed) {
        initialized = true;
        return snapshot();
      }
      await ensureInitialized();
      return snapshot();
    });

  const start = () =>
    enqueue(async () => {
      if (disposed) return snapshot();
      await ensureInitialized();
      const privateMode = preference?.privateMode === true;
      try {
        await persist({ enabled: true, privateMode }, "start");
      } catch (error) {
        await stopEngine();
        await applyPrivate();
        throw error;
      }
      if (disposed) {
        await stopEngine();
        await applyPrivate();
        return snapshot();
      }
      if (privateMode) {
        clearStartFailure();
        await applyPrivate();
      } else {
        await startEngine("explicit");
      }
      return snapshot();
    });

  const stop = () =>
    enqueue(async () => {
      if (disposed) return snapshot();
      await ensureInitialized();
      const privateMode = preference?.privateMode === true;
      try {
        await persist({ enabled: false, privateMode }, "stop");
      } catch (error) {
        await stopEngine();
        await applyPrivate();
        throw error;
      }
      await stopEngine();
      clearStartFailure();
      return snapshot();
    });

  const setPrivateMode = (next) =>
    enqueue(async () => {
      if (disposed) return snapshot();
      await ensureInitialized();
      const enabled = preference?.enabled === true;
      if (next === true) {
        try {
          await persist({ enabled, privateMode: true }, "private-on");
        } catch (error) {
          await applyPrivate();
          clearStartFailure();
          throw error;
        }
        if (disposed) {
          await applyPrivate();
          clearStartFailure();
          return snapshot();
        }
        await applyPrivate();
        clearStartFailure();
        return snapshot();
      }
      try {
        await persist({ enabled, privateMode: false }, "private-off");
      } catch (error) {
        await applyPrivate();
        clearStartFailure();
        throw error;
      }
      if (disposed) {
        await applyPrivate();
        clearStartFailure();
        return snapshot();
      }
      try {
        await engine.setPrivateMode(false);
      } catch {
        safeError = SAFE_ERROR.enginePrivateFailed;
        await applyPrivate();
        clearStartFailure();
        return snapshot();
      }
      if (enabled) {
        await startEngine("private-off");
      } else {
        clearStartFailure();
      }
      return snapshot();
    });

  const control = (action) => {
    if (!OBSERVATION_ACTIONS.includes(action)) {
      return Promise.reject(new Error(`unsupported observation action: ${String(action)}`));
    }
    if (action === "start") return start();
    if (action === "stop") return stop();
    return setPrivateMode(action === "private-on");
  };

  const recent = ({ limit = 20 } = {}) => {
    const status = snapshot();
    const boundedLimit = Math.min(20, Math.max(1, Number.isInteger(limit) ? limit : 20));
    const blockedReason =
      status.privateMode === true || status.state === "private"
        ? "private-mode"
        : status.enabled !== true || status.state === "stopped"
          ? "observation-disabled"
          : null;
    if (blockedReason) {
      return {
        ok: false,
        reason: blockedReason,
        count: 0,
        observations: [],
        state: status.state,
        privateMode: status.privateMode === true,
        captureRunning: false,
        preferenceEnabled: status.preferenceEnabled === true,
      };
    }
    let rows;
    try {
      rows = engine.recent({ limit: boundedLimit });
    } catch {
      return {
        ok: false,
        reason: "memory-unavailable",
        count: 0,
        observations: [],
        state: status.state,
        privateMode: false,
        captureRunning: status.captureRunning === true,
        preferenceEnabled: status.preferenceEnabled === true,
      };
    }
    const observations = (Array.isArray(rows) ? rows : [])
      .map(mapObservationRecord)
      .filter(Boolean)
      .slice(0, boundedLimit);
    return {
      ok: true,
      count: observations.length,
      observations,
      state: status.state,
      privateMode: false,
      captureRunning: status.captureRunning === true,
      preferenceEnabled: status.preferenceEnabled === true,
    };
  };

  const dispose = () => {
    disposed = true;
    return enqueue(async () => {
      try {
        await engine.dispose();
      } catch {
        safeError = "engine-dispose-failed";
      }
      return { ...snapshot(), disposed: true };
    });
  };

  return {
    initialize,
    start,
    stop,
    setPrivateMode,
    control,
    recent,
    status: snapshot,
    dispose,
  };
}
