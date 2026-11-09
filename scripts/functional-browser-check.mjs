/** REAL_BROWSER + INTEGRATION: isolated native host, existing UI, persisted effects. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import { Readable } from 'node:stream';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';
import { mcpCapabilityName } from '../packages/plugin-sdk/mcp-adapter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv.includes('--screen-recall') && !process.argv.includes('--screen')) throw new Error('--screen-recall requires --screen');
if (process.argv.includes('--plugin-crash') && !process.argv.includes('--external-plugins')) throw new Error('--plugin-crash requires --external-plugins');
if (process.argv.includes('--agent-execution') && !process.argv.includes('--agent-models')) throw new Error('--agent-execution requires --agent-models');
if (process.argv.includes('--parallel-agents') && !process.argv.includes('--agent-execution')) throw new Error('--parallel-agents requires --agent-execution');
if (process.argv.includes('--agent-recovery') && !process.argv.includes('--parallel-agents')) throw new Error('--agent-recovery requires --parallel-agents');
if (process.argv.includes('--gguf-runtime') && !process.argv.includes('--gguf')) throw new Error('--gguf-runtime requires --gguf');
if (process.argv.includes('--gguf-chat') && !process.argv.includes('--gguf-runtime')) throw new Error('--gguf-chat requires --gguf-runtime');
if (process.argv.includes('--gguf-tools') && !process.argv.includes('--gguf-runtime')) throw new Error('--gguf-tools requires --gguf-runtime');
if (process.argv.includes('--gguf-qwen') && !process.argv.includes('--gguf')) throw new Error('--gguf-qwen requires --gguf');
if (process.argv.includes('--gguf-qwen-3b') && !process.argv.includes('--gguf')) throw new Error('--gguf-qwen-3b requires --gguf');
if (process.argv.includes('--gguf-recall') && !process.argv.includes('--gguf-tools')) throw new Error('--gguf-recall requires --gguf-tools');
if (process.argv.includes('--chat-abort') && !process.argv.includes('--external')) throw new Error('--chat-abort requires --external');
// Exercise current source, never an older immutable UI generation left on disk.
execFileSync(process.execPath, [path.join(root, 'app/zero-control-ui/build.mjs')], { cwd: root, stdio: 'pipe', windowsHide: true });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-functional-browser-'));
const evidence = path.join(root, 'artifacts', 'functional-browser', String(Date.now()));
fs.mkdirSync(evidence, { recursive: true });
fs.cpSync(path.join(root, 'skills'), path.join(temporary, 'skills'), { recursive: true });
fs.copyFileSync(path.join(root, 'zero-system/config/zero.json'), path.join(temporary, 'config.json'));
fs.copyFileSync(path.join(root, 'models/gateway-providers.json'), path.join(temporary, 'providers.json'));
fs.copyFileSync(path.join(root, 'models/gateway-defaults.json'), path.join(temporary, 'bindings.json'));
const listener = net.createServer();
listener.listen(0, '127.0.0.1');
await once(listener, 'listening');
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;
const report = { classification: [], classificationMeaning: 'Selected workflow scope; labels do not imply a passing outcome or product acceptance.', startedAt: new Date().toISOString(), status: 'RUNNING', evidence, checks: [] };
const workflowLabels = new Map([
  ['Chat connects, native plugin activates, composer accepts text', []],
  ['Memory search uses actual persisted records through the UI', []],
  ['Models UI assignment persists across process restart and actual inference uses the selection', ['REAL_EXTERNAL']],
  ['Provider UI creates, edits and deletes persisted settings without credential loss', []],
  ['Provider Test Connection retrieves the actual external model catalog', ['REAL_EXTERNAL']],
  ['Provider config UI import/export preserves credentials and recovers interrupted two-file updates', []],
  ['Local GGUF catalog and UI removal persist without deleting user guides', process.argv.includes('--gguf-runtime') ? ['REAL_OS'] : []],
  ['Models UI retrieves pinned Hugging Face file metadata', process.argv.includes('--hf-complete') ? ['REAL_EXTERNAL', 'REAL_OS'] : ['REAL_EXTERNAL']],
  ['Specialist UI model assignment persists without changing coordinator defaults', process.argv.includes('--agent-execution') ? ['REAL_EXTERNAL'] : []],
  ['Interrupted external team resumes pinned models and preserves completed child evidence', ['REAL_EXTERNAL']],
  ['Chat sends through the UI, displays actual model reply and persists it', ['REAL_EXTERNAL']],
  ['Actual UI Stop cancels streamed generation and next chat turn recovers', ['REAL_EXTERNAL']],
  ['Voice toolbar starts the selected chat microphone, stops it and clears on disconnect', ['REAL_OS']],
  ['Existing Skills page imports an actual pinned external GitHub bundle and persists it', ['REAL_EXTERNAL']],
  ['Skills filter changes visible results', []],
  ['Skills details expose persisted enable/disable controls', []],
  ['Search form executes its configured provider and reports real outcome', ['REAL_EXTERNAL']],
  ['Plugins current page exposes lifecycle controls', []],
  ['Third-party MCP plugin installs through current UI and executes a real registered tool', ['REAL_EXTERNAL']],
  ['About controls real native capture and durable Private Mode across process restarts', ['REAL_OS']],
  ['Actual wheel input increases About scrollTop', []],
  ['Gateway reconnects after a real process stop/restart and memory remains', []],
]);
let child, browser, page;
let modelProxy;
const outboundModelRequests = [];
let holdResearcher = false; let heldResearcher = 0;
const errors = [];

async function startModelProxy() {
  if (!process.argv.includes('--models') && !process.argv.includes('--agent-execution')) return;
  const file = path.join(temporary, 'providers.json'); const providers = JSON.parse(fs.readFileSync(file, 'utf8'));
  const provider = providers.find(row => row.id === 'nv'); assert.ok(provider);
  const upstream = provider.baseUrl.replace(/\/+$/, '');
  modelProxy = http.createServer(async (request, response) => {
    const controller = new AbortController(); response.on('close', () => controller.abort());
    try {
      const chunks = []; let bytes = 0;
      for await (const chunk of request) { bytes += chunk.length; if (bytes > 1024 * 1024) throw new Error('Probe request exceeded bound'); chunks.push(chunk); }
      const body = Buffer.concat(chunks); const payload = JSON.parse(body);
      const observed = { model: payload.model, provider: provider.id, startedAt: Date.now() };
      outboundModelRequests.push(observed);
      response.once('finish', () => { observed.finishedAt = Date.now(); });
      const result = await fetch(`${upstream}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: request.headers.authorization }, body, signal: controller.signal });
      if (holdResearcher && payload.messages?.[0]?.content?.startsWith('You are Research Specialist')) {
        heldResearcher++;
        await new Promise(resolve => { if (controller.signal.aborted) resolve(); else controller.signal.addEventListener('abort', resolve, { once: true }); });
        await result.body?.cancel().catch(() => {}); return;
      }
      response.writeHead(result.status, { 'Content-Type': result.headers.get('content-type') || 'application/json' });
      Readable.fromWeb(result.body).on('error', () => response.destroy()).pipe(response);
    } catch { if (!response.destroyed) { if (!response.headersSent) response.writeHead(502); response.end('Actual upstream forwarding failed'); } }
  });
  modelProxy.listen(0, '127.0.0.1'); await once(modelProxy, 'listening');
  provider.baseUrl = `http://127.0.0.1:${modelProxy.address().port}/v1`;
  fs.writeFileSync(file, JSON.stringify(providers));
}

async function start() {
  child = spawn(process.execPath, [path.join(root, 'backend/server/zero-host.mjs')], {
    cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ZERO_PORT: String(port), ZERO_DATA_DIR: path.join(temporary, 'data'),
      ZERO_PREFS_PATH: path.join(temporary, 'prefs.json'), ZERO_SKILLS_DIR: path.join(temporary, 'skills'),
      ZERO_PROVIDERS_PATH: path.join(temporary, 'providers.json'), ZERO_AGENT_BINDINGS_PATH: path.join(temporary, 'bindings.json'),
      ZERO_LOCAL_MODELS_DIR: path.join(temporary, 'local-models'),
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
async function rpc(method, params = {}, timeoutMs = 20000) {
  const response = await fetch(`${base}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin', clientId: 'functional-browser-check' }) });
  assert.equal(response.status, 200);
  const { token } = await response.json();
  const socket = new WebSocket(base.replace('http:', 'ws:'));
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const call = (method, params) => new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timeout = setTimeout(() => { socket.removeEventListener('message', handler); reject(new Error(`${method} timed out`)); }, timeoutMs);
    const onClose = () => { clearTimeout(timeout); socket.removeEventListener('message', handler); reject(new Error(`${method} connection closed`)); };
    const handler = event => { const frame = JSON.parse(event.data); if (frame.id !== id) return; clearTimeout(timeout); socket.removeEventListener('close', onClose); socket.removeEventListener('message', handler); frame.ok === false ? reject(new Error(JSON.stringify(frame.error))) : resolve(frame.payload); };
    socket.addEventListener('close', onClose, { once: true });
    socket.addEventListener('message', handler);
    socket.send(JSON.stringify({ type: 'req', id, method, params }));
  });
  try { await call('connect', { minProtocol: 4, token }); return await call(method, params); }
  finally { socket.close(); }
}
async function check(name, action) {
  assert.ok(workflowLabels.has(name), `Unclassified browser workflow: ${name}`);
  const classification = ['REAL_BROWSER', 'INTEGRATION', ...workflowLabels.get(name), ...(process.argv.includes('--screen-recall') && name.startsWith('About controls real native capture') ? ['REAL_EXTERNAL'] : [])];
  if (process.argv.includes('--plugin-crash') && name.startsWith('Third-party MCP plugin')) classification.push('REAL_OS');
  report.classification = [...new Set([...report.classification, ...classification])];
  const began = Date.now();
  console.log(`Checking: ${name}`);
  try { const details = await action(); report.checks.push({ name, classification, status: 'PASS', durationMs: Date.now() - began, details }); }
  catch (error) { report.checks.push({ name, classification, status: 'FAIL', durationMs: Date.now() - began, error: error.message }); }
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(evidence, `${report.checks.length}.png`), fullPage: true });
}

try {
  await startModelProxy();
  await start();
  browser = await chromium.launch({ channel: 'chrome', headless: !process.argv.includes('--screen-recall') });
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(8000);
  const pageErrors = [];
  const connections = [];
  let searchResult = null;
  let providerProbeResult = null;
  let ggufSelfTest = null;
  let hfSearchResult = null;
  const modelImportResponses = [];
  const voiceRequests = [];
  const chatResponses = [];
  const chatRequests = [];
  const rpcDiagnostics = [];
  const chatLifecycle = [];
  page.on('websocket', socket => {
    socket.on('framereceived', ({ payload }) => { try {
      const frame = JSON.parse(payload);
      if (frame.type === 'res' && Array.isArray(frame.payload?.files)) hfSearchResult = frame;
      if (frame.event === 'chat') chatLifecycle.push({ event: 'chat', state: frame.payload?.state, runId: frame.payload?.runId, sessionKey: frame.payload?.sessionKey, seq: frame.payload?.seq, receivedAt: Date.now() });
      if (frame.type === 'res' && frame.payload?.runId) chatLifecycle.push({ event: 'rpc-result', runId: frame.payload.runId, status: frame.payload.status, receivedAt: Date.now() });
    } catch {} });
    const connection = { openedAt: Date.now(), closedAt: null, connectedAt: null, methods: new Map() };
    connections.push(connection);
    socket.on('framereceived', ({ payload }) => { try { const frame = JSON.parse(payload); if (connection.methods.get(frame.id) === 'zero.providers.test') providerProbeResult = frame; if (connection.methods.get(frame.id) === 'zero.gateway.config.save') modelImportResponses.push(frame); if (connection.methods.get(frame.id) === 'zero.gateway.localGguf' && frame.payload?.tokensGenerated !== undefined) ggufSelfTest = frame; } catch {} });
    socket.on('framesent', ({ payload }) => { try { const frame = JSON.parse(payload); if (frame.id) connection.methods.set(frame.id, frame.method); if (frame.method === 'connect') connection.requestedScopes = frame.params?.scopes; if (frame.method?.startsWith('voice.microphone.')) voiceRequests.push({ method: frame.method, sessionId: frame.params?.sessionId }); } catch {} });
    socket.on('framereceived', ({ payload }) => { try { const frame = JSON.parse(payload); const method = connection.methods.get(frame.id); if (method === 'connect' && frame.ok === true) { connection.connectedAt = Date.now(); connection.role = frame.payload?.auth?.role; connection.scopes = frame.payload?.auth?.scopes; } if (method === 'webSearch.test') searchResult = frame; if (method === 'chat.send') chatResponses.push(frame); } catch {} });
    socket.on('close', () => { connection.closedAt = Date.now(); });
    socket.on('framesent', ({ payload }) => { try { const frame = JSON.parse(payload); if (frame.method === 'chat.send') chatRequests.push(frame.params); if (/^chat\./.test(frame.method)) rpcDiagnostics.push({ direction: 'request', method: frame.method, fields: Object.keys(frame.params || {}) }); } catch {} });
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
  if (process.argv.includes('--models')) await check('Models UI assignment persists across process restart and actual inference uses the selection', async () => {
    const owner = fs.readFileSync(path.join(root, 'models/gateway-defaults.json'), 'utf8');
    const selected = 'nv/nvidia/nemotron-3.5-super-vl-120b-a12b';
    await page.goto(`${base}/settings/model-providers`);
    const dropdown = page.locator('#zero-agent-assign-select');
    await dropdown.locator('button').click();
    await dropdown.locator(`[role="option"][data-value="${selected}"]`).click();
    await page.getByRole('button', { name: 'Assign to Zero', exact: true }).click();
    await page.getByText(`Successfully assigned "${selected}" to Zero agent!`, { exact: true }).waitFor();
    assert.equal(JSON.parse(fs.readFileSync(path.join(temporary, 'bindings.json'), 'utf8')).agentBindings.zero.model, selected);
    await stop(); await start(); await page.reload();
    const settings = await rpc('zero.providers.list'); assert.equal(settings.agentBindings.zero.model, selected);
    await page.goto(`${base}/chat`);
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill('What is two plus two? Reply with only the number.');
    await page.locator('button.chat-send-btn--send').click();
    const replyDeadline = Date.now() + 60000;
    while ((!chatRequests.length || !chatResponses.some(response => response.payload?.runId === chatRequests.at(-1).idempotencyKey)) && Date.now() < replyDeadline) await new Promise(resolve => setTimeout(resolve, 100));
    const completedReply = chatResponses.find(response => response.payload?.runId === chatRequests.at(-1)?.idempotencyKey);
    assert.ok(completedReply?.ok, 'The real UI chat must complete using the newly assigned default');
    const result = completedReply.payload;
    assert.match(result.content, /4/); assert.equal(result.requestedModel, 'nvidia/nemotron-3.5-super-vl-120b-a12b');
    assert.ok(outboundModelRequests.length > 0 && outboundModelRequests.every(request => request.model === 'nvidia/nemotron-3.5-super-vl-120b-a12b'), 'Independent forwarding proxy must observe the actual selected model in every real upstream request');
    assert.ok(typeof result.providerModel === 'string' && result.providerModel.length > 0, 'Record the actual provider-reported model without rewriting it');
    const beforeBlocked = outboundModelRequests.length;
    await page.goto(`${base}/settings/model-providers`);
    await rpc('zero.providers.save', { id: 'nv', enabled: false });
    await page.reload();
    await page.getByText('Assigned model for agent zero is unavailable; update its saved assignment', { exact: true }).waitFor();
    await assert.rejects(rpc('chat.send', { sessionKey: 'unavailable-assignment', message: 'This must fail before any upstream request.' }), /Assigned model.*unavailable/);
    assert.equal(outboundModelRequests.length, beforeBlocked, 'Unavailable assignment must not silently route to another default model');
    assert.equal(JSON.parse(fs.readFileSync(path.join(temporary, 'bindings.json'), 'utf8')).agentBindings.zero.model, selected);
    await rpc('zero.providers.save', { id: 'nv', enabled: true });
    const bindingsFile = path.join(temporary, 'bindings.json');
    const invalid = JSON.parse(fs.readFileSync(bindingsFile, 'utf8'));
    invalid.agentBindings.zero.model = 'unavailable-provider/unknown';
    fs.writeFileSync(bindingsFile, JSON.stringify(invalid)); // Actual saved-state fault injection; the valid default remains configured.
    await page.reload();
    await page.getByText('Assigned model for agent zero is unavailable; update its saved assignment', { exact: true }).waitFor();
    await assert.rejects(rpc('chat.send', { sessionKey: 'invalid-saved-assignment', message: 'Do not substitute a different configured model.' }), /Assigned model.*unavailable/);
    assert.equal(outboundModelRequests.length, beforeBlocked);
    assert.equal(JSON.parse(fs.readFileSync(bindingsFile, 'utf8')).agentBindings.zero.model, 'unavailable-provider/unknown');
    await page.locator('#zero-agent-assign-select button').click();
    await page.locator(`#zero-agent-assign-select [role="option"][data-value="${selected}"]`).click();
    await page.getByRole('button', { name: 'Assign to Zero', exact: true }).click();
    await page.getByText(`Successfully assigned "${selected}" to Zero agent!`, { exact: true }).waitFor();
    assert.equal(JSON.parse(fs.readFileSync(bindingsFile, 'utf8')).agentBindings.zero.model, selected);
    assert.equal(fs.readFileSync(path.join(root, 'models/gateway-defaults.json'), 'utf8'), owner, 'Owner model settings must remain unchanged');
    return { selected, requestedModel: result.requestedModel, independentlyObservedRequests: outboundModelRequests, providerModel: result.providerModel,
      providerIdentityMatchesRequestedName: result.providerModel === result.requestedModel, providerInternalAliasMappingVerified: false,
      persistedAcrossProcess: true, unavailableAssignmentBlockedWithoutUpstreamCall: true, invalidAssignmentBlockedWhileValidDefaultExists: true,
      actualUIRepair: true, savedAssignmentPreserved: true, actualReply: result.content, ownerSettingsPreserved: true };
  });
  if (process.argv.includes('--providers')) await check('Provider UI creates, edits and deletes persisted settings without credential loss', async () => {
    const owner = fs.readFileSync(path.join(root, 'models/gateway-providers.json'), 'utf8');
    const id = `ui-persisted-${port}`; const name = 'UI Persistence Provider';
    await page.goto(`${base}/settings/model-providers`);
    await page.getByRole('button', { name: '+ Add Provider', exact: true }).click();
    await page.getByPlaceholder('e.g. nvidia, openrouter, custom-openai', { exact: true }).fill(id);
    await page.getByPlaceholder('e.g. NVIDIA NIM, OpenRouter, Private Gateway', { exact: true }).fill(name);
    await page.getByPlaceholder('https://integrate.api.nvidia.com/v1 or http://127.0.0.1:18789/v1', { exact: true }).fill('https://example.invalid/v1');
    await page.getByPlaceholder('sk-xxxxxxxxxxxxxxxxxxxxxxxx', { exact: true }).first().fill('fixture-local-private-value');
    await page.getByRole('button', { name: 'Save Provider', exact: true }).click();
    await page.getByText(`Provider "${name}" saved successfully!`, { exact: true }).waitFor();
    const read = () => JSON.parse(fs.readFileSync(path.join(temporary, 'providers.json'), 'utf8'));
    assert.equal(read().find(row => row.id === id).models.length, 0, 'No synthetic model should be created');
    await stop(); await start(); await page.reload();
    const card = page.locator(`[data-provider-id="${id}"]`);
    await card.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByPlaceholder('e.g. NVIDIA NIM, OpenRouter, Private Gateway', { exact: true }).fill('UI Persistence Edited');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await page.getByText('Provider "UI Persistence Edited" saved successfully!', { exact: true }).waitFor();
    assert.equal(read().find(row => row.id === id).apiKey, 'fixture-local-private-value');
    assert.ok(!JSON.stringify(await rpc('zero.providers.list')).includes('fixture-local-private-value'));
    await card.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByText('Provider "UI Persistence Edited" deleted.', { exact: true }).waitFor();
    assert.equal(read().some(row => row.id === id), false);
    await stop(); await start(); await page.reload();
    assert.equal((await rpc('zero.providers.list')).providers.some(row => row.id === id), false);
    assert.equal(fs.readFileSync(path.join(root, 'models/gateway-providers.json'), 'utf8'), owner);
    return { createdAcrossProcessRestart: true, editedWithoutCredentialLoss: true, credentialsOmittedFromCatalog: true, deletedAcrossProcessRestart: true, syntheticModelsCreated: 0, ownerProvidersUnchanged: true, serviceExecution: 'NOT_CLAIMED_BY_SETTINGS_TEST' };
  });
  if (process.argv.includes('--provider-probe')) await check('Provider Test Connection retrieves the actual external model catalog', async () => {
    await page.goto(`${base}/settings/model-providers`);
    await page.locator('[data-provider-id="nv"]').getByRole('button', { name: 'Test Connection', exact: true }).click();
    const deadline = Date.now() + 15000;
    while (!providerProbeResult && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(providerProbeResult?.ok, JSON.stringify(providerProbeResult?.error));
    assert.ok(providerProbeResult.payload.count > 0); assert.equal(providerProbeResult.payload.verified, false);
    await page.getByText(/model list retrieved, inference unverified\./).waitFor();
    return { httpStatus: providerProbeResult.payload.httpStatus, retrievedModels: providerProbeResult.payload.count, inferenceVerifiedByThisProbe: false };
  });
  if (process.argv.includes('--gguf')) await check('Local GGUF catalog and UI removal persist without deleting user guides', async () => {
    const modelsDir = path.join(temporary, 'local-models'); fs.mkdirSync(modelsDir, { recursive: true });
    const source = process.argv.includes('--gguf-qwen-3b')
      ? path.join(root, 'artifacts/local-runtime/qwen2.5-3b/qwen2.5-3b-instruct-q5_k_m.gguf')
      : process.argv.includes('--gguf-qwen')
      ? path.join(root, 'artifacts/local-runtime/qwen2.5-0.5b/qwen2.5-0.5b-instruct-q5_k_m.gguf')
      : path.join(root, 'models/SmolVLM-256M/SmolVLM-256M-Instruct-Q8_0.gguf');
    const checksum = async file => { const hash = createHash('sha256'); for await (const chunk of fs.createReadStream(file)) hash.update(chunk); return hash.digest('hex'); };
    const originalHash = await checksum(source);
    fs.copyFileSync(source, path.join(modelsDir, 'ui-proof.gguf'));
    fs.writeFileSync(path.join(modelsDir, 'ui-proof.txt'), 'PRESERVE USER GUIDE');
    fs.writeFileSync(path.join(modelsDir, 'settings.json'), 'PRESERVE USER SETTINGS');
    await page.goto(`${base}/settings/model-providers`);
    const card = page.locator('.zero-provider-card--gguf'); await card.waitFor();
    assert.equal((await rpc('zero.gateway.localGguf', { action: 'list' })).models.length, 1);
    await page.getByRole('button', { name: 'Import GGUF', exact: true }).click();
    await page.locator('.zero-modal-overlay.active').getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByPlaceholder('Display Name', { exact: true }).fill('Persisted GGUF Settings');
    await page.locator('.zero-gguf-edit-panel select').selectOption('4096');
    await page.getByLabel(/Enable Reasoning/).uncheck();
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await page.getByText('Updated settings for "Persisted GGUF Settings".', { exact: true }).waitFor();
    const savedManifest = JSON.parse(fs.readFileSync(path.join(modelsDir, 'ui-proof.manifest.json'), 'utf8'));
    assert.equal(savedManifest.name, 'Persisted GGUF Settings'); assert.equal(savedManifest.parameters.num_ctx, 4096); assert.equal(savedManifest.capabilities.reasoning, false);
    await stop(); await start(); await page.reload(); await card.waitFor();
    await card.getByText('Persisted GGUF Settings', { exact: true }).waitFor();
    const restoredModel = (await rpc('zero.gateway.localGguf', { action: 'list' })).models[0];
    assert.equal(restoredModel.contextLength, 4096); assert.equal(restoredModel.capabilities.reasoning, false);
    const bindingsFile = path.join(temporary, 'bindings.json');
    const previousBindings = fs.readFileSync(bindingsFile);
    await card.locator('.zero-chip-action').click();
    await page.getByText('Active model set to "Persisted GGUF Settings"', { exact: true }).waitFor().catch(async error => {
      throw new Error(`${error.message}; notice: ${await page.locator('.zero-providers-notice').allTextContents()}`);
    });
    assert.equal(JSON.parse(fs.readFileSync(bindingsFile, 'utf8')).agentBindings.zero.model, 'local-gguf/ui-proof');
    assert.match(await card.locator('.zero-model-chip').innerText(), /✓ Active/);
    await stop(); await start(); await page.reload(); await card.waitFor();
    assert.equal((await rpc('zero.providers.list')).effectiveModel, 'local-gguf/ui-proof');
    assert.match(await card.locator('.zero-model-chip').innerText(), /✓ Active/);
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Config', exact: true }).click();
    const exported = JSON.parse(fs.readFileSync(await (await downloading).path(), 'utf8'));
    assert.equal(exported.agentBindings.zero.model, 'local-gguf/ui-proof');
    const choosing = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import Config', exact: true }).click();
    await (await choosing).setFiles({ name: 'local-assignment.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await page.getByText(`Imported ${exported.providers.length} provider(s) successfully!`, { exact: true }).waitFor();
    await stop(); await start(); await page.reload(); await card.waitFor();
    assert.equal((await rpc('zero.providers.list')).effectiveModel, 'local-gguf/ui-proof');
    assert.match(await card.locator('.zero-model-chip').innerText(), /✓ Active/);
    let runtimeEvidence = null;
    if (process.argv.includes('--gguf-runtime')) {
      await page.getByRole('button', { name: 'Import GGUF', exact: true }).click();
      const dialog = page.locator('.zero-modal-overlay.active');
      await dialog.getByRole('button', { name: 'Load RAM', exact: true }).click();
      await page.getByText(/Loaded .* into RAM\./).waitFor();
      assert.equal((await rpc('zero.gateway.localGguf', { action: 'status' })).isLoaded, true);
      await dialog.getByRole('button', { name: 'Self-Test', exact: true }).click();
      await page.getByText(/Self-test passed! Speed:/).waitFor();
      assert.ok(ggufSelfTest?.ok && ggufSelfTest.payload.passed);
      assert.ok(ggufSelfTest.payload.tokensGenerated > 0); assert.match(ggufSelfTest.payload.tokenAccounting, /Native generated token IDs/);
      await dialog.getByRole('button', { name: 'Unload RAM', exact: true }).click();
      await page.getByText(/Unloaded .* from RAM\./).waitFor();
      assert.equal((await rpc('zero.gateway.localGguf', { action: 'status' })).isLoaded, false);
      runtimeEvidence = { actualUILoad: true, selfTest: ggufSelfTest.payload, actualUIUnload: true, scope: 'Selected model token generation only; not semantic readiness or local chat routing' };
      await page.goto(`${base}/settings/model-providers`); await card.waitFor();
    }
    if (process.argv.includes('--gguf-chat')) {
      const priorReplies = chatResponses.length;
      await page.goto(`${base}/chat/zero`);
      await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill('What is the capital of France? Answer with the city name only. Do not use tools.');
      await page.locator('button.chat-send-btn--send').click();
      const deadline = Date.now() + 75000;
      while (chatResponses.length === priorReplies && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
      assert.ok(chatResponses.length > priorReplies, 'Local UI chat must settle');
      const response = chatResponses.at(-1);
      assert.equal(response.ok, true, JSON.stringify(response));
      const history = await rpc('chat.history', { sessionKey: response.payload.sessionKey });
      assert.equal(history.messages.at(-1).content, response.payload.content);
      await page.getByText(response.payload.content, { exact: true }).last().waitFor();
      assert.equal(response.payload.requestedModel, 'local-gguf/ui-proof');
      runtimeEvidence.localChat = { actualUISend: true, reply: response.payload.content, taskId: response.payload.taskId, requestedModel: response.payload.requestedModel, persistedHistory: true, exactInstructionFollowed: response.payload.content.trim() === 'Paris' };
      report.localChatAttempt = runtimeEvidence.localChat;
      assert.equal(response.payload.content.trim(), 'Paris', 'Local model must follow the requested city-name-only outcome, not merely mention Paris');
      await page.goto(`${base}/settings/model-providers`); await card.waitFor();
    }
    if (process.argv.includes('--gguf-tools')) {
      const artifact = path.join(temporary, 'actual-local-tool.txt');
      assert.equal(fs.existsSync(artifact), false);
      const priorReplies = chatResponses.length;
      await page.goto(`${base}/chat/zero`);
      await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill(`Use write_file to create ${JSON.stringify(artifact)} with content exactly ZERO_LOCAL_TOOL_EFFECT. Execute the tool; do not merely describe a call. After the tool result, give a short confirmation.`);
      await page.locator('button.chat-send-btn--send').click();
      const deadline = Date.now() + 75000;
      while (chatResponses.length === priorReplies && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
      const response = chatResponses.length > priorReplies ? chatResponses.at(-1) : null;
      report.localToolAttempt = { artifact, actualEffect: fs.existsSync(artifact) ? fs.readFileSync(artifact, 'utf8') : null, response };
      assert.ok(response, 'Local tool UI request must settle');
      assert.equal(response.ok, true, JSON.stringify(response));
      assert.equal(response.payload.requestedModel, 'local-gguf/ui-proof');
      assert.equal(report.localToolAttempt.actualEffect, 'ZERO_LOCAL_TOOL_EFFECT', 'Actual local tool file effect is required; prose is not execution');
      const history = await rpc('chat.history', { sessionKey: response.payload.sessionKey });
      assert.ok(history.messages.some(message => message.role === 'tool' && JSON.parse(message.content).verified === true), 'Persisted verified tool result required');
      if (process.argv.includes('--gguf-recall')) {
        const expected = createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
        const beforeTools = history.messages.filter(message => message.role === 'tool').length;
        const beforeReplies = chatResponses.length;
        await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill('Return only the sha256 value from the previous write_file tool result. Use the saved result; do not call tools.');
        await page.locator('button.chat-send-btn--send').click();
        const recallDeadline = Date.now() + 75000;
        while (chatResponses.length === beforeReplies && Date.now() < recallDeadline) await new Promise(resolve => setTimeout(resolve, 100));
        const recall = chatResponses.length > beforeReplies ? chatResponses.at(-1) : null;
        report.localToolRecall = { expectedSha256: expected, response: recall };
        assert.ok(recall, 'Second actual local UI turn must settle');
        assert.equal(recall.ok, true, JSON.stringify(recall));
        assert.equal(recall.payload.requestedModel, 'local-gguf/ui-proof');
        assert.equal(recall.payload.content.trim(), expected);
        const after = await rpc('chat.history', { sessionKey: response.payload.sessionKey });
        assert.equal(after.messages.filter(message => message.role === 'tool').length, beforeTools, 'Recall must not replay tools');
        assert.equal(after.messages.at(-1).content, recall.payload.content);
      }
      await page.goto(`${base}/settings/model-providers`); await card.waitFor();
    }
    let dialogs = 0; page.on('dialog', async dialog => { dialogs++; await dialog.dismiss(); });
    // Restore the isolated prior binding so later independent checks do not
    // inherit a deliberately removed model. The owner configuration is untouched.
    fs.writeFileSync(bindingsFile, previousBindings);
    await card.locator('.zero-chip-delete').click();
    await page.getByText(/Model .* removed\./).waitFor();
    assert.equal(dialogs, 0, 'Explicit removal click must not open a permission popup');
    assert.equal(fs.existsSync(path.join(modelsDir, 'ui-proof.gguf')), false);
    assert.equal(fs.readFileSync(path.join(modelsDir, 'ui-proof.txt'), 'utf8'), 'PRESERVE USER GUIDE');
    assert.equal(fs.readFileSync(path.join(modelsDir, 'settings.json'), 'utf8'), 'PRESERVE USER SETTINGS');
    await stop(); await start(); await page.reload();
    assert.equal((await rpc('zero.gateway.localGguf', { action: 'list' })).models.length, 0);
    assert.equal(await card.count(), 0); assert.equal(await checksum(source), originalHash);
    await assert.rejects(rpc('zero.gateway.localGguf', { action: 'delete', modelId: '../escape' }), /Invalid local model identifier/);
    await page.getByRole('button', { name: 'Import GGUF', exact: true }).click();
    await page.getByRole('button', { name: 'Mount Local Model (Zero-Copy)', exact: true }).click();
    await page.getByPlaceholder(/Downloads.*gguf/).fill(path.join(temporary, 'missing-model.gguf'));
    await page.getByRole('button', { name: 'Mount & Run Setup Pipeline', exact: true }).click();
    await page.getByText(/File not found at path/).last().waitFor();
    assert.equal(await page.getByText(/28\.4 tok\/s/).count(), 0);
    assert.equal((await rpc('zero.gateway.localGguf', { action: 'list' })).models.length, 0);
    await page.goto(`${base}/settings/model-providers`);
    return { realGgufCatalog: true, actualUISettingsSaved: true, settingsPersistedAcrossProcess: true, actualUIAssignment: true, assignmentPersistedAcrossProcess: true, localAssignmentUIExportImportRestart: true, activeStateVisibleAfterRestart: true, actualUIRemoval: true, persistedAcrossProcess: true, permissionDialogs: dialogs, userGuidesPreserved: true, originalSourceUnchanged: true, originalSourceSha256: originalHash, escapedIdentifierRejected: true, actualUIMountFailureVisible: true, failedMountNoRegistration: true, inferenceVerifiedByThisCheck: Boolean(runtimeEvidence), runtimeEvidence };
  });
  if (process.argv.includes('--hf-search') || process.argv.includes('--hf-complete')) await check('Models UI retrieves pinned Hugging Face file metadata', async () => {
    await page.goto(`${base}/settings/model-providers`);
    await page.getByRole('button', { name: 'Import GGUF', exact: true }).click();
    await page.getByRole('button', { name: 'Hugging Face Downloader', exact: true }).click();
    const input = page.getByPlaceholder('e.g. Qwen/Qwen2.5-Coder-7B-Instruct-GGUF', { exact: true });
    await input.fill('Qwen/Qwen2.5-0.5B-Instruct-GGUF'); hfSearchResult = null;
    await page.getByRole('button', { name: 'Search Files', exact: true }).click();
    const row = page.locator('.zero-hf-files-list > div').filter({ hasText: 'qwen2.5-0.5b-instruct-q5_k_m.gguf' });
    await row.waitFor({ timeout: 20000 });
    assert.equal(hfSearchResult?.ok, true);
    const file = hfSearchResult.payload.files.find(file => file.filename === 'qwen2.5-0.5b-instruct-q5_k_m.gguf');
    assert.equal(file.sizeBytes, 522186592); assert.match(file.revision, /^[a-f0-9]{40}$/); assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.equal(file.retrieved, true); assert.equal(file.verified, false);
    assert.ok(file.downloadUrl.includes(`/resolve/${file.revision}/`));
    await row.getByRole('button', { name: 'Download', exact: true }).click();
    let completion = null;
    let observedTransfer;
    if (process.argv.includes('--hf-complete')) {
      await row.getByText(/completed: 522186592\/522186592 bytes/).waitFor({ timeout: 240000 });
      observedTransfer = await row.textContent();
      const destination = path.join(temporary, 'local-models', file.filename);
      const hash = createHash('sha256');
      for await (const chunk of fs.createReadStream(destination)) hash.update(chunk);
      const actualSha256 = hash.digest('hex'); assert.equal(actualSha256, file.sha256);
      const card = page.locator('.zero-provider-card--gguf');
      await card.waitFor(); // Parent list must refresh without navigating/reloading.
      assert.match(await card.innerText(), /Qwen2\.5/i);
      await page.locator('.zero-modal-overlay.active .zero-modal__close').click();
      await stop(); await start(); await page.reload(); await card.waitFor();
      const models = (await rpc('zero.gateway.localGguf', { action: 'list' })).models;
      assert.ok(models.some(model => model.filename === file.filename));
      await page.getByRole('button', { name: 'Import GGUF', exact: true }).click();
      const dialog = page.locator('.zero-modal-overlay.active');
      await dialog.getByRole('button', { name: 'Load RAM', exact: true }).click();
      await page.getByText(/Loaded .* into RAM\./).waitFor({ timeout: 60000 });
      assert.equal((await rpc('zero.gateway.localGguf', { action: 'status' })).isLoaded, true);
      await dialog.getByRole('button', { name: 'Self-Test', exact: true }).click();
      await page.getByText(/Self-test passed! Speed:/).waitFor({ timeout: 30000 });
      assert.ok(ggufSelfTest?.ok && ggufSelfTest.payload.tokensGenerated > 0);
      await dialog.getByRole('button', { name: 'Unload RAM', exact: true }).click();
      await page.getByText(/Unloaded .* from RAM\./).waitFor();
      completion = { actualSha256, parentListRefreshed: true, actualHostRestart: true, catalogPersisted: true, actualUILoadAndNativeGeneration: ggufSelfTest.payload, actualUIUnload: true, semanticAccuracy: 'NOT_VERIFIED' };
      await page.goto(`${base}/settings/model-providers`);
      return { actualUISearch: true, selectedFile: file, observedTransfer, completion, inference: 'Native token generation only' };
    }
    await row.getByText(/downloading: [1-9][0-9]*\//).waitFor({ timeout: 30000 });
    observedTransfer = await row.textContent();
    await page.locator('.zero-modal-overlay.active .zero-modal__close').click();
    await page.getByRole('button', { name: 'Import GGUF', exact: true }).click();
    await page.getByRole('button', { name: 'Hugging Face Downloader', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel current download', exact: true }).click();
    await page.locator('.zero-hf-current-transfer').getByText(/cancelled,/).waitFor({ timeout: 15000 });
    await input.fill('https://example.invalid/owner/repo');
    await page.getByRole('button', { name: 'Search Files', exact: true }).click();
    await page.getByText(/Search failed:.*official Hugging Face/).waitFor();
    await page.goto(`${base}/settings/model-providers`);
    return { actualUISearch: true, filesRetrieved: hfSearchResult.payload.files.length, selectedFile: file, foreignRepositoryRejected: true, observedTransfer, downloadStatus: 'Actual external bytes observed through UI, modal closed/reopened, current download cancellation settled', completeDownload: 'NOT_RUN', inference: 'NOT_RUN' };
  });
  if (process.argv.includes('--agent-models')) await check('Specialist UI model assignment persists without changing coordinator defaults', async () => {
    const bindingsFile = path.join(temporary, 'bindings.json');
    const before = JSON.parse(fs.readFileSync(bindingsFile, 'utf8'));
    const selected = 'nv/nvidia/nemotron-3.5-super-vl-120b-a12b';
    await page.goto(`${base}/settings/model-providers`);
    await page.getByLabel('Agent model assignment', { exact: true }).selectOption('coder');
    const dropdown = page.locator('#zero-agent-assign-select');
    await dropdown.locator('button').click();
    await dropdown.locator(`[role="option"][data-value="${selected}"]`).click();
    await page.getByRole('button', { name: 'Assign to specialist', exact: true }).click();
    await page.getByText(`Successfully assigned "${selected}" to coder!`, { exact: true }).waitFor();
    let saved = JSON.parse(fs.readFileSync(bindingsFile, 'utf8'));
    assert.equal(saved.agentBindings.coder.model, selected);
    assert.deepEqual(saved.defaults, before.defaults); assert.deepEqual(saved.agentBindings.zero, before.agentBindings.zero);
    await stop(); await start(); await page.reload();
    await page.getByLabel('Agent model assignment', { exact: true }).selectOption('coder');
    await page.locator('.zero-agent-desc-box__value').first().filter({ hasText: selected }).waitFor();
    saved = await rpc('zero.providers.list'); assert.equal(saved.agentBindings.coder.model, selected);
    await assert.rejects(rpc('zero.providers.setActive', { agentId: 'unknown', modelId: selected }), /Unknown specialist/);
    let execution = null;
    if (process.argv.includes('--agent-execution')) {
      const target = path.join(temporary, 'specialist-source.txt');
      const marker = `SPECIALIST_ACTUAL_READ_${crypto.randomUUID()}`;
      fs.writeFileSync(target, marker);
      const parallel = process.argv.includes('--parallel-agents');
      const secondModel = 'nv/nvidia/nemotron-3.5-lightning-30b-a3b';
      const secondTarget = path.join(temporary, 'researcher-source.txt');
      const secondMarker = `RESEARCHER_ACTUAL_READ_${crypto.randomUUID()}`;
      if (parallel) {
        await page.getByLabel('Agent model assignment', { exact: true }).selectOption('researcher');
        await dropdown.locator('button').click();
        await dropdown.locator(`[role="option"][data-value="${secondModel}"]`).click();
        await page.getByRole('button', { name: 'Assign to specialist', exact: true }).click();
        await page.getByText(`Successfully assigned "${secondModel}" to researcher!`, { exact: true }).waitFor();
        await stop(); await start(); await page.reload();
        const restored = await rpc('zero.providers.list');
        assert.equal(restored.agentBindings.researcher.model, secondModel);
        assert.equal(restored.agentBindings.coder.model, selected);
        assert.deepEqual(restored.defaults, before.defaults);
        fs.writeFileSync(secondTarget, secondMarker);
      }
      const beforeRequests = outboundModelRequests.length;
      const outcome = await rpc('agent.task.execute', { goal: 'Read the actual local file and consolidate its content.', timeoutMs: 120000, maxToolRounds: 3, maxOutputTokens: 2048,
        subtasks: [{ id: 'ui_assigned_coder', agentId: 'coder', goal: `Call read_file with path ${JSON.stringify(target)}. Report its exact content. You must actually call the tool.`, tools: ['read_file'], dependsOn: [] }, ...(parallel ? [{ id: 'ui_assigned_researcher', agentId: 'researcher', goal: `Call read_file with path ${JSON.stringify(secondTarget)}. Report its exact content. You must actually call the tool.`, tools: ['read_file'], dependsOn: [] }] : [])] }, 130000);
      assert.equal(outcome.status, 'COMPLETED');
      const result = outcome.consolidatedResult.results.ui_assigned_coder;
      assert.equal(result.modelId, selected.replace(/^nv\//, ''));
      assert.ok(result.toolResults.some(tool => tool.toolName === 'read_file' && JSON.stringify(tool.result).includes(marker)), 'Actual tool result must contain the independently created unknown file marker');
      assert.ok(result.output.includes(marker));
      const requests = outboundModelRequests.slice(beforeRequests);
      assert.ok(requests.some(request => request.model === result.modelId), 'Independent proxy must observe assigned model on actual upstream traffic');
      let parallelEvidence = null;
      if (parallel) {
        const second = outcome.consolidatedResult.results.ui_assigned_researcher;
        assert.equal(second.modelId, secondModel.replace(/^nv\//, ''));
        assert.ok(second.toolResults.some(tool => tool.toolName === 'read_file' && JSON.stringify(tool.result).includes(secondMarker)));
        assert.ok(second.output.includes(secondMarker));
        const a = requests.find(request => request.model === result.modelId);
        const b = requests.find(request => request.model === second.modelId);
        const overlapMs = Math.min(a.finishedAt, b.finishedAt) - Math.max(a.startedAt, b.startedAt);
        assert.ok(overlapMs > 0, 'Independent actual upstream specialist requests must overlap');
        assert.ok(outcome.consolidatedResult.synthesis.includes(marker) && outcome.consolidatedResult.synthesis.includes(secondMarker));
        parallelEvidence = { agents: ['coder', 'researcher'], models: [result.modelId, second.modelId], overlapMs, actualIndependentFileResults: true, bothResultsInParentSynthesis: true };
      }
      execution = { masterTaskId: outcome.masterTaskId, status: outcome.status, modelId: result.modelId, actualRead: true, outputMatchesFile: true, upstreamModels: requests.map(request => request.model), parallelEvidence, synthesis: outcome.consolidatedResult.synthesis };
    }
    return { selectedAgent: 'coder', savedModel: selected, persistedAcrossProcess: true, coordinatorDefaultsUnchanged: true, unknownAgentRejected: true, inferenceVerifiedByThisCheck: Boolean(execution), execution };
  });
  if (process.argv.includes('--agent-recovery')) await check('Interrupted external team resumes pinned models and preserves completed child evidence', async () => {
    const dbPath = path.join(temporary, 'data/zero-tasks.sqlite');
    const files = ['coder', 'researcher'].map(agent => { const file = path.join(temporary, `recovery-${agent}.txt`); const marker = `${agent}_${crypto.randomUUID()}`; fs.writeFileSync(file, marker); return { agent, file, marker }; });
    holdResearcher = true; heldResearcher = 0;
    const pending = rpc('agent.task.execute', { goal: 'External interrupted team recovery evidence', timeoutMs: 120000, maxOutputTokens: 4096,
      subtasks: files.map(item => ({ id: item.agent, agentId: item.agent, goal: `Actually call read_file for ${JSON.stringify(item.file)} and report its exact content.`, tools: ['read_file'], dependsOn: [] })) }, 130000).then(value => ({ value }), error => ({ error: error.message }));
    let master; let originalChildren; const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const db = new DatabaseSync(dbPath, { readOnly: true });
      try {
        master = db.prepare('select id from zero_tasks where goal=?').get('[Team Execution] External interrupted team recovery evidence')?.id;
        originalChildren = master && db.prepare('select id,agent_id,status from zero_tasks where parent_task_id=?').all(master);
        if (heldResearcher && originalChildren?.some(item => item.agent_id === 'coder' && item.status === 'COMPLETED')) break;
      } finally { db.close(); }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(heldResearcher > 0 && originalChildren?.some(item => item.agent_id === 'coder' && item.status === 'COMPLETED'), 'Observe actual completed coder and held external researcher response before kill');
    const oldPid = child.pid; await stop(); holdResearcher = false;
    assert.ok((await pending).error, 'Killed host request cannot claim completion');
    const bindingsFile = path.join(temporary, 'bindings.json'); const settings = JSON.parse(fs.readFileSync(bindingsFile, 'utf8'));
    const originalModel = settings.agentBindings.researcher.model;
    settings.agentBindings.researcher.model = settings.agentBindings.coder.model;
    fs.writeFileSync(bindingsFile, JSON.stringify(settings));
    await start(); assert.notEqual(child.pid, oldPid);
    const recovered = await rpc('tasks.get', { id: master }); assert.equal(recovered.status, 'WAITING');
    const requestStart = outboundModelRequests.length;
    const outcome = await rpc('tasks.resume', { id: master }, 130000);
    assert.equal(outcome.status, 'COMPLETED'); assert.equal(outcome.masterTaskId, master);
    assert.equal(outcome.consolidatedResult.results.researcher.modelId, originalModel.replace(/^nv\//, ''));
    for (const item of files) assert.ok(outcome.consolidatedResult.results[item.agent].output.includes(item.marker));
    const resumedRequests = outboundModelRequests.slice(requestStart);
    assert.ok(resumedRequests.every(request => request.model !== settings.agentBindings.coder.model.replace(/^nv\//, '')), 'Completed coder must not be executed again');
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try { const after = db.prepare('select id,status from zero_tasks where parent_task_id=?').all(master); assert.deepEqual(after.map(item => item.id).sort(), originalChildren.map(item => item.id).sort()); assert.ok(after.every(item => item.status === 'COMPLETED')); } finally { db.close(); }
    return { masterTaskId: master, killedPid: oldPid, restartedPid: child.pid, actualExternalResponseHeld: true, completedCoderNotReplayed: true, sameChildIds: true, pinnedResearcherModel: originalModel, changedBindingIgnoredForResume: true, resumedUpstreamModels: resumedRequests.map(request => request.model) };
  });
  if (process.argv.includes('--model-import')) await check('Provider config UI import/export preserves credentials and recovers interrupted two-file updates', async () => {
    const providersFile = path.join(temporary, 'providers.json'); const bindingsFile = path.join(temporary, 'bindings.json');
    const ownerProviders = fs.readFileSync(path.join(root, 'models/gateway-providers.json'), 'utf8');
    const ownerBindings = fs.readFileSync(path.join(root, 'models/gateway-defaults.json'), 'utf8');
    const id = `imported-${port}`;
    const importThroughUI = async data => {
      const previous = modelImportResponses.length;
      const choosing = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Import Config', exact: true }).click();
      await (await choosing).setFiles({ name: 'model-import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
      const deadline = Date.now() + 10000;
      while (modelImportResponses.length === previous && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
      assert.equal(modelImportResponses.length, previous + 1, 'Actual import RPC response required');
      return modelImportResponses.at(-1);
    };
    await page.goto(`${base}/settings/model-providers`);
    await importThroughUI({ providers: [{ id, name: 'Imported Provider', baseUrl: 'https://example.invalid/v1', models: ['catalog-model'], apiKey: 'private-import-marker' }], agentBindings: { zero: { privateToken: 'private-binding-marker' } } });
    await page.getByText('Imported 1 provider(s) successfully!', { exact: true }).waitFor();
    assert.ok(JSON.parse(fs.readFileSync(providersFile, 'utf8')).some(row => row.id === 'nv'));
    await stop(); await start(); await page.reload();
    await page.locator(`[data-provider-id="${id}"]`).waitFor();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Config', exact: true }).click();
    const download = await downloading;
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.ok(exported.providers.some(row => row.id === id));
    assert.ok(!JSON.stringify(exported).includes('private-import-marker')); assert.ok(!JSON.stringify(exported).includes('private-binding-marker'));
    await importThroughUI(exported);
    await page.getByText(`Imported ${exported.providers.length} provider(s) successfully!`, { exact: true }).waitFor();
    assert.equal(JSON.parse(fs.readFileSync(providersFile, 'utf8')).find(row => row.id === id).apiKey, 'private-import-marker');
    assert.equal(JSON.parse(fs.readFileSync(bindingsFile, 'utf8')).agentBindings.zero.privateToken, 'private-binding-marker');
    const beforeProviders = fs.readFileSync(providersFile, 'utf8'); const beforeBindings = fs.readFileSync(bindingsFile, 'utf8');
    const rejected = await importThroughUI({ providers: [{ id: 'must-not-publish', baseUrl: 'https://example.invalid/v1' }, { id: 'invalid', baseUrl: 'file:///invalid' }] });
    assert.equal(rejected.ok, false, JSON.stringify(rejected));
    await page.getByText(/Import failed:/).waitFor();
    const importError = await page.locator('.zero-providers-notice--error').innerText();
    assert.match(importError, /HTTP/, importError);
    assert.equal(fs.readFileSync(providersFile, 'utf8'), beforeProviders); assert.equal(fs.readFileSync(bindingsFile, 'utf8'), beforeBindings);
    const writer = path.join(temporary, 'interrupted-import.mjs');
    const moduleUrl = pathToFileURL(path.join(root, 'packages/model-fabric/config-transaction.mjs')).href;
    fs.writeFileSync(writer, `import {commitModelImport} from ${JSON.stringify(moduleUrl)};commitModelImport(${JSON.stringify(providersFile)},${JSON.stringify(bindingsFile)},[],{}, {onProgress:()=>process.kill(process.pid,'SIGKILL')});`);
    const crashing = spawn(process.execPath, [writer], { windowsHide: true, stdio: 'ignore' });
    const [code] = await once(crashing, 'exit'); assert.notEqual(code, 0);
    assert.ok(fs.existsSync(providersFile + '.pending-model-import.json'));
    await stop(); await start(); await page.reload();
    assert.equal(fs.readFileSync(providersFile, 'utf8'), beforeProviders); assert.equal(fs.readFileSync(bindingsFile, 'utf8'), beforeBindings);
    assert.equal(fs.existsSync(providersFile + '.pending-model-import.json'), false);
    await page.locator(`[data-provider-id="${id}"]`).waitFor();
    assert.equal(fs.readFileSync(path.join(root, 'models/gateway-providers.json'), 'utf8'), ownerProviders);
    assert.equal(fs.readFileSync(path.join(root, 'models/gateway-defaults.json'), 'utf8'), ownerBindings);
    return { importPersistedAcrossProcess: true, unrelatedProviderPreserved: true, exportedSecrets: false, privateRoundTripPreserved: true, invalidBatchNoMutation: true, actualKilledWriter: true, hostStartupRecoveredBothFiles: true, ownerFilesUnchanged: true };
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
    const deadline = Date.now() + 90000;
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
    assert.equal(history.messages.at(-1).__openclaw.runId, response.payload.runId);
    assert.equal(history.sessionInfo.hasActiveRun, false);
    const nextMarker = `${marker}_SECOND`;
    const beforeReplies = chatResponses.length;
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill(`Reply exactly ${nextMarker} with no other text. Do not use tools.`);
    await page.locator('button.chat-send-btn--send').click();
    const nextDeadline = Date.now() + 90000;
    while (chatResponses.length === beforeReplies && Date.now() < nextDeadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(chatResponses.length, beforeReplies + 1, 'Second UI message must leave queue and receive a real gateway response');
    const nextResponse = chatResponses.at(-1);
    assert.equal(nextResponse.ok, true, JSON.stringify(nextResponse.error));
    assert.equal(nextResponse.payload.content.trim(), nextMarker);
    const nextHistory = await rpc('chat.history', { sessionKey: response.payload.sessionKey });
    assert.equal(nextHistory.messages.at(-1).__openclaw.runId, nextResponse.payload.runId);
    assert.equal(nextHistory.messages.at(-1).content.trim(), nextMarker);
    assert.ok(nextHistory.messages.some(message => message.role === 'user' && message.__openclaw.runId === nextResponse.payload.runId));
    await page.reload();
    await page.getByText(marker, { exact: true }).last().waitFor();
    return { taskId: response.payload.taskId, secondTaskId: nextResponse.payload.taskId, secondRunId: nextResponse.payload.runId, secondReply: nextMarker, samePageSecondSend: true, durableRunIdentity: true, sessionKey: response.payload.sessionKey, reply: marker, persistedAfterReload: true };
  });
  if (process.argv.includes('--chat-abort')) await check('Actual UI Stop cancels streamed generation and next chat turn recovers', async () => {
    await page.goto(`${base}/chat/zero`);
    const beforeReplies = chatResponses.length; const beforeRequests = chatRequests.length;
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill('Write a very long detailed numbered explanation of every integer from 1 to 1000. Start immediately with number 1 and continue without stopping. Do not use tools.');
    await page.locator('button.chat-send-btn--send').click();
    const deltaDeadline = Date.now() + 60000;
    while (Date.now() < deltaDeadline && (chatRequests.length === beforeRequests || !chatLifecycle.some(event => event.runId === chatRequests.at(-1).idempotencyKey && event.state === 'delta'))) await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(chatRequests.length, beforeRequests + 1);
    const request = chatRequests.at(-1);
    assert.ok(chatLifecycle.some(event => event.runId === request.idempotencyKey && event.state === 'delta'), 'Actual provider text delta must precede Stop');
    await page.getByRole('button', { name: 'Stop generating', exact: true }).click();
    const abortDeadline = Date.now() + 20000;
    while (chatResponses.length === beforeReplies && Date.now() < abortDeadline) await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(chatResponses.length, beforeReplies + 1);
    assert.equal(chatResponses.at(-1).ok, false, 'Stopped generation must not claim successful completion');
    const db = new DatabaseSync(path.join(temporary, 'data/zero-sessions.sqlite'), { readOnly: true });
    let receipt; try { receipt = db.prepare('select task_id,status from zero_assistant_receipts where run_id=?').get(request.idempotencyKey); } finally { db.close(); }
    assert.equal((await rpc('tasks.get', { id: receipt.task_id })).status, 'CANCELLED');
    const history = await rpc('chat.history', { sessionKey: request.sessionKey });
    const partial = history.messages.find(message => message.role === 'assistant' && message.__openclaw.runId === request.idempotencyKey && message.status === 'interrupted');
    assert.ok(partial?.content.trim(), 'Actual partial text must persist as interrupted');
    assert.equal(history.sessionInfo.hasActiveRun, false);
    const marker = `AFTER_STOP_${port}`;
    const previous = chatResponses.length;
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill(`Reply exactly ${marker}. Do not use tools.`);
    await page.locator('button.chat-send-btn--send').click();
    const recoveryDeadline = Date.now() + 90000;
    while (chatResponses.length === previous && Date.now() < recoveryDeadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(chatResponses.length, previous + 1);
    assert.equal(chatResponses.at(-1).ok, true, JSON.stringify(chatResponses.at(-1).error));
    assert.equal(chatResponses.at(-1).payload.content.trim(), marker);
    return { runId: request.idempotencyKey, taskId: receipt.task_id, actualTextDelta: true, actualUIStop: true, cancelledTask: true, partialBytes: Buffer.byteLength(partial.content), nextActualReply: marker };
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
  if (process.argv.includes('--external-skills')) await check('Existing Skills page imports an actual pinned external GitHub bundle and persists it', async () => {
    await page.goto(`${base}/settings/skills`);
    await page.getByPlaceholder('Local skill directory or GitHub repository URL', { exact: true }).fill('https://github.com/anthropics/skills.git');
    await page.getByPlaceholder('Pinned Git revision (optional)', { exact: true }).fill('ca45fc496a3436251f191354091d557da31c15b5');
    await page.getByPlaceholder('Skill directory within repository (optional)', { exact: true }).fill('skills/frontend-design');
    await page.getByRole('button', { name: 'Import skill bundle', exact: true }).click();
    await page.getByText('Installed skill: frontend-design. Reload to refresh the installed list.', { exact: true }).waitFor({ timeout: 60000 });
    const installed = await rpc('skills.get', { name: 'frontend-design' });
    assert.equal(installed.skill.name, 'frontend-design');
    const content = fs.readFileSync(installed.skill.filePath, 'utf8');
    assert.ok(content.length > 100); assert.match(content, /frontend-design/);
    await stop(); await start(); await page.reload();
    await page.getByText('frontend-design', { exact: true }).first().waitFor();
    assert.equal((await rpc('skills.get', { name: 'frontend-design' })).skill.name, 'frontend-design');
    await page.getByText('frontend-design', { exact: true }).first().click();
    await page.locator('wa-switch').last().click();
    await page.getByText('Disabled', { exact: true }).last().waitFor();
    assert.equal((await rpc('skills.get', { name: 'frontend-design' })).skill.enabled, false);
    await page.reload();
    await page.getByText('frontend-design', { exact: true }).first().click();
    assert.equal(await page.getByRole('switch').last().isChecked(), false);
    await page.locator('wa-switch').last().click();
    await page.getByText('Enabled', { exact: true }).last().waitFor();
    assert.equal((await rpc('skills.get', { name: 'frontend-design' })).skill.enabled, true);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    let execution = 'NOT_TESTED_BY_THIS_UI_IMPORT_GATE';
    if (process.argv.includes('--skill-execution')) {
      const artifact = path.join(temporary, 'external-ui-counter.html');
      await page.getByPlaceholder('Installed skill name', { exact: true }).fill('frontend-design');
      await page.getByPlaceholder('Describe the task for this installed skill', { exact: true }).fill(`Use this installed design skill to create a self-contained HTML counter at ${JSON.stringify(artifact)} using write_file. Show integer 0 in an element id="count" and a button labelled Increment that increases it by 1. No network dependencies. Verify the file using read_file and return its path.`);
      await page.getByRole('button', { name: 'Run skill task', exact: true }).click();
      const status = page.locator('.zero-skill-install pre[data-task-id]');
      await status.waitFor({ timeout: 120000 });
      const taskId = await status.getAttribute('data-task-id');
      const task = await rpc('tasks.get', { id: taskId });
      assert.equal((task.task || task).status, 'COMPLETED');
      assert.ok(fs.readFileSync(artifact, 'utf8').length > 100);
      const artifactPage = await browser.newPage();
      try {
        await artifactPage.goto(new URL(`file:///${artifact.replaceAll('\\', '/')}`).href);
        assert.equal((await artifactPage.locator('#count').innerText()).trim(), '0');
        await artifactPage.locator('button').filter({ hasText: /^Increment$/ }).click();
        assert.equal((await artifactPage.locator('#count').innerText()).trim(), '1');
      } finally { await artifactPage.close(); }
      execution = { taskId, actualArtifact: true, independentlyClickedCounter: [0, 1] };
    }
    assert.ok(!path.relative(temporary, installed.skill.filePath).startsWith('..'), 'Only the isolated installed bundle may be edited by this test');
    fs.appendFileSync(installed.skill.filePath, '\nDISPOSABLE_LOCAL_EDIT_FOR_REFRESH_CHECK\n');
    await page.getByPlaceholder('Installed skill name', { exact: true }).fill('frontend-design');
    await page.getByRole('button', { name: 'Refresh skill from saved source', exact: true }).click();
    await page.getByText('Refreshed skill: frontend-design. Reload to refresh the installed list.', { exact: true }).waitFor({ timeout: 60000 });
    assert.equal(fs.readFileSync(installed.skill.filePath, 'utf8'), content, 'Actual external source refresh must replace the disposable edit');
    assert.equal((await rpc('skills.get', { name: 'frontend-design' })).skill.enabled, true);
    await page.getByRole('button', { name: 'Uninstall skill bundle', exact: true }).click();
    await page.getByText('Uninstalled skill: frontend-design. Reload to refresh the installed list.', { exact: true }).waitFor();
    assert.equal(fs.existsSync(installed.skill.filePath), false);
    await stop(); await start(); await page.reload();
    assert.equal((await rpc('skills.status')).skills.some(skill => skill.name === 'frontend-design'), false);
    return { repository: 'anthropics/skills', revision: 'ca45fc496a3436251f191354091d557da31c15b5', name: 'frontend-design', actualBundleCharacters: content.length, persistedAfterProcessRestart: true, disabledPersistedAfterReload: true, reenabled: true, refreshedFromActualSource: true, uninstalledAcrossProcessRestart: true, execution };
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
  if (process.argv.includes('--external-plugins')) await check('Third-party MCP plugin installs through current UI and executes a real registered tool', async () => {
    await page.goto(`${base}/settings/plugins`);
    await page.locator('select[name="sourceType"]').selectOption('mcp');
    await page.getByPlaceholder('Local plugin directory or npm package', { exact: true }).fill('@modelcontextprotocol/server-filesystem@2.0.1');
    await page.getByPlaceholder('MCP executable arguments as JSON', { exact: true }).fill(JSON.stringify([temporary]));
    await page.getByRole('button', { name: 'Install plugin', exact: true }).click();
    await page.getByText('Installed @modelcontextprotocol/server-filesystem 2.0.1. Runtime: active.', { exact: true }).waitFor({ timeout: 120000 });
    const id = 'mcp:@modelcontextprotocol/server-filesystem';
    const capability = mcpCapabilityName(id, 'write_file');
    const artifact = path.join(temporary, 'actual-mcp-ui-output.txt');
    await page.goto(`${base}/chat`);
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill(`Call the installed plugin tool named ${capability} to write exactly ZERO_MCP_UI_REAL_EFFECT to ${JSON.stringify(artifact)}. Use that specific tool, not write_file. Then give a short confirmation.`);
    await page.locator('button.chat-send-btn--send').click();
    const deadline = Date.now() + 60000;
    while (!fs.existsSync(artifact) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(fs.readFileSync(artifact, 'utf8'), 'ZERO_MCP_UI_REAL_EFFECT');
    const requestId = chatRequests.at(-1).idempotencyKey;
    const completionDeadline = Date.now() + 60000;
    while (!chatResponses.some(response => response.payload?.runId === requestId) && Date.now() < completionDeadline) await new Promise(resolve => setTimeout(resolve, 100));
    const completed = chatResponses.find(response => response.payload?.runId === requestId);
    assert.ok(completed?.ok && completed.payload.taskId, 'Real UI plugin task must complete with a durable task ID');
    const history = await rpc('chat.history', { sessionKey: chatRequests.at(-1).sessionKey });
    assert.ok(history.messages.some(message => message.tool_calls?.some(call => call.function?.name === capability)));
    await page.goto(`${base}/settings/plugins`);
    await page.getByPlaceholder('Installed plugin ID', { exact: true }).fill(id);
    let crashRecovery = null;
    if (process.argv.includes('--plugin-crash')) {
      const beforeCrash = await rpc('plugins.inspect', { id });
      const oldPid = beforeCrash.plugin.process.pid; assert.ok(oldPid); process.kill(oldPid);
      const deadline = Date.now() + 5000;
      while ((await rpc('plugins.inspect', { id })).plugin.runtimeStatus !== 'unavailable' && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
      await page.getByRole('button', { name: 'Check plugin runtime', exact: true }).click();
      await page.getByText(`Plugin runtime: ${id}: unavailable. Owned MCP executable is no longer running; restart the plugin`, { exact: true }).waitFor();
      await assert.rejects(rpc('zero.computer.control', { action: capability, path: artifact, content: 'CRASHED_SHOULD_NOT_RUN' }), /MCP process is not running/);
      assert.equal(fs.readFileSync(artifact, 'utf8'), 'ZERO_MCP_UI_REAL_EFFECT');
      await page.getByRole('button', { name: 'Restart executable plugin', exact: true }).click();
      await page.getByText(`Restarted plugin: ${id}.`, { exact: true }).waitFor({ timeout: 30000 });
      const recovered = await rpc('plugins.inspect', { id }); assert.equal(recovered.plugin.runtimeStatus, 'active'); assert.notEqual(recovered.plugin.process.pid, oldPid);
      assert.ok((await rpc('zero.computer.control', { action: capability, path: artifact, content: 'ZERO_MCP_UI_REAL_EFFECT' })).ok);
      assert.equal(fs.readFileSync(artifact, 'utf8'), 'ZERO_MCP_UI_REAL_EFFECT');
      crashRecovery = { oldPid, newPid: recovered.plugin.process.pid, actualUnavailableStateRendered: true, failedCallHadNoEffect: true, actualEffectAfterUIRestart: true };
    }
    await page.getByRole('button', { name: 'Refresh plugin from saved source', exact: true }).click();
    await page.getByText(`Refreshed plugin: ${id}.`, { exact: true }).waitFor({ timeout: 120000 });
    await page.getByRole('button', { name: 'Restart executable plugin', exact: true }).click();
    await page.getByText(`Restarted plugin: ${id}.`, { exact: true }).waitFor({ timeout: 30000 });
    assert.ok((await rpc('zero.computer.control', { action: capability, path: artifact, content: 'ZERO_MCP_UI_REAL_EFFECT' })).ok);
    assert.equal(fs.readFileSync(artifact, 'utf8'), 'ZERO_MCP_UI_REAL_EFFECT');
    await page.getByText('@modelcontextprotocol/server-filesystem', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Disable @modelcontextprotocol/server-filesystem', exact: true }).click();
    await page.getByRole('button', { name: 'Enable @modelcontextprotocol/server-filesystem', exact: true }).waitFor();
    const disabledDeadline = Date.now() + 10000;
    while ((await rpc('plugins.inspect', { id })).plugin.enabled && Date.now() < disabledDeadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal((await rpc('plugins.inspect', { id })).plugin.enabled, false, 'Disable must persist after the MCP process drains before stopping the host');
    await stop(); await start(); await page.reload();
    assert.equal((await rpc('plugins.inspect', { id })).plugin.enabled, false, 'Disabled MCP state must survive process restart');
    await assert.rejects(rpc('zero.computer.control', { action: capability, path: artifact, content: 'SHOULD_NOT_RUN' }), /disabled/);
    assert.equal(fs.readFileSync(artifact, 'utf8'), 'ZERO_MCP_UI_REAL_EFFECT');
    await page.getByRole('button', { name: 'Enable @modelcontextprotocol/server-filesystem', exact: true }).click();
    await page.getByRole('button', { name: 'Disable @modelcontextprotocol/server-filesystem', exact: true }).waitFor();
    assert.ok((await rpc('zero.computer.control', { action: capability, path: artifact, content: 'ZERO_MCP_REENABLED' })).ok);
    assert.equal(fs.readFileSync(artifact, 'utf8'), 'ZERO_MCP_REENABLED');
    await page.getByRole('button', { name: 'Uninstall @modelcontextprotocol/server-filesystem', exact: true }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).waitFor({ state: 'hidden' });
    const uninstallDeadline = Date.now() + 20000;
    while ((await rpc('plugins.list')).plugins.some(plugin => plugin.id === id) && Date.now() < uninstallDeadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal((await rpc('plugins.list')).plugins.some(plugin => plugin.id === id), false, 'Uninstall must finish before stopping the host');
    await stop(); await start(); await page.reload();
    assert.equal((await rpc('plugins.list')).plugins.some(plugin => plugin.id === id), false);
    return { id, actualChatToolEffect: true, crashRecovery, refreshedFromSavedSourceThroughUI: true, restartedThroughUI: true, actualEffectAfterRefreshAndRestart: true, disabledAcrossProcessRestart: true, reenabledEffect: true, uninstalledAcrossProcessRestart: true };
  });
  if (process.argv.includes('--screen')) await check('About controls real native capture and durable Private Mode across process restarts', async () => {
    await page.goto(`${base}/settings/about`);
    const titleMarker = `ZeroRecallEvidence${Date.now()}`;
    if (process.argv.includes('--screen-recall')) {
      await page.evaluate(title => { document.title = title; }, titleMarker);
      await page.bringToFront();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    await page.getByRole('button', { name: 'Enable observation', exact: true }).click();
    await page.getByText(/^Capturing locally:/).waitFor();
    const capturing = await rpc('zero.observation.status');
    assert.equal(capturing.captureRunning, true);
    assert.ok(capturing.observer.buffer.frameCount > 0);
    assert.ok(capturing.counters.processed > 0);
    const recent = await rpc('zero.observation.recent');
    assert.equal(recent.ok, true); assert.ok(recent.observations[0].summary);
    let recall = null;
    if (process.argv.includes('--screen-recall')) {
      const visible = await browser.newPage();
      await visible.setContent(`<title>${titleMarker}</title><h1>Controlled observation recall window</h1>`);
      await visible.bringToFront();
      let observed;
      const deadline = Date.now() + 15000;
      do {
        await new Promise(resolve => setTimeout(resolve, 200));
        observed = await rpc('zero.observation.query', { query: 'current window' });
      } while (!observed.latestObservation?.window_context.includes(titleMarker) && Date.now() < deadline);
      assert.ok(observed.latestObservation.window_context.includes(titleMarker), 'Actual native capture must observe our unique visible title');
      const sessionKey = 'actual-screen-recall';
      const result = await rpc('chat.send', { sessionKey, message: 'Call screen_context with query "current window". Return the last recorded window title exactly as the tool reports it. Do not guess.' });
      assert.ok(result.content.includes(titleMarker), 'The model was not given the title and must retrieve it from actual observation memory');
      const history = await rpc('chat.history', { sessionKey });
      assert.ok(history.messages.some(message => message.tool_calls?.some(call => call.function?.name === 'screen_context')));
      assert.ok(history.messages.some(message => message.role === 'tool' && message.content.includes(titleMarker)));
      recall = { taskId: result.taskId, actualNativeTitleRetrieved: true, toolCallAndResultRecorded: true };
      await visible.close(); await page.bringToFront();
    }
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
      disabledPersisted: true, encryptedFields: resumed.observer.observationStore.encryptedFields, modelRecall: recall, localVision: 'UNVERIFIED', completed24Hours: false };
  });
  await check('Actual wheel input increases About scrollTop', async () => {
    await page.goto(`${base}/settings/about`);
    await page.getByText('Zero is the conversation entry. Specialist agents and workers can execute delegated tasks while their results stay in the canonical Zero conversation.', { exact: true }).waitFor();
    const connectors = await rpc('zero.integrations.connectors.status');
    assert.ok(connectors.connectors.length > 0);
    assert.ok(connectors.connectors.every(row => row.liveVerified === false && row.status !== 'connected'));
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
    let replayEvidence = null;
    if (process.argv.includes('--external')) {
      const original = chatResponses.find(response => response.ok && response.payload?.taskId)?.payload;
      const originalRequest = chatRequests.find(request => request.idempotencyKey === original?.runId);
      assert.ok(original && originalRequest?.idempotencyKey, 'Completed UI request must match its actual recorded identity');
      const before = (await rpc('models.status')).upstreamRequestCount;
      const replay = await rpc('chat.send', originalRequest);
      assert.equal(replay.taskId, original.taskId); assert.equal(replay.content, original.content);
      assert.equal((await rpc('models.status')).upstreamRequestCount, before);
      const history = await rpc('chat.history', { sessionKey: original.sessionKey });
      assert.equal(history.messages.filter(message => message.role === 'user' && message.content === originalRequest.message).length, 1);
      await page.getByText(original.content, { exact: true }).last().waitFor();
      replayEvidence = { taskId: replay.taskId, additionalModelCalls: 0, originalUserMessageCount: 1, replyVisibleAfterReconnect: true };
    }
    await page.getByRole('textbox', { name: 'Chat composer', exact: true }).fill('Connected after real restart');
    return { oldPid, newPid: child.pid, memoryCount: records.length, closedAt: previousConnection.closedAt, reconnectedAt: recovered.connectedAt, completedRequestReplay: replayEvidence };
  });
  report.pageErrors = pageErrors;
  report.rpcDiagnostics = rpcDiagnostics;
  report.chatLifecycle = chatLifecycle;
  report.connections = connections.map(({ openedAt, closedAt, connectedAt, requestedScopes, role, scopes }) => ({ openedAt, closedAt, connectedAt, requestedScopes, role, scopes }));
  report.status = report.checks.every(check => check.status === 'PASS') && pageErrors.length === 0 ? 'PASS' : 'FAIL';
} catch (error) { report.status = 'FAIL'; report.error = error.stack; }
finally {
  await browser?.close();
  await stop();
  if (modelProxy) { modelProxy.closeAllConnections(); await new Promise(resolve => modelProxy.close(resolve)); }
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === 'PASS' ? 0 : 1;
  // Retain isolated test state for failure/restart analysis; it never replaces owner state.
  console.log(`Isolated state: ${temporary}`);
}
