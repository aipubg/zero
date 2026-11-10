import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceEngine } from '../packages/voice-engine/index.mjs';

test('[CONTRACT] supplied playback adapter requires started and completed signals instead of a resolved promise', async () => {
  for (const mode of ['no-result', 'no-start', 'failed']) {
    const engine = new VoiceEngine({ backend: {
      synthesize: async () => ({ pcm: Buffer.alloc(3200), voice: 'contract' }),
      play: async (_, { onStarted }) => { if (mode !== 'no-start') onStarted(); return mode === 'no-result' ? undefined : { played: mode !== 'failed' }; },
    } });
    engine.startSession('contract');
    try { await assert.rejects(engine.synthesizeSpeech('contract', 'Hello', { playback: true }), error => error.code === 'VOICE_PLAYBACK_INCOMPLETE'); }
    finally { await engine.close(); }
  }
});

test('[CONTRACT] failed recognizer response with text cannot become successful transcription', async () => {
  const engine = new VoiceEngine({ backend: { transcribe: async () => ({ ok: false, text: 'Plausible transcript', error: 'Recognizer failed' }) } });
  engine.startSession('contract');
  try {
    engine.ingestChunk('contract', Buffer.alloc(3200));
    await assert.rejects(engine.transcribe('contract'), error => error.code === 'VOICE_TRANSCRIPTION_FAILED');
  } finally { await engine.close(); }
});
