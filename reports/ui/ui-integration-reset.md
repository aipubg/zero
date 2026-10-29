# Zero UI Integration Reset — D-012

Date: 2026-10-23 01:36 UTC  
Owner: ChatGPT (Senior Developer)  
Decision: `DECISIONS.md` D-012

**Status update 2026-10-25:** the consolidation is implemented. The legacy
React/CopilotKit/AG-UI client and its Hono/Vite runtime were deleted; the native
Control UI plugin is the only product UI, and `app/src/bridge/` is a non-running
library. See `DECISIONS.md` D-015 and `reports/ui/provider-manager-ui.md` §22.
The rest of this file is the original 2026-10-23 plan and historical evidence.

## Owner's correction

The target is one Zero product and one integrated UI. The existing OpenClaw Control UI is already a full Gateway-connected interface, so Zero should use it as the product shell and merge selected capabilities from OpenDots and OpenMausBot into that same application. The current standalone React/CopilotKit screen was built as a useful bridge prototype, but it is not the intended permanent second UI.

The goal is source reuse and consolidation, not running multiple assistants beside each other. There must be one assistant entry point, one navigation model, one session/history source (OpenClaw Gateway), one agent runtime, and one product window. No CopilotKit Intelligence service or duplicate transcript store is in scope.

## What CopilotKit was doing

CopilotKit is a frontend/runtime SDK used by the current React prototype to render chat and carry AG-UI events. It is not an AI model, and Zero is not using it as its own LLM provider. The Gateway/NVIDIA route produced the model response. Its current presence reflects the earlier UI architecture decision, which D-012 supersedes for the final product.

The existing Zero app already proved useful things: a server-held Gateway connection, session-backed chat, streamed model text, stop route, specialist selection, activity/computer panels, and the basic Zero branding. Preserve and migrate verified work where it fits. Do not continue extending it into an independent product UI.

## Architecture constraints

- Main UI: pinned OpenClaw Control UI shell.
- Backend: the existing OpenClaw Gateway, with the configured NVIDIA API route; do not create a second assistant backend.
- Conversation state: Gateway sessions/history remain canonical.
- Source reuse: take compatible OpenClaw UI components directly; reuse selected OpenDots/OpenMausBot code only after checking licenses and dependency/runtime fit.
- Framework fact to prove: OpenClaw Control UI is Solid; current app/OpenDots UI is React. Source components cannot be assumed to compose directly. Inspect actual plugin/extension/build seams before choosing native Solid adaptation, a small embedded React mount, or a downstream UI package.
- `upstream/openclaw` stays read-only. Zero-owned integration/customization stays in `app/` and its reports, or another explicitly documented downstream overlay.
- A React island is acceptable only if a small implementation proves it yields one cohesive UI without duplicated navigation, threads, or transcripts and has lower maintenance cost than using the Control UI's native seams.
- CopilotKit SDK/runtime dependencies are removed only after the integrated Control UI path covers the required behavior and passes verification. Do not remove a working bridge before its replacement is proved.
- Keep relevant copyright/license/NOTICE attribution for every reused or adapted source file.

## Work sequence

1. **UI-REBASE (OpenCode):** compare the pinned Control UI shell/extension seams against the current app. Publish a source-backed integration choice and a short implementation map; prototype the smallest integrated Zero surface. Keep moving into implementation after the source audit.
2. **Gateway contract alignment (Qoder):** continue backend acceptance and BE-03 while keeping Gateway sessions, model routing, agent roster, and history single-source. Coordinate only required Control UI methods/events with OpenCode.
3. **Computer UI alignment (Qoder):** send OpenCode the confirmed `desktop.observe` ticket/scope, `desktop.release` cleanup, global hold (`scope: global`), and `controlLeaseId` facts; advise the Computer view integration against the same Control UI shell. Keep actual desktop actions gated on the isolated Zero Windows target.
4. **Feature merge:** migrate only the useful Zero capabilities into the single shell: assistant chat/session history, Lead/specialist visibility, tool/task activity, STOP ALL, computer live view/takeover, then skills/memory/artifacts. Reuse existing OpenClaw Control UI features when already present.
5. **Retire duplicate path:** once one-shell parity works, remove unused CopilotKit routes/SDK/packages and any second navigation/transcript path; keep only bridge code proven necessary. Record removed packages and update NOTICE/reuse ledger.
6. **Acceptance:** run one UI against one live Gateway; verify chat, history, stop, activity, agent team, and computer affordances. Real observe/input/takeover still require the designated isolated environment.

## Acceptance checks

- User opens one Zero interface; no parallel Control UI and CopilotKit assistant screens are required for normal use.
- One visible conversation history corresponds to one canonical Gateway session.
- User can chat to the Lead; agent work/team activity is visible in the same shell.
- Stop and computer-control status are exposed in that shell; hold is represented globally as the plugin reports it.
- Selected OpenDots/OpenMausBot capabilities have source/provenance entries and run without their separate product services.
- CopilotKit Intelligence is absent. CopilotKit package presence is justified only by a proven implementation need; otherwise it is removed.
- Build/runtime evidence and remaining isolated-desktop requirements are documented before any completion claim.

## Immediate next work

OpenCode starts UI-REBASE from `START_TASKS.txt`. Qoder owns the backend handover and computer lane; DeepSeek Harness is inactive. Senior reviews each handoff against source/runtime evidence and keeps both active developer lanes moving. This direction does not ask for another owner GO; the prior authorization for routine local build/runtime work remains in effect.
