/** Install actual SDK-compatible bundles from the existing Skills page. */
export function mountSkillInstall(container, host) {
  if (!container || container.querySelector('.zero-skill-install')) return;
  const section = document.createElement('section'); section.className = 'zero-skill-install card';
  const heading = document.createElement('h3'); heading.textContent = 'Import skill bundle';
  const form = document.createElement('form');
  const fields = {};
  for (const [name, labelText, placeholder] of [
    ['source', 'Skill source', 'Local skill directory or GitHub repository URL'],
    ['ref', 'Git revision', 'Pinned Git revision (optional)'],
    ['subpath', 'Repository directory', 'Skill directory within repository (optional)'],
  ]) {
    const label = document.createElement('label'); label.textContent = labelText;
    const input = document.createElement('input'); input.className = 'input'; input.name = name; input.placeholder = placeholder; input.required = name === 'source';
    label.append(input); form.append(label); fields[name] = input;
  }
  const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'btn primary'; submit.textContent = 'Import skill bundle';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  form.append(submit); section.append(heading, form, status); container.append(section);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (submit.disabled) return;
    submit.disabled = true; status.textContent = 'Importing skill…';
    const sourceText = fields.source.value.trim();
    const source = /^https:\/\//i.test(sourceText) ? { type: 'github', url: sourceText,
      ...(fields.ref.value.trim() ? { ref: fields.ref.value.trim() } : {}), ...(fields.subpath.value.trim() ? { subpath: fields.subpath.value.trim() } : {}) } : { type: 'local', path: sourceText };
    try {
      const response = await host.request('skills.import', { source }); const result = response?.result ?? response;
      if (result.ok === false) throw new Error(result.error || 'Skill import failed');
      status.textContent = `Installed skill: ${result.name || result.entry?.name}. Reload to refresh the installed list.`;
    } catch (error) { status.textContent = `Import failed: ${error.message}`; }
    finally { submit.disabled = false; }
  });
  const manage = document.createElement('form');
  const nameLabel = document.createElement('label'); nameLabel.textContent = 'Installed skill name';
  const name = document.createElement('input'); name.className = 'input'; name.placeholder = 'Installed skill name'; name.required = true; nameLabel.append(name);
  const update = document.createElement('button'); update.type = 'submit'; update.className = 'btn'; update.textContent = 'Refresh skill from saved source';
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn'; remove.textContent = 'Uninstall skill bundle';
  const manageStatus = document.createElement('p'); manageStatus.setAttribute('role', 'status');
  manage.append(nameLabel, update, remove); section.append(manage, manageStatus);
  const mutate = async method => {
    if (update.disabled || !name.value.trim()) return;
    update.disabled = true; remove.disabled = true; manageStatus.textContent = 'Applying skill change…';
    try {
      const response = await host.request(method, { name: name.value.trim() }); const result = response?.result ?? response;
      if (result.ok === false) throw new Error(result.error || 'Skill change failed');
      manageStatus.textContent = `${method === 'skills.update' ? 'Refreshed' : 'Uninstalled'} skill: ${name.value.trim()}. Reload to refresh the installed list.`;
    } catch (error) { manageStatus.textContent = `Skill change failed: ${error.message}`; }
    finally { update.disabled = false; remove.disabled = false; }
  };
  manage.addEventListener('submit', event => { event.preventDefault(); void mutate('skills.update'); });
  remove.addEventListener('click', () => { void mutate('skills.uninstall'); });
  const taskForm = document.createElement('form');
  const goalLabel = document.createElement('label'); goalLabel.textContent = 'Skill task goal';
  const goal = document.createElement('textarea'); goal.className = 'input'; goal.placeholder = 'Describe the task for this installed skill'; goal.required = true; goalLabel.append(goal);
  const run = document.createElement('button'); run.type = 'submit'; run.className = 'btn primary'; run.textContent = 'Run skill task';
  const taskStatus = document.createElement('pre'); taskStatus.setAttribute('role', 'status');
  taskForm.append(goalLabel, run); section.append(taskForm, taskStatus);
  taskForm.addEventListener('submit', async event => {
    event.preventDefault(); if (run.disabled || !name.value.trim()) return;
    delete taskStatus.dataset.taskId;
    run.disabled = true; update.disabled = true; remove.disabled = true; taskStatus.textContent = 'Executing skill task…';
    try {
      const response = await host.request('skills.execute', { name: name.value.trim(), goal: goal.value.trim() });
      const result = response?.result ?? response;
      if (result.ok === false || !result.taskId) throw new Error(result.error || 'Skill returned no durable execution result');
      taskStatus.textContent = `Task ${result.taskId}: ${result.status}\n${typeof result.output === 'string' ? result.output : JSON.stringify(result.output)}`;
      taskStatus.dataset.taskId = result.taskId;
    } catch (error) { taskStatus.textContent = `Skill task failed: ${error.message}`; }
    finally { run.disabled = false; update.disabled = false; remove.disabled = false; }
  });
}
