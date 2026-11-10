import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { VoiceConversation } from '../packages/voice-engine/conversation.mjs';

function engine(overrides = {}) {
  return Object.assign(new EventEmitter(), { transcribe: async () => ({ transcribed: true, text: 'supplied transcript fixture' }),
    synthesizeSpeech: async (_id, _text) => ({ played: false, pcmByteLength: 3200 }), cancelSpeech() {}, ...overrides });
}

test('[CONTRACT] resumed speech preserves one pending utterance and explicit processing or detach prevents duplicate turns', async () => {
  let buffered = ['remember']; let reads = 0; let turns = 0;
  const voice = engine({ transcribe: async () => { reads++; const text = buffered.join(' '); buffered = []; return { transcribed: true, text }; } });
  const bridge = new VoiceConversation({ engine: voice, endpointDelayMs: 40, executeTurn: async input => { turns++; return { ok: true, content: input.text }; } });
  try {
    bridge.attach('chat', { ownerId: 'owner' });
    voice.emit('voice:speech_end', { sessionId: 'chat' });
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(reads, 0, 'A brief pause must not drain audio into recognition');
    voice.emit('voice:speech_start', { sessionId: 'chat' });
    buffered.push('blue bird');
    voice.emit('voice:speech_end', { sessionId: 'chat' });
    const completed = new Promise(resolve => bridge.once('turn-complete', resolve));
    assert.equal((await completed).transcript, 'remember blue bird');
    assert.equal(reads, 1); assert.equal(turns, 1);
    buffered.push('manual turn');
    voice.emit('voice:speech_end', { sessionId: 'chat' });
    await bridge.process('chat');
    await new Promise(resolve => setTimeout(resolve, 60));
    assert.equal(turns, 2, 'Explicit process must remove the pending automatic duplicate');
    voice.emit('voice:speech_end', { sessionId: 'chat' });
    await bridge.detach('chat');
    await new Promise(resolve => setTimeout(resolve, 60));
    assert.equal(turns, 2, 'Detached sessions must not execute a late utterance');
  } finally { await bridge.close(); }
});
test('[CONTRACT] supplied speech end routes supplied executor reply into the speech adapter', async t => {
  const calls = [];
  const voice = engine({ synthesizeSpeech: async (id, text, options) => { calls.push({ id, text, playback: options.playback }); return { played: false, pcmByteLength: 3200 }; } });
  const bridge = new VoiceConversation({ engine: voice, executeTurn: async input => {
    calls.push({ transcript: input.text, sessionId: input.sessionId });
    return { ok: true, content: 'Observed reply\n```zero-ui:progress\n{"status":"completed"}\n```', taskId: 'persisted-task' };
  } });
  t.after(() => bridge.close());
  bridge.attach('same-chat', { ownerId: 'owner', playback: false });
  const completed = new Promise(resolve => bridge.once('turn-complete', resolve));
  voice.emit('voice:speech_end', { sessionId: 'same-chat' });
  const result = await completed;
  assert.equal(result.taskId, 'persisted-task');
  assert.deepEqual(calls[0], { transcript: 'supplied transcript fixture', sessionId: 'same-chat' });
  assert.deepEqual(calls[1], { id: 'same-chat', text: 'Observed reply', playback: false });
  await bridge.close();
});
test('[CONTRACT] interruption cancels an in-flight shared turn and prevents late synthesis', async t => {
  let release, entered;
  const started = new Promise(resolve => { entered = resolve; });
  let spoken = 0;
  const voice = engine({ synthesizeSpeech: async () => { spoken++; return {}; } });
  const bridge = new VoiceConversation({ engine: voice, executeTurn: async ({ signal }) => { entered(signal); return new Promise(resolve => { release = resolve; }); } });
  t.after(() => bridge.close());
  bridge.attach('chat', { ownerId: 'owner' });
  const pending = bridge.process('chat');
  const signal = await started;
  voice.emit('voice:speech_start', { sessionId: 'chat' });
  assert.equal(signal.aborted, true);
  const cancelled = await pending;
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.code, 'VOICE_CANCELLED');
  assert.match(cancelled.error, /interrupted|cancelled/);
  release({ ok: true, content: 'Late reply' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(spoken, 0);
  await bridge.close();
});
test('[CONTRACT] supplied empty recognition and executor failure never produce speech completion', async t => {
  let called = 0;
  const voice = engine({ transcribe: async () => ({ transcribed: false, text: '' }) });
  const bridge = new VoiceConversation({ engine: voice, executeTurn: async () => { called++; return { ok: false, error: 'inference unavailable' }; } });
  t.after(() => bridge.close());
  bridge.attach('chat', { ownerId: 'owner' });
  assert.equal((await bridge.process('chat')).empty, true);
  assert.equal(called, 0);
  voice.transcribe = async () => ({ transcribed: true, text: 'request' });
  await assert.rejects(bridge.process('chat'), /inference unavailable/);
  assert.equal(bridge.status('chat').state, 'error');
  assert.throws(() => bridge.attach('chat', { ownerId: 'other' }), /different owner/);
  await bridge.detach('chat');
  assert.equal(bridge.status('chat').attached, false);
  await bridge.close();
});
