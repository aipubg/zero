/**
 * Zero — Guaranteed Native Chat Composer Dock.
 *
 * A watchdog that guarantees a usable chat surface exists on every chat or
 * workspace route (/, /chat/*, /Command, /dashboard/*).
 *
 * The vendor Control UI owns the primary chat experience, but it can fail to
 * mount or collapse when a browser carries stale state from an older build
 * (a session pointer to a deleted machine id, a corrupted layout key, or a
 * device token for scopes that no longer exist). When that happens the main
 * pane is an empty void with no way to type.
 *
 * This module never replaces a working composer. It only checks, on a short
 * interval, whether a visible and interactive composer is present; when one
 * is missing it mounts a first-party dock — transcript plus a bottom
 * "Message Zero" composer — inside the main pane and binds it straight to
 * chat.send / sessions.history.
 */

const CHAT_ROUTES = [
  /^\/$/,
  /^\/chat(\/|$)/,
  /^\/command(\/|$)/i,
  /^\/new(\/|$)/,
  /^\/dashboard(\/|$)/,
  /^\/dashboards(\/|$)/,
];

const COMPOSER_SELECTOR = [
  'textarea[aria-label="Chat composer"]',
  'textarea[placeholder*="Message Zero"]',
  'textarea[aria-label="What should this session work on?"]',
  'textarea[placeholder*="What should this session work on?"]',
].join(', ');
const CHECK_INTERVAL_MS = 250;

function isChatRoute(pathname) {
  return CHAT_ROUTES.some((pattern) => pattern.test(pathname || '/'));
}

/** A composer only counts when it is on screen, sized, and not transparent. */
function composerIsUsable(textarea) {
  if (!textarea || !textarea.isConnected) return false;
  // A hidden or zero-sized tab reports no layout at all; that says nothing
  // about the composer, so do not mount a second one because of it.
  if (document.hidden || window.innerHeight === 0) return true;
  const rect = textarea.getBoundingClientRect();
  if (rect.width < 120 || rect.height < 12) return false;
  // A composer further down a scrollable page (the /new page in a short
  // window) is still usable. Only one stranded far outside the page counts
  // as missing: above the viewport, or more than three screens below it.
  if (rect.bottom <= 0 || rect.top >= window.innerHeight * 3) return false;
  const style = window.getComputedStyle(textarea);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (Number(style.opacity) === 0) return false;
  return true;
}

/** Find the pane that should host the native dock. */
function resolveMainPane() {
  const selectors = [
    '.chat-main',
    '#chat-panel-main',
    '[id*="chat-panel"]',
    '.content--chat',
    'main.content',
    'main',
    '.shell--chat',
    '.zero-router-outlet',
  ];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width < 320 || rect.height < 220) continue;
    return element;
  }
  const outlet = document.querySelector('.zero-router-outlet');
  return outlet || document.body;
}

