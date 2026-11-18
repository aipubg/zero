import test from 'node:test';
import assert from 'node:assert/strict';
import { startChatHarness } from './helpers/zero-chat-harness.mjs';

test('a chat sends the layered prompt first and keeps it identical across messages', { timeout: 30000 }, async t => {
  const { host, requests, ask } = await startChatHarness(t, { reply: () => ({ text: 'Done.' }), prefix: 'zero-prompt-layers-' });
  await ask('chat-prompt-1', 'hello');
  await ask('chat-prompt-1', 'and again');
  assert.equal(requests.length, 2);
  const first = requests[0].messages[0], second = requests[1].messages[0];
  assert.equal(first.role, 'system');
  assert.match(first.content, /HOW YOU WORK/);
  assert.match(first.content, /WHERE YOU ARE/);
  assert.ok(!/YouTube|Spotify|WhatsApp/.test(first.content), 'no app-specific scripts');
  assert.equal(second.content, first.content, 'the frozen prompt does not change between messages');
  const saved = host.sessions.getSession('chat-prompt-1').metadata.zeroPrompt;
  assert.equal(saved.text, first.content, 'the prompt is stored on the chat');
  assert.equal(host._sessionPrompt('chat-prompt-1', { rebuild: true }), first.content.replace(/This chat started: [^\n]*/, m => m), 'a rebuild composes the same layers');
});
