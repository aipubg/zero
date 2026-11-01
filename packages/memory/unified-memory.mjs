/**
 * @fileoverview Zero Unified 8-Layer Memory & Contextual Ranking Engine
 *
 * Implements canonical memory architecture across all 8 layers:
 * 1. WORKING: Active conversation turn and intermediate scratchpad
 * 2. SESSION: Multi-turn dialogue history and user messages
 * 3. EPISODIC: Past completed tasks, workflows, and outcomes
 * 4. SEMANTIC: Persistent facts, user preferences, and knowledge base
 * 5. PROCEDURAL: Learned skills, tool execution strategies, and how-tos
 * 6. OBSERVATION: Desktop screen events, window transitions, and visual OCR
 * 7. AGENT: Specialist agent private reflections and team messaging
 * 8. PROJECT: Codebase workspace context, repository rules, and project configs
 */

import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';

export const MEMORY_LAYERS = Object.freeze({
  WORKING: 'working',
  SESSION: 'session',
  EPISODIC: 'episodic',
  SEMANTIC: 'semantic',
  PROCEDURAL: 'procedural',
  OBSERVATION: 'observation',
  AGENT: 'agent',
  PROJECT: 'project',
});

export class UnifiedMemoryEngine extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath=':memory:']
   * @param {Object} [options.logger=console]
   */
  constructor(options = {}) {
    super();
    this.dbPath = options.dbPath || ':memory:';
    this.logger = options.logger || console;
    this.db = new DatabaseSync(this.dbPath);
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_unified_memories (
        id TEXT PRIMARY KEY,
        layer TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        content TEXT NOT NULL,
        tags TEXT,
        agent_id TEXT NOT NULL DEFAULT '*',
        project_id TEXT NOT NULL DEFAULT 'default',
        confidence REAL NOT NULL DEFAULT 1.0,
        source TEXT NOT NULL DEFAULT 'system',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        accessed_at INTEGER NOT NULL,
        access_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_unified_mem_layer ON zero_unified_memories(layer);
      CREATE INDEX IF NOT EXISTS idx_unified_mem_agent ON zero_unified_memories(agent_id);
      CREATE INDEX IF NOT EXISTS idx_unified_mem_project ON zero_unified_memories(project_id);
      CREATE INDEX IF NOT EXISTS idx_unified_mem_accessed ON zero_unified_memories(accessed_at);
    `);
  }

  /**
   * Store or upsert a memory record into one of the 8 canonical layers
   */
  remember({
    id,
    layer = MEMORY_LAYERS.SEMANTIC,
    category = 'general',
    content,
    tags = [],
    agentId = '*',
    projectId = 'default',
    confidence = 1.0,
    source = 'system',
  }) {
    if (!content || typeof content !== 'string') {
      throw new Error('Memory record requires non-empty content string');
    }

    const normalizedLayer = String(layer).toLowerCase();
    if (!Object.values(MEMORY_LAYERS).includes(normalizedLayer)) {
      throw new Error(`Invalid memory layer '${layer}'. Allowed: ${Object.values(MEMORY_LAYERS).join(', ')}`);
    }

    const now = Date.now();
    const memId = id || `mem_${normalizedLayer}_${now}_${Math.random().toString(36).slice(2, 7)}`;
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : [tags]);

    const stmt = this.db.prepare(`
      INSERT INTO zero_unified_memories (
        id, layer, category, content, tags, agent_id, project_id, confidence, source, created_at, updated_at, accessed_at, access_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(id) DO UPDATE SET
        layer = excluded.layer,
        category = excluded.category,
        content = excluded.content,
        tags = excluded.tags,
        agent_id = excluded.agent_id,
        project_id = excluded.project_id,
        confidence = excluded.confidence,
        source = excluded.source,
        updated_at = excluded.updated_at,
        accessed_at = excluded.accessed_at
    `);
    stmt.run(
      memId,
      normalizedLayer,
      category,
      content.trim(),
      tagsJson,
      agentId,
      projectId,
      Math.max(0, Math.min(1.0, Number(confidence) || 1.0)),
      source,
      now,
      now,
      now
    );

    const record = this.getMemory(memId);
    this.emit('memory:created', record);
    return record;
  }

  getMemory(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_unified_memories WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return this._formatMemory(row);
  }

  /**
   * Update or correct an existing memory record
   */
  updateMemory(id, { content, confidence, tags, category }) {
    const existing = this.getMemory(id);
    if (!existing) throw new Error(`Memory record '${id}' not found`);

    const now = Date.now();
    const updatedContent = content !== undefined ? String(content).trim() : existing.content;
    const updatedConfidence = confidence !== undefined ? Math.max(0, Math.min(1.0, Number(confidence))) : existing.confidence;
    const updatedCategory = category !== undefined ? String(category) : existing.category;
    const updatedTags = tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : JSON.stringify(existing.tags);

    const stmt = this.db.prepare(`
      UPDATE zero_unified_memories
      SET content = ?, confidence = ?, category = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(updatedContent, updatedConfidence, updatedCategory, updatedTags, now, id);

    const updated = this.getMemory(id);
    this.emit('memory:updated', updated);
    return updated;
  }

  /**
   * Delete / forget memory record
   */
  forget(id) {
    const existing = this.getMemory(id);
    if (!existing) return { ok: false, forgotten: false };

    const stmt = this.db.prepare(`DELETE FROM zero_unified_memories WHERE id = ?`);
    stmt.run(id);

    this.emit('memory:forgotten', { id, layer: existing.layer });
    return { ok: true, forgotten: true, id };
  }

  /**
   * Hybrid contextual retrieval across the 8 layers with temporal and confidence ranking
   */
  recall(query = '', options = {}) {
    const limit = options.limit || 10;
    const layers = options.layers && options.layers.length > 0 ? options.layers : null;
    const agentId = options.agentId || null;
    const projectId = options.projectId || null;
    const category = options.category || null;

    let sql = `SELECT * FROM zero_unified_memories WHERE 1=1`;
    const params = [];

    if (layers && Array.isArray(layers)) {
      const placeholders = layers.map(() => '?').join(', ');
      sql += ` AND layer IN (${placeholders})`;
      params.push(...layers);
    }
    if (agentId && agentId !== '*') {
      sql += ` AND (agent_id = ? OR agent_id = '*')`;
      params.push(agentId);
    }
    if (projectId) {
      sql += ` AND (project_id = ? OR project_id = 'default')`;
      params.push(projectId);
    }
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
      .filter((t) => t.length > 1);

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
        if (contentLower.includes(token)) score += 2.5;
        if (mem.tags.some((t) => t.toLowerCase().includes(token))) score += 3.5;
      }

      // Layer-specific weighting priority
      if (mem.layer === MEMORY_LAYERS.WORKING) score *= 1.4;
      else if (mem.layer === MEMORY_LAYERS.SEMANTIC) score *= 1.2;
      else if (mem.layer === MEMORY_LAYERS.OBSERVATION) score *= 1.1;

      // Access frequency and recency weighting
      score += Math.min(mem.accessCount * 0.15, 2.0);
      const recencyDays = (Date.now() - mem.accessedAt) / (1000 * 86400);
      score += Math.max(0, 1.0 - recencyDays * 0.05);

      // Confidence scalar
      score *= mem.confidence;

      return { mem, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    const topScored = scored.slice(0, limit);

    // Update access telemetry
    const now = Date.now();
    const updateStmt = this.db.prepare(`
      UPDATE zero_unified_memories
      SET accessed_at = ?, access_count = access_count + 1
      WHERE id = ?
    `);

    for (const item of topScored) {
      try {
        updateStmt.run(now, item.mem.id);
      } catch (_) {}
    }

    return topScored.map((item) => ({
      ...item.mem,
      relevanceScore: Number(item.score.toFixed(3)),
    }));
  }

  /**
   * Get telemetry breakdown across all 8 memory layers
   */
  getLayerStats() {
    const stmt = this.db.prepare(`
      SELECT layer, count(*) as count, avg(confidence) as avg_confidence
      FROM zero_unified_memories
      GROUP BY layer
    `);
    const rows = stmt.all();

    const stats = {};
    for (const layer of Object.values(MEMORY_LAYERS)) {
      stats[layer] = { count: 0, avgConfidence: 1.0 };
    }

    let total = 0;
    for (const r of rows) {
      stats[r.layer] = {
        count: r.count,
        avgConfidence: Number(r.avg_confidence?.toFixed(2) || 1.0),
      };
      total += r.count;
    }

    return {
      totalMemories: total,
      layers: stats,
      activeLayersCount: Object.values(stats).filter((s) => s.count > 0).length,
      timestamp: Date.now(),
    };
  }

  /**
   * Consolidate and prune memories older than given threshold
   */
  consolidateMemories({ olderThanDays = 30, category = null } = {}) {
    const cutoff = Date.now() - olderThanDays * 86400 * 1000;
    let sql = `DELETE FROM zero_unified_memories WHERE updated_at < ? AND confidence < 0.5`;
    const params = [cutoff];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    const stmt = this.db.prepare(sql);
    const res = stmt.run(...params);

    return {
      ok: true,
      prunedCount: res.changes,
      cutoffTimestamp: cutoff,
    };
  }

  listMemories(filter = {}) {
    let sql = `SELECT * FROM zero_unified_memories WHERE 1=1`;
    const params = [];

    if (filter.layer) {
      sql += ` AND layer = ?`;
      params.push(filter.layer);
    }
    if (filter.category) {
      sql += ` AND category = ?`;
      params.push(filter.category);
    }
    if (filter.agentId) {
      sql += ` AND (agent_id = ? OR agent_id = '*')`;
      params.push(filter.agentId);
    }
    if (filter.projectId) {
      sql += ` AND project_id = ?`;
      params.push(filter.projectId);
    }

    sql += ` ORDER BY accessed_at DESC LIMIT ? OFFSET ?`;
    params.push(filter.limit || 50, filter.offset || 0);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => this._formatMemory(r));
  }

  _formatMemory(row) {
    return {
      id: row.id,
      layer: row.layer,
      category: row.category,
      content: row.content,
      tags: JSON.parse(row.tags || '[]'),
      agentId: row.agent_id,
      projectId: row.project_id,
      confidence: row.confidence,
      source: row.source,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      accessedAt: row.accessed_at,
      accessCount: row.access_count,
    };
  }

  close() {
    this.removeAllListeners();
    try {
      this.db.close();
    } catch (_) {}
  }
}
