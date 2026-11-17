import { call } from '../rpc.js';
import { h, icon, badge, button } from '../ui.js';
import { refreshLive, live, modelReady } from '../app.js';

// Things that are known to be off and why (checked 2026-11-18; see docs/UI-STATUS.md).
const KNOWN_OFFLINE = [
  ['zero-desktop runtime', 'Not installed; its installer download link is broken. Zero uses its own Windows hands instead.', 'Install the runtime when the installer is fixed'],
  ['Local vision (SmolVLM)', 'Model files exist but no runtime runs them.', '—'],
  ['Fast input daemon', 'Windows Defender blocks it, so Zero uses the slower one-off path for mouse and keys.', 'Add a Defender exclusion (your decision)'],
  ['Realtime talk provider', 'None configured. Voice uses the browser microphone and Windows speech.', '—'],
  ['Gemini Live spoken replies', 'The setting exists; audio playback is not built yet.', '—'],
  ['Secrets store, approval decisions', 'The host only pretends to save these (stubs), so the new UI does not offer them.', 'Needs a real backend'],
  ['Skill registry, Skill workshop, Memory import, GitHub identity', 'Features of the old vendored UI; Zero never had a backend for them.', 'Removed'],
  ['Backups', 'No backup target is set.', '—'],
  ['Channels, MCP servers, cloud workers', 'Not configured.', '—'],
];

export async function render(root, { go }) {
  const liveEl = h('div');

  async function check() {
    liveEl.replaceChildren(h('div.loading', h('span.spinner'), 'Checking…'));
    await refreshLive();
    const [env, web, mem] = await Promise.all([
      call('environments.list').catch(() => null), call('webSearch.status').catch(() => null), call('doctor.memory.status').catch(() => null),
    ]);
    const s = live.screen, desktopEnv = (env?.environments || []).find(e => e.id === 'gateway');
    const rows = [
      ['Connection to Zero host', live.gateway ? 'ok' : 'off', live.gateway ? `Running ${Math.round((live.gateway.uptimeSeconds || 0) / 60)} min` : 'Not reachable', null],
      ['Chat model', modelReady() ? 'ok' : 'off', modelReady() ? (live.models?.defaultModel || 'ready') : 'No provider has an API key — chat cannot reply', modelReady() ? null : ['Add key', '/models']],
      ['Online screen share (Gemini Live)', s?.mode === 'online' ? 'ok' : 'off', s?.mode === 'online' ? `Online · ${s.liveModel}` : (s?.reason || 'Off'), s?.mode === 'online' ? null : ['Set up', '/models']],
      ['Local screen watching', live.observation?.running ? 'ok' : 'off', live.observation?.running ? (live.observation.privateMode ? 'Private mode' : 'On') : 'Stopped', live.observation?.running ? null : ['Open', '/screen']],
      ['Voice (speech & listening)', live.voice?.ready ? 'ok' : 'off', live.voice?.ready ? `${live.voice.tts} / ${live.voice.asr}` : 'Not ready', null],
      ['Computer control (Windows hands)', live.hold?.held ? 'warn' : 'ok', live.hold?.held ? 'You are holding the computer' : 'Ready', null],
      ['Web search', web?.enabled ? 'ok' : 'off', web?.enabled ? web.provider || 'on' : 'Off', null],
      ['Memory', mem && mem.ok !== false ? 'ok' : 'warn', mem?.status || (mem ? 'Working' : 'Unknown'), null],
      ['Desktop environment', desktopEnv?.desktop?.available ? 'ok' : 'off', desktopEnv?.desktopSetup?.state || (desktopEnv ? desktopEnv.status : 'Unknown'), null],
    ];
    liveEl.replaceChildren(h('table.status-table',
      h('thead', h('tr', h('th', 'Feature'), h('th', 'State'), h('th', 'Details'), h('th', ''))),
      h('tbody', rows.map(([name, state, detail, action]) => h('tr',
        h('td', h('strong', name)),
        h('td', badge(state === 'ok' ? 'working' : state === 'warn' ? 'attention' : 'offline', state === 'ok' ? 'ok' : state === 'warn' ? 'warn' : 'danger')),
        h('td.muted', String(detail)),
        h('td', action ? h('button.btn.small', { type: 'button', onclick: () => go(action[1]) }, action[0]) : null)))),
    ));
  }

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Setup'), h('h1', 'Status'), h('p', 'What works right now, and what is offline and why.')),
      h('div.actions', button('Check again', check, { iconName: 'refresh' }))),
    h('div.card', { style: { marginBottom: 'var(--gap)' } }, h('h2', icon('status'), 'Live check'), liveEl),
    h('div.card', h('h2', icon('close'), 'Known offline'), h('table.status-table',
      h('thead', h('tr', h('th', 'Feature'), h('th', 'Why'), h('th', 'To turn it on'))),
      h('tbody', KNOWN_OFFLINE.map(([name, why, fix]) => h('tr', h('td', h('strong', name)), h('td.muted', why), h('td.muted', fix)))))),
  );
  await check();
}
