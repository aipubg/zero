// Terminal room: Zero's own terminals. The owner and Zero type into the same
// live sessions; Zero's own sessions are marked so you can watch its work.
import { call, on } from '../rpc.js';
import { h, icon, toast, badge, button, formBox, confirmBox, empty } from '../ui.js';

const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;

export async function render(root) {
  const stops = [];
  let terminals = [];
  let activeId = null;
  const history = [];
  let cursor = 0;

  const tabs = h('div.term-tabs');
  const out = h('div.term-out');
  const input = h('input', { autocomplete: 'off', spellcheck: false, placeholder: 'Type a command and press Enter', 'aria-label': 'Command' });
  const info = h('div.term-info');
  const termBox = h('div.term', { onclick: () => getSelection().isCollapsed && input.focus() }, out, h('div.term-in', h('span.prompt', '›'), input));

  const write = (text, cls) => {
    const clean = String(text).replace(ANSI, '').replace(/\r(?!\n)/g, '');
    const last = out.lastElementChild;
    if (last && !cls && !last.className) last.textContent += clean;      // keep plain output in one block
    else out.append(h('span' + (cls ? '.' + cls : ''), clean));
    if (out.childElementCount > 400) out.firstElementChild.remove();
    out.scrollTop = out.scrollHeight;
  };

  function paintTabs() {
    tabs.replaceChildren(
      ...terminals.map(t => h('button.term-tab' + (t.id === activeId ? '.active' : '') + (t.alive ? '' : '.ended'), { type: 'button', onclick: () => select(t.id), title: `${t.cwd} · pid ${t.pid}` },
        t.owner === 'zero' ? h('span.term-zero', 'Zero') : icon('terminal', 14),
        h('span', t.title), t.busy ? h('span.spinner', { style: { width: '10px', height: '10px' } }) : null,
        h('span.term-x', { role: 'button', title: 'Close terminal', onclick: e => { e.stopPropagation(); closeTerm(t); } }, '×'))),
      h('button.term-tab.add', { type: 'button', title: 'New PowerShell', onclick: () => openTerm('powershell') }, icon('plus', 14), h('span', 'PowerShell')),
      h('button.term-tab.add', { type: 'button', title: 'New Command Prompt', onclick: () => openTerm('cmd') }, icon('plus', 14), h('span', 'cmd')),
    );
    const t = terminals.find(x => x.id === activeId);
    info.replaceChildren(t ? h('div.row',
      t.owner === 'zero' ? badge('Zero is using this terminal', 'info') : badge('Your terminal'),
      badge(t.alive ? (t.busy ? 'running a command' : 'ready') : 'ended', t.alive ? (t.busy ? 'warn' : 'ok') : 'danger'),
      h('span.faint.mono', t.cwd)) : null);
    input.disabled = !t || !t.alive;
  }

  async function load(selectId) {
    try {
      const r = await call('terminal.list');
      terminals = r.terminals || [];
      if (!terminals.length) { activeId = null; out.replaceChildren(empty('No terminal yet. Open one, or ask Zero in Chat to run something — its terminal shows up here.', 'terminal')); paintTabs(); return; }
      await select(selectId && terminals.some(t => t.id === selectId) ? selectId : (terminals.some(t => t.id === activeId) ? activeId : terminals[terminals.length - 1].id));
    } catch (e) { out.replaceChildren(h('div.callout.danger', e.message)); }
  }

  async function select(id) {
    activeId = id;
    paintTabs();
    out.replaceChildren();
    // The saved buffer already holds anything that streamed in meanwhile.
    try { const r = await call('terminal.read', { id }); if (activeId === id) { out.replaceChildren(); write(r.output || ''); } } catch (e) { write(e.message, 'err'); }
    input.focus();
  }

  async function openTerm(shell) {
    try { const r = await call('terminal.open', { shell }); await load(r.terminal.id); } catch (e) { toast(e.message, 'error'); }
  }

  async function closeTerm(t) {
    if (t.alive && t.owner === 'zero' && !(await confirmBox('Close Zero\'s terminal?', 'Zero may still be using it. A running command will stop.', 'Close', true))) return;
    try { await call('terminal.close', { id: t.id }); if (activeId === t.id) activeId = null; load(); } catch (e) { toast(e.message, 'error'); }
  }

  async function external() {
    const v = await formBox('Open a desktop terminal', [
      { name: 'command', label: 'Command to start with (optional)', placeholder: 'git status' },
      { name: 'cwd', label: 'Folder', value: terminals.find(t => t.id === activeId)?.cwd || 'E:\\zero' },
      { name: 'shell', label: 'Shell', type: 'select', value: 'powershell', options: [{ value: 'powershell', label: 'PowerShell' }, { value: 'cmd', label: 'Command Prompt' }] },
    ], 'Open window');
    if (!v) return;
    try { const r = await call('terminal.external', v); toast(`Opened ${r.opened} on the desktop`, 'ok'); } catch (e) { toast(e.message, 'error'); }
  }

  input.addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
      const text = input.value;
      input.value = '';
      if (!activeId) return;
      if (text.trim()) { history.push(text); cursor = history.length; }
      if (text.trim() === 'cls' || text.trim() === 'clear') { out.replaceChildren(); return; }
      try { await call('terminal.write', { id: activeId, text }); } catch (err) { write(err.message + '\n', 'err'); }
    } else if (e.key === 'ArrowUp') { if (cursor > 0) input.value = history[--cursor] || ''; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { input.value = cursor < history.length ? history[++cursor] || '' : ''; e.preventDefault(); }
    else if (e.key === 'l' && e.ctrlKey) { out.replaceChildren(); e.preventDefault(); }
  });

  stops.push(on('zero.terminal.output', p => {
    const t = terminals.find(x => x.id === p.id);
    if (t && !t.busy && p.stream === 'echo' && /^Zero> /.test(p.data)) { t.busy = true; paintTabs(); }
    if (p.id === activeId) write(p.data, p.stream === 'stderr' ? 'err' : p.stream === 'echo' ? 'cmd' : p.stream === 'system' ? 'meta' : '');
  }));
  stops.push(on('zero.terminal.open', p => { if (!terminals.some(t => t.id === p.id)) load(activeId || p.id); }));
  stops.push(on('zero.terminal.exit', () => load(activeId)));
  stops.push(on('zero.terminal.close', () => load(activeId)));
  const refresh = setInterval(async () => {
    if (document.visibilityState !== 'visible') return;
    try { const r = await call('terminal.list'); const before = JSON.stringify(terminals.map(t => [t.id, t.busy, t.alive])); terminals = r.terminals || []; if (JSON.stringify(terminals.map(t => [t.id, t.busy, t.alive])) !== before) paintTabs(); } catch {}
  }, 3000);

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Terminal'), h('h1', 'Zero\'s terminal'), h('p', 'Live shells on this PC. When Zero runs a command it happens here, in a tab marked Zero — you can watch and type too.')),
      h('div.actions', button('Desktop terminal…', external, { iconName: 'computer' }), button('Clear view', () => out.replaceChildren(), { kind: 'ghost', iconName: 'trash' }))),
    tabs, info, termBox,
  );
  await load();
  return () => { stops.forEach(fn => fn()); clearInterval(refresh); };
}
