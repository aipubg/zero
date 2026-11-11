/** REAL_BROWSER + INTEGRATION: provider catalog/default survive a real host restart. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';
const root = path.resolve(import.meta.dirname, '..');
const state = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-provider-catalog-'));
const providers = path.join(state, 'providers.json'), bindings = path.join(state, 'bindings.json');
fs.writeFileSync(providers, JSON.stringify([{ id: 'first', baseUrl: 'https://example.invalid/v1', models: ['shared'] }]));
fs.writeFileSync(bindings, JSON.stringify({ defaults: { primary: 'first/shared' }, agentBindings: { zero: { model: 'first/shared' } } }));
fs.writeFileSync(path.join(state, 'config.json'), '{}');
const listener = net.createServer(); listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
const port = listener.address().port; await new Promise(r => listener.close(r)); const base = `http://127.0.0.1:${port}`;
let child, browser, page;
async function start() {
  child = spawn(process.execPath, [path.join(root, 'backend/server/zero-host.mjs')], { cwd: root, windowsHide: true, stdio: 'ignore', env: { ...process.env, ZERO_PORT: String(port), ZERO_PROVIDERS_PATH: providers, ZERO_AGENT_BINDINGS_PATH: bindings, ZERO_DATA_DIR: path.join(state, 'data'), ZERO_PREFS_PATH: path.join(state, 'prefs.json'), ZERO_LOCAL_MODELS_DIR: path.join(state, 'local-models'), OPENCLAW_CONFIG_PATH: path.join(state, 'config.json') } });
  for (let i = 0; i < 600; i++) { try { if ((await fetch(base + '/health')).ok) return; } catch {} if (child.exitCode !== null) throw new Error('Isolated host exited'); await new Promise(r => setTimeout(r, 100)); }
  throw new Error('Host readiness timeout');
}
async function stop() { if (child && child.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; } }
try {
  await start(); browser = await chromium.launch({ channel: 'chrome', headless: true }); page = await browser.newPage();
  await page.goto(base + '/settings/model-providers');
  await page.locator('[data-provider-id="first"]').waitFor();
  // Simulate the legacy HTTP/external writer after the process has cached its catalog.
  const rows = JSON.parse(fs.readFileSync(providers)); rows.push({ id: 'google', name: 'Google Regression', baseUrl: 'https://example.invalid/v1', apiKey: 'isolated-private-marker', models: ['shared'] }); fs.writeFileSync(providers, JSON.stringify(rows));
  await page.getByRole('button', { name: 'Refresh List', exact: true }).click();
  const card = page.locator('[data-provider-id="google"]'); await card.waitFor();
  await card.locator('.zero-model-chip').click();
  await page.getByText('Active model set to "shared"', { exact: true }).waitFor();
  assert.equal(JSON.parse(fs.readFileSync(bindings)).defaults.primary, 'google/shared');
  assert.equal(JSON.parse(fs.readFileSync(bindings)).agentBindings.zero.model, 'google/shared');
  // SPA navigation must invalidate the connection-cached native chat catalog.
  await page.getByRole('button', { name: /Back to app/i }).click();
  await page.locator('.chat-controls__model-option').filter({ hasText: 'shared' }).first().waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('.chat-controls__model-trigger')?.textContent.includes('google'));
  assert.equal(await page.locator('.chat-controls__model-option').filter({ hasText: 'shared' }).count(), 2);
  const oldPid = child.pid; await stop(); await start(); assert.notEqual(child.pid, oldPid);
  await page.goto(base + '/settings/model-providers'); await page.locator('[data-provider-id="google"] .zero-model-chip--active').waitFor();
  assert.equal(JSON.parse(fs.readFileSync(providers)).find(p => p.id === 'google').apiKey, 'isolated-private-marker');
  await page.getByRole('button', { name: /Back to app/i }).click();
  await page.locator('.chat-controls__model-option').filter({ hasText: 'shared' }).first().waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('.chat-controls__model-trigger')?.textContent.includes('google'));
  console.log(JSON.stringify({ status: 'PASS', classification: ['REAL_BROWSER', 'INTEGRATION'], externalCatalogRefresh: true, qualifiedDefaultSaved: true, chatCatalogRefreshed: true, realProcessRestart: true, privateCredentialPreserved: true, upstreamInference: 'NOT_RUN', state }));
} finally { await browser?.close(); await stop(); }
