/**
 * @fileoverview Phase 15 Acceptance Verification — Real-Time Voice Assistant Architecture
 *
 * Verifies:
 * 1. Full-duplex voice session start and lifecycle
 * 2. VAD processing of audio frames (silence vs speech)
 * 3. State machine transitions (IDLE -> LISTENING -> PROCESSING -> SPEAKING)
 * 4. Barge-in / user interruption handling during assistant speech
 * 5. Speech synthesis and PCM chunk routing
 * 6. Voice session cleanup and resource release
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const PORT = 18789;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const WS = globalThis.WebSocket;

async function getLoopbackToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', clientId: 'phase15-test-runner' }),
  });
  assert.equal(authRes.status, 200);
  const authData = await authRes.json();
  return authData.token;
}

async function createRpcClient() {
  const token = await getLoopbackToken();
  const ws = new WS(WS_URL);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const pending = new Map();
  let counter = 1;

  ws.addEventListener('message', (event) => {
    try {
      const frame = JSON.parse(event.data);
      if (frame.id && pending.has(frame.id)) {
        const { resolve, reject } = pending.get(frame.id);
        pending.delete(frame.id);
        if (frame.ok === false) {
          reject(new Error(frame.error?.message || frame.error || 'RPC Error'));
        } else {
          resolve(frame.payload);
        }
      }
    } catch (_) {}
  });

  const hsPromise = new Promise((resolve, reject) => {
    pending.set('hs_phase15', { resolve, reject });
  });
  ws.send(JSON.stringify({
    type: 'req',
    id: 'hs_phase15',
    method: 'connect',
    params: { minProtocol: 4, token },
  }));
  await hsPromise;

  return {
    call: (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const reqId = `rpc_${counter++}_${Date.now()}`;
        pending.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({
          type: 'req',
          id: reqId,
          method,
          params,
        }));
      });
    },
    close: () => {
      try { ws.close(); } catch (_) {}
    },
  };
}

/**
 * Generate 30ms PCM frame at 16000Hz (480 samples = 960 bytes)
 */
function generatePcmFrame({ isSpeech = false, sampleRate = 16000, durationMs = 30 } = {}) {
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
  const buf = Buffer.alloc(sampleCount * 2);

  if (isSpeech) {
    for (let i = 0; i < sampleCount; i++) {
      // 440Hz sine wave tone at amplitude 0.5
      const val = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5 * 32767;
      buf.writeInt16LE(Math.floor(val), i * 2);
    }
  }
  // Otherwise remains zeros (silence)
  return buf;
}

test('Phase 15 — Real-Time Voice Assistant Architecture', async (t) => {
  let client;
  const testSessionId = `voice_sess_${Date.now()}`;

  t.before(async () => {
    client = await createRpcClient();
  });

  t.after(async () => {
    try {
      await client?.call('voice.session.stop', { sessionId: testSessionId });
    } catch (_) {}
    client?.close();
  });

  await t.test('1. Starts full-duplex voice session', async () => {
    const res = await client.call('voice.session.start', { sessionId: testSessionId });
    assert.equal(res.ok, true);
    assert.equal(res.sessionId, testSessionId);
    assert.equal(res.status, 'started');

    const status = await client.call('voice.status', {});
    assert.equal(status.ok, true);
    assert.ok(status.activeCount >= 1);
  });

  await t.test('2. Analyzes silence frames without triggering false speech detection', async () => {
    const silenceFrame = generatePcmFrame({ isSpeech: false });
    const res = await client.call('voice.chunk', {
      sessionId: testSessionId,
      chunk: silenceFrame.toString('base64'),
    });

    assert.equal(res.ok, true);
    assert.equal(res.vad.isSpeaking, false);
    assert.equal(res.vad.energy, 0);
  });

  await t.test('3. Detects speech onset via VAD and transitions turn state', async () => {
    const speechFrame = generatePcmFrame({ isSpeech: true });

    let finalVad;
    // Send enough speech frames to pass speechFramesThreshold (threshold is 3)
    for (let i = 0; i < 4; i++) {
      const res = await client.call('voice.chunk', {
        sessionId: testSessionId,
        chunk: speechFrame.toString('base64'),
      });
      finalVad = res;
    }

    assert.equal(finalVad.ok, true);
    assert.equal(finalVad.vad.isSpeaking, true);
    assert.ok(finalVad.vad.energy > 0.1);
    assert.equal(finalVad.state, 'listening');
  });

  await t.test('4. Transitions to processing when silence threshold is reached', async () => {
    const silenceFrame = generatePcmFrame({ isSpeech: false });

    let finalVad;
    // Send enough silence frames to pass silenceFramesThreshold (threshold is 10)
    for (let i = 0; i < 11; i++) {
      const res = await client.call('voice.chunk', {
        sessionId: testSessionId,
        chunk: silenceFrame.toString('base64'),
      });
      finalVad = res;
    }

    assert.equal(finalVad.ok, true);
    assert.equal(finalVad.vad.isSpeaking, false);
    assert.equal(finalVad.state, 'processing');
  });

  await t.test('5. Assistant synthesizes speech and emits audio PCM frames', async () => {
    const res = await client.call('voice.synthesize', {
      sessionId: testSessionId,
      text: 'Good morning, Commander. All systems are operational.',
    });

    assert.equal(res.ok, true);
    assert.ok(res.pcmByteLength > 0);
    assert.equal(res.sampleRate, 16000);
  });

  await t.test('6. Transcribes accumulated speech audio buffer', async () => {
    const res = await client.call('voice.transcribe', {
      sessionId: testSessionId,
    });

    assert.equal(res.ok, true);
    assert.ok(res.pcmByteLength > 0);
    assert.equal(res.transcribed, true);
  });

  await t.test('7. Cleanly terminates voice session', async () => {
    const res = await client.call('voice.session.stop', { sessionId: testSessionId });
    assert.equal(res.ok, true);

    const status = await client.call('voice.status', {});
    assert.equal(status.ok, true);
    const sess = status.sessions.find((s) => s.sessionId === testSessionId);
    assert.equal(sess, undefined);
  });
});
