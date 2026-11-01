import { chromium } from '../backend/node_modules/playwright-core/index.mjs';

async function testBrowser() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  const consoleLogs = [];
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => {
    console.log('PAGE_ERROR_MESSAGE:', err.message);
    console.log('PAGE_ERROR_STACK:', err.stack);
  });
  page.on('response', resp => {
    if (!resp.ok()) console.log('FAILED_REQ:', resp.status(), resp.url());
  });

  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.head) {
        const origAppend = document.head.appendChild;
        document.head.appendChild = function(node) {
          try {
            return origAppend.call(this, node);
          } catch (e) {
            console.error('APPEND_FAILED:', e.message, 'node:', node.tagName, node.outerHTML);
            throw e;
          }
        };
      }
    });
  });

  console.log('Navigating to http://127.0.0.1:18789/chat/zero...');
  await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const title = await page.title();
  console.log('Page Title:', title);

  const url = page.url();
  console.log('Final URL:', url);

  await page.screenshot({ path: 'native-chat-zero-screenshot.png' });
  console.log('Screenshot saved to native-chat-zero-screenshot.png');

  const fallbackHidden = await page.$eval('#openclaw-mount-fallback', el => el.hidden).catch(() => null);
  console.log('Fallback hidden:', fallbackHidden);

  console.log('Navigating to http://127.0.0.1:18789/settings/model-providers...');
  await page.goto('http://127.0.0.1:18789/settings/model-providers', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  await page.screenshot({ path: 'native-settings-providers-screenshot.png' });
  console.log('Screenshot saved to native-settings-providers-screenshot.png');

  await browser.close();
  console.log('Console logs count:', consoleLogs.length);
  const errors = consoleLogs.filter(l => l.includes('PAGE_ERROR') || l.includes('Failed to load'));
  console.log('Errors:', errors);
}

testBrowser().catch(e => {
  console.error('Browser test failed:', e);
  process.exit(1);
});
