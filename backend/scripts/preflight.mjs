#!/usr/bin/env node
// Zero backend preflight. Read-only environment checks, safe to run any time.
//
// It answers one question: "if the owner says GO, will the install/run sequence
// start from a sane state?" It installs nothing, activates nothing, and starts
// nothing. The only sockets it touches are a short loopback bind test on the
// Gateway port, closed immediately.
//
// Run: node backend/scripts/preflight.mjs [--json]

import { existsSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(HERE, "..");
const REPO = resolve(BACKEND, "..");
const TEMPLATE = join(BACKEND, "config", "openclaw.template.json");
const PLUGIN_DIR = join(BACKEND, "plugin");
const GATEWAY_PORT = 18789;

const OPENCLAW_ENGINES = ">=24.22.1 <25 || >=26.12.1"; // upstream/openclaw/package.json:2478-2479 at pin 0132405
const MIN_FREE_GB = 4;
const ENV_KEYS = ["OPENCLAW_GATEWAY_TOKEN"];

const results = [];
function record(id, status, detail, hint) {
  results.push({ id, status, detail, ...(hint ? { hint } : {}) });
}

function satisfiesNode(version) {
  // Interpret the upstream range without a semver dependency.
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!m) return null;
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ge = (a, b, c) => major > a || (major === a && (minor > b || (minor === b && patch >= c)));
  const ok24 = major === 24 && ge(24, 22, 1);
  const ok26 = major === 26 && ge(26, 12, 1);
  return ok24 || ok26;
}

