/**
 * Zero Media Control — real working implementation.
 * Controls browser-based media playback (YouTube, HTML5 media elements).
 */

import { setTimeout as delay } from 'node:timers/promises';
import { defaultBrowserAutomation } from './browser-control.mjs';

export const MEDIA_COMMANDS = Object.freeze(['play','pause','play_pause','volume_up','volume_down','set_volume','set_speed','mute','unmute','next','next_track','skip','prev','previous','fullscreen','focus']);
const commands = new Set(MEDIA_COMMANDS);

function settings(options) {
  const volume = options.volume_percent;
  const speed = options.playback_rate;
  if (volume !== undefined && (typeof volume !== 'number' || !Number.isFinite(volume) || volume < 0 || volume > 100)) throw new Error('volume_percent must be a number from 0 to 100');
  if (speed !== undefined && (typeof speed !== 'number' || !Number.isFinite(speed) || speed < 0.25 || speed > 4)) throw new Error('playback_rate must be a number from 0.25 to 4');
  return { volume, speed };
}

/**
 * Controls media on the page of Zero's own browser — the same window and
 * signed-in profile the browser tool uses, so a video opened there can be
 * played, paused, sped up or made full screen.
 */
export class MediaController {
  constructor({ browser = defaultBrowserAutomation } = {}) {
    this.automation = browser;
    this.page = null; this.busy = false;
  }

  /** Attach to the page Zero's browser currently shows (starting it if needed). */
  async _launch() {
    const { page } = await this.automation.ensureConnected();
    this.page = page;
  }

  async _run(action, signal, operation) {
    if (this.busy) return { ok: false, executed: false, verified: false, outcome: 'BLOCKED', error: 'media:busy', message: 'Another media operation is active' };
    this.busy = true;
    this.effectStarted = false;
    const combined = AbortSignal.any([AbortSignal.timeout(45000), ...(signal ? [signal] : [])]);
    const abort = () => {};
    combined.addEventListener('abort', abort, { once: true });
    try { combined.throwIfAborted(); return await operation(combined); }
    catch (error) {
      return { ok: false, executed: this.effectStarted, verified: false, completed: false, outcome: combined.aborted ? 'CANCELLED' : 'FAILED', action,
        error: 'media:execution-failed', message: error.message, audioAudible: 'UNVERIFIED' };
    } finally {
      combined.removeEventListener('abort', abort);
      this.busy = false;
    }
  }

  async _media() {
    if (this.automation.isAlive()) this.page = this.automation.page;
    if (!this.page || this.page.isClosed()) throw new Error("Zero's browser has no page open; open the video with the browser tool first");
    await this.page.locator('video, audio').first().waitFor({ state: 'attached', timeout: 15000 });
    const main = this.page.locator('#movie_player video.html5-main-video');
    if (await main.count() === 1) return main;
    const handles = await this.page.locator('video, audio').elementHandles();
    const candidates = [];
    for (const handle of handles) {
      const info = await handle.evaluate(element => {
        const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
        return { visible: style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0,
          active: !element.paused && !element.ended && !!element.currentSrc };
      });
      if (info.visible) candidates.push({ handle, ...info });
    }
    const active = candidates.filter(candidate => candidate.active);
    if (active.length === 1) return active[0].handle;
    if (candidates.length === 1) return candidates[0].handle;
    throw new Error(candidates.length ? 'Media target is ambiguous: multiple visible players require a main-player target' : 'No visible media player is ready');
  }

  async _snapshot(media) {
    return media.evaluate(element => ({ paused: element.paused, ended: element.ended, currentTime: element.currentTime,
      volume: element.volume, muted: element.muted, readyState: element.readyState, source: element.currentSrc,
      playbackRate: element.playbackRate,
      decodedAudioBytes: typeof element.webkitAudioDecodedByteCount === 'number' ? element.webkitAudioDecodedByteCount : null,
      error: element.error ? { code: element.error.code, message: element.error.message } : null }));
  }

