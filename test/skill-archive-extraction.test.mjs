/** INTEGRATION: actual gzip/tar bytes and real filesystem outcomes, not external retrieval. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { create, Header } from '../backend/node_modules/tar/dist/esm/index.js';
import { extractPinnedSkillArchive } from '../packages/skill-sdk/github-archive.mjs';

const revision = 'a'.repeat(40), prefix = `fixture-${revision}`;
const checked = { url: 'https://github.com/source-fixture/fixture.git', ref: revision, subpath: 'skills/demo' };

function temporary(t) {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'zero-skill-archive-')));
  t.after(() => {
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-skill-archive-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return root;
}

function controlledArchive(file, entries) {
  const blocks = [];
  for (const item of entries) {
    const body = Buffer.from(item.body || '');
    const header = new Header({ path: item.path, type: item.type || 'File', mode: 0o644,
      size: item.size ?? body.length, linkpath: item.linkpath || '' });
    header.encode(); assert.equal(header.needPax, false, 'Attack fixture must fit a literal tar header');
    blocks.push(header.block, body);
    if (body.length % 512) blocks.push(Buffer.alloc(512 - body.length % 512));
  }
  fs.writeFileSync(file, gzipSync(Buffer.concat([...blocks, Buffer.alloc(1024)])));
}

test('archive extraction preserves the complete selected bundle and excludes other repository files', async t => {
  const root = temporary(t), source = path.join(root, 'source');
  const bundle = path.join(source, 'skills/demo'); fs.mkdirSync(path.join(bundle, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(source, 'other'), { recursive: true });
  const manifest = '---\nname: demo\ndescription: Real file preservation fixture\n---\n# Demo\n';
  fs.writeFileSync(path.join(bundle, 'SKILL.md'), manifest);
  fs.writeFileSync(path.join(bundle, 'LICENSE.txt'), 'Fixture license bytes');
  fs.writeFileSync(path.join(bundle, 'assets', 'नोट.txt'), 'Unicode supporting asset\n');
  fs.writeFileSync(path.join(source, 'other', 'outside.txt'), 'Not in selected subtree');
  const archive = path.join(root, 'source.tgz');
  await create({ gzip: true, file: archive, cwd: source, prefix }, ['skills', 'other']);
  const checkout = path.join(root, 'checkout');
  const result = await extractPinnedSkillArchive(archive, checked, { checkout });
  assert.equal(result.extractedFiles, 3); assert.equal(result.revision, revision);
  assert.equal(fs.readFileSync(path.join(checkout, 'skills/demo/SKILL.md'), 'utf8'), manifest);
  assert.equal(fs.readFileSync(path.join(checkout, 'skills/demo/LICENSE.txt'), 'utf8'), 'Fixture license bytes');
  assert.equal(fs.readFileSync(path.join(checkout, 'skills/demo/assets/नोट.txt'), 'utf8'), 'Unicode supporting asset\n');
  assert.equal(fs.existsSync(path.join(checkout, 'other')), false);
});

test('archive validation rejects traversal, links, collisions, wrong pins and oversized files before extraction', async t => {
  const root = temporary(t), archive = path.join(root, 'controlled.tgz');
  const manifest = { path: `${prefix}/skills/demo/SKILL.md`, body: 'manifest bytes' };
  const cases = [
    [{ path: `${prefix}/../escape.txt`, body: 'bad' }],
    [manifest, { path: `${prefix}/skills/demo/link`, type: 'SymbolicLink', linkpath: '../outside' }],
    [manifest, { path: `${prefix}/skills/demo/link`, type: 'Link', linkpath: `${prefix}/SKILL.md` }],
    [manifest, { path: `${prefix}/skills/demo/skill.md`, body: 'collision' }],
    [{ path: `fixture-${'b'.repeat(40)}/skills/demo/SKILL.md`, body: 'wrong commit' }],
    [manifest, { path: `${prefix}/skills/demo/CON.txt`, body: 'device name' }],
    [manifest, { path: `${prefix}/skills/demo/huge.bin`, size: 16 * 1024 * 1024 + 1 }],
    [manifest, { path: `${prefix}/skills/demo/assets`, body: 'file' }, { path: `${prefix}/skills/demo/assets/child.txt`, body: 'conflict' }],
  ];
  for (let index = 0; index < cases.length; index++) {
    controlledArchive(archive, cases[index]);
    const checkout = path.join(root, `checkout-${index}`);
    await assert.rejects(extractPinnedSkillArchive(archive, checked, { checkout }), /Unsafe|links|colliding|pinned|size bound|conflicting/);
    assert.equal(fs.existsSync(checkout), false, 'Validation failure must precede creating extraction output');
  }
  assert.equal(fs.existsSync(path.join(root, 'escape.txt')), false);
});

test('archive extraction refuses missing manifests and already-cancelled operations without output writes', async t => {
  const root = temporary(t), archive = path.join(root, 'source.tgz');
  controlledArchive(archive, [{ path: `${prefix}/skills/demo/assets.txt`, body: 'asset' }]);
  const checkout = path.join(root, 'checkout');
  await assert.rejects(extractPinnedSkillArchive(archive, checked, { checkout }), /requires SKILL.md/);
  assert.equal(fs.existsSync(checkout), false);
  const controller = new AbortController(); controller.abort(new Error('Explicitly cancelled'));
  await assert.rejects(extractPinnedSkillArchive(archive, checked, { checkout, signal: controller.signal }), /Explicitly cancelled/);
  assert.equal(fs.existsSync(checkout), false);
});
