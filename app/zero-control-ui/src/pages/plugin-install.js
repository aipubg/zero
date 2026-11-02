/** Add executable package installation to the existing Plugins settings surface. */
export function mountPluginInstall(container, host) {
  if (!container || container.querySelector('.zero-plugin-install')) return;
  const section = document.createElement('section');
  section.className = 'zero-plugin-install card';
  const heading = document.createElement('h3');
  heading.textContent = 'Install executable plugin';
  const form = document.createElement('form');
  const label = document.createElement('label');
  label.textContent = 'Plugin source';
  const source = document.createElement('input');
  source.name = 'pluginSource';
  source.className = 'input';
  source.placeholder = 'Local plugin directory or npm package';
  source.required = true;
  label.append(source);
  const kindLabel = document.createElement('label');
  kindLabel.textContent = 'Source type';
  const kind = document.createElement('select');
  kind.name = 'sourceType';
  kind.className = 'input';
  for (const [value, text] of [['path', 'Local directory'], ['npm', 'npm package']]) {
    const option = document.createElement('option'); option.value = value; option.textContent = text; kind.append(option);
  }
  kindLabel.append(kind);
  const submit = document.createElement('button');
  submit.className = 'btn primary'; submit.type = 'submit'; submit.textContent = 'Install plugin';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  form.append(label, kindLabel, submit);
  section.append(heading, form, status);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true; status.textContent = 'Installing…';
    try {
      const response = await host.request('plugins.install', kind.value === 'path' ? { source: 'path', path: source.value.trim() } : { source: 'npm', spec: source.value.trim() });
      const result = response?.result ?? response;
      if (result.ok === false) throw new Error(result.error || 'Installation failed');
      status.textContent = `Installed ${result.plugin.name} ${result.plugin.version}. Runtime: ${result.plugin.runtimeStatus}.`;
      source.value = '';
    } catch (error) { status.textContent = `Installation failed: ${error.message}`; }
    finally { submit.disabled = false; }
  });
  container.append(section);
}
