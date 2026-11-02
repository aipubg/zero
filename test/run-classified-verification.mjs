import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { validateInventory, emptyResults, reconcile, summarize } from './verification/classification-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventoryPath = path.join(root, 'docs/engineering/verification/test-classification-inventory.json');
const require = createRequire(import.meta.url);

export async function runChild(file, { timeoutMs = 60000, cwd = root } = {}) {
  return new Promise(resolve => {
    const events = [];
    let buffer = '';
    let bytes = 0;
    const execution = {};
    const childEnvironment = { ...process.env };
    delete childEnvironment.NODE_TEST_CONTEXT;
    // One process: a suite timeout must not orphan Node's test-isolation worker.
    const child = spawn(process.execPath, ['--test', '--test-isolation=none', `--test-timeout=${timeoutMs}`, '--test-concurrency=1', '--test-reporter',
      pathToFileURL(path.join(root, 'test/verification/verification-reporter.mjs')).href, file], {
      cwd, env: childEnvironment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => { execution.timedOut = true; child.kill(); }, timeoutMs);
    child.stdout.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 4 * 1024 * 1024) { execution.outputOverflow = true; child.kill(); return; }
      buffer += chunk.toString();
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (!line.trim()) continue;
        try { events.push(JSON.parse(line)); } catch { execution.protocolError = true; }
      }
    });
    child.stderr.on('data', () => {}); // Drain without recording owner paths/secrets.
    child.on('error', () => { execution.spawnError = true; });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (buffer.trim()) execution.protocolError = true;
      resolve({ events, execution: { ...execution, exitCode: code, signal } });
    });
  });
}

async function prerequisites(suite) {
  const missing = [];
  if (Number(process.versions.node.split('.')[0]) < 24) missing.push('Node.js >=24 required');
  if (suite.prerequisites.includes('chrome')) {
    if (!fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) missing.push('Hardcoded system Chrome path missing');
    try { require.resolve('playwright-core'); } catch { missing.push('playwright-core unavailable to repository tests'); }
  }
  if (suite.prerequisites.includes('windows') && process.platform !== 'win32') missing.push('Windows desktop required');
  // No owner .env reads, credential acquisition, host probes or auth requests.
  // Provider reachability/authentication is assessed by the selected legacy child.
  return missing;
}

export async function main(args = process.argv.slice(2)) {
  let execute = false;
  let check = false;
  let disposable = false;
  let output;
  let timeoutMs = 60000;
  const requested = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--execute') execute = true;
    else if (arg === '--check') check = true;
    else if (arg === '--disposable-environment') disposable = true;
    else if (arg === '--suite' && args[i + 1]) requested.push(args[++i]);
    else if (arg === '--output' && args[i + 1]) output = args[++i];
    else if (arg === '--timeout-ms' && args[i + 1]) timeoutMs = Number(args[++i]);
    else if (arg === '--help') {
      console.log('Dry audit: node test/run-classified-verification.mjs [--suite phase8] [--output path]\nInventory integrity only: --check\nLegacy execution (disposable checkout/state only): --execute --suite ID --disposable-environment [--timeout-ms 60000]\nNever execute against the owner host on port 18789. Exit 0: integrity check only; 1: assertion failure; 2: release blocked/not run.');
      return 0;
    } else throw new Error(`Unknown/incomplete argument: ${arg}`);
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 3600000) throw new Error('timeout-ms must be 100..3600000');
  if (check && (execute || output || requested.length)) throw new Error('--check is a separate inventory-integrity operation');
  if (execute && (!disposable || !requested.length)) throw new Error('Execution requires explicit --suite IDs and --disposable-environment; no owner-state execution');
  const inventory = validateInventory(JSON.parse(fs.readFileSync(inventoryPath, 'utf8')), root);
  for (const id of requested) if (!inventory.suites.some(suite => suite.id === id)) throw new Error(`Unknown suite: ${id}`);
  if (check) {
    console.log(JSON.stringify({ inventoryIntegrity: 'VALID', suites: inventory.suites.length,
      leaves: inventory.suites.reduce((total, suite) => total + suite.tests.length, 0),
      execution: 'NOT_RUN', releaseStatus: 'BLOCKED' }, null, 2));
    return 0;
  }
  const suites = requested.length ? inventory.suites.filter(suite => requested.includes(suite.id)) : inventory.suites;
  const results = [];
  const suiteRuns = [];
  for (const suite of suites) {
    if (!execute) { results.push(...emptyResults([suite])); continue; }
    const missing = await prerequisites(suite);
    if (missing.length) {
      results.push(...emptyResults([suite], 'BLOCKED', missing.join('; ')));
      suiteRuns.push({ id: suite.id, status: 'BLOCKED', issues: missing });
      continue;
    }
    const child = await runChild(path.join(root, suite.file), { timeoutMs });
    const reconciled = reconcile(suite, child.events, child.execution);
    results.push(...reconciled.results);
    suiteRuns.push({ id: suite.id, status: reconciled.status, issues: reconciled.issues, execution: child.execution });
  }
  const report = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), mode: execute ? 'EXECUTE_LEGACY_ASSERTIONS' : 'AUDIT_ONLY',
    inventory: 'docs/engineering/verification/test-classification-inventory.json',
    selectedSuites: suites.map(suite => suite.id),
    sourceHashes: Object.fromEntries(suites.map(suite => [suite.file, suite.sha256])),
    scope: 'Selected audited leaves only; never an overall product acceptance result',
    summary: summarize(results, suiteRuns), suiteRuns, results,
    unimplementedGates: inventory.unimplementedGates,
    reportedBrowserBlocker: inventory.reportedBrowserBlocker,
    reportedChecks: inventory.reportedChecks,
    integrationMilestone: inventory.integrationMilestone,
  };
  if (output) {
    const target = path.resolve(root, output);
    const reportDirectory = path.join(root, 'docs/engineering/verification');
    const relative = path.relative(reportDirectory, target);
    if (path.isAbsolute(relative) || relative.startsWith('..') || !relative || target === inventoryPath || !target.endsWith('.json')) {
      throw new Error('Report output must be a new .json path under docs/engineering/verification, excluding the inventory');
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  }
  console.log(JSON.stringify(output ? { ...report.summary, output } : report, null, 2));
  return report.summary.assertionStatus === 'FAIL' ? 1 : 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    console.error(JSON.stringify({ runnerStatus: 'BLOCKED', reason: error.message }));
    process.exitCode = 2;
  });
}
