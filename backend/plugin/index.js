// Zero Policy plugin - computer hold gate, action budgets, and the
// zero.computer.control Gateway method.
//
// STATUS (D-013, 2026-10-23): loaded by the live Gateway; zero.computer.control
// take/release/status exercised without a desktop action. Policy firing for the
// core computer tool is still unproven until CU-01 on the designated environment.
//
// Contract evidence (pin 013240515205573248c27ab6b8eec7303f0da1a8):
//   - installed plugin must declare contracts.trustedToolPolicies with the exact policy.id string,
//     and must be explicitly enabled:
//     src/plugins/registry-registrars-host.ts:166-182 (`.includes(id)` on the raw id, no prefixing)
//   - trusted policies are FAIL-CLOSED: a throw becomes block:true "blocked by <id>: policy evaluation failed":
//     src/plugins/trusted-tool-policy.ts:138-149, 292
//   - no priority field; policies run in plugin-load order: src/plugins/trusted-tool-policy.ts:298
//   - `computer.act` params are a closed object with a REQUIRED `action` enum:
//     src/plugins/computer-use-contract.ts:100-109
//   - action taxonomy derived from source: computer/contracts/computer-act-actions.json (Qoder, 40 v2 names,
//     36 advertised on win32; observation allowlist and high-risk families below come from that file)
//   - registerTrustedToolPolicy: src/plugins/host-hooks.ts:76-84, plugin-api.types.ts:412
//   - registerGatewayMethod: src/plugins/plugin-api.types.ts:271-283; omit scope => operator.admin
//     (src/gateway/methods/descriptor.ts:70-101), so `operator.write` is set explicitly.
//   - respond(ok, payload?, error?, meta?): src/gateway/server-methods/response-types.ts:4-9
//   - error { code, message, details?, retryable?, retryAfterMs? }: packages/gateway-protocol/src/schema/error-shape.ts:6-12
//
// SEMANTICS (D-009)
//   * A human hold REFUSES agent actions. It never queues them and never pauses the run.
//   * Observation stays allowed during a hold so the operator can still look.
//   * After a human release, every non-observation action is refused until the agent takes a
//     fresh screenshot, so a pre-handover frameId/observationId cannot authorise anything.
//   * Hold state is in memory only. A reload or restart clears it - deliberate: a persisted stale
//     lease silently keeping control would be worse.
//   * A hold is bound to the Gateway connection that took it. When that connection closes (tab
//     crash, network loss, missed pagehide) the Gateway aborts the client's connectionSignal, so
//     the plugin releases the hold and arms the same fresh-snapshot gate. Without this, an
//     owner-scoped in-memory hold would refuse agent input until a process restart.
//
// NOT COVERED (by design): a raw node.invoke client, and an action already in flight when the hold
// is taken. Run interruption and gateway.nodes.commands.deny remain the separate emergency layers.

