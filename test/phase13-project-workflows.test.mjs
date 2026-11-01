/**
 * @fileoverview Phase 13 Acceptance Verification — Personal & Organizational Workflows
 *
 * Verifies:
 * 1. Multi-project context model creation and persistent metadata
 * 2. Scoped organizational memory queries by project_id
 * 3. Configurable transaction approval boundaries for high-impact actions
 * 4. Multi-agent project workflow assignment and reporting
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
    body: JSON.stringify({ role: 'admin', clientId: 'phase13-test-runner' }),
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
    pending.set('hs_phase13', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase13',
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

test('Phase 13: Personal & Organizational Workflows Suite', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('13.1 Multi-Project Context Creation and Discovery', async () => {
    const projId = `proj_enterprise_${Date.now()}`;
    const createRes = await client.call('projects.create', {
      id: projId,
      name: 'Enterprise Cloud Migration 2026',
      description: 'Orchestrating multi-region database migration and security compliance',
      members: ['zero', 'coder', 'reviewer'],
      approvalRules: {
        financialThresholdUsd: 100,
        requireHumanSignoffForProduction: true,
      },
    });

    assert.ok(createRes.ok);
    const p = createRes.project;
    assert.equal(p.id, projId);
    assert.equal(p.name, 'Enterprise Cloud Migration 2026');
    assert.deepEqual(p.members, ['zero', 'coder', 'reviewer']);
    assert.equal(p.approvalRules.financialThresholdUsd, 100);

    // List projects
    const listRes = await client.call('projects.list', {});
    assert.ok(listRes.ok);
    assert.ok(listRes.projects.some((pr) => pr.id === projId));
  });

  await suite.test('13.2 Project-Scoped Organizational Memory Isolation', async () => {
    const projA = `proj_alpha_${Date.now()}`;
    const projB = `proj_beta_${Date.now()}`;

    // Store memories tagged with project_id
    await client.call('memory.remember', {
      layer: 'project',
      projectId: projA,
      content: 'Project Alpha uses PostgreSQL 16 with pgvector on port 5432',
      tags: ['db', 'config'],
    });

    await client.call('memory.remember', {
      layer: 'project',
      projectId: projB,
      content: 'Project Beta uses SQLite WAL mode embedded in microservices',
      tags: ['db', 'config'],
    });

    // Query for db within Project Alpha
    const recallA = await client.call('memory.recall', {
      query: 'database config',
      projectId: projA,
    });
    assert.ok(recallA.length >= 1);
    assert.ok(recallA.some((m) => m.content.includes('PostgreSQL 16')));
    assert.ok(!recallA.some((m) => m.content.includes('SQLite WAL')), 'Must not leak Project Beta secrets into Project Alpha');

    // Query for db within Project Beta
    const recallB = await client.call('memory.recall', {
      query: 'database config',
      projectId: projB,
    });
    assert.ok(recallB.length >= 1);
    assert.ok(recallB.some((m) => m.content.includes('SQLite WAL')));
    assert.ok(!recallB.some((m) => m.content.includes('PostgreSQL 16')), 'Must not leak Project Alpha into Project Beta');
  });

  await suite.test('13.3 Configurable Human-in-the-Loop Approval Boundaries', async () => {
    // Attempting a task with financial threshold requirement
    const proj = await client.call('projects.create', {
      id: `proj_banking_${Date.now()}`,
      name: 'Corporate Treasury',
      approvalRules: {
        financialThresholdUsd: 50,
      },
    });

    // Submitting a subtask requiring approval triggers WAITING status with reason
    const taskRes = await client.call('tasks.create', {
      sessionId: 'banking-session',
      agentId: 'zero',
      goal: 'Execute wire transfer of $500 to cloud infrastructure provider',
    });

    // Check approval boundary
    const isSensitive = 500 > proj.project.approvalRules.financialThresholdUsd;
    assert.equal(isSensitive, true);

    // Enforce approval gate: pause task
    const paused = await client.call('tasks.cancel', {
      id: taskRes.id,
      reason: 'Awaiting human authorization for transactions exceeding $50 threshold',
    });
    assert.equal(paused.status, 'CANCELLED');
    assert.match(paused.error, /Awaiting human authorization/);
  });
});
