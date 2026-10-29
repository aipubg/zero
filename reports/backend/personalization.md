# BE-03 — Skills, memory, model routes, budgets and audit

**Ticket:** BE-03 · **Owner:** Qoder (D-013) · **Date:** 2026-10-23
**Basis:** D-008, D-012 (one Control UI), D-013 (backend handover)
**Status:** Contract and configuration posture **accepted for the MVP**; live skills install and
the final UI controls remain open. Everything below was read from the **installed release**
`openclaw@2026.10.6` (`fe06181dc5ecc01cf8904abbfc26925925efefbc`), not from the checkout alone.

## 1. What Zero should reuse, and what it must not add

| Need | Built-in owner | Zero decision |
|---|---|---|
| Skills inventory, discovery, install, update | Gateway `skills.*` | Reuse. No Zero skill registry, no bulk import. |
| Memory index and recall | OpenClaw Memory Core (`memory.*`) | Reuse the per-agent index; no second memory store. |
| Model catalog | `models.list` + configured provider | Reuse the one `zero-gw` model row; no UI-side provider catalog. |
| Action budgets and audit | Zero Policy plugin + Gateway usage RPCs | Keep action limits in the plugin; usage RPCs are **reporting**, not enforcement. |
| Team coordination | `sessions_spawn`, `agents.list`, session activity | Reuse; TEAM-00 stays unopened until a live built-in gap is demonstrated. |

## 2. Skills — verified surface in the installed release

Method rows are in `backend/node_modules/openclaw/dist/core-method-policy-DkntKRY_.mjs`.

| Method | Scope | What it is for |
|---|---|---|
| `skills.status` | `operator.read` | Visible skill inventory, eligibility, missing requirements, sanitized install options |
| `skills.search`, `skills.detail` | `operator.read` | ClawHub discovery metadata and release card/scan summary |
| `skills.install` | `operator.admin` | Install one reviewed skill (ClawHub, upload, or declared installer mode) |
| `skills.update` | `operator.admin` | Update tracked installs or patch `skills.entries.<key>` config |
| `skills.library.list` / `.read` | `operator.read` | Personal skill library entries and their files (by `skillId` + `revision`) |
| `skills.library.save` / `.mutate` / `.activate` / `.import` / `.upload` | `operator.write` | Change/activate personal library skills |
| `skills.workshop.list` / `.read` / `.changes` | `operator.read` | Skill Workshop versions and file content |
| `skills.workshop.archive` / `.restore` | `operator.admin` | Workshop administration |

### Correction to the previous backend contract

`skills.files.get` **does not exist in the installed release** — a full `dist/*.mjs` search returns
zero files. It exists only in the older checkout's docs. The previous
`control-ui-backend-contract.md` row listed it as a read method; that was source drift, not a live
surface. Correct replacements depend on what the UI is inspecting:

- installed-skill inventory: `skills.status`;
- registry metadata: `skills.search` / `skills.detail`;
- Workshop-managed skill content: `skills.workshop.read`;
- personal-library skill content: `skills.library.read` (requires `skillId` and `revision`).

There is **no general "read any installed skill file" RPC** in this release. Do not build a UI
affordance that assumes one. If Zero later needs it, that is a narrowly scoped addition with an
explicit path boundary, not arbitrary file access.

**Security posture:** `skills.install` and `skills.update` are `operator.admin`, not
`operator.write`. Under D-012 the Control UI is the admin-capable surface; the ordinary
read/write/approvals link used by the retired prototype cannot install skills. Any install flow
must use the Control UI's per-method scope upgrade and must install one reviewed skill at a time.
`agents.defaults.skills` is `[]` today, so the roster starts with no skills enabled by default.

**Live local inventory (2026-10-23, `openclaw skills list --agent zero`):** **1 of 56 ready**,
55 excluded. The one ready skill is `subagent-echo-check` (`openclaw-workshop`, visible to the
model, available as a command). It is agent-learned Workshop content that documents the proven
`sessions_spawn` → `sessions_yield` → completion-event flow — not a reviewed external install, so
it does not satisfy checklist 5. It does prove that the readiness/visibility lifecycle works in
the live state.

### Workshop skill review — `subagent-echo-check` (2026-10-23 09:28 IST)

Reviewed against the installed release and the live Gateway. No skill, registry, external account,
or app/ file was installed or edited.

