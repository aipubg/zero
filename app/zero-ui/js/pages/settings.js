// Settings: its own sidebar, grouped, with search. Every section is a module
// that renders into the panel on the right.
import { h, icon } from '../ui.js';

const S = () => import('../settings/sections.js');
export const SECTIONS = [
  { group: 'General', id: 'profile', label: 'Profile', icon: 'agents', load: S, fn: 'profile' },
  { group: 'General', id: 'appearance', label: 'Appearance', icon: 'palette', load: () => import('./appearance.js') },
  { group: 'General', id: 'notifications', label: 'Notifications', icon: 'speaker', load: S, fn: 'notifications' },
  { group: 'Intelligence', id: 'models', label: 'Models & Providers', icon: 'model', load: () => import('./models.js') },
  { group: 'Intelligence', id: 'search', label: 'Web search', icon: 'globe', load: S, fn: 'search' },
  { group: 'Intelligence', id: 'memory', label: 'Memory engine', icon: 'memory', load: S, fn: 'memory' },
  { group: 'Control', id: 'computer', label: 'Computer control', icon: 'hand', load: S, fn: 'computer' },
  { group: 'Control', id: 'mcp', label: 'MCP servers', icon: 'skills', load: S, fn: 'mcp' },
  { group: 'Connections', id: 'gateway', label: 'Gateway', icon: 'status', load: S, fn: 'gateway' },
  { group: 'Connections', id: 'devices', label: 'Devices', icon: 'computer', load: S, fn: 'devices' },
  { group: 'System', id: 'labs', label: 'Labs', icon: 'spark', load: S, fn: 'labs' },
  { group: 'System', id: 'advanced', label: 'Advanced', icon: 'settings', load: S, fn: 'advanced' },
  { group: 'System', id: 'status', label: 'Status', icon: 'status', load: () => import('./status.js') },
  { group: 'System', id: 'about', label: 'About', icon: 'dot', load: S, fn: 'about' },
];

export async function render(root, ctx) {
  const id = ctx.path.split('/').filter(Boolean)[1];
  const section = SECTIONS.find(s => s.id === id) || SECTIONS[0];
  const search = h('input.settings-search', { placeholder: 'Search settings', autocomplete: 'off', 'aria-label': 'Search settings' });
  const nav = h('nav.settings-nav');
  const paintNav = () => {
    const q = search.value.trim().toLowerCase();
    const groups = {};
    for (const s of SECTIONS) if (!q || s.label.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)) (groups[s.group] ||= []).push(s);
    nav.replaceChildren(...Object.entries(groups).map(([group, items]) => h('div.settings-group',
      h('div.navlabel', group),
      items.map(s => h('a.settings-link' + (s.id === section.id ? '.active' : ''), {
        href: '/settings/' + s.id, onclick: e => { e.preventDefault(); ctx.go('/settings/' + s.id); },
      }, icon(s.icon, 16), h('span', s.label))))));
  };
  search.addEventListener('input', paintNav);
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const first = nav.querySelector('.settings-link'); if (first) first.click(); }
  });
  paintNav();
  const panel = h('div.settings-panel.page-' + section.id);
  root.append(h('div.settings', h('aside.settings-side', h('div.settings-title', 'Settings'), search, nav), panel));
  const mod = await section.load();
  const render = section.fn ? mod[section.fn] : mod.render;
  return render(panel, { ...ctx, inSettings: true });
}
