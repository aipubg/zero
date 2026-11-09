import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { PluginManager } from '../packages/plugin-sdk/index.mjs';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { mcpCapabilityName } from '../packages/plugin-sdk/mcp-adapter.mjs';
import { restoreUserState } from '../scripts/restore-user-state.mjs';

test('[REAL_EXTERNAL] pinned third-party MCP filesystem plugin executes after backup restore relocation', { skip: process.env.ZERO_MCP_RESTORE_TESTS !== '1', timeout: 180000 }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-mcp-restore-'));
  const state = path.join(root, 'state'); const skills = path.join(root, 'skills'); const allowed = path.join(root, 'allowed');
  for (const directory of [state, skills, allowed]) fs.mkdirSync(directory);
  const id = 'mcp:@modelcontextprotocol/server-filesystem';
  const capability = mcpCapabilityName(id, 'write_file');
  const evidence = path.resolve('artifacts/restore-mcp', String(Date.now())); fs.mkdirSync(evidence, { recursive: true });
  const report = { classification: ['REAL_EXTERNAL', 'INTEGRATION', 'REAL_OS'], status: 'RUNNING', scope: 'Same-machine pinned third-party package restore; original filesystem allowlist retained, not arbitrary MCP or clean-machine portability' };
  const open = directory => {
    const engine = new CapabilityEngine({ operator: {}, logger: { warn() {} } });
    return { engine, manager: new PluginManager({ dbPath: path.join(directory, 'zero-plugins.sqlite'), capabilityEngine: engine }) };
  };
  let original; let restored;
  try {
    original = open(state);
    const installed = await original.manager.installPlugin({ mcpPackage: '@modelcontextprotocol/server-filesystem@2.0.1', args: [allowed] });
    assert.equal(installed.runtimeStatus, 'active');
    const oldPid = installed.process.pid; assert.ok(oldPid > 0);
    const firstFile = path.join(allowed, 'before.txt');
    const first = await original.engine.execute({ toolName: capability, args: { path: firstFile, content: 'BEFORE_MCP_BACKUP' } });
    assert.equal(first.executed, true); assert.equal(fs.readFileSync(firstFile, 'utf8'), 'BEFORE_MCP_BACKUP');
    await original.manager.close(); original = null;
    const backup = JSON.parse(execFileSync(process.execPath, ['scripts/backup-user-state.mjs', '--state-dir', state, '--skills-dir', skills], { encoding: 'utf8', windowsHide: true }).trim()).backupDirectory;
    const restoredRoot = path.join(root, 'restored');
    const result = await restoreUserState(backup, restoredRoot);
    assert.deepEqual(result.relocatedPluginSources, [id]);
    const bundles = path.join(state, 'plugin-sdk'); const retained = path.join(root, 'original-bundles-retained');
    assert.equal(path.dirname(bundles), state); assert.equal(path.dirname(retained), root);
    fs.renameSync(bundles, retained);
    restored = open(path.join(restoredRoot, '.zero-data'));
    assert.deepEqual((await restored.manager.initialize()).unavailable, []);
    const active = restored.manager.getPlugin(id);
    assert.equal(active.runtimeStatus, 'active'); assert.ok(active.process.pid > 0); assert.notEqual(active.process.pid, oldPid);
    const afterFile = path.join(allowed, 'after.txt');
    const effect = await restored.engine.execute({ toolName: capability, args: { path: afterFile, content: 'MCP_RESTORED_सफल' } });
    assert.equal(effect.executed, true); assert.equal(fs.readFileSync(afterFile, 'utf8'), 'MCP_RESTORED_सफल');
    assert.equal(fs.readFileSync(firstFile, 'utf8'), 'BEFORE_MCP_BACKUP');
    Object.assign(report, { status: 'PASS', backup, oldPid, newPid: active.process.pid, package: '@modelcontextprotocol/server-filesystem@2.0.1', relocatedSource: true, originalBundlePathUnavailable: true, registeredToolExecuted: true, unicodeFileReadback: true, priorUserFilePreserved: true });
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    await original?.manager.close(); await restored?.manager.close();
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(fs.realpathSync(path.dirname(root)), fs.realpathSync(os.tmpdir())); assert.ok(path.basename(root).startsWith('zero-mcp-restore-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
