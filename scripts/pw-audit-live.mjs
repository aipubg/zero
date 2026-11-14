import { chromium } from '../backend/node_modules/playwright-core/index.mjs';

const BASE = 'http://127.0.0.1:18789';
const routes = [
  '/chat/zero', '/agents', '/dashboards', '/systems', '/automations', '/plugins', '/usage',
  '/settings/model-providers', '/settings/profile', '/settings/gateway', '/settings/devices',
  '/settings/approvals', '/settings/secrets', '/settings/agents', '/settings/about', '/apps',
];
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const logs = [];
page.on('console', m => { if (m.type() === 'error') logs.push(`[console] ${m.text()}`); });
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', r => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

for (const route of routes) {
  logs.length = 0;
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(route.startsWith('/settings') ? 4500 : 3500);
    const text = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    const bad = ['Couldn\'t finish this reply','Computer control state unknown','invalid inventory page','cannot be read','Cannot read properties','Last ping failed','Activity refresh failed','unavailable','not available','failed','Failed','error','Error','missing'].filter(w => text.includes(w));
    console.log(`\n=== ${route} ===`);
    console.log('TITLE:', await page.title().catch(() => '?'));
    console.log('TEXT:', text.slice(0, 500));
    if (bad.length) console.log('FLAGS:', [...new Set(bad)].join(' | '));
    if (logs.length) console.log('LOGS:\n' + [...new Set(logs)].slice(0, 12).join('\n'));
  } catch (e) {
    console.log(`\n=== ${route} ===\nNAV ERROR: ${e.message}`);
  }
}
await browser.close();
