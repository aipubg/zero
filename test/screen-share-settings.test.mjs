import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ModelFabric } from '../packages/model-fabric/index.mjs';
import { modelSettings, saveConfiguredProvider } from '../services/host/model-settings.mjs';
import { normalizeScreenShareConfig, findScreenShareProvider, SCREEN_SHARE_DEFAULTS, isGeminiProvider } from '../packages/model-fabric/gemini-screen-share.mjs';
import { KeyboardTargetScope } from '../packages/capability-engine/keyboard-rule.mjs';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

test('screen share settings are validated and keep earlier values', () => {
  assert.equal(normalizeScreenShareConfig(undefined, {}), undefined);
  const first = normalizeScreenShareConfig({ enabled: true, liveModel: 'models/gemini-3.8-live' });
  assert.equal(first.enabled, true);
  assert.equal(first.liveModel, 'gemini-3.8-live', 'models/ prefix is dropped');
  assert.equal(first.computerUseEnvironment, SCREEN_SHARE_DEFAULTS.computerUseEnvironment);
  const second = normalizeScreenShareConfig({ voiceReplies: true }, first);
  assert.equal(second.enabled, true, 'an omitted field keeps its earlier value');
  assert.equal(second.voiceReplies, true);
  assert.throws(() => normalizeScreenShareConfig({ maxFps: 2 }), /at most 1/);
  assert.throws(() => normalizeScreenShareConfig({ computerUseEnvironment: 'mobile' }), /browser/);
  assert.throws(() => normalizeScreenShareConfig({ liveModel: 'bad model id!' }), /model id/);
  assert.throws(() => normalizeScreenShareConfig({ maxMinutesPerHour: 0 }), /1-60/);
  assert.throws(() => normalizeScreenShareConfig('on'), /object/);
});

test('screen share is saved only on a Gemini provider and is returned without secrets', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-screen-share-settings-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const configPath = path.join(root, 'providers.json');
  fs.writeFileSync(configPath, JSON.stringify([
    { id: 'google', name: 'Google', baseUrl: GEMINI_URL, apiKey: 'gemini-test-secret', models: ['gemini-3.8-flash'] },
    { id: 'other', name: 'Other', baseUrl: 'https://example.invalid/v1', apiKey: 'other-secret', models: ['m'] },
  ]));
  const fabric = new ModelFabric({ configPath, agentBindingsPath: path.join(root, 'bindings.json') });

  assert.throws(() => saveConfiguredProvider(fabric, { id: 'other', screenShare: { enabled: true } }), /only on a Gemini provider/);
  assert.equal(findScreenShareProvider(fabric), null, 'nothing enabled yet');

  saveConfiguredProvider(fabric, { id: 'google', screenShare: { enabled: true, frameMode: 'on-demand' } });
  const row = JSON.parse(fs.readFileSync(configPath, 'utf8')).find(p => p.id === 'google');
  assert.equal(row.screenShare.enabled, true);
  assert.equal(row.screenShare.frameMode, 'on-demand');

  const settings = modelSettings(fabric);
  const google = settings.providers.find(p => p.id === 'google');
  const other = settings.providers.find(p => p.id === 'other');
  assert.equal(google.screenShareAvailable, true);
  assert.equal(google.screenShare.enabled, true);
  assert.equal(other.screenShareAvailable, false);
  assert.equal(other.screenShare, undefined);
  assert.ok(!JSON.stringify(settings).includes('gemini-test-secret'));

  const selected = findScreenShareProvider(fabric);
  assert.equal(selected.provider.id, 'google');
  assert.equal(selected.apiKey, 'gemini-test-secret');
  assert.equal(isGeminiProvider({ baseUrl: 'https://generativelanguage.googleapis.com.evil.example/v1' }), false);

  saveConfiguredProvider(fabric, { id: 'google', enabled: false });
  assert.equal(findScreenShareProvider(fabric), null, 'a disabled provider is not used');
});

test('keyboard scope refuses keystrokes without a destination and remembers windows Zero opened', async () => {
  const focused = [];
  const scope = new KeyboardTargetScope({ osController: { focusWindow: async target => { focused.push(target); return target === 'Missing' ? { ok: false, error: 'No window matches' } : { ok: true }; } } });

  const blind = await scope.before({ action: 'type_text', args: { text: 'x' } });
  assert.equal(blind.refusal.error, 'keyboard-target-required');
  const blindKey = await scope.before({ action: 'hotkey', args: { key: 'alt+f4' } });
  assert.equal(blindKey.refusal.error, 'keyboard-target-required');
  assert.deepEqual(focused, [], 'nothing was focused or pressed');

  const named = await scope.before({ action: 'press_key', args: { key: 'enter', target: 'Notepad' } });
  assert.equal(named.refusal, undefined);
  assert.deepEqual(focused, ['Notepad']);
  const missing = await scope.before({ action: 'hotkey', args: { key: 'ctrl+s', target: 'Missing' } });
  assert.equal(missing.refusal.error, 'focus-failed');

  scope.after({ action: 'open_app', args: { app: 'notepad' }, result: { ok: true, window: { title: 'Untitled - Notepad' } } });
  const remembered = await scope.before({ action: 'type_text', args: { text: 'hello' } });
  assert.equal(remembered.args.target, 'Untitled - Notepad');

  scope.after({ action: 'focus_window', args: { target: 'x', command: 'close' }, result: { ok: true, window: 'Closed window' } });
  assert.equal(scope.currentWindow, 'Untitled - Notepad', 'a closed window is not a destination');

  scope.after({ action: 'open_url', capability: 'browser', args: {}, result: { ok: true, title: 'YouTube' } });
  assert.equal(scope.currentWindow, 'YouTube');

  const browserTyping = await scope.before({ action: 'type', capability: 'browser', args: { text: 'x' } });
  assert.equal(browserTyping.refusal, undefined, 'typing inside Zero\'s own browser page is the browser tool\'s job');
});
