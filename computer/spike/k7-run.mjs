#!/usr/bin/env node
/**
 * k7 runner — G-G item 15, connection-death hold recovery, for the DESIGNATED Zero environment.
 *
 * THE GATE IS THE POINT. `--live` refuses unless the owner has written
 * computer/spike/designated-environment.json (designated:true, designatedBy:"owner",
 * o1Resolved:true, holdRecoveryApproved:true). This file never creates that marker: an agent
 * that can authorize its own live run has no gate at all.
 *
 * WHAT `--live` DOES: three `zero.computer.control` calls through the local CLI shim —
 * status, take, status from a new process. The take is held by a one-shot process; when that
 * process exits, its socket closes without a browser `pagehide`, which is the path under test.
 * It sends NO desktop input, launches NO node, and touches NO screen.
 *
 * WHAT `--live` CANNOT DO: H4/H5. The stale-frame refusal and the fresh-capture gate are
 * agent/tool-layer behaviour and must be recorded by an Operator run on the same environment.
 * They are merged afterwards with `--merge`; until then the block says result:"not-attempted"
 * and k7 is false.
 *
 * WHAT NOTHING HERE CAN DO: turn a normal Release/pagehide into k7. The predicate lives in
 * rig.mjs and is shared with the offline tests.
 *
 * Usage:
 *   node computer/spike/k7-run.mjs --plan [--preflight preflight.json] [--json]
 *   node computer/spike/k7-run.mjs --live --openclaw backend/node_modules/.bin/openclaw.cmd \
 *        --state-dir backend/.openclaw --config backend/config/openclaw.json \
 *        --preflight preflight.json [--out reports/computer/spikes/<runid>/holdRecovery.pending.json]
 *   node computer/spike/k7-run.mjs --merge <pending.json> --input-evidence <h4h5.json> [--out <final.json>]
 *   node computer/spike/k7-run.mjs --validate <holdRecovery.json>
 *
 * Exit codes: 0 = plan printed / live pending written / block valid; 2 = gate refused;
 * 1 = malformed input, write refused, or a runtime failure.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyActionForHold,
  computeK7,
  evaluateGates,
  loadSchema,
  redact,
  screenEvidence,
  validateHoldRecovery,
} from "./rig.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const EVIDENCE_ROOT = join(REPO_ROOT, "reports", "computer", "spikes");

export const METHOD = "zero.computer.control";
export const DEFAULT_MARKER = join(HERE, "designated-environment.json");

// ---------------------------------------------------------------------------
// Designation marker. Owner-authored only. A missing field is a refusal, not a default.
// ---------------------------------------------------------------------------

export function validateDesignationMarker(marker) {
  const problems = [];
  if (!marker || typeof marker !== "object" || Array.isArray(marker)) {
    return ["designation marker must be a JSON object"];
  }
  if (marker.designated !== true) problems.push("designated must be exactly true");
  if (marker.designatedBy !== "owner") problems.push('designatedBy must be exactly "owner"; an agent cannot self-designate');
  if (marker.ticket !== "CU-01") problems.push('ticket must be exactly "CU-01"');
  if (marker.o1Resolved !== true) problems.push("o1Resolved must be exactly true");
  if (marker.holdRecoveryApproved !== true) problems.push("holdRecoveryApproved must be exactly true for this state-mutating check");
  if (typeof marker.environmentLabel !== "string" || marker.environmentLabel.trim() === "") {
    problems.push("environmentLabel must be a non-empty string (a role label, not an account name)");
  }
  const at = marker.recordedAtUtc;
  if (typeof at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u.test(at)) {
    problems.push("recordedAtUtc must be an ISO-8601 UTC timestamp ending in Z");
  } else if (Number.isNaN(Date.parse(at))) {
    problems.push("recordedAtUtc is not a parseable timestamp");
  }
  return problems;
}

export function checkDesignation(markerPath = DEFAULT_MARKER) {
  if (!existsSync(markerPath)) {
    return {
      path: markerPath,
      present: false,
      marker: null,
      problems: [`designation marker not found at ${markerPath}`],
      ok: false,
    };
  }
  let marker;
  try {
    marker = JSON.parse(readFileSync(markerPath, "utf8"));
  } catch (error) {
    return { path: markerPath, present: true, marker: null, problems: [`designation marker is not valid JSON: ${error.message}`], ok: false };
  }
  const problems = validateDesignationMarker(marker);
  return { path: markerPath, present: true, marker, problems, ok: problems.length === 0 };
}

// ---------------------------------------------------------------------------
// Preflight adaptation. preflight.ps1 writes a different shape from the rig's normalized
// gate input, so the mapping is explicit and tested rather than assumed at the window.
// ---------------------------------------------------------------------------

function sessionKindFromRaw(raw) {
  const lines = String(raw ?? "").split(/\r?\n/u).filter((line) => /active/iu.test(line));
  if (lines.some((line) => /rdp-tcp/iu.test(line))) return "rdp";
  if (lines.some((line) => /console/iu.test(line))) return "console";
  return "unknown";
}

export function normalizePreflight(preflight) {
  if (!preflight || typeof preflight !== "object" || Array.isArray(preflight)) return null;
  const displays = Array.isArray(preflight.displays)
    ? preflight.displays
    : Array.isArray(preflight.checks?.displays)
      ? preflight.checks.displays
      : (Number.isInteger(preflight.displayCount) ? preflight.displayCount : 0);
  const fromRaw = sessionKindFromRaw(preflight.session?.querySessionRaw);
  const sessionKind = preflight.session?.consoleSession === true
    ? "console"
    : preflight.session?.rdpSession === true
      ? "rdp"
      : (fromRaw !== "unknown" ? fromRaw : (preflight.sessionKind ?? "unknown"));
  const scalingPercent = preflight.scaling?.effectivePct
    ?? preflight.scalingPercent
    ?? preflight.effectivePct
    ?? null;
  const rfbLoopbackPresent = preflight.rfbLoopback
    ? Number(preflight.rfbLoopback.loopbackRfbListenersFound) > 0
    : (preflight.rfbLoopbackPresent ?? null);
  return {
    cpuNativeTarget: preflight.cpuTarget ?? preflight.cpuNativeTarget ?? null,
    displays,
    scalingPercent,
    rfbLoopbackPresent,
    sessionKind,
    capturedAtUtc: preflight.capturedAtUtc ?? null,
    preflightVerdict: preflight.verdict ?? null,
    preflightChecks: preflight.checks ?? null,
  };
}

// ---------------------------------------------------------------------------
// Readiness. `liveReady` gates H1-H3 (Gateway + hold path). `k7Achievable` additionally
// requires the environment conditions H4/H5 need: one display, 100% scaling, interactive
// session. Tri-state method/node inputs keep "unverified offline" distinct from "known absent".
// ---------------------------------------------------------------------------

export function evaluateK7Readiness({
  marker = null,
  markerProblems = null,
  preflight = null,
  methodAdvertised = null,
  nodeCommands = null,
} = {}) {
  const blockers = [];
  const k7Blockers = [];
  const risks = [];
  const pending = [];

  const designationProblems = markerProblems ?? validateDesignationMarker(marker);
  blockers.push(...designationProblems.map((problem) => `designation: ${problem}`));

  const normalized = normalizePreflight(preflight);
  if (!normalized) {
    blockers.push("preflight payload missing or malformed");
  } else {
    const gates = evaluateGates(normalized);
    blockers.push(...gates.reasons);
    risks.push(...gates.risks);

    const displayCount = Array.isArray(normalized.displays)
      ? normalized.displays.length
      : Number(normalized.displays ?? 0);
    if (displayCount !== 1) {
      k7Blockers.push(`display count ${displayCount} — H5 needs a screenshot that succeeds`);
    }
    const scaling = normalized.scalingPercent === null ? Number.NaN : Number(normalized.scalingPercent);
    if (!(scaling === 100)) {
      k7Blockers.push(`scaling ${Number.isFinite(scaling) ? `${scaling}%` : "unknown"} — H5 needs a working screenshot; CU-00 predicts COMPUTER_UNSUPPORTED_DISPLAY otherwise`);
    }
    if (normalized.sessionKind !== "console" && normalized.sessionKind !== "rdp") {
      k7Blockers.push(`session kind ${JSON.stringify(normalized.sessionKind)} — H4/H5 need an interactive desktop session`);
    }
    if (normalized.rfbLoopbackPresent === false) {
      risks.push("no loopback RFB listener — live view is separate from k7, but step S8 cannot pass");
    }
  }

  if (methodAdvertised === false) blockers.push(`${METHOD} is not advertised by the Gateway`);
  if (methodAdvertised === null) pending.push(`live mode verifies ${METHOD} by calling status before any take`);
  if (nodeCommands === null) {
    pending.push("node surface unverified offline — H4/H5 need a node advertising computer.act");
  } else if (!Array.isArray(nodeCommands)) {
    blockers.push("nodeCommands must be an array when supplied");
  } else if (!nodeCommands.includes("computer.act")) {
    blockers.push("node does not advertise computer.act — H4/H5 cannot be executed");
  }

  const liveReady = blockers.length === 0;
  const k7Achievable = liveReady && k7Blockers.length === 0;
  return {
    markerValid: designationProblems.length === 0,
    liveReady,
    k7Achievable,
    blockers,
    k7Blockers,
    risks,
    pending,
    normalized,
  };
}

// ---------------------------------------------------------------------------
// Plan. Pure; prints what would happen and refuses to imply that H4/H5 are automated.
// ---------------------------------------------------------------------------

export function planSteps() {
  return [
    {
      id: "H1", phase: "live", via: "cli", action: "status", mutatesHold: false,
      writes: ["releasedByDisconnectBefore"],
      what: "read status from a new CLI connection; refuse to take if the hold is already held",
    },
    {
      id: "H2", phase: "live", via: "cli", action: "take", mutatesHold: true,
      writes: ["ownerConnectionPath", "ownerConnectionClosedWithoutPagehide"],
      what: "take in a one-shot CLI process; process exit closes the socket without pagehide",
    },
    {
      id: "H3", phase: "live", via: "cli", action: "status", mutatesHold: false,
      writes: ["statusFromNewConnection", "statusReadFromNewConnection", "releasedByDisconnectAfter", "connectionClosedAuditRow"],
      what: "a new process must see held:false, owned:false, resumeSnapshotRequired:true, counter +1, newest lease row connection-closed",
    },
    {
      id: "H4", phase: "external", via: "operator/agent", action: "input-before-capture", mutatesHold: false,
      writes: ["inputBeforeFreshCapture"],
      what: "one synthetic input must be refused with computer-hold:stale-frame and must not land",
    },
    {
      id: "H5", phase: "external", via: "operator/agent", action: "screenshot-then-input", mutatesHold: false,
      writes: ["freshCaptureClearedGate"],
      what: "a real screenshot clears the gate; the same input then stops being stale-frame refused",
    },
    {
      id: "H6", phase: "external", via: "operator", action: "non-owner-disconnect", mutatesHold: false,
      writes: ["note"],
      what: "a non-owner disconnect must leave the counter and the hold untouched",
    },
  ];
}

export function buildPlan({
  markerPath = DEFAULT_MARKER,
  markerPresent = false,
  marker = null,
  markerProblems = null,
  preflightPath = null,
  preflight = null,
  methodAdvertised = null,
  nodeCommands = null,
} = {}) {
  const problems = markerProblems ?? validateDesignationMarker(marker);
  const readiness = evaluateK7Readiness({ marker, markerProblems: problems, preflight, methodAdvertised, nodeCommands });
  return {
    mode: "plan",
    executesAnything: false,
    method: METHOD,
    designation: {
      path: markerPath,
      present: markerPresent,
      valid: problems.length === 0,
      problems,
    },
    preflight: preflight
      ? {
          path: preflightPath,
          capturedAtUtc: preflight.capturedAtUtc ?? null,
          verdict: preflight.verdict ?? null,
        }
      : null,
    readiness,
    phases: planSteps(),
    liveInvocation: [
      "node computer/spike/k7-run.mjs --live",
      "--openclaw backend/node_modules/.bin/openclaw.cmd",
      "--state-dir backend/.openclaw",
      "--config backend/config/openclaw.json",
      "--preflight <preflight.json>",
      "--out reports/computer/spikes/<runid>/holdRecovery.pending.json",
    ].join(" "),
    mergeInvocation: "node computer/spike/k7-run.mjs --merge <holdRecovery.pending.json> --input-evidence <h4h5.json>",
    guarantees: [
      "plan mode: no network, no child process, no Gateway call, no desktop input, no write",
      "live mode: only zero.computer.control status/take through the local CLI",
      "no desktop input is ever sent by this runner; H4/H5 come from an Operator run",
      "H4/H5 remain subject to the owner's O5/O6 gates; this runner does not authorize them",
      "the runner never creates the designation marker",
      "a normal Release or a pagehide that ran cannot satisfy k7",
    ],
  };
}

// ---------------------------------------------------------------------------
// Evidence blocks.
// ---------------------------------------------------------------------------

function latestAuditRow(recent) {
  return Array.isArray(recent) && recent.length > 0 ? recent[recent.length - 1] : null;
}

function isConnectionClosedRow(row) {
  return Boolean(row
    && row.kind === "lease"
    && row.action === "release"
    && row.reason === "connection-closed"
    && row.decision === "allow");
}

function counterOf(status) {
  const value = status?.stats?.releasedByDisconnect;
  return Number.isInteger(value) ? value : null;
}

export function makeRefusedBlock(reason) {
  return {
    attempted: false,
    ownerConnectionClosedWithoutPagehide: false,
    ownerConnectionPath: "cli",
    statusReadFromNewConnection: false,
    resumeSnapshotRequiredBefore: null,
    statusFromNewConnection: { held: null, owned: null, resumeSnapshotRequired: null },
    releasedByDisconnectBefore: null,
    releasedByDisconnectAfter: null,
    connectionClosedAuditRow: null,
    inputBeforeFreshCapture: { action: null, errorCode: null, refused: null, desktopEffect: null },
    freshCaptureClearedGate: null,
    result: "not-attempted",
    note: `refused before take: ${reason}`,
  };
}

/** Build the H1-H3 block. H4/H5 stay explicitly null, so k7 cannot pass until they are merged. */
export function makePendingBlock({ before = null, take = null, after = null, note = null } = {}) {
  const problems = [];
  const beforeCounter = counterOf(before);
  const afterCounter = counterOf(after);
  const auditRow = latestAuditRow(after?.recent);
  const connectionClosedAuditRow = isConnectionClosedRow(auditRow);

  if (!before) problems.push("H1: status before take was not readable");
  else {
    if (before.held !== false) problems.push(`H1: hold was already held (held=${JSON.stringify(before.held)})`);
    if (beforeCounter === null) problems.push("H1: stats.releasedByDisconnect is missing");
    if (before.resumeSnapshotRequired !== false) {
      problems.push(`H1: fresh-capture gate was already armed (resumeSnapshotRequired=${JSON.stringify(before.resumeSnapshotRequired)}); a fresh frame must clear it before the take`);
    }
  }
  const took = Boolean(take && take.held === true && take.owned === true);
  if (!took) problems.push("H2: take did not report held:true and owned:true");
  if (!after) problems.push("H3: status after the owner process closed was not readable");
  else {
    if (after.held !== false) problems.push(`H3: hold survived the owner death (held=${JSON.stringify(after.held)})`);
    if (after.owned !== false) problems.push(`H3: new connection inherited ownership (owned=${JSON.stringify(after.owned)})`);
    if (after.resumeSnapshotRequired !== true) problems.push(`H3: fresh-capture gate not armed (resumeSnapshotRequired=${JSON.stringify(after.resumeSnapshotRequired)})`);
    if (afterCounter === null) problems.push("H3: stats.releasedByDisconnect is missing");
    else if (beforeCounter !== null && afterCounter !== beforeCounter + 1) {
      problems.push(`H3: releasedByDisconnect ${beforeCounter} -> ${afterCounter}, expected +1`);
    }
    if (!connectionClosedAuditRow) problems.push("H3: newest recent[] row is not a connection-closed release");
  }

  const block = {
    attempted: true,
    ownerConnectionClosedWithoutPagehide: took,
    ownerConnectionPath: "cli",
    statusReadFromNewConnection: Boolean(after),
    resumeSnapshotRequiredBefore: before?.resumeSnapshotRequired ?? null,
    statusFromNewConnection: {
      held: after?.held ?? null,
      owned: after?.owned ?? null,
      resumeSnapshotRequired: after?.resumeSnapshotRequired ?? null,
    },
    releasedByDisconnectBefore: beforeCounter,
    releasedByDisconnectAfter: afterCounter,
    connectionClosedAuditRow,
    inputBeforeFreshCapture: { action: null, errorCode: null, refused: null, desktopEffect: null },
    freshCaptureClearedGate: null,
    result: problems.length === 0 ? "not-attempted" : "fail",
    note: [
      "ownerConnectionPath=cli: the one-shot CLI process exited, closing its socket without pagehide",
      note,
      problems.length > 0 ? `live-phase problems: ${problems.join("; ")}` : "H1-H3 passed; H4/H5 still required",
    ].filter(Boolean).join(" | "),
  };
  return { block, problems };
}

