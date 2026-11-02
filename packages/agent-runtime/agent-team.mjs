/**
 * @fileoverview Zero Agent Runtime — Specialist Workforce & Team Orchestrator
 *
 * Implements:
 * 1. Agent Profiles (ZERO, Researcher, Coder, Reviewer, Operator)
 * 2. Dynamic Team Creation & Registry
 * 3. DAG Dependency Task Execution with Parallelism
 * 4. Structured Messaging & Shared/Private Context Separation
 * 5. Desktop Lease Integration for Physical Hardware Operations
 * 6. Result Verification & Consolidation by Primary Coordinator
 */

import { EventEmitter } from 'node:events';
import { TASK_STATUS } from './index.mjs';
import { AgentMessageBus, MESSAGE_TYPES } from './structured-messaging.mjs';
import { DesktopLeaseManager } from './desktop-lease.mjs';
import { abortable, executeSpecialist, requireExecutionResult } from './inference.mjs';

export const CANONICAL_AGENT_PROFILES = Object.freeze({
  zero: {
    id: 'zero',
    name: 'ZERO (Primary Coordinator)',
    role: 'Principal Orchestrator & Autonomous Assistant',
    description: 'Central intelligence responsible for planning, decomposing goals, delegating to specialists, and synthesizing final results.',
    capabilities: ['plan', 'delegate', 'synthesize', 'user_dialogue', 'evaluate'],
    defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
  },
  researcher: {
    id: 'researcher',
    name: 'Research Specialist',
    role: 'Deep Web, File & Document Analysis',
    description: 'Specialist for web search, scraping, documentation exploration, and empirical evidence gathering.',
    capabilities: ['web_search', 'read_file', 'browse', 'extract_data'],
    defaultModel: 'deepseek-ai/deepseek-r1',
  },
  coder: {
    id: 'coder',
    name: 'Engineering Specialist',
    role: 'Codebase Authoring, Refactoring & Tool Scripting',
    description: 'Specialist for software architecture, code generation, script execution, and bug fixing.',
    capabilities: ['write_file', 'edit_file', 'run_command', 'git_operations'],
    defaultModel: 'qwen/qwen-2.5-coder-32b-instruct',
  },
  reviewer: {
    id: 'reviewer',
    name: 'Quality & Security Auditor',
    role: 'Verification, Static Analysis & Gatekeeping',
    description: 'Specialist for reviewing code changes, validating test outcomes, checking security boundaries, and confirming deliverables.',
    capabilities: ['review_diff', 'run_tests', 'audit_security', 'validate_contracts'],
    defaultModel: 'meta/llama-3.3-70b-instruct',
  },
  operator: {
    id: 'operator',
    name: 'Windows Desktop Operator',
    role: 'Native Windows OS, UIA & Multimedia Automation',
    description: 'Specialist for controlling native desktop windows, mouse clicks, keystrokes, UIA tree inspection, and browser automation.',
    capabilities: ['zero_computer_action', 'browser', 'open_app', 'focus_window', 'type_text', 'left_click'],
    defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
    requiresDesktopLease: true,
  },
});

export class AgentTeamOrchestrator extends EventEmitter {
  /**
   * @param {Object} options
   * @param {import('./index.mjs').TaskStateMachine} options.stateMachine
   * @param {AgentMessageBus} [options.messageBus]
   * @param {DesktopLeaseManager} [options.leaseManager]
   * @param {Object} [options.modelFabric]
   * @param {Object} [options.capabilityEngine]
   * @param {Object} [options.researchEngine]
   * @param {Object} [options.logger=console]
   */
  constructor({ stateMachine, messageBus = null, leaseManager = null, modelFabric = null, capabilityEngine = null, researchEngine = null, logger = console }) {
    super();
    if (!stateMachine) throw new Error('AgentTeamOrchestrator requires stateMachine instance');
    this.sm = stateMachine;
    this.bus = messageBus || new AgentMessageBus({ db: stateMachine.db });
    this.leaseManager = leaseManager || new DesktopLeaseManager();
    this.modelFabric = modelFabric || null;
    this.capabilityEngine = capabilityEngine || null;
    this.researchEngine = researchEngine || null;
    this.logger = logger;

    this.profiles = new Map(Object.entries(CANONICAL_AGENT_PROFILES));
    this.teams = new Map();

    this._registerDefaultTeam();
  }

