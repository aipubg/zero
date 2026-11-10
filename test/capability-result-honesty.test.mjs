import test from 'node:test';
import assert from 'node:assert/strict';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';

test('[CONTRACT] supplied operator failure cannot become success from executed/verified flags', async () => {
  const engine = new CapabilityEngine({ operator: {
    evaluateSafety: () => ({ allowed: true }),
    execute: async () => ({ ok: false, executed: true, verified: true, outcome: 'COMPLETED', error: 'Readback failed' }),
  } });
  const result = await engine.execute({ toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click' } });
  assert.equal(result.executed, true);
  assert.equal(result.ok, false); assert.equal(result.verified, false); assert.equal(result.completed, false);
  assert.equal(result.outcome, 'FAILED');
});

test('[CONTRACT] cancellation dominates a late successful native completion', async () => {
  const controller = new AbortController();
  const engine = new CapabilityEngine({ operator: {
    evaluateSafety: () => ({ allowed: true }),
    execute: async () => { controller.abort(); return { ok: true, executed: true, verified: true, outcome: 'COMPLETED' }; },
  } });
  const result = await engine.execute({ toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click' }, signal: controller.signal });
  assert.equal(result.ok, false); assert.equal(result.verified, false); assert.equal(result.completed, false);
  assert.equal(result.outcome, 'CANCELLED');
});
