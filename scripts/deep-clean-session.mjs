import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const dbPaths = [
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/zero/agent/openclaw-agent.sqlite',
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/operator/agent/openclaw-agent.sqlite',
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/researcher/agent/openclaw-agent.sqlite'
];

for (const dbPath of dbPaths) {
  if (!fs.existsSync(dbPath)) continue;
  const db = new DatabaseSync(dbPath);

  // 1. Clean session_nodes
  const nodes = db.prepare("SELECT session_key, entry_json FROM session_nodes").all();
  for (const node of nodes) {
    if (!node.entry_json) continue;
    try {
      const entry = JSON.parse(node.entry_json);
      let changed = false;

      for (const field of ['model', 'modelOverride', 'providerOverride', 'modelProvider', 'modelOverrideSource', 'modelOverrideRouteResolution']) {
        if (entry[field] && (typeof entry[field] === 'string' && (entry[field].includes('nvidia') || entry[field].includes('openrouter') || entry[field].includes('nemotron')))) {
          delete entry[field];
          changed = true;
        }
      }

      if (entry.contextBudgetStatus && typeof entry.contextBudgetStatus === 'object') {
        const s = JSON.stringify(entry.contextBudgetStatus);
        if (s.includes('nvidia') || s.includes('openrouter') || s.includes('nemotron')) {
          delete entry.contextBudgetStatus;
          changed = true;
        }
      }

      if (entry.lastRunError && typeof entry.lastRunError === 'string' && entry.lastRunError.includes('nvidia')) {
        delete entry.lastRunError;
        changed = true;
      }

      if (changed) {
        db.prepare("UPDATE session_nodes SET entry_json = ? WHERE session_key = ?").run(JSON.stringify(entry), node.session_key);
        console.log(`[DeepClean] Cleared model overrides from ${node.session_key} in ${dbPath}`);
      }
    } catch (e) {
      console.warn('Error parsing node:', e);
    }
  }

  // 2. Clean session_entry_snapshots
  try {
    const snaps = db.prepare("SELECT session_key, field, value_json FROM session_entry_snapshots").all();
    for (const snap of snaps) {
      if (snap.value_json && (snap.value_json.includes('nvidia') || snap.value_json.includes('nemotron') || snap.value_json.includes('openrouter'))) {
        db.prepare("DELETE FROM session_entry_snapshots WHERE session_key = ? AND field = ?").run(snap.session_key, snap.field);
        console.log(`[DeepClean] Deleted snapshot ${snap.field} for ${snap.session_key}`);
      }
    }
  } catch (e) {
    console.warn('Error in snapshots:', e);
  }

  db.close();
}
console.log('[DeepClean] Completed deep clean.');
