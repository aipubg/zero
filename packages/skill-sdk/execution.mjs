import path from 'node:path';
import { CAPABILITY_DEFINITIONS } from '../capability-engine/index.mjs';
import { skillStatusRow } from './status.mjs';

function withSignal(operation, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const aborted = () => reject(signal.reason || new Error('Skill execution cancelled'));
    signal.addEventListener('abort', aborted, { once: true });
    Promise.resolve(operation).then(resolve, reject).finally(() => signal.removeEventListener('abort', aborted));
  });
}

function toolDefinitions(engine, allowedTools) {
  if (!engine) return [];
  const definitions = new Map(Object.entries(CAPABILITY_DEFINITIONS).map(([name, definition]) => [name, {
    name, description: definition.description,
    parameters: { type: 'object', properties: {
      action: { type: 'string', enum: definition.allowedActions }, app: { type: 'string' },
      text: { type: 'string' }, query: { type: 'string' }, url: { type: 'string' }, key: { type: 'string' },
      x: { type: 'number' }, y: { type: 'number' },
    }, additionalProperties: true },
  }]));
  for (const [name, definition] of engine.customCapabilities || []) {
    if (!definition.disabled) definitions.set(name, { name, description: definition.description || name, parameters: definition.parameters || { type: 'object' } });
  }
  return [...definitions.values()].filter(tool => !allowedTools || allowedTools.includes(tool.name))
    .map(definition => ({ type: 'function', function: definition }));
}

function executionFailure(result) {
  return result == null || result.ok === false || result.executed === false ||
    ['FAILED', 'ERROR', 'BLOCKED', 'CANCELLED'].includes(String(result.outcome || result.status || '').toUpperCase());
}

function modelConfig(config) {
  return JSON.parse(JSON.stringify(config, (key, value) => /api.?key|token|secret|password|^env$/i.test(key) ? '[configured privately]' : value));
}

