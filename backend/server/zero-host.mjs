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
if (fs.existsSync(envFile)) {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envFile);
    } catch (err) {
      console.warn('[Zero Host] Warning loading .env file via loadEnvFile:', err.message);
    }
  }
  try {
    const content = fs.readFileSync(envFile, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key] || process.env[key] !== val) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn('[Zero Host] Warning loading .env file fallback:', err.message);
  }
}

const PORT = Number(process.env.ZERO_PORT || process.env.PORT || 18789);
// ZERO_* are the canonical first-party variables. OPENCLAW_* are accepted only
// as an internal compatibility fallback so existing installations keep booting.
const CONFIG_PATH = process.env.ZERO_CONFIG_PATH || process.env.OPENCLAW_CONFIG_PATH || path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json');
const STATE_DIR = process.env.ZERO_STATE_DIR || process.env.OPENCLAW_STATE_DIR || path.join(REPO_ROOT, 'zero-system', 'state');

process.env.ZERO_ROOT = REPO_ROOT;
process.env.ZERO_CONFIG_PATH = CONFIG_PATH;
process.env.ZERO_STATE_DIR = STATE_DIR;
process.env.OPENCLAW_CONFIG_PATH ||= CONFIG_PATH;
process.env.OPENCLAW_STATE_DIR ||= STATE_DIR;
process.env.OPENCLAW_NO_AUTO_UPDATE = '1';
process.env.DO_NOT_TRACK = '1';

// Global error handlers: prevent any unhandled exception or rejection from terminating Zero Host
process.on('uncaughtException', (err, origin) => {
  console.error(`[Zero Host] Global Uncaught Exception (${origin}):`, err?.stack || err?.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Zero Host] Global Unhandled Rejection:', reason?.stack || reason?.message || reason);
});

async function bootstrap() {
  console.log(`[Zero Host] Initializing Zero Host control plane on port ${PORT}...`);
  console.log(`[Zero Host] Root: ${REPO_ROOT}`);
  console.log(`[Zero Host] Config: ${CONFIG_PATH}`);

  const runtimeMode = process.env.ZERO_RUNTIME_MODE || 'native';
  console.log(`[Zero Host] Runtime Mode: ${runtimeMode.toUpperCase()}`);

  let instance;

  async function startServer() {
    if (instance && typeof instance.close === 'function') {
      try {
        await instance.close({ reason: 'restart' });
      } catch (err) {
        console.warn('[Zero Host] Warning during previous instance close:', err.message);
      }
    }

    if (runtimeMode === 'legacy-compat') {
      const { LegacyRuntimeAdapter } = await import('../../services/host/legacy-adapter.mjs');
      const adapter = new LegacyRuntimeAdapter({ port: PORT, repoRoot: REPO_ROOT });
      instance = await adapter.start();
    } else {
      const { ZeroNativeHost } = await import('../../services/host/native-gateway.mjs');
      const host = new ZeroNativeHost({ port: PORT, host: '127.0.0.1' });
      host.onRestart = async () => {
        console.log('[Zero Host] In-process gateway restart triggered via supervisor...');
        try {
          await startServer();
        } catch (rErr) {
          console.error('[Zero Host] Error during in-process restart:', rErr);
        }
      };
      instance = await host.start();
    }
    console.log(`[Zero Host] Zero Host successfully operational on http://127.0.0.1:${PORT}`);
  }

  try {
    await startServer();
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
