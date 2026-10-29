# ZERO AI — Master Product, Engineering, and Coordination Plan

**Version:** 1.0 · **Date:** 23 October 2026 · **Project root:** `E:\zero`  
**Product name:** Zero AI (working product identity; no OpenAI/OpenClaw/OpenDots branding in the product)

> **Owner direction update — 2026-10-23 (D-012/D-013):** Zero is one integrated product UI based on the existing OpenClaw Control UI. The current CopilotKit/OpenDots-derived `app/` is a working integration prototype, not the final separate UI. OpenCode consolidates the UI; Qoder owns computer integration and backend maintenance; Gemini is a third software developer assigned source/reuse research. Gemini is not a product feature. Do not continue adding a parallel CopilotKit chat surface or waiting on DeepSeek.

> **Canonical agent state — 2026-10-26:** the authoritative live config has exactly one agent, `zero`, with `subagents.allowAgents: []` and `requireAgentId: true`. Historical "Lead + Researcher + Operator" / specialist-team lines in this plan are superseded. Do not recreate worker agents, delegation edges, or specialist chats; only `/chat/zero` is user-facing.

## 1. Product goal

Build Zero as a private, single-user AI assistant. The user-facing app has one assistant and one conversation at `/chat/zero`. Backend execution uses only capabilities present in the authoritative Zero/Gateway configuration; do not create specialist agents or delegation edges unless the owner makes a new product decision. Computer control remains scoped to its designated Windows environment, with visible state and user takeover.

The project is a **new Zero product**, not a logo swap. It will reuse proven open-source runtime, UI, protocols, and components wherever practical. Do not rewrite a capability just to make the source look new. Do not merge entire repositories blindly. Reuse at stable integration boundaries and keep upstream provenance.

No foundation-model training or local model download is planned. Model inference goes through the user's configured model gateway, which may route to multiple underlying providers/models.

**Owner scope decision (2026-10-25):** Local GGUF/model download or import, managed llama.cpp
runtime, and GPU/VRAM probing are excluded from Zero's roadmap. Do not implement, test, package,
or schedule further work for these features. The out-of-scope PM-04 GGUF UI/scripts/tests/reports and
the standalone experimental Model Gateway replacement were removed on 2026-10-27; the native
OpenClaw Gateway/provider route and Model Provider Manager remain.

## 2. Product principles

1. **Reuse first:** verify whether OpenClaw/OpenDots/OpenMausBot/Hermes already solve a need before writing code.
2. **Small, low-load steps:** work continuously through source review, design, coordination, implementation, local builds and authorized runtime/API checks; never start multiple large dependency installs/builds together. The owner has authorized routine local install/build/runtime/API work. Pause only for a genuinely missing owner decision, external account approval, or the designated isolated desktop prerequisite.
3. **No interference:** developers own separate directories/files. Shared protocol or database changes require a coordination-log proposal and senior-developer decision first.
4. **Evidence over assumptions:** record exact upstream commit, versions, commands, result, limitations, and report path. Do not present a mock or docs claim as a live integration result.
5. **One product, one source of truth:** OpenClaw owns agent runs, agent sessions, skills, and assistant memory where supported. Zero owns only product-specific workspace/UI metadata unless an evidenced gap requires more.
6. **Full computer control is scoped to Zero's designated computer environment.** The product need not ask for approval for every ordinary action. It must show the live work, permit takeover, expose a global stop, and support recovery. Do not use the user's everyday Windows profile as the first test environment.
7. **Complete outcome, staged delivery:** the objective is the full useful project. Keep tickets small and verify milestones, but senior acceptance is asynchronous; developers continue independent work and only gate dependent changes on unresolved contracts or owner-only inputs.

## 3. Repository/reuse strategy

