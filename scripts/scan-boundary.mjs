import fs from 'node:fs';
import path from 'node:path';

const V = 'E:\\zero\\backend\\node_modules\\openclaw\\dist\\control-ui';

// 1. What follows the bare "openclaw." literal?
console.log('=== context of the bare "openclaw." literal ===');
let shown = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    if (!/\.js$/.test(e.name)) continue;
    const c = fs.readFileSync(f, 'utf8');
    let i = c.indexOf('"openclaw."');
    while (i > -1 && shown < 6) {
      console.log(`  ${e.name}: ${JSON.stringify(c.slice(Math.max(0, i - 110), i + 110))}`);
      shown++;
      i = c.indexOf('"openclaw."', i + 1);
    }
  }
})(V);

// 2. Does the gateway read the scope header?
console.log('\n=== gateway scope header handling ===');
const gw = fs.readFileSync('E:\\zero\\services\\host\\native-gateway.mjs', 'utf8');
for (const m of gw.matchAll(/x-[a-z-]*scopes/gi)) {
  console.log(`  ${JSON.stringify(gw.slice(Math.max(0, m.index - 150), m.index + 150))}`);
}
if (!/x-[a-z-]*scopes/i.test(gw)) console.log('  (the gateway does not read a scopes header)');

// 3. RPC method names the bundle calls (request(`...`))
console.log('\n=== RPC methods the bundle requests ===');
const methods = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    if (!/\.js$/.test(e.name)) continue;
    const c = fs.readFileSync(f, 'utf8');
    for (const m of c.matchAll(/request\(\s*`([^`]+)`/g)) methods.set(m[1], (methods.get(m[1]) || 0) + 1);
    for (const m of c.matchAll(/request\(\s*"([^"]+)"/g)) methods.set(m[1], (methods.get(m[1]) || 0) + 1);
  }
})(V);
const openclawMethods = [...methods.keys()].filter(m => /openclaw/i.test(m));
console.log(`  total distinct: ${methods.size}`);
console.log(`  openclaw-prefixed: ${openclawMethods.length ? openclawMethods.join(', ') : '(none)'}`);
