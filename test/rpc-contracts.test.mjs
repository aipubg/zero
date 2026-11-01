/**
 * @fileoverview Zero AI — RPC Contract & Security Authorization Test Suite
 * 
 * Verifies real state changes, schema validation, scope enforcement, secret redaction,
 * and mandatory negative cases for WebSocket JSON-RPC methods on Zero Native Gateway.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const WS = globalThis.WebSocket;
const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
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
  let authToken = '';
  let originalConfig = null;
  const hadPrefs = fs.existsSync(PREFS_PATH);

  suite.before(async () => {
    try {
      const uiCfg = await fetch(`${BASE_URL}/control-ui-config.json`).then((r) => r.json());
      authToken = uiCfg.gatewayToken || '';
    } catch {}
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
    // Handshake with server token as admin
    const handshake = await client.call('connect', {
      minProtocol: 4,
      maxProtocol: 4,
      role: 'admin',
      token: authToken,
    });
    assert.equal(handshake.ok, true, 'Admin handshake established');
    assert.equal(handshake.payload.auth.role, 'admin');
    assert.ok(handshake.payload.auth.scopes.includes('admin'), 'Server granted admin scope to authenticated principal');
  });

  suite.afterEach(() => {
    if (client) client.close();
  });

  await suite.test('config.get returns real configuration with redacted secrets', async () => {
    const res = await client.call('config.get');
    assert.equal(res.ok, true);
    assert.ok(res.payload.config, 'Config object returned');
    assert.ok(res.payload.hash, 'Config hash returned');
    assert.equal(typeof res.payload.hash, 'string');
    // Secret disclosure guard
    const cfgStr = JSON.stringify(res.payload.config);
    assert.ok(!cfgStr.includes('nvapi-'), 'Raw API key was not leaked in config.get');
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
    assert.equal(nv.configured, true);
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

  await suite.test('sessions.setInvolvement persists involvement state', async () => {
    const res = await client.call('sessions.setInvolvement', {
      sessionKey: 'agent:zero:main',
      involvement: 'passive',
    });
    assert.equal(res.ok, true);
    assert.equal(res.payload.involvement, 'passive');
  });

  // MANDATORY SECURITY NEGATIVE TESTS (Blocker 1)
  await suite.test('untrusted client cannot self-assign operator.admin without valid token', async () => {
    const unauthClient = createRpcClient();
    try {
      // Client tries to request admin role and scopes with invalid token
      const handshake = await unauthClient.call('connect', {
        minProtocol: 4,
        maxProtocol: 4,
        role: 'admin',
        scopes: ['admin', 'operator.admin'],
        token: 'invalid_malicious_token',
      });
      // Invalid token must be rejected outright
      assert.equal(handshake.ok, false);
      assert.ok(handshake.error.includes('Invalid gateway authentication token'));
    } finally {
      unauthClient.close();
    }
  });

  await suite.test('tokenless client is restricted to viewer and denied admin scopes in handshake', async () => {
    const unauthClient = createRpcClient();
    try {
      // Client connects tokenless and requests admin role
      const handshake = await unauthClient.call('connect', {
        minProtocol: 4,
        maxProtocol: 4,
        role: 'admin',
        scopes: ['admin', 'operator.admin', 'operator.write'],
      });
      assert.equal(handshake.ok, true);
      assert.equal(handshake.payload.auth.role, 'viewer', 'Server forced role to viewer');
      assert.deepEqual(handshake.payload.auth.scopes, ['operator.read'], 'Server only granted operator.read');
    } finally {
      unauthClient.close();
    }
  });

  await suite.test('untrusted viewer cannot modify provider credentials', async () => {
    const viewer = createRpcClient();
    try {
      await viewer.call('connect', { minProtocol: 4, maxProtocol: 4 });
      const res = await viewer.call('zero.providers.configure', { provider: { id: 'evil' } });
      assert.equal(res.ok, false);
      assert.ok(res.error.includes('requires scope'));
    } finally {
      viewer.close();
    }
  });

  await suite.test('untrusted viewer cannot invoke desktop actions', async () => {
    const viewer = createRpcClient();
    try {
      await viewer.call('connect', { minProtocol: 4, maxProtocol: 4 });
      const res = await viewer.call('zero.computer.control', { action: 'left_click' });
      assert.equal(res.ok, false);
      assert.ok(res.error.includes('requires scope'));
    } finally {
      viewer.close();
    }
  });

  await suite.test('untrusted viewer cannot modify another client sessions', async () => {
    const viewer = createRpcClient();
    try {
      await viewer.call('connect', { minProtocol: 4, maxProtocol: 4 });
      const res = await viewer.call('sessions.delete', { key: 'agent:zero:main' });
      assert.equal(res.ok, false);
      assert.ok(res.error.includes('requires scope'));
    } finally {
      viewer.close();
    }
  });

  await suite.test('untrusted viewer cannot register executable automations', async () => {
    const viewer = createRpcClient();
    try {
      await viewer.call('connect', { minProtocol: 4, maxProtocol: 4 });
      const res = await viewer.call('automation.registerJob', {
        name: 'Evil Cron',
        schedule: '* * * * *',
        action: 'hack',
      });
      assert.equal(res.ok, false);
      assert.ok(res.error.includes('requires scope'));
    } finally {
      viewer.close();
    }
  });

  await suite.test('untrusted viewer cannot restart or reconfigure the gateway', async () => {
    const viewer = createRpcClient();
    try {
      await viewer.call('connect', { minProtocol: 4, maxProtocol: 4 });
      const restartRes = await viewer.call('zero.gateway.restart');
      assert.equal(restartRes.ok, false);
      assert.ok(restartRes.error.includes('requires scope'));

      const configRes = await viewer.call('config.set', { config: { port: 1234 } });
      assert.equal(configRes.ok, false);
      assert.ok(configRes.error.includes('requires scope'));
    } finally {
      viewer.close();
    }
  });

  await suite.test('unknown RPC method deterministically returns method not found error', async () => {
    const res = await client.call('bogus.nonexistent.rpc');
    assert.equal(res.ok, false);
    assert.ok(res.error.includes('not found on Zero Native Gateway'));
  });
});
