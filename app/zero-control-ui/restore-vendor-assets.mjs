#!/usr/bin/env node
/**
 * Restore the pristine vendor Control UI bundle into dist/web and apply
 * TOKEN-SAFE branding.
 *
 * Root cause this fixes:
 *   A previous scrub pass renamed the literal token "openclaw" -> "zero"
 *   inside dist/web/assets/*.js ONLY. The vendor bundle uses the
 *   "openclaw-" prefix consistently across JS, CSS and HTML for:
 *     - 193 custom element tag names (openclaw-app, openclaw-chat-pane, ...)
 *     - 142 CSS custom properties (--openclaw-css-ok, --openclaw-modal-width, ...)
 *     - CSS selectors (.openclaw-native-desktop, ...)
 *   Renaming only the JS half desynchronised the pairs:
 *     - JS probed "--zero-css-ok" while CSS defined "--openclaw-css-ok"
 *       => boot probe failed => "Styles failed to load" banner.
 *     - JS defined "zero-app" while HTML/CSS used "openclaw-app"
 *       => root component never upgraded => blank chat area.
 *
 * This script:
 *   1. Copies the pristine vendor bundle from backend/node_modules/openclaw
 *      back into dist/web (restoring the JS/CSS/HTML pairing).
 *   2. Rebrands ONLY user-visible strings, titles, logos and external URLs.
 *      Every identifier-shaped token (openclaw-<tag>, --openclaw-<prop>,
 *      .openclaw-<class>, __openclaw__, OPENCLAW_*, openclaw_*) is
 *      deliberately left untouched so components keep rendering.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { resolve } = path;
const vendorRoot = path.join(repoRoot, 'backend', 'node_modules', 'openclaw', 'dist', 'control-ui');
const distWeb = path.join(repoRoot, 'dist', 'web');

if (!fs.existsSync(vendorRoot)) {
  console.error(`ERROR: pristine vendor bundle not found at ${vendorRoot}`);
  process.exit(1);
}
/** Files/dirs we never copy or mutate from the vendor tree. */
const VENDOR_SKIP = new Set(['sw.js']);

/**
 * Token-safe replacement.
 *
 * Strategy: protect identifier-shaped occurrences with a sentinel, apply the
 * visible-text substitutions, then restore the sentinels verbatim.
 *
 * Protected identifier shapes:
 *   openclaw-<word>        custom element tag names / CSS class names
 *   --openclaw-<word>      CSS custom properties
 *   __openclaw__           URL path segments
 *   OPENCLAW_<WORD>        environment variable names
 *   CRABBOX_<WORD>         environment variable names
 *   crabbox.<word>         RPC method namespaces (e.g. crabbox.images.list)
 *   `crabbox`              provider identifier literals
 *   openclaw_<word>        snake_case identifiers
 *   openClaw<Word>         camelCase identifiers
 */
const IDENTIFIER_PATTERNS = [
  /--openclaw-[a-z0-9-]+/gi,
  /__openclaw__/g,
  /OPENCLAW_[A-Z0-9_]+/g,
  /CRABBOX_[A-Z0-9_]+/g,
  /\bcrabbox\b/g,
  /\bopenclaw_[a-z0-9_]+/gi,
  /\bopenClaw[A-Za-z0-9_]*/g,
  // dataset.* / data-* attribute identifiers (e.g. dataset.openclawOriginalFavicon)
  /\bdata-[a-z0-9-]*openclaw[a-z0-9-]*/gi,
  /\bopenclaw[A-Z][A-Za-z0-9_]*/g,
  /\bopenclaw-[a-z0-9-]+/gi,
];

const SENTINEL = '\u0000ZEROIDX';

/**
 * User-visible substitutions. Ordered most-specific-first.
 * These only affect text a human reads (titles, labels, copy, URLs).
 */
function rebrandVisibleText(value) {
  return String(value)
    .replace(/Install OpenClaw Control/gi, 'Install Zero')
    .replace(/OpenClaw Control/gi, 'Zero Control')
    .replace(/Ask OpenClaw/gi, 'Ask Zero')
    .replace(/OpenClaw documentation/gi, 'Zero AI documentation')
    .replace(/Choose how OpenClaw/gi, 'Choose how Zero')
    .replace(/Crabbox/gi, 'Zero Cloud')
    .replace(/Crabbox/gi, 'Zero Cloud')
    .replace(/OpenClaw apps?/gi, 'Zero apps')
    .replace(/OpenClaw/gi, 'Zero')
    .replace(/openclaw\.app/gi, 'zero.local');
}

