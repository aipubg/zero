
ZERO AI
MASTER PRODUCT VISION, TARGET ARCHITECTURE, REPOSITORY TRANSFORMATION,
FEATURE DEVELOPMENT ROADMAP, AND ENGINEERING EXECUTION DIRECTIVE

Project: ZERO AI
Repository: https://github.com/aipubg/zero
Target Platforms: Windows-first, followed by mobile, cloud, and distributed workers
Current Development Interface: Chat-based control
Future Primary Interface: Real-time conversational voice
Long-Term Product Vision: A JARVIS/FRIDAY-class autonomous personal and enterprise AI assistant

DOCUMENT STATUS: MASTER PLANNING AND FUTURE IMPLEMENTATION DIRECTIVE

This document defines what ZERO AI must become, what functionality must exist,
how its systems must work together, how the existing project should be
transformed, and the required implementation order.

This is a development specification, not a claim that the described features
are already implemented.

No code deletion, repository mutation, runtime restart, or deployment is
authorized merely by producing this roadmap.

======================================================================
00. THE SINGLE BIGGEST ENGINEERING RISK
======================================================================

The primary failure mode is building an impressive-looking collection of
AI features without creating one dependable system that can actually use
those features together.

ZERO must not become:

- A chatbot with decorative agent names.
- A collection of disconnected tools.
- A gateway that can list models but cannot coordinate them.
- A plugin directory whose plugins cannot execute.
- A memory screen that cannot retrieve useful memories.
- A computer-control demo that only understands predetermined commands.
- A multi-agent interface where every agent is actually the same execution.
- A background task system that loses its work after a restart.
- A screen observer that continuously consumes resources without creating
  useful context.
- A voice interface connected to a backend that cannot perform real work.
- A renamed copy of another assistant that still depends on its original
  runtime or interface assumptions.

The engineering objective is to construct one coherent, extensible and
reliable autonomous computing platform.

Every major subsystem must be usable by the central ZERO assistant, by its
specialist agents, by background jobs, and eventually by voice and mobile
interfaces.

A subsystem is not complete merely because its code exists, an HTTP route
returns 200, or a unit test passes.

It is complete only when its intended real-world workflow works, the
outcome is independently verified, errors are correctly reported, and
other existing capabilities remain functional.

======================================================================
01. WHAT WE ARE BUILDING
======================================================================

ZERO AI is being developed as an always-available, local-first,
multimodal, multi-model, multi-agent autonomous assistant and computer
operating platform.

The functional ambition is comparable to the role played by JARVIS and
FRIDAY in Iron Man: a persistent intelligent assistant that understands
its environment, maintains context, coordinates other intelligent
systems, uses tools, controls devices, performs useful work and can
eventually communicate naturally by voice.

The target is that class of functionality, not a superficial recreation
of a fictional interface or a collection of hardcoded cinematic commands.

ZERO must have a persistent assistant identity and a unified operational
context.

It must be able to:

1. Understand requests expressed in natural language.
2. Determine the user's actual objective.
3. Inspect the relevant environment and available resources.
4. Decide whether the task can be handled directly or requires planning.
5. Choose appropriate AI models and specialist agents.
6. Discover and use installed skills, plugins and connected services.
7. Execute work through APIs, local processes, browsers, computers or
   other connected devices as appropriate.
8. Observe the results of its actions.
9. Detect errors and recover where possible.
10. Maintain useful information across conversations and tasks.
11. Coordinate multiple parallel and long-running operations.
12. Continue authorized background work while the user is occupied.
13. Provide accurate progress and outcome reporting.
14. Remember the state of the user's ongoing activities.
15. Eventually support natural, interruptible, low-latency voice
    communication without changing the underlying execution system.

ZERO is not intended to perform only a predetermined set of demonstrations.

Any examples in product discussions, including opening applications,
playing media, researching a subject, creating websites, supporting
business operations or coordinating employees, are illustrations of
broader capability categories.

These examples must never be converted into an exclusive list of supported
commands or hardcoded prompt patterns.

The system must generalize to new tasks by combining models, tools,
skills, agents and environmental observations.

======================================================================
02. PRODUCT IDENTITY AND NON-NEGOTIABLE DESIGN DECISIONS
======================================================================

2.1 One Central Assistant

The user interacts with ONE primary assistant: ZERO.

ZERO may use many internal specialist agents, models, tools and workers,
but the user should not have to manage that complexity for ordinary tasks.

The main assistant owns conversational continuity, task orchestration,
user preferences, session context and final results.

Specialist agents are execution resources, not disconnected replacement
assistants.

2.2 One Canonical Backend

There must be one authoritative ZERO execution architecture.

Do not retain multiple competing gateways, session stores, task systems,
agent loops or plugin registries unless they have clearly defined,
non-overlapping responsibilities.

Existing implementations may be migrated gradually, but the final
architecture must have a single source of truth per responsibility.

2.3 Preserve Useful Existing Functionality

The current repository is a starting asset, not something to destroy
blindly.

Existing useful OpenClaw-derived behavior, model integrations, tools,
skills, plugin interfaces, channels, session management and desktop
capabilities should be retained or functionally replaced.

The goal is to preserve useful capabilities while engineering a coherent
ZERO-owned architecture.

Do not delete mature functionality merely because it is inherited from
another codebase.

Do not preserve defective functionality merely because it already exists.

2.4 Current UI Remains During Core Development

The current application interface is a temporary development and
operational interface.

Do not initiate a comprehensive UI redesign during the core capability
development stages.

The existing chat, navigation, settings, models, agents, tools, memory,
skills and plugin surfaces must remain accessible and functional.

Repair functional integration defects when implementation begins, but
do not spend this stage rebuilding visual branding and page layouts.

A future ZERO-specific interface will replace the presentation layer
after the backend capabilities are stable.

2.5 Chat First, Voice Later

All assistant capabilities must first operate through chat and
programmatic APIs.

Voice will later become the primary interaction method, but it must use
the same task engine, memory, agents, model gateway and capability system.

Do not create separate "voice-only intelligence" and "chat intelligence."

Both must be interfaces to the same ZERO runtime.

2.6 Local-First, Extensible Execution

ZERO should preferentially use local processing when feasible.

It must also support external AI providers, cloud workers, remote
services and mobile devices.

Local-first does not mean local-only.

The architecture should dynamically select execution resources based
on the task, capability requirements, cost, latency, privacy preferences
and available hardware.

2.7 Owner-Oriented Operation

The owner wants a powerful, low-friction assistant that can operate the
owner's computer and connected systems.

Design a trusted-owner local operating mode with broad explicitly
configured capabilities and minimal unnecessary interaction friction.

Separate this from untrusted network access, remote callers and newly
installed third-party code.

Remote connectivity and externally supplied plugins must not inherit
trusted-owner authority merely because they reach the gateway.

2.8 No Artificial Feature Completion

Do not replace real functionality with:

- Synthetic success messages.
- Mock completion objects in production.
- Preselected responses for demonstration prompts.
- Fake agent delegation.
- Fake streaming.
- Fake plugin installation.
- Empty settings pages.
- Route fallbacks counted as working application pages.
- Tests that only verify that a file or button exists.

======================================================================
03. THE COMPLETE ZERO AI CAPABILITY MODEL
======================================================================

The final product must contain the following major capability domains.

DOMAIN A: CENTRAL INTELLIGENCE
- Natural-language task understanding.
- Context-aware planning.
- Dynamic tool selection.
- Structured reasoning workflows.
- Task decomposition.
- Decision-making based on observations and results.
- Self-correction after failed execution.
- Reliable final-answer generation.
- Configurable initiative and background autonomy.
- Consistent assistant identity.

DOMAIN B: MULTI-MODEL INTELLIGENCE
- Multiple online model providers.
- Multiple local model runtimes.
- Multiple simultaneously available models.
- Independent model assignments for agents.
- Dynamic model switching within a task.
- Reasoning, coding, vision, retrieval and lightweight model roles.
- Provider health monitoring.
- Streaming, cancellation, retries and fallbacks.
- Model capability discovery.
- Context-window and token-budget management.
- Usage and cost accounting.

DOMAIN C: MULTI-AGENT WORKFORCE
- Primary assistant and specialist worker agents.
- Parallel task execution.
- Hierarchical task delegation.
- Agent-to-agent communication.
- Shared and private agent context.
- Persistent agent identities.
- Workspaces and assigned tools.
- Inter-agent result verification.
- Resource allocation.
- Task dependency management.
- Agent lifecycle management.
- Reusable agent teams.

DOMAIN D: COMPUTER OPERATION
- Windows desktop observation.
- Screen interpretation.
- Accurate mouse and keyboard interaction.
- Window and application management.
- Native UI Automation.
- Browser operation.
- File system operations.
- Local shell and development tools.
- Clipboard and document operations.
- Multi-monitor understanding.
- Action verification.
- Recovery from UI changes.
- Coordination between desktop-control agents.

DOMAIN E: CONTINUOUS ENVIRONMENTAL AWARENESS
- Always-running local screen observation service.
- Efficient frame capture.
- Change detection.
- Local OCR.
- Local vision understanding.
- Short-lived visual memory.
- Persistent semantic observations.
- Activity and application context.
- Event-based retrieval.
- Context updates without constant heavy-model inference.
- Optional future audio-observation integration.

DOMAIN F: LONG-TERM MEMORY
- Conversational memory.
- Personal preferences.
- Task and project memory.
- Episodic memory.
- Semantic memory.
- Procedural knowledge.
- Environmental observation memory.
- Agent-specific memory.
- Organization and workspace memory.
- Searchable evidence references.
- Memory correction, expiry, deletion and consolidation.

DOMAIN G: SKILLS
- Discover skills.
- Install third-party skills.
- Create custom skills.
- Import compatible community skills.
- Configure and update skills.
- Discover available skills automatically.
- Select skills according to task requirements.
- Execute skills through ZERO's tool infrastructure.
- Persist skill-specific data and configuration.
- Publish and distribute ZERO skills.