export function validateInputEvidence(evidence) {
  const problems = [];
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return ["input evidence must be a JSON object"];
  }
  const allowed = new Set(["inputBeforeFreshCapture", "freshCaptureClearedGate", "note"]);
  for (const key of Object.keys(evidence)) {
    if (!allowed.has(key)) problems.push(`unknown field ${key} (evidence is closed)`);
  }
  const input = evidence.inputBeforeFreshCapture;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    problems.push("inputBeforeFreshCapture must be an object");
  } else {
    for (const key of Object.keys(input)) {
      if (!["action", "errorCode", "refused", "desktopEffect"].includes(key)) {
        problems.push(`unknown inputBeforeFreshCapture field ${key}`);
      }
    }
    if (typeof input.action !== "string" || input.action.trim() === "") problems.push("inputBeforeFreshCapture.action must be a non-empty string");
    else if (classifyActionForHold(input.action) !== "input") problems.push(`inputBeforeFreshCapture.action ${JSON.stringify(input.action)} is not an input action`);
    if (typeof input.errorCode !== "string") problems.push("inputBeforeFreshCapture.errorCode must be a string");
    if (typeof input.refused !== "boolean") problems.push("inputBeforeFreshCapture.refused must be a boolean");
    if (!["none", "landed", "unknown"].includes(input.desktopEffect)) {
      problems.push("inputBeforeFreshCapture.desktopEffect must be one of none|landed|unknown");
    }
  }
  if (typeof evidence.freshCaptureClearedGate !== "boolean") problems.push("freshCaptureClearedGate must be a boolean");
  if (evidence.note !== undefined && typeof evidence.note !== "string") problems.push("note must be a string");
  return problems;
}

