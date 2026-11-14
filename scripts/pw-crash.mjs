import pw from '../backend/node_modules/playwright-core/index.js';

const browser = await pw.chromium.launch({
  executablePath: process.env.BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: process.env.HEADLESS !== '0',
  timeout: 20000,
  args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
if (process.env.DISABLE_SWEEP === '1') {
  await page.addInitScript(() => { window.__zero_disable_legacy_sweep = true; });
}
page.on('crash', () => console.log('CRASH'));
page.on('websocket', socket => {
  console.log('WS_OPEN', socket.url());
  socket.on('framereceived', event => console.log('WS_RECV', String(event.payload).length, String(event.payload).slice(0, 220)));
  socket.on('framesent', event => console.log('WS_SENT', String(event.payload).length));
});
page.on('response', response => {
  const length = response.headers()['content-length'];
  if (length && Number(length) > 500000) console.log('BIG_RESPONSE', length, response.url());
});
page.on('pageerror', error => console.log('PAGEERROR', String(error.message).slice(0, 300)));
page.on('console', message => {
  if (message.type() === 'error' || message.type() === 'warning') {
    console.log('CONSOLE', message.type(), message.text().slice(0, 300));
  }
});
try {
  await page.goto(process.env.TARGET_URL || 'http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 20000 });
  for (let index = 0; index < 8; index++) {
    await page.waitForTimeout(1000);
    try {
      const stats = await page.evaluate(() => ({
        nodes: document.querySelectorAll('*').length,
        body: document.body.children.length,
        shell: Boolean(document.querySelector('.zero-shell-header')),
        nav: document.querySelectorAll('.zero-shell-nav-link').length,
        legacySearch: document.querySelectorAll('button.topbar-search, button.sidebar-brand__search').length,
        newThread: document.querySelectorAll('a.sidebar-brand__new-thread, a.sidebar-new-session').length,
      }));
      console.log(index, JSON.stringify(stats));
    } catch (error) {
      console.log('EVAL_FAIL', index, error.message);
      break;
    }
  }
} finally {
  await browser.close().catch(() => {});
}
