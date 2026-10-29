import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Zero Gateway bridge configuration (server-side only).
 *
 * This module is a reusable bridge library, not a running product service.
 * The native Control UI plugin owns the product runtime; this configuration
 * exists for future/local Gateway clients that need the proven pairing and
 * RPC adapter. Values come from the environment; nothing here ever contains
 * key material. Device identity and pairing tokens live only under
 * ZERO_STATE_DIR and are generated at runtime, never committed.
 */
export interface ZeroConfig {
  gatewayUrl: string;
  stateDir: string;
  clientId: string;
  deviceLabel: string;
  /** OpenClaw Gateway WS protocol floor/ceiling. Zero speaks protocol 4 only. */
  minProtocol: 4;
  maxProtocol: 4;
  role: 'operator';
  scopes: string[];
  agentRunTimeoutMs: number;
}

export const OPERATOR_SCOPES = [
  'operator.read',
  'operator.write',
  'operator.approvals',
];

function requiredGatewayUrl(raw: string | undefined): string {
  const gatewayUrl = (raw ?? '').trim();
  if (!/^(ws|wss):\/\/[^\s/]+/i.test(gatewayUrl)) {
    throw new Error(
      'Setup required: set GATEWAY_URL to a ws:// or wss:// OpenClaw Gateway endpoint.',
    );
  }
  return gatewayUrl;
}

function positiveTimeout(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 45_000;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      'Setup required: ZERO_AGENT_RUN_TIMEOUT_MS must be a non-negative number (0 disables the guard).',
    );
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ZeroConfig {
  const gatewayUrl = requiredGatewayUrl(env.GATEWAY_URL);
  const rawStateDir = (env.ZERO_STATE_DIR ?? './zero-state').trim();
  if (!rawStateDir) {
    throw new Error('Setup required: ZERO_STATE_DIR must name a writable state directory.');
  }
  const stateDir = path.resolve(rawStateDir);
  fs.mkdirSync(stateDir, { recursive: true });
  return {
    gatewayUrl,
    stateDir,
    clientId: (env.ZERO_CLIENT_ID ?? 'zero-app').trim() || 'zero-app',
    deviceLabel: (env.ZERO_DEVICE_LABEL ?? 'Zero AI app').trim() || 'Zero AI app',
    minProtocol: 4,
    maxProtocol: 4,
    role: 'operator',
    scopes: [...OPERATOR_SCOPES],
    agentRunTimeoutMs: positiveTimeout(env.ZERO_AGENT_RUN_TIMEOUT_MS),
  };
}
