import { spawn } from 'node:child_process';
import { once } from 'node:events';

/** Owned stdio JSON-RPC connection for executable MCP plugins. No implicit shell. */
export class McpStdio {
  constructor(entry, args = []) {
    if (typeof entry !== 'string' || !Array.isArray(args) || args.some(value => typeof value !== 'string')) throw new Error('MCP entry and string arguments required');
    this.entry = entry; this.args = args; this.pending = new Map(); this.sequence = 0; this.child = null; this.buffer = '';
  }
  async start() {
    if (this.child) throw new Error('MCP process already started');
    const environment = {};
    for (const name of ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOME']) if (process.env[name]) environment[name] = process.env[name];
    const child = spawn(process.execPath, [this.entry, ...this.args], { env: environment, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    this.child = child;
    const fail = () => { for (const request of this.pending.values()) request.reject(new Error('MCP process disconnected')); this.pending.clear(); };
    child.on('error', fail); child.on('close', fail); child.stdin.on('error', fail);
    child.stderr.resume(); // Never persist server logs containing local file contents.
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      this.buffer += chunk.toString();
      if (Buffer.byteLength(this.buffer) > 8 * 1024 * 1024) { fail(); child.kill(); return; }
      let newline;
      while ((newline = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, newline); this.buffer = this.buffer.slice(newline + 1);
        if (!line.trim()) continue;
        let message;
        try { message = JSON.parse(line); } catch { fail(); child.kill(); return; }
        if (message.method && message.id !== undefined) {
          child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Client method not supported' } }) + '\n');
          continue;
        }
        const request = this.pending.get(message.id);
        if (!request) continue;
        message.error ? request.reject(new Error(`MCP error ${message.error.code}: ${message.error.message}`)) : request.resolve(message.result);
      }
    });
    try {
      const initialized = await this.request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'zero-plugin-host', version: '1.0.0' } });
      if (!initialized?.capabilities?.tools) throw new Error('MCP server declares no executable tools');
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      return initialized;
    } catch (error) { await this.close(); throw error; }
  }
  request(method, params, { signal, timeoutMs = 30000 } = {}) {
    if (!this.child || this.child.exitCode !== null || this.child.killed) return Promise.reject(new Error('MCP process is not running'));
    if (this.pending.size >= 32) return Promise.reject(new Error('Too many outstanding MCP requests'));
    if (signal?.aborted) return Promise.reject(signal.reason || new Error('MCP request aborted'));
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const finish = (callback, value) => { clearTimeout(timer); signal?.removeEventListener('abort', aborted); this.pending.delete(id); callback(value); };
      const aborted = () => {
        if (!this.child.killed && this.child.exitCode === null) this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: id, reason: 'Request cancelled' } }) + '\n');
        finish(reject, signal?.reason || new Error('MCP request timed out'));
      };
      const timer = setTimeout(aborted, timeoutMs);
      this.pending.set(id, { resolve: value => finish(resolve, value), reject: error => finish(reject, error) });
      signal?.addEventListener('abort', aborted, { once: true });
      this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }
  async close() {
    const child = this.child;
    if (!child) return;
    if (child.exitCode === null && child.signalCode === null) { const closed = once(child, 'close'); child.kill(); await closed; }
    this.child = null;
  }
}
