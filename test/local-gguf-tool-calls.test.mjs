import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLocalToolCalls } from '../backend/gateway/server/local-gguf-tool-calls.mjs';

test('[CONTRACT] supplied local tool envelopes use function wire objects and retain every call', () => {
  const calls = parseLocalToolCalls('<tool_call>{"name":"read","arguments":{"path":"हिंदी.txt"}}</tool_call>\n<tool_call>{"name":"write","arguments":{}}</tool_call>');
  assert.equal(calls.length, 2);
  assert.notEqual(calls[0].id, calls[1].id);
  assert.equal(calls[0].type, 'function');
  assert.deepEqual(JSON.parse(calls[0].function.arguments), { path: 'हिंदी.txt' });
  assert.equal(calls[1].function.name, 'write');
  assert.equal(parseLocalToolCalls('Ordinary prose'), undefined);
});

test('[CONTRACT] JSON strings retain literal envelope tags, escaped quotes and nested objects', () => {
  const args = { content: '</tool_call><tool_call>{"quoted":"a\\b"}', nested: { list: [{ value: '}' }] } };
  const envelope = `<tool_call>${JSON.stringify({ name: 'write', arguments: args })}</tool_call>`;
  assert.deepEqual(JSON.parse(parseLocalToolCalls(envelope)[0].function.arguments), args);
  assert.notEqual(parseLocalToolCalls(envelope)[0].id, parseLocalToolCalls(envelope)[0].id);
  assert.throws(() => parseLocalToolCalls(envelope + '</tool_call>'));
});

test('[CONTRACT] malformed and incomplete requests fail the entire parsed batch', () => {
  const valid = '<tool_call>{"name":"read","arguments":{}}</tool_call>';
  for (const invalid of ['<tool_call>{', '<tool_call>bad</tool_call>', '<tool_call>{"arguments":{}}</tool_call>', '<tool_call>{"name":"x","arguments":[]}</tool_call>', '<tool_call>{"name":"x"}</tool_call>']) {
    assert.throws(() => parseLocalToolCalls(valid + invalid));
  }
});
