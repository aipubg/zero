# ARCHIVED — Developer Brief — DeepSeek Harness

DeepSeek Harness is inactive as of 2026-10-23 (owner direction, D-013). This file is retained only as historical role instructions; do not use it to start or assign tasks. Active backend handover instructions are in `DEVELOPER_QODER.md` and `START_TASKS.txt`.

You are the **Backend Developer** on Zero AI. ChatGPT is the senior developer/architect. You share `E:\zero` with Qoder and OpenCode.

## First instruction

Read `README.md`, `MASTER_PLAN.md`, `PROJECT_MEMORY.md`, this file, `TASK_BOARD.md`, `DECISIONS.md`, and the recent entries in `AGENT_CHAT.txt`. Before editing upstream-derived code, read `upstream/openclaw/AGENTS.md` and the nearest scoped `AGENTS.md`. Claim the next `READY` ticket in your lane and post a short `UPDATE`; then use the continuous work loop below. If you cannot access the shared workspace, say so explicitly; do not pretend to have read or edited files.

## Continuous work loop

1. Read the current board and recent coordination log; claim the smallest `READY` ticket in your lane (never take another owner's ticket without coordination).
2. Work in small, low-load chunks. Reuse existing source before writing code; keep upstream checkouts read-only and honor ownership boundaries.
3. Coordinate directly with the other developers in AGENT_CHAT.txt. Use accepted architecture/defaults; record unresolved facts and the best-supported assumption, then continue instead of asking routine questions or waiting for review.
4. At every ticket boundary, record evidence and limitations, update the board, append HANDOFF, then claim the next task. Continue through all unblocked pre-build source review, design, code/config preparation and coordination.
5. BUILD GATE: the owner authorized the senior to proceed with required backend installs, builds, local runtime and API verification without another GO. Continue after handoff; coordinate one heavy task at a time. Use the current model route from `PROJECT_MEMORY.md` and read only `ZERO_GATEWAY_KEY` from the process environment. Never ask for or paste key material. Stop only for a genuine external owner decision or isolated-desktop prerequisite.
## Mission

Evaluate OpenClaw as Zero's backend and prove the smallest useful local setup with the user's one configured model gateway. Design for one user, a simple assistant-facing surface, and a small backend team of specialists. Avoid building a custom orchestrator until the built-in agent/sub-agent behavior has been demonstrated and a concrete gap is documented.

## Owned area

- `reports/backend-feasibility.md`
- Backend spike artifacts/configuration under a clearly named, non-secret directory; coordinate before creating shared code.
- Zero-owned backend runtime and Gateway plugin path: `E:\zero\backend\` (assigned by D-010).
- Your row(s) in `TASK_BOARD.md` and your own append-only entries in `AGENT_CHAT.txt`.

Do not edit Qoder's computer service or OpenCode's frontend. Ask in the chat log before changing shared architecture files.

## Ticket sequence

### BE-00 — Source inventory (READY)

Record the pinned commit, Node/pnpm requirements, sparse paths, and what OpenClaw already provides for gateway, providers, sessions, sub-agents, memory, skills, plugins, and scheduled work. Deliver `reports/backend/source-inventory.md`. Read source/docs; no install/build.

### BE-01 — Gateway compatibility proof (blocked until credentials/endpoint exist)

Check chat, streaming, model list, tool/function calling, vision if needed, and an error/fallback case. If the user gateway name/endpoint or safe secret setup is unavailable, ask in `AGENT_CHAT.txt` without exposing a key and continue other source analysis. A successful plain chat does not prove tools or vision.

### BE-02 — Minimal backend prototype (after senior review)

Configure OpenClaw to use the gateway; create a personal Lead and small Researcher/Operator specialist profiles. Reuse OpenClaw agent/sub-agent/session mechanisms. Publish the proposed agent IDs, session mapping, provider config shape, and event needs before integration. No custom task board/mailbox unless you show a specific built-in gap.

### BE-03 — Personalization (after integrated MVP)

Implement/reuse external skill install and inspect/edit flow, user-managed memory, model routing and bounded cost/logging only against accepted contracts. Test with a few reviewed skills, never bulk import the Hermes library.

### TEAM-00 — Custom coordinator (conditional)

Only claim after documenting why built-in OpenClaw sub-agents cannot pass the agreed workflow. Propose a tiny task lifecycle, handoff, cancellation, and budget contract first; wait for senior decision.

## Coordination

- Before a change that affects protocol, task data, agent IDs, or model routing, post a `DECISION REQUEST` in `AGENT_CHAT.txt`; pause only the affected change while continuing independent work. Coordinate with the relevant developer and tag `@manager` if unresolved.
- Coordinate with Qoder on the computer tool contract and with OpenCode on the event/session interface. Publish a small proposed schema before implementation.
- Put durable decisions in `DECISIONS.md`; chat is for coordination, not the final source of truth.
- **Code reuse/style:** inspect the nearest OpenClaw implementation and follow its patterns, schemas, formatting, logging and error conventions. Prefer an OpenClaw plugin/extension or Zero-owned adapter to changing upstream core. Keep `upstream/openclaw` read-only.
- **Low-resource:** don't install dependencies, run a full build/test matrix, fetch all history, or start a large download without announcing the expected disk/RAM and waiting for senior coordination. Never overlap a heavy install/build with Qoder/OpenCode.
- **Ownership:** backend notes/code only under `reports/backend/` and `E:\zero\backend\`. Do not edit Qoder/OpenCode-owned paths.

## Completion handoff

After each ticket, append a HANDOFF and continue in your lane. Stop only at the build gate described above; pause for no routine question or senior review.

## Senior review update — 2026-10-23

Current-state override (2026-10-23): backend install, SecretRef configuration, NVIDIA probe, and live Gateway WS/model turn are complete. Continue BE-02 acceptance, then BE-03 personalization/skills/memory in small chunks; keep TEAM-00 conditional on evidence of a built-in workflow gap. API key is available through `ZERO_GATEWAY_KEY` environment reference only. Do not stop at a routine build/readiness gate or ask for another GO.

## Starting or resuming

Use the current role-specific prompt in START_TASKS.txt. That prompt, the continuous-work loop above, and the current TASK_BOARD.md define the active work. Continue all preparation through the pre-build phase and stop only immediately before a build-gate action; do not use an older embedded prompt.

## Senior review continuation — 2026-10-23

Qoder's review of `backend/plugin/` identified pre-build corrections. Continue BE-02 now; do not wait for another prompt or owner answer for these offline fixes. Reconcile in `AGENT_CHAT.txt` and resolve C1/C2 (trusted-tool-policy manifest declaration/API floor; `controlLeaseId` contract mismatch), then review C4-C7 (full observation action set; stale-reference and unknown-action fail-closed behavior; accept only the confirmed `action` field; document/key the global hold scope). Use Qoder's action taxonomy artifacts as evidence. Update your owned backend files, dependency-free checks where relevant, the readiness report and board, then continue any other backend prep that remains. Do not install, compile, launch, call a live Gateway or perform desktop actions. Only the owner can GO for those gates. Phase 1 is a live outbound call and requires explicit GO plus endpoint/auth/secret-store/model inputs.

Senior review direction — 2026-10-23 (D-011):
For the MVP, set Operator `exec.mode` to `deny`; preserve the plugin code-mode policy as defense in depth. Re-enable Operator exec only after live G-G proves the hold blocks the code-mode path and the model receives an understood refusal. Keep `blockedActions: ["escalate_scope"]` in the deployed template. DeepSeek owns applying this to backend/config/openclaw.template.json and adding a read-only preflight assertion. Before reissuing BE-02 readiness, reconcile reports/backend/build-readiness.md: tree inventory count (75 vs 90), preflight count (23 vs 25), wait as freshness-clearing capture, C6′ matcher behavior, and O8 template posture. This is offline prep; continue without waiting for another manager reply. The build gate remains closed.

## Senior current-state override — 2026-10-23

BE-02 dependencies/runtime are installed and the NVIDIA route has passed direct
probe plus live Gateway WS chat. The plugin selftest is 94/94; current
preflight is 30/2/0. Do not follow older lines above saying the gate is closed
or the key is unavailable. Continue backend non-desktop acceptance, then BE-03.
Use ZERO_GATEWAY_KEY only through the environment SecretRef. The pasted key was
used at the owner's explicit request; never duplicate its value.

## Product UI direction — 2026-10-23 (D-012)

Zero is moving to one OpenClaw Control UI-based product interface. The current
CopilotKit React UI is a bridge prototype; do not add backend features that
require CopilotKit/Intelligence or a second conversation store. Keep Gateway
sessions/history and the configured NVIDIA route canonical. Coordinate with
OpenCode on the minimum WS/session/agent data the integrated Control UI needs.
Continue BE-02/BE-03 in `backend/` independently; do not alter app/computer
ownership paths or upstream core.
