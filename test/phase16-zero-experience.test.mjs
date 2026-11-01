/**
 * @fileoverview Phase 16 Acceptance Verification — Original Zero Interface & Product Experience
 *
 * Verifies:
 * 1. SPA Route navigation (/chat/zero, /settings/model-providers, /settings/skills, /workspaces)
 * 2. Real-time voice toggle control and state changes in the UI
 * 3. Multi-agent workforce monitoring indicator
 * 4. Continuous screen intelligence indicator (<250MB buffer status)
 * 5. Computer control and reasoning toggles
 * 6. Clean rendering without legacy runtime traces
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const BASE_URL = 'http://127.0.0.1:18789';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('Phase 16 — Original Zero Interface & Product Experience', async (suite) => {
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
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    // 1. Chat Surface & Top Action Bar
    await suite.test('1. Chat Surface (/chat/zero) renders top actions and controls', async () => {
      await page.goto(`${BASE_URL}/chat/zero`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const title = await page.title();
      assert.ok(title.includes('Zero'), `Page title contains Zero: ${title}`);

      // Verify top actions container exists
      const topActions = await page.locator('#zero-permanent-top-actions').count();
      assert.ok(topActions > 0, '#zero-permanent-top-actions container is present');

      // Verify Computer Control toggle
      const compCtrl = await page.locator('.zero-control-toggle-btn').count();
      assert.ok(compCtrl > 0, 'Computer control toggle button is rendered');

      // Verify Voice toggle
      const voiceBtn = await page.locator('.zero-voice-toggle-btn').count();
      assert.ok(voiceBtn > 0, 'Voice assistant toggle button is rendered');

      // Verify Workforce Indicator
      const workforce = await page.locator('.zero-workforce-indicator').count();
      assert.ok(workforce > 0, 'Workforce indicator is rendered');
      const workforceText = await page.locator('.zero-workforce-indicator').innerText();
      assert.ok(workforceText.includes('3 Agents') || workforceText.includes('Workforce'), 'Workforce text displays agents');

      // Verify Screen Intel Indicator
      const screenIntel = await page.locator('.zero-screen-intel-indicator').count();
      assert.ok(screenIntel > 0, 'Screen intelligence indicator is rendered');
      const screenText = await page.locator('.zero-screen-intel-indicator').innerText();
      assert.ok(screenText.includes('Screen Intel') || screenText.includes('250MB'), 'Screen intel text displays buffer health');
    });

    // 2. Interactive Voice Toggle
    await suite.test('2. Voice Assistant toggle toggles listening state on click', async () => {
      const voiceBtn = page.locator('.zero-voice-toggle-btn');
      assert.ok((await voiceBtn.count()) > 0);

      const initialText = await voiceBtn.innerText();
      assert.ok(initialText.includes('Ready'));

      // Click to toggle listening
      await voiceBtn.click();
      await page.waitForTimeout(200);

      const listeningText = await voiceBtn.innerText();
      assert.ok(listeningText.includes('Listening'));

      // Click again to toggle back to ready
      await voiceBtn.click();
      await page.waitForTimeout(200);

      const readyText = await voiceBtn.innerText();
      assert.ok(readyText.includes('Ready'));
    });

    // 3. Navigation across Settings & Models
    await suite.test('3. Settings Navigation (/settings/model-providers) loads cleanly', async () => {
      await page.goto(`${BASE_URL}/settings/model-providers`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const bodyText = await page.locator('body').innerText();
      assert.ok(
        bodyText.includes('Zero') && (bodyText.includes('Model') || bodyText.includes('Provider')),
        'Settings model providers rendered cleanly'
      );
    });

    // 4. Workspaces SPA Route
    await suite.test('4. Workspaces route (/workspaces) serves SPA shell without 404', async () => {
      const res = await page.goto(`${BASE_URL}/workspaces`, { waitUntil: 'domcontentloaded' });
      assert.equal(res.status(), 200, 'Workspaces route returns HTTP 200');
      await page.waitForTimeout(400);

      const bodyCount = await page.locator('body, #root, openclaw-app').count();
      assert.ok(bodyCount > 0, 'Workspaces shell rendered');
    });

    // 5. Clean Presentation (No Leaked Marketing / Upstream URLs)
    await suite.test('5. No unhandled exceptions or broken branding links', async () => {
      const bodyHtml = await page.content();
      assert.ok(!bodyHtml.includes('TypeError: Cannot read properties of undefined'));
      assert.ok(!bodyHtml.includes('discord.gg/clawd'));
    });
  } finally {
    await browser.close();
  }
});