DOMAIN H: PLUGINS AND EXTENSIONS
- Support compatible inherited plugin interfaces.
- Native ZERO plugins.
- Third-party plugin installation.
- Plugin lifecycle management.
- Plugin-provided tools.
- Plugin-provided settings.
- Plugin-provided integrations.
- Plugin capability discovery.
- Plugin version management.
- Plugin execution and diagnostics.
- ZERO plugin marketplace architecture.

DOMAIN I: WEB, RESEARCH AND FILE INTELLIGENCE
- Web browsing and structured web automation.
- Search provider integration.
- Research across multiple sources.
- Extraction and summarization.
- File discovery and organization.
- PDF, document and spreadsheet workflows.
- Coding and repository workflows.
- Data processing.
- Downloads and generated artifacts.
- Verification of external information.
- Browser-based actions when APIs are unavailable.

DOMAIN J: AUTONOMOUS BACKGROUND WORK
- Durable job queue.
- Event-driven tasks.
- Scheduled tasks.
- Recurring workflows.
- Workflow templates.
- Long-running task persistence.
- Pause, resume, cancel and retry.
- Restart recovery.
- Failure handling.
- Progress checkpoints.
- Notifications.
- Task dependencies.
- Resource and cost budgets.

DOMAIN K: CONNECTED DEVICES AND REMOTE EXECUTION
- Windows host control.
- Additional computers.
- Remote workers.
- Cloud execution environments.
- Mobile companion applications.
- Android integration.
- iOS integration within platform limitations.
- Device registration.
- Device-specific capabilities.
- Cross-device synchronization.
- Remote task handoff.

DOMAIN L: PERSONAL AND ORGANIZATIONAL OPERATIONS
- Personal productivity workflows.
- Research and learning assistance.
- Project execution.
- Software development.
- Content and document production.
- Team task coordination.
- Business-system integrations.
- CRM and sales workflows.
- Administrative automation.
- Reporting and analytics.
- Multi-user organizational workspaces.
- Role-aware business automation.
- Workflow auditing and measurable outcomes.

DOMAIN M: FUTURE REAL-TIME VOICE
- Wake and activation methods.
- Streaming speech recognition.
- Natural low-latency speech generation.
- Interruptible conversations.
- Barge-in handling.
- Spoken progress reports.
- Voice-directed computer operation.
- Voice-directed agent delegation.
- Shared chat/voice context.
- Local and cloud speech engines.
- Multilingual conversation support.

All these domains are parts of one platform.

Do not build each domain as a separate assistant with its own isolated
execution logic.

======================================================================
04. TARGET SYSTEM ARCHITECTURE
======================================================================

The system should follow this logical architecture:

                         ZERO AI
                   PRIMARY ASSISTANT
                             |
                 CONVERSATIONAL CORE
                             |
                 TASK PLANNER / ROUTER
                             |
           +-----------------+------------------+
           |                 |                  |
      MODEL FABRIC      AGENT ORCHESTRATOR   MEMORY
           |                 |                  |
      MODEL POOL         AGENT WORKFORCE    CONTEXT
           |                 |                  |
           +-----------------+------------------+
                             |
                    CAPABILITY ENGINE
                             |
      +----------------------+-----------------------+
      |            |             |           |        |
   SKILLS       PLUGINS       COMPUTER     WEB      FILES
      |            |             |           |        |
      +----------------------+-----------------------+
                             |
                     EXECUTION SERVICES
                             |
        +--------------------+--------------------+
        |                    |                    |
   LOCAL WINDOWS       CLOUD WORKERS        MOBILE DEVICES
        |                    |                    |
        +--------------------+--------------------+
                             |
                    OBSERVATION / EVENTS
                             |
                 VERIFICATION / FEEDBACK
                             |
                   TASK STATE + MEMORY
                             |
                    PRIMARY ASSISTANT
                             |
                CHAT NOW / VOICE LATER

A task must flow through a consistent lifecycle:

USER INTENT
  -> CONTEXT RETRIEVAL
  -> PLAN
  -> MODEL/AGENT/TOOL SELECTION
  -> EXECUTION
  -> OBSERVATION
  -> VERIFICATION
  -> STATE UPDATE
  -> MEMORY UPDATE
  -> USER REPORT

This loop must operate for simple and complex tasks.

Simple commands should take a short path without unnecessary orchestration.

Complex work should be decomposed into persistent, independently tracked
execution steps.

======================================================================
05. EXISTING REPOSITORY TRANSFORMATION STRATEGY
======================================================================

The developer must transform the existing codebase in place, using a
controlled migration process.

Do not start a second unrelated ZERO product repository unless there is
a specifically demonstrated technical requirement.

Do not delete the current project and start over from empty files.

Do not maintain permanent parallel systems that do the same job.

The repository transformation must proceed through five classifications.

CLASS A: KEEP AND STRENGTHEN

Retain implementations that are structurally useful and can meet the
new product contracts.

Candidates include:

- packages/model-fabric/
- packages/agent-runtime/
- packages/capability-engine/
- packages/gateway-protocol/
- packages/sessions/
- packages/tasks/
- packages/memory/
- packages/automation/
- services/host/
- app/zero-control-ui/
- app/zero-control-ui/src/computer/
- Existing useful skills and plugins.
- Existing channel and provider integrations.
- Existing model configuration templates.
- Existing migration scripts and compatibility tests.

These are candidates, not declarations that every implementation is correct.

Each must be inspected for completeness, real usage and integration quality.

CLASS B: REFACTOR OR REBUILD

Refactor modules that contain useful functionality but cannot satisfy
the required interfaces.

Examples:

- A gateway supporting only part of the frontend RPC contract.
- A memory store lacking contextual retrieval and update flows.
- A plugin loader that registers a name but cannot execute the plugin.
- An agent runtime with persistent task records but no real agent loop.
- A desktop controller that relies on fixed screen coordinates.
- A model gateway that cannot distinguish agent model assignments.
- A screen observer that consumes excessive CPU or RAM.
- A UI page that renders but has no working backend interaction.

Retain the relevant functionality while rebuilding the defective interface.

CLASS C: COMPATIBILITY ADAPTERS

Preserve compatibility interfaces until all required consumers have
been migrated.

Examples:

- Legacy gateway RPC compatibility.
- Existing skills metadata and command formats.
- Existing plugin SDK interfaces.
- Existing session formats.
- Existing channel integrations.
- Existing application and frontend bridge contracts.

Adapters must be isolated behind explicit boundaries and accompanied by
contract tests.

Compatibility does not require the permanent use of another product's
entire runtime.

CLASS D: RETIRE AFTER VERIFIED REPLACEMENT

Remove code only when:

1. Its responsibility is documented.
2. All current callers have been identified.
3. Replacement functionality exists.
4. The replacement passes actual integration tests.
5. Existing user data has been migrated or preserved.
6. Rollback has been tested.
7. No required feature disappears.

Likely retirement candidates include:

- Duplicate gateway implementations.
- Unused alternate session managers.
- Redundant agent loops.
- Obsolete mock and simulation handlers.
- Legacy startup monkeypatching.
- Direct modifications to generated browser bundles.
- Abandoned experimental prototype scripts.
- Unsupported duplicate model provider catalogs.
- Obsolete branding replacement utilities.
- Version-hashed upstream runtime imports.
- Redundant test harnesses that assert the same fake behavior.
- Legacy runtime dependencies after verified functional independence.

An upstream SDK or runtime dependency must not be removed merely because
its name appears in the dependency list.

First identify whether any active feature still depends on it.

CLASS E: NEVER DELETE WITHOUT EXPLICIT DATA MIGRATION

Never casually delete:

- User conversations.
- Existing session history.
- SQLite databases.
- Memory records.
- Agent task history.
- Installed skills.
- Installed plugins.
- Connection configurations.
- User-created agents.
- Existing workflow definitions.
- Automation schedules.
- User-generated files.
- Project workspaces.
- Credential references.
- Backups and migration records.

A code-cleanup operation must not destroy user state.

Before every substantial deletion, create a manifest of the affected
files, references, replacement modules and rollback instructions.

======================================================================
06. PROPOSED FUTURE REPOSITORY ORGANIZATION
======================================================================

The current directory layout should evolve toward this structure.

zero/
|
|-- apps/
|   |-- control-ui/
|   |-- desktop/
|   |-- mobile/
|   |-- admin/
|
|-- services/
|   |-- zero-host/
|   |-- model-gateway/
|   |-- agent-orchestrator/
|   |-- task-scheduler/
|   |-- observation-service/
|   |-- memory-service/
|   |-- plugin-manager/
|   |-- skill-manager/
|   |-- notification-service/
|   |-- device-coordinator/
|   |-- voice-service/
|
|-- packages/
|   |-- protocol/
|   |-- model-fabric/
|   |-- agent-runtime/
|   |-- capability-engine/
|   |-- task-engine/
|   |-- session-store/
|   |-- memory-engine/
|   |-- screen-intelligence/
|   |-- tool-registry/
|   |-- plugin-sdk/
|   |-- skill-sdk/
|   |-- workflow-engine/
|   |-- configuration/
|   |-- event-bus/
|   |-- observability/
|   |-- shared-types/
|
|-- workers/
|   |-- windows/
|   |-- browser/
|   |-- cloud/
|   |-- mobile/
|   |-- coding/
|   |-- research/
|
|-- integrations/
|   |-- model-providers/
|   |-- channels/
|   |-- mcp/
|   |-- external-services/
|   |-- legacy-compat/
|
|-- skills/
|   |-- builtin/
|   |-- installed/
|   |-- user-created/
|
|-- plugins/
|   |-- builtin/
|   |-- installed/
|   |-- adapters/
|
|-- data/
|   |-- migrations/
|   |-- schemas/
|
|-- tests/
|   |-- unit/
|   |-- integration/
|   |-- contract/
|   |-- e2e/
|   |-- windows/
|   |-- browser/
|   |-- endurance/
|   |-- recovery/
|
|-- scripts/
|-- docs/
|-- examples/

This is a target logical organization.

It does not require an immediate mass movement of files.

Move code incrementally while preserving imports, compatibility,
build outputs and existing user state.

Do not manufacture empty packages merely to match this diagram.

Each module must have a defined responsibility and working contract.

======================================================================
07. ZERO HOST AND GATEWAY FOUNDATION
======================================================================

