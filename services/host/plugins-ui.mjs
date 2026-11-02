/** Native plugins-page projection over the host's existing PluginManager. */
export const PLUGINS_UI_METHODS = Object.freeze([
  'plugins.list', 'plugins.inspect', 'plugins.install', 'plugins.setEnabled',
  'plugins.enable', 'plugins.disable', 'plugins.update', 'plugins.restart',
  'plugins.uninstall', 'plugins.remove', 'plugins.diagnostics',
  'plugins.catalog.categories', 'plugins.catalog.browse', 'plugins.catalog.get',
]);

const generations = new WeakMap();
const remoteGap = 'Remote plugin catalogs are unavailable. Install a local plugin directory or an npm package.';
const mutations = new Set(['plugins.install', 'plugins.setEnabled', 'plugins.enable', 'plugins.disable',
  'plugins.update', 'plugins.restart', 'plugins.uninstall', 'plugins.remove']);

function idOf(params) {
  const id = params.pluginId || params.id;
  if (typeof id !== 'string' || !id.trim()) throw new Error('A pluginId is required');
  return id;
}

function required(manager, id) {
  const plugin = manager.getPlugin(id);
  if (!plugin) throw new Error(`Plugin '${id}' not installed`);
  return plugin;
}

export function pluginUiRow(plugin) {
  return {
    id: plugin.id, name: plugin.name, version: plugin.version, description: plugin.description,
    installed: true, enabled: plugin.status === 'enabled', removable: true,
    state: plugin.runtimeStatus === 'unavailable' ? 'error' : plugin.status === 'disabled' ? 'disabled' : 'enabled',
    status: plugin.status, runtimeStatus: plugin.runtimeStatus, loaded: plugin.loaded,
    origin: 'local', source: plugin.source?.kind === 'package' ? 'npm' : 'path',
    catalogId: plugin.id, hasIcon: false, capabilities: [...plugin.capabilities],
    permissions: [...plugin.permissions], installedAt: plugin.installedAt, updatedAt: plugin.updatedAt,
    ...(plugin.error ? { error: plugin.error } : {}),
  };
}

function generation(manager) {
  const rows = manager.listPlugins().map((plugin) => [plugin.id, plugin.version, plugin.status,
    plugin.runtimeStatus, plugin.updatedAt, plugin.source?.revision, plugin.error]);
  const fingerprint = JSON.stringify(rows);
  let state = generations.get(manager);
  if (!state) { state = { fingerprint, generation: 1 }; generations.set(manager, state); }
  else if (state.fingerprint !== fingerprint) { state.fingerprint = fingerprint; state.generation++; }
  return state.generation;
}

function catalogItem(plugin) {
  return {
    id: plugin.id,
    catalog: { name: plugin.name, summary: plugin.description, latestVersion: plugin.version,
      origin: 'local', official: false, categories: [], featured: false, trending: false },
    local: { installed: true, pluginId: plugin.id, enabled: plugin.status === 'enabled',
      state: pluginUiRow(plugin).state, version: plugin.version, action: 'manage' },
  };
}

function catalogDetail(plugin) {
  return {
    plugin: catalogItem(plugin),
    detail: { origin: 'local', name: plugin.name, version: plugin.version,
      description: plugin.description, readme: plugin.description, createdAt: plugin.installedAt,
      updatedAt: plugin.updatedAt, skills: [], providers: [], channels: [], mcpServers: [],
      mcpServerDetails: [], uiCapabilities: [], contracts: { tools: [...plugin.capabilities] } },
  };
}

function inspect(plugin) {
  return {
    ok: true, pluginId: plugin.id, plugin: pluginUiRow(plugin),
    overview: { name: plugin.name, version: plugin.version, description: plugin.description },
    declared: { tools: [...plugin.capabilities] },
    components: { tools: [...plugin.capabilities], skills: [], skillDetails: [], hooks: [],
      channels: [], providers: [], commands: [], services: [], mcpServers: [] },
    grants: { hooks: { allowPromptInjection: { effective: false }, allowConversationAccess: { effective: false } } },
    credentials: [], mcpAuth: [], permissions: [...plugin.permissions], catalog: catalogDetail(plugin),
  };
}

