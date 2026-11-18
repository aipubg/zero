/**
 * Zero model HTTP API.
 *
 * The HTTP routes the Models page and OpenAI-compatible clients use:
 *   /health, /health/*            process health
 *   /v1/models                    configured models
 *   /v1/chat/completions          plain model proxy (local GGUF or a provider)
 *   /api/gateway/proxy            provider connection test / passthrough
 *   /api/gateway/local-gguf/*     local GGUF engine
 *
 * This module only talks to models. It never runs tools: computer control
 * goes through the capability engine from the assistant loop, which has the
 * owner session, the step budget and the keyboard-destination rule.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createLocalGgufMiddleware } from '../../backend/gateway/server/local-gguf-middleware.ts';
import { localGgufService } from '../../backend/gateway/server/local-gguf-service.ts';
import { canonicalModelFabric } from '../../packages/model-fabric/index.mjs';

export function setScopedCorsHeaders(req, res) {
  const origin = req.headers?.origin;
  if (origin) {
    if (/^https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/i.test(origin) || origin === 'null') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:18789');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.ZERO_GATEWAY_PORT || '18789', 10);

function getRepoRoot() {
  if (process.env.ZERO_ROOT && fs.existsSync(process.env.ZERO_ROOT)) {
    return path.resolve(process.env.ZERO_ROOT);
  }
  const candidates = [
    path.resolve(__dirname, '..', '..'),
    process.cwd(),
    path.resolve(process.cwd(), '..'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.resolve(c, 'models', 'gateway-providers.json')) || fs.existsSync(path.resolve(c, 'zero-system'))) {
      return c;
    }
  }
  return process.cwd();
}

const REPO_ROOT = getRepoRoot();
const PROVIDERS_CONFIG_FILE = path.resolve(REPO_ROOT, 'models', 'gateway-providers.json');
const DEFAULTS_CONFIG_FILE = path.resolve(REPO_ROOT, 'models', 'gateway-defaults.json');

const localGgufMiddleware = createLocalGgufMiddleware();

/**
 * Resolve upstream provider definition and clean model ID deterministically from gateway-providers.json
 */
