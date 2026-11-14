import pw from '../backend/node_modules/playwright-core/index.js';
const { chromium } = pw;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
try {
await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(4000);

const chat = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('openclaw-chat-message, [data-role], .chat-text, .chat-message, .chat-bubble, .agent-chat__message')];
  return nodes.slice(-20).map(n => ({
    tag: n.tagName.toLowerCase(), cls: String(n.className || '').slice(0, 100),
    role: n.getAttribute('data-role') || '', text: (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
  }));
});
console.log('CHAT', JSON.stringify(chat, null, 2));

await page.goto('http://127.0.0.1:18789/settings/model-providers', { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(4000);
const providers = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.zero-provider-card')];
  return {
    cards: cards.map(c => ({ text: (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160), chips: c.querySelectorAll('.zero-model-chips-container').length })),
    editButtons: [...document.querySelectorAll('.zero-provider-card button')].map(b => (b.textContent || '').trim()).filter(Boolean),
    empty: Boolean(document.querySelector('.zero-providers-empty')),
  };
});
console.log('PROVIDERS', JSON.stringify(providers, null, 2));
} finally {
  await browser.close();
}
