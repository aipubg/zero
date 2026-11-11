import http from 'node:http';
import https from 'node:https';

const DEFAULT_PINCHTAB_PORT = 9867;
const DEFAULT_PINCHTAB_HOST = '127.0.0.1';

/**
 * PinchTab Browser Automation Adapter
 * Communicates with PinchTab HTTP API on port 9867/9868.
 * Supports:
 * - Health & version check
 * - Page navigation
 * - Accessibility tree snapshot with stable element refs (e0, e1...)
 * - Actions: click, type, fill, press
 * - Content extraction / scraping
 * - Graceful fallback detection when offline
 */
export class PinchTabAdapter {
  constructor({
    host = process.env.PINCHTAB_HOST || DEFAULT_PINCHTAB_HOST,
    port = Number(process.env.PINCHTAB_PORT) || DEFAULT_PINCHTAB_PORT,
    token = process.env.PINCHTAB_TOKEN || null,
    timeoutMs = 5000,
  } = {}) {
    this.host = host;
    this.port = port;
    this.token = token;
    this.timeoutMs = timeoutMs;
    this.baseUrl = `http://${this.host}:${this.port}`;
    this._cachedHealth = null;
    this._lastHealthCheck = 0;
  }

  /**
   * Internal HTTP request helper with fast connection timeout
   */
  async _request(path, { method = 'GET', body = null, timeout = this.timeoutMs } = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const headers = {
        'Accept': 'application/json',
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      let payload = null;
      if (body) {
        payload = typeof body === 'string' ? body : JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(url, {
        method,
        headers,
        timeout,
      }, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { raw };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, data: parsed });
          } else {
            resolve({
              ok: false,
              status: res.statusCode,
              error: parsed?.error || parsed?.message || `HTTP ${res.statusCode}`,
              data: parsed,
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`PinchTab request to ${path} timed out after ${timeout}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  /**
   * Check PinchTab service availability
   */
  async checkHealth(force = false) {
    const now = Date.now();
    if (!force && this._cachedHealth && (now - this._lastHealthCheck < 2000)) {
      return this._cachedHealth;
    }
    try {
      const res = await this._request('/health', { timeout: 1000 });
      this._lastHealthCheck = now;
      this._cachedHealth = {
        available: res.ok,
        status: res.data?.status || (res.ok ? 'running' : 'unhealthy'),
        version: res.data?.version || '1.0',
        details: res.data,
      };
      return this._cachedHealth;
    } catch (err) {
      this._lastHealthCheck = now;
      this._cachedHealth = {
        available: false,
        status: 'offline',
        error: err.message,
      };
      return this._cachedHealth;
    }
  }

  /**
   * Navigate to a URL in the active tab
   */
  async navigate(url, { tabId = null, timeout = 15000 } = {}) {
    const endpoint = tabId ? `/tabs/${encodeURIComponent(tabId)}/navigate` : '/navigate';
    return await this._request(endpoint, {
      method: 'POST',
      body: { url },
      timeout,
    });
  }

  /**
   * Get structured accessibility/DOM snapshot
   */
  async getSnapshot({ filter = 'interactive', format = 'compact', tabId = null } = {}) {
    const endpoint = tabId
      ? `/tabs/${encodeURIComponent(tabId)}/snapshot?filter=${filter}&format=${format}`
      : `/snapshot?filter=${filter}&format=${format}`;
    return await this._request(endpoint);
  }

  /**
   * Perform an interaction action (click, type, fill, press) on an element reference
   */
  async performAction({ kind, ref, text = null, key = null, tabId = null } = {}) {
    const endpoint = tabId ? `/tabs/${encodeURIComponent(tabId)}/action` : '/action';
    return await this._request(endpoint, {
      method: 'POST',
      body: { kind, ref, text, key },
    });
  }

  /**
   * Extract page content / text
   */
  async getContent({ tabId = null } = {}) {
    const endpoint = tabId ? `/tabs/${encodeURIComponent(tabId)}/text` : '/text';
    try {
      const res = await this._request(endpoint);
      if (res.ok) return res;
    } catch {}
    // Fallback to snapshot
    return await this.getSnapshot({ tabId });
  }

  /**
   * Fill a structured web form using element references from snapshot
   */
  async fillForm(fields = {}, { submit = false, tabId = null } = {}) {
    const snapRes = await this.getSnapshot({ filter: 'interactive', tabId });
    if (!snapRes.ok || !snapRes.data) {
      return { ok: false, error: 'Failed to retrieve page snapshot for form filling' };
    }

    const elements = Array.isArray(snapRes.data.elements)
      ? snapRes.data.elements
      : (Array.isArray(snapRes.data) ? snapRes.data : []);

    const filled = [];
    const missing = [];

    for (const [key, value] of Object.entries(fields)) {
      const fieldLower = key.toLowerCase();
      // Match element by name, id, placeholder, aria-label, or label
      const matched = elements.find(el => {
        const name = (el.name || el.id || el.placeholder || el.label || el.ariaLabel || '').toLowerCase();
        return name.includes(fieldLower);
      });

      if (matched && matched.ref) {
        const actionRes = await this.performAction({
          kind: 'fill',
          ref: matched.ref,
          text: String(value ?? ''),
          tabId,
        });
        if (actionRes.ok) {
          filled.push({ field: key, ref: matched.ref, success: true });
        } else {
          missing.push({ field: key, reason: actionRes.error });
        }
      } else {
        missing.push({ field: key, reason: 'Element reference not found in accessibility tree' });
      }
    }

    if (submit) {
      // Find submit button or press Return
      const submitBtn = elements.find(el => {
        const text = (el.name || el.text || el.value || '').toLowerCase();
        return (el.kind === 'button' || el.role === 'button') && (text.includes('submit') || text.includes('log in') || text.includes('sign in') || text.includes('register'));
      });
      if (submitBtn && submitBtn.ref) {
        await this.performAction({ kind: 'click', ref: submitBtn.ref, tabId });
      } else {
        await this.performAction({ kind: 'press', key: 'Return', tabId });
      }
    }

    return {
      ok: filled.length > 0 && missing.length === 0,
      filled,
      missing,
      totalFields: Object.keys(fields).length,
      processed: filled.length,
    };
  }
}

export const defaultPinchTab = new PinchTabAdapter();
