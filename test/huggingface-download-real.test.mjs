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
  const service = new LocalGgufEngineService({ modelsDir: directory });
  try {
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
    if (process.env.ZERO_HF_INFERENCE_TESTS === '1') {
      report.classification.push('REAL_OS');
      const modelId = filename.replace(/\.gguf$/, '');
      const models = await service.scanModels();
      assert.equal(models.find(model => model.id === modelId)?.fullPath, destination);
      // Bound actual allocation independently of the model's advertised context.
      await service.saveManifest({ id: modelId, filename, modelPath: destination, zeroCopy: false, parameters: { num_ctx: 512 } });
      await service.loadModel(modelId);
      assert.equal(service.getMemoryStatus().isLoaded, true);
      const result = await service.runSelfTest(modelId);
      assert.equal(result.passed, true, JSON.stringify(result));
      assert.ok(result.tokensGenerated > 0 && result.tokensGenerated <= 12);
      assert.ok(result.sampleOutput.trim());
      report.inference = { status: 'PASS', scope: 'Newly downloaded bytes scanned, loaded and generated actual native tokens; semantic chat/tool accuracy not established', result };
      await service.unloadModel(true);
      assert.equal(service.getMemoryStatus().isLoaded, false);
    }
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    service.cancelDownload();
    const cleanupDeadline = Date.now() + 10000;
    while (service.getDownloadProgress()?.status === 'downloading' && Date.now() < cleanupDeadline) await new Promise(resolve => setTimeout(resolve, 50));
    await service.unloadModel(true);
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('zero-hf-download-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
