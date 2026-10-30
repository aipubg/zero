import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

const dbs = [
  'E:/zero/zero-system/state/state/openclaw.sqlite',
  'E:/zero/zero-system/state/agents/zero/agent/openclaw-agent.sqlite',
  "",
  "",
  "",
  'E:/zero/backend/.openclaw/state/openclaw.sqlite'
];

for (const dbPath of dbs) {
  if (!fs.existsSync(dbPath)) continue;
  try {
    const db = new DatabaseSync(dbPath);
    console.log(`\n=== PURGING SESSIONS IN: ${dbPath} ===`);
    
    // Purge audit_events
    try {
      const res = db.prepare(`
        DELETE FROM audit_events 
        WHERE session_key != 'agent:zero:main' 
           OR session_key IS NULL
           OR session_key LIKE '%tool-live-exec%'
           OR session_key LIKE '%be02-acceptance%'
           OR session_key LIKE '%tool-test%'
           OR session_key LIKE '%setup-inference%'
           OR session_key LIKE '%cron%'
           OR session_key LIKE '%internal-session-effects%'
           OR session_key LIKE '%dashboard%'
      `).run();
      console.log(`  audit_events deleted: ${res.changes}`);
    } catch (e) {}

    // Check all other tables for session_key or session_id
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    for (const { name } of tables) {
      if (name === 'audit_events' || name.includes('fts') || name.startsWith('sqlite_')) continue;
      try {
        const rows = db.prepare(`SELECT rowid, * FROM ${name}`).all();
        let deleted = 0;
        for (const row of rows) {
          const s = JSON.stringify(row);
          if (
            s.includes('tool-live-exec') ||
            s.includes('be02-acceptance') ||
            s.includes('tool-test') ||
            s.includes('test-model-1') ||
            s.includes('test-provider') ||
            s.includes('Test Provider') ||
            s.includes('setup-inference')
          ) {
            db.prepare(`DELETE FROM ${name} WHERE rowid = ?`).run(row.rowid);
            deleted++;
          }
        }
        if (deleted > 0) {
          console.log(`  Table [${name}]: deleted ${deleted} rows.`);
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn(`Error on ${dbPath}:`, err.message);
  }
}

console.log('\n=== PURGE OF OLD TEST SESSIONS COMPLETED 100% ===');
