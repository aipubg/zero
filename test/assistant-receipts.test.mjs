import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SessionManager } from '../packages/sessions/index.mjs';
import { createAssistantReceipts } from '../services/host/assistant-receipts.mjs';
test('[INTEGRATION] duplicate assistant requests share execution and persisted result across reopen', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-receipts-'));
  let sessions = new SessionManager({ dbPath: path.join(directory, 'sessions.sqlite') });
  const request = { sessionKey: 'same-chat', runId: 'same-request', userContent: 'Execute once' };
  let executions = 0;
  try {
    let once = createAssistantReceipts(sessions.db);
    const execute = async () => { executions++; await new Promise(resolve => setTimeout(resolve, 10)); fs.appendFileSync(path.join(directory, 'effect.txt'), 'effect\n'); return { ok: true, content: 'Observed result', taskId: 'recorded-task' }; };
    const [first, second] = await Promise.all([once(request, execute), once(request, execute)]);
    assert.deepEqual(first, second); assert.equal(executions, 1);
    sessions.close(); sessions = new SessionManager({ dbPath: path.join(directory, 'sessions.sqlite') });
    once = createAssistantReceipts(sessions.db);
    assert.deepEqual(await once(request, execute), first); assert.equal(executions, 1);
    assert.equal(fs.readFileSync(path.join(directory, 'effect.txt'), 'utf8'), 'effect\n');
    await assert.rejects(once({ ...request, userContent: 'Different action' }, execute), /different input/);
    const failed = { ...request, runId: 'failed-request' };
    await assert.rejects(once(failed, async () => { throw new Error('Observed failure'); }), /Observed failure/);
    await assert.rejects(once(failed, execute), /Observed failure/); assert.equal(executions, 1);
    sessions.db.prepare("UPDATE zero_assistant_receipts SET status='running',error=NULL WHERE run_id=?").run('failed-request');
    await assert.rejects(createAssistantReceipts(sessions.db)(failed, execute), /interrupted/); assert.equal(executions, 1);
  } finally { sessions.close(); assert.equal(fs.realpathSync(path.dirname(directory)), fs.realpathSync(os.tmpdir())); fs.rmSync(directory, { recursive: true, force: true }); }
});
