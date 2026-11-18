import test from 'node:test';
import assert from 'node:assert/strict';
import { matchChatCommand, CHAT_COMMANDS } from '../packages/agent-runtime/chat-commands.mjs';
import { startChatHarness } from './helpers/zero-chat-harness.mjs';

test('command parsing', () => {
  assert.equal(matchChatCommand('/help').command.name, 'help');
  assert.equal(matchChatCommand('/compact').command.name, 'fold', 'aliases work');
  assert.deepEqual(matchChatCommand('/notebook owner').args, 'owner');
  assert.equal(matchChatCommand('/status'), null, '/status stays with the diagnostic');
  assert.equal(matchChatCommand('please /help me'), null);
  assert.equal(matchChatCommand('/unknown'), null, 'unknown commands go to the model');
  assert.ok(CHAT_COMMANDS.every(c => c.usage && c.description && typeof c.run === 'function'));
});

test('chat commands answer without a model call', { timeout: 60000 }, async t => {
  const long = n => 'word '.repeat(n);
  const { host, requests, ask } = await startChatHarness(t, {
    prefix: 'zero-commands-',
    hostOptions: { foldContextWindow: 100000 },
    reply: request => (String(request.messages[0]?.content).startsWith('You write the handoff summary') ? { text: 'GOAL — test folding.' } : { text: long(200) }),
  });
  host.notebook.add('owner', 'Owner likes short replies.');
  const help = await ask('chat-cmd', '/help');
  assert.match(help.content, /\/fold/);
  assert.match(help.content, /\/notebook/);
  assert.equal(requests.length, 0, 'no model call for /help');

  const notebook = await ask('chat-cmd', '/notebook owner');
  assert.match(notebook.content, /Owner likes short replies\./);
  const budget = await ask('chat-cmd', '/budget');
  assert.match(budget.content, /tool actions/);
  assert.equal(requests.length, 0);

  for (let i = 0; i < 4; i++) await ask('chat-cmd', `${long(150)} message ${i}`);
  const before = requests.length;
  const fold = await ask('chat-cmd', '/fold');
  assert.match(fold.content, /^Folded \d+ older message/);
  assert.equal(requests.length, before + 1, 'only the summary call');
  assert.match(host.sessions.getSession('chat-cmd').metadata.contextFold.summary, /test folding/);
  const transcript = host.sessions.getTranscript('chat-cmd', { limit: 100 });
  assert.ok(transcript.some(m => m.role === 'assistant' && /^Folded/.test(m.content)), 'command replies are kept in the chat');
});
