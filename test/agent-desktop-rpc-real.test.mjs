import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';
import { AgentDesktop } from '../packages/agent-runtime/agent-desktop.mjs';
import { ComputerOperator } from '../app/zero-control-ui/src/computer/operator.js';
import { canonicalCapabilityEngine } from '../packages/capability-engine/index.mjs';

test('[REAL_OS] actual desktop RPC retains safe refusal and unknown delivery metadata', {
  skip: process.platform !== 'win32' || process.env.ZERO_AGENT_DESKTOP_TESTS !== '1', timeout: 60000,
}, async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-desktop-rpc-'));
  const output = path.resolve('artifacts/desktop-rpc', String(Date.now())); fs.mkdirSync(output, { recursive: true });
  const report = { classification: ['REAL_OS', 'INTEGRATION'], status: 'RUNNING', scope: 'Actual native CLI and authenticated RPC errors; no physical input action' };
  let host; let socket; let previousOperator;
  const pending = new Map();
  const call = (method, params, legacy = false) => new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timeout`)); }, 45000);
    pending.set(id, frame => { clearTimeout(timer); resolve(frame); });
    socket.send(JSON.stringify(legacy ? { jsonrpc: '2.0', id, method, params } : { type: 'req', id, method, params }));
  });
  try {
    const reservation = net.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
    const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
    const providersPath = path.join(temporary, 'providers.json'); fs.writeFileSync(providersPath, '[]');
    host = new ZeroNativeHost({ port, dataDir: path.join(temporary, 'data'), prefsPath: path.join(temporary, 'prefs.json'), skillsDir: path.join(temporary, 'skills'), providersPath, agentBindingsPath: path.join(temporary, 'bindings.json'), localModelsDir: path.join(temporary, 'models'), localVision: false });
    await host.start();
    const auth = await fetch(`http://127.0.0.1:${port}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) });
    const { token } = await auth.json();
    socket = new WebSocket(`ws://127.0.0.1:${port}`);
    socket.addEventListener('message', event => { const frame = JSON.parse(event.data); if (pending.has(frame.id)) { pending.get(frame.id)(frame); pending.delete(frame.id); } });
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    await call('connect', { minProtocol: 4, token });
    previousOperator = canonicalCapabilityEngine.operator;
    canonicalCapabilityEngine.operator = new ComputerOperator({ agentDesktop: new AgentDesktop({ stateDir: path.join(temporary, 'agent-state') }) });
    const refused = await call('zero.computer.control', { toolName: 'desktop_control', command: 'click', args: ['@e1'] });
    assert.equal(refused.ok, false);
    assert.equal(refused.error.code, 'INVALID_ARGS');
    assert.deepEqual(refused.error.details.disposition, { delivery: 'not_delivered', retry: 'safe' });
    const legacyRefused = await call('zero.computer.control', { toolName: 'desktop_control', command: 'click', args: ['@e1'] }, true);
    assert.equal(typeof legacyRefused.error.code, 'number');
    assert.equal(legacyRefused.error.data.nativeCode, 'INVALID_ARGS');
    assert.deepEqual(legacyRefused.error.data.disposition, { delivery: 'not_delivered', retry: 'safe' });
    const delayed = await call('zero.computer.control', { toolName: 'desktop_control', command: 'wait', args: ['60000'] });
    assert.equal(delayed.ok, false);
    assert.equal(delayed.error.code, 'DESKTOP_CANCELLED');
    assert.deepEqual(delayed.error.details.disposition, { delivery: 'unknown', retry: 'unsafe' });
    assert.equal(delayed.error.details.requiresObservation, true);
    const recovered = await call('zero.computer.control', { toolName: 'desktop_control', command: 'status' });
    assert.equal(recovered.ok, true);
    assert.equal(recovered.payload.desktop.platform, 'windows');
    Object.assign(report, { status: 'PASS', invalidReference: refused.error, legacyError: legacyRefused.error, actualDeadlineCancellation: delayed.error, recoveredStatus: true });

  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    if (socket?.readyState === WebSocket.OPEN) { const closed = new Promise(resolve => socket.addEventListener('close', resolve, { once: true })); socket.close(); await closed; }
    if (previousOperator) canonicalCapabilityEngine.operator = previousOperator;
    await host?.close();
    report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(fs.realpathSync(path.dirname(temporary)), fs.realpathSync(os.tmpdir())); fs.rmSync(temporary, { recursive: true, force: true });
  }
});
