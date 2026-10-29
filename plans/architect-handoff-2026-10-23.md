# Architect Handoff — 2026-10-23
## Per START_TASKS.txt CURRENT OVERRIDE

---

## Qoder — BE-02/BE-03/CU-02 Resumption Plan

### Immediate Actions (in order)

1. **Hash Reconciliation** (per override)
   - Run: `node backend/scripts/control-ui-digest.mjs --expect <revision>`
   - Record canonical result: manifest asset directory `347530c4…`, served contribution revision `1a1d2ce3…`, catalog revision `9590177e…`
   - After OpenCode's next build, re-run to record fresh state

2. **Stale-Hold Recovery / Reconnect / Operator Scope** (per override)
   - Verify OpenCode's UI-only reconnect correction:
     - Clear cached computer state on connection-generation change
     - Force refresh, show "checking" before forcing status
   - Implement ONLY verified backend/plugin fix with focused checks
   - Do NOT change backend schema unless evidence requires it

3. **BE-03: subagent-echo-check Verification** (per override)
   - Record as reviewed built-in zero-only bounded Workshop skill
   - Exact revision: Workshop `create` change `08290405-43c2-4a4e-bb3b-03d5c7e30eaa` (2026-10-23 01:30:52 UTC)
   - One-child proof: researcher child `agent:researcher:subagent:4e34f082-8680-4678-8cd5-4d7182a361f4` yielded `SUBAGENT_ECHO_OK`
   - Archive/restore proof: `skills.workshop.archive` → change `9f24a241-fb05-44fd-96a4-3f58a3acef26`; `skills.workshop.restore` → change `0afecc17-eceb-49d0-a57f-b98df40d4f6e`
   - Target-agent eligibility: `zero` only (56 entries with skill; `researcher`/`operator` each 51 with no match)
   - **Do NOT install external registry artifact** — this satisfies the checkbox

4. **CU-02 Continuation** (per override)
   - Continue offline CU-01 prep
   - CU-01 remains designated isolated environment only
   - No live desktop action until environment provisioned

### Evidence to Update
- `reports/backend/personalization.md` §2 (already has subagent-echo-check evidence)
- `reports/computer/mvp-computer.md` (CU-02 pre-build report)
- `reports/computer/build-readiness.md` (gated steps)
- TASK_BOARD.md rows: BE-02, BE-03, CU-02
- AGENT_CHAT.txt append

---

## OpenCode — UI-04 Completion Plan

### Immediate Actions (in order)

1. **Hash Reconciliation** (per override)
   - Reconcile served bundle revision with Qoder using distinction:
     - Gateway Control UI revision digest vs asset-file SHA-256
   - Record one canonical status line
   - After next build, record all four final hash scopes:
     - Manifest asset directory
     - `sha256(index.js)`
     - Served contribution revision
     - Catalog revision

2. **Assistant-First Layout** (per override)
   - Finish `browser.js` assistant/team integration
   - CSS, focused tests, build/mount/CSS checks
   - Reload/live verification
   - Produce `reports/ui/assistant-workflow.md`
   - Clear Zero session entry/open-or-create path
   - Visible Lead/Researcher/Operator activity
   - Clear links to native skills, memory, workspace, Desktop surfaces
   - Reuse canonical Gateway sessions and host APIs ONLY
   - No React/CopilotKit product UI, second store/backend/viewer, or `/live/desktop` relay

3. **UI-Only Reconnect Correction** (per override)
   - Implement Qoder's reconnect correction:
     - Clear cached computer state on connection-generation change
     - Show "checking" before forcing status
     - Force refresh

4. **subagent-echo-check Rendering** (per override)
   - Render through native skills surfaces
   - Do NOT add installer, second UI, store, backend, relay, or desktop viewer

5. **OpenDots Attribution** (if ported)
   - Add MIT notice to `app/zero-control-ui/THIRD_PARTY_NOTICES.md`

### Evidence to Update
- `app/zero-control-ui/` (browser.js, index.css, build.mjs, etc.)
- `reports/ui/assistant-workflow.md` (new)
- `reports/ui/zero-control-ui-slice.md` (update)
- TASK_BOARD.md row: UI-04
- AGENT_CHAT.txt append

---

## Gemini — GEM-04 Agent Contract Intake Audit

### Task (per override)
Produce `reports/gemini/agent-contract-intake.md` — source/config-evidenced audit of:

| Agent | Purpose | Tool Boundary | Delegation Rights | Expected Result/Artifact | Cancellation/Timeout | Token/Action Budget | Exact Gaps |
|-------|---------|---------------|-------------------|--------------------------|----------------------|---------------------|------------|
| **Lead (`zero`)** | | | | | | | |
| **Researcher** | | | | | | | |
| **Operator** | | | | | | | |

### Requirements
- Feed Qoder BE-02/BE-03 and OpenCode UI-04
- Read-only: no runtime/config/code changes, new skill, orchestrator, UI, or memory/transcript store
- Update board/log and hand off next unblocked read-only audit

### Sources to Audit
- `backend/config/openclaw.template.json` (agent roster, tool policy, model routes)
- `backend/plugin/index.js` (zero-policy: budgets, blocked actions, computer hold)
- `reports/backend/personalization.md` (live evidence of delegation, budgets, memory)
- `reports/backend/control-ui-backend-contract.md` (Gateway surface)
- `reports/computer/mvp-computer.md` (Operator computer tool placement)
- `reports/computer/contracts/takeover-hold-contract.md` (Operator hold semantics)
- `upstream/openclaw/docs/` (agent config, sub-agents, sessions_spawn, tool schema)

### Evidence to Update
- `reports/gemini/agent-contract-intake.md` (new)
- TASK_BOARD.md row: GEM-04 (new)
- AGENT_CHAT.txt append

---

## Cross-Lane Coordination

### Hash Reconciliation Protocol
```
Qoder runs: node backend/scripts/control-ui-digest.mjs --expect <revision>
OpenCode builds → Qoder re-runs → both record canonical status line
```

### Dependency Graph
```
GEM-04 (Gemini) 
    → feeds Qoder BE-02/BE-03 (agent contracts, budgets, delegation)
    → feeds OpenCode UI-04 (agent roster, activity rendering)

BE-03 (Qoder) 
    → subagent-echo-check verified → UI-04 renders via native skills surface
    → memory/UI controls → UI-03/INT-00

CU-02 (Qoder) 
    → CU-01 environment → live desktop proof
    → computer panel status/take/release → UI-04 Desktop link
```

### Blocking Items
| Item | Owner | Blocks |
|------|-------|--------|
| Designated isolated Windows environment | @manager | CU-01 live spike, CU-02 K1-K7 |
| External skill choice for BE-03 Gate 5 | Owner | BE-03 external install |
| Senior review of GEM-00/01/02/03 | ChatGPT | REVIEW-00 acceptance |

---

## TASK_BOARD.md Updates Needed

| ID | Owner | New Status | Notes |
|----|-------|------------|-------|
|

---

## AGENT_CHAT.txt Entry Template

```
[2026-10-23 HH:mm Asia/Calcutta] [Architect] [ARCH-00] [HANDOFF]
Message: Per START_TASKS.txt CURRENT OVERRIDE 2026-10-23, issued resumption plans for Qoder (BE-02/BE-03/CU-02), OpenCode (UI-04), Gemini (GEM-04). Hash reconciliation protocol established. subagent-echo-check recorded as reviewed built-in skill. CU-01 remains environment-blocked. Cross-lane dependencies mapped.
Needs response from: Qoder, OpenCode, Gemini (claim next READY task and post UPDATE)