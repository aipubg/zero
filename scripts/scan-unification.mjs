import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// ---- Backend protocol coupling ----
console.log('=== backend references to openclaw protocol tokens ===');
const backendFiles = [];
(function walk(dir, depth = 0) {
  if (depth > 4) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.zero-data', 'zero-system/state'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walk(f, depth + 1); continue; }
    if (/\.(mjs|js)$/.test(e.name)) backendFiles.push(f);
  }
})(ROOT);

const protocolHits = new Map();
for (const f of backendFiles) {
  const c = fs.readFileSync(f, 'utf8');
  for (const m of c.matchAll(/["'`]([^"'`\n]*(?:__openclaw__|x-openclaw|openclaw[./:-])[^"'`\n]*)["'`]/gi)) {
    const rel = path.relative(ROOT, f);
    const key = m[1];
    if (!protocolHits.has(key)) protocolHits.set(key, new Set());
    protocolHits.get(key).add(rel);
  }
}
for (const [k, files] of [...protocolHits.entries()].sort()) {
  console.log(`  ${JSON.stringify(k)}`);
  console.log(`      ${[...files].join(', ')}`);
}

// ---- core/ import surface ----
console.log('\n=== who imports from core/ ===');
const coreImports = new Map();
for (const f of backendFiles) {
  const c = fs.readFileSync(f, 'utf8');
  for (const m of c.matchAll(/from\s+["']([^"']*\/core\/[^"']+)["']/g)) {
    const target = m[1];
    if (!coreImports.has(target)) coreImports.set(target, new Set());
    coreImports.get(target).add(path.relative(ROOT, f));
  }
}
for (const [k, files] of [...coreImports.entries()].sort()) {
  console.log(`  ${k}`);
  console.log(`      ${[...files].join(', ')}`);
}

// ---- core/ contents ----
console.log('\n=== core/ tree ===');
(function walk(dir, depth = 0) {
  if (depth > 3) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) {
      console.log(`  ${'  '.repeat(depth)}${e.name}/`);
      walk(f, depth + 1);
    } else {
      console.log(`  ${'  '.repeat(depth)}${e.name} (${fs.statSync(f).size})`);
    }
  }
})(path.join(ROOT, 'core'));
