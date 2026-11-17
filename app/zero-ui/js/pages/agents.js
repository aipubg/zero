import { call } from '../rpc.js';
import { h, icon, badge, toast, formBox, empty, timeAgo } from '../ui.js';

export async function render(root, { go }) {
  const profilesEl = h('div.grid.auto', h('div.loading', h('span.spinner'), 'Loading…'));
  const teamsEl = h('div.list');
  const workersEl = h('div.list');

  async function delegate(teamId) {
    const v = await formBox('Give the team a job', [
      { name: 'goal', label: 'Goal', type: 'textarea', required: true, placeholder: 'Research the three best budget laptops and write a comparison' },
      { name: 'planOnly', label: 'Only make a plan (do not run it)', type: 'checkbox', value: false },
    ], 'Start');
    if (!v) return;
    try {
      const method = v.planOnly ? 'agent.task.plan' : 'agent.task.execute';
      const r = await call(method, { goal: v.goal, teamId }, { timeoutMs: 10 * 60000 });
      toast(v.planOnly ? 'Plan ready — see Tasks' : 'Team started — follow it in Tasks', 'ok');
      if (r?.taskId || r?.task?.id) go('/work/tasks?id=' + encodeURIComponent(r.taskId || r.task.id));
    } catch (e) { toast(e.message, 'error'); }
  }

  const [profiles, teams, workers] = await Promise.all([
    call('agent.profile.list').catch(e => ({ error: e })),
    call('agent.team.list').catch(e => ({ error: e })),
    call('workers.list').catch(e => ({ error: e })),
  ]);

  const list = profiles?.profiles || [];
  profilesEl.replaceChildren(...(list.length ? list.map(p => h('div.card',
    h('div.row', h('div.logo', { style: { width: '36px', height: '36px' } }, h('span')), h('div', h('strong', p.name || p.id), h('div.faint', p.role || ''))),
    h('p.muted', { style: { margin: '10px 0' } }, p.description || ''),
    h('div.row', ...(p.capabilities || p.tools || p.skills || []).slice(0, 6).map(c => badge(typeof c === 'string' ? c : c.name || c.id))),
  )) : [empty(profiles?.error?.message || 'No agents.', 'agents')]));

  const teamList = teams?.teams || [];
  teamsEl.replaceChildren(...(teamList.length ? teamList.map(t => h('div.item', icon('agents', 18),
    h('div.grow', h('div.title', t.name), h('div.sub', `${(t.members || []).length} members · lead ${t.leadAgentId || '—'}${t.description ? ' · ' + t.description : ''}`)),
    h('button.btn.small', { type: 'button', onclick: () => delegate(t.id) }, icon('play', 14), h('span', 'Give a job')))) : [empty('No teams.', 'agents')]));

  const workerList = workers?.workers || [];
  workersEl.replaceChildren(...(workerList.length ? workerList.map(w => h('div.item', icon('computer', 18),
    h('div.grow', h('div.title', w.name || w.id), h('div.sub', `${w.type || ''} · ${(w.capabilities || []).join(', ')}${w.lastHeartbeat ? ' · seen ' + timeAgo(w.lastHeartbeat) : ''}`)),
    badge(w.status || 'unknown', w.status === 'online' ? 'ok' : 'warn'))) : [empty('No workers.', 'computer')]));

  root.append(
    h('div.head', h('div', h('div.eyebrow', 'Work'), h('h1', 'Agents'), h('p', 'Zero coordinates a team of specialist agents. Give a team a goal and it plans, splits and runs the work.')),
      h('div.actions', h('button.btn.primary', { type: 'button', onclick: () => delegate(teamList[0]?.id) }, icon('play', 16), h('span', 'Give Zero\'s team a job')))),
    h('h2', { style: { fontSize: '1.05em' } }, 'Specialists'),
    profilesEl,
    h('div.grid.g2', { style: { marginTop: 'var(--gap)', alignItems: 'start' } },
      h('div.card', h('h2', icon('agents'), 'Teams'), teamsEl),
      h('div.card', h('h2', icon('computer'), 'Workers (where work runs)'), workersEl)),
  );
}