| Source | Reuse plan | Do not assume |
|---|---|---|
| **OpenClaw** | Backend runtime/kernel: gateway, model providers, agent/sub-agent runs, skills, plugins, memory/session facilities, scheduler where suitable. Pin a commit; add Zero code outside upstream core first. | Windows computer use is production-ready; every needed team/board/memory feature exists exactly as Zero needs it. |
| **OpenDots** | Selective source/pattern reference inside the single OpenClaw Control UI-based Zero product: specialist roster, activity timeline, artifacts, and other concrete capabilities. | Its separate React app or Intelligence thread service is not the Zero product target. |
| **CopilotKit / AG-UI** | Reuse a specific protocol/component only if it demonstrably reduces integration work inside the one UI. | Do not keep its React/runtime stack merely as the default frontend. OpenClaw Gateway uses its own protocol; any adapter must serve the unified Control UI, not create a second chat app. |
| **OpenMausBot** | Inspect desktop viewer, computer panel, takeover, tray, and roster patterns; reuse a specific compatible component only after checking license and runtime dependencies. | Its CLI-based provider drivers or host-control code are a drop-in match for an API-only OpenClaw backend. |
| **Hermes Agent** | Reference skill-learning, memory consolidation, and user-model ideas. Reuse/import a few skills after review; port small patterns only when an evaluated gap exists. | Thousands of skills are compatible, safe, licensed for every use, or useful to bulk import. |
| **Qwen-AgentWorld** | Research/evaluation reference only if a specific agent-world/model-evaluation need arises. | It is a ready-made personal assistant UI/runtime. |

### Current UI integration direction (D-012)

The main product window should use the pinned OpenClaw Control UI shell and its existing Gateway connection/session model. OpenCode should determine the smallest supported integration seam (native Control UI extension/plugin surface or a Zero-owned downstream UI package) and place Zero's assistant-first navigation, selected OpenDots functions, OpenMausBot computer-view/takeover patterns, and Zero branding there. The existing React/CopilotKit `app/` proved a Gateway bridge, but it is not a second permanent UI. Keep its useful tested backend adapter code where needed; remove the CopilotKit chat/runtime dependency once the one-UI replacement is verified. Do not recreate features already served by the Control UI.

**Framework reality:** OpenClaw Control UI is Solid; the current OpenDots-derived client is React. These sources cannot be directly merged as ordinary components. Reuse actual code where compatible; otherwise port only the required behavior into the Control UI's native patterns and record provenance/license. A React mount is allowed only if a small prototype proves it creates one coherent interface and is simpler to maintain than native integration. No separate browser window, duplicate nav, parallel thread list, or second transcript store.

## 4. Target architecture (provisional)

```text
Zero single product UI (OpenClaw Control UI shell, Zero-owned downstream integration)
  ├─ Assistant chat + canonical OpenClaw sessions
  ├─ Zero activity (no specialist roster under current zero-only config)
  ├─ Computer view/takeover using selected OpenMausBot patterns + OpenClaw CUA
  └─ Skills/memory/settings where supported
             │ existing Gateway WS / native Control UI contracts
             ▼
OpenClaw Gateway/runtime (single source of truth)
  ├─ Zero agent sessions (delegation disabled by current config)
  ├─ Skills/plugins/tools, model/provider routes, memory, routines
  └─ API calls → one configured model gateway → multiple models/providers
             └─ computer tool → dedicated Windows computer environment
                  built-in OpenClaw CUA first; custom worker only if needed
```

### Data ownership

- **OpenClaw:** agent run state, canonical chat/session history where supported, agent workspaces, skills and long-term memory.
- **Zero local store:** UI preferences, Space/page metadata, display settings, thread-to-session bindings only if OpenClaw does not expose a suitable mapping.
- Do not duplicate whole transcripts in a second database by default. Document any unavoidable copy and retention rule.
- Store secrets using the host's secure secret store; never in prompts, reports, chat logs, or checked-in configuration.

### One gateway, multiple models

Configure one model gateway endpoint/key, then select models by agent/role only when supported and useful. Verify the gateway for model listing, streaming, tool/function calling, vision (for computer-use), response formats, cost reporting, and failure behavior. No model downloads or parallel provider setup during the initial spike.

## 5. Feature scope and order

### MVP (must work before polish)

