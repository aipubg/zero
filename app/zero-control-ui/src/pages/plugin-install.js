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
  for (const [value, text] of [['path', 'Local directory'], ['npm', 'npm package'], ['mcp', 'Executable MCP package']]) {
    const option = document.createElement('option'); option.value = value; option.textContent = text; kind.append(option);
  }
  kindLabel.append(kind);
  const argsLabel = document.createElement('label'); argsLabel.textContent = 'MCP executable arguments (JSON array)';
  const args = document.createElement('input'); args.className = 'input'; args.placeholder = 'MCP executable arguments as JSON'; args.value = '[]'; argsLabel.append(args);
  const submit = document.createElement('button');
  submit.className = 'btn primary'; submit.type = 'submit'; submit.textContent = 'Install plugin';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  form.append(label, kindLabel, argsLabel, submit);
  section.append(heading, form, status);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true; status.textContent = 'Installing…';
    try {
      const request = kind.value === 'path' ? { source: 'path', path: source.value.trim() } : kind.value === 'mcp' ? { source: 'mcp', spec: source.value.trim(), args: JSON.parse(args.value) } : { source: 'npm', spec: source.value.trim() };
      const response = await host.request('plugins.install', request);
      const result = response?.result ?? response;
      if (result.ok === false) throw new Error(result.error || 'Installation failed');
      status.textContent = `Installed ${result.plugin.name} ${result.plugin.version}. Runtime: ${result.plugin.runtimeStatus}.`;
      source.value = '';
    } catch (error) { status.textContent = `Installation failed: ${error.message}`; }
    finally { submit.disabled = false; }
  });
  container.append(section);
}
