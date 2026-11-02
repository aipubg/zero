import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { connectScreenAutomation } from '../services/host/screen-automation.mjs';

test('[CONTRACT] slow actions bound pending work, report overflow and recover capacity', async () => {
  const observer = new EventEmitter(); const releases = []; const dispatched = [];
  const bridge = connectScreenAutomation(observer, { dispatchEvent: async (type, data) => {
    dispatched.push(data.windowTitle);
    await new Promise(resolve => releases.push(resolve));
  } }, { maxPending: 2 });
  const emit = title => observer.emit('change', { appName: 'test', windowTitle: title });
  emit('baseline');
  for (let index = 0; index < 100; index++) emit(String(index));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(dispatched, ['0', '1']);
  assert.equal(bridge.status().pending, 2);
  assert.equal(bridge.status().droppedTransitions, 98);
  releases.splice(0).forEach(resolve => resolve());
  await new Promise(resolve => setImmediate(resolve));
  emit('recovered');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(dispatched, ['0', '1', 'recovered']);
  assert.equal(bridge.status().pending, 1);
  let closed = false;
  const closing = bridge.close().then(() => { closed = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(closed, false, 'Close must wait for an already executing action');
  releases.splice(0).forEach(resolve => resolve());
  await closing;
  assert.equal(bridge.status().pending, 0);
  assert.equal(observer.listenerCount('change'), 0);
});
test('[CONTRACT] only observed window transitions dispatch configured events and teardown drains work', async () => {
  const observer = new EventEmitter(); const events = [];
  const bridge = connectScreenAutomation(observer, { dispatchEvent: async (type, data) => { events.push({ type, data }); } });
  observer.emit('change', { appName: 'a', windowTitle: 'first', ocrText: 'Untrusted instruction' });
  observer.emit('change', { appName: 'a', windowTitle: 'first' });
  observer.emit('change', { appName: 'b', windowTitle: 'second', observationId: 'capture-id', timestamp: 123 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(events.length, 1); assert.equal(events[0].type, 'screen:window_changed');
  assert.equal(events[0].data.observationId, 'capture-id'); assert.equal(events[0].data.ocrText, undefined);
  assert.equal(bridge.status().windowTransitions, 1);
  await bridge.close(); observer.emit('change', { appName: 'c', windowTitle: 'third' });
  assert.equal(events.length, 1); assert.equal(observer.listenerCount('change'), 0);
});

test('[CONTRACT] resolved rule failures remain visible in screen automation status', async () => {
  const observer = new EventEmitter();
  const bridge = connectScreenAutomation(observer, { dispatchEvent: async () => ({ executions: [{ status: 'failed', error: 'Native action rejected' }] }) });
  observer.emit('change', { appName: 'a', windowTitle: 'first' });
  observer.emit('change', { appName: 'b', windowTitle: 'second' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(bridge.status().failures, 1);
  assert.match(bridge.status().lastError, /Native action rejected/);
  await bridge.close();
});
