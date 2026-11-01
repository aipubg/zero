import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskStateMachine, TASK_STATUS } from '../index.mjs';

test('Zero Multi-Agent Durable Delegation & Recovery Workflows', async (t) => {
  const sm = new TaskStateMachine({ dbPath: ':memory:' });

  await t.test('Scenario 1: Successful sub-agent delegation and result aggregation', () => {
    // 1. Create parent commander task
    const parent = sm.createTask({
      id: 'parent-task-100',
      sessionId: 'commander-session',
      agentId: 'zero',
      goal: 'Prepare quarterly research report',
    });
    sm.enqueueTask('parent-task-100');
    sm.startTask('parent-task-100');

    // 2. Delegate sub-goal to research child agent
    const delegation = sm.delegateTask({
      parentTaskId: 'parent-task-100',
      childAgentId: 'researcher',
      goal: 'Analyze GPU benchmark data for Q3',
      permissions: ['web_search', 'read_file'],
    });

    assert.equal(delegation.parentTask.status, TASK_STATUS.WAITING);
    assert.match(delegation.parentTask.waitReason, /Awaiting sub-agent \[researcher\]/);
    assert.equal(delegation.childTask.parentTaskId, 'parent-task-100');
    assert.equal(delegation.childTask.agentId, 'researcher');
    assert.equal(delegation.childTask.status, TASK_STATUS.RUNNING);

    // 3. Child executes steps and completes
    sm.recordStep(delegation.childTask.id, {
      stepNumber: 1,
      thought: 'Searched benchmark table',
      toolName: 'web_search',
      toolResult: { items: 12 },
    });

    const completedChild = sm.completeChildTask(delegation.childTask.id, {
      findings: 'GPU throughput increased by 28% in Q3',
    });
    assert.equal(completedChild.status, TASK_STATUS.COMPLETED);

    // 4. Verify parent resumed automatically and step recorded in parent
    const resumedParent = sm.getTask('parent-task-100');
    assert.equal(resumedParent.status, TASK_STATUS.RUNNING);

    const parentSteps = sm.getTaskSteps('parent-task-100');
    assert.equal(parentSteps.length, 2);
    assert.match(parentSteps[0].thought, /Delegating sub-goal/);
    assert.match(parentSteps[1].thought, /Received result from sub-agent/);
    assert.deepEqual(parentSteps[1].toolResult, { findings: 'GPU throughput increased by 28% in Q3' });

    // Complete parent task
    sm.completeTask('parent-task-100');
  });

  await t.test('Scenario 2: Failed child execution triggers human escalation', () => {
    const parent = sm.createTask({
      id: 'parent-task-200',
      sessionId: 'commander-session-2',
      agentId: 'zero',
      goal: 'Deploy software update to cluster',
    });
    sm.enqueueTask('parent-task-200');
    sm.startTask('parent-task-200');

    const delegation = sm.delegateTask({
      parentTaskId: 'parent-task-200',
      childAgentId: 'deployer',
      goal: 'Apply patch to database node 2',
    });

    // Child fails with permission error
    sm.failChildTask(delegation.childTask.id, 'Permission denied on database volume');

    const escalatedParent = sm.getTask('parent-task-200');
    assert.equal(escalatedParent.status, TASK_STATUS.WAITING);
    assert.match(escalatedParent.waitReason, /HUMAN_ESCALATION/);

    const parentSteps = sm.getTaskSteps('parent-task-200');
    assert.match(parentSteps[parentSteps.length - 1].thought, /Escalating to operator/);
  });

  await t.test('Scenario 3: Host restart recovery transitions interrupted tasks safely', () => {
    // Create an interrupted task simulated before host crash
    const interrupted = sm.createTask({
      id: 'crash-task-300',
      goal: 'Long running media encoding',
    });
    sm.enqueueTask('crash-task-300');
    sm.startTask('crash-task-300');

    assert.equal(sm.getTask('crash-task-300').status, TASK_STATUS.RUNNING);

    // Host restarts and runs startup recovery
    const recoveryReport = sm.recoverTasksOnStartup();
    assert.equal(recoveryReport.recoveredCount, 1);
    assert.equal(recoveryReport.recoveredTaskIds[0], 'crash-task-300');

    const recovered = sm.getTask('crash-task-300');
    assert.equal(recovered.status, TASK_STATUS.WAITING);
    assert.match(recovered.waitReason, /RESTART_RECOVERY/);

    const steps = sm.getTaskSteps('crash-task-300');
    assert.match(steps[steps.length - 1].thought, /reboot detected/);
  });

  sm.close();
});
