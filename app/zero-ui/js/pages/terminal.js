import { tool } from '../rpc.js';
import { h, icon, toast } from '../ui.js';

const KEY = 'zero-ui-terminal-v1';

export async function render(root) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
  let cwd = saved.cwd || 'E:\\zero';
  let shell = saved.shell || 'powershell';
  const past = Array.isArray(saved.history) ? saved.history : [];
  let cursor = past.length;
  let running = false;

  const out = h('div.term-out');
  const prompt = h('span.prompt');
  const input = h('input', { autocomplete: 'off', spellcheck: false, 'aria-label': 'Command' });
  const shellSelect = h('select', { style: { width: 'auto' } }, h('option', { value: 'powershell' }, 'PowerShell'), h('option', { value: 'cmd' }, 'Command Prompt'));
  shellSelect.value = shell;
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ cwd, shell, history: past.slice(-100) })); } catch {} };
  const paintPrompt = () => { prompt.textContent = (shell === 'cmd' ? '' : 'PS ') + cwd + '>'; };
  const write = (text, cls) => { out.append(h('div' + (cls ? '.' + cls : ''), text)); out.scrollTop = out.scrollHeight; };

  async function run(command) {
    if (!command.trim() || running) return;
    past.push(command); cursor = past.length; persist();
    write(prompt.textContent + ' ' + command, 'cmd');
    if (command.trim() === 'clear' || command.trim() === 'cls') { out.replaceChildren(); return; }
    running = true; input.disabled = true;
    const marker = '__ZERO_CWD__';
    const args = shell === 'cmd'
      ? ['/d', '/s', '/c', `cd /d "${cwd}" && ${command} & echo ${marker}%CD%`]
      : ['-NoProfile', '-NonInteractive', '-Command', `Set-Location -LiteralPath '${cwd.replace(/'/g, "''")}'; ${command}; Write-Output ('${marker}' + (Get-Location).Path)`];
    const started = performance.now();
    try {
      const r = await tool('run_process', { command: shell === 'cmd' ? 'cmd.exe' : 'powershell.exe', args, cwd, timeoutMs: 120000 }, { timeoutMs: 150000 });
      let stdout = String(r?.stdout ?? '');
      const m = stdout.match(new RegExp(marker + '(.*)\\s*$'));
      if (m) { cwd = m[1].trim() || cwd; stdout = stdout.slice(0, m.index); paintPrompt(); persist(); }
      if (stdout.trim()) write(stdout.replace(/\s+$/, ''));
      if (r?.stderr?.trim()) write(r.stderr.replace(/\s+$/, ''), 'err');
      if (r?.ok === false && !r?.stderr) write(r.error || r.message || 'Command failed', 'err');
      write(`exit ${r?.exitCode ?? '?'} · ${Math.round(performance.now() - started)} ms`, 'meta');
    } catch (error) {
      write(error.message, 'err');
    } finally {
      running = false; input.disabled = false; input.focus();
    }
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const c = input.value; input.value = ''; run(c); }
    else if (e.key === 'ArrowUp') { if (cursor > 0) { cursor--; input.value = past[cursor] || ''; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (cursor < past.length) { cursor++; input.value = past[cursor] || ''; } e.preventDefault(); }
    else if (e.key === 'l' && e.ctrlKey) { out.replaceChildren(); e.preventDefault(); }
  });
  shellSelect.addEventListener('change', () => { shell = shellSelect.value; paintPrompt(); persist(); input.focus(); });

  write('Zero terminal — commands run on this PC through Zero (run_process). Type clear to empty the screen.', 'meta');
  paintPrompt();
  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Terminal'), h('h1', 'Run commands'), h('p', 'A real shell on this computer. Commands run with your Windows account, so be careful with destructive ones.')),
      h('div.actions', shellSelect, h('button.btn', { type: 'button', onclick: () => { out.replaceChildren(); input.focus(); } }, icon('trash', 16), h('span', 'Clear')),
        h('button.btn', { type: 'button', onclick: () => navigator.clipboard.writeText(out.innerText).then(() => toast('Output copied', 'ok')) }, h('span', 'Copy output')))),
    h('div.term', { onclick: () => getSelection().isCollapsed && input.focus() }, out, h('div.term-in', prompt, input)),
  );
  input.focus();
}
