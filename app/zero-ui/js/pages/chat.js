import { call, on } from '../rpc.js';
import { h, icon, markdown, toast, confirmBox, formBox, timeAgo, button } from '../ui.js';
import { look, saveLook } from '../theme.js';
import { live, refreshLive, modelReady } from '../app.js';
import * as voice from '../voice.js';

const SUGGESTIONS = [
  'Open Notepad and write a short to-do list',
  'What is on my screen right now?',
  'Search the web for today\'s top tech news',
  'Every morning at 9, summarise my tasks',
];

const toolLabel = (tool, action) => {
  const name = String(action && action !== tool ? `${tool} · ${action}` : tool || 'tool');
  return name.replace(/^zero_computer_action · /, '').replace(/_/g, ' ');
};

export async function render(root, { go, params }) {
  const stops = [];
  let sessions = [];
  let sessionKey = params.get('session') || null;
  let busy = false;
  let streamEl = null;    // current assistant bubble while a reply streams
  let streamText = '';
  let streamTools = null;
  let speakNext = false;

  // ---- layout -----------------------------------------------------------------
  const list = h('div.sessions-list');
  const filter = h('input', { placeholder: 'Search chats', autocomplete: 'off' });
  const sessionsPane = h('div.sessions',
    h('div.sessions-head', h('button.btn.primary', { type: 'button', style: { flex: 1 }, onclick: () => newChat() }, icon('plus', 16), h('span', 'New chat'))),
    h('div', { style: { padding: '0 14px 10px' } }, filter),
    list,
  );
  const title = h('div.title', 'New chat');
  const modelSelect = h('select', { title: 'Model for this chat' }, h('option', { value: '' }, 'Auto-Best'));
  const speakBtn = h('button.iconbtn' + (look.speakReplies ? '.on' : ''), { type: 'button', title: 'Read replies aloud', onclick: () => {
    saveLook({ speakReplies: !look.speakReplies });
    speakBtn.classList.toggle('on', look.speakReplies);
    if (!look.speakReplies) voice.stopSpeaking();
    toast(look.speakReplies ? 'Zero will read replies aloud' : 'Reading replies aloud is off');
  } }, icon('speaker'));
  const listBtn = h('button.iconbtn', { type: 'button', title: 'Show or hide chat list', onclick: () => {
    if (matchMedia('(max-width: 860px)').matches) chat.classList.toggle('show-list');
    else chat.classList.toggle('no-list');
  } }, icon('menu'));
  const head = h('div.convo-head', listBtn, title, modelSelect, speakBtn,
    h('button.iconbtn', { type: 'button', title: 'Rename', onclick: () => sessionKey && rename(sessionKey) }, icon('edit')));
  const inner = h('div.messages-inner');
  const scroller = h('div.messages', inner);
  const textarea = h('textarea', { rows: 1, placeholder: 'Message Zero… (Shift+Enter for a new line)' });
  const sendBtn = h('button.send', { type: 'button', title: 'Send', onclick: () => busy ? abort() : send() }, icon('send', 18));
  const micBtn = h('button.iconbtn', { type: 'button', title: voice.canListen ? 'Speak (Hindi or English)' : 'Speech input needs Chrome or Edge', disabled: !voice.canListen, onclick: () => toggleMic() }, icon('voice'));
  const note = h('div.composer-note');
  const composer = h('div.composer-wrap', h('div.composer', micBtn, textarea, sendBtn), note);
  const convo = h('div.convo', head, scroller, composer);
  const chat = h('div.chat', sessionsPane, convo);
  root.append(chat);

  // ---- helpers ------------------------------------------------------------------
  const nearBottom = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 140;
  const toBottom = (force) => { if (force || nearBottom()) scroller.scrollTop = scroller.scrollHeight; };
  const autosize = () => { textarea.style.height = 'auto'; textarea.style.height = Math.min(220, textarea.scrollHeight) + 'px'; };

  function setBusy(value) {
    busy = value;
    sendBtn.classList.toggle('stop', value);
    sendBtn.replaceChildren(icon(value ? 'stop' : 'send', 18));
    sendBtn.title = value ? 'Stop' : 'Send';
  }

  function paintNote() {
    note.replaceChildren(modelReady() || !live.auth
      ? 'Zero can use your computer, browser and terminal to finish a task.'
      : h('span', '⚠ No model has an API key, so Zero cannot reply yet. ', h('a', { href: '/models', onclick: e => { e.preventDefault(); go('/models'); } }, 'Add a key')));
  }

  function bubble(role, content, { tools } = {}) {
    const body = h('div.bubble');
    const toolsEl = h('div.tools');
    if (tools?.length) for (const t of tools) toolsEl.append(chip(t.label, t.state));
    if (role === 'user') body.textContent = content;
    else { body.append(toolsEl); const md = h('div.md'); md.innerHTML = markdown(content); body.append(md); }
    const meta = role === 'assistant' ? h('div.msgmeta',
      h('button.iconbtn', { type: 'button', title: 'Copy', onclick: () => navigator.clipboard.writeText(content).then(() => toast('Copied', 'ok')) }, icon('check', 15)),
      h('button.iconbtn', { type: 'button', title: 'Read aloud', onclick: () => voice.speak(body.querySelector('.md')?.innerText || content) }, icon('speaker', 15)),
    ) : null;
    const el = h('div.msg.' + role, h('div.avatar', role === 'user' ? (look.name || 'Y')[0].toUpperCase() : 'Z'), h('div', body, meta));
    el._body = body; el._tools = toolsEl;
    return el;
  }

  function chip(label, state = 'run') {
    return h('span.toolchip' + (state === 'done' ? '.done' : state === 'fail' ? '.fail' : ''), state === 'run' ? h('span.spinner', { style: { width: '10px', height: '10px' } }) : icon(state === 'fail' ? 'close' : 'check', 12), label);
  }

  function welcome() {
    inner.replaceChildren(h('div.welcome',
      h('div.logo', { style: { width: '54px', height: '54px', borderRadius: '18px' } }, h('span')),
      h('h2', 'How can ', h('span.grad', 'Zero'), ' help?'),
      h('p.muted', 'Ask a question or give a task. Zero can open apps, type, browse, run commands and remember.'),
      h('div.suggest', SUGGESTIONS.map(s => h('button', { type: 'button', onclick: () => { textarea.value = s; send(); } }, s))),
    ));
  }

  // ---- sessions ----------------------------------------------------------------
  async function loadSessions() {
    try {
      const r = await call('sessions.list', { limit: 200 });
      sessions = (r?.sessions || []).filter(s => !s.archived && !String(s.key).startsWith('probe:'));
      paintSessions();
    } catch (error) { list.replaceChildren(h('div.faint', { style: { padding: '10px' } }, error.message)); }
  }

  function paintSessions() {
    const q = filter.value.trim().toLowerCase();
    const shown = sessions.filter(s => !q || String(s.label || s.name || s.key).toLowerCase().includes(q));
    list.replaceChildren(...(shown.length ? shown.map(s => h('div.session' + (s.key === sessionKey ? '.active' : ''), { onclick: () => open(s.key), title: s.label || s.key },
      icon('chat', 15), h('span.name', s.label || s.name || s.key),
      h('button.iconbtn', { type: 'button', title: 'Delete chat', onclick: e => { e.stopPropagation(); remove(s); } }, icon('trash', 14)))) : [h('div.faint', { style: { padding: '10px' } }, q ? 'No match' : 'No chats yet')]));
  }
  filter.addEventListener('input', paintSessions);

  async function open(key) {
    sessionKey = key;
    history.replaceState(null, '', '/chat?session=' + encodeURIComponent(key));
    chat.classList.remove('show-list');
    paintSessions();
    const s = sessions.find(x => x.key === key);
    title.textContent = s?.label || s?.name || 'Chat';
    modelSelect.value = s?.model || s?.metadata?.model || '';
    call('sessions.messages.subscribe', { sessionKey: key }).catch(() => {});
    inner.replaceChildren(h('div.loading', h('span.spinner'), 'Loading messages…'));
    try {
      const r = await call('chat.history', { sessionKey: key, limit: 200 });
      paintHistory(r?.messages || []);
    } catch (error) { inner.replaceChildren(h('div.callout.danger', error.message)); }
  }

  function paintHistory(messages) {
    inner.replaceChildren();
    let pendingTools = [];
    for (const m of messages) {
      const text = typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.map(c => c?.text || '').join('\n') : '';
      if (m.role === 'user') { pendingTools = []; inner.append(bubble('user', text)); }
      else if (m.role === 'assistant') {
        for (const call of m.tool_calls || m.toolCalls || []) pendingTools.push({ label: toolLabel(call.function?.name || call.name), state: 'done' });
        if (text.trim()) { inner.append(bubble('assistant', text, { tools: pendingTools })); pendingTools = []; }
      }
    }
    if (!inner.children.length) welcome();
    toBottom(true);
  }

  async function newChat(initial) {
    sessionKey = null;
    history.replaceState(null, '', '/chat');
    title.textContent = 'New chat';
    modelSelect.value = '';
    paintSessions();
    welcome();
    textarea.value = initial || '';
    autosize();
    textarea.focus();
  }

  async function ensureSession(firstText) {
    if (sessionKey) return sessionKey;
    // A readable key: the host hides generated ids (session_<ms>_…) from the chat list.
    const id = 'chat-' + new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 8);
    const created = await call('sessions.create', { id, title: firstText.slice(0, 60) });
    sessionKey = created.key || created.sessionKey;
    history.replaceState(null, '', '/chat?session=' + encodeURIComponent(sessionKey));
    title.textContent = firstText.slice(0, 60);
    await call('sessions.messages.subscribe', { sessionKey }).catch(() => {});
    loadSessions();
    return sessionKey;
  }

  async function rename(key) {
    const s = sessions.find(x => x.key === key);
    const values = await formBox('Rename chat', [{ name: 'title', label: 'Name', value: s?.label || '', required: true }]);
    if (!values) return;
    await call('sessions.patch', { key, label: values.title, title: values.title, metadata: { ...(s?.metadata || {}), title: values.title } }).catch(e => toast(e.message, 'error'));
    title.textContent = values.title;
    loadSessions();
  }

  async function remove(s) {
    if (!(await confirmBox('Delete chat?', `“${s.label || s.key}” and its messages will be deleted.`, 'Delete', true))) return;
    try {
      await call('sessions.delete', { key: s.key, sessionKey: s.key });
      toast('Chat deleted', 'ok');
      if (s.key === sessionKey) newChat();
      loadSessions();
    } catch (error) { toast(error.message, 'error'); }
  }

  // ---- sending & streaming -----------------------------------------------------
  async function send() {
    const text = textarea.value.trim();
    if (!text || busy) return;
    textarea.value = '';
    autosize();
    if (inner.querySelector('.welcome')) inner.replaceChildren();
    inner.append(bubble('user', text));
    startAssistant();
    toBottom(true);
    setBusy(true);
    speakNext = look.speakReplies;
    try {
      const key = await ensureSession(text);
      const params = { sessionKey: key, message: text, idempotencyKey: 'ui-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) };
      if (modelSelect.value) params.model = modelSelect.value;
      const result = await call('chat.send', params, { timeoutMs: 15 * 60 * 1000 });
      finishAssistant(result?.content ?? streamText);
    } catch (error) {
      finishAssistant(streamText || `⚠️ ${error.message}`, true);
    } finally {
      setBusy(false);
      loadSessions();
    }
  }

  function startAssistant() {
    streamText = '';
    streamTools = [];
    streamEl = bubble('assistant', '');
    streamEl._body.querySelector('.md').replaceChildren(h('span.typing', h('i'), h('i'), h('i')));
    inner.append(streamEl);
  }

  function paintStream() {
    if (!streamEl) return;
    const md = streamEl._body.querySelector('.md');
    md.innerHTML = markdown(streamText);
    if (!streamText) md.replaceChildren(h('span.typing', h('i'), h('i'), h('i')));
    toBottom();
  }

  function finishAssistant(content, failed) {
    if (!streamEl) return;
    for (const c of streamEl._tools.querySelectorAll('.toolchip')) if (c.querySelector('.spinner')) c.replaceWith(chip(c.textContent, failed ? 'fail' : 'done'));
    streamText = String(content || '');
    const md = streamEl._body.querySelector('.md');
    md.innerHTML = markdown(streamText || '_No reply._');
    const finished = streamEl;
    streamEl = null;
    toBottom();
    if (speakNext && streamText && !failed) voice.speak(finished._body.querySelector('.md').innerText);
    if (/Missing API key/i.test(streamText)) refreshLive();
  }

  async function abort() {
    if (!sessionKey) return;
    try { await call('chat.abort', { sessionKey }); toast('Stopped'); } catch (error) { toast(error.message, 'error'); }
  }

  // live events from the host
  stops.push(on('zero.stream.delta', p => {
    if (p.sessionKey !== sessionKey || !streamEl) return;
    streamText += p.delta || '';
    paintStream();
  }));
  stops.push(on('zero.stream.complete', p => {
    if (p.sessionKey !== sessionKey || !streamEl) return;
    if (typeof p.content === 'string') { streamText = p.content; paintStream(); }
  }));
  stops.push(on('zero.tool.start', p => {
    if (p.sessionKey !== sessionKey || !streamEl) return;
    for (const c of streamEl._tools.querySelectorAll('.toolchip')) if (c.querySelector('.spinner')) c.replaceWith(chip(c.textContent, 'done'));
    streamEl._tools.append(chip(toolLabel(p.tool, p.action)));
    toBottom();
  }));
  stops.push(on('zero.capability', p => {
    if (!streamEl || p.sessionKey && p.sessionKey !== sessionKey) return;
    if (p.ok === false || p.error) {
      const last = [...streamEl._tools.querySelectorAll('.toolchip')].pop();
      if (last) last.replaceWith(chip(last.textContent, 'fail'));
    }
  }));
  stops.push(on('zero.session.message', p => {
    // A message added from somewhere else (voice, another window): reload quietly.
    if (p.sessionKey === sessionKey && !busy) open(sessionKey);
  }));

  // ---- microphone ----------------------------------------------------------------
  async function toggleMic() {
    if (voice.isListening()) { voice.stopListening(); return; }
    micBtn.classList.add('listening');
    const before = textarea.value;
    try {
      const text = await voice.listen({ lang: /[ऀ-ॿ]/.test(before) ? 'hi-IN' : (navigator.language || 'en-IN'), onText: t => { textarea.value = (before ? before + ' ' : '') + t; autosize(); } });
      micBtn.classList.remove('listening');
      if (text) { speakNext = true; send(); speakNext = true; }
    } catch (error) {
      micBtn.classList.remove('listening');
      toast(error.message, 'error');
    }
  }

  // ---- input ---------------------------------------------------------------------
  textarea.addEventListener('input', autosize);
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && look.sendOnEnter) { e.preventDefault(); send(); }
  });
  modelSelect.addEventListener('change', async () => {
    if (!sessionKey) return;
    call('sessions.patch', { key: sessionKey, model: modelSelect.value || null }).catch(() => {});
  });

  // ---- start ---------------------------------------------------------------------
  call('models.list').then(r => {
    for (const m of r?.models || []) modelSelect.append(h('option', { value: m.id }, `${m.name || m.id} · ${m.provider}`));
    const s = sessions.find(x => x.key === sessionKey);
    if (s?.model) modelSelect.value = s.model;
  }).catch(() => {});
  paintNote();
  const statusTimer = setInterval(paintNote, 5000);
  await loadSessions();
  if (params.get('new') || !sessionKey) newChat(params.get('ask') || '');
  else open(sessionKey);
  if (params.get('ask')) send();

  return () => { stops.forEach(fn => fn()); clearInterval(statusTimer); voice.stopListening(); };
}
