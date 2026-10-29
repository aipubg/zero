# ZERO AI — Personal Assistant

**Project entry point and coordination hub**  
Version 1.0 · 23 October 2026 · Workspace: `E:\zero`

Start with [`MASTER_PLAN.md`](MASTER_PLAN.md) for the full product and engineering roadmap, [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md) for durable user preferences, and [`START_TASKS.txt`](START_TASKS.txt) for the exact copy/paste task prompts for DeepSeek Harness, Qoder, and OpenCode.

## Mission

Build Zero AI as a private, single-user assistant: a familiar frontend, a backend team of specialist agents, and computer use in a designated Windows environment. Reuse open-source code wherever it fits; this is a new Zero product, not a rebrand or a full rewrite. Do not train a foundation model.

## Architecture direction

- **OpenClaw is the provisional backend/kernel baseline.** First prove the unmodified project and its current interfaces before forking or removing anything.
- **One configured model gateway** is the model-routing entry point. It may expose multiple providers/models. Confirm the actual gateway product and test OpenAI-compatible chat, streaming, model listing, tool calling, and vision where needed.
- **Frontend:** the **native OpenClaw Control UI** is the Zero product shell. Zero ships as the `app/zero-control-ui` plugin inside that shell; it reads the canonical Gateway agent roster, session catalog, history, and chat. The earlier React/CopilotKit/AG-UI prototype was retired on 2026-10-25. `app/src/bridge/` is retained only as a reusable, non-running Gateway bridge library (WS RPC, pairing, config validation). There is no second chat, session list, transcript store, or navigation shell, and no Vite/`5173` or legacy runtime/`4317` service.
- **Computer use:** target a dedicated Windows environment that Zero may control fully. Run the first experiment there (or in a VM/test account). OpenClaw's Windows CUA path is experimental; measure it before deciding whether to build a separate service. The personal app need not ask for approval on every action, but it must have a global stop/takeover control and a recovery path.
- **Team:** begin with OpenClaw's existing agent/sub-agent features. Add a coordinator/task board only for gaps demonstrated by the prototype.
- **Skills and plugins:** preserve OpenClaw's mechanisms; import a small, reviewed set of external skills. OpenMausBot and Hermes are design/code references only when a specific need is established. Qwen-AgentWorld is research material, not an app baseline.

## Delivery sequence

### Gate 0 — Feasibility spikes (no fork)

1. Inspect the lightweight source checkout and start OpenClaw locally only when the required package manager/dependencies are approved.
2. Confirm a normal chat, streaming, tool call, and restart/session behavior.
3. In the designated Zero computer environment (VM/test account preferred for the first spike), attempt a small computer-use task: open Notepad, enter text, save it, and verify the saved result. Record screen observation and takeover behavior.
4. Compare OpenClaw's Control UI with OpenDots/CopilotKit; list actual UX and backend integration gaps.
5. Record exact versions, commands, configuration names (secrets redacted), errors, and evidence in `reports/`.

**Gate decision:** the senior developer reviews the reports and approves the smallest next scope. Do not fork, mass-delete channels, import hundreds of skills, or grant the agent unrestricted access to the main Windows account during Gate 0.

### Gate 1 — Personal assistant MVP

- Single-user local setup, one gateway endpoint, one personal assistant and a small number of specialists.
- Chat, sessions, streaming, cost limits, logs, external skills, and inspectable/editable memory.
- Computer control isolated from the user's main profile, with a visible live view, pause/stop, and user takeover.

### Gate 2 — Team workflows

- Add task coordination, handoffs, budgets, retries, resumable work, and artifacts only as needed.
- Add specialist roster and activity timeline to the UI after the backend events are stable.

### Gate 3 — Custom product polish

- Custom frontend/desktop shell, Spaces, scheduled responsibilities, voice, and additional integrations in priority order.
- Maintain upstream tracking and a dependency/license inventory.

## Source projects and intended use

| Project | Intended use |
|---|---|
| OpenClaw | Provisional kernel: gateway, agents, tools, skills, plugins |
| OpenDots | UX reference: specialist workspace, pages, activity and computer panel; check Intelligence/deployment dependencies before reusing code |
| OpenMausBot | Reference for desktop/agent presentation and computer-view/takeover patterns; current drivers may not match API-only operation |
| Hermes Agent | Reference for memory/skill-learning ideas; do not add a second Python runtime without a demonstrated need |
| Qwen-AgentWorld | Research/evaluation reference, not the personal-assistant app baseline |

