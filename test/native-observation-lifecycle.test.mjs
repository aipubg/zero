import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createScreenObserver } from '../packages/screen-intelligence/index.mjs';
import { createNativeObservationLifecycle } from '../services/host/screen-observation.mjs';

// Deterministic capture adapter; these are not real screen-capture acceptance tests.
const captureFrame = async () => ({ ok: true, data: Buffer.from('contract frame'), timestamp: Date.now(),
  appName: 'Contract app', windowTitle: 'Fixture window', ocrText: 'Known contract text', metadataStatus: 'available', ocr: { status: 'available' } });
function setup() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-observation-lifecycle-'));
  const prefsPath = path.join(directory, 'prefs.json');
  const open = (capture = captureFrame) => {
    const observer = createScreenObserver({ dataDir: directory, encryptionKey: Buffer.alloc(32, 7), captureFrame: capture, captureIntervalMs: 60000 });
    return createNativeObservationLifecycle({ observer, prefsPath });
  };
  return { directory, prefsPath, open, cleanup() {
    const resolved = fs.realpathSync.native(directory);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-observation-lifecycle-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  } };
}
test('[INTEGRATION] observation preferences and real SQLite summaries survive lifecycle reopen', async () => {
  const context = setup();
  let lifecycle = context.open();
  fs.writeFileSync(context.prefsPath, JSON.stringify({ unrelated: { ownerSetting: 'preserve me' } }));
  try {
    assert.equal((await lifecycle.initialize()).captureRunning, false);
    const started = await lifecycle.control('start');
    assert.equal(started.captureRunning, true);
    assert.ok(started.ring.frames > 0);
    assert.ok(lifecycle.recent().observations[0].summary.includes('Known contract text'));
    await lifecycle.dispose(); lifecycle = context.open();
    const reopened = await lifecycle.initialize();
    assert.equal(reopened.preferenceEnabled, true);
    assert.equal(reopened.captureRunning, true);
    assert.ok(reopened.observer.observationStore.observationCount > 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(context.prefsPath)).unrelated, { ownerSetting: 'preserve me' });
    await lifecycle.control('stop');
    await lifecycle.dispose(); lifecycle = context.open();
    assert.equal((await lifecycle.initialize()).captureRunning, false);
  } finally { await lifecycle.dispose(); context.cleanup(); }
});
test('[INTEGRATION] Private Mode clears volatile frames, persists and resumes only an enabled preference', async () => {
  const context = setup();
  let lifecycle = context.open();
  try {
    await lifecycle.initialize(); await lifecycle.start();
    const state = await lifecycle.control('private-on');
    assert.equal(state.captureRunning, false); assert.equal(state.ring.frames, 0);
    assert.equal(lifecycle.recent().reason, 'private-mode');
    await lifecycle.dispose(); lifecycle = context.open();
    const reopened = await lifecycle.initialize();
    assert.equal(reopened.privateMode, true); assert.equal(reopened.captureRunning, false);
    assert.equal((await lifecycle.control('private-off')).captureRunning, true);
    await lifecycle.stop(); await lifecycle.setPrivateMode(true);
    assert.equal((await lifecycle.setPrivateMode(false)).captureRunning, false);
  } finally { await lifecycle.dispose(); context.cleanup(); }
});
test('[CONTRACT] failed capture and malformed preferences never report successful capture', async () => {
  const context = setup();
  let lifecycle = context.open(async () => { throw new Error('Capture source failed'); });
  try {
    await lifecycle.initialize();
    const failure = await lifecycle.start();
    assert.equal(failure.captureRunning, false); assert.equal(failure.startFailed, true);
    assert.equal(failure.observer.stats.totalCaptureFailures, 1);
    await lifecycle.dispose();
    fs.writeFileSync(context.prefsPath, '{broken');
    lifecycle = context.open();
    const state = await lifecycle.initialize();
    assert.equal(state.privateMode, true); assert.equal(state.captureRunning, false);
    await assert.rejects(lifecycle.start(), /preference storage is unavailable/);
    assert.equal(fs.readFileSync(context.prefsPath, 'utf8'), '{broken');
  } finally { await lifecycle.dispose(); context.cleanup(); }
});
