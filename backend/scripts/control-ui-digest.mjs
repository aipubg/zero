#!/usr/bin/env node
// Reproduce the Gateway's Control UI plugin revision digest for a local plugin.
//
// Mirrors the installed release's snapshotBrowserBuild (dist/control-ui-plugin-assets-DG79lyrs.mjs)
// and readPluginControlUiAssets (dist/control-ui-assets-CFCf9kiS.mjs). Read-only: no Gateway call,
// no network, no config change.
//
// Run: node backend/scripts/control-ui-digest.mjs [--root app/zero-control-ui] [--expect <hex>] [--json]

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";

const ASSET_RE = /^(?:[\w-][\w.-]*\/)*[\w-][\w.-]*\.(?:m?js|css)$/u;
const MAX_BUILD_BYTES = 8388608;
const MAX_DEPTH = 8;
const MAX_ENTRIES = 128;

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node backend/scripts/control-ui-digest.mjs [--root <plugin-dir>] [--expect <sha256>] [--json]");
  process.exit(0);
}
const json = args.includes("--json");
function take(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const root = resolve(take("--root", "app/zero-control-ui"));
const expect = take("--expect", null);
const manifestPath = join(root, "openclaw.plugin.json");

if (!existsSync(manifestPath)) {
  console.error(`manifest not found: ${manifestPath}`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const declaration = manifest.controlUi;
if (!declaration || typeof declaration.entry !== "string" || declaration.entry.length === 0) {
  console.error("manifest has no controlUi.entry");
  process.exit(2);
}
const uiCapabilities = manifest.uiCapabilities;
const assetDir = posix.dirname(declaration.entry);
const assetRoot = join(root, ...assetDir.split("/"));

const assets = new Map();
let entries = 0;
function walk(dir, depth) {
  if (depth > MAX_DEPTH) throw new Error("asset directory exceeds max depth");
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    entries += 1;
    if (entries > MAX_ENTRIES) throw new Error("asset directory exceeds max entries");
    if (entry.isSymbolicLink()) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, depth + 1);
      continue;
    }
    if (!entry.isFile()) continue;
    const name = relative(assetRoot, absolute).split(sep).join("/");
    if (!ASSET_RE.test(name)) continue;
    const body = readFileSync(absolute);
    assets.set(name, body);
  }
}
walk(assetRoot, 0);

const totalBytes = [...assets.values()].reduce((sum, body) => sum + body.length, 0);
if (totalBytes > MAX_BUILD_BYTES) {
  console.error(`browser build exceeds ${MAX_BUILD_BYTES} bytes`);
  process.exit(2);
}
const entryName = posix.basename(declaration.entry);
const styles = (declaration.styles ?? []).map((style) => posix.relative(assetDir, style));
for (const name of [entryName, ...styles]) {
  if (!assets.has(name)) {
    console.error(`declared browser asset missing: ${name}`);
    process.exit(2);
  }
}

const digest = createHash("sha256").update(JSON.stringify({ declaration, uiCapabilities }));
for (const [name, body] of [...assets].toSorted(([left], [right]) => left.localeCompare(right))) {
  digest.update(`${name}\0${body.length}\0`).update(body);
}
const revision = digest.digest("hex");
const ok = expect === null || expect === revision;
const result = {
  root,
  declaration,
  uiCapabilities,
  entry: entryName,
  styles,
  assets: [...assets].toSorted(([left], [right]) => left.localeCompare(right)).map(([name, body]) => ({ name, bytes: body.length })),
  totalBytes,
  revision,
  ...(expect ? { expect, ok } : {}),
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`root:       ${root}`);
  console.log(`entry:      ${entryName}`);
  console.log(`styles:     ${styles.join(", ") || "(none)"}`);
  console.log(`assets:     ${result.assets.map((a) => `${a.name}=${a.bytes}`).join(", ")}`);
  console.log(`totalBytes: ${totalBytes}`);
  console.log(`revision:   ${revision}`);
  if (expect) console.log(`expect:     ${expect} (${ok ? "match" : "MISMATCH"})`);
}
process.exit(ok ? 0 : 1);
