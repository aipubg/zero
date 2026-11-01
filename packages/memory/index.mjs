/**
 * @fileoverview Zero Persistent Memory Store & Semantic Retrieval Engine
 * 
 * SQLite-backed long-term agent memory with keyword scoring, category tagging,
 * and recency/access-frequency weighting.
 */

import { DatabaseSync } from 'node:sqlite';

export class PersistentMemoryStore {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath] - Path to SQLite database or ':memory:'
   */
  constructor(options = {}) {
    this.dbPath = options.dbPath || ':memory:';
    this.db = new DatabaseSync(this.dbPath);
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_memories (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL DEFAULT 'general',
        content TEXT NOT NULL,
        tags TEXT,
        source TEXT NOT NULL DEFAULT 'user',
        confidence REAL NOT NULL DEFAULT 1.0,
        created_at INTEGER NOT NULL,
        accessed_at INTEGER NOT NULL,
        access_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_zero_memories_cat ON zero_memories(category);
      CREATE INDEX IF NOT EXISTS idx_zero_memories_accessed ON zero_memories(accessed_at);
    `);
  }

  remember({ id, category = 'general', content, tags = [], source = 'user', confidence = 1.0 }) {
    if (!content || typeof content !== 'string') {
      throw new Error('Memory record requires non-empty text content.');
    }
    const now = Date.now();
    const memId = id || `mem_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : [tags]);

    const stmt = this.db.prepare(`
      INSERT INTO zero_memories (
        id, category, content, tags, source, confidence, created_at, accessed_at, access_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(id) DO UPDATE SET
        category = excluded.category,
        content = excluded.content,
        tags = excluded.tags,
        confidence = excluded.confidence,
        accessed_at = excluded.accessed_at
    `);
    stmt.run(memId, category, content.trim(), tagsJson, source, confidence, now, now);

    return this.getMemory(memId);
  }

  getMemory(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_memories WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return this._formatMemory(row);
  }

  /**
   * Search and rank memories by keyword relevance, tag matching, and access frequency.
   */
  recall(query = '', options = {}) {
    const limit = options.limit || 10;
    const category = options.category || null;

    let sql = `SELECT * FROM zero_memories WHERE 1=1`;
    const params = [];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);

    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ''))
      .filter((t) => t.length > 2);

    const scored = rows.map((r) => {
      const mem = this._formatMemory(r);
      const contentLower = mem.content.toLowerCase();
      let score = 0;

      // Exact substring match bonus
      if (query && contentLower.includes(query.toLowerCase())) {
        score += 10;
      }

      // Keyword token matches
      for (const token of queryTokens) {
        if (contentLower.includes(token)) score += 2;
        if (mem.tags.some((t) => t.toLowerCase().includes(token))) score += 3;
      }

      // Access frequency and recency weighting
      score += Math.min(mem.accessCount * 0.2, 2.0);
      const recencyDays = (Date.now() - mem.accessedAt) / (1000 * 86400);
      score += Math.max(0, 1.0 - recencyDays * 0.05);

      return { mem, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    const results = scored.slice(0, limit);

    // Update access statistics for retrieved memories
    const now = Date.now();
    const updateStmt = this.db.prepare(`
      UPDATE zero_memories
      SET access_count = access_count + 1, accessed_at = ?
      WHERE id = ?
    `);
    for (const item of results) {
      updateStmt.run(now, item.mem.id);
      item.mem.accessCount += 1;
      item.mem.accessedAt = now;
    }

    return results.map((r) => r.mem);
  }

  forget(id) {
    const stmt = this.db.prepare(`DELETE FROM zero_memories WHERE id = ?`);
    stmt.run(id);
    return true;
  }

  listMemories(filter = {}) {
    let sql = `SELECT * FROM zero_memories WHERE 1=1`;
    const params = [];

    if (filter.category) {
      sql += ` AND category = ?`;
      params.push(filter.category);
    }
    sql += ` ORDER BY accessed_at DESC LIMIT ? OFFSET ?`;
    params.push(filter.limit || 50, filter.offset || 0);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => this._formatMemory(r));
  }

  prune(maxAgeDays = 90) {
    const threshold = Date.now() - maxAgeDays * 86400 * 1000;
    const stmt = this.db.prepare(`
      DELETE FROM zero_memories
      WHERE accessed_at < ? AND access_count < 2
    `);
    stmt.run(threshold);
    return true;
  }

  _formatMemory(row) {
    return {
      id: row.id,
      category: row.category,
      content: row.content,
      tags: row.tags ? JSON.parse(row.tags) : [],
      source: row.source,
      confidence: row.confidence,
      createdAt: row.created_at,
      accessedAt: row.accessed_at,
      accessCount: row.access_count,
    };
  }

  close() {
    try {
      this.db.close();
    } catch (_) {}
  }
}
export { UnifiedMemoryEngine, MEMORY_LAYERS } from './unified-memory.mjs';
