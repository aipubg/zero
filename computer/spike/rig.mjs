/**
 * CU-01 spike rig — pure, offline logic for the Windows CUA run.
 *
 * WHY THIS EXISTS: CU-02 readiness §5 risk 4 says my harness is new code and "a bug in it
 * can masquerade as a driver failure". That is the worst possible failure mode in a gated
 * window: we would spend the owner's GO chasing a Zero bug while believing we had measured
 * OpenClaw. So the parts of the rig that are pure logic — gate decisions, evidence validation,
 * verdict computation, and the pre-write secret/PII screen — are written here and self-tested
 * offline against synthetic fixtures BEFORE any machine is involved.
 *
 * WHAT THIS FILE NEVER DOES: no network, no child processes, no driver, no Gateway call, no
 * desktop action, no install. It reads a schema and manipulates plain objects. Running it is
 * not a gated action; running CU-01 is.
 *
 * Pinned references (see reports/computer/windows-cua-inventory.md and
 * reports/computer/release-pin-reconciliation.md for why the release, not the checkout, is
 * authoritative): OpenClaw 2026.10.6 @ fe06181 (installed) / 0132405 (source checkout);
 * driver @trycua/cua-driver 0.32.0 (release) ; action contract = 40 names, 36 advertised win32.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The release's advertised Windows actions, restated here so the rig fails loudly if my
 *  derived contract and the rig ever disagree. Source of truth: contracts/computer-act-actions.json. */
export const EXPECTED = Object.freeze({
  driverVersion: "0.32.0",
  contractVersion: 2,
  providerId: "cua-computer",
  advertisedWin32Count: 36,
  v2TotalCount: 40,
  multiDisplay: false,
  agentCursor: false,
});

/** Observation actions the human-hold must keep usable (upstream node-invoke-policy.ts:26-35 + wait). */
export const OBSERVE_ACTIONS = Object.freeze([
  "screenshot", "wait", "list_apps", "list_windows", "get_accessibility_tree",
  "get_cursor_position", "get_window_state", "zoom", "get_browser_state", "get_recording_state",
]);

/** Names that must NOT be reachable for the Operator under D-011 config. */
export const MUST_BE_REFUSED_IN_ZERO_MVP = Object.freeze(["escalate_scope"]);

/** Native artifacts the release manifest pins, verified by hash on 2026-10-23. */
export const EXPECTED_DIGESTS = Object.freeze({
  "cua_driver_sdk.dll": "8d4ffbc583341d0bd5ea621e4577a3fe3aa286c3fcf04590c6f598d30b6a1919",
  "cua_driver_node_runtime.node": "48d75442de05ae674acf81342278585ef14724a7992b9a09d900e4e03d2c5a80",
});

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Synthetic sentinel. Never a real path, name, or credential; unique per run so a stale
 *  fixture can never be mistaken for this run's proof. */
export function makeSentinel(runId) {
  if (!runId || typeof runId !== "string") throw new Error("makeSentinel requires a runId");
  return `ZERO-CU01-${runId}-SENTINEL`;
}

// ---------------------------------------------------------------------------
// G-A gate decisions. These abort the run BEFORE any desktop action, which is the
// whole point: CU-00 §5 predicts specific failures, and discovering them mid-spike
// wastes the window.
// ---------------------------------------------------------------------------

const SUPPORTED_NATIVE = new Set(["win32-x64-msvc", "win32-arm64-msvc"]);

