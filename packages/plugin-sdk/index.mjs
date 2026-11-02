/** Executable plugin lifecycle. Plugin code is trusted local Node.js code, not a sandbox. */
import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PluginSourceLoader } from './source-loader.mjs';

export class ZeroPlugin extends EventEmitter {
  constructor(manifest = {}) {
    super();
    this.manifest = manifest;
    this.context = null;
    this.enabled = false;
  }
  async onLoad(context) { this.context = context; }
  async onEnable() { this.enabled = true; }
  async onDisable() { this.enabled = false; }
  async onDestroy() { this.enabled = false; this.removeAllListeners(); }
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const names = (manifest) => manifest.capabilities.map((cap) => typeof cap === 'string' ? cap : cap.name);

function normalizeManifest(value) {
  if (!value || typeof value.id !== 'string' || !value.id.trim() || /[\x00-\x1f]/.test(value.id)) {
    throw new Error('Plugin installation requires a valid manifest with id');
  }
  const manifest = clone(value);
  manifest.name ||= manifest.id;
  manifest.version ||= '1.0.0';
  manifest.description ||= '';
  manifest.config ??= {};
  manifest.permissions ??= [];
  manifest.capabilities ??= [];
  if (!manifest.config || typeof manifest.config !== 'object' || Array.isArray(manifest.config)) throw new Error('Plugin config must be a JSON object');
  if (!Array.isArray(manifest.permissions) || manifest.permissions.some((permission) => typeof permission !== 'string')) throw new Error('Plugin permissions must be an array of strings');
  if (!Array.isArray(manifest.capabilities)) throw new Error('Plugin capabilities must be an array');
  const seen = new Set();
  for (const cap of manifest.capabilities) {
    const name = typeof cap === 'string' ? cap : cap?.name;
    if (typeof name !== 'string' || !/^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(name) || seen.has(name)) throw new Error('Plugin capabilities require unique valid names');
    if (['zero_computer_action', 'browser', 'open_app'].includes(name)) throw new Error(`Plugin capability '${name}' conflicts with a built-in capability`);
    seen.add(name);
  }
  return manifest;
}

function sourceInput(input) {
  if (typeof input === 'string') return { kind: 'directory', spec: input };
  if (input?.path || input?.directory) return { kind: 'directory', spec: input.path || input.directory };
  if (input?.package) return { kind: 'package', spec: input.package };
  if (input?.kind && input?.spec) return input;
  if (input?.source) return sourceInput(input.source);
  return null;
}

export class PluginManager extends EventEmitter {
  constructor({ dbPath = ':memory:', capabilityEngine, logger = console, pluginsDir, npmCliPath } = {}) {
    super();
    if (!capabilityEngine?.registerPlugin || !(capabilityEngine.customCapabilities instanceof Map)) throw new Error('PluginManager requires capabilityEngine instance');
    this.ce = capabilityEngine;
    this.logger = logger;
    this.pluginsDir = path.resolve(pluginsDir || (dbPath === ':memory:'
      ? fs.mkdtempSync(path.join(os.tmpdir(), 'zero-plugin-sdk-'))
      : path.join(path.dirname(path.resolve(dbPath)), 'plugin-sdk')));
    this.loader = new PluginSourceLoader(this.pluginsDir, { npmCliPath });
    this.db = new DatabaseSync(dbPath);
    this._runtimes = new Map();
    this._activeInstances = new Map();
    this._cleanupErrors = [];
    this._closing = false;
    this._closed = false;
    this._initSchema();
    this.ready = Promise.resolve().then(() => this._restore());
    this._queue = this.ready.catch(() => {});
  }

