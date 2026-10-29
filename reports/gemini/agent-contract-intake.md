# GEM-04 — Specialist Agent Prompt, Tool Boundary, and Result Contract Intake Audit

**Date:** 2026-10-23  
**Owner:** Gemini (Skills and Reuse Intake Developer)  
**Status:** Complete / Ready for Review  
**Audited Sources:**
- `backend/config/openclaw.json` (live Gateway configuration)
- `backend/config/openclaw.template.json` (baseline template)
- `backend/.openclaw/agents/zero/`, `researcher/`, `operator/` (workspaces and sqlite stores)
- `backend/plugin/` (`zero-policy` manifest, `index.js`, `selftest.mjs`)
- `upstream/openclaw/docs/tools/subagents.md`, `subagents/tool-reference.md`, `subagents/tool-policy.md`, `subagents/operations.md`, `subagents/nesting.md`, `subagents/announce.md`
- `upstream/openclaw/docs/gateway/config-agents/entries-and-multi-agent.md`, `openai-http-api.md`, `embedding.md`
- `upstream/hermes-agent/` (`AGENTS.md`, `LICENSE`, `toolsets.py`, `run_agent.py`)
- `reports/backend/personalization.md` (BE-03 live proof), `reports/backend/mvp-backend.md` (BE-02 plan), `reports/backend/control-ui-backend-contract.md`
- `app/zero-control-ui/browser.js` (UI-03/UI-04 native seam)

**Target Audience:** Qoder (Backend/BE-02 & BE-03, Computer/CU-02), OpenCode (UI/UI-04 assistant-first & activity view), ChatGPT (Senior Review).

---

## 1. Product Constraints & Architecture Alignment

Zero AI operates as a unified, private, single-user system:
1. **One Assistant-Facing Surface:** The native OpenClaw Control UI contribution (`app/zero-control-ui/`), linking to canonical Gateway destinations.
2. **One Runtime Engine:** The OpenClaw Gateway (`backend/`) on loopback port `18789`.
3. **One Canonical Data Source:** Gateway SQLite and transcript sessions. No second transcript database, orchestrator engine, custom prompt store, or external agent runtime.

This audit establishes the formal contract for Zero's multi-agent team—**Lead (`zero`)**, **Researcher (`researcher`)**, and **Operator (`operator`)**—evaluating role definitions, tool perimeters, delegation rules, artifact/result schemas, interruption models, and budget limits against source code and active configuration.

---

## 2. Team Architecture & Agent Contract Matrix

The multi-agent hierarchy is declared in `backend/config/openclaw.json:59-145` with explicit ownership (`"agents.ownership": "explicit"`):

| Attribute | Lead (`zero`) | Researcher (`researcher`) | Operator (`operator`) |
|---|---|---|---|
| **Role & Purpose** | Primary assistant; user conversation; team task dispatch & synthesis | Bounded read-only research across web and allowed files | Dedicated computer/desktop control in designated isolated environment |
| **Workspace Root** | `E:\zero\backend\.openclaw\agents\zero` | `E:\zero\backend\.openclaw\agents\researcher` | `E:\zero\backend\.openclaw\agents\operator` |
| **Model Route** | `zero-gw/z-ai/glm-5.3-flash` (Primary & Utility) | `zero-gw/z-ai/glm-5.3-flash` (Inherited from defaults) | `zero-gw/z-ai/glm-5.3-flash` (Primary) |
| **Vision Input** | Declared `["text", "image"]` (shared row) | Declared `["text", "image"]` (shared row) | Declared `["text", "image"]` (Required for screen observation) |
| **Tool Profile** | `coding` (`openclaw.json:89`) | `coding` (`openclaw.json:106`) | `coding` (`openclaw.json:132`) |
| **Granted Tools** | Default `coding` set (read, write, edit, patch, memory, spawn) | Read-only file inspection, `web_search`, `web_fetch`, `memory_search` | Default `coding` inspection tools + `computer` (`openclaw.json:134`) |
| **Denied Tools** | Excludes `computer` (clean per preflight check) | Explicitly denies `write`, `edit`, `apply_patch`, `exec`, `process`, `browser`, `computer` | Excludes host shell commands; `exec.mode: "deny"` |
| **Host `exec` Policy** | `mode: "ask"` (requires explicit human approval) | `mode: "deny"` (strictly disabled) | `mode: "deny"` (strictly disabled per D-011) |
| **Delegation Edges** | `allowAgents: ["researcher", "operator"]` (`:95-98`) | `allowAgents: []` (`:121`) | `allowAgents: []` (`:141`) |
| **Max Children** | `maxChildrenPerAgent: 3`, `maxConcurrent: 2` | 0 (cannot spawn) | 0 (cannot spawn) |
| **Max Spawn Depth**| `maxSpawnDepth: 2` | 0 (leaf worker) | 0 (leaf worker) |
| **Delivery Mode** | Direct user chat over Gateway WS | Hidden subagent completion to parent (`mode: "run"`) | Hidden subagent completion to parent (`mode: "run"`) |
| **Screen Output** | None | None | Model-only image frames; RFB relay to UI Desktop panel |

