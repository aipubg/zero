import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import { TaskStateMachine, AgentTeamOrchestrator, AgentMessageBus } from '../packages/agent-runtime/index.mjs';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { CapabilityEngine } from '../packages/capability-engine/index.mjs';
import { WorkspaceManager } from '../packages/workspaces/index.mjs';

const cleanups = new WeakMap();
function cleanup(t, action) {
  if (!cleanups.has(t)) {
    cleanups.set(t, []);
    t.after(async () => {
      for (const close of cleanups.get(t).reverse()) await close();
    });
  }
  cleanups.get(t).push(action);
}

function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-runtime-workers-'));
  cleanup(t, () => {
    // Cleanup is confined to the exact directory created above.
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-runtime-workers-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return root;
}

const subtask = (id, agentId = 'coder', dependsOn = []) => ({ id, agentId, dependsOn, goal: `Execute ${id}`, tools: [] });
const processJob = (script) => ({ type: 'process', command: process.execPath, args: ['-e', script] });

test('controlled ModelFabric HTTP overlaps supplied model responses, executes file tools and consolidates durably', { timeout: 10000 }, async (t) => {
  const root = temporary(t);
  const dbPath = path.join(root, 'tasks.sqlite');
  const requests = [];
  const held = [];
  let overlap = false;
  const server = http.createServer(async (req, res) => {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      const payload = JSON.parse(body);
      requests.push(payload);
      const send = (message) => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', ...message } }] }));
      };
      if (payload.model === 'fixture/lead') return send({ content: 'Consolidated: both artifacts exist and reviewer received both results.' });
      if (payload.model === 'fixture/reviewer') {
        assert.match(payload.messages[1].content, /artifact-a/);
        assert.match(payload.messages[1].content, /artifact-b/);
        return send({ content: 'Received both specialist results.' });
      }
      if (payload.messages.some((message) => message.role === 'tool')) {
        const tool = payload.messages.find((message) => message.role === 'tool');
        assert.equal(JSON.parse(tool.content).ok, true);
        return send({ content: `Created artifact-${payload.model.endsWith('/a') ? 'a' : 'b'}` });
      }
      assert.equal(req.url, '/v1/chat/completions');
      assert.equal(payload.max_tokens, 2048);
      assert.equal(payload.tools[0].function.name, 'write_evidence');
      held.push(() => send({ content: null, tool_calls: [{ id: `call-${payload.model}`, type: 'function', function: { name: 'write_evidence', arguments: JSON.stringify({ name: payload.model.endsWith('/a') ? 'a' : 'b' }) } }] }));
      if (held.length === 2) {
        overlap = true;
        held.splice(0).forEach((reply) => reply());
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: { message: error.message } }));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  cleanup(t, () => { server.closeAllConnections(); server.close(); });
  const bindings = path.join(root, 'bindings.json');
  fs.writeFileSync(bindings, JSON.stringify({ agentBindings: { coder: { model: 'fixture/a' }, researcher: { model: 'fixture/b' }, reviewer: { model: 'fixture/reviewer' }, zero: { model: 'fixture/lead' } } }));
  const fabric = new ModelFabric({ agentBindingsPath: bindings, providers: [{ id: 'fixture', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, apiKey: 'local-test-only', models: ['fixture/a', 'fixture/b', 'fixture/reviewer', 'fixture/lead'] }] });
  const capabilityEngine = new CapabilityEngine({ operator: {} });
  capabilityEngine.registerCapability({ name: 'write_evidence', parameters: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] }, handler: async ({ name }) => {
    assert.ok(['a', 'b'].includes(name));
    fs.writeFileSync(path.join(root, `artifact-${name}.txt`), `evidence-${name}`);
    return { ok: true, artifact: `artifact-${name}.txt` };
  } });
  let sm = new TaskStateMachine({ dbPath });
  const team = new AgentTeamOrchestrator({ stateMachine: sm, modelFabric: fabric, capabilityEngine });
  const outcome = await team.executeTeamWorkflow({ goal: 'Create two evidence files and collect results', timeoutMs: 5000, subtasks: [
    { ...subtask('a'), tools: ['write_evidence'] },
    { ...subtask('b', 'researcher'), tools: ['write_evidence'] },
    subtask('review', 'reviewer', ['a', 'b']),
  ] });
  assert.equal(outcome.status, 'COMPLETED');
  assert.equal(overlap, true, 'both initial HTTP requests must arrive before either is answered');
  assert.equal(requests.length, 6);
  assert.match(outcome.consolidatedResult.synthesis, /Consolidated/);
  assert.equal(outcome.consolidatedResult.results.a.modelId, 'fixture/a');
  assert.equal(outcome.consolidatedResult.results.b.modelId, 'fixture/b');
  assert.equal(outcome.consolidatedResult.results.a.verified, false);
  assert.equal(fs.readFileSync(path.join(root, 'artifact-a.txt'), 'utf8'), 'evidence-a');
  assert.equal(fs.readFileSync(path.join(root, 'artifact-b.txt'), 'utf8'), 'evidence-b');
  const children = sm.getChildTasks(outcome.masterTaskId);
  assert.equal(children.length, 3);
  assert.ok(children.every((child) => child.status === 'COMPLETED'));
  assert.equal(sm.getTaskSteps(outcome.masterTaskId).filter((step) => step.toolResult?.modelId).length, 3);
  const childId = children.find((child) => child.agentId === 'coder').id;
  assert.equal(sm.getTaskSteps(childId).filter((step) => step.toolName === 'write_evidence').length, 1);
  sm.close();
  sm = new TaskStateMachine({ dbPath });
  cleanup(t, () => sm.close());
  assert.deepEqual(sm.getTask(outcome.masterTaskId).result, outcome.consolidatedResult);
  assert.equal(new AgentMessageBus({ db: sm.db }).getMessageHistory(childId).at(-1).type, 'TASK_COMPLETED');
  assert.equal(sm.getLatestCheckpoint(outcome.masterTaskId).stateSnapshot.subtaskStatuses.review, 'COMPLETED');
});

