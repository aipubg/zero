/** REAL_OS + INTEGRATION: actual Git HTTP helpers, local stalled transport, Windows PID readback. */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runGit } from '../packages/skill-sdk/git-process.mjs';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

const exec = promisify(execFile);
const windows = { skip: process.platform === 'win32' ? false : 'BLOCKED: Windows process-tree verification requires Windows', timeout: 20000 };

async function processes() {
  const { stdout } = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate,Name | ConvertTo-Json -Compress'],
  { windowsHide: true, timeout: 5000, maxBuffer: 1024 * 1024 });
  const rows = JSON.parse(stdout);
  return Array.isArray(rows) ? rows : [rows];
}

function descendants(rows, root) {
  const found = new Set([root]);
  for (let changed = true; changed;) {
    changed = false;
    for (const row of rows) if (found.has(row.ParentProcessId) && !found.has(row.ProcessId)) { found.add(row.ProcessId); changed = true; }
  }
  return rows.filter(row => found.has(row.ProcessId));
}

async function verifyStoppedGitTree(t, mode) {
  const sockets = new Set();
  let requests = 0, received;
  const firstRequest = new Promise(resolve => { received = resolve; });
  // The real Git transport connects and then waits for headers. No process or
  // Git response is mocked; this explicitly is not GitHub reachability proof.
  const server = http.createServer(() => { requests++; received(); });
  server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const controller = new AbortController();
  let operation;
  t.after(async () => {
    controller.abort();
    await operation?.catch(() => {});
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => server.close(resolve));
  });
  operation = runGit(['ls-remote', `http://127.0.0.1:${server.address().port}/controlled.git`, 'HEAD'], {
    timeoutMs: mode === 'timeout' ? 4000 : 12000, signal: controller.signal,
  });
  const outcome = operation.catch(error => error);
  let firstTimer;
  try { await Promise.race([firstRequest, new Promise((_, reject) => { firstTimer = setTimeout(() => reject(new Error('Real Git never reached the controlled HTTP server')), 5000); })]); }
  finally { clearTimeout(firstTimer); }
  const before = descendants(await processes(), operation.child.pid);
  assert.ok(before.length >= 2, 'The fixture must actually launch a Git transport helper, not just a root process');
  if (mode === 'cancel') controller.abort(new Error('Explicit source cancellation'));
  const error = await outcome;
  assert.equal(error.code, mode === 'timeout' ? 'GIT_TIMEOUT' : 'GIT_CANCELLED');
  assert.equal(error.childTreeExitConfirmed, true, 'Taskkill must confirm the actual owned process tree');
  const after = await processes();
  const survivors = before.filter(prior => after.some(row => row.ProcessId === prior.ProcessId && row.CreationDate === prior.CreationDate));
  assert.deepEqual(survivors, [], 'Every observed Git/helper identity must have exited');
  assert.ok(requests > 0);
  assert.equal(sockets.size, 0, 'The transport connection must close with its process tree');
  t.diagnostic(JSON.stringify({ mode, actualHttpRequests: requests, observedGitProcessCount: before.length, survivingGitProcesses: survivors.length, remainingHttpSockets: sockets.size }));
}

test('real Windows Git HTTP deadline stops its complete process tree before rejecting', windows, async t => {
  await verifyStoppedGitTree(t, 'timeout');
});

test('real Windows Git HTTP cancellation stops its complete process tree before rejecting', windows, async t => {
  await verifyStoppedGitTree(t, 'cancel');
});

