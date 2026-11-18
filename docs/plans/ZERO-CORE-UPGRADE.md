# Zero Core Upgrade — learning from Hermes Agent

Branch: `zero/hermes-merge` (worktree `E:\zero-worktrees\hermes-merge`).
Reference: Hermes Agent by Nous Research, MIT license, read from a local clone at
`E:\zero-reference\hermes-agent` (commit `730d593f`, 2026-11-17). Nothing is
copied verbatim: each idea is re-designed for Zero's Node.js host, with Zero's
own names, and wired into the code that actually runs.

## How this merge works

1. **Not a blind merge.** Hermes is a Python agent; Zero is a Node.js host. We
   take the *design* of the parts Zero lacks or does worse, and keep Zero's own
   parts where they are already as good or better.
2. **Zero names only.** No `AIAgent`, `MEMORY.md`, `SOUL.md`, `registry`,
   `toolset` etc. in Zero's code. See the name map.
3. **Only wired code counts.** A step is done only when the running chat loop
   uses it and a test proves it.
4. **One step, one commit**, with this file updated (Progress log).
5. Earlier untracked drafts (`context-compressor.mjs`, `system-prompt.mjs`,
   `tool-registry.mjs`, `slash-commands.mjs`, `file-memory.mjs`,
   `background-review.mjs`, `key-scoping.mjs`, `SOUL.md`) were never wired and
   use Hermes names; they are not used by this upgrade.

## What Zero already has (kept)

