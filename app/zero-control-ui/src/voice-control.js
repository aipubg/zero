/** Existing toolbar voice control follows the selected chat and actual server state. */
export function mountVoiceControl(button, host) {
  let disposed = false;
  let timer;
  let microphoneSession;
  let busy = false;
  let failure = null;
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
      microphoneSession = status.sessions?.find(session => session.microphoneActive)?.sessionId;
      button.textContent = microphoneSession ? 'Voice: Listening' : `Voice: ${failure || status.status || 'PARTIAL'}`;
      button.setAttribute('aria-pressed', String(Boolean(microphoneSession)));
      button.title = microphoneSession ? `Listening in ${microphoneSession}` : 'Start voice in the selected chat';
    } catch (error) {
      if (!disposed && !busy) button.textContent = `Voice: ${error.message}`;
    } finally {
      if (!disposed && button.isConnected) timer = window.setTimeout(refresh, 2000);
    }
  };
  const click = async () => {
    if (busy) return;
    busy = true; button.disabled = true;
    try {
      const sessionId = microphoneSession || host?.sessions?.selectedKey;
      if (typeof sessionId !== 'string' || !sessionId.trim()) throw new Error('Select a chat first');
      await request(microphoneSession ? 'voice.microphone.stop' : 'voice.microphone.start', { sessionId });
      failure = null;
    } catch (error) { failure = error.message; button.textContent = `Voice: ${error.message}`; }
    finally {
      busy = false; button.disabled = false;
      window.clearTimeout(timer);
      void refresh();
    }
  };
  button.addEventListener('click', click);
  void refresh();
  return () => { disposed = true; window.clearTimeout(timer); button.removeEventListener('click', click); };
}
