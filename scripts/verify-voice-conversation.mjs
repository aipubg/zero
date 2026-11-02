/** REAL_OS + REAL_EXTERNAL: real speech codecs through the same durable chat executor. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { WindowsSpeechBackend } from '../packages/voice-engine/index.mjs';
import { VoiceActivityDetector } from '../packages/voice-engine/vad.mjs';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
process.loadEnvFile(path.join(root, '.env'));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-voice-conversation-'));
const output = path.join(root, 'artifacts/voice-conversation', String(Date.now()));
fs.mkdirSync(output, { recursive: true });
const report = { classification: ['REAL_OS', 'REAL_EXTERNAL'], startedAt: new Date().toISOString(), status: 'RUNNING', output,
  inputSource: 'Actual Windows speech synthesis uploaded as PCM; not human microphone speech', acousticConversation: 'UNVERIFIED' };
const listener = net.createServer(); listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
const port = listener.address().port; await new Promise(resolve => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;
let host, socket;
const pending = new Map();
const events = [];
async function call(method, params = {}) {
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timeout`)); }, 120000);
    pending.set(id, { resolve: frame => { clearTimeout(timer); frame.ok === false ? reject(new Error(JSON.stringify(frame.error))) : resolve(frame.payload); } });
    socket.send(JSON.stringify({ type: 'req', id, method, params }));
  });
}
async function waitEvent(name, since = 0) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const event = events.slice(since).find(event => event.event === name || event.event === 'voice.turn-error');
    if (event) {
      if (event.event === 'voice.turn-error') throw new Error(event.payload.error);
      return event.payload;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`${name} event timeout`);
}
try {
  host = new ZeroNativeHost({ port, dataDir: path.join(temporary, 'data'), prefsPath: path.join(temporary, 'prefs.json'), skillsDir: path.join(temporary, 'skills') });
  await host.start();
  const auth = await fetch(`${base}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) });
  const { token } = await auth.json();
  socket = new WebSocket(base.replace('http:', 'ws:'));
  socket.addEventListener('message', event => { const frame = JSON.parse(event.data); if (pending.has(frame.id)) { pending.get(frame.id).resolve(frame); pending.delete(frame.id); } else if (frame.type === 'event') events.push(frame); });
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  await call('connect', { minProtocol: 4, token });
  const sessionId = 'voice-and-chat-proof';
  await call('sessions.subscribe', { sessionKey: sessionId });
  const chatRequest = { sessionKey: sessionId, message: 'Remember the conversation code word BLUEBIRD. Reply only READY.', idempotencyKey: 'actual-websocket-retry' };
  const [chat, concurrentRetry] = await Promise.all([call('chat.send', chatRequest), call('chat.send', chatRequest)]);
  assert.equal(chat.ok, true);
  assert.equal(concurrentRetry.taskId, chat.taskId);
  const upstreamBeforeReplay = host.modelFabric.upstreamRequestCount;
  const replay = await call('chat.send', chatRequest);
  assert.equal(replay.taskId, chat.taskId); assert.equal(replay.content, chat.content);
  assert.equal(host.modelFabric.upstreamRequestCount, upstreamBeforeReplay);
  assert.equal(host.sessions.getTranscript(sessionId).filter(message => message.role === 'user').length, 1);
  report.retryIdentity = { sameTaskAcrossConcurrentRequests: true, completedReplaySameTask: true, additionalModelCallsOnReplay: 0, userMessagesBeforeVoice: 1, taskId: chat.taskId };
  const backend = new WindowsSpeechBackend();
  const prompt = await backend.synthesize('What is the code word?');
  await call('voice.session.start', { sessionId, playback: false });
  const eventStart = events.length;
  // Frame-aligned packets exercise actual VAD timing and the speech-end callback.
  const pcm = Buffer.concat([prompt.pcm, Buffer.alloc(16000)]);
  for (let offset = 0; offset < pcm.length; offset += 960) await call('voice.chunk', { sessionId, chunk: pcm.subarray(offset, offset + 960).toString('base64') });
  const completed = await waitEvent('voice.turn-complete', eventStart);
  assert.match(completed.content, /BLUEBIRD/i, 'Voice must use the existing chat context');
  assert.ok(completed.pcmByteLength > 1000, 'Reply must actually synthesize speech');
  assert.equal(completed.played, false);
  const task = host.tasks.getTask(completed.taskId);
  assert.equal(task.status, 'COMPLETED');
  assert.equal(task.result.source, 'voice');
  const history = host.sessions.getTranscript(sessionId);
  assert.equal(history.filter(message => message.role === 'user').length, 2);
  assert.equal(history.at(-1).content, completed.content);
  report.sharedConversation = { chatTaskId: chat.taskId, voiceTaskId: completed.taskId, transcript: completed.transcript, reply: completed.content,
    pcmByteLength: completed.pcmByteLength, persistedTaskStatus: task.status, messages: history.length };
  await call('voice.session.stop', { sessionId });
  report.devices = { tested: false };
  if (process.argv.includes('--devices')) {
    let frames = 0, bytes = 0, maxRms = 0;
    const vad = new VoiceActivityDetector();
    const input = backend.startMicrophone({ durationMs: 3000, onFrame: pcm => { frames++; bytes += pcm.length; maxRms = Math.max(maxRms, vad.calculateRMS(pcm)); } });
    await input.ready;
    const spoken = await backend.synthesize('Zero voice audio test.');
    const played = await backend.play(spoken.pcm);
    await input.done;
    assert.ok(frames > 0 && bytes > 0, 'Real microphone must return frames');
    report.devices = { tested: true, microphoneFrames: frames, microphoneBytes: bytes, microphoneMaxRms: maxRms,
      playbackResult: played, audibleToHuman: 'UNVERIFIED', acousticBargeIn: 'UNVERIFIED', rawAudioSaved: false };
  }
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.message; process.exitCode = 1; }
finally {
  socket?.close();
  await host?.close();
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