---

## 3. Lead Agent (`zero`) Contract

### 3.1 Purpose & Role Definition
The Lead agent (`zero`) is the sole entity with direct conversational contact with the user. It handles all general queries, plans multi-step projects, delegates subtasks to specialists, receives announced results, synthesizes findings, and maintains user persona continuity.

### 3.2 Tool Boundary & Permissions
- **Profile:** `tools.profile: "coding"` (`openclaw.json:89`).
- **File System Operations:** Allowed full workspace read/write/edit/patch capabilities for managing local code and artifacts.
- **Execution Guard:** `tools.exec.mode: "ask"` (`openclaw.json:90-92`). Shell commands require human confirmation, preventing arbitrary unattended host script execution.
- **Computer Boundary:** Zero has **no `computer` grant**. In `preflight.mjs:207`, `!grantsFor("zero").includes("computer")` is strictly asserted. The Lead cannot directly send desktop input or take screenshots, neutralizing prompt injection attacks from external web content attempting to drive the GUI.
- **Memory Operations:** Exposes `memory_search` and `memory_get` (`memory-core` FTS-only). Allows recalling past decisions from `MEMORY.md` and user preferences from `USER.md`.

### 3.3 Delegation Rights & Orchestration
- **Allowed Targets:** `subagents.allowAgents: ["researcher", "operator"]` (`openclaw.json:95-98`).
- **Enforcement:** `subagents.requireAgentId: true` (`openclaw.json:99`). Calls to `sessions_spawn` omitting an explicit target `agentId` are rejected; the Lead cannot accidentally spawn recursive copies of itself.
- **Concurrency & Nesting:**
  - `maxConcurrent: 2`: Bounded execution prevents workstation overload.
  - `maxChildrenPerAgent: 3`: Up to 3 active children per parent session.
  - `maxSpawnDepth: 2`: Bounded hierarchy (Lead -> Specialist). Specialists cannot create further subagents.
- **Orchestration Flow:**
  1. Calls `sessions_spawn { agentId: "researcher" | "operator", task: "...", mode: "run", context: "isolated", expectsCompletionMessage: true }`.
  2. Receives receipt with `childSessionKey` and `runId`.
  3. Calls `sessions_yield` to pause the turn and yield execution.
  4. Awakened by Gateway completion delivery with `[Subagent Context]` containing child findings.
  5. Continues generation and produces final response to user.

### 3.4 Result & Artifact Shape
- **User-Facing:** Markdown text streamed over the Gateway WebSocket (`chat` events, `deltaText`).
- **Session Keys:** Main session keys follow `agent:zero:main` or `zero-thread-<uuid>` (`mvp-backend.md` §5).
- **Workspace Artifacts:** Writes curated summaries to `MEMORY.md` and daily notes to `memory/YYYY-MM-DD.md`.

### 3.5 Cancellation & Timeout Behavior
- **Explicit Stop:** Responds to Gateway `chat.abort { runId }`, `sessions.abort`, or user typing `/stop`. Stopping the Lead cascades downward, aborting active child runs under that run lineage (`upstream/openclaw/docs/tools/subagents/operations.md:247-251`).
- **Turn Timeout:** Bound by Gateway session defaults (`agents.defaults.timeoutSeconds`, 48h default; custom turn limits in CLI acceptance script set to 240–260s).

