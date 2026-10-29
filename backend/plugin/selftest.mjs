// Self-test for the Zero Policy plugin. Runs the plugin's logic against a fake
// host AND asserts the static manifest contracts, so REVIEW-02 findings C1-C7
// stay fixed without needing OpenClaw installed.
//
// Proves: decision logic, lease state machine, error codes, and manifest/package
// contract declarations.
// Does NOT prove: that OpenClaw's loader calls register() as expected, that a
// trusted policy fires for the core `computer` tool, or that a Gateway RPC
// reaches the handler. Those need the install window.
//
// Run: node backend/plugin/selftest.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import zeroPolicyPlugin, {
  POLICY_ID,
  DEFAULTS,
  DEFAULT_OBSERVE_ACTIONS,
  DEFAULT_HIGH_RISK_ACTIONS,
  CONFIG_JSON_SCHEMA,
} from "./index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(readFileSync(join(HERE, "openclaw.plugin.json"), "utf8"));
const PKG = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8"));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` -> ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

function createHost(pluginConfig = {}) {
  const registrations = { policies: [], methods: new Map() };
  zeroPolicyPlugin.register({
    pluginConfig,
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    registerTrustedToolPolicy(policy) {
      registrations.policies.push(policy);
    },
    registerGatewayMethod(name, handler, opts) {
      registrations.methods.set(name, { handler, opts });
    },
  });
  return registrations;
}

function call(registrations, methodName, params, client) {
  const entry = registrations.methods.get(methodName);
  if (!entry) throw new Error(`method ${methodName} was not registered`);
  let result = null;
  entry.handler({ params, respond: (ok, payload, error) => { result = { ok, payload, error }; }, client });
  return result;
}

function evaluate(registrations, toolName, action, ctx = {}, extraParams = {}) {
  const policy = registrations.policies[0];
  if (!policy) throw new Error("no trusted tool policy registered");
  const params = action === undefined ? { ...extraParams } : { action, ...extraParams };
  return policy.evaluate({ toolName, params }, { runId: "run-1", sessionKey: "zero-thread-test", agentId: "operator", ...ctx });
}

function makeClient(id) {
  const controller = new AbortController();
  return { id, connectionSignal: controller.signal, abort: () => controller.abort() };
}

const METHOD = "zero.computer.control";
const deny = (r) => r && r.allow === false;

// --- C1: manifest + package contracts --------------------------------------

