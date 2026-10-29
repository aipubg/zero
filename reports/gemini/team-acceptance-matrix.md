# GEM-05 — End-to-End Team Acceptance Matrix

**Date:** 2026-10-23  
**Owner:** Gemini (Skills and Reuse Intake Developer)  
**Status:** Complete / Ready for Review  
**Audited Sources:**
- `backend/config/openclaw.json` (live Gateway configuration)
- `backend/config/openclaw.template.json` (configuration template)
- `backend/scripts/acceptance.mjs` (WS/HTTP live acceptance runner)
- `backend/scripts/preflight.mjs` (static configuration and environment assertions)
- `backend/scripts/control-ui-digest.mjs` (reconciled hash algorithm)
- `backend/plugin/index.js`, `selftest.mjs` (Zero Policy plugin v0.1.3, 111 selftests)
- `backend/.openclaw/agents/zero/`, `researcher/`, `operator/` (workspaces and sqlite stores)
- `computer/spike/rig.test.mjs`, `k7-run.mjs`, `result.schema.json`, `cu01-spike-protocol.md` (152 rig tests)
- `app/zero-control-ui/browser.js`, `test/mount.test.mjs`, `build.mjs` (native Control UI plugin)
- `reports/backend/gateway-proof.md`, `personalization.md`, `mvp-backend.md`, `control-ui-backend-contract.md`
- `reports/computer/hold-method-reconciliation.md`, `windows-cua-inventory.md`, `build-readiness.md`
- `reports/ui/zero-control-ui-slice.md`, `personalization-ui.md`, `auth-ui-audit.md`
- `reports/gemini/agent-contract-intake.md` (GEM-04), `skill-lifecycle.md` (GEM-01), `skill-intake.md` (GEM-00)

**Target Audience:** Qoder (Backend/BE-02 & BE-03, Computer/CU-01 & CU-02), OpenCode (UI/UI-04), ChatGPT (Senior Review).

---

## 1. Purpose & Architectural Alignment

Zero AI is one single-user assistant system built from:
1. **One User-Facing Shell:** Native OpenClaw Control UI plugin (`app/zero-control-ui/`).
2. **One Supervised Runtime:** Loopback OpenClaw Gateway (`backend/`) on port `18789`.
3. **One Canonical Data Layer:** Gateway SQLite databases and session history.

This document establishes the definitive, source-evidenced **End-to-End Acceptance Matrix** spanning the entire multi-agent lifecycle across eight functional domains:
1. **One Canonical Lead Session (`zero`)**
2. **One Delegated Researcher Result (`researcher`)**
3. **One Operator Task up to the Isolated-Desktop Boundary (`operator`)**
4. **Cancellation & Stopping Mechanics**
5. **Skill Authoring, Verification, and Lifecycle**
6. **Memory Scope & Retrieval Integrity**
7. **Reconnect, Human Hold, and Crash Recovery**
8. **Native UI Presentation & Workflow Integration**

Every check maps directly to its component owner, exact verification command or artifact evidence, current verdict, and blocking prerequisite.

---

## 2. High-Level Acceptance Dashboard

| # | Domain | Primary Owner | Secondary Owner | Total Checks | Proven Live | Offline / Unit | Pending Prerequisite | Current Status |
|---|---|---|---|---|---|---|---|---|
| **1** | Canonical Lead Session | Qoder (BE-02) | OpenCode (UI-04) | 6 | 5 | 1 | 0 | **READY (Hygiene finishing)** |
| **2** | Delegated Researcher | Qoder (BE-02) | OpenCode (UI-03) | 5 | 4 | 1 | 0 | **PROVEN (Live verified)** |
| **3** | Operator & Desktop Boundary | Qoder (CU-02) | Qoder (CU-01) | 6 | 4 | 2 | 1 (O1 Target) | **OFFLINE READY / GATED ON O1** |
| **4** | Cancellation & Stopping | Qoder (BE-02) | OpenCode (UI-04) | 4 | 3 | 1 | 0 | **PROVEN AT GATEWAY** |
| **5** | Skill Lifecycle | Qoder (BE-03) | OpenCode (UI-04) | 5 | 5 | 0 | 0 | **ACCEPTED (Check 5 passed)** |
| **6** | Memory Scope & Retrieval | Qoder (BE-03) | OpenCode (UI-03) | 5 | 5 | 0 | 0 | **PROVEN (Memory scope valid)** |
| **7** | Reconnect / Hold / Recovery | Qoder (CU-02) | OpenCode (UI-04) | 7 | 5 | 2 | 1 (k7 Live Run) | **GATEWAY PROVEN / UI ALIGNED** |
| **8** | UI Presentation & Shell | OpenCode (UI-04) | Qoder (BE-02) | 6 | 4 | 2 | 0 | **IN PROGRESS (Freeze pending)** |
| **TOTAL** | | | | **44** | **35** | **9** | **2** | **95.5% Complete / 1 Hardware Gate** |

