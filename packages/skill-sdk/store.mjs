import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { acquireSource, copySkillTree } from './source.mjs';
import { parseSkillMarkdown } from './frontmatter.mjs';
import { readSkillBundle, writeSkillBundle } from './bundle.mjs';

function jsonConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Skill config must be a JSON object');
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (item === undefined || typeof item === 'function' || typeof item === 'symbol' || (typeof item === 'number' && !Number.isFinite(item))) {
      throw new Error('Skill config must contain only JSON values');
    }
    return item;
  }));
}

/** Filesystem lifecycle; publishing and registry writes are rolled back together on errors. */
export class SkillStore {
  constructor(options = {}) {
    this.skillsDir = path.resolve(options.skillsDir || path.join(process.cwd(), 'skills'));
    this.statePath = path.resolve(options.statePath || path.join(this.skillsDir, '.zero-skills.json'));
    this.executionContext = options.executionContext || {};
    this._sourceAbort = new AbortController();
    this._sourceOperations = new Set();
    this._sourceClosePromise = null;
  }

  _readState() {
    if (!fs.existsSync(this.statePath)) return { version: 1, skills: {} };
    if (fs.lstatSync(this.statePath).isSymbolicLink()) throw new Error('Skill registry cannot be a symbolic link');
    const state = JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
    if (state.version !== 1 || !state.skills || typeof state.skills !== 'object' || Array.isArray(state.skills)) throw new Error('Invalid skill registry');
    return state;
  }