function resolveUpstreamProvider(modelId) {
  try {
    if (!fs.existsSync(PROVIDERS_CONFIG_FILE)) return null;
    const raw = fs.readFileSync(PROVIDERS_CONFIG_FILE, 'utf-8');
    const providers = JSON.parse(raw);
    if (!Array.isArray(providers)) return null;

    const norm = String(modelId || '').trim();
    if (!norm) return null;

    for (const p of providers) {
      if (!p || !p.id || p.id === 'zero-gateway' || p.id === 'test-provider' || p.id === 'test_provider') continue;

      // 1. Match by the owner's provider id prefix.
      if (norm.startsWith(`${p.id}/`)) {
        const cleanModelId = norm.slice(p.id.length + 1);
        return { provider: p, cleanModelId };
      }

      // 2. Deterministic match in the provider's own configured model list.
      if (Array.isArray(p.models)) {
        const found = p.models.find((m) => {
          const rawId = typeof m === 'string' ? m : (m.id || m.name);
          if (!rawId) return false;
          return rawId === norm || rawId.replace(/^models\//, '') === norm.replace(/^models\//, '');
        });
        if (found) {
          const rawId = typeof found === 'string' ? found : found.id;
          return { provider: p, cleanModelId: rawId };
        }
      }
    }
  } catch (err) {
    console.error('[Zero Gateway] Error resolving upstream provider:', err.message);
  }
  return null;
}

/**
 * Forward a chat completion request to the provider, streaming when asked.
 */
async function forwardToUpstreamProvider(req, res, providerInfo, body) {
  const { provider, cleanModelId } = providerInfo;
  // Same key resolution as the assistant loop (env references and the
  // provider-specific variable names), so both paths accept the same setup.
  const apiKey = canonicalModelFabric.resolveApiKey(provider) || '';
  const baseUrl = (provider.baseUrl || '').trim().replace(/\/+$/, '');
  const targetUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...(provider.headers || {}),
  };

  const abortController = new AbortController();
  req.on('close', () => {
    if (!res.writableEnded) abortController.abort();
  });

  const fetchWithRetry = async (payloadObj, maxRetries = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const r = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payloadObj),
          signal: abortController.signal,
        });
        if ((r.status === 429 || r.status === 503) && attempt < maxRetries) {
          const delay = 600 * Math.pow(2, attempt);
          console.warn(`[Zero Model Fabric] Upstream status ${r.status}, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        return r;
      } catch (err) {
        if (attempt >= maxRetries) throw err;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  try {
    {
      const payload = { ...body, model: cleanModelId };

      const upstreamRes = await fetchWithRetry(payload);

      if (body.stream === true) {
        res.writeHead(upstreamRes.status, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        if (upstreamRes.body) {
          const reader = upstreamRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
        return true;
      } else {
        const data = await upstreamRes.json();
        if (data?.choices && Array.isArray(data.choices)) {
          for (const ch of data.choices) {
            if (ch?.message) {
              const rContent = ch.message.reasoning_content || ch.message.reasoning || '';
              if ((ch.message.content === null || ch.message.content === '') && rContent) {
                ch.message.content = rContent;
              }
            }
          }
        }
        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return true;
      }
    }

  } catch (err) {
    console.error(`[Zero Gateway] Upstream forward error for ${cleanModelId}:`, err.message);
    if (!res.writableEnded) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { message: `Upstream gateway error: ${err.message}`, type: 'gateway_error' } }));
    }
    return true;
  }
}

/**
 * Universal Proxy Handler for Cloud / Custom Providers
 */
async function handleProxy(req, res) {
  setScopedCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed. Expected POST with proxy payload.' }));
    return;
  }

  const chunks = [];
  req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
  req.on('end', async () => {
    try {
      const rawBody = Buffer.concat(chunks).toString('utf-8');
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const { baseUrl, endpoint, targetUrl, method = 'GET', apiKey, headers: customHeaders, body, stream } = payload;

      let fullDestinationUrl = '';
      if (targetUrl && typeof targetUrl === 'string') {
        fullDestinationUrl = targetUrl.trim();
      } else if (baseUrl && typeof baseUrl === 'string') {
        const cleanBase = baseUrl.trim().replace(/\/+$/, '');
        const cleanEndpoint = (endpoint || '').trim();

        if (cleanEndpoint === '/chat/completions' || cleanEndpoint.endsWith('/chat/completions')) {
          if (cleanBase.endsWith('/chat/completions')) {
            fullDestinationUrl = cleanBase;
          } else if (cleanBase.endsWith('/models')) {
            fullDestinationUrl = `${cleanBase.replace(/\/models$/, '')}/chat/completions`;
          } else {
            fullDestinationUrl = `${cleanBase}/chat/completions`;
          }
        } else if (cleanEndpoint === '/models' || cleanEndpoint.endsWith('/models')) {
          if (cleanBase.endsWith('/models')) {
            fullDestinationUrl = cleanBase;
          } else if (cleanBase.endsWith('/chat/completions')) {
            fullDestinationUrl = `${cleanBase.replace(/\/chat\/completions$/, '')}/models`;
          } else {
            fullDestinationUrl = `${cleanBase}/models`;
          }
        } else if (cleanEndpoint) {
          fullDestinationUrl = `${cleanBase}/${cleanEndpoint.replace(/^\/+/, '')}`;
        } else {
          fullDestinationUrl = cleanBase;
        }
      } else {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing baseUrl or targetUrl in proxy payload' }));
        return;
      }

      // Security validation: Validate proxy destination URL
      let parsedDest;
      try {
        parsedDest = new URL(fullDestinationUrl);
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Invalid proxy destination URL: ${e.message}` }));
        return;
      }

      if (parsedDest.protocol !== 'http:' && parsedDest.protocol !== 'https:') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Proxy protocol must be http: or https:' }));
        return;
      }

      // SSRF Protection: Block dangerous cloud metadata and internal broadcast targets
      const destHost = parsedDest.hostname.toLowerCase();
      if (
        destHost === '169.254.169.254' ||
        destHost === 'metadata.google.internal' ||
        destHost === 'metadata.internal' ||
        destHost.endsWith('.internal') ||
        destHost === '100.100.100.200' ||
        destHost === '0.0.0.0'
      ) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Forbidden: Proxying to internal metadata endpoints is prohibited.' }));
        return;
      }

      const upstreamHeaders = {
        Accept: stream ? 'text/event-stream, application/json, */*' : 'application/json, */*',
        'User-Agent': 'ZeroGateway/1.0 (Enterprise AI Gateway)',
      };

      if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
        upstreamHeaders['Authorization'] = apiKey.trim().startsWith('Bearer ')
          ? apiKey.trim()
          : `Bearer ${apiKey.trim()}`;
      }

      if (customHeaders) {
        if (Array.isArray(customHeaders)) {
          for (const h of customHeaders) {
            if (h && h.key && typeof h.key === 'string' && h.key.trim() !== '') {
              upstreamHeaders[h.key.trim()] = String(h.value ?? '');
            }
          }
        } else if (typeof customHeaders === 'object') {
          for (const [k, v] of Object.entries(customHeaders)) {
            if (k && k.trim() !== '') {
              upstreamHeaders[k.trim()] = String(v ?? '');
            }
          }
        }
      }

      let upstreamBodyStr = undefined;
      if (body !== undefined && body !== null && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        upstreamHeaders['Content-Type'] = 'application/json';
        upstreamBodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const abortController = new AbortController();
      res.on('close', () => {
        if (!res.writableEnded) abortController.abort();
      });

      const upstreamRes = await fetch(fullDestinationUrl, {
        method,
        headers: upstreamHeaders,
        body: upstreamBodyStr,
        signal: abortController.signal,
      });

      const contentType = upstreamRes.headers.get('content-type') || '';

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text().catch(() => '');
        let parsedErr = null;
        try {
          parsedErr = JSON.parse(errText);
        } catch (_) {}

        let message = '';
        if (parsedErr) {
          message =
            parsedErr.error?.message ||
            parsedErr.message ||
            parsedErr.detail ||
            (typeof parsedErr.error === 'string' ? parsedErr.error : JSON.stringify(parsedErr));
        } else {
          message = errText || upstreamRes.statusText || 'Upstream request failed';
        }

        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            status: upstreamRes.status,
            statusText: upstreamRes.statusText,
            error: message,
            details: parsedErr || errText,
          })
        );
        return;
      }

      const isStreaming = stream || contentType.includes('text/event-stream');
      if (isStreaming && upstreamRes.body) {
        res.writeHead(upstreamRes.status, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        const reader = upstreamRes.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!res.writableEnded) res.write(value);
          }
        } catch (_) {
        } finally {
          if (!res.writableEnded) res.end();
        }
        return;
      }

      const arrayBuf = await upstreamRes.arrayBuffer();
      res.statusCode = upstreamRes.status;
      res.setHeader('Content-Type', contentType || 'application/json');
      res.end(Buffer.from(arrayBuf));
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 500, error: `Proxy Error: ${err.message || 'Connection failed'}` }));
      }
    }
  });
}

