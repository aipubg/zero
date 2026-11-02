/** REAL_OS resource provenance; missing SDK capture accounting remains PARTIAL. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { captureRealDesktopFrame } from '../packages/screen-intelligence/windows-capture.mjs';
import { stopDaemon } from '../app/zero-control-ui/src/computer/windows-driver.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'artifacts/screen-resource-usage', String(Date.now()));
fs.mkdirSync(directory, { recursive: true });
const report = { classification: ['REAL_OS'], status: 'RUNNING', startedAt: new Date().toISOString(),
  scope: 'Real per-process CPU and memory counters; not a duration or whole-pipeline resource acceptance result' };
try {
  const frame = await captureRealDesktopFrame();
  assert.equal(frame.ok, true);
  const measured = value => Boolean(value && value.pid > 0 && value.cpuMs > 0 && value.peakWorkingSetBytes > 0);
  assert.ok(measured(frame.resourceUsage.ocr), 'Actual OCR process measurements are required');
  assert.ok(measured(frame.resourceUsage.metadata), 'Actual native metadata process measurements are required');
  report.captureSource = frame.captureSource;
  report.resourceUsage = frame.resourceUsage;
  report.fullCaptureAccounting = measured(frame.resourceUsage.capture);
  report.status = report.fullCaptureAccounting ? 'PASS' : 'PARTIAL';
  report.remaining = report.fullCaptureAccounting ? [] : ['Capture SDK process resource accounting is unavailable; do not claim whole-pipeline CPU/RAM acceptance'];
} catch (error) { report.status = 'FAIL'; report.error = error.message; process.exitCode = 1; }
finally {
  stopDaemon(); report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, directory }, null, 2));
}
