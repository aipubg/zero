import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { assignZeroModel, modelSettings, saveConfiguredProvider, deleteConfiguredProvider, probeConfiguredProvider } from '../services/host/model-settings.mjs';
import http from 'node:http';
import { once } from 'node:events';

test('[INTEGRATION] provider edits retain private credentials, preserve original backup and honor disabled routing', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-provider-settings-'));
  t.after(() => { assert.equal(fs.realpathSync(path.dirname(root)), fs.realpathSync(os.tmpdir())); fs.rmSync(root, { recursive: true, force: true }); });
  const configPath = path.join(root, 'providers.json');
  const original = JSON.stringify([{ id: 'private', name: 'Original', baseUrl: 'https://example.invalid/v1', apiKey: 'saved-secret', apiKeys: ['saved-secret'], models: ['one'], retained: 123 }]);
  fs.writeFileSync(configPath, original);
  const fabric = new ModelFabric({ configPath, agentBindingsPath: path.join(root, 'bindings.json') });
  const edited = saveConfiguredProvider(fabric, { id: 'private', name: 'Edited', apiKey: '', apiKeys: [], enabled: false });
  assert.equal(fs.readFileSync(edited.backupPath, 'utf8'), original);
  const row = JSON.parse(fs.readFileSync(configPath))[0]; assert.equal(row.apiKey, 'saved-secret'); assert.equal(row.apiKeys[0], 'saved-secret'); assert.equal(row.retained, 123);
  assert.equal(fabric.resolveModel('private/one'), null); assert.equal(fabric.listModels().length, 0);
  assert.ok(!JSON.stringify(modelSettings(fabric)).includes('saved-secret'));
  saveConfiguredProvider(fabric, { id: 'private', enabled: true }); assert.ok(fabric.resolveModel('private/one'));
  const saved = fs.readFileSync(configPath, 'utf8');
  assert.throws(() => saveConfiguredProvider(fabric, { id: 'private', models: ['one', 'one'] }), /unique nonempty/);
  assert.equal(fs.readFileSync(configPath, 'utf8'), saved);
  deleteConfiguredProvider(fabric, 'private'); assert.deepEqual(JSON.parse(fs.readFileSync(configPath)), []);
});

test('[CONTRACT] actual HTTP provider probe retrieves a model catalog and preserves failure instead of testing key existence', async t => {
  let authorization;
  const server = http.createServer((request, response) => { authorization = request.headers.authorization; response.writeHead(request.url === '/v1/models' ? 200 : 503, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ data: [{ id: 'actual-catalog-entry' }] })); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const baseUrl = `http://127.0.0.1:${server.address().port}/v1`;
  const fabric = new ModelFabric({ providers: [{ id: 'probe', baseUrl, apiKey: 'probe-secret', models: [] }] });
  const result = await probeConfiguredProvider(fabric, { id: 'probe' });
  assert.equal(authorization, 'Bearer probe-secret'); assert.equal(result.models[0].id, 'actual-catalog-entry'); assert.equal(result.verified, false);
  await assert.rejects(probeConfiguredProvider(fabric, { baseUrl: baseUrl + '/failed', apiKey: 'present-but-invalid' }), /HTTP 503/);
});

test('[INTEGRATION] model assignment persists across reopen, preserves unrelated settings and backs up original bytes', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-model-settings-'));
  t.after(() => { assert.equal(fs.realpathSync(path.dirname(root)), fs.realpathSync(os.tmpdir())); fs.rmSync(root, { recursive: true, force: true }); });
  const configPath = path.join(root, 'providers.json'); const agentBindingsPath = path.join(root, 'bindings.json');
  fs.writeFileSync(configPath, JSON.stringify([{ id: 'local', baseUrl: 'http://127.0.0.1:1/v1', apiKey: 'private-test-value', models: ['one', { id: 'two', apiKey: 'private-model-value' }] }]));
  const original = JSON.stringify({ retained: { value: 123 }, defaults: { thinking: 'default' }, agentBindings: { specialist: { model: 'one' }, zero: { model: 'one', retained: true } } });
  fs.writeFileSync(agentBindingsPath, original);
  const fabric = new ModelFabric({ configPath, agentBindingsPath });
  const result = assignZeroModel(fabric, { modelId: 'local/two' });
  assert.equal(fs.readFileSync(result.backupPath, 'utf8'), original);
  assert.equal(new ModelFabric({ configPath, agentBindingsPath }).resolveAgentModel('zero').canonicalModelId, 'two');
  const saved = JSON.parse(fs.readFileSync(agentBindingsPath));
  assert.equal(saved.retained.value, 123); assert.equal(saved.agentBindings.specialist.model, 'one'); assert.equal(saved.agentBindings.zero.retained, true);
  assert.ok(!JSON.stringify(modelSettings(fabric)).includes('private-'));
  const before = fs.readFileSync(agentBindingsPath, 'utf8');
  assert.throws(() => assignZeroModel(fabric, { modelId: 'local/unconfigured' }), /configured catalog/);
  assert.equal(fs.readFileSync(agentBindingsPath, 'utf8'), before);
});
