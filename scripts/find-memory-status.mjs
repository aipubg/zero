import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'app', 'zero-control-ui', 'vendor', 'assets');
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.js')) continue;
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  let found = false;
  
  const idx1 = c.indexOf('doctor.memory.status');
  if (idx1 >= 0) {
    console.log('=== ' + f + ' (doctor.memory.status @' + idx1 + ') ===');
    console.log(c.slice(Math.max(0, idx1 - 200), idx1 + 400));
    found = true;
  }
  
  const idx2 = c.indexOf('embedding.ok');
  if (idx2 >= 0) {
    console.log('=== ' + f + ' (embedding.ok @' + idx2 + ') ===');
    console.log(c.slice(Math.max(0, idx2 - 200), idx2 + 400));
    found = true;
  }
  
  const idx3 = c.indexOf('Memory needs attention');
  if (idx3 >= 0) {
    console.log('=== ' + f + ' (Memory needs attention @' + idx3 + ') ===');
    console.log(c.slice(Math.max(0, idx3 - 200), idx3 + 400));
    found = true;
  }
  
  if (found) console.log('---');
}
