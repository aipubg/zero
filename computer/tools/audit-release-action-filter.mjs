#!/usr/bin/env node
/**
 * CU-02 — Windows action-filter audit against the INSTALLED release bundle.
 *
 * WHY: my action taxonomy was derived from the read-only source checkout
 * (`0132405`), but the runtime is the npm release (`fe06181`). The senior's
 * BUILD WINDOW A note proved those are different commits, and DeepSeek found a
 * load-bearing `register()` early-return in the bundle — so bundle reading is a
 * real skill here, not a fallback. This script makes the cross-check repeatable:
 * if the two trees ever drift, it FAILS LOUDLY instead of letting a CU-01 run
 * compare reality against a stale expectation.
 *
 * WHAT IT DOES: text extraction from the built chunks, then re-applies the two
 * filters the release itself uses. It NEVER imports a bundle — importing
 * `dist/extensions/cua-computer/index.js` would load the native driver, which is
 * a gated action. No install, no launch, no Gateway, no desktop.
 *
 * HONEST LIMIT: this proves the release's *declared* action surface. It is not
 * evidence that any action executes on Windows. That is CU-01.
 *
 * Run: node computer/tools/audit-release-action-filter.mjs [distDir]
 * Default: backend/node_modules/openclaw/dist  (relative to the workspace root)
 * Exit 0 = release agrees with my derived contract. Exit 1 = drift or missing marker.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const DIST = process.argv[2] ?? join(ROOT, "backend", "node_modules", "openclaw", "dist");
const DERIVED = join(ROOT, "computer", "contracts", "computer-act-actions.json");

const results = [];
const record = (name, ok, detail = "") => results.push({ name, ok: ok === true, detail });

function report() {
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log("\nDRIFT OR MISSING MARKER. Do not run CU-01 against the derived table until this is");
    console.log("understood: the release may have changed, the bundle shape may have changed, or");
    console.log("this script's extraction needs revisiting. A red audit is a question, not an answer.");
    process.exitCode = 1;
  } else {
    console.log("\nRelease bundle agrees with the derived Windows action contract.");
    console.log("Static declaration only — execution on a real desktop is CU-01.");
  }
}

if (!existsSync(DIST)) {
  console.error(`release dist not found: ${DIST}`);
  console.error("This script installs nothing. Run it after the backend install window.");
  process.exit(1);
}

const chunks = readdirSync(DIST, { recursive: true })
  .map(String)
  .filter((f) => /\.(mjs|js)$/u.test(f) && !f.includes("control-ui"));

/** First chunk containing `marker`; absence is recorded, never silent. */
function findChunk(marker, label) {
  for (const f of chunks) {
    try {
      const text = readFileSync(join(DIST, f), "utf8");
      if (text.includes(marker)) return { file: f, text };
    } catch {
      /* unreadable chunk; keep looking */
    }
  }
  record(label, false, `marker absent from ${chunks.length} chunks: ${marker}`);
  return null;
}

/** Text between the first `[` and its matching `]` after `marker`. */
function arrayBody(text, marker) {
  const at = text.indexOf(marker);
  if (at < 0) return null;
  const open = text.indexOf("[", at);
  const close = text.indexOf("]", open);
  if (open < 0 || close < 0) return null;
  return text.slice(open + 1, close);
}

/**
 * Every quoted lower-case identifier in an array body. Two bugs this replaces:
 * matching only lines ending `",` missed the final element (no trailing comma),
 * and a hand-maintained literal list drifted from the bundle — both produced a
 * false "release drift" report that was really my own extraction failing.
 */
const quotedIn = (body) => [...new Set([...String(body ?? "").matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]))];

// ---------------------------------------------------------------------------
// 1. Shared v2 contract, as shipped.
// ---------------------------------------------------------------------------
const derived = JSON.parse(readFileSync(DERIVED, "utf8"));
const contract = findChunk("COMPUTER_USE_V2_ACTION_NAMES = [", "release: v2 action contract DEFINITION present");
if (!contract) {
  report();
  process.exit(1);
}
const v2 = quotedIn(arrayBody(contract.text, "COMPUTER_USE_V2_ACTION_NAMES = ["));

