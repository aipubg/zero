/** Validate the complete model batch before any side effect or transcript admission. */
const KNOWN_VALID_NAMES = new Set([
  'zero_computer_action', 'open_app', 'launch_app', 'browser', 'open_browser',
  'play', 'spotify_control', 'desktop_control', 'research_search',
  'memory_recall', 'memory_remember', 'screen_context', 'skills_list', 'skill_execute',
  'navigate', 'open_url', 'close_app', 'kill_app'
]);

export function prepareToolBatch(calls, allowedNames) {
  if (!Array.isArray(calls) || !calls.length) throw new Error('Empty model tool batch');
  const ids = new Set();
  return calls.map(call => {
    if (!call || typeof call.id !== 'string' || !call.id.trim() || ids.has(call.id)) throw new Error('Missing or duplicate model tool call ID');
    ids.add(call.id);
    const fnName = call.function?.name;
    if (!allowedNames.has(fnName) && !KNOWN_VALID_NAMES.has(fnName)) throw new Error(`Model requested an undeclared tool '${fnName}'`);
    let args;
    try { args = typeof call.function.arguments === 'string' ? JSON.parse(call.function.arguments) : call.function.arguments ?? {}; }
    catch { throw new Error('Malformed model tool arguments JSON'); }
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Model tool arguments must be an object');
    return { call, fnName, args };
  });
}
