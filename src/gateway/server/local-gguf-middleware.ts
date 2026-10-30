import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { localGgufService, type PipelineProgressEvent } from './local-gguf-service.ts';

/**
 * Creates connect/express/vite compatible middleware for the Backend Persistent Config Vault
 * Route: /api/gateway/config
 */
export function createGatewayConfigMiddleware() {
  const configFile = path.resolve(process.cwd(), 'models', 'gateway-providers.json');
  const defaultsFile = path.resolve(process.cwd(), 'models', 'gateway-defaults.json');
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === 'GET') {
      try {
        let providers = [];
        let defaults = null;
        let agentBindings = null;

        if (fs.existsSync(configFile)) {
          const raw = await fs.promises.readFile(configFile, 'utf-8');
          providers = JSON.parse(raw);
        }
        if (fs.existsSync(defaultsFile)) {
          const rawDef = await fs.promises.readFile(defaultsFile, 'utf-8');
          const parsed = JSON.parse(rawDef);
          defaults = parsed.defaults || null;
          agentBindings = parsed.agentBindings || null;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, providers, defaults, agentBindings }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Failed to read provider configuration file' }));
      }
      return;
    }

    if (req.method === 'POST') {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const text = Buffer.concat(chunks).toString('utf-8');
        const body = text ? JSON.parse(text) : {};
        const providers = Array.isArray(body) ? body : body.providers;
        const defaults = body.defaults;
        const agentBindings = body.agentBindings;

        if (Array.isArray(providers)) {
          const dir = path.dirname(configFile);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          await fs.promises.writeFile(configFile, JSON.stringify(providers, null, 2), 'utf-8');
        }

        if (defaults || agentBindings) {
          const dir = path.dirname(defaultsFile);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          let existing = {};
          if (fs.existsSync(defaultsFile)) {
            try {
              existing = JSON.parse(await fs.promises.readFile(defaultsFile, 'utf-8'));
            } catch {}
          }
          const merged = {
            ...existing,
            ...(defaults ? { defaults } : {}),
            ...(agentBindings ? { agentBindings } : {}),
          };
          await fs.promises.writeFile(defaultsFile, JSON.stringify(merged, null, 2), 'utf-8');
        }

        // Read all active providers from request or disk
        let activeProvidersList: any[] = [];
        if (Array.isArray(providers)) {
          activeProvidersList = providers;
        } else if (fs.existsSync(configFile)) {
          try {
            activeProvidersList = JSON.parse(await fs.promises.readFile(configFile, 'utf-8'));
          } catch {}
        }

        // Compute all valid model IDs across active providers
        const validModelIds = new Set<string>();
        for (const p of activeProvidersList) {
          if (!p || !p.id || p.id === 'zero-gateway' || p.id === 'test-provider' || p.id === 'test_provider') continue;
          for (const m of (Array.isArray(p.models) ? p.models : [])) {
            const mId = typeof m === 'string' ? m : m.id;
            if (mId && mId !== 'default' && !mId.includes('test-model')) {
              validModelIds.add(mId);
              validModelIds.add(`${p.id}/${mId}`);
            }
          }
        }

        // Pick the first available real model as safe fallback
        let safeFallbackModel = '';
        for (const val of validModelIds) {
          if (val.includes('/')) {
            safeFallbackModel = val;
            break;
          }
        }
        if (!safeFallbackModel && validModelIds.size > 0) {
          safeFallbackModel = validModelIds.values().next().value || '';
        }
        if (!safeFallbackModel) {
          safeFallbackModel = 'nv/nvidia/nemotron-3-super-120b-a12b';
        }

        // Check if gateway-defaults.json primary model is valid
        if (fs.existsSync(defaultsFile)) {
          try {
            const curDefaults = JSON.parse(await fs.promises.readFile(defaultsFile, 'utf-8'));
            let updatedDef = false;
            if (curDefaults.defaults?.primary && !validModelIds.has(curDefaults.defaults.primary)) {
              curDefaults.defaults.primary = safeFallbackModel;
              curDefaults.defaults.utility = safeFallbackModel;
              updatedDef = true;
            }
            if (curDefaults.agentBindings?.zero?.model && !validModelIds.has(curDefaults.agentBindings.zero.model)) {
              curDefaults.agentBindings.zero.model = safeFallbackModel;
              updatedDef = true;
            }
            if (updatedDef) {
              await fs.promises.writeFile(defaultsFile, JSON.stringify(curDefaults, null, 2), 'utf-8');
            }
          } catch {}
        }

        // Sync with openclaw.json & zero.json configs
        const openclawConfigs = [
          path.resolve(process.cwd(), 'zero-system', 'config', 'zero.json'),
          path.resolve(process.cwd(), 'zero-system', 'config', 'zero.template.json'),
          path.resolve(process.cwd(), 'backend', 'config', 'zero.json'),
          path.resolve(process.cwd(), 'backend', 'config', 'zero.template.json'),
          path.resolve(process.cwd(), 'backend', 'config', 'openclaw.json'),
          path.resolve(process.cwd(), 'backend', 'config', 'openclaw.template.json'),
          path.resolve(process.cwd(), 'backend', 'config', 'openclaw.json.last-good'),
          path.resolve(process.cwd(), '.zero-data', 'fresh-workspace', 'openclaw.json'),
          path.resolve(process.cwd(), '.zero-data', 'fresh-workspace', 'openclaw.json.last-good'),
        ];

        for (const cfgPath of openclawConfigs) {
          if (fs.existsSync(cfgPath)) {
            try {
              const cfgRaw = await fs.promises.readFile(cfgPath, 'utf-8');
              const cfg = JSON.parse(cfgRaw);
              cfg.agents = cfg.agents || {};
              cfg.agents.defaults = cfg.agents.defaults || {};
              cfg.agents.defaults.model = cfg.agents.defaults.model || {};
              cfg.agents.entries = cfg.agents.entries || {};
              cfg.agents.entries.zero = cfg.agents.entries.zero || {};
              cfg.agents.entries.zero.model = cfg.agents.entries.zero.model || {};

              if (defaults) {
                if (defaults.primary) {
                  cfg.agents.defaults.model.primary = validModelIds.has(defaults.primary) ? defaults.primary : safeFallbackModel;
                }
                if (defaults.utility) {
                  cfg.agents.defaults.utilityModel = validModelIds.has(defaults.utility) ? defaults.utility : safeFallbackModel;
                }
                if (defaults.fallback) cfg.agents.defaults.model.fallbacks = [defaults.fallback];
              }

              if (agentBindings?.zero) {
                if (agentBindings.zero.model) {
                  cfg.agents.entries.zero.model.primary = validModelIds.has(agentBindings.zero.model) ? agentBindings.zero.model : safeFallbackModel;
                }
              }

              // Guard against dummy / removed models in primary, utility, and agent bindings
              const currentDefPrimary = cfg.agents.defaults.model.primary || '';
              if (!currentDefPrimary || !validModelIds.has(currentDefPrimary)) {
                cfg.agents.defaults.model.primary = safeFallbackModel;
              }
              const currentZeroPrimary = cfg.agents.entries.zero.model.primary || '';
              if (!currentZeroPrimary || !validModelIds.has(currentZeroPrimary)) {
                cfg.agents.entries.zero.model.primary = safeFallbackModel;
              }
              if (!cfg.agents.defaults.utilityModel || !validModelIds.has(cfg.agents.defaults.utilityModel)) {
                cfg.agents.defaults.utilityModel = safeFallbackModel;
              }

              cfg.models = cfg.models || { mode: 'replace', providers: {} };
              cfg.models.mode = 'replace';
              cfg.models.providers = cfg.models.providers || {};

              // 1. Synchronize all active user-configured providers
              const allowedProviderKeys = new Set();
              for (const p of activeProvidersList) {
                if (!p || !p.id || p.id === 'zero-gateway' || p.id === 'test-provider' || p.id === 'test_provider') continue;
                allowedProviderKeys.add(p.id);
                cfg.models.providers[p.id] = {
                  baseUrl: p.baseUrl || '',
                  api: p.api || 'openai-completions',
                  models: (Array.isArray(p.models) ? p.models : [])
                    .filter((m: any) => {
                      const id = typeof m === 'string' ? m : m.id;
                      return id && id !== 'default' && !id.includes('test-model');
                    })
                    .map((m: any) => ({
                      id: typeof m === 'string' ? m : m.id,
                      name: typeof m === 'string' ? m : (m.name || m.id),
                    })),
                };
                if (p.apiKey) {
                  cfg.models.providers[p.id].apiKey = p.apiKey;
                }
              }

              // 2. Remove obsolete / old provider records not in active providers
              for (const pKey of Object.keys(cfg.models.providers)) {
                if (!allowedProviderKeys.has(pKey)) {
                  delete cfg.models.providers[pKey];
                }
              }

              // 3. Update zero-gateway with offline GGUF models if any exist
              let offlineModelsList: any[] = [];
              try {
                offlineModelsList = localGgufService.listModels();
              } catch {}

              const zgModels: Array<{ id: string; name: string }> = [];
              for (const om of offlineModelsList) {
                if (om && om.id && om.id !== 'default' && !om.id.includes('test-model')) {
                  zgModels.push({
                    id: om.id,
                    name: om.name || om.id,
                  });
                }
              }

              if (zgModels.length > 0) {
                cfg.models.providers['zero-gateway'] = {
                  baseUrl: 'http://127.0.0.1:18790/v1',
                  api: 'openai-completions',
                  models: zgModels,
                };
              } else if (cfg.models.providers && cfg.models.providers['zero-gateway']) {
                delete cfg.models.providers['zero-gateway'];
              }

              await fs.promises.writeFile(cfgPath, JSON.stringify(cfg, null, 2), 'utf-8');
            } catch (cfgErr: any) {
              console.warn('[GatewayConfig] Failed syncing openclaw config:', cfgErr?.message);
            }
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, count: Array.isArray(providers) ? providers.length : 0, path: configFile, defaults, agentBindings }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Failed to write provider configuration file' }));
      }
      return;
    }

    res.statusCode = 405;
    res.end();
  };
}

