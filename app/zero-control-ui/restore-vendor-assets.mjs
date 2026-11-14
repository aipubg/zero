#!/usr/bin/env node
/**
 * Sync the vendored Control UI into dist/web.
 *
 * The vendor tree in app/zero-control-ui/vendor is the committed, fully
 * rebranded source of truth. It was produced by vendorize.mjs, which rewrote
 * the upstream "openclaw" prefix across HTML, CSS and JavaScript in one
 * pass so that every cross-reference stays paired:
 *
 *   <openclaw-app>            -> <zero-app>
 *   --openclaw-modal-width    -> --zero-modal-width
 *   .openclaw-native-desktop  -> .zero-native-desktop
 *   __openclaw__/plugins/...  -> __zero__/plugins/...
 *
 * This script copies that tree into dist/web and then applies the remaining
 * user-visible substitutions (product titles, external store/community links).
 * It never renames identifiers, because a mismatch between the JS and CSS
 * halves of the bundle breaks component rendering.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { resolve } = path;
const vendorRoot = path.join(repoRoot, 'app', 'zero-control-ui', 'vendor');
const distWeb = path.join(repoRoot, 'dist', 'web');

if (!fs.existsSync(vendorRoot)) {
  console.error(`ERROR: vendored Control UI not found at ${vendorRoot}`);
  console.error('Run "node app/zero-control-ui/vendorize.mjs" to create it.');
  process.exit(1);
}

/** Files/dirs we never copy or mutate from the vendor tree. */
const VENDOR_SKIP = new Set(['sw.js']);

/**
 * User-visible substitutions only.
 *
 * These affect text a human reads (titles, labels, copy) and outbound links.
 * They deliberately do not touch identifiers, because the bundle pairs them
 * across JS, CSS and HTML.
 */
function replaceVisibleBranding(value) {
  return String(value)
    .replace(/Install OpenClaw Control/gi, 'Install Zero')
    .replace(/OpenClaw Control/gi, 'Zero Control')
    .replace(/Ask OpenClaw/gi, 'Ask Zero')
    .replace(/OpenClaw documentation/gi, 'Zero AI documentation')
    .replace(/Choose how OpenClaw/gi, 'Choose how Zero')
    .replace(/Crabbox/gi, 'Zero Cloud')
    .replace(/OpenClaw/gi, 'Zero')
    .replace(/openclaw\.app/gi, 'zero.local');
}

