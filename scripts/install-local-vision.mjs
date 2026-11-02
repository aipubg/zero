/** Download pinned official binaries/weights; verify every byte before use. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('This pinned runtime package requires Windows x64');
const runtime = path.join(root, 'artifacts/local-runtime/llama-b11960');
const modelDirectory = path.join(root, 'models/SmolVLM-256M');
const revision = 'b9e4379657e1450d04d02eec8e345667265b0a00';
const downloads = [
  { filename: path.join(runtime, 'runtime.zip'), size: 24407745, sha256: '73f962f82850d244db47eaacb9d913637027b82399124324298576d58c5f4287',
    url: 'https://github.com/ggml-org/llama.cpp/releases/download/b11960/llama-b11960-bin-win-cpu-x64.zip' },
  { filename: path.join(modelDirectory, 'SmolVLM-256M-Instruct-Q8_0.gguf'), size: 175054528, sha256: '2a31195d3769c0b0fd0a4906201666108834848db768af11de1d2cef7cd35e65',
    url: `https://huggingface.co/ggml-org/SmolVLM-256M-Instruct-GGUF/resolve/${revision}/SmolVLM-256M-Instruct-Q8_0.gguf` },
  { filename: path.join(modelDirectory, 'mmproj-SmolVLM-256M-Instruct-Q8_0.gguf'), size: 103769856, sha256: '7e943f7c53f0382a6fc41b6ee0c2def63ba4fded9ab8ed039cc9e2ab905e0edd',
    url: `https://huggingface.co/ggml-org/SmolVLM-256M-Instruct-GGUF/resolve/${revision}/mmproj-SmolVLM-256M-Instruct-Q8_0.gguf` },
];
async function hashFile(filename) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}
async function download(item) {
  fs.mkdirSync(path.dirname(item.filename), { recursive: true });
  if (fs.existsSync(item.filename)) {
    if (fs.statSync(item.filename).size !== item.size || await hashFile(item.filename) !== item.sha256) throw new Error(`Existing file differs from pinned artifact: ${item.filename}; preserved for inspection`);
    console.log(`Verified existing ${path.basename(item.filename)}`); return;
  }
  console.log(`Downloading ${path.basename(item.filename)} (${item.size} bytes)`);
  const response = await fetch(item.url, { signal: AbortSignal.timeout(600000) });
  if (!response.ok || !response.body) throw new Error(`Download HTTP ${response.status}: ${path.basename(item.filename)}`);
  const temporary = `${item.filename}.${crypto.randomUUID()}.download`;
  let bytes = 0;
  const hash = crypto.createHash('sha256');
  try {
    await pipeline(Readable.fromWeb(response.body), new Transform({ transform(chunk, _encoding, callback) {
      bytes += chunk.length;
      if (bytes > item.size) return callback(new Error('Download exceeds pinned artifact size'));
      hash.update(chunk); callback(null, chunk);
    } }), fs.createWriteStream(temporary, { flags: 'wx' }));
    if (bytes !== item.size || hash.digest('hex') !== item.sha256) throw new Error('Pinned artifact hash/size mismatch');
    fs.renameSync(temporary, item.filename);
    console.log(`Verified ${path.basename(item.filename)}`);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
await Promise.all(downloads.map(download));
const entries = execFileSync('tar.exe', ['-tf', downloads[0].filename], { encoding: 'utf8', windowsHide: true }).trim().split(/\r?\n/);
if (entries.some(entry => path.isAbsolute(entry) || entry.split(/[\\/]/).includes('..'))) throw new Error('Unsafe runtime archive path');
execFileSync('tar.exe', ['-xf', downloads[0].filename, '-C', runtime], { windowsHide: true });
const report = { classification: 'REAL_EXTERNAL', status: 'DOWNLOADED_AND_HASH_VERIFIED', inference: 'NOT_RUN', runtime: 'llama.cpp b11960',
  model: 'ggml-org/SmolVLM-256M-Instruct-GGUF', revision, downloads: downloads.map(item => ({ ...item, filename: path.relative(root, item.filename) })),
  documentation: ['https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md', 'https://huggingface.co/ggml-org/SmolVLM-256M-Instruct-GGUF'],
  downloadedAt: new Date().toISOString() };
fs.writeFileSync(path.join(runtime, 'provisioning.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