function createDock(host) {
  const dock = document.createElement('section');
  dock.className = 'zero-chat-dock';
  dock.setAttribute('aria-label', 'Zero chat');

  const thread = document.createElement('div');
  thread.className = 'zero-chat-dock__thread';
  thread.setAttribute('role', 'log');
  thread.setAttribute('aria-live', 'polite');

  const composer = document.createElement('form');
  composer.className = 'zero-chat-dock__composer';

  const input = document.createElement('textarea');
  input.className = 'zero-chat-dock__input';
  input.setAttribute('aria-label', 'Chat composer');
  input.setAttribute('placeholder', 'Message Zero…');
  input.rows = 1;
  input.setAttribute('data-zero-dock-composer', 'true');

  const actions = document.createElement('div');
  actions.className = 'zero-chat-dock__actions';

  const modelPicker = document.createElement('select');
  modelPicker.className = 'zero-chat-dock__model';
  modelPicker.setAttribute('aria-label', 'Model');
  const autoOption = document.createElement('option');
  autoOption.value = '';
  autoOption.textContent = 'Auto model';
  modelPicker.appendChild(autoOption);

  const permissionButton = document.createElement('button');
  permissionButton.type = 'button';
  permissionButton.className = 'zero-chat-dock__permission';
  permissionButton.title = 'Permissions';
  permissionButton.setAttribute('aria-label', 'Permissions');
  permissionButton.textContent = '⛨';

  const micButton = document.createElement('button');
  micButton.type = 'button';
  micButton.className = 'zero-chat-dock__mic';
  micButton.title = 'Voice input';
  micButton.setAttribute('aria-label', 'Voice input');
  micButton.textContent = '●';

  const sendButton = document.createElement('button');
  sendButton.type = 'submit';
  sendButton.className = 'zero-chat-dock__send';
  sendButton.setAttribute('aria-label', 'Send');
  sendButton.title = 'Send';
  sendButton.textContent = '↑';

  actions.append(modelPicker, permissionButton, micButton, sendButton);
  composer.append(input, actions);
  dock.append(thread, composer);

  let sending = false;

  const appendBubble = (role, text) => {
    const bubble = document.createElement('div');
    bubble.className = `zero-chat-dock__bubble zero-chat-dock__bubble--${role}`;
    bubble.textContent = text;
    thread.appendChild(bubble);
    thread.scrollTop = thread.scrollHeight;
    return bubble;
  };

  const sessionKey = () => {
    const key = host?.sessions?.selectedKey;
    return typeof key === 'string' && key.trim() ? key.trim() : 'agent:zero:main';
  };

  const loadTranscript = async () => {
    try {
      const response = await host.request('sessions.get', { key: sessionKey() });
      const result = response?.result ?? response;
      const entries = Array.isArray(result?.transcript)
        ? result.transcript
        : (Array.isArray(result?.transcript?.entries) ? result.transcript.entries : []);
      if (!entries.length) return;
      thread.replaceChildren();
      for (const entry of entries.slice(-40)) {
        const role = entry?.role === 'assistant' || entry?.role === 'tool' ? 'assistant' : 'user';
        const text = String(entry?.content ?? entry?.text ?? entry?.message ?? '').trim();
        if (text) appendBubble(role, text);
      }
    } catch {
      // A transcript that cannot be read must never block the composer.
    }
  };

  const submit = async (event) => {
    event?.preventDefault?.();
    if (sending) return;
    const text = input.value.trim();
    if (!text) return;
    sending = true;
    sendButton.disabled = true;
    appendBubble('user', text);
    input.value = '';
    try {
      const response = await host.request('chat.send', { sessionKey: sessionKey(), message: text });
      const result = response?.result ?? response;
      const reply = String(result?.content ?? result?.text ?? result?.message ?? '').trim();
      if (reply) appendBubble('assistant', reply);
    } catch (error) {
      appendBubble('assistant', `Request failed: ${error.message}`);
    } finally {
      sending = false;
      sendButton.disabled = false;
      input.focus();
    }
  };

  composer.addEventListener('submit', submit);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit(event);
    }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(160, input.scrollHeight)}px`;
  });
  micButton.addEventListener('click', () => {
    document.querySelector('.zero-voice-control')?.click?.();
  });
  permissionButton.addEventListener('click', () => {
    document.querySelector('.zero-chat-control-pill')?.click?.();
  });
  modelPicker.addEventListener('change', () => {
    const value = modelPicker.value;
    if (!value) return;
    host.request('sessions.patch', { key: sessionKey(), model: value, metadata: { model: value } }).catch(() => {});
  });

  void loadTranscript();

  return {
    element: dock,
    dispose() {
      composer.removeEventListener('submit', submit);
      dock.remove();
    },
    refresh: loadTranscript,
  };
}

/**
 * Install the composer watchdog.
 *
 * @param {object} host gateway host
 * @returns {function} disposer
 */
export function installGuaranteedChatComposer(host) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.body) {
    return () => {};
  }

  let disposed = false;
  let dock = null;
  let timer = null;

  const existingComposer = () => {
    const candidates = document.querySelectorAll(COMPOSER_SELECTOR);
    for (const candidate of candidates) {
      if (composerIsUsable(candidate)) return candidate;
    }
    return null;
  };

  const teardown = () => {
    if (!dock) return;
    try { dock.dispose(); } catch {}
    dock = null;
  };

  const tick = () => {
    if (disposed) return;
    timer = window.setTimeout(tick, CHECK_INTERVAL_MS);
    try {
      if (!isChatRoute(window.location.pathname)) {
        teardown();
        return;
      }
      if (existingComposer()) {
        // The real composer is present; the native dock must not shadow it.
        teardown();
        return;
      }
      if (dock?.element?.isConnected) {
        // Keep the native dock anchored to the current pane.
        const pane = resolveMainPane();
        if (pane && dock.element.parentElement !== pane) pane.appendChild(dock.element);
        return;
      }
      const pane = resolveMainPane();
      if (!pane) return;
      dock = createDock(host);
      pane.appendChild(dock.element);
    } catch {
      // The watchdog never throws into the host.
    }
  };

  tick();
  return () => {
    disposed = true;
    if (timer) { window.clearTimeout(timer); timer = null; }
    teardown();
  };
}
