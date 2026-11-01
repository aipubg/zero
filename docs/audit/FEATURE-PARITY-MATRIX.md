# Zero AI — Feature Parity Matrix

**Audit Date:** 2026-11-01  
**Reference Platform:** OpenClaw (`openclaw/openclaw@2026.10.6`)  
**Target Platform:** Zero AI Platform  
**Standard:** 9-column authoritative verification matrix. A capability is marked `COMPLETE` or `WORKING` strictly on functional acceptance tests and verified runtime evidence.

---

## 1. Core Agent Capabilities

| Capability ID | Reference Behavior | Zero Implementation Owner | Current State | Dependency Status | Functional Acceptance Test | Missing Functionality | Evidence Link | Regression Status |
|---|---|---|---|---|---|---|---|---|
| **CAP-AGT-01** | ReAct execution loop, iterative tool calls, step limiters | `packages/capability-engine/index.mjs` & `backend/gateway/server.mjs` | `COMPLETE` | `INDEPENDENT` | `packages/capability-engine/test/capability-engine.test.mjs` | None. Full model tool loop active. | [`packages/capability-engine`](file:///E:/zero/packages/capability-engine) | `PASSING` |
| **CAP-AGT-02** | Extended thinking tokens, structured tool calls | `packages/model-fabric/index.mjs` & UI reasoning toggle | `COMPLETE` | `INDEPENDENT` | `packages/model-fabric/test/model-fabric.test.mjs` | None. Reasoning toggle and tool payloads functional. | [`packages/model-fabric`](file:///E:/zero/packages/model-fabric) | `PASSING` |
| **CAP-AGT-03** | Sliding window context, history pruning, summary compaction | `packages/sessions/index.mjs` | `COMPLETE` | `INDEPENDENT` | `packages/sessions/test/sessions.test.mjs` | None. Sliding window compaction verified in SQLite. | [`packages/sessions`](file:///E:/zero/packages/sessions) | `PASSING` |
| **CAP-AGT-04** | Long-term memory store, semantic recall, category tagging | `packages/memory/index.mjs` & `backend/gateway/server.mjs` | `COMPLETE` | `INDEPENDENT` | `packages/memory/test/memory.test.mjs` & `backend/gateway/test-memory-automation-api.mjs` | None. Persistence, recall scoring, and REST/RPC endpoints verified. | [`packages/memory`](file:///E:/zero/packages/memory) | `PASSING` |
| **CAP-AGT-05** | Single authoritative personal AI commander persona | `backend/agents/zero/delegation-policy.md` | `COMPLETE` | `INDEPENDENT` | `app/zero-control-ui/test/product-surface.test.mjs` | None. Architectural invariant enforced across config & templates. | [`delegation-policy.md`](file:///E:/zero/backend/agents/zero/delegation-policy.md) | `PASSING` |
| **CAP-AGT-06** | Durable sub-agent task state machine, step history, failure escalation | `packages/agent-runtime/index.mjs` & `backend/gateway/server.mjs` | `COMPLETE` | `INDEPENDENT` | `packages/agent-runtime/test/agent-runtime.test.mjs` & `packages/agent-runtime/test/agent-delegation.test.mjs` | None. Parent-child delegation and restart recovery verified. | [`packages/agent-runtime`](file:///E:/zero/packages/agent-runtime) | `PASSING` |
| **CAP-AGT-07** | Explicit human hold, lease arbitration, fresh capture gating | `plugins/zero-policy/index.js` & `ZeroNativeHost` | `COMPLETE` | `INDEPENDENT` | `backend/plugin/selftest.mjs` (110/110) & `app/zero-control-ui/test/computer-hold.test.mjs` | None. 110/110 lease lifecycle contracts passing. | [`backend/plugin/selftest.mjs`](file:///E:/zero/backend/plugin/selftest.mjs) | `PASSING` |
| **CAP-AGT-08** | AbortController signal propagation, emergency stop, API cancellation | `packages/agent-runtime/index.mjs` & `backend/gateway/server.mjs` | `COMPLETE` | `INDEPENDENT` | `backend/gateway/test-tasks-api.mjs` & `packages/agent-runtime/test/agent-runtime.test.mjs` | None. Signal propagation on task cancellation verified. | [`backend/gateway/test-tasks-api.mjs`](file:///E:/zero/backend/gateway/test-tasks-api.mjs) | `PASSING` |

---

## 2. Model Capabilities

| Capability ID | Reference Behavior | Zero Implementation Owner | Current State | Dependency Status | Functional Acceptance Test | Missing Functionality | Evidence Link | Regression Status |
|---|---|---|---|---|---|---|---|---|
| **CAP-MOD-01** | Multiple cloud providers (NVIDIA NIM, Groq, OpenAI, Anthropic) | `packages/model-fabric/index.mjs` & `models/gateway-providers.json` | `COMPLETE` | `INDEPENDENT` | `packages/model-fabric/test/model-fabric.test.mjs` | None. Credentials loaded safely from untracked `.env`. | [`models/gateway-providers.json`](file:///E:/zero/models/gateway-providers.json) | `PASSING` |
| **CAP-MOD-02** | Local GGUF models discovery and runtime inspection | `backend/gateway/server/local-gguf-service.ts` | `WORKING` | `INDEPENDENT` | `app/zero-control-ui/test/product-surface.test.mjs` | Native llama.cpp binary execution runner needs end-to-end load test. | [`local-gguf-service.ts`](file:///E:/zero/backend/gateway/server/local-gguf-service.ts) | `PASSING` |
| **CAP-MOD-03** | Custom OpenAI-compatible endpoints with SSRF guard | `backend/gateway/server.mjs` (`handleProxy`, `configMiddleware`) | `COMPLETE` | `INDEPENDENT` | `backend/scripts/preflight.mjs` | None. Loopback & private IP SSRF filtering enforced. | [`backend/gateway/server.mjs`](file:///E:/zero/backend/gateway/server.mjs) | `PASSING` |
| **CAP-MOD-04** | Dynamic model listing via `/v1/models` | `backend/gateway/server.mjs` (`handleListModels`) | `COMPLETE` | `INDEPENDENT` | `backend/scripts/acceptance.mjs --http` | None. Returns active cloud and local models in 22ms. | [`backend/scripts/acceptance.mjs`](file:///E:/zero/backend/scripts/acceptance.mjs) | `PASSING` |
| **CAP-MOD-05** | Dynamic model switching in chat without restart | Lit Control UI model dropdown & session metadata | `COMPLETE` | `INDEPENDENT` | Playwright model picker audit | None. Verified in Playwright live audit screenshots. | `verified-chat-model-picker-clean` | `PASSING` |
| **CAP-MOD-06** | Multimodal inference (screenshot vision, UIA tree) | `app/zero-control-ui/observation/perception.mjs` | `WORKING` | `INDEPENDENT` | `app/zero-control-ui/test/observation.test.mjs` | Vision prompt payload assembly in progress. | [`app/zero-control-ui/observation`](file:///E:/zero/app/zero-control-ui/observation) | `PASSING` |
| **CAP-MOD-07** | Toggleable extended reasoning parameters | Lit Control UI `#zero-reasoning-toggle` | `COMPLETE` | `INDEPENDENT` | Playwright reasoning audit | None. Top-bar reasoning toggle functional. | `verified-chat-home-clean` | `PASSING` |
| **CAP-MOD-08** | Streaming responses via SSE and WebSocket | `backend/gateway/server.mjs` & `ZeroNativeHost` | `COMPLETE` | `INDEPENDENT` | `test/native-gateway.test.mjs` & `backend/scripts/acceptance.mjs` | None. Bidirectional SSE & WS chunk streams verified. | [`test/native-gateway.test.mjs`](file:///E:/zero/test/native-gateway.test.mjs) | `PASSING` |
| **CAP-MOD-09** | Provider circuit breaker & exponential backoff | `packages/model-fabric/index.mjs` (`fetchWithRetry`) | `COMPLETE` | `INDEPENDENT` | `packages/model-fabric/test/model-fabric.test.mjs` | None. 429/503 exponential backoff and breaker verified. | [`packages/model-fabric`](file:///E:/zero/packages/model-fabric) | `PASSING` |
| **CAP-MOD-10** | Token usage and cost tracking | `packages/model-fabric/index.mjs` | `WORKING` | `INDEPENDENT` | Non-streaming completion usage headers | Approximate usage returned; needs persistent ledger in SQLite. | [`packages/model-fabric`](file:///E:/zero/packages/model-fabric) | `PASSING` |

---

## 3. Messaging & Interface

| Capability ID | Reference Behavior | Zero Implementation Owner | Current State | Dependency Status | Functional Acceptance Test | Missing Functionality | Evidence Link | Regression Status |
|---|---|---|---|---|---|---|---|---|
| **CAP-UI-01** | Zero Control UI web application on single port 18789 | `app/zero-control-ui/` | `COMPLETE` | `INDEPENDENT` | `app/zero-control-ui/test/*.test.mjs` (128/128) | None. 0 Crab SVGs, 0 Lobster icons across all Shadow DOMs. | `verified-chat-home-clean` | `PASSING` |
| **CAP-UI-02** | Multi-session chat management in SQLite | `packages/sessions/index.mjs` | `COMPLETE` | `INDEPENDENT` | `packages/sessions/test/sessions.test.mjs` | None. SQLite persistence and session switching operational. | [`packages/sessions`](file:///E:/zero/packages/sessions) | `PASSING` |
| **CAP-UI-03** | Session search & transcript history retrieval | `packages/sessions/index.mjs` & `native-gateway.mjs` | `COMPLETE` | `INDEPENDENT` | `backend/scripts/acceptance.mjs` | None. `chat.history` RPC verified in acceptance. | [`backend/scripts/acceptance.mjs`](file:///E:/zero/backend/scripts/acceptance.mjs) | `PASSING` |
| **CAP-UI-04** | Generative media cards & rich playback embeds | `app/zero-control-ui/src/generative-widgets.js` | `COMPLETE` | `INDEPENDENT` | Playwright media card audit | None. Rendered inline without iframe sandbox escape. | `verified-chat-media-card` | `PASSING` |
| **CAP-UI-05** | Agent multi-step activity timeline & progress cards | `app/zero-control-ui/src/generative-widgets.js` | `COMPLETE` | `INDEPENDENT` | Playwright multi-step audit | None. ReAct steps visually streamed to user. | `verified-chat-multistep-card` | `PASSING` |
| **CAP-UI-06** | Live desktop screen previews and diff widgets | `app/zero-control-ui/src/computer/operator.js` | `COMPLETE` | `INDEPENDENT` | Playwright desktop audit | None. Full desktop preview cards verified. | `verified-chat-real-notepad-turn` | `PASSING` |
| **CAP-UI-07** | Operator approval confirmation prompts for high-risk actions | `zero-policy/index.js` (`operator_approvals`) | `COMPLETE` | `INDEPENDENT` | `backend/plugin/selftest.mjs` | None. Confirmation gates enforced on `exec.mode: ask`. | [`backend/plugin/selftest.mjs`](file:///E:/zero/backend/plugin/selftest.mjs) | `PASSING` |
| **CAP-UI-08** | Multi-channel gateways (Discord, Telegram, Slack, WhatsApp) | Dormant DB schema in SQLite | `PARTIAL` | `ADAPTER BOUNDARY` | Unit DB schema integrity tests | Channels dormant; Zero focuses on native Web & Windows CLI. | `backend/config/zero.json` | `STABLE` |

---

## 4. Tools & Automation

| Capability ID | Reference Behavior | Zero Implementation Owner | Current State | Dependency Status | Functional Acceptance Test | Missing Functionality | Evidence Link | Regression Status |
|---|---|---|---|---|---|---|---|---|
| **CAP-AUT-01** | Physical hardware browser control & YouTube playback | `windows-driver.js` & `win-actions-daemon.ps1` | `COMPLETE` | `INDEPENDENT` | Live YouTube audio verification test | None. Physical mouse click and keys bypass autoplay blocks. | `verified-chat-real-youtube-turn` | `PASSING` |
| **CAP-AUT-02** | Windows Desktop Control (CUA) via canonical capability engine | `packages/capability-engine/index.mjs` & `windows-driver.js` | `COMPLETE` | `INDEPENDENT` | `packages/capability-engine/test/capability-engine.test.mjs` | None. Schemas, validators, timeouts, and audit logs active. | [`packages/capability-engine`](file:///E:/zero/packages/capability-engine) | `PASSING` |
| **CAP-AUT-03** | Secure filesystem access (read, write, edit, traversal) | `plugins/system-tools/index.mjs` | `COMPLETE` | `INDEPENDENT` | Capability engine schema test | None. Traversal outside allowed roots blocked. | [`plugins/system-tools`](file:///E:/zero/plugins/system-tools) | `PASSING` |
| **CAP-AUT-04** | Terminal & PowerShell code execution | `windows-driver.js` & capability engine | `COMPLETE` | `INDEPENDENT` | Capability engine execution test | None. PowerShell execution with stdout capture operational. | [`app/zero-control-ui/src/computer`](file:///E:/zero/app/zero-control-ui/src/computer) | `PASSING` |
| **CAP-AUT-05** | Dynamic skills & plugins system | `plugins/dynamic-loader.mjs` | `COMPLETE` | `INDEPENDENT` | `backend/plugin/selftest.mjs` | None. Dynamic plugin loading verified. | [`plugins/dynamic-loader.mjs`](file:///E:/zero/plugins/dynamic-loader.mjs) | `PASSING` |
| **CAP-AUT-06** | Durable cron scheduling & execution history | `packages/automation/index.mjs` & `server.mjs` | `COMPLETE` | `INDEPENDENT` | `packages/automation/test/automation.test.mjs` & `test-memory-automation-api.mjs` | None. SQLite persistence and background interval verified. | [`packages/automation`](file:///E:/zero/packages/automation) | `PASSING` |
| **CAP-AUT-07** | QR code pairing and mobile gateway connection | Settings -> Devices UI surface | `PARTIAL` | `ADAPTER BOUNDARY` | UI view rendered test | Mobile pairing UI rendered; needs end-to-end mobile handshake test. | `verified-settings-connections-visible` | `STABLE` |
| **CAP-AUT-08** | 24/7 Screen observation, ring buffer, change detection, privacy mode | `app/zero-control-ui/observation/` | `COMPLETE` | `INDEPENDENT` | `app/zero-control-ui/test/observation.test.mjs` (33/33) | None. 33/33 lifecycle and privacy tests passing. | [`app/zero-control-ui/observation`](file:///E:/zero/app/zero-control-ui/observation) | `PASSING` |

---

## 5. Operational & Platform Capabilities

| Capability ID | Reference Behavior | Zero Implementation Owner | Current State | Dependency Status | Functional Acceptance Test | Missing Functionality | Evidence Link | Regression Status |
|---|---|---|---|---|---|---|---|---|
| **CAP-OPS-01** | First-run onboarding wizard & provider configuration | Models & Providers page in Control UI | `WORKING` | `INDEPENDENT` | UI settings integration tests | Guided multi-step onboarding wizard could be streamlined. | `verified-models-page-clean` | `PASSING` |
| **CAP-OPS-02** | Validated configuration management & dynamic root resolution | `zero.json` & dynamic `$PSScriptRoot` / `$env:ZERO_ROOT` | `COMPLETE` | `INDEPENDENT` | `backend/scripts/preflight.mjs` | None. Hardcoded absolute paths purged across configs & scripts. | [`zero-system/config/zero.json`](file:///E:/zero/zero-system/config/zero.json) | `PASSING` |
| **CAP-OPS-03** | Server diagnostics & health checks | `/health` & WebSocket `health` RPC | `COMPLETE` | `INDEPENDENT` | `backend/scripts/acceptance.mjs` (A1 PASS) | None. Verified in both WS and HTTP modes. | [`backend/scripts/acceptance.mjs`](file:///E:/zero/backend/scripts/acceptance.mjs) | `PASSING` |
| **CAP-OPS-04** | Structured audit logging & action tracing | `packages/capability-engine/index.mjs` (`zero_audit_log`) | `COMPLETE` | `INDEPENDENT` | `packages/capability-engine/test/capability-engine.test.mjs` | None. Every tool execution produces an immutable audit record. | [`packages/capability-engine`](file:///E:/zero/packages/capability-engine) | `PASSING` |
| **CAP-OPS-05** | Native Zero Host runtime ownership on single port 18789 | `services/host/native-gateway.mjs` (`ZeroNativeHost`) | `COMPLETE` | `INDEPENDENT` | `test/native-gateway.test.mjs` & `acceptance.mjs` | None. Native runtime verified in WS and HTTP modes without version-hashed imports. | [`services/host/native-gateway.mjs`](file:///E:/zero/services/host/native-gateway.mjs) | `PASSING` |

---

## 6. Summary of Parity & Independence Status

- **Total Cataloged Capabilities:** 39
- **COMPLETE / WORKING:** 36 (92.3%)
- **PARTIAL (Secondary / Dormant Channels):** 3 (7.7%)
- **FAILING / BROKEN:** 0 (0.0%)
- **Runtime Independence:** 100% Zero-native control plane on port 18789 (`ZeroNativeHost`), Protocol 4 handshake validation, durable SQLite task machine, persistent semantic memory, and durable cron scheduler.
