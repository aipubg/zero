import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function modelSettings(fabric) {
  const settings = fs.existsSync(fabric.agentBindingsPath) ? JSON.parse(fs.readFileSync(fabric.agentBindingsPath, 'utf8')) : {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Invalid model settings file');
  let effectiveModel = null; let assignmentError = null;
  try { effectiveModel = fabric.resolveAgentModel('zero')?.canonicalModelId || null; } catch (error) { assignmentError = error.message; }
  return { ok: true, providers: fabric.getProviders().map(provider => ({ ...provider, enabled: fabric.providers.get(provider.id)?.enabled !== false, models: (fabric.providers.get(provider.id)?.models || []).map(model => typeof model === 'string' ? model : Object.fromEntries(['id', 'name', 'image', 'reasoning', 'tools', 'contextWindow', 'maxTokens'].filter(key => Object.hasOwn(model, key)).map(key => [key, model[key]]))) })),
    defaults: settings.defaults || {}, agentBindings: settings.agentBindings || {}, offlineModels: [],
    localModelsStatus: 'Not supplied by this configured-provider catalog', effectiveModel, assignmentError };
}

function writeProviders(fabric, providers) {
  const file = fabric.configPath; if (!file) throw new Error('No provider configuration path');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const suffix = crypto.randomUUID(); const temporary = `${file}.${suffix}.tmp`;
  const backup = fs.existsSync(file) ? `${file}.before-provider-change-${suffix}.json` : null;
  if (backup) fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
  try { fs.writeFileSync(temporary, JSON.stringify(providers, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  fabric.reloadFromDisk();
  return { ...modelSettings(fabric), backupPath: backup };
}

function providerRows(fabric) {
  const rows = fs.existsSync(fabric.configPath) ? JSON.parse(fs.readFileSync(fabric.configPath, 'utf8')) : [];
  if (!Array.isArray(rows)) throw new Error('Invalid provider configuration file');
  return rows;
}

export function saveConfiguredProvider(fabric, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(input.id)) throw new Error('Valid provider ID required');
  const rows = providerRows(fabric); const index = rows.findIndex(row => row.id === input.id); const old = rows[index] || {};
  const next = { ...old };
  for (const key of ['id', 'name', 'api', 'baseUrl', 'fallbackModel']) if (input[key] !== undefined) {
    if (typeof input[key] !== 'string') throw new Error(`Invalid provider field: ${key}`); next[key] = input[key];
  }
  const url = new URL(next.baseUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Provider requires an HTTP(S) URL without embedded credentials');
  if (input.enabled !== undefined) { if (typeof input.enabled !== 'boolean') throw new Error('Provider enabled must be boolean'); next.enabled = input.enabled; }
  if (input.models !== undefined) {
    if (!Array.isArray(input.models)) throw new Error('Provider models must declare IDs');
    const ids = input.models.map(model => typeof model === 'string' ? model : model?.id);
    if (ids.some(id => typeof id !== 'string' || !id.trim() || id !== id.trim()) || new Set(ids).size !== ids.length) throw new Error('Provider models require unique nonempty IDs');
    next.models = input.models.map(model => typeof model === 'string' ? model : { ...(old.models || []).find(previous => typeof previous === 'object' && previous.id === model.id), ...model });
  }
  next.models ||= [];
  // Blank credential inputs on an edit mean retain the privately stored values.
  if (input.apiKey !== undefined && input.apiKey !== '' && input.apiKey !== '[REDACTED]') { if (typeof input.apiKey !== 'string') throw new Error('Invalid provider credential'); next.apiKey = input.apiKey; }
  if (input.apiKeys !== undefined) {
    if (!Array.isArray(input.apiKeys) || input.apiKeys.some(key => typeof key !== 'string')) throw new Error('Invalid provider credential pool');
    if (input.apiKeys.length && input.apiKeys.every(key => key !== '[REDACTED]')) next.apiKeys = [...input.apiKeys];
  }
  if (index < 0) rows.push(next); else rows[index] = next;
  return writeProviders(fabric, rows);
}

export function deleteConfiguredProvider(fabric, id) {
  const rows = providerRows(fabric);
  if (!rows.some(row => row.id === id)) throw new Error('Provider not found');
  return writeProviders(fabric, rows.filter(row => row.id !== id));
}

export async function probeConfiguredProvider(fabric, params = {}) {
  const configured = params.id ? fabric.providers.get(params.id) : params.modelId ? fabric.resolveModel(params.modelId)?.provider : [...fabric.providers.values()].find(row => row.baseUrl?.replace(/\/+$/, '') === params.baseUrl?.replace(/\/+$/, ''));
  const baseUrl = params.baseUrl || configured?.baseUrl;
  if (typeof baseUrl !== 'string') throw new Error('Provider base URL required');
  const url = new URL(baseUrl); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid provider probe URL');
  const explicitKey = params.apiKey || params.apiKeys?.[0];
  const key = explicitKey && explicitKey !== '[REDACTED]' ? explicitKey.startsWith('env:') ? process.env[explicitKey.slice(4)] || '' : explicitKey : configured && configured.baseUrl?.replace(/\/+$/, '') === baseUrl.replace(/\/+$/, '') ? fabric.resolveApiKey(configured) : '';
  const started = Date.now();
  const inheritedHeaders = configured?.baseUrl?.replace(/\/+$/, '') === baseUrl.replace(/\/+$/, '') ? configured.headers || {} : {};
  const response = await fetch(`${baseUrl.replace(/\/+$/, '').replace(/\/chat\/completions$/, '')}/models`, {
    headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), ...inheritedHeaders, ...(params.headers || {}) }, redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Provider probe HTTP ${response.status}`);
  const body = await response.json(); const entries = Array.isArray(body.data) ? body.data : Array.isArray(body.models) ? body.models : Array.isArray(body) ? body : null;
  if (!entries || entries.some(model => typeof (typeof model === 'string' ? model : model?.id || model?.name) !== 'string')) throw new Error('Provider returned an invalid model catalog');
  const models = entries.map(model => ({ id: typeof model === 'string' ? model : model.id || model.name, name: typeof model === 'string' ? model : model.name || model.id }));
  return { ok: true, status: 'reachable', httpStatus: response.status, models, count: models.length, latencyMs: Date.now() - started, verified: false,
    notice: 'Actual model-list retrieval; this does not verify inference or model capabilities.' };
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
