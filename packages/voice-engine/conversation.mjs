import { EventEmitter } from 'node:events';

function cancellable(operation, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve().then(() => { signal.throwIfAborted(); return operation(); }).then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
  });
}

/** Voice is an input/output adapter over the host's existing assistant turn. */
export class VoiceConversation extends EventEmitter {
  constructor({ engine, executeTurn }) {
    super();
    if (!engine || typeof executeTurn !== 'function') throw new Error('VoiceConversation requires a voice engine and the host assistant executor');
    this.engine = engine;
    this.executeTurn = executeTurn;
    this.bindings = new Map();
    this.onStart = ({ sessionId }) => this.interrupt(sessionId);
    this.onEnd = ({ sessionId }) => { void this.process(sessionId).catch(() => {}); };
    this.onStopped = ({ sessionId }) => { void this.detach(sessionId); };
    engine.on('voice:speech_start', this.onStart);
    engine.on('voice:speech_end', this.onEnd);
    engine.on('voice:session_stopped', this.onStopped);
  }
  attach(sessionId, context = {}) {
    if (this.bindings.has(sessionId)) {
      const existing = this.bindings.get(sessionId);
      if (existing.context.ownerId !== context.ownerId) throw new Error('Voice session belongs to a different owner');
      existing.context = context;
      return this.status(sessionId);
    }
    this.bindings.set(sessionId, { context, controller: null, pending: Promise.resolve(), state: 'listening', generation: 0, lastError: null, turns: 0 });
    return this.status(sessionId);
  }
  interrupt(sessionId) {
    const binding = this.bindings.get(sessionId);
    if (!binding) return;
    binding.generation++;
    binding.controller?.abort(new DOMException('Interrupted by new user speech', 'AbortError'));
    try { this.engine.cancelSpeech(sessionId); } catch {}
    binding.state = 'listening';
    this.emit('interrupted', { sessionId });
  }
  process(sessionId) {
    const binding = this.bindings.get(sessionId);
    if (!binding) return Promise.reject(new Error('Voice conversation is not attached'));
    const generation = ++binding.generation;
    binding.controller?.abort(new DOMException('Superseded by a new utterance', 'AbortError'));
    const controller = new AbortController();
    binding.controller = controller;
    const pending = binding.pending.catch(() => {}).then(async () => {
      const current = () => {
        controller.signal.throwIfAborted();
        if (this.bindings.get(sessionId) !== binding || generation !== binding.generation) throw new DOMException('Voice conversation stopped', 'AbortError');
      };
      try {
        current(); binding.state = 'transcribing';
        const transcript = await cancellable(() => this.engine.transcribe(sessionId, { signal: controller.signal, language: binding.context.language }), controller.signal);
        current();
        if (!transcript.transcribed || !transcript.text?.trim()) { binding.state = 'listening'; return { ok: true, empty: true }; }
        this.emit('transcript', { sessionId, text: transcript.text });
        binding.state = 'executing';
        const result = await cancellable(() => this.executeTurn({ sessionId, text: transcript.text, signal: controller.signal, context: binding.context }), controller.signal);
        current();
        if (!result?.ok || typeof result.content !== 'string' || !result.content.trim()) throw new Error(result?.error || 'Assistant returned no spoken reply');
        binding.state = 'speaking';
        // Interactive card payloads are presentation data, not spoken prose.
        const text = result.content.replace(/```zero-ui:[\s\S]*?```/g, '').trim();
        if (!text) throw new Error('Assistant reply contained no speakable text');
        const speech = await cancellable(() => this.engine.synthesizeSpeech(sessionId, text, { signal: controller.signal, ...(binding.context.playback !== undefined ? { playback: binding.context.playback } : {}) }), controller.signal);
        current();
        binding.turns++; binding.state = 'listening'; binding.lastError = null;
        const output = { ok: true, sessionId, transcript: transcript.text, content: result.content, taskId: result.taskId, played: speech.played, pcmByteLength: speech.pcmByteLength };
        this.emit('turn-complete', output);
        return output;
      } catch (error) {
        if (controller.signal.aborted || error.name === 'AbortError') return { ok: false, cancelled: true, code: 'VOICE_CANCELLED', error: 'Voice turn was interrupted or cancelled', sessionId };
        binding.lastError = error.message; binding.state = 'error';
        this.emit('turn-error', { sessionId, error: error.message });
        throw error;
      } finally { if (binding.controller === controller) binding.controller = null; }
    });
    binding.pending = pending;
    return pending;
  }
  status(sessionId) {
    const binding = this.bindings.get(sessionId);
    return binding ? { sessionId, attached: true, state: binding.state, completedTurns: binding.turns, lastError: binding.lastError } : { sessionId, attached: false };
  }
  async detach(sessionId) {
    const binding = this.bindings.get(sessionId);
    if (!binding) return;
    this.bindings.delete(sessionId);
    binding.controller?.abort(new DOMException('Voice conversation stopped', 'AbortError'));
    try { this.engine.cancelSpeech(sessionId); } catch {}
    await binding.pending.catch(() => {});
  }
  async close() {
    this.engine.off('voice:speech_start', this.onStart);
    this.engine.off('voice:speech_end', this.onEnd);
    this.engine.off('voice:session_stopped', this.onStopped);
    await Promise.all([...this.bindings.keys()].map(sessionId => this.detach(sessionId)));
  }
}
