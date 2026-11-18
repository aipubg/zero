import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { composeZeroPrompt, operatingRules, placeLayer, readIdentity, notebookLayer, skillCatalogLayer, DEFAULT_IDENTITY } from '../packages/agent-runtime/prompt-layers.mjs';

test('the prompt is built from layers in a fixed order and is stable', () => {
  const now = new Date('2026-11-18T09:00:00');
  const input = {
    identity: 'You are Zero.',
    rules: operatingRules({ maxTurns: 30, maxActions: 80, multiGoalGuidance: 'do every goal' }),
    place: placeLayer({ now, cwd: 'E:\\zero', hostname: 'PC', platform: 'Windows_NT 10', homeDir: 'C:\\Users\\o' }),
    notebook: { owner: 'Prefers Hindi replies.', zero: 'Chrome is the default browser.' },
    skills: [{ name: 'web-research', description: 'Research a topic with sources.' }, { name: 'off', description: 'x', enabled: false }],
  };
  const a = composeZeroPrompt(input), b = composeZeroPrompt(input);
  assert.equal(a.text, b.text, 'same inputs give the same text');
  assert.equal(a.hash, b.hash);
  const order = ['You are Zero.', 'HOW YOU WORK', 'WHERE YOU ARE', 'NOTEBOOK', 'SKILLS'].map(marker => a.text.indexOf(marker));
  assert.deepEqual([...order].sort((x, y) => x - y), order, 'layers appear in order');
  assert.ok(order.every(i => i >= 0));
  assert.match(a.text, /80 tool actions and 30 model turns/);
  assert.match(a.text, /web-research: Research a topic/);
  assert.ok(!a.text.includes('- off:'), 'disabled skills are not listed');
});

test('no app-specific scripts in the operating rules', () => {
  const rules = operatingRules({});
  for (const word of ['YouTube', 'Spotify', 'WhatsApp', 'Notifications bell']) assert.ok(!rules.includes(word), `${word} is not hard-coded`);
});

test('identity comes from the file, or the built-in one', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-identity-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'IDENTITY.md');
  assert.equal(readIdentity(file), DEFAULT_IDENTITY, 'missing file → built-in');
  fs.writeFileSync(file, '   ');
  assert.equal(readIdentity(file), DEFAULT_IDENTITY, 'empty file → built-in');
  fs.writeFileSync(file, 'You are Zero, my assistant.\n');
  assert.equal(readIdentity(file), 'You are Zero, my assistant.');
});

test('empty notebook and skills add nothing', () => {
  assert.equal(notebookLayer({}), '');
  assert.equal(skillCatalogLayer([]), '');
  const text = composeZeroPrompt({ identity: 'I', rules: 'R', place: 'P' }).text;
  assert.equal(text, 'I\n\nR\n\nP');
});
