/** Forward captured window transitions without treating observed text as instructions. */
export function connectScreenAutomation(observer, automation) {
  let previous = null;
  let closed = false;
  const pending = new Set();
  const status = { observedChanges: 0, windowTransitions: 0, failures: 0, lastError: null };
  const listener = event => {
    if (closed) return;
    status.observedChanges++;
    const identity = JSON.stringify([event.appName, event.windowTitle]);
    const changed = previous !== null && previous !== identity;
    previous = identity;
    if (!changed) return;
    status.windowTransitions++;
    // Screen text cannot register rules, choose actions, or grant authority.
    const request = Promise.resolve().then(() => {
      if (closed) return;
      return automation.dispatchEvent('screen:window_changed', {
        application: event.appName, windowTitle: event.windowTitle, timestamp: event.timestamp,
        observationId: event.observationId, source: 'native-screen-observer',
      });
    }).catch(error => { status.failures++; status.lastError = error.message; }).finally(() => pending.delete(request));
    pending.add(request);
  };
  observer.on('change', listener);
  return {
    status: () => ({ ...status, pending: pending.size }),
    async close() { closed = true; observer.off('change', listener); await Promise.allSettled([...pending]); },
  };
}
