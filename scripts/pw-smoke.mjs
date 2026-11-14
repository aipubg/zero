import pw from '../backend/node_modules/playwright-core/index.js';

const paths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

for (const executablePath of paths) {
  let browser;
  try {
    console.log('launch', executablePath);
    browser = await pw.chromium.launch({
      executablePath,
      headless: true,
      timeout: 20000,
      args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu'],
    });
    console.log('launched');
    const page = await browser.newPage();
    console.log('page');
    await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('goto', page.url(), await page.title());
    await browser.close();
    console.log('closed');
    break;
  } catch (error) {
    console.error('FAIL', error.message);
    try { await browser?.close(); } catch {}
  }
}
