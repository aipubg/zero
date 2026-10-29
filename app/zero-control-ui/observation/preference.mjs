export const OBSERVATION_PREFERENCE_NAMESPACE = "observation-preference";
export const OBSERVATION_PREFERENCE_KEY = "state";
export const OBSERVATION_PREFERENCE_SCHEMA_VERSION = 1;

export const OBSERVATION_PREFERENCE_KEYS = Object.freeze([
  "schemaVersion",
  "enabled",
  "privateMode",
  "updatedAt",
]);

export function defaultPreference({ privateMode = false } = {}) {
  return {
    schemaVersion: OBSERVATION_PREFERENCE_SCHEMA_VERSION,
    enabled: false,
    privateMode: privateMode === true,
    updatedAt: null,
  };
}

export function readPreferenceRecord(value) {
  if (value === undefined) {
    return { status: "missing", preference: defaultPreference({ privateMode: false }) };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "malformed", preference: defaultPreference({ privateMode: true }) };
  }
  const keys = Object.keys(value).sort();
  const expected = [...OBSERVATION_PREFERENCE_KEYS].sort();
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index]) ||
    value.schemaVersion !== OBSERVATION_PREFERENCE_SCHEMA_VERSION ||
    typeof value.enabled !== "boolean" ||
    typeof value.privateMode !== "boolean" ||
    (value.updatedAt !== null && typeof value.updatedAt !== "string")
  ) {
    return { status: "malformed", preference: defaultPreference({ privateMode: true }) };
  }
  return {
    status: "ok",
    preference: {
      schemaVersion: OBSERVATION_PREFERENCE_SCHEMA_VERSION,
      enabled: value.enabled,
      privateMode: value.privateMode,
      updatedAt: value.updatedAt,
    },
  };
}

export function makePreferenceRecord({ enabled, privateMode, clock = Date.now }) {
  return {
    schemaVersion: OBSERVATION_PREFERENCE_SCHEMA_VERSION,
    enabled: enabled === true,
    privateMode: privateMode === true,
    updatedAt: new Date(clock()).toISOString(),
  };
}

export async function readStoredPreference(store) {
  try {
    const value = await store.lookup(OBSERVATION_PREFERENCE_KEY);
    return readPreferenceRecord(value);
  } catch {
    return {
      status: "unreadable",
      preference: defaultPreference({ privateMode: true }),
    };
  }
}

export async function writeStoredPreference(store, preference, clock = Date.now) {
  if (!store || typeof store.register !== "function") {
    throw new Error("observation preference store is unavailable");
  }
  const record = makePreferenceRecord({ ...preference, clock });
  await store.register(OBSERVATION_PREFERENCE_KEY, record);
  return record;
}
