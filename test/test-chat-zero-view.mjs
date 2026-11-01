import { chromium } from '../backend/node_modules/playwright-core/index.mjs';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[BROWSER ${msg.type()}]`, msg.text()));
  page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));
  page.on('framenavigated', frame => console.log('[NAVIGATED]', frame.url()));
  page.on('request', req => {
    if (req.isNavigationRequest()) {
      console.log('[NAV_REQ]', req.url(), req.headers());
    }
  });

  await page.addInitScript(() => {
    const origReload = window.location.reload;
    window.location.reload = function() {
      console.error('RELOAD_CALLED_FROM:', new Error().stack);
    };
    const origReplace = window.location.replace;
    window.location.replace = function(url) {
      console.error('REPLACE_CALLED_FROM:', url, new Error().stack);
    };
  });

  console.log('Navigating to http://127.0.0.1:18789/chat/zero...');
  await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'load', timeout: 30000 });
  
  // Wait for any client-side redirects to finish
  await page.waitForTimeout(6000);

  const title = await page.title();
  const innerText = await page.evaluate(() => document.body.innerText);
  console.log('Chat Zero Title:', title);
  console.log('Chat Zero text (first 600 chars):', innerText.slice(0, 600));

  await page.screenshot({ path: 'native-chat-zero-screenshot.png', fullPage: true });
  console.log('Chat Zero screenshot saved.');

  await browser.close();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
