# GEM-01 — OpenClaw Skill Lifecycle and Hermes Memory/User-Model Intake Audit

**Date:** 2026-10-23  
**Owner:** Gemini (Skills and Reuse Intake Developer)  
**Status:** Complete / Ready for Review  
**Audited Sources:** `upstream/openclaw` (commit `0132405`, release `2026.10.6`), `backend/node_modules/openclaw`, `upstream/hermes-agent` (commit `841d1a9`)  
**Target Audience:** Qoder (Backend/BE-03 & Computer/CU), OpenCode (UI/UI-03 & UI-04), ChatGPT (Senior Review)

---

## 1. Context and Product Governance

Zero AI is a private single-user AI assistant composed of:
1. One native **OpenClaw Control UI** product shell (`app/zero-control-ui/`),
2. One canonical **OpenClaw Gateway** runtime (`backend/`), and
3. One unified session/history and computer control architecture.

This audit evaluates:
- The full authoring, inspection, mutation, disable, update, and rollback lifecycle for OpenClaw Workshop and Library skills.
- Reusable memory and user-model patterns from Hermes Agent that can enhance Zero's personalization without importing the Hermes Python runtime, third-party cloud memory services, or duplicate database stores.
- A concrete, minimal approval checklist for Qoder and OpenCode to safely evaluate and intake skills into Zero.

This investigation was conducted strictly **read-only**: no packages were installed, no secrets were touched, no runtime code in `app/`, `backend/`, `computer/`, or `upstream/` was modified, and no third-party services were invoked.

---

## 2. OpenClaw Skill Authoring and Lifecycle Audit

OpenClaw supports three distinct skill tiers:
1. **Core / Global Skills:** Built-in and installed from ClawHub or declared npm packages.
2. **Workshop Skills (`skills.workshop.*`):** Agent-authored, learned, or locally curated workspace skills located under `<agentWorkspace>/skills/<name>/`.
3. **Personal Library Skills (`skills.library.*`):** User-managed, versioned bundles with CAS storage and per-session pin activation.

### 2.1 Skill Authoring & Bundle Structure

A valid OpenClaw skill directory adheres to the following specifications:
- **Directory Name:** Must match the skill name. New skills enforce lowercase alphanumeric characters and hyphens: `/^[a-z0-9][a-z0-9-]{0,62}$/`.
- **Primary Descriptor (`SKILL.md`):** Required at the root of the skill folder.
  - Frontmatter must begin with:
    ```yaml
    ---
    name: <skill-name>
    description: <trigger conditions and summary>
    ---
    ```
  - `name`: Must match the directory name exactly.
  - `description`: 1 to 1024 bytes. Must state the situations that trigger the skill.
- **Support Files:** Optional reference materials placed under subdirectories, e.g., `references/<topic>.md`.
  - Max support file size: `MAX_WORKSPACE_SKILL_SUPPORT_FILE_BYTES` (512 KiB).
  - Dot-files (e.g., `.git`, `.DS_Store`) and symlinks are strictly rejected.
  - Support file paths are scanned to prevent embedding credentials or sensitive filenames (`scanSupportFilePath`).
- **Security Scanning:** On write/patch/restore, OpenClaw runs `scanSkillFile(content)`. If a `critical` rule fires (such as `literal-secret`), the operation is refused with `WorkshopWriteError`.

### 2.2 Supported Operations & Gateway RPC Matrix

The verified Gateway method surface across the installed release (`openclaw@2026.10.6`) and upstream source is summarized below:

