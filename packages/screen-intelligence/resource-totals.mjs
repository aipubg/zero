/** Bounded cumulative-counter accounting. Totals cover measured intervals only. */
export class ResourceTotals {
  constructor() { this.roles = new Map(); this.invalid = 0; this.regressions = 0; }
  observe(role, value) {
    if (!['metadata', 'ocr', 'vision'].includes(role)) throw new Error('Unknown resource role');
    if (!value || !Number.isSafeInteger(value.pid) || value.pid < 1 || !Number.isFinite(Date.parse(value.startedAt)) ||
        !Number.isFinite(value.cpuMs) || value.cpuMs < 0 || !Number.isFinite(value.peakWorkingSetBytes) || value.peakWorkingSetBytes <= 0) { this.invalid++; return; }
    const key = `${value.pid}:${value.startedAt}`;
    let row = this.roles.get(role);
    if (!row) { row = { cpuMs: 0, lastCpuMs: 0, key: null, startedAt: null, processes: 0, samples: 0, peakWorkingSetBytes: 0 }; this.roles.set(role, row); }
    if (row.key !== key) {
      if (row.startedAt && Date.parse(value.startedAt) < Date.parse(row.startedAt)) return;
      row.key = key; row.lastCpuMs = 0; row.startedAt = value.startedAt; row.processes++;
    }
    if (value.cpuMs < row.lastCpuMs) { this.regressions++; return; }
    row.cpuMs += value.cpuMs - row.lastCpuMs;
    row.lastCpuMs = value.cpuMs; row.samples++;
    row.peakWorkingSetBytes = Math.max(row.peakWorkingSetBytes, value.peakWorkingSetBytes);
  }
  snapshot() {
    return { accounting: 'Measured subprocess cumulative CPU deltas; embedded capture is already in Node totals. RAM peaks are per role, not additive concurrent RAM.',
      finalLifetimeCountersVerified: false, invalidSamples: this.invalid, counterRegressions: this.regressions,
      subprocessCpuMs: [...this.roles.values()].reduce((sum, row) => sum + row.cpuMs, 0),
      roles: Object.fromEntries([...this.roles].map(([role, row]) => [role, { ...row }])) };
  }
}
