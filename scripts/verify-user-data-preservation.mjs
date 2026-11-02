/** INTEGRATION: compare original SQLite rows after an upgrade, never print their contents. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--backup') throw new Error('Usage: node scripts/verify-user-data-preservation.mjs --backup directory');
const directory = path.resolve(root, args[1]);
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
const quote = name => `"${name.replaceAll('"', '""')}"`;
const report = { classification: 'INTEGRATION', status: 'RUNNING', backup: directory, checkedAt: new Date().toISOString(), tables: [],
  scope: 'Original logical data preserved across schema upgrade; allows added rows/columns and monotonic scheduler clocks; not a clean-machine full restore test' };
function multiset(db, table, columns) {
  const statement = db.prepare(`SELECT ${columns.map(quote).join(',')} FROM ${quote(table)}`);
  statement.setReadBigInts(true);
  const counts = new Map();
  let rows = 0;
  for (const row of statement.iterate()) {
    const values = columns.map(column => {
      const value = row[column];
      return value instanceof Uint8Array ? ['bytes', Buffer.from(value).toString('base64')] : [typeof value, typeof value === 'bigint' ? String(value) : value];
    });
    const digest = crypto.createHash('sha256').update(JSON.stringify(values)).digest('hex');
    counts.set(digest, (counts.get(digest) || 0) + 1); rows++;
  }
  return { counts, rows };
}
try {
  for (const file of manifest.files.filter(item => /\.(sqlite|db)$/.test(item.file))) {
    const baseline = new DatabaseSync(path.join(directory, file.file), { readOnly: true });
    const currentPath = manifest.stateDirectory && file.file.startsWith('.zero-data') ? path.join(manifest.stateDirectory, path.basename(file.file)) : path.join(root, file.file);
    const current = new DatabaseSync(currentPath, { readOnly: true });
    try {
      const tables = baseline.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      for (const { name } of tables) {
        const runtimeColumns = name === 'zero_cron_jobs' && /zero-automation\.sqlite$/.test(file.file) ? ['last_run', 'next_run']
          : name === 'zero_connectors' && /zero-event-automation\.sqlite$/.test(file.file) ? ['updated_at']
            : name === 'zero_workers' && /zero-workspaces\.sqlite$/.test(file.file) ? ['last_heartbeat'] : [];
        const columns = baseline.prepare(`PRAGMA table_info(${quote(name)})`).all().map(column => column.name).filter(column => !runtimeColumns.includes(column));
        const before = multiset(baseline, name, columns);
        const after = multiset(current, name, columns);
        let missingOrChangedRows = 0;
        for (const [hash, count] of before.counts) missingOrChangedRows += Math.max(0, count - (after.counts.get(hash) || 0));
        for (const column of runtimeColumns) {
          for (const row of baseline.prepare(`SELECT id, ${quote(column)} AS clock FROM ${quote(name)}`).iterate()) {
            const updated = current.prepare(`SELECT ${quote(column)} AS clock FROM ${quote(name)} WHERE id=?`).get(row.id);
            if (!updated || (row.clock !== null && (updated.clock === null || updated.clock < row.clock))) missingOrChangedRows++;
          }
        }
        report.tables.push({ file: file.file, table: name, beforeRows: before.rows, afterRows: after.rows, originalColumns: columns.length + runtimeColumns.length,
          ...(runtimeColumns.length ? { monotonicRuntimeColumns: runtimeColumns } : {}),
          missingOrChangedRows, status: missingOrChangedRows ? 'FAIL' : 'PASS' });
      }
    } finally { baseline.close(); current.close(); }
  }
  report.status = report.tables.length && report.tables.every(table => table.status === 'PASS') ? 'PASS' : 'FAIL';
} catch (error) { report.status = 'FAIL'; report.error = error.message; }
const output = path.join(root, 'artifacts/user-data-preservation', `${Date.now()}.json`);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, tables: report.tables.length, originalRows: report.tables.reduce((total, table) => total + table.beforeRows, 0),
  failures: report.tables.filter(table => table.status === 'FAIL'), error: report.error, output }, null, 2));
process.exitCode = report.status === 'PASS' ? 0 : 1;
