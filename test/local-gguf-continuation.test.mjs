import test from 'node:test';
import assert from 'node:assert/strict';
import { localContinuationPrompt } from '../backend/gateway/server/local-gguf-continuation.mjs';

test('[CONTRACT] local continuation retains ordered calls, null assistant content and actual tool results', () => {
  const messages = [
    { role: 'assistant', content: null, tool_calls: [{ id: 'a', type: 'function', function: { name: 'read', arguments: '{"path":"x"}' } }] },
    { role: 'tool', tool_call_id: 'a', content: '{"ok":false,"error":"missing हिंदी"}' },
    { role: 'assistant', content: 'I will recover' },
  ];
  const prompt = localContinuationPrompt('Read the file', messages);
  assert.ok(prompt.startsWith('Read the file'));
  assert.ok(prompt.includes(JSON.stringify(messages.map(m => m.role === 'assistant' ? { role: m.role, content: m.content, tool_calls: m.tool_calls ?? [] } : m))));
  assert.equal(localContinuationPrompt('Hello'), 'Hello');
  assert.throws(() => localContinuationPrompt('x', [{ role: 'tool', content: 'unattributed' }]));
  assert.throws(() => localContinuationPrompt('x', [{ role: 'system', content: 'late system' }]));
});
