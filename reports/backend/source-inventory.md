# BE-00 — OpenClaw Source Inventory (Backend)

**Ticket:** BE-00 — Source inventory
**Owner:** DeepSeek Harness (Backend Developer)
**Status:** READY FOR REVIEW
**Date:** 23 October 2026, 03:59 Asia/Calcutta
**Pinned commit (checkout):** `013240515205573248c27ab6b8eec7303f0da1a8` (verified from `upstream/openclaw/.git/refs/heads/main`; matches `reports/source-inventory.md` and `.git/packed-refs` `refs/remotes/origin/main`)
**Upstream version:** `2026.10.6` (`upstream/openclaw/package.json:3`)

> **PIN RECONCILIATION (2026-10-23, after BUILD WINDOW A).** The installed npm artifact `openclaw@2026.10.6`
> embeds `commit: fe06181dc5ecc01cf8904abbfc26925925efefbc` in `dist/build-info.json` — **not** the checkout's
> `0132405…`. The senior confirmed GitHub's official `v2026.10.6` tag also resolves to `fe06181`, so the npm
> artifact matches the released tag while the local sparse checkout is a different commit that carries the same
> version label. Everything in this report was read from **`0132405`**; the runtime we execute is **`fe06181`**.
> The contracts BE-00/BE-02 depend on were re-verified against the installed release — see
> `build-readiness.md` §3.2. No BE-00 conclusion changed.

**Method:** read-only inspection of the sparse checkout at `E:\zero\upstream\openclaw` plus local toolchain probing. **No install, build, package download, network call, or runtime start was performed.** Every capability statement below is either (a) quoted from an upstream doc/source file with `path:line`, or (b) an observed local command result. Nothing here is a live integration result.

**Read this first:** this report establishes *what the pinned source provides and what it costs*. It does **not** prove that the user's model gateway works with it. That is BE-01, which remains blocked on gateway credentials/endpoint.

---

## 1. Verdict in one paragraph

The pinned OpenClaw is a much closer fit to Zero's target architecture than the plan assumed. It already ships (a) a single always-on Gateway process whose one port serves a WebSocket RPC control plane *and* OpenAI-compatible HTTP endpoints, (b) a first-class multi-agent model (`agents.entries`, `bindings`, per-agent model/workspace/skills/tools/sandbox), (c) background sub-agents with spawn/yield/nesting/announce/stop semantics, (d) a Swarm fan-out tool, (e) a per-session goal tool with token budgets and automatic continuation, (f) a bundled-but-disabled **Workboard** plugin with a real task lifecycle and dispatch, (g) a memory plugin slot with two documented backends, (h) a mature skill system with ClawHub install, allowlists, and a workshop, (i) cron automations plus heartbeat monitors, and (j) documented support for being **embedded as a supervised child process** with the Gateway as the only state owner. The three biggest *unknowns* are not capability gaps but verification gaps: the model gateway has never been tested (BE-01), no dependency install has been approved or performed, and the Windows computer-use path is explicitly experimental.

**Consequence for planning:** do not build a custom orchestrator, task board, or mailbox before BE-02. Documented built-ins cover the Lead + Researcher + Operator pattern. The real integration risk has moved to (i) provider-gateway compatibility and (ii) the AG-UI ↔ Gateway WS bridge, which is a protocol translation problem, not a session-data problem.

---

## 2. Verified local environment

| Item | Observed | Evidence |
|---|---|---|
| OS | Windows 10.0.26200, AMD64 | local command |
| Node | `v24.22.1` | `node --version` |
| Node vs OpenClaw requirement | **satisfied**: `>=24.22.1 <25 \|\| >=26.12.1` | `upstream/openclaw/package.json:2478-2479` (`engines.node`) |
| npm | `11.19.1` via `npm.cmd`; `npm.ps1` is **blocked** by PowerShell execution policy | local command |
| pnpm | **not on PATH** (neither `pnpm` nor a shim) | `where pnpm` → not found |
| OpenClaw pinned package manager | `pnpm@12.15.0+sha512.b3951d6d…` | `package.json:2481` |
| `git` | **not on PATH** | `where git` → not found |
| OpenClaw installed locally? | no | `Get-Command openclaw` → empty |
| `upstream/openclaw/node_modules` | absent | `Test-Path` → False |
| Disk free | C: 460.5 GB, E: 400.2 GB | `Get-PSDrive` |
| RAM | 31.8 GB total, 17.9 GB free | `Win32_OperatingSystem` |

### 2.1 Toolchain discrepancies that matter (correction to `reports/source-inventory.md`)

That senior-maintained file records "pnpm currently on PATH: `11.25.0`" and a working Git 2.53.0. **In this shell, in this session, neither `git` nor `pnpm` is on PATH**, and `npm.ps1` cannot run because script execution is disabled. This is an environment fact, not a contradiction of the earlier capture — PATH may differ per shell/profile, and the earlier capture presumably used a shell that had them. But it is a real blocker to note:

