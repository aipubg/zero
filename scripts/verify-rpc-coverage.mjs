#!/usr/bin/env node
/**
 * Verify that every RPC method the gateway advertises is actually reachable.
 *
 * A method is reachable when it has an explicit case in the dispatch switch,
 * is handled by a delegated module (plugins-ui / skills-ui), or is one of the
 * documented shared methods. Anything else would surface as
 * "Method '...' not found on Zero Native Gateway" at runtime.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const gateway = fs.readFileSync(path.join(ROOT, 'services', 'host', 'native-gateway.mjs'), 'utf8');
const pluginsUi = fs.readFileSync(path.join(ROOT, 'services', 'host', 'plugins-ui.mjs'), 'utf8');
const skillsUi = fs.readFileSync(path.join(ROOT, 'services', 'host', 'skills-ui.mjs'), 'utf8');

// The advertised method list.
const start = gateway.indexOf('const supportedMethods');
const open = gateway.indexOf('[', start);
let depth = 0, end = open;
for (let i = open; i < gateway.length; i++) {
  if (gateway[i] === '[') depth++;
  else if (gateway[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
}
const advertised = [...gateway.slice(open, end).matchAll(/'([a-zA-Z0-9._-]+)'/g)].map(m => m[1]);

// Every case label in the dispatch switch.
const cases = new Set([...gateway.matchAll(/case\s+'([a-zA-Z0-9._-]+)'\s*:/g)].map(m => m[1]));

// Methods handled by the delegated UI modules.
const delegated = new Set();
for (const src of [pluginsUi, skillsUi]) {
  for (const m of src.matchAll(/'([a-zA-Z0-9._-]+)'/g)) delegated.add(m[1]);
}

const missing = [];
for (const method of advertised) {
  if (cases.has(method)) continue;
  if (delegated.has(method)) continue;
  missing.push(method);
}

console.log(`advertised methods: ${advertised.length}`);
console.log(`explicit cases:    ${cases.size}`);
console.log(`delegated methods: ${delegated.size}`);

if (missing.length) {
  console.log(`\n=== ${missing.length} advertised methods with no handler ===`);
  for (const m of missing) console.log(`  ${m}`);
  process.exit(1);
}
console.log('\nEvery advertised method resolves to a handler.');