/** Merge the Operator's H4/H5 record into a pending block. The result is computed, not declared. */
export function mergeInputEvidence(pending, evidence) {
  const problems = validateInputEvidence(evidence);
  if (problems.length > 0) return { block: null, k7: false, problems };
  if (!pending || typeof pending !== "object") return { block: null, k7: false, problems: ["pending block must be an object"] };
  if (pending.result !== "not-attempted") {
    return { block: null, k7: false, problems: [`pending result is ${JSON.stringify(pending.result)}; only a not-attempted block can be completed`] };
  }
  const candidate = {
    ...pending,
    inputBeforeFreshCapture: { ...evidence.inputBeforeFreshCapture },
    freshCaptureClearedGate: evidence.freshCaptureClearedGate,
    result: "pass",
    note: [pending.note, evidence.note].filter(Boolean).join(" | "),
  };
  const k7 = computeK7(candidate);
  candidate.result = k7 ? "pass" : "fail";
  return { block: candidate, k7, problems: [] };
}

// ---------------------------------------------------------------------------
// Write path. Screening happens on the exact serialized text that would reach disk.
// ---------------------------------------------------------------------------

export function prepareWrite(value, secrets = []) {
  const raw = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const text = `${redact(raw, secrets).trimEnd()}\n`;
  const screen = screenEvidence(text);
  return { safe: screen.safe, findings: screen.findings, text };
}