  _saveState(state) {
    fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
    const temporary = `${this.statePath}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
      fs.renameSync(temporary, this.statePath);
    } finally {
      fs.rmSync(temporary, { force: true });
    }
  }

  _mutate(callback) {
    fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
    const lockPath = this.statePath + '.lock';
    let lock;
    try { lock = fs.openSync(lockPath, 'wx', 0o600); } catch (error) {
      if (error.code === 'EEXIST') throw new Error('Skill registry is busy; retry the operation');
      throw error;
    }
    try { return callback(this._readState()); } finally {
      fs.closeSync(lock);
      fs.rmSync(lockPath, { force: true });
    }
  }

  _record(state, name) {
    return Object.hasOwn(state.skills, name) ? state.skills[name] : {};
  }

  _decorate(skill, state) {
    const record = this._record(state, skill.name);
    return { ...skill, enabled: record.enabled !== false, status: record.enabled === false ? 'disabled' : 'enabled',
      config: record.config || {}, source: record.source || null, managed: Boolean(record.managed),
      installedAt: record.installedAt || null, updatedAt: record.updatedAt || null };
  }

  _requireSkill(name) {
    const skill = this.getSkill(name);
    if (!skill) throw new Error(`Skill '${name}' not found`);
    return skill;
  }

  _target(skill) {
    const target = path.dirname(skill.filePath);
    if (path.dirname(target) !== this.skillsDir || fs.lstatSync(target).isSymbolicLink()) throw new Error('Skill target must be a direct directory inside skillsDir');
    return target;
  }

  setSkillEnabled(name, enabled) {
    if (typeof enabled !== 'boolean') throw new Error('enabled must be boolean');
    return this.updateSkillSettings(name, { enabled });
  }

  enableSkill(name) { return this.setSkillEnabled(name, true); }
  disableSkill(name) { return this.setSkillEnabled(name, false); }

  configureSkill(name, config) {
    return this.updateSkillSettings(name, { config });
  }

  updateSkillSettings(name, { enabled, config } = {}) {
    this._requireSkill(name);
    if (enabled !== undefined && typeof enabled !== 'boolean') throw new Error('enabled must be boolean');
    const patch = config === undefined ? null : jsonConfig(config);
    this._mutate(state => {
      const record = this._record(state, name);
      Object.defineProperty(state.skills, name, { value: { ...record,
        ...(enabled !== undefined ? { enabled } : {}),
        ...(patch ? { config: { ...record.config, ...patch } } : {}),
        updatedAt: Date.now() }, enumerable: true, configurable: true, writable: true });
      this._saveState(state);
    });
    return { ok: true, skill: this.getSkill(name) };
  }

  getSkillConfig(name) { return this._requireSkill(name).config; }

  async installSkill(input, options = {}) {
    if (typeof input === 'object' && input !== null && !input.type) {
      options = { ...input, ...options };
      input = input.source || input.path || input.url;
    }
    if (!input) throw new Error('Skill source is required');
    if (options.enabled !== undefined && typeof options.enabled !== 'boolean') throw new Error('enabled must be boolean');
    const config = jsonConfig(options.config || {});
    const signal = AbortSignal.any([this._sourceAbort.signal, ...(options.signal ? [options.signal] : [])]);
    signal.throwIfAborted();
    const operation = acquireSource(input, { ...options, signal });
    this._sourceOperations.add(operation);
    try {
      const acquired = await operation;
      try { signal.throwIfAborted(); return this._publish(acquired.directory, acquired.source, { ...options, config }); }
      finally { acquired.cleanup(); }
    } finally { this._sourceOperations.delete(operation); }
  }

  closeSources(reason = new Error('Skill source acquisition stopped with its host')) {
    if (this._sourceClosePromise) return this._sourceClosePromise;
    this._sourceAbort.abort(reason);
    this._sourceClosePromise = Promise.allSettled([...this._sourceOperations]).then(results => ({
      ok: !results.some(result => result.status === 'rejected' && result.reason?.childTreeExitConfirmed === false),
      acquisitionsDrained: results.length,
      cleanupUnconfirmed: results.filter(result => result.status === 'rejected' && result.reason?.childTreeExitConfirmed === false).length,
    }));
    return this._sourceClosePromise;
  }

  _publish(directory, source, options = {}) {
    fs.mkdirSync(this.skillsDir, { recursive: true });
    const stage = fs.mkdtempSync(path.join(this.skillsDir, '.skill-stage-'));
    const stagedPackage = path.join(stage, 'package');
    let previousArchive = null;
    try {
      // Copy and validate before touching an installed package, including bundled assets.
      copySkillTree(directory, stagedPackage);
      const skill = parseSkillMarkdown(fs.readFileSync(path.join(stagedPackage, 'SKILL.md'), 'utf8'), path.basename(directory), path.join(stagedPackage, 'SKILL.md'));
      this._mutate(state => {
        const existing = this.getSkill(skill.name);
        if (options.updateName && skill.name !== options.updateName) throw new Error('Updating a skill cannot change its name');
        if (options.updateName && (!existing || (!this._record(state, skill.name).managed && !options.allowUnmanagedUpdate))) throw new Error('Only installed skills with a recorded source can be updated');
        if (options.expectedRevision !== undefined && (existing ? readSkillBundle(this._target(existing)).revision : null) !== options.expectedRevision) throw new Error('Skill revision conflict; reload before saving');
        if (existing && !options.updateName) throw new Error(`Skill '${skill.name}' is already installed`);
        const target = existing ? this._target(existing) : path.join(this.skillsDir, skill.name);
        if (!existing && fs.existsSync(target)) throw new Error('Skill destination already exists');
        const old = this._record(state, skill.name);
        if (existing) {
          previousArchive = fs.mkdtempSync(path.join(this.skillsDir, '.skill-previous-'));
          fs.writeFileSync(path.join(previousArchive, 'record.json'), JSON.stringify({ schemaVersion: 1, name: skill.name, archivedAt: Date.now(), record: old }, null, 2), { flag: 'wx', mode: 0o600 });
        }
        const backup = existing ? path.join(previousArchive, 'bundle') : null;
        let published = false;
        if (existing) fs.renameSync(target, backup);
        try {
          fs.renameSync(stagedPackage, target);
          published = true;
          Object.defineProperty(state.skills, skill.name, { value: {
            ...old, managed: true, source, enabled: options.updateName ? old.enabled !== false : options.enabled !== false,
            config: options.updateName ? old.config || {} : options.config || {},
            installedAt: old.installedAt || Date.now(), updatedAt: Date.now(),
          }, enumerable: true, configurable: true, writable: true });
          this._saveState(state);
        } catch (error) {
          if (published) fs.rmSync(target, { recursive: true, force: true });
          if (existing) fs.renameSync(backup, target);
          throw error;
        }
      });
      const installed = this.getSkill(skill.name);
      return { ok: true, name: skill.name, path: installed.filePath, skill: installed, ...(previousArchive ? { archivePath: previousArchive } : {}) };
    } finally { fs.rmSync(stage, { recursive: true, force: true }); }
  }

  async updateSkill(name, options = {}) {
    const skill = this._requireSkill(name);
    if (!skill.managed || !skill.source) throw new Error('Only installed skills with a recorded source can be updated');
    const source = options.source || skill.source;
    if (source.type === 'generated') throw new Error('Generated skills are updated by saving their bundle');
    const acquired = await acquireSource(source, options);
    try { return this._publish(acquired.directory, acquired.source, { updateName: name }); } finally { acquired.cleanup(); }
  }

  uninstallSkill(name) {
    const skill = this._requireSkill(name);
    const target = this._target(skill);
    const archive = fs.mkdtempSync(path.join(this.skillsDir, '.skill-removed-'));
    const tomb = path.join(archive, 'bundle');
    const metadata = path.join(archive, 'record.json');
    let moved = false;
    try {
      this._mutate(state => {
        fs.writeFileSync(metadata, JSON.stringify({ schemaVersion: 1, name, removedAt: Date.now(), record: this._record(state, name) }, null, 2), { flag: 'wx', mode: 0o600 });
        fs.renameSync(target, tomb);
        moved = true;
        try {
          delete state.skills[name];
          this._saveState(state);
        } catch (error) { fs.renameSync(tomb, target); throw error; }
      });
    } catch (error) {
      // A failed state write restores the original bundle above. Retain any
      // archive that still owns a bundle rather than deleting recoverable data.
      if (!moved || !fs.existsSync(tomb)) {
        if (fs.existsSync(metadata)) fs.unlinkSync(metadata);
        fs.rmdirSync(archive);
      }
      throw error;
    }
    this.loadAll();
    return { ok: true, uninstalled: name, archivePath: archive };
  }

  readSkillBundle(name) {
    const skill = this._requireSkill(name);
    return { ...readSkillBundle(this._target(skill)), skill };
  }

  saveSkillBundle({ skillId, expectedRevision = null, content, files = [], retainFiles = [] } = {}) {
    const previous = skillId ? this._requireSkill(skillId) : null;
    if (previous && expectedRevision === null) throw new Error('Updating a skill bundle requires expectedRevision');
    const old = previous ? this.readSkillBundle(skillId) : null;
    if (!Array.isArray(retainFiles)) throw new Error('retainFiles must be an array');
    const retained = retainFiles.map(filePath => {
      const file = old?.files.find(file => file.path === filePath);
      if (!file) throw new Error('Retained file is not present in the expected revision');
      return file;
    });
    fs.mkdirSync(this.skillsDir, { recursive: true });
    const temporary = fs.mkdtempSync(path.join(this.skillsDir, '.skill-bundle-'));
    try {
      writeSkillBundle(temporary, content, [...files, ...retained]);
      return this._publish(temporary, previous?.source || { type: 'generated' }, { expectedRevision,
        ...(previous ? { updateName: skillId, allowUnmanagedUpdate: true } : {}) });
    } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  }

  createCustomSkill({ name, description, triggers = [], capabilities = [], workflowSteps = [], examples = [], overwrite = false } = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new Error('Skill name is required');
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!cleanName) throw new Error('Skill name is invalid');
    const existing = this.getSkill(cleanName);
    if (existing && !overwrite) return { ok: false, reason: 'skill-already-exists', path: existing.filePath };
    const content = `---\nname: ${JSON.stringify(cleanName)}\ndescription: ${JSON.stringify(description || `Auto-learned skill for ${cleanName}`)}\ntriggers: ${JSON.stringify(triggers.length ? triggers : [cleanName])}\n---\n\n# ${cleanName}\n\n## Capabilities\n${capabilities.map((item, i) => `${i + 1}. **${item}**`).join('\n')}\n\n## Standard Execution Workflow\n${workflowSteps.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n## Examples\n${examples.map(item => `- ${item}`).join('\n')}\n`;
    // Use the same transactional publisher, while keeping generated sources self-contained.
    fs.mkdirSync(this.skillsDir, { recursive: true });
    const temporary = fs.mkdtempSync(path.join(this.skillsDir, '.skill-create-'));
    try {
      fs.writeFileSync(path.join(temporary, 'SKILL.md'), content, 'utf8');
      const result = this._publish(temporary, { type: 'generated' }, { ...(existing ? { updateName: cleanName, allowUnmanagedUpdate: true } : {}), config: {} });
      return { ...result, bytes: Buffer.byteLength(content) };
    } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  }
}
