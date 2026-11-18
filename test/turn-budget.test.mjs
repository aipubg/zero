import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { turnBudgetHint, TURN_BUDGET_PREFIX } from '../packages/agent-runtime/turn-budget.mjs';
import { startChatHarness } from './helpers/zero-chat-harness.mjs';

test('budget hint appears only when little is left', () => {
  assert.equal(turnBudgetHint({ turnsLeft: 10, actionsLeft: 40 }), '');
  assert.match(turnBudgetHint({ turnsLeft: 2, actionsLeft: 40 }), /only 2 model turn\(s\) and 40 tool action\(s\) left/);
  assert.match(turnBudgetHint({ turnsLeft: 9, actionsLeft: 3 }), new RegExp(`^${TURN_BUDGET_PREFIX}`));
});

test('a long task is warned before the budget ends and closes with a report, not an error', { timeout: 60000 }, async t => {
  let target;
  const { requests, ask } = await startChatHarness(t, {
    prefix: 'zero-budget-',
    hostOptions: { maxAssistantTurns: 4 },
    reply: request => (request.tools?.length ? { toolCalls: [{ name: 'read_file', args: { path: target } }] } : { text: 'Read the file 4 times; the summary step is still left.' }),
  });
  target = path.resolve('README.md');
  assert.ok(fs.existsSync(target));
  const result = await ask('chat-budget', 'keep reading that file');
  const hinted = requests.filter(r => r.messages.some(m => m.role === 'system' && String(m.content).startsWith(TURN_BUDGET_PREFIX)));
  assert.ok(hinted.length >= 1, 'a budget warning was sent');
  assert.equal(hinted[0].messages.filter(m => String(m.content).startsWith(TURN_BUDGET_PREFIX)).length, 1, 'only one warning at a time');
  const closing = requests.at(-1);
  assert.ok(!closing.tools?.length, 'the closing report request offers no tools');
  assert.match(String(result?.content ?? result?.finalContent ?? JSON.stringify(result)), /summary step is still left/);
});