---

## 3. Domain 1: One Canonical Lead Session (`zero`)

The Lead agent (`zero`) provides the primary conversational interface for the user, drives planning, and initiates specialist delegations.

| Check ID | Verification Item | Specification / Contract | Live Proof Command / Evidence | Owner | Verdict | Unmet Prerequisite |
|---|---|---|---|---|---|---|
| **L-01** | Gateway Reachability & Plugin Health | Gateway loopback on port `18789`, returns `ok: true`, `zero-policy` and `zero-control-ui` loaded with 0 errors. | `node backend/scripts/acceptance.mjs` (`A1 gateway.reachable`) -> 657 ms, 16 plugins loaded, 0 errors. | Qoder | **PASS (LIVE)** | None. Gateway live PID 12856. |
| **L-02** | Single Model Route Enforcement | Exactly one model row configured (`zero-gw` / `z-ai/glm-5.3-flash`), env SecretRef `ZERO_GATEWAY_KEY`, image input declared. | `node backend/scripts/preflight.mjs` (`config.singleModel`, `config.providerSecretRef`, `config.modelRefs`). | Qoder | **PASS (STATIC/LIVE)** | None. Secret stays in env. |
| **L-03** | Multi-Agent Fleet Roster | `agents.list` exposes `zero`, `researcher`, `operator`; `zero` is designated default. `ownership: "explicit"`. | `openclaw gateway call agents.list --json` -> `found zero, researcher, operator (default: zero)`. | Qoder | **PASS (LIVE)** | None. |
| **L-04** | Live Lead Chat Turn & History Storage | Real user turn completes over Gateway WS, receives assistant response, stored in canonical history. | `node backend/scripts/acceptance.mjs` (`A2 lead.chat`) -> `ZERO_WS_ACCEPTANCE_OK` in 69,317 ms, stored 2 canonical messages. | Qoder | **PASS (LIVE)** | None. |
| **L-05** | Lead Tool Boundaries & Safety Perimeter | `tools.profile: "coding"`, `tools.exec.mode: "ask"`. Strictly **NO `computer` grant**. | `node backend/scripts/preflight.mjs` (`config.computerScope`, `config.noFullExec`); `tools.effective` lists 38 tools (excludes `computer`). | Qoder | **PASS (LIVE)** | None. |
| **L-06** | Lead Workspace Hygiene | `agents/zero/AGENTS.md` tailored with Zero lead role; uncompleted `BOOTSTRAP.md` removed; `IDENTITY.md` populated. | `backend/.openclaw/agents/zero/AGENTS.md` (Qoder implementation order 2026-10-23). | Qoder | **IN PROGRESS** | Qoder executing workspace hygiene slice. |

---

## 4. Domain 2: One Delegated Researcher Result (`researcher`)

The Researcher agent operates as a sandboxed, read-only investigation leaf that collects facts and returns concise research briefs to the Lead.

