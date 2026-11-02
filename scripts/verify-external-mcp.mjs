/** REAL_EXTERNAL / REAL_OS / INTEGRATION: downloaded executable, actual handlers and process recovery. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { PluginManager } from '../packages/plugin-sdk/index.mjs';
import { mcpCapabilityName } from '../packages/plugin-sdk/mcp-adapter.mjs';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';

if (process.argv.length > 2) throw new Error('This runner starts a fresh isolated external MCP execution; no arguments supported');
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = path.join(root, 'artifacts/external-mcp', String(Date.now())); fs.mkdirSync(evidence, { recursive: true });
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-external-mcp-lifecycle-'));
const dbPath = path.join(directory, 'plugins.sqlite');
const spec = '@modelcontextprotocol/server-filesystem@2.0.1';
let engine, manager;
const report = { classification: ['REAL_EXTERNAL', 'REAL_OS', 'INTEGRATION'], status: 'RUNNING', startedAt: new Date().toISOString(), directory, evidence,
  scope: 'Actual pinned third-party MCP executable via Zero handlers, persisted manager state, refresh, preparation-failure preservation and real process crash/restart; UI is verified by a separate browser runner' };
const open = async () => { engine = new CapabilityEngine({ operator: {} }); manager = new PluginManager({ dbPath, capabilityEngine: engine }); await manager.initialize(); };
try {
  await open();
  const installed = await manager.installPlugin({ mcpPackage: spec, args: [directory] });
  const id = installed.id; assert.equal(installed.capabilities.length, 14);
  const tool = mcpCapabilityName(id, 'write_file'); const file = path.join(directory, 'actual-effect.txt');
  const invoke = content => engine.execute({ agentId: 'zero', toolName: tool, args: { path: file, content } });
  assert.equal((await invoke('INITIAL_EFFECT')).ok, true); assert.equal(fs.readFileSync(file, 'utf8'), 'INITIAL_EFFECT');
  await manager.disablePlugin(id); await manager.close(); await open();
  assert.equal(manager.getPlugin(id).status, 'disabled');
  assert.equal((await invoke('SHOULD_NOT_RUN')).ok, false); assert.equal(fs.readFileSync(file, 'utf8'), 'INITIAL_EFFECT');
  await manager.enablePlugin(id);
  const originalRevision = manager.getPlugin(id).source.revision;
  const refreshed = await manager.updatePlugin(id);
  assert.notEqual(refreshed.source.revision, originalRevision); assert.deepEqual(refreshed.source.args, [directory]);
  await manager.restartPlugin(id);
  assert.equal((await invoke('REFRESHED_EFFECT')).ok, true); assert.equal(fs.readFileSync(file, 'utf8'), 'REFRESHED_EFFECT');
  const revision = manager.getPlugin(id).source.revision;
  await assert.rejects(manager.updatePlugin(id, { mcpPackage: spec, args: [path.join(directory, 'absent-directory')] }), /MCP/);
  assert.equal(manager.getPlugin(id).source.revision, revision);
  assert.equal((await invoke('PRESERVED_EFFECT')).ok, true);
  const oldPid = manager.getPlugin(id).process.pid; assert.ok(oldPid); process.kill(oldPid);
  const deadline = Date.now() + 5000;
  while (manager.getPlugin(id).runtimeStatus !== 'unavailable' && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(manager.getPlugin(id).runtimeStatus, 'unavailable'); assert.equal(manager.getDiagnostics().unavailablePlugins, 1);
  assert.equal((await invoke('CRASHED_SHOULD_NOT_RUN')).ok, false); assert.equal(fs.readFileSync(file, 'utf8'), 'PRESERVED_EFFECT');
  await manager.restartPlugin(id); const newPid = manager.getPlugin(id).process.pid; assert.ok(newPid); assert.notEqual(newPid, oldPid);
  assert.equal((await invoke('RECOVERED_EFFECT')).ok, true); assert.equal(fs.readFileSync(file, 'utf8'), 'RECOVERED_EFFECT');
  await manager.uninstallPlugin(id); await manager.close(); await open(); assert.equal(manager.getPlugin(id), null);
  assert.equal(fs.readFileSync(file, 'utf8'), 'RECOVERED_EFFECT');
  report.execution = { spec, tools: 14, actualRegisteredHandlerEffects: true, disabledPersistedAcrossManagerReopen: true,
    refreshRetainedArguments: true, failedPreparationPreservedHandler: true, oldPid, newPid,
    crashReportedUnavailable: true, actualEffectAfterRecovery: true, uninstallPersisted: true, outputFilePreserved: true };
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.message; process.exitCode = 1; }
finally { await manager?.close(); report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2)); }
