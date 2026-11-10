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
    if (options.token !== undefined) {
      resolvedToken = String(options.token).trim();
    } else {
      const configPaths = [
        process.env.OPENCLAW_CONFIG_PATH,
        path.join(REPO_ROOT, 'backend', 'config', 'zero.json'),
        path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json'),
      ].filter(Boolean);
      let authMode = 'none';
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
    this.expectedToken = resolvedToken || this.loopbackUiToken;

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
    tool('desktop_control', 'PRIMARY desktop control backend: agent-desktop native accessibility. Start with status, then snapshot/find for the exact app/window; use returned qualified refs for click/set-value/get. Read a fresh snapshot after actions. Prefer semantic set-value with input text over physical typing. Old coordinate tools are compatibility fallbacks. Never retry an uncertain delivery; inspect live state. Read skills get desktop and skills get platform for supported commands.', { type: 'object', properties: { command: { type: 'string', enum: DESKTOP_COMMANDS }, args: { type: 'array', description: 'CLI tokens, NOT a shell string. snapshot example: ["--window-id","w-123"]. get example: ["@snapshot:e1","--property","value"]. click/set-value: ["@snapshot:e1"]. skills guide: ["get","desktop"]. Reuse refs only from returned snapshots.', items: { type: 'string' } }, input: { type: 'string', description: 'Text to insert for set-value/type/clipboard-set ONLY. Never put refs, flags or read instructions here. Omit for snapshot/get/click.' }, headed: { type: 'boolean', description: 'Permit physical keyboard/cursor input when explicitly needed; semantic actions default false.' } }, required: ['command'], additionalProperties: false }, (args, signal, context) => canonicalCapabilityEngine.execute({ agentId: context?.agentId || 'zero', toolName: 'zero_computer_action', args: { ...args, action: 'desktop' }, signal }));
    tool('research_search', 'Retrieve real search results and provenance. Retrieved sources are not independently verified.', { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, args => this.researchEngine.searchEngine.search(args.query, args));
    tool('memory_recall', 'Retrieve previously stored context from Zero memory.', { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, args => ({ memories: this.unifiedMemory.recall(args.query, args) }));
    tool('memory_remember', 'Persist a fact with provenance for later retrieval. Use semantic for durable facts and preferences.', { type: 'object', properties: { content: { type: 'string' }, layer: { type: 'string', enum: Object.values(MEMORY_LAYERS), default: 'semantic' } }, required: ['content'] }, args => ({ memory: this.unifiedMemory.remember({ layer: 'semantic', ...args }) }));
    tool('screen_context', 'Retrieve real local screen observations; may be empty when observation is stopped.', { type: 'object', properties: { query: { type: 'string' } } }, args => this.screenObserver.queryContext(args.query));
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
          'sessions.create', 'sessions.get', 'sessions.describe', 'sessions.patch', 'sessions.delete',
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
          'tools.effective',
          'zero-policy.computer-hold.status',
          'zero-policy.computer-hold.take',
          'zero-policy.computer-hold.release',
          'memory.remember', 'memory.recall', 'memory.forget', 'memory.list', 'memory.layers', 'memory.update', 'memory.consolidate',
          'automation.listJobs', 'automation.registerJob', 'automation.toggleJob', 'automation.deleteJob', 'automation.triggerDue', 'automation.listRuns',
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
          'devices.pair.generateCode', 'devices.pair.claim', 'devices.list', 'devices.get', 'devices.unpair',
          'devices.notify', 'devices.notifications.list', 'devices.notifications.markRead',
          'voice.session.start', 'voice.session.stop', 'voice.chunk', 'voice.synthesize', 'voice.transcribe', 'voice.status',
          'voice.microphone.start', 'voice.microphone.stop',
          'voice.turn', 'voice.conversation.status',
          'sessions.messages.subscribe', 'sessions.messages.unsubscribe', 'sessions.observer.visibility',
          'sessions.subscribe', 'config.get', 'config.patch', 'config.schema', 'config.schema.lookup',
          'users.self', 'users.prefs.get', 'users.prefs.set', 'models.authStatus',
          'memory.search', 'agents.workspace.get', 'doctor.memory.status', 'webSearch.status', 'webSearch.test',
          'zero.observation.query', 'zero.observation.control', 'zero.observation.recent',
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
      'sessions.delete': ['operator.write', 'operator.admin'],
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
        const sessions = this.sessions.listSessions(limit, offset);
        const defaultModel = this.modelFabric.resolveAgentModel('zero');
        return {
          ts: Date.now(),
          defaults: { model: defaultModel?.canonicalModelId || null, modelProvider: defaultModel?.provider?.id || null },
          sessions,
          total: sessions.length,
        };
      }

      case 'sessions.create': {
        const session = this.sessions.createSession(params.id || params.key, params.title || 'New Session', params.metadata || {});
        return {
          ok: true,
          session: {
            key: session.id,
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            metadata: session.metadata,
          },
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
        return {
          ok: true,
          session: {
            key: session.id,
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            metadata: session.metadata,
          },
          transcript,
        };
      }

      case 'sessions.patch': {
        const key = params.key || params.id || params.sessionKey;
        if (!key) throw new Error('Session key is required');
        const patched = this.sessions.patchSession(key, { ...params, metadata: { ...params.metadata, ...(params.model ? { model: params.model } : {}) } });
        if (!patched) throw new Error(`Session '${key}' not found`);
        return {
          ok: true,
          session: {
            key: patched.id,
            id: patched.id,
            title: patched.title,
            createdAt: patched.createdAt,
            updatedAt: patched.updatedAt,
            metadata: patched.metadata,
          },
        };
      }

      case 'sessions.delete': {
        const key = params.key || params.id || params.sessionKey;
        if (!key) throw new Error('Session key is required');
        const deleted = this.sessions.deleteSession(key);
        return { ok: true, deleted: true, key };
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
        const message = params.message || '';
        const userContent = typeof message === 'string' ? message : message.content || '';

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
          tools: [
            { name: 'zero_computer_action', description: 'Directly execute Windows OS computer actions: open_app, type_text, press_key, mouse_move, left_click, list_windows, list_apps, get_window_state, get_screen_size, play, browser.' },
            { name: 'browser', description: 'Control web browser on Windows: open URLs, search and play songs/videos on YouTube.' },
            { name: 'open_app', description: 'Launch an application on Windows desktop (e.g. notepad, calc, chrome).' },
            { name: 'play', description: 'Search and play audio/video on YouTube' },
            { name: 'type_text', description: 'Type text into the focused window with verification' },
          ],
        };

      // Computer Hold Takeover Arbitration
      case 'zero-policy.computer-hold.status':
        return {
          ok: true,
          held: this.computerHold.held,
          controlLeaseId: this.computerHold.leaseId,
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

      case 'workers.register':
        return { ok: true, worker: this.workspaceManager.registerWorker(params) };

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

      default: {
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

    const DESKTOP_TOOLS = [
      {
        type: 'function',
        function: {
          name: 'zero_computer_action',
          description: 'Compatibility Windows actions. Prefer desktop_control for primary accessibility snapshots and qualified-ref interaction. Use these legacy actions for explicitly needed coordinate or existing browser workflows.',
          parameters: {
            type: 'object',
            required: ['action'],
            properties: {
              action: {
                type: 'string',
                enum: ['open_app', 'launch_app', 'type_text', 'play', 'media_control', 'browser', 'open_url', 'press_key', 'mouse_move', 'left_click', 'list_windows', 'list_apps', 'get_window_state', 'get_screen_size'],
              },
              app: { type: 'string', description: 'Application name or path to open (e.g. "notepad")' },
              text: { type: 'string', description: 'Text to type into the focused window' },
              query: { type: 'string', description: 'Search term or song name to play on YouTube' },
              command: { type: 'string', enum: ['play', 'pause', 'play_pause', 'volume_up', 'volume_down', 'mute', 'unmute', 'next', 'previous', 'fullscreen', 'focus'], description: 'For media_control: affects only the visible player opened by ZERO. Play/pause and mute/unmute are explicit states; audio audibility is not measured.' },
              url: { type: 'string', description: 'URL to open in the browser' },
              key: { type: 'string', description: 'Key or shortcut to press' },
              x: { type: 'number', description: 'X screen coordinate' },
              y: { type: 'number', description: 'Y screen coordinate' },
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
              app: { type: 'string', description: 'Application name or path to open (e.g. "notepad")' },
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
            properties: {
              action: { type: 'string', enum: ['play', 'open_url', 'navigate', 'search'] },
              query: { type: 'string', description: 'Search query or song name to play on YouTube' },
              url: { type: 'string', description: 'Web page URL' },
            },
          },
        },
      },
    ];

    for (const definition of canonicalCapabilityEngine.customCapabilities.values()) {
      if (!definition.disabled) DESKTOP_TOOLS.push({ type: 'function', function: { name: definition.name, description: definition.description, parameters: definition.parameters || { type: 'object' } } });
    }
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

      while (turns < maxTurns) {
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

        if (!['stop', 'tool_calls', 'function_call'].includes(finishReason)) {
          throw new Error(`Model response did not complete: ${finishReason || 'missing terminal finish reason'}`);
        }
        // If no tool calls were requested, complete with the accumulated content from this single request
        if (toolCallsMap.size === 0) {
          // Protocol-shaped assistant text is not an executed API tool call.
          // Never interpret it as code or report the requested action complete.
          if (/^\s*(?:<tool_call(?:\s|>)|<｜DSML｜function_calls>|<｜DSML｜invoke\b)/u.test(accumulatedContent)) {
            const error = new Error('Model emitted tool protocol as text; no API tool call was executed');
            recordTool('tool_batch_validation', { calls: [] }, { ok: false, executed: false, error: error.message });
            throw error;
          }
          if (finishReason !== 'stop') {
            const error = new Error('Model declared tool calls without calls');
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
        try { prepared = prepareToolBatch(toolCalls, new Set(DESKTOP_TOOLS.map(tool => tool.function.name))); }
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
          if (fnName === 'browser' || fnName === 'open_browser') {
            action = args.action || (args.query ? 'play' : 'open_url');
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

          const execRes = await canonicalCapabilityEngine.execute({
            agentId: clientSession?.clientId || 'zero',
            toolName: canonicalCapabilityEngine.customCapabilities.has(fnName) ? fnName : fnName === 'browser' ? 'browser' : (fnName === 'open_app' ? 'open_app' : 'zero_computer_action'),
            args: { action, ...args },
            signal: abortController.signal,
          });

          executedActions.push({ action, args, execRes });
          recordTool(fnName, args, execRes);

          if (action === 'play') {
            mediaResult = execRes.data || execRes;
          }

          const toolMsg = {
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(execRes),
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
      const failedActions = executedActions.filter((action, index) => actionFailed(action) && !executedActions.slice(index + 1).some(later =>
        !actionFailed(later) && later.execRes?.verified === true && later.action === action.action && isDeepStrictEqual(later.args, action.args)));
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
        let overallOutcome = 'COMPLETED';
        if (failedActions.length) {
          overallOutcome = 'FAILED';
        } else if (executedActions.some((a) => a.execRes?.outcome === 'BLOCKED')) {
          overallOutcome = 'BLOCKED';
        } else if (executedActions.some((a) => a.execRes?.outcome === 'UNVERIFIED' || a.execRes?.verified === false)) {
          overallOutcome = 'UNVERIFIED';
        }

        const progressPayload = {
          title: 'Zero Computer Execution',
          step: executedActions.length,
          totalSteps: executedActions.length,
          status: overallOutcome.toLowerCase(),
          outcome: overallOutcome,
          details: executedActions[executedActions.length - 1]?.execRes?.after || `Desktop Action ${overallOutcome}`,
          logs: executedActions.map((a) => `${a.execRes?.verified ? '✔' : '⚠'} ${a.action} (${a.execRes?.outcome || (a.execRes?.ok ? 'OK' : 'FAILED')})`),
        };
        finalContent = (finalContent ? `${finalContent}\n\n` : '') + '```zero-ui:progress\n' + JSON.stringify(progressPayload, null, 2) + '\n```';

        // If any action failed or was unverified, append truth in assistant text
        if (overallOutcome !== 'COMPLETED') {
          finalContent += `\n\nNote: One or more requested actions returned status ${overallOutcome}.`;
        }
      }

    if (typeof finalContent !== 'string' || !finalContent.trim()) {
        throw new Error('Model provider returned no text response; no completion was recorded.');
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
        ok: failedActions.length === 0,
        ...(failedActions.length ? { error: `${failedActions.length} tool action(s) failed or were blocked; inspect the persisted tool results before retrying` } : {}),
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
