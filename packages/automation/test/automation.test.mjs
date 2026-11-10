import test from 'node:test';
import assert from 'node:assert/strict';
import { AutomationScheduler } from '../index.mjs';
import { spawnSync } from 'node:child_process';

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
    assert.equal(scheduler.deleteJob('daily-backup'), true);
    assert.equal(scheduler.getJob('daily-backup'), null);
    assert.deepEqual(scheduler.listJobs(), []);
  });

  await t.test('calculates next execution time accurately for expressions', () => {
    const now = new Date(2026, 10, 10, 8, 23, 42, 123).getTime();
    const hourly = scheduler.calculateNextRun('@hourly', now);
    assert.equal(hourly, new Date(2026, 10, 10, 9, 0).getTime());

    const daily = scheduler.calculateNextRun('@daily', now);
    assert.equal(daily, new Date(2026, 10, 11, 0, 0).getTime());

    const step10 = scheduler.calculateNextRun('*/10 * * * *', now);
    assert.equal(step10, new Date(2026, 10, 10, 8, 30).getTime());
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

test('[UNIT] cron schedules match calendar boundaries, named ranges and restricted day union', () => {
  const scheduler = new AutomationScheduler();
  const next = (expr, from, expected) => assert.equal(scheduler.calculateNextRun(expr, from.getTime()), expected.getTime(), expr);
  try {
    next('0 9 * * *', new Date(2026, 10, 10, 8, 59, 59), new Date(2026, 10, 10, 9));
    next('0 9 * * *', new Date(2026, 10, 10, 9), new Date(2026, 10, 11, 9));
    next('*/23 * * * *', new Date(2026, 10, 10, 8, 47), new Date(2026, 10, 10, 9));
    next('15,45 9-17/2 * * mon-fri', new Date(2026, 10, 13, 17, 45), new Date(2026, 10, 16, 9, 15));
    next('0 0 29 feb *', new Date(2026, 2, 1), new Date(2028, 1, 29));
    next('0 0 1 * mon', new Date(2026, 10, 2), new Date(2026, 10, 9));
    next('@weekly', new Date(2026, 10, 10), new Date(2026, 10, 15));
    next('0 0 * * 7', new Date(2026, 10, 10), new Date(2026, 10, 15));
    next('@monthly', new Date(2026, 11, 31), new Date(2027, 0, 1));
  } finally { scheduler.close(); }
});

test('[UNIT] invalid and impossible cron schedules fail instead of falling back to every minute', () => {
  const scheduler = new AutomationScheduler();
  try {
    for (const expr of ['', '@reboot', '0 0 * * * *', '60 * * * *', '* 24 * * *', '*/0 * * * *', '10-2 * * * *', '0 0 31 feb *', '0 0 * wat *', 'garbage']) {
      assert.throws(() => scheduler.calculateNextRun(expr), /cron/i, expr);
      assert.throws(() => scheduler.registerJob({ title: 'Invalid', targetAction: 'effect', cronExpr: expr, nextRunAt: 1 }), /cron/i, expr);
    }
    assert.equal(scheduler.listJobs().length, 0);
  } finally { scheduler.close(); }
});

test('[INTEGRATION] malformed persisted cron is retained and disabled before executing effects', async () => {
  let effects = 0;
  const scheduler = new AutomationScheduler({ executor: async () => { effects++; return { ok: true }; } });
  try {
    scheduler.registerJob({ id: 'legacy', title: 'Preserved legacy', targetAction: 'effect', cronExpr: '* * * * *', nextRunAt: 1 });
    scheduler.db.prepare('UPDATE zero_cron_jobs SET cron_expr = ? WHERE id = ?').run('invalid legacy schedule', 'legacy');
    const result = await scheduler.triggerDueJobs();
    assert.equal(result.runs[0].status, 'failed');
    assert.equal(effects, 0);
    assert.equal(scheduler.getJob('legacy').enabled, false);
    assert.equal(scheduler.getJob('legacy').cronExpr, 'invalid legacy schedule');
    assert.match(scheduler.listRuns({ jobId: 'legacy' })[0].error, /cron/i);
    assert.equal((await scheduler.triggerDueJobs()).triggeredCount, 0);
  } finally { scheduler.close(); }
});

test('[INTEGRATION] isolated timezone processes handle missing and repeated DST wall times', () => {
  for (const [timezone, expression, from, expected] of [
    ['Asia/Calcutta', '0 9 * * *', '2026-11-10T03:00:00Z', '2026-11-10T03:30:00.000Z'],
    ['America/New_York', '30 2 * * *', '2026-03-08T06:59:00Z', '2026-03-09T06:30:00.000Z'],
    ['America/New_York', '30 1 * * *', '2026-11-01T05:30:00Z', '2026-11-01T06:30:00.000Z'],
  ]) {
    const source = `import { nextCronTime } from ${JSON.stringify(new URL('../cron-calendar.mjs', import.meta.url).href)}; console.log(new Date(nextCronTime(process.argv[1], Date.parse(process.argv[2]))).toISOString());`;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', source, expression, from], {
      env: { ...process.env, TZ: timezone }, encoding: 'utf8', windowsHide: true, timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), expected, timezone + ' ' + from);
  }
});
