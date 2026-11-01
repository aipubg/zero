#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGatewayConfigMiddleware,
  createLocalGgufMiddleware,
} from './server/local-gguf-middleware.ts';
import { localGgufService } from './server/local-gguf-service.ts';
import { modeManager } from '../../rules/mode-manager.mjs';
import { ComputerOperator } from '../../app/zero-control-ui/src/computer/operator.js';
import { canonicalCapabilityEngine } from '../../packages/capability-engine/index.mjs';
import { TaskStateMachine, TASK_STATUS } from '../../packages/agent-runtime/index.mjs';
import { AutomationScheduler } from '../../packages/automation/index.mjs';
import { PersistentMemoryStore } from '../../packages/memory/index.mjs';

const gatewayOperator = new ComputerOperator();

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
const HOST = '127.0.0.1';

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

const configMiddleware = createGatewayConfigMiddleware();
const localGgufMiddleware = createLocalGgufMiddleware();

let taskDbPath = ':memory:';
let memoryDbPath = ':memory:';
let automationDbPath = ':memory:';
try {
  const dataDir = path.resolve(REPO_ROOT, '.zero-data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  taskDbPath = path.resolve(dataDir, 'zero-tasks.sqlite');
  memoryDbPath = path.resolve(dataDir, 'zero-memory.sqlite');
  automationDbPath = path.resolve(dataDir, 'zero-automation.sqlite');
} catch (_) {}
export const taskStateMachine = new TaskStateMachine({ dbPath: taskDbPath });
export const persistentMemoryStore = new PersistentMemoryStore({ dbPath: memoryDbPath });
export const automationScheduler = new AutomationScheduler({
  dbPath: automationDbPath,
  executor: async (action, params) => {
    return canonicalCapabilityEngine.execute(action, params);
  },
});

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

      // 1. Match by prefix: e.g. "nv/nvidia/nemotron-..." or "nv/nemotron-..."
      if (norm.startsWith(`${p.id}/`)) {
        const cleanModelId = norm.slice(p.id.length + 1);
        return { provider: p, cleanModelId };
      }

      // 2. Deterministic match in p.models:
      if (Array.isArray(p.models)) {
        const found = p.models.find((m) => {
          const rawId = typeof m === 'string' ? m : (m.id || m.name);
          if (!rawId) return false;
          return (
            rawId === norm ||
            rawId === `nvidia/${norm}` ||
            `nvidia/${rawId}` === norm ||
            (rawId.startsWith('nvidia/') && norm === rawId.replace(/^nvidia\//, '')) ||
            (norm.startsWith('nvidia/') && rawId === norm.replace(/^nvidia\//, ''))
          );
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
 * Forward chat completion requests to upstream provider with streaming support and autonomous tool execution
 */
async function forwardToUpstreamProvider(req, res, providerInfo, body, callerProvidedTools = false) {
  const { provider, cleanModelId } = providerInfo;
  let apiKey = provider.apiKey || (Array.isArray(provider.apiKeys) ? provider.apiKeys[0] : '');

  // Resolve secure environment variable credentials if not in JSON or using env: prefix
  if (!apiKey || apiKey.startsWith('env:')) {
    const envKey = apiKey.startsWith('env:') ? apiKey.slice(4) : (provider.id.toUpperCase() + '_API_KEY');
    apiKey = process.env[envKey] || process.env.NVIDIA_API_KEY || process.env.ZERO_GATEWAY_KEY || process.env.OPENAI_API_KEY || apiKey;
  }
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
    // If caller provided tools or requested direct streaming, delegate directly to upstream provider
    if (callerProvidedTools || body.stream === true) {
      const payload = {
        ...body,
        model: cleanModelId,
      };
      if (!callerProvidedTools && body.stream === true) {
        delete payload.tools;
      }

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
        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return true;
      }
    }

    // Caller did NOT provide tools: Gateway acts as autonomous agent runtime!
    // Execute model-driven tool calls in a loop until the model outputs final response.
    let currentMessages = [...(body.messages || [])];
    let turns = 0;
    const maxTurns = 5;
    let finalContent = '';
    let mediaResult = null;
    const executedActions = [];

    while (turns < maxTurns) {
      turns++;
      const payload = {
        ...body,
        model: cleanModelId,
        messages: currentMessages,
        stream: false, // Turn-by-turn tool inspection is handled synchronously
      };

      const upstreamRes = await fetchWithRetry(payload);
      if (!upstreamRes.ok) {
        const errData = await upstreamRes.json().catch(() => ({}));
        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(errData));
        return true;
      }

      const data = await upstreamRes.json();
      const choice = data.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        finalContent = choice?.message?.content || '';
        break;
      }

      // Record assistant message with tool_calls in message history
      currentMessages.push(choice.message);

      for (const call of toolCalls) {
        const fnName = call.function?.name || '';
        let args = {};
        try {
          args = typeof call.function?.arguments === 'string' ? JSON.parse(call.function.arguments) : (call.function?.arguments || {});
        } catch {}

        let action = args.action || fnName;
        if (fnName === 'open_app' || fnName === 'launch_app') action = 'open_app';
        if (fnName === 'browser' || fnName === 'open_browser') {
          action = args.action || (args.query ? 'play' : 'open_url');
        }

        console.log(`[Zero Model Fabric] Model called tool '${fnName}' -> executing action '${action}' with args:`, args);
        const execRes = await gatewayOperator.execute(action, args);
        executedActions.push({ action, args, execRes });

        if (action === 'play' && execRes.ok) {
          mediaResult = execRes;
        }

        currentMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(execRes),
        });
      }
    }

    // If a media action was executed and media card is not in output, append zero-ui:media card
    if (mediaResult && !finalContent.includes('zero-ui:media')) {
      const mediaPayload = {
        title: mediaResult.videoTitle || 'YouTube Music',
        videoId: mediaResult.videoId || '',
        url: mediaResult.url || (mediaResult.videoId ? `https://www.youtube.com/watch?v=${mediaResult.videoId}` : 'https://www.youtube.com'),
        thumbnail: mediaResult.thumbnail || (mediaResult.videoId ? `https://i.ytimg.com/vi/${mediaResult.videoId}/hqdefault.jpg` : ''),
        status: 'playing',
        artist: 'YouTube Music',
        details: `Active Window: ${mediaResult.window?.title || 'YouTube'}`,
      };
      finalContent = (finalContent ? `${finalContent}\n\n` : '') + `\`\`\`\`zero-ui:media\n${JSON.stringify(mediaPayload, null, 2)}\n\`\`\`\``;
    }

    // If desktop actions were executed and progress card is not in output, append zero-ui:progress card
    if (executedActions.length > 0 && !finalContent.includes('zero-ui:progress')) {
      const progressPayload = {
        title: 'Zero Computer Execution',
        step: executedActions.length,
        totalSteps: executedActions.length,
        status: 'completed',
        details: executedActions[executedActions.length - 1]?.execRes?.window?.title || 'Desktop Action Completed',
        logs: executedActions.map((a) => `✔ ${a.action} (${a.execRes.ok ? 'OK' : 'failed'})`),
      };
      finalContent = (finalContent ? `${finalContent}\n\n` : '') + `\`\`\`\`zero-ui:progress\n${JSON.stringify(progressPayload, null, 2)}\n\`\`\`\``;
    }

    return sendCompletionResponse(res, cleanModelId, finalContent, body.stream);
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
 * Send OpenAI-compatible chat completion response (supports SSE streaming and JSON)
 */
function sendCompletionResponse(res, modelId, content, stream) {
  if (stream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const chunkPayload = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }],
    };
    res.write(`data: ${JSON.stringify(chunkPayload)}\n\n`);

    const donePayload = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    };
    res.write(`data: ${JSON.stringify(donePayload)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } else {
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
            message: { role: 'assistant', content },
            finish_reason: 'stop',
          },
        ],
      })
    );
  }
  return true;
}

/**
 * Standard OpenAI-Compatible /v1/chat/completions Endpoint
 */
async function handleChatCompletions(req, res) {
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

    let defaultPrimaryModel = 'nv/nvidia/nemotron-3.5-lightning-30b-a3b';
    try {
      if (fs.existsSync(DEFAULTS_CONFIG_FILE)) {
        const d = JSON.parse(fs.readFileSync(DEFAULTS_CONFIG_FILE, 'utf-8'));
        if (d?.defaults?.primary) defaultPrimaryModel = d.defaults.primary;
      }
    } catch {}
    const modelId = body.model || body.modelId || defaultPrimaryModel;
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

    // 2. Inject desktop automation tools if not provided
    const DESKTOP_TOOLS = [
      {
        type: 'function',
        function: {
          name: 'zero_computer_action',
          description: 'Directly execute Windows OS computer actions: open_app (e.g. "notepad", "calc"), open_url, play (search and play music/song/video on YouTube), type_text, press_key, mouse_move, left_click, list_windows, list_apps, get_window_state, get_screen_size.',
          parameters: {
            type: 'object',
            required: ['action'],
            properties: {
              action: {
                type: 'string',
                enum: ['open_app', 'launch_app', 'type_text', 'play', 'browser', 'open_url', 'press_key', 'mouse_move', 'left_click', 'list_windows', 'list_apps', 'get_window_state', 'get_screen_size'],
              },
              app: { type: 'string', description: 'Application name or path to open (e.g. "notepad")' },
              text: { type: 'string', description: 'Text to type into the focused window' },
              query: { type: 'string', description: 'Search term or song name to search and play on YouTube' },
              url: { type: 'string', description: 'URL to open in default browser' },
              key: { type: 'string', description: 'Key or shortcut to press (e.g. "enter", "alt+f4")' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'browser',
          description: 'Control web browser on Windows: open URLs, search and play songs/videos on YouTube.',
          parameters: {
            type: 'object',
            required: ['action'],
            properties: {
              action: { type: 'string', enum: ['open', 'play', 'navigate', 'search'] },
              query: { type: 'string', description: 'Song or video name to play on YouTube' },
              url: { type: 'string', description: 'Web URL' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'open_app',
          description: 'Launch an application on Windows desktop (e.g. "notepad", "calc", "chrome").',
          parameters: {
            type: 'object',
            required: ['app'],
            properties: {
              app: { type: 'string', description: 'Application name (e.g. "notepad")' },
            },
          },
        },
      },
    ];

    const callerProvidedTools = Array.isArray(body.tools) && body.tools.length > 0;
    if (!callerProvidedTools) {
      if (body.stream !== true) {
        body.tools = [...DESKTOP_TOOLS];
      }
    } else {
      for (const dt of DESKTOP_TOOLS) {
        if (!body.tools.some((t) => t?.function?.name === dt.function.name)) {
          body.tools.push(dt);
        }
      }
    }

    // 3. Forward real user requests to upstream Zero Model Fabric with real tool execution
    const upstreamInfo = resolveUpstreamProvider(modelId);
    if (!upstreamInfo || !upstreamInfo.provider) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Model '${modelId}' not found or no provider configured.` }));
      return;
    }
    const handled = await forwardToUpstreamProvider(req, res, upstreamInfo, body, callerProvidedTools);
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
                  capabilities: { reasoning: true, image: false, tools: true, embedding: false }
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

