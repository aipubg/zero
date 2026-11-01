# Zero AI — Canonical System Architecture & Engineering Blueprint

**Document Reference:** `docs/engineering/CANONICAL-ARCHITECTURE.md`  
**Classification:** Phase 0 Root Audit Deliverable  
**Core Invariant:** ONE Authoritative Control Plane, ONE Primary Assistant, Multi-Model, Multi-Agent, Extensible Execution Engine.

---

## 1. Logical Architecture Diagram

```
                             ZERO AI
                        PRIMARY ASSISTANT
                                │
                       CONVERSATIONAL CORE
                  (Zero Session / Context Head)
                                │
                      TASK PLANNER / ROUTER
                                │
           ┌────────────────────┼─────────────────────┐
           │                    │                     │
      MODEL FABRIC         MULTI-AGENT            8-LAYER
    (Unified Providers,    ORCHESTRATOR           MEMORY
     Local GGUF, Budgets) (Specialist Agents, (Context, Episodic,
           │               Workspaces)         Semantic, Screen)
           │                    │                     │
           └────────────────────┼─────────────────────┘
                                │
                        CAPABILITY ENGINE
               (Universal Tool & Action Registry)
                                │
         ┌───────────────┬──────┴───────┬──────────────┬──────────────┐
         │               │              │              │              │
       SKILLS         PLUGINS        COMPUTER         WEB           FILES
      (Native &      (Native &       (Layered     (Playwright   (Repository &
     Community)     Extensions)     Automation)     Browser)      Artifacts)
         │               │              │              │              │
         └───────────────┴──────┬───────┴──────────────┴──────────────┘
                                │
                        EXECUTION SERVICES
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
      LOCAL WINDOWS HOST                    CLOUD WORKERS /
    (ZeroNativeHost: 18789)                 REMOTE DEVICES
              │                                   │
              └─────────────────┬─────────────────┘
                                │
                       OBSERVATION / EVENTS
                      (Screenpipe Vision, OCR,
                        UIAutomation Events)
                                │
                      VERIFICATION & FEEDBACK
                     (Executed -> Verified ->
                            Completed)
                                │
                     STATE & MEMORY PERSISTENCE
                       (SQLite WAL Database)
                                │
                        PRIMARY ASSISTANT
                    [ Chat Now / Voice Later ]
```

---

## 2. The Core Execution Lifecycle

Every task—from opening a browser to multi-step software development—flows through this unified, immutable lifecycle:

```
1. USER INTENT
   └─ Natural language request received via Chat UI (now) or Voice Stream (future).
2. CONTEXT RETRIEVAL
   └─ Query active session, recent conversation, and 8-layer memory (episodic/semantic/screen).
3. PLAN DECOMPOSITION
   └─ Single action vs multi-step task graph. Determine if specialist agents are required.
4. RESOURCE ALLOCATION
   └─ Select primary model, specialist agents, assigned tools, skills, and execution route.
5. EXECUTION DISPATCH
   └─ Capability Engine routes to API -> UIAutomation -> Browser DOM -> Physical Hardware Input.
6. OBSERVATION
   └─ Inspect output, window state, DOM elements, or screen change events.
7. ACTION VERIFICATION
   └─ Distinguish EXECUTED from VERIFIED and COMPLETED. Never assume success.
8. STATE RECONCILIATION
   └─ Update durable task step in SQLite. Record checkpoints and artifacts.
9. MEMORY CONSOLIDATION
   └─ Persist significant observations and task outcomes to semantic memory.
10. USER REPORT
   └─ Return grounded completion text with real-time UI execution cards (media/progress).
```

---

## 3. Subsystem Boundaries & Single Source of Truth

| Subsystem | Canonical Module Path | Authority & Responsibilities | Prohibited Competing Logic |
|---|---|---|---|
| **Host Control Plane** | `services/host/native-gateway.mjs` | Single listener on `18789`; HTTP routes, WebSocket upgrades, lifecycle | No competing gateways on same port; no openclaw daemon wrapper |
| **Security Boundary** | `services/host/security.mjs` | Loopback CORS, DNS rebinding `Host` check, `zero_session` HttpOnly cookie | No wildcard CORS (`*`); no public token exposure in config |
| **Model Fabric** | `packages/model-fabric/index.mjs` | Multi-model resolution, single-pass streaming, token accounting, retries | No double-inference; no synthetic fake responses |
| **Agent Runtime** | `packages/agent-runtime/index.mjs` | Agent state, parent-child delegation, dependency graphs, turn execution | No dummy child tasks returning static mock objects |
| **Capability Engine** | `packages/capability-engine/index.mjs` | Tool discovery, schema validation, permission checks, audit logging | No direct un-audited OS shell execution from models |
| **Computer Operator** | `app/zero-control-ui/src/computer/operator.js` | Layered automation: UIA tree -> Playwright DOM -> User32 physical input | No fixed coordinate guessing without element grounding |
| **Task Engine** | `packages/tasks/index.mjs` | Durable task queue, state transitions (`RUNNING`, `WAITING`, `COMPLETED`) | No volatile in-memory queues that vanish on restart |
| **Memory Engine** | `packages/memory/index.mjs` | Persistent SQLite semantic store, tag/keyword recall | No non-persistent memory dictionaries |
| **Automation Engine** | `packages/automation/index.mjs` | Durable cron jobs, interval timers, sweep-on-boot | No untracked `setInterval` timers for persistent tasks |
