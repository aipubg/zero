import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { canonicalSourceHash, reviewedDeclarations, validateAdditionalTestCatalog } from './verification/additional-test-catalog.mjs';

test('[CONTRACT] additional catalog rejects missing sources, stale identities, inferred review and invalid labels without executing tests', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-additional-catalog-'));
  const directory = path.join(root, 'docs/engineering/verification'); fs.mkdirSync(directory, { recursive: true }); fs.mkdirSync(path.join(root, 'test'));
  const source = "test('controlled declaration', () => {});\n";
  const file = path.join(root, 'test/fixture.test.mjs'); fs.writeFileSync(file, source);
  const row = { file: 'test/fixture.test.mjs', sha256: canonicalSourceHash(source), execution: 'NOT_RUN_BY_INVENTORY', reviewStatus: 'REVIEWED_SCOPED', labels: ['CONTRACT'], scope: 'Metadata fixture only', gaps: ['No product execution'], modes: [], declarations: reviewedDeclarations(source).map(item => ({ ...item, labels: ['CONTRACT'], scope: 'Controlled metadata fixture' })) };
  const catalog = { schemaVersion: 1, hashEncoding: 'UTF8_LF', entries: [row] };
  const save = () => fs.writeFileSync(path.join(directory, 'additional-test-classification-inventory.json'), JSON.stringify(catalog));
  try {
    save(); assert.equal(validateAdditionalTestCatalog(root).reviewed, 1);
    fs.writeFileSync(file, source.replace(/\n/g, '\r\n')); assert.equal(validateAdditionalTestCatalog(root).reviewed, 1);
    fs.appendFileSync(file, '// changed'); assert.throws(() => validateAdditionalTestCatalog(root), /source drift/); fs.writeFileSync(file, source);
    fs.writeFileSync(path.join(root, 'test/unclassified.test.mjs'), ''); assert.throws(() => validateAdditionalTestCatalog(root), /coverage drift/); fs.unlinkSync(path.join(root, 'test/unclassified.test.mjs'));
    row.labels = ['PRODUCTION_PASS']; save(); assert.throws(() => validateAdditionalTestCatalog(root), /Invalid additional classification/);
    row.labels = ['CONTRACT']; row.declarations[0].labels = ['FAKE_REAL']; save(); assert.throws(() => validateAdditionalTestCatalog(root), /Invalid declaration classification/);
    row.declarations[0].labels = ['CONTRACT']; const declaration = row.declarations.pop(); save(); assert.throws(() => validateAdditionalTestCatalog(root), /declaration drift/); row.declarations.push(declaration);
    row.modes = [{ condition: 'fixture', scope: 'Fixture only', labels: ['ALL_PASS'] }]; save(); assert.throws(() => validateAdditionalTestCatalog(root), /Invalid additional mode/); row.modes = [];
    row.reviewStatus = 'NOT_REVIEWED'; save(); assert.throws(() => validateAdditionalTestCatalog(root), /cannot claim classification/);
    row.labels = []; row.declarations = null; save(); assert.equal(validateAdditionalTestCatalog(root).unreviewed.length, 1);
    assert.deepEqual(fs.readFileSync(file, 'utf8'), source, 'Catalog validation must not run or rewrite the controlled test source');
  } finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('zero-additional-catalog-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
