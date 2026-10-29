import type { GatewayModel, GatewayVaultConfig, ProviderConfig } from './types';

const STORAGE_KEY = 'modular_ai_gateway_providers_v1';
const ROLE_MAPPINGS_KEY = 'modular_ai_gateway_roles_v1';

// Initial pre-configured starter providers for immediate zero-friction use and demonstration
const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'mock-provider',
    name: 'Local Sandbox Simulator',
    apiType: 'openai-compatible',
    baseUrl: 'mock://sandbox.local/v1',
    apiKey: '',
    apiKeys: [],
    enabled: true,
    isCustom: true,
    createdAt: Date.now() - 10000,
    headers: [],
    models: [
      { id: 'mock-gpt-4o', name: 'GPT-4o (Multimodal Vision)', capabilities: { reasoning: false, image: true }, type: 'chat' },
      { id: 'mock-deepseek-r1', name: 'DeepSeek R1 (Extended Reasoning)', capabilities: { reasoning: true, image: false }, type: 'chat' },
      { id: 'mock-claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid)', capabilities: { reasoning: true, image: true }, type: 'chat' },
      { id: 'mock-llama-3.3-70b', name: 'Llama 3.3 70B (Fast Chat)', capabilities: { reasoning: false, image: false }, type: 'chat' },
      { id: 'mock-text-embedding-3', name: 'Text Embedding 3 (Embedding)', capabilities: { reasoning: false, image: false, embedding: true }, type: 'embedding' },
    ],
  },
];

type RegistryListener = (providers: ProviderConfig[]) => void;
const listeners: Set<RegistryListener> = new Set();

function notifyListeners(providers: ProviderConfig[]) {
  listeners.forEach((listener) => {
    try {
      listener(providers);
    } catch (e) {
      console.error('Error in registry listener:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gateway-registry-updated', {
        detail: { providers },
      })
    );
  }
}

/**
 * Loads providers from localStorage or defaults.
 * Preserves empty lists if the user deleted providers (prevents resurrecting deleted providers on refresh).
 */
export function getSavedProviders(): ProviderConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROVIDERS));
      return DEFAULT_PROVIDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_PROVIDERS;
  } catch (e) {
    console.error('Failed to parse saved providers, using defaults', e);
    return DEFAULT_PROVIDERS;
  }
}

/**
 * Saves providers to localStorage, mirrors to /models/gateway-providers.json, and notifies subscribers.
 */
export function saveProviders(providers: ProviderConfig[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
    }
  } catch (e) {
    console.error('Failed to save providers to localStorage', e);
  }

  // Mirror to persistent backend config vault (/models/gateway-providers.json)
  if (typeof fetch === 'function') {
    fetch('/api/gateway/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providers }),
    }).catch(() => {});
  }

  notifyListeners(providers);
}

/**
 * Hydrates providers from persistent server vault (/models/gateway-providers.json) into localStorage.
 */
export async function syncProvidersFromBackendVault(): Promise<ProviderConfig[]> {
  try {
    if (typeof fetch === 'function') {
      const res = await fetch('/api/gateway/config');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.providers) && data.providers.length > 0) {
          const localRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
          if (!localRaw || localRaw === JSON.stringify(DEFAULT_PROVIDERS) || localRaw === '[]') {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.providers));
            }
            notifyListeners(data.providers);
            return data.providers;
          }
        } else if (data.success && data.providers === null) {
          // Vault file does not exist yet; persist current local providers to backend disk
          const current = getSavedProviders();
          if (current.length > 0) {
            fetch('/api/gateway/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ providers: current }),
            }).catch(() => {});
          }
        }
      }
    }
  } catch (e) {
    // Ignore fetch error if server not yet ready
  }
  return getSavedProviders();
}

// Auto-trigger vault sync on client bootstrap
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncProvidersFromBackendVault().catch(() => {});
  }, 100);
}

/**
 * Adds or updates a provider.
 */
export function upsertProvider(provider: ProviderConfig): void {
  const current = getSavedProviders();
  const index = current.findIndex((p) => p.id === provider.id);
  let updated: ProviderConfig[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = provider;
  } else {
    updated = [...current, provider];
  }

  saveProviders(updated);
}

/**
 * Unified Two-Way Delete: Deletes a local GGUF model everywhere (backend disk + registry state).
 * If 0 models remain in local-gguf-engine, removes the local-gguf-engine card completely!
 */
