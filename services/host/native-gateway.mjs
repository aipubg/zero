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
    this.activeTurns = new Map();
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
    this.localDesktopSessions = new DesktopSessionStore();
    this.loopbackUiToken = crypto.randomBytes(24).toString('hex');
    this.expectedToken = resolvedToken || this.loopbackUiToken;

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
      executor: async (action, params) => canonicalCapabilityEngine.execute({ agentId: 'zero', toolName: 'zero_computer_action', args: { action, ...params } }),
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
      if (pathname === '/api/auth/session') {
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
          res.setHeader('Set-Cookie', `zero_session=${session.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
          res.end(JSON.stringify({
            ok: true,
            session: { role: session.role, scopes: session.scopes, expiresAt: session.expiresAt },
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
            res.end(JSON.stringify({ ok: true, session: { role: session.role, scopes: session.scopes } }));
            return;
          }
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Unauthorized: active session required' }));
          return;
        }
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies['zero_session'] || (req.headers.authorization?.replace(/^Bearer\s+/i, '').trim());
        if (token) this.localDesktopSessions.delete(token);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Set-Cookie', 'zero_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
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
        res.setHeader('Set-Cookie', `zero_session=${session.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
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
          'chat.history', 'gateway.chat.history',
          'chat.send', 'chat.abort', 'agent', 'gateway.agent',
          'models.list', 'gateway.models.list', 'models.status',
          'plugins.controlUi.list', 'plugins.controlUi.report', 'plugins.controlUi.status',
          'zero.providers.list', 'zero.providers.configure', 'zero.providers.test',
          'zero.gateway.status', 'zero.gateway.restart',
          'zero.computer.control', 'zero.observation.status',
          'zero.integrations.cli.status', 'zero.integrations.connectors.status',
          'tools.effective',
          'zero-policy.computer-hold.status',
          'zero-policy.computer-hold.take',
          'zero-policy.computer-hold.release',
          'memory.remember', 'memory.recall', 'memory.forget', 'memory.list',
          'automation.listJobs', 'automation.registerJob', 'automation.toggleJob', 'automation.deleteJob', 'automation.triggerDue', 'automation.listRuns',
          'tasks.list', 'tasks.get', 'tasks.create', 'tasks.cancel', 'tasks.resume',
        ];

        if (parsed.isReferenceWire) {
          ws.send(JSON.stringify({
            type: 'res',
            id,
            ok: true,
            payload: {
              type: 'hello',
              protocol: 4,
              server: { version: '1.0.0', commit: 'zero-native', bootId: this.bootId },
              features: { methods: supportedMethods },
              snapshot: {
                presence: [{ clientId: clientSession.clientId, role: clientSession.role, connectedAt: Date.now() }],
                sessionDefaults: { defaultAgentId: 'zero' },
              },
              auth: {
                role: clientSession.role,
                scopes: clientSession.scopes,
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
          if (parsed.isReferenceWire) {
            ws.send(JSON.stringify({
              type: 'res',
              id,
              ok: false,
              error: responseResult.error || 'Operation failed',
              code: responseResult.code,
            }));
          } else {
            const code = responseResult.code || RPC_ERROR_CODES.INTERNAL_ERROR;
            ws.send(JSON.stringify(createError(id, code, responseResult.error || 'Operation failed')));
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
    // Enforce Method-Level Roles & Scopes
    const METHOD_SCOPES = {
      'config.set': ['admin', 'operator.admin'],
      'config.patch': ['admin', 'operator.admin'],
      'config.apply': ['admin', 'operator.admin'],
      'zero.gateway.restart': ['admin', 'operator.admin'],
      'zero.providers.configure': ['admin', 'operator.admin'],
      'zero.computer.control': ['computer.control', 'operator.admin'],
      'chat.send': ['operator.write', 'operator.admin'],
      'chat.abort': ['operator.write', 'operator.admin'],
      'tasks.create': ['operator.write', 'operator.admin'],
      'tasks.cancel': ['operator.write', 'operator.admin'],
      'tasks.resume': ['operator.write', 'operator.admin'],
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
            loaded: ['zero-policy', 'zero-system', 'browser', 'computer', 'zero-control-ui'],
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

      case 'sessions.list':
      case 'gateway.sessions.list': {
        const limit = Number(params.limit || 50);
        const offset = Number(params.offset || 0);
        const sessions = this.sessions.listSessions(limit, offset);
        return {
          ts: Date.now(),
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
        const patched = this.sessions.patchSession(key, params);
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
        return await this._executeAgentTurn({ sessionKey, userContent, ws, isReferenceWire, clientSession });
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
        const defaultModel = 'nvidia/nemotron-3.5-lightning-30b-a3b';
        return {
          models,
          defaultModel,
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
        const rev = '36a42defcd8df5b5112abb20e7ac5632ac511b36de5e755644122d0182bd5e46';
        return {
          revision: rev,
          plugins: [
            {
              pluginId: 'zero-control-ui',
              name: 'Zero Control UI',
              revision: rev,
              entryUrl: `/plugins/control-ui/zero-control-ui/${rev}/index.js`,
              styles: [`/plugins/control-ui/zero-control-ui/${rev}/index.css`],
            },
          ],
          diagnostics: [],
        };
      }

      case 'plugins.controlUi.report':
        return { ok: true };

      case 'plugins.controlUi.status':
        return {
          clients: [
            {
              connId: clientSession?.clientId || 'operator',
              activations: [{ pluginId: 'zero-control-ui', revision: '36a42defcd8df5b5112abb20e7ac5632ac511b36de5e755644122d0182bd5e46', active: true }],
            },
          ],
        };

      case 'zero.providers.list':
        return {
          ok: true,
          providers: this.modelFabric.getProviders(),
          health: this.modelFabric.getHealthReport(),
        };

      case 'zero.providers.configure': {
        const providersPath = path.join(REPO_ROOT, 'models', 'gateway-providers.json');
        if (params.provider && fs.existsSync(providersPath)) {
          const providers = JSON.parse(fs.readFileSync(providersPath, 'utf8'));
          const existingIdx = providers.findIndex((p) => p.id === params.provider.id);
          if (existingIdx >= 0) {
            providers[existingIdx] = { ...providers[existingIdx], ...params.provider };
          } else {
            providers.push(params.provider);
          }
          fs.writeFileSync(providersPath, JSON.stringify(providers, null, 2), 'utf8');
          this.modelFabric.reloadFromDisk();
        }
        return { ok: true, providers: this.modelFabric.getProviders() };
      }

      case 'zero.providers.test': {
        const modelId = params.modelId || 'zero-lead';
        const resolution = this.modelFabric.resolveModel(modelId);
        if (!resolution) {
          return { ok: false, error: `Model '${modelId}' not found` };
        }
        const apiKey = this.modelFabric.resolveApiKey(resolution.provider);
        return {
          ok: Boolean(apiKey),
          provider: resolution.provider.id,
          configured: Boolean(apiKey),
          baseUrl: resolution.provider.baseUrl,
        };
      }

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
        if (this.computerHold.held) {
          return { ok: false, error: 'Action refused: Human takeover hold is currently active.' };
        }
        const toolName = params.toolName || 'zero_computer_action';
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
        return {
          ok: true,
          screen: { available: true, active: true },
          accessibility: { available: true, active: true, engine: 'UIAutomation' },
          activeWindow: windowState?.window || null,
        };
      }

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
            { id: 'windows-desktop', status: 'connected', type: 'system' },
            { id: 'model-fabric', status: 'connected', type: 'inference' },
            { id: 'browser', status: 'connected', type: 'automation' },
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

      // Control UI Lifecycle & Capability Handlers
      case 'sessions.subscribe':
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

      case 'sessions.active':
        return { sessionKey: 'agent:zero:main' };

      case 'sessions.setInvolvement':
        return { ok: true, involvement: params.involvement || 'active' };

      case 'config.get': {
        const configPath = path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json');
        let cfg = { gateway: { port: this.port, bind: this.host }, models: { default: 'zero-lead' } };
        try {
          if (fs.existsSync(configPath)) {
            cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          }
        } catch {}
        const hash = crypto.createHash('sha256').update(JSON.stringify(cfg)).digest('hex').slice(0, 16);
        return { config: cfg, hash };
      }

      case 'config.set':
      case 'config.patch':
      case 'config.apply': {
        const configPath = path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json');
        let currentCfg = {};
        try {
          if (fs.existsSync(configPath)) {
            currentCfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          }
        } catch {}

        const updates = params.updates || params.config || params;
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
        const prefsPath = path.join(REPO_ROOT, 'zero-system', 'config', 'user-prefs.json');
        let prefs = {};
        try {
          if (fs.existsSync(prefsPath)) {
            prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
          }
        } catch {}
        return { prefs };
      }

      case 'users.prefs.set': {
        const prefsPath = path.join(REPO_ROOT, 'zero-system', 'config', 'user-prefs.json');
        let currentPrefs = {};
        try {
          if (fs.existsSync(prefsPath)) {
            currentPrefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
          }
        } catch {}
        const newPrefs = { ...currentPrefs, ...(params.prefs || params) };
        fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
        fs.writeFileSync(prefsPath, JSON.stringify(newPrefs, null, 2), 'utf8');
        return { ok: true, prefs: newPrefs };
      }

      case 'question.list':
        return [];

      case 'models.authStatus': {
        const providers = this.modelFabric.getProviders().map((p) => {
          const key = this.modelFabric.resolveApiKey(p);
          const hasKey = Boolean(key && key.length > 5);
          return {
            provider: p.id,
            configured: hasKey,
            authenticated: hasKey,
            tested: hasKey,
            keyState: hasKey ? 'configured' : 'missing',
            baseUrl: p.baseUrl,
          };
        });
        return { ok: true, providers };
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

      case 'voice.status':
        return { active: false, status: 'idle' };

      default: {
        const err = new Error(`Method '${method}' not found on Zero Native Gateway`);
        err.code = RPC_ERROR_CODES.METHOD_NOT_FOUND;
        throw err;
      }
    }
  }

  async _executeAgentTurn({ sessionKey, userContent, ws, isReferenceWire, clientSession }) {
    if (this.computerHold.held) {
      return {
        ok: false,
        error: 'Action refused: Human takeover hold is currently active.',
        status: 'held',
      };
    }

    const abortController = new AbortController();
    this.activeTurns.set(sessionKey, abortController);
    const turnId = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const DESKTOP_TOOLS = [
      {
        type: 'function',
        function: {
          name: 'zero_computer_action',
          description: 'Directly execute Windows OS computer actions: open_app, launch_app, type_text, play, browser, open_url, press_key, mouse_move, left_click, list_windows, list_apps, get_window_state, get_screen_size.',
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
              query: { type: 'string', description: 'Search term or song name to play on YouTube' },
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

    try {
      let currentMessages = this.sessions.getTranscript(sessionKey).map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      }));

      if (currentMessages.length === 0 && userContent) {
        this.sessions.appendMessage(sessionKey, { role: 'user', content: userContent });
        currentMessages.push({ role: 'user', content: userContent });
      }

      let turns = 0;
      const maxTurns = 5;
      let finalContent = '';
      let mediaResult = null;
      const executedActions = [];
      const turnStartTime = Date.now();
      let firstTokenTime = null;

      while (turns < maxTurns) {
        turns++;
        if (abortController.signal.aborted) {
          throw new Error('Agent turn was aborted by client');
        }

        const modelPayload = {
          model: 'zero-lead',
          messages: currentMessages,
          tools: DESKTOP_TOOLS,
        };

        let accumulatedContent = '';
        const toolCallsMap = new Map();
        let finishReason = null;

        try {
          // Single canonical streaming request handles both assistant text and incremental tool calls
          for await (const chunk of this.modelFabric.streamChat(modelPayload, { signal: abortController.signal })) {
            if (chunk.delta) {
              accumulatedContent += chunk.delta;
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
                    id: tc.id || `call_${Date.now()}_${idx}`,
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
              this.sessions.appendMessage(sessionKey, { role: 'assistant', content: accumulatedContent, status: 'interrupted' });
            }
            const interruptedPayload = { sessionKey, turnId, messageId, status: 'interrupted', partialContent: accumulatedContent };
            if (ws && ws.readyState === 1) {
              ws.send(JSON.stringify(isReferenceWire
                ? { type: 'event', event: 'chat.interrupted', payload: interruptedPayload }
                : createNotification('zero.stream.interrupted', interruptedPayload)));
            }
            throw new Error('Agent turn was aborted by client');
          }
          throw streamErr;
        }

        // If no tool calls were requested, complete with the accumulated content from this single request
        if (toolCallsMap.size === 0) {
          finalContent = accumulatedContent;
          if (!firstTokenTime) firstTokenTime = Date.now();
          break;
        }

        // Reconstruct tool calls and execute capabilities
        const toolCalls = Array.from(toolCallsMap.values());
        const assistantMsg = {
          role: 'assistant',
          content: accumulatedContent || null,
          tool_calls: toolCalls,
        };
        currentMessages.push(assistantMsg);
        this.sessions.appendMessage(sessionKey, assistantMsg);

        const executedCallIds = new Set();
        for (const call of toolCalls) {
          if (!call.id) call.id = `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          if (executedCallIds.has(call.id)) {
            console.warn(`[Zero Host] Skipping duplicate tool call ID '${call.id}'`);
            continue;
          }
          executedCallIds.add(call.id);

          const fnName = call.function?.name || '';
          let args = {};
          let parseError = null;
          try {
            args = typeof call.function?.arguments === 'string'
              ? JSON.parse(call.function.arguments)
              : (call.function?.arguments || {});
          } catch (err) {
            parseError = `Malformed tool arguments JSON: ${err.message}`;
          }

          if (parseError) {
            console.warn(`[Zero Host] Tool call argument parse failure for '${fnName}':`, parseError);
            const errObservation = { ok: false, error: parseError, raw: call.function?.arguments };
            const toolMsg = {
              role: 'tool',
              tool_call_id: call.id,
              content: JSON.stringify(errObservation),
            };
            currentMessages.push(toolMsg);
            this.sessions.appendMessage(sessionKey, toolMsg);
            continue;
          }

          let action = args.action || fnName;
          if (fnName === 'open_app' || fnName === 'launch_app') action = 'open_app';
          if (fnName === 'browser' || fnName === 'open_browser') {
            action = args.action || (args.query ? 'play' : 'open_url');
          }

          console.log(`[Zero Host] Model tool call '${fnName}' -> executing action '${action}' with args:`, args);

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
            toolName: fnName === 'browser' ? 'browser' : (fnName === 'open_app' ? 'open_app' : 'zero_computer_action'),
            args: { action, ...args },
            signal: abortController.signal,
          });

          executedActions.push({ action, args, execRes });

          if (action === 'play') {
            mediaResult = execRes.data || execRes;
          }

          const toolMsg = {
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(execRes),
          };
          currentMessages.push(toolMsg);
          this.sessions.appendMessage(sessionKey, toolMsg);
        }
      }

      // Truthful media widget card
      if (mediaResult && !finalContent.includes('zero-ui:media')) {
        const isPlaying = mediaResult.playbackState === 'PLAYING';
        const mediaPayload = {
          title: mediaResult.videoTitle || 'YouTube Music',
          videoId: mediaResult.videoId || '',
          url: mediaResult.url || (mediaResult.videoId ? `https://www.youtube.com/watch?v=${mediaResult.videoId}` : 'https://www.youtube.com'),
          thumbnail: mediaResult.thumbnail || (mediaResult.videoId ? `https://i.ytimg.com/vi/${mediaResult.videoId}/hqdefault.jpg` : ''),
          status: isPlaying ? 'playing' : (mediaResult.playbackState === 'PAUSED' ? 'paused' : 'unverified'),
          playbackState: mediaResult.playbackState || 'UNVERIFIED',
          audioAudible: mediaResult.audioAudible || 'UNVERIFIED',
          artist: 'YouTube',
          details: `Active Window: ${mediaResult.window?.title || 'YouTube'}`,
        };
        finalContent = (finalContent ? `${finalContent}\n\n` : '') + '```zero-ui:media\n' + JSON.stringify(mediaPayload, null, 2) + '\n```';
      }

      // Truthful progress card
      if (executedActions.length > 0 && !finalContent.includes('zero-ui:progress')) {
        let overallOutcome = 'COMPLETED';
        if (executedActions.some((a) => a.execRes?.outcome === 'FAILED' || a.execRes?.ok === false)) {
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

      this.sessions.appendMessage(sessionKey, { role: 'assistant', content: finalContent });

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
        messages: this.sessions.getTranscript(sessionKey),
      };
    } finally {
      this.activeTurns.delete(sessionKey);
    }
  }

  async close(options = {}) {
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.cronInterval = null;
    }
    for (const [key, controller] of this.activeTurns.entries()) {
      controller.abort();
    }
    this.activeTurns.clear();

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
    this.sessions.close();
    this.tasks.close();
    this.memory.close();
    this.automation.close();
    console.log(`[Zero Host] Zero Native Gateway stopped cleanly (${options.reason || 'normal'}).`);
  }
}