test('actual host shutdown cancels an in-flight Skills import RPC and preserves installed bundles', windows, async t => {
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'zero-skill-host-stop-')));
  const sockets = new Set();
  let requestReceived;
  const received = new Promise(resolve => { requestReceived = resolve; });
  const remote = http.createServer(() => requestReceived());
  remote.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  await new Promise(resolve => remote.listen(0, '127.0.0.1', resolve));
  const count = Number(process.env.GIT_CONFIG_COUNT || 0);
  const change = { GIT_CONFIG_COUNT: String(count + 1), [`GIT_CONFIG_KEY_${count}`]: `url.http://127.0.0.1:${remote.address().port}/.insteadOf`,
    [`GIT_CONFIG_VALUE_${count}`]: 'https://github.com/zero-source-fixture/', GIT_ALLOW_PROTOCOL: 'http' };
  const saved = Object.fromEntries(Object.keys(change).map(key => [key, process.env[key]]));
  Object.assign(process.env, change);
  let host, socket, closed = false;
  const pending = new Map();
  t.after(async () => {
    socket?.close();
    if (host && !closed) await host.close().catch(() => {});
    for (const connection of sockets) connection.destroy();
    await new Promise(resolve => remote.close(resolve));
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-skill-host-stop-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  for (const [file, content] of [['config.json', '{}'], ['providers.json', '[]'], ['bindings.json', '{}']]) fs.writeFileSync(path.join(root, file), content);
  const reservation = http.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  host = new ZeroNativeHost({ port, configPath: path.join(root, 'config.json'), providersPath: path.join(root, 'providers.json'),
    prefsPath: path.join(root, 'prefs.json'), agentBindingsPath: path.join(root, 'bindings.json'),
    dataDir: path.join(root, 'data'), skillsDir: path.join(root, 'skills'), localModelsDir: path.join(root, 'models') });
  await host.start();
  const installed = await host.skillLoader.installSkill(path.join(repo, 'skills/web-research'));
  const bundleBefore = fs.readFileSync(installed.path);
  const registryBefore = fs.readFileSync(host.skillLoader.statePath);
  const auth = await fetch(`http://127.0.0.1:${port}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin', clientId: 'skill-shutdown-fixture' }), signal: AbortSignal.timeout(3000) }).then(response => response.json());
  socket = new WebSocket(`ws://127.0.0.1:${port}/`);
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Socket did not connect')), 3000); socket.onopen = () => { clearTimeout(timer); resolve(); }; socket.onerror = reject; });
  socket.onmessage = event => { const response = JSON.parse(event.data); if (pending.has(response.id)) { const request = pending.get(response.id); clearTimeout(request.timer); pending.delete(response.id); request.resolve(response); } };
  socket.onclose = () => { for (const request of pending.values()) { clearTimeout(request.timer); request.resolve({ ok: false, transportClosed: true }); } pending.clear(); };
  let sequence = 0;
  const rpc = (method, params) => new Promise((resolve, reject) => {
    const id = `shutdown-${++sequence}`;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('RPC deadline')); }, 12000);
    pending.set(id, { resolve, timer }); socket.send(JSON.stringify({ type: 'req', id, method, params }));
  });
  assert.equal((await rpc('connect', { minProtocol: 4, maxProtocol: 4, token: auth.token })).ok, true);
  const importing = rpc('skills.import', { source: { type: 'github', url: 'https://github.com/zero-source-fixture/stalled.git' } });
  const result = importing.catch(error => ({ ok: false, error }));
  let receivedTimer;
  try { await Promise.race([received, new Promise((_, reject) => { receivedTimer = setTimeout(() => reject(new Error('Git never reached HTTP transport')), 5000); })]); }
  finally { clearTimeout(receivedTimer); }
  const before = await processes();
  const gitRoots = before.filter(row => row.Name === 'git.exe' && row.ParentProcessId === process.pid);
  assert.equal(gitRoots.length, 1, 'Exactly this host-owned Git operation must be active');
  const tree = descendants(before, gitRoots[0].ProcessId);
  assert.ok(tree.length >= 2);
  await host.close({ reason: 'actual-pending-import-test' }); closed = true;
  assert.equal((await result).ok, false, 'Cancelled import cannot produce a successful installation response');
  assert.deepEqual(await host.skillLoader.closeSources(), { ok: true, acquisitionsDrained: 1, cleanupUnconfirmed: 0 });
  const after = await processes();
  assert.equal(tree.filter(prior => after.some(row => row.ProcessId === prior.ProcessId && row.CreationDate === prior.CreationDate)).length, 0);
  assert.ok(fs.readFileSync(installed.path).equals(bundleBefore));
  assert.ok(fs.readFileSync(host.skillLoader.statePath).equals(registryBefore), 'Registry bytes must not change after aborted acquisition');
  assert.equal(sockets.size, 0);
  t.diagnostic(JSON.stringify({ realPendingRpc: true, observedGitProcesses: tree.length, remainingGitProcesses: 0, installedBundleBytesPreserved: true, installedRegistryBytesPreserved: true }));
});
