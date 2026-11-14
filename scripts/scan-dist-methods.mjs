import fs from 'node:fs';
import path from 'node:path';

// What the CURRENT served bundle requests.
const DIST = path.join(process.cwd(), 'dist', 'web', 'assets');
const requested = new Map();
for (const name of fs.readdirSync(DIST)) {
  if (!name.endsWith('.js') || name.includes('.br') || name.includes('.gz')) continue;
  const c = fs.readFileSync(path.join(DIST, name), 'utf8');
  for (const m of c.matchAll(/request\(\s*`([^`]+)`/g)) requested.set(m[1], (requested.get(m[1]) || 0) + 1);
  for (const m of c.matchAll(/request\(\s*"([^"]+)"/g)) requested.set(m[1], (requested.get(m[1]) || 0) + 1);
}
const distMethods = [...requested.keys()].sort();
console.log(`current dist requests ${distMethods.length} distinct methods`);

// The gateway's advertised list.
const gw = fs.readFileSync('E:\\zero\\services\\host\\native-gateway.mjs', 'utf8');
const start = gw.indexOf('const supportedMethods');
const open = gw.indexOf('[', start);
let depth = 0, end = open;
for (let i = open; i < gw.length; i++) {
  if (gw[i] === '[') depth++;
  else if (gw[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
}
const advertised = new Set([...gw.slice(open, end).matchAll(/'([a-zA-Z0-9._-]+)'/g)].map(m => m[1]));
const caseLabels = new Set([...gw.matchAll(/case\s+'([a-zA-Z0-9._-]+)'\s*:/g)].map(m => m[1]));

console.log('\n=== requested by the UI but NOT handled by the gateway ===');
let n = 0;
for (const m of distMethods) {
  if (caseLabels.has(m)) continue;
  if (advertised.has(m)) continue;
  n++;
  console.log(`  ${m}  (requested x${requested.get(m)})`);
}
console.log(`  total: ${n}`);
