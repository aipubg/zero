/** Historical scenarios: assertion-scoped checks, not full product acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { stopDaemon } from '../app/zero-control-ui/src/computer/windows-driver.js';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { ComputerOperator } from '../app/zero-control-ui/src/computer/operator.js';
import { SessionManager } from '../packages/sessions/index.mjs';
import { TaskStateMachine } from '../packages/agent-runtime/index.mjs';
import { AutomationScheduler } from '../packages/automation/index.mjs';
import { PersistentMemoryStore } from '../packages/memory/index.mjs';
import { ModelFabric } from '../packages/model-fabric/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

test('ZERO AI — scoped historical T01–T15 scenarios', { timeout: 90000 }, async (t) => {
  const tempRoot = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'zero-scenario-')));
  t.after(() => {
    stopDaemon();
    const resolved = fs.realpathSync.native(tempRoot);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-scenario-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const liveHost = process.env.ZERO_SCENARIO_TEST_HOST;
  if (liveHost) {
    const url = new URL(liveHost);
    assert.equal(url.protocol, 'http:');
    assert.equal(url.hostname, '127.0.0.1');
    assert.notEqual(url.port, '18789', 'Use a disposable test host, not the owner gateway');
  }
  const liveOptions = { skip: liveHost ? false : 'BLOCKED: disposable local host with configured inference is not supplied' };


  await t.test('T01: Launcher source contract only', async (t) => {
    const scriptPath = path.join(REPO_ROOT, 'zero-host.ps1');
    assert.ok(fs.existsSync(scriptPath), 'zero-host.ps1 exists');

    const content = fs.readFileSync(scriptPath, 'utf8');
    assert.ok(content.includes('$PSScriptRoot'), 'Uses dynamic $PSScriptRoot');
    assert.ok(content.includes('zero-host.mjs'), 'Executes native zero-host.mjs daemon');
    assert.ok(!content.includes('openclaw.cmd'), 'Does not invoke legacy openclaw.cmd wrapper');
    assert.ok(content.includes('Remove-Item Env:\\ZERO_GATEWAY_KEY'), 'Cleans sensitive env before launch');
  });

  await t.test('T02: Supplied disposable host health and catalog HTTP contracts', liveOptions, async (t) => {
    const res = await fetch(new URL('/health', liveHost), { signal: AbortSignal.timeout(10000) });
    assert.equal(res.status, 200, '/health returns 200 OK');
    const health = await res.json();
    assert.equal(health.status, 'ok', 'Status is ok');
    assert.ok(health.gateway || health.service, 'Gateway or service identifier present');

    const modelsRes = await fetch(new URL('/v1/models', liveHost), { signal: AbortSignal.timeout(10000) });
    assert.equal(modelsRes.status, 200, '/v1/models returns 200 OK');
    const modelsData = await modelsRes.json();
    assert.ok(Array.isArray(modelsData.data), 'Returns model list');
    assert.ok(modelsData.data.length > 0, 'Catalog has available models');
  });

  await t.test('T03: Supplied disposable host exact inference response', liveOptions, async (t) => {
    const payload = {
      model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
      messages: [
        { role: 'user', content: 'Reply with exactly: HELLO_FROM_ZERO_AI' },
      ],
      max_tokens: 128,
      temperature: 0,
      stream: false,
    };

    const res = await fetch(new URL('/v1/chat/completions', liveHost), {
      signal: AbortSignal.timeout(30000),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200, 'HTTP 200 from chat completions endpoint');
    const data = await res.json();
    assert.ok(data.choices && data.choices.length > 0, 'Contains choices');
    const content = data.choices[0].message?.content;
    assert.equal(content?.trim(), 'HELLO_FROM_ZERO_AI', 'Assert requested outcome, not merely nonempty prose');
  });

  await t.test('T04: Direct native window observation through capability engine', async (t) => {
    const engine = new CapabilityEngine();
    
    // Direct caller-supplied request; no model execution is claimed.
    const toolCall = {
      name: 'zero_computer_action',
      args: { action: 'list_windows' },
    };

    const validation = engine.validate(toolCall.name, toolCall.args);
    assert.equal(validation.valid, true, 'Tool call validated');

    const toolResult = await engine.execute({
      toolName: toolCall.name,
      args: toolCall.args,
    });
    assert.equal(toolResult.ok, true, 'Tool executed successfully');
    assert.ok(toolResult.auditId, 'Audit ID assigned');

    assert.ok(engine.getAuditLog().some(entry => entry.auditId === toolResult.auditId), 'Actual dispatch has audit receipt');
  });

  await t.test('T05: Tool schema disallowed-action rejection', async (t) => {
    const engine = new CapabilityEngine();

    // 1. Unknown tool
    const unknownTool = engine.validate('unauthorized_shell_injector', { command: 'rmdir' });
    assert.equal(unknownTool.valid, false, 'Unknown tool is rejected');

    // 2. Disallowed action under valid capability
    const disallowedAction = engine.validate('zero_computer_action', { action: 'format_drive_c' });
    assert.equal(disallowedAction.valid, false, 'Disallowed action is rejected');
  });

  await t.test('T06: Native read-only window state shape', async (t) => {
    const operator = new ComputerOperator();
    const result = await operator.execute('get_window_state', {});
    assert.equal(result.ok, true, 'get_window_state succeeds');
    assert.ok(result.window !== undefined, 'Returns window info');
  });

  await t.test('T07: Hold freshness requires actual screen capture', async (t) => {
    const operator = new ComputerOperator({ requireFreshSnapshotAfterRelease: true, strictPolicy: true });
    
    // Set human hold active
    operator.setHumanHold(true);

    // Coordinate actions must be blocked during hold
    const blocked = operator.evaluateSafety('left_click');
    assert.equal(blocked.allowed, false, 'left_click blocked during human hold');
    assert.equal(blocked.error, 'computer-hold:human-control', 'Correct safety error code');

    // Observation actions must still be permitted during hold
    const observation = operator.evaluateSafety('screenshot');
    assert.equal(observation.allowed, true, 'screenshot allowed during hold');

    // Release hold
    operator.setHumanHold(false);

    // Coordinate actions blocked until fresh observation capture (anti-stale gate)
    const staleBlocked = operator.evaluateSafety('left_click');
    assert.equal(staleBlocked.allowed, false, 'Coordinate action blocked while stale');
    assert.equal(staleBlocked.error, 'computer-hold:stale-frame', 'Anti-stale gate enforced');

    // Only an executed observation may clear staleness
    assert.equal(operator.evaluateSafety('screenshot').allowed, true);
    assert.equal(operator.evaluateSafety('left_click').allowed, false, 'Safety query alone cannot clear freshness');
    const freshCapture = await operator.execute('screenshot', {});
    assert.equal(freshCapture.ok, true, 'Actual screen capture succeeds');
    const pixels = Buffer.from(freshCapture.data ?? '', 'base64');
    assert.equal(pixels.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'A real PNG is required, not geometry-only success');

    const allowedAfterCapture = operator.evaluateSafety('left_click');
    assert.equal(allowedAfterCapture.allowed, true, 'Coordinate action allowed after fresh capture');
  });

  await t.test('T08: Supplied parent-child task bookkeeping', async (t) => {
    const runtime = new TaskStateMachine({ dbPath: ':memory:' });
    t.after(() => runtime.close());
    
    // Create parent task
    const parent = runtime.createTask({
      agentId: 'zero',
      goal: 'Analyze Repository Security',
    });
    runtime.enqueueTask(parent.id);
    runtime.startTask(parent.id);

    // Delegate to child sub-agent
    const { childTask } = runtime.delegateTask({
      parentTaskId: parent.id,
      childAgentId: 'zero-security-auditor',
      goal: 'Scan credentials in config directory',
    });
    assert.equal(childTask.parentTaskId, parent.id, 'Parent ID correctly linked');

    runtime.completeChildTask(childTask.id, { suppliedResult: 'fixture-result' });

    const parentAfter = runtime.getTask(parent.id);
    assert.equal(parentAfter.status, 'RUNNING', 'Parent resumed to RUNNING after child completed');
    
    const childAfter = runtime.getTask(childTask.id);
    assert.equal(childAfter.parentTaskId, parent.id, 'Child links to parent');
    assert.equal(childAfter.status, 'COMPLETED', 'Child status COMPLETED');
    assert.equal(childAfter.result.suppliedResult, 'fixture-result', 'Supplied result retained; no agent was run');
  });

  await t.test('T09: SQLite reopen recovery in the same Node process', async (t) => {
    const dbPath = path.join(tempRoot, 'recovery.sqlite');
    
    // Simulate previous host running a task that was interrupted by a crash or reboot
    const hostA = new TaskStateMachine({ dbPath });
    const task = hostA.createTask({ agentId: 'zero', goal: 'Long Automation Batch' });
    hostA.enqueueTask(task.id);
    hostA.startTask(task.id);
    assert.equal(hostA.getTask(task.id).status, 'RUNNING');
    hostA.close();

    // Host restarts and runs recovery sweep
    const hostB = new TaskStateMachine({ dbPath });
    const recoveryResults = hostB.recoverTasksOnStartup();
    assert.ok(recoveryResults.recoveredCount >= 1, 'Interrupted task recovered');

    const recovered = hostB.getTask(task.id);
    assert.equal(recovered.status, 'WAITING', 'Interrupted task transitioned safely to WAITING');
    assert.ok(recovered.waitReason.includes('Host process rebooted'), 'Recovery reason documented');
    hostB.close();

    try { fs.unlinkSync(dbPath); } catch (_) {}
  });

  await t.test('T10: Explicit due-time dispatch produces a real file effect', async (t) => {
    const outputPath = path.join(tempRoot, 'scheduler-output.txt');
    const scheduler = new AutomationScheduler({ dbPath: ':memory:', executor: async (action, params) => {
      assert.equal(action, 'write-fixture');
      fs.appendFileSync(outputPath, params.text);
      return { ok: true, executed: true };
    } });
    t.after(() => scheduler.close());
    
    // Register recurring job
    const job = scheduler.registerJob({
      title: 'Fixture output',
      cronExpr: '0 0 * * *',
      targetAction: 'write-fixture',
      params: { text: 'one actual dispatch\n' },
    });
    assert.ok(job.id, 'Job registered with ID');
    assert.ok(job.nextRun > Date.now(), 'Next run calculated');

    // Trigger run via scheduler check
    const triggerRes = await scheduler.checkAndTriggerDueJobs(job.nextRun + 1000);
    assert.equal(triggerRes.triggeredCount, 1, '1 due job triggered');

    const history = scheduler.listRuns({ jobId: job.id });
    assert.ok(history.length >= 1, 'Execution history recorded');
    assert.equal(history[0].status, 'completed', 'Run status completed');
    assert.equal(fs.readFileSync(outputPath, 'utf8'), 'one actual dispatch\n');
    await scheduler.checkAndTriggerDueJobs(job.nextRun + 1000);
    assert.equal(fs.readFileSync(outputPath, 'utf8'), 'one actual dispatch\n', 'Same due time cannot repeat effect');
  });

  await t.test('T11: Keyword recall of supplied in-memory records', async (t) => {
    const memory = new PersistentMemoryStore({ dbPath: ':memory:' });
    t.after(() => memory.close());
    
    memory.remember({
      category: 'infrastructure',
      content: 'Zero Host runs on single port 18789 using Protocol 4 WebSocket',
      tags: ['port', 'gateway', 'websocket'],
    });

    memory.remember({
      category: 'credentials',
      content: 'API keys are strictly isolated in untracked .env files',
      tags: ['security', 'env', 'credentials'],
    });

    const search = memory.recall('port 18789');
    assert.ok(search.length >= 1, 'Semantic recall returns results');
    assert.ok(search[0].content.includes('18789'), 'Top result matches query');
  });

  await t.test('T12: Context projection preserves original transcript', async (t) => {
    const sessions = new SessionManager({ dbPath: ':memory:' });
    t.after(() => sessions.close());
    const session = sessions.createSession('test_compaction_sess', 'Test Compaction');

    // Append 15 messages
    for (let i = 1; i <= 15; i++) {
      sessions.appendMessage(session.id, {
        role: i % 2 === 1 ? 'user' : 'assistant',
        content: `Message ${i} content in session transcript`,
      });
    }

    const before = sessions.getTranscript(session.id);
    assert.equal(before.length, 15, '15 messages before compaction');

    // Compact keeping last 5
    const compResult = sessions.compactContext(session.id, 5);
    assert.equal(compResult.compacted, true, 'Compacted flag true');
    assert.equal(compResult.prunedCount, 10, '10 messages pruned');

    const after = sessions.getTranscript(session.id);
    assert.ok(after.some((m) => m.content.includes('Context compacted')), 'Compaction summary marker appended');
    assert.equal(after.length, 16, 'Original messages plus marker remain');
    assert.deepEqual(after.filter(m => m.role !== 'system').map(m => m.content), before.map(m => m.content));
    const context = sessions.getModelContext(session.id);
    assert.equal(context.length, 6, 'Provider context has marker and five recent messages');
    assert.deepEqual(context.filter(m => m.role !== 'system').map(m => m.content), before.slice(-5).map(m => m.content));
  });

  await t.test('T13: Supplied provider failure counters and degraded state', async (t) => {
    const fabric = new ModelFabric({
      providers: [
        {
          id: 'test-failing-provider',
          baseUrl: 'https://invalid-upstream-domain.example/v1',
          apiKey: 'test-key',
          models: ['test-fail-model'],
        },
      ],
    });

    // Record repeated failures
    for (let i = 0; i < 5; i++) {
      fabric.recordFailure('test-failing-provider', 'Connection timeout 504');
    }

    const healthReport = fabric.getHealthReport();
    const providerHealth = healthReport['test-failing-provider'];
    assert.ok(providerHealth, 'Provider health tracked');
    assert.equal(providerHealth.status, 'degraded', 'Circuit breaker enters degraded/open state');
    assert.equal(providerHealth.consecutiveFailures, 5, 'Failure count tracked');
  });

  await t.test('T14: Explicit provider file reload without inference', async (t) => {
    const tempConfig = path.join(tempRoot, 'providers.json');
    fs.writeFileSync(tempConfig, JSON.stringify([
      { id: 'initial-provider', models: ['initial-model-v1'] },
    ]));

    const fabric = new ModelFabric({ configPath: tempConfig });
    assert.ok(fabric.resolveModel('initial-model-v1'), 'Resolves initial model');

    // Update config on disk
    fs.writeFileSync(tempConfig, JSON.stringify([
      { id: 'initial-provider', models: ['initial-model-v1'] },
      { id: 'hot-added-provider', models: ['hot-added-model-v2'] },
    ]));

    // Trigger hot reload
    fabric.reloadFromDisk();
    assert.ok(fabric.resolveModel('hot-added-model-v2'), 'Resolves hot-added model without restart');

    try { fs.unlinkSync(tempConfig); } catch (_) {}
  });

  await t.test('T15: Secret scanner on its configured included paths', async (t) => {
    const scannerPath = path.join(REPO_ROOT, 'backend', 'scripts', 'scan-secrets.mjs');
    const proc = spawnSync(process.execPath, [scannerPath], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 30000,
    });

    assert.equal(proc.status, 0, 'Secret scanner exits with 0');
    assert.ok(proc.stdout.includes('0 exposed credentials found'), 'Zero credentials found');
    // Exercise the actual scanner in a separate Git working tree, including a
    // redacted first match followed by a detectable value on the same line.
    const fixture = path.join(tempRoot, 'scanner-fixture');
    const scripts = path.join(fixture, 'backend', 'scripts');
    fs.mkdirSync(scripts, { recursive: true });
    const fixtureScanner = path.join(scripts, 'scan-secrets.mjs');
    fs.copyFileSync(scannerPath, fixtureScanner);
    const git = (...args) => {
      const result = spawnSync('git', args, { cwd: fixture, encoding: 'utf8', timeout: 10000 });
      assert.equal(result.status, 0, 'Fixture Git command succeeds');
    };
    git('init', '--quiet');
    const detectable = 'nvapi-' + 'Q'.repeat(40);
    fs.writeFileSync(path.join(fixture, 'included.txt'), 'nvapi-REDACTED' + 'Q'.repeat(40) + ' ' + detectable);
    fs.writeFileSync(path.join(fixture, '.env'), detectable);
    git('add', 'included.txt', '.env');
    const scan = () => spawnSync(process.execPath, [fixtureScanner], { cwd: fixture, encoding: 'utf8', timeout: 10000 });
    const found = scan();
    assert.equal(found.status, 1, 'A later real pattern cannot hide behind a redacted first match');
    assert.ok(found.stderr.includes('included.txt (NVIDIA API Key)'));
    assert.ok(!found.stderr.includes(detectable), 'No credential bytes are printed');
    fs.writeFileSync(path.join(fixture, 'included.txt'), 'no credential pattern');
    fs.writeFileSync(path.join(fixture, 'untracked.txt'), detectable);
    const clean = scan();
    assert.equal(clean.status, 0, 'Explicitly excluded .env and untracked files are outside tracked scan scope');
    assert.ok(clean.stdout.includes('Ignored/untracked files and excluded paths are not covered'));
  });

});