test('parallel child settlement waits for siblings and preserves escalation', async (t) => {
  const sm = new TaskStateMachine();
  cleanup(t, () => sm.close());
  const parent = sm.createTask({ goal: 'parent' });
  sm.enqueueTask(parent.id);
  sm.startTask(parent.id);
  const a = sm.delegateTask({ parentTaskId: parent.id, childAgentId: 'a', goal: 'a' }).childTask;
  const b = sm.delegateTask({ parentTaskId: parent.id, childAgentId: 'b', goal: 'b' }).childTask;
  sm.completeChildTask(a.id, false);
  assert.equal(sm.getTask(parent.id).status, 'WAITING');
  sm.failChildTask(b.id, 'actual failure');
  assert.match(sm.getTask(parent.id).waitReason, /HUMAN_ESCALATION/);
  assert.equal(sm.getTaskSteps(parent.id).find((step) => step.status === 'completed').toolResult, false);
  assert.throws(() => sm.createTask({ id: parent.id, goal: 'overwrite' }), /UNIQUE/);
});

test('failures block transitive dependencies; missing executors and tools cannot fabricate success', async (t) => {
  const sm = new TaskStateMachine();
  cleanup(t, () => sm.close());
  const team = new AgentTeamOrchestrator({ stateMachine: sm });
  const outcome = await team.executeTeamWorkflow({ goal: 'No provider', subtasks: [subtask('a'), subtask('b', 'reviewer', ['a']), subtask('c', 'researcher', ['b'])] });
  assert.equal(outcome.status, 'FAILED');
  assert.deepEqual(outcome.subtaskStatuses, { a: 'FAILED', b: 'BLOCKED', c: 'BLOCKED' });
  assert.match(outcome.consolidatedResult.errors.a, /no model fabric/);
  assert.equal(sm.getTask(outcome.masterTaskId).status, 'FAILED');
});

