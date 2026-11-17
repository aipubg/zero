// Service workflows are not desktop operator commands.
export function createAutomationDispatcher({ memoryEngine, researchEngine, capabilityEngine, requestOrchestrator, goalRunner, promptRunner }) {
  return async (action, params = {}) => {
    if (action === 'memory.consolidate') return memoryEngine.consolidateMemories(params);
    if (action === 'assistant.prompt') {
      if (typeof promptRunner !== 'function') throw new Error('Assistant prompt runner is not connected');
      if (!String(params.prompt || '').trim()) throw new Error('An "Ask Zero" job needs a prompt');
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
    return executor.execute({
      agentId: 'zero', toolName: 'zero_computer_action', args: { ...params, action },
    });
  };
}
