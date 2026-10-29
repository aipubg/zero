import type {
  ChatMessage,
  ChatRequestOptions,
  ChatResponse,
  GatewayModel,
  GatewayToolCall,
  EmbeddingRequestOptions,
  EmbeddingResponse,
  ModelCapability,
  ModelType,
  ProviderConfig,
} from './types';
import { telemetry } from './telemetry';
import { responseCache } from './cache';
import { sanitizeMessages } from './sanitizer';

/**
 * Normalizes URL and ensures no trailing slashes.
 */
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Extracts and deduplicates all API keys configured for a provider.
 * Supports array in apiKeys or comma-separated list in apiKey.
 */
export function getProviderApiKeys(provider: ProviderConfig): string[] {
  const keys: string[] = [];

  if (provider.apiKeys && Array.isArray(provider.apiKeys)) {
    for (const k of provider.apiKeys) {
      if (k && k.trim() && !keys.includes(k.trim())) {
        keys.push(k.trim());
      }
    }
  }

  if (provider.apiKey && provider.apiKey.trim()) {
    const parts = provider.apiKey.split(',').map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      if (!keys.includes(p)) {
        keys.push(p);
      }
    }
  }

  return keys;
}

/**
 * Builds standard request headers merging API key and custom provider headers.
 */
export function buildHeaders(
  apiKey?: string,
  customHeaders?: Array<{ key: string; value: string }>
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim() !== '') {
    headers['Authorization'] = apiKey.trim().startsWith('Bearer ')
      ? apiKey.trim()
      : `Bearer ${apiKey.trim()}`;
  }

  if (customHeaders && customHeaders.length > 0) {
    for (const h of customHeaders) {
      if (h.key && h.key.trim() !== '') {
        headers[h.key.trim()] = h.value;
      }
    }
  }

  return headers;
}

/**
 * Smart Classifier: Automatically detects model capabilities and flags non-chat/embedding models.
 */
export function classifyModel(
  id: string,
  name?: string
): { capabilities: ModelCapability; type: ModelType } {
  const lower = `${id} ${name || ''}`.toLowerCase();

  // 1. Non-chat / Embedding / Audio / Rerank detection
  const isEmbedding =
    lower.includes('embed') ||
    lower.includes('embedding') ||
    lower.includes('arctic-embed') ||
    lower.includes('bge-') ||
    lower.includes('e5-') ||
    lower.includes('content-safety') ||
    lower.includes('reward');
  const isAudio = lower.includes('tts') || lower.includes('whisper') || lower.includes('speech');
  const isRerank = lower.includes('rerank');

  let type: ModelType = 'chat';
  if (isEmbedding) type = 'embedding';
  else if (isAudio) type = 'audio';
  else if (isRerank) type = 'rerank';

  // 2. Vision / Image detection
  const hasImage =
    lower.includes('vision') ||
    lower.includes('vl') ||
    lower.includes('pixtral') ||
    lower.includes('llava') ||
    lower.includes('4o') ||
    lower.includes('claude-3') ||
    lower.includes('gemini') ||
    lower.includes('multimodal') ||
    lower.includes('fuyu') ||
    lower.includes('kosmos') ||
    lower.includes('neva');

  // 3. Reasoning / Extended thinking detection
  const hasReasoning =
    lower.includes('r1') ||
    lower.includes('reasoning') ||
    lower.includes('reasoner') ||
    lower.includes('think') ||
    lower.includes('o1') ||
    lower.includes('o3') ||
    lower.includes('deepseek-r');

  return {
    capabilities: {
      reasoning: hasReasoning,
      image: hasImage,
      embedding: isEmbedding,
    },
    type,
  };
}

/**
 * Fetches available models from the provider's /models endpoint via CORS proxy.
 */