function sourceOf(params) {
  if (params.manifest !== undefined) return params.manifest;
  const source = params.source;
  if (source && typeof source === 'object') {
    const kind = source.kind || source.type;
    if (source.path || source.directory || ['path', 'directory', 'local'].includes(kind)) {
      return { path: source.path || source.directory || source.spec, ...(params.config !== undefined ? { config: params.config } : {}) };
    }
    if (source.package || ['npm', 'package'].includes(kind)) return { package: source.package || source.spec };
    throw new Error('Plugin source object requires a local path or npm package');
  }
  if (source && !['path', 'local', 'directory', 'npm', 'package'].includes(source)) {
    throw new Error(`Plugin source '${source}' is unavailable. Supply source:'path' with path, or source:'npm' with spec.`);
  }
  if (params.path || params.directory) return { path: params.path || params.directory, ...(params.config !== undefined ? { config: params.config } : {}) };
  const spec = params.package || params.spec || params.packageName;
  if (spec && (!source || ['npm', 'package'].includes(source))) return { package: spec, ...(params.config !== undefined ? { config: params.config } : {}) };
  throw new Error('Plugin installation requires a local path or npm package specifier');
}

function receipt(manager, plugin, warnings = []) {
  return { ok: true, plugin: pluginUiRow(plugin), generation: generation(manager),
    restartRequired: false, warnings, runtime: { committed: true, phase: 'complete', status: plugin.runtimeStatus } };
}

/** Return undefined when unhandled. Authentication/authorization remains the host's job. */
export async function handlePluginsUi(method, params = {}, manager, { mutationAllowed = true } = {}) {
  if (!PLUGINS_UI_METHODS.includes(method)) return undefined;
  if (!manager) throw new Error('The host PluginManager is required');
  await manager.ready;
  if (mutations.has(method) && !mutationAllowed) throw new Error('Plugin mutations are disabled');
  switch (method) {
    case 'plugins.list':
      return { ok: true, generation: generation(manager), mutationAllowed,
        plugins: manager.listPlugins(params).map(pluginUiRow), diagnostics: manager.getDiagnostics() };
    case 'plugins.inspect':
      return inspect(required(manager, idOf(params)));
    case 'plugins.install': {
      const input = sourceOf(params);
      // An expected identity must be checked before executing the new module.
      const descriptor = params.expectedPluginId && typeof input === 'object'
        ? { ...input, id: params.expectedPluginId } : input;
      return receipt(manager, await manager.installPlugin(descriptor, params.handlers));
    }
    case 'plugins.setEnabled':
      if (typeof params.enabled !== 'boolean') throw new Error('plugins.setEnabled requires boolean enabled');
      return receipt(manager, await (params.enabled ? manager.enablePlugin(idOf(params)) : manager.disablePlugin(idOf(params))));
    case 'plugins.enable':
      return receipt(manager, await manager.enablePlugin(idOf(params)));
    case 'plugins.disable':
      return receipt(manager, await manager.disablePlugin(idOf(params)));
    case 'plugins.restart':
      return receipt(manager, await manager.restartPlugin(idOf(params)));
    case 'plugins.update': {
      const hasSource = ['manifest', 'path', 'directory', 'source', 'package', 'spec', 'packageName'].some((key) => params[key] !== undefined);
      return receipt(manager, await manager.updatePlugin(idOf(params), hasSource ? sourceOf(params) : undefined,
        params.config !== undefined ? { config: params.config } : {}));
    }
    case 'plugins.uninstall':
    case 'plugins.remove': {
      const id = idOf(params);
      const previous = pluginUiRow(required(manager, id));
      const result = await manager.uninstallPlugin(id);
      return { ...result, generation: generation(manager), warnings: [], restartRequired: false,
        plugin: { ...previous, installed: false, enabled: false, loaded: false, runtimeStatus: 'removed', state: 'not-installed' } };
    }
    case 'plugins.diagnostics':
      return manager.getDiagnostics();
    case 'plugins.catalog.categories':
      return { categories: [], remoteAvailable: false };
    case 'plugins.catalog.browse': {
      if (params.cursor) throw new Error('Local plugin catalog does not use cursors');
      const query = String(params.query || '').toLowerCase();
      const plugins = manager.listPlugins().filter((plugin) => !query || `${plugin.id} ${plugin.name} ${plugin.description}`.toLowerCase().includes(query));
      return { items: ['featured', 'trending'].includes(params.intent) || params.category ? [] : plugins.map(catalogItem),
        categories: [], remoteError: remoteGap };
    }
    case 'plugins.catalog.get':
      return catalogDetail(required(manager, idOf(params)));
  }
}
