/**
 * @fileoverview Phase 11 Acceptance Verification — Proactive Background Automation & Connectors
 *
 * Verifies:
 * 1. Persistent cron job registration, next-run scheduling, and execution run logging
 * 2. Event-driven conditional workflow triggering (condition matching and execution)
 * 3. Pre-built automation template listing and instantiation
 * 4. External application connector registration, discovery, and health test ping
 * 5. WebSocket RPC contract integrity
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
    body: JSON.stringify({ role: 'admin', clientId: 'phase11-test-runner' }),
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
    pending.set('hs_phase11', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase11',
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

test('Phase 11: Proactive Automation & Connected Connectors Suite', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('11.1 Scheduled Cron Job Registration and Due Execution', async () => {
    const jobId = `job_test_${Date.now()}`;
    const pastTime = Date.now() - 5000;

    // Register job due immediately
    const regRes = await client.call('automation.registerJob', {
      id: jobId,
      title: 'Periodic Health Sweep',
      cronExpr: '*/15 * * * *',
      targetAction: 'get_window_state',
      params: {},
      nextRunAt: pastTime,
    });
    assert.equal(regRes.id, jobId);
    assert.equal(regRes.title, 'Periodic Health Sweep');

    // Trigger due jobs
    const triggerRes = await client.call('automation.triggerDue', {});
    assert.ok(triggerRes.triggeredCount >= 1);
    const thisRun = triggerRes.runs.find((r) => r.jobId === jobId);
    assert.ok(thisRun, 'Our registered job must have executed');
    assert.equal(thisRun.status, 'completed');

    // Verify in runs list
    const runsList = await client.call('automation.listRuns', { jobId });
    assert.ok(runsList.length >= 1);
    assert.equal(runsList[0].jobId, jobId);

    // Clean up
    await client.call('automation.deleteJob', { id: jobId });
  });

  await suite.test('11.2 Event-Driven Conditional Workflow Rules', async () => {
    const existingRules = await client.call('automation.events.rules');
    if (existingRules.ok && Array.isArray(existingRules.rules)) {
      for (const r of existingRules.rules) {
        if (r.eventType === 'screen:window_changed') {
          await client.call('automation.events.deleteRule', { id: r.id });
        }
      }
    }

    const ruleId = `rule_screen_${Date.now()}`;

    // Register rule: when screen:window_changed event occurs with title containing "Code", trigger action
    const ruleRes = await client.call('automation.events.registerRule', {
      id: ruleId,
      eventType: 'screen:window_changed',
      condition: { field: 'windowTitle', contains: 'Code' },
      targetAction: 'get_screen_size',
      params: { tag: 'code_active' },
    });
    assert.ok(ruleRes.ok);
    assert.equal(ruleRes.rule.id, ruleId);

    // 1. Dispatch event that DOES NOT match condition -> not triggered
    const dispatch1 = await client.call('automation.events.emit', {
      eventType: 'screen:window_changed',
      eventData: { windowTitle: 'Calculator' },
    });
    assert.equal(dispatch1.rulesTriggered, 0);

    // 2. Dispatch event that DOES match condition -> triggered
    const dispatch2 = await client.call('automation.events.emit', {
      eventType: 'screen:window_changed',
      eventData: { windowTitle: 'Visual Studio Code' },
    });
    assert.ok(dispatch2.rulesTriggered >= 1);
    const exec = dispatch2.executions.find((e) => e.ruleId === ruleId);
    assert.ok(exec);
    assert.equal(exec.status, 'executed');

    // Clean up
    await client.call('automation.events.deleteRule', { id: ruleId });
  });

  await suite.test('11.3 Automation Templates Catalog and Instantiation', async () => {
    const tplList = await client.call('automation.templates.list');
    assert.ok(tplList.ok);
    assert.ok(Array.isArray(tplList.templates));
    assert.ok(tplList.templates.length >= 3);

    const digestTpl = tplList.templates.find((t) => t.id === 'tpl_daily_research_digest');
    assert.ok(digestTpl);
    assert.equal(digestTpl.cronExpr, '0 9 * * *');

    // Instantiate template
    const instRes = await client.call('automation.templates.instantiate', {
      templateId: 'tpl_screen_idle_backup',
      params: { olderThanDays: 7 },
    });
    assert.ok(instRes.ok);
    assert.ok(instRes.instantiated);
  });

  await suite.test('11.4 External Connected Connectors Discovery and Health Ping', async () => {
    const connList = await client.call('automation.connectors.list');
    assert.ok(connList.ok);
    assert.ok(Array.isArray(connList.connectors));
    assert.ok(connList.connectors.length >= 2);

    const webhookConn = connList.connectors.find((c) => c.type === 'webhook');
    assert.ok(webhookConn);

    // Test connector health
    const testRes = await client.call('automation.connectors.test', {
      id: webhookConn.id,
    });
    assert.ok(testRes.ok);
    assert.equal(testRes.status, 'healthy');
  });
});
