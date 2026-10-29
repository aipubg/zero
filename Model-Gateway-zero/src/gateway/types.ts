export type ModelType = 'chat' | 'embedding' | 'audio' | 'rerank' | 'image-gen';

export interface ModelCapability {
  reasoning: boolean;
  image: boolean;
  embedding?: boolean;
}

export interface GatewayModel {
  id: string;
  name: string;
  capabilities: ModelCapability;
  type?: ModelType;
  filename?: string;
  sizeFormatted?: string;
  quantization?: string;
  architecture?: string;
  contextLength?: number;
  status?: 'loaded' | 'ready' | 'error';
  isLocal?: boolean;
  hasGuide?: boolean;
  systemPrompt?: string;
  parameters?: Record<string, any>;
  chatTemplate?: string;
  zeroCopy?: boolean;
  manifestPath?: string;
  lastSelfTest?: {
    passed: boolean;
    message: string;
    tokensPerSec?: number;
    timestamp?: number;
  };
}

export interface CustomHeader {
  id?: string;
  key: string;
  value: string;
}

export type ProviderApiType = 'openai-compatible' | 'anthropic' | 'custom' | 'local-gguf';

export type ProviderStatus = 'active' | 'rate-limited' | 'error' | 'idle';

export interface ProviderTelemetry {
  status: ProviderStatus;
  lastPingMs?: number;
  avgLatencyMs?: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  lastActiveKeyIndex: number;
  lastError?: string;
  lastTestedAt?: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiType: ProviderApiType;
  baseUrl: string;
  apiKey?: string; // Single key or comma-separated
  apiKeys?: string[]; // Multiple API Keys Pool for round-robin & 429 failover
  fallbackModelId?: string; // Fallback model when primary fails or 429s
  models: GatewayModel[];
  headers?: CustomHeader[];
  isCustom?: boolean;
  isLocalEngine?: boolean;
  enabled: boolean;
  createdAt: number;
}

export interface GatewayVaultConfig {
  providers: ProviderConfig[];
  roleMappings?: Record<string, string>;
  defaultKeepAlive?: number;
  exportedAt?: number;
  version?: string;
}

export interface ChatMessagePart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface GatewayToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
}

export interface GatewayToolCall {
  id: string;
  type?: 'function';
  function?: {
    name: string;
    arguments: string | Record<string, any>;
  };
  name?: string;
  arguments?: Record<string, any>;
}

export interface ResponseFormatOption {
  type: 'json_object' | 'json_schema' | 'text';
  schema?: Record<string, any>;
  json_schema?: {
    name?: string;
    strict?: boolean;
    schema: Record<string, any>;
  };
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string | ChatMessagePart[];
  reasoning?: string;
  images?: string[]; // Direct image base64/URL support
  tool_calls?: GatewayToolCall[];
  modelId?: string;
  timestamp?: number;
  status?: 'sending' | 'streaming' | 'done' | 'error';
  error?: string;
}

export interface ChatRequestOptions {
  providerId?: string;
  modelId: string;
  fallbackModelId?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number; // Request timeout in ms (default 30000)
  reasoningEnabled?: boolean; // User toggle for internal monologue / reasoning
  responseFormat?: ResponseFormatOption; // Guaranteed JSON Schema / Object format
  tools?: GatewayToolDefinition[]; // Agent Function / Tool calling
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  seed?: number;
  minP?: number;
  topK?: number;
  repeatPenalty?: number;
  keepAlive?: number | string;
  cache?: boolean; // In-memory response caching
  signal?: AbortSignal;
  onChunk?: (chunk: string, reasoningChunk?: string) => void;
  onFallback?: (fallbackModelId: string, reason: string) => void;
  onKeyRotate?: (providerId: string, keyIndex: number) => void;
  onRetry?: (attempt: number, error: string, delayMs: number) => void;
}

export interface ChatResponse {
  content: string;
  reasoning?: string;
  toolCalls?: GatewayToolCall[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
  providerId: string;
  modelId: string;
  cached?: boolean;
  fallbackUsed?: boolean;
  primaryModelId?: string;
  retriesAttempted?: number;
  timestamp: number;
}

export interface EmbeddingRequestOptions {
  modelId: string;
  input: string | string[];
  providerId?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage: {
    totalTokens: number;
  };
  modelId: string;
}

export interface RunningModelProcess {
  id: string;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  contextSize: number;
  loadedAt: number;
  expiresAt: number | null;
  keepAliveSeconds: number;
  activeRequests: number;
  queuedRequests: number;
}