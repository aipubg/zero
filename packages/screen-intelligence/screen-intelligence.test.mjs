import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ScreenObserver, RollingFrameBuffer, ChangeDetector, SemanticObservationStore, createScreenObserver } from './index.mjs';
import { captureRealDesktopFrame } from './windows-capture.mjs';
import { LocalVisionExtractor } from './ocr-vision.mjs';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const frame = (text = 'pixels') => ({ ok: true, data: Buffer.from(text), timestamp: Date.now(),
  appName: 'test-app', windowTitle: 'test-window', ocrText: 'recognized',
  metadataStatus: 'available', ocr: { engine: 'test', status: 'available' } });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('CONTRACT: loop/manual ticks serialize slow capture and recover from reported failures', async () => {
  let active = 0, peak = 0, calls = 0;
  const observer = new ScreenObserver({ dbPath: ':memory:', captureIntervalMs: 1, captureFrame: async () => {
    active++; peak = Math.max(peak, active); calls++;
    await delay(20);
    active--;
    return calls === 1 ? { ok: false, error: 'desktop locked' } : frame();
  } });
  try {
    observer.start();
    const a = observer.captureTick(), b = observer.captureTick();
    assert.equal(a, b);
    await a;
    assert.equal(observer.getStatus().state, 'capture-failed');
    assert.match(observer.stats.lastCaptureError.message, /locked/);
    const deadline = Date.now() + 2000;
    while (observer.stats.totalFramesIngested < 2 && Date.now() < deadline) await delay(5);
    await observer.stop();
    assert.equal(peak, 1);
    assert.ok(observer.stats.totalFramesIngested >= 2);
    assert.equal(observer.stats.totalCaptureFailures, 1);
  } finally { await observer.destroy(); }
});

test('CONTRACT: stop/restart/destroy discard capture completions from prior generations', async t => {
  const pending = deferred();
  let calls = 0;
  const observer = new ScreenObserver({ dbPath: ':memory:', captureIntervalMs: 60_000,
    captureFrame: () => { calls++; return pending.promise; } });
  t.after(async () => { pending.resolve(frame()); await observer.destroy(); });
  observer.start();
  const tick = observer.captureTick();
  await Promise.resolve();
  const drained = observer.stop();
  observer.start();
  assert.equal(observer.captureTick(), tick);
  pending.resolve(frame());
  await drained;
  assert.equal(calls, 1);
  assert.equal(observer.stats.totalFramesIngested, 0);
  assert.equal(observer.store.getLatestContext(), null);
  assert.equal(observer.buffer.getStats().frameCount, 0);
  const tick2 = observer.captureTick();
  const destroyed = observer.destroy();
  await Promise.all([tick2, destroyed]);
  assert.equal(observer.stats.totalFramesIngested, 0);
  assert.equal(observer.getStatus().observationStore.active, false);
});

test('UNIT: full-image changes and context changes refresh the same baseline', () => {
  const detector = new ChangeDetector();
  const a = Buffer.alloc(9000), b = Buffer.alloc(9000); b[8999] = 1;
  assert.equal(detector.detectChange({ data: a, appName: 'a' }).reason, 'initial_frame');
  assert.equal(detector.detectChange({ data: b, appName: 'a' }).reason, 'visual_delta');
  assert.equal(detector.detectChange({ data: a, appName: 'b' }).reason, 'app_switched');
  assert.equal(detector.detectChange({ data: a, appName: 'b' }).hasChanged, false);
  assert.equal(detector.detectChange({ data: a, appName: 'b' }).score, null);
  assert.equal(detector.detectChange({ data: a, appName: 'b', ocrText: 'newly recognized' }).reason, 'ocr_changed');
});

test('CONTRACT: stopping before deferred work prevents capture; stopping in a change listener emits no later frame', async () => {
  let calls = 0, frames = 0;
  const observer = new ScreenObserver({ dbPath: ':memory:', captureFrame: async () => { calls++; return frame(); } });
  try {
    observer.start();
    const tick = observer.captureTick();
    await observer.stop();
    await tick;
    assert.equal(calls, 0);
    observer.on('frame', () => frames++);
    observer.once('change', () => { void observer.stop(); });
    observer.start();
    await observer.captureTick();
    assert.equal(observer.running, false);
    assert.equal(frames, 0);
    assert.equal(observer.stats.totalFramesIngested, 1);
  } finally { await observer.destroy(); }
});

test('CONTRACT: persistence failure does not lose an identical retry', async () => {
  const observer = new ScreenObserver({ dbPath: ':memory:' });
  const insert = observer.store.insertObservation.bind(observer.store);
  try {
    observer.store.insertObservation = () => { throw new Error('disk full'); };
    assert.throws(() => observer.ingestFrame(frame()), /disk full/);
    assert.equal(observer.stats.totalFramesIngested, 0);
    assert.equal(observer.buffer.getStats().frameCount, 0);
    observer.store.insertObservation = insert;
    assert.equal(observer.ingestFrame(frame()).hasChanged, true);
    assert.equal(observer.store.getStatus().observationCount, 1);
  } finally { await observer.destroy(); }
});

