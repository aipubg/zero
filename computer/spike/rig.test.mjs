/**
 * CU-01 rig selftest — offline, dependency-free, synthetic data only.
 *
 * Purpose: prove the pure logic in rig.mjs behaves as claimed BEFORE a gated window is spent.
 * Nothing here touches a machine: no network, no child process, no driver, no desktop.
 * Run: node computer/spike/rig.test.mjs
 */
import {
  EXPECTED, EXPECTED_DIGESTS, OBSERVE_ACTIONS, MUST_BE_REFUSED_IN_ZERO_MVP,
  sha256, makeSentinel, evaluateGates, evaluateEnablementGate, doctorPassed, loadSchema, validateStep,
  validateHoldRecovery, makeStep, computeVerdict, computeK7, screenEvidence, redact, classifyActionForHold,
} from "./rig.mjs";
import {
  validateDesignationMarker, normalizePreflight, evaluateK7Readiness, planSteps, buildPlan,
  makeRefusedBlock, makePendingBlock, validateInputEvidence, mergeInputEvidence,
  buildGatewayCallArgs, prepareWrite,
} from "./k7-run.mjs";

let pass = 0;
let fail = 0;
const failures = [];

function check(label, condition, detail = "") {
  if (condition === true) { pass += 1; return; }
  fail += 1;
  failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
}

const basePreflight = {
  cpuNativeTarget: "win32-x64-msvc",
  displays: [{ deviceName: "\\\\.\\DISPLAY1", primary: true, bounds: "1920x1080" }],
  scalingPercent: 100,
  rfbLoopbackPresent: true,
  sessionKind: "console",
};

// --- sentinels ----------------------------------------------------------------
{
  const s = makeSentinel("2026-10-23-a");
  check("sentinel is synthetic and run-scoped", s === "ZERO-CU01-2026-10-23-a-SENTINEL");
  let threw = false;
  try { makeSentinel(""); } catch { threw = true; }
  check("sentinel rejects an empty runId", threw);
}

