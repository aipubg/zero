import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SemanticObservationStore } from '../packages/screen-intelligence/semantic-store.mjs';

function workspace(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-encryption-'));
  t.after(() => {
    assert.equal(fs.realpathSync(path.dirname(directory)), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('zero-encryption-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return path.join(directory, 'observations.sqlite');
}
test('[REAL_OS] persistent observation fields encrypt with a Windows-user-bound key and reopen for retrieval', t => {
  const dbPath = workspace(t);
  const marker = 'private observation ' + crypto.randomUUID();
  const store = new SemanticObservationStore({ dbPath });
  store.insertObservation({ observation_id: 'private-row', observed_text: marker, application_id: 'secret-app', semantic_summary: 'private summary', metadata: { title: marker } });
  assert.equal(store.getStatus().encryptedFields, true);
  assert.equal(store.getStatus().keyStorage, 'windows-user-dpapi');
  const raw = store.db.prepare('SELECT * FROM semantic_observations').get();
  for (const column of ['observed_text', 'semantic_summary', 'application_id', 'metadata_json']) assert.ok(raw[column].startsWith('zeroenc:v1:'));
  assert.equal(store.searchObservations(marker)[0].observed_text, marker);
  store.close();
  assert.equal(fs.readFileSync(dbPath).includes(Buffer.from(marker)), false);
  const reopened = new SemanticObservationStore({ dbPath });
  assert.equal(reopened.getLatestContext().observed_text, marker);
  assert.equal(reopened.searchObservations('secret-app').length, 1);
  reopened.close();
});
test('[REAL_OS] missing keys and swapped authenticated ciphertext fail without replacing stored data', t => {
  const dbPath = workspace(t);
  const store = new SemanticObservationStore({ dbPath });
  store.insertObservation({ observation_id: 'row', observed_text: 'secret', semantic_summary: 'summary' });
  store.close();
  const keyPath = dbPath + '.key.dpapi';
  fs.renameSync(keyPath, keyPath + '.saved');
  assert.throws(() => new SemanticObservationStore({ dbPath }), /key is missing/);
  assert.equal(fs.existsSync(keyPath), false);
  fs.renameSync(keyPath + '.saved', keyPath);
  const raw = new DatabaseSync(dbPath);
  raw.exec('UPDATE semantic_observations SET observed_text=semantic_summary');
  raw.close();
  assert.throws(() => new SemanticObservationStore({ dbPath }), /authentication failed/);
});
test('[REAL_OS] plaintext migration preserves a recoverable snapshot and removes plaintext from the active database', t => {
  const dbPath = workspace(t);
  const prior = new SemanticObservationStore({ dbPath, encryption: false });
  const marker = 'legacy secret ' + crypto.randomUUID();
  prior.insertObservation({ observed_text: marker });
  prior.close();
  const migrated = new SemanticObservationStore({ dbPath });
  assert.ok(migrated.migrationBackup);
  assert.equal(migrated.getLatestContext().observed_text, marker);
  const backup = new DatabaseSync(migrated.migrationBackup, { readOnly: true });
  assert.equal(backup.prepare('SELECT observed_text FROM semantic_observations').get().observed_text, marker);
  backup.close();
  migrated.close();
  assert.equal(fs.readFileSync(dbPath).includes(Buffer.from(marker)), false);
  const reopened = new SemanticObservationStore({ dbPath });
  assert.equal(reopened.migrationBackup, undefined);
  assert.equal(reopened.getLatestContext().observed_text, marker);
  reopened.close();
});
