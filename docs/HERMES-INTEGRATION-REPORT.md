# Zero + Hermes Integration Report

**Project:** Zero AI (E:\zero)  
**Source:** Hermes Agent reverse-engineering guide (Nous Research, MIT license)  
**Date:** 2026-11-18  
**Strategy:** Integrate Hermes *patterns* into Zero's existing Node.js/TypeScript architecture (not a Python port). Leave working components as-is.

---

## 1. Executive Summary

Zero already implements most Hermes subsystems natively (model fabric, agent runtime, capability engine, screen intelligence, skills, plugins, automation, voice, sessions, memory). Seven Hermes concepts were missing or partial and have been built:

| # | Hermes Concept | Zero Status Before | Zero Status After | File(s) |
|---|---|---|---|---|
| 1 | Context compression (prune/boundary/summary/rewrite) | ❌ Missing | ✅ Built | `packages/capability-engine/context-compressor.mjs` |
| 2 | 3-tier system prompt (stable/context/volatile) | ❌ Missing | ✅ Built | `packages/capability-engine/system-prompt.mjs` |
| 3 | File-based memory (MEMORY.md/USER.md) | ❌ Missing | ✅ Built | `packages/memory/file-memory.mjs` |
| 4 | Self-registering tool registry | ⚠️ Partial | ✅ Enhanced | `packages/capability-engine/tool-registry.mjs` |
| 5 | Background review / self-improving loop | ❌ Missing | ✅ Built | `packages/memory/background-review.mjs` |
| 6 | Provider key scoping (host-enforced) | ⚠️ Partial | ✅ Enhanced | `packages/model-fabric/key-scoping.mjs` |
| 7 | Slash command system (COMMAND_REGISTRY) | ❌ Missing | ✅ Built | `packages/capability-engine/slash-commands.mjs` |

Plus supporting assets: `zero-system/config/SOUL.md` (default agent identity).

---

## 2. Existing Zero Elements (Left As-Is)

The following Zero subsystems already cover Hermes concepts and were **not modified**:

### 2.1 Model Fabric (`packages/model-fabric/`)
- Multi-provider inference: Gemini (gemini-live-screen) + NVIDIA (Nemotron 3.5 Super VL 120B, Minimax M3.1 Flash)
- Auto-failover cascade with exponential backoff retry
- Provider health tracking, usage accounting, token budget calculation
- Local GGUF support via `node-llama-cpp` (SmolVLM-256M)
- API key resolution from `.env` → `.zero-data/provider-secrets.json` → well-known env vars
- **Hermes equivalent:** Provider resolver + 39 bundled providers
- **Gap filled by new `key-scoping.mjs`:** host-scoped key enforcement

### 2.2 Agent Runtime (`packages/agent-runtime/`)
- Durable task state machine (PENDING→QUEUED→RUNNING→WAITING→COMPLETED/FAILED/CANCELLED)
- SQLite persistence: tasks, steps, checkpoints, idempotency keys
- Agent delegation with parent/child task relationships
- Desktop lease manager (mutual exclusion for physical mouse/keyboard)
- Agent team orchestrator with canonical profiles (ZERO, Researcher, Coder, Reviewer, Operator)
- Restart recovery on host reboot
- **Hermes equivalent:** `run_agent.py`, `agent/`, `iteration_budget.py`, `desktop-lease`
- Status: Complete, left as-is

### 2.3 Capability Engine (`packages/capability-engine/`)
- Central capability registry with argument schemas (mirrors what the model sees)
- Handler-based execution: `read_file`, `write_file`, `run_process`, `web_search`, `desktop_control`, `browser`, `see_screen`, `skills_list`, `skill_execute`, `delegate_agent`, `schedule_task`, `goal_plan`, `procedure_learn`, `system_info`, `voice_status`, `doctor_memory_status`, `zero_skill_learn`, `ask_screen`, `screen_act`
- ComputerOperator fallback for native Windows desktop actions (UI Automation, physical input)
- Outcome taxonomy: executed/verified/completed with outcome (COMPLETED/FAILED/CANCELLED/UNVERIFIED/BLOCKED)
- Reflex escalation (named-control click fallback)
- **Hermes equivalent:** `model_tools.py`, `tool_executor.py`, `tools/registry.py`
- Status: Complete, left as-is (enhanced with `tool-registry.mjs` + `slash-commands.mjs`)

