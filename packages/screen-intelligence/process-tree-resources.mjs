import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const script = fileURLToPath(new URL('./measure-process-tree.ps1', import.meta.url));
/** Samples only this live Node process and its observed descendants. No command lines. */
export async function sampleOwnedProcessTree() {
  if (process.platform !== 'win32') return { status: 'unavailable', reason: 'Windows process tree sampler required' };
  try {
    const { stdout } = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-RootProcessId', String(process.pid)], { windowsHide: true, timeout: 5000, maxBuffer: 256 * 1024 });
    const result = JSON.parse(stdout.trim());
    if (result.rootPid !== process.pid || !Array.isArray(result.processes) || !result.processes.some(row => row.pid === process.pid) || !Number.isFinite(result.sampledWorkingSetBytes) || result.sampledWorkingSetBytes <= 0) throw new Error('Invalid owned process sample');
    return result;
  } catch (error) { return { status: 'failed', reason: error.killed ? 'Owned process sampler timed out' : 'Owned process sampler failed' }; }
}
