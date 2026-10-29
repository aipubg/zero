# BE-02 — Minimal backend prototype plan (Lead / Researcher / Operator)

**Ticket:** BE-02 — Prepare minimal Lead/Researcher/Operator configuration plan; live setup after gateway access and install window
**Owner:** DeepSeek Harness (Backend Developer)
**Status:** IN PROGRESS — offline plan complete; live setup blocked
**Date:** 23 October 2026, 04:25 Asia/Calcutta
**Inputs:** `reports/backend/source-inventory.md` (BE-00, accepted), pinned OpenClaw `0132405` / `v2026.10.6`, D-002, D-003, D-006, D-007
**Method:** documentation/source read-only. **No install, no Corepack activation, no Gateway started, no config written, no gateway key present or requested.** Everything below is a PROPOSED configuration, not a result.

---

## 0. Scope discipline

This document does what BE-02 can do without the two missing owner inputs:

| BE-02 sub-goal | Status here |
|---|---|
| Publish proposed agent IDs | ✅ §2 |
| Publish per-agent profile config | ✅ §3 |
| Publish provider config shape | ✅ §4 |
| Publish session mapping | ✅ §5 |
| Publish event needs for the UI | ✅ §6 |
| Answer the computer-tool placement / hold question | ✅ §7 |
| Publish install + run plan with resource estimate | ✅ §8 |
| **Live setup and a working run** | ❌ blocked: no gateway endpoint/auth, no approved install window |

I did **not** touch `upstream/openclaw` (read-only), another owner's files, or `DECISIONS.md`.

---

## 1. Design constraints taken from the accepted decisions

- One user, one assistant-facing surface, a small backend team (MASTER_PLAN §5).
- One configured model gateway; multiple models only where verified (D-002).
- Full control inside the designated Zero environment, with visible screen, global stop, recovery; **no per-action approval prompts for ordinary actions** (D-003, PROJECT_MEMORY).
- Reuse OpenClaw mechanisms; prefer a plugin or adapter over patching upstream (D-001, D-007).
- Low-resource: one heavy job at a time, announced (D-006).

**Consequence:** the team is expressed entirely as OpenClaw agents + sub-agents + tool policy. No custom orchestrator, no custom task store, no second session database.

---

## 2. Agent roster (proposed IDs)

| Agent ID | Role | Session namespace | Spawns | Receives |
|---|---|---|---|---|
| `zero` | Lead / the single assistant the user talks to | `agent:zero:main` | `researcher`, `operator` via `sessions_spawn` | all user chat |
| `researcher` | Bounded research: web + read-only workspace | `agent:researcher:*` | none | tasks from `zero` only |
| `operator` | Computer control inside the designated environment | `agent:operator:*` | none | tasks from `zero` only |

Rules encoded in config, not in Zero code:

- `agents.ownership: "explicit"` because this is a multi-agent fleet; without it an implicit default resolves ambiguously (`docs/gateway/config-agents.md:14`).
- `zero.subagents.allowAgents: ["researcher","operator"]` — the only spawn edges in the system.
- `researcher.subagents.allowAgents: []` and `operator.subagents.allowAgents: []` — specialists cannot spawn anyone. **This is the whole "no runaway team" policy**, one config key per specialist.
- `zero.subagents.requireAgentId: true` — the Lead must name the specialist, so a spawn can never silently reuse `zero` (`docs/gateway/config-agents/entries-and-multi-agent.md:95`).
- `maxConcurrent: 2`, `maxSpawnDepth: 2`, `maxChildrenPerAgent: 3` on the Lead — deliberately below upstream defaults (8 / 5 / 5) because this is a single-user workstation.

Why not name the Lead `main`: `main` is an ordinary id but carries legacy migration guards, and a sole named agent reuses `main`'s storage (`docs/gateway/config-agents.md:16-28`). `zero` keeps the product identity clean and avoids the `agent:main:*` quarantine rules.

---

## 3. Proposed configuration (NOT applied)