The ZERO Host is the authoritative execution control plane.

Required properties:

- One default local entry point.
- Deterministic startup and shutdown.
- Stable HTTP API.
- Stable WebSocket RPC API.
- Frontend asset serving.
- Application lifecycle supervision.
- Integrated model gateway.
- Session and task service access.
- Skill and plugin service access.
- Connected-device discovery.
- Background worker management.
- Health and readiness reporting.
- Graceful restart.
- Automatic recovery after service failure.
- Configuration migration.
- Persistent state recovery.
- Internal event distribution.

The existing localhost port 18789 may remain the default to preserve
the current setup.

Do not create unnecessary competing host processes on the same port.

The host should expose separate concepts for:

Liveness:      Is the process running?
Readiness:     Can the core services accept work?
Connectivity:  Can the UI communicate with the host?
Model health:  Are configured inference providers accessible?
Worker health: Are execution workers available?
Feature health: Which specific capabilities are operational?

The UI must never interpret a successful /health response as proof that
all settings, models, plugins and skills are functional.

Gateway reconnect behavior must support:

- Connection failure detection.
- Exponential backoff.
- Automatic reconnection.
- Session restoration.
- Pending task reconciliation.
- RPC subscription restoration.
- Explicit error messages.
- Read-only state when appropriate.
- Recovery of normal editing after reconnection.

The existing interface must not remain permanently locked in a
"Gateway reconnecting" state because of a mismatched RPC or bootstrap
contract.

Do not bypass connection defects by displaying false "Connected" status.

======================================================================
08. MULTI-MODEL FABRIC
======================================================================

The Model Fabric is a core ZERO differentiator.

It must provide one consistent interface across multiple AI providers
and local model runtimes.

Supported provider categories:

- Commercial hosted language models.
- Hosted reasoning models.
- Hosted coding models.
- Hosted vision models.
- Local GGUF-compatible model runtimes.
- Local inference servers.
- OpenAI-compatible endpoints.
- Custom user-configured providers.
- Future dedicated speech and multimodal models.

Each model entry must contain:

- Provider ID.
- Canonical model ID.
- Display name.
- Capabilities.
- Supported modalities.
- Context window.
- Tool-calling support.
- Streaming support.
- Structured-output support.
- Expected latency profile.
- Cost profile, where applicable.
- Endpoint configuration.
- Credential reference.
- Health status.
- Availability status.
- Optional hardware requirements.

Model roles are assignments, not fixed product names.

For example, one user configuration might have:

- Primary coordination model.
- Reasoning model.
- Coding model.
- Lightweight routing model.
- Vision model.
- Research-oriented model.
- Local offline model.

Another user may configure completely different models.

ZERO must not require NVIDIA models or any one vendor to function.

MULTI-MODEL TASK EXECUTION

A single user request may involve multiple inference models.

Example of the general mechanism:

1. Primary model understands the objective.
2. Planner creates a task graph.
3. A coding-capable model receives implementation work.
4. A research-capable model gathers relevant information.
5. A vision model interprets a required screen state.
6. A verifier evaluates results.
7. The primary assistant consolidates outcomes.

This is a general orchestration pattern, not a mandatory fixed sequence.

The router must select models based on actual capability and availability,
not superficial model-name substrings.

Model switching must preserve the required shared context without
accidentally mixing one agent's private work into another agent's task.

Provide:

- Per-agent default model.
- Per-step model override.
- Automatic fallback.
- Budget-aware selection.
- Health-aware routing.
- Context summarization.
- Structured tool-call normalization.
- Native streaming.
- Cancellation.
- Retry classification.
- Usage monitoring.

Do not use synthetic model replies when a provider fails.

Return an explicit failure or select a valid, configured fallback.

======================================================================
09. AUTONOMOUS AGENT ORCHESTRATION
======================================================================

ZERO must have a real multi-agent runtime.

The primary agent acts as coordinator.

Specialist agents may be created dynamically or selected from reusable
templates.

Potential specializations include:

- General planning.
- Research.
- Coding.
- Testing.
- Browser automation.
- Computer operation.
- Data analysis.
- Document production.
- Memory retrieval.
- Workflow monitoring.
- Business operations.
- External communication.

These are example specializations, not a fixed agent roster.

The architecture must permit custom agent definitions.

AGENT OBJECT

Each agent should have:

agent_id
name
role
description
model_assignment
tools
skills
plugins
workspace
memory_scope
task_scope
resource_limits
status
current_task
execution_history
output_contract

TASK DELEGATION

The primary assistant must be able to:

- Create child tasks.
- Assign tasks to specialist agents.
- Run independent tasks concurrently.
- Express dependencies between tasks.
- Exchange structured results.
- Reassign work after failure.
- Cancel individual child tasks.
- Continue unaffected sibling tasks.
- Merge results.
- Request verification.
- Report overall completion.

Agents must execute actual work.

Creating a child task record and immediately returning a fabricated
success result is not agent delegation.

RESOURCE CONFLICT HANDLING

Multiple agents may research, code or process files simultaneously.

However, multiple agents must not simultaneously control the same
physical mouse and keyboard without coordination.

Introduce a host-desktop action coordinator.

It should support:

- Exclusive desktop-control ownership while required.
- Task priorities.
- Action sequencing.
- Resource leases.
- User takeover.
- Cancellation.
- Lock recovery after failure.

Additional agents can use separate browsers, workspaces or remote
computers when concurrent execution is required.

AGENT COMMUNICATION

Agent communication should use typed events and structured messages:

TASK_ASSIGNED
TASK_STARTED
STEP_STARTED
STEP_PROGRESS
ARTIFACT_CREATED
BLOCKED
WAITING_FOR_DEPENDENCY
TASK_COMPLETED
TASK_FAILED
TASK_CANCELLED

The central assistant must have visibility into these events.

Users should be able to ask:

"What is happening?"
"Which agent is working?"
"Why is the task waiting?"
"What has been completed?"
"Continue the unfinished work."

ZERO must answer from actual task state.

======================================================================
10. DURABLE TASK AND BACKGROUND EXECUTION ENGINE
======================================================================

Background execution is essential because ZERO is intended to become
an always-available voice assistant.

The owner should not need to keep a chat page open for every long task.

The task engine must support:

- Immediate tasks.
- Deferred tasks.
- Scheduled tasks.
- Recurring tasks.
- Event-triggered tasks.
- Long-running workflows.
- Parallel workflows.
- Conditional workflows.
- Human-in-the-loop workflows where required.
- Multi-agent task graphs.

Each task should have a durable state machine:

CREATED
  -> PLANNED
  -> QUEUED
  -> RUNNING
  -> WAITING
  -> PAUSED
  -> RESUMING
  -> COMPLETED / FAILED / CANCELLED

Include retries, compensation and recovery transitions where appropriate.

Persistent task records must include:

- Task identity.
- Parent task.
- Assigned agent.
- Assigned model.
- Current step.
- Progress.
- Inputs.
- Outputs.
- Artifacts.
- Tool execution history.
- Checkpoints.
- Dependencies.
- Retry count.
- Error details.
- Cost and resource usage.
- Creation and completion times.

LONG-RUNNING TASK REQUIREMENTS

ZERO must be able to survive:

- Chat browser closure.
- Gateway reconnection.
- Worker process crash.
- Host process restart.
- Temporary provider failure.
- Interruption of one agent.
- Temporary loss of internet connectivity.

Recovery must be based on persisted state, not a fake "resume" message.

Where an operation cannot safely resume from the middle, the task engine
must detect this and use an explicit recovery strategy.

Each executed step should support idempotency or duplicate-action
protection when possible.

The task engine must not accidentally repeat purchases, submissions,
messages or irreversible external actions after a restart.

======================================================================
11. UNIVERSAL CAPABILITY ENGINE
======================================================================

The Capability Engine is the common execution interface for all actions.

Models and agents should not implement their own independent operating
system action handlers.

Every tool must expose:

- A unique identifier.
- Description.
- Input schema.
- Output schema.
- Supported platforms.
- Capability requirements.
- Execution endpoint.
- Cancellation support.
- Timeout behavior.
- Error semantics.
- Verification strategy.
- Optional resource requirements.

The engine must support different execution routes:

NATIVE API
Direct service integration where available.

LOCAL PROCESS
Command-line and programmatic operations.

BROWSER DOM
Structured web element interaction.

BROWSER VISUAL
Visual browser automation when DOM interaction is insufficient.

WINDOWS UI AUTOMATION
Native control-tree interaction.

VISUAL DESKTOP CONTROL
Screen-grounded mouse and keyboard execution.

REMOTE DEVICE
Commands executed through connected workers.

The action planner must choose the most reliable available route.

Do not use a graphical mouse click to perform an operation that has
a stable, correctly authenticated native API unless the graphical
operation is specifically required.

Conversely, when a system exposes no suitable API, ZERO must be capable
of operating the real interface.

ACTION VERIFICATION

An action's final status must distinguish:

- Dispatched.
- Executed.
- Verified.
- Completed.
- Failed.
- Cancelled.
- Unverified.
- Blocked.

These must not be treated as synonyms.

Opening a browser is not equivalent to completing a browser task.

Starting an application is not equivalent to performing the requested
work inside it.

Generating a file is not equivalent to verifying that its content meets
the specification.

======================================================================
12. WINDOWS COMPUTER OPERATING SYSTEM
======================================================================

Windows is ZERO's first primary operating environment.

ZERO must be capable of operating the machine as a genuine desktop
assistant.

REQUIRED CORE CAPABILITIES

- Launch applications.
- Close applications when appropriate.
- Identify running processes.
- Enumerate windows.
- Focus windows.
- Move and resize windows.
- Read UI element hierarchies.
- Understand screen coordinates and scaling.
- Move the mouse.
- Click, double-click and right-click.
- Scroll.
- Drag and drop.
- Enter keyboard input.
- Use shortcuts.
- Read and edit supported text controls.
- Interact with dialogs.
- Work with files and folders.
- Operate browsers.
- Manage multiple monitors.
- Wait for UI state changes.
- Verify action results.

Accuracy must come from a layered approach.

