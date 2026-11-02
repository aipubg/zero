# Local workers and durable agent execution

The supported worker path launches a real child process in an existing workspace.
Remote/cloud/mobile execution gates are **BLOCKED**: no device transport is provided.
Registration, declared capabilities, heartbeats, and handoff acceptance are metadata,
not proof of execution or completion. The default worker advertises `local_process`
and `native_fs` only.

## Host wiring

```js
const workspaceManager = new WorkspaceManager({
  dbPath: workspaceDbPath,
  baseStorageDir,
  stateMachine: tasks,
});
// Shutdown in this order; active worker results still need the task database.
await workspaceManager.close();
tasks.close();
```

`stateMachine` is optional. With it, workers start pending tasks, save the input
snapshot as a checkpoint, record actual results, settle child tasks, resume parents
after all children succeed, and receive `tasks.cancel` signals. Construction
reconciles persisted worker outcomes with nonterminal tasks, including a crash
between writing the worker result and updating the separate task database.
Use a single owning manager per worker database.

The native host already forwards `workers.handoff` parameters and exposes
`workers.handoffs.list`. No host changes are included in this package change.

```js
const accepted = workspaceManager.handoffTask({
  taskId, // Must exist if stateMachine is connected.
  fromWorkerId: 'worker_local_primary',
  toWorkerId: 'worker_local_primary',
  workspaceId,
  stateSnapshot: { currentStep: 4 },
  artifacts: [{ path: 'output.txt' }], // Caller metadata; no implied verification.
  execution: {
    type: 'process',
    command: process.execPath, // Absolute executable; no implicit shell.
    args: ['-e', "require('node:fs').writeFileSync('output.txt','done'); console.log('done')"],
    timeoutMs: 60000,
  },
});
// accepted.status === 'queued', never 'completed'.
const finished = await workspaceManager.waitForHandoff(accepted.handoffId);
// finished: { ok, status, result: { pid, exitCode, exitSignal, stdout, stderr }, error, ... }
```

`executeWorkerTask(params)` combines acceptance and waiting. RPC callers can poll
`workers.handoffs.list` for the same durable outcome. Input `execution` and
`workspaceId` may also be supplied inside `stateSnapshot` for handoff callers.
No execution specification produces `awaiting_execution`. No adapter produces
`blocked` with `ok: false`; worker records expose `executionGate: 'BLOCKED'`.

`cancelHandoff(id)` waits for local subprocess termination. Local cancellation and
shutdown stop the process tree; nonzero exit, spawn failure, excessive output,
and deadline expiry do not register completion. Output is limited to 1 MiB.
Workspaces set the working directory and inherit the host environment; they are
not OS security sandboxes. No external artifact copy or verification is claimed.

## Restart behavior

Completed results remain readable after restart. Previously running handoffs
become `interrupted`; queued handoffs remain queued. Neither is automatically
replayed because a command may already have produced side effects. Explicitly
call `resumeHandoff(id, { execution?, workspaceId? })`, then `waitForHandoff(id)`.
Interrupted attached tasks wait with a recovery reason. Legacy handoffs marked
completed without a recorded result become `legacy_unverified`.

Worker adapter functions are attached in process through
`setWorkerExecutor(workerId, async ({ execution, stateSnapshot, artifacts,
workspace, signal }) => actualResult)`. They are not serialized and must be
reattached after restart. Cancellation of an external adapter yields
`interrupted` with termination unconfirmed. This hook is not evidence of an
available remote/cloud/mobile device.

## Team integration

`AgentTeamOrchestrator` preserves the host's injected model fabric, capability
engine, research engine, message bus, and lease manager. Independent DAG nodes
run concurrently; each specialist uses `resolveAgentModel(agentId)` (or the
subtask's explicit `modelId` / `model`), consumes its dependency results, and
executes bounded OpenAI tool-call rounds. Native capability tools, registered
custom capabilities, and injected research `web_search` / `read_file` are exposed
only when requested and available. Failed/unassigned tools fail the subtask.
Provider responses use the model fabric's `data.choices[0].message` contract.
The coordinator uses its assigned model to synthesize successful child results.

Inference completion records `executionKind: 'inference', verified: false`.
It does not certify software implementation, audits, or external actions.
No provider/executor, empty output, tool failure, cancellation, or merely queued
work can produce a fabricated successful completion.

Messages, model/tool steps, child results, plans, final consolidation, and
checkpoints are persisted in the task database. Parent cancellation cascades to
children; late results cannot complete cancelled tasks. `recoverTasksOnStartup()`
moves interrupted task execution to `WAITING` for explicit recovery, with no
automatic inference/tool replay. Child message payloads carry `parentTaskId`;
the parent message history includes the final consolidated result.

For a worker-backed specialist, use an executor that awaits the outcome:

```js
taskExecutors: {
  coder: async (subtask, context) => workspaceManager.executeWorkerTask({
    taskId: context.childTaskId,
    workspaceId,
    execution: processSpecification,
  }),
}
```

Only final `success` / `completed` executor statuses (or actual result values
without a status) are accepted. A returned handoff registration is insufficient.

## Isolated evidence

Run only the owned runtime tests and new integration tests:

```powershell
node --test packages/agent-runtime/test/*.test.mjs test/runtime-workers.integration.test.mjs
```

The integration suite uses OS temporary directories, temporary SQLite files,
an ephemeral loopback HTTP provider fixture through the real ModelFabric
transport, and isolated Node subprocesses. It does not use the owner's live
database, external API credentials, host server, or external devices. Loopback
inference proves transport/orchestration, not live provider quality or access.