| Method Family | Method Name | Scope | Purpose & Payload Semantics |
|---|---|---|---|
| **Workshop** | `skills.workshop.list` | `operator.read` | Lists all active and archived workshop skills for `agentId`, with file counts, sizes, and timestamps. |
| **Workshop** | `skills.workshop.changes` | `operator.read` | Audit log of workshop mutations (`limit`, `beforeMs`) tracking actions, actors, and version IDs. |
| **Workshop** | `skills.workshop.read` | `operator.read` | Reads `SKILL.md` or a support file (`filePath`) from the live skill or a historical version (`versionId`). |
| **Workshop** | `skills.workshop.archive` | `operator.admin` | Deactivates a live skill by moving it to `.archive/<name>/<versionId>/`. Optional `absorbedInto` for skill merges. |
| **Workshop** | `skills.workshop.restore` | `operator.admin` | Restores an archived version or rolls back a live skill to `versionId` (or latest). Uses atomic staging swap. |
| **Workshop** | `skills.workshop.undo` | `operator.admin` | Reverts all skill changes associated with a specific agent review run (`runId`). |
| **Library** | `skills.library.list` | `operator.read` | Lists personal skill library entries. If `sessionKey` is provided, includes active pins and attachable entries. |
| **Library** | `skills.library.read` | `operator.read` | Reads a library skill bundle by `skillId` and `revision` (or via session pin). |
| **Library** | `skills.library.save` | `operator.write` | Saves/updates a library skill bundle. Supports CAS concurrency via `expectedRevision` and file retention (`retainFiles`). |
| **Library** | `skills.library.mutate` | `operator.write` | Updates library entry metadata. |
| **Library** | `skills.library.activate`| `operator.write` | Binds/pins selected library skills to an active session (`sessionKey`). Takes effect on `next-turn`. |
| **Library** | `skills.library.import` | `operator.write` | Imports a shared skill library bundle. |
| **Library** | `skills.library.upload` | `operator.write` | Uploads an archive bundle into the user's library. |
| **Core / Hub**| `skills.status` | `operator.read` | Full visibility inventory across all sources (ready vs. excluded, missing dependencies, eligibility). |
| **Core / Hub**| `skills.search` | `operator.read` | Queries ClawHub registry for public skill packages. |
| **Core / Hub**| `skills.detail` | `operator.read` | Fetches package details and security scan inspection cards from ClawHub. |
| **Core / Hub**| `skills.install` | `operator.admin` | Installs a skill from ClawHub or uploaded archive (gated by `skills.install.allowUploadedArchives`). |
| **Core / Hub**| `skills.update` | `operator.admin` | Updates ClawHub packages (`{ source: "clawhub", slug }`) OR patches config (`{ skillKey, enabled, env, apiKey }`). |

> [!NOTE]
> **Retired & Missing Methods:**
> - `skills.files.get` **does not exist** in the installed release (verified in BE-03).
> - `skills.curator.*` and `skills.workshop.proposals` were retired upstream in favor of immediate undoable changes via `skills.workshop.list/changes/read/archive/restore`.

### 2.3 Scopes and Authorization Posture

1. **Read Scopes (`operator.read`):**
   - Read methods (`skills.status`, `skills.workshop.list`, `skills.workshop.read`, `skills.library.list`) can be invoked by standard UI sessions without privilege elevation.
   - The Zero Team panel in OpenCode's UI-03 uses `skills.status` to render the read-only summary card safely.
2. **Write Scopes (`operator.write`):**
   - Personal library management and session activation require `operator.write`.
3. **Admin Scopes (`operator.admin`):**
   - `skills.install`, `skills.update`, `skills.workshop.archive`, `skills.workshop.restore`, and `skills.workshop.undo` strictly require `operator.admin`.
   - In Zero's loopback configuration (`auth.mode: "none"`), the Control UI holds operator permissions, but destructive or state-altering operations must remain confined to the native Skills / Workshop management page and require explicit operator intent.

### 2.4 Versioning, Source, and License Metadata Analysis

- **Workshop Versioning:**
  - Automated snapshots: Every mutation (`patch`, `write_file`, `remove_file`, `archive`, `restore`) calls `snapshotSkill(paths, action)` before writing to disk.
  - Snapshot directory: `<agentWorkspace>/skills/.archive/<name>/<versionId>/`.
  - Immutable version identifiers: Unique `versionId` generated per snapshot.
  - Audit trail: `skills.workshop.changes` records change IDs, timestamps, actions, actors, and run IDs.