  _registerDefaultTeam() {
    this.registerTeam({
      id: 'team_alpha_core',
      name: 'Alpha Core Autonomous Team',
      description: 'Default multidisciplinary team featuring ZERO coordinator and all core specialist agents.',
      leadAgentId: 'zero',
      members: ['zero', 'researcher', 'coder', 'reviewer', 'operator'],
    });
  }

  registerAgentProfile(profile) {
    if (!profile || !profile.id) throw new Error('Agent profile requires id');
    this.profiles.set(profile.id, {
      ...profile,
      registeredAt: Date.now(),
    });
    return this.profiles.get(profile.id);
  }

  getAgentProfile(agentId) {
    return this.profiles.get(agentId) || null;
  }

  listAgentProfiles() {
    return Array.from(this.profiles.values());
  }

  registerTeam({ id, name, description, leadAgentId = 'zero', members = [] }) {
    if (!id || !name) throw new Error('Team requires id and name');
    const team = {
      id,
      name,
      description: description || '',
      leadAgentId,
      members: members.length > 0 ? members : ['zero'],
      createdAt: Date.now(),
    };
    this.teams.set(id, team);
    return team;
  }

  getTeam(teamId) {
    return this.teams.get(teamId) || null;
  }

  listTeams() {
    return Array.from(this.teams.values());
  }

  /**
   * Automatically decompose a high-level goal into a structured multi-agent subtask DAG
   */
  planGoal(goal, { teamId = 'team_alpha_core', context = {} } = {}) {
    const team = this.getTeam(teamId);
    if (!team) throw new Error(`Team '${teamId}' not registered`);

    const lower = String(goal).toLowerCase();
    const subtasks = [];

    // Analyze intent to build specialized DAG
    const needsResearch = /research|find|investigate|search|analyze|data|benchmark|compare/.test(lower);
    const needsCoding = /code|build|implement|develop|fix|refactor|script|program/.test(lower);
    const needsDesktop = /desktop|open|launch|click|type|notepad|calc|browser|youtube|window|app/.test(lower);
    const needsReview = needsCoding || /verify|test|audit|review|check/.test(lower);

    let stepCounter = 1;
    let researchTaskId = null;
    let codingTaskId = null;
    let desktopTaskId = null;

    if (needsResearch || (!needsCoding && !needsDesktop)) {
      researchTaskId = `subtask_${stepCounter++}_research`;
      subtasks.push({
        id: researchTaskId,
        agentId: 'researcher',
        goal: `Conduct empirical investigation: ${goal}`,
        dependsOn: [],
        tools: ['web_search', 'read_file'],
      });
    }

    if (needsCoding) {
      codingTaskId = `subtask_${stepCounter++}_coding`;
      subtasks.push({
        id: codingTaskId,
        agentId: 'coder',
        goal: `Implement software specifications for: ${goal}`,
        dependsOn: researchTaskId ? [researchTaskId] : [],
        tools: ['write_file', 'edit_file', 'run_command'],
      });
    }

    if (needsDesktop) {
      desktopTaskId = `subtask_${stepCounter++}_desktop`;
      subtasks.push({
        id: desktopTaskId,
        agentId: 'operator',
        goal: `Execute Windows desktop automation actions for: ${goal}`,
        dependsOn: [],
        tools: ['zero_computer_action', 'browser'],
        requiresDesktopLease: true,
      });
    }

    if (needsReview && (codingTaskId || subtasks.length > 1)) {
      const reviewTaskId = `subtask_${stepCounter++}_review`;
      const deps = [];
      if (codingTaskId) deps.push(codingTaskId);
      if (desktopTaskId) deps.push(desktopTaskId);
      if (deps.length === 0 && researchTaskId) deps.push(researchTaskId);

      subtasks.push({
        id: reviewTaskId,
        agentId: 'reviewer',
        goal: `Audit outputs, verify requirements and check security constraints for: ${goal}`,
        dependsOn: deps,
        tools: ['review_diff', 'run_tests', 'audit_security'],
      });
    }

    // Fallback if no specific triggers fired
    if (subtasks.length === 0) {
      subtasks.push({
        id: `subtask_1_general`,
        agentId: 'zero',
        goal,
        dependsOn: [],
        tools: ['plan', 'delegate'],
      });
    }

    return {
      goal,
      teamId,
      subtasks,
      totalSubtasks: subtasks.length,
      leadAgentId: team.leadAgentId,
    };
  }