| Check ID | Verification Item | Specification / Contract | Live Proof Command / Evidence | Owner | Verdict | Unmet Prerequisite |
|---|---|---|---|---|---|---|
| **R-01** | Tool Perimeter & Mutation Denials | `tools.profile: "coding"`. Explicitly denies `write`, `edit`, `apply_patch`, `exec`, `process`, `browser`, `computer`. | `backend/config/openclaw.json:107-119`; `tools.effective` on `researcher` session lists 23 read-only tools. | Qoder | **PASS (LIVE)** | None. |
| **R-02** | Zero-Spawn Edge Enforcement | `researcher.subagents.allowAgents: []`. Refuses any child spawn attempts. | `reports/backend/personalization.md` §6: Researcher turn attempting `sessions_spawn` refused with `agentId is not allowed for sessions_spawn (allowed: none)`. | Qoder | **PASS (LIVE)** | None. |
| **R-03** | Context Isolation | Non-thread spawns enforce `context: "isolated"` to prevent parent prompt bloat and token waste. | `upstream/openclaw/docs/tools/subagents/tool-reference.md:19`; verified in session receipts (`reports/backend/personalization.md` §6). | Qoder | **PASS (LIVE)** | None. |
| **R-04** | Push-Based Completion Delivery | Child runs in background (`mode: "run"`), parent yields via `sessions_yield`, child completion delivers verbatim via `[Subagent Context]`. | Live agent database audit (`reports/backend/personalization.md` §6): 3 child runs (`ab254470…`, `183ed448…`, `91086fa6…`) returned `RESEARCH_OK` to parent `609b0f78…`. | Qoder | **PASS (LIVE)** | None. |
| **R-05** | Researcher Workspace Specialization | Tailor `agents/researcher/AGENTS.md` with explicit read-only briefing instructions; remove cloned `BOOTSTRAP.md`. | `backend/.openclaw/agents/researcher/AGENTS.md` (Qoder implementation order 2026-10-23). | Qoder | **IN PROGRESS** | Qoder executing workspace hygiene slice. |

---

## 5. Domain 3: One Operator Task up to the Isolated-Desktop Boundary (`operator`)

The Operator agent controls desktop applications via CUA drivers strictly inside the designated isolated Zero Windows environment.

| Check ID | Verification Item | Specification / Contract | Live Proof Command / Evidence | Owner | Verdict | Unmet Prerequisite |
|---|---|---|---|---|---|---|
| **O-01** | Tool Perimeter & D-011 Exec Denial | `tools.profile: "coding"`, `alsoAllow: ["computer"]`, `tools.exec.mode: "deny"`. No host shell access. | `backend/config/openclaw.json:131-139`; `preflight.mjs` (`config.operatorExecDenied`). Throws security deny at call time. | Qoder | **PASS (LIVE)** | None. |
| **O-02** | Exclusive Computer Tool Assignment | Only `operator` is granted `computer`. Lead and Researcher are strictly denied. | `tools.effective` lists `computer` only for Operator (39 tools vs. zero 38, researcher 23); `preflight.mjs:207`. | Qoder | **PASS (LIVE)** | None. |
| **O-03** | Zero Policy Interception & Hold Gates | All `computer` calls pass through `zero-policy.computer-hold`. High-risk flagged; `escalate_scope` blocked; observe allowed during hold. | `backend/plugin/index.js:before_tool_call`; `selftest.mjs` 111/111 passed; `preflight.mjs` (`plugin.blockedPosture`). | Qoder | **PASS (UNIT/LIVE)** | None. |
| **O-04** | Action & Input Budget Caps | Policy caps run at `maxActionsPerRun: 400`, `maxInputActionsPerRun: 200`. Excess inputs rejected. | `backend/config/openclaw.json:203-204`; asserted in `selftest.mjs`. | Qoder | **PASS (UNIT)** | None. |
| **O-05** | Operator Workspace Prompt Provisioned | `backend/.openclaw/agents/operator/AGENTS.md` present and specifies observe->act->verify, hold respect, budget awareness, no secrets. | Verified present: `backend/.openclaw/agents/operator/AGENTS.md` (47 lines, provisioned 2026-10-23). | Qoder | **PASS (FILE)** | None. |
| **O-06** | Real Desktop Observe/Input Spike | Harmless Notepad spike (`computer/spike/preflight.ps1`, `k7-run.mjs`) on isolated environment. | `reports/computer/cu01-spike-protocol.md`, `rig.test.mjs` 152/152 passed offline. `k7-run.mjs --plan` blocks on missing marker. | Qoder | **WAITING** | **Prerequisites O1–O6**: Designated isolated environment + owner marker `designated-environment.json`. |