| Item | Evidence |
|---|---|
| Exact revision | Workshop `create` change `08290405-43c2-4a4e-bb3b-03d5c7e30eaa` (`actor:"review"`, 2026-10-23 01:30:52 UTC, session `agent:zero:main`, run `skill-workshop-review:f2de5fef…`). File `backend/.openclaw/agents/zero/agent/workshop-skills/subagent-echo-check/SKILL.md`, 1,141 B, `sha256 f92e4240…`. |
| Source/license | `openclaw-workshop`, `bundled:false`; OpenClaw MIT, no third-party payload. |
| Agent eligibility | `zero` only: 56 entries with the skill; `researcher` and `operator` each list 51 with no match. For zero: `eligible:true`, `modelVisible:true`, `userInvocable:true`, `commandVisible:true`, `blockedByAllowlist:false`, `blockedByAgentFilter:false`, `missing:[]`. |
| Bounded execution | Two live `openclaw agent` turns. First (`agent:zero:be03-skill-verify`, 240 s) read the skill and described `sessions_spawn`, then hit a provider timeout with **no child**. Retry (`agent:zero:be03-skill-verify-2`, 600 s) read the skill, rejected one invalid `taskName` with no child, accepted exactly one researcher child `agent:researcher:subagent:4e34f082-8680-4678-8cd5-4d7182a361f4` (run `b906576f-aeed-492c-b11e-942545b7b14d`), yielded via `sessions_yield`, received the completion event, and answered `SUBAGENT_ECHO_OK` verbatim. Parent status `done`; child transcript contains the user task and the exact reply. The first timeout is provider/run-latency, not a skill defect. |
| Disable/restore lifecycle | `skills.workshop.archive` → change `9f24a241-fb05-44fd-96a4-3f58a3acef26`, version `20261023T035618974Z-archive`; the skill disappeared from `skills list` (55, no match). `skills.workshop.restore` → change `0afecc17-eceb-49d0-a57f-b98df40d4f6e`; back to 56, eligible/model-visible/command-visible, file hash unchanged. `skills.update {skillKey, enabled}` is the config-patch path (`operator.admin`); archive/restore is the native Workshop lifecycle exercised here. |

Acceptance impact: this proves the installed Workshop candidate has a stable revision, is eligible
for the intended agent, runs a bounded delegated workflow, and can be disabled/restored without
content drift. It still is **not** an external skill installed through the admin scope-upgrade
path, so checklist 5 remains open unless the owner/Gemini explicitly re-scopes it. `useCount` was
`2` after the run, consistent with the skill being read by the two turns.

## 3. Memory — built-in index, deliberate FTS-only mode

Live read-only check (`openclaw memory status` with the Gateway state/config env) against
`backend/.openclaw`:

| Field | Value |
|---|---|
| backend | `builtin` (Memory Core) |
| index | 25 files, 32 chunks, `dirty:false` after the setting below |
| provider before change | requested `openai` / `text-embedding-3-small`, no `OPENAI_API_KEY`, index built `fts-only` → identity `mismatched` |
| provider after change | **`none`** (deliberate FTS-only), identity **`valid`** |
| retrieval | FTS **ready**, vector store disabled, embedding cache 0 entries |
| database | `backend/.openclaw/agents/zero/agent/openclaw-agent.sqlite` |

The template and deployed config now contain:

```json
"memory": { "search": { "provider": "none" } }
```

Rationale: FTS-only recall still satisfies "inspectable memory" for the MVP, requires no external
embedding credential, and downloads no model weights (the project forbids model downloads). A
vector provider is a later, visible decision with a cost/quality check. `memory.search` is
`operator.read`; `memory.get` and `memory.status` are `operator.read`; `doctor.memory.status` is
`operator.read` and is the health probe.

Two live observations for the budgets lane:

- **Dreaming is scheduled at 03:00 local by default** (`light`, `rem`, `deep`, each `0 3 * * *`,
  with bounded limits and a 2–30 day lookback). Dreaming is a background model consumer. It is
  acceptable for the MVP but must be disclosed in the UI/budget note; if the owner wants a hard
  cost boundary, this schedule is the first thing to review because it can run without a user
  turn.
- The CLI `openclaw memory search` is a useful scope probe: it searches the same index without the
  Gateway token and confirms that recall is scoped to memory files by default (see the scope note
  below).

### Live recall check — 2026-10-23 (Qoder)

Checked against the live Gateway (status/get via RPC earlier this turn, search via the CLI manager
that runs the same code against the same DB), always passing `agentId` (with three agents
configured, `memory.status`/`memory.search` reject calls without it — the UI must pass it):