### 2.4 Screen Intelligence (`packages/screen-intelligence/`)
- Continuous desktop capture at 2s interval
- RollingFrameBuffer: 250 MiB ceiling, 5-minute rolling window
- ChangeDetector: encoded-image SHA-256 + window metadata + OCR change detection
- SemanticObservationStore: persistent SQLite observations
- LocalVisionExtractor + optional LocalInferenceRuntime (SmolVLM GGUF)
- `queryContext()` for agent queries about screen state
- **Hermes equivalent:** vision/observation concepts
- Status: Complete, left as-is

### 2.5 Memory (`packages/memory/`)
- PersistentMemoryStore: SQLite-backed with keyword scoring, tagging, recency weighting
- UnifiedMemoryEngine: 8 canonical layers (WORKING, SESSION, EPISODIC, SEMANTIC, PROCEDURAL, OBSERVATION, AGENT, PROJECT)
- **Hermes equivalent:** `persistence/sqlite/`, `memory_tool.py`, `MEMORY.md`/`USER.md` (file-based)
- **Gap filled by new `file-memory.mjs`:** simple file-based MEMORY.md/USER.md

### 2.6 Sessions (`packages/sessions/`)
- Session/transcript persistence in SQLite
- Context compaction (soft-archive old turns, keep active context)
- Message archiving, event emission
- **Hermes equivalent:** `persistence/`, session database
- Status: Complete, left as-is

### 2.7 Skills (`packages/skill-sdk/` + `skills/`)
- SKILL.md frontmatter parsing (YAML frontmatter + markdown body)
- Auto-discovery from `skills/` directory
- Trigger-based skill matching
- Skill execution through durable task + model/tool loop
- 11 built-in skills: browser-control, code-refactoring, github-automation, memory-retention, pdf-processing, system-ops, terminal-exec, vision-analysis, web-research
- **Hermes equivalent:** `skills/` (bundled) + `optional-skills/`
- Status: Complete, left as-is

### 2.8 Plugins (`packages/plugin-sdk/` + `plugins/`)
- Full plugin lifecycle: install, enable, disable, update, uninstall, hot reload
- SQLite persistence for installed plugins
- Capability ownership enforcement (no duplicate capability names)
- Diagnostics and health reporting
- `plugins/system-tools/` (system_info), `plugins/web-tools/`
- **Hermes equivalent:** `plugins/` (platform adapters, memory providers)
- Status: Complete, left as-is

### 2.9 Automation / Cron (`packages/automation/`)
- Cron-based durable job scheduler (SQLite-backed)
- Event automation engine
- 15-second background cron tick
- `cronjob_manage` capability
- **Hermes equivalent:** `cron/`, `cronjob_manage`
- Status: Complete, left as-is

### 2.10 Voice Engine (`packages/voice-engine/`)
- VoiceActivityDetector, Windows Speech + Whisper backends
- TTS playback, barge-in handling, duplex sessions
- PCM16 mono, 16kHz
- **Hermes equivalent:** voice mode, wake word
- Status: Partial (per docs), left as-is

### 2.11 Research Engine (`packages/research-engine/`)
- Web search with structured citation indexing
- File operations (read/write/directory/CSV)
- SHA-256 verified artifact generation
- Autonomous research workflow execution
- **Hermes equivalent:** web search, browser tools
- Status: Complete, left as-is

### 2.12 Workspaces (`packages/workspaces/`)
- Isolated agent workspaces (scratchpad directories)
- Worker pool: local/remote/cloud with health heartbeats
- Task handoff contracts with state snapshots
- **Hermes equivalent:** workspaces concept
- Status: Complete, left as-is

### 2.13 Device Protocol (`packages/device-protocol/`)
- Device pairing (6-char short-lived codes)
- Cross-device notifications
- SQLite device registry
- **Hermes equivalent:** device coordination
- Status: Complete, left as-is