test('invalid DAGs fail before task creation', async (t) => {
  const sm = new TaskStateMachine();
  cleanup(t, () => sm.close());
  const team = new AgentTeamOrchestrator({ stateMachine: sm });
  await assert.rejects(team.executeTeamWorkflow({ goal: 'cycle', subtasks: [subtask('a', 'coder', ['b']), subtask('b', 'reviewer', ['a'])] }), /Cyclic/);
  await assert.rejects(team.executeTeamWorkflow({ goal: 'unknown', subtasks: [subtask('a', 'coder', ['missing'])] }), /Unknown dependency/);
  await assert.rejects(team.executeTeamWorkflow({ goal: 'duplicate', subtasks: [subtask('a'), subtask('a')] }), /Invalid subtask/);
  assert.equal(sm.listTasks().length, 0);
});

test('workflow deadlines and parent cancellation abort work and ignore late completion', { timeout: 5000 }, async (t) => {
  const sm = new TaskStateMachine();
  cleanup(t, () => sm.close());
  const team = new AgentTeamOrchestrator({ stateMachine: sm });
  let finish;
  let workerSignal;
  const running = team.executeTeamWorkflow({ goal: 'Timeout', timeoutMs: 40, subtasks: [subtask('a'), subtask('b', 'reviewer', ['a'])], taskExecutors: { a: (_, context) => { workerSignal = context.signal; return new Promise((resolve) => { finish = resolve; }); } } });
  const outcome = await running;
  assert.equal(outcome.status, 'CANCELLED');
  assert.equal(workerSignal.aborted, true);
  const snapshot = JSON.stringify(sm.listTasks());
  finish({ output: 'late result' });
  await delay(10);
  assert.equal(JSON.stringify(sm.listTasks()), snapshot);
  assert.equal(sm.getTask(outcome.masterTaskId).status, 'CANCELLED');
  assert.equal(sm.getChildTasks(outcome.masterTaskId)[0].status, 'CANCELLED');
  let started;
  const ready = new Promise((resolve) => { started = resolve; });
  const pending = team.executeTeamWorkflow({ goal: 'Cancel parent', subtasks: [subtask('a')], taskExecutors: { a: () => { started(); return new Promise(() => {}); } } });
  await ready;
  const parent = sm.listTasks().find((task) => task.goal === '[Team Execution] Cancel parent');
  sm.cancelTask(parent.id, 'User stopped');
  assert.equal((await pending).status, 'CANCELLED');
});

test('child executor is required and its cancellation is bounded', async (t) => {
  const sm = new TaskStateMachine();
  cleanup(t, () => sm.close());
  const parent = sm.createTask({ goal: 'parent' });
  sm.enqueueTask(parent.id); sm.startTask(parent.id);
  const child = sm.delegateTask({ parentTaskId: parent.id, goal: 'child' }).childTask;
  await assert.rejects(sm.executeChildTask(child.id), /requires an executor/);
  assert.equal(sm.getTask(child.id).status, 'FAILED');
  const child2 = sm.delegateTask({ parentTaskId: parent.id, goal: 'child2' }).childTask;
  const running = sm.executeChildTask(child2.id, () => new Promise(() => {}));
  sm.cancelTask(parent.id);
  await assert.rejects(running);
  assert.equal(sm.getTask(child2.id).status, 'CANCELLED');
});

