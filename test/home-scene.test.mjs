import test from 'node:test';
import assert from 'node:assert/strict';
import { startScene } from '../app/zero-control-ui/src/home-screen.js';

test('home animation handles missing canvas, zero size, height-only resize and disposal', () => {
  assert.equal(typeof startScene({ getContext: () => null }, { getContext: () => null }), 'function');
  let next, cancelled = false, height = 100, width = 200, clears = 0;
  globalThis.document = { hidden: false };
  globalThis.requestAnimationFrame = fn => { next = fn; return 1; };
  globalThis.cancelAnimationFrame = () => { cancelled = true; };
  const context = new Proxy({}, { get: (_, key) => key === 'createRadialGradient'
    ? () => ({ addColorStop() {} }) : key === 'clearRect' ? () => clears++ : () => {} });
  const canvas = () => ({ width: 0, height: 0, getContext: () => context, getBoundingClientRect: () => ({ width, height }) });
  const particles = canvas(), wave = canvas();
  const dispose = startScene(particles, wave, () => 0, () => 'mic-off');
  assert.equal(particles.height, 100);
  height = 80; next(16);
  assert.equal(particles.height, 80);
  width = 0; height = 0; const before = clears; next(32);
  assert.equal(clears, before);
  width = 200; height = 100; next(48);
  assert.ok(clears > before);
  dispose(); assert.equal(cancelled, true);
});