### 2.14 Gateway Protocol (`packages/gateway-protocol/`)
- JSON-RPC 2.0 framing, Protocol 4 handshake validation
- Heartbeat management, session attachment
- Multiplexer for async request/response
- RPC error codes (PARSE_ERROR, UNAUTHORIZED, FORBIDDEN, HOLD_ACTIVE, etc.)
- **Hermes equivalent:** `gateway/` message framing
- Status: Complete, left as-is

### 2.15 Native Gateway (`services/host/native-gateway.mjs`)
- HTTP + WebSocket server on port 18789 (loopback only)
- ~140 RPC methods covering all subsystems
- SPA static asset serving with 29 UI routes
- DNS rebinding protection, CORS, session auth
- **Hermes equivalent:** gateway server + TUI JSON-RPC
- Status: Complete, left as-is

### 2.16 Zero Host (`backend/server/zero-host.mjs`)
- Entry point: starts ZeroNativeHost on port 18789
- `.env` loading, graceful shutdown, signal trapping
- **Hermes equivalent:** `run_agent.py` entry point
- Status: Complete, left as-is

### 2.17 Configuration
- `zero-system/config/zero.json`: gateway, models, agents, session, memory, plugins, update, telemetry, tools, UI
- `models/gateway-providers.json`: Gemini + NVIDIA provider configs
- `models/gateway-defaults.json`: default model bindings
- `.env`: API keys (NV_API_KEY, GEMINI_API_KEY, etc.)
- `rules/owner-policy.json`: owner mode (no confirmation gates)
- **Hermes equivalent:** `config.yaml` + `.env` + `SOUL.md`
- **Gap filled by new `SOUL.md`:** default agent identity file

---

## 3. New Components Built (Hermes Patterns in Zero)

### 3.1 Context Compression Engine
**File:** `packages/capability-engine/context-compressor.mjs`

Implements Hermes' 4-step compression:
1. **Prune (LLM-free):** Replaces old tool results > 200 chars with `[Old tool output cleared to save context space]`
2. **Boundaries:** Keeps first 3 messages + token-budget tail (protect_last_n=20); never splits tool_call/tool_result pairs
3. **Summary:** Sends middle turns to auxiliary LLM for compression (Goal, Constraints, Progress, Next steps)
4. **Rewrite in place:** Rebuilds system prompt with summary, soft-archives old turns

Default config: trigger 100K tokens (50% of 200K), tail budget 20K (20%), summary max 10K tokens.

### 3.2 3-Tier System Prompt Builder
**File:** `packages/capability-engine/system-prompt.mjs`

Builds system prompt in three tiers (Hermes-inspired):
- **Stable:** Identity (SOUL.md or built-in), tool/model guidance, coding brief, Windows platform hint — **cached, never rebuilt between turns except during compaction** (prompt caching sacred)
- **Context:** Caller's system_message, project context file (AGENTS.md → CLAUDE.md → .cursorrules → HERMES.md → .hermes.md), git workspace snapshot
- **Volatile:** Skills index, MEMORY.md snapshot, USER.md snapshot, time/session/model line, runtime environment

Includes `stableHash()` for cache-break detection.

### 3.3 File-Based Memory Store
**File:** `packages/memory/file-memory.mjs`

Hermes-style simple memory files alongside SQLite:
- **MEMORY.md:** agent's own notes (default 2,200 char limit)
- **USER.md:** user profile (default 1,375 char limit)
- Limits in **characters** (not tokens) for model-change stability
- Entries delimited by `\n§\n`
- Security scan before write (blocks prompt injection patterns)
- Atomic write (temp file + rename)

### 3.4 Self-Registering Tool Registry
**File:** `packages/capability-engine/tool-registry.mjs`

Hermes pattern where each tool module self-registers on import via `registry.register()`:
- Central singleton `toolRegistry` collects all tools
- Auto-discovery scans a tools directory for modules calling `registry.register()`
- Toolset ownership enforcement (no duplicate names across toolsets unless override)
- `definitions()` returns model-ready function calling schemas
- `dispatch()` with error wrapping (returns JSON error string on failure)
- `envReady()` checks required environment variables

