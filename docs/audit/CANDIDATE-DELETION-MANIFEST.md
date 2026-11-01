# Zero AI — Candidate Deletion & Transformation Manifest (Phase 0)

**Document Reference:** `docs/audit/CANDIDATE-DELETION-MANIFEST.md`  
**Classification:** Phase 0 Deliverable (Task 0.3 / Task 0.15)  
**Strict Policy:** Section 05 — No code deletion, repository mutation, runtime restart, or deployment is authorized merely by producing this roadmap. Code deletion only occurs under Class D rules after verified independent replacement and test passage.

---

## 1. Five-Class Transformation Matrix

Every subsystem in the repository is classified into one of five transformation categories:

### Class A: Keep and Strengthen
Implementations that are structurally sound, well-tested, and serve as core foundations for ZERO AI:

| Subsystem / Path | Rationale & Responsibility | Strengthening Action |
|---|---|---|
| `packages/model-fabric/` | Core multi-model orchestration, streaming, token counting | Add dynamic context budget management and per-agent routing |
| `packages/capability-engine/` | Universal action router and tool schemas | Expand to layered execution (API -> UIA -> DOM -> Hardware) |
| `packages/gateway-protocol/` | WebSocket Protocol 4 wire frame definitions | Add typed multi-agent communication frame definitions |
| `packages/sessions/` | SQLite session persistence and involvement levels | Formalize session-to-workspace grouping |
| `packages/tasks/` | Durable task state machine (RUNNING, WAITING, etc.) | Add dependency graphs and child-task cancellation |
| `packages/memory/` | Persistent semantic memory store | Expand to 8-layer unified memory architecture |
| `packages/automation/` | Durable cron scheduler and sweep runner | Add event-driven subscriptions |
| `services/host/native-gateway.mjs` | Authoritative Zero Host control plane on port 18789 | Keep as canonical entry point; strengthen plugin endpoints |
| `services/host/security.mjs` | DNS rebinding, loopback CORS, HttpOnly session cookie | Core security boundary; zero regressions allowed |
| `app/zero-control-ui/` | First-party UI source (Lit-based SPA) | Maintain as functional workbench during Phase 1–15 |
| `app/zero-control-ui/src/computer/operator.js` | Physical hardware automation (User32 / Playwright) | Add UIA element hierarchy caching and OCR grounding |

---

### Class B: Refactor or Rebuild
Modules containing useful functionality that cannot satisfy target architecture contracts in their current form:

| Subsystem / Path | Current Limitation | Target Transformation |
|---|---|---|
| `backend/gateway/server.mjs` | Monolithic legacy gateway logic intermingled with helper functions | Modularize into `services/model-gateway/` and `services/agent-orchestrator/` |
| `backend/gateway/server/local-gguf-middleware.ts` | Local GGUF streaming works but lacks CPU thread/RAM budget constraints | Refactor into `packages/model-fabric/local-gguf.mjs` with bounded memory |
| `services/host/native-gateway.mjs` (plugin/skill routes) | Basic registration endpoints without full lifecycle hot-reload | Rebuild into `services/plugin-manager/` and `services/skill-manager/` |
| Screen Observation Prototype | Periodic static screenshot captures | Build Phase 8 Screenpipe-class engine with 5-minute rolling RAM retention & change detection |

---

### Class C: Compatibility Adapters
Interfaces preserved to prevent breaking existing tools, skills, or UI workflows during migration:

| Subsystem / Path | Consumers Protected | Phase-Out Condition |
|---|---|---|
| `control-ui-config.json` | Control UI bootstrap client | Retain until UI view-model contracts decouple from config endpoint |
| Legacy RPC contract adapters (`openclaw.*` / `config.get`) | Settings pages and external test runners | Retain behind `packages/gateway-protocol/compat.mjs` |
| Skill markdown format (`SKILL.md`) | Existing 11 built-in and community skills | Maintain 100% backward compatibility indefinitely |

---

### Class D: Candidate Retirement After Verified Replacement
Code scheduled for controlled deletion **ONLY** after replacement modules exist and pass all E2E acceptance tests:

| Subsystem / Path | Reason for Future Retirement | Prerequisite for Removal |
|---|---|---|
| `backend/server/zero-host.mjs` fallback logic | Historical wrapper fallback to openclaw dist | Fully superseded by `ZeroNativeHost` default execution |
| Unused test harnesses asserting mock states | Obsolete false-positive tests | Replaced by `test/e2e-matrix.test.mjs` (T01–T25) |
| Duplicate gateway routes in `backend/gateway/server.mjs` | Dual route handling with `native-gateway.mjs` | Route convergence into single Zero Host router |
| `backend/node_modules/openclaw` production dependency | Legacy runtime package | Verified 100% independence in Phase 1 / T02 isolation |

---

### Class E: Never Delete Without Explicit Data Migration
State, user history, and assets that must never be deleted:

| Resource Path | Contents | Policy |
|---|---|---|
| `zero-system/state/state/openclaw.sqlite` | Sessions, tasks, cron jobs, preferences, audit logs | Automated backup prior to every migration; strict zero-data-loss rule |
| `zero-system/config/zero.json` | System configurations & model endpoints | Atomic write with deep merge; never overwrite blindly |
| Historical Git tags (`v2026.11.01-release`) | Production release baseline | Permanent immutability; never delete or move |
| User artifacts in `brain/` | Reports, generated files, diagrams | Preserved across all executions |
