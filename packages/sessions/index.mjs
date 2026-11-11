/**
 * @fileoverview Zero Session Store, Transcript Persistence, and Context Compaction Engine
 * 
 * Powered natively by Node.js 24 node:sqlite DatabaseSync.
 */

import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';

export class SessionManager {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath] - Path to SQLite database or ':memory:' (default)
   */
  constructor(options = {}) {
    this.dbPath = options.dbPath || ':memory:';
    this.events = new EventEmitter();
    this.db = new DatabaseSync(this.dbPath);
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS zero_assistant_receipts (
      session_id TEXT NOT NULL, run_id TEXT NOT NULL, input_hash TEXT NOT NULL,
      status TEXT NOT NULL, result_json TEXT, error TEXT, task_id TEXT,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      PRIMARY KEY(session_id, run_id)
    )`);
    if (!this.db.prepare('PRAGMA table_info(zero_assistant_receipts)').all().some(column => column.name === 'task_id')) this.db.exec('ALTER TABLE zero_assistant_receipts ADD COLUMN task_id TEXT');
    if (!this.db.prepare('PRAGMA table_info(zero_assistant_receipts)').all().some(column => column.name === 'model_id')) this.db.exec('ALTER TABLE zero_assistant_receipts ADD COLUMN model_id TEXT');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS zero_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT,
        tool_calls TEXT,
        created_at INTEGER NOT NULL,
        seq INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES zero_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_zero_messages_session_seq ON zero_messages(session_id, seq);

      CREATE TABLE IF NOT EXISTS zero_events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES zero_sessions(id) ON DELETE CASCADE
      );
    `);
    const sessionColumns = new Set(this.db.prepare('PRAGMA table_info(zero_sessions)').all().map(column => column.name));
    if (!sessionColumns.has('archived')) this.db.exec('ALTER TABLE zero_sessions ADD COLUMN archived INTEGER NOT NULL DEFAULT 0');

    const columns = new Set(this.db.prepare('PRAGMA table_info(zero_messages)').all().map(column => column.name));
    if (!columns.has('tool_call_id')) this.db.exec('ALTER TABLE zero_messages ADD COLUMN tool_call_id TEXT');
    if (!columns.has('run_id')) this.db.exec('ALTER TABLE zero_messages ADD COLUMN run_id TEXT');
    if (!columns.has('status')) this.db.exec('ALTER TABLE zero_messages ADD COLUMN status TEXT');
    if (!columns.has('context_archived')) this.db.exec('ALTER TABLE zero_messages ADD COLUMN context_archived INTEGER NOT NULL DEFAULT 0');
  }

  createSession(id, title = 'New Conversation', metadata = {}) {
    const now = Date.now();
    const sessionId = id || `session_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const isArchived = Boolean(metadata.archived) ? 1 : 0;
    const stmt = this.db.prepare(`
      INSERT INTO zero_sessions (id, title, created_at, updated_at, metadata, archived)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(sessionId, title, now, now, JSON.stringify(metadata), isArchived);
    return this.getSession(sessionId);
  }

  getSession(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_sessions WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    const isArchived = Boolean(row.archived || metadata.archived);
    return {
      id: row.id,
      key: row.id,
      sessionId: row.id,
      agentId: metadata.agentId || 'zero',
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata,
      involvement: metadata.involvement,
      archived: isArchived,
    };
  }

  listSessions(limitOrOptions = 50, offset = 0) {
    let lim = 50;
    let off = 0;
    let includeArchived = false;
    if (typeof limitOrOptions === 'object' && limitOrOptions !== null) {
      lim = Number(limitOrOptions.limit ?? 50);
      off = Number(limitOrOptions.offset ?? 0);
      includeArchived = Boolean(limitOrOptions.includeArchived);
    } else {
      lim = Number(limitOrOptions ?? 50);
      off = Number(offset ?? 0);
    }
    const whereClause = includeArchived ? '' : 'WHERE (s.archived = 0 OR s.archived IS NULL)';
    const stmt = this.db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM zero_messages m WHERE m.session_id = s.id) AS messages_count,
        (SELECT m.content FROM zero_messages m WHERE m.session_id = s.id ORDER BY m.seq DESC LIMIT 1) AS last_message
      FROM zero_sessions s
      ${whereClause}
      ORDER BY s.updated_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(lim, off);
    return rows.map((r) => {
      const meta = r.metadata ? JSON.parse(r.metadata) : {};
      const isArchived = Boolean(r.archived || meta.archived);
      return {
        key: r.id,
        id: r.id,
        sessionId: r.id,
        agentId: meta.agentId || 'zero',
        title: r.title,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        messagesCount: Number(r.messages_count || 0),
        lastMessage: r.last_message || '',
        metadata: meta,
        archived: isArchived,
        canArchive: true,
        canDelete: true,
      };
    });
  }

  patchSession(id, updates = {}) {
    const existing = this.getSession(id);
    if (!existing) return null;
    const title = updates.title !== undefined ? String(updates.title) : existing.title;
    const metadata = { ...existing.metadata, ...(updates.metadata || {}) };
    if (updates.involvement !== undefined) {
      metadata.involvement = updates.involvement;
    }
    let isArchived = existing.archived ? 1 : 0;
    if (updates.archived !== undefined) {
      isArchived = Boolean(updates.archived) ? 1 : 0;
      metadata.archived = Boolean(updates.archived);
    }
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE zero_sessions SET title = ?, metadata = ?, archived = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(title, JSON.stringify(metadata), isArchived, now, id);
    return this.getSession(id);
  }

  deleteSession(id) {
    try {
      this.db.prepare(`DELETE FROM zero_messages WHERE session_id = ?`).run(id);
    } catch {}
    try {
      this.db.prepare(`DELETE FROM zero_events WHERE session_id = ?`).run(id);
    } catch {}
    const stmt = this.db.prepare(`DELETE FROM zero_sessions WHERE id = ?`);
    stmt.run(id);
    return true;
  }

  deleteMany(ids = []) {
    let count = 0;
    for (const id of ids) {
      if (this.deleteSession(id)) count++;
    }
    return count;
  }

  patchMany(patches = []) {
    const results = [];
    for (const p of patches) {
      const id = p.key || p.id;
      if (!id) continue;
      const patched = this.patchSession(id, p);
      if (patched) results.push(patched);
    }
    return results;
  }

  appendMessage(sessionId, message) {
    let session = this.getSession(sessionId);
    if (!session) {
      session = this.createSession(sessionId, 'Auto-Created Session');
    }

    const maxSeqStmt = this.db.prepare(`
      SELECT COALESCE(MAX(seq), 0) AS max_seq FROM zero_messages WHERE session_id = ?
    `);
    const maxSeqRow = maxSeqStmt.get(sessionId);
    const nextSeq = (maxSeqRow?.max_seq || 0) + 1;

    const now = Date.now();
    const msgId = message.id || `msg_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const content = typeof message.content === 'string' ? message.content : message.content == null ? null : JSON.stringify(message.content);
    const toolCalls = message.tool_calls ? JSON.stringify(message.tool_calls) : null;

    const insertStmt = this.db.prepare(`
      INSERT INTO zero_messages (id, session_id, role, content, tool_calls, created_at, seq, tool_call_id, run_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(msgId, sessionId, message.role || 'user', content, toolCalls, now, nextSeq, message.tool_call_id || null, message.runId || null, message.status || null);

    // Update session updated_at and update title if default title
    if ((!session.title || session.title === 'Auto-Created Session' || session.title === 'New Conversation' || session.title === 'Session') && (message.role === 'user' || !message.role) && typeof content === 'string' && content.trim()) {
      const cleanTitle = content.replace(/\s+/g, ' ').trim().slice(0, 48);
      if (cleanTitle) {
        const titleStmt = this.db.prepare(`UPDATE zero_sessions SET updated_at = ?, title = ? WHERE id = ?`);
        titleStmt.run(now, cleanTitle, sessionId);
        session.title = cleanTitle;
      } else {
        const updateStmt = this.db.prepare(`UPDATE zero_sessions SET updated_at = ? WHERE id = ?`);
        updateStmt.run(now, sessionId);
      }
    } else {
      const updateStmt = this.db.prepare(`UPDATE zero_sessions SET updated_at = ? WHERE id = ?`);
      updateStmt.run(now, sessionId);
    }

    const storedMessage = {
      id: msgId,
      sessionId,
      role: message.role || 'user',
      content,
      toolCalls: message.tool_calls || null,
      tool_call_id: message.tool_call_id || undefined,
      createdAt: now,
      seq: nextSeq,
      ...(message.runId ? { runId: message.runId } : {}),
      ...(message.status ? { status: message.status } : {}),
    };

    this.emitEvent(sessionId, 'message:appended', storedMessage);
    return storedMessage;
  }

  getTranscript(sessionId, options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset ?? 0;
    if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(offset) || offset < 0) throw new Error('Transcript limit and offset must be nonnegative integers with a positive limit');
    const stmt = this.db.prepare(`
      SELECT * FROM zero_messages
      WHERE session_id = ? ${options.activeContext ? 'AND context_archived = 0' : ''}
      ORDER BY seq DESC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(sessionId, limit, offset).reverse();
    return rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      tool_calls: r.tool_calls ? JSON.parse(r.tool_calls) : undefined,
      tool_call_id: r.tool_call_id || undefined,
      createdAt: r.created_at,
      seq: r.seq,
      ...(r.run_id ? { runId: r.run_id } : {}),
      ...(r.status ? { status: r.status } : {}),
    }));
  }

  countMessages(sessionId) {
    return Number(this.db.prepare('SELECT COUNT(*) AS count FROM zero_messages WHERE session_id = ?').get(sessionId).count);
  }

  /** Provider context is a projection; incomplete/cancelled tool chains stay in history. */
  getModelContext(sessionId, options = {}) {
    const messages = this.getTranscript(sessionId, { ...options, activeContext: true });
    const context = [];
    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];
      if (message.role === 'tool') continue; // Orphaned by an old schema or a context boundary.
      const projected = { role: message.role, content: message.content };
      if (message.role === 'assistant' && message.tool_calls?.length) {
        const outputs = new Map();
        let end = index + 1;
        while (messages[end]?.role === 'tool') {
          const output = messages[end++];
          if (output.tool_call_id) outputs.set(output.tool_call_id, output);
        }
        const seen = new Set();
        const completed = message.tool_calls.filter(call => {
          if (!call.id || seen.has(call.id) || !outputs.has(call.id)) return false;
          seen.add(call.id);
          return true;
        });
        if (completed.length) {
          context.push({ ...projected, tool_calls: completed });
          for (const call of completed) {
            const output = outputs.get(call.id);
            let content = output.content;
            if (typeof content === 'string' && content.length > 5000) {
              try {
                const parsed = JSON.parse(content);
                const sanitized = JSON.parse(JSON.stringify(parsed, (k, v) => {
                  if (typeof v === 'string' && v.length > 500) {
                    if (k === 'data' || k === 'base64' || k === 'image' || k === 'screenshot' || /^[A-Za-z0-9+/=]{500,}$/.test(v)) {
                      return `[Image Data: ${Math.round(v.length / 1024)} KB base64 payload]`;
                    }
                    if (v.length > 30000) return v.slice(0, 30000) + '... [truncated]';
                  }
                  return v;
                }));
                content = JSON.stringify(sanitized);
              } catch {
                content = content.slice(0, 5000) + '... [truncated]';
              }
            }
            context.push({ role: 'tool', content, tool_call_id: call.id });
          }
        } else if (message.content) context.push(projected);
        index = end - 1;
      } else context.push(projected);
    }
    return context;
  }

  emitEvent(sessionId, type, payload) {
    const now = Date.now();
    const eventId = `evt_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const stmt = this.db.prepare(`
      INSERT INTO zero_events (id, session_id, type, payload, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(eventId, sessionId, type, JSON.stringify(payload), now);

    this.events.emit(`session:${sessionId}`, { id: eventId, sessionId, type, payload, timestamp: now });
    this.events.emit('event', { id: eventId, sessionId, type, payload, timestamp: now });
    return eventId;
  }

  subscribe(sessionId, listener) {
    const channel = `session:${sessionId}`;
    this.events.on(channel, listener);
    return () => this.events.off(channel, listener);
  }

  /**
   * Compaction engine: Keeps the initial system message (if any) and the most recent N messages,
   * summarizing or archiving older turns to prevent token window overflow.
   */
  compactContext(sessionId, retainCount = 10) {
    if (!Number.isInteger(retainCount) || retainCount < 1) throw new Error('retainCount must be a positive integer');
    const messages = this.getTranscript(sessionId, { limit: 2147483647, activeContext: true });
    if (messages.length <= retainCount) {
      return { compacted: false, count: messages.length };
    }

    const previousMarkerId = this.getSession(sessionId)?.metadata?.contextCompaction?.markerId;
    const systemMsgs = messages.filter((m) => m.role === 'system' && m.id !== previousMarkerId);
    const nonSystem = messages.filter((m) => m.role !== 'system');

    if (nonSystem.length <= retainCount) {
      return { compacted: false, count: messages.length };
    }

    let pruneCount = nonSystem.length - retainCount;
    // Never split an assistant/tool exchange at the context boundary.
    while (pruneCount > 0 && nonSystem[pruneCount]?.role === 'tool') pruneCount--;
    if (!pruneCount) return { compacted: false, count: messages.length };
    const pruned = nonSystem.slice(0, pruneCount);
    const retained = nonSystem.slice(pruneCount);

    // Archive only from provider context. Original messages remain readable/exportable.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const archive = this.db.prepare('UPDATE zero_messages SET context_archived = 1 WHERE id = ? AND session_id = ?');
      for (const msg of pruned) archive.run(msg.id, sessionId);
      if (previousMarkerId) archive.run(previousMarkerId, sessionId);
      const marker = this.appendMessage(sessionId, {
        role: 'system',
        content: `[Zero System: Context compacted. ${pruneCount} older messages excluded from model context; originals remain in chat history. This marker is not a summary of their contents.]`,
      });
      this.patchSession(sessionId, { metadata: { contextCompaction: { markerId: marker.id, archivedAt: Date.now() } } });
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }

    return {
      compacted: true,
      prunedCount: pruneCount,
      retainedCount: retained.length + systemMsgs.length + 1,
    };
  }

  close() {
    this.events.removeAllListeners();
    try {
      this.db.close();
    } catch (_) {}
  }
}
