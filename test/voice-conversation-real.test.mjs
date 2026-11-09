import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';
import { WindowsSpeechBackend } from '../packages/voice-engine/windows-speech.mjs';

test('[REAL_OS] actual Windows speech completes shared external assistant turn and typed chat continuation', {
  skip: process.platform !== 'win32' || process.env.ZERO_VOICE_NATIVE_TESTS !== '1', timeout: 180000,
}, async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-voice-conversation-'));
  const output = path.resolve('artifacts/voice-conversation-real', String(Date.now())); fs.mkdirSync(output, { recursive: true });
  const report = { classification: ['REAL_OS', 'INTEGRATION', 'REAL_EXTERNAL'], status: 'RUNNING', inputSource: 'Actual local Windows synthesis in RAM; not microphone speech' };
  let host; let socket; let audio;
  const human = process.env.ZERO_VOICE_HUMAN_CONVERSATION === '1';
  const automatic = process.env.ZERO_VOICE_HUMAN_AUTOMATIC === '1';
  if (automatic && !human) throw new Error('Automatic acceptance requires actual human microphone mode');
  let cleanupAutomatic;
  if (human) Object.assign(report, { inputSource: 'Actual headset microphone; no raw audio saved', humanMicrophone: 'RUNNING', captureMethod: 'Native host VoiceEngine capture, explicit end-of-utterance; not automatic VAD turn acceptance' });
  const pending = new Map();
  const call = (method, params) => new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timeout`)); }, 90000);
    pending.set(id, frame => { clearTimeout(timer); frame.ok === false ? reject(new Error(JSON.stringify(frame.error))) : resolve(frame.payload); });
    socket.send(JSON.stringify({ type: 'req', id, method, params }));
  });
  try {
    // Match the actual native host bootstrap without printing credentials.
    if (fs.existsSync(path.resolve('.env'))) process.loadEnvFile(path.resolve('.env'));
    const reservation = net.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
    const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
    const providersPath = path.join(temporary, 'providers.json'); fs.copyFileSync(path.resolve('models/gateway-providers.json'), providersPath);
    fs.copyFileSync(path.resolve('models/gateway-defaults.json'), path.join(temporary, 'bindings.json'));
    host = new ZeroNativeHost({ port, dataDir: path.join(temporary, 'data'), prefsPath: path.join(temporary, 'prefs.json'), skillsDir: path.join(temporary, 'skills'), providersPath, agentBindingsPath: path.join(temporary, 'bindings.json'), localModelsDir: path.join(temporary, 'local-models'), localVision: false });
    report.recognitionBackend = host.voiceEngine.backend.constructor.name;
    if (process.env.ZERO_VOICE_RECOGNITION_BACKEND === 'whisper') assert.equal(report.recognitionBackend, 'WhisperSpeechBackend');
    await host.start();
    const auth = await fetch(`http://127.0.0.1:${port}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) });
    const { token } = await auth.json();
    socket = new WebSocket(`ws://127.0.0.1:${port}`);
    socket.addEventListener('message', event => { const frame = JSON.parse(event.data); if (pending.has(frame.id)) { pending.get(frame.id)(frame); pending.delete(frame.id); } });
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    await call('connect', { minProtocol: 4, token });
    host.voiceEngine.startSession('spoken-chat');
    let spoken;
    if (automatic) {
      report.captureMethod = 'Actual microphone RPC and automatic VAD speech_end; no voice.turn RPC or microphone stop before completed playback';
      const cue = await new WindowsSpeechBackend().synthesize('The headset microphone is now listening. Say the sentence shown in the chat.');
      const completed = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('No matching automatic human voice turn completed within 60 seconds')), 60000);
        const onComplete = value => { if (value.sessionId === 'spoken-chat' && /remember\s+blue\s*bird/i.test(value.transcript)) resolve(value); };
        const onError = value => { if (value.sessionId === 'spoken-chat') reject(new Error(value.error)); };
        host.voiceConversation.on('turn-complete', onComplete); host.voiceConversation.on('turn-error', onError);
        cleanupAutomatic = () => { clearTimeout(timer); host.voiceConversation.off('turn-complete', onComplete); host.voiceConversation.off('turn-error', onError); };
      });
      completed.catch(() => {});
      await call('voice.microphone.start', { sessionId: 'spoken-chat', deviceId: 0, language: 'en-US', playback: true });
      console.log('HUMAN_AUTOMATIC_READY: Please remember blue bird and answer briefly.');
      await host.voiceEngine.backend.play(cue.pcm); cue.pcm.fill(0);
      spoken = await completed;
      cleanupAutomatic();
      await host.voiceEngine.stopMicrophone('spoken-chat');
      report.capture = host.voiceEngine.getStatus().sessions[0].capture;
      report.automaticTurn = { matchingTurnCompleted: true, explicitVoiceTurnCalls: 0, microphoneStoppedAfterCompletedPlayback: true };
    } else if (human) {
      const cue = await new WindowsSpeechBackend().synthesize('The headset microphone is now listening. Say the sentence shown in the chat.');
      await host.voiceEngine.startMicrophone('spoken-chat', { deviceId: 0, durationMs: 30000 });
      console.log('HUMAN_CONVERSATION_READY: Please remember blue bird and answer briefly.');
      await host.voiceEngine.backend.play(cue.pcm); cue.pcm.fill(0);
      await new Promise(resolve => setTimeout(resolve, 25000));
      await host.voiceEngine.stopMicrophone('spoken-chat');
      report.capture = host.voiceEngine.getStatus().sessions[0].capture;
      assert.ok(report.capture.frames > 0 && report.capture.bytes > 32000);
    } else {
      // Generate genuine local speech in RAM; not a human microphone test.
      audio = await new WindowsSpeechBackend().synthesize('The voice engine can now speak real words.');
      await call('voice.chunk', { sessionId: 'spoken-chat', chunk: audio.pcm.toString('base64') });
    }
    if (!automatic) spoken = await call('voice.turn', { sessionId: 'spoken-chat', language: 'en-US', playback: human });
    assert.equal(spoken.ok, true, JSON.stringify(spoken));
    assert.match(spoken.transcript, human ? /remember\s+blue\s*bird/i : /speak real words/i);
    assert.ok(spoken.content.trim()); assert.ok(spoken.pcmByteLength > 3200);
    assert.equal(spoken.played, human);
    const voiceTask = host.tasks.getTask(spoken.taskId);
    assert.equal(voiceTask?.status, 'COMPLETED');
    const first = await call('chat.history', { sessionKey: 'spoken-chat' });
    assert.ok(first.messages.some(message => message.role === 'user' && message.content === spoken.transcript));
    assert.ok(first.messages.some(message => message.role === 'assistant' && message.content === spoken.content));
    const typed = await call('chat.send', { sessionKey: 'spoken-chat', message: human ? 'What two words did I ask you to remember in my previous message? Answer briefly using that conversation.' : 'What did my previous message say the voice engine can do? Answer briefly using the previous conversation.', idempotencyKey: 'typed-after-voice' });
    assert.equal(typed.ok, true, JSON.stringify(typed));
    const history = await call('chat.history', { sessionKey: 'spoken-chat' });
    const replies = history.messages.filter(message => message.role === 'assistant');
    assert.ok(replies.length >= 2);
    assert.match(replies.at(-1).content, human ? /blue\s*bird/i : /speak real words/i);
    const status = await call('voice.conversation.status', { sessionId: 'spoken-chat' });
    if (automatic) assert.ok(status.completedTurns >= 1); else assert.equal(status.completedTurns, 1);
    assert.equal(status.state, 'listening');
    Object.assign(report, { status: 'PASS', actualTranscript: spoken.transcript, spokenAssistantContent: spoken.content, synthesizedReplyBytes: spoken.pcmByteLength, played: spoken.played, taskId: spoken.taskId, voiceTaskStatus: voiceTask.status, typedFollowup: replies.at(-1).content, persistedMessages: history.messages.length, completedVoiceTurns: status.completedTurns, cloudRequests: host.modelFabric.upstreamRequestCount, humanMicrophone: human ? 'PASS' : 'UNVERIFIED', acousticBargeIn: 'UNVERIFIED' });
    assert.ok(report.cloudRequests >= 2);
    if (process.env.ZERO_VOICE_INTERRUPT_TESTS === '1') {
      // Upload before attaching to avoid VAD scheduling an automatic duplicate.
      await host.voiceConversation.detach('spoken-chat');
      await call('voice.chunk', { sessionId: 'spoken-chat', chunk: audio.pcm.toString('base64') });
      const beforeRequests = host.modelFabric.upstreamRequestCount;
      let publishedAudio = 0;
      const onAudio = () => { publishedAudio++; };
      host.voiceEngine.on('voice:audio', onAudio);
      const interrupted = call('voice.turn', { sessionId: 'spoken-chat', language: 'en-US', playback: false });
      const observed = interrupted.then(value => ({ value }), error => ({ error }));
      try {
        const deadline = Date.now() + 20000;
        let executing;
        while (Date.now() < deadline) {
          const current = await call('voice.conversation.status', { sessionId: 'spoken-chat' });
          if (current.state === 'executing' && host.modelFabric.upstreamRequestCount > beforeRequests && host.activeTurns.has('spoken-chat')) { executing = true; break; }
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        assert.equal(executing, true, 'Interrupt only after actual upstream request and live assistant execution');
        const receipt = host.sessions.db.prepare("SELECT task_id FROM zero_assistant_receipts WHERE session_id=? AND status='running' LIMIT 1").get('spoken-chat');
        assert.ok(receipt?.task_id);
        const recovered = await call('chat.send', { sessionKey: 'spoken-chat', message: 'Reply with exactly VOICE_RECOVERED and nothing else.', idempotencyKey: 'interrupt-voice-with-chat' });
        assert.equal(recovered.ok, true, JSON.stringify(recovered));
        const stopped = await observed;
        assert.ok(stopped.error, 'Cancelled voice turn must be a failed RPC, not a successful response');
        assert.match(stopped.error.message, /VOICE_CANCELLED/);
        const interruptedTask = host.tasks.getTask(receipt.task_id);
        assert.equal(interruptedTask.status, 'CANCELLED');
        const after = await call('chat.history', { sessionKey: 'spoken-chat' });
        assert.equal(after.messages.filter(message => message.role === 'assistant').at(-1).content.trim(), 'VOICE_RECOVERED');
        assert.equal(publishedAudio, 0, 'Cancelled voice reply must not publish late synthesized PCM');
        report.interruption = { actualUpstreamStarted: true, oldVoiceCancelled: true, oldTaskStatus: interruptedTask.status, typedRecovery: 'VOICE_RECOVERED', lateAudioFrames: publishedAudio, scope: 'Typed interruption of actual external voice turn; not microphone acoustic barge-in' };
      } finally { host.voiceEngine.off('voice:audio', onAudio); }
    }

  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    cleanupAutomatic?.();
    if (socket?.readyState === WebSocket.OPEN) { const closed = new Promise(resolve => socket.addEventListener('close', resolve, { once: true })); socket.close(); await closed; }
    await host?.close(); audio?.pcm.fill(0);
    report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(fs.realpathSync(path.dirname(temporary)), fs.realpathSync(os.tmpdir())); fs.rmSync(temporary, { recursive: true, force: true });
  }
});
