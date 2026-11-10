import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { LABELS, declarations, emptyResults, reconcile, summarize, validateInventory } from './classification-core.mjs';
import { runChild } from '../run-classified-verification.mjs';
import { validateAdditionalTestCatalog, reviewedDeclarations } from './additional-test-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'docs/engineering/verification/test-classification-inventory.json'), 'utf8'));
const suite = { id: 'fixture', file: 'fixture.mjs', tests: [
  { id: 'fixture:1', title: 'first', labels: ['UNIT'], claimStatus: 'PARTIAL', gaps: ['No production workflow'] },
  { id: 'fixture:2', title: 'second', labels: ['CONTRACT'], claimStatus: 'PARTIAL', gaps: ['No independent outcome'] },
] };
const pass = (name, extra = {}) => ({ type: 'test:pass', data: { name, nesting: 1, ...extra } });

test('all audited source hashes, exact labels, titles and leaf counts match', () => {
  validateInventory(inventory, root);
  assert.deepEqual(inventory.labels, LABELS);
  assert.equal(inventory.suites.length, 18);
  assert.equal(inventory.suites.flatMap(item => item.tests).length, 137);
  assert.equal(inventory.suites.find(item => item.id === 'requirements48').tests.length, 48);
  assert.equal(inventory.suites.flatMap(item => item.tests).filter(item => item.labels.includes('ENDURANCE')).length, 0);
});

test('classification rejects source drift, missing suites, label drift and title drift', () => {
  const mutations = [
    value => { value.suites[0].sha256 = 'stale'; },
    value => { value.suites.pop(); },
    value => { value.suites[0].tests[0].labels = ['REAL-WORLD']; },
    value => { value.suites[0].tests[0].title = 'renamed'; },
    value => { value.suites[0].tests[0].gaps = []; },
    value => { value.suites[0].tests[0].id = value.suites[0].tests[1].id; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(inventory);
    mutate(copy);
    assert.throws(() => validateInventory(copy, root));
  }
});

test('literal extraction preserves title and exact CRLF line', () => {
  const source = "test('parent', async (suite) => {\r\n\r\n  await suite.test('leaf', () => {});\r\n});";
  assert.deepEqual(declarations(source), [{ title: 'leaf', line: 3 }]);
  assert.deepEqual(reviewedDeclarations('test("double title", () => {});\r\n\n  await t.test(\'single title\', () => {});'), [
    { title: 'double title', line: 1 }, { title: 'single title', line: 3 },
  ]);
  assert.deepEqual(reviewedDeclarations('test(`dynamic ${value}`, () => {});'), []);
  assert.deepEqual(reviewedDeclarations('describe("container", () => {\n  it(\'assertion\', () => {});\n});'), [
    { title: 'container', line: 1 }, { title: 'assertion', line: 2 },
  ]);
});

test('dry audit has no passing assertions or verified requirements', () => {
  const results = emptyResults([suite]);
  assert.equal(summarize(results).assertionStatus, 'NOT_RUN');
  assert.equal(summarize(results).releaseStatus, 'BLOCKED');
  assert.equal(summarize(results).verifiedRequirements, 0);
});

test('leaf skip and TODO, including empty reasons, never become PASS', () => {
  for (const directive of [{ skip: true }, { skip: 'missing Chrome' }, { skip: '' }, { todo: true }, { todo: '' }]) {
    const result = reconcile(suite, [pass('first', directive), pass('second')], { exitCode: 0 });
    assert.equal(result.results[0].assertionStatus, 'BLOCKED');
    assert.equal(result.status, 'BLOCKED');
    assert.equal(summarize(result.results, [result]).assertionStatus, 'BLOCKED');
  }
});

test('suite-only skip or setup failure blocks all missing leaves and adds no parent PASS', () => {
  for (const event of [pass('parent', { nesting: 0, skip: 'no browser' }),
    { type: 'test:fail', data: { name: 'parent', nesting: 0, failureType: 'hookFailed' } }]) {
    const result = reconcile(suite, [event], { exitCode: 0 });
    assert.deepEqual(result.results.map(item => item.assertionStatus), ['BLOCKED', 'BLOCKED']);
    assert.equal(result.results.length, 2);
    assert.equal(result.status, 'BLOCKED');
  }
});

test('failures, cancellation, timeouts and child transport problems cannot become green', () => {
  const failed = reconcile(suite, [{ type: 'test:fail', data: { name: 'first', nesting: 1, failureType: 'testCodeFailure' } }, pass('second')], { exitCode: 1 });
  assert.equal(failed.results[0].assertionStatus, 'FAIL');
  assert.equal(failed.status, 'FAIL');
  const cancelled = reconcile(suite, [{ type: 'test:fail', data: { name: 'first', nesting: 1, failureType: 'cancelledByParent' } }, pass('second')], { exitCode: 1 });
  assert.equal(cancelled.results[0].assertionStatus, 'BLOCKED');
  for (const execution of [{ timedOut: true }, { spawnError: true }, { protocolError: true }, { outputOverflow: true }]) {
    const result = reconcile(suite, [pass('first'), pass('second')], execution);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.results.every(item => item.assertionStatus === 'BLOCKED'));
  }
});

test('unknown/duplicate leaves and nonzero child exit cannot produce overall PASS', () => {
  for (const [events, execution] of [
    [[pass('first'), pass('second'), pass('unknown')], { exitCode: 0 }],
    [[pass('first'), pass('second'), pass('first')], { exitCode: 0 }],
    [[pass('first'), pass('second')], { exitCode: 1 }],
  ]) assert.equal(reconcile(suite, events, execution).status, 'BLOCKED');
});

