/** REAL_OS + REAL_BROWSER: real screen changes -> GGUF inference -> encrypted memory. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';
import { LocalInferenceRuntime } from '../packages/model-fabric/local-runtime.mjs';
import { createScreenObserver } from '../packages/screen-intelligence/index.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'artifacts/local-vision-screen', String(Date.now()));
fs.mkdirSync(directory, { recursive: true });
const report = { classification: ['REAL_OS', 'REAL_BROWSER', 'INTEGRATION'], status: 'RUNNING', startedAt: new Date().toISOString(), checks: [],
  scope: 'Controlled visible desktop changes, actual GDI/CUA capture, local model inference and encrypted observation retrieval; no general accuracy/endurance sign-off' };
const runtime = new LocalInferenceRuntime({ enabled: true });
let observer = createScreenObserver({ dataDir: directory, captureIntervalMs: 60000, localVisionRuntime: runtime, localVisionMinIntervalMs: 1000,
  localVisionPrompt: 'What is the dominant background color of the web page in this screenshot? Answer with just the color.' });
let browser;
async function waitForInference(count) {
  const deadline = Date.now() + 65000;
  while (Date.now() < deadline) {
    const status = observer.getStatus();
    if (status.visionInference.completed >= count) return status;
    if (status.visionInference.lastError) throw new Error(status.visionInference.lastError);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Actual screen inference timeout');
}
try {
  browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage({ viewport: null });
  let count = 0;
  for (const [color, css] of [['blue', '#0000dd'], ['green', '#008800']]) {
    await page.setContent(`<html><head><title>Zero Local Vision Acceptance</title></head><body style="margin:0;background:${css};color:white;font:48px Arial"><p>ZERO LOCAL VISION CHECK</p></body></html>`);
    await page.bringToFront();
    await page.locator('p').waitFor();
    if (!observer.running) observer.start();
    await observer.captureTick();
    const captured = observer.store.getLatestContext();
    assert.match(captured.application_id, /chrome/i, 'Actual foreground app must be our visible Chrome fixture');
    assert.match(captured.observed_text, /ZERO LOCAL VISION\b[\s\S]{0,30}\bCHECK/i, 'Actual Windows OCR must see the marker words; tolerate intervening OCR artifacts');
    const status = await waitForInference(++count);
    const inferred = observer.store.getRecentObservations().find(row => row.observation_id === captured.observation_id);
    const metadata = JSON.parse(inferred.metadata_json).localVision;
    report.checks.push({ expectedDominantColor: color, summary: inferred.semantic_summary, inference: metadata,
      source: 'actual-desktop-capture', captureSucceeded: status.stats.totalFramesIngested, modelCompleted: status.visionInference.completed });
    assert.equal(inferred.local_vision_status, 'inferred');
    assert.match(inferred.semantic_summary.split('Local vision (unverified model inference):').at(-1), new RegExp(`\\b${color}\\b`, 'i'));
    assert.equal(metadata.source, 'local-gguf-inference'); assert.equal(metadata.verified, false);
    assert.match(metadata.imageSha256, /^[a-f0-9]{64}$/);
  }
  await observer.stop();
  assert.equal(runtime.getStatus().pid, null, 'Stopping observation must unload model/KV buffers');
  await observer.destroy();
  observer = createScreenObserver({ dataDir: directory });
  for (const color of ['blue', 'green']) assert.ok(observer.queryContext(color).recentObservations.some(row => row.local_vision_status === 'inferred'));
  report.persistedAfterReopen = true;
  report.encryptedFields = observer.getStatus().observationStore.encryptedFields;
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.message; process.exitCode = 1; }
finally {
  await observer.destroy(); await browser?.close();
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, directory }, null, 2));
}