/**
 * Standard OpenAI-Compatible /v1/chat/completions Endpoint
 */
async function handleChatCompletions(req, res, options = {}) {
  setScopedCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const rawBody = Buffer.concat(chunks).toString('utf-8');
    let body = {};
    if (rawBody.trim()) {
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid JSON: ' + e.message }));
        return;
      }
    }

    let defaultPrimaryModel = '';
    try {
      if (fs.existsSync(DEFAULTS_CONFIG_FILE)) {
        const d = JSON.parse(fs.readFileSync(DEFAULTS_CONFIG_FILE, 'utf-8'));
        if (d?.defaults?.primary) defaultPrimaryModel = d.defaults.primary;
      }
    } catch {}
    const modelId = body.model || body.modelId || defaultPrimaryModel;
    const assistantMode = body.zeroAssistant === true || body.zero?.execute === true || /^true$/i.test(String(req.headers['x-zero-assistant'] || ''));
    if (assistantMode && typeof options.runAssistantRequest === 'function') {
      const messages = body.messages || [];
      const lastUser = [...messages].reverse().find(message => message?.role === 'user');
      const prompt = typeof lastUser?.content === 'string'
        ? lastUser.content
        : Array.isArray(lastUser?.content)
          ? lastUser.content.map(part => typeof part === 'string' ? part : part?.text || '').filter(Boolean).join('\n')
          : '';
      if (!prompt.trim()) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'zeroAssistant requires a user message' }));
        return;
      }
      const sessionKey = String(body.session_id || body.sessionKey || `http-${crypto.randomUUID()}`);
      const result = await options.runAssistantRequest({
        sessionKey,
        userContent: prompt,
        model: body.model,
        source: 'http',
        runId: body.idempotency_key || body.idempotencyKey,
      });
      const content = typeof result?.content === 'string' ? result.content : '';
      if (body.stream === true) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.write(`data: ${JSON.stringify({ id: `chatcmpl_${Date.now()}`, object: 'chat.completion.chunk', choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }] })}\n\n`);
        res.write(`data: ${JSON.stringify({ id: `chatcmpl_${Date.now()}`, object: 'chat.completion.chunk', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\n`);
        res.end('data: [DONE]\n\n');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          id: `chatcmpl_${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: body.model || 'zero-auto',
          choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
          zero: { sessionKey, taskId: result?.taskId, execution: result?.execution || null },
        }));
      }
      return;
    }
    if (!modelId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No model configured. Add a provider and model in Settings → Models.' }));
      return;
    }
    const messages = body.messages || [];
    const stream = body.stream === true;

    // 1. Check if model is a local GGUF model
    const localModels = await localGgufService.scanModels();
    const isLocal = localModels.some((m) => m.id === modelId || m.name === modelId || m.filename === modelId);

    if (isLocal) {
      // Route to Local GGUF Inference Engine
      const abortController = new AbortController();
      req.on('close', () => {
        if (!res.writableEnded) abortController.abort();
      });

      await localGgufService.scheduleRequest(modelId, async () => {
        await localGgufService.executeChat(
          modelId,
          messages,
          {
            stream,
            temperature: body.temperature,
            maxTokens: body.max_tokens || body.maxTokens,
            top_p: body.top_p,
            stop: body.stop,
            tools: body.tools,
            toolChoice: body.tool_choice,
            reasoningEnabled: body.reasoningEnabled !== undefined ? body.reasoningEnabled : body.reasoning,
            signal: abortController.signal,
          },
          res
        );
      });
      return;
    }

    // 2. Forward to the configured provider. Tools are passed through only
    // when the caller sent them; this endpoint never adds or runs tools.
    const upstreamInfo = resolveUpstreamProvider(modelId);
    if (!upstreamInfo || !upstreamInfo.provider) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Model '${modelId}' not found or no provider configured.` }));
      return;
    }
    const handled = await forwardToUpstreamProvider(req, res, upstreamInfo, body);
    if (!handled && !res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Upstream provider failed to process completion.' }));
    }
    return;
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Internal Gateway Error' }));
    }
  }
}

