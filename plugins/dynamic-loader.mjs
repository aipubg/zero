import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Hermes-Style Dynamic Plugin Loader
 * Discovers and safely loads drop-in plugins from the `plugins/` directory with lifecycle hooks:
 * - `on_startup(context)`
 * - `on_message(message, context)`
 * - `register_tools(registerFn)`
 */
export class DynamicPluginLoader {
  constructor({ pluginsDir = path.resolve(process.cwd(), "plugins"), logger = console } = {}) {
    this.pluginsDir = pluginsDir;
    this.logger = logger;
    this.plugins = new Map();
    this.tools = new Map();
  }

  async loadAll(context = {}) {
    if (!fs.existsSync(this.pluginsDir)) {
      try {
        fs.mkdirSync(this.pluginsDir, { recursive: true });
      } catch {
        return { loaded: 0, plugins: [] };
      }
    }

    const entries = fs.readdirSync(this.pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await this.loadPlugin(entry.name, context);
      }
    }

    return {
      loaded: this.plugins.size,
      plugins: Array.from(this.plugins.keys()),
      tools: Array.from(this.tools.keys()),
    };
  }

  async loadPlugin(pluginName, context = {}) {
    const pluginPath = path.join(this.pluginsDir, pluginName);
    const candidateEntries = [
      path.join(pluginPath, "index.mjs"),
      path.join(pluginPath, "index.js"),
      path.join(pluginPath, "plugin.mjs"),
      path.join(pluginPath, "plugin.js"),
    ];

    let entryFile = null;
    for (const cand of candidateEntries) {
      if (fs.existsSync(cand)) {
        entryFile = cand;
        break;
      }
    }

    if (!entryFile) {
      return { ok: false, reason: "no-entry-file" };
    }

    try {
      const module = await import(pathToFileURL(entryFile).href);
      const pluginInstance = module.default || module;

      const metadata = {
        name: pluginName,
        path: entryFile,
        hooks: {
          on_startup: typeof pluginInstance.on_startup === "function",
          on_message: typeof pluginInstance.on_message === "function",
          register_tools: typeof pluginInstance.register_tools === "function",
        },
      };

      // 1. Run register_tools
      if (metadata.hooks.register_tools) {
        try {
          pluginInstance.register_tools((tool) => {
            if (tool && tool.name) {
              this.tools.set(tool.name, { ...tool, plugin: pluginName });
            }
          });
        } catch (err) {
          this.logger.warn?.(`[Plugin ${pluginName}] register_tools error:`, err.message);
        }
      }

      // 2. Run on_startup
      if (metadata.hooks.on_startup) {
        try {
          await pluginInstance.on_startup(context);
        } catch (err) {
          this.logger.warn?.(`[Plugin ${pluginName}] on_startup error:`, err.message);
        }
      }

      this.plugins.set(pluginName, { instance: pluginInstance, metadata });
      return { ok: true, name: pluginName };
    } catch (err) {
      this.logger.warn?.(`[PluginLoader] Failed to load plugin ${pluginName}:`, err.message);
      return { ok: false, error: err.message };
    }
  }

  async triggerOnMessage(message, context = {}) {
    let currentMessage = message;
    for (const [name, plugin] of this.plugins.entries()) {
      if (plugin.metadata.hooks.on_message) {
        try {
          const result = await plugin.instance.on_message(currentMessage, context);
          if (result !== undefined && result !== null) {
            currentMessage = result;
          }
        } catch (err) {
          this.logger.warn?.(`[Plugin ${name}] on_message error:`, err.message);
        }
      }
    }
    return currentMessage;
  }

  getTools() {
    return Array.from(this.tools.values());
  }

  listPlugins() {
    return Array.from(this.plugins.values()).map((p) => p.metadata);
  }
}
