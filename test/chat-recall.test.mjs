import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SessionManager } from '../packages/sessions/index.mjs';
import { startChatHarness } from './helpers/zero-chat-harness.mjs';

test('chat search finds owner and Zero messages, skips tool output, keeps the index in sync', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-recall-'));
  const store = new SessionManager({ dbPath: path.join(dir, 's.sqlite') });
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  store.createSession('trip', 'Goa trip');
  store.appendMessage('trip', { role: 'user', content: 'Plan a Goa trip for December, budget 40k' });
  store.appendMessage('trip', { role: 'assistant', content: 'Booked Hotel Sea View in Goa for 12–15 Dec.' });
  store.appendMessage('trip', { role: 'tool', content: 'goa goa goa raw tool output', tool_call_id: 'x' });
  store.createSession('work', 'Invoices');
  store.appendMessage('work', { role: 'user', content: 'नोटपैड में इनवॉइस की सूची बनाओ' });

  const goa = store.searchChats('goa hotel');
  assert.equal(goa.ok, true);
  assert.equal(goa.chats.length, 1);
  assert.equal(goa.chats[0].title, 'Goa trip');
  assert.match(goa.chats[0].snippets.map(s => s.text).join(' '), /\[Hotel\]|\[Goa\]/);
  assert.ok(!goa.chats[0].snippets.some(s => /raw tool output/.test(s.text)), 'tool output is not searched');
  assert.equal(store.searchChats('इनवॉइस').chats[0].title, 'Invoices', 'Hindi works');
  assert.equal(store.searchChats('goa banana').matched, 'any word', 'falls back to any word');
  assert.equal(store.searchChats('goa', { excludeSession: 'trip' }).chats.length, 0, 'the current chat can be left out');
  assert.equal(store.searchChats('   ').ok, false);
});

test('Zero can search earlier chats from a new chat', { timeout: 40000 }, async t => {
  let searched = null;
  const { host, ask } = await startChatHarness(t, {
    prefix: 'zero-recall-chat-',
    reply: request => {
      const last = request.messages.at(-1);
      if (last.role === 'tool') { searched = JSON.parse(last.content); return { text: 'Last time we booked Hotel Sea View.' }; }
      if (/last time/.test(String(last.content))) return { toolCalls: [{ name: 'chat_search', args: { query: 'Goa hotel' } }] };
      return { text: 'Booked Hotel Sea View in Goa.' };
    },
  });
  await ask('chat-old', 'book a hotel in Goa');
  await ask('chat-new', 'which hotel did we pick last time?');
  const found = searched.result ?? searched.data ?? searched;
  assert.equal(found.chats.length, 1, 'only the earlier chat is found');
  assert.equal(found.chats[0].sessionId, 'chat-old');
  assert.ok(host.sessions.chatRecall);
});
