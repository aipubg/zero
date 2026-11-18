import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { shouldReflect, reflectionMessages } from '../packages/agent-runtime/turn-reflection.mjs';
import { startChatHarness } from './helpers/zero-chat-harness.mjs';

const isReflection = request => String(request.messages?.[0]?.content || '').startsWith('You are Zero, reviewing a conversation');

test('when to reflect', () => {
  assert.equal(shouldReflect({ toolActions: 3 }), true);
  assert.equal(shouldReflect({ toolActions: 1, ownerMessagesSince: 2 }), false);
  assert.equal(shouldReflect({ toolActions: 0, ownerMessagesSince: 6 }), true);
  assert.equal(shouldReflect({ enabled: false, toolActions: 9 }), false);
  const [system, user] = reflectionMessages([{ role: 'user', content: 'always reply in Hindi' }, { role: 'assistant', content: 'ok' }]);
  assert.match(system.content, /one-off request is not a standing preference/);
  assert.match(user.content, /OWNER: always reply in Hindi/);
});

test('after a busy reply Zero keeps a grounded fact in the background, outside the chat', { timeout: 60000 }, async t => {
  let toolTurns = 0;
  const { host, requests, ask } = await startChatHarness(t, {
    prefix: 'zero-reflection-',
    hostOptions: { turnReflection: true, reflectEvery: 99 },
    reply: request => {
      if (isReflection(request)) {
        const last = request.messages.at(-1);
        if (last.role === 'tool') return { text: 'Kept.' };
        return { toolCalls: [{ name: 'notebook', args: { action: 'add', book: 'owner', text: 'Owner wants replies in Hindi from now on.' } }] };
      }
      if (request.messages.at(-1).role === 'user' || toolTurns < 3) {
        toolTurns++;
        if (toolTurns <= 3) return { toolCalls: [{ name: 'read_file', args: { path: path.resolve('README.md') } }] };
      }
      return { text: 'Done, and from now on I will reply in Hindi.' };
    },
  });
  const reply = await ask('chat-reflect', 'From now on always reply in Hindi. Also read the readme three times.');
  assert.match(String(reply.content), /reply in Hindi/, 'the reply came back first');
  for (let i = 0; i < 100 && !host.lastReflection; i++) await new Promise(r => setTimeout(r, 100));
  assert.ok(host.lastReflection, 'a reflection ran');
  assert.deepEqual(host.notebook.entries('owner'), ['Owner wants replies in Hindi from now on.']);
  assert.equal(host.lastReflection.saved.length, 1);
  const reflectionRequest = requests.find(isReflection);
  assert.deepEqual(reflectionRequest.tools.map(tool => tool.function.name).sort(), ['notebook', 'procedure_learn'], 'only the keep-tools are offered');
  const transcript = host.sessions.getTranscript('chat-reflect', { limit: 1000 });
  assert.ok(!transcript.some(m => /reviewing a conversation|Kept\./.test(String(m.content))), 'nothing from the reflection is written into the chat');
});
