/** REAL_OS: actual pinned GGUF text/vision inference on controlled rendered pixels. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';
import { LocalInferenceRuntime } from '../packages/model-fabric/local-runtime.mjs';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'artifacts/local-vision', String(Date.now()));
fs.mkdirSync(directory, { recursive: true });
const report = { classification: ['REAL_OS', 'REAL_BROWSER', 'INTEGRATION'], status: 'RUNNING', startedAt: new Date().toISOString(), checks: [],
  scope: 'Actual local model execution and controlled dominant-color recognition; not general visual understanding accuracy or 24-hour endurance' };
const runtime = new LocalInferenceRuntime({ enabled: true });
let browser;
try {
  await runtime.ensureStarted();
  report.runtime = runtime.getStatus();
  const beforeResources = await runtime.sampleResources();
  assert.equal(beforeResources.status, 'measured');
  assert.equal(beforeResources.pid, report.runtime.pid);
  assert.ok(beforeResources.workingSetBytes > 0 && beforeResources.peakWorkingSetBytes >= beforeResources.workingSetBytes);
  const answer = await runtime.complete([{ role: 'user', content: 'What is two plus two? Answer briefly.' }]);
  assert.match(answer.text, /\b4\b|\bfour\b/i);
  report.checks.push({ name: 'Local GGUF text generation', status: 'PASS', ...answer });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 384, height: 384 } });
  for (const [color, css] of [['red', '#ee0000'], ['blue', '#0000ee'], ['green', '#009900']]) {
    await page.setContent(`<html><body style="margin:0;background:${css}"></body></html>`);
    const image = await page.screenshot({ path: path.join(directory, `${color}.png`) });
    const started = Date.now();
    const observed = await runtime.describe(image, { prompt: 'What is the dominant color in this image? Answer with just the color.', maxTokens: 40 });
    const passed = new RegExp(`\\b${color}\\b`, 'i').test(observed.text);
    report.checks.push({ name: `Actual ${color} pixel recognition`, status: passed ? 'PASS' : 'FAIL', expectedColor: color,
      imageSha256: crypto.createHash('sha256').update(image).digest('hex'), durationMs: Date.now() - started, ...observed });
  }
  assert.equal(report.checks.every(check => check.status === 'PASS'), true, 'Actual image outputs must match the independently rendered pixels');
  report.afterInference = runtime.getStatus();
  const afterResources = await runtime.sampleResources();
  assert.equal(afterResources.status, 'measured');
  assert.ok(afterResources.cpuMs >= beforeResources.cpuMs);
  assert.equal(afterResources.startedAt, beforeResources.startedAt);
  report.processResources = { before: beforeResources, after: afterResources };
  const completedBeforeAbort = runtime.completed;
  const pending = runtime.describe(fs.readFileSync(path.join(directory, 'blue.png')), { maxTokens: 512 });
  while (!runtime.active) await new Promise(resolve => setTimeout(resolve, 1));
  const rejected = assert.rejects(pending, /stopped|abort/i);
  await runtime.stop(); await rejected;
  assert.equal(runtime.getStatus().pid, null);
  assert.equal(runtime.completed, completedBeforeAbort);
  const recovered = await runtime.complete([{ role: 'user', content: 'What is two plus two? Answer briefly.' }]);
  assert.match(recovered.text, /\b4\b|\bfour\b/i);
  report.interruptionRecovery = { actualPendingRequestCancelled: true, childStopped: true, completedBeforeAbort, completedAfterRecovery: runtime.completed, reply: recovered.text };
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.message; process.exitCode = 1; }
finally {
  await browser?.close(); await runtime.close();
  report.afterClose = runtime.getStatus();
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, directory }, null, 2));
}
