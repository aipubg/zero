// Settings sections. Each one only offers what the Zero host really does.
import { call } from '../rpc.js';
import { h, icon, badge, toast, button, empty, timeAgo, confirmBox, bytes, modal, formBox } from '../ui.js';
import { look, saveLook } from '../theme.js';
import { live, refreshLive } from '../app.js';

const head = (title, text) => h('div.head', h('div', h('h1', title), text ? h('p', text) : null));
const card = (title, iconName, ...body) => h('div.card.section-card', h('h2', icon(iconName), title), ...body);
const row = (title, sub, control) => h('div.setting', h('div.label', h('strong', title), sub ? h('small', sub) : null), h('div.control', control));
const toggle = (on, onChange, label) => h('button.switch', { type: 'button', role: 'switch', 'aria-checked': String(Boolean(on)), 'aria-label': label,
  onclick: e => { const next = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', String(next)); onChange(next); } });
const loading = () => h('div.loading', h('span.spinner'), 'Loading…');

// ---------------------------------------------------------------- Profile
export async function profile(root) {
  const prefs = await call('users.prefs.get').catch(() => ({}));
  const p = prefs?.prefs?.profile || {};
  const name = h('input', { value: p.displayName || look.name || '', placeholder: 'Your name', style: { width: '260px' } });
  const about = h('textarea', { rows: 3, placeholder: 'A few words Zero should know about you (shown to Zero in chats).' }, p.about || '');
  const lang = h('select', { style: { width: '200px' } }, ['Hindi + English', 'English', 'Hindi'].map(v => h('option', { selected: v === (p.language || 'Hindi + English') }, v)));
  const save = button('Save profile', async () => {
    const profile = { displayName: name.value.trim() || 'Owner', about: about.value.trim(), language: lang.value };
    try { await call('users.prefs.set', { prefs: { profile } }); saveLook({ name: profile.displayName }); toast('Profile saved', 'ok'); }
    catch (e) { toast(e.message, 'error'); }
  }, { kind: 'primary' });
  const self = await call('users.self').catch(() => null);
  root.append(head('Profile', 'How Zero addresses you.'),
    card('You', 'agents', row('Name', 'Used in greetings', name), row('Language', 'Preferred reply language', lang), h('label.field', h('span', 'About you'), about), h('div.row', { style: { marginTop: '12px' } }, h('span.spacer'), save)),
    card('Access', 'key', h('dl.kv', h('dt', 'Role'), h('dd', self?.profile?.role || 'operator'), h('dt', 'Account'), h('dd', 'Local owner (this computer)'), h('dt', 'Signed in from'), h('dd', 'Loopback only — Zero accepts this PC alone'))));
}

// ---------------------------------------------------------------- Notifications
export async function notifications(root) {
  const supported = 'Notification' in window;
  const state = () => (supported ? Notification.permission : 'unsupported');
  const status = h('span');
  const paint = () => status.replaceChildren(badge(state() === 'granted' ? 'allowed' : state() === 'denied' ? 'blocked in browser' : state() === 'unsupported' ? 'not supported' : 'not asked', state() === 'granted' ? 'ok' : 'warn'));
  paint();
  root.append(head('Notifications', 'Desktop notifications from this browser when Zero finishes something while the tab is in the background.'),
    card('Desktop notifications', 'speaker',
      row('Permission', 'Your browser decides; Zero only asks', h('div.row', status, supported && state() !== 'granted' ? button('Allow', async () => { await Notification.requestPermission(); paint(); }, { kind: 'primary' }) : null)),
      row('When a reply or task finishes', 'Only while this tab is hidden', toggle(look.notifyDone !== false, v => saveLook({ notifyDone: v }), 'Notify when finished')),
      row('When Zero needs your answer', 'Approval or question in a chat', toggle(look.notifyAsk !== false, v => saveLook({ notifyAsk: v }), 'Notify when Zero asks')),
      row('Sound', 'A short chime with the notification', toggle(look.notifySound === true, v => saveLook({ notifySound: v }), 'Notification sound')),
      row('Test', null, button('Send a test notification', () => {
        if (state() !== 'granted') return toast('Allow notifications first', 'warn');
        new Notification('Zero', { body: 'Notifications are working.', icon: '/favicon.svg' });
      }))));
}

// ---------------------------------------------------------------- Web search
export async function search(root) {
  const body = h('div', loading());
  root.append(head('Web search', 'How Zero searches the web for research and answers.'), body);
  const s = await call('webSearch.status').catch(e => ({ error: e.message }));
  const q = h('input', { placeholder: 'Try a search', value: 'Zero AI assistant', style: { width: '320px' } });
  const out = h('div');
  body.replaceChildren(
    card('Search', 'globe',
      row('Web search', s.error || (s.enabled ? 'Zero may search the web' : 'Off'), badge(s.enabled ? 'on' : 'off', s.enabled ? 'ok' : 'warn')),
      row('Provider', 'Sources Zero combines', h('span', (s.providers || []).map(p => p.label || p.id).join(', ') || s.provider || '—')),
      row('Search model', 'Model that reads the results', h('span.mono', s.model ? `${s.model.provider}/${s.model.id}` : '—'))),
    card('Test', 'search', h('div.row', { style: { flexWrap: 'nowrap' } }, q, button('Test search', async () => {
      out.replaceChildren(loading());
      try {
        const r = await call('webSearch.test', { query: q.value.trim() || 'Zero' }, { timeoutMs: 60000 });
        out.replaceChildren(h('div.callout' + (r.ok ? '.ok' : '.warn'), `${r.results?.length || 0} results in ${r.latencyMs ?? '?'} ms${r.error ? ' — ' + r.error : ''}`),
          h('div.list', (r.results || []).slice(0, 5).map(x => h('div.item', h('div.grow', h('a.title', { href: x.url, target: '_blank', rel: 'noopener' }, x.title), h('div.sub', x.url))))));
      } catch (e) { out.replaceChildren(h('div.callout.danger', e.message)); }
    }, { kind: 'primary' })), out));
}

// ---------------------------------------------------------------- Memory engine
export async function memory(root, { go }) {
  const body = h('div', loading());
  root.append(head('Memory engine', 'How Zero stores and tidies what it remembers. The memories themselves are in Knowledge → Memory.'), body);
  const [layers, doctor] = await Promise.all([call('memory.layers').catch(() => null), call('doctor.memory.status').catch(() => null)]);
  const order = ['working', 'session', 'episodic', 'semantic', 'procedural'];
  body.replaceChildren(
    card('Health', 'memory',
      row('Memory store', doctor?.status || 'Working', badge(doctor && doctor.ok === false ? 'problem' : 'ok', doctor && doctor.ok === false ? 'danger' : 'ok')),
      row('Search', 'Local embeddings, nothing leaves this PC', h('span.mono', doctor?.embeddings?.provider || doctor?.provider || 'local')),
      row('Total memories', null, h('strong', String(layers?.totalMemories ?? 0)))),
    card('Layers', 'tasks', h('div.list', order.map(l => h('div.item', h('div.grow', h('div.title', l), h('div.sub', { working: 'This conversation, short-lived', session: 'This chat session', episodic: 'Things that happened', semantic: 'Facts and preferences', procedural: 'How to do things (learned steps)' }[l])), badge(String(layers?.layers?.[l]?.count ?? 0)))))),
    card('Maintenance', 'refresh',
      row('Tidy up now', 'Merge duplicates and drop stale working notes', button('Consolidate', async () => {
        try { const r = await call('memory.consolidate', {}, { timeoutMs: 120000 }); toast(`Memory tidied${r?.merged != null ? ` (${r.merged} merged)` : ''}`, 'ok'); }
        catch (e) { toast(e.message, 'error'); }
      })),
      row('Browse memories', null, button('Open Memory', () => go('/knowledge/memory'), { kind: 'ghost' }))));
}

// ---------------------------------------------------------------- Computer control
export async function computer(root, { go }) {
  const body = h('div');
  root.append(head('Computer control', 'Who may use the mouse and keyboard, and what Zero watches.'), body);
  const paint = async () => {
    await refreshLive();
    const held = live.hold?.held, o = live.observation || {};
    body.replaceChildren(
      card('Hands', 'hand',
        row('Zero may use mouse and keyboard', held ? 'You are holding the computer — Zero will not act' : 'Zero acts when a task needs it', toggle(!held, async on => {
          try { await call(on ? 'zero-policy.computer-hold.release' : 'zero-policy.computer-hold.take', {}); toast(on ? 'Zero may act again' : 'You have control', 'ok'); paint(); } catch (e) { toast(e.message, 'error'); }
        }, 'Computer control')),
        row('Keyboard safety', 'Zero only types into a window it opened or focused itself', badge('always on', 'ok'))),
      card('Screen watching', 'screen',
        row('Local screen watching', o.running ? 'Zero notes which app and window you use' : 'Stopped', toggle(o.running, async on => {
          try { await call('zero.observation.control', { action: on ? 'start' : 'stop' }); paint(); } catch (e) { toast(e.message, 'error'); }
        }, 'Screen watching')),
        row('Private mode', 'Pause watching without turning it off', toggle(o.privateMode, async on => {
          try { await call('zero.observation.control', { action: on ? 'private-on' : 'private-off' }); paint(); } catch (e) { toast(e.message, 'error'); }
        }, 'Private mode')),
        row('Online screen share', live.screen?.mode === 'online' ? 'On — Gemini Live sees the screen' : 'Off', button('Open', () => go('/computer/screen'), { kind: 'ghost' }))),
    );
  };
  body.append(loading());
  await paint();
}

// ---------------------------------------------------------------- MCP
export async function mcp(root) {
  const listEl = h('div.list', loading());
  const load = async () => {
    try {
      const r = await call('plugins.list');
      const servers = (r?.plugins || []).filter(p => p.source?.kind === 'mcp' || p.kind === 'mcp' || /^mcp[:_]/.test(p.id));
      listEl.replaceChildren(...(servers.length ? servers.map(p => {
        const on = p.enabled !== false && p.state !== 'disabled';
        return h('div.item', icon('skills', 18),
          h('div.grow', h('div.title', p.name || p.id), h('div.sub', `${p.source?.spec || ''} · ${(p.capabilities || []).length} tools`)),
          toggle(on, async v => { try { await call(v ? 'plugins.enable' : 'plugins.disable', { id: p.id }); load(); } catch (e) { toast(e.message, 'error'); } }, 'Enabled'),
          h('button.iconbtn', { type: 'button', title: 'Remove', onclick: async () => {
            if (!(await confirmBox('Remove MCP server?', `${p.name || p.id} and its tools will be removed.`, 'Remove', true))) return;
            try { await call('plugins.uninstall', { id: p.id }); toast('Removed', 'ok'); load(); } catch (e) { toast(e.message, 'error'); }
          } }, icon('trash', 16)));
      }) : [empty('No MCP servers yet. Add one to give Zero new tools.', 'skills')]));
    } catch (e) { listEl.replaceChildren(h('div.callout.danger', e.message)); }
  };
  const add = async () => {
    const v = await formBox('Add an MCP server', [
      { name: 'pkg', label: 'npm package', required: true, placeholder: '@modelcontextprotocol/server-filesystem', hint: 'Zero installs it, starts it over stdio and reads its tool list.' },
      { name: 'args', label: 'Arguments (one per line)', type: 'textarea', rows: 3, placeholder: 'E:\\work' },
      { name: 'bin', label: 'Command name inside the package (optional)' },
    ], 'Install');
    if (!v) return;
    toast('Installing ' + v.pkg + '… this can take a minute');
    try {
      await call('plugins.install', { source: { mcpPackage: v.pkg.trim(), args: v.args.split('\n').map(x => x.trim()).filter(Boolean), ...(v.bin.trim() ? { bin: v.bin.trim() } : {}) } }, { timeoutMs: 600000 });
      toast('MCP server added', 'ok'); load();
    } catch (e) { toast(e.message, 'error'); }
  };
  root.append(head('MCP servers', 'Model Context Protocol servers add tools Zero can call, just like its own.'),
    h('div.card.section-card', h('div.card-head', h('h2', icon('skills'), 'Servers'), h('span.spacer'), button('Add server', add, { kind: 'primary', iconName: 'plus' })), listEl));
  load();
}

// ---------------------------------------------------------------- Gateway
export async function gateway(root) {
  const body = h('div', loading());
  root.append(head('Gateway', 'The Zero host on this computer: address, speed and health.'), body);
  const ping = async () => {
    const samples = [];
    for (let i = 0; i < 5; i++) { const t = performance.now(); await call('last-heartbeat', {}, { timeoutMs: 5000 }); samples.push(performance.now() - t); }
    samples.sort((a, b) => a - b);
    return { p50: samples[2], max: samples[4] };
  };
  const [gw, health, p] = await Promise.all([
    call('zero.gateway.status').catch(() => null),
    fetch('/health/readiness').then(r => r.json()).catch(() => null),
    ping().catch(() => null),
  ]);
  body.replaceChildren(
    card('Connection', 'status', h('dl.kv',
      h('dt', 'Address'), h('dd', h('span.mono', `ws://${location.host}/`)),
      h('dt', 'Bound to'), h('dd', `${gw?.host || '127.0.0.1'}:${gw?.port || 18789} (this PC only)`),
      h('dt', 'Response time'), h('dd', p ? `${p.p50.toFixed(1)} ms typical, ${p.max.toFixed(1)} ms slowest` : 'unavailable'),
      h('dt', 'Up for'), h('dd', gw ? `${Math.round(gw.uptimeSeconds / 60)} min (started ${new Date(gw.bootedAt).toLocaleString()})` : '—'),
      h('dt', 'Process'), h('dd', gw ? `pid ${gw.pid} · Node ${gw.nodeVersion} · ${bytes(gw.memory?.rss)} memory` : '—'))),
    card('Services', 'check', h('div.list', Object.entries(health?.services || {}).map(([k, v]) => h('div.item', h('div.grow', h('div.title', k)), badge(v, v === 'ready' ? 'ok' : 'warn'))))),
    card('Model API for other apps', 'model', h('p.muted', { style: { marginTop: 0 } }, 'Other programs on this PC can use Zero\'s models through an OpenAI-compatible endpoint.'),
      h('dl.kv', h('dt', 'Models'), h('dd', h('span.mono', `http://${location.host}/v1/models`)), h('dt', 'Chat'), h('dd', h('span.mono', `http://${location.host}/v1/chat/completions`)))),
    card('Restart', 'refresh', row('Restart the Zero host', 'Running tasks stop; this page reconnects by itself', button('Restart', async () => {
      if (!(await confirmBox('Restart Zero?', 'Running tasks stop. The UI reconnects by itself.', 'Restart', true))) return;
      try { await call('zero.gateway.restart', {}); toast('Restarting…', 'warn'); } catch (e) { toast(e.message, 'error'); }
    }, { kind: 'danger' }))));
}

// ---------------------------------------------------------------- Devices
export async function devices(root) {
  const listEl = h('div.list', loading());
  const load = async () => {
    const r = await call('devices.list').catch(e => ({ error: e.message }));
    const list = r?.devices || [];
    listEl.replaceChildren(...(r.error ? [h('div.callout.danger', r.error)] : list.length ? list.map(d => h('div.item', icon('computer', 18),
      h('div.grow', h('div.title', d.displayName || d.name || d.id), h('div.sub', `${d.platform || ''}${d.lastSeen ? ' · seen ' + timeAgo(d.lastSeen) : ''}`)),
      badge(d.connected ? 'online' : (d.status || 'offline'), d.connected ? 'ok' : ''),
      d.id !== 'local-desktop' ? h('button.iconbtn', { type: 'button', title: 'Unpair', onclick: async () => {
        if (!(await confirmBox('Unpair device?', `${d.displayName || d.id} will lose access.`, 'Unpair', true))) return;
        try { await call('devices.unpair', { id: d.id }); load(); } catch (e) { toast(e.message, 'error'); }
      } }, icon('trash', 16)) : null)) : [empty('No devices.', 'computer')]));
  };
  const pair = async () => {
    try {
      const r = await call('devices.pair.generateCode', { label: 'New device' });
      modal('Pair a device', h('div.stack', h('p', 'Enter this code on the other device. It works for a few minutes.'),
        h('div.paircode', r.code || r.pairingCode || '—'), r.expiresAt ? h('div.faint', { style: { textAlign: 'center' } }, 'Expires ' + new Date(r.expiresAt).toLocaleTimeString()) : null));
    } catch (e) { toast(e.message, 'error'); }
  };
  root.append(head('Devices', 'Computers and phones paired with this Zero.'),
    h('div.card.section-card', h('div.card-head', h('h2', icon('computer'), 'Paired devices'), h('span.spacer'), button('Pair a device', pair, { kind: 'primary', iconName: 'plus' })), listEl));
  load();
}

// ---------------------------------------------------------------- Labs
export async function labs(root, { go }) {
  await refreshLive();
  const s = live.screen || {};
  root.append(head('Labs', 'Experimental abilities. They work, but may be slow or change.'),
    card('Experiments', 'spark',
      row('Gemini Computer Use', 'Online only: Zero finds where to click by looking at screenshots (slow, ~10 s a step)', badge(s.mode === 'online' ? 'available' : 'needs online screen share', s.mode === 'online' ? 'ok' : 'warn')),
      row('Self-learning procedures', 'After a task works, Zero saves the steps and reuses them next time', badge('on', 'ok')),
      row('Team delegation', 'Zero splits big goals across specialist agents', button('Open Agents', () => go('/work/agents'), { kind: 'ghost' })),
      row('Long goals', 'Multi-day plans with milestones that advance on a schedule', button('Open Automations', () => go('/work/automations'), { kind: 'ghost' })),
      row('Local GGUF models', 'Run a model on this PC without internet', button('Open Models', () => go('/settings/models'), { kind: 'ghost' }))),
    card('Not available yet', 'close', h('p.muted', { style: { marginTop: 0 } }, 'Local vision (SmolVLM), the fast input daemon and spoken Gemini replies are not running on this PC. See Status for why.'),
      button('Open Status', () => go('/settings/status'), { kind: 'ghost' })));
}

// ---------------------------------------------------------------- Advanced
export async function advanced(root) {
  const area = h('textarea.mono.config-editor', { rows: 24, spellcheck: false });
  const note = h('div.faint');
  let original = '';
  const load = async () => {
    try { const r = await call('config.get'); original = JSON.stringify(r?.config ?? r, null, 2); area.value = original; note.textContent = 'Loaded from zero-system/config/zero.json'; }
    catch (e) { note.textContent = e.message; }
  };
  const save = async () => {
    let parsed;
    try { parsed = JSON.parse(area.value); } catch (e) { return toast('Not valid JSON: ' + e.message, 'error'); }
    if (area.value === original) return toast('Nothing changed');
    if (!(await confirmBox('Save configuration?', 'Your changes are merged into zero.json (keys you delete are kept). A wrong value can stop features from working.', 'Save', true))) return;
    try { await call('config.apply', { raw: area.value, config: parsed }); toast('Configuration saved', 'ok'); load(); } catch (e) { toast(e.message, 'error'); }
  };
  root.append(head('Advanced', 'The raw Zero configuration. Change it only if you know what a setting does.'),
    h('div.card.section-card', h('div.card-head', h('h2', icon('settings'), 'zero.json'), h('span.spacer'),
      button('Reload', load, { iconName: 'refresh', kind: 'ghost' }), button('Save', save, { kind: 'primary' })), area, note));
  load();
}

// ---------------------------------------------------------------- About
export async function about(root, { go }) {
  const [u, info] = await Promise.all([call('update.status').catch(() => null), call('system.info').catch(() => null)]);
  root.append(head('About', null),
    h('div.card.about-hero', h('div.logo', { style: { width: '56px', height: '56px', borderRadius: '18px' } }, h('span')),
      h('div', h('h2', { style: { margin: 0, fontSize: '1.5em' } }, 'Zero'), h('p.muted', { style: { margin: '4px 0 0' } }, 'A personal commander that runs on your own Windows PC.'))),
    card('Version', 'dot', h('dl.kv', h('dt', 'Zero'), h('dd', u?.currentVersion || '1.0.0'), h('dt', 'Runtime'), h('dd', `Node ${info?.nodeVersion || ''} · ${info?.osLabel || ''}`), h('dt', 'Computer'), h('dd', info?.hostname || '—'))),
    card('Privacy', 'key', h('p.muted', { style: { margin: 0 } }, 'Zero runs on this computer and listens only on 127.0.0.1. Your chats, memory and screen notes stay here. Text goes to a model provider only for the model you choose; the screen goes to Google only while online screen share is on.')),
    card('Help', 'spark', h('div.row', button('What works / what is offline', () => go('/settings/status'), { kind: 'ghost' }), button('Keyboard: Ctrl K to jump anywhere', null, { kind: 'ghost' }))));
}
