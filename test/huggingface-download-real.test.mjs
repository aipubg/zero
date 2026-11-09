import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { LocalGgufEngineService } from '../backend/gateway/server/local-gguf-service.ts';

test('[REAL_EXTERNAL] official GGUF download completes with independent disk hash and no overwrite', {
  skip: process.env.ZERO_HF_DOWNLOAD_TESTS !== '1' ? 'Explicit real network download required' : false,
  timeout: 600000,
}, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-hf-download-'));
  const evidence = path.resolve('artifacts/huggingface-download', String(Date.now()));
  fs.mkdirSync(evidence, { recursive: true });
  const report = { classification: ['REAL_EXTERNAL', 'INTEGRATION'], status: 'RUNNING', startedAt: new Date().toISOString(), inference: 'NOT_RUN' };
  try {
    const service = new LocalGgufEngineService({ modelsDir: directory });
    const repo = 'Qwen/Qwen2.5-0.5B-Instruct-GGUF';
    const filename = 'qwen2.5-0.5b-instruct-q5_k_m.gguf';
    const started = await service.startHuggingFaceDownload(repo, filename);
    assert.equal(started.status, 'downloading');
    const deadline = Date.now() + 550000;
    while (service.getDownloadProgress().status === 'downloading' && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 500));
    const completed = service.getDownloadProgress();
    if (completed.status === 'downloading') service.cancelDownload();
    assert.equal(completed.status, 'completed', JSON.stringify(completed));
    assert.equal(completed.verified, true);
    assert.equal(completed.downloadedBytes, 522186592);
    const hash = createHash('sha256');
    const destination = path.join(directory, filename);
    for await (const chunk of fs.createReadStream(destination)) hash.update(chunk);
    const actualSha256 = hash.digest('hex');
    assert.equal(actualSha256, '041474553fcabfc2a2d67903f9d2c2e50bd92528e670da4f33b5d0ce6e59fd55');
    assert.equal(actualSha256, completed.sha256);
    await assert.rejects(service.startHuggingFaceDownload(repo, filename), /already exists/);
    assert.equal(fs.statSync(destination).size, completed.totalBytes);
    assert.equal(fs.readdirSync(directory).some(name => name.endsWith('.download')), false);
    Object.assign(report, { status: 'PASS', completed, independentDiskSha256: actualSha256, existingFilePreserved: true });
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('zero-hf-download-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
