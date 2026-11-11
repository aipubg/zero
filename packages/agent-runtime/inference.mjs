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

const CANONICAL_TOOL_SCHEMAS = {
  zero_computer_action: {
    type: 'object',
    required: ['action'],
    properties: {
      action: { type: 'string', enum: ['open_app', 'close_app', 'type_text', 'press_key', 'mouse_move', 'left_click', 'right_click', 'double_click', 'scroll', 'get_elements', 'focus_window', 'list_windows', 'list_apps', 'get_window_state', 'get_screen_size', 'fill_form', 'scrape', 'get_content', 'play', 'browser', 'open_url', 'spotify_control', 'login', 'logout', 'submit', 'submit_form'] },
      app: { type: 'string' },
      text: { type: 'string' },
      key: { type: 'string' },
      x: { type: 'number' },
      y: { type: 'number' },
      target: { type: 'string' },
      url: { type: 'string' },
      query: { type: 'string' },
      fields: { type: 'object' },
      username: { type: 'string' },
      password: { type: 'string' },
      volume_percent: { type: 'number' },
      playback_rate: { type: 'number' },
    },
  },
  browser: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['open_url', 'navigate', 'search', 'play', 'fill_form', 'scrape', 'get_content', 'check_notifications', 'login', 'logout', 'submit', 'submit_form'] },
      url: { type: 'string' },
      query: { type: 'string' },
      fields: { type: 'object' },
      username: { type: 'string' },
      password: { type: 'string' },
      volume_percent: { type: 'number' },
      playback_rate: { type: 'number' },
    },
  },
  open_app: {
    type: 'object',
    required: ['app'],
    properties: {
      app: { type: 'string' },
    },
  },
  web_search: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { type: 'string' },
    },
  },
  read_file: {
    type: 'object',
    required: ['path'],
    properties: {
      path: { type: 'string' },
    },
  },
};

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
  context.onModelResolved?.(resolution.provider?.id ? `${resolution.provider.id}/${modelId}` : modelId);
  const signal = context.signal;
  const tools = [];
  const handlers = new Map();
  for (const name of subtask.tools || []) {
    const custom = capabilityEngine?.customCapabilities?.get(name);
    let handler;
    let parameters = custom?.parameters || CANONICAL_TOOL_SCHEMAS[name] || { type: 'object' };
    if (capabilityEngine && (custom || ['zero_computer_action', 'browser', 'open_app'].includes(name))) {
      handler = (args) => capabilityEngine.execute({ agentId: subtask.agentId, toolName: name, args, signal });
    } else if (name === 'web_search' && researchEngine?.searchEngine) {
      parameters = CANONICAL_TOOL_SCHEMAS.web_search;
      handler = (args) => researchEngine.searchEngine.search(args.query, { ...args, signal });
    } else if (name === 'read_file' && researchEngine?.fileOps) {
      parameters = CANONICAL_TOOL_SCHEMAS.read_file;
      handler = (args) => researchEngine.fileOps.readFile(args.path, { ...args, signal });
    }
    if (handler && !handlers.has(name)) {
      handlers.set(name, handler);
      const descriptions = {
        zero_computer_action: 'Execute a native Windows action with parameters. Supply action (list_windows, screenshot, open_app, type_text, press_key, left_click, focus_window, open_url) and its arguments.',
        browser: 'Control the browser. Supply action (open_url, play, navigate, search, fill_form, scrape), url, query, or fields.',
        open_app: 'Launch a native application on Windows. Supply app.',
      };
      tools.push({ type: 'function', function: { name, description: custom?.description || descriptions[name] || name, parameters } });
    }
  }
  const messages = [{ role: 'system', content: `You are ${profile?.name || subtask.agentId} (${profile?.role || 'specialist'}). Report only work actually performed. Distinguish findings from verified actions. Available tools: ${[...handlers.keys()].join(', ') || 'none'}. Once necessary tool calls are executed, conclude with your final summary without calling redundant tools.` },
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
    if (choice?.finish_reason === 'length') {
      throw new Error('Specialist model turn truncated due to token limit (finish_reason: length)');
    }
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
      const allVerified = toolResults.length > 0 && toolResults.every(t => t.result?.verified === true || t.result?.outcome === 'COMPLETED');
      return { status: 'success', agentId: subtask.agentId, modelId, output: message.content, toolResults, executionKind: 'inference', verified: allVerified };
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
      const stepStatus = result?.ok === false ? 'failed' : (result?.verified ? 'completed' : (result?.outcome || 'unverified'));
      record({ toolName: name, toolArgs: args, toolResult: result, status: stepStatus, evidence: result?.evidence, backend: result?.backend });
      toolResults.push({ toolCallId: call.id, toolName: name, args, result, backend: result?.backend, evidence: result?.evidence });
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result ?? null) });
      if (result?.ok === false || ['FAILED', 'BLOCKED', 'CANCELLED'].includes(result?.outcome)) {
        throw new Error(`Tool '${name}' failed: ${result.error || result.message || result.outcome}`);
      }
    }
  }
  throw new Error('Specialist exceeded model/tool round limit');
}