export async function fetchModelsFromBaseUrl(
  baseUrl: string,
  apiKey?: string,
  customHeaders?: Array<{ key: string; value: string }>
): Promise<GatewayModel[]> {
  const cleanUrl = normalizeBaseUrl(baseUrl);

  // Handle mock/simulation provider for offline or instant testing
  if (cleanUrl.startsWith('mock://') || cleanUrl.includes('mock.provider')) {
    return [
      { id: 'mock-gpt-4o', name: 'Mock GPT-4o (Vision + Fast)', capabilities: { reasoning: false, image: true }, type: 'chat' },
      { id: 'mock-deepseek-r1', name: 'Mock DeepSeek R1 (Reasoning)', capabilities: { reasoning: true, image: false }, type: 'chat' },
      { id: 'mock-claude-3-7-sonnet', name: 'Mock Claude 3.7 Sonnet (Hybrid)', capabilities: { reasoning: true, image: true }, type: 'chat' },
      { id: 'mock-llama-3.3-70b', name: 'Mock Llama 3.3 70B (General)', capabilities: { reasoning: false, image: false }, type: 'chat' },
      { id: 'mock-text-embedding-3', name: 'Mock Text Embedding 3', capabilities: { reasoning: false, image: false, embedding: true }, type: 'embedding' },
    ];
  }

  const isLocalRoute = cleanUrl.startsWith('/') || cleanUrl.includes('local-gguf');
  let res: Response;

  try {
    if (isLocalRoute) {
      const directUrl = cleanUrl.endsWith('/models') ? cleanUrl : `${cleanUrl}/models`;
      res = await fetch(directUrl);
    } else {
      res = await fetch('/api/gateway/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: cleanUrl,
          endpoint: '/models',
          method: 'GET',
          apiKey,
          headers: customHeaders,
        }),
      });
    }
  } catch (netErr: any) {
    throw new Error(`Proxy Connection Error: ${netErr.message || 'Unable to connect to local CORS proxy (/api/gateway/proxy)'}`);
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const errMsg =
      errData?.error ||
      (typeof errData?.details === 'string' ? errData.details : JSON.stringify(errData?.details)) ||
      res.statusText ||
      'Failed to fetch models';
    throw new Error(`[HTTP ${res.status}] ${errMsg}`);
  }

  const json = await res.json();
  let rawList: any[] = [];

  if (Array.isArray(json)) {
    rawList = json;
  } else if (json.data && Array.isArray(json.data)) {
    rawList = json.data;
  } else if (json.models && Array.isArray(json.models)) {
    rawList = json.models;
  } else {
    throw new Error('Unexpected models response format. Expected JSON with "data" or "models" array.');
  }

  return rawList.map((item: any) => {
    const id = typeof item === 'string' ? item : (item.id || item.name || 'unknown-model');
    const name = item.name || id;
    const classified = classifyModel(id, name);

    return {
      id,
      name,
      capabilities: classified.capabilities,
      type: classified.type,
    };
  });
}

/**
 * Pings the provider to check connectivity and measure latency in milliseconds.
 */
export async function pingProvider(
  provider: ProviderConfig
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const cleanUrl = normalizeBaseUrl(provider.baseUrl);
  const start = performance.now();

  if (cleanUrl.startsWith('mock://') || cleanUrl.includes('mock.provider')) {
    await new Promise((r) => setTimeout(r, 45));
    const latencyMs = Math.round(performance.now() - start);
    telemetry.recordPing(provider.id, latencyMs, true);
    return { ok: true, latencyMs };
  }

  // Local GGUF Engine: Direct call to local route without external proxy
  const isLocalEngine =
    provider.apiType === 'local-gguf' ||
    provider.isLocalEngine ||
    cleanUrl.startsWith('/') ||
    cleanUrl.includes('local-gguf');

  if (isLocalEngine) {
    try {
      const directUrl = cleanUrl.endsWith('/models') ? cleanUrl : `${cleanUrl}/models`;
      const res = await fetch(directUrl);
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error || `HTTP ${res.status}`;
        telemetry.recordPing(provider.id, latencyMs, false, errMsg);
        return { ok: false, latencyMs, error: errMsg };
      }

      telemetry.recordPing(provider.id, latencyMs, true);
      return { ok: true, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      const errMsg = err.message || 'Local GGUF ping failed';
      telemetry.recordPing(provider.id, latencyMs, false, errMsg);
      return { ok: false, latencyMs, error: errMsg };
    }
  }

  try {
    const keys = getProviderApiKeys(provider);
    const key = keys[0] || provider.apiKey;

    const res = await fetch('/api/gateway/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: cleanUrl,
        endpoint: '/models',
        method: 'GET',
        apiKey: key,
        headers: provider.headers,
      }),
    });

    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error || `HTTP ${res.status}`;
      telemetry.recordPing(provider.id, latencyMs, false, errMsg);
      return { ok: false, latencyMs, error: errMsg };
    }

    telemetry.recordPing(provider.id, latencyMs, true);
    return { ok: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    const errMsg = err.message || 'Ping failed';
    telemetry.recordPing(provider.id, latencyMs, false, errMsg);
    return { ok: false, latencyMs, error: errMsg };
  }
}

