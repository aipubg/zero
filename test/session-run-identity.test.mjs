import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SessionManager } from '../packages/sessions/index.mjs';

test('[INTEGRATION] additive run identity migration preserves old messages and survives reopen', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-session-identity-'));
  const dbPath = path.join(directory, 'sessions.sqlite');
  let manager;
  try {
    const old = new DatabaseSync(dbPath);
    old.exec("CREATE TABLE zero_messages(id TEXT PRIMARY KEY,session_id TEXT,role TEXT,content TEXT,tool_calls TEXT,created_at INTEGER,seq INTEGER); INSERT INTO zero_messages VALUES('old','legacy','user','पुराना संदेश',NULL,1,1)");
    old.close();
    manager = new SessionManager({ dbPath });
    assert.equal(manager.getTranscript('legacy')[0].content, 'पुराना संदेश');
    assert.equal(manager.getTranscript('legacy')[0].runId, undefined);
    const appended = manager.appendMessage('legacy', { role: 'assistant', content: 'Saved reply', runId: 'stable-run' });
    assert.equal(appended.runId, 'stable-run');
    manager.close(); manager = new SessionManager({ dbPath });
    const messages = manager.getTranscript('legacy');
    assert.equal(messages.length, 2);
    assert.equal(messages[0].content, 'पुराना संदेश');
    assert.equal(messages[1].runId, 'stable-run');
    assert.equal(messages[1].id, appended.id);
  } finally {
    manager?.close();
    assert.equal(fs.realpathSync(path.dirname(directory)), fs.realpathSync(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
