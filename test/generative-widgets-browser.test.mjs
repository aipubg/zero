/** REAL_BROWSER + INTEGRATION: production widgets and isolated actual Gateway.
 * Component/RPC proof only, not model-generated media or acoustic playback.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

test('production widgets preserve outcomes and actual hold RPC blocks media input', { timeout: 30000 }, async (t) => {
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const sourceRoot = fs.realpathSync.native(path.join(repo, 'app/zero-control-ui/src'));
  const temporary = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'zero-widget-browser-')));
  let host, server, browser;
  t.after(async () => {
    await browser?.close();
    await host?.close();
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    const resolved = fs.realpathSync.native(temporary);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-widget-browser-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const configPath = path.join(temporary, 'config.json');
  const providersPath = path.join(temporary, 'providers.json');
  fs.writeFileSync(configPath, '{}');
  fs.writeFileSync(providersPath, '[]');
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  host = new ZeroNativeHost({ port, configPath, providersPath,
    prefsPath: path.join(temporary, 'prefs.json'), agentBindingsPath: path.join(temporary, 'bindings.json'),
    dataDir: path.join(temporary, 'data'), skillsDir: path.join(temporary, 'skills'), localModelsDir: path.join(temporary, 'models') });
  await host.start();
  const auth = await fetch(`http://127.0.0.1:${port}/api/auth/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'widget-browser' }), signal: AbortSignal.timeout(5000),
  }).then(response => response.json());
  server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>Production widget component verification</title><body></body>'); return; }
    const target = path.resolve(sourceRoot, '.' + decodeURIComponent(url.pathname));
    if (!target.startsWith(sourceRoot + path.sep) || !target.endsWith('.js') || !fs.existsSync(target)) { response.writeHead(404); response.end(); return; }
    const resolved = fs.realpathSync.native(target);
    if (!resolved.startsWith(sourceRoot + path.sep)) { response.writeHead(403); response.end(); return; }
    response.setHeader('Content-Type', 'text/javascript'); response.end(fs.readFileSync(resolved));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(candidate => fs.existsSync(candidate));
  assert.ok(executablePath, 'Installed browser prerequisite');
  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(async ({ port, token }) => {
    const widgets = await import('/spaces/generative-widgets.js');
    const socket = new WebSocket(`ws://127.0.0.1:${port}/`);
    await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Socket timeout')), 5000); socket.onopen = () => { clearTimeout(timer); resolve(); }; socket.onerror = reject; });
    let sequence = 0;
    const request = (method, params) => new Promise((resolve, reject) => {
      const id = `widget-${++sequence}`;
      const timer = setTimeout(() => { socket.removeEventListener('message', listener); reject(Error('RPC timeout')); }, 5000);
      function listener(event) { const message = JSON.parse(event.data); if (message.id === id) { clearTimeout(timer); socket.removeEventListener('message', listener); message.ok ? resolve(message.payload) : reject(Error('RPC rejected')); } }
      socket.addEventListener('message', listener); socket.send(JSON.stringify({ type: 'req', id, method, params }));
    });
    await request('connect', { minProtocol: 4, maxProtocol: 4, token });
    window.widgetSocket = socket;
    const host = { request };
    document.body.append(widgets.createProgressWidget({ status: 'failed', step: 3, totalSteps: 3 }, { host }));
    document.body.append(widgets.createMediaWidget({ status: 'paused', title: 'Paused verification component' }, { host }));
    const conversation = document.createElement('section');
    const earlier = document.createElement('p'); earlier.id = 'earlier-message'; earlier.textContent = 'Keep earlier chat content';
    const pre = document.createElement('pre'); const code = document.createElement('code');
    code.className = 'language-zero-ui:progress'; code.textContent = JSON.stringify({ title: 'Renderer contract', status: 'unverified', step: 1, totalSteps: 1 });
    pre.append(code); conversation.append(earlier, pre); document.body.append(conversation);
    widgets.renderGenerativeWidgets(conversation, { host });
    const sources = widgets.createSourcesWidget({ sources: [{ title: 'Untrusted source', url: 'javascript:window.badSource=true', verified: true }] });
    sources.id = 'source-contract'; document.body.append(sources);
  }, { port, token: auth.token });
  assert.equal(await page.locator('#earlier-message').innerText(), 'Keep earlier chat content');
  assert.ok((await page.locator('section .zero-gen-progress').innerText()).includes('UNVERIFIED (1/1)'));
  assert.equal(await page.locator('#source-contract a').getAttribute('href'), '#');
  assert.ok(!(await page.locator('#source-contract').innerText()).includes('Verified'));
  const progress = page.locator('.zero-gen-progress').first();
  assert.ok((await progress.innerText()).includes('FAILED (3/3)'));
  assert.ok(!(await progress.innerText()).includes('COMPLETED'));
  assert.ok((await page.locator('.zero-gen-media').innerText()).includes('Paused'));
  await progress.getByRole('button', { name: 'Take Over', exact: true }).click();
  await progress.getByRole('button', { name: 'Hold Active', exact: true }).waitFor();
  assert.equal(host.computerHold.held, true, 'Actual isolated server state changed independently of the button label');
  const mediaButton = page.locator('.zero-media-btn[data-action="play_pause"]');
  await mediaButton.click();
  await page.getByRole('button', { name: 'Action unavailable', exact: true }).waitFor();
  assert.equal(host.computerHold.held, true);
  assert.ok(!(await mediaButton.innerText()).includes('Done'));
  await page.evaluate(() => window.widgetSocket.close());
  // Exercise the real product MutationObserver rather than manually invoking
  // the renderer, which previously hid missing live-chat enhancement.
  await page.goto(`http://127.0.0.1:${port}/chat/zero`);
  await page.locator('.zero-shell-connection[data-connected="true"]').waitFor();
  await page.evaluate(() => {
    const section = document.createElement('section'); section.id = 'live-widget-observer';
    const before = document.createElement('p'); before.id = 'preserved-observer-text'; before.textContent = 'Preserve surrounding conversation';
    const pre = document.createElement('pre'), code = document.createElement('code');
    code.className = 'language-zero-ui:progress'; code.textContent = JSON.stringify({status:'failed',step:2,totalSteps:2});
    pre.append(code); section.append(before,pre); document.body.append(section);
  });
  await page.locator('#live-widget-observer .zero-gen-progress').waitFor();
  assert.ok((await page.locator('#live-widget-observer .zero-gen-progress').innerText()).includes('FAILED (2/2)'));
  assert.equal(await page.locator('#preserved-observer-text').innerText(),'Preserve surrounding conversation');
});
