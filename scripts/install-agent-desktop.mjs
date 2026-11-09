/** Pinned native release installer. No global npm install, postinstall or prompts. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { AGENT_DESKTOP_SHA256, AGENT_DESKTOP_VERSION } from '../packages/agent-runtime/agent-desktop.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('This pinned installer supports Windows x64');
const directory = path.join(root, 'artifacts/agent-desktop-runtime');
const binary = path.join(directory, 'bin/agent-desktop.exe');
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.mkdirSync(path.dirname(binary), { recursive: true });
if (!fs.existsSync(binary)) {
  const staging = fs.mkdtempSync(path.join(directory, 'install-'));
  try {
    const url = `https://github.com/vercel-labs/agent-desktop/releases/download/v${AGENT_DESKTOP_VERSION}/agent-desktop-v${AGENT_DESKTOP_VERSION}-x86_64-pc-windows-msvc.tar.gz`;
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`agent-desktop release HTTP ${response.status}`);
    const chunks = []; let size = 0;
    for await (const chunk of response.body) { size += chunk.length; if (size > 64 * 1024 * 1024) throw new Error('Release archive exceeds limit'); chunks.push(chunk); }
    const bytes = Buffer.concat(chunks);
    if (createHash('sha256').update(bytes).digest('hex') !== 'a4199f741a441cedd349bf56c5eba01783b1261258b498efeb7ec9945220c3e8') throw new Error('Release archive SHA-256 mismatch');
    const archive = path.join(staging, randomUUID() + '.tar.gz'); fs.writeFileSync(archive, bytes, { flag: 'wx' });
    const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/tar.exe');
    const entries = execFileSync(tar, ['-tzf', archive], { encoding: 'utf8', windowsHide: true }).trim().split(/\r?\n/);
    if (JSON.stringify(entries) !== JSON.stringify(['agent-desktop.exe'])) throw new Error('Unexpected archive contents');
    execFileSync(tar, ['-xzf', archive, '-C', staging], { windowsHide: true });
    const extracted = path.join(staging, 'agent-desktop.exe');
    if (!fs.lstatSync(extracted).isFile() || hash(extracted) !== AGENT_DESKTOP_SHA256) throw new Error('Executable SHA-256 mismatch');
    fs.linkSync(extracted, binary);
  } finally {
    if (path.dirname(staging) !== directory || !path.basename(staging).startsWith('install-')) throw new Error('Unexpected staging path; preserved');
    fs.rmSync(staging, { recursive: true, force: true });
  }
}
if (hash(binary) !== AGENT_DESKTOP_SHA256) throw new Error('Existing binary differs; preserved for inspection');
const result = { status: 'INSTALLED_AND_HASH_VERIFIED', version: AGENT_DESKTOP_VERSION, binarySha256: hash(binary), source: 'https://github.com/vercel-labs/agent-desktop', license: 'Apache-2.0', functionalAcceptance: 'Separate real OS tests required' };
fs.copyFileSync(path.join(root, 'docs/third-party/agent-desktop-LICENSE.txt'), path.join(directory, 'LICENSE-upstream.txt'));
fs.writeFileSync(path.join(directory, 'installation.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
