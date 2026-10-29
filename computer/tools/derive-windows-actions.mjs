#!/usr/bin/env node
/**
 * CU-02 prep — derive the exact `computer.act` action taxonomy that the pinned
 * OpenClaw CUA provider exposes per platform, straight from upstream source.
 *
 * Why a script and not a hand-written table: the Windows list is the v2 name
 * list minus three independent filters. Hand-copying it is how a stale ticket
 * list gets into the tool-policy matcher and the audit rows.
 *
 * Read-only over upstream/. No dependencies, no install, no runtime launch,
 * no network, no desktop action. Output: ../contracts/computer-act-actions.json
 *
 * Sources (commit 013240515205573248c27ab6b8eec7303f0da1a8):
 *   upstream/openclaw/src/plugins/computer-use-contract.ts:8-49   v2 names (ordered)
 *   upstream/openclaw/src/plugins/computer-use-contract.ts:53     v1 = slice(0,15)
 *   upstream/openclaw/extensions/cua-computer/src/driver-result.ts:25,91-98
 *   upstream/openclaw/extensions/cua-computer/src/window-actions.ts:32-43,202-210
 *   upstream/openclaw/extensions/cua-computer/src/commands.ts:238-253
 *   upstream/openclaw/src/agents/tools/computer-tool-schema.ts:21-41,84
 *   upstream/openclaw/src/agents/tools/computer-tool-node.ts:363-369
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const UPSTREAM = join(HERE, "..", "..", "upstream", "openclaw");
const OUT_DIR = join(HERE, "..", "contracts");

function readUpstream(relativePath) {
  return readFileSync(join(UPSTREAM, relativePath), "utf8");
}

/** Pull one `export const NAME = [ ... ] as const;` array literal out of source. */
function extractNameArray(source, exportName, filePath) {
  const start = source.indexOf(`export const ${exportName} = [`);
  if (start === -1) {
    throw new Error(`cannot locate ${exportName} in ${filePath}`);
  }
  const end = source.indexOf("] as const", start);
  if (end === -1) {
    throw new Error(`cannot locate end of ${exportName} in ${filePath}`);
  }
  const names = [...source.slice(start, end).matchAll(/"([a-z0-9_]+)"/gu)].map((m) => m[1]);
  if (names.length === 0) {
    throw new Error(`${exportName} parsed empty in ${filePath}`);
  }
  return names;
}

const contractPath = "src/plugins/computer-use-contract.ts";
const v2 = extractNameArray(readUpstream(contractPath), "COMPUTER_USE_V2_ACTION_NAMES", contractPath);
const v1 = v2.slice(0, 15);
// driver-result.ts:25 -> CUA_WIRE_ACTION_NAMES = COMPUTER_USE_V2_ACTION_NAMES.slice(1, 14)
const desktopWireNames = v2.slice(1, 14);
// window-actions.ts:32-43 -> targeted set (11 names)
const targetedNames = [
  "left_click", "right_click", "middle_click", "double_click", "triple_click",
  "left_click_drag", "left_mouse_down", "left_mouse_up", "scroll", "type", "key",
];

/**
 * driver-result.ts:91-98 platformActions():
 *   drop hold_key and wait always; drop left_mouse_down/left_mouse_up unless linux.
 */
function platformActions(platform) {
  return v2.filter(
    (action) =>
      action !== "hold_key" &&
      action !== "wait" &&
      (platform === "linux" || (action !== "left_mouse_down" && action !== "left_mouse_up")),
  );
}

// computer-tool-schema.ts:21-28 — execution-owned actions are hidden without a cleanup owner.
const executionOwned = [
  "browser_set_input_files", "browser_download", "get_recording_state",
  "start_recording", "stop_recording", "replay_trajectory",
];
// node-invoke-policy.ts:26-35 — upstream's own observation set (the hold must allow these).
const observationActions = [
  "list_apps", "list_windows", "get_accessibility_tree", "get_cursor_position",
  "get_window_state", "zoom", "get_browser_state", "get_recording_state",
];
// node-invoke-policy.ts:17-24 — high-risk families (budget/audit rows DeepSeek asked for).
const highRisk = {
  kill_app: "process_termination",
  browser_navigate: "browser_navigation",
  browser_download: "browser_download",
  browser_set_input_files: "browser_file_input",
  start_recording: "recording_start",
  replay_trajectory: "recording_replay",
  escalate_scope: "desktop_scope_escalation",
};
// commands.ts:238-253 + actions.ts:88-117 — runtime rejections that survive the name list.
const windowsRuntimeRejections = [
  { trigger: "any desktop action with `modifiers` set", code: "COMPUTER_UNSUPPORTED_ACTION", note: "modifier-held click/scroll rejected; drag+modifier likewise" },
  { trigger: "key value that is a digit or punctuation", code: "COMPUTER_UNSUPPORTED_KEY", note: "layout shift state is dropped by the driver; send via `type`" },
  { trigger: "screenIndex !== 0", code: "COMPUTER_UNSUPPORTED_DISPLAY", note: "primary display only" },
  { trigger: "reported screen geometry != screenshot geometry", code: "COMPUTER_UNSUPPORTED_DISPLAY", note: "DPI scaling risk; non-macOS only" },
  { trigger: "hold_key / left_mouse_down / left_mouse_up", code: "COMPUTER_UNSUPPORTED_ACTION", note: "already absent from the advertised Windows list; belt-and-braces throw" },
  { trigger: "take_control", code: "take_control is only available for an attached or session desktop", note: "thrown for target=gateway and target=node" },
];