test('real process handoff persists stdout, filesystem output and attached child result', { timeout: 10000 }, async (t) => {
  const root = temporary(t);
  const dbPath = path.join(root, 'workers.sqlite');
  const sm = new TaskStateMachine({ dbPath: path.join(root, 'tasks.sqlite') });
  cleanup(t, () => sm.close());
  let manager = new WorkspaceManager({ dbPath, baseStorageDir: path.join(root, 'workspaces'), stateMachine: sm });
  const ws = manager.createWorkspace({ id: 'isolated', name: 'Worker execution' });
  assert.throws(() => manager.createWorkspace({ id: '..\\escape', name: 'bad' }), /safe path/);
  const parent = sm.createTask({ goal: 'parent' });
  sm.enqueueTask(parent.id); sm.startTask(parent.id);
  const child = sm.delegateTask({ parentTaskId: parent.id, goal: 'Run process' }).childTask;
  const outcome = await manager.executeWorkerTask({ taskId: child.id, workspaceId: ws.id, stateSnapshot: { currentStep: 4 }, artifacts: [{ path: 'output.txt' }], execution: processJob("require('node:fs').writeFileSync('output.txt', 'real-output'); console.log(JSON.stringify({cwd:process.cwd(), value:42}))") });
  assert.equal(outcome.status, 'completed');
  assert.equal(outcome.result.exitCode, 0);
  assert.equal(JSON.parse(outcome.result.stdout).cwd, ws.rootDir);
  assert.equal(fs.readFileSync(path.join(ws.rootDir, 'output.txt'), 'utf8'), 'real-output');
  assert.equal(sm.getTask(child.id).result.exitCode, 0);
  assert.equal(sm.getTask(parent.id).status, 'RUNNING');
  assert.equal(sm.getLatestCheckpoint(child.id).stateSnapshot.stateSnapshot.currentStep, 4);
  await manager.close();
  manager = new WorkspaceManager({ dbPath, baseStorageDir: path.join(root, 'workspaces') });
  cleanup(t, () => manager.close());
  assert.deepEqual((await manager.waitForHandoff(outcome.handoffId)).result, outcome.result);
  const fresh = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { WorkspaceManager } from ${JSON.stringify(new URL('../packages/workspaces/index.mjs', import.meta.url).href)};
    const manager = new WorkspaceManager({dbPath:process.argv[1],baseStorageDir:process.argv[2]});
    console.log(JSON.stringify(manager.getTaskHandoffs(process.argv[3]))); await manager.close();
  `, dbPath, path.join(root, 'workspaces'), child.id], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
  assert.equal(fresh.status, 0, fresh.stderr);
  assert.equal(JSON.parse(fresh.stdout)[0].status, 'completed');
  assert.equal(JSON.parse(JSON.parse(fresh.stdout)[0].result.stdout).value, 42);
});

test('process failures, cancellation, duplicates and manager shutdown produce durable states', { timeout: 10000 }, async (t) => {
  const root = temporary(t);
  const manager = new WorkspaceManager({ dbPath: path.join(root, 'workers.sqlite'), baseStorageDir: path.join(root, 'workspaces') });
  cleanup(t, () => manager.close());
  const ws = manager.createWorkspace({ name: 'Process failures' });
  const failure = await manager.executeWorkerTask({ taskId: 'failure', workspaceId: ws.id, execution: processJob("console.error('actual failure'); process.exit(7)") });
  assert.equal(failure.status, 'failed');
  assert.equal(failure.result.exitCode, 7);
  assert.match(failure.result.stderr, /actual failure/);
  const ready = path.join(ws.rootDir, 'ready.txt');
  const handoff = manager.handoffTask({ taskId: 'cancel', fromWorkerId: 'worker_local_primary', toWorkerId: 'worker_local_primary', workspaceId: ws.id,
    execution: processJob("require('node:fs').writeFileSync('ready.txt', String(process.pid)); setTimeout(()=>require('node:fs').writeFileSync('late.txt','bad'),2000); setInterval(()=>{},1000)") });
  for (let i = 0; i < 150 && !fs.existsSync(ready); i++) await delay(10);
  assert.equal(fs.existsSync(ready), true);
  const pid = Number(fs.readFileSync(ready, 'utf8'));
  assert.throws(() => manager.handoffTask({ taskId: 'cancel', fromWorkerId: 'worker_local_primary', toWorkerId: 'worker_local_primary', execution: processJob('') }), /active worker/);
  const cancelled = await manager.cancelHandoff(handoff.handoffId, 'test stop');
  assert.equal(cancelled.status, 'cancelled');
  assert.throws(() => process.kill(pid, 0), /ESRCH/);
  assert.equal(fs.existsSync(path.join(ws.rootDir, 'late.txt')), false);
  const pending = manager.executeWorkerTask({ taskId: 'shutdown', workspaceId: ws.id, execution: processJob('setInterval(()=>{},1000)') });
  await delay(30);
  await manager.close();
  assert.equal((await pending).status, 'cancelled');
});

test('external registration never claims execution and adapter cancellation remains unconfirmed', async (t) => {
  const manager = new WorkspaceManager();
  cleanup(t, () => manager.close());
  const worker = manager.registerWorker({ id: 'remote', name: 'No transport', type: 'remote' });
  assert.equal(worker.status, 'blocked');
  assert.equal(worker.executionGate, 'BLOCKED');
  manager.recordHeartbeat(worker.id);
  assert.equal(manager.getWorker(worker.id).status, 'blocked');
  assert.equal(manager.recordHeartbeat('missing').ok, false);
  const handoff = manager.handoffTask({ taskId: 'external', fromWorkerId: 'worker_local_primary', toWorkerId: worker.id, stateSnapshot: { currentStep: 4 } });
  assert.equal(handoff.ok, false);
  assert.equal(handoff.status, 'blocked');
  assert.equal((await manager.waitForHandoff(handoff.handoffId)).result, null);
  const local = manager.handoffTask({ taskId: 'no-job', fromWorkerId: 'worker_local_primary', toWorkerId: 'worker_local_primary' });
  assert.equal(local.status, 'awaiting_execution');
  manager.setWorkerExecutor(worker.id, () => new Promise(() => {}));
  manager.resumeHandoff(handoff.handoffId, { execution: { type: 'external-adapter-job' } });
  await delay(5);
  const cancelled = await manager.cancelHandoff(handoff.handoffId);
  assert.equal(cancelled.status, 'interrupted');
  assert.match(cancelled.error, /termination is unconfirmed/);
});

test('fresh process restart preserves interrupted evidence and requires explicit re-execution', { timeout: 10000 }, async (t) => {
  const root = temporary(t);
  const dbPath = path.join(root, 'workers.sqlite');
  const baseStorageDir = path.join(root, 'workspaces');
  const fixture = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { WorkspaceManager } from ${JSON.stringify(new URL('../packages/workspaces/index.mjs', import.meta.url).href)};
    import { spawnSync } from 'node:child_process';
    const manager = new WorkspaceManager({dbPath:process.argv[1],baseStorageDir:process.argv[2]});
    const ws = manager.createWorkspace({id:'restart',name:'restart'});
    manager.setWorkerExecutor('worker_local_primary', () => {
      const child = spawnSync(process.execPath,['-e',"require('node:fs').writeFileSync('evidence.txt','executed-before-crash')"],{cwd:ws.rootDir,windowsHide:true});
      process.exit(child.status);
    });
    await manager.executeWorkerTask({taskId:'crashed',workspaceId:ws.id,execution:{type:'fixture'}});
  `, dbPath, baseStorageDir], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
  assert.equal(fixture.status, 0, fixture.stderr);
  const manager = new WorkspaceManager({ dbPath, baseStorageDir });
  cleanup(t, () => manager.close());
  const interrupted = manager.getTaskHandoffs('crashed')[0];
  assert.equal(interrupted.status, 'interrupted');
  assert.equal(interrupted.result, null);
  assert.equal(fs.readFileSync(path.join(baseStorageDir, 'restart', 'evidence.txt'), 'utf8'), 'executed-before-crash');
  manager.resumeHandoff(interrupted.handoffId, { execution: processJob("console.log('explicitly resumed')") });
  assert.equal((await manager.waitForHandoff(interrupted.handoffId)).status, 'completed');
});

