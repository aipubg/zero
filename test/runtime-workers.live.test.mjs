// Opt-in only: this test spends real provider tokens and never uses a live task DB.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { AgentTeamOrchestrator, TaskStateMachine, AgentMessageBus } from '../packages/agent-runtime/index.mjs';

test('LIVE NVIDIA: two assigned models run concurrently, execute real tools and consolidate', {
  skip: process.env.ZERO_RUN_LIVE_AGENTS !== '1' ? 'Set ZERO_RUN_LIVE_AGENTS=1 to spend real provider tokens' : false,
  timeout: 150000,
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-live-agents-'));
  const reportPath = path.join(os.tmpdir(), `zero-live-agent-evidence-${Date.now()}.json`);
  const report = { startedAt: new Date().toISOString(), status: 'RUNNING', provider: 'NVIDIA',
    externalWorkerGates: { mobile: 'BLOCKED', cloud: 'BLOCKED', remote: 'BLOCKED' }, requests: [], tools: [] };
  let sm;
  let failure;
  let keys = [];
  const redact = (value) => keys.reduce((text, key) => text.split(key).join('[redacted]'), String(value));
  try {
    const envPath = fileURLToPath(new URL('../.env', import.meta.url));
    if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
    const bindingsPath = path.join(root, 'bindings.json');
    fs.writeFileSync(bindingsPath, JSON.stringify({ agentBindings: { coder: { model: 'zero-lead' }, researcher: { model: 'zero-vision' }, zero: { model: 'zero-lead' } } }));
    const fabric = new ModelFabric({ agentBindingsPath: bindingsPath });
    const a = fabric.resolveAgentModel('coder');
    const b = fabric.resolveAgentModel('researcher');
    assert.ok(a && b, 'Both model aliases must resolve');
    assert.notEqual(a.canonicalModelId, b.canonicalModelId, 'This test requires two distinct assigned models');
    report.assignments = { coder: { alias: 'zero-lead', modelId: a.canonicalModelId }, researcher: { alias: 'zero-vision', modelId: b.canonicalModelId } };
    keys = [...new Set([fabric.resolveApiKey(a.provider), fabric.resolveApiKey(b.provider)].filter(Boolean))];
    if (!fabric.resolveApiKey(a.provider) || !fabric.resolveApiKey(b.provider)) {
      report.status = 'BLOCKED';
      throw new Error('Configured NVIDIA credentials are unavailable');
    }
    const executeChat = fabric.executeChat.bind(fabric);
    fabric.executeChat = async (payload, options = {}) => {
      const request = { modelId: payload.model, phase: payload.messages[0]?.content?.startsWith('Consolidate') ? 'consolidation' : payload.messages.some((message) => message.role === 'tool') ? 'after-tool' : 'initial', startedAt: Date.now() };
      report.requests.push(request);
      try {
        const response = await executeChat(payload, { ...options, maxRetries: 0, timeoutMs: 45000 });
        request.ok = true;
        request.httpStatus = response.status;
        return response;
      } catch (error) {
        request.ok = false;
        request.httpStatus = error.status || null;
        request.error = redact(error.message);
        throw error;
      } finally {
        request.finishedAt = Date.now();
        request.durationMs = request.finishedAt - request.startedAt;
      }
    };
    sm = new TaskStateMachine({ dbPath: path.join(root, 'tasks.sqlite') });
    const engine = new CapabilityEngine({ operator: {} });
    engine.registerCapability({ name: 'write_parallel_evidence', description: 'Write one required tiny local evidence file. Return actual file evidence.',
      parameters: { type: 'object', properties: { agent: { type: 'string', enum: ['a', 'b'] }, content: { type: 'string', enum: ['ZERO_A_TOOL_OK', 'ZERO_B_TOOL_OK'] } }, required: ['agent', 'content'], additionalProperties: false },
      handler: async ({ agent, content }) => {
        assert.ok(['a', 'b'].includes(agent));
        assert.equal(content, agent === 'a' ? 'ZERO_A_TOOL_OK' : 'ZERO_B_TOOL_OK');
        const target = path.join(root, `evidence-${agent}.txt`);
        fs.writeFileSync(target, content, { flag: 'wx' });
        const actual = fs.readFileSync(target, 'utf8');
        const evidence = { agent, content: actual, bytes: Buffer.byteLength(actual), sha256: createHash('sha256').update(actual).digest('hex'), timestamp: Date.now() };
        report.tools.push(evidence);
        return { ok: true, ...evidence };
      },
    });
    const team = new AgentTeamOrchestrator({ stateMachine: sm, modelFabric: fabric, capabilityEngine: engine });
    const outcome = await team.executeTeamWorkflow({ goal: 'Execute two tiny independent evidence tool calls, then consolidate their actual results.',
      timeoutMs: 120000, maxToolRounds: 3, maxOutputTokens: 2048,
      subtasks: [
        { id: 'live_a', agentId: 'coder', goal: 'You MUST call write_parallel_evidence exactly once with agent="a" and content="ZERO_A_TOOL_OK". After the tool succeeds, reply only ZERO_A_TOOL_OK. Do not simulate tool execution.', tools: ['write_parallel_evidence'], dependsOn: [] },
        { id: 'live_b', agentId: 'researcher', goal: 'You MUST call write_parallel_evidence exactly once with agent="b" and content="ZERO_B_TOOL_OK". After the tool succeeds, reply only ZERO_B_TOOL_OK. Do not simulate tool execution.', tools: ['write_parallel_evidence'], dependsOn: [] },
      ],
    });
    report.workflow = { status: outcome.status, masterTaskId: outcome.masterTaskId, subtaskStatuses: outcome.subtaskStatuses,
      errors: outcome.consolidatedResult.errors, consolidationError: outcome.consolidatedResult.consolidationError,
      synthesis: outcome.consolidatedResult.synthesis, durationMs: outcome.durationMs };
    assert.equal(outcome.status, 'COMPLETED', JSON.stringify(report.workflow));
    assert.equal(report.tools.length, 2, 'Both external models must actually request their assigned tool');
    assert.equal(fs.readFileSync(path.join(root, 'evidence-a.txt'), 'utf8'), 'ZERO_A_TOOL_OK');
    assert.equal(fs.readFileSync(path.join(root, 'evidence-b.txt'), 'utf8'), 'ZERO_B_TOOL_OK');
    const initial = report.requests.filter((request) => request.phase === 'initial');
    assert.equal(initial.length, 2);
    report.parallelOverlapMs = Math.min(...initial.map((request) => request.finishedAt)) - Math.max(...initial.map((request) => request.startedAt));
    assert.ok(report.parallelOverlapMs > 0, 'Distinct upstream requests must be in flight together');
    for (const [id, model] of [['live_a', a.canonicalModelId], ['live_b', b.canonicalModelId]]) {
      const result = outcome.consolidatedResult.results[id];
      assert.equal(result.modelId, model);
      assert.equal(result.toolResults.length, 1);
      assert.equal(result.toolResults[0].result.ok, true);
    }
    const children = sm.getChildTasks(outcome.masterTaskId);
    assert.equal(children.length, 2);
    assert.ok(children.every((child) => child.status === 'COMPLETED'));
    sm.close();
    sm = new TaskStateMachine({ dbPath: path.join(root, 'tasks.sqlite') });
    assert.equal(sm.getTask(outcome.masterTaskId).status, 'COMPLETED');
    assert.equal(new AgentMessageBus({ db: sm.db }).getMessageHistory(outcome.masterTaskId).at(-1).type, 'TASK_COMPLETED');
    assert.ok(sm.getLatestCheckpoint(outcome.masterTaskId).stateSnapshot.consolidatedResult.synthesis);
    report.restartVerified = true;
    report.status = 'PASS';
  } catch (error) {
    failure = error;
    if (report.status !== 'BLOCKED') report.status = 'FAILED_EXTERNAL';
    report.error = redact(error.message);
  } finally {
    sm?.close();
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(reportPath, redact(JSON.stringify(report, null, 2)));
    console.log(JSON.stringify({ liveAgentStatus: report.status, reportPath, assignments: report.assignments, parallelOverlapMs: report.parallelOverlapMs,
      requests: report.requests.map(({ modelId, phase, ok, durationMs, httpStatus }) => ({ modelId, phase, ok, durationMs, httpStatus })), toolEvidenceCount: report.tools.length }));
    assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('zero-live-agents-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
  if (failure) throw new Error(redact(failure.message));
});
