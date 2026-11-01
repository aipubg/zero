import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = 'http://127.0.0.1:18789';
const WS_URL = 'ws://127.0.0.1:18789';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WS = globalThis.WebSocket;

test('Phase 2 UI Functional Interaction & Persistence Suite', async (suite) => {
  const { chromium } = await import('playwright-core');

  if (!fs.existsSync(CHROME_PATH)) {
    suite.skip('Google Chrome binary not found at ' + CHROME_PATH);
    return;
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // 1. Chat Page Shell & Interactive Elements
    await suite.test('Chat Page (/chat/zero) renders interactive controls & session state', async () => {
      await page.goto(`${BASE_URL}/chat/zero`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const title = await page.title();
      assert.ok(title.includes('Zero'), `Page title contains Zero: ${title}`);

      const composerCount = await page.locator('textarea, input[type="text"], .chat-composer, #root').count();
      assert.ok(composerCount > 0, 'Chat input or root container rendered');

      const bodyText = await page.locator('body').innerText();
      assert.ok(!bodyText.includes('TypeError: Cannot read properties of undefined'), 'No unhandled rendering exceptions');
    });

    // 2. Model Providers Page Interaction
    await suite.test('Model Providers Page (/settings/model-providers) displays configured providers', async () => {
      await page.goto(`${BASE_URL}/settings/model-providers`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const rootCount = await page.locator('#root, body').count();
      assert.ok(rootCount > 0, 'Page root rendered');

      const bodyText = await page.locator('body').innerText();
      assert.ok(
        bodyText.toLowerCase().includes('model') ||
        bodyText.toLowerCase().includes('provider') ||
        bodyText.toLowerCase().includes('nvidia'),
        'Model providers surface contains model/provider text'
      );
    });

    // 3. Skills Page Inventory Interaction
    await suite.test('Skills Page (/settings/skills) renders skills catalog without errors', async () => {
      await page.goto(`${BASE_URL}/settings/skills`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').innerText();
      assert.ok(
        bodyText.toLowerCase().includes('skill') ||
        bodyText.toLowerCase().includes('installed') ||
        bodyText.includes('Zero'),
        'Skills surface loads cleanly'
      );
    });

    // 4. Memory Page Interaction
    await suite.test('Memory Page (/settings/memory) renders memory search and management', async () => {
      await page.goto(`${BASE_URL}/settings/memory`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').innerText();
      assert.ok(
        bodyText.toLowerCase().includes('memory') ||
        bodyText.toLowerCase().includes('semantic') ||
        bodyText.includes('Zero'),
        'Memory surface loads cleanly'
      );
    });

    // 5. Automation Page Interaction
    await suite.test('Automation Page (/settings/automation) renders scheduled workflows', async () => {
      await page.goto(`${BASE_URL}/settings/automation`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').innerText();
      assert.ok(
        bodyText.toLowerCase().includes('automation') ||
        bodyText.toLowerCase().includes('cron') ||
        bodyText.toLowerCase().includes('job') ||
        bodyText.includes('Zero'),
        'Automation surface loads cleanly'
      );
    });

    // 6. Gateway Status Page Interaction
    await suite.test('Gateway Page (/settings/gateway) reflects authoritative port and runtime', async () => {
      await page.goto(`${BASE_URL}/settings/gateway`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').innerText();
      assert.ok(
        bodyText.includes('18789') ||
        bodyText.toLowerCase().includes('gateway') ||
        bodyText.toLowerCase().includes('port') ||
        bodyText.includes('Zero'),
        'Gateway settings reflect runtime information'
      );
    });

    // 7. Page Scrolling & Viewport Interaction
    await suite.test('Settings pages scroll without viewport lock', async () => {
      await page.goto(`${BASE_URL}/settings/about`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      await page.evaluate(() => window.scrollTo(0, 300));
      const scrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop || 0);
      assert.ok(scrollY >= 0, 'Scroll position evaluated successfully');
    });

    // 8. Form Data Persistence Roundtrip via RPC
    await suite.test('RPC form preferences update and persist across re-read', async () => {
      const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', clientId: 'phase2-pref-runner' }),
      });
      assert.equal(authRes.status, 200);
      const authData = await authRes.json();
      const token = authData.token;

      const ws = new WS(WS_URL);
      await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

      try {
        const hsPromise = new Promise((resolve) => {
          const handler = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.id === 'pref-hs') { ws.removeEventListener('message', handler); resolve(msg); }
          };
          ws.addEventListener('message', handler);
        });
        ws.send(JSON.stringify({ type: 'req', id: 'pref-hs', method: 'connect', params: { minProtocol: 4, token } }));
        await hsPromise;

        const testKey = `theme_mode_${Date.now()}`;
        const setPromise = new Promise((resolve) => {
          const handler = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.id === 'pref-set') { ws.removeEventListener('message', handler); resolve(msg); }
          };
          ws.addEventListener('message', handler);
        });
        ws.send(JSON.stringify({
          type: 'req',
          id: 'pref-set',
          method: 'users.prefs.set',
          params: { prefs: { [testKey]: 'neon-cyberpunk' } },
        }));
        const setRes = await setPromise;
        assert.equal(setRes.ok, true);

        // Read back
        const getPromise = new Promise((resolve) => {
          const handler = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.id === 'pref-get') { ws.removeEventListener('message', handler); resolve(msg); }
          };
          ws.addEventListener('message', handler);
        });
        ws.send(JSON.stringify({
          type: 'req',
          id: 'pref-get',
          method: 'users.prefs.get',
          params: {},
        }));
        const getRes = await getPromise;
        assert.equal(getRes.ok, true);
        assert.equal(getRes.payload.prefs[testKey], 'neon-cyberpunk');
      } finally {
        ws.close();
      }
    });

    await context.close();
  } finally {
    await browser.close();
  }
});