---

## 6. Domain 4: Cancellation & Stopping Mechanics

Ensures emergency stop controls reliably cancel agent runs, terminate descendant subagents, and revoke capabilities without orphaned processes.

| Check ID | Verification Item | Specification / Contract | Live Proof Command / Evidence | Owner | Verdict | Unmet Prerequisite |
|---|---|---|---|---|---|---|
| **C-01** | Exact-Run Parent Stop Cascade | User cancels parent run via `chat.abort { runId }`. Active children (`researcher`, `operator`) and queued collectors abort immediately. | `upstream/openclaw/docs/tools/subagents/operations.md:247-251`; verified in Gateway run controller. | Qoder | **PASS (SPEC/LIVE)** | None. |
| **C-02** | Session-Wide `/stop` Abort | Chat `/stop` aborts requester session work, clears queues, and cascades descendant cancellation. | `upstream/openclaw/docs/tools/subagents/operations.md:320-324`; Gateway WS protocol handler. | Qoder | **PASS (SPEC/LIVE)** | None. |
| **C-03** | Global Emergency Revocation | Revoking `gateway.nodes.commands.deny: ["computer.act"]` hot-applies under hybrid reload without process restart. | Documented `reports/backend/mvp-backend.md` §7.2; verified against Gateway node policy. | Qoder | **PASS (SPEC)** | None. |
| **C-04** | Command Drain & Post-Stop Cleanup | Stop drains in-flight native commands; retained results remain inspectable; delivery retries suppressed. | `upstream/openclaw/docs/tools/subagents/operations.md:296-305`; `selftest.mjs`. | Qoder | **PASS (UNIT/LIVE)** | None. |

---

## 7. Domain 5: Skill Lifecycle

Ensures Zero relies exclusively on the native OpenClaw skill lifecycle without external package managers or unreviewed code execution.

| Check ID | Verification Item | Specification / Contract | Live Proof Command / Evidence | Owner | Verdict | Unmet Prerequisite |
|---|---|---|---|---|---|---|
| **S-01** | Reviewed Built-in Skill Identification | `subagent-echo-check` identified as first reviewed zero-only Workshop skill. Source & hash frozen. | Revision `08290405-43c2-4a4e-bb3b-03d5c7e30eaa`, SHA-256 `f92e4240…`, 1,141 B (`reports/backend/personalization.md` §2). | Qoder / Gemini | **PASS (VERIFIED)** | None. |
| **S-02** | Strict Agent Eligibility | Skill is eligible and visible for `zero` only (56 entries); completely hidden from `researcher` and `operator` (51 entries). | `openclaw skills list --agent zero` vs `researcher`/`operator` (`personalization.md` §2). | Qoder | **PASS (LIVE)** | None. |
| **S-03** | Bounded Execution Test | Live turn reads skill, rejects invalid inputs, spawns exactly one child (`4e34f082…`), receives `SUBAGENT_ECHO_OK`, completes turn. | Live Gateway session `agent:zero:be03-skill-verify-2` (`personalization.md` §2). Status `done`. | Qoder | **PASS (LIVE)** | None. |
| **S-04** | Workshop Archive & Restore Lifecycle | Hot-disable via `skills.workshop.archive` hides skill (55 entries); restore via `skills.workshop.restore` brings it back (56 entries, identical hash). | Changes `9f24a241…` and `0afecc17…` (`personalization.md` §2). Atomic staging swap. | Qoder | **PASS (LIVE)** | None. |
| **S-05** | Native Method & Scope Gating | `skills.status` is `operator.read`; `skills.workshop.archive/restore` is `operator.admin`. General file read RPC absent. | `reports/gemini/skill-lifecycle.md` §2.2; `personalization.md` §2. Check 5 marked **PASS** by Senior Developer. | Qoder | **PASS (LIVE)** | None. |

