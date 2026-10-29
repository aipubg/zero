import type {
  ChatRequestOptions,
  ChatResponse,
  EmbeddingRequestOptions,
  EmbeddingResponse,
  ProviderConfig,
  ProviderTelemetry,
  RunningModelProcess,
} from './types';
import {
  getAllAvailableModels,
  getProviderById,
  getSavedProviders,
  resolveModelAlias,
  type ModelWithProvider,
  upsertProvider,
  deleteProvider,
} from './registry';
import { sendChatRequest, sendEmbeddingRequest, pingProvider } from './client';
import { telemetry } from './telemetry';
import { responseCache } from './cache';

/**
 * Enterprise AI Gateway SDK
 * 
 * Clean, single-import programmatic client for multi-agent architectures and production systems.
 * Usage:
 *   import { gateway } from '@/gateway';
 *   const res = await gateway.chat({ modelId: 'meta/llama-3.3-70b', messages: [...] });
 */
export class ModularGatewayClient {
  /**
   * Executes a complete chat completion with automatic retries, key failover, and fallbacks.
   */
  public async chat(options: ChatRequestOptions): Promise<ChatResponse> {
    const provider = this.resolveProvider(options);
    return await sendChatRequest(provider, { ...options, stream: false });
  }

  /**
   * Streams a chat completion in real time with token-by-token callbacks and reasoning isolation.
   */
  public async stream(
    options: ChatRequestOptions,
    onChunk?: (chunk: string, reasoningChunk?: string) => void
  ): Promise<ChatResponse> {
    const provider = this.resolveProvider(options);
    return await sendChatRequest(provider, {
      ...options,
      stream: true,
      onChunk: onChunk || options.onChunk,
    });
  }

  /**
   * Returns all available models across all active providers.
   * By default returns only generative chat models.
   */
  public getModels(filter?: { chatOnly?: boolean }): ModelWithProvider[] {
    return getAllAvailableModels(filter ?? { chatOnly: true });
  }

  /**
   * Returns all registered providers.
   */
  public getProviders(): ProviderConfig[] {
    return getSavedProviders();
  }

  /**
   * Finds a provider by ID.
   */
  public getProvider(id: string): ProviderConfig | undefined {
    return getProviderById(id);
  }

  /**
   * Adds or updates a provider configuration.
   */
  public saveProvider(provider: ProviderConfig): void {
    upsertProvider(provider);
  }

  /**
   * Removes a provider by ID.
   */
  public removeProvider(id: string): void {
    deleteProvider(id);
  }

  /**
   * Checks connectivity and measures ping latency in ms for a provider.
   */
  public async testConnection(
    providerId: string
  ): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const provider = getProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" not found in Gateway registry.`);
    }
    return await pingProvider(provider);
  }

  /**
   * Returns live health and telemetry report for all providers.
   */
  public getHealth(): Record<string, ProviderTelemetry> {
    return telemetry.getAll();
  }

  /**
   * Manually unloads an active offline model from RAM/VRAM to free memory immediately.
   */
  public async unloadLocalModel(_modelId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/gateway/local-gguf/unload', { method: 'POST' });
      if (res.ok) {
        return { success: true, message: 'Local GGUF model unloaded from RAM/VRAM.' };
      }
      return { success: false, message: `Failed to unload model (HTTP ${res.status}).` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to communicate with local GGUF engine.' };
    }
  }

  /**
   * Executes a chat completion requesting guaranteed JSON, strips code fences and returns parsed object T.
   */
  public async chatJson<T = any>(options: ChatRequestOptions): Promise<T> {
    const opts: ChatRequestOptions = {
      ...options,
      responseFormat: options.responseFormat || { type: 'json_object' },
    };
    const response = await this.chat(opts);
    return this.extractJson<T>(response.content);
  }

  /**
   * Extracts, cleans and parses JSON from raw LLM output, removing <think> tags, markdown code blocks and trailing commas.
   */
  public extractJson<T = any>(text: string): T {
    if (!text || typeof text !== 'string') {
      throw new Error('extractJson: input text is empty or invalid.');
    }

    // 1. Strip <think>...</think> reasoning blocks
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Strip markdown fences ```json ... ``` or ``` ... ```
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    // 3. Locate boundaries of outer { ... } or [ ... ]
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    // 4. Fix trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

    try {
      return JSON.parse(cleaned);
    } catch (parseErr: any) {
      throw new Error(`Failed to parse extracted JSON: ${parseErr.message}\nRaw text: "${cleaned.slice(0, 100)}..."`);
    }
  }

  /**
   * Coding Agent Power Feature:
   * Deterministic Code Completion supporting native FIM (Fill-In-The-Middle) and code synthesis.
   */
  public async completeCode(options: {
    modelId: string;
    prefix: string;
    suffix?: string;
    language?: string;
    maxTokens?: number;
  }): Promise<string> {
    const effectiveModelId = resolveModelAlias(options.modelId);
    const isFimModel = /qwen|coder|deepseek|starcoder|codellama/i.test(effectiveModelId);

    let prompt = '';
    if (isFimModel && options.suffix) {
      prompt = `<|fim_prefix|>${options.prefix}<|fim_suffix|>${options.suffix}<|fim_middle|>`;
    } else {
      prompt = `Complete the following ${options.language || 'code'} snippet cleanly without explanations or markdown formatting:\n${options.prefix}`;
    }

    const res = await this.chat({
      modelId: effectiveModelId,
      messages: [{ id: 'code-1', role: 'user', content: prompt }],
      temperature: 0.1,
      minP: 0.05,
      maxTokens: options.maxTokens || 1024,
    });

    let code = res.content.trim();
    if (code.startsWith('```')) {
      code = code.replace(/^```[a-zA-Z0-9_-]*\r?\n/, '').replace(/\r?\n```\s*$/, '').trim();
    }
    return code;
  }

  /**
   * Universal Vector Embeddings Generator
   */
  public async embed(options: EmbeddingRequestOptions): Promise<EmbeddingResponse> {
    const effectiveModelId = resolveModelAlias(options.modelId);
    const provider = this.resolveProvider({ modelId: effectiveModelId, messages: [] });
    return await sendEmbeddingRequest(provider, { ...options, modelId: effectiveModelId });
  }

  /**
   * Ollama /api/ps Equivalent:
   * Returns live status of loaded models, RAM usage, and active keep-alive timers.
   */
  public async getRunningProcesses(): Promise<RunningModelProcess[]> {
    try {
      const res = await fetch('/api/gateway/local-gguf/ps');
      if (res.ok) {
        const data = await res.json();
        return data.models || [];
      }
    } catch {}
    return [];
  }

  /**
   * Clears in-memory response cache.
   */
  public clearCache(): void {
    responseCache.clear();
  }

  private resolveProvider(options: ChatRequestOptions): ProviderConfig {
    const effectiveModelId = resolveModelAlias(options.modelId);
    options.modelId = effectiveModelId;

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
        `Provider "${targetProvider.name}" is currently disabled. Please enable it in Gateway Settings.`
      );
    }

    return targetProvider;
  }
}

export const gateway = new ModularGatewayClient();