- Private local app and one model gateway.
- Main assistant chat with streaming, sessions/resume, stop/cancel, and useful tool activity.
- A single Zero assistant. Backend delegation is allowed only where it already exists and the owner approves it; the current authoritative configuration has delegation disabled. Do not recreate Researcher/Operator workers or chats.
- Skills: install a few external skills, inspect/edit them, enable/disable them, keep source/version/license info.
- Memory the user can inspect/edit/delete.
- Computer-use in the designated environment: observe → act → verify, visible live screen, user takeover, global stop, recovery.
- Bounded API/action budgets and basic local audit.

Explicitly out of scope: local GGUF/model import or download, managed local inference runtime,
and GPU/VRAM probing. Keep any existing artifacts untouched and do not open follow-up tickets.

### Later, only after MVP evidence

Spaces/page editor, persistent task board, inter-agent mailbox, stronger work resumption, scheduled responsibilities, voice/calls, external messaging channels, mobile client, extra integrations, multi-machine workers.

Do not implement every feature from each upstream project. Feature inclusion requires a concrete user workflow and a named acceptance check.

## 6. Work breakdown and dependencies

All tasks are intentionally small. Each developer takes the next `READY` ticket in their own lane. After a HANDOFF they continue immediately to the next ready lane ticket; senior review does not pause independent work. If a task requires a heavy build/install, announce its resource estimate and coordinate one heavy job at a time on this machine.

### Gate 0 — Source and capability proof (parallel, read-only/lightweight)

- **BE-01 Qoder:** maintain OpenClaw baseline/provider/gateway/API/session/sub-agent/skills proof; existing Gateway proof is accepted and retained.
- **CU-01 Qoder:** verify Windows CUA support in the pinned source and run a small, harmless proof only in the designated computer environment; otherwise document the missing VM/session requirements.
- **UI-01 OpenCode:** inspect OpenDots and OpenClaw UI, identify Intelligence dependencies and prove/propose the smallest AG-UI ↔ OpenClaw bridge. No full UI rewrite.
- **Senior review:** resolve baseline/UI/data ownership/tool contract and confirm exact follow-on scope from reports.

### Gate 1 — Minimal integrated prototype (begin as its dependencies are evidenced; review is asynchronous)

- **BE-02 (Qoder):** verify/maintain OpenClaw gateway config, main assistant and named specialists; reuse built-in sub-agents before custom orchestration.
- **CU-02:** connect supported computer capability to the dedicated Windows environment; implement only missing observation/action/verify/takeover/stop behavior.
- **UI-REBASE (OpenCode):** consolidate the tested Zero chat/agent/computer functionality into one OpenClaw Control UI-based Zero product surface. Reuse compatible OpenDots/OpenMausBot source inside that application; retire the parallel CopilotKit UI after parity and Gateway behavior are verified.
- **Integration-01 (shared):** senior developer publishes accepted event/tool/session contracts; each owner integrates within their directory.

### Gate 2 — Personalization and team workflow

- **BE-03:** external skill import/edit lifecycle, inspectable memory, model routes, limits and audit.
- **UI-03:** skill/memory/workspace controls and task/artifact display inside the same canonical UI.
- **GEM-00 (Gemini):** inventory concrete Hermes/OpenClaw skill candidates and source reuse candidates with license, permissions, dependencies, install/update path and acceptance check. Supply the first reviewed-skill recommendation to Qoder; do not install or alter runtime code.
- **Team-01:** only if built-in sub-agents are insufficient, implement a bounded board/mailbox with budgets, cancellation, timeouts, and resumable status.

### Gate 3 — Product completion

- **Polish-01:** product name Zero AI, onboarding, settings, tray/desktop packaging if needed.
- **Reliability-01:** clean install, backup/restore, start/stop, logs, provider failure handling, computer recovery, license/NOTICE inventory.
- **Acceptance:** user can start Zero, chat through the gateway, delegate a small task, observe computer-use in its designated environment, take over/stop it, use a reviewed skill, and inspect/manage memory. Every part must be demonstrated from the intended setup; no “complete” claim based only on source inspection.

No duration promise until Gate 0 reveals the actual starting state and machine capacity. Prefer a complete, working narrow MVP over a broad partially integrated mockup; continue through the full roadmap instead of treating feasibility reports as project completion.

