/** Pinned offline Whisper CPU assets. Does not change the selected voice engine. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { downloadVerifiedFile } from '../backend/gateway/server/gguf-download-file.mjs';
import { WHISPER_VERSION, WHISPER_NATIVE_FILES } from '../packages/voice-engine/whisper-assets.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Pinned STT runtime requires Windows x64');
const directory = path.join(root, 'artifacts/local-runtime/whisper-cpp'); fs.mkdirSync(directory, { recursive: true });
const version = WHISPER_VERSION;
const archive = path.join(directory, 'whisper-bin-x64-v1.8.3.zip');
const model = path.join(directory, 'ggml-base.bin');
const modelRevision = '5359861c739e955e79d9a303bcbc70fb988958b1';
async function hash(file) { const result = crypto.createHash('sha256'); for await (const chunk of fs.createReadStream(file)) result.update(chunk); return result.digest('hex'); }
async function ensure(url, destination, sizeBytes, sha256) {
  if (fs.existsSync(destination)) {
    if (fs.statSync(destination).size !== sizeBytes || await hash(destination) !== sha256) throw new Error('Existing STT artifact differs; preserved for inspection');
    return;
  }
  await downloadVerifiedFile({ url, destination, sizeBytes, sha256, signal: AbortSignal.timeout(600000) });
}
await ensure(`https://github.com/ggml-org/whisper.cpp/releases/download/v${version}/whisper-bin-x64.zip`, archive, 3968674, 'd824b1e37599f882b396e73f1ee0bfd5d0529f700314c48311dcbd00b803321d');
const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/tar.exe');
const listing = execFileSync(tar, ['-tf', archive], { encoding: 'utf8', windowsHide: true }).trim().split(/\r?\n/);
if (listing.some(entry => !/^Release\/[A-Za-z0-9_.-]+\.(exe|dll)$/.test(entry))) throw new Error('Unexpected native STT archive entry');
const runtime = path.join(directory, `v${version}`);
if (!fs.existsSync(runtime)) {
  const staging = fs.mkdtempSync(path.join(directory, 'install-'));
  try { execFileSync(tar, ['-xf', archive, '-C', staging], { windowsHide: true }); fs.renameSync(staging, runtime); }
  finally { if (fs.existsSync(staging)) { if (path.dirname(staging) !== directory || !path.basename(staging).startsWith('install-')) throw new Error('Unexpected staging path'); fs.rmSync(staging, { recursive: true, force: true }); } }
}
const files = [];
for (const [filename, expectedHash] of Object.entries(WHISPER_NATIVE_FILES)) {
  const file = path.join(runtime, 'Release', filename);
  if (!fs.lstatSync(file).isFile()) throw new Error('Native STT executable dependency missing');
  const sha256 = await hash(file);
  if (sha256 !== expectedHash) throw new Error('Native STT dependency differs from pinned release; existing file preserved');
  files.push({ filename: path.relative(directory, file), sha256 });
}
await ensure(`https://huggingface.co/ggerganov/whisper.cpp/resolve/${modelRevision}/ggml-base.bin`, model, 147951465, '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe');
const report = { classification: 'REAL_EXTERNAL', status: 'PROVISIONED', version, files, modelRevision, model: { filename: 'ggml-base.bin', sizeBytes: 147951465, sha256: await hash(model) }, inference: 'NOT_RUN', selectedVoiceEngineChanged: false };
fs.writeFileSync(path.join(directory, 'provisioning.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
