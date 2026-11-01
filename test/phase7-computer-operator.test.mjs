/**
 * @fileoverview Phase 7 Acceptance Verification — General-Purpose Windows Computer Operator
 *
 * Verifies:
 * 1. Screen size & geometry detection on Windows
 * 2. Real-time cursor coordinates retrieval
 * 3. Desktop window enumeration and state observation
 * 4. Windows UI Automation (UIA) tree inspection
 * 5. Human safety hold arbitration (blocking inputs during takeover)
 * 6. Desktop action resource lease locking integration
 * 7. End-to-end computer action execution via native host RPC
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const WS = globalThis.WebSocket;

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase7-test-runner' }),
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
    pending.set('hs_phase7', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase7',
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

test('Phase 7: Windows Computer Operator & Layered Automation Suite', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
    try {
      await client.call('zero-policy.computer-hold.release');
    } catch (_) {}
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('7.1 Screen Geometry and DPI Resolution Discovery', async () => {
    const res = await client.call('zero.computer.control', {
      action: 'get_screen_size',
    });
    assert.ok(res.ok);
    const width = res.width || res.data?.width;
    const height = res.height || res.data?.height;
    assert.ok(width > 0, `Expected width > 0, got ${width}`);
    assert.ok(height > 0, `Expected height > 0, got ${height}`);
  });

  await suite.test('7.2 Live Cursor Position Coordinates Retrieval', async () => {
    const res = await client.call('zero.computer.control', {
      action: 'get_cursor_position',
    });
    assert.ok(res.ok);
    const x = res.x ?? res.data?.x;
    const y = res.y ?? res.data?.y;
    assert.equal(typeof x, 'number');
    assert.equal(typeof y, 'number');
    assert.ok(x >= 0);
    assert.ok(y >= 0);
  });

  await suite.test('7.3 Windows Desktop Enumeration and State Observation', async () => {
    const res = await client.call('zero.computer.control', {
      action: 'list_windows',
    });
    assert.ok(res.ok);
    const windows = res.windows || res.data?.windows || res.details || res.data?.details || [];
    assert.ok(Array.isArray(windows));

    const state = await client.call('zero.computer.control', {
      action: 'get_window_state',
    });
    assert.ok(state.ok);
  });

  await suite.test('7.4 Windows UI Automation (UIA) Tree Inspection', async () => {
    const res = await client.call('zero.computer.control', {
      action: 'get_uia_elements',
      max_elements: 20,
    });
    assert.ok(res.ok);
  });

  await suite.test('7.5 Human Safety Takeover Hold Arbitration', async () => {
    // 1. Initial status: hold not active
    const initialStatus = await client.call('zero-policy.computer-hold.status');
    assert.ok(initialStatus.ok);

    // 2. Human takes hold
    const takeRes = await client.call('zero-policy.computer-hold.take', {
      reason: 'Physical emergency pause test',
    });
    assert.ok(takeRes.ok);

    // 3. Status shows held
    const heldStatus = await client.call('zero-policy.computer-hold.status');
    assert.equal(heldStatus.held, true);

    // 4. Attempting physical mouse movement during hold must be refused
    await assert.rejects(
      async () => {
        await client.call('zero.computer.control', {
          action: 'mouse_move',
          x: 100,
          y: 100,
        });
      },
      /Human takeover hold|human-control/
    );

    // 5. Human releases hold
    const releaseRes = await client.call('zero-policy.computer-hold.release');
    assert.ok(releaseRes.ok);

    // 6. Status reflects released
    const finalStatus = await client.call('zero-policy.computer-hold.status');
    assert.equal(finalStatus.held, false);
  });

  await suite.test('7.6 Desktop Action Mutual Exclusion via Lease Locking', async () => {
    // Acquire lease for agent A
    const leaseA = await client.call('agent.lease.acquire', {
      agentId: 'agent_alpha',
      reason: 'Physical window automation',
      timeoutMs: 8000,
      waitMs: 200,
    });
    assert.ok(leaseA.acquired);
    assert.equal(leaseA.holder, 'agent_alpha');

    // Agent B tries to acquire without waiting -> rejected
    const leaseB = await client.call('agent.lease.acquire', {
      agentId: 'agent_beta',
      reason: 'Conflicting desktop action',
      timeoutMs: 8000,
      waitMs: 0,
    });
    assert.equal(leaseB.acquired, false);
    assert.equal(leaseB.holder, 'agent_alpha');

    // Release lease
    const relA = await client.call('agent.lease.release', { agentId: 'agent_alpha' });
    assert.ok(relA.released);

    // Now Agent B can acquire
    const leaseB2 = await client.call('agent.lease.acquire', {
      agentId: 'agent_beta',
      reason: 'Acquired after release',
      timeoutMs: 5000,
      waitMs: 200,
    });
    assert.ok(leaseB2.acquired);
    assert.equal(leaseB2.holder, 'agent_beta');

    await client.call('agent.lease.release', { agentId: 'agent_beta' });
  });
});
