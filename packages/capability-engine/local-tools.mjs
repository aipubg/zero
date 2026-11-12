import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';

const execute = promisify(execFile);
/** Trusted local-owner tools. Authentication and remote authority belong to the host. */
export function registerLocalTools(engine, { cwd = process.cwd() } = {}) {
  const location = value => {
    if (typeof value !== 'string' || !value || value.includes('\0')) throw new Error('A valid filesystem path is required');
    return path.resolve(cwd, value);
  };
  engine.registerCapability({ name: 'read_file', description: 'Read a UTF-8 local file, including skill instructions and supporting scripts.',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    handler: async ({ path: file }) => {
      const resolved = location(file);
      if ((await fs.stat(resolved)).size > 4 * 1024 * 1024) throw new Error('File exceeds the 4 MiB text-read limit');
      const content = await fs.readFile(resolved, 'utf8');
      return { ok: true, path: resolved, content, verified: true, evidence: { bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') } };
    } });
  engine.registerCapability({ name: 'write_file', description: 'Create or update a UTF-8 local file and read it back to verify the write.',
    parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
    handler: async ({ path: file, content }) => {
      if (typeof content !== 'string' || Buffer.byteLength(content) > 4 * 1024 * 1024) throw new Error('Expected at most 4 MiB of UTF-8 text');
      const resolved = location(file);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, content, 'utf8');
      const actual = await fs.readFile(resolved, 'utf8');
      return { ok: actual === content, path: resolved, verified: actual === content,
        evidence: { bytes: Buffer.byteLength(actual), sha256: createHash('sha256').update(actual).digest('hex') } };
    } });
  engine.registerCapability({ name: 'run_process', description: 'Zero Terminal & Security Ops: execute any local program or command line, including PowerShell/bash pipelines, Python scripts, network and security tooling (nmap, curl, git, ffmpeg, gh) and bug-hunting scripts. Set shell=true for a shell command line; flags are passed through verbatim to non-cmd executables.',
    parameters: { type: 'object', properties: { command: { type: 'string' }, args: { type: 'array', items: { type: 'string' } }, cwd: { type: 'string' }, timeoutMs: { type: 'number' }, shell: { type: 'boolean', description: 'Run command as a shell command line (PowerShell on Windows, bash elsewhere).' }, shellExecutable: { type: 'string', description: 'Optional shell executable, e.g. powershell.exe or bash.exe.' } }, required: ['command'] },
    handler: async ({ command, args = [], cwd: directory, timeoutMs = 15000, shell = false, shellExecutable = '' }, signal) => {
      if (typeof command !== 'string' || !command || !Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new Error('Expected a command and an array of string arguments');
      if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) throw new Error('Process timeout must be between 1 and 300000 ms');
      const workingDirectory = directory ? location(directory) : cwd;
      // Guard against interactive cmd shells that wait forever on stdin: replace /k with /c only for cmd.exe.
      // No other executable ever has its flags rewritten.
      let safeArgs = [...args];
      let executable = command;
      if (/^(cmd|cmd\.exe)$/i.test(path.basename(executable))) {
        safeArgs = safeArgs.map(arg => (/^[\/-]k$/i.test(arg) ? '/c' : arg));
        if (!safeArgs.some(a => /^[\/-][cC]$/.test(a))) {
          safeArgs = ['/c', ...safeArgs];
        }
      }
      if (shell && !args.length) {
        const requestedShell = String(shellExecutable || '').trim();
        if (requestedShell) {
          executable = requestedShell;
          safeArgs = /powershell/i.test(requestedShell)
            ? ['-NoProfile', '-NonInteractive', '-Command', command]
            : ['-lc', command];
        } else {
          // Native shell command line. The command string is passed as one
          // program token so quotes and flags stay intact.
          safeArgs = [];
        }
      }
      try {
        const result = await execute(executable, safeArgs, { cwd: workingDirectory, windowsHide: true, timeout: timeoutMs, ...(signal ? { signal } : {}), maxBuffer: 4 * 1024 * 1024, ...(shell && !safeArgs.length ? { shell: true } : {}) });
        return { ok: true, executed: true, stdout: result.stdout, stderr: result.stderr, exitCode: 0, verified: true,
          evidence: { execution: 'child-process-exit', exitCode: 0, cwd: workingDirectory, shell: Boolean(shell) } };
      } catch (error) {
        return { ok: false, executed: error.code !== 'ENOENT', stdout: error.stdout || '', stderr: error.stderr || '',
          exitCode: typeof error.code === 'number' ? error.code : null, error: error.message,
          outcome: signal?.aborted ? 'CANCELLED' : 'FAILED', verified: false };
      }
    } });
}
