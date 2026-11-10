import { spawn } from 'node:child_process';
import path from 'node:path';

function failure(code, message) { return Object.assign(new Error(message), { code }); }

/** Bounded Git transport. Await process-tree termination before reporting cancellation. */
export function runGit(args, { timeoutMs = 120000, signal, cwd, maxOutputBytes = 1024 * 1024 } = {}) {
  if (!Array.isArray(args) || args.some(value => typeof value !== 'string' || value.includes('\0'))) throw new Error('Git arguments must be strings without NUL');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 120000) throw new Error('Git timeout must be a positive duration up to 120000ms');
  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes < 1 || maxOutputBytes > 1024 * 1024) throw new Error('Git output bound must be between 1 and 1048576 bytes');
  signal?.throwIfAborted();
  const child = spawn('git', args, { cwd, shell: false, windowsHide: true, detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' } });
  const operation = new Promise((resolve, reject) => {
    let stdout = '', stderr = '', bytes = 0, error, stopped = false, settled = false;
    let closed, killerPending = false, treeExitConfirmed = false, drainTimer;
    const finish = () => {
      if (settled || !closed || killerPending) return;
      settled = true; clearTimeout(timer); clearTimeout(drainTimer); signal?.removeEventListener('abort', onAbort);
      const result = { pid: child.pid, stdout, stderr, exitCode: closed.code, exitSignal: closed.signal };
      if (error || closed.code !== 0) {
        const cause = error || failure('GIT_EXIT_FAILED', `Git command failed (exit ${closed.code})`);
        Object.assign(cause, result, { childTreeExitConfirmed: stopped ? treeExitConfirmed : true });
        reject(cause);
      } else resolve(result);
    };
    const stop = reason => {
      error ||= reason;
      if (stopped || settled) return;
      stopped = true;
      // If the platform cannot confirm cleanup, fail explicitly rather than
      // hanging forever or turning a killed wrapper into a successful drain.
      drainTimer = setTimeout(() => {
        error = failure('GIT_CLEANUP_UNCONFIRMED', 'Git stopped responding and child-process cleanup could not be confirmed');
        treeExitConfirmed = false; killerPending = false;
        child.kill(); child.stdout.destroy(); child.stderr.destroy();
        closed ||= { code: null, signal: null }; finish();
      }, 6500);
      if (!child.pid) return;
      if (process.platform === 'win32') {
        killerPending = true;
        const systemRoot = process.env.SystemRoot || process.env.WINDIR;
        const command = systemRoot ? path.join(systemRoot, 'System32', 'taskkill.exe') : 'taskkill.exe';
        const killer = spawn(command, ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: 5000 });
        killer.once('error', () => { child.kill(); killerPending = false; finish(); });
        killer.once('close', code => { treeExitConfirmed = code === 0; killerPending = false; finish(); });
      } else {
        try { process.kill(-child.pid, 'SIGKILL'); treeExitConfirmed = true; }
        catch { child.kill('SIGKILL'); }
      }
    };
    const onAbort = () => stop(failure('GIT_CANCELLED', 'Git source acquisition was cancelled'));
    const timer = setTimeout(() => stop(failure('GIT_TIMEOUT', 'Git source acquisition timed out')), timeoutMs);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
    const capture = (channel, chunk) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxOutputBytes) { stop(failure('GIT_OUTPUT_LIMIT', 'Git output exceeded the configured bound')); return; }
      if (channel === 'stdout') stdout += chunk; else stderr += chunk;
    };
    child.stdout.setEncoding('utf8').on('data', chunk => capture('stdout', chunk));
    child.stderr.setEncoding('utf8').on('data', chunk => capture('stderr', chunk));
    child.once('error', () => { error ||= failure('GIT_START_FAILED', 'Git could not be started; verify that Git is installed'); });
    child.once('close', (code, exitSignal) => { closed = { code, signal: exitSignal }; finish(); });
  });
  Object.defineProperty(operation, 'child', { value: child });
  return operation;
}
