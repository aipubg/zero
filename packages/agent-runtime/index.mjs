/**
 * @fileoverview Zero Agent Runtime & Multi-Agent Durable Task State Machine
 * 
 * Implements a durable task lifecycle in SQLite:
 * PENDING -> QUEUED -> RUNNING -> WAITING -> COMPLETED / FAILED / CANCELLED
 * with step history, tool invocations, intermediate reasoning, and cancellation tokens.
 */

import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';

export const TASK_STATUS = Object.freeze({
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
});

const VALID_TRANSITIONS = {
  [TASK_STATUS.PENDING]: [TASK_STATUS.QUEUED, TASK_STATUS.CANCELLED],
  [TASK_STATUS.QUEUED]: [TASK_STATUS.RUNNING, TASK_STATUS.CANCELLED],
  [TASK_STATUS.RUNNING]: [TASK_STATUS.WAITING, TASK_STATUS.COMPLETED, TASK_STATUS.FAILED, TASK_STATUS.CANCELLED],
  [TASK_STATUS.WAITING]: [TASK_STATUS.RUNNING, TASK_STATUS.FAILED, TASK_STATUS.CANCELLED],
  [TASK_STATUS.COMPLETED]: [],
  [TASK_STATUS.FAILED]: [],
  [TASK_STATUS.CANCELLED]: [],
};