function writeEvidence(path, value, secrets = []) {
  const prepared = prepareWrite(value, secrets);
  if (!prepared.safe) {
    const detail = prepared.findings.map((finding) => finding.name).join(", ");
    throw new Error(`refusing to write evidence containing ${detail}`);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, prepared.text, "utf8");
  return prepared;
}

function evidencePathGuard(path) {
  const target = resolve(path);
  const rel = relative(EVIDENCE_ROOT, target);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`evidence must be written under ${EVIDENCE_ROOT}`);
  }
  if (!target.endsWith(".json")) throw new Error("evidence path must end in .json");
  return target;
}

// ---------------------------------------------------------------------------
// Gateway calls. This is the only code in the runner that crosses the boundary.
// ---------------------------------------------------------------------------

export function buildGatewayCallArgs(params) {
  return [
    "gateway", "call", METHOD,
    "--params", JSON.stringify(params).replace(/"/gu, '\\"'),
    "--json",
  ];
}

function sleepSync(ms) {
  const shared = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(shared), 0, 0, ms);
}

function runGatewayCall({ openclaw, stateDir, config, cwd, params, timeoutMs = 60_000 }) {
  const exe = /\s/u.test(openclaw) ? `"${openclaw}"` : openclaw;
  const result = spawnSync(exe, buildGatewayCallArgs(params), {
    shell: true,
    encoding: "utf8",
    timeout: timeoutMs,
    windowsHide: true,
    cwd,
    env: {
      ...process.env,
      OPENCLAW_STATE_DIR: stateDir,
      OPENCLAW_CONFIG_PATH: config,
    },
  });
  if (result.error) throw new Error(`gateway call failed to start: ${result.error.message}`);
  if (result.status !== 0) {
    const stderr = String(result.stderr ?? "").trim().slice(0, 400);
    throw new Error(`gateway call ${params.action} exited ${result.status}${stderr ? `: ${stderr}` : ""}`);
  }
  const text = String(result.stdout ?? "").trim();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`gateway call ${params.action} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

// ---------------------------------------------------------------------------
// CLI.
// ---------------------------------------------------------------------------

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function requireFile(path, label) {
  if (!path) throw new Error(`${label} is required`);
  if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`${label} not found: ${path}`);
  return resolve(path);
}

function defaultOutPath(runId) {
  return join(EVIDENCE_ROOT, runId, "holdRecovery.pending.json");
}

function utcStamp() {
  return new Date().toISOString().replace(/[:.]/gu, "-").replace(/Z$/u, "Z");
}

export function formatPlan(plan) {
  const lines = [];
  const r = plan.readiness;
  lines.push("k7 run plan — G-G item 15 connection-death hold recovery");
  lines.push("mode: PLAN ONLY — no network, no child process, no Gateway call, no desktop input, no write");
  lines.push("");
  lines.push(`designation marker: ${plan.designation.path}`);
  lines.push(`  present: ${plan.designation.present ? "yes" : "NO"}`);
  lines.push(`  valid:   ${plan.designation.valid ? "yes" : "NO"}`);
  for (const problem of plan.designation.problems) lines.push(`    - ${problem}`);
  lines.push('  owner must record: designated:true, designatedBy:"owner", ticket:"CU-01", o1Resolved:true,');
  lines.push('                     holdRecoveryApproved:true, environmentLabel:"<role label>", recordedAtUtc:"<ISO-8601 Z>"');
  lines.push("");
  if (plan.preflight) {
    lines.push(`preflight: ${plan.preflight.path ?? "(supplied)"} captured ${plan.preflight.capturedAtUtc ?? "unknown"}; verdict ${plan.preflight.verdict ?? "unknown"}`);
  } else {
    lines.push("preflight: not supplied (pass --preflight <preflight.json>)");
  }
  lines.push(`live phase H1-H3: ${r.liveReady ? "READY" : "BLOCKED"}`);
  lines.push(`full k7 H1-H5:    ${r.k7Achievable ? "READY" : "BLOCKED"}`);
  for (const blocker of r.blockers) lines.push(`  blocker: ${blocker}`);
  for (const blocker of r.k7Blockers) lines.push(`  k7 blocker: ${blocker}`);
  for (const risk of r.risks) lines.push(`  risk: ${risk}`);
  for (const item of r.pending) lines.push(`  pending: ${item}`);
  lines.push("");
  lines.push("phases:");
  for (const phase of plan.phases) {
    lines.push(`  ${phase.id} [${phase.phase}, ${phase.via}] ${phase.action}${phase.mutatesHold ? " (mutates hold)" : ""} — ${phase.what}`);
  }
  lines.push("");
  lines.push("honest limits:");
  for (const guarantee of plan.guarantees) lines.push(`  - ${guarantee}`);
  lines.push("");
  lines.push("when the owner records designation:");
  lines.push(`  ${plan.liveInvocation}`);
  lines.push(`  ${plan.mergeInvocation}`);
  return lines.join("\n");
}

function parseArgs(argv) {
  const opts = {
    mode: "plan",
    marker: DEFAULT_MARKER,
    preflight: null,
    out: null,
    json: false,
    openclaw: null,
    stateDir: null,
    config: null,
    cwd: process.cwd(),
    merge: null,
    inputEvidence: null,
    validate: null,
    methodAdvertised: null,
    nodeCommands: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} needs a value`);
      return argv[i];
    };
    switch (arg) {
      case "--plan": opts.mode = "plan"; break;
      case "--live": opts.mode = "live"; break;
      case "--json": opts.json = true; break;
      case "--help": case "-h": opts.mode = "help"; break;
      case "--marker": opts.marker = resolve(next()); break;
      case "--preflight": opts.preflight = resolve(next()); break;
      case "--out": opts.out = resolve(next()); break;
      case "--openclaw": opts.openclaw = next(); break;
      case "--state-dir": opts.stateDir = next(); break;
      case "--config": opts.config = next(); break;
      case "--cwd": opts.cwd = resolve(next()); break;
      case "--merge": opts.mode = "merge"; opts.merge = resolve(next()); break;
      case "--input-evidence": opts.inputEvidence = resolve(next()); break;
      case "--validate": opts.mode = "validate"; opts.validate = resolve(next()); break;
      case "--method-advertised": opts.methodAdvertised = true; break;
      case "--node-commands": opts.nodeCommands = next().split(",").map((s) => s.trim()).filter(Boolean); break;
      default: throw new Error(`unknown argument ${arg}`);
    }
  }
  return opts;
}

