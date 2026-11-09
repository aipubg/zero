import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { ProtectedFields, encryptedPrefix } from '../packages/screen-intelligence/protected-fields.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const options = new Map();
for (let index = 0; index < args.length; index += 2) {
  if (!['--state-dir', '--skills-dir'].includes(args[index]) || !args[index + 1] || options.has(args[index])) throw new Error('Usage: node scripts/backup-user-state.mjs [--state-dir directory] [--skills-dir directory]');
  options.set(args[index], path.resolve(root, args[index + 1]));
}
const stateDirectory = options.get('--state-dir') || path.join(root, '.zero-data');
const skillsDirectory = options.get('--skills-dir') || process.env.ZERO_SKILLS_DIR || path.join(root, 'skills');
const target = path.join(root, '.backup', `functional-correction-${Date.now()}`);
fs.mkdirSync(target, { recursive: true });
const records = [];
for (const relative of ['.zero-data', 'zero-system/config', 'models']) {
  const directory = relative === '.zero-data' ? stateDirectory : path.join(root, relative);
  if (!fs.existsSync(directory)) continue;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(sqlite|db|json)$|\.key\.dpapi$/.test(entry.name)) continue;
    const source = path.join(directory, entry.name);
    const destination = path.join(target, relative, entry.name);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (/\.(sqlite|db)$/.test(entry.name)) {
      const db = new DatabaseSync(source, { readOnly: true });
      try { await backup(db, destination); } finally { db.close(); }
      const check = new DatabaseSync(destination, { readOnly: true });
      try {
        const result = check.prepare('PRAGMA integrity_check').get();
        if (result.integrity_check !== 'ok') throw new Error(`Backup integrity failed: ${relative}/${entry.name}`);
      } finally { check.close(); }
    } else fs.copyFileSync(source, destination);
    const bytes = fs.readFileSync(destination);
    records.push({ file: path.join(relative, entry.name), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
}
async function copySkills(directory, relative = 'skills') {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.bin') continue;
    const source = path.join(directory, entry.name);
    const file = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Bundle backup cannot follow symbolic links');
    if (entry.isDirectory()) { await copySkills(source, file); continue; }
    if (!entry.isFile()) throw new Error('Skill backup requires regular files');
    const destination = path.join(target, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    const hash = createHash('sha256');
    for await (const chunk of fs.createReadStream(destination)) hash.update(chunk);
    records.push({ file, bytes: fs.statSync(destination).size, sha256: hash.digest('hex') });
  }
}
await copySkills(path.resolve(skillsDirectory));
await copySkills(path.join(stateDirectory, 'plugin-sdk'), path.join('.zero-data', 'plugin-sdk'));
const encryptedSnapshots = [];
for (const record of records.filter(record => /^\.zero-data[/\\][^/\\]+\.(sqlite|db)$/.test(record.file))) {
  const filename = path.join(target, record.file);
  const db = new DatabaseSync(filename, { readOnly: true });
  let protection;
  try {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='semantic_observations'").get()) continue;
    let authenticatedFields = 0;
    let authenticatedRows = 0;
    for (const row of db.prepare('SELECT * FROM semantic_observations').iterate()) {
      let encrypted = false;
      for (const [column, value] of Object.entries(row)) {
        if (typeof value !== 'string' || !value.startsWith(encryptedPrefix)) continue;
        if (!protection) {
          if (!fs.existsSync(filename + '.key.dpapi')) throw new Error('Encrypted snapshot is missing its paired DPAPI key');
          protection = new ProtectedFields({ keyPath: filename + '.key.dpapi', hasCiphertext: true });
        }
        protection.open(column, row.observation_id, value); authenticatedFields++; encrypted = true;
      }
      if (encrypted) authenticatedRows++;
    }
    if (authenticatedFields) encryptedSnapshots.push({ file: record.file, pairedKeyCopied: true, authenticatedFields, authenticatedRows });
  } finally { protection?.destroy(); db.close(); }
}
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), stateDirectory, skillsDirectory, coverage: { skills: 'Recursive files and persisted settings; .git/.bin excluded, links rejected', plugins: 'Registration database plus managed plugin-sdk bundles/data; .git/.bin excluded, links rejected; external custom plugin roots not included', modelBinaries: 'NOT_INCLUDED' }, files: records, encryptedSnapshots }, null, 2));
console.log(JSON.stringify({ backupDirectory: target, files: records.length, sqliteIntegrity: 'ok', encryptedSnapshots }));
