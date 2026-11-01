import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, '.backup', `functional-correction-${Date.now()}`);
fs.mkdirSync(target, { recursive: true });
const records = [];
for (const relative of ['.zero-data', 'zero-system/config', 'models']) {
  const directory = path.join(root, relative);
  if (!fs.existsSync(directory)) continue;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(sqlite|db|json)$/.test(entry.name)) continue;
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
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), files: records }, null, 2));
console.log(JSON.stringify({ backupDirectory: target, files: records.length, sqliteIntegrity: 'ok' }));