  async _result(action, command, media, before, expected, signal, requested = {}) {
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
    if (expected === 'set_volume') verified = sameSource && Math.abs(after.volume - requested.volume / 100) < 0.0001;
    if (expected === 'set_speed') verified = sameSource && Math.abs(after.playbackRate - requested.speed) < 0.0001;
    if (expected === 'play' && requested.volume !== undefined) verified &&= Math.abs(after.volume - requested.volume / 100) < 0.0001;
    if (expected === 'play' && requested.speed !== undefined) verified &&= Math.abs(after.playbackRate - requested.speed) < 0.0001;
    if (expected === 'track') verified = !!after.source && after.source !== before.source && !after.paused && advanced && !after.error;
    if (expected === 'fullscreen') verified = await media.evaluate(element => !!document.fullscreenElement && document.fullscreenElement.contains(element));
    const advertisement = await this.page.locator('#movie_player.ad-showing, #movie_player.ad-interrupting').count() > 0;
    if (expected === 'play' && advertisement) verified = false;
    return { ok: true, executed: true, verified, completed: verified, outcome: verified ? 'COMPLETED' : 'UNVERIFIED', action, command,
      url: this.page.url(), videoTitle: await this.page.title(), browserOpened: true, pageLoaded: true,
      playbackState: !after.paused && advanced && sameSource ? 'PLAYING' : after.paused ? 'PAUSED' : 'UNVERIFIED',
      audioActive: decodedAudio && !after.paused && advanced && !after.muted && after.volume > 0,
      audioPlaying: decodedAudio && !after.paused && advanced && !after.muted && after.volume > 0,
      audioAudible: 'UNVERIFIED', verificationScope: 'Same ZERO-owned visible browser HTMLMediaElement state and clock; physical speaker audibility is not measured',
      before, after, requested, advertisement, clockAdvanced: advanced, message: verified ? `Media ${command} verified on the controlled page.` : advertisement ? 'An advertisement is playing; requested video playback is not yet verified.' : `Media ${command} sent; requested outcome is unverified.` };
  }

  async play(options = {}, signal) {
    return this._run('play', signal, async combined => {
      let { url = '', query = '' } = options;
      const requested = settings(options);
      const notifications = options.notifications === true || options.notification === true;
      if (!url && !query.trim() && !notifications) throw new Error('A media URL or search query is required');
      let target = new URL(url || `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`);
      if (!['http:','https:'].includes(target.protocol) || target.username || target.password) throw new Error('Media URL must be HTTP or HTTPS without embedded credentials');
      const youtube = /^(www\.|m\.|music\.)?youtube\.com$/.test(target.hostname);
      if (notifications && !youtube) throw new Error('YouTube notification playback requires a YouTube URL or query');
      const search = youtube && !notifications && !(/^\/(watch|shorts\/|embed\/)/.test(target.pathname));
      if (search) target = new URL(`https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim() || target.searchParams.get('search_query') || 'latest official music video')}`);
      await this._launch();
      combined.throwIfAborted(); this.effectStarted = true;
      let notificationSelection = null;
      if (notifications) {
        notificationSelection = await this.automation.openYouTubeNotificationVideo({ query });
        this.page = this.automation.page;
      } else {
        await this.page.bringToFront();
        await this.page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
      }
      combined.throwIfAborted();

      // Ensure Chrome window is immediately brought to foreground of Windows desktop
      await this.automation.bringToForeground();
      if (search) {
        const result = this.page.locator('ytd-video-renderer a#video-title[href*="watch?v="]').first();
        await result.waitFor({ state: 'visible', timeout: 15000 });
        await result.click({ timeout: 5000 });
      }
      let media = await this._media();
      const before = await this._snapshot(media);
      combined.throwIfAborted();
      let started = false;
      for (let attempt = 0; attempt < 5 && !started; attempt++) {
        combined.throwIfAborted();
        started = await media.evaluate(async (element, values) => {
          try { await element.play(); }
          catch (error) { if (error.name === 'AbortError') return false; throw error; }
          if (values.volume !== undefined) element.volume = values.volume / 100;
          if (values.speed !== undefined) element.playbackRate = values.speed;
          return true;
        }, requested);
        if (!started) { await delay(400, undefined, { signal: combined }); media = await this._media(); }
      }
      if (!started) throw new Error('Player source kept changing; requested playback is not verified');
      const adDeadline = Date.now() + 15000;
      let skipSent = false, hadAdvertisement = false;
      while (await this.page.locator('#movie_player.ad-showing, #movie_player.ad-interrupting').count()) {
        hadAdvertisement = true; combined.throwIfAborted();
        if (Date.now() >= adDeadline) break;
        const skip = this.page.locator('.ytp-ad-skip-button, .ytp-skip-ad-button').first();
        if (!skipSent && await skip.isVisible()) { skipSent = true; await skip.click({ timeout: 3000 }); }
        await delay(500, undefined, { signal: combined });
      }
      if (hadAdvertisement && !await this.page.locator('#movie_player.ad-showing, #movie_player.ad-interrupting').count()) {
        media = await this._media();
        await media.evaluate(async (element, values) => {
          await element.play();
          if (values.volume !== undefined) element.volume = values.volume / 100;
          if (values.speed !== undefined) element.playbackRate = values.speed;
        }, requested);
      }
      const result = await this._result('play', 'play', media, before, 'play', combined, requested);
      if (!notificationSelection) return result;
      const fromNotification = notificationSelection.source === 'notification';
      // A video picked from the home page or a search is not a notification
      // video. The result must say so, so the owner is told what really played.
      const notSignedIn = notificationSelection.fallbackReason === 'notifications-bell-unavailable';
      return {
        ...result,
        notificationSelection: notificationSelection.source,
        fromNotification,
        ...(fromNotification ? {} : {
          notificationFallbackReason: notificationSelection.fallbackReason,
          ...(notSignedIn ? { signInRequired: true } : {}),
          message: (notSignedIn
            ? "No notification video could be opened: YouTube shows no notifications bell, so the owner is not signed in to YouTube in Zero's browser. "
            : 'No notification video could be opened: the notifications list had no video. ')
            + `A video from ${notificationSelection.source === 'search-fallback' ? 'a search' : 'the YouTube home page'} was played instead ("${result.videoTitle}"). Tell the owner this was not a notification video`
            + (notSignedIn ? ', and that signing in once in the Zero browser window fixes it.' : '.'),
        }),
      };
    });
  }

