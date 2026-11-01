/**
 * @fileoverview Phase 4 Acceptance Verification — Multi-Agent Workforce & Specialist Teams
 *
 * Verifies:
 * 1. Agent profile discovery (ZERO, Researcher, Coder, Reviewer, Operator)
 * 2. Dynamic team creation & registry via WebSocket RPC
 * 3. Structured agent messaging frames (TASK_ASSIGNED, STEP_PROGRESS, ARTIFACT_CREATED, TASK_COMPLETED)
 * 4. Physical desktop action mutual exclusion via DesktopLeaseManager
 * 5. Concurrent desktop lease contention prevention
 * 6. DAG dependency execution with parallel branches and final consolidation by ZERO
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AgentMessageBus,
  MESSAGE_TYPES,
  DesktopLeaseManager,
  AgentTeamOrchestrator,
  CANONICAL_AGENT_PROFILES,
  TaskStateMachine,
  TASK_STATUS,
} from '../packages/agent-runtime/index.mjs';

const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const WS = globalThis.WebSocket;

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase4-test-runner' }),
  });
  assert.equal(authRes.status, 200, 'POST /api/auth/session must return 200');
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
          reject(new Error(frame.error?.message || 'RPC Error'));
        } else {
          resolve(frame.payload);
        }
      }
    } catch (_) {}
  });

  // Perform Protocol 4 handshake
  const hsPromise = new Promise((resolve, reject) => {
    pending.set('hs_phase4', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase4',
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

test('Phase 4: Multi-Agent Workforce & Specialist Teams Verification', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('4.1 Agent Profiles & Specialist Discovery', async () => {
    const res = await client.call('agent.profile.list');
    assert.ok(res.ok);
    assert.ok(Array.isArray(res.profiles));
    assert.ok(res.profiles.length >= 5);

    const ids = res.profiles.map((p) => p.id);
    assert.ok(ids.includes('zero'), 'Must include primary coordinator ZERO');
    assert.ok(ids.includes('researcher'), 'Must include researcher');
    assert.ok(ids.includes('coder'), 'Must include coder');
    assert.ok(ids.includes('reviewer'), 'Must include reviewer');
    assert.ok(ids.includes('operator'), 'Must include desktop operator');

    const operator = res.profiles.find((p) => p.id === 'operator');
    assert.equal(operator.requiresDesktopLease, true, 'Operator must declare requiresDesktopLease');
  });

  await suite.test('4.2 Dynamic Team Creation and Registry', async () => {
    // 1. List default teams
    const listRes = await client.call('agent.team.list');
    assert.ok(listRes.ok);
    assert.ok(listRes.teams.some((t) => t.id === 'team_alpha_core'));

    // 2. Create custom specialist squad
    const createRes = await client.call('agent.team.create', {
      id: 'team_security_audit',
      name: 'Security & Integrity Squad',
      description: 'Focused team for code review and threat analysis',
      leadAgentId: 'zero',
      members: ['zero', 'researcher', 'reviewer'],
    });

    assert.ok(createRes.ok);
    assert.equal(createRes.team.id, 'team_security_audit');
    assert.deepEqual(createRes.team.members, ['zero', 'researcher', 'reviewer']);

    // 3. Verify in team list
    const updatedList = await client.call('agent.team.list');
    assert.ok(updatedList.teams.some((t) => t.id === 'team_security_audit'));
  });

  await suite.test('4.3 Automated Goal Decomposition into DAG Plan', async () => {
    const planRes = await client.call('agent.task.plan', {
      goal: 'Research latest memory compression algorithms, implement a benchmark script, and review security risks',
    });

    assert.ok(planRes.ok);
    const plan = planRes.plan;
    assert.equal(plan.leadAgentId, 'zero');
    assert.ok(plan.subtasks.length >= 3, 'Must decompose into at least 3 specialist subtasks');

    const researcherSubtask = plan.subtasks.find((s) => s.agentId === 'researcher');
    const coderSubtask = plan.subtasks.find((s) => s.agentId === 'coder');
    const reviewerSubtask = plan.subtasks.find((s) => s.agentId === 'reviewer');

    assert.ok(researcherSubtask, 'Research subtask planned');
    assert.ok(coderSubtask, 'Coding subtask planned');
    assert.ok(reviewerSubtask, 'Reviewer subtask planned');

    // Verify dependency DAG: coder depends on researcher; reviewer depends on coder
    assert.ok(coderSubtask.dependsOn.includes(researcherSubtask.id), 'Coder must depend on research findings');
    assert.ok(reviewerSubtask.dependsOn.includes(coderSubtask.id), 'Reviewer must depend on coder output');
  });

  await suite.test('4.4 Structured Agent Messaging Frames', async () => {
    const bus = new AgentMessageBus();
    const received = [];

    bus.onType(MESSAGE_TYPES.TASK_ASSIGNED, (msg) => received.push(msg));
    bus.onType(MESSAGE_TYPES.STEP_PROGRESS, (msg) => received.push(msg));
    bus.onType(MESSAGE_TYPES.ARTIFACT_CREATED, (msg) => received.push(msg));
    bus.onType(MESSAGE_TYPES.TASK_COMPLETED, (msg) => received.push(msg));

    // Send sequence of structured messages
    bus.send({
      taskId: 'test-flow-1',
      fromAgentId: 'zero',
      toAgentId: 'researcher',
      type: MESSAGE_TYPES.TASK_ASSIGNED,
      payload: { subtaskId: 'st-1', goal: 'Scan papers' },
    });

    bus.send({
      taskId: 'test-flow-1',
      fromAgentId: 'researcher',
      toAgentId: '*',
      type: MESSAGE_TYPES.STEP_PROGRESS,
      payload: { subtaskId: 'st-1', progressPct: 50, step: 'Found 4 arxiv papers' },
    });

    bus.send({
      taskId: 'test-flow-1',
      fromAgentId: 'researcher',
      toAgentId: '*',
      type: MESSAGE_TYPES.ARTIFACT_CREATED,
      payload: { subtaskId: 'st-1', artifact: { type: 'json', path: 'papers.json' } },
    });

    bus.send({
      taskId: 'test-flow-1',
      fromAgentId: 'researcher',
      toAgentId: 'zero',
      type: MESSAGE_TYPES.TASK_COMPLETED,
      payload: { subtaskId: 'st-1', result: { count: 4 } },
    });

    assert.equal(received.length, 4);
    assert.equal(received[0].type, MESSAGE_TYPES.TASK_ASSIGNED);
    assert.equal(received[1].type, MESSAGE_TYPES.STEP_PROGRESS);
    assert.equal(received[2].type, MESSAGE_TYPES.ARTIFACT_CREATED);
    assert.equal(received[3].type, MESSAGE_TYPES.TASK_COMPLETED);
    assert.equal(received[2].payload.artifact.path, 'papers.json');

    const history = bus.getMessageHistory('test-flow-1');
    assert.equal(history.length, 4);
  });

  await suite.test('4.5 Desktop Lease Mutual Exclusion & Contention Prevention', async () => {
    // 1. Initial status: lease free
    const status1 = await client.call('agent.lease.status');
    assert.ok(status1.ok);
    assert.equal(status1.held, false);

    // 2. Operator acquires lease
    const acq1 = await client.call('agent.lease.acquire', {
      agentId: 'operator',
      reason: 'Automating desktop window clicks',
      timeoutMs: 5000,
      waitMs: 500,
    });
    assert.ok(acq1.acquired);
    assert.equal(acq1.holder, 'operator');

    // 3. Status shows held
    const status2 = await client.call('agent.lease.status');
    assert.equal(status2.held, true);
    assert.equal(status2.holder, 'operator');

    // 4. Second agent attempts to acquire with 0 waitMs -> denied immediately
    const acq2 = await client.call('agent.lease.acquire', {
      agentId: 'subagent_2',
      reason: 'Concurrent typing attempt',
      timeoutMs: 5000,
      waitMs: 0,
    });
    assert.equal(acq2.acquired, false, 'Must reject concurrent acquisition');
    assert.equal(acq2.holder, 'operator');

    // 5. Operator releases lease
    const rel = await client.call('agent.lease.release', { agentId: 'operator' });
    assert.ok(rel.released);

    // 6. Status reflects release
    const status3 = await client.call('agent.lease.status');
    assert.equal(status3.held, false);
  });

  await suite.test('4.6 End-to-End Multi-Agent Workflow Execution & Consolidation', async () => {
    const subtasks = [
      {
        id: 'st_research',
        agentId: 'researcher',
        goal: 'Retrieve SQLite WAL mode documentation',
        dependsOn: [],
        tools: ['web_search'],
      },
      {
        id: 'st_code',
        agentId: 'coder',
        goal: 'Implement WAL journal mode connection setup',
        dependsOn: ['st_research'],
        tools: ['write_file'],
      },
      {
        id: 'st_review',
        agentId: 'reviewer',
        goal: 'Verify concurrency semantics and PR integrity',
        dependsOn: ['st_code'],
        tools: ['review_diff'],
      },
    ];

    const execRes = await client.call('agent.task.execute', {
      goal: 'Benchmark and optimize SQLite WAL concurrency',
      teamId: 'team_alpha_core',
      subtasks,
      timeoutMs: 15000,
    });

    assert.ok(execRes.ok);
    assert.equal(execRes.status, 'COMPLETED');
    assert.equal(execRes.plan.length, 3);
    assert.equal(execRes.consolidatedResult.completedSubtasks, 3);
    assert.equal(execRes.consolidatedResult.failedSubtasks, 0);

    // Verify all subtasks completed
    assert.equal(execRes.subtaskStatuses.st_research, 'COMPLETED');
    assert.equal(execRes.subtaskStatuses.st_code, 'COMPLETED');
    assert.equal(execRes.subtaskStatuses.st_review, 'COMPLETED');

    // Verify results consolidated
    assert.ok(execRes.consolidatedResult.results.st_research);
    assert.ok(execRes.consolidatedResult.results.st_code);
    assert.ok(execRes.consolidatedResult.results.st_review);
    assert.match(execRes.consolidatedResult.summary, /3 subtasks succeeded/);
  });
});