- **Any BE-02 run needs a package manager decision.** OpenClaw is not a "run from source with a global CLI" product in this checkout: there is no `node_modules`, `dist/`, or installed binary. `node openclaw.mjs` would need built `dist/` output.
- Corepack is present at `C:\Program Files\nodejs\corepack.cmd`, so `corepack enable pnpm` → `pnpm@12.15.0` is the likely correct path (honours `packageManager`). **This is not done** — installing/activating a package manager is a heavy-change class under D-006 and needs senior coordination.
- `git` absence also means I could not run `git status` / `git log` / `git sparse-checkout list`; I verified the pin and sparse rules by reading `.git/HEAD`, `.git/refs/heads/main`, `.git/packed-refs`, and `.git/info/sparse-checkout` directly. That is equivalent for pin verification but I could not prove the worktree is unmodified relative to the commit.

**Ask:** treat "package manager + dependency install" as one explicit, announced, single-job step, not an incidental side effect of BE-02. See §8.

---

## 3. Checkout scope: what is actually on disk

From `.git/info/sparse-checkout` (read directly):

```text
/* → !/*/ → /docs/ → !/docs/*/ → /extensions/ → !/extensions/*/ → /packages/ → !/packages/*/ → /src/ → !/src/*/
/docs/gateway/ /docs/nodes/ /docs/plugins/ /docs/providers/ /docs/security/ /docs/tools/
/extensions/cua-computer/ /extensions/litellm/ /extensions/openrouter/
/packages/gateway-client/ /packages/gateway-protocol/ /packages/plugin-sdk/
/src/agents/ /src/gateway/ /src/plugins/ /src/provider-runtime/ /src/skills/
/ui/
```

**Present:** the six doc trees above, 3 of ~101 bundled extensions, 3 workspace packages, 6 `src/` subtrees, and `ui/`.

**Absent, and it changes how you read this report:**

| Missing | Why it matters |
|---|---|
| `docs/concepts/**` | `docs/gateway/config-agents.md:108-110` and `docs/tools/subagents.md:163-167` link to `/concepts/model-providers`, `/concepts/multi-agent`, `/concepts/parallel-specialist-lanes`, `/concepts/main-session`, `/concepts/memory`, `/concepts/agent-loop`. **These are the pages most likely to describe the intended Lead+specialist pattern.** They are one sparse expansion away, not a download of new history. |
| `docs/cli/**`, `docs/automation/**`, `docs/install/**`, `docs/reference/**`, `docs/help/**`, `docs/web/**` | CLI reference, cron-job detail, install/update contract, database schemas, test suites, Control UI. Referenced throughout the docs I did read. |
| `skills/`, `custodian-skills/` | The bundled skill set is not on disk; I could not count or inspect shipped skills. |
| plugin source for `workboard`, `logbook`, `team-reports`, `memory-core`, `memory-wiki`, `memory-lancedb` | `extensions/` contains only `cua-computer`, `litellm`, `openrouter`. Everything I state about those plugins is **documentation-derived, not source-derived**. This is the single biggest evidence limitation in this report. |
| `src/tools/**`, `src/memory/**`, `src/cron/**` (not in sparse list) | Tool implementations, memory engine, scheduler internals are not inspectable. |

I did **not** expand the sparse checkout. Per D-006 and the brief, that requires approval because it is a network + disk operation. If the senior developer wants the Lead-pattern evidence, the minimal add is `docs/concepts/`.

---

## 4. Capability inventory

### 4.1 Runtime shape and the embedding contract

One always-on process owns routing, the control plane, and channel connections. A single multiplexed port serves WebSocket RPC, the HTTP APIs, plugin routes, and the Control UI (`docs/gateway/index.md:69-76`). Default bind is `loopback`; auth is required by default (`:76`).

**The most important find for Zero's architecture** is `docs/gateway/embedding.md` — upstream explicitly supports Zero's intended shape:

- supervise the installed `openclaw` executable as a child process;
- use the Gateway WS protocol as the control plane;
- treat the child as a replaceable runtime (`embedding.md:10-13`);
- an environment preset exists for exactly this (`OPENCLAW_NO_RESPAWN`, `OPENCLAW_SKIP_CHANNELS`, `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`, `OPENCLAW_DISABLE_BONJOUR`) (`:32-42, 50-55`);
- readiness = `connect.challenge` → `connect` → `hello-ok`, not a log scrape (`:91-99`);
- invalid config = exit code `78`, branch on the code (`:72-84`);
- **"Use RPC instead of state files"** — do not read/mutate `~/.openclaw` SQLite, transcripts, or caches for app features (`:128-148`);
- **"Install; do not flatten"** — the package is not a single-file vendoring target (`:150-160`).

This directly validates MASTER_PLAN's "Zero adapter/runtime" box and gives it a supported contract instead of an invented one. It also means the Zero UI must talk to the Gateway, and must not reach into OpenClaw's state directory. That is a constraint worth putting in `DECISIONS.md`.

### 4.2 Gateway surfaces available to a Zero frontend