  /**
   * Execute multi-agent team workflow with DAG dependencies and desktop lease locking
   */
  async executeTeamWorkflow({
    goal,
    teamId = 'team_alpha_core',
    subtasks = null,
    sessionId = 'team-session',
    taskExecutors = {},
    timeoutMs = 60000,
    signal = null,
    maxToolRounds = 8,
    maxOutputTokens = 2048,
  }) {
    const startTime = Date.now();
    const team = this.getTeam(teamId);
    if (!team) throw new Error(`Team '${teamId}' not registered`);
    if (subtasks !== null && !Array.isArray(subtasks)) throw new Error('subtasks must be an array');

    // 1. Generate plan if not provided
    const plan = subtasks && subtasks.length > 0 ? { goal, teamId, subtasks } : this.planGoal(goal, { teamId });
    const taskPlan = plan.subtasks;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('timeoutMs must be positive');
    if (!Number.isInteger(maxToolRounds) || maxToolRounds < 1) throw new Error('maxToolRounds must be a positive integer');
    if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 8192) throw new Error('maxOutputTokens must be between 1 and 8192');
    const ids = new Set();
    for (const st of taskPlan) {
      if (typeof st.id !== 'string' || !st.id || ids.has(st.id) || !this.getAgentProfile(st.agentId)
        || typeof st.goal !== 'string' || !st.goal.trim()) throw new Error('Invalid subtask id, agent or goal');
      if (st.dependsOn !== undefined && !Array.isArray(st.dependsOn)) throw new Error('dependsOn must be an array');
      if (st.tools !== undefined && (!Array.isArray(st.tools) || st.tools.some((tool) => typeof tool !== 'string'))) throw new Error('tools must be an array of names');
      ids.add(st.id);
    }
    const visited = new Set();
    const visit = (st, path = new Set()) => {
      if (path.has(st.id)) throw new Error('Cyclic subtask dependencies');
      if (visited.has(st.id)) return;
      for (const dep of st.dependsOn || []) {
        if (!ids.has(dep)) throw new Error(`Unknown dependency '${dep}'`);
        visit(taskPlan.find((item) => item.id === dep), new Set([...path, st.id]));
      }
      visited.add(st.id);
    };
    taskPlan.forEach((st) => visit(st));
    signal?.throwIfAborted();

    // 2. Create Master Coordinator Task
    const masterTask = this.sm.createTask({
      sessionId,
      agentId: team.leadAgentId,
      goal: `[Team Execution] ${goal}`,
    });
    this.sm.enqueueTask(masterTask.id);
    this.sm.startTask(masterTask.id);
    const deadlineController = new AbortController();
    const timer = setTimeout(() => deadlineController.abort(new Error(`Team execution timed out after ${timeoutMs}ms`)), timeoutMs);
    const workflowSignal = AbortSignal.any([this.sm.getSignal(masterTask.id), deadlineController.signal, ...(signal ? [signal] : [])]);

    // Shared team blackboard
    const sharedContext = {
      goal,
      teamId,
      masterTaskId: masterTask.id,
      artifacts: [],
      subtaskResults: Object.create(null),
      subtaskStatuses: Object.create(null),
      errors: Object.create(null),
    };
    let checkpointIndex = 0;
    const checkpoint = (extra = {}) => this.sm.saveCheckpoint(masterTask.id, checkpointIndex++, { plan: taskPlan, ...sharedContext, ...extra }, sharedContext.artifacts);

