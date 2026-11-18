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

## Progress log

| Step | Status | Commit | Notes |
|---|---|---|---|
| 0. Plan, worktree, reference clone | done | — | this file |
| 1. Prompt Layers + IDENTITY.md | done | (this commit) | Old hard-coded prompt (with YouTube/Spotify/WhatsApp scripts) replaced; prompt frozen per chat in session metadata `zeroPrompt`; matched learned procedures moved to a per-turn hint. Tests: `prompt-layers*.test.mjs` |
| 2. Zero Notebook + `notebook` tool | done | (this commit) | Books `owner` (1,400 chars) and `zero` (2,200 chars) as editable markdown in `.zero-data/notebook/`; secrets and model-directed instructions refused; snapshot goes into each new chat (running chats keep their frozen prompt). Tests: `notebook.test.mjs` |
| 3. Skill Catalog + `skill_read` | done | (this commit) | Prompt lists enabled skills (name + one line); `skill_read` returns the full instructions or a file inside the skill folder (no path escape); owner-only skills hidden. Test: `skill-catalog.test.mjs` |
| 4. Context Fold | done | (this commit) | At `ZERO_FOLD_AT` (default 50%) of the model window: old tool outputs trimmed each model turn; if still over, the part before the recent tail is summarised (goal, preferences, done, in progress, open, details) and archived from the model context only. The note says “reference only, newest message wins, tools still work”. Prompt rebuilt only on a fold. Test: `context-fold.test.mjs` |
| 5. Turn Budget wrap-up | done | (this commit) | Closing report without tools already existed; added a one-turn budget warning when ≤2 turns or ≤5 actions are left, and raised defaults to 30 turns / 60 actions (`ZERO_MAX_ASSISTANT_TURNS`, `ZERO_MAX_ACTIONS`). Test: `turn-budget.test.mjs` |
| 6. Chat Recall + `chat_search` | done | (this commit) | FTS5 index `zero_messages_search` kept in sync by triggers (backfilled once); owner + Zero messages only; all-words then any-word; current chat excluded; works for Hindi. Tool `chat_search`. Test: `chat-recall.test.mjs` |
| 7. Key Guard | done | (this commit) | Well-known env keys (OPENAI, GEMINI, NVIDIA, ANTHROPIC, OPENROUTER, GROQ, …) are only sent to their own host; look-alike hosts refused; keys the owner saved for a provider are unchanged; the reason is kept in `keyGuardNotes`. Test: `key-guard.test.mjs` |
| 8. Turn Reflection | done | (this commit) | After a reply with ≥3 tool actions, or every `ZERO_REFLECT_EVERY` (6) owner messages, a background review may add a grounded Notebook entry or a procedure (only `notebook` + `procedure_learn` offered). Never blocks the reply, never writes into the chat; `ZERO_TURN_REFLECTION=off` disables it. Test: `turn-reflection.test.mjs` |
| 9. Ask Zero jobs | done | (this commit) | `assistant.prompt` jobs run a prompt as a Zero request in chat `automation-<job>` (named after the job), with optional `skills` named for `skill_read`; `schedule_task`/`goal_plan` not offered inside a job; `cron.run {id}` runs one job now (a disabled job stays disabled); job list returns cron, action and params. Test: `ask-zero-jobs.test.mjs` |
| 10. Chat Commands | done | (this commit) | One table (`chat-commands.mjs`) for `/help`, `/fold` (aliases `/compact`, `/compress`), `/notebook [owner|zero]`, `/skills`, `/budget`; answered without a model call and kept in the chat; `/status` unchanged; unknown `/words` go to the model. Test: `chat-commands.test.mjs` |
| 11. Full test run, merge to main | tests done; merge waits | — | All offline tests on a clean checkout of main (`fb345dff2`): 57 pass / 15 fail. On this branch: 68 pass / 15 fail — the same 15 files fail on both (pre-existing), the 11 new test files all pass. Merge into `main` waits: the main working tree has another agent's uncommitted edits in the same files (`native-gateway.mjs`, `capability-engine/index.mjs`, `model-fabric/index.mjs`). Owner asked to wait for that agent to commit first. |
| 11.5. Phase 2 — orientation | done | — | Architecture understood: Zero is a Node.js ESM host on port 18789; tools in `packages/capability-engine` (`CAPABILITY_DEFINITIONS` + `registerHandler`, "Single Room"); phase 1 built 10 Hermes-inspired capabilities under Zero-native names on branch `zero/hermes-merge`. `E:\zero` (main) has 42 modified + 20 untracked files from another agent, including the 3 files the branch modifies. Hermes reference cloned at `E:\zero-reference\hermes-agent`. |
