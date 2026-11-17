// A "room": one place in the sidebar with its own tabs (/room/tab).
// Each tab is an ordinary page module rendered into the room's panel.
import { h, icon } from './ui.js';

/**
 * @param {HTMLElement} root
 * @param {object} ctx       router context ({ go, params, path })
 * @param {object} spec      { base: '/work', tabs: [{ id, label, icon, load }] }
 */
export async function renderRoom(root, ctx, spec) {
  const segment = ctx.path.slice(spec.base.length).split('/').filter(Boolean)[0];
  const tab = spec.tabs.find(t => t.id === segment) || spec.tabs[0];
  const bar = h('nav.roomtabs', { 'aria-label': spec.title || 'Sections' },
    spec.tabs.map(t => h('a.roomtab' + (t.id === tab.id ? '.active' : ''), {
      href: `${spec.base}/${t.id}`,
      onclick: event => { event.preventDefault(); if (t.id !== tab.id) ctx.go(`${spec.base}/${t.id}`); },
    }, icon(t.icon, 16), h('span', t.label))));
  const panel = h('div.roompanel');
  root.append(bar, panel);
  const mod = await tab.load();
  return mod.render(panel, { ...ctx, inRoom: true });
}
