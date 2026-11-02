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
import { ProtectedFields, encryptedPrefix } from './protected-fields.mjs';

const protectedColumns = ['source_device', 'display_id', 'application_id', 'window_context', 'observed_text', 'semantic_summary', 'related_task_id', 'metadata_json'];

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
    try {
      if (options.encryption !== false) {
        const encrypted = this.db.prepare('SELECT 1 FROM semantic_observations WHERE observed_text LIKE ? OR semantic_summary LIKE ? LIMIT 1').get(encryptedPrefix + '%', encryptedPrefix + '%');
        this.protection = new ProtectedFields({ keyPath: this.persistent && !options.encryptionKey ? this.dbPath + '.key.dpapi' : null, key: options.encryptionKey, hasCiphertext: Boolean(encrypted) });
        this._migrateEncryption();
      }
    } catch (error) { this.db.close(); throw error; }
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
   * Persist a captured observation with explicit provenance.
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

    const seal = (column, value) => this.protection ? this.protection.seal(column, id, value) : value;
    stmt.run(
      id,
      obs.timestamp ?? Date.now(),
      seal('source_device', obs.source_device || 'local-windows-host'),
      seal('display_id', obs.display_id || 'unknown'),
      seal('application_id', obs.application_id || 'unknown'),
      seal('window_context', obs.window_context || ''),
      seal('observed_text', String(obs.observed_text || '').slice(0, 12000)),
      seal('semantic_summary', String(obs.semantic_summary || '').slice(0, 16000)),
      obs.event_type || 'ui_state',
      obs.related_task_id ? seal('related_task_id', obs.related_task_id) : null,
      obs.confidence ?? null,
      obs.expiry_policy || '7d',
      obs.ocr_engine ?? null,
      obs.ocr_status ?? 'unavailable',
      obs.local_vision_status ?? 'unavailable',
      seal('metadata_json', JSON.stringify(obs.metadata ?? {}))
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
    return stmt.all(this._limit(limit)).map(row => this._decode(row));
  }

  /**
   * Search observations by keyword or application name.
   */
  searchObservations(query, limit = 20) {
    if (this.protection) {
      const matches = [];
      const needle = String(query ?? '').toLowerCase();
      for (const encoded of this.db.prepare('SELECT * FROM semantic_observations ORDER BY timestamp DESC, rowid DESC').iterate()) {
        const row = this._decode(encoded);
        if (['application_id', 'window_context', 'observed_text', 'semantic_summary'].some(column => String(row[column] ?? '').toLowerCase().includes(needle))) matches.push(row);
        if (matches.length >= this._limit(limit)) break;
      }
      return matches;
    }
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
    return rows.length > 0 ? this._decode(rows[0]) : null;
  }

  /** Add an actual model result to its original observation, preserving encrypted fields. */
  attachVision(observationId, result) {
    const stored = this.db.prepare('SELECT * FROM semantic_observations WHERE observation_id = ?').get(observationId);
    if (!stored) return false;
    const row = this._decode(stored);
    const metadata = JSON.parse(row.metadata_json || '{}');
    metadata.localVision = { status: 'inferred', model: result.model, source: result.source,
      imageSha256: result.imageSha256, capturedAt: row.timestamp, inferredAt: result.inferredAt, verified: false, confidence: null };
    const summary = `${row.semantic_summary}; Local vision (unverified model inference): ${String(result.text).slice(0, 2000)}`;
    const seal = (column, value) => this.protection ? this.protection.seal(column, observationId, value) : value;
    this.db.prepare('UPDATE semantic_observations SET semantic_summary = ?, metadata_json = ?, local_vision_status = ? WHERE observation_id = ?')
      .run(seal('semantic_summary', summary), seal('metadata_json', JSON.stringify(metadata)), 'inferred', observationId);
    return true;
  }

  /**
   * Close database handle.
   */
  close() {
    if (!this.closed) { this.db.close(); this.protection?.destroy(); }
    this.closed = true;
  }

  _limit(limit) { return Number.isFinite(limit) ? Math.max(1, Math.min(1000, Math.floor(limit))) : 20; }

  _decode(row) {
    if (!this.protection) return row;
    return Object.fromEntries(Object.entries(row).map(([column, value]) => [column, protectedColumns.includes(column) && value !== null ? this.protection.open(column, row.observation_id, value) : value]));
  }

  _migrateEncryption() {
    const rows = this.db.prepare('SELECT * FROM semantic_observations');
    // Authenticate existing ciphertext before touching any existing plaintext.
    let needsMigration = false;
    for (const row of rows.iterate()) {
      this._decode(row);
      if (protectedColumns.some(column => typeof row[column] === 'string' && !row[column].startsWith(encryptedPrefix))) needsMigration = true;
    }
    if (!needsMigration) return;
    if (this.persistent) {
      this.migrationBackup = `${this.dbPath}.before-encryption-${Date.now()}.sqlite`;
      this.db.exec(`VACUUM INTO '${this.migrationBackup.replaceAll("'", "''")}'`);
    }
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const update = this.db.prepare(`UPDATE semantic_observations SET ${protectedColumns.map(column => `${column}=?`).join(', ')} WHERE observation_id=?`);
      for (const row of rows.iterate()) update.run(...protectedColumns.map(column => row[column] === null ? null : row[column].startsWith(encryptedPrefix) ? row[column] : this.protection.seal(column, row.observation_id, row[column])), row.observation_id);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    // Remove superseded plaintext from the current DB/WAL; preserve the explicit rollback backup.
    if (this.persistent) this.db.exec('PRAGMA wal_checkpoint(TRUNCATE); VACUUM; PRAGMA wal_checkpoint(TRUNCATE)');
  }

  getStatus() {
    return { active: !this.closed, path: this.dbPath, persistent: this.persistent,
      mode: this.persistent ? 'sqlite-file' : 'sqlite-memory', retentionMs: this.retentionMs,
      encryptedFields: Boolean(this.protection), keyStorage: this.protection?.keyStorage ?? 'none', migrationBackup: this.migrationBackup ?? null,
      observationCount: this.closed ? null : this.db.prepare('SELECT COUNT(*) AS count FROM semantic_observations').get().count };
  }
}