console.log("\nC1 manifest/package contracts");
{
  check("manifest id matches plugin id", MANIFEST.id === zeroPolicyPlugin.id, MANIFEST.id);
  const declared = MANIFEST?.contracts?.trustedToolPolicies ?? [];
  check(
    "contracts.trustedToolPolicies declares the EXACT policy id",
    declared.includes(POLICY_ID),
    `declared=${JSON.stringify(declared)} policyId=${POLICY_ID}`,
  );
  check("policy id is the string the registrar compares (no prefix logic)", POLICY_ID === "zero-policy.computer-hold");

  const host = createHost();
  check("registered policy id equals the declared id", host.policies[0]?.id === POLICY_ID, host.policies[0]?.id);

  const pluginApi = PKG?.openclaw?.compat?.pluginApi;
  check("package declares openclaw.compat.pluginApi floor", typeof pluginApi === "string" && pluginApi.startsWith(">="), String(pluginApi));
  check("pluginApi floor targets the pinned host", pluginApi === ">=2026.10.6", String(pluginApi));

  const schemaProps = Object.keys(MANIFEST?.configSchema?.properties ?? {});
  const codeKeys = Object.keys(DEFAULTS);
  const missingInSchema = codeKeys.filter((k) => !schemaProps.includes(k));
  check(
    "every config key in code is declared in the manifest schema",
    missingInSchema.length === 0,
    missingInSchema.join(", "),
  );
  check(
    "manifest schema is closed (additionalProperties:false)",
    MANIFEST?.configSchema?.additionalProperties === false,
  );

  // Found by the release-source reconciliation (installed 2026.10.6 == fe06181): the entry
  // helper supplies a runtime configSchema, and a plain object export would have omitted it.
  check(
    "entry exposes a configSchema (definePluginEntry, not a bare object)",
    Boolean(zeroPolicyPlugin.configSchema) && typeof zeroPolicyPlugin.configSchema?.safeParse === "function",
    typeof zeroPolicyPlugin.configSchema,
  );
  check(
    "runtime JSON schema covers the same keys as the manifest",
    JSON.stringify(Object.keys(CONFIG_JSON_SCHEMA.properties).sort()) === JSON.stringify([...schemaProps].sort()),
    `runtime=${Object.keys(CONFIG_JSON_SCHEMA.properties).length} manifest=${schemaProps.length}`,
  );
  check(
    "runtime schema agrees with the manifest on additionalProperties",
    CONFIG_JSON_SCHEMA.additionalProperties === MANIFEST?.configSchema?.additionalProperties,
  );

  // The host rejects unknown config keys when the schema is strict; make sure our own
  // deployed config passes the runtime schema, not just the manifest copy.
  const deployed = zeroPolicyPlugin.configSchema?.safeParse;
  if (typeof deployed === "function") {
    const fromTemplate = (() => {
      try {
        const t = JSON.parse(readFileSync(join(HERE, "..", "config", "openclaw.template.json"), "utf8"));
        return t?.plugins?.entries?.["zero-policy"]?.config;
      } catch {
        return undefined;
      }
    })();
    if (fromTemplate) {
      const res = deployed(fromTemplate);
      check("the deployed template config passes the runtime schema", res?.ok !== false && !res?.error, JSON.stringify(res?.error ?? res));
    }
  }
}

// --- C2: lease field name --------------------------------------------------

console.log("\nC2 accepted contract field name `controlLeaseId`");
{
  const r = createHost();
  const clientA = { id: "A" };
  const take = call(r, METHOD, { action: "take" }, clientA);
  check("take returns controlLeaseId", typeof take.payload?.controlLeaseId === "string", JSON.stringify(Object.keys(take.payload ?? {})));
  check("take does NOT return the old leaseId field", take.payload?.leaseId === undefined);

  const wrongField = call(r, METHOD, { action: "release", leaseId: take.payload.controlLeaseId }, clientA);
  check("release with the OLD field name is refused", wrongField.ok === false && wrongField.error.code === "computer-hold:lease-invalid");

  const ok = call(r, METHOD, { action: "release", controlLeaseId: take.payload.controlLeaseId }, clientA);
  check("release with controlLeaseId succeeds", ok.ok === true && ok.payload.held === false);
}

// --- lease state machine ---------------------------------------------------

console.log("\nlease state machine");
{
  const r = createHost();
  const clientA = { id: "A" };
  const clientB = { id: "B" };

  const status0 = call(r, METHOD, { action: "status" }, clientA);
  check("status before any hold -> not held", status0.ok && status0.payload.held === false);
  check("C7 snapshot reports scope:global", status0.payload.scope === "global", status0.payload.scope);

  const take = call(r, METHOD, { action: "take", reason: "user looking" }, clientA);
  check("take -> held + owned + server-minted lease", take.ok && take.payload.held && take.payload.owned);
  check("lease id is opaque and prefixed", /^zl-[0-9a-f]{32}$/.test(take.payload.controlLeaseId || ""), take.payload.controlLeaseId);

  const takeOther = call(r, METHOD, { action: "take" }, clientB);
  check("second client take -> already-held", takeOther.ok === false && takeOther.error.code === "computer-hold:already-held");

  const takeAgain = call(r, METHOD, { action: "take" }, clientA);
  check("same client re-take is idempotent", takeAgain.ok && takeAgain.payload.controlLeaseId === take.payload.controlLeaseId);

  const badRelease = call(r, METHOD, { action: "release", controlLeaseId: "zl-deadbeef" }, clientA);
  check("wrong lease -> lease-invalid", badRelease.ok === false && badRelease.error.code === "computer-hold:lease-invalid");

  const releaseOther = call(r, METHOD, { action: "release", controlLeaseId: take.payload.controlLeaseId }, clientB);
  check("non-owner release -> lease-invalid", releaseOther.ok === false && releaseOther.error.code === "computer-hold:lease-invalid");

  const release = call(r, METHOD, { action: "release", controlLeaseId: take.payload.controlLeaseId }, clientA);
  check("owner release -> not held + resumeSnapshotRequired", release.ok && release.payload.held === false && release.payload.resumeSnapshotRequired === true);

  const bad = call(r, METHOD, { action: "nonsense" }, clientA);
  check("unknown control action -> bad-request", bad.ok === false && bad.error.code === "zero-policy:bad-request");
}

