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
  argsLabel.hidden = true;
  kind.addEventListener('change', () => { argsLabel.hidden = kind.value !== 'mcp'; });
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
      managedId.value = result.plugin.id;
      source.value = '';
    } catch (error) { status.textContent = `Installation failed: ${error.message}`; }
    finally { submit.disabled = false; }
  });
  const manage = document.createElement('form');
  const managedLabel = document.createElement('label'); managedLabel.textContent = 'Installed plugin ID';
  const managedId = document.createElement('input'); managedId.className = 'input'; managedId.placeholder = 'Installed plugin ID'; managedId.required = true; managedLabel.append(managedId);
  const refresh = document.createElement('button'); refresh.type = 'submit'; refresh.className = 'btn'; refresh.textContent = 'Refresh plugin from saved source';
  const restart = document.createElement('button'); restart.type = 'button'; restart.className = 'btn'; restart.textContent = 'Restart executable plugin';
  const manageStatus = document.createElement('p'); manageStatus.setAttribute('role', 'status');
  manage.append(managedLabel, refresh, restart); section.append(manage, manageStatus);
  const mutate = async method => {
    const id = managedId.value.trim(); if (!id || refresh.disabled) return;
    refresh.disabled = true; restart.disabled = true; manageStatus.textContent = 'Applying plugin change…';
    try {
      const response = await host.request(method, { pluginId: id }); const result = response?.result ?? response;
      if (result.ok === false) throw new Error(result.error || 'Plugin change failed');
      manageStatus.textContent = `${method === 'plugins.update' ? 'Refreshed' : 'Restarted'} plugin: ${id}.`;
    } catch (error) { manageStatus.textContent = `Plugin change failed: ${error.message}`; }
    finally { refresh.disabled = false; restart.disabled = false; }
  };
  manage.addEventListener('submit', event => { event.preventDefault(); void mutate('plugins.update'); });
  restart.addEventListener('click', () => { void mutate('plugins.restart'); });
  container.append(section);
}
