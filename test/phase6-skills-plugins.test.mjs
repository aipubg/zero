/**
 * @fileoverview Phase 6 Acceptance Verification — Skills & Plugins Ecosystem
 *
 * Verifies:
 * 1. Skill discovery and parsing of canonical SKILL.md packages
 * 2. Skill trigger matching against user prompts
 * 3. Dynamic programmatic skill creation and instant discovery
 * 4. Plugin installation with custom capabilities and permissions
 * 5. Dynamic plugin capability execution through CapabilityEngine
 * 6. Plugin lifecycle: enable, disable, and diagnostics reporting
 * 7. Clean uninstallation and capability deregistration
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const WS = globalThis.WebSocket;

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase6-test-runner' }),
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
          console.error('[RPC Error Frame]:', JSON.stringify(frame));
          reject(new Error(frame.error?.message || JSON.stringify(frame.error) || 'RPC Error'));
        } else {
          resolve(frame.payload);
        }
      }
    } catch (_) {}
  });

  const hsPromise = new Promise((resolve, reject) => {
    pending.set('hs_phase6', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase6',
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

test('Phase 6: Skills & Plugins Ecosystem Suite', async (suite) => {
  let client;

  suite.before(async () => {
    client = await createRpcClient();
  });

  suite.after(() => {
    if (client) client.close();
  });

  await suite.test('6.1 Skill Discovery & Parsing of Installed SKILL.md Packages', async () => {
    const res = await client.call('skills.list');
    assert.ok(res.ok);
    assert.ok(Array.isArray(res.skills));
    assert.ok(res.skills.length >= 8, `Expected at least 8 native skills, found ${res.skills.length}`);

    const names = res.skills.map((s) => s.name);
    assert.ok(names.includes('browser-control'));
    assert.ok(names.includes('web-research'));
    assert.ok(names.includes('code-refactoring'));
    assert.ok(names.includes('system-ops'));

    // Get specific skill details
    const skillDetail = await client.call('skills.get', { name: 'web-research' });
    assert.ok(skillDetail.ok);
    assert.equal(skillDetail.skill.name, 'web-research');
    assert.ok(skillDetail.skill.capabilities.length > 0);
  });

  await suite.test('6.2 Natural Language Skill Trigger Matching', async () => {
    const matchRes = await client.call('skills.match', {
      prompt: 'Please search the web for latest quantum computing papers',
    });

    assert.ok(matchRes.ok);
    assert.ok(matchRes.match, 'Should find matching skill');
    assert.equal(matchRes.match.skill.name, 'web-research');
    assert.ok(matchRes.match.score > 0);
  });

  await suite.test('6.3 Dynamic Skill Package Creation and Hot Discovery', async () => {
    const dynamicSkillName = `test-crypto-analyzer-${Date.now()}`;
    const createRes = await client.call('skills.create', {
      name: dynamicSkillName,
      description: 'Analyze cryptocurrency market order books and transaction velocity',
      triggers: ['crypto analyze', 'order book check', 'btc velocity'],
      capabilities: ['Fetch live order book depth', 'Compute slippage metrics'],
      workflowSteps: ['Query exchange API', 'Filter depth table', 'Synthesize report'],
    });

    assert.ok(createRes.ok);
    assert.equal(createRes.name, dynamicSkillName);
    assert.ok(fs.existsSync(createRes.path));

    // Verify it is immediately discovered in skills.list
    const updatedList = await client.call('skills.list');
    const found = updatedList.skills.find((s) => s.name === dynamicSkillName);
    assert.ok(found, 'Newly created skill must be instantly discoverable');
    assert.ok(found.triggers.includes('crypto analyze'));

    // Cleanup generated skill folder
    try {
      fs.rmSync(path.dirname(createRes.path), { recursive: true, force: true });
    } catch (_) {}
  });

  await suite.test('6.4 Dynamic Plugin Installation, Tool Registration & Execution', async () => {
    const testPluginId = `custom-math-optimizer-${Date.now()}`;
    const manifest = {
      id: testPluginId,
      name: 'Custom Math Optimizer',
      version: '1.2.0',
      description: 'Provides high-speed mathematical matrix computations',
      permissions: ['math_compute'],
      capabilities: [
        {
          name: 'compute_matrix_dot_product',
          description: 'Calculates dot product of two numerical arrays',
          parameters: {
            type: 'object',
            properties: {
              a: { type: 'array' },
              b: { type: 'array' },
            },
          },
        },
      ],
      config: { precision: 'float64' },
    };

    // Handlers mapped to capability name
    const installRes = await client.call('plugins.install', {
      manifest,
      handlers: {
        compute_matrix_dot_product: async (params) => {
          const a = params.a || [1, 2, 3];
          const b = params.b || [4, 5, 6];
          const dot = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
          return { ok: true, dotProduct: dot, dimension: a.length };
        },
      },
    });

    assert.ok(installRes.ok);
    assert.equal(installRes.plugin.id, testPluginId);
    assert.equal(installRes.plugin.status, 'enabled');
    assert.ok(installRes.plugin.capabilities.includes('compute_matrix_dot_product'));

    // Execute plugin tool via zero.computer.control
    const execRes = await client.call('zero.computer.control', {
      action: 'compute_matrix_dot_product',
      a: [2, 3],
      b: [4, 5],
    });
    assert.ok(execRes.ok);
    assert.equal(execRes.status, 'executed');
    assert.equal(execRes.pluginId, testPluginId);
    assert.deepEqual(execRes.a, [2, 3]);

    // Verify diagnostics report
    const diag = await client.call('plugins.diagnostics');
    assert.ok(diag.ok);
    assert.ok(diag.totalInstalled >= 1);
    assert.ok(diag.capabilities.includes('compute_matrix_dot_product'));

    // Disable plugin
    const disableRes = await client.call('plugins.disable', { pluginId: testPluginId });
    assert.ok(disableRes.ok);
    assert.equal(disableRes.plugin.status, 'disabled');

    // Executing disabled capability should be blocked with rejection
    await assert.rejects(
      async () => {
        await client.call('zero.computer.control', {
          action: 'compute_matrix_dot_product',
        });
      },
      /capability-disabled/
    );

    // Re-enable plugin
    const enableRes = await client.call('plugins.enable', { pluginId: testPluginId });
    assert.ok(enableRes.ok);
    assert.equal(enableRes.plugin.status, 'enabled');

    // Clean uninstall
    const uninstallRes = await client.call('plugins.uninstall', { pluginId: testPluginId });
    assert.ok(uninstallRes.ok);
    assert.equal(uninstallRes.uninstalled, testPluginId);

    // Verify removed from list
    const finalList = await client.call('plugins.list');
    assert.ok(!finalList.plugins.some((p) => p.id === testPluginId));
  });
});