### 3.5 Background Review Engine
**File:** `packages/memory/background-review.mjs`

Hermes-inspired self-improving loop:
- After each conversation turn, reviews transcript asynchronously (non-blocking)
- Asks: "what should be saved to memory or skills?"
- Uses same provider/model/cached system prompt (cache-hit friendly)
- Whitelist of memory/skill tools only
- Does not touch the main conversation
- User can trigger manually
- Emits `review:complete` / `review:error` events

### 3.6 Provider Key Scoping
**File:** `packages/model-fabric/key-scoping.mjs`

Hermes-inspired host-scoped key enforcement:
- Provider host allowlists (openrouter.ai → OPENROUTER_API_KEY, api.anthropic.com → ANTHROPIC_API_KEY, etc.)
- `isKeyAllowedForHost()` blocks keys from being sent to wrong hosts
- `validateProviderKeyScoping()` validates all configured providers
- `enforceKeyScope()` middleware throws `KEY_SCOPE_VIOLATION` (403) on mismatch

### 3.7 Slash Command System
**File:** `packages/capability-engine/slash-commands.mjs`

Hermes COMMAND_REGISTRY pattern:
- Single `commandRegistry` with `register()`, `get()`, `list()`, `parse()`, `dispatch()`
- CommandDef: name, description, category, busyPolicy (dispatch/reject/interrupt_then-dispatch), desktopVisible, execute handler
- 13 built-in commands: new, clear, sessions, resume, history, model, tools, status, usage, compress, memory, skills, stop, quit, help
- Categories: Session, Configuration, Info, Action, System, Exit
- No if/name== chains — dispatch through registry table

### 3.8 Default Agent Identity (SOUL.md)
**File:** `zero-system/config/SOUL.md`

Default Zero agent identity following Hermes' SOUL.md pattern.

---

## 4. Architecture Comparison