function handleSpacesApi(req, res) {
  setScopedCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = req.url || '';
  const pathname = url.split('?')[0];

  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(spacesState));
    return;
  }

  if (req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        if (pathname === '/api/gateway/spaces/active') {
          if (body.spaceId && spacesState.spaces[body.spaceId]) {
            spacesState.activeSpace = body.spaceId;
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, activeSpace: spacesState.activeSpace }));
            return;
          }
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Invalid spaceId' }));
          return;
        }

        if (pathname === '/api/gateway/spaces/update') {
          const { spaceId, updates } = body;
          if (spaceId && spacesState.spaces[spaceId]) {
            spacesState.spaces[spaceId] = { ...spacesState.spaces[spaceId], ...updates };
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, space: spacesState.spaces[spaceId] }));
            return;
          }
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Invalid spaceId' }));
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end();
}

function handleModeApi(req, res) {
  setScopedCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ mode: modeManager.getMode(), policy: modeManager.getPolicy() }));
    return;
  }

  if (req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        if (body.mode) {
          const result = modeManager.setMode(body.mode);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
          return;
        }
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'mode is required' }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end();
}

/**
 * Interactive Media Control API Endpoint (/api/zero/media)
 */
async function handleMediaControlApi(req, res) {
  setScopedCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        const action = body.action || body.command || 'play_pause';
        console.log(`[Zero Gateway] /api/zero/media received action: ${action}`);

        if (action === 'bailout') {
          gatewayOperator.stopExecution();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, status: 'stopped' }));
          return;
        }

        const result = await gatewayOperator.execute('media_control', { command: action });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, action, result }));
      } catch (err) {
        console.warn('[Zero Gateway] /api/zero/media error:', err.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // GET returns current active window/media status
  try {
    const winState = await gatewayOperator.execute('get_window_state');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, window: winState.window }));
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, status: 'idle' }));
  }
}

