import { call } from '../rpc.js';
import { h, icon, empty, toast } from '../ui.js';

export async function render(root, { go }) {
  const input = h('input', { placeholder: 'Search the web with sources…', autocomplete: 'off' });
  const results = h('div.stack');
  const btn = h('button.btn.primary', { type: 'button', onclick: () => search() }, icon('search', 16), h('span', 'Search'));

  async function search() {
    const query = input.value.trim();
    if (!query) return input.focus();
    btn.disabled = true;
    results.replaceChildren(h('div.loading', h('span.spinner'), 'Searching…'));
    try {
      const r = await call('research.search', { query }, { timeoutMs: 90000 });
      const items = r?.citations || r?.results || [];
      results.replaceChildren(
        h('div.row', h('span.faint', `${items.length} sources`), h('span.spacer'),
          h('button.btn.small', { type: 'button', onclick: () => go('/chat?new=1&ask=' + encodeURIComponent('Research this and give me a clear summary with sources: ' + query)) }, icon('spark', 14), h('span', 'Ask Zero to summarise'))),
        ...(items.length ? items.map(c => h('div.card',
          h('div.row', h('span.badge', c.source || c.domain || 'web'), h('a', { href: c.url, target: '_blank', rel: 'noopener', style: { fontWeight: 650 } }, c.title || c.url)),
          h('p.muted', { style: { margin: '8px 0 0' } }, c.snippet || ''),
          h('div.faint', { style: { marginTop: '6px' } }, c.url))) : [empty('No results.', 'search')]),
      );
    } catch (error) { results.replaceChildren(h('div.callout.danger', error.message)); toast(error.message, 'error'); }
    finally { btn.disabled = false; }
  }
  input.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Work'), h('h1', 'Research'), h('p', 'Real search results with their sources. Hand them to Zero for a summary.'))),
    h('div.card', { style: { marginBottom: 'var(--gap)' } }, h('div.row', { style: { flexWrap: 'nowrap' } }, input, btn)),
    results,
  );
  input.focus();
}
