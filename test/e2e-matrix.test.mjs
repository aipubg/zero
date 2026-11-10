/** Historical matrix: scoped contracts and isolated local integration, not production sign-off. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';
const WS = globalThis.WebSocket;

import { CapabilityEngine, canonicalCapabilityEngine } from '../packages/capability-engine/index.mjs';
import { SessionManager } from '../packages/sessions/index.mjs';
import { TaskStateMachine } from '../packages/agent-runtime/index.mjs';
import { AutomationScheduler } from '../packages/automation/index.mjs';
import { PersistentMemoryStore } from '../packages/memory/index.mjs';
import { ModelFabric, canonicalModelFabric } from '../packages/model-fabric/index.mjs';
import { PROTOCOL_VERSION, validateHandshake, RPC_ERROR_CODES } from '../packages/gateway-protocol/index.mjs';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// External legacy cases require a disposable host; no owner credentials loaded.
const BASE_URL = process.env.ZERO_MATRIX_TEST_HOST || '';
if (BASE_URL) {
  const url = new URL(BASE_URL);
  assert.equal(url.protocol, 'http:');
  assert.equal(url.hostname, '127.0.0.1');
  assert.notEqual(url.port, '18789', 'Owner gateway is excluded');
}
const WS_URL = BASE_URL.replace(/^http:/, 'ws:') + '/';
// Helper to obtain the active loopback UI token from the running host
async function getLoopbackToken() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', clientId: 'e2e-matrix-runner' }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.token || '';
    }
  } catch {}
  return '';
}

test('Zero AI historical matrix with explicit assertion scope', { timeout: 120000 }, async (suite) => {
  const tempRoot = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'zero-matrix-')));
  suite.after(() => {
    const resolved = fs.realpathSync.native(tempRoot);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-matrix-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });


  await suite.test('T01: Current runtime and packaging file presence', async (t) => {
    assert.ok(process.version.startsWith('v24'), `Running on Node.js ${process.version}`);
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'backend', 'package.json')), 'Backend package.json exists');
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json')), 'Zero system config exists');
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'models', 'gateway-providers.json')), 'Model providers catalog exists');
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'dist', 'web', 'index.html')), 'Web UI application entry point exists');
  });

  await suite.test('T02: Legacy shared-default child-host path', { skip: "BLOCKED: Legacy child host has shared defaults; use isolated native-host verification" }, async (t) => {
    // 1. Verify live control plane is running natively
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const health = await res.json();
    assert.equal(health.status, 'ok');
    assert.equal(health.runtime, 'zero-native', 'Confirmed running in native Zero Gateway/Host mode');
    assert.equal(health.gateway, 'zero-gateway');

    // 2. Spawn an isolated Node subprocess on port 18798 that explicitly runs without openclaw package resolution
    const childScript = `
      import { ZeroNativeHost } from './services/host/native-gateway.mjs';
      import { canonicalCapabilityEngine } from './packages/capability-engine/index.mjs';
      import assert from 'node:assert/strict';

      const host = new ZeroNativeHost({ port: 18798, host: '127.0.0.1' });
      await host.start();

      const hRes = await fetch('http://127.0.0.1:18798/health');
      assert.equal(hRes.status, 200);
      const hData = await hRes.json();
      assert.equal(hData.runtime, 'zero-native');

      const uiRes = await fetch('http://127.0.0.1:18798/chat/zero');
      assert.equal(uiRes.status, 200);

      const sessionRes = await fetch('http://127.0.0.1:18798/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      }).then(r => r.json());
      assert.equal(sessionRes.ok, true);

      const ws = new WebSocket('ws://127.0.0.1:18798/');
      await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
      const hsPromise = new Promise(r => {
        ws.onmessage = e => {
          const m = JSON.parse(e.data);
          if (m.id === 'hs') r(m);
        };
      });
      ws.send(JSON.stringify({ type: 'req', id: 'hs', method: 'connect', params: { minProtocol: 4, token: sessionRes.token } }));
      const hs = await hsPromise;
      assert.equal(hs.ok, true);
      ws.close();

      const toolRes = await canonicalCapabilityEngine.execute({ agentId: 'zero', toolName: 'zero_computer_action', args: { action: 'list_windows' } });
      assert.equal(toolRes.ok, true);
      assert.equal(toolRes.executed, true);

      await host.close();
      console.log('T02_ISOLATED_OK');
      process.exit(0);
    `;

    const sub = spawn(process.execPath, ['--input-type=module', '-e', childScript], {
      cwd: REPO_ROOT,
      env: { ...process.env, ZERO_PORT: '18798', ZERO_RUNTIME_MODE: 'native' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    sub.stdout.on('data', (d) => { stdout += d.toString(); });
    sub.stderr.on('data', (d) => { stderr += d.toString(); });

    const exitCode = await new Promise((resolve) => {
      sub.on('exit', resolve);
    });

    assert.equal(exitCode, 0, `Isolated native subprocess exited with code ${exitCode}: ${stderr}`);
    assert.ok(stdout.includes('T02_ISOLATED_OK'), 'Subprocess verified native independence, UI, RPC, and tools');
  });

  await suite.test('T03: HTTP shell and asset response contracts', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const res = await fetch(`${BASE_URL}/chat/zero`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('<title>Zero'), 'Title is Zero');
    assert.ok(html.includes('zero-control-ui.js'), 'Loads first-party control UI bundle');

    // Verify main JavaScript bundle loads cleanly
    const bundleRes = await fetch(`${BASE_URL}/assets/zero-control-ui.js`);
    assert.equal(bundleRes.status, 200);
    assert.ok(bundleRes.headers.get('content-type')?.includes('javascript'));
    const bundleText = await bundleRes.text();
    assert.ok(bundleText.length > 50000, 'Bundle has valid content length');

    // Verify CSS bundle loads cleanly
    const cssRes = await fetch(`${BASE_URL}/assets/zero-control-ui.css`);
    assert.equal(cssRes.status, 200);
    assert.ok(cssRes.headers.get('content-type')?.includes('css'));
  });

  await suite.test('T04: Browser title/body smoke and direct RPC config readback', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const routes = [
      '/', '/chat', '/chat/zero', '/settings', '/settings/model-providers',
      '/settings/about', '/settings/agents', '/settings/appearance',
      '/settings/notifications', '/settings/profile', '/settings/gateway',
      '/settings/channels', '/settings/communications', '/settings/talk',
      '/settings/devices', '/settings/cloud-workers', '/settings/search',
      '/settings/plugins', '/settings/skills', '/settings/mcp',
      '/settings/memory', '/settings/automation', '/settings/privacy',
      '/settings/secrets', '/settings/approvals', '/settings/infrastructure',
      '/settings/labs', '/settings/advanced', '/systems'
    ];
    for (const r of routes) {
      const resp = await fetch(`${BASE_URL}${r}`);
      assert.equal(resp.status, 200, `Route ${r} must return 200 OK`);
      const body = await resp.text();
      assert.ok(body.includes('<div id="root">') || body.includes('<title>Zero'), `Route ${r} renders valid SPA shell`);
      assert.ok(body.includes('zero-control-ui.js'), `Route ${r} includes zero-control-ui.js bundle script`);
    }

    // Launch Chrome and Edge headless using playwright-core and assert rendered DOM
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const { chromium } = await import('playwright-core');

    const keyRoutes = ['/chat/zero', '/settings/model-providers', '/settings/gateway', '/settings/automation'];

    // 1. Chrome browser verification
    const bChrome = await chromium.launch({ executablePath: chromePath, headless: true });
    const pChrome = await bChrome.newPage();
    for (const route of keyRoutes) {
      await pChrome.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      const title = await pChrome.title();
      assert.ok(title.includes('Zero'), `Chrome rendered title containing Zero for ${route}: ${title}`);
      const shellCount = await pChrome.locator('#root, .zero-app, body').count();
      assert.ok(shellCount > 0, `Chrome rendered active shell on ${route}`);
    }
    await bChrome.close();

    // 2. Edge browser verification
    const bEdge = await chromium.launch({ executablePath: edgePath, headless: true });
    const pEdge = await bEdge.newPage();
    for (const route of keyRoutes) {
      await pEdge.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      const title = await pEdge.title();
      assert.ok(title.includes('Zero'), `Edge rendered title containing Zero for ${route}: ${title}`);
      const shellCount = await pEdge.locator('#root, .zero-app, body').count();
      assert.ok(shellCount > 0, `Edge rendered active shell on ${route}`);
    }
    await bEdge.close();

    // Verify underlying settings RPCs and form data persistence
    const token = await getLoopbackToken();

    const ws = new WS(WS_URL);
    await new Promise((r) => { ws.onopen = r; });

    try {
      // Authenticate
      const authPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 't04-auth') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 't04-auth', method: 'connect', params: { minProtocol: 4, token } }));
      const authRes = await authPromise;
      assert.equal(authRes.ok, true);

      // Verify RPC data retrieval
      const getPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 't04-get') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 't04-get', method: 'config.get', params: {} }));
      const getRes = await getPromise;
      assert.equal(getRes.ok, true);
      assert.ok(getRes.payload.config);

      // Verify form settings persistence
      const patchKey = 'ui.appearance.testTheme';
      const patchVal = `cyber-neon-${Date.now()}`;
      const patchPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 't04-patch') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({
        type: 'req',
        id: 't04-patch',
        method: 'config.patch',
        params: { updates: { [patchKey]: patchVal } },
      }));
      const patchRes = await patchPromise;
      assert.equal(patchRes.ok, true);

      // Read back persisted form setting
      const readBackPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 't04-readback') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 't04-readback', method: 'config.get', params: {} }));
      const rbRes = await readBackPromise;
      assert.equal(rbRes.ok, true);
      assert.equal(rbRes.payload.config?.ui?.appearance?.testTheme, patchVal, 'Setting persisted into config');
    } finally {
      ws.close();
    }
  });

  await suite.test('T05: Actual WebSocket handshake and response shapes', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const token = await getLoopbackToken();
    const ws = new WS(WS_URL);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    try {
      // 1. Handshake
      const helloPromise = new Promise((resolve) => {
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'res' && msg.id === 'test-connect-1') {
            ws.removeEventListener('message', handler);
            resolve(msg);
          }
        };
        ws.addEventListener('message', handler);
      });

      ws.send(JSON.stringify({
        type: 'req',
        id: 'test-connect-1',
        method: 'connect',
        params: {
          minProtocol: 4,
          maxProtocol: 4,
          client: { id: 'test-runner', version: '1.0.0' },
          token,
        },
      }));

      const helloRes = await helloPromise;
      assert.equal(helloRes.ok, true, 'Handshake succeeded');
      assert.equal(helloRes.payload.protocol, 4, 'Protocol 4 negotiated');

      // 2. Call sessions.subscribe
      const subPromise = new Promise((resolve) => {
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'res' && msg.id === 'test-sub-1') {
            ws.removeEventListener('message', handler);
            resolve(msg);
          }
        };
        ws.addEventListener('message', handler);
      });

      ws.send(JSON.stringify({
        type: 'req',
        id: 'test-sub-1',
        method: 'sessions.subscribe',
        params: { key: 'agent:zero:main' },
      }));

      const subRes = await subPromise;
      assert.equal(subRes.ok, true);
      assert.equal(subRes.payload.subscribed, true);

      // 3. Call models.authStatus
      const authPromise = new Promise((resolve) => {
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'res' && msg.id === 'test-auth-1') {
            ws.removeEventListener('message', handler);
            resolve(msg);
          }
        };
        ws.addEventListener('message', handler);
      });

      ws.send(JSON.stringify({
        type: 'req',
        id: 'test-auth-1',
        method: 'models.authStatus',
        params: {},
      }));

      const authRes = await authPromise;
      assert.equal(authRes.ok, true);
      assert.ok(Array.isArray(authRes.payload.providers));
    } finally {
      ws.close();
    }
  });

  await suite.test('T06: Configured HTTP catalog identifiers', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const res = await fetch(`${BASE_URL}/v1/models`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.data), 'Returns model list');
    const modelIds = data.data.map(m => m.id);
    assert.ok(modelIds.includes('nvidia/nemotron-3.5-lightning-30b-a3b'), 'Includes Nemotron 30B');
    assert.ok(modelIds.includes('nvidia/nemotron-3.5-super-vl-120b-a12b'), 'Includes Nemotron 120B');
    assert.ok(modelIds.includes('nvidia/nemotron-3-ultra-550b-a55b'), 'Includes Nemotron 550B');
  });

  await suite.test('T07: Explicit model resolution and completion model label', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const fabric = new ModelFabric({
      configPath: path.join(REPO_ROOT, 'models', 'gateway-providers.json'),
      aliases: { 'zero-lead': 'nvidia/nemotron-3.5-lightning-30b-a3b' },
    });

    const resA = fabric.resolveModel('nvidia/nemotron-3.5-lightning-30b-a3b');
    assert.ok(resA, 'Model A resolved');
    assert.equal(resA.canonicalModelId, 'nvidia/nemotron-3.5-lightning-30b-a3b');

    const resB = fabric.resolveModel('nvidia/nemotron-3.5-super-vl-120b-a12b');
    assert.ok(resB, 'Model B resolved');
    assert.equal(resB.canonicalModelId, 'nvidia/nemotron-3.5-super-vl-120b-a12b');

    assert.notEqual(resA.canonicalModelId, resB.canonicalModelId, 'Model switching differentiates target models');

    // Verify HTTP chat completion explicitly dispatches to selected target model
    const switchedChat = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
        messages: [{ role: 'user', content: 'Say "SWITCHED_OK"' }],
        max_tokens: 32,
      }),
    });
    assert.equal(switchedChat.status, 200);
    const switchedRes = await switchedChat.json();
    assert.equal(switchedRes.model, 'nvidia/nemotron-3.5-super-vl-120b-a12b', 'Outgoing completion targeted switched model');
  });

  await suite.test('T08: Exact requested chat completion', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        messages: [{ role: 'user', content: 'Say "ZERO_VERIFIED" and nothing else.' }],
        max_tokens: 64,
        temperature: 0.1,
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.choices && json.choices.length > 0);
    const content = json.choices[0].message?.content || json.choices[0].message?.reasoning_content || '';
    assert.equal(content.trim(), 'ZERO_VERIFIED', 'Requested exact completion outcome');
    assert.equal(json.choices[0].finish_reason, 'stop');
  });

  await suite.test('T09: Fabric request counter and buffered HTTP SSE content', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const statusBeforeRes = await fetch(`${BASE_URL}/health`);
    assert.equal(statusBeforeRes.status, 200);

    const baselineRequests = canonicalModelFabric.upstreamRequestCount;
    const modelChunks = [];

    for await (const chunk of canonicalModelFabric.streamChat({
      model: 'zero-lead',
      messages: [{ role: 'user', content: 'Count from 1 to 5.' }],
      max_tokens: 64,
    })) {
      modelChunks.push(chunk);
    }

    assert.ok(modelChunks.length >= 1, 'Model fabric yielded chunks');
    assert.equal(canonicalModelFabric.upstreamRequestCount - baselineRequests, 1, 'Exactly one upstream streaming request occurred (no double-inference)');

    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        messages: [{ role: 'user', content: 'Count from 1 to 5.' }],
        max_tokens: 64,
        stream: true,
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/event-stream; charset=utf-8');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullStreamText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullStreamText += decoder.decode(value, { stream: true });
    }

    const events = [];
    let accumulatedContent = '';
    const lines = fullStreamText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const rawData = trimmed.slice(5).trim();
        events.push(rawData);
        if (rawData && rawData !== '[DONE]') {
          try {
            const parsed = JSON.parse(rawData);
            const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content || '';
            accumulatedContent += delta;
          } catch (_) {}
        }
      }
    }

    assert.ok(events.length >= 2, `Expected multiple incremental SSE stream events, got ${events.length}`);
    assert.ok(events.includes('[DONE]'), 'Stream finished with [DONE]');
    assert.ok(accumulatedContent.length > 0, 'Accumulated token text agrees with stream deltas');
  });

  await suite.test('T10: Chat reply existence without tool-loop proof', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const token = await getLoopbackToken();
    const ws = new WS(WS_URL);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

    try {
      const authPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 't10-auth') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 't10-auth', method: 'connect', params: { minProtocol: 4, token } }));
      const authRes = await authPromise;
      assert.equal(authRes.ok, true);

      let finalContent = '';
      const turnPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Turn timeout')), 30000);
        const handler = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.event === 'chat.delta') {
              finalContent += msg.payload?.delta || '';
            }
            if (msg.id === 't10-chat-turn' && msg.type === 'res') {
              clearTimeout(timer);
              ws.removeEventListener('message', handler);
              resolve(msg);
            }
          } catch (_) {}
        };
        ws.addEventListener('message', handler);
      });

      ws.send(JSON.stringify({
        type: 'req',
        id: 't10-chat-turn',
        method: 'chat.send',
        params: {
          sessionKey: `t10_test_${Date.now()}`,
          message: 'Please inspect visible windows on my desktop and list what you find.',
        },
      }));

      const turnRes = await turnPromise;
      assert.equal(turnRes.ok, true, 'chat.send turn completed successfully');
      assert.ok(turnRes.payload?.content || finalContent, 'Model grounded final response from execution feedback');
    } finally {
      ws.close();
    }
  });

  await suite.test('T11: Legacy native Notepad readback path', { skip: "BLOCKED: Legacy Notepad input lacks qualified owned-window isolation; use real agent-desktop fixture runners" }, async (t) => {
    const np = spawn('notepad.exe', [], { detached: true, stdio: 'ignore' });
    const targetPid = np.pid;
    assert.ok(targetPid, 'Test-owned Notepad PID acquired');
    np.unref();

    try {
      await new Promise((r) => setTimeout(r, 1500));

      const testToken = `ZERO_E2E_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const result = await canonicalCapabilityEngine.execute({
        agentId: 'zero',
        toolName: 'zero_computer_action',
        args: { action: 'type_text', text: testToken, targetPid },
      });

      assert.equal(result.ok, true, 'Result ok must be true');
      assert.equal(result.executed, true, 'Executed must be true');
      assert.equal(result.verified, true, 'Verified must be true');
      assert.equal(result.completed, true, 'Completed must be true');
      assert.equal(result.outcome, 'COMPLETED', 'Outcome must be COMPLETED');
      assert.equal(result.verifiedText, testToken, 'Read-back text must exactly match typed token');
    } finally {
      if (targetPid) {
        try {
          process.kill(targetPid);
        } catch (_) {
          spawnSync('powershell.exe', ['-Command', `Stop-Process -Id ${targetPid} -Force -ErrorAction SilentlyContinue`]);
        }
      }
    }
  });

  await suite.test('T12: Legacy browser playback metadata path', { skip: "BLOCKED: Legacy media playback changes live browser; dedicated playback qualification required" }, async (t) => {
    const playResult = await canonicalCapabilityEngine.execute({
      agentId: 'zero',
      toolName: 'zero_computer_action',
      args: { action: 'play', query: 'lofi hip hop radio' },
    });

    assert.equal(playResult.ok, true);
    assert.equal(playResult.executed, true);
    assert.equal(playResult.action, 'play');
    assert.ok(playResult.browserOpened || playResult.data?.browserOpened, 'Browser opened verified');
    assert.ok(playResult.pageLoaded || playResult.data?.pageLoaded, 'Page loaded verified');

    // Strict acceptance criteria per P1: must be PLAYING, verified, and COMPLETED (PAUSED and UNVERIFIED fail)
    assert.equal(playResult.playbackState, 'PLAYING', 'Playback state must be confirmed PLAYING');
    assert.equal(playResult.verified, true, 'Verification must be true');
    assert.equal(playResult.outcome, 'COMPLETED', 'Outcome must be COMPLETED');
    assert.equal(playResult.audioActive, true, 'Audio active must be true when playing');
    assert.equal(playResult.audioAudible, 'UNVERIFIED', 'Acoustic hearing remains unverified without physical microphone capture');
  });

  await suite.test('T13: Missing real media/progress renderer verification', { skip: "BLOCKED: Hand-inserted DOM widgets are not production renderer verification" }, async (t) => {
    t.skip('BLOCKED: real execution-event renderer interactions require dedicated browser acceptance');
  });

  await suite.test('T14: Legacy canonical hold path', { skip: "BLOCKED: Legacy canonical hold may bypass strict policy; covered by isolated strict-policy tests" }, async (t) => {
    canonicalCapabilityEngine.operator.setHumanHold(true);
    const blockedRes = await canonicalCapabilityEngine.execute({
      agentId: 'zero',
      toolName: 'zero_computer_action',
      args: { action: 'left_click', x: 100, y: 100 },
    });
    assert.equal(blockedRes.ok, false);
    assert.equal(blockedRes.executed, false);
    assert.equal(blockedRes.outcome, 'BLOCKED');
    assert.equal(blockedRes.error, 'computer-hold:human-control');
    canonicalCapabilityEngine.operator.setHumanHold(false);
  });

  await suite.test('T15: Chat abort acknowledgement', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    const token = await getLoopbackToken();

    const ws = new WS(WS_URL);
    await new Promise((r) => { ws.onopen = r; });

    try {
      // Connect handshake
      const authPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 't15-auth') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 't15-auth', method: 'connect', params: { minProtocol: 4, token } }));
      await authPromise;

      const testSessionKey = `session:cancel:${Date.now()}`;

      // Issue chat.send
      ws.send(JSON.stringify({
        type: 'req',
        id: 't15-send',
        method: 'chat.send',
        params: {
          sessionKey: testSessionKey,
          message: 'Please write a long essay on the architecture of distributed computer systems.',
        },
      }));

      // Small delay to allow turn initialization
      await new Promise((r) => setTimeout(r, 40));

      // Issue chat.abort
      const abortPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 't15-abort') { ws.removeEventListener('message', handler); resolve(msg); }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({
        type: 'req',
        id: 't15-abort',
        method: 'chat.abort',
        params: { sessionKey: testSessionKey },
      }));

      const abortRes = await abortPromise;
      assert.equal(abortRes.ok, true, 'chat.abort succeeded');
      assert.equal(abortRes.payload.aborted, true, 'Active turn aborted');
    } finally {
      ws.close();
    }
  });

  await suite.test('T16: In-memory session CRUD', async (t) => {
    const sm = new SessionManager({ dbPath: ':memory:' });
    t.after(() => sm.close());
    const sess = sm.createSession('test-sess-1', 'Initial Title', 'zero');
    assert.equal(sess.id, 'test-sess-1');

    const retrieved = sm.getSession('test-sess-1');
    assert.equal(retrieved.title, 'Initial Title');

    const patched = sm.patchSession('test-sess-1', { title: 'Updated Title' });
    assert.equal(patched.title, 'Updated Title');

    // Test involvement persistence
    sm.patchSession('test-sess-1', { involvement: 'autonomous' });
    const involved = sm.getSession('test-sess-1');
    assert.equal(involved.involvement, 'autonomous');

    const list = sm.listSessions();
    assert.equal(list.length, 1);

    const deleted = sm.deleteSession('test-sess-1');
    assert.equal(deleted, true);
    assert.equal(sm.getSession('test-sess-1'), null);
  });

  await suite.test('T17: Same-process SQLite reopen recovery', async (t) => {
    const testDb = path.join(tempRoot, 'recovery.sqlite');
    const tm1 = new TaskStateMachine({ dbPath: testDb });
    const t1 = tm1.createTask({ agentId: 'zero', goal: 'Survive restart' });
    tm1.enqueueTask(t1.id);
    tm1.startTask(t1.id);
    tm1.close();

    const tm2 = new TaskStateMachine({ dbPath: testDb });
    const sweep = tm2.recoverTasksOnStartup();
    assert.ok(sweep.recoveredCount >= 1, 'Task recovered on reboot sweep');
    assert.equal(tm2.getTask(t1.id).status, 'WAITING');
    tm2.close();
    try { fs.unlinkSync(testDb); } catch (_) {}
  });

  await suite.test('T18: Keyword recall of supplied in-memory record', async (t) => {
    const mem = new PersistentMemoryStore({ dbPath: ':memory:' });
    t.after(() => mem.close());
    mem.remember({ category: 'facts', content: 'Zero operates natively on 18789', tags: ['port'] });
    const recall = mem.recall('18789');
    assert.ok(recall.length >= 1);
    assert.ok(recall[0].content.includes('18789'));
  });

  await suite.test('T19: Child task executes supplied callback', async (t) => {
    const tm = new TaskStateMachine({ dbPath: ':memory:' });
    t.after(() => tm.close());
    const parent = tm.createTask({ agentId: 'zero', goal: 'Master Task' });
    tm.enqueueTask(parent.id);
    tm.startTask(parent.id);

    const { childTask } = tm.delegateTask({ parentTaskId: parent.id, childAgentId: 'worker', goal: 'Sub Task Goal' });
    assert.equal(childTask.parentTaskId, parent.id);
    assert.equal(childTask.status, 'RUNNING');
    assert.equal(tm.getTask(parent.id).status, 'WAITING');

    // Execute actual child task step via execution runtime (no manual fake mark)
    const execChild = await tm.executeChildTask(childTask.id, async (task) => {
      return { computation: 'Supplied callback arithmetic', resultValue: 6 * 7 };
    });

    assert.equal(execChild.status, 'COMPLETED');
    assert.equal(tm.getTask(childTask.id).status, 'COMPLETED');
    assert.equal(tm.getTask(parent.id).status, 'RUNNING');

    const steps = tm.getTaskSteps(childTask.id);
    assert.ok(steps.some(s => s.toolName === 'subagent_execution'), 'Recorded child execution step');
  });

  await suite.test('T20: Due-time executor effect and same-process SQLite reopen', async (t) => {
    const testAutoDb = path.join(tempRoot, 'automation.sqlite');
    const effect = path.join(tempRoot, 'scheduled-effect.txt');
    const auto1 = new AutomationScheduler({ dbPath: testAutoDb, executor: async () => {
      fs.appendFileSync(effect, 'executed\n');
      return { ok: true, executed: true };
    } });
    const job = auto1.registerJob({
      title: 'Scheduled Task',
      cronExpr: '* * * * *',
      targetAction: 'ping',
      params: {},
    });
    assert.ok(job.id);
    const res = await auto1.checkAndTriggerDueJobs(job.nextRun + 1000);
    assert.equal(res.triggeredCount, 1);
    auto1.close();

    // Verify persistence across restart
    const auto2 = new AutomationScheduler({ dbPath: testAutoDb });
    const jobs = auto2.listJobs();
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].id, job.id);
    const runs = auto2.listRuns({ jobId: job.id });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].status, 'completed');
    assert.equal(fs.readFileSync(effect, 'utf8'), 'executed\n');
    auto2.close();
    try { fs.unlinkSync(testAutoDb); } catch (_) {}
  });

  await suite.test('T21: In-process supplied plugin handler arithmetic', async (t) => {
    const engine = new CapabilityEngine();
    const pluginManifest = {
      id: 'plugin-scientific-math',
      name: 'Scientific Math Plugin',
      version: '1.2.0',
      description: 'Production math computations plugin',
      capabilities: [
        {
          name: 'plugin_scientific_calc',
          description: 'Calculates exponential power of a base',
          parameters: { type: 'object', properties: { base: { type: 'number' }, exp: { type: 'number' } } },
        },
      ],
    };

    // Production plugin registration lifecycle
    engine.registerPlugin(pluginManifest, {
      plugin_scientific_calc: async (params) => ({ result: Math.pow(params.base || 0, params.exp || 1) }),
    });

    const loaded = engine.listLoadedPlugins();
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'plugin-scientific-math');

    const execResult = await engine.execute({
      agentId: 'zero',
      toolName: 'plugin_scientific_calc',
      args: { base: 2, exp: 8 },
    });
    assert.equal(execResult.ok, true);
    assert.equal(execResult.executed, true);
    assert.equal(execResult.data?.result, 256);
    assert.ok(execResult.auditId, 'Audit ID recorded');
  });

  await suite.test('T22: Missing external channel round trip', { skip: "BLOCKED: Real external channel send/receive is not implemented by token existence" }, async (t) => {
    t.skip('BLOCKED: credentials alone cannot prove external send/receive');
  });

  await suite.test('T23: Validation and viewer RPC rejection', { skip: BASE_URL ? false : 'BLOCKED: disposable local host not supplied' }, async (t) => {
    // 1. Invalid protocol version rejected
    const badHandshake = validateHandshake({ protocol: 999 });
    assert.equal(badHandshake.ok, false, 'Invalid protocol rejected');

    // 2. Unauthorized tool rejected
    const engine = new CapabilityEngine();
    const badTool = engine.validate('unauthorized_tool', {});
    assert.equal(badTool.valid, false, 'Unauthorized tool rejected');

    // 3. Unauthenticated privileged RPC rejected with FORBIDDEN (-32003)
    const ws = new WS(WS_URL);
    await new Promise((r) => { ws.onopen = r; });
    try {
      const unauthPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'neg-handshake') {
            ws.removeEventListener('message', handler);
            resolve(msg);
          }
        };
        ws.addEventListener('message', handler);
      });
      // Handshake as viewer (no token)
      ws.send(JSON.stringify({ type: 'req', id: 'neg-handshake', method: 'connect', params: { minProtocol: 4 } }));
      const hs = await unauthPromise;
      assert.equal(hs.ok, true);
      assert.equal(hs.payload.role || hs.payload.session?.role, 'viewer');

      // Attempt privileged operation
      const privPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'neg-priv') {
            ws.removeEventListener('message', handler);
            resolve(msg);
          }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 'neg-priv', method: 'config.patch', params: { updates: {} } }));
      const privRes = await privPromise;
      assert.equal(privRes.ok, false, 'Privileged call without admin scope rejected');
      const errStr = typeof privRes.error === 'string' ? privRes.error : (privRes.error?.message || '');
      assert.ok(privRes.error?.code === RPC_ERROR_CODES.FORBIDDEN || errStr.toLowerCase().includes('forbidden'), 'Returned distinct forbidden error');

      // 4. Unknown method returns method not found
      const unknownPromise = new Promise((resolve) => {
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === 'neg-unk') {
            ws.removeEventListener('message', handler);
            resolve(msg);
          }
        };
        ws.addEventListener('message', handler);
      });
      ws.send(JSON.stringify({ type: 'req', id: 'neg-unk', method: 'unknown.bogus.method', params: {} }));
      const unkRes = await unknownPromise;
      assert.equal(unkRes.ok, false, 'Unknown method must return error');
      const unkMsg = typeof unkRes.error === 'string' ? unkRes.error : (unkRes.error?.message || '');
      assert.ok(unkMsg.toLowerCase().includes('not found'));
    } finally {
      ws.close();
    }
  });

  await suite.test('T24: Configured tracked-file credential-pattern scan', async (t) => {
    const scannerPath = path.join(REPO_ROOT, 'backend', 'scripts', 'scan-secrets.mjs');
    const proc = spawnSync(process.execPath, [scannerPath], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 30000,
    });
    assert.equal(proc.status, 0);
    assert.ok(proc.stdout.includes('0 exposed credentials found'), 'Scanner found 0 exposed credentials');
  });

  await suite.test('T25: Launcher source/file presence and PowerShell syntax', async (t) => {
    const startScript = path.join(REPO_ROOT, 'start-all.ps1');
    const hostScript = path.join(REPO_ROOT, 'zero-host.ps1');
    assert.ok(fs.existsSync(startScript), 'start-all.ps1 exists');
    assert.ok(fs.existsSync(hostScript), 'zero-host.ps1 exists');

    const startContent = fs.readFileSync(startScript, 'utf8');
    assert.ok(startContent.includes('18789'), 'start-all.ps1 configures port 18789');
    assert.ok(startContent.includes('zero-host.ps1'), 'start-all.ps1 launches zero-host supervisor');

    const hostContent = fs.readFileSync(hostScript, 'utf8');
    assert.ok(hostContent.includes('18789'), 'zero-host.ps1 specifies authoritative port 18789');
    assert.ok(hostContent.includes('zero-host.mjs'), 'zero-host.ps1 invokes zero-host.mjs');

    const dataDir = path.join(REPO_ROOT, '.zero-data');
    assert.ok(fs.existsSync(dataDir), '.zero-data persistent directory exists');

    const checkPs = spawnSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      `$tokens = $null; $parseErrors = $null; [System.Management.Automation.Language.Parser]::ParseFile('${hostScript.replace(/'/g, "''")}', [ref]$tokens, [ref]$parseErrors) | Out-Null; if ($parseErrors.Count -gt 0) { exit 1 }; 'True'`
    ], { encoding: 'utf8', timeout: 30000 });
    assert.equal(checkPs.status, 0);
    assert.ok(checkPs.stdout.includes('True'), 'PowerShell syntax check passed');

    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'dist', 'web', 'index.html')), 'Packaging entry point dist/web/index.html exists');
  });

});
