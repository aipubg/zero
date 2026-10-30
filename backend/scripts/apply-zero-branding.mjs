#!/usr/bin/env node
/**
 * Zero Branding Enforcement Script
 * Permanently applies pure Zero / Client Zero branding to all Control UI assets,
 * HTML fallbacks, favicons, and telemetry hooks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ZERO_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="zero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="#090d12"/>
  <circle cx="16" cy="16" r="10" fill="none" stroke="url(#zero-grad)" stroke-width="3" stroke-linecap="round"/>
  <text x="16" y="21" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="900" font-size="14" fill="#10b981" text-anchor="middle">Z</text>
</svg>`;

const ZERO_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zero Control</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      body {
        margin: 0;
        background: #090d12;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .zero-initial-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        gap: 16px;
      }
      .zero-spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #1e293b;
        border-top-color: #10b981;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="zero-initial-loader">
        <div class="zero-spinner"></div>
        <div style="font-weight:600;font-size:14px;color:#94a3b8;">Zero Control UI</div>
      </div>
    </div>
    <script type="module" src="/index.js"></script>
  </body>
</html>`;

function findControlUiDirs() {
  const dirs = [];
  const searchRoots = [
    path.join(REPO_ROOT, 'backend', 'node_modules'),
    path.join(REPO_ROOT, '.zero-data', 'fresh-workspace', 'gateway-state'),
  ];

  function walk(current, depth = 0) {
    if (depth > 8) return;
    try {
      if (!fs.existsSync(current)) return;
      for (const item of fs.readdirSync(current)) {
        if (item === '.git') continue;
        const full = path.join(current, item);
        let st;
        try { st = fs.statSync(full); } catch { continue; }
        if (st.isDirectory()) {
          if (item === 'control-ui' && fs.existsSync(path.join(full, 'assets'))) {
            dirs.push(full);
          } else {
            walk(full, depth + 1);
          }
        }
      }
    } catch {}
  }

  for (const root of searchRoots) {
    walk(root);
  }
  return [...new Set(dirs)];
}

export function applyZeroBranding() {
  console.log('[Zero Branding] Applying pure Zero branding to all Control UI installations...');
  const uiDirs = findControlUiDirs();
  console.log(`[Zero Branding] Found ${uiDirs.length} Control UI targets:`, uiDirs);

  for (const dir of uiDirs) {
    try {
      // 1. Favicon
      const favPath = path.join(dir, 'favicon.svg');
      fs.writeFileSync(favPath, ZERO_FAVICON_SVG, 'utf8');

      // 2. index.html
      const indexPath = path.join(dir, 'index.html');
      if (fs.existsSync(indexPath)) {
        let idxContent = fs.readFileSync(indexPath, 'utf8');
        idxContent = idxContent.replace(/<title>.*?<\/title>/i, '<title>Zero Control</title>');
        idxContent = idxContent.replaceAll('OpenClaw', 'Zero');
        idxContent = idxContent.replaceAll('Gateway unreachable', 'Zero Gateway Connecting');
        fs.writeFileSync(indexPath, idxContent, 'utf8');
      }

      // 3. Asset bundles
      const assetsDir = path.join(dir, 'assets');
      if (fs.existsSync(assetsDir)) {
        for (const file of fs.readdirSync(assetsDir)) {
          if (file.endsWith('.js') || file.endsWith('.html')) {
            const fPath = path.join(assetsDir, file);
            let code = fs.readFileSync(fPath, 'utf8');
            let changed = false;

            if (code.includes('Ask OpenClaw')) {
              code = code.replaceAll('Ask OpenClaw', 'Ask Zero');
              changed = true;
            }
            if (code.includes('Gateway unreachable')) {
              code = code.replaceAll('Gateway unreachable', 'Zero Gateway Connecting');
              changed = true;
            }
            if (code.includes('Connect to OpenClaw')) {
              code = code.replaceAll('Connect to OpenClaw', 'Connect to Zero');
              changed = true;
            }
            if (code.includes('openclaw.ai')) {
              code = code.replaceAll('https://openclaw.ai', 'http://127.0.0.1:18789');
              code = code.replaceAll('https://docs.openclaw.ai', 'http://127.0.0.1:18789');
              code = code.replaceAll('openclaw.ai', '127.0.0.1');
              changed = true;
            }
            if (file.startsWith('about-page-') && code.includes('J=[{href:')) {
              code = code.replace(/J=\[\{href:[^\]]+\]/, 'J=[]');
              changed = true;
            }

            if (changed) {
              fs.writeFileSync(fPath, code, 'utf8');
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Zero Branding] Error branding dir ${dir}:`, err.message);
    }
  }

  // 4. Neutralize Telemetry in OpenClaw dist if present
  try {
    const distDir = path.join(REPO_ROOT, 'backend', 'node_modules', '.pnpm', 'openclaw@2026.10.6', 'node_modules', 'openclaw', 'dist');
    if (fs.existsSync(distDir)) {
      for (const f of fs.readdirSync(distDir)) {
        if (f.startsWith('telemetry-') && f.endsWith('.mjs')) {
          const tPath = path.join(distDir, f);
          let tCode = fs.readFileSync(tPath, 'utf8');
          if (tCode.includes('telemetry.openclaw.ai')) {
            tCode = tCode.replaceAll('https://telemetry.openclaw.ai', '');
            tCode = tCode.replaceAll('telemetry.openclaw.ai', '');
            fs.writeFileSync(tPath, tCode, 'utf8');
            console.log(`[Zero Branding] Neutralized telemetry in ${f}`);
          }
        }
      }
    }
  } catch {}

  console.log('[Zero Branding] Pure Zero branding successfully applied 100%!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applyZeroBranding();
}