PRIORITY 1: NATIVE APPLICATION OR SERVICE API
PRIORITY 2: ACCESSIBILITY / UI AUTOMATION TREE
PRIORITY 3: BROWSER DOM AND ELEMENT LOCATORS
PRIORITY 4: VISUAL GROUNDING AND IMAGE MATCHING
PRIORITY 5: VERIFIED PHYSICAL MOUSE / KEYBOARD INTERACTION

Fixed coordinate guessing must not be the primary strategy.

The controller must handle:

- Different display resolutions.
- DPI scaling.
- Window movement.
- Theme changes.
- Scrolling.
- Dynamic content.
- Popups.
- Application loading.
- Focus changes.
- Multi-monitor arrangements.

The computer operator must maintain an Observe -> Act -> Verify loop.

It must also support user takeover without corrupting the task state.

The long-term objective is broad computer operability, not a list of
hardcoded application integrations.

======================================================================
13. CONTINUOUS SCREEN AWARENESS / SCREENPIPE-CLASS SYSTEM
======================================================================

This is a required product capability.

ZERO must have an always-running local screen observation service.

The owner specifically wants ZERO to maintain continuous awareness of
computer activity so that the assistant can understand the current
environment without needing a new manual screenshot every time.

Do not redefine this requirement as merely taking screenshots after
a chat command.

The observation service itself must run continuously while enabled.

However, continuously observing the screen does not require continuously
running a heavy vision model on every frame.

Separate the architecture into:

1. CAPTURE
2. CHANGE DETECTION
3. VISUAL UNDERSTANDING
4. TEMPORARY CONTEXT
5. SEMANTIC MEMORY
6. ON-DEMAND CONTEXT RETRIEVAL

13.1 CAPTURE ENGINE

Capture the active desktop across configured displays.

Collect useful metadata:

- Timestamp.
- Display identifier.
- Active application.
- Active window.
- Window title, where available.
- Screen dimensions.
- Foreground process.
- Significant UI changes.
- Relevant accessibility metadata.

Use a native Windows capture mechanism suitable for continuous operation.

Support adaptive capture frequency.

The service must be able to observe ordinary desktop activity without
capturing and analyzing every display refresh.

13.2 CHANGE DETECTION

Use lightweight methods before heavy model inference:

- Frame difference.
- Perceptual hashing.
- Window changes.
- Focus changes.
- UI Automation events.
- Accessibility tree changes.
- OCR text changes.
- Significant region changes.

Unchanged frames should not repeatedly trigger expensive model calls.

13.3 FIVE-MINUTE ROLLING RAM BUFFER

Preserve the design from the supplied Screenpipe planning document.

Maintain a short-lived, in-memory rolling visual buffer with a target
retention window of five minutes.

Raw frames should not be automatically written to permanent disk
storage by the ordinary observation pipeline.

Old temporary frames must expire automatically.

IMPORTANT MEMORY LIMITATION:

A full uncompressed 1920x1080 frame at 32 bits per pixel consumes
approximately 7.9 MiB.

At one full frame per second for five minutes, raw storage would
consume approximately 2.3 GiB.

At two full frames per second, it would exceed 4.6 GiB.

That is excessive for a 16 GB RAM computer running other AI services.

Therefore:

- Store compressed or downscaled frames where appropriate.
- Deduplicate near-identical frames.
- Retain selected keyframes and event-linked context.
- Apply a configurable memory ceiling.
- Track actual buffer usage.
- Avoid unbounded frame accumulation.
- Preserve high-resolution frames only temporarily when needed for
  precise action grounding.
- Treat the five-minute window as a retention target under the memory
  budget, not a promise to keep every original frame.

The exact sampling and compression strategy must be benchmarked on the
target computer.

13.4 LOCAL VISION MODEL

The supplied Screenpipe planning document proposes Moondream 2
as a local vision model and identifies a GGUF text model plus its
multimodal projector.

This is an initial candidate configuration, not an assumption that
every referenced model file or repository is valid.

The implementation team must verify:

- Actual model availability.
- Correct matching model/projector files.
- Runtime compatibility.
- GGUF support.
- CPU inference performance.
- Quantization compatibility.
- Image preprocessing requirements.
- Memory consumption.
- Accuracy on the user's Windows UI.
- Compatibility with the selected inference engine.

Do not assume that two files with plausible names are a validated
model pair.

The vision service must support replacing Moondream with another
compatible local vision model in the future.

13.5 CPU-FIRST PERFORMANCE

The target reference machine has:

- Intel Core i9, 13th/14th generation class.
- Approximately 16 GB RAM.
- No dedicated GPU requirement.

Design for this class of hardware.

Use a lightweight observation pipeline during ordinary idle monitoring.

Run expensive vision analysis based on changes, importance, task state
or user queries.

The screen observer must not starve the model gateway, browser,
development tools or desktop automation of CPU and RAM.

Provide configurable:

- Sampling rate.
- Resolution.
- Vision inference frequency.
- CPU usage budget.
- RAM budget.
- Thermal and battery behavior.
- Inference queue length.
- Model unload and reload behavior.

13.6 SEMANTIC OBSERVATION MEMORY

Background processing must convert useful observations into structured
semantic records.

Example observation schema:

observation_id
timestamp
source_device
display_id
application_id
window_context
observed_text
semantic_summary
event_type
related_task_id
confidence
expiry_policy

Store useful extracted context in an encrypted persistent database.

Plain SQLite does not automatically provide encrypted-at-rest storage.

Use an appropriate encrypted SQLite implementation or field-level
encryption design, with explicit key lifecycle management.

Retain source references so ZERO can distinguish:

- What it actually observed.
- What it inferred.
- What remains uncertain.

13.7 REAL-TIME ASSISTANT USE

The assistant must be able to ask the observation service questions such as:

- What application is currently active?
- What changed on the screen?
- Is a dialog waiting for input?
- What was the latest significant UI event?
- Which application is associated with the current task?
- Is the expected result visible?
- What context has been observed in the last few minutes?

These are query patterns, not fixed prompt handlers.

13.8 EVENT-BASED PROACTIVE CAPABILITIES

The observation system should publish structured events.

These may be consumed by:

- The primary assistant.
- Active desktop tasks.
- Background automations.
- Error recovery systems.
- Memory consolidation.
- Future voice interactions.

Continuous observation must not automatically imply unrestricted
unprompted actions.

Event-triggered behavior must be configurable and connected to
well-defined workflows.

13.9 OBSERVATION RELIABILITY

Test the service under:

- Multiple monitors.
- Screen lock.
- Sleep and resume.
- Application switching.
- Fullscreen applications.
- Browser navigation.
- Rapid scrolling.
- Large display resolutions.
- Long uptime.
- CPU pressure.
- Memory pressure.
- Host restarts.

A 24-hour endurance test should be mandatory before describing
continuous screen awareness as production-ready.

======================================================================
14. LONG-TERM ZERO MEMORY SYSTEM
======================================================================

ZERO must have a persistent contextual memory architecture.

A simple key-value store is not sufficient.

Required memory layers:

LAYER 1: ACTIVE WORKING CONTEXT
Current conversation and immediately relevant information.

LAYER 2: SESSION MEMORY
Conversation messages, ongoing task context and session continuity.

LAYER 3: EPISODIC MEMORY
Important events and what occurred during prior tasks.

LAYER 4: SEMANTIC MEMORY
Facts, preferences, concepts and relationships.

LAYER 5: PROCEDURAL MEMORY
Reusable methods, workflows and known working procedures.

LAYER 6: ENVIRONMENT MEMORY
Relevant computer observations and activity context.

LAYER 7: AGENT MEMORY
Specialist agent state, discoveries and reusable knowledge.

LAYER 8: PROJECT / ORGANIZATION MEMORY
Workspaces, projects, deliverables, relationships and operational context.

MEMORY RETRIEVAL

Use a hybrid retrieval strategy where appropriate:

- Structured database queries.
- Full-text search.
- Vector search.
- Semantic reranking.
- Temporal relevance.
- Project and session filters.
- Evidence confidence.
- User corrections.

ZERO must be able to retrieve relevant context without sending the
entire lifetime history to every model.

MEMORY WRITE POLICY

Not every chat message or screen observation should become a permanent
memory.

Memory updates should distinguish:

- Explicit user instructions.
- Stable preferences.
- Confirmed facts.
- Task outcomes.
- Temporary observations.
- Unverified inferences.

Support consolidation, deduplication and contradiction handling.

MEMORY INTEGRATION

Memory must actually work through:

- The chat assistant.
- Specialist agents.
- Long-running tasks.
- The screen observation service.
- The current UI's Memory section.
- Future mobile and voice interfaces.

The UI must support viewing, searching, correcting and deleting
relevant memory records.

A memory backend with no usable memory interface is incomplete.

======================================================================
15. FULL SKILLS PLATFORM
======================================================================

ZERO must support both native and compatible third-party skills.

The owner wants to install community-created skills and create new
skills inside ZERO.

The skills system must not be restricted to built-in examples.

REQUIRED SKILL LIFECYCLE

DISCOVER
  -> INSPECT
  -> INSTALL
  -> CONFIGURE
  -> ENABLE
  -> USE
  -> UPDATE
  -> DISABLE
  -> REMOVE

A skill can contain:

- Manifest.
- Instructions.
- Capability requirements.
- Tools.
- Scripts.
- Templates.
- Dependencies.
- Configuration schema.
- Documentation.
- Test definitions.

SUPPORTED SOURCES

- Built-in ZERO skills.
- Local directories.
- Git repositories.
- Compatible community skill packages.
- User-created skills.
- Future ZERO marketplace.

OPENCLAW-COMPATIBLE SKILLS

Preserve and adapt useful existing skill formats.

Create explicit compatibility adapters where necessary.

Do not require an entire upstream runtime simply to invoke one
portable skill.

Do not silently claim all community skills are compatible.

Classify compatibility with real installation and execution tests.

CUSTOM SKILL CREATION

Provide a built-in workflow to:

1. Describe the desired skill.
2. Create a manifest.
3. Generate starter code or instructions.
4. Select tools and dependencies.
5. Test the skill.
6. Save it as an installable package.
7. Make it discoverable by ZERO agents.

SKILL EXECUTION

