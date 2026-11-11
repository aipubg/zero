import { chromium } from '../backend/node_modules/playwright-core/index.mjs';

async function testBrowserChatUI() {
  console.log('Launching browser to test Chat Section UI...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('Page loaded. URL:', page.url(), 'Title:', await page.title());

  const composer = await page.waitForSelector('textarea[placeholder*="Message Zero"]', { timeout: 10000 });
  console.log('Found composer:', Boolean(composer));

  await composer.fill('Run core system diagnostic');
  await page.keyboard.press('Enter');
  console.log('Submitted command in Chat Section!');

  // Wait for streaming completion
  await page.waitForTimeout(7000);

  const textContent = await page.evaluate(() => document.body.innerText);
  const foundReport = textContent.includes('Project Zero Unified Core Diagnostic Report') || textContent.includes('Unified Core');
  console.log('Report present in DOM:', foundReport ? 'YES!' : 'NO');
  console.log('Chat body snippet:\n', textContent.slice(0, 1000));

  await page.screenshot({ path: 'E:/zero/chat-section-diagnostic-verified.png', fullPage: true });
  console.log('Saved screenshot to E:/zero/chat-section-diagnostic-verified.png');

  await browser.close();
}

testBrowserChatUI().catch(err => {
  console.error('Playwright UI test failed:', err);
  process.exit(1);
});