Target file: the Gateway's active config (resolved from profile/state defaults or `OPENCLAW_CONFIG_PATH`). Values marked `<...>` are owner inputs I do not have.

```json5
{
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    auth: { mode: "token" },              // value supplied via OPENCLAW_GATEWAY_TOKEN, never in this file
    reload: { mode: "hybrid" },
    http: { endpoints: { chatCompletions: { enabled: true } } },   // needed for the UI bridge option B
  },

  models: {
    mode: "merge",
    providers: {
      "zero-gw": {
        baseUrl: "https://integrate.api.nvidia.com/v1",   // owner-selected NVIDIA NIM endpoint
        api: "openai-completions",
        apiKey: "ZERO_GATEWAY_KEY",        // env-var NAME; OpenClaw stores the marker, not the secret
        models: [
          {
            id: "z-ai/glm-5.3-flash",      // ONE row serves Lead, Vision and Utility
            name: "GLM 5.3 Flash (NVIDIA NIM)",
            reasoning: false,
            input: ["text", "image"],      // image REQUIRED for computer-use observe; probe-pending
            contextWindow: 128000,         // conservative; correct from /v1/models metadata at BE-01
            contextTokens: 96000,
            maxTokens: 4096,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          },
        ],
      },
    },
  },

  agents: {
    ownership: "explicit",
    defaults: {
      model: { primary: "zero-gw/z-ai/glm-5.3-flash", fallbacks: [] },   // strict; add fallbacks only after BE-01 proves them
      utilityModel: "zero-gw/z-ai/glm-5.3-flash",
      skills: [],                          // start empty; enable reviewed skills individually in BE-03
      sandbox: { mode: "off" },            // containment is the designated environment (D-003), not OpenClaw sandbox
      subagents: { maxConcurrent: 2, maxChildrenPerAgent: 3, maxSpawnDepth: 2, archiveAfterMinutes: 60 },
    },
    entries: {
      zero: {
        name: "Zero",
        workspace: "E:\\zero\\backend\\.openclaw\\agents\\zero",
        identity: { name: "Zero", emoji: "\u25CF" },
        tools: { profile: "coding", exec: { mode: "ask" } },
        subagents: { allowAgents: ["researcher", "operator"], requireAgentId: true },
      },

      researcher: {
        name: "Researcher",
        workspace: "E:\\zero\\.zero-data\\agents\\researcher",
        tools: {
          profile: "coding",
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser", "computer"],
          exec: { mode: "deny" },
        },
        subagents: { allowAgents: [] },
      },

      operator: {
        name: "Operator",
        workspace: "E:\\zero\\.zero-data\\agents\\operator",
        model: { primary: "zero-gw/z-ai/glm-5.3-flash", fallbacks: [] },   // same model; must accept image input
        tools: {
          profile: "coding",
          alsoAllow: ["computer"],         // `coding` excludes computer; this is the documented add
          exec: { mode: "deny" },          // D-011: no host exec in the MVP; desktop control is the `computer` tool
        },
        subagents: { allowAgents: [] },
      },
    },
  },

  session: {
    scope: "per-sender",
    dmScope: "main",
    maintenance: { mode: "enforce", pruneAfter: "30d", maxEntries: 5000, maxDiskBytes: "2gb" },
  },
}
```

### Why each non-obvious key is there

