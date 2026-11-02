/** INTEGRATION, real Windows desktop + WinRT; never silently skip unavailable OS features. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createScreenObserver } from '../packages/screen-intelligence/index.mjs';
import { captureDriverDesktop, captureRealDesktopFrame, pngDimensions } from '../packages/screen-intelligence/windows-capture.mjs';
import { LocalVisionExtractor } from '../packages/screen-intelligence/ocr-vision.mjs';
import { getWindowState, stopDaemon } from '../app/zero-control-ui/src/computer/windows-driver.js';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--output-dir')) throw new Error('Usage: node scripts/screen-intelligence-real-os.mjs [--output-dir PATH]');
const outputDir = path.resolve(args[1] ?? `artifacts/screen-intelligence/real-os-${new Date().toISOString().replace(/[:.]/gu, '-')}`);
fs.mkdirSync(outputDir, { recursive: true });
const json = (name, value) => fs.writeFileSync(path.join(outputDir, name), JSON.stringify(value, null, 2) + '\n');
const report = { classification: 'INTEGRATION', startedAt: new Date().toISOString(), platform: process.platform,
  status: 'running', outputDir, checks: [], completed24Hours: false };
let observer;
try {
  assert.equal(process.platform, 'win32', 'Interactive Windows is required');
  const fixturePath = path.join(outputDir, 'ocr-known-text.png');
  await promisify(execFile)('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', fileURLToPath(new URL('./screen-intelligence-real-os-fixture.ps1', import.meta.url)), '-OutputPath', fixturePath],
  { windowsHide: true, timeout: 15_000, maxBuffer: 128 * 1024 });
  const extractor = new LocalVisionExtractor({ language: 'en-US' });
  const recognized = await extractor.extractText(fs.readFileSync(fixturePath));
  json('known-text-ocr.json', recognized);
  assert.equal(recognized.ok, true, recognized.reason);
  assert.equal(recognized.engine, 'windows-winrt-ocr');
  assert.match(recognized.text, /ZERO SCREEN OCR 7429/iu);
  assert.match(recognized.text, /Native Windows text recognition/iu);
  assert.equal(recognized.confidence, null);
  report.checks.push('Known rendered text recognized by real WinRT OCR (fixture, not live pixels)');

  let driverOutput, windowOutput;
  const captured = await captureRealDesktopFrame({
    captureScreen: async args => (driverOutput = await captureDriverDesktop(args)),
    getWindowState: async signal => (windowOutput = await getWindowState(signal)), visionExtractor: extractor,
  });
  json('driver-output.json', { capture: { ...driverOutput,
    buffer: driverOutput?.buffer ? { bytes: driverOutput.buffer.length } : undefined,
    base64: driverOutput?.base64 ? { characters: driverOutput.base64.length } : undefined }, window: windowOutput });
  const { data, ...metadata } = captured;
  json('live-capture.json', { ...metadata, bytes: data?.length ?? 0 });
  assert.equal(captured.ok, true, captured.error);
  assert.ok(data.length > 100);
  assert.deepEqual(pngDimensions(data), { width: captured.width, height: captured.height });
  assert.equal(captured.metadataStatus, 'available', captured.metadataError);
  assert.ok(captured.appName && captured.pid > 0);
  assert.ok(captured.bounds?.width > 0 && captured.bounds?.height > 0);
  assert.equal(captured.ocr.ok, true, captured.ocr.reason);
  assert.equal(captured.localVision.available, false);
  assert.equal(captured.localVision.confidence, null);
  fs.writeFileSync(path.join(outputDir, 'live-desktop.png'), data);
  report.checks.push('Live desktop PNG, actual encoded dimensions, foreground metadata and real OCR');

  observer = createScreenObserver({ dataDir: outputDir });
  assert.equal(observer.running, false);
  observer.ingestFrame(captured);
  await observer.destroy();
  observer = createScreenObserver({ dataDir: outputDir });
  const query = observer.queryContext('current window');
  json('persisted-query.json', query);
  assert.equal(query.latestObservation.observed_text, captured.ocrText);
  assert.equal(query.latestObservation.application_id, captured.appName);
  assert.equal(query.latestObservation.confidence, null);
  assert.equal(query.latestObservation.local_vision_status, 'unavailable');
  assert.equal(query.current, false);
  assert.equal(query.observationStore.persistent, true);
  report.checks.push('File-backed observation survives close/reopen; stopped context is historical');
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = error.stack ?? error.message; process.exitCode = 1;
} finally {
  await observer?.destroy();
  stopDaemon();
  report.finishedAt = new Date().toISOString();
  json('report.json', report);
  console.log(JSON.stringify(report, null, 2));
}