| Surface | What it gives Zero | Evidence |
|---|---|---|
| WebSocket RPC | full control plane: sessions, chat, agents, models, plugins, approvals, nodes, cron | `docs/gateway/protocol.md:24-27`; `docs/gateway/index.md:398-415` |
| `POST /v1/chat/completions` | OpenAI-compatible chat; `model` field is an **agent target** (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), not a provider model id | `docs/gateway/openai-http-api.md:78-98` |
| `/v1/models`, `/v1/models/{id}`, `/v1/embeddings`, `/v1/responses` | discovery + embeddings + Responses API | `docs/gateway/index.md:110-128` |
| `POST /tools/invoke` | invoke one tool directly over HTTP | `docs/gateway/index.md:72, 98` |
| Control UI | bundled operator UI (Solid) | `docs/gateway/index.md:73-74`; `ui/` on disk |

Two facts that materially simplify the UI plan:

1. **Session routing is a header, not a schema change.** `x-openclaw-session-key` routes to an explicit session, `x-openclaw-agent-id` selects the agent, and an OpenAI `user` string derives a *stable* session key so a conversation thread can be resumed (`openai-http-api.md:89-96, 106-110`). So a Zero thread → OpenClaw session mapping can start as "stable `user` value per thread" with zero server work, and only later move to explicit application-owned keys.
2. **The endpoint is stateless by default** — each call without `user` gets a fresh session (`:108`). That is a trap for a chat UI: forget the `user` string and every turn is a new conversation.

Security caveat that must be recorded: this endpoint is **full operator access**, not a narrow per-user scope (`openai-http-api.md:39-46`). Loopback/private only, never public ingress.

### 4.3 Gateway protocol and event families (input for the AG-UI bridge)

Handshake: first client frame must be `connect`; Gateway replies `hello-ok` with a `snapshot` (presence, health, stateVersion, uptimeMs) and `policy` limits; requests are `req(method, params)` → `res(ok/payload|error)` (`docs/gateway/index.md:398-408`). Agent runs are **two-stage**: immediate `status:"accepted"` ack, then a final `status:"ok"|"error"` with streamed `agent` events between (`:410-413`).

Event families relevant to an AG-UI translation (`docs/gateway/protocol/rpc-bootstrap-and-events.md:238-357`):

- `chat` — display-projected transcript deltas (`state:"delta"`, `deltaText`; first frame carries a full `message` snapshot; replacements set `replace=true`).
- `agent` — assistant/tool/usage/lifecycle streams (`data.delta`, optional authoritative `data.text`, `data.replace`).
- `session.message` / `session.operation` / `session.tool` — transcript, in-flight operation, tool events for a subscribed session.
- `sessions.changed` — roster metadata invalidation.
- `session.approval`, `session.observer`, `session.narration`, `socket.drain` — approvals, live headline digest, paced narration, reset/delete notices.

Two upstream warnings that will otherwise cost OpenCode a day each:

- **Do not consume `chat` and `agent` text into one accumulator** — it duplicates output. Pick one text projection per display (`:272-292`). A client that renders from `chat` only should advertise the `chat-only-assistant-text` connect capability.
- **Events are not replayed.** On a sequence gap, refresh state (`health`, `system-presence`) rather than waiting for a backfill (`docs/gateway/index.md:432-434`).

### 4.4 Providers and the "one gateway, many models" requirement

This is the area where the pinned source most directly satisfies a product constraint.

- 68 documented provider entries (`docs/providers/index.md:27-94`), each addressed as `provider/model`.
- Aggregator/gateway providers already exist as first-class routes: **LiteLLM** (`docs/providers/litellm.md`), **ClawRouter** (`docs/providers/clawrouter.md`), **Vercel AI Gateway**, **Cloudflare AI Gateway**, **Bifrost**, **Neon AI Gateway** (`docs/providers/index.md:37-38, 55, 64, 88`).
- Any provider entry accepts a `baseUrl` override (`models.providers.<provider>.baseUrl`), which is how a custom OpenAI-compatible endpoint is pointed at — pattern confirmed across providers, e.g. `docs/providers/clawrouter.md:45, 146, 201`.
- Model selection is rich and config-driven: `agents.defaults.model` as string or `{primary, fallbacks}`; separate slots for `utilityModel`, `imageModel`, `pdfModel`, `mediaModels.{image,video,music}`; per-model `params`; aliases via `agents.defaults.models.<provider/model>.alias`; `modelPolicy.allow` as an override allowlist (`docs/gateway/config-agents/models.md:14-62, 123-128`).
- Fallback chains get a fresh timeout budget per attempt (`models.md:64`).

**Conclusion:** the "one configured gateway, multiple models by role" requirement is a configuration problem in OpenClaw, not a code problem — *provided* the user's gateway speaks an OpenAI-compatible chat-completions dialect. That is exactly what BE-01 must prove and what is currently unknown.

### 4.5 Agents and specialist profiles

`agents.entries.<agentId>` is the stable identity, with per-agent: `name`, `workspace`, `cwd`, `model`/`utilityModel`, `params`, `skills` (allowlist), `identity.{name,theme,emoji,avatar}`, `groupChat.mentionPatterns`, `sandbox`, `runtime` (incl. `acp`), `subagents.*`, `tools.{profile,allow,deny,elevated}`, `modelPolicy` (`docs/gateway/config-agents/entries-and-multi-agent.md:24-99`).

