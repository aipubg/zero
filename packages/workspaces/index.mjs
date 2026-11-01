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
    this._initSchema();
    this._registerDefaultWorkers();
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
  }

  _registerDefaultWorkers() {
    this.registerWorker({
      id: 'worker_local_primary',
      name: 'Primary Local Windows Host',
      type: WORKER_TYPES.LOCAL,
      capabilities: ['desktop_automation', 'uia', 'native_fs', 'local_inference'],
    });
  }

  // --- Workspaces ---

  createWorkspace({ id, name, projectId = 'default', type = WORKSPACE_TYPES.ISOLATED, assignedAgentId = null }) {
    if (!name) throw new Error('Workspace requires name');
    const wsId = id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const rootDir = path.join(this.baseStorageDir, wsId);

    try {
      fs.mkdirSync(rootDir, { recursive: true });
    } catch (_) {}

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
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO zero_workers (id, name, type, capabilities_json, status, last_heartbeat, created_at)
      VALUES (?, ?, ?, ?, 'online', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        capabilities_json = excluded.capabilities_json,
        status = 'online',
        last_heartbeat = excluded.last_heartbeat
    `);
    stmt.run(id, name, type, JSON.stringify(capabilities), now, now);

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
      lastHeartbeat: r.last_heartbeat,
      createdAt: r.created_at,
    }));
  }

  recordHeartbeat(workerId) {
    const now = Date.now();
    const stmt = this.db.prepare(`UPDATE zero_workers SET last_heartbeat = ?, status = 'online' WHERE id = ?`);
    stmt.run(now, workerId);
    return { ok: true, workerId, lastHeartbeat: now };
  }

  /**
   * Distributed task handoff contract across workers
   */
  handoffTask({ taskId, fromWorkerId, toWorkerId, stateSnapshot = {}, artifacts = [] }) {
    if (!taskId || !fromWorkerId || !toWorkerId) {
      throw new Error('Handoff requires taskId, fromWorkerId, and toWorkerId');
    }

    const targetWorker = this.getWorker(toWorkerId);
    if (!targetWorker || targetWorker.status !== 'online') {
      throw new Error(`Target worker '${toWorkerId}' is not online`);
    }

    const handoffId = `handoff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO zero_task_handoffs (id, task_id, from_worker_id, to_worker_id, state_snapshot_json, artifacts_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)
    `);
    stmt.run(
      handoffId,
      taskId,
      fromWorkerId,
      toWorkerId,
      JSON.stringify(stateSnapshot),
      JSON.stringify(artifacts),
      now
    );

    const payload = {
      handoffId,
      taskId,
      fromWorkerId,
      toWorkerId,
      stateSnapshot,
      artifacts,
      timestamp: now,
    };
    this.emit('task:handoff', payload);
    return { ok: true, ...payload };
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
      timestamp: r.created_at,
    }));
  }

  close() {
    this.removeAllListeners();
    try {
      this.db.close();
    } catch (_) {}
  }
}
