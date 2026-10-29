import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const dbPaths = [
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/zero/agent/openclaw-agent.sqlite',
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/operator/agent/openclaw-agent.sqlite',
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/researcher/agent/openclaw-agent.sqlite'
];

for (const dbPath of dbPaths) {
  if (!fs.existsSync(dbPath)) continue;
  console.log(`[CleanDB] Processing: ${dbPath}`);
  const db = new DatabaseSync(dbPath);

  // Inspect auth_profile_store
  try {
    const cols = db.prepare("PRAGMA table_info(auth_profile_store)").all();
    console.log('  auth_profile_store columns:', cols.map(c => c.name).join(', '));
    const rows = db.prepare("SELECT * FROM auth_profile_store").all();
    console.log('  auth_profile_store rows:', rows);
    for (const r of rows) {
      const s = JSON.stringify(r);
      if (s.includes('nvidia') || s.includes('openrouter')) {
        const pk = cols[0].name;
        db.prepare(`DELETE FROM auth_profile_store WHERE "${pk}" = ?`).run(r[pk]);
        console.log(`  Deleted auth_profile_store row with ${pk}=${r[pk]}`);
      }
    }
  } catch (e) {
    console.warn(`  auth_profile_store: ${e.message}`);
  }

  // Inspect auth_profile_state
  try {
    const cols = db.prepare("PRAGMA table_info(auth_profile_state)").all();
    console.log('  auth_profile_state columns:', cols.map(c => c.name).join(', '));
    const rows = db.prepare("SELECT * FROM auth_profile_state").all();
    console.log('  auth_profile_state rows:', rows);
    for (const r of rows) {
      const s = JSON.stringify(r);
      if (s.includes('nvidia') || s.includes('openrouter')) {
        const pk = cols[0].name;
        db.prepare(`DELETE FROM auth_profile_state WHERE "${pk}" = ?`).run(r[pk]);
        console.log(`  Deleted auth_profile_state row with ${pk}=${r[pk]}`);
      }
    }
  } catch (e) {
    console.warn(`  auth_profile_state: ${e.message}`);
  }

  // 3. Clean session_nodes
  try {
    const rows = db.prepare("SELECT session_key, entry_json FROM session_nodes").all();
    let updatedCount = 0;
    for (const row of rows) {
      if (typeof row.entry_json === 'string' && (row.entry_json.includes('nvidia') || row.entry_json.includes('openrouter') || row.entry_json.includes('nemotron'))) {
        try {
          const entry = JSON.parse(row.entry_json);
          let modified = false;
          if (entry.providerOverride === 'nvidia' || entry.providerOverride === 'openrouter') {
            delete entry.providerOverride;
            modified = true;
          }
          if (entry.modelOverride && (entry.modelOverride.includes('nvidia') || entry.modelOverride.includes('openrouter') || entry.modelOverride.includes('nemotron'))) {
            delete entry.modelOverride;
            modified = true;
          }
          if (entry.modelProvider === 'nvidia' || entry.modelProvider === 'openrouter') {
            delete entry.modelProvider;
            modified = true;
          }
          if (modified) {
            db.prepare("UPDATE session_nodes SET entry_json = ? WHERE session_key = ?").run(JSON.stringify(entry), row.session_key);
            updatedCount++;
          }
        } catch (_) {}
      }
    }
    console.log(`  session_nodes updated: ${updatedCount} rows`);
  } catch (e) {
    console.warn(`  session_nodes: ${e.message}`);
  }

  // 4. Clean session_windows
  try {
    const rows = db.prepare("SELECT * FROM session_windows").all();
    let delCount = 0;
    for (const r of rows) {
      const s = JSON.stringify(r);
      if (s.includes('nvidia') || s.includes('nemotron') || s.includes('openrouter')) {
        db.prepare("DELETE FROM session_windows WHERE session_id = ?").run(r.session_id);
        delCount++;
      }
    }
    console.log(`  session_windows purged: ${delCount} rows`);
  } catch (e) {
    console.warn(`  session_windows: ${e.message}`);
  }

  // 5. Clean transcript_events
  try {
    const rows = db.prepare("SELECT session_id, seq, event_json FROM transcript_events").all();
    let delCount = 0;
    for (const r of rows) {
      const s = typeof r.event_json === 'string' ? r.event_json : '';
      if (s.includes('nvidia') || s.includes('nemotron') || s.includes('openrouter')) {
        db.prepare("DELETE FROM transcript_events WHERE session_id = ? AND seq = ?").run(r.session_id, r.seq);
        delCount++;
      }
    }
    console.log(`  transcript_events purged: ${delCount} rows`);
  } catch (e) {
    console.warn(`  transcript_events: ${e.message}`);
  }

  // 6. Clean trajectory_runtime_events
  try {
    const rows = db.prepare("SELECT session_id, seq, event_json FROM trajectory_runtime_events").all();
    let delCount = 0;
    for (const r of rows) {
      const s = typeof r.event_json === 'string' ? r.event_json : '';
      if (s.includes('nvidia') || s.includes('nemotron') || s.includes('openrouter')) {
        db.prepare("DELETE FROM trajectory_runtime_events WHERE session_id = ? AND seq = ?").run(r.session_id, r.seq);
        delCount++;
      }
    }
    console.log(`  trajectory_runtime_events purged: ${delCount} rows`);
  } catch (e) {
    console.warn(`  trajectory_runtime_events: ${e.message}`);
  }

  db.close();
}
console.log('[CleanDB] Finished SQLite database cleanup.');

