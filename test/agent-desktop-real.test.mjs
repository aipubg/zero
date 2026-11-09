import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { AgentDesktop } from '../packages/agent-runtime/agent-desktop.mjs';
import { ComputerOperator } from '../app/zero-control-ui/src/computer/operator.js';
import { canonicalCapabilityEngine } from '../packages/capability-engine/index.mjs';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

test('[REAL_OS] primary agent-desktop backend sets native field and invokes button with independent effect readback', { skip: process.env.ZERO_AGENT_DESKTOP_TESTS !== '1', timeout: 60000 }, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-agent-desktop-'));
  const evidence = path.resolve('artifacts/agent-desktop-verification', String(Date.now())); fs.mkdirSync(evidence, { recursive: true });
  const title = 'ZERO AgentDesktop Verification ' + crypto.randomUUID();
  const output = path.join(directory, 'effect.json');
  const child = spawn('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', path.resolve('test/fixtures/agent-desktop-window.ps1'), '-Title', title, '-Output', output], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const report = { classification: ['REAL_OS', 'INTEGRATION'], status: 'RUNNING', scope: 'Owned native Windows Forms fixture; not general application accuracy benchmark' };
  const adapter = new AgentDesktop({ stateDir: path.join(directory, 'agent-state') });
  const operator = new ComputerOperator({ agentDesktop: adapter, logger: { error() {} } });
  fs.writeFileSync(path.join(directory, 'providers.json'), '[]');
  const host = new ZeroNativeHost({ dataDir: path.join(directory, 'data'), prefsPath: path.join(directory, 'prefs.json'), providersPath: path.join(directory, 'providers.json'), agentBindingsPath: path.join(directory, 'bindings.json'), skillsDir: path.join(directory, 'skills'), localModelsDir: path.join(directory, 'models'), localVision: false });
  const previousOperator = canonicalCapabilityEngine.operator;
  canonicalCapabilityEngine.operator = operator;
  const engine = canonicalCapabilityEngine;
  const call = async (command, args = [], input) => {
    const result = await engine.execute({ toolName: 'desktop_control', args: { command, args, ...(input === undefined ? {} : { input }) } });
    assert.equal(result.ok, true, JSON.stringify(result)); return { ok: result.ok, data: result.desktop, disposition: result.disposition };
  };
  const walk = node => node && typeof node === 'object' ? [node, ...Object.values(node).flatMap(value => Array.isArray(value) ? value.flatMap(walk) : value && typeof value === 'object' ? walk(value) : [])] : [];
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Native fixture startup timeout')), 15000);
      child.stdout.on('data', data => { if (String(data).includes('READY')) { clearTimeout(timeout); resolve(); } });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error('Native fixture exited ' + code)); });
    });
    assert.equal((await call('status')).data.platform, 'windows');
    let candidates = [];
    const discoveryDeadline = Date.now() + 10000;
    do {
      const windows = await call('list-windows');
      candidates = walk(windows.data).filter(item => (item.title === title || item.name === title) && (item.window_id !== undefined || item.id !== undefined));
      if (candidates.length) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    } while (Date.now() < discoveryDeadline);
    assert.equal(candidates.length, 1, 'Exactly one owned fixture window must be discovered');
    const windowId = String(candidates[0].window_id ?? candidates[0].id);
    let snapshot = await call('snapshot', ['--window-id', windowId, '--timeout-ms', '10000']);
    const field = walk(snapshot.data.tree).find(node => node.name === 'ZERO verification input' && node.ref_id);
    assert.ok(field, JSON.stringify(snapshot));
    const text = 'ZERO सत्यापित input';
    const set = await call('set-value', [field.ref_id], text);
    snapshot = await call('snapshot', ['--window-id', windowId, '--timeout-ms', '10000']);
    const button = walk(snapshot.data.tree).find(node => node.name === 'ZERO verification apply' && node.ref_id);
    assert.ok(button, JSON.stringify(snapshot));
    const click = await call('click', [button.ref_id]);
    const deadline = Date.now() + 5000;
    while (!fs.existsSync(output) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
    const effect = JSON.parse(fs.readFileSync(output, 'utf8').replace(/^\uFEFF/, ''));
    assert.deepEqual(effect, { text, clicks: 1 });
    const invalid = await adapter.execute({ command: 'click', args: ['@e1'] });
    assert.equal(invalid.ok, false); assert.equal(invalid.error.code, 'INVALID_ARGS');
    assert.equal(JSON.parse(fs.readFileSync(output, 'utf8').replace(/^\uFEFF/, '')).clicks, 1);
    operator.setHumanHold(true);
    assert.equal((await engine.execute({ toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click', args: [button.ref_id] } })).ok, false);
    assert.equal((await call('status')).ok, true);
    Object.assign(report, { status: 'PASS', backend: 'agent-desktop', runtimeVersion: '1.2.0', actualCanonicalHostRegisteredTool: true, actualUnicodeEffect: effect, nativeSetDisposition: set.disposition, nativeClickDisposition: click.disposition, malformedRefRejectedWithoutSecondClick: true, manualHoldPreserved: true, observationDuringHold: true });
    if (process.env.ZERO_AGENT_DESKTOP_MODEL_TESTS === '1') {
      operator.setHumanHold(false);
      if (fs.existsSync(path.resolve('.env'))) process.loadEnvFile(path.resolve('.env'));
      host.modelFabric.loadProviders(JSON.parse(fs.readFileSync('models/gateway-providers.json', 'utf8')));
      const request = await host._runAssistantRequest({ sessionKey: 'native-desktop-proof', userContent: `Use desktop_control to snapshot window ${windowId} and read the field named ZERO verification input. Return only that field's exact current value. Use the actual accessibility result, not assumptions.`, clientSession: { role: 'admin', scopes: ['operator.admin', 'operator.write'] }, source: 'chat' });
      assert.equal(request.ok, true, JSON.stringify(request));
      assert.equal(request.modelContent.trim(), text);
      const steps = host.tasks.getTaskSteps(request.taskId);
      assert.ok(steps.some(step => (step.toolName || step.tool_name) === 'desktop_control'), 'Actual model must invoke the primary desktop backend');
      report.classification.push('REAL_EXTERNAL');
      report.actualModelPrimaryBackend = { taskId: request.taskId, status: host.tasks.getTask(request.taskId).status, exactModelObservedFieldReturned: true, presentationCardsRemainInContent: request.content.includes('zero-ui:progress'), scope: 'Exact raw model readback; existing rendered content retains application progress card' };
    }
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    canonicalCapabilityEngine.operator = previousOperator;
    await host.close();
    if (child.exitCode === null) { const closed = once(child, 'exit'); child.kill(); await closed; }
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(fs.realpathSync(path.dirname(directory)), fs.realpathSync(os.tmpdir())); assert.ok(path.basename(directory).startsWith('zero-agent-desktop-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
