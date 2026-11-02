/** INTEGRATION/REAL_OS: run legacy automation assertions only against an owned disposable host. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const state = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-automation-acceptance-'));
const output = path.join(root, 'artifacts/automation-acceptance', String(Date.now()));
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(root, 'zero-system/config/zero.json'), path.join(state, 'config.json'));
const reservation = net.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
const report = { classification: ['INTEGRATION', 'REAL_OS'], status: 'RUNNING', startedAt: new Date().toISOString(), port,
  scope: 'Four automation RPC acceptance leaves against isolated state; local HTTP connector probes are not third-party workflow acceptance' };
const environment = { ...process.env, ZERO_PORT: String(port), ZERO_ACCEPTANCE_PORT: String(port), ZERO_DATA_DIR: path.join(state, 'data'),
  ZERO_PREFS_PATH: path.join(state, 'prefs.json'), ZERO_SKILLS_DIR: path.join(state, 'skills'), OPENCLAW_CONFIG_PATH: path.join(state, 'config.json') };
let host, testChild;
try {
  host = spawn(process.execPath, [path.join(root, 'backend/server/zero-host.mjs')], { cwd: root, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  host.stdout.resume(); host.stderr.resume();
  const deadline = Date.now() + 30000;
  let ready = false;
  while (Date.now() < deadline) {
    if (host.exitCode !== null) throw new Error(`Isolated host exited: ${host.exitCode}`);
    try { ready = (await fetch(`http://127.0.0.1:${port}/health`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Isolated host startup timeout');
  const log = fs.createWriteStream(path.join(output, 'test-output.txt'));
  testChild = spawn(process.execPath, ['--test', '--test-timeout=45000', 'test/phase11-automation-connectors.test.mjs'], {
    cwd: root, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  testChild.stdout.pipe(log, { end: false }); testChild.stderr.pipe(log, { end: false });
  const timer = setTimeout(() => { report.timedOut = true; testChild.kill(); }, 60000);
  const [exitCode] = await once(testChild, 'close'); clearTimeout(timer);
  await new Promise(resolve => log.end(resolve));
  report.exitCode = exitCode; report.status = exitCode === 0 && !report.timedOut ? 'PASS' : 'FAIL';
} catch (error) { report.status = 'FAIL'; report.error = error.message; }
finally {
  if (testChild?.exitCode === null) testChild.kill();
  if (host?.exitCode === null) { const closed = once(host, 'close'); host.kill(); await closed; }
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, output, retainedIsolatedState: state }, null, 2));
  process.exitCode = report.status === 'PASS' ? 0 : 1;
}