- Multi-agent fleets stamp `agents.ownership: "explicit"` and lose the implicit default — every surface then needs a binding or explicit `agentId` (`docs/gateway/config-agents.md:14`).
- `bindings[]` routes a channel/account/peer to an agent with a fixed, documented match order (`entries-and-multi-agent.md:103-146`).
- Sub-agent limits are per-agent and bounded: `allowAgents` (`["*"]` = any), `requireAgentId`, `maxConcurrent` (default 8), `maxChildrenPerAgent` (default 5), `maxSpawnDepth` 1–5 (default 5), `archiveAfterMinutes` (60) (`:92-99`).
- Three documented per-agent access profiles: full access (sandbox off), read-only tools+workspace, messaging-only/no filesystem (`:148-238`).

**Direct mapping for BE-02:** a Lead agent + a `researcher` + an `operator` entry, each with its own `workspace`, `skills`, `model`, and `tools`, is *configuration*, plus `subagents.allowAgents` edges. No new code.

### 4.6 Sessions

- Session identity is structured, not a bare UUID: sub-agent sessions are `agent:<agentId>:subagent:<uuid>` (`docs/tools/subagents.md:13-15`); workboard uses `agent:<agentId>:subagent:workboard-<boardId>-<cardId>` (`docs/plugins/workboard.md:557-562`); the HTTP API rejects reserved namespaces `subagent:`, `cron:`, `acp:` (`openai-http-api.md:95`).
- Grouping/scoping config: `session.scope`, `dmScope`, `groupScope`, `identityLinks`, reset policies (daily/idle, per type, per channel, triggers), `threadBindings`, `sharing`, `sendPolicy` (`docs/gateway/config-agents/sessions.md:48-102`).
- Maintenance is explicit and bounded: `pruneAfter`, `archiveDashboardAfter`, `maxEntries`, `preserveRecent`, `resetArchiveRetention`, `maxDiskBytes` (default `10gb`), `highWaterBytes`, optional compressed cold storage (`:72-86`).
- RPC surface for a UI: `sessions.list`, `sessions.patch`, `sessions.delete`, `chat.history`, `usage.cost`, `sessions.usage` (`docs/gateway/embedding.md:133-139`).
- **Unresolved detail:** the config example still shows `session.store: "~/.openclaw/agents/{agentId}/sessions/sessions.json"` (`sessions.md:72`) while other pages say transcripts live in SQLite and cron prunes "SQLite session rows" (`docs/gateway/config-automation.md:35`) and auth store lives in `state/openclaw.sqlite` (`docs/gateway/config-agents.md:27`). The authoritative schema page (`docs/reference/database-schemas.md`) is outside the checkout. **Do not assume either layout in Zero code — use RPC, which is what `embedding.md:128-148` mandates anyway.** Flag to resolve at BE-02 runtime.

### 4.7 Sub-agents and orchestration — the "do not build a coordinator" evidence

| Mechanism | What it already does | Evidence |
|---|---|---|
| `sessions_spawn` / `sessions_yield` / `subagents` | background runs in their own sessions, non-blocking push-based completion, announce chain, per-call `task`, `agentId`, `cwd`, `model`, `thinking`, `context` (`new`/`fork`), `sandbox`, `visible`, `thread`, `runTimeoutSeconds`, `cleanup` | `docs/tools/subagents.md:12-45`; `docs/tools/subagents/tool-reference.md` |
| Nesting + orchestration | depth limits, announce chain, tool policy by depth, per-agent spawn limit, cascade stop | `docs/tools/subagents/nesting.md` |
| Concurrency/recovery/stopping | documented concurrency, restart recovery, child-tree stop | `docs/tools/subagents/operations.md` |
| Swarm | large parallel fan-out (≈5+ similar children), `outputSchema` structured results, `groupId` batches, collector children, limits (`maxConcurrent` default 32), `Promise.all`-style control flow via Code Mode `agents.run` | `docs/tools/swarm.md:21-60, 624-631` |
| Goals | per-session objective, optional token budget → `budget_limited`, three tools (`get_goal`, `create_goal`, `update_goal`), context line injected each turn, automatic continuation | `docs/tools/goal.md:124-183` |
| Workboard | Kanban task lifecycle + dispatch to agents | §4.8 |
| Agent-to-agent send | `openclaw ... agent send` + `sessions_send` with per-agent send-only ACLs | `docs/tools/agent-send.md`; `entries-and-multi-agent.md:93` |

**This is the direct answer to TEAM-00's precondition.** The DEV brief says to add a custom task board/mailbox "only if built-in subagents fail acceptance". On documentation evidence they have not failed anything yet — they have not been *tried*. TEAM-00 should stay `NOT STARTED` until BE-02 runs the Lead→Researcher→Operator workflow and a specific built-in behavior fails.

### 4.8 Workboard (bundled, disabled by default) — the built-in task board

Documentation-derived only; plugin source is not in this checkout.

