import { call, tool } from '../rpc.js';
import { h, icon, toast, badge, button, empty, confirmBox } from '../ui.js';
import { live, refreshLive, onLive } from '../app.js';

export async function render(root) {
  const stops = [];
  const img = h('img', { alt: 'Live view of your screen' });
  const screenInfo = h('span.badge', 'Loading…');
  let paused = false;
  const view = h('div.screenview', img, h('div.overlay', screenInfo, h('span.spacer'),
    h('button.btn.small', { type: 'button', onclick: () => { paused = !paused; toggle.textContent = paused ? 'Resume' : 'Pause'; } }, h('span', 'Pause'))));
  const toggle = view.querySelector('.overlay button span');
  img.onerror = () => { screenInfo.textContent = 'Screen capture unavailable'; screenInfo.className = 'badge warn'; };
  const loadFrame = async () => {
    if (paused || document.visibilityState !== 'visible') return;
    try {
      const response = await fetch('/desktop/frame.jpg?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('unavailable');
      const blob = await response.blob();
      const old = img.src;
      img.src = URL.createObjectURL(blob);
      if (old.startsWith('blob:')) URL.revokeObjectURL(old);
      const title = decodeURIComponent(response.headers.get('X-Active-Window') || '');
      screenInfo.textContent = title ? 'Active: ' + title.slice(0, 70) : 'Live';
      screenInfo.className = 'badge ok';
    } catch { screenInfo.textContent = 'Screen capture unavailable'; screenInfo.className = 'badge warn'; }
  };
  loadFrame();
  const frameTimer = setInterval(loadFrame, 2000);

  // open app
  const appInput = h('input', { placeholder: 'App name, e.g. notepad, calc, chrome, spotify', autocomplete: 'off' });
  const openBtn = button('Open', () => openApp(), { kind: 'primary', iconName: 'play' });
  const openResult = h('div.faint');
  async function openApp() {
    const app = appInput.value.trim();
    if (!app) return appInput.focus();
    openBtn.disabled = true; openResult.textContent = 'Opening ' + app + '…';
    try {
      const r = await tool('open_app', { app }, { timeoutMs: 60000 });
      openResult.textContent = r?.message || (r?.ok === false ? r.error : 'Done');
      toast(r?.ok === false ? (r.error || 'Could not open ' + app) : (r?.message || app + ' opened'), r?.ok === false ? 'error' : 'ok');
      loadWindows();
    } catch (error) { openResult.textContent = error.message; toast(error.message, 'error'); }
    finally { openBtn.disabled = false; }
  }
  appInput.addEventListener('keydown', e => { if (e.key === 'Enter') openApp(); });

  // windows
  const windowsList = h('div.list', h('div.loading', h('span.spinner'), 'Loading windows…'));
  async function loadWindows() {
    try {
      const r = await tool('zero_computer_action', { action: 'list_windows' }, { timeoutMs: 30000 });
      const windows = r?.windows || [];
      windowsList.replaceChildren(...(windows.length ? windows.filter(w => w.process !== 'explorer' || w.title !== 'Program Manager').map(w => h('div.item',
        icon(w.isForeground ? 'check' : 'computer', 16),
        h('div.grow', h('div.title', w.title), h('div.sub', `${w.process} · pid ${w.pid}`)),
        w.isForeground ? badge('front', 'ok') : null,
        h('button.btn.small', { type: 'button', onclick: () => win(w, 'focus') }, 'Focus'),
        h('button.iconbtn', { type: 'button', title: 'Minimize', onclick: () => win(w, 'minimize') }, h('span', '–')),
        h('button.iconbtn', { type: 'button', title: 'Close window', onclick: () => win(w, 'close') }, icon('close', 16)),
      )) : [empty('No windows found.', 'computer')]));
    } catch (error) { windowsList.replaceChildren(h('div.callout.danger', error.message)); }
  }
  async function win(w, command) {
    if (command === 'close' && !(await confirmBox('Close window?', `“${w.title}” will be asked to close. Unsaved work may prompt first.`, 'Close', true))) return;
    try {
      const r = await tool('zero_computer_action', { action: 'focus_window', target: String(w.hwnd), command }, { timeoutMs: 30000 });
      if (r?.ok === false) toast(r.error || r.message || 'Failed', 'error'); else toast(`${command === 'focus' ? 'Focused' : command === 'close' ? 'Closed' : 'Minimized'}: ${w.title.slice(0, 50)}`, 'ok');
      setTimeout(loadWindows, 500);
    } catch (error) { toast(error.message, 'error'); }
  }
  loadWindows();

  // hands (hold)
  const holdCard = h('div.card');
  const paintHold = () => {
    const held = live.hold?.held;
    holdCard.replaceChildren(
      h('h2', icon('hand'), 'Who controls the computer'),
      h('p.muted', held ? 'You are holding the computer. Zero will not move the mouse or type until you release it.' : 'Zero may use the mouse and keyboard when a task needs it. Take control to stop it at any time.'),
      h('div.row', badge(held ? 'You have control' : 'Zero may act', held ? 'warn' : 'ok'), h('span.spacer'),
        held ? button('Give control back to Zero', () => hold(false), { kind: 'primary' }) : button('Take control (stop Zero)', () => hold(true), { kind: 'danger', iconName: 'hand' })),
    );
  };
  async function hold(take) {
    try {
      await call(take ? 'zero-policy.computer-hold.take' : 'zero-policy.computer-hold.release', {});
      toast(take ? 'You have control. Zero will not act.' : 'Zero may use the computer again.', 'ok');
      await refreshLive();
    } catch (error) { toast(error.message, 'error'); }
  }
  stops.push(onLive(paintHold));

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Computer'), h('h1', 'Your desktop'), h('p', 'See the screen, open apps, manage windows and decide who has the mouse and keyboard.'))),
    h('div.grid', { style: { gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', alignItems: 'start' } },
      h('div.stack', h('div.card', h('h2', icon('screen'), 'Live screen'), view)),
      h('div.stack',
        h('div.card', h('h2', icon('play'), 'Open an app'), h('div.row', { style: { flexWrap: 'nowrap' } }, appInput, openBtn), openResult),
        holdCard,
        h('div.card', h('div.card-head', h('h2', icon('computer'), 'Open windows'), h('span.spacer'), h('button.iconbtn', { type: 'button', title: 'Refresh', onclick: loadWindows }, icon('refresh'))), windowsList),
      ),
    ),
  );
  if (matchMedia('(max-width: 1100px)').matches) root.querySelector('.grid').style.gridTemplateColumns = '1fr';
  refreshLive();
  return () => { clearInterval(frameTimer); stops.forEach(fn => fn()); if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src); };
}
