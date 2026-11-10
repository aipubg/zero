import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRunnerCatalog } from './verification/runner-catalog.mjs';

test('[CONTRACT] runner catalog audits source identity and fails closed on missing classifications or source drift', t => {
  const repo = fileURLToPath(new URL('../', import.meta.url));
  const catalog = validateRunnerCatalog(repo);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-runner-catalog-'));
  t.after(() => { assert.equal(fs.realpathSync(path.dirname(root)), fs.realpathSync(os.tmpdir())); fs.rmSync(root, { recursive: true, force: true }); });
  fs.mkdirSync(path.join(root, 'scripts'));
  const directory = path.join(root, 'docs/engineering/verification'); fs.mkdirSync(directory, { recursive: true });
  const inventory = path.join(directory, 'runner-classification-inventory.json');
  fs.writeFileSync(inventory, JSON.stringify(catalog));
  for (const row of catalog.runners) {
    fs.copyFileSync(path.join(repo, row.file), path.join(root, row.file));
    for (const helper of row.additionalSources || []) fs.copyFileSync(path.join(repo, helper.file), path.join(root, helper.file));
  }
  assert.equal(validateRunnerCatalog(root).runners.length, catalog.runners.length);
  const source = path.join(root, catalog.runners[0].file); fs.appendFileSync(source, '\n// changed\n');
  assert.throws(() => validateRunnerCatalog(root), /source drift/);
  fs.copyFileSync(path.join(repo, catalog.runners[0].file), source);
  const helper = catalog.runners.find(row => row.file === 'scripts/functional-browser-check.mjs').additionalSources?.find(row => row.file === 'scripts/functional-browser-options.mjs');
  assert.ok(helper, 'Browser selector helper must be fingerprinted');
  fs.appendFileSync(path.join(root, helper.file), '\n// modified helper\n');
  assert.throws(() => validateRunnerCatalog(root), /helper source drift/);
  fs.copyFileSync(path.join(repo, helper.file), path.join(root, helper.file));
  fs.writeFileSync(path.join(root, 'scripts/verify-unclassified.mjs'), '');
  assert.throws(() => validateRunnerCatalog(root), /coverage drift/);
  fs.unlinkSync(path.join(root, 'scripts/verify-unclassified.mjs'));
  catalog.runners[0].labels = ['MOCK_PASS']; fs.writeFileSync(inventory, JSON.stringify(catalog));
  assert.throws(() => validateRunnerCatalog(root), /Invalid classification/);
});