/** @returns {{abort: boolean, reasons: string[], risks: string[]}} */
export function evaluateGates(preflight) {
  const reasons = [];
  const risks = [];
  if (!preflight || typeof preflight !== "object") {
    return { abort: true, reasons: ["preflight payload missing or malformed"], risks };
  }

  const target = preflight.cpuNativeTarget ?? preflight.cpuTarget;
  if (!SUPPORTED_NATIVE.has(target)) {
    reasons.push(`unsupported CPU native target ${JSON.stringify(target)} -> COMPUTER_DRIVER_PLATFORM_UNSUPPORTED`);
  }

  const displays = Array.isArray(preflight.displays)
    ? preflight.displays.length
    : Number(preflight.displayCount ?? 0);
  if (displays > 1) {
    // Provider advertises multiDisplay:false and throws on screenIndex !== 0.
    risks.push(`multi-display (${displays}) — only the primary is controllable; expect COMPUTER_UNSUPPORTED_DISPLAY`);
  } else if (displays === 0) {
    reasons.push("preflight reports zero displays — no capture target exists");
  }

  const scaling = Number(preflight.scalingPercent ?? preflight.effectivePct ?? 100);
  if (scaling !== 100) {
    // Non-macOS capture throws unless screen geometry equals screenshot geometry.
    risks.push(`scaling ${scaling}% — capture geometry assertion expected to throw COMPUTER_UNSUPPORTED_DISPLAY`);
  }

  if (preflight.rfbLoopbackPresent === false || preflight.loopbackRfbListener === false) {
    risks.push("no loopback RFB listener — live-view step S8 cannot pass yet (needs O2 consent)");
  }

  const session = preflight.sessionKind ?? "unknown";
  if (session !== "console" && session !== "rdp") {
    risks.push(`session kind ${JSON.stringify(session)} is not console/RDP — interactive-session prerequisite unconfirmed`);
  }

  return { abort: reasons.length > 0, reasons, risks };
}

/** G-C/G-E silent-failure gate, folded in from DeepSeek's 06:24 release-bundle finding:
 *  on non-macOS the plugin early-returns in register() unless entries["cua-computer"].enabled
 *  === true, which hides BOTH the doctor check and the provider. Symptoms are absence, not errors.
 *  So "check not found" is an enablement failure, and a node advertising no computer
 *  capability with a clean log is the same failure — not a driver fault. Returns the checks
 *  a run must assert before spending the window on S1..S11. */
export function evaluateEnablementGate({ pluginEnabled, doctorCheckFound, nodeCommands = [] }) {
  const problems = [];
  if (pluginEnabled !== true) {
    problems.push("plugins.entries.cua-computer.enabled is not exactly true — provider will not register on Windows");
  }
  if (doctorCheckFound === false) {
    problems.push("doctor check cua-computer/driver-artifacts not found — treat as enablement failure, not a missing artifact");
  }
  if (pluginEnabled === true && doctorCheckFound === true && !nodeCommands.includes("computer.act")) {
    problems.push("plugin enabled and check registered, yet the node does not advertise computer.act — look for a non-interactive session or an unapproved pairing surface");
  }
  return {
    ready: problems.length === 0,
    problems,
    mustAdvertise: ["computer.act", "screen.snapshot", "desktop.stream"],
    missing: ["computer.act", "screen.snapshot", "desktop.stream"].filter((c) => !nodeCommands.includes(c)),
  };
}

/** A G-C doctor line is a pass only when it says exactly this; anything else is a stop. */
export function doctorPassed(output) {
  const text = String(output ?? "");
  if (/no findings/i.test(text) && !/COMPUTER_DRIVER_[A-Z_]+/u.test(text)) return true;
  const code = text.match(/COMPUTER_DRIVER_[A-Z_]+/u)?.[0];
  return { passed: false, code: code ?? "UNPARSED_DOCTOR_OUTPUT" };
}

// ---------------------------------------------------------------------------
// Evidence validation. result.schema.json is the contract; a validator that is
// never run makes the contract decorative, so this checks step records against it.
// Subset implemented deliberately: type, enum, const, required, pattern,
// additionalProperties, minItems, and ["T","null"] unions.
// ---------------------------------------------------------------------------

export function loadSchema(path = join(HERE, "result.schema.json")) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value === undefined) return "undefined";
  return typeof value;
}

function checkType(value, allowed) {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  const t = typeOf(value);
  if (list.includes(t)) return true;
  if (list.includes("integer") && t === "number" && Number.isInteger(value)) return true;
  if (list.includes("number") && t === "number") return true;
  return false;
}

/** Validate one step record. Returns an array of human-readable problems ([] = valid). */
export function validateStep(step, schema = loadSchema()) {
  const spec = schema?.properties?.steps?.items;
  if (!spec) return ["schema has no steps.items definition"];
  return validateObject(step, spec, "step");
}

/** Validate the G-G item 15 connection-death block. Kept separate from validateStep because
 *  this evidence is about the hold path, not about a desktop S-step. */
