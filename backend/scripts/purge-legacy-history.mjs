import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

const dbs = [
  "E:/zero/zero-system/state/state/openclaw.sqlite",
  "E:/zero/zero-system/state/agents/zero/agent/openclaw-agent.sqlite",
  "",
  "",
];

for (const dbPath of dbs) {
  if (!fs.existsSync(dbPath)) continue;
  console.log("Cleaning database:", dbPath);
  try {
    const db = new DatabaseSync(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

    if (tables.includes("audit_events")) {
      const res = db.prepare(`
        DELETE FROM audit_events 
        WHERE source_id LIKE '%doctor%' 
           OR source_id LIKE '%openclaw%' 
           OR action LIKE '%openclaw%' 
           OR tool_name LIKE '%openclaw%'
      `).run();
      console.log(`  audit_events rows deleted:`, res.changes);
    }

    if (tables.includes("operator_approvals")) {
      const res = db.prepare("DELETE FROM operator_approvals").run();
      console.log(`  operator_approvals cleared:`, res.changes);
    }

    if (tables.includes("exec_approvals_config")) {
      const res = db.prepare("DELETE FROM exec_approvals_config").run();
      console.log(`  exec_approvals_config cleared:`, res.changes);
    }

    if (tables.includes("session_transcript_fts")) {
      const res = db.prepare(`
        DELETE FROM session_transcript_fts 
        WHERE text LIKE '%Hi, I%m OpenClaw%'
           OR text LIKE '%caretaker of this gateway%'
           OR text LIKE '%OpenClaw 2026%'
           OR text LIKE '%OpenClaw requires working inference%'
           OR text LIKE '%OpenClaw heartbeat poll%'
           OR text LIKE '%zero-gateway/default%'
           OR text LIKE '%the config was edited outside OpenClaw%'
      `).run();
      console.log(`  session_transcript_fts greetings deleted:`, res.changes);
    }

    if (tables.includes("session_nodes")) {
      const res = db.prepare(`
        DELETE FROM session_nodes 
        WHERE session_key LIKE '%caretaker%' 
           OR session_key LIKE '%main%'
           OR session_key LIKE '%dashboard%'
      `).run();
      console.log(`  session_nodes cleaned:`, res.changes);
    }

    if (tables.includes("diagnostic_events")) {
      const res = db.prepare(`
        DELETE FROM diagnostic_events 
        WHERE payload_json LIKE '%openclaw%' 
           OR payload_json LIKE '%node_modules%'
      `).run();
      console.log(`  diagnostic_events cleaned:`, res.changes);
    }

    if (tables.includes("task_runs")) {
      const res = db.prepare(`
        DELETE FROM task_runs 
        WHERE source_id LIKE '%openclaw%' 
           OR source_id LIKE '%doctor%'
      `).run();
      console.log(`  task_runs cleaned:`, res.changes);
    }

  } catch (err) {
    console.error(`  Error cleaning ${dbPath}:`, err.message);
  }
}

console.log("Database purge finished cleanly!");
