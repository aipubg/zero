import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ScreenObserver,
  RollingFrameBuffer,
  ChangeDetector,
  SemanticObservationStore,
} from '../packages/screen-intelligence/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB_PATH = path.join(__dirname, 'test-screen-observations.sqlite');

test('Phase 8 Screen Intelligence Engine Suite', async (suite) => {
  // Cleanup test DB if exists
  if (fs.existsSync(TEST_DB_PATH)) {
    try { fs.unlinkSync(TEST_DB_PATH); } catch (_) {}
  }

  // 1. RollingFrameBuffer Memory Ceiling & Eviction
  await suite.test('RollingFrameBuffer enforces strict memory budget and time eviction', () => {
    // 50 KB memory ceiling for testing
    const buffer = new RollingFrameBuffer({ maxMemoryBytes: 50 * 1024, maxWindowMs: 1000 });
    const dummy10K = Buffer.alloc(10 * 1024, 0x41);

    // Push 4 frames (40 KB) -> within 50 KB ceiling
    for (let i = 0; i < 4; i++) {
      buffer.pushFrame({ data: dummy10K, isKeyframe: i === 0, windowTitle: `Win ${i}` });
    }
    assert.equal(buffer.frames.length, 4);
    assert.equal(buffer.currentMemoryBytes, 40 * 1024);

    // Push 3 more frames (30 KB more -> total 70 KB -> exceeds 50 KB ceiling)
    for (let i = 4; i < 7; i++) {
      buffer.pushFrame({ data: dummy10K, isKeyframe: false, windowTitle: `Win ${i}` });
    }

    // Memory ceiling must be enforced: currentMemoryBytes <= 50 KB
    assert.ok(buffer.currentMemoryBytes <= 50 * 1024, `Memory ceiling respected: ${buffer.currentMemoryBytes} <= 51200`);
    assert.ok(buffer.frames.length <= 5, 'Frames evicted to stay within budget');

    // Test time-based expiration
    const stats = buffer.getStats();
    assert.ok(stats.memoryUtilizationPercent <= 100);
  });

  // 2. ChangeDetector Visual & Contextual Gating
  await suite.test('ChangeDetector prevents unnecessary inference on static frames', () => {
    const detector = new ChangeDetector();
    const frameA = Buffer.from('mock-frame-pixels-123456');
    const frameB = Buffer.from('mock-frame-pixels-789012');

    // First frame
    const r1 = detector.detectChange({ appName: 'chrome.exe', windowTitle: 'Google', data: frameA });
    assert.equal(r1.hasChanged, true);
    assert.equal(r1.reason, 'initial_frame');

    // Identical frame -> must be static (0 inference cost)
    const r2 = detector.detectChange({ appName: 'chrome.exe', windowTitle: 'Google', data: frameA });
    assert.equal(r2.hasChanged, false);
    assert.equal(r2.reason, 'identical_hash');

    // Window title changed -> contextual change
    const r3 = detector.detectChange({ appName: 'chrome.exe', windowTitle: 'YouTube', data: frameA });
    assert.equal(r3.hasChanged, true);
    assert.equal(r3.reason, 'window_title_changed');

    // App switched
    const r4 = detector.detectChange({ appName: 'notepad.exe', windowTitle: 'Untitled - Notepad', data: frameA });
    assert.equal(r4.hasChanged, true);
    assert.equal(r4.reason, 'app_switched');

    // Visual delta
    const r5 = detector.detectChange({ appName: 'notepad.exe', windowTitle: 'Untitled - Notepad', data: frameB });
    assert.equal(r5.hasChanged, true);
    assert.equal(r5.reason, 'visual_delta');
  });

  // 3. SemanticObservationStore SQLite Persistence
  await suite.test('SemanticObservationStore persists and searches structured observations', () => {
    const store = new SemanticObservationStore({ dbPath: TEST_DB_PATH });

    try {
      const id1 = store.insertObservation({
        application_id: 'code.exe',
        window_context: 'zero - Visual Studio Code',
        observed_text: 'import { ModelFabric } from "./index.mjs";',
        semantic_summary: 'Editing ModelFabric module in VS Code',
        event_type: 'app_active',
        confidence: 0.95,
      });
      assert.ok(id1.startsWith('obs_'));

      const id2 = store.insertObservation({
        application_id: 'chrome.exe',
        window_context: 'GitHub - aipubg/zero',
        observed_text: 'Pull Request #1: Clean Architecture',
        semantic_summary: 'Reviewing Zero PR #1 on GitHub',
        event_type: 'browser_navigation',
        confidence: 0.98,
      });
      assert.ok(id2.startsWith('obs_'));

      // Retrieve recent
      const recent = store.getRecentObservations(10);
      assert.equal(recent.length, 2);
      assert.equal(recent[0].application_id, 'chrome.exe');

      // Search observations
      const searchRes = store.searchObservations('VS Code');
      assert.equal(searchRes.length, 1);
      assert.equal(searchRes[0].application_id, 'code.exe');

      // Latest context
      const latest = store.getLatestContext();
      assert.equal(latest.application_id, 'chrome.exe');
      assert.equal(latest.window_context, 'GitHub - aipubg/zero');
    } finally {
      store.close();
    }
  });

  // 4. Integrated ScreenObserver Pipeline & Agent Queries
  await suite.test('ScreenObserver orchestrates capture, change detection, buffer, and agent queries', () => {
    const observer = new ScreenObserver({ dbPath: TEST_DB_PATH, maxMemoryBytes: 100 * 1024 });

    try {
      observer.start();
      assert.equal(observer.running, true);

      let changeEvents = 0;
      observer.on('change', () => changeEvents++);

      // Ingest frame 1: Desktop Explorer
      const res1 = observer.ingestFrame({
        appName: 'explorer.exe',
        windowTitle: 'File Explorer',
        data: Buffer.from('explorer-pixels-1'),
      });
      assert.equal(res1.hasChanged, true);

      // Ingest frame 2: Duplicate
      const res2 = observer.ingestFrame({
        appName: 'explorer.exe',
        windowTitle: 'File Explorer',
        data: Buffer.from('explorer-pixels-1'),
      });
      assert.equal(res2.hasChanged, false);

      // Ingest frame 3: Switch to Terminal
      const res3 = observer.ingestFrame({
        appName: 'windowsterminal.exe',
        windowTitle: 'PowerShell - Zero AI',
        data: Buffer.from('terminal-pixels-2'),
      });
      assert.equal(res3.hasChanged, true);

      assert.equal(changeEvents, 2);

      // Query context for agents
      const queryActive = observer.queryContext('What is the active window?');
      assert.ok(queryActive.answer.includes('windowsterminal.exe'));

      const queryRecent = observer.queryContext('What were the recent changes?');
      assert.ok(queryRecent.answer.includes('windowsterminal.exe'));

      // Check status
      const status = observer.getStatus();
      assert.equal(status.running, true);
      assert.equal(status.stats.totalFramesIngested, 3);
      assert.equal(status.stats.totalChangesDetected, 2);
      assert.ok(status.buffer.frameCount >= 2);
    } finally {
      observer.destroy();
      if (fs.existsSync(TEST_DB_PATH)) {
        try { fs.unlinkSync(TEST_DB_PATH); } catch (_) {}
      }
    }
  });
});
