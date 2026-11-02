/** REAL_BROWSER + INTEGRATION: isolated native host, existing UI, persisted effects. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-functional-browser-'));
const evidence = path.join(root, 'artifacts', 'functional-browser', String(Date.now()));
fs.mkdirSync(evidence, { recursive: true });
fs.cpSync(path.join(root, 'skills'), path.join(temporary, 'skills'), { recursive: true });
fs.copyFileSync(path.join(root, 'zero-system/config/zero.json'), path.join(temporary, 'config.json'));
const listener = net.createServer();
listener.listen(0, '127.0.0.1');
await once(listener, 'listening');
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;
const report = { classification: ['REAL_BROWSER', 'INTEGRATION', 'REAL_EXTERNAL', ...(process.argv.some(arg => ['--devices', '--screen'].includes(arg)) ? ['REAL_OS'] : [])], startedAt: new Date().toISOString(), status: 'RUNNING', evidence, checks: [] };
let child, browser, page;
const errors = [];

async function start() {
  child = spawn(process.execPath, [path.join(root, 'backend/server/zero-host.mjs')], {
    cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ZERO_PORT: String(port), ZERO_DATA_DIR: path.join(temporary, 'data'),
      ZERO_PREFS_PATH: path.join(temporary, 'prefs.json'), ZERO_SKILLS_DIR: path.join(temporary, 'skills'),
      OPENCLAW_CONFIG_PATH: path.join(temporary, 'config.json') },
  });
  child.stderr.on('data', data => errors.push(String(data)));
  child.stdout.resume();
  const until = Date.now() + 30000;
  while (Date.now() < until) {
    if (child.exitCode !== null) throw new Error(`Test host exited (${child.exitCode}): ${errors.join('').slice(-1200)}`);
    try { const response = await fetch(`${base}/health`); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Test host readiness timed out');
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}
async function rpc(method, params = {}) {
  const response = await fetch(`${base}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin', clientId: 'functional-browser-check' }) });
  assert.equal(response.status, 200);
  const { token } = await response.json();
  const socket = new WebSocket(base.replace('http:', 'ws:'));
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const call = (method, params) => new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timeout = setTimeout(() => { socket.removeEventListener('message', handler); reject(new Error(`${method} timed out`)); }, 20000);
    const handler = event => { const frame = JSON.parse(event.data); if (frame.id !== id) return; clearTimeout(timeout); socket.removeEventListener('message', handler); frame.ok === false ? reject(new Error(JSON.stringify(frame.error))) : resolve(frame.payload); };
    socket.addEventListener('message', handler);
    socket.send(JSON.stringify({ type: 'req', id, method, params }));
  });
  try { await call('connect', { minProtocol: 4, token }); return await call(method, params); }
  finally { socket.close(); }
}
async function check(name, action) {
  const began = Date.now();
  console.log(`Checking: ${name}`);
  try { const details = await action(); report.checks.push({ name, status: 'PASS', durationMs: Date.now() - began, details }); }
  catch (error) { report.checks.push({ name, status: 'FAIL', durationMs: Date.now() - began, error: error.message }); }
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(evidence, `${report.checks.length}.png`), fullPage: true });
}

try {
  await start();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(8000);
  const pageErrors = [];
  const connections = [];
  let searchResult = null;
  const voiceRequests = [];
  const chatResponses = [];
  const rpcDiagnostics = [];
  page.on('websocket', socket => {
    const connection = { openedAt: Date.now(), closedAt: null, connectedAt: null, methods: new Map() };
    connections.push(connection);
    socket.on('framesent', ({ payload }) => { try { const frame = JSON.parse(payload); if (frame.id) connection.methods.set(frame.id, frame.method); if (frame.method?.startsWith('voice.microphone.')) voiceRequests.push({ method: frame.method, sessionId: frame.params?.sessionId }); } catch {} });
    socket.on('framereceived', ({ payload }) => { try { const frame = JSON.parse(payload); const method = connection.methods.get(frame.id); if (method === 'connect' && frame.ok === true) connection.connectedAt = Date.now(); if (method === 'webSearch.test') searchResult = frame; if (method === 'chat.send') chatResponses.push(frame); } catch {} });
    socket.on('close', () => { connection.closedAt = Date.now(); });
    socket.on('framesent', ({ payload }) => { try { const frame = JSON.parse(payload); if (/^chat\./.test(frame.method)) rpcDiagnostics.push({ direction: 'request', method: frame.method, fields: Object.keys(frame.params || {}) }); } catch {} });
    socket.on('framereceived', ({ payload }) => { try { const frame = JSON.parse(payload); const method = connection.methods.get(frame.id); if (/^chat\./.test(method)) rpcDiagnostics.push({ direction: 'response', method, ok: frame.ok, fields: Object.keys(frame.payload || {}), error: frame.error }); } catch {} });
  });
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  await check('Chat connects, native plugin activates, composer accepts text', async () => {
    await page.goto(`${base}/chat/zero`);
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).waitFor({ state: 'visible' });
    await page.locator('.zero-voice-toggle-btn').filter({ hasText: 'Voice: PARTIAL' }).waitFor();
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill('A draft retained during functional checks');
    assert.equal(await page.getByRole('textbox', { name: 'Chat composer', exact: true }).inputValue(), 'A draft retained during functional checks');
    assert.deepEqual(pageErrors, []);
    return { pageErrors: [...pageErrors] };
  });
  await check('Memory search uses actual persisted records through the UI', async () => {
    const marker = `Browser memory evidence ${port}`;
    const stored = await rpc('memory.remember', { content: marker, layer: 'semantic', agentId: 'zero' });
    await page.goto(`${base}/settings/memory`);
    await page.getByText('Search memories', { exact: true }).click();
    const input = page.getByPlaceholder("Search this agent's memories", { exact: true });
    await input.fill(marker);
    await input.press('Enter');
    await page.getByText(marker, { exact: false }).last().waitFor({ state: 'visible' });
    return { memoryId: stored.id, marker };
  });
  if (process.argv.includes('--external')) await check('Chat sends through the UI, displays actual model reply and persists it', async () => {
    await page.goto(`${base}/chat/zero`);
    const marker = `UI_PROOF_${port}`;
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill(`Reply exactly ${marker} with no other text. Do not use tools.`);
    await page.locator('.zero-voice-toggle-btn').filter({ hasText: 'Voice: PARTIAL' }).waitFor();
    await page.locator('button.chat-send-btn--send').click();
    const deadline = Date.now() + 60000;
    while (!chatResponses.length && Date.now() < deadline) {
      if ((await page.locator('body').innerText()).includes('Chat history request timed out')) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(chatResponses.length, `Actual chat.send RPC must settle. UI: ${(await page.locator('body').innerText()).slice(-1800)}`);
    const response = chatResponses.at(-1);
    assert.equal(response.ok, true, JSON.stringify(response.error));
    assert.equal(response.payload.content.trim(), marker);
    await page.getByText(marker, { exact: true }).last().waitFor();
    const history = await rpc('chat.history', { sessionKey: response.payload.sessionKey });
    assert.equal(history.messages.at(-1).content.trim(), marker);
    await page.reload();
    await page.getByText(marker, { exact: true }).last().waitFor();
    return { taskId: response.payload.taskId, sessionKey: response.payload.sessionKey, reply: marker, persistedAfterReload: true };
  });
  if (process.argv.includes('--devices')) await check('Voice toolbar starts the selected chat microphone, stops it and clears on disconnect', async () => {
    await page.goto(`${base}/chat/zero`);
    const button = page.locator('.zero-voice-toggle-btn');
    await button.filter({ hasText: 'Voice: PARTIAL' }).waitFor();
    await button.click();
    await button.filter({ hasText: 'Voice: Listening' }).waitFor();
    const start = voiceRequests.at(-1);
    assert.equal(start.method, 'voice.microphone.start');
    assert.ok(start.sessionId);
    assert.equal((await rpc('voice.status')).sessions.find(session => session.sessionId === start.sessionId)?.microphoneActive, true);
    await button.click();
    await button.filter({ hasText: 'Voice: PARTIAL' }).waitFor();
    assert.equal((await rpc('voice.status')).sessions.some(session => session.microphoneActive), false);
    await button.click();
    await button.filter({ hasText: 'Voice: Listening' }).waitFor();
    await page.reload();
    await page.locator('.zero-voice-toggle-btn').filter({ hasText: 'Voice: PARTIAL' }).waitFor();
    assert.equal((await rpc('voice.status')).sessions.some(session => session.microphoneActive), false);
    return { sessionId: start.sessionId, actualCaptureStarted: true, explicitStop: true, disconnectedCaptureStopped: true };
  });
  await check('Skills filter changes visible results', async () => {
    await page.goto(`${base}/settings/skills`);
    await page.getByText('web-research', { exact: true }).first().waitFor();
    const input = page.getByPlaceholder('Filter installed skills', { exact: true });
    await input.fill('web-research');
    await page.getByText('web-research', { exact: true }).first().waitFor();
    await page.getByText('terminal-exec', { exact: true }).waitFor({ state: 'hidden' });
    return { query: 'web-research' };
  });
  await check('Skills details expose persisted enable/disable controls', async () => {
    await page.getByText('web-research', { exact: true }).first().click();
    await page.locator('wa-switch').last().click();
    await page.getByText('Disabled', { exact: true }).last().waitFor();
    const disabled = await rpc('skills.get', { name: 'web-research' });
    assert.equal(disabled.skill.enabled, false);
    await page.reload();
    await page.getByText('web-research', { exact: true }).first().click();
    assert.equal(await page.getByRole('switch').last().isChecked(), false);
    await page.locator('wa-switch').last().click();
    await page.getByText('Enabled', { exact: true }).last().waitFor();
    assert.equal((await rpc('skills.get', { name: 'web-research' })).skill.enabled, true);
    return { disabledPersisted: true, reenabled: true };
  });
  await check('Search form executes its configured provider and reports real outcome', async () => {
    await page.goto(`${base}/settings/search`);
    await page.getByRole('textbox', { name: 'Search query', exact: true }).fill('Python programming language');
    await page.getByRole('button', { name: 'Test search', exact: true }).click();
    const deadline = Date.now() + 15000;
    while (!searchResult && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(searchResult, 'UI search request must settle');
    assert.equal(searchResult.ok, true, JSON.stringify(searchResult.error));
    const result = searchResult.payload;
    assert.equal(result.status, 'ok');
    assert.ok(result.citations.length > 0);
    assert.ok(result.citations.every(citation => citation.retrieved && citation.verified === false && citation.provenance.endpoint));
    await page.getByText('Search succeeded', { exact: true }).waitFor();
    const source = result.citations[0];
    const fetched = await fetch(source.url, { signal: AbortSignal.timeout(10000) });
    assert.ok(fetched.ok, `Source HTTP ${fetched.status}`);
    const body = await fetched.text();
    assert.ok(body.length > 100);
    return { sources: result.citations.length, sourceUrl: source.url, sourceHttpStatus: fetched.status, sourceBytes: Buffer.byteLength(body), verifiedClaims: false };
  });
  await check('Plugins current page exposes lifecycle controls', async () => {
    await page.goto(`${base}/settings/plugins`);
    await page.getByPlaceholder('Local plugin directory or npm package', { exact: true }).fill(path.join(root, 'plugins/system-tools'));
    await page.getByRole('button', { name: 'Install plugin', exact: true }).click();
    await page.getByText('Installed System Tools 1.0.0. Runtime: active.', { exact: true }).waitFor();
    await page.reload();
    await page.getByText('System Tools', { exact: true }).first().waitFor();
    const executed = await rpc('zero.computer.control', { action: 'system_info' });
    assert.equal(executed.platform, process.platform);
    assert.ok(executed.memoryUsage.rss > 0);
    await page.getByText('System Tools', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Disable System Tools', exact: true }).click();
    await page.getByRole('button', { name: 'Enable System Tools', exact: true }).waitFor();
    assert.equal((await rpc('plugins.inspect', { id: 'system-tools' })).plugin.enabled, false);
    await assert.rejects(rpc('zero.computer.control', { action: 'system_info' }), /disabled/);
    await stop(); await start(); await page.reload();
    await page.getByRole('button', { name: 'Enable System Tools', exact: true }).waitFor();
    assert.equal((await rpc('plugins.inspect', { id: 'system-tools' })).plugin.enabled, false);
    await page.getByRole('button', { name: 'Enable System Tools', exact: true }).click();
    await page.getByRole('button', { name: 'Disable System Tools', exact: true }).waitFor();
    assert.ok((await rpc('zero.computer.control', { action: 'system_info' })).memoryUsage.rss > 0);
    await page.getByRole('button', { name: 'Uninstall System Tools', exact: true }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).waitFor({ state: 'hidden' });
    const remaining = await rpc('plugins.list');
    assert.equal(remaining.plugins.some(plugin => plugin.id === 'system-tools'), false);
    return { installedPersisted: true, executed: executed.executed, platform: executed.platform, verified: executed.verified, disabledAcrossProcessRestart: true, reenabled: true, uninstalled: true };
  });
  if (process.argv.includes('--screen')) await check('About controls real native capture and durable Private Mode across process restarts', async () => {
    await page.goto(`${base}/settings/about`);
    await page.getByRole('button', { name: 'Enable observation', exact: true }).click();
    await page.getByText(/^Capturing locally:/).waitFor();
    const capturing = await rpc('zero.observation.status');
    assert.equal(capturing.captureRunning, true);
    assert.ok(capturing.observer.buffer.frameCount > 0);
    assert.ok(capturing.counters.processed > 0);
    const recent = await rpc('zero.observation.recent');
    assert.equal(recent.ok, true); assert.ok(recent.observations[0].summary);
    await page.getByRole('button', { name: 'Private Mode', exact: true }).click();
    await page.getByText(/^Private Mode is on\./).waitFor();
    const privateState = await rpc('zero.observation.status');
    assert.equal(privateState.privateMode, true);
    assert.equal(privateState.captureRunning, false); assert.equal(privateState.ring.frames, 0);
    await stop(); await start(); await page.reload();
    await page.getByText(/^Private Mode is on\./).waitFor();
    assert.equal((await rpc('zero.observation.status')).captureRunning, false);
    await page.getByRole('button', { name: 'Exit Private Mode', exact: true }).click();
    await page.getByText(/^Capturing locally:/).waitFor();
    await stop(); await start(); await page.reload();
    await page.getByText(/^Capturing locally:/).waitFor();
    const resumed = await rpc('zero.observation.status');
    assert.equal(resumed.preferenceEnabled, true); assert.equal(resumed.captureRunning, true);
    assert.ok(resumed.observer.stats.lastCaptureTimestamp > capturing.observer.stats.lastCaptureTimestamp);
    await page.getByRole('button', { name: 'Stop observation', exact: true }).click();
    await page.getByText('Observation is off. No screen frames are being captured.', { exact: true }).waitFor();
    await stop(); await start(); await page.reload();
    await page.getByRole('button', { name: 'Enable observation', exact: true }).waitFor();
    const stopped = await rpc('zero.observation.status');
    assert.equal(stopped.preferenceEnabled, false); assert.equal(stopped.captureRunning, false);
    return { actualFrames: capturing.observer.buffer.frameCount, persistedSummaries: capturing.counters.processed,
      privateClearedFrames: true, privatePersistedAcrossProcess: true, enabledResumedAfterProcessRestart: true,
      disabledPersisted: true, encryptedFields: resumed.observer.observationStore.encryptedFields, localVision: 'UNVERIFIED', completed24Hours: false };
  });
  await check('Actual wheel input increases About scrollTop', async () => {
    await page.setViewportSize({ width: 1000, height: 400 });
    await page.goto(`${base}/settings/about`);
    await page.getByText('About Zero', { exact: true }).last().waitFor();
    const found = await page.locator('body *').evaluateAll(elements => {
      const el = elements.find(el => { const b = el.getBoundingClientRect(); return b.width > 200 && b.height > 100 && el.scrollHeight > el.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(el).overflowY); });
      if (!el) return null;
      el.dataset.browserScrollCheck = 'true';
      return { before: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
    });
    assert.ok(found, 'No overflowing scroll region found');
    await page.locator('[data-browser-scroll-check]').hover();
    await page.mouse.wheel(0, 500);
    await page.waitForFunction(before => document.querySelector('[data-browser-scroll-check]').scrollTop > before, found.before);
    return { ...found, after: await page.locator('[data-browser-scroll-check]').evaluate(el => el.scrollTop) };
  });
  await check('Gateway reconnects after a real process stop/restart and memory remains', async () => {
    await page.goto(`${base}/chat/zero`);
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).waitFor({ state: 'visible' });
    const oldPid = child.pid;
    const previousConnection = connections.at(-1);
    await stop();
    const stoppedAt = Date.now();
    await start();
    assert.notEqual(child.pid, oldPid);
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline && !connections.some(connection => connection !== previousConnection && connection.openedAt >= stoppedAt && connection.connectedAt)) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(previousConnection.closedAt, 'Previous browser WebSocket must actually close');
    const recovered = connections.find(connection => connection !== previousConnection && connection.openedAt >= stoppedAt && connection.connectedAt);
    assert.ok(recovered, 'Same browser page must complete a new WebSocket handshake after restart');
    await page.waitForFunction(() => document.body.innerText.includes('Connected') && !document.body.innerText.includes('Reconnecting'), null, { timeout: 25000 });
    const records = await rpc('memory.recall', { query: `Browser memory evidence ${port}` });
    assert.ok(records.some(record => record.content === `Browser memory evidence ${port}`));
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill('Connected after real restart');
    return { oldPid, newPid: child.pid, memoryCount: records.length, closedAt: previousConnection.closedAt, reconnectedAt: recovered.connectedAt };
  });
  report.pageErrors = pageErrors;
  report.rpcDiagnostics = rpcDiagnostics;
  report.status = report.checks.every(check => check.status === 'PASS') && pageErrors.length === 0 ? 'PASS' : 'FAIL';
} catch (error) { report.status = 'FAIL'; report.error = error.stack; }
finally {
  await browser?.close();
  await stop();
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === 'PASS' ? 0 : 1;
  // Retain isolated test state for failure/restart analysis; it never replaces owner state.
  console.log(`Isolated state: ${temporary}`);
}
