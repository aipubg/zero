/**
 * @fileoverview Zero Model Fabric — Enterprise Inference, Provider Failover & Normalization
 * 
 * Owns provider configuration, canonical model IDs, credential resolution,
 * request normalization, capability negotiation, streaming protocol adaptation,
 * exponential backoff retry, provider failover cascade, and token usage accounting.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertModelImportComplete } from './config-transaction.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_CONFIG_PATH = path.resolve(REPO_ROOT, 'models', 'gateway-providers.json');
const AUTO_MODEL_ALIASES = new Set(['', 'auto', 'auto-best', 'autobest', 'default', '__auto__', 'default-model']);

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

function getLocalSecret(providerId, repoRoot) {
  try {
    const secretsPath = path.resolve(repoRoot, '.zero-data', 'provider-secrets.json');
    if (fs.existsSync(secretsPath)) {
      const data = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
      if (data && typeof data === 'object') {
        const secret = data[providerId] || data[providerId?.toLowerCase()];
        if (typeof secret === 'string' && secret.trim()) return secret.trim();
      }
    }
  } catch {}
  return null;
}

loadEnvSafely(REPO_ROOT);

const NON_CHAT_MODEL_PATTERN = /(?:^|[/_.-])(embedding|embed|tts|transcribe|audio|image|lyria|aqa|robotics|computer-use|deep-research|nano-banana|antigravity|realtime|live|native-audio)(?:$|[/_.-])/i;

/** True when a model value means "let Zero pick the best configured model". */
export function isAutoModel(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return false;
  return AUTO_MODEL_ALIASES.has(value.trim().toLowerCase());
}

export class ModelFabric {
  /**
   * @param {Object} [options]
   * @param {Array} [options.providers] - In-memory provider configurations
   * @param {string} [options.configPath] - Path to providers config JSON
   * @param {Object} [options.aliases] - Optional user-provided model alias map
   */
  constructor(options = {}) {
    this.configPath = Object.hasOwn(options, 'configPath') ? options.configPath
      : Array.isArray(options.providers) ? null : (fs.existsSync(DEFAULT_CONFIG_PATH) ? DEFAULT_CONFIG_PATH : null);
    this.aliases = new Map(Object.entries(options.aliases || {}));
    this.providers = new Map();
    this.localChat = options.localChat || null;
    this.healthStats = new Map();
    this.modelHealth = new Map();
    this.upstreamRequestCount = 0;
    this.agentBindingsPath = Object.hasOwn(options, 'agentBindingsPath') ? options.agentBindingsPath
      : Array.isArray(options.providers) ? null : path.resolve(__dirname, '..', '..', 'models', 'gateway-defaults.json');
    this.usageStats = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalRequests: 0,
      byModel: {},
    };

