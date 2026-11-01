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
  }

  createSession(id, title = 'New Conversation', metadata = {}) {
    const now = Date.now();
    const sessionId = id || `session_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const stmt = this.db.prepare(`
      INSERT INTO zero_sessions (id, title, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(sessionId, title, now, now, JSON.stringify(metadata));
    return this.getSession(sessionId);
  }

  getSession(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_sessions WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata,
      involvement: metadata.involvement,
    };
  }

  listSessions(limit = 50, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM zero_messages m WHERE m.session_id = s.id) AS messages_count,
        (SELECT m.content FROM zero_messages m WHERE m.session_id = s.id ORDER BY m.seq DESC LIMIT 1) AS last_message
      FROM zero_sessions s
      ORDER BY s.updated_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(limit, offset);
    return rows.map((r) => {
      const meta = r.metadata ? JSON.parse(r.metadata) : {};
      return {
        key: r.id,
        id: r.id,
        agentId: meta.agentId || 'zero',
        title: r.title,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        messagesCount: Number(r.messages_count || 0),
        lastMessage: r.last_message || '',
        metadata: meta,
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
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE zero_sessions SET title = ?, metadata = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(title, JSON.stringify(metadata), now, id);
    return this.getSession(id);
  }

  deleteSession(id) {
    const stmt = this.db.prepare(`DELETE FROM zero_sessions WHERE id = ?`);
    stmt.run(id);
    return true;
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
    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content || '');
    const toolCalls = message.tool_calls ? JSON.stringify(message.tool_calls) : null;

    const insertStmt = this.db.prepare(`
      INSERT INTO zero_messages (id, session_id, role, content, tool_calls, created_at, seq)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(msgId, sessionId, message.role || 'user', content, toolCalls, now, nextSeq);

    // Update session updated_at
    const updateStmt = this.db.prepare(`UPDATE zero_sessions SET updated_at = ? WHERE id = ?`);
    updateStmt.run(now, sessionId);

    const storedMessage = {
      id: msgId,
      sessionId,
      role: message.role || 'user',
      content,
      toolCalls: message.tool_calls || null,
      createdAt: now,
      seq: nextSeq,
    };

    this.emitEvent(sessionId, 'message:appended', storedMessage);
    return storedMessage;
  }

  getTranscript(sessionId, options = {}) {
    const limit = options.limit || 100;
    const stmt = this.db.prepare(`
      SELECT * FROM zero_messages
      WHERE session_id = ?
      ORDER BY seq ASC
      LIMIT ?
    `);
    const rows = stmt.all(sessionId, limit);
    return rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      tool_calls: r.tool_calls ? JSON.parse(r.tool_calls) : undefined,
      createdAt: r.created_at,
      seq: r.seq,
    }));
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
    const messages = this.getTranscript(sessionId, { limit: 1000 });
    if (messages.length <= retainCount) {
      return { compacted: false, count: messages.length };
    }

    const systemMsgs = messages.filter((m) => m.role === 'system');
    const nonSystem = messages.filter((m) => m.role !== 'system');

    if (nonSystem.length <= retainCount) {
      return { compacted: false, count: messages.length };
    }

    const pruneCount = nonSystem.length - retainCount;
    const pruned = nonSystem.slice(0, pruneCount);
    const retained = nonSystem.slice(pruneCount);

    // Delete pruned messages from database
    const deleteStmt = this.db.prepare(`DELETE FROM zero_messages WHERE id = ?`);
    for (const msg of pruned) {
      deleteStmt.run(msg.id);
    }

    // Insert a compact summary marker
    const summaryText = `[Zero System: Context compacted. ${pruneCount} older turns archived.]`;
    this.appendMessage(sessionId, {
      role: 'system',
      content: summaryText,
    });

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
