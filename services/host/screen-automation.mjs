/** Forward captured window transitions without treating observed text as instructions. */
export function connectScreenAutomation(observer, automation, { maxPending = 8 } = {}) {
  if (!Number.isInteger(maxPending) || maxPending < 1 || maxPending > 128) throw new RangeError('maxPending must be an integer from 1 to 128');
  let previous = null;
  let closed = false;
  const pending = new Set();
  const status = { observedChanges: 0, windowTransitions: 0, droppedTransitions: 0, maxPending, failures: 0, lastError: null };
  const listener = event => {
    if (closed) return;
    status.observedChanges++;
    const identity = JSON.stringify([event.appName, event.windowTitle]);
    const changed = previous !== null && previous !== identity;
    previous = identity;
    if (!changed) return;
    status.windowTransitions++;
    // Do not accumulate delayed desktop actions or retain an unbounded frame queue.
    // Overflow is visible, never reported as successful rule execution.
    if (pending.size >= maxPending) { status.droppedTransitions++; return; }
    // Screen text cannot register rules, choose actions, or grant authority.
    const request = Promise.resolve().then(async () => {
      if (closed) return;
      const result = await automation.dispatchEvent('screen:window_changed', {
        application: event.appName, windowTitle: event.windowTitle, timestamp: event.timestamp,
        observationId: event.observationId, source: 'native-screen-observer',
      });
      const failures = result?.executions?.filter(execution => execution.status === 'failed') || [];
      if (failures.length) { status.failures += failures.length; status.lastError = failures[0].error || 'Configured rule execution failed'; }
      return result;
    }).catch(error => { status.failures++; status.lastError = error.message; }).finally(() => pending.delete(request));
    pending.add(request);
  };
  observer.on('change', listener);
  return {
    status: () => ({ ...status, pending: pending.size }),
    async close() { closed = true; observer.off('change', listener); await Promise.allSettled([...pending]); },
  };
}
