import fs from 'node:fs';
import path from 'node:path';

const V = 'E:\\zero\\backend\\node_modules\\zero\\dist\\control-ui';
const hits = new Map();

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    if (!/\.(js|css|html)$/.test(e.name)) continue;
    const c = fs.readFileSync(f, 'utf8');
    // Any string literal that contains "zero" and looks like a protocol
    // name, route, header, storage key or event channel.
    for (const m of c.matchAll(/["'`]([^"'`\n]*zero[^"'`\n]*)["'`]/gi)) {
      const t = m[1];
      if (t.length > 90) continue;
      hits.set(t, (hits.get(t) || 0) + 1);
    }
  }
}
walk(V);

const sorted = [...hits.entries()].sort((a, b) => b[1] - a[1]);
console.log(`distinct string literals containing "zero": ${sorted.length}\n`);
for (const [k, n] of sorted) {
  if (n < 2 && sorted.length > 60) continue;
  console.log(`  [${String(n).padStart(4)}] ${JSON.stringify(k)}`);
}
