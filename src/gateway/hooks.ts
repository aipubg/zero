import { useEffect, useState, useCallback } from 'react';
import type {
  ChatRequestOptions,
  ChatResponse,
  CustomHeader,
  GatewayModel,
  ProviderConfig,
  ProviderTelemetry,
} from './types.ts';
import {
  deleteProvider,
  getAllAvailableModels,
  getProviderById,
  getSavedProviders,
  subscribeToRegistry,
  syncLocalGgufModels,
  upsertProvider,
  type ModelWithProvider,
} from './registry.ts';
import { fetchModelsFromBaseUrl, pingProvider, sendChatRequest } from './client.ts';
import { telemetry } from './telemetry.ts';
import { gateway } from './sdk.ts';

export function useGateway() {
  const [providers, setProviders] = useState<ProviderConfig[]>(() => getSavedProviders());
  const [availableModels, setAvailableModels] = useState<ModelWithProvider[]>(() =>
    getAllAvailableModels()
  );
  const [telemetryData, setTelemetryData] = useState<Record<string, ProviderTelemetry>>(() =>
    telemetry.getAll()
  );

  useEffect(() => {
    // Automatically synchronize local GGUF models on startup so they appear in chat dropdown immediately
    syncLocalGgufModels().catch(() => {});

    const unsubRegistry = subscribeToRegistry((updatedProviders) => {
      setProviders(updatedProviders);
      setAvailableModels(getAllAvailableModels());
    });

    const unsubTelemetry = telemetry.subscribe((updatedTelemetry) => {
      setTelemetryData(updatedTelemetry);
    });

    const handleRegistryEvent = () => {
      setProviders(getSavedProviders());
      setAvailableModels(getAllAvailableModels());
    };
    window.addEventListener('gateway-registry-updated', handleRegistryEvent);

    return () => {
      window.removeEventListener('gateway-registry-updated', handleRegistryEvent);
      unsubRegistry();
      unsubTelemetry();
    };
  }, []);

  const saveProvider = useCallback((provider: ProviderConfig) => {
    upsertProvider(provider);
  }, []);

  const removeProvider = useCallback((id: string) => {
    deleteProvider(id);
  }, []);

  const toggleProvider = useCallback((id: string) => {
    const p = getProviderById(id);
    if (p) {
      upsertProvider({ ...p, enabled: !p.enabled });
    }
  }, []);

  const fetchRemoteModels = useCallback(
    async (
      baseUrl: string,
      apiKey?: string,
      headers?: CustomHeader[]
    ): Promise<GatewayModel[]> => {
      return await fetchModelsFromBaseUrl(baseUrl, apiKey, headers);
    },
    []
  );

  const testProviderConnection = useCallback(
    async (provider: ProviderConfig): Promise<{ ok: boolean; latencyMs: number; error?: string }> => {
      return await pingProvider(provider);
    },
    []
  );

  /**
   * Unified Dispatcher: Dispatches chat request with automatic retries, key failover, and model fallbacks.
   */
  const dispatchChat = useCallback(
    async (options: ChatRequestOptions): Promise<ChatResponse> => {
      let targetProvider: ProviderConfig | undefined;

      if (options.providerId) {
        targetProvider = getProviderById(options.providerId);
      } else {
        const match = getAllAvailableModels().find((m) => m.model.id === options.modelId);
        targetProvider = match?.provider;
      }

      if (!targetProvider) {
        throw new Error(
          `No active provider found for model "${options.modelId}". Please configure or enable the provider in Gateway Settings.`
        );
      }

      if (targetProvider.enabled === false) {
        throw new Error(
          `Provider "${targetProvider.name}" is currently disabled. Please enable it in Gateway Providers.`
        );
      }

      return await sendChatRequest(targetProvider, options);
    },
    []
  );

  return {
    providers,
    availableModels,
    telemetryData,
    saveProvider,
    removeProvider,
    toggleProvider,
    fetchRemoteModels,
    testProviderConnection,
    dispatchChat,
    gateway,
  };
}