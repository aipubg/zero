import pw from '../backend/node_modules/playwright-core/index.js';
const { chromium } = pw;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

const info = await page.evaluate(() => {
  const d = el => ({
    tag: el.tagName.toLowerCase(),
    cls: String(el.className || ''),
    label: el.getAttribute('aria-label') || '',
    title: el.getAttribute('title') || '',
    text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    href: el.getAttribute('href') || '',
    html: el.outerHTML.slice(0, 300),
  });
  const brandActions = [...document.querySelectorAll('.sidebar-brand__actions > *, .sidebar-brand > *')].map(d);
  const topnav = [...document.querySelectorAll('.topnav-shell > *, .topnav-shell button')].map(d).slice(0, 20);
  const newish = [...document.querySelectorAll('button, a')].filter(el => /new|create|\+/i.test((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.textContent || ''))).map(d).slice(0, 30);
  return { brandActions, topnav, newish };
});
console.log(JSON.stringify(info, null, 2));

// Open legacy palette via topbar search and inspect modal
await page.click('button.topbar-search').catch(e => console.log('click topbar-search failed', e.message));
await page.waitForTimeout(1200);
const modal = await page.evaluate(() => {
  const dialogs = [...document.querySelectorAll('dialog, [role="dialog"], wa-dialog, .modal, .overlay, openclaw-command-palette')].map(el => ({
    tag: el.tagName.toLowerCase(), cls: String(el.className || ''), open: el.open ?? null,
    text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
    html: el.outerHTML.slice(0, 500),
  }));
  return dialogs;
});
console.log('MODALS', JSON.stringify(modal, null, 2));
await browser.close();
