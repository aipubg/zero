// Zero's own terminal: long-lived PowerShell / cmd sessions with live output.
// Both the owner (from the UI) and Zero (through the `terminal` tool) type
// into the same sessions, so the owner can watch what Zero runs.
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_BUFFER = 256 * 1024;      // kept per session for late viewers
const MAX_SESSIONS = 12;
const SHELLS = {
  powershell: { file: 'powershell.exe', args: ['-NoLogo', '-NoProfile', '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', '-'] },
  cmd: { file: 'cmd.exe', args: ['/Q', '/K'] },
};

export class TerminalManager extends EventEmitter {
  constructor({ defaultCwd = process.cwd() } = {}) {
    super();
    this.defaultCwd = defaultCwd;
    this.sessions = new Map();
  }

  list() {
    return [...this.sessions.values()].map(s => this._public(s));
  }

  _public(s) {
    return { id: s.id, title: s.title, shell: s.shell, cwd: s.cwd, owner: s.owner, pid: s.child.pid, alive: s.alive, busy: Boolean(s.pending), createdAt: s.createdAt, lastActivityAt: s.lastActivityAt, exitCode: s.exitCode ?? null };
  }

  get(id) {
    const s = this.sessions.get(String(id || ''));
    if (!s) throw new Error(`No terminal session '${id}'`);
    return s;
  }

  open({ shell = 'powershell', cwd, title, owner = 'owner' } = {}) {
    if (!SHELLS[shell]) throw new Error(`Unknown shell '${shell}' (use powershell or cmd)`);
    const alive = [...this.sessions.values()].filter(s => s.alive);
    if (alive.length >= MAX_SESSIONS) throw new Error(`At most ${MAX_SESSIONS} terminals can be open`);
    const dir = path.resolve(cwd || this.defaultCwd);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error(`Folder not found: ${dir}`);
    const spec = SHELLS[shell];
    const child = spawn(spec.file, spec.args, { cwd: dir, windowsHide: true, env: { ...process.env, TERM: 'dumb' } });
    const id = 'term-' + crypto.randomBytes(4).toString('hex');
    const s = { id, shell, cwd: dir, owner, title: title || (owner === 'zero' ? 'Zero' : shell === 'cmd' ? 'Command Prompt' : 'PowerShell'),
      child, alive: true, buffer: '', pending: null, createdAt: Date.now(), lastActivityAt: Date.now() };
    const onData = stream => chunk => this._output(s, chunk.toString('utf8'), stream);
    child.stdout.on('data', onData('stdout'));
    child.stderr.on('data', onData('stderr'));
    child.on('exit', code => {
      s.alive = false; s.exitCode = code;
      if (s.pending) { s.pending.finish({ timedOut: false, exited: true }); }
      this.emit('exit', { id, code });
    });
    child.on('error', error => this._output(s, `\n[terminal error] ${error.message}\n`, 'stderr'));
    this.sessions.set(id, s);
    if (shell === 'powershell') this._send(s, "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; function prompt { '' }");
    this._output(s, `${s.title} — ${dir}\n`, 'system');
    this.emit('open', this._public(s));
    return this._public(s);
  }

  _output(s, data, stream) {
    s.lastActivityAt = Date.now();
    let shown = data;
    // While a command is awaited, its output is collected up to the marker
    // line. The marker itself is never shown to viewers.
    if (s.pending && stream !== 'system' && stream !== 'echo') {
      const { marker } = s.pending;
      s.pending.output += data;
      shown = data.replace(new RegExp(`[^\\n]*${marker}[^\\n]*\\n?`, 'g'), '');
      const m = s.pending.output.match(new RegExp(`${marker}:(-?\\d+)`));
      if (m) s.pending.finish({ output: s.pending.output.slice(0, m.index), exitCode: Number(m[1]) });
    }
    if (!shown) return;
    s.buffer = (s.buffer + shown).slice(-MAX_BUFFER);
    this.emit('output', { id: s.id, data: shown, stream });
  }

  _send(s, text) {
    if (!s.alive) throw new Error('This terminal has ended');
    s.child.stdin.write(text.replace(/\r?\n$/, '') + '\r\n');
  }

  /** Type a line as if at the keyboard (owner input). Echoes it to viewers. */
  write(id, text, { echo = true, by = 'owner' } = {}) {
    const s = this.get(id);
    if (echo) this._output(s, `${by === 'zero' ? 'Zero' : ''}> ${text}\n`, 'echo');
    this._send(s, String(text));
    return { ok: true };
  }