test('CONTRACT: encoded geometry is authoritative and metadata/OCR failures stay explicitly unavailable', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64');
  const result = await captureRealDesktopFrame({
    captureScreen: async () => ({ ok: true, buffer: png, width: 1920, height: 1080 }),
    getWindowState: async () => { throw new Error('foreground denied'); },
    visionExtractor: { extractText: async () => { throw new Error('language absent'); } },
  });
  assert.equal(result.ok, true);
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.equal(result.appName, null);
  assert.equal(result.bounds, null);
  assert.equal(result.metadataStatus, 'unavailable');
  assert.match(result.metadataError, /denied/);
  assert.equal(result.ocrText, '');
  assert.equal(result.ocr.confidence, null);
  assert.equal(result.localVision.available, false);
});

test('UNIT: retention owns subarrays and bounds pixels, metadata, count and idle expiry', async () => {
  const buffer = new RollingFrameBuffer({ maxMemoryBytes: 10_000, maxFrames: 3, maxWindowMs: 30 });
  const parent = Buffer.alloc(1_000_000);
  for (let i = 0; i < 10; i++) buffer.pushFrame({ data: parent.subarray(0, 100), windowTitle: 'x'.repeat(50_000) });
  const stats = buffer.getStats();
  assert.ok(stats.retainedMemoryBytes <= 10_000);
  assert.ok(stats.frameCount <= 3);
  assert.equal(buffer.getLatestFrame().data.buffer.byteLength, 100);
  assert.equal(buffer.getLatestFrame().windowTitle.length, 1024);
  assert.equal(buffer.pushFrame({ data: Buffer.alloc(20_000) }).retained, false);
  assert.equal(buffer.pushFrame({ data: Buffer.alloc(0) }).retained, false);
  await delay(40);
  assert.equal(buffer.getLatestFrame(), null);
  assert.equal(buffer.getStats().retainedMemoryBytes, 0);
});

test('CONTRACT: no-pixel, synthetic and malformed captures fail without made-up OCR or geometry', async () => {
  for (const screen of [{ ok: true, width: 1920, base64: '' }, { ok: false, error: 'denied' },
    { ok: true, buffer: Buffer.from('not png') }, { ok: true, livePixels: false, buffer: Buffer.alloc(100) }]) {
    const result = await captureRealDesktopFrame({ captureScreen: async () => screen });
    assert.equal(result.ok, false);
    assert.equal(result.width, undefined);
    assert.equal(result.ocrText, undefined);
  }
  const extractor = new LocalVisionExtractor();
  assert.deepEqual(extractor.getStatus().available, false);
  assert.equal((await extractor.extractText(Buffer.alloc(0))).confidence, null);
  const invalid = await extractor.extractText(Buffer.from('not an image'));
  assert.equal(invalid.ok, false);
  assert.equal(invalid.text, '');
  assert.equal(invalid.confidence, null);
});

test('INTEGRATION: factory persists under dataDir across reopen, remains idle, reports historical context', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-screen-'));
  const first = createScreenObserver({ dataDir });
  const dbPath = path.join(dataDir, 'screen-observations.sqlite');
  try {
    assert.equal(first.running, false);
    assert.equal(first.getStatus().observationStore.path, dbPath);
    assert.equal(first.getStatus().observationStore.persistent, true);
    first.ingestFrame(frame());
    await first.destroy();
    const second = createScreenObserver({ dataDir });
    try {
      const result = second.queryContext('current window');
      assert.equal(result.current, false);
      assert.equal(result.activeApplication, null);
      assert.match(result.answer, /Last recorded application/);
      assert.equal(result.latestObservation.observed_text, 'recognized');
      assert.equal(result.latestObservation.confidence, null);
      assert.equal(result.latestObservation.local_vision_status, 'unavailable');
      assert.equal(result.observationStore.observationCount, 1);
    } finally { await second.destroy(); }
  } finally {
    await first.destroy();
    // Only these explicitly created test files are removed; no recursive deletion.
    for (const suffix of ['', '-shm', '-wal', '.key.dpapi']) fs.rmSync(dbPath + suffix, { force: true });
    fs.rmdirSync(dataDir);
  }
});

test('INTEGRATION: opening an old schema preserves observations and adds provenance columns', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-screen-migration-'));
  const dbPath = path.join(dataDir, 'old.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE semantic_observations (observation_id TEXT PRIMARY KEY, timestamp INTEGER NOT NULL,
    source_device TEXT NOT NULL, display_id TEXT NOT NULL, application_id TEXT, window_context TEXT,
    observed_text TEXT, semantic_summary TEXT, event_type TEXT, related_task_id TEXT, confidence REAL DEFAULT 1.0, expiry_policy TEXT DEFAULT '7d');
    INSERT INTO semantic_observations VALUES ('old', 1, 'host', 'primary', 'legacy', '', 'preserved', '', '', NULL, .8, '7d');`);
  db.close();
  const store = new SemanticObservationStore({ dbPath });
  try {
    assert.equal(store.getLatestContext().observed_text, 'preserved');
    assert.equal(store.getLatestContext().local_vision_status, 'unavailable');
  } finally {
    store.close();
    for (const suffix of ['', '-shm', '-wal', '.key.dpapi']) fs.rmSync(dbPath + suffix, { force: true });
    if (store.migrationBackup) fs.rmSync(store.migrationBackup);
    fs.rmdirSync(dataDir);
  }
});
