import fs from 'node:fs';
import path from 'node:path';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (/\.(mjs|js)$/.test(e.name)) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        if (/memory.*attention|attention.*memory|memory.*status|memory.*health/i.test(content)) console.log(full);
      } catch {}
    }
  }
  return files;
}
walk('E:\\zero\\app\\zero-control-ui\\src');
walk('E:\\zero\\services\\host');
