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
| 4. Context Fold | pending | | |
| 5. Turn Budget wrap-up | pending | | |
| 6. Chat Recall + `chat_search` | pending | | |
| 7. Key Guard | pending | | |
| 8. Turn Reflection | pending | | |
| 9. Ask Zero jobs | pending | | |
| 10. Chat Commands | pending | | |
| 11. Full test run, merge to main | pending | | |
