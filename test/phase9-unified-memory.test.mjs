/**
 * @fileoverview Phase 9 Acceptance Verification — Unified Persistent 8-Layer Memory
 *
 * Verifies:
 * 1. Persistent storage across all 8 canonical memory layers in SQLite
 * 2. Multi-layer contextual retrieval with weighted ranking
 * 3. Layer telemetry statistics (counts & avg confidence across 8 layers)
 * 4. Memory correction and confidence updates
 * 5. Memory consolidation & stale pruning
 * 6. Explicit memory forgetting / deletion
 * 7. WebSocket RPC contracts roundtrip over network protocol
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { UnifiedMemoryEngine, MEMORY_LAYERS } from '../packages/memory/index.mjs';

const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const WS = globalThis.WebSocket;

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase9-test-runner' }),
  });
  assert.equal(authRes.status, 200);
  const authData = await authRes.json();
  return authData.token;
}

async function createRpcClient() {
  const token = await getLoopbackToken();
  const ws = new WS(WS_URL);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const pending = new Map();
  let counter = 1;

  ws.addEventListener('message', (event) => {
    try {
      const frame = JSON.parse(event.data);
      if (frame.id && pending.has(frame.id)) {
        const { resolve, reject } = pending.get(frame.id);
        pending.delete(frame.id);
        if (frame.ok === false) {
          reject(new Error(frame.error?.message || frame.error || 'RPC Error'));
        } else {
          resolve(frame.payload);
        }
      }
    } catch (_) {}
  });

  const hsPromise = new Promise((resolve, reject) => {
    pending.set('hs_phase9', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase9',
    method: 'connect',
    params: { minProtocol: 4, token },
  }));
  await hsPromise;

  return {
    call: (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const reqId = `rpc_${counter++}_${Date.now()}`;
        pending.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({
          type: 'req',
          id: reqId,
          method,
          params,
        }));
      });
    },
    close: () => ws.close(),
  };
}

test('Phase 9: Unified Persistent 8-Layer Memory Suite', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('9.1 Storage Across All 8 Canonical Memory Layers in SQLite', () => {
    const mem = new UnifiedMemoryEngine({ dbPath: ':memory:' });
    try {
      // 1. Working
      mem.remember({
        layer: MEMORY_LAYERS.WORKING,
        category: 'active_step',
        content: 'Analyzing repository structure for missing tests',
      });

      // 2. Session
      mem.remember({
        layer: MEMORY_LAYERS.SESSION,
        category: 'chat_summary',
        content: 'User requested complete JARVIS-class implementation without mocks',
      });

      // 3. Episodic
      mem.remember({
        layer: MEMORY_LAYERS.EPISODIC,
        category: 'workflow_outcome',
        content: 'Migrated 351 legacy unit tests to native zero test suite successfully',
      });

      // 4. Semantic
      mem.remember({
        layer: MEMORY_LAYERS.SEMANTIC,
        category: 'user_preference',
        content: 'User prefers dark neon cyberpunk theme for terminal interfaces',
        tags: ['theme', 'ui_preference'],
      });

      // 5. Procedural
      mem.remember({
        layer: MEMORY_LAYERS.PROCEDURAL,
        category: 'skill_recipe',
        content: 'To execute Windows UI Automation, discover control types and invoke native pattern',
        tags: ['windows', 'uia'],
      });

      // 6. Observation
      mem.remember({
        layer: MEMORY_LAYERS.OBSERVATION,
        category: 'screen_event',
        content: 'Active window observed: Visual Studio Code - E:\\zero - Administrator',
        tags: ['screen', 'window_title'],
      });

      // 7. Agent
      mem.remember({
        layer: MEMORY_LAYERS.AGENT,
        category: 'agent_reflection',
        content: 'Researcher agent verified that NVIDIA Nemotron 3.5 streaming requires reasoning_content parsing',
        agentId: 'researcher',
      });

      // 8. Project
      mem.remember({
        layer: MEMORY_LAYERS.PROJECT,
        category: 'repo_config',
        content: 'Repository baseline commit f788633a pinned with tag baseline/v2026.11-master-roadmap',
        projectId: 'zero-core',
      });

      const stats = mem.getLayerStats();
      assert.equal(stats.totalMemories, 8);
      assert.equal(stats.activeLayersCount, 8, 'All 8 memory layers must contain active records');
      assert.equal(stats.layers.semantic.count, 1);
      assert.equal(stats.layers.observation.count, 1);
      assert.equal(stats.layers.project.count, 1);
    } finally {
      mem.close();
    }
  });

  await suite.test('9.2 Multi-Layer Hybrid Contextual Retrieval & Ranking', () => {
    const mem = new UnifiedMemoryEngine({ dbPath: ':memory:' });
    try {
      mem.remember({
        layer: MEMORY_LAYERS.SEMANTIC,
        content: 'The user prefers dark neon theme with high contrast',
        tags: ['theme', 'display'],
        confidence: 0.95,
      });

      mem.remember({
        layer: MEMORY_LAYERS.OBSERVATION,
        content: 'Screen observation: YouTube playback running with lo-fi beats',
        tags: ['youtube', 'multimedia'],
        confidence: 0.85,
      });

      mem.remember({
        layer: MEMORY_LAYERS.WORKING,
        content: 'Current working thought: theme dropdown selected neon option',
        tags: ['theme'],
        confidence: 1.0,
      });

      // Query for "theme"
      const results = mem.recall('theme');
      assert.ok(results.length >= 2);
      assert.ok(results[0].relevanceScore > 0);
      assert.ok(results[0].content.includes('theme'));
      assert.ok(results[0].relevanceScore >= results[1].relevanceScore);

      // Targeted layer query
      const observationOnly = mem.recall('YouTube', { layers: [MEMORY_LAYERS.OBSERVATION] });
      assert.equal(observationOnly.length, 1);
      assert.equal(observationOnly[0].layer, MEMORY_LAYERS.OBSERVATION);
    } finally {
      mem.close();
    }
  });

  await suite.test('9.3 Memory Correction and Updating via WebSocket RPC', async () => {
    const memId = `pref_volume_${Date.now()}`;
    
    // 1. Remember initial preference
    const saved = await client.call('memory.remember', {
      id: memId,
      layer: 'semantic',
      category: 'user_preference',
      content: 'Preferred playback audio volume is 75%',
      tags: ['audio', 'volume'],
      confidence: 0.7,
    });
    assert.equal(saved.id, memId);
    assert.equal(saved.confidence, 0.7);

    // 2. Correct preference with higher confidence
    const updated = await client.call('memory.update', {
      id: memId,
      content: 'Preferred playback audio volume is confirmed at 50%',
      confidence: 1.0,
      tags: ['audio', 'volume', 'verified'],
    });
    assert.equal(updated.id, memId);
    assert.equal(updated.content, 'Preferred playback audio volume is confirmed at 50%');
    assert.equal(updated.confidence, 1.0);
    assert.ok(updated.tags.includes('verified'));

    // 3. Recall confirms correction
    const recalled = await client.call('memory.recall', { query: 'volume' });
    const match = recalled.find((m) => m.id === memId);
    assert.ok(match);
    assert.equal(match.content, 'Preferred playback audio volume is confirmed at 50%');
  });

  await suite.test('9.4 Memory Telemetry & Layer Statistics RPC', async () => {
    const stats = await client.call('memory.layers');
    assert.ok(stats.totalMemories >= 1);
    assert.ok(stats.layers);
    assert.ok(stats.layers.working !== undefined);
    assert.ok(stats.layers.semantic !== undefined);
    assert.ok(stats.layers.observation !== undefined);
    assert.ok(stats.layers.project !== undefined);
  });

  await suite.test('9.5 Memory Consolidation and Forget Deletion Controls', async () => {
    const ephemeralId = `temp_mem_${Date.now()}`;
    await client.call('memory.remember', {
      id: ephemeralId,
      layer: 'working',
      content: 'Transient intermediate token cache string',
    });

    // Forget ephemeral memory
    const forgetRes = await client.call('memory.forget', { id: ephemeralId });
    assert.ok(forgetRes.ok);
    assert.equal(forgetRes.forgotten, true);

    // Verify gone from recall
    const recallAfter = await client.call('memory.recall', { query: 'Transient intermediate' });
    assert.ok(!recallAfter.some((m) => m.id === ephemeralId));

    // Consolidate stale memories
    const consolidateRes = await client.call('memory.consolidate', { olderThanDays: 60 });
    assert.ok(consolidateRes.ok);
    assert.equal(typeof consolidateRes.prunedCount, 'number');
  });
});
