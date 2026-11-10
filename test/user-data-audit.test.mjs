import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
test('[INTEGRATION] data preservation audit permits additions but rejects mutation and deletion of original messages', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-data-audit-'));
  const backup = path.join(directory, 'backup');
  const state = path.join(directory, 'state');
  fs.mkdirSync(path.join(backup, '.zero-data'), { recursive: true }); fs.mkdirSync(state);
  const filename = path.join(state, 'audit.sqlite');
  let db = new DatabaseSync(filename);
  db.exec("CREATE TABLE messages(id TEXT PRIMARY KEY, content TEXT); INSERT INTO messages VALUES('original','Original owner text')");
  db.close(); fs.copyFileSync(filename, path.join(backup, '.zero-data/audit.sqlite'));
  fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ stateDirectory: state, files: [{ file: '.zero-data/audit.sqlite' }] }));
  const audit = expected => {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/verify-user-data-preservation.mjs'), '--backup', backup], { cwd: root, windowsHide: true, encoding: 'utf8' });
    assert.equal(result.status, expected === 'PASS' ? 0 : 1, result.stderr);
    const report = JSON.parse(result.stdout); assert.equal(report.status, expected); return report;
  };
  try {
    audit('PASS');
    db = new DatabaseSync(filename);
    db.exec("ALTER TABLE messages ADD COLUMN added TEXT; INSERT INTO messages VALUES('new','New text','new field')"); db.close();
    audit('PASS');
    db = new DatabaseSync(filename); db.exec("UPDATE messages SET content='Changed original' WHERE id='original'"); db.close();
    assert.equal(audit('FAIL').failures[0].missingOrChangedRows, 1);
    db = new DatabaseSync(filename); db.exec("DELETE FROM messages WHERE id='original'"); db.close();
    assert.equal(audit('FAIL').failures[0].missingOrChangedRows, 1);
  } finally {
    const resolved = fs.realpathSync.native(directory);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-data-audit-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