    // Initialize subtask states
    for (const st of taskPlan) {
      sharedContext.subtaskStatuses[st.id] = 'PENDING';
    }
    checkpoint();

    this.bus.send({
      taskId: masterTask.id,
      fromAgentId: team.leadAgentId,
      toAgentId: '*',
      type: MESSAGE_TYPES.TASK_ASSIGNED,
      payload: { goal, subtasks: taskPlan },
    });

    const activePromises = new Map();

    // Helper to check if task prerequisites are completed
    const canRun = (st) => {
      if (sharedContext.subtaskStatuses[st.id] !== 'PENDING') return false;
      const deps = st.dependsOn || [];
      return deps.every((depId) => sharedContext.subtaskStatuses[depId] === 'COMPLETED');
    };

    // Helper to execute a single subtask
    const executeSubtask = async (st) => {
      sharedContext.subtaskStatuses[st.id] = 'RUNNING';

      // Delegate task in state machine
      const delegation = this.sm.delegateTask({
        parentTaskId: masterTask.id,
        childAgentId: st.agentId,
        goal: st.goal,
        permissions: st.tools || [],
      });
      const childTaskId = delegation.childTask.id;

      this.bus.send({
        taskId: childTaskId,
        fromAgentId: team.leadAgentId,
        toAgentId: st.agentId,
        type: MESSAGE_TYPES.TASK_ASSIGNED,
        payload: { parentTaskId: masterTask.id, subtaskId: st.id, goal: st.goal, tools: st.tools },
      });

      let leaseAcquired = false;
      const childSignal = AbortSignal.any([workflowSignal, this.sm.getSignal(childTaskId)]);

      try {
        // Desktop lease acquisition if required
        const profile = this.getAgentProfile(st.agentId);
        if (st.requiresDesktopLease || profile?.requiresDesktopLease) {
          this.logger.log(`[AgentTeamOrchestrator] Acquiring desktop lease for agent [${st.agentId}]...`);
          const leaseRes = await this.leaseManager.acquireLease(st.agentId, {
            reason: `Subtask execution: ${st.id}`,
            timeoutMs: 30000,
            waitMs: 15000,
            signal: childSignal,
          });
          if (!leaseRes.acquired) {
            throw new Error(`Failed to acquire desktop lease for [${st.agentId}]: Lease held by [${leaseRes.holder}]`);
          }
          leaseAcquired = true;
        }

        // Broadcast progress
        this.bus.send({
          taskId: childTaskId,
          fromAgentId: st.agentId,
          toAgentId: '*',
          type: MESSAGE_TYPES.STEP_PROGRESS,
          payload: { subtaskId: st.id, progressPct: 30, step: `Executing ${st.agentId} subtask` },
        });

        // Run specialist executor with real tool execution & assigned model
        let executor = Object.hasOwn(taskExecutors, st.id) ? taskExecutors[st.id]
          : Object.hasOwn(taskExecutors, st.agentId) ? taskExecutors[st.agentId] : null;
        if (!executor) {
          executor = (subtask, context) => executeSpecialist(this, subtask, context);
        }

        const dependencyResults = Object.fromEntries((st.dependsOn || []).map((id) => [id, sharedContext.subtaskResults[id]]));
        const result = await abortable(() => executor(st, {
          goal, teamId, masterTaskId: masterTask.id, childTaskId, signal: childSignal, maxToolRounds, maxOutputTokens,
          subtaskResults: structuredClone(dependencyResults),
        }), childSignal);
        childSignal.throwIfAborted();
        requireExecutionResult(result);

        // Record any artifact
        if (result?.artifact) {
          sharedContext.artifacts.push(result.artifact);
          this.bus.send({
            taskId: childTaskId,
            fromAgentId: st.agentId,
            toAgentId: '*',
            type: MESSAGE_TYPES.ARTIFACT_CREATED,
            payload: { subtaskId: st.id, artifact: result.artifact },
          });
        }

        // Complete child task
        if (this.sm.getTask(childTaskId).status !== TASK_STATUS.COMPLETED) this.sm.completeChildTask(childTaskId, result);

        sharedContext.subtaskStatuses[st.id] = 'COMPLETED';
        sharedContext.subtaskResults[st.id] = result;

        this.bus.send({
          taskId: childTaskId,
          fromAgentId: st.agentId,
          toAgentId: team.leadAgentId,
          type: MESSAGE_TYPES.TASK_COMPLETED,
          payload: { parentTaskId: masterTask.id, subtaskId: st.id, result },
        });

      } catch (err) {
        sharedContext.subtaskStatuses[st.id] = childSignal.aborted ? 'CANCELLED' : 'FAILED';
        sharedContext.errors[st.id] = err.message;

        const child = this.sm.getTask(childTaskId);
        if (!child.completedAt) {
          if (childSignal.aborted) this.sm.cancelTask(childTaskId, err.message);
          else this.sm.failChildTask(childTaskId, err.message);
        }

        this.bus.send({
          taskId: childTaskId,
          fromAgentId: st.agentId,
          toAgentId: team.leadAgentId,
          type: childSignal.aborted ? MESSAGE_TYPES.TASK_CANCELLED : MESSAGE_TYPES.TASK_FAILED,
          payload: { parentTaskId: masterTask.id, subtaskId: st.id, error: err.message },
        });

        // Mark all dependent subtasks as BLOCKED
        for (const other of taskPlan) {
          if (other.dependsOn?.includes(st.id) && sharedContext.subtaskStatuses[other.id] === 'PENDING') {
            sharedContext.subtaskStatuses[other.id] = 'BLOCKED';
            this.bus.send({
              taskId: masterTask.id,
              fromAgentId: team.leadAgentId,
              toAgentId: other.agentId,
              type: MESSAGE_TYPES.BLOCKED,
              payload: { subtaskId: other.id, blockedBy: st.id, reason: `Prerequisite subtask ${st.id} failed` },
            });
          }
        }
      } finally {
        if (leaseAcquired) {
          this.leaseManager.releaseLease(st.agentId);
        }
        checkpoint();
      }
    };

