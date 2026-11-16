import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

test('chat requests attempt every app mission after an earlier mission fails', { timeout: 20000 }, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-mission-chat-'));
  const host = new ZeroNativeHost({
    dataDir: path.join(root, 'data'),
    prefsPath: path.join(root, 'prefs.json'),
    skillsDir: path.join(root, 'skills'),
    providersPath: path.join(root, 'providers.json'),
    agentBindingsPath: path.join(root, 'bindings.json'),
  });
  t.after(async () => {
    await host.close({ reason: 'mission-test-complete' });
    const resolved = fs.realpathSync.native(root);
    assert.equal(path.dirname(resolved), fs.realpathSync.native(os.tmpdir()));
    fs.rmSync(resolved, { recursive: true, force: true });
  });

  host.sessions.createSession('Run hostname and tell me my PC name.', 'Run hostname and tell me my PC name.');
  host.sessions.createSession('Create a file called zero-debug-test.txt', 'Create a file called zero-debug-test.txt with content');
  host.sessions.createSession('agent:zero:perf-test-1794753984866', 'New Conversation');
  host.sessions.createSession('main', 'New Conversation');
  host._purgeMachineSessions();
  assert.equal(host.sessions.getSession('Run hostname and tell me my PC name.'), null);
  assert.equal(host.sessions.getSession('Create a file called zero-debug-test.txt'), null);
  assert.equal(host.sessions.getSession('agent:zero:perf-test-1794753984866'), null);
  assert.ok(host.sessions.getSession('main'));

  host.sessions.createSession('mission-chat', 'New Conversation');
  const attempted = [];
  host._executeAgentTurn = async ({ userContent }) => {
    const app = ['YouTube', 'Spotify', 'WhatsApp'].find(name => userContent.includes(name));
    attempted.push(app);
    if (app === 'YouTube') throw new Error('YouTube notification list was empty');
    return {
      ok: true,
      content: `${app} mission attempted`,
      execution: { outcome: 'COMPLETED', completedActions: 1 },
    };
  };

  const result = await host._runAssistantRequest({
    sessionKey: 'mission-chat',
    source: 'chat',
    userContent: "Open YouTube and play a video, then open Spotify and play a song, then open WhatsApp and send 'Hello Mummy'.",
  });

  assert.deepEqual(attempted, ['YouTube', 'Spotify', 'WhatsApp']);
  assert.match(result.content, /YouTube: FAILED/);
  assert.match(result.content, /Spotify: COMPLETED/);
  assert.match(result.content, /WhatsApp: COMPLETED/);
  assert.equal(host.missionState.getMission(result.execution.missionId).status, 'PARTIAL');

  host.sessions.createSession('hostname-chat', 'New Conversation');
  const hostnameResult = await host._runAssistantRequest({
    sessionKey: 'hostname-chat',
    source: 'chat',
    userContent: 'Run hostname and tell me my PC name.',
  });
  assert.match(hostnameResult.content, /^Hostname: .+/);
  assert.equal(host.tasks.getTaskSteps(hostnameResult.taskId).some(step => step.toolName === 'run_process'), true);
});
