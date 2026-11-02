/** Native Control UI projection over the actual local SkillLoader (no upstream state writes). */
import fs from 'node:fs';
import path from 'node:path';
import { skillStatusRow } from '../../packages/skill-sdk/status.mjs';

export const SKILLS_UI_METHODS = Object.freeze([
  'skills.status', 'skills.library.list', 'skills.library.read', 'skills.library.save', 'skills.library.mutate',
  'skills.library.import', 'skills.import', 'skills.install', 'skills.update', 'skills.uninstall',
  'skills.enable', 'skills.disable', 'skills.config', 'skills.skillCard', 'skills.bins',
]);

function nameOf(params) {
  const name = params.skillKey || params.skillId || params.name || params.skillName || params.slug;
  if (typeof name !== 'string' || !name) throw new Error('A skillKey or skill name is required');
  return name;
}

function entryOf(loader, name) {
  const bundle = loader.readSkillBundle(name);
  const skill = bundle.skill;
  return { skillId: skill.name, slug: skill.name, name: skill.name, description: skill.description,
    ownerProfileId: null, authorProfileId: null, ownerLabel: 'Local workspace', shared: true,
    enabled: skill.enabled, removed: false, revision: bundle.revision,
    createdAt: skill.installedAt || fs.statSync(skill.filePath).birthtimeMs,
    updatedAt: skill.updatedAt || fs.statSync(skill.filePath).mtimeMs, canEdit: true };
}

function receipt(loader, name, state = 'saved') {
  return { ok: true, state, entry: entryOf(loader, name), target: 'workspace',
    nextAction: 'The skill is available in this workspace. Enable it to use it in a task.' };
}

function redactConfig(config) {
  return { ...config, ...(Object.hasOwn(config, 'apiKey') ? { apiKey: config.apiKey ? '__OPENCLAW_REDACTED__' : '' } : {}),
    ...(config.env ? { env: Object.fromEntries(Object.entries(config.env).map(([key, value]) => [key, value ? '__OPENCLAW_REDACTED__' : ''])) } : {}) };
}

function sourceOf(params) {
  const source = params.source;
  if (source && typeof source === 'object') {
    const kind = source.type || source.kind;
    if (kind === 'local') return { type: 'local', path: source.path };
    if (kind === 'github') return { type: 'github', url: source.url, ref: source.ref, subpath: source.subpath };
    throw new Error(`Skill source '${kind}' is not available. Supply a local path or GitHub URL.`);
  }
  if (['clawhub', 'upload'].includes(source)) throw new Error(`Skill source '${source}' is not available in the local SDK. Supply a local path or GitHub URL.`);
  const input = params.path || params.url || (source && !['local', 'github'].includes(source) ? source : null);
  if (!input) throw new Error('Skill installation requires a local path or GitHub URL; dependency install IDs are not executable skill packages');
  return input;
}

