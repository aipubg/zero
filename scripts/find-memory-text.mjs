import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.zero-data', 'vendor']);

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (/\.(mjs|js|html)$/.test(e.name)) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('needs attention')) console.log(full);
      } catch {}
    }
  }
  return files;
}
walk('E:\\zero');
