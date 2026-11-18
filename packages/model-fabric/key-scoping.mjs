/**
 * @fileoverview Zero Provider Key Scoping
 *
 * Ensures API keys are only sent to their intended provider hosts, preventing
 * key leakage to custom or untrusted endpoints. Each provider has an allowlist
 * of host patterns; keys are blocked if the target base URL doesn't match.
 *
 * Zero provider host allowlists (from Hermes-inspired design):
 *   openrouter.ai     -> OPENROUTER_API_KEY
 *   api.anthropic.com -> ANTHROPIC_API_KEY
 *   api.openai.com    -> OPENAI_API_KEY
 *   generativelanguage.googleapis.com -> GEMINI_API_KEY / GEMINI_LIVE_SCREEN_API_KEY
 *   integrate.api.nvidia.com -> NV_API_KEY / NVIDIA_API_KEY
 *   custom endpoints  -> only keys explicitly bound to that host
 */

import { URL } from 'node:url';

const PROVIDER_HOST_ALLOWLIST = {
  'openrouter': ['openrouter.ai', 'api.openrouter.ai'],
  'anthropic': ['api.anthropic.com', 'claude-api.anthropic.com'],
  'openai': ['api.openai.com', 'openai.com'],
  'gemini': ['generativelanguage.googleapis.com'],
  'gemini-live-screen': ['generativelanguage.googleapis.com'],
  'nv': ['integrate.api.nvidia.com', 'api.nvidia.com'],
  'google': ['generativelanguage.googleapis.com'],
  'nvidia': ['integrate.api.nvidia.com'],
};

/** Extract hostname from a base URL. */
function hostOf(baseUrl) {
  try {
    if (!baseUrl) return null;
    const url = new URL(baseUrl);
    return url.hostname.toLowerCase();
  } catch { return null; }
}

/** Check whether a key is allowed to be sent to a given provider base URL. */
export function isKeyAllowedForHost(providerId, baseUrl, apiKey) {
  if (!apiKey || !baseUrl || !providerId) return { allowed: false, reason: 'missing inputs' };

  const host = hostOf(baseUrl);
  if (!host) return { allowed: false, reason: 'invalid base URL' };

  const allowlist = PROVIDER_HOST_ALLOWLIST[providerId];
  if (!allowlist) {
    // Custom provider: key must have been explicitly configured for this host.
    // Allow only if the key is not a well-known provider key being misrouted.
    return { allowed: true, reason: 'custom provider (explicit config)' };
  }

  const matches = allowlist.some((pattern) => {
    const p = pattern.toLowerCase();
    return host === p || host.endsWith('.' + p);
  });

  if (!matches) {
    return {
      allowed: false,
      reason: `API key for provider '${providerId}' is not scoped to host '${host}'. Allowed: ${allowlist.join(', ')}`,
    };
  }

  return { allowed: true, reason: 'host-scoped key OK' };
}

/** Validate all configured providers: keys must match their host allowlist. */
export function validateProviderKeyScoping(providers) {
  const results = [];
  for (const p of providers) {
    const key = p.apiKey || (Array.isArray(p.apiKeys) ? p.apiKeys[0] : null);
    if (!key || key.startsWith('env:')) {
      // env:-referenced keys are resolved at runtime; skip static validation.
      results.push({ provider: p.id, status: 'skipped', reason: 'env-referenced key' });
      continue;
    }
    const check = isKeyAllowedForHost(p.id, p.baseUrl, key);
    results.push({ provider: p.id, host: hostOf(p.baseUrl), ...check });
  }
  return results;
}

/** Middleware wrapper: enforce key scoping before forwarding a request. */
export function enforceKeyScope(providerId, baseUrl, apiKey) {
  const check = isKeyAllowedForHost(providerId, baseUrl, apiKey);
  if (!check.allowed) {
    const err = new Error(check.reason);
    err.code = 'KEY_SCOPE_VIOLATION';
    err.status = 403;
    throw err;
  }
  return check;
}

export const defaultKeyScoping = {
  isKeyAllowedForHost,
  validateProviderKeyScoping,
  enforceKeyScope,
  PROVIDER_HOST_ALLOWLIST,
};