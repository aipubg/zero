import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { EventAutomationEngine } from '../packages/automation/event-automation.mjs';

test('[INTEGRATION] connector probes execute actual HTTP and CLI operations with limited claims', async () => {
  let requests = 0;
  const server = http.createServer((request, response) => { assert.equal(request.method, 'HEAD'); requests++; response.writeHead(request.url === '/ok' ? 204 : 503); response.end(); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const engine = new EventAutomationEngine();
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    engine.registerConnector({ id: 'web', name: 'Actual HTTP', type: 'webhook', config: { url: base + '/ok' } });
    assert.equal((await engine.testConnector('web')).status, 'reachable');
    engine.registerConnector({ id: 'web', name: 'Actual HTTP', type: 'webhook', config: { url: base + '/fail' } });
    assert.equal((await engine.testConnector('web')).ok, false); assert.equal(requests, 2);
    engine.registerConnector({ id: 'cli', name: 'Node', type: 'cli', config: { binary: process.execPath } });
    const executed = await engine.testConnector('cli');
    assert.equal(executed.status, 'executable'); assert.match(executed.output, /^v\d+/); assert.equal(executed.functionalExecutionVerified, false);
    engine.registerConnector({ id: 'absent', name: 'Missing', type: 'cli', config: { binary: 'zero-nonexistent-probe.exe' } });
    assert.equal((await engine.testConnector('absent')).status, 'failed');
    engine.registerConnector({ id: 'unknown', name: 'Unknown', type: 'unsupported' });
    assert.equal((await engine.testConnector('unknown')).status, 'unavailable');
  } finally { engine.close(); await new Promise(resolve => server.close(resolve)); }
});
