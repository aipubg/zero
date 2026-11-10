import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AutomationScheduler } from '../packages/automation/index.mjs';
import { EventAutomationEngine } from '../packages/automation/event-automation.mjs';

test('[CONTRACT] resolved action failures cannot become completed scheduled or event runs', async () => {
  const executor = async () => ({ ok: false, error: 'Actual adapter rejected the action' });
  const scheduler = new AutomationScheduler({ executor });
  const events = new EventAutomationEngine({ executor });
  try {
    scheduler.registerJob({ id: 'rejected', title: 'Rejected action', cronExpr: '* * * * *', targetAction: 'reject', nextRunAt: Date.now() - 1000 });
    const runs = await scheduler.triggerDueJobs();
    assert.equal(runs.runs[0].status, 'failed');
    assert.match(scheduler.listRuns({ jobId: 'rejected' })[0].error, /rejected/);
    events.registerRule({ id: 'reject-rule', eventType: 'fixture:event', targetAction: 'reject' });
    const emitted = await events.dispatchEvent('fixture:event', {});
    assert.equal(emitted.executions[0].status, 'failed');
  } finally { scheduler.close(); events.close(); }
});

test('[CONTRACT] absent and unconfirmed dispatchers never report automation success', async () => {
  for (const executor of [undefined, async () => undefined, async () => ({}), async () => ({ ok: true, queued: true }), async () => ({ success: true, completed: false })]) {
    const scheduler = new AutomationScheduler({ executor });
    const events = new EventAutomationEngine({ executor });
    try {
      scheduler.registerJob({ id: 'unconfirmed', title: 'Unconfirmed', cronExpr: '* * * * *', targetAction: 'write', nextRunAt: Date.now() - 1000 });
      assert.equal((await scheduler.triggerDueJobs()).runs[0].status, 'failed');
      assert.equal(scheduler.listRuns({ jobId: 'unconfirmed' })[0].status, 'failed');
      events.registerRule({ id: 'unconfirmed', eventType: 'test:event', targetAction: 'write' });
      assert.equal((await events.dispatchEvent('test:event', {})).executions[0].status, 'failed');
    } finally { scheduler.close(); events.close(); }
  }
});

test('[INTEGRATION] scheduled and event dispatchers produce independently read file effects', async () => {
  const parent = fs.realpathSync.native(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(parent, 'zero-automation-effect-'));
  const output = path.join(directory, 'effects.txt');
  const executor = async (action, params) => {
    assert.equal(action, 'append');
    fs.appendFileSync(output, `${params.text}\n`, 'utf8');
    return { success: true };
  };
  const scheduler = new AutomationScheduler({ executor });
  const events = new EventAutomationEngine({ executor });
  try {
    scheduler.registerJob({ id: 'write', title: 'Write', cronExpr: '* * * * *', targetAction: 'append', params: { text: 'scheduled नीला' }, nextRunAt: Date.now() - 1000 });
    assert.equal((await scheduler.triggerDueJobs()).runs[0].status, 'completed');
    assert.equal(fs.readFileSync(output, 'utf8'), 'scheduled नीला\n');
    events.registerRule({ id: 'write', eventType: 'test:event', targetAction: 'append', params: { text: 'event bird' } });
    assert.equal((await events.dispatchEvent('test:event', {})).executions[0].status, 'executed');
    assert.equal(fs.readFileSync(output, 'utf8'), 'scheduled नीला\nevent bird\n');
  } finally {
    scheduler.close(); events.close();
    const resolved = fs.realpathSync.native(directory);
    assert.equal(path.dirname(resolved), parent);
    assert.ok(path.basename(resolved).startsWith('zero-automation-effect-'));
    fs.rmSync(resolved, { recursive: true });
  }
});

test('[CONTRACT] overlapping timer and manual triggers dispatch each due job once', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const scheduler = new AutomationScheduler({ executor: async () => {
    calls++;
    await gate;
    return { ok: true };
  } });
  try {
    scheduler.registerJob({ id: 'overlap', title: 'Overlap', cronExpr: '* * * * *', targetAction: 'count', nextRunAt: Date.now() - 1000 });
    const first = scheduler.triggerDueJobs();
    const second = scheduler.triggerDueJobs();
    assert.equal(calls, 1);
    release();
    const results = await Promise.all([first, second]);
    assert.equal(results[0].runs[0].runId, results[1].runs[0].runId);
    assert.equal(scheduler.listRuns({ jobId: 'overlap' }).length, 1);
    assert.equal((await scheduler.triggerDueJobs()).triggeredCount, 0);
  } finally { release(); scheduler.close(); }
});

test('[CONTRACT] unserializable results record failure without stranding the scheduler', async () => {
  const scheduler = new AutomationScheduler({ executor: async () => ({ ok: true, value: 1n }) });
  try {
    scheduler.registerJob({ id: 'serialize', title: 'Serialize', cronExpr: '* * * * *', targetAction: 'return', nextRunAt: Date.now() - 1000 });
    const result = await scheduler.triggerDueJobs();
    assert.equal(result.runs[0].status, 'failed');
    assert.match(scheduler.listRuns({ jobId: 'serialize' })[0].error, /BigInt/i);
    assert.equal((await scheduler.triggerDueJobs()).triggeredCount, 0);
  } finally { scheduler.close(); }
});
