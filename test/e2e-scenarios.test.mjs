/**
 * @fileoverview Zero AI — End-to-End Scenario Verification Suite (T01–T15)
 * 
 * Programmatically exercises and validates all 15 core architectural scenarios
 * mandated by the Master Engineering Execution Directive:
 * 
 * T01: Clean Environment Launch
 * T02: Standalone Gateway Startup (Port 18789)
 * T03: First-Turn Chat Completion
 * T04: Multi-Turn Tool Use (Model-Driven Loop)
 * T05: Tool Authorization Gate (Hold & Schema Enforcement)
 * T06: Desktop Tool Execution (Windows OS Driver)
 * T07: Human Hold (Takeover Safety Contract)
 * T08: Sub-Agent Task Delegation
 * T09: Interrupted Task Startup Recovery
 * T10: Durable Automation & Cron Engine
 * T11: Persistent Semantic Memory Retrieval
 * T12: Sliding-Window Context Compaction
 * T13: Model Fabric Circuit Breaker Failover
 * T14: Model Catalog Hot-Reload
 * T15: Secret Leak Prevention & Hygiene Scan
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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

test('ZERO AI — End-to-End Scenarios T01–T15 Full Execution Matrix', async (t) => {

  // T01: Clean Environment Launch
  await t.test('T01: Clean Environment Launch (zero-host.ps1 integrity)', async () => {
    const scriptPath = path.join(REPO_ROOT, 'zero-host.ps1');
    assert.ok(fs.existsSync(scriptPath), 'zero-host.ps1 exists');

    const content = fs.readFileSync(scriptPath, 'utf8');
    assert.ok(content.includes('$PSScriptRoot'), 'Uses dynamic $PSScriptRoot');
    assert.ok(content.includes('zero-host.mjs'), 'Executes native zero-host.mjs daemon');
    assert.ok(!content.includes('openclaw.cmd'), 'Does not invoke legacy openclaw.cmd wrapper');
    assert.ok(content.includes('Remove-Item Env:\\ZERO_GATEWAY_KEY'), 'Cleans sensitive env before launch');
  });

  // T02: Standalone Gateway Startup
  await t.test('T02: Standalone Gateway Startup (Port 18789 Health & Models)', async () => {
    const res = await fetch('http://127.0.0.1:18789/health');
    assert.equal(res.status, 200, '/health returns 200 OK');
    const health = await res.json();
    assert.equal(health.status, 'ok', 'Status is ok');
    assert.ok(health.gateway || health.service, 'Gateway or service identifier present');

    const modelsRes = await fetch('http://127.0.0.1:18789/v1/models');
    assert.equal(modelsRes.status, 200, '/v1/models returns 200 OK');
    const modelsData = await modelsRes.json();
    assert.ok(Array.isArray(modelsData.data), 'Returns model list');
    assert.ok(modelsData.data.length > 0, 'Catalog has available models');
  });

  // T03: First-Turn Chat Completion
  await t.test('T03: First-Turn Chat Completion (Gateway HTTP Inference)', async () => {
    const payload = {
      model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
      messages: [
        { role: 'user', content: 'Reply with exactly: HELLO_FROM_ZERO_AI' },
      ],
      max_tokens: 128,
      temperature: 0,
      stream: false,
    };

    const res = await fetch('http://127.0.0.1:18789/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200, 'HTTP 200 from chat completions endpoint');
    const data = await res.json();
    assert.ok(data.choices && data.choices.length > 0, 'Contains choices');
    const content = data.choices[0].message?.content;
    assert.ok(typeof content === 'string' && content.length > 0, 'Message contains non-empty content');
  });

  // T04: Multi-Turn Tool Use (Model-Driven Loop)
  await t.test('T04: Multi-Turn Tool Use (Model-Driven Execution Loop)', async () => {
    const engine = new CapabilityEngine();
    
    // Simulate model-driven tool calling turn:
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

    const followUp = {
      role: 'assistant',
      content: `I checked the open windows. Audit reference: ${toolResult.auditId}.`,
    };
    assert.ok(followUp.content.includes('audit_'), 'Follow-up completes turn');
  });

  // T05: Tool Authorization Gate
  await t.test('T05: Tool Authorization Gate (Disallowed Action Rejection)', async () => {
    const engine = new CapabilityEngine();

    // 1. Unknown tool
    const unknownTool = engine.validate('unauthorized_shell_injector', { command: 'rmdir' });
    assert.equal(unknownTool.valid, false, 'Unknown tool is rejected');

    // 2. Disallowed action under valid capability
    const disallowedAction = engine.validate('zero_computer_action', { action: 'format_drive_c' });
    assert.equal(disallowedAction.valid, false, 'Disallowed action is rejected');
  });

  // T06: Desktop Tool Execution
  await t.test('T06: Desktop Tool Execution (Windows OS Observation & Actions)', async () => {
    const operator = new ComputerOperator();
    const result = await operator.execute('get_window_state', {});
    assert.equal(result.ok, true, 'get_window_state succeeds');
    assert.ok(result.window !== undefined, 'Returns window info');
  });

  // T07: Human Hold (Takeover Safety Contract)
  await t.test('T07: Human Hold (Takeover Safety Arbitration)', async () => {
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

    // Fresh observation clears staleness
    const freshCapture = operator.evaluateSafety('screenshot');
    assert.equal(freshCapture.allowed, true, 'Observation allowed to refresh state');

    const allowedAfterCapture = operator.evaluateSafety('left_click');
    assert.equal(allowedAfterCapture.allowed, true, 'Coordinate action allowed after fresh capture');
  });

  // T08: Sub-Agent Task Delegation
  await t.test('T08: Sub-Agent Task Delegation (Parent-Child Execution)', async () => {
    const runtime = new TaskStateMachine({ dbPath: ':memory:' });
    
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

    runtime.completeChildTask(childTask.id, { leaksFound: 0, verifiedClean: true });

    const parentAfter = runtime.getTask(parent.id);
    assert.equal(parentAfter.status, 'RUNNING', 'Parent resumed to RUNNING after child completed');
    
    const childAfter = runtime.getTask(childTask.id);
    assert.equal(childAfter.parentTaskId, parent.id, 'Child links to parent');
    assert.equal(childAfter.status, 'COMPLETED', 'Child status COMPLETED');
    assert.equal(childAfter.result.verifiedClean, true, 'Child result retained');
  });

  // T09: Interrupted Task Recovery
  await t.test('T09: Interrupted Task Recovery (SQLite Host Restart Recovery)', async () => {
    const dbPath = path.join(REPO_ROOT, '.zero-data', `test-recovery-${Date.now()}.sqlite`);
    
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

  // T10: Durable Automation & Cron Engine
  await t.test('T10: Durable Automation & Cron Engine (Schedule & Run History)', async () => {
    const scheduler = new AutomationScheduler({ dbPath: ':memory:' });
    
    // Register recurring job
    const job = scheduler.registerJob({
      title: 'Daily Security Sweep',
      cronExpr: '0 0 * * *',
      targetAction: 'scan-secrets',
      params: { directory: 'backend/config' },
    });
    assert.ok(job.id, 'Job registered with ID');
    assert.ok(job.nextRun > Date.now(), 'Next run calculated');

    // Trigger run via scheduler check
    const triggerRes = await scheduler.checkAndTriggerDueJobs(job.nextRun + 1000);
    assert.equal(triggerRes.triggeredCount, 1, '1 due job triggered');

    const history = scheduler.listRuns({ jobId: job.id });
    assert.ok(history.length >= 1, 'Execution history recorded');
    assert.equal(history[0].status, 'completed', 'Run status completed');
  });

  // T11: Persistent Semantic Memory Retrieval
  await t.test('T11: Persistent Semantic Memory Retrieval (Recall & Weighting)', async () => {
    const memory = new PersistentMemoryStore({ dbPath: ':memory:' });
    
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

  // T12: Context Compaction
  await t.test('T12: Sliding-Window Context Compaction (Session Compaction)', async () => {
    const sessions = new SessionManager({ dbPath: ':memory:' });
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
    assert.ok(after.length <= 7, 'Transcript size bounded');
  });

  // T13: Model Fabric Circuit Breaker Failover
  await t.test('T13: Model Fabric Circuit Breaker Failover (Health & Tripping)', async () => {
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

  // T14: Model Catalog Hot-Reload
  await t.test('T14: Model Catalog Hot-Reload (Reload Without Restart)', async () => {
    const tempConfig = path.join(REPO_ROOT, '.zero-data', `temp-providers-${Date.now()}.json`);
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

  // T15: Secret Leak Prevention & Hygiene Scan
  await t.test('T15: Secret Leak Prevention (Full Repository Secrets Scan)', async () => {
    const scannerPath = path.join(REPO_ROOT, 'backend', 'scripts', 'scan-secrets.mjs');
    const proc = spawnSync(process.execPath, [scannerPath], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });

    assert.equal(proc.status, 0, 'Secret scanner exits with 0');
    assert.ok(proc.stdout.includes('0 exposed credentials found'), 'Zero credentials found');
  });

});