A skill must be usable through natural-language task planning.

ZERO should discover whether an available skill can help, rather than
requiring the user to type a rigid command name.

The existing Skills UI must list installed skills accurately.

Clicking a skill must open its details and available actions.

Install, update, enable and removal operations must persist correctly.

======================================================================
16. FULL PLUGIN AND EXTENSION PLATFORM
======================================================================

A plugin is a code-level extension capable of adding behavior to ZERO.

Skills and plugins must remain distinct concepts even when a plugin
supplies skills or tools.

REQUIRED PLUGIN CAPABILITIES

- Dynamic discovery.
- Installation.
- Manifest parsing.
- Dependency resolution.
- Version management.
- Loading.
- Registration.
- Tool exposure.
- Configuration.
- Event subscriptions.
- Execution.
- Diagnostics.
- Hot reload where technically safe.
- Unloading.
- Removal.

PLUGIN TYPES

- Model providers.
- Channels.
- External-service integrations.
- Tool providers.
- Device integrations.
- Memory extensions.
- Search providers.
- Automation extensions.
- UI extensions.

COMPATIBILITY

Develop an adapter for compatible OpenClaw-style plugins and other
supported extension formats.

Preserve functionality and required third-party notices when code is
legitimately reused.

Do not copy unrelated upstream infrastructure solely for a plugin
registration function.

ZERO NATIVE PLUGIN SDK

Create a stable SDK with documented lifecycle hooks and contracts.

PLUGIN DISCOVERY

The central assistant and every specialist agent must be able to
discover installed plugin capabilities.

REGISTERED must not mean EXECUTABLE.

An installed plugin must pass lifecycle, configuration and actual
execution tests.

PLUGIN MARKETPLACE

Design a ZERO-controlled marketplace or catalog that can:

- Publish plugin metadata.
- Show versions.
- Show requirements.
- Install compatible packages.
- Update packages.
- Report incompatibility.
- Discover available integrations.

A marketplace website is a future distribution surface.

Plugin execution must remain part of ZERO, rather than requiring
the user to operate inside a separate external agent platform.

Externally sourced executable code needs an explicit trust and
capability boundary; do not confuse a locally trusted owner with
unreviewed third-party extensions.

======================================================================
17. ADOPTING USEFUL OPENDOT AND OPENMAUSBOT IDEAS
======================================================================

OpenDot and OpenMausBot are reference projects for useful agent,
worker and automation concepts.

ZERO must not become a frontend that depends on those products being
installed or running separately.

The intended process is:

STUDY
  -> IDENTIFY USEFUL CAPABILITY
  -> VERIFY SOURCE AND LICENSE
  -> DESIGN ZERO INTERFACE
  -> REIMPLEMENT OR ADAPT
  -> IMPORT NECESSARY CODE WHEN APPROPRIATE
  -> TEST IN ZERO
  -> REMOVE UNNECESSARY EXTERNAL DEPENDENCY

The developer must inspect the exact upstream repositories, versions,
interfaces and license obligations before reusing source files.

Do not assume every feature attributed to a similarly named project
exists in a particular repository.

USEFUL CAPABILITY CATEGORIES TO STUDY

A. Persistent personal agents.
B. Background jobs.
C. Multi-agent teams.
D. Independent agent models.
E. Dedicated agent workspaces.
F. Isolated execution workers.
G. Cloud computer coordination.
H. Reusable workflows.
I. Agent-to-agent task handoff.
J. Connector ecosystems.
K. Progress event streaming.
L. Worker lifecycle management.
M. Task and artifact management.
N. Failure and restart recovery.
O. Proactive scheduling.

Build these into ZERO-owned services and packages.

Avoid introducing:

- A second primary assistant identity.
- A competing gateway.
- A competing task state database.
- Another permanent plugin manager.
- A separate disconnected memory system.
- Duplicate browser-control ownership.
- An unrelated UI shell.
- A permanently required external orchestration server.

If upstream code is reused, isolate it behind a ZERO interface and
retain legally required third-party notices.

======================================================================
18. WEB, SEARCH, RESEARCH, FILES AND DEVELOPMENT TOOLS
======================================================================

ZERO needs generalized information retrieval and artifact production.

WEB AND SEARCH

- Multiple search providers.
- Browser-assisted search.
- Structured page extraction.
- Website navigation.
- Retrieval and comparison.
- Citation and source tracking.
- Download support.
- Search-result relevance evaluation.
- Error detection for dead links.
- Controlled website interaction.

RESEARCH AGENTS

Research tasks may be delegated to specialist models or agents.

The result must include evidence and clearly separate findings from
inferences.

FILES AND DOCUMENTS

ZERO must support:

- File search.
- File reading.
- File creation.
- File transformation.
- Document analysis.
- PDF workflows.
- Spreadsheet workflows.
- Presentations.
- Archives.
- Media files.
- Structured data extraction.

CODING AND PROJECT EXECUTION

ZERO should be able to:

- Read repositories.
- Understand project architecture.
- Plan code changes.
- Modify files.
- Run tests.
- Diagnose failures.
- Review diffs.
- Produce artifacts.
- Use version control.
- Create structured implementation reports.

These capabilities should be implemented through generic tools and
skills so that newly introduced workflows remain supported.

======================================================================
19. MOBILE AND MULTI-DEVICE OPERATION
======================================================================

ZERO must eventually operate beyond a single Windows machine.

DESIGN NOW, IMPLEMENT IN A LATER PHASE.

The architecture must support registering multiple devices with
individual capability profiles.

A device record should contain:

device_id
platform
capabilities
connection_state
execution_endpoint
last_seen
workspace
available_actions

MOBILE USE CASE CATEGORIES

- Conversational access to ZERO.
- Mobile notifications.
- Remote desktop task requests.
- Cross-device context.
- Supported application workflows.
- File transfer.
- Mobile-originated automation.
- Supported mobile screen interpretation.
- Mobile task supervision.

ANDROID

Plan native integrations using officially supported Android APIs,
including accessibility and media projection where applicable.

Feature availability depends on OS version, user grants and platform
policy.

IOS

Plan a companion application and supported automation integrations.

Do not promise unrestricted control of third-party iOS applications
where the operating system does not provide the required interfaces.

REMOTE DEVICES

Tasks should be routed to the appropriate device or worker.

The primary assistant must preserve continuity even when the actual
action runs on another machine.

======================================================================
20. PERSONAL, PROFESSIONAL AND ORGANIZATIONAL AUTOMATION
======================================================================

ZERO is intended to support both personal and high-complexity
professional work.

Do not treat individual examples as the entire product scope.

GENERAL OPERATION MODEL

USER OBJECTIVE
  -> TASK ANALYSIS
  -> WORKFLOW GENERATION
  -> RESOURCE ASSIGNMENT
  -> EXECUTION
  -> VERIFICATION
  -> REPORTING

PERSONAL CAPABILITIES

- Information retrieval.
- Learning and research support.
- Computer and application operation.
- File management.
- Personal workflow coordination.
- Scheduling.
- Reminders.
- Ongoing task tracking.
- Cross-device continuity.

PROFESSIONAL CAPABILITIES

- Research and analysis.
- Project management.
- Software development.
- Website operations.
- Document production.
- Data processing.
- Reporting.
- Connected-service workflows.
- Repetitive administrative operations.

ORGANIZATIONAL CAPABILITIES

- Multi-project workspaces.
- Team and department contexts.
- Human employee task assignment.
- AI worker assignment.
- Task dependencies.
- Status reporting.
- Work queues.
- CRM integrations.
- Sales-related workflows.
- Customer support workflows.
- Content operations.
- Operational analytics.

REAL-WORLD EXTERNAL ACTIONS

ZERO should be capable of integrating with real systems, but executing
an external action must be distinguished from merely drafting or
planning that action.

For financially consequential, destructive or externally binding
operations, support configurable owner confirmation, transaction
verification, and an execution record.

The desired outcome is trustworthy autonomy, not uncontrolled or
unverifiable activity.

======================================================================
21. USER INTERFACE STRATEGY
======================================================================

PHASE ONE: KEEP THE CURRENT UI.

The existing UI is the functional workbench for development.

Required current surfaces include:

- Chat.
- Models.
- Providers.
- Agents.
- Sessions.
- Tasks.
- Memory.
- Skills.
- Plugins.
- Search.
- Browser and computer tools.
- Automation.
- Connections.
- Channels.
- Settings.
- System status.

Every existing page must be inventoried.

Do not assume a particular number of routes proves feature completeness.

For every page, verify:

- Rendering.
- Navigation.
- Scrolling.
- Data loading.
- Interactive controls.
- Form editing.
- Persistence.
- Error handling.
- Gateway reconnection.
- Actual backend execution.

The existing UI must remain operational while the backend evolves.

PHASE TWO: BUILD A STABLE VIEW-MODEL CONTRACT.

Separate product presentation from backend execution.

The frontend should consume stable APIs and typed events instead of
relying on internal runtime implementation details.

PHASE THREE: CREATE AN ORIGINAL ZERO USER EXPERIENCE.

After feature and API stability, develop a distinctive ZERO interface.

Potential experience areas:

- Central assistant console.
- Live task monitoring.
- Agent team visualization.
- Context and memory explorer.
- Model routing controls.
- Computer observation controls.
- Connected-device management.
- Plugin and skill marketplace.
- Voice interaction interface.
- Multi-workspace operations.

The future visual identity should be original to ZERO.

Do not sacrifice working functionality for visual branding.

======================================================================
22. REAL-TIME VOICE ASSISTANT: FUTURE PRIMARY INTERFACE
======================================================================

Voice is a planned major product phase.

It must be designed as a new input/output layer above existing ZERO
services, not a rewrite of the agent runtime.

VOICE PIPELINE

MICROPHONE INPUT
  -> VOICE ACTIVITY DETECTION
  -> STREAMING SPEECH RECOGNITION
  -> ZERO CONVERSATION CORE
  -> TASK / MODEL / TOOL / AGENT EXECUTION
  -> STREAMING RESPONSE GENERATION
  -> SPEECH SYNTHESIS
  -> AUDIO OUTPUT

REQUIRED EXPERIENCES

