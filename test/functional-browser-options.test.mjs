import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { BROWSER_FLAGS, parseBrowserModes } from '../scripts/functional-browser-options.mjs';
const repo = fileURLToPath(new URL('../', import.meta.url));

test('[UNIT] browser selectors cover actual branches and reject missing, unknown or conflicting modes', () => {
  const source = fs.readFileSync(path.join(repo, 'scripts/functional-browser-check.mjs'), 'utf8');
  const branches = [...new Set([...source.matchAll(/process\.argv\.includes\('(--[^']+)'\)/g)].map(match => match[1]))].sort();
  assert.deepEqual([...BROWSER_FLAGS].sort(), branches);
  for (const args of [['--unknown'], ['--skill-execution'], ['--gguf-recall'], ['--agent-recovery', '--parallel-agents'], ['--help', '--external'], ['--gguf', '--gguf-qwen', '--gguf-qwen-3b']]) assert.throws(() => parseBrowserModes(args));
  assert.deepEqual(parseBrowserModes([]), { help: false, modes: [] });
  assert.deepEqual(parseBrowserModes(['--providers', '--providers']).modes, ['--providers']);
  assert.equal(parseBrowserModes(['--external-skills', '--skill-execution']).modes.length, 2);
  assert.equal(parseBrowserModes(['--gguf', '--gguf-runtime', '--gguf-qwen-3b', '--gguf-tools', '--gguf-recall']).modes.length, 5);
  assert.equal(parseBrowserModes(['-h']).help, true);
});

test('[INTEGRATION] invalid and help CLI modes settle before browser dependencies, build or owner-file mutation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-browser-options-'));
  for (const directory of ['scripts', 'packages/plugin-sdk', 'app/zero-control-ui']) fs.mkdirSync(path.join(root, directory), { recursive: true });
  for (const file of ['scripts/functional-browser-check.mjs', 'scripts/functional-browser-options.mjs', 'packages/plugin-sdk/mcp-adapter.mjs', 'packages/plugin-sdk/mcp-stdio.mjs']) fs.copyFileSync(path.join(repo, file), path.join(root, file));
  const manifest = path.join(root, 'app/zero-control-ui/openclaw.plugin.json');
  fs.writeFileSync(manifest, '{"retained":"controlled-owner-manifest"}');
  const env = path.join(root, '.env'); fs.writeFileSync(env, 'CONTROLLED_SENTINEL=retained\n');
  fs.writeFileSync(path.join(root, 'app/zero-control-ui/build.mjs'), "import fs from 'node:fs';fs.writeFileSync(new URL('../../BUILD_MUST_NOT_RUN',import.meta.url),'unexpected');");
  const manifestBefore = fs.readFileSync(manifest); const envBefore = fs.readFileSync(env);
  const childEnvironment = { ...process.env };
  for (const key of ['NODE_PATH', 'NODE_OPTIONS', 'NODE_TEST_CONTEXT']) delete childEnvironment[key];
  try {
    for (const args of [['--unknown'], ['--skill-execution'], ['--gguf-recall'], ['--help', '--external'], ['--gguf', '--gguf-qwen', '--gguf-qwen-3b']]) {
      const child = spawnSync(process.execPath, ['scripts/functional-browser-check.mjs', ...args], { cwd: root, env: childEnvironment, encoding: 'utf8', windowsHide: true, timeout: 5000 });
      assert.equal(child.status, 2, child.stderr);
      const error = JSON.parse(child.stderr); assert.equal(error.status, 'BLOCKED'); assert.equal(error.execution, 'NOT_RUN');
      assert.equal(child.stdout, '');
    }
    const help = spawnSync(process.execPath, ['scripts/functional-browser-check.mjs', '--help'], { cwd: root, env: childEnvironment, encoding: 'utf8', windowsHide: true, timeout: 5000 });
    assert.equal(help.status, 0, help.stderr); assert.equal(JSON.parse(help.stdout).execution, 'NOT_RUN');
    assert.equal(fs.existsSync(path.join(root, 'BUILD_MUST_NOT_RUN')), false);
    assert.equal(fs.existsSync(path.join(root, 'artifacts')), false);
    assert.deepEqual(fs.readFileSync(manifest), manifestBefore); assert.deepEqual(fs.readFileSync(env), envBefore);
  } finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('zero-browser-options-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
