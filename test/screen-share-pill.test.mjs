import test from 'node:test';
import assert from 'node:assert/strict';
import { describeScreenShare } from '../app/zero-control-ui/src/screen-share-pill.js';

test('the pill names the screen share that is really running', () => {
  const local = { observer: { running: true } };
  assert.equal(describeScreenShare({ mode: 'online', paused: false, liveModel: 'gemini-3.8-live', minutesUsedThisHour: 3, minutesPerHourLimit: 60 }, local).text, 'Screen Share: Online · Gemini');
  const paused = describeScreenShare({ mode: 'online', paused: true, reason: 'KeePass is in front' }, local);
  assert.equal(paused.text, 'Screen Share: Online paused');
  assert.match(paused.title, /KeePass is in front/);
  assert.equal(describeScreenShare({ mode: 'connecting', reason: 'Connecting to Gemini Live' }, local).key, 'connecting');
  const offline = describeScreenShare({ mode: 'offline', reason: 'Online screen share is not turned on' }, local);
  assert.equal(offline.text, 'Screen Share: Offline · Local');
  assert.match(offline.title, /not turned on/);
  assert.equal(describeScreenShare(null, { observer: { running: false } }).text, 'Screen Share: Stopped');
  assert.equal(describeScreenShare(null, null).text, 'Screen Share: Stopped', 'status calls failing never claims Live');
});
