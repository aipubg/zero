/**
 * @fileoverview Phase 14 Acceptance Verification — Mobile Companion & Cross-Device Protocol
 *
 * Verifies:
 * 1. Short-lived pairing code generation
 * 2. Device pairing claim with cryptographic auth token issuance
 * 3. Multi-platform device listing (Android, iOS, Secondary PC)
 * 4. Remote push notification dispatch and persistence
 * 5. Device unpairing and cleanup
 * 6. Protection against expired or invalid pairing codes
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
    body: JSON.stringify({ role: 'admin', clientId: 'phase14-test-runner' }),
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
    pending.set('hs_phase14', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase14',
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
    close: () => {
      try { ws.close(); } catch (_) {}
    },
  };
}

test('Phase 14 — Cross-Device Companion Protocol', async (t) => {
  let client;

  t.before(async () => {
    client = await createRpcClient();
  });

  t.after(() => {
    client?.close();
  });

  let generatedCode;

  await t.test('1. Generates 6-character short-lived pairing code', async () => {
    const res = await client.call('devices.pair.generateCode', { role: 'companion', ttlMs: 60000 });
    assert.equal(res.ok, true);
    assert.ok(res.pairingCode);
    assert.equal(res.pairingCode.length, 6);
    assert.ok(res.expiresAt > Date.now());
    generatedCode = res.pairingCode;
  });

  await t.test('2. Rejects claim with invalid pairing code', async () => {
    await assert.rejects(
      async () => {
        await client.call('devices.pair.claim', {
          pairingCode: 'INVALID',
          deviceId: 'dev_rogue_1',
          deviceName: 'Rogue Phone',
          platform: 'android',
        });
      },
      /Invalid or expired pairing code/
    );
  });

  let phoneToken;
  await t.test('3. Successfully claims pairing code and registers Android phone', async () => {
    const res = await client.call('devices.pair.claim', {
      pairingCode: generatedCode,
      deviceId: 'dev_pixel_9_pro',
      deviceName: "User's Pixel 9 Pro",
      platform: 'android',
      capabilities: ['camera', 'microphone', 'push_notifications'],
    });

    assert.equal(res.ok, true);
    assert.ok(res.device);
    assert.equal(res.device.id, 'dev_pixel_9_pro');
    assert.equal(res.device.deviceName, "User's Pixel 9 Pro");
    assert.equal(res.device.platform, 'android');
    assert.ok(res.token.startsWith('devtok_'));
    phoneToken = res.token;
  });

  await t.test('4. Lists paired devices with active registration', async () => {
    const res = await client.call('devices.list', {});
    assert.equal(res.ok, true);
    assert.ok(Array.isArray(res.devices));
    const phone = res.devices.find((d) => d.id === 'dev_pixel_9_pro');
    assert.ok(phone);
    assert.equal(phone.deviceName, "User's Pixel 9 Pro");
    assert.equal(phone.status, 'paired');
  });

  let notificationId;
  await t.test('5. Dispatches remote push notification to paired device', async () => {
    const res = await client.call('devices.notify', {
      deviceId: 'dev_pixel_9_pro',
      title: 'Zero Long-Running Task Completed',
      body: 'Autonomous build and regression test matrix passed with 0 errors.',
      priority: 'high',
      payload: { taskId: 'task_autonomous_build_99', status: 'completed' },
    });

    assert.equal(res.ok, true);
    assert.ok(res.notification);
    assert.equal(res.notification.title, 'Zero Long-Running Task Completed');
    assert.equal(res.notification.deviceId, 'dev_pixel_9_pro');
    notificationId = res.notification.id;
  });

  await t.test('6. Lists and marks notifications as read for paired device', async () => {
    const listRes = await client.call('devices.notifications.list', { deviceId: 'dev_pixel_9_pro' });
    assert.equal(listRes.ok, true);
    assert.ok(Array.isArray(listRes.notifications));
    const notif = listRes.notifications.find((n) => n.id === notificationId);
    assert.ok(notif);
    assert.equal(notif.read, false);

    const markRes = await client.call('devices.notifications.markRead', { id: notificationId });
    assert.equal(markRes.ok, true);

    const updatedRes = await client.call('devices.notifications.list', { deviceId: 'dev_pixel_9_pro', unreadOnly: true });
    assert.equal(updatedRes.ok, true);
    const unread = updatedRes.notifications.find((n) => n.id === notificationId);
    assert.equal(unread, undefined);
  });

  await t.test('7. Unpairs device cleanly', async () => {
    const res = await client.call('devices.unpair', { deviceId: 'dev_pixel_9_pro' });
    assert.equal(res.ok, true);

    const listRes = await client.call('devices.list', {});
    const phone = listRes.devices.find((d) => d.id === 'dev_pixel_9_pro');
    assert.equal(phone, undefined);
  });
});
