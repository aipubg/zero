import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { assignZeroModel, modelSettings } from '../services/host/model-settings.mjs';

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