- Natural turn-taking.
- Low-latency replies.
- Interruption handling.
- Barge-in while speaking.
- Voice-based task delegation.
- Spoken progress updates.
- Context retention.
- Multilingual operation.
- Graceful transitions between chat and voice.
- Long-task initiation from speech.
- Background task completion notifications.

The user must be able to issue a task by voice and continue interacting
while worker agents execute it.

Speech processing must not block the task engine.

Future voice models must be selectable through the same general
provider infrastructure where compatible.

Continuous environmental audio observation, if introduced, must be a
separate configurable subsystem from conversational microphone input.

VOICE IS NOT THE FIRST IMPLEMENTATION PHASE.

The backend must work completely through chat before voice becomes
the default interface.

======================================================================
23. DATA AND STATE ARCHITECTURE
======================================================================

Define canonical state ownership.

Recommended logical data domains:

users
devices
sessions
messages
agents
agent_profiles
tasks
task_steps
task_dependencies
workflows
workflow_runs
models
model_assignments
skills
plugins
plugin_configurations
tool_executions
memory_items
memory_links
screen_observations
automation_jobs
automation_runs
artifacts
notifications
event_log

SQLite is acceptable for local-first single-machine workloads when
appropriately designed.

Use proper migrations, transactions, foreign keys and indexes.

For scaled multi-user or distributed deployments, define a future
database adapter rather than forcing all distributed state into a
single local database.

A durable event log should support:

- Task reconstruction.
- Progress reporting.
- Agent coordination.
- Debugging.
- Restart recovery.
- Evidence-backed completion status.

Do not store every transient frame, model token or low-level log event
forever.

Define retention policies appropriate to each data type.

======================================================================
24. TRUSTED LOCAL OPERATION AND EXTERNAL BOUNDARY
======================================================================

The owner wants an assistant with broad control over the owner's
configured local environment.

The design must support a trusted local operating profile with:

- Broad owner-configured computer capabilities.
- Minimal repeated prompts for ordinary authorized actions.
- Persistent capability configuration.
- Fast local execution.
- Reliable automation.
- Owner override.
- Clear execution status.
- Immediate pause and stop controls.

Do not make routine local functionality unusable through unnecessary
permission prompts or artificial execution restrictions.

At the same time, separate trusted-owner access from:

- Remote network clients.
- Unknown devices.
- External websites.
- Untrusted incoming messages.
- Downloaded plugins.
- Third-party code.
- Compromised connected services.

The gateway needs a reliable external authentication and pairing
boundary.

Externally supplied content must not silently obtain owner-level
device authority.

The design should preserve owner control without equating "owner
convenience" with exposing the entire computer to arbitrary network
callers.

Any existing authorization mechanisms should be evaluated and
simplified or redesigned where appropriate.

Do not blindly delete security-related modules before defining their
replacement responsibility.

======================================================================
25. IMPLEMENTATION ROADMAP
======================================================================

Execute the following phases in order.

Some implementation tracks may run in parallel after their contracts
are stable.

No phase should be declared complete because only its unit tests pass.

----------------------------------------------------------------------
PHASE 0 — PRODUCT BASELINE AND REPOSITORY FREEZE
----------------------------------------------------------------------

OBJECTIVE:
Establish exactly which functionality, data, integrations and runtime
components exist before changing the architecture.

TASKS:

0.1 Create a full repository module inventory.
0.2 Map every active runtime entry point.
0.3 Identify duplicate and obsolete implementations.
0.4 Inventory all existing UI routes and controls.
0.5 Inventory all exposed RPC methods.
0.6 Inventory all model providers.
0.7 Inventory all skills.
0.8 Inventory all plugins.
0.9 Inventory all external channels.
0.10 Inventory all agent workflows.
0.11 Inventory all local computer actions.
0.12 Identify all persistent data stores.
0.13 Identify dependencies on inherited runtimes.
0.14 Identify generated files versus maintained source files.
0.15 Create a functional parity matrix.
0.16 Create database backups.
0.17 Create a baseline Git tag.
0.18 Create a rollback procedure.
0.19 Write representative real workflow tests.

DELIVERABLES:

- Repository inventory.
- Architecture dependency graph.
- UI-to-RPC contract map.
- Feature parity matrix.
- Data migration plan.
- Candidate deletion manifest.
- Baseline test evidence.

EXIT CONDITION:

The team can explain where every important existing feature lives,
what executes it, and what must be preserved during migration.

----------------------------------------------------------------------
PHASE 1 — CANONICAL ZERO HOST AND EXECUTION CONTRACTS
----------------------------------------------------------------------

OBJECTIVE:
Establish one dependable host and one consistent communication protocol.

TASKS:

1.1 Choose and finalize the authoritative host entry point.
1.2 Consolidate conflicting gateway responsibilities.
1.3 Establish consistent HTTP and WebSocket contracts.
1.4 Define lifecycle and startup supervision.
1.5 Implement robust connection recovery.
1.6 Establish service readiness reporting.
1.7 Normalize errors and request IDs.
1.8 Add persistent event routing.
1.9 Define canonical configuration handling.
1.10 Eliminate duplicate process and port ownership.
1.11 Preserve compatibility interfaces during migration.
1.12 Validate persistent state after host restart.

EXIT CONDITION:

The host starts reliably, the existing UI connects reliably, core
services report accurate readiness, and sessions and tasks survive
restart.

----------------------------------------------------------------------
PHASE 2 — RESTORE COMPLETE FUNCTIONAL UI INTEGRATION
----------------------------------------------------------------------

OBJECTIVE:
Ensure the current interface is a functioning control surface rather
than a set of rendered pages.

TASKS:

2.1 Verify every navigation route.
2.2 Fix broken scrolling and layout interactions.
2.3 Verify every settings form.
2.4 Restore Models and Providers operations.
2.5 Restore Agents operations.
2.6 Restore Skills page functionality.
2.7 Restore Plugins page functionality.
2.8 Restore Memory search and management.
2.9 Restore Search functionality.
2.10 Restore Automation controls.
2.11 Restore Gateway status and recovery.
2.12 Restore relevant channel and connection surfaces.
2.13 Validate genuine backend responses for all controls.
2.14 Implement Playwright browser interaction tests.
2.15 Preserve the existing presentation design.

EXIT CONDITION:

Every retained control performs its intended action and correctly
reflects its persisted backend state.

No page is accepted merely for rendering successfully.

----------------------------------------------------------------------
PHASE 3 — COMPLETE MULTI-MODEL GATEWAY
----------------------------------------------------------------------

OBJECTIVE:
Allow multiple models and providers to be used intelligently by one
assistant and multiple agents.

TASKS:

3.1 Normalize provider adapters.
3.2 Define canonical model identifiers.
3.3 Implement capability discovery.
3.4 Support online and local runtimes.
3.5 Support model switching per agent and per step.
3.6 Implement native tool calling.
3.7 Implement true streaming.
3.8 Implement retries and fallbacks.
3.9 Implement health-aware routing.
3.10 Implement context budget management.
3.11 Implement usage and cost reporting.
3.12 Implement cancellation.
3.13 Test simultaneous model activity.
3.14 Test provider outages.
3.15 Test offline local inference.

EXIT CONDITION:

Different agents can use different actual models simultaneously while
maintaining correct task context and independent execution state.

----------------------------------------------------------------------
PHASE 4 — PRIMARY ASSISTANT AND MULTI-AGENT ORCHESTRATOR
----------------------------------------------------------------------

OBJECTIVE:
Create the central ZERO intelligence and its real specialist workforce.

TASKS:

4.1 Implement the primary assistant coordinator.
4.2 Implement dynamic task planning.
4.3 Define agent profiles.
4.4 Implement agent creation and termination.
4.5 Implement task delegation.
4.6 Implement parallel execution.
4.7 Implement task dependencies.
4.8 Implement structured agent messaging.
4.9 Implement shared and private context.
4.10 Implement per-agent model selection.
4.11 Implement per-agent skills and tools.
4.12 Implement independent workspaces.
4.13 Implement result verification.
4.14 Implement task reassignment.
4.15 Implement resource coordination.
4.16 Implement parent-child progress reporting.

EXIT CONDITION:

One user request can produce multiple real specialist executions, with
verifiable results consolidated by ZERO.

----------------------------------------------------------------------
PHASE 5 — DURABLE TASKS AND BACKGROUND WORKERS
----------------------------------------------------------------------

OBJECTIVE:
Allow ZERO to perform meaningful work beyond a single interactive chat.

TASKS:

5.1 Implement durable task storage.
5.2 Implement persistent step checkpoints.
5.3 Implement job scheduling.
5.4 Implement dependency execution.
5.5 Implement pause and resume.
5.6 Implement cancellation.
5.7 Implement retry policies.
5.8 Implement restart recovery.
5.9 Implement worker registration.
5.10 Implement worker health monitoring.
5.11 Implement distributed task handoff contracts.
5.12 Implement notifications.
5.13 Implement long-task progress retrieval.
5.14 Implement duplicate-action prevention.
5.15 Implement execution budgets.

EXIT CONDITION:

A substantial task continues or resumes correctly after UI closure
and process interruption, and the user can recover its actual state.

----------------------------------------------------------------------
PHASE 6 — SKILLS AND PLUGIN ECOSYSTEM
----------------------------------------------------------------------

OBJECTIVE:
Make ZERO extensible without requiring changes to its core runtime
for every new capability.

TASKS:

6.1 Create canonical skill manifests.
6.2 Implement native skill loading.
6.3 Implement compatible community skill import.
6.4 Implement custom skill creation.
6.5 Implement skill installation and updates.
6.6 Implement skill discovery by agents.
6.7 Implement real skill execution.
6.8 Define a native plugin SDK.
6.9 Implement plugin lifecycle management.
6.10 Implement compatible plugin adapters.
6.11 Implement plugin-provided tools and providers.
6.12 Implement plugin configuration persistence.
6.13 Implement plugin diagnostics.
6.14 Implement marketplace-compatible metadata.
6.15 Connect all operations to the existing UI.
6.16 Test real third-party installations.

EXIT CONDITION:

An external compatible skill or plugin can be installed, configured,
executed, updated and removed through ZERO without relying on an
external assistant application.

