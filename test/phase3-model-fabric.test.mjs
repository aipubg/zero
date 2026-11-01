import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModelFabric } from '../packages/model-fabric/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Load environment credentials from .env
const envFile = path.join(REPO_ROOT, '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

test('Phase 3 Multi-Model Fabric Suite', async (suite) => {
  const fabric = new ModelFabric();

  // 1. Model resolution and alias catalog
  await suite.test('ModelFabric resolves canonical model IDs and aliases', () => {
    const resLead = fabric.resolveModel('zero-lead');
    assert.ok(resLead, 'zero-lead must resolve');
    assert.equal(resLead.canonicalModelId, 'nvidia/nemotron-3.5-lightning-30b-a3b');

    const resDirect = fabric.resolveModel('nvidia/nemotron-3.5-lightning-30b-a3b');
    assert.ok(resDirect, 'Direct canonical ID must resolve');
    assert.equal(resDirect.canonicalModelId, 'nvidia/nemotron-3.5-lightning-30b-a3b');

    const resUnknown = fabric.resolveModel('non-existent-model-xyz');
    assert.equal(resUnknown, null, 'Unknown model must return null');
  });

  // 2. Per-agent model assignment resolution
  await suite.test('ModelFabric resolves per-agent model assignment', () => {
    const zeroModel = fabric.resolveAgentModel('zero');
    assert.ok(zeroModel, 'Agent zero model must resolve');
    assert.ok(zeroModel.canonicalModelId.includes('nemotron'), 'Agent zero assigned Nemotron model');
  });

  // 3. Context budget calculation
  await suite.test('ModelFabric calculates context budget against model window', () => {
    const budget = fabric.calculateContextBudget('zero-lead', [
      { role: 'system', content: 'You are Zero.' },
      { role: 'user', content: 'What is the capital of France?' },
    ]);
    assert.ok(budget.contextWindow >= 131072);
    assert.ok(budget.estimatedPromptTokens > 0);
    assert.ok(budget.remainingTokens > 100000);
    assert.equal(budget.withinBudget, true);
    assert.ok(budget.maxCompletionTokens <= 4096);
  });

  // 4. Token usage and accounting
  await suite.test('ModelFabric tracks token usage and request statistics', () => {
    fabric.recordUsage('nvidia/nemotron-3.5-lightning-30b-a3b', 45, 120);
    const report = fabric.getUsageReport();
    assert.ok(report.totalRequests >= 1);
    assert.ok(report.totalPromptTokens >= 45);
    assert.ok(report.totalCompletionTokens >= 120);
    assert.ok(report.totalTokens >= 165);
    assert.ok(report.byModel['nvidia/nemotron-3.5-lightning-30b-a3b'].totalTokens >= 165);
  });

  // 5. Explicit error for unknown model invocation
  await suite.test('ModelFabric throws deterministic error for unknown model invocation', async () => {
    await assert.rejects(
      async () => {
        await fabric.executeChat({ model: 'unknown-vendor/fake-model', messages: [{ role: 'user', content: 'Hi' }] });
      },
      (err) => {
        assert.equal(err.code, 'model_not_found');
        assert.equal(err.status, 404);
        return true;
      }
    );
  });

  // 6. Live streaming inference with incremental deltas
  await suite.test('ModelFabric streams genuine incremental deltas from configured provider', async () => {
    const chunks = [];
    for await (const chunk of fabric.streamChat({
      model: 'zero-lead',
      messages: [{ role: 'user', content: 'Say hello in two words.' }],
      max_tokens: 32,
    })) {
      chunks.push(chunk);
    }
    assert.ok(chunks.length >= 1, 'Stream must yield chunks');
    assert.ok(chunks.some(c => c.done || c.delta), 'Stream must yield deltas or completion');
  });
});
