// skill_read: load one skill's full instructions on demand (the prompt only
// carries the Skill Catalog: names and one-line descriptions).
import fs from 'node:fs';
import path from 'node:path';

const MAX_FILE_BYTES = 200 * 1024;

function listFiles(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, base, out);
    else if (entry.name !== 'SKILL.md') out.push(path.relative(base, full).replace(/\\/g, '/'));
    if (out.length >= 50) break;
  }
  return out;
}

export function readSkillForModel(loader, name, file) {
  const skill = loader.getSkill(String(name || '').trim());
  if (!skill) {
    const known = loader.listSkills().filter(s => s.enabled !== false).map(s => s.name);
    return { ok: false, error: `No skill named '${name}'.`, available: known };
  }
  if (skill.enabled === false) return { ok: false, error: `Skill '${skill.name}' is turned off by the owner.` };
  if (skill.disableModelInvocation) return { ok: false, error: `Skill '${skill.name}' can only be run by the owner.` };
  const dir = path.dirname(skill.filePath);
  if (file) {
    const target = path.resolve(dir, String(file));
    if (target !== dir && !target.startsWith(dir + path.sep)) return { ok: false, error: 'That file is outside the skill folder.' };
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return { ok: false, error: `No file '${file}' in skill '${skill.name}'.`, files: listFiles(dir) };
    if (fs.statSync(target).size > MAX_FILE_BYTES) return { ok: false, error: `'${file}' is larger than ${MAX_FILE_BYTES / 1024} KB; use read_file with a range.` };
    return { ok: true, skill: skill.name, file: String(file), content: fs.readFileSync(target, 'utf8') };
  }
  return { ok: true, skill: skill.name, description: skill.description, instructions: skill.content, files: listFiles(dir) };
}
