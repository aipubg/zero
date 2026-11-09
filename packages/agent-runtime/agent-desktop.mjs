import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
export const AGENT_DESKTOP_VERSION = '1.2.0';
export const AGENT_DESKTOP_SHA256 = 'd274667031322e50b9c2b1ab81c2ca46835d52cc932769a5c34bd4d481fd94c3';
export const DESKTOP_OBSERVATIONS = new Set(['status', 'version', 'snapshot', 'find', 'get', 'is', 'list-apps', 'list-windows', 'list-displays', 'list-surfaces', 'skills', 'wait', 'clipboard-get', 'screenshot', 'list-notifications']);
const commands = new Set([...DESKTOP_OBSERVATIONS, 'click', 'double-click', 'right-click', 'type', 'set-value', 'clear', 'focus', 'select', 'toggle', 'check', 'uncheck', 'expand', 'collapse', 'scroll', 'scroll-to', 'press', 'hover', 'drag', 'mouse-move', 'mouse-click', 'mouse-wheel', 'launch', 'close-app', 'focus-window', 'resize-window', 'move-window', 'minimize', 'maximize', 'restore', 'clipboard-set', 'clipboard-clear', 'dismiss-notification', 'dismiss-all-notifications', 'notification-action', 'open-system-surface']);
export const DESKTOP_COMMANDS = Object.freeze([...commands]);

/** Primary semantic desktop transport. No shell, automatic retry or action fallback. */
export class AgentDesktop {
  constructor({ binary = path.join(root, 'artifacts/agent-desktop-runtime/bin/agent-desktop.exe'), stateDir = path.join(process.env.ZERO_DATA_DIR || path.join(root, '.zero-data'), 'agent-desktop') } = {}) {
    this.binary = path.resolve(binary); this.stateDir = path.resolve(stateDir);
  }
  async execute({ command, args = [], input, headed = false }, signal) {
    if (typeof headed !== 'boolean') throw new Error('headed must be a boolean');
    if (!commands.has(command) || !Array.isArray(args) || args.length > 128 || args.some(arg => typeof arg !== 'string' || arg.includes('\0') || arg.length > 32768)) throw new Error('Invalid agent-desktop command or arguments');
    if (input !== undefined && (typeof input !== 'string' || Buffer.byteLength(input) > 128 * 1024 || !['type', 'set-value', 'clipboard-set'].includes(command))) throw new Error('Desktop stdin accepts at most 128 KiB of text for text commands');
    signal?.throwIfAborted();
    if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Pinned ZERO agent-desktop runtime currently supports Windows x64');
    if (!fs.existsSync(this.binary)) throw new Error('agent-desktop runtime missing; run node scripts/install-agent-desktop.mjs');
    if (createHash('sha256').update(await fs.promises.readFile(this.binary)).digest('hex') !== AGENT_DESKTOP_SHA256) throw new Error('agent-desktop binary differs from pinned verified release');
    fs.mkdirSync(this.stateDir, { recursive: true });
    const argv = [...(headed ? ['--headed'] : []), command, ...args, ...(input !== undefined ? ['--stdin'] : [])];
    return new Promise((resolve, reject) => {
      const child = spawn(this.binary, argv, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], signal, env: { ...process.env, AGENT_DESKTOP_HOME: this.stateDir } });
      let stdout = ''; let stderr = ''; let overflow = false;
      const timer = setTimeout(() => { overflow = true; child.kill(); }, 90000);
      child.stdout.on('data', data => { stdout += data; if (Buffer.byteLength(stdout) > 16 * 1024 * 1024) { overflow = true; child.kill(); } });
      child.stderr.on('data', data => { if (stderr.length < 16384) stderr += data; });
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('close', code => {
        clearTimeout(timer);
        if (signal?.aborted) { reject(signal.reason || new Error('Desktop operation cancelled; inspect live state before retry')); return; }
        if (overflow) { reject(new Error('Desktop command exceeded time/output limit; delivery unknown, inspect before retry')); return; }
        try {
          const result = JSON.parse(stdout.trim());
          if (typeof result.ok !== 'boolean' || result.command !== command || (code !== 0 && result.ok)) throw new Error('Invalid desktop protocol response');
          const disposition = result.data?.disposition || result.error?.disposition;
          resolve({ ...result, backend: 'agent-desktop', runtimeVersion: AGENT_DESKTOP_VERSION, verified: disposition?.delivery === 'delivered_verified', ...(disposition?.delivery === 'delivered_verified' ? { evidence: { disposition } } : {}), ...(disposition ? { disposition } : {}), ...(DESKTOP_OBSERVATIONS.has(command) && result.ok ? { observed: true } : {}) });
        } catch (error) { reject(new Error(`agent-desktop protocol failure: ${error.message}; delivery unknown${stderr ? '; native diagnostics available' : ''}`)); }
      });
      child.stdin.on('error', () => {}); child.stdin.end(input || '');
    });
  }
}
