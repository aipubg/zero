import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { registerLocalTools } from '../packages/capability-engine/local-tools.mjs';

test('[INTEGRATION] local tools write/read real files and execute a real argument-safe subprocess', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-local-tools-'));
  t.after(() => {
    const resolved = fs.realpathSync.native(directory);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-local-tools-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const engine = new CapabilityEngine({ operator: {} });
  registerLocalTools(engine, { cwd: directory });
  const written = await engine.execute({ toolName: 'write_file', args: { path: 'nested/proof.txt', content: 'actual local file' } });
  assert.equal(written.verified, true);
  assert.equal(fs.readFileSync(path.join(directory, 'nested/proof.txt'), 'utf8'), 'actual local file');
  const read = await engine.execute({ toolName: 'read_file', args: { path: 'nested/proof.txt' } });
  assert.equal(read.content, 'actual local file');
  const literal = '$() ` ; & | " shell metacharacters';
  const result = await engine.execute({ toolName: 'run_process', args: { command: process.execPath, args: ['-e', 'console.log(process.argv[1])', literal] } });
  assert.equal(result.ok, true, result.error);
  assert.equal(result.stdout.trim(), literal);
  assert.equal(result.exitCode, 0);
  const failed = await engine.execute({ toolName: 'run_process', args: { command: process.execPath, args: ['-e', 'process.exit(7)'] } });
  assert.equal(failed.ok, false);
  assert.equal(failed.exitCode, 7);
});

test('[INTEGRATION] actual process deadline and cancellation are failures, not verified outputs', async () => {
  const engine = new CapabilityEngine({ operator: {} });
  registerLocalTools(engine);
  const started = Date.now();
  const timedOut = await engine.execute({ toolName: 'run_process', args: { command: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'], timeoutMs: 100 } });
  assert.ok(Date.now() - started >= 90, 'The real process must run until its deadline');
  assert.equal(timedOut.ok, false);
  assert.equal(timedOut.verified, false);
  const controller = new AbortController();
  const pending = engine.execute({ toolName: 'run_process', args: { command: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'] }, signal: controller.signal });
  controller.abort();
  const cancelled = await pending;
  assert.equal(cancelled.outcome, 'CANCELLED');
  assert.equal(cancelled.completed, false);
});