### 3.6 Token & Action Budget Evidence
- **Model Parameters:** `contextWindow: 128000`, `contextTokens: 96000`, `maxTokens: 4096` (`openclaw.json:45-47`).
- **Action Caps:** Bounded by `zero-policy` (`openclaw.json:203`): `maxActionsPerRun: 400`.
- **Accounting:** `usage.status`, `usage.cost`, and `sessions.usage` report cumulative token consumption; they act as informational telemetry rather than hard token-kill gates.

### 3.7 Exact Gaps
1. **Uncompleted Bootstrap:** `E:\zero\backend\.openclaw\agents\zero\BOOTSTRAP.md` is still present (7,479 bytes), and `IDENTITY.md` contains unpopulated template text (`(pick something you like)`).
2. **Generic Persona:** `AGENTS.md` is the unspecialized upstream template. It does not instruct the Lead on Zero-specific role boundaries, team coordination rules, or explicit JSON handoff formats.
3. **Implicit Tool Knowledge:** Lead relies on general model reasoning or the Workshop skill `subagent-echo-check` to know how to call `sessions_spawn` and `sessions_yield`.

---

## 4. Researcher Agent (`researcher`) Contract

### 4.1 Purpose & Role Definition
The Researcher specialist conducts targeted investigation, information gathering, web searches, and documentation audits. It operates in an isolated environment without the authority to mutate the filesystem, run shell processes, or manipulate the desktop.

### 4.2 Tool Boundary & Hard Denials
- **Profile:** `tools.profile: "coding"` (`openclaw.json:106`).
- **Explicit Denials:** `tools.deny: ["write", "edit", "apply_patch", "exec", "process", "browser", "computer"]` (`openclaw.json:107-115`).
- **Execution Denial:** `tools.exec.mode: "deny"` (`openclaw.json:117`).
- **Subagent Policy Stripping:** OpenClaw's subagent layer automatically strips `gateway`, `agents_list`, `session_status`, `progress_card`, `cron`, `sessions_send`, `conversations_*`, and `message` (`upstream/openclaw/docs/tools/subagents/tool-policy.md:41-49`).
- **Effective Toolset:**
  - `read`, file inspection, directory browsing (read-only).
  - `web_search`, `web_fetch` (information gathering).
  - `memory_search`, `memory_get` (read-only memory recall).
- **Security Invariant:** Cannot alter files or execute commands. If web retrieval encounters adversarial prompts instructing file modification or execution, the underlying tools do not exist.

### 4.3 Delegation Rights
- **Edges:** `subagents.allowAgents: []` (`openclaw.json:121`).
- **Enforcement:** Strictly 0 delegation edges. Researcher cannot spawn subagents or delegate further.
- **Live Proof:** Verified live in `reports/backend/personalization.md` §6: A researcher turn attempting `sessions_spawn` was refused with `agentId is not allowed for sessions_spawn (allowed: none)`.

### 4.4 Result & Artifact Shape
- **Execution Target:** Runs as a hidden background helper (`visible: false`, `mode: "run"`, `completionTarget: "parent"`).
- **Result Schema:** Returns its final assistant turn text verbatim back to the requester session (`zero`) encapsulated in the `[Subagent Context]` delivery envelope.
- **Live Evidence:** Three live child sessions (`ab254470…`, `183ed448…`, `91086fa6…`) and the BE-03 check (`4e34f082…`) successfully returned clean text (`RESEARCH_OK` and `SUBAGENT_ECHO_OK`) back to `zero`.
- **Prohibition:** Cannot create top-level UI threads, cannot message user directly, and cannot open GUI windows.

### 4.5 Cancellation & Timeout Behavior
- **Lifecycle Coupling:** Fully subordinate to the parent run. If the Lead turn is stopped or times out, the Researcher run is cancelled via cascade (`upstream/openclaw/docs/tools/subagents/operations.md:247`).
- **Run Timeout:** Controlled by `runTimeoutSeconds` in `sessions_spawn`. Default is `0` (inherits agent default or no timeout). In BE-03 verification, first turn hit a provider timeout at 240s without leaving orphaned processes.

