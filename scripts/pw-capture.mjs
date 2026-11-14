import { chromium } from '../backend/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:18789';
const route = process.argv[2] || '/systems';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const frames = [];
const logs = [];
page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => logs.push(`[pageerror] ${e.stack || e.message}`));
page.on('websocket', ws => {
  ws.on('framesent', ev => { try { const s = typeof ev.payload === 'string' ? ev.payload : Buffer.from(ev.payload).toString(); if (frames.length < 4000) frames.push('>> ' + s); } catch {} });
  ws.on('framereceived', ev => { try { const s = typeof ev.payload === 'string' ? ev.payload : Buffer.from(ev.payload).toString(); if (frames.length < 4000) frames.push('<< ' + s); } catch {} });
});
await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
const text = await page.locator('body').innerText();
console.log('=== BODY ===\n' + text);
console.log('\n=== LOGS ===\n' + logs.join('\n'));
console.log('\n=== WS ===');
const interesting = frames.filter(f => /systems|automations|cron|usage|profile|dashboard|plugin|agent|device|approval|secret|gateway|error/.test(f));
console.log(interesting.slice(0, 220).join('\n'));
fs.writeFileSync(`scripts/pw-frames-${route.replace(/\W+/g, '_')}.log`, frames.join('\n'));
await browser.close();