Preserve applicable upstream licenses, notices, attribution, and third-party licenses for any code or assets reused. Do not reuse project names, logos, mascots, or trademarks as the product identity.

## Team and ownership

- **ChatGPT — Senior Developer / Architect:** owns the plan, acceptance criteria, cross-agent coordination, architecture decisions, and independent review of reports.
- **DeepSeek Harness — Backend Developer:** OpenClaw baseline, model-gateway compatibility, agent/team/runtime, skills and memory backend.
- **Qoder — Computer-Use Developer:** Windows feasibility, isolated computer runtime, observation/action/verification loop, live view and takeover.
- **OpenCode — Frontend/Integration Developer:** Control UI assessment, assistant/agent experience, gateway event integration and UI prototype after Gate 0.

Full task definitions, milestones, integration design, and resource rules are in [`MASTER_PLAN.md`](MASTER_PLAN.md). Copy/paste startup messages are in [`START_TASKS.txt`](START_TASKS.txt). Assignments and dependencies are in [`TASK_BOARD.md`](TASK_BOARD.md). Each developer's detailed instructions are in their named `DEVELOPER_*.md` file. Shared coordination is in [`AGENT_CHAT.txt`](AGENT_CHAT.txt). Decisions go in [`DECISIONS.md`](DECISIONS.md); reports/evidence go under `reports/`.

## Coordination rules

1. Before starting, read this README, `MASTER_PLAN.md`, `PROJECT_MEMORY.md`, your developer file, `TASK_BOARD.md`, `DECISIONS.md`, and the recent tail of `AGENT_CHAT.txt`.
2. Claim a task on the board before editing. Keep work within your ownership area; announce cross-area changes first.
3. Work in a continuous lane loop: after each handoff, read the board and claim the next `READY` task in your lane. Do not pause just because a ticket is ready for senior review. If a dependency is pending, continue useful independent work in your lane. Ask another developer in `AGENT_CHAT.txt`; use `@manager` for ChatGPT when the other developer cannot resolve it or a cross-lane decision is needed.
4. Use append-only chat entries. Never rewrite or truncate prior messages. Include timestamp, author, task ID, and a clear `QUESTION`, `UPDATE`, `HANDOFF`, or `DECISION REQUEST` type.
5. Before moving to the next ticket, append a `HANDOFF` and update your row with summary, files changed, evidence/commands run, known limitations, and next step. Then continue through every unblocked pre-build task without waiting for review or asking routine questions. Stop only when the next action crosses the build gate: dependency/package/driver/VM install, compile/bundle, starting the runtime/app, calling a live gateway, or acting on a real desktop. At that point finish the build-readiness report, state exact resource needs and commands, and wait for the owner's go-ahead. Do not perform that gated action before approval.
6. Do not treat silence as completion. A task is complete only when its owner explicitly posts `HANDOFF` and updates the board. If you cannot access these files or the shared workspace, report that instead of claiming coordination occurred.
7. Do not overwrite another developer's edits. If there is a conflict, stop edits to the conflicting area, report it, and coordinate through the chat log.
8. The senior developer reviews reported work before marking a milestone accepted. Senior review is not a per-ticket stop gate. The owner approval gate is immediately before a build/install/run/live-action phase. The product target is full control inside the designated Zero computer environment, without per-action approval prompts; retain a global stop/takeover control and recovery path. Do not expose credentials or install unreviewed skills.

## Current state

The Zero UI lane is native-only as of 2026-10-25. The OpenClaw Gateway serves the
Control UI at `http://127.0.0.1:18789/`; Zero Team and Models & Providers are native
plugin pages, and Gateway sessions are the single source of truth. The legacy
React/CopilotKit/Vite product path is removed, including its `/api/copilotkit/threads`
route (the source of the `403`), and ports `4317`/`5173` are no longer used. The retained
`app/src/bridge/` code is a library, not a running service.

Offline verification: 37/37 native UI tests and 3/3 bridge tests pass, the bridge
typecheck passes, the bundle builds, and `verify-served.mjs` validates the manifest
generation. The fresh profile is loopback-only with no providers or secrets. Live
provider/model inference, real desktop input, and Gateway-restart activation remain
separate owner-gated steps; see `TASK_BOARD.md` and `reports/ui/`.
