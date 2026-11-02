import fs from 'node:fs';
import path from 'node:path';
import { LABELS, sha256 } from './classification-core.mjs';

export function validateRunnerCatalog(root) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/engineering/verification/runner-classification-inventory.json'), 'utf8'));
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.runners)) throw new Error('Invalid runner catalog schema');
  const actual = fs.readdirSync(path.join(root, 'scripts')).filter(name => /^(verify-.*|functional-browser-check|screen-intelligence-real-os|screen-intelligence-endurance)\.mjs$/.test(name)).map(name => `scripts/${name}`).sort();
  if (JSON.stringify(catalog.runners.map(row => row.file).sort()) !== JSON.stringify(actual)) throw new Error('Acceptance runner catalog coverage drift');
  for (const row of catalog.runners) {
    if (!actual.includes(row.file) || row.sha256 !== sha256(fs.readFileSync(path.join(root, row.file), 'utf8'))) throw new Error(`Acceptance runner source drift: ${row.file}`);
    if (!row.labels?.length || row.labels.some(label => !LABELS.includes(label)) || new Set(row.labels).size !== row.labels.length || !row.scope || !Array.isArray(row.modes) || row.execution !== 'NOT_RUN_BY_INVENTORY') throw new Error(`Invalid classification for ${row.file}`);
  }
  return catalog;
}
