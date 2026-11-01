/**
 * @fileoverview Zero Durable Automation & Cron Scheduling Engine
 * 
 * Persistent SQLite-backed task scheduling and timer triggers.
 */

import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';

export class AutomationScheduler {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath] - Path to SQLite database or ':memory:'
   * @param {Function} [options.executor] - Action execution dispatcher
   */
  constructor(options = {}) {
    this.dbPath = options.dbPath || ':memory:';
    this.executor = options.executor || (async () => ({ ok: true }));
    this.events = new EventEmitter();
    this.db = new DatabaseSync(this.dbPath);
    this._timer = null;
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_cron_jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cron_expr TEXT NOT NULL,
        target_action TEXT NOT NULL,
        params TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        last_run INTEGER,
        next_run INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_zero_cron_due ON zero_cron_jobs(enabled, next_run);

      CREATE TABLE IF NOT EXISTS zero_cron_runs (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        status TEXT NOT NULL,
        result TEXT,
        error TEXT,
        executed_at INTEGER NOT NULL,
        FOREIGN KEY (job_id) REFERENCES zero_cron_jobs(id) ON DELETE CASCADE
      );
    `);
  }

  /**
   * Compute next execution timestamp in milliseconds based on standard cron expression.
   */
  calculateNextRun(cronExpr, fromTime = Date.now()) {
    const expr = (cronExpr || '').trim().toLowerCase();

    // Shorthand keywords
    if (expr === '@hourly') return fromTime + 3600 * 1000;
    if (expr === '@daily') return fromTime + 86400 * 1000;
    if (expr === '@weekly') return fromTime + 7 * 86400 * 1000;

    // Step minutes (e.g. */5 * * * *, */15 * * * *)
    const stepMatch = expr.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
    if (stepMatch) {
      const minutes = parseInt(stepMatch[1], 10);
      return fromTime + minutes * 60 * 1000;
    }

    // Default interval fallback (e.g. * * * * * = every 1 minute)
    return fromTime + 60 * 1000;
  }

  registerJob({ id, title, cronExpr = '*/15 * * * *', targetAction, params = {}, enabled = true, nextRun = null, nextRunAt = null }) {
    if (!title || !targetAction) {
      throw new Error('Automation job requires title and targetAction.');
    }
    const now = Date.now();
    const jobId = id || `job_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const effectiveNextRun = nextRun || nextRunAt || this.calculateNextRun(cronExpr, now);

    const stmt = this.db.prepare(`
      INSERT INTO zero_cron_jobs (
        id, title, cron_expr, target_action, params, enabled, last_run, next_run, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        cron_expr = excluded.cron_expr,
        target_action = excluded.target_action,
        params = excluded.params,
        enabled = excluded.enabled,
        next_run = excluded.next_run
    `);
    stmt.run(jobId, title, cronExpr, targetAction, JSON.stringify(params), enabled ? 1 : 0, effectiveNextRun, now);

    return this.getJob(jobId);
  }

  getJob(jobId) {
    const stmt = this.db.prepare(`SELECT * FROM zero_cron_jobs WHERE id = ?`);
    const row = stmt.get(jobId);
    if (!row) return null;
    return this._formatJob(row);
  }

  listJobs() {
    const stmt = this.db.prepare(`SELECT * FROM zero_cron_jobs ORDER BY created_at DESC`);
    const rows = stmt.all();
    return rows.map((r) => this._formatJob(r));
  }

  deleteJob(jobId) {
    const stmt = this.db.prepare(`DELETE FROM zero_cron_jobs WHERE id = ?`);
    stmt.run(jobId);
    return true;
  }

  toggleJob(jobId, enabled) {
    const stmt = this.db.prepare(`UPDATE zero_cron_jobs SET enabled = ? WHERE id = ?`);
    stmt.run(enabled ? 1 : 0, jobId);
    return this.getJob(jobId);
  }

  async triggerDueJobs(now = Date.now()) {
    return this.checkAndTriggerDueJobs(now);
  }

  async checkAndTriggerDueJobs(now = Date.now()) {
    const stmt = this.db.prepare(`
      SELECT * FROM zero_cron_jobs
      WHERE enabled = 1 AND next_run <= ?
    `);
    const dueJobs = stmt.all(now);
    const triggered = [];

    for (const row of dueJobs) {
      const job = this._formatJob(row);
      const runId = `run_${now}_${Math.random().toString(36).slice(2, 8)}`;

      let status = 'completed';
      let result = null;
      let error = null;

      try {
        result = await this.executor(job.targetAction, job.params);
      } catch (err) {
        status = 'failed';
        error = err.message || 'Execution error';
      }

      // Record run
      const runStmt = this.db.prepare(`
        INSERT INTO zero_cron_runs (id, job_id, status, result, error, executed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      runStmt.run(runId, job.id, status, result ? JSON.stringify(result) : null, error, now);

      // Schedule next run
      const nextRun = this.calculateNextRun(job.cronExpr, now);
      const updateStmt = this.db.prepare(`
        UPDATE zero_cron_jobs
        SET last_run = ?, next_run = ?
        WHERE id = ?
      `);
      updateStmt.run(now, nextRun, job.id);

      const runRecord = {
        runId,
        jobId: job.id,
        targetAction: job.targetAction,
        status,
        result,
        error,
        executedAt: now,
      };

      this.events.emit('job:executed', runRecord);
      triggered.push(runRecord);
    }

    return {
      triggeredCount: triggered.length,
      runs: triggered,
    };
  }

  listRuns({ jobId, limit = 50, offset = 0 } = {}) {
    let sql = `SELECT * FROM zero_cron_runs WHERE 1=1`;
    const params = [];
    if (jobId) {
      sql += ` AND job_id = ?`;
      params.push(jobId);
    }
    sql += ` ORDER BY executed_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      status: r.status,
      result: r.result ? JSON.parse(r.result) : null,
      error: r.error,
      executedAt: r.executed_at,
    }));
  }

  getJobRuns(jobId, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM zero_cron_runs
      WHERE job_id = ?
      ORDER BY executed_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(jobId, limit);
    return rows.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      status: r.status,
      result: r.result ? JSON.parse(r.result) : null,
      error: r.error,
      executedAt: r.executed_at,
    }));
  }

  _formatJob(row) {
    return {
      id: row.id,
      title: row.title,
      cronExpr: row.cron_expr,
      targetAction: row.target_action,
      params: row.params ? JSON.parse(row.params) : {},
      enabled: row.enabled === 1,
      lastRun: row.last_run,
      nextRun: row.next_run,
      createdAt: row.created_at,
    };
  }

  close() {
    this.events.removeAllListeners();
    try {
      this.db.close();
    } catch (_) {}
  }
}

export { EventAutomationEngine, AUTOMATION_TEMPLATES } from './event-automation.mjs';

