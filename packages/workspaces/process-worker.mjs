import { spawn } from 'node:child_process';
import path from 'node:path';

// This is an execution directory, not an OS security sandbox.
export function executeProcess({ execution, workspace, signal }) {
  if (!workspace) throw new Error('Local process execution requires a workspaceId');
  if (execution?.type !== 'process' || !path.isAbsolute(execution.command || '')
    || !Array.isArray(execution.args) || execution.args.some((arg) => typeof arg !== 'string')) {
    throw new Error('Process execution requires type=process, an absolute command, and string args');
  }
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let failure;
    let stopping = false;
    const child = spawn(execution.command, execution.args, {
      cwd: workspace.rootDir, shell: false, windowsHide: true,
      detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stop = () => {
      if (stopping || !child.pid || child.exitCode !== null) return;
      stopping = true;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => child.kill());
      } else {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
      }
    };
    const onAbort = () => { failure = signal.reason || new Error('Worker cancelled'); stop(); };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
    const capture = (kind, chunk) => {
      if (kind === 'stdout') stdout += chunk;
      else stderr += chunk;
      if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > 1024 * 1024) {
        stdout = stdout.slice(0, 512 * 1024);
        stderr = stderr.slice(0, 512 * 1024);
        failure = new Error('Worker output exceeded 1 MiB');
        stop();
      }
    };
    child.stdout.setEncoding('utf8').on('data', (chunk) => capture('stdout', chunk));
    child.stderr.setEncoding('utf8').on('data', (chunk) => capture('stderr', chunk));
    child.on('error', (error) => { failure = error; });
    child.on('close', (exitCode, exitSignal) => {
      signal.removeEventListener('abort', onAbort);
      const result = { pid: child.pid, exitCode, exitSignal, stdout, stderr };
      if (failure || exitCode !== 0) {
        const error = failure || new Error(`Worker process exited with code ${exitCode}: ${stderr.slice(-1024)}`);
        error.result = result;
        reject(error);
      } else resolve(result);
    });
  });
}
