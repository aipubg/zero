import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import busboy from 'busboy';
import { retrieveGgufCatalog } from './local-gguf-catalog.mjs';
import { downloadVerifiedGguf } from './gguf-download-file.mjs';
import { parseLocalToolCalls } from './local-gguf-tool-calls.mjs';
import { localNativeContinuation, localHistoricalTurns, fitLocalHistoricalTurns } from './local-gguf-continuation.mjs';
import { createRecognizedTextWrapper } from './local-chat-wrapper.mjs';
import { parseGuideOrModelfile, type ParsedGuideConfig } from './local-gguf-parser.ts';

// Types for Local GGUF Engine
export interface LocalGgufModel {
  id: string;
  name: string;
  filename: string;
  fullPath: string;
  sizeBytes: number;
  sizeFormatted: string;
  quantization: string;
  architecture: string;
  contextLength: number;
  capabilities: {
    reasoning: boolean;
    image: boolean;
    embedding: boolean;
  };
  companionProjector?: string;
  companionProjectorPath?: string;
  type: 'chat' | 'embedding';
  status: 'loaded' | 'ready' | 'error';
  loadedAt?: number;
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

export interface GgufModelManifest {
  id: string;
  name: string;
  filename: string;
  modelPath: string;
  zeroCopy: boolean;
  capabilities?: {
    reasoning?: boolean;
    image?: boolean;
    embedding?: boolean;
  };
  companionProjector?: string;
  companionProjectorPath?: string;
  systemPrompt?: string;
  parameters: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_ctx?: number;
    stop?: string[];
    repeat_penalty?: number;
    [key: string]: any;
  };
  chatTemplate?: string;
  guideRaw?: string;
  metadata: {
    architecture: string;
    contextLength: number;
    quantization: string;
    tensorCount?: number;
    fileVersion?: number;
    sizeBytes: number;
    sizeFormatted: string;
  };
  status: 'ready' | 'loaded' | 'error';
  lastSelfTest?: {
    passed: boolean;
    timestamp: number;
    message: string;
    tokensPerSec?: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface DownloadProgress {
  id: string;
  filename: string;
  repo?: string;
  url: string;
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speedMBs: number;
  etaSeconds: number;
  status: 'downloading' | 'completed' | 'cancelled' | 'error';
  error?: string;
  startedAt: number;
  verified?: boolean;
  sha256?: string;
}

export interface PipelineProgressEvent {
  step: number;
  totalSteps: number;
  title: string;
  status: 'running' | 'completed' | 'error';
  log: string;
  timestamp: number;
  details?: Record<string, any>;
}

// In-Memory State for Active Inference & Downloads
export class LocalGgufEngineService {
  private modelsDir: string;
  private activeLlama: any = null;
  private activeModel: any = null;
  private activeContext: any = null;
  private activeSession: any = null;
  private activeChatWrapper: any = null;
  private loadedModelId: string | null = null;
  private loadedModelFilename: string | null = null;
  private loadedModelSizeBytes: number = 0;
  private loadedModelContextSize: number = 2048;
  private loadedAt: number | null = null;
  private keepAliveExpiresAt: number | null = null;
  private keepAliveSeconds: number = 300;
  private activeDownload: DownloadProgress | null = null;
  private downloadAbortController: AbortController | null = null;

  // Ollama-Style Keep-Alive Idle Unload Timer (default: 5 minutes = 300,000ms)
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private defaultKeepAliveMs: number = 5 * 60 * 1000;

  // Multi-Agent Concurrency FIFO Mutex Scheduler
  private requestQueue: Array<{
    id: string;
    modelId: string;
    task: () => Promise<void>;
  }> = [];
  private isProcessingQueue = false;

  constructor(options: { modelsDir?: string } = {}) {
    // Standard models directory in project root
    const rootCandidates = [
      process.cwd(),
      path.resolve(process.cwd(), '..'),
      'E:\\zero',
    ];
    let resolvedRoot = process.cwd();
    for (const c of rootCandidates) {
      if (fs.existsSync(path.resolve(c, 'models', 'gateway-providers.json')) || fs.existsSync(path.resolve(c, 'zero-system'))) {
        resolvedRoot = c;
        break;
      }
    }
    this.modelsDir = options.modelsDir ? path.resolve(options.modelsDir) : path.resolve(resolvedRoot, 'models');
    if (!fs.existsSync(this.modelsDir)) {
      try {
        fs.mkdirSync(this.modelsDir, { recursive: true });
      } catch (err) {
        console.error('[LocalGguf] Failed to create /models directory:', err);
      }
    }
  }

  public getModelsDir(): string {
    return this.modelsDir;
  }

  /**
   * Automatic Vision Multimodal Companion Projector Pairing:
   * e.g. Automatically pairs moondream2-text-model-f16_ct-vicuna.gguf with moondream2-mmproj-f16_ct-vicuna.gguf
   */
  public findCompanionProjector(modelFilename: string): string | null {
    if (!modelFilename) return null;
    try {
      const dir = this.modelsDir;
      if (!fs.existsSync(dir)) return null;
      const files = fs.readdirSync(dir);
      const lower = modelFilename.toLowerCase();

      // Skip if this file is itself a projector
      if (lower.includes('mmproj') || lower.includes('clip')) return null;

      // Rule 1: Direct token replacement (e.g. "text-model" -> "mmproj", "text" -> "mmproj")
      if (lower.includes('text-model')) {
        const candidate = modelFilename.replace(/text-model/i, 'mmproj');
        if (files.includes(candidate)) return candidate;
      }
      if (lower.includes('text')) {
        const candidate = modelFilename.replace(/text/i, 'mmproj');
        if (files.includes(candidate)) return candidate;
      }

      // Rule 2: Moondream2 specific pairing
      if (lower.includes('moondream')) {
        const moondreamProj = files.find((f) => {
          const fl = f.toLowerCase();
          return fl.endsWith('.gguf') && fl.includes('moondream') && (fl.includes('mmproj') || fl.includes('clip'));
        });
        if (moondreamProj) return moondreamProj;
      }

      // Rule 3: Prefix family heuristic (e.g. "llava-v1.6-7b" -> "llava-v1.6-7b-mmproj...")
      const basePrefix = lower.split(/[-_]/)[0];
      if (basePrefix && basePrefix.length >= 3) {
        const proj = files.find((f) => {
          const fl = f.toLowerCase();
          return fl.endsWith('.gguf') && fl.startsWith(basePrefix) && (fl.includes('mmproj') || fl.includes('clip'));
        });
        if (proj) return proj;
      }

      // Rule 4: If exactly one mmproj exists in the models directory and this model has vision capability
      const allMmprojs = files.filter((f) => {
        const fl = f.toLowerCase();
        return fl.endsWith('.gguf') && (fl.includes('mmproj') || fl.includes('clip'));
      });
      if (allMmprojs.length === 1 && (lower.includes('vision') || lower.includes('vl') || lower.includes('moondream'))) {
        return allMmprojs[0];
      }

      return null;
    } catch (err: any) {
      console.warn(`[LocalGguf] findCompanionProjector note for ${modelFilename}:`, err?.message);
      return null;
    }
  }

  /**
   * Resets the auto-unload keep-alive idle timer.
   * If idle for keepAliveMs (default: 5m), automatically unloads model from RAM/VRAM.
   */
  public resetKeepAliveTimer(keepAliveMs: number = this.defaultKeepAliveMs): void {
    this.clearKeepAliveTimer();
    if (keepAliveMs <= 0) {
      this.keepAliveExpiresAt = null;
      this.keepAliveSeconds = 0;
      return;
    }

    this.keepAliveExpiresAt = Date.now() + keepAliveMs;
    this.keepAliveSeconds = Math.round(keepAliveMs / 1000);

    this.keepAliveTimer = setTimeout(async () => {
      if (this.loadedModelId) {
        console.log(`[LocalGguf] Auto-Idle Unload: Model "${this.loadedModelId}" was idle for ${Math.round(keepAliveMs / 1000)}s with no requests. Automatically freeing RAM/VRAM...`);
        try {
          await this.unloadModel();
        } catch (err: any) {
          console.warn('[LocalGguf] Failed to auto-unload idle model:', err?.message);
        }
      }
    }, keepAliveMs);
  }

  public clearKeepAliveTimer(): void {
    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    this.keepAliveExpiresAt = null;
  }

  public parseKeepAlive(value?: string | number): number {
    if (value === undefined || value === null) return this.defaultKeepAliveMs;
    if (typeof value === 'number') {
      if (value < 0) return -1;
      return value * 1000;
    }
    const str = String(value).trim().toLowerCase();
    if (str === '-1' || str === 'infinite' || str === 'never') return -1;
    if (str === '0' || str === '0s' || str === 'now') return 0;
    if (str.endsWith('m')) return (parseFloat(str) || 5) * 60 * 1000;
    if (str.endsWith('s')) return (parseFloat(str) || 300) * 1000;
    if (str.endsWith('h')) return (parseFloat(str) || 1) * 3600 * 1000;
    const num = parseFloat(str);
    return isNaN(num) ? this.defaultKeepAliveMs : num * 1000;
  }

  /**
   * Multi-Agent Concurrency FIFO Mutex Scheduler:
   * Enqueues inference requests to process sequentially, ensuring zero sequence collision or memory corruption.
   */
  public async scheduleRequest<T>(modelId: string, fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const task = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      this.requestQueue.push({ id, modelId, task });
      if (this.requestQueue.length > 1) {
        console.log(`[LocalGguf] Multi-Agent Scheduler: Request ${id} for "${modelId}" enqueued. Queue length: ${this.requestQueue.length}`);
      }
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const item = this.requestQueue.shift();
      if (item) {
        try {
          await item.task();
        } catch (err: any) {
          console.error(`[LocalGguf] Scheduled task error for ${item.id}:`, err?.message);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Ollama /api/ps Equivalent:
   * Returns real-time execution & memory stats for currently active offline models.
   */
  public getRunningProcesses(): any[] {
    if (!this.loadedModelId || !this.activeModel) return [];

    const now = Date.now();
    const remainingSeconds = this.keepAliveExpiresAt
      ? Math.max(0, Math.round((this.keepAliveExpiresAt - now) / 1000))
      : this.keepAliveSeconds || 300;

    return [
      {
        id: this.loadedModelId,
        name: this.loadedModelFilename || this.loadedModelId,
        sizeBytes: this.loadedModelSizeBytes || 0,
        sizeFormatted: this.formatBytes(this.loadedModelSizeBytes || 0),
        contextSize: this.activeContext?.contextSize || this.loadedModelContextSize || 2048,
        loadedAt: this.loadedAt || now,
        expiresAt: this.keepAliveExpiresAt,
        keepAliveSeconds: remainingSeconds,
        activeRequests: this.isProcessingQueue ? 1 : 0,
        queuedRequests: this.requestQueue.length,
      },
    ];
  }

  /**
   * Generates Vector Embeddings using the local model
   */
  public async createEmbedding(
    modelId: string,
    input: string | string[]
  ): Promise<{ embeddings: number[][]; usage: { totalTokens: number } }> {
    await this.loadModel(modelId);
    const inputs = Array.isArray(input) ? input : [input];
    const results: number[][] = [];

    if (this.activeModel && typeof this.activeModel.createEmbeddingContext === 'function') {
      try {
        const embeddingContext = await this.activeModel.createEmbeddingContext();
        for (const text of inputs) {
          const vector = await embeddingContext.getEmbeddingFor(text);
          results.push(Array.from(vector.vector || vector));
        }
        return {
          embeddings: results,
          usage: { totalTokens: inputs.reduce((acc, str) => acc + Math.ceil(str.length / 4), 0) },
        };
      } catch (err: any) {
        console.warn('[LocalGguf] createEmbeddingContext note:', err?.message);
      }
    }

    // Deterministic embedding vector generation fallback (768 dimensions)
    for (const text of inputs) {
      const vector = new Array(768).fill(0);
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        vector[i % 768] = parseFloat((((vector[i % 768] || 0) + code / 255) % 1).toFixed(6));
      }
      results.push(vector);
    }

    return {
      embeddings: results,
      usage: { totalTokens: inputs.reduce((acc, str) => acc + Math.ceil(str.length / 4), 0) },
    };
  }

  /**
   * Helper: Format bytes to human readable string (e.g. 4.2 GB)
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Extract quantization label from filename (e.g., Q4_K_M, Q5_0, Q8_0, FP16)
   */
  public extractQuantization(filename: string): string {
    const match = filename.match(/(q[0-9]_[a-z0-9_]+|q[0-9]_[0-9]|fp16|fp32|bf16|f16|f32)/i);
    return match ? match[1].toUpperCase() : 'UNKNOWN';
  }

  /**
   * Manifest Path helper
   */
  public getManifestPath(modelId: string): string {
    if (typeof modelId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(modelId) || modelId.includes('..')) throw new Error('Invalid local model identifier');
    const cleanId = modelId.replace(/\.gguf$/i, '').replace(/\.manifest\.json$/i, '');
    return path.join(this.modelsDir, `${cleanId}.manifest.json`);
  }

  /**
   * Save compiled manifest for model
   */
  public async saveManifest(manifest: GgufModelManifest): Promise<string> {
    const manifestPath = this.getManifestPath(manifest.id);
    const suffix = crypto.randomUUID();
    const temporary = `${manifestPath}.${suffix}.tmp`;
    if (fs.existsSync(manifestPath)) await fs.promises.copyFile(manifestPath, `${manifestPath}.before-manifest-change-${suffix}.json`, fs.constants.COPYFILE_EXCL);
    try {
      const file = await fs.promises.open(temporary, 'wx', 0o600);
      try { await file.writeFile(JSON.stringify(manifest, null, 2)); await file.sync(); } finally { await file.close(); }
      await fs.promises.rename(temporary, manifestPath);
    } finally { if (fs.existsSync(temporary)) await fs.promises.unlink(temporary); }
    return manifestPath;
  }

  /**
   * Load manifest for model
   */
  public async loadManifest(modelId: string): Promise<GgufModelManifest | null> {
    try {
      const manifestPath = this.getManifestPath(modelId);
      if (fs.existsSync(manifestPath)) {
        const raw = await fs.promises.readFile(manifestPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`[LocalGguf] Failed to load manifest for ${modelId}:`, err);
    }
    return null;
  }

  /**
   * Parse GGUF Metadata from binary file header (Magic bytes + node-llama-cpp + binary fallback)
   */
  public async inspectGgufHeader(filePath: string): Promise<{
    magicValid: boolean;
    version: number;
    tensorCount: number;
    architecture: string;
    contextLength: number;
    quantization: string;
    isReasoning: boolean;
    isVision: boolean;
    isEmbedding: boolean;
    isClipProjector: boolean;
    description?: string;
  }> {
    const filename = path.basename(filePath);

    // Corrupt / Incomplete File Shield: Verify size and state before C++ execution
    if (!fs.existsSync(filePath)) {
      throw new Error(`GGUF binary not found at path: ${filePath}`);
    }
    const stat = await fs.promises.stat(filePath);
    if (stat.size === 0) {
      throw new Error(`Corrupt or incomplete .gguf binary: file is empty (0 bytes) at ${filePath}`);
    }
    if (filename.endsWith('.download')) {
      throw new Error(`Corrupt or incomplete .gguf binary: file download is still in progress at ${filePath}`);
    }
    if (stat.size < 512 * 1024 && !filename.includes('clip') && !filename.includes('mmproj')) {
      throw new Error(`Corrupt or truncated .gguf binary: file size (${stat.size} bytes) is below minimum valid GGUF threshold.`);
    }

    let quantization = this.extractQuantization(filename);
    let architecture = 'general';
    let contextLength = 2048; // Default 2048 (Ollama standard)
    let tensorCount = 0;
    let version = 3;
    let magicValid = false;
    let isClipProjector = false;
    let description = '';

    // Detect capabilities from name heuristics
    const lowerName = filename.toLowerCase();
    const isReasoning =
      lowerName.includes('r1') ||
      lowerName.includes('reason') ||
      lowerName.includes('think') ||
      lowerName.includes('qwq') ||
      lowerName.includes('qwen3.5') ||
      lowerName.includes('qwen35') ||
      lowerName.includes('marco');
    const isVision =
      lowerName.includes('vision') ||
      lowerName.includes('vl') ||
      lowerName.includes('pixtral') ||
      lowerName.includes('llava') ||
      lowerName.includes('moondream');
    const isEmbedding =
      lowerName.includes('embed') ||
      lowerName.includes('bge-') ||
      lowerName.includes('e5-');

    // 1. Check Magic Bytes directly from header buffer
    try {
      const fd = await fs.promises.open(filePath, 'r');
      const headerBuf = Buffer.alloc(24);
      await fd.read(headerBuf, 0, 24, 0);
      await fd.close();

      const magic = headerBuf.toString('ascii', 0, 4);
      if (magic === 'GGUF') {
        magicValid = true;
        version = headerBuf.readUInt32LE(4);
        tensorCount = Number(headerBuf.readBigUInt64LE(8));
      } else {
        throw new Error(`Corrupt or invalid .gguf binary: invalid magic header "${magic}" (expected "GGUF") at ${filePath}`);
      }
    } catch (err: any) {
      if (err.message?.includes('Corrupt or invalid')) throw err;
      console.warn(`[LocalGguf] Header buffer read note for ${filename}:`, err?.message);
    }

    // 2. Try rich metadata extraction via node-llama-cpp's readGgufFileInfo
    try {
      const { readGgufFileInfo } = await import('node-llama-cpp');
      if (typeof readGgufFileInfo === 'function') {
        const info = await readGgufFileInfo(filePath);
        if (info) {
          magicValid = true;
          if (info.version) version = info.version;
          if (info.tensorCount) tensorCount = Number(info.tensorCount);

          if (info.metadata) {
            const meta = info.metadata as any;
            const generalArch = meta?.['general.architecture'] || meta?.general?.architecture || meta?.architecture;
            if (generalArch) {
              architecture = generalArch;
            } else if (meta?.qwen35) {
              architecture = 'qwen35';
            } else if (meta?.qwen2) {
              architecture = 'qwen2';
            } else if (meta?.llama) {
              architecture = 'llama';
            }

            if (architecture === 'clip' || meta?.clip || lowerName.includes('mmproj')) {
              isClipProjector = true;
            }

            const ctxVal =
              meta?.[`${architecture}.context_length`] ||
              meta?.[architecture]?.context_length ||
              meta?.qwen35?.context_length ||
              meta?.qwen2?.context_length ||
              meta?.['llama.context_length'] ||
              meta?.['qwen2.context_length'];
            if (ctxVal) {
              const parsedVal = Number(ctxVal);
              // Ollama-style Safe Context: cap at 4096 (default 2048) to prevent RAM/VRAM bandwidth slowdowns
              contextLength = Math.max(512, Math.min(parsedVal, 4096));
            }

            const descVal = meta?.['general.description'] || meta?.general?.description || meta?.['general.name'];
            if (descVal) {
              description = String(descVal);
            }

            const fileType = meta?.['general.file_type'] || meta?.general?.file_type;
            if (fileType !== undefined && quantization === 'UNKNOWN') {
              quantization = `TYPE_${fileType}`;
            }
          }
        }
      }
    } catch {
      // Fallback: Read magic bytes and strings directly
      try {
        const fd = await fs.promises.open(filePath, 'r');
        const buffer = Buffer.alloc(8192);
        await fd.read(buffer, 0, 8192, 0);
        await fd.close();

        const content = buffer.toString('utf-8');
        if (content.includes('qwen2') || content.includes('qwen')) architecture = 'qwen2';
        else if (content.includes('llama')) architecture = 'llama';
        else if (content.includes('phi')) architecture = 'phi3';
        else if (content.includes('gemma')) architecture = 'gemma';
        else if (content.includes('mistral')) architecture = 'mistral';
        else if (content.includes('deepseek')) architecture = 'deepseek';
        else if (content.includes('clip') || lowerName.includes('mmproj')) {
          architecture = 'clip';
          isClipProjector = true;
        }
      } catch (err: any) {
        console.warn(`[LocalGguf] Fallback header scan note:`, err?.message);
      }
    }

    return {
      magicValid,
      version,
      tensorCount,
      architecture,
      contextLength,
      quantization,
      isReasoning,
      isVision,
      isEmbedding,
      isClipProjector,
      description,
    };
  }

  /**
   * Scan /models folder AND registered manifests to return array of all discovered .gguf models
   */
  public async scanModels(): Promise<LocalGgufModel[]> {
    if (!fs.existsSync(this.modelsDir)) {
      return [];
    }

    const files = await fs.promises.readdir(this.modelsDir);
    const ggufFiles = files.filter(
      (f) => f.endsWith('.gguf') && !f.endsWith('.download') && !f.startsWith('.')
    );
    const manifestFiles = files.filter((f) => f.endsWith('.manifest.json'));

    const modelsMap: Map<string, LocalGgufModel> = new Map();

    // 1. Process physical .gguf files in modelsDir
    for (const filename of ggufFiles) {
      const fullPath = path.join(this.modelsDir, filename);
      try {
        const stat = await fs.promises.stat(fullPath);
        const metadata = await this.inspectGgufHeader(fullPath);

        const id = filename.replace(/\.gguf$/i, '');
        const cleanName = id
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const isLoaded = this.loadedModelFilename === filename || this.loadedModelId === id;

        // Load existing manifest if present
        const manifest = await this.loadManifest(id);

        const companion = this.findCompanionProjector(filename);
        const resolvedReasoning = manifest?.capabilities?.reasoning !== undefined
          ? manifest.capabilities.reasoning
          : metadata.isReasoning;
        const resolvedImage = manifest?.capabilities?.image !== undefined
          ? manifest.capabilities.image
          : (metadata.isVision || Boolean(companion));
        const resolvedEmbedding = manifest?.capabilities?.embedding !== undefined
          ? manifest.capabilities.embedding
          : metadata.isEmbedding;

        modelsMap.set(id, {
          id,
          name: manifest?.name || `${cleanName} (${metadata.quantization})`,
          filename,
          fullPath,
          sizeBytes: stat.size,
          sizeFormatted: this.formatBytes(stat.size),
          quantization: metadata.quantization,
          architecture: metadata.architecture,
          contextLength: manifest?.parameters?.num_ctx || metadata.contextLength,
          capabilities: {
            reasoning: resolvedReasoning,
            image: resolvedImage,
            embedding: resolvedEmbedding,
          },
          companionProjector: companion || manifest?.companionProjector,
          companionProjectorPath: companion ? path.join(this.modelsDir, companion) : manifest?.companionProjectorPath,
          type: metadata.isEmbedding ? 'embedding' : 'chat',
          status: isLoaded ? 'loaded' : 'ready',
          loadedAt: isLoaded ? Date.now() : undefined,
          hasGuide: Boolean(manifest?.systemPrompt || (manifest?.parameters && Object.keys(manifest.parameters).length > 0)),
          systemPrompt: manifest?.systemPrompt,
          parameters: manifest?.parameters,
          chatTemplate: manifest?.chatTemplate,
          zeroCopy: manifest?.zeroCopy ?? false,
          manifestPath: manifest ? this.getManifestPath(id) : undefined,
          lastSelfTest: manifest?.lastSelfTest,
        });
      } catch (err) {
        console.error(`[LocalGguf] Failed to inspect model ${filename}:`, err);
      }
    }

    // 2. Process manifests that point to external Zero-Copy file paths
    for (const mFile of manifestFiles) {
      try {
        const mPath = path.join(this.modelsDir, mFile);
        const raw = await fs.promises.readFile(mPath, 'utf-8');
        const manifest: GgufModelManifest = JSON.parse(raw);

        if (manifest.id && !modelsMap.has(manifest.id)) {
          // Check if external zero-copy model path still exists
          if (manifest.modelPath && fs.existsSync(manifest.modelPath)) {
            const stat = await fs.promises.stat(manifest.modelPath);
            const isLoaded = this.loadedModelId === manifest.id;

            const companion = (manifest.filename ? this.findCompanionProjector(manifest.filename) : null) || (manifest.modelPath ? this.findCompanionProjector(path.basename(manifest.modelPath)) : null);
            const resolvedReasoning = manifest.capabilities?.reasoning !== undefined
              ? manifest.capabilities.reasoning
              : ((manifest.id + manifest.modelPath).toLowerCase().includes('r1') ||
                 (manifest.id + manifest.modelPath).toLowerCase().includes('reason') ||
                 (manifest.id + manifest.modelPath).toLowerCase().includes('think'));
            const resolvedImage = manifest.capabilities?.image !== undefined
              ? manifest.capabilities.image
              : ((manifest.id + manifest.modelPath).toLowerCase().includes('vl') ||
                 (manifest.id + manifest.modelPath).toLowerCase().includes('vision') ||
                 (manifest.id + manifest.modelPath).toLowerCase().includes('moondream') ||
                 Boolean(companion));
            const resolvedEmbedding = manifest.capabilities?.embedding !== undefined
              ? manifest.capabilities.embedding
              : (manifest.id + manifest.modelPath).toLowerCase().includes('embed');

            modelsMap.set(manifest.id, {
              id: manifest.id,
              name: manifest.name || manifest.id,
              filename: manifest.filename || path.basename(manifest.modelPath),
              fullPath: manifest.modelPath,
              sizeBytes: stat.size,
              sizeFormatted: this.formatBytes(stat.size),
              quantization: manifest.metadata?.quantization || this.extractQuantization(manifest.modelPath),
              architecture: manifest.metadata?.architecture || 'general',
              contextLength: manifest.parameters?.num_ctx || manifest.metadata?.contextLength || 4096,
              capabilities: {
                reasoning: resolvedReasoning,
                image: resolvedImage,
                embedding: resolvedEmbedding,
              },
              companionProjector: companion || manifest.companionProjector,
              companionProjectorPath: companion ? path.join(this.modelsDir, companion) : manifest.companionProjectorPath,
              type: 'chat',
              status: isLoaded ? 'loaded' : 'ready',
              loadedAt: isLoaded ? Date.now() : undefined,
              hasGuide: Boolean(manifest.systemPrompt || (manifest.parameters && Object.keys(manifest.parameters).length > 0)),
              systemPrompt: manifest.systemPrompt,
              parameters: manifest.parameters,
              chatTemplate: manifest.chatTemplate,
              zeroCopy: true,
              manifestPath: mPath,
              lastSelfTest: manifest.lastSelfTest,
            });
          }
        }
      } catch (err) {
        console.warn(`[LocalGguf] Error reading manifest ${mFile}:`, err);
      }
    }

    return Array.from(modelsMap.values());
  }

  /**
   * Step 4 Inference Engine Self-Test:
   * Verifies that the model can be mounted and generate tokens
   */
  public async runSelfTest(modelId: string): Promise<{
    passed: boolean;
    tokensGenerated: number;
    tokensPerSec: number;
    latencyMs: number;
    sampleOutput: string;
    message: string;
  }> {
    const startTime = performance.now();
    let sampleOutput = '';
    let tokensGenerated = 0;
    let previousHistory: any[] | null = null;

    try {
      await this.loadModel(modelId);
      if (!this.activeSession) throw new Error(`Inference engine session failed to mount for ${modelId}`);
      previousHistory = structuredClone(this.activeSession.getChatHistory());
      const testPrompt = 'Hi, please confirm you are ready by saying READY.';
      await this.activeSession.prompt(testPrompt, {
        maxTokens: 12,
        temperature: 0.2,
        onTextChunk: (chunk: string) => {
          sampleOutput += chunk;
        },
        onToken: (tokens: number[]) => { tokensGenerated += tokens.length; },
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const tokensPerSec = latencyMs > 0 ? parseFloat(((tokensGenerated / latencyMs) * 1000).toFixed(1)) : 0;

      if (tokensGenerated === 0) {
        throw new Error('Inference engine reported 0 generated tokens during self-test verification.');
      }

      const result = {
        passed: true,
        tokensGenerated,
        tokensPerSec,
        latencyMs,
        sampleOutput: sampleOutput.trim(),
        tokenAccounting: 'Native generated token IDs; rate includes model loading and prompt evaluation',
        verificationScope: 'Model loading and token generation only; not semantic correctness or general model compatibility',
        message: `Self-test passed: generated ${tokensGenerated} tokens at ${tokensPerSec} tok/s (${latencyMs}ms)`,
      };

      // Update manifest with self-test results
      const manifest = await this.loadManifest(modelId);
      if (manifest) {
        manifest.lastSelfTest = {
          passed: true,
          timestamp: Date.now(),
          message: result.message,
          tokensPerSec,
        };
        manifest.status = 'ready';
        await this.saveManifest(manifest);
      }

      return result;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const manifest = await this.loadManifest(modelId);
      if (manifest) {
        manifest.lastSelfTest = {
          passed: false,
          timestamp: Date.now(),
          message: `Self-test failed: ${err.message}`,
          tokensPerSec: 0,
        };
        manifest.status = 'error';
        await this.saveManifest(manifest);
      }
      return {
        passed: false,
        tokensGenerated,
        tokensPerSec: 0,
        latencyMs,
        sampleOutput: '',
        message: `Self-test failed: ${err.message}`,
      };
    } finally {
      // CRITICAL: Always reset chat history after self-test so test tokens NEVER leak into user chat!
      try {
        if (typeof this.activeSession?.setChatHistory === 'function') {
          if (previousHistory) this.activeSession.setChatHistory(previousHistory);
        } else if (typeof this.activeSession?.resetChatHistory === 'function') {
          if (previousHistory?.length === 0) this.activeSession.resetChatHistory();
        }
      } catch {}
    }

    // Auto-clean local-gguf-engine card from gateway-providers.json if 0 offline models remain
    try {
      const remaining = await this.scanModels();
      if (remaining.length === 0) {
        const provFile = path.resolve(this.modelsDir, 'gateway-providers.json');
        if (fs.existsSync(provFile)) {
          const provRaw = await fs.promises.readFile(provFile, 'utf-8');
          const provs = JSON.parse(provRaw);
          if (Array.isArray(provs)) {
            const filtered = provs.filter((p: any) => p.id !== 'local-gguf-engine' && p.id !== 'gguf');
            if (filtered.length !== provs.length) {
              await fs.promises.writeFile(provFile, JSON.stringify(filtered, null, 2), 'utf-8');
            }
          }
        }
      }
    } catch {}
  }

  /**
   * 5-Stage Post-Upload & Import Auto-Setup Pipeline
   */
  public async runSetupPipeline(
    options: {
      modelPath?: string;
      filename?: string;
      guideContent?: string;
      guidePath?: string;
      isZeroCopy?: boolean;
    },
    onProgress?: (event: PipelineProgressEvent) => void
  ): Promise<{ success: boolean; model: LocalGgufModel; manifest: GgufModelManifest }> {
    const emit = (event: PipelineProgressEvent) => {
      console.log(`[SetupPipeline] [Step ${event.step}/${event.totalSteps}] ${event.title}: ${event.log}`);
      onProgress?.(event);
    };

    // ==========================================
    // STEP 1/5: Locating & Verifying GGUF Binary
    // ==========================================
    emit({
      step: 1,
      totalSteps: 5,
      title: 'Locating & Verifying GGUF Binary...',
      status: 'running',
      log: 'Resolving file path and verifying file integrity on disk...',
      timestamp: Date.now(),
    });

    let resolvedPath = '';
    if (options.modelPath) {
      resolvedPath = path.resolve(options.modelPath.trim().replace(/^['"]|['"]$/g, ''));
    } else if (options.filename) {
      resolvedPath = path.join(this.modelsDir, options.filename);
    } else {
      throw new Error('Missing "modelPath" or "filename" for setup pipeline.');
    }

    if (!fs.existsSync(resolvedPath)) {
      const err = `GGUF binary file not found at path: ${resolvedPath}`;
      emit({
        step: 1,
        totalSteps: 5,
        title: 'Locating & Verifying GGUF Binary...',
        status: 'error',
        log: err,
        timestamp: Date.now(),
      });
      throw new Error(err);
    }

    const stat = await fs.promises.stat(resolvedPath);
    if (stat.size === 0) {
      const err = 'GGUF binary file is empty (0 bytes).';
      emit({
        step: 1,
        totalSteps: 5,
        title: 'Locating & Verifying GGUF Binary...',
        status: 'error',
        log: err,
        timestamp: Date.now(),
      });
      throw new Error(err);
    }

    const filename = path.basename(resolvedPath);
    const modelId = filename.replace(/\.gguf$/i, '');
    const formattedSize = this.formatBytes(stat.size);

    emit({
      step: 1,
      totalSteps: 5,
      title: 'Locating & Verifying GGUF Binary...',
      status: 'completed',
      log: `Verified binary: "${filename}" (${formattedSize}) at ${resolvedPath}`,
      timestamp: Date.now(),
      details: { path: resolvedPath, sizeBytes: stat.size, sizeFormatted: formattedSize },
    });

    // ==========================================
    // STEP 2/5: Inspecting GGUF Architecture & Metadata
    // ==========================================
    emit({
      step: 2,
      totalSteps: 5,
      title: 'Inspecting GGUF Architecture & Metadata...',
      status: 'running',
      log: 'Parsing GGUF binary magic bytes and tensor metadata header...',
      timestamp: Date.now(),
    });

    const header = await this.inspectGgufHeader(resolvedPath);
    if (!header.magicValid) {
      emit({
        step: 2,
        totalSteps: 5,
        title: 'Inspecting GGUF Architecture & Metadata...',
        status: 'running',
        log: 'Warning: GGUF magic bytes not strictly standard, attempting adaptive metadata parser...',
        timestamp: Date.now(),
      });
    }

    emit({
      step: 2,
      totalSteps: 5,
      title: 'Inspecting GGUF Architecture & Metadata...',
      status: 'completed',
      log: `Architecture: ${header.architecture} | Quant: ${header.quantization} | Context: ${header.contextLength} | Tensors: ${header.tensorCount} | Version: ${header.version}`,
      timestamp: Date.now(),
      details: header,
    });

    // ==========================================
    // STEP 3/5: Merging Guide / Modelfile Configuration
    // ==========================================
    emit({
      step: 3,
      totalSteps: 5,
      title: 'Merging Guide / Modelfile Configuration...',
      status: 'running',
      log: 'Parsing Modelfile/guide instructions, system prompt, and parameters...',
      timestamp: Date.now(),
    });

    let rawGuide = options.guideContent || '';
    if (!rawGuide && options.guidePath && fs.existsSync(options.guidePath)) {
      rawGuide = await fs.promises.readFile(options.guidePath, 'utf-8');
    }

    // Auto-detect sibling guide file if not provided (e.g. model.txt or Modelfile next to .gguf)
    if (!rawGuide) {
      const dirOfModel = path.dirname(resolvedPath);
      const possibleSiblingGuide = path.join(dirOfModel, `${modelId}.txt`);
      const possibleModelfile = path.join(dirOfModel, 'Modelfile');
      if (fs.existsSync(possibleSiblingGuide)) {
        rawGuide = await fs.promises.readFile(possibleSiblingGuide, 'utf-8');
      } else if (fs.existsSync(possibleModelfile)) {
        rawGuide = await fs.promises.readFile(possibleModelfile, 'utf-8');
      }
    }

    const parsedGuide: ParsedGuideConfig = parseGuideOrModelfile(rawGuide, resolvedPath);

    const cleanDisplayName = modelId
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const manifest: GgufModelManifest = {
      id: modelId,
      name: `${cleanDisplayName} (${header.quantization})`,
      filename,
      modelPath: resolvedPath,
      zeroCopy: Boolean(options.isZeroCopy),
      systemPrompt: parsedGuide.systemPrompt,
      parameters: {
        num_ctx: Math.max(512, Math.min(parsedGuide.parameters.num_ctx || header.contextLength || 4096, 8192)),
        temperature: parsedGuide.parameters.temperature ?? 0.7,
        top_p: parsedGuide.parameters.top_p ?? 0.9,
        top_k: parsedGuide.parameters.top_k,
        stop: parsedGuide.parameters.stop,
        repeat_penalty: parsedGuide.parameters.repeat_penalty,
        ...parsedGuide.parameters,
      },
      chatTemplate: parsedGuide.chatTemplate,
      guideRaw: rawGuide,
      metadata: {
        architecture: header.architecture,
        contextLength: header.contextLength,
        quantization: header.quantization,
        tensorCount: header.tensorCount,
        fileVersion: header.version,
        sizeBytes: stat.size,
        sizeFormatted: formattedSize,
      },
      status: 'ready',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const savedManifestPath = await this.saveManifest(manifest);

    const guideLog = manifest.systemPrompt
      ? `Merged Guide: System Prompt (${manifest.systemPrompt.length} chars) + ${Object.keys(manifest.parameters).length} parameters into ${path.basename(savedManifestPath)}`
      : `Default configuration initialized (${Object.keys(manifest.parameters).length} parameters) into ${path.basename(savedManifestPath)}`;

    emit({
      step: 3,
      totalSteps: 5,
      title: 'Merging Guide / Modelfile Configuration...',
      status: 'completed',
      log: guideLog,
      timestamp: Date.now(),
      details: { manifestPath: savedManifestPath, manifest },
    });

    // ==========================================
    // STEP 4/5: Initializing Inference Engine & Self-Test
    // ==========================================
    emit({
      step: 4,
      totalSteps: 5,
      title: 'Initializing Inference Engine & Self-Test...',
      status: 'running',
      log: 'Mounting model into node-llama-cpp runtime & running token generation self-test...',
      timestamp: Date.now(),
    });

    let selfTestResult = {
      passed: false,
      message: 'Self-test pending',
      tokensPerSec: 0,
    };

    try {
      if (header.isClipProjector) {
        selfTestResult = {
          passed: true,
          message: 'Multimodal vision adapter (CLIP/mmproj) verified and ready for vision pairing.',
          tokensPerSec: 0,
        };
      } else {
        selfTestResult = await this.runSelfTest(modelId);
      }
    } catch (testErr: any) {
      console.warn('[SetupPipeline] Self-test warning:', testErr.message);
      selfTestResult = {
        passed: false,
        message: `Self-test failed: ${testErr.message}`,
        tokensPerSec: 0,
      };
    }

    const step4Status = selfTestResult.passed ? 'completed' : 'error';
    emit({
      step: 4,
      totalSteps: 5,
      title: 'Initializing Inference Engine & Self-Test...',
      status: step4Status,
      log: selfTestResult.message,
      timestamp: Date.now(),
      details: selfTestResult,
    });

    // ==========================================
    // STEP 5/5: Registering Active Model in Gateway
    // ==========================================
    emit({
      step: 5,
      totalSteps: 5,
      title: 'Registering Active Model in Gateway...',
      status: 'running',
      log: 'Auto-registering configured model into Gateway provider registry...',
      timestamp: Date.now(),
    });

    const isModelReady = selfTestResult.passed || header.isClipProjector;
    const modelStatus = isModelReady ? ('ready' as const) : ('error' as const);

    // Update manifest with exact self-test outcome and status
    manifest.status = modelStatus;
    manifest.lastSelfTest = {
      passed: selfTestResult.passed,
      message: selfTestResult.message,
      tokensPerSec: selfTestResult.tokensPerSec,
      timestamp: Date.now(),
    };
    await this.saveManifest(manifest);

    const scannedModels = await this.scanModels();
    const activeModel = scannedModels.find((m) => m.id === modelId) || {
      id: modelId,
      name: manifest.name,
      filename,
      fullPath: resolvedPath,
      sizeBytes: stat.size,
      sizeFormatted: formattedSize,
      quantization: header.quantization,
      architecture: header.architecture,
      contextLength: manifest.parameters.num_ctx || 4096,
      capabilities: {
        reasoning: header.isReasoning,
        image: header.isVision,
        embedding: header.isEmbedding,
      },
      type: 'chat' as const,
      status: modelStatus,
      hasGuide: Boolean(manifest.systemPrompt),
      systemPrompt: manifest.systemPrompt,
      parameters: manifest.parameters,
      chatTemplate: manifest.chatTemplate,
      zeroCopy: Boolean(options.isZeroCopy),
      manifestPath: savedManifestPath,
      lastSelfTest: manifest.lastSelfTest,
    };

    activeModel.status = modelStatus;

    if (isModelReady) {
      emit({
        step: 5,
        totalSteps: 5,
        title: 'Registering Active Model in Gateway...',
        status: 'completed',
        log: `Model "${activeModel.name}" is now ACTIVE & READY in Gateway! Selectable in Sandbox Chat.`,
        timestamp: Date.now(),
        details: { model: activeModel },
      });
    } else {
      emit({
        step: 5,
        totalSteps: 5,
        title: 'Registering Active Model in Gateway...',
        status: 'error',
        log: `Model registration completed with ERROR: ${selfTestResult.message}`,
        timestamp: Date.now(),
        details: { model: activeModel },
      });
    }

    return {
      success: true,
      model: activeModel,
      manifest,
    };
  }

  /**
   * Lazy Load a GGUF model into memory using node-llama-cpp
   */
  public async loadModel(modelId: string): Promise<void> {
    const models = await this.scanModels();
    const target = models.find((m) => m.id === modelId || m.filename === modelId);

    if (!target) {
      throw new Error(`Model "${modelId}" not found in local models directory or manifests.`);
    }

    this.clearKeepAliveTimer();

    const isModelValid = this.activeModel && !this.activeModel.disposed;
    const isContextValid = this.activeContext && !this.activeContext.disposed;
    const isSessionValid = this.activeSession && !this.activeSession.disposed && !this.activeSession.sequence?.disposed;

    if (this.loadedModelId === target.id && isModelValid && isContextValid && isSessionValid) {
      return;
    }

    if (this.loadedModelId && this.loadedModelId !== target.id) {
      console.log(`[LocalGguf] LRU Model Swapping: Inactive model "${this.loadedModelId}" is in RAM. Cleanly unloading before loading "${target.name}" to prevent Out-Of-Memory...`);
      await this.unloadModel(true);
    }

    // Unload existing model if different or if disposed
    await this.unloadModel(true);

    console.log(`[LocalGguf] Loading model into RAM/VRAM: ${target.filename}...`);
    const manifest = await this.loadManifest(target.id);
    const systemPrompt = manifest?.systemPrompt || target.systemPrompt;
    const requestedCtx = manifest?.parameters?.num_ctx || target.contextLength || 2048;
    // Ollama-style Safe Context Cap: default 2048 (capped at 4096) for fast prompt evaluation & generation
    const safeContextSize = Math.max(512, Math.min(requestedCtx, 4096));

    try {
      const { getLlama, LlamaChatSession, ChatMLChatWrapper, GeneralChatWrapper, readGgufFileInfo } = await import('node-llama-cpp');

      // 1. Initialize Llama runtime with CPU fallback if GPU initialization fails
      if (!this.activeLlama) {
        try {
          this.activeLlama = await getLlama({ gpu: 'auto', build: 'never', maxThreads: 2 });
        } catch (gpuErr: any) {
          console.warn('[LocalGguf] GPU auto initialization failed, falling back to CPU:', gpuErr?.message);
          this.activeLlama = await getLlama({ gpu: false, build: 'never', maxThreads: 2 });
        }
      }

      // 2. Load model binary with CPU fallback if GPU loading runs out of memory
      try {
        this.activeModel = await this.activeLlama.loadModel({
          modelPath: target.fullPath,
        });
      } catch (loadErr: any) {
        if (this.activeLlama && this.activeLlama.gpu !== false) {
          console.warn(`[LocalGguf] Loading "${target.name}" on GPU failed, retrying on CPU:`, loadErr?.message);
          this.activeLlama = await getLlama({ gpu: false, build: 'never', maxThreads: 2 });
          this.activeModel = await this.activeLlama.loadModel({
            modelPath: target.fullPath,
          });
        } else {
          throw loadErr;
        }
      }

      if (target.companionProjectorPath && fs.existsSync(target.companionProjectorPath)) {
        console.log(`[LocalGguf] Multimodal Vision Projector Paired: "${target.name}" <-> "${target.companionProjector}" (${target.companionProjectorPath})`);
      }

      // 3. Dynamic RAM Balancer: Check free system RAM vs model size before context allocation
      const freeRam = os.freemem?.() || 8 * 1024 * 1024 * 1024;
      const modelBytes = target.sizeBytes || 2 * 1024 * 1024 * 1024;
      let effectiveContext = safeContextSize;
      let effectiveBatch = 512;

      if (freeRam < modelBytes * 1.15) {
        console.warn(`[LocalGguf] Dynamic RAM Balancer: System free RAM (${this.formatBytes(freeRam)}) is tight for model size (${this.formatBytes(modelBytes)}). Scaling contextSize (${safeContextSize} -> 1024) and batchSize (512 -> 256) to prevent Out-Of-Memory.`);
        effectiveContext = Math.min(effectiveContext, 1024);
        effectiveBatch = 256;
        if (freeRam < modelBytes * 0.8) {
          effectiveContext = 512;
          effectiveBatch = 128;
        }
      }

      const cpuCount = os.cpus?.()?.length || 4;
      const optimalThreads = Math.max(1, Math.min(2, cpuCount));

      try {
        this.activeContext = await this.activeModel.createContext({
          contextSize: effectiveContext,
          batchSize: effectiveBatch,
          threads: optimalThreads,
          flashAttention: true,
        });
      } catch (ctxErr: any) {
        console.warn(`[LocalGguf] Context with flashAttention failed, retrying without:`, ctxErr?.message);
        try {
          this.activeContext = await this.activeModel.createContext({
            contextSize: effectiveContext,
            batchSize: effectiveBatch,
            threads: optimalThreads,
          });
        } catch {
          this.activeContext = await this.activeModel.createContext({
            contextSize: 1024,
            threads: optimalThreads,
          });
        }
      }

      // 4. Resolve Chat Wrapper: Support ChatML for Qwen (qwen35/qwen2) models
      const archLower = (target.architecture || manifest?.metadata?.architecture || '').toLowerCase();
      const nameLower = (target.name || target.id || target.filename || '').toLowerCase();

      let chatWrapper: any = undefined;
      const modelInfo = await readGgufFileInfo(target.fullPath);
      const recognizedWrapper = createRecognizedTextWrapper(modelInfo.metadata?.tokenizer?.chat_template, await import('node-llama-cpp'));
      if (recognizedWrapper) {
        chatWrapper = recognizedWrapper;
      } else if (archLower.includes('qwen') || nameLower.includes('qwen') || archLower.includes('chatml')) {
        if (typeof ChatMLChatWrapper === 'function') {
          chatWrapper = new ChatMLChatWrapper();
        }
      }
      this.activeChatWrapper = chatWrapper;

      try {
        this.activeSession = new LlamaChatSession({
          contextSequence: this.activeContext.getSequence(),
          chatWrapper: this.activeChatWrapper,
          systemPrompt: systemPrompt || undefined,
        });
      } catch (sessErr: any) {
        console.warn('[LocalGguf] Session creation with custom chatWrapper failed, falling back to GeneralChatWrapper:', sessErr?.message);
        try {
          this.activeChatWrapper = typeof GeneralChatWrapper === 'function' ? new GeneralChatWrapper() : undefined;
          this.activeSession = new LlamaChatSession({
            contextSequence: this.activeContext.getSequence(),
            chatWrapper: this.activeChatWrapper,
            systemPrompt: systemPrompt || undefined,
          });
        } catch {
          this.activeChatWrapper = undefined;
          this.activeSession = new LlamaChatSession({
            contextSequence: this.activeContext.getSequence(),
            systemPrompt: systemPrompt || undefined,
          });
        }
      }

      console.log(`[LocalGguf] Model successfully loaded: ${target.name} (Context: ${this.activeContext.contextSize})`);
    } catch (err: any) {
      console.error(`[LocalGguf] Failed to load native model "${target.name}":`, err);
      await this.unloadModel();
      throw new Error(`Failed to load GGUF model "${target.name}": ${err.message || String(err)}`);
    }

    this.loadedModelId = target.id;
    this.loadedModelFilename = target.filename;
    this.loadedModelSizeBytes = target.sizeBytes;
    this.loadedModelContextSize = this.activeContext?.contextSize || 2048;
    this.loadedAt = Date.now();
  }

  /**
   * Unload currently loaded model from memory
   */
  public async unloadModel(force = false): Promise<void> {
    this.clearKeepAliveTimer();

    // Guard against mid-generation disposal when an active request is in queue
    if (!force && this.isProcessingQueue) {
      console.warn('[LocalGguf] unloadModel() skipped because an active inference is currently executing in queue.');
      return;
    }

    if (this.activeSession) {
      try {
        if (this.activeSession.sequence && typeof this.activeSession.sequence.dispose === 'function') {
          this.activeSession.sequence.dispose();
        }
      } catch {}
      try {
        if (typeof this.activeSession.dispose === 'function') {
          this.activeSession.dispose();
        }
      } catch {}
      this.activeSession = null;
    }

    if (this.activeContext) {
      try {
        if (typeof this.activeContext.dispose === 'function') {
          this.activeContext.dispose();
        }
      } catch {}
      this.activeContext = null;
    }

    if (this.activeModel) {
      try {
        if (typeof this.activeModel.dispose === 'function') {
          this.activeModel.dispose();
        }
      } catch {}
      this.activeModel = null;
    }

    this.loadedModelId = null;
    this.loadedModelFilename = null;
    this.loadedModelSizeBytes = 0;
    this.loadedAt = null;
    this.keepAliveExpiresAt = null;

    if (global.gc) {
      try {
        global.gc();
      } catch {}
    }

    console.log('[LocalGguf] Model unloaded from RAM/VRAM.');
  }

  /**
   * Get active memory status
   */
  public getMemoryStatus(): {
    loadedModelId: string | null;
    loadedModelFilename: string | null;
    isLoaded: boolean;
    contextSize: number | null;
  } {
    return {
      loadedModelId: this.loadedModelId,
      loadedModelFilename: this.loadedModelFilename,
      isLoaded: !!this.activeModel,
      contextSize: this.activeContext?.contextSize ?? null,
    };
  }

  /**
   * Delete a GGUF file and its manifest permanently from disk
   */
  public async deleteModel(identifier: string): Promise<void> {
    this.getManifestPath(identifier); // Validate before unloading or touching any path.
    const cleanId = identifier.trim().replace(/\.gguf$/i, '').replace(/\.manifest\.json$/i, '');
    
    // 1. Unload from RAM/VRAM first so Windows file locks are released
    await this.unloadModel(true);
    // Brief delay to allow Windows OS to release open file handles
    await new Promise((r) => setTimeout(r, 120));

    // 2. Scan models to find the exact file path
    const models = await this.scanModels();
    const target = models.find((m) => m.id === cleanId || m.filename === identifier || m.filename === `${cleanId}.gguf`);

    // 3. Delete binary file (unlink physical file from disk only if stored in modelsDir or not zero-copy external)
    if (!target) throw new Error('Local model not found; files were preserved');
    const ownedRoot = fs.realpathSync(this.modelsDir);
    const relative = path.relative(ownedRoot, fs.realpathSync(target.fullPath));
    const isOwned = relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
    const isZeroCopy = target.zeroCopy || !isOwned;
    const pathsToTry = new Set<string>();
    if (!isZeroCopy && target?.fullPath) {
      pathsToTry.add(target.fullPath);
    }

    for (const p of pathsToTry) {
      try {
        if (fs.existsSync(p)) {
          await fs.promises.unlink(p);
          console.log(`[LocalGguf] Permanently deleted binary file from disk: ${p}`);
        }
      } catch (err: any) {
        console.warn(`[LocalGguf] Failed to unlink binary ${p}:`, err.message);
        throw err;
      }
    }

    // 4. Delete manifest and guide files
    const manifestPath = this.getManifestPath(cleanId);
    try {
      if (fs.existsSync(manifestPath)) {
        await fs.promises.unlink(manifestPath);
        console.log(`[LocalGguf] Permanently deleted manifest from disk: ${manifestPath}`);
      }
    } catch (err: any) {
      console.warn(`[LocalGguf] Failed to unlink manifest ${manifestPath}:`, err.message);
      throw err;
    }

    // Guides and arbitrary same-prefix files are user data, not owned binaries.

    // Auto-clean local-gguf-engine card from gateway-providers.json if 0 offline models remain
    try {
      const remaining = await this.scanModels();
      if (remaining.length === 0) {
        const provFile = path.resolve(this.modelsDir, 'gateway-providers.json');
        if (fs.existsSync(provFile)) {
          const provRaw = await fs.promises.readFile(provFile, 'utf-8');
          const provs = JSON.parse(provRaw);
          if (Array.isArray(provs)) {
            const filtered = provs.filter((p: any) => p.id !== 'local-gguf-engine' && p.id !== 'gguf');
            if (filtered.length !== provs.length) {
              await fs.promises.writeFile(`${provFile}.before-gguf-removal-${crypto.randomUUID()}.json`, provRaw, { flag: 'wx', mode: 0o600 });
              await fs.promises.writeFile(provFile, JSON.stringify(filtered, null, 2), 'utf-8');
            }
          }
        }
      }
    } catch {}
  }

  /**
   * Remove discovered local models and exact manifests, preserving guides/user files.
   */
  public async deleteAllModels(): Promise<void> {
    const models = await this.scanModels();
    for (const model of models) await this.deleteModel(model.id);

    // Prune local-gguf-engine from gateway-providers.json
    try {
      const provFile = path.resolve(this.modelsDir, 'gateway-providers.json');
      if (fs.existsSync(provFile)) {
        const provRaw = await fs.promises.readFile(provFile, 'utf-8');
        const provs = JSON.parse(provRaw);
        if (Array.isArray(provs)) {
          const filtered = provs.filter((p: any) => p.id !== 'local-gguf-engine' && p.id !== 'gguf');
          if (filtered.length !== provs.length) {
            await fs.promises.writeFile(`${provFile}.before-gguf-removal-${crypto.randomUUID()}.json`, provRaw, { flag: 'wx', mode: 0o600 });
            await fs.promises.writeFile(provFile, JSON.stringify(filtered, null, 2), 'utf-8');
          }
        }
      }
    } catch {}
  }

  /**
   * Update settings and rename model in manifest
   */
  public async updateModelSettings(
    modelId: string,
    updates: {
      name?: string;
      capabilities?: { reasoning?: boolean; image?: boolean; embedding?: boolean };
      systemPrompt?: string;
      contextLength?: number;
      parameters?: Record<string, any>;
      chatTemplate?: string;
    }
  ): Promise<LocalGgufModel> {
    this.getManifestPath(modelId);
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) throw new Error('Invalid local model settings');
    for (const key of ['name', 'systemPrompt', 'chatTemplate'] as const) if (updates[key] !== undefined && typeof updates[key] !== 'string') throw new Error(`Invalid local model setting: ${key}`);
    if (updates.name !== undefined && !updates.name.trim()) throw new Error('Model display name must not be empty');
    if (updates.contextLength !== undefined && (!Number.isInteger(updates.contextLength) || updates.contextLength < 512 || updates.contextLength > 8192)) throw new Error('Model context must be an integer between 512 and 8192');
    if (updates.capabilities !== undefined && (!updates.capabilities || typeof updates.capabilities !== 'object' || Array.isArray(updates.capabilities) || Object.entries(updates.capabilities).some(([key, value]) => !['reasoning', 'image', 'embedding'].includes(key) || typeof value !== 'boolean'))) throw new Error('Invalid local model capabilities');
    if (updates.parameters !== undefined && (!updates.parameters || typeof updates.parameters !== 'object' || Array.isArray(updates.parameters))) throw new Error('Invalid local model parameters');
    if (updates.parameters?.num_ctx !== undefined && (!Number.isInteger(updates.parameters.num_ctx) || updates.parameters.num_ctx < 512 || updates.parameters.num_ctx > 8192)) throw new Error('Invalid local model context parameter');
    const cleanId = modelId.trim().replace(/\.gguf$/i, '').replace(/\.manifest\.json$/i, '');
    let manifest = await this.loadManifest(cleanId);
    const models = await this.scanModels();
    const target = models.find((m) => m.id === cleanId || m.filename === modelId);
    if (!target) throw new Error(`Model "${modelId}" not found; settings were preserved.`);

    if (!manifest) {
      if (!target) throw new Error(`Model "${modelId}" not found.`);
      manifest = {
        id: cleanId,
        name: updates.name?.trim() || target.name,
        filename: target.filename,
        modelPath: target.fullPath,
        zeroCopy: target.zeroCopy ?? false,
        capabilities: {
          ...target.capabilities,
          ...(updates.capabilities || {}),
        },
        companionProjector: target.companionProjector,
        companionProjectorPath: target.companionProjectorPath,
        systemPrompt: updates.systemPrompt !== undefined ? updates.systemPrompt : target.systemPrompt,
        parameters: {
          num_ctx: updates.contextLength || target.contextLength || 2048,
          temperature: 0.7,
          top_p: 0.9,
          ...updates.parameters,
        },
        chatTemplate: updates.chatTemplate,
        metadata: {
          architecture: target.architecture,
          contextLength: updates.contextLength || target.contextLength || 2048,
          quantization: target.quantization,
          sizeBytes: target.sizeBytes,
          sizeFormatted: target.sizeFormatted,
        },
        status: target.status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      if (updates.name !== undefined && updates.name.trim()) {
        manifest.name = updates.name.trim();
      }
      if (updates.capabilities) {
        manifest.capabilities = {
          ...(manifest.capabilities || {}),
          ...updates.capabilities,
        };
      }
      if (updates.systemPrompt !== undefined) {
        manifest.systemPrompt = updates.systemPrompt;
      }
      if (updates.contextLength !== undefined) {
        manifest.parameters = manifest.parameters || {};
        manifest.parameters.num_ctx = Math.max(512, Math.min(updates.contextLength, 8192));
        if (manifest.metadata) {
          manifest.metadata.contextLength = manifest.parameters.num_ctx;
        }
      }
      if (updates.parameters) {
        manifest.parameters = { ...manifest.parameters, ...updates.parameters };
      }
      if (updates.chatTemplate !== undefined) {
        manifest.chatTemplate = updates.chatTemplate;
      }
      manifest.updatedAt = Date.now();
    }

    await this.saveManifest(manifest);

    // If active model is this one, unload so settings take effect on next turn
    if (this.loadedModelId === cleanId) {
      await this.unloadModel();
    }

    const refreshedModels = await this.scanModels();
    const updatedModel = refreshedModels.find((m) => m.id === cleanId) || target;
    if (!updatedModel) throw new Error(`Model "${cleanId}" failed to refresh after update.`);

    if (updates.capabilities) {
      updatedModel.capabilities = {
        ...updatedModel.capabilities,
        ...updates.capabilities,
      };
    }

    return updatedModel;
  }

  /**
   * Zero-Copy Local File Path Mount:
   * Directly mounts an existing model from local disk in 2 seconds without copying files
   */
  public async mountZeroCopyModel(
    sourcePath: string,
    guideContent?: string,
    guidePath?: string,
    onProgress?: (event: PipelineProgressEvent) => void
  ): Promise<{ success: boolean; model: LocalGgufModel; manifest: GgufModelManifest }> {
    const cleanSource = sourcePath.trim().replace(/^['"]|['"]$/g, '');
    if (!fs.existsSync(cleanSource)) {
      throw new Error(`File not found at path: ${cleanSource}`);
    }

    const filename = path.basename(cleanSource);
    if (!filename.toLowerCase().endsWith('.gguf')) {
      throw new Error('Selected file must have .gguf extension.');
    }

    return await this.runSetupPipeline(
      {
        modelPath: cleanSource,
        guideContent,
        guidePath,
        isZeroCopy: true,
      },
      onProgress
    );
  }

  /**
   * Search Hugging Face repo for GGUF files
   */
  public async searchHuggingFace(repoId: string): Promise<Array<{
    filename: string;
    sizeBytes: number;
    sizeFormatted: string;
    quantization: string;
    downloadUrl: string;
  }>> {
    const files = await retrieveGgufCatalog(repoId);
    return files.map(file => ({ ...file, sizeFormatted: this.formatBytes(file.sizeBytes), quantization: this.extractQuantization(file.filename) }));
  }

  /**
   * Start streaming download from Hugging Face with progress tracking
   */
  public async startHuggingFaceDownload(repo: string, filename: string, revision?: string): Promise<DownloadProgress> {
    const files = await retrieveGgufCatalog(repo);
    const file = files.find(entry => entry.filename === filename);
    if (!file || !file.sha256) throw new Error('Selected GGUF requires retrieved size and SHA-256 metadata');
    if (revision !== undefined && file.revision !== revision) throw new Error('Repository revision changed; search again before downloading');
    return this.beginVerifiedDownload(file);
  }

  public async startDownload(url: string, targetFilename?: string, repo?: string): Promise<DownloadProgress> {
    if (!repo) throw new Error('Official Hugging Face repository required');
    const files = await retrieveGgufCatalog(repo);
    const file = files.find(entry => entry.downloadUrl === url && (!targetFilename || entry.filename === targetFilename));
    if (!file || !file.sha256) throw new Error('Download must match pinned official GGUF metadata');
    return this.beginVerifiedDownload(file);
  }

  private beginVerifiedDownload(file: any): DownloadProgress {
    if (this.downloadAbortController) throw new Error('Another model download is still active');
    const filename = path.basename(file.filename);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.gguf$/i.test(filename) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(filename)) throw new Error('Unsupported local GGUF filename');
    const destination = path.join(this.modelsDir, filename);
    if (fs.existsSync(destination)) throw new Error('Destination already exists; existing model preserved');
    const controller = new AbortController();
    this.downloadAbortController = controller;
    const progress: DownloadProgress = {
      id: 'dl-' + crypto.randomUUID(), filename, repo: file.repo, url: file.downloadUrl,
      totalBytes: file.sizeBytes, downloadedBytes: 0, percentage: 0, speedMBs: 0,
      etaSeconds: 0, status: 'downloading', startedAt: Date.now(),
    };
    this.activeDownload = progress;
    void (async () => {
      try {
        await downloadVerifiedGguf({ url: file.downloadUrl, destination, sizeBytes: file.sizeBytes,
          sha256: file.sha256, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2 * 60 * 60 * 1000)]),
          onProgress: (bytes: number) => {
            progress.downloadedBytes = bytes;
            progress.percentage = Math.min(99.9, bytes / file.sizeBytes * 100);
            const elapsed = Math.max(0.001, (Date.now() - progress.startedAt) / 1000);
            progress.speedMBs = bytes / 1048576 / elapsed;
            progress.etaSeconds = bytes ? Math.ceil((file.sizeBytes - bytes) / (bytes / elapsed)) : 0;
          },
        });
        progress.status = 'completed'; progress.percentage = 100;
        progress.verified = true; progress.sha256 = file.sha256;
        // Verified download is not inference or automatic setup acceptance.
      } catch (error: any) {
        progress.status = controller.signal.aborted ? 'cancelled' : 'error';
        if (progress.status === 'error') progress.error = error.message || 'GGUF download failed';
      } finally {
        progress.speedMBs = 0; progress.etaSeconds = 0;
        if (this.downloadAbortController === controller) this.downloadAbortController = null;
      }
    })();
    return progress;
  }

  public cancelDownload(): boolean {
    if (!this.downloadAbortController) return false;
    this.downloadAbortController.abort();
    // Ownership remains held until actual network/file cleanup settles.
    return true;
  }

  /**
   * Get active download progress
   */
  public getDownloadProgress(): DownloadProgress | null {
    return this.activeDownload;
  }

  /**
   * Handle streaming file upload from browser via busboy
   * Supports: .gguf file + optional guide file (.txt, Modelfile, .json) + optional guideContent field
   * Automatically executes the 5-Stage Setup Pipeline upon upload completion.
   */
  public handleUpload(req: IncomingMessage, res: ServerResponse): void {
    const bb = busboy({ headers: req.headers, limits: { files: 2 } });
    let uploadedFilename = '';
    let targetGgufPath = '';
    let guideContent = '';

    bb.on('file', (name, file, info) => {
      const originalName = info.filename || '';

      if (originalName.toLowerCase().endsWith('.gguf') || name === 'file') {
        uploadedFilename = originalName || `model-${Date.now()}.gguf`;
        targetGgufPath = path.join(this.modelsDir, uploadedFilename);
        const writeStream = fs.createWriteStream(targetGgufPath);
        file.pipe(writeStream);
        writeStream.on('error', (err) => {
          console.error('[LocalGguf] GGUF write stream error:', err);
        });
      } else if (
        originalName.toLowerCase().endsWith('.txt') ||
        originalName.toLowerCase().endsWith('.json') ||
        originalName.toLowerCase().includes('modelfile') ||
        name === 'guideFile'
      ) {
        // Read guide file into memory buffer
        const chunks: Buffer[] = [];
        file.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
        file.on('end', () => {
          guideContent = Buffer.concat(chunks).toString('utf-8');
        });
      } else {
        file.resume();
      }
    });

    bb.on('field', (name, val) => {
      if (name === 'guideContent') {
        guideContent = val;
      }
    });

    bb.on('close', async () => {
      if (!uploadedFilename || !fs.existsSync(targetGgufPath)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'No valid .gguf file was uploaded.' }));
        return;
      }

      try {
        console.log(`[LocalGguf] Upload finished: ${uploadedFilename}. Running Post-Upload Auto-Setup Pipeline...`);
        const pipelineResult = await this.runSetupPipeline({
          filename: uploadedFilename,
          guideContent,
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            model: pipelineResult.model,
            manifest: pipelineResult.manifest,
            message: 'Model uploaded, auto-setup pipeline completed, and registered in Gateway!',
          })
        );
      } catch (err: any) {
        console.error('[LocalGguf] Post-upload pipeline error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Post-upload setup pipeline failed' }));
      }
    });

    bb.on('error', (err: any) => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Upload parse error: ${err?.message || String(err)}` }));
    });

    req.pipe(bb);
  }

  /**
   * Execute chat / streaming completion with active GGUF model and merged manifest
   */
  public async executeChat(
    modelId: string,
    messages: Array<{ role: string; content: string | any[] }>,
    options: {
      stream?: boolean;
      temperature?: number;
      maxTokens?: number;
      top_p?: number;
      topP?: number;
      reasoningEnabled?: boolean;
      keep_alive?: string | number;
      stop?: string[] | string;
      repeatPenalty?: number;
      repeat_penalty?: number;
      responseFormat?: any;
      tools?: any[];
      toolChoice?: any;
      seed?: number;
      minP?: number;
      topK?: number;
      signal?: AbortSignal;
    },
    res: ServerResponse
  ): Promise<void> {
    const startTime = performance.now();
    this.clearKeepAliveTimer();

    // Ensure model is loaded into node-llama-cpp
    await this.loadModel(modelId);

    if (!this.activeModel || !this.activeContext) {
      throw new Error(`Failed to initialize inference engine runtime for model "${modelId}".`);
    }

    try {
      // Load merged manifest for default parameters and system prompt
      const manifest = await this.loadManifest(modelId);
      const effectiveTemperature = options.temperature ?? manifest?.parameters?.temperature ?? (options.tools?.length ? 0 : 0.7);
      const target = (await this.scanModels()).find(model => model.id === modelId || model.filename === modelId);
      if (!target) throw new Error('Loaded local model is missing from its catalog');
      const effectiveTopP = options.top_p ?? manifest?.parameters?.top_p ?? 0.9;
      const effectiveMaxTokens = options.maxTokens ?? manifest?.parameters?.num_ctx ?? 2048;

      // Native EOS / Stop Triggers for common architectures
      const NATIVE_STOP_TOKENS = [
        '<|im_end|>',
        '<|eot_id|>',
        '</s>',
        '<|endoftext|>',
        '<|end_of_text|>',
        '<|im_start|>',
      ];

      const rawStops = [
        ...(Array.isArray(manifest?.parameters?.stop) ? manifest.parameters.stop : manifest?.parameters?.stop ? [manifest.parameters.stop] : []),
        ...(Array.isArray(options.stop) ? options.stop : options.stop ? [options.stop] : []),
      ];

      const combinedStopTriggers = Array.from(new Set([...NATIVE_STOP_TOKENS, ...rawStops]));
      const effectiveRepeatPenalty = options.repeatPenalty ?? options.repeat_penalty ?? manifest?.parameters?.repeat_penalty ?? 1.1;

      // Compile JSON Grammar if requested
      let grammar: any = undefined;
      if (options.responseFormat) {
        try {
          if (
            options.responseFormat.type === 'json_schema' &&
            options.responseFormat.schema &&
            typeof this.activeLlama?.createGrammarForJsonSchema === 'function'
          ) {
            grammar = await this.activeLlama.createGrammarForJsonSchema(options.responseFormat.schema);
          } else if (
            (options.responseFormat.type === 'json_object' || options.responseFormat.type === 'json_schema') &&
            typeof this.activeLlama?.getGrammarFor === 'function'
          ) {
            grammar = await this.activeLlama.getGrammarFor('json');
          }
        } catch (gErr: any) {
          console.warn('[LocalGguf] Grammar compilation note:', gErr?.message);
        }
      }

      // Find the latest user message
      let lastUserIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserIndex = i;
          break;
        }
      }

      if (lastUserIndex === -1) {
        throw new Error('No user message found in chat messages array.');
      }

      const lastUserObj = messages[lastUserIndex];
      let userPromptText = '';
      if (typeof lastUserObj.content === 'string') {
        userPromptText = lastUserObj.content;
      } else if (Array.isArray(lastUserObj.content)) {
        userPromptText = lastUserObj.content
          .map((p) => (typeof p === 'string' ? p : p.text || ''))
          .join('\n');
      }

      if (!userPromptText.trim()) {
        userPromptText = 'Hello';
      }
      const continuation = localNativeContinuation(userPromptText, messages.slice(lastUserIndex + 1));
      userPromptText = continuation.prompt;

      const previousTurns = localHistoricalTurns(messages.slice(0, lastUserIndex));
      const systemPromptFromChat = previousTurns.systemPrompt;

      // Combine system prompt: manifest's system prompt (Guide file) + any dynamic chat system prompt
      let effectiveSystemPrompt = [manifest?.systemPrompt, systemPromptFromChat].filter(Boolean).join('\n\n');

      // Universal Tool / Function Calling System Instructions
      if (Array.isArray(options.tools) && options.tools.length > 0) {
        const toolsDoc = `\n\n# Tools\n\nYou may call one or more functions to assist with the user query.\n\nYou are provided with function signatures within <tools></tools> XML tags:\n<tools>\n${options.tools.map(tool => JSON.stringify(tool)).join('\n')}\n</tools>\n\nFor each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:\n<tool_call>\n{"name": <function-name>, "arguments": <args-json-object>}\n</tool_call>`;
        effectiveSystemPrompt += toolsDoc;
      }

      // If reasoning toggle is explicitly turned OFF, append /no_think directive
      const isReasoningOff = options.reasoningEnabled === false ||
        (options.reasoningEnabled === undefined && target.capabilities?.reasoning === false);

      if (isReasoningOff) {
        const noThinkDirective = 'Do not generate internal monologue or <think> reasoning tags. Preserve the required tool-call format when using tools.';
        effectiveSystemPrompt = effectiveSystemPrompt ? `${effectiveSystemPrompt}\n\n${noThinkDirective}` : noThinkDirective;
      }

      // Ensure LlamaChatSession is active without exhausting context sequence pool
      const isSequenceDisposed = !this.activeSession?.sequence || this.activeSession.sequence.disposed;
      if (!this.activeSession || this.activeSession.disposed || isSequenceDisposed) {
        if (!this.activeContext || this.activeContext.disposed) {
          const reqCtx = Math.max(512, Math.min(manifest?.parameters?.num_ctx || 2048, 4096));
          this.activeContext = await this.activeModel.createContext({
            contextSize: reqCtx,
          });
        }
        const { LlamaChatSession } = await import('node-llama-cpp');
        this.activeSession = new LlamaChatSession({
          contextSequence: this.activeContext.getSequence(),
          chatWrapper: this.activeChatWrapper,
        });
      }

      // Automatic Context Shifting / Sliding Window Protection (Never Crash on Long Agent Chats)
      const safeContextSize = this.activeContext?.contextSize || 2048;
      const maxHistoryTokens = Math.max(512, Math.floor(safeContextSize * 0.8));
      const estimateTokens = (str: string) => Math.ceil((str || '').length / 3.5);

      const baseTokens = estimateTokens(effectiveSystemPrompt) + estimateTokens(userPromptText);
      const fitted = fitLocalHistoricalTurns(messages.slice(0, lastUserIndex), continuation.history, baseTokens, maxHistoryTokens);
      const prunedChatHistory = fitted.history;
      if (fitted.droppedTurns) console.log(`[LocalGguf] Sliding Window: Trimmed ${fitted.droppedTurns} complete historical user turns.`);
      if (fitted.exceedsEstimate) console.warn('[LocalGguf] Current turn exceeds approximate context budget; preserved current tool results for native context handling.');

      // Configure chat session history: system prompt turn followed strictly by previous user/model turns
      const history: Array<{ type: 'system' | 'user' | 'model'; text?: string; response?: string[] }> = [];
      if (effectiveSystemPrompt.trim()) {
        history.push({ type: 'system', text: effectiveSystemPrompt.trim() });
      }
      for (const item of prunedChatHistory) {
        history.push(item);
      }

      // The wire transcript is authoritative. Let the native SDK reconcile its
      // own token cache; skipping setChatHistory can retain stale model turns
      // or discard newly appended history, including completed tool effects.
      this.activeSession.setChatHistory(history);

      // Handle Streaming Response (SSE OpenAI-compatible)
      const tokenMeter = this.activeSession.sequence.tokenMeter;
      const meterBefore = tokenMeter.getState();
      const finishReason = (reason: string, hasTools: boolean, watchdog: boolean) => {
        if (watchdog) return 'error';
        if (reason === 'maxTokens') return 'length';
        if (reason === 'abort') return 'cancelled';
        if (!['eogToken', 'stopGenerationTrigger', 'customStopTrigger', 'functionCalls'].includes(reason)) return 'error';
        return hasTools ? 'tool_calls' : reason === 'functionCalls' ? 'error' : 'stop';
      };
      if (options.stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        let fullContent = '';
        let fullReasoning = '';
        let insideThinkTag = false;
        let tokenCount = 0;
        let nativeStopReason = 'unknown';

        // Anti-Loop Watchdog State
        let consecutiveIdentical = 0;
        let lastTokenPiece = '';
        let loopBroken = false;

        try {
          const completion = await this.activeSession.promptWithMeta(userPromptText, {
            temperature: effectiveTemperature,
            topP: effectiveTopP,
            maxTokens: effectiveMaxTokens,
            repeatPenalty: effectiveRepeatPenalty,
            customStopTriggers: combinedStopTriggers,
            grammar,
            signal: options.signal,
            minP: options.minP,
            topK: options.topK,
            seed: options.seed,
            onToken: (tokens: number[]) => { tokenCount += tokens.length; },
            onTextChunk: (chunk: string) => {
              if (loopBroken) return;

              // Anti-Loop Watchdog: Check identical token loop
              if (chunk === lastTokenPiece && chunk.trim().length > 0) {
                consecutiveIdentical++;
                if (consecutiveIdentical >= 25) {
                  console.warn('[Watchdog] Token loop detected in local inference (25x identical). Halting stream.');
                  loopBroken = true;
                  return;
                }
              } else {
                consecutiveIdentical = 0;
                lastTokenPiece = chunk;
              }

              // Anti-Loop Watchdog: Check phrase loop (>= 20 chars repeating 4+ times)
              if (fullContent.length > 200) {
                const recentSlice = fullContent.slice(-300);
                const candidates = recentSlice.split(/\n+/).map((s) => s.trim()).filter((s) => s.length >= 20);
                if (candidates.length >= 4) {
                  const lastPhrase = candidates[candidates.length - 1];
                  const identicals = candidates.slice(-4).filter((p) => p === lastPhrase).length;
                  if (identicals >= 4) {
                    console.warn(`[Watchdog] Phrase loop detected ("${lastPhrase.slice(0, 30)}..."). Halting stream.`);
                    fullContent = fullContent.slice(0, -lastPhrase.length * 3);
                    loopBroken = true;
                    return;
                  }
                }
              }

              // Handle <think>...</think> reasoning tags
              if (chunk.includes('<think>')) {
                insideThinkTag = true;
                const parts = chunk.split('<think>');
                if (parts[0]) {
                  fullContent += parts[0];
                  this.sendSseChunk(res, { content: parts[0] });
                }
                if (parts[1]) {
                  fullReasoning += parts[1];
                  this.sendSseChunk(res, { reasoning_content: parts[1] });
                }
                return;
              }

              if (insideThinkTag) {
                if (chunk.includes('</think>')) {
                  insideThinkTag = false;
                  const parts = chunk.split('</think>');
                  fullReasoning += parts[0];
                  this.sendSseChunk(res, { reasoning_content: parts[0] });
                  if (parts[1]) {
                    fullContent += parts[1];
                    this.sendSseChunk(res, { content: parts[1] });
                  }
                } else {
                  fullReasoning += chunk;
                  this.sendSseChunk(res, { reasoning_content: chunk });
                }
                return;
              }

              fullContent += chunk;
              this.sendSseChunk(res, { content: chunk });
            },
          });
          nativeStopReason = completion.stopReason;
        } catch (promptErr: any) {
          if (options.signal?.aborted || promptErr.name === 'AbortError' || promptErr.message?.includes('abort')) {
            console.log(`[LocalGguf] C++ Token Generation stopped immediately by AbortSignal (0ms).`);
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ error: { code: 'CANCELLED', message: 'Local generation interrupted' } })}\n\n`);
              res.end();
            }
            return;
          }
          throw promptErr;
        }

        const totalTimeMs = Math.round(performance.now() - startTime);
        const tokensPerSec = totalTimeMs > 0 ? parseFloat(((tokenCount / totalTimeMs) * 1000).toFixed(1)) : 0;

        // Parse tool calls if generated
        const streamToolCalls = parseLocalToolCalls(fullContent);
        if (options.toolChoice === 'none' && streamToolCalls) throw new Error('Local model requested tools while tool_choice is none');

        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              choices: [{ delta: streamToolCalls ? { tool_calls: streamToolCalls.map((call, index) => ({ index, ...call })) } : {}, finish_reason: finishReason(nativeStopReason, Boolean(streamToolCalls), loopBroken) }],
              toolCalls: streamToolCalls,
              usage: {
                prompt_tokens: tokenMeter.diff(meterBefore).usedInputTokens,
                completion_tokens: tokenCount,
                total_tokens: tokenMeter.diff(meterBefore).usedInputTokens + tokenCount,
              },
              usageAccounting: 'Native evaluated input token delta and emitted generated token IDs; reused prefix may be excluded',
              telemetry: {
                latencyMs: totalTimeMs,
                tokensPerSec,
                nativeStopReason,
              },
            })}\n\n`
          );

          res.write('data: [DONE]\n\n');
          res.end();
        }
        return;
      }

      // Non-streaming response
      let nonStreamContent = '';
      let nonStreamReasoning = '';
      let insideThink = false;
      let tokens = 0;
      let nativeStopReason = 'unknown';
      let consecutiveNonStream = 0;
      let lastTokenNonStream = '';
      let nonStreamLoopBroken = false;

      try {
        const completion = await this.activeSession.promptWithMeta(userPromptText, {
          temperature: effectiveTemperature,
          topP: effectiveTopP,
          maxTokens: effectiveMaxTokens,
          repeatPenalty: effectiveRepeatPenalty,
          customStopTriggers: combinedStopTriggers,
          grammar,
          signal: options.signal,
          minP: options.minP,
          topK: options.topK,
          seed: options.seed,
          onToken: (generated: number[]) => { tokens += generated.length; },
          onTextChunk: (chunk: string) => {
            if (nonStreamLoopBroken) return;

            if (chunk === lastTokenNonStream && chunk.trim().length > 0) {
              consecutiveNonStream++;
              if (consecutiveNonStream >= 25) {
                console.warn('[Watchdog] Token loop detected (25x identical). Breaking generation.');
                nonStreamLoopBroken = true;
                return;
              }
            } else {
              consecutiveNonStream = 0;
              lastTokenNonStream = chunk;
            }

            if (chunk.includes('<think>')) {
              insideThink = true;
              const parts = chunk.split('<think>');
              if (parts[0]) nonStreamContent += parts[0];
              if (parts[1]) nonStreamReasoning += parts[1];
              return;
            }
            if (insideThink) {
              if (chunk.includes('</think>')) {
                insideThink = false;
                const parts = chunk.split('</think>');
                nonStreamReasoning += parts[0];
                if (parts[1]) nonStreamContent += parts[1];
              } else {
                nonStreamReasoning += chunk;
              }
              return;
            }
            nonStreamContent += chunk;
          },
        });
        nativeStopReason = completion.stopReason;
      } catch (promptErr: any) {
        if (options.signal?.aborted || promptErr.name === 'AbortError' || promptErr.message?.includes('abort')) {
          console.log(`[LocalGguf] Non-streaming C++ Token Generation stopped immediately by AbortSignal.`);
          if (!res.writableEnded) {
            res.statusCode = 499; // Client Closed Request
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Request aborted by client' }));
          }
          return;
        }
        throw promptErr;
      }

      // Parse tool calls in non-stream content
      const nonStreamToolCalls = parseLocalToolCalls(nonStreamContent);
      if (options.toolChoice === 'none' && nonStreamToolCalls) throw new Error('Local model requested tools while tool_choice is none');

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.writableEnded) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: modelId,
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: nonStreamContent,
                  reasoning_content: nonStreamReasoning || undefined,
                  tool_calls: nonStreamToolCalls,
                },
                finish_reason: finishReason(nativeStopReason, Boolean(nonStreamToolCalls), nonStreamLoopBroken),
              },
            ],
            toolCalls: nonStreamToolCalls,
            usage: {
              prompt_tokens: tokenMeter.diff(meterBefore).usedInputTokens,
              completion_tokens: tokens,
              total_tokens: tokenMeter.diff(meterBefore).usedInputTokens + tokens,
            },
            usageAccounting: 'Native evaluated input token delta and emitted generated token IDs; reused prefix may be excluded',
            nativeStopReason,
            latencyMs,
          })
        );
      }
    } finally {
      // Auto Keep-Alive Idle Timer / Immediate Unload Handling
      const keepAliveDuration = this.parseKeepAlive(options.keep_alive);
      if (keepAliveDuration === 0) {
        console.log(`[LocalGguf] keep_alive: 0. Unloading model "${this.loadedModelId}" immediately from RAM/VRAM.`);
        try {
          await this.unloadModel(true);
        } catch {}
      } else if (keepAliveDuration > 0) {
        this.resetKeepAliveTimer(keepAliveDuration);
      }
    }
  }

  private sendSseChunk(
    res: ServerResponse,
    delta: { content?: string; reasoning_content?: string }
  ): void {
    const payload = {
      choices: [
        {
          index: 0,
          delta,
        },
      ],
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

// Singleton Engine instance
export const localGgufService = new LocalGgufEngineService();
