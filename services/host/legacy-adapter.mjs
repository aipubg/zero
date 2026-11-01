/**
 * @fileoverview Zero Reference Runtime Legacy Compatibility Adapter Boundary
 * 
 * Explicit adapter boundary to compare native Zero services against reference
 * runtime implementations during Phase 2 / Milestone C migration.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export class LegacyRuntimeAdapter {
  constructor(options = {}) {
    this.port = options.port || 18789;
    this.repoRoot = options.repoRoot || process.cwd();
    this._instance = null;
  }

  async start() {
    console.warn('[LegacyRuntimeAdapter] Booting reference runtime compatibility adapter...');
    const distDir = path.join(this.repoRoot, 'backend', 'node_modules', 'openclaw', 'dist');
    if (!fs.existsSync(distDir)) {
      throw new Error(`Reference runtime not found at ${distDir}`);
    }

    // Locate gateway server entry point dynamically rather than hardcoding hashed filenames
    const files = fs.readdirSync(distDir);
    const serverModuleFile = files.find((f) => {
      if (!f.startsWith('server-') || !f.endsWith('.mjs')) return false;
      try {
        const content = fs.readFileSync(path.join(distDir, f), 'utf-8');
        return content.includes('startGatewayServer');
      } catch {
        return false;
      }
    });

    if (!serverModuleFile) {
      throw new Error('Could not find server entry module exporting startGatewayServer in reference runtime dist');
    }

    const fullPath = path.join(distDir, serverModuleFile);
    const mod = await import(pathToFileURL(fullPath).href);
    if (typeof mod.startGatewayServer !== 'function') {
      throw new Error(`Module ${serverModuleFile} did not export startGatewayServer`);
    }
    this._instance = await mod.startGatewayServer(this.port);
    return this._instance;
  }

  async close(options = {}) {
    if (this._instance && typeof this._instance.close === 'function') {
      await this._instance.close(options);
    }
  }
}