| Area | Zero today | Decision |
|---|---|---|
| Model providers, Auto-Best, failover, local GGUF | `packages/model-fabric` | Keep; add key guard (step 7) |
| Tool registry + one canonical engine ("Single Room") | `packages/capability-engine` | Keep (Hermes' registry adds nothing here) |
| Durable tasks, agent team, delegation | `packages/agent-runtime` | Keep |
| 8-layer memory store (SQLite) | `packages/memory/unified-memory.mjs` | Keep; add the Notebook on top (step 2) |
| Skills (SKILL.md), plugins, MCP | `packages/skill-sdk`, `packages/plugin-sdk` | Keep; add the skill catalog in the prompt (step 3) |
| Automations / cron, goals | `packages/automation` | Keep; add "Ask Zero" jobs (step 9) |
| Screen intelligence, voice, Windows hands | own packages | Not in Hermes — keep |

## What Zero lacks (built here)

| # | Hermes idea | Zero name | Where |
|---|---|---|---|
| 1 | Tiered, frozen system prompt; identity file; no per-turn changes | **Prompt Layers** + `IDENTITY.md` | `packages/agent-runtime/prompt-layers.mjs`, `zero-system/config/IDENTITY.md` |
| 2 | Two small curated memory stores in the prompt, char budgets, memory tool | **Zero Notebook** (`owner` book, `zero` book) + `notebook` tool | `packages/memory/notebook.mjs` |
| 3 | Skills index in the prompt, load a skill on demand | **Skill Catalog** + `skill_read` tool | prompt layer + capability engine |
| 4 | Context compression with a handoff summary | **Context Fold** | `packages/sessions/context-fold.mjs` |
| 5 | Iteration budget with a closing summary instead of a hard stop | **Turn Budget** wrap-up | chat loop |
| 6 | Full-text search over past chats | **Chat Recall** + `chat_search` tool | `packages/sessions` (FTS5) |
| 7 | API keys only go to their own provider host | **Key Guard** | `packages/model-fabric/key-guard.mjs` |
| 8 | After-turn review that saves lessons | **Turn Reflection** | `packages/agent-runtime/turn-reflection.mjs` |
| 9 | Cron jobs that run an agent prompt | **Ask Zero jobs** (`assistant.prompt`) | automation dispatcher |
| 10 | Shared slash-command table | **Chat Commands** (`/fold`, `/notebook`, `/skills`, `/budget`, `/help`) | `packages/agent-runtime/chat-commands.mjs` |

Not in this pass (bigger, separate work): messaging platforms (Telegram etc.),
live terminal sessions, sandboxed code execution, a clarify/question tool.

Phase 2 (merge into main, UI surfaces, and the four items above) is described for the next agent in
`docs/prompts/ZERO-CORE-UPGRADE-AGENT.md`.

## Name map (Hermes → Zero)

| Hermes | Zero |
|---|---|
| `AIAgent.run_conversation` | `_runAssistantRequest` (existing) |
| system prompt tiers stable / context / volatile | Prompt Layers: `core` / `place` / `moment` |
| `SOUL.md` | `zero-system/config/IDENTITY.md` |
| `MEMORY.md` / `USER.md`, `memory` tool | Notebook books `zero` / `owner`, `notebook` tool |
| `skill_view` | `skill_read` |
| `ContextCompressor`, compaction | Context Fold, `foldContext()` |
| `IterationBudget` | Turn Budget |
| `session_search` | `chat_search` (Chat Recall) |
| key scoping | Key Guard |
| background review | Turn Reflection |
| `COMMAND_REGISTRY` | Chat Commands |

## Deferred capabilities — design notes (Steps 14–17)

### Step 14 — Zero Terminal

**Hermes idea:** long-lived shell sessions (PowerShell/cmd) with `run`, `open`, `send`, `read`, `list`, `close`, `open_external` actions; per-session cwd persistence; background process tracking.

**Zero design:**
- New tool `zero_terminal` in `CAPABILITY_DEFINITIONS` (`packages/capability-engine/index.mjs`), actions: `run` (foreground, waits for exit, returns output, cwd persists), `open` (create a session), `send` (text to an open session), `read` (poll output), `list` (sessions), `close` (end session), `open_external` (visible Windows Terminal window, output not readable by Zero).
- Host RPCs: `zero.terminal.open`, `zero.terminal.send`, `zero.terminal.read`, `zero.terminal.list`, `zero.terminal.close`, `zero.terminal.open_external`; broadcast events `zero.terminal.output`.
- A Terminal surface in the UI; Zero's own sessions marked as "Zero's".
- **Alias resolution:** `packages/capability-engine/aliases.mjs` currently maps `terminal` → `run_process`. Resolve deliberately: keep `terminal` → `run_process` for one-shot commands (no session), and add `zero_terminal` as the sessionful tool. Do not break the existing alias.
- State: in-memory map of session key → {process, cwd, output buffer, createdAt}. Host-scoped (no cross-host leakage).
- Risk: long-lived processes must be cleaned up on host shutdown. Windows process groups need careful handling.

### Step 15 — Clarify

**Hermes idea:** mid-task user question with optional choices and timeout; delivered through chat UI and voice.

**Zero design:**
- New tool `zero_clarify` in `CAPABILITY_DEFINITIONS`, parameter `questions`: array of `{question, choices?, multi_select?}`, max 5 questions, max 4 choices each, optional `multi_select`, optional `timeoutMs`.
- Host-side pending clarify store (thread-safe map: clarify_id → {sessionKey, question, choices, event, response}); agent thread blocks on `waitForResponse` with timeout.
- Delivered through chat UI: the host sends a `zero.clarify.pending` event to the UI; the UI renders the question + choices; the owner's reply resolves the pending entry.
- Voice delivery: when a voice session is active, the clarify question is spoken and the owner's spoken answer is captured.
- Timeout default 120s; on timeout, return `outcome: "timed_out"` with `user_response: null`.
- Risk: must not deadlock the chat loop; the clarify wait runs in a background task with an abort signal tied to the turn.

### Step 16 — Code Runner

**Hermes idea:** `execute_code` — sandboxed script runner, separate process, time/memory limits, optional network, working folder under data dir, output caps, callbacks into an allow-list of Zero tools.

**Zero design:**
- New tool `zero_code_run` in `CAPABILITY_DEFINITIONS`, parameters: `script` (JavaScript/Python), `timeoutMs` (default 30000, max 300000), `memoryMb` (default 256, max 2048), `allowNetwork` (boolean, default false), `cwd` (under data dir, default temp subfolder).
- Runs in a separate `child_process` with `resource` limits (Node: `--max-old-space-size`, timeout via `AbortController`; no network by default via sandboxing).
- Working folder: `dataDir/code-runner/<runId>/`, cleaned up after run.
- Callbacks: the script can request specific Zero tools via a JSON protocol on stdin/stdout; only allow-listed tools (`read_file`, `write_file`, `system_info`, `web_search`) are permitted.
- Output caps: stdout/stderr truncated to 100000 chars.
- Risk: on Windows, true sandboxing is limited. Document precisely: process isolation yes, filesystem restricted to working folder, network blocked unless `allowNetwork`, no desktop access, no registry access. Not a security boundary against malicious code — only a safety rail.

### Step 17 — Messaging Gateway, Telegram first

**Hermes idea:** platform adapter interface, chat key per chat, owner allow-list + pairing code, `/stop` during work, reply delivery, Ask Zero job delivery, bot token as secret.

**Zero design:**
- Platform adapter interface (`packages/messaging/platform-adapter.mjs`): `connect()`, `disconnect()`, `send(chatKey, message)`, `handleInbound(event)`.
- Telegram adapter first: long polling or webhook, `node-telegram-bot-api` or `telegraf`.
- Chat key format: `agent:main:telegram:{chat_type}:{chat_id}` (e.g. `agent:main:telegram:private:123456789`).
- Authorization: platform allow-all flag → allowlist → DM pairing code → global allow-all → deny.
- `/stop` while Zero is working: guard in the inbound handler, interrupt the active turn.
- Bot token stored as a secret (`.zero-data/provider-secrets.json` or env), never in config or logs; message content never logged.
- Delivery: replies to the same chat; Ask Zero job results to a chosen chat (`/sethome` or explicit target).
- The owner must create the bot and provide the token — do not create accounts or enter tokens.
- Risk: Telegram bot API rate limits, polling vs webhook choice, token rotation.

## Progress log

| Step | Status | Commit | Notes |
|---|---|---|---|
| 12. Integrate phase 1 into `main` | blocked | — | Merge `zero/hermes-merge` onto latest `main`. Blocked: `E:\zero` has another agent's uncommitted edits in `native-gateway.mjs`, `capability-engine/index.mjs`, `model-fabric/index.mjs`. Owner asked to wait for that agent to commit first. |
| 13. UI surfaces | pending | — | Notebook view, Context Fold indicator, Chat Commands suggestions, Ask Zero jobs in Automations, Turn Reflection setting. Extend `app/zero-control-ui` in existing style. Build with `node app/zero-control-ui/build.mjs`. Verify in browser with screenshots. |
| 14. Zero Terminal | pending | — | Sessionful `zero_terminal` tool (run/open/send/read/list/close/open_external), host RPCs, UI Terminal surface. Resolve `aliases.mjs` `terminal`→`run_process` deliberately. |
| 15. Clarify | pending | — | `zero_clarify` tool with questions/choices/timeout, chat UI delivery, voice delivery, background wait with abort. |
| 16. Code Runner | pending | — | `zero_code_run` sandboxed script runner, time/memory limits, optional network, allow-listed tool callbacks, output caps. |
| 17. Messaging Gateway (Telegram) | pending | — | Platform adapter interface, Telegram adapter, chat keys, allow-list + pairing, `/stop`, reply + Ask Zero job delivery, token as secret. Owner provides token. |
