import test from 'node:test';
import assert from 'node:assert/strict';
import { AutomationScheduler } from '../index.mjs';

test('Zero Durable Automation & Cron Scheduling Engine', async (t) => {
  let executedCount = 0;
  let lastAction = null;

  const scheduler = new AutomationScheduler({
    dbPath: ':memory:',
    executor: async (action, params) => {
      executedCount++;
      lastAction = { action, params };
      if (action === 'failing_action') {
        throw new Error('Planned automation failure');
      }
      return { success: true, processedAt: Date.now() };
    },
  });

  await t.test('registers, lists, toggles, and deletes recurring jobs', () => {
    const job = scheduler.registerJob({
      id: 'daily-backup',
      title: 'Database Daily Snapshot',
      cronExpr: '@daily',
      targetAction: 'backup_sqlite',
      params: { path: './backup' },
    });

    assert.equal(job.id, 'daily-backup');
    assert.equal(job.title, 'Database Daily Snapshot');
    assert.equal(job.cronExpr, '@daily');
    assert.equal(job.enabled, true);

    const list = scheduler.listJobs();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, 'daily-backup');

    const disabled = scheduler.toggleJob('daily-backup', false);
    assert.equal(disabled.enabled, false);

    const reEnabled = scheduler.toggleJob('daily-backup', true);
    assert.equal(reEnabled.enabled, true);
  });

  await t.test('calculates next execution time accurately for expressions', () => {
    const now = 1700000000000;
    const hourly = scheduler.calculateNextRun('@hourly', now);
    assert.equal(hourly, now + 3600 * 1000);

    const daily = scheduler.calculateNextRun('@daily', now);
    assert.equal(daily, now + 86400 * 1000);

    const step10 = scheduler.calculateNextRun('*/10 * * * *', now);
    assert.equal(step10, now + 10 * 60 * 1000);
  });

  await t.test('triggers due jobs, records execution history, and advances schedule', async () => {
    const pastTime = Date.now() - 5000;
    scheduler.registerJob({
      id: 'due-job-1',
      title: 'Email Summary Digest',
      cronExpr: '*/5 * * * *',
      targetAction: 'summarize_inbox',
      params: { unreadOnly: true },
    });

    // Artificially advance next_run to past time so it triggers
    scheduler.db.prepare('UPDATE zero_cron_jobs SET next_run = ? WHERE id = ?').run(pastTime, 'due-job-1');

    const result = await scheduler.checkAndTriggerDueJobs(Date.now());
    assert.equal(result.triggeredCount, 1);
    assert.equal(result.runs[0].jobId, 'due-job-1');
    assert.equal(result.runs[0].status, 'completed');
    assert.equal(executedCount, 1);
    assert.equal(lastAction.action, 'summarize_inbox');

    const runs = scheduler.getJobRuns('due-job-1');
    assert.equal(runs.length, 1);
    assert.equal(runs[0].status, 'completed');
    assert.equal(runs[0].result.success, true);

    // Verify next_run was scheduled in future
    const updatedJob = scheduler.getJob('due-job-1');
    assert.ok(updatedJob.nextRun > Date.now());
  });

  await t.test('handles job execution failure safely without crashing scheduler', async () => {
    scheduler.registerJob({
      id: 'fail-job-1',
      title: 'Faulty Job',
      cronExpr: '*/5 * * * *',
      targetAction: 'failing_action',
    });

    scheduler.db.prepare('UPDATE zero_cron_jobs SET next_run = ? WHERE id = ?').run(Date.now() - 1000, 'fail-job-1');

    const result = await scheduler.checkAndTriggerDueJobs(Date.now());
    const failedRun = result.runs.find((r) => r.jobId === 'fail-job-1');
    assert.ok(failedRun);
    assert.equal(failedRun.status, 'failed');
    assert.equal(failedRun.error, 'Planned automation failure');
  });

  scheduler.close();
});
