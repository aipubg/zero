// Look-and-feel settings. Kept in this browser (localStorage) and mirrored to
// the host's user preferences so another browser on this PC picks them up.
import { call } from './rpc.js';

const KEY = 'zero-ui-look-v1';

export const PRESETS = {
  Aurora: { a: '#5eead4', b: '#a78bfa', bg: '#0b0f17' },
  Ember: { a: '#fdba74', b: '#f472b6', bg: '#120d0e' },
  Glacier: { a: '#7dd3fc', b: '#86efac', bg: '#0a1016' },
  Dusk: { a: '#e879f9', b: '#fb923c', bg: '#110c16' },
  Matrix: { a: '#4ade80', b: '#22d3ee', bg: '#070d0a' },
  Gold: { a: '#facc15', b: '#f97316', bg: '#100e08' },
  Mono: { a: '#e5e7eb', b: '#9ca3af', bg: '#0c0c0d' },
};

export const DEFAULTS = {
  mode: 'dark',          // dark | light | auto
  preset: 'Aurora',
  a: PRESETS.Aurora.a,
  b: PRESETS.Aurora.b,
  fontScale: 100,        // percent
  density: 'comfortable',// comfortable | compact
  radius: 14,            // px
  background: 'aurora',  // aurora | grid | plain | photo
  photo: '',             // data URL (small, used as wallpaper)
  glass: true,
  motion: true,
  orb: true,
  sidebar: 'full',       // full | icons
  font: 'Inter',         // Inter | System | Mono
  speakReplies: false,
  voiceName: '',
  sendOnEnter: true,
  name: 'Owner',
};

export const look = { ...DEFAULTS, ...read() };

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

let syncTimer = null;
export function saveLook(patch = {}) {
  Object.assign(look, patch);
  try { localStorage.setItem(KEY, JSON.stringify(look)); } catch {}
  applyLook();
  clearTimeout(syncTimer);
  const { photo, ...shared } = look; // the wallpaper stays local: it can be large
  syncTimer = setTimeout(() => call('users.prefs.set', { key: 'zeroUi', value: shared, prefs: { zeroUi: shared } }).catch(() => {}), 800);
}

export async function loadSharedLook() {
  try {
    const result = await call('users.prefs.get', {});
    const shared = result?.prefs?.zeroUi;
    if (shared && typeof shared === 'object' && !localStorage.getItem(KEY)) {
      Object.assign(look, shared);
      applyLook();
    }
  } catch {}
}

function hexToRgb(hex) {
  const m = String(hex).replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? m.slice(1).map(x => parseInt(x, 16)) : [94, 234, 212];
}

export function applyLook() {
  const root = document.documentElement;
  const dark = look.mode === 'dark' || (look.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.mode = dark ? 'dark' : 'light';
  root.dataset.density = look.density;
  root.dataset.bg = look.background;
  root.dataset.glass = look.glass ? 'on' : 'off';
  root.dataset.motion = look.motion ? 'on' : 'off';
  root.dataset.sidebar = look.sidebar;
  root.dataset.font = look.font;
  const [ar, ag, ab] = hexToRgb(look.a), [br, bg, bb] = hexToRgb(look.b);
  root.style.setProperty('--a', look.a);
  root.style.setProperty('--b', look.b);
  root.style.setProperty('--a-rgb', `${ar},${ag},${ab}`);
  root.style.setProperty('--b-rgb', `${br},${bg},${bb}`);
  root.style.setProperty('--radius', look.radius + 'px');
  root.style.setProperty('--font-scale', look.fontScale / 100);
  const preset = PRESETS[look.preset];
  root.style.setProperty('--bg-tint', dark ? (preset?.bg || '#0b0f17') : '#f5f7fb');
  root.style.setProperty('--wallpaper', look.background === 'photo' && look.photo ? `url("${look.photo}")` : 'none');
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (look.mode === 'auto') applyLook(); });

/** Two well separated colours from a photo, plus a small wallpaper copy. */
export async function paletteFromPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, 64, 64);
  const data = ctx.getImageData(0, 0, 64, 64).data;
  const bins = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(...rgb), min = Math.min(...rgb);
    const saturation = max ? (max - min) / max : 0;
    if (max < 40) continue; // skip near-black
    const key = rgb.map(x => x >> 5).join(',');
    const bin = bins.get(key) || { rgb: [0, 0, 0], n: 0, weight: 0 };
    bin.rgb = bin.rgb.map((v, j) => v + rgb[j]);
    bin.n++;
    bin.weight += 1 + saturation * 3;
    bins.set(key, bin);
  }
  const sorted = [...bins.values()].map(b => ({ rgb: b.rgb.map(v => Math.round(v / b.n)), weight: b.weight })).sort((x, y) => y.weight - x.weight);
  if (!sorted.length) throw new Error('No usable colours in this image');
  const first = sorted[0].rgb;
  const distance = c => Math.hypot(...c.rgb.map((v, i) => v - first[i]));
  const second = (sorted.find(c => distance(c) > 90) || { rgb: first.map(v => 255 - v) }).rgb;
  const lift = rgb => '#' + rgb.map(v => Math.min(255, Math.round(70 + v * 0.75)).toString(16).padStart(2, '0')).join('');
  // Wallpaper: a reduced JPEG so it fits in local storage.
  const wall = document.createElement('canvas');
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  wall.width = Math.round(bitmap.width * scale);
  wall.height = Math.round(bitmap.height * scale);
  wall.getContext('2d').drawImage(bitmap, 0, 0, wall.width, wall.height);
  bitmap.close();
  return { a: lift(first), b: lift(second), photo: wall.toDataURL('image/jpeg', 0.72) };
}

applyLook();
