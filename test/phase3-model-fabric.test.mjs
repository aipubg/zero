import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { ModelFabric } from '../packages/model-fabric/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

test('Phase 3 Multi-Model Fabric Suite', async (suite) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-fabric-test-'));
  const bindingsPath = path.join(tmpDir, 'gateway-defaults.json');

  // Local mock server for streaming verification
  const server = http.createServer((req, res) => {
    if (req.url?.includes('/chat/completions')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n');
      res.write('data: {"choices":[{"delta":{"content":" world"}}]}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/v1`;

  suite.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const fixtureProvider = {
    id: 'fixture-provider',
    name: 'Fixture Provider',
    baseUrl,
    apiKey: 'fixture-secret-key',
    models: [
      { id: 'fixture-chat-model', name: 'Fixture Chat Model' },
      { id: 'fixture-vision-model', name: 'Fixture Vision Model' },
    ],
  };

  fs.writeFileSync(bindingsPath, JSON.stringify({
    defaults: { primary: 'fixture-provider/fixture-chat-model' },
    agentBindings: {
      zero: { model: 'fixture-provider/fixture-chat-model' },
    },
  }));

  const fabric = new ModelFabric({
    providers: [fixtureProvider],
    aliases: { 'zero-lead': 'fixture-provider/fixture-chat-model' },
    agentBindingsPath: bindingsPath,
  });

  // 1. Model resolution and alias catalog
  await suite.test('ModelFabric resolves canonical model IDs and aliases', () => {
    const resLead = fabric.resolveModel('zero-lead');
    assert.ok(resLead, 'zero-lead must resolve');
    assert.equal(resLead.canonicalModelId, 'fixture-chat-model');

    const resDirect = fabric.resolveModel('fixture-provider/fixture-chat-model');
    assert.ok(resDirect, 'Direct canonical ID must resolve');
    assert.equal(resDirect.canonicalModelId, 'fixture-chat-model');

    const resUnknown = fabric.resolveModel('non-existent-model-xyz');
    assert.equal(resUnknown, null, 'Unknown model must return null');
  });

  // 2. Per-agent model assignment resolution
  await suite.test('ModelFabric resolves per-agent model assignment', () => {
    const zeroModel = fabric.resolveAgentModel('zero');
    assert.ok(zeroModel, 'Agent zero model must resolve');
    assert.equal(zeroModel.canonicalModelId, 'fixture-chat-model');
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
    fabric.recordUsage('fixture-provider/fixture-chat-model', 45, 120);
    const report = fabric.getUsageReport();
    assert.ok(report.totalRequests >= 1);
    assert.ok(report.totalPromptTokens >= 45);
    assert.ok(report.totalCompletionTokens >= 120);
    assert.ok(report.totalTokens >= 165);
    assert.ok(report.byModel['fixture-provider/fixture-chat-model'].totalTokens >= 165);
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
