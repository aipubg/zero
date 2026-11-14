import pw from '../backend/node_modules/playwright-core/index.js';
const { chromium } = pw;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);

const audit = await page.evaluate(() => {
  const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const desc = el => ({
    tag: el.tagName.toLowerCase(),
    cls: String(el.className || '').slice(0, 120),
    label: el.getAttribute('aria-label') || '',
    title: el.getAttribute('title') || '',
    text: text(el).slice(0, 80),
    href: el.getAttribute('href') || '',
  });
  const all = [...document.querySelectorAll('body *')];
  const visible = el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  };
  const searchish = all.filter(el => visible(el) && (
    /search|palette|go anywhere/i.test((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + text(el))
  ) && !el.closest('[data-zero-shell-owned]'));
  const themeish = all.filter(el => visible(el) && /color mode|theme|day mode|night mode/i.test((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + text(el)));
  const navLinks = [...document.querySelectorAll('.zero-shell-nav-link')].map(desc);
  const sidebarShells = [...document.querySelectorAll('.sidebar-shell')].map(desc);
  const sidebars = [...document.querySelectorAll('.sidebar-shell, .zero-shell-sidebar')].map(desc);
  const legacyNav = [...document.querySelectorAll('.sidebar-nav a, .sidebar-nav button, nav.sidebar-nav')].map(desc);
  const topButtons = [...document.querySelectorAll('.topnav-shell button, .topnav-shell a, header button, header a')].map(desc).slice(0, 40);
  const paletteInputs = [...document.querySelectorAll('input[placeholder]')].map(el => ({ placeholder: el.placeholder, visible: visible(el) })).filter(x => x.visible || /search or start|where would/i.test(x.placeholder));
  const openclaw = all.filter(el => visible(el) && /openclaw/i.test(text(el)) && el.children.length === 0).map(desc).slice(0, 20);
  return {
    title: document.title,
    url: location.href,
    searchish: searchish.map(desc).slice(0, 30),
    themeish: themeish.map(desc).slice(0, 20),
    navLinks,
    sidebarShells,
    sidebars,
    legacyNav,
    topButtons,
    paletteInputs,
    openclaw,
    hasShell: Boolean(document.querySelector('.zero-shell-header')),
    hasWelcome: Boolean(document.querySelector('.zero-command-home')),
    bodyClasses: document.body.className,
  };
});
console.log(JSON.stringify(audit, null, 2));
await browser.close();
