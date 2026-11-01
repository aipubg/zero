/**
 * @fileoverview Zero Native Gateway & WebSocket Server
 * 
 * Provides an independent, first-party Zero Host runtime owning:
 * - Single port (18789) HTTP and WebSocket control plane
 * - JSON-RPC 2.0 protocol dispatch and Protocol 4 handshake validation
 * - Dynamic agent turn execution and autonomous tool orchestration
 * - Session history and transcript persistence via SQLite
 * - Human safety takeover arbitration (zero-policy.computer-hold)
 * - Durable cron automations and semantic persistent memory store
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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
import { TaskStateMachine } from '../../packages/agent-runtime/index.mjs';
import { AutomationScheduler } from '../../packages/automation/index.mjs';
import { PersistentMemoryStore } from '../../packages/memory/index.mjs';
import { canonicalCapabilityEngine } from '../../packages/capability-engine/index.mjs';
import { ModelFabric } from '../../packages/model-fabric/index.mjs';
import { handleZeroGatewayRequest } from '../../backend/gateway/server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = process.env.ZERO_ROOT || path.resolve(__dirname, '..', '..');

// Dynamically load ws from available installed location
async function loadWs() {
  const candidates = [
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
    this.port = options.port || Number(process.env.ZERO_PORT || process.env.PORT || 18789);
    this.host = options.host || '127.0.0.1';
    this.bootId = `zero_boot_${Date.now()}`;
    this.bootedAt = Date.now();
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
    this.expectedToken = resolvedToken;

    // Initialize persistence & state engines
    const dataDir = path.join(REPO_ROOT, '.zero-data');
    if (!fs.existsSync(dataDir)) {
      try { fs.mkdirSync(dataDir, { recursive: true }); } catch (_) {}
    }

    const sessionDb = path.join(dataDir, 'zero-sessions.sqlite');
    this.modelFabric = new ModelFabric({
      configPath: path.join(REPO_ROOT, 'models', 'gateway-providers.json'),
      aliases: { 'zero-lead': 'nvidia/nemotron-3.5-super-vl-120b-a12b' },
    });
    this.sessions = new SessionManager({ dbPath: sessionDb });
    this.tasks = new TaskStateMachine({ dbPath: path.join(dataDir, 'zero-tasks.sqlite') });
    this.memory = new PersistentMemoryStore({ dbPath: path.join(dataDir, 'zero-memory.sqlite') });
    this.automation = new AutomationScheduler({
      dbPath: path.join(dataDir, 'zero-automation.sqlite'),
      executor: async (action, params) => canonicalCapabilityEngine.execute(action, params),
    });

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

  async start() {
    const wsModule = await loadWs();
    const WebSocketServer = wsModule.WebSocketServer;

    this.server = http.createServer(async (req, res) => {
      // 1. Dispatch Zero Gateway API routes
      const handled = await handleZeroGatewayRequest(req, res);
      if (handled) return;

      const url = req.url || '/';
      const pathname = url.split('?')[0];

      // 2. Control UI Static Routes
      if (pathname === '/' || pathname === '/index.html' || pathname.startsWith('/chat')) {
        const uiCandidates = [
          path.join(REPO_ROOT, 'app', 'zero-control-ui', 'dist', 'index.html'),
          path.join(REPO_ROOT, 'backend', 'gateway', 'dist', 'index.html'),
        ];
        for (const c of uiCandidates) {
          if (fs.existsSync(c)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            fs.createReadStream(c).pipe(res);
            return;
          }
        }
      }

      // 3. Fallback
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Not Found: ${pathname}` }));
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
        console.log(`[Zero Host] Zero Native Gateway listening on http://${this.host}:${this.port}`);
        resolve(this);
      });
    });
  }

  _handleWebSocketConnection(ws, req) {
    let clientSession = null;

    ws.on('message', async (raw) => {
      const parsed = parseFrame(raw);
      if (parsed.type === 'invalid') {
        ws.send(JSON.stringify(parsed.error));
        return;
      }

      const { id, method, params } = parsed;

      // Protocol 4 Handshake & Connect negotiation
      if (method === 'handshake' || method === 'gateway.handshake' || method === 'hello' || method === 'connect') {
        const result = validateHandshake(params, this.expectedToken);
        if (!result.ok) {
          if (parsed.isReferenceWire) {
            ws.send(JSON.stringify({ type: 'res', id, ok: false, error: result.message }));
          } else {
            ws.send(JSON.stringify(createError(id, result.code, result.message)));
          }
          return;
        }
        clientSession = result.session || { clientId: 'operator', authenticated: true, role: 'operator' };
        if (parsed.isReferenceWire) {
          ws.send(JSON.stringify({
            type: 'res',
            id,
            ok: true,
            payload: {
              type: 'hello',
              protocol: 4,
              server: { version: '1.0.0', commit: 'zero-native', bootId: this.bootId },
              features: {
                methods: [
                  'health', 'gateway.health',
                  'agents.list', 'gateway.agents.list',
                  'chat.history', 'gateway.chat.history',
                  'agent', 'gateway.agent', 'chat.send',
                  'zero-policy.computer-hold.status',
                  'zero-policy.computer-hold.take',
                  'zero-policy.computer-hold.release',
                  'memory.remember', 'memory.recall', 'memory.forget', 'memory.list',
                  'automation.listJobs', 'automation.registerJob', 'automation.toggleJob', 'automation.deleteJob', 'automation.triggerDue', 'automation.listRuns',
                  'tasks.list', 'tasks.get', 'tasks.create', 'tasks.cancel', 'tasks.resume',
                ],
              },
              snapshot: {
                presence: [{ clientId: clientSession.clientId, role: clientSession.role, connectedAt: Date.now() }],
                sessionDefaults: { defaultAgentId: 'zero' },
              },
              auth: {
                role: clientSession.role || 'operator',
                scopes: clientSession.scopes || ['operator.read', 'operator.write', 'operator.approvals'],
              },
              policy: {
                tickIntervalMs: 30000,
              },
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
          })));
        }
        return;
      }

      // Reject RPC traffic until handshake has established a client session.
      if (!clientSession?.authenticated) {
        const errorMessage = 'Authenticated handshake required before RPC dispatch';
        ws.send(JSON.stringify(parsed.isReferenceWire
          ? { type: 'res', id, ok: false, error: errorMessage }
          : createError(id, RPC_ERROR_CODES.UNAUTHORIZED, errorMessage)));
        return;
      }

      // RPC Methods dispatch
      try {
        const responseResult = await this._dispatchRpc(method, params, clientSession, ws, parsed.isReferenceWire);
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
            error: err.message,
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
    switch (method) {
      case 'health':
      case 'gateway.health':
        return {
          ok: true,
          status: 'ok',
          bootId: this.bootId,
          version: '1.0.0',
          plugins: {
            loaded: ['zero-policy', 'zero-system', 'browser', 'computer'],
            errors: [],
          },
        };

      case 'agents.list':
      case 'gateway.agents.list':
        return {
          defaultId: 'zero',
          agents: [
            {
              id: 'zero',
              name: 'Zero',
              identity: 'personal-commander',
              description: 'Zero Autonomous Personal AI Commander',
              model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
            },
          ],
        };

      case 'chat.history':
      case 'gateway.chat.history': {
        const sessionKey = params.sessionKey || params.sessionId || 'default';
        const messages = this.sessions.getTranscript(sessionKey);
        return { ok: true, sessionKey, messages };
      }

      case 'agent':
      case 'gateway.agent':
      case 'chat.send': {
        const sessionKey = params.sessionKey || params.sessionId || `session_${Date.now()}`;
        const message = params.message || '';
        const userContent = typeof message === 'string' ? message : message.content || '';

        // Record user message
        this.sessions.appendMessage(sessionKey, { role: 'user', content: userContent });

        // Check human hold status
        if (this.computerHold.held) {
          return {
            ok: false,
            error: 'Action refused: Human takeover hold is currently active.',
            status: 'held',
          };
        }

        // Execute model turn via Model Fabric
        const transcript = this.sessions.getTranscript(sessionKey);
        const modelPayload = {
          model: 'zero-lead',
          messages: transcript.map((m) => ({ role: m.role, content: m.content })),
        };

        // Real provider output only: never fabricate a successful chat turn.
        const execOutcome = await this.modelFabric.executeChat(modelPayload);
        const replyContent = execOutcome.data?.choices?.[0]?.message?.content;
        if (typeof replyContent !== 'string' || !replyContent.trim()) {
          throw new Error('Model provider returned no text response; no completion was recorded.');
        }
        this.sessions.appendMessage(sessionKey, { role: 'assistant', content: replyContent });

        // Emit streaming delta if ws is active
        if (ws && ws.readyState === 1) {
          if (isReferenceWire) {
            ws.send(JSON.stringify({
              type: 'event',
              event: 'chat.delta',
              payload: { sessionKey, delta: replyContent },
            }));
          } else {
            ws.send(JSON.stringify(createNotification('zero.stream.delta', { sessionKey, delta: replyContent })));
          }
        }

        return {
          ok: true,
          role: 'assistant',
          content: replyContent,
          messages: this.sessions.getTranscript(sessionKey),
        };
      }

      // Computer Hold Takeover Arbitration
      case 'zero-policy.computer-hold.status':
        return {
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
      case 'memory.remember':
        return this.memory.remember(params);

      case 'memory.recall':
        return this.memory.recall(params.query || '', params.options || {});

      case 'memory.forget':
        return { ok: this.memory.forget(params.id), id: params.id };

      case 'memory.list':
        return this.memory.listMemories(params);

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
        return this.tasks.resumeTask(params.id);

      default:
        throw new Error(`Method '${method}' not found on Zero Native Gateway`);
    }
  }

  async close(options = {}) {
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.cronInterval = null;
    }
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
    }
    this.sessions.close();
    this.tasks.close();
    this.memory.close();
    this.automation.close();
    console.log(`[Zero Host] Zero Native Gateway stopped cleanly (${options.reason || 'normal'}).`);
  }
}