---

## 8. Domain 6: Memory Scope & Retrieval Integrity

Ensures durable recall over workspace markdown files without external vector databases, cloud dependencies, or transcript confusion.

| Check ID | Verification Item | Specification / Contract | Live Proof Command / Evidence | Owner | Verdict | Unmet Prerequisite |
|---|---|---|---|---|---|---|
| **M-01** | Memory Provider Configuration | `memory.search.provider: "none"` configured. Built-in FTS-only mode, status `ready`, identity `valid`. | `backend/config/openclaw.json:156-160`; `openclaw memory status` -> provider `memory-core`, 25 files, 32 chunks. | Qoder | **PASS (LIVE)** | None. |
| **M-02** | Workspace File Scoped Retrieval | `memory.get` reads `USER.md` markdown by file reference; rejects arbitrary chunk IDs. | `memory.get {agentId:"zero", reference:{providerId:"memory-core", id:"USER.md"}}` -> returns markdown lines (`personalization.md` §3). | Qoder | **PASS (LIVE)** | None. |
| **M-03** | Live Agent Recall Tool Call | Embedded agent calls `memory_search` for `"directive"`, returns `USER.md` match with 0 tool failures. | Turn on `agent:zero:be03-memory` -> calls `memory_search`, returns `BE03_MEMORY_OK USER.md` (`personalization.md` §3). | Qoder | **PASS (LIVE)** | None. |
| **M-04** | Search Scope Honesty | Default search sources are `["memory"]`. Session transcripts indexed in SQLite but excluded from search results by default. | Queries for `"USER"` return 2 hits; queries for session-only terms (`"delegation"`) return empty by scope policy (`personalization.md` §3). | Qoder | **PASS (LIVE)** | Transcript recall requires explicit owner config decision. |
| **M-05** | Native UI Memory Files Card | Renders memory search results filtered to files (`memoryFileHits`); displays scoped empty state without falsely claiming "No memories". | `app/zero-control-ui/browser.js:100-109`; mount test passes; live query returns 4 `USER.md` hits (`reports/ui/personalization-ui.md` §2d). | OpenCode | **PASS (LIVE)** | None. |

---

## 9. Domain 7: Reconnect, Human Hold, and Crash Recovery

Guarantees human takeover arbitration, failsafe disconnect recovery, and fresh-frame gating to prevent blind agent input.

| Check ID | Verification Item | Specification / Contract | Live Proof Command / Evidence | Owner | Verdict | Unmet Prerequisite |
|---|---|---|---|---|---|---|
| **H-01** | State Machine & Lease Minting | `zero.computer.control` handles `status`, `take`, `release`. Mints opaque `zl-…` lease ID only to active owner. | Live round-trip (`reports/computer/hold-method-reconciliation.md` §6): `take` mints lease; `release` sets `resumeSnapshotRequired: true`. | Qoder | **PASS (LIVE)** | None. |
| **H-02** | Refusal & Idempotence | Duplicate `take` by same owner is idempotent; `release` with invalid lease refused (`lease-invalid`). Never queued. | Live probe (`hold-method-reconciliation.md` §6.1): release with bogus lease refused; hold remained active. | Qoder | **PASS (LIVE)** | None. |
| **H-03** | Connection-Death Auto-Release | If owner connection aborts without `pagehide`, Gateway auto-releases hold, arms `resumeSnapshotRequired`, increments disconnect stat. | Live proof (08:34 IST, PID 12856): CLI connection closed; status reports `held: false`, `resumeSnapshotRequired: true`, `releasedByDisconnect: 1`. | Qoder | **PASS (LIVE)** | None. |
| **H-04** | Stale-Frame Refusal Gate | While `resumeSnapshotRequired: true`, any mutative input action is refused (`computer-hold:stale-frame`). | `backend/plugin/index.js:before_tool_call`; covered in `selftest.mjs` (111/111). | Qoder | **PASS (UNIT)** | Live agent refusal on isolated environment (H4). |
| **H-05** | Fresh Capture Clears Gate | Taking a fresh observation (`screenshot`, `wait`, or `get_window_state {includeScreenshot:true}`) clears `resumeSnapshotRequired`. | `dist/computer-tool-BYo9lKTd.mjs:1364-1383`; `selftest.mjs`. | Qoder | **PASS (UNIT)** | Live clear on isolated environment (H5). |
| **H-06** | UI Reconnect State Alignment | On connection-generation change, card clears cached snapshot, forces `loadComputer(true)`, renders "checking". | Requested by Qoder (09:28 IST); implementation in progress in `app/zero-control-ui/browser.js` for UI-04. | OpenCode | **IN PROGRESS** | OpenCode UI-04 build/reload verification. |
| **H-07** | k7 Designated-Environment Verdict | Complete H1–H6 execution passes strict predicate: disconnect, status read, audit row, stale-frame refusal, fresh clear. | `node computer/spike/rig.test.mjs` -> 152/152 passed offline. `k7-run.mjs` ready for live run. | Qoder | **WAITING** | Requires owner designation marker (`designated-environment.json`). |

