/**
 * @fileoverview Zero Host Security & Isolation Utilities
 *
 * Provides Host-header DNS rebinding protection, strict loopback CORS validation,
 * HttpOnly SameSite=Strict cookie session management, and authorization guards
 * for the Zero Native Gateway.
 */

import crypto from 'node:crypto';

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
 * In-memory secure desktop browser session store.
 */
export class DesktopSessionStore {
  constructor(options = {}) {
    this.maxAgeMs = options.maxAgeMs || 24 * 60 * 60 * 1000; // 24 hours
    this.sessions = new Map();
  }

  create(metadata = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session = {
      id: sessionId,
      role: metadata.role || 'operator',
      scopes: metadata.scopes || ['admin', 'operator.admin', 'operator.write', 'operator.read', 'operator.approvals', 'operator.sessions.read', 'computer.control'],
      clientId: metadata.clientId || 'zero-desktop-browser',
      createdAt: now,
      expiresAt: now + this.maxAgeMs,
      ...metadata,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  get(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  has(sessionId) {
    return this.get(sessionId) !== null;
  }

  delete(sessionId) {
    return this.sessions.delete(sessionId);
  }

  clear() {
    this.sessions.clear();
  }
}
