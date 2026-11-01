/**
 * @fileoverview Zero Cross-Device & Mobile Companion Protocol Engine
 *
 * Implements:
 * 1. Device pairing lifecycle (time-limited pairing codes & scoped auth tokens)
 * 2. Multi-device registry (Android, iOS, Secondary PC, Web Terminal)
 * 3. Remote push notifications & alerts
 * 4. Cross-device task supervision and presence tracking
 */

import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';

export const DEVICE_PLATFORMS = Object.freeze({
  ANDROID: 'android',
  IOS: 'ios',
  WINDOWS: 'windows',
  MACOS: 'macos',
  LINUX: 'linux',
  WEB: 'web',
});

export class DeviceManager extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath=':memory:']
   */
  constructor(options = {}) {
    super();
    this.dbPath = options.dbPath || ':memory:';
    this.db = new DatabaseSync(this.dbPath);
    this._pendingCodes = new Map(); // pairingCode -> { expiresAt, role }
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_paired_devices (
        id TEXT PRIMARY KEY,
        device_name TEXT NOT NULL,
        platform TEXT NOT NULL,
        device_token TEXT NOT NULL UNIQUE,
        capabilities_json TEXT,
        status TEXT NOT NULL DEFAULT 'paired',
        last_seen_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS zero_device_notifications (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal',
        payload_json TEXT,
        read INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (device_id) REFERENCES zero_paired_devices(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_device_notifications_dev ON zero_device_notifications(device_id, read);
    `);
  }

  /**
   * Generate a 6-character short-lived pairing code (valid for 5 minutes)
   */
  generatePairingCode({ role = 'companion', ttlMs = 300000 } = {}) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
    const expiresAt = Date.now() + ttlMs;
    this._pendingCodes.set(code, { expiresAt, role });
    return {
      pairingCode: code,
      expiresAt,
      expiresInSeconds: Math.floor(ttlMs / 1000),
    };
  }

  /**
   * Claim pairing code and register device
   */
  claimPairingCode({ pairingCode, deviceId, deviceName, platform = DEVICE_PLATFORMS.ANDROID, capabilities = [] }) {
    if (!pairingCode) throw new Error('Pairing requires pairingCode');
    if (!deviceId || !deviceName) throw new Error('Pairing requires deviceId and deviceName');

    const cleanCode = String(pairingCode).trim().toUpperCase();
    const pending = this._pendingCodes.get(cleanCode);

    if (!pending) {
      throw new Error('Invalid or expired pairing code');
    }
    if (Date.now() > pending.expiresAt) {
      this._pendingCodes.delete(cleanCode);
      throw new Error('Pairing code has expired. Generate a new code.');
    }

    this._pendingCodes.delete(cleanCode);

    const now = Date.now();
    const deviceToken = `devtok_${crypto.randomBytes(24).toString('hex')}`;

    const stmt = this.db.prepare(`
      INSERT INTO zero_paired_devices (id, device_name, platform, device_token, capabilities_json, status, last_seen_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'paired', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        device_name = excluded.device_name,
        platform = excluded.platform,
        device_token = excluded.device_token,
        capabilities_json = excluded.capabilities_json,
        status = 'paired',
        last_seen_at = excluded.last_seen_at
    `);
    stmt.run(
      deviceId,
      deviceName,
      platform,
      deviceToken,
      JSON.stringify(capabilities),
      now,
      now
    );

    const device = this.getDevice(deviceId);
    this.emit('device:paired', device);
    return {
      ok: true,
      device,
      token: deviceToken,
    };
  }

  getDevice(id) {
    const stmt = this.db.prepare(`SELECT * FROM zero_paired_devices WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
      id: row.id,
      deviceName: row.device_name,
      platform: row.platform,
      capabilities: JSON.parse(row.capabilities_json || '[]'),
      status: row.status,
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
    };
  }

  listDevices() {
    const stmt = this.db.prepare(`SELECT * FROM zero_paired_devices ORDER BY created_at DESC`);
    const rows = stmt.all();
    return rows.map((r) => ({
      id: r.id,
      deviceName: r.device_name,
      platform: r.platform,
      capabilities: JSON.parse(r.capabilities_json || '[]'),
      status: r.status,
      lastSeenAt: r.last_seen_at,
      createdAt: r.created_at,
    }));
  }

  unpairDevice(id) {
    const stmt = this.db.prepare(`DELETE FROM zero_paired_devices WHERE id = ?`);
    stmt.run(id);
    this.emit('device:unpaired', { id });
    return { ok: true, unpaired: id };
  }

  /**
   * Dispatch remote notification to a paired device
   */
  sendNotification({ deviceId, title, body, priority = 'normal', payload = {} }) {
    const device = this.getDevice(deviceId);
    if (!device) throw new Error(`Device '${deviceId}' not found or not paired`);

    const now = Date.now();
    const notifId = `notif_${now}_${Math.random().toString(36).slice(2, 7)}`;

    const stmt = this.db.prepare(`
      INSERT INTO zero_device_notifications (id, device_id, title, body, priority, payload_json, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `);
    stmt.run(notifId, deviceId, title, body, priority, JSON.stringify(payload), now);

    const notification = {
      id: notifId,
      deviceId,
      title,
      body,
      priority,
      payload,
      read: false,
      createdAt: now,
    };
    this.emit('notification:sent', notification);
    return { ok: true, notification };
  }

  listNotifications(deviceId, { unreadOnly = false, limit = 50 } = {}) {
    let sql = `SELECT * FROM zero_device_notifications WHERE device_id = ?`;
    if (unreadOnly) sql += ` AND read = 0`;
    sql += ` ORDER BY created_at DESC LIMIT ?`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(deviceId, limit);
    return rows.map((r) => ({
      id: r.id,
      deviceId: r.device_id,
      title: r.title,
      body: r.body,
      priority: r.priority,
      payload: JSON.parse(r.payload_json || '{}'),
      read: Boolean(r.read),
      createdAt: r.created_at,
    }));
  }

  markNotificationRead(id) {
    const stmt = this.db.prepare(`UPDATE zero_device_notifications SET read = 1 WHERE id = ?`);
    stmt.run(id);
    return { ok: true, id };
  }

  close() {
    this._pendingCodes.clear();
    this.removeAllListeners();
    try {
      this.db.close();
    } catch (_) {}
  }
}
