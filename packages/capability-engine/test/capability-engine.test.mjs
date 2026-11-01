import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CapabilityEngine } from '../index.mjs';

describe('Zero Capability Execution Engine', () => {
  it('validates registered capabilities and rejects unknown tools', () => {
    const engine = new CapabilityEngine();
    const valid = engine.validate('zero_computer_action', { action: 'open_app', app: 'notepad' });
    assert.equal(valid.valid, true);
    assert.equal(valid.action, 'open_app');

    const invalid = engine.validate('unsupported_danger_tool', { action: 'hack' });
    assert.equal(invalid.valid, false);
    assert.ok(invalid.error.includes('Unsupported capability'));
  });

  it('rejects disallowed action under a valid capability', () => {
    const engine = new CapabilityEngine();
    const invalidAction = engine.validate('open_app', { action: 'format_drive' });
    assert.equal(invalidAction.valid, false);
    assert.ok(invalidAction.error.includes('is not permitted'));
  });

  it('enforces human takeover hold arbitration', async () => {
    const engine = new CapabilityEngine();
    engine.operator.setHumanHold(true);

    const res = await engine.execute({
      agentId: 'zero',
      toolName: 'zero_computer_action',
      args: { action: 'left_click', x: 500, y: 500 },
    });

    assert.equal(res.ok, false);
    assert.equal(res.error, 'computer-hold:human-control');
    assert.ok(res.auditId);

    const log = engine.getAuditLog();
    assert.equal(log[log.length - 1].decision, 'BLOCKED_BY_HOLD');
  });

  it('records structured audit events for every invocation', async () => {
    const engine = new CapabilityEngine();
    const res = await engine.execute({
      agentId: 'zero',
      toolName: 'zero_computer_action',
      args: { action: 'get_screen_size' },
    });

    assert.equal(res.ok, true);
    assert.ok(res.auditId);
    assert.ok(typeof res.durationMs === 'number');

    const log = engine.getAuditLog();
    assert.ok(log.length > 0);
    const last = log[log.length - 1];
    assert.equal(last.agentId, 'zero');
    assert.equal(last.toolName, 'zero_computer_action');
    assert.equal(last.decision, 'ALLOWED');
  });
});
