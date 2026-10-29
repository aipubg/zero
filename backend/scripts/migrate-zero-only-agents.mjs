#!/usr/bin/env node
// Migrate Zero config to the single-agent model: keep only `zero`, remove the
// worker entries and their delegation policy, and grant Zero the computer tool
// it now needs. The patch is validated and applied through `openclaw config
// patch`; the current file is backed up first.
//
// Run:
//   node backend/scripts/migrate-zero-only-agents.mjs --config <openclaw.json> --dry-run
//   node backend/scripts/migrate-zero-only-agents.mjs --config <openclaw.json> --apply

import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(HERE, "..");
const OPENCLAW = join(BACKEND, "node_modules", "openclaw", "openclaw.mjs");
const WORKERS = ["researcher", "operator"];

export const ZERO_ONLY_UNSET_PATHS = WORKERS.map((id) => `agents.entries.${id}`);

export function buildZeroOnlyPatch(config) {
  const zero = config?.agents?.entries?.zero ?? {};
  const alsoAllow = Array.isArray(zero?.tools?.alsoAllow) ? zero.tools.alsoAllow : [];
  return {
    agents: {
      defaults: {
        subagents: null,
      },
      entries: {
        zero: {
          tools: {
            alsoAllow: [...new Set([...alsoAllow, "computer"])],
          },
          subagents: {
            allowAgents: [],
            requireAgentId: true,
          },
        },
      },
    },
  };
}

export function assertZeroOnlyConfig(config) {
  const entries = Object.keys(config?.agents?.entries ?? {});
  if (entries.length !== 1 || entries[0] !== "zero") {
    throw new Error(`expected only zero, found: ${entries.join(", ") || "none"}`);
  }
  const zero = config.agents.entries.zero;
  if (zero?.subagents?.allowAgents?.length !== 0) {
    throw new Error("zero.subagents.allowAgents must be empty");
  }
  if (zero?.subagents?.requireAgentId !== true) {
    throw new Error("zero.subagents.requireAgentId must stay true to block implicit self-spawn");
  }
  if (!zero?.tools?.alsoAllow?.includes("computer")) {
    throw new Error("zero must hold the computer tool");
  }
  for (const id of WORKERS) {
    if (Object.hasOwn(config.agents.entries, id)) {
      throw new Error(`worker entry still present: ${id}`);
    }
  }
  return true;
}

export function modelSignature(config) {
  const model = (value) => (typeof value === "string" ? value : value?.primary ?? null);
  const fallbacks = (value) => (Array.isArray(value?.fallbacks) ? value.fallbacks : []);
  const zero = config?.agents?.entries?.zero ?? {};
  return JSON.stringify({
    defaults: {
      model: model(config?.agents?.defaults?.model),
      fallbacks: fallbacks(config?.agents?.defaults?.model),
      utilityModel: config?.agents?.defaults?.utilityModel ?? null,
    },
    zero: {
      model: model(zero?.model),
      fallbacks: fallbacks(zero?.model),
      utilityModel: zero?.utilityModel ?? null,
    },
    providers: Object.fromEntries(
      Object.entries(config?.models?.providers ?? {}).map(([id, provider]) => [
        id,
        {
          baseUrl: provider?.baseUrl ?? null,
          api: provider?.api ?? null,
          apiKey: provider?.apiKey ?? null,
          models: Array.isArray(provider?.models) ? provider.models.map((row) => row?.id) : [],
        },
      ]),
    ),
  });
}

function runCli(args, configPath) {
  return spawnSync(process.execPath, [OPENCLAW, "config", ...args], {
    env: { ...process.env, OPENCLAW_CONFIG_PATH: configPath },
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true,
  });
}

// Config-only agent removal: the same mutation used by `agents delete`, without
// its workspace/session pruning. Already verified on a temp config copy.
async function loadDeleteAgentConfigEntry() {
  const dist = join(BACKEND, "node_modules", "openclaw", "dist");
  const file = readdirSync(dist).find(
    (name) => name.startsWith("agents-config-mutations-") && name.endsWith(".mjs"),
  );
  if (!file) throw new Error("installed agent config mutation module is missing");
  const module = await import(pathToFileURL(join(dist, file)).href);
  const remove = Object.values(module).find(
    (value) => typeof value === "function" && value.name === "deleteAgentConfigEntry",
  );
  if (!remove) throw new Error("installed deleteAgentConfigEntry export is missing");
  return remove;
}

async function main() {
  const args = process.argv.slice(2);
  const configArg = args.includes("--config")
    ? args[args.indexOf("--config") + 1]
    : process.env.OPENCLAW_CONFIG_PATH;
  const apply = args.includes("--apply");
  if (!configArg) {
    console.error("migrate-zero-only-agents: provide --config or OPENCLAW_CONFIG_PATH");
    process.exit(2);
  }
  const configPath = resolve(configArg);
  if (!existsSync(configPath)) {
    console.error(`migrate-zero-only-agents: config not found: ${configPath}`);
    process.exit(2);
  }

  const before = JSON.parse(readFileSync(configPath, "utf8"));
  const patch = buildZeroOnlyPatch(before);
  const beforeModels = modelSignature(before);
  const unsets = ZERO_ONLY_UNSET_PATHS.filter((path) =>
    Object.hasOwn(before?.agents?.entries ?? {}, path.split(".").at(-1)),
  );

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${configPath}.pre-zero-only-${stamp}.bak`;
  const patchFile = join(dirname(configPath), `.zero-only-${stamp}.patch.json`);
  copyFileSync(configPath, backup);
  writeFileSync(patchFile, `${JSON.stringify(patch, null, 2)}\n`, "utf8");

  const dry = runCli(["patch", "--file", patchFile, "--dry-run", "--json"], configPath);
  if (dry.status !== 0) {
    console.error(dry.stdout || dry.stderr || "dry-run failed");
    process.exit(dry.status ?? 1);
  }
  console.log(`backup: ${backup}`);
  console.log(`patch:  ${patchFile}`);
  console.log(`agent removals: ${unsets.join(", ") || "(none)"}`);
  console.log(dry.stdout.trim());

  if (!apply) {
    console.log("dry-run only; re-run with --apply to write the migration.");
    return;
  }

  const applied = runCli(["patch", "--file", patchFile], configPath);
  if (applied.status !== 0) {
    console.error(applied.stdout || applied.stderr || "apply failed");
    process.exit(applied.status ?? 1);
  }

  process.env.OPENCLAW_CONFIG_PATH = configPath;
  process.env.OPENCLAW_STATE_DIR ??= join(dirname(configPath), "gateway-state");
  const removeAgent = await loadDeleteAgentConfigEntry();
  for (const path of unsets) {
    await removeAgent({ agentId: path.split(".").at(-1), allowMissing: false });
  }

  const validate = runCli(["validate", "--json"], configPath);
  if (validate.status !== 0) {
    console.error(validate.stdout || validate.stderr || "post-migration validation failed");
    process.exit(validate.status ?? 1);
  }
  const after = JSON.parse(readFileSync(configPath, "utf8"));
  assertZeroOnlyConfig(after);
  if (modelSignature(after) !== beforeModels) {
    console.error("model/provider signature changed unexpectedly");
    process.exit(3);
  }
  console.log("migration applied and validated; zero-only agents, model bindings unchanged.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`migrate-zero-only-agents: ${error.message}`);
    process.exit(1);
  });
}
