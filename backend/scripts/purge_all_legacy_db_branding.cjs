const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

function sanitizeDatabases() {
  console.log('=== Purging legacy OpenClaw / lobster branding from SQLite databases ===');

  // 1. Clean openclaw.sqlite
  const sysDbPath = 'E:/zero/zero-system/state/state/openclaw.sqlite';
  if (fs.existsSync(sysDbPath)) {
    const db = new DatabaseSync(sysDbPath);
    try {
      // Fix tab icon in user_preferences
      db.prepare("UPDATE user_preferences SET value_json = '\"zero\"' WHERE pref_key = 'ui.tabIcon'").run();
      console.log('✔ Updated ui.tabIcon in user_preferences to "zero"');

      // Clear clawhub snapshots
      db.prepare("DELETE FROM official_external_plugin_catalog_snapshots").run();
      console.log('✔ Purged official_external_plugin_catalog_snapshots');

      // Clean workspace paths
      db.prepare("DELETE FROM workspace_setup_state WHERE workspace_path LIKE '%.openclaw%'").run();
      db.prepare("DELETE FROM workspace_path_aliases WHERE alias_path LIKE '%.openclaw%'").run();
      db.prepare("DELETE FROM config_health_entries WHERE config_path LIKE '%openclaw%'").run();
      console.log('✔ Purged openclaw workspace and config health paths');

      // Clean stale session state heads / events for non-zero agents
      db.prepare("DELETE FROM session_state_heads WHERE agent_id != 'zero'").run();
      db.prepare("DELETE FROM session_state_events WHERE agent_id != 'zero'").run();
      console.log('✔ Purged non-zero agent session heads');
    } catch (e) {
      console.error('Error in sysDb:', e.message);
    }
    db.close();
  }

  // 2. Clean openclaw-agent.sqlite for agent zero
  const agentDbPath = 'E:/zero/zero-system/state/agents/zero/agent/openclaw-agent.sqlite';
  if (fs.existsSync(agentDbPath)) {
    const db = new DatabaseSync(agentDbPath);
    try {
      // Sanitize session_nodes entry_json
      const nodes = db.prepare("SELECT session_key, entry_json FROM session_nodes").all();
      for (const node of nodes) {
        if (node.entry_json && (node.entry_json.includes('openclaw') || node.entry_json.includes('activeWriterRunId'))) {
          let cleaned = node.entry_json.replaceAll('openclaw', 'zero');
          try {
            const parsed = JSON.parse(cleaned);
            parsed.activeWriterRunId = null;
            parsed.status = 'done';
            cleaned = JSON.stringify(parsed);
          } catch {}
          db.prepare("UPDATE session_nodes SET entry_json = ? WHERE session_key = ?").run(cleaned, node.session_key);
        }
      }
      console.log('✔ Cleaned session_nodes in agent db');

      // Remove heartbeat poll events and test sessions
      db.prepare("DELETE FROM transcript_events WHERE event_json LIKE '%[OpenClaw heartbeat poll]%'").run();
      db.prepare("DELETE FROM transcript_events WHERE event_json LIKE '%tool-live-exec%' OR event_json LIKE '%be02-acceptance%'").run();
      console.log('✔ Purged OpenClaw heartbeat polls and test session events');

      // Sanitize remaining events to replace openclaw with zero
      const events = db.prepare("SELECT session_id, seq, event_json FROM transcript_events WHERE event_json LIKE '%openclaw%'").all();
      for (const ev of events) {
        const cleaned = ev.event_json.replaceAll('openclaw:', 'zero:').replaceAll('openclaw', 'zero').replaceAll('OpenClaw', 'Zero');
        db.prepare("UPDATE transcript_events SET event_json = ? WHERE session_id = ? AND seq = ?").run(cleaned, ev.session_id, ev.seq);
      }
      console.log(`✔ Sanitized ${events.length} remaining transcript events`);
    } catch (e) {
      console.error('Error in agentDb:', e.message);
    }
    db.close();
  }

  console.log('=== Database Purge Complete ===');
}

sanitizeDatabases();
