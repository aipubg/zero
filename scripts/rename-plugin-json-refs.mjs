import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = [
  'services/host/native-gateway.mjs',
  'backend/scripts/apply-zero-branding.mjs',
  'packages/plugin-sdk/source-loader.mjs',
  'test/functional-browser-options.test.mjs',
  'backend/plugin/selftest.mjs',
  'backend/scripts/preflight.mjs',
  'backend/scripts/control-ui-digest.mjs',
  'app/zero-control-ui/build.mjs',
  'app/zero-control-ui/policy/index.js',
  'app/zero-control-ui/test/bridge.test.mjs',
  'app/zero-control-ui/test/verify-served.mjs',
  'app/zero-control-ui/test/product-surface.test.mjs',
  'app/zero-control-ui/test/observation-tool.test.mjs',
];

let changedFiles = 0;
for (const rel of FILES) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) continue;
  const source = fs.readFileSync(f, 'utf8');
  const original = source;
  const updated = source.replace(/zero\.plugin\.json/g, 'zero.plugin.json');
  if (updated !== original) {
    fs.writeFileSync(f, updated, 'utf8');
    changedFiles++;
    console.log(`updated ${rel}`);
  }
}
console.log(`\n${changedFiles} file(s) updated`);