/**
 * Standard OpenAI-Compatible /v1/models Listing Endpoint
 */
async function handleListModels(req, res) {
  setScopedCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Include local GGUF models
  const localModels = await localGgufService.scanModels();
  const models = localModels.map((m) => ({
    id: m.id,
    object: 'model',
    created: Math.floor((m.loadedAt || Date.now()) / 1000),
    owned_by: 'zero-gateway',
    name: m.name,
    capabilities: m.capabilities,
    companionProjector: m.companionProjector,
  }));

  // Also include configured cloud providers' models if present from models/gateway-providers.json
  try {
    const configPath = PROVIDERS_CONFIG_FILE;
    if (fs.existsSync(configPath)) {
      const providers = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (Array.isArray(providers)) {
        for (const p of providers) {
          if (Array.isArray(p.models)) {
            for (const m of p.models) {
              const modelId = typeof m === 'string' ? m : (m.id || m.name);
              const modelName = typeof m === 'object' && m.name ? m.name : modelId;
              if (modelId && !models.some(existing => existing.id === modelId)) {
                models.push({
                  id: modelId,
                  object: 'model',
                  created: Math.floor(Date.now() / 1000),
                  owned_by: p.id || p.name || 'cloud-provider',
                  name: modelName,
                  capabilities: {
                    reasoning: typeof m === 'object' && typeof m.reasoning === 'boolean' ? m.reasoning : true,
                    image: typeof m === 'object' && typeof m.image === 'boolean' ? m.image : false,
                    tools: typeof m === 'object' && typeof m.tools === 'boolean' ? m.tools : true,
                    embedding: typeof m === 'object' && typeof m.embedding === 'boolean' ? m.embedding : false,
                    ...(typeof m === 'object' && m.capabilities ? m.capabilities : {}),
                  }
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Zero Gateway] Note loading gateway-providers.json:', err.message);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ object: 'list', data: models }));
}

/**
 * Spaces State Management
 */
const spacesState = {
  activeSpace: 'coder',
  spaces: {
    coder: {
      id: 'coder',
      name: 'Coder Space',
      icon: '💻',
      description: 'Code generation, git diff inspection & terminal execution',
      files: [],
      openDiffs: [],
      terminalHistory: [],
      status: 'ready',
    },
    media: {
      id: 'media',
      name: 'Media Space',
      icon: '🎬',
      description: 'Screen & video observation, YouTube analysis, audio transcription',
      recentMediaLogs: [],
      status: 'ready',
    },
    research: {
      id: 'research',
      name: 'Research Space',
      icon: '🔍',
      description: 'Deep web research, synthesis, and verified sources carousel',
      sources: [],
      status: 'ready',
    },
  },
};

/**
 * Handles a request for one of this module's routes. Returns false when the
 * path is not one of them, so the host can continue with its own routes.
 */
export async function handleModelHttpRequest(req, res, options = {}) {
  const host = req.headers?.host;
  if (host) {
    const hostWithoutPort = host.replace(/:\d+$/, '').trim().toLowerCase();
    const isLoopbackHost = hostWithoutPort === '127.0.0.1' || hostWithoutPort === 'localhost' || hostWithoutPort === '[::1]' || hostWithoutPort === '::1';
    if (!isLoopbackHost) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { message: 'Forbidden: invalid host header (DNS rebinding protection)', code: 403 } }));
      return true;
    }
  }

  const origin = req.headers?.origin;
  if (origin && origin !== 'null') {
    let isLoopbackOrigin = false;
    try {
      const parsed = new URL(origin);
      const h = parsed.hostname.toLowerCase();
      isLoopbackOrigin = h === '127.0.0.1' || h === 'localhost' || h === '::1' || h === '[::1]';
    } catch (_) {}
    if (!isLoopbackOrigin) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { message: 'Forbidden: untrusted origin', code: 403 } }));
      return true;
    }
  }

  const url = req.url || '/';
  const pathname = url.split('?')[0];

  // 1. Health, Liveness, Readiness & Feature Endpoints
  if (pathname === '/health' || pathname === '/health/liveness' || pathname === '/health/readiness' || pathname === '/health/features') {
    setScopedCorsHeaders(req, res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');

    if (pathname === '/health/liveness') {
      res.end(JSON.stringify({
        status: 'live',
        runtime: 'zero-native',
        uptime: process.uptime(),
        pid: process.pid,
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: Date.now(),
      }));
      return true;
    }

    if (pathname === '/health/readiness') {
      res.end(JSON.stringify({
        status: 'ready',
        runtime: 'zero-native',
        port: PORT,
        services: {
          gateway: 'ready',
          modelFabric: 'ready',
          capabilityEngine: 'ready',
          sessionStore: 'ready',
          taskStore: 'ready',
        },
        timestamp: Date.now(),
      }));
      return true;
    }

    if (pathname === '/health/features') {
      res.end(JSON.stringify({
        status: 'ok',
        features: {
          models: { active: true, streaming: true, localGguf: true, cloudProviders: true },
          agents: { active: true, delegation: true, teams: true, leaseLock: true },
          computer: { active: true, platform: 'win32', automation: ['uia', 'dom', 'user32'] },
          memory: { active: true, store: 'sqlite-wal' },
          automation: { active: true, scheduler: 'durable-cron' },
          skills: { active: true, nativeCount: 11 },
          plugins: { active: true, nativeSdk: true },
          voice: { active: false, plannedPhase: 15 },
          screen: { active: true, rollingBuffer: true, changeDetection: true, persistentMemory: true },
        },
        timestamp: Date.now(),
      }));
      return true;
    }

    res.end(JSON.stringify({ status: 'ok', gateway: 'zero-gateway', runtime: 'zero-native', version: '1.0.0', port: PORT }));
    return true;
  }

  // 2. OpenAI-compatible /v1/chat/completions
  if (pathname === '/v1/chat/completions') {
    await handleChatCompletions(req, res, options);
    return true;
  }

  // 3. OpenAI-compatible /v1/models
  if (pathname === '/v1/models' || pathname.startsWith('/v1/models/')) {
    await handleListModels(req, res);
    return true;
  }

  // 4. Provider Proxy /api/gateway/proxy
  if (pathname === '/api/gateway/proxy') {
    await handleProxy(req, res);
    return true;
  }

  // 5. Local GGUF Engine /api/gateway/local-gguf/*
  if (pathname.startsWith('/api/gateway/local-gguf')) {
    await localGgufMiddleware(req, res);
    return true;
  }

  return false;
}
