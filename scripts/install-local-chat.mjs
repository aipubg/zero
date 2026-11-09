/** Provision pinned official text weights; does not change owner assignments. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

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
  const temporary = `${destination}.${crypto.randomUUID()}.download`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(600000) });
    if (!response.ok || !response.body) throw new Error(`Model download HTTP ${response.status}`);
    const hash = crypto.createHash('sha256'); let bytes = 0;
    await pipeline(Readable.fromWeb(response.body), new Transform({ transform(chunk, _encoding, done) {
      bytes += chunk.length;
      if (bytes > size) return done(new Error('Download exceeds pinned size'));
      hash.update(chunk); done(null, chunk);
    } }), fs.createWriteStream(temporary, { flags: 'wx' }));
    if (bytes !== size || hash.digest('hex') !== sha256) throw new Error('Model size/hash mismatch');
    // Exclusive copy protects any concurrently installed or existing artifact.
    fs.copyFileSync(temporary, destination, fs.constants.COPYFILE_EXCL);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
const report = { classification: 'REAL_EXTERNAL', status: 'DOWNLOADED_AND_HASH_VERIFIED', inference: 'NOT_RUN', model, revision, url, size, sha256, filename: path.relative(root, destination), verifiedAt: new Date().toISOString() };
fs.writeFileSync(path.join(directory, 'provisioning.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