/**
 * Formats client messages to standard OpenAI chat completion format.
 */
function formatMessagesForPayload(messages: ChatMessage[]) {
  return messages.map((msg) => {
    // Check if images array exists
    if (Array.isArray(msg.images) && msg.images.length > 0) {
      const parts: any[] = [];
      const text = typeof msg.content === 'string' ? msg.content : '';
      if (text.trim()) parts.push({ type: 'text', text });
      for (const img of msg.images) {
        parts.push({ type: 'image_url', image_url: { url: img } });
      }
      return {
        role: msg.role,
        content: parts,
        tool_calls: msg.tool_calls,
      };
    }

    if (typeof msg.content === 'string') {
      return {
        role: msg.role,
        content: msg.content,
        tool_calls: msg.tool_calls,
      };
    }

    // Multimodal payload
    return {
      role: msg.role,
      content: msg.content.map((part) => {
        if (part.type === 'image_url' && part.image_url) {
          return {
            type: 'image_url',
            image_url: {
              url: part.image_url.url,
            },
          };
        }
        return {
          type: 'text',
          text: part.text || '',
        };
      }),
      tool_calls: msg.tool_calls,
    };
  });
}

/**
 * Simulated stream response for testing when provider is a mock or during offline tests.
 */
async function simulateStreamResponse(
  options: ChatRequestOptions,
  modelName: string,
  providerId: string
): Promise<ChatResponse> {
  const start = performance.now();
  const lastUserMsg = [...options.messages].reverse().find((m) => m.role === 'user');
  const userText = typeof lastUserMsg?.content === 'string' 
    ? lastUserMsg.content 
    : 'Hello Gateway';

  const isReasoning = options.modelId.includes('reason') || options.modelId.includes('r1');
  let fullReasoning = '';
  let fullContent = '';

  if (isReasoning) {
    const reasoningSteps = [
      'Analyzing user prompt and intent...',
      '\nVerifying modular gateway routing configuration...',
      `\nModel selected: ${modelName} (${options.modelId}) via Enterprise Gateway Engine.`,
      '\nFormulating structured output and validating constraints...',
    ];

    for (const step of reasoningSteps) {
      if (options.signal?.aborted) throw new Error('Request aborted');
      await new Promise((r) => setTimeout(r, 80));
      fullReasoning += step;
      options.onChunk?.('', step);
    }
  }

  const responseText = `[Enterprise Gateway Response]\nHello! I am responding via model "${options.modelId}".\nYour message: "${userText}" was successfully routed through the Enterprise AI Gateway.\n\nStatus: 200 OK | Stream: Active | Routing: Modular.`;

  const words = responseText.split(' ');
  for (let i = 0; i < words.length; i++) {
    if (options.signal?.aborted) throw new Error('Request aborted');
    await new Promise((r) => setTimeout(r, 25));
    const chunk = (i === 0 ? '' : ' ') + words[i];
    fullContent += chunk;
    options.onChunk?.(chunk, '');
  }

  const latencyMs = Math.round(performance.now() - start);
  const promptTokens = Math.max(1, Math.round(userText.length / 4));
  const completionTokens = Math.max(1, Math.round(fullContent.length / 4));

  telemetry.recordSuccess(providerId, latencyMs, promptTokens + completionTokens);

  return {
    content: fullContent,
    reasoning: fullReasoning || undefined,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    latencyMs,
    providerId,
    modelId: options.modelId,
    timestamp: Date.now(),
  };
}

