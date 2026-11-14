#!/usr/bin/env node
/**
 * Vendor the Control UI into the Zero repository as standalone, fully
 * rebranded source.
 *
 * The upstream bundle is published under the "openclaw" prefix. This script
 * rewrites that prefix across the HTML, CSS and JavaScript in one pass, so
 * every cross-reference stays paired:
 *
 *   <openclaw-app>              -> <zero-app>
 *   --openclaw-modal-width      -> --zero-modal-width
 *   .openclaw-native-desktop    -> .zero-native-desktop
 *   __openclaw__/plugins/...    -> __zero__/plugins/...
 *   openclaw/settings.json      -> zero/settings.json
 *   notOpenclawRoot             -> notZeroRoot
 *   openClawMemory              -> zeroMemory
 *
 * The result is written to app/zero-control-ui/vendor/ and becomes the only
 * source the build uses, so the project no longer depends on
 * backend/node_modules/openclaw.
 *
 * Run with --check to verify the vendored tree without rewriting it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceRoot = path.join(repoRoot, 'backend', 'node_modules', 'openclaw', 'dist', 'control-ui');
const vendorRoot = path.join(repoRoot, 'app', 'zero-control-ui', 'vendor');

const checkOnly = process.argv.includes('--check');

/** Text files whose contents participate in the cross-reference rewrite. */
const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.css', '.html', '.json', '.webmanifest', '.txt', '.md', '.svg', '.map',
]);

/**
 * Pre-compressed siblings are never served (the gateway does not negotiate
 * content encodings), so they are not vendored.
 */
function isPrecompressed(name) {
  return name.endsWith('.br') || name.endsWith('.gz');
}

/**
 * Ordered token rules. Longest and most specific forms first so a later
 * rule cannot mangle the output of an earlier one.
 *
 * These are plain substring rules on purpose. Word boundaries would miss the
 * underscore and camelCase forms the bundle actually uses, for example
 * "__openclaw__", ".__openclaw", "notOpenclawRoot", "__OPENCLAW_REDACTED__"
 * and "__openclawAgentPath".
 */
const TOKEN_RULES = [
  [/OPENCLAW/g, 'ZERO'],
  [/OpenClaw/g, 'Zero'],
  [/Openclaw/g, 'Zero'],
  [/openClaw/g, 'zero'],
  [/openclaw/g, 'zero'],
  [/CRABBOX/g, 'ZERO'],
  [/Crabbox/g, 'Zero Cloud'],
  [/crabbox/g, 'zero'],
];

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
 * All edits are removals or restorations of code that cannot have side
 * effects. The patterns are deliberately exact: a loose match would also
 * hit unrelated code.
 */
function repairUpstreamDefects(source) {
  let out = source;
  out = out.replace(/this\.\/\*\s*zero\s*\*\/\s*,\s*/g, '');
  out = out.replace(/this\.compact=!1,\s*null=null,\s*/g, 'this.compact=!1,');
  // Restore the missing ternary condition in the mascot render().
  out = out.replace(
    /(render\(\)\{return L`<span class="zero-mascot--neutral"[^`]*?<\/span>`)(:L`<span class="zero-mascot--neutral")/,
    '$1?br().brandIcon!==`claw`$2',
  );
  return out;
}

function transformText(source) {
  let out = source;
  for (const [pattern, replacement] of TOKEN_RULES) out = out.replace(pattern, replacement);
  out = repairUpstreamDefects(out);
  return out;
}

function* walkFiles(dir, base = dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { yield* walkFiles(full, base); continue; }
    yield path.relative(base, full);
  }
}

function isTextFile(rel) {
  const ext = path.extname(rel).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  // Extensionless files (robots.txt style) are text too.
  return ext === '';
}

if (!fs.existsSync(sourceRoot)) {
  console.error(`ERROR: upstream bundle not found at ${sourceRoot}`);
  console.error('The vendored tree in app/zero-control-ui/vendor is the committed source of truth.');
  process.exit(1);
}

// ---------------------------------------------------------------- verify
if (checkOnly) {
  let failures = 0;
  let checked = 0;
  let residual = 0;

  for (const rel of walkFiles(vendorRoot)) {
    if (!isTextFile(rel)) continue;
    const source = fs.readFileSync(path.join(vendorRoot, rel), 'utf8');
    checked++;
    const hits = source.match(/openclaw|crabbox/i);
    if (hits) {
      residual += hits.length;
      const idx = source.search(/openclaw|crabbox/i);
      console.log(`  RESIDUAL ${rel}: ${JSON.stringify(source.slice(Math.max(0, idx - 60), idx + 60))}`);
    }
  }

  // Every custom element the HTML uses must be defined by the bundle.
  const html = fs.readFileSync(path.join(vendorRoot, 'index.html'), 'utf8');
  const tags = new Set([...html.matchAll(/<\/?(zero-[a-z0-9-]+)/gi)].map(m => m[1].toLowerCase()));
  let definitions = '';
  for (const rel of walkFiles(path.join(vendorRoot, 'assets'))) {
    if (!rel.endsWith('.js') || isPrecompressed(rel)) continue;
    definitions += fs.readFileSync(path.join(vendorRoot, 'assets', rel), 'utf8');
  }
  const undefinedTags = [...tags].filter(t => !definitions.includes(`"${t}"`) && !definitions.includes(`'${t}'`) && !definitions.includes(`\`${t}\``));

  console.log(`\ntext files checked: ${checked}`);
  console.log(`residual upstream tokens: ${residual}`);
  console.log(`custom elements in index.html: ${tags.size}`);
  console.log(`undefined custom elements: ${undefinedTags.length ? undefinedTags.join(', ') : '(none)'}`);
  if (residual > 0 || undefinedTags.length) failures++;
  console.log(failures ? '\nVENDOR CHECK FAILED' : '\nVENDOR CHECK PASSED');
  process.exit(failures ? 1 : 0);
}

// -------------------------------------------------------------- vendorize
if (!checkOnly) {
  console.log(`Vendoring ${path.relative(repoRoot, sourceRoot)} -> ${path.relative(repoRoot, vendorRoot)}`);
  fs.rmSync(vendorRoot, { recursive: true, force: true });

  let files = 0;
  let textFiles = 0;
  let bytes = 0;
  const renamed = [];

  for (const rel of walkFiles(sourceRoot)) {
    const from = path.join(sourceRoot, rel);
    const to = path.join(vendorRoot, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });

    if (isPrecompressed(rel)) continue; // never served
    if (path.basename(rel).startsWith('.')) continue;

    if (isTextFile(rel)) {
      const source = fs.readFileSync(from, 'utf8');
      const next = transformText(source);
      fs.writeFileSync(to, next, 'utf8');
      textFiles++;
      bytes += Buffer.byteLength(next);
      if (next !== source) renamed.push(rel);
    } else {
      fs.copyFileSync(from, to);
    }
    files++;
  }

  console.log(`  files: ${files} (${textFiles} transformed)`);
  console.log(`  size:  ${(bytes / 1048576).toFixed(1)} MB of transformed text`);
  console.log(`  rewritten files: ${renamed.length}`);

  // The vendored tree is the committed source of truth, so it must parse.
  const esbuild = await import(
    pathToFileURL(path.join(repoRoot, 'app', 'zero-control-ui', 'node_modules', 'esbuild', 'lib', 'main.js')).href
  );
  const broken = [];
  for (const rel of walkFiles(path.join(vendorRoot, 'assets'))) {
    if (!rel.endsWith('.js') || isPrecompressed(rel)) continue;
    const source = fs.readFileSync(path.join(vendorRoot, 'assets', rel), 'utf8');
    try {
      await esbuild.transform(source, { loader: 'js', format: 'esm', sourcefile: rel });
    } catch (err) {
      broken.push(`${rel}: ${(err.errors || []).map(e => `${e.text} @${e.location?.line}:${e.location?.column}`).join('; ')}`);
    }
  }
  if (broken.length) {
    console.error(`\nERROR: ${broken.length} vendored bundle(s) do not parse:`);
    for (const b of broken) console.error(`  ${b}`);
    process.exit(1);
  }
  console.log('  every vendored bundle parses as an ES module');
}