/**
 * Creates connect/express/vite compatible middleware for the Native Local GGUF Engine
 * Route Prefix: /api/gateway/local-gguf
 */
export function createLocalGgufMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    // Enable CORS for frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const rawUrl = req.url || '';
    const parsedUrl = new URL(rawUrl, 'http://localhost');
    const pathname = parsedUrl.pathname
      .replace(/^\/api\/gateway\/local-gguf\/?/, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

    // 1. Upload .gguf multipart file stream + optional guide file (.txt/Modelfile/.json)
    if (pathname === 'upload' && req.method === 'POST') {
      localGgufService.handleUpload(req, res);
      return;
    }

    // Helper to read JSON request body
    const readJsonBody = async (): Promise<any> => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const text = Buffer.concat(chunks).toString('utf-8');
      return text ? JSON.parse(text) : {};
    };

    try {
      // 2. List / Scan models (includes both physical /models files AND zero-copy registered models)
      if ((pathname === 'models' || pathname === '') && req.method === 'GET') {
        const models = await localGgufService.scanModels();
        const openAiData = models.map((m) => ({
          id: m.id,
          object: 'model',
          created: Math.floor((m.loadedAt || Date.now()) / 1000),
          owned_by: 'local-gguf',
          permission: [],
          root: m.id,
          parent: null,
          name: m.name,
          capabilities: m.capabilities,
        }));
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ object: 'list', data: openAiData, models, count: models.length }));
        return;
      }

      if (pathname === 'scan' && req.method === 'POST') {
        const models = await localGgufService.scanModels();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, models, count: models.length }));
        return;
      }

      // 3. Memory & Engine Status
      if (pathname === 'status' && req.method === 'GET') {
        const status = localGgufService.getMemoryStatus();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(status));
        return;
      }

      // 4. 5-Stage Auto-Setup Pipeline (Supports Real-Time SSE Streaming Logs & JSON)
      if ((pathname === 'setup-pipeline' || pathname === 'setup') && req.method === 'POST') {
        const body = await readJsonBody();
        const wantsSse =
          body.stream === true ||
          parsedUrl.searchParams.get('stream') === 'true' ||
          (req.headers.accept && req.headers.accept.includes('text/event-stream'));

        if (wantsSse) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          });

          const onProgress = (event: PipelineProgressEvent) => {
            res.write(`data: ${JSON.stringify({ type: 'step', event })}\n\n`);
          };

          try {
            const result = await localGgufService.runSetupPipeline(
              {
                modelPath: body.modelPath,
                filename: body.filename,
                guideContent: body.guideContent,
                guidePath: body.guidePath,
                isZeroCopy: body.isZeroCopy,
              },
              onProgress
            );

            res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          } catch (err: any) {
            res.write(
              `data: ${JSON.stringify({
                type: 'error',
                error: err.message || 'Setup pipeline failed',
              })}\n\n`
            );
            res.write('data: [DONE]\n\n');
            res.end();
          }
          return;
        }

        // Non-streaming JSON setup pipeline
        const result = await localGgufService.runSetupPipeline({
          modelPath: body.modelPath,
          filename: body.filename,
          guideContent: body.guideContent,
          guidePath: body.guidePath,
          isZeroCopy: body.isZeroCopy,
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return;
      }

      // 5. Zero-Copy Local File Path Mount & Auto-Setup
      if (pathname === 'mount-zero-copy' && req.method === 'POST') {
        const body = await readJsonBody();
        if (!body.sourcePath) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "sourcePath" in request body' }));
          return;
        }

        const wantsSse =
          body.stream === true ||
          parsedUrl.searchParams.get('stream') === 'true' ||
          (req.headers.accept && req.headers.accept.includes('text/event-stream'));

        if (wantsSse) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          });

          const onProgress = (event: PipelineProgressEvent) => {
            res.write(`data: ${JSON.stringify({ type: 'step', event })}\n\n`);
          };

          try {
            const result = await localGgufService.mountZeroCopyModel(
              body.sourcePath,
              body.guideContent,
              body.guidePath,
              onProgress
            );

            res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          } catch (err: any) {
            res.write(
              `data: ${JSON.stringify({
                type: 'error',
                error: err.message || 'Zero-copy mounting failed',
              })}\n\n`
            );
            res.write('data: [DONE]\n\n');
            res.end();
          }
          return;
        }

        const result = await localGgufService.mountZeroCopyModel(
          body.sourcePath,
          body.guideContent,
          body.guidePath
        );

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return;
      }

      // 6. Manifest inspection & management
      if (pathname === 'manifest') {
        if (req.method === 'GET') {
          const modelId = parsedUrl.searchParams.get('modelId');
          if (!modelId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing "modelId" query parameter' }));
            return;
          }
          const manifest = await localGgufService.loadManifest(modelId);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ modelId, manifest }));
          return;
        }

        if (req.method === 'POST') {
          const body = await readJsonBody();
          if (!body.id) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing "id" in manifest payload' }));
            return;
          }
          const savedPath = await localGgufService.saveManifest(body);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, savedPath, manifest: body }));
          return;
        }
      }

      // 7. On-demand Stage 4 Engine Self-Test
      if (pathname === 'self-test' && req.method === 'POST') {
        const body = await readJsonBody();
        if (!body.modelId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "modelId" in request body' }));
          return;
        }
        const result = await localGgufService.runSelfTest(body.modelId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return;
      }

      // 8. Legacy Import from local file path (backward-compatible)
      if (pathname === 'import-path' && req.method === 'POST') {
        const body = await readJsonBody();
        if (!body.sourcePath) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "sourcePath" in request body' }));
          return;
        }
        const result = await localGgufService.mountZeroCopyModel(
          body.sourcePath,
          body.guideContent,
          body.guidePath
        );
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, model: result.model }));
        return;
      }

      // 9. Hugging Face Search
      if (pathname === 'hf/search' && req.method === 'GET') {
        const repo = parsedUrl.searchParams.get('repo');
        if (!repo) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "repo" query parameter (owner/repo)' }));
          return;
        }
        const results = await localGgufService.searchHuggingFace(repo);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ repo, files: results }));
        return;
      }

      // 10. Hugging Face Download
      if (pathname === 'hf/download' && req.method === 'POST') {
        const body = await readJsonBody();
        if (!body.url) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "url" in request body' }));
          return;
        }
        const progress = await localGgufService.startDownload(body.url, body.filename, body.repo);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, progress }));
        return;
      }

      // 11. Hugging Face Download Progress & Cancel
      if (pathname === 'hf/progress' && req.method === 'GET') {
        const progress = localGgufService.getDownloadProgress();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ progress }));
        return;
      }

      if (pathname === 'hf/cancel' && req.method === 'POST') {
        const cancelled = localGgufService.cancelDownload();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: cancelled }));
        return;
      }

      // 12. Manual Load / Unload from RAM
      if (pathname === 'load' && req.method === 'POST') {
        const body = await readJsonBody();
        if (!body.modelId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "modelId" in request body' }));
          return;
        }
        await localGgufService.loadModel(body.modelId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, loadedModelId: body.modelId }));
        return;
      }

      if (pathname === 'unload' && req.method === 'POST') {
        await localGgufService.unloadModel();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: 'Model unloaded from RAM/VRAM' }));
        return;
      }

      // 13. Delete Model File & Manifest Permanently from Disk
      if (pathname.startsWith('models/') && (req.method === 'PATCH' || req.method === 'PUT')) {
        const modelId = decodeURIComponent(pathname.replace(/^models\//, ''));
        const body = await readJsonBody();
        const updated = await localGgufService.updateModelSettings(modelId, body);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, model: updated }));
        return;
      }

      if (pathname.startsWith('models/') && req.method === 'DELETE') {
        const modelId = decodeURIComponent(pathname.replace(/^models\//, ''));
        await localGgufService.deleteModel(modelId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: `Model "${modelId}" permanently deleted from system disk.` }));
        return;
      }

      if (pathname === 'models' && req.method === 'DELETE') {
        const id = parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('modelId');
        const isAll = parsedUrl.searchParams.get('all') === 'true';

        if (isAll) {
          await localGgufService.deleteAllModels();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, message: 'All local GGUF models and manifests permanently deleted from disk.' }));
          return;
        }

        if (!id) {
          const body = await readJsonBody().catch(() => ({}));
          if (body.all === true) {
            await localGgufService.deleteAllModels();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'All local GGUF models and manifests permanently deleted from disk.' }));
            return;
          }

          const targetId = body.id || body.modelId || body.filename;
          if (!targetId) {
            // Default to deleting all models if delete models endpoint called without target
            await localGgufService.deleteAllModels();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'All local GGUF models and manifests permanently deleted from disk.' }));
            return;
          }
          await localGgufService.deleteModel(targetId);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, message: `Model "${targetId}" permanently deleted from system disk.` }));
          return;
        }
        await localGgufService.deleteModel(id);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: `Model "${id}" permanently deleted from system disk.` }));
        return;
      }

      if (pathname === 'delete' && (req.method === 'POST' || req.method === 'DELETE')) {
        const body = await readJsonBody();
        const targetId = body.filename || body.modelId || body.id;
        if (!targetId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "filename" or "modelId" in request body' }));
          return;
        }
        await localGgufService.deleteModel(targetId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: `Model "${targetId}" permanently deleted from system disk.` }));
        return;
      }

      // 14. Provider Config Vault Persistence (/api/gateway/local-gguf/config)
      if (pathname === 'config') {
        const configFile = path.resolve(process.cwd(), 'models', 'gateway-providers.json');
        if (req.method === 'GET') {
          if (fs.existsSync(configFile)) {
            const raw = await fs.promises.readFile(configFile, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, providers: JSON.parse(raw) }));
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, providers: null }));
          return;
        }

        if (req.method === 'POST') {
          const body = await readJsonBody();
          const providers = Array.isArray(body) ? body : body.providers;
          if (!Array.isArray(providers)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Expected { providers: [...] } or array of providers' }));
            return;
          }
          const dir = path.dirname(configFile);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          await fs.promises.writeFile(configFile, JSON.stringify(providers, null, 2), 'utf-8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, count: providers.length, path: configFile }));
          return;
        }
      }

      // 15. Process Monitor: Ollama /api/ps Equivalent
      if (pathname === 'ps' && req.method === 'GET') {
        const processes = localGgufService.getRunningProcesses();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ models: processes }));
        return;
      }

      // 16. Vector Embeddings Generation
      if (pathname === 'embeddings' && req.method === 'POST') {
        const body = await readJsonBody();
        const modelId = body.model || body.modelId;
        if (!modelId || !body.input) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "model" or "input" in embeddings payload' }));
          return;
        }

        const embeddingResult = await localGgufService.createEmbedding(modelId, body.input);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            object: 'list',
            data: embeddingResult.embeddings.map((emb, idx) => ({
              object: 'embedding',
              embedding: emb,
              index: idx,
            })),
            model: modelId,
            usage: embeddingResult.usage,
          })
        );
        return;
      }

      // 17. Chat / Streaming Inference Completion (Multi-Agent Mutex Queue + Real C++ AbortSignal)
      if (pathname === 'chat' && req.method === 'POST') {
        const body = await readJsonBody();
        const { modelId, model, messages, stream = true, temperature, maxTokens } = body;
        const targetModelId = modelId || model;

        if (!targetModelId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "modelId" or "model" in chat payload' }));
          return;
        }

        if (!Array.isArray(messages) || messages.length === 0) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing or empty "messages" array' }));
          return;
        }

        const abortController = new AbortController();
        req.on('close', () => {
          if (!res.writableEnded) {
            console.log(`[LocalGguf] Client disconnected. Aborting C++ token generation for "${targetModelId}" immediately...`);
            abortController.abort();
          }
        });

        await localGgufService.scheduleRequest(targetModelId, async () => {
          await localGgufService.executeChat(
            targetModelId,
            messages,
            {
              stream,
              temperature,
              maxTokens,
              top_p: body.top_p || body.topP,
              reasoningEnabled: body.reasoningEnabled,
              keep_alive: body.keep_alive ?? body.keepAlive,
              stop: body.stop,
              repeatPenalty: body.repeat_penalty ?? body.repeatPenalty,
              responseFormat: body.responseFormat || body.response_format,
              tools: body.tools,
              toolChoice: body.toolChoice || body.tool_choice,
              seed: body.seed,
              minP: body.minP || body.min_p,
              topK: body.topK || body.top_k,
              signal: abortController.signal,
            },
            res
          );
        });
        return;
      }

      // 404 for unknown route under /api/gateway/local-gguf
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Not Found: /api/gateway/local-gguf/${pathname}` }));
    } catch (err: any) {
      console.error(`[LocalGguf] Route error on ${pathname}:`, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Local GGUF engine error' }));
      }
    }
  };
}
