import { call } from '../rpc.js';
import { h, icon, modal, toast, timeAgo, empty, button, markdown } from '../ui.js';
import { statusBadge } from './home.js';

export async function render(root, { params }) {
  const listEl = h('div.list');
  const filterSel = h('select', { style: { width: 'auto' } }, ['all', 'running', 'completed', 'failed', 'cancelled'].map(v => h('option', { value: v }, v[0].toUpperCase() + v.slice(1))));
  const search = h('input', { placeholder: 'Search tasks', style: { width: '220px' } });
  let tasks = [];

  const matches = t => {
    const s = String(t.status || '').toUpperCase(), f = filterSel.value;
    const okStatus = f === 'all' || (f === 'running' ? /RUN|PROGRESS|PENDING|QUEUE|WAIT/.test(s) : f === 'completed' ? /COMPLETE|SUCCE/.test(s) : f === 'failed' ? /FAIL|ERROR/.test(s) : /CANCEL/.test(s));
    const q = search.value.trim().toLowerCase();
    return okStatus && (!q || String(t.goal || t.title || '').toLowerCase().includes(q));
  };

  function paint() {
    const shown = tasks.filter(matches);
    listEl.replaceChildren(...(shown.length ? shown.map(t => h('div.item.clickable', { onclick: () => details(t.id) },
      icon('tasks', 16),
      h('div.grow', h('div.title', t.goal || t.title || t.id), h('div.sub', `${t.agentId || 'zero'} · ${timeAgo(t.updatedAt || t.createdAt)}${t.error ? ' · ' + (t.error.message || t.error) : ''}`)),
      statusBadge(t.status))) : [empty('No tasks match.', 'tasks')]));
  }

  async function load() {
    listEl.replaceChildren(h('div.loading', h('span.spinner'), 'Loading tasks…'));
    try {
      const r = await call('tasks.list', { limit: 200 });
      tasks = (Array.isArray(r) ? r : r?.tasks || []).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      paint();
    } catch (error) { listEl.replaceChildren(h('div.callout.danger', error.message)); }
  }

  async function details(id) {
    let t;
    try { const r = await call('tasks.get', { taskId: id, id }); t = r?.task || r; } catch (error) { return toast(error.message, 'error'); }
    const result = t?.result?.content || (typeof t?.result === 'string' ? t.result : '');
    const s = String(t?.status || '').toUpperCase();
    const running = /RUN|PROGRESS|PENDING|QUEUE|WAIT/.test(s);
    const body = h('div.stack',
      h('div.row', statusBadge(t.status), h('span.faint', `Created ${timeAgo(t.createdAt)} · updated ${timeAgo(t.updatedAt)}`)),
      h('dl.kv', h('dt', 'Goal'), h('dd', t.goal || t.title || '—'), h('dt', 'Agent'), h('dd', t.agentId || 'zero'), h('dt', 'Chat'), h('dd', t.sessionId || '—'),
        t.waitReason ? [h('dt', 'Waiting for'), h('dd', t.waitReason)] : null,
        t.error ? [h('dt', 'Error'), h('dd', { style: { color: 'var(--danger)' } }, t.error.message || String(t.error))] : null),
      result ? h('div', h('div.faint', 'Result'), h('div.card', { html: markdown(result) })) : null,
      t.sessionId ? h('a', { href: '/chat?session=' + encodeURIComponent(t.sessionId) }, 'Open the chat') : null,
    );
    const box = modal(t.goal ? String(t.goal).slice(0, 80) : 'Task', body, {
      wide: true,
      actions: [
        running ? button('Cancel task', async () => { try { await call('tasks.cancel', { taskId: id, id }); toast('Task cancelled', 'ok'); box.close(); load(); } catch (e) { toast(e.message, 'error'); } }, { kind: 'danger' }) : null,
        !running ? button('Run again', async () => { try { await call('tasks.retry', { taskId: id, id }); toast('Task restarted', 'ok'); box.close(); load(); } catch (e) { toast(e.message, 'error'); } }, { iconName: 'refresh' }) : null,
        button('Close', () => box.close(), { kind: 'primary' }),
      ].filter(Boolean),
    });
  }

  filterSel.addEventListener('change', paint);
  search.addEventListener('input', paint);
  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Work'), h('h1', 'Tasks'), h('p', 'Everything Zero has worked on, with results. Open one to cancel or run it again.')),
      h('div.actions', search, filterSel, h('button.btn', { type: 'button', onclick: load }, icon('refresh', 16), h('span', 'Refresh')))),
    h('div.card', listEl),
  );
  await load();
  if (params.get('id')) details(params.get('id'));
  const timer = setInterval(() => { if (document.visibilityState === 'visible') call('tasks.list', { limit: 200 }).then(r => { tasks = (Array.isArray(r) ? r : r?.tasks || []).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)); paint(); }).catch(() => {}); }, 10000);
  return () => clearInterval(timer);
}
