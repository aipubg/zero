import fs from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const commands = new Set(['play','pause','play_pause','volume_up','volume_down','mute','unmute','next','next_track','skip','prev','previous','fullscreen','focus']);

/** Controls only the visible browser page created by this instance. */
export class MediaController {
  constructor({ executablePath } = {}) {
    this.executablePath = executablePath;
    this.browser = null; this.page = null; this.busy = false;
  }

  async _launch() {
    if (this.browser?.isConnected()) return;
    const { chromium } = await import('../../backend/node_modules/playwright-core/index.mjs');
    const executablePath = this.executablePath || [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ].find(candidate => fs.existsSync(candidate));
    if (!executablePath) throw new Error('A supported installed Chrome or Edge browser is required for media playback');
    this.browser = await chromium.launch({ executablePath, headless: false, timeout: 15000 });
    this.browser.on('disconnected', () => { this.browser = null; this.page = null; });
  }

  async _run(action, signal, operation) {
    if (this.busy) return { ok: false, executed: false, verified: false, outcome: 'BLOCKED', error: 'media:busy', message: 'Another media operation is active' };
    this.busy = true;
    this.effectStarted = false;
    const combined = AbortSignal.any([AbortSignal.timeout(45000), ...(signal ? [signal] : [])]);
    const abort = () => { void this.page?.close().catch(() => {}); };
    combined.addEventListener('abort', abort, { once: true });
    try { combined.throwIfAborted(); return await operation(combined); }
    catch (error) {
      return { ok: false, executed: this.effectStarted, verified: false, completed: false, outcome: combined.aborted ? 'CANCELLED' : 'FAILED', action,
        error: 'media:execution-failed', message: error.message, audioAudible: 'UNVERIFIED' };
    } finally {
      combined.removeEventListener('abort', abort);
      if (combined.aborted) await this.close();
      this.busy = false;
    }
  }

  async _media() {
    if (!this.page || this.page.isClosed()) throw new Error('No ZERO-owned media page is open; start playback through ZERO first');
    const media = this.page.locator('video, audio');
    await media.first().waitFor({ state: 'attached', timeout: 15000 });
    // Avoid accidentally acting on a different player when multiple are present.
    if (await media.count() !== 1) throw new Error('Media target is ambiguous: the page contains multiple players');
    return media.first();
  }

  async _snapshot(media) {
    return media.evaluate(element => ({ paused: element.paused, ended: element.ended, currentTime: element.currentTime,
      volume: element.volume, muted: element.muted, readyState: element.readyState, source: element.currentSrc,
      decodedAudioBytes: typeof element.webkitAudioDecodedByteCount === 'number' ? element.webkitAudioDecodedByteCount : null,
      error: element.error ? { code: element.error.code, message: element.error.message } : null }));
  }

  async _result(action, command, media, before, expected, signal) {
    const start = await this._snapshot(media);
    await delay(650, undefined, { signal });
    const after = await this._snapshot(media);
    const advanced = after.currentTime > start.currentTime + 0.05;
    const sameSource = start.source === after.source && !!after.source;
    const decodedAudio = Number.isFinite(after.decodedAudioBytes) && after.decodedAudioBytes > 0;
    let verified = false;
    if (expected === 'play') verified = sameSource && !after.paused && !after.ended && advanced && !after.error;
    if (expected === 'pause') verified = sameSource && after.paused && Math.abs(after.currentTime - start.currentTime) < 0.05;
    if (expected === 'mute') verified = after.muted;
    if (expected === 'unmute') verified = !after.muted;
    if (expected === 'volume_up') verified = after.volume > before.volume || before.volume === 1 && after.volume === 1;
    if (expected === 'volume_down') verified = after.volume < before.volume || before.volume === 0 && after.volume === 0;
    if (expected === 'track') verified = !!after.source && after.source !== before.source && !after.paused && advanced && !after.error;
    if (expected === 'fullscreen') verified = await media.evaluate(element => !!document.fullscreenElement && document.fullscreenElement.contains(element));
    return { ok: true, executed: true, verified, completed: verified, outcome: verified ? 'COMPLETED' : 'UNVERIFIED', action, command,
      url: this.page.url(), videoTitle: await this.page.title(), browserOpened: true, pageLoaded: true,
      playbackState: !after.paused && advanced && sameSource ? 'PLAYING' : after.paused ? 'PAUSED' : 'UNVERIFIED',
      audioActive: decodedAudio && !after.paused && advanced && !after.muted && after.volume > 0,
      audioPlaying: decodedAudio && !after.paused && advanced && !after.muted && after.volume > 0,
      audioAudible: 'UNVERIFIED', verificationScope: 'Same ZERO-owned visible browser HTMLMediaElement state and clock; physical speaker audibility is not measured',
      before, after, clockAdvanced: advanced, message: verified ? `Media ${command} verified on the controlled page.` : `Media ${command} sent; requested outcome is unverified.` };
  }

