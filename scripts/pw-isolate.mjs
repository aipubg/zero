import pw from '../backend/node_modules/playwright-core/index.js';

const browser = await pw.chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  timeout: 20000,
  args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu'],
});

async function run(label, blockPlugin) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('crash', () => console.log(label, 'CRASH'));
  page.on('pageerror', error => console.log(label, 'PAGEERROR', String(error.message).slice(0, 200)));
  if (blockPlugin) {
    await page.route('**/zero-control-ui.js', route => route.abort());
    await page.route('**/plugins/control-ui/**', route => route.abort());
  }
  try {
    await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(5000);
    const stats = await page.evaluate(() => ({
      nodes: document.querySelectorAll('*').length,
      shell: Boolean(document.querySelector('.zero-shell-header')),
      app: Boolean(document.querySelector('openclaw-app-shell')),
    }));
    console.log(label, 'OK', JSON.stringify(stats));
  } catch (error) {
    console.log(label, 'FAIL', error.message);
  } finally {
    await context.close().catch(() => {});
  }
}

await run('BASE', true);
await run('PLUGIN', false);
await browser.close().catch(() => {});
