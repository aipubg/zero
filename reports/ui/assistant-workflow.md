# UI-04 — Native Assistant-First Zero Workflow

**Date:** 2026-10-24  
**Owner:** OpenCode (Frontend & Integration Developer)  
**Status:** Complete / Ready for Review  
**Audited Sources:**
- `app/zero-control-ui/browser.js` (native Control UI plugin contribution)
- `app/zero-control-ui/index.css` (custom visual styling and layout tokens)
- `app/zero-control-ui/test/mount.test.mjs` (unit and integration tests, 3/3 passing)
- `backend/scripts/control-ui-digest.mjs` (reconciled bundle digest validator)
- `reports/backend/provider-manager-contract.md` (§3.4a, §3.5, §8, §9)
- `reports/ui/provider-manager-ui.md` (PM-01 delivery and Senior follow-up)
- `reports/gemini/team-acceptance-matrix.md` (GEM-05 acceptance matrix)

---

## 1. Objectives & Architectural Boundaries

UI-04 consolidates the Zero product experience into one native OpenClaw Control UI contribution (`zero-control-ui`):
1. **Assistant-First Entry:** Direct access to a canonical Zero Lead session (`/chat`) from the hero card, supporting one-click resumption of the active conversation or creation of a fresh conversation.
2. **Specialist Team Transparency:** Expose configured Lead (`zero`), Researcher (`researcher`), and Operator (`operator`) roles with real-time status indicators (working/ready/idle), last activity timestamps, and delegated execution counts.
3. **Connected Native Surfaces:** Deep links to canonical Control UI destinations (`/chat`, `/skills`, `/settings/memory`, `/activity`, `/workboard`, `/sessions`, `/usage`, `/settings/agents`, `/worktrees`, `/systems`, `/plugin?plugin=zero-control-ui&id=models`).
4. **Reviewed Built-in Skill Lifecycle:** Integrate the intake-certified Workshop skill `subagent-echo-check` (revision `08290405-43c2-4a4e-bb3b-03d5c7e30eaa`) as a primary candidate with eligibility badges and a direct "Use in Zero chat" affordance, respecting native install and update lifecycles.
5. **Reconnect & State Machine Alignment (H-06):** Monitor connection generation (`context.host.connection.generation`) and reconnection state (`connection.connected`), instantly resetting cached hold snapshots and force-reloading skills, workspaces, and computer control on reconnection.
6. **No Duplicate Infrastructure:** Strictly zero duplicate transcript stores, secondary chat clients, separate desktop viewers, or external framework runtimes.

---

## 2. Implementation Summary

### 2.1 Assistant Hero & Canonical Session Entry
- **Canonical Session Management:** Hero card inspects `roster.sessions` for the primary Lead agent (`zero`). If an existing top-level session exists, "Open Zero chat" navigates directly to that canonical Gateway session via `context.host.sessions.open()`.
- **New Conversation Creation:** "New conversation" executes `context.host.sessions.create({ agentId: "zero", displayName: "Zero conversation" })` and immediately selects and opens the newly minted session.
- **Operator Write Gating:** If the Gateway connection lacks operator write capability, chat creation buttons are safely disabled with explanatory hints.

### 2.2 Specialist Team Grid & Activity Timeline
- **Role Derivation & Presentation:** Dynamic role mapping identifies Lead, Researcher, and Operator from agent IDs and names (`agentRole()`), ranking and presenting them clearly.
- **Real-Time Working Indicators:** Inspects active runs (`session.hasActiveRun`) to display animated "Working now" badges with status dots.
- **Canonical Activity Chipping:** Displays the latest 8 sessions from `context.host.sessions.observe()` decorated with `working`, `delegated` (spawns / child runs), `task board` (`hasBoard`), and workspace branch metadata (`session.worktree.branch`).