test('team can await parallel local process workers without double-completing child tasks', { timeout: 10000 }, async (t) => {
  const root = temporary(t);
  const sm = new TaskStateMachine({ dbPath: path.join(root, 'tasks.sqlite') });
  cleanup(t, () => sm.close());
  const manager = new WorkspaceManager({ dbPath: path.join(root, 'workers.sqlite'), baseStorageDir: path.join(root, 'workspaces'), stateMachine: sm });
  cleanup(t, () => manager.close());
  const ws = manager.createWorkspace({ name: 'Parallel worker barrier' });
  const team = new AgentTeamOrchestrator({ stateMachine: sm });
  const execute = (name, other) => (_, context) => manager.executeWorkerTask({ taskId: context.childTaskId, workspaceId: ws.id,
    execution: processJob(`const fs=require('node:fs'); fs.writeFileSync('${name}.ready','ready'); const timer=setInterval(()=>{if(fs.existsSync('${other}.ready')){clearInterval(timer); console.log('${name} overlapped')}},10)`),
  });
  const result = await team.executeTeamWorkflow({ goal: 'Overlap real processes', timeoutMs: 3000, subtasks: [subtask('a'), subtask('b', 'researcher'), subtask('review', 'reviewer', ['a', 'b'])], taskExecutors: {
    a: execute('a', 'b'), b: execute('b', 'a'),
    review: (_, context) => {
      assert.match(context.subtaskResults.a.result.stdout, /a overlapped/);
      assert.match(context.subtaskResults.b.result.stdout, /b overlapped/);
      return { output: 'Both actual process results consumed' };
    },
  } });
  assert.equal(result.status, 'COMPLETED');
  assert.equal(sm.getChildTasks(result.masterTaskId).length, 3);
  assert.equal(sm.getTaskSteps(result.masterTaskId).filter((step) => step.status === 'completed').length, 3);
  assert.equal(new AgentMessageBus({ db: sm.db }).getMessageHistory(result.masterTaskId).at(-1).type, 'TASK_COMPLETED');
});