----------------------------------------------------------------------
PHASE 7 — RELIABLE WINDOWS COMPUTER OPERATOR
----------------------------------------------------------------------

OBJECTIVE:
Create accurate general-purpose real computer operation.

TASKS:

7.1 Consolidate desktop action implementations.
7.2 Integrate Windows UI Automation.
7.3 Integrate browser DOM automation.
7.4 Integrate visual grounding.
7.5 Implement mouse and keyboard control.
7.6 Implement window management.
7.7 Implement robust typing verification.
7.8 Implement scrolling and dynamic UI interaction.
7.9 Implement multi-monitor support.
7.10 Implement DPI-aware coordinate translation.
7.11 Implement desktop action resource locking.
7.12 Implement UI state monitoring.
7.13 Implement automatic recovery from known UI changes.
7.14 Implement cancellation and user takeover.
7.15 Implement general action verification.
7.16 Test across unrelated real applications.

EXIT CONDITION:

ZERO can operate unfamiliar but supported desktop workflows using
generalized observation and action tools rather than predetermined
prompt handlers.

----------------------------------------------------------------------
PHASE 8 — CONTINUOUS SCREEN INTELLIGENCE
----------------------------------------------------------------------

OBJECTIVE:
Provide always-running local screen context with bounded resource
consumption.

TASKS:

8.1 Implement native screen capture.
8.2 Implement adaptive frame sampling.
8.3 Implement change detection.
8.4 Implement temporary RAM keyframe storage.
8.5 Enforce the five-minute rolling retention design.
8.6 Enforce a configurable RAM ceiling.
8.7 Implement local OCR.
8.8 Integrate a validated local vision model.
8.9 Benchmark candidate GGUF runtimes.
8.10 Integrate window and application metadata.
8.11 Implement semantic observation extraction.
8.12 Implement encrypted persistent observation storage.
8.13 Implement task-linked screen context.
8.14 Implement recent-event retrieval.
8.15 Implement observation-driven verification.
8.16 Expose observation capabilities to ZERO agents.
8.17 Implement continuous operation monitoring.
8.18 Perform 24-hour endurance testing.
8.19 Verify performance on CPU-only 16 GB hardware.

EXIT CONDITION:

ZERO maintains useful real-time desktop context across ordinary
activity without uncontrolled memory growth or excessive resource
consumption.

----------------------------------------------------------------------
PHASE 9 — UNIFIED PERSISTENT MEMORY
----------------------------------------------------------------------

OBJECTIVE:
Create reliable, searchable, continuously maintained context.

TASKS:

9.1 Implement canonical memory schemas.
9.2 Integrate conversation memory.
9.3 Integrate task history.
9.4 Integrate screen observations.
9.5 Implement semantic search.
9.6 Implement temporal retrieval.
9.7 Implement memory ranking.
9.8 Implement memory consolidation.
9.9 Implement duplicate detection.
9.10 Implement memory correction.
9.11 Implement memory deletion and retention controls.
9.12 Implement per-agent memory scopes.
9.13 Implement project memory.
9.14 Implement organizational memory.
9.15 Integrate memory into planning.
9.16 Integrate memory into the existing Memory UI.

EXIT CONDITION:

ZERO retrieves and uses relevant prior context correctly across
sessions, tasks and agent workflows.

----------------------------------------------------------------------
PHASE 10 — WEB, SEARCH, FILE AND RESEARCH INTELLIGENCE
----------------------------------------------------------------------

OBJECTIVE:
Give ZERO broad information retrieval and artifact creation capability.

TASKS:

10.1 Integrate configurable search providers.
10.2 Implement structured browser research.
10.3 Implement source and citation tracking.
10.4 Implement document reading and editing.
10.5 Implement file system tools.
10.6 Implement spreadsheet and PDF workflows.
10.7 Implement coding and repository workflows.
10.8 Implement download and upload tools.
10.9 Implement artifact production and verification.
10.10 Implement research agent workflows.
10.11 Integrate retrieval with persistent memory.
10.12 Test novel tasks without hardcoded command patterns.

EXIT CONDITION:

ZERO can discover information, operate the relevant tools, produce
artifacts and distinguish verified findings from guesses.

----------------------------------------------------------------------
PHASE 11 — PROACTIVE AUTOMATION AND CONNECTED SERVICES
----------------------------------------------------------------------

OBJECTIVE:
Allow ZERO to execute recurring and event-driven work independently.

TASKS:

11.1 Implement workflow definitions.
11.2 Implement event subscriptions.
11.3 Implement scheduled execution.
11.4 Implement conditional workflows.
11.5 Implement reusable automation templates.
11.6 Implement notification delivery.
11.7 Implement external application connectors.
11.8 Implement connected-service monitoring.
11.9 Implement workflow retries and recovery.
11.10 Implement audit and outcome reporting.
11.11 Implement owner-configured action policies.
11.12 Implement real integration tests.

EXIT CONDITION:

ZERO can execute configured background workflows based on events or
schedules and provide verified results.

----------------------------------------------------------------------
PHASE 12 — ADVANCED AGENT WORKSPACES AND CLOUD WORKERS
----------------------------------------------------------------------

OBJECTIVE:
Allow specialist agents to use separate execution resources.

TASKS:

12.1 Implement worker capability discovery.
12.2 Implement workspace assignment.
12.3 Implement independent browser sessions.
12.4 Implement remote worker registration.
12.5 Implement cloud execution adapters.
12.6 Implement device and worker selection.
12.7 Implement task handoff.
12.8 Implement artifact synchronization.
12.9 Implement resource limits.
12.10 Implement distributed task recovery.
12.11 Implement worker health and failure handling.
12.12 Integrate multi-worker status into the UI.

EXIT CONDITION:

Multiple agents can operate independently without competing for the
same desktop or losing task state during worker handoff.

----------------------------------------------------------------------
PHASE 13 — PERSONAL AND ORGANIZATIONAL WORKFLOWS
----------------------------------------------------------------------

OBJECTIVE:
Expand ZERO from personal assistant operations to sophisticated
project and organization workflows.

TASKS:

13.1 Implement multiple workspaces.
13.2 Implement project context models.
13.3 Implement human and AI task assignments.
13.4 Implement team workflow templates.
13.5 Implement project reporting.
13.6 Implement document and artifact coordination.
13.7 Implement CRM and business connectors.
13.8 Implement reporting and analytics workflows.
13.9 Implement long-running project execution.
13.10 Implement organization-specific memory.
13.11 Implement workflow verification.
13.12 Implement configurable transaction approval boundaries.
13.13 Benchmark real organizational workflows.

EXIT CONDITION:

ZERO can coordinate substantial multi-step work using real connected
systems and report actual outcomes, dependencies and failures.

----------------------------------------------------------------------
PHASE 14 — MOBILE AND CROSS-DEVICE CAPABILITIES
----------------------------------------------------------------------

OBJECTIVE:
Extend ZERO's intelligence and task execution across registered devices.

TASKS:

14.1 Define device protocol.
14.2 Implement mobile companion communication.
14.3 Implement device pairing.
14.4 Implement remote notifications.
14.5 Implement device-specific tool discovery.
14.6 Implement Android-supported automation.
14.7 Implement supported iOS integrations.
14.8 Implement cross-device task handoff.
14.9 Implement cross-device memory context.
14.10 Implement mobile status and task supervision.
14.11 Test reconnect and offline recovery.

EXIT CONDITION:

ZERO maintains one assistant identity across registered devices and
can perform supported device-specific tasks.

----------------------------------------------------------------------
PHASE 15 — REAL-TIME VOICE ASSISTANT
----------------------------------------------------------------------

OBJECTIVE:
Make conversational voice ZERO's primary user interaction mode.

TASKS:

15.1 Implement streaming speech recognition.
15.2 Implement voice activity detection.
15.3 Implement conversational turn management.
15.4 Implement low-latency speech synthesis.
15.5 Implement interruption and barge-in.
15.6 Integrate the existing central assistant.
15.7 Integrate background task notifications.
15.8 Implement spoken task progress.
15.9 Implement device microphone/speaker routing.
15.10 Implement multilingual operation.
15.11 Implement chat-to-voice continuity.
15.12 Benchmark end-to-end voice latency.
15.13 Test long-running and interrupted conversations.
15.14 Ensure all tools work equally through chat and voice.

EXIT CONDITION:

A user can naturally converse with ZERO while it performs, supervises
and reports real tasks using the already established execution backend.

----------------------------------------------------------------------
PHASE 16 — ORIGINAL ZERO INTERFACE AND PRODUCT EXPERIENCE
----------------------------------------------------------------------

OBJECTIVE:
Create the final distinctive ZERO product experience without replacing
the working intelligence and execution services.

TASKS:

16.1 Define the ZERO design system.
16.2 Build the central assistant interface.
16.3 Build a real-time agent workforce dashboard.
16.4 Build task monitoring and recovery surfaces.
16.5 Build memory exploration.
16.6 Build skill and plugin management.
16.7 Build model and provider configuration.
16.8 Build continuous observation controls.
16.9 Build connected-device controls.
16.10 Build voice interaction controls.
16.11 Build multi-workspace project views.
16.12 Validate full accessibility and responsiveness.
16.13 Migrate UI route by route.
16.14 Preserve all backend contracts.
16.15 Remove obsolete legacy presentation code after parity.

EXIT CONDITION:

ZERO has an original user experience and no loss of capabilities
compared with the proven existing functional interface.

----------------------------------------------------------------------
PHASE 17 — PRODUCTION RELIABILITY AND RELEASE ENGINEERING
----------------------------------------------------------------------

OBJECTIVE:
Deliver a stable product that can be installed, operated, updated and
recovered without developer intervention.

TASKS:

17.1 Build reproducible Windows installation.
17.2 Implement configuration migrations.
17.3 Implement database migrations.
17.4 Implement backup and restore.
17.5 Implement clean uninstall behavior.
17.6 Implement reliable startup services.
17.7 Implement crash recovery.
17.8 Implement update and rollback.
17.9 Implement diagnostics export.
17.10 Implement performance monitoring.
17.11 Implement dependency and secret scanning.
17.12 Implement compatibility test matrices.
17.13 Perform long-duration endurance testing.
17.14 Perform clean-machine installation tests.
17.15 Verify existing user-state preservation.
17.16 Publish release documentation and known limitations.

