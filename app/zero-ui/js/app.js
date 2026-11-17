// Shell: sidebar, top status bar, command palette and page routing.
import { call, on, connection } from './rpc.js';
import { h, icon, toast } from './ui.js';
import { look, saveLook, loadSharedLook } from './theme.js';

const PAGES = [
  { path: '/', id: 'home', title: 'Home', icon: 'home', group: 'Zero', load: () => import('./pages/home.js') },
  { path: '/chat', id: 'chat', title: 'Chat', icon: 'chat', group: 'Zero', load: () => import('./pages/chat.js') },
  { path: '/computer', id: 'computer', title: 'Computer', icon: 'computer', group: 'Zero', load: () => import('./pages/computer.js') },
  { path: '/terminal', id: 'terminal', title: 'Terminal', icon: 'terminal', group: 'Zero', load: () => import('./pages/terminal.js') },
  { path: '/tasks', id: 'tasks', title: 'Tasks', icon: 'tasks', group: 'Work', load: () => import('./pages/tasks.js') },
  { path: '/automations', id: 'automations', title: 'Automations', icon: 'clock', group: 'Work', load: () => import('./pages/automations.js') },
  { path: '/agents', id: 'agents', title: 'Agents', icon: 'agents', group: 'Work', load: () => import('./pages/agents.js') },
  { path: '/research', id: 'research', title: 'Research', icon: 'search', group: 'Work', load: () => import('./pages/research.js') },
  { path: '/memory', id: 'memory', title: 'Memory', icon: 'memory', group: 'Knowledge', load: () => import('./pages/memory.js') },
  { path: '/skills', id: 'skills', title: 'Skills & Plugins', icon: 'skills', group: 'Knowledge', load: () => import('./pages/skills.js') },
  { path: '/models', id: 'models', title: 'Models', icon: 'model', group: 'Setup', load: () => import('./pages/models.js') },
  { path: '/screen', id: 'screen', title: 'Screen share', icon: 'screen', group: 'Setup', load: () => import('./pages/screen.js') },
  { path: '/appearance', id: 'appearance', title: 'Appearance', icon: 'palette', group: 'Setup', load: () => import('./pages/appearance.js') },
  { path: '/settings', id: 'settings', title: 'Settings', icon: 'settings', group: 'Setup', load: () => import('./pages/settings.js') },
  { path: '/status', id: 'status', title: 'Status', icon: 'status', group: 'Setup', load: () => import('./pages/status.js') },
];

// ---- shared live status (top bar, home page, status page) -------------------
export const live = { models: null, auth: null, screen: null, voice: null, observation: null, hold: null, gateway: null };
const liveListeners = new Set();
export const onLive = fn => { liveListeners.add(fn); fn(live); return () => liveListeners.delete(fn); };

export async function refreshLive() {
  const grab = (method, params) => call(method, params || {}, { timeoutMs: 15000 }).catch(() => null);
  const [models, auth, screen, voice, observation, hold, gateway] = await Promise.all([
    grab('models.list'), grab('models.authStatus'), grab('zero.screenShare.status'), grab('voice.status'),
    grab('zero.observation.status'), grab('zero-policy.computer-hold.status'), grab('zero.gateway.status'),
  ]);
  Object.assign(live, { models, auth, screen, voice, observation, hold, gateway });
  for (const fn of liveListeners) { try { fn(live); } catch (e) { console.error(e); } }
}

export function modelReady() {
  // The Gemini screen-share provider has no chat models, so it does not count.
  const providers = (live.auth?.providers || []).filter(p => p.provider !== 'gemini-live-screen');
  return providers.some(p => p.configured === true || p.keyState === 'present' || p.keyState === 'not-required');
}

// ---- layout ----------------------------------------------------------------
const app = document.getElementById('app');
const main = h('main.main');
const content = h('section.content');
const crumb = h('div.crumb');
const pills = h('div.pills');
const sidebar = h('aside.sidebar');

function navItems() {
  const groups = {};
  for (const page of PAGES) (groups[page.group] ||= []).push(page);
  return Object.entries(groups).map(([group, pages]) => h('div.navgroup',
    h('div.navlabel', group),
    pages.map(page => h('a.nav', { href: page.path, 'data-id': page.id, title: page.title, onclick: event => { event.preventDefault(); go(page.path); } },
      icon(page.icon), h('span', page.title))),
  ));
}

function buildShell() {
  sidebar.replaceChildren(
    h('div.brand', h('div.logo', h('span')), h('div.brandtext', h('strong', 'Zero'), h('small', 'Personal commander'))),
    h('button.newchat', { type: 'button', onclick: () => go('/chat?new=1') }, icon('plus', 16), h('span', 'New chat')),
    h('nav', navItems()),
    h('div.sidefoot',
      h('button.iconbtn', { type: 'button', title: 'Collapse sidebar', onclick: () => saveLook({ sidebar: look.sidebar === 'full' ? 'icons' : 'full' }) }, icon('menu')),
      h('div.conn', h('span.dot#conndot'), h('span#conntext', 'Connecting…')),
    ),
  );
  const top = h('header.topbar',
    h('button.iconbtn.mobile-only', { type: 'button', 'aria-label': 'Menu', onclick: () => document.body.classList.toggle('nav-open') }, icon('menu')),
    crumb,
    h('button.search', { type: 'button', onclick: openPalette }, icon('search', 16), h('span', 'Search or jump to…'), h('kbd', 'Ctrl K')),
    pills,
  );
  main.append(top, content);
  app.replaceChildren(sidebar, main, h('div.scrim', { onclick: () => document.body.classList.remove('nav-open') }));
}

