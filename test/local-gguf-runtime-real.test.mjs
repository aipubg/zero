import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { LocalGgufEngineService } from '../backend/gateway/server/local-gguf-service.ts';
import { LocalInferenceRuntime } from '../packages/model-fabric/local-runtime.mjs';

test('[REAL_OS] pinned GGUF loads, generates native token IDs, preserves prior history and unloads', { skip: process.platform !== 'win32' ? 'Windows native binary required' : false, timeout: 30000 }, async () => {
  const directory = path.resolve('artifacts/local-gguf-runtime', String(Date.now())); fs.mkdirSync(directory, { recursive: true });
  const modelsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-real-gguf-'));
  const service = new LocalGgufEngineService({ modelsDir });
  const source = new LocalInferenceRuntime().model;
  const checksum = async () => { const hash = createHash('sha256'); for await (const chunk of fs.createReadStream(source)) hash.update(chunk); return hash.digest('hex'); };
  const report = { classification: ['REAL_OS', 'INTEGRATION'], status: 'RUNNING', startedAt: new Date().toISOString(), directory, scope: 'Selected pinned model load/token-generation/history-preservation/unload; not semantic readiness, local chat routing or arbitrary architectures' };
  try {
    const originalHash = await checksum();
    await service.saveManifest({ id: 'real-smol', name: 'Pinned real model', filename: path.basename(source), modelPath: source, zeroCopy: true, parameters: { num_ctx: 512 } });
    await service.loadModel('real-smol');
    assert.equal(service.getMemoryStatus().isLoaded, true);
    const history = [{ type: 'user', text: 'Earlier conversation preserved for this verification' }, { type: 'model', response: ['Previous owner context'] }];
    service.activeSession.setChatHistory(history);
    const before = structuredClone(service.activeSession.getChatHistory());
    const result = await service.runSelfTest('real-smol');
    assert.equal(result.passed, true, JSON.stringify(result));
    assert.ok(result.tokensGenerated > 0 && result.tokensGenerated <= 12);
    assert.ok(result.sampleOutput.trim()); assert.match(result.tokenAccounting, /Native generated token IDs/);
    assert.deepEqual(service.activeSession.getChatHistory(), before);
    const stored = await service.loadManifest('real-smol'); assert.equal(stored.lastSelfTest.passed, true);
    await service.unloadModel(true); assert.equal(service.getMemoryStatus().isLoaded, false);
    assert.equal(await checksum(), originalHash);
    Object.assign(report, { status: 'PASS', result, priorHistoryPreserved: true, persistedSelfTest: true, actualUnload: true, originalSourceSha256: originalHash });
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    await service.unloadModel(true);
    report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(fs.realpathSync(path.dirname(modelsDir)), fs.realpathSync(os.tmpdir())); fs.rmSync(modelsDir, { recursive: true, force: true });
  }
});