// --- hashing (used to verify the installed driver digests) ---------------------
check("sha256 matches a known vector", sha256(Buffer.from("abc")) === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
check("release digest constants are 64 hex chars",
  Object.values(EXPECTED_DIGESTS).every((h) => /^[0-9a-f]{64}$/u.test(h)));
check("expected driver version is the RELEASE pin (0.32.0), not the checkout's 0.34.1", EXPECTED.driverVersion === "0.32.0");

// --- gates ---------------------------------------------------------------------
{
  const ok = evaluateGates(basePreflight);
  check("clean preflight does not abort", ok.abort === false, JSON.stringify(ok));

  const arm = evaluateGates({ ...basePreflight, cpuNativeTarget: "win32-arm64-msvc" });
  check("win32-arm64 is accepted", arm.abort === false);

  const bad = evaluateGates({ ...basePreflight, cpuNativeTarget: "linux-x64-gnu" });
  check("unsupported arch aborts", bad.abort === true && bad.reasons.some((r) => /PLATFORM_UNSUPPORTED/u.test(r)));

  const nodisplay = evaluateGates({ ...basePreflight, displays: [] });
  check("zero displays aborts", nodisplay.abort === true);

  const multi = evaluateGates({ ...basePreflight, displays: [{ primary: true }, { primary: false }] });
  check("multi-display is a recorded RISK not an abort",
    multi.abort === false && multi.risks.some((r) => /multi-display/u.test(r)),
    JSON.stringify(multi.risks));

  const dpi = evaluateGates({ ...basePreflight, scalingPercent: 125 });
  check("scaling 125% records the DPI risk", dpi.risks.some((r) => /scaling 125%/u.test(r)));

  const noVnc = evaluateGates({ ...basePreflight, rfbLoopbackPresent: false });
  check("missing RFB listener records the S8 risk", noVnc.risks.some((r) => /RFB/u.test(r)));

  const locked = evaluateGates({ ...basePreflight, sessionKind: "lock-screen" });
  check("non-console session records a risk", locked.risks.some((r) => /interactive-session/u.test(r)));

  check("malformed preflight aborts safely", evaluateGates(null).abort === true);
  check("missing payload type is rejected", evaluateGates("nope").abort === true);
}

// --- enablement gate (DeepSeek's 06:24 release-bundle finding, now machine-checkable) ---------
{
  const all = ["computer.act", "screen.snapshot", "desktop.stream", "system.notify"];
  const ready = evaluateEnablementGate({ pluginEnabled: true, doctorCheckFound: true, nodeCommands: all });
  check("enablement gate: everything present is ready", ready.ready === true && ready.problems.length === 0);

  const notEnabled = evaluateEnablementGate({ pluginEnabled: false, doctorCheckFound: false, nodeCommands: [] });
  check("not-enabled is reported as an enablement problem, not a driver problem",
    notEnabled.problems.some((p) => /will not register on Windows/u.test(p)));
  check("missing doctor check is classified as enablement failure",
    notEnabled.problems.some((p) => /enablement failure, not a missing artifact/u.test(p)));

  const truthy = evaluateEnablementGate({ pluginEnabled: "true", doctorCheckFound: true, nodeCommands: all });
  check("string 'true' is NOT accepted (must be exactly true)", truthy.ready === false);
  check("undefined enabled is rejected", evaluateEnablementGate({ doctorCheckFound: true, nodeCommands: all }).ready === false);

  const silent = evaluateEnablementGate({ pluginEnabled: true, doctorCheckFound: true, nodeCommands: ["system.notify"] });
  check("enabled + check present but no computer.act is caught as the silent case",
    silent.ready === false && silent.problems.some((p) => /non-interactive session|unapproved pairing/u.test(p)));
  check("missing advertised commands are enumerated", silent.missing.join(",") === "computer.act,screen.snapshot,desktop.stream");
  check("nodeCommands omitted defaults safely rather than throwing",
    evaluateEnablementGate({ pluginEnabled: true, doctorCheckFound: true }).missing.length === 3);
}

// --- doctor parsing ------------------------------------------------------------
check("doctor 'no findings' passes", doctorPassed("cua-computer/driver-artifacts: no findings") === true);
const mismatch = doctorPassed("error COMPUTER_DRIVER_DIGEST_MISMATCH: dll mismatch");
check("doctor digest mismatch is caught as a code",
  mismatch && mismatch.passed === false && mismatch.code === "COMPUTER_DRIVER_DIGEST_MISMATCH", JSON.stringify(mismatch));
const both = doctorPassed("no findings (COMPUTER_DRIVER_PACKAGE_MISSING)");
check("a 'no findings' line carrying an error code is NOT a pass", both && both.passed === false, JSON.stringify(both));
const junk = doctorPassed("plugin loaded");
check("unparsable doctor output is flagged, never silently passed", junk && junk.code === "UNPARSED_DOCTOR_OUTPUT");

// --- schema loading + validation ----------------------------------------------
const schema = loadSchema();
check("schema loads and pins the openclaw commit", typeof schema.description === "string" && schema.description.includes("013240515205573248c27ab6b8eec7303f0da1a8"));

const goodStep = makeStep({
  id: "S6", verb: "verify", action: null, command: "computer.act",
  intent: "read saved fixture back from disk",
  result: "pass",
  hostSideVerification: {
    command: "file.fetch", approved: true,
    sha256: sha256(Buffer.from("x")), byteLength: 1,
    sentinelMatched: true,
  },
  evidenceFiles: ["s6.txt"],
});
const problems = validateStep(goodStep, schema);
check("a well-formed step validates clean", problems.length === 0, problems.join(" | "));

const badVerb = { ...goodStep, verb: "magically-proved" };
check("schema rejects an out-of-enum verb", validateStep(badVerb, schema).length > 0);

const extraField = { ...goodStep, surprise: 1 };
check("schema rejects unknown fields (closed object)", validateStep(extraField, schema).some((p) => /unknown field surprise/u.test(p)));

const missingIntent = { ...goodStep }; delete missingIntent.intent;
check("schema enforces required fields", validateStep(missingIntent, schema).some((p) => /required field intent/u.test(p)));

const badId = { ...goodStep, id: "S12" };
check("schema rejects a step id outside S1..S11", validateStep(badId, schema).length > 0);

const badFrame = { ...goodStep, frame: { displayFrameId: 42 } };
check("schema type-checks nested frame fields", validateStep(badFrame, schema).some((p) => /frame\.displayFrameId/u.test(p)));

const nullFrame = { ...goodStep, frame: { displayFrameId: null, width: null, capturedAtUtc: null } };
check("schema accepts explicit nulls (absent-by-design, not omitted)", validateStep(nullFrame, schema).length === 0, validateStep(nullFrame, schema).join(" | "));

let ctorThrew = false;
try { makeStep({ id: "S99", verb: "act", intent: "x" }); } catch { ctorThrew = true; }
check("makeStep refuses an out-of-range id", ctorThrew);
let ctorThrew2 = false;
try { makeStep({ id: "S1", verb: "act" }); } catch { ctorThrew2 = true; }
check("makeStep requires an intent", ctorThrew2);

// --- verdict computation (the anti-false-claim core) ---------------------------
const steps = [
  makeStep({ id: "S1", verb: "observe", action: "screenshot", command: "screen.snapshot", intent: "baseline capture", result: "pass" }),
  makeStep({ id: "S5", verb: "observe", action: null, intent: "descriptor matches 36 advertised", result: "pass" }),
  makeStep({ id: "S6", verb: "verify", intent: "host-side readback", result: "pass",
    hostSideVerification: { command: "file.fetch", approved: true, sha256: sha256(Buffer.from("s")), byteLength: 1, sentinelMatched: true } }),
  makeStep({ id: "S8", verb: "live-view", intent: "human watched relay", result: "pass" }),
  makeStep({ id: "S9", verb: "stop", intent: "deny hot-applies", result: "pass" }),
  makeStep({ id: "S10", verb: "recovery", intent: "refs revoked, not replayed", result: "pass" }),
  makeStep({ id: "S11", verb: "takeover", action: "take_control", intent: "upstream arbitration", result: "refused-as-expected",
    errorCode: "take_control is only available for an attached or session desktop" }),
];
const v = computeVerdict(steps, { dpiOutcome: "100-percent-ok", sessionOutcome: "console-ok" });
check("verdict K1..K6 computed from steps", v.k1 && v.k2 && v.k3 && v.k4 && v.k6);
check("K5 is FALSE while takeover is only refused-as-expected (no fake pass)", v.k5 === false && v.k5ExpectedFailure === true);
check("takeover gap is recorded as confirmed", v.takeoverGapConfirmed === true);
check("notClaimed always lists the standing non-claims",
  v.notClaimed.includes("production readiness") && v.notClaimed.some((x) => /multi-display/u.test(x)));
check("notClaimed flags the unprobed vision path when not verified",
  v.notClaimed.some((x) => /vision model verified/iu.test(x)));
check("notClaimed goes quiet on vision once explicitly verified",
  computeVerdict(steps, { visionPathVerified: true }).notClaimed.every((x) => !/vision model verified/iu.test(x)));

const noHost = steps.map((s) => (s.id === "S6"
  ? makeStep({ id: "S6", verb: "verify", intent: "screenshot only", result: "pass" })
  : s));
const v2 = computeVerdict(noHost, {});
check("K2 CANNOT pass on a screenshot alone — the central honesty rule", v2.k2 === false);
check("and the missing readback is loudly disclaimed", v2.notClaimed.some((x) => /WITHOUT THIS NO TASK COMPLETION/iu.test(x)));

const fakeHash = steps.map((s) => (s.id === "S6"
  ? makeStep({ id: "S6", verb: "verify", intent: "readback", result: "pass",
      hostSideVerification: { command: "file.fetch", sha256: "not-a-hash", byteLength: 1, sentinelMatched: true } })
  : s));
check("K2 rejects a malformed digest", computeVerdict(fakeHash, {}).k2 === false);

const mismatched = steps.map((s) => (s.id === "S6"
  ? makeStep({ id: "S6", verb: "verify", intent: "readback", result: "pass",
      hostSideVerification: { command: "file.fetch", sha256: sha256(Buffer.from("y")), byteLength: 1, sentinelMatched: false } })
  : s));
check("K2 rejects a readback whose content is not the sentinel", computeVerdict(mismatched, {}).k2 === false);

const notTried = steps.filter((s) => s.id !== "S11");
check("an untested takeover is disclaimed as untested",
  computeVerdict([...notTried, makeStep({ id: "S11", verb: "takeover", intent: "skipped", result: "not-attempted" })], {})
    .notClaimed.some((x) => /takeover behaviour, tested or untested/u.test(x)));

// --- connection-death hold recovery (G-G item 15 / CU-02) ---------------------
const goodHoldRecovery = {
  attempted: true,
  ownerConnectionClosedWithoutPagehide: true,
  ownerConnectionPath: "control-ui",
  statusReadFromNewConnection: true,
  resumeSnapshotRequiredBefore: false,
  statusFromNewConnection: { held: false, owned: false, resumeSnapshotRequired: true },
  releasedByDisconnectBefore: 0,
  releasedByDisconnectAfter: 1,
  connectionClosedAuditRow: true,
  inputBeforeFreshCapture: { action: "left_click", errorCode: "computer-hold:stale-frame", refused: true, desktopEffect: "none" },
  freshCaptureClearedGate: true,
  result: "pass",
  note: "tab killed without pagehide; synthetic target only",
};
{
  check("schema exposes a holdRecovery block", Boolean(schema.properties.holdRecovery));
  check("a complete connection-death record validates clean",
    validateHoldRecovery(goodHoldRecovery, schema).length === 0, validateHoldRecovery(goodHoldRecovery, schema).join(" | "));

  const missingAudit = { ...goodHoldRecovery }; delete missingAudit.connectionClosedAuditRow;
  check("holdRecovery requires the audit-row field",
    validateHoldRecovery(missingAudit, schema).some((p) => /required field connectionClosedAuditRow/u.test(p)));

  const missingPath = { ...goodHoldRecovery }; delete missingPath.ownerConnectionPath;
  check("holdRecovery requires the owner-connection path",
    validateHoldRecovery(missingPath, schema).some((p) => /required field ownerConnectionPath/u.test(p)));

  const missingBeforeGate = { ...goodHoldRecovery }; delete missingBeforeGate.resumeSnapshotRequiredBefore;
  check("holdRecovery requires the pre-take gate state",
    validateHoldRecovery(missingBeforeGate, schema).some((p) => /required field resumeSnapshotRequiredBefore/u.test(p)));

  check("holdRecovery rejects an unknown owner-connection path",
    validateHoldRecovery({ ...goodHoldRecovery, ownerConnectionPath: "somewhere" }, schema).some((p) => /ownerConnectionPath/u.test(p)));

  check("holdRecovery is a closed object",
    validateHoldRecovery({ ...goodHoldRecovery, surprise: true }, schema).some((p) => /unknown field surprise/u.test(p)));

  check("holdRecovery rejects an unknown result value",
    validateHoldRecovery({ ...goodHoldRecovery, result: "mostly" }, schema).some((p) => /result/u.test(p)));

  check("holdRecovery type-checks nested status fields",
    validateHoldRecovery({ ...goodHoldRecovery, statusFromNewConnection: { held: "no", owned: false, resumeSnapshotRequired: true } }, schema)
      .some((p) => /statusFromNewConnection\.held/u.test(p)));

  const withoutEffect = { ...goodHoldRecovery, inputBeforeFreshCapture: { action: "left_click", errorCode: "computer-hold:stale-frame", refused: true } };
  check("holdRecovery requires the observed desktop effect",
    validateHoldRecovery(withoutEffect, schema).some((p) => /required field desktopEffect/u.test(p)));

  const withHold = (patch) => computeVerdict(steps, { holdRecovery: { ...goodHoldRecovery, ...patch } });
  check("k7 passes only on the complete no-pagehide path", withHold({}).k7 === true);
  check("k7 accepts a raw-ws owner path with disclosure", withHold({ ownerConnectionPath: "raw-ws" }).k7 === true);
  check("k7 accepts the CLI one-shot path with disclosure", withHold({ ownerConnectionPath: "cli" }).k7 === true);
  check("k7 rejects an undocumented owner path", withHold({ ownerConnectionPath: "somewhere" }).k7 === false);
  check("k7 stays false when the gate was already armed before the take",
    withHold({ resumeSnapshotRequiredBefore: true }).k7 === false);
  check("k7 stays false when pagehide ran (normal release is not this check)",
    withHold({ ownerConnectionClosedWithoutPagehide: false }).k7 === false);
  check("k7 stays false when status came from the dead/same connection",
    withHold({ statusReadFromNewConnection: false }).k7 === false);
  check("k7 stays false while the hold is still held",
    withHold({ statusFromNewConnection: { held: true, owned: false, resumeSnapshotRequired: true } }).k7 === false);
  check("k7 stays false when the connection still owns the lease",
    withHold({ statusFromNewConnection: { held: false, owned: true, resumeSnapshotRequired: true } }).k7 === false);
  check("k7 stays false when resumeSnapshotRequired was not armed",
    withHold({ statusFromNewConnection: { held: false, owned: false, resumeSnapshotRequired: false } }).k7 === false);
  check("k7 stays false when the disconnect counter did not advance",
    withHold({ releasedByDisconnectAfter: 0 }).k7 === false);
  check("k7 stays false when the counter advanced by more than the one attributable release",
    withHold({ releasedByDisconnectAfter: 2 }).k7 === false);
  check("k7 stays false without a connection-closed audit row",
    withHold({ connectionClosedAuditRow: false }).k7 === false);
  check("k7 stays false when agent input was not refused",
    withHold({ inputBeforeFreshCapture: { action: "left_click", errorCode: null, refused: false, desktopEffect: "unknown" } }).k7 === false);
  check("k7 rejects a hold refusal masquerading as the stale-frame gate",
    withHold({ inputBeforeFreshCapture: { action: "left_click", errorCode: "computer-hold:human-control", refused: true, desktopEffect: "none" } }).k7 === false);
  check("k7 stays false when the refused input still landed",
    withHold({ inputBeforeFreshCapture: { action: "left_click", errorCode: "computer-hold:stale-frame", refused: true, desktopEffect: "landed" } }).k7 === false);
  check("k7 stays false when a fresh capture did not clear the gate",
    withHold({ freshCaptureClearedGate: false }).k7 === false);

  const notAttempted = computeVerdict(steps, { holdRecovery: { ...goodHoldRecovery, result: "not-attempted" } });
  check("an unproven connection-death path is disclaimed explicitly",
    notAttempted.k7 === false && notAttempted.notClaimed.some((x) => /connection-death hold recovery/iu.test(x)));
  check("the disclaimer disappears only when k7 is actually proven",
    withHold({}).notClaimed.every((x) => !/connection-death hold recovery/iu.test(x)));
}

// --- evidence screening --------------------------------------------------------
{
  const clean = JSON.stringify({ run: { runId: "r1" }, note: "sentinel ZERO-CU01-r1-SENTINEL written to scratch file" });
  check("clean synthetic evidence passes the screen", screenEvidence(clean).safe === true, JSON.stringify(screenEvidence(clean)));

  const withKey = `auth: nvapi-${"A".repeat(24)} done`;
  check("an nvapi-style key is caught before writing", screenEvidence(withKey).findings.some((f) => f.name === "api-key-shaped-secret"));
  check("a bearer token is caught", screenEvidence("Authorization: Bearer " + "z".repeat(30)).findings.some((f) => /bearer/iu.test(f.name)));
  check("a private key block is caught", screenEvidence("-----BEGIN OPENSSH PRIVATE KEY-----").safe === false);
  check("an AWS-style key is caught", screenEvidence("AKIAABCDEFGHIJKL1234").safe === false);
  check("a user profile path is caught", screenEvidence("saved to C:\\Users\\Someone\\Desktop\\note.txt").safe === false);
  check("a UNC home path is caught", screenEvidence("\\\\host\\Users\\someone\\f").safe === false);
  check("the live .zero-data location is caught", screenEvidence("E:\\zero\\backend\\.zero-data\\be01-probe.json").safe === false);
  check("redaction replaces a known account name", redact("user=prof_zero", ["prof_zero"]).includes("<redacted>"));
  check("redaction replaces profile paths even without a list", redact("C:\\Users\\ProfZero\\x").includes("Users\\<redacted>"));
  check("screening empty input is safe, not an error", screenEvidence("").safe === true);
}

// --- hold classification -------------------------------------------------------
check("observation set matches the taxonomy I published (10 names incl. wait)", OBSERVE_ACTIONS.length === 10 && OBSERVE_ACTIONS.includes("get_recording_state"));
for (const a of ["left_click", "type", "key", "scroll", "launch_app", "set_value", "browser_navigate", "start_recording"]) {
  check(`classifyActionForHold(${a}) = input`, classifyActionForHold(a) === "input");
}
for (const a of ["screenshot", "list_windows", "get_window_state", "zoom"]) {
  check(`classifyActionForHold(${a}) = observation`, classifyActionForHold(a) === "observation");
}
check("unknown/empty action is neither (forces fail-closed)", classifyActionForHold("") === "unknown" && classifyActionForHold(undefined) === "unknown");
check("D-011 blocked names are asserted from the rig", MUST_BE_REFUSED_IN_ZERO_MVP.includes("escalate_scope"));
check("escalate_scope is otherwise an input per upstream taxonomy", classifyActionForHold("escalate_scope") === "input");
check("provider expectations recorded from the release, not assumed", EXPECTED.multiDisplay === false && EXPECTED.advertisedWin32Count === 36 && EXPECTED.contractVersion === 2);

// --- designated-environment k7 runner ------------------------------------------
{
  const goodMarker = {
    designated: true,
    designatedBy: "owner",
    ticket: "CU-01",
    o1Resolved: true,
    holdRecoveryApproved: true,
    environmentLabel: "designated-zero-vm",
    recordedAtUtc: "2026-10-23T09:00:00Z",
  };
  const rawPreflight = {
    capturedAtUtc: "2026-10-23T09:00:00Z",
    cpuTarget: "win32-x64-msvc",
    displays: [{ deviceName: "\\\\.\\DISPLAY1", primary: true, bounds: "1920x1080" }],
    scaling: { effectivePct: 100 },
    rfbLoopback: { loopbackRfbListenersFound: 1 },
    session: { consoleSession: true, rdpSession: false },
    verdict: "READY for the CU-01 sequence",
  };
  const statusBefore = { held: false, owned: false, resumeSnapshotRequired: false, stats: { releasedByDisconnect: 3 }, recent: [] };
  const takeOk = { held: true, owned: true, controlLeaseId: "lease-fixture", scope: "global" };
  const statusAfter = {
    held: false, owned: false, resumeSnapshotRequired: true,
    stats: { releasedByDisconnect: 4 },
    recent: [{ kind: "lease", action: "release", reason: "connection-closed", decision: "allow" }],
  };
  const goodInput = {
    inputBeforeFreshCapture: { action: "left_click", errorCode: "computer-hold:stale-frame", refused: true, desktopEffect: "none" },
    freshCaptureClearedGate: true,
    note: "synthetic fixture",
  };

  check("owner marker with every required field is accepted", validateDesignationMarker(goodMarker).length === 0,
    JSON.stringify(validateDesignationMarker(goodMarker)));
  check("an agent cannot self-designate", validateDesignationMarker({ ...goodMarker, designatedBy: "qoder" }).some((p) => /owner/u.test(p)));
  check("designated must be exactly true", validateDesignationMarker({ ...goodMarker, designated: "yes" }).length > 0);
  check("O1 must be recorded resolved", validateDesignationMarker({ ...goodMarker, o1Resolved: false }).some((p) => /o1Resolved/u.test(p)));
  check("the hold check needs explicit owner approval", validateDesignationMarker({ ...goodMarker, holdRecoveryApproved: false }).some((p) => /holdRecoveryApproved/u.test(p)));
  check("a role label is required instead of an account name", validateDesignationMarker({ ...goodMarker, environmentLabel: "  " }).some((p) => /environmentLabel/u.test(p)));
  check("a non-UTC timestamp is refused", validateDesignationMarker({ ...goodMarker, recordedAtUtc: "2026-10-23 09:00" }).some((p) => /recordedAtUtc/u.test(p)));
  check("a null marker is refused, not defaulted", validateDesignationMarker(null).length > 0);

  const normalized = normalizePreflight(rawPreflight);
  check("preflight.ps1 output maps to the gate shape", normalized.cpuNativeTarget === "win32-x64-msvc"
    && normalized.displays.length === 1 && normalized.scalingPercent === 100
    && normalized.rfbLoopbackPresent === true && normalized.sessionKind === "console");
  const rdp = normalizePreflight({
    ...rawPreflight,
    session: { consoleSession: false, rdpSession: false, querySessionRaw: " rdp-tcp#0  test  1  Active\n console          0  Conn" },
  });
  check("an active RDP session is recognized from query session output", rdp.sessionKind === "rdp");
  check("malformed preflight normalizes to null", normalizePreflight("nope") === null);

  const ready = evaluateK7Readiness({ marker: goodMarker, preflight: rawPreflight, methodAdvertised: true, nodeCommands: ["computer.act"] });
  check("a fully specified designated environment is live-ready", ready.liveReady === true, JSON.stringify(ready.blockers));
  check("a fully specified designated environment can complete k7", ready.k7Achievable === true, JSON.stringify(ready.k7Blockers));
  check("a missing marker blocks the live phase", evaluateK7Readiness({ marker: null, preflight: rawPreflight }).liveReady === false);
  const dpi = evaluateK7Readiness({ marker: goodMarker, preflight: { ...rawPreflight, scaling: { effectivePct: 125 } } });
  check("125% scaling leaves H1-H3 possible but blocks H4/H5", dpi.liveReady === true && dpi.k7Achievable === false
    && dpi.k7Blockers.some((p) => /scaling 125%/u.test(p)));
  const noAct = evaluateK7Readiness({ marker: goodMarker, preflight: rawPreflight, nodeCommands: [] });
  check("a node without computer.act blocks the claim, not just the run", noAct.liveReady === false
    && noAct.blockers.some((p) => /computer\.act/u.test(p)));
  const noMethod = evaluateK7Readiness({ marker: goodMarker, preflight: rawPreflight, methodAdvertised: false });
  check("an unadvertised control method blocks the live phase", noMethod.liveReady === false
    && noMethod.blockers.some((p) => /zero\.computer\.control/u.test(p)));
  const offline = evaluateK7Readiness({ marker: goodMarker, preflight: rawPreflight });
  check("unverified method/node are pending, not silently passed or falsely blocked",
    offline.liveReady === true && offline.pending.length === 2);

  const steps = planSteps();
  check("the plan contains H1-H6", steps.length === 6 && steps.map((s) => s.id).join(",") === "H1,H2,H3,H4,H5,H6");
  check("only H2 mutates the hold", steps.filter((s) => s.mutatesHold).map((s) => s.id).join(",") === "H2");
  check("H4/H5 are marked external, so the runner cannot pretend to automate them",
    steps.filter((s) => ["H4", "H5"].includes(s.id)).every((s) => s.phase === "external" && /operator/iu.test(s.via)));
  const plan = buildPlan({ markerPath: "fixture-marker.json", markerPresent: true, marker: goodMarker, preflightPath: "fixture-preflight.json", preflight: rawPreflight, methodAdvertised: true, nodeCommands: ["computer.act"] });
  check("plan mode executes nothing and writes nothing", plan.mode === "plan" && plan.executesAnything === false);
  check("the plan states the no-desktop-input and no-self-designation guarantees",
    plan.guarantees.some((g) => /no desktop input/iu.test(g)) && plan.guarantees.some((g) => /never creates the designation marker/iu.test(g)));

  const refused = makeRefusedBlock("existing hold");
  check("a refused run is schema-valid and cannot claim k7", validateHoldRecovery(refused).length === 0 && computeK7(refused) === false);
  const pending = makePendingBlock({ before: statusBefore, take: takeOk, after: statusAfter });
  check("H1-H3 pass produces a schema-valid pending block", pending.problems.length === 0 && validateHoldRecovery(pending.block).length === 0,
    JSON.stringify(pending.problems.concat(validateHoldRecovery(pending.block))));
  check("the pending block records the CLI path and does not claim k7 yet",
    pending.block.ownerConnectionPath === "cli" && pending.block.result === "not-attempted" && computeK7(pending.block) === false);
  check("the pending block leaves H4/H5 explicitly empty", pending.block.inputBeforeFreshCapture.refused === null
    && pending.block.freshCaptureClearedGate === null);
  const badCounter = makePendingBlock({ before: statusBefore, take: takeOk, after: { ...statusAfter, stats: { releasedByDisconnect: 5 } } });
  check("a counter that moved by more than one fails the live phase", badCounter.block.result === "fail"
    && badCounter.problems.some((p) => /expected \+1/u.test(p)));
  const noAudit = makePendingBlock({ before: statusBefore, take: takeOk, after: { ...statusAfter, recent: [] } });
  check("a missing connection-closed audit row fails the live phase", noAudit.block.result === "fail");
  const heldBefore = makePendingBlock({ before: { ...statusBefore, held: true }, take: takeOk, after: statusAfter });
  check("taking over an existing hold fails instead of touching it", heldBefore.problems.some((p) => /already held/u.test(p)));
  const armedBefore = makePendingBlock({ before: { ...statusBefore, resumeSnapshotRequired: true }, take: takeOk, after: statusAfter });
  check("taking while the gate is already armed fails the attribution", armedBefore.problems.some((p) => /already armed/u.test(p)));
  const stolen = makePendingBlock({ before: statusBefore, take: takeOk, after: { ...statusAfter, owned: true } });
  check("a new connection inheriting ownership fails", stolen.problems.some((p) => /inherited ownership/u.test(p)));

  check("valid H4/H5 evidence is accepted", validateInputEvidence(goodInput).length === 0, JSON.stringify(validateInputEvidence(goodInput)));
  check("unknown evidence fields are refused", validateInputEvidence({ ...goodInput, extra: true }).length > 0);
  check("an observation cannot stand in for the H4 input",
    validateInputEvidence({ ...goodInput, inputBeforeFreshCapture: { ...goodInput.inputBeforeFreshCapture, action: "screenshot" } }).length > 0);
  check("a landed input is still valid evidence (so it can be recorded as a failure)",
    validateInputEvidence({ ...goodInput, inputBeforeFreshCapture: { ...goodInput.inputBeforeFreshCapture, desktopEffect: "landed" } }).length === 0);
  const merged = mergeInputEvidence(pending.block, goodInput);
  check("merging exact H4/H5 evidence makes k7 pass", merged.k7 === true && merged.block.result === "pass"
    && validateHoldRecovery(merged.block).length === 0);
  const wrongCode = mergeInputEvidence(pending.block, { ...goodInput, inputBeforeFreshCapture: { ...goodInput.inputBeforeFreshCapture, errorCode: "computer-hold:human-control" } });
  check("the wrong refusal code is recorded as a failed k7, not rewritten", wrongCode.block.result === "fail" && wrongCode.k7 === false);
  const landed = mergeInputEvidence(pending.block, { ...goodInput, inputBeforeFreshCapture: { ...goodInput.inputBeforeFreshCapture, desktopEffect: "landed" } });
  check("an input that landed fails k7 even when it was refused", landed.k7 === false && landed.block.result === "fail");
  const noGate = mergeInputEvidence(pending.block, { ...goodInput, freshCaptureClearedGate: false });
  check("an uncleared fresh-capture gate fails k7", noGate.k7 === false);
  const failedPending = mergeInputEvidence({ ...pending.block, result: "fail" }, goodInput);
  check("a failed live phase cannot be repaired by input evidence", failedPending.block === null && failedPending.problems.length > 0);

  const args = buildGatewayCallArgs({ action: "status" });
  check("the gateway call targets zero.computer.control", args[0] === "gateway" && args[1] === "call" && args[2] === "zero.computer.control");
  check("the params JSON quotes are escaped for the Windows shell", args[4] === "{\\\"action\\\":\\\"status\\\"}", args[4]);
  check("the call asks for JSON output", args[5] === "--json");

  const cleanWrite = prepareWrite({ note: "synthetic only" });
  check("clean evidence is writable", cleanWrite.safe === true && cleanWrite.text.includes("synthetic only"));
  const secretWrite = prepareWrite({ note: `nvapi-${"A".repeat(24)}` });
  check("the write path refuses a key-shaped string", secretWrite.safe === false
    && secretWrite.findings.some((f) => f.name === "api-key-shaped-secret"));
  const profileWrite = prepareWrite({ note: "C:\\Users\\ProfZero\\Desktop\\x" });
  check("the write path redacts a profile path instead of persisting it", profileWrite.safe === true
    && !profileWrite.text.includes("ProfZero"));
}

// --- report --------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("FAILURES:\n - " + failures.join("\n - "));
  process.exitCode = 1;
} else {
  console.log("CU-01 rig logic verified offline. No machine, driver, Gateway, or desktop was touched.");
}
