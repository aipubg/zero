import test from 'node:test';
import assert from 'node:assert/strict';
import { SearchEngine } from '../packages/research-engine/search.mjs';

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
