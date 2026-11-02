import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { SearchEngine } from '../packages/research-engine/search.mjs';

test('[CONTRACT] malformed JSON and invalid response shapes are failures, never empty retrievals', async () => {
  for (const body of ['{broken', 'null', '"unexpected"']) {
    const result = await new SearchEngine({ fetch: async () => new Response(body) }).search('example');
    assert.equal(result.status, 'failed');
    assert.equal(result.attempts.length, 2);
    assert.ok(result.attempts.every(attempt => attempt.status === 'failed'));
    assert.deepEqual(result.citations, []);
  }
});

test('[INTEGRATION] actual HTTP headers without a completed body cannot bypass the search deadline', async t => {
  let requests = 0;
  const server = http.createServer((request, response) => {
    requests++; response.writeHead(200, { 'content-type': 'application/json' }); response.flushHeaders();
    response.write('{'); // Deliberately stalled actual socket, not a fabricated fetch response.
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const engine = new SearchEngine({ fetch: (url, options) => fetch(`http://127.0.0.1:${server.address().port}`, options) });
  const started = Date.now();
  const result = await engine.search('deadline');
  assert.equal(requests, 2); assert.equal(result.status, 'unavailable');
  assert.equal(result.attempts.length, 2); assert.deepEqual(result.citations, []);
  assert.ok(Date.now() - started < 12000, 'Both actual stalled bodies must terminate under bounded deadlines');
});

test('[CONTRACT] retrieved search entries carry provenance without claiming source verification', async () => {
  const engine = new SearchEngine({ fetch: async url => new Response(JSON.stringify(
    url.includes('duckduckgo') ? { Heading: 'Example', Abstract: 'Retrieved abstract', AbstractURL: 'https://example.org/document' } : ['', [], [], []]
  ), { status: 200 }) });
  const result = await engine.search('example');
  assert.equal(result.status, 'ok');
  assert.equal(result.verified, false);
  assert.equal(result.citations[0].retrieved, true);
  assert.equal(result.citations[0].verified, false);
  assert.equal(result.citations[0].url, 'https://example.org/document');
  assert.equal(result.citations[0].provenance.provider, 'duckduckgo-instant');
});

test('[CONTRACT] empty provider responses are distinct from offline and HTTP failures', async () => {
  for (const [expected, fetch] of [
    ['empty', async url => new Response(JSON.stringify(url.includes('duckduckgo') ? {} : ['', [], [], []]))],
    ['unavailable', async () => { throw new Error('offline'); }],
    ['failed', async () => new Response('unavailable', { status: 503 })],
  ]) {
    const result = await new SearchEngine({ fetch }).search('example');
    assert.equal(result.status, expected);
    assert.deepEqual(result.citations, []);
    assert.equal(result.verified, false);
  }
});

test('[CONTRACT] source domain filters apply to retrieved URLs', async () => {
  const engine = new SearchEngine({ fetch: async url => new Response(JSON.stringify(url.includes('duckduckgo') ? {
    Abstract: 'Other domain', AbstractURL: 'https://other.example/document',
  } : ['', ['Example'], ['Snippet'], ['https://example.org/document']])) });
  const result = await engine.search('example', { domain: 'example.org' });
  assert.equal(result.citations.length, 1);
  assert.equal(result.citations[0].domain, 'example.org');
});
