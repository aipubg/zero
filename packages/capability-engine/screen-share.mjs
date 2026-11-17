/**
 * Screen share: offline (local) and online (Gemini Live), side by side.
 *
 * Offline is Zero's existing local screen share (ScreenObserver: capture,
 * OCR, rolling buffer). It always runs and is untouched by this module.
 *
 * Online sends the same frames to a Gemini Live session, so Zero can ask
 * what is on the screen and what the owner is doing (ask_screen). It runs
 * only while a Gemini provider has Screen Share (Online) turned on and the
 * owner has not chosen "offline". Live here is the eyes only; actions stay
 * with Zero's main agent, so two models never move the mouse at once.
 *
 * Frames are not sent while: an excluded app is in front, the owner has
 * taken over the computer, or the hourly online limit is used up.
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { GeminiLiveClient } from '../model-fabric/gemini-live-client.mjs';

const LIVE_INSTRUCTION = [
  "You are Zero's eyes. You receive frames of the owner's Windows screen.",
  'When asked, say precisely what is on the screen and what the owner appears to be doing. Read visible text exactly.',
  'Answer in one to four short sentences. You cannot click or type; Zero does the actions.',
  'If no frame has arrived yet, say so instead of guessing.',
].join(' ');

const HOUR_MS = 60 * 60 * 1000;

export class ScreenShareService extends EventEmitter {
  /**
   * @param {object} deps
   * @param {() => ({ provider: object, config: object, apiKey: string } | null)} deps.getProvider
   * @param {() => ({ data: Buffer, timestamp: number, perceptualHash?: string, windowTitle?: string, appName?: string } | null)} deps.latestFrame
   * @param {() => boolean} [deps.isHumanHold]
   * @param {string} [deps.prefsPath]  where the owner's offline/auto choice is kept
   */
  constructor({ getProvider, latestFrame, isHumanHold = () => false, prefsPath = null, createClient = options => new GeminiLiveClient(options), now = () => Date.now(), tickMs = 500 } = {}) {
    super();
    this.getProvider = getProvider;
    this.latestFrame = latestFrame;
    this.isHumanHold = isHumanHold;
    this.prefsPath = prefsPath;
    this.createClient = createClient;
    this.now = now;
    this.tickMs = tickMs;
    this.client = null;
    this.selected = null;
    this.mode = 'offline';
    this.reason = 'Online screen share is not turned on';
    this.pausedReason = null;
    this.lastSentAt = 0;
    this.lastSentHash = null;
    this.lastSentTimestamp = 0;
    this.onlineMs = []; // [timestamp, ms] slices of online time in the last hour
    this.questions = Promise.resolve();
    this.preference = this._loadPreference();
  }

  _loadPreference() {
    try { const saved = JSON.parse(fs.readFileSync(this.prefsPath, 'utf8')); return saved.preference === 'offline' ? 'offline' : 'auto'; } catch { return 'auto'; }
  }

  _savePreference() {
    if (!this.prefsPath) return;
    fs.mkdirSync(path.dirname(this.prefsPath), { recursive: true });
    fs.writeFileSync(this.prefsPath, JSON.stringify({ preference: this.preference }, null, 2));
  }

  status() {
    const used = this._minutesThisHour();
    return {
      mode: this.mode,
      preference: this.preference,
      // Online but not sending (excluded app, owner took over, hourly limit).
      paused: this.mode === 'online' && Boolean(this.pausedReason),
      reason: this.mode === 'online' ? this.pausedReason : this.reason,
      provider: this.selected ? { id: this.selected.provider.id, name: this.selected.provider.name || this.selected.provider.id } : null,
      liveModel: this.selected?.config.liveModel || null,
      frameMode: this.selected?.config.frameMode || null,
      framesSent: this.client?.framesSent || 0,
      usage: this.client ? { ...this.client.usage } : null,
      minutesUsedThisHour: Math.round(used * 10) / 10,
      minutesPerHourLimit: this.selected?.config.maxMinutesPerHour || null,
    };
  }

  _setMode(mode, reason = null) {
    const changed = mode !== this.mode || reason !== this.reason;
    this.mode = mode;
    this.reason = reason;
    if (changed) this.emit('state', this.status());
  }

  /** Start, stop or restart online sharing to match settings and the owner's choice. */
  async refresh() {
    const selected = this.preference === 'offline' ? null : this.getProvider();
    const wanted = Boolean(selected);
    const sameSession = this.client && this.selected && selected
      && this.selected.provider.id === selected.provider.id
      && this.selected.apiKey === selected.apiKey
      && this.selected.config.liveModel === selected.config.liveModel;
    if (!wanted) {
      this._stopClient();
      this.selected = null;
      this._setMode('offline', this.preference === 'offline' ? 'Owner chose offline' : 'Online screen share is not turned on');
      return this.status();
    }
    if (sameSession) { this.selected = selected; return this.status(); }
    this._stopClient();
    this.selected = selected;
    return this._startClient();
  }

  async _startClient() {
    const { apiKey, config } = this.selected;
    const client = this.createClient({ apiKey, model: config.liveModel, systemInstruction: LIVE_INSTRUCTION });
    this.client = client;
    client.on('state', ({ status, reason }) => {
      if (this.client !== client) return;
      if (status === 'live') this._setMode('online');
      else if (status === 'reconnecting') this._setMode('connecting', `Reconnecting to Gemini Live (${reason})`);
      else if (status === 'failed') { this._stopClient(); this._setMode('offline', `Gemini Live unavailable: ${reason}. Using offline screen share.`); }
    });
    client.on('audio', chunk => { if (config.voiceReplies) this.emit('audio', chunk); });
    this._setMode('connecting', 'Connecting to Gemini Live');
    try {
      await client.connect();
    } catch (error) {
      if (this.client === client) { this._stopClient(); this._setMode('offline', `Gemini Live unavailable: ${error.message}. Using offline screen share.`); }
      return this.status();
    }
    this.lastSentAt = 0;
    this.lastSentHash = null;
    this._timer = setInterval(() => this._tick(), this.tickMs);
    this._timer.unref?.();
    return this.status();
  }

  _stopClient() {
    clearInterval(this._timer);
    this._timer = null;
    const client = this.client;
    this.client = null;
    client?.removeAllListeners();
    client?.close();
  }

  _minutesThisHour() {
    const since = this.now() - HOUR_MS;
    this.onlineMs = this.onlineMs.filter(([at]) => at >= since);
    return this.onlineMs.reduce((sum, [, ms]) => sum + ms, 0) / 60000;
  }

  /** Why frames must not be sent right now, or null. */
  _pauseReason(frame) {
    const config = this.selected?.config;
    if (!config) return 'not online';
    if (this.isHumanHold()) return 'You have taken over the computer';
    const haystack = `${frame?.windowTitle || ''} ${frame?.appName || ''}`.toLowerCase();
    const excluded = (config.excludedApps || []).find(app => app && haystack.includes(app.toLowerCase()));
    if (excluded) return `${excluded} is in front`;
    if (this._minutesThisHour() >= config.maxMinutesPerHour) return `Hourly online limit (${config.maxMinutesPerHour} min) used`;
    return null;
  }

  _tick() {
    if (!this.client?.ready || !this.selected) return;
    const now = this.now();
    const frame = this.latestFrame();
    const paused = this._pauseReason(frame);
    if (paused !== this.pausedReason) {
      this.pausedReason = paused;
      this.emit('state', this.status());
    }
    if (paused) return;
    this.onlineMs.push([now, this.tickMs]);
    const { frameMode, maxFps, heartbeatSeconds } = this.selected.config;
    if (frameMode !== 'on-change' || !frame?.data) return;
    if (now - this.lastSentAt < 1000 / maxFps) return;
    const isNew = frame.timestamp > this.lastSentTimestamp;
    const changed = !frame.perceptualHash || frame.perceptualHash !== this.lastSentHash;
    const heartbeatDue = now - this.lastSentAt >= heartbeatSeconds * 1000;
    if (!isNew || (!changed && !heartbeatDue)) return;
    this._sendFrame(frame, now);
  }

  _sendFrame(frame, now = this.now()) {
    if (!this.client?.sendFrame(frame.data)) return false;
    this.lastSentAt = now;
    this.lastSentHash = frame.perceptualHash || null;
    this.lastSentTimestamp = frame.timestamp;
    return true;
  }

  /**
   * Ask Gemini Live about the screen. Questions are answered one at a time.
   * Returns { ok, answer } or { ok: false, error }.
   */
  ask(question, { timeoutMs = 30000 } = {}) {
    const run = async () => {
      if (this.mode !== 'online' || !this.client?.ready) {
        return { ok: false, error: 'screen-share-offline', message: `Online screen share is not active (${this.pausedReason || this.reason || 'offline'}). Use see_screen instead.` };
      }
      const frame = this.latestFrame();
      const paused = this._pauseReason(frame);
      if (paused) return { ok: false, error: 'screen-share-paused', message: `Not sending the screen: ${paused}.` };
      // Make sure Gemini has a current frame before it answers.
      if (frame?.data && (this.selected.config.frameMode === 'on-demand' || frame.timestamp > this.lastSentTimestamp)) this._sendFrame(frame);
      if (!this.lastSentAt) return { ok: false, error: 'no-frame', message: 'No screen frame is available yet.' };
      const client = this.client;
      const answer = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { client.off('turn', onTurn); reject(new Error(`No answer from Gemini Live within ${Math.round(timeoutMs / 1000)} s`)); }, timeoutMs);
        const onTurn = text => { clearTimeout(timer); client.off('turn', onTurn); resolve(text); };
        client.on('turn', onTurn);
        client.sendText(String(question));
      });
      return { ok: true, status: 'COMPLETED', outcome: 'COMPLETED', taskComplete: true, observed: true, verified: true, evidence: { source: 'gemini-live', frameAgeMs: this.now() - this.lastSentTimestamp }, answer, model: this.selected?.config.liveModel };
    };
    const result = this.questions.then(run, run).catch(error => ({ ok: false, error: 'live-ask-failed', message: error.message }));
    this.questions = result.then(() => {}, () => {});
    return result;
  }

  async setPreference(preference) {
    if (!['auto', 'offline'].includes(preference)) throw new Error('preference must be "auto" or "offline"');
    this.preference = preference;
    this._savePreference();
    return this.refresh();
  }

  stop() {
    this._stopClient();
    this._setMode('offline', 'Stopped');
  }
}
