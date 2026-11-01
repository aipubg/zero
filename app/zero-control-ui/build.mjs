#!/usr/bin/env node
// Build the native Control UI contribution.
// Writes an immutable generation directory and updates both manifests; it does
// not reload the Gateway, mutate config/secrets or publish anything live.

import { build } from "esbuild";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const sourceManifestPath = join(root, "openclaw.plugin.json");
const distRoot = join(root, "dist");
const distControlUi = join(distRoot, "control-ui");
const scratch = mkdtempSync(join(tmpdir(), "zero-ui-build-"));

try {
  await build({
    absWorkingDir: root,
    entryPoints: [join(root, "browser.js")],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2022"],
    minify: true,
    sourcemap: false,
    outdir: scratch,
    entryNames: "index",
    assetNames: "[name]",
    loader: { ".css": "css" },
    logLevel: "silent",
  });

  const js = readFileSync(join(scratch, "index.js"));
  const css = readFileSync(join(scratch, "index.css"));
  const generation = createHash("sha256")
    .update(js)
    .update("\0")
    .update(css)
    .digest("hex");

  const generationDir = join(distControlUi, generation);
  mkdirSync(generationDir, { recursive: true });
  copyFileSync(join(scratch, "index.js"), join(generationDir, "index.js"));
  copyFileSync(join(scratch, "index.css"), join(generationDir, "index.css"));

  const controlUi = {
    entry: `dist/control-ui/${generation}/index.js`,
    styles: [`dist/control-ui/${generation}/index.css`],
  };

  mkdirSync(distRoot, { recursive: true });
  writeFileSync(
    join(distRoot, "openclaw.plugin.json"),
    `${JSON.stringify({ controlUi }, null, 2)}\n`,
  );

  const manifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
  manifest.controlUi = controlUi;
  writeFileSync(sourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  // Sync built bundle directly to first-party dist/web targets
  const repoDistWeb = resolve(root, "..", "..", "dist", "web");
  const targetPluginDir1 = join(repoDistWeb, "plugins", "control-ui", "zero-control-ui", generation);
  const targetPluginDir2 = join(repoDistWeb, "__openclaw__", "plugins", "control-ui", "zero-control-ui", generation);
  mkdirSync(targetPluginDir1, { recursive: true });
  mkdirSync(targetPluginDir2, { recursive: true });
  copyFileSync(join(scratch, "index.js"), join(targetPluginDir1, "index.js"));
  copyFileSync(join(scratch, "index.css"), join(targetPluginDir1, "index.css"));
  copyFileSync(join(scratch, "index.js"), join(targetPluginDir2, "index.js"));
  copyFileSync(join(scratch, "index.css"), join(targetPluginDir2, "index.css"));

  console.log(`generation: ${generation}`);
  console.log(`entry:      ${controlUi.entry} (${js.length} bytes)`);
  console.log(`styles:     ${controlUi.styles[0]} (${css.length} bytes)`);
  console.log(`synced to:  dist/web/plugins/control-ui/zero-control-ui/${generation}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