  /** Run a command and wait for it to finish; returns its output. */
  run(id, command, { timeoutMs = 120000, by = 'zero' } = {}) {
    const s = this.get(id);
    if (s.pending) throw new Error('This terminal is still running a command; wait or open another terminal');
    const marker = '__ZERO_DONE_' + crypto.randomBytes(3).toString('hex');
    // $? right after the command: false for a failed cmdlet or native program.
    const tail = s.shell === 'cmd' ? `echo ${marker}:%ERRORLEVEL%` : `$__zeroOk = $?; Write-Output ('${marker}:' + $(if ($__zeroOk) { 0 } else { 1 }))`;
    return new Promise(resolve => {
      const started = Date.now();
      const timer = setTimeout(() => finish({ timedOut: true }), Math.max(1000, Math.min(timeoutMs, 600000)));
      const finish = extra => {
        if (!s.pending || s.pending.marker !== marker) return;
        clearTimeout(timer);
        const output = (extra.output ?? s.pending.output).replace(/\r/g, '');
        s.pending = null;
        resolve({ ok: !extra.timedOut && !extra.exited && (extra.exitCode === 0 || extra.exitCode === null), id: s.id, command, output: output.slice(-60000),
          exitCode: extra.exitCode ?? null, timedOut: Boolean(extra.timedOut), exited: Boolean(extra.exited), durationMs: Date.now() - started,
          note: extra.timedOut ? 'Still running in the terminal; read it later or send Ctrl+C by closing the terminal.' : undefined });
      };
      s.pending = { marker, output: '', finish };
      this._output(s, `${by === 'zero' ? 'Zero' : ''}> ${command}\n`, 'echo');
      this._send(s, `${command}\n${tail}`);
    });
  }

  read(id, { tail = 20000 } = {}) {
    const s = this.get(id);
    return { ...this._public(s), output: s.buffer.slice(-tail) };
  }

  close(id) {
    const s = this.get(id);
    if (s.alive) {
      try { spawn('taskkill', ['/PID', String(s.child.pid), '/T', '/F'], { windowsHide: true }); } catch {}
      s.alive = false;
    }
    this.sessions.delete(s.id);
    this.emit('close', { id: s.id });
    return { ok: true, id: s.id };
  }

  /** Open a real, visible terminal window on the desktop running a command. */
  openExternal({ command = '', cwd, shell = 'powershell' } = {}) {
    const dir = path.resolve(cwd || this.defaultCwd);
    const wt = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'wt.exe');
    const inner = shell === 'cmd'
      ? ['cmd.exe', '/K', command || 'echo Zero opened this window']
      : ['powershell.exe', '-NoExit', '-NoLogo', '-Command', command || "Write-Host 'Zero opened this window'"];
    let child;
    if (fs.existsSync(wt)) child = spawn(wt, ['-d', dir, ...inner], { detached: true, stdio: 'ignore' });
    else child = spawn('cmd.exe', ['/c', 'start', '"Zero"', '/D', dir, ...inner], { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
    return { ok: true, opened: fs.existsSync(wt) ? 'Windows Terminal' : 'console window', cwd: dir, command,
      note: 'This window belongs to the desktop. Zero cannot read its output; use the terminal tool\'s own sessions when the output matters.' };
  }

  closeAll() {
    for (const id of [...this.sessions.keys()]) { try { this.close(id); } catch {} }
  }
}

export const terminalManager = new TerminalManager({ defaultCwd: path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..') });

/** Handler for the `terminal` tool. */
export async function terminalTool(params = {}) {
  const action = String(params.action || (params.command ? 'run' : 'list')).toLowerCase();
  const m = terminalManager;
  switch (action) {
    case 'list': return { ok: true, terminals: m.list() };
    case 'open': return { ok: true, terminal: m.open({ shell: params.shell, cwd: params.cwd, title: params.title, owner: 'zero' }) };
    case 'run': {
      let id = params.id || params.terminalId;
      if (!id) {
        const own = m.list().find(t => t.owner === 'zero' && t.alive && !t.busy);
        id = own ? own.id : m.open({ shell: params.shell, cwd: params.cwd, owner: 'zero' }).id;
      }
      if (!params.command) throw new Error('terminal run needs a command');
      const result = await m.run(id, String(params.command), { timeoutMs: Number(params.timeoutMs) || 120000, by: 'zero' });
      // The shell's own exit status is the evidence the command finished.
      return { ...result, executed: true, verified: !result.timedOut, taskComplete: result.ok,
        evidence: { execution: 'terminal-session-exit-status', exitCode: result.exitCode },
        outcome: result.ok ? 'COMPLETED' : result.timedOut ? 'UNVERIFIED' : 'FAILED' };
    }
    case 'send': case 'write': {
      if (!params.id && !params.terminalId) throw new Error('terminal send needs the terminal id');
      return m.write(params.id || params.terminalId, String(params.text ?? params.command ?? ''), { by: 'zero' });
    }
    case 'read': return { ok: true, ...m.read(params.id || params.terminalId, { tail: Number(params.tail) || 20000 }) };
    case 'close': return m.close(params.id || params.terminalId);
    case 'open_external': case 'external': return m.openExternal({ command: params.command, cwd: params.cwd, shell: params.shell });
    default: throw new Error(`Unknown terminal action '${action}'. Use list, open, run, send, read, close or open_external.`);
  }
}
