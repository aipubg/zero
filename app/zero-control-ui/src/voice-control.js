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

export function mountVoiceControl(button, host) {
  let disposed = false;
  let timer;
  let microphoneSession;
  let busy = false;
  let failure = null;
  let active = false;
  let speaking = false;
  let interimText = '';
  let finalBuffer = '';
  let silenceTimer = null;
  let recognition = null;
  let browserAsr = false;

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

    button.dataset.voiceState = voiceState;

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
    const prose = speakableText(text);
    if (!prose) return;
    speaking = true;
    render('Voice: Speaking...', active, null, null);
    try {
      const synth = window.speechSynthesis;
      if (synth && typeof window.SpeechSynthesisUtterance === 'function') {
        await new Promise((resolve) => {
          let settled = false;
          const done = () => { if (settled) return; settled = true; resolve(); };
          const utterance = new window.SpeechSynthesisUtterance(prose);
          utterance.lang = 'en-US';
          utterance.rate = 1.02;
          utterance.onend = done;
          utterance.onerror = done;
          try { synth.speak(utterance); } catch { done(); }
          // Never let a stuck synthesizer block the conversation loop.
          setTimeout(done, Math.min(180000, 2500 + prose.length * 90));
        });
      } else {
        await request('voice.speak', { text: prose, sessionId: sessionKey() });
      }
    } catch (error) {
      failure = error.message;
    } finally {
      speaking = false;
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
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = (result?.[0]?.transcript || '').trim();
        if (!chunk) continue;
        if (result.isFinal) finalBuffer = `${finalBuffer} ${chunk}`.trim();
        else interim += `${chunk} `;
      }
      interimText = interim.trim();
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
      // Chrome ends the recognizer periodically; restart it while active.
      if (!disposed && active && browserAsr) {
        setTimeout(() => { if (!disposed && active && browserAsr) startRecognition(); }, 250);
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
      try { recognition.stop(); } catch {}
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
    if (!text || disposed) return;
    try {
      label.textContent = 'Voice: Thinking...';
      button.dataset.voiceState = 'thinking';
      const reply = await request('chat.send', { sessionKey: sessionKey(), message: text });
      const spoken = speakableText(reply?.content || reply?.text || reply?.message || '');
      if (spoken) await speak(spoken);
    } catch (error) {
      failure = error.message;
      render(`Voice: ${error.message}`, active, null, null);
    }
  };

  // ------------------------------------------------------------ server turn
  // When the browser recognizer is unavailable the backend owns the turn:
  // VAD -> Windows SAPI recognition -> agent -> SAPI playback.
  const onServerTurnComplete = (payload) => {
    if (!payload || disposed) return;
    const text = speakableText(payload.content || '');
    if (!text) return;
    if (payload.played) {
      // The backend already spoke it through Windows SAPI.
      speaking = true;
      render('Voice: Speaking...', active, null, null);
      setTimeout(() => { speaking = false; render('Voice: Listening', active, null, null); }, 400);
      return;
    }
    void speak(text);
  };

  const onServerTranscript = (payload) => {
    if (!payload || disposed) return;
    const text = String(payload.text || '').trim();
    if (!text) return;
    interimText = text.slice(0, 48);
    render('Voice: READY', active, null, null);
  };

  const onServerTurnError = (payload) => {
    if (!payload || disposed) return;
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
    try {
      const status = await request('voice.status');
      if (disposed || !button.isConnected || busy) return;
      const session = status.sessions?.find(entry => entry.microphoneActive);
      microphoneSession = session?.sessionId;
      if (!active) render(`Voice: ${failure || status.status || 'READY'}`, false, session?.capture, session);
      else render('Voice: READY', true, session?.capture, session);
    } catch (error) {
      if (!disposed && !busy) { microphoneSession = null; render('Voice: Unavailable', false, null, { state: 'disconnected' }); }
    } finally {
      if (!disposed && button.isConnected) timer = window.setTimeout(refresh, active ? 250 : 2000);
    }
  };

  const click = async () => {
    if (busy) return;
    busy = true; button.disabled = true;
    const stopping = active;
    render(stopping ? 'Voice: Stopping…' : 'Voice: Starting…');
    try {
      if (stopping) {
        active = false;
        stopRecognition();
        window.clearTimeout(silenceTimer);
        await request('voice.microphone.stop', { sessionId: microphoneSession || sessionKey() });
        microphoneSession = null;
        failure = null;
      } else {
        const id = sessionKey();
        const hasBrowserAsr = startRecognition();
        // When the browser drives recognition, the server must not run a
        // second turn for the same audio.
        await request('voice.microphone.start', { sessionId: id, autoConversation: !hasBrowserAsr });
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
  void refresh();

  return () => {
    disposed = true;
    window.clearTimeout(timer);
    window.clearTimeout(silenceTimer);
    stopRecognition();
    button.removeEventListener('click', click);
    for (const dispose of disposers) { try { dispose?.(); } catch {} }
    render('Voice: Stopped');
  };
}
