/** REAL_BROWSER + INTEGRATION: actual first-party visual shell with isolated Gateway.
 * Proves navigation, draft controls, keyboard interaction and layout, not model accuracy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { chromium } from '../backend/node_modules/playwright-core/index.mjs';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

test('Zero Orbital shell navigation, live status, draft preservation and responsive controls', { timeout: 60000 }, async (t) => {
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const temporary = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'zero-shell-browser-')));
  const evidence = path.join(repo, 'artifacts/ui-design');
  fs.mkdirSync(evidence, { recursive: true });
  let host, browser;
  t.after(async () => {
    await browser?.close(); await host?.close();
    const resolved = fs.realpathSync.native(temporary);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('zero-shell-browser-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  for (const [file, content] of [['config.json', '{}'], ['providers.json', '[]'], ['bindings.json', '{}']]) fs.writeFileSync(path.join(temporary, file), content);
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  host = new ZeroNativeHost({ port, configPath: path.join(temporary, 'config.json'), providersPath: path.join(temporary, 'providers.json'),
    prefsPath: path.join(temporary, 'prefs.json'), agentBindingsPath: path.join(temporary, 'bindings.json'),
    dataDir: path.join(temporary, 'data'), skillsDir: path.join(temporary, 'skills'), localModelsDir: path.join(temporary, 'models') });
  await host.start();
  const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(candidate => fs.existsSync(candidate));
  assert.ok(executablePath, 'Installed browser prerequisite');
  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = [];
  let chatSends = 0;
  page.on('pageerror', error => errors.push(error.message));
  page.on('websocket', socket => socket.on('framesent', frame => { try { if (JSON.parse(String(frame.payload)).method === 'chat.send') chatSends++; } catch {} }));
  const base = `http://127.0.0.1:${port}`;
  await page.goto(base + '/chat/zero');
  await page.locator('.zero-command-home').waitFor();
  await page.locator('.zero-shell-connection[data-connected="true"]').waitFor();
  assert.equal(await page.getByRole('navigation', { name: 'Zero navigation', exact: true }).count(), 1);
  assert.equal(await page.locator('.zero-shell-nav-link').count(), 12);
  assert.equal(await page.locator('.zero-shell-current-page').innerText(), 'Command');
  const composer = page.getByRole('textbox', { name: 'Chat composer', exact: true });
  await composer.waitFor();
  await page.getByRole('button', { name: /Find the signal/ }).click();
  assert.equal(await composer.inputValue(), 'Help me research ');
  await composer.fill('Keep my existing draft exactly.');
  await page.getByRole('button', { name: /Make something/ }).click();
  assert.equal(await composer.inputValue(), 'Keep my existing draft exactly.');
  await composer.fill('');
  await page.screenshot({ path: path.join(evidence, 'zero-orbital-desktop.png'), fullPage: true });
  await page.keyboard.press('Alt+k');
  const palette = page.getByRole('dialog', { name: 'Navigate Zero', exact: true });
  await palette.waitFor();
  await palette.getByRole('searchbox', { name: 'Filter Zero destinations' }).fill('models');
  assert.equal(await palette.locator('.zero-palette-result').count(), 1);
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'zero-palette-result');
  await page.keyboard.press('Enter');
  await page.waitForURL(base + '/settings/model-providers');
  await page.locator('.zero-models-view').waitFor();
  await page.locator('.settings-sidebar .zero-shell-brand').waitFor();
  assert.equal(await page.locator('.zero-shell-current-page').innerText(), 'Models');
  assert.equal(await page.locator('.settings-sidebar .zero-shell-brand').count(), 1);
  assert.equal(await page.locator('.zero-test-marker').count(), 0);
  await page.getByRole('button', { name: 'Search Zero navigation', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Filter Zero destinations' }).fill('a destination that does not exist');
  await page.getByText('No destinations found. Try models, skills, or memory.', { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Zero command home', exact: true }).click();
  await page.waitForURL(base + '/chat/zero');
  await page.locator('.zero-command-home').waitFor();
  for (const [name, width, height] of [['tablet', 900, 900], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, name + ' has no horizontal page overflow');
    const box = await composer.boundingBox();
    assert.ok(box && box.width > 150 && box.y >= 0 && box.y + box.height <= height, name + ' composer stays in viewport');
    await page.getByRole('button', { name: 'Search Zero navigation', exact: true }).click();
    await palette.waitFor();
    await page.keyboard.press('Escape');
    await page.screenshot({ path: path.join(evidence, `zero-orbital-${name}.png`), fullPage: true });
  }
  assert.deepEqual(errors, []);
  assert.equal(chatSends, 0, 'Draft controls do not submit chat');
  assert.equal(host.sessions.listSessions().some(session => host.sessions.getTranscript(session.id).some(message => message.role === 'user')), false, 'No draft became a persisted user message');
});
