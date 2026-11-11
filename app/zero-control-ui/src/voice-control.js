/** Existing toolbar voice control follows the selected chat and actual server state. */
export function mountVoiceControl(button, host) {
  let disposed = false;
  let timer;
  let microphoneSession;
  let busy = false;
  let failure = null;
  button.classList.add('zero-voice-control');
  const meter = document.createElement('span');
  meter.className = 'zero-voice-meter'; meter.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 5; index++) { const bar = document.createElement('i'); bar.style.setProperty('--bar', String(index)); meter.append(bar); }
  const label = document.createElement('span');
  button.replaceChildren(meter, label);
  button.setAttribute('aria-live', 'polite');
  const render = (text, active = false, capture = null, sessionState = null) => {
    const fresh = active && Number.isFinite(capture?.lastFrameAt) && Date.now() - capture.lastFrameAt < 3000;
    let voiceState = 'idle';

    if (failure) {
      voiceState = 'error';
    } else if (!host?.isConnected?.()) {
      voiceState = 'disconnected';
    } else if (sessionState?.playbackActive || sessionState?.state === 'speaking') {
      voiceState = 'speaking';
    } else if (sessionState?.transcriptionActive || sessionState?.state === 'transcribing') {
      voiceState = 'transcribing';
    } else if (sessionState?.muted) {
      voiceState = 'muted';
    } else if (active) {
      voiceState = fresh ? 'listening' : 'waiting';
    }

    button.dataset.voiceState = voiceState;

    if (voiceState === 'listening') {
      label.textContent = 'Voice: Listening';
    } else if (voiceState === 'waiting') {
      label.textContent = 'Voice: Waiting for audio';
    } else if (voiceState === 'speaking') {
      label.textContent = 'Voice: Speaking';
    } else if (voiceState === 'transcribing') {
      label.textContent = 'Voice: Transcribing';
    } else if (voiceState === 'muted') {
      label.textContent = 'Voice: Muted';
    } else if (voiceState === 'disconnected') {
      label.textContent = 'Voice: Disconnected';
    } else if (voiceState === 'error') {
      label.textContent = `Voice: Error (${failure})`;
    } else {
      label.textContent = text;
    }

    const rms = Number(capture?.lastFrameRms);
    const level = fresh && Number.isFinite(rms) ? Math.min(1, Math.max(0, rms / 6000)) : 0;
    button.style.setProperty('--zero-mic-level', String(level));
    button.setAttribute('aria-pressed', String(active));
    button.title = active ? (fresh ? 'Microphone is receiving live audio. Click to stop.' : 'Microphone started; waiting for audio frames. Click to stop.') : 'Start voice in the selected chat';
  };
  const request = async (method, params = {}) => {
    const response = await host.request(method, params);
    const result = response?.result ?? response;
    if (result?.ok === false) throw new Error(result.error || 'Voice request failed');
    return result;
  };
  const refresh = async () => {
    try {
      const status = await request('voice.status');
      if (disposed || !button.isConnected || busy) return;
      const session = status.sessions?.find(session => session.microphoneActive);
      microphoneSession = session?.sessionId;
      render(microphoneSession ? 'Voice: Listening' : `Voice: ${failure || status.status || 'PARTIAL'}`, Boolean(microphoneSession), session?.capture, session);
    } catch (error) {
      if (!disposed && !busy) { microphoneSession = null; render('Voice: Unavailable', false, null, { state: 'disconnected' }); }
    } finally {
      if (!disposed && button.isConnected) timer = window.setTimeout(refresh, microphoneSession ? 250 : 2000);
    }
  };
  const click = async () => {
    if (busy) return;
    busy = true; button.disabled = true;
    render(microphoneSession ? 'Voice: Stopping…' : 'Voice: Starting…');
    try {
      const sessionId = microphoneSession || host?.sessions?.selectedKey;
      if (typeof sessionId !== 'string' || !sessionId.trim()) throw new Error('Select a chat first');
      await request(microphoneSession ? 'voice.microphone.stop' : 'voice.microphone.start', { sessionId });
      failure = null;
    } catch (error) { failure = error.message; render(`Voice: ${error.message}`); }
    finally {
      busy = false; button.disabled = false;
      window.clearTimeout(timer);
      void refresh();
    }
  };
  button.addEventListener('click', click);
  void refresh();
  return () => { disposed = true; window.clearTimeout(timer); button.removeEventListener('click', click); render('Voice: Stopped'); };
}
