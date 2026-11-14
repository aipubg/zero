#!/usr/bin/env node
// Build the native Control UI contribution.
// Writes an immutable generation directory and updates both manifests; it does
// not reload the Gateway, mutate config/secrets or publish anything live.

import { build } from "esbuild";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));

const ZERO_ORBITAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Zero">
  <defs>
    <linearGradient id="z" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="#080b10"/>
  <ellipse cx="32" cy="32" rx="13" ry="22" transform="rotate(28 32 32)" fill="none" stroke="url(#z)" stroke-width="3"/>
  <circle cx="32" cy="32" r="7" fill="url(#z)"/>
  <circle cx="50" cy="20" r="2.5" fill="#10b981"/>
</svg>
`;

function replaceVisibleBranding(value) {
  return String(value)
    .replace(/Install Zero Control/gi, "Install Zero")
    .replace(/Zero Control/gi, "Zero Control")
    .replace(/Ask Zero/gi, "Ask Zero")
    .replace(/Zero documentation/gi, "Zero AI documentation")
    .replace(/Choose how Zero/gi, "Choose how Zero")
    .replace(/Crabbox/gi, "Zero Cloud")
    .replace(/Zero/g, "Zero")
    .replace(/zero\.app/gi, "zero.local");
}

function rewriteHtmlBranding(html) {
  const segments = String(html).split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/i);
  return segments.map((segment, index) => {
    if (index % 2 === 1) return segment;
    let next = segment.replace(/>([^<>]*)</g, (_match, text) => `>${replaceVisibleBranding(text)}<`);
    next = next.replace(/\b(aria-label|title|placeholder|alt)="([^"]*)"/gi,
      (_match, attribute, text) => `${attribute}="${replaceVisibleBranding(text)}"`);
    // Replace custom element tag names (openclaw-* -> zero-*) so they match
    // the scrubbed JS bundle definitions (e.g. <openclaw-app> -> <zero-app>).
    next = next.replace(/<\/?openclaw-([a-z-]+)(\s[^>]*)?>/gi, (match, tagName, attrs) => {
      const isClosing = match.startsWith('</');
      return `${isClosing ? '</' : '<'}zero-${tagName}${attrs || ''}>`;
    });
    return next;
  }).join("");
}

/** Replace remaining user-visible upstream branding in the served app. */
function rewriteServedBranding(distWeb) {
  const htmlPath = join(distWeb, "index.html");
  if (existsSync(htmlPath)) {
    let html = rewriteHtmlBranding(readFileSync(htmlPath, "utf8"));
    html = html.replace(/<link rel="icon"[^>]*>/gi, '<link rel="icon" type="image/svg+xml" href="./favicon.svg" />');
    html = html.replace(/<link rel="apple-touch-icon"[^>]*>/gi, '<link rel="apple-touch-icon" href="./favicon.svg" />');
    writeFileSync(htmlPath, html);
  }

  writeFileSync(join(distWeb, "favicon.svg"), ZERO_ORBITAL_SVG);

  for (const manifestName of ["manifest.webmanifest", "manifest.json"]) {
    const manifestPath = join(distWeb, manifestName);
    if (!existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (typeof manifest.name === "string") manifest.name = replaceVisibleBranding(manifest.name);
      if (typeof manifest.short_name === "string") manifest.short_name = replaceVisibleBranding(manifest.short_name);
      if (typeof manifest.description === "string") manifest.description = replaceVisibleBranding(manifest.description);
      manifest.icons = [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }];
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    } catch {}
  }

  const assetsDir = join(distWeb, "assets");
  if (!existsSync(assetsDir)) return;
  for (const name of readdirSync(assetsDir)) {
    if (!name.endsWith(".js")) continue;
    const file = join(assetsDir, name);
    try {
      const source = readFileSync(file, "utf8");
      if (!source.includes("Zero")) continue;
      const branded = source
        .replace(/Install Zero Control/gi, "Install Zero")
        .replace(/Zero Control/gi, "Zero Control")
        .replace(/Ask Zero/gi, "Ask Zero")
        .replace(/Zero documentation/gi, "Zero AI documentation")
        .replace(/Choose how Zero/gi, "Choose how Zero")
        .replace(/Crabbox/gi, "Zero Cloud")
        .replaceAll("Zero", "Zero");
      if (branded !== source) writeFileSync(file, branded);
    } catch {}
  }
}
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

  // First-party root asset bundles
  const assetsDir = join(repoDistWeb, "assets");
  mkdirSync(assetsDir, { recursive: true });
  copyFileSync(join(scratch, "index.js"), join(assetsDir, "zero-control-ui.js"));
  copyFileSync(join(scratch, "index.css"), join(assetsDir, "zero-control-ui.css"));

  // Also sync to fallback node_modules root if present
  const fallbackAssetsDir = resolve(root, "..", "..", "backend", "node_modules", "zero", "dist", "control-ui", "assets");
  try {
    mkdirSync(fallbackAssetsDir, { recursive: true });
    copyFileSync(join(scratch, "index.js"), join(fallbackAssetsDir, "zero-control-ui.js"));
    copyFileSync(join(scratch, "index.css"), join(fallbackAssetsDir, "zero-control-ui.css"));
  } catch {}

  rewriteServedBranding(repoDistWeb);

  console.log(`generation: ${generation}`);
  console.log(`entry:      ${controlUi.entry} (${js.length} bytes)`);
  console.log(`styles:     ${controlUi.styles[0]} (${css.length} bytes)`);
  console.log(`synced to:  dist/web/plugins/control-ui/zero-control-ui/${generation}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