| Key | Reason | Evidence |
|---|---|---|
| `models.providers.zero-gw.baseUrl` | Registering a custom provider `baseUrl` is also the narrow network-trust decision — it allows exactly that origin through the guarded fetch path; no separate "trust this host" flag exists | `docs/gateway/config-tools/custom-providers.md:14-16` |
| `api: "openai-completions"` | The adapter for any `/v1/chat/completions` backend; a custom provider with `baseUrl` and no `api` defaults to this anyway | `custom-providers.md:74` |
| `apiKey: "ZERO_GATEWAY_KEY"` | An env-var name. SecretRef-managed keys are refreshed from source markers and never persisted resolved | `custom-providers.md:51-52` |
| `input: ["text","image"]` on the vision row | Image attachments are only injected when the selected model is marked image-capable | `custom-providers.md:97` |
| `agents.ownership: "explicit"` | Multi-agent fleets have no implicit default | `docs/gateway/config-agents.md:14` |
| `profile` + `alsoAllow` (never `allow` + `alsoAllow`) | Config validation **rejects** `allow` and `alsoAllow` in the same scope | `docs/gateway/config-tools/tool-policy.md:202-204` |
| `operator.tools.alsoAllow: ["computer"]` | `coding` excludes `computer`; sandboxed agents additionally need `tools.sandbox.tools.alsoAllow` | `docs/nodes/computer-use.md:275-285` |
| `tools.exec.mode` values | `deny / allowlist / ask / auto / full`; per-agent override lives at `agents.entries.<id>.tools.exec` | `docs/tools/exec-approvals.md:230-248` |
| `sandbox.mode: "off"` default | Sandbox values are `off` (default) / `non-main` / `all`; containment for us is the designated environment, not the sandbox | `docs/gateway/config-agents/sandbox.md:23-26` |

### Two deliberate omissions

1. **No `bindings`.** Bindings route *channels* to agents (`entries-and-multi-agent.md:125-146`). Zero's UI reaches agents through the OpenAI-compatible HTTP surface (`model: "openclaw/<agentId>"`) or WS RPC, so no channel binding is required. Adding one later is additive.
2. **No `session.reset`.** Upstream defaults to a daily/idle reset policy that would silently discard the assistant's context. For a personal assistant this needs an explicit owner decision, not a guess. Flagged in §9.

---

## 4. Provider shape — what BE-01 must prove before this is locked

The config above is a hypothesis about the gateway. These 8 facts decide whether it survives:

| # | Check | Why it can fail |
|---|---|---|
| 1 | `GET /v1/models` returns the expected ids | If the gateway has no model list, ids must be hardcoded (fine, but documented) |
| 2 | Plain chat completes | Baseline |
| 3 | **Streaming** deltas arrive | A non-streaming gateway still works but the UI loses token-by-token output |
| 4 | **Tool/function calling** round-trips | If absent, the agent cannot spawn sub-agents or use `computer` — the whole backend plan collapses to plain chat. `compat.supportsTools: false` is the escape hatch |
| 5 | **Vision** (`input: ["text","image"]`) | Required for the Operator to observe the screen. Without it, computer-use needs a separate vision path |
| 6 | Usage/token counts in stream | Cost reporting and context accounting degrade silently without it (`compat.supportsUsageInStreaming`, default false for unknown remote endpoints — `custom-providers.md:137`) |
| 7 | Reasoning-effort acceptance | A reasoning model entry may send `reasoning_effort` and get a 400; remedy is `compat.supportsReasoningEffort: false` (`custom-providers.md:113,135`) |
| 8 | Error/fallback behaviour | A 429/500 must surface as a bounded error, not a hang |

**Rule:** nothing in §3's `models` block is "verified" until BE-01 records a request/response for each row. The `compat` block is where divergent-but-working endpoints get declared (`custom-providers.md:106-133`).

**Secret rule (non-negotiable):** the key lives only in the host secret store / environment variable. It never enters this repo, a report, this chat, a config file, or a log. If the owner cannot supply a secret-store method, BE-01 stays WAITING rather than using an inline key.

---

## 5. Session mapping (the part the UI depends on)

### Identity

| Zero concept | OpenClaw concept | Rule |
|---|---|---|
| Thread | Session | one thread = one session |
| Thread id | session key | `zero-thread-<uuid>` (must avoid reserved prefixes `subagent:`, `cron:`, `acp:`) |
| Agent | `agentId` | `zero` for the user-facing thread; children are `agent:<agentId>:subagent:<uuid>` |
| Run | run id | one user message = one run; a run can spawn children |

Two supported ways to pin the mapping, both documented:

1. **HTTP**: `x-openclaw-session-key: zero-thread-<uuid>` header, or a stable OpenAI `user` string derived per thread (`docs/gateway/openai-http-api.md:89-96, 106-110`).
2. **WS RPC**: session arguments on the session-control family (`docs/gateway/protocol/rpc-session-control.md`).

