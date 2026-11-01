/**
 * @fileoverview Zero Agent Runtime — Structured Agent-to-Agent Messaging System
 *
 * Implements canonical messaging frames for multi-agent collaboration:
 * - TASK_ASSIGNED: Coordinator -> Specialist assigning sub-goal and constraints
 * - STEP_PROGRESS: Specialist -> Team broadcasting intermediate progress % and thoughts
 * - ARTIFACT_CREATED: Specialist -> Team registering generated artifacts
 * - TASK_COMPLETED: Specialist -> Coordinator returning validated output
 * - TASK_FAILED: Specialist -> Coordinator notifying execution error
 * - BLOCKED: Specialist -> Coordinator requesting human input or lease resource
 * - HANDOFF: Specialist -> Specialist transferring context, deliverables, and workspace
 */

import { EventEmitter } from 'node:events';

export const MESSAGE_TYPES = Object.freeze({
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  STEP_PROGRESS: 'STEP_PROGRESS',
  ARTIFACT_CREATED: 'ARTIFACT_CREATED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  BLOCKED: 'BLOCKED',
  HANDOFF: 'HANDOFF',
});

export class AgentMessageBus {
  /**
   * @param {Object} [options]
   * @param {Object} [options.db] - Optional DatabaseSync instance for persistence
   */
  constructor(options = {}) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(200);
    this.db = options.db || null;
    this._inMemoryLog = [];
    this._initPersistence();
  }

  _initPersistence() {
    if (this.db) {
      try {
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS zero_agent_messages (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            from_agent_id TEXT NOT NULL,
            to_agent_id TEXT NOT NULL,
            message_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            timestamp INTEGER NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_agent_messages_task ON zero_agent_messages(task_id);
          CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON zero_agent_messages(to_agent_id);
        `);
      } catch (err) {
        console.warn('[AgentMessageBus] Failed to initialize SQLite message table:', err.message);
      }
    }
  }

  /**
   * Broadcast or send a structured message frame
   */
  send({ taskId, fromAgentId, toAgentId = '*', type, payload = {} }) {
    if (!taskId) throw new Error('Structured message requires taskId');
    if (!fromAgentId) throw new Error('Structured message requires fromAgentId');
    if (!type || !MESSAGE_TYPES[type]) {
      throw new Error(`Invalid message type '${type}'. Allowed: ${Object.keys(MESSAGE_TYPES).join(', ')}`);
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      taskId,
      fromAgentId,
      toAgentId,
      type,
      payload,
      timestamp: Date.now(),
    };

    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO zero_agent_messages (id, task_id, from_agent_id, to_agent_id, message_type, payload, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          message.id,
          message.taskId,
          message.fromAgentId,
          message.toAgentId,
          message.type,
          JSON.stringify(message.payload),
          message.timestamp
        );
      } catch (err) {
        console.warn('[AgentMessageBus] Failed to persist message to SQLite:', err.message);
      }
    }

    this._inMemoryLog.push(message);
    if (this._inMemoryLog.length > 2000) {
      this._inMemoryLog.shift();
    }

    // Emit typed event, task event, and target agent event
    this.events.emit(`type:${type}`, message);
    this.events.emit(`task:${taskId}`, message);
    if (toAgentId !== '*') {
      this.events.emit(`agent:${toAgentId}`, message);
    }
    this.events.emit('message', message);

    return message;
  }

  onType(type, handler) {
    this.events.on(`type:${type}`, handler);
    return () => this.events.off(`type:${type}`, handler);
  }

  onAgent(agentId, handler) {
    this.events.on(`agent:${agentId}`, handler);
    return () => this.events.off(`agent:${agentId}`, handler);
  }

  onTask(taskId, handler) {
    this.events.on(`task:${taskId}`, handler);
    return () => this.events.off(`task:${taskId}`, handler);
  }

  getMessageHistory(taskId) {
    if (this.db) {
      try {
        const stmt = this.db.prepare(`
          SELECT * FROM zero_agent_messages WHERE task_id = ? ORDER BY timestamp ASC
        `);
        const rows = stmt.all(taskId);
        return rows.map((r) => ({
          id: r.id,
          taskId: r.task_id,
          fromAgentId: r.from_agent_id,
          toAgentId: r.to_agent_id,
          type: r.message_type,
          payload: JSON.parse(r.payload),
          timestamp: r.timestamp,
        }));
      } catch (_) {}
    }
    return this._inMemoryLog.filter((m) => m.taskId === taskId);
  }

  clear() {
    this.events.removeAllListeners();
    this._inMemoryLog = [];
  }
}