- **Library Versioning:**
  - Content-addressed `revision` hash per skill bundle.
  - Updates enforce compare-and-swap (CAS) via `expectedRevision` to prevent concurrent write collisions.
- **License & Provenance Metadata Gap (CRITICAL):**
  - OpenClaw's `SKILL.md` parser only extracts `name` and `description` from the YAML frontmatter.
  - Upstream OpenClaw has **no native schema enforcement** for `license`, `author`, `version`, or `source_url` in local or workshop skills.
  - ClawHub packages store provenance in separate lockfile structures, but locally imported or workshop skills have no built-in license ledger.
  - **Zero Directive:** Zero must not rely on OpenClaw to enforce license compliance. All incoming skills must pass Zero's approval checklist and carry explicit license metadata.

### 2.5 Disable, Update, and Rollback Behavior

- **Disabling a Skill:**
  1. *Core/Installed skills:* Calling `skills.update({ skillKey: "<name>", enabled: false })` immediately updates `draft.skills.entries[skillKey].enabled = false` in `openclaw.json`. The Gateway hot-reloads the configuration without restart.
  2. *Workshop skills:* Calling `skills.workshop.archive({ name: "<name>", reason: "..." })` detaches and moves the skill folder from the live directory to `.archive/<name>/`. The agent loses access immediately on the next turn.
  3. *Library skills:* Removed by calling `skills.library.activate` without including the skill in the session's pin array.
- **Updating a Skill:**
  1. *ClawHub skills:* `skills.update({ source: "clawhub", slug: "<slug>" })` pulls the latest release card and updates files.
  2. *Workshop skills:* Direct file writes or patches take a pre-mutation snapshot, update the file, and log the change to the ledger.
  3. *Config overrides:* `skills.update({ skillKey: "...", env: {...}, apiKey: "..." })` modifies environment variables and API keys with automatic secret redaction.
- **Rollback and Restoration:**
  1. *Atomic Version Restoration:* `skills.workshop.restore({ name: "<name>", versionId: "<id>" })` implements a double-fenced atomic swap:
     - The target version files are staged in `.restore-<uuid>`.
     - The current live skill is moved to `.restore-previous-<uuid>`.
     - Staging is renamed to the live directory. If anything fails, `.restore-previous` is restored immediately.
     - The prior live state is recorded as a new snapshot version, ensuring that a restore operation is itself undoable.
  2. *Review Run Undo:* `skills.workshop.undo({ runId: "<runId>" })` allows rolling back multi-file or multi-skill modifications made during an automated review run.

---

## 3. Hermes Memory and User-Model Patterns for Zero

Hermes Agent (`upstream/hermes-agent`) implements several memory and user-modeling patterns in its architecture. We can selectively adopt these conceptual patterns into Zero **without importing the Hermes Python runtime, dependencies, or external cloud services**.

### 3.1 Hermes Memory Mechanics

1. **Dual-Store Mental Model:**
   - `MEMORY.md`: Stores agent-curated environmental facts, conventions, repository details, tool quirks, and operational learnings.
   - `USER.md`: Stores the persistent user profile—user communication style, output preferences, directives, formatting rules, and constraints.
2. **Bounded System-Prompt Injection (No Retrieval Hop Required):**
   - In Hermes, both `MEMORY.md` and `USER.md` are bounded by strict character caps:
     - `memory_char_limit`: ~2,200 characters (~800 tokens).
     - `user_char_limit`: ~1,375 characters (~500 tokens).
   - Because they are strictly bounded, they are injected directly into the system prompt on every session. The assistant never needs to guess whether to query RAG or perform a tool search for basic user identity or core conventions.
3. **Agent Self-Pruning & Compaction:**
   - When memory approaches the character limit, the agent is instructed to consolidate, summarize, or replace stale entries rather than appending indefinitely.