function paintPills() {
  const ready = modelReady();
  const screen = live.screen;
  const screenOn = screen?.mode === 'online' && !screen.paused;
  const held = live.hold?.held;
  pills.replaceChildren(
    h('button.pill' + (ready ? '.ok' : '.warn'), { type: 'button', title: ready ? 'A model is ready' : 'No model has an API key — open Models', onclick: () => go('/models') },
      icon('model', 14), h('span', ready ? (live.models?.defaultModel || 'Model ready').split('/').pop().slice(0, 22) : 'Model: add key')),
    h('button.pill' + (screenOn ? '.ok' : ''), { type: 'button', title: screen?.reason || 'Screen share', onclick: () => go('/screen') },
      icon('screen', 14), h('span', screenOn ? 'Screen: online' : screen?.mode === 'connecting' ? 'Screen: connecting' : 'Screen: offline')),
    h('button.pill' + (held ? '.warn' : ''), { type: 'button', title: held ? 'You hold the computer; Zero will not act' : 'Zero may use the computer', onclick: () => go('/computer') },
      icon('hand', 14), h('span', held ? 'Hands: you' : 'Hands: Zero')),
  );
}

function paintConnection(state) {
  const dot = document.getElementById('conndot'), text = document.getElementById('conntext');
  if (!dot) return;
  dot.className = 'dot ' + state;
  text.textContent = state === 'online' ? 'Connected' : state === 'connecting' ? 'Connecting…' : 'Offline — retrying';
}

// ---- routing ---------------------------------------------------------------
let cleanup = null;
let current = null;

export function go(path, { replace = false } = {}) {
  if (path !== location.pathname + location.search) history[replace ? 'replaceState' : 'pushState'](null, '', path);
  route();
}

async function route() {
  const page = PAGES.find(p => p.path === location.pathname) || (location.pathname.startsWith('/chat') ? PAGES[1] : PAGES[0]);
  document.body.classList.remove('nav-open');
  for (const a of sidebar.querySelectorAll('.nav')) a.classList.toggle('active', a.dataset.id === page.id);
  crumb.replaceChildren(icon(page.icon, 16), h('span', page.title));
  document.title = `${page.title} · Zero`;
  if (typeof cleanup === 'function') { try { cleanup(); } catch {} }
  cleanup = null;
  current = page.id;
  const holder = h('div.page.page-' + page.id);
  content.replaceChildren(holder);
  try {
    const mod = await page.load();
    if (current !== page.id) return;
    cleanup = await mod.render(holder, { go, params: new URLSearchParams(location.search) });
  } catch (error) {
    console.error(error);
    holder.replaceChildren(h('div.callout.danger', 'This page could not load: ' + error.message));
  }
}

// ---- command palette ---------------------------------------------------------
async function openPalette() {
  if (document.querySelector('dialog.palette')) return;
  const input = h('input', { placeholder: 'Type a page, a chat or a question for Zero…', autocomplete: 'off' });
  const list = h('div.palette-list');
  const dialog = h('dialog.palette', input, list);
  document.body.append(dialog);
  dialog.showModal();
  const closeIt = () => { dialog.close(); dialog.remove(); };
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', event => { if (event.target === dialog) closeIt(); });
  let sessions = [];
  call('sessions.list', { limit: 50 }).then(r => { sessions = r?.sessions || []; paint(); }).catch(() => {});
  let selected = 0;
  const items = () => {
    const q = input.value.trim().toLowerCase();
    const out = PAGES.filter(p => !q || p.title.toLowerCase().includes(q)).map(p => ({ label: p.title, hint: 'Page', icon: p.icon, run: () => go(p.path) }));
    for (const s of sessions) {
      const name = s.label || s.displayName || s.name || s.key;
      if (q && String(name).toLowerCase().includes(q)) out.push({ label: name, hint: 'Chat', icon: 'chat', run: () => go('/chat?session=' + encodeURIComponent(s.key)) });
    }
    if (q) out.push({ label: `Ask Zero: “${input.value.trim()}”`, hint: 'New chat', icon: 'spark', run: () => go('/chat?new=1&ask=' + encodeURIComponent(input.value.trim())) });
    return out.slice(0, 14);
  };
  const paint = () => {
    const all = items();
    selected = Math.min(selected, all.length - 1);
    list.replaceChildren(...all.map((item, i) => h('button.palette-item' + (i === selected ? '.sel' : ''), { type: 'button', onclick: () => { closeIt(); item.run(); } },
      icon(item.icon, 16), h('span', item.label), h('small', item.hint))));
  };
  input.addEventListener('input', () => { selected = 0; paint(); });
  input.addEventListener('keydown', event => {
    const all = items();
    if (event.key === 'ArrowDown') { selected = (selected + 1) % all.length; paint(); event.preventDefault(); }
    else if (event.key === 'ArrowUp') { selected = (selected - 1 + all.length) % all.length; paint(); event.preventDefault(); }
    else if (event.key === 'Enter' && all[selected]) { closeIt(); all[selected].run(); }
  });
  paint();
  input.focus();
}

// ---- start -------------------------------------------------------------------
buildShell();
window.addEventListener('popstate', route);
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openPalette(); }
});
on('connection', state => {
  paintConnection(state);
  if (state === 'online') { refreshLive(); loadSharedLook(); }
  if (state === 'offline') toast('Lost connection to Zero — reconnecting…', 'warn');
});
paintConnection(connection.state);
onLive(paintPills);
setInterval(() => { if (connection.state === 'online' && document.visibilityState === 'visible') refreshLive(); }, 15000);
route();