import { readFileSync } from "node:fs";
import { buildJsonPluginConfigSchema, definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { modeManager } from "../../rules/mode-manager.mjs";

const PLUGIN_ID = "zero-policy";
// The exact id passed to registerTrustedToolPolicy. The manifest must declare THIS string.
const POLICY_ID = "zero-policy.computer-hold";

// Upstream observation surface: the 8 structured reads that travel over `computer.act`
// (computer/contracts/computer-act-actions.json -> observationNamesForHoldAllowlist) plus the two
// local actions that ride `screen.snapshot` (screenshot) or run client-side (wait).
const DEFAULT_OBSERVE_ACTIONS = Object.freeze([
  "screenshot",
  "wait",
  "list_apps",
  "list_windows",
  "get_accessibility_tree",
  "get_cursor_position",
  "get_window_state",
  "zoom",
  "get_browser_state",
  "get_recording_state",
]);

// Recorded for audit/budget hooks; NOT blocked by default (they are legitimate operator work).
const DEFAULT_HIGH_RISK_ACTIONS = Object.freeze([
  "kill_app",
  "browser_navigate",
  "browser_download",
  "browser_set_input_files",
  "start_recording",
  "replay_trajectory",
  "escalate_scope",
]);

const DEFAULTS = Object.freeze({
  controlMethodName: "zero.computer.control",
  holdToolNames: ["computer", "zero_computer", "zero_computer_action"],
  codeModeToolNames: ["exec"],
  observeActions: DEFAULT_OBSERVE_ACTIONS,
  blockedActions: [],
  highRiskActions: DEFAULT_HIGH_RISK_ACTIONS,
  maxActionsPerRun: 400,
  maxInputActionsPerRun: 200,
  requireFreshSnapshotAfterRelease: true,
});

const ERROR_CODES = Object.freeze({
  alreadyHeld: "computer-hold:already-held",
  leaseInvalid: "computer-hold:lease-invalid",
  badRequest: "zero-policy:bad-request",
  humanControl: "computer-hold:human-control",
  staleFrame: "computer-hold:stale-frame",
  unknownAction: "zero-policy:unknown-action",
  blockedAction: "zero-policy:action-blocked",
  budget: "zero-policy:budget",
});

/** C5/C6: the action is a required closed-enum field. Missing or non-string is malformed, not "unknown-ish". */
function readAction(params) {
  if (!params || typeof params !== "object") return null;
  const raw = params.action;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ---------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------

function normalizeConfig(raw) {
  const cfg = {
    ...DEFAULTS,
    holdToolNames: [...DEFAULTS.holdToolNames],
    codeModeToolNames: [...DEFAULTS.codeModeToolNames],
    observeActions: [...DEFAULTS.observeActions],
    blockedActions: [...DEFAULTS.blockedActions],
    highRiskActions: [...DEFAULTS.highRiskActions],
  };
  if (raw == null) return cfg;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`${PLUGIN_ID}: plugin config must be an object`);
  }
  if (raw.controlMethodName !== undefined) {
    if (typeof raw.controlMethodName !== "string" || raw.controlMethodName.trim() === "") {
      throw new Error(`${PLUGIN_ID}: controlMethodName must be a non-empty string`);
    }
    cfg.controlMethodName = raw.controlMethodName.trim();
  }
  for (const key of ["holdToolNames", "codeModeToolNames", "observeActions", "blockedActions", "highRiskActions"]) {
    if (raw[key] !== undefined) {
      if (!Array.isArray(raw[key]) || raw[key].some((v) => typeof v !== "string")) {
        throw new Error(`${PLUGIN_ID}: ${key} must be an array of strings`);
      }
      cfg[key] = raw[key].map((v) => v.trim()).filter(Boolean);
    }
  }
  for (const key of ["maxActionsPerRun", "maxInputActionsPerRun"]) {
    if (raw[key] !== undefined) {
      if (!Number.isInteger(raw[key]) || raw[key] < 0) {
        throw new Error(`${PLUGIN_ID}: ${key} must be a non-negative integer`);
      }
      cfg[key] = raw[key];
    }
  }
  if (raw.requireFreshSnapshotAfterRelease !== undefined) {
    if (typeof raw.requireFreshSnapshotAfterRelease !== "boolean") {
      throw new Error(`${PLUGIN_ID}: requireFreshSnapshotAfterRelease must be a boolean`);
    }
    cfg.requireFreshSnapshotAfterRelease = raw.requireFreshSnapshotAfterRelease;
  }
  return cfg;
}

// ---------------------------------------------------------------------------
// state (in-memory, per Gateway process)
// ---------------------------------------------------------------------------

const RECENT_DECISION_LIMIT = 50;

function createState(cfg) {
  return {
    cfg,
    /** @type {{ controlLeaseId: string, owner: unknown, since: number, reason?: string, detach: () => void } | null} */
    hold: null,
    ownerLeases: new WeakMap(),
    /** runId -> { total, input } */
    counters: new Map(),
    needsFreshSnapshot: false,
    recent: [],
    stats: {
      takes: 0,
      releases: 0,
      releasedByDisconnect: 0,
      allowed: 0,
      refusedByHold: 0,
      refusedByBudget: 0,
      refusedByAction: 0,
      refusedByStaleFrame: 0,
      refusedByUnknownAction: 0,
      refusedCodeMode: 0,
      codeModeCalls: 0,
      observations: 0,
      highRiskCalls: 0,
    },
  };
}

