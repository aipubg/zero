import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const DEFAULT_OBSERVATION_RETENTION_MS = 7 * 24 * 60 * 60_000;
export const DEFAULT_WORKFLOW_RETENTION_MS = 30 * 24 * 60 * 60_000;
export const DEFAULT_MAX_OBSERVATION_ROWS = 10_000;
export const DEFAULT_PRUNE_BATCH = 500;

const SCHEMA = `
PRAGMA secure_delete = ON;
CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  captured_at_ms INTEGER NOT NULL,
  app TEXT NOT NULL DEFAULT '',
  window TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'none',
  confidence REAL NOT NULL DEFAULT 0,
  text_length INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS observations_captured_at ON observations(captured_at_ms);
CREATE TABLE IF NOT EXISTS workflow_patterns (
  key TEXT PRIMARY KEY,
  app TEXT NOT NULL DEFAULT '',
  window TEXT NOT NULL DEFAULT '',
  evidence_count INTEGER NOT NULL DEFAULT 1,
  confidence REAL NOT NULL DEFAULT 0,
  first_seen_ms INTEGER NOT NULL,
  last_seen_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS important_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_id INTEGER,
  created_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);
`;

function cap(value, max) {
  const text = String(value ?? "").trim();
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * Durable observation summaries only. Raw frames and image buffers are never
 * passed to this store; Private Mode does not need to erase durable summaries,
 * but the owner can delete them explicitly.
 */
export function createObservationStore({
  dbPath = ":memory:",
  maxSummaryChars = 4_000,
  observationRetentionMs = DEFAULT_OBSERVATION_RETENTION_MS,
  workflowRetentionMs = DEFAULT_WORKFLOW_RETENTION_MS,
  maxObservationRows = DEFAULT_MAX_OBSERVATION_ROWS,
  pruneBatch = DEFAULT_PRUNE_BATCH,
  clock = Date.now,
} = {}) {
  let db = null;
  let opened = false;

  const ensureOpen = () => {
    if (db) return db;
    if (dbPath !== ":memory:") {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    db = new DatabaseSync(dbPath);
    db.exec(SCHEMA);
    opened = true;
    return db;
  };

  const insertObservation = (observation) => {
    const database = ensureOpen();
    const capturedAtMs = Number.isFinite(observation?.capturedAtMs)
      ? observation.capturedAtMs
      : clock();
    const summary = cap(observation?.summary, maxSummaryChars);
    database
      .prepare(
        `INSERT INTO observations
          (captured_at_ms, app, window, summary, source, confidence, text_length)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        capturedAtMs,
        cap(observation?.app, 200),
        cap(observation?.window, 300),
        summary,
        cap(observation?.source, 32) || "none",
        Number.isFinite(observation?.confidence) ? observation.confidence : 0,
        Number.isInteger(observation?.textLength) ? observation.textLength : summary.length,
      );
    return { ok: true, capturedAtMs };
  };

  const recent = ({ limit = 20, sinceMs = null, query = "" } = {}) => {
    const database = ensureOpen();
    const boundedLimit = Math.min(50, Math.max(1, Number.isInteger(limit) ? limit : 20));
    const params = [];
    const where = [];
    if (Number.isFinite(sinceMs)) {
      where.push("captured_at_ms >= ?");
      params.push(sinceMs);
    }
    const text = cap(query, 120);
    if (text) {
      where.push("(summary LIKE ? OR app LIKE ? OR window LIKE ?)");
      params.push(`%${text}%`, `%${text}%`, `%${text}%`);
    }
    const sql = `SELECT id, captured_at_ms, app, window, summary, source, confidence, text_length
      FROM observations ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY captured_at_ms DESC LIMIT ?`;
    params.push(boundedLimit);
    return database.prepare(sql).all(...params);
  };

  const prune = ({
    beforeMs = null,
    workflowBeforeMs = null,
    limit = pruneBatch,
    now = clock(),
  } = {}) => {
    const database = ensureOpen();
    const boundedLimit = Math.min(5_000, Math.max(1, Number.isInteger(limit) ? limit : pruneBatch));
    const cutoff = Number.isFinite(beforeMs)
      ? beforeMs
      : now - Math.max(0, observationRetentionMs);
    const workflowCutoff = Number.isFinite(workflowBeforeMs)
      ? workflowBeforeMs
      : now - Math.max(0, workflowRetentionMs);
    const observations = database
      .prepare(
        `DELETE FROM observations WHERE id IN (
          SELECT id FROM observations WHERE captured_at_ms < ? ORDER BY captured_at_ms ASC LIMIT ?
        )`,
      )
      .run(cutoff, boundedLimit);
    let deleted = Number(observations.changes ?? 0);
    const count = Number(database.prepare("SELECT COUNT(*) AS n FROM observations").get().n ?? 0);
    if (count > maxObservationRows && deleted < boundedLimit) {
      const excess = Math.min(count - maxObservationRows, boundedLimit - deleted);
      if (excess > 0) {
        const over = database
          .prepare(
            `DELETE FROM observations WHERE id IN (
              SELECT id FROM observations ORDER BY captured_at_ms ASC LIMIT ?
            )`,
          )
          .run(excess);
        deleted += Number(over.changes ?? 0);
      }
    }
    const workflows = database
      .prepare(
        `DELETE FROM workflow_patterns WHERE key IN (
          SELECT key FROM workflow_patterns WHERE last_seen_ms < ? ORDER BY last_seen_ms ASC LIMIT ?
        )`,
      )
      .run(workflowCutoff, boundedLimit);
    const snapshots = database
      .prepare(
        `DELETE FROM important_snapshots WHERE id IN (
          SELECT id FROM important_snapshots WHERE expires_at_ms < ? LIMIT ?
        )`,
      )
      .run(now, boundedLimit);
    const remaining = Number(database.prepare("SELECT COUNT(*) AS n FROM observations").get().n ?? 0);
    return {
      ok: true,
      deleted,
      workflowDeleted: Number(workflows.changes ?? 0),
      snapshotsDeleted: Number(snapshots.changes ?? 0),
      totalDeleted:
        deleted + Number(workflows.changes ?? 0) + Number(snapshots.changes ?? 0),
      more: remaining > maxObservationRows || deleted >= boundedLimit,
      remaining,
      cutoff,
      workflowCutoff,
    };
  };

  const deleteAll = () => {
    const database = ensureOpen();
    const result = database.prepare("DELETE FROM observations").run();
    database.prepare("DELETE FROM workflow_patterns").run();
    database.prepare("DELETE FROM important_snapshots").run();
    return { ok: true, deleted: Number(result.changes ?? 0) };
  };

  const recordWorkflowCandidate = ({ key, app = "", window = "", evidenceCount = 1, confidence = 0 } = {}) => {
    if (typeof key !== "string" || !key.trim()) return { ok: false, reason: "key-required" };
    const database = ensureOpen();
    const now = clock();
    database
      .prepare(
        `INSERT INTO workflow_patterns
          (key, app, window, evidence_count, confidence, first_seen_ms, last_seen_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           app = excluded.app,
           window = excluded.window,
           evidence_count = MAX(workflow_patterns.evidence_count, excluded.evidence_count),
           confidence = MAX(workflow_patterns.confidence, excluded.confidence),
           last_seen_ms = excluded.last_seen_ms`,
      )
      .run(
        cap(key, 300),
        cap(app, 200),
        cap(window, 300),
        Math.max(1, Number.isInteger(evidenceCount) ? evidenceCount : 1),
        Number.isFinite(confidence) ? confidence : 0,
        now,
        now,
      );
    return { ok: true };
  };

  const listWorkflowCandidates = ({ limit = 20 } = {}) => {
    const database = ensureOpen();
    return database
      .prepare(
        `SELECT key, app, window, evidence_count, confidence, first_seen_ms, last_seen_ms
         FROM workflow_patterns ORDER BY last_seen_ms DESC LIMIT ?`,
      )
      .all(Math.min(50, Math.max(1, Number.isInteger(limit) ? limit : 20)));
  };

  const stats = () => {
    if (!opened && dbPath !== ":memory:" && fs.existsSync(dbPath)) {
      ensureOpen();
    }
    if (!opened) {
      return { opened: false, observations: 0, workflowCandidates: 0, importantSnapshots: 0, dbPath };
    }
    const database = ensureOpen();
    const count = (table) => Number(database.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n ?? 0);
    return {
      opened: true,
      observations: count("observations"),
      workflowCandidates: count("workflow_patterns"),
      importantSnapshots: count("important_snapshots"),
      dbPath,
      observationRetentionMs,
      workflowRetentionMs,
      maxObservationRows,
      pruneBatch,
    };
  };

  const close = () => {
    try {
      db?.close?.();
    } catch {
      // ignore
    }
    db = null;
    opened = false;
  };

  return {
    insertObservation,
    recent,
    prune,
    deleteAll,
    recordWorkflowCandidate,
    listWorkflowCandidates,
    stats,
    close,
    get opened() {
      return opened;
    },
  };
}
