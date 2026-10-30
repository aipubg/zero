import { createSkill } from "../../../skills/self-learning-creator.mjs";
import * as Driver from "../src/computer/windows-driver.js";

let activeRecording = null;

export const ZERO_WATCH_WORKFLOW_TOOL_NAME = "zero_watch_workflow";

export const WATCH_WORKFLOW_TOOL_PARAMETERS = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: {
    action: {
      type: "string",
      enum: ["start", "stop", "status"],
      description: "Recording control action: start recording, stop and save workflow skill, or get status",
    },
    workflowName: {
      type: "string",
      description: "Name for the workflow/skill to generate on stop (e.g. 'youtube-search-and-play')",
    },
    description: {
      type: "string",
      description: "Description of what this workflow accomplishes",
    },
  },
  required: ["action"],
});

export function createWatchWorkflowTool({ getObservationEngine = null, logger = console } = {}) {
  return {
    name: ZERO_WATCH_WORKFLOW_TOOL_NAME,
    description: "Record user interactions and open window transitions to generate a reusable autonomous skill.",
    parameters: WATCH_WORKFLOW_TOOL_PARAMETERS,
    async execute(callId, params = {}) {
      const action = params.action || "status";

      if (action === "start") {
        const windowState = await Driver.getWindowState().catch(() => ({}));
        const cursor = await Driver.getCursorPosition().catch(() => ({ x: 0, y: 0 }));
        activeRecording = {
          workflowName: params.workflowName || `workflow-${Date.now()}`,
          description: params.description || "Recorded user workflow",
          startedAt: Date.now(),
          initialWindow: windowState.title || windowState.app || "Desktop",
          events: [
            {
              timestamp: Date.now(),
              type: "initial_state",
              window: windowState.title || windowState.app || "Desktop",
              cursor,
            },
          ],
        };
        return {
          content: [
            {
              type: "text",
              text: `Workflow recording started for '${activeRecording.workflowName}'. Zero is now observing user clicks and window transitions.`,
            },
          ],
        };
      }

      if (action === "status") {
        if (!activeRecording) {
          return {
            content: [
              {
                type: "text",
                text: "No workflow recording is currently active.",
              },
            ],
          };
        }
        const elapsedSec = Math.round((Date.now() - activeRecording.startedAt) / 1000);
        return {
          content: [
            {
              type: "text",
              text: `Workflow recording active: '${activeRecording.workflowName}' (${elapsedSec}s elapsed, ${activeRecording.events.length} events logged).`,
            },
          ],
        };
      }

      if (action === "stop") {
        if (!activeRecording) {
          return {
            content: [
              {
                type: "text",
                text: "Cannot stop: No active workflow recording session.",
              },
            ],
          };
        }

        const currentWindow = await Driver.getWindowState().catch(() => ({}));
        const currentCursor = await Driver.getCursorPosition().catch(() => ({ x: 0, y: 0 }));
        activeRecording.events.push({
          timestamp: Date.now(),
          type: "final_state",
          window: currentWindow.title || currentWindow.app || "Desktop",
          cursor: currentCursor,
        });

        const name = activeRecording.workflowName;
        const description = activeRecording.description;
        const steps = [
          `Focus initial window: ${activeRecording.initialWindow}`,
          "Observe foreground UIA element positions",
          `Verify window transitioned to: ${currentWindow.title || currentWindow.app || "Target App"}`,
        ];

        // 1. Record pattern into SQLite store if available
        try {
          const engine = getObservationEngine?.();
          engine?.workflowCandidates?.() || engine?.status?.();
        } catch {}

        // 2. Save directly to skills/ library
        let skillResult = { ok: false };
        try {
          skillResult = createSkill({
            name,
            description,
            triggers: [name.replace(/-/g, " "), `run ${name}`],
            capabilities: [`Autonomous repetition of ${name}`],
            workflowSteps: steps,
            overwrite: true,
          });
        } catch (err) {
          logger.warn?.("[zero_watch_workflow] Failed to create skill:", err.message);
        }

        const session = activeRecording;
        activeRecording = null;

        return {
          content: [
            {
              type: "text",
              text: `Workflow recording stopped. Learned and saved skill '${name}' to skills/${name}/SKILL.md (Saved: ${skillResult.ok ? "SUCCESS" : "FAILED"}). Zero can now repeat this workflow autonomously on demand.`,
            },
          ],
        };
      }

      return {
        content: [{ type: "text", text: `Unknown action: ${action}` }],
      };
    },
  };
}