- **Purpose, scoped deliberately small:** "tracks local operating work for one OpenClaw Gateway. It is not a replacement for GitHub Issues, Linear, Jira" (`docs/plugins/workboard.md:18-20`). Bundled but disabled by default (`:24`).
- **Enable:** Control UI → Plugins → Workboard, or `openclaw plugins enable workboard` (`:26-45`); config is only `plugins.entries.workboard.enabled` (`:52-66`); must be in `plugins.allow` if that list is used (`:824`).
- **Status model:** `triage, backlog, todo, scheduled, ready, running, review, blocked, done` (`:302`), with dependency promotion (children stay `todo` until all parents `done` → `ready`), claim → `running`, unblock → `todo` (`:433-449`).
- **Dispatch:** Gateway-local, no OS processes; one pass promotes dependency-ready cards, expires stale claims, claims a batch, and starts worker runs through the **Gateway subagent runtime** (`:499-506`); ≤3 workers/pass, priority→position→creation order, one card per owner/agent, skips owners already running/reviewing (`:549-555`).
- **Card fields:** `status`, `priority` (low/normal/high/urgent), `labels`, `agentId`, linked task/run/session refs, `execution` (engine, mode, model, session, run id, status), plus attempts/comments/links/proof/artifacts/attachments/claims/proof metadata (`:300-320`).
- **Agent tools:** ~30 `workboard_*` tools (list/read/create/link/claim/heartbeat/release/complete/block/comment/proof/unblock/move/dispatch/promote/reassign/reclaim, attachments, worker logs, boards, stats, notify subscriptions, decompose/specify).
- **Session sync:** card ↔ session link with automatic state advance (active→running, completed→review, failed/killed/timeout→blocked), manual `review`/`blocked`/`done` stops auto-sync, one-minute Gateway-owned recovery sweep (`:628-693`).
- **Authorization:** `workboard.*` RPCs; mutating methods need `operator.write`, none need `operator.admin`; claim tokens gate cross-agent mutation (`:754-778`).
- **External surface:** Gateway RPC + Control UI only. **No documented REST task API** (`:754-762`) — relevant to any Zero UI that wants cards.
- **Cost/limits:** card tools require the agent to opt in via `tools.alsoAllow: ["workboard"]` (`:405-426`); CLI mutations need a stopped Gateway (`:604-608`).

### 4.9 Memory

Nothing in the core is a memory engine: the memory backend is a **plugin slot**, `plugins.slots.memory`, default `memory-core` (`docs/plugins/manifest.md:453`), described as the "default built-in memory backend" (`docs/plugins/memory-lancedb.md:16`).

| Backend | Shape | Storage | Agent tools | Dependency cost |
|---|---|---|---|---|
| `memory-core` (bundled, default) | slot holder; recall/promotion/indexing | — (no feature page in this checkout; `/concepts/memory` absent) | — | included |
| `memory-wiki` (bundled) | compiles durable knowledge into a markdown wiki with claims/evidence/provenance; does not replace recall | `<state-dir>/wiki/main` markdown + compiled snapshot in shared SQLite | `wiki_status/search/get/apply/lint` + shared corpus for `memory_search`/`memory_get` | SQLite only; optional Obsidian CLI |
| `memory-lancedb` (external, npm) | LanceDB vector store with auto-recall/auto-capture | `~/.openclaw/memory/lancedb` (S3-compatible optional) | `memory_recall` / `memory_store` / `memory_forget` | native `@lancedb/lancedb-*` packages + an embedding provider/API key |

Scoping: wiki `vault.scope: global|agent` (a same-process knowledge boundary, *not* an OS boundary); LanceDB one table with a per-row agent owner enforced before ranking, legacy rows migrated by `openclaw doctor --fix`. Token behavior: wiki digest injection is opt-in/off by default; LanceDB recall is bounded (`recallMaxChars` default 1000) with ≤3 auto-captures per turn.

**Zero-relevant gap:** the product needs memory the user can *inspect, edit, and delete*. LanceDB documents store/recall/forget only — **no documented update/edit path**. Wiki editing is half-managed: only `<!-- openclaw:human:start/end -->` blocks survive regeneration. So "inspectable memory" is a BE-03 UI/affordance problem on top of supported storage, not a new engine.

### 4.10 Skills

