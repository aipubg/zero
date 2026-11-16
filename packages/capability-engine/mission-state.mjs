import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { DatabaseSync } from 'node:sqlite';

const SUB_MISSION_STATUSES = new Set(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL_FALLBACK', 'FAILED']);

export class MissionStateStore extends EventEmitter {
  constructor({ dbPath = ':memory:' } = {}) {
    super();
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_missions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        run_id TEXT NOT NULL,
        goal TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS zero_mission_submissions (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL REFERENCES zero_missions(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        app TEXT NOT NULL,
        goal TEXT NOT NULL,
        status TEXT NOT NULL,
        result_summary TEXT,
        error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(mission_id, position)
      );
      CREATE INDEX IF NOT EXISTS idx_zero_missions_session ON zero_missions(session_id, created_at);
    `);
  }

  createMission({ sessionId, runId, goal, subMissions }) {
    if (!sessionId || !runId || typeof goal !== 'string' || !Array.isArray(subMissions) || subMissions.length < 2) {
      throw new TypeError('A mission requires a session, run, goal, and at least two sub-missions');
    }
    const id = randomUUID();
    const now = Date.now();
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('INSERT INTO zero_missions (id, session_id, run_id, goal, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, sessionId, runId, goal, 'PENDING', now, now);
      const insert = this.db.prepare('INSERT INTO zero_mission_submissions (id, mission_id, position, app, goal, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      subMissions.forEach((subMission, index) => {
        if (!subMission?.app || typeof subMission.goal !== 'string' || !subMission.goal.trim()) {
          throw new TypeError(`Invalid mission at position ${index + 1}`);
        }
        insert.run(randomUUID(), id, index + 1, subMission.app, subMission.goal, 'PENDING', now, now);
      });
      this.db.prepare('UPDATE zero_missions SET status=?, updated_at=? WHERE id=?').run('IN_PROGRESS', Date.now(), id);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
    const mission = this.getMission(id);
    this.emit('stateChange', mission);
    return mission;
  }

  transitionSubMission(subMissionId, status, { summary = null, error = null } = {}) {
    if (!SUB_MISSION_STATUSES.has(status) || status === 'PENDING') {
      throw new TypeError(`Invalid sub-mission status: ${status}`);
    }
    const row = this.db.prepare('SELECT * FROM zero_mission_submissions WHERE id=?').get(subMissionId);
    if (!row) throw new Error(`Unknown sub-mission: ${subMissionId}`);
    if (row.status !== 'PENDING' && row.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot transition ${row.status} sub-mission`);
    }
    if (status === 'IN_PROGRESS' && row.status !== 'PENDING') {
      throw new Error(`Cannot transition ${row.status} sub-mission to IN_PROGRESS`);
    }
    const now = Date.now();
    this.db.prepare('UPDATE zero_mission_submissions SET status=?, result_summary=?, error=?, updated_at=? WHERE id=?')
      .run(status, summary, error, now, subMissionId);
    this.db.prepare('UPDATE zero_missions SET updated_at=? WHERE id=?').run(now, row.mission_id);
    const mission = this.getMission(row.mission_id);
    this.emit('stateChange', mission);
    return mission.subMissions.find(item => item.id === subMissionId);
  }

  completeMission(missionId) {
    const mission = this.getMission(missionId);
    if (!mission) throw new Error(`Unknown mission: ${missionId}`);
    const statuses = mission.subMissions.map(item => item.status);
    const status = statuses.every(value => value === 'COMPLETED')
      ? 'COMPLETED'
      : (statuses.some(value => value === 'COMPLETED' || value === 'PARTIAL_FALLBACK') ? 'PARTIAL' : 'FAILED');
    this.db.prepare('UPDATE zero_missions SET status=?, updated_at=? WHERE id=?').run(status, Date.now(), missionId);
    const updated = this.getMission(missionId);
    this.emit('stateChange', updated);
    return updated;
  }

  getMission(id) {
    const row = this.db.prepare('SELECT * FROM zero_missions WHERE id=?').get(id);
    if (!row) return null;
    const subMissions = this.db.prepare('SELECT * FROM zero_mission_submissions WHERE mission_id=? ORDER BY position').all(id)
      .map(item => ({
        id: item.id,
        position: item.position,
        app: item.app,
        goal: item.goal,
        status: item.status,
        summary: item.result_summary,
        error: item.error,
      }));
    return {
      id: row.id, sessionId: row.session_id, runId: row.run_id, goal: row.goal,
      status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, subMissions,
    };
  }

  close() {
    this.removeAllListeners();
    this.db.close();
  }
}

export async function executeMissionPlan({ store, missionId, executeSubMission }) {
  if (!store || typeof executeSubMission !== 'function') throw new TypeError('Mission execution requires a store and executor');
  const mission = store.getMission(missionId);
  if (!mission) throw new Error(`Unknown mission: ${missionId}`);
  const results = [];

  for (const subMission of mission.subMissions) {
    store.transitionSubMission(subMission.id, 'IN_PROGRESS');
    try {
      const result = await executeSubMission(subMission);
      const outcome = String(result?.execution?.outcome || result?.outcome || '').toUpperCase();
      const completedActions = Number(result?.execution?.completedActions || 0);
      const status = outcome === 'COMPLETED' && result?.ok !== false
        ? 'COMPLETED'
        : (completedActions > 0 || outcome === 'PARTIAL' ? 'PARTIAL_FALLBACK' : 'FAILED');
      const summary = String(result?.content || result?.summary || '').replace(/\s+/g, ' ').trim().slice(0, 1000);
      store.transitionSubMission(subMission.id, status, { summary });
      results.push({ app: subMission.app, status, summary, completedActions });
    } catch (error) {
      store.transitionSubMission(subMission.id, 'FAILED', { error: error.message });
      results.push({ app: subMission.app, status: 'FAILED', error: error.message, completedActions: 0 });
    }
  }

  const completed = store.completeMission(missionId);
  return { mission: completed, results };
}
