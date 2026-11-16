import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserAutomationEngine } from '../packages/capability-engine/browser-control.mjs';

function createBrowser({ bellVisible, notificationVisible }) {
  const navigations = [];
  const page = {
    currentUrl: '',
    url() { return this.currentUrl; },
    async title() { return 'YouTube video'; },
    async waitForLoadState() {},
    locator(selector) {
      const locator = {
        first() { return this; },
        async isVisible() {
          if (selector.includes('Notifications')) return bellVisible;
          if (selector.includes('ytd-notification-renderer')) return notificationVisible;
          return true;
        },
        async waitFor({ state } = {}) {
          if (state === 'visible' && !await this.isVisible()) throw new Error('Element not visible');
        },
        async click() {
          if (selector.includes('ytd-notification-renderer')) {
            page.currentUrl = 'https://www.youtube.com/watch?v=notification-video';
          } else if (page.currentUrl.includes('/results?')) {
            page.currentUrl = 'https://www.youtube.com/watch?v=search-video';
          } else {
            page.currentUrl = 'https://www.youtube.com/watch?v=home-video';
          }
        },
      };
      return locator;
    },
  };
  const browser = new BrowserAutomationEngine();
  browser.page = page;
  browser.navigate = async url => {
    navigations.push(url);
    page.currentUrl = url;
    return { ok: true, url };
  };
  return { browser, page, navigations };
}

test('YouTube notification selection falls back to a playable home video', async () => {
  const { browser, navigations } = createBrowser({ bellVisible: false, notificationVisible: false });

  const result = await browser.openYouTubeNotificationVideo();

  assert.equal(result.source, 'home-fallback');
  assert.match(result.url, /home-video$/);
  assert.deepEqual(navigations, ['https://www.youtube.com']);
});

test('empty YouTube notifications fall back to the first search video', async () => {
  const { browser, navigations } = createBrowser({ bellVisible: true, notificationVisible: false });

  const result = await browser.openYouTubeNotificationVideo({ query: 'music' });

  assert.equal(result.source, 'search-fallback');
  assert.match(result.url, /search-video$/);
  assert.equal(navigations.length, 2);
  assert.match(navigations[1], /results\?search_query=music$/);
});

test('available YouTube notification video is selected before fallback', async () => {
  const { browser, navigations } = createBrowser({ bellVisible: true, notificationVisible: true });

  const result = await browser.openYouTubeNotificationVideo();

  assert.equal(result.source, 'notification');
  assert.match(result.url, /notification-video$/);
  assert.deepEqual(navigations, ['https://www.youtube.com']);
});
