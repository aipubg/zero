import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

export const encryptedPrefix = 'zeroenc:v1:';
const bridge = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$inputBytes = [Convert]::FromBase64String($payload.data)
if ($payload.operation -eq 'protect') {
  $result = [Security.Cryptography.ProtectedData]::Protect($inputBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
} else {
  $result = [Security.Cryptography.ProtectedData]::Unprotect($inputBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
}
[Console]::Out.Write([Convert]::ToBase64String($result))
`;

function dpapi(buffer, operation) {
  if (process.platform !== 'win32') throw new Error('Persistent observation encryption requires Windows user DPAPI or an explicit key provider');
  const output = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', bridge], {
    input: JSON.stringify({ operation, data: buffer.toString('base64') }), windowsHide: true, timeout: 10000, maxBuffer: 16384, stdio: ['pipe', 'pipe', 'pipe'],
  });
  return Buffer.from(output.toString('utf8').trim(), 'base64');
}

/** Field keys never appear in SQLite. Persistent keys are bound to the Windows user. */
export class ProtectedFields {
  constructor({ keyPath, key, hasCiphertext = false } = {}) {
    this.keyStorage = key ? 'explicit-provider' : keyPath ? 'ui automationr-dpapi' : 'ephemeral';
    this.key = key ? Buffer.from(key) : null;
    if (!this.key && keyPath) {
      if (!fs.existsSync(keyPath)) {
        if (hasCiphertext) throw new Error('Observation encryption key is missing; restore the original user-bound key');
        const generated = crypto.randomBytes(32);
        const wrapped = dpapi(generated, 'protect');
        try { fs.writeFileSync(keyPath, wrapped, { flag: 'wx', mode: 0o600 }); }
        catch (error) { if (error.code !== 'EEXIST') throw error; }
        generated.fill(0);
      }
      try { this.key = dpapi(fs.readFileSync(keyPath), 'unprotect'); }
      catch { throw new Error('Observation encryption key cannot be unlocked by the current Windows user'); }
    }
    this.key ||= crypto.randomBytes(32);
    if (this.key.length !== 32) throw new Error('Observation encryption requires exactly 32 key bytes');
  }
  seal(column, id, value) {
    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, nonce);
    cipher.setAAD(Buffer.from(`${column}:${id}`));
    const content = Buffer.concat([cipher.update(String(value ?? ''), 'utf8'), cipher.final()]);
    return encryptedPrefix + Buffer.concat([nonce, cipher.getAuthTag(), content]).toString('base64');
  }
  open(column, id, value) {
    if (typeof value !== 'string' || !value.startsWith(encryptedPrefix)) return value;
    try {
      const bytes = Buffer.from(value.slice(encryptedPrefix.length), 'base64');
      if (bytes.length < 28) throw new Error('Invalid encrypted field');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, bytes.subarray(0, 12));
      decipher.setAuthTag(bytes.subarray(12, 28));
      decipher.setAAD(Buffer.from(`${column}:${id}`));
      return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
    } catch { throw new Error(`Observation field authentication failed (${column}); restore the original database/key pair`); }
  }
  destroy() { this.key.fill(0); }
}
