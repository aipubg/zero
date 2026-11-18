import test from 'node:test';
import assert from 'node:assert/strict';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { keyAllowedFor } from '../packages/model-fabric/key-guard.mjs';

test('well-known keys only go to their own host', () => {
  assert.equal(keyAllowedFor('OPENAI_API_KEY', 'https://api.openai.com/v1'), true);
  assert.equal(keyAllowedFor('OPENAI_API_KEY', 'https://openai.example.com/v1'), false);
  assert.equal(keyAllowedFor('OPENAI_API_KEY', 'https://api.openai.com.evil.example/v1'), false, 'look-alike host refused');
  assert.equal(keyAllowedFor('NV_API_KEY', 'https://integrate.api.nvidia.com/v1'), true);
  assert.equal(keyAllowedFor('MY_OWN_KEY', 'https://anything.example/v1'), true, 'names Zero does not know are the owner\'s choice');
});

test('model fabric withholds a well-known key from a foreign host', t => {
  const saved = { OPENAI_API_KEY: process.env.OPENAI_API_KEY, ZERO_TEST_CUSTOM_KEY: process.env.ZERO_TEST_CUSTOM_KEY };
  process.env.OPENAI_API_KEY = 'sk-real-openai-key-for-test';
  process.env.ZERO_TEST_CUSTOM_KEY = 'custom-key';
  t.after(() => { for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
  const fabric = new ModelFabric({ providers: [
    { id: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'env:OPENAI_API_KEY', models: ['m'] },
    { id: 'lookalike', baseUrl: 'https://proxy.example.net/v1', apiKey: 'env:OPENAI_API_KEY', models: ['m'] },
    { id: 'custom', baseUrl: 'https://proxy.example.net/v1', apiKey: 'env:ZERO_TEST_CUSTOM_KEY', models: ['m'] },
    { id: 'literal', baseUrl: 'https://proxy.example.net/v1', apiKey: 'typed-by-owner', models: ['m'] },
  ] });
  const key = id => fabric.resolveApiKey(fabric.providers.get(id));
  assert.equal(key('openai'), 'sk-real-openai-key-for-test');
  assert.equal(key('lookalike'), '', 'OPENAI_API_KEY is not sent to another host');
  assert.match(fabric.keyGuardNotes.get('lookalike'), /only sent to api\.openai\.com/);
  assert.equal(key('custom'), 'custom-key');
  assert.equal(key('literal'), 'typed-by-owner');
});