  async play({ url = '', query = '' } = {}, signal) {
    return this._run('play', signal, async combined => {
      if (!url && !query.trim()) throw new Error('A media URL or search query is required');
      const target = new URL(url || `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`);
      if (!['http:','https:'].includes(target.protocol) || target.username || target.password) throw new Error('Media URL must be HTTP or HTTPS without embedded credentials');
      await this._launch(); combined.throwIfAborted();
      if (!this.page || this.page.isClosed()) this.page = await this.browser.newPage();
      combined.throwIfAborted(); this.effectStarted = true;
      await this.page.bringToFront();
      await this.page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
      combined.throwIfAborted();
      if (!url) {
        const result = this.page.locator('ytd-video-renderer a#video-title[href*="watch?v="]').first();
        await result.waitFor({ state: 'visible', timeout: 15000 });
        await result.click({ timeout: 5000 });
      }
      const media = await this._media(), before = await this._snapshot(media);
      combined.throwIfAborted();
      await media.evaluate(async element => { await element.play(); });
      return this._result('play', 'play', media, before, 'play', combined);
    });
  }

  async control(command, signal) {
    command = String(command || '').toLowerCase();
    if (!commands.has(command)) return { ok: false, executed: false, verified: false, outcome: 'FAILED', error: 'media:unknown-command', message: `Unsupported media command: ${command}` };
    return this._run('media_control', signal, async combined => {
      const media = await this._media(), before = await this._snapshot(media);
      combined.throwIfAborted();
      if (command === 'focus') {
        this.effectStarted = true; await this.page.bringToFront();
        return { ok: true, executed: true, verified: false, completed: false, outcome: 'UNVERIFIED', action: 'media_control', command,
          message: 'Focus request sent to the ZERO-owned media page; OS foreground focus is not independently verified' };
      }
      let expected = command;
      if (['next','next_track','skip','prev','previous'].includes(command)) {
        if (new URL(this.page.url()).hostname !== 'www.youtube.com') throw new Error('Track navigation is supported only on the controlled YouTube player');
        const selector = ['prev','previous'].includes(command) ? '.ytp-prev-button' : '.ytp-next-button';
        this.effectStarted = true;
        await this.page.locator(selector).click({ timeout: 5000 }); expected = 'track';
      } else {
        if (command === 'play_pause') expected = before.paused ? 'play' : 'pause';
        this.effectStarted = true;
        await media.evaluate(async (element, desired) => {
          if (desired === 'play') await element.play();
          if (desired === 'pause') element.pause();
          if (desired === 'mute') element.muted = true;
          if (desired === 'unmute') element.muted = false;
          if (desired === 'volume_up') element.volume = Math.min(1, Math.round((element.volume + 0.1) * 100) / 100);
          if (desired === 'volume_down') element.volume = Math.max(0, Math.round((element.volume - 0.1) * 100) / 100);
          if (desired === 'fullscreen') await element.requestFullscreen();
        }, expected);
      }
      return this._result('media_control', command, await this._media(), before, expected, combined);
    });
  }

  async close() { const browser = this.browser; this.browser = null; this.page = null; await browser?.close(); }
}
