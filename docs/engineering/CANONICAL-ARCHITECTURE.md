# Zero AI — Canonical System Architecture & Engineering Blueprint

**Document Reference:** `docs/engineering/CANONICAL-ARCHITECTURE.md`  
**Classification:** Canonical runtime architecture
**Core Invariant:** ONE Authoritative Control Plane, ONE Primary Assistant, Multi-Model, Multi-Agent, Extensible Execution Engine.

---

## 1. Logical Architecture Diagram

```
Chat UI ─┐
Voice ───┼──> Native Gateway (18789)
Automation┘          │
                     v
             Request Orchestrator <──────> Intelligence Services
                     │                     Model Fabric / Agent Teams
                     │                     Voice / Context
                     v
            Director Routing
       (fast deterministic tool choice)
                     │
                     v
          Persistent Mission State
           (ordered app sub-goals)
                     │
                     v
           Computer Capabilities
                     │
          ┌──────────┴───────────┐
          v                      v
  Browser Automation     Desktop / Keyboard /
  (DOM, CDP, media)      UIA / Vision / Apps
          └──────────┬───────────┘
                     v
          Mode / Policy / Audit
                     │
          SQLite + Persistent Memory

Request, chat, capability, task, mission, voice and automation progress
is published through the Gateway Event Bus to the owning or subscribed UI.
```

---

## 2. The Core Execution Lifecycle

Every task—from opening a browser to multi-step software development—flows through this unified, immutable lifecycle:

```
1. USER INTENT
   └─ Chat, voice, and scheduled goal requests enter the native gateway.
2. REQUEST ORCHESTRATION
   └─ One request orchestrator creates the assistant turn and publishes lifecycle events.
3. DIRECTOR ROUTING
   └─ Deterministic system routes run before model planning where appropriate.
4. MISSION DECOMPOSITION
   └─ Multi-app prompts become ordered, durable sub-missions in SQLite.
5. EXECUTION
   └─ The orchestrator dispatches each sub-mission through the capability engine; a failed mission does not skip later ones.
6. OBSERVATION & VERIFICATION
   └─ Browser, UIA, desktop, and media results determine each mission's outcome.
7. STATE RECONCILIATION
   └─ Task steps and mission transitions persist as work proceeds.
8. USER REPORT
   └─ The event bus streams scoped progress; the final response summarizes every mission and blocker.
```

---

## 3. Subsystem Boundaries & Single Source of Truth

| Subsystem | Canonical Module Path | Authority & Responsibilities | Prohibited Competing Logic |
|---|---|---|---|
| **Host Control Plane** | `services/host/native-gateway.mjs` | Single listener on `18789`; HTTP routes, WebSocket upgrades, lifecycle | No competing gateways on same port; no zero daemon wrapper |
| **Request Orchestrator** | `services/host/request-orchestrator.mjs` | Common assistant request and capability dispatch path for chat, voice, automation, and computer actions | No UI execution path bypassing the orchestrator |
| **Gateway Event Bus** | `services/host/gateway-event-bus.mjs` | Scopes request, chat, capability, task, mission, voice, and automation progress to owners/subscribers | No separate competing chat/voice progress stream |
| **Director & Mission State** | `packages/capability-engine/director-routing.mjs`; `packages/capability-engine/mission-state.mjs` | Deterministic simple-request routing and durable ordered multi-app sub-goals (`zero-missions.sqlite`) | No aborting unrelated missions after a partial failure |
| **Security Boundary** | `services/host/security.mjs` | Loopback CORS, DNS rebinding `Host` check, `zero_session` HttpOnly cookie | No wildcard CORS (`*`); no public token exposure in config |
| **Model Fabric** | `packages/model-fabric/index.mjs` | Multi-model resolution, single-pass streaming, token accounting, retries | No double-inference; no synthetic fake responses |
| **Agent Runtime** | `packages/agent-runtime/index.mjs` | Agent state, parent-child delegation, dependency graphs, turn execution | No dummy child tasks returning static mock objects |
| **Capability Engine** | `packages/capability-engine/index.mjs` | Tool discovery, schema validation, permission checks, audit logging | No direct un-audited OS shell execution from models |
| **Computer Operator** | `packages/capability-engine/computer-operator.mjs` | Layered automation through UIA, browser/CDP, and foreground desktop input | No fixed coordinate guessing without element grounding |
| **Task Engine** | `packages/agent-runtime/index.mjs` | Durable task queue, state transitions (`RUNNING`, `WAITING`, `COMPLETED`) | No volatile in-memory queues that vanish on restart |
| **Memory Engine** | `packages/memory/index.mjs` | Persistent SQLite semantic store, tag/keyword recall | No non-persistent memory dictionaries |
| **Automation Engine** | `packages/automation/index.mjs` | Durable cron jobs, interval timers, sweep-on-boot | No untracked `setInterval` timers for persistent tasks |