function helpText() {
  return [
    "k7-run.mjs — gated connection-death hold-recovery evidence (G-G item 15)",
    "",
    "  --plan                       print the plan; no network, no child process, no write (default)",
    "  --preflight <json>           include a preflight.ps1 snapshot in the plan",
    "  --json                       print the plan as JSON",
    "  --live                       H1-H3 only; requires the owner designation marker",
    "  --openclaw <cmd>             local openclaw.cmd shim (live)",
    "  --state-dir <dir>            OPENCLAW_STATE_DIR for the call (live)",
    "  --config <file>              OPENCLAW_CONFIG_PATH for the call (live)",
    "  --out <file>                 evidence path under reports/computer/spikes/",
    "  --merge <pending> --input-evidence <json>   merge H4/H5 and compute k7",
    "  --validate <json>            validate a complete holdRecovery block",
    "",
    "The runner never sends desktop input and never creates the designation marker.",
  ].join("\n");
}

function secretsFromEnvironment() {
  return [process.env.USERNAME, process.env.USERPROFILE, process.env.HOME]
    .filter((value) => typeof value === "string" && value.length >= 3);
}

function runPlan(opts) {
  const designation = checkDesignation(opts.marker);
  const preflight = opts.preflight ? readJson(requireFile(opts.preflight, "--preflight")) : null;
  const plan = buildPlan({
    markerPath: opts.marker,
    markerPresent: designation.present,
    marker: designation.marker,
    markerProblems: designation.problems,
    preflightPath: opts.preflight,
    preflight,
    methodAdvertised: opts.methodAdvertised,
    nodeCommands: opts.nodeCommands,
  });
  const rendered = opts.json ? JSON.stringify(plan, null, 2) : formatPlan(plan);
  console.log(redact(rendered, secretsFromEnvironment()));
  return 0;
}

