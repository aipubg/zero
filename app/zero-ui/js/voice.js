// Voice in the browser: speech-to-text from the microphone and reading
// replies aloud. Falls back to Windows speech on the host for speaking.
import { call } from './rpc.js';
import { look } from './theme.js';

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = Boolean(Recognition);
export const canSpeak = 'speechSynthesis' in window;

let active = null;

/** Listen once. onText(partial, final) is called as words arrive. Resolves with the final text. */
export function listen({ lang = 'hi-IN', onText } = {}) {
  if (!Recognition) return Promise.reject(new Error('This browser has no speech recognition (use Chrome or Edge).'));
  stopListening();
  return new Promise((resolve, reject) => {
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = '';
    rec.onresult = event => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      onText?.(finalText + interim, false);
    };
    rec.onerror = event => { active = null; if (event.error === 'no-speech' || event.error === 'aborted') resolve(finalText.trim()); else reject(new Error('Microphone: ' + event.error)); };
    rec.onend = () => { active = null; onText?.(finalText, true); resolve(finalText.trim()); };
    active = rec;
    rec.start();
  });
}

export function stopListening() {
  if (active) { try { active.stop(); } catch {} active = null; }
}

export const isListening = () => Boolean(active);

export function voices() {
  return canSpeak ? speechSynthesis.getVoices() : [];
}

function plain(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/[*_`#>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, 'link')
    .slice(0, 1200);
}

export async function speak(text) {
  const words = plain(text);
  if (!words.trim()) return;
  if (canSpeak && voices().length) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(words);
    const chosen = voices().find(v => v.name === look.voiceName);
    if (chosen) { u.voice = chosen; u.lang = chosen.lang; }
    else if (/[ऀ-ॿ]/.test(words)) u.lang = 'hi-IN';
    speechSynthesis.speak(u);
    return;
  }
  await call('voice.speak', { text: words }).catch(() => {});
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}

if (canSpeak) speechSynthesis.onvoiceschanged = () => {};
