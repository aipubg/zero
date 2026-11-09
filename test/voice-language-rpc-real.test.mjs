import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { ZeroNativeHost } from '../services/host/native-gateway.mjs';
import { WindowsSpeechBackend } from '../packages/voice-engine/windows-speech.mjs';

test('[REAL_OS] actual voice RPC honors language and preserves input after missing recognizer', {
  skip: process.platform !== 'win32' || process.env.ZERO_VOICE_NATIVE_TESTS !== '1', timeout: 40000,
}, async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-voice-language-'));
  const output = path.resolve('artifacts/voice-language-rpc', String(Date.now())); fs.mkdirSync(output, { recursive: true });
  const report = { classification: ['REAL_OS', 'INTEGRATION'], status: 'RUNNING', inputSource: 'Actual local Windows synthesis in RAM; not microphone speech' };
  let host; let socket; let audio;
  const pending = new Map();
  const call = (method, params) => new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timeout`)); }, 15000);
    pending.set(id, frame => { clearTimeout(timer); frame.ok === false ? reject(new Error(JSON.stringify(frame.error))) : resolve(frame.payload); });
    socket.send(JSON.stringify({ type: 'req', id, method, params }));
  });
  try {
    const reservation = net.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
    const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
    const providersPath = path.join(temporary, 'providers.json'); fs.writeFileSync(providersPath, '[]');
    host = new ZeroNativeHost({ port, dataDir: path.join(temporary, 'data'), prefsPath: path.join(temporary, 'prefs.json'), skillsDir: path.join(temporary, 'skills'), providersPath, agentBindingsPath: path.join(temporary, 'bindings.json'), localVision: false });
    await host.start();
    const auth = await fetch(`http://127.0.0.1:${port}/api/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) });
    const { token } = await auth.json();
    socket = new WebSocket(`ws://127.0.0.1:${port}`);
    socket.addEventListener('message', event => { const frame = JSON.parse(event.data); if (pending.has(frame.id)) { pending.get(frame.id)(frame); pending.delete(frame.id); } });
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    await call('connect', { minProtocol: 4, token });
    // Manual session avoids automatic conversation execution; RPC handles the
    // real chunk and explicit transcription, without any cloud inference.
    host.voiceEngine.startSession('language-proof');
    audio = await new WindowsSpeechBackend().synthesize('The voice engine can now speak real words.');
    await call('voice.chunk', { sessionId: 'language-proof', chunk: audio.pcm.toString('base64') });
    const rejected = assert.rejects(call('voice.transcribe', { sessionId: 'language-proof', language: 'zz-ZZ' }), /recognizer installed/);
    const during = await call('voice.status', {});
    assert.equal(during.sessions.find(session => session.sessionId === 'language-proof').transcriptionActive, true, 'New input must arrive while original native recognition request is actually pending');
    const subsequentSilence = Buffer.alloc(16000);
    await call('voice.chunk', { sessionId: 'language-proof', chunk: subsequentSilence.toString('base64') });
    await rejected;
    const expectedInput = Buffer.concat([audio.pcm, subsequentSilence]);
    assert.equal(host.voiceEngine.getStatus().sessions[0].router.bufferedInputBytes, expectedInput.length);
    const actualInput = Buffer.concat(host.voiceEngine.sessions.get('language-proof').router._inputChunks);
    try { assert.deepEqual(actualInput, expectedInput, 'Restored failed input must precede newly received audio byte-for-byte'); }
    finally { actualInput.fill(0); expectedInput.fill(0); }
    const result = await call('voice.transcribe', { sessionId: 'language-proof', language: 'en-US' });
    assert.equal(result.language, 'en-US'); assert.equal(result.transcribed, true); assert.match(result.text, /speak real words/i);
    assert.equal(result.pcmByteLength, audio.pcm.length + subsequentSilence.length);
    assert.equal(host.voiceEngine.getStatus().sessions[0].router.bufferedInputBytes, 0);
    report.status = 'PASS'; report.selectedLanguage = result.language; report.missingLanguageRejected = true; report.inputPreservedOnFailure = true; report.concurrentInputByteOrderPreserved = true; report.actualRecognizedPhrase = result.text; report.cloudRequests = host.modelFabric.upstreamRequestCount;
    assert.equal(report.cloudRequests, 0);
  } catch (error) { report.status = 'FAIL'; report.error = error.message; throw error; }
  finally {
    if (socket?.readyState === WebSocket.OPEN) { const closed = new Promise(resolve => socket.addEventListener('close', resolve, { once: true })); socket.close(); await closed; }
    await host?.close(); audio?.pcm.fill(0);
    report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    assert.equal(fs.realpathSync(path.dirname(temporary)), fs.realpathSync(os.tmpdir())); fs.rmSync(temporary, { recursive: true, force: true });
  }
});
