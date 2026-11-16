import test from 'node:test';
import assert from 'node:assert/strict';
import { decomposeMultiAppRequest, routeSimpleRequest } from '../packages/capability-engine/director-routing.mjs';

test('multi-app prompts are decomposed into ordered app missions', () => {
  const missions = decomposeMultiAppRequest(
    "Open browser, go to YouTube and play a video, then open Spotify and play a song, then open WhatsApp and send 'Hello Mummy'.",
  );

  assert.deepEqual(missions.map(mission => mission.app), ['YouTube', 'Spotify', 'WhatsApp']);
  assert.match(missions[0].goal, /YouTube/);
  assert.match(missions[1].goal, /play a song/);
  assert.match(missions[2].goal, /Hello Mummy/);
});

test('simple hostname and system-info requests route directly', () => {
  assert.deepEqual(routeSimpleRequest('Run hostname and tell me my PC name.'), {
    toolName: 'run_process',
    args: { command: 'hostname', args: [] },
    response: 'stdout',
  });
  assert.equal(routeSimpleRequest('What is my computer name?').toolName, 'system_info');
  assert.equal(routeSimpleRequest('Open Spotify and play a song.'), null);
});
