/** Validate the complete model batch before any side effect or transcript admission. */
export function prepareToolBatch(calls, allowedNames) {
  if (!Array.isArray(calls) || !calls.length) throw new Error('Empty model tool batch');
  const ids = new Set();
  return calls.map(call => {
    if (!call || typeof call.id !== 'string' || !call.id.trim() || ids.has(call.id)) throw new Error('Missing or duplicate model tool call ID');
    ids.add(call.id);
    const fnName = call.function?.name;
    if (!allowedNames.has(fnName)) throw new Error('Model requested an undeclared tool');
    let args;
    try { args = typeof call.function.arguments === 'string' ? JSON.parse(call.function.arguments) : call.function.arguments ?? {}; }
    catch { throw new Error('Malformed model tool arguments JSON'); }
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Model tool arguments must be an object');
    return { call, fnName, args };
  });
}
