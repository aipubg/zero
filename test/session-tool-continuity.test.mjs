import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SessionManager } from '../packages/sessions/index.mjs';

test('[INTEGRATION] tool-call identity and recent conversation survive file-backed reopen', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-session-continuity-'));
  const dbPath = path.join(directory, 'session.sqlite');
  let store = new SessionManager({ dbPath });
  try {
    store.appendMessage('voice-chat', { role: 'user', content: 'Use a tool' });
    store.appendMessage('voice-chat', { role: 'assistant', content: null, tool_calls: [{ id: 'observed-call', type: 'function', function: { name: 'read_file', arguments: '{}' } }] });
    store.appendMessage('voice-chat', { role: 'tool', tool_call_id: 'observed-call', content: 'Observed output' });
    store.appendMessage('voice-chat', { role: 'assistant', content: 'Finished from observations' });
    store.close(); store = new SessionManager({ dbPath });
    const transcript = store.getTranscript('voice-chat');
    assert.equal(transcript[1].content, null);
    assert.equal(transcript[2].tool_call_id, transcript[1].tool_calls[0].id);
    assert.deepEqual(store.getTranscript('voice-chat', { limit: 2 }).map(message => message.role), ['tool', 'assistant']);
    assert.equal(store.getTranscript('voice-chat', { limit: 2 })[1].content, 'Finished from observations');
    assert.deepEqual(store.getTranscript('voice-chat', { limit: 2, offset: 2 }).map(message => message.id), transcript.slice(0, 2).map(message => message.id));
    assert.equal(store.countMessages('voice-chat'), 4);
  } finally {
    store.close();
    assert.equal(fs.realpathSync(path.dirname(directory)), fs.realpathSync(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('[INTEGRATION] compaction preserves original history across restart and whole tool exchanges', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-session-archive-'));
  const dbPath = path.join(directory, 'session.sqlite');
  let store = new SessionManager({ dbPath });
  try {
    store.appendMessage('archive', { role: 'user', content: 'Original request' });
    store.appendMessage('archive', { role: 'assistant', content: null, tool_calls: [{ id: 'done', type: 'function', function: { name: 'read_file', arguments: '{}' } }] });
    store.appendMessage('archive', { role: 'tool', tool_call_id: 'done', content: 'Real retained output' });
    store.appendMessage('archive', { role: 'assistant', content: 'Final reply' });
    const originals = store.getTranscript('archive');
    assert.equal(store.compactContext('archive', 2).prunedCount, 1);
    store.close(); store = new SessionManager({ dbPath });
    assert.deepEqual(store.getTranscript('archive').slice(0, 4), originals);
    const context = store.getModelContext('archive');
    assert.equal(context[0].tool_calls[0].id, 'done');
    assert.equal(context[1].tool_call_id, 'done');
    store.appendMessage('archive', { role: 'user', content: 'Next turn' });
    store.compactContext('archive', 1);
    assert.equal(store.getModelContext('archive').length, 2);
    assert.deepEqual(store.getTranscript('archive').slice(0, 4), originals);
    assert.equal(store.getTranscript('archive').length, 7);
  } finally {
    store.close();
    assert.equal(fs.realpathSync(path.dirname(directory)), fs.realpathSync(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('[CONTRACT] interrupted and legacy orphan tool chains are excluded without fabricated outputs', () => {
  const store = new SessionManager();
  try {
    store.appendMessage('interrupted', { role: 'tool', content: 'Legacy orphan result' });
    store.appendMessage('interrupted', { role: 'assistant', content: null, tool_calls: [
      { id: 'finished', type: 'function', function: { name: 'read_file', arguments: '{}' } },
      { id: 'cancelled', type: 'function', function: { name: 'run_process', arguments: '{}' } },
    ] });
    store.appendMessage('interrupted', { role: 'tool', tool_call_id: 'finished', content: 'Observed result' });
    store.appendMessage('interrupted', { role: 'user', content: 'Change direction' });
    store.appendMessage('interrupted', { role: 'assistant', content: null, tool_calls: [{ id: 'never-run', function: { name: 'run_process', arguments: '{}' } }] });
    assert.deepEqual(store.getModelContext('interrupted').map(message => message.role), ['assistant', 'tool', 'user']);
    assert.deepEqual(store.getModelContext('interrupted')[0].tool_calls.map(call => call.id), ['finished']);
    assert.equal(store.getTranscript('interrupted').length, 5, 'Projection must preserve the original record');
    assert.deepEqual(store.getModelContext('interrupted', { limit: 3 }).map(message => message.role), ['user']);
  } finally { store.close(); }
});