## 7. Low-resource and source-download policy

- Upstream source checkouts are **shallow/partial/sparse** under `upstream/`; do not download all tags/history or all platform apps unless a ticket needs them.
- Do not download model weights or Docker images. Dependencies/builds may proceed under the owner's standing authorization, but only one heavy install/build/runtime job may run at a time.
- Inspect manifests first, estimate disk/RAM, record actuals, and coordinate the single heavy operation in `AGENT_CHAT.txt`. Do not re-request routine owner GO.
- Use OpenClaw's pinned Node/pnpm requirements from the checked-out commit, not memory or a stale plan. The current shell has Node `v24.22.1` and pnpm `11.25.0`; the cloned OpenClaw manifest declares `pnpm@12.15.0` and Node `>=24.22.1 <25 || >=26.12.1`. Do not auto-upgrade/install pnpm until needed and approved by the senior developer.
- Download only Qwen-AgentWorld or additional repository paths if a specific ticket needs them. No need for Qwen model weights for an API-backed product.

## 8. Shared-workspace coordination protocol

- Start prompts are in `START_TASKS.txt`. Each agent reads its own `DEVELOPER_*.md`, this plan, `PROJECT_MEMORY.md`, `TASK_BOARD.md`, `DECISIONS.md`, and the recent tail of `AGENT_CHAT.txt`.
- Use `TASK_BOARD.md` as the status source of truth; use `AGENT_CHAT.txt` for questions, updates, blockers, and handoffs; use `DECISIONS.md` for accepted architecture.
- Ownership (D-013): Qoder owns `reports/backend/` + `backend/` and `reports/computer/` + `computer/`; OpenCode owns `reports/ui/` + `app/`; Gemini owns `reports/gemini/` only; ChatGPT owns senior integration/acceptance. DeepSeek Harness is inactive. Preserve and verify its completed backend implementation; do not delete by author.
- Before changing a shared contract or another developer's files: post a `DECISION REQUEST`; use evidence and the accepted default to keep independent pre-build work moving; do not overwrite work. Ask `@manager` only at the build gate or if the owner must choose between incompatible product outcomes.
- Each message must include local time, name, ticket, type, and explicit response target. Append; never erase history. For simultaneous edit conflict, write a uniquely named message file under `coordination/messages/` and note its filename in the log.
- Finish each ticket with a `HANDOFF`: what changed, paths, evidence, limitations, and next step. Set `READY FOR REVIEW`; continue through all independent pre-build work in your lane. When no pre-build work remains and the next step is a build gate, submit the readiness packet and wait for owner approval.
- Do not interpret silence as completion. If unable to access the workspace, say so. Agents do not have a persistent live chat unless invoked; this file protocol is their shared mailbox.

## 9. Upstream and change policy

- Keep `upstream/*` checkouts read-only. Build Zero-owned work beside them; do not casually patch vendor source.
- Pin the exact upstream commit in reports/decision records. Extend through a plugin, adapter, workspace package, or a small recorded patch, in that preference order.
- Do not mass-delete upstream files to reduce disk use. Sparse checkout excludes unused source without creating merge debt.
- Code reuse requires preserving the relevant license, copyright, NOTICE, third-party license, and any file-level license obligations. Check the exact source file and dependency, not just the repository's main license.
- Do not publish, deploy publicly, contact maintainers, or create external accounts as part of the local build without a direct request.

## 10. Current baseline snapshot

- The Zero React bridge prototype exists under `app/`; installed app/backend dependencies and previous Gateway/model integration proofs are recorded in the lane reports. Current process-specific runtime/credential state must be checked before a new live call.
- A shallow filtered clone of OpenClaw is at `upstream/openclaw`; OpenDots, OpenMausBot, and Hermes are also shallow filtered clones. Keep all upstream trees read-only.
- Qwen-AgentWorld remains optional and is not needed for the API-backed assistant scope.
- OpenClaw commit/toolchain and exact sparse paths are recorded in [`reports/source-inventory.md`](reports/source-inventory.md).
- No real Windows desktop operation has been proven; CU-01 requires the designated isolated Zero Windows environment.
