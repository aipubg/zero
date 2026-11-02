/**
 * @fileoverview Zero Workspaces, Cloud Workers & Project Context Engine
 *
 * Implements:
 * 1. Isolated agent workspaces (independent scratchpad directories & environments)
 * 2. Multi-project context models & organizational boundaries
 * 3. Worker Pool: local, remote, and cloud execution workers with health heartbeats
 * 4. Distributed task handoff contracts with state snapshots and artifact syncing
 * 5. Configurable approval boundaries for sensitive transactions
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';
import { executeProcess } from './process-worker.mjs';
import { abortable, requireExecutionResult } from '../agent-runtime/inference.mjs';

export const WORKER_TYPES = Object.freeze({
  LOCAL: 'local',
  REMOTE: 'remote',
  CLOUD: 'cloud',
});

export const WORKSPACE_TYPES = Object.freeze({
  LOCAL: 'local',
  ISOLATED: 'isolated',
  EPHEMERAL: 'ephemeral',
});

export class WorkspaceManager extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath=':memory:']
   * @param {string} [options.baseStorageDir]
   */
  constructor(options = {}) {
    super();
    this.dbPath = options.dbPath || ':memory:';
    this.baseStorageDir = options.baseStorageDir || path.resolve(process.cwd(), 'workspaces');
    this.db = new DatabaseSync(this.dbPath);
    this.stateMachine = options.stateMachine || null;
    this._executors = new Map([['worker_local_primary', executeProcess]]);
    this._runs = new Map();
    this._controllers = new Map();
    this._closed = false;
    this._initSchema();
    // No claim of resumption: an interrupted command may have produced side effects.
    this.db.prepare("UPDATE zero_task_handoffs SET status = 'interrupted', error = 'Host restarted during execution' WHERE status = 'running'").run();
    this.db.prepare("UPDATE zero_task_handoffs SET status = 'legacy_unverified', error = 'Legacy handoff has no execution evidence' WHERE status = 'completed' AND result_json IS NULL").run();
    this.db.prepare("UPDATE zero_workers SET status = CASE WHEN type = 'local' THEN 'registered' ELSE 'blocked' END").run();
    this._registerDefaultWorkers();
    this.reconcileTaskState();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        project_id TEXT NOT NULL DEFAULT 'default',
        type TEXT NOT NULL DEFAULT 'isolated',
        root_dir TEXT NOT NULL,
        assigned_agent_id TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS zero_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        members_json TEXT,
        approval_rules_json TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS zero_workers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        capabilities_json TEXT,
        status TEXT NOT NULL DEFAULT 'online',
        last_heartbeat INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS zero_task_handoffs (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        from_worker_id TEXT NOT NULL,
        to_worker_id TEXT NOT NULL,
        state_snapshot_json TEXT NOT NULL,
        artifacts_json TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at INTEGER NOT NULL
      );
    `);
    const columns = new Set(this.db.prepare('PRAGMA table_info(zero_task_handoffs)').all().map((row) => row.name));
    for (const column of ['execution_json TEXT', 'workspace_id TEXT', 'result_json TEXT', 'error TEXT', 'updated_at INTEGER']) {
      if (!columns.has(column.split(' ')[0])) this.db.exec(`ALTER TABLE zero_task_handoffs ADD COLUMN ${column}`);
    }
    this.db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_worker_active_task ON zero_task_handoffs(task_id) WHERE status IN ('queued', 'running')");
  }

  _registerDefaultWorkers() {
    if (this.getWorker('worker_local_primary')) {
      // Restore runtime liveness without overwriting the owner's saved definition.
      this.db.prepare("UPDATE zero_workers SET status = 'online', last_heartbeat = ? WHERE id = 'worker_local_primary'").run(Date.now());
      return;
    }
    this.registerWorker({
      id: 'worker_local_primary',
      name: 'Primary Local Windows Host',
      type: WORKER_TYPES.LOCAL,
      capabilities: ['local_process', 'native_fs'],
    });
  }

  // --- Workspaces ---

  createWorkspace({ id, name, projectId = 'default', type = WORKSPACE_TYPES.ISOLATED, assignedAgentId = null }) {
    if (!name) throw new Error('Workspace requires name');
    const wsId = id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (!/^[a-zA-Z0-9_-]+$/.test(wsId)) throw new Error('Workspace id must be a single safe path segment');
    const rootDir = path.join(this.baseStorageDir, wsId);

    fs.mkdirSync(this.baseStorageDir, { recursive: true });
    fs.mkdirSync(rootDir, { recursive: true });
    if (fs.lstatSync(rootDir).isSymbolicLink()) throw new Error('Workspace root cannot be a symbolic link');

    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO zero_workspaces (id, name, project_id, type, root_dir, assigned_agent_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(wsId, name, projectId, type, rootDir, assignedAgentId, now);

    return this.getWorkspace(wsId);
  }

  getWorkspace(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_workspaces WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      projectId: row.project_id,
      type: row.type,
      rootDir: row.root_dir,
      assignedAgentId: row.assigned_agent_id,
      createdAt: row.created_at,
    };
  }

  listWorkspaces(filter = {}) {
    let sql = `SELECT * FROM zero_workspaces WHERE 1=1`;
    const params = [];
    if (filter.projectId) {
      sql += ` AND project_id = ?`;
      params.push(filter.projectId);
    }
    sql += ` ORDER BY created_at DESC`;
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      projectId: r.project_id,
      type: r.type,
      rootDir: r.root_dir,
      assignedAgentId: r.assigned_agent_id,
      createdAt: r.created_at,
    }));
  }

  // --- Projects ---

  createProject({ id, name, description = '', members = ['zero'], approvalRules = {} }) {
    if (!name) throw new Error('Project requires name');
    const projId = id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO zero_projects (id, name, description, members_json, approval_rules_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        members_json = excluded.members_json,
        approval_rules_json = excluded.approval_rules_json
    `);
    stmt.run(
      projId,
      name,
      description,
      JSON.stringify(members),
      JSON.stringify(approvalRules),
      now
    );

    return this.getProject(projId);
  }

  getProject(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_projects WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      members: JSON.parse(row.members_json || '[]'),
      approvalRules: JSON.parse(row.approval_rules_json || '{}'),
      createdAt: row.created_at,
    };
  }

  listProjects() {
    const stmt = this.db.prepare(`SELECT * FROM zero_projects ORDER BY created_at DESC`);
    const rows = stmt.all();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      members: JSON.parse(r.members_json || '[]'),
      approvalRules: JSON.parse(r.approval_rules_json || '{}'),
      createdAt: r.created_at,
    }));
  }

  // --- Worker Pool & Cloud Execution ---

  registerWorker({ id, name, type = WORKER_TYPES.LOCAL, capabilities = [] }) {
    if (!id || !name) throw new Error('Worker requires id and name');
    if (!Object.values(WORKER_TYPES).includes(type)) throw new Error('Unsupported worker type');
    const existing = this.getWorker(id);
    if (existing && existing.type !== type) throw new Error('Cannot change a registered worker type');
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO zero_workers (id, name, type, capabilities_json, status, last_heartbeat, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        capabilities_json = excluded.capabilities_json,
        status = excluded.status,
        last_heartbeat = excluded.last_heartbeat
    `);
    stmt.run(id, name, type, JSON.stringify(capabilities), this._executors.has(id) ? 'online' : type === WORKER_TYPES.LOCAL ? 'registered' : 'blocked', now, now);

    return this.getWorker(id);
  }

  getWorker(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_workers WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      capabilities: JSON.parse(row.capabilities_json || '[]'),
      status: row.status,
      executionGate: this._executors.has(row.id) ? 'READY' : 'BLOCKED',
      lastHeartbeat: row.last_heartbeat,
      createdAt: row.created_at,
    };
  }

  listWorkers(filter = {}) {
    let sql = `SELECT * FROM zero_workers WHERE 1=1`;
    const params = [];
    if (filter.status) {
      sql += ` AND status = ?`;
      params.push(filter.status);
    }
    sql += ` ORDER BY created_at DESC`;
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      capabilities: JSON.parse(r.capabilities_json || '[]'),
      status: r.status,
      executionGate: this._executors.has(r.id) ? 'READY' : 'BLOCKED',
      lastHeartbeat: r.last_heartbeat,
      createdAt: r.created_at,
    }));
  }

  recordHeartbeat(workerId) {
    if (!this.getWorker(workerId)) return { ok: false, workerId, error: 'Worker not registered' };
    const now = Date.now();
    const stmt = this.db.prepare(`UPDATE zero_workers SET last_heartbeat = ? WHERE id = ?`);
    stmt.run(now, workerId);
    return { ok: true, workerId, lastHeartbeat: now };
  }

  /**
   * Distributed task handoff contract across workers
   */
  handoffTask({ taskId, fromWorkerId, toWorkerId, stateSnapshot = {}, artifacts = [], execution = null, workspaceId = null }) {
    if (this._closed) throw new Error('Workspace manager is closed');
    if (!taskId || !fromWorkerId || !toWorkerId) {
      throw new Error('Handoff requires taskId, fromWorkerId, and toWorkerId');
    }

    const targetWorker = this.getWorker(toWorkerId);
    if (!targetWorker) throw new Error(`Target worker '${toWorkerId}' is not registered`);
    if (!this.getWorker(fromWorkerId)) throw new Error(`Source worker '${fromWorkerId}' is not registered`);
    if (this.db.prepare("SELECT id FROM zero_task_handoffs WHERE task_id = ? AND status IN ('queued', 'running')").get(taskId)) throw new Error('Task already has an active worker execution');
    if (this.stateMachine && !this.stateMachine.getTask(taskId)) throw new Error(`Task '${taskId}' not found`);
    execution ||= stateSnapshot.execution || null;
    workspaceId ||= stateSnapshot.workspaceId || null;
    if (workspaceId && !this.getWorkspace(workspaceId)) throw new Error('Workspace not found');
    const executable = this._executors.has(toWorkerId);
    const status = !executable ? 'blocked' : execution ? 'queued' : 'awaiting_execution';
    const error = !executable ? 'No execution adapter is attached to this worker' : null;

    const handoffId = `handoff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO zero_task_handoffs (id, task_id, from_worker_id, to_worker_id, state_snapshot_json, artifacts_json, status, created_at, execution_json, workspace_id, error, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      handoffId,
      taskId,
      fromWorkerId,
      toWorkerId,
      JSON.stringify(stateSnapshot),
      JSON.stringify(artifacts),
      status, now, execution ? JSON.stringify(execution) : null, workspaceId, error, now
    );

    const payload = {
      handoffId,
      taskId,
      fromWorkerId,
      toWorkerId,
      stateSnapshot,
      artifacts,
      timestamp: now,
      status,
      error,
      workspaceId,
    };
    this.emit('task:handoff', payload);
    if (status === 'queued') this._scheduleHandoff(handoffId);
    return { ok: status !== 'blocked', ...payload };
  }

  getTaskHandoffs(taskId) {
    const stmt = this.db.prepare(`SELECT * FROM zero_task_handoffs WHERE task_id = ? ORDER BY created_at ASC`);
    const rows = stmt.all(taskId);
    return rows.map((r) => ({
      handoffId: r.id,
      taskId: r.task_id,
      fromWorkerId: r.from_worker_id,
      toWorkerId: r.to_worker_id,
      stateSnapshot: JSON.parse(r.state_snapshot_json),
      artifacts: JSON.parse(r.artifacts_json || '[]'),
      status: r.status,
      workspaceId: r.workspace_id,
      execution: r.execution_json ? JSON.parse(r.execution_json) : null,
      result: r.result_json ? JSON.parse(r.result_json) : null,
      error: r.error,
      updatedAt: r.updated_at,
      timestamp: r.created_at,
    }));
  }

  setWorkerExecutor(workerId, executor) {
    if (this._closed) throw new Error('Workspace manager is closed');
    if (!this.getWorker(workerId)) throw new Error('Worker not registered');
    if (typeof executor !== 'function') throw new Error('Worker executor must be a function');
    this._executors.set(workerId, executor);
    this.db.prepare("UPDATE zero_workers SET status = 'online' WHERE id = ?").run(workerId);
  }

  getHandoff(handoffId) {
    const row = this.db.prepare('SELECT task_id FROM zero_task_handoffs WHERE id = ?').get(handoffId);
    return row ? this.getTaskHandoffs(row.task_id).find((item) => item.handoffId === handoffId) : null;
  }

  _scheduleHandoff(handoffId) {
    const promise = Promise.resolve().then(() => this._executeHandoff(handoffId));
    this._runs.set(handoffId, promise);
    promise.finally(() => this._runs.delete(handoffId)).catch(() => {});
  }

  async executeWorkerTask(params) {
    const handoff = this.handoffTask({ fromWorkerId: 'worker_local_primary', toWorkerId: 'worker_local_primary', ...params });
    return this.waitForHandoff(handoff.handoffId);
  }

  async waitForHandoff(handoffId) {
    if (this._runs.has(handoffId)) return this._runs.get(handoffId);
    const handoff = this.getHandoff(handoffId);
    if (!handoff) throw new Error('Handoff not found');
    return { ok: handoff.status === 'completed', ...handoff };
  }

  resumeHandoff(handoffId, { execution, workspaceId } = {}) {
    if (this._closed) throw new Error('Workspace manager is closed');
    const handoff = this.getHandoff(handoffId);
    if (!handoff || !['queued', 'interrupted', 'awaiting_execution', 'unsupported', 'blocked'].includes(handoff.status) || this._runs.has(handoffId)) throw new Error('Handoff cannot be resumed');
    if (!this._executors.has(handoff.toWorkerId)) throw new Error('No worker execution adapter attached');
    if (this.db.prepare("SELECT id FROM zero_task_handoffs WHERE task_id = ? AND id != ? AND status IN ('queued', 'running')").get(handoff.taskId, handoffId)) throw new Error('Task already has an active worker execution');
    const job = execution || handoff.execution;
    if (!job) throw new Error('Handoff requires an execution specification');
    const wsId = workspaceId || handoff.workspaceId;
    if (wsId && !this.getWorkspace(wsId)) throw new Error('Workspace not found');
    this.db.prepare("UPDATE zero_task_handoffs SET status = 'queued', execution_json = ?, workspace_id = ?, error = NULL, result_json = NULL, updated_at = ? WHERE id = ?")
      .run(JSON.stringify(job), wsId, Date.now(), handoffId);
    this._scheduleHandoff(handoffId);
    return this.getHandoff(handoffId);
  }

  async cancelHandoff(handoffId, reason = 'Worker execution cancelled') {
    const controller = this._controllers.get(handoffId);
    if (controller) controller.abort(new Error(reason));
    else {
      const handoff = this.getHandoff(handoffId);
      if (!handoff || ['completed', 'failed', 'cancelled'].includes(handoff.status)) throw new Error('Handoff cannot be cancelled');
      this.db.prepare("UPDATE zero_task_handoffs SET status = 'cancelled', error = ?, updated_at = ? WHERE id = ?").run(reason, Date.now(), handoffId);
      const task = this.stateMachine?.getTask(handoff.taskId);
      if (task && !task.completedAt) this.stateMachine.cancelTask(task.id, reason);
    }
    return this.waitForHandoff(handoffId);
  }

  async _executeHandoff(handoffId) {
    const handoff = this.getHandoff(handoffId);
    if (handoff.status !== 'queued') return { ok: false, ...handoff };
    const controller = new AbortController();
    if (this._closed) controller.abort(new Error('Workspace manager closed'));
    this._controllers.set(handoffId, controller);
    const sm = this.stateMachine;
    if (sm?.getTask(handoff.taskId)?.status === 'CANCELLED') controller.abort(new Error('Task was cancelled before worker execution'));
    const taskSignal = sm?.getSignal(handoff.taskId);
    const signal = AbortSignal.any([controller.signal, ...(taskSignal ? [taskSignal] : [])]);
    const timer = setTimeout(() => controller.abort(new Error('Worker execution timed out')), handoff.execution?.timeoutMs || 60000);
    let result = null;
    let error = null;
    let status = 'completed';
    const executor = this._executors.get(handoff.toWorkerId);
    this.db.prepare("UPDATE zero_task_handoffs SET status = 'running', updated_at = ? WHERE id = ?").run(Date.now(), handoffId);
    try {
      if (sm) {
        const task = sm.getTask(handoff.taskId);
        if (task.completedAt) throw new Error('Cannot execute a terminal task');
        if (task.status === 'PENDING') sm.enqueueTask(task.id);
        if (['PENDING', 'QUEUED'].includes(task.status)) sm.startTask(task.id);
        if (task.status === 'WAITING') sm.resumeTask(task.id);
        sm.saveCheckpoint(task.id, sm.listCheckpoints(task.id).length, { handoffId, workerId: handoff.toWorkerId, stateSnapshot: handoff.stateSnapshot }, handoff.artifacts);
      }
      signal.throwIfAborted();
      const run = () => executor({ ...handoff, workspace: handoff.workspaceId ? this.getWorkspace(handoff.workspaceId) : null, signal });
      result = executor === executeProcess ? await run() : await abortable(run, signal);
      signal.throwIfAborted();
      requireExecutionResult(result);
    } catch (err) {
      result = err.result || null;
      error = err.message;
      status = signal.aborted ? executor === executeProcess ? 'cancelled' : 'interrupted' : 'failed';
      if (status === 'interrupted') error += '; external adapter termination is unconfirmed';
    } finally {
      clearTimeout(timer);
      this._controllers.delete(handoffId);
    }
    this.db.prepare('UPDATE zero_task_handoffs SET status = ?, result_json = ?, error = ?, updated_at = ? WHERE id = ?')
      .run(status, JSON.stringify(result), error, Date.now(), handoffId);
    this._applyTaskOutcome(this.getHandoff(handoffId));
    const outcome = { ok: status === 'completed', ...this.getHandoff(handoffId) };
    this.emit('worker:result', outcome);
    return outcome;
  }

  // Repairs a crash between persisting a worker result and updating the separate task DB.
  reconcileTaskState() {
    if (!this.stateMachine) return;
    const rows = this.db.prepare(`SELECT id FROM zero_task_handoffs WHERE rowid IN
      (SELECT MAX(rowid) FROM zero_task_handoffs GROUP BY task_id)`).all();
    for (const row of rows) this._applyTaskOutcome(this.getHandoff(row.id));
  }

  _applyTaskOutcome(handoff) {
    const sm = this.stateMachine;
    const task = sm?.getTask(handoff.taskId);
    if (!task || task.completedAt || !['completed', 'failed', 'cancelled', 'interrupted'].includes(handoff.status)) return;
    if (handoff.status === 'interrupted') {
      if (task.status === 'RUNNING') sm.pauseTask(task.id, `RESTART_RECOVERY: ${handoff.error}`);
      return;
    }
    if (task.status === 'PENDING') sm.enqueueTask(task.id);
    if (['PENDING', 'QUEUED'].includes(task.status)) sm.startTask(task.id);
    if (task.status === 'WAITING' && handoff.status === 'completed') sm.resumeTask(task.id);
    if (!sm.getTaskSteps(task.id).some((step) => step.toolName === 'worker_execution' && step.toolArgs?.handoffId === handoff.handoffId)) {
      sm.recordStep(task.id, { stepNumber: sm.getTaskSteps(task.id).length + 1, toolName: 'worker_execution',
        toolArgs: { handoffId: handoff.handoffId, workerId: handoff.toWorkerId }, toolResult: { status: handoff.status, result: handoff.result, error: handoff.error }, status: handoff.status });
    }
    if (handoff.status === 'completed') {
      if (task.parentTaskId) sm.completeChildTask(task.id, handoff.result);
      else sm.completeTask(task.id, handoff.result);
    } else if (handoff.status === 'cancelled') sm.cancelTask(task.id, handoff.error);
    else if (task.parentTaskId) sm.failChildTask(task.id, handoff.error);
    else sm.failTask(task.id, handoff.error);
  }

  async close() {
    this._closed = true;
    for (const controller of this._controllers.values()) controller.abort(new Error('Workspace manager closed'));
    await Promise.allSettled([...this._runs.values()]);
    this.removeAllListeners();
    try {
      this.db.close();
    } catch (_) {}
  }
}
