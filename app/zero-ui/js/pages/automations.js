import { call } from '../rpc.js';
import { h, icon, toast, formBox, confirmBox, timeAgo, empty, badge, button } from '../ui.js';

const KINDS = [
  { value: 'assistant.prompt', label: 'Ask Zero (a prompt, like a chat message)' },
  { value: 'research.workflow.execute', label: 'Research a topic' },
  { value: 'memory.consolidate', label: 'Tidy up memory' },
  { value: 'open_app', label: 'Open an app' },
  { value: 'open_url', label: 'Open a web page' },
];

const SCHEDULES = [
  { value: '0 9 * * *', label: 'Every day at 9:00' },
  { value: '0 9 * * 1-5', label: 'Weekdays at 9:00' },
  { value: '0 * * * *', label: 'Every hour' },
  { value: '*/15 * * * *', label: 'Every 15 minutes' },
  { value: '0 18 * * 0', label: 'Sundays at 18:00' },
  { value: 'custom', label: 'Custom (cron)…' },
];

const describe = cron => SCHEDULES.find(s => s.value === cron)?.label || cron || '—';

export async function render(root) {
  const listEl = h('div.list');
  const runsEl = h('div.list');
  const templatesEl = h('div.grid.auto');
  let jobs = [];

  async function load() {
    try {
      const r = await call('cron.list', { limit: 500 });
      jobs = r?.jobs || r?.items || [];
      listEl.replaceChildren(...(jobs.length ? jobs.map(job => {
        const sw = h('button.switch', { type: 'button', role: 'switch', 'aria-checked': String(job.enabled), title: job.enabled ? 'Turn off' : 'Turn on',
          onclick: async () => { try { await call('cron.update', { id: job.id, enabled: !job.enabled }); load(); } catch (e) { toast(e.message, 'error'); } } });
        return h('div.item', icon('clock', 18),
          h('div.grow', h('div.title', job.name), h('div.sub', `${describe(job.cronExpr || job.schedule)} · ${job.targetAction || ''}${job.nextRun ? ' · next ' + new Date(job.nextRun).toLocaleString() : ''}`)),
          job.lastRun ? h('span.faint', 'ran ' + timeAgo(job.lastRun)) : null,
          button('Run now', async () => {
            toast('Running “' + job.name + '”…');
            try { const r = await call('cron.run', { id: job.id }, { timeoutMs: 15 * 60000 }); toast(r?.run?.status === 'failed' ? 'Failed: ' + r.run.error : 'Finished “' + job.name + '”', r?.run?.status === 'failed' ? 'error' : 'ok'); load(); }
            catch (e) { toast(e.message, 'error'); }
          }, { kind: 'small', iconName: 'play' }),
          sw,
          h('button.iconbtn', { type: 'button', title: 'Delete', onclick: async () => {
            if (!(await confirmBox('Delete automation?', `“${job.name}” will stop running.`, 'Delete', true))) return;
            try { await call('cron.remove', { id: job.id }); toast('Deleted', 'ok'); load(); } catch (e) { toast(e.message, 'error'); }
          } }, icon('trash', 16)));
      }) : [empty('No automations yet. Create one, or start from a template below.', 'clock')]));
    } catch (error) { listEl.replaceChildren(h('div.callout.danger', error.message)); }
    call('automation.listRuns', { limit: 20 }).then(r => {
      const runs = r?.runs || [];
      runsEl.replaceChildren(...(runs.length ? runs.map(run => h('div.item', icon(run.status === 'failed' ? 'close' : 'check', 16),
        h('div.grow', h('div.title', jobs.find(j => j.id === run.jobId)?.name || run.jobId), h('div.sub', run.error || run.targetAction || '')),
        badge(run.status, run.status === 'failed' ? 'danger' : 'ok'), h('span.faint', timeAgo(run.executedAt)))) : [h('div.faint', 'No runs yet.')]));
    }).catch(() => {});
  }

  async function create() {
    const v = await formBox('New automation', [
      { name: 'title', label: 'Name', required: true, placeholder: 'Morning briefing' },
      { name: 'kind', label: 'What should happen', type: 'select', options: KINDS, value: 'assistant.prompt' },
      { name: 'text', label: 'Prompt / topic / app / URL', type: 'textarea', rows: 3, required: true, placeholder: 'Summarise my open tasks and today\'s calendar' },
      { name: 'schedule', label: 'When', type: 'select', options: SCHEDULES, value: '0 9 * * *' },
      { name: 'cron', label: 'Custom cron (only for “Custom”)', placeholder: '30 7 * * *', hint: 'minute hour day month weekday' },
    ], 'Create');
    if (!v) return;
    const cronExpr = v.schedule === 'custom' ? v.cron.trim() : v.schedule;
    if (!cronExpr) return toast('Enter a cron schedule', 'error');
    const id = 'job_' + Date.now().toString(36);
    const params = v.kind === 'assistant.prompt' ? { prompt: v.text, jobId: id, sessionKey: 'automation:' + id }
      : v.kind === 'research.workflow.execute' ? { topic: v.text }
      : v.kind === 'open_app' ? { app: v.text }
      : v.kind === 'open_url' ? { url: v.text } : {};
    try {
      await call('cron.add', { id, title: v.title, cronExpr, targetAction: v.kind, params, enabled: true });
      toast('Automation created', 'ok');
      load();
    } catch (error) { toast(error.message, 'error'); }
  }

  call('automation.templates.list').then(r => {
    const templates = r?.templates || [];
    templatesEl.replaceChildren(...templates.map(t => h('div.card', h('h2', icon('spark'), t.title), h('p.muted', { style: { marginTop: 0 } }, t.description),
      h('div.row', badge(describe(t.cronExpr)), h('span.spacer'), button('Use', async () => {
        try { await call('automation.templates.instantiate', { templateId: t.id, params: {} }); toast('Added “' + t.title + '”', 'ok'); load(); }
        catch (e) { toast(e.message, 'error'); }
      }, { kind: 'small' })))));
  }).catch(() => {});

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Work'), h('h1', 'Automations'), h('p', 'Jobs Zero runs on a schedule — a daily briefing, a research digest, opening an app at a set time.')),
      h('div.actions', h('button.btn.primary', { type: 'button', onclick: create }, icon('plus', 16), h('span', 'New automation')))),
    h('div.card', { style: { marginBottom: 'var(--gap)' } }, h('h2', icon('clock'), 'Scheduled'), listEl),
    h('div.grid.g2', { style: { marginBottom: 'var(--gap)', alignItems: 'start' } },
      h('div.card', h('h2', icon('tasks'), 'Recent runs'), runsEl),
      h('div', h('h2', { style: { fontSize: '1.05em', margin: '0 0 12px' } }, 'Templates'), templatesEl)),
  );
  await load();
}