test('all passing assertions still leave acceptance and release blocked', () => {
  const result = reconcile(suite, [pass('first'), pass('second'), pass('parent', { nesting: 0 })], { exitCode: 0 });
  assert.equal(result.status, 'PASS');
  assert.equal(result.results.length, 2);
  assert.ok(result.results.every(item => item.requirementStatus === 'UNVERIFIED'));
  assert.equal(summarize(result.results, [result]).releaseStatus, 'BLOCKED');
});

async function fixture(source, options) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-classification-runner-'));
  const file = path.join(directory, 'fixture.mjs');
  fs.writeFileSync(file, source);
  try { return await runChild(file, { timeoutMs: 3000, ...options, cwd: directory }); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('real Node reporter handles passing, skipped, TODO and failed fixtures', async () => {
  const child = await fixture("import test from 'node:test';\nimport assert from 'node:assert/strict';\ntest('first', () => {});\ntest.skip('second', () => {});\ntest.todo('todo');\ntest('failure', () => assert.fail('expected fixture failure'));\n");
  assert.equal(child.execution.exitCode, 1);
  assert.ok(child.events.some(event => event.data.name === 'second' && event.data.skip));
  assert.ok(child.events.some(event => event.data.name === 'todo' && event.data.todo));
  assert.ok(child.events.some(event => event.data.name === 'failure' && event.type === 'test:fail'));
  const matching = { ...suite, tests: [suite.tests[0], suite.tests[1], { ...suite.tests[0], id: 'fixture:3', title: 'todo' }, { ...suite.tests[0], id: 'fixture:4', title: 'failure' }] };
  assert.deepEqual(reconcile(matching, child.events, child.execution).results.map(item => item.assertionStatus), ['PASS', 'BLOCKED', 'BLOCKED', 'FAIL']);
});

test('real Node suite skip before declaration blocks inventoried children', async () => {
  const child = await fixture("import test from 'node:test'; test('parent', t => { t.skip('missing dependency'); return; });");
  assert.equal(child.execution.exitCode, 0);
  assert.ok(child.events.some(event => event.data.skip === 'missing dependency'));
  assert.equal(reconcile(suite, child.events, child.execution).status, 'BLOCKED');
});

test('real Node setup failure leaves inventoried assertions blocked', async () => {
  const child = await fixture("import test from 'node:test'; test('parent', async t => { t.before(() => { throw Error('fixture setup failure'); }); await t.test('first', () => {}); await t.test('second', () => {}); });");
  const result = reconcile(suite, child.events, child.execution);
  assert.ok(child.events.some(event => event.type === 'test:fail'));
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.results.every(item => item.assertionStatus === 'BLOCKED'));
});

test('hung child has a bounded deadline and cannot pass', async () => {
  const child = await fixture("import test from 'node:test'; test('first', async () => { await new Promise(() => { setInterval(() => {}, 50); }); });", { timeoutMs: 400 });
  assert.equal(child.execution.timedOut, true);
  assert.equal(reconcile(suite, child.events, child.execution).status, 'BLOCKED');
});

test('CLI rejects implicit execution and invalid selections without touching host', () => {
  for (const args of [['--execute'], ['--execute', '--suite', 'phase17'], ['--suite', 'unknown'], ['--timeout-ms', 'NaN']]) {
    const child = spawnSync(process.execPath, ['test/run-classified-verification.mjs', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
    assert.equal(child.status, 2);
    assert.equal(JSON.parse(child.stderr).runnerStatus, 'BLOCKED');
  }
});

test('CLI dry audit returns NOT_RUN and BLOCKED for all 137 leaves', () => {
  const child = spawnSync(process.execPath, ['test/run-classified-verification.mjs'], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(child.status, 2);
  assert.equal(child.stderr, '');
  const report = JSON.parse(child.stdout);
  assert.equal(report.mode, 'AUDIT_ONLY');
  assert.deepEqual(report.summary.counts, { PASS: 0, FAIL: 0, BLOCKED: 0, NOT_RUN: 137 });
  assert.equal(report.summary.releaseStatus, 'BLOCKED');
  assert.equal(report.summary.verifiedRequirements, 0);
  assert.ok(report.unimplementedGates.every(gate => gate.status === 'BLOCKED'));
  assert.equal(report.suiteRuns.length, 0);
  assert.equal(report.reportedChecks.find(check => check.id === 'nvidia-zero-lead-inference').status, 'REPORTED_PASS');
});

test('CLI integrity check exit zero explicitly means no product tests ran', () => {
  const child = spawnSync(process.execPath, ['test/run-classified-verification.mjs', '--check'], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(child.status, 0);
  const additional = validateAdditionalTestCatalog(root, inventory.suites.map(suite => suite.file));
  const runners = JSON.parse(fs.readFileSync(path.join(root, 'docs/engineering/verification/runner-classification-inventory.json'), 'utf8'));
  assert.deepEqual(JSON.parse(child.stdout), { inventoryIntegrity: 'VALID', suites: 18,
    additionalRunnerCatalog: 'VALID', additionalRunnerCount: runners.runners.length,
    additionalTestCatalog: 'VALID', totalTestSourceFiles: additional.totalSourceFiles,
    additionalReviewedFiles: additional.reviewed, additionalUnreviewedFiles: additional.unreviewed.length,
    exhaustiveClassification: additional.unreviewed.length ? 'NOT_ESTABLISHED' : 'REQUIRES_FINAL_SCOPE_AUDIT',
    leaves: 137, execution: 'NOT_RUN', releaseStatus: 'BLOCKED' });
});