    // Execution loop: kick off eligible tasks until all are settled or timeout
    try {
    while (true) {
      if (workflowSignal.aborted) break;
      for (const st of taskPlan) {
        if (sharedContext.subtaskStatuses[st.id] === 'PENDING' && (st.dependsOn || []).some((id) => ['FAILED', 'BLOCKED', 'CANCELLED'].includes(sharedContext.subtaskStatuses[id]))) {
          sharedContext.subtaskStatuses[st.id] = 'BLOCKED';
          sharedContext.errors[st.id] = 'Prerequisite did not complete';
        }
      }

      // Check if all subtasks are finished or blocked
      const allSettled = taskPlan.every((st) => {
        const status = sharedContext.subtaskStatuses[st.id];
        return status === 'COMPLETED' || status === 'FAILED' || status === 'BLOCKED' || status === 'CANCELLED';
      });

      if (allSettled && activePromises.size === 0) {
        break;
      }

      // Find tasks ready to run
      const readyTasks = taskPlan.filter(canRun);
      for (const st of readyTasks) {
        const desktop = st.requiresDesktopLease || this.getAgentProfile(st.agentId)?.requiresDesktopLease;
        if (desktop && taskPlan.some((other) => other.agentId === st.agentId && activePromises.has(other.id))) continue;
        sharedContext.subtaskStatuses[st.id] = 'STARTING';
        const p = executeSubtask(st).finally(() => {
          activePromises.delete(st.id);
        });
        activePromises.set(st.id, p);
      }

      if (activePromises.size === 0 && !allSettled) {
        // Deadlock detected or all remaining blocked
        break;
      }

      // Wait for at least one active promise to settle
      if (activePromises.size > 0) {
        await Promise.race(Array.from(activePromises.values()));
      }
    }
    await Promise.all(activePromises.values());
    } finally {
      clearTimeout(timer);
    }
    if (workflowSignal.aborted) {
      for (const st of taskPlan) {
        if (['PENDING', 'STARTING'].includes(sharedContext.subtaskStatuses[st.id])) sharedContext.subtaskStatuses[st.id] = 'CANCELLED';
      }
    }