**Trap:** the HTTP endpoint is stateless by default — a request without `user` or the session-key header creates a fresh session every call (`openai-http-api.md:108`). A UI that forgets the key will look "amnesiac" and the bug will be blamed on the model.

### History

`chat.history` is the canonical transcript read (`docs/gateway/embedding.md:136`). Zero must not read OpenClaw's SQLite or transcript files (`embedding.md:128-148`) — that is the one hard "do not do this" in the embedding contract.

### Children

Sub-agent sessions belong to the parent for navigation and completion, and are view-only unless spawned with `visible: true` (`docs/tools/subagents.md:39-58`). The UI should render them as **nested runs**, not as sidebar threads.

---

## 6. Event needs (transport-neutral contract for OpenCode / UI-01)

This is the list I owe OpenCode. It is deliberately independent of WS-vs-HTTP.

| Need | Minimum contract | OpenClaw source |
|---|---|---|
| `run.accepted` | run id acknowledged before work completes | two-stage accept (`docs/gateway/index.md:410-413`) |
| `text.delta` | append text for the current assistant item | `chat` event `deltaText`, or `agent` `data.delta` — **exactly one projection, never both** (`rpc-bootstrap-and-events.md:248-292`) |
| `text.replace` | replace the whole item text | `replace: true` + `deltaText` (`:253-256`) |
| `tool.start` / `tool.result` | tool name, run id, bounded result content | `session.tool` (`:293-303`) |
| `run.final` | `ok` \| `error` \| `aborted`, with error kind | `chat.state: "error"` + `errorDetail` (`:261-271`) |
| `run.abort` | user-initiated stop acknowledged | stop button → run cancellation |
| `session.changed` | title/roster metadata invalidation | `sessions.changed` (`:331-345`) |
| `stream.gap` | "refetch history" signal | **events are not replayed** (`docs/gateway/index.md:432-434`) |
| `shutdown` | gateway going down; distinguish restart vs terminal | `shutdown.reason` + optional `restartExpectedMs` (`embedding.md:109-120`) |

Three hard requirements for the adapter:

1. **One text projection per display.** Consuming `chat` and `agent` text into one accumulator duplicates output. A chat-only renderer should advertise `chat-only-assistant-text` in its connect caps so the Gateway omits text-bearing `agent` events (`rpc-bootstrap-and-events.md:284-292`).
2. **Reconnect = refetch, not resume.** There is no event replay; on a gap, fetch `chat.history` and `health` before continuing (`index.md:432-434`).
3. **Approvals are optional and opt-in.** A UI that wants approval cards must subscribe `session.approval` (`:306-308`); otherwise approvals surface elsewhere. For Zero's "no per-action prompt" product stance, the UI can legitimately not subscribe.

**Transport recommendation (mine, for OpenCode to decide with senior):** hybrid — WS RPC for events/stop/roster, HTTP `/v1/chat/completions` for nothing, or WS for both. The single strongest argument for WS-only is that HTTP hides tool events and run aborts. The argument for HTTP is that it is OpenAI-shaped and drop-in for OpenDots' existing chat adapter. I would pick **WS for events + WS for send**, and keep HTTP enabled purely as a compatibility/debug surface, because a chat UI without tool events cannot show a computer-operator working.

---

## 7. Computer tool placement and the hold question (answer to Qoder)

Qoder asked: where does `computer` live in Zero's tool policy, and can a Gateway-side human-hold exist without patching upstream?

### 7.1 Placement — `operator` only, via `profile` + `alsoAllow`

`coding` does **not** include `computer`; onboarding selects `full` only when no profile is configured (`docs/nodes/computer-use.md:32`, `docs/gateway/config-tools/tool-policy.md:17-39`). So:

