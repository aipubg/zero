import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { ProtectedFields, encryptedPrefix } from '../packages/screen-intelligence/protected-fields.mjs';

async function digest(filename) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

export async function restoreUserState(backupDirectory, destination) {
  const sourceRoot = fs.realpathSync(path.resolve(backupDirectory));
  const target = path.resolve(destination);
  if (fs.existsSync(target)) throw new Error('Restore destination already exists; existing data preserved');
  const manifest = JSON.parse(await fs.promises.readFile(path.join(sourceRoot, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Backup manifest has no files');
  const seen = new Set(); const entries = [];
  for (const record of manifest.files) {
    if (typeof record.file !== 'string') throw new Error('Invalid backup file path');
    const parts = record.file.replaceAll('\\', '/').split('/');
    if (parts.some(part => !part || part === '.' || part === '..' || /[<>:"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part))) throw new Error('Unsafe backup file path');
    const relative = parts.join('/');
    if (!/^(\.zero-data|models)\/[^/]+$|^zero-system\/config\/[^/]+$/.test(relative)) throw new Error('Unsupported backup file location');
    if (seen.has(relative.toLowerCase())) throw new Error('Duplicate backup destination');
    seen.add(relative.toLowerCase());
    if (!Number.isSafeInteger(record.bytes) || record.bytes < 0 || !/^[a-f0-9]{64}$/.test(record.sha256)) throw new Error('Invalid backup integrity metadata');
    const source = fs.realpathSync(path.join(sourceRoot, ...parts));
    const contained = path.relative(sourceRoot, source);
    if (contained.startsWith('..') || path.isAbsolute(contained)) throw new Error('Backup source escapes backup directory');
    if (!fs.statSync(source).isFile() || fs.statSync(source).size !== record.bytes || await digest(source) !== record.sha256) throw new Error('Backup hash/size mismatch');
    if (/\.(sqlite|db)$/i.test(relative)) {
      const db = new DatabaseSync(source, { readOnly: true });
      try { if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Backup SQLite integrity failed'); }
      finally { db.close(); }
    }
    entries.push({ ...record, parts, source });
  }
  let authenticatedFields = 0;
  for (const entry of entries.filter(entry => /\.(sqlite|db)$/i.test(entry.file))) {
    const db = new DatabaseSync(entry.source, { readOnly: true });
    let protection;
    try {
      if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='semantic_observations'").get()) continue;
      for (const row of db.prepare('SELECT * FROM semantic_observations').iterate()) {
        for (const [column, value] of Object.entries(row)) {
          if (typeof value !== 'string' || !value.startsWith(encryptedPrefix)) continue;
          if (!protection) {
            if (!entries.some(key => key.source === entry.source + '.key.dpapi')) throw new Error('Encrypted backup is missing its manifest-verified paired key');
            protection = new ProtectedFields({ keyPath: entry.source + '.key.dpapi', hasCiphertext: true });
          }
          protection.open(column, row.observation_id, value);
          authenticatedFields++;
        }
      }
    } finally { protection?.destroy(); db.close(); }
  }
  // Exclusive destination creation occurs only after the complete input validates.
  await fs.promises.mkdir(target);
  try {
    for (const entry of entries) {
      const output = path.join(target, ...entry.parts);
      await fs.promises.mkdir(path.dirname(output), { recursive: true });
      await fs.promises.copyFile(entry.source, output, fs.constants.COPYFILE_EXCL);
      if (await digest(output) !== entry.sha256) throw new Error('Restored file hash mismatch');
    }
    return { status: 'RESTORED', destination: target, files: entries.length, hashesVerified: true, sqliteIntegrity: 'ok', authenticatedFields, activation: 'NOT_RUN; restored files are not automatically activated', encryptedData: authenticatedFields ? 'All encrypted observation fields authenticated using original Windows identity before restore' : 'No encrypted observation fields found; decryption NOT_RUN' };
  } catch (error) {
    // Preserve partial output for diagnosis; never delete concurrent user files.
    error.message = `Restore incomplete; new destination retained for inspection: ${error.message}`;
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 4) throw new Error('Usage: node scripts/restore-user-state.mjs BACKUP_DIRECTORY NEW_DESTINATION');
  console.log(JSON.stringify(await restoreUserState(process.argv[2], process.argv[3])));
}
