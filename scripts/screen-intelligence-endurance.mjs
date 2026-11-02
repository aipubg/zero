/** Real desktop endurance: defaults to 24 measured hours; shortened runs never certify 24h. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';
import { createScreenObserver, SemanticObservationStore } from '../packages/screen-intelligence/index.mjs';
import { captureRealDesktopFrame } from '../packages/screen-intelligence/windows-capture.mjs';
import { stopDaemon } from '../app/zero-control-ui/src/computer/windows-driver.js';
import { LocalInferenceRuntime } from '../packages/model-fabric/local-runtime.mjs';
import { ResourceTotals } from '../packages/screen-intelligence/resource-totals.mjs';

function parseArgs(args) {
  const result = { hours: 24, 'interval-ms': 2000, 'sample-ms': 10_000, 'max-memory-mib': 250,
    'max-rss-mib': 1024, 'max-gap-ms': 60_000 };
  const allowed = new Set([...Object.keys(result), 'output-dir', 'duration-seconds', 'local-vision', 'vision-interval-ms']);
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/u, '');
    if (!allowed.has(key) || !args[i + 1]) throw new Error(`Invalid option ${args[i]}`);
    result[key] = key === 'output-dir' ? args[i + 1] : Number(args[i + 1]);
  }
  for (const [key, value] of Object.entries(result)) {
    if (key !== 'output-dir' && (!Number.isFinite(value) || value <= 0)) throw new Error(`${key} must be positive`);
  }
  if (result['sample-ms'] > result['max-gap-ms']) throw new Error('sample-ms must not exceed max-gap-ms');
  if (result['local-vision'] !== undefined && result['local-vision'] !== 1) throw new Error('local-vision must be 1 when enabled');
  for (const key of ['sample-ms', 'interval-ms']) {
    if (!Number.isSafeInteger(result[key]) || result[key] < 1 || result[key] > 2_147_483_647) throw new Error(`${key} must be a valid integer timer interval`);
  }
  return result;
}

const options = parseArgs(process.argv.slice(2));
const requestedDurationMs = (options['duration-seconds'] ?? options.hours * 3600) * 1000;
const outputDir = path.resolve(options['output-dir'] ?? `artifacts/screen-intelligence/endurance-${new Date().toISOString().replace(/[:.]/gu, '-')}`);
fs.mkdirSync(outputDir, { recursive: true });
if (fs.existsSync(path.join(outputDir, 'manifest.json'))) throw new Error('Output directory already contains endurance evidence; choose a fresh directory');
const save = (name, value) => {
  const destination = path.join(outputDir, name);
  fs.writeFileSync(destination + '.tmp', JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(destination + '.tmp', destination);
};
const events = fs.openSync(path.join(outputDir, 'capture-events.jsonl'), 'ax');
const samples = fs.openSync(path.join(outputDir, 'samples.jsonl'), 'ax');
const startedAt = new Date().toISOString();
const began = performance.now();
const cpuBegan = process.cpuUsage();
const eventLoop = monitorEventLoopDelay({ resolution: 20 });
eventLoop.enable();
const counters = { capturesStarted: 0, capturesSucceeded: 0, capturesFailed: 0, capturesAborted: 0,
  ocrSucceeded: 0, ocrUnavailable: 0, metadataUnavailable: 0, overlapViolations: 0,
  bufferBudgetViolations: 0, rssBudgetViolations: 0, samplingGapViolations: 0 };
const captureResources = { measuredFrames: 0, missingFrames: 0, sameProcessFrames: 0 };
const resources = new ResourceTotals();
const latencyBoundsMs = [100, 250, 500, 1000, 2000, 5000, 10000, 20000, 60000];
const latencyCounts = new Array(latencyBoundsMs.length + 1).fill(0);
let active = 0, peakActive = 0, peakRssBytes = 0, peakRetainedBytes = 0, maxCaptureMs = 0;
let lastSampleAt = began, maxSampleGapMs = 0, latestSuccessAt = began, maxSuccessGapMs = 0;
let sampleCount = 0, stopping = false, shutdownPromise, stopReason = null, fatalError = null;
let persistenceVerified = false;
let persistenceEvidence = null;
let finalVisionSample = { status: 'not-requested' };
// Fixed windows allow a first/last RSS comparison without retaining 24h of samples in RAM.
const firstRss = [], lastRss = [];
const localVision = options['local-vision'] === 1 ? new LocalInferenceRuntime({ enabled: true }) : null;
const manifest = { classification: ['REAL_OS', 'INTEGRATION', 'ENDURANCE'], pid: process.pid, startedAt, outputDir,
  localVisionEnabled: Boolean(localVision), resourceCoverage: 'PARTIAL: per-frame capture topology/counters are recorded; whole-process-lifetime aggregation is incomplete',
  requestedDurationMs, requestedHours: requestedDurationMs / 3600000, options, node: process.version,
  platform: process.platform, host: os.hostname(), completed24Hours: false,
  notes: ['Real capture and WinRT OCR, no mocked desktop source.',
    'Image RAM budget excludes process, SDK and native OCR working memory; Node RSS is measured separately.',
    'No remote/mobile/cloud capability is exercised.',
    'STOP file or SIGINT/SIGTERM stops early; interrupted runs cannot certify 24h.'] };
save('manifest.json', manifest);

const observer = createScreenObserver({ dataDir: outputDir,
  ...(localVision ? { localVisionRuntime: localVision, localVisionMinIntervalMs: options['vision-interval-ms'] ?? 60000 } : {}),
  captureIntervalMs: options['interval-ms'], maxMemoryBytes: Math.floor(options['max-memory-mib'] * 1024 * 1024),
  captureFrame: async ({ signal }) => {
    active++; peakActive = Math.max(peakActive, active); counters.capturesStarted++;
    if (active > 1) counters.overlapViolations++;
    const tickStart = performance.now();
    try {
      const frame = await captureRealDesktopFrame({ signal });
      const durationMs = performance.now() - tickStart;
      maxCaptureMs = Math.max(maxCaptureMs, durationMs);
      const bucket = latencyBoundsMs.findIndex(bound => durationMs <= bound);
      latencyCounts[bucket < 0 ? latencyBoundsMs.length : bucket]++;
      if (signal.aborted || frame.aborted) counters.capturesAborted++;
      else if (frame.ok) {
        counters.capturesSucceeded++;
        resources.observe('metadata', frame.resourceUsage?.metadata);
        resources.observe('ocr', frame.resourceUsage?.ocr);
        if (frame.resourceUsage?.capture) captureResources.measuredFrames++; else captureResources.missingFrames++;
        if (frame.resourceUsage?.capture?.processTopology === 'same-process') captureResources.sameProcessFrames++;
        if (frame.ocr?.ok) counters.ocrSucceeded++; else counters.ocrUnavailable++;
        if (frame.metadataStatus !== 'available') counters.metadataUnavailable++;
        const now = performance.now();
        maxSuccessGapMs = Math.max(maxSuccessGapMs, now - latestSuccessAt);
        latestSuccessAt = now;
      } else counters.capturesFailed++;
      fs.writeSync(events, JSON.stringify({ at: new Date().toISOString(), elapsedMs: performance.now() - began,
        durationMs, ok: frame.ok, aborted: signal.aborted || frame.aborted === true, error: frame.error ?? null,
        bytes: frame.data?.length ?? 0, width: frame.width ?? null, height: frame.height ?? null,
        captureSource: frame.captureSource ?? null, metadataStatus: frame.metadataStatus ?? null,
        ocrStatus: frame.ocr?.status ?? null, ocrReason: frame.ocr?.reason ?? null,
        ocrCharacters: frame.ocrText?.length ?? 0, resourceUsage: frame.resourceUsage ?? null }) + '\n');
      return frame;
    } finally { active--; }
  },
});

const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
function report(status = 'running') {
  const elapsedMs = performance.now() - began;
  const durationReached = elapsedMs >= requestedDurationMs;
  const vision = observer.getStatus().visionInference;
  const healthy = counters.capturesSucceeded > 0 && counters.ocrSucceeded > 0 &&
    counters.capturesFailed === 0 && counters.ocrUnavailable === 0 && counters.metadataUnavailable === 0 &&
    counters.overlapViolations === 0 && counters.bufferBudgetViolations === 0 && counters.rssBudgetViolations === 0 &&
    counters.samplingGapViolations === 0 && maxSuccessGapMs <= options['max-gap-ms'] && !fatalError &&
    (!localVision || (vision.completed > 0 && vision.failed === 0));
  const pipelineHealthy = observer.stats.totalCaptureFailures === 0 && observer.stats.totalFramesIngested === counters.capturesSucceeded;
  return { status, pid: process.pid, startedAt, updatedAt: new Date().toISOString(), elapsedMs,
    requestedDurationMs, elapsedHours: elapsedMs / 3600000, durationReached, stopReason, fatalError,
    captureOcrCompleted24Hours: status === 'completed' && durationReached && elapsedMs >= 86_400_000 && healthy && pipelineHealthy && persistenceVerified,
    completed24Hours: false,
    resourceAcceptance: 'PARTIAL', finalVisionSample, captureResources: { ...captureResources },
    resourceGaps: [...(captureResources.missingFrames || !captureResources.measuredFrames ? ['Unmeasured capture process topology/counters'] : []), 'Whole-process-lifetime aggregation and final counters'],
    localVisionEnabled: Boolean(localVision),
    verdict: status === 'running' ? 'in-progress' : fatalError ? 'failed' : status !== 'completed' || !durationReached ? 'incomplete' : healthy && pipelineHealthy && persistenceVerified ? 'partial' : 'failed',
    pipelineVerdict: status === 'completed' && durationReached && healthy && pipelineHealthy && persistenceVerified ? 'passed' : 'unverified',
    counters: { ...counters }, resourceTotals: resources.snapshot(), peakActiveCaptures: peakActive, sampleCount, peakRssBytes, peakRetainedBytes,
    maxSampleGapMs, maxSuccessGapMs, maxCaptureMs, latencyHistogram: { upperBoundsMs: [...latencyBoundsMs, 'above-60000'], counts: [...latencyCounts] },
    cpu: process.cpuUsage(cpuBegan), firstWindowMeanRssBytes: mean(firstRss), lastWindowMeanRssBytes: mean(lastRss),
    persistenceVerified, persistenceEvidence, observer: observer.getStatus(), outputDir };
}

function sample({ measureVision = true } = {}) {
  // Single-flight sampler reads the owned model PID; the next sample includes
  // its timestamped cumulative counters. It does not sum repeated CPU totals.
  if (measureVision) void localVision?.sampleResources();
  const modelResources = localVision?.getStatus().resources;
  if (modelResources?.status === 'measured') resources.observe('vision', modelResources);
  const now = performance.now(), gapMs = now - lastSampleAt;
  lastSampleAt = now;
  maxSampleGapMs = Math.max(maxSampleGapMs, gapMs);
  if (gapMs > options['max-gap-ms']) counters.samplingGapViolations++;
  maxSuccessGapMs = Math.max(maxSuccessGapMs, now - latestSuccessAt);
  const memory = process.memoryUsage(), buffer = observer.buffer.getStats();
  peakRssBytes = Math.max(peakRssBytes, memory.rss);
  peakRetainedBytes = Math.max(peakRetainedBytes, buffer.retainedMemoryBytes);
  if (buffer.retainedMemoryBytes > buffer.maxMemoryBytes || buffer.frameCount > buffer.maxFrames) counters.bufferBudgetViolations++;
  if (memory.rss > options['max-rss-mib'] * 1024 * 1024) counters.rssBudgetViolations++;
  if (firstRss.length < 60) firstRss.push(memory.rss);
  lastRss.push(memory.rss); if (lastRss.length > 60) lastRss.shift();
  const metric = { at: new Date().toISOString(), elapsedMs: now - began, gapMs, memory,
    localVision: localVision?.getStatus() ?? null,
    systemFreeMemoryBytes: os.freemem(), buffer, counters: { ...counters }, activeCaptures: active,
    eventLoopDelayMs: { mean: Number.isFinite(eventLoop.mean) ? eventLoop.mean / 1e6 : null, max: eventLoop.max / 1e6 },
    cpu: process.cpuUsage(cpuBegan), store: observer.store.getStatus() };
  eventLoop.reset();
  fs.writeSync(samples, JSON.stringify(metric) + '\n');
  sampleCount++;
  save('summary.json', report());
}

async function shutdown(reason) {
  if (stopping) return shutdownPromise;
  stopping = true; stopReason = reason;
  shutdownPromise = (async () => {
    clearInterval(sampler); clearInterval(deadline);
    // The observer aborts OCR and gates completion even if a shared SDK call cannot be cancelled.
    let drainTimeout;
    try {
      await Promise.race([observer.stop(), new Promise((_, reject) => {
        drainTimeout = setTimeout(() => reject(new Error('Capture did not drain within 30 seconds')), 30_000);
      })]);
      clearTimeout(drainTimeout);
      // stop() preserves its awaited pre-close measurement before killing its process.
      // This is not whole-lifetime exit accounting.
      if (localVision) {
        finalVisionSample = localVision.getStatus().lastStopResources || { status: 'unavailable', reason: 'No owned model process reached pre-close sampling' };
        if (finalVisionSample.status === 'measured') resources.observe('vision', finalVisionSample);
      } else finalVisionSample = { status: 'not-applicable', reason: 'Local vision disabled' };
      sample({ measureVision: false });
      const expectedCount = observer.store.getStatus().observationCount;
      await observer.destroy();
      const reopened = new SemanticObservationStore({ dataDir: outputDir });
      try {
        const count = reopened.getStatus().observationCount;
        const latest = reopened.getLatestContext();
        const visionPersisted = !localVision || reopened.getRecentObservations(1000).some(row => row.local_vision_status === 'inferred');
        persistenceVerified = expectedCount > 0 && count === expectedCount && Boolean(latest) && visionPersisted;
        persistenceEvidence = { beforeCloseCount: expectedCount, afterReopenCount: count,
          latestObservationId: latest?.observation_id ?? null, visionPersisted, path: reopened.dbPath, dbBytes: fs.statSync(reopened.dbPath).size };
      } finally { reopened.close(); }
    } catch (error) {
      clearTimeout(drainTimeout);
      fatalError = fatalError ?? error.stack ?? error.message;
    } finally {
      eventLoop.disable(); stopDaemon();
      const result = report(reason === 'duration-reached' && !fatalError ? 'completed' : fatalError ? 'failed' : 'interrupted');
      save('summary.json', result);
      fs.fsyncSync(events); fs.fsyncSync(samples);
      fs.closeSync(events); fs.closeSync(samples);
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.verdict === 'passed' ? 0 : 1;
      // A stuck shared SDK must not keep a failed runner alive forever.
      if (observer.getStatus().captureInFlight) process.exit(process.exitCode);
    }
  })();
  return shutdownPromise;
}

const sampler = setInterval(() => {
  try {
    sample();
    if (fs.existsSync(path.join(outputDir, 'STOP'))) void shutdown('stop-file');
  } catch (error) { fatalError = error.stack ?? error.message; void shutdown('sampling-error'); }
}, options['sample-ms']);
const deadline = setInterval(() => {
  if (performance.now() - began >= requestedDurationMs) void shutdown('duration-reached');
}, Math.min(1000, options['sample-ms']));
process.on('SIGINT', () => { void shutdown('SIGINT'); });
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('uncaughtException', error => { fatalError = error.stack ?? error.message; void shutdown('uncaught-exception'); });
process.on('unhandledRejection', error => { fatalError = String(error?.stack ?? error); void shutdown('unhandled-rejection'); });
sample();
observer.start(); // The CLI invocation is the explicit owner opt-in, independent of host preferences.
console.log(JSON.stringify({ status: 'running', pid: process.pid, outputDir, requestedHours: requestedDurationMs / 3600000,
  completed24Hours: false, stopFile: path.join(outputDir, 'STOP') }));
