// Key Guard: a well-known API key only ever goes to its own provider's host.
//
// Zero can pick keys up from environment variables. A key like
// OPENAI_API_KEY must not be sent to some other server just because a
// provider entry is called "openai" or names that variable. Keys the owner
// saved for one specific provider (in Zero's settings) are theirs to use and
// are not restricted here.

export const KEY_HOSTS = Object.freeze({
  OPENAI_API_KEY: ['api.openai.com'],
  ANTHROPIC_API_KEY: ['api.anthropic.com'],
  GEMINI_API_KEY: ['generativelanguage.googleapis.com'],
  GOOGLE_API_KEY: ['generativelanguage.googleapis.com'],
  NVIDIA_API_KEY: ['integrate.api.nvidia.com', 'ai.api.nvidia.com'],
  NV_API_KEY: ['integrate.api.nvidia.com', 'ai.api.nvidia.com'],
  OPENROUTER_API_KEY: ['openrouter.ai'],
  GROQ_API_KEY: ['api.groq.com'],
  DEEPSEEK_API_KEY: ['api.deepseek.com'],
  MISTRAL_API_KEY: ['api.mistral.ai'],
  XAI_API_KEY: ['api.x.ai'],
});

function hostOf(baseUrl) {
  try { return new URL(String(baseUrl)).hostname.toLowerCase(); } catch { return ''; }
}

/** May the key held in env var `name` be sent to `baseUrl`? Unknown names are allowed. */
export function keyAllowedFor(name, baseUrl) {
  const hosts = KEY_HOSTS[String(name || '').toUpperCase()];
  if (!hosts) return true;
  const host = hostOf(baseUrl);
  return hosts.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
}

/** Why a key was withheld, for logs and the provider status. */
export function keyWithheldReason(name, baseUrl) {
  return `${name} is only sent to ${KEY_HOSTS[String(name).toUpperCase()].join(' / ')}, not to ${hostOf(baseUrl) || 'an unknown host'}`;
}
