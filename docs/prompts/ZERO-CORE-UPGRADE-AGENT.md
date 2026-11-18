# Master Prompt — Zero Core Upgrade, Phase 2

> Give this entire document to the AI coding agent as its task. It is self-contained: the agent must locate the
> workspace, build its own understanding from the repository, and then complete the work described below.

---

## 1. Role and mission

You are a senior software engineer working autonomously on **Zero**, a native Windows personal-intelligence
assistant (a "personal commander") owned by a single user, referred to below as **the owner**.

A first phase of work, the **Zero Core Upgrade**, adapted ten capabilities from the *design* of Hermes Agent
(Nous Research, MIT license) into Zero under Zero-native names. That phase is complete, tested and open as a pull
request. Your mission is to **finish what that plan left open**: bring the branch safely into `main`, make the new
capabilities visible and usable in Zero's existing UI, and build the four larger capabilities that were explicitly
deferred.

Work methodically and in detail. Quality, correctness and honest reporting matter more than speed.

---

## 2. Locate and understand the workspace first (mandatory before any change)

Do not write code until you have completed this orientation and can explain the system in your own words.

### 2.1 Where things are

| Item | Location |
|---|---|
| Main repository (owner's live checkout, branch `main`) | `E:\zero` |
| Upgrade branch worktree (branch `zero/hermes-merge`) | `E:\zero-worktrees\hermes-merge` |
| Pull request | https://github.com/aipubg/zero/pull/1 (`zero/hermes-merge` → `main`) |
| Plan and progress log (read first, keep updated) | `docs/plans/ZERO-CORE-UPGRADE.md` (in the branch) |
| This prompt | `docs/prompts/ZERO-CORE-UPGRADE-AGENT.md` (in the branch) |
| Hermes Agent reference source (read-only, outside the repo) | `E:\zero-reference\hermes-agent` |
| Running Zero host | `http://127.0.0.1:18789` (started from `E:\zero`) |

If any path is missing, find it (`git worktree list`, `git branch -a`, a search of `E:\`) before assuming it does not
exist. If you still cannot find it, stop and report what you looked for.

### 2.2 Read, in this order

1. `docs/plans/ZERO-CORE-UPGRADE.md`: the name map (Hermes → Zero), what was kept, what was built, the progress
   log and the "Not in this pass" list.
2. The phase-one commits: `git log --oneline fb345dff2..zero/hermes-merge` and `git show --stat <commit>` for each.
3. The modules phase one added or changed:
   - `packages/agent-runtime/prompt-layers.mjs`, `turn-budget.mjs`, `turn-reflection.mjs`, `chat-commands.mjs`
   - `packages/memory/notebook.mjs`
   - `packages/sessions/context-fold.mjs` and the Chat Recall parts of `packages/sessions/index.mjs`
   - `packages/skill-sdk/skill-read.mjs`
   - `packages/model-fabric/key-guard.mjs` and its use in `packages/model-fabric/index.mjs`
   - `services/host/automation-dispatcher.mjs` and `packages/automation/index.mjs` (`runNow`)
   - In `services/host/native-gateway.mjs`: `_sessionPrompt`, `_foldContext`, `_contextWindowFor`,
     `_scheduleTurnReflection`, `_runAskZeroJob`, and the chat loop in `_executeAgentTurn`.
4. The test harness `test/helpers/zero-chat-harness.mjs` and the eleven phase-one test files
   (`test/prompt-layers*.test.mjs`, `notebook`, `skill-catalog`, `context-fold`, `turn-budget`, `chat-recall`,
   `key-guard`, `turn-reflection`, `ask-zero-jobs`, `chat-commands`).
5. Zero's architecture as needed:
   - `packages/capability-engine/index.mjs`: `CAPABILITY_DEFINITIONS`, `CAPABILITY_PARAMETERS` and
     `registerHandler`, i.e. how a tool is declared and handled.
   - The old UI plugin `app/zero-control-ui/`: `browser.js`, `src/native-surfaces.js`, `src/shell/zero-shell.js`,
     `src/home-screen.js`, `src/voice-control.js`, `src/pages/`. It is built with `node app/zero-control-ui/build.mjs`.
   - `docs/FEATURES.md` for the feature inventory.
6. The Hermes reference, **only** for the subsystem you are about to build (for example `gateway/` and
   `plugins/platforms/telegram/` for messaging, `tools/environments/` for terminals, `tools/` for `execute_code` and
   `clarify`). Read it to understand the design, then design Zero's version yourself.

### 2.3 Confirm the current state

- `git -C E:\zero status` and `git -C E:\zero log -1`: another AI agent has been working directly in `E:\zero` with
  uncommitted edits, including `services/host/native-gateway.mjs`, `packages/capability-engine/index.mjs` and
  `packages/model-fabric/index.mjs`. Record exactly what is uncommitted, and by whom if you can tell.
- `git -C E:\zero-worktrees\hermes-merge status` must be clean at `origin/zero/hermes-merge`.
- Check the state of PR #1 on GitHub (open, merged, conflicts).

Write a short orientation note covering the architecture, the current state and the risks, and add it to the plan's
progress log as "Phase 2 — orientation".

---

## 3. Scope of work

Do the work in this order. Each numbered item is one or more plan steps. Add each step to the progress log before you
start it.

### 3.1 Integrate phase one into `main` (Step 12)

- Never discard, overwrite or commit another agent's uncommitted work. If `E:\zero` still has uncommitted edits in
  files the branch touches, **stop and ask the owner** how to proceed: wait for that agent to commit, or have the owner
  approve how to combine the two sets of changes. Do not stash or reset their files on your own initiative.
- Once `main` is clean, rebase or merge `zero/hermes-merge` onto the latest `main`. Resolve conflicts by
  understanding both sides. `native-gateway.mjs` is the most likely place for conflicts. Re-run the full comparison
  described in §5.
- Merge PR #1 only after the owner explicitly approves it. Then restart the host (procedure in §6) and verify one real
  chat end to end.

### 3.2 Make the new capabilities visible in the existing UI (Step 13)

The old UI in `app/zero-control-ui` is the product UI. Do not replace it and do not build a second UI. Extend it in
its existing style and its existing patterns (native surfaces mounted by the plugin).

- **Notebook:** a view where the owner can read, add, edit and remove entries in both books, and see how much of
  each budget is used. It goes through a host RPC that you add (for example `zero.notebook.*`), using the same
  validation as the `notebook` tool.
- **Context Fold:** a small, unobtrusive indicator in the chat when a chat has been folded, showing the number of
  folds and offering "Fold now".
- **Chat Commands:** make `/help`, `/fold`, `/notebook`, `/skills` and `/budget` discoverable in the composer, for
  example as a suggestion list when the owner types `/`.
- **Ask Zero jobs:** in Automations, the owner can create a scheduled "Ask Zero" job (prompt, schedule, optional
  skills), run it now, and open the chat where its results are kept.
- **Turn Reflection:** a setting to turn it on or off, and a quiet way to see what it kept most recently.

Build the UI with `node app/zero-control-ui/build.mjs`. Restart the host after every build, because the plugin entry
hash is read at startup. Verify each surface in a real browser (headless Chrome with `playwright-core` from
`backend/node_modules` is available) with no console errors, and take screenshots for your report.

### 3.3 Build the deferred capabilities (Steps 14–17)

For each one: read the Hermes design, write a short design note in the plan (Zero names, where it lives, how it is
wired, its risks), get the owner's go-ahead if the note marks a decision as theirs, then implement, test and commit.

1. **Zero Terminal (Step 14).** Long-lived PowerShell and cmd sessions with live output, shared by the owner and Zero.
   - A `terminal` tool for Zero with these actions:
     - `run`: waits for the exit status and returns the output; the working folder persists.
     - `open`, `send`, `read`, `list`, `close`.
     - `open_external`: opens a visible Windows Terminal window; Zero cannot read its output.
   - Host RPCs and broadcast events for the UI.
   - A Terminal surface in the UI where Zero's own sessions are marked as Zero's.
   - Note that `packages/capability-engine/aliases.mjs` currently maps `terminal` to `run_process`. Resolve that
     deliberately.
2. **Clarify (Step 15).** A tool through which Zero asks the owner a question mid-task and waits for the answer, with
   optional choices and a timeout. Deliver it through the chat UI, and through voice when a voice session is active.
3. **Code Runner (Step 16).** A sandboxed script runner, similar in spirit to Hermes `execute_code`. Run in a
   separate, time- and memory-limited process, with no network unless allowed, a working folder under the data
   directory, and output caps. It may call back into a small allow-list of Zero tools over a local channel. Document
   precisely what is and is not isolated on Windows.
4. **Messaging Gateway, Telegram first (Step 17).** A gateway service that lets the owner talk to Zero from Telegram:
   - a platform-adapter interface designed so that more platforms can be added later
   - a chat key per Telegram chat
   - an owner allow-list plus a pairing code for a new chat
   - `/stop` while Zero is working
   - delivery of replies, and of Ask Zero job results to a chosen chat
   - the bot token stored as a secret, never in config or logs, and never logged message content

   The owner must create the bot and provide the token themselves. Ask for it; do not create accounts.

---

## 4. Engineering rules (non-negotiable)

1. **Zero-native names only.** Never introduce Hermes identifiers into Zero's code (`AIAgent`, `MEMORY.md`,
   `SOUL.md`, `registry`, `toolset`, `session_search` and so on). Extend the name map in the plan for every new
   concept.
2. **Do not copy code or prompt text verbatim from Hermes.** Learn the design, then write Zero's own implementation
   and wording. Keep the attribution line in the plan.
3. **Single Room rule.** Every tool is declared in `packages/capability-engine` (`CAPABILITY_DEFINITIONS` and
   `CAPABILITY_PARAMETERS`) and executed through the canonical capability engine. Host-dependent handlers are
   registered from the host, like the existing `notebook` and `chat_search`.
4. **Only wired code counts.** A step is done when the running chat loop or UI uses the code and a test proves it.
   Dead modules are not progress.
5. **Prompt stability.** Never change a chat's frozen system prompt between messages. Anything that depends on the
   current message goes into a per-turn hint after the history.
6. **One step, one commit.** Use a conventional commit message that explains why, and update the progress-log row in
   the same commit. End every commit message with this trailer:
   `Co-Authored-By: <your model name> <noreply@anthropic.com>` (or your organisation's equivalent).
7. **Security:**
   - Keep the Key Guard behaviour.
   - No secrets in config files, logs, test fixtures or commit history.
   - Keep the Notebook's checks for secrets and model-directed instructions.
   - No user message content in logs.
8. **Owner's environment:**
   - Never close the owner's applications or windows.
   - Never type into the owner's desktop.
   - Never change the owner's model keys or theme.
   - Never run destructive commands without explicit approval.
   - Directories under `node_modules` in the worktrees are **junctions** to `E:\zero\backend\node_modules`. Remove a
     junction only with `cmd /c rmdir <path>`, never with a recursive delete, and do not remove a worktree that
     contains them before unlinking them.
9. **Scope discipline.** Do not reintroduce predefined app-specific scripts (for example YouTube, Spotify or WhatsApp
   recipes) into prompts or UI. Zero is general-purpose.
10. **Honesty.** Report failures, skipped checks and uncertainty plainly. Never claim something works without
    evidence.

---

## 5. Verification standard

- **Unit and chat-level tests** for every step. Use `test/helpers/zero-chat-harness.mjs`, which runs a real
  `ZeroNativeHost` against a scripted local model server, for anything that goes through the chat loop.
- **Full-suite comparison** before every merge and at the end:
  - Run every offline test file on a clean checkout of the base commit and on your branch: each file under
    `packages/*/test`, `app/zero-control-ui/test` and `test/`, run with `node --test`, excluding files whose names
    contain `real`, `live`, `browser`, `human`, `integration` or `e2e`, and files that reference port `18789`.
  - The set of failing files on your branch must be the same as, or a subset of, the base's set.
  - For phase one the base was 57 pass / 15 fail and the branch 68 pass / 15 fail, with the same 15 files failing on
    both.
- **UI work:** verify in a real browser with screenshots and with no new console errors.
- **Live check after merging**, only with the owner's consent and with a configured model key: run one real chat
  that exercises the Notebook, a forced `/fold` and a chat search.

---

## 6. Operating notes

- **Runtime:** Windows 11, Node.js 24 (ESM, `node:sqlite` with FTS5), PowerShell 5.1 and Git Bash.
- **Restart the host**, from PowerShell in `E:\zero`:
  1. Stop the process listening on port 18789.
  2. `Start-Process "C:\Program Files\nodejs\node.exe" -ArgumentList "backend/server/zero-host.mjs" -WorkingDirectory E:\zero -WindowStyle Hidden -RedirectStandardOutput E:\zero\zero-host.log -RedirectStandardError E:\zero\zero-host-error.log`
  3. Check `http://127.0.0.1:18789/health`.
- **A second host for tests** must use a random free port and a temporary data folder. Never use port 18789 or the
  owner's `.zero-data`.
- **GitHub:** the `gh` CLI is not installed. Use `git` for pushes. For pull-request operations, use the GitHub REST
  API with the credential git already stores (`git credential fill`), and never print the token.

---

## 7. Decision points: stop and ask the owner

- Merging PR #1 or anything else into `main`, and any history rewrite on a shared branch.
- How to combine your work with another agent's uncommitted changes.
- Creating any external account or bot, or entering any token or credential.
- Any capability that sends the owner's data to a new external service.
- Anything that would change the owner's existing settings, keys or UI theme.

Ask one clear question with your recommendation, then wait. Continue with independent work while you wait.

---

## 8. Definition of done

- Steps 12–17 are all marked done in the progress log, each with its commit hash, a short description and the test
  files that prove it. Any step that was blocked has its reason recorded.
- The full-suite comparison shows no new failing files.
- The UI surfaces are verified in a browser, with screenshots.
- PR #1 is merged, or is explicitly waiting on a recorded owner decision.
- The final report described in §9 has been delivered.

---

## 9. Final report format

Write it in plain language for the owner, who reads Hindi and English. Keep sentences short and avoid jargon.

1. **What changed:** one line per step, with its commit.
2. **How it was verified:** tests, before/after suite numbers, browser checks.
3. **What was not done or not verified, and why.**
4. **Decisions the owner still needs to make.**
5. **Where everything is:** branch, pull request, plan file.