// --- connection loss releases the hold -------------------------------------

console.log("\nconnection-bound hold (crash without pagehide)");
{
  const r = createHost();
  const clientA = makeClient("A");
  const take = call(r, METHOD, { action: "take" }, clientA);
  check("hold is owned before disconnect", take.ok && take.payload.held === true && take.payload.owned === true);

  clientA.abort();

  const clientB = makeClient("B");
  const status = call(r, METHOD, { action: "status" }, clientB);
  check("owner disconnect releases the hold", status.ok && status.payload.held === false, JSON.stringify(status.payload));
  check("new connection is not offered the dead lease", status.payload.owned === false && status.payload.controlLeaseId === undefined);
  check("disconnect release arms the fresh-snapshot gate", status.payload.resumeSnapshotRequired === true);
  check("disconnect release is counted", status.payload.stats.releasedByDisconnect === 1, JSON.stringify(status.payload.stats));
  const leaseRow = status.payload.recent.find((entry) => entry.kind === "lease");
  check(
    "disconnect release is in the audit trail",
    leaseRow?.action === "release" && leaseRow?.reason === "connection-closed" && leaseRow?.held === false,
    JSON.stringify(leaseRow),
  );

  const gated = evaluate(r, "computer", "left_click");
  check("agent input is stale-gated after a disconnect release", deny(gated) && gated.reason === "computer-hold:stale-frame", JSON.stringify(gated));
  check("observation still works after a disconnect release", evaluate(r, "computer", "screenshot") === undefined);
  check("agent input allowed after the fresh capture", evaluate(r, "computer", "left_click") === undefined);
}

{
  const r = createHost();
  const clientA = makeClient("A");
  const clientB = makeClient("B");
  call(r, METHOD, { action: "take" }, clientA);
  const seen = call(r, METHOD, { action: "status" }, clientB);
  check(
    "non-owner status never leaks the lease id",
    seen.payload.held === true && seen.payload.owned === false && seen.payload.controlLeaseId === undefined,
    JSON.stringify(seen.payload),
  );
  clientB.abort();
  const status = call(r, METHOD, { action: "status" }, clientA);
  check("another connection closing does not release the hold", status.payload.held === true && status.payload.owned === true);
  check("non-owner disconnect is not counted", status.payload.stats.releasedByDisconnect === 0, JSON.stringify(status.payload.stats));
}

{
  const r = createHost();
  const clientA = makeClient("A");
  const take = call(r, METHOD, { action: "take" }, clientA);
  call(r, METHOD, { action: "release", controlLeaseId: take.payload.controlLeaseId }, clientA);
  clientA.abort();
  const status = call(r, METHOD, { action: "status" }, makeClient("B"));
  check("normal release detaches the disconnect listener", status.payload.stats.releasedByDisconnect === 0, JSON.stringify(status.payload.stats));
  check("normal release still arms the fresh-snapshot gate", status.payload.resumeSnapshotRequired === true);
}