/** Run skill instructions as task context, with the host's actual model/tool transports. */
export async function executeLoadedSkill(loader, skillName, params = {}, suppliedContext = {}) {
  const startedAt = Date.now();
  const skill = loader._requireSkill(skillName);
  if (!skill.enabled) throw new Error(`Skill '${skillName}' is disabled`);
  const context = { ...loader.executionContext, ...suppliedContext };
  const stateMachine = context.stateMachine || context.tasks;
  if (!stateMachine) throw new Error('Skill execution requires the host TaskStateMachine');
  const modelFabric = context.modelFabric;
  const engine = context.capabilityEngine;
  const maxTurns = context.maxTurns ?? 8;
  if (!Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > 100) throw new Error('maxTurns must be between 1 and 100');
  const timeoutMs = context.timeoutMs ?? 120000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) throw new Error('timeoutMs must be a positive duration');
  if (context.signal != null && !(context.signal instanceof AbortSignal)) throw new Error('signal must be an AbortSignal');
  const agentId = context.agentId || params.agentId || 'zero';
  const goal = params.prompt || params.goal || `Execute skill ${skill.name} with parameters: ${JSON.stringify(params)}`;
  const task = stateMachine.createTask({ sessionId: context.sessionId || params.sessionId || params.sessionKey || 'default', agentId, goal });
  stateMachine.enqueueTask(task.id);
  stateMachine.startTask(task.id);
  const signals = [stateMachine.getSignal(task.id), context.signal, AbortSignal.timeout(timeoutMs)].filter(Boolean);
  const signal = AbortSignal.any(signals);
  const executedSteps = [];
  const record = (toolName, args, result, status) => {
    const step = { capability: toolName, status, result };
    executedSteps.push(step);
    stateMachine.recordStep(task.id, { stepNumber: executedSteps.length, toolName, toolArgs: args, toolResult: result, status });
  };
  const tools = toolDefinitions(engine, skill.allowedTools);
  const permitted = new Set(tools.map(tool => tool.function.name));
  const executeTool = async (toolName, args) => {
    signal.throwIfAborted();
    if (!engine || !permitted.has(toolName)) throw new Error(`Capability '${toolName}' is not available to this skill`);
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Tool arguments must be a JSON object');
    let result;
    try {
      result = await withSignal(engine.execute({ agentId, toolName, args, signal, timeoutMs: Math.min(timeoutMs, 30000) }), signal);
      signal.throwIfAborted();
    } catch (error) {
      record(toolName, args, { ok: false, error: error.message }, 'failed');
      throw error;
    }
    const failed = executionFailure(result);
    record(toolName, args, result, failed ? 'failed' : result.verified === true ? 'completed' : 'executed');
    if (failed) throw new Error(result?.message || result?.error || `Capability '${toolName}' did not complete with verified output`);
    return result;
  };
  const finish = output => {
    signal.throwIfAborted();
    if (output === undefined || output === null || output === '') throw new Error('Skill execution produced no output');
    const result = { ok: true, status: 'completed', completed: true, taskId: task.id, skillName: skill.name,
      description: skill.description, params, executedSteps, output, verified: false,
      verificationStatus: 'Task execution finished; the requested outcome requires independent verification.',
      durationMs: Date.now() - startedAt, timestamp: Date.now() };
    stateMachine.completeTask(task.id, result);
    return result;
  };
  try {
    signal.throwIfAborted();
    const status = skillStatusRow(skill);
    if (!status.eligible) throw new Error(`Skill requirements are not satisfied: ${JSON.stringify(status.missing)}`);
    // Explicit operations are useful for deterministic host tasks. Markdown prose is never a tool identifier.
    const operations = params.operations || (params.toolName ? [{ toolName: params.toolName, args: params.args || {} }] : null);
    if (operations) {
      if (!Array.isArray(operations) || !operations.length) throw new Error('Skill operations must be a non-empty array');
      let output;
      for (const operation of operations) output = await executeTool(operation.toolName, operation.args || {});
      return finish(output);
    }
    if (!modelFabric?.executeChat) throw new Error('Instruction skills require the host ModelFabric; no executable operation was supplied');
    if (skill.allowedTools?.length && !tools.length) throw new Error(`Required skill tools are not registered: ${skill.allowedTools.join(', ')}`);
    const messages = [
      { role: 'system', content: `Execute the user's task using the skill below. Use available tools when actions are required, and base claims on observed tool results. Return the actual deliverable or findings. Do not present the skill instructions as completed work. Supporting files are located in ${path.dirname(skill.filePath)}.\n\n<skill name=${JSON.stringify(skill.name)}>\n${skill.content}\n</skill>\n\nSkill configuration:\n${JSON.stringify(modelConfig(skill.config))}` },
      { role: 'user', content: `${goal}\n\nParameters:\n${JSON.stringify(params)}` },
    ];
    const seenCalls = new Set();
    for (let turn = 0; turn < maxTurns; turn++) {
      signal.throwIfAborted();
      const response = await withSignal(modelFabric.executeChat({ model: context.model || params.model || 'zero-lead', messages,
        ...(tools.length ? { tools, tool_choice: 'auto' } : {}) }, { signal, timeoutMs }), signal);
      signal.throwIfAborted();
      const choice = response?.data?.choices?.[0];
      const message = choice?.message;
      if (!message || message.role !== 'assistant') throw new Error('ModelFabric returned no assistant message');
      record('model', { model: context.model || params.model || 'zero-lead', turn: turn + 1 }, { content: message.content, tool_calls: message.tool_calls || [] }, 'completed');
      if (choice.finish_reason === 'length' || choice.finish_reason === 'content_filter') throw new Error(`Model output did not complete: ${choice.finish_reason}`);
      const calls = message.tool_calls || [];
      if (!Array.isArray(calls)) throw new Error('Model returned malformed tool calls');
      if (!calls.length) {
        if (typeof message.content !== 'string' || !message.content.trim() || message.content.trim() === skill.content.trim()) throw new Error('Model returned no deliverable');
        return finish(message.content);
      }
      messages.push({ role: 'assistant', content: message.content || null, tool_calls: calls });
      for (const call of calls) {
        if (!call.id || seenCalls.has(call.id)) throw new Error('Model returned a missing or repeated tool call ID');
        seenCalls.add(call.id);
        let args;
        try { args = typeof call.function?.arguments === 'string' ? JSON.parse(call.function.arguments) : call.function?.arguments; } catch { throw new Error('Model returned malformed tool arguments JSON'); }
        const result = await executeTool(call.function?.name, args);
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
    throw new Error(`Skill execution exceeded ${maxTurns} model turns without a final result`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cancelled = signal.aborted || stateMachine.getTask(task.id)?.status === 'CANCELLED';
    const status = cancelled ? 'cancelled' : 'failed';
    const result = { ok: false, status, completed: false, taskId: task.id, skillName: skill.name, params, executedSteps,
      output: null, error: message, durationMs: Date.now() - startedAt, timestamp: Date.now() };
    if (!['CANCELLED', 'COMPLETED', 'FAILED'].includes(stateMachine.getTask(task.id)?.status)) {
      if (cancelled) stateMachine.cancelTask(task.id, message);
      else stateMachine.failTask(task.id, result);
    }
    return result;
  }
}
