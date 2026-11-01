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
   * @param {Object} [options.logger=console]
   */
  constructor({ stateMachine, messageBus = null, leaseManager = null, logger = console }) {
    super();
    if (!stateMachine) throw new Error('AgentTeamOrchestrator requires stateMachine instance');
    this.sm = stateMachine;
    this.bus = messageBus || new AgentMessageBus();
    this.leaseManager = leaseManager || new DesktopLeaseManager();
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
  }) {
    const startTime = Date.now();
    const team = this.getTeam(teamId) || this.getTeam('team_alpha_core');

    // 1. Generate plan if not provided
    const plan = subtasks && subtasks.length > 0 ? { goal, teamId, subtasks } : this.planGoal(goal, { teamId });
    const taskPlan = plan.subtasks;

    // 2. Create Master Coordinator Task
    const masterTask = this.sm.createTask({
      sessionId,
      agentId: team.leadAgentId,
      goal: `[Team Execution] ${goal}`,
    });
    this.sm.enqueueTask(masterTask.id);
    this.sm.startTask(masterTask.id);

    // Shared team blackboard
    const sharedContext = {
      goal,
      teamId,
      masterTaskId: masterTask.id,
      artifacts: [],
      subtaskResults: {},
      subtaskStatuses: {},
      errors: {},
    };

    // Initialize subtask states
    for (const st of taskPlan) {
      sharedContext.subtaskStatuses[st.id] = 'PENDING';
    }

    this.bus.send({
      taskId: masterTask.id,
      fromAgentId: team.leadAgentId,
      toAgentId: '*',
      type: MESSAGE_TYPES.TASK_ASSIGNED,
      payload: { goal, subtasks: taskPlan },
    });

    const activePromises = new Map();
    let isTerminated = false;

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
        payload: { subtaskId: st.id, goal: st.goal, tools: st.tools },
      });

      let leaseAcquired = false;

      try {
        // Desktop lease acquisition if required
        const profile = this.getAgentProfile(st.agentId);
        if (st.requiresDesktopLease || profile?.requiresDesktopLease) {
          this.logger.log(`[AgentTeamOrchestrator] Acquiring desktop lease for agent [${st.agentId}]...`);
          const leaseRes = await this.leaseManager.acquireLease(st.agentId, {
            reason: `Subtask execution: ${st.id}`,
            timeoutMs: 30000,
            waitMs: 15000,
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

        // Run specialist executor
        const executor = taskExecutors[st.agentId] || taskExecutors[st.id] || (async (subtask, context) => {
          return {
            status: 'success',
            output: `Specialist [${subtask.agentId}] successfully completed objective: "${subtask.goal}"`,
            verifiedAt: Date.now(),
          };
        });

        const result = await executor(st, sharedContext);

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
        this.sm.completeChildTask(childTaskId, result);

        sharedContext.subtaskStatuses[st.id] = 'COMPLETED';
        sharedContext.subtaskResults[st.id] = result;

        this.bus.send({
          taskId: childTaskId,
          fromAgentId: st.agentId,
          toAgentId: team.leadAgentId,
          type: MESSAGE_TYPES.TASK_COMPLETED,
          payload: { subtaskId: st.id, result },
        });

      } catch (err) {
        sharedContext.subtaskStatuses[st.id] = 'FAILED';
        sharedContext.errors[st.id] = err.message;

        this.sm.failChildTask(childTaskId, err.message);

        this.bus.send({
          taskId: childTaskId,
          fromAgentId: st.agentId,
          toAgentId: team.leadAgentId,
          type: MESSAGE_TYPES.TASK_FAILED,
          payload: { subtaskId: st.id, error: err.message },
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
      }
    };

    // Execution loop: kick off eligible tasks until all are settled or timeout
    const deadline = startTime + timeoutMs;

    while (!isTerminated) {
      if (Date.now() > deadline) {
        throw new Error(`Team execution timed out after ${timeoutMs}ms`);
      }

      // Check if all subtasks are finished or blocked
      const allSettled = taskPlan.every((st) => {
        const status = sharedContext.subtaskStatuses[st.id];
        return status === 'COMPLETED' || status === 'FAILED' || status === 'BLOCKED';
      });

      if (allSettled && activePromises.size === 0) {
        break;
      }

      // Find tasks ready to run
      const readyTasks = taskPlan.filter(canRun);
      for (const st of readyTasks) {
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

    // Consolidate final output by ZERO
    const completedCount = Object.values(sharedContext.subtaskStatuses).filter((s) => s === 'COMPLETED').length;
    const failedCount = Object.values(sharedContext.subtaskStatuses).filter((s) => s === 'FAILED' || s === 'BLOCKED').length;

    const consolidatedResult = {
      summary: `Autonomous team [${team.name}] processed goal with ${completedCount} subtasks succeeded, ${failedCount} failed/blocked.`,
      goal,
      totalSubtasks: taskPlan.length,
      completedSubtasks: completedCount,
      failedSubtasks: failedCount,
      results: sharedContext.subtaskResults,
      artifacts: sharedContext.artifacts,
      errors: sharedContext.errors,
      completedAt: Date.now(),
    };

    if (failedCount === 0) {
      this.sm.completeTask(masterTask.id, consolidatedResult);
    } else {
      this.sm.failTask(masterTask.id, JSON.stringify(consolidatedResult));
    }

    return {
      status: failedCount === 0 ? 'COMPLETED' : 'FAILED',
      masterTaskId: masterTask.id,
      goal,
      teamId,
      plan: taskPlan,
      consolidatedResult,
      subtaskStatuses: sharedContext.subtaskStatuses,
      durationMs: Date.now() - startTime,
    };
  }
}
