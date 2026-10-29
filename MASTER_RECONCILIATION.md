# Zero AI — Communication and Roadmap Reconciliation

**Date:** 23 October 2026  
**Purpose:** canonical owner goal, corrected architecture, and the two active developer prompts.

> **Owner scope update — 2026-10-25:** Local GGUF/model download or import, managed llama.cpp
> runtime, and GPU/VRAM probing are excluded from the product roadmap. The out-of-scope PM-04
> GGUF UI/scripts/tests/reports and the standalone experimental Model Gateway replacement were
> removed on 2026-10-27. The native OpenClaw Gateway/provider route remains.

## Canonical product goal

Zero is a private single-user AI application with one product window:

- OpenClaw Control UI is the main shell.
- OpenClaw Gateway is the only runtime, model route, agent/session system and canonical history source.
- A Lead assistant can delegate to bounded Researcher and Operator agents.
- OpenDots, OpenMausBot and Hermes contribute selected compatible capabilities and patterns inside Zero; they are not separate apps, UIs or backends.
- The Operator uses a dedicated isolated Windows environment. The owner can watch, take over, stop and recover the work.
- The current NVIDIA route is `https://integrate.api.nvidia.com/v1`, model `z-ai/glm-5.3-flash`, read through environment-only secrets.

## Corrections to the earlier plan

1. The React/CopilotKit app is a bridge prototype, not the final product UI.
2. DeepSeek Harness is inactive. Its useful code, config, tests and evidence stay preserved; Qoder owns backend and computer work.
3. The native `zero-control-ui` package is live. Do not repeat its initial implementation or loader setup.
4. The token/login prompt was removed for the private loopback instance through `gateway.auth.mode: "none"`. Keep the Gateway loopback-only. This does not remove computer hold, global stop, recovery, or isolated-environment boundaries.
5. Computer status/take/release is proven. Actual desktop observe/input and trusted-policy refusal are not proven because `/systems` still requires a desktop server. CU-01 remains open.
6. Memory search works with the default memory-file scope. Do not present session-only queries as missing memories; do not add a second memory store.
7. Historical logs remain history. Only active prompts and current status are authoritative.

## Corrected roadmap

### Phase 1 — Native single-shell completion

OpenCode continues the live Zero Team page, branding, skills/memory/workspace/timeline links, and selected OpenDots/OpenMausBot UI capabilities. Qoder reconciles the deployed bundle and backend contracts.

### Phase 2 — Backend and agent completion

Qoder verifies BE-02/BE-03: delegation, refusal boundaries, model route, skills, memory, budgets, audit, reconnect and stale-hold recovery. Add custom coordination only if a built-in gap is demonstrated.

### Phase 3 — Computer-use proof

Qoder provisions/uses only the designated isolated Windows environment. Prove observe → act → verify, live view, takeover, hold refusal, stop, resume snapshot and crash/disconnect recovery. Do not claim completion from the lease card alone.

### Phase 4 — Integrated acceptance

Demonstrate one complete flow: chat → delegation → skill/memory → visible desktop task → user takeover/stop/recovery. Then perform packaging, startup, backup/restore, logs and license/NOTICE review.

Local GGUF/model import, local inference runtime, and GPU/VRAM work are outside all phases.

## Active ownership

- **OpenCode:** `app/`, `reports/ui/`, native Control UI integration.
- **Qoder:** `backend/`, `reports/backend/`, `computer/`, `reports/computer/`.
- **ChatGPT senior:** review, coordination, roadmap and acceptance.
- **DeepSeek Harness:** inactive; never message or wait for it.

## OpenCode start line

```text
OpenCode, resume UI-03. Read DEVELOPER_OPENCODE.md, PROJECT_MEMORY.md, MASTER_PLAN.md, TASK_BOARD.md, DECISIONS.md (D-012–D-014), reports/ui/zero-control-ui-slice.md, reports/ui/auth-ui-audit.md, reports/ui/personalization-ui.md, and the latest AGENT_CHAT.txt tail. The native Zero Team page is built and live; the token/login gate is removed for the loopback-only local instance. Do not redo plugin-loader setup, create another React/CopilotKit product UI, add a second store/backend, or revive /live/desktop. First reconcile the currently served bundle hash with Qoder. Then continue the same Control UI shell with Zero branding, verified native skills/memory/workspace/timeline surfaces, and compatible OpenDots/OpenMausBot capability integration. Existing /systems Desktop remains the computer surface; status/take/release is proven but actual observe/input remains CU-01. Keep upstream read-only, update reports/board/log, and continue until a genuine owner/external/isolated-desktop prerequisite blocks progress.
```

## Qoder start line

```text
Qoder, resume BE-02/BE-03/CU-02 under D-013. Read DEVELOPER_QODER.md, PROJECT_MEMORY.md, MASTER_PLAN.md, TASK_BOARD.md, DECISIONS.md (D-009, D-011–D-014), reports/backend/control-ui-backend-contract.md, reports/backend/personalization.md, reports/computer/hold-method-reconciliation.md, and the latest AGENT_CHAT.txt tail. Backend/runtime and zero-control-ui activation are live; do not repeat the initial handover. Reconcile the current served bundle hash with OpenCode, settle reconnect/operator scope and stale-hold recovery, and continue BE-03/CU-02. Gateway is loopback-only with gateway.auth.mode:none; keep the token prompt removed and do not expose the Gateway. Status/take/release is proven, but actual desktop observe/input and trusted-policy refusal are not; keep CU-01 limited to the designated isolated Zero Windows environment. Do not edit app/ or upstream/, never delete by author, use env-only secrets, update reports/board/log, and continue without routine review pauses.
```