function describe(platform) {
  const advertised = platformActions(platform);
  return {
    platform,
    advertised: advertised,
    advertisedCount: advertised.length,
    desktopWire: desktopWireNames.filter((a) => advertised.includes(a)),
    windowOrElementTargeted: advertised.filter((a) => targetedNames.includes(a)),
    observation: advertised.filter((a) => observationActions.includes(a)),
    highRisk: advertised.filter((a) => a in highRisk),
    hiddenWithoutExecutionOwner: advertised.filter((a) => executionOwned.includes(a)),
    excludedVsV2: v2.filter((a) => !advertised.includes(a)),
  };
}

const platforms = ["win32", "darwin", "linux"].map(describe);
const win32 = platforms.find((p) => p.platform === "win32");

// Self-checks: fail loudly if the upstream file ever shifts under us.
const checks = [];
function check(label, condition) {
  checks.push({ label, pass: condition === true });
}
check("v2 list has 40 names", v2.length === 40);
check("v1 is the first 15", v1.length === 15 && v1[0] === "screenshot" && v1[14] === "wait");
check("desktop wire is 13 names starting at left_click", desktopWireNames.length === 13 && desktopWireNames[0] === "left_click");
const win32ExcludedSorted = [...win32.excludedVsV2].sort().join();
check("win32 excludes hold_key, wait, left_mouse_down, left_mouse_up", win32ExcludedSorted === ["hold_key", "left_mouse_down", "left_mouse_up", "wait"].sort().join());
check("win32 advertised count = 36", win32.advertisedCount === 36);
check("win32 still exposes screenshot", win32.advertised.includes("screenshot"));
check("linux keeps left_mouse_down/up but win32 does not", platformActions("linux").includes("left_mouse_up") && !platformActions("win32").includes("left_mouse_up"));
check("every high-risk family name exists in v2", Object.keys(highRisk).every((a) => v2.includes(a)));
check("take_control is NOT a v2 name (tool-layer only)", !v2.includes("take_control"));

const failed = checks.filter((c) => !c.pass).map((c) => c.label);
if (failed.length > 0) {
  console.error("DERIVATION CHECKS FAILED:\n - " + failed.join("\n - "));
  console.error("Upstream contract may have changed since CU-00. Re-read the source before using this output.");
  process.exitCode = 1;
}

const result = {
  generatedBy: "computer/tools/derive-windows-actions.mjs",
  openclawCommit: "013240515205573248c27ab6b8eec7303f0da1a8",
  provenance: "derived from pinned upstream source at build-prep time; NOT executed against a live node",
  note: "wait is re-added at the tool layer when screenshot is available (computer-tool-schema.ts:37-40) and runs locally; take_control is a tool-layer action that throws for paired/Gateway targets.",
  v2Names: v2,
  v1Names: v1,
  desktopWireNames,
  targetedNames,
  observationNamesForHoldAllowlist: observationActions,
  highRiskFamilies: highRisk,
  platforms,
  windowsRuntimeRejections,
  checks,
};

mkdirSync(OUT_DIR, { recursive: true });
const outFile = join(OUT_DIR, "computer-act-actions.json");
writeFileSync(outFile, JSON.stringify(result, null, 2) + "\n", "utf8");

console.log(`openclaw ${result.openclawCommit.slice(0, 9)} · v2=${v2.length} v1=${v1.length} desktopWire=${desktopWireNames.length}`);
for (const p of platforms) {
  console.log(`${p.platform}: advertised=${p.advertisedCount} observation=${p.observation.length} highRisk=${p.highRisk.length} hiddenWithoutOwner=${p.hiddenWithoutExecutionOwner.length} excluded=[${p.excludedVsV2.join(", ")}]`);
}
console.log(`checks: ${checks.length - failed.length}/${checks.length} pass`);
console.log(`wrote ${outFile}`);
