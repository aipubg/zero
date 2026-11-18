import test from 'node:test';
import assert from 'node:assert/strict';
import { installGuaranteedChatComposer } from '../app/zero-control-ui/src/zero-chat-dock.js';

function setup(path) {
  let tick;
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.style = {}; }
    get isConnected() { return this === body || Boolean(this.parentElement?.isConnected); }
    append(...nodes) { for (const n of nodes) this.appendChild(n); }
    appendChild(n) { n.remove(); this.children.push(n); n.parentElement = this; }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(n => n !== this); this.parentElement = null; }
    closest(selector) { return selector === '.zero-chat-dock' && this.className === 'zero-chat-dock' ? this : this.parentElement?.closest(selector); }
    setAttribute() {} addEventListener() {} removeEventListener() {}
    getBoundingClientRect() { return { width: 600, height: 400, top: 0, bottom: 400 }; }
  }
  const body = new Element('body'), main = new Element('main'); body.append(main);
  const descendants = el => el.children.flatMap(c => [c, ...descendants(c)]);
  globalThis.document = { body, hidden: false, createElement: tag => new Element(tag),
    querySelector: () => main, querySelectorAll: () => descendants(body).filter(el => el.tag === 'textarea') };
  globalThis.window = { location: { pathname: path }, innerHeight: 900,
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' }),
    setTimeout: fn => { tick = fn; return 1; }, clearTimeout() {} };
  let requests = 0;
  const dispose = installGuaranteedChatComposer({ request: async () => { requests++; return {}; } });
  return { main, Element, dispose, tick: () => tick(), requests: () => requests };
}

test('dashboard routes never mount or fetch a recovery chat', () => {
  for (const path of ['/dashboards', '/dashboard/zero']) {
    const s = setup(path);
    for (let i = 0; i < 40; i++) s.tick();
    assert.equal(s.main.children.length, 0); assert.equal(s.requests(), 0); s.dispose();
  }
});

test('fallback stays mounted across watchdog ticks and yields only to a native composer', () => {
  const s = setup('/chat/zero'); const dock = s.main.children[0];
  for (let i = 0; i < 40; i++) s.tick();
  assert.equal(s.main.children[0], dock); assert.equal(s.requests(), 1);
  s.main.append(new s.Element('textarea')); s.tick();
  assert.equal(dock.isConnected, false);
  s.dispose();
});

test('leaving chat for dashboards removes the fallback and keeps it removed', () => {
  const s = setup('/chat/zero');
  window.location.pathname = '/dashboards';
  for (let i = 0; i < 40; i++) s.tick();
  assert.equal(s.main.children.length, 0); assert.equal(s.requests(), 1); s.dispose();
});
