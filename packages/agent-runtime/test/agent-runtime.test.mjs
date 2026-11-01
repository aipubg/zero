import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskStateMachine, TASK_STATUS } from '../index.mjs';

test('Zero Agent Runtime & Durable Task State Machine', async (t) => {
  const sm = new TaskStateMachine({ dbPath: ':memory:' });

  await t.test('creates task in PENDING status and transitions through happy path', () => {
    const task = sm.createTask({
      id: 'task-test-01',
      sessionId: 'session-xyz',
      agentId: 'zero',
      goal: 'Open browser and inspect logs',
    });

    assert.equal(task.id, 'task-test-01');
    assert.equal(task.status, TASK_STATUS.PENDING);
    assert.equal(task.goal, 'Open browser and inspect logs');

    // Enqueue
    const queued = sm.enqueueTask('task-test-01');
    assert.equal(queued.status, TASK_STATUS.QUEUED);

    // Start
    const running = sm.startTask('task-test-01');
    assert.equal(running.status, TASK_STATUS.RUNNING);

    // Pause for human authorization
    const waiting = sm.pauseTask('task-test-01', 'Operator review requested');
    assert.equal(waiting.status, TASK_STATUS.WAITING);
    assert.equal(waiting.waitReason, 'Operator review requested');

    // Resume
    const resumed = sm.resumeTask('task-test-01');
    assert.equal(resumed.status, TASK_STATUS.RUNNING);

    // Complete
    const completed = sm.completeTask('task-test-01', { summary: 'Inspection successful' });
    assert.equal(completed.status, TASK_STATUS.COMPLETED);
    assert.deepEqual(completed.result, { summary: 'Inspection successful' });
    assert.ok(completed.completedAt > 0);
  });

  await t.test('disallows invalid state transitions', () => {
    const task = sm.createTask({
      id: 'task-test-02',
      goal: 'Invalid transition test',
    });

    // PENDING cannot jump directly to COMPLETED
    assert.throws(
      () => sm.completeTask('task-test-02'),
      /Invalid task state transition from 'PENDING' to 'COMPLETED'/
    );

    // Transition to CANCELLED is allowed from PENDING
    const cancelled = sm.cancelTask('task-test-02', 'User aborted before run');
    assert.equal(cancelled.status, TASK_STATUS.CANCELLED);

    // CANCELLED cannot transition to RUNNING
    assert.throws(
      () => sm.startTask('task-test-02'),
      /Invalid task state transition from 'CANCELLED' to 'RUNNING'/
    );
  });

  await t.test('records step history, thoughts, and tool executions', () => {
    sm.createTask({ id: 'task-test-03', goal: 'Step record test' });
    sm.enqueueTask('task-test-03');
    sm.startTask('task-test-03');

    const step1 = sm.recordStep('task-test-03', {
      stepNumber: 1,
      thought: 'Need to capture screen to check YouTube state',
      toolName: 'zero_computer_action',
      toolArgs: { action: 'get_screen_size' },
      toolResult: { ok: true, width: 1920, height: 1080 },
      status: 'completed',
    });

    assert.equal(step1.stepNumber, 1);
    assert.equal(step1.toolName, 'zero_computer_action');

    const step2 = sm.recordStep('task-test-03', {
      stepNumber: 2,
      thought: 'Clicking play button on focused window',
      toolName: 'browser',
      toolArgs: { action: 'play', query: 'Lo-Fi Chill' },
      toolResult: { ok: true, videoTitle: 'Lo-Fi Chill' },
      status: 'completed',
    });

    assert.equal(step2.stepNumber, 2);

    const steps = sm.getTaskSteps('task-test-03');
    assert.equal(steps.length, 2);
    assert.equal(steps[0].thought, 'Need to capture screen to check YouTube state');
    assert.deepEqual(steps[1].toolArgs, { action: 'play', query: 'Lo-Fi Chill' });
  });

  await t.test('cancelling task triggers its AbortController signal', () => {
    sm.createTask({ id: 'task-test-04', goal: 'Cancellation abort test' });
    sm.enqueueTask('task-test-04');
    sm.startTask('task-test-04');

    const signal = sm.getSignal('task-test-04');
    assert.equal(signal.aborted, false);

    sm.cancelTask('task-test-04', 'Emergency operator halt');
    assert.equal(signal.aborted, true);
  });

  sm.close();
});