4. **Periodic Review / Memory Nudge:**
   - Configurable `nudge_interval: 10` (reminds the agent every 10 user turns to consider consolidating key facts to memory).
   - In Hermes, background review threads (`background_review`) run asynchronously with preemption handling (if a user message arrives, the background review is cancelled or requeued to an idle queue).

### 3.2 Translating Hermes Patterns to Zero (Zero-Native Implementation)

| Hermes Pattern | Hermes Mechanism | How Zero Reuses the Pattern (Without Hermes Runtime) |
|---|---|---|
| **Dual-Store Files** | `~/.hermes/memories/MEMORY.md` & `USER.md` | OpenClaw **already uses** `MEMORY.md` and `USER.md` in `<agentWorkspace>/`! OpenCode's UI-03 has already implemented the **Memory files** card reflecting this exact scope. |
| **Strict Character Bounding** | `memory_char_limit: 2200`, `user_char_limit: 1375` | Zero should document and enforce recommended character budgets for `USER.md` (~1,500 chars) and `MEMORY.md` (~2,500 chars). Keeping these files lean ensures they fit comfortably in agent context windows. |
| **Topic Deep-Dives** | External memory plugins (Honcho, Mem0) | Zero **rejects** external memory plugins. Instead, Zero utilizes OpenClaw's built-in Memory Core with deliberate FTS-only recall over `memory/*.md` files for larger notes. |
| **Background Review / Dream** | Python background review thread + idle queue | Zero reuses OpenClaw's built-in scheduled Dreaming (`0 3 * * *`, light/rem/deep passes) and standard session summaries, avoiding custom background daemons. |
| **User Profile Directives** | System prompt injection from `USER.md` | The agent Lead profile reads `USER.md` as primary user preferences; full-text search (`memory_search`) provides supplemental recall on demand. |

> [!IMPORTANT]
> **Zero Implementation Boundary:**
> - Do NOT import Python packages or the Hermes runtime into Zero.
> - Do NOT add external memory providers (Honcho, Mem0, Supermemory) or require cloud API keys.
> - Keep OpenClaw's SQLite Memory Core (`agent/openclaw-agent.sqlite`) as the single source of truth for indexes.
> - Workspace Markdown files (`USER.md`, `MEMORY.md`, `memory/*.md`) remain the inspectable, user-editable canonical source.

---

## 4. Minimal Approval Checklist for CodeEd / Qoder & OpenCode

Before any skill (whether external, learned in the Workshop, or adapted from an upstream repository) is enabled for routine use in Zero, Qoder and OpenCode must apply the following 7-point checklist:

```text
[ ] 1. LICENSE & NOTICES (Zero Compliance)
    - The skill directory contains an explicit SPDX license header in SKILL.md or an adjacent LICENSE file.
    - License is permissive and compatible with Zero's private distribution (e.g., MIT, Apache-2.0, BSD-3-Clause).
    - Attribution and copyright notices are preserved in THIRD_PARTY_NOTICES.md.

[ ] 2. SOURCE PROVENANCE & IDENTIFIER STABILITY
    - Exact upstream repository, commit hash, or workshop revision ID is recorded.
    - Skill folder and frontmatter name match exactly: ^[a-z0-9][a-z0-9-]{0,62}$.
    - Description is 1–1024 bytes, clearly stating invocation triggers without deceptive claims.

[ ] 3. STATIC SECURITY & SECRET HYGIENE
    - Automated scan passes zero 'critical' findings (no literal API keys, bearer tokens, or private endpoints).
    - No references to environment variable secrets in support file paths or Markdown examples.
    - No symlinks, hidden files, or unapproved executable binaries in the skill tree.

[ ] 4. LEAST PRIVILEGE & TOOL RESTRICTION
    - The skill declares only tools necessary for its specific function.
    - Operator-only tools (like desktop computer-use or exec) are NOT requested by skills intended for the general Lead or Researcher agents.
    - Execution does not bypass Zero's Policy plugin gates (e.g., maxActionsPerRun, blockedActions).

[ ] 5. ZERO RUNTIME ISOLATION & NO MODEL WEIGHTS
    - Does NOT require local model weight downloads or external runtime daemons (Python, Docker, background relays).
    - Executes purely within OpenClaw's Node.js runtime and configured Gateway model routes (`zero-gw`).

[ ] 6. LIFECYCLE & ROLLBACK VERIFICATION
    - The skill can be disabled immediately via `skills.update({ skillKey, enabled: false })` or `skills.workshop.archive`.
    - Verification that deactivation immediately halts agent eligibility on the subsequent turn.
    - Restoration via `skills.workshop.restore` succeeds without leaving orphaned or corrupt files.

[ ] 7. NATIVE UI CONTRACT COMPLIANCE (OpenCode)
    - Skill displays cleanly in the native Zero Team page via `skills.status` summary.
    - Detailed file inspection, editing, and archiving remain in OpenClaw's native Skills / Workshop page.
    - The skill is accurately labeled with its true origin (e.g., "OpenClaw Workshop", not mislabeled as external or Hermes).
```