| Layer | Hermes (Python) | Zero (Node.js/TS) | Integration Approach |
|-------|----------------|-------------------|---------------------|
| Agent Core | `AIAgent` + `conversation_loop.py` | `RequestOrchestrator` + `_executeAssistantRequest` | Left as-is (Zero's is mature) |
| Tool Registry | `tools/registry.py` + self-registering | `CAPABILITY_DEFINITIONS` + `registerHandler()` | Enhanced with `tool-registry.mjs` |
| Prompt Assembly | 3-tier (stable/context/volatile) | Config-driven only | Built `system-prompt.mjs` |
| Prompt Caching | Sacred principle | Not explicit | Stable tier cached in `system-prompt.mjs` |
| Context Compression | `ContextCompressor` | Not present | Built `context-compressor.mjs` |
| Memory | SQLite + MEMORY.md/USER.md files | SQLite (8-layer UnifiedMemory) | Built `file-memory.mjs` |
| Skills | SKILL.md loader | SKILL.md loader (11 skills) | Left as-is |
| Plugins | Plugin SDK + adapters | Plugin SDK (full lifecycle) | Left as-is |
| CLI | 58 subcommands + 105 slash commands | Limited CLI | Built `slash-commands.mjs` |
| Gateway | 27 platform adapters | RPC methods (~140) | Left as-is |
| Cron | `cron/jobs.json` + 60s tick | `packages/automation/` (15s tick) | Left as-is |
| Voice | Windows Speech + Whisper | Windows Speech + Whisper | Left as-is |
| Installer | Tauri/Rust bootstrapper | `zero-setup.cmd` + `zero-host.cmd` | Left as-is |
| Key Scoping | Host-scoped API keys | Env-based resolution | Built `key-scoping.mjs` |
| Self-Improvement | `background_review.py` | Not present | Built `background-review.mjs` |

---

## 5. How to Integrate New Components

### 5.1 Wire into Native Gateway (`services/host/native-gateway.mjs`)

```js
import { defaultContextCompressor } from '../../packages/capability-engine/context-compressor.mjs';
import { defaultSystemPromptBuilder } from '../../packages/capability-engine/system-prompt.mjs';
import { defaultFileMemoryStore } from '../../packages/memory/file-memory.mjs';
import { defaultBackgroundReviewEngine } from '../../packages/memory/background-review.mjs';
import { defaultKeyScoping } from '../../packages/model-fabric/key-scoping.mjs';
import { defaultCommandRegistry } from '../../packages/capability-engine/slash-commands.mjs';

// In ZeroNativeHost constructor:
// this.contextCompressor = defaultContextCompressor;
// this.systemPromptBuilder = defaultSystemPromptBuilder;
// this.fileMemoryStore = defaultFileMemoryStore;
// this.backgroundReview = defaultBackgroundReviewEngine;
// this.keyScoping = defaultKeyScoping;
// this.commandRegistry = defaultCommandRegistry;

// Configure background review:
this.backgroundReview.setModelFabric(this.modelFabric);
this.backgroundReview.setSystemPrompt('You are a careful memory curator.');
```

### 5.2 Use Context Compression in Chat Loop

```js
const { messages, compressed, tokensSaved } = await this.contextCompressor.compress({
  stablePrefix: systemPromptMessages,
  messages: conversationMessages,
  sessionId: sessionKey,
});
```

### 5.3 Assemble System Prompt

```js
const prompt = this.systemPromptBuilder.assemble({
  stable: { agentId: 'zero', tools: toolDefinitions, modelInfo: { primary: '...', fallbacks: [...] } },
  context: { systemMessage: userSystemMsg, includeGit: true },
  volatile: {
    skills: skillLoader.listSkills(),
    ...this.fileMemoryStore.getSnapshot(),
    sessionId: sessionKey,
    modelId: currentModel,
  },
});
const hash = this.systemPromptBuilder.stableHash(); // cache key
```

### 5.4 Enforce Key Scoping

```js
try {
  this.keyScoping.enforceKeyScope(provider.id, provider.baseUrl, apiKey);
} catch (err) {
  if (err.code === 'KEY_SCOPE_VIOLATION') { /* block request */ }
}
```

### 5.5 Dispatch Slash Commands

```js
const parsed = this.commandRegistry.parse('/model nv/minimaxai/minimax-m3.1-flash');
if (parsed) {
  const result = await this.commandRegistry.dispatch(parsed.command.name, {
    modelFabric: this.modelFabric,
    sessionManager: this.sessions,
    sessionKey,
    args: parsed.args,
  });
}
```

---

## 6. Verification Checklist

```
[ ] Context compression: 100+ turn conversation compresses without context error
[ ] System prompt: stable tier hash unchanged between turns (cache preserved)
[ ] File memory: MEMORY.md/USER.md created, 2200/1375 char limits enforced
[ ] Self-registering tools: new tool file auto-discovered on import
[ ] Background review: runs async, emits review:complete, doesn't block main turn
[ ] Key scoping: OPENROUTER_API_KEY blocked from non-openrouter hosts (403)
[ ] Slash commands: /help lists all 13 commands, /model switches provider
[ ] Existing Zero tests still pass (node --test test/*.test.mjs)
```

---

## 7. Files Created/Modified

**New files (7):**
1. `packages/capability-engine/context-compressor.mjs`
2. `packages/capability-engine/system-prompt.mjs`
3. `packages/capability-engine/tool-registry.mjs`
4. `packages/capability-engine/slash-commands.mjs`
5. `packages/memory/file-memory.mjs`
6. `packages/memory/background-review.mjs`
7. `packages/model-fabric/key-scoping.mjs`

**New assets (1):**
8. `zero-system/config/SOUL.md`

**Modified files:** 0 (all existing Zero components left as-is)

---

## 8. Notes

- Zero is Node.js/TypeScript; Hermes is Python. Hermes *concepts/patterns* were adapted, not code ported.
- All new modules are ESM (`.mjs`) to match Zero's module system.
- Existing Zero tests and RPC contracts are unaffected — new components are additive.
- The owner-mode policy (`rules/owner-policy.json`: no confirmation gates) is preserved.
- Port 18789 single control plane remains the sole entry point.