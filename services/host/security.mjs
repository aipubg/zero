/**
 * @fileoverview Zero Host Security & Isolation Utilities
 *
 * Provides Host-header DNS rebinding protection, strict loopback CORS validation,
 * HttpOnly SameSite=Strict cookie session management, and authorization guards
 * for the Zero Native Gateway.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Validates that an incoming Host header targets the local loopback interface.
 * Protects against DNS rebinding attacks from malicious external domains.
 *
 * @param {string} [hostHeader] Incoming HTTP/WS Host header (e.g. "127.0.0.1:18789")
 * @returns {boolean} True if the host is a valid loopback address
 */
export function isValidLoopbackHost(hostHeader) {
  if (!hostHeader || typeof hostHeader !== 'string') return false;
  // Strip port (e.g. "127.0.0.1:18789" -> "127.0.0.1", "[::1]:18789" -> "[::1]")
  const host = hostHeader.replace(/:\d+$/, '').trim().toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '[::1]' || host === '::1';
}

/**
 * Validates that an incoming Origin header originates from a local loopback origin.
 * Direct requests (e.g. curl, internal node scripts) with no Origin are permitted.
 *
 * @param {string} [originHeader] Incoming Origin header (e.g. "http://127.0.0.1:18789")
 * @returns {boolean} True if the origin is omitted or is a loopback URL
 */
export function isAllowedLoopbackOrigin(originHeader) {
  if (!originHeader) return true; // Direct same-origin or non-browser client
  if (originHeader === 'null') return true; // Local file or opaque origin
  try {
    const parsed = new URL(originHeader);
    const host = parsed.hostname.toLowerCase();
    return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
  } catch {
    return false;
  }
}

/**
 * Validates that the TCP remote address is a local loopback interface.
 *
 * @param {string} [remoteAddress] Socket remote IP
 * @returns {boolean} True if the connection is from loopback
 */
export function isLoopbackRemoteAddress(remoteAddress) {
  if (!remoteAddress) return false;
  return remoteAddress === '127.0.0.1' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1' ||
    remoteAddress === 'localhost';
}

/**
 * Applies strict loopback CORS headers.
 * Never issues wildcard 'Access-Control-Allow-Origin: *'.
 * Rejects external origins by not setting the header and returning false.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @returns {boolean} True if origin is allowed, false if untrusted
 */
export function applyStrictLoopbackCors(req, res) {
  const origin = req.headers?.origin;
  if (origin) {
    if (isAllowedLoopbackOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    } else {
      // Untrusted origin: explicitly do not grant CORS
      return false;
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return true;
}

/**
 * Parses HTTP Cookie header into key-value map.
 *
 * @param {string} [cookieHeader]
 * @returns {Record<string, string>}
 */
export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx !== -1) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (key) {
        try {
          cookies[key] = decodeURIComponent(val);
        } catch {
          cookies[key] = val;
        }
      }
    }
  }
  return cookies;
}

/**
 * Desktop sessions with optional durable metadata; bearer tokens are never stored.
 */
export class DesktopSessionStore {
  constructor(options = {}) {
    this.maxAgeMs = options.maxAgeMs ?? 24 * 60 * 60 * 1000;
    if (!Number.isFinite(this.maxAgeMs) || this.maxAgeMs < 1) throw new Error('Desktop session lifetime must be positive');
    this.sessions = new Map();
    this.filePath = options.filePath || null;
    if (this.filePath && fs.existsSync(this.filePath)) {
      const stored = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      if (stored.version !== 1 || !Array.isArray(stored.sessions)) throw new Error('Invalid desktop session metadata');
      for (const entry of stored.sessions) {
        if (!/^[a-f0-9]{64}$/.test(entry.key) || !entry.session || typeof entry.session.role !== 'string' || !Array.isArray(entry.session.scopes) || entry.session.scopes.some(scope => typeof scope !== 'string') || !Number.isFinite(entry.session.expiresAt)) throw new Error('Invalid desktop session record');
        if (entry.session.expiresAt > Date.now()) this.sessions.set(entry.key, entry.session);
      }
    }
  }

  _key(token) { return crypto.createHash('sha256').update(token).digest('hex'); }

  _persist() {
    if (!this.filePath) return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${crypto.randomUUID()}.tmp`;
    try {
      const fd = fs.openSync(temporary, 'wx', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify({ version: 1, sessions: [...this.sessions].map(([key, session]) => ({ key, session })) })); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      fs.renameSync(temporary, this.filePath);
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  }

  create(metadata = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    for (const [key, record] of this.sessions) if (record.expiresAt <= now) this.sessions.delete(key);
    const session = {
      id: sessionId,
      role: metadata.role || 'operator',
      scopes: metadata.scopes || ['admin', 'operator.admin', 'operator.write', 'operator.read', 'operator.approvals', 'operator.sessions.read', 'computer.control'],
      clientId: metadata.clientId || 'zero-desktop-browser',
      createdAt: now,
      expiresAt: now + this.maxAgeMs,
      ...metadata,
    };
    const { id, ...record } = session;
    this.sessions.set(this._key(sessionId), record);
    this._persist();
    return session;
  }

  get(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') return null;
    const key = this._key(sessionId);
    const session = this.sessions.get(key);
    if (!session) return null;
    if (Date.now() >= session.expiresAt) {
      this.sessions.delete(key); this._persist();
      return null;
    }
    return { ...session, id: sessionId };
  }

  has(sessionId) {
    return this.get(sessionId) !== null;
  }

  /**
   * Promote a session to the given role and scopes.
   *
   * The local browser owns this workstation gateway. Sessions created before
   * the owner-mode default was introduced are still persisted with the
   * "operator" role, which makes the Control UI hide admin-only surfaces
   * (Secrets, Approvals) even though the session belongs to the owner.
   * Upgrading them keeps the persisted session file consistent with the
   * current owner-mode policy.
   */
  promote(sessionId, role = 'admin', scopes = null) {
    const session = this.get(sessionId);
    if (!session) return null;
    const key = this._key(sessionId);
    const previous = this.sessions.get(key);
    const promoted = {
      ...previous,
      role,
      scopes: scopes ? [...scopes] : previous.scopes,
    };
    this.sessions.set(key, promoted);
    try { this._persist(); }
    catch (error) { this.sessions.set(key, previous); throw error; }
    return { ...promoted, id: sessionId };
  }

  renew(sessionId) {
    const session = this.get(sessionId);
    if (!session) return null;
    const key = this._key(sessionId), previous = this.sessions.get(key);
    const renewed = { ...previous, expiresAt: Date.now() + this.maxAgeMs };
    this.sessions.set(key, renewed);
    try { this._persist(); }
    catch (error) { this.sessions.set(key, previous); throw error; }
    return { ...renewed, id: sessionId };
  }

  delete(sessionId) {
    if (typeof sessionId !== 'string') return false;
    const removed = this.sessions.delete(this._key(sessionId));
    if (removed) this._persist();
    return removed;
  }

  clear() {
    this.sessions.clear();
    this._persist();
  }
}
