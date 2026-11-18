// Service workflows are not desktop operator commands.
export function createAutomationDispatcher({ memoryEngine, researchEngine, capabilityEngine, requestOrchestrator, goalRunner }) {
  return async (action, params = {}) => {
    if (action === 'memory.consolidate') return memoryEngine.consolidateMemories(params);
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
