import test from 'node:test';
import assert from 'node:assert/strict';
import { localContinuationPrompt, localNativeContinuation, localHistoricalTurns, fitLocalHistoricalTurns } from '../backend/gateway/server/local-gguf-continuation.mjs';

test('[CONTRACT] local continuation retains ordered calls, null assistant content and supplied tool results', () => {
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

test('[CONTRACT] context pruning removes complete user/tool groups and preserves current continuation', () => {
  const old = [
    { role: 'user', content: 'Old request ' + 'x'.repeat(1000) },
    { role: 'assistant', content: null, tool_calls: [{ id: 'old-call', function: { name: 'write_file', arguments: '{}' } }] },
    { role: 'tool', tool_call_id: 'old-call', content: 'OLD_RESULT' },
    { role: 'assistant', content: 'Old confirmation' },
  ];
  const recent = [{ role: 'user', content: 'Recent question' }, { role: 'assistant', content: 'Recent answer' }];
  const current = [{ type: 'user', text: 'Current request' }, { type: 'model', response: ['<tool_call>current</tool_call>'] }];
  const fitted = fitLocalHistoricalTurns([...old, ...recent], current, 20, 100);
  assert.equal(fitted.droppedTurns, 1);
  assert.deepEqual(fitted.history, [...localHistoricalTurns(recent).history, ...current]);
  assert.equal(JSON.stringify(fitted.history).includes('OLD_RESULT'), false);
  const over = fitLocalHistoricalTurns(old, current, 500, 1);
  assert.deepEqual(over.history, current);
  assert.equal(over.exceedsEstimate, true);
});

test('[CONTRACT] earlier null-content calls and failed results survive a later user turn', () => {
  const result = localHistoricalTurns([{ role: 'system', content: 'Keep history' }, { role: 'user', content: 'Read x' }, { role: 'assistant', content: null, tool_calls: [{ id: 'a', function: { name: 'read_file', arguments: '{"path":"x"}' } }] }, { role: 'tool', tool_call_id: 'a', content: '{"ok":false,"error":"missing"}' }, { role: 'assistant', content: 'Missing file' }]);
  assert.equal(result.systemPrompt, 'Keep history');
  assert.deepEqual(result.history.map(turn => turn.type), ['user', 'model', 'user', 'model']);
  assert.match(result.history[1].response[0], /read_file/);
  assert.equal(result.history[2].text, '<tool_response>\n{"ok":false,"error":"missing"}\n</tool_response>');
  assert.throws(() => localHistoricalTurns([{ role: 'tool', tool_call_id: 'unknown', content: 'ok' }]));
  const withProse = localHistoricalTurns([{ role: 'assistant', content: 'Reading now', tool_calls: [{ id: 'b', function: { name: 'read_file', arguments: '{"path":"x"}' } }] }]);
  assert.match(withProse.history[0].response[0], /Reading now\n<tool_call>/);
});

test('[CONTRACT] native continuation preserves roles and raw tool result without re-escaping paths', () => {
  const content = JSON.stringify({ path: 'C:\\हिंदी\\x', verified: true });
  const calls = [{ id: 'a', function: { name: 'write_file', arguments: '{"path":"x","content":"ok"}' } }];
  const result = localNativeContinuation('Write file', [{ role: 'assistant', content: null, tool_calls: calls }, { role: 'tool', tool_call_id: 'a', content }]);
  assert.deepEqual(result.history.map(turn => turn.type), ['user', 'model']);
  assert.equal(result.prompt, `<tool_response>\n${content}\n</tool_response>`);
  assert.match(result.history[1].response[0], /<tool_call>/);
  assert.throws(() => localNativeContinuation('x', [{ role: 'tool', tool_call_id: 'unknown', content: 'ok' }]));
  assert.throws(() => localNativeContinuation('x', [{ role: 'assistant', tool_calls: calls }]));
});
