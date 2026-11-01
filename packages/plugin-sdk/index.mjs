/**
 * @fileoverview Zero Plugin SDK & Lifecycle Manager
 *
 * Provides a canonical architecture for first-party and third-party plugins:
 * - Dynamic installation, enabling, disabling, and uninstallation
 * - Capability registration into CapabilityEngine
 * - SQLite persistent metadata and configuration storage
 * - Health diagnostics and security permission boundaries
 */

import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';

export class ZeroPlugin extends EventEmitter {
  constructor(manifest = {}) {
    super();
    this.manifest = manifest;
    this.context = null;
    this.enabled = false;
  }

  async onLoad(context) {
    this.context = context;
  }

  async onEnable() {
    this.enabled = true;
  }

  async onDisable() {
    this.enabled = false;
  }

  async onDestroy() {
    this.enabled = false;
    this.removeAllListeners();
  }
}

export class PluginManager extends EventEmitter {
  /**
   * @param {Object} options
   * @param {string} [options.dbPath=':memory:']
   * @param {import('../capability-engine/index.mjs').CapabilityEngine} options.capabilityEngine
   * @param {Object} [options.logger=console]
   */
  constructor({ dbPath = ':memory:', capabilityEngine, logger = console }) {
    super();
    if (!capabilityEngine) throw new Error('PluginManager requires capabilityEngine instance');
    this.ce = capabilityEngine;
    this.logger = logger;
    this.db = new DatabaseSync(dbPath);
    this._activeInstances = new Map();
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS zero_installed_plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        config TEXT,
        permissions TEXT,
        capabilities TEXT,
        installed_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_plugins_status ON zero_installed_plugins(status);
    `);
  }

  /**
   * Install and activate a plugin
   */
  async installPlugin(manifest, handlers = {}, instance = null) {
    if (!manifest || !manifest.id) {
      throw new Error('Plugin installation requires a valid manifest with id');
    }

    const now = Date.now();
    const pluginRecord = {
      id: manifest.id,
      name: manifest.name || manifest.id,
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      status: 'enabled',
      config: manifest.config || {},
      permissions: Array.isArray(manifest.permissions) ? manifest.permissions : [],
      capabilities: Array.isArray(manifest.capabilities) ? manifest.capabilities.map((c) => c.name || c) : [],
      installedAt: now,
      updatedAt: now,
    };

    // Instantiate plugin if not provided
    const pluginInstance = instance || new ZeroPlugin(manifest);
    await pluginInstance.onLoad({ pluginId: manifest.id, config: pluginRecord.config });
    await pluginInstance.onEnable();
    this._activeInstances.set(manifest.id, pluginInstance);

    // Register with capability engine
    this.ce.registerPlugin(manifest, handlers);

    // Save metadata in SQLite
    const stmt = this.db.prepare(`
      INSERT INTO zero_installed_plugins (
        id, name, version, description, status, config, permissions, capabilities, installed_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        version = excluded.version,
        description = excluded.description,
        status = 'enabled',
        config = excluded.config,
        permissions = excluded.permissions,
        capabilities = excluded.capabilities,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      pluginRecord.id,
      pluginRecord.name,
      pluginRecord.version,
      pluginRecord.description,
      pluginRecord.status,
      JSON.stringify(pluginRecord.config),
      JSON.stringify(pluginRecord.permissions),
      JSON.stringify(pluginRecord.capabilities),
      now,
      now
    );

    this.emit('plugin:installed', pluginRecord);
    return pluginRecord;
  }

  /**
   * Enable a previously installed or disabled plugin
   */
  async enablePlugin(pluginId) {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) throw new Error(`Plugin '${pluginId}' not installed`);

    const instance = this._activeInstances.get(pluginId);
    if (instance) {
      await instance.onEnable();
    }

    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE zero_installed_plugins SET status = 'enabled', updated_at = ? WHERE id = ?
    `);
    stmt.run(now, pluginId);

    // Activate capabilities in capability engine
    for (const capName of plugin.capabilities) {
      const cap = this.ce.customCapabilities.get(capName);
      if (cap) cap.disabled = false;
    }

    const updated = this.getPlugin(pluginId);
    this.emit('plugin:enabled', updated);
    return updated;
  }

  /**
   * Disable an active plugin without removing its configuration
   */
  async disablePlugin(pluginId) {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) throw new Error(`Plugin '${pluginId}' not installed`);

    const instance = this._activeInstances.get(pluginId);
    if (instance) {
      await instance.onDisable();
    }

    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE zero_installed_plugins SET status = 'disabled', updated_at = ? WHERE id = ?
    `);
    stmt.run(now, pluginId);

    // Deactivate capabilities in capability engine
    for (const capName of plugin.capabilities) {
      const cap = this.ce.customCapabilities.get(capName);
      if (cap) cap.disabled = true;
    }

    const updated = this.getPlugin(pluginId);
    this.emit('plugin:disabled', updated);
    return updated;
  }

  /**
   * Uninstall and purge plugin
   */
  async uninstallPlugin(pluginId) {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) throw new Error(`Plugin '${pluginId}' not installed`);

    const instance = this._activeInstances.get(pluginId);
    if (instance) {
      await instance.onDestroy();
      this._activeInstances.delete(pluginId);
    }

    // Remove capabilities from engine
    for (const capName of plugin.capabilities) {
      this.ce.customCapabilities.delete(capName);
    }

    const stmt = this.db.prepare(`DELETE FROM zero_installed_plugins WHERE id = ?`);
    stmt.run(pluginId);

    this.emit('plugin:uninstalled', { id: pluginId });
    return { ok: true, uninstalled: pluginId };
  }

  getPlugin(pluginId) {
    const stmt = this.db.prepare(`SELECT * FROM zero_installed_plugins WHERE id = ?`);
    const row = stmt.get(pluginId);
    if (!row) return null;
    return this._formatPlugin(row);
  }

  listPlugins(filter = {}) {
    let sql = `SELECT * FROM zero_installed_plugins WHERE 1=1`;
    const params = [];

    if (filter.status) {
      sql += ` AND status = ?`;
      params.push(filter.status);
    }
    sql += ` ORDER BY installed_at DESC`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => this._formatPlugin(r));
  }

  getDiagnostics() {
    const all = this.listPlugins();
    const enabled = all.filter((p) => p.status === 'enabled');
    const disabled = all.filter((p) => p.status === 'disabled');

    const allCapabilities = [];
    for (const p of enabled) {
      allCapabilities.push(...p.capabilities);
    }

    return {
      ok: true,
      totalInstalled: all.length,
      activePlugins: enabled.length,
      disabledPlugins: disabled.length,
      totalCapabilitiesProvided: allCapabilities.length,
      capabilities: allCapabilities,
      plugins: all.map((p) => ({
        id: p.id,
        name: p.name,
        version: p.version,
        status: p.status,
        capabilitiesCount: p.capabilities.length,
      })),
      timestamp: Date.now(),
    };
  }

  _formatPlugin(row) {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      description: row.description,
      status: row.status,
      config: JSON.parse(row.config || '{}'),
      permissions: JSON.parse(row.permissions || '[]'),
      capabilities: JSON.parse(row.capabilities || '[]'),
      installedAt: row.installed_at,
      updatedAt: row.updated_at,
    };
  }

  close() {
    this.removeAllListeners();
    try {
      this.db.close();
    } catch (_) {}
  }
}