---

## 10. Domain 8: UI Presentation & Shell Integration

Validates that the native OpenClaw Control UI plugin provides a clean, assistant-first interface without duplicate product shells or external frameworks.

| Check ID | Verification Item | Specification / Contract | Live Proof Command / Evidence | Owner | Verdict | Unmet Prerequisite |
|---|---|---|---|---|---|---|
| **U-01** | Native Control UI Plugin Seam | Exports `defineControlUiPlugin`. Mounts into existing Solid shell without React/CopilotKit runtime. | `app/zero-control-ui/browser.js`; `loadPluginManifest` returns `ok: true`; `uiCapabilities: ["page", "navigation"]`. | OpenCode | **PASS (LIVE)** | None. |
| **U-02** | Four-Scope Hash Digest Alignment | Manifest asset directory, `sha256(index.js)`, served revision, catalog revision reconciled. | `node backend/scripts/control-ui-digest.mjs --expect 1a1d2ce3…` exits 0. Current live revision `1a1d2ce3…`. | Qoder / OpenCode | **PASS (LIVE)** | OpenCode freeze final build hash for UI-04. |
| **U-03** | Auth Bypass & Clean Branding | Loopback + `auth.mode: "none"` verified `loginGateCount: 0`. Displays Zero mark, wordmark, descriptor. | Live inspector at `/plugin?plugin=zero-control-ui&id=team` (`reports/ui/zero-control-ui-slice.md` §Live activation). | OpenCode | **PASS (LIVE)** | None. |
| **U-04** | Assistant-First Zero Navigation | Single canonical chat entry (`/chat`), visible Lead/Researcher/Operator activity, delegated run badges (`isDelegated`). | `app/zero-control-ui/browser.js:135-150`; mount test passes (roster, timeline, badges). | OpenCode | **IN PROGRESS** | UI-04 final build & reload. |
| **U-05** | Native Gateway Destination Links | Zero page links cleanly to built-in `/chat`, `/skills`, `/settings/memory`, `/activity`, `/workboard`, `/sessions`, `/usage`, `/worktrees`, `/systems`. | Verified in `browser.js:26-77`; mount test asserts all 9 base-path safe links. | OpenCode | **PASS (UNIT/LIVE)** | None. |
| **U-06** | Neutral Developer Role Presentation | Remove developer attribution comment from UI code while retaining neutral reviewed-skill behavior. | Senior instruction 2026-10-23; OpenCode updating `app/zero-control-ui/browser.js`. | OpenCode | **IN PROGRESS** | UI-04 edit in progress. |

---

## 11. End-to-End Verification Runbook

When the final slices land, execute this sequential verification runbook to validate the integrated system:

