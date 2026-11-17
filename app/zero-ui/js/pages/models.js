import { call } from '../rpc.js';
import { h, icon, badge, toast, formBox, confirmBox, empty, button, modal } from '../ui.js';
import { refreshLive } from '../app.js';

// Ready-made provider settings: the owner only pastes a key.
const PRESETS = [
  { id: 'nv', name: 'NVIDIA', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'nvidia/nemotron-3.5-super-vl-120b-a12b', keyHint: 'nvapi-…  (build.nvidia.com → Get API key)' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-5.1-mini', keyHint: 'sk-…' },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/', model: 'gemini-3.5-flash', keyHint: 'AIza…  (aistudio.google.com)' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/auto', keyHint: 'sk-or-…' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', keyHint: 'gsk_…' },
  { id: 'ollama', name: 'Ollama (local, no key)', baseUrl: 'http://127.0.0.1:11434/v1', model: 'llama3.2', keyHint: 'leave empty' },
  { id: 'custom', name: 'Other (OpenAI-compatible)', baseUrl: '', model: '', keyHint: '' },
];

export async function render(root) {
  const providersEl = h('div.stack');
  const defaultEl = h('div');
  const geminiEl = h('div');

  async function load() {
    providersEl.replaceChildren(h('div.loading', h('span.spinner'), 'Loading…'));
    let data, auth;
    try { [data, auth] = await Promise.all([call('zero.providers.list'), call('models.authStatus').catch(() => null)]); }
    catch (error) { providersEl.replaceChildren(h('div.callout.danger', error.message)); return; }
    const providers = (data?.providers || []).filter(p => p.id !== 'gemini-live-screen');
    const keyState = id => auth?.providers?.find(p => p.provider === id)?.keyState;

    providersEl.replaceChildren(...(providers.length ? providers.map(p => {
      const hasKey = p.hasApiKey || keyState(p.id) === 'present' || keyState(p.id) === 'not-required';
      const health = data.health?.[p.id];
      return h('div.card',
        h('div.card-head', icon('model', 20), h('h2', p.name || p.id), badge(p.id), h('span.spacer'),
          hasKey ? badge('key saved', 'ok') : badge('no key', 'warn'), p.enabled === false ? badge('off', 'warn') : null),
        h('div.faint', p.baseUrl),
        h('div.row', { style: { margin: '10px 0' } }, ...(p.models || []).map(m => badge(m.id || m))),
        health?.lastError ? h('div.callout.danger', { style: { marginBottom: '10px' } }, 'Last error: ' + health.lastError) : null,
        h('div.row',
          button(hasKey ? 'Replace key' : 'Add API key', () => setKey(p), { kind: hasKey ? '' : 'primary', iconName: 'key' }),
          button('Test', () => test(p), { iconName: 'check' }),
          button('Add model', () => addModel(p), { iconName: 'plus' }),
          h('span.spacer'),
          button(p.enabled === false ? 'Turn on' : 'Turn off', () => save({ id: p.id, enabled: p.enabled === false }), { kind: 'ghost' }),
          button('Remove', () => remove(p), { kind: 'danger', iconName: 'trash' })),
      );
    }) : [empty('No model providers yet. Add one to let Zero think and reply.', 'model')]));

    // default model
    const all = providers.flatMap(p => (p.models || []).map(m => ({ provider: p.id, id: m.id || m })));
    const current = data?.agentBindings?.zero?.model || data?.defaults?.primary || '';
    const select = h('select', all.map(m => h('option', { value: `${m.provider}/${m.id}`, selected: `${m.provider}/${m.id}` === current }, `${m.id} · ${m.provider}`)));
    defaultEl.replaceChildren(h('div', all.length ? h('div.row', { style: { flexWrap: 'nowrap' } }, select, button('Use as default', async () => {
      try { await call('zero.providers.setActive', { model: select.value }); toast('Default model saved', 'ok'); refreshLive(); load(); }
      catch (e) { toast(e.message, 'error'); }
    }, { kind: 'primary' })) : h('div.faint', 'Add a provider first.'),
    data?.assignmentError ? h('div.callout.warn', { style: { marginTop: '10px' } }, data.assignmentError) : null));

    paintGemini(data?.providers?.find(p => p.id === 'gemini-live-screen'));
  }

  async function save(payload, okText) {
    try { await call('zero.providers.save', payload); if (okText) toast(okText, 'ok'); await refreshLive(); load(); return true; }
    catch (error) { toast(error.message, 'error'); return false; }
  }

  async function setKey(p) {
    const v = await formBox(`API key for ${p.name || p.id}`, [{ name: 'apiKey', label: 'API key', type: 'password', required: true, hint: 'Saved on this computer only, never shown again.' }], 'Save key');
    if (!v) return;
    if (await save({ id: p.id, apiKey: v.apiKey.trim() }, 'Key saved')) test(p, true);
  }

  async function test(p, quiet) {
    if (!quiet) toast('Testing ' + (p.name || p.id) + '…');
    try {
      const r = await call('zero.providers.test', { id: p.id, providerId: p.id }, { timeoutMs: 60000 });
      const ok = r?.ok !== false && !r?.error;
      toast(ok ? `${p.name || p.id} works${r?.latencyMs ? ` (${r.latencyMs} ms)` : ''}` : `${p.name || p.id}: ${r?.error || r?.message || 'test failed'}`, ok ? 'ok' : 'error');
    } catch (e) { toast(`${p.name || p.id}: ${e.message}`, 'error'); }
  }

  async function addModel(p) {
    const v = await formBox('Add a model to ' + (p.name || p.id), [{ name: 'model', label: 'Model id', required: true, placeholder: 'e.g. gpt-5.1-mini' }], 'Add');
    if (!v) return;
    const ids = (p.models || []).map(m => m.id || m);
    if (ids.includes(v.model.trim())) return toast('Already there');
    save({ id: p.id, models: [...ids, v.model.trim()] }, 'Model added');
  }

  async function remove(p) {
    if (!(await confirmBox('Remove provider?', `${p.name || p.id} and its saved key will be removed from Zero.`, 'Remove', true))) return;
    try { await call('zero.providers.delete', { id: p.id }); toast('Removed', 'ok'); refreshLive(); load(); } catch (e) { toast(e.message, 'error'); }
  }

  async function addProvider() {
    const v = await formBox('Add a model provider', [
      { name: 'preset', label: 'Provider', type: 'select', value: 'nv', options: PRESETS.map(p => ({ value: p.id, label: p.name })) },
      { name: 'apiKey', label: 'API key', type: 'password', placeholder: 'Paste the key (not needed for Ollama)' },
      { name: 'model', label: 'Model id (optional — a good default is used)', placeholder: '' },
      { name: 'baseUrl', label: 'Base URL (only for “Other”)', placeholder: 'https://…/v1' },
      { name: 'id', label: 'Short id (only for “Other”)', placeholder: 'myprovider' },
    ], 'Add provider');
    if (!v) return;
    const preset = PRESETS.find(p => p.id === v.preset);
    const id = preset.id === 'custom' ? v.id.trim() : preset.id;
    const baseUrl = preset.id === 'custom' ? v.baseUrl.trim() : preset.baseUrl;
    const model = v.model.trim() || preset.model;
    if (!id || !baseUrl || !model) return toast('Id, base URL and model are needed', 'error');
    const payload = { id, name: preset.id === 'custom' ? id : preset.name, baseUrl, api: 'openai-completions', models: [model], enabled: true };
    if (v.apiKey.trim()) payload.apiKey = v.apiKey.trim();
    if (await save(payload, preset.name + ' added')) test({ id, name: payload.name }, true);
  }

  function paintGemini(p) {
    const on = p?.screenShare?.enabled && p?.hasApiKey;
    geminiEl.replaceChildren(h('div.card', { style: { borderColor: 'rgba(var(--b-rgb), .45)' } },
      h('div.card-head', h('span.icon', { html: '<svg viewBox="0 0 24 24"><path fill="url(#gz)" d="M12 2c.6 5.3 4.7 9.4 10 10-5.3.6-9.4 4.7-10 10-.6-5.3-4.7-9.4-10-10 5.3-.6 9.4-4.7 10-10z"/><defs><linearGradient id="gz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4285f4"/><stop offset=".55" stop-color="#9b72cb"/><stop offset="1" stop-color="#d96570"/></linearGradient></defs></svg>', style: { width: '22px', height: '22px' } }),
        h('h2', 'Gemini Live Screen Share'), h('span.spacer'), badge(on ? 'on' : p?.hasApiKey ? 'off' : 'needs key', on ? 'ok' : 'warn')),
      h('p.muted', { style: { marginTop: 0 } }, 'Online, Zero sees your screen through Gemini Live and finds where to click. Offline it keeps its local screen share. Needs only a Gemini API key.'),
      h('div.row', button(p?.hasApiKey ? 'Replace key / turn on' : 'Set up with a Gemini key', () => geminiSetup(), { kind: 'primary', iconName: 'key' }),
        on ? button('Turn off', async () => { try { await call('zero.screenShare.setup', { enabled: false }); toast('Online screen share is off', 'ok'); refreshLive(); load(); } catch (e) { toast(e.message, 'error'); } }) : null),
    ));
  }

  async function geminiSetup() {
    const status = h('div.faint');
    const input = h('input', { type: 'password', placeholder: 'AIza…', autocomplete: 'off' });
    const go = button('Save & turn on', async () => {
      go.disabled = true; status.textContent = 'Checking the key and connecting to Gemini Live… (up to a minute)'; status.style.color = 'var(--info)';
      try {
        const key = input.value.trim();
        const r = await call('zero.screenShare.setup', key ? { apiKey: key } : {}, { timeoutMs: 120000 });
        if (!r?.ok) throw new Error(r?.error || 'Setup failed');
        toast(`Gemini Live Screen Share is on (${r.liveModel}).`, 'ok');
        box.close(); refreshLive(); load();
      } catch (e) { status.textContent = '✖ ' + e.message; status.style.color = 'var(--danger)'; go.disabled = false; }
    }, { kind: 'primary' });
    const box = modal('Gemini Live Screen Share', h('div.stack', h('p', 'Paste your Gemini API key (aistudio.google.com → Get API key). Zero checks it, picks the models and turns screen share on. The key stays on this computer.'), input, status), { actions: [button('Cancel', () => box.close()), go] });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
    setTimeout(() => input.focus(), 30);
  }

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Setup'), h('h1', 'Models'), h('p', 'The AI models Zero thinks with. Add a provider, paste its key, pick a default.')),
      h('div.actions', h('button.btn.primary', { type: 'button', onclick: addProvider }, icon('plus', 16), h('span', 'Add provider')))),
    h('div.grid.g2', { style: { alignItems: 'start', marginBottom: 'var(--gap)' } },
      h('div.card', h('h2', icon('spark'), 'Default model'), h('p.muted', { style: { marginTop: 0 } }, 'Used for chats set to Auto-Best.'), defaultEl),
      geminiEl),
    h('h2', { style: { fontSize: '1.05em' } }, 'Providers'),
    providersEl,
  );
  await load();
}
