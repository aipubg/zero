// Dispatch acknowledgement is required; registration or queuing is not execution.
export async function executeConfirmedAction(executor, action, params) {
  if (typeof executor !== 'function') throw new Error('Action executor unavailable');
  const result = await executor(action, params);
  const incomplete = new Set(['queued', 'pending', 'blocked', 'failed', 'unavailable', 'unverified', 'cancelled', 'canceled', 'interrupted', 'delivery_unknown']);
  const incompleteState = [result?.status, result?.outcome]
    .some(value => typeof value === 'string' && incomplete.has(value.trim().toLowerCase()));
  if (!result || typeof result !== 'object'
    || result.ok === false || result.success === false
    || (result.ok !== true && result.success !== true)
    || result.executed === false || result.completed === false || result.queued === true
    || incompleteState) {
    throw new Error(result?.error || result?.message || 'Action execution was not confirmed');
  }
  return result;
}
