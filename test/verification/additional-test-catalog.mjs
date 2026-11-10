import fs from 'node:fs';
import path from 'node:path';
import { LABELS, sourceSha256 } from './classification-core.mjs';

export const canonicalSourceHash = sourceSha256;

export function listTestSources(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ['node_modules', 'dist', 'build', 'artifacts'].includes(entry.name)) continue;
      const relative = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Unexpected test-tree symlink: ${relative}`);
      if (entry.isDirectory()) visit(relative);
      else if (/\.test\.(?:mjs|js|ts)$/.test(entry.name)) files.push(relative);
    }
  }
  for (const directory of ['test', 'packages', 'app', 'backend']) if (fs.existsSync(path.join(root, directory))) visit(directory);
  return files.sort();
}

// Only the literal declarations in explicitly reviewed files are supported.
// Unreviewed syntax is never assigned an inferred classification or leaf count.
export function reviewedDeclarations(source) {
  return [...source.matchAll(/^[ \t]*(?:await[ \t]+)?(?:test|t\.test|describe|it)\((?:'([^'\\\r\n]+)'|"([^"\\\r\n]+)")\s*,/gm)]
    .map(match => ({ title: match[1] ?? match[2], line: source.slice(0, match.index).split('\n').length }));
}

export function validateAdditionalTestCatalog(root, legacyFiles = []) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/engineering/verification/additional-test-classification-inventory.json'), 'utf8'));
  if (catalog.schemaVersion !== 1 || catalog.hashEncoding !== 'UTF8_LF' || !Array.isArray(catalog.entries)) throw new Error('Invalid additional test catalog');
  const allFiles = listTestSources(root);
  const actual = allFiles.filter(file => !legacyFiles.includes(file));
  const files = catalog.entries.map(entry => entry.file);
  if (new Set(files).size !== files.length || JSON.stringify([...files].sort()) !== JSON.stringify(actual)) throw new Error('Additional test coverage drift');
  for (const entry of catalog.entries) {
    const source = fs.readFileSync(path.join(root, entry.file), 'utf8');
    if (entry.sha256 !== canonicalSourceHash(source)) throw new Error(`Additional test source drift: ${entry.file}`);
    if (entry.execution !== 'NOT_RUN_BY_INVENTORY' || typeof entry.scope !== 'string' || !entry.scope.trim()
      || !Array.isArray(entry.gaps) || !entry.gaps.length || entry.gaps.some(gap => typeof gap !== 'string' || !gap.trim())
      || !Array.isArray(entry.labels) || !Array.isArray(entry.modes)) throw new Error(`Incomplete additional test scope: ${entry.file}`);
    if (entry.reviewStatus === 'NOT_REVIEWED') {
      if (entry.labels?.length || entry.declarations !== null || entry.modes?.length) throw new Error(`Unreviewed tests cannot claim classification: ${entry.file}`);
      continue;
    }
    if (entry.reviewStatus !== 'REVIEWED_SCOPED') throw new Error(`Unknown review status: ${entry.file}`);
    const validLabels = labels => Array.isArray(labels) && labels.length && new Set(labels).size === labels.length && labels.every(label => LABELS.includes(label));
    if (!validLabels(entry.labels) || !Array.isArray(entry.modes)) throw new Error(`Invalid additional classification: ${entry.file}`);
    const declarations = reviewedDeclarations(source);
    if (!declarations.length || !Array.isArray(entry.declarations) || JSON.stringify(declarations) !== JSON.stringify(entry.declarations.map(({ title, line }) => ({ title, line })))) throw new Error(`Additional declaration drift: ${entry.file}`);
    for (const declaration of entry.declarations) if (!validLabels(declaration.labels) || typeof declaration.scope !== 'string' || !declaration.scope.trim()) throw new Error(`Invalid declaration classification: ${entry.file}`);
    for (const mode of entry.modes) if (typeof mode.condition !== 'string' || !mode.condition.trim() || typeof mode.scope !== 'string' || !mode.scope.trim() || !validLabels(mode.labels)) throw new Error(`Invalid additional mode classification: ${entry.file}`);
  }
  return { catalog, totalSourceFiles: allFiles.length,
    reviewed: catalog.entries.filter(entry => entry.reviewStatus === 'REVIEWED_SCOPED').length,
    unreviewed: catalog.entries.filter(entry => entry.reviewStatus === 'NOT_REVIEWED').map(entry => entry.file) };
}