/**
 * Autonomous Computer Control API Endpoint (/api/zero/computer)
 */
async function handleComputerControlApi(req, res) {
  setScopedCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        const action = body.action;
        const params = body.params || {};
        console.log(`[Zero Gateway] /api/zero/computer executing action: ${action}`);

        const result = await gatewayOperator.execute(action, params);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, action, result }));
      } catch (err) {
        console.warn('[Zero Gateway] /api/zero/computer error:', err.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end();
}

/**
 * Zero Agent Task Inspection API Endpoint (/api/zero/tasks)
 */
async function handleTasksApi(req, res) {
  setScopedCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://127.0.0.1:18789');
  const pathname = parsedUrl.pathname;
  const parts = pathname.split('/').filter(Boolean); // ['api', 'zero', 'tasks', ...]

  // GET /api/zero/tasks - List tasks
  if (req.method === 'GET' && parts.length === 3) {
    const sessionId = parsedUrl.searchParams.get('sessionId') || undefined;
    const agentId = parsedUrl.searchParams.get('agentId') || undefined;
    const status = parsedUrl.searchParams.get('status') || undefined;
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(parsedUrl.searchParams.get('offset') || '0', 10);

    const tasks = taskStateMachine.listTasks({ sessionId, agentId, status, limit, offset });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, count: tasks.length, tasks }));
    return;
  }

  // POST /api/zero/tasks - Create task
  if (req.method === 'POST' && parts.length === 3) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        if (!body.goal) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Field "goal" is required' }));
          return;
        }
        const task = taskStateMachine.createTask({
          id: body.id,
          sessionId: body.sessionId || 'default',
          agentId: body.agentId || 'zero',
          goal: body.goal,
          parentTaskId: body.parentTaskId || null,
        });
        if (body.autoStart) {
          taskStateMachine.enqueueTask(task.id);
          taskStateMachine.startTask(task.id);
        }
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, task: taskStateMachine.getTask(task.id) }));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // GET /api/zero/tasks/:id - Inspect task with execution steps
  if (req.method === 'GET' && parts.length === 4) {
    const taskId = parts[3];
    const task = taskStateMachine.getTask(taskId);
    if (!task) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: `Task '${taskId}' not found` }));
      return;
    }
    const steps = taskStateMachine.getTaskSteps(taskId);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, task, steps }));
    return;
  }

  // POST /api/zero/tasks/:id/cancel
  if (req.method === 'POST' && parts.length === 5 && parts[4] === 'cancel') {
    const taskId = parts[3];
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        const updated = taskStateMachine.cancelTask(taskId, body.reason || 'Cancelled via API');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, task: updated }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // POST /api/zero/tasks/:id/resume
  if (req.method === 'POST' && parts.length === 5 && parts[4] === 'resume') {
    const taskId = parts[3];
    try {
      const updated = taskStateMachine.resumeTask(taskId);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, task: updated }));
    } catch (err) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  res.statusCode = 405;
  res.end();
}

