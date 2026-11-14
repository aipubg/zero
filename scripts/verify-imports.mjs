import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'dist', '.zero-data', 'vendor', 'zero-system/state']);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { yield* walk(f); continue; }
    if (/\.(mjs|js)$/.test(e.name)) yield f;
  }
}

let broken = 0;
for (const file of walk(ROOT)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const m of source.matchAll(/from\s+(['"])(\.[^'"]+)\1/g)) {
    const target = path.resolve(path.dirname(file), m[2]);
    if (!fs.existsSync(target)) {
      const rel = path.relative(ROOT, file);
      if (rel.startsWith('scripts/')) continue;
      console.log(`BROKEN ${rel} -> ${m[2]}`);
      broken++;
    }
  }
}
console.log(`broken relative imports: ${broken}`);

// Parse every module in the capability engine.
const esbuild = await import(
  pathToFileURL(path.join(ROOT, 'app', 'zero-control-ui', 'node_modules', 'esbuild', 'lib', 'main.js')).href
);
const CAP = path.join(ROOT, 'packages', 'capability-engine');
for (const name of fs.readdirSync(CAP)) {
  if (!name.endsWith('.mjs')) continue;
  const source = fs.readFileSync(path.join(CAP, name), 'utf8');
  try {
    await esbuild.transform(source, { loader: 'js', format: 'esm', sourcefile: name });
    console.log(`OK   packages/capability-engine/${name}`);
  } catch (e) {
    console.log(`FAIL packages/capability-engine/${name}`);
    for (const err of e.errors || []) console.log(`     ${err.text} @${err.location?.line}:${err.location?.column}`);
    broken++;
  }
}
process.exit(broken ? 1 : 0);
