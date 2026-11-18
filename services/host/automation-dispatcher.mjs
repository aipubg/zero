// Service workflows are not desktop operator commands.
export function createAutomationDispatcher({ memoryEngine, researchEngine, capabilityEngine, requestOrchestrator, goalRunner, promptRunner }) {
  return async (action, params = {}) => {
    if (action === 'memory.consolidate') return memoryEngine.consolidateMemories(params);
    // Ask Zero job: run a prompt as a normal Zero request in its own chat.
    if (action === 'assistant.prompt') {
      if (typeof promptRunner !== 'function') throw new Error('Ask Zero jobs are not connected');
      if (!String(params.prompt || '').trim()) throw new Error('An Ask Zero job needs a prompt');
      return promptRunner(params);
    }
    if (action === 'goal.tick') {
      if (typeof goalRunner !== 'function') throw new Error('Autonomous goal runner is not connected');
      return goalRunner(params);
    }
    if (action === 'research.workflow.execute') {
      return researchEngine.executeResearchWorkflow({
        topic: params.topic || params.query,
        limit: params.limit,
        taskId: params.taskId,
        memoryEngine,
      });
    }
    const executor = requestOrchestrator || capabilityEngine;
    if (typeof executor.executeCapability === 'function') {
      return executor.executeCapability({
        agentId: 'zero',
        toolName: 'zero_computer_action',
        args: { ...params, action },
        context: { sessionKey: params.sessionKey || params.sessionId, source: 'automation' },
      });
    }
    return executor.execute({
      agentId: 'zero', toolName: 'zero_computer_action', args: { ...params, action },
    });
  };
}
