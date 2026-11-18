import test from 'node:test';
import assert from 'node:assert/strict';
import { startChatHarness } from './helpers/zero-chat-harness.mjs';

test('an Ask Zero job runs its prompt as a Zero request in its own chat', { timeout: 60000 }, async t => {
  const { host, requests } = await startChatHarness(t, {
    prefix: 'zero-ask-jobs-',
    reply: () => ({ text: 'Today: 3 tasks done, 1 pending.' }),
  });
  host._scheduleTask({ id: 'job_brief', title: 'Daily brief', cronExpr: '0 9 * * *', targetAction: 'assistant.prompt',
    params: { prompt: 'Summarise my tasks for today', jobId: 'job_brief', skills: ['daily-brief'] }, enabled: false });

  const run = await host.automation.runNow('job_brief');
  assert.equal(run.status, 'completed', run.error);
  assert.equal(run.result.reply, 'Today: 3 tasks done, 1 pending.');
  assert.equal(run.result.sessionKey, 'automation-job_brief');

  const request = requests.at(-1);
  const owner = request.messages.filter(m => m.role === 'user').at(-1).content;
  assert.match(owner, /^Summarise my tasks for today/);
  assert.match(owner, /skill_read: daily-brief/);
  const offered = request.tools.map(tool => tool.function.name);
  assert.ok(!offered.includes('schedule_task') && !offered.includes('goal_plan'), 'a job cannot schedule more jobs');
  assert.ok(offered.includes('read_file'), 'other tools stay available');

  const chat = host.sessions.getTranscript('automation-job_brief', { limit: 50 });
  assert.ok(chat.some(m => m.role === 'assistant' && /3 tasks done/.test(m.content)), 'the reply is kept in the job\'s chat');
  assert.equal(host.sessions.getSession('automation-job_brief').title, 'Automation: Daily brief');

  const listed = (await host._dispatchRpc('cron.list', {}, { authenticated: true, scopes: ['operator.admin'] })).jobs.find(j => j.id === 'job_brief');
  assert.equal(listed.cronExpr, '0 9 * * *');
  assert.equal(listed.targetAction, 'assistant.prompt');
  assert.equal(listed.enabled, false, 'running it once keeps a disabled job disabled');
});
