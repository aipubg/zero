/** Maintains the native loopback HttpOnly cookie without storing bearer tokens. */
export function installDesktopSessionKeepAlive() {
  if (typeof window === 'undefined' || !['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname)) return () => {};
  window.__zero_session_dispose?.();
  let disposed = false, timer, active, failures = 0;
  const schedule = milliseconds => {
    clearTimeout(timer);
    if (!disposed) timer = setTimeout(check, milliseconds);
  };
  const check = async () => {
    if (disposed || active) return;
    clearTimeout(timer);
    const controller = new AbortController(); active = controller;
    const deadline = setTimeout(() => controller.abort(), 5000);
    const request = (url, options = {}) => fetch(url, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal, ...options });
    try {
      let response = await request('/api/auth/session');
      let result = await response.json();
      if (disposed) return;
      if (result.renewalSupported !== true) return; // Not the native host; no mutation.
      if (response.status === 401) {
        if (result.bootstrapAllowed !== true) return;
        response = await request('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: 'zero-desktop-browser' }) });
        result = await response.json();
      }
      if (!response.ok || result.ok !== true || !Number.isFinite(result.session?.expiresAt) || !Number.isFinite(result.session?.maxAgeMs)) throw new Error('Native desktop session unavailable');
      const threshold = Math.min(300000, result.session.maxAgeMs / 4);
      if (result.session.expiresAt - Date.now() <= threshold) {
        response = await request('/api/auth/session/renew', { method: 'POST' });
        result = await response.json();
        if (!response.ok || result.ok !== true || !Number.isFinite(result.session?.expiresAt)) throw new Error('Native desktop renewal unavailable');
      }
      failures = 0;
      schedule(Math.max(250, Math.min(60000, result.session.expiresAt - Date.now() - threshold)));
    } catch {
      if (!disposed) schedule(Math.min(60000, 1000 * 2 ** Math.min(++failures, 6)));
    } finally { clearTimeout(deadline); if (active === controller) active = null; }
  };
  const wake = () => { if (!document.hidden && !disposed) void check(); };
  window.addEventListener('focus', wake);
  window.addEventListener('online', wake);
  window.addEventListener('pageshow', wake);
  document.addEventListener('visibilitychange', wake);
  const dispose = () => {
    disposed = true; clearTimeout(timer); active?.abort();
    window.removeEventListener('focus', wake); window.removeEventListener('online', wake); window.removeEventListener('pageshow', wake);
    document.removeEventListener('visibilitychange', wake);
    if (window.__zero_session_dispose === dispose) delete window.__zero_session_dispose;
  };
  window.__zero_session_dispose = dispose;
  void check();
  return dispose;
}