/** Neutralise third-party store / community URLs. */
function neutralizeExternalUrls(source) {
  return String(source)
    .replace(/https?:\/\/apps\.apple\.com\/[^\s"'`)]*/gi, '#')
    .replace(/https?:\/\/play\.google\.com\/[^\s"'`)]*/gi, '#')
    .replace(/https?:\/\/discord\.gg\/[^\s"'`)]*/gi, '#')
    .replace(/https?:\/\/discord\.com\/[^\s"'`)]*/gi, '#')
    .replace(/https?:\/\/discordapp\.com\/[^\s"'`)]*/gi, '#');
}

/**
 * Rewrite the HTML head. The vendor tree is already fully renamed, so the
 * head only needs the product title, icons and manifest.
 */
function rewriteHtmlBranding(html) {
  const segments = String(html).split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/i);
  const rewritten = segments.map((segment, index) => {
    if (index % 2 === 1) return segment;
    let next = segment.replace(/>([^<>]*)</g, (_match, text) => `>${replaceVisibleBranding(text)}<`);
    next = next.replace(/\b(aria-label|title|placeholder|alt)="([^"]*)"/gi,
      (_match, attribute, text) => `${attribute}="${replaceVisibleBranding(text)}"`);
    return next;
  }).join('');
  return rewritten
    .replace(/<link rel="icon"[^>]*>/gi, '<link rel="icon" type="image/svg+xml" href="./favicon.svg" />')
    .replace(/<link rel="apple-touch-icon"[^>]*>/gi, '<link rel="apple-touch-icon" href="./favicon.svg" />');
}

const ZERO_ORBITAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="26" fill="#0b0f14"/>
  <circle cx="60" cy="60" r="38" fill="none" stroke="#10b981" stroke-width="9"/>
  <path d="M60 26 L84 60 L60 94 L36 60 Z" fill="#10b981" opacity="0.9"/>
  <circle cx="60" cy="60" r="11" fill="#0b0f14"/>
</svg>
`;

/**
 * The vendor bundle lists its lazy-loaded chat chunks as
 * "./chat/zero-<name>-<hash>.<ext>" but ships those modules at the top of
 * the asset directory as "custodian-<name>-<hash>.<ext>". The chunk graph is
 * therefore incomplete and any lazy import of them 404s (for example
 * "/assets/chat/chat/zero-alert-store-<hash>.js" once a chunk inside
 * assets/chat is loaded).
 *
 * Each referenced chunk is copied into dist/web/assets/chat under the name
 * the bundle asks for. Because a chunk that now lives in assets/chat would
 * resolve its own "./chat/..." imports one directory too deep, those
 * internal specifiers are rewritten to point at its new siblings. Only the
 * import specifiers change; no identifier inside a module is touched.
 */
function materialiseChatChunks() {
  const vendorAssets = path.join(vendorRoot, 'assets');
  const targetAssets = path.join(distWeb, 'assets');
  const targetChat = path.join(targetAssets, 'chat');
  const written = [];

  const referenced = new Set();
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(js|css|mjs)$/.test(entry.name)) continue;
      if (entry.name.includes('.br') || entry.name.includes('.gz')) continue;
      let source;
      try { source = fs.readFileSync(full, 'utf8'); } catch { continue; }
      for (const m of source.matchAll(/["'`](\.\/chat\/([^"'`]+))["'`]/g)) {
        referenced.add(m[2]);
      }
    }
  };
  walk(targetAssets);

  if (!referenced.size) return written;

  fs.mkdirSync(targetChat, { recursive: true });
  for (const name of referenced) {
    const destination = path.join(targetChat, name);
    // The bundle asks for "zero-<name>"; the vendor ships "custodian-<name>".
    const candidates = [
      name,
      name.replace(/^zero-/, 'custodian-'),
      name.replace(/^zero-/, 'openclaw-'),
    ];
    for (const candidate of candidates) {
      const source = path.join(vendorAssets, candidate);
      if (!fs.existsSync(source) || !fs.statSync(source).isFile()) continue;
      let content = fs.readFileSync(source);
      if (/\.(js|mjs)$/.test(candidate)) {
        content = Buffer.from(
          content.toString('utf8').replace(/(["'`])(\.\/chat\/)/g, '$1./'),
          'utf8',
        );
      }
      const previous = fs.existsSync(destination) ? fs.readFileSync(destination) : null;
      if (previous && previous.equals(content)) break;
      fs.writeFileSync(destination, content);
      written.push(`chat/${name} <- ${candidate}`);
      break;
    }
  }
  return written;
}

/** Remove assets that are not part of the vendored tree. */
function removeStaleAssets() {
  const vendorAssets = path.join(vendorRoot, 'assets');
  const targetAssets = path.join(distWeb, 'assets');
  if (!fs.existsSync(vendorAssets) || !fs.existsSync(targetAssets)) return [];
  const pristine = new Set(fs.readdirSync(vendorAssets));
  const removed = [];
  for (const name of fs.readdirSync(targetAssets)) {
    const full = path.join(targetAssets, name);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (!stat.isFile()) continue;
    // Our own first-party overlay is not part of the vendor tree.
    if (name === 'zero-control-ui.js' || name === 'zero-control-ui.css') continue;
    if (!pristine.has(name)) {
      fs.unlinkSync(full);
      removed.push(name);
    }
  }
  return removed;
}

function copyTree(src, dest, { mutateJs = false, mutateCss = false } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (VENDOR_SKIP.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to, { mutateJs, mutateCss });
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    const isJs = ext === '.js' || ext === '.mjs';
    const isCss = ext === '.css';
    const isHtml = ext === '.html';

    if ((mutateJs && isJs) || (mutateCss && isCss) || isHtml) {
      try {
        const source = fs.readFileSync(from, 'utf8');
        let next = isHtml ? rewriteHtmlBranding(source) : replaceVisibleBranding(source);
        if (isJs || isCss) next = neutralizeExternalUrls(next);
        if (next !== source) fs.writeFileSync(to, next, 'utf8');
        else fs.copyFileSync(from, to);
        continue;
      } catch {
        fs.copyFileSync(from, to);
        continue;
      }
    }
    fs.copyFileSync(from, to);
  }
}

/**
 * Validate that every shipped JS bundle parses as an ES module.
 * A single unparseable chunk breaks the entire app because the module graph
 * fails to load, so this is a hard gate.
 */
async function validateJsSyntax(assetsDir) {
  const { pathToFileURL } = await import('node:url');
  const esbuild = await import(
    pathToFileURL(resolve(repoRoot, 'app', 'zero-control-ui', 'node_modules', 'esbuild', 'lib', 'main.js')).href
  );
  const broken = [];
  for (const name of readdirSync(assetsDir)) {
    if (!name.endsWith('.js') || name.includes('.br') || name.includes('.gz')) continue;
    const file = path.join(assetsDir, name);
    let stat;
    try { stat = statSync(file); } catch { continue; }
    if (!stat.isFile()) continue;
    const source = readFileSync(file, 'utf8');
    try {
      await esbuild.transform(source, { loader: 'js', format: 'esm', sourcefile: name });
    } catch (err) {
      const detail = (err.errors || []).map(e => {
        const loc = e.location;
        return loc ? `${e.text} (${loc.line}:${loc.column})` : e.text;
      }).join('; ');
      broken.push(`${name}: ${detail}`);
    }
  }
  return broken;
}

/**
 * Sync the vendored Control UI into dist/web.
 *
 * Returns a summary object; throws on a broken pairing.
 */
export async function restoreVendorAssets({ quiet = false } = {}) {
  if (!fs.existsSync(vendorRoot)) {
    throw new Error(`vendored Control UI not found at ${vendorRoot}`);
  }
  const log = quiet ? () => {} : (...args) => console.log(...args);

  log('Syncing the vendored Control UI into dist/web...');
  copyTree(vendorRoot, distWeb, { mutateJs: true, mutateCss: true });
  const stale = removeStaleAssets();
  if (stale.length) log(`  removed ${stale.length} stale asset(s): ${stale.join(', ')}`);
  const chatChunks = materialiseChatChunks();
  if (chatChunks.length) log(`  materialised ${chatChunks.length} chat chunk(s): ${chatChunks.join(', ')}`);
  log(`  restored from: ${vendorRoot}`);
  log(`  restored to:   ${distWeb}`);

  const assetsDir = path.join(distWeb, 'assets');
  let cssOk = 0;
  let jsOk = 0;
  let cssOpenclaw = 0;
  let jsOpenclaw = 0;
  for (const name of readdirSync(assetsDir)) {
    if (name.endsWith('.br') || name.endsWith('.gz')) continue;
    const file = path.join(assetsDir, name);
    let stat;
    try { stat = statSync(file); } catch { continue; }
    if (!stat.isFile()) continue;
    if (name.endsWith('.css')) {
      const c = readFileSync(file, 'utf8');
      cssOpenclaw += (c.match(/openclaw/gi) || []).length;
      if (/--zero-css-ok\s*:\s*1/.test(c)) cssOk++;
    } else if (name.endsWith('.js')) {
      const c = readFileSync(file, 'utf8');
      jsOpenclaw += (c.match(/openclaw/gi) || []).length;
      if (c.includes('--zero-css-ok')) jsOk++;
    }
  }

  log(`\n  CSS files defining --zero-css-ok:1 = ${cssOk}`);
  log(`  JS files probing  --zero-css-ok   = ${jsOk}`);
  log(`  CSS residual "openclaw" tokens  = ${cssOpenclaw}`);
  log(`  JS  residual "openclaw" tokens  = ${jsOpenclaw}`);

  if (cssOk === 0 || jsOk === 0) {
    throw new Error('boot-probe pairing broken after restore');
  }
  log('\nBoot probe pairing intact.');

  const broken = await validateJsSyntax(assetsDir);
  if (broken.length) {
    log(`\n  Unparseable JS bundles: ${broken.length}`);
    for (const b of broken) log(`    ${b}`);
    throw new Error(`${broken.length} JS bundle(s) failed to parse`);
  }
  log('  All JS bundles parse as ES modules.');
  return { cssOk, jsOk, cssOpenclaw, jsOpenclaw, stale };
}

// Executed directly.
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  try {
    await restoreVendorAssets();
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}