- `zero` (Lead): no `computer`. The Lead delegates; it never drives the desktop. This keeps a compromised/hallucinating Lead away from input injection.
- `researcher`: no `computer` (explicit deny for defence in depth).
- `operator`: `profile: "coding"` + `alsoAllow: ["computer"]`, and **only** if sandboxed, `sandbox.tools.alsoAllow: ["computer"]` (`computer-use.md:275-285`).

`tools.deny` always wins over profile/allow (`tool-policy.md:186`). Do **not** use `tools.gatewayPolicy` for this: changing it requires a Gateway restart (`tool-policy.md:235`), which is fatal for a stop button.

### 7.2 Stop — already fully supported, three tiers

| Tier | Mechanism | Latency | Scope |
|---|---|---|---|
| Run stop | interrupt/cancel the run (Control UI Stop, RPC) | immediate | that run and its children |
| Command revocation | `gateway.nodes.commands.deny: ["computer.act"]` | hot-applies under hybrid reload | **global** |
| Node-local | turn off Computer Control in the node app | immediate | that node |

`gateway.nodes.commands.deny` "remains an explicit global revocation and always wins; a denied `computer.act` is withheld from the node's advertised surface together with its `computer` capability, and the Gateway records what it withheld" (`docs/nodes/computer-use.md:291`; allow/deny policy `docs/nodes/command-policy.md:112`).

**Correction (REVIEW-02 / Qoder, 2026-10-23):** `computer.act` is *not* the input command. Only `screenshot` and `wait` ride `screen.snapshot` (`src/agents/tools/computer-tool-request.ts:20-23` `LOCAL_ACTIONS`); the structured observations — `list_apps`, `list_windows`, `get_accessibility_tree`, `get_cursor_position`, `get_window_state`, `zoom`, `get_browser_state` — all travel over `computer.act`. So denying `computer.act` **degrades observation as well as blocking input**: a plain `screenshot` still works, structured reads stop. It remains the correct global kill switch, but it is blunter than a per-action stop, and an audit or budget rule must not assume `computer.act` ⇒ mutation.

### 7.3 Hold — **there is no lease, expiry, or arm/disarm upstream**

Stated plainly in the computer-use doc: *"Once the node-local control is enabled and the pairing update is approved, `computer.act` is durably available while the node continues to advertise it. **There is no lease, expiry, or arm/disarm command.**"* (`docs/nodes/computer-use.md:287`). Also: "no per-action confirmation" (`:289`) and "there is no per-action admin check" for `operator.write` callers (`:291`).

So a human-takeover hold **cannot** be built by configuring upstream. It can be built **beside** upstream, and there is a documented extension point for exactly this:

**`before_tool_call` plugin hook** (`docs/plugins/hooks/tool-policy.md:18-86`):
- receives `event.toolName`, `event.params`, `ctx.agentId`, `ctx.sessionKey`, `ctx.runId`, `ctx.toolCallId`, `ctx.requester`;
- can return `block: true` + `blockReason` — terminal, skips lower-priority handlers;
- can return `requireApproval` — *pauses the agent run* and asks a human;
- can rewrite `params`.

A small Zero-owned plugin therefore gives us, **without patching upstream**:

1. **Human-hold refusal**: read a Zero-side hold flag; while held, every `computer` call returns `block: true` with a reason. This is exactly the OpenMausBot semantic Qoder proposed — *refused, never queued*.
2. **Risk-family gating**: `event.params.action` is one action per call, so `kill_app`, `browser_navigate`, `browser_download`, `browser_set_input_files`, `start_recording`, `replay_trajectory`, `escalate_scope` can each map to block / approve / allow.
3. **Budgets**: count actions per `ctx.runId` and per session/day, block over budget.
4. **Audit**: emit a Zero-owned record per call.

Design notes and honest constraints:

