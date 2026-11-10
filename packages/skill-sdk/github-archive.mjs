import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { list, extract } from '../../backend/node_modules/tar/dist/esm/index.js';

const COMPRESSED_LIMIT = 64 * 1024 * 1024;
const EXPANDED_LIMIT = 256 * 1024 * 1024;
const BUNDLE_LIMIT = 64 * 1024 * 1024;

function bounded(limit, label, onChunk) {
  let total = 0;
  return new Transform({ transform(chunk, _encoding, callback) {
    total += chunk.length;
    if (total > limit) { callback(new Error(`${label} exceeds the supported size bound`)); return; }
    onChunk?.(chunk); callback(null, chunk);
  } });
}

function entryPath(value) {
  if (typeof value !== 'string' || value.startsWith('/') || /[\\:<>"|?*\x00-\x1f\x7f]/.test(value)) throw new Error('Unsafe GitHub archive path');
  const normalized = value.replace(/\/$/, '');
  const parts = normalized.split('/');
  if (normalized.length > 1000 || parts.length > 64 || parts.some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part)
    || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error('Unsafe GitHub archive path');
  return parts;
}

/** Full selected subtree from an immutable GitHub archive; no scripts execute. */
export async function acquireGithubArchive(checked, { temporary, checkout, signal, timeoutMs }) {
  if (!/^[a-f0-9]{40}$/i.test(checked.ref || '')) throw new Error('GitHub archive transport requires a complete pinned commit');
  const url = new URL(checked.url);
  const [owner, repository] = url.pathname.replace(/\.git$/, '').split('/').filter(Boolean);
  const revision = checked.ref.toLowerCase();
  const archiveUrl = `https://codeload.github.com/${owner}/${repository}/tar.gz/${revision}`;
  const archive = path.join(temporary, 'source.tar.gz');
  const combined = AbortSignal.any([AbortSignal.timeout(Math.ceil(timeoutMs)), ...(signal ? [signal] : [])]);
  combined.throwIfAborted();
  const response = await fetch(archiveUrl, { redirect: 'error', signal: combined, headers: { 'User-Agent': 'Zero-Skill-SDK' } });
  if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error(`GitHub archive retrieval failed (HTTP ${response.status})`); }
  if (Number(response.headers.get('content-length')) > COMPRESSED_LIMIT) { await response.body.cancel(); throw new Error('GitHub archive exceeds the supported download bound'); }
  const archiveHash = createHash('sha256');
  await pipeline(Readable.fromWeb(response.body), bounded(COMPRESSED_LIMIT, 'GitHub archive', chunk => archiveHash.update(chunk)),
    fs.createWriteStream(archive, { flags: 'wx', mode: 0o600 }), { signal: combined });
  const extracted = await extractPinnedSkillArchive(archive, checked, { checkout, signal: combined });
  return { ...extracted, transport: 'github-archive', archiveUrl, archiveSha256: archiveHash.digest('hex'),
    pinVerification: 'Immutable GitHub HTTPS archive URL and archive root; extracted files match the validated archive bytes, not a publisher signature' };
}

export async function extractPinnedSkillArchive(archive, checked, { checkout, signal }) {
  if (!/^[a-f0-9]{40}$/i.test(checked.ref || '')) throw new Error('GitHub archive transport requires a complete pinned commit');
  const repository = new URL(checked.url).pathname.replace(/\.git$/, '').split('/').filter(Boolean)[1];
  const revision = checked.ref.toLowerCase();
  const rootName = `${repository}-${revision}`;
  const selected = path.posix.normalize((checked.subpath || '').replaceAll('\\', '/') || '.').replace(/^\.$/, '');
  const combined = signal || new AbortController().signal;
  combined.throwIfAborted();
  const seen = new Set(), files = new Map(), selectedTypes = new Map();
  let entryCount = 0, bundleBytes = 0;
  const isSelected = relative => !selected || relative === selected || relative.startsWith(selected + '/');
  const inspect = entry => {
    const parts = entryPath(entry.path);
    if (parts[0].toLowerCase() !== rootName.toLowerCase()) throw new Error('GitHub archive does not match the requested repository and pinned revision');
    const key = parts.map(part => part.normalize('NFC').toLowerCase()).join('/');
    if (seen.has(key)) throw new Error('GitHub archive has duplicate or case-colliding paths');
    seen.add(key);
    if (++entryCount > 25000) throw new Error('GitHub archive contains too many entries');
    const relative = parts.slice(1).join('/');
    if (!isSelected(relative)) return;
    if (!['File', 'Directory'].includes(entry.type)) throw new Error('Skill archive subtree must not contain links or special files');
    for (let count = 1; count < parts.length; count++) {
      const parent = parts.slice(0, count).map(part => part.normalize('NFC').toLowerCase()).join('/');
      if (selectedTypes.get(parent) === 'File') throw new Error('Skill archive has conflicting file and directory paths');
      selectedTypes.set(parent, 'Directory');
    }
    if (selectedTypes.has(key) && selectedTypes.get(key) !== entry.type) throw new Error('Skill archive has conflicting file and directory paths');
    selectedTypes.set(key, entry.type);
    if (selectedTypes.size > 16384) throw new Error('Skill archive subtree contains too many directories');
    if (entry.type === 'Directory') return;
    if (!Number.isSafeInteger(entry.size) || entry.size < 0 || entry.size > 16 * 1024 * 1024 || (bundleBytes += entry.size) > BUNDLE_LIMIT || files.size >= 2048) throw new Error('Skill bundle exceeds the supported file or size bound');
    const record = { size: entry.size, sha256: null };
    const hash = createHash('sha256');
    files.set(relative, record);
    entry.on('data', chunk => hash.update(chunk));
    entry.once('end', () => { record.sha256 = hash.digest('hex'); });
  };
  // Validate before extracting anything; count expanded bytes, not just headers.
  const reader = list({ strict: true, maxMetaEntrySize: 65536,
    onReadEntry(entry) { try { inspect(entry); } catch (error) { reader.abort(error); } },
  });
  await pipeline(fs.createReadStream(archive), createGunzip(), bounded(EXPANDED_LIMIT, 'Expanded GitHub archive'), reader, { signal: combined });
  const manifest = selected ? `${selected}/SKILL.md` : 'SKILL.md';
  if (!files.has(manifest)) throw new Error('GitHub skill source requires SKILL.md; specify its repository directory');
  fs.mkdirSync(checkout, { recursive: false });
  const unpacker = extract({ cwd: checkout, strip: 1, strict: true, preservePaths: false, preserveOwner: false, maxDepth: 64, maxMetaEntrySize: 65536,
      filter(name, entry) {
        try {
          const parts = entryPath(name), relative = parts.slice(1).join('/');
          if (!isSelected(relative)) return false;
          if (!['File', 'Directory'].includes(entry.type)) throw new Error('Skill archive links are not supported');
          entry.mode &= 0o777;
          return true;
        } catch (error) { unpacker.abort(error); return false; }
      },
    });
  await pipeline(fs.createReadStream(archive), createGunzip(), bounded(EXPANDED_LIMIT, 'Expanded GitHub archive'), unpacker, { signal: combined });
  let verifiedFiles = 0;
  const verify = async directory => {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      combined.throwIfAborted();
      const target = path.join(directory, item.name);
      if (item.isSymbolicLink()) throw new Error('Extracted Skill source contains a symbolic link');
      if (item.isDirectory()) { await verify(target); continue; }
      if (!item.isFile()) throw new Error('Extracted Skill source contains an unsupported entry');
      const relative = path.relative(checkout, target).split(path.sep).join('/');
      const expected = files.get(relative);
      if (!expected || !expected.sha256 || fs.statSync(target).size !== expected.size) throw new Error('Extracted Skill source differs from the validated archive');
      const hash = createHash('sha256');
      for await (const chunk of fs.createReadStream(target, { signal: combined })) hash.update(chunk);
      if (hash.digest('hex') !== expected.sha256) throw new Error('Extracted Skill file checksum mismatch');
      verifiedFiles++;
    }
  };
  await verify(checkout);
  if (verifiedFiles !== files.size) throw new Error('Extracted Skill source is incomplete');
  return { revision, extractedFiles: verifiedFiles };
}
