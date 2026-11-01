/**
 * @fileoverview Phase 10 Acceptance Verification — Web, Search, File & Research Intelligence
 *
 * Verifies:
 * 1. Web search queries with structured citation tracking
 * 2. Safe file read/write and directory scanning
 * 3. CSV tabular data analysis and schema extraction
 * 4. SHA-256 verified artifact production and checksum validation
 * 5. Autonomous multi-step research workflow execution with memory indexing
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ResearchEngine, ARTIFACT_TYPES } from '../packages/research-engine/index.mjs';

const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const WS = globalThis.WebSocket;

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase10-test-runner' }),
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
    pending.set('hs_phase10', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase10',
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

test('Phase 10: Web, Search, File & Research Intelligence Suite', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('10.1 Structured Web Search and Citation Tracking', async () => {
    const res = await client.call('research.search', {
      query: 'Transformer architecture attention mechanism',
      limit: 3,
    });
    assert.equal(res.query, 'Transformer architecture attention mechanism');
    assert.ok(res.totalResults >= 1);
    assert.ok(Array.isArray(res.citations));

    const first = res.citations[0];
    assert.equal(typeof first.citationIndex, 'number');
    assert.ok(first.title);
    assert.ok(first.url);
    assert.ok(first.snippet);
  });

  await suite.test('10.2 Sandboxed File Read, Write, and Directory Scanning', async () => {
    const testFile = 'temp-test-data/phase10-note.txt';
    const content = 'Zero Research Engine test payload content verification.';

    // Write file
    const writeRes = await client.call('research.file.write', {
      path: testFile,
      content,
      overwrite: true,
    });
    assert.ok(writeRes.ok);
    assert.ok(writeRes.bytesWritten > 0);

    // Read back
    const readRes = await client.call('research.file.read', { path: testFile });
    assert.equal(readRes.content, content);
    assert.equal(readRes.truncated, false);

    // List directory
    const listRes = await client.call('research.file.list', {
      path: 'temp-test-data',
      pattern: 'phase10',
    });
    assert.ok(listRes.totalFiles >= 1);
    assert.ok(listRes.files.some((f) => f.name === 'phase10-note.txt'));

    // Cleanup
    try {
      fs.rmSync(path.resolve(process.cwd(), 'temp-test-data'), { recursive: true, force: true });
    } catch (_) {}
  });

  await suite.test('10.3 CSV Tabular Data Analysis and Column Schema Extraction', async () => {
    const engine = new ResearchEngine({ dbPath: ':memory:' });
    try {
      const csvPath = 'temp-csv-test.csv';
      const csvContent = `id,name,role,department\n101,Alice,Architect,AI Systems\n102,Bob,Engineer,Core Runtime\n103,Charlie,Auditor,Security\n`;
      fs.writeFileSync(csvPath, csvContent, 'utf8');

      const analysis = await engine.fileOps.analyzeCsv(csvPath);
      assert.ok(analysis.ok);
      assert.equal(analysis.totalRows, 3);
      assert.equal(analysis.columnsCount, 4);
      assert.deepEqual(analysis.headers, ['id', 'name', 'role', 'department']);
      assert.equal(analysis.previewRows[0].name, 'Alice');
      assert.equal(analysis.previewRows[1].role, 'Engineer');

      fs.unlinkSync(csvPath);
    } finally {
      engine.close();
    }
  });

  await suite.test('10.4 Artifact Production and SHA-256 Checksum Validation', async () => {
    const artifactRes = await client.call('research.artifact.create', {
      taskId: 'task-art-101',
      type: 'report',
      title: 'Neural Network Quantization Benchmarks',
      content: '# Benchmark Results\nThroughput improved by 3.4x with 8-bit weights.\n',
    });

    assert.ok(artifactRes.ok);
    const art = artifactRes.artifact;
    assert.equal(art.type, 'report');
    assert.equal(art.title, 'Neural Network Quantization Benchmarks');
    assert.ok(art.sha256.length === 64, 'SHA-256 must be 64-char hex string');

    // Verify checksum
    const verifyRes = await client.call('research.artifact.verify', { id: art.id });
    assert.ok(verifyRes.ok);
    assert.equal(verifyRes.verified, true);
    assert.equal(verifyRes.currentSha256, art.sha256);
  });

  await suite.test('10.5 Autonomous Multi-Step Research Workflow & Memory Integration', async () => {
    const workflowRes = await client.call('research.workflow.execute', {
      topic: 'DeepSeek R1 reasoning architecture',
      limit: 3,
      taskId: 'deepseek-research-task',
    });

    assert.ok(workflowRes.ok);
    assert.equal(workflowRes.topic, 'DeepSeek R1 reasoning architecture');
    assert.ok(workflowRes.totalSources >= 1);
    assert.ok(workflowRes.artifact.id);
    assert.equal(workflowRes.artifact.verified, true);

    // Verify findings were automatically stored in persistent memory
    const memoryRecall = await client.call('memory.recall', { query: 'DeepSeek R1' });
    assert.ok(memoryRecall.length >= 1, 'Memory must contain indexed research finding');
    assert.match(memoryRecall[0].content, /Research findings for 'DeepSeek R1/);
  });
});