- Use `block`, not `requireApproval`, for the hold. `requireApproval` **pauses the run** rather than refusing the action — wrong semantics for "the human is driving".
- The flag must cross processes: the plugin runs in the Gateway; the UI is elsewhere. Cheapest robust path is a Zero-owned local state file or a plugin HTTP route polled by the UI. **No leak of gateway secrets is involved either way.**
- The hook is a **gate, not a sandbox** — upstream states its own guards are "hardening, not an isolation boundary" (`computer-use.md:299`). The real containment remains the designated VM/test account (D-003).
- This is a new Zero plugin using the documented `openclaw/plugin-sdk/*` surface, which is the preferred reuse direction (D-001/D-007), not a fork.

**Recommendation to Qoder/@manager:** build the hold in a Zero plugin (`before_tool_call`), not in upstream core and not by patching `computer.act`. Keep run-interrupt + `commands.deny` as the coarse emergency stop. Treat "no upstream lease" as a *documented, accepted gap* that the plugin fills.

### 7.4 What I still need from Qoder

The plugin gate needs a stable action taxonomy. I will consume whatever `computer.act` action names the CUA provider actually emits (Qoder's inventory has the filter list). I do not need the hold to be decided before CU-01; I need only the action names to be recorded in the spike evidence.

---

## 8. Install and run plan (one announced heavy job)

### 8.1 Where the runtime lives — do **not** install inside `upstream/openclaw`

`upstream/*` is read-only by policy (MASTER_PLAN §9, D-001). The embedding contract also says to install OpenClaw as a normal Node package and spawn the installed executable; do not copy `dist`, flatten, or vendor (`docs/gateway/embedding.md:150-160`).

**Proposed Zero-owned runtime directory:** `E:\zero\backend\` (new, backend-owned), containing `package.json` with a pinned dependency and nothing else. `E:\zero\.gitignore` already covers `node_modules/`, `.zero-data/`, `*.sqlite`, `*.log`.

```json
{
  "name": "zero-backend-runtime",
  "private": true,
  "type": "module",
  "dependencies": { "openclaw": "2026.10.6" }
}
```

Rationale: a version-pinned npm install keeps the source checkout as reference only, gives a reproducible artifact, and matches "install; do not flatten". Tradeoff to record: the npm tarball is the runtime under test, while the source pin `0132405` is what we read. Installing from the git commit would be more faithful but pulls a full build toolchain.

### 8.2 Resource estimate (to be confirmed by the actual run)

Measured from the checkout, not measured from an install:

| Signal | Value |
|---|---|
| `pnpm-lock.yaml` | 647 KB, 19,772 lines |
| packages with `integrity` | **1,859** |
| workspace packages | root, `ui`, `packages/*`, `extensions/*`, `examples/*`, `tools/solid-lint` |
| local free disk | E: 400.2 GB, C: 460.5 GB |
| local RAM | 31.8 GB total / 17.9 GB free |
| Node present | v24.22.1 (satisfies `>=24.22.1 <25`) |
| pnpm present | **no** (must be activated) |
| git present | **no** in this shell |

**Estimate:** 2,000–2,500 npm packages transitively; **peak disk ≈ 2.5–4 GB** (store + `node_modules`); **RAM during install ≈ 1–2 GB**; **wall clock ≈ 5–15 min** on this machine. These are estimates from the dependency count, not measurements — the first run must record the real numbers.

### 8.3 Ordered steps (each a separate, resumable step)

1. `corepack enable pnpm` (or `corepack prepare pnpm@12.15.0 --activate`) → verify `pnpm --version` = 12.15.0.
2. Create `E:\zero\backend\package.json` (above).
3. In `E:\zero\backend`: `pnpm install` (this is **the** heavy step — announce, do not overlap Qoder/OpenCode).
4. Record: install duration, `node_modules` size, store size, any native build (⚠ `@lancedb`, `fs-safe`, CUA native packages are optional/native — we do not need them for Gate 1).
5. `node_modules\.bin\openclaw --version` → expect `2026.10.6`.
6. `openclaw --dev setup` (isolated state/config, base port 19001) — **use `--dev` first** so the real profile is untouched (`docs/gateway/index.md:388-396`).
7. `openclaw --dev gateway --allow-unconfigured`, then `openclaw --dev status`.

### 8.4 What must be resolved before step 3

- Owner approval for the install window (D-006; senior instructed "do not activate Corepack or install dependencies until a small BE-02 install window is explicitly coordinated").
- Confirmation that the runtime artifact is the npm `openclaw@2026.10.6` tarball, not the git checkout build.

**I have not started any of this.** No Corepack activation, no `package.json`, no install.

---

## 9. Acceptance checks for BE-02 (when the blockers clear)

Each check must produce a transcript, not an assertion:

| # | Check | Pass condition |
|---|---|---|
| A1 | Gateway starts in `--dev` profile | `openclaw --dev status` reports runtime running + healthy capability line |
| A2 | One provider route works | plain chat through `zero-gw` returns a completion (proves config shape, overlaps BE-01 #2) |
| A3 | Three agents exist | `agents.list` / `openclaw agents list` shows `zero`, `researcher`, `operator` |
| A4 | Lead delegates | user→`zero` asks for a small research task; `zero` calls `sessions_spawn` with `agentId: "researcher"`; child session `agent:researcher:subagent:*` appears; announce returns to `zero` |
| A5 | Specialists cannot escalate | `researcher` attempting `sessions_spawn` is refused (empty `allowAgents`) |
| A6 | Operator sees and acts | `operator` receives `computer` in its tool list; a harmless observe call returns a frame (requires CU-01 environment) |
| A7 | Stop works | interrupting the run stops the child tree; `commands.deny` blocks the next `computer.act` |
| A8 | No secret leakage | grep the report/config/logs for the key env-var *value* → zero hits; only the name appears |

A4/A6 are the checks that justify the design. A2 is the one most likely to fail first.

---

## 10. Open questions (owner or cross-lane decisions)

| # | Question | Why it cannot be defaulted |
|---|---|---|
| Q1 | Session reset policy (`session.reset`) for a personal assistant | Upstream default is a daily/idle reset; silently losing context is a product decision |
| Q2 | Which model ids map to Lead / Vision / Utility | **ANSWERED by the owner:** one model, `z-ai/glm-5.3-flash` on NVIDIA NIM, for all three roles. The probe still has to prove image input and tool calling on it. |
| Q3 | Is `tools.exec.mode: "deny"` correct for `operator` in the MVP | **ANSWERED by D-011:** yes — exec stays denied until the live hold test proves a code-mode computer action is refused. Desktop control is unaffected; it runs through the `computer` tool. |
| Q4 | Hold mechanism = Zero plugin `before_tool_call` vs coarse `commands.deny` only | Cross-lane; affects CU-02 scope (§7.3) |
| Q5 | Runtime artifact: npm `openclaw@2026.10.6` vs git-commit build | Cost vs fidelity (§8.1) |

---

## 11. Limitations of this plan

- **No runtime contact.** Zero OpenClaw processes were started, no config was applied, no provider was called.
- The provider block is a **hypothesis**. Tool calling and vision are the two properties that, if absent, change the architecture (see §4 #4/#5).
- Native optional dependencies (CUA driver, LanceDB, `fs-safe`) were not resolved; on Windows those are the likeliest install failures. Gate 1 does not need them.
- Install footprint is estimated from the lockfile, not measured.
- The `before_tool_call` hold design is read from docs; it has not been exercised. The hook's *existence* is documented at `docs/plugins/hooks/tool-policy.md:18-86`; its behaviour on the `computer` tool specifically is unverified.

---

## 12. Files and coordination

**Created:** `reports/backend/mvp-backend.md` (this file).
**Modified:** `TASK_BOARD.md` (BE-02 row + note), `AGENT_CHAT.txt` (appended only).
**Not touched:** `upstream/**`, `DECISIONS.md`, other owners' reports and code.

**Follow-ups posted to the log:**
- Answer to Qoder's computer-tool / hold question (§7).
- Transport-neutral event contract for OpenCode (§6).

**Next backend work once BE-02's live half is possible:** BE-01 (gateway proof) → BE-02 live acceptance (§9) → BE-03 (skills/memory/routing) → TEAM-00 only if a built-in gap is proven.
