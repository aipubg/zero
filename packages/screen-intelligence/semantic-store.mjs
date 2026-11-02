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
    const dataDir = path.resolve(options.dataDir ?? process.env.ZERO_DATA_DIR ?? '.zero-data');
    this.dbPath = options.dbPath === ':memory:' ? ':memory:' : path.resolve(options.dbPath ?? path.join(dataDir, 'screen-observations.sqlite'));
    this.persistent = this.dbPath !== ':memory:';
    this.closed = false;
    this.retentionMs = options.observationRetentionMs ?? 7 * 24 * 60 * 60 * 1000;
    if (!Number.isFinite(this.retentionMs) || this.retentionMs < 1) throw new RangeError('observationRetentionMs must be positive');
    this._lastPruneAt = 0;
    if (this.persistent) fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA cache_size=-4096; PRAGMA wal_autocheckpoint=100; PRAGMA journal_size_limit=16777216;');
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
        confidence REAL,
        expiry_policy TEXT DEFAULT '7d',
        ocr_engine TEXT,
        ocr_status TEXT DEFAULT 'unavailable',
        local_vision_status TEXT DEFAULT 'unavailable',
        metadata_json TEXT DEFAULT '{}'
      );

      CREATE INDEX IF NOT EXISTS idx_obs_timestamp ON semantic_observations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_obs_app ON semantic_observations(application_id);
      CREATE INDEX IF NOT EXISTS idx_obs_task ON semantic_observations(related_task_id);
    `);
    // Add provenance without replacing or dropping the owner's existing observations.
    const columns = new Set(this.db.prepare('PRAGMA table_info(semantic_observations)').all().map(row => row.name));
    for (const [name, definition] of Object.entries({
      ocr_engine: 'TEXT', ocr_status: "TEXT DEFAULT 'unavailable'",
      local_vision_status: "TEXT DEFAULT 'unavailable'", metadata_json: "TEXT DEFAULT '{}'",
    })) {
      if (!columns.has(name)) this.db.exec(`ALTER TABLE semantic_observations ADD COLUMN ${name} ${definition}`);
    }
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
        confidence, expiry_policy, ocr_engine, ocr_status, local_vision_status, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      obs.timestamp ?? Date.now(),
      obs.source_device || 'local-windows-host',
      obs.display_id || 'unknown',
      obs.application_id || 'unknown',
      obs.window_context || '',
      String(obs.observed_text || '').slice(0, 12000),
      String(obs.semantic_summary || '').slice(0, 16000),
      obs.event_type || 'ui_state',
      obs.related_task_id || null,
      obs.confidence ?? null,
      obs.expiry_policy || '7d',
      obs.ocr_engine ?? null,
      obs.ocr_status ?? 'unavailable',
      obs.local_vision_status ?? 'unavailable',
      JSON.stringify(obs.metadata ?? {})
    );
    const now = Date.now();
    if (now - this._lastPruneAt >= 60_000) {
      this.db.prepare('DELETE FROM semantic_observations WHERE timestamp < ?').run(now - this.retentionMs);
      this._lastPruneAt = now;
    }
    return id;
  }

  /**
   * Retrieve recent observations within a time window or count limit.
   */
  getRecentObservations(limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM semantic_observations
      ORDER BY timestamp DESC, rowid DESC
      LIMIT ?
    `);
    return stmt.all(this._limit(limit));
  }

  /**
   * Search observations by keyword or application name.
   */
  searchObservations(query, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM semantic_observations
      WHERE application_id LIKE ? OR window_context LIKE ? OR observed_text LIKE ? OR semantic_summary LIKE ?
      ORDER BY timestamp DESC, rowid DESC
      LIMIT ?
    `);
    const q = `%${query}%`;
    return stmt.all(q, q, q, q, this._limit(limit));
  }

  /**
   * Get the most recent active window context.
   */
  getLatestContext() {
    const stmt = this.db.prepare(`
      SELECT * FROM semantic_observations
      ORDER BY timestamp DESC, rowid DESC
      LIMIT 1
    `);
    const rows = stmt.all();
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Close database handle.
   */
  close() {
    if (!this.closed) this.db.close();
    this.closed = true;
  }

  _limit(limit) { return Number.isFinite(limit) ? Math.max(1, Math.min(1000, Math.floor(limit))) : 20; }

  getStatus() {
    return { active: !this.closed, path: this.dbPath, persistent: this.persistent,
      mode: this.persistent ? 'sqlite-file' : 'sqlite-memory', retentionMs: this.retentionMs,
      observationCount: this.closed ? null : this.db.prepare('SELECT COUNT(*) AS count FROM semantic_observations').get().count };
  }
}
