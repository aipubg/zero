/**
 * Gemini Live client over a raw WebSocket (no SDK).
 *
 * Verified on the owner's key (2026-11-17, docs/plans/SCREEN-SHARE-ONLINE.md 4c):
 * - responseModalities goes in generationConfig; Live models answer in AUDIO
 *   only, so text comes from outputAudioTranscription;
 * - frames go as realtimeInput.video (JPEG), at most one per second;
 * - sessionResumptionUpdate arrives right after setupComplete.
 *
 * Events: 'ready', 'transcript' (delta text), 'turn' (full text of a finished
 * turn), 'audio' ({ data, mimeType }), 'toolCall' (calls), 'toolCancel' (ids),
 * 'usage' (metadata), 'state' ({ status, reason }), 'error'.
 */

import { EventEmitter } from 'node:events';
import { LIVE_WS_URL } from './gemini-screen-share.mjs';

const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000, 20000];

export class GeminiLiveClient extends EventEmitter {
  constructor({ apiKey, model, systemInstruction = '', functionDeclarations = [], url = LIVE_WS_URL, WebSocketImpl = globalThis.WebSocket, reconnectDelaysMs = RECONNECT_DELAYS_MS } = {}) {
    super();
    if (!apiKey || !model) throw new Error('Gemini Live needs an API key and a model');
    this.apiKey = apiKey;
    this.model = model.replace(/^models\//, '');
    this.systemInstruction = systemInstruction;
    this.functionDeclarations = functionDeclarations;
    this.url = url;
    this.WebSocketImpl = WebSocketImpl;
    this.reconnectDelaysMs = reconnectDelaysMs;
    this.ws = null;
    this.ready = false;
    this.closedByUs = false;
    this.resumeHandle = null;
    this.reconnectAttempt = 0;
    this.turnText = '';
    this.usage = { promptTokens: 0, responseTokens: 0, totalTokens: 0 };
    this.framesSent = 0;
  }

  connect() {
    this.closedByUs = false;
    return new Promise((resolve, reject) => {
      let settled = false;
      const ws = new this.WebSocketImpl(`${this.url}?key=${encodeURIComponent(this.apiKey)}`);
      this.ws = ws;
      this.ready = false;
      this.emit('state', { status: 'connecting' });
      ws.onopen = () => {
        const setup = {
          model: `models/${this.model}`,
          generationConfig: { responseModalities: ['AUDIO'] },
          outputAudioTranscription: {},
          contextWindowCompression: { slidingWindow: {} },
          sessionResumption: this.resumeHandle ? { handle: this.resumeHandle } : {},
        };
        if (this.systemInstruction) setup.systemInstruction = { parts: [{ text: this.systemInstruction }] };
        if (this.functionDeclarations.length) setup.tools = [{ functionDeclarations: this.functionDeclarations }];
        ws.send(JSON.stringify({ setup }));
      };
      ws.onmessage = async event => {
        let message;
        try {
          const raw = typeof event.data === 'string' ? event.data : Buffer.from(await event.data.arrayBuffer()).toString('utf8');
          message = JSON.parse(raw);
        } catch { return; }
        if (message.setupComplete) {
          this.ready = true;
          this.reconnectAttempt = 0;
          this.emit('state', { status: 'live' });
          this.emit('ready');
          if (!settled) { settled = true; resolve(); }
          return;
        }
        this._handle(message);
      };
      ws.onclose = event => {
        const reason = String(event.reason || '').slice(0, 300) || `closed (code ${event.code})`;
        const wasReady = this.ready;
        this.ready = false;
        if (this.ws === ws) this.ws = null;
        if (!settled) { settled = true; reject(new Error(reason)); return; }
        if (this.closedByUs) { this.emit('state', { status: 'stopped' }); return; }
        this._scheduleReconnect(wasReady ? reason : `could not connect: ${reason}`);
      };
      ws.onerror = () => {};
    });
  }

  _scheduleReconnect(reason) {
    if (this.reconnectAttempt >= this.reconnectDelaysMs.length) {
      this.emit('state', { status: 'failed', reason });
      return;
    }
    const delay = this.reconnectDelaysMs[this.reconnectAttempt++];
    this.emit('state', { status: 'reconnecting', reason, inMs: delay });
    this._reconnectTimer = setTimeout(() => {
      if (this.closedByUs) return;
      this.connect().catch(error => this._scheduleReconnect(error.message));
    }, delay);
    this._reconnectTimer.unref?.();
  }

  _handle(message) {
    if (message.sessionResumptionUpdate) {
      const { newHandle, resumable } = message.sessionResumptionUpdate;
      if (resumable && newHandle) this.resumeHandle = newHandle;
    }
    if (message.goAway) {
      // The server will close soon; reconnect now with the resumption handle.
      this.emit('state', { status: 'reconnecting', reason: 'server asked to reconnect' });
      const old = this.ws;
      this.ws = null;
      this.ready = false;
      try { old.onclose = null; old.close(); } catch {}
      this.connect().catch(error => this._scheduleReconnect(error.message));
    }
    if (message.toolCall?.functionCalls?.length) this.emit('toolCall', message.toolCall.functionCalls);
    if (message.toolCallCancellation?.ids?.length) this.emit('toolCancel', message.toolCallCancellation.ids);
    if (message.usageMetadata) {
      const u = message.usageMetadata;
      this.usage.promptTokens += u.promptTokenCount || 0;
      this.usage.responseTokens += u.responseTokenCount || 0;
      this.usage.totalTokens += u.totalTokenCount || 0;
      this.emit('usage', { ...this.usage });
    }
    const content = message.serverContent;
    if (content) {
      for (const part of content.modelTurn?.parts || []) {
        if (part.inlineData?.data) this.emit('audio', { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000' });
        if (part.text) { this.turnText += part.text; this.emit('transcript', part.text); }
      }
      if (content.outputTranscription?.text) {
        this.turnText += content.outputTranscription.text;
        this.emit('transcript', content.outputTranscription.text);
      }
      if (content.interrupted) this.emit('interrupted');
      if (content.turnComplete) {
        const text = this.turnText.trim();
        this.turnText = '';
        this.emit('turn', text);
      }
    }
  }

  _send(payload) {
    if (!this.ws || !this.ready || this.ws.readyState !== 1) return false;
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  /** One screen frame (JPEG bytes or base64). */
  sendFrame(jpeg) {
    const data = Buffer.isBuffer(jpeg) || jpeg instanceof Uint8Array ? Buffer.from(jpeg).toString('base64') : String(jpeg);
    const sent = this._send({ realtimeInput: { video: { mimeType: 'image/jpeg', data } } });
    if (sent) this.framesSent++;
    return sent;
  }

  sendText(text) {
    return this._send({ realtimeInput: { text: String(text) } });
  }

  respond(functionResponses) {
    return this._send({ toolResponse: { functionResponses } });
  }

  close() {
    this.closedByUs = true;
    clearTimeout(this._reconnectTimer);
    const ws = this.ws;
    this.ws = null;
    this.ready = false;
    try { ws?.close(); } catch {}
    this.emit('state', { status: 'stopped' });
  }
}