| Call | Result |
|---|---|
| `memory.status {agentId:"zero"}` | version 2, provider `memory-core`, `status:"ready"`; 25 files / 32 chunks; FTS enabled+available; identity `valid` |
| `memory.get {agentId:"zero", reference:{providerId:"memory-core", id:"USER.md"}}` | **works** — returns the workspace Markdown with line range and continuation |
| `memory.get` with a chunk id as `reference.id` | rejected: `path is not an allowed Markdown memory file` — `id` is a workspace path for this provider, not an index chunk id |
| `memory.search {agentId:"zero", query:"USER" \| "directive"}` (v1) | **works** — returns `USER.md` matches at the default `minScore` 0.35 |
| `memory.search {agentId:"zero", query:"Zero" \| "delegation"}` | empty **by scope**: those terms exist only in session transcripts, which are indexed but not searched by default (see below) |

### Search scope is memory-only by default — not a defect

The installed source policy defaults `searchSources` to `["memory"]`
(`memory-search-source-policy-zikTNTRB.mjs:2-7`). When remember-across-conversations is on, indexed
`sources` also include `sessions`, so transcripts are indexed but are **not returned by search**
unless they are explicitly configured. Evidence at default settings (CLI, same manager code and
same DB as the Gateway RPC):

- `"USER"` → 2 `USER.md` hits (`score` 1); `"directive"` → `USER.md` hit (`textScore` 0.72).
- `"Zero"` → 0 and `"delegation"` → 0. Direct SQLite confirms those tokens match only
  `source:"sessions"` chunks; `USER` matches `source:"memory"` chunks.
- The earlier "worker-snapshot defect" note was a **bad probe**, not a release defect: that probe
  used a Windows path literal with dropped backslashes (so the worker correctly reported
  `database-missing`) and an incomplete query object. Re-run with the proper request, the worker
  pool returns 10 body + 10 path rows and `hasIndexedChunks:true`. **No restart or memory-core
  reload is needed.**
- Enabling transcript recall is an explicit config decision, not an accepted gap:
  `memory.search.sources: ["memory","sessions"]` (optionally with
  `memory.search.experimental.sessionMemory:true`). Until then the UI must label search as
  "memory files" scope and must not present session transcripts as searchable.
- **Agent tool path, live:** a synthetic embedded agent turn on `agent:zero:be03-memory` asked the
  model to call `memory_search` for `"directive"`. Result: `toolSummary.calls:2`,
  `tools:["memory_search","tool_call"]`, `failures:0`, final text `BE03_MEMORY_OK USER.md`; provider
  `zero-gw/z-ai/glm-5.3-flash`, `runner:"embedded"`. This proves the agent-facing recall tool, not
  only the manager/CLI path.

**No generic edit RPC exists.** The durable source is the agent workspace Markdown (`MEMORY.md`,
an existing `USER.md`, and `memory/*.md`); the index is derived. If the UI needs an editor, it must
be a narrow, file-scoped operation over those documented files with OpenClaw's ownership and
reindex semantics preserved — not a second database and not a full filesystem editor.

## 4. Model routes

`models.list` is authoritative. The deployed route is one provider row (`zero-gw`, NVIDIA NIM
`https://integrate.api.nvidia.com/v1`) with one model, `z-ai/glm-5.3-flash`, used by Lead, Utility
and Operator. `preflight` asserts the single row, the env SecretRef, the first-slash model-ref
parsing, and image input. Do not add a second UI-side catalog or a second provider just to expose
choices; a model picker should read `models.list` and show the route the Gateway actually has.

## 5. Budgets and audit

- **Action budgets** are enforced in the Zero Policy plugin: `maxActionsPerRun` (400),
  `maxInputActionsPerRun` (200), plus always-blocked and high-risk action families. The acceptance
  path remains the isolated desktop because these counters only advance on real tool calls.
- **Audit** is the plugin's bounded `recent` ring (last 10 decisions, with target/action/decision/
  reason/runId/held) plus cumulative `stats`.
- **Usage/cost** (`usage.status`, `usage.cost`, `sessions.usage`, `.timeseries`, `.logs`) is
  `operator.read` and **reporting only**. Do not present it as a hard token/cost limit. A model
  budget would need an enforcement hook at the model-run boundary and a persistence owner; neither
  exists today, so it is deliberately not claimed.

## 6. Team workflow and the BE-02 delegation result

Built-in `sessions_spawn` remains the team mechanism; `TEAM-00` is **not** opened. The app SSE
prototype's own attempt reached `RUN_STARTED` but hit the app's **45 s
`ZERO_AGENT_RUN_TIMEOUT_MS`** before an assistant turn was stored — an app-side prototype
timeout, not a Gateway gap.

