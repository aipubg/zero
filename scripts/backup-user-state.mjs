import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { ProtectedFields, encryptedPrefix } from '../packages/screen-intelligence/protected-fields.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--state-dir')) throw new Error('Usage: node scripts/backup-user-state.mjs [--state-dir directory]');
const stateDirectory = args.length ? path.resolve(root, args[1]) : path.join(root, '.zero-data');
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
const encryptedSnapshots = [];
for (const record of records.filter(record => /\.(sqlite|db)$/.test(record.file))) {
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
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), stateDirectory, files: records, encryptedSnapshots }, null, 2));
console.log(JSON.stringify({ backupDirectory: target, files: records.length, sqliteIntegrity: 'ok', encryptedSnapshots }));
