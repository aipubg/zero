import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleZeroGatewayRequest, taskStateMachine } from './server.mjs';

test('Zero Agent Tasks API Endpoints', async (t) => {
  // Spin up an ephemeral local server dispatching via handleZeroGatewayRequest
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

  try {
    await t.test('POST /api/zero/tasks creates task in state machine', async () => {
      const res = await fetch(`${baseUrl}/api/zero/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'Automate desktop Spotify volume adjustment',
          sessionId: 'test-session-api',
          agentId: 'zero',
        }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.task.goal, 'Automate desktop Spotify volume adjustment');
      assert.equal(data.task.status, 'PENDING');
    });

    await t.test('GET /api/zero/tasks lists tasks with query filter', async () => {
      const res = await fetch(`${baseUrl}/api/zero/tasks?sessionId=test-session-api`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.ok(data.count >= 1);
      assert.equal(data.tasks[0].sessionId, 'test-session-api');
    });

    await t.test('GET /api/zero/tasks/:id retrieves task and recorded execution steps', async () => {
      const inspectId = `inspect-task-${Date.now()}`;
      // Create and record a step
      const created = taskStateMachine.createTask({
        id: inspectId,
        goal: 'Inspect screen and extract UIA tree',
      });
      taskStateMachine.recordStep(inspectId, {
        stepNumber: 1,
        thought: 'Scanning screen',
        toolName: 'zero_computer_action',
        toolArgs: { action: 'get_screen_size' },
        toolResult: { ok: true, width: 1920, height: 1080 },
      });

      const res = await fetch(`${baseUrl}/api/zero/tasks/${inspectId}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.task.id, inspectId);
      assert.equal(data.steps.length, 1);
      assert.equal(data.steps[0].toolName, 'zero_computer_action');
    });

    await t.test('POST /api/zero/tasks/:id/cancel cancels active task', async () => {
      const cancelId = `cancel-task-${Date.now()}`;
      taskStateMachine.createTask({ id: cancelId, goal: 'Task to be cancelled' });
      const res = await fetch(`${baseUrl}/api/zero/tasks/${cancelId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Operator requested abort' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.task.status, 'CANCELLED');
    });
  } finally {
    server.close();
  }
});
