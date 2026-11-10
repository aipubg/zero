import test from 'node:test';
import assert from 'node:assert/strict';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { createRequire } from 'node:module';
import { canonicalCapabilityEngine } from '../packages/capability-engine/index.mjs';

// Dynamically load ws client
async function getWsClient() {
  const wsMod = createRequire(new URL('../backend/package.json', import.meta.url))('ws');
  return wsMod.WebSocket || wsMod;
}

test('Isolated native gateway real WebSocket RPC and persisted effects', { timeout: 20000 }, async (t) => {
  const WebSocket = await getWsClient();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-native-gateway-test-'));
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const testPort = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const testToken = 'zero-test-auth-token-123';

  const host = new ZeroNativeHost({
    port: testPort,
    host: '127.0.0.1',
    token: testToken,
    dataDir: path.join(root, 'data'),
    prefsPath: path.join(root, 'prefs.json'),
    skillsDir: path.join(root, 'skills'),
    providersPath: path.join(root, 'providers.json'),
    agentBindingsPath: path.join(root, 'bindings.json'),
  });

  t.after(async () => {
    await host.close({ reason: 'test-complete' });
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-native-gateway-test-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  await host.start();

  const wsUrl = `ws://127.0.0.1:${testPort}`;

  await t.test('connects via WebSocket, completes handshake, and dispatches RPC methods', async () => {
    const ws = new WebSocket(wsUrl);

    const receivedEvents = [];
    const pendingResponses = new Map();

    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString('utf8'));
      if (msg.type === 'event' || msg.method) {
        receivedEvents.push(msg);
      }
      if (msg.type === 'res' && msg.id) {
        const handler = pendingResponses.get(msg.id);
        if (handler) { pendingResponses.delete(msg.id); handler(msg); }
      }
      if (msg.jsonrpc === '2.0' && msg.id) {
        const handler = pendingResponses.get(msg.id);
        if (handler) { pendingResponses.delete(msg.id); handler(msg); }
      }
    });

    await new Promise((resolve) => ws.on('open', resolve));

    // Wait for initial connect.challenge event
    await new Promise((resolve) => setTimeout(resolve, 50));
    const challenge = receivedEvents.find((e) => e.event === 'connect.challenge');
    assert.ok(challenge, 'Should have received connect.challenge');
    assert.ok(challenge.payload.nonce);

    function sendRpc(req) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { pendingResponses.delete(req.id); reject(new Error(`RPC timeout: ${req.method}`)); }, 3000);
        pendingResponses.set(req.id, response => { clearTimeout(timeout); resolve(response); });
        ws.send(JSON.stringify(req));
      });
    }

    // 1. Handshake / Connect (Reference wire format)
    const connectRes = await sendRpc({
      type: 'req',
      id: 'conn-1',
      method: 'connect',
      params: { protocol: 4, role: 'operator', clientId: 'test-harness', token: testToken },
    });
    assert.equal(connectRes.ok, true);
    assert.equal(connectRes.payload.type, 'hello');
    assert.equal(connectRes.payload.session.clientId, 'test-harness');

    // 2. Health check
    const healthRes = await sendRpc({
      type: 'req',
      id: 'req-health',
      method: 'health',
      params: {},
    });
    assert.equal(healthRes.ok, true);
    assert.equal(healthRes.payload.status, 'ok');

    const catalogRes = await sendRpc({ type: 'req', id: 'req-tool-catalog', method: 'tools.effective', params: {} });
    assert.equal(catalogRes.ok, true);
    assert.equal(catalogRes.payload.source, 'canonical-assistant-registry');
    assert.equal(catalogRes.payload.executionVerified, false, 'Discovery is not execution proof');
    const tools = catalogRes.payload.tools;
    assert.ok(tools.some(tool => tool.name === 'desktop_control'));
    assert.ok(tools.some(tool => tool.name === 'research_search'));
    assert.ok(!tools.some(tool => tool.name === 'play' || tool.name === 'type_text'), 'Action names must not be advertised as nonexistent standalone functions');
    const computer = tools.find(tool => tool.name === 'zero_computer_action');
    assert.ok(computer.parameters.properties.action.enum.includes('spotify_control'));
    assert.ok(computer.parameters.properties.command.enum.includes('set_speed'));
    assert.equal(computer.parameters.properties.volume_percent.maximum, 100);
    assert.equal(computer.parameters.properties.playback_rate.maximum, 4);
    assert.deepEqual(tools, host._assistantToolDefinitions().map(({function:definition})=>({name:definition.name,description:definition.description,parameters:definition.parameters})), 'Actual wire catalog matches the model request definitions');
    const fixtureName = `catalog_fixture_${Date.now()}`;
    canonicalCapabilityEngine.registerCapability({name:fixtureName,description:'Local registry lifecycle fixture',parameters:{type:'object'},handler:async()=>({ok:true})});
    try {
      const enabled = await sendRpc({type:'req',id:'req-catalog-enabled',method:'tools.effective',params:{}});
      assert.ok(enabled.payload.tools.some(tool=>tool.name===fixtureName));
      canonicalCapabilityEngine.customCapabilities.get(fixtureName).disabled=true;
      const disabled = await sendRpc({type:'req',id:'req-catalog-disabled',method:'tools.effective',params:{}});
      assert.ok(!disabled.payload.tools.some(tool=>tool.name===fixtureName));
      assert.ok(!host._assistantToolDefinitions().some(tool=>tool.function.name===fixtureName));
    } finally { canonicalCapabilityEngine.customCapabilities.delete(fixtureName); }

    // 3. Agents list
    const agentsRes = await sendRpc({
      type: 'req',
      id: 'req-agents',
      method: 'agents.list',
      params: {},
    });
    assert.equal(agentsRes.ok, true);
    assert.equal(agentsRes.payload.defaultId, 'zero');
    assert.equal(agentsRes.payload.agents[0].id, 'zero');

    // 4. Memory RPC
    const rememberRes = await sendRpc({
      type: 'req',
      id: 'req-mem-1',
      method: 'memory.remember',
      params: {
        id: 'ws-mem-1',
        category: 'workflow',
        content: 'Operator uses VS Code and Antigravity pair programming',
        tags: ['editor', 'pair-programming'],
      },
    });
    assert.equal(rememberRes.ok, true);
    assert.equal(rememberRes.payload.id, 'ws-mem-1');

    const recallRes = await sendRpc({
      type: 'req',
      id: 'req-mem-2',
      method: 'memory.recall',
      params: { query: 'Antigravity' },
    });
    assert.equal(recallRes.ok, true);
    assert.ok(recallRes.payload.length >= 1);
    assert.equal(recallRes.payload[0].id, 'ws-mem-1');

    // 5. Automation RPC
    const jobRes = await sendRpc({
      type: 'req',
      id: 'req-auto-1',
      method: 'automation.registerJob',
      params: {
        id: 'ws-job-1',
        title: 'Screen Log Purge',
        cronExpr: '@daily',
        targetAction: 'browser',
        params: { action: 'cleanup' },
      },
    });
    assert.equal(jobRes.ok, true);
    assert.equal(jobRes.payload.id, 'ws-job-1');

    // 6. Computer Hold Safety Takeover
    const holdTake = await sendRpc({
      type: 'req',
      id: 'req-hold-take',
      method: 'zero-policy.computer-hold.take',
      params: {},
    });
    assert.equal(holdTake.ok, true);
    assert.ok(holdTake.payload.controlLeaseId);

    const holdStatus = await sendRpc({
      type: 'req',
      id: 'req-hold-status',
      method: 'zero-policy.computer-hold.status',
      params: {},
    });
    assert.equal(holdStatus.ok, true);
    assert.equal(holdStatus.payload.held, true);

    const holdRelease = await sendRpc({
      type: 'req',
      id: 'req-hold-rel',
      method: 'zero-policy.computer-hold.release',
      params: { controlLeaseId: holdTake.payload.controlLeaseId },
    });
    assert.equal(holdRelease.ok, true);
    assert.equal(holdRelease.payload.held, false);

    ws.close();
  });
});