/**
 * Zero Memory Store API (/api/zero/memory)
 */
async function handleMemoryApi(req, res) {
  setScopedCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://127.0.0.1:18789');
  const pathname = parsedUrl.pathname;
  const parts = pathname.split('/').filter(Boolean); // ['api', 'zero', 'memory', ...]

  // GET /api/zero/memory - Recall or List memories
  if (req.method === 'GET' && parts.length === 3) {
    const query = parsedUrl.searchParams.get('query') || '';
    const category = parsedUrl.searchParams.get('category') || undefined;
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '20', 10);
    const offset = parseInt(parsedUrl.searchParams.get('offset') || '0', 10);

    let memories;
    if (query) {
      memories = persistentMemoryStore.recall(query, { category, limit });
    } else {
      memories = persistentMemoryStore.listMemories({ category, limit, offset });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, count: memories.length, memories }));
    return;
  }

  // POST /api/zero/memory - Store/remember
  if (req.method === 'POST' && parts.length === 3) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        if (!body.content) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Field "content" is required' }));
          return;
        }
        const memory = persistentMemoryStore.remember({
          id: body.id,
          category: body.category,
          content: body.content,
          tags: body.tags,
          source: body.source,
          confidence: body.confidence,
        });
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, memory }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // DELETE /api/zero/memory/:id - Forget memory
  if (req.method === 'DELETE' && parts.length === 4) {
    const memId = parts[3];
    try {
      persistentMemoryStore.forget(memId);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, id: memId }));
    } catch (err) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  res.statusCode = 405;
  res.end();
}

