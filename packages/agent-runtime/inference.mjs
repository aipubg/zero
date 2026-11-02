// Await cooperative work without allowing late results to mutate durable state.
export function abortable(work, signal) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason || new Error('Execution cancelled'));
    signal?.addEventListener('abort', onAbort, { once: true });
    Promise.resolve().then(() => {
      signal?.throwIfAborted();
      return work();
    }).then(resolve, reject).finally(() => signal?.removeEventListener('abort', onAbort));
  });
}

export function requireExecutionResult(result) {
  if (result === undefined || result === null || result?.ok === false
    || (result?.status !== undefined && !['success', 'completed'].includes(String(result.status).toLowerCase()))) {
    throw new Error(result?.error || 'Executor returned no completed result');
  }
  return result;
}

export function requireCompletedChoice(choice, label, { allowTools = false } = {}) {
  if (!choice?.message) throw new Error(`${label} returned no completion message`);
  const reason = choice.finish_reason;
  if (reason && reason !== 'stop' && !(allowTools && reason === 'tool_calls')) throw new Error(`${label} returned incomplete completion: ${reason}`);
  if (choice.message.refusal) throw new Error(`${label} refused completion`);
  if (choice.message.tool_calls !== undefined && !Array.isArray(choice.message.tool_calls)) throw new Error(`${label} returned malformed tool calls`);
  if (reason === 'tool_calls' && !choice.message.tool_calls?.length) throw new Error(`${label} declared tool calls without any calls`);
  if (!allowTools && choice.message.tool_calls?.length) throw new Error(`${label} returned unexecuted tool calls`);
  return choice.message;
}

export async function executeSpecialist(orchestrator, subtask, context) {
  const { modelFabric, capabilityEngine, researchEngine, sm } = orchestrator;
  if (!modelFabric?.executeChat) throw new Error('Unsupported specialist execution: no model fabric configured');
  const profile = orchestrator.getAgentProfile(subtask.agentId);
  const requestedModel = subtask.modelId || subtask.model;
  const resolution = requestedModel
    ? modelFabric.resolveModel(requestedModel)
    : modelFabric.resolveAgentModel(subtask.agentId);
  if (!resolution?.canonicalModelId) throw new Error(`No assigned model available for ${subtask.agentId}`);
  const modelId = resolution.canonicalModelId;
  const signal = context.signal;
  const tools = [];
  const handlers = new Map();
  for (const name of subtask.tools || []) {
    const custom = capabilityEngine?.customCapabilities?.get(name);
    let handler;
    let parameters = custom?.parameters || { type: 'object', additionalProperties: true };
    if (capabilityEngine && (custom || ['zero_computer_action', 'browser', 'open_app'].includes(name))) {
      handler = (args) => capabilityEngine.execute({ agentId: subtask.agentId, toolName: name, args, signal });
    } else if (name === 'web_search' && researchEngine?.searchEngine) {
      parameters = { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] };
      handler = (args) => researchEngine.searchEngine.search(args.query, { ...args, signal });
    } else if (name === 'read_file' && researchEngine?.fileOps) {
      parameters = { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] };
      handler = (args) => researchEngine.fileOps.readFile(args.path, { ...args, signal });
    }
    if (handler && !handlers.has(name)) {
      handlers.set(name, handler);
      const descriptions = {
        zero_computer_action: 'Execute a native Windows action. Supply action (list_windows, screenshot, open_app, type_text, press_key, left_click, focus_window, open_url) and its arguments.',
        browser: 'Control the browser. Supply action (open, play, navigate, search), url or query.',
        open_app: 'Launch a native application. Supply app or appName.',
      };
      tools.push({ type: 'function', function: { name, description: custom?.description || descriptions[name] || name, parameters } });
    }
  }
  const messages = [{ role: 'system', content: `You are ${profile?.name || subtask.agentId} (${profile?.role || 'specialist'}). Report only work actually performed. Distinguish findings from verified actions. Available tools: ${[...handlers.keys()].join(', ') || 'none'}.` },
    { role: 'user', content: `Overall goal: ${context.goal}\nYour goal: ${subtask.goal}\nDependency results: ${JSON.stringify(context.subtaskResults)}` }];
  const toolResults = [];
  const record = (data) => sm.recordStep(context.childTaskId, { stepNumber: sm.getTaskSteps(context.childTaskId).length + 1, ...data });
  for (let round = 0; round < (context.maxToolRounds || 8); round++) {
    signal.throwIfAborted();
    const response = await abortable(() => modelFabric.executeChat({
      model: modelId, messages, max_tokens: context.maxOutputTokens || 2048, stream: false,
      ...(tools.length ? { tools, tool_choice: 'auto' } : {}),
    }, { signal }), signal);
    signal.throwIfAborted();
    const choice = response?.data?.choices?.[0];
    let message;
    try { message = requireCompletedChoice(choice, 'Specialist', { allowTools: true }); }
    catch (error) {
      record({ toolName: 'model_inference', toolArgs: { modelId, round }, toolResult: { message: choice?.message, finishReason: choice?.finish_reason, error: error.message }, status: 'failed' });
      throw error;
    }
    record({ toolName: 'model_inference', toolArgs: { modelId, round }, toolResult: message, status: 'completed' });
    messages.push(message);
    if (!message.tool_calls?.length) {
      if (typeof message.content !== 'string' || !message.content.trim()) throw new Error('Model returned empty output');
      return { status: 'success', agentId: subtask.agentId, modelId, output: message.content, toolResults, executionKind: 'inference', verified: false };
    }
    const ids = new Set();
    const preparedCalls = message.tool_calls.map(call => {
      const name = call.function?.name;
      if (typeof call.id !== 'string' || !call.id.trim() || ids.has(call.id)) throw new Error('Model returned missing or duplicate tool call ID');
      ids.add(call.id);
      if (!handlers.has(name)) throw new Error(`Model requested unavailable or unassigned tool '${name}'`);
      let args;
      try { args = JSON.parse(call.function.arguments || '{}'); } catch { throw new Error(`Invalid arguments for '${name}'`); }
      if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error(`Invalid arguments for '${name}'`);
      return { call, name, args };
    });
    for (const { call, name, args } of preparedCalls) {
      let result;
      try {
        result = await abortable(() => handlers.get(name)(args), signal);
      } catch (err) {
        signal.throwIfAborted();
        result = { ok: false, error: err.message };
      }
      signal.throwIfAborted();
      record({ toolName: name, toolArgs: args, toolResult: result, status: result?.ok === false ? 'failed' : 'completed' });
      toolResults.push({ toolCallId: call.id, toolName: name, args, result });
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result ?? null) });
      if (result?.ok === false || ['FAILED', 'BLOCKED', 'CANCELLED'].includes(result?.outcome)) {
        throw new Error(`Tool '${name}' failed: ${result.error || result.message || result.outcome}`);
      }
    }
  }
  throw new Error('Specialist exceeded model/tool round limit');
}
