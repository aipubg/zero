import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ModelFabric } from '../../packages/model-fabric/index.mjs';
import { commitModelImport, assertModelImportComplete } from '../../packages/model-fabric/config-transaction.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadEnvSafely(repoRoot) {
  const envPath = path.resolve(repoRoot, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key] || process.env[key] !== val) {
            process.env[key] = val;
          }
        }
      }
    } catch {}
  }
}

function persistLocalSecret(providerId, apiKey, repoRoot) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey === '[REDACTED]' || apiKey.startsWith('env:')) return;
  try {
    const secretsPath = path.resolve(repoRoot, '.zero-data', 'provider-secrets.json');
    fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
    let secrets = {};
    if (fs.existsSync(secretsPath)) {
      try { secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8')) || {}; } catch {}
    }
    secrets[providerId] = apiKey.trim();
    atomicWriteJson(secretsPath, secrets);
  } catch {}
}

loadEnvSafely(REPO_ROOT);

/** Model IDs that may legally be referenced by saved defaults/bindings. */
function validModelReferences(providers) {
  const valid = new Set();
  for (const provider of providers) {
    if (!provider?.id) continue;
    for (const model of Array.isArray(provider.models) ? provider.models : []) {
      const id = typeof model === 'string' ? model : model?.id;
      if (typeof id !== 'string' || !id.trim()) continue;
      valid.add(id);
      valid.add(`${provider.id}/${id}`);
      if (id.startsWith('models/')) {
        const bare = id.slice('models/'.length);
        valid.add(bare);
        valid.add(`${provider.id}/${bare}`);
      }
    }
  }
  return valid;
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const suffix = crypto.randomUUID();
  const temporary = `${file}.${suffix}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

/** zero.json is a mirror. Only touch it when this is the canonical repo catalog. */
function globalConfigPath(fabric) {
  if (!fabric?.configPath) return null;
  const resolved = path.resolve(fabric.configPath);
  if (resolved !== path.resolve(REPO_ROOT, 'models', 'gateway-providers.json')) return null;
  const configPath = path.resolve(REPO_ROOT, 'zero-system', 'config', 'zero.json');
  return fs.existsSync(configPath) ? configPath : null;
}

function syncGlobalConfig(fabric, providers) {
  const file = globalConfigPath(fabric);
  if (!file) return false;
  let config;
  try { config = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return false; }
  const providerMap = {};
  for (const provider of providers) {
    if (!provider?.id) continue;
    providerMap[provider.id] = {
      baseUrl: provider.baseUrl,
      api: provider.api || 'openai-completions',
      models: (Array.isArray(provider.models) ? provider.models : []).map(model => (
        typeof model === 'string' ? { id: model, name: model } : { ...model }
      )),
      ...(provider.apiKey ? { apiKey: provider.apiKey } : {}),
      ...(Array.isArray(provider.apiKeys) && provider.apiKeys.length ? { apiKeys: provider.apiKeys } : {}),
      ...(provider.headers ? { headers: provider.headers } : {}),
      enabled: provider.enabled !== false,
    };
  }
  config.models = config.models || {};
  config.models.mode = 'replace';
  config.models.providers = providerMap;

  const valid = validModelReferences(providers);
  const isValid = reference => typeof reference === 'string' && valid.has(reference);
  const prune = holder => {
    if (!holder || typeof holder !== 'object') return;
    if (Object.hasOwn(holder, 'primary') && !isValid(holder.primary)) holder.primary = null;
    if (Array.isArray(holder.fallbacks)) holder.fallbacks = holder.fallbacks.filter(isValid);
    if (Object.hasOwn(holder, 'fallbacks') && !holder.fallbacks.length) delete holder.fallbacks;
  };
  if (config.agents?.defaults) {
    prune(config.agents.defaults.model);
    if (config.agents.defaults.utilityModel && !isValid(config.agents.defaults.utilityModel)) delete config.agents.defaults.utilityModel;
  }
  for (const agent of Object.values(config.agents?.entries || {})) if (agent?.model) prune(agent.model);
  if (typeof config.models.default === 'string' && !isValid(config.models.default)) delete config.models.default;

  if (!providers.length) {
    config.models.providers = {};
    if (config.agents?.defaults?.model) config.agents.defaults.model.primary = null;
    for (const agent of Object.values(config.agents?.entries || {})) {
      if (agent?.model) agent.model.primary = null;
    }
  }

  atomicWriteJson(file, config);
  return true;
}

function pruneBindings(fabric, providers) {
  const file = fabric.agentBindingsPath;
  if (!file || !fs.existsSync(file)) return false;
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return false; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const valid = validModelReferences(providers);
  const isValid = reference => typeof reference === 'string' && valid.has(reference);
  let changed = false;
  if (data.defaults && typeof data.defaults === 'object') {
    for (const key of ['primary', 'utility', 'fallback', 'fastMode']) {
      if (Object.hasOwn(data.defaults, key) && !isValid(data.defaults[key])) { 
        data.defaults[key] = null; 
        changed = true; 
      }
    }
  }
  for (const binding of Object.values(data.agentBindings || {})) {
    if (binding && typeof binding === 'object' && Object.hasOwn(binding, 'model') && !isValid(binding.model)) {
      binding.model = null;
      changed = true;
    }
  }
  if (!providers.length) {
    if (data.defaults) {
      data.defaults.primary = null;
      data.defaults.utility = null;
      data.defaults.fallback = null;
      data.defaults.fastMode = null;
    }
    if (data.agentBindings) {
      for (const b of Object.values(data.agentBindings)) {
        if (b && typeof b === 'object') b.model = null;
      }
    }
    changed = true;
  }
  if (changed) atomicWriteJson(file, data);
  return changed;
}

function publicSettings(value) {
  if (Array.isArray(value)) return value.map(publicSettings);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, /api.?key|secret|password|authorization|token$/i.test(key) ? '[REDACTED]' : publicSettings(entry)]));
}

export function modelSettings(fabric) {
  fabric.reloadFromDisk();
  const settings = fabric.agentBindingsPath && fs.existsSync(fabric.agentBindingsPath) ? JSON.parse(fs.readFileSync(fabric.agentBindingsPath, 'utf8')) : {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Invalid model settings file');
  let effectiveModel = null; let assignmentError = null;
  try { effectiveModel = fabric.resolveAgentModel('zero')?.canonicalModelId || null; } catch (error) { assignmentError = error.message; }
  return { ok: true, providers: fabric.getProviders().map(provider => ({ ...provider, enabled: fabric.providers.get(provider.id)?.enabled !== false, models: (fabric.providers.get(provider.id)?.models || []).map(model => typeof model === 'string' ? model : Object.fromEntries(['id', 'name', 'image', 'reasoning', 'tools', 'contextWindow', 'maxTokens'].filter(key => Object.hasOwn(model, key)).map(key => [key, model[key]]))) })),
    defaults: publicSettings(settings.defaults || {}), agentBindings: publicSettings(settings.agentBindings || {}), offlineModels: [],
    localModelsStatus: 'Not supplied by this configured-provider catalog', effectiveModel, assignmentError };
}

function writeProviders(fabric, providers) {
  const file = fabric.configPath; if (!file) throw new Error('No provider configuration path');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const suffix = crypto.randomUUID(); const temporary = `${file}.${suffix}.tmp`;
  try { fs.writeFileSync(temporary, JSON.stringify(providers, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  // Deletion is permanent: mirror the exact catalog into zero.json, drop saved
  // references to the removed provider/model, then replace memory from disk.
  syncGlobalConfig(fabric, providers);
  pruneBindings(fabric, providers);
  fabric.reloadFromDisk();
  return { ...modelSettings(fabric), backupPath: null };
}

function providerRows(fabric) {
  if (!fabric.configPath) throw new Error('No provider configuration path');
  assertModelImportComplete(fabric.configPath);
  const rows = fs.existsSync(fabric.configPath) ? JSON.parse(fs.readFileSync(fabric.configPath, 'utf8')) : [];
  if (!Array.isArray(rows)) throw new Error('Invalid provider configuration file');
  return rows;
}

function mergeProvider(rows, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(input.id)) throw new Error('Valid provider ID required');
  const index = rows.findIndex(row => row.id === input.id); const old = rows[index] || {};
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
  if (input.apiKey !== undefined && input.apiKey !== '' && input.apiKey !== '[REDACTED]') {
    if (typeof input.apiKey !== 'string') throw new Error('Invalid provider credential');
    if (!input.apiKey.startsWith('env:')) {
      persistLocalSecret(next.id, input.apiKey, REPO_ROOT);
      next.apiKey = next.id === 'google' ? 'env:GEMINI_API_KEY' : `env:${next.id.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_API_KEY`;
    } else {
      next.apiKey = input.apiKey;
    }
  }
  if (input.apiKeys !== undefined) {
    if (!Array.isArray(input.apiKeys) || input.apiKeys.some(key => typeof key !== 'string')) throw new Error('Invalid provider credential pool');
    if (input.apiKeys.length && input.apiKeys.every(key => key !== '[REDACTED]')) {
      const first = input.apiKeys[0];
      if (first && !first.startsWith('env:')) {
        persistLocalSecret(next.id, first, REPO_ROOT);
      }
      next.apiKeys = input.apiKeys.map(k => k.startsWith('env:') ? k : (next.id === 'google' ? 'env:GEMINI_API_KEY' : `env:${next.id.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_API_KEY`));
    }
  }
  if (index < 0) rows.push(next); else rows[index] = next;
  return rows;
}

export function saveConfiguredProvider(fabric, input) {
  return writeProviders(fabric, mergeProvider(providerRows(fabric), input));
}

function mergeSettings(old, incoming) {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new Error('Imported settings must be JSON objects');
  const result = { ...old };
  for (const [key, value] of Object.entries(incoming)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Invalid imported settings key');
    if (value === '[REDACTED]') continue;
    result[key] = value && typeof value === 'object' && !Array.isArray(value) ? mergeSettings(old?.[key], value) : value;
  }
  return result;
}

export function importModelSettings(fabric, payload = {}) {
  if (!Array.isArray(payload.providers) || !fabric.agentBindingsPath) throw new Error('Model import requires a provider array and persisted binding path');
  const ids = payload.providers.map(provider => provider?.id);
  if (new Set(ids).size !== ids.length) throw new Error('Imported provider IDs must be unique');
  let providers = providerRows(fabric);
  for (const provider of payload.providers) providers = mergeProvider(providers, provider);
  const current = fs.existsSync(fabric.agentBindingsPath) ? JSON.parse(fs.readFileSync(fabric.agentBindingsPath, 'utf8')) : {};
  if (!current || typeof current !== 'object' || Array.isArray(current)) throw new Error('Invalid existing model settings');
  const bindings = { ...current };
  if (payload.defaults !== undefined) bindings.defaults = mergeSettings(current.defaults, payload.defaults);
  if (payload.agentBindings !== undefined) bindings.agentBindings = mergeSettings(current.agentBindings, payload.agentBindings);
  for (const key of ['defaults', 'agentBindings']) if (bindings[key] !== undefined && (!bindings[key] || typeof bindings[key] !== 'object' || Array.isArray(bindings[key]))) throw new Error('Invalid imported model settings structure');
  const prospective = new ModelFabric({ providers, localChat: fabric.localChat, aliases: Object.fromEntries(fabric.aliases), configPath: null, agentBindingsPath: null });
  const validate = model => {
    const resolved = prospective.resolveModel(model);
    if (!resolved || !resolved.provider.models?.some(entry => (typeof entry === 'string' ? entry : entry.id) === resolved.canonicalModelId)) throw new Error('Imported assignment references an unavailable model');
  };
  if (bindings.defaults?.primary !== undefined) validate(bindings.defaults.primary);
  for (const value of Object.values(bindings.agentBindings || {})) { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid imported agent binding'); if (value.model !== undefined) validate(value.model); }
  const committed = commitModelImport(fabric.configPath, fabric.agentBindingsPath, providers, bindings);
  syncGlobalConfig(fabric, providers);
  fabric.reloadFromDisk();
  return { ...modelSettings(fabric), ...committed, importedProviders: ids.length };
}

export function deleteConfiguredProvider(fabric, id) {
  const rows = providerRows(fabric);
  const remaining = rows.filter(row => row.id !== id && row.id?.toLowerCase() !== id?.toLowerCase());
  return writeProviders(fabric, remaining);
}

export function deleteConfiguredModel(fabric, providerId, modelId) {
  const rows = providerRows(fabric);
  const provider = rows.find(row => row.id === providerId || row.id?.toLowerCase() === providerId?.toLowerCase());
  if (!provider) throw new Error('Provider not found');
  const models = Array.isArray(provider.models) ? provider.models : [];
  const nextModels = models.filter(model => {
    const mId = typeof model === 'string' ? model : model?.id;
    return mId !== modelId && mId !== `models/${modelId}` && `models/${mId}` !== modelId;
  });
  if (nextModels.length === models.length) throw new Error('Model not found');
  if (!nextModels.length) return writeProviders(fabric, rows.filter(row => row.id !== provider.id));
  provider.models = nextModels;
  return writeProviders(fabric, rows);
}

/** Authoritative replacement used by the embedded Model-Gateway UI. */
export function replaceConfiguredProviders(fabric, providers) {
  if (!Array.isArray(providers)) throw new Error('Provider replacement requires an array');
  const rows = [];
  for (const provider of providers) mergeProvider(rows, provider);
  return writeProviders(fabric, rows);
}

export async function probeConfiguredProvider(fabric, params = {}) {
  const configured = params.id ? fabric.providers.get(params.id) : params.modelId ? fabric.resolveModel(params.modelId)?.provider : [...fabric.providers.values()].find(row => row.baseUrl?.replace(/\/+$/, '') === params.baseUrl?.replace(/\/+$/, ''));
  const baseUrl = params.baseUrl || configured?.baseUrl;
  if (typeof baseUrl !== 'string') throw new Error('Provider base URL required');
  const url = new URL(baseUrl); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid provider probe URL');
  const explicitKey = params.apiKey || params.apiKeys?.[0];
  let key = explicitKey && explicitKey !== '[REDACTED]' ? (explicitKey.startsWith('env:') ? process.env[explicitKey.slice(4)] || '' : explicitKey) : '';
  if (!key) {
    key = fabric.resolveApiKey(configured || { id: params.id || 'google', baseUrl });
  }
  const started = Date.now();
  const inheritedHeaders = configured?.baseUrl?.replace(/\/+$/, '') === baseUrl.replace(/\/+$/, '') ? configured.headers || {} : {};
  const response = await fetch(`${baseUrl.replace(/\/+$/, '').replace(/\/chat\/completions$/, '')}/models`, {
    headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), ...inheritedHeaders, ...(params.headers || {}) }, redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Provider probe HTTP ${response.status}`);
  const chunks = []; let bytes = 0;
  for await (const chunk of response.body) { bytes += chunk.length; if (bytes > 8 * 1024 * 1024) throw new Error('Provider model catalog exceeded 8 MiB'); chunks.push(chunk); }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('Provider returned invalid model catalog JSON'); }
  const entries = Array.isArray(body?.data) ? body.data : Array.isArray(body?.models) ? body.models : Array.isArray(body) ? body : null;
  const ids = entries?.map(model => typeof model === 'string' ? model : model?.id || model?.name);
  if (!ids || ids.some(id => typeof id !== 'string' || !id.trim() || id !== id.trim() || id.length > 1024) || new Set(ids).size !== ids.length) throw new Error('Provider returned an invalid model catalog');
  const models = entries.map((model, index) => ({ id: ids[index], name: typeof model === 'string' ? model : typeof model.name === 'string' && model.name.trim() ? model.name : ids[index] }));
  return { ok: true, status: models.length ? 'reachable' : 'empty', httpStatus: response.status, models, count: models.length, latencyMs: Date.now() - started, verified: false,
    notice: 'Actual model-list retrieval; this does not verify inference or model capabilities.' };
}

