/** Provision pinned official text weights; does not change owner assignments. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { downloadVerifiedGguf } from '../backend/gateway/server/gguf-download-file.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && (args.length !== 1 || args[0] !== '--qwen-3b')) throw new Error('Usage: node scripts/install-local-chat.mjs [--qwen-3b]');
const larger = args[0] === '--qwen-3b';
const directory = path.join(root, larger ? 'artifacts/local-runtime/qwen2.5-3b' : 'artifacts/local-runtime/qwen2.5-0.5b');
const revision = larger ? '7dabda4d13d513e3e842b20f0d435c732f172cbe' : '9217f5db79a29953eb74d5343926648285ec7e67';
const name = larger ? 'qwen2.5-3b-instruct-q5_k_m.gguf' : 'qwen2.5-0.5b-instruct-q5_k_m.gguf';
const size = larger ? 2438740384 : 522186592;
const sha256 = larger ? '2c63dde5f2c9ab1fd64d47dee2d34dade6ba9ff62442d1d20b5342310c982081' : '041474553fcabfc2a2d67903f9d2c2e50bd92528e670da4f33b5d0ce6e59fd55';
const model = larger ? 'Qwen/Qwen2.5-3B-Instruct-GGUF' : 'Qwen/Qwen2.5-0.5B-Instruct-GGUF';
const url = `https://huggingface.co/${model}/resolve/${revision}/${name}`;
fs.mkdirSync(directory, { recursive: true });
const destination = path.join(directory, name);
async function checksum(file) { const hash = crypto.createHash('sha256'); for await (const chunk of fs.createReadStream(file)) hash.update(chunk); return hash.digest('hex'); }
if (fs.existsSync(destination)) {
  if (fs.statSync(destination).size !== size || await checksum(destination) !== sha256) throw new Error('Existing artifact differs; preserved for inspection');
} else {
  let lastProgress = 0; let observedBytes = 0;
  try {
    await downloadVerifiedGguf({ url, destination, sizeBytes: size, sha256, signal: AbortSignal.timeout(larger ? 1800000 : 600000), onProgress: downloadedBytes => {
      observedBytes = downloadedBytes;
      if (Date.now() - lastProgress < 5000) return;
      lastProgress = Date.now();
      fs.writeFileSync(path.join(directory, 'download-progress.json'), JSON.stringify({ status: 'DOWNLOADING', model, downloadedBytes, totalBytes: size, updatedAt: new Date().toISOString() }));
    } });
  } catch (error) {
    try { fs.writeFileSync(path.join(directory, 'download-progress.json'), JSON.stringify({ status: 'FAILED', model, downloadedBytes: observedBytes, totalBytes: size, error: error.message, updatedAt: new Date().toISOString() })); } catch {}
    throw error;
  }
}
const report = { classification: 'REAL_EXTERNAL', status: 'DOWNLOADED_AND_HASH_VERIFIED', inference: 'NOT_RUN', model, revision, url, size, sha256, filename: path.relative(root, destination), verifiedAt: new Date().toISOString() };
fs.writeFileSync(path.join(directory, 'provisioning.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(directory, 'download-progress.json'), JSON.stringify({ status: report.status, model, downloadedBytes: size, totalBytes: size, updatedAt: report.verifiedAt }));
console.log(JSON.stringify(report, null, 2));
