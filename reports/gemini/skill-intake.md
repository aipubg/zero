# GEM-00 — Skills and capability reuse intake

Date: 2026-10-23  |  Owner: Gemini  |  Status: initial source audit complete

## Product constraints

Zero is one native OpenClaw Control UI product with one Gateway runtime and canonical session/history. OpenCode owns the UI; Qoder owns backend/computer. This lane supplies evidence and recommendations only. No skill installation, provider call, desktop action, or source modification was performed.

## Source comparison

| Candidate | Source/evidence | License and reuse | Workflow, tools, dependencies | OpenClaw fit and UI | Risk / acceptance |
|---|---|---|---|---|---|
| Hermes Agent installed skill catalog | `upstream/hermes-agent/` shallow checkout contains no `SKILL.md` skill payloads (`rg --files` found none); `LICENSE` is MIT, copyright Nous Research | MIT permits adaptation with notice; individual imported skill licenses still need per-skill inspection. No concrete Hermes skill can be approved from this checkout yet. | Hermes is a Python agent/tool ecosystem; importing its runtime would add dependencies and duplicate OpenClaw. Do not import runtime. | Candidate skill must be repackaged to OpenClaw's skill format/lifecycle and surfaced through built-in `skills.status`/Skills page. | Blocked as a first skill until a specific skill file/revision and its own license are available. |
| OpenClaw built-in `subagent-echo-check` | Qoder's live report in `reports/backend/personalization.md` §2 records 1/56 ready and describes the exact skill behavior; installed release inventory is the cited evidence. | OpenClaw MIT; preserve attribution/notices when copying any implementation. Existing installed content needs no upstream-code copy. | Documents `sessions_spawn` → `sessions_yield` → completion-event flow; uses built-in team/session tools, no extra model download or external account. | Already visible to the model as a Workshop skill; inspect via `skills.status`/Workshop lifecycle. Zero UI currently shows read-only skill counts, with management in native Skills page. | Best first reviewed MVP candidate: review this already-installed content as a workflow/template, then prove a fresh safe invocation returns child completion. Do not mislabel it “external” or “Hermes-derived.” |
| OpenClaw built-in skills lifecycle | `reports/backend/personalization.md` §2: installed-release methods `skills.status/search/detail/install/update`, `skills.library.*`, `skills.workshop.*` and their scopes. | OpenClaw MIT; third-party skills require individual license/NOTICE review. | Install/update require `operator.admin`; personal library mutation requires `operator.write`; no generic RPC to read arbitrary installed skill files. | Keep inventory and management in the same Gateway Control UI. OpenCode's Zero panel is summary-only; native Skills page remains the management surface. | Acceptance: one reviewed skill has source/license recorded, is visible to target agent, runs a bounded workflow, and can be disabled/updated through supported Gateway lifecycle. |

## Recommendation

Select the existing `subagent-echo-check` Workshop skill as the **first reviewed Zero MVP skill candidate**. It needs no new account or model download and directly demonstrates Zero's core team workflow. This is a review of an existing skill, not approval to import third-party content. Verify its exact installed file/revision and license metadata before enabling it for routine use. If an external Hermes skill is mandatory, first provide a pinned skill artifact; the current Hermes checkout has no skill payload to assess.

## Handoff

- **Qoder / BE-03:** retain Gateway `skills.*` as sole lifecycle; inventory this candidate's exact Workshop revision, agent eligibility and disable/update behavior. No new registry or arbitrary file-read RPC.
- **OpenCode / UI-03:** current Zero skill panel accurately reports `skills.status`; keep install/edit in the native Skills page. If showing this candidate, label source as OpenClaw Workshop, not Hermes or external.
- Next audit: identify one pinned, license-clear Hermes skill artifact only if available in current checkout or already supplied by owner; otherwise examine OpenClaw skill authoring/review workflow for gaps without importing content.

## Limits

This was a source/documentation audit, not a live invocation. Hermes checkout exposes its MIT project license but not the skill payload catalog. Candidate acceptance remains provisional until Qoder verifies the installed artifact and a safe invocation.