{
  const r = createHost();
  const clientA = makeClient("A");
  clientA.abort();
  const take = call(r, METHOD, { action: "take" }, clientA);
  check("take from an already-closed connection is refused", take.ok === false && take.error.code === "zero-policy:bad-request", JSON.stringify(take));
  const status = call(r, METHOD, { action: "status" }, makeClient("B"));
  check("refused take leaves no hold", status.payload.held === false);
}

{
  const r = createHost();
  const take = call(r, METHOD, { action: "take" }, null);
  check("take without a Gateway connection is refused", take.ok === false && take.error.code === "zero-policy:bad-request", JSON.stringify(take));
}

// --- C6: strict action parsing --------------------------------------------

console.log("\nC6 strict `action` field (fail closed)");
{
  const r = createHost();
  check("missing action -> unknown-action deny", deny(evaluate(r, "computer", undefined)));
  check("empty action -> unknown-action deny", deny(evaluate(r, "computer", "   ")));
  check("non-string action -> unknown-action deny", (() => {
    const policy = r.policies[0];
    return deny(policy.evaluate({ toolName: "computer", params: { action: 42 } }, { runId: "r" }));
  })());

  // The old fallbacks must be gone: `type` must NOT be honoured as an action.
  const viaType = (() => {
    const policy = r.policies[0];
    return policy.evaluate({ toolName: "computer", params: { type: "screenshot" } }, { runId: "r" });
  })();
  check("`type` fallback removed (fails closed instead of silently allowing)", deny(viaType), JSON.stringify(viaType));
}

// --- C4: full observation allowlist ---------------------------------------

console.log("\nC4 observation allowlist");
{
  const r = createHost();
  const clientA = { id: "A" };
  call(r, METHOD, { action: "take" }, clientA);

  const taxonomy = [
    "list_apps", "list_windows", "get_accessibility_tree", "get_cursor_position",
    "get_window_state", "zoom", "get_browser_state", "get_recording_state",
  ];
  for (const action of taxonomy) {
    check(`${action} allowed during hold`, evaluate(r, "computer", action) === undefined);
  }
  check("screenshot allowed during hold", evaluate(r, "computer", "screenshot") === undefined);
  check("wait allowed during hold", evaluate(r, "computer", "wait") === undefined);
  check("observe list is the 10-name superset", DEFAULT_OBSERVE_ACTIONS.length === 10, String(DEFAULT_OBSERVE_ACTIONS.length));

  const inputs = ["left_click", "type", "key", "set_value", "bring_to_front", "invoke_menu", "launch_app", "kill_app", "browser_click"];
  for (const action of inputs) {
    const res = evaluate(r, "computer", action);
    check(`${action} refused during hold`, deny(res) && res.reason === "computer-hold:human-control", JSON.stringify(res));
  }
}

// --- C5: post-release staleness gates EVERY non-observation action ---------

console.log("\nC5 post-release stale-reference gate");
{
  const r = createHost();
  const clientA = { id: "A" };
  const take = call(r, METHOD, { action: "take" }, clientA);
  call(r, METHOD, { action: "release", controlLeaseId: take.payload.controlLeaseId }, clientA);

  const gated = ["left_click", "type", "set_value", "bring_to_front", "invoke_menu", "launch_app", "kill_app", "browser_click", "browser_navigate"];
  for (const action of gated) {
    const res = evaluate(r, "computer", action);
    check(`${action} refused with stale-frame after release`, deny(res) && res.reason === "computer-hold:stale-frame", JSON.stringify(res));
  }

  check("observation still allowed while stale", evaluate(r, "computer", "get_window_state") === undefined);
  check(
    "get_window_state WITHOUT includeScreenshot does NOT clear staleness",
    deny(evaluate(r, "computer", "left_click")),
  );
  check(
    "get_window_state WITH includeScreenshot clears staleness",
    evaluate(r, "computer", "get_window_state", {}, { includeScreenshot: true }) === undefined,
  );
  check("coordinate action allowed after the fresh capture", evaluate(r, "computer", "left_click") === undefined);
}

