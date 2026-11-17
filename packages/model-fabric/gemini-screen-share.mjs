/**
 * Gemini screen share: provider settings and connection check.
 *
 * A Gemini provider (base URL on generativelanguage.googleapis.com) can carry a
 * `screenShare` block. When it is enabled and the key works, Zero can share
 * the screen with Gemini Live ("online" mode) and use Gemini Computer Use to
 * locate controls on screen. Without it Zero stays on its local ("offline")
 * screen share.
 *
 * Behaviour verified against the owner's key on 2026-11-17 (see
 * docs/plans/SCREEN-SHARE-ONLINE.md, section 4c):
 * - Live answers in AUDIO only; `responseModalities` lives in generationConfig.
 * - Computer Use needs /v1beta/interactions; the "desktop" environment was
 *   refused as a safety violation, "browser" worked; coordinates are 0-999.
 */

import fs from 'node:fs';

export const GEMINI_HOST = 'generativelanguage.googleapis.com';
export const LIVE_WS_URL = `wss://${GEMINI_HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`;
export const INTERACTIONS_URL = `https://${GEMINI_HOST}/v1beta/interactions`;

export const SCREEN_SHARE_DEFAULTS = Object.freeze({
  enabled: false,
  liveModel: 'gemini-3.8-live',
  computerUseModel: 'gemini-3.5-flash-lite',
  computerUseEnvironment: 'browser',
  frameMode: 'on-change', // 'on-change' (continuous, only when the screen changes) | 'on-demand'
  maxFps: 1,
  heartbeatSeconds: 10,
  voiceReplies: false,
  excludedApps: ['KeePass', 'KeePassXC', '1Password', 'Bitwarden', 'LastPass', 'Windows Security'],
  maxMinutesPerHour: 60,
});

const MODEL_ID = /^[a-z0-9][a-z0-9.\-_]{1,120}$/i;

export function isGeminiProvider(provider) {
  try { return new URL(String(provider?.baseUrl || '')).hostname === GEMINI_HOST; } catch { return false; }
}

