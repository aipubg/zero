import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCapabilityEngine } from '../packages/capability-engine/index.mjs';
import { ComputerOperator } from '../packages/capability-engine/computer-operator.mjs';
import { KeyboardTargetScope } from '../packages/capability-engine/keyboard-rule.mjs';

test('keyboard scope resolves a target from the active foreground window', async () => {
  const scope = new KeyboardTargetScope({
    osController: {
      async getActiveWindow() {
        return { ok: true, title: 'Chrome' };
      },
      async focusWindow() {
        return { ok: true, window: { title: 'Chrome' } };
      },
    },
  });
  const checked = await scope.before({ action: 'hotkey', args: { key: 'Control+L' } });
  assert.equal(checked.refusal, undefined);
  assert.equal(checked.args.target, 'Chrome');
});

test('keyboard actions without a target use the foreground input path', async () => {
  const sentKeys = [];
  const typedTargets = [];
  const operator = new ComputerOperator({
    keyboardDriver: {
      async pressKey(key) {
        sentKeys.push(key);
        return { ok: true };
      },
    },
    typeIntoWindowAction: async options => {
      typedTargets.push(options.target);
      return { ok: true, executed: true, verified: true, completed: true, outcome: 'COMPLETED' };
    },
  });
  const originalOperator = canonicalCapabilityEngine.operator;
  canonicalCapabilityEngine.operator = operator;
  try {
    const hotkeyResult = await canonicalCapabilityEngine.execute({
      toolName: 'hotkey',
      args: { key: 'Control+L' },
    });
    const keyResult = await canonicalCapabilityEngine.execute({
      toolName: 'key',
      args: { key: 'Enter' },
    });
    const actionKeyResult = await canonicalCapabilityEngine.execute({
      toolName: 'zero_computer_action',
      args: { action: 'key', key: 'Escape' },
    });
    const typeResult = await canonicalCapabilityEngine.execute({
      toolName: 'type_text',
      args: { text: 'foreground input' },
    });

    assert.equal(hotkeyResult.outcome, 'COMPLETED');
    assert.equal(hotkeyResult.error, undefined);
    assert.equal(keyResult.outcome, 'COMPLETED');
    assert.equal(actionKeyResult.outcome, 'COMPLETED');
    assert.equal(typeResult.outcome, 'COMPLETED');
    assert.deepEqual(typedTargets, [null]);
    assert.deepEqual(sentKeys, ['Control+L', 'Enter', 'Escape']);
  } finally {
    canonicalCapabilityEngine.operator = originalOperator;
  }
});