### 2.3 Connected Personalization & Infrastructure Surfaces
- **Memory Files Card:** Scoped FTS/hybrid search over `MEMORY.md`, `USER.md`, and `memory/*.md` with explicit `agentId` filtering, snippet highlighting, and an honest empty state ("Session transcripts are outside this search").
- **Skills Summary:** Inspects `skills.status` for the selected agent, presenting ready, setup, and disabled counts alongside the highlighted `subagent-echo-check` Workshop skill.
- **Workspaces Inspector:** Read-only inspection of agent workspace paths and active managed worktrees via `worktrees.list`.
- **Computer Control Card:** Interacts with `zero.computer.control` Gateway method (status, take, release) with automatic release on `pagehide` and `visibilitychange` refreshes.

### 2.4 Reconnect State Alignment (H-06)
- Monitored variables:
  ```javascript
  let lastGeneration = context.host.connection?.generation;
  let lastConnected = context.host.connection?.connected;
  ```
- On disconnect (`!connection.connected`):
  Immediately sets `computer.status = "checking"`, `computer.snapshot = null`, preventing stale hold displays.
- On reconnect (`connection.connected && !lastConnected`) or generation increment (`currentGeneration !== lastGeneration`):
  Forces fresh invalidation and reloads (`loadSkills(true)`, `loadComputer(true)`, `loadWorkspaces(true)`), immediately re-syncing UI state with the live Gateway.

---

## 3. Verification & Live Status

1. **Unit Test Suite:**
   `test/mount.test.mjs` executes 3 complete suites:
   - `Zero Team page mounts canonical data and built-in links`: passes (covers hero session creation, specialist roster, memory search, workspace listing, computer take/release, H-06 reconnect state alignment, and dispose release). *Historical UI-04 evidence; current hold semantics differ: `dispose()` alone never releases — see `test/computer-hold.test.mjs` and `reports/ui/openmausbot-ui-reference.md`.*
   - `Zero Models & Providers page mounts defaults, provider cards, server-side discovery, and write-only key flow`: passes.
   - `PM-01 Negative tests`: passes (stale baseHash rejection, probe rollback, per-agent snapshots, secret failure).
   - Result: 3 passed, 0 failed.

2. **Bundle Compilation & Digest Verification:**
   - Command: `node app/zero-control-ui/build.mjs`
   - Bundle Path: `dist/control-ui/8415876861d13914fb64227b2e64abcfb3c886b059a549cc6b68d0ceeff255e7`
   - Reconciled Catalog Revision: `06d350d6c181a2e9b52d2ee2fc4e7e70e5a46dd49bbdc99a522485e04536d074`
   - Total Assets: `index.js` (56,987 B) + `index.css` (17,398 B) = 74,385 B.

3. **Live Gateway Hot-Reload:**
   - Executed: `plugins.controlUi.reload` with `{ pluginId: "zero-control-ui" }`.
   - Live Response:
     ```json
     {
       "pluginId": "zero-control-ui",
       "revision": "06d350d6c181a2e9b52d2ee2fc4e7e70e5a46dd49bbdc99a522485e04536d074",
       "entryUrl": "/__openclaw__/plugins/control-ui/zero-control-ui/06d350d6c181a2e9b52d2ee2fc4e7e70e5a46dd49bbdc99a522485e04536d074/index.js",
       "diagnostics": []
     }
     ```
   - HTTP Loopback Verification: `GET /__openclaw__/plugins/control-ui/zero-control-ui/06d350d6.../index.js` -> 200 OK (56,987 bytes).

> **Historical scope (2026-10-25):** this section records the UI-04 acceptance run at plugin
> revision `06d350d6…` / generation `84158768…` (3/3 tests). It is intentionally not the current
> build. The current native-only build is generation `211e64c9…` with digest revision
> `75d0b71f…`, 37/37 UI tests, and the legacy React/CopilotKit path removed; the running Gateway
> still serves its startup-cached revision until an owner-authorized restart. See
> `reports/ui/provider-manager-ui.md` §22 and the canonical status line in `PROJECT_MEMORY.md`.
