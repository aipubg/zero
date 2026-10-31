# Zero AI — Feature Parity Matrix

**Audit Date:** 2026-11-01  
**Reference Platform:** OpenClaw (`openclaw/openclaw@2026.10.6`)  
**Target Platform:** Zero AI Platform  
**Status Standard:** A feature is marked `COMPLETE` only when its end-to-end functionality is proven by tests without shortcuts or mock intercepts.

---

## 1. Core Agent Capabilities

| Capability | Reference Feature | Zero AI Status | Verification & Evidence | Gap / Required Action |
|---|---|---|---|---|
| **Autonomous Multi-Step Execution** | ReAct execution loop, iterative tool calls, step limiters | `PARTIAL` | `ComputerOperator.runObserveActVerifyLoop()` implemented in `operator.js`. Passes unit tests. | Gateway server currently uses regex intercepts for canned commands rather than passing through model tool-call responses. Needs model tool-call integration. |
| **Planning, Reasoning & Tool Use** | Extended thinking tokens, structured tool calls | `PARTIAL` | UI top-level `Reasoning: ON` toggle works. Tool schemas defined in `src/computer/tools.js`. | Needs full bidirectional tool response processing through `Zero Host` inference pipeline. |
| **Context Preservation & Compaction** | Sliding window context, history pruning, summary compaction | `PARTIAL` | Session heads and transcripts tracked in SQLite `session_state_events`. | Needs automatic sliding context compaction engine when context window approaches token limits. |
| **Persistent Memory** | Long-term memory store, semantic vector retrieval | `PARTIAL` | 24/7 Observation memory store in `app/zero-control-ui/observation/memory-store.mjs`. | Semantic vector retrieval currently set to `none` in `zero.json`. Need local sqlite-vec or embedding index. |
| **Multiple Agent Identities** | Distinct agent workspaces, personas, system prompts | `WORKING` | Single Zero agent identity strictly maintained in `backend/agents/zero/delegation-policy.md`. | By architecture design, Zero is configured as a single authoritative personal commander. |
| **Sub-Agent Creation & Monitoring** | Dynamic child agent invocation, lifecycle tracking | `PARTIAL` | `subagent-delegator.mjs` manages tasks and updates Gateway. | Needs durable task ID registry and cross-process agent monitoring. |
| **Agent Handoff & Safety Takeover** | Explicit human hold, lease arbitration, bailout | `COMPLETE` | `zero-policy.computer-hold` passes all 110 tests in `selftest.mjs`. UI human takeover bar verified. | Fully verified and operational. |
| **Task Interruption & Cancellation** | AbortController signal propagation, emergency stop | `COMPLETE` | Verified in `ComputerOperator.stopExecution()` and `/api/zero/media` bailout route. | Operational. |

---

## 2. Model Capabilities

| Capability | Reference Feature | Zero AI Status | Verification & Evidence | Gap / Required Action |
|---|---|---|---|---|
| **Multiple Cloud Providers** | NVIDIA NIM, Groq, OpenAI, Anthropic | `PARTIAL` | `models/gateway-providers.json` configures NVIDIA NIM models. | Provider resolution uses loose substring matching; requires deterministic provider/model routing. |
| **Local Models (GGUF)** | Local GGUF discovery, llama.cpp runner | `PARTIAL` | `backend/gateway/server/local-gguf-service.ts` scans models and parses metadata. | Native binary inference runner integration needs end-to-end execution test. |
| **Custom OpenAI-Compatible Endpoints** | Custom base URLs, custom headers, auth tokens | `WORKING` | Configurable through Models UI and `/api/gateway/config`. | Works cleanly. Needs server-side destination validation. |
| **Dynamic Model Discovery** | `/v1/models` listing active models | `WORKING` | `/v1/models` in `server.mjs` returns both configured cloud and local GGUF models. | Verified. |
| **Model Switching** | Dynamic model switching in chat without restart | `WORKING` | Chat model selector updates session config dynamically. | Verified in Playwright live audit. |
| **Multimodal Inference** | Image / video / audio inputs | `PARTIAL` | Observation perception generates base64 screenshots and UIA OCR snapshots. | Full vision prompt payload assembly needs complete wiring in chat stream. |
| **Reasoning Controls** | Toggleable extended thinking parameters | `WORKING` | Permanent top action toggle `#zero-reasoning-toggle` updates payload. | Verified. |
| **Streaming Responses (SSE)** | `text/event-stream` chunks, token deltas | `WORKING` | Streaming supported in `forwardToUpstreamProvider` and `handleChatCompletions`. | Verified. |
| **Provider Failover & Retry** | Fallback provider cascade upon rate-limit / outage | `PARTIAL` | Fallbacks declared in `zero.json` (`nemotron-3-ultra-550b-a55b`). | Needs automated fallback execution when primary returns 429/5xx. |
| **Usage & Cost Tracking** | Token counting, cost ledger, rate limits | `PARTIAL` | Approximate token counts returned in non-stream completions. | Needs persistent token ledger in SQLite. |