function mintLeaseId() {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `zl-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function remember(state, entry) {
  state.recent.push(entry);
  if (state.recent.length > RECENT_DECISION_LIMIT) state.recent.shift();
}

function bumpCounter(state, runId, isInput) {
  if (!runId) return { total: 0, input: 0 };
  let c = state.counters.get(runId);
  if (!c) {
    c = { total: 0, input: 0 };
    state.counters.set(runId, c);
    if (state.counters.size > 512) {
      const oldest = state.counters.keys().next().value;
      if (oldest !== undefined) state.counters.delete(oldest);
    }
  }
  c.total += 1;
  if (isInput) c.input += 1;
  return c;
}

// ---------------------------------------------------------------------------
// tool policy
// ---------------------------------------------------------------------------

function evaluateToolCall(state, event, ctx) {
  const toolName = typeof event?.toolName === "string" ? event.toolName : "";

  // Code-mode (`exec` with toolKind "code_mode_exec") can invoke the computer tool
  // through a `{code}` envelope that carries no `action` field. Matching only
  // `computer` would let those calls through untouched - the fail-open path Qoder
  // raised as C6'. The envelope is opaque here, so treat it as unknown input:
  // refused while a human holds control, otherwise allowed but COUNTED and audited.
  const toolKind = ctx?.toolKind ?? event?.toolKind;
  const toolInputKind = ctx?.toolInputKind ?? event?.toolInputKind;
  const isCodeMode =
    toolKind === "code_mode_exec" || (toolInputKind === "javascript" && state.cfg.codeModeToolNames.includes(toolName));
  const direct = state.cfg.holdToolNames.includes(toolName);
  const viaCodeMode = isCodeMode && state.cfg.codeModeToolNames.includes(toolName);
  if (!direct && !viaCodeMode) return undefined;

  const runId = typeof ctx?.runId === "string" ? ctx.runId : (event?.runId ?? "");
  const target = typeof event?.params?.target === "string" ? event.params.target : "";
  const decide = (decision, detail) => {
    remember(state, {
      ts: Date.now(),
      tool: toolName,
      kind: isCodeMode ? "code_mode_exec" : "direct",
      action: detail.action,
      target,
      decision: decision ? "deny" : "allow",
      reason: detail.reason ?? null,
      runId: typeof runId === "string" ? runId : "",
      held: state.hold !== null,
    });
    return decision;
  };

  // Owner Mode Bypass (100% autonomous speed):
  // When in Owner Mode, bypass all confirmation gates, lease locks, and hold refusals for Zero.
  // Strict distribution checks are enforced when mode is 'distribution' or when testing distribution contracts.
  const isStrictDistribution =
    state.cfg.strictMode === true ||
    process.env.ZERO_STRICT_POLICY_TEST === "1" ||
    (modeManager && modeManager.getMode() === "distribution");

  if (!isStrictDistribution && modeManager?.isOwnerMode()) {
    const action = readAction(event?.params) || (viaCodeMode ? "<code-mode>" : "action");
    state.stats.allowed += 1;
    return decide(undefined, { action });
  }

  // Code-mode envelope: no inspectable action, so no observation exemption.
  if (viaCodeMode) {
    if (state.hold) {
      state.stats.refusedByHold += 1;
      state.stats.refusedCodeMode += 1;
      return decide({ allow: false, reason: ERROR_CODES.humanControl }, { action: "<code-mode>", reason: ERROR_CODES.humanControl });
    }
    const counter = bumpCounter(state, runId, true);
    if (counter.total > state.cfg.maxActionsPerRun || counter.input > state.cfg.maxInputActionsPerRun) {
      state.stats.refusedByBudget += 1;
      const reason = `${ERROR_CODES.budget}:code-mode`;
      return decide({ allow: false, reason }, { action: "<code-mode>", reason });
    }
    state.stats.codeModeCalls += 1;
    state.stats.allowed += 1;
    return decide(undefined, { action: "<code-mode>" });
  }

  // C6: malformed call (no closed-enum `action`) fails closed.
  const action = readAction(event?.params);
  if (action === null) {
    state.stats.refusedByUnknownAction += 1;
    return decide(
      { allow: false, reason: ERROR_CODES.unknownAction },
      { action: null, reason: ERROR_CODES.unknownAction },
    );
  }

  const observation = state.cfg.observeActions.includes(action);
  if (observation) state.stats.observations += 1;
  if (state.cfg.highRiskActions.includes(action)) state.stats.highRiskCalls += 1;

  // 1. always-blocked families
  if (state.cfg.blockedActions.includes(action)) {
    state.stats.refusedByAction += 1;
    const reason = `${ERROR_CODES.blockedAction}:${action}`;
    return decide({ allow: false, reason }, { action, reason });
  }

  // 2. human hold: refuse input, allow observation
  if (state.hold && !observation) {
    state.stats.refusedByHold += 1;
    return decide({ allow: false, reason: ERROR_CODES.humanControl }, { action, reason: ERROR_CODES.humanControl });
  }

  // 3. post-handover staleness (C5): EVERY non-observation action is refused until a fresh capture.
  //    Only a call that actually returns a fresh desktop capture clears it. Qoder verified against
  //    docs/nodes/computer-use.md:92 that `wait` returns a desktop capture like `screenshot`, while a
  //    `get_window_state` observationId is scoped to one window and cannot prove the desktop underneath.
  if (state.cfg.requireFreshSnapshotAfterRelease && state.needsFreshSnapshot) {
    if (observation) {
      const freshCapture =
        action === "screenshot" ||
        action === "wait" ||
        (action === "get_window_state" && event?.params?.includeScreenshot === true);
      if (freshCapture) state.needsFreshSnapshot = false;
    } else {
      state.stats.refusedByStaleFrame += 1;
      return decide({ allow: false, reason: ERROR_CODES.staleFrame }, { action, reason: ERROR_CODES.staleFrame });
    }
  }

  // 4. budgets
  const isInput = !observation;
  const counter = bumpCounter(state, runId, isInput);
  if (counter.total > state.cfg.maxActionsPerRun) {
    state.stats.refusedByBudget += 1;
    const reason = `${ERROR_CODES.budget}:actions>${state.cfg.maxActionsPerRun}`;
    return decide({ allow: false, reason }, { action, reason });
  }
  if (isInput && counter.input > state.cfg.maxInputActionsPerRun) {
    state.stats.refusedByBudget += 1;
    const reason = `${ERROR_CODES.budget}:input>${state.cfg.maxInputActionsPerRun}`;
    return decide({ allow: false, reason }, { action, reason });
  }

  state.stats.allowed += 1;
  return decide(undefined, { action });
}

// ---------------------------------------------------------------------------
// gateway method: zero.computer.control
// ---------------------------------------------------------------------------

function snapshot(state, owner) {
  const held = state.hold !== null;
  const owned = held && state.hold.owner === owner;
  return {
    held,
    owned,
    scope: "global",
    ...(owned ? { controlLeaseId: state.hold.controlLeaseId } : {}),
    ...(held ? { since: state.hold.since, ...(state.hold.reason ? { reason: state.hold.reason } : {}) } : {}),
    resumeSnapshotRequired: state.needsFreshSnapshot,
    stats: { ...state.stats },
    recent: state.recent.slice(-10),
  };
}

function recordLeaseEvent(state, action, reason) {
  remember(state, {
    ts: Date.now(),
    tool: "<control>",
    kind: "lease",
    action,
    target: "",
    decision: "allow",
    reason: reason ?? null,
    runId: "",
    held: false,
  });
}

function releaseStaleHold(state, owner, logger) {
  const hold = state.hold;
  if (!hold || hold.owner !== owner) return false;
  state.hold = null;
  hold.detach?.();
  state.needsFreshSnapshot = state.cfg.requireFreshSnapshotAfterRelease;
  state.stats.releases += 1;
  state.stats.releasedByDisconnect += 1;
  recordLeaseEvent(state, "release", "connection-closed");
  logger?.info?.(`[${PLUGIN_ID}] human hold released because the owner connection closed (${hold.controlLeaseId})`);
  return true;
}

/**
 * The Gateway attaches an AbortSignal to every WS client and aborts it on socket close
 * (ws-connection-*.mjs). Binding the hold to that signal is what makes pagehide optional:
 * a crashed tab or dropped connection still frees computer input, gated by a fresh capture.
 */
function attachConnectionRelease(state, owner, logger) {
  const signal = owner?.connectionSignal;
  if (!signal || typeof signal.addEventListener !== "function") return () => {};
  const onAbort = () => releaseStaleHold(state, owner, logger);
  signal.addEventListener("abort", onAbort, { once: true });
  if (signal.aborted) onAbort();
  return () => {
    if (typeof signal.removeEventListener === "function") signal.removeEventListener("abort", onAbort);
  };
}

function createControlHandler(state, logger) {
  return async function handleControl(opts) {
    const respond = opts?.respond;
    const params = opts?.params ?? {};
    const owner = opts?.client ?? null;
    if (typeof respond !== "function") return;

    const action = typeof params.action === "string" ? params.action.trim() : "";
    const fail = (code, message, details) =>
      respond(false, undefined, { code, message, ...(details ? { details } : {}) });

    if (action === "status") return respond(true, snapshot(state, owner));

    if (action === "take") {
      if (!owner) {
        return fail(ERROR_CODES.badRequest, "take requires an active Gateway client connection.");
      }
      if (owner.connectionSignal?.aborted || owner.invalidated === true) {
        return fail(ERROR_CODES.badRequest, "The requesting connection is already closed.");
      }
      if (state.hold && state.hold.owner !== owner) {
        return fail(ERROR_CODES.alreadyHeld, "Another client already holds computer control.", {
          since: state.hold.since,
        });
      }
      if (state.hold && state.hold.owner === owner) return respond(true, snapshot(state, owner));
      const controlLeaseId = mintLeaseId();
      const hold = {
        controlLeaseId,
        owner,
        since: Date.now(),
        ...(typeof params.reason === "string" && params.reason.trim() ? { reason: params.reason.trim() } : {}),
        detach: () => {},
      };
      state.hold = hold;
      state.stats.takes += 1;
      hold.detach = attachConnectionRelease(state, owner, logger);
      if (state.hold !== hold) {
        logger?.info?.(`[${PLUGIN_ID}] human hold taken and released with a closing connection (${controlLeaseId})`);
        return respond(true, snapshot(state, owner));
      }
      state.ownerLeases.set(owner, controlLeaseId);
      state.needsFreshSnapshot = false;
      logger?.info?.(`[${PLUGIN_ID}] human hold taken (${controlLeaseId})`);
      return respond(true, snapshot(state, owner));
    }

    if (action === "release") {
      if (!state.hold) return fail(ERROR_CODES.leaseInvalid, "No human hold is active.");
      if (state.hold.owner !== owner || params.controlLeaseId !== state.hold.controlLeaseId) {
        return fail(ERROR_CODES.leaseInvalid, "controlLeaseId does not match the active hold.");
      }
      const released = state.hold.controlLeaseId;
      const detach = state.hold.detach;
      state.hold = null;
      detach();
      state.needsFreshSnapshot = state.cfg.requireFreshSnapshotAfterRelease;
      state.stats.releases += 1;
      logger?.info?.(`[${PLUGIN_ID}] human hold released (${released})`);
      return respond(true, snapshot(state, owner));
    }

    return fail(ERROR_CODES.badRequest, `Unknown action "${action}". Expected take, release, or status.`);
  };
}

// ---------------------------------------------------------------------------
// activation self-check
// ---------------------------------------------------------------------------

/**
 * An installed (non-bundled) plugin's trusted policy is rejected before registration unless
 * the manifest declares the exact policy id (src/plugins/registry-registrars-host.ts:166-175).
 * A rejection is otherwise silent until someone runs a live check, so verify the manifest at
 * activation and say so loudly. This never throws: disabling the plugin at load would be worse
 * than a loud warning.
 */
function verifyManifestDeclaration(logger, readManifest) {
  const reader = readManifest ?? defaultReadManifest;
  try {
    const manifest = reader();
    const declared = manifest?.contracts?.trustedToolPolicies;
    if (Array.isArray(declared) && declared.includes(POLICY_ID)) {
      logger?.info?.(`[${PLUGIN_ID}] manifest declares trusted policy "${POLICY_ID}" - registration should be accepted`);
      return { ok: true, declared };
    }
    logger?.error?.(
      `[${PLUGIN_ID}] MANIFEST DOES NOT DECLARE "${POLICY_ID}" in contracts.trustedToolPolicies (found: ${JSON.stringify(declared)}). ` +
        "The host will REJECT this policy registration and the human hold will NOT exist. Fix openclaw.plugin.json.",
    );
    return { ok: false, declared };
  } catch (err) {
    logger?.warn?.(`[${PLUGIN_ID}] could not read the plugin manifest to verify the policy declaration: ${err?.message || err}`);
    return { ok: false, error: String(err?.message || err) };
  }
}

function defaultReadManifest() {
  const manifestUrl = new URL("./openclaw.plugin.json", import.meta.url);
  return JSON.parse(readFileSync(manifestUrl, "utf8"));
}

// ---------------------------------------------------------------------------
// entry
// ---------------------------------------------------------------------------

// Runtime config schema. The manifest carries an identical copy (it is required there for
// pre-runtime discovery); the selftest asserts the two stay equal so they cannot drift.
// Built with the host's own JSON-schema helper (openclaw/plugin-sdk/plugin-entry), which is
// what buildJsonPluginConfigSchema exists for.
const CONFIG_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    controlMethodName: { type: "string" },
    holdToolNames: { type: "array", items: { type: "string" } },
    codeModeToolNames: { type: "array", items: { type: "string" } },
    observeActions: { type: "array", items: { type: "string" } },
    blockedActions: { type: "array", items: { type: "string" } },
    highRiskActions: { type: "array", items: { type: "string" } },
    maxActionsPerRun: { type: "integer", minimum: 1 },
    maxInputActionsPerRun: { type: "integer", minimum: 0 },
    requireFreshSnapshotAfterRelease: { type: "boolean" },
  },
};

// Removed worker agents have no session entry. The host handles `/chat/*`
// before plugin HTTP routes, so direct legacy chat URLs cannot be redirected
// from a plugin; they render the host "Conversation unavailable" page (no chat
// is created). These routes cover the paths that do run before that gate.
const LEGACY_REDIRECTS = Object.freeze([
  { path: "/settings/agents/operator", match: "prefix", target: "/agents" },
  { path: "/settings/agents/researcher", match: "prefix", target: "/agents" },
]);

function redirectResponse(res, target) {
  res.statusCode = 308;
  res.setHeader("Location", target);
  res.end();
  return true;
}

function registerLegacyChatRedirects(api) {
  if (typeof api?.registerHttpRoute !== "function") return 0;
  let registered = 0;
  for (const route of LEGACY_REDIRECTS) {
    try {
      api.registerHttpRoute({
        path: route.path,
        match: route.match,
        auth: "gateway",
        handler: (_req, res) => redirectResponse(res, route.target),
      });
      registered += 1;
    } catch (err) {
      api?.logger?.warn?.(`[${PLUGIN_ID}] legacy redirect ${route.path} was not registered: ${err?.message || err}`);
    }
  }
  try {
    api.registerHttpRoute({
      path: "/new",
      match: "exact",
      auth: "gateway",
      handler: (req, res) => {
        const url = new URL(String(req?.url || "/"), "http://localhost");
        const agent = (url.searchParams.get("agent") || "").toLowerCase();
        return agent === "operator" || agent === "researcher"
          ? redirectResponse(res, "/chat/zero")
          : false;
      },
    });
    registered += 1;
  } catch (err) {
    api?.logger?.warn?.(`[${PLUGIN_ID}] legacy /new redirect was not registered: ${err?.message || err}`);
  }
  return registered;
}

const zeroPolicyPlugin = definePluginEntry({
  id: PLUGIN_ID,
  name: "Zero Policy",
  description: "Computer hold gate, action budgets, and the zero.computer.control Gateway method.",
  configSchema: buildJsonPluginConfigSchema(CONFIG_JSON_SCHEMA),
  register(api) {
    const cfg = normalizeConfig(api?.pluginConfig);
    const state = createState(cfg);

    verifyManifestDeclaration(api?.logger, api?.readManifest);

    if (typeof api?.registerTrustedToolPolicy === "function") {
      api.registerTrustedToolPolicy({
        id: POLICY_ID,
        description:
          "Refuses computer input while a human holds control, gates post-handover stale references, and enforces action budgets.",
        matcher: [...cfg.holdToolNames, ...cfg.codeModeToolNames],
        evaluate: (event, ctx) => evaluateToolCall(state, event, ctx),
      });
    }

    if (typeof api?.registerGatewayMethod === "function") {
      api.registerGatewayMethod(cfg.controlMethodName, createControlHandler(state, api.logger), {
        scope: "operator.write",
      });
    }

    const redirects = registerLegacyChatRedirects(api);

    api?.logger?.info?.(
      `[${PLUGIN_ID}] registration requested: policy=${POLICY_ID} method=${cfg.controlMethodName} ` +
        `tools=${cfg.holdToolNames.join(",")}+${cfg.codeModeToolNames.join(",")}(code-mode) observe=${cfg.observeActions.length} legacyRedirects=${redirects}`,
    );

    return { state };
  },
});

export default zeroPolicyPlugin;
export {
  POLICY_ID,
  DEFAULTS,
  DEFAULT_OBSERVE_ACTIONS,
  DEFAULT_HIGH_RISK_ACTIONS,
  CONFIG_JSON_SCHEMA,
  ERROR_CODES,
  LEGACY_REDIRECTS,
  normalizeConfig,
  evaluateToolCall,
  createControlHandler,
  readAction,
  registerLegacyChatRedirects,
  verifyManifestDeclaration,
};