### 4.6 Token & Action Budget Evidence
- **Context Isolation:** Spawns default to `context: "isolated"` (`upstream/openclaw/docs/tools/subagents/tool-reference.md:19`). Researcher does not ingest Lead's conversation history, keeping prompt token consumption bounded.
- **Action Caps:** Subject to `maxActionsPerRun: 400` in `zero-policy`. Cannot execute input actions (`maxInputActionsPerRun: 200` does not apply because input tools are denied).

### 4.7 Exact Gaps
1. **Redundant Workspace Cloning:** `E:\zero\backend\.openclaw\agents\researcher` contains cloned copies of `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `SOUL.md`, and `USER.md` from Lead. Subagents only inject `AGENTS.md` (`operations.md:352`), ignoring `SOUL.md` and `USER.md`.
2. **Missing Research System Prompt:** Researcher's `AGENTS.md` does not declare research briefing guidelines (e.g., citation formatting, executive summary format, fact-checking rules).
3. **No Output Schema Validation:** Returned data is unstructured markdown. There is no runtime guard ensuring the Researcher adheres to specific structured JSON or brief contracts.

---

## 5. Operator Agent (`operator`) Contract

### 5.1 Purpose & Role Definition
The Operator specialist performs GUI automation, system inspection, and computer interaction inside the designated isolated Zero Windows environment under continuous human supervision.

### 5.2 Tool Boundary & Zero Policy Interception
- **Profile:** `tools.profile: "coding"` + `tools.alsoAllow: ["computer"]` (`openclaw.json:132-135`).
- **Execution Denial:** `tools.exec.mode: "deny"` (`openclaw.json:137`). Conforms strictly to Decision **D-011**: host shell execution is denied to prevent command execution bypasses around the computer control layer.
- **Effective Tools:**
  - `computer` tool (`screen.snapshot`, `computer.act`).
  - Read-only inspection tools.
- **Zero Policy Plugin Interception (`zero-policy.computer-hold`):**
  All `computer` tool invocations pass through `backend/plugin/index.js:before_tool_call`:
  1. **Hold State Gate:** If human takeover is active (`held: true`), all mutative input actions (`click`, `type`, `press`, `drag`, `hotkey`) are **refused immediately** (`refused: true, reason: "computer-hold:active"`).
  2. **Observation Preservation:** Passive observation actions (`screenshot`, `wait`, `list_apps`, `list_windows`, `get_accessibility_tree`, `get_cursor_position`, `get_window_state`, `zoom`, `get_browser_state`, `get_recording_state`) remain **allowed** during a hold.
  3. **Stale Frame Gate:** Upon hold release, `resumeSnapshotRequired` is set to `true`. Input actions are refused (`computer-hold:stale-frame`) until a fresh observation occurs (`openclaw.json:205`).
  4. **Blocked Actions:** `escalate_scope` is permanently blocked (`openclaw.json:191-193`, asserted in `preflight.mjs:305`).
  5. **High-Risk Interception:** `kill_app`, `browser_navigate`, `browser_download`, `browser_set_input_files`, `start_recording`, `replay_trajectory` are flagged for elevated scrutiny (`openclaw.json:194-202`).

### 5.3 Delegation Rights
- **Edges:** `subagents.allowAgents: []` (`openclaw.json:141`).
- **Enforcement:** Operator is a leaf specialist. It cannot spawn subagents or delegate actions.

### 5.4 Result & Artifact Shape
- **Execution Target:** Hidden background helper spawned by `zero` with `expectsCompletionMessage: true`.
- **Result Schema:** Returns action logs, step receipts, and task status back to `zero`.
- **Visual Feedback Architecture:**
  - **Model Vision:** Screenshots are captured via `screen.snapshot`, encoded as base64 images, and passed into the vision-capable model route (`z-ai/glm-5.3-flash`, `input: ["text", "image"]`).
  - **Human Observation:** Screenshots are **never** injected into the user chat stream. The human observes desktop state via the native Control UI Desktop panel (`/systems`), backed by loopback RFB/VNC.
- **Receipts:** Step outcomes (success, refusal reason, hold conflicts) are logged to the plugin's circular audit ring (last 10 entries) and `stats` counters.

### 5.5 Cancellation & Timeout Behavior
- **Hold vs. Cancel:** Takeover (`zero.computer.control { action: "take" }`) **pauses input actions without cancelling the run**. The model remains alive but paused/refused from typing/clicking while the human drives.
- **Emergency Stop:** Clicking Stop in the Control UI or sending `/stop` cascades exact-run cancellation to the Operator immediately.
- **Global Emergency Revocation:** Denying `gateway.nodes.commands.deny: ["computer.act"]` hot-revokes the desktop capability across the entire Gateway under hybrid reload without restarting the process (`mvp-backend.md` §7.2).
- **Disconnect / Crash Recovery:** When a client disconnects while holding the desktop, the Gateway automatically releases the hold, arms `resumeSnapshotRequired`, increments `stats.releasedByDisconnect`, and writes a `connection-closed` audit row (`hold-method-reconciliation.md` §7).

### 5.6 Token & Action Budget Evidence
- **Vision Token Consumption:** Screen frames consume significant context window tokens (~1,000–2,500 tokens per full-screen snapshot). Bounded run length is critical.
- **Action Caps:** Bounded strictly in `openclaw.json:203-204`:
  - `maxActionsPerRun: 400`
  - `maxInputActionsPerRun: 200`
- If an Operator run exceeds 200 input actions, further input calls are rejected by `zero-policy`.

### 5.7 Exact Gaps
1. **CRITICAL WORKSPACE DEFECT:** `E:\zero\backend\.openclaw\agents\operator` contains **NO `AGENTS.md` file** (directory has only `agent/openclaw-agent.sqlite`). When Operator launches, it loads zero workspace instructions, operating purely on base model defaults and tool descriptions!
2. **Missing CUA Guidance:** Operator lacks prompt-level rules on desktop navigation, UI element localization, error recovery, and how to yield to human hold.
3. **CU-01 Live Execution Block:** Actual desktop observe/input actions remain untested live on the designated isolated Windows environment (awaiting O1–O6 environment provisioning).

---

## 6. Hermes Agent Reuse Analysis (Source-Evidenced & MIT-Licensed)

### 6.1 License & Source Provenance
- **Repository:** `upstream/hermes-agent/` (commit `841d1a9` / shallow clone).
- **License File:** `upstream/hermes-agent/LICENSE`
- **Notice:** MIT License, Copyright (c) 2025 Nous Research.
- **Permitted Reuse:** Architectural patterns, prompt engineering concepts, and tool boundary strategies may be adapted into Zero without license conflicts, provided attribution is retained. Python runtime code must not be imported.

### 6.2 Architectural Pattern 1: Strict Core Tool Invariant & Narrow Waist
- **Source Citation:** `upstream/hermes-agent/AGENTS.md:24-27` and `toolsets.py` (`_HERMES_CORE_TOOLS`).
- **Hermes Principle:** *"The core is a narrow waist; capability lives at the edges. Every model tool is sent on every API call, so the bar for a new core tool is high."*
- **Application to Zero:**
  - Zero successfully enforces this invariant: `computer` is restricted strictly to Operator (`tools.alsoAllow: ["computer"]`), preventing tool schema bloat and security risk on Lead and Researcher.
  - Shell execution (`exec`) is completely excised from Researcher and Operator (`mode: "deny"`).
  - OpenClaw's subagent restriction layer strips administrative tools (`gateway`, `cron`, `sessions_send`) from children automatically.

### 6.3 Architectural Pattern 2: Prompt Cache Invariance
- **Source Citation:** `upstream/hermes-agent/AGENTS.md:18-23`.
- **Hermes Principle:** *"Per-conversation prompt caching is sacred. Mutating past context, swapping toolsets, reloading memories or rebuilding the system prompt mid-conversation breaks the cached prefix and multiplies the user's cost."*
- **Application to Zero:**
  - Agent system prompts and tool schemas in Zero are static and configured at startup in `openclaw.json`.
  - Spawning subagents with `context: "isolated"` ensures that child sessions maintain their own stable cached prompt prefix without invalidating or polluting the Lead's context window.

### 6.4 Architectural Pattern 3: Dual-Store Mental Model
- **Source Citation:** `upstream/hermes-agent/AGENTS.md:98-100`, evaluated in `reports/gemini/skill-lifecycle.md` §4.
- **Hermes Principle:** Strict bifurcation of user profile directives (`USER.md`, imperative style: `Always`, `Never`, `Prefer`) vs. durable factual memory (`MEMORY.md`).
- **Application to Zero:**
  - Zero's agent workspaces already allocate separate budgets for `USER.md` (4,000 characters) and `MEMORY.md`.
  - Bounded prompt injection prevents memory recall from overwhelming context windows on NVIDIA NIM GLM-5.3 Flash.

### 6.5 Architectural Pattern 4: Task-Oriented Subagent Delivery
- **Source Citation:** `upstream/hermes-agent/run_agent.py` and `tools/registry.py`.
- **Hermes Principle:** Subagents receive focused task briefs and return structured summaries rather than raw conversation replays.
- **Application to Zero:**
  - Directly matches OpenClaw's `sessions_spawn` with `task` parameter and push-based completion delivery via `[Subagent Context]`.

---

## 7. Actionable Deliverables & Downstream Guidance

### 7.1 For Qoder (Backend / BE-02, BE-03 & Computer / CU-02)
1. **Provision Operator Workspace Prompt:** Create `E:\zero\backend\.openclaw\agents\operator\AGENTS.md`. At present, Operator has no `AGENTS.md`. It must define the operator's mission (computer-only actions, structured step logging, no command-line assumptions).
2. **Clean Up Orphaned Bootstrap Files:** In `agents/zero` and `agents/researcher`, archive or delete `BOOTSTRAP.md` and complete `IDENTITY.md` so startup context is clean and does not waste prompt tokens.
3. **Tailor Researcher `AGENTS.md`:** Replace the generic template with explicit research specialist instructions: mandate structured markdown briefs, emphasize read-only safety, and forbid code execution.
4. **Assert Role-Contract Integrity in Selftest/Preflight:** Add assertions in `preflight.mjs` verifying:
   - `operator` has `AGENTS.md` present.
   - `researcher` has `AGENTS.md` present.
   - `researcher.subagents.allowAgents` is empty (`[]`).
   - `operator.subagents.allowAgents` is empty (`[]`).
5. **Enforce Bounded Run Budgets:** Maintain `maxActionsPerRun: 400` and `maxInputActionsPerRun: 200` in `zero-policy`. Keep usage reporting RPCs designated as informational telemetry.

### 7.2 For OpenCode (UI / UI-04 Assistant-First & Activity Presentation)
1. **Assistant-First Hierarchy in Navigation:**
   - Anchor `zero` as the sole primary conversation entry in Chat (`/chat`).
   - Treat `researcher` and `operator` as nested worker runs, never as standalone conversational peer chats in the sidebar.
2. **Specialist Activity Presentation:**
   - In the Team page and Activity timeline, render subagent sessions using role badges (`Lead`, `Researcher`, `Operator`) derived via `agentRole(agent)` in `browser.js:146-150`.
   - Distinguish delegated runs using `isDelegated(session)` (`parentSessionKey` or `spawnDepth > 0`).
3. **Artifact & Brief Rendering:**
   - Display Researcher completion deliveries as structured Research Brief cards with markdown support.
   - Display Operator runs with step/action counts and direct deep-links to `/systems` Desktop panel.
4. **Reconnect State Integrity:**
   - Clear cached `computer.snapshot` on disconnect and display `"checking"` on connection-generation changes to avoid displaying stale ownership before `zero.computer.control` status resolves.

---

## 8. Limitations & Scope Discipline

- **Read-Only Investigation:** All findings are derived from source code, static configuration files, and previously verified live transcripts. No files in `app/`, `backend/`, `computer/`, or `upstream/` were modified.
- **No Model Downloads or External Registries:** All capabilities rely strictly on configured NVIDIA NIM endpoints and built-in Gateway mechanics.
- **Designated Environment Prerequisite:** Real desktop observe/input actions and live hold refusal under actual mouse/keyboard driving remain blocked on CU-01's designated isolated Zero Windows environment (O1–O6).
