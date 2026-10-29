/**
 * Zero device pairing (OQ-4 default, accepted by review).
 *
 * The Zero runtime process owns the Gateway pairing entirely: it generates or
 * loads a device identity (Ed25519), signs the connect challenge via the
 * GatewayClient host deps, and persists the device token granted on hello-ok
 * after `openclaw devices approve <requestId>`. The browser never sees or
 * stores any credential.
 *
 * Identity/token files live under ZERO_STATE_DIR and are runtime state, not
 * source material. They are never logged, exported, or committed.
 */
import type { DeviceIdentity } from '@openclaw/gateway-client';
import type { GatewayClientHostDeps } from '@openclaw/gateway-client';
import {
  createKeyPair,
  rawKeyBase64Url,
  signDevicePayload as signPayload,
} from './pairing-keys.js';
import {
  loadIdentityFile,
  loadTokenState,
  writeIdentityFile,
  writeTokenState,
  type StoredTokenState,
} from './pairing-store.js';

export type { DeviceIdentity };

export function loadOrCreateDeviceIdentity(stateDir: string): DeviceIdentity {
  const existing = loadIdentityFile(stateDir);
  if (existing) return existing;
  const identity = createKeyPair();
  writeIdentityFile(stateDir, identity);
  return identity;
}

export function signDevicePayload(
  privateKeyPem: string,
  payload: string,
): string {
  return signPayload(privateKeyPem, payload);
}

export function publicKeyRawBase64UrlFromPem(publicKeyPem: string): string {
  return rawKeyBase64Url(publicKeyPem);
}

/** Persistent storage implementation for GatewayClient token callbacks. */
export function deviceTokenStorage(
  stateDir: string,
): Pick<GatewayClientHostDeps, 'loadDeviceAuthToken' | 'storeDeviceAuthToken' | 'clearDeviceAuthToken'> {
  return {
    loadDeviceAuthToken() {
      const state = loadTokenState(stateDir);
      return state ? { token: state.token, scopes: state.scopes } : null;
    },
    storeDeviceAuthToken(params) {
      const state: StoredTokenState = {
        deviceId: params.deviceId,
        role: params.role,
        token: params.token,
        scopes: params.scopes,
        storedAt: Date.now(),
      };
      writeTokenState(stateDir, state);
    },
    clearDeviceAuthToken() {
      writeTokenState(stateDir, null);
    },
  };
}

/** Coarse pairing status for the UI; never includes token material. */
export function pairingStatus(stateDir: string): {
  identityReady: boolean;
  deviceTokenStored: boolean;
} {
  return {
    identityReady: Boolean(loadIdentityFile(stateDir)),
    deviceTokenStored: Boolean(loadTokenState(stateDir)?.token),
  };
}

/**
 * Connect fallback used when the owner pre-authorized a bootstrap token
 * instead of device pairing (shared Gateway setup token). The value arrives
 * via env indirection only and is never written to disk by Zero.
 */
export function connectAuthProvider(env: NodeJS.ProcessEnv): 'device' | 'bootstrap-only' {
  return env.ZERO_GATEWAY_BOOTSTRAP_TOKEN ? 'bootstrap-only' : 'device';
}
