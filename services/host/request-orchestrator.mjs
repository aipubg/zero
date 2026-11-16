export class RequestOrchestrator {
  constructor({ eventBus, executeAssistant, capabilityEngine } = {}) {
    if (!eventBus || typeof executeAssistant !== 'function' || typeof capabilityEngine?.execute !== 'function') {
      throw new TypeError('RequestOrchestrator requires an event bus, assistant executor, and capability engine');
    }
    this.eventBus = eventBus;
    this.executeAssistant = executeAssistant;
    this.capabilityEngine = capabilityEngine;
  }

  async runAssistantRequest(options) {
    const { runId, sessionKey, source = 'chat', ws } = options;
    const metadata = { sessionKey, ownerSocket: ws, ownerOnly: true, legacyNotification: 'zero.request' };
    this.eventBus.publish('request.started', { runId, sessionKey, source }, metadata);
    try {
      const result = await this.executeAssistant(options);
      this.eventBus.publish('request.completed', { runId, sessionKey, source, status: 'completed' }, metadata);
      return result;
    } catch (error) {
      this.eventBus.publish('request.failed', {
        runId, sessionKey, source, status: 'failed', error: error.message,
      }, metadata);
      throw error;
    }
  }

  async executeCapability(request) {
    const { agentId, toolName, args, signal, context } = request;
    const metadata = { sessionKey: context?.sessionKey, ownerSocket: context?.ws, ownerOnly: Boolean(context?.ws), legacyNotification: 'zero.capability' };
    this.eventBus.publish('capability.started', { agentId, toolName }, metadata);
    try {
      const result = await this.capabilityEngine.execute(request);
      this.eventBus.publish('capability.completed', {
        agentId, toolName, status: result?.status, outcome: result?.outcome,
        ok: result?.ok !== false, error: result?.error,
      }, metadata);
      return result;
    } catch (error) {
      this.eventBus.publish('capability.failed', { agentId, toolName, error: error.message }, metadata);
      throw error;
    }
  }
}