export function validateHoldRecovery(block, schema = loadSchema()) {
  const spec = schema?.properties?.holdRecovery;
  if (!spec) return ["schema has no holdRecovery definition"];
  return validateObject(block, spec, "holdRecovery");
}

function validateObject(value, spec, label) {
  const problems = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [`${label}: expected object, got ${typeOf(value)}`];
  }
  const props = spec.properties ?? {};
  for (const key of spec.required ?? []) {
    if (value[key] === undefined) problems.push(`${label}: required field ${key} missing`);
  }
  if (spec.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in props)) problems.push(`${label}: unknown field ${key} (schema is closed)`);
    }
  }
  for (const [key, child] of Object.entries(props)) {
    if (value[key] === undefined || !child) continue;
    problems.push(...validateValue(value[key], child, `${label}.${key}`));
  }
  return problems;
}

function validateValue(value, spec, label) {
  const problems = [];
  if (spec.type && !checkType(value, spec.type)) {
    problems.push(`${label}: expected type ${JSON.stringify(spec.type)}, got ${typeOf(value)}`);
    return problems;
  }
  if (spec.const !== undefined && value !== spec.const) {
    problems.push(`${label}: expected const ${JSON.stringify(spec.const)}, got ${JSON.stringify(value)}`);
  }
  if (spec.enum && !spec.enum.includes(value)) {
    problems.push(`${label}: ${JSON.stringify(value)} not in enum ${JSON.stringify(spec.enum)}`);
  }
  if (spec.pattern && typeof value === "string" && !new RegExp(spec.pattern, "u").test(value)) {
    problems.push(`${label}: ${JSON.stringify(value)} does not match ${spec.pattern}`);
  }
  if (Array.isArray(value)) {
    if (spec.minItems !== undefined && value.length < spec.minItems) {
      problems.push(`${label}: array has ${value.length} items, needs >= ${spec.minItems}`);
    }
    if (spec.items) {
      value.forEach((item, i) => problems.push(...validateValue(item, spec.items, `${label}[${i}]`)));
    }
  } else if (spec.properties) {
    problems.push(...validateObject(value, spec, label));
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Step + verdict construction. Fixed field order and explicit nulls keep produced
// evidence diffable, which matters when the senior reviews a run.
// ---------------------------------------------------------------------------

export function makeStep({ id, verb, action = null, command = null, intent, result, errorCode = null, frame = null, hostSideVerification = null, evidenceFiles = [] }) {
  if (!/^S([1-9]|1[01])$/u.test(id)) throw new Error(`step id must be S1..S11, got ${id}`);
  if (!intent) throw new Error("step requires an intent description");
  return {
    id, verb, intent,
    action, command,
    result,
    errorCode,
    ...(frame ? { frame } : {}),
    ...(hostSideVerification ? { hostSideVerification } : {}),
    evidenceFiles,
  };
}

/** K7 is the connection-death claim: every field must line up, so a normal release
 *  (pagehide ran), a missing audit row, a landed input, or an uncleared gate all force false.
 *  Exported so the designated-environment runner and the offline tests use one predicate. */
export function computeK7(hr) {
  return Boolean(
    hr
    && hr.result === "pass"
    && hr.attempted === true
    && hr.ownerConnectionClosedWithoutPagehide === true
    && ["control-ui", "raw-ws", "cli"].includes(hr.ownerConnectionPath)
    && hr.statusReadFromNewConnection === true
    && hr.resumeSnapshotRequiredBefore === false
    && hr.statusFromNewConnection?.held === false
    && hr.statusFromNewConnection?.owned === false
    && hr.statusFromNewConnection?.resumeSnapshotRequired === true
    && Number.isInteger(hr.releasedByDisconnectBefore)
    && Number.isInteger(hr.releasedByDisconnectAfter)
    && hr.releasedByDisconnectAfter === hr.releasedByDisconnectBefore + 1
    && hr.connectionClosedAuditRow === true
    && hr.inputBeforeFreshCapture?.refused === true
    && hr.inputBeforeFreshCapture?.errorCode === "computer-hold:stale-frame"
    && hr.inputBeforeFreshCapture?.desktopEffect === "none"
    && hr.freshCaptureClearedGate === true
  );
}

/** K2 (end-to-end proof) can only pass on a HOST-SIDE readback. A screenshot is never proof —
 *  this function exists so the rig cannot be talked into claiming success without one. */
export function computeVerdict(steps, extras = {}) {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const pass = (id) => byId.get(id)?.result === "pass";
  const s6 = byId.get("S6");
  const host = s6?.hostSideVerification;
  const k2 = Boolean(host && host.sentinelMatched === true && typeof host.sha256 === "string" && host.sha256.length === 64);
  const k7 = computeK7(extras.holdRecovery);
  return {
    k1: pass("S5"),
    k2,
    k3: pass("S8"),
    k4: pass("S9"),
    k5: byId.get("S11")?.result === "pass",
    k5ExpectedFailure: byId.get("S11")?.result === "refused-as-expected",
    k6: pass("S10"),
    k7,
    takeoverGapConfirmed: byId.get("S11")?.result === "refused-as-expected",
    dpiOutcome: extras.dpiOutcome ?? "not-tested",
    sessionOutcome: extras.sessionOutcome ?? "not-tested",
    backgroundDeliveryOutcome: extras.backgroundDeliveryOutcome ?? "not-tested",
    notClaimed: buildNotClaimed(byId, k2, k7, extras),
  };
}

function buildNotClaimed(byId, k2, k7, extras) {
  const list = [
    "production readiness",
    "multi-display control",
    "physical-console arbitration (no local-input sensor exists)",
    "raw node.invoke coverage (tool-layer hold cannot see it)",
  ];
  if (extras.codeModePathUnreachableUnderD011 !== true) list.push("code-mode route proven unreachable by live test");
  if (extras.visionPathVerified !== true) list.push("vision model verified to read the delivered frame (owner-supplied claim only)");
  if (!k2) list.push("host-side file readback — WITHOUT THIS NO TASK COMPLETION MAY BE CLAIMED");
  if (!k7) list.push("connection-death hold recovery (no-pagehide disconnect) — not proven");
  if (byId.get("S11")?.result === "not-attempted") list.push("takeover behaviour, tested or untested");
  return list;
}

/** Refuse to write evidence that could leak a secret or private content. This runs on the
 *  serialised payload, so it screens strings, paths and key shapes before anything is saved. */
export function screenEvidence(text) {
  const body = String(text ?? "");
  const findings = [];
  const patterns = [
    ["api-key-shaped-secret", /\b(?:sk|nvapi|ghp|xai|key|pk)-[A-Za-z0-9_-]{16,}/gu],
    ["bearer-token-in-text", /\bBearer\s+[A-Za-z0-9._\-]{16,}/giu],
    ["private-key-block", /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/gu],
    ["aws-style-access-key", /\bAKIA[0-9A-Z]{16}\b/gu],
    ["user-profile-path", /[A-Za-z]:\\+(?:Users|Document and Settings)\\+(?!<redacted)[^\s"'\\]+/giu],
    ["unc-home-path", /\\\\[^\s"'\\]+\\Users\\[^\s"'\\]+/giu],
    ["zero-data-dir", /E:[\\/]zero[\\/](?:backend|app)[\\/]\.zero-data/giu],
  ];
  for (const [name, re] of patterns) {
    const hits = body.match(re);
    if (hits) findings.push({ name, count: hits.length, sample: String(hits[0]).slice(0, 12) });
  }
  return { safe: findings.length === 0, findings };
}

/** Redaction applied before writing, so a known account name never reaches disk. */
export function redact(text, secrets = []) {
  let out = String(text ?? "");
  for (const secret of secrets.filter(Boolean)) {
    out = out.split(String(secret)).join("<redacted>");
  }
  out = out.replace(/([A-Za-z]:\\+(?:Users|Document and Settings)\\+)[^\s"'\\]+/giu, "$1<redacted>");
  return out;
}

/** Hold semantics the rig must assert, kept in code so a run cannot quietly contradict the contract. */
export function classifyActionForHold(action) {
  if (typeof action !== "string" || action === "") return "unknown"; // fail closed upstream
  if (OBSERVE_ACTIONS.includes(action)) return "observation";
  return "input";
}
