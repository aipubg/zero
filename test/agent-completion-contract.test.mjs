import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { AgentTeamOrchestrator, TaskStateMachine } from '../packages/agent-runtime/index.mjs';

test('[CONTRACT] actual HTTP truncated and filtered completions fail durable specialist or coordinator tasks', async t => {
  let phase = 'specialist'; let reason = 'length'; let calls = 0;
  const server = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    const payload = JSON.parse(body); calls++;
    const affected = phase === 'specialist' || payload.model === 'fixture/lead';
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ finish_reason: affected ? reason : 'stop', message: { role: 'assistant', content: 'Plausible but incomplete success prose' } }] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const fabric = new ModelFabric({ aliases: { 'zero-lead': 'fixture/lead' }, providers: [{ id: 'fixture', baseUrl: `http://127.0.0.1:${server.address().port}`, apiKey: 'local-contract-only', models: ['fixture/lead', 'fixture/worker'] }] });
  for (phase of ['specialist', 'coordinator']) for (reason of ['length', 'content_filter']) {
    calls = 0;
    const sm = new TaskStateMachine();
    try {
      const team = new AgentTeamOrchestrator({ stateMachine: sm, modelFabric: fabric });
      const result = await team.executeTeamWorkflow({ goal: 'Reject incomplete prose', subtasks: [{ id: 'child', agentId: 'coder', modelId: 'fixture/worker', goal: 'Return result', tools: [], dependsOn: [] }] });
      assert.equal(result.status, 'FAILED', `${phase}:${reason}`);
      assert.equal(sm.getTask(result.masterTaskId).status, 'FAILED');
      if (phase === 'specialist') {
        assert.equal(calls, 1, 'Failed specialist must not trigger consolidation');
        const child = sm.getChildTasks(result.masterTaskId)[0];
        assert.equal(child.status, 'FAILED');
        const inference = sm.getTaskSteps(child.id).find(step => step.toolName === 'model_inference');
        assert.equal(inference.status, 'failed'); assert.equal(inference.toolResult.finishReason, reason);
      } else {
        assert.equal(calls, 2);
        assert.match(result.consolidatedResult.consolidationError, new RegExp(reason));
      }
    } finally { sm.close(); }
  }
});

test('[CONTRACT] malformed HTTP tool batches execute no earlier valid side effect', async t => {
  let mode; let effects = 0;
  const server = http.createServer(async (req, res) => {
    for await (const chunk of req) void chunk;
    const call = (id, args) => ({ id, type: 'function', function: { name: 'effect', arguments: args } });
    const tool_calls = mode === 'shape' ? {} : mode === 'empty' ? [] : [call('first', '{}'), call(mode === 'duplicate' ? 'first' : 'second', mode === 'arguments' ? '{broken' : '{}')];
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ finish_reason: 'tool_calls', message: { role: 'assistant', content: null, tool_calls } }] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const fabric = new ModelFabric({ providers: [{ id: 'fixture', baseUrl: `http://127.0.0.1:${server.address().port}`, apiKey: 'local-contract-only', models: ['fixture/worker'] }] });
  for (mode of ['shape', 'empty', 'arguments', 'duplicate']) {
    const sm = new TaskStateMachine();
    try {
      const team = new AgentTeamOrchestrator({ stateMachine: sm, modelFabric: fabric, capabilityEngine: {
        customCapabilities: new Map([['effect', { name: 'effect' }]]), execute: async () => { effects++; return { ok: true }; },
      } });
      const result = await team.executeTeamWorkflow({ goal: mode, subtasks: [{ id: 'child', agentId: 'coder', modelId: 'fixture/worker', goal: 'Execute batch', tools: ['effect'], dependsOn: [] }] });
      assert.equal(result.status, 'FAILED', mode);
      assert.equal(effects, 0, `No valid leading call may execute before invalid ${mode} is rejected`);
      assert.equal(sm.getTask(result.masterTaskId).status, 'FAILED');
    } finally { sm.close(); }
  }
});