  _initSchema() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS zero_installed_plugins (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, version TEXT NOT NULL, description TEXT,
      status TEXT NOT NULL, config TEXT, permissions TEXT, capabilities TEXT,
      installed_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    ); CREATE INDEX IF NOT EXISTS idx_plugins_status ON zero_installed_plugins(status);`);
    const columns = new Set(this.db.prepare('PRAGMA table_info(zero_installed_plugins)').all().map((column) => column.name));
    // Additive migration preserves records that lack restorable executable code.
    this.db.exec('BEGIN');
    try {
      for (const column of ['manifest', 'source', 'last_error']) {
        if (!columns.has(column)) this.db.exec(`ALTER TABLE zero_installed_plugins ADD COLUMN ${column} TEXT`);
      }
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  _schedule(operation) {
    if (this._closing || this._closed) return Promise.reject(new Error('PluginManager is closed'));
    const task = this._queue.then(operation);
    this._queue = task.catch(() => {});
    return task;
  }

  initialize() { return this.ready; }

  _notify(event, payload) {
    try { this.emit(event, payload); } catch (error) { this._warn(error); }
  }

  _warn(error) {
    this._cleanupErrors.push(error.message);
    this.logger?.warn?.(`[PluginManager] ${error.message}`);
  }

  async _discard(source) {
    try { await this.loader.discard(source); } catch (error) { this._warn(error); }
  }

  _row(id) { return this.db.prepare('SELECT * FROM zero_installed_plugins WHERE id = ?').get(id); }

  _required(id) {
    const row = this._row(id);
    if (!row) throw new Error(`Plugin '${id}' not installed`);
    return row;
  }

  _manifest(row) {
    return normalizeManifest(row.manifest ? JSON.parse(row.manifest) : {
      id: row.id, name: row.name, version: row.version, description: row.description,
      config: JSON.parse(row.config || '{}'), permissions: JSON.parse(row.permissions || '[]'),
      capabilities: JSON.parse(row.capabilities || '[]'),
    });
  }

  _write(manifest, source, status, installedAt = Date.now()) {
    const now = Date.now();
    this.db.prepare(`INSERT INTO zero_installed_plugins
      (id, name, version, description, status, config, permissions, capabilities,
       installed_at, updated_at, manifest, source, last_error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, version=excluded.version,
      description=excluded.description, status=excluded.status, config=excluded.config,
      permissions=excluded.permissions, capabilities=excluded.capabilities,
      updated_at=excluded.updated_at, manifest=excluded.manifest, source=excluded.source, last_error=NULL`)
      .run(manifest.id, manifest.name, manifest.version, manifest.description, status,
        JSON.stringify(manifest.config), JSON.stringify(manifest.permissions), JSON.stringify(names(manifest)),
        installedAt, now, JSON.stringify(manifest), source ? JSON.stringify(source) : null);
  }

  _checkOwnership(manifest, replacing = null) {
    const requested = new Set(names(manifest));
    for (const row of this.db.prepare('SELECT id, capabilities FROM zero_installed_plugins').all()) {
      if (row.id === replacing) continue;
      for (const name of JSON.parse(row.capabilities || '[]')) {
        if (requested.has(name)) throw new Error(`Capability '${name}' is owned by plugin '${row.id}'`);
      }
    }
    const previous = this._runtimes.get(replacing);
    for (const name of requested) {
      const registered = this.ce.customCapabilities.get(name);
      if (registered && previous?.owned.get(name) !== registered) throw new Error(`Capability '${name}' is already registered`);
    }
    const loaded = this.ce.loadedPlugins?.get(manifest.id);
    if (loaded && (!previous || loaded !== previous.engineRecord)) throw new Error(`Plugin '${manifest.id}' is already registered in the capability engine`);
  }

  async _createRuntime(manifest, source, suppliedHandlers = {}, suppliedInstance = null) {
    const dataDir = path.join(this.pluginsDir, 'data', createHash('sha256').update(manifest.id).digest('hex'));
    await fs.promises.mkdir(dataDir, { recursive: true });
    const context = {
      pluginId: manifest.id, config: clone(manifest.config), permissions: [...manifest.permissions],
      dataDir, pluginDir: source ? path.resolve(source.root, source.packageRoot) : null, logger: this.logger,
    };
    let instance = suppliedInstance;
    let module = {};
    try {
      if (source) {
        module = await this.loader.import(source);
        if (typeof module.createPlugin === 'function') instance = await module.createPlugin(context);
        else if (typeof module.default === 'function') {
          const exported = module.default;
          instance = /^class\s/.test(Function.prototype.toString.call(exported)) ? new exported(manifest) : await exported(context);
        } else instance = module.default || { ...module };
      }
      instance ||= new ZeroPlugin(manifest);
      if (typeof instance !== 'object') throw new Error('Plugin entry must export an instance, class, or factory');
      for (const hook of ['onLoad', 'onEnable', 'onDisable', 'onDestroy']) {
        if (instance[hook] != null && typeof instance[hook] !== 'function') throw new Error(`Invalid plugin hook '${hook}'`);
      }
      await instance.onLoad?.(context);
      const available = { ...module.handlers, ...instance.handlers, ...suppliedHandlers };
      const handlers = Object.create(null);
      for (const name of names(manifest)) {
        if (!Object.hasOwn(available, name) || typeof available[name] !== 'function') throw new Error(`Plugin '${manifest.id}' capability '${name}' is unavailable: missing executable handler`);
        handlers[name] = available[name].bind(instance);
      }
      return { manifest, source, instance, handlers, owned: new Map(), pending: new Set(),
        enabled: false, accepting: false, destroyed: false, engineRecord: null };
    } catch (error) {
      try { await instance?.onDestroy?.(); } catch (cleanupError) { this._warn(cleanupError); }
      throw error;
    }
  }

  _gate(runtime, enabled) {
    runtime.accepting = enabled;
    for (const [name, definition] of runtime.owned) {
      if (this.ce.customCapabilities.get(name) === definition) definition.disabled = !enabled;
    }
    if (runtime.engineRecord) runtime.engineRecord.status = enabled ? 'active' : 'disabled';
  }

  _register(runtime) {
    const handlers = Object.create(null);
    for (const name of names(runtime.manifest)) {
      handlers[name] = async (...args) => {
        if (!runtime.accepting || runtime.destroyed) throw new Error('capability-disabled');
        const task = Promise.resolve().then(() => runtime.handlers[name](...args));
        runtime.pending.add(task);
        try { return await task; } finally { runtime.pending.delete(task); }
      };
    }
    try {
      runtime.engineRecord = this.ce.registerPlugin(runtime.manifest, handlers);
      for (const name of names(runtime.manifest)) {
        const definition = this.ce.customCapabilities.get(name);
        runtime.owned.set(name, definition);
        definition.pluginId = runtime.manifest.id;
      }
      this._gate(runtime, runtime.enabled);
    } catch (error) {
      for (const name of Object.keys(handlers)) {
        if (this.ce.customCapabilities.get(name)?.handler === handlers[name]) this.ce.customCapabilities.delete(name);
      }
      const entry = this.ce.loadedPlugins?.get(runtime.manifest.id);
      if (entry && entry !== this._runtimes.get(runtime.manifest.id)?.engineRecord) this.ce.loadedPlugins.delete(runtime.manifest.id);
      throw error;
    }
  }

  _unregister(runtime) {
    this._gate(runtime, false);
    for (const [name, definition] of runtime.owned) {
      if (this.ce.customCapabilities.get(name) === definition) this.ce.customCapabilities.delete(name);
    }
    runtime.owned.clear();
    if (this.ce.loadedPlugins?.get(runtime.manifest.id) === runtime.engineRecord) this.ce.loadedPlugins.delete(runtime.manifest.id);
    runtime.engineRecord = null;
  }

  async _enable(runtime) {
    if (!runtime.enabled) await runtime.instance.onEnable?.();
    runtime.enabled = true;
    this._gate(runtime, true);
  }

  async _disable(runtime) {
    if (!runtime.enabled) return;
    this._gate(runtime, false);
    await Promise.allSettled([...runtime.pending]);
    try { await runtime.instance.onDisable?.(); }
    catch (error) { this._gate(runtime, true); throw error; }
    runtime.enabled = false;
  }

  async _dispose(runtime) {
    if (!runtime) return;
    try { await this._disable(runtime); } catch (error) { this._warn(error); }
    this._unregister(runtime);
    runtime.destroyed = true;
    try { await runtime.instance.onDestroy?.(); } catch (error) { this._warn(error); }
  }

  async _prepare(input, handlers, instance, config) {
    const descriptor = sourceInput(input);
    let staged;
    try {
      staged = descriptor ? await this.loader.stage(descriptor) : { manifest: input, source: null };
      if (descriptor && input?.id && input.id !== staged.manifest.id) throw new Error('Plugin source id does not match requested id');
      const manifest = normalizeManifest({ ...staged.manifest,
        ...(config !== undefined ? { config } : (descriptor && input?.config !== undefined ? { config: input.config } : {})) });
      return { manifest, source: staged.source, handlers, instance };
    } catch (error) { if (staged?.source) await this._discard(staged.source); throw error; }
  }

  async _restore() {
    const report = { restored: [], unavailable: [] };
    for (const row of this.db.prepare('SELECT * FROM zero_installed_plugins ORDER BY installed_at').all()) {
      let source;
      let runtime;
      try {
        if (!row.source) throw new Error('Executable source unavailable; reinstall from a directory or package (runtime handlers cannot be persisted)');
        const manifest = this._manifest(row);
        manifest.config = JSON.parse(row.config || '{}');
        this._checkOwnership(manifest, row.id);
        const staged = await this.loader.stage(JSON.parse(row.source));
        source = staged.source;
        if (staged.manifest.id !== row.id) throw new Error('Persisted plugin source id mismatch');
        runtime = await this._createRuntime(manifest, source);
        if (row.status === 'enabled') await this._enable(runtime);
        this._register(runtime);
        this._write(manifest, source, row.status, row.installed_at);
        this._runtimes.set(row.id, runtime);
        this._activeInstances.set(row.id, runtime.instance);
        await this._discard(JSON.parse(row.source));
        report.restored.push(row.id);
      } catch (error) {
        await this._dispose(runtime);
        await this._discard(source);
        this.db.prepare('UPDATE zero_installed_plugins SET last_error = ? WHERE id = ?').run(error.message, row.id);
        report.unavailable.push({ id: row.id, error: error.message });
      }
    }
    return report;
  }

  installPlugin(input, handlers = {}, instance = null) {
    return this._schedule(async () => {
      const prepared = await this._prepare(input, handlers, instance);
      let runtime;
      try {
        if (this._row(prepared.manifest.id)) throw new Error(`Plugin '${prepared.manifest.id}' already installed; use updatePlugin`);
        this._checkOwnership(prepared.manifest);
        runtime = await this._createRuntime(prepared.manifest, prepared.source, handlers, instance);
        await this._enable(runtime);
        this._register(runtime);
        this._write(prepared.manifest, prepared.source, 'enabled');
        this._runtimes.set(prepared.manifest.id, runtime);
        this._activeInstances.set(prepared.manifest.id, runtime.instance);
      } catch (error) {
        await this._dispose(runtime);
        await this._discard(prepared.source);
        throw error;
      }
      const result = this.getPlugin(prepared.manifest.id);
      this._notify('plugin:installed', result);
      return result;
    });
  }

  installFromDirectory(directory, options = {}) { return this.installPlugin({ path: directory, ...options }); }
  installFromPackage(spec, options = {}) { return this.installPlugin({ package: spec, ...options }); }

  enablePlugin(id) {
    return this._schedule(async () => {
      const row = this._required(id);
      let runtime = this._runtimes.get(id);
      if (runtime?.enabled && row.status === 'enabled') return this.getPlugin(id);
      let fresh = false;
      let source;
      try {
        if (!runtime) {
          if (!row.source) throw new Error(`Plugin '${id}' executable source unavailable; reinstall or update from a source`);
          const manifest = this._manifest(row);
          manifest.config = JSON.parse(row.config || '{}');
          this._checkOwnership(manifest, id);
          const staged = await this.loader.stage(JSON.parse(row.source));
          source = staged.source;
          runtime = await this._createRuntime(manifest, source);
          fresh = true;
        }
        await this._enable(runtime);
        if (fresh) this._register(runtime);
        this._write(runtime.manifest, runtime.source, 'enabled', row.installed_at);
        this._runtimes.set(id, runtime);
        this._activeInstances.set(id, runtime.instance);
      } catch (error) {
        if (fresh) await this._dispose(runtime);
        else if (runtime?.enabled) { try { await this._disable(runtime); } catch (cleanupError) { this._warn(cleanupError); } }
        await this._discard(source);
        throw error;
      }
      if (fresh) await this._discard(JSON.parse(row.source));
      const result = this.getPlugin(id);
      this._notify('plugin:enabled', result);
      return result;
    });
  }

  disablePlugin(id) {
    return this._schedule(async () => {
      const row = this._required(id);
      const runtime = this._runtimes.get(id);
      if (row.status === 'disabled' && !runtime?.enabled) return this.getPlugin(id);
      if (runtime) await this._disable(runtime);
      try {
        this.db.prepare("UPDATE zero_installed_plugins SET status='disabled', updated_at=? WHERE id=?").run(Date.now(), id);
      } catch (error) { if (runtime) await this._enable(runtime); throw error; }
      const result = this.getPlugin(id);
      this._notify('plugin:disabled', result);
      return result;
    });
  }

  updatePlugin(id, input, options = {}) { return this._schedule(() => this._replace(id, input, options, false)); }
  restartPlugin(id) { return this._schedule(() => this._replace(id, undefined, {}, true)); }

  async _replace(id, input, options, restart) {
    const row = this._required(id);
    const previousSource = row.source ? JSON.parse(row.source) : null;
    if (input === undefined) {
      if (!previousSource) throw new Error(`Plugin '${id}' has no persistent source; supply a directory or package`);
      input = restart ? previousSource : { kind: previousSource.kind, spec: previousSource.spec };
    }
    const config = options.config ?? input?.config ?? JSON.parse(row.config || '{}');
    const prepared = await this._prepare(input, {}, null, config);
    const previous = this._runtimes.get(id);
    const wasEnabled = Boolean(previous?.enabled);
    let candidate;
    let detached = false;
    try {
      if (prepared.manifest.id !== id) throw new Error('Plugin update cannot change its id');
      this._checkOwnership(prepared.manifest, id);
      candidate = await this._createRuntime(prepared.manifest, prepared.source);
      if (previous) { await this._disable(previous); this._unregister(previous); detached = true; }
      if (row.status === 'enabled') await this._enable(candidate);
      this._register(candidate);
      this._write(prepared.manifest, prepared.source, row.status, row.installed_at);
      this._runtimes.set(id, candidate);
      this._activeInstances.set(id, candidate.instance);
    } catch (error) {
      await this._dispose(candidate);
      await this._discard(prepared.source);
      if (previous && detached) {
        try {
          if (wasEnabled) await this._enable(previous);
          this._register(previous);
        } catch (restoreError) {
          this._gate(previous, false);
          this.db.prepare('UPDATE zero_installed_plugins SET last_error=? WHERE id=?').run(restoreError.message, id);
          throw new AggregateError([error, restoreError], `Plugin '${id}' update and rollback failed`);
        }
      }
      throw error;
    }
    await this._dispose(previous);
    await this._discard(previousSource);
    const result = this.getPlugin(id);
    this._notify(restart ? 'plugin:restarted' : 'plugin:updated', result);
    return result;
  }

  uninstallPlugin(id) {
    return this._schedule(async () => {
      const row = this._required(id);
      const runtime = this._runtimes.get(id);
      const wasEnabled = Boolean(runtime?.enabled);
      if (runtime) {
        await this._disable(runtime);
        try { await runtime.instance.onDestroy?.(); }
        catch (error) { if (wasEnabled) await this._enable(runtime); throw error; }
      }
      this.db.prepare('DELETE FROM zero_installed_plugins WHERE id=?').run(id);
      if (runtime) { runtime.destroyed = true; this._unregister(runtime); }
      this._runtimes.delete(id);
      this._activeInstances.delete(id);
      await this._discard(row.source ? JSON.parse(row.source) : null);
      this._notify('plugin:uninstalled', { id });
      return { ok: true, uninstalled: id, dataPreserved: true };
    });
  }

  removePlugin(id) { return this.uninstallPlugin(id); }
  getPlugin(id) { const row = this._row(id); return row ? this._formatPlugin(row) : null; }

  listPlugins(filter = {}) {
    return this.db.prepare(`SELECT * FROM zero_installed_plugins${filter.status ? ' WHERE status=?' : ''} ORDER BY installed_at DESC`)
      .all(...(filter.status ? [filter.status] : [])).map((row) => this._formatPlugin(row));
  }

  _formatPlugin(row) {
    const runtime = this._runtimes.get(row.id);
    return {
      id: row.id, name: row.name, version: row.version, description: row.description, status: row.status,
      config: JSON.parse(row.config || '{}'), permissions: JSON.parse(row.permissions || '[]'),
      capabilities: JSON.parse(row.capabilities || '[]'), installedAt: row.installed_at, updatedAt: row.updated_at,
      source: row.source ? JSON.parse(row.source) : null,
      loaded: Boolean(runtime && !runtime.destroyed),
      runtimeStatus: runtime?.destroyed ? 'unavailable' : runtime ? (runtime.accepting ? 'active' : 'disabled') : 'unavailable',
      error: row.last_error || null,
    };
  }

  getDiagnostics() {
    const all = this.listPlugins();
    const active = all.filter((plugin) => plugin.runtimeStatus === 'active');
    const unavailable = all.filter((plugin) => plugin.runtimeStatus === 'unavailable');
    const capabilities = active.flatMap((plugin) => plugin.capabilities);
    return {
      ok: unavailable.length === 0 && this._cleanupErrors.length === 0,
      totalInstalled: all.length, activePlugins: active.length,
      disabledPlugins: all.filter((plugin) => plugin.status === 'disabled').length,
      unavailablePlugins: unavailable.length, totalCapabilitiesProvided: capabilities.length, capabilities,
      cleanupErrors: [...this._cleanupErrors],
      plugins: all.map((plugin) => ({ id: plugin.id, name: plugin.name, version: plugin.version,
        status: plugin.status, runtimeStatus: plugin.runtimeStatus, loaded: plugin.loaded,
        error: plugin.error, capabilitiesCount: plugin.capabilities.length })), timestamp: Date.now(),
    };
  }

  close() {
    if (this._closePromise) return this._closePromise;
    this._closing = true;
    this._closePromise = this._queue.then(async () => {
      try {
        for (const runtime of this._runtimes.values()) await this._dispose(runtime);
        this._runtimes.clear();
        this._activeInstances.clear();
      } finally {
        this.db.close();
        this._closed = true;
        this.removeAllListeners();
      }
    });
    return this._closePromise;
  }
}
