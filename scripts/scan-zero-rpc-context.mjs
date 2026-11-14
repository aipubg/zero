import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist', 'web', 'assets');
for (const name of fs.readdirSync(DIST)) {
  if (!name.endsWith('.js') || name.includes('.br') || name.includes('.gz')) continue;
  const c = fs.readFileSync(path.join(DIST, name), 'utf8');
  for (const needle of ['Zero.chat`', 'Zero.chat.history`', 'Zero.setup.detect`', 'Zero.changes.list`']) {
    let i = c.indexOf('request(`' + needle);
    if (i === -1) continue;
    // Show the enclosing function name for context.
    const before = c.slice(Math.max(0, i - 3000), i);
    const fn = [...before.matchAll(/function\s+([A-Za-z0-9_$]+)\s*\(/g)].pop();
    const cls = [...before.matchAll(/class\s+([A-Za-z0-9_$]+)/g)].pop();
    console.log(`\n=== ${name} :: ${needle} ===`);
    console.log(`  nearest fn: ${fn ? fn[1] : '?'}   nearest class: ${cls ? cls[1] : '?'}`);
    console.log('  ' + JSON.stringify(c.slice(Math.max(0, i - 320), i + 200)));
  }
}
