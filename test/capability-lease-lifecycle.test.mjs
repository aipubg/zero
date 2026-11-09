import test from 'node:test';
import assert from 'node:assert/strict';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { DesktopLeaseManager } from '../packages/agent-runtime/desktop-lease.mjs';

test('[CONTRACT] local desktop leases cover execution and hand directly to the next agent', async t => {
  const lease = new DesktopLeaseManager(); t.after(() => lease.forceRelease('test cleanup'));
  let release; const held = new Promise(resolve => { release = resolve; });
  const order = [];
  const engine = new CapabilityEngine({ leaseManager: lease, operator: {
    evaluateSafety: () => ({ allowed: true }),
    execute: async (_action, params) => {
      order.push(params.tag + ':start');
      if (params.tag === 'first') await held;
      order.push(params.tag + ':end');
      return { ok: true, executed: true, verified: false };
    },
  } });
  const first = engine.execute({ agentId: 'one', toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click', tag: 'first' } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(lease.getStatus().holder, 'one');
  assert.ok(lease.getStatus().remainingMs > 33000, 'Lease must cover the complete 30-second command budget plus teardown margin');
  const second = engine.execute({ agentId: 'two', toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click', tag: 'second' } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(lease.getStatus().queueLength, 1);
  assert.deepEqual(order, ['first:start']);
  release(); await first; await second;
  assert.deepEqual(order, ['first:start', 'first:end', 'second:start', 'second:end']);
  assert.equal(lease.isHeld(), false);
});

test('[CONTRACT] preowned task lease remains held and cancelled queued acquisition never dispatches', async t => {
  const lease = new DesktopLeaseManager(); t.after(() => lease.forceRelease('test cleanup'));
  await lease.acquireLease('owner');
  let calls = 0;
  const engine = new CapabilityEngine({ leaseManager: lease, operator: {
    evaluateSafety: () => ({ allowed: true }), execute: async () => { calls++; return { ok: true }; },
  } });
  await engine.execute({ agentId: 'owner', toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click' } });
  assert.equal(lease.getStatus().holder, 'owner');
  const controller = new AbortController();
  const waiting = engine.execute({ agentId: 'other', toolName: 'zero_computer_action', args: { action: 'desktop', command: 'click' }, signal: controller.signal });
  const rejected = assert.rejects(waiting, /cancel|abort/i);
  await new Promise(resolve => setImmediate(resolve)); controller.abort(); await rejected;
  assert.equal(calls, 1); assert.equal(lease.getStatus().queueLength, 0); assert.equal(lease.getStatus().holder, 'owner');
});
