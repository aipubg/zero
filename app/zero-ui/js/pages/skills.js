import { call } from '../rpc.js';
import { h, icon, badge, toast, formBox, empty } from '../ui.js';

export async function render(root, { go }) {
  const tabs = h('div.tabs');
  const body = h('div');
  let tab = 'skills';

  const setTab = name => { tab = name; for (const b of tabs.children) b.classList.toggle('active', b.dataset.tab === name); paint(); };
  for (const [id, label] of [['skills', 'Skills'], ['plugins', 'Plugins']]) tabs.append(h('button.tab', { type: 'button', 'data-tab': id, onclick: () => setTab(id) }, label));

  async function runSkill(skill) {
    const v = await formBox('Run “' + skill.name + '”', [{ name: 'goal', label: 'What should it do?', type: 'textarea', required: true, placeholder: (skill.triggers || [])[0] || '' }], 'Run');
    if (!v) return;
    go('/chat?new=1&ask=' + encodeURIComponent(`Use the ${skill.name} skill: ${v.goal}`));
  }

  async function paint() {
    body.replaceChildren(h('div.loading', h('span.spinner'), 'Loading…'));
    try {
      if (tab === 'skills') {
        const r = await call('skills.list');
        const skills = r?.skills || [];
        body.replaceChildren(skills.length ? h('div.grid.auto', skills.map(s => h('div.card',
          h('div.row', icon('skills', 18), h('strong', s.name), h('span.spacer'), s.enabled === false ? badge('off', 'warn') : badge('ready', 'ok')),
          h('p.muted', { style: { margin: '8px 0' } }, s.description || ''),
          h('div.row', ...(s.triggers || []).slice(0, 4).map(t => badge(t))),
          h('div.row', { style: { marginTop: '10px' } }, h('span.spacer'), h('button.btn.small', { type: 'button', onclick: () => runSkill(s) }, icon('play', 14), h('span', 'Use')))))) : empty('No skills installed.', 'skills'));
      } else {
        const r = await call('plugins.list');
        const plugins = r?.plugins || [];
        body.replaceChildren(plugins.length ? h('div.card', h('div.list', plugins.map(p => {
          const on = p.enabled !== false && p.state !== 'disabled';
          const sw = h('button.switch', { type: 'button', role: 'switch', 'aria-checked': String(on), title: on ? 'Turn off' : 'Turn on', onclick: async () => {
            try { await call(on ? 'plugins.disable' : 'plugins.enable', { id: p.id, pluginId: p.id }); toast((on ? 'Turned off ' : 'Turned on ') + (p.name || p.id), 'ok'); paint(); }
            catch (e) { toast(e.message, 'error'); }
          } });
          return h('div.item', icon('skills', 18), h('div.grow', h('div.title', p.name || p.id), h('div.sub', `${p.version ? 'v' + p.version + ' · ' : ''}${p.description || ''}`)), sw);
        }))) : empty('No plugins.', 'skills'));
      }
    } catch (error) { body.replaceChildren(h('div.callout.danger', error.message)); }
  }

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Knowledge'), h('h1', 'Skills & Plugins'), h('p', 'Skills are step-by-step abilities Zero has learned; plugins add tools. Zero picks the right skill on its own — you can also run one directly.'))),
    tabs, body,
  );
  setTab('skills');
}
