// Zero Notebook: two small, curated notes that go into every new chat's prompt.
//
//   owner  who the owner is: preferences, language, how they like to work
//   zero   Zero's notes about this computer: paths, quirks, what works here
//
// Each book is a markdown file of one-line entries ("- ..."), so the owner can
// read and edit it. Books have a character budget (not tokens, so it does not
// depend on the model); a write that would exceed it is refused with a clear
// message, which makes Zero replace or drop old entries instead of growing
// forever. Text is checked before it is stored: secrets and instructions aimed
// at the model are refused, because the notebook is read back as trusted
// context in every later chat.
import fs from 'node:fs';
import path from 'node:path';

export const NOTEBOOK_LIMITS = Object.freeze({ owner: 1400, zero: 2200 });
const BOOKS = Object.keys(NOTEBOOK_LIMITS);

const REFUSED = [
  [/\b(sk|rk|pk)-[A-Za-z0-9_-]{16,}|\bAIza[0-9A-Za-z_-]{20,}|\bnvapi-[A-Za-z0-9_-]{20,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bxox[abpr]-[A-Za-z0-9-]{10,}/, 'looks like an API key or token'],
  [/\b(password|passwd|pwd|pin|otp|cvv)\s*[:=]\s*\S+/i, 'looks like a password or code'],
  [/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/, 'looks like a card number'],
  [/ignore (all |any )?(previous|prior|above) (instructions|rules)|disregard (the|your) (rules|instructions)|you are now|new system prompt|<\/?system>/i, 'reads like an instruction aimed at the model'],
];

export function checkNotebookText(text) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return { ok: false, error: 'Nothing to write' };
  if (value.length > 400) return { ok: false, error: 'One entry is at most 400 characters; split it or say it shorter' };
  for (const [pattern, why] of REFUSED) if (pattern.test(value)) return { ok: false, error: `Not stored: the text ${why}. The notebook is read back into every chat, so it must not hold that.` };
  return { ok: true, value };
}

export class ZeroNotebook {
  constructor({ dir }) {
    this.dir = dir;
  }

  _file(book) {
    if (!BOOKS.includes(book)) throw new Error(`Unknown book '${book}'. Use 'owner' or 'zero'.`);
    return path.join(this.dir, `${book}.md`);
  }

  entries(book) {
    try {
      return fs.readFileSync(this._file(book), 'utf8').split(/\r?\n/).map(line => line.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean);
    } catch { return []; }
  }

  _write(book, entries) {
    fs.mkdirSync(this.dir, { recursive: true });
    const file = this._file(book);
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, entries.map(entry => `- ${entry}`).join('\n') + (entries.length ? '\n' : ''), 'utf8');
    fs.renameSync(tmp, file);
  }

  text(book) {
    return this.entries(book).map(entry => `- ${entry}`).join('\n');
  }

  used(book) {
    return this.text(book).length;
  }

  /** What goes into a new chat's prompt. */
  snapshot() {
    return { owner: this.text('owner'), zero: this.text('zero') };
  }

  _fits(book, entries) {
    const size = entries.map(entry => `- ${entry}`).join('\n').length;
    const limit = NOTEBOOK_LIMITS[book];
    return size <= limit ? null : `The ${book} book would be ${size} of ${limit} characters (${size - limit} over). Replace or remove an older entry first.`;
  }

  _find(book, match) {
    const needle = String(match || '').trim().toLowerCase();
    if (!needle) throw new Error('Say which entry: give a few words from it as match');
    const entries = this.entries(book);
    const hits = entries.map((entry, index) => [entry, index]).filter(([entry]) => entry.toLowerCase().includes(needle));
    if (!hits.length) throw new Error(`No ${book} entry contains "${match}"`);
    if (hits.length > 1) throw new Error(`${hits.length} ${book} entries contain "${match}"; use more words to pick one`);
    return { entries, index: hits[0][1] };
  }

  add(book, text) {
    const checked = checkNotebookText(text);
    if (!checked.ok) return { ok: false, error: checked.error };
    const entries = this.entries(book);
    if (entries.some(entry => entry.toLowerCase() === checked.value.toLowerCase())) return { ok: true, unchanged: true, book, message: 'Already written down' };
    const next = [...entries, checked.value];
    const over = this._fits(book, next);
    if (over) return { ok: false, error: over, book, used: this.used(book), limit: NOTEBOOK_LIMITS[book] };
    this._write(book, next);
    return { ok: true, book, added: checked.value, used: this.used(book), limit: NOTEBOOK_LIMITS[book] };
  }

  replace(book, match, text) {
    const checked = checkNotebookText(text);
    if (!checked.ok) return { ok: false, error: checked.error };
    let found;
    try { found = this._find(book, match); } catch (error) { return { ok: false, error: error.message }; }
    const { entries, index } = found;
    const next = entries.slice();
    const before = next[index];
    next[index] = checked.value;
    const over = this._fits(book, next);
    if (over) return { ok: false, error: over, book };
    this._write(book, next);
    return { ok: true, book, replaced: before, with: checked.value, used: this.used(book), limit: NOTEBOOK_LIMITS[book] };
  }

  remove(book, match) {
    let found;
    try { found = this._find(book, match); } catch (error) { return { ok: false, error: error.message }; }
    const { entries, index } = found;
    const removed = entries[index];
    this._write(book, entries.filter((_, i) => i !== index));
    return { ok: true, book, removed, used: this.used(book), limit: NOTEBOOK_LIMITS[book] };
  }

  read(book) {
    const books = book ? [book] : BOOKS;
    return { ok: true, books: Object.fromEntries(books.map(b => [b, { entries: this.entries(b), used: this.used(b), limit: NOTEBOOK_LIMITS[b] }])) };
  }

  /** Handler for the `notebook` tool. */
  handle(params = {}) {
    const action = String(params.action || 'read').toLowerCase();
    const book = params.book ? String(params.book).toLowerCase() : undefined;
    try {
      if (action === 'read') return this.read(book);
      if (!book) return { ok: false, error: "Say which book: 'owner' (about the owner) or 'zero' (about this computer)" };
      if (!BOOKS.includes(book)) return { ok: false, error: `Unknown book '${book}'. Use 'owner' or 'zero'.` };
      if (action === 'add') return this.add(book, params.text);
      if (action === 'replace') return this.replace(book, params.match, params.text);
      if (action === 'remove') return this.remove(book, params.match);
      return { ok: false, error: `Unknown action '${action}'. Use read, add, replace or remove.` };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}
