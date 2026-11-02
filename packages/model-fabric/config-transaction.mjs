import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const journalPath = providersPath => `${providersPath}.pending-model-import.json`;
function atomicWrite(file, bytes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.import-tmp`;
  try {
    const fd = fs.openSync(temporary, 'wx', 0o600);
    try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(temporary, file);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}

export function recoverModelImport(providersPath, bindingsPath) {
  const journal = journalPath(providersPath);
  if (!fs.existsSync(journal)) return { recovered: false };
  const record = JSON.parse(fs.readFileSync(journal, 'utf8'));
  const expected = [providersPath, bindingsPath].map(file => path.resolve(file));
  if (record.schemaVersion !== 1 || !['prepared', 'committed'].includes(record.state) || !Array.isArray(record.files) || record.files.length !== 2 ||
      record.files.some((entry, index) => !entry || typeof entry.file !== 'string' || path.resolve(entry.file) !== expected[index] || typeof entry.existed !== 'boolean' ||
        (entry.existed && (typeof entry.original !== 'string' || Buffer.from(entry.original, 'base64').toString('base64') !== entry.original || crypto.createHash('sha256').update(Buffer.from(entry.original, 'base64')).digest('hex') !== entry.originalHash)))) throw new Error('Invalid model import recovery journal; files were preserved');
  if (record.state === 'prepared') {
    for (const entry of record.files) {
      if (entry.existed) atomicWrite(entry.file, Buffer.from(entry.original, 'base64'));
      else if (fs.existsSync(entry.file)) fs.unlinkSync(entry.file);
    }
  }
  fs.unlinkSync(journal);
  return { recovered: record.state === 'prepared', completedCommit: record.state === 'committed' };
}

/** Recoverable two-file import. onProgress is an internal observer, never an RPC parameter. */
export function commitModelImport(providersPath, bindingsPath, providers, bindings, { onProgress } = {}) {
  const paths = [providersPath, bindingsPath].map(file => path.resolve(file));
  if (paths[0] === paths[1]) throw new Error('Provider and binding paths must differ');
  const journal = journalPath(providersPath);
  if (fs.existsSync(journal)) throw new Error('Model import recovery is pending');
  const suffix = crypto.randomUUID();
  const files = paths.map(file => { const bytes = fs.existsSync(file) ? fs.readFileSync(file) : null; return { file, existed: bytes !== null, original: bytes?.toString('base64') ?? null, originalHash: bytes ? crypto.createHash('sha256').update(bytes).digest('hex') : null }; });
  const backups = files.filter(entry => entry.existed).map(entry => {
    const backup = `${entry.file}.before-model-import-${suffix}.json`;
    fs.writeFileSync(backup, Buffer.from(entry.original, 'base64'), { flag: 'wx', mode: 0o600 }); return backup;
  });
  const record = { schemaVersion: 1, state: 'prepared', files };
  fs.mkdirSync(path.dirname(journal), { recursive: true });
  const fd = fs.openSync(journal, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(record)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  let committed = false;
  try {
    for (const [index, content] of [providers, bindings].entries()) { atomicWrite(paths[index], JSON.stringify(content, null, 2) + '\n'); onProgress?.(index + 1); }
    atomicWrite(journal, JSON.stringify({ ...record, state: 'committed' })); committed = true;
    fs.unlinkSync(journal);
    return { backupPaths: backups };
  } catch (error) {
    if (!committed) recoverModelImport(providersPath, bindingsPath);
    throw error;
  }
}

export function assertModelImportComplete(providersPath) {
  if (providersPath && fs.existsSync(journalPath(providersPath))) throw new Error('Model settings import requires startup recovery before inference');
}