function runLive(opts) {
  const designation = checkDesignation(opts.marker);
  if (!designation.ok) {
    console.error(`REFUSED: designation marker is not acceptable:\n - ${designation.problems.join("\n - ")}`);
    return 2;
  }
  const preflightPath = requireFile(opts.preflight, "--preflight");
  const openclaw = requireFile(opts.openclaw, "--openclaw");
  if (!opts.stateDir) throw new Error("--state-dir is required in live mode");
  if (!opts.config) throw new Error("--config is required in live mode");
  const stateDir = resolve(opts.stateDir);
  const config = requireFile(opts.config, "--config");
  if (!existsSync(stateDir) || !statSync(stateDir).isDirectory()) throw new Error(`--state-dir not found: ${stateDir}`);

  const preflight = readJson(preflightPath);
  const readiness = evaluateK7Readiness({ marker: designation.marker, preflight });
  if (!readiness.liveReady) {
    console.error(`REFUSED: live prerequisites are not met:\n - ${readiness.blockers.join("\n - ")}`);
    return 2;
  }
  if (!readiness.k7Achievable) {
    console.error(`REFUSED: this environment cannot complete H4/H5, so taking the hold would mutate state for nothing:\n - ${readiness.k7Blockers.join("\n - ")}`);
    return 2;
  }

  const runId = process.env.ZERO_K7_RUN_ID || `k7-${utcStamp()}`;
  const out = evidencePathGuard(opts.out ?? defaultOutPath(runId));
  const gateway = { openclaw, stateDir, config, cwd: opts.cwd };

  let before;
  try {
    before = runGatewayCall({ ...gateway, params: { action: "status" } });
  } catch (error) {
    console.error(`REFUSED: cannot read status before taking the hold: ${error.message}`);
    return 2;
  }
  if (before.held !== false) {
    const refused = makeRefusedBlock(`status reports held=${JSON.stringify(before.held)}; refusing to touch an existing hold`);
    validateOrThrow(refused, "refused block");
    writeEvidence(out, refused, secretsFromEnvironment());
    console.error(`REFUSED: an existing hold is present; wrote ${out}. k7 is NOT claimed.`);
    return 2;
  }
  if (counterOf(before) === null) {
    const refused = makeRefusedBlock("status has no stats.releasedByDisconnect; the release cannot be attributed");
    validateOrThrow(refused, "refused block");
    writeEvidence(out, refused, secretsFromEnvironment());
    console.error(`REFUSED: the disconnect counter is missing; wrote ${out}. k7 is NOT claimed.`);
    return 2;
  }
  if (before.resumeSnapshotRequired !== false) {
    const refused = makeRefusedBlock("status reports resumeSnapshotRequired=true; capture a fresh frame first so the post-disconnect gate is attributable");
    validateOrThrow(refused, "refused block");
    writeEvidence(out, refused, secretsFromEnvironment());
    console.error(`REFUSED: the fresh-capture gate was already armed before the take; wrote ${out}. k7 is NOT claimed.`);
    return 2;
  }

  let take = null;
  let takeError = null;
  try {
    take = runGatewayCall({ ...gateway, params: { action: "take" } });
  } catch (error) {
    takeError = error.message;
  }

  let after = null;
  let afterError = null;
  const beforeCounter = counterOf(before);
  const took = Boolean(take && take.held === true && take.owned === true);
  // Always read status after the take attempt: a failed take or a lost reply must not leave an
  // unobserved hold behind. A successful take gets time for the host to abort the closed socket.
  for (let attempt = 0; attempt < (took ? 8 : 2); attempt += 1) {
    sleepSync(250);
    try {
      after = runGatewayCall({ ...gateway, params: { action: "status" } });
      afterError = null;
    } catch (error) {
      after = null;
      afterError = error.message;
      continue;
    }
    if (took) {
      if (after.held === false && beforeCounter !== null && counterOf(after) === beforeCounter + 1) break;
    } else if (after.held === false) {
      break;
    }
  }
  if (!took && after?.held === true) {
    console.error("WARNING: status still reports held:true after a failed take; inspect the hold before any agent input.");
  }
  if (took && after?.held === true) {
    console.error("WARNING: the hold survived the owner process close; inspect status/release before any agent input.");
  }

  const { block, problems } = makePendingBlock({
    before,
    take,
    after,
    note: [
      takeError ? `take error: ${takeError}` : null,
      afterError ? `status error: ${afterError}` : null,
    ].filter(Boolean).join("; ") || null,
  });
  validateOrThrow(block, "holdRecovery block");
  writeEvidence(out, block, secretsFromEnvironment());

  if (problems.length > 0) {
    console.error(`H1-H3 did NOT pass; wrote ${out}. k7 is NOT claimed.`);
    for (const problem of problems) console.error(` - ${problem}`);
    return 1;
  }
  console.log(`H1-H3 passed; wrote ${out} with result="not-attempted".`);
  console.log("Next: run H4/H5 from the Operator/Control UI, then merge:");
  console.log(`  node computer/spike/k7-run.mjs --merge ${out} --input-evidence <h4h5.json>`);
  console.log("k7 is NOT claimed until the merge produces a valid pass.");
  return 0;
}