test('a queued adapter or handoff registration cannot complete a task', async (t) => {
  const sm = new TaskStateMachine();
  cleanup(t, () => sm.close());
  const team = new AgentTeamOrchestrator({ stateMachine: sm });
  const result = await team.executeTeamWorkflow({ goal: 'Registration is not execution', subtasks: [subtask('a')], taskExecutors: { a: () => ({ ok: true, status: 'queued' }) } });
  assert.equal(result.status, 'FAILED');
  const manager = new WorkspaceManager();
  cleanup(t, () => manager.close());
  manager.registerWorker({ id: 'adapter', name: 'Fixture adapter' });
  manager.setWorkerExecutor('adapter', () => ({ ok: true, status: 'registered' }));
  const worker = await manager.executeWorkerTask({ taskId: 'not-completed', toWorkerId: 'adapter', execution: { type: 'fixture' } });
  assert.equal(worker.status, 'failed');
  assert.equal(manager.getTaskHandoffs('not-completed')[0].status, 'failed');
});

test('tool exceptions, unassigned calls, empty output and synthesis failure persist as failures', async (t) => {
  const sm = new TaskStateMachine();
  cleanup(t, () => sm.close());
  for (const mode of ['throws', 'unassigned', 'empty', 'synthesis']) {
    let calls = 0;
    let executed = 0;
    const fabric = {
      resolveAgentModel: (agentId) => ({ canonicalModelId: agentId }),
      executeChat: async (payload) => {
        calls++;
        if (mode === 'synthesis' && payload.model === 'zero') throw new Error('Coordinator unavailable');
        const message = mode === 'empty' ? { content: '' } : mode === 'synthesis' ? { content: 'Actual inference output' }
          : { content: null, tool_calls: [{ id: 'call', type: 'function', function: { name: mode === 'unassigned' ? 'not_allowed' : 'probe', arguments: '{}' } }] };
        return { data: { choices: [{ message }] } };
      },
    };
    const engine = { customCapabilities: new Map([['probe', { name: 'probe' }]]), execute: async () => { executed++; throw new Error('Actual tool exception'); } };
    const team = new AgentTeamOrchestrator({ stateMachine: sm, modelFabric: fabric, capabilityEngine: engine });
    const result = await team.executeTeamWorkflow({ goal: mode, subtasks: [{ ...subtask(mode), tools: ['probe'] }] });
    assert.equal(result.status, 'FAILED', mode);
    if (mode === 'throws') {
      const steps = sm.getTaskSteps(sm.getChildTasks(result.masterTaskId)[0].id);
      assert.equal(steps.at(-1).status, 'failed');
      assert.match(steps.at(-1).toolResult.error, /Actual tool exception/);
      assert.equal(executed, 1);
    }
    if (mode === 'unassigned') assert.equal(executed, 0);
    if (mode === 'synthesis') {
      assert.equal(calls, 2);
      assert.match(result.consolidatedResult.consolidationError, /Coordinator unavailable/);
      assert.equal(sm.getLatestCheckpoint(result.masterTaskId).stateSnapshot.consolidatedResult.consolidationError, 'Coordinator unavailable');
    }
  }
});

