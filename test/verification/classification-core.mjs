import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const LABELS = Object.freeze([
  'UNIT', 'CONTRACT', 'INTEGRATION', 'REAL_BROWSER', 'REAL_OS', 'REAL_EXTERNAL', 'ENDURANCE',
]);
export const sha256 = text => createHash('sha256').update(text).digest('hex');

// Deliberately limited to the literal declarations used by the audited sources.
// Unknown syntax/count/source drift is an audit error, never inferred coverage.
export function declarations(source) {
  return [...source.matchAll(/^\s*await (?:suite|t)\.test\('([^'\r\n]+)'\s*,/gm)]
    .map(match => ({ title: match[1], line: source.slice(0, match.index).split('\n').length
      + (match[0].match(/^\s*/)[0].match(/\n/g)?.length ?? 0) }));
}

export function validateInventory(inventory, root) {
  if (inventory.schemaVersion !== 1) throw new Error('Unsupported inventory schema');
  if (JSON.stringify(inventory.labels) !== JSON.stringify(LABELS)) throw new Error('Exact classification labels required');
  const actualFiles = fs.readdirSync(path.join(root, 'test'))
    .filter(name => /^phase\d+-.+\.test\.mjs$/.test(name) || name === 'real-world-requirements-48.test.mjs')
    .map(name => `test/${name}`).sort();
  const files = inventory.suites.map(suite => suite.file);
  if (JSON.stringify([...files].sort()) !== JSON.stringify(actualFiles)) throw new Error('Audited suite inventory drift');
  const ids = new Set();
  for (const suite of inventory.suites) {
    if (path.isAbsolute(suite.file) || suite.file.includes('..') || !actualFiles.includes(suite.file)) throw new Error('Unsafe suite path');
    const source = fs.readFileSync(path.join(root, suite.file), 'utf8');
    if (suite.sha256 !== sha256(source)) throw new Error(`Source drift: ${suite.file}; review and re-audit before running`);
    const leaves = declarations(source);
    if (leaves.length !== suite.tests.length || leaves.length === 0) throw new Error(`Leaf count drift: ${suite.file}`);
    for (const [index, item] of suite.tests.entries()) {
      if (item.title !== leaves[index].title || item.line !== leaves[index].line) throw new Error(`Declaration drift: ${suite.file}:${item.line}`);
      if (!item.id || ids.has(item.id)) throw new Error('Duplicate/missing test id');
      ids.add(item.id);
      for (const field of ['labels', 'requiredLabels']) {
        if (!item[field]?.length || new Set(item[field]).size !== item[field].length || item[field].some(label => !LABELS.includes(label))) {
          throw new Error(`Invalid ${field}: ${item.id}`);
        }
      }
      if (!item.claim || !item.proves || !item.gaps?.length || item.gaps.some(gap => !gap)) throw new Error(`Incomplete audit: ${item.id}`);
      if (item.claimStatus !== 'PARTIAL') throw new Error(`Unsupported completion claim: ${item.id}`);
    }
  }
  if (inventory.suites.find(s => s.id === 'requirements48')?.tests.length !== 48) throw new Error('Expected exactly 48 requirement leaves');
  return inventory;
}

export function emptyResults(suites, status = 'NOT_RUN', reason = 'Audit only; legacy assertions were not executed') {
  return suites.flatMap(suite => suite.tests.map(test => ({
    id: test.id, file: suite.file, title: test.title, labels: test.labels,
    assertionStatus: status, reason, claimStatus: test.claimStatus,
    requirementStatus: 'UNVERIFIED', gaps: test.gaps,
  })));
}

export function reconcile(suite, events, execution = {}) {
  const results = emptyResults([suite], 'BLOCKED', 'No terminal leaf event; setup, skip, cancellation, or timeout prevented execution');
  const byTitle = new Map(results.map(item => [item.title, item]));
  const seen = new Set();
  const anomalies = [];
  const parentIssues = [];
  for (const event of events) {
    if (!['test:pass', 'test:fail'].includes(event.type)) continue;
    const data = event.data ?? {};
    const skipped = data.skip !== undefined && data.skip !== false;
    const todo = data.todo !== undefined && data.todo !== false;
    const result = byTitle.get(data.name);
    if (!result) {
      // Suite containers are never counted as passing leaves.
      if (skipped || todo || event.type === 'test:fail') parentIssues.push(data.skip || data.todo || data.failureType || 'Suite skipped, TODO or failed');
      if (data.nesting > 0) anomalies.push(`Unknown leaf: ${data.name}`);
      continue;
    }
    if (seen.has(data.name)) { anomalies.push(`Duplicate terminal event: ${data.name}`); continue; }
    seen.add(data.name);
    if (skipped || todo || data.cancelled || ['hookFailed', 'cancelledByParent', 'testTimeoutFailure', 'testAborted'].includes(data.failureType)) {
      result.assertionStatus = 'BLOCKED';
      result.reason = String(data.skip || data.todo || data.failureType || 'Cancelled');
    } else if (event.type === 'test:fail') {
      result.assertionStatus = 'FAIL';
      result.reason = data.failureType || 'Assertion or execution failure';
    } else {
      result.assertionStatus = 'PASS';
      result.reason = 'Audited leaf assertions executed; this does not verify the full claim';
    }
  }
  if (execution.timedOut || execution.spawnError || execution.outputOverflow || execution.protocolError || anomalies.length) {
    // Incomplete or ambiguous child protocol cannot produce green results.
    for (const result of results) {
      if (result.assertionStatus !== 'FAIL') {
        result.assertionStatus = 'BLOCKED';
        result.reason = execution.timedOut ? 'Suite deadline exceeded' : 'Runner/child protocol incomplete or ambiguous';
      }
    }
  }
  const issues = [...anomalies, ...parentIssues];
  if (execution.exitCode !== undefined && execution.exitCode !== 0) issues.push(`Child exit: ${execution.exitCode}`);
  const status = results.some(item => item.assertionStatus === 'FAIL') ? 'FAIL'
    : issues.length || results.some(item => item.assertionStatus !== 'PASS') ? 'BLOCKED' : 'PASS';
  return { results, status, issues };
}

export function summarize(results, suiteRuns = []) {
  const counts = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].map(status => [status, results.filter(item => item.assertionStatus === status).length]));
  const assertionStatus = counts.FAIL || suiteRuns.some(run => run.status === 'FAIL') ? 'FAIL'
    : counts.BLOCKED || suiteRuns.some(run => run.status === 'BLOCKED') ? 'BLOCKED'
      : counts.NOT_RUN || !results.length ? 'NOT_RUN' : 'PASS';
  return {
    leafCount: results.length, counts, assertionStatus,
    releaseStatus: 'BLOCKED',
    releaseReason: 'Required workflow evidence remains missing; assertion PASS never closes acceptance gaps',
    verifiedRequirements: 0,
  };
}
