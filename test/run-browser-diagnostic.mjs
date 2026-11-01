import { chromium } from '../backend/node_modules/playwright-core/index.mjs';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[BROWSER ${msg.type()}]`, msg.text()));
  page.on('pageerror', err => console.error('[PAGE ERROR]', err.message, '\n', err.stack));
  page.on('websocket', ws => {
    console.log('[BROWSER WS OPENED]', ws.url());
    ws.on('framesent', f => console.log('[BROWSER WS SENT]', f.payload.slice(0, 150)));
    ws.on('framereceived', f => console.log('[BROWSER WS RECV]', f.payload.slice(0, 150)));
    ws.on('close', () => console.log('[BROWSER WS CLOSED]'));
  });

  console.log('Navigating to http://127.0.0.1:18789/chat/zero...');
  await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(4000);

  const info = await page.evaluate(() => {
    const app = document.querySelector('openclaw-app');
    if (!app) return { error: 'No openclaw-app' };
    const sr = app.shadowRoot;
    return {
      hasShadow: !!sr,
      appHTML: app.innerHTML.slice(0, 500),
      shadowHTML: sr ? sr.innerHTML.slice(0, 1000) : null,
      children: Array.from(app.children).map(c => c.tagName),
      shadowChildren: sr ? Array.from(sr.children).map(c => c.tagName + '.' + c.className) : [],
      innerText: document.body.innerText.slice(0, 500),
      clientRect: app.getBoundingClientRect(),
    };
  });
  console.log('App info:', JSON.stringify(info, null, 2));

  console.log('Navigating to http://127.0.0.1:18789/settings/model-providers...');
  const page2 = await browser.newPage();
  page2.on('console', msg => console.log(`[P2 BROWSER ${msg.type()}]`, msg.text()));
  page2.on('pageerror', err => console.error('[P2 PAGE ERROR]', err.message));
  await page2.goto('http://127.0.0.1:18789/settings/model-providers', { waitUntil: 'load', timeout: 30000 });
  await page2.waitForTimeout(4000);

  const info2 = await page2.evaluate(() => {
    return {
      title: document.title,
      innerText: document.body.innerText.slice(0, 500),
      topTags: Array.from(document.body.children).map(c => c.tagName)
    };
  });
  console.log('Settings info:', JSON.stringify(info2, null, 2));
  await page2.screenshot({ path: 'native-settings-providers-screenshot.png', fullPage: true });

  await browser.close();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
