import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { DesktopSessionStore } from '../services/host/security.mjs';

test('[INTEGRATION] fresh process restores session scopes without stored bearer tokens and persists revocation', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-session-reopen-'));
  t.after(() => { assert.equal(fs.realpathSync(path.dirname(root)), fs.realpathSync(os.tmpdir())); fs.rmSync(root, { recursive: true, force: true }); });
  const filePath = path.join(root, 'sessions.json');
  const store = new DesktopSessionStore({ filePath });
  const session = store.create({ role: 'operator', scopes: ['operator.read', 'operator.write'] });
  assert.ok(!fs.readFileSync(filePath, 'utf8').includes(session.id));
  const url = pathToFileURL(path.resolve('services/host/security.mjs')).href;
  const reopened = spawnSync(process.execPath, ['--input-type=module', '-e', `import fs from 'node:fs';import {DesktopSessionStore} from ${JSON.stringify(url)};const {filePath,token}=JSON.parse(fs.readFileSync(0,'utf8'));const s=new DesktopSessionStore({filePath});const found=s.get(token);console.log(JSON.stringify({role:found.role,scopes:found.scopes}));s.delete(token);`], { input: JSON.stringify({ filePath, token: session.id }), encoding: 'utf8', windowsHide: true });
  assert.equal(reopened.status, 0, reopened.stderr);
  assert.deepEqual(JSON.parse(reopened.stdout), { role: 'operator', scopes: ['operator.read', 'operator.write'] });
  assert.equal(new DesktopSessionStore({ filePath }).get(session.id), null);
  assert.equal(store.get('invalid-bearer'), null);
  const expired = new DesktopSessionStore({ filePath });
  const old = expired.create({ expiresAt: Date.now() - 1000 });
  assert.equal(new DesktopSessionStore({ filePath }).get(old.id), null);
  fs.writeFileSync(filePath, '{broken');
  assert.throws(() => new DesktopSessionStore({ filePath }));
});