export function assignZeroModel(fabric, params = {}) {
  return assignAgentModel(fabric, 'zero', params);
}

export function assignAgentModel(fabric, agentId, params = {}) {
  fabric.reloadFromDisk();
  if (!['zero', 'researcher', 'coder', 'reviewer', 'operator'].includes(agentId)) throw new Error('Unknown specialist agent');
  assertModelImportComplete(fabric.configPath);
  const model = params.agentModel || params.modelId || params.model || params.primary;
  const validate = value => {
    const resolved = typeof value === 'string' && fabric.resolveModel(value);
    if (!resolved || !resolved.provider.models.some(item => (typeof item === 'string' ? item : item.id || item.name) === resolved.canonicalModelId)) throw new Error(`Model is not in the configured catalog: ${String(value)}`);
  };
  validate(model);
  const file = fabric.agentBindingsPath;
  if (!file) throw new Error('No model assignment configuration path');
  const original = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const current = original ? JSON.parse(original) : {};
  if (!current || typeof current !== 'object' || Array.isArray(current)) throw new Error('Invalid model settings file');
  const defaults = { ...current.defaults, ...(agentId === 'zero' ? { primary: model } : {}) };
  for (const key of ['utility', 'fallback', 'thinking', 'fast']) {
    if (params[key] === undefined || agentId !== 'zero') continue;
    if (typeof params[key] !== 'string' || params[key].length > 512) throw new Error(`Invalid model preference: ${key}`);
    if (['utility', 'fallback'].includes(key) && params[key]) validate(params[key]);
    defaults[key] = params[key];
  }
  const binding = { ...current.agentBindings?.[agentId], model };
  if (params.allowUnverifiedOverride !== undefined) {
    if (typeof params.allowUnverifiedOverride !== 'boolean') throw new Error('allowUnverifiedOverride must be boolean');
    binding.allowOverride = params.allowUnverifiedOverride;
  }
  const next = { ...current, defaults, agentBindings: { ...current.agentBindings, [agentId]: binding } };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const suffix = crypto.randomUUID(); const temporary = `${file}.${suffix}.tmp`;
  const backup = original === null ? null : `${file}.before-model-settings-${suffix}.json`;
  if (backup) fs.writeFileSync(backup, original, { flag: 'wx', mode: 0o600 });
  try { fs.writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return { ...modelSettings(fabric), backupPath: backup };
}