EXIT CONDITION:

The application can be installed, used, restarted, upgraded and
recovered through documented and independently verified procedures.

======================================================================
26. REQUIRED ACCEPTANCE TESTING
======================================================================

The following categories are mandatory release gates.

A. HOST AND CONNECTION

- Clean startup.
- Stable HTTP and WebSocket connections.
- Gateway reconnect recovery.
- UI session restoration.
- Restart persistence.
- Correct readiness reporting.

B. CURRENT UI

- All retained pages load.
- All retained pages scroll correctly.
- Buttons perform real actions.
- Forms persist changes.
- Model controls work.
- Agent controls work.
- Search works.
- Memory controls work.
- Skills and plugins work.

C. MODELS

- Multiple providers.
- Independent agent assignments.
- Real provider response.
- Real tool calls.
- True streaming.
- Fallback after provider failure.
- Cancellation.
- Offline local model operation where supported.

D. AGENTS

- Actual child execution.
- Parallel independent work.
- Dependency management.
- Workspace separation.
- Shared context when required.
- Failure recovery.
- Accurate final result consolidation.

E. SKILLS AND PLUGINS

- Import a real compatible external package.
- Install it.
- Configure it.
- Discover its capabilities.
- Execute it through a task.
- Verify the result.
- Update it.
- Disable it.
- Remove it.

F. COMPUTER OPERATION

- Accurate window selection.
- Correct text entry and read-back.
- General mouse and keyboard operation.
- Scrolling and dynamic UI.
- Multiple monitor handling.
- Browser workflows.
- User takeover.
- Action cancellation.
- Error recovery.

G. CONTINUOUS OBSERVATION

- Continuous screen capture.
- Adaptive sampling.
- Rolling RAM retention.
- No uncontrolled persistent raw-frame storage.
- Local vision extraction.
- Accurate recent-context retrieval.
- Stable CPU and RAM behavior.
- 24-hour operation.
- Multi-monitor handling.
- Restart and sleep recovery.

H. MEMORY

- Conversation continuity.
- Cross-session recall.
- Task memory.
- Screen observation memory.
- Semantic search.
- Memory correction.
- Memory deletion.
- Relevant context retrieval by agents.

I. BACKGROUND TASKS

- Long-running work.
- Pause and resume.
- Cancellation.
- Restart recovery.
- Dependency handling.
- Progress reporting.
- Durable artifacts.
- Failure reporting.

J. CONNECTED DEVICES

- Device discovery.
- Device-specific action routing.
- Reconnection.
- Remote task execution.
- Shared assistant context.

K. FUTURE VOICE

- Natural turn-taking.
- Speech interruption.
- Voice-directed tools.
- Voice-directed agent delegation.
- Chat/voice continuity.
- Accurate background-task reporting.

No test suite may report overall success if a required test has been
silently skipped or replaced with a mock.

Report unsupported integrations as BLOCKED.

Report uncertain observations as UNVERIFIED.

Report incomplete functionality as PARTIAL.

======================================================================
27. PERFORMANCE AND RESOURCE ENGINEERING
======================================================================

ZERO is expected to run background observation and task services while
the owner continues using the computer.

Performance must be treated as a core product requirement.

Establish actual benchmark baselines before fixing numerical targets.

REFERENCE HARDWARE

Windows 10/11.
Intel i9 13th/14th-generation class.
16 GB RAM.
No dedicated GPU.

MEASURE:

- Idle CPU utilization.
- Screen capture CPU utilization.
- Vision inference latency.
- Observation buffer memory.
- Total application memory.
- Model loading overhead.
- Gateway request latency.
- Tool invocation latency.
- Agent task scheduling latency.
- Database write throughput.
- Database retrieval latency.
- UI responsiveness.
- Background task concurrency.
- Recovery after restart.

Create configurable resource budgets.

Initial design targets should include:

- A bounded screen-observation memory allocation.
- No unbounded task queue growth.
- No unbounded model context growth.
- No repeated inference on unchanged screen frames.
- No unnecessary duplication of loaded local models.
- No busy-wait polling loops.
- No continuous high-resolution frame storage without limits.
- No UI freezing during background work.

Do not promise that a CPU-only system can run several large local
models simultaneously at interactive speed.

Use a mixed local/hosted model strategy and benchmark the actual
workloads.

Performance acceptance should be based on measured evidence from
the reference machine, not theoretical hardware specifications.

======================================================================
28. ENGINEERING DELIVERY RULES
======================================================================

The implementation team must follow these rules.

RULE 1:
No shortcuts that reduce required functionality.

RULE 2:
No deleting modules before verifying their active consumers.

RULE 3:
No replacing real integrations with mock outputs.

RULE 4:
No converting demonstration prompts into the only supported commands.

RULE 5:
No calling a feature complete because it exists in the navigation.

RULE 6:
No confusing HTTP 200 with functional page success.

RULE 7:
No confusing agent task creation with real agent execution.

RULE 8:
No confusing a tool dispatch with verified task completion.

RULE 9:
No claiming audio is audible when only media playback state is known.

RULE 10:
No silently removing inherited skills, plugins, channels or features.

RULE 11:
No mass rewriting without a rollback path.

RULE 12:
No destructive database cleanup during normal startup or test execution.

RULE 13:
No permanent competing gateway or task orchestration systems.

RULE 14:
No mandatory dependency on OpenDot or OpenMausBot at runtime.

RULE 15:
No premature full UI redesign.

RULE 16:
No separate backend implementation for future voice.

RULE 17:
No optimistic feature-parity claims without end-to-end verification.

RULE 18:
No fabricated test counts or unsupported production-readiness claims.

RULE 19:
No fixed AI-provider or model-vendor requirement.

RULE 20:
No release while required user workflows remain broken.

======================================================================
29. REQUIRED IMPLEMENTATION REPORT FORMAT
======================================================================

After every significant milestone, produce a factual report containing:

1. Milestone name.
2. Scope completed.
3. Exact repository paths changed.
4. New modules introduced.
5. Modules removed or retired.
6. Why each removal was necessary.
7. Existing features preserved.
8. Actual runtime architecture after the change.
9. Tests executed.
10. Tests passed.
11. Tests failed.
12. Tests blocked.
13. Real execution evidence.
14. Performance measurements where applicable.
15. Known limitations.
16. Remaining work.
17. Commit identifiers.
18. Rollback instructions.
19. Next dependent milestone.

Do not report 100% completion while meaningful functional requirements
remain unimplemented, untested or broken.

The owner must be able to distinguish:

IMPLEMENTED
TESTED
VERIFIED
PARTIAL
BLOCKED
NOT STARTED

A planning document is not an implementation.

A passing unit test is not a complete production feature.

======================================================================
30. FINAL PRODUCT DEFINITION AND END STATE
======================================================================

ZERO AI must ultimately behave as one persistent intelligent assistant
that can coordinate and execute work across models, agents, tools,
computers, applications, data sources and connected devices.

The assistant should understand a user's objective, inspect the
relevant environment, retrieve previous context, develop a plan,
allocate work to appropriate specialist agents, select suitable
models, invoke necessary capabilities, execute operations, detect
changes, verify results, recover from failures, maintain memory and
report outcomes.

The owner should be able to interact with ZERO without needing to
understand which model, worker, plugin or execution route is being used.

The system should support simple actions and complex projects through
the same unified architecture.

It should continuously maintain useful local computer context while
respecting configured resource budgets.

It should allow additional abilities to be installed through skills
and plugins.

It should run persistent background workflows independently of whether
the chat page is open.

It should use native APIs when appropriate and actual computer
interaction when necessary.

It should operate locally where practical and make effective use of
hosted models, remote workers and connected services when beneficial.

It should support multiple independent specialist agents without
fragmenting the primary assistant's knowledge or responsibility.

It should eventually extend from Windows to mobile devices, remote
computers and cloud resources.

It should support personal work and progressively more sophisticated
professional and organizational workflows.

The existing UI is only the first interface.

The primary future interface will be a natural, responsive,
interruptible conversational voice assistant connected to the exact
same intelligence and execution platform.

ZERO must not be developed as a collection of hardcoded examples.

Its capabilities must be general, reusable, discoverable and
composable.

The examples discussed during planning are capability demonstrations,
not product boundaries.

The final engineering standard is:

ZERO UNDERSTANDS.
ZERO REMEMBERS.
ZERO OBSERVES.
ZERO PLANS.
ZERO DELEGATES.
ZERO EXECUTES.
ZERO VERIFIES.
ZERO RECOVERS.
ZERO CONTINUES WORKING.

The assistant must never claim to have done something merely because
it intended to do it.

The application must be an actual operational AI platform, rather
than a visual imitation of one.

======================================================================
31. FINAL INSTRUCTION TO THE DEVELOPMENT TEAM
======================================================================

Build ZERO AI as a coherent, modular, extensible and reliable
JARVIS/FRIDAY-class assistant platform.

Treat the existing repository as the migration foundation.

Retain useful capabilities.

Repair defective components.

Rebuild inadequate architecture.

Remove obsolete implementations only after verified replacement.

Preserve user data.

Preserve existing functional feature coverage.

Integrate useful concepts and appropriately reusable components from
other projects into ZERO's own architecture rather than relying on
their applications as permanent external runtimes.

Complete the core assistant, model gateway, agent workforce, task
engine, capability system, skills, plugins, desktop automation,
continuous screen intelligence, memory, search and background
automation first.

Extend to connected devices, organizational workflows and advanced
remote workers through the same foundation.

Implement real-time voice after the underlying assistant capabilities
are reliable.

Develop the final original ZERO interface after backend behavior and
API contracts have stabilized.

Do not take shortcuts.

Do not silently drop features.

Do not substitute demonstration success for actual functionality.

Do not claim completion without independent verification.

The required result is a continuously useful, context-aware,
multi-model, multi-agent autonomous assistant that performs genuine
work across digital environments and can progressively evolve into
the owner's primary personal and professional AI operating system.

END OF ZERO AI MASTER ROADMAP