export async function deleteLocalGgufModelEverywhere(modelId: string): Promise<ProviderConfig[]> {
  // 1. Delete binary & manifest from disk on backend
  try {
    await fetch(`/api/gateway/local-gguf/models/${encodeURIComponent(modelId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[LocalGguf] Backend deleteModel warning:', err);
  }

  // 2. Read fresh providers from localStorage
  const currentProviders = getSavedProviders();
  let updatedProviders: ProviderConfig[];

  const localIdx = currentProviders.findIndex(
    (p) => p.id === 'local-gguf-engine' || p.isLocalEngine || p.apiType === 'local-gguf'
  );

  if (localIdx >= 0) {
    const local = currentProviders[localIdx];
    const remainingModels = local.models.filter(
      (m) => m.id !== modelId && m.filename !== modelId
    );

    if (remainingModels.length === 0) {
      // If 0 models remain, remove local-gguf-engine provider completely
      updatedProviders = currentProviders.filter((_, idx) => idx !== localIdx);
    } else {
      updatedProviders = [...currentProviders];
      updatedProviders[localIdx] = {
        ...local,
        models: remainingModels,
      };
    }
  } else {
    updatedProviders = currentProviders;
  }

  saveProviders(updatedProviders);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gateway:models-changed'));
  }
  return updatedProviders;
}

/**
 * Deletes all local GGUF models from disk and removes the Local GGUF Engine provider card.
 */
export async function deleteAllLocalGgufModelsEverywhere(): Promise<ProviderConfig[]> {
  try {
    await fetch('/api/gateway/local-gguf/models?all=true', {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[LocalGguf] Backend deleteAllModels warning:', err);
  }

  const current = getSavedProviders();
  const updated = current.filter(
    (p) => p.id !== 'local-gguf-engine' && !p.isLocalEngine && p.apiType !== 'local-gguf'
  );

  saveProviders(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gateway:models-changed'));
  }
  return updated;
}

/**
 * Deletes a provider by ID.
 * If the deleted provider is local-gguf-engine, purges local models on disk as well.
 */
export function deleteProvider(id: string): void {
  if (id === 'local-gguf-engine') {
    deleteAllLocalGgufModelsEverywhere().catch(() => {});
    return;
  }
  const current = getSavedProviders();
  const updated = current.filter((p) => p.id !== id);
  saveProviders(updated);
}

/**
 * Finds a provider by ID.
 */
export function getProviderById(id: string): ProviderConfig | undefined {
  const providers = getSavedProviders();
  return providers.find((p) => p.id === id);
}

export interface ModelWithProvider {
  model: GatewayModel;
  provider: ProviderConfig;
}

/**
 * Lists all active models across all enabled providers.
 * Optional filter allows retrieving only chat models (excluding embeddings).
 */
export function getAllAvailableModels(filter?: { chatOnly?: boolean }): ModelWithProvider[] {
  const providers = getSavedProviders().filter((p) => p.enabled !== false);
  const result: ModelWithProvider[] = [];

  for (const provider of providers) {
    for (const model of provider.models) {
      if (filter?.chatOnly && (model.type === 'embedding' || model.capabilities.embedding)) {
        continue;
      }
      result.push({
        model,
        provider,
      });
    }
  }

  return result;
}

/**
 * Retrieves semantic role mappings from persistent storage.
 */
export function getRoleMappings(): Record<string, string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ROLE_MAPPINGS_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Updates semantic role mappings (e.g. '@coder' -> 'Qwen3.5-4B-3D-Coder-Q4_K_M').
 */
export function setRoleMappings(mappings: Record<string, string>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ROLE_MAPPINGS_KEY, JSON.stringify(mappings));
    }
  } catch {}
}

/**
 * Semantic Role Router:
 * Automatically resolves semantic aliases (@coder, @fast, @reasoning, @vision, @offline)
 * to the optimal registered model.
 */
export function resolveModelAlias(modelIdOrAlias: string): string {
  if (!modelIdOrAlias.startsWith('@')) return modelIdOrAlias;

  const alias = modelIdOrAlias.toLowerCase();
  const customMappings = getRoleMappings();
  if (customMappings[alias]) {
    return customMappings[alias];
  }

  const available = getAllAvailableModels();
  if (available.length === 0) return modelIdOrAlias;

  if (alias === '@coder') {
    const match = available.find(
      (m) =>
        m.model.id.toLowerCase().includes('coder') ||
        m.model.name.toLowerCase().includes('coder') ||
        m.model.id.toLowerCase().includes('deepseek') ||
        m.model.id.toLowerCase().includes('qwen')
    );
    if (match) return match.model.id;
  }

  if (alias === '@reasoning') {
    const match = available.find(
      (m) =>
        m.model.capabilities.reasoning ||
        m.model.id.toLowerCase().includes('r1') ||
        m.model.id.toLowerCase().includes('reason') ||
        m.model.id.toLowerCase().includes('qwq')
    );
    if (match) return match.model.id;
  }

  if (alias === '@vision') {
    const match = available.find(
      (m) =>
        m.model.capabilities.image ||
        m.model.id.toLowerCase().includes('vision') ||
        m.model.id.toLowerCase().includes('vl') ||
        m.model.id.toLowerCase().includes('4o')
    );
    if (match) return match.model.id;
  }

  if (alias === '@offline') {
    const match = available.find(
      (m) => m.model.isLocal || m.provider.isLocalEngine || m.provider.apiType === 'local-gguf'
    );
    if (match) return match.model.id;
  }

  if (alias === '@fast') {
    const match = available.find(
      (m) =>
        m.model.id.toLowerCase().includes('flash') ||
        m.model.id.toLowerCase().includes('mini') ||
        m.model.id.toLowerCase().includes('3.3') ||
        m.model.name.toLowerCase().includes('fast')
    );
    if (match) return match.model.id;
  }

  return available[0]?.model.id || modelIdOrAlias;
}

/**
 * 1-Click Gateway Config Backup Export
 */
export function exportGatewayConfig(): string {
  const providers = getSavedProviders();
  const roleMappings = getRoleMappings();
  const exportData: GatewayVaultConfig = {
    version: '1.0.0',
    providers,
    roleMappings,
    exportedAt: Date.now(),
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * 1-Click Gateway Config Backup Import
 */
export async function importGatewayConfig(jsonContent: string): Promise<{ success: boolean; count: number }> {
  try {
    const parsed = JSON.parse(jsonContent);
    const providers = Array.isArray(parsed) ? parsed : parsed.providers;
    if (!Array.isArray(providers)) {
      throw new Error('Invalid config: providers array not found.');
    }
    saveProviders(providers);
    if (parsed.roleMappings && typeof parsed.roleMappings === 'object') {
      setRoleMappings(parsed.roleMappings);
    }
    await syncLocalGgufModels();
    return { success: true, count: providers.length };
  } catch (err: any) {
    throw new Error(`Import failed: ${err.message}`);
  }
}

/**
 * Subscribes to changes in provider registry.
 */
export function subscribeToRegistry(listener: RegistryListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Synchronizes discovered local .gguf models from the backend into the registry
 */
export async function syncLocalGgufModels(): Promise<GatewayModel[]> {
  try {
    const res = await fetch('/api/gateway/local-gguf/models');
    if (!res.ok) return [];
    const data = await res.json();
    const scannedModels: GatewayModel[] = (data.models || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      capabilities: m.capabilities,
      type: m.type,
      filename: m.filename,
      sizeFormatted: m.sizeFormatted,
      quantization: m.quantization,
      architecture: m.architecture,
      contextLength: m.contextLength,
      status: m.status,
      isLocal: true,
      hasGuide: Boolean(m.hasGuide),
      systemPrompt: m.systemPrompt,
      parameters: m.parameters,
      chatTemplate: m.chatTemplate,
      zeroCopy: Boolean(m.zeroCopy),
      manifestPath: m.manifestPath,
      lastSelfTest: m.lastSelfTest,
    }));

    const providers = getSavedProviders();
    const localIdx = providers.findIndex(
      (p) => p.id === 'local-gguf-engine' || p.isLocalEngine || p.apiType === 'local-gguf'
    );

    if (scannedModels.length === 0) {
      // If no local models exist on disk, remove local-gguf-engine card from registry
      if (localIdx >= 0) {
        const cleaned = providers.filter((_, idx) => idx !== localIdx);
        saveProviders(cleaned);
      }
      return [];
    }

    // Local models exist: update or prepend local-gguf-engine
    if (localIdx >= 0) {
      providers[localIdx] = {
        ...providers[localIdx],
        models: scannedModels,
        isLocalEngine: true,
        enabled: providers[localIdx].enabled !== false,
      };
    } else {
      const localProvider: ProviderConfig = {
        id: 'local-gguf-engine',
        name: 'Local GGUF Engine (Offline / Native)',
        apiType: 'local-gguf',
        baseUrl: '/api/gateway/local-gguf',
        apiKey: '',
        apiKeys: [],
        enabled: true,
        isCustom: false,
        isLocalEngine: true,
        createdAt: Date.now() - 20000,
        headers: [],
        models: scannedModels,
      };
      providers.unshift(localProvider);
    }

    saveProviders(providers);
    return scannedModels;
  } catch (err) {
    console.warn('[LocalGguf] Failed to sync models with registry:', err);
    return [];
  }
}
