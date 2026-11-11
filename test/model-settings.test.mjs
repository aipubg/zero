import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { assignZeroModel, assignAgentModel, modelSettings, saveConfiguredProvider, deleteConfiguredProvider, probeConfiguredProvider } from '../services/host/model-settings.mjs';
import http from 'node:http';
import { once } from 'node:events';

test('[INTEGRATION] provider edits retain private credentials, preserve original backup and honor disabled routing', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-provider-settings-'));
  t.after(() => { const resolved = fs.realpathSync.native(root); assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir())); assert.ok(["zero-provider-settings-","zero-model-settings-"].some(prefix => path.basename(resolved).startsWith(prefix))); fs.rmSync(resolved, { recursive: true, force: true }); });
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
  assert.equal(fabric.configPath, null); assert.equal(fabric.agentBindingsPath, null);
  assert.throws(() => saveConfiguredProvider(fabric, { id: 'memory-only', baseUrl, models: [] }), /No provider configuration path/);
  const result = await probeConfiguredProvider(fabric, { id: 'probe' });
  assert.equal(authorization, 'Bearer probe-secret'); assert.equal(result.models[0].id, 'actual-catalog-entry'); assert.equal(result.verified, false);
  await assert.rejects(probeConfiguredProvider(fabric, { baseUrl: baseUrl + '/failed', apiKey: 'present-but-invalid' }), /HTTP 503/);
});

test('[CONTRACT] provider catalogs distinguish empty data from malformed IDs and bound actual HTTP response bytes', async t => {
  let payload = '{"data":[]}';
  const server = http.createServer((request, response) => { request.resume(); response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(payload); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const baseUrl = `http://127.0.0.1:${server.address().port}/v1`;
  const fabric = new ModelFabric({ providers: [] });
  const empty = await probeConfiguredProvider(fabric, { baseUrl }); assert.equal(empty.status, 'empty'); assert.deepEqual(empty.models, []); assert.equal(empty.verified, false);
  for (const body of [null, { data: [{}] }, { data: [{ id: '' }] }, { data: [{ id: '  ' }] }, { data: [{ id: 'same' }, { id: 'same' }] }]) {
    payload = JSON.stringify(body); await assert.rejects(probeConfiguredProvider(fabric, { baseUrl }), /invalid model catalog/);
  }
  payload = '{broken'; await assert.rejects(probeConfiguredProvider(fabric, { baseUrl }), /invalid model catalog JSON/);
  payload = JSON.stringify({ data: [{ id: 'real-id', apiKey: 'private-marker', name: {} }] });
  const valid = await probeConfiguredProvider(fabric, { baseUrl }); assert.deepEqual(valid.models, [{ id: 'real-id', name: 'real-id' }]);
  payload = JSON.stringify({ data: ['x'.repeat(9 * 1024 * 1024)] });
  await assert.rejects(probeConfiguredProvider(fabric, { baseUrl }), /exceeded 8 MiB/);
});

test('[INTEGRATION] model assignment persists across reopen, preserves unrelated settings and backs up original bytes', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-model-settings-'));
  t.after(() => { const resolved = fs.realpathSync.native(root); assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir())); assert.ok(["zero-provider-settings-","zero-model-settings-"].some(prefix => path.basename(resolved).startsWith(prefix))); fs.rmSync(resolved, { recursive: true, force: true }); });
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
  assignAgentModel(fabric, 'coder', { modelId: 'local/one' });
  const specialistSaved = JSON.parse(fs.readFileSync(agentBindingsPath));
  assert.deepEqual(specialistSaved.defaults, saved.defaults);
  assert.deepEqual(specialistSaved.agentBindings.zero, saved.agentBindings.zero);
  const reopened = new ModelFabric({ configPath, agentBindingsPath });
  assert.equal(reopened.resolveAgentModel('coder').canonicalModelId, 'one');
  assert.equal(reopened.resolveAgentModel('zero').canonicalModelId, 'two');
  assert.throws(() => assignAgentModel(fabric, '__proto__', { modelId: 'local/one' }), /Unknown specialist/);
  assert.ok(!JSON.stringify(modelSettings(fabric)).includes('private-'));
  const before = fs.readFileSync(agentBindingsPath, 'utf8');
  assert.throws(() => assignZeroModel(fabric, { modelId: 'local/unconfigured' }), /configured catalog/);
  assert.equal(fs.readFileSync(agentBindingsPath, 'utf8'), before);
  saveConfiguredProvider(fabric, { id: 'local', enabled: false });
  assert.throws(() => fabric.resolveAgentModel('zero'), /Assigned model.*unavailable/);
  assert.equal(modelSettings(fabric).effectiveModel, null);
  assert.match(modelSettings(fabric).assignmentError, /unavailable/);
  saveConfiguredProvider(fabric, { id: 'local', enabled: true });
  fs.writeFileSync(agentBindingsPath, '{broken');
  assert.throws(() => fabric.resolveAgentModel('zero'), /cannot be read/);
});


test('[INTEGRATION] settings reload external provider writes and preserve additions on a later RPC edit', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-provider-settings-'));
  t.after(() => { assert.equal(path.dirname(fs.realpathSync(root)), fs.realpathSync(os.tmpdir())); fs.rmSync(root, { recursive: true, force: true }); });
  const configPath = path.join(root, 'providers.json'); const agentBindingsPath = path.join(root, 'bindings.json');
  const first = { id: 'first', baseUrl: 'https://example.invalid/v1', models: ['shared'] };
  fs.writeFileSync(configPath, JSON.stringify([first]));
  const fabric = new ModelFabric({ configPath, agentBindingsPath });
  fs.writeFileSync(configPath, JSON.stringify([first, { id: 'google', baseUrl: 'https://example.invalid/v1', apiKey: 'private-marker', models: ['shared'] }]));
  assert.equal(modelSettings(fabric).providers.length, 2);
  assignZeroModel(fabric, { modelId: 'google/shared' });
  assert.equal(fabric.getAgentModelId(), 'google/shared');
  assert.equal(fabric.resolveModel('google/shared').provider.id, 'google');
  saveConfiguredProvider(fabric, { id: 'first', name: 'Edited' });
  const reopened = new ModelFabric({ configPath, agentBindingsPath });
  assert.equal(reopened.getAgentModelId(), 'google/shared');
  assert.equal(reopened.providers.get('google').apiKey, 'private-marker');
  assert.equal(reopened.listModels().length, 2);
});