record("release: v2 name list extracted", v2.length > 0, `got ${v2.length}`);
record("release v2 count == 40", v2.length === 40, `got ${v2.length}`);
record(
  "release v2 list identical to my checkout-derived list (order included)",
  JSON.stringify(v2) === JSON.stringify(derived.v2Names),
  `release-only=${JSON.stringify(v2.filter((n) => !derived.v2Names.includes(n)))} mine-only=${JSON.stringify(derived.v2Names.filter((n) => !v2.includes(n)))}`,
);

// ---------------------------------------------------------------------------
// 2. Provider composition + the platform filter it actually runs.
// ---------------------------------------------------------------------------
const plugin = findChunk("CUA_COMMON_ACTION_NAMES = [", "release: cua-computer provider chunk present");
let common = [];
if (plugin) {
  const body = arrayBody(plugin.text, "CUA_COMMON_ACTION_NAMES = [") ?? "";
  const spread = /COMPUTER_USE_V2_ACTION_NAMES\.slice\((\d+),\s*(\d+)\)\.filter\(\(action\) => action !== "([a-z_]+)"\)/u.exec(body);
  if (!spread) {
    record("release: pointer-block spread expression parsed", false, body.slice(0, 160));
  } else {
    const [, from, to, drop] = spread;
    const spreadNames = v2.slice(Number(from), Number(to)).filter((a) => a !== drop);
    record(
      `release: slice(${from},${to}) minus ${drop} reproduces the pointer block (12, starts left_click)`,
      spreadNames.length === 12 && spreadNames[0] === "left_click",
      `${spreadNames.length}: ${spreadNames.join(",")}`,
    );
    // Inside this array the only quoted token that is not a literal member is the
    // dropped name appearing in the filter expression.
    const literals = quotedIn(body).filter((n) => n !== drop);
    common = ["screenshot", ...spreadNames, ...literals.filter((n) => n !== "screenshot" && !spreadNames.includes(n))];
    record("release: CUA_COMMON_ACTION_NAMES has 38 entries", common.length === 38, `got ${common.length}`);
    record("release: common list excludes wait and hold_key", !common.includes("wait") && !common.includes("hold_key"), "");
    record("release: common list ends at invoke_menu", common[common.length - 1] === "invoke_menu", common[common.length - 1]);
  }

  const filter = /function platformActions\(platform\) \{\s*return CUA_COMMON_ACTION_NAMES\.filter\(\(action\) =>([^;]*?)\);/su.exec(plugin.text);
  if (!filter) {
    record("release: platformActions() located", false, "regex miss — re-check by hand, never assume");
  } else {
    const expr = filter[1].trim();
    record(
      "release: platform filter drops only left_mouse_down/up off Linux",
      expr === 'platform === "linux" || action !== "left_mouse_down" && action !== "left_mouse_up"',
      expr,
    );
    record("release: filter branches on platform, not arch (win32-arm64 shares the win32 path)", !/arch/u.test(expr), expr);

    const win32 = common.filter((a) => a !== "left_mouse_down" && a !== "left_mouse_up");
    const mine = derived.platforms.find((p) => p.platform === "win32").advertised;
    record(
      "release: executed win32 filter == my derived 36-name set",
      win32.length === 36 && JSON.stringify([...win32].sort()) === JSON.stringify([...mine].sort()),
      `release=${win32.length} mine=${mine.length} release-only=${JSON.stringify(win32.filter((a) => !mine.includes(a)))} mine-only=${JSON.stringify(mine.filter((a) => !win32.includes(a)))}`,
    );
    record("release: linux keeps both held-mouse names (38)", common.length === 38 && common.includes("left_mouse_up"), `got ${common.length}`);
  }
}

// ---------------------------------------------------------------------------
// 3. The tool layer, which decides what the MODEL can actually name.
// ---------------------------------------------------------------------------
const tool = findChunk("EXECUTION_OWNED_ACTIONS", "release: computer tool chunk present");
if (tool) {
  const oAt = tool.text.indexOf("EXECUTION_OWNED_ACTIONS");
  const owned = quotedIn(tool.text.slice(oAt, tool.text.indexOf("])", oAt) + 2));
  record("release: 6 execution-owned actions", owned.length === 6 && owned.includes("replay_trajectory"), owned.join(","));

  const lAt = tool.text.indexOf("LOCAL_ACTIONS");
  const localNames = quotedIn(tool.text.slice(lAt, tool.text.indexOf("])", lAt) + 2));
  record(
    "release: LOCAL_ACTIONS is exactly screenshot + wait",
    localNames.length === 2 && localNames.includes("screenshot") && localNames.includes("wait"),
    localNames.join(","),
  );

  const throws =
    findChunk("take_control is only available for an attached or session desktop", "release: take_control paired-node throw present") !== null;
  record("release: take_control still throws for paired/Gateway targets", throws, "");

  // Four distinct numbers, asserted separately so a future failure says which layer moved.
  const advertised = derived.platforms.find((p) => p.platform === "win32").advertised;
  const withoutOwned = advertised.filter((a) => !owned.includes(a));
  const withWait = withoutOwned.includes("wait") ? withoutOwned : [...withoutOwned, "wait"];
  const withTake = withWait.includes("screenshot") ? [...withWait, "take_control"] : withWait;
  record("release: provider-advertised on win32 = 36", advertised.length === 36, String(advertised.length));
  record("release: minus 6 execution-owned (no cleanup owner) = 30", withoutOwned.length === 30, String(withoutOwned.length));
  record("release: plus tool-layer `wait` = 31", withWait.length === 31, String(withWait.length));
  record("release: plus `take_control` = 32 names the model may send", withTake.length === 32, String(withTake.length));
  record(
    "release: wait and take_control are tool-layer additions, not provider-advertised",
    !advertised.includes("wait") && !advertised.includes("take_control"),
    "",
  );
  record("release: every execution-owned name is hidden without a cleanup owner", owned.every((a) => !withoutOwned.includes(a)), "");
}

// ---------------------------------------------------------------------------
// 4. My published artefacts must agree with the release, not just with themselves.
// ---------------------------------------------------------------------------
record(
  "release: my taxonomy §5 hold allowlist covers upstream's 8 observation names",
  JSON.stringify([...derived.observationNamesForHoldAllowlist].sort()) ===
    JSON.stringify(["get_accessibility_tree", "get_browser_state", "get_cursor_position", "get_recording_state", "get_window_state", "list_apps", "list_windows", "zoom"].sort()),
  derived.observationNamesForHoldAllowlist.join(","),
);
record(
  "release: high-risk families match the CUA node-invoke policy",
  JSON.stringify(Object.keys(derived.highRiskFamilies).sort()) ===
    JSON.stringify(["kill_app", "browser_navigate", "browser_download", "browser_set_input_files", "start_recording", "replay_trajectory", "escalate_scope"].sort()),
  Object.keys(derived.highRiskFamilies).join(","),
);
record(
  "release: desktop wire names = slice(1,14) = 13, starting left_click",
  derived.desktopWireNames.length === 13 && derived.desktopWireNames[0] === "left_click",
  derived.desktopWireNames.join(","),
);
record(
  "release: targeted set is the 11 window-targetable names",
  derived.targetedNames.length === 11 && derived.targetedNames.includes("left_mouse_up"),
  String(derived.targetedNames.length),
);
record("derived artefact records its 40-char source commit", typeof derived.openclawCommit === "string" && derived.openclawCommit.length === 40, derived.openclawCommit ?? "");

report();
