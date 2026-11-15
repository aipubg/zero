import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Rename backend/plugin/zero.plugin.json -> backend/plugin/zero-plugin.json
const f1 = path.join(root, 'backend', 'plugin', 'zero.plugin.json');
const f2 = path.join(root, 'backend', 'plugin', 'zero-plugin.json');
if (fs.existsSync(f1)) {
  fs.renameSync(f1, f2);
  console.log('renamed backend/plugin/zero.plugin.json');
}

// Check app/zero-control-ui/zero.plugin.json
const f3 = path.join(root, 'app', 'zero-control-ui', 'zero.plugin.json');
if (fs.existsSync(f3)) {
  const f4 = path.join(root, 'app', 'zero-control-ui', 'zero.plugin.json');
  fs.renameSync(f3, f4);
  console.log('renamed app/zero-control-ui/zero.plugin.json');
}
