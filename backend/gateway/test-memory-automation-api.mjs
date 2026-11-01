import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  handleZeroGatewayRequest,
  persistentMemoryStore,
  automationScheduler,
} from './server.mjs';

test('Zero Gateway Memory & Automation REST APIs', async (t) => {
  const server = http.createServer(async (req, res) => {
    const handled = await handleZeroGatewayRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const testMemId = `mem_api_${Date.now()}`;
  const testJobId = `job_api_${Date.now()}`;

  await t.test('POST /api/zero/memory stores a new memory record', async () => {
    const res = await fetch(`${baseUrl}/api/zero/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testMemId,
        category: 'user_preferences',
        content: 'Operator prefers concise git diff summaries and obsidian dark mode',
        tags: ['theme', 'git', 'preferences'],
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.memory.id, testMemId);
    assert.equal(data.memory.category, 'user_preferences');
  });

  await t.test('GET /api/zero/memory recalls memories by keyword query', async () => {
    const res = await fetch(`${baseUrl}/api/zero/memory?query=obsidian`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.count >= 1);
    assert.equal(data.memories[0].id, testMemId);
  });

  await t.test('DELETE /api/zero/memory/:id forgets the memory', async () => {
    const res = await fetch(`${baseUrl}/api/zero/memory/${testMemId}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.id, testMemId);

    // Verify gone
    const verifyRes = await fetch(`${baseUrl}/api/zero/memory?query=obsidian`);
    const verifyData = await verifyRes.json();
    assert.ok(!verifyData.memories.some((m) => m.id === testMemId));
  });

  await t.test('POST /api/zero/automation/jobs registers a new cron job', async () => {
    const res = await fetch(`${baseUrl}/api/zero/automation/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testJobId,
        title: 'Hourly Screen Observation Compaction',
        cronExpr: '@hourly',
        targetAction: 'browser',
        params: { action: 'refresh' },
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.job.id, testJobId);
    assert.equal(data.job.enabled, true);
  });

  await t.test('GET /api/zero/automation/jobs lists registered jobs', async () => {
    const res = await fetch(`${baseUrl}/api/zero/automation/jobs`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.jobs.some((j) => j.id === testJobId));
  });

  await t.test('POST /api/zero/automation/jobs/:id/toggle enables/disables job', async () => {
    const res = await fetch(`${baseUrl}/api/zero/automation/jobs/${testJobId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.job.enabled, false);
  });

  await t.test('POST /api/zero/automation/trigger executes due jobs', async () => {
    // Manually register a job that is immediately due
    automationScheduler.registerJob({
      id: `immediate_job_${Date.now()}`,
      title: 'Immediate Test Job',
      cronExpr: '* * * * *',
      targetAction: 'test_action',
      nextRunAt: Date.now() - 5000,
    });

    const res = await fetch(`${baseUrl}/api/zero/automation/trigger`, {
      method: 'POST',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.executedCount >= 1);
  });

  await t.test('GET /api/zero/automation/runs lists execution history', async () => {
    const res = await fetch(`${baseUrl}/api/zero/automation/runs`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.count >= 1);
  });

  await t.test('DELETE /api/zero/automation/jobs/:id deletes recurring job', async () => {
    const res = await fetch(`${baseUrl}/api/zero/automation/jobs/${testJobId}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.id, testJobId);
  });
});
