import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const f = path.join(process.cwd(), 'services', 'host', 'native-gateway.mjs');
const s = fs.readFileSync(f, 'utf8');

try {
  new vm.SourceTextModule(s);
  console.log('native-gateway.mjs parses OK');
} catch (e) {
  console.log('PARSE ERROR:', e.message);
}

const required = [
  'sessions.usage', 'sessions.usage.timeseries', 'sessions.usage.logs',
  'sessions.catalog.list', 'taskSuggestions.list', 'push.web.preferences.get',
  'systems.list', 'desktop.status', 'system.info', 'devices.list', 'device.pair.list',
  'gateway.ping', 'gateway.activity', 'update.status', 'users.prefs.set',
  'environments.list', 'node.list', 'approval.history', 'board.get',
  'secrets.store.list',
];
let missing = 0;
for (const m of required) {
  const needle = `case '${m}'`;
  const n = s.split(needle).length - 1;
  if (n === 0) { console.log(`  MISSING: ${m}`); missing++; }
  else if (n > 1) { console.log(`  DUPLICATE: ${m} x${n}`); missing++; }
}

// Methods intercepted by plugins-ui.mjs before the switch is reached.
const ui = fs.readFileSync(path.join(process.cwd(), 'services', 'host', 'plugins-ui.mjs'), 'utf8');
for (const m of ['plugins.catalog.browse', 'plugins.catalog.categories', 'plugins.catalog.get', 'plugins.list']) {
  if (!ui.includes(`'${m}'`)) { console.log(`  MISSING (plugins-ui): ${m}`); missing++; }
}
console.log(missing === 0 ? 'All required handlers present exactly once.' : `${missing} handler problems.`);
