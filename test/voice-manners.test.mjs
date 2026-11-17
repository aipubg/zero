import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser stand-ins: a button, a recognizer we can drive, a synthesizer we can watch.
function fakeElement() {
  const el = new EventTarget();
  Object.assign(el, {
    dataset: {}, style: { setProperty() {} }, classList: { add() {} }, isConnected: true, disabled: false,
    textContent: '', title: '', attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; }, replaceChildren() {}, append() {},
  });
  return el;
}

function setupBrowser() {
  const spoken = [];
  let cancelled = 0;
  let current = null;
  globalThis.document = { createElement: () => fakeElement() };
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  class Recognizer {
    constructor() { Recognizer.last = this; this.started = false; }
    start() { this.started = true; }
    stop() { this.started = false; }
  }
  const synth = {
    speak(u) { spoken.push(u.text); current = u; },
    cancel() { cancelled++; const u = current; current = null; u?.onend?.(); },
    getVoices: () => [],
  };
  globalThis.window = {
    SpeechRecognition: Recognizer, speechSynthesis: synth,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    setTimeout, clearTimeout,
  };
  const hear = (text, isFinal = true) => Recognizer.last.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal })] });
  return { spoken, hear, recognizer: () => Recognizer.last, cancelled: () => cancelled, finishSpeech: () => { const u = current; current = null; u?.onend?.(); }, speaking: () => Boolean(current) };
}

test('voice manners: short replies, stop when interrupted, ignore own voice, mic off', async t => {
  const b = setupBrowser();
  const sent = [];
  const host = {
    isConnected: () => true,
    sessions: { selectedKey: 'chat-test' },
    async request(method, params) {
      if (method === 'chat.send') { sent.push(params.message); return { content: 'Notepad is open and in front. I typed your list with three items. You can save it with Ctrl+S anytime you like.\n\n- milk\n- eggs' }; }
      if (method === 'voice.status') return { status: 'READY', sessions: [] };
      return { ok: true };
    },
  };
  const { mountVoiceControl } = await import('../app/zero-control-ui/src/voice-control.js');
  const button = fakeElement();
  const dispose = mountVoiceControl(button, host);
  t.after(() => dispose());
  const tick = ms => new Promise(r => setTimeout(r, ms));

  await button.zeroVoice.start();
  assert.equal(button.zeroVoice.active, true);
  assert.equal(b.recognizer().started, true);

  // 1. The owner speaks: after a short pause the words go to Zero.
  b.hear('open notepad and write my list');
  await tick(1400);
  assert.deepEqual(sent, ['open notepad and write my list']);
  await tick(50);
  assert.equal(b.spoken.length, 1);
  assert.equal(b.spoken[0], 'Notepad is open and in front. I typed your list with three items. The rest is on screen.', 'only the useful lead is spoken');
  assert.equal(b.speaking(), true);

  // 2. Zero hears its own voice: ignored, still speaking.
  b.hear('notepad is open and in front');
  assert.equal(b.speaking(), true, 'its own words do not interrupt it');

  // 3. The owner says "ruko": Zero stops and nothing is sent.
  b.hear('ruko');
  assert.equal(b.speaking(), false, 'stop word ends speech');
  await tick(1400);
  assert.equal(sent.length, 1, '"stop" is not sent to the model');

  // 4. Owner talks over Zero with a new request: speech stops, request is kept.
  b.hear('what time is it');
  await tick(1400);
  assert.deepEqual(sent.slice(-1), ['what time is it']);
  await tick(50);
  b.hear('tell me something else instead');
  assert.equal(b.speaking(), false, 'talking over Zero stops it');
  await tick(1400);
  assert.deepEqual(sent.slice(-1), ['tell me something else instead']);
  b.finishSpeech();

  // 5. Mic off: recognition stops and stays stopped; nothing is heard.
  button.zeroVoice.mute();
  assert.equal(button.zeroVoice.muted, true);
  assert.equal(b.recognizer().started, false);
  assert.equal(button.dataset.voiceState, 'mic-off');
  const before = sent.length;
  b.recognizer().onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: 'secret words' }], { isFinal: true })] });
  await tick(1400);
  assert.equal(sent.length, before, 'with the mic off nothing reaches Zero');
  button.zeroVoice.unmute();
  assert.equal(b.recognizer().started, true, 'mic on listens again');
});
