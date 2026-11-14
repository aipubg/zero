import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE_URL = 'http://127.0.0.1:18789';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROME_PATH,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(`${BASE_URL}/chat/zero`, { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(4000);

const info = await page.evaluate(() => {
  const vis = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) } : null;
  };
  // Anything that looks like the brand / command palette.
  const brand = [];
  const jump = [];
  for (const el of document.querySelectorAll('a, button, [class*="brand"], [class*="jump"], [class*="palette"], [aria-label*="command" i], [aria-label*="search zero" i]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const label = `${el.getAttribute('aria-label') || ''} ${el.textContent || ''}`.trim().replace(/\s+/g, ' ').slice(0, 44);
    const cls = (el.className || '').toString().slice(0, 60);
    const entry = { tag: el.tagName.toLowerCase(), cls, label, rect: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) } };
    if (/brand|logo|Zero|Intelligence/i.test(cls + ' ' + label)) brand.push(entry);
    if (/jump|palette|command|Go anywhere|Ctrl K/i.test(cls + ' ' + label)) jump.push(entry);
  }
  return { brand: brand.slice(0, 8), jump: jump.slice(0, 8) };
});

console.log('=== brand candidates ===');
console.log(JSON.stringify(info.brand, null, 2));
console.log('\n=== command palette candidates ===');
console.log(JSON.stringify(info.jump, null, 2));

await browser.close();
