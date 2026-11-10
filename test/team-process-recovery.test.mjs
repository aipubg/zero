import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { TaskStateMachine, AgentTeamOrchestrator } from '../packages/agent-runtime/index.mjs';

test('[INTEGRATION] killed team process resumes same durable children without replaying completed effects', { timeout: 15000 }, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-team-recovery-'));
  const dbPath = path.join(root, 'tasks.sqlite'); const effect = path.join(root, 'completed-effect.txt');
  const moduleUrl = pathToFileURL(path.resolve('packages/agent-runtime/index.mjs')).href;
  const script = path.join(root, 'writer.mjs');
  fs.writeFileSync(script, `import fs from 'node:fs';import {TaskStateMachine,AgentTeamOrchestrator} from ${JSON.stringify(moduleUrl)};
const sm=new TaskStateMachine({dbPath:${JSON.stringify(dbPath)}});const team=new AgentTeamOrchestrator({stateMachine:sm});
await team.executeTeamWorkflow({goal:'Recover actual two-child process',timeoutMs:120000,subtasks:[{id:'a',agentId:'coder',goal:'Create once',tools:[],dependsOn:[]},{id:'b',agentId:'researcher',goal:'Finish later',tools:[],dependsOn:[]}],taskExecutors:{a:async()=>{fs.writeFileSync(${JSON.stringify(effect)},'ONCE',{flag:'wx'});return {status:'success',output:'ONCE'}},b:()=>new Promise(()=>{})}});`);
  const child = spawn(process.execPath, [script], { windowsHide: true, stdio: 'ignore' });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const closed = once(child, 'close'); child.kill(); await closed;
    }
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-team-recovery-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  let sm; let master; const deadline = Date.now() + 7000;
  while (Date.now() < deadline) {
    if (fs.existsSync(dbPath) && fs.existsSync(effect)) {
      sm = new TaskStateMachine({ dbPath });
      const rows = sm.db.prepare('select id from zero_tasks where parent_task_id is null').all();
      master = rows[0]?.id;
      const state = master && sm.getLatestCheckpoint(master)?.stateSnapshot;
      if (state?.childTaskIds.a && state?.childTaskIds.b && sm.getTask(state.childTaskIds.a)?.status === 'COMPLETED') { sm.close(); sm = null; break; }
      sm.close(); sm = null;
    }
    await delay(25);
  }
  assert.ok(master); const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited;
  sm = new TaskStateMachine({ dbPath });
  try {
    sm.recoverTasksOnStartup();
    const before = sm.getChildTasks(master); assert.equal(before.length, 2);
    assert.equal(sm.getTask(master).status, 'WAITING');
    const team = new AgentTeamOrchestrator({ stateMachine: sm });
    let replayed = 0;
    const result = await team.resumeTeamWorkflow(master, { taskExecutors: { a: () => { replayed++; throw new Error('Completed side effect replayed'); }, b: async () => {
      fs.writeFileSync(path.join(root, 'resumed-effect.txt'), 'RESUMED', { flag: 'wx' }); return { status: 'success', output: 'RESUMED' };
    } } });
    assert.equal(result.status, 'COMPLETED'); assert.equal(result.masterTaskId, master); assert.equal(replayed, 0);
    assert.deepEqual(sm.getChildTasks(master).map(x => x.id).sort(), before.map(x => x.id).sort());
    assert.ok(sm.getChildTasks(master).every(x => x.status === 'COMPLETED'));
    assert.equal(fs.readFileSync(effect, 'utf8'), 'ONCE'); assert.equal(fs.readFileSync(path.join(root, 'resumed-effect.txt'), 'utf8'), 'RESUMED');
    await assert.rejects(team.resumeTeamWorkflow(master), /WAITING/);
  } finally { sm.close(); }
});
