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
