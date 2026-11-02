import test from 'node:test';
import assert from 'node:assert/strict';
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