export class TaskStateMachine {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath] - SQLite file path or ':memory:'
   */
  constructor(options = {}) {
    this.dbPath = options.dbPath || ':memory:';
    this.events = new EventEmitter();
    this.db = new DatabaseSync(this.dbPath);
    this._abortControllers = new Map();
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_tasks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        parent_task_id TEXT,
        status TEXT NOT NULL,
        goal TEXT NOT NULL,
        result TEXT,
        error TEXT,
        wait_reason TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_zero_tasks_status ON zero_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_zero_tasks_session ON zero_tasks(session_id);

      CREATE TABLE IF NOT EXISTS zero_task_steps (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        thought TEXT,
        tool_name TEXT,
        tool_args TEXT,
        tool_result TEXT,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (task_id) REFERENCES zero_tasks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_zero_task_steps_task ON zero_task_steps(task_id, step_number);

      CREATE TABLE IF NOT EXISTS zero_task_checkpoints (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        step_index INTEGER NOT NULL,
        state_snapshot TEXT NOT NULL,
        artifacts TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (task_id) REFERENCES zero_tasks(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_task_checkpoints ON zero_task_checkpoints(task_id, step_index);

      CREATE TABLE IF NOT EXISTS zero_idempotency_keys (
        key TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_idempotency_task ON zero_idempotency_keys(task_id);

    `);
  }

  createTask({ id, sessionId = 'default', agentId = 'zero', goal, parentTaskId = null }) {
    if (!goal || typeof goal !== 'string') {
      throw new Error('Task creation requires a non-empty goal description.');
    }
    const now = Date.now();
    const taskId = id || `task_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const stmt = this.db.prepare(`
      INSERT INTO zero_tasks (
        id, session_id, agent_id, parent_task_id, status, goal, result, error, wait_reason, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, NULL)
      ON CONFLICT(id) DO UPDATE SET
        session_id = excluded.session_id,
        agent_id = excluded.agent_id,
        goal = excluded.goal,
        status = 'PENDING',
        result = NULL,
        error = NULL,
        wait_reason = NULL,
        updated_at = excluded.updated_at
    `);
    stmt.run(taskId, sessionId, agentId, parentTaskId, TASK_STATUS.PENDING, goal, now, now);

    this._abortControllers.set(taskId, new AbortController());

    const task = this.getTask(taskId);
    this._emitStateChange(task, null);
    return task;
  }

  getTask(taskId) {
    const stmt = this.db.prepare(`SELECT * FROM zero_tasks WHERE id = ?`);
    const row = stmt.get(taskId);
    if (!row) return null;
    return this._formatTask(row);
  }

  listTasks(filter = {}) {
    let sql = `SELECT * FROM zero_tasks WHERE 1=1`;
    const params = [];

    if (filter.sessionId) {
      sql += ` AND session_id = ?`;
      params.push(filter.sessionId);
    }
    if (filter.agentId) {
      sql += ` AND agent_id = ?`;
      params.push(filter.agentId);
    }
    if (filter.status) {
      sql += ` AND status = ?`;
      params.push(filter.status);
    }
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(filter.limit || 50, filter.offset || 0);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => this._formatTask(r));
  }

  transition(taskId, targetStatus, metadata = {}) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Cannot transition non-existent task '${taskId}'`);
    }

    const currentStatus = task.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(
        `Invalid task state transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowed.join(', ')}]`
      );
    }

    const now = Date.now();
    let completedAt = task.completedAt;
    if (
      targetStatus === TASK_STATUS.COMPLETED ||
      targetStatus === TASK_STATUS.FAILED ||
      targetStatus === TASK_STATUS.CANCELLED
    ) {
      completedAt = now;
      this._abortControllers.delete(taskId);
    }

    const result = metadata.result !== undefined ? (typeof metadata.result === 'string' ? metadata.result : JSON.stringify(metadata.result)) : task.result;
    const error = metadata.error !== undefined ? (typeof metadata.error === 'string' ? metadata.error : JSON.stringify(metadata.error)) : task.error;
    const waitReason = metadata.waitReason !== undefined ? String(metadata.waitReason) : (targetStatus === TASK_STATUS.WAITING ? 'Awaiting tool result or human input' : null);

    const stmt = this.db.prepare(`
      UPDATE zero_tasks
      SET status = ?, result = ?, error = ?, wait_reason = ?, updated_at = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(targetStatus, result, error, waitReason, now, completedAt, taskId);

    const updatedTask = this.getTask(taskId);
    this._emitStateChange(updatedTask, currentStatus);
    return updatedTask;
  }

  enqueueTask(taskId) {
    return this.transition(taskId, TASK_STATUS.QUEUED);
  }

  startTask(taskId) {
    return this.transition(taskId, TASK_STATUS.RUNNING);
  }

  pauseTask(taskId, waitReason = 'Awaiting human authorization') {
    return this.transition(taskId, TASK_STATUS.WAITING, { waitReason });
  }

  resumeTask(taskId) {
    return this.transition(taskId, TASK_STATUS.RUNNING);
  }

  completeTask(taskId, result = 'Task completed successfully') {
    return this.transition(taskId, TASK_STATUS.COMPLETED, { result });
  }

  failTask(taskId, error = 'Task failed') {
    return this.transition(taskId, TASK_STATUS.FAILED, { error });
  }

  cancelTask(taskId, reason = 'Task cancelled by operator') {
    const controller = this._abortControllers.get(taskId);
    if (controller && !controller.signal.aborted) {
      controller.abort();
    }
    return this.transition(taskId, TASK_STATUS.CANCELLED, { error: reason });
  }

  delegateTask({ parentTaskId, childAgentId = 'subagent', goal, permissions = [] }) {
    const parent = this.getTask(parentTaskId);
    if (!parent) {
      throw new Error(`Cannot delegate from non-existent parent task '${parentTaskId}'`);
    }

    // Record delegation thought and step in parent
    const steps = this.getTaskSteps(parentTaskId);
    this.recordStep(parentTaskId, {
      stepNumber: steps.length + 1,
      thought: `Delegating sub-goal to agent [${childAgentId}]: "${goal}"`,
      toolName: 'agent_delegation',
      toolArgs: { childAgentId, goal, permissions },
      status: 'delegated',
    });

    // Pause parent while waiting for child
    this.pauseTask(parentTaskId, `Awaiting sub-agent [${childAgentId}]`);

    // Create and start child task
    const childTask = this.createTask({
      sessionId: parent.sessionId,
      agentId: childAgentId,
      goal,
      parentTaskId,
    });
    this.enqueueTask(childTask.id);
    this.startTask(childTask.id);

    return {
      childTask: this.getTask(childTask.id),
      parentTask: this.getTask(parentTaskId),
    };
  }

  async executeChildTask(childTaskId, executorFn) {
    const child = this.getTask(childTaskId);
    if (!child) {
      throw new Error(`Child task '${childTaskId}' not found`);
    }
    if (child.status !== TASK_STATUS.RUNNING) {
      throw new Error(`Child task '${childTaskId}' must be in RUNNING status to execute`);
    }

    const steps = this.getTaskSteps(childTaskId);
    this.recordStep(childTaskId, {
      stepNumber: steps.length + 1,
      thought: `Executing assigned subtask goal: "${child.goal}"`,
      toolName: 'subagent_execution',
      status: 'running',
    });

    let executionResult;
    try {
      executionResult = typeof executorFn === 'function' ? await executorFn(child) : { status: 'success', executedGoal: child.goal };
    } catch (err) {
      this.failChildTask(childTaskId, err.message);
      throw err;
    }

    return this.completeChildTask(childTaskId, executionResult);
  }

  completeChildTask(childTaskId, result = {}) {
    const child = this.completeTask(childTaskId, result);
    if (child.parentTaskId) {
      const parent = this.getTask(child.parentTaskId);
      if (parent && parent.status === TASK_STATUS.WAITING) {
        // Record child completion in parent step history
        const steps = this.getTaskSteps(parent.id);
        this.recordStep(parent.id, {
          stepNumber: steps.length + 1,
          thought: `Received result from sub-agent [${child.agentId}]`,
          toolName: 'agent_delegation',
          toolResult: result,
          status: 'completed',
        });
        // Resume parent
        this.resumeTask(parent.id);
      }
    }
    return child;
  }

  failChildTask(childTaskId, error = 'Child task execution error') {
    const child = this.failTask(childTaskId, error);
    if (child.parentTaskId) {
      const parent = this.getTask(child.parentTaskId);
      if (parent) {
        const steps = this.getTaskSteps(parent.id);
        this.recordStep(parent.id, {
          stepNumber: steps.length + 1,
          thought: `Sub-agent [${child.agentId}] failed: ${error}. Escalating to operator.`,
          toolName: 'agent_delegation',
          toolResult: { error },
          status: 'failed',
        });
        // Escalate parent to WAITING with human escalation notice
        if (parent.status !== TASK_STATUS.WAITING) {
          this.pauseTask(parent.id, `HUMAN_ESCALATION: Sub-agent [${child.agentId}] failed: ${error}`);
        } else {
          const now = Date.now();
          const stmt = this.db.prepare(`
            UPDATE zero_tasks SET wait_reason = ?, updated_at = ? WHERE id = ?
          `);
          stmt.run(`HUMAN_ESCALATION: Sub-agent [${child.agentId}] failed: ${error}`, now, parent.id);
        }
      }
    }
    return child;
  }

  recoverTasksOnStartup() {
    const stmt = this.db.prepare(`
      SELECT * FROM zero_tasks
      WHERE status IN ('RUNNING', 'QUEUED')
    `);
    const interrupted = stmt.all();
    const recovered = [];

    for (const row of interrupted) {
      const task = this._formatTask(row);
      const steps = this.getTaskSteps(task.id);
      this.recordStep(task.id, {
        stepNumber: steps.length + 1,
        thought: 'Host process reboot detected; recovering task to WAITING state for safe resumption.',
        toolName: 'system_recovery',
        status: 'recovered',
      });
      // Transition to WAITING safely
      const now = Date.now();
      const updateStmt = this.db.prepare(`
        UPDATE zero_tasks
        SET status = 'WAITING', wait_reason = 'RESTART_RECOVERY: Host process rebooted during execution', updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(now, task.id);
      recovered.push(task.id);
    }

    return {
      recoveredCount: recovered.length,
      recoveredTaskIds: recovered,
    };
  }

  getSignal(taskId) {
    const controller = this._abortControllers.get(taskId);
    return controller ? controller.signal : null;
  }

  recordStep(taskId, stepData) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Cannot record step for non-existent task '${taskId}'`);
    }

    const now = Date.now();
    const stepId = `step_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const stepNumber = typeof stepData.stepNumber === 'number' ? stepData.stepNumber : 1;
    const thought = stepData.thought || '';
    const toolName = stepData.toolName || '';
    const toolArgs = stepData.toolArgs ? (typeof stepData.toolArgs === 'string' ? stepData.toolArgs : JSON.stringify(stepData.toolArgs)) : null;
    const toolResult = stepData.toolResult ? (typeof stepData.toolResult === 'string' ? stepData.toolResult : JSON.stringify(stepData.toolResult)) : null;
    const status = stepData.status || 'completed';

    const stmt = this.db.prepare(`
      INSERT INTO zero_task_steps (
        id, task_id, step_number, thought, tool_name, tool_args, tool_result, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(stepId, taskId, stepNumber, thought, toolName, toolArgs, toolResult, status, now);

    const stepRecord = {
      id: stepId,
      taskId,
      stepNumber,
      thought,
      toolName,
      toolArgs: stepData.toolArgs,
      toolResult: stepData.toolResult,
      status,
      createdAt: now,
    };

    this.events.emit(`task:${taskId}:step`, stepRecord);
    return stepRecord;
  }

  getTaskSteps(taskId) {
    const stmt = this.db.prepare(`
      SELECT * FROM zero_task_steps
      WHERE task_id = ?
      ORDER BY step_number ASC
    `);
    const rows = stmt.all(taskId);
    return rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      stepNumber: r.step_number,
      thought: r.thought,
      toolName: r.tool_name,
      toolArgs: r.tool_args ? JSON.parse(r.tool_args) : null,
      toolResult: r.tool_result ? JSON.parse(r.tool_result) : null,
      status: r.status,
      createdAt: r.created_at,
    }));
  }


  saveCheckpoint(taskId, stepIndex, stateSnapshot = {}, artifacts = []) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Cannot save checkpoint for non-existent task '${taskId}'`);

    const now = Date.now();
    const checkpointId = `ckpt_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const stmt = this.db.prepare(`
      INSERT INTO zero_task_checkpoints (id, task_id, step_index, state_snapshot, artifacts, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      checkpointId,
      taskId,
      stepIndex,
      JSON.stringify(stateSnapshot),
      JSON.stringify(artifacts),
      now
    );

    const record = {
      id: checkpointId,
      taskId,
      stepIndex,
      stateSnapshot,
      artifacts,
      createdAt: now,
    };
    this.events.emit(`task:${taskId}:checkpoint`, record);
    return record;
  }

  getLatestCheckpoint(taskId) {
    const stmt = this.db.prepare(`
      SELECT * FROM zero_task_checkpoints WHERE task_id = ? ORDER BY step_index DESC, created_at DESC LIMIT 1
    `);
    const row = stmt.get(taskId);
    if (!row) return null;
    return {
      id: row.id,
      taskId: row.task_id,
      stepIndex: row.step_index,
      stateSnapshot: JSON.parse(row.state_snapshot),
      artifacts: row.artifacts ? JSON.parse(row.artifacts) : [],
      createdAt: row.created_at,
    };
  }

  listCheckpoints(taskId) {
    const stmt = this.db.prepare(`
      SELECT * FROM zero_task_checkpoints WHERE task_id = ? ORDER BY step_index ASC, created_at ASC
    `);
    const rows = stmt.all(taskId);
    return rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      stepIndex: r.step_index,
      stateSnapshot: JSON.parse(r.state_snapshot),
      artifacts: r.artifacts ? JSON.parse(r.artifacts) : [],
      createdAt: r.created_at,
    }));
  }

  async executeIdempotent(idempotencyKey, { taskId, action, executeFn }) {
    if (!idempotencyKey) throw new Error('executeIdempotent requires an idempotencyKey');
    if (!executeFn || typeof executeFn !== 'function') throw new Error('executeIdempotent requires executeFn');

    const checkStmt = this.db.prepare(`SELECT * FROM zero_idempotency_keys WHERE key = ?`);
    const existing = checkStmt.get(idempotencyKey);

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return {
          cached: true,
          key: idempotencyKey,
          result: existing.result ? JSON.parse(existing.result) : null,
          executedAt: existing.completed_at,
        };
      }
      if (existing.status === 'PENDING') {
        throw new Error(`Idempotent action '${idempotencyKey}' is already in progress.`);
      }
    }

    const now = Date.now();
    const insertStmt = this.db.prepare(`
      INSERT INTO zero_idempotency_keys (key, task_id, action, result, status, created_at, completed_at)
      VALUES (?, ?, ?, NULL, 'PENDING', ?, NULL)
      ON CONFLICT(key) DO UPDATE SET status = 'PENDING', created_at = excluded.created_at
    `);
    insertStmt.run(idempotencyKey, taskId || 'anonymous', action || 'action', now);

    try {
      const result = await executeFn();
      const completedNow = Date.now();
      const updateStmt = this.db.prepare(`
        UPDATE zero_idempotency_keys
        SET status = 'COMPLETED', result = ?, completed_at = ?
        WHERE key = ?
      `);
      updateStmt.run(JSON.stringify(result ?? null), completedNow, idempotencyKey);
      return {
        cached: false,
        key: idempotencyKey,
        result,
        executedAt: completedNow,
      };
    } catch (err) {
      const failStmt = this.db.prepare(`
        UPDATE zero_idempotency_keys
        SET status = 'FAILED', result = ?, completed_at = ?
        WHERE key = ?
      `);
      failStmt.run(JSON.stringify({ error: err.message }), Date.now(), idempotencyKey);
      throw err;
    }
  }

  setBudget(taskId, { maxSteps = 50, maxDurationMs = 300000, maxRetries = 3 } = {}) {
    if (!this._budgets) this._budgets = new Map();
    this._budgets.set(taskId, { maxSteps, maxDurationMs, maxRetries, retriesUsed: 0 });
    return this._budgets.get(taskId);
  }

  checkBudget(taskId) {
    if (!this._budgets || !this._budgets.has(taskId)) return { ok: true };
    const budget = this._budgets.get(taskId);
    const task = this.getTask(taskId);
    if (!task) return { ok: true };

    const steps = this.getTaskSteps(taskId);
    if (steps.length >= budget.maxSteps) {
      throw new Error(`Task '${taskId}' exceeded step budget limit of ${budget.maxSteps} steps (current: ${steps.length})`);
    }

    const elapsed = Date.now() - task.createdAt;
    if (elapsed > budget.maxDurationMs) {
      throw new Error(`Task '${taskId}' exceeded duration budget of ${budget.maxDurationMs}ms (elapsed: ${elapsed}ms)`);
    }

    return { ok: true, stepsRemaining: budget.maxSteps - steps.length, timeRemainingMs: budget.maxDurationMs - elapsed };
  }

  retryFailedTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Cannot retry non-existent task '${taskId}'`);
    if (task.status !== TASK_STATUS.FAILED) {
      throw new Error(`Cannot retry task in '${task.status}' status (must be FAILED)`);
    }

    const budget = this._budgets?.get(taskId);
    if (budget) {
      if (budget.retriesUsed >= budget.maxRetries) {
        throw new Error(`Task '${taskId}' has exhausted maximum retry attempts (${budget.maxRetries})`);
      }
      budget.retriesUsed += 1;
    }

    // Recover by recording step and transitioning to QUEUED
    this.recordStep(taskId, {
      stepNumber: this.getTaskSteps(taskId).length + 1,
      thought: 'Retrying previously failed task from last stable state.',
      toolName: 'task_retry',
      status: 'retried',
    });

    const now = Date.now();
    const updateStmt = this.db.prepare(`
      UPDATE zero_tasks
      SET status = 'QUEUED', error = NULL, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(now, taskId);

    const updatedTask = this.getTask(taskId);
    this._emitStateChange(updatedTask, TASK_STATUS.FAILED);
    return updatedTask;
  }

  _formatTask(row) {
    return {
      id: row.id,
      sessionId: row.session_id,
      agentId: row.agent_id,
      parentTaskId: row.parent_task_id,
      status: row.status,
      goal: row.goal,
      result: row.result ? this._safeParse(row.result) : null,
      error: row.error,
      waitReason: row.wait_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    };
  }

  _safeParse(str) {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  _emitStateChange(task, previousStatus) {
    const payload = { task, previousStatus, timestamp: Date.now() };
    this.events.emit(`task:${task.id}:state`, payload);
    this.events.emit('stateChange', payload);
  }

  close() {
    this.events.removeAllListeners();
    for (const controller of this._abortControllers.values()) {
      if (!controller.signal.aborted) controller.abort();
    }
    this._abortControllers.clear();
    try {
      this.db.close();
    } catch (_) {}
  }
}
export { AgentMessageBus, MESSAGE_TYPES } from './structured-messaging.mjs';
export { DesktopLeaseManager } from './desktop-lease.mjs';
export { AgentTeamOrchestrator, CANONICAL_AGENT_PROFILES } from './agent-team.mjs';
