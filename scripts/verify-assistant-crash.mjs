/** REAL_EXTERNAL/INTEGRATION: kill a real model/tool task after its filesystem effect. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const state = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-assistant-crash-'));
const output = path.join(root, 'artifacts/assistant-crash', String(Date.now())); fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(root, 'zero-system/config/zero.json'), path.join(state, 'config.json'));
const reservation = net.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const report = { classification: ['REAL_EXTERNAL', 'INTEGRATION'], status: 'RUNNING', startedAt: new Date().toISOString(),
  scope: 'Actual model file effect and process-kill recovery without duplicate execution; not arbitrary side-effect reconciliation or automatic resumption' };
let child, socket; const pending = new Map();
async function start() {
  child = spawn(process.execPath, [path.join(root, 'backend/server/zero-host.mjs')], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ZERO_PORT: String(port), ZERO_DATA_DIR: path.join(state, 'data'), ZERO_PREFS_PATH: path.join(state, 'prefs.json'), ZERO_SKILLS_DIR: path.join(state, 'skills'), OPENCLAW_CONFIG_PATH: path.join(state, 'config.json') } });
  child.stdout.resume(); child.stderr.resume();
  const deadline = Date.now() + 30000;
  let ready = false;
  while (Date.now() < deadline) { if (child.exitCode !== null) throw new Error('Owned test host exited'); try { ready = (await fetch(base + '/health')).ok; } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 100)); }
  if (!ready) throw new Error('Owned host startup timeout');
  const auth = await fetch(base + '/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) });
  const { token } = await auth.json(); socket = new WebSocket(base.replace('http:', 'ws:'));
  socket.onmessage = event => { const frame = JSON.parse(event.data); const request = pending.get(frame.id); if (request) { pending.delete(frame.id); request.finish(frame); } };
  socket.onclose = () => { for (const request of pending.values()) request.fail(new Error('Owned connection closed')); pending.clear(); };
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  await call('connect', { minProtocol: 4, token });
}
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID(); const timer = setTimeout(() => { pending.delete(id); reject(new Error('RPC timeout')); }, 120000);
    pending.set(id, { finish(frame) { clearTimeout(timer); frame.ok === false ? reject(new Error(typeof frame.error === 'string' ? frame.error : frame.error?.message)) : resolve(frame.payload); }, fail(error) { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ type: 'req', id, method, params }));
  });
}
async function stop() { socket?.close(); if (child?.exitCode === null) { const closed = once(child, 'close'); child.kill(); await closed; } }
try {
  await start(); const firstPid = child.pid;
  if (process.argv.includes('--tool-failure-only')) {
    const missing = path.join(output, 'deliberately-missing.txt');
    const request = { sessionKey: 'real-tool-failure', idempotencyKey: 'real-tool-failure-request', message: `Use read_file on exactly ${JSON.stringify(missing)}. Do not create or modify any file. Report its actual error honestly.` };
    await assert.rejects(call('chat.send', request), /tool action.*failed or were blocked/);
    const db = new DatabaseSync(path.join(state, 'data/zero-sessions.sqlite'), { readOnly: true });
    const receipt = db.prepare('SELECT status,task_id FROM zero_assistant_receipts WHERE run_id=?').get(request.idempotencyKey); db.close();
    assert.equal(receipt.status, 'failed');
    const task = await call('tasks.get', { id: receipt.task_id });
    assert.equal((task.task || task).status, 'FAILED');
    const history = await call('chat.history', { sessionKey: request.sessionKey });
    assert.ok(history.messages.some(message => message.tool_calls?.some(item => item.function?.name === 'read_file')));
    assert.ok(history.messages.some(message => message.role === 'tool' && JSON.parse(message.content).ok === false));
    assert.equal(fs.existsSync(missing), false);
    report.scope = 'Real model read_file failure cannot become a completed task even when the model gives a final explanation';
    report.toolFailure = { taskId: receipt.task_id, receiptStatus: receipt.status, taskStatus: 'FAILED', actualToolErrorPreserved: true, noFileCreated: true };
  } else if (process.argv.includes('--retry-only')) {
    const filename = path.join(output, 'retried-effect.txt'); const marker = 'ZERO_REAL_RETRY_EFFECT';
    const request = { sessionKey: 'real-retry-task', idempotencyKey: 'real-retry-request', message: `Use write_file to create ${JSON.stringify(filename)} containing exactly ${marker}. Use read_file to verify it and give a short confirmation.` };
    await call('zero-policy.computer-hold.take');
    await assert.rejects(call('chat.send', request), /hold/i);
    const db = new DatabaseSync(path.join(state, 'data/zero-sessions.sqlite'), { readOnly: true });
    const failed = db.prepare('SELECT status,task_id,model_id FROM zero_assistant_receipts WHERE run_id=?').get(request.idempotencyKey);
    assert.equal(failed.status, 'failed'); assert.ok(failed.task_id); assert.equal(fs.existsSync(filename), false);
    assert.ok(failed.model_id, 'The effective original model must be persisted before execution');
    await call('sessions.patch', { key: request.sessionKey, model: 'unavailable-model-for-retry-regression' });
    await call('zero-policy.computer-hold.release');
    const retryResults = Promise.allSettled([
      call('tasks.retry', { taskId: failed.task_id }),
      call('tasks.retry', { taskId: failed.task_id }),
    ]);
    const runningDeadline = Date.now() + 10000;
    while (db.prepare('SELECT status FROM zero_assistant_receipts WHERE run_id=?').get(request.idempotencyKey).status !== 'running' && Date.now() < runningDeadline) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(db.prepare('SELECT status FROM zero_assistant_receipts WHERE run_id=?').get(request.idempotencyKey).status, 'running');
    await assert.rejects(call('chat.send', request), /currently running/);
    const attempts = await retryResults;
    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(attempts.filter(result => result.status === 'rejected').length, 1);
    assert.match(attempts.find(result => result.status === 'rejected').reason.message, /FAILED/);
    const retried = attempts.find(result => result.status === 'fulfilled').value;
    assert.equal(retried.taskId, failed.task_id); assert.ok(retried.content.trim());
    assert.equal(fs.readFileSync(filename, 'utf8').trim(), marker);
    const task = await call('tasks.get', { id: failed.task_id });
    assert.equal((task.task || task).status, 'COMPLETED');
    const history = await call('chat.history', { sessionKey: request.sessionKey });
    assert.equal(history.messages.filter(message => message.role === 'user').length, 1);
    const completed = db.prepare('SELECT status FROM zero_assistant_receipts WHERE run_id=?').get(request.idempotencyKey);
    assert.equal(completed.status, 'completed'); db.close();
    const before = (await call('models.status')).upstreamRequestCount;
    assert.equal((await call('chat.send', request)).taskId, failed.task_id);
    assert.equal((await call('models.status')).upstreamRequestCount, before);
    report.scope = 'Actual hold-induced FAILED assistant task explicitly retried through real model/tools; original task ID, single user message, file output and durable receipt verified';
    report.retry = { taskId: failed.task_id, pinnedModel: failed.model_id, sessionModelChangedBeforeRetry: true, concurrentRetryExecutions: 1, duplicateRetryRejected: true, activeReplayReportedRunning: true, actualFileEffect: true, originalUserMessages: 1, replayModelCalls: 0 };
  } else {
  const filename = path.join(output, 'actual-effect.txt'); const marker = 'ZERO_CRASH_EFFECT_ONCE';
  const request = { sessionKey: 'real-crash-task', idempotencyKey: 'real-crash-request', message: `Use write_file to create ${JSON.stringify(filename)} with exactly ${JSON.stringify(marker)}. Then read_file to verify it. Only after that, write a detailed 1000-word explanation of the verification.` };
  const running = call('chat.send', request).catch(error => ({ error: error.message }));
  const deadline = Date.now() + 90000;
  while (!fs.existsSync(filename) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(fs.existsSync(filename), 'The actual model must execute write_file before the crash');
  assert.equal(fs.readFileSync(filename, 'utf8').trim(), marker);
  const db = new DatabaseSync(path.join(state, 'data/zero-sessions.sqlite'), { readOnly: true });
  const receipt = db.prepare('SELECT status,task_id FROM zero_assistant_receipts WHERE run_id=?').get(request.idempotencyKey); db.close();
  assert.equal(receipt.status, 'running'); assert.ok(receipt.task_id);
  await stop(); await running; await start(); assert.notEqual(child.pid, firstPid);
  const task = await call('tasks.get', { id: receipt.task_id, taskId: receipt.task_id });
  const recoveredTask = task.task || task;
  assert.equal(recoveredTask.status, 'WAITING');
  const before = (await call('models.status')).upstreamRequestCount;
  await assert.rejects(call('chat.send', request), error => error.message.includes('interrupted') && error.message.includes(receipt.task_id));
  assert.equal((await call('models.status')).upstreamRequestCount, before);
  assert.equal(fs.readFileSync(filename, 'utf8').trim(), marker);
  const history = await call('chat.history', { sessionKey: request.sessionKey });
  assert.equal(history.messages.filter(message => message.role === 'user').length, 1);
  const resumed = await call('tasks.resume', { id: receipt.task_id });
  assert.equal(resumed.taskId, receipt.task_id); assert.ok(resumed.content.trim());
  const finished = await call('tasks.get', { id: receipt.task_id, taskId: receipt.task_id });
  assert.equal((finished.task || finished).status, 'COMPLETED');
  assert.equal(fs.readFileSync(filename, 'utf8').trim(), marker);
  report.resumption = { taskId: resumed.taskId, completed: true, actualAssistantOutput: true, fileEffectPreserved: true };
  report.recovery = { firstPid, restartedPid: child.pid, taskId: receipt.task_id, status: recoveredTask.status, actualFileEffectPreserved: true, replayModelCalls: 0, originalUserMessages: 1 };
  }
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.message; process.exitCode = 1; }
finally { await stop(); report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ ...report, output, retainedState: state }, null, 2)); }
