import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { SemanticObservationStore } from '../packages/screen-intelligence/semantic-store.mjs';

test('[REAL_OS] backup authenticates older encrypted records, not only latest observation', { skip: process.platform !== 'win32' }, () => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-backup-encrypted-'));
  const evidence = path.resolve('artifacts/backup-encrypted', String(Date.now())); fs.mkdirSync(evidence, { recursive: true });
  let store;
  try {
    store = new SemanticObservationStore({ dbPath: path.join(state, 'observations.sqlite') });
    const timestamp = Date.now();
    store.insertObservation({ observation_id: 'older', timestamp, observed_text: 'Older controlled record', semantic_summary: 'Older summary' });
    store.insertObservation({ observation_id: 'latest', timestamp: timestamp + 1, observed_text: 'Newest controlled record', semantic_summary: 'Newest summary' });
    store.close(); store = null;
    const run = () => execFileSync(process.execPath, ['scripts/backup-user-state.mjs', '--state-dir', state], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const good = JSON.parse(run().trim());
    assert.equal(good.encryptedSnapshots[0].authenticatedRows, 2);
    assert.ok(good.encryptedSnapshots[0].authenticatedFields >= 8);
    store = new SemanticObservationStore({ dbPath: path.join(state, 'observations.sqlite') });
    store.db.exec("UPDATE semantic_observations SET observed_text=semantic_summary WHERE observation_id='older'");
    store.close(); store = null;
    let failed = false;
    try { run(); } catch (error) { assert.match(String(error.stderr), /authentication failed/); failed = true; }
    assert.equal(failed, true, 'Corrupt older row must fail backup validation despite intact latest row');
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify({ classification: ['REAL_OS', 'INTEGRATION'], status: 'PASS', authenticatedRows: good.encryptedSnapshots[0].authenticatedRows, validBackup: good.backupDirectory, olderCorruptRowRejected: true, latestRowUntouched: true, inputSource: 'Controlled real DPAPI-encrypted storage records, not continuous screen capture' }, null, 2));
  } finally {
    store?.close(); assert.equal(fs.realpathSync(path.dirname(state)), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(state).startsWith('zero-backup-encrypted-')); fs.rmSync(state, { recursive: true, force: true });
  }
});