  async control(command, signal, options = {}) {
    command = String(command || '').toLowerCase();
    if (!commands.has(command)) return { ok: false, executed: false, verified: false, outcome: 'FAILED', error: 'media:unknown-command', message: `Unsupported media command: ${command}` };
    return this._run('media_control', signal, async combined => {
      const requested = settings(options);
      if (command === 'set_volume' && requested.volume === undefined) throw new Error('set_volume requires volume_percent');
      if (command === 'set_speed' && requested.speed === undefined) throw new Error('set_speed requires playback_rate');
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
        await media.evaluate(async (element, { desired, values }) => {
          if (desired === 'play') await element.play();
          if (desired === 'pause') element.pause();
          if (desired === 'mute') element.muted = true;
          if (desired === 'unmute') element.muted = false;
          if (desired === 'volume_up') element.volume = Math.min(1, Math.round((element.volume + 0.1) * 100) / 100);
          if (desired === 'volume_down') element.volume = Math.max(0, Math.round((element.volume - 0.1) * 100) / 100);
          if (desired === 'set_volume') element.volume = values.volume / 100;
          if (desired === 'set_speed') element.playbackRate = values.speed;
          if (desired === 'fullscreen') await element.requestFullscreen().catch(() => {});
        }, { desired: expected, values: requested });
        if (command === 'fullscreen' && !await media.evaluate(element => Boolean(document.fullscreenElement && document.fullscreenElement.contains(element)))) {
          const fullscreenButton = this.page.locator('.ytp-fullscreen-button').first();
          if (await fullscreenButton.isVisible().catch(() => false)) {
            await fullscreenButton.click({ timeout: 5000 });
          } else {
            await this.page.keyboard.press('f');
          }
        }
      }
      return this._result('media_control', command, await this._media(), before, expected, combined, requested);
    });
  }

  /** The browser belongs to the browser tool; only detach from it. */
  async close() { this.page = null; }
}

export const defaultMediaController = new MediaController();
