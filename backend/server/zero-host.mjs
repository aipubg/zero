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

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = process.env.ZERO_ROOT || path.resolve(__dirname, '..', '..');

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

  const serverEntryModule = path.join(REPO_ROOT, 'backend', 'node_modules', 'openclaw', 'dist', 'server-BS3i_xS_.mjs');
  const { startGatewayServer } = await import(pathToFileURL(serverEntryModule).href);

  let instance;
  try {
    instance = await startGatewayServer(PORT);
    console.log(`[Zero Host] Zero Host successfully listening on http://127.0.0.1:${PORT}`);
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
