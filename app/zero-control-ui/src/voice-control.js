/**
 * Zero toolbar voice control — complete two-way conversation pipeline.
 *
 * Listen -> Transcribe -> Agent Reply -> Speak Aloud
 *
 * 1. ASR (speech-to-text)
 *    - Primary: browser SpeechRecognition / webkitSpeechRecognition with
 *      continuous=true and interimResults=true (English + Hindi supported).
 *      Interim words are shown live in the toolbar pill.
 *    - Fallback: the Zero backend VAD + Windows System Speech recognizer
 *      (packages/voice-engine) drives the turn when the browser API is
 *      unavailable or denied.
 * 2. Auto-send: a final transcript (or 1.2s of silence after speech) is
 *    submitted to the active session through chat.send, which renders the
 *    user bubble and produces the assistant reply.
 * 3. TTS (text-to-speech): the reply is spoken out loud with
 *    window.speechSynthesis, falling back to the backend Windows SAPI
 *    synthesizer (voice.speak) when browser speech is muted or missing.
 *    The badge shows "Voice: Speaking..." while talking and returns to
 *    "Voice: Listening" afterwards so hands-free conversation continues.
 */

/** Strip interactive card payloads; they are presentation data, not prose. */
function speakableText(value) {
  return String(value || '')
    .replace(/```zero-ui:[\s\S]*?```/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const DEVANAGARI = /[ऀ-ॿ]/;

/**
 * What Zero says out loud: only the useful lead of the reply, not the whole
 * text. Code, tables, links and lists stay on screen; one or two short
 * sentences are spoken, and a long reply ends with "the rest is on screen".
 */
export function voiceSummary(value) {
  const full = String(value || '');
  const text = full
    .replace(/```[\s\S]*?```/g, ' ')                       // code and cards
    .replace(/^\s*\|.*\|\s*$/gm, ' ')                      // table rows
    .replace(/^\s*#{1,6}\s+/gm, '')                         // heading marks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')                  // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')                // links -> their text
    .replace(/https?:\/\/\S+/g, ' ')                        // bare URLs
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~>#]/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ') // emoji
    .replace(/^\s*(\d+[.)]|[-•])\s+.*$/gm, ' ')             // list items stay on screen
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  const sentences = text.split(/(?<=[.!?।])\s+/).map(s => s.trim()).filter(Boolean);
  let spoken = '';
  for (const sentence of sentences) {
    if (spoken && (spoken.length + sentence.length > 220 || spoken.split(/(?<=[.!?।])\s+/).length >= 2)) break;
    spoken = spoken ? `${spoken} ${sentence}` : sentence;
  }
  if (spoken.length > 260) spoken = spoken.slice(0, 260).replace(/\s+\S*$/, '') + '…';
  const leftOver = text.length - spoken.length > 80 || /```|^\s*\|/m.test(full) || /^\s*(\d+[.)]|[-•*])\s+/m.test(full);
  if (leftOver) spoken += DEVANAGARI.test(spoken) ? ' बाकी जानकारी स्क्रीन पर है।' : ' The rest is on screen.';
  return spoken;
}

/** Words that mean "stop talking" (English, Hinglish and Hindi). */
const STOP_WORDS = /\b(stop|wait|enough|quiet|shut up|ruko|ruk jao|bas|chup|chup raho|thehro|ek minute)\b|रुको|रुक जाओ|बस|चुप|ठहरो|एक मिनट/i;

/** True when what the microphone heard is Zero's own voice coming back. */
function isEcho(heard, spokenText) {
  const words = String(heard || '').toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
  if (!words.length || !spokenText) return false;
  const said = new Set(String(spokenText).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);
  return words.filter(word => said.has(word)).length / words.length >= 0.6;
}

export function mountVoiceControl(button, host) {
  let disposed = false;
  let timer;
  let refreshPending = false;
  let microphoneSession;
  let busy = false;
  let failure = null;
  let active = false;
  let generation = 0;
  let speaking = false;
  let interimText = '';
  let finalBuffer = '';
  let silenceTimer = null;
  let recognition = null;
  let browserAsr = false;
  let muted = false;             // mic switched off by the owner
  let currentProse = '';         // what Zero is saying right now (echo filter)
  let cancelSpeech = null;       // ends the current utterance early
  let lang = 'en-IN';
  try { lang = localStorage.getItem('zero-voice-lang') || 'en-IN'; } catch {}
  const emit = (name, detail = {}) => { try { button.dispatchEvent(new CustomEvent(`zero-voice:${name}`, { detail })); } catch {} };

  button.classList.add('zero-voice-control');
  const meter = document.createElement('span');
  meter.className = 'zero-voice-meter'; meter.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 5; index++) { const bar = document.createElement('i'); bar.style.setProperty('--bar', String(index)); meter.append(bar); }
  const label = document.createElement('span');
  button.replaceChildren(meter, label);
  button.setAttribute('aria-live', 'polite');

  const isConnected = () => typeof host?.isConnected === 'function'
    ? host.isConnected()
    : host?.connection?.connected !== false;

  const sessionKey = () => {
    const key = host?.sessions?.selectedKey;
    return typeof key === 'string' && key.trim() ? key.trim() : 'agent:zero:main';
  };

  const render = (text, isListening = false, capture = null, sessionState = null) => {
    const fresh = isListening && Number.isFinite(capture?.lastFrameAt) && Date.now() - capture.lastFrameAt < 3000;
    let voiceState = 'idle';

    if (failure) {
      voiceState = 'error';
    } else if (!isConnected()) {
      voiceState = 'disconnected';
    } else if (speaking) {
      // When the browser drives the turn it also owns the speaking badge, so
      // the server's session phase must not keep it stuck on "Speaking".
      voiceState = 'speaking';
    } else if (!browserAsr && (sessionState?.playbackActive || sessionState?.state === 'speaking')) {
      voiceState = 'speaking';
    } else if (!browserAsr && (sessionState?.transcriptionActive || sessionState?.state === 'transcribing')) {
      voiceState = 'transcribing';
    } else if (sessionState?.muted) {
      voiceState = 'muted';
    } else if (isListening) {
      voiceState = fresh ? 'listening' : 'waiting';
    }

    if (muted && voiceState !== 'speaking' && voiceState !== 'error' && voiceState !== 'disconnected') voiceState = 'mic-off';
    const changed = button.dataset.voiceState !== voiceState;
    button.dataset.voiceState = voiceState;
    if (changed) emit('state', { state: voiceState });
    if (voiceState === 'mic-off') { button.style.setProperty('--zero-mic-level', '0'); button.title = 'Turn the microphone on'; label.textContent = 'Voice: Mic off'; button.setAttribute('aria-pressed', 'false'); return; }

    if (voiceState === 'speaking') {
      label.textContent = 'Voice: Speaking...';
    } else if (voiceState === 'transcribing') {
      label.textContent = 'Voice: Transcribing';
    } else if (voiceState === 'error') {
      label.textContent = `Voice: Error (${failure})`;
    } else if (voiceState === 'disconnected') {
      label.textContent = 'Voice: Disconnected';
    } else if (voiceState === 'muted') {
      label.textContent = 'Voice: Muted';
    } else if (interimText) {
      // Live interim recognition words so the user can see speech being read.
      label.textContent = `Voice: ${interimText.slice(0, 48)}`;
    } else if (voiceState === 'listening') {
      label.textContent = 'Voice: Listening';
    } else if (voiceState === 'waiting') {
      label.textContent = 'Voice: Waiting for audio';
    } else {
      label.textContent = text;
    }

    const rms = Number(capture?.lastFrameRms);
    const level = fresh && Number.isFinite(rms) ? Math.min(1, Math.max(0, rms / 6000)) : 0;
    button.style.setProperty('--zero-mic-level', String(level));
    button.setAttribute('aria-pressed', String(isListening));
    button.title = isListening
      ? (fresh ? 'Microphone is receiving live audio. Click to stop.' : 'Microphone started; waiting for audio frames. Click to stop.')
      : 'Start voice in the selected chat';
  };

  const request = async (method, params = {}) => {
    const response = await host.request(method, params);
    const result = response?.result ?? response;
    if (result?.ok === false) throw new Error(result.error || 'Voice request failed');
    return result;
  };

  // ---------------------------------------------------------------- speech out
  const speak = async (text) => {
    // Only the useful lead of the reply is spoken; the full reply is in chat.
    const prose = voiceSummary(text);
    if (!prose || disposed || !active) return;
    speaking = true;
    currentProse = prose;
    emit('speak', { text: prose, full: String(text || '') });
    render('Voice: Speaking...', active, null, null);
    try {
      const synth = window.speechSynthesis;
      if (synth && typeof window.SpeechSynthesisUtterance === 'function') {
        await new Promise((resolve) => {
          let settled = false, watchdog;
          const done = () => { if (settled) return; settled = true; clearTimeout(watchdog); cancelSpeech = null; resolve(); };
          const utterance = new window.SpeechSynthesisUtterance(prose);
          utterance.lang = DEVANAGARI.test(prose) ? 'hi-IN' : lang;
          const voice = synth.getVoices?.().find(v => v.lang === utterance.lang) || synth.getVoices?.().find(v => v.lang?.startsWith(utterance.lang.slice(0, 2)));
          if (voice) utterance.voice = voice;
          utterance.rate = 1.05;
          utterance.onend = done;
          utterance.onerror = done;
          // Each word drives the character's mouth and the sound wave.
          utterance.onboundary = event => emit('word', { index: event.charIndex, length: event.charLength || 4 });
          cancelSpeech = () => { try { synth.cancel(); } catch {} done(); };
          try { synth.cancel(); synth.speak(utterance); } catch { done(); }
          // Never let a stuck synthesizer block the conversation loop.
          if (!settled) watchdog = setTimeout(() => { try { synth.cancel(); } catch {} done(); }, Math.min(60000, 2500 + prose.length * 90));
        });
      } else {
        await request('voice.speak', { text: prose, sessionId: sessionKey() });
      }
    } catch (error) {
      failure = error.message;
    } finally {
      speaking = false;
      currentProse = '';
      emit('quiet');
      // Re-render immediately so the badge leaves "Speaking..." without
      // waiting for the next status poll.
      if (!disposed && button.isConnected) render('Voice: READY', active, null, null);
    }
  };

  // --------------------------------------------------------------- speech in
  const recognitionCtor = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;

  const startRecognition = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return false;
    if (recognition) return true;
    try {
      recognition = new Ctor();
    } catch {
      recognition = null;
      return false;
    }
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.onresult = (event) => {
      if (muted || disposed || !active) return;
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = (result?.[0]?.transcript || '').trim();
        if (!chunk) continue;
        if (speaking) {
          // Basic manners: when the owner talks, Zero stops talking.
          if (STOP_WORDS.test(chunk)) {
            cancelSpeech?.();
            finalBuffer = '';
            interimText = '';
            emit('interrupted', { by: 'stop-word', text: chunk });
            render('Voice: Listening', active, null, null);
            return;
          }
          if (isEcho(chunk, currentProse)) continue;   // Zero hearing itself
          if ((chunk.match(/[\p{L}\p{N}]+/gu) || []).length >= 2) {
            cancelSpeech?.();
            emit('interrupted', { by: 'speech', text: chunk });
          } else continue;
        }
        if (result.isFinal) finalBuffer = `${finalBuffer} ${chunk}`.trim();
        else interim += `${chunk} `;
      }
      interimText = interim.trim();
      if (interimText || finalBuffer) emit('heard', { text: `${finalBuffer} ${interimText}`.trim() });
      if (finalBuffer.trim()) scheduleSend();
      render('Voice: READY', active, null, null);
    };
    recognition.onerror = (event) => {
      const code = event?.error || 'unknown';
      if (code === 'no-speech' || code === 'aborted') return;
      failure = code === 'not-allowed' ? 'microphone permission denied' : code;
      browserAsr = false;
    };
    recognition.onend = () => {
      recognition = null;
      // Chrome ends the recognizer periodically; restart it while active
      // (but never while the owner has switched the mic off).
      if (!disposed && active && browserAsr && !muted) {
        setTimeout(() => { if (!disposed && active && browserAsr && !muted) startRecognition(); }, 250);
      }
    };
    try {
      recognition.start();
      browserAsr = true;
      return true;
    } catch {
      recognition = null;
      browserAsr = false;
      return false;
    }
  };

  const stopRecognition = () => {
    browserAsr = false;
    if (recognition) {
      recognition.onend = null; recognition.onresult = null; recognition.onerror = null;
      try { recognition.abort ? recognition.abort() : recognition.stop(); } catch {}
      recognition = null;
    }
  };

  // ------------------------------------------------------------------- send
  const scheduleSend = () => {
    window.clearTimeout(silenceTimer);
    // 1.2s of silence after speech finalises the utterance.
    silenceTimer = window.setTimeout(() => { void sendVoiceMessage(); }, 1200);
  };

  const sendVoiceMessage = async () => {
    const text = finalBuffer.trim();
    finalBuffer = '';
    interimText = '';
    if (!text || disposed || muted || !active) return;
    // A bare "stop" is a request to be quiet, not a message for the model.
    if (STOP_WORDS.test(text) && text.split(/\s+/).length <= 3) { emit('interrupted', { by: 'stop-word', text }); return; }
    const turnGeneration = generation;
    const turnSession = microphoneSession || sessionKey();
    try {
      label.textContent = 'Voice: Thinking...';
      button.dataset.voiceState = 'thinking';
      emit('state', { state: 'thinking' });
      emit('sent', { text });
      const reply = await request('chat.send', { sessionKey: turnSession, message: text });
      if (disposed || !active || turnGeneration !== generation) return;
      const content = reply?.content || reply?.text || reply?.message || '';
      if (speakableText(content)) await speak(content);
    } catch (error) {
      failure = error.message;
      render(`Voice: ${error.message}`, active, null, null);
    }
  };

  // ------------------------------------------------------------ server turn
  // When the browser recognizer is unavailable the backend owns the turn:
  // VAD -> Windows SAPI recognition -> agent -> SAPI playback.
  const onServerTurnComplete = (payload) => {
    if (!payload || disposed || !active || (payload.sessionId && payload.sessionId !== microphoneSession)) return;
    const text = speakableText(payload.content || '');
    if (!text) return;
    if (payload.played) {
      // Completion means playback has finished; status polling tracks live output.
      speaking = false;
      emit('quiet');
      render('Voice: Listening', active, null, null);
      return;
    }
    void speak(text);
  };

  const onServerTranscript = (payload) => {
    if (!payload || disposed || !active || (payload.sessionId && payload.sessionId !== microphoneSession)) return;
    const text = String(payload.text || '').trim();
    if (!text) return;
    interimText = text.slice(0, 48);
    render('Voice: READY', active, null, null);
  };

  const onServerTurnError = (payload) => {
    if (!payload || disposed || !active || (payload.sessionId && payload.sessionId !== microphoneSession)) return;
    failure = payload.error || 'voice turn failed';
    render(`Voice: ${failure}`, active, null, null);
  };

  const disposers = [];
  if (typeof host?.onEvent === 'function') {
    try { disposers.push(host.onEvent('voice.turn-complete', onServerTurnComplete)); } catch {}
    try { disposers.push(host.onEvent('voice.transcript', onServerTranscript)); } catch {}
    try { disposers.push(host.onEvent('voice.turn-error', onServerTurnError)); } catch {}
  }

  // ------------------------------------------------------------------ status
  const refresh = async () => {
    if (refreshPending || disposed) return;
    refreshPending = true;
    try {
      const status = await request('voice.status');
      if (disposed || !button.isConnected || busy) return;
      const session = status.sessions?.find(entry => entry.sessionId === (microphoneSession || sessionKey()));
      if (!active) render(`Voice: ${failure || status.status || 'READY'}`, false, session?.capture, session);
      else render('Voice: READY', true, session?.capture, session);
    } catch (error) {
      if (!disposed && !busy) { failure = error.message || 'Voice unavailable'; render('Voice: Unavailable', false, null, { state: 'disconnected' }); }
    } finally {
      refreshPending = false;
      if (!disposed && button.isConnected) timer = window.setTimeout(refresh, active ? 250 : 2000);
    }
  };

  const click = async () => {
    if (busy || disposed) return;
    busy = true; button.disabled = true;
    const stopping = active;
    generation++;
    render(stopping ? 'Voice: Stopping…' : 'Voice: Starting…');
    try {
      if (stopping) {
        active = false;
        cancelSpeech?.();
        finalBuffer = ''; interimText = '';
        stopRecognition();
        window.clearTimeout(silenceTimer);
        await request('voice.microphone.stop', { sessionId: microphoneSession || sessionKey() });
        microphoneSession = null;
        failure = null;
      } else {
        const id = sessionKey();
        muted = false;
        const hasBrowserAsr = startRecognition();
        // When the browser drives recognition, the server must not run a
        // second turn for the same audio.
        await request('voice.microphone.start', { sessionId: id, autoConversation: !hasBrowserAsr, language: lang });
        if (disposed) { await request('voice.microphone.stop', { sessionId: id }); return; }
        microphoneSession = id;
        active = true;
        failure = null;
        render('Voice: Listening', true, null, null);
      }
    } catch (error) {
      failure = error.message;
      active = false;
      stopRecognition();
      render(`Voice: ${error.message}`, false, null, null);
    } finally {
      busy = false; button.disabled = false;
      window.clearTimeout(timer);
      void refresh();
    }
  };

  button.addEventListener('click', click);

  // Used by the Home screen: mic switch, start/stop, language, live state.
  button.zeroVoice = {
    get active() { return active; },
    get muted() { return muted; },
    get speaking() { return speaking; },
    get lang() { return lang; },
    get state() { return button.dataset.voiceState || 'idle'; },
    start: async () => { if (!active) await click(); },
    stop: async () => { if (active) await click(); },
    async mute() {
      if (busy || disposed || muted) return;
      muted = true;
      stopRecognition();
      window.clearTimeout(silenceTimer);
      finalBuffer = ''; interimText = '';
      render('Voice: Mic off', active, null, null);
      busy = true;
      try {
        if (active) await request('voice.microphone.stop', { sessionId: microphoneSession || sessionKey(), preserveConversation: true });
        failure = null;
      } catch (error) { failure = error.message; }
      finally { busy = false; if (!disposed) render('Voice: Mic off', active); }
    },
    async unmute() {
      if (busy || disposed || !muted) return;
      busy = true;
      try {
        if (active) {
          const hasBrowserAsr = startRecognition();
          await request('voice.microphone.start', { sessionId: microphoneSession || sessionKey(), autoConversation: !hasBrowserAsr, language: lang });
        }
        muted = false;
        failure = null;
      } catch (error) { stopRecognition(); failure = error.message; }
      finally { busy = false; if (!disposed) render('Voice: Listening', active); }
    },
    stopSpeaking() { cancelSpeech?.(); },
    setLang(next) {
      lang = next || 'en-IN';
      try { localStorage.setItem('zero-voice-lang', lang); } catch {}
      if (recognition) { stopRecognition(); if (active && !muted) startRecognition(); }
    },
  };
  void refresh();

  return () => {
    disposed = true;
    generation++;
    active = false;
    cancelSpeech?.();
    if (microphoneSession) void request('voice.microphone.stop', { sessionId: microphoneSession }).catch(() => {});
    window.clearTimeout(timer);
    window.clearTimeout(silenceTimer);
    stopRecognition();
    button.removeEventListener('click', click);
    for (const dispose of disposers) { try { dispose?.(); } catch {} }
    render('Voice: Stopped');
  };
}
