/**
 * GatewayLink — the Zero runtime's single owner of the OpenClaw Gateway
 * connection (D-008: WS RPC is the primary UI transport for sending AND
 * events; OpenAI-compatible HTTP is never used here).
 *
 * Wraps @openclaw/gateway-client (exact version pinned in package.json to
 * match the backend's openclaw@2026.10.6 runtime). Responsibilities:
 *
 *  - Device pairing via host deps (see pairing.ts): identity, token storage.
 *  - Connect lifecycle: operator role, operator.read/write/approvals scopes,
 *    TOOL_EVENTS + CHAT_ONLY_ASSISTANT_TEXT caps, protocol 4/4.
 *  - One chat-stream projection per connection (GatewayChatStreamProjection).
 *  - Re-reading session roster on every (re)connect; refetch-based recovery
 *    (health + chat.history + sessions resubscribe); events are not replayed.
 *  - Zero-owned Gateway calls: chat.send / chat.abort / sessions.abort /
 *    chat.history / sessions.list / sessions.subscribe / zero.computer.control.
 *
 * Unverified wire facts are marked [needs live proof] and were recorded in
 * reports/ui/bridge-spike.md (remaining OQ-1..7) for integration follow-up.
 */
import {
  GatewayClient,
  mergeChatStreamMessage,
} from '@openclaw/gateway-client';
import { randomUUID } from 'node:crypto';
import type {
  GatewayClientOptions,
} from '@openclaw/gateway-client';
import type { EventFrame } from '@openclaw/gateway-protocol/frame-guards';
import {
  GATEWAY_CLIENT_CAPS,
  GATEWAY_CLIENT_IDS,
  GATEWAY_CLIENT_MODES,
} from '@openclaw/gateway-protocol/client-info';
import {
  ConnectErrorDetailCodes,
  readConnectErrorDetailCode,
  readPairingConnectErrorDetails,
  readConnectErrorRecoveryAdvice,
} from '@openclaw/gateway-protocol/connect-error-details';
import type { ZeroConfig } from './config.js';
import {
  deviceTokenStorage,
  loadOrCreateDeviceIdentity,
  publicKeyRawBase64UrlFromPem,
  signDevicePayload,
} from './pairing.js';
import type {
  ZeroChatEvent,
  ZeroToolActivity,
} from '../shared/zero-types.js';

export type GatewayLinkStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'pairing-required'
  | 'reconnect-paused'
  | 'closed'
  | 'error';

export type GatewayLinkEvent =
  | { kind: 'status'; status: GatewayLinkStatus; detail?: string }
  | { kind: 'chat'; event: ZeroChatEvent }
  | { kind: 'tool'; activity: ZeroToolActivity }
  | { kind: 'sessions-changed' }
  | { kind: 'chat-gap'; expected: number; received: number };

type Listener = (event: GatewayLinkEvent) => void;

type ChatScope = { sessionKey: string; agentId: unknown };
type ChatFrame = { event: string; payload?: unknown };

/** Connection-local delta baseline using the gateway client's published merge helper. */
class ChatStreamProjection {
  private readonly runs = new Map<string, ChatScope & { message: unknown }>();