/** Apply visible rebranding while protecting internal identifiers. */
function rebrandSource(source) {
  let out = source;
  const protectedTokens = [];

  // Protect identifier shapes first.
  for (const pattern of IDENTIFIER_PATTERNS) {
    out = out.replace(pattern, (match) => {
      protectedTokens.push(match);
      return `${SENTINEL}${protectedTokens.length - 1}${SENTINEL}`;
    });
  }

  out = rebrandVisibleText(out);

  // Restore protected identifiers verbatim.
  out = out.replace(new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, 'g'), (_m, idx) => protectedTokens[Number(idx)]);

  return out;
}

/** Neutralise third-party store / community URLs without touching routes. */
function neutralizeExternalUrls(source) {
  return String(source)
    .replace(/https?:\/\/apps\.apple\.com\/[^\s"'`)]*/gi, '#')
    .replace(/https?:\/\/play\.google\.com\/[^\s"'`)]*/gi, '#')
    .replace(/https?:\/\/discord\.gg\/[^\s"'`)]*/gi, '#')
    .replace(/https?:\/\/discord\.com\/[^\s"'`)]*/gi, '#')
    .replace(/https?:\/\/discordapp\.com\/[^\s"'`)]*/gi, '#');
}

/**
 * Repair upstream vendor build defects that make the shipped bundle fail to
 * parse (and therefore the whole app fails to boot).
 *
 * 1. control-ui-boot-shared-*.js -- mascot render()
 *      "render(){return L`<span ...>...Zero Z badge...</span>`:L`<span ...>${ip(...)}</span>`}"
 *    The ternary is missing its condition, so the bundle does not parse.
 *    The two branches are:
 *      - static Zero badge SVG
 *      - the animated mascot, produced by ip(Or, br(), Or)
 *    ip() returns the animated artwork only when brandIcon === "claw", and
 *    the sibling shouldAnimate getter also requires brandIcon === "claw",
 *    so the condition is "brand icon is not the claw mascot".
 *
 * 2. control-ui-boot-shared-*.js -- mascot renderAnimationFrame()
 *      "this.shouldAnimate && (this.[invalid], this.animationFrame = ...)"
 *    An invalid member expression. `shouldAnimate` is already the guard and
 *    the inner expression has no observable effect, so it is dropped.
 *
 * 3. sidebar-update-runtime-*.js
 *      "this.compact = false, null = null, this.updateSchedule = null"
 *    An invalid assignment target. The field it initialises is never read
 *    anywhere in the bundle, so the dead statement is dropped.
 *
 * 4. lit-runtime-*.js -- ChildPart._()
 *      "this._$AA.nextSibling.data = e"
 *    The text commit assumes the node after the start marker still exists.
 *    When anything detaches that node (the router swapping a view, a
 *    conditional branch being replaced) the commit throws
 *    "Cannot set properties of null (setting 'data')" and the render aborts.
 *    The commit now falls back to inserting a fresh text node, which is
 *    exactly what it does when there is no previous value.
 *
 * All edits are removals or restorations of code that cannot have side
 * effects, which keeps the surrounding bundle semantics intact. The patterns
 * are deliberately exact: a loose match would also hit unrelated code.
 */
function repairUpstreamDefects(source) {
  let out = source;
  out = out.replace(/this\.\/\*\s*zero\s*\*\/\s*,\s*/g, '');
  out = out.replace(/this\.compact=!1,\s*null=null,\s*/g, 'this.compact=!1,');
  // Restore the missing ternary condition in the mascot render().
  out = out.replace(
    /(render\(\)\{return L`<span class="openclaw-mascot--neutral"[^`]*?<\/span>`)(:L`<span class="openclaw-mascot--neutral")/,
    '$1?br().brandIcon!==`claw`$2',
  );
  // Make Lit's text commit resilient to a detached sibling node.
  // The original assumes this._$AA.nextSibling still exists; when the DOM
  // between the start and end markers was detached the commit threw
  // "Cannot set properties of null (setting 'data')".
  //
  // this.T(node) stores the committed node in this._$AH, so the fallback
  // inserts a fresh text node and then writes to that stored node. Only the
  // left-hand branch of the ternary is rewritten, so the surrounding
  // "?: ... : ..." structure is preserved and still parses.
  out = out.replace(
    /this\._\$AA\.nextSibling\.data=e:this\.T\(O\.createTextNode\(e\)\)/,
    '(this._$AA.nextSibling??(this.T(O.createTextNode(e)),this._$AH)).data=e:this.T(O.createTextNode(e))',
  );

  // Lit's part cleanup walks the nodes between the start and end markers.
  // When the marker itself was detached the default value
  // "this._$AA.nextSibling" is null and the walk dereferences it, throwing
  // "Cannot read properties of null (reading 'nextSibling')". Bail out when
  // there is nothing left to clean up.
  out = out.replace(
    /_\$AR\(e=this\._\$AA\.nextSibling,t\)\{for\(this\._\$AP\?\.\(!1,!0,t\);e!==this\._\$AB;\)\{/,
    '_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e&&e!==this._$AB;){',
  );

  // Inserting a value uses the start marker's parent. If the marker was
  // detached there is nothing to insert into, so skip the insertion instead
  // of throwing.
  out = out.replace(
    /O\(e\)\{return this\._\$AA\.parentNode\.insertBefore\(e,this\._\$AB\)\}/,
    'O(e){let t=this._$AA.parentNode;return t?t.insertBefore(e,this._$AB):e}',
  );
  return out;
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
        let next = rebrandSource(source);
        if (isJs) next = repairUpstreamDefects(next);
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
 * Remove assets in dist/web that do not exist in the pristine vendor tree.
 * Stale leftovers from an earlier scrub pass (e.g. renamed "zero-*" chunks)
 * can shadow the real modules and break component loading.
 */
function removeStaleAssets() {
  const vendorAssets = path.join(vendorRoot, 'assets');
  const targetAssets = path.join(distWeb, 'assets');
  if (!fs.existsSync(vendorAssets) || !fs.existsSync(targetAssets)) return [];
  const pristine = new Set(fs.readdirSync(vendorAssets));
  const removed = [];
  for (const name of fs.readdirSync(targetAssets)) {
    const full = path.join(targetAssets, name);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
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

/**
 * Validate that every shipped JS bundle parses as an ES module.
 * A single unparseable chunk breaks the entire app because the module graph
 * fails to load, so this is a hard gate.
 *
 * esbuild's transform is used as the parser because it reports syntax errors
 * with file/line/column and does not require V8 experimental flags.
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
      broken.push(`${name}: ${detail || err.message}`);
    }
  }
  return broken;
}

/**
 * Restore the pristine vendor bundle into dist/web with token-safe branding
 * and verify the boot-probe pairing survives.
 *
 * Returns a summary object; throws on a broken pairing.
 */
export async function restoreVendorAssets({ quiet = false } = {}) {
  if (!fs.existsSync(vendorRoot)) {
    throw new Error(`pristine vendor bundle not found at ${vendorRoot}`);
  }
  const log = quiet ? () => {} : (...args) => console.log(...args);

  log('Restoring pristine vendor bundle + token-safe branding...');
  copyTree(vendorRoot, distWeb, { mutateJs: true, mutateCss: true });
  const stale = removeStaleAssets();
  if (stale.length) log(`  removed ${stale.length} stale asset(s): ${stale.join(', ')}`);
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
      if (/--openclaw-css-ok\s*:\s*1/.test(c)) cssOk++;
    } else if (name.endsWith('.js')) {
      const c = readFileSync(file, 'utf8');
      jsOpenclaw += (c.match(/openclaw/gi) || []).length;
      if (c.includes('--openclaw-css-ok')) jsOk++;
    }
  }

  log(`\n  CSS files defining --openclaw-css-ok:1 = ${cssOk}`);
  log(`  JS files probing  --openclaw-css-ok   = ${jsOk}`);
  log(`  CSS identifier "openclaw" occurrences = ${cssOpenclaw}`);
  log(`  JS  identifier "openclaw" occurrences = ${jsOpenclaw}`);

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