test('deadline cancels a real in-flight ModelFabric HTTP request', { timeout: 5000 }, async (t) => {
  const root = temporary(t);
  let requestCount = 0;
  let closed;
  const disconnected = new Promise((resolve) => { closed = resolve; });
  const server = http.createServer(async (req, res) => {
    for await (const chunk of req) void chunk;
    requestCount++;
    res.on('close', closed);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  cleanup(t, () => { server.closeAllConnections(); server.close(); });
  const sm = new TaskStateMachine();
  cleanup(t, () => sm.close());
  const fabric = new ModelFabric({ agentBindingsPath: path.join(root, 'absent.json'), aliases: { 'zero-lead': 'fixture/hang' },
    providers: [{ id: 'fixture', baseUrl: `http://127.0.0.1:${server.address().port}`, apiKey: 'local-test-only', models: ['fixture/hang'] }] });
  const team = new AgentTeamOrchestrator({ stateMachine: sm, modelFabric: fabric });
  const outcome = await team.executeTeamWorkflow({ goal: 'Cancel in-flight HTTP', timeoutMs: 100, subtasks: [subtask('a')] });
  assert.equal(outcome.status, 'CANCELLED');
  assert.equal(requestCount, 1);
  assert.equal(await Promise.race([disconnected.then(() => true), delay(500).then(() => false)]), true);
  assert.equal(fabric.upstreamRequestCount, 1, 'aborted HTTP request must not retry');
});

test('restart reconciliation applies recorded worker evidence to child and parent exactly once', { timeout: 10000 }, async (t) => {
  const root = temporary(t);
  const dbPath = path.join(root, 'workers.sqlite');
  const tasksPath = path.join(root, 'tasks.sqlite');
  let sm = new TaskStateMachine({ dbPath: tasksPath });
  const parent = sm.createTask({ goal: 'Reconcile parent' });
  sm.enqueueTask(parent.id); sm.startTask(parent.id);
  const child = sm.delegateTask({ parentTaskId: parent.id, goal: 'Persist before task settlement' }).childTask;
  let manager = new WorkspaceManager({ dbPath, baseStorageDir: path.join(root, 'workspaces') });
  const ws = manager.createWorkspace({ name: 'Evidence gap' });
  const completed = await manager.executeWorkerTask({ taskId: child.id, workspaceId: ws.id, execution: processJob("console.log('durable evidence')") });
  // No task bridge here simulates the exact gap after worker DB persistence.
  assert.equal(sm.getTask(child.id).status, 'RUNNING');
  await manager.close(); sm.close();
  sm = new TaskStateMachine({ dbPath: tasksPath });
  cleanup(t, () => sm.close());
  manager = new WorkspaceManager({ dbPath, baseStorageDir: path.join(root, 'workspaces'), stateMachine: sm });
  cleanup(t, () => manager.close());
  assert.equal(sm.getTask(child.id).status, 'COMPLETED');
  assert.equal(sm.getTask(parent.id).status, 'RUNNING');
  assert.deepEqual(sm.getTask(child.id).result, completed.result);
  manager.reconcileTaskState();
  assert.equal(sm.getTaskSteps(child.id).filter((step) => step.toolName === 'worker_execution').length, 1);
  assert.equal(sm.getTaskSteps(parent.id).filter((step) => step.status === 'completed').length, 1);
});

test('legacy completion-only handoffs migrate to unverified without execution evidence', async (t) => {
  const root = temporary(t);
  const dbPath = path.join(root, 'workers.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE zero_task_handoffs (id TEXT PRIMARY KEY, task_id TEXT NOT NULL, from_worker_id TEXT NOT NULL, to_worker_id TEXT NOT NULL, state_snapshot_json TEXT NOT NULL, artifacts_json TEXT, status TEXT NOT NULL DEFAULT 'completed', created_at INTEGER NOT NULL);
    INSERT INTO zero_task_handoffs VALUES ('legacy','legacy-task','worker_local_primary','worker_local_primary','{}','[]','completed',1);`);
  db.close();
  const manager = new WorkspaceManager({ dbPath, baseStorageDir: path.join(root, 'workspaces') });
  cleanup(t, () => manager.close());
  assert.equal(manager.getHandoff('legacy').status, 'legacy_unverified');
  assert.equal((await manager.waitForHandoff('legacy')).ok, false);
});
