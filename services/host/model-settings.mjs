import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function modelSettings(fabric) {
  const settings = fs.existsSync(fabric.agentBindingsPath) ? JSON.parse(fs.readFileSync(fabric.agentBindingsPath, 'utf8')) : {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Invalid model settings file');
  return { ok: true, providers: fabric.getProviders().map(provider => ({ ...provider, models: (fabric.providers.get(provider.id)?.models || []).map(model => typeof model === 'string' ? model : Object.fromEntries(['id', 'name', 'image', 'reasoning', 'tools', 'contextWindow', 'maxTokens'].filter(key => Object.hasOwn(model, key)).map(key => [key, model[key]]))) })),
    defaults: settings.defaults || {}, agentBindings: settings.agentBindings || {}, offlineModels: [],
    localModelsStatus: 'Not supplied by this configured-provider catalog', effectiveModel: fabric.resolveAgentModel('zero')?.canonicalModelId || null };
}

export function assignZeroModel(fabric, params = {}) {
  const model = params.agentModel || params.modelId || params.model || params.primary;
  const validate = value => {
    const resolved = typeof value === 'string' && fabric.resolveModel(value);
    if (!resolved || !resolved.provider.models.some(item => (typeof item === 'string' ? item : item.id || item.name) === resolved.canonicalModelId)) throw new Error(`Model is not in the configured catalog: ${String(value)}`);
  };
  validate(model);
  const file = fabric.agentBindingsPath;
  const original = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const current = original ? JSON.parse(original) : {};
  if (!current || typeof current !== 'object' || Array.isArray(current)) throw new Error('Invalid model settings file');
  const defaults = { ...current.defaults, primary: model };
  for (const key of ['utility', 'fallback', 'thinking', 'fast']) {
    if (params[key] === undefined) continue;
    if (typeof params[key] !== 'string' || params[key].length > 512) throw new Error(`Invalid model preference: ${key}`);
    if (['utility', 'fallback'].includes(key) && params[key]) validate(params[key]);
    defaults[key] = params[key];
  }
  const binding = { ...current.agentBindings?.zero, model };
  if (params.allowUnverifiedOverride !== undefined) {
    if (typeof params.allowUnverifiedOverride !== 'boolean') throw new Error('allowUnverifiedOverride must be boolean');
    binding.allowOverride = params.allowUnverifiedOverride;
  }
  const next = { ...current, defaults, agentBindings: { ...current.agentBindings, zero: binding } };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const suffix = crypto.randomUUID(); const temporary = `${file}.${suffix}.tmp`;
  const backup = original === null ? null : `${file}.before-model-settings-${suffix}.json`;
  if (backup) fs.writeFileSync(backup, original, { flag: 'wx', mode: 0o600 });
  try { fs.writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return { ...modelSettings(fabric), backupPath: backup };
}
