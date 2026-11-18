import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startChatHarness, systemText } from './helpers/zero-chat-harness.mjs';

const writeSkill = (dir, name, description, body, extra = '') => {
  fs.mkdirSync(path.join(dir, name, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(dir, name, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n${extra}---\n${body}\n`);
};

test('the prompt lists skills by name and skill_read loads one on demand', { timeout: 40000 }, async t => {
  const results = [];
  const { host, requests, ask, skillsDir } = await startChatHarness(t, {
    prefix: 'zero-skill-catalog-',
    reply: request => {
      const last = request.messages.at(-1);
      if (last.role === 'tool') { results.push(JSON.parse(last.content)); }
      const step = results.length;
      if (last.role === 'user' || last.role === 'tool' || last.role === 'system') {
        if (step === 0) return { toolCalls: [{ name: 'skill_read', args: { name: 'invoice-filing' } }] };
        if (step === 1) return { toolCalls: [{ name: 'skill_read', args: { name: 'invoice-filing', file: 'scripts/file.ps1' } }] };
        if (step === 2) return { toolCalls: [{ name: 'skill_read', args: { name: 'invoice-filing', file: '../other/SKILL.md' } }] };
      }
      return { text: 'Filed.' };
    },
  });
  writeSkill(skillsDir, 'invoice-filing', 'File monthly invoices into the right folder.', '## Steps\n1. Open the Invoices folder.');
  fs.writeFileSync(path.join(skillsDir, 'invoice-filing', 'scripts', 'file.ps1'), 'Write-Output filed');
  writeSkill(skillsDir, 'owner-only', 'Only the owner runs this.', 'secret steps', 'disable-model-invocation: true\n');
  host.skillLoader.loadAll();

  await ask('chat-skills', 'file my invoices');
  const prompt = systemText(requests[0]);
  assert.match(prompt, /SKILLS \(step-by-step guides/);
  assert.match(prompt, /- invoice-filing: File monthly invoices/);
  assert.ok(!prompt.includes('## Steps'), 'full instructions are not in the prompt');
  assert.ok(!prompt.includes('owner-only'), 'owner-only skills are not offered to the model');

  const tools = requests[0].tools.map(tool => tool.function.name);
  assert.ok(tools.includes('skill_read'), 'skill_read is offered');
  const unwrap = r => r.result ?? r.data ?? r;
  assert.equal(unwrap(results[0]).instructions, '## Steps\n1. Open the Invoices folder.');
  assert.deepEqual(unwrap(results[0]).files, ['scripts/file.ps1']);
  assert.equal(unwrap(results[1]).content, 'Write-Output filed');
  assert.match(JSON.stringify(results[2]), /outside the skill folder/);
});