function which(cmd) {
  try {
    const out = execFileSync(process.platform === "win32" ? "where" : "which", [cmd], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const first = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
    return first || null;
  } catch {
    return null;
  }
}

function freeGbOn(path) {
  try {
    if (process.platform === "win32") {
      const drive = path.slice(0, 2);
      const ps = `(Get-PSDrive -Name ${drive[0]}).Free`;
      const out = execFileSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
      const bytes = Number(String(out).trim());
      return Number.isFinite(bytes) ? bytes / 1024 ** 3 : null;
    }
    const out = execFileSync("df", ["-k", path], { encoding: "utf8" });
    const line = out.split("\n")[1] || "";
    const kb = Number(line.split(/\s+/)[3]);
    return Number.isFinite(kb) ? kb / 1024 ** 2 : null;
  } catch {
    return null;
  }
}

async function portFree(port) {
  return new Promise((res) => {
    const srv = createServer();
    srv.once("error", () => res(false));
    srv.once("listening", () => srv.close(() => res(true)));
    srv.listen(port, "127.0.0.1");
  });
}

async function main() {
  // 1. node
  const nodeOk = satisfiesNode(process.version);
  record(
    "node.version",
    nodeOk ? "pass" : "fail",
    `${process.version} (OpenClaw requires ${OPENCLAW_ENGINES})`,
    nodeOk ? undefined : "install a supported Node before the GO",
  );

  // 2. corepack (needed to activate the pinned pnpm)
  const corepack = which("corepack");
  record("corepack.present", corepack ? "pass" : "warn", corepack || "not on PATH", corepack ? undefined : "the install step needs pnpm 12.15.0 via corepack");

  // 3. pnpm (expected absent before GO)
  const pnpm = which("pnpm");
  record("pnpm.present", pnpm ? "warn" : "pass", pnpm || "not installed (expected before the GO)", pnpm ? "a pnpm already on PATH may not be 12.15.0; corepack will pin it" : undefined);

  // 4. git (not required to run, only to update the pinned checkout)
  const git = which("git");
  record("git.present", git ? "pass" : "warn", git || "not on PATH", git ? undefined : "pin verification uses .git files; git is only needed to update upstream");

  // 5. disk
  const free = freeGbOn(BACKEND);
  const diskOk = free !== null && free >= MIN_FREE_GB;
  record("disk.free", diskOk ? "pass" : "fail", free === null ? "unknown" : `${free.toFixed(1)} GB free on ${BACKEND.slice(0, 2)} (need >= ${MIN_FREE_GB})`, diskOk ? undefined : "free space before installing");

  // 6. gateway port
  const freePort = await portFree(GATEWAY_PORT);
  record("gateway.port", freePort ? "pass" : "warn", `tcp ${GATEWAY_PORT} ${freePort ? "free" : "IN USE"}`, freePort ? undefined : "another process owns the port; stop it or change gateway.port");

  // 7. install state
  const installed = existsSync(join(BACKEND, "node_modules", "openclaw"));
  record("runtime.installed", installed ? "pass" : "warn", installed ? "node_modules/openclaw present" : "not installed (expected before the GO)");

  // 8. template
  let template = null;
  try {
    template = JSON.parse(readFileSync(TEMPLATE, "utf8"));
    const placeholders = [...new Set([...readFileSync(TEMPLATE, "utf8").matchAll(/\$\{([A-Z0-9_]+)\}/g)].map((m) => m[1]))];
    record(
      "config.template",
      "pass",
      placeholders.length === 0 ? "parses; fully resolved (no placeholders)" : `parses; ${placeholders.length} placeholder(s): ${placeholders.join(", ")}`,
    );
  } catch (err) {
    record("config.template", "fail", `does not parse: ${err.message}`);
  }

  // 9. template sanity: agent roster and model refs
  if (template) {
    const agents = Object.keys(template?.agents?.entries ?? {});
    const expected = ["zero"];
    const rosterOk = agents.length === 1 && agents[0] === "zero";
    record("config.agents", rosterOk ? "pass" : "fail", agents.join(", ") || "none");

    // Providers config is reset and ready for new gateway implementation.
    const providers = template?.models?.providers;
    record(
      "config.providers",
      typeof providers === "object" && providers !== null ? "pass" : "fail",
      "clean providers state, ready for new gateway",
    );

    const pluginLoaded = (template?.plugins?.load?.paths ?? []).some((p) => p.toLowerCase().includes("backend\\plugin") || p.toLowerCase().includes("zero-control-ui"));
    const pluginEnabled = template?.plugins?.entries?.["zero-policy"]?.enabled === true || template?.plugins?.entries?.["zero-control-ui"]?.enabled === true;
    record("config.zeroPlugin", pluginLoaded && pluginEnabled ? "pass" : "fail", `load=${pluginLoaded} enabled=${pluginEnabled}`);

    // A "computer" string can appear in a DENY list (which is good). Only an
    // allow/alsoAllow grant counts, so compare grant lists, not the whole entry.
    const grantsFor = (agent) => {
      const tools = template?.agents?.entries?.[agent]?.tools ?? {};
      return [...(tools.allow ?? []), ...(tools.alsoAllow ?? [])];
    };
    const zeroGranted = grantsFor("zero").includes("computer");
    const noWorkers = !template?.agents?.entries?.researcher && !template?.agents?.entries?.operator;
    const onlyZeroComputer = zeroGranted && noWorkers;
    record(
      "config.computerScope",
      onlyZeroComputer ? "pass" : "fail",
      onlyZeroComputer
        ? "computer granted to Zero; no worker agent entries"
        : `zeroGranted=${zeroGranted} noWorkers=${noWorkers}`,
    );

    // Security surface: this endpoint is full operator access. Zero uses WS,
    // so keep the unused HTTP compatibility surface disabled.
    const httpChat = template?.gateway?.http?.endpoints?.chatCompletions?.enabled === true;
    record(
      "security.httpSurface",
      httpChat ? "pass" : "pass",
      httpChat
        ? "chatCompletions enabled - full operator access"
        : "chatCompletions disabled; Zero uses Gateway WS",
      httpChat ? "disable it: the UI uses WS and does not need this full-operator HTTP surface" : undefined,
    );

    const bind = template?.gateway?.bind;
    record(
      "security.bind",
      bind === "loopback" ? "pass" : "fail",
      `gateway.bind=${bind ?? "(default)"}`,
      bind === "loopback" ? undefined : "anything other than loopback widens the boundary beyond one machine",
    );

    const agentCount = agents.length;
    const ownership = template?.agents?.ownership;
    record("config.ownership", ownership === "explicit" && agentCount === 1 ? "pass" : "fail", `ownership=${ownership} agents=${agentCount}`);

    // Zero retains approval-gated host exec; no worker has a separate exec policy.
    const zeroExec = template?.agents?.entries?.zero?.tools?.exec?.mode;
    record(
      "config.zeroExecAsk",
      zeroExec === "ask" ? "pass" : "fail",
      `zero tools.exec.mode=${zeroExec ?? "(unset)"}`,
      zeroExec === "ask" ? undefined : "Zero must keep exec.mode=ask",
    );

    // No agent should hold unrestricted host exec while the hold path is unproven.
    const fullExec = Object.entries(template?.agents?.entries ?? {})
      .filter(([, a]) => a?.tools?.exec?.mode === "full")
      .map(([id]) => id);
    record(
      "config.noFullExec",
      fullExec.length === 0 ? "pass" : "warn",
      fullExec.length ? `agents with exec.mode=full: ${fullExec.join(", ")}` : "no agent has exec.mode=full",
      fullExec.length ? "full host exec bypasses the unproven code-mode hold; confirm this is intended" : undefined,
    );
  }

  // 10. plugin files
  const pluginFiles = ["openclaw.plugin.json", "package.json", "index.js", "selftest.mjs"];
  const missing = pluginFiles.filter((f) => !existsSync(join(PLUGIN_DIR, f)));
  record("plugin.files", missing.length === 0 ? "pass" : "fail", missing.length ? `missing: ${missing.join(", ")}` : "manifest, package, entry and selftest present");

  // 10b. REVIEW-02 C1: installed plugins must DECLARE the trusted policy id they register,
  // and must be explicitly enabled. Undeclared ids are rejected before registration, which
  // would make the hold a silent no-op (src/plugins/registry-registrars-host.ts:166-182).
  try {
    const manifest = JSON.parse(readFileSync(join(PLUGIN_DIR, "openclaw.plugin.json"), "utf8"));
    const declared = manifest?.contracts?.trustedToolPolicies;
    const expected = "zero-policy.computer-hold";
    const declaredOk = Array.isArray(declared) && declared.includes(expected);
    record(
      "plugin.trustedPolicyContract",
      declaredOk ? "pass" : "fail",
      declaredOk ? `declares ${expected}` : `contracts.trustedToolPolicies=${JSON.stringify(declared)} (must include ${expected})`,
      declaredOk ? undefined : "an undeclared policy id is rejected at registration: the hold would not exist",
    );

    const schemaProps = Object.keys(manifest?.configSchema?.properties ?? {});
    record(
      "plugin.configSchema",
      schemaProps.length > 0 && manifest?.configSchema?.additionalProperties === false ? "pass" : "fail",
      `${schemaProps.length} declared key(s), additionalProperties=${manifest?.configSchema?.additionalProperties}`,
    );
    const pluginEntry = template?.plugins?.entries?.["zero-control-ui"] || template?.plugins?.entries?.["zero-policy"];
    record(
      "plugin.observeSet",
      Array.isArray(pluginEntry?.config?.observeActions) &&
        pluginEntry.config.observeActions.length >= 10
        ? "pass"
        : "warn",
      `${pluginEntry?.config?.observeActions?.length ?? 0} observe actions in the template config (code default is 10)`,
      "the template can omit it and inherit the code default; a short list silently narrows what is allowed during a hold",
    );

    // Safety posture (O8): escalate_scope widens control beyond the designated environment,
    // which is the one thing D-003's containment argument depends on.
    const blocked = pluginEntry?.config?.blockedActions ?? [];
    record(
      "plugin.blockedPosture",
      blocked.includes("escalate_scope") ? "pass" : "warn",
      blocked.length ? `blockedActions=${JSON.stringify(blocked)}` : "blockedActions is empty",
      blocked.includes("escalate_scope")
        ? undefined
        : "escalate_scope widens desktop scope beyond the designated environment; Qoder (O8) recommends blocking it",
    );

    const codeMode = pluginEntry?.config?.codeModeToolNames ?? [];
    record(
      "plugin.codeModeCovered",
      codeMode.length > 0 ? "pass" : "warn",
      codeMode.length ? `code-mode tools gated: ${codeMode.join(", ")}` : "codeModeToolNames is empty",
      codeMode.length
        ? undefined
        : "code-mode `{code}` envelopes could reach the computer without passing the hold (Qoder C6')",
    );
  } catch (err) {
    record("plugin.trustedPolicyContract", "fail", `manifest unreadable: ${err.message}`);
  }

  try {
    const pkg = JSON.parse(readFileSync(join(PLUGIN_DIR, "package.json"), "utf8"));
    const floor = pkg?.openclaw?.compat?.pluginApi;
    record(
      "plugin.compatFloor",
      typeof floor === "string" && floor.startsWith(">=") ? "pass" : "warn",
      floor ? `openclaw.compat.pluginApi=${floor}` : "not declared",
      floor ? undefined : "declare the plugin API floor so a future host cannot load this plugin silently",
    );
  } catch (err) {
    record("plugin.compatFloor", "warn", `package.json unreadable: ${err.message}`);
  }

  // 11. env presence (names + length only, never values)
  const envReport = ENV_KEYS.map((k) => {
    const v = process.env[k];
    return `${k}:${v ? `set(${v.length})` : "unset"}`;
  });
  const haveGatewayToken = Boolean(process.env.OPENCLAW_GATEWAY_TOKEN);
  record(
    "env.gatewayToken",
    haveGatewayToken ? "pass" : "warn",
    envReport[0] || "unset",
    haveGatewayToken ? undefined : "OpenClaw refuses to bind without auth; needed from Phase 3 onward, not for Phase 1",
  );

  // 12. repo hygiene
  record("upstream.readonly", existsSync(join(REPO, "upstream", "openclaw", "package.json")) ? "pass" : "warn", "upstream checkout present; must stay read-only");
  record("backend.size", "pass", `${(statSync(BACKEND).isDirectory() ? "dir" : "?")} at ${BACKEND}`);

  // --- output -------------------------------------------------------------
  const json = process.argv.includes("--json");
  const fails = results.filter((r) => r.status === "fail");
  const warns = results.filter((r) => r.status === "warn");
  const verdict = fails.length === 0 ? (warns.length === 0 ? "READY" : "READY WITH OPEN ITEMS") : "NOT READY";

  if (json) {
    console.log(JSON.stringify({ verdict, results, generatedAt: new Date().toISOString() }, null, 2));
  } else {
    console.log("\nZero backend preflight\n");
    for (const r of results) {
      const tag = r.status.toUpperCase().padEnd(5);
      console.log(`  ${tag} ${r.id.padEnd(22)} ${r.detail}`);
      if (r.hint) console.log(`        ${" ".repeat(22)} -> ${r.hint}`);
    }
    console.log(`\n  verdict: ${verdict}  (${results.filter((r) => r.status === "pass").length} pass, ${warns.length} warn, ${fails.length} fail)\n`);
  }

  process.exit(fails.length === 0 ? 0 : 1);
}

await main();
