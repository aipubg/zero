import { call } from '../rpc.js';
import { h, icon, badge, timeAgo } from '../ui.js';
import { look } from '../theme.js';
import { onLive, modelReady, refreshLive } from '../app.js';
import { mountOrb } from '../orb.js';

function greeting() {
  const hour = new Date().getHours();
  return hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export async function render(root, { go }) {
  const cleanups = [];
  const input = h('input', { placeholder: 'Ask Zero anything, or tell it what to do…', autocomplete: 'off' });
  const ask = () => { const q = input.value.trim(); if (q) go('/chat?new=1&ask=' + encodeURIComponent(q)); };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });

  const canvas = h('canvas', { 'aria-label': 'Zero orb' });
  const heroMain = h('div.card.hero-main',
    look.orb ? h('div.orb-wrap', canvas) : null,
    h('div.eyebrow', greeting() + ', ' + (look.name || 'Owner')),
    h('h1', 'What should ', h('span.grad', 'Zero'), ' do next?'),
    h('p', 'Chat, open apps, run commands, watch the screen, plan long work — all from here.'),
    h('div.ask', input, h('button.btn.primary', { type: 'button', onclick: ask }, icon('send', 16), h('span', 'Ask'))),
  );
  if (look.orb) cleanups.push(mountOrb(canvas));

  const statusCard = h('div.card', h('h2', icon('status'), 'System'), h('div.stack#sys'));
  const quick = h('div.quick',
    [['chat', 'New chat', 'Talk to Zero', '/chat?new=1'], ['computer', 'Computer', 'Apps & windows', '/computer'], ['terminal', 'Terminal', 'Run commands', '/terminal'],
      ['tasks', 'Tasks', 'What Zero did', '/tasks'], ['clock', 'Automations', 'Scheduled jobs', '/automations'], ['memory', 'Memory', 'What Zero knows', '/memory'],
      ['screen', 'Screen share', 'Online / offline', '/screen'], ['palette', 'Appearance', 'Make it yours', '/appearance']]
      .map(([ic, title, sub, path]) => h('button', { type: 'button', onclick: () => go(path) }, icon(ic, 20), h('strong', title), h('small', sub)))
  );

  const recentChats = h('div.list', h('div.loading', h('span.spinner'), 'Loading…'));
  const recentTasks = h('div.list', h('div.loading', h('span.spinner'), 'Loading…'));

  root.append(
    h('div.hero', heroMain, statusCard),
    h('div.card', { style: { marginBottom: 'var(--gap)' } }, h('h2', icon('spark'), 'Quick actions'), quick),
    h('div.grid.g2', h('div.card', h('div.card-head', h('h2', icon('chat'), 'Recent chats'), h('span.spacer'), h('button.btn.small.ghost', { type: 'button', onclick: () => go('/chat') }, 'All')), recentChats),
      h('div.card', h('div.card-head', h('h2', icon('tasks'), 'Recent tasks'), h('span.spacer'), h('button.btn.small.ghost', { type: 'button', onclick: () => go('/tasks') }, 'All')), recentTasks)),
  );

  const row = (ic, label, value, kind) => h('div.item', icon(ic, 18), h('div.grow', h('div.title', label)), badge(value, kind));
  cleanups.push(onLive(live => {
    const sys = statusCard.querySelector('#sys');
    const s = live.screen, obs = live.observation, voice = live.voice, gw = live.gateway;
    sys.replaceChildren(h('div.list',
      row('model', 'Chat model', modelReady() ? (live.models?.defaultModel || 'ready').split('/').pop() : 'Needs API key', modelReady() ? 'ok' : 'warn'),
      row('screen', 'Screen share', s?.mode === 'online' ? (s.paused ? 'Paused' : 'Online · Gemini') : 'Offline · local', s?.mode === 'online' ? 'ok' : ''),
      row('voice', 'Voice', voice?.ready ? 'Ready' : 'Not ready', voice?.ready ? 'ok' : 'warn'),
      row('computer', 'Screen watching', obs?.running ? 'On' : 'Off', obs?.running ? 'ok' : ''),
      row('hand', 'Hands on computer', live.hold?.held ? 'You' : 'Zero', live.hold?.held ? 'warn' : 'ok'),
      row('status', 'Zero host', gw ? `Up ${Math.round((gw.uptimeSeconds || 0) / 60)} min` : 'Unknown', gw ? 'ok' : 'warn'),
    ));
    if (!modelReady() && live.auth) sys.append(h('div.callout.warn', { style: { marginTop: '10px' } }, 'Chat needs a model API key.', h('button.btn.small', { type: 'button', onclick: () => go('/models') }, 'Add key')));
  }));
  refreshLive();

  call('sessions.list', { limit: 6 }).then(r => {
    const sessions = (r?.sessions || []).slice(0, 6);
    recentChats.replaceChildren(...(sessions.length ? sessions.map(s => h('div.item.clickable', { onclick: () => go('/chat?session=' + encodeURIComponent(s.key)) },
      icon('chat', 16), h('div.grow', h('div.title', s.label || s.displayName || s.name || s.key), h('div.sub', timeAgo(s.updatedAt || s.lastActivityAt || s.createdAt))))) : [h('div.empty', 'No chats yet.')]));
  }).catch(e => recentChats.replaceChildren(h('div.faint', e.message)));

  call('tasks.list', { limit: 6 }).then(r => {
    const tasks = (Array.isArray(r) ? r : r?.tasks || []).slice(0, 6);
    recentTasks.replaceChildren(...(tasks.length ? tasks.map(t => h('div.item.clickable', { onclick: () => go('/tasks?id=' + encodeURIComponent(t.id)) },
      icon('tasks', 16), h('div.grow', h('div.title', t.goal || t.title || t.id), h('div.sub', timeAgo(t.updatedAt || t.createdAt))), statusBadge(t.status))) : [h('div.empty', 'No tasks yet.')]));
  }).catch(e => recentTasks.replaceChildren(h('div.faint', e.message)));

  return () => cleanups.forEach(fn => fn());
}

export function statusBadge(status) {
  const s = String(status || '').toUpperCase();
  const kind = /COMPLETE|SUCCE|DONE/.test(s) ? 'ok' : /FAIL|ERROR|CANCEL/.test(s) ? 'danger' : /RUN|PROGRESS|PENDING|QUEUE|WAIT/.test(s) ? 'info' : '';
  return badge(s.toLowerCase().replace(/_/g, ' ') || 'unknown', kind);
}
