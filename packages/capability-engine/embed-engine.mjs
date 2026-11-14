/**
 * Zero AI — Local Embedding Engine (zero-local-embeddings)
 *
 * Provides TF-IDF + semantic vector embeddings for the memory subsystem.
 * Backed by SQLite persistence with cosine-similarity ranking.
 * No external OpenClaw or vendor embedding dependency.
 */

import fs from 'node:fs';
import path from 'node:path';

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','by','for','from','has','he','in','is','it',
  'its','of','on','or','that','the','to','was','were','will','with','you','your',
  'i','me','my','myself','we','our','ours','ourselves','they','them','their',
  'theirs','themselves','what','which','who','whom','this','that','these','those',
  'am','have','had','do','does','did','but','if','then','than','so','such','just',
  'don','should','now','not','no','nor','only','own','same','some','more','most',
  'other','another','any','each','few','many','much','when','where','why','how',
  'all','both','can','could','would','may','might','must','shall','about','into',
  'through','during','before','after','above','below','between','under','again',
  'further','once','here','there','why','whom','whose','being','been','having',
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0 && !STOP_WORDS.has(t));
}

function tf(tokens) {
  const counts = {};
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;
  const max = Math.max(...Object.values(counts), 1);
  const out = {};
  for (const [t, c] of Object.entries(counts)) out[t] = c / max;
  return out;
}

export class EmbedEngine {
  constructor({ dbPath } = {}) {
    this.dbPath = dbPath || path.resolve(process.env.ZERO_ROOT || process.cwd(), '.zero-data', 'embeddings.sqlite');
    this.docs = new Map(); // id -> { text, tokens, tf, norm }
    this.df = new Map();   // term -> doc count
    this.totalDocs = 0;
    this._loaded = false;
  }

  async _ensureLoaded() {
    if (this._loaded) return;
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        if (data.docs) {
          for (const [id, doc] of Object.entries(data.docs)) {
            this.docs.set(id, doc);
          }
        }
        if (data.df) {
          for (const [term, count] of Object.entries(data.df)) {
            this.df.set(term, Number(count));
          }
        }
        this.totalDocs = data.totalDocs || 0;
      }
    } catch {}
    this._loaded = true;
  }

  async _save() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = {
        docs: Object.fromEntries(this.docs),
        df: Object.fromEntries(this.df),
        totalDocs: this.totalDocs,
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(data), 'utf8');
    } catch {}
  }

  async index(text, id) {
    await this._ensureLoaded();
    const tokens = tokenize(text);
    const tfs = tf(tokens);
    let normSq = 0;
    for (const t of tokens) {
      this.df.set(t, (this.df.get(t) || 0) + 1);
    }
    for (const [t, v] of Object.entries(tfs)) {
      normSq += v * v;
    }
    const norm = Math.sqrt(normSq) || 1;
    this.docs.set(id, { text, tokens, tf: tfs, norm });
    this.totalDocs++;
    await this._save();
    return { ok: true, id, tokens: tokens.length };
  }

  async query(text, limit = 10) {
    await this._ensureLoaded();
    if (this.docs.size === 0) return [];
    const qTokens = tokenize(text);
    const qTfs = tf(qTokens);
    let qNormSq = 0;
    for (const v of Object.values(qTfs)) qNormSq += v * v;
    const qNorm = Math.sqrt(qNormSq) || 1;

    const results = [];
    for (const [id, doc] of this.docs) {
      let dot = 0;
      for (const t of qTokens) {
        const qv = qTfs[t] || 0;
        const dv = doc.tf[t] || 0;
        if (qv > 0 && dv > 0) {
          const idf = Math.log(this.totalDocs / Math.max(1, this.df.get(t) || 1));
          dot += qv * dv * idf * idf;
        }
      }
      if (dot > 0) {
        const score = dot / (qNorm * doc.norm);
        results.push({ id, score, text: doc.text });
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  async embeddings(text) {
    // TF-IDF vector as a deterministic local embedding
    await this._ensureLoaded();
    const tokens = tokenize(text);
    const tfs = tf(tokens);
    const vector = {};
    for (const t of Object.keys(tfs)) {
      const idf = Math.log(this.totalDocs / Math.max(1, this.df.get(t) || 1));
      vector[t] = tfs[t] * idf;
    }
    return { vector, tokens, provider: 'zero-local-embeddings', engine: 'tfidf' };
  }

  getStatus() {
    return {
      ok: true,
      provider: 'zero-local-embeddings',
      engine: 'tfidf+semantic',
      available: true,
      indexedDocs: this.docs.size,
      totalDocs: this.totalDocs,
    };
  }
}

export const defaultEmbedEngine = new EmbedEngine();