/** Return undefined for an unhandled method; gateway dispatch/authorization stays with the host. */
export async function handleSkillsUi(method, params = {}, loader) {
  if (!SKILLS_UI_METHODS.includes(method)) return undefined;
  if (!loader) throw new Error('SkillLoader is required');
  switch (method) {
    case 'skills.status': {
      const status = loader.getStatus();
      return { ok: true, workspaceDir: path.dirname(loader.skillsDir), managedSkillsDir: loader.skillsDir,
        agentId: params.agentId, skills: status.skills.map(skillStatusRow), diagnostics: status.diagnostics };
    }
    case 'skills.library.list': {
      if (params.scope && !['all', 'mine', 'team'].includes(params.scope)) throw new Error('Invalid skill library scope');
      // A workspace library has no remote profile or cloud ownership. Local identity enables the editor.
      const entries = params.scope === 'mine' ? [] : loader.listSkills().map(skill => entryOf(loader, skill.name));
      return { entries, profileId: 'local', multipleProfiles: false, defaultTarget: 'workspace', defaultSelectionLimit: 64,
        ...(params.sessionKey ? { session: { sessionKey: params.sessionKey, selections: [], attachable: entries } } : {}) };
    }
    case 'skills.library.read': {
      const name = nameOf(params);
      const bundle = loader.readSkillBundle(name);
      if (params.revision && params.revision !== bundle.revision) throw new Error('Historical skill revisions are not available in the workspace library');
      return { entry: entryOf(loader, name), content: bundle.content, files: bundle.files,
        revisions: [{ revision: bundle.revision, createdAt: entryOf(loader, name).updatedAt }] };
    }
    case 'skills.library.save': {
      const result = loader.saveSkillBundle(params);
      return receipt(loader, result.name);
    }
    case 'skills.library.mutate': {
      const name = nameOf(params);
      const entry = entryOf(loader, name);
      if (params.expectedRevision !== entry.revision) throw new Error('Skill revision conflict; reload before changing the skill');
      if (params.action === 'remove') {
        loader.uninstallSkill(name);
        return { ok: true, state: 'removed', entry: { ...entry, removed: true }, target: 'workspace', nextAction: 'Skill removed from this workspace.' };
      }
      if (!['enable', 'disable'].includes(params.action)) throw new Error(`Library action '${params.action}' is not supported by the local workspace`);
      loader.setSkillEnabled(name, params.action === 'enable');
      return receipt(loader, name, params.action === 'enable' ? 'enabled' : 'disabled');
    }
    case 'skills.library.import':
    case 'skills.import':
    case 'skills.install': {
      const result = typeof params.content === 'string' ? loader.saveSkillBundle(params) : await loader.installSkill(sourceOf(params), params);
      const installed = { ...result, message: `Installed ${result.name}`, stdout: '', stderr: '', code: 0,
        slug: result.name, version: result.skill.version, targetDir: path.dirname(result.path) };
      return method === 'skills.install' ? installed : { ...installed, ...receipt(loader, result.name, 'imported') };
    }
    case 'skills.update': {
      if (params.source === 'clawhub') throw new Error('ClawHub updates are unavailable in the local SDK');
      const name = nameOf(params);
      if (params.enabled !== undefined && typeof params.enabled !== 'boolean') throw new Error('enabled must be boolean');
      const config = { ...(params.config || {}) };
      if (params.apiKey !== undefined) {
        if (typeof params.apiKey !== 'string') throw new Error('apiKey must be text');
        config.apiKey = params.apiKey;
      }
      if (params.env !== undefined) {
        if (!params.env || typeof params.env !== 'object' || Array.isArray(params.env) || Object.values(params.env).some(value => typeof value !== 'string')) throw new Error('env must map names to text values');
        config.env = { ...loader.getSkillConfig(name).env, ...params.env };
      }
      const settingsOnly = params.enabled !== undefined || params.apiKey !== undefined || params.env !== undefined || params.config !== undefined;
      if (settingsOnly) loader.updateSkillSettings(name, { enabled: params.enabled, config });
      else await loader.updateSkill(name, { ...params, ...(params.source ? { source: sourceOf(params) } : {}) });
      const skill = loader.getSkill(name);
      return { ok: true, skillKey: name, config: { ...redactConfig(skill.config), enabled: skill.enabled } };
    }
    case 'skills.uninstall': return loader.uninstallSkill(nameOf(params));
    case 'skills.enable': return loader.enableSkill(nameOf(params));
    case 'skills.disable': return loader.disableSkill(nameOf(params));
    case 'skills.config': {
      const name = nameOf(params);
      if (params.config !== undefined) loader.configureSkill(name, params.config);
      return { ok: true, skillKey: name, config: redactConfig(loader.getSkillConfig(name)) };
    }
    case 'skills.skillCard': {
      const name = nameOf(params);
      return { skillKey: name, content: loader.readSkillBundle(name).content };
    }
    case 'skills.bins': return { bins: [...new Set(loader.listSkills().flatMap(skill => skillStatusRow(skill).requirements.bins))].sort() };
  }
}
