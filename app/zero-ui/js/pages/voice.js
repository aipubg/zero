// Voice room: talk to Zero hands-free through Zero's own voice engine
// (Windows microphone + speech), plus this browser's voice settings.
import { call, on } from '../rpc.js';
import { h, icon, badge, toast, button, timeAgo } from '../ui.js';
import { look, saveLook } from '../theme.js';
import { mountOrb } from '../orb.js';
import * as browserVoice from '../voice.js';

const SESSION_KEY = 'zero-ui-voice-session';

export async function render(root, { go }) {
  const stops = [];
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) { sessionId = 'voice-' + new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 7); try { localStorage.setItem(SESSION_KEY, sessionId); } catch {} }
  let listening = false;
  let energy = 0.15;

  const canvas = h('canvas', { 'aria-label': 'Voice orb' });
  const state = h('div.voice-state', 'Ready');
  const talkBtn = h('button.talk', { type: 'button', onclick: () => toggle() }, icon('voice', 22), h('span', 'Talk to Zero'));
  const log = h('div.voice-log');
  const engine = h('div');

  const say = (who, text) => {
    log.prepend(h('div.voice-line.' + who, h('strong', who === 'you' ? 'You' : 'Zero'), h('span', text), h('small', new Date().toLocaleTimeString())));
  };

  async function toggle() {
    talkBtn.disabled = true;
    try {
      if (!listening) {
        await call('voice.microphone.start', { sessionId }, { timeoutMs: 30000 });
        listening = true; energy = 0.55;
        state.textContent = 'Listening… speak now';
        toast('Zero is listening through your microphone', 'ok');
      } else {
        await call('voice.microphone.stop', { sessionId }, { timeoutMs: 30000 });
        listening = false; energy = 0.15;
        state.textContent = 'Ready';
      }
    } catch (e) { toast(e.message, 'error'); state.textContent = 'Could not use the microphone: ' + e.message; }
    finally {
      talkBtn.disabled = false;
      talkBtn.classList.toggle('on', listening);
      talkBtn.querySelector('span').textContent = listening ? 'Stop listening' : 'Talk to Zero';
    }
  }

  stops.push(on('zero.voice.transcript', p => { if (p.sessionId !== sessionId) return; if (p.final !== false && p.text) { say('you', p.text); state.textContent = 'Thinking…'; energy = 0.8; } }));
  stops.push(on('zero.voice.turn-complete', p => { if (p.sessionId !== sessionId) return; if (p.reply || p.text || p.content) say('zero', p.reply || p.text || p.content); state.textContent = listening ? 'Listening… speak now' : 'Ready'; energy = listening ? 0.55 : 0.15; }));
  stops.push(on('zero.voice.turn-error', p => { if (p.sessionId !== sessionId) return; say('zero', '⚠ ' + (p.error || 'Something went wrong')); state.textContent = listening ? 'Listening…' : 'Ready'; }));
  stops.push(on('zero.voice.interrupted', p => { if (p.sessionId === sessionId) state.textContent = 'Interrupted — listening'; }));

  async function loadEngine() {
    const [st, conv] = await Promise.all([call('voice.status').catch(e => ({ error: e.message })), call('voice.conversation.status', { sessionId }).catch(() => null)]);
    if (conv?.attached && conv?.listening) { listening = true; talkBtn.classList.add('on'); talkBtn.querySelector('span').textContent = 'Stop listening'; state.textContent = 'Listening… speak now'; energy = 0.55; }
    const voices = st?.synthesis?.voices || [];
    const list = browserVoice.voices();
    const select = h('select', { style: { width: '260px' }, onchange: e => saveLook({ voiceName: e.target.value }) },
      h('option', { value: '' }, 'Automatic (matches the language)'), list.map(v => h('option', { value: v.name, selected: v.name === look.voiceName }, `${v.name} · ${v.lang}`)));
    engine.replaceChildren(
      h('div.card', h('h2', icon('status'), 'Zero voice engine'),
        h('div.setting', h('div.label', h('strong', 'Engine'), h('small', st.error || `${st.provider || ''} — speaks with ${st.tts || '—'}, listens with ${st.asr || '—'}`)), badge(st.ready ? 'ready' : 'not ready', st.ready ? 'ok' : 'warn')),
        h('div.setting', h('div.label', h('strong', 'Languages'), h('small', 'Speech recognition languages on this PC')), h('span', (st.recognition?.languages || []).join(', ') || '—')),
        h('div.setting', h('div.label', h('strong', 'Windows voices'), h('small', 'Used when Zero speaks from the host')), h('span', voices.map(v => v.name || v).slice(0, 4).join(', ') || '—')),
        h('div.setting', h('div.label', h('strong', 'Conversation'), h('small', 'Chat where voice turns are saved')), h('a', { href: '/chat?session=' + encodeURIComponent(sessionId), onclick: e => { e.preventDefault(); go('/chat?session=' + encodeURIComponent(sessionId)); } }, 'Open in Chat'))),
      h('div.card', h('h2', icon('speaker'), 'This browser'),
        h('div.setting', h('div.label', h('strong', 'Speech input in Chat'), h('small', browserVoice.canListen ? 'Microphone button in the chat box (Hindi or English)' : 'This browser cannot listen — use Chrome or Edge')), badge(browserVoice.canListen ? 'available' : 'unavailable', browserVoice.canListen ? 'ok' : 'warn')),
        h('div.setting', h('div.label', h('strong', 'Reply voice'), h('small', 'Voice used to read chat replies aloud')), list.length ? select : badge('Windows speech')),
        h('div.setting', h('div.label', h('strong', 'Read chat replies aloud'), h('small', 'Every reply in Chat is spoken')),
          h('button.switch', { type: 'button', role: 'switch', 'aria-checked': String(look.speakReplies), onclick: e => { saveLook({ speakReplies: !look.speakReplies }); e.currentTarget.setAttribute('aria-checked', String(look.speakReplies)); } })),
        h('div.setting', h('div.label', h('strong', 'Test')), button('Say hello', () => browserVoice.speak('Namaste! Main Zero hoon.'), { iconName: 'speaker' }))),
    );
  }

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Voice'), h('h1', 'Talk to Zero'), h('p', 'Hands-free: Zero listens through this PC\'s microphone, does the task and answers out loud.'))),
    h('div.voice-grid',
      h('div.card.voice-stage', h('div.voice-orb', canvas), state, talkBtn, h('p.faint', 'Speak naturally. You can interrupt Zero while it talks.')),
      h('div.card.voice-transcript', h('h2', icon('chat'), 'Conversation'), log, h('p.faint', { style: { marginTop: 'auto' } }, 'Lines appear as Zero hears and answers.'))),
    engine,
  );
  stops.push(mountOrb(canvas, { energy: () => energy }));
  loadEngine();
  return () => stops.forEach(fn => fn());
}
