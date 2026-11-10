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
