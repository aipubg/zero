import { call } from '../rpc.js';
import { h, icon, badge, toast, button, timeAgo, empty } from '../ui.js';
import { onLive, refreshLive, live } from '../app.js';

export async function render(root, { go }) {
  const stops = [];
  const statusCard = h('div.card');
  const observeCard = h('div.card');
  const recentEl = h('div.list');
  const askInput = h('input', { placeholder: 'Ask about what is on the screen…', autocomplete: 'off' });
  const answerEl = h('div');
  const askBtn = button('Ask', () => ask(), { kind: 'primary', iconName: 'spark' });

  function paintStatus() {
    const s = live.screen || {};
    const online = s.mode === 'online';
    const seg = h('div.seg', ...[['auto', 'Auto (online when possible)'], ['offline', 'Offline only']].map(([value, label]) =>
      h('button' + (s.preference === value ? '.active' : ''), { type: 'button', onclick: async () => {
        try { await call('zero.screenShare.setMode', { preference: value }); toast(value === 'offline' ? 'Screen share stays local (offline)' : 'Screen share goes online when Gemini is set up', 'ok'); refreshLive(); }
        catch (e) { toast(e.message, 'error'); }
      } }, label)));
    statusCard.replaceChildren(
      h('div.card-head', icon('screen', 20), h('h2', 'Screen share'), h('span.spacer'),
        badge(online ? (s.paused ? 'online · paused' : 'online · Gemini Live') : s.mode === 'connecting' ? 'connecting' : 'offline · local', online && !s.paused ? 'ok' : s.mode === 'connecting' ? 'info' : '')),
      h('p.muted', { style: { marginTop: 0 } }, online
        ? 'Zero sends your screen to Gemini Live (at most one frame a second, only when it changes) so it can see and help.'
        : (s.reason || 'Zero watches the screen locally on this PC. Nothing leaves your computer.')),
      h('div.row', h('strong', 'Mode'), seg),
      online ? h('dl.kv', { style: { marginTop: '12px' } }, h('dt', 'Live model'), h('dd', s.liveModel || '—'), h('dt', 'Frames sent'), h('dd', String(s.framesSent ?? 0)),
        h('dt', 'Minutes this hour'), h('dd', `${s.minutesUsedThisHour ?? 0} / ${s.maxMinutesPerHour ?? '—'}`)) : null,
      !s.provider ? h('div.callout', { style: { marginTop: '12px' } }, 'Online screen share is not set up.', h('button.btn.small', { type: 'button', onclick: () => go('/models') }, 'Set up Gemini')) : null,
    );
  }

  function paintObserve() {
    const o = live.observation || {};
    observeCard.replaceChildren(
      h('div.card-head', icon('computer', 20), h('h2', 'Local screen watching'), h('span.spacer'), badge(o.running ? (o.privateMode ? 'private' : 'on') : 'off', o.running && !o.privateMode ? 'ok' : 'warn')),
      h('p.muted', { style: { marginTop: 0 } }, 'Zero keeps short notes of which app and window you were using, so it can answer “what was I doing?”. Private mode pauses it.'),
      h('div.row',
        o.running ? button('Stop', () => control('stop'), { kind: 'danger' }) : button('Start', () => control('start'), { kind: 'primary' }),
        button(o.privateMode ? 'Leave private mode' : 'Private mode', () => control(o.privateMode ? 'private-off' : 'private-on')),
        h('span.faint', o.counters?.processed ? `${o.counters.processed} moments noted` : '')),
      o.lastError ? h('div.callout.danger', { style: { marginTop: '10px' } }, o.lastError) : null,
    );
  }

  async function control(action) {
    try { await call('zero.observation.control', { action }); toast('Done', 'ok'); await refreshLive(); loadRecent(); }
    catch (e) { toast(e.message, 'error'); }
  }

  async function loadRecent() {
    try {
      const r = await call('zero.observation.recent', { limit: 25 });
      const items = r?.observations || [];
      recentEl.replaceChildren(...(items.length ? items.map(o => h('div.item', icon('screen', 16),
        h('div.grow', h('div.title', o.window || o.app || 'Screen'), h('div.sub', `${o.app || ''}${o.summary ? ' · ' + o.summary : ''}`)),
        h('span.faint', timeAgo(o.capturedAt)))) : [empty('Nothing noted yet.', 'screen')]));
    } catch (e) { recentEl.replaceChildren(h('div.faint', e.message)); }
  }

  async function ask() {
    const question = askInput.value.trim() || 'What is on the screen right now?';
    askBtn.disabled = true;
    answerEl.replaceChildren(h('div.loading', h('span.spinner'), 'Looking at the screen…'));
    try {
      if (live.screen?.mode === 'online') {
        const r = await call('zero.screenShare.ask', { question }, { timeoutMs: 90000 });
        answerEl.replaceChildren(h('div.callout.ok', r?.text || r?.answer || r?.error || 'No answer'));
      } else {
        // Offline: let Zero look with its local tools in a chat.
        go('/chat?new=1&ask=' + encodeURIComponent(question + ' (look at my screen)'));
      }
    } catch (e) { answerEl.replaceChildren(h('div.callout.danger', e.message)); }
    finally { askBtn.disabled = false; }
  }
  askInput.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Setup'), h('h1', 'Screen share'), h('p', 'Online, Zero uses Gemini Live to see your screen. Offline, it watches locally. You choose.'))),
    h('div.grid.g2', { style: { alignItems: 'start', marginBottom: 'var(--gap)' } }, statusCard, observeCard),
    h('div.card', { style: { marginBottom: 'var(--gap)' } }, h('h2', icon('spark'), 'Ask about the screen'), h('div.row', { style: { flexWrap: 'nowrap' } }, askInput, askBtn), h('div', { style: { marginTop: '10px' } }, answerEl)),
    h('div.card', h('div.card-head', h('h2', icon('clock'), 'Recently seen'), h('span.spacer'), h('button.iconbtn', { type: 'button', onclick: loadRecent, title: 'Refresh' }, icon('refresh'))), recentEl),
  );
  stops.push(onLive(() => { paintStatus(); paintObserve(); }));
  refreshLive();
  loadRecent();
  return () => stops.forEach(fn => fn());
}
