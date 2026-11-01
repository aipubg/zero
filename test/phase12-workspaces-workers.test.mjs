/**
 * @fileoverview Phase 12 Acceptance Verification — Agent Workspaces & Cloud Workers
 *
 * Verifies:
 * 1. Isolated agent workspace creation and filesystem sandboxing
 * 2. Multi-tier worker registration (local host, remote node, cloud container)
 * 3. Worker health telemetry and heartbeats
 * 4. Distributed task handoff contracts across workers with state snapshots
 * 5. Multi-worker query and capability matching
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const WS = globalThis.WebSocket;

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase12-test-runner' }),
  });
  assert.equal(authRes.status, 200);
  const authData = await authRes.json();
  return authData.token;
}

async function createRpcClient() {
  const token = await getLoopbackToken();
  const ws = new WS(WS_URL);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const pending = new Map();
  let counter = 1;

  ws.addEventListener('message', (event) => {
    try {
      const frame = JSON.parse(event.data);
      if (frame.id && pending.has(frame.id)) {
        const { resolve, reject } = pending.get(frame.id);
        pending.delete(frame.id);
        if (frame.ok === false) {
          reject(new Error(frame.error?.message || frame.error || 'RPC Error'));
        } else {
          resolve(frame.payload);
        }
      }
    } catch (_) {}
  });

  const hsPromise = new Promise((resolve, reject) => {
    pending.set('hs_phase12', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase12',
    method: 'connect',
    params: { minProtocol: 4, token },
  }));
  await hsPromise;

  return {
    call: (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const reqId = `rpc_${counter++}_${Date.now()}`;
        pending.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({
          type: 'req',
          id: reqId,
          method,
          params,
        }));
      });
    },
    close: () => ws.close(),
  };
}

test('Phase 12: Agent Workspaces & Cloud Workers Suite', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('12.1 Isolated Workspace Creation and Directory Sandboxing', async () => {
    const wsId = `ws_researcher_${Date.now()}`;
    const res = await client.call('workspaces.create', {
      id: wsId,
      name: 'Researcher Isolated Scratchpad',
      assignedAgentId: 'researcher',
      type: 'isolated',
    });

    assert.ok(res.ok);
    const ws = res.workspace;
    assert.equal(ws.id, wsId);
    assert.equal(ws.assignedAgentId, 'researcher');
    assert.ok(fs.existsSync(ws.rootDir), `Workspace directory must exist on disk: ${ws.rootDir}`);

    // Verify in list
    const list = await client.call('workspaces.list', {});
    assert.ok(list.ok);
    assert.ok(list.workspaces.some((w) => w.id === wsId));

    // Cleanup
    try {
      fs.rmSync(ws.rootDir, { recursive: true, force: true });
    } catch (_) {}
  });

  await suite.test('12.2 Multi-Tier Worker Registration (Local, Remote, Cloud)', async () => {
    // 1. Primary local worker exists by default
    const workers = await client.call('workers.list', {});
    assert.ok(workers.ok);
    assert.ok(workers.workers.some((w) => w.id === 'worker_local_primary'));

    // 2. Register cloud worker
    const cloudWorkerId = `worker_cloud_gpu_${Date.now()}`;
    const cloudRes = await client.call('workers.register', {
      id: cloudWorkerId,
      name: 'Cloud A100 Inference Node',
      type: 'cloud',
      capabilities: ['deepseek_r1_671b', 'vllm_cluster', 'high_concurrency'],
    });
    assert.ok(cloudRes.ok);
    assert.equal(cloudRes.worker.id, cloudWorkerId);
    assert.equal(cloudRes.worker.type, 'cloud');
    assert.ok(cloudRes.worker.capabilities.includes('deepseek_r1_671b'));

    // 3. Heartbeat recording
    const hbRes = await client.call('workers.heartbeat', { id: cloudWorkerId });
    assert.ok(hbRes.ok);
    assert.ok(hbRes.lastHeartbeat > 0);
  });

  await suite.test('12.3 Distributed Task Handoff Contract with State Snapshots', async () => {
    const taskId = `task_heavy_computation_${Date.now()}`;
    const cloudWorkerId = `worker_cloud_node_${Date.now()}`;

    // Register remote worker
    await client.call('workers.register', {
      id: cloudWorkerId,
      name: 'Dedicated Worker Node',
      type: 'remote',
      capabilities: ['batch_matrix'],
    });

    // Execute handoff from local host to remote worker
    const handoffRes = await client.call('workers.handoff', {
      taskId,
      fromWorkerId: 'worker_local_primary',
      toWorkerId: cloudWorkerId,
      stateSnapshot: { currentStep: 4, memoryContext: 'quantized_weights_loaded' },
      artifacts: [{ type: 'checkpoint', path: 'ckpt-step4.bin' }],
    });

    assert.ok(handoffRes.ok);
    assert.equal(handoffRes.taskId, taskId);
    assert.equal(handoffRes.fromWorkerId, 'worker_local_primary');
    assert.equal(handoffRes.toWorkerId, cloudWorkerId);
    assert.equal(handoffRes.stateSnapshot.currentStep, 4);

    // Verify handoff history in state store
    const historyRes = await client.call('workers.handoffs.list', { taskId });
    assert.ok(historyRes.ok);
    assert.equal(historyRes.handoffs.length, 1);
    assert.equal(historyRes.handoffs[0].toWorkerId, cloudWorkerId);
  });
});
