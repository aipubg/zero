import test from 'node:test';
import assert from 'node:assert/strict';
import { createScreenObserver } from '../packages/screen-intelligence/index.mjs';
import { LocalInferenceRuntime } from '../packages/model-fabric/local-runtime.mjs';

// Contract adapters deliberately model slow/failing inference; real inference has separate OS runners.
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function fixtureRuntime(describe) { return { enabled: true, describe, getStatus: () => ({ enabled: true, available: true }), stop: async () => {}, close: async () => {} }; }
function create(runtime) {
  let count = 0;
  return createScreenObserver({ dbPath: ':memory:', captureIntervalMs: 5, localVisionRuntime: runtime, captureFrame: async () => ({
    ok: true, data: Buffer.from(`fixture pixels ${++count}`), timestamp: Date.now(), appName: 'fixture', windowTitle: 'Contract window',
    ocrText: 'Contract OCR', metadataStatus: 'available', ocr: { status: 'available' },
  }) });
}
test('[CONTRACT] vision inference stays single-flight while screen capture continues and late results are discarded', async () => {
  let release, signal, calls = 0;
  const runtime = fixtureRuntime(async (_bytes, options) => { calls++; signal = options.signal; return new Promise(resolve => { release = resolve; }); });
  const observer = create(runtime);
  try {
    observer.start(); await observer.captureTick();
    await pause(45);
    assert.ok(observer.stats.totalFramesIngested > 2, 'Slow inference must not block actual capture-loop progress');
    assert.equal(calls, 1); assert.equal(observer.getStatus().visionInference.pending, true);
    const stopped = observer.stop();
    assert.equal(signal.aborted, true);
    release({ text: 'Late fixture description', model: 'fixture', source: 'contract-adapter' });
    await stopped;
    assert.equal(observer.visionStats.completed, 0);
    assert.ok(observer.store.getRecentObservations().every(row => row.local_vision_status !== 'inferred'));
    assert.equal(observer.visionStats.retainedImageBytes, 0);
  } finally { await observer.destroy(); }
});
test('[INTEGRATION] actual encrypted SQLite update binds model output and provenance to its original frame', async () => {
  const runtime = fixtureRuntime(async () => ({ text: 'Fixture model output', model: 'contract-model', source: 'contract-adapter' }));
  const observer = create(runtime);
  try {
    observer.start(); await observer.captureTick();
    while (observer.getStatus().visionInference.pending) await pause(1);
    const row = observer.store.getRecentObservations().find(row => row.local_vision_status === 'inferred');
    assert.ok(row); assert.match(row.semantic_summary, /Fixture model output/);
    const metadata = JSON.parse(row.metadata_json).localVision;
    assert.equal(metadata.capturedAt, row.timestamp); assert.equal(metadata.verified, false);
    assert.match(metadata.imageSha256, /^[a-f0-9]{64}$/);
    const raw = observer.store.db.prepare('SELECT semantic_summary, metadata_json FROM semantic_observations WHERE observation_id=?').get(row.observation_id);
    assert.ok(raw.semantic_summary.startsWith('zeroenc:v1:')); assert.ok(raw.metadata_json.startsWith('zeroenc:v1:'));
    assert.ok(!JSON.stringify(raw).includes('Fixture model output'));
  } finally { await observer.destroy(); }
});
test('[CONTRACT] model failure leaves OCR capture available and never writes a fabricated vision description', async () => {
  const observer = create(fixtureRuntime(async () => { throw new Error('Vision model failed'); }));
  try {
    observer.start(); await observer.captureTick();
    while (observer.getStatus().visionInference.pending) await pause(1);
    assert.equal(observer.visionStats.failed, 1); assert.match(observer.visionStats.lastError, /model failed/);
    assert.equal(observer.stats.totalCaptureFailures, 0);
    assert.ok(observer.store.getRecentObservations().every(row => row.local_vision_status !== 'inferred'));
    assert.ok(observer.queryContext('Contract OCR').recentObservations.length > 0);
  } finally { await observer.destroy(); }
});
test('[UNIT] disabled and missing local runtime prerequisites cannot claim readiness', async () => {
  const disabled = new LocalInferenceRuntime();
  await assert.rejects(disabled.ensureStarted(), /disabled/); assert.equal(disabled.getStatus().available, false); await disabled.close();
  const missing = new LocalInferenceRuntime({ enabled: true, executable: 'missing-runtime-contract.exe' });
  await assert.rejects(missing.ensureStarted(), /prerequisite missing/); assert.equal(missing.getStatus().available, false); await missing.close();
});
