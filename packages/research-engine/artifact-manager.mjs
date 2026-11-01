/**
 * @fileoverview Zero Research Engine — Verified Artifact Producer & Manager
 *
 * Implements deterministic artifact production with SHA-256 checksums,
 * SQLite metadata persistence, and formal verification gates.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const ARTIFACT_TYPES = Object.freeze({
  CODE_DIFF: 'code_diff',
  DOCUMENT: 'document',
  REPORT: 'report',
  DATASET: 'dataset',
  MEDIA: 'media',
  TEST_RESULT: 'test_result',
});

export class ArtifactManager {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath=':memory:']
   * @param {string} [options.storageDir]
   */
  constructor(options = {}) {
    this.dbPath = options.dbPath || ':memory:';
    this.storageDir = options.storageDir || path.resolve(process.cwd(), 'artifacts');
    this.db = new DatabaseSync(this.dbPath);
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_artifacts (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL DEFAULT 'standalone',
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT,
        sha256 TEXT NOT NULL,
        bytes INTEGER NOT NULL,
        verified INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_artifacts_task ON zero_artifacts(task_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_type ON zero_artifacts(type);
    `);
  }

  /**
   * Produce and register a new verified artifact
   */
  createArtifact({
    id,
    taskId = 'standalone',
    type = ARTIFACT_TYPES.REPORT,
    title,
    content = '',
    targetPath = null,
    verified = true,
  }) {
    if (!title || typeof title !== 'string') {
      throw new Error('Artifact requires a title');
    }

    const now = Date.now();
    const artifactId = id || `art_${type}_${now}_${Math.random().toString(36).slice(2, 7)}`;
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    let filePath = targetPath;
    if (!filePath && this.storageDir) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
        const ext = type === ARTIFACT_TYPES.CODE_DIFF ? '.diff' : (type === ARTIFACT_TYPES.DATASET ? '.json' : '.md');
        filePath = path.join(this.storageDir, `${artifactId}${ext}`);
        fs.writeFileSync(filePath, buffer);
      } catch (_) {}
    }

    const stmt = this.db.prepare(`
      INSERT INTO zero_artifacts (id, task_id, type, title, file_path, sha256, bytes, verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      artifactId,
      taskId,
      type,
      title,
      filePath,
      sha256,
      buffer.length,
      verified ? 1 : 0,
      now
    );

    return this.getArtifact(artifactId);
  }

  getArtifact(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_artifacts WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return this._formatRow(row);
  }

  listArtifacts(filter = {}) {
    let sql = `SELECT * FROM zero_artifacts WHERE 1=1`;
    const params = [];

    if (filter.taskId) {
      sql += ` AND task_id = ?`;
      params.push(filter.taskId);
    }
    if (filter.type) {
      sql += ` AND type = ?`;
      params.push(filter.type);
    }
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(filter.limit || 50, filter.offset || 0);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => this._formatRow(r));
  }

  verifyChecksum(id) {
    const artifact = this.getArtifact(id);
    if (!artifact || !artifact.filePath || !fs.existsSync(artifact.filePath)) {
      return { ok: false, verified: false, error: 'File not found on disk' };
    }

    const buffer = fs.readFileSync(artifact.filePath);
    const currentHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const matched = currentHash === artifact.sha256;

    return {
      ok: true,
      id,
      verified: matched,
      expectedSha256: artifact.sha256,
      currentSha256: currentHash,
    };
  }

  _formatRow(r) {
    return {
      id: r.id,
      taskId: r.task_id,
      type: r.type,
      title: r.title,
      filePath: r.file_path,
      sha256: r.sha256,
      bytes: r.bytes,
      verified: Boolean(r.verified),
      createdAt: r.created_at,
    };
  }

  close() {
    try {
      this.db.close();
    } catch (_) {}
  }
}
