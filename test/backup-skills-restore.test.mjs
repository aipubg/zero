import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { SkillLoader } from '../packages/skill-sdk/index.mjs';
import { restoreUserState } from '../scripts/restore-user-state.mjs';

test('[INTEGRATION] backup restores skill instructions, nested executable bytes and enable/config state', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-skill-restore-'));
  const skills = path.join(root, 'skills'); const state = path.join(root, 'state');
  fs.mkdirSync(path.join(skills, 'restore-proof', 'scripts'), { recursive: true }); fs.mkdirSync(state);
  const code = "console.log('RESTORED_SKILL_SCRIPT')";
  fs.writeFileSync(path.join(skills, 'restore-proof', 'SKILL.md'), '---\nname: restore-proof\ndescription: Controlled backup skill\n---\nRun scripts/proof.mjs for a storage recovery check.');
  fs.writeFileSync(path.join(skills, 'restore-proof', 'scripts', 'proof.mjs'), code);
  const loader = new SkillLoader({ skillsDir: skills });
  loader.disableSkill('restore-proof'); loader.configureSkill('restore-proof', { retained: 'user setting' });
  try {
    const output = execFileSync(process.execPath, ['scripts/backup-user-state.mjs', '--state-dir', state, '--skills-dir', skills], { encoding: 'utf8', windowsHide: true });
    const backup = JSON.parse(output.trim()).backupDirectory;
    const restoredRoot = path.join(root, 'restored');
    await restoreUserState(backup, restoredRoot);
    const restored = new SkillLoader({ skillsDir: path.join(restoredRoot, 'skills') });
    assert.equal(restored.getSkill('restore-proof').enabled, false);
    assert.equal(restored.getSkillConfig('restore-proof').retained, 'user setting');
    assert.equal(fs.readFileSync(path.join(restoredRoot, 'skills/restore-proof/scripts/proof.mjs'), 'utf8'), code);
    const executed = execFileSync(process.execPath, [path.join(restoredRoot, 'skills/restore-proof/scripts/proof.mjs')], { encoding: 'utf8', windowsHide: true }).trim();
    assert.equal(executed, 'RESTORED_SKILL_SCRIPT');
    const evidence = path.resolve('artifacts/restore-skills', String(Date.now())); fs.mkdirSync(evidence, { recursive: true });
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify({ classification: ['INTEGRATION'], status: 'PASS', backup, restoredDisabledState: true, restoredConfig: true, nestedScriptBytesPreserved: true, actualRestoredScriptOutput: executed, scope: 'Controlled skill backup/restore with direct Node script execution; not external skill/task acceptance or plugin bundle recovery' }, null, 2));
  } finally {
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-skill-restore-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