- Format: directory with `SKILL.md`; required frontmatter `name`, `description`; markdown body (`docs/tools/skills.md:437-441`); agent-skills spec, `{baseDir}` substitution, optional keys (`user-invocable`, `disable-model-invocation`, `command-dispatch`, `command-tool`, `command-arg-mode`, `homepage`) (`:450-489`). Source exists on disk: `src/skills/{config,discovery,library,lifecycle,loading,runtime,security,workshop,test-support}`.
- Precedence (highest first): `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `<state-dir>/skills` → workshop per-agent → bundled/custodian → `skills.load.extraDirs` + plugin skills (`:39-48`); same name → highest source wins.
- Per-agent: `agents.entries.*.skills` **replaces** `agents.defaults.skills` rather than merging; `[]` = none (`:230-262`, `docs/tools/skills-config.md:341-351`).
- Enable/disable: `skills.entries.<name>.enabled: false`, with per-skill `apiKey`/`env`/`config` (`:664-719`).
- Install: `openclaw skills install @owner/slug`, `skills-sh:`, `git:owner/repo@ref`, `./local --as`, `--global`; default target is workspace `skills/`; Git/local installs are not refreshable by `skills update` (`:333-367`). Install policy hook: `security.installPolicy` runs an operator command after staging and must emit `allow|warn|block` (`docs/tools/skills-config.md:99-104, 176-212`).
- Provenance: ClawHub installs track `.clawhub/lock.json` + per-skill `.clawhub/origin.json` (`registry, slug, installedVersion, installedAt`) (`:369-373`); managed-library revisions are content hashes over all files stored in `state/openclaw.sqlite` + `skill-library/<id>/revisions/<hash>/` (`:181-216`). **No license field anywhere.**
- Workshop: the agent can save/update its own skills under `<state-dir>/agents/<agentId>/agent/workshop-skills`, each change applied immediately, announced, with the prior version retained for undo (`:314-321`); autonomy via `skills.workshop.autonomous.mode` (default `auto`).
- Security: skills are instructions, never executed by the loader; capability comes from tools the body invokes; treated as untrusted code with realpath containment; secret injection is host-process-only, not sandboxed; allowlists are not a shell boundary (`:399-431, 923`).
- Context cost: compact XML block, roughly base overhead + ~97 chars per skill, with `skills.limits.maxSkillsPromptChars` degradation (identity-only, then drop descriptions) and `skills_search`/`skills_read` for omitted ones (`:937-956, 853-877`).

**Zero-relevant gap:** no license/author metadata and no version for Git/local installs → Zero must add the license/version ledger the product requires (BE-03), and must not bulk-import.

### 4.11 Plugins

- 101 bundled extension names are enumerated in `package.json` (verified by extracting `!dist/extensions/<name>/**`), spanning providers (bedrock, deepseek, groq, mistral, qwen, zai, …), channels (discord, slack, whatsapp, signal, telegram-family, …), tools (brave, exa, tavily, firecrawl, diffs), memory (`memory-lancedb`), media, QA, and `team-reports`.
- Only 3 are on disk (`cua-computer`, `litellm`, `openrouter`).
- Management surface: Control UI plugins page, capability consent, install/update/uninstall, `openclaw plugins enable|inspect|install` (`docs/plugins/manage-plugins.md:100-453`).
- SDK is a real, documented public boundary: `packages/plugin-sdk` on disk; `docs/plugins/sdk-*.md`; AGENTS.md rule "Plugins use documented `openclaw/plugin-sdk/*` contracts … never core internals".
- Exclusive plugin kinds are slot-based (`plugins.slots.memory`, `plugins.slots.contextEngine`) (`docs/plugins/manifest.md:453`).

**Reuse implication:** Zero's own additions should be a plugin or an external adapter, in that order — consistent with DEV brief §"Code reuse/style".

### 4.12 Scheduled work

- **Cron automations** under a strict key set: `cron.enabled`, `skipMissedJobs`, `triggers`, `webhookToken`, `webhookSsrfPolicy`, `sessionRetention`, `failureAlert` (`docs/gateway/config-automation.md:14-46`). Failure alerts support `after` consecutive failures, `cooldownMs`, announce vs webhook delivery (`:48-86`). Terminal run history retained 7 days (`:36`). Full automation docs (`docs/automation/cron-jobs`) are outside the checkout.
- **Heartbeat** monitors with scheduled checks, quiet results, run history, and immediate follow-ups (`docs/gateway/heartbeat.md`), plus per-agent `agents.defaults.heartbeat` and a system agent (`docs/gateway/config-agents/heartbeat-compaction-and-streaming.md`).
- **Goal continuation** is a fourth, session-scoped "keep working" mechanism (`docs/tools/goal.md:183`).

Zero's "scheduled responsibilities" (Gate 3) therefore has a supported substrate; the work is UI + policy, not mechanics.

### 4.13 Windows specifics (backend-side facts only — detail belongs to Qoder/CU-00)

- Windows gateway supervision uses a **Scheduled Task** `OpenClaw Gateway` (or `OpenClaw Gateway (<profile>)`), with a Startup-folder fallback if task creation is denied (`docs/gateway/index.md:324-338`).
- Computer use on Windows/Linux is **explicitly experimental**, via the bundled `cua-computer` plugin, in-process CUA Driver SDK (no daemon, no MCP), enabled by `openclaw plugins enable cua-computer` + `openclaw doctor --lint --only cua-computer/driver-artifacts`, and requires `openclaw node run` **from the interactive desktop session** (`docs/nodes/computer-use.md:208-228`).
- Documented Windows/Linux limitations: primary display only; `hold_key`, `left_mouse_down`, `left_mouse_up` unavailable; modifier-held clicks/scroll/drag rejected; digit and punctuation keys rejected (send via `type`) (`:242`).
- The agent-facing tool is `computer` (`target: gateway|node`), one action per call, with `screenshot`→`frameId` binding for coordinate actions (`:72-82`); node command pair is `computer.act` + `screen.snapshot` (`:252-264`).

### 4.14 Permissions, approvals, and Zero's "no per-action prompt" preference

Session permission modes are exactly the knob Zero needs (`docs/gateway/permission-modes.md:12-29`):

| Mode | Filesystem | Exec reviewer |
|---|---|---|
| `read-only` | reads under session root, mutation tools omitted | none, exec denied |
| `guarded` | read/write under session root | human after allowlist fast path |
| `workspace` | read/write under session root | LLM review: allow/deny/ask human |
| `full` | unrestricted | none |

`full` requires `operator.admin`; the other modes require `operator.write`. New sessions inherit global/per-agent policy, and the default without settings or sandboxing is full access (`:29-43`).

**This is how Zero gets "full control, no per-action approval" without inventing a gate:** put the Operator agent's sessions in `full` inside the designated environment, and rely on the separate **workspace root + sandbox boundary** (`agents.defaults.sandbox`, `agents.entries.*.sandbox`) as the real containment — which is also D-003's intent. It composes with tool policy (`tools.profile/allow/deny`) and exec approvals as distinct layers (`docs/gateway/sandbox-vs-tool-policy-vs-elevated.md`).

### 4.15 Audit and cost

- Metadata-only audit ledger with a documented privacy model, retention/migration, and query RPCs (`docs/gateway/audit.md:379-611`; protocol `docs/gateway/protocol/ledgers.md`).
- Cost/usage reads exist as RPC (`usage.cost`, `sessions.usage`) (`docs/gateway/embedding.md:133-139`), and plugin-SDK helpers exist for model catalog pricing and provider usage (`package.json` exports `plugin-sdk/model-catalog-pricing`, `plugin-sdk/provider-usage`).

Together these cover MASTER_PLAN's "bounded API/action budgets and basic local audit" substrate; the Zero-specific policy layer (limits per agent/day) is still ours.

---

## 5. Gap analysis against the Zero MVP

Legend: **BUILT-IN** = exists, configuration only; **ADAPTER** = exists but needs Zero glue; **BUILD** = Zero must add.

| MVP requirement (MASTER_PLAN §5) | Status | Note |
|---|---|---|
| Private local app + one gateway endpoint | **ADAPTER** | Gateway + provider `baseUrl`; unproven against the user's gateway (BE-01) |
| Chat with streaming | **ADAPTER** | `chat`/`agent` event families; must pick one text projection |
| Sessions / resume | **ADAPTER** | `sessions.*` RPC; thread→session via stable `user` or `x-openclaw-session-key` |
| Stop / cancel | **BUILD (thin)** | run lifecycle RPC exists; a product-level STOP ALL needs a Zero contract |
| Useful tool activity | **ADAPTER** | `session.tool` events |
| Lead + Researcher + Operator | **BUILT-IN** | `agents.entries` + `subagents.allowAgents` |
| Inspect/edit skills, enable/disable, provenance | **ADAPTER + BUILD** | install/allowlist built-in; **license/version ledger is ours** |
| Memory inspect/edit/delete | **ADAPTER + BUILD** | storage exists; **no edit path for LanceDB**, half-managed wiki edits |
| Computer use in designated env | **ADAPTER (experimental)** | Windows path documented as experimental; Qoder's lane |
| Bounded budgets + local audit | **BUILT-IN (substrate)** | goal token budgets, `usage.cost`, audit ledger; per-day policy is ours |
| Persistent task board / mailbox (later) | **BUILT-IN, unused** | Workboard + `sessions_send`; no REST surface |
| AG-UI ↔ Gateway bridge | **BUILD** | genuinely ours; a protocol translation, not a storage rewrite |

**Bottom line:** of the MVP list, only the AG-UI bridge and a small set of product-level controls are genuinely Zero-built. Everything else is configuration or adapters — which is exactly what MASTER_PLAN's "reuse first" principle predicted, now with citations.

---

## 6. What this changes about the plan

1. **BE-02's shape is confirmed as configuration-first.** Agent IDs, session mapping, and provider config shape can be published as concrete JSON5 built from documented keys (`entries-and-multi-agent.md:24-99`, `models.md:14-62`) instead of designed from scratch.
2. **The Zero runtime should supervise, not embed.** `embedding.md` is the sanctioned integration contract; D-004's adapter gets a documented target.
3. **The UI bridge is the critical path.** The Gateway exposes both a rich WS RPC/event surface and an OpenAI-compatible HTTP surface. For AG-UI, WS gives events but needs translation; HTTP gives compatibility but hides events. This is a real design decision for OpenCode, and it belongs in `DECISIONS.md`, not in code.
4. **Windows computer use is the highest-uncertainty MVP item**, above the gateway. It is labelled experimental upstream, needs an interactive desktop session, and has documented action gaps.
5. **Two sparse-checkout additions would materially improve the next ticket's evidence** (`docs/concepts/`, `docs/reference/database-schemas.md`) — small, but network operations that need approval.

---

## 7. Recommendations to the Senior Developer (no action taken)

1. **Accept BE-00 as documentation-level capability inventory.** Explicitly note it is not a live proof.
2. **Keep TEAM-00 blocked.** Built-ins (sub-agents, swarm, goals, workboard, agent-send) cover the documented need; nothing has failed yet. Evidence: §4.7–4.8.
3. **Add two constraints to `DECISIONS.md`** (proposed here, not edited):
   - Zero talks to OpenClaw only through Gateway RPC/HTTP; never reads or mutates OpenClaw state files (per `embedding.md:128-148`).
   - Zero's Operator agent uses session permission mode `full` inside the designated environment, with sandbox/workspace root as the containment boundary (per `permission-modes.md:12-43`).
4. **Treat the package-manager + install step as one announced, single, approved job** (§2.1) — it is the gate between "documented" and "proven".
5. **Give OpenCode the bridge facts** in §4.2/§4.3 rather than letting them rediscover the two text-stream and no-replay traps.

---

## 8. Blockers and coordination asks

| # | Ask | Owner | Blocking |
|---|---|---|---|
| 1 | Gateway product name + base URL + auth style, and an approved way to put the key in the host secret store — **never in chat/report/config** | User / Senior | BE-01 |
| 2 | Approval + window for: activate pnpm 12.15.0 (corepack) and install dependencies for `upstream/openclaw` — one job, announced, not overlapping Qoder/OpenCode | Senior | BE-02, any live proof |
| 3 | Approval to add `docs/concepts/` (+ `docs/reference/database-schemas.md`) to the sparse checkout | Senior | Better BE-02 evidence; not blocking |
| 4 | Decision on the bridge transport (WS RPC vs OpenAI-compatible HTTP vs hybrid) — affects UI-01/UI-02 | Senior + OpenCode | UI work |

I have posted asks 1–3 in `AGENT_CHAT.txt` without any credential material.

---

## 9. Limitations of this report

- **No live execution.** Nothing was installed, started, or called. All protocol/behavior claims are documentation-derived; documentation can lag or describe options not enabled in this build.
- **No source inspection for the plugins that matter most** (`workboard`, `logbook`, `team-reports`, `memory-core`, `memory-wiki`, `memory-lancedb`) — those `extensions/` trees are not in the sparse checkout. Their sections are doc-derived and should be re-verified against source when the plugin is first enabled.
- **No `src/tools`, `src/memory`, `src/cron` on disk**, so tool-level and scheduler-level internals are unverified.
- **Pin verified by files, not by `git`** (git absent from PATH): I confirmed `refs/heads/main` = the recorded commit, but I could not prove the worktree is clean vs. that commit.
- **`docs/concepts/**` absent** — the pages describing multi-agent/parallel-specialist/memory *intent* were not readable. This is the largest documentation blind spot for the Lead+specialist design.
- **No code was written and no upstream file was modified.** `upstream/` remains read-only.

---

## 10. Evidence index (commands actually run)

```powershell
# pin + sparse scope (read directly, since git is absent)
Get-Content E:\zero\upstream\openclaw\.git\HEAD                       # ref: refs/heads/main
Get-Content E:\zero\upstream\openclaw\.git\refs\heads\main            # 013240515205573248c27ab6b8eec7303f0da1a8
Get-Content E:\zero\upstream\openclaw\.git\packed-refs                # origin/main = same commit
Get-Content E:\zero\upstream\openclaw\.git\info\sparse-checkout
Get-ChildItem E:\zero\upstream\openclaw\extensions -Directory         # cua-computer, litellm, openrouter
Get-ChildItem E:\zero\upstream\openclaw\packages  -Directory          # gateway-client, gateway-protocol, plugin-sdk

# toolchain
node --version                                                        # v24.22.1
cmd /c "npm --version"                                                # 11.19.1 (npm.ps1 blocked by policy)
where pnpm ; where git                                                # not found
Test-Path E:\zero\upstream\openclaw\node_modules                      # False
Get-CimInstance Win32_OperatingSystem                                 # 31.8 GB RAM, 17.9 GB free

# docs read (all under E:\zero\upstream\openclaw\)
#   docs/gateway/index.md, embedding.md, protocol.md, config-agents.md,
#   config-agents/{entries-and-multi-agent,models,sessions}.md,
#   config-automation.md, openai-http-api.md (§23-172), protocol/rpc-methods.md,
#   protocol/rpc-bootstrap-and-events.md (§238-357), permission-modes.md,
#   docs/providers/{index,models}.md,
#   docs/tools/{subagents,swarm,goal}.md, docs/tools/subagents/* (index),
#   docs/nodes/computer-use.md (§23-82, §205-264),
#   docs/plugins/{workboard,team-reports,logbook,manifest,manage-plugins}.md,
#   docs/plugins/{memory-wiki,memory-lancedb}.md, docs/tools/{skills,skills-config,
#   self-learning,creating-skills}.md
```

**Files created by this ticket:** `reports/backend/source-inventory.md` (this file).
**Files modified by this ticket:** `TASK_BOARD.md` (BE-00 row only), `AGENT_CHAT.txt` (appended only).
**Upstream files modified:** none.
