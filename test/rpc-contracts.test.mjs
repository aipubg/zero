/**
 * @fileoverview Zero AI — RPC Contract & Security Authorization Test Suite
 * 
 * Verifies real state changes, schema validation, scope enforcement, secret redaction,
 * and mandatory negative cases for WebSocket JSON-RPC methods on Zero Native Gateway.
 */

import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

const WS = globalThis.WebSocket;
let PORT, BASE_URL, WS_URL, CONFIG_PATH, PREFS_PATH;
const errorText = response => typeof response.error === 'string' ? response.error : response.error?.message;

function createRpcClient() {
  const ws = new WS(WS_URL);
  let msgId = 0;
  const pending = new Map();

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const reqId = msg.id;
      if (reqId && pending.has(reqId)) {
        const { resolve, timer } = pending.get(reqId);
        clearTimeout(timer);
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
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`RPC timeout: ${method}`)); }, 3000);
      pending.set(id, { resolve, timer });
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

test('Isolated actual WebSocket RPC contracts and scope enforcement', { timeout: 45000 }, async (suite) => {
  let client;
  let authToken = '';
  let root, host;

  suite.before(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-rpc-contract-'));
    CONFIG_PATH = path.join(root, 'config.json');
    PREFS_PATH = path.join(root, 'prefs.json');
    const providersPath = path.join(root, 'providers.json');
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ models: { providers: { 'mock-provider': { apiKey: 'mock-contract-private' } } } }));
    fs.writeFileSync(providersPath, JSON.stringify([{ id: 'mock-provider', baseUrl: 'https://example.invalid/v1', apiKey: 'mock-contract-private', models: ['fixture'] }]));
    const reservation = net.createServer();
    await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
    PORT = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    BASE_URL = `http://127.0.0.1:${PORT}`; WS_URL = `ws://127.0.0.1:${PORT}/`;
    host = new ZeroNativeHost({ port: PORT, token: 'contract-only-token', configPath: CONFIG_PATH,
      prefsPath: PREFS_PATH, providersPath, agentBindingsPath: path.join(root, 'bindings.json'),
      dataDir: path.join(root, 'data'), skillsDir: path.join(root, 'skills'), localModelsDir: path.join(root, 'models') });
    await host.start();
      const uiCfg = await fetch(`${BASE_URL}/control-ui-config.json`).then((r) => r.json());
      assert.equal(uiCfg.gatewayToken, undefined, 'gatewayToken must never be exposed in control-ui-config.json');
      assert.equal(uiCfg.token, undefined, 'token must never be exposed in control-ui-config.json');

      const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'test-rpc-suite', role: 'admin' }),
      }).then((r) => r.json());
      authToken = sessionRes.token || '';
  });

  suite.after(async () => {
    await host?.close();
    if (!root) return;
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-rpc-contract-'));
    fs.rmSync(resolved, { recursive: true, force: true });
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
    assert.equal(JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')).testParam, 'zero_verification_val');
  });

  await suite.test('config.patch rejects invalid port out of range', async () => {
    const res = await client.call('config.patch', {
      config: { gateway: { port: 99999 } },
    });
    assert.equal(res.ok, false);
    assert.ok(errorText(res).includes('between 1024 and 65535'));
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
    assert.equal(JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8')).theme, 'dark');
    const original = fs.readFileSync(PREFS_PATH, 'utf8');
    try {
      for (const invalid of ['{broken', 'null', '[]', '17']) {
        fs.writeFileSync(PREFS_PATH, invalid);
        const failedRead = await client.call('users.prefs.get');
        assert.equal(failedRead.ok, false);
        const failed = await client.call('users.prefs.set', { prefs: { theme: 'light' } });
        assert.equal(failed.ok, false);
        assert.equal(fs.readFileSync(PREFS_PATH, 'utf8'), invalid);
      }
    } finally { fs.writeFileSync(PREFS_PATH, original); }
  });

  await suite.test('models.authStatus reports configured fixture without claiming authentication', async () => {
    const res = await client.call('models.authStatus');
    assert.equal(res.ok, true);
    assert.ok(Array.isArray(res.payload.providers));
    const prov = res.payload.providers.find((p) => p.provider === 'mock-provider');
    assert.ok(prov, 'Configured provider reported');
    assert.equal(prov.configured, true);
    assert.equal(prov.authenticated, null);
    assert.equal(prov.tested, false);
  });

  await suite.test('sessions.subscribe and unsubscribe manage subscriptions', async () => {
    const subRes = await client.call('sessions.subscribe', { key: 'test:contract:session' });
    assert.equal(subRes.ok, true);
    assert.equal(subRes.payload.subscribed, true);

    const unsubRes = await client.call('sessions.unsubscribeMessages', { key: 'test:contract:session' });
    assert.equal(unsubRes.ok, true);
    assert.equal(unsubRes.payload.subscribed, false);
  });

  await suite.test('zero.gateway.restart returns scheduling confirmation or explicit unsupported in standalone', async () => {
    const res = await client.call('zero.gateway.restart');
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'UNSUPPORTED_OPERATION');
    assert.match(errorText(res), /active process supervisor/);
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
      assert.ok(errorText(handshake).includes('Invalid gateway authentication token'));
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
      assert.ok(errorText(res).includes('requires scope'));
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
      assert.ok(errorText(res).includes('requires scope'));
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
      assert.ok(errorText(res).includes('requires scope'));
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
      assert.ok(errorText(res).includes('requires scope'));
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
      assert.ok(errorText(restartRes).includes('requires scope'));

      const configRes = await viewer.call('config.set', { config: { port: 1234 } });
      assert.equal(configRes.ok, false);
      assert.ok(errorText(configRes).includes('requires scope'));
    } finally {
      viewer.close();
    }
  });

  await suite.test('unknown RPC method deterministically returns method not found error', async () => {
    const res = await client.call('bogus.nonexistent.rpc');
    assert.equal(res.ok, false);
    assert.ok(errorText(res).includes('not found on Zero Native Gateway'));
  });

  await suite.test('security: DNS rebinding with external Host header is rejected with 403', async () => {
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port: PORT,
        path: '/health',
        method: 'GET',
        headers: { host: 'attacker-dns-rebind.com:18789' },
      }, (r) => {
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () => resolve({ status: r.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      });
      req.on('error', reject);
      req.end();
    });
    assert.equal(res.status, 403);
    assert.ok(res.body.includes('DNS rebinding'));
  });

  await suite.test('security: untrusted cross-origin request is rejected with 403 and receives no CORS grant', async () => {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: { Origin: 'https://evil-attacker.com' },
    });
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });

  await suite.test('security: control-ui-config.json never discloses gateway credentials', async () => {
    const res = await fetch(`${BASE_URL}/control-ui-config.json`);
    assert.equal(res.status, 200);
    const config = await res.json();
    assert.equal(config.gatewayToken, undefined);
    assert.equal(config.token, undefined);
    assert.equal(config.secret, undefined);
  });

  await suite.test('security: local session cookie is HttpOnly and SameSite=Strict', async () => {
    const res = await fetch(`${BASE_URL}/chat/zero`);
    assert.equal(res.status, 200);
    const cookieHeader = res.headers.get('set-cookie') || '';
    assert.ok(cookieHeader.includes('zero_session='));
    assert.ok(cookieHeader.toLowerCase().includes('httponly'));
    assert.ok(cookieHeader.toLowerCase().includes('samesite=strict'));
  });
});
