/**
 * @fileoverview Zero File-Based Memory (Hermes-style)
 *
 * Simple persistent memory files alongside the SQLite UnifiedMemoryEngine:
 *   - MEMORY.md: agent's own notes (default 2,200 character limit)
 *   - USER.md: user profile (default 1,375 character limit)
 *
 * Limits are in characters, not tokens, so they remain stable across model changes.
 * Entries are delimited by "\n§\n". Writes are security-scanned before persistence.
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_LIMITS = {
  memory: 2200,
  user: 1375,
};

const DELIMITER = '\n§\n';

/** Basic security scan: reject content containing injection patterns or secrets. */
function scanContent(content) {
  if (!content || typeof content !== 'string') return { ok: false, reason: 'empty content' };
  const lower = content.toLowerCase();
  const dangerPatterns = [
    'ignore previous instructions',
    'system prompt',
    'you are now',
    'disregard',
    'jailbreak',
    'prompt injection',
  ];
  for (const pat of dangerPatterns) {
    if (lower.includes(pat)) {
      return { ok: false, reason: `content matches blocked pattern: ${pat}` };
    }
  }
  return { ok: true };
}

/** Parse a memory file into entries split by the delimiter. */
function parseEntries(text) {
  if (!text || !text.trim()) return [];
  return text.split(DELIMITER).map((e) => e.trim()).filter(Boolean);
}

/** Serialize entries back to file text. */
function serializeEntries(entries) {
  return entries.join(DELIMITER) + (entries.length ? DELIMITER : '');
}

export class FileMemoryStore {
  constructor(options = {}) {
    this.memoryDir = options.memoryDir || path.join(process.cwd(), 'zero-system', 'state', 'memory');
    this.memoryCharLimit = options.memoryCharLimit ?? DEFAULT_LIMITS.memory;
    this.userCharLimit = options.userCharLimit ?? DEFAULT_LIMITS.user;
    this.enabled = options.enabled !== false;

    if (this.enabled) {
      try { fs.mkdirSync(this.memoryDir, { recursive: true }); } catch { /* dir may exist */ }
    }
  }

  _memoryPath() { return path.join(this.memoryDir, 'MEMORY.md'); }
  _userPath() { return path.join(this.memoryDir, 'USER.md'); }

  /** Read current MEMORY.md entries. */
  readMemory() {
    if (!this.enabled) return [];
    const text = this._readFile(this._memoryPath());
    return parseEntries(text);
  }

  /** Read current USER.md entries. */
  readUser() {
    if (!this.enabled) return [];
    const text = this._readFile(this._userPath());
    return parseEntries(text);
  }

  /** Add an entry to MEMORY.md. Rejects if over char limit or security scan fails. */
  addMemory(entry) {
    if (!this.enabled) throw new Error('File memory is disabled');
    if (!entry || typeof entry !== 'string') throw new Error('Memory entry requires non-empty text');
    const scan = scanContent(entry);
    if (!scan.ok) throw new Error(`Memory write rejected: ${scan.reason}`);

    const entries = this.readMemory();
    entries.push(entry.trim());
    return this._writeMemory(entries);
  }

  /** Replace all MEMORY.md entries. */
  setMemory(entries) {
    if (!this.enabled) throw new Error('File memory is disabled');
    if (!Array.isArray(entries)) throw new Error('Memory entries must be an array');
    return this._writeMemory(entries);
  }

  /** Remove a memory entry by index. */
  removeMemory(index) {
    if (!this.enabled) throw new Error('File memory is disabled');
    const entries = this.readMemory();
    if (index < 0 || index >= entries.length) return false;
    entries.splice(index, 1);
    return this._writeMemory(entries);
  }

  /** Add an entry to USER.md. */
  addUser(entry) {
    if (!this.enabled) throw new Error('File memory is disabled');
    if (!entry || typeof entry !== 'string') throw new Error('User entry requires non-empty text');
    const scan = scanContent(entry);
    if (!scan.ok) throw new Error(`User write rejected: ${scan.reason}`);

    const entries = this.readUser();
    entries.push(entry.trim());
    return this._writeUser(entries);
  }

  /** Replace all USER.md entries. */
  setUser(entries) {
    if (!this.enabled) throw new Error('File memory is disabled');
    if (!Array.isArray(entries)) throw new Error('User entries must be an array');
    return this._writeUser(entries);
  }

  /** Remove a user entry by index. */
  removeUser(index) {
    if (!this.enabled) throw new Error('File memory is disabled');
    const entries = this.readUser();
    if (index < 0 || index >= entries.length) return false;
    entries.splice(index, 1);
    return this._writeUser(entries);
  }

  /** Get a snapshot string for the volatile tier of the system prompt. */
  getSnapshot() {
    const memory = this.readMemory();
    const user = this.readUser();
    return {
      memory: memory.join('\n') || null,
      user: user.join('\n') || null,
      memoryCharCount: memory.reduce((acc, e) => acc + e.length, 0),
      userCharCount: user.reduce((acc, e) => acc + e.length, 0),
      memoryLimit: this.memoryCharLimit,
      userLimit: this.userCharLimit,
    };
  }

  getStatus() {
    return {
      enabled: this.enabled,
      memoryDir: this.memoryDir,
      memoryFile: this._memoryPath(),
      userFile: this._userPath(),
      memoryCharLimit: this.memoryCharLimit,
      userCharLimit: this.userCharLimit,
      memoryEntries: this.readMemory().length,
      userEntries: this.readUser().length,
    };
  }

  // ---- private ----

  _readFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return '';
      return fs.readFileSync(filePath, 'utf8');
    } catch { return ''; }
  }

  _writeMemory(entries) {
    const joined = entries.join('\n');
    if (joined.length > this.memoryCharLimit) {
      throw new Error(`Memory exceeds ${this.memoryCharLimit} character limit (current: ${joined.length})`);
    }
    this._atomicWrite(this._memoryPath(), serializeEntries(entries));
    return { ok: true, entries: entries.length, charCount: joined.length, limit: this.memoryCharLimit };
  }

  _writeUser(entries) {
    const joined = entries.join('\n');
    if (joined.length > this.userCharLimit) {
      throw new Error(`User profile exceeds ${this.userCharLimit} character limit (current: ${joined.length})`);
    }
    this._atomicWrite(this._userPath(), serializeEntries(entries));
    return { ok: true, entries: entries.length, charCount: joined.length, limit: this.userCharLimit };
  }

  _atomicWrite(filePath, content) {
    const tmp = filePath + '.' + Date.now() + '.tmp';
    fs.writeFileSync(tmp, content, { mode: 0o600, flag: 'wx' });
    fs.renameSync(tmp, filePath);
  }
}

export const defaultFileMemoryStore = new FileMemoryStore();