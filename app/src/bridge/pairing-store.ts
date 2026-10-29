import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DeviceIdentity } from '@openclaw/gateway-client';

/**
 * Identity/token persistence for pairing. Operates only under ZERO_STATE_DIR;
 * never returns token bytes to callers except the GatewayClient storage hooks
 * (load/store/clear), and never logs values.
 */
const IDENTITY_FILE = 'device-identity.json';
const TOKEN_FILE = 'device-token.json';

export interface StoredTokenState {
  deviceId: string;
  role: string;
  token: string;
  scopes: string[];
  storedAt: number;
}

function readJson<T>(stateDir: string, file: string): T | null {
  try {
    const raw = fs.readFileSync(path.join(stateDir, file), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(stateDir: string, file: string, value: unknown): void {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, file), JSON.stringify(value, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
}

export function loadIdentityFile(stateDir: string): DeviceIdentity | null {
  const value = readJson<DeviceIdentity>(stateDir, IDENTITY_FILE);
  if (
    value &&
    typeof value.deviceId === 'string' &&
    typeof value.privateKeyPem === 'string' &&
    typeof value.publicKeyPem === 'string'
  ) {
    return value;
  }
  return null;
}

export function writeIdentityFile(
  stateDir: string,
  identity: DeviceIdentity,
): void {
  writeJson(stateDir, IDENTITY_FILE, identity);
}

export function loadTokenState(stateDir: string): StoredTokenState | null {
  const value = readJson<StoredTokenState>(stateDir, TOKEN_FILE);
  if (
    value &&
    typeof value.token === 'string' &&
    typeof value.deviceId === 'string'
  ) {
    return value;
  }
  return null;
}

export function writeTokenState(
  stateDir: string,
  state: StoredTokenState | null,
): void {
  if (state) {
    writeJson(stateDir, TOKEN_FILE, state);
    return;
  }
  try {
    fs.rmSync(path.join(stateDir, TOKEN_FILE), { force: true });
  } catch {
    // A missing token file is already the desired state.
  }
}
