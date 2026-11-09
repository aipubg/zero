import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { restoreUserState } from '../scripts/restore-user-state.mjs';

test('[REAL_EXTERNAL] actual chat survives backup, restore and a new native host process', { skip: process.env.ZERO_RESTORE_HOST_TESTS !== '1', timeout: 180000 }, async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-restore-host-'));
  const evidence = path.resolve('artifacts/restore-host', String(Date.now())); fs.mkdirSync(evidence, { recursive: true });
  const report = { classification: ['INTEGRATION', 'REAL_OS', 'REAL_EXTERNAL'], status: 'RUNNING', cleanMachine: 'NOT_RUN; same Windows machine and checkout' };
  let child; let socket; const pending = new Map();
  const reservation = net.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  async function stop() {
    if (socket?.readyState === 1) { const closed = once(socket, 'close'); socket.close(); await closed; }
    if (child && child.exitCode === null) { const closed = once(child, 'exit'); child.kill(); await closed; }
  }
  async function start(dataDir, configRoot) {
    child = spawn(process.execPath, ['backend/server/zero-host.mjs'], { cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: {
      ...process.env, ZERO_PORT: String(port), ZERO_DATA_DIR: dataDir, ZERO_PREFS_PATH: path.join(dataDir, 'preferences.json'),
      ZERO_PROVIDERS_PATH: path.join(configRoot, 'models/gateway-providers.json'), ZERO_AGENT_BINDINGS_PATH: path.join(configRoot, 'models/gateway-defaults.json'),
      OPENCLAW_CONFIG_PATH: path.join(configRoot, 'zero-system/config/zero.json'), ZERO_LOCAL_MODELS_DIR: path.join(temporary, 'empty-models'), ZERO_SKILLS_DIR: path.join(temporary, 'skills'),
    } });
    child.stderr.resume();
    const deadline = Date.now() + 30000;
    let ready = false;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error('Owned restore host exited before readiness');
      try { if ((await fetch(base + '/health')).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true);
    const auth = await fetch(base + '/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) });
    const { token } = await auth.json();
    socket = new WebSocket(base.replace('http:', 'ws:'));
    socket.addEventListener('message', event => { const frame = JSON.parse(event.data); const handler = pending.get(frame.id); if (handler) { pending.delete(frame.id); handler(frame); } });
    await once(socket, 'open');
    await call('connect', { minProtocol: 4, token });
    return child.pid;
  }
  function call(method, params) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID(); const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + ' timeout')); }, 90000);
      pending.set(id, frame => { clearTimeout(timer); frame.ok === false ? reject(new Error(JSON.stringify(frame.error))) : resolve(frame.payload); });
      socket.send(JSON.stringify({ type: 'req', id, method, params }));
    });
  }
  try {
    const initial = path.join(temporary, 'initial');
    fs.mkdirSync(path.join(initial, 'models'), { recursive: true }); fs.mkdirSync(path.join(initial, 'zero-system/config'), { recursive: true });
    for (const file of ['models/gateway-providers.json', 'models/gateway-defaults.json', 'zero-system/config/zero.json']) fs.copyFileSync(file, path.join(initial, file));
    const data = path.join(initial, '.zero-data');
    const oldPid = await start(data, initial);
    const result = await call('chat.send', { sessionKey: 'restore-chat-proof', message: 'Reply with exactly RESTORE_CHAT_PROOF and nothing else.', idempotencyKey: 'original-restored-turn' });
    assert.equal(result.ok, true);
    const before = await call('chat.history', { sessionKey: 'restore-chat-proof' });
    assert.equal(before.messages.filter(message => message.role === 'assistant').at(-1).content.trim(), 'RESTORE_CHAT_PROOF');
    await stop();
    const output = execFileSync(process.execPath, ['scripts/backup-user-state.mjs', '--state-dir', data], { encoding: 'utf8', windowsHide: true });
    const backup = JSON.parse(output.trim()).backupDirectory;
    const restoredRoot = path.join(temporary, 'restored');
    const restored = await restoreUserState(backup, restoredRoot);
    const newPid = await start(path.join(restoredRoot, '.zero-data'), restoredRoot);
    assert.notEqual(newPid, oldPid);
    const after = await call('chat.history', { sessionKey: 'restore-chat-proof' });
    assert.deepEqual(after.messages, before.messages);
    const replay = await call('chat.send', { sessionKey: 'restore-chat-proof', message: 'Reply with exactly RESTORE_CHAT_PROOF and nothing else.', idempotencyKey: 'original-restored-turn' });
    assert.equal(replay.ok, true);
    assert.equal(replay.taskId, result.taskId);
    assert.equal(replay.runId, result.runId);
    assert.equal((await call('chat.history', { sessionKey: 'restore-chat-proof' })).totalMessages, before.totalMessages);
    const continued = await call('chat.send', { sessionKey: 'restore-chat-proof', message: 'Reply with exactly RESTORED_HOST_READY and nothing else.', idempotencyKey: 'new-turn-after-restore' });
    assert.equal(continued.ok, true);
    const finalHistory = await call('chat.history', { sessionKey: 'restore-chat-proof' });
    assert.equal(finalHistory.messages.filter(message => message.role === 'assistant').at(-1).content.trim(), 'RESTORED_HOST_READY');
    assert.equal(finalHistory.totalMessages, before.totalMessages + 2);
    Object.assign(report, { status: 'PASS', oldPid, newPid, backup, restoredFiles: restored.files, persistedMessages: after.totalMessages, exactTranscriptIdentityPreserved: true, completedReceiptReplayNoDuplicate: true, originalTaskAndRunIdentityPreserved: true, actualNewCloudTurnAfterRestore: true });
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    await stop(); fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(fs.realpathSync(path.dirname(temporary)), fs.realpathSync(os.tmpdir())); assert.ok(path.basename(temporary).startsWith('zero-restore-host-'));
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