---

## 5. Review of the Candidate Skill: `subagent-echo-check`

Applying the checklist to Zero's first reviewed candidate, the Workshop skill `subagent-echo-check`:

1. **License & Notices:** OpenClaw MIT. Shipped as built-in learned content in OpenClaw release `2026.10.6`. **PASS.**
2. **Source & Identifier:** Built-in workshop skill (`openclaw-workshop`). Name `subagent-echo-check` adheres to regex and frontmatter requirements. **PASS.**
3. **Security & Secrets:** Procedure documents built-in team coordination tools (`sessions_spawn`, `sessions_yield`). Contains zero credentials. **PASS.**
4. **Tools & Scopes:** Utilizes standard Gateway session tools already permitted on Lead. Requires no elevated computer or raw exec privileges. **PASS.**
5. **Runtime Isolation:** Requires no downloads, external packages, or extra models. Runs on the active `zero-gw` route. **PASS.**
6. **Lifecycle & Rollback:** Managed directly by `skills.workshop.*`. Can be archived or restored atomically. **PASS.**
7. **UI Contract:** Verified live on 2026-10-23 by Qoder (1 of 56 ready). Correctly rendered in `skills.status`. **PASS.**

**Recommendation:** `subagent-echo-check` passes all 7 checklist gates and is fully certified as Zero's baseline reviewed skill for Gate 2 / BE-03.

---

## 6. Handoff and Actionable Next Steps

### For Qoder (Backend & Computer Lanes — BE-03 / CU-01)
- **BE-03 Gate 5:** You can mark `subagent-echo-check` as having completed formal skill lifecycle and safety intake. Use Gateway `skills.*` and `skills.workshop.*` as the authoritative lifecycle controllers.
- **Memory Store:** Maintain the deliberate FTS-only configuration (`memory.search.provider: "none"`). Encourage keeping `USER.md` within ~1,500 chars and `MEMORY.md` within ~2,500 chars in the agent workspace.
- **Computer Lane:** CU-01 live execution remains pending the owner's provisioned isolated environment marker (`designated-environment.json`).

### For OpenCode (UI Lane — UI-03 / UI-04)
- **UI-03 Status:** Accepted. The native **Zero Team** page (`dist/control-ui/725de545...`) correctly surfaces the read-only Skills count and Memory files search.
- **UI-04 Preparation:** For assistant-first workflow, keep skill installation and editing within the native `/skills` and `/skills/workshop` routes. Surface `USER.md` as the primary user-profile document in the UI.

### For Gemini (Intake Lane)
- Continue read-only intake audits: monitor upstream capability sources (e.g., OpenMausBot desktop observation patterns, prompt engineering conventions) for selective reuse opportunities.
