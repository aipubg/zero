/**
 * @fileoverview Zero Self-Registering Tool Registry
 *
 * Hermes-inspired pattern: each tool module self-registers on import via
 * `registry.register()`. A central singleton collects all tools; auto-discovery
 * scans a tools directory for modules that call `registry.register()`.
 *
 * This complements the existing CAPABILITY_DEFINITIONS/static registry in
 * capability-engine/index.mjs — tools registered here can be added to the
 * capability engine via registerCapability()/registerHandler().
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export class ToolRegistry {
  constructor() {
    this._tools = new Map(); // name -> ToolEntry
    this._discovered = false;
  }

  /**
   * Register a tool. Called by tool modules at import time.
   * Throws if a different toolset already owns the name (unless override=true).
   */
  register({ name, toolset, schema, handler, checkFn, requiresEnv, isAsync = false, emoji, override = false }) {
    if (!name || typeof name !== 'string') {
      throw new Error('Tool registration requires a valid name');
    }
    if (!handler || typeof handler !== 'function') {
      throw new Error(`Tool '${name}' requires a handler function`);
    }
    if (!schema || typeof schema !== 'object') {
      throw new Error(`Tool '${name}' requires a schema object`);
    }

    const existing = this._tools.get(name);
    if (existing && existing.toolset !== toolset && !override) {
      throw new Error(
        `Tool '${name}' is already owned by toolset '${existing.toolset}'; use override=true to replace`
      );
    }

    this._tools.set(name, {
      name,
      toolset,
      schema,
      handler,
      checkFn: checkFn || (() => true),
      requiresEnv: requiresEnv || [],
      isAsync,
      emoji,
      registeredAt: Date.now(),
    });
    return true;
  }

  /** Get a tool entry by name. */
  get(name) {
    return this._tools.get(name) || null;
  }

  /** List all registered tool entries. */
  list() {
    return Array.from(this._tools.values());
  }

  /** Get tool definitions in the format expected by the model (function calling schema). */
  definitions(filteredNames = null) {
    const names = filteredNames ? new Set(filteredNames) : null;
    return this.list()
      .filter((t) => !names || names.has(t.name))
      .filter((t) => {
        try { return t.checkFn(); } catch { return false; }
      })
      .map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.schema.description || t.name,
          parameters: t.schema.parameters || { type: 'object', properties: {}, additionalProperties: true },
        },
      }));
  }

  /** Dispatch a tool call by name with args. Returns result or error JSON string. */
  async dispatch(name, args = {}, signal = null) {
    const entry = this._tools.get(name);
    if (!entry) {
      return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
    try {
      if (signal?.aborted) throw new Error('Cancelled');
      const result = entry.isAsync
        ? await entry.handler(args, signal)
        : entry.handler(args, signal);
      return result;
    } catch (err) {
      return JSON.stringify({ error: `Tool execution failed: ${type(err).__name__ || err.constructor.name}: ${err.message}` });
    }
  }

  /** Check if all required env vars for a tool are present. */
  envReady(name) {
    const entry = this._tools.get(name);
    if (!entry) return false;
    return entry.requiresEnv.every((v) => Boolean(process.env[v]));
  }

  /** List tools whose env requirements are met. */
  readyTools() {
    return this.list().filter((t) => this.envReady(t.name));
  }

  size() {
    return this._tools.size;
  }

  clear() {
    this._tools.clear();
    this._discovered = false;
  }
}

export const toolRegistry = new ToolRegistry();

/**
 * Auto-discover tools from a directory. Scans .mjs/.js files for top-level
 * registry.register() calls and imports them so they self-register.
 */
export async function discoverTools(dir, registryInstance = toolRegistry) {
  if (!fs.existsSync(dir)) return { loaded: 0, tools: [], errors: [] };

  const errors = [];
  let loaded = 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() && (entry.name.endsWith('.mjs') || entry.name.endsWith('.js'))) {
      const filePath = path.join(dir, entry.name);
      try {
        // Dynamic import triggers top-level registry.register() calls.
        const mod = await import(pathToFileURL(filePath).href);
        // Count tools that were newly registered by this module.
        const before = registryInstance.size();
        loaded++;
      } catch (err) {
        errors.push({ file: filePath, error: err.message });
      }
    }
  }

  return { loaded, tools: registryInstance.list(), errors };
}