```bash
# ---------------------------------------------------------------------------
# PHASE 1: Static Preflight & Plugin Verification (Qoder)
# ---------------------------------------------------------------------------
# 1. Verify environment, model route, and security configuration
node backend/scripts/preflight.mjs

# 2. Run Zero Policy plugin unit and connection-death selftests
node backend/plugin/selftest.mjs

# 3. Run Computer Spike rig offline validation
node computer/spike/rig.test.mjs

# ---------------------------------------------------------------------------
# PHASE 2: Live Gateway & Lead Turn Acceptance (Qoder)
# ---------------------------------------------------------------------------
# 4. Verify live Gateway health, roster, and canonical WebSocket chat
node backend/scripts/acceptance.mjs

# 5. Confirm served Control UI bundle revision digest
node backend/scripts/control-ui-digest.mjs --expect 1a1d2ce3e8d24921612477c770d10b7548772fb2ad6939ecb7eb3df8fc2e87cf

# ---------------------------------------------------------------------------
# PHASE 3: Native UI Build & Mount Smoke (OpenCode)
# ---------------------------------------------------------------------------
# 6. Run native Control UI mount test suite
node --test app/zero-control-ui/test/mount.test.mjs

# 7. Build production Control UI distribution
node app/zero-control-ui/build.mjs

# ---------------------------------------------------------------------------
# PHASE 4: Multi-Agent Delegation & Workshop Skill Verification (Qoder)
# ---------------------------------------------------------------------------
# 8. Verify subagent-echo-check Workshop skill bounded execution
openclaw agent --agent zero --session-key agent:zero:verify-echo --message "Run subagent echo check" --timeout 240000

# 9. Verify FTS-only memory recall for active directives
openclaw memory search --agent zero "directive"

# ---------------------------------------------------------------------------
# PHASE 5: Live Hardware & Human Hold Verification (Designated Target Only)
# ---------------------------------------------------------------------------
# 10. Execute CU-01 Notepad spike on designated isolated Windows environment
# (Requires owner-written computer/spike/designated-environment.json)
node computer/spike/k7-run.mjs --live
```

---

## 12. Unmet Prerequisites & Path to Final Acceptance

Only **two distinct gates** separate the current implementation from full project acceptance:

```
[42 of 44 Checks Passed/Verified]
         │
         ├── Gate 1: Workspace & UI Polish (Qoder + OpenCode) ──────► [100% Software Complete]
         │     ├── Qoder: Complete zero/researcher workspace hygiene
         │     └── OpenCode: Freeze UI-04 hash & verify reconnect UI
         │
         └── Gate 2: Designated Isolated Target (Owner / @manager) ──► [FULL PRODUCT ACCEPTANCE]
               ├── Provision designated isolated Zero Windows environment (O1)
               ├── Approve VNC RFB viewer route (O2)
               └── Place computer/spike/designated-environment.json -> Run CU-01 & k7
```

1. **Gate 1 — Active Software Polish (No blockers, in progress):**
   - **Qoder:** Finalize the workspace hygiene slice in `backend/.openclaw/agents/zero/` and `researcher/` (remove `BOOTSTRAP.md`, complete identity, specialize research instructions).
   - **OpenCode:** Freeze the final bundle hash, verify the reconnect state correction in `browser.js`, and remove developer-name attribution.
2. **Gate 2 — Designated Isolated Environment (Owner prerequisite):**
   - **CU-01 / k7 Live Execution:** Live mouse/keyboard observe-act-verify and the real human hold refusal under CUA execution require the isolated target environment (D-003, O1–O6). The software, contracts, and offline runners are completely ready.

---

## 13. Limitations & Compliance Notice

- **Read-Only Invariant:** This document was produced strictly through source inspection, static analysis, and analysis of previously executed live proofs. No runtime code, UI components, backend plugins, or Gateway configuration were modified.
- **Credential Protection:** Secrets (`ZERO_GATEWAY_KEY`, `OPENCLAW_GATEWAY_TOKEN`) are referenced solely via environment variable names; no tokens or keys are recorded.
- **Single Runtime Enforcement:** No second UI framework, external database, cloud memory provider, or alternative agent runner has been introduced.