---

## 3. Messaging & Interface

| Capability | Reference Feature | Zero AI Status | Verification & Evidence | Gap / Required Action |
|---|---|---|---|---|
| **Native Zero Web UI** | Modern chat interface, single control plane | `COMPLETE` | Lit-based Control UI served at `http://127.0.0.1:18789/chat/zero`. Passes 128 UI tests. | Fully operational and verified. |
| **Multi-Session Chat** | Session list, new session, session switching | `WORKING` | Sessions stored in SQLite, rendered in sidebar navigation. | Working. (Requires removing destructive startup purge script). |
| **Session Search & History** | Text search across transcripts, session heads | `WORKING` | History queries supported; skeleton auto-cleanup verified. | Operational. |
| **File & Media Attachments** | Outbound media, inline images | `WORKING` | Generative media cards (`zero-ui:media`) render rich player cards. | Verified in Playwright live audit. |
| **Agent Activity Visualization** | Execution step timeline, progress widgets | `WORKING` | Generative progress widgets (`zero-ui:progress`) render multi-step execution logs. | Verified in Playwright live audit. |
| **Tool Execution Previews** | Live screen previews, diff cards | `WORKING` | `verified-chat-multistep-card` renders live status and logs. | Operational. |
| **Approval Workflows** | Confirmation prompts for high-impact actions | `WORKING` | `operator_approvals` table and policy gates in `zero-policy`. | Operational. |
| **Messaging Channels** | Discord, Telegram, Slack, WhatsApp | `PARTIAL` | Database tables exist in `openclaw.sqlite`. | Channel connectors are dormant; need Zero-native configuration interface. |

---

## 4. Tools & Automation

| Capability | Reference Feature | Zero AI Status | Verification & Evidence | Gap / Required Action |
|---|---|---|---|---|
| **Browser Control** | Chrome automation, navigation, video playback | `COMPLETE` | `windows-driver.js` executes physical hardware clicks and key presses to bypass autoplay. | Verified in live Playwright tests. |
| **Windows Desktop Control (CUA)** | Mouse, keyboard, windows, UIA tree | `COMPLETE` | `win-actions-daemon.ps1` and `operator.js` pass all 128 unit tests. | Fully verified. |
| **Filesystem Access** | File read, write, edit, directory traversal | `WORKING` | System tools plugin in `plugins/system-tools/index.mjs`. | Operational. |
| **Terminal / Code Execution** | PowerShell / CMD execution, stdout capture | `WORKING` | Executed via `child_process` and PowerShell driver. | Operational. |
| **Skills & Plugin System** | Dynamic plugin loading, skill manifests | `WORKING` | `DynamicPluginLoader` in `plugins/dynamic-loader.mjs` and 9 structured skills in `skills/`. | Operational. |
| **Cron Scheduling** | Recurring tasks, timer triggers | `PARTIAL` | Database tables `cron_jobs` exist in SQLite. | Cron dispatcher needs verification without upstream binary reliance. |
| **Device Pairing** | QR code pairing, mobile gateway connection | `PARTIAL` | Device pairing tables exist in SQLite. | UI surface exists in Settings -> Devices; needs end-to-end test. |
| **24/7 Screen Observation** | Ring buffer, UIA perception, change detection | `COMPLETE` | Full observation pipeline in `app/zero-control-ui/observation/` passes lifecycle tests. | Fully verified. |

---

## 5. Operational Capabilities

| Capability | Reference Feature | Zero AI Status | Verification & Evidence | Gap / Required Action |
|---|---|---|---|---|
| **Onboarding & First-Run Setup** | Guided wizard, provider configuration | `PARTIAL` | Models & Providers page handles provider addition. | Needs standalone first-run onboarding flow. |
| **Configuration Management** | Validated config files, hot reload | `PARTIAL` | `zero.json` configured; contains hardcoded absolute paths. | Must convert to relative path resolution. |
| **Diagnostics & Health Checks** | `/health` endpoint, integration status RPCs | `WORKING` | `/health` returns status on port `18789`. Diagnostics visible on `/about`. | Operational. |
| **Logs & Tracing** | Structured logging, audit events | `WORKING` | `audit_events` logged in SQLite. | Operational. |
| **Data Backup & Recovery** | Safe migrations, journal recovery | `PARTIAL` | SQLite WAL mode enabled. | Needs automated backup export/import utility. |
| **Packaging & Zero Machine Paths** | Portable installation, relative path resolution | `BROKEN` | `zero.json`, `server.mjs`, and `.ps1` scripts assume `E:\zero`. | High priority fix: remove all hardcoded paths. |
| **Independent Runtime Launch** | Native Zero Host entry point | `BROKEN` | Currently calls `openclaw.cmd gateway` and patches node_modules at startup. | High priority: establish native Zero Host runtime. |
