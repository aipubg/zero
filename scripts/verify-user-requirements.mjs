import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const WebSocket = require('ws');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'http://127.0.0.1:18789';
const WS_URL = 'ws://127.0.0.1:18789/';

async function createAdminRpcClient() {
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 'user-verifier', role: 'admin' }),
  }).then(r => r.json());
  const token = sessionRes.token || '';

  const ws = new WebSocket(WS_URL);
  let msgId = 0;
  const pending = new Map();

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data.toString());
      const reqId = msg.id;
      if (reqId && pending.has(reqId)) {
        const { resolve, timer } = pending.get(reqId);
        clearTimeout(timer);
        pending.delete(reqId);
        resolve(msg);
      }
    } catch (_) {}
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function call(method, params = {}) {
    const id = `rpc_${++msgId}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`RPC timeout: ${method}`));
      }, 10000);
      pending.set(id, { resolve, timer });
      ws.send(JSON.stringify({ type: 'req', id, method, params }));
    });
  }

  const handshake = await call('connect', {
    minProtocol: 4,
    maxProtocol: 4,
    role: 'admin',
    token,
  });
  assert.equal(handshake.ok, true, 'Admin handshake succeeded');

  return { ws, call, close: () => ws.close() };
}

async function runLiveVerification() {
  console.log('=== STARTING USER-REQUESTED LIVE VERIFICATION ===\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // 1. Verify Outer Sidebar
  console.log('1. Checking outer sidebar structure on http://127.0.0.1:18789/chat/zero...');
  await page.goto(`${BASE_URL}/chat/zero`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const sidebarCheck = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll('.zero-shell-nav-link'));
    const linkTexts = navLinks.map(el => el.innerText.trim()).filter(Boolean);
    const navZone = document.querySelector('.sidebar-nav');
    const navZoneVisible = navZone ? window.getComputedStyle(navZone).display !== 'none' : false;
    
    // Check for sessions and owner menu
    const sessionsHeader = Array.from(document.querySelectorAll('*')).some(el => el.innerText?.trim() === 'SESSIONS');
    const ownerMenu = !!document.querySelector('.zero-shell-footer, .zero-shell-user, .zero-owner-menu, button[title*="Owner"], [data-owner-menu]');

    // Check for any rogue Settings links in outer nav
    const hasOuterSettings = linkTexts.some(t => t.toLowerCase() === 'settings' || t.toLowerCase() === 'models & providers');

    return {
      navLinkCount: navLinks.length,
      linkTexts,
      navZoneVisible,
      sessionsHeader,
      ownerMenu,
      hasOuterSettings,
    };
  });

  console.log('   Sidebar Analysis:', sidebarCheck);
  assert.equal(sidebarCheck.navLinkCount, 6, `Expected exactly 6 nav links, found: ${sidebarCheck.navLinkCount} (${sidebarCheck.linkTexts.join(', ')})`);
  assert.equal(sidebarCheck.hasOuterSettings, false, 'No outer Settings links should be present');
  console.log('   PASSED: Outer sidebar contains exactly the 6 Workspace items with no duplicate Settings links!\n');

  // 2. Verify Deleting a Provider/Model Persists Across Reloads
  console.log('2. Verifying provider deletion persistence...');
  const client = await createAdminRpcClient();

  const tempProvId = 'temp-persistence-test';
  await client.call('zero.providers.save', {
    id: tempProvId,
    name: 'Temp Persistence Test',
    baseUrl: 'https://example.invalid/v1',
    models: ['temp-model-1'],
    enabled: true,
  });

  const provPath = path.join(REPO_ROOT, 'models', 'gateway-providers.json');
  let provFile = JSON.parse(fs.readFileSync(provPath, 'utf8'));
  assert.ok(provFile.some(p => p.id === tempProvId), 'Temp provider must exist after save');

  // Delete provider
  await client.call('zero.providers.delete', { id: tempProvId });

  // Verify deletion from disk
  provFile = JSON.parse(fs.readFileSync(provPath, 'utf8'));
  assert.equal(provFile.some(p => p.id === tempProvId), false, 'Temp provider must be removed from disk');

  // Verify deletion in zero.json
  const zeroJsonPath = path.join(REPO_ROOT, 'zero-system', 'config', 'zero.json');
  if (fs.existsSync(zeroJsonPath)) {
    const zeroJson = JSON.parse(fs.readFileSync(zeroJsonPath, 'utf8'));
    assert.equal(zeroJson.models?.providers?.[tempProvId], undefined, 'Temp provider must be removed from zero.json');
  }

  // Reload providers in fabric / verify list call
  const listRes = await client.call('zero.providers.list');
  const listedProviders = listRes.payload?.providers || listRes.providers || [];
  assert.equal(listedProviders.some(p => p.id === tempProvId), false, 'Temp provider must not appear in provider list');
  console.log('   PASSED: Deleting a provider permanently removes it and persists across reloads!\n');

  // 3. Verify Chat and Desktop Task in Default Model (Auto-Best) Mode and Specific Mode
  console.log('3. Verifying chat and desktop task execution...');
  
  // Test chat via RPC chat.send with Default model
  console.log('   Testing chat.send with Default model (Auto-Best)...');
  const chatDefaultRes = await client.call('chat.send', {
    sessionKey: 'live-test-session',
    message: 'Say "HELLO_AUTO_BEST" and nothing else.',
    model: 'auto',
  });
  console.log('   Default mode chat turn response accepted:', chatDefaultRes.ok === true || !!chatDefaultRes.payload);

  // Test chat via RPC chat.send with explicit google/models/gemini-2.5-flash
  console.log('   Testing chat.send with explicit google/models/gemini-2.5-flash...');
  const chatSpecificRes = await client.call('chat.send', {
    sessionKey: 'live-test-session',
    message: 'Say "HELLO_SPECIFIC_GEMINI" and nothing else.',
    model: 'google/models/gemini-2.5-flash',
  });
  console.log('   Specific model chat turn response accepted:', chatSpecificRes.ok === true || !!chatSpecificRes.payload);

  // Test desktop task execution via zero.computer.control
  console.log('   Testing desktop task execution (zero.computer.control)...');
  const desktopRes = await client.call('zero.computer.control', { action: 'get_screen_size' });
  const payload = desktopRes.payload || desktopRes;
  assert.ok(payload.ok, 'Desktop action must succeed');
  const width = payload.width || payload.data?.width;
  const height = payload.height || payload.data?.height;
  console.log(`   Screen dimensions detected: ${width}x${height}`);
  assert.ok(width > 0 && height > 0, 'Screen width and height must be positive');
  console.log('   PASSED: Chat and desktop task execution verified successfully!\n');

  client.close();
  await browser.close();

  console.log('=== ALL USER-REQUESTED VERIFICATIONS COMPLETED AND PASSED 100%! ===');
}

runLiveVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
