import crypto from 'node:crypto';

/** Durable retry identity. Interrupted execution is never silently repeated. */
export function createAssistantReceipts(db) {
  const active = new Map();
  const executeOnce = function(options, execute) {
    const runId = options.runId || crypto.randomUUID();
    if (typeof runId !== 'string' || !runId.trim() || runId.length > 256) return Promise.reject(new Error('Invalid assistant request id'));
    const sessionId = options.sessionKey;
    const key = JSON.stringify([sessionId, runId]);
    const inputHash = crypto.createHash('sha256').update(JSON.stringify([options.userContent, options.model ?? null, options.source ?? 'chat'])).digest('hex');
    const existing = db.prepare('SELECT * FROM zero_assistant_receipts WHERE session_id=? AND run_id=?').get(sessionId, runId);
    if (existing) {
      if (existing.input_hash !== inputHash) return Promise.reject(new Error('Assistant request id was reused with different input'));
      if (active.has(key)) return active.get(key);
      if (existing.status === 'completed') return Promise.resolve(JSON.parse(existing.result_json));
      return Promise.reject(new Error(existing.error || `Previous execution was interrupted${existing.task_id ? ` (task ${existing.task_id})` : ''}; inspect its task before explicitly retrying with a new request id`));
    }
    const now = Date.now();
    db.prepare("INSERT INTO zero_assistant_receipts(session_id,run_id,input_hash,status,created_at,updated_at) VALUES(?,?,?,'running',?,?)").run(sessionId, runId, inputHash, now, now);
    const pending = Promise.resolve().then(() => execute({ ...options, runId })).then(result => {
      db.prepare("UPDATE zero_assistant_receipts SET status='completed',result_json=?,updated_at=? WHERE session_id=? AND run_id=?")
        .run(JSON.stringify(result), Date.now(), sessionId, runId);
      return result;
    }, error => {
      db.prepare("UPDATE zero_assistant_receipts SET status='failed',error=?,updated_at=? WHERE session_id=? AND run_id=?")
        .run(error.message, Date.now(), sessionId, runId);
      throw error;
    }).finally(() => active.delete(key));
    active.set(key, pending);
    return pending;
  };
  executeOnce.recoverInterrupted = () => {
    if (active.size) throw new Error('Cannot recover receipts while requests are active');
    return db.prepare("UPDATE zero_assistant_receipts SET status='interrupted',updated_at=? WHERE status='running'").run(Date.now());
  };
  return executeOnce;
}
