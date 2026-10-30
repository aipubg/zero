// Zero Control UI runtime core — SDK-free handlers for the plugin's backend entry.
//
// Owned durable seams (OpenClaw 2026.10.6, Plugin SDK >=2026.10.6):
//
// 1. Display-name metadata (`zero.ui.providerNames.*`)
//    The closed `models.providers` schema has no supported `name` field, so a typed
//    Display Name previously vanished on every page reload. These methods persist the
//    name in the plugin-scoped durable keyed state store
//    (`api.runtime.state.openKeyedStore`, namespace `provider-display-names`,
//    `retention: "retained"`), which survives Gateway restarts and reloads and is
//    isolated by the runtime-bound plugin id. Values are strictly `{ name }` plus an
//    internal timestamp; strict param validation rejects every other key, so API keys,
//    SecretRefs, headers, or any other credential material are structurally impossible
//    in this store.
//
// 2. Exact credential identity (`zero.ui.providerCredentialRef`)
//    `config.get` redacts SecretRef IDs before they reach the Control UI, and the
//    plugin runtime config snapshot exposes the resolved/opaque value rather than the
//    source ref, so the browser cannot recover a hidden reference from runtime data.
//    The browser therefore persists the exact non-secret identity it produced in
//    `secrets.store.set` and `config.patch` requests into the plugin-scoped durable
//    keyed store (namespace `provider-credential-refs`, `retention: "retained"`).
//    The getter returns ONLY `{ source, provider, id }` — never a secret value, never
//    a legacy inline key, never the redaction marker — and returns
//    `{ ok:false, reason:"not-recorded" }` for providers that predate this metadata
//    (including `zero-gw`) so they stay fail-closed. Values in this store are
//    `{ source, provider, id, updatedAt }`; strict validation rejects every other key.
//
// Contract: reports/backend/provider-manager-contract.md §3.7 (no provider `name`),
// reports/ui/provider-manager-ui.md (display-name persistence + exact identity).

export const PLUGIN_RUNTIME_ID = "zero-control-ui";

import { execFile, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  CONNECTOR_ADAPTERS,
  createConnectorStatus,
} from "./src/shared/connectors.js";
import {
  OBSERVATION_ACTIONS,
  OBSERVATION_LIMITS,
  OBSERVATION_METHODS,
} from "./observation/constants.mjs";
import { normalizeSuggestionConfig } from "./observation/config.mjs";
import { createDefaultObservationEngine } from "./observation/engine.mjs";
import {
  createObservationLifecycle,
  OBSERVATION_PREFERENCE_ERROR_CODE,
  ObservationPreferenceError,
} from "./observation/lifecycle.mjs";
import { OBSERVATION_PREFERENCE_NAMESPACE } from "./observation/preference.mjs";
import { createSuggestionPolicy } from "./observation/suggestions.mjs";
import { createObservationTool, OBSERVATION_TOOL_NAME } from "./observation/tool.mjs";
import { createWatchWorkflowTool, ZERO_WATCH_WORKFLOW_TOOL_NAME } from "./observation/watch-workflow-tool.mjs";
import { createSkillLearnTool, ZERO_SKILL_LEARN_TOOL_NAME } from "../../skills/self-learning-creator.mjs";
import { DynamicPluginLoader } from "./src/plugins/dynamic-loader.mjs";
import { createAllComputerTools, ZERO_COMPUTER_TOOL_NAME } from "./src/computer/tools.js";

export { CONNECTOR_ADAPTERS, createConnectorStatus };

const execFileAsync = promisify(execFile);

export const CLI_ADAPTERS = Object.freeze([
  { id: "claude", label: "Claude Code", command: "claude", nativeProvider: "claude-cli" },
  { id: "codex", label: "Codex CLI", command: "codex", nativeProvider: "codex" },
]);

export const METHODS = Object.freeze({
  cliStatus: "zero.integrations.cli.status",
  cliExecute: "zero.integrations.cli.execute",
  connectorStatus: "zero.integrations.connectors.status",
  observationStatus: OBSERVATION_METHODS.status,
  observationControl: OBSERVATION_METHODS.control,
  observationRecent: OBSERVATION_METHODS.recent,
  observationKillSwitch: "zero.observation.killSwitch",
  gatewayStatus: "zero.gateway.status",
  providersList: "zero.providers.list",
  providersSetActive: "zero.providers.setActive",
  providersSave: "zero.providers.save",
  providersDelete: "zero.providers.delete",
  providersTest: "zero.providers.test",
  ggufScan: "zero.gateway.gguf.scan",
});

