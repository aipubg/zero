import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

const root = fileURLToPath(new URL('../../', import.meta.url));
export const ZERO_DESKTOP_VERSION = '1.2.0';
export const ZERO_DESKTOP_SHA256 = 'd274667031322e50b9c2b1ab81c2ca46835d52cc932769a5c34bd4d481fd94c3';
export const DESKTOP_OBSERVATIONS = new Set(['status', 'version', 'snapshot', 'find', 'get', 'is', 'list-apps', 'list-windows', 'list-displays', 'list-surfaces', 'skills', 'wait', 'clipboard-get', 'screenshot', 'list-notifications']);
const commands = new Set([...DESKTOP_OBSERVATIONS, 'click', 'double-click', 'right-click', 'type', 'set-value', 'clear', 'focus', 'select', 'toggle', 'check', 'uncheck', 'expand', 'collapse', 'scroll', 'scroll-to', 'press', 'hover', 'drag', 'mouse-move', 'mouse-click', 'mouse-wheel', 'launch', 'close-app', 'focus-window', 'resize-window', 'move-window', 'minimize', 'maximize', 'restore', 'clipboard-set', 'clipboard-clear', 'dismiss-notification', 'dismiss-all-notifications', 'notification-action', 'open-system-surface']);
export const DESKTOP_COMMANDS = Object.freeze([...commands]);

const verifiedBinaries = new Map();
const privateStateReadyMap = new Map();