    // Consolidate final output by ZERO
    const completedCount = Object.values(sharedContext.subtaskStatuses).filter((s) => s === 'COMPLETED').length;
    const failedCount = taskPlan.length - completedCount;
    let synthesis = null;
    let consolidationError = null;
    if (this.modelFabric && failedCount === 0 && !workflowSignal.aborted) {
      const synthesisTimer = setTimeout(() => deadlineController.abort(new Error('Team consolidation timed out')), Math.max(1, timeoutMs - (Date.now() - startTime)));
      try {
        const modelId = this.modelFabric.resolveAgentModel(team.leadAgentId)?.canonicalModelId;
        if (!modelId) throw new Error('No coordinator model available');
        const response = await abortable(() => this.modelFabric.executeChat({
          model: modelId, stream: false, max_tokens: maxOutputTokens,
          messages: [{ role: 'system', content: 'Consolidate specialist results for the user. Preserve failures and limitations. Do not claim verification beyond recorded tool evidence.' },
            { role: 'user', content: JSON.stringify({ goal, results: sharedContext.subtaskResults, artifacts: sharedContext.artifacts }) }],
        }, { signal: workflowSignal }), workflowSignal);
        workflowSignal.throwIfAborted();
        synthesis = response?.data?.choices?.[0]?.message?.content;
        if (typeof synthesis !== 'string' || !synthesis.trim()) throw new Error(response?.data?.choices?.[0]?.finish_reason === 'length' ? 'Coordinator exhausted its output token budget before producing consolidation' : 'Coordinator returned empty consolidation');
        this.sm.recordStep(masterTask.id, { stepNumber: this.sm.getTaskSteps(masterTask.id).length + 1, toolName: 'team_consolidation', toolArgs: { modelId }, toolResult: synthesis, status: 'completed' });
      } catch (err) {
        consolidationError = err.message;
      } finally {
        clearTimeout(synthesisTimer);
      }
    }

    const consolidatedResult = {
      summary: `Autonomous team [${team.name}] processed goal with ${completedCount} subtasks succeeded, ${failedCount} failed/blocked.`,
      goal,
      totalSubtasks: taskPlan.length,
      completedSubtasks: completedCount,
      failedSubtasks: failedCount,
      results: { ...sharedContext.subtaskResults },
      artifacts: sharedContext.artifacts,
      errors: { ...sharedContext.errors },
      synthesis,
      consolidationError,
      completedAt: Date.now(),
    };

    const status = workflowSignal.aborted ? 'CANCELLED' : failedCount === 0 && !consolidationError ? 'COMPLETED' : 'FAILED';
    checkpoint({ consolidatedResult, status });
    if (workflowSignal.aborted) {
      if (this.sm.getTask(masterTask.id).status !== TASK_STATUS.CANCELLED) this.sm.cancelTask(masterTask.id, workflowSignal.reason?.message || 'Team cancelled');
    } else if (failedCount === 0 && !consolidationError) {
      if (this.sm.getTask(masterTask.id).status === TASK_STATUS.WAITING) this.sm.resumeTask(masterTask.id);
      this.sm.completeTask(masterTask.id, consolidatedResult);
    } else {
      this.sm.failTask(masterTask.id, JSON.stringify(consolidatedResult));
    }
    this.bus.send({ taskId: masterTask.id, fromAgentId: team.leadAgentId, toAgentId: '*',
      type: status === 'COMPLETED' ? MESSAGE_TYPES.TASK_COMPLETED : status === 'CANCELLED' ? MESSAGE_TYPES.TASK_CANCELLED : MESSAGE_TYPES.TASK_FAILED,
      payload: { status, consolidatedResult },
    });

    return {
      status,
      masterTaskId: masterTask.id,
      goal,
      teamId,
      plan: taskPlan,
      consolidatedResult,
      subtaskStatuses: { ...sharedContext.subtaskStatuses },
      durationMs: Date.now() - startTime,
    };
  }
}
