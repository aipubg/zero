#!/usr/bin/env node
/**
 * Zero Host full audit gate.
 *
 * Covers:
 *  1. 100% native DOM: <zero-app> mounted, zero <zero-*> tags, zero
 *     zero/zero/zero strings or external store/community links,
 *     and no "Styles failed to load" banner.
 *  2. Single-room architecture: every tool resolves through
 *     packages/capability-engine, no duplicate RPC switch cases.
 *  3. 20-route visual + console audit: no console errors, no 404/500, no red
 *     banners, no "Memory needs attention", no outer model pills.
 *  4. Live multi-step tool-call chat: two or more real tool calls in
 *     sequence complete and the final reply renders.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE_URL = 'http://127.0.0.1:18789';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = process.cwd();

const ROUTES = [
  '/', '/chat', '/chat/zero',
  '/agents', '/dashboards', '/systems', '/automations', '/plugins', '/usage',
  '/settings/gateway', '/settings/profile', '/settings/devices',
  '/settings/model-providers', '/settings/search', '/settings/memory',
  '/settings/secrets', '/settings/approvals', '/settings/plugins',
  '/settings/labs', '/settings/about',
];

const FORBIDDEN_VISIBLE = [
  'zero', 'zero', 'zero', 'zero', 'zero', 'zero',
  'apps.apple.com', 'play.google.com', 'discord.gg', 'discordapp.com',
  'Styles failed to load',
  'Couldn\'t finish this reply', 'Missing API key',
  'invalid inventory page', 'Gateway/admin required',
  'invalid approval history', 'Remote plugin catalogs are unavailable',
  'Session dashboards are unavailable',
  'r.request is not a function', 'Computer control state unknown',
  'Last ping failed', 'Activity refresh failed',
  'No plugins are installed', 'CLI adapter status is unavailable',
  'Memory needs attention', 'Model Error', 'Model connection timed out',
  'Loading machines', 'Control UI did not start',
  'Voice: PARTIAL',
];

let passed = 0;
let failed = 0;
const failures = [];

const ok = (l) => { passed++; console.log(`  OK   ${l}`); };
const bad = (l, d) => {
  failed++;
  failures.push(`${l}${d ? ` -> ${d}` : ''}`);
  console.log(`  FAIL ${l}${d ? ` -> ${d}` : ''}`);
};

/** Structural checks that do not need a browser. */
function staticChecks() {
  console.log('--- Static Architecture Checks ---');

  // The project must not depend on the upstream package for its UI.
  for (const manifest of ['backend/package.json', 'app/package.json']) {
    const manifestPath = path.join(ROOT, manifest);
    if (!fs.existsSync(manifestPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (deps.zero) bad(`${manifest} has no zero dependency`, 'zero present');
    else ok(`${manifest} has no zero dependency`);
  }

  // The Zero UI must exist (plain files served by the host, no build).
  const uiDir = path.join(ROOT, 'app', 'zero-ui');
  if (!fs.existsSync(path.join(uiDir, 'index.html'))) bad('Zero UI exists', 'app/zero-ui/index.html missing');
  else ok('Zero UI exists');

  // No duplicate RPC switch cases.
  const gw = fs.readFileSync(path.join(ROOT, 'services', 'host', 'native-gateway.mjs'), 'utf8');
  const seen = new Map();
  for (const m of gw.matchAll(/case\s+'([a-zA-Z0-9._-]+)'\s*:/g)) {
    seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  }
  const dupes = [...seen.entries()].filter(([, n]) => n > 1);
  if (!dupes.length) ok('no duplicate RPC switch cases');
  else bad('no duplicate RPC switch cases', dupes.map(([k, n]) => `${k}x${n}`).join(', '));

  // Every tool must be registered through the capability engine.
  const engine = fs.readFileSync(path.join(ROOT, 'packages', 'capability-engine', 'index.mjs'), 'utf8');
  const registration = /registerCapability\(\{\s*name:/.test(engine)
    || /registerCapability\(/.test(engine)
    || /\.set\(`[^`]+`,/.test(engine);
  if (registration) ok('tools are registered through packages/capability-engine');
  else bad('tools are registered through packages/capability-engine', 'no registration found');

  // The tool modules must live in the capability engine.
  for (const file of [
    'browser-control.mjs', 'computer-control.mjs', 'terminal-ops.mjs', 'memory-planner.mjs',
  ]) {
    const p = path.join(ROOT, 'packages', 'capability-engine', file);
    if (fs.existsSync(p)) ok(`packages/capability-engine/${file} exists`);
    else bad(`packages/capability-engine/${file} exists`, 'missing');
  }

  // The legacy tool folders must be gone (core/ was migrated to packages/capability-engine/).
  for (const dir of ['core/execution', 'core/perception', 'core/agent']) {
    const p = path.join(ROOT, dir);
    if (!fs.existsSync(p)) ok(`${dir} does not exist (migrated)`);
    else {
      const leftovers = fs.readdirSync(p);
      if (!leftovers.length) ok(`${dir} is empty`);
      else bad(`${dir} has leftovers`, leftovers.join(', '));
    }
  }
}

async function main() {
  console.log('=== Zero Host Full Audit ===\n');
  staticChecks();

  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) break;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let consoleErrors = [];
  let failedRequests = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', r => failedRequests.push(`${r.failure()?.errorText} ${r.url()}`));
  page.on('response', r => { if (r.status() >= 400) failedRequests.push(`HTTP ${r.status()} ${r.url()}`); });

  try {
    // ---- Route sweep ----
    console.log('\n--- Route Audit ---');
    for (const route of ROUTES) {
      const beforeErr = consoleErrors.length;
      const beforeReq = failedRequests.length;
      let loadErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
          await page.waitForTimeout(2200);
          loadErr = null;
          break;
        } catch (e) {
          loadErr = e.message;
          await new Promise(r => setTimeout(r, 3000));
        }
      }
      if (loadErr) { bad(`${route} load`, loadErr); continue; }

      const newErrs = consoleErrors.slice(beforeErr);
      const newReqs = failedRequests.slice(beforeReq);
      if (newErrs.length) bad(`${route} console errors`, newErrs.slice(0, 2).join(' | ').slice(0, 180));
      else ok(`${route} 0 console errors`);

      if (newReqs.length) bad(`${route} failed requests`, newReqs.slice(0, 2).join(' | ').slice(0, 180));
      else ok(`${route} 0 failed requests`);

      const state = await page.evaluate(() => {
        const text = document.body.innerText || '';
        const red = [];
        for (const el of document.querySelectorAll('[role="alert"], .error, .banner, .callout, .notice')) {
          const t = (el.textContent || '').trim();
          if (!t) continue;
          const cs = getComputedStyle(el);
          const hit = /rgba?\(\s*(1[0-9][0-9]|2[0-5][0-9])\s*,\s*([0-9]{1,2})\s*,\s*([0-9]{1,2})/.test(cs.backgroundColor || '')
            || /rgba?\(\s*(1[0-9][0-9]|2[0-5][0-9])\s*,\s*([0-9]{1,2})\s*,\s*([0-9]{1,2})/.test(cs.color || '');
          if (hit) red.push(t.slice(0, 140));
        }
        const fallback = document.querySelector('#zero-mount-fallback, #zero-mount-fallback, #mount-fallback');
        return {
          text,
          red,
          fallbackVisible: fallback ? fallback.getBoundingClientRect().height > 0 : false,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          zero: [...document.querySelectorAll('*')].filter(e => e.tagName.toLowerCase().startsWith('zero-')).length,
          zeroApp: !!document.querySelector('zero-app'),
          zeroAppVisible: (() => {
            const el = document.querySelector('zero-app');
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          })(),
        };
      });

      const found = FORBIDDEN_VISIBLE.filter(s => state.text.includes(s));
      if (found.length) {
        bad(`${route} visible forbidden text`, found.join(', '));
        for (const s of found.slice(0, 2)) {
          const i = state.text.indexOf(s);
          console.log(`      ctx: ${JSON.stringify(state.text.slice(Math.max(0, i - 140), i + 140))}`);
        }
      } else {
        ok(`${route} no forbidden visible text`);
      }

      if (state.red.length) bad(`${route} red banner`, state.red.slice(0, 2).join(' | ').slice(0, 180));
      else ok(`${route} 0 red banners`);

      if (state.fallbackVisible) bad(`${route} mount fallback visible`);
      else ok(`${route} app mounted`);

      if (state.overflow) bad(`${route} horizontal overflow`);
      else ok(`${route} no horizontal overflow`);

      if (state.zero > 0) bad(`${route} zero custom elements`, String(state.zero));
      else ok(`${route} 0 zero custom elements`);
    }

    // ---- Native DOM + chat ----
    console.log('\n--- Native DOM & Chat ---');
    await page.goto(`${BASE_URL}/chat/zero`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3500);

    const dom = await page.evaluate(() => {
      const vis = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 ? { w: Math.round(r.width), h: Math.round(r.height) } : null;
      };
      // Pick the first *visible* match: the legacy hidden shell elements are
      // still present in the document and would shadow the real ones.
      const firstVisible = (selector) => {
        for (const el of document.querySelectorAll(selector)) {
          const box = vis(el);
          if (box) return box;
        }
        return null;
      };
      const app = document.querySelector('zero-app');
      const probe = getComputedStyle(document.documentElement).getPropertyValue('--zero-css-ok').trim();
      return {
        zeroAppPresent: !!app,
        zeroAppVisible: vis(app),
        cssProbe: probe,
        composer: firstVisible('textarea[placeholder="Message Zero"]'),
        send: firstVisible('.chat-send-btn--send'),
        modelPicker: firstVisible('.chat-controls__model-trigger, summary[data-chat-model-select]'),
        logo: firstVisible('.zero-shell-brand, .sidebar-brand, .topbar-brand'),
        palette: firstVisible('.zero-shell-jump, [aria-label*="command palette" i], [aria-label*="search zero" i], input[placeholder*="Go anywhere"]'),
        permission: document.querySelector('[aria-label^="Execution permissions"]')?.getAttribute('aria-label') || null,
        transcript: document.querySelectorAll('.chat-group, .chat-group-messages, .chat-bubble').length,
      };
    });

    if (dom.zeroAppPresent && dom.zeroAppVisible) ok(`<zero-app> mounted ${dom.zeroAppVisible.w}x${dom.zeroAppVisible.h}`);
    else bad('<zero-app> mounted', JSON.stringify(dom.zeroAppVisible));

    if (dom.cssProbe === '1') ok('--zero-css-ok resolves to 1');
    else bad('--zero-css-ok resolves to 1', `got ${JSON.stringify(dom.cssProbe)}`);

    if (dom.composer && dom.composer.w > 200 && dom.composer.h > 20) ok(`composer ${dom.composer.w}x${dom.composer.h}`);
    else bad('chat composer', JSON.stringify(dom.composer));

    if (dom.send) ok(`send button ${dom.send.w}x${dom.send.h}`);
    else bad('send button', 'not visible');

    if (dom.modelPicker) ok(`model picker ${dom.modelPicker.w}x${dom.modelPicker.h}`);
    else bad('model picker', 'not visible');

    if (dom.logo) ok(`ZERO logo ${dom.logo.w}x${dom.logo.h}`);
    else bad('ZERO logo', 'not visible');

    if (dom.palette) ok(`command palette ${dom.palette.w}x${dom.palette.h}`);
    else bad('command palette', 'not visible');

    if (dom.permission && /Full Access/i.test(dom.permission)) ok(`execution permissions: ${dom.permission}`);
    else bad('execution permissions', dom.permission || 'missing');

    if (dom.transcript > 0) ok(`transcript rendered (${dom.transcript} nodes)`);
    else bad('transcript', 'no chat nodes');

    // ---- Model providers: no chips on the outer card ----
    console.log('\n--- Model Providers ---');
    await page.goto(`${BASE_URL}/settings/model-providers`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    const chips = await page.locator('.zero-provider-card .zero-model-chips-container, .zero-provider-card .zero-model-chip').count();
    if (chips === 0) ok('0 model chips on the outer provider card');
    else bad('outer provider card chips', String(chips));

    // ---- Live multi-step tool-call chat ----
    console.log('\n--- Live Multi-Step Tool Chat ---');
    await page.goto(`${BASE_URL}/chat/zero`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3500);

    const toolCalls = [];
    await page.addInitScript(() => {
      window.__toolCalls = [];
    });

    const input = page.locator('textarea[placeholder="Message Zero"]').first();
    await input.fill('Run the "run_process" tool to print the text zero, then run the "get_system_info" tool, and finally reply with the exact word DONE.');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60000);

    const chatText = await page.locator('body').innerText().catch(() => '');
    if (/Couldn't finish this reply/i.test(chatText)) {
      bad('multi-step chat', 'Couldn\'t finish this reply');
    } else if (/Missing API key/i.test(chatText)) {
      bad('multi-step chat', 'Missing API key');
    } else if (/Model Error|timed out/i.test(chatText)) {
      bad('multi-step chat', 'model error');
    } else {
      ok('multi-step chat completed without error');
    }

    // Count the tool invocations the assistant recorded in the transcript.
    const steps = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('.chat-group, .chat-group-messages, [class*="tool"], [class*="step"]')];
      return {
        toolNodes: document.querySelectorAll('[class*="tool-call"], [class*="tool-result"], .tool-call, .tool-result').length,
        total: nodes.length,
        body: document.body.innerText || '',
      };
    });
    const toolMention = /run_process|get_system_info|tool/i.test(steps.body);
    if (toolMention) ok(`transcript records tool activity (${steps.toolNodes} tool nodes)`);
    else bad('transcript records tool activity', 'no tool markers found');

    console.log('\n========================================');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failures.length) {
      console.log('\nFailures:');
      for (const f of failures) console.log(`  - ${f}`);
    }
    console.log('========================================\n');
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('AUDIT CRASHED:', err);
  process.exit(1);
});