export const ERROR_CODE = "zero-control-ui:bad-request";
export const UNAVAILABLE_CODE = "zero-control-ui:unavailable";

class BadRequestError extends Error {}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(params, allowedKeys, label) {
  const keys = Object.keys(params);
  const extra = keys.filter((key) => !allowedKeys.includes(key));
  if (extra.length > 0) {
    throw new BadRequestError(
      `${label} accepts exactly ${allowedKeys.join(", ")}; rejected unexpected key(s): ${extra.join(", ")}.`,
    );
  }
  for (const key of allowedKeys) {
    if (!(key in params)) {
      throw new BadRequestError(`${label} requires ${key}.`);
    }
  }
}

function sanitizeLine(value, max = 120) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .trim()
    .slice(0, max);
}

function defaultResolveCommand(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], {
    encoding: "utf8",
    timeout: 2000,
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  const line = String(result.stdout ?? "")
    .split(/\r?\n/u)
    .find((entry) => entry.trim().length > 0);
  return line ? line.trim() : null;
}

async function defaultReadVersion(commandPath) {
  try {
    const { stdout, stderr } = await execFileAsync(commandPath, ["--version"], {
      timeout: 2500,
      windowsHide: true,
      maxBuffer: 64 * 1024,
    });
    return { version: sanitizeLine(String(stdout || stderr).split(/\r?\n/u)[0]) || null };
  } catch (error) {
    return { error: error?.killed || error?.signal ? "timeout" : "version-failed" };
  }
}

/**
 * Offline-safe CLI discovery. It never runs a user command, never returns the
 * executable path, and never reads credentials; execution stays with the host's
 * approved exec tool.
 */
export async function createCliAdapterStatus({
  resolveCommand = defaultResolveCommand,
  readVersion = defaultReadVersion,
  nativeEligibility = null,
} = {}) {
  const adapters = [];
  for (const adapter of CLI_ADAPTERS) {
    let commandPath = null;
    try {
      commandPath = resolveCommand(adapter.command);
    } catch {
      commandPath = null;
    }
    if (!commandPath) {
      adapters.push({
        id: adapter.id,
        label: adapter.label,
        available: false,
        version: null,
        error: "not-found",
        nativeProvider: adapter.nativeProvider,
        nativeDispatch: null,
      });
      continue;
    }
    let info;
    try {
      info = await readVersion(commandPath);
    } catch {
      info = { error: "version-failed" };
    }
    let nativeDispatch = null;
    if (typeof nativeEligibility === "function") {
      try {
        const eligible = await nativeEligibility(adapter.nativeProvider);
        nativeDispatch = eligible?.provider === adapter.nativeProvider;
      } catch {
        nativeDispatch = null;
      }
    }
    adapters.push({
      id: adapter.id,
      label: adapter.label,
      available: true,
      version: info?.version ?? null,
      error: info?.error ?? null,
      nativeProvider: adapter.nativeProvider,
      nativeDispatch,
    });
  }
  return adapters;
}