/**
 * Executes a single HTTP chat completion attempt through the local CORS proxy.
 */
async function executeChatAttempt(
  cleanUrl: string,
  key: string | undefined,
  provider: ProviderConfig,
  modelId: string,
  options: ChatRequestOptions,
  timeoutSignal: AbortSignal
): Promise<ChatResponse> {
  const start = performance.now();

  const modelConfig = provider.models.find((m) => m.id === modelId);
  const isReasoningModel = modelConfig?.capabilities.reasoning ?? false;

  const requestBody: Record<string, any> = {
    model: modelId,
    messages: formatMessagesForPayload(options.messages),
    stream: options.stream ?? true,
  };

  if (options.temperature !== undefined) {
    requestBody.temperature = options.temperature;
  }
  if (options.maxTokens !== undefined) {
    requestBody.max_tokens = options.maxTokens;
  }

  // Structured Output / JSON Schema
  if (options.responseFormat) {
    if (options.responseFormat.type === 'json_schema' && options.responseFormat.json_schema) {
      requestBody.response_format = {
        type: 'json_schema',
        json_schema: options.responseFormat.json_schema,
      };
    } else if (options.responseFormat.type === 'json_object' || options.responseFormat.type === 'json_schema') {
      requestBody.response_format = { type: 'json_object' };
    }
  }

  // Agent Tool / Function Calling
  if (Array.isArray(options.tools) && options.tools.length > 0) {
    requestBody.tools = options.tools;
    if (options.toolChoice) {
      requestBody.tool_choice = options.toolChoice;
    }
  }

  // Coding Sampling Parameters
  if (options.seed !== undefined) requestBody.seed = options.seed;
  if (options.minP !== undefined) requestBody.min_p = options.minP;
  if (options.topK !== undefined) requestBody.top_k = options.topK;
  if (options.repeatPenalty !== undefined) requestBody.frequency_penalty = options.repeatPenalty;

  if (isReasoningModel) {
    if (modelId.startsWith('o1') || modelId.startsWith('o3')) {
      requestBody.reasoning_effort = 'medium';
    }
  }

  const isLocalEngine =
    provider.apiType === 'local-gguf' ||
    provider.isLocalEngine ||
    cleanUrl.includes('local-gguf');

  let response: Response;

  if (isLocalEngine) {
    // Native Local GGUF Engine Route
    try {
      response = await fetch('/api/gateway/local-gguf/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          modelId,
          messages: formatMessagesForPayload(options.messages),
          stream: options.stream ?? true,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          reasoningEnabled: options.reasoningEnabled,
          responseFormat: options.responseFormat,
          tools: options.tools,
          toolChoice: options.toolChoice,
          seed: options.seed,
          minP: options.minP,
          topK: options.topK,
          repeatPenalty: options.repeatPenalty,
          keep_alive: options.keepAlive,
        }),
        signal: timeoutSignal,
      });
    } catch (netErr: any) {
      if (netErr.name === 'AbortError' || timeoutSignal.aborted) throw netErr;
      throw new Error(`Local GGUF Engine Error: ${netErr.message || 'Failed to connect to local GGUF server'}`);
    }
  } else {
    // Cloud / External Provider Route via CORS Proxy
    const proxyPayload = {
      baseUrl: cleanUrl,
      endpoint: '/chat/completions',
      method: 'POST',
      apiKey: key,
      headers: provider.headers,
      body: requestBody,
      stream: options.stream ?? true,
    };

    try {
      response = await fetch('/api/gateway/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyPayload),
        signal: timeoutSignal,
      });
    } catch (netErr: any) {
      if (netErr.name === 'AbortError' || timeoutSignal.aborted) throw netErr;
      throw new Error(`Proxy Connection Error: ${netErr.message || 'Unable to connect to local CORS proxy (/api/gateway/proxy)'}`);
    }
  }

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const errText =
      errorJson?.error ||
      (typeof errorJson?.details === 'string' ? errorJson.details : JSON.stringify(errorJson?.details)) ||
      response.statusText ||
      'Unknown API Error';

    const err = new Error(`[HTTP ${response.status}] ${errText}`) as any;
    err.status = response.status;
    err.isRateLimit = response.status === 429;
    err.isServerError = response.status >= 500 && response.status <= 504;
    throw err;
  }

  // Handle Non-Streaming
  if (!options.stream) {
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content || '';
    const reasoning = message?.reasoning_content || undefined;

    // Normalize tool calls
    const rawTools = message?.tool_calls || data.toolCalls || data.choices?.[0]?.tool_calls;
    let toolCalls: GatewayToolCall[] | undefined = undefined;
    if (Array.isArray(rawTools) && rawTools.length > 0) {
      toolCalls = rawTools.map((t: any) => ({
        id: t.id || `call-${Date.now()}`,
        name: t.function?.name || t.name || 'tool',
        arguments:
          typeof t.function?.arguments === 'string'
            ? (() => {
                try {
                  return JSON.parse(t.function.arguments);
                } catch {
                  return t.function.arguments;
                }
              })()
            : t.function?.arguments || t.arguments || {},
      }));
    } else {
      // Check for raw <tool_call> tags emitted by coding models
      const toolMatch = content.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
      if (toolMatch) {
        try {
          const parsed = JSON.parse(toolMatch[1].trim());
          toolCalls = [
            {
              id: `call-${Date.now()}`,
              name: parsed.name,
              arguments: parsed.arguments || {},
            },
          ];
        } catch {}
      }
    }

    const latencyMs = Math.round(performance.now() - start);
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return {
      content,
      reasoning,
      toolCalls,
      usage,
      latencyMs,
      providerId: provider.id,
      modelId,
      timestamp: Date.now(),
    };
  }

  // Handle SSE Streaming
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body stream is not readable.');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullContent = '';
  let fullReasoning = '';
  let insideInlineThinkTag = false;
  let streamedToolCalls: GatewayToolCall[] = [];

  // Real-Time Anti-Loop Token Watchdog state
  let consecutiveTokenCount = 0;
  let lastTokenChunk = '';

  // Activity Watchdog: Never kill active local streams as long as tokens are arriving!
  let inactivityTimer: any = null;
  const inactivityMs = isLocalEngine ? 120000 : 45000;
  const resetInactivity = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      try {
        reader.cancel('Inactivity timeout: no tokens received for ' + inactivityMs / 1000 + 's');
      } catch {}
    }, inactivityMs);
  };
  resetInactivity();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetInactivity();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let shouldBreakLoop = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          shouldBreakLoop = true;
          break;
        }

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.substring(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;

            // Streamed tool calls accumulation
            if (Array.isArray(delta.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!streamedToolCalls[idx]) {
                  streamedToolCalls[idx] = {
                    id: tc.id || `call-${Date.now()}`,
                    name: tc.function?.name || '',
                    arguments: {},
                  };
                }
                if (tc.function?.name) streamedToolCalls[idx].name += tc.function.name;
                if (tc.function?.arguments) {
                  // accumulate raw string argument
                  (streamedToolCalls[idx] as any).rawArgs =
                    ((streamedToolCalls[idx] as any).rawArgs || '') + tc.function.arguments;
                }
              }
            }

            // 1. Check reasoning_content
            const reasoningDelta = delta.reasoning_content || delta.reasoning || '';
            if (reasoningDelta) {
              fullReasoning += reasoningDelta;
              options.onChunk?.('', reasoningDelta);
            }

            // 2. Check standard content delta
            const contentDelta = delta.content || '';
            if (contentDelta) {
              // Anti-Loop Watchdog: Single identical token repetition check (>= 25 times)
              if (contentDelta === lastTokenChunk && contentDelta.trim().length > 0) {
                consecutiveTokenCount++;
                if (consecutiveTokenCount >= 25) {
                  console.warn('[Watchdog] Token loop detected (25x identical token). Halting stream cleanly.');
                  shouldBreakLoop = true;
                  break;
                }
              } else {
                consecutiveTokenCount = 0;
                lastTokenChunk = contentDelta;
              }

              // Anti-Loop Watchdog: Phrase repetition check (>= 20 chars repeating 4+ times)
              if (fullContent.length > 200) {
                const recentSlice = fullContent.slice(-300);
                const phraseCandidates = recentSlice.split(/\n+/).map((s) => s.trim()).filter((s) => s.length >= 20);
                if (phraseCandidates.length >= 4) {
                  const lastPhrase = phraseCandidates[phraseCandidates.length - 1];
                  const identicalCount = phraseCandidates.slice(-4).filter((p) => p === lastPhrase).length;
                  if (identicalCount >= 4) {
                    console.warn(`[Watchdog] Phrase loop detected ("${lastPhrase.slice(0, 30)}..."). Halting stream cleanly.`);
                    fullContent = fullContent.slice(0, -lastPhrase.length * 3);
                    shouldBreakLoop = true;
                    break;
                  }
                }
              }

              if (contentDelta.includes('<think>')) {
                insideInlineThinkTag = true;
                const parts = contentDelta.split('<think>');
                if (parts[0]) {
                  fullContent += parts[0];
                  options.onChunk?.(parts[0], '');
                }
                if (parts[1]) {
                  fullReasoning += parts[1];
                  options.onChunk?.('', parts[1]);
                }
                continue;
              }

              if (insideInlineThinkTag) {
                if (contentDelta.includes('</think>')) {
                  insideInlineThinkTag = false;
                  const parts = contentDelta.split('</think>');
                  fullReasoning += parts[0];
                  options.onChunk?.('', parts[0]);
                  if (parts[1]) {
                    fullContent += parts[1];
                    options.onChunk?.(parts[1], '');
                  }
                } else {
                  fullReasoning += contentDelta;
                  options.onChunk?.('', contentDelta);
                }
                continue;
              }

              fullContent += contentDelta;
              options.onChunk?.(contentDelta, '');
            }
          } catch (_) {
            // Ignore partial SSE chunk parse error
          }
        }
      }

      if (shouldBreakLoop) break;
    }
  } finally {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    reader.releaseLock();
  }

  // Parse any accumulated streamed tool calls
  if (streamedToolCalls.length > 0) {
    for (const st of streamedToolCalls) {
      if ((st as any).rawArgs) {
        try {
          st.arguments = JSON.parse((st as any).rawArgs);
        } catch {
          st.arguments = { raw: (st as any).rawArgs };
        }
        delete (st as any).rawArgs;
      }
    }
  } else {
    // Check for inline <tool_call> tags in fullContent
    const toolMatch = fullContent.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
    if (toolMatch) {
      try {
        const parsed = JSON.parse(toolMatch[1].trim());
        streamedToolCalls = [
          {
            id: `call-${Date.now()}`,
            name: parsed.name,
            arguments: parsed.arguments || {},
          },
        ];
      } catch {}
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  const promptTokens = Math.max(1, Math.round(options.messages.length * 30));
  const completionTokens = Math.max(1, Math.round(fullContent.length / 4));

  return {
    content: fullContent,
    reasoning: fullReasoning || undefined,
    toolCalls: streamedToolCalls.length > 0 ? streamedToolCalls : undefined,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    latencyMs,
    providerId: provider.id,
    modelId,
    timestamp: Date.now(),
  };
}

/**
 * Core Gateway Dispatcher:
 * 1. Checks in-memory cache if caching enabled
 * 2. Implements Key Rotation (pool & 429 failover)
 * 3. Implements Auto-Retry with Exponential Backoff (500/502/503/network)
 * 4. Implements Model Fallback Chain if primary model completely fails
 * 5. Records latency and telemetry
 */
export async function sendChatRequest(
  provider: ProviderConfig,
  options: ChatRequestOptions
): Promise<ChatResponse> {
  // Pre-flight sanitization: merges consecutive turns, heals system messages & validates content
  const sanitizedMessages = sanitizeMessages(options.messages);
  options = {
    ...options,
    messages: sanitizedMessages,
  };

  // Check Non-Chat / Embedding safeguard
  const modelConfig = provider.models.find((m) => m.id === options.modelId);
  const lowerId = options.modelId.toLowerCase();
  const isEmbed =
    modelConfig?.type === 'embedding' ||
    modelConfig?.capabilities.embedding ||
    lowerId.includes('embed') ||
    lowerId.includes('reward') ||
    lowerId.includes('rerank');
  if (isEmbed) {
    throw new Error(
      `Cannot execute chat completions on model "${options.modelId}". This is an Embedding / Non-Chat model. Please select a generative chat model.`
    );
  }

  // Check In-Memory Cache if requested
  const cacheKey = responseCache.buildKey(options.modelId, options.messages, options.temperature);
  if (options.cache && !options.stream) {
    const cached = responseCache.get(cacheKey);
    if (cached) {
      telemetry.recordSuccess(provider.id, 1, cached.usage?.totalTokens || 0);
      return cached;
    }
  }

  const cleanUrl = normalizeBaseUrl(provider.baseUrl);

  // If mock provider is used, execute built-in simulator
  if (cleanUrl.startsWith('mock://') || cleanUrl.includes('mock.provider')) {
    const model = provider.models.find((m) => m.id === options.modelId);
    return simulateStreamResponse(options, model?.name || options.modelId, provider.id);
  }

  const isLocalEngine =
    provider.apiType === 'local-gguf' ||
    provider.isLocalEngine ||
    cleanUrl.includes('local-gguf');

  // Setup request timeout signal: 300,000ms (5 minutes) for Local GGUF, 30,000ms for cloud
  const timeoutMs = options.timeoutMs ?? (isLocalEngine ? 300000 : 30000);
  const timeoutController = new AbortController();
  let timer: any = setTimeout(() => {
    timeoutController.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  // Clear initial timeout when streaming begins (inactivity watchdog handles ongoing chunks)
  const originalOnChunk = options.onChunk;
  const wrappedOptions: ChatRequestOptions = {
    ...options,
    onChunk: (content, reasoning) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      originalOnChunk?.(content, reasoning);
    },
  };

  // Wire user abort signal directly to controller so user Stop (⏹) immediately triggers abort
  if (options.signal) {
    if (options.signal.aborted) {
      timeoutController.abort(new Error('Request aborted by user'));
    } else {
      options.signal.addEventListener(
        'abort',
        () => {
          timeoutController.abort(new Error('Request aborted by user'));
        },
        { once: true }
      );
    }
  }

  const combinedSignal = timeoutController.signal;

  // Retrieve API Keys Pool
  const keys = getProviderApiKeys(provider);
  let activeKeyIndex = telemetry.get(provider.id).lastActiveKeyIndex % (keys.length || 1);

  // Helper to attempt execution for a specific model ID
  const executeForModel = async (targetModelId: string): Promise<ChatResponse> => {
    let lastError: any = null;
    let retriesCount = 0;
    // Disable auto-retries for Local GGUF to avoid duplicate concurrent execution
    const maxRetries = isLocalEngine ? 0 : 2;
    const keysTried = new Set<number>();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (options.signal?.aborted) throw new Error('Request aborted');

      const currentKey = keys.length > 0 ? keys[activeKeyIndex] : provider.apiKey;
      keysTried.add(activeKeyIndex);

      try {
        const response = await executeChatAttempt(
          cleanUrl,
          currentKey,
          provider,
          targetModelId,
          wrappedOptions,
          combinedSignal
        );

        // Success!
        telemetry.recordSuccess(provider.id, response.latencyMs, response.usage?.totalTokens || 0);
        telemetry.setKeyIndex(provider.id, activeKeyIndex);

        if (options.cache) {
          responseCache.set(cacheKey, response);
        }

        response.retriesAttempted = retriesCount;
        return response;
      } catch (err: any) {
        lastError = err;

        if (err.name === 'AbortError' || options.signal?.aborted) {
          throw err;
        }

        // 1. Check for Rate Limit (429) & Key Rotation
        if (err.isRateLimit && keys.length > 1 && keysTried.size < keys.length) {
          activeKeyIndex = (activeKeyIndex + 1) % keys.length;
          telemetry.setKeyIndex(provider.id, activeKeyIndex);
          telemetry.setStatus(provider.id, 'rate-limited');
          options.onKeyRotate?.(provider.id, activeKeyIndex);
          // Retry immediately with the rotated key without consuming standard retry quota
          attempt--;
          continue;
        }

        // 2. Check for Server Errors (500, 502, 503, 504) or Network Timeout for Exponential Backoff
        const isTransient =
          err.isServerError ||
          err.name === 'TypeError' ||
          err.message?.includes('timeout') ||
          err.message?.includes('Proxy Connection Error');

        if (isTransient && attempt < maxRetries) {
          retriesCount++;
          const delayMs = Math.round(600 * Math.pow(2, attempt) + Math.random() * 200);
          options.onRetry?.(attempt + 1, err.message, delayMs);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        // Non-retryable error (e.g. 400 Bad Request, 401 Invalid Key)
        break;
      }
    }

    throw lastError;
  };

  try {
    return await executeForModel(options.modelId);
  } catch (primaryErr: any) {
    clearTimeout(timer);

    // Record failure in telemetry
    telemetry.recordFailure(provider.id, primaryErr.message, primaryErr.isRateLimit);

    // 3. Fallback Model Routing
    const fallbackId = options.fallbackModelId || provider.fallbackModelId;
    if (fallbackId && fallbackId !== options.modelId) {
      const fallbackModelExists = provider.models.some((m) => m.id === fallbackId);
      if (fallbackModelExists) {
        options.onFallback?.(fallbackId, primaryErr.message);

        // Execute seamlessly on the fallback model
        const fallbackRes = await executeForModel(fallbackId);
        fallbackRes.fallbackUsed = true;
        fallbackRes.primaryModelId = options.modelId;
        return fallbackRes;
      }
    }

    throw primaryErr;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Universal Embeddings Dispatcher:
 * Supports vector embeddings generation across both local GGUF models and cloud providers.
 */
export async function sendEmbeddingRequest(
  provider: ProviderConfig,
  options: EmbeddingRequestOptions
): Promise<EmbeddingResponse> {
  const cleanUrl = normalizeBaseUrl(provider.baseUrl);
  const isLocalEngine =
    provider.apiType === 'local-gguf' ||
    provider.isLocalEngine ||
    cleanUrl.includes('local-gguf');

  if (isLocalEngine) {
    const res = await fetch('/api/gateway/local-gguf/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.modelId,
        input: options.input,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Local embeddings error HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      embeddings: data.data?.map((d: any) => d.embedding) || data.embeddings || [],
      usage: data.usage || { totalTokens: 0 },
      modelId: options.modelId,
    };
  }

  // Cloud provider embeddings via proxy
  const res = await fetch('/api/gateway/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseUrl: cleanUrl,
      endpoint: '/embeddings',
      method: 'POST',
      apiKey: provider.apiKey,
      headers: provider.headers,
      body: {
        model: options.modelId,
        input: options.input,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Cloud embeddings error HTTP ${res.status}`);
  }
  const data = await res.json();
  return {
    embeddings: data.data?.map((d: any) => d.embedding) || [],
    usage: data.usage || { totalTokens: 0 },
    modelId: options.modelId,
  };
}