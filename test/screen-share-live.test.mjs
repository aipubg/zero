// Online screen share against a local fake of the Gemini Live WebSocket.
// No real screen or key: frames are small fake buffers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocketServer } from 'ws';
import { GeminiLiveClient } from '../packages/model-fabric/gemini-live-client.mjs';
import { ScreenShareService } from '../packages/capability-engine/screen-share.mjs';

async function fakeLive(t, { onText } = {}) {
  const server = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  await once(server, 'listening');
  const seen = { setups: [], frames: [], texts: [], connections: 0, urls: [] };
  const sockets = new Set();
  server.on('connection', (ws, req) => {
    seen.connections++;
    seen.urls.push(req.url);
    sockets.add(ws);
    ws.on('message', raw => {
      const msg = JSON.parse(raw.toString());
      if (msg.setup) {
        seen.setups.push(msg.setup);
        ws.send(JSON.stringify({ setupComplete: {} }));
        ws.send(JSON.stringify({ sessionResumptionUpdate: { newHandle: `handle-${seen.connections}`, resumable: true } }));
      }
      if (msg.realtimeInput?.video) seen.frames.push(msg.realtimeInput.video);
      if (msg.realtimeInput?.text) {
        seen.texts.push(msg.realtimeInput.text);
        const answer = onText ? onText(msg.realtimeInput.text) : 'You are looking at a test page.';
        ws.send(JSON.stringify({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAAA' } }] }, outputTranscription: { text: answer } } }));
        ws.send(JSON.stringify({ serverContent: { turnComplete: true }, usageMetadata: { promptTokenCount: 10, responseTokenCount: 5, totalTokenCount: 15 } }));
      }
    });
  });
  t.after(() => { for (const ws of sockets) ws.terminate(); server.close(); });
  return { url: `ws://127.0.0.1:${server.address().port}/live`, seen, sockets };
}

const config = (overrides = {}) => ({
  enabled: true, liveModel: 'fake-live', frameMode: 'on-change', maxFps: 1, heartbeatSeconds: 10,
  voiceReplies: false, excludedApps: ['KeePass'], maxMinutesPerHour: 60, ...overrides,
});

function service(t, live, { frames, hold = () => false, cfg = config(), clock } = {}) {
  let frame = null;
  const svc = new ScreenShareService({
    getProvider: () => ({ provider: { id: 'google', name: 'Google' }, config: cfg, apiKey: 'test-key' }),
    latestFrame: () => frame,
    isHumanHold: hold,
    createClient: options => new GeminiLiveClient({ ...options, url: live.url, reconnectDelaysMs: [10, 10] }),
    tickMs: 20,
    ...(clock ? { now: clock } : {}),
  });
  t.after(() => svc.stop());
  return { svc, setFrame: f => { frame = f; } };
}

const waitFor = async (check, ms = 2000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (check()) return true; await new Promise(r => setTimeout(r, 10)); }
  return false;
};

test('setup uses the verified shape: AUDIO in generationConfig, transcription, compression', async t => {
  const live = await fakeLive(t);
  const { svc } = service(t, live);
  const state = await svc.refresh();
  assert.equal(state.mode, 'online');
  const setup = live.seen.setups[0];
  assert.equal(setup.model, 'models/fake-live');
  assert.deepEqual(setup.generationConfig, { responseModalities: ['AUDIO'] });
  assert.equal(setup.responseModalities, undefined, 'not at the top level (Gemini rejects that)');
  assert.deepEqual(setup.outputAudioTranscription, {});
  assert.deepEqual(setup.contextWindowCompression, { slidingWindow: {} });
  assert.match(setup.systemInstruction.parts[0].text, /Zero's eyes/);
  assert.match(live.seen.urls[0], /key=test-key/);
});

test('frames are sent only when the screen changes, and not while paused', async t => {
  const live = await fakeLive(t);
  let held = false;
  const { svc, setFrame } = service(t, live, { hold: () => held });
  await svc.refresh();
  setFrame({ data: Buffer.from('frame-1'), timestamp: 1, perceptualHash: 'aaa', windowTitle: 'Notes', appName: 'notepad' });
  assert.ok(await waitFor(() => live.seen.frames.length === 1));
  assert.equal(Buffer.from(live.seen.frames[0].data, 'base64').toString(), 'frame-1');
  assert.equal(live.seen.frames[0].mimeType, 'image/jpeg');

  setFrame({ data: Buffer.from('frame-2'), timestamp: 2, perceptualHash: 'aaa', windowTitle: 'Notes', appName: 'notepad' });
  await new Promise(r => setTimeout(r, 200));
  assert.equal(live.seen.frames.length, 1, 'same picture: not sent again before the heartbeat');

  setFrame({ data: Buffer.from('secret'), timestamp: 3, perceptualHash: 'bbb', windowTitle: 'Database.kdbx - KeePass', appName: 'KeePass' });
  await new Promise(r => setTimeout(r, 1200));
  assert.equal(live.seen.frames.length, 1, 'excluded app in front: nothing sent');
  assert.match(svc.status().reason, /KeePass is in front/);

  held = true;
  setFrame({ data: Buffer.from('held'), timestamp: 4, perceptualHash: 'ccc', windowTitle: 'Notes', appName: 'notepad' });
  await new Promise(r => setTimeout(r, 1200));
  assert.equal(live.seen.frames.length, 1, 'owner took over: nothing sent');

  held = false;
  setFrame({ data: Buffer.from('frame-5'), timestamp: 5, perceptualHash: 'ddd', windowTitle: 'Notes', appName: 'notepad' });
  assert.ok(await waitFor(() => live.seen.frames.length === 2, 2500));
});

test('ask_screen sends a current frame and returns the transcript of the answer', async t => {
  const live = await fakeLive(t, { onText: text => (text.includes('error') ? 'The dialog says File not found.' : 'Other') });
  const { svc, setFrame } = service(t, live, { cfg: config({ frameMode: 'on-demand' }) });
  await svc.refresh();
  setFrame({ data: Buffer.from('dialog'), timestamp: 10, perceptualHash: 'x', windowTitle: 'Error', appName: 'explorer' });
  const result = await svc.ask('What does the error dialog say?');
  assert.equal(result.ok, true);
  assert.equal(result.answer, 'The dialog says File not found.');
  assert.equal(live.seen.frames.length, 1, 'on-demand mode sends a frame only for the question');
  assert.equal(svc.status().usage.totalTokens, 15);
});

test('owner choice "offline" stops online sharing and is remembered', async t => {
  const live = await fakeLive(t);
  const { svc } = service(t, live);
  await svc.refresh();
  assert.equal(svc.mode, 'online');
  await svc.setPreference('offline');
  assert.equal(svc.mode, 'offline');
  assert.equal((await svc.ask('anything')).error, 'screen-share-offline');
  await svc.setPreference('auto');
  assert.equal(svc.mode, 'online');
});

test('goAway reconnects with the resumption handle', async t => {
  const live = await fakeLive(t);
  const { svc } = service(t, live);
  await svc.refresh();
  for (const ws of live.sockets) ws.send(JSON.stringify({ goAway: { timeLeft: '5s' } }));
  assert.ok(await waitFor(() => live.seen.setups.length === 2));
  assert.deepEqual(live.seen.setups[1].sessionResumption, { handle: 'handle-1' });
  assert.ok(await waitFor(() => svc.mode === 'online'));
});

test('hourly limit pauses sending', async t => {
  const live = await fakeLive(t);
  let now = 1_000_000;
  const { svc, setFrame } = service(t, live, { cfg: config({ maxMinutesPerHour: 1 }), clock: () => now });
  await svc.refresh();
  svc.onlineMs.push([now, 61_000]);
  setFrame({ data: Buffer.from('f'), timestamp: 1, perceptualHash: 'z' });
  await new Promise(r => setTimeout(r, 200));
  assert.equal(live.seen.frames.length, 0);
  assert.match(svc.status().reason, /Hourly online limit/);
});
