#!/usr/bin/env node
/**
 * Zero Host - Native Programmatic Control Plane Runner
 * Replaces upstream openclaw.cmd gateway wrapper with a direct Node.js daemon.
 *
 * Provides:
 * 1. Single control plane on port 18789
 * 2. Clean signal trapping and graceful shutdown
 * 3. Dynamic repository root resolution
 * 4. Zero runtime monkeypatching
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = process.env.ZERO_ROOT || path.resolve(__dirname, '..', '..');

const envFile = path.join(REPO_ROOT, '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envFile);
  } catch (err) {
    console.warn('[Zero Host] Warning loading .env file:', err.message);
  }
}

const PORT = Number(process.env.ZERO_PORT || process.env.PORT || 18789);
const CONFIG_PATH = process.env.OPENCLAW_CONFIG_PATH || path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json');
const STATE_DIR = process.env.OPENCLAW_STATE_DIR || path.join(REPO_ROOT, 'zero-system', 'state');

process.env.ZERO_ROOT = REPO_ROOT;
process.env.OPENCLAW_CONFIG_PATH = CONFIG_PATH;
process.env.OPENCLAW_STATE_DIR = STATE_DIR;
process.env.OPENCLAW_NO_AUTO_UPDATE = '1';
process.env.DO_NOT_TRACK = '1';

async function bootstrap() {
  console.log(`[Zero Host] Initializing Zero Host control plane on port ${PORT}...`);
  console.log(`[Zero Host] Root: ${REPO_ROOT}`);
  console.log(`[Zero Host] Config: ${CONFIG_PATH}`);

  const hasLegacyPackage = fs.existsSync(path.join(REPO_ROOT, 'backend', 'node_modules', 'openclaw', 'dist'));
  const runtimeMode = process.env.ZERO_RUNTIME_MODE || (hasLegacyPackage ? 'legacy-compat' : 'native');
  console.log(`[Zero Host] Runtime Mode: ${runtimeMode.toUpperCase()}`);

  let instance;
  try {
    if (runtimeMode === 'legacy-compat') {
      const { LegacyRuntimeAdapter } = await import('../../services/host/legacy-adapter.mjs');
      const adapter = new LegacyRuntimeAdapter({ port: PORT, repoRoot: REPO_ROOT });
      instance = await adapter.start();
    } else {
      const { ZeroNativeHost } = await import('../../services/host/native-gateway.mjs');
      const host = new ZeroNativeHost({ port: PORT, host: '127.0.0.1' });
      instance = await host.start();
    }
    console.log(`[Zero Host] Zero Host successfully operational on http://127.0.0.1:${PORT}`);
  } catch (err) {
    console.error(`[Zero Host] Fatal startup error on port ${PORT}:`, err.message);
    process.exit(1);
  }

  const shutdown = async (signal) => {
    console.log(`\n[Zero Host] Received ${signal}. Shutting down Zero Host gracefully...`);
    try {
      if (instance && typeof instance.close === 'function') {
        await instance.close({ reason: signal });
      }
      console.log('[Zero Host] Shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('[Zero Host] Error during shutdown:', err.message);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Zero Host] Unhandled bootstrap error:', err);
  process.exit(1);
});
