import fs from 'node:fs';
import path from 'node:path';

// Remove the upstream package from the backend manifest.
const manifestPath = path.join(process.cwd(), 'backend', 'package.json');
const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (pkg.dependencies?.zero) {
  delete pkg.dependencies.zero;
  fs.writeFileSync(manifestPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log('removed the zero dependency from backend/package.json');
}
console.log('backend dependencies now:', Object.keys(pkg.dependencies || {}).join(', '));

// No backend source may import it any more.
const root = path.join(process.cwd(), 'backend');
const offenders = [];
(function walk(dir, depth = 0) {
  if (depth > 5) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { walk(f, depth + 1); continue; }
    if (!/\.(mjs|js)$/.test(e.name)) continue;
    const c = fs.readFileSync(f, 'utf8');
    if (/from\s+['"][^'"]*zero/.test(c)) offenders.push(path.relative(root, f));
  }
})(root);
console.log('backend sources importing the upstream package:', offenders.length ? offenders.join(', ') : '(none)');
