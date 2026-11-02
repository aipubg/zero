import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

test('[CONTRACT] real HTTP streamed malformed batches fail before valid leading file writes', { timeout: 20000 }, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-assistant-batch-'));
  let mode; let target;
  const upstream = http.createServer(async (req, res) => {
    for await (const chunk of req) void chunk;
    const calls = mode === 'empty' ? [] : [{ index: 0, id: mode === 'missing-id' ? undefined : 'first', type: 'function', function: { name: 'write_file', arguments: JSON.stringify({ path: target, content: 'MUST_NOT_BE_WRITTEN' }) } },
      { index: 1, id: mode === 'duplicate' ? 'first' : 'second', type: 'function', function: { name: mode === 'undeclared' ? 'not_an_offered_tool' : 'read_file', arguments: mode === 'json' ? '{broken' : '{}' } }];
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.end(`data: ${JSON.stringify({ choices: [{ delta: { tool_calls: calls }, finish_reason: 'tool_calls' }] })}\n\ndata: [DONE]\n\n`);
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const reservation = net.createServer(); await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const providersPath = path.join(root, 'providers.json'); const agentBindingsPath = path.join(root, 'bindings.json');
  fs.writeFileSync(providersPath, JSON.stringify([{ id: 'fixture', baseUrl: `http://127.0.0.1:${upstream.address().port}/v1`, apiKey: 'local-contract-only', models: ['contract-model'] }]));
  fs.writeFileSync(agentBindingsPath, JSON.stringify({ agentBindings: { zero: { model: 'fixture/contract-model' } } }));
  const host = new ZeroNativeHost({ port, dataDir: path.join(root, 'data'), prefsPath: path.join(root, 'prefs.json'), skillsDir: path.join(root, 'skills'), providersPath, agentBindingsPath });
  t.after(async () => { await host.close(); upstream.closeAllConnections(); await new Promise(resolve => upstream.close(resolve)); assert.equal(fs.realpathSync(path.dirname(root)), fs.realpathSync(os.tmpdir())); fs.rmSync(root, { recursive: true, force: true }); });
  await host.start();
  for (mode of ['json', 'duplicate', 'undeclared', 'missing-id', 'empty']) {
    target = path.join(root, `${mode}.txt`);
    await assert.rejects(host._runAssistantRequest({ sessionKey: mode, runId: mode, userContent: 'Execute requested tool batch', source: 'contract' }), /Malformed|duplicate|undeclared|without calls/);
    assert.equal(fs.existsSync(target), false, `Leading write must not run for ${mode}`);
    const receipt = host.sessions.db.prepare('select task_id,status from zero_assistant_receipts where run_id=?').get(mode);
    assert.equal(receipt.status, 'failed'); assert.equal(host.tasks.getTask(receipt.task_id).status, 'FAILED');
    const failure = host.tasks.getTaskSteps(receipt.task_id).find(step => step.toolName === 'tool_batch_validation');
    assert.equal(failure.status, 'failed'); assert.equal(failure.toolResult.executed, false);
    assert.ok(!host.sessions.getTranscript(mode).some(message => message.tool_calls?.length));
  }
});
