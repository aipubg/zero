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
}
