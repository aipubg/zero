import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionManager } from '../index.mjs';

test('Zero Session Store & Transcript Persistence Engine', async (t) => {
  const sm = new SessionManager({ dbPath: ':memory:' });

  await t.test('creates, retrieves, lists, and deletes sessions', () => {
    const session = sm.createSession('test-session-1', 'Main Chat Session', { model: 'zero-lead' });
    assert.equal(session.id, 'test-session-1');
    assert.equal(session.title, 'Main Chat Session');
    assert.equal(session.metadata.model, 'zero-lead');

    const fetched = sm.getSession('test-session-1');
    assert.equal(fetched.id, 'test-session-1');
    assert.equal(fetched.title, 'Main Chat Session');

    const list = sm.listSessions();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, 'test-session-1');

    const deleted = sm.deleteSession('test-session-1');
    assert.equal(deleted, true);
    assert.equal(sm.getSession('test-session-1'), null);
  });

  await t.test('appends messages and retrieves ordered transcript', () => {
    sm.createSession('chat-session-2', 'Turn Test');
    const msg1 = sm.appendMessage('chat-session-2', { role: 'user', content: 'What is Zero AI?' });
    assert.equal(msg1.seq, 1);
    assert.equal(msg1.role, 'user');
    assert.equal(msg1.content, 'What is Zero AI?');

    const msg2 = sm.appendMessage('chat-session-2', {
      role: 'assistant',
      content: 'Zero AI is a self-contained AI assistant platform.',
      tool_calls: [{ id: 'call_1', function: { name: 'browser', arguments: '{}' } }],
    });
    assert.equal(msg2.seq, 2);
    assert.equal(msg2.toolCalls.length, 1);

    const transcript = sm.getTranscript('chat-session-2');
    assert.equal(transcript.length, 2);
    assert.equal(transcript[0].content, 'What is Zero AI?');
    assert.equal(transcript[1].role, 'assistant');
    assert.equal(transcript[1].tool_calls[0].id, 'call_1');
  });

  await t.test('emits real-time events and notifies subscribers', async () => {
    await new Promise((resolve) => {
      const unsub = sm.subscribe('chat-session-2', (evt) => {
        assert.equal(evt.sessionId, 'chat-session-2');
        assert.equal(evt.type, 'task:started');
        assert.equal(evt.payload.taskId, 'task-001');
        unsub();
        resolve();
      });

      sm.emitEvent('chat-session-2', 'task:started', { taskId: 'task-001' });
    });
  });

  await t.test('compacts context when transcript exceeds retainCount threshold', () => {
    const sessId = 'compact-session';
    sm.createSession(sessId, 'Compaction Test');

    for (let i = 1; i <= 15; i++) {
      sm.appendMessage(sessId, { role: i % 2 === 1 ? 'user' : 'assistant', content: `Message turn ${i}` });
    }

    const before = sm.getTranscript(sessId);
    assert.equal(before.length, 15);

    const result = sm.compactContext(sessId, 5);
    assert.equal(result.compacted, true);
    assert.equal(result.prunedCount, 10);

    const after = sm.getTranscript(sessId);
    // 5 retained + 1 compaction summary marker
    assert.equal(after.length, 6);
    assert.match(after[after.length - 1].content, /Context compacted/);
  });

  sm.close();
});
