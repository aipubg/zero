import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourceTotals } from '../packages/screen-intelligence/resource-totals.mjs';

test('[UNIT] repeated cumulative samples, reused PIDs and stale measurements cannot inflate CPU totals', () => {
  const totals = new ResourceTotals();
  const sample = { pid: 5, startedAt: '2026-11-02T01:00:00Z', cpuMs: 100, peakWorkingSetBytes: 1000 };
  totals.observe('vision', sample); totals.observe('vision', sample);
  totals.observe('vision', { ...sample, cpuMs: 150 });
  totals.observe('vision', { ...sample, startedAt: '2026-11-02T02:00:00Z', cpuMs: 20 });
  totals.observe('vision', sample);
  assert.equal(totals.snapshot().subprocessCpuMs, 170);
  assert.equal(totals.snapshot().roles.vision.processes, 2);
  assert.equal(totals.snapshot().roles.vision.peakWorkingSetBytes, 1000);
});

test('[UNIT] counter regression and absent identity are visible; embedded capture cannot be added twice', () => {
  const totals = new ResourceTotals();
  const sample = { pid: 8, startedAt: '2026-11-02T01:00:00Z', cpuMs: 200, peakWorkingSetBytes: 1000 };
  totals.observe('metadata', sample);
  totals.observe('metadata', { ...sample, cpuMs: 10 });
  totals.observe('ocr', { ...sample, startedAt: undefined });
  assert.equal(totals.snapshot().subprocessCpuMs, 200);
  assert.equal(totals.snapshot().counterRegressions, 1);
  assert.equal(totals.snapshot().invalidSamples, 1);
  assert.throws(() => totals.observe('capture', sample), /Unknown resource role/);
  assert.equal(totals.snapshot().finalLifetimeCountersVerified, false);
});
