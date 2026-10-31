#!/usr/bin/env node
// Zero backend bootstrap: turn the config template into a live openclaw config.
//
// DRY RUN BY DEFAULT. It writes nothing unless you pass --write.
// It never contains, prints, or writes the gateway key: the config references the
// environment variable NAME (ZERO_GATEWAY_KEY), and OpenClaw resolves it at runtime.
//
// The template is fully resolved since the owner fixed the model route (NVIDIA NIM,
// single model z-ai/glm-5.3-flash). There are no placeholders left, so this script
// now validates the config and writes it; it does not need any env value to run.
//
// Run:
//   node backend/scripts/bootstrap.mjs            # dry run, shows what would be written
//   node backend/scripts/bootstrap.mjs --write    # writes backend/config/openclaw.json
//
// Runtime env consumed by OpenClaw (never written here):
//   ZERO_GATEWAY_KEY, OPENCLAW_GATEWAY_TOKEN, OPENCLAW_STATE_DIR, OPENCLAW_CONFIG_PATH

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(HERE, "..");
const TEMPLATE = join(BACKEND, "config", "zero.template.json");
const OUTPUT = join(BACKEND, "config", "zero.json");
const ENV_EXAMPLE = join(BACKEND, "config", "env.example");

// No placeholders remain in the template. Kept as a guard: if one is ever re-added,
// the script refuses to write until the matching env var exists.
const REQUIRED_ENV = [];
const PLACEHOLDER_RE = /\$\{([A-Z0-9_]+)\}/g;

function subst(text) {
  return text.replace(PLACEHOLDER_RE, (match, name) => {
    const value = process.env[name];
    return value === undefined ? match : value;
  });
}

function redactBaseUrl(url) {
  // The base URL is not secret, but it can carry credentials in userinfo or a
  // path token. Show scheme + host only.
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "<unparseable url>";
  }
}

function main() {
  const write = process.argv.includes("--write");
  const force = process.argv.includes("--force");

  if (!existsSync(TEMPLATE)) {
    console.error(`Template missing: ${TEMPLATE}`);
    process.exit(2);
  }

  const raw = readFileSync(TEMPLATE, "utf8");
  const placeholderNames = [...new Set([...raw.matchAll(PLACEHOLDER_RE)].map((m) => m[1]))];
  const missing = placeholderNames.filter((name) => process.env[name] === undefined);

  console.log("\nZero backend bootstrap\n");
  console.log(`  template       ${TEMPLATE}`);
  console.log(`  output         ${OUTPUT}`);
  console.log(`  mode           ${write ? "WRITE" : "dry run"}`);
  console.log(`  placeholders   ${(placeholderNames.length ? placeholderNames.join(", ") : "none (template is fully resolved)")}`);

  if (missing.length > 0) {
    console.log(`\n  missing env:   ${missing.join(", ")}`);
    console.log("  The config cannot be resolved yet. This is an owner input, not an error.");
    console.log("  Set them in the environment (never in a file) and re-run.\n");
    if (write) {
      console.error("Refusing to write a config with unresolved placeholders.");
      process.exit(2);
    }
    process.exit(0);
  }

  const resolvedText = subst(raw);
  let config;
  try {
    config = JSON.parse(resolvedText);
  } catch (err) {
    console.error(`\n  Resolved config does not parse as JSON: ${err.message}`);
    process.exit(2);
  }

  const leftover = [...resolvedText.matchAll(PLACEHOLDER_RE)].map((m) => m[1]);
  if (leftover.length > 0) {
    console.error(`\n  Unresolved placeholders remain: ${leftover.join(", ")}`);
    process.exit(2);
  }

  const agents = Object.keys(config?.agents?.entries ?? {});

  console.log("\n  resolved:");
  console.log(`    agents         ${agents.join(", ")}`);
  console.log(`    plugin         ${config?.plugins?.load?.paths?.[0]}`);

  // Guard rails
  if (agents.length !== 1 || agents[0] !== "zero") {
    console.error(`\n  Refusing: expected only zero, found ${agents.join(", ") || "none"}.`);
    process.exit(2);
  }
  if (existsSync(OUTPUT) && !write && !force) {
    console.log("\n  note: an existing zero.json is present and was NOT overwritten (dry run).");
  }

  if (!write) {
    console.log("\n  dry run complete - nothing written. Re-run with --write to apply.\n");
    process.exit(0);
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log(`\n  wrote ${OUTPUT}`);
  console.log("  The file contains no secret: apiKey is an env SecretRef, gateway auth comes from OPENCLAW_GATEWAY_TOKEN.\n");

  if (!existsSync(ENV_EXAMPLE)) {
    const envLines = [
      "# Zero backend runtime environment (names only - never commit values)",
      "# Gateway auth (OpenClaw reads this directly):",
      "OPENCLAW_GATEWAY_TOKEN=",
      "# Isolate Zero runtime state from the user profile:",
      `OPENCLAW_STATE_DIR=${join(BACKEND, ".openclaw")}`,
      `OPENCLAW_CONFIG_PATH=${OUTPUT}`,
      "",
    ].join("\n");
    writeFileSync(ENV_EXAMPLE, envLines, "utf8");
    console.log(`  wrote ${ENV_EXAMPLE}`);
  }
}

main();