The canonical Gateway transcripts prove the workflow itself works. Independently re-verified in
the live agent databases on 2026-10-23:

- Parent `zero` session `609b0f78…` called `sessions_spawn` for `researcher` and received a
  receipt with `childSessionKey` (mode `run`, `expectsCompletionMessage: true`).
- Three `spawn-child` sessions exist under the researcher agent
  (`ab254470…`, `183ed448…`, `91086fa6…`), each with one user and one assistant message.
- Every child returned `RESEARCH_OK` (01:24:00, 01:25:42, 01:26:46 UTC).
- The parent stored completion results verbatim at 01:26:15 and 01:27:00 UTC after the
  `[Subagent Context]` settled events.

So A4/A5 (delegation and child completion) are **proven at the Gateway**. The residual app gap is
only the prototype SSE bridge's synchronous run budget; the native Control UI renders session
updates asynchronously, which is the product path.

The boundary is enforced too: a live researcher turn asking to spawn `operator` was refused with
`agentId is not allowed for sessions_spawn (allowed: none)` and created no child session. The
built-in workflow needs no TEAM-00 addition.

## 7. BE-03 acceptance checklist

| # | Check | Status |
|---|---|---|
| 1 | Built-in skills/memory/usage surfaces enumerated against the installed release | **pass** (this report) |
| 2 | No duplicate skill registry, memory store, transcript store or provider catalog | **pass** by configuration; UI must preserve it |
| 3 | Memory provider is explicit, key-free and index-valid | **pass** — FTS-only, identity `valid` |
| 3b | Recall over the valid index returns matches | **pass** — manager search returns `USER.md` hits (`"USER"`/`"directive"`); a live embedded agent turn called `memory_search` and returned `BE03_MEMORY_OK USER.md` with 0 tool failures. Empty results for session-only terms are the default memory-file scope |
| 4 | Action budgets/audit identified and bounded | **pass** (plugin); live enforcement still CU-01 |
| 5 | One reviewed skill installed through the admin scope-upgrade path | **pass** — senior accepted the verified installed Workshop skill as the reviewed built-in (ChatGPT senior UPDATE, 2026-10-23): "no external registry artifact is required to make BE-03 meaningful." Evidence: §2 — revision `08290405…`, zero-only eligibility, one bounded researcher child returning `SUBAGENT_ECHO_OK`, archive/restore with no content drift. No new skill or registry was installed. |
| 6 | Memory search/read exposed in the single Control UI | **pass for memory scope** — UI-03 accepted: the native Memory-files card passes `agentId`, labels the memory-file scope and shows a scoped empty state (`reports/ui/personalization-ui.md` §Memory, lines 240–243); transcript search remains an explicit owner decision, not a missing implementation |
| 7 | No token/cost enforcement claimed from reporting RPCs | **pass** — stated explicitly |
| 8 | TEAM-00 remains conditional | **pass** — not opened |

## 8. Coordination requests

- **OpenCode:** use the corrected skills methods; treat `skills.install/update` as admin; render
  memory as Gateway-owned read/search with a narrow edit path only if the product needs it. Pass
  `agentId` to every memory method and label the search scope as memory files; session transcripts
  are indexed but not searchable under the current config. Do not add a second
  memory/skill/transcript store. The desktop panel remains the existing Systems/Devices → Desktop
  surface.
- **Backend:** no further config change is required for FTS-only memory search. Enabling
  `sessions` in `memory.search.sources` (transcript recall) or adding a vector provider is a new,
  explicit decision.
- **Senior/owner:** check 5 is closed by the 2026-10-23 senior acceptance of the verified Workshop
  skill; no external artifact is required. Transcript recall (`sessions` in `memory.search.sources`)
  remains an explicit owner config decision.

## 9. Limitations

No external skill was installed. Memory was checked live: `status`, `get` and `search` work; search
is scoped to memory files by default, so session-only terms return empty until transcript search is
explicitly enabled (§3). The skills evidence includes a live bounded invocation and a reversible
archive/restore of the installed Workshop skill (§2), not only an inventory; senior accepted that
skill as the reviewed BE-03 skill on 2026-10-23, so the external-install form is no longer required.
One invocation hit a provider timeout before spawning; the successful retry is the evidence for the
workflow, and the timeout is recorded rather than hidden. The delegation evidence is canonical
transcript verification, not a fresh run: it proves the Gateway workflow, while the new native UI
still has to
render it. Static surfaces and local status are not UI acceptance.
