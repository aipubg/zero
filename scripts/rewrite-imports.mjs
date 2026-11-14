import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'dist', '.zero-data', 'vendor', 'zero-system/state']);

/** Old module path -> the module that now provides its symbols. */
const TARGETS = {
  'core/execution/browser_automation.mjs': 'packages/capability-engine/browser-control.mjs',
  'core/execution/os_controller.mjs': 'packages/capability-engine/computer-control.mjs',
  'core/perception/uia_root_tree.mjs': 'packages/capability-engine/computer-control.mjs',
  'core/perception/screen_vision.mjs': 'packages/capability-engine/computer-control.mjs',
  'core/agent/unified_loop.mjs': 'packages/capability-engine/memory-planner.mjs',
  'packages/capability-engine/local-tools.mjs': 'packages/capability-engine/terminal-ops.mjs',
  'app/zero-control-ui/src/computer/operator.js': 'packages/capability-engine/computer-operator.mjs',
  'app/zero-control-ui/src/computer/observation-coordinator.js': 'packages/capability-engine/observation-coordinator.mjs',
  'app/zero-control-ui/src/computer/windows-driver.js': 'packages/capability-engine/windows-driver.mjs',
};

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { yield* walk(f); continue; }
    if (/\.(mjs|js)$/.test(e.name)) yield f;
  }
}

function relativeSpecifier(fromFile, targetPath) {
  let rel = path.relative(path.dirname(fromFile), path.join(ROOT, targetPath)).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

let changedFiles = 0;
for (const file of walk(ROOT)) {
  let source = fs.readFileSync(file, 'utf8');
  const original = source;

  source = source.replace(
    /from\s+(['"])([^'"]+)\1/g,
    (match, quote, spec) => {
      if (!spec.startsWith('.')) return match;
      const resolved = path.relative(ROOT, path.resolve(path.dirname(file), spec)).replace(/\\/g, '/');
      const target = TARGETS[resolved];
      if (!target) return match;
      return `from ${quote}${relativeSpecifier(file, target)}${quote}`;
    },
  );

  // The moved modules carried paths relative to their old home; fix the ones
  // that still point outside the capability engine.
  if (file.includes('capability-engine')) {
    source = source
      .replace(/"\.\.\/\.\.\/\.\.\/\.\.\/packages\/media-control\//g, '"../media-control/')
      .replace(/"\.\.\/\.\.\/\.\.\/\.\.\/rules\//g, '"../../rules/')
      .replace(/"\.\.\/\.\.\/\.\.\/\.\.\/packages\/agent-runtime\//g, '"../agent-runtime/')
      .replace(/"\.\.\/\.\.\/\.\.\/\.\.\/packages\/capability-engine\//g, '"./')
      .replace(/"\.\.\/\.\.\/\.\.\/\.\.\/app\/zero-control-ui\/src\/computer\/windows-driver\.js"/g, '"./windows-driver.mjs"')
      .replace(/"\.\.\/\.\.\/packages\/screen-intelligence\//g, '"../screen-intelligence/')
      .replace(/"\.\.\/\.\.\/packages\/agent-runtime\//g, '"../agent-runtime/')
      .replace(/"\.\.\/\.\.\/app\/zero-control-ui\/src\/computer\/windows-driver\.js"/g, '"./windows-driver.mjs"')
      .replace(/"\.\/observation-coordinator\.js"/g, '"./observation-coordinator.mjs"')
      .replace(/"\.\/windows-driver\.js"/g, '"./windows-driver.mjs"');
  }
  if (file.endsWith('windows-driver.mjs')) {
    source = source.replace(/"\.\.\/observation\/capture-source\.mjs"/g, '"../../app/zero-control-ui/observation/capture-source.mjs"');
  }

  if (source !== original) {
    fs.writeFileSync(file, source, 'utf8');
    changedFiles++;
    console.log(`  updated ${path.relative(ROOT, file)}`);
  }
}
console.log(`\n${changedFiles} file(s) updated`);
