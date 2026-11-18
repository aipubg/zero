import test from 'node:test';
import assert from 'node:assert/strict';
import { planFold, tailStart, trimOldToolOutputs, foldNote, estimateTokens, TRIMMED_TOOL_OUTPUT } from '../packages/sessions/context-fold.mjs';
import { startChatHarness } from './helpers/zero-chat-harness.mjs';

const long = (word, n = 1500) => `${word} `.repeat(Math.ceil(n / (word.length + 1))).slice(0, n);

test('the kept tail starts at an owner message and never splits a tool exchange', () => {
  const messages = [
    { role: 'user', content: long('a') },
    { role: 'assistant', content: '', tool_calls: [{ id: 'c1', function: { name: 'read_file', arguments: '{}' } }] },
    { role: 'tool', tool_call_id: 'c1', content: long('t', 3000) },
    { role: 'assistant', content: long('b') },
    { role: 'user', content: long('c') },
    { role: 'assistant', content: 'short' },
  ];
  const start = tailStart(messages, { contextWindow: 2000, tailShare: 0.2, minTail: 1 });
  assert.equal(messages[start].role, 'user');
  assert.equal(start, 4);
  const trimmed = trimOldToolOutputs(messages, start);
  assert.equal(trimmed.trimmed, 1);
  assert.equal(trimmed.messages[2].content, TRIMMED_TOOL_OUTPUT);
  assert.equal(trimmed.messages[4].content, messages[4].content, 'the tail is untouched');
});

test('plan: nothing, trim only, or fold', () => {
  const small = [{ role: 'user', content: 'hi' }];
  assert.equal(planFold(small, { contextWindow: 2000 }).action, 'none');
  const toolHeavy = [
    { role: 'user', content: 'go' },
    { role: 'assistant', content: '', tool_calls: [{ id: 'x', function: { name: 'read_file', arguments: '{}' } }] },
    { role: 'tool', tool_call_id: 'x', content: long('t', 6000) },
    { role: 'user', content: 'next' },
    { role: 'assistant', content: 'ok' },
  ];
  const trimOnly = planFold(toolHeavy, { contextWindow: 3000, minTail: 2 });
  assert.equal(trimOnly.action, 'trim', 'trimming the old tool output is enough');
  const chatty = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: long(`w${i}`) }));
  const fold = planFold(chatty, { contextWindow: 2000, minTail: 2 });
  assert.equal(fold.action, 'fold');
  assert.equal(chatty[fold.foldCount].role, 'user');
  assert.ok(estimateTokens(chatty.slice(fold.foldCount)) < estimateTokens(chatty));
  assert.match(foldNote('GOAL — x'), /for reference only[\s\S]*newest message[\s\S]*GOAL — x/);
});

test('a long chat folds: summary note after the prompt, history kept, newest message intact', { timeout: 60000 }, async t => {
  let summaries = 0;
  const { host, requests, ask } = await startChatHarness(t, {
    prefix: 'zero-fold-',
    hostOptions: { foldContextWindow: 2000 },
    reply: request => {
      if (String(request.messages[0]?.content).startsWith('You write the handoff summary')) { summaries++; return { text: 'GOAL — plan a trip to Goa.\nDONE — picked dates 12–15 Dec.' }; }
      return { text: long('reply', 900) };
    },
  });
  for (let i = 0; i < 5; i++) await ask('chat-long', `${long(`question${i}`, 900)} (message ${i})`);
  assert.ok(summaries >= 1, 'a fold summary was requested');
  const session = host.sessions.getSession('chat-long');
  assert.match(session.metadata.contextFold.summary, /plan a trip to Goa/);
  assert.ok(session.metadata.contextFold.archived > 0);

  const last = requests.at(-1);
  assert.equal(last.messages[0].role, 'system');
  assert.match(last.messages[1].content, /EARLIER IN THIS CHAT \(summary, for reference only\)[\s\S]*plan a trip to Goa/, 'the note sits right after the prompt');
  assert.match(last.messages.at(-1).content, /\(message 4\)$/, 'the newest owner message is sent as is');
  assert.ok(!last.messages.some(m => /\(message 0\)$/.test(String(m.content))), 'the folded part is out of the model context');

  const history = host.sessions.getTranscript('chat-long', { limit: 1000 });
  assert.ok(history.some(m => /\(message 0\)$/.test(String(m.content))), 'chat history still has every message');
});