    if (Array.isArray(options.providers)) {
      this.loadProviders(options.providers);
    } else if (this.configPath && fs.existsSync(this.configPath)) {
      this.reloadFromDisk();
    }
  }

  loadProviders(providersArray) {
    this.providers.clear();
    for (const p of providersArray) {
      if (p && p.id) {
        this.providers.set(p.id, { ...p });
        if (!this.healthStats.has(p.id)) {
          this.healthStats.set(p.id, {
            status: 'healthy',
            totalRequests: 0,
            failures: 0,
            consecutiveFailures: 0,
            lastLatencyMs: 0,
            lastError: null,
            lastCheckedAt: Date.now(),
          });
        }
      }
    }
    // Health for providers that no longer exist must not linger in memory.
    for (const id of [...this.healthStats.keys()]) if (!this.providers.has(id)) this.healthStats.delete(id);
    for (const id of [...this.modelHealth.keys()]) {
      const providerId = id.slice(0, id.indexOf('/'));
      if (!this.providers.has(providerId) && !this.modelHealth.get(id)?.local) this.modelHealth.delete(id);
    }
  }

  reloadFromDisk() {
    // gateway-providers.json is the single runtime provider source. zero.json is
    // a mirror only; it must never re-introduce providers the user deleted.
    if (!this.configPath || !fs.existsSync(this.configPath)) {
      this.loadProviders([]);
      return;
    }
    let loadedList = [];
    try {
      const raw = fs.readFileSync(this.configPath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) loadedList = data;
    } catch (err) {
      console.warn('[ModelFabric] Error reading providers config from disk:', err.message);
    }
    // Always replace memory, including an empty array. Deletion must survive.
    this.loadProviders(loadedList);
  }

  listModels() {
    const models = this.localChat?.listModels() || [];
    for (const provider of this.providers.values()) {
      if (provider.enabled === false) continue;
      if (Array.isArray(provider.models)) {
        for (const m of provider.models) {
          const id = typeof m === 'string' ? m : (m.id || m.name);
          if (typeof id !== 'string' || !id.trim()) continue;
          const name = typeof m === 'object' && m.name ? m.name : id;
          models.push({
            id,
            name,
            provider: provider.id || provider.name || 'configured',
            reasoning: typeof m === 'object' ? Boolean(m.reasoning) : false,
            input: (typeof m === 'object' && m.image) ? ['text', 'image'] : ['text'],
            contextWindow: typeof m === 'object' && Number.isInteger(m.contextWindow) ? m.contextWindow : 131072,
            maxTokens: typeof m === 'object' && Number.isInteger(m.maxTokens) ? m.maxTokens : 4096,
          });
        }
      }
    }
    return models;
  }

  getProviders() {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name || p.id,
      baseUrl: p.baseUrl,
      api: p.api,
      modelsCount: Array.isArray(p.models) ? p.models.length : 0,
      hasApiKey: Boolean(this.resolveApiKey(p)),
    }));
  }

  registerAlias(alias, canonicalModelId) {
    this.aliases.set(alias.toLowerCase(), canonicalModelId);
  }

  resolveModel(modelId) {
    if (!modelId || typeof modelId !== 'string') return null;
    if (modelId.trim().startsWith('local-gguf/')) return this.localChat?.resolve(modelId.trim()) || null;
    let clean = modelId.trim();
    const aliasResolved = this.aliases.get(clean.toLowerCase()) || clean;

    // 1. Direct provider-qualified lookup. Providers and models are entirely
    // user-configured; there is no provider-specific model routing.
    for (const [pId, provider] of this.providers) {
      if (provider.enabled === false) continue;
      if (aliasResolved.startsWith(pId + '/')) {
        const id = aliasResolved.slice(pId.length + 1);
        const entry = provider.models?.find(m => {
          const candidate = typeof m === 'string' ? m : m.id;
          return candidate === id || candidate === `models/${id}` || candidate === id.replace(/^models\//, '');
        });
        // A provider-qualified id that is not in the provider's catalogue is
        // stale (for example a session pinned to a model that was removed).
        // Resolving it anyway would send the request upstream and time out,
        // so it is treated as unresolved and the fallback chain is used.
        if (!entry) return null;
        const canonical = typeof entry === 'string' ? entry : entry.id;
        return { provider, canonicalModelId: canonical, capabilities: this._capabilities(entry, canonical) };
      }
    }

    // 2. Direct model ID lookup across all configured providers.
    for (const provider of this.providers.values()) {
      if (provider.enabled === false) continue;
      if (Array.isArray(provider.models)) {
        for (const m of provider.models) {
          const mId = typeof m === 'string' ? m : m.id;
          if (typeof mId !== 'string') continue;
          const cleanMId = mId.replace(/^models\//, '');
          const cleanResolved = aliasResolved.replace(/^models\//, '');
          if (mId === aliasResolved || cleanMId === cleanResolved) {
            return { provider, canonicalModelId: mId, capabilities: this._capabilities(m, mId) };
          }
        }
      }
    }

    return null;
  }

  _capabilities(entry, modelId) {
    if (!entry || typeof entry !== 'object') return { reasoning: false, image: false, tools: true };
    return {
      reasoning: Boolean(entry.reasoning),
      image: Boolean(entry.image),
      tools: entry.tools !== false,
      ...(typeof entry.contextWindow === 'number' ? { contextWindow: entry.contextWindow } : {}),
      ...(typeof entry.maxTokens === 'number' ? { maxTokens: entry.maxTokens } : {}),
    };
  }

  resolveApiKey(provider) {
    if (!provider) return '';
    loadEnvSafely(REPO_ROOT);
    const candidates = [
      provider.apiKey,
      ...(Array.isArray(provider.apiKeys) ? provider.apiKeys : []),
    ].filter(value => typeof value === 'string' && value.trim());
    for (const candidate of candidates) {
      if (candidate.startsWith('env:')) {
        const value = process.env[candidate.slice(4)] || '';
        if (value.trim()) return value.trim();
        continue;
      }
      if (candidate === '[REDACTED]') continue;
      return candidate.trim();
    }
    // Check untracked local secrets file
    const localSecret = getLocalSecret(provider.id, REPO_ROOT);
    if (localSecret) return localSecret;

    // Check well-known environment variables
    const provId = (provider.id || '').toLowerCase();
    if (provId === 'google') {
      const gKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (gKey && gKey.trim()) return gKey.trim();
    }
    if (provId === 'nvidia') {
      const nKey = process.env.NVIDIA_API_KEY;
      if (nKey && nKey.trim()) return nKey.trim();
    }
    if (provId === 'openai') {
      const oKey = process.env.OPENAI_API_KEY;
      if (oKey && oKey.trim()) return oKey.trim();
    }
    const genericEnvKey = `${(provider.id || '').toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_API_KEY`;
    if (process.env[genericEnvKey] && process.env[genericEnvKey].trim()) {
      return process.env[genericEnvKey].trim();
    }
    return '';
  }

  _modelKey(providerId, modelId) {
    return `${providerId}/${String(modelId || '').replace(/^models\//, '')}`;
  }

  _recordModelHealth(providerId, modelId, outcome, latencyMs, errorMsg) {
    if (!providerId || modelId === undefined || modelId === null) return;
    const key = this._modelKey(providerId, modelId);
    const stats = this.modelHealth.get(key) || {
      status: 'healthy',
      totalRequests: 0,
      failures: 0,
      consecutiveFailures: 0,
      lastLatencyMs: 0,
      lastError: null,
      lastCheckedAt: Date.now(),
    };
    stats.totalRequests++;
    stats.lastCheckedAt = Date.now();
    if (outcome === 'success') {
      stats.status = 'healthy';
      stats.consecutiveFailures = 0;
      stats.lastLatencyMs = latencyMs;
      stats.lastError = null;
    } else {
      stats.failures++;
      stats.consecutiveFailures++;
      stats.lastError = errorMsg;
      if (stats.consecutiveFailures >= 2) stats.status = 'degraded';
    }
    this.modelHealth.set(key, stats);
  }

  recordSuccess(providerId, latencyMs, modelId) {
    const stats = this.healthStats.get(providerId);
    if (stats) {
      stats.status = 'healthy';
      stats.totalRequests++;
      stats.consecutiveFailures = 0;
      stats.lastLatencyMs = latencyMs;
      stats.lastCheckedAt = Date.now();
    }
    this._recordModelHealth(providerId, modelId, 'success', latencyMs);
  }

  recordFailure(providerId, errorMsg, modelId) {
    const stats = this.healthStats.get(providerId);
    if (stats) {
      stats.totalRequests++;
      stats.failures++;
      stats.consecutiveFailures++;
      stats.lastError = errorMsg;
      stats.lastCheckedAt = Date.now();
      if (stats.consecutiveFailures >= 3) {
        stats.status = 'degraded';
      }
    }
    this._recordModelHealth(providerId, modelId, 'failure', 0, errorMsg);
  }

  getHealthReport() {
    const report = {};
    for (const [id, stats] of this.healthStats.entries()) {
      report[id] = { ...stats, models: {} };
    }
    for (const [key, stats] of this.modelHealth.entries()) {
      const providerId = key.slice(0, key.indexOf('/'));
      (report[providerId] ||= { status: 'healthy', models: {} }).models[key.slice(key.indexOf('/') + 1)] = { ...stats };
    }
    return report;
  }

  /** All configured model candidates (cloud + local), independent of any vendor. */
  listModelCandidates() {
    const candidates = [];
    for (const provider of this.providers.values()) {
      if (provider.enabled === false) continue;
      if (!Array.isArray(provider.models)) continue;
      for (const model of provider.models) {
        const id = typeof model === 'string' ? model : model?.id;
        if (typeof id !== 'string' || !id.trim()) continue;
        const canonicalModelId = id;
        const modelId = `${provider.id}/${canonicalModelId}`;
        candidates.push({
          modelId,
          providerId: provider.id,
          canonicalModelId,
          provider,
          entry: model,
          local: false,
        });
      }
    }
    const localModels = this.localChat?.listModels?.() || [];
    for (const model of localModels) {
      if (!model?.id) continue;
      candidates.push({
        modelId: model.id,
        providerId: 'local-gguf',
        canonicalModelId: model.id,
        provider: { id: 'local-gguf', local: true, models: localModels },
        entry: model,
        local: true,
      });
    }
    return candidates;
  }

  _isChatCandidate(candidate) {
    if (candidate.local) return true;
    if (!candidate.entry || typeof candidate.entry === 'string') return true;
    const type = String(candidate.entry.type || 'chat').toLowerCase();
    if (type !== 'chat') return false;
    if (candidate.entry.capabilities?.embedding) return false;
    return !NON_CHAT_MODEL_PATTERN.test(candidate.canonicalModelId);
  }

  _candidateScore(candidate) {
    const modelStats = this.modelHealth.get(this._modelKey(candidate.providerId, candidate.canonicalModelId));
    const providerStats = this.healthStats.get(candidate.providerId);
    const stats = modelStats?.totalRequests ? modelStats : (providerStats || {});
    const total = stats.totalRequests || 0;
    const failures = stats.failures || 0;
    const streak = stats.consecutiveFailures || 0;
    const status = stats.status || 'healthy';
    const successRate = total > 0 ? Math.max(0, (total - failures) / total) : 0.5;
    const latency = stats.lastLatencyMs || 0;
    let score = (1 - successRate) * 4000;
    score += streak * 2500;
    if (status === 'degraded') score += 10000;
    score += latency > 0 ? latency / 10 : 400;
    if (total > 0 && status === 'healthy' && streak === 0) score -= 300;
    // Prefer the owner's configured default while it is healthy. This is the
    // user's own selection, never a hardcoded vendor/model.
    try {
      const bindings = this._readBindings();
      const preferred = bindings?.defaults?.primary;
      if (preferred && this._modelKey(candidate.providerId, candidate.canonicalModelId) === this._modelKey(candidate.providerId, preferred.startsWith(`${candidate.providerId}/`) ? preferred.slice(candidate.providerId.length + 1) : preferred)) {
        score -= 1800;
      }
    } catch {}
    return score;
  }

  _readBindings() {
    if (!this.agentBindingsPath || !fs.existsSync(this.agentBindingsPath)) return null;
    const data = JSON.parse(fs.readFileSync(this.agentBindingsPath, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  }

  /** Ordered failover pool for Default model (Auto-Best) mode. */
  autoCandidates(exclude = []) {
    const excluded = new Set(exclude);
    return this.listModelCandidates()
      .filter(candidate => !excluded.has(candidate.modelId))
      .filter(candidate => this._isChatCandidate(candidate))
      .map(candidate => ({ ...candidate, score: this._candidateScore(candidate) }))
      .sort((a, b) => a.score - b.score || a.modelId.localeCompare(b.modelId));
  }

  /** The best currently configured working model, or null. */
  autoBestModel(exclude = []) {
    return this.autoCandidates(exclude)[0] || null;
  }

  recordUsage(modelId, promptTokens = 0, completionTokens = 0) {
    this.usageStats.totalRequests++;
    this.usageStats.totalPromptTokens += promptTokens;
    this.usageStats.totalCompletionTokens += completionTokens;

    if (!this.usageStats.byModel[modelId]) {
      this.usageStats.byModel[modelId] = {
        requests: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };
    }
    const m = this.usageStats.byModel[modelId];
    m.requests++;
    m.promptTokens += promptTokens;
    m.completionTokens += completionTokens;
    m.totalTokens += (promptTokens + completionTokens);
  }

  getUsageReport() {
    return {
      ...this.usageStats,
      totalTokens: this.usageStats.totalPromptTokens + this.usageStats.totalCompletionTokens,
    };
  }

  calculateContextBudget(modelId, messages = []) {
    const resolution = this.resolveModel(modelId);
    const localModel = resolution?.provider.local ? resolution.provider.models.find(model => model.id === resolution.canonicalModelId) : null;
    const contextWindow = localModel?.contextWindow || 131072;
    let rawChars = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') rawChars += msg.content.length;
      else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part?.text) rawChars += part.text.length;
        }
      }
    }
    const estimatedPromptTokens = Math.ceil(rawChars / 3.8) + (messages.length * 4) + 10;
    const remainingTokens = Math.max(0, contextWindow - estimatedPromptTokens);
    const maxCompletionTokens = Math.min(4096, remainingTokens);

    return {
      modelId: resolution?.canonicalModelId || modelId,
      contextWindow,
      estimatedPromptTokens,
      remainingTokens,
      maxCompletionTokens,
      withinBudget: estimatedPromptTokens < (contextWindow - 128),
      accounting: 'Character-based estimate; excludes tool definitions and native template overhead',
      contextWindowSource: localModel?.contextWindowSource || 'provider-default',
    };
  }

  getAgentModelId(agentId = 'zero') {
    const resolved = this.resolveAgentModel(agentId);
    return resolved ? (resolved.provider.local ? resolved.canonicalModelId : resolved.provider.id + '/' + resolved.canonicalModelId) : null;
  }

  resolveAgentModel(agentId = 'zero') {
    assertModelImportComplete(this.configPath);
    if (this.agentBindingsPath && fs.existsSync(this.agentBindingsPath)) {
      let data;
      try { data = JSON.parse(fs.readFileSync(this.agentBindingsPath, 'utf8')); }
      catch { throw new Error('Saved model assignments cannot be read; restore or correct the settings'); }
      if (!data || typeof data !== 'object' || Array.isArray(data) ||
          (data.agentBindings !== undefined && (!data.agentBindings || typeof data.agentBindings !== 'object' || Array.isArray(data.agentBindings))) ||
          (data.defaults !== undefined && (!data.defaults || typeof data.defaults !== 'object' || Array.isArray(data.defaults)))) throw new Error('Invalid saved model assignments');
      const binding = data.agentBindings?.[agentId]?.model;
      if (binding !== undefined && binding !== null && binding !== '') {
        const resolved = this.resolveModel(binding);
        if (!resolved) throw new Error(`Assigned model for agent ${agentId} is unavailable; update its saved assignment`);
        return resolved;
      }
      if (data.defaults?.primary !== undefined && data.defaults?.primary !== null && data.defaults?.primary !== '') {
        const resolved = this.resolveModel(data.defaults.primary);
        if (!resolved) throw new Error('Configured default model is unavailable; update the saved model settings');
        return resolved;
      }
    }
    // No saved assignment: Default mode is resolved dynamically by autoBestModel().
    return null;
  }

  _noConfiguredModelError() {
    const err = new Error('No configured model is available. Add a provider and at least one model in Settings → Models.');
    err.code = 'no_configured_model';
    err.status = 503;
    return err;
  }

  /**
   * Execute a chat completion. A missing/`auto` model means Default mode: rank
   * the owner's configured models and fail over transparently until one works.
   */
  async executeChat(payload, options = {}) {
    assertModelImportComplete(this.configPath);
    const requested = payload.model;
    if (isAutoModel(requested)) {
      const candidates = this.autoCandidates(options.exclude);
      if (!candidates.length) throw this._noConfiguredModelError();
      let lastError = null;
      for (const candidate of candidates) {
        try {
          return await this._executeResolvedChat(
            { ...payload, model: candidate.modelId },
            options,
            this.resolveModel(candidate.modelId),
          );
        } catch (error) {
          lastError = error;
          if (options.signal?.aborted) throw error;
        }
      }
      throw lastError || this._noConfiguredModelError();
    }

    const modelId = typeof requested === 'string' ? requested.trim() : '';
    let resolution = this.resolveModel(modelId);
    if (!resolution) {
      // Unknown/fake model IDs (e.g. vendor defaults or stale Gemini IDs) must
      // not break multi-step chat. Fall back to the owner's configured best model.
      const fallback = this.autoCandidates(options.exclude)[0];
      if (fallback) {
        resolution = this.resolveModel(fallback.modelId);
        if (resolution) {
          return this._executeResolvedChat({ ...payload, model: fallback.modelId }, options, resolution);
        }
      }
      const err = new Error(`Model '${modelId}' not found in the configured provider catalog.`);
      err.code = 'model_not_found';
      err.status = 404;
      throw err;
    }
    return this._executeResolvedChat({ ...payload, model: modelId }, options, resolution);
  }

  async _executeResolvedChat(payload, options = {}, resolution = null) {
    assertModelImportComplete(this.configPath);
    const modelId = String(payload.model || '').trim();
    if (!resolution) resolution = this.resolveModel(modelId);
    if (!resolution) {
      const err = new Error(`Model '${modelId}' not found in the configured provider catalog.`);
      err.code = 'model_not_found';
      err.status = 404;
      throw err;
    }

    if (modelId.startsWith('local-gguf/')) {
      if (!this.localChat) throw new Error('Local chat runtime unavailable');
      const started = Date.now();
      try {
        const result = await this.localChat.execute(payload, options);
        if (result.data?.usage) this.recordUsage(modelId, result.data.usage.prompt_tokens, result.data.usage.completion_tokens);
        this.recordSuccess('local-gguf', Date.now() - started, modelId);
        return result;
      } catch (error) {
        this.recordFailure('local-gguf', error.message, modelId);
        throw error;
      }
    }

    const { provider, canonicalModelId } = resolution;
    const apiKey = this.resolveApiKey(provider);
    if (!apiKey) {
      const err = new Error(`Missing API key for provider '${provider.id}'. Add the credential in Settings → Models.`);
      err.code = 'missing_api_key';
      err.status = 401;
      throw err;
    }

    // Some provider catalogs list `models/<id>` while the wire API expects the
    // bare id. This is a catalog normalization, not provider-specific routing.
    const canonical = String(canonicalModelId).replace(/^models\//, '');
    const baseUrl = (provider.baseUrl || '').trim().replace(/\/+$/, '');
    if (!baseUrl) {
      const err = new Error(`Provider '${provider.id}' has no base URL configured.`);
      err.code = 'missing_base_url';
      err.status = 400;
      throw err;
    }
    let endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
    if (provider.id === 'google' && apiKey && !endpoint.includes('key=')) {
      endpoint += (endpoint.includes('?') ? '&' : '?') + `key=${encodeURIComponent(apiKey)}`;
    }

    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
    const timeoutMs = options.timeoutMs || 60000;
    const signal = options.signal;
    const requestPayload = { ...payload, model: canonical };
    if (Array.isArray(requestPayload.tools) && requestPayload.tools.length === 0) delete requestPayload.tools;
    if (!Array.isArray(requestPayload.tools) || requestPayload.tools.length === 0) delete requestPayload.tool_choice;
    if (provider.id === 'google') {
      delete requestPayload.extra_body;
      delete requestPayload.chat_template;
      if (!requestPayload.tools) delete requestPayload.tool_choice;
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(provider.headers || {}),
    };

    let lastError = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const connectionDeadline = new AbortController();
      const connectionTimer = setTimeout(() => connectionDeadline.abort(new DOMException('Model connection timed out', 'TimeoutError')), timeoutMs);
      const timeoutSignal = connectionDeadline.signal;
      const combinedSignal = signal
        ? (AbortSignal.any ? AbortSignal.any([signal, timeoutSignal]) : signal)
        : timeoutSignal;

      try {
        this.upstreamRequestCount++;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload),
          signal: combinedSignal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody.error?.message ||
                         (Array.isArray(errBody) && errBody[0]?.error?.message) ||
                         errBody.message ||
                         (typeof errBody === 'object' && Object.keys(errBody).length ? JSON.stringify(errBody) : null) ||
                         res.statusText ||
                         'Upstream request failed';
          const err = new Error(errMsg);
          err.status = res.status;
          err.upstreamError = errBody;
          err.retryable = res.status === 429 || res.status >= 500 || /temporarily unavailable/i.test(errMsg);
          throw err;
        }

        const elapsed = Date.now() - startTime;
        this.recordSuccess(provider.id, elapsed, canonicalModelId);

        if (payload.stream) {
          return { stream: res.body, status: res.status, headers: res.headers };
        }

        const data = await res.json();
        return { data, status: res.status, latencyMs: elapsed };
      } catch (err) {
        lastError = err;
        if (signal?.aborted) throw err;
        // Never retry a definitive upstream rejection (bad model, auth, 404).
        if (err.retryable === false || (err.status && err.status !== 429 && err.status < 500)) break;
        if (attempt >= maxRetries) break;
        await new Promise((resolve) => setTimeout(resolve, 400 * Math.pow(2, attempt)));
      } finally {
        clearTimeout(connectionTimer);
      }
    }

    this.recordFailure(provider.id, lastError?.message || 'Exceeded retry attempts', canonicalModelId);
    throw lastError;
  }

  async *streamChat(payload, options = {}) {
    const requested = payload.model;
    if (isAutoModel(requested)) {
      const candidates = this.autoCandidates(options.exclude);
      if (!candidates.length) throw this._noConfiguredModelError();
      let lastError = null;
      for (const candidate of candidates) {
        let emitted = false;
        try {
          for await (const chunk of this._streamResolvedChat(
            { ...payload, model: candidate.modelId },
            options,
            this.resolveModel(candidate.modelId),
          )) {
            emitted = true;
            yield chunk;
          }
          return;
        } catch (error) {
          lastError = error;
          if (options.signal?.aborted) throw error;
          // Fail over only before any visible content was produced.
          if (emitted) throw error;
        }
      }
      throw lastError || this._noConfiguredModelError();
    }

    const modelId = typeof requested === 'string' ? requested.trim() : '';
    let resolution = this.resolveModel(modelId);
    if (!resolution) {
      const fallback = this.autoCandidates(options.exclude)[0];
      if (fallback) {
        resolution = this.resolveModel(fallback.modelId);
        if (resolution) {
          yield* this._streamResolvedChat({ ...payload, model: fallback.modelId }, options, resolution);
          return;
        }
      }
      const err = new Error(`Model '${modelId}' not found in the configured provider catalog.`);
      err.code = 'model_not_found';
      err.status = 404;
      throw err;
    }
    yield* this._streamResolvedChat({ ...payload, model: modelId }, options, resolution);
  }

  async *_streamResolvedChat(payload, options = {}, resolution = null) {
    const res = await this._executeResolvedChat({ ...payload, stream: true }, options, resolution);
    if (!res.stream) {
      if (res.data?.choices?.[0]?.message?.content) {
        yield { delta: res.data.choices[0].message.content, finish_reason: res.data.choices[0].finish_reason || null, done: true };
      }
      return;
    }

    const reader = res.stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let terminalReason = null;

    try {
      while (true) {
        let expired = false;
        const idleTimer = setTimeout(() => { expired = true; void reader.cancel().catch(() => {}); }, options.idleTimeoutMs ?? options.timeoutMs ?? 60000);
        let next;
        try { next = await reader.read(); } finally { clearTimeout(idleTimer); }
        if (expired) throw new DOMException('Model stream became inactive', 'TimeoutError');
        const { done, value } = next;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') {
            yield { done: true, finish_reason: terminalReason || 'stop' };
            return;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const choice = json.choices?.[0];
              if (choice?.finish_reason) terminalReason = choice.finish_reason;
              // Reasoning is a separate channel, never assistant prose or speech.
              const deltaContent = typeof choice?.delta?.content === 'string' ? choice.delta.content : null;
              if (json.usage) {
                this.recordUsage(json.model || payload.model || 'streamed-model', json.usage.prompt_tokens, json.usage.completion_tokens);
              }
              yield {
                delta: deltaContent,
                reasoning_content: choice?.delta?.reasoning_content || null,
                tool_calls: choice?.delta?.tool_calls || null,
                finish_reason: choice?.finish_reason || null,
                usage: json.usage || null,
                id: json.id,
                model: json.model,
              };
            } catch {}
          }
        }
      }
      if (!terminalReason) throw new Error('Model stream ended without a terminal finish reason or DONE marker');
    } finally {
      try { await reader.cancel(); } catch (_) {}
      try { reader.releaseLock(); } catch (_) {}
    }
  }
}

export const canonicalModelFabric = new ModelFabric();