function validateOrThrow(block, label) {
  const problems = validateHoldRecovery(block, loadSchema());
  if (problems.length > 0) {
    throw new Error(`${label} does not match result.schema.json:\n - ${problems.join("\n - ")}`);
  }
}

function runMerge(opts) {
  const pendingPath = requireFile(opts.merge, "--merge");
  const evidencePath = requireFile(opts.inputEvidence, "--input-evidence");
  const pending = readJson(pendingPath);
  const evidence = readJson(evidencePath);
  const pendingProblems = validateHoldRecovery(pending, loadSchema());
  if (pendingProblems.length > 0) {
    console.error(`REFUSED: pending block is invalid:\n - ${pendingProblems.join("\n - ")}`);
    return 1;
  }
  const merged = mergeInputEvidence(pending, evidence);
  if (merged.problems.length > 0) {
    console.error(`REFUSED: input evidence is not usable:\n - ${merged.problems.join("\n - ")}`);
    return 1;
  }
  validateOrThrow(merged.block, "merged block");
  const out = evidencePathGuard(opts.out ?? pendingPath.replace(/\.pending\.json$/u, ".json"));
  if (out === resolve(pendingPath)) throw new Error("--out must differ from the pending block");
  writeEvidence(out, merged.block, secretsFromEnvironment());
  if (merged.k7) {
    console.log(`k7 PASS — wrote ${out}.`);
    return 0;
  }
  console.error(`k7 FAIL — wrote ${out}. The evidence does not support the connection-death claim.`);
  return 2;
}

function runValidate(opts) {
  const path = requireFile(opts.validate, "--validate");
  const parsed = readJson(path);
  const block = parsed.holdRecovery ?? parsed;
  const problems = validateHoldRecovery(block, loadSchema());
  if (problems.length > 0) {
    console.error(`INVALID:\n - ${problems.join("\n - ")}`);
    return 1;
  }
  const k7 = computeK7(block);
  console.log(k7 ? "k7 PASS — block is valid and supports the connection-death claim." : "k7 FAIL — block is valid but does not support the claim.");
  return 0;
}

function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    console.error(helpText());
    return 1;
  }
  try {
    switch (opts.mode) {
      case "help": console.log(helpText()); return 0;
      case "plan": return runPlan(opts);
      case "live": return runLive(opts);
      case "merge": return runMerge(opts);
      case "validate": return runValidate(opts);
      default: throw new Error(`unknown mode ${opts.mode}`);
    }
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return 1;
  }
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  process.exitCode = main(process.argv.slice(2));
}
