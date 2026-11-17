import { call } from '../rpc.js';
import { h, icon, badge, toast, formBox, confirmBox, empty, timeAgo } from '../ui.js';

const LAYERS = ['semantic', 'episodic', 'procedural', 'working', 'session'];

export async function render(root) {
  const statsEl = h('div.grid.g4');
  const listEl = h('div.list');
  const search = h('input', { placeholder: 'Search what Zero remembers…', autocomplete: 'off' });
  const layerSel = h('select', { style: { width: 'auto' } }, h('option', { value: '' }, 'All layers'), LAYERS.map(l => h('option', { value: l }, l)));
  let records = [];

  async function loadStats() {
    try {
      const r = await call('memory.layers');
      const layers = r?.layers || {};
      statsEl.replaceChildren(
        h('div.card.stat', h('div.label', icon('memory', 14), 'Total memories'), h('div.value', String(r?.totalMemories ?? 0))),
        ...['semantic', 'episodic', 'procedural'].map(l => h('div.card.stat', h('div.label', l), h('div.value', String(layers[l]?.count ?? 0)))),
      );
    } catch {}
  }

  async function load() {
    listEl.replaceChildren(h('div.loading', h('span.spinner'), 'Loading…'));
    try {
      const q = search.value.trim();
      if (q) {
        const r = await call('memory.recall', { query: q, options: { limit: 50 } });
        records = Array.isArray(r) ? r : r?.memories || r?.results || [];
      } else {
        const r = await call('memory.list', { limit: 300 });
        records = Array.isArray(r) ? r : r?.memories || r?.items || [];
      }
      paint();
    } catch (error) { listEl.replaceChildren(h('div.callout.danger', error.message)); }
  }

  function paint() {
    const layer = layerSel.value;
    const shown = records.filter(r => !layer || r.layer === layer);
    listEl.replaceChildren(...(shown.length ? shown.map(m => h('div.item', { style: { alignItems: 'flex-start' } },
      icon(m.layer === 'procedural' ? 'skills' : 'memory', 18),
      h('div.grow', h('div', { style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } }, String(m.content || '').slice(0, 600)),
        h('div.sub', `${m.category || ''}${m.createdAt ? ' · ' + timeAgo(m.createdAt) : ''}${m.source ? ' · ' + m.source : ''}`)),
      badge(m.layer || 'memory', m.layer === 'procedural' ? 'info' : ''),
      h('button.iconbtn', { type: 'button', title: 'Forget', onclick: async () => {
        if (!(await confirmBox('Forget this?', 'Zero will no longer remember it.', 'Forget', true))) return;
        try { await call('memory.forget', { id: m.id }); toast('Forgotten', 'ok'); load(); loadStats(); } catch (e) { toast(e.message, 'error'); }
      } }, icon('trash', 16)))) : [empty(search.value ? 'Nothing matches.' : 'Zero has not stored anything yet.', 'memory')]));
  }

  async function add() {
    const v = await formBox('Teach Zero something', [
      { name: 'content', label: 'What should Zero remember?', type: 'textarea', required: true, placeholder: 'My work hours are 10:00–19:00. Prefer Hindi replies.' },
      { name: 'layer', label: 'Kind', type: 'select', value: 'semantic', options: [{ value: 'semantic', label: 'Fact or preference (semantic)' }, { value: 'episodic', label: 'Something that happened (episodic)' }, { value: 'procedural', label: 'How to do something (procedural)' }] },
      { name: 'tags', label: 'Tags (comma separated)', placeholder: 'personal, schedule' },
    ], 'Remember');
    if (!v) return;
    try {
      await call('memory.remember', { content: v.content, layer: v.layer, source: 'user', category: 'owner-note', tags: v.tags.split(',').map(t => t.trim()).filter(Boolean) });
      toast('Saved to memory', 'ok'); load(); loadStats();
    } catch (e) { toast(e.message, 'error'); }
  }

  let timer;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 350); });
  layerSel.addEventListener('change', paint);
  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Knowledge'), h('h1', 'Memory'), h('p', 'Facts, events and learned procedures Zero keeps between chats. Add your own or remove what is wrong.')),
      h('div.actions', h('button.btn.primary', { type: 'button', onclick: add }, icon('plus', 16), h('span', 'Add memory')))),
    statsEl,
    h('div.card', { style: { marginTop: 'var(--gap)' } }, h('div.row', { style: { marginBottom: '10px', flexWrap: 'nowrap' } }, search, layerSel), listEl),
  );
  loadStats();
  await load();
}