/** Validate an incoming `screenShare` block, keeping previous values for omitted fields. */
export function normalizeScreenShareConfig(input, previous = {}) {
  if (input === undefined) return previous && Object.keys(previous).length ? { ...SCREEN_SHARE_DEFAULTS, ...previous } : undefined;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('screenShare must be an object');
  const next = { ...SCREEN_SHARE_DEFAULTS, ...previous };
  const take = (key, check, message) => {
    if (input[key] === undefined) return;
    if (!check(input[key])) throw new Error(`Invalid screenShare.${key}: ${message}`);
    next[key] = input[key];
  };
  take('enabled', v => typeof v === 'boolean', 'expected true or false');
  take('liveModel', v => typeof v === 'string' && MODEL_ID.test(v.replace(/^models\//, '')), 'expected a model id');
  take('computerUseModel', v => typeof v === 'string' && MODEL_ID.test(v.replace(/^models\//, '')), 'expected a model id');
  take('computerUseEnvironment', v => ['browser', 'desktop'].includes(v), 'expected "browser" or "desktop"');
  take('frameMode', v => ['on-change', 'on-demand'].includes(v), 'expected "on-change" or "on-demand"');
  take('maxFps', v => typeof v === 'number' && v > 0 && v <= 1, 'expected a number above 0 and at most 1 (Gemini accepts at most 1 frame per second)');
  take('heartbeatSeconds', v => Number.isInteger(v) && v >= 2 && v <= 300, 'expected 2-300 seconds');
  take('voiceReplies', v => typeof v === 'boolean', 'expected true or false');
  take('excludedApps', v => Array.isArray(v) && v.length <= 100 && v.every(app => typeof app === 'string' && app.trim() && app.length <= 120), 'expected a list of app names');
  take('maxMinutesPerHour', v => Number.isInteger(v) && v >= 1 && v <= 60, 'expected 1-60 minutes');
  next.liveModel = next.liveModel.replace(/^models\//, '');
  next.computerUseModel = next.computerUseModel.replace(/^models\//, '');
  next.excludedApps = [...new Set(next.excludedApps.map(app => app.trim()))];
  return next;
}

/** The provider that online screen share should use, or null. */
export function findScreenShareProvider(fabric) {
  for (const provider of fabric.providers?.values?.() || []) {
    if (provider.enabled === false || !isGeminiProvider(provider) || provider.screenShare?.enabled !== true) continue;
    const apiKey = fabric.resolveApiKey(provider);
    if (!apiKey) continue;
    return { provider, config: normalizeScreenShareConfig(undefined, provider.screenShare), apiKey };
  }
  return null;
}

const COMPUTER_USE_FAMILIES = [/^gemini-4-/, /^gemini-3\.8-flash$/, /^gemini-3\.5-flash-lite$/, /^gemini-3-flash-preview$/, /computer-use/];
const LIVE_EXCLUDE = /translate|transcribe|robotics/;

/** Models this key can use for Live and for Computer Use. */
export async function listScreenShareModels(apiKey, { signal } = {}) {
  const models = [];
  let pageToken = '';
  do {
    const url = `https://${GEMINI_HOST}/v1beta/models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url, { headers: { 'x-goog-api-key': apiKey }, signal: signal ?? AbortSignal.timeout(15000) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error?.message || `Model list failed (HTTP ${res.status})`);
    models.push(...(body.models || []));
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  const id = model => String(model.name || '').replace(/^models\//, '');
  return {
    live: models.filter(m => (m.supportedGenerationMethods || []).includes('bidiGenerateContent') && !LIVE_EXCLUDE.test(id(m))).map(id),
    computerUse: models.filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && COMPUTER_USE_FAMILIES.some(re => re.test(id(m)))).map(id),
  };
}

/** Open a Live session, wait for setupComplete, close. No screen data is sent. */
export function checkLiveSetup(apiKey, model, { timeoutMs = 15000 } = {}) {
  return new Promise(resolve => {
    const started = Date.now();
    let settled = false;
    const done = result => { if (settled) return; settled = true; clearTimeout(timer); try { ws.close(); } catch {} resolve({ ...result, ms: Date.now() - started }); };
    const ws = new WebSocket(`${LIVE_WS_URL}?key=${encodeURIComponent(apiKey)}`);
    const timer = setTimeout(() => done({ ok: false, error: `No answer from Gemini Live within ${Math.round(timeoutMs / 1000)} s` }), timeoutMs);
    ws.onopen = () => ws.send(JSON.stringify({ setup: { model: `models/${model}`, generationConfig: { responseModalities: ['AUDIO'] }, outputAudioTranscription: {} } }));
    ws.onmessage = async event => {
      const raw = typeof event.data === 'string' ? event.data : Buffer.from(await event.data.arrayBuffer()).toString('utf8');
      try { if (JSON.parse(raw).setupComplete) done({ ok: true }); } catch {}
    };
    ws.onclose = event => done({ ok: false, error: event.reason ? String(event.reason).slice(0, 300) : `Connection closed (code ${event.code})` });
    ws.onerror = () => {};
  });
}

// A synthetic 1440x900 dialog drawn for this check (no owner data). Computer
// Use refuses requests without a realistic screenshot (text only, or a blank
// image) as "safety violations"; this image is accepted.
const CHECK_IMAGE = new URL('./assets/screen-check-dialog.png', import.meta.url);

/**
 * POST to the Interactions API. Two refusals turned out to be transient on the
 * owner's key: "Request blocked due to safety violations" for a valid
 * screenshot (about one request in three) and 503 "high demand". Both are
 * retried; anything else is returned as is.
 */
export async function postInteraction(apiKey, body, { timeoutMs = 60000, retries = 2, signal = null, url = INTERACTIONS_URL, retryDelaysMs = [1500, 4000] } = {}) {
  let last = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, retryDelaysMs[Math.min(attempt, retryDelaysMs.length) - 1] ?? 4000));
    signal?.throwIfAborted?.();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
    });
    const json = await res.json().catch(() => ({}));
    last = { ok: res.ok, status: res.status, body: json, attempts: attempt + 1 };
    if (res.ok) return last;
    const message = String(json?.error?.message || '');
    const transient = res.status === 503 || (res.status === 400 && /safety violations/i.test(message));
    if (!transient) return last;
  }
  return last;
}

/** One Computer Use request with the synthetic check screenshot. */
export async function checkComputerUse(apiKey, model, environment = 'browser', { timeoutMs = 60000 } = {}) {
  const started = Date.now();
  try {
    const res = await postInteraction(apiKey, {
      model,
      input: [
        { type: 'text', text: 'Connection test. Do not take any action; reply with the single word: ready.' },
        { type: 'image', data: fs.readFileSync(CHECK_IMAGE).toString('base64'), mime_type: 'image/png' },
      ],
      tools: [{ type: 'computer_use', environment }],
    }, { timeoutMs });
    if (!res.ok) return { ok: false, httpStatus: res.status, attempts: res.attempts, error: res.body?.error?.message || `HTTP ${res.status}`, ms: Date.now() - started };
    return { ok: true, attempts: res.attempts, ms: Date.now() - started };
  } catch (error) {
    return { ok: false, error: error.name === 'TimeoutError' ? `No answer within ${Math.round(timeoutMs / 1000)} s` : error.message, ms: Date.now() - started };
  }
}

/** Full check used by the Settings "Check connection" button. */
export async function checkGeminiScreenShare({ apiKey, config }) {
  const settings = normalizeScreenShareConfig(config || {}, {});
  const result = { ok: false, checkedAt: new Date().toISOString(), models: { live: [], computerUse: [] }, live: null, computerUse: null };
  try {
    result.models = await listScreenShareModels(apiKey);
  } catch (error) {
    result.error = `Could not list models with this key: ${error.message}`;
    return result;
  }
  const [live, computerUse] = await Promise.all([
    checkLiveSetup(apiKey, settings.liveModel),
    checkComputerUse(apiKey, settings.computerUseModel, settings.computerUseEnvironment),
  ]);
  result.live = { model: settings.liveModel, ...live };
  result.computerUse = { model: settings.computerUseModel, environment: settings.computerUseEnvironment, ...computerUse };
  // Seeing the screen needs Live; Computer Use only sharpens clicking.
  result.ok = live.ok;
  return result;
}