/**
 * Zero Durable Automation & Cron API (/api/zero/automation/...)
 */
async function handleAutomationApi(req, res) {
  setScopedCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://127.0.0.1:18789');
  const pathname = parsedUrl.pathname;
  const parts = pathname.split('/').filter(Boolean); // ['api', 'zero', 'automation', ...]

  // GET /api/zero/automation/jobs - List recurring jobs
  if (req.method === 'GET' && parts.length === 4 && parts[3] === 'jobs') {
    const jobs = automationScheduler.listJobs();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, count: jobs.length, jobs }));
    return;
  }

  // POST /api/zero/automation/jobs - Register recurring job
  if (req.method === 'POST' && parts.length === 4 && parts[3] === 'jobs') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        if (!body.title || !body.cronExpr || !body.targetAction) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Fields "title", "cronExpr", and "targetAction" are required' }));
          return;
        }
        const job = automationScheduler.registerJob(body);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, job }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // POST /api/zero/automation/jobs/:id/toggle - Toggle job enabled state
  if (req.method === 'POST' && parts.length === 6 && parts[3] === 'jobs' && parts[5] === 'toggle') {
    const jobId = parts[4];
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        const enabled = body.enabled !== undefined ? Boolean(body.enabled) : true;
        const job = automationScheduler.toggleJob(jobId, enabled);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, job }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // DELETE /api/zero/automation/jobs/:id - Delete recurring job
  if (req.method === 'DELETE' && parts.length === 5 && parts[3] === 'jobs') {
    const jobId = parts[4];
    try {
      const deleted = automationScheduler.deleteJob(jobId);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, deleted, id: jobId }));
    } catch (err) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // POST /api/zero/automation/trigger - Trigger due jobs manually
  if (req.method === 'POST' && parts.length === 4 && parts[3] === 'trigger') {
    try {
      const results = await automationScheduler.triggerDueJobs();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, executedCount: results.triggeredCount, runs: results.runs }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // GET /api/zero/automation/runs - List execution history
  if (req.method === 'GET' && parts.length === 4 && parts[3] === 'runs') {
    const jobId = parsedUrl.searchParams.get('jobId') || undefined;
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '50', 10);
    const runs = automationScheduler.listRuns({ jobId, limit });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, count: runs.length, runs }));
    return;
  }

  res.statusCode = 405;
  res.end();
}

/**
 * Handle Zero Gateway requests directly when embedded in port 18789 (Single Port Architecture)
 */
export async function handleZeroGatewayRequest(req, res) {
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
          agents: { active: true, delegation: true },
          computer: { active: true, platform: 'win32', automation: ['uia', 'dom', 'user32'] },
          memory: { active: true, store: 'sqlite-wal' },
          automation: { active: true, scheduler: 'durable-cron' },
          skills: { active: true, nativeCount: 11 },
          plugins: { active: true, nativeSdk: true },
          voice: { active: false, plannedPhase: 15 },
          screen: { active: false, plannedPhase: 8 },
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
    await handleChatCompletions(req, res);
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

  // 5. Provider Config Vault /api/gateway/config
  if (pathname === '/api/gateway/config') {
    await configMiddleware(req, res);
    return true;
  }

  // 6. Local GGUF Engine /api/gateway/local-gguf/*
  if (pathname.startsWith('/api/gateway/local-gguf')) {
    await localGgufMiddleware(req, res);
    return true;
  }

  // 7. Spaces API /api/gateway/spaces
  if (pathname.startsWith('/api/gateway/spaces')) {
    await handleSpacesApi(req, res);
    return true;
  }

  // 8. Policy Mode API /api/gateway/mode
  if (pathname.startsWith('/api/gateway/mode')) {
    await handleModeApi(req, res);
    return true;
  }

  // 9. Interactive Media Control API /api/zero/media
  if (pathname === '/api/zero/media') {
    await handleMediaControlApi(req, res);
    return true;
  }

  // 10. Autonomous Computer Control API /api/zero/computer
  if (pathname === '/api/zero/computer') {
    await handleComputerControlApi(req, res);
    return true;
  }

  // 11. Zero Agent Task Inspection API /api/zero/tasks
  if (pathname === '/api/zero/tasks' || pathname.startsWith('/api/zero/tasks/')) {
    await handleTasksApi(req, res);
    return true;
  }

  // 12. Zero Memory Store API /api/zero/memory
  if (pathname === '/api/zero/memory' || pathname.startsWith('/api/zero/memory/')) {
    await handleMemoryApi(req, res);
    return true;
  }

  // 13. Zero Durable Automation API /api/zero/automation
  if (pathname.startsWith('/api/zero/automation')) {
    await handleAutomationApi(req, res);
    return true;
  }

  return false;
}

/**
 * Main HTTP Server Request Router (Standalone fallback)
 */
const server = http.createServer(async (req, res) => {
  const handled = await handleZeroGatewayRequest(req, res);
  if (handled) return;

  const url = req.url || '/';
  const pathname = url.split('?')[0];

  // Static UI Bundle from dist
  if (pathname === '/' || pathname === '/index.html') {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      setScopedCorsHeaders(req, res);
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
  }

  if (pathname.startsWith('/assets/')) {
    const safePath = path.join(__dirname, 'dist', pathname.slice(1));
    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath).toLowerCase();
      const mimeTypes = {
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.json': 'application/json',
      };
      res.statusCode = 200;
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      setScopedCorsHeaders(req, res);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Clear-Site-Data', '"cache"');
      fs.createReadStream(safePath).pipe(res);
      return;
    }
  }

  // 404 Fallback
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: `Not Found: ${pathname}` }));
});

const isStandalone = process.env.ZERO_GATEWAY_STANDALONE === '1' || (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]));
if (isStandalone && !process.env.ZERO_EMBEDDED_GATEWAY) {
  server.listen(PORT, HOST, () => {
    console.log(`[Zero Gateway] Enterprise AI Gateway listening on http://${HOST}:${PORT}`);
    console.log(`[Zero Gateway] OpenAI API: http://${HOST}:${PORT}/v1/chat/completions`);
    console.log(`[Zero Gateway] Models: http://${HOST}:${PORT}/v1/models`);
    console.log(`[Zero Gateway] Health: http://${HOST}:${PORT}/health`);
  });
}

export { server };