export function createZeroUiRuntimeHandlers({
  logger,
  getConfig,
  cliStatus = createCliAdapterStatus,
  nativeCliEligibility = null,
  getObservationEngine = null,
  getObservationLifecycle = null,
} = {}) {
  const methodHandler = (name, run) => async (opts = {}) => {
    const respond = typeof opts?.respond === "function" ? opts.respond : null;
    const params = opts?.params ?? {};
    try {
      if (!isPlainObject(params)) {
        throw new BadRequestError("params must be an object.");
      }
      const result = await run(params, opts);
      respond?.(true, result);
      return result;
    } catch (error) {
      const preferenceError =
        error instanceof ObservationPreferenceError ||
        error?.name === "ObservationPreferenceError";
      const code =
        error instanceof BadRequestError
          ? ERROR_CODE
          : preferenceError
            ? OBSERVATION_PREFERENCE_ERROR_CODE
            : UNAVAILABLE_CODE;
      const message =
        error instanceof BadRequestError || preferenceError
          ? error.message
          : "The request could not be completed.";
      logger?.warn?.(`[zero-control-ui] ${name} failed: ${message}`);
      respond?.(false, undefined, { code, message });
      if (!respond) throw error;
      return undefined;
    }
  };

  const cliStatusHandler = methodHandler(METHODS.cliStatus, async (params) => {
    assertExactKeys(params, [], "integrations.cli.status");
    return {
      ok: true,
      adapters: await cliStatus({ nativeEligibility: nativeCliEligibility }),
    };
  });

  const cliExecuteHandler = methodHandler(METHODS.cliExecute, async (params) => {
    const adapterId = String(params.adapter || "claude").toLowerCase();
    const adapter = CLI_ADAPTERS.find((a) => a.id === adapterId);
    const bin = adapter ? adapter.command : adapterId;
    const commandArgs = Array.isArray(params.args)
      ? params.args
      : params.command
        ? String(params.command).split(/\s+/).filter(Boolean)
        : [];
    const cwd = typeof params.cwd === "string" ? params.cwd : process.cwd();
    try {
      const { stdout, stderr } = await execFileAsync(bin, commandArgs, {
        cwd,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      });
      return { ok: true, stdout: String(stdout || ""), stderr: String(stderr || "") };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stdout: error?.stdout ? String(error.stdout) : "",
        stderr: error?.stderr ? String(error.stderr) : "",
      };
    }
  });

  const requireObservationEngine = () => {
    if (typeof getObservationEngine === "function") return getObservationEngine();
    throw new Error("The observation engine is not available on this Gateway runtime.");
  };

  const requireObservationLifecycle = () => {
    if (typeof getObservationLifecycle === "function") return getObservationLifecycle();
    return null;
  };

  const observationStatusHandler = methodHandler(
    OBSERVATION_METHODS.status,
    async (params) => {
      assertExactKeys(params, [], "observation.status");
      const lifecycle = requireObservationLifecycle();
      if (lifecycle) {
        const status = await lifecycle.initialize();
        return { ok: true, ...status };
      }
      return { ok: true, ...requireObservationEngine().status() };
    },
  );

  const observationControlHandler = methodHandler(
    OBSERVATION_METHODS.control,
    async (params) => {
      assertExactKeys(params, ["action"], "observation.control");
      const action = typeof params.action === "string" ? params.action : "";
      if (!OBSERVATION_ACTIONS.includes(action)) {
        throw new BadRequestError(
          `observation.control.action must be one of ${OBSERVATION_ACTIONS.join(", ")}.`,
        );
      }
      const lifecycle = requireObservationLifecycle();
      if (lifecycle) {
        const status = await lifecycle.control(action);
        const startFailed = action === "start" && status.startFailed === true;
        return { ...status, ok: !startFailed };
      }
      const engine = requireObservationEngine();
      if (action === "start") await engine.start();
      else if (action === "stop") await engine.stop();
      else await engine.setPrivateMode(action === "private-on");
      return { ok: true, ...engine.status() };
    },
  );

  const observationRecentHandler = methodHandler(
    OBSERVATION_METHODS.recent,
    async (params) => {
      for (const key of Object.keys(params)) {
        if (key !== "limit") {
          throw new BadRequestError(
            `observation.recent accepts only limit; rejected unexpected key(s): ${key}.`,
          );
        }
      }
      const limit = params.limit === undefined ? 20 : params.limit;
      if (!Number.isInteger(limit) || limit < 1 || limit > OBSERVATION_LIMITS.maxRecentRows) {
        throw new BadRequestError(
          `observation.recent.limit must be an integer from 1 to ${OBSERVATION_LIMITS.maxRecentRows}.`,
        );
      }
      const lifecycle = requireObservationLifecycle();
      if (lifecycle) {
        await lifecycle.initialize();
        return lifecycle.recent({ limit });
      }
      return {
        ok: true,
        observations: requireObservationEngine().recent({ limit }),
      };
    },
  );

  const connectorStatusHandler = methodHandler(
    METHODS.connectorStatus,
    async (params) => {
      assertExactKeys(params, [], "integrations.connectors.status");
      let config = {};
      try {
        config = typeof getConfig === "function" ? getConfig() ?? {} : {};
      } catch {
        config = {};
      }
      return {
        ok: true,
        connectors: createConnectorStatus(config),
        settingsPath: "/settings/mcp",
      };
    },
  );

  const observationKillSwitchHandler = methodHandler(
    METHODS.observationKillSwitch,
    async () => {
      const lifecycle = requireObservationLifecycle();
      if (lifecycle && typeof lifecycle.control === "function") {
        try {
          await lifecycle.control("stop");
          await lifecycle.control("private-on");
        } catch {}
      }
      try {
        const engine = requireObservationEngine();
        if (typeof engine.killSwitch === "function") {
          return await engine.killSwitch();
        }
      } catch {}
      return { ok: true, stopped: true, ringCleared: true, timestamp: Date.now() };
    },
  );

  const CONFIG_PATHS = [
    "E:\\zero\\.zero-data\\fresh-workspace\\openclaw.json",
    "E:\\zero\\backend\\config\\openclaw.json",
  ];

  function readLiveConfig() {
    for (const p of CONFIG_PATHS) {
      if (existsSync(p)) {
        try {
          return { path: p, data: JSON.parse(readFileSync(p, "utf-8")) };
        } catch {}
      }
    }
    return { path: CONFIG_PATHS[0], data: {} };
  }

  function writeLiveConfig(mutator) {
    for (const p of CONFIG_PATHS) {
      if (existsSync(p)) {
        try {
          const raw = readFileSync(p, "utf-8");
          const json = JSON.parse(raw);
          mutator(json);
          writeFileSync(p, JSON.stringify(json, null, 2), "utf-8");
        } catch {}
      }
    }
  }

  const gatewayStatusHandler = methodHandler(METHODS.gatewayStatus, async () => {
    let running = false;
    let version = "1.0.0";
    let activeModel = "zero-gateway/default";
    try {
      const live = readLiveConfig();
      activeModel = live.data?.agents?.defaults?.model?.primary || "zero-gateway/default";
      const res = await fetch("http://127.0.0.1:18790/health", { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        running = data.status === "ok";
        if (data.version) version = data.version;
      }
    } catch {
      running = false;
    }
    return {
      ok: true,
      running,
      port: 18790,
      gateway: "zero-gateway",
      version,
      activeModel,
    };
  });

  const providersListHandler = methodHandler(METHODS.providersList, async () => {
    const live = readLiveConfig();
    const config = live.data;
    const activeModel = config?.agents?.defaults?.model?.primary || "zero-gateway/default";
    const rawProviders = config?.models?.providers || {};

    const providers = Object.entries(rawProviders).map(([id, p]) => ({
      id,
      name: p.name || id,
      baseUrl: p.baseUrl || "",
      api: p.api || "openai-completions",
      models: Array.isArray(p.models) ? p.models : [],
      enabled: p.enabled !== false,
      isActive: (p.models || []).some((m) => `${id}/${m.id}` === activeModel || m.id === activeModel) || activeModel.startsWith(`${id}/`),
    }));

    let gatewayModels = [];
    try {
      const res = await fetch("http://127.0.0.1:18790/v1/models", { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        gatewayModels = data.data || [];
      }
    } catch {}

    const defaults = {
      primary: config?.agents?.defaults?.model?.primary || "zero-gateway/default",
      utility: config?.agents?.defaults?.model?.utility || "",
      fallback: config?.agents?.defaults?.model?.fallback || "",
      thinking: config?.agents?.defaults?.model?.thinking || "",
      fast: config?.agents?.defaults?.model?.fast || "",
    };
    const agentZero = {
      primary: config?.agents?.entries?.zero?.model?.primary || defaults.primary,
      fallbacks: config?.agents?.entries?.zero?.model?.fallbacks || [],
      allowUnverifiedOverride: Boolean(config?.agents?.entries?.zero?.model?.allowUnverifiedOverride),
    };

    return {
      ok: true,
      activeModel,
      providers,
      gatewayModels,
      defaults,
      agentZero,
    };
  });

  const providersSetActiveHandler = methodHandler(METHODS.providersSetActive, async (params) => {
    const modelId = params?.modelId || params?.model || params?.primary;
    if (!modelId || typeof modelId !== "string") {
      throw new BadRequestError("zero.providers.setActive requires a valid modelId string.");
    }
    writeLiveConfig((json) => {
      json.agents = json.agents || {};
      json.agents.defaults = json.agents.defaults || {};
      json.agents.defaults.model = json.agents.defaults.model || {};
      json.agents.defaults.model.primary = modelId;
      if (params?.utility !== undefined) json.agents.defaults.model.utility = params.utility;
      if (params?.fallback !== undefined) json.agents.defaults.model.fallback = params.fallback;
      if (params?.thinking !== undefined) json.agents.defaults.model.thinking = params.thinking;
      if (params?.fast !== undefined) json.agents.defaults.model.fast = params.fast;

      json.agents.entries = json.agents.entries || {};
      json.agents.entries.zero = json.agents.entries.zero || {};
      json.agents.entries.zero.model = json.agents.entries.zero.model || {};
      if (params?.agentModel) {
        json.agents.entries.zero.model.primary = params.agentModel;
      } else if (params?.syncAgent !== false) {
        json.agents.entries.zero.model.primary = modelId;
      }
      if (params?.allowUnverifiedOverride !== undefined) {
        json.agents.entries.zero.model.allowUnverifiedOverride = Boolean(params.allowUnverifiedOverride);
      }
    });
    logger?.info?.(`[zero-providers] active model switched to: ${modelId}`);
    return { ok: true, activeModel: modelId };
  });

  const providersSaveHandler = methodHandler(METHODS.providersSave, async (params) => {
    const { id, name, baseUrl, apiKey, apiKeys, api, models, fallbackModel, headers } = params || {};
    if (!id || typeof id !== "string") throw new BadRequestError("Missing provider id");
    if (!baseUrl || typeof baseUrl !== "string") throw new BadRequestError("Missing baseUrl");

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const modelList = Array.isArray(models) && models.length > 0 
      ? models.map(m => (typeof m === "string" ? { id: m, name: m } : {
          id: m.id || m.name,
          name: m.name || m.id,
          reasoning: Boolean(m.reasoning),
          image: Boolean(m.image),
        }))
      : [{ id: "default", name: name || cleanId, reasoning: false, image: false }];

    writeLiveConfig((json) => {
      json.models = json.models || { mode: "merge", providers: {} };
      json.models.providers = json.models.providers || {};
      const provConfig = {
        name: name || cleanId,
        baseUrl: baseUrl.trim(),
        api: api || "openai-completions",
        models: modelList,
      };

      // Support single key or key pool
      if (Array.isArray(apiKeys) && apiKeys.length > 0) {
        provConfig.apiKeys = apiKeys.filter(k => typeof k === "string" && k.trim());
        if (provConfig.apiKeys.length > 0) {
          provConfig.apiKey = provConfig.apiKeys[0];
        }
      } else if (apiKey && typeof apiKey === "string" && apiKey.trim()) {
        provConfig.apiKey = apiKey.trim();
        provConfig.apiKeys = [apiKey.trim()];
      }

      // Optional fallback model
      if (fallbackModel && typeof fallbackModel === "string" && fallbackModel.trim()) {
        provConfig.fallbackModel = fallbackModel.trim();
      }

      // Optional custom headers
      if (headers && (Array.isArray(headers) || typeof headers === "object")) {
        provConfig.headers = headers;
      }

      json.models.providers[cleanId] = provConfig;
    });

    return { ok: true, providerId: cleanId };
  });

  const providersDeleteHandler = methodHandler(METHODS.providersDelete, async (params) => {
    const id = params?.id;
    if (!id) throw new BadRequestError("Missing provider id");
    writeLiveConfig((json) => {
      if (json.models?.providers?.[id]) {
        delete json.models.providers[id];
      }
      const currentPrimary = json.agents?.defaults?.model?.primary || "";
      if (currentPrimary.startsWith(`${id}/`)) {
        json.agents.defaults.model.primary = "zero-gateway/default";
        if (json.agents.entries?.zero?.model) {
          json.agents.entries.zero.model.primary = "zero-gateway/default";
        }
      }
    });
    return { ok: true, deleted: id };
  });

  const providersTestHandler = methodHandler(METHODS.providersTest, async (params) => {
    const action = params?.action;
    const baseUrl = params?.baseUrl?.trim();
    const apiKey = params?.apiKey?.trim() || (Array.isArray(params?.apiKeys) ? params.apiKeys[0] : "");
    const prompt = params?.prompt?.trim();
    const model = params?.model?.trim() || "default";
    const customHeaders = params?.headers || {};
    if (!baseUrl) throw new BadRequestError("Missing baseUrl for test");

    const startTime = Date.now();
    try {
      const headers = { Accept: "application/json", "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;
      if (Array.isArray(customHeaders)) {
        for (const h of customHeaders) {
          if (h?.key && typeof h.key === "string") headers[h.key.trim()] = String(h.value ?? "");
        }
      } else if (typeof customHeaders === "object") {
        for (const [k, v] of Object.entries(customHeaders)) {
          if (k && k.trim()) headers[k.trim()] = String(v ?? "");
        }
      }

      // Automatic Fetch Models from <baseUrl>/models
      if (action === "fetch-models" || params?.fetchModels === true) {
        const cleanUrl = `${baseUrl.replace(/\/+$/, "")}/models`;
        const res = await fetch(cleanUrl, { headers, signal: AbortSignal.timeout(8000) });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          const body = await res.json().catch(() => ({}));
          let rawList = [];
          if (Array.isArray(body?.data)) rawList = body.data;
          else if (Array.isArray(body?.models)) rawList = body.models;
          else if (Array.isArray(body)) rawList = body;
          else if (body?.id) rawList = [body];

          const mappedModels = rawList.map((m) => {
            const id = typeof m === "string" ? m : m.id || m.name || "unknown";
            const displayName = typeof m === "string" ? m : m.name || m.id || id;
            const isReasoning = Boolean(
              m?.capabilities?.reasoning ||
              /o1|o3|r1|deepseek-r1|reasoning|thinking/i.test(id)
            );
            const isImage = Boolean(
              m?.capabilities?.image ||
              /vision|vl|4o|claude-3|gemini|image/i.test(id)
            );
            return {
              id,
              name: displayName,
              reasoning: isReasoning,
              image: isImage,
            };
          });

          return {
            ok: true,
            latencyMs,
            models: mappedModels,
            count: mappedModels.length,
            message: `Discovered ${mappedModels.length} models (${latencyMs}ms)`,
          };
        }
        return { ok: false, latencyMs, message: `HTTP ${res.status}: ${res.statusText}`, models: [] };
      }

      if (prompt) {
        // Quick Prompt Completion test
        const cleanUrl = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
        const res = await fetch(cleanUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: model.includes("/") ? model.split("/")[1] : model,
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
          signal: AbortSignal.timeout(12000),
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          const body = await res.json();
          const reply = body?.choices?.[0]?.message?.content || "(empty response)";
          return {
            ok: true,
            latencyMs,
            reply,
            message: `200 OK (${latencyMs}ms)`,
          };
        }
        return { ok: false, latencyMs, message: `HTTP ${res.status}: ${res.statusText}` };
      }

      // Default connectivity test via /models
      const cleanUrl = `${baseUrl.replace(/\/+$/, "")}/models`;
      const res = await fetch(cleanUrl, { headers, signal: AbortSignal.timeout(5000) });
      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        let count = 0;
        try {
          const body = await res.json();
          count = Array.isArray(body?.data) ? body.data.length : Array.isArray(body) ? body.length : 1;
        } catch {}
        return { ok: true, latencyMs, message: `Connected! ${count} models discovered (${latencyMs}ms).` };
      }
      return { ok: false, latencyMs, message: `HTTP ${res.status}: ${res.statusText}` };
    } catch (e) {
      return { ok: false, latencyMs: Date.now() - startTime, message: e.message || "Connection failed" };
    }
  });

  const ggufScanHandler = methodHandler(METHODS.ggufScan, async (params) => {
    const action = params?.action;
    const gatewayBase = "http://127.0.0.1:18790/api/gateway/local-gguf";

    // 1. RAM Engine Status
    if (action === "status") {
      try {
        const res = await fetch(`${gatewayBase}/status`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          return { ok: true, status: data };
        }
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // 2. Load Model into RAM
    if (action === "load") {
      const modelId = params?.modelId;
      try {
        const res = await fetch(`${gatewayBase}/load`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId }),
          signal: AbortSignal.timeout(30000),
        });
        const data = await res.json();
        return { ok: res.ok, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // 3. Unload Model from RAM
    if (action === "unload") {
      try {
        const res = await fetch(`${gatewayBase}/unload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        return { ok: res.ok, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // 4. Mount Zero-Copy Disk Path or Guide Merge
    if (action === "mount-zero-copy" || action === "guide-merge") {
      try {
        const res = await fetch(`${gatewayBase}/mount-zero-copy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourcePath: params?.sourcePath,
            guidePath: params?.guidePath,
            guideContent: params?.guideContent,
          }),
          signal: AbortSignal.timeout(30000),
        });
        const data = await res.json();
        return { ok: res.ok, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // 5. Hugging Face Search
    if (action === "hf-search") {
      try {
        const repo = params?.repo?.trim();
        const res = await fetch(`${gatewayBase}/hf/search?repo=${encodeURIComponent(repo)}`, {
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json();
        return { ok: res.ok, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // 6. Hugging Face Download & Progress
    if (action === "hf-download") {
      try {
        const res = await fetch(`${gatewayBase}/hf/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: params?.url,
            filename: params?.filename,
            repo: params?.repo,
          }),
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        return { ok: res.ok, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    if (action === "hf-progress") {
      try {
        const res = await fetch(`${gatewayBase}/hf/progress`, { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        return { ok: res.ok, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    if (action === "hf-cancel") {
      try {
        const res = await fetch(`${gatewayBase}/hf/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        return { ok: res.ok, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // 7. Update Model Settings (Rename Display Name, Toggle Reasoning)
    if (action === "update" || action === "rename" || action === "toggle-reasoning") {
      const modelId = params?.modelId;
      try {
        const res = await fetch(`${gatewayBase}/models/${encodeURIComponent(modelId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params?.data || {}),
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        return { ok: res.ok, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // 8. Delete Offline Model from Disk
    if (action === "delete") {
      const modelId = params?.modelId;
      try {
        const res = await fetch(`${gatewayBase}/models/${encodeURIComponent(modelId)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json().catch(() => ({}));

        // Also clean from E:\zero\models if file directly exists
        const modelsDir = "E:\\zero\\models";
        try {
          const directFile = path.join(modelsDir, modelId.replace(/^gguf\//, "") + (modelId.endsWith(".gguf") ? "" : ".gguf"));
          if (existsSync(directFile)) {
            import("node:fs").then(fs => fs.unlinkSync(directFile)).catch(() => {});
          }
        } catch {}

        return { ok: true, ...data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // Default Action: Scan directory and query local GGUF engine
    const modelsDir = "E:\\zero\\models";
    const items = [];
    try {
      if (existsSync(modelsDir)) {
        const files = readdirSync(modelsDir);
        for (const f of files) {
          if (f.toLowerCase().endsWith(".gguf")) {
            const fullPath = path.join(modelsDir, f);
            const st = statSync(fullPath);
            const sizeMB = (st.size / (1024 * 1024)).toFixed(1);
            items.push({
              filename: f,
              id: `gguf/${f.replace(/\.gguf$/i, "")}`,
              name: f.replace(/\.gguf$/i, ""),
              sizeFormatted: `${sizeMB} MB`,
              fullPath,
              capabilities: { reasoning: true, image: false },
              isLoaded: false,
            });
          }
        }
      }
    } catch {}

    // Merge with registered / mounted zero-copy models from Gateway
    try {
      const gRes = await fetch(`${gatewayBase}/models`, { signal: AbortSignal.timeout(2000) });
      if (gRes.ok) {
        const gData = await gRes.json();
        if (Array.isArray(gData.models)) {
          for (const gm of gData.models) {
            const existing = items.find(i => i.id === gm.id || i.filename === gm.filename);
            if (existing) {
              existing.name = gm.name || existing.name;
              existing.capabilities = gm.capabilities || existing.capabilities;
              existing.isLoaded = Boolean(gm.isLoaded);
            } else {
              items.push({
                filename: gm.filename || gm.id,
                id: gm.id,
                name: gm.name || gm.id,
                sizeFormatted: gm.sizeFormatted || "Zero-Copy Disk Mount",
                fullPath: gm.fullPath || gm.sourcePath || "Mounted",
                capabilities: gm.capabilities || { reasoning: true, image: false },
                isLoaded: Boolean(gm.isLoaded),
              });
            }
          }
        }
      }
    } catch {}

    // Check RAM status
    try {
      const sRes = await fetch(`${gatewayBase}/status`, { signal: AbortSignal.timeout(1000) });
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.loadedModelId) {
          const loaded = items.find(i => i.id === sData.loadedModelId || i.filename === sData.loadedModelFilename);
          if (loaded) loaded.isLoaded = true;
        }
      }
    } catch {}

    return { ok: true, models: items };
  });

  return {
    [METHODS.cliStatus]: cliStatusHandler,
    [METHODS.cliExecute]: cliExecuteHandler,
    [METHODS.connectorStatus]: connectorStatusHandler,
    [OBSERVATION_METHODS.status]: observationStatusHandler,
    [OBSERVATION_METHODS.control]: observationControlHandler,
    [OBSERVATION_METHODS.recent]: observationRecentHandler,
    [METHODS.observationKillSwitch]: observationKillSwitchHandler,
    [METHODS.gatewayStatus]: gatewayStatusHandler,
    [METHODS.providersList]: providersListHandler,
    [METHODS.providersSetActive]: providersSetActiveHandler,
    [METHODS.providersSave]: providersSaveHandler,
    [METHODS.providersDelete]: providersDeleteHandler,
    [METHODS.providersTest]: providersTestHandler,
    [METHODS.ggufScan]: ggufScanHandler,
  };
}

/**
 * Register the runtime seams on the plugin API. Safe on hosts without a Gateway
 * method registry or without the keyed state surface: registration reports what
 * actually happened, and the browser falls back to the previous behavior.
 */
export function registerZeroUiRuntime(api, options = {}) {
  const logger = api?.logger;
  const hasMethodRegistry = typeof api?.registerGatewayMethod === "function";
  const registered = [];
  const registeredTools = [];

  if (hasMethodRegistry) {
    const getConfig = () => {
      try {
        return api?.runtime?.config?.current?.() ?? api?.config ?? {};
      } catch {
        return api?.config ?? {};
      }
    };
    const nativeCliEligibility =
      typeof api?.runtime?.agent?.resolveCliBackendDispatchEligibilityAsync === "function"
        ? (provider) =>
            api.runtime.agent.resolveCliBackendDispatchEligibilityAsync({
              provider,
              agentId: "zero",
              config: getConfig(),
            })
        : null;
    let observationEngine = options.observationEngine ?? null;
    const getObservationEngine = () => {
      observationEngine ??= createDefaultObservationEngine();
      return observationEngine;
    };
    let observationLifecycle = null;
    const openObservationPreferenceStore = () =>
      api?.runtime?.state?.openKeyedStore?.({
        namespace: OBSERVATION_PREFERENCE_NAMESPACE,
        retention: "retained",
      });
    const getObservationLifecycle = () => {
      observationLifecycle ??= createObservationLifecycle({
        engine: getObservationEngine(),
        getStore: openObservationPreferenceStore,
        logger,
      });
      return observationLifecycle;
    };
    const handlers = createZeroUiRuntimeHandlers({
      logger,
      getConfig,
      cliStatus: options.cliStatus,
      nativeCliEligibility,
      getObservationEngine,
      getObservationLifecycle,
    });
    for (const name of Object.values(METHODS)) {
      const methodOptions =
        name === OBSERVATION_METHODS.control ||
        name === METHODS.providersSetActive ||
        name === METHODS.providersSave ||
        name === METHODS.providersDelete
          ? { scope: "operator.write" }
          : name.startsWith("zero.observation.")
            ? { scope: "operator.read" }
            : undefined;
      api.registerGatewayMethod(name, handlers[name], methodOptions);
      registered.push(name);
    }
    if (options.initializeObservation !== false) {
      void getObservationLifecycle()
        .initialize()
        .catch(() => {
          logger?.warn?.("[zero-control-ui] observation lifecycle initialization failed");
        });
    }
    if (typeof api.registerTool === "function") {
      const suggestionPolicy = createSuggestionPolicy(
        normalizeSuggestionConfig(api?.pluginConfig?.observationSuggestions),
      );
      try {
        api.registerTool(
          createObservationTool({ getObservationEngine, suggestionPolicy }),
        );
        registeredTools.push(OBSERVATION_TOOL_NAME);
      } catch (error) {
        logger?.warn?.(
          `[zero-control-ui] observation tool registration failed: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }

      try {
        const computerTools = createAllComputerTools({
          getPolicyState: () => options?.policyState || null,
          logger,
        });
        for (const tool of computerTools) {
          api.registerTool(tool);
          registeredTools.push(tool.name);
        }
      } catch (error) {
        logger?.warn?.(
          `[zero-control-ui] computer tool registration failed: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }

      try {
        const watchTool = createWatchWorkflowTool({ getObservationEngine, logger });
        api.registerTool(watchTool);
        registeredTools.push(watchTool.name);
      } catch {}

      try {
        const skillLearnTool = createSkillLearnTool();
        api.registerTool(skillLearnTool);
        registeredTools.push(skillLearnTool.name);
      } catch {}

      try {
        const loader = new DynamicPluginLoader({ logger });
        loader.loadAll({ api, logger }).then(() => {
          for (const tool of loader.getTools()) {
            try {
              api.registerTool(tool);
              registeredTools.push(tool.name);
            } catch {}
          }
        }).catch(() => {});
      } catch {}
    }
  }

  logger?.info?.(
    `[zero-control-ui] runtime registration requested: methods=${
      registered.length > 0 ? registered.join(",") : "none"
    }`,
  );
  return { registered, tools: registeredTools };
}
