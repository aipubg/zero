import test from 'node:test';
import assert from 'node:assert/strict';
import { ModelFabric } from '../index.mjs';

test('Zero Model Fabric Enterprise Inference Engine', async (t) => {
  const fabric = new ModelFabric({
    providers: [
      {
        id: 'test-nim',
        name: 'Test NVIDIA NIM',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        models: [
          { id: 'meta/llama-3.1-70b-instruct', reasoning: false, tools: true },
          { id: 'meta/llama-3.2-11b-vision-instruct', reasoning: false, image: true },
        ],
        apiKey: 'env:TEST_NIM_KEY',
      },
    ],
    aliases: {
      'zero-lead': 'meta/llama-3.1-70b-instruct',
      '@vision': 'meta/llama-3.2-11b-vision-instruct',
    },
  });

  await t.test('resolves canonical model IDs and aliases deterministically', () => {
    const direct = fabric.resolveModel('meta/llama-3.1-70b-instruct');
    assert.equal(direct.provider.id, 'test-nim');
    assert.equal(direct.canonicalModelId, 'meta/llama-3.1-70b-instruct');
    assert.equal(direct.capabilities.tools, true);

    const aliased = fabric.resolveModel('zero-lead');
    assert.equal(aliased.canonicalModelId, 'meta/llama-3.1-70b-instruct');

    const vision = fabric.resolveModel('@vision');
    assert.equal(vision.capabilities.image, true);

    const unknown = fabric.resolveModel('non-existent-model');
    assert.equal(unknown, null);
  });

  await t.test('safely resolves environment credentials without leaks', () => {
    process.env.TEST_NIM_KEY = 'test-token-12345';
    const resolution = fabric.resolveModel('zero-lead');
    const key = fabric.resolveApiKey(resolution.provider);
    assert.equal(key, 'test-token-12345');

    // Without env var
    delete process.env.TEST_NIM_KEY;
    const missing = fabric.resolveApiKey(resolution.provider);
    assert.equal(missing, '');
  });

  await t.test('tracks provider health metrics and circuit breaker state', () => {
    fabric.recordSuccess('test-nim', 120);
    let health = fabric.getHealthReport();
    assert.equal(health['test-nim'].status, 'healthy');
    assert.equal(health['test-nim'].totalRequests, 1);
    assert.equal(health['test-nim'].consecutiveFailures, 0);
    assert.equal(health['test-nim'].lastLatencyMs, 120);

    fabric.recordFailure('test-nim', 'Rate limit exceeded');
    fabric.recordFailure('test-nim', 'Rate limit exceeded');
    fabric.recordFailure('test-nim', 'Rate limit exceeded');
    health = fabric.getHealthReport();
    assert.equal(health['test-nim'].consecutiveFailures, 3);
    assert.equal(health['test-nim'].status, 'degraded');
  });

  await t.test('throws 404 on unmapped model execution', async () => {
    await assert.rejects(
      () => fabric.executeChat({ model: 'unknown-xyz', messages: [] }),
      (err) => {
        assert.equal(err.status, 404);
        assert.equal(err.code, 'model_not_found');
        return true;
      }
    );
  });

  await t.test('throws 401 on missing API key configuration', async () => {
    delete process.env.TEST_NIM_KEY;
    delete process.env.NVIDIA_API_KEY;
    await assert.rejects(
      () => fabric.executeChat({ model: 'zero-lead', messages: [] }),
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.code, 'missing_api_key');
        return true;
      }
    );
  });
});