// --- C6': code-mode envelopes ---------------------------------------------

console.log("\nC6' code-mode `{code}` envelopes (fail-open path Qoder raised)");
{
  const r = createHost();
  const policy = r.policies[0];
  const codeMode = { toolName: "exec", params: { code: "await computer({action:'left_click'})" } };
  const codeCtx = { runId: "run-1", toolKind: "code_mode_exec", toolInputKind: "javascript" };

  check("code-mode is matched (policy has exec in its matcher)", policy.matcher.includes("exec"), JSON.stringify(policy.matcher));

  const notHeld = policy.evaluate(codeMode, codeCtx);
  check("code-mode allowed when no hold is active", notHeld === undefined, JSON.stringify(notHeld));

  const clientA = { id: "A" };
  call(r, METHOD, { action: "take" }, clientA);
  const held = policy.evaluate(codeMode, codeCtx);
  check(
    "code-mode REFUSED during a hold (was the fail-open path)",
    deny(held) && held.reason === "computer-hold:human-control",
    JSON.stringify(held),
  );

  const status = call(r, METHOD, { action: "status" }, clientA);
  check("code-mode refusals are counted", status.payload.stats.refusedCodeMode >= 1, JSON.stringify(status.payload.stats));
  check("code-mode calls are counted when allowed", status.payload.stats.codeModeCalls >= 1, JSON.stringify(status.payload.stats));
  const row = status.payload.recent.find((e) => e.kind === "code_mode_exec");
  check("code-mode appears in the audit trail", Boolean(row), JSON.stringify(status.payload.recent.slice(-3)));
}

console.log("\nC6' code-mode honours budgets");
{
  const r = createHost({ maxActionsPerRun: 2, maxInputActionsPerRun: 2 });
  const policy = r.policies[0];
  const codeMode = { toolName: "exec", params: { code: "computer()" } };
  const codeCtx = { runId: "run-budget", toolKind: "code_mode_exec", toolInputKind: "javascript" };
  check("first code-mode call allowed", policy.evaluate(codeMode, codeCtx) === undefined);
  check("second code-mode call allowed", policy.evaluate(codeMode, codeCtx) === undefined);
  const third = policy.evaluate(codeMode, codeCtx);
  check("third code-mode call refused by budget", deny(third) && third.reason === "zero-policy:budget:code-mode", JSON.stringify(third));
}

// --- C5: `wait` is a fresh capture ----------------------------------------

console.log("\nC5 `wait` counts as a fresh desktop capture (Qoder, computer-use.md:92)");
{
  const r = createHost();
  const clientA = { id: "A" };
  const take = call(r, METHOD, { action: "take" }, clientA);
  call(r, METHOD, { action: "release", controlLeaseId: take.payload.controlLeaseId }, clientA);
  check("stale right after release", deny(evaluate(r, "computer", "left_click")));
  check("wait is allowed while stale", evaluate(r, "computer", "wait") === undefined);
  check("wait clears staleness", evaluate(r, "computer", "left_click") === undefined);
}

// --- activation self-check -------------------------------------------------

console.log("\nactivation self-check (silent-rejection guard)");
{
  const logs = { info: [], warn: [], error: [] };
  const run = (readManifest) => {
    logs.info.length = 0; logs.warn.length = 0; logs.error.length = 0;
    zeroPolicyPlugin.register({
      pluginConfig: {},
      logger: { info: (m) => logs.info.push(m), warn: (m) => logs.warn.push(m), error: (m) => logs.error.push(m) },
      registerTrustedToolPolicy() {},
      registerGatewayMethod() {},
      readManifest,
    });
  };

  run(() => MANIFEST);
  check("declared manifest -> info, no error", logs.info.length > 0 && logs.error.length === 0, JSON.stringify(logs));

  run(() => ({ id: "zero-policy", contracts: { trustedToolPolicies: [] } }));
  check("undeclared manifest -> loud error naming the policy id", logs.error.some((m) => m.includes("MANIFEST DOES NOT DECLARE") && m.includes(POLICY_ID)), JSON.stringify(logs.error));

  run(() => { throw new Error("boom"); });
  check("unreadable manifest -> warning, never a throw", logs.warn.some((m) => m.includes("could not read")), JSON.stringify(logs.warn));
}

