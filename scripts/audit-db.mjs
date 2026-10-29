import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const dbs = [
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/zero/agent/openclaw-agent.sqlite',
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/operator/agent/openclaw-agent.sqlite',
  'E:/zero/.zero-data/fresh-workspace/gateway-state/agents/researcher/agent/openclaw-agent.sqlite'
];

const uniqueDbs = dbs.filter(p => fs.existsSync(p));

for (const dbPath of uniqueDbs) {
  console.log('--- Checking:', dbPath);
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name).join(', '));
  for (const table of tables) {
    try {
      const rows = db.prepare(`SELECT * FROM "${table.name}"`).all();
      for (const row of rows) {
        const str = JSON.stringify(row);
        const lower = str.toLowerCase();
        if (lower.includes('nvidia') || lower.includes('openrouter') || lower.includes('nemotron')) {
          console.log(`  Match in [${table.name}]:`, str.slice(0, 200));
        }
      }
    } catch (e) {
      console.error('Error reading', table.name, e.message);
    }
  }
  db.close();
}