/** Primary semantic desktop transport. No shell, automatic retry or action fallback. */
export class ZeroDesktop {
  constructor({ binary = path.join(root, 'artifacts/zero-desktop-runtime/bin/zero-desktop.exe'), stateDir = path.join(process.env.ZERO_DATA_DIR || path.join(root, '.zero-data'), 'zero-desktop') } = {}) {
    this.binary = path.resolve(binary); this.stateDir = path.resolve(stateDir);
  }
  async execute({ command, args = [], input, headed = true, onStarted }, signal) {
    if (typeof headed !== 'boolean') throw new Error('headed must be a boolean');
    if (onStarted !== undefined && typeof onStarted !== 'function') throw new Error('onStarted must be a function');
    if (!commands.has(command) || !Array.isArray(args) || args.length > 128 || args.some(arg => typeof arg !== 'string' || arg.includes('\0') || arg.length > 32768)) throw new Error('Invalid zero-desktop command or arguments');
    if (input !== undefined && (typeof input !== 'string' || Buffer.byteLength(input) > 128 * 1024 || !['type', 'set-value', 'clipboard-set'].includes(command))) throw new Error('Desktop stdin accepts at most 128 KiB of text for text commands');
    signal?.throwIfAborted();
    if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Pinned ZERO zero-desktop runtime currently supports Windows x64');
    const stat = await fs.promises.stat(this.binary).catch(() => null);
    if (!stat) throw new Error('zero-desktop runtime missing; run node scripts/install-zero-desktop.mjs');
    const cached = verifiedBinaries.get(this.binary);
    if (!cached || cached.size !== stat.size || cached.mtimeMs !== stat.mtimeMs) {
      const hash = createHash('sha256').update(await fs.promises.readFile(this.binary)).digest('hex');
      if (hash !== ZERO_DESKTOP_SHA256) throw new Error('zero-desktop binary differs from pinned verified release');
      verifiedBinaries.set(this.binary, { size: stat.size, mtimeMs: stat.mtimeMs, verifiedAt: Date.now() });
    }
    fs.mkdirSync(this.stateDir, { recursive: true });
    let statePromise = privateStateReadyMap.get(this.stateDir);
    if (!statePromise) {
      statePromise = execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('./private-state.ps1', import.meta.url)), '-Directory', this.stateDir], { windowsHide: true, timeout: 10000, maxBuffer: 65536, signal }).catch(error => { privateStateReadyMap.delete(this.stateDir); throw error; });
      privateStateReadyMap.set(this.stateDir, statePromise);
    }
    await statePromise;
    signal?.throwIfAborted();
    const argv = [...(headed ? ['--headed'] : []), command, ...args, ...(input !== undefined ? ['--stdin'] : [])];
    return new Promise(resolve => {
      const child = spawn(this.binary, argv, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], signal, env: { ...process.env, ZERO_DESKTOP_HOME: this.stateDir } });
      let stdout = ''; let stderr = ''; let overflow = false; let spawnError; let started = false;
      const failure = (code, message, delivered) => ({ ok: false, command, backend: 'zero-desktop', verified: false, error: { code, message }, disposition: { delivery: delivered ? 'unknown' : 'not_delivered', retry: delivered ? 'unsafe' : 'safe' }, requiresObservation: delivered });
      child.once('spawn', () => { started = true; try { onStarted?.({ pid: child.pid }); } catch (error) { spawnError = error; child.kill(); } });
      const timer = setTimeout(() => { overflow = true; child.kill(); }, 90000);
      child.stdout.on('data', data => { stdout += data; if (Buffer.byteLength(stdout) > 16 * 1024 * 1024) { overflow = true; child.kill(); } });
      child.stderr.on('data', data => { if (stderr.length < 16384) stderr += data; });
      child.on('error', error => { spawnError = error; });
      child.on('close', async code => {
        clearTimeout(timer);
        if (signal?.aborted) { resolve(failure('DESKTOP_CANCELLED', 'Desktop command cancelled; inspect live state before another action', started)); return; }
        if (overflow) { resolve(failure('DESKTOP_LIMIT_EXCEEDED', 'Desktop command exceeded time/output limit; inspect live state before another action', started)); return; }
        if (spawnError) { resolve(failure('DESKTOP_PROCESS_FAILED', 'Desktop command process failed', started)); return; }
        try {
          const result = JSON.parse(stdout.trim());
          if (!result.ok && (command === 'list-windows' || command === 'list-apps')) {
            try {
              const Driver = await import('../../app/zero-control-ui/src/computer/windows-driver.js');
              const fallback = command === 'list-windows' ? await Driver.listWindows(signal) : await Driver.listApps(signal);
              if (fallback && fallback.ok !== false) {
                resolve({
                  version: '2.6',
                  ok: true,
                  command,
                  data: fallback,
                  backend: 'windows-driver-fallback',
                  runtimeVersion: ZERO_DESKTOP_VERSION,
                  verified: true,
                  completed: true,
                  outcome: 'COMPLETED',
                  requiresObservation: false,
                  observed: true,
                  evidence: { disposition: { delivery: 'observed_verified', command } }
                });
                return;
              }
            } catch {}
          }
          if (typeof result.ok !== 'boolean' || result.command !== command || (code !== 0 && result.ok)) throw new Error('Invalid desktop protocol response');
          const disposition = result.data?.disposition || result.error?.disposition;
          const isObserved = DESKTOP_OBSERVATIONS.has(command) && result.ok;
          const isDelivered = disposition?.delivery === 'delivered_verified';
          const verified = result.ok && (isDelivered || isObserved);
          resolve({
            ...result,
            backend: 'zero-desktop',
            runtimeVersion: ZERO_DESKTOP_VERSION,
            verified,
            completed: verified,
            outcome: verified ? 'COMPLETED' : (result.ok ? 'UNVERIFIED' : 'FAILED'),
            requiresObservation: Boolean(disposition && disposition.delivery !== 'delivered_verified' && disposition.retry !== 'safe' && !isObserved),
            ...(verified ? { evidence: { disposition: disposition || { delivery: 'observed_verified', command } } } : {}),
            ...(disposition ? { disposition } : {}),
            ...(isObserved ? { observed: true } : {})
          });
        } catch (error) { resolve(failure('DESKTOP_PROTOCOL_FAILED', `Native protocol failure: ${error.message}; inspect live state${stderr ? '; native diagnostics available' : ''}`, started)); }
      });
      child.stdin.on('error', () => {}); child.stdin.end(input || '');
    });
  }
}
