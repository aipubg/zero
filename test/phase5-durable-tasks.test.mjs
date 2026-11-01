/**
 * @fileoverview Phase 5 Acceptance Verification — Durable Tasks, Checkpoints & Recovery
 *
 * Verifies:
 * 1. Persistent task creation & state machine transitions in SQLite
 * 2. Persistent step checkpoints with state snapshots and artifacts
 * 3. Idempotency key execution preventing duplicate side-effects
 * 4. Execution budget limits (step limits and runtime deadlines)
 * 5. Task failure recovery and retry limits
 * 6. Host process reboot recovery sweep (RUNNING -> WAITING)
 * 7. WebSocket RPC task management contracts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskStateMachine, TASK_STATUS } from '../packages/agent-runtime/index.mjs';

const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const WS = globalThis.WebSocket;

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase5-test-runner' }),
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
          reject(new Error(frame.error?.message || 'RPC Error'));
        } else {
          resolve(frame.payload);
        }
      }
    } catch (_) {}
  });

  const hsPromise = new Promise((resolve, reject) => {
    pending.set('hs_phase5', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase5',
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

test('Phase 5: Durable Background Tasks, Checkpoints & Recovery Suite', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('5.1 Durable Task Lifecycle & Step Persistence in SQLite', () => {
    const sm = new TaskStateMachine({ dbPath: ':memory:' });
    try {
      const task = sm.createTask({
        id: 'durable-task-1',
        sessionId: 'session-durable',
        agentId: 'zero',
        goal: 'Perform multi-stage database migration',
      });
      assert.equal(task.status, TASK_STATUS.PENDING);

      sm.enqueueTask('durable-task-1');
      assert.equal(sm.getTask('durable-task-1').status, TASK_STATUS.QUEUED);

      sm.startTask('durable-task-1');
      assert.equal(sm.getTask('durable-task-1').status, TASK_STATUS.RUNNING);

      // Record steps
      sm.recordStep('durable-task-1', {
        stepNumber: 1,
        thought: 'Checking database schema version',
        toolName: 'read_schema',
        status: 'completed',
      });
      sm.recordStep('durable-task-1', {
        stepNumber: 2,
        thought: 'Applying column additions',
        toolName: 'execute_migration',
        status: 'completed',
      });

      const steps = sm.getTaskSteps('durable-task-1');
      assert.equal(steps.length, 2);
      assert.equal(steps[0].thought, 'Checking database schema version');
      assert.equal(steps[1].thought, 'Applying column additions');

      sm.completeTask('durable-task-1', { migrationVersion: 5 });
      assert.equal(sm.getTask('durable-task-1').status, TASK_STATUS.COMPLETED);
    } finally {
      sm.close();
    }
  });

  await suite.test('5.2 Persistent Step Checkpoints with State Snapshots & Artifacts', async () => {
    const taskId = `task-ckpt-${Date.now()}`;
    
    // Create task via RPC
    const created = await client.call('tasks.create', {
      id: taskId,
      sessionId: 'session-ckpt',
      agentId: 'zero',
      goal: 'Autonomous code generation and test verification',
    });
    assert.equal(created.id, taskId);

    // Save checkpoint 1
    const ckpt1 = await client.call('tasks.checkpoint.save', {
      taskId,
      stepIndex: 1,
      stateSnapshot: { phase: 'analysis', filesExamined: ['server.mjs', 'gateway.mjs'] },
      artifacts: [{ type: 'diff', path: 'patch1.diff' }],
    });
    assert.ok(ckpt1.ok);
    assert.equal(ckpt1.checkpoint.stepIndex, 1);

    // Save checkpoint 2
    const ckpt2 = await client.call('tasks.checkpoint.save', {
      taskId,
      stepIndex: 2,
      stateSnapshot: { phase: 'implementation', filesExamined: ['server.mjs', 'gateway.mjs', 'index.mjs'] },
      artifacts: [{ type: 'diff', path: 'patch1.diff' }, { type: 'test', path: 'test.mjs' }],
    });
    assert.ok(ckpt2.ok);
    assert.equal(ckpt2.checkpoint.stepIndex, 2);

    // Get latest checkpoint
    const latest = await client.call('tasks.checkpoint.get', { taskId });
    assert.ok(latest.ok);
    assert.equal(latest.checkpoint.stepIndex, 2);
    assert.equal(latest.checkpoint.stateSnapshot.phase, 'implementation');
    assert.equal(latest.checkpoint.artifacts.length, 2);

    // List all checkpoints
    const list = await client.call('tasks.checkpoint.list', { taskId });
    assert.ok(list.ok);
    assert.equal(list.checkpoints.length, 2);
    assert.equal(list.checkpoints[0].stepIndex, 1);
    assert.equal(list.checkpoints[1].stepIndex, 2);
  });

  await suite.test('5.3 Idempotency Key Execution Guarantees Single Execution', async () => {
    const sm = new TaskStateMachine({ dbPath: ':memory:' });
    try {
      let sideEffectCounter = 0;
      const idempotencyKey = 'action_dedup_tx_99812';

      const criticalAction = async () => {
        sideEffectCounter += 1;
        return { paymentId: 'pay_123', amount: 50 };
      };

      // First run: executes side effect
      const run1 = await sm.executeIdempotent(idempotencyKey, {
        taskId: 't-idem-1',
        action: 'charge_customer',
        executeFn: criticalAction,
      });
      assert.equal(run1.cached, false);
      assert.equal(run1.result.paymentId, 'pay_123');
      assert.equal(sideEffectCounter, 1);

      // Second run: cached, side effect not run again
      const run2 = await sm.executeIdempotent(idempotencyKey, {
        taskId: 't-idem-1',
        action: 'charge_customer',
        executeFn: criticalAction,
      });
      assert.equal(run2.cached, true);
      assert.equal(run2.result.paymentId, 'pay_123');
      assert.equal(sideEffectCounter, 1, 'Side effect must NOT run a second time');
    } finally {
      sm.close();
    }
  });

  await suite.test('5.4 Task Execution Budget Enforcement', () => {
    const sm = new TaskStateMachine({ dbPath: ':memory:' });
    try {
      const taskId = 'task-budget-test';
      sm.createTask({ id: taskId, goal: 'Step limit test' });
      sm.enqueueTask(taskId);
      sm.startTask(taskId);

      // Set budget limit to 3 steps
      sm.setBudget(taskId, { maxSteps: 3, maxDurationMs: 60000 });

      // Run step 1 & 2
      sm.recordStep(taskId, { stepNumber: 1, thought: 'Step 1' });
      assert.equal(sm.checkBudget(taskId).ok, true);

      sm.recordStep(taskId, { stepNumber: 2, thought: 'Step 2' });
      assert.equal(sm.checkBudget(taskId).ok, true);

      // Run step 3 -> limit reached
      sm.recordStep(taskId, { stepNumber: 3, thought: 'Step 3' });
      assert.throws(
        () => sm.checkBudget(taskId),
        /exceeded step budget limit of 3 steps/
      );
    } finally {
      sm.close();
    }
  });

  await suite.test('5.5 Task Failure and Retry Policy Execution', async () => {
    const taskId = `task-retry-${Date.now()}`;
    await client.call('tasks.create', { id: taskId, goal: 'Flaky network sync' });
    
    // Set to running and fail it
    // In our test, use a local TaskStateMachine instance to test retry limit
    const sm = new TaskStateMachine({ dbPath: ':memory:' });
    try {
      sm.createTask({ id: 'task-retry-local', goal: 'Network sync retry test' });
      sm.enqueueTask('task-retry-local');
      sm.startTask('task-retry-local');

      sm.setBudget('task-retry-local', { maxRetries: 2 });

      // Fail task
      sm.failTask('task-retry-local', 'ECONNRESET');
      assert.equal(sm.getTask('task-retry-local').status, TASK_STATUS.FAILED);

      // Retry 1: transitions back to QUEUED
      const retried1 = sm.retryFailedTask('task-retry-local');
      assert.equal(retried1.status, TASK_STATUS.QUEUED);
      assert.equal(retried1.error, null);

      // Re-run and fail again
      sm.startTask('task-retry-local');
      sm.failTask('task-retry-local', 'ETIMEDOUT');

      // Retry 2: allowed
      const retried2 = sm.retryFailedTask('task-retry-local');
      assert.equal(retried2.status, TASK_STATUS.QUEUED);

      // Re-run and fail a third time
      sm.startTask('task-retry-local');
      sm.failTask('task-retry-local', 'EHOSTUNREACH');

      // Retry 3: exceeds budget maxRetries of 2
      assert.throws(
        () => sm.retryFailedTask('task-retry-local'),
        /exhausted maximum retry attempts/
      );
    } finally {
      sm.close();
    }
  });

  await suite.test('5.6 Process Reboot Recovery Sweep (RUNNING -> WAITING)', () => {
    const sm = new TaskStateMachine({ dbPath: ':memory:' });
    try {
      // Simulate 2 tasks running when server crashed
      sm.createTask({ id: 'crashed-task-A', goal: 'Video rendering' });
      sm.enqueueTask('crashed-task-A');
      sm.startTask('crashed-task-A');

      sm.createTask({ id: 'crashed-task-B', goal: 'Dataset scraping' });
      sm.enqueueTask('crashed-task-B');

      // System starts up and sweeps
      const sweep = sm.recoverTasksOnStartup();
      assert.equal(sweep.recoveredCount, 2);
      assert.ok(sweep.recoveredTaskIds.includes('crashed-task-A'));
      assert.ok(sweep.recoveredTaskIds.includes('crashed-task-B'));

      // Both must be safely in WAITING status with restart reason
      const taskA = sm.getTask('crashed-task-A');
      assert.equal(taskA.status, TASK_STATUS.WAITING);
      assert.match(taskA.waitReason, /RESTART_RECOVERY/);

      const taskB = sm.getTask('crashed-task-B');
      assert.equal(taskB.status, TASK_STATUS.WAITING);
    } finally {
      sm.close();
    }
  });
});
