import { call } from '../rpc.js';
import { h, icon, badge, toast, button, empty, timeAgo, confirmBox, bytes, modal } from '../ui.js';
import { look, saveLook } from '../theme.js';
import * as voice from '../voice.js';

export async function render(root) {
  const tabs = h('div.tabs');
  const body = h('div');
  const TABS = [['voice', 'Voice'], ['devices', 'Devices'], ['approvals', 'Approvals'], ['system', 'System']];
  const setTab = id => { for (const b of tabs.children) b.classList.toggle('active', b.dataset.tab === id); history.replaceState(null, '', '/settings?tab=' + id); PAINT[id](); };
  for (const [id, label] of TABS) tabs.append(h('button.tab', { type: 'button', 'data-tab': id, onclick: () => setTab(id) }, label));
  const setting = (title, sub, control) => h('div.setting', h('div.label', h('strong', title), sub ? h('small', sub) : null), h('div.control', control));
  const busy = () => body.replaceChildren(h('div.loading', h('span.spinner'), 'Loading…'));

  async function pair() {
    try {
      const r = await call('devices.pair.generateCode', { label: 'New device' });
      const code = r.code || r.pairingCode || r.token;
      modal('Pair a device', h('div.stack',
        h('p', 'On the other device, open Zero and enter this code. It works for a few minutes.'),
        h('div', { style: { fontSize: '2.2em', fontWeight: 800, letterSpacing: '.2em', textAlign: 'center' } }, code || '—'),
        r.expiresAt ? h('div.faint', { style: { textAlign: 'center' } }, 'Expires ' + new Date(r.expiresAt).toLocaleTimeString()) : null));
    } catch (e) { toast(e.message, 'error'); }
  }

  const PAINT = {
    async voice() {
      busy();
      const status = await call('voice.status').catch(e => ({ error: e.message }));
      const list = voice.voices();
      const select = h('select', { style: { width: '260px' }, onchange: e => saveLook({ voiceName: e.target.value }) },
        h('option', { value: '' }, 'Automatic (matches the language)'), list.map(v => h('option', { value: v.name, selected: v.name === look.voiceName }, `${v.name} · ${v.lang}`)));
      body.replaceChildren(h('div.card',
        h('h2', icon('voice'), 'Voice'),
        setting('Zero voice engine', status.error || `${status.provider || ''} · speech ${status.tts || '—'} · listening ${status.asr || '—'}`, badge(status.ready ? 'ready' : 'not ready', status.ready ? 'ok' : 'warn')),
        setting('Speech input in this browser', voice.canListen ? 'Click the microphone in Chat and speak (Hindi or English)' : 'This browser cannot listen — use Chrome or Edge', badge(voice.canListen ? 'available' : 'unavailable', voice.canListen ? 'ok' : 'warn')),
        setting('Reply voice', list.length ? 'Voice used to read replies aloud' : 'No voices in this browser — Windows speech is used', list.length ? select : badge('Windows speech')),
        setting('Read replies aloud', 'Every reply in Chat is spoken', h('button.switch', { type: 'button', role: 'switch', 'aria-checked': String(look.speakReplies), onclick: e => { saveLook({ speakReplies: !look.speakReplies }); e.currentTarget.setAttribute('aria-checked', String(look.speakReplies)); } })),
        setting('Test', null, button('Say hello', () => voice.speak('Namaste! Main Zero hoon. Main aapki madad ke liye taiyaar hoon.'), { iconName: 'speaker' })),
      ));
    },

    async devices() {
      busy();
      const r = await call('devices.list').catch(e => ({ error: e.message }));
      const devices = r?.devices || [];
      body.replaceChildren(h('div.card',
        h('div.card-head', h('h2', icon('computer'), 'Devices'), h('span.spacer'), button('Pair a phone or PC', pair, { kind: 'primary', iconName: 'plus' })),
        r?.error ? h('div.callout.danger', r.error) : null,
        devices.length ? h('div.list', devices.map(d => h('div.item', icon('computer', 18),
          h('div.grow', h('div.title', d.displayName || d.name || d.id), h('div.sub', `${d.platform || ''}${d.lastSeen ? ' · seen ' + timeAgo(d.lastSeen) : ''}`)),
          badge(d.status || (d.connected ? 'online' : 'offline'), d.connected ? 'ok' : ''),
          d.id !== 'local-desktop' ? h('button.iconbtn', { type: 'button', title: 'Unpair', onclick: async () => {
            if (!(await confirmBox('Unpair device?', `${d.displayName || d.id} will lose access to Zero.`, 'Unpair', true))) return;
            try { await call('devices.unpair', { id: d.id }); toast('Unpaired', 'ok'); PAINT.devices(); } catch (e) { toast(e.message, 'error'); }
          } }, icon('trash', 16)) : null))) : empty('No devices.', 'computer'),
      ));
    },

    async approvals() {
      busy();
      const r = await call('zero.approval.list').catch(e => ({ error: e.message }));
      const items = [...(r?.items || []), ...(r?.history || [])];
      body.replaceChildren(h('div.card',
        h('h2', icon('check'), 'Approvals'),
        h('p.muted', { style: { marginTop: 0 } }, 'Actions Zero asked permission for. Zero asks inside the chat when it needs a yes from you.'),
        r?.error ? h('div.callout.danger', r.error) : null,
        items.length ? h('div.list', items.map(a => h('div.item', icon('check', 16), h('div.grow', h('div.title', a.title || a.action || a.id), h('div.sub', a.reason || a.summary || '')), badge(a.status || a.decision || 'pending')))) : empty('Nothing waiting for approval.', 'check'),
      ));
    },

    async system() {
      busy();
      const [info, gw, update, cli] = await Promise.all([
        call('system.info').catch(() => null), call('zero.gateway.status').catch(() => null), call('update.status').catch(() => null), call('zero.integrations.connectors.status').catch(() => null),
      ]);
      const restart = async () => {
        if (!(await confirmBox('Restart Zero?', 'The Zero host restarts. Running tasks stop; this page reconnects by itself.', 'Restart', true))) return;
        try { await call('zero.gateway.restart', {}); toast('Restarting Zero…', 'warn'); } catch (e) { toast(e.message, 'error'); }
      };
      body.replaceChildren(h('div.grid.g2', { style: { alignItems: 'start' } },
        h('div.card', h('h2', icon('computer'), 'This computer'), info ? h('dl.kv',
          h('dt', 'Name'), h('dd', info.hostname || '—'), h('dt', 'System'), h('dd', info.osLabel || info.platform || '—'),
          h('dt', 'Processor'), h('dd', info.cpuModel || '—'), h('dt', 'Memory'), h('dd', info.totalMemory ? `${bytes(info.freeMemory)} free of ${bytes(info.totalMemory)}` : '—'),
          h('dt', 'Node'), h('dd', info.nodeVersion || '—')) : h('div.faint', 'Not available')),
        h('div.card', h('div.card-head', h('h2', icon('status'), 'Zero host'), h('span.spacer'), button('Restart', restart, { kind: 'danger', iconName: 'refresh' })), gw ? h('dl.kv',
          h('dt', 'Status'), h('dd', gw.status), h('dt', 'Address'), h('dd', `${gw.host}:${gw.port}`), h('dt', 'Up for'), h('dd', `${Math.round((gw.uptimeSeconds || 0) / 60)} min`),
          h('dt', 'Memory used'), h('dd', bytes(gw.memory?.rss)), h('dt', 'Version'), h('dd', update?.currentVersion || '—')) : h('div.faint', 'Not available')),
        h('div.card', { style: { gridColumn: '1 / -1' } }, h('h2', icon('globe'), 'Connections'), h('div.list', (cli?.connectors || []).map(c => h('div.item', icon('dot', 14),
          h('div.grow', h('div.title', c.id), h('div.sub', c.type || '')), badge(c.configured ? 'configured' : 'not configured', c.configured ? 'ok' : 'warn'))))),
      ));
    },
  };

  root.append(h('div.head', h('div', h('div.eyebrow', 'Setup'), h('h1', 'Settings'), h('p', 'Voice, devices, approvals and the Zero host.'))), tabs, body);
  const params = new URLSearchParams(location.search);
  setTab(TABS.some(t => t[0] === params.get('tab')) ? params.get('tab') : 'voice');
}
