/**
 * @fileoverview Screen Intelligence — Persistent Semantic Observation Store
 * 
 * Persists structured semantic observations extracted from screen frames:
 * - App context, window titles, OCR text, and semantic summaries
 * - Source device, display ID, related task correlations
 * - Expiry management and fast contextual search
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export class SemanticObservationStore {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath] - Path to SQLite database file
   */
  constructor(options = {}) {
    const defaultDir = path.resolve('zero-system', 'state', 'state');
    fs.mkdirSync(defaultDir, { recursive: true });
    this.dbPath = options.dbPath || path.join(defaultDir, 'screen-observations.sqlite');
    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS semantic_observations (
        observation_id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        source_device TEXT NOT NULL,
        display_id TEXT NOT NULL,
        application_id TEXT,
        window_context TEXT,
        observed_text TEXT,
        semantic_summary TEXT,
        event_type TEXT,
        related_task_id TEXT,
        confidence REAL DEFAULT 1.0,
        expiry_policy TEXT DEFAULT '7d'
      );

      CREATE INDEX IF NOT EXISTS idx_obs_timestamp ON semantic_observations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_obs_app ON semantic_observations(application_id);
      CREATE INDEX IF NOT EXISTS idx_obs_task ON semantic_observations(related_task_id);
    `);
  }

  /**
   * Insert a verified semantic observation record.
   */
  insertObservation(obs) {
    const id = obs.observation_id || `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const stmt = this.db.prepare(`
      INSERT INTO semantic_observations (
        observation_id, timestamp, source_device, display_id, application_id,
        window_context, observed_text, semantic_summary, event_type, related_task_id,
        confidence, expiry_policy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      obs.timestamp || Date.now(),
      obs.source_device || 'local-windows-host',
      obs.display_id || 'primary',
      obs.application_id || 'unknown',
      obs.window_context || '',
      obs.observed_text || '',
      obs.semantic_summary || '',
      obs.event_type || 'ui_state',
      obs.related_task_id || null,
      obs.confidence !== undefined ? obs.confidence : 1.0,
      obs.expiry_policy || '7d'
    );

    return id;
  }

  /**
   * Retrieve recent observations within a time window or count limit.
   */
  getRecentObservations(limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM semantic_observations
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  /**
   * Search observations by keyword or application name.
   */
  searchObservations(query, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM semantic_observations
      WHERE application_id LIKE ? OR window_context LIKE ? OR observed_text LIKE ? OR semantic_summary LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    const q = `%${query}%`;
    return stmt.all(q, q, q, q, limit);
  }

  /**
   * Get the most recent active window context.
   */
  getLatestContext() {
    const stmt = this.db.prepare(`
      SELECT * FROM semantic_observations
      ORDER BY timestamp DESC
      LIMIT 1
    `);
    const rows = stmt.all();
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Close database handle.
   */
  close() {
    try { this.db.close(); } catch (_) {}
  }
}
