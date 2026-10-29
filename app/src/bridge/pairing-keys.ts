/**
 * Ed25519 key helpers for device pairing. Isolated so the only key-handling
 * in the Zero runtime lives here, with no logging and no storage outside the
 * ZERO_STATE_DIR identity file managed by pairing-store.ts.
 */
import {
  createPrivateKey,
  createPublicKey,
  createHash,
  generateKeyPairSync,
  sign as cryptoSign,
} from 'node:crypto';
import type { DeviceIdentity } from '@openclaw/gateway-client';

const ED25519_PUBLIC_RAW_OFFSET = 12; // SPKI DER header before the 32-byte key.

/** Plain data shape; matches the GatewayClient DeviceIdentity contract. */
export function createKeyPair(): DeviceIdentity {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privateKeyPem = privateKey
    .export({ type: 'pkcs8', format: 'pem' })
    .toString();
  const publicKeyPem = publicKey
    .export({ type: 'spki', format: 'pem' })
    .toString();
  return {
    // OpenClaw binds deviceId to SHA-256(raw Ed25519 public key), hex encoded.
    deviceId: createHash('sha256')
      .update(rawPublicKey(publicKeyPem))
      .digest('hex'),
    privateKeyPem,
    publicKeyPem,
  };
}

/**
 * Ed25519 payload signer for the GatewayClient `signDevicePayload` host dep.
 * OpenClaw verifies device signatures as base64url-encoded Ed25519 bytes.
 */
export function signDevicePayload(
  privateKeyPem: string,
  payload: string,
): string {
  return cryptoSign(
    null,
    Buffer.from(payload, 'utf8'),
    createPrivateKey(privateKeyPem),
  ).toString('base64url');
}

export function rawKeyBase64Url(publicKeyPem: string): string {
  return rawPublicKey(publicKeyPem).toString('base64url');
}

function rawPublicKey(publicKeyPem: string): Buffer {
  const key = createPublicKey(publicKeyPem);
  const der = key.export({ type: 'spki', format: 'der' });
  return Buffer.from(der.subarray(ED25519_PUBLIC_RAW_OFFSET));
}
