import test from 'node:test';
import assert from 'node:assert/strict';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';
test('[CONTRACT] read-only sessions cannot bypass assistant mutation scopes through aliases or task retry', async () => {
  const host = Object.create(ZeroNativeHost.prototype);
  let invoked = 0;
  host._runAssistantRequest = async () => { invoked++; return { ok: true }; };
  host.tasks = { retryFailedTask: () => { invoked++; return { id: 'retry-task' }; } };
  const reader = { authenticated: true, role: 'viewer', scopes: ['operator.read'] };
  for (const method of ['chat.send', 'agent', 'gateway.agent', 'tasks.retry', 'tasks.resume']) {
    await assert.rejects(host._dispatchRpc(method, { message: 'Do work', taskId: 'retry-task' }, reader), /scope|Unauthorized|Forbidden|permission/i);
  }
  assert.equal(invoked, 0);
  const owner = { authenticated: true, role: 'admin', scopes: ['operator.admin', 'operator.write'] };
  for (const method of ['agent', 'gateway.agent', 'tasks.retry']) await host._dispatchRpc(method, { message: 'Do work', taskId: 'retry-task' }, owner);
  assert.equal(invoked, 3);
});
