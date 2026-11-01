import test from 'node:test';
import assert from 'node:assert/strict';

const WS = globalThis.WebSocket;
const BASE_URL = 'http://127.0.0.1:18789';
const WS_URL = 'ws://127.0.0.1:18789';

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase1-test-runner' }),
  });
  assert.equal(authRes.status, 200, 'POST /api/auth/session must return 200');
  const authData = await authRes.json();
  return authData.token;
}

test('Phase 1 Host & Execution Contracts Suite', async (suite) => {
  // 1. HTTP /health general summary
  await suite.test('HTTP /health returns general status summary', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.runtime, 'zero-native');
    assert.equal(data.port, 18789);
  });

  // 2. HTTP /health/liveness
  await suite.test('HTTP /health/liveness returns live process telemetry', async () => {
    const res = await fetch(`${BASE_URL}/health/liveness`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'live');
    assert.equal(typeof data.uptime, 'number');
    assert.equal(typeof data.pid, 'number');
    assert.ok(data.memory && typeof data.memory.rss === 'number');
    assert.ok(data.timestamp > 0);
  });

  // 3. HTTP /health/readiness
  await suite.test('HTTP /health/readiness returns subsystem readiness flags', async () => {
    const res = await fetch(`${BASE_URL}/health/readiness`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ready');
    assert.equal(data.runtime, 'zero-native');
    assert.equal(data.services.gateway, 'ready');
    assert.equal(data.services.modelFabric, 'ready');
    assert.equal(data.services.capabilityEngine, 'ready');
    assert.equal(data.services.sessionStore, 'ready');
    assert.equal(data.services.taskStore, 'ready');
  });

  // 4. HTTP /health/features
  await suite.test('HTTP /health/features reports operational capability domains', async () => {
    const res = await fetch(`${BASE_URL}/health/features`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.features.models.active, true);
    assert.equal(data.features.agents.active, true);
    assert.equal(data.features.computer.active, true);
    assert.equal(data.features.memory.active, true);
    assert.equal(data.features.automation.active, true);
    assert.equal(data.features.skills.active, true);
    assert.equal(data.features.plugins.active, true);
  });

  // 5. WebSocket RPC contracts for liveness, readiness, features
  await suite.test('WebSocket RPC contracts match HTTP readiness definitions', async () => {
    const token = await getLoopbackToken();
    const ws = new WS(WS_URL);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

    try {
      // Handshake
      const hsPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'hs') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 'hs', method: 'connect', params: { minProtocol: 4, token } }));
      const hsRes = await hsPromise;
      assert.equal(hsRes.ok, true);

      // Call gateway.liveness
      const livePromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'live-1') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 'live-1', method: 'gateway.liveness', params: {} }));
      const liveRes = await livePromise;
      assert.equal(liveRes.ok, true);
      assert.equal(liveRes.payload.status, 'live');

      // Call gateway.readiness
      const readyPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'ready-1') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 'ready-1', method: 'gateway.readiness', params: {} }));
      const readyRes = await readyPromise;
      assert.equal(readyRes.ok, true);
      assert.equal(readyRes.payload.status, 'ready');
      assert.equal(readyRes.payload.services.modelFabric, 'ready');

      // Call gateway.features
      const featPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'feat-1') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 'feat-1', method: 'gateway.features', params: {} }));
      const featRes = await featPromise;
      assert.equal(featRes.ok, true);
      assert.equal(featRes.payload.features.models.active, true);
    } finally {
      ws.close();
    }
  });

  // 6. Robust connection recovery & session persistence across reconnect
  await suite.test('WebSocket connection recovery resumes session state without loss', async () => {
    const token = await getLoopbackToken();
    const testSessionKey = `test-reconnect-${Date.now()}`;

    // Connection 1: Create session and subscribe
    const ws1 = new WS(WS_URL);
    await new Promise((r, j) => { ws1.onopen = r; ws1.onerror = j; });
    try {
      const hsPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'hs1') { ws1.removeEventListener('message', handler); resolve(msg); }
        };
        ws1.addEventListener('message', handler);
      });
      ws1.send(JSON.stringify({ type: 'req', id: 'hs1', method: 'connect', params: { minProtocol: 4, token } }));
      await hsPromise;

      // Create session
      const createPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 's-create') { ws1.removeEventListener('message', handler); resolve(msg); }
        };
        ws1.addEventListener('message', handler);
      });
      ws1.send(JSON.stringify({
        type: 'req',
        id: 's-create',
        method: 'sessions.create',
        params: { id: testSessionKey, title: 'Reconnect Test Session', metadata: { test: true } },
      }));
      const createRes = await createPromise;
      assert.equal(createRes.ok, true);
    } finally {
      ws1.close(); // Simulate unexpected disconnect
    }

    // Small delay to simulate network reconnect
    await new Promise((r) => setTimeout(r, 100));

    // Connection 2: Reconnect with new socket and recover the session
    const ws2 = new WS(WS_URL);
    await new Promise((r, j) => { ws2.onopen = r; ws2.onerror = j; });
    try {
      const hsPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'hs2') { ws2.removeEventListener('message', handler); resolve(msg); }
        };
        ws2.addEventListener('message', handler);
      });
      ws2.send(JSON.stringify({ type: 'req', id: 'hs2', method: 'connect', params: { minProtocol: 4, token } }));
      await hsPromise;

      // Retrieve session after reconnect
      const getPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 's-get') { ws2.removeEventListener('message', handler); resolve(msg); }
        };
        ws2.addEventListener('message', handler);
      });
      ws2.send(JSON.stringify({
        type: 'req',
        id: 's-get',
        method: 'sessions.get',
        params: { id: testSessionKey },
      }));
      const getRes = await getPromise;
      assert.equal(getRes.ok, true);
      assert.equal(getRes.payload.session.id, testSessionKey);
      assert.equal(getRes.payload.session.title, 'Reconnect Test Session');

      // Cleanup
      ws2.send(JSON.stringify({
        type: 'req',
        id: 's-del',
        method: 'sessions.delete',
        params: { key: testSessionKey },
      }));
    } finally {
      ws2.close();
    }
  });
});
