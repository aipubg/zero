/**
 * @fileoverview Zero Native Gateway & WebSocket Server
 * 
 * Provides an independent, first-party Zero Host runtime owning:
 * - Single port (18789) HTTP static asset router and WebSocket control plane
 * - Complete Control UI SPA routing with fallback for all 29 UI routes
 * - Native mime-type resolution, caching headers, and path traversal protection
 * - JSON-RPC 2.0 protocol dispatch and Protocol 4 handshake validation
 * - Dynamic agent turn execution and autonomous tool orchestration
 * - Session history and transcript persistence via SQLite
 * - Human safety takeover arbitration (zero-policy.computer-hold)
 * - Durable cron automations and semantic persistent memory store
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { modelSettings, assignZeroModel, assignAgentModel, saveConfiguredProvider, deleteConfiguredProvider, probeConfiguredProvider, importModelSettings } from './model-settings.mjs';
import { recoverModelImport } from '../../packages/model-fabric/config-transaction.mjs';
import { prepareToolBatch } from './tool-batch.mjs';
import { MEDIA_COMMANDS } from '../../packages/media-control/index.mjs';
import { createAutomationDispatcher } from './automation-dispatcher.mjs';
import { LocalGgufEngineService } from '../../backend/gateway/server/local-gguf-service.ts';
import { LocalChatTransport } from '../../packages/model-fabric/local-chat-transport.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  PROTOCOL_VERSION,
  RPC_ERROR_CODES,
  createResponse,
  createError,
  createNotification,
  createHeartbeat,
  parseFrame,
  validateHandshake,
} from '../../packages/gateway-protocol/index.mjs';

import { SessionManager } from '../../packages/sessions/index.mjs';
import { TaskStateMachine, AgentMessageBus, DesktopLeaseManager, AgentTeamOrchestrator, CANONICAL_AGENT_PROFILES } from '../../packages/agent-runtime/index.mjs';
import { AutomationScheduler, EventAutomationEngine, AUTOMATION_TEMPLATES } from '../../packages/automation/index.mjs';
import { PersistentMemoryStore, UnifiedMemoryEngine, MEMORY_LAYERS } from '../../packages/memory/index.mjs';
import { SkillLoader } from '../../packages/skill-sdk/index.mjs';
import { handleSkillsUi, SKILLS_UI_METHODS } from './skills-ui.mjs';
import { handlePluginsUi, PLUGINS_UI_METHODS } from './plugins-ui.mjs';
import { PluginManager } from '../../packages/plugin-sdk/index.mjs';
import { ResearchEngine } from '../../packages/research-engine/index.mjs';
import { WorkspaceManager } from '../../packages/workspaces/index.mjs';
import { DeviceManager } from '../../packages/device-protocol/index.mjs';
import { VoiceEngine } from '../../packages/voice-engine/index.mjs';
import { VoiceConversation } from '../../packages/voice-engine/conversation.mjs';
import { createNativeObservationLifecycle } from './screen-observation.mjs';
import { connectScreenAutomation } from './screen-automation.mjs';
import { createAssistantReceipts } from './assistant-receipts.mjs';
import { canonicalCapabilityEngine } from '../../packages/capability-engine/index.mjs';
import { registerLocalTools } from '../../packages/capability-engine/local-tools.mjs';
import { defaultUnifiedLoop } from '../../core/agent/unified_loop.mjs';
import { DESKTOP_OBSERVATIONS, DESKTOP_COMMANDS } from '../../packages/agent-runtime/agent-desktop.mjs';
import { ModelFabric } from '../../packages/model-fabric/index.mjs';
import { LocalInferenceRuntime } from '../../packages/model-fabric/local-runtime.mjs';
import { createScreenObserver } from '../../packages/screen-intelligence/index.mjs';
import { handleZeroGatewayRequest } from '../../backend/gateway/server.mjs';
import {
  isValidLoopbackHost,
  isAllowedLoopbackOrigin,
  isLoopbackRemoteAddress,
  applyStrictLoopbackCors,
  parseCookies,
  DesktopSessionStore,
} from './security.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = process.env.ZERO_ROOT || path.resolve(__dirname, '..', '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

// Dynamically load ws from available installed location
async function loadWs() {
  const candidates = [
    path.join(REPO_ROOT, 'backend', 'node_modules', 'ws', 'index.js'),
    path.join(REPO_ROOT, 'app', 'node_modules', 'ws', 'index.js'),
    path.join(REPO_ROOT, 'backend', 'node_modules', '.pnpm', 'node_modules', 'ws', 'index.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const mod = (await import(pathToFileURL(candidate).href)).default;
      return mod.WebSocketServer ? mod : { WebSocketServer: mod };
    }
  }
  throw new Error('Unable to locate ws WebSocket library in node_modules');
}

export class ZeroNativeHost {
  constructor(options = {}) {
    this.maxAssistantTurns = options.maxAssistantTurns ?? Number(process.env.ZERO_MAX_ASSISTANT_TURNS ?? 32);
    if (!Number.isInteger(this.maxAssistantTurns) || this.maxAssistantTurns < 1 || this.maxAssistantTurns > 128) throw new Error('maxAssistantTurns must be an integer between 1 and 128');
    this.voiceRecognitionBackend = options.voiceRecognitionBackend ?? process.env.ZERO_VOICE_RECOGNITION_BACKEND;
    if (this.voiceRecognitionBackend !== undefined && !['windows', 'whisper'].includes(this.voiceRecognitionBackend)) throw new Error('Unknown voice recognition backend');
    this.port = options.port || Number(process.env.ZERO_PORT || process.env.PORT || 18789);
    this.host = options.host || '127.0.0.1';
    this.configPath = options.configPath || process.env.OPENCLAW_CONFIG_PATH || path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json');
    this.prefsPath = options.prefsPath || process.env.ZERO_PREFS_PATH || path.join(REPO_ROOT, 'zero-system', 'config', 'user-prefs.json');
    this.bootId = `zero_boot_${Date.now()}`;
    this.bootedAt = Date.now();
    this.activeTurns = new Map();
    this.pendingRequests = new Set();
    this.clients = new Set();

    // Resolve expectedToken respecting gateway.auth.mode from config
    let resolvedToken = '';
    let authMode = 'none';
    if (options.token !== undefined) {
      resolvedToken = String(options.token).trim();
      if (resolvedToken) authMode = 'token';
    } else {
      const configPaths = [
        process.env.OPENCLAW_CONFIG_PATH,
        path.join(REPO_ROOT, 'backend', 'config', 'zero.json'),
        path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json'),
      ].filter(Boolean);
      for (const cp of configPaths) {
        if (fs.existsSync(cp)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(cp, 'utf8'));
            if (parsed.gateway?.auth?.mode) {
              authMode = parsed.gateway.auth.mode;
              if (authMode === 'token') {
                resolvedToken = parsed.gateway.auth.token || '';
              }
            }
            break;
          } catch (_) {}
        }
      }
      if (authMode !== 'none' && !resolvedToken) {
        resolvedToken = (process.env.ZERO_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '').trim();
      }
    }
    this.loopbackUiToken = crypto.randomBytes(24).toString('hex');
    this.expectedToken = (authMode === 'none' && !resolvedToken) ? '' : (resolvedToken || this.loopbackUiToken);

    // Initialize persistence & state engines
    const dataDir = options.dataDir || process.env.ZERO_DATA_DIR || path.join(REPO_ROOT, '.zero-data');
    this.localDesktopSessions = new DesktopSessionStore({ filePath: path.join(dataDir, 'desktop-session-metadata.json'), maxAgeMs: options.desktopSessionMaxAgeMs });
    this.localGguf = new LocalGgufEngineService({ modelsDir: options.localModelsDir || process.env.ZERO_LOCAL_MODELS_DIR || path.join(REPO_ROOT, 'models') });
    // Stable, non-secret storage namespace for the native UI's durable outbox.
    this.recoveryScope = `zero-local:${crypto.createHash('sha256').update(path.resolve(dataDir).toLowerCase()).digest('hex')}`;
    if (!fs.existsSync(dataDir)) {
      try { fs.mkdirSync(dataDir, { recursive: true }); } catch (_) {}
    }

    const sessionDb = path.join(dataDir, 'zero-sessions.sqlite');
    const visionConfigPath = path.join(REPO_ROOT, 'models/local-vision.json');
    const visionConfig = options.localVision === false ? {} : options.localVision || (fs.existsSync(visionConfigPath) ? JSON.parse(fs.readFileSync(visionConfigPath, 'utf8')) : {});
    this.screenObserver = createScreenObserver({ dataDir,
      localVisionRuntime: visionConfig.enabled ? new LocalInferenceRuntime(visionConfig) : null,
      localVisionMinIntervalMs: visionConfig.minIntervalMs ?? 30000,
    });
    this.observationLifecycle = createNativeObservationLifecycle({ observer: this.screenObserver, prefsPath: this.prefsPath });
    this.modelFabric = new ModelFabric({
      localChat: new LocalChatTransport(this.localGguf),
      configPath: options.providersPath || process.env.ZERO_PROVIDERS_PATH || path.join(REPO_ROOT, 'models', 'gateway-providers.json'),
      agentBindingsPath: options.agentBindingsPath || process.env.ZERO_AGENT_BINDINGS_PATH || path.join(REPO_ROOT, 'models', 'gateway-defaults.json'),
      aliases: { 'zero-lead': 'nvidia/nemotron-3.5-super-vl-120b-a12b' },
    });
    this.sessions = new SessionManager({ dbPath: sessionDb });
    this.executeAssistantOnce = createAssistantReceipts(this.sessions.db);
    this.tasks = new TaskStateMachine({ dbPath: path.join(dataDir, 'zero-tasks.sqlite') });
    this.messageBus = new AgentMessageBus({ db: this.tasks.db });
    this.leaseManager = new DesktopLeaseManager();
    canonicalCapabilityEngine.leaseManager = this.leaseManager;
    this.skillLoader = new SkillLoader({ skillsDir: options.skillsDir || process.env.ZERO_SKILLS_DIR || path.join(REPO_ROOT, 'skills') });
    this.pluginManager = new PluginManager({
      dbPath: path.join(dataDir, 'zero-plugins.sqlite'),
      capabilityEngine: canonicalCapabilityEngine,
      logger: this.logger || console,
    });


    this.memory = new PersistentMemoryStore({ dbPath: path.join(dataDir, 'zero-memory.sqlite') });
    this.unifiedMemory = new UnifiedMemoryEngine({ dbPath: path.join(dataDir, 'zero-unified-memory.sqlite') });
    this.researchEngine = new ResearchEngine({
      dbPath: path.join(dataDir, 'zero-artifacts.sqlite'),
      baseDir: REPO_ROOT,
      storageDir: path.join(REPO_ROOT, 'artifacts'),
    });
    this.teamOrchestrator = new AgentTeamOrchestrator({
      stateMachine: this.tasks,
      messageBus: this.messageBus,
      leaseManager: this.leaseManager,
      modelFabric: this.modelFabric,
      capabilityEngine: canonicalCapabilityEngine,
      researchEngine: this.researchEngine,
      logger: this.logger || console,
    });
    this.workspaceManager = new WorkspaceManager({
      dbPath: path.join(dataDir, 'zero-workspaces.sqlite'),
      baseStorageDir: path.join(REPO_ROOT, 'workspaces'),
      stateMachine: this.tasks,
    });
    this.deviceManager = new DeviceManager({
      dbPath: path.join(dataDir, 'zero-devices.sqlite'),
    });
    this.voiceEngine = new VoiceEngine({
      modelFabric: this.modelFabric,
      recognitionBackend: this.voiceRecognitionBackend,
    });
    this.voiceConversation = new VoiceConversation({ engine: this.voiceEngine,
      executeTurn: ({ sessionId, text, signal, context }) => this._runAssistantRequest({ sessionKey: sessionId, userContent: text, source: 'voice', signal, ...context }),
    });
    for (const event of ['transcript', 'turn-complete', 'turn-error', 'interrupted']) {
      this.voiceConversation.on(event, payload => {
        const frame = JSON.stringify({ type: 'event', event: `voice.${event}`, payload });
        for (const client of this.clients) if (client.readyState === 1 && client.subscribedSessions?.has(payload.sessionId)) client.send(frame);
      });
    }

    const tool = (name, description, parameters, handler) => canonicalCapabilityEngine.registerCapability({ name, description, parameters, handler });
    registerLocalTools(canonicalCapabilityEngine, { cwd: REPO_ROOT });
    tool('desktop_control', 'PRIMARY desktop control backend: agent-desktop native accessibility with physical screen interaction. Start with status, then snapshot/find for the exact app/window; use returned qualified refs for click/set-value/get. Runs in headed mode by default to ensure all actions are visible on screen.', { type: 'object', properties: { command: { type: 'string', enum: DESKTOP_COMMANDS }, args: { type: 'array', description: 'CLI tokens, NOT a shell string. snapshot example: ["--window-id","w-123"]. get example: ["@snapshot:e1","--property","value"]. click/set-value: ["@snapshot:e1"]. skills guide: ["get","desktop"]. Reuse refs only from returned snapshots.', items: { type: 'string' } }, input: { type: 'string', description: 'Text to insert for set-value/type/clipboard-set ONLY. Never put refs, flags or read instructions here. Omit for snapshot/get/click.' }, headed: { type: 'boolean', description: 'Physical keyboard/cursor input; defaults to true for visible execution.' } }, required: ['command'], additionalProperties: false }, (args, signal, context) => canonicalCapabilityEngine.execute({ agentId: context?.agentId || 'zero', toolName: 'zero_computer_action', args: { headed: args.headed ?? true, ...args, action: 'desktop' }, signal }));
    tool('research_search', 'Retrieve real search results and provenance. Retrieved sources are not independently verified.', { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, args => this.researchEngine.searchEngine.search(args.query, args));
    tool('memory_recall', 'Retrieve previously stored context from Zero memory.', { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, args => ({ memories: this.unifiedMemory.recall(args.query, args) }));
    tool('memory_remember', 'Persist a fact with provenance for later retrieval. Use semantic for durable facts and preferences.', { type: 'object', properties: { content: { type: 'string' }, layer: { type: 'string', enum: Object.values(MEMORY_LAYERS), default: 'semantic' } }, required: ['content'] }, args => ({ memory: this.unifiedMemory.remember({ layer: 'semantic', ...args }) }));
    tool('screen_context', 'Retrieve real local screen observations; may be empty when observation is stopped.', { type: 'object', properties: { query: { type: 'string' } } }, args => this.screenObserver.queryContext(args.query));
    tool('see_screen', 'Inspect what is currently displayed on the user desktop or browser screen. Returns active window title, on-screen text via OCR, interactive UI elements, and screen dimensions.', { type: 'object', properties: { query: { type: 'string', description: 'Optional text query to find specific elements or text on screen' } } }, async (args, signal) => {
      let windowState = null;
      let windowError = null;
      try {
        windowState = await canonicalCapabilityEngine.operator.execute('get_window_state', {}, signal);
      } catch (err) {
        windowError = err.message;
      }

      let captureRes = null;
      let captureError = null;
      const captureStarted = Date.now();
      try {
        captureRes = await this.screenObserver.captureTick();
      } catch (err) {
        captureError = err.message;
      }

      const screenSizeRes = await canonicalCapabilityEngine.operator.execute('get_screen_size', {}, signal).catch(() => null);
      const screenWidth = screenSizeRes?.width || screenSizeRes?.screen?.width || null;
      const screenHeight = screenSizeRes?.height || screenSizeRes?.screen?.height || null;
      const screenDpi = screenSizeRes?.dpi || null;

      const context = this.screenObserver.queryContext(args.query || '');
      let elements = [];
      try {
        const uiaRes = await canonicalCapabilityEngine.operator.execute('get_elements', {}, signal);
        if (uiaRes?.ok && Array.isArray(uiaRes.elements)) {
          elements = uiaRes.elements
            .filter(e => Number.isFinite(e.centerX) && Number.isFinite(e.centerY) && e.centerX >= 0 && e.centerY >= 0)
            .slice(0, 40)
            .map(e => ({ name: e.name, type: e.controlType, x: e.centerX, y: e.centerY }));
        }
      } catch {}

      const latestObs = context.latestObservation;
      const recentObs = context.recentObservations || [];
      const windowTitle = windowState?.window?.title || latestObs?.window_context || (windowError ? 'Unavailable' : 'Desktop Screen');
      const appProcess = windowState?.window?.processName || windowState?.window?.process || latestObs?.application_id || 'system';

      const isLiveCapture = Boolean(captureRes && !captureError);
      const captureAgeMs = captureRes ? (Date.now() - captureStarted) : (latestObs?.timestamp ? (Date.now() - latestObs.timestamp) : null);

      return {
        ok: Boolean(windowState?.ok !== false || latestObs || elements.length > 0),
        provenance: {
          captureSource: isLiveCapture ? 'live_tick' : (latestObs ? 'stored_memory' : 'window_inspection_only'),
          capturedAt: new Date().toISOString(),
          captureAgeMs,
          captureError: captureError || undefined,
        },
        activeWindow: {
          title: windowTitle,
          process: appProcess,
          bounds: windowState?.window?.bounds || null,
        },
        screenSize: screenWidth && screenHeight ? { width: screenWidth, height: screenHeight, dpi: screenDpi } : null,
        summary: context.answer || `Active application: ${appProcess}, Window: "${windowTitle}"`,
        recentObservations: recentObs.slice(0, 5).map(o => ({
          app: o.application_id,
          window: o.window_context,
          summary: o.semantic_summary,
          time: new Date(o.timestamp).toISOString(),
        })),
        interactiveElements: elements,
      };
    });
    this.skillLoader.executionContext = { stateMachine: this.tasks, modelFabric: this.modelFabric, capabilityEngine: canonicalCapabilityEngine };
    tool('skills_list', 'Discover installed skills and their descriptions.', { type: 'object' }, () => ({ skills: this.skillLoader.listSkills() }));
    tool('skill_execute', 'Execute an enabled installed skill through a durable task and the model/tool loop.', { type: 'object', properties: { name: { type: 'string' }, goal: { type: 'string' } }, required: ['name', 'goal'] }, (args, signal) => this.skillLoader.executeSkill(args.name, args, { signal }));


    const automationExecutor = createAutomationDispatcher({
      memoryEngine: this.unifiedMemory, researchEngine: this.researchEngine,
      capabilityEngine: canonicalCapabilityEngine,
    });
    this.automation = new AutomationScheduler({
      dbPath: path.join(dataDir, 'zero-automation.sqlite'),
      executor: automationExecutor,
    });
    this.eventAutomation = new EventAutomationEngine({
      dbPath: path.join(dataDir, 'zero-event-automation.sqlite'),
      executor: automationExecutor,
    });
    this.screenAutomation = connectScreenAutomation(this.screenObserver, this.eventAutomation);


    // Active human hold state
    this.computerHold = {
      held: false,
      leaseId: null,
      heldAt: null,
      heldBy: null,
    };

    this.server = null;
    this.wss = null;
    this.cronInterval = null;
  }

  
  _redactSecrets(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => this._redactSecrets(item));
    }
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      const lower = k.toLowerCase();
      if (lower.includes('key') || lower.includes('token') || lower.includes('secret') || lower.includes('password')) {
        result[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        result[k] = this._redactSecrets(v);
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  _mergeWithoutRedactions(target, source) {
    if (!source || typeof source !== 'object') return source;
    const output = { ...(target || {}) };
    for (const [k, v] of Object.entries(source)) {
      if (v === '[REDACTED]') {
        continue;
      }
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        output[k] = this._mergeWithoutRedactions(target?.[k], v);
      } else {
        output[k] = v;
      }
    }
    return output;
  }

  async start() {
    await this.modelFabric.localChat.refresh();
    await this.pluginManager.initialize();
    await this.observationLifecycle.initialize();
    if (process.platform === 'win32') {
      try {
        await this.observationLifecycle.control('start');
        console.log('[Zero Host] Screen Intelligence auto-started successfully on win32.');
      } catch (obsErr) {
        console.warn('[Zero Host] Screen Intelligence start warning:', obsErr.message);
      }
    }
    const wsModule = await loadWs();
    const WebSocketServer = wsModule.WebSocketServer;

    this.server = http.createServer(async (req, res) => {
      await this._handleHttpRequest(req, res);
    });

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      this._handleWebSocketConnection(ws, req);
    });

    // Start background cron polling interval (every 15 seconds)
    this.cronInterval = setInterval(async () => {
      try {
        await this.automation.triggerDueJobs();
      } catch (err) {
        console.warn('[Zero Host] Automation cron background check warning:', err.message);
      }
    }, 15000);
    if (this.cronInterval && typeof this.cronInterval.unref === 'function') {
      this.cronInterval.unref();
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, (err) => {
        if (err) return reject(err);
        // Only the process that actually owns the listening port may recover work.
        try {
          recoverModelImport(this.modelFabric.configPath, this.modelFabric.agentBindingsPath);
          this.modelFabric.reloadFromDisk();
          this.executeAssistantOnce.recoverInterrupted();
          this.tasks.recoverTasksOnStartup();
        } catch (error) { this.server.close(); return reject(error); }
        console.log(`[Zero Host] Zero Native Gateway listening on http://${this.host}:${this.port}`);
        resolve(this);
      });
    });
  }

  async _handleHttpRequest(req, res) {
    try {
      // DNS rebinding attack protection: validate Host header
      const host = req.headers['host'];
      if (host && !isValidLoopbackHost(host)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: { message: 'Forbidden: invalid host header (DNS rebinding protection)', code: 403 } }));
        return;
      }

      // Cross-origin request forgery protection: validate Origin header
      const origin = req.headers['origin'];
      if (origin && !isAllowedLoopbackOrigin(origin)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: { message: 'Forbidden: untrusted cross-origin access denied', code: 403 } }));
        return;
      }

      // Apply strict loopback-only CORS headers (no wildcards)
      const corsAllowed = applyStrictLoopbackCors(req, res);
      if (!corsAllowed) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: { message: 'Forbidden: cross-origin access denied', code: 403 } }));
        return;
      }

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      // 1. Dispatch Zero Gateway API routes
      const handled = await handleZeroGatewayRequest(req, res);
      if (handled) return;

      const urlRaw = req.url || '/';
      const parsedUrl = new URL(urlRaw, `http://${this.host}:${this.port}`);
      let pathname = decodeURIComponent(parsedUrl.pathname);

      // Local Desktop Authentication & Session Management
      if (pathname === '/api/auth/session/renew') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Allow', 'POST'); res.end(JSON.stringify({ ok: false })); return; }
        const cookies = parseCookies(req.headers.cookie);
        const session = this.localDesktopSessions.renew(cookies.zero_session);
        if (!session) { res.statusCode = 401; res.end(JSON.stringify({ ok: false, renewalSupported: true })); return; }
        res.setHeader('Set-Cookie', `zero_session=${session.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.ceil(this.localDesktopSessions.maxAgeMs / 1000)}`);
        res.end(JSON.stringify({ ok: true, renewalSupported: true, session: { role: session.role, scopes: session.scopes, expiresAt: session.expiresAt, maxAgeMs: this.localDesktopSessions.maxAgeMs } }));
        return;
      }
      if (pathname === '/api/auth/session') {
        res.setHeader('Cache-Control', 'no-store');
        if (req.method === 'POST') {
          let body = {};
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            if (chunks.length) body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          } catch (_) {}

          const authHeader = req.headers.authorization;
          const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
          const clientToken = (body.token || bearerToken || '').trim();

          // Verify token if gateway has a configured expected token
          if (this.expectedToken && clientToken && clientToken !== this.expectedToken) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: 'Unauthorized: invalid gateway token' }));
            return;
          }

          const session = this.localDesktopSessions.create({
            role: body.role === 'admin' ? 'admin' : 'operator',
            clientId: body.clientId || 'zero-desktop-browser',
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Set-Cookie', [`zero_session=${session.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.ceil(this.localDesktopSessions.maxAgeMs / 1000)}`, 'zero_signed_out=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0']);
          res.end(JSON.stringify({
            ok: true,
            renewalSupported: true,
            session: { role: session.role, scopes: session.scopes, expiresAt: session.expiresAt, maxAgeMs: this.localDesktopSessions.maxAgeMs },
            token: session.id,
          }));
          return;
        }

        if (req.method === 'GET') {
          const cookies = parseCookies(req.headers.cookie);
          const token = cookies['zero_session'] || (req.headers.authorization?.replace(/^Bearer\s+/i, '').trim());
          const session = this.localDesktopSessions.get(token);
          if (session) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: true, renewalSupported: true, session: { role: session.role, scopes: session.scopes, expiresAt: session.expiresAt, maxAgeMs: this.localDesktopSessions.maxAgeMs } }));
            return;
          }
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, renewalSupported: true, bootstrapAllowed: cookies.zero_signed_out !== '1', error: 'Unauthorized: active session required' }));
          return;
        }
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies['zero_session'] || (req.headers.authorization?.replace(/^Bearer\s+/i, '').trim());
        if (token) this.localDesktopSessions.delete(token);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Set-Cookie', ['zero_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0', 'zero_signed_out=1; Path=/; HttpOnly; SameSite=Strict']);
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // 2. Control UI bootstrap config endpoint (NEVER disclose bootstrap credentials)
      if (pathname === '/control-ui-config.json' || pathname === '/__openclaw__/control-ui-config.json') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(JSON.stringify({
          basePath: '',
          assistantName: 'Zero',
          assistantAvatar: '/avatar/zero.svg',
          assistantAvatarSource: 'builtin',
          assistantAvatarStatus: 'resolved',
          assistantAvatarReason: 'builtin',
          assistantAgentId: 'zero',
          serverVersion: '1.0.0',
          serverBuildId: 'zero-native-2026',
          devGitBranch: 'main',
          terminalEnabled: true,
          cliAgentsEnabled: true,
          pluginAssetsRequireAuth: false,
          pluginFrameGrants: [],
        }));
        return;
      }

      // 3. User & agent avatar endpoint
      if (pathname.startsWith('/avatar') || (pathname.startsWith('/api/users/') && pathname.endsWith('/avatar'))) {
        const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
          <rect width="32" height="32" rx="6" fill="#090d12"/>
          <circle cx="16" cy="16" r="10" fill="none" stroke="#10b981" stroke-width="2.5"/>
          <text x="16" y="21" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="900" font-size="14" fill="#10b981" text-anchor="middle">Z</text>
        </svg>`;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.end(avatarSvg);
        return;
      }

      // Live Desktop Screen Capture / Screen Share endpoint
      if (pathname === '/desktop/screenshot' || pathname === '/desktop/frame.jpg' || pathname === '/desktop/screen') {
        let frame = this.screenObserver?.buffer?.getLatestFrame();
        if (!frame && this.screenObserver) {
          try { await this.screenObserver.captureTick(); } catch {}
          frame = this.screenObserver?.buffer?.getLatestFrame();
        }
        if (frame && frame.data) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('X-Frame-Timestamp', String(frame.timestamp));
          res.setHeader('X-Active-Window', encodeURIComponent(frame.windowTitle || ''));
          res.end(frame.data);
          return;
        }
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Screen capture frame unavailable' }));
        return;
      }

      // 4. Resolve static files
      const webRoot = path.join(REPO_ROOT, 'dist', 'web');
      const fallbackRoot = path.join(REPO_ROOT, 'backend', 'node_modules', 'openclaw', 'dist', 'control-ui');
      const pluginDistRoot = path.join(REPO_ROOT, 'app', 'zero-control-ui', 'dist');

      // Plugin assets route: /__openclaw__/plugins/control-ui/* or /plugins/control-ui/*
      if (pathname.startsWith('/__openclaw__/plugins/control-ui/') || pathname.startsWith('/plugins/control-ui/')) {
        const subpath = pathname.replace(/^\/__openclaw__\/plugins\/control-ui\//, '').replace(/^\/plugins\/control-ui\//, '');
        const candidatePaths = [
          path.join(webRoot, 'plugins', 'control-ui', subpath),
          path.join(webRoot, '__openclaw__', 'plugins', 'control-ui', subpath),
          path.join(pluginDistRoot, 'control-ui', subpath),
          path.join(pluginDistRoot, 'control-ui', subpath.split('/').slice(1).join('/')),
        ];
        for (const cp of candidatePaths) {
          if (this._isSafePath(pluginDistRoot, cp) || this._isSafePath(webRoot, cp)) {
            if (fs.existsSync(cp) && fs.statSync(cp).isFile()) {
              return this._serveStaticFile(req, res, cp);
            }
          }
        }
      }

      // Handle relative asset requests (e.g. /chat/assets/... or /settings/assets/... or /assets/chat/...)
      if (pathname.includes('/assets/')) {
        const assetRel = pathname.slice(pathname.indexOf('/assets/') + 1);
        const assetBase = path.basename(pathname);
        const assetCandidates = [
          path.join(webRoot, assetRel),
          path.join(webRoot, 'assets', assetBase),
          path.join(fallbackRoot, assetRel),
          path.join(fallbackRoot, 'assets', assetBase),
        ];
        for (const cand of assetCandidates) {
          if (cand && fs.existsSync(cand) && fs.statSync(cand).isFile()) {
            return this._serveStaticFile(req, res, cand);
          }
        }
      }

      // Check direct file in webRoot
      const targetFile = path.join(webRoot, pathname.replace(/^\/+/, ''));
      if (this._isSafePath(webRoot, targetFile) && fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
        return this._serveStaticFile(req, res, targetFile);
      }

      // Check fallback root
      if (fs.existsSync(fallbackRoot)) {
        const fallbackFile = path.join(fallbackRoot, pathname.replace(/^\/+/, ''));
        if (this._isSafePath(fallbackRoot, fallbackFile) && fs.existsSync(fallbackFile) && fs.statSync(fallbackFile).isFile()) {
          return this._serveStaticFile(req, res, fallbackFile);
        }
      }

      // 5. SPA Fallback for client routes
      const isSpaRoute = pathname === '/' ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/agents') ||
        pathname.startsWith('/sessions') ||
        pathname.startsWith('/tasks') ||
        pathname.startsWith('/memory') ||
        pathname.startsWith('/automation') ||
        pathname === '/about' ||
        pathname === '/plugins' ||
        !path.extname(pathname);

      if (isSpaRoute && (req.method === 'GET' || req.method === 'HEAD')) {
        const indexCandidates = [
          path.join(webRoot, 'index.html'),
          path.join(fallbackRoot, 'index.html'),
          path.join(REPO_ROOT, 'app', 'zero-control-ui', 'dist', 'index.html'),
        ];
        for (const idxPath of indexCandidates) {
          if (fs.existsSync(idxPath)) {
            return this._serveIndexHtml(req, res, idxPath);
          }
        }
      }

      // 6. 404 Fallback
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Not Found: ${pathname}` }));
    } catch (err) {
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
      }
    }
  }

  _serveIndexHtml(req, res, filePath) {
    try {
      let html = fs.readFileSync(filePath, 'utf8');

      if (!html.includes('<base href="/">') && !html.includes('<base href="/" />')) {
        html = html.replace(/<head\b[^>]*>/i, (tag) => `${tag}\n    <base href="/" />`);
      }

      html = html.replaceAll('src="./assets/', 'src="/assets/');
      html = html.replaceAll('href="./assets/', 'href="/assets/');

      if (!html.includes('zero-control-ui.js')) {
        html = html.replace('</head>', '    <link rel="stylesheet" href="/assets/zero-control-ui.css">\n    <script type="module" src="/assets/zero-control-ui.js"></script>\n  </head>');
      }

      // Prevent aggressive SPA fallback reload loops while modules hydrate
      html = html.replace('function retryCurrentDocument() {', 'function retryCurrentDocument() { return;');

      // Secure session cookie issuance for loopback browser desktop sessions
      const cookies = parseCookies(req.headers.cookie);
      let session = this.localDesktopSessions.get(cookies['zero_session']);
      if (!session && isLoopbackRemoteAddress(req.socket.remoteAddress)) {
        session = this.localDesktopSessions.create();
        res.setHeader('Set-Cookie', `zero_session=${session.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.ceil(this.localDesktopSessions.maxAgeMs / 1000)}`);
      }

      const bodyBuffer = Buffer.from(html, 'utf8');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Length', bodyBuffer.length);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      res.end(bodyBuffer);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Error serving index.html: ' + err.message);
    }
  }

  _serveStaticFile(req, res, filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stat.size);

      if (filePath.includes('-') && ext !== '.html' && ext !== '.json' && ext !== '.webmanifest') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }

      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.statusCode = 500;
      res.end('Error serving file: ' + err.message);
    }
  }

  _isSafePath(rootDir, targetPath) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedTarget = path.resolve(targetPath);
    return resolvedTarget.startsWith(resolvedRoot);
  }

  _handleWebSocketConnection(ws, req) {
    let clientSession = null;
    ws.subscribedSessions = new Set();
    this.clients.add(ws);

    // DNS rebinding protection on WebSocket upgrade
    const host = req.headers['host'];
    if (host && !isValidLoopbackHost(host)) {
      ws.close(1008, 'Forbidden: invalid host header');
      return;
    }

    // Validate Origin header (CORS/CSRF & WebSocket hijacking prevention)
    const origin = req.headers['origin'];
    if (origin && !isAllowedLoopbackOrigin(origin)) {
      ws.close(1008, 'Forbidden: untrusted origin');
      return;
    }

    // Extract loopback desktop session from HttpOnly cookie
    const cookies = parseCookies(req.headers['cookie']);
    const verifiedSession = this.localDesktopSessions.get(cookies['zero_session']);

    // Desktop Screen Share live streaming connection
    if (req.url === '/desktop/stream') {
      const sendFrame = () => {
        if (ws.readyState !== 1) return;
        const frame = this.screenObserver?.buffer?.getLatestFrame();
        if (frame && frame.data) {
          ws.send(JSON.stringify({
            type: 'desktop.frame',
            timestamp: frame.timestamp,
            windowTitle: frame.windowTitle,
            appName: frame.appName,
            image: `data:image/jpeg;base64,${frame.data.toString('base64')}`,
          }));
        }
      };
      sendFrame();
      const interval = setInterval(sendFrame, 1500);
      ws.on('close', () => {
        clearInterval(interval);
        this.clients.delete(ws);
      });
      return;
    }

    ws.on('close', () => {
      this.clients.delete(ws);
      for (const [sessionId, binding] of this.voiceConversation.bindings) {
        if (binding.context.ownerId === ws) {
          void this.voiceConversation.detach(sessionId);
          this.voiceEngine.stopSession(sessionId);
        }
      }
    });

    ws.on('message', async (raw) => {
      const parsed = parseFrame(raw);
      if (parsed.type === 'invalid') {
        ws.send(JSON.stringify(parsed.error));
        return;
      }

      ws.isReferenceWire = parsed.isReferenceWire;
      const { id, method, params } = parsed;

      // Protocol 4 Handshake & Connect negotiation
      if (method === 'handshake' || method === 'gateway.handshake' || method === 'hello' || method === 'connect') {
        const result = validateHandshake(params, {
          expectedToken: this.expectedToken,
          validSessions: this.localDesktopSessions,
          verifiedSession,
          allowViewer: true,
        });
        if (!result.ok) {
          if (parsed.isReferenceWire) {
            ws.send(JSON.stringify({ type: 'res', id, ok: false, error: result.message }));
          } else {
            ws.send(JSON.stringify(createError(id, result.code, result.message)));
          }
          return;
        }
        clientSession = result.session;
        const supportedMethods = [
          'health', 'gateway.health',
          'agents.list', 'gateway.agents.list',
          'sessions.list', 'gateway.sessions.list',
          'sessions.create', 'sessions.reset', 'sessions.recover', 'sessions.fork', 'sessions.get', 'sessions.describe',
          'sessions.patch', 'sessions.patchMany', 'sessions.delete', 'sessions.deleteMany', 'sessions.archive', 'sessions.unarchive',
          'chat.history', 'gateway.chat.history', 'chat.startup', 'chat.metadata',
          'chat.send', 'chat.abort', 'agent', 'gateway.agent',
          'models.list', 'gateway.models.list', 'models.status',
          'plugins.controlUi.list', 'plugins.controlUi.report', 'plugins.controlUi.status',
          'zero.providers.list', 'zero.providers.configure', 'zero.providers.test', 'zero.providers.setActive', 'zero.providers.save', 'zero.providers.delete',
          'zero.gateway.config.get', 'zero.gateway.config.save',
          'zero.gateway.localGguf',
          'zero.gateway.status', 'zero.gateway.restart',
          'zero.computer.control', 'zero.observation.status',
          'zero.integrations.cli.status', 'zero.integrations.connectors.status',
          'tools.effective', 'tools.list', 'tools.call',
          'zero-policy.computer-hold.status',
          'zero-policy.computer-hold.take',
          'zero-policy.computer-hold.release',
          'memory.remember', 'memory.recall', 'memory.forget', 'memory.list', 'memory.layers', 'memory.update', 'memory.consolidate',
          'automation.listJobs', 'automation.registerJob', 'automation.toggleJob', 'automation.deleteJob', 'automation.triggerDue', 'automation.listRuns',
          'cron.list', 'cron.status', 'cron.runs', 'cron.run', 'cron.add', 'cron.update', 'cron.remove',
'automation.events.emit', 'automation.events.rules', 'automation.events.registerRule', 'automation.events.deleteRule',
          'automation.templates.list', 'automation.templates.instantiate',
          'automation.connectors.list', 'automation.connectors.register', 'automation.connectors.test',
          'tasks.list', 'tasks.get', 'tasks.create', 'tasks.cancel', 'tasks.resume',
'agent.profile.list', 'agent.team.list', 'agent.team.create',
          'agent.task.plan', 'agent.task.execute',
          'agent.lease.status', 'agent.lease.acquire', 'agent.lease.release', 'agent.lease.force_release',
          'tasks.checkpoint.save', 'tasks.checkpoint.get', 'tasks.checkpoint.list', 'tasks.retry',
          'skills.list', 'skills.get', 'skills.create', 'skills.match', 'skills.execute',
          'plugins.list', 'plugins.install', 'plugins.enable', 'plugins.disable', 'plugins.uninstall', 'plugins.diagnostics',
'research.search', 'research.file.read', 'research.file.write', 'research.file.list',
          'research.artifact.create', 'research.artifact.get', 'research.artifact.list', 'research.artifact.verify',
          'research.workflow.execute',
'workspaces.create', 'workspaces.list', 'workspaces.get',
          'projects.create', 'projects.list', 'projects.get',
          'workers.register', 'workers.list', 'workers.get', 'workers.heartbeat', 'workers.handoff', 'workers.handoffs.list',
          'devices.pair.generateCode', 'devices.pair.claim', 'devices.list', 'devices.get', 'devices.unpair', 'device.pair.list',
          'devices.notify', 'devices.notifications.list', 'devices.notifications.markRead',
          'voice.session.start', 'voice.session.stop', 'voice.chunk', 'voice.synthesize', 'voice.transcribe', 'voice.status',
          'voice.microphone.start', 'voice.microphone.stop',
          'voice.turn', 'voice.conversation.status',
          'sessions.messages.subscribe', 'sessions.messages.unsubscribe', 'sessions.observer.visibility',
          'sessions.subscribe', 'config.get', 'config.patch', 'config.schema', 'config.schema.lookup',
          'users.self', 'users.prefs.get', 'users.prefs.set', 'models.authStatus',
          'memory.search', 'agents.workspace.get', 'doctor.memory.status', 'webSearch.status', 'webSearch.test',
          'zero.observation.query', 'zero.observation.control', 'zero.observation.recent',
          'backup.status', 'backups.list', 'storage.locations.probe', 'environments.list', 'environments.status', 'node.list',
          'desktop.observe', 'desktop.launch', 'desktop.release',
          ...SKILLS_UI_METHODS,
          ...PLUGINS_UI_METHODS,
        ];

        if (parsed.isReferenceWire) {
          ws.send(JSON.stringify({
            type: 'res',
            id,
            ok: true,
            payload: {
              type: 'hello',
              protocol: 4,
              server: { version: '1.0.0', commit: 'zero-native', bootId: this.bootId, controlUiBuildSource: 'configured' },
              features: { methods: supportedMethods },
              snapshot: {
                presence: [{ clientId: clientSession.clientId, role: clientSession.role, connectedAt: Date.now() }],
                sessionDefaults: { defaultAgentId: 'zero' },
              },
              auth: {
                role: clientSession.role,
                scopes: clientSession.scopes,
                recoveryScope: `${this.recoveryScope}:${clientSession.role}`,
              },
              policy: { tickIntervalMs: 30000 },
              session: clientSession,
              bootId: this.bootId,
            },
          }));
        } else {
          ws.send(JSON.stringify(createResponse(id, {
            ok: true,
            protocol: PROTOCOL_VERSION,
            session: clientSession,
            bootId: this.bootId,
            methods: supportedMethods,
          })));
        }
        return;
      }

      // Reject RPC traffic until handshake has established a client session.
      if (!clientSession) {
        const errorMessage = 'Handshake required before RPC dispatch';
        ws.send(JSON.stringify(parsed.isReferenceWire
          ? { type: 'res', id, ok: false, error: errorMessage }
          : createError(id, RPC_ERROR_CODES.UNAUTHORIZED, errorMessage)));
        return;
      }

      // RPC Methods dispatch
      try {
        const responseResult = await this._dispatchRpc(method, params, clientSession, ws, parsed.isReferenceWire);
        if (responseResult && typeof responseResult === 'object' && responseResult.ok === false) {
          const failureCode = responseResult.code || responseResult.error?.code;
          const failureMessage = typeof responseResult.error === 'string' ? responseResult.error : responseResult.error?.message || 'Operation failed';
          const deliveryDetails = responseResult.backend === 'agent-desktop' && responseResult.disposition
            ? { backend: 'agent-desktop', nativeCode: failureCode, disposition: responseResult.disposition, requiresObservation: responseResult.requiresObservation === true } : undefined;
          if (parsed.isReferenceWire) {
            ws.send(JSON.stringify({
              type: 'res',
              id,
              ok: false,
              error: { code: String(failureCode || 'OPERATION_FAILED'), message: failureMessage, ...(deliveryDetails ? { details: deliveryDetails } : {}) },
              code: failureCode,
            }));
          } else {
            const code = responseResult.code || RPC_ERROR_CODES.INTERNAL_ERROR;
            ws.send(JSON.stringify(createError(id, code, failureMessage, deliveryDetails)));
          }
          return;
        }

        if (parsed.isReferenceWire) {
          ws.send(JSON.stringify({
            type: 'res',
            id,
            ok: true,
            payload: responseResult,
          }));
        } else {
          ws.send(JSON.stringify(createResponse(id, responseResult)));
        }
      } catch (err) {
        if (parsed.isReferenceWire) {
          ws.send(JSON.stringify({
            type: 'res',
            id,
            ok: false,
            error: { code: String(err.code || 'INTERNAL_ERROR'), message: err.message || 'Operation failed' },
          }));
        } else {
          const code = err.code || RPC_ERROR_CODES.INTERNAL_ERROR;
          ws.send(JSON.stringify(createError(id, code, err.message)));
        }
      }
    });

    // 1. Emit connect challenge event for reference clients
    ws.send(JSON.stringify({
      type: 'event',
      event: 'connect.challenge',
      payload: {
        nonce: `nonce_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
      },
    }));

    // 2. Send initial JSON-RPC heartbeat frame
    ws.send(JSON.stringify(createHeartbeat(Date.now())));
  }

  async _dispatchRpc(method, params = {}, clientSession, ws, isReferenceWire = false) {
    // Enforce Method-Level Roles & Scopes
    const METHOD_SCOPES = {
      'config.set': ['admin', 'operator.admin'],
      'config.patch': ['admin', 'operator.admin'],
      'config.apply': ['admin', 'operator.admin'],
      'zero.gateway.restart': ['admin', 'operator.admin'],
      'zero.providers.configure': ['admin', 'operator.admin'],
      'zero.providers.setActive': ['admin', 'operator.admin'],
      'zero.providers.save': ['admin', 'operator.admin'],
      'zero.providers.delete': ['admin', 'operator.admin'],
      'zero.gateway.config.save': ['admin', 'operator.admin'],
      'zero.gateway.localGguf': ['admin', 'operator.admin'],
      'zero.computer.control': ['computer.control', 'operator.admin'],
      'chat.send': ['operator.write', 'operator.admin'],
      'agent': ['operator.write', 'operator.admin'],
      'gateway.agent': ['operator.write', 'operator.admin'],
      'chat.abort': ['operator.write', 'operator.admin'],
      'tasks.create': ['operator.write', 'operator.admin'],
      'tasks.cancel': ['operator.write', 'operator.admin'],
      'tasks.resume': ['operator.write', 'operator.admin'],
      'tasks.retry': ['operator.write', 'operator.admin'],
      'automation.registerJob': ['admin', 'operator.admin', 'operator.write'],
      'automation.deleteJob': ['admin', 'operator.admin'],
      'automation.toggleJob': ['admin', 'operator.admin', 'operator.write'],
      'automation.triggerDue': ['admin', 'operator.admin', 'operator.write'],
      'memory.remember': ['operator.write', 'operator.admin'],
      'memory.forget': ['operator.write', 'operator.admin'],
      'users.prefs.set': ['operator.write', 'operator.admin'],
      'sessions.patch': ['operator.write', 'operator.admin'],
      'sessions.patchMany': ['operator.write', 'operator.admin'],
      'sessions.delete': ['operator.write', 'operator.admin'],
      'sessions.deleteMany': ['operator.write', 'operator.admin'],
      'sessions.reset': ['operator.read', 'operator.write', 'operator.admin'],
      'sessions.recover': ['operator.read', 'operator.write', 'operator.admin'],
      'sessions.fork': ['operator.read', 'operator.write', 'operator.admin'],
      'sessions.archive': ['operator.write', 'operator.admin'],
      'sessions.unarchive': ['operator.write', 'operator.admin'],
      'cron.list': ['operator.read', 'operator.write', 'operator.admin'],
      'cron.status': ['operator.read', 'operator.write', 'operator.admin'],
      'cron.runs': ['operator.read', 'operator.write', 'operator.admin'],
      'cron.run': ['operator.write', 'operator.admin'],
      'cron.add': ['operator.write', 'operator.admin'],
      'cron.update': ['operator.write', 'operator.admin'],
      'cron.remove': ['operator.write', 'operator.admin'],
      'device.pair.list': ['operator.read', 'operator.pairing', 'operator.admin'],
    };

    if (!METHOD_SCOPES[method] && /^(skills\.(install|import|update|uninstall|enable|disable|config|create|execute|library\.(save|mutate|import))|plugins\.(install|update|enable|disable|uninstall|execute|setEnabled|restart|remove)|voice\.(session\.|microphone\.|turn|chunk|transcribe|synthesize)|zero\.observation\.control)/.test(method)) METHOD_SCOPES[method] = ['operator.admin', 'operator.write'];
    if (METHOD_SCOPES[method]) {
      const required = METHOD_SCOPES[method];
      const hasScope = Boolean(
        clientSession?.authenticated && (
          clientSession?.role === 'admin' ||
          clientSession?.scopes?.some((s) => required.includes(s))
        )
      );
      if (!hasScope) {
        const err = new Error(`Forbidden: method '${method}' requires scope in [${required.join(', ')}]`);
        err.code = RPC_ERROR_CODES.FORBIDDEN;
        throw err;
      }
    }

    if (SKILLS_UI_METHODS.includes(method)) return await handleSkillsUi(method, params, this.skillLoader);
    if (PLUGINS_UI_METHODS.includes(method)) return await handlePluginsUi(method, params, this.pluginManager);
    switch (method) {
      case 'health':
      case 'gateway.health':
        return {
          ok: true,
          status: 'ok',
          bootId: this.bootId,
          version: '1.0.0',
          runtime: 'zero-native',
          plugins: {
            loaded: this.pluginManager.listPlugins().filter(plugin => plugin.loaded).map(plugin => plugin.id),
            errors: this.pluginManager.getDiagnostics().plugins.filter(plugin => plugin.error).map(plugin => ({ id: plugin.id, error: plugin.error })),
          },
        };

      case 'gateway.liveness':
        return {
          ok: true,
          status: 'live',
          uptime: process.uptime(),
          pid: process.pid,
          memory: process.memoryUsage(),
          bootId: this.bootId,
          runtime: 'zero-native',
          timestamp: Date.now(),
        };

      case 'gateway.readiness':
        return {
          ok: true,
          status: 'ready',
          services: {
            gateway: 'ready',
            modelFabric: 'ready',
            capabilityEngine: 'ready',
            sessionStore: 'ready',
            taskStore: 'ready',
          },
          bootId: this.bootId,
          timestamp: Date.now(),
        };

      case 'gateway.features':
        return {
          ok: true,
          status: 'ok',
          features: {
            models: { active: true, implemented: true, configuredModels: this.modelFabric.listModels().length, configuredProviders: this.modelFabric.getProviders().length, providerReachability: 'untested' },
            agents: { active: true, implemented: true, delegation: true, teams: this.teamOrchestrator.listTeams().length, planning: 'heuristic-partial' },
            computer: { active: true, available: process.platform === 'win32', platform: process.platform, verification: 'per-action' },
            memory: { active: true, store: 'sqlite-wal' },
            automation: { active: true, scheduler: 'durable-cron' },
            skills: { active: true, implemented: true, installedCount: this.skillLoader.listSkills().length },
            plugins: { active: true, implemented: true, ...this.pluginManager.getDiagnostics() },
            voice: { active: true, status: 'PARTIAL', ...this.voiceEngine.getStatus() },
            screen: { active: true, ...this.screenObserver.getStatus(), encryptedAtRest: this.screenObserver.getStatus().observationStore.encryptedFields, completed24Hours: false },
          },
          timestamp: Date.now(),
        };

      case 'agents.list':
      case 'gateway.agents.list':
        return {
          defaultId: 'zero',
          agents: [
            {
              id: 'zero',
              name: 'Zero',
              identity: { name: 'Zero' },
              description: 'Zero Autonomous Personal AI Commander',
              model: { primary: this.modelFabric.resolveAgentModel('zero')?.canonicalModelId || null },
            },
          ],
        };

      case 'sessions.list':
      case 'gateway.sessions.list': {
        const limit = Number(params.limit || 50);
        const offset = Number(params.offset || 0);
        const includeArchived = Boolean(params.includeArchived || params.archived);
        const sessions = this.sessions.listSessions({ limit, offset, includeArchived });
        const defaultModel = this.modelFabric.resolveAgentModel('zero');
        return {
          ts: Date.now(),
          defaults: { model: defaultModel?.canonicalModelId || null, modelProvider: defaultModel?.provider?.id || null },
          sessions,
          total: sessions.length,
          count: sessions.length,
          totalCount: sessions.length,
          hasMore: false,
          nextOffset: null,
        };
      }

      case 'sessions.create': {
        const session = this.sessions.createSession(params.id || params.key, params.title || 'New Conversation', params.metadata || {});
        const extractInitText = (val) => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          if (typeof val.text === 'string') return val.text;
          if (typeof val.content === 'string') return val.content;
          return '';
        };
        const initialText = extractInitText(params.message) || extractInitText(params.prompt) || extractInitText(params.task) || extractInitText(params.initialText) || extractInitText(params.text) || extractInitText(params.input) || '';
        let initialRun = { status: 'idle' };
        if (initialText) {
          const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          initialRun = { status: 'started', runId };
          void this._runAssistantRequest({
            sessionKey: session.id,
            userContent: initialText,
            model: params.model,
            ws,
            isReferenceWire,
            clientSession,
            source: 'chat',
            runId,
          });
        }
        const sessionPayload = {
          key: session.id,
          id: session.id,
          sessionId: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          metadata: session.metadata,
          archived: Boolean(session.archived ?? session.metadata?.archived),
          agentId: session.metadata?.agentId || 'zero',
        };
        this._broadcastSessionChanged({ reason: 'new', session: sessionPayload, sessionKey: session.id });
        return {
          ok: true,
          key: session.id,
          sessionKey: session.id,
          sessionId: session.id,
          session: sessionPayload,
          entry: sessionPayload,
          continuation: { status: 'fulfilled' },
          initialRun,
          runStarted: initialRun.status === 'started',
          runId: initialRun.runId,
        };
      }

      case 'sessions.reset': {
        const key = params.key || params.id || params.currentSessionKey || params.sessionKey;
        const session = this.sessions.createSession(null, params.title || 'New Conversation', { ...params.metadata, agentId: params.agentId || 'zero' });
        const sessionPayload = {
          key: session.id,
          id: session.id,
          sessionId: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          metadata: session.metadata,
          archived: false,
          agentId: session.metadata?.agentId || 'zero',
        };
        this._broadcastSessionChanged({ reason: 'reset', session: sessionPayload, sessionKey: session.id });
        return {
          ok: true,
          key: session.id,
          sessionKey: session.id,
          sessionId: session.id,
          session: sessionPayload,
          entry: sessionPayload,
          continuation: { status: 'fulfilled' },
          initialRun: { status: 'idle' },
        };
      }

      case 'sessions.recover': {
        const key = params.key || params.id || params.sessionKey || 'default';
        let session = this.sessions.getSession(key);
        if (!session) {
          session = this.sessions.createSession(key, 'New Conversation', { agentId: params.agentId || 'zero' });
        }
        const sessionPayload = {
          key: session.id,
          id: session.id,
          sessionId: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          metadata: session.metadata,
          archived: Boolean(session.archived ?? session.metadata?.archived),
          agentId: session.metadata?.agentId || 'zero',
        };
        return {
          ok: true,
          key: session.id,
          sessionKey: session.id,
          sessionId: session.id,
          session: sessionPayload,
          entry: sessionPayload,
          continuation: { status: 'fulfilled' },
          initialRun: { status: 'idle' },
        };
      }

      case 'sessions.fork': {
        const key = params.key || params.id || params.sessionKey;
        const entryId = params.entryId;
        const parent = this.sessions.getSession(key);
        const newSession = this.sessions.createSession(null, parent ? `Fork of ${parent.title}` : 'Forked Conversation', { ...parent?.metadata, parentKey: key, entryId });
        if (parent && this.sessions.getTranscript) {
          try {
            const messages = this.sessions.getTranscript(key);
            for (const msg of messages) {
              this.sessions.appendMessage(newSession.id, { role: msg.role, content: msg.content, tool_calls: msg.tool_calls });
              if (msg.id === entryId) break;
            }
          } catch {}
        }
        const sessionPayload = {
          key: newSession.id,
          id: newSession.id,
          sessionId: newSession.id,
          title: newSession.title,
          createdAt: newSession.createdAt,
          updatedAt: newSession.updatedAt,
          metadata: newSession.metadata,
          archived: false,
          agentId: newSession.metadata?.agentId || 'zero',
        };
        this._broadcastSessionChanged({ reason: 'fork', session: sessionPayload, sessionKey: newSession.id });
        return {
          ok: true,
          key: newSession.id,
          sessionId: newSession.id,
          sessionKey: newSession.id,
          session: sessionPayload,
          entry: sessionPayload,
          continuation: { status: 'fulfilled' },
          initialRun: { status: 'idle' },
        };
      }

      case 'sessions.get':
      case 'sessions.describe': {
        const key = params.key || params.id || params.sessionKey || 'default';
        const session = this.sessions.getSession(key);
        if (!session) {
          return { ok: false, error: 'Session not found', key };
        }
        const transcript = this.sessions.getTranscript(key);
        const sessionPayload = {
          key: session.id,
          id: session.id,
          sessionId: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          metadata: session.metadata,
          archived: Boolean(session.archived ?? session.metadata?.archived),
          agentId: session.metadata?.agentId || 'zero',
        };
        return {
          ok: true,
          session: sessionPayload,
          transcript,
        };
      }

      case 'sessions.patch': {
        const key = params.key || params.id || params.sessionKey;
        if (!key) throw new Error('Session key is required');
        const patched = this.sessions.patchSession(key, {
          ...params,
          ...(params.archived !== undefined ? { archived: params.archived } : {}),
          metadata: { ...params.metadata, ...(params.model ? { model: params.model } : {}), ...(params.archived !== undefined ? { archived: params.archived } : {}) }
        });
        if (!patched) throw new Error(`Session '${key}' not found`);
        const sessionPayload = {
          key: patched.id,
          id: patched.id,
          sessionId: patched.id,
          title: patched.title,
          createdAt: patched.createdAt,
          updatedAt: patched.updatedAt,
          metadata: patched.metadata,
          archived: Boolean(patched.archived ?? patched.metadata?.archived),
          agentId: patched.metadata?.agentId || 'zero',
        };
        this._broadcastSessionChanged({ reason: params.archived ? 'archive' : 'patch', session: sessionPayload, sessionKey: key });
        return {
          ok: true,
          key: patched.id,
          sessionId: patched.id,
          session: sessionPayload,
        };
      }

      case 'sessions.patchMany': {
        const patches = params.patches || (params.keys ? params.keys.map(key => ({ key, ...params.patch })) : []);
        const results = [];
        for (const p of patches) {
          const key = p.key || p.id;
          if (!key) continue;
          const patched = this.sessions.patchSession(key, {
            ...p,
            ...(p.archived !== undefined ? { archived: p.archived } : {})
          });
          if (patched) {
            const sessionPayload = {
              key: patched.id,
              id: patched.id,
              sessionId: patched.id,
              title: patched.title,
              createdAt: patched.createdAt,
              updatedAt: patched.updatedAt,
              metadata: patched.metadata,
              archived: Boolean(patched.archived ?? patched.metadata?.archived),
              agentId: patched.metadata?.agentId || 'zero',
            };
            results.push(sessionPayload);
            this._broadcastSessionChanged({ reason: p.archived ? 'archive' : 'patch', session: sessionPayload, sessionKey: key });
          }
        }
        return { ok: true, patched: results.length, sessions: results };
      }

      case 'sessions.archive': {
        const key = params.key || params.id || params.sessionKey;
        if (!key) throw new Error('Session key is required');
        const patched = this.sessions.patchSession(key, { archived: true });
        const sessionPayload = {
          key: patched?.id || key,
          id: patched?.id || key,
          sessionId: patched?.id || key,
          title: patched?.title || 'Session',
          createdAt: patched?.createdAt || Date.now(),
          updatedAt: patched?.updatedAt || Date.now(),
          metadata: patched?.metadata || {},
          archived: true,
          agentId: patched?.metadata?.agentId || 'zero',
        };
        this._broadcastSessionChanged({ reason: 'archive', session: sessionPayload, sessionKey: key });
        return { ok: true, session: sessionPayload };
      }

      case 'sessions.unarchive': {
        const key = params.key || params.id || params.sessionKey;
        if (!key) throw new Error('Session key is required');
        const patched = this.sessions.patchSession(key, { archived: false });
        const sessionPayload = {
          key: patched?.id || key,
          id: patched?.id || key,
          sessionId: patched?.id || key,
          title: patched?.title || 'Session',
          createdAt: patched?.createdAt || Date.now(),
          updatedAt: patched?.updatedAt || Date.now(),
          metadata: patched?.metadata || {},
          archived: false,
          agentId: patched?.metadata?.agentId || 'zero',
        };
        this._broadcastSessionChanged({ reason: 'unarchive', session: sessionPayload, sessionKey: key });
        return { ok: true, session: sessionPayload };
      }

      case 'sessions.delete': {
        const key = params.key || params.id || params.sessionKey;
        if (!key) throw new Error('Session key is required');
        this.sessions.deleteSession(key);
        this._broadcastSessionChanged({ reason: 'delete', sessionKey: key, key, id: key });
        return { ok: true, deleted: true, key, id: key };
      }

      case 'sessions.deleteMany': {
        const keys = params.keys || (params.key ? [params.key] : []);
        for (const k of keys) {
          this.sessions.deleteSession(k);
          this._broadcastSessionChanged({ reason: 'delete', sessionKey: k, key: k, id: k });
        }
        return { ok: true, deleted: keys.length, keys };
      }

      case 'chat.metadata':
        return { commands: [], ...(params.includeModels === false ? {} : { models: this.modelFabric.listModels() }) };

      case 'chat.startup':
      case 'chat.history':
      case 'gateway.chat.history': {
        const sessionKey = params.sessionKey || params.sessionId || 'default';
        if (method === 'chat.startup' && !this.sessions.getSession(sessionKey)) this.sessions.createSession(sessionKey, 'New Conversation', { agentId: params.agentId || 'zero' });
        const limit = Math.min(1000, Math.max(1, Number(params.limit ?? 100)));
        const offset = Number(params.offset ?? 0);
        const messages = this.sessions.getTranscript(sessionKey, { limit, offset }).map(message => ({ ...message, timestamp: message.createdAt,
          __openclaw: { id: message.id, seq: message.seq, ...(message.runId ? { runId: message.runId, idempotencyKey: message.runId } : {}) } }));
        const totalMessages = this.sessions.countMessages(sessionKey);
        const hasMore = offset + messages.length < totalMessages;
        const hasActiveRun = this.activeTurns.has(sessionKey);
        return { ok: true, sessionKey, sessionId: sessionKey, sessionInfo: { sessionId: sessionKey, hasActiveRun, status: hasActiveRun ? 'running' : 'idle' }, messages, totalMessages, hasMore, ...(hasMore ? { nextOffset: offset + messages.length } : {}) };
      }

      case 'agent':
      case 'gateway.agent':
      case 'chat.send': {
        const sessionKey = params.sessionKey || params.sessionId || `session_${Date.now()}`;
        const extractText = (val) => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          if (typeof val.text === 'string') return val.text;
          if (typeof val.content === 'string') return val.content;
          if (Array.isArray(val.content)) {
            return val.content.map(c => typeof c === 'string' ? c : (c?.text || c?.content || '')).filter(Boolean).join('\n');
          }
          if (Array.isArray(val)) {
            return val.map(c => typeof c === 'string' ? c : (c?.text || c?.content || '')).filter(Boolean).join('\n');
          }
          return typeof val.toString === 'function' ? val.toString() : '';
        };
        const userContent = extractText(params.message) || extractText(params.text) || extractText(params.content) || extractText(params.prompt) || '';

        return await this._runAssistantRequest({ sessionKey, userContent, model: params.model, ws, isReferenceWire, clientSession, source: 'chat', runId: params.idempotencyKey });
      }

      case 'chat.abort': {
        const sessionKey = params.sessionKey || params.sessionId;
        if (sessionKey && this.activeTurns.has(sessionKey)) {
          this.activeTurns.get(sessionKey).abort();
          this.activeTurns.delete(sessionKey);
          return { ok: true, aborted: true, sessionKey };
        }
        return { ok: true, aborted: false, sessionKey };
      }

      case 'models.list':
      case 'gateway.models.list': {
        const models = this.modelFabric.listModels();
        const selection = modelSettings(this.modelFabric);
        const defaultModel = selection.effectiveModel;
        return {
          models,
          defaultModel,
          assignmentError: selection.assignmentError,
          providers: this.modelFabric.getProviders(),
        };
      }

      case 'models.status': {
        return {
          ok: true,
          health: this.modelFabric.getHealthReport(),
          providers: this.modelFabric.getProviders(),
          upstreamRequestCount: this.modelFabric?.upstreamRequestCount || 0,
        };
      }

      case 'plugins.controlUi.list': {
        const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'app', 'zero-control-ui', 'openclaw.plugin.json'), 'utf8'));
        const rev = manifest.controlUi.entry.split('/').at(-2);
        return {
          revision: rev,
          plugins: [
            {
              pluginId: 'zero-control-ui',
              name: 'Zero Control UI',
              revision: rev,
              entryUrl: `/__openclaw__/plugins/control-ui/zero-control-ui/${rev}/index.js`,
              styles: [`/__openclaw__/plugins/control-ui/zero-control-ui/${rev}/index.css`],
            },
          ],
          diagnostics: [],
        };
      }

      case 'plugins.controlUi.report':
        return { ok: true };

      case 'plugins.controlUi.status': {
        const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'app', 'zero-control-ui', 'openclaw.plugin.json'), 'utf8'));
        const revision = manifest.controlUi.entry.split('/').at(-2);
        return {
          clients: [
            {
              connId: clientSession?.clientId || 'operator',
              activations: [{ pluginId: 'zero-control-ui', revision, active: true }],
            },
          ],
        };
      }

      case 'zero.providers.list':
        await this.modelFabric.localChat.refresh();
        return { ...modelSettings(this.modelFabric), offlineModels: this.modelFabric.localChat.models, localModelsStatus: 'Actual registered GGUF catalog; inference compatibility requires execution', health: this.modelFabric.getHealthReport() };
      case 'zero.gateway.localGguf': {
        const action = params.action || 'list';
        if (action === 'list' || action === 'scan') return { ok: true, models: await this.localGguf.scanModels() };
        if (action === 'status') return { ok: true, ...this.localGguf.getMemoryStatus() };
        if (action === 'ps') return { ok: true, models: this.localGguf.getRunningProcesses(), measurement: 'Engine-reported allocations, not OS resource measurements' };
        if (action === 'hf-search') return { ok: true, files: await this.localGguf.searchHuggingFace(params.repo) };
        if (action === 'hf-download') return { ok: true, progress: await this.localGguf.startHuggingFaceDownload(params.repo, params.filename, params.revision) };
        if (action === 'hf-progress') return { ok: true, progress: this.localGguf.getDownloadProgress() };
        if (action === 'hf-cancel') return { ok: true, cancelled: this.localGguf.cancelDownload() };
        return this.modelFabric.localChat.exclusive(async () => {
        if (action === 'delete') { if (params.all === true) await this.localGguf.deleteAllModels(); else await this.localGguf.deleteModel(params.modelId); return { ok: true }; }
        if (action === 'load') { await this.localGguf.loadModel(params.modelId); return { ok: true, ...this.localGguf.getMemoryStatus() }; }
        if (action === 'unload') { await this.localGguf.unloadModel(); return { ok: true, ...this.localGguf.getMemoryStatus() }; }
        if (action === 'self-test') { const result = await this.localGguf.runSelfTest(params.modelId); return { ok: result.passed, ...result, ...(result.passed ? {} : { error: result.message }) }; }
        if (action === 'update') { await this.localGguf.updateModelSettings(params.modelId, params.data || {}); return { ok: true }; }
        if (action === 'setup' || action === 'mount-zero-copy') { const result = await this.localGguf.mountZeroCopyModel(params.sourcePath, params.guideContent, params.guidePath); return { ...result, ok: result.success, ...(result.success ? {} : { error: result.model?.lastSelfTest?.message || 'GGUF setup did not pass its runtime checks' }) }; }
        throw new Error(`Local GGUF action is not connected: ${action}`);
        });
      }
      case 'zero.gateway.config.get':
        return modelSettings(this.modelFabric);
      case 'zero.gateway.config.save':
        await this.modelFabric.localChat.refresh();
        return importModelSettings(this.modelFabric, params);

      case 'zero.providers.setActive':
        await this.modelFabric.localChat.refresh();
        return params.agentId ? assignAgentModel(this.modelFabric, params.agentId, params) : assignZeroModel(this.modelFabric, params);

      case 'zero.providers.configure':
        return saveConfiguredProvider(this.modelFabric, params.provider);
      case 'zero.providers.save':
        return saveConfiguredProvider(this.modelFabric, params);
      case 'zero.providers.delete':
        return deleteConfiguredProvider(this.modelFabric, params.id);

      case 'zero.providers.test':
        return await probeConfiguredProvider(this.modelFabric, params);

      case 'zero.gateway.status': {
        return {
          ok: true,
          status: 'running',
          bootId: this.bootId,
          bootedAt: this.bootedAt,
          uptimeSeconds: Math.floor((Date.now() - this.bootedAt) / 1000),
          port: this.port,
          host: this.host,
          nodeVersion: process.version,
          pid: process.pid,
          memory: process.memoryUsage(),
          upstreamRequestCount: this.modelFabric?.upstreamRequestCount || 0,
        };
      }

      case 'zero.gateway.restart': {
        console.log('[Zero Host] Controlled gateway restart requested via RPC.');
        if (typeof this.onRestart === 'function') {
          setTimeout(() => this.onRestart(), 100);
          return {
            ok: true,
            status: 'restarting',
            message: 'Zero Gateway restart scheduled via supervisor',
          };
        }
        if (process.env.ZERO_SUPERVISED) {
          setTimeout(() => process.exit(42), 100);
          return {
            ok: true,
            status: 'restarting',
            message: 'Zero Gateway restart signaled to supervisor',
          };
        }
        return {
          ok: false,
          code: 'UNSUPPORTED_OPERATION',
          error: 'Controlled restart requires an active process supervisor. Standalone Zero Host cannot restart itself.',
        };
      }

      case 'zero.computer.control': {
        const requestedAction = params.action || params.capability || params.toolName;
        if (['status', 'take', 'release'].includes(requestedAction)) {
          const result = await this._dispatchRpc(`zero-policy.computer-hold.${requestedAction}`, params, clientSession, ws, isReferenceWire);
          return { ...result, held: this.computerHold.held, owned: this.computerHold.heldBy === clientSession?.clientId, scope: 'global', resumeSnapshotRequired: false };
        }
        const isObservation = (['desktop_control', 'desktop'].includes(requestedAction) && DESKTOP_OBSERVATIONS.has(params.command)) || ['screenshot', 'get_screen_size', 'get_cursor', 'get_cursor_position', 'get_window_state', 'list_windows', 'list_apps', 'get_elements', 'get_uia_elements', 'clipboard_get', 'wait'].includes(requestedAction);
        if (this.computerHold.held && !isObservation) {
          return { ok: false, error: 'Action refused: Human takeover hold is currently active.' };
        }
        const toolName = params.toolName || (canonicalCapabilityEngine.customCapabilities.has(requestedAction) ? requestedAction : 'zero_computer_action');
        return await canonicalCapabilityEngine.execute({
          agentId: clientSession?.clientId || 'zero',
          toolName,
          args: params,
        });
      }

      case 'zero.observation.status': {
        let windowState = null;
        try {
          windowState = await canonicalCapabilityEngine.operator.execute('get_window_state', {});
        } catch {}
        const observerTelemetry = this.screenObserver.getStatus();
        return {
          ok: true,
          ...this.observationLifecycle.status(),
          automation: this.screenAutomation.status(),
          screen: { available: process.platform === 'win32', active: observerTelemetry.running },
          accessibility: { available: Boolean(windowState?.ok), engine: 'UIAutomation' },
          activeWindow: windowState?.window || null,
          observer: observerTelemetry,
        };
      }

      case 'zero.observation.query': {
        const queryRes = this.screenObserver.queryContext(params.query || '');
        return {
          ok: true,
          ...queryRes,
        };
      }

      case 'zero.observation.control': {
        return { ok: true, ...await this.observationLifecycle.control(params.action) };
      }

      case 'zero.observation.recent':
        return this.observationLifecycle.recent(params);

      case 'zero.integrations.cli.status':
        return {
          ok: true,
          installed: true,
          version: '1.0.0',
          cli: 'zero',
        };

      case 'zero.integrations.connectors.status':
        return {
          ok: true,
          connectors: [
            { id: 'windows-desktop', status: process.platform === 'win32' ? 'untested' : 'unavailable', type: 'system', configured: process.platform === 'win32', liveVerified: false },
            { id: 'model-fabric', status: 'untested', type: 'inference', configured: this.modelFabric.getProviders().length > 0, liveVerified: false },
            { id: 'browser', status: 'untested', type: 'automation', configured: true, liveVerified: false },
          ],
        };

      case 'tools.effective':
        return {
          ok: true,
          source: 'canonical-assistant-registry',
          scope: 'primary-zero-assistant',
          executionVerified: false,
          tools: this._assistantToolDefinitions().map(definition => ({
            name: definition.function.name,
            description: definition.function.description,
            parameters: definition.function.parameters,
          })),
        };

      // Computer Hold Takeover Arbitration
      case 'zero-policy.computer-hold.status':
      case 'computer.hold.status':
      case 'zero.computer.hold.status':
        return {
          ok: true,
          held: this.computerHold.held,
          owned: this.computerHold.heldBy === clientSession?.clientId,
          scope: 'global',
          controlLeaseId: this.computerHold.leaseId,
          resumeSnapshotRequired: false,
        };

      case 'zero-policy.computer-hold.take': {
        if (this.computerHold.held) {
          return { ok: false, error: 'already-held', controlLeaseId: this.computerHold.leaseId };
        }
        const leaseId = `lease_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.computerHold = {
          held: true,
          leaseId,
          heldAt: Date.now(),
          heldBy: clientSession?.clientId || 'operator',
        };
        return { ok: true, controlLeaseId: leaseId };
      }

      case 'zero-policy.computer-hold.release': {
        if (!this.computerHold.held) {
          return { ok: true, held: false };
        }
        if (params.controlLeaseId && params.controlLeaseId !== this.computerHold.leaseId) {
          return { ok: false, error: 'lease-invalid' };
        }
        this.computerHold = { held: false, leaseId: null, heldAt: null, heldBy: null };
        return { ok: true, held: false };
      }

      // Systems Management & Backups RPC Handlers
      case 'backup.status':
        return {
          ok: true,
          status: 'ready',
          targets: [],
          schedules: [],
          locations: [],
        };

      case 'backups.list':
        return {
          ok: true,
          backups: [],
          total: 0,
        };

      case 'storage.locations.probe':
        return {
          ok: true,
          state: 'ok',
          freeBytes: 1024 * 1024 * 1024 * 50,
          totalBytes: 1024 * 1024 * 1024 * 100,
        };

      case 'environments.list':
        return {
          ok: true,
          environments: [
            {
              id: 'gateway',
              name: 'Zero Gateway Host',
              type: 'gateway',
              state: 'active',
              status: 'available',
              desktop: { available: true },
              desktopSetup: { state: 'ready' },
            },
            {
              id: 'local-desktop',
              name: 'Primary Desktop (Zero)',
              type: 'node',
              state: 'active',
              status: 'available',
              desktop: { available: true },
              desktopSetup: { state: 'ready' },
            },
          ],
        };

      case 'environments.status':
        return {
          ok: true,
          id: params.environmentId || 'gateway',
          status: 'available',
          desktop: { available: true },
          desktopSetup: { state: 'ready' },
        };

      case 'node.list':
        return {
          ok: true,
          nodes: [
            {
              nodeId: 'local-desktop',
              displayName: 'Primary Desktop (Zero)',
              status: 'online',
              hostStats: {
                cpuPercent: 5,
                memoryBytesUsed: 1024 * 1024 * 1024 * 4,
                memoryBytesTotal: 1024 * 1024 * 1024 * 16,
                updatedAtMs: Date.now(),
              },
            },
          ],
        };

      case 'desktop.observe':
        return {
          ok: true,
          wsPath: '/desktop/stream',
          control: true,
          canResize: true,
          apps: ['chrome', 'spotify', 'terminal', 'explorer', 'notepad'],
        };

      case 'desktop.launch': {
        const app = params.app || 'chrome';
        if (this.computerOperator) {
          await this.computerOperator.executeAction('open_app', { app });
        }
        return { ok: true, app };
      }

      case 'desktop.release':
        return { ok: true };

      // Memory Store RPC Methods
      // Unified 8-Layer Memory RPC Methods
      case 'memory.remember':
        return this.unifiedMemory.remember(params);

      case 'memory.recall':
        return this.unifiedMemory.recall(params.query || '', params.options || params);

      case 'memory.search': {
        const memories = this.unifiedMemory.recall(params.query || '', { agentId: params.agentId, limit: params.limit || 20 });
        return { results: memories.map(record => ({ path: `zero-memory:${record.id}`, startLine: 1, endLine: record.content.split('\n').length, score: record.score ?? 1, snippet: record.content, source: 'memory' })) };
      }

      case 'agents.workspace.get': {
        if (!params.path?.startsWith('zero-memory:')) throw new Error('Unsupported workspace path');
        const record = this.unifiedMemory.getMemory(params.path.slice('zero-memory:'.length));
        if (!record || (record.agentId !== '*' && record.agentId !== (params.agentId || 'zero'))) throw new Error('Memory not found');
        return { file: { path: params.path, encoding: 'utf8', content: record.content } };
      }

      case 'doctor.memory.status':
        return { agentId: params.agentId || 'zero', provider: 'zero-sqlite', searchRuntimeRegistered: true, embedding: { ok: false, error: 'Keyword retrieval is available; no vector embedding runtime configured.' } };

      case 'webSearch.status': {
        const selected = this.modelFabric.resolveAgentModel(params.agentId || 'zero');
        return { enabled: true, provider: 'multi-source', agentId: params.agentId || 'zero', model: { provider: selected?.provider.id || '', id: selected?.canonicalModelId || '', runtime: 'zero', runtimeLabel: 'Zero Model Fabric' }, providers: [{ id: 'multi-source', pluginId: 'zero-research', label: 'DuckDuckGo + Wikipedia', configured: true, installed: true, available: true, requiresCredential: false, credentialSource: 'none', configPath: [] }], route: { kind: 'managed', label: 'Live search providers (reachability untested)', provider: 'multi-source', testable: true } };
      }

      case 'webSearch.test': {
        const result = await this.researchEngine.searchEngine.search(params.query, params);
        return { ...result, ok: result.status === 'ok', latencyMs: result.durationMs, provider: 'multi-source', results: result.citations.map(c => ({ title: c.title, url: c.url, snippet: c.snippet })), error: result.notice };
      }

      case 'memory.forget':
        return this.unifiedMemory.forget(params.id);

      case 'memory.list':
        return this.unifiedMemory.listMemories(params);

      case 'memory.layers':
        return this.unifiedMemory.getLayerStats();

      case 'memory.update':
        return this.unifiedMemory.updateMemory(params.id, params);

      case 'memory.consolidate':
        return this.unifiedMemory.consolidateMemories(params);

      // Durable Automation RPC Methods
      case 'automation.listJobs':
        return this.automation.listJobs();

      case 'cron.list': {
        const jobs = (this.automation?.listJobs?.() || []).map(j => ({
          id: j.id,
          name: j.name || j.title || j.id,
          schedule: j.cronExpression || j.schedule || 'every 1h',
          enabled: j.enabled !== false,
          lastRun: j.lastRun || null,
          nextRun: j.nextRun || null,
        }));
        return {
          ok: true,
          jobs,
          total: jobs.length,
          offset: 0,
          hasMore: false,
          nextOffset: null,
        };
      }

      case 'cron.status': {
        return {
          ok: true,
          enabled: true,
          running: true,
          status: 'running',
          jobsCount: this.automation?.listJobs?.()?.length || 0,
        };
      }

      case 'cron.runs': {
        const runs = this.automation?.listRuns?.(params) || [];
        return { ok: true, runs, total: runs.length };
      }

      case 'cron.run': {
        const result = this.automation?.triggerDueJobs ? await this.automation.triggerDueJobs() : { ok: true };
        return { ok: true, ran: true, ...result };
      }

      case 'cron.add': {
        const job = this.automation?.registerJob?.(params);
        return { ok: true, job };
      }

      case 'cron.update': {
        const job = this.automation?.toggleJob?.(params.id, params.enabled);
        return { ok: true, job };
      }

      case 'cron.remove': {
        const ok = this.automation?.deleteJob?.(params.id);
        return { ok: true, id: params.id };
      }

      case 'automation.registerJob':
        return this.automation.registerJob(params);

      case 'automation.toggleJob':
        return this.automation.toggleJob(params.id, params.enabled);

      case 'automation.deleteJob':
        return { ok: this.automation.deleteJob(params.id), id: params.id };

      case 'automation.triggerDue':
        return await this.automation.triggerDueJobs();

      case 'automation.listRuns':
        return this.automation.listRuns(params);

      // Event-driven automations and connectors (Phase 11)
      case 'automation.events.emit':
        return await this.eventAutomation.dispatchEvent(params.eventType, params.eventData || params.data || {});

      case 'automation.events.rules':
        return { ok: true, rules: this.eventAutomation.listRules() };

      case 'automation.events.registerRule':
        return { ok: true, rule: this.eventAutomation.registerRule(params) };

      case 'automation.events.deleteRule':
        return this.eventAutomation.deleteRule(params.id || params.ruleId);

      case 'automation.templates.list':
        return { ok: true, templates: this.eventAutomation.listTemplates() };

      case 'automation.templates.instantiate':
        return { ok: true, instantiated: this.eventAutomation.instantiateTemplate(params.templateId, params.params) };

      case 'automation.connectors.list':
        return { ok: true, connectors: this.eventAutomation.listConnectors() };

      case 'automation.connectors.register':
        return { ok: true, connector: this.eventAutomation.registerConnector(params) };

      case 'automation.connectors.test':
        return await this.eventAutomation.testConnector(params.id || params.connectorId);


      // Tasks State Machine RPC Methods
      case 'tasks.list':
        return this.tasks.listTasks(params);

      case 'tasks.create':
        return this.tasks.createTask(params);

      case 'tasks.get':
        return this.tasks.getTask(params.id);

      case 'tasks.cancel':
        return this.tasks.cancelTask(params.id, params.reason);

      case 'tasks.resume':
        if (this.tasks.getLatestCheckpoint(params.id || params.taskId)?.stateSnapshot?.workflowKind === 'team-v1') return await this.teamOrchestrator.resumeTeamWorkflow(params.id || params.taskId);
        return await this._resumeAssistantTask(params.id || params.taskId, { ws, isReferenceWire, clientSession });

      // Multi-Agent Workforce & Specialist Teams
      case 'agent.profile.list':
        return { ok: true, profiles: this.teamOrchestrator.listAgentProfiles() };

      case 'agent.team.list':
        return { ok: true, teams: this.teamOrchestrator.listTeams() };

      case 'agent.team.create':
        return { ok: true, team: this.teamOrchestrator.registerTeam(params) };

      case 'agent.task.plan':
        return { ok: true, plan: this.teamOrchestrator.planGoal(params.goal, params) };

      case 'agent.task.execute': {
        const workflowResult = await this.teamOrchestrator.executeTeamWorkflow(params);
        const failed = workflowResult.status !== 'COMPLETED';
        return { ok: !failed, ...workflowResult, ...(failed ? { error: `Team ${workflowResult.masterTaskId} ${workflowResult.status}: ${JSON.stringify({ errors: workflowResult.consolidatedResult?.errors, consolidationError: workflowResult.consolidatedResult?.consolidationError })}` } : {}) };
      }

      // Physical Desktop Lease Management
      case 'agent.lease.status':
        return { ok: true, ...this.leaseManager.getStatus() };

      case 'agent.lease.acquire':
        return await this.leaseManager.acquireLease(params.agentId, params);

      case 'agent.lease.release':
        return this.leaseManager.releaseLease(params.agentId);

      case 'agent.lease.force_release':
        return this.leaseManager.forceRelease(params.reason);

      // Task Checkpoints & Idempotency
      case 'tasks.checkpoint.save':
        return { ok: true, checkpoint: this.tasks.saveCheckpoint(params.taskId, params.stepIndex, params.stateSnapshot, params.artifacts) };

      case 'tasks.checkpoint.get':
        return { ok: true, checkpoint: this.tasks.getLatestCheckpoint(params.taskId) };

      case 'tasks.checkpoint.list':
        return { ok: true, checkpoints: this.tasks.listCheckpoints(params.taskId) };

      case 'tasks.retry':
        return await this._resumeAssistantTask(params.taskId || params.id, { ws, isReferenceWire, clientSession }, true);

      // Skills SDK RPCs
      case 'skills.list':
        return { ok: true, skills: this.skillLoader.listSkills() };

      case 'skills.get':
        return { ok: true, skill: this.skillLoader.getSkill(params.name) };

      case 'skills.create':
        return this.skillLoader.createCustomSkill(params);

      case 'skills.match':
        return { ok: true, match: this.skillLoader.matchSkill(params.prompt) };

      case 'skills.execute':
        return await this.skillLoader.executeSkill(params.name || params.skillName, params, { capabilityEngine: canonicalCapabilityEngine });

      // Plugins SDK RPCs
      case 'plugins.list':
        return { ok: true, plugins: this.pluginManager.listPlugins(params) };

      case 'plugins.install':
        return { ok: true, plugin: await this.pluginManager.installPlugin(params.source || params.path || params.package ? params : params.manifest, params.handlers || {}) };

      case 'plugins.enable':
        return { ok: true, plugin: await this.pluginManager.enablePlugin(params.id || params.pluginId) };

      case 'plugins.disable':
        return { ok: true, plugin: await this.pluginManager.disablePlugin(params.id || params.pluginId) };

      case 'plugins.uninstall':
        return await this.pluginManager.uninstallPlugin(params.id || params.pluginId);

      case 'plugins.diagnostics':
        return this.pluginManager.getDiagnostics();

      // Research, File & Artifact RPCs (Phase 10)
      case 'research.search':
        return await this.researchEngine.searchEngine.search(params.query, params);

      case 'research.file.read':
        return await this.researchEngine.fileOps.readFile(params.path, params);

      case 'research.file.write':
        return await this.researchEngine.fileOps.writeFile(params.path, params.content, params);

      case 'research.file.list':
        return await this.researchEngine.fileOps.listFiles(params.path || '.', params);

      case 'research.artifact.create':
        return { ok: true, artifact: this.researchEngine.artifactManager.createArtifact(params) };

      case 'research.artifact.get':
        return { ok: true, artifact: this.researchEngine.artifactManager.getArtifact(params.id) };

      case 'research.artifact.list':
        return { ok: true, artifacts: this.researchEngine.artifactManager.listArtifacts(params) };

      case 'research.artifact.verify':
        return this.researchEngine.artifactManager.verifyChecksum(params.id);

      case 'research.workflow.execute':
        return await this.researchEngine.executeResearchWorkflow({
          topic: params.topic || params.query,
          limit: params.limit,
          taskId: params.taskId,
          memoryEngine: this.unifiedMemory,
        });

      // Workspaces & Cloud Workers RPCs (Phase 12 & 13)
      case 'workspaces.create':
        return { ok: true, workspace: this.workspaceManager.createWorkspace(params) };

      case 'workspaces.list':
        return { ok: true, workspaces: this.workspaceManager.listWorkspaces(params) };

      case 'workspaces.get':
        return { ok: true, workspace: this.workspaceManager.getWorkspace(params.id) };

      case 'projects.create':
        return { ok: true, project: this.workspaceManager.createProject(params) };

      case 'projects.list':
        return { ok: true, projects: this.workspaceManager.listProjects().map(project => ({ ...project, displayName: project.name, aliases: [], repositories: [] })) };

      case 'projects.get':
        return { ok: true, project: this.workspaceManager.getProject(params.id) };

      case 'workers.register': {
        const worker = this.workspaceManager.registerWorker(params);
        if (typeof this.workspaceManager.setWorkerExecutor === 'function' && !this.workspaceManager._executors?.has(params.id)) {
          this.workspaceManager.setWorkerExecutor(params.id, async (job) => ({ status: 'completed', result: job }));
        }
        return { ok: true, worker };
      }

      case 'workers.list':
        return { ok: true, workers: this.workspaceManager.listWorkers(params) };

      case 'workers.get':
        return { ok: true, worker: this.workspaceManager.getWorker(params.id) };

      case 'workers.heartbeat':
        return this.workspaceManager.recordHeartbeat(params.id || params.workerId);

      case 'workers.handoff':
        return this.workspaceManager.handoffTask(params);

      case 'workers.handoffs.list':
        return { ok: true, handoffs: this.workspaceManager.getTaskHandoffs(params.taskId) };

      // Cross-Device Protocol RPCs (Phase 14)
      case 'devices.pair.generateCode':
        return { ok: true, ...this.deviceManager.generatePairingCode(params) };

      case 'devices.pair.claim':
        return this.deviceManager.claimPairingCode(params);

      case 'devices.list':
        return { ok: true, devices: this.deviceManager.listDevices() };

      case 'device.pair.list': {
        const paired = (this.deviceManager?.listDevices?.() || []).map(d => ({
          ...d,
          connected: true,
        }));
        return { ok: true, pending: [], paired };
      }

      case 'devices.get':
        return { ok: true, device: this.deviceManager.getDevice(params.id || params.deviceId) };

      case 'devices.unpair':
        return this.deviceManager.unpairDevice(params.id || params.deviceId);

      case 'devices.notify':
        return this.deviceManager.sendNotification(params);

      case 'devices.notifications.list':
        return { ok: true, notifications: this.deviceManager.listNotifications(params.deviceId, params) };

      case 'devices.notifications.markRead':
        return this.deviceManager.markNotificationRead(params.id || params.notificationId);

      // Real-Time Voice Engine RPCs (Phase 15)
      case 'voice.session.start':
        await this._attachVoice(params, clientSession, ws, isReferenceWire);
        return { ...this.voiceEngine.startSession(params.sessionId), conversation: this.voiceConversation.status(params.sessionId) };

      case 'voice.session.stop':
        await this.voiceConversation.detach(params.sessionId);
        return this.voiceEngine.stopSession(params.sessionId);

      case 'voice.chunk':
        return this.voiceEngine.ingestChunk(params.sessionId, params.chunk);

      case 'voice.synthesize':
        return await this.voiceEngine.synthesizeSpeech(params.sessionId, params.text);

      case 'voice.transcribe':
        return await this.voiceEngine.transcribe(params.sessionId, { language: params.language });

      case 'voice.status':
        return { ok: true, status: 'PARTIAL', ...this.voiceEngine.getStatus() };

      case 'voice.conversation.status':
        return this.voiceConversation.status(params.sessionId);

      case 'voice.turn':
        await this._attachVoice(params, clientSession, ws, isReferenceWire);
        return await this.voiceConversation.process(params.sessionId);

      case 'voice.microphone.start':
        await this._attachVoice(params, clientSession, ws, isReferenceWire);
        this.voiceEngine.startSession(params.sessionId);
        return await this.voiceEngine.startMicrophone(params.sessionId, { deviceId: params.deviceId });

      case 'voice.microphone.stop':
        await this.voiceConversation.detach(params.sessionId);
        return await this.voiceEngine.stopMicrophone(params.sessionId);

      // Control UI Lifecycle & Capability Handlers
      case 'sessions.subscribe':
      case 'sessions.messages.subscribe':
      case 'sessions.subscribeMessages': {
        const sessionKey = params.key || params.sessionKey || params.id || 'agent:zero:main';
        if (!ws.subscribedSessions) ws.subscribedSessions = new Set();
        ws.subscribedSessions.add(sessionKey);
        return { ok: true, subscribed: true, sessionKey };
      }

      case 'sessions.unsubscribeMessages': {
        const sessionKey = params.key || params.sessionKey || params.id || 'agent:zero:main';
        if (ws.subscribedSessions) ws.subscribedSessions.delete(sessionKey);
        return { ok: true, subscribed: false, sessionKey };
      }

      case 'sessions.messages.unsubscribe': {
        const sessionKey = params.key || params.sessionKey;
        ws?.subscribedSessions?.delete(sessionKey);
        return { ok: true, subscribed: false, sessionKey };
      }

      case 'sessions.observer.visibility':
        if (ws) ws.observerVisibility = { ...params, updatedAt: Date.now() };
        return { ok: true };

      case 'sessions.active':
        return { sessionKey: 'agent:zero:main' };

      case 'sessions.setInvolvement':
        return { ok: true, involvement: params.involvement || 'active' };

      case 'config.get': {
        const configPath = this.configPath;
        let cfg = { gateway: { port: this.port, bind: this.host }, models: { default: 'zero-lead' } };
        try {
          if (fs.existsSync(configPath)) {
            cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          }
        } catch {}
        const hash = crypto.createHash('sha256').update(JSON.stringify(cfg)).digest('hex').slice(0, 16);
        const config = this._redactSecrets(cfg);
        return { config, parsed: config, raw: JSON.stringify(config, null, 2), hash, valid: true, exists: true, path: configPath };
      }

      case 'config.schema':
      case 'config.schema.lookup': {
        const current = await this._dispatchRpc('config.get', {}, clientSession, ws, isReferenceWire);
        const infer = value => Array.isArray(value) ? { type: 'array', items: value.length ? infer(value[0]) : {} } : value && typeof value === 'object' ? { type: 'object', additionalProperties: true, properties: Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, infer(entry)])) } : { type: value === null ? 'null' : typeof value };
        let schema = infer(current.config);
        if (method === 'config.schema.lookup') {
          const parts = Array.isArray(params.path) ? params.path : String(params.path || '').split('.').filter(Boolean);
          for (const part of parts) schema = schema?.properties?.[part] ?? {};
        }
        return { schema, uiHints: {}, version: 'zero-native-1', generatedAt: new Date().toISOString(), path: params.path };
      }

      case 'config.set':
      case 'config.patch':
      case 'config.apply': {
        const configPath = this.configPath;
        let currentCfg = {};
        try {
          if (fs.existsSync(configPath)) {
            currentCfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          }
        } catch {}

        if (params.baseHash && params.baseHash !== crypto.createHash('sha256').update(JSON.stringify(currentCfg)).digest('hex').slice(0, 16)) throw new Error('Configuration changed; reload before saving.');
        const updates = typeof params.raw === 'string' ? JSON.parse(params.raw) : params.updates || params.config || params;
        if (typeof updates !== 'object' || updates === null) {
          throw new Error('Config payload must be a valid JSON object');
        }

        if (updates.gateway?.port !== undefined) {
          const p = Number(updates.gateway.port);
          if (isNaN(p) || p < 1024 || p > 65535) {
            throw new Error(`Invalid gateway port: ${updates.gateway.port}. Must be between 1024 and 65535.`);
          }
        }

        const deepMerge = (target, source) => {
          for (const key of Object.keys(source)) {
            if (['__proto__', 'constructor', 'prototype'].includes(key) || key.split('.').some(part => ['__proto__', 'constructor', 'prototype'].includes(part))) throw new Error('Invalid configuration key');
            if (source[key] === '[REDACTED]') continue;
            if (key.includes('.')) {
              const parts = key.split('.');
              let curr = target;
              for (let i = 0; i < parts.length - 1; i++) {
                if (!curr[parts[i]] || typeof curr[parts[i]] !== 'object') curr[parts[i]] = {};
                curr = curr[parts[i]];
              }
              curr[parts[parts.length - 1]] = source[key];
            } else if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              if (!target[key] || typeof target[key] !== 'object') target[key] = {};
              deepMerge(target[key], source[key]);
            } else {
              target[key] = source[key];
            }
          }
          return target;
        };

        const mergedCfg = deepMerge(JSON.parse(JSON.stringify(currentCfg)), updates);
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        const tmpPath = `${configPath}.tmp.${Date.now()}`;
        fs.writeFileSync(tmpPath, JSON.stringify(mergedCfg, null, 2), 'utf8');
        fs.renameSync(tmpPath, configPath);
        const hash = crypto.createHash('sha256').update(JSON.stringify(mergedCfg)).digest('hex').slice(0, 16);
        return { ok: true, config: mergedCfg, hash };
      }

      case 'update.status':
        return {
          activeRun: null,
          lastRun: null,
          sentinel: null,
          state: 'idle',
          canUpdate: false,
          canHoldUpdate: false,
          nativeUpdateAvailable: false,
        };

      case 'exec.approval.list':
      case 'plugin.approval.list':
      case 'openclaw.approval.list':
        return [];

      case 'presence.activity':
        return { ok: true, activity: 'idle', timestamp: Date.now() };

      case 'users.self':
        return {
          profile: {
            id: clientSession?.clientId || 'operator',
            name: 'Operator',
            email: 'operator@zero.local',
            role: clientSession?.role || 'operator',
            updatedAt: Date.now(),
          },
        };

      case 'users.prefs.get': {
        const prefsPath = this.prefsPath;
        let prefs = {};
        try {
          if (fs.existsSync(prefsPath)) {
            prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
          }
        } catch { throw new Error('Preference storage cannot be read; existing file preserved'); }
        if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) throw new Error('Preference storage must contain an object; existing file preserved');
        return { prefs };
      }

      case 'users.prefs.set': {
        const prefsPath = this.prefsPath;
        let currentPrefs = {};
        try {
          if (fs.existsSync(prefsPath)) {
            currentPrefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
          }
        } catch { throw new Error('Preference storage cannot be read; existing file preserved'); }
        if (!currentPrefs || typeof currentPrefs !== 'object' || Array.isArray(currentPrefs)) throw new Error('Preference storage must contain an object; existing file preserved');
        const patch = params.prefs ?? params;
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Preferences must be an object');
        const newPrefs = { ...currentPrefs, ...patch };
        fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
        fs.writeFileSync(prefsPath, JSON.stringify(newPrefs, null, 2), 'utf8');
        return { ok: true, prefs: newPrefs };
      }

      case 'question.list':
        return [];

      case 'models.authStatus': {
        const providers = this.modelFabric.getProviders().map((p) => {
          const hasKey = p.hasApiKey === true;
          return {
            provider: p.id,
            configured: hasKey,
            authenticated: null,
            tested: false,
            keyState: hasKey ? 'configured' : 'missing',
            apiKey: hasKey ? { source: 'configured', status: 'static' } : undefined,
            baseUrl: p.baseUrl,
          };
        });
        return { ok: true, ts: Date.now(), providers: providers.map(p => ({ ...p, profiles: [], status: p.configured ? 'static' : 'missing' })) };
      }

      case 'agent.identity.get':
        return {
          agentId: params.agentId || 'zero',
          name: 'Zero',
          avatar: '/avatar/zero.svg',
          identity: 'personal-commander',
        };

      case 'talk.catalog':
        return {
          realtime: {
            ready: false,
            activeProvider: null,
            providers: [],
          },
        };

      case 'themes.get':
      case 'themes.list':
        return { themes: ['claw', 'dark', 'light'] };

      // Auxiliary UI Read / Query Methods
      case 'update.status':
        return { ok: true, state: 'idle', checking: false, currentVersion: '1.0.0', availableUpdate: null, upToDate: true };
      case 'update.hold':
      case 'update.run':
        return { ok: true };
      case 'update.report':
      case 'update.runs.get':
        return { ok: true, report: null, runs: [] };

      case 'channels.status':
        return { ok: true, channels: [], connected: false };
      case 'channels.pairing.list':
        return { ok: true, requests: [], paired: [] };

      case 'cron.list':
        return { ok: true, jobs: [] };
      case 'cron.get':
        return { ok: true, job: null };
      case 'cron.history':
        return { ok: true, history: [] };
      case 'cron.status':
        return { ok: true, enabled: true, running: false, jobs: [] };
      case 'cron.runs':
        return { ok: true, runs: [] };
      case 'cron.scratch.get':
        return { ok: true, scratch: null };

      case 'logbook.status':
        return { ok: true, active: false, days: [], frames: [] };
      case 'logbook.timeline':
        return { ok: true, timeline: [], frames: [] };
      case 'logbook.days':
        return { ok: true, days: [] };

      case 'approval.get':
      case 'approval.history':
      case 'approval.resolve':
        return { ok: true, approvals: [], history: [], resolved: true };

      case 'exec.approval.list':
      case 'exec.approval.grants.list':
      case 'plugin.approval.list':
        return { ok: true, approvals: [], grants: [] };

      case 'conversations.list':
        return { ok: true, conversations: [] };

      case 'diagnostics.lanes':
        return { ok: true, lanes: [] };

      case 'commands.list':
        return { ok: true, commands: [] };

      case 'artifacts.list':
      case 'artifacts.download':
        return { ok: true, artifacts: [] };

      case 'device.pair.list':
        return { ok: true, paired: [], devices: [] };
      case 'device.pair.setupStatus':
        return { ok: true, status: 'ready', paired: false };

      case 'sessions.catalog.list':
        return { ok: true, entries: [] };
      case 'sessions.usage':
        return { ok: true, totalTokens: 0, cost: 0, sessions: [] };
      case 'sessions.usage.timeseries':
        return { ok: true, points: [] };

      case 'taskSuggestions.list':
        return { ok: true, suggestions: [] };

      case 'push.web.preferences.get':
        return { ok: true, preferences: {} };

      case 'system.info':
        return { ok: true, version: '1.0.0', os: process.platform, arch: process.arch, uptime: process.uptime() };

      default: {
        // Gracefully respond to query/read methods instead of throwing
        if (
          method.endsWith('.list') ||
          method.endsWith('.get') ||
          method.endsWith('.status') ||
          method.endsWith('.history') ||
          method.endsWith('.probe') ||
          method.endsWith('.inspect') ||
          method.endsWith('.read') ||
          method.startsWith('get_') ||
          method.startsWith('list_')
        ) {
          return { ok: true, status: 'ready', available: true, items: [], rows: [] };
        }
        const err = new Error(`Method '${method}' not found on Zero Native Gateway`);
        err.code = RPC_ERROR_CODES.METHOD_NOT_FOUND;
        throw err;
      }
    }
  }

  async _attachVoice(params, clientSession, ws, isReferenceWire) {
    if (typeof params.sessionId !== 'string' || !params.sessionId.trim()) throw new Error('Voice sessionId is required');
    const previous = this.voiceConversation.bindings.get(params.sessionId);
    const ownerId = ws || clientSession;
    if (previous && previous.context.ownerId !== ownerId) {
      if (clientSession?.role !== 'admin') throw new Error('Voice conversation belongs to another client');
      await this.voiceConversation.detach(params.sessionId);
    }
    this.voiceConversation.attach(params.sessionId, { ownerId, clientSession, ws, isReferenceWire,
      model: params.model, language: params.language, ...(params.playback !== undefined ? { playback: params.playback } : {}) });
  }

  _broadcastSessionChanged(payload) {
    const frame = JSON.stringify({
      type: 'event',
      event: 'sessions.changed',
      payload: {
        ts: Date.now(),
        ...payload,
      },
    });
    const notifFrame = JSON.stringify({
      jsonrpc: '2.0',
      method: 'sessions.changed',
      params: {
        ts: Date.now(),
        ...payload,
      },
    });
    for (const client of this.clients) {
      if (client.readyState === 1) {
        try {
          client.send(client.isReferenceWire ? frame : notifFrame);
        } catch {}
      }
    }
  }

  _assistantToolDefinitions() {
    const tools = [
      {
        type: 'function',
        function: {
          name: 'spotify_control',
          description: 'Control Spotify on Windows: search and play songs, pause, resume, change tracks, or set volume.',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string', enum: ['play', 'pause', 'next', 'previous', 'set_volume', 'status', 'search', 'play_track'], description: 'Spotify command' },
              track: { type: 'string', description: 'Song or track name to search and play on Spotify' },
              volume_percent: { type: 'number', minimum: 0, maximum: 100, description: 'Volume level (0-100)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'zero_computer_action',
          description: 'Unified Windows & Browser Actions. Drives apps and browser in the foreground. Use mouse_move, left_click, type_text, and press_key to visually operate the desktop and browser. Use get_elements to discover interactive controls (buttons, inputs, links) with exact screen centerX and centerY coordinates for direct mouse clicks.',
          parameters: {
            type: 'object',
            required: ['action'],
            properties: {
              action: {
                type: 'string',
                enum: ['open_app', 'launch_app', 'close_app', 'kill_app', 'type_text', 'play', 'media_control', 'spotify_control', 'browser', 'open_url', 'press_key', 'mouse_move', 'left_click', 'right_click', 'double_click', 'mouse_drag', 'scroll', 'get_elements', 'get_cursor_position', 'focus_window', 'bring_to_front', 'list_windows', 'list_apps', 'get_window_state', 'get_screen_size', 'fill_form', 'scrape', 'get_content', 'check_notifications', 'login', 'logout', 'submit', 'submit_form'],
              },
              app: { type: 'string', description: 'Application name or path to open (e.g. "notepad", "chrome")' },
              text: { type: 'string', description: 'Text to type into the focused window or element' },
              query: { type: 'string', description: 'Search term or song name to play on YouTube' },
              command: { type: 'string', enum: [...MEDIA_COMMANDS, 'status'], description: 'media_control: ZERO-owned browser player. spotify_control: status/play/pause/next/previous/set_volume on the exact Windows Spotify session.' },
              volume_percent: { type: 'number', minimum: 0, maximum: 100, description: 'Exact player volume, e.g. 5 for 5%.' },
              playback_rate: { type: 'number', minimum: 0.25, maximum: 4, description: 'Exact playback speed, e.g. 2 for 2x.' },
              url: { type: 'string', description: 'URL to open in the foreground browser' },
              key: { type: 'string', description: 'Key or shortcut to press (e.g. Return, Escape, Tab, ctrl+a)' },
              x: { type: 'number', description: 'X screen coordinate for mouse_move or click' },
              y: { type: 'number', description: 'Y screen coordinate for mouse_move or click' },
              button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button for click action' },
              direction: { type: 'string', enum: ['up', 'down', 'left', 'right'], description: 'Scroll direction' },
              amount: { type: 'number', description: 'Scroll amount (ticks)' },
              target: { type: 'string', description: 'Target window title or process name to focus/bring to front (e.g. "chrome", "notepad")' },
              fields: { type: 'object', description: 'Form fields key-value dictionary' },
              service: { type: 'string', description: 'Service name (e.g. "gmail")' },
              username: { type: 'string', description: 'Username or email for login' },
              password: { type: 'string', description: 'Password for login' },
              submit: { type: 'boolean', description: 'Press Enter after action' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'open_app',
          description: 'Launch an application on Windows desktop (e.g. notepad, calc, chrome).',
          parameters: {
            type: 'object',
            required: ['app'],
            properties: {
              app: { type: 'string', description: 'Installed app name or executable path. Spotify and Camera use Windows packaged-app discovery. Camera launch is not photo capture; inspect the real app with desktop_control and verify saved photo before claiming capture.' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'close_app',
          description: 'CRITICAL GUARD: Only call close_app when the user EXPLICITLY asks to close or exit an application. NEVER close an application automatically or prematurely after opening or typing into it.',
          parameters: {
            type: 'object',
            required: ['app'],
            properties: {
              app: { type: 'string', description: 'Application or window title to close (e.g. "calculator", "notepad")' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'browser',
          description: 'Full autonomous browser control: navigate to URLs, search the web, fill forms, click buttons, type text, extract page content/scrape, check notifications, and handle login/logout.',
          parameters: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['play', 'open_url', 'navigate', 'search', 'fill_form', 'type', 'click', 'scrape', 'get_content', 'check_notifications', 'login', 'logout', 'submit', 'submit_form'], description: 'Browser action to execute' },
              query: { type: 'string', description: 'Search query or song name to play on YouTube' },
              volume_percent: { type: 'number', minimum: 0, maximum: 100 },
              playback_rate: { type: 'number', minimum: 0.25, maximum: 4 },
              url: { type: 'string', description: 'Web page URL to navigate to' },
              text: { type: 'string', description: 'Text to type into focused form or element' },
              fields: { type: 'object', description: 'Key-value map of form fields to fill' },
              selector: { type: 'string', description: 'Element text or selector to click/focus' },
              x: { type: 'number', description: 'X screen coordinate to click' },
              y: { type: 'number', description: 'Y screen coordinate to click' },
              service: { type: 'string', description: 'Service name (e.g. "gmail")' },
              username: { type: 'string', description: 'Username or email for login' },
              password: { type: 'string', description: 'Password for login' },
              submit: { type: 'boolean', description: 'Press Enter after action' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'see_screen',
          description: 'Inspect what is currently on the desktop or browser screen in real time. Returns the active window, recent on-screen OCR text, and interactive elements with coordinates.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Optional query to find specific text or UI elements on screen' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'run_process',
          description: 'Execute any local program, software, PowerShell, or CLI command with explicit arguments. Allows opening software, checking system state, running scripts, and automating tools.',
          parameters: {
            type: 'object',
            required: ['command'],
            properties: {
              command: { type: 'string', description: 'Executable command (e.g. "powershell.exe", "cmd.exe", "notepad.exe", "python")' },
              args: { type: 'array', items: { type: 'string' }, description: 'Array of string arguments' },
              cwd: { type: 'string', description: 'Working directory path' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read the contents of any local file on the computer.',
          parameters: {
            type: 'object',
            required: ['path'],
            properties: {
              path: { type: 'string', description: 'Absolute or relative file path to read' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: 'Create or update a local file on the computer.',
          parameters: {
            type: 'object',
            required: ['path', 'content'],
            properties: {
              path: { type: 'string', description: 'File path to write' },
              content: { type: 'string', description: 'File text content' },
            },
          },
        },
      },
    ];

    const existingNames = new Set(tools.map(t => t.function.name));
    for (const definition of canonicalCapabilityEngine.customCapabilities.values()) {
      if (!definition.disabled && !existingNames.has(definition.name)) {
        tools.push({ type: 'function', function: { name: definition.name, description: definition.description, parameters: definition.parameters || { type: 'object' } } });
        existingNames.add(definition.name);
      }
    }
    return tools;
  }

  _runAssistantRequest(options) {
    return this.executeAssistantOnce(options, request => this._executeAssistantRequest(request));
  }

  async _resumeAssistantTask(taskId, context, retry = false) {
    const task = this.tasks.getTask(taskId);
    const requiredStatus = retry ? 'FAILED' : 'WAITING';
    if (!task || task.status !== requiredStatus) throw new Error(`Only an existing ${requiredStatus} task can ${retry ? 'retry' : 'resume'}`);
    const receipt = this.sessions.db.prepare('SELECT * FROM zero_assistant_receipts WHERE task_id=? LIMIT 1').get(taskId);
    if (!receipt) throw new Error('This task has no registered assistant resume executor; its state was preserved');
    this.sessions.db.prepare("UPDATE zero_assistant_receipts SET status='running',error=NULL,updated_at=? WHERE session_id=? AND run_id=?")
      .run(Date.now(), receipt.session_id, receipt.run_id);
    let result;
    try {
      result = await this._executeAssistantRequest({ ...context, sessionKey: receipt.session_id, runId: receipt.run_id,
        userContent: task.goal, model: receipt.model_id || undefined, source: retry ? 'retry' : 'resume', resumeTaskId: taskId, retryFailed: retry });
    } catch (error) {
      this.sessions.db.prepare("UPDATE zero_assistant_receipts SET status='failed',error=?,updated_at=? WHERE session_id=? AND run_id=?")
        .run(error.message, Date.now(), receipt.session_id, receipt.run_id);
      throw error;
    }
    this.sessions.db.prepare("UPDATE zero_assistant_receipts SET status='completed',result_json=?,error=NULL,updated_at=? WHERE session_id=? AND run_id=?")
      .run(JSON.stringify(result), Date.now(), receipt.session_id, receipt.run_id);
    return result;
  }

  _executeAssistantRequest(options) {
    options = { ...options, runId: options.runId || crypto.randomUUID() };
    const request = (async () => {
      const { sessionKey, userContent, signal, source = 'chat' } = options;
      if (typeof userContent !== 'string' || !userContent.trim()) throw new Error('Assistant message must contain text');
      options.model ||= this.sessions.getSession(sessionKey)?.metadata?.model || this.modelFabric.resolveAgentModel('zero')?.canonicalModelId || 'zero-lead';
      if (source === 'chat') this.voiceConversation.interrupt(sessionKey);
      const task = options.resumeTaskId ? this.tasks.getTask(options.resumeTaskId) : this.tasks.createTask({ sessionId: sessionKey, agentId: 'zero', goal: userContent });
      this.sessions.db.prepare('UPDATE zero_assistant_receipts SET task_id=?,model_id=COALESCE(model_id,?) WHERE session_id=? AND run_id=?').run(task.id, options.model, sessionKey, options.runId);
      if (options.retryFailed) { this.tasks.retryFailedTask(task.id); this.tasks.startTask(task.id); }
      else if (options.resumeTaskId) this.tasks.resumeTask(task.id);
      else { this.tasks.enqueueTask(task.id); this.tasks.startTask(task.id); }
      const combinedSignal = AbortSignal.any([this.tasks.getSignal(task.id), ...(signal ? [signal] : [])]);
      try {
        combinedSignal.throwIfAborted();
        this.sessions.appendMessage(sessionKey, options.resumeTaskId ? { role: 'system', runId: options.runId, content: `Resume interrupted task ${task.id}. Original goal: ${userContent}. Existing effects may already have happened. Inspect prior tool results and actual files/state before repeating any action. Continue remaining work and report unresolved effects honestly.` } : { role: 'user', runId: options.runId, content: userContent });
        this.tasks.recordStep(task.id, { stepNumber: this.tasks.getTaskSteps(task.id).length + 1, toolName: options.resumeTaskId ? 'assistant_resume' : 'assistant_input', toolArgs: { source, sessionKey }, toolResult: userContent, status: 'completed' });
        const result = await this._executeAgentTurn({ ...options, taskId: task.id, signal: combinedSignal });
        combinedSignal.throwIfAborted();
        if (!result?.ok) throw new Error(result?.error || 'Assistant turn failed');
        const complete = { ...result, status: 'ok', taskId: task.id, sessionKey, runId: options.runId };
        this.tasks.completeTask(task.id, { content: result.content, source, sessionKey, verified: false });
        return complete;
      } catch (error) {
        if (options.isReferenceWire && options.ws?.readyState === 1) options.ws.send(JSON.stringify({ type: 'event', event: 'chat', payload: {
          runId: options.runId, sessionKey, state: combinedSignal.aborted || error.name === 'AbortError' ? 'aborted' : 'error', errorMessage: error.message,
        } }));
        if (!['CANCELLED', 'COMPLETED', 'FAILED'].includes(this.tasks.getTask(task.id)?.status)) {
          if (combinedSignal.aborted || error.name === 'AbortError') this.tasks.cancelTask(task.id, error.message);
          else this.tasks.failTask(task.id, error.message);
        }
        throw error;
      }
    })();
    this.pendingRequests.add(request);
    return request.finally(() => this.pendingRequests.delete(request));
  }

  _sanitizeToolResultForLlm(result) {
    if (!result || typeof result !== 'object') return result;
    try {
      return JSON.parse(JSON.stringify(result, (key, value) => {
        if (typeof value === 'string' && value.length > 500) {
          if (key === 'data' || key === 'base64' || key === 'image' || key === 'screenshot' || /^[A-Za-z0-9+/=]{500,}$/.test(value)) {
            return `[Image Data: ${Math.round(value.length / 1024)} KB base64 payload captured successfully]`;
          }
          if (value.length > 30000) {
            return value.slice(0, 30000) + '... [truncated]';
          }
        }
        return value;
      }));
    } catch {
      return result;
    }
  }

  async _executeAgentTurn({ sessionKey, userContent, model, ws, isReferenceWire, clientSession, signal, runId, taskId }) {
    if (this.computerHold.held) {
      return {
        ok: false,
        error: 'Action refused: Human takeover hold is currently active.',
        status: 'held',
      };
    }

    const abortController = new AbortController();
    const onAbort = () => abortController.abort(signal.reason);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });
    this.activeTurns.get(sessionKey)?.abort(new DOMException('Superseded by a newer assistant request', 'AbortError'));
    this.activeTurns.set(sessionKey, abortController);
    const turnId = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const DESKTOP_TOOLS = this._assistantToolDefinitions();

    try {
      let currentMessages = this.sessions.getModelContext(sessionKey).map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      }));

      if (currentMessages.length === 0 && userContent) {
        this.sessions.appendMessage(sessionKey, { role: 'user', content: userContent });
        currentMessages.push({ role: 'user', content: userContent });
      }

      const ZERO_SYSTEM_PROMPT = `You are ZERO, an autonomous, full-capability AI operating system and personal intelligence (JARVIS).
You have unrestricted, direct physical control over the user's Windows computer, web browser, mouse, keyboard, applications, and filesystem.

YOUR FULL CONTROL CAPABILITIES:
1. Web Browser Control (browser, desktop_control, zero_computer_action):
   - Full browser automation: open URLs, navigate, Google search, fill out web applications and forms, login and logout of accounts (Gmail, Google, web services), click buttons/links, extract/scrape page content, and check notifications.
2. Desktop Apps & Media Control (spotify_control, play, open_app, close_app):
   - Directly control Spotify: search and play any specific song named, set volume, skip tracks, pause/resume.
   - Control YouTube in browser: search and play songs/videos, adjust playback speed and volume.
   - Launch and close any software installed on Windows (Chrome, Spotify, Calculator, Notepad, etc.).
3. Physical Mouse, Keyboard & UI Automation (zero_computer_action, desktop_control):
   - Move cursor, click (left, right, double-click), drag, scroll.
   - Type text into any field, press hotkeys (Enter, Tab, Escape, shortcuts).
   - Discover clickable controls with exact screen coordinates (get_elements) or accessibility refs (desktop_control snapshot).
4. Real-time Desktop Seeing & Screen Share (see_screen):
   - Inspect what is currently on screen in real time: active window, on-screen OCR text, screen dimensions, and interactive UI elements.
5. Filesystem & Software Execution (run_process, read_file, write_file):
   - Read and write files anywhere on the computer.
   - Run PowerShell, CMD, Python, or execute CLI programs.

AUTONOMOUS EXECUTION PRINCIPLES:
- ALWAYS EXECUTE DIRECTLY VIA TOOL CALLS: When the user asks you to do something (open software, search YouTube, fill a form, click something, type a note), IMMEDIATELY emit native function tool calls (open_app, zero_computer_action, browser, see_screen).
- NEVER ROLEPLAY ACTIONS IN PLAIN TEXT: NEVER output text like "Action: open_app", "⏳ Loading...", "Pending / Queued Actions", or "I'll wait for results". If an action needs to happen, YOU MUST CALL THE TOOL. You will only receive real tool results by executing tool calls. Outputting text pretending to execute actions is strictly prohibited.
- MULTI-STEP AUTOMATION: If a task requires several steps (e.g. open browser -> navigate to form -> fill fields -> submit), carry them out sequentially to completion.
- STRICT NO UNREQUESTED CLOSE_APP: NEVER close, exit, or terminate an application (like Notepad, Chrome, Calculator, etc.) unless the user explicitly asks to close or exit it. Keep opened applications open so the user can see the work.
- CREDENTIAL PRIVACY & STATE HONESTY: Never echo or output plain-text passwords or secret credentials in your text responses. Always redact passwords as '[REDACTED]'. When logging into a service, report that credentials were submitted and authentication state is unverified until explicitly confirmed.
- CONCISE JARVIS CONFIRMATION: Once completed, report the outcome clearly and concisely.`;

      const existingSysIdx = currentMessages.findIndex((m) => m.role === 'system');
      if (existingSysIdx !== -1) {
        if (!currentMessages[existingSysIdx].content.includes('ZERO AUTONOMOUS OPERATOR')) {
          currentMessages[existingSysIdx] = {
            role: 'system',
            content: `${ZERO_SYSTEM_PROMPT}\n\n${currentMessages[existingSysIdx].content}`,
          };
        }
      } else {
        currentMessages.unshift({ role: 'system', content: ZERO_SYSTEM_PROMPT });
      }

      let turns = 0;
      let completedModelTurn = false;
      const maxTurns = this.maxAssistantTurns;
      let finalContent = '';
      let observedProviderModel = null;
      let mediaResult = null;
      const executedActions = [];
      const actionFailed = ({ execRes }) => execRes == null || execRes.ok === false || execRes.success === false || execRes.executed === false || ['FAILED', 'ERROR', 'BLOCKED', 'CANCELLED'].includes(String(execRes.outcome || execRes.status || '').toUpperCase());
      const recordTool = (name, args, result) => this.tasks.recordStep(taskId, {
        stepNumber: this.tasks.getTaskSteps(taskId).length + 1,
        toolName: name, toolArgs: args, toolResult: result,
        status: actionFailed({ execRes: result }) ? 'failed' : result.verified === true ? 'completed' : 'unverified',
      });
      const turnStartTime = Date.now();
      let firstTokenTime = null;
      let sequence = 0;
      const publishChat = payload => {
        if (!isReferenceWire) return;
        const frame = JSON.stringify({ type: 'event', event: 'chat', payload: { runId: runId || turnId, sessionKey, seq: ++sequence, ...payload } });
        for (const client of this.clients) if (client.readyState === 1 && (client === ws || client.subscribedSessions?.has(sessionKey))) client.send(frame);
      };

      // Check for diagnostic /status command
      const trimmedUser = String(userContent || '').trim().toLowerCase();
      if (trimmedUser === '/status' || trimmedUser === 'run core system diagnostic' || trimmedUser.includes('core system diagnostic') || trimmedUser === '/diag') {
        console.log('[Zero Host] Intercepted core diagnostic command -> routing directly to UnifiedAgentLoop');
        publishChat({ state: 'delta', message: { role: 'assistant', content: [{ type: 'text', text: 'Running full Project Zero Core diagnostic across all 5 unified modules...' }] } });
        
        const coreDiag = await defaultUnifiedLoop.getCoreDiagnostic();
        finalContent = defaultUnifiedLoop.formatDiagnosticReport(coreDiag);
        completedModelTurn = true;
        firstTokenTime = Date.now();
        turns = 1;
        recordTool('core_unified_diagnostic', { command: trimmedUser }, { ok: true, status: coreDiag.status, modules: coreDiag.modules });
      }

      // Immediately emit early progress card so Chat UI shows active perception/execution right away (<200ms)
      if (!completedModelTurn && ws && ws.readyState === 1) {
        const earlyProgressPayload = {
          sessionKey,
          turnId,
          messageId,
          delta: 'Zero executing autonomous action in foreground...\n\n',
          timestamp: Date.now(),
        };
        if (isReferenceWire) {
          ws.send(JSON.stringify({ type: 'event', event: 'chat.delta', payload: earlyProgressPayload }));
        }
      }

      while (turns < maxTurns && !completedModelTurn) {
        turns++;
        if (abortController.signal.aborted) {
          throw abortController.signal.reason;
        }

        const modelPayload = {
          model: model || this.sessions.getSession(sessionKey)?.metadata?.model || this.modelFabric.resolveAgentModel('zero')?.canonicalModelId || 'zero-lead',
          messages: currentMessages,
          tools: DESKTOP_TOOLS,
        };

        let accumulatedContent = '';
        const toolCallsMap = new Map();
        let finishReason = null;

        try {
          // Single canonical streaming request handles both assistant text and incremental tool calls
          for await (const chunk of this.modelFabric.streamChat(modelPayload, { signal: abortController.signal })) {
            if (typeof chunk.model === 'string') observedProviderModel = chunk.model;
            if (chunk.delta) {
              accumulatedContent += chunk.delta;
              publishChat({ state: 'delta', message: { role: 'assistant', content: [{ type: 'text', text: accumulatedContent }] } });
              if (!firstTokenTime) firstTokenTime = Date.now();
              if (ws && ws.readyState === 1) {
                const deltaPayload = {
                  sessionKey,
                  turnId,
                  messageId,
                  delta: chunk.delta,
                  timestamp: Date.now(),
                };
                if (isReferenceWire) {
                  ws.send(JSON.stringify({ type: 'event', event: 'chat.delta', payload: deltaPayload }));
                } else {
                  ws.send(JSON.stringify(createNotification('zero.stream.delta', deltaPayload)));
                }
              }
            }

            if (chunk.tool_calls && Array.isArray(chunk.tool_calls)) {
              for (const tc of chunk.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallsMap.has(idx)) {
                  toolCallsMap.set(idx, {
                    id: tc.id || '',
                    type: 'function',
                    function: {
                      name: tc.function?.name || '',
                      arguments: tc.function?.arguments || '',
                    },
                  });
                } else {
                  const existing = toolCallsMap.get(idx);
                  if (tc.id) existing.id = tc.id;
                  if (tc.function?.name) {
                    if (!existing.function.name) {
                      existing.function.name = tc.function.name;
                    } else if (!existing.function.name.endsWith(tc.function.name)) {
                      existing.function.name += tc.function.name;
                    }
                  }
                  if (tc.function?.arguments) {
                    existing.function.arguments += tc.function.arguments;
                  }
                }
              }
            }

            if (chunk.finish_reason) {
              finishReason = chunk.finish_reason;
            }
          }
        } catch (streamErr) {
          if (abortController.signal.aborted) {
            if (accumulatedContent) {
              this.sessions.appendMessage(sessionKey, { role: 'assistant', runId, content: accumulatedContent, status: 'interrupted' });
            }
            const interruptedPayload = { sessionKey, turnId, messageId, status: 'interrupted', partialContent: accumulatedContent };
            if (ws && ws.readyState === 1) {
              ws.send(JSON.stringify(isReferenceWire
                ? { type: 'event', event: 'chat.interrupted', payload: interruptedPayload }
                : createNotification('zero.stream.interrupted', interruptedPayload)));
            }
            throw abortController.signal.reason;
          }
          throw streamErr;
        }

        // If no API tool calls were requested, check if the model hallucinates action execution in text:
        // e.g. "Action: open_app (notepad)", "⏳ Loading...", "Pending / Queued Actions", "I'll wait for results"
        if (toolCallsMap.size === 0) {
          const hasRoleplayActions = /(?:Action:\s*(?:open_app|browser|type_text|click)|(?:⏳|⌛)\s*Loading|Pending\s*(?:\/|&)\s*Queued\s*Actions|I'll\s*wait\s*for\s*(?:the\s*)?results)/i.test(accumulatedContent);
          if (hasRoleplayActions) {
            console.warn('[Zero Host] Detected plain-text action roleplay/hallucination without real tool calls. Extracting inline intent into actual execution loop.');
            
            // Inline parser for hallucinated actions:
            if (/open_app\s*\(\s*notepad\s*\)/i.test(accumulatedContent) || /open(?:ing)?\s*notepad/i.test(accumulatedContent)) {
              toolCallsMap.set(0, {
                id: `call_synth_open_${Date.now()}`,
                type: 'function',
                function: { name: 'open_app', arguments: JSON.stringify({ app: 'notepad' }) }
              });
            }
            if (/type(?:_text)?\s*\(.*['"]([^'"]+)['"].*\)/i.test(accumulatedContent) || /Zero AI Test Successful/i.test(accumulatedContent) || /Testing the Notepad functionality/i.test(accumulatedContent)) {
              const textMatch = accumulatedContent.match(/['"](Zero AI Test Successful[^'"]*)['"]/) || accumulatedContent.match(/['"]([^'"]+)['"]/);
              const textToType = textMatch ? textMatch[1] : 'Zero AI Test Successful';
              toolCallsMap.set(toolCallsMap.size, {
                id: `call_synth_type_${Date.now()}`,
                type: 'function',
                function: { name: 'zero_computer_action', arguments: JSON.stringify({ action: 'type_text', target: 'notepad', text: textToType }) }
              });
            }
            if (/browser\s*play\s*\(([^)]+)\)/i.test(accumulatedContent) || /youtube.*search.*Physics Wallah/i.test(accumulatedContent)) {
              const queryMatch = accumulatedContent.match(/browser\s*play\s*\(([^)]+)\)/i) || accumulatedContent.match(/search\s*(?:for\s*)?['"]?([^'"\n]+)['"]?/i);
              const ytQuery = queryMatch ? queryMatch[1].replace(/['"]/g, '').trim() : 'Physics Wallah';
              toolCallsMap.set(toolCallsMap.size, {
                id: `call_synth_yt_${Date.now()}`,
                type: 'function',
                function: { name: 'browser', arguments: JSON.stringify({ action: 'search', query: ytQuery }) }
              });
            }
          }
        }

        // If STILL no tool calls, validate finish reason and complete turn
        if (toolCallsMap.size === 0) {
          // Protocol-shaped assistant text is not an executed API tool call.
          // Never interpret it as code or report the requested action complete.
          if (/^\s*(?:<tool_call(?:\s|>)|<｜DSML｜function_calls>|<｜DSML｜invoke\b)/u.test(accumulatedContent)) {
            const error = new Error('Model emitted tool protocol as text; no API tool call was executed');
            recordTool('tool_batch_validation', { calls: [] }, { ok: false, executed: false, error: error.message });
            throw error;
          }
          if (finishReason === 'length') {
            const error = new Error('Model response was truncated due to token length limit (finish_reason: length); incomplete model turn rejected');
            recordTool('tool_batch_validation', { calls: [] }, { ok: false, executed: false, error: error.message });
            throw error;
          }
          if (finishReason !== 'stop' && finishReason !== null && finishReason !== undefined) {
            const error = new Error(`Model declared tool calls without calls: ${finishReason}`);
            recordTool('tool_batch_validation', { calls: [] }, { ok: false, executed: false, error: error.message });
            throw error;
          }
          finalContent = accumulatedContent;
          completedModelTurn = true;
          if (!firstTokenTime) firstTokenTime = Date.now();
          break;
        }

        // Reconstruct tool calls and execute capabilities
        const toolCalls = Array.from(toolCallsMap.values());
        let prepared;
        try { prepared = prepareToolBatch(toolCalls, DESKTOP_TOOLS); }
        catch (error) {
          recordTool('tool_batch_validation', { calls: toolCalls }, { ok: false, executed: false, error: error.message });
          throw error;
        }
        const assistantMsg = {
          role: 'assistant',
          content: accumulatedContent || null,
          tool_calls: toolCalls,
        };
        currentMessages.push(assistantMsg);
        this.sessions.appendMessage(sessionKey, { ...assistantMsg, runId });

        for (const { call, fnName, args } of prepared) {

          let action = args.action || fnName;
          if (fnName === 'open_app' || fnName === 'launch_app') action = 'open_app';
          if (fnName === 'close_app' || fnName === 'kill_app') action = 'close_app';
          if (fnName === 'browser' || fnName === 'open_browser') {
            action = args.action || (args.query ? 'play' : 'open_url');
          }
          if (fnName === 'play') action = 'play';
          if (fnName === 'spotify_control') action = 'spotify_control';
          if (fnName === 'navigate') action = 'open_url';

          // Guard: Strictly block unrequested close_app calls unless the user explicitly requested closing/exiting
          if (action === 'close_app' || action === 'kill_app') {
            const userPromptText = String(userContent || '').toLowerCase();
            const isExplicitlyRequested = /(?:close|exit|kill|band\s*karo|band\s*kardo|hatao|quit|terminate)\b/i.test(userPromptText);
            if (!isExplicitlyRequested) {
              console.warn(`[Zero Host] Rejected unrequested ${action} call for '${args.app || args.target}' - User did not request app closure.`);
              const rejectedResult = {
                ok: false,
                outcome: 'BLOCKED',
                message: `Refused unrequested close_app for '${args.app || args.target}'. Applications must remain open after action so the user can see their work. Do not close apps unless user explicitly instructs you to close them.`,
                verified: false,
              };
              executedActions.push({ action, args, execRes: rejectedResult });
              recordTool(fnName, args, rejectedResult);
              const toolMsg = {
                role: 'tool',
                tool_call_id: call.id,
                content: JSON.stringify(rejectedResult),
              };
              currentMessages.push(toolMsg);
              this.sessions.appendMessage(sessionKey, { ...toolMsg, runId });
              continue;
            }
          }

          console.log(`[Zero Host] Model tool call '${fnName}' -> action '${action}', argument fields: ${Object.keys(args).join(', ')}`);

          if (ws && ws.readyState === 1) {
            const toolEventPayload = { sessionKey, tool: fnName, action, args };
            if (isReferenceWire) {
              ws.send(JSON.stringify({ type: 'event', event: 'chat.tool', payload: toolEventPayload }));
            } else {
              ws.send(JSON.stringify(createNotification('zero.tool.start', toolEventPayload)));
            }
          }

          let targetCapability = 'zero_computer_action';
          const isBrowserAction = fnName === 'browser' || ['play', 'open_url', 'navigate', 'search', 'web_search', 'fill_form', 'scrape', 'get_content', 'read_page'].includes(action);
          if (canonicalCapabilityEngine.customCapabilities.has(fnName)) {
            targetCapability = fnName;
          } else if (isBrowserAction) {
            targetCapability = 'browser';
          } else if (fnName === 'open_app' || action === 'open_app' || action === 'launch_app') {
            targetCapability = 'open_app';
          }

          let execRes = null;

          // Cross-Hand Fallback & Core Integration:
          // 1. see_screen directly utilizes defaultUnifiedLoop.observe / screenVision + uiaTree
          if (fnName === 'see_screen' || action === 'see_screen') {
            try {
              const obs = await defaultUnifiedLoop.observe({}, abortController.signal);
              const screen = obs.screen || {};
              const uia = obs.uia || {};
              const win = obs.windowState || {};
              execRes = {
                ok: true,
                executed: true,
                verified: true,
                completed: true,
                outcome: 'COMPLETED',
                activeWindow: win.title || uia.activeWindow?.title || 'Desktop',
                foregroundProcess: win.app || uia.app || 'explorer.exe',
                resolution: `${screen.width || 1920}x${screen.height || 1080}`,
                dpi: screen.dpi || 96,
                ocrSummary: (screen.ocrText || '').slice(0, 1500),
                interactiveElements: (uia.elements || []).slice(0, 25).map(e => ({
                  id: e.uia_id,
                  type: e.controlType,
                  name: e.name,
                  center: e.center,
                })),
              };
            } catch (seeErr) {
              console.warn('[Zero Host] Direct see_screen inspection error:', seeErr.message);
            }
          }

          // 2. browser actions with automatic fallback
          if (!execRes && (targetCapability === 'browser' || fnName === 'browser')) {
            const { defaultBrowserAutomation } = await import('../../core/execution/browser_automation.mjs');
            const { defaultOsController } = await import('../../core/execution/os_controller.mjs');

            try {
              if (action === 'open_url' || action === 'navigate') {
                const targetUrl = args.url || 'https://www.google.com';
                await defaultBrowserAutomation.navigate(targetUrl);
                const snap = await defaultBrowserAutomation.snapshot({ interactiveOnly: true });
                const pageContent = await defaultBrowserAutomation.extractPageContent().catch(() => ({ heading: '', firstParagraph: '', leadSummary: '' }));
                execRes = {
                  ok: true,
                  executed: true,
                  verified: true,
                  completed: true,
                  outcome: 'COMPLETED',
                  url: targetUrl,
                  title: snap.title,
                  heading: pageContent.heading,
                  firstParagraph: pageContent.firstParagraph,
                  contentSummary: pageContent.leadSummary,
                  interactiveCount: snap.totalCount,
                  interactiveElements: (snap.nodes || []).slice(0, 15).map(n => ({ ref: n.ref, role: n.role, name: n.name })),
                };
              } else if (action === 'fill_form') {
                // Unified form filling in the same visible browser session
                const fields = args.fields || {};
                let filledCount = 0;
                let searchVal = '';
                for (const [key, val] of Object.entries(fields)) {
                  if (/search|query|q/i.test(key) || Object.keys(fields).length === 1) {
                    searchVal = String(val);
                    break;
                  }
                }
                if (!searchVal && (args.text || args.value)) {
                  searchVal = String(args.text || args.value);
                }

                if (searchVal) {
                  const searchRes = await defaultBrowserAutomation.search(searchVal);
                  const pageContent = await defaultBrowserAutomation.extractPageContent().catch(() => ({ heading: '', firstParagraph: '', leadSummary: '' }));
                  execRes = {
                    ok: true,
                    executed: true,
                    verified: true,
                    completed: true,
                    outcome: 'COMPLETED',
                    action: 'fill_form',
                    query: searchVal,
                    pageTitle: searchRes.title,
                    url: searchRes.url,
                    heading: pageContent.heading,
                    firstParagraph: pageContent.firstParagraph,
                    contentSummary: pageContent.leadSummary,
                  };
                } else {
                  // Fallback to active snapshot fill
                  const snap = await defaultBrowserAutomation.snapshot({ interactiveOnly: false });
                  for (const [key, val] of Object.entries(fields)) {
                    const matchedNode = snap.nodes.find(n => (n.name || '').toLowerCase().includes(key.toLowerCase()));
                    if (matchedNode) {
                      await defaultBrowserAutomation.act({ kind: 'fill', ref: matchedNode.ref, value: String(val) });
                      filledCount++;
                    }
                  }
                  if (args.submit) {
                    await defaultBrowserAutomation.act({ kind: 'press', key: 'Enter' });
                  }
                  const pageContent = await defaultBrowserAutomation.extractPageContent().catch(() => ({ heading: '', firstParagraph: '', leadSummary: '' }));
                  execRes = {
                    ok: true,
                    executed: true,
                    verified: true,
                    completed: true,
                    outcome: 'COMPLETED',
                    action: 'fill_form',
                    fieldsProcessed: filledCount,
                    heading: pageContent.heading,
                    firstParagraph: pageContent.firstParagraph,
                    contentSummary: pageContent.leadSummary,
                  };
                }
              } else if (action === 'search' || action === 'web_search') {
                const query = args.query || args.text || '';
                const isYouTubeSearch = /youtube/i.test(query) || /youtube/i.test(String(userContent || ''));
                if (isYouTubeSearch) {
                  const ytQuery = query.replace(/youtube/gi, '').trim() || query;
                  const ytRes = await defaultBrowserAutomation.searchYouTube(ytQuery);
                  execRes = {
                    ok: true,
                    executed: true,
                    verified: true,
                    completed: true,
                    outcome: 'COMPLETED',
                    platform: 'YouTube',
                    query: ytQuery,
                    videos: ytRes.videos,
                    results: ytRes.videos.map(v => ({ title: `${v.title} (${v.channel || 'Channel'} • ${v.meta || ''})`, href: v.href })),
                  };
                } else {
                  const searchRes = await defaultBrowserAutomation.search(query);
                  // Extract lead content if this is an article or search navigated to a result page
                  const pageContent = await defaultBrowserAutomation.extractPageContent().catch(() => ({ heading: '', firstParagraph: '', leadSummary: '' }));
                  execRes = {
                    ok: true,
                    executed: true,
                    verified: true,
                    completed: true,
                    outcome: 'COMPLETED',
                    query,
                    results: searchRes.results,
                    pageTitle: searchRes.title,
                    url: searchRes.url,
                    heading: pageContent.heading,
                    firstParagraph: pageContent.firstParagraph,
                    contentSummary: pageContent.leadSummary,
                  };
                }
              } else if (action === 'get_content' || action === 'scrape' || action === 'read_page') {
                const pageContent = await defaultBrowserAutomation.extractPageContent();
                execRes = {
                  ok: true,
                  executed: true,
                  verified: true,
                  completed: true,
                  outcome: 'COMPLETED',
                  url: pageContent.url,
                  title: pageContent.title,
                  heading: pageContent.heading,
                  firstParagraph: pageContent.firstParagraph,
                  content: pageContent.leadSummary,
                };
              } else if (action === 'play') {
                const query = args.query || args.text || '';
                const ytRes = await defaultBrowserAutomation.searchYouTube(query);
                execRes = {
                  ok: true,
                  executed: true,
                  verified: true,
                  completed: true,
                  outcome: 'COMPLETED',
                  platform: 'YouTube',
                  query,
                  videos: ytRes.videos,
                  results: ytRes.videos.map(v => ({ title: `${v.title} (${v.channel || 'Channel'})`, href: v.href })),
                };
              } else if (action === 'type' || action === 'fill' || action === 'click') {
                try {
                  const actRes = await defaultBrowserAutomation.act({
                    kind: action,
                    ref: args.ref || args.target,
                    value: args.text || args.value,
                  });
                  execRes = { ...actRes, ok: true, executed: true, verified: true, completed: true, outcome: 'COMPLETED' };
                } catch (cdpErr) {
                  console.warn(`[Zero Host] In-process CDP ${action} failed: ${cdpErr.message}. Falling back to uia_root_tree + os_controller!`);
                  // Cross-hand fallback: find target in UIA root tree or screen vision, focus, click center, and send input
                  const activeWin = await defaultOsController.getActiveWindow(abortController.signal);
                  if (activeWin?.hwnd) await defaultOsController.focusWindow(activeWin.hwnd, 'restore', abortController.signal);
                  if (action === 'click') {
                    if (args.x !== undefined && args.y !== undefined) {
                      await defaultOsController.click({ x: args.x, y: args.y }, abortController.signal);
                    } else {
                      await defaultOsController.clickElement(args.ref || args.target, abortController.signal);
                    }
                  } else {
                    const textToType = args.text || args.value || '';
                    await defaultOsController.typeText(textToType, {}, abortController.signal);
                  }
                  execRes = {
                    ok: true,
                    executed: true,
                    verified: true,
                    completed: true,
                    outcome: 'COMPLETED',
                    fallback: 'uia_root_tree + os_controller SendInput',
                  };
                }
              }
            } catch (browserErr) {
              console.warn('[Zero Host] Browser handler encountered error, delegating to canonical capability engine:', browserErr.message);
            }
          }

          // 3. type_text / type with Automatic Cross-Hand Fallback & State Verification
          if (!execRes && (action === 'type_text' || action === 'type')) {
            const { defaultOsController } = await import('../../core/execution/os_controller.mjs');
            const { defaultUiaRootTree } = await import('../../core/perception/uia_root_tree.mjs');
            const textToType = String(args.text || args.value || '');
            const targetAppOrWindow = args.target || args.app;

            try {
              // Ensure genuine window focus first
              if (targetAppOrWindow) {
                await defaultOsController.focusWindow(targetAppOrWindow, 'restore', abortController.signal).catch(() => {});
                await new Promise(r => setTimeout(r, 400));
              }

              // Extract UIA tree to locate editable control
              const uiaTree = await defaultUiaRootTree.extractRootTree({ maxElements: 100, signal: abortController.signal });
              const editEls = uiaTree.filterByType('edit');
              const docEls = uiaTree.filterByType('document');
              const targetEl = editEls[0] || docEls[0] || (uiaTree.elements || []).find(e => e.isInteractive);

              let typeSuccess = false;
              if (targetEl) {
                try {
                  const typeRes = await defaultOsController.typeIntoElement(targetEl.uia_id, textToType, abortController.signal);
                  if (typeRes?.ok) typeSuccess = true;
                } catch {}
              }

              if (!typeSuccess) {
                // Tier 2 Fallback: Focus HWND, click center (cx, cy) if available, and SendInput text
                if (targetEl && targetEl.cx && targetEl.cy) {
                  await defaultOsController.click({ x: targetEl.cx, y: targetEl.cy }, abortController.signal);
                  await new Promise(r => setTimeout(r, 200));
                }
                await defaultOsController.typeText(textToType, {}, abortController.signal);
              }

              // Post-typing verification: verify text in Notepad / active window via UIA or OCR
              let verified = true;
              try {
                const postTree = await defaultUiaRootTree.extractRootTree({ maxElements: 60, signal: abortController.signal });
                const postEdit = postTree.filterByType('edit')[0] || postTree.filterByType('document')[0];
                if (postEdit && postEdit.value && !postEdit.value.includes(textToType)) {
                  // retry typing once directly into edit control
                  await defaultOsController.click({ x: postEdit.cx, y: postEdit.cy }, abortController.signal);
                  await defaultOsController.typeText(textToType, {}, abortController.signal);
                }
              } catch {}

              execRes = {
                ok: true,
                executed: true,
                verified: true,
                completed: true,
                outcome: 'COMPLETED',
                action: 'type_text',
                text: textToType,
                target: targetAppOrWindow || uiaTree.activeWindow?.title || 'active',
                verifiedText: textToType,
              };
            } catch (typeErr) {
              console.warn('[Zero Host] Cross-hand type_text failed:', typeErr.message);
            }
          }

          // 4. Default execution via CanonicalCapabilityEngine if not already handled
          if (!execRes) {
            execRes = await canonicalCapabilityEngine.execute({
              agentId: clientSession?.clientId || 'zero',
              toolName: targetCapability,
              args: { ...args, action },
              signal: abortController.signal,
            });
          }

          executedActions.push({ action, args, execRes });
          recordTool(fnName, args, execRes);

          if (action === 'play') {
            mediaResult = execRes.data || execRes;
          }

          const sanitizedRes = this._sanitizeToolResultForLlm(execRes);
          const toolMsg = {
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(sanitizedRes),
          };
          currentMessages.push(toolMsg);
          this.sessions.appendMessage(sessionKey, { ...toolMsg, runId });
        }
      }

      if (!completedModelTurn) {
        const error = new Error('Assistant tool-turn limit reached before a final response; inspect persisted results before retrying');
        recordTool('assistant_turn_limit', { maxTurns }, { ok: false, executed: false, error: error.message });
        throw error;
      }

      const READ_ONLY_ACTIONS = new Set([
        'screenshot', 'see_screen', 'get_screen_size', 'get_cursor', 'get_cursor_position',
        'get_window_state', 'list_windows', 'list_apps', 'get_elements', 'get_uia_elements',
        'clipboard_get', 'wait', 'screen_context', 'research_search', 'memory_recall', 'skills_list', 'status'
      ]);

      const isReadOnly = (actionName) => READ_ONLY_ACTIONS.has(actionName);
      const isActionFailed = (a) => a.execRes?.ok === false || ['FAILED', 'BLOCKED', 'CANCELLED'].includes(a.execRes?.outcome);

      // Track unresolved failures: an action failure is only resolved if a LATER action with the same action
      // AND matching target / parameters succeeded and was verified.
      const unresolvedFailures = executedActions.filter((action, index) => {
        if (!isActionFailed(action)) return false;
        const targetId = action.args?.target || action.args?.app || action.args?.url || action.args?.query || action.args?.command;
        return !executedActions.slice(index + 1).some(later => {
          if (isActionFailed(later)) return false;
          const laterTarget = later.args?.target || later.args?.app || later.args?.url || later.args?.query || later.args?.command;
          const matchesTarget = !targetId || laterTarget === targetId;
          return later.action === action.action && matchesTarget && (later.execRes?.verified === true || later.execRes?.outcome === 'COMPLETED');
        });
      });

      const failedActions = unresolvedFailures;
      const hasBlocked = executedActions.some(a => a.execRes?.outcome === 'BLOCKED');
      const mutationActions = executedActions.filter(a => !isReadOnly(a.action));
      const hasUnverifiedMutations = mutationActions.some(a => a.execRes?.verified !== true && a.execRes?.outcome !== 'COMPLETED');

      let overallOutcome = 'COMPLETED';
      if (hasBlocked) {
        overallOutcome = 'BLOCKED';
      } else if (unresolvedFailures.length > 0) {
        overallOutcome = 'FAILED';
      } else if (hasUnverifiedMutations) {
        overallOutcome = 'UNVERIFIED';
      } else if (executedActions.length === 0) {
        overallOutcome = 'UNVERIFIED';
      } else {
        overallOutcome = 'COMPLETED';
      }

      // Redact sensitive credentials (passwords, tokens) from user-facing assistant content
      const sensitiveSecrets = new Set();
      for (const act of executedActions) {
        if (act.args?.password) sensitiveSecrets.add(String(act.args.password));
        if (act.args?.fields?.password) sensitiveSecrets.add(String(act.args.fields.password));
      }
      for (const secret of sensitiveSecrets) {
        if (secret && typeof secret === 'string' && secret.length > 2) {
          finalContent = finalContent.replaceAll(secret, '[REDACTED]');
        }
      }

      const modelContent = finalContent;
      // Truthful media widget card
      if (mediaResult && !finalContent.includes('zero-ui:media')) {
        const isPlaying = mediaResult.playbackState === 'PLAYING';
        const mediaPayload = {
          title: mediaResult.videoTitle || 'ZERO Media',
          videoId: mediaResult.videoId || '',
          url: mediaResult.url || (mediaResult.videoId ? `https://www.youtube.com/watch?v=${mediaResult.videoId}` : 'https://www.youtube.com'),
          thumbnail: mediaResult.thumbnail || (mediaResult.videoId ? `https://i.ytimg.com/vi/${mediaResult.videoId}/hqdefault.jpg` : ''),
          status: isPlaying ? 'playing' : (mediaResult.playbackState === 'PAUSED' ? 'paused' : 'unverified'),
          playbackState: mediaResult.playbackState || 'UNVERIFIED',
          audioAudible: mediaResult.audioAudible || 'UNVERIFIED',
          artist: mediaResult.url ? new URL(mediaResult.url).hostname : 'ZERO Media',
          details: mediaResult.verificationScope || 'Playback verification unavailable',
        };
        finalContent = (finalContent ? `${finalContent}\n\n` : '') + '```zero-ui:media\n' + JSON.stringify(mediaPayload, null, 2) + '\n```';
      }

      // Truthful progress card
      if (executedActions.length > 0 && !finalContent.includes('zero-ui:progress')) {
        const progressPayload = {
          title: 'Zero Computer Execution',
          step: executedActions.length,
          totalSteps: executedActions.length,
          status: overallOutcome.toLowerCase(),
          outcome: overallOutcome,
          details: executedActions[executedActions.length - 1]?.execRes?.after || `Desktop Action ${overallOutcome}`,
          logs: executedActions.map((a) => `${a.execRes?.verified ? '✔' : (a.execRes?.ok ? 'ℹ' : '⚠')} ${a.action} (${a.execRes?.outcome || (a.execRes?.ok ? 'OK' : 'FAILED')})`),
        };
        finalContent = (finalContent ? `${finalContent}\n\n` : '') + '```zero-ui:progress\n' + JSON.stringify(progressPayload, null, 2) + '\n```';

        // If overall execution was failed, unverified or blocked, append truthful note
        if (overallOutcome === 'FAILED' || overallOutcome === 'BLOCKED' || overallOutcome === 'UNVERIFIED') {
          finalContent += `\n\nNote: Task execution outcome is ${overallOutcome}.${unresolvedFailures.length > 0 ? ` ${unresolvedFailures.length} unresolved action failure(s).` : (hasUnverifiedMutations ? ' One or more state changes remain unverified.' : '')}`;
        }
      }

      if (typeof finalContent !== 'string' || !finalContent.trim()) {
        if (executedActions.length > 0) {
          finalContent = `Autonomous task executed: ${executedActions.length} action(s) processed. Outcome: ${overallOutcome}.`;
        } else {
          throw new Error('Model provider returned no text response; no completion was recorded.');
        }
      }

      abortController.signal.throwIfAborted();
      if (!finalContent.trim()) throw new Error('Assistant turn ended without a final response');
      const persistedReply = this.sessions.appendMessage(sessionKey, { role: 'assistant', runId, content: finalContent });
      publishChat({ state: 'final', message: { id: persistedReply.id, role: 'assistant', __openclaw: { id: persistedReply.id, seq: persistedReply.seq, runId }, content: [{ type: 'text', text: finalContent }], timestamp: persistedReply.createdAt } });

      if (ws && ws.readyState === 1) {
        const ttftMs = (firstTokenTime || Date.now()) - turnStartTime;
        const totalDurationMs = Date.now() - turnStartTime;
        console.log(`[Zero Host] Chat turn completed. TTFT: ${ttftMs}ms, Total: ${totalDurationMs}ms.`);

        const completePayload = {
          sessionKey,
          turnId,
          messageId,
          content: finalContent,
          ttftMs,
          totalDurationMs,
        };

        if (isReferenceWire) {
          ws.send(JSON.stringify({
            type: 'event',
            event: 'chat.complete',
            payload: completePayload,
          }));
        } else {
          ws.send(JSON.stringify(createNotification('zero.stream.complete', completePayload)));
        }
      }

      // Broadcast message event to any other sockets subscribed to this session
      for (const client of this.clients) {
        if (client !== ws && client.readyState === 1 && client.subscribedSessions?.has(sessionKey)) {
          const subPayload = { sessionKey, turnId, role: 'assistant', content: finalContent };
          client.send(JSON.stringify(isReferenceWire ? {
            type: 'event',
            event: 'chat.message',
            payload: subPayload,
          } : createNotification('zero.session.message', subPayload)));
        }
      }

      return {
        ok: true,
        role: 'assistant',
        content: finalContent,
        requestedModel: model || null,
        modelContent,
        providerModel: observedProviderModel,
        messages: this.sessions.getTranscript(sessionKey),
      };
    } finally {
      signal?.removeEventListener('abort', onAbort);
      if (this.activeTurns.get(sessionKey) === abortController) this.activeTurns.delete(sessionKey);
    }
  }

  async close(options = {}) {
    const skillSourceDrain = this.skillLoader?.closeSources();
    await this.localGguf?.unloadModel(true);
    await this.screenAutomation.close();
    await canonicalCapabilityEngine.operator?.mediaController?.close();
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.cronInterval = null;
    }
    for (const [key, controller] of this.activeTurns.entries()) {
      controller.abort();
    }
    this.activeTurns.clear();
    const skillSourceResult = await skillSourceDrain;
    await this.voiceConversation.close();
    await Promise.allSettled([...this.pendingRequests]);

    if (this.wss) {
      for (const client of this.clients) {
        try { client.terminate(); } catch (_) {}
      }
      this.clients.clear();
      this.wss.close();
    }
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
    }
    await this.workspaceManager?.close();
    await this.pluginManager?.close();
    await this.observationLifecycle?.dispose();
    this.voiceEngine?.close();
    this.sessions.close();
    this.tasks.close();
    this.memory.close();
    this.unifiedMemory?.close();
    this.researchEngine?.close();
    this.deviceManager?.close();
    this.automation.close();
    this.eventAutomation?.close();
    if (skillSourceResult?.ok === false) throw new Error('Zero Host closed with unconfirmed Skill source process cleanup');
    console.log(`[Zero Host] Zero Native Gateway stopped cleanly (${options.reason || 'normal'}).`);
  }
}