  project<T extends ChatFrame>(frame: T): { event: T; missingBaseline: boolean } {
    if (frame.event !== 'chat' || !isRecord(frame.payload)) {
      return { event: frame, missingBaseline: false };
    }
    const payload = frame.payload;
    if (typeof payload.runId !== 'string' || typeof payload.sessionKey !== 'string') {
      return { event: frame, missingBaseline: false };
    }
    if (payload.state === 'delta') {
      const previous = this.runs.get(payload.runId);
      const message = mergeChatStreamMessage(
        previous?.sessionKey === payload.sessionKey && previous.agentId === payload.agentId
          ? previous.message
          : undefined,
        payload,
      );
      if (message !== undefined) {
        this.runs.set(payload.runId, {
          sessionKey: payload.sessionKey,
          agentId: payload.agentId,
          message,
        });
      }
      return {
        event: { ...frame, payload: { ...payload, message } },
        missingBaseline: message === undefined,
      };
    }
    if (['final', 'error', 'aborted'].includes(String(payload.state))) {
      this.runs.delete(payload.runId);
    }
    return { event: frame, missingBaseline: false };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const ACTIVE_TOOL_CAPS = [
  // Without TOOL_EVENTS the connection silently receives no live tool events
  // (docs/gateway/clients.md) — the computer panel's Activity tab needs them.
  GATEWAY_CLIENT_CAPS.TOOL_EVENTS,
  // D-008: exactly one user-facing chat text projection.
  GATEWAY_CLIENT_CAPS.CHAT_ONLY_ASSISTANT_TEXT,
];

export class GatewayLink {
  private readonly config: ZeroConfig;
  private readonly listeners = new Set<Listener>();
  private client: GatewayClient | null = null;
  private connectionGeneration = 0;
  private projection = new ChatStreamProjection();
  private rosterSubscribed = false;
  private status: GatewayLinkStatus = 'idle';
  private statusDetail: string | undefined;

  constructor(config: ZeroConfig) {
    this.config = config;
  }

  statusSnapshot(): { status: GatewayLinkStatus; detail?: string; paired: boolean } {
    return { status: this.status, detail: this.statusDetail, paired: this.isPaired() };
  }

  isPaired(): boolean {
    // Pairing state is transport-visible: connected or previously stored token
    // both count. Fine-grained state is surfaced via pairingStatus().
    return this.status === 'connected';
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({
      kind: 'status',
      status: this.status,
      detail: this.statusDetail,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: GatewayLinkEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // One bad listener must not starve the connection pump.
      }
    }
  }

  private setStatus(status: GatewayLinkStatus, detail?: string): void {
    this.status = status;
    this.statusDetail = detail;
    this.emit({ kind: 'status', status, detail });
  }

  /** Idempotent connect; GatewayClient owns retries and reconnect timing. */
  start(): void {
    if (this.client) return;
    this.setStatus('connecting');
    const client = this.buildClient();
    this.client = client;
    const generation = ++this.connectionGeneration;
    void generation;
    client.start();
  }

  stop(): void {
    this.client?.stop();
    this.client = null;
    this.projection = new ChatStreamProjection();
    this.rosterSubscribed = false;
    this.setStatus('closed');
  }

  private buildClient(): GatewayClient {
    const identity = loadOrCreateDeviceIdentity(this.config.stateDir);
    const options: GatewayClientOptions = {
      url: this.config.gatewayUrl,
      clientName: GATEWAY_CLIENT_IDS.GATEWAY_CLIENT,
      clientDisplayName: this.config.deviceLabel,
      clientVersion: '0.1.0',
      platform: process.platform,
      mode: GATEWAY_CLIENT_MODES.BACKEND,
      role: this.config.role,
      scopes: this.config.scopes,
      caps: [...ACTIVE_TOOL_CAPS],
      commands: [],
      // Shared Gateway auth is distinct from the one-time setup/bootstrap code.
      token: process.env.OPENCLAW_GATEWAY_TOKEN,
      minProtocol: this.config.minProtocol,
      maxProtocol: this.config.maxProtocol,
      deviceIdentity: identity,
      hostDeps: {
        loadOrCreateDeviceIdentity: () =>
          loadOrCreateDeviceIdentity(this.config.stateDir),
        signDevicePayload: (privateKeyPem, payload) =>
          signDevicePayload(privateKeyPem, payload),
        publicKeyRawBase64UrlFromPem: (publicKeyPem) =>
          publicKeyRawBase64UrlFromPem(publicKeyPem),
        ...deviceTokenStorage(this.config.stateDir),
        logDebug: () => {},
        logError: (message) => {
          // Gateway-owned log line only; never include token/payload values.
          console.error(`[gateway] ${message}`);
        },
      },
      onHelloOk: () => {
        this.projection = new ChatStreamProjection();
        this.handleHelloOk();
      },
      onEvent: (frame) => this.handleEvent(frame),
      onConnectError: (error) => this.handleConnectError(error),
      onReconnectPaused: (info) =>
        this.setStatus('reconnect-paused', describeReconnectPause(info)),
      onClose: () => {
        this.projection = new ChatStreamProjection();
        this.rosterSubscribed = false;
        if (this.status !== 'pairing-required') {
          this.setStatus('connecting', 'Reconnecting to the Gateway…');
        }
      },
      onGap: (info) => {
        // Refetch-based recovery per D-008: chat streams never replay; the
        // runtime consumers refresh chat.history + health for affected threads.
        this.emit({ kind: 'chat-gap', expected: info.expected, received: info.received });
      },
    };
    return new GatewayClient(options);
  }

  private async handleHelloOk(): Promise<void> {
    this.setStatus('connected');
    // Re-establish the roster subscription after every (re)connect (docs).
    try {
      if (!this.rosterSubscribed) {
        await this.request('sessions.subscribe', {
          ownerFirst: true,
        });
        this.rosterSubscribed = true;
      }
    } catch (error) {
      // Non-fatal: roster reads still work via sessions.list polling paths.
      this.emit({ kind: 'sessions-changed' });
      console.error('[gateway] sessions.subscribe failed:', nameOf(error));
    }
  }

  private handleEvent(frame: EventFrame): void {
    if (frame.event === 'chat') {
      const { event, missingBaseline } = this.projection.project(frame);
      const payload = event.payload as Record<string, unknown> | undefined;
      if (!payload || typeof payload.runId !== 'string') return;
      const state = readChatState(payload.state);
      const chatEvent: ZeroChatEvent = {
        runId: payload.runId,
        sessionKey: typeof payload.sessionKey === 'string' ? payload.sessionKey : '',
        state,
        message: payload.message ?? (payload.deltaText !== undefined ? payload : undefined),
        error: typeof payload.error === 'string' ? payload.error : undefined,
      };
      this.emit({ kind: 'chat', event: chatEvent });
      if (missingBaseline) {
        // Snapshot for this runId was missed (fresh session subscription or
        // gap): consumer refetches chat.history instead of trusting frames.
        this.emit({ kind: 'chat-gap', expected: 1, received: 1 });
      }
      return;
    }
    if (frame.event === 'session.tool') {
      const activity = readToolActivity(frame.payload);
      if (activity) this.emit({ kind: 'tool', activity });
      return;
    }
    if (
      frame.event === 'sessions.changed' ||
      frame.event === 'sessions-changed'
    ) {
      this.emit({ kind: 'sessions-changed' });
    }
    // Other events are intentionally ignored: approvals subscription is
    // opt-in and out of the MVP browser (bridge-spike §9); approval replay
    // is only fetched when a future version opts in explicitly.
  }

  private handleConnectError(error: Error): void {
    const code = readConnectErrorDetailCode(error.message);
    if (code === ConnectErrorDetailCodes.PAIRING_REQUIRED) {
      const pairing = readPairingConnectErrorDetails(error.message);
      this.setStatus(
        'pairing-required',
        describePairing(pairing, readConnectErrorRecoveryAdvice(error.message)),
      );
      // Reconnect policy pauses here (non-recoverable until approval), so the
      // next start() is a fresh attempt after the owner approves the device.
      return;
    }
    this.setStatus('error', error.message);
  }

  request<T = unknown>(
    method: string,
    params: Record<string, unknown>,
    options?: { timeoutMs?: number },
  ): Promise<T> {
    const client = this.client;
    if (!client) {
      return Promise.reject(new Error('Gateway link is not connected.'));
    }
    return client.request<T>(method, params, options);
  }

  /**
   * Single visible text dispatch (D-008). Response shape (run id fields) is
   * [needs live proof OQ-2]; consumers accept unknown and project from events.
   */
  async chatSend(params: { sessionKey: string; text: string }): Promise<unknown> {
    return this.request('chat.send', {
      sessionKey: params.sessionKey,
      message: params.text,
      idempotencyKey: randomUUID(),
    });
  }

  /**
   * Run-level interrupt: preferred layer 'chat.abort'; the request-level
   * 'sessions.abort' stays the broad fallback for STOP ALL (bridge-spike §8).
   */
  async chatAbort(sessionKey: string): Promise<void> {
    await this.request('chat.abort', { sessionKey }).catch(() => {
      // chat.abort granularity is [needs live proof]; fall back to the wider
      // sessions.abort so an interrupt never silently fails.
      return this.request('sessions.abort', { sessionKey });
    });
  }

  /** chat.history — paginated (≈512 KiB), deltaCursor supported upstream. */
  chatHistory(params: { sessionKey: string; offset?: string }): Promise<unknown> {
    return this.request('chat.history', {
      sessionKey: params.sessionKey,
      ...(params.offset ? { offset: params.offset } : {}),
    });
  }

  health(): Promise<unknown> {
    return this.request('health', {});
  }

  sessionsList(): Promise<unknown> {
    return this.request('sessions.list', {});
  }

  /**
   * Session creation. Live-verified contract: `key`, `agentId`, `displayName`,
   * and `titleSource`; Gateway chat events report the canonical
   * `agent:<agentId>:<key>` alias, handled by ZeroAgent.
   */
  sessionsCreate(params: {
    key?: string;
    agentId?: string;
    title?: string;
  }): Promise<unknown> {
    return this.request('sessions.create', {
      ...(params.key ? { key: params.key } : {}),
      ...(params.agentId ? { agentId: params.agentId } : {}),
      ...(params.title
        ? { displayName: params.title, titleSource: params.title }
        : {}),
    });
  }

  /**
   * D-009: zero.computer.control via the backend-owned plugin; the tool-policy
   * hold refuses rather than queues. Qoder confirms typed params/results
   * (CU ticket) before the first live call. [needs live proof]
   */
  computerControl(params: {
    action: 'take' | 'release' | 'status';
    sessionKey?: string;
    reason?: string;
    controlLeaseId?: string;
  }): Promise<unknown> {
    return this.request('zero.computer.control', { ...params });
  }

  connectionGenerationSnapshot(): number {
    return this.connectionGeneration;
  }
}

function readChatState(value: unknown): ZeroChatEvent['state'] {
  if (value === 'final' || value === 'error' || value === 'aborted') {
    return value;
  }
  return 'delta';
}

/**
 * Generous, loss-tolerant projection of session.tool payloads into the panel's
 * Activity list. Exact wire fields are [needs live proof OQ-6]; neither a
 * broken payload nor a changed casing may crash a connected session.
 */
function readToolActivity(payload: unknown): ZeroToolActivity | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const toolName =
    readFirstString(record, ['toolCallName', 'tool', 'name', 'toolName']) ??
    'tool';
  const rawState = readFirstString(record, [
    'state',
    'status',
    'phase',
    'event',
  ]);
  const status: ZeroToolActivity['status'] =
    rawState === 'done' || rawState === 'complete' || rawState === 'completed'
      ? 'done'
      : rawState === 'failed' || rawState === 'error'
        ? 'failed'
        : 'running';
  const sessionKey = readFirstString(record, [
    'sessionKey',
    'key',
    'threadKey',
  ]);
  const startedAt = readFirstNumber(record, ['startedAt', 'ts', 'timestamp']) ?? Date.now();
  return {
    sessionKey: sessionKey ?? '',
    toolName,
    status,
    startedAt,
  };
}

function readFirstString(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function readFirstNumber(
  record: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function describeReconnectPause(info: { reason?: string }): string | undefined {
  return info.reason;
}

/**
 * Build the operator-facing pairing instruction. The requestId is the one
 * parsed from the connect error details; the approval command text comes from
 * docs/gateway/clients.md. No credential material is ever echoed.
 */
function describePairing(
  pairing: unknown,
  recoveryAdvice: { recommendedNextStep?: string } | undefined,
): string {
  const requestId = readRequestId(pairing);
  const command = requestId
    ? `openclaw devices approve ${requestId}`
    : 'openclaw devices approve <requestId>';
  const advice = recoveryAdvice?.recommendedNextStep
    ? ` (${recoveryAdvice.recommendedNextStep.replaceAll('_', ' ')})`
    : '';
  return `Device pairing required${advice}. Run in the Gateway terminal: ${command}, then retry.`;
}

function readRequestId(pairing: unknown): string | undefined {
  if (!pairing || typeof pairing !== 'object') return undefined;
  const record = pairing as Record<string, unknown>;
  return readFirstString(record, ['requestId', 'pairingRequestId', 'id']);
}

function nameOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
