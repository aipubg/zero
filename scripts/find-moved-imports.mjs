import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'dist', '.zero-data', 'vendor', 'zero-system/state']);

// Old path -> new path
const MOVES = {
  'core/execution/browser_automation.mjs': 'packages/capability-engine/browser-control.mjs',
  'core/execution/os_controller.mjs': 'packages/capability-engine/computer-control.mjs',
  'core/perception/uia_root_tree.mjs': 'packages/capability-engine/computer-control.mjs',
  'core/perception/screen_vision.mjs': 'packages/capability-engine/computer-control.mjs',
  'core/agent/unified_loop.mjs': 'packages/capability-engine/memory-planner.mjs',
  'packages/capability-engine/local-tools.mjs': 'packages/capability-engine/terminal-ops.mjs',
};

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { yield* walk(f); continue; }
    if (/\.(mjs|js)$/.test(e.name)) yield f;
  }
}

const hits = [];
for (const file of walk(ROOT)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const [oldPath, newPath] of Object.entries(MOVES)) {
    // Match a relative import that resolves to the old path.
    const re = new RegExp(`from\\s+['"]([^'"]*)['"]`, 'g');
    for (const m of source.matchAll(re)) {
      const spec = m[1];
      if (!spec.startsWith('.')) continue;
      const resolved = path.relative(ROOT, path.resolve(path.dirname(file), spec)).replace(/\\/g, '/');
      if (resolved === oldPath) {
        hits.push({ file: path.relative(ROOT, file), spec, resolved, newPath, index: m.index });
      }
    }
  }
  // Also flag the named import symbols that moved.
  for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    if (!/browser_automation|os_controller|uia_root_tree|screen_vision|unified_loop|local-tools/.test(m[2])) continue;
    hits.push({ file: path.relative(ROOT, file), spec: m[2], resolved: m[2], newPath: '?', index: m.index, symbols: m[1] });
  }
}

console.log('=== import references to the moved modules ===');
for (const h of hits) {
  console.log(`  ${h.file}`);
  console.log(`      ${h.spec}  ->  ${h.newPath}`);
  if (h.symbols) console.log(`      symbols: ${h.symbols.replace(/\s+/g, ' ').slice(0, 120)}`);
}
console.log(`\ntotal: ${hits.length}`);
