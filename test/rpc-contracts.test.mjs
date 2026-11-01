/**
 * @fileoverview Zero AI — RPC Contract & Security Authorization Test Suite
 * 
 * Verifies real state changes, schema validation, scope enforcement, and negative cases
 * for WebSocket JSON-RPC methods on Zero Native Gateway.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const WS = globalThis.WebSocket;
const PORT = 18789;
const WS_URL = `ws://127.0.0.1:${PORT}/`;
const CONFIG_PATH = path.resolve('zero-system/config/zero.json');
const PREFS_PATH = path.resolve('zero-system/config/user-prefs.json');

function createRpcClient() {
  const ws = new WS(WS_URL);
  let msgId = 0;
  const pending = new Map();

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const reqId = msg.id;
      if (reqId && pending.has(reqId)) {
        const { resolve } = pending.get(reqId);
        pending.delete(reqId);
        resolve(msg);
      }
    } catch (_) {}
  };

  const readyPromise = new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  async function call(method, params = {}, isReference = true) {
    await readyPromise;
    const id = `rpc_${++msgId}`;
    return new Promise((resolve) => {
      pending.set(id, { resolve });
      ws.send(JSON.stringify(isReference ? {
        type: 'req',
        id,
        method,
        params,
      } : {
        jsonrpc: '2.0',
        id,
        method,
        params,
      }));
    });
  }

  return { ws, call, close: () => ws.close() };
}

test('Zero AI RPC Contract & Scope Enforcement Suite', async (suite) => {
  let client;
  let originalConfig = null;
  const hadPrefs = fs.existsSync(PREFS_PATH);

  suite.before(() => {
    if (fs.existsSync(CONFIG_PATH)) {
      originalConfig = fs.readFileSync(CONFIG_PATH, 'utf8');
    }
  });

  suite.after(() => {
    if (originalConfig !== null) {
      fs.writeFileSync(CONFIG_PATH, originalConfig, 'utf8');
    }
    if (!hadPrefs && fs.existsSync(PREFS_PATH)) {
      try { fs.unlinkSync(PREFS_PATH); } catch (_) {}
    }
  });

  suite.beforeEach(async () => {
    client = createRpcClient();
    // Handshake as admin
    const handshake = await client.call('connect', {
      minProtocol: 4,
      maxProtocol: 4,
      role: 'operator',
      scopes: ['admin', 'operator.read', 'operator.write', 'operator.admin', 'computer.control'],
    });
    assert.equal(handshake.ok, true, 'Admin handshake established');
  });

  suite.afterEach(() => {
    if (client) client.close();
  });

  await suite.test('config.get returns real configuration with hash', async () => {
    const res = await client.call('config.get');
    assert.equal(res.ok, true);
    assert.ok(res.payload.config, 'Config object returned');
    assert.ok(res.payload.hash, 'Config hash returned');
    assert.equal(typeof res.payload.hash, 'string');
  });

  await suite.test('config.patch validates and persists changes', async () => {
    const res = await client.call('config.patch', {
      config: { testParam: 'zero_verification_val' },
    });
    assert.equal(res.ok, true);
    assert.equal(res.payload.config.testParam, 'zero_verification_val');

    // Read back via config.get
    const getRes = await client.call('config.get');
    assert.equal(getRes.payload.config.testParam, 'zero_verification_val');
  });

  await suite.test('config.patch rejects invalid port out of range', async () => {
    const res = await client.call('config.patch', {
      config: { gateway: { port: 99999 } },
    });
    assert.equal(res.ok, false);
    assert.ok(res.error.includes('between 1024 and 65535'));
  });

  await suite.test('users.prefs.get and set persists preferences', async () => {
    const setRes = await client.call('users.prefs.set', {
      prefs: { theme: 'dark', soundAlerts: false },
    });
    assert.equal(setRes.ok, true);
    assert.equal(setRes.payload.prefs.theme, 'dark');

    const getRes = await client.call('users.prefs.get');
    assert.equal(getRes.ok, true);
    assert.equal(getRes.payload.prefs.theme, 'dark');
  });

  await suite.test('models.authStatus returns live provider report', async () => {
    const res = await client.call('models.authStatus');
    assert.equal(res.ok, true);
    assert.ok(Array.isArray(res.payload.providers));
    const nv = res.payload.providers.find((p) => p.provider === 'nv' || p.provider === 'nvidia');
    assert.ok(nv, 'NVIDIA provider reported');
    assert.equal(nv.authenticated, true);
  });

  await suite.test('sessions.subscribe and unsubscribe manage subscriptions', async () => {
    const subRes = await client.call('sessions.subscribe', { key: 'test:contract:session' });
    assert.equal(subRes.ok, true);
    assert.equal(subRes.payload.subscribed, true);

    const unsubRes = await client.call('sessions.unsubscribeMessages', { key: 'test:contract:session' });
    assert.equal(unsubRes.ok, true);
    assert.equal(unsubRes.payload.subscribed, false);
  });

  await suite.test('zero.gateway.restart returns scheduling confirmation', async () => {
    const res = await client.call('zero.gateway.restart');
    assert.equal(res.ok, true);
    assert.equal(res.payload.status, 'restarting');
  });

  await suite.test('unauthorized client cannot perform admin mutations', async () => {
    const unauthClient = createRpcClient();
    try {
      // Connect as restricted viewer
      await unauthClient.call('connect', {
        minProtocol: 4,
        role: 'operator',
        scopes: ['operator.read', 'operator.sessions.read'],
      });

      // Attempt admin config.set
      const denied = await unauthClient.call('config.set', { config: { hacked: true } });
      assert.equal(denied.ok, false);
      assert.ok(denied.error.includes('requires scope'), 'Refused due to insufficient scope');
    } finally {
      unauthClient.close();
    }
  });

  await suite.test('unknown RPC method deterministically returns method not found error', async () => {
    const res = await client.call('bogus.nonexistent.rpc');
    assert.equal(res.ok, false);
    assert.ok(res.error.includes('not found on Zero Native Gateway'));
  });

});
