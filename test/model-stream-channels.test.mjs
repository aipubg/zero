import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { ModelFabric } from '../packages/model-fabric/index.mjs';

test('[CONTRACT] real SSE transport separates reasoning from reply tokens', async () => {
  const server = http.createServer((request, response) => {
    request.resume();
    response.writeHead(200, { 'Content-Type': 'text/event-stream' });
    for (const delta of [{ reasoning_content: 'Internal planning text' }, { content: 'Actual ' }, { content: 'reply' }]) response.write(`data: ${JSON.stringify({ choices: [{ delta }] })}\n\n`);
    response.end('data: [DONE]\n\n');
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const fabric = new ModelFabric({ providers: [{ id: 'local-contract', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, apiKey: 'contract', models: ['stream-contract'] }] });
    const chunks = [];
    for await (const chunk of fabric.streamChat({ model: 'stream-contract', messages: [{ role: 'user', content: 'reply' }] })) chunks.push(chunk);
    assert.equal(chunks.map(chunk => chunk.delta || '').join(''), 'Actual reply');
    assert.equal(chunks[0].delta, null);
    assert.equal(chunks[0].reasoning_content, 'Internal planning text');
    assert.equal(chunks.at(-1).done, true);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
