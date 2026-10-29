#!/usr/bin/env node
// Merge the repository-owned Zero delegation policy into the configured Zero
// workspace AGENTS.md. Idempotent, marker-scoped, and non-destructive: owner
// content outside the managed block is preserved verbatim.
//
// Run:
//   node backend/scripts/sync-zero-instructions.mjs --config <openclaw.json>
//   node backend/scripts/sync-zero-instructions.mjs --workspace <dir> [--check]
//   OPENCLAW_CONFIG_PATH=<openclaw.json> node backend/scripts/sync-zero-instructions.mjs

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(HERE, "..");
const DEFAULT_POLICY = join(BACKEND, "agents", "zero", "delegation-policy.md");

export const MANAGED_BEGIN = "<!-- BEGIN ZERO MANAGED DELEGATION -->";
export const MANAGED_END = "<!-- END ZERO MANAGED DELEGATION -->";

function normalize(text) {
  return String(text ?? "").replace(/\r\n/g, "\n").trim();
}

export function buildManagedBlock(policyText) {
  const body = normalize(policyText);
  if (!body) throw new Error("delegation policy is empty");
  if (body.includes(MANAGED_BEGIN) || body.includes(MANAGED_END)) {
    throw new Error("delegation policy must not contain managed markers");
  }
  return `${MANAGED_BEGIN}\n${body}\n${MANAGED_END}`;
}

export function mergeManagedBlock(existingText, policyText) {
  const text = String(existingText ?? "");
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const block = buildManagedBlock(policyText).replace(/\n/g, newline);
  const beginCount = text.split(MANAGED_BEGIN).length - 1;
  const endCount = text.split(MANAGED_END).length - 1;

  if (beginCount === 0 && endCount === 0) {
    const separator = text.length === 0
      ? ""
      : text.endsWith(`${newline}${newline}`)
        ? ""
        : text.endsWith(newline)
          ? newline
          : `${newline}${newline}`;
    return { text: `${text}${separator}${block}${newline}`, changed: true };
  }

  if (beginCount !== 1 || endCount !== 1 || text.indexOf(MANAGED_BEGIN) > text.indexOf(MANAGED_END)) {
    throw new Error(
      "AGENTS.md has malformed or duplicate ZERO MANAGED DELEGATION markers; refusing to edit",
    );
  }

  const start = text.indexOf(MANAGED_BEGIN);
  const end = text.indexOf(MANAGED_END) + MANAGED_END.length;
  let next = `${text.slice(0, start)}${block}${text.slice(end)}`;
  if (!next.endsWith(newline)) next += newline;
  return { text: next, changed: next !== text };
}

export function resolveWorkspace({ workspace, configPath }) {
  if (workspace) return resolve(workspace);
  if (!configPath) throw new Error("provide --workspace or --config (or OPENCLAW_CONFIG_PATH)");
  const full = JSON.parse(readFileSync(resolve(configPath), "utf8"));
  const configured = full?.agents?.entries?.zero?.workspace;
  if (typeof configured !== "string" || configured.trim().length === 0) {
    throw new Error("configured Zero workspace is missing");
  }
  return resolve(configured);
}

export function syncZeroInstructions({ workspace, configPath, policyPath = DEFAULT_POLICY, check = false }) {
  const policy = readFileSync(policyPath, "utf8");
  const root = resolveWorkspace({ workspace, configPath });
  if (!existsSync(root)) throw new Error(`Zero workspace does not exist: ${root}`);
  const agentsPath = join(root, "AGENTS.md");
  const existing = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : "";
  const merged = mergeManagedBlock(existing, policy);

  if (merged.changed && !check) {
    const temp = join(root, `.AGENTS.md.zero-sync-${process.pid}.tmp`);
    writeFileSync(temp, merged.text, "utf8");
    renameSync(temp, agentsPath);
  }
  return {
    workspace: root,
    agentsPath,
    policyPath: resolve(policyPath),
    changed: merged.changed,
    checkedOnly: check,
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(
      "Usage: node backend/scripts/sync-zero-instructions.mjs --config <openclaw.json> | --workspace <dir> [--check] [--policy <file>] [--json]",
    );
    return;
  }
  const take = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  try {
    const result = syncZeroInstructions({
      workspace: take("--workspace"),
      configPath: take("--config") ?? process.env.OPENCLAW_CONFIG_PATH,
      policyPath: take("--policy") ?? DEFAULT_POLICY,
      check: args.includes("--check"),
    });
    if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`policy:    ${result.policyPath}`);
      console.log(`workspace: ${result.workspace}`);
      console.log(`agents:    ${result.agentsPath}`);
      console.log(`changed:   ${result.changed}${result.checkedOnly ? " (check only)" : ""}`);
    }
    if (result.checkedOnly && result.changed) process.exit(1);
  } catch (error) {
    console.error(`sync-zero-instructions: ${error.message}`);
    process.exit(2);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