console.log("\nC5 second path: screenshot clears staleness");{
  const r = createHost();
  const clientA = { id: "A" };
  const take = call(r, METHOD, { action: "take" }, clientA);
  call(r, METHOD, { action: "release", controlLeaseId: take.payload.controlLeaseId }, clientA);
  check("stale before screenshot", deny(evaluate(r, "computer", "left_click")));
  check("screenshot allowed", evaluate(r, "computer", "screenshot") === undefined);
  check("not stale after screenshot", evaluate(r, "computer", "left_click") === undefined);
}

// --- budgets ---------------------------------------------------------------

console.log("\nbudgets");
{
  const r = createHost({ maxActionsPerRun: 3, maxInputActionsPerRun: 2 });
  check("call 1 allowed", evaluate(r, "computer", "left_click") === undefined);
  check("call 2 allowed", evaluate(r, "computer", "left_click") === undefined);
  const third = evaluate(r, "computer", "left_click");
  check("input budget exhausted", deny(third) && third.reason.startsWith("zero-policy:budget"), JSON.stringify(third));
  const fourth = evaluate(r, "computer", "list_windows");
  check(
    "observations also count against the total budget (total is the outer ceiling)",
    deny(fourth) && fourth.reason === "zero-policy:budget:actions>3",
    JSON.stringify(fourth),
  );
}

// --- blocked + high risk ---------------------------------------------------

console.log("\nblocked actions, high-risk recording, config validation");
{
  const r = createHost({ blockedActions: ["replay_trajectory"] });
  const blocked = evaluate(r, "computer", "replay_trajectory");
  check("blocked action refused regardless of hold", deny(blocked) && blocked.reason === "zero-policy:action-blocked:replay_trajectory");
  check("high-risk default list has the 7 taxonomy families", DEFAULT_HIGH_RISK_ACTIONS.length === 7, String(DEFAULT_HIGH_RISK_ACTIONS.length));

  let threw = false;
  try { createHost({ maxActionsPerRun: -1 }); } catch { threw = true; }
  check("invalid config throws at register()", threw);

  threw = false;
  try { createHost({ controlMethodName: "" }); } catch { threw = true; }
  check("empty method name throws", threw);
}

// --- scope + audit trail ---------------------------------------------------

console.log("\ngateway method scope and audit trail");
{
  const r = createHost();
  const entry = r.methods.get(METHOD);
  check("C8 method registered with explicit operator.write scope", entry?.opts?.scope === "operator.write", entry?.opts?.scope);

  const clientA = { id: "A" };
  call(r, METHOD, { action: "take" }, clientA);
  evaluate(r, "computer", "left_click", {}, { target: "node" });
  const status = call(r, METHOD, { action: "status" }, clientA);
  check("refusal is visible in the snapshot stats", status.payload.stats.refusedByHold >= 1, JSON.stringify(status.payload.stats));
  check("recent decisions are bounded and recorded", Array.isArray(status.payload.recent) && status.payload.recent.length > 0);
  const last = status.payload.recent.at(-1);
  check("audit row carries action, decision and reason", last?.action === "left_click" && last?.decision === "deny" && last?.reason === "computer-hold:human-control", JSON.stringify(last));
  check("audit row records the computer target (C7 groundwork)", last?.target === "node", JSON.stringify(last?.target));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\nfailures:");
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed === 0 ? 0 : 1);
