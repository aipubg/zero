import test from 'node:test';
import assert from 'node:assert/strict';
import { isStaleProbeSessionTitle } from '../services/host/session-cleanup.mjs';

test('startup cleanup identifies only the named probe-session titles', () => {
  assert.equal(isStaleProbeSessionTitle('Run hostname and tell me my PC name.'), true);
  assert.equal(isStaleProbeSessionTitle('Create a file called zero-debug-test.txt with content'), true);
  assert.equal(isStaleProbeSessionTitle('Run hostname command and report output.'), false);
  assert.equal(isStaleProbeSessionTitle('New Conversation'), false);
});
