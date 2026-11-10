import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { DatabaseSync, backup as sqliteBackup } from 'node:sqlite';
import { SemanticObservationStore } from '../packages/screen-intelligence/semantic-store.mjs';
import { restoreUserState } from '../scripts/restore-user-state.mjs';

test('[INTEGRATION] restore reopens actual SQLite rows and JSON, rejects overwrite, corruption and escaping paths', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-restore-'));
  const backup = path.join(root, 'backup'); fs.mkdirSync(path.join(backup, '.zero-data'), { recursive: true });
  const dbPath = path.join(backup, '.zero-data', 'sessions.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE messages (content TEXT)');
  db.prepare('INSERT INTO messages VALUES (?)').run('मेरा पुराना chat सुरक्षित रहे'); db.close();
  fs.mkdirSync(path.join(backup, 'models'));
  fs.writeFileSync(path.join(backup, 'models', 'settings.json'), JSON.stringify({ retained: 'owner preference' }));
  const files = ['.zero-data/sessions.sqlite', 'models/settings.json'].map(file => {
    const bytes = fs.readFileSync(path.join(backup, file));
    return { file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  });
  const manifest = path.join(backup, 'manifest.json');
  const save = entries => fs.writeFileSync(manifest, JSON.stringify({ files: entries }));
  const destination = path.join(root, 'restored');
  try {
    save(files);
    assert.equal((await restoreUserState(backup, destination)).files, 2);
    const restored = new DatabaseSync(path.join(destination, files[0].file), { readOnly: true });
    try { assert.equal(restored.prepare('SELECT content FROM messages').get().content, 'मेरा पुराना chat सुरक्षित रहे'); }
    finally { restored.close(); }
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination, files[1].file))).retained, 'owner preference');
    const beforeOverwriteAttempt = files.map(record => fs.readFileSync(path.join(destination, record.file)));
    await assert.rejects(restoreUserState(backup, destination), /already exists/);
    for (const [index, record] of files.entries()) assert.deepEqual(fs.readFileSync(path.join(destination, record.file)), beforeOverwriteAttempt[index]);
    for (const record of [{ ...files[0], file: '../outside.sqlite' }, { ...files[0], file: '.zero-data/CON.sqlite' }, { ...files[0], sha256: '0'.repeat(64) }]) {
      save([record]);
      await assert.rejects(restoreUserState(backup, path.join(root, 'invalid')), /path|mismatch/);
      assert.equal(fs.existsSync(path.join(root, 'invalid')), false);
    }
    for (const duplicate of [files[0], { ...files[0], file: '.zero-data/SESSIONS.SQLITE' }]) {
      save([files[0], duplicate]);
      const target = path.join(root, 'duplicate');
      await assert.rejects(restoreUserState(backup, target), /Duplicate backup destination/);
      assert.equal(fs.existsSync(target), false);
    }
  } finally {
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-restore-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

test('[INTEGRATION] failed later plugin relocation rolls back earlier source rewrites', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-restore-'));
  const backup = path.join(root, 'backup');
  const marker = '.zero-data/plugin-sdk/releases/revision-a/.zero-plugin-revision';
  fs.mkdirSync(path.dirname(path.join(backup, marker)), { recursive: true });
  fs.writeFileSync(path.join(backup, marker), 'revision-a');
  const originalState = path.join(root, 'original-state');
  const originalSources = ['revision-a', 'revision-b'].map(revision => JSON.stringify({ root: path.join(originalState, 'plugin-sdk/releases', revision), revision, packageRoot: '.' }));
  const dbPath = path.join(backup, '.zero-data/zero-plugins.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE zero_installed_plugins (id TEXT PRIMARY KEY, source TEXT)');
  db.prepare('INSERT INTO zero_installed_plugins VALUES (?,?)').run('first', originalSources[0]);
  db.prepare('INSERT INTO zero_installed_plugins VALUES (?,?)').run('second', originalSources[1]);
  db.close();
  const originalBytes = fs.readFileSync(dbPath);
  const files = ['.zero-data/zero-plugins.sqlite', marker].map(file => {
    const bytes = fs.readFileSync(path.join(backup, file));
    return { file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  });
  fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ stateDirectory: originalState, files }));
  const destination = path.join(root, 'restored');
  try {
    await assert.rejects(restoreUserState(backup, destination), /ownership marker missing/);
    const restored = new DatabaseSync(path.join(destination, '.zero-data/zero-plugins.sqlite'), { readOnly: true });
    try { assert.deepEqual(restored.prepare('SELECT source FROM zero_installed_plugins ORDER BY id').all().map(row => row.source), originalSources); }
    finally { restored.close(); }
    assert.deepEqual(fs.readFileSync(dbPath), originalBytes);
    const evidence = path.resolve('artifacts/restore-plugin-transaction', String(Date.now())); fs.mkdirSync(evidence, { recursive: true });
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify({ classification: ['INTEGRATION'], status: 'PASS', failedSecondSourceRejected: true, firstSourceRewriteRolledBack: true, originalBackupBytesUnchanged: true, scope: 'Actual SQLite migration rollback with controlled metadata; executable plugin recovery proved separately' }, null, 2));
  } finally {
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir())); assert.ok(path.basename(resolved).startsWith('zero-restore-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

test('[REAL_OS] restored SQLite snapshot decrypts with copied Windows DPAPI key and rejects omitted key', { skip: process.platform !== 'win32' }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-restore-'));
  const livePath = path.join(root, 'live.sqlite');
  const backup = path.join(root, 'backup');
  fs.mkdirSync(path.join(backup, '.zero-data'), { recursive: true });
  const marker = 'Known restore verification record ' + crypto.randomUUID();
  let live; let restored;
  try {
    live = new SemanticObservationStore({ dbPath: livePath });
    live.insertObservation({ observation_id: 'restore-proof', observed_text: marker, application_id: 'verification', semantic_summary: 'Known controlled record', metadata: { source: 'storage test, not continuous capture' } });
    const snapshot = path.join(backup, '.zero-data', 'observations.sqlite');
    await sqliteBackup(live.db, snapshot);
    fs.copyFileSync(livePath + '.key.dpapi', snapshot + '.key.dpapi');
    live.close(); live = null;
    const files = ['.zero-data/observations.sqlite', '.zero-data/observations.sqlite.key.dpapi'].map(file => {
      const bytes = fs.readFileSync(path.join(backup, file));
      return { file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
    });
    fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ files }));
    const destination = path.join(root, 'restored');
    const result = await restoreUserState(backup, destination);
    assert.ok(result.authenticatedFields >= 4);
    const restoredPath = path.join(destination, files[0].file);
    assert.equal(fs.readFileSync(restoredPath).includes(Buffer.from(marker)), false);
    restored = new SemanticObservationStore({ dbPath: restoredPath });
    assert.equal(restored.getLatestContext().observed_text, marker);
    assert.equal(restored.searchObservations(marker).length, 1);
    restored.close(); restored = null;
    fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ files: files.slice(0, 1) }));
    const missingKeyDestination = path.join(root, 'missing-key');
    await assert.rejects(restoreUserState(backup, missingKeyDestination), /manifest-verified paired key/);
    assert.equal(fs.existsSync(missingKeyDestination), false);
    const corrupt = new DatabaseSync(snapshot);
    corrupt.exec('UPDATE semantic_observations SET observed_text=semantic_summary');
    corrupt.close();
    // Valid SQLite and updated file hash cannot disguise failed field authentication.
    const modified = fs.readFileSync(snapshot);
    files[0].bytes = modified.length;
    files[0].sha256 = createHash('sha256').update(modified).digest('hex');
    fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ files }));
    const corruptDestination = path.join(root, 'bad-ciphertext');
    await assert.rejects(restoreUserState(backup, corruptDestination), /authentication failed/);
    assert.equal(fs.existsSync(corruptDestination), false);
    const evidence = path.resolve('artifacts/restore-encrypted', String(Date.now()));
    fs.mkdirSync(evidence, { recursive: true });
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify({ classification: ['REAL_OS', 'INTEGRATION'], status: 'PASS', authenticatedFields: result.authenticatedFields, actualSQLiteSnapshot: true, actualWindowsDpapiKey: true, restoredRecordRetrieved: true, plaintextAbsentInDatabase: true, omittedKeyRejectedBeforeDestinationCreation: true, tamperedAuthenticatedCiphertextRejectedDespiteValidFileHash: true, inputSource: 'Controlled storage record, not actual screen capture', cleanMachineRecovery: 'NOT_RUN; same original Windows identity' }, null, 2));
  } finally {
    live?.close(); restored?.close();
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-restore-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
