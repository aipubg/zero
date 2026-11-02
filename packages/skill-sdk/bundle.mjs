import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export function readSkillBundle(directory) {
  const files = [];
  const walk = (relative = '') => {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.git' || entry.name.startsWith('.skill-')) continue;
      const local = path.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Skill bundles cannot contain symbolic links');
      if (entry.isDirectory()) walk(local);
      else if (entry.isFile()) {
        const full = path.join(directory, local);
        const data = fs.readFileSync(full);
        const text = data.toString('utf8');
        const utf8 = !text.includes('\0') && Buffer.from(text).equals(data);
        files.push({ path: local.split(path.sep).join('/'), content: utf8 ? text : data.toString('base64'),
          encoding: utf8 ? 'utf8' : 'base64', executable: Boolean(fs.statSync(full).mode & 0o111) });
      } else throw new Error('Unsupported skill bundle file');
    }
  };
  walk();
  const manifest = files.find(file => file.path === 'SKILL.md');
  if (!manifest || manifest.encoding !== 'utf8') throw new Error('Skill bundle requires a UTF-8 SKILL.md');
  const revision = createHash('sha256').update(JSON.stringify(files)).digest('hex');
  return { content: manifest.content, files: files.filter(file => file !== manifest), revision };
}

export function writeSkillBundle(directory, content, files = []) {
  if (typeof content !== 'string' || !Array.isArray(files)) throw new Error('Skill bundle requires content and an array of support files');
  fs.writeFileSync(path.join(directory, 'SKILL.md'), content, 'utf8');
  const seen = new Set(['skill.md']);
  for (const file of files) {
    const relative = file.path;
    if (typeof relative !== 'string' || !relative || /[\\:\0]/.test(relative) || relative.startsWith('/') ||
      relative.split('/').some(part => !part || part === '.' || part === '..' || part === '.git' || part.startsWith('.skill-')) || seen.has(relative.toLowerCase())) {
      throw new Error('Support file paths must be distinct relative paths inside the skill bundle');
    }
    seen.add(relative.toLowerCase());
    if (typeof file.content !== 'string' || !['utf8', 'base64'].includes(file.encoding || 'utf8')) throw new Error('Support files require text or base64 content');
    if (file.encoding === 'base64' && (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.content))) throw new Error('Invalid base64 support file');
    const target = path.join(directory, ...relative.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.content, { encoding: file.encoding || 'utf8', mode: file.executable ? 0o755 : 0o644 });
  }
}
