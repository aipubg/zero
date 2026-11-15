# Zero — Roadmap

Zero is a native, self-owned Jarvis for one owner on Windows: it uses the
computer (mouse, keyboard, screen), drives the browser, runs backend work
directly when no GUI is needed, and carries long-running goals.

Rules that every phase follows:

- **One room.** Every tool lives in `packages/capability-engine/`. The gateway
  only routes; it does not implement tools.
- **Backend first.** A task that a command or file operation can do is done
  with `run_process` / `read_file` / `write_file`. The GUI is used only when
  the task is about something on screen.
- **Honest results.** A step is reported as completed only when it ran and was
  observed. A failure is reported as a failure.
- **Proof, not reports.** A phase is done when a real run shows it, not when a
  script prints "pass".
- **Own names.** Reused code is renamed to Zero's own vocabulary.

Status values: `done`, `partial`, `todo`.

## Phase 1 — The agent loop works  (`done`)

- Chat tool calls reach their own handlers.
- The model sees real argument names for every tool.
- Streamed tool arguments no longer crash the turn.
- Assistant text is not repeated across tool turns.
- Observation tools (`see_screen`, screenshots, reads) are never skipped as
  "duplicates"; only an identical side-effecting call is reused.
- When the step budget runs out, Zero still writes a final answer.
- Tool choice: backend tools first, GUI tools only for on-screen work.
- No test-specific strings in the production loop.

## Phase 2 — One room, for real  (`partial`)

- `done` Duplicate copies of media control, mode manager and desktop driver
  removed; one copy in the engine.
- `todo` Move the inline `see_screen`, browser and `type_text` code out of
  `services/host/native-gateway.mjs` into engine handlers.
- `todo` Retire `backend/gateway/server.mjs` (still imported for
  `handleZeroGatewayRequest`).
- `todo` Give every action-dispatch capability (`zero_computer_action`,
  `browser`) a real per-action argument schema.

## Phase 3 — Eyes and hands  (`partial`)

- `done` Screenshot fallback no longer fails on large frames.
- `todo` Desktop runtime is not installed (`artifacts/zero-desktop-runtime/bin/zero-desktop.exe`
  is missing), so accessibility snapshots are off. `scripts/install-agent-desktop.mjs`
  points at a release URL that was broken by a blanket rename; fix the URL and
  checksum before running it.
- `todo` UI element discovery returns nothing for Electron/Chromium windows.
- `todo` A capture takes 4–9 s; target is under 1 s (keep the capture helper
  process warm).
- `todo` A simple browser task took 62 s end to end; most of it before the
  first token. Measure browser start and model latency separately.
- `todo` Local vision: `models/local-vision.json` points at a
  `llama-server.exe` that is not on disk.

## Phase 4 — Clean workspace  (`partial`)

- `done` One-off probe/verify scripts and tests that import deleted files
  removed (56 files).
- `todo` Fix the 14 failing offline test files or delete the ones that test
  removed behaviour.
- `todo` Split `services/host/native-gateway.mjs` (5000 lines) by concern.

## Phase 5 — Control UI is Zero's own  (`partial`)

- `done` Page titles and shortcut symbols no longer show broken characters.
- `done` The fallback dock no longer mounts a second composer on `/new` when
  the real one is only scrolled out of view or the tab is hidden.
- `todo` The fallback dock renders tool results as raw JSON.
- `todo` Progress card shows a warning icon next to successful steps.
- `todo` Leftover upstream wording in Appearance ("Lobsterdex").
- `todo` Service-worker registration error on every page.
- `todo` Sidebar is full of old test sessions with identical titles.
- `todo` Replace the always-pass style check, the 250 ms composer watchdog and the
  scroll-reset script with a real fix in the UI source.

## Phase 6 — Long-running Jarvis  (`todo`)

- Prove `goal_plan` → scheduled job → milestone progress across a restart.
- Prove automations fire on schedule and report outcomes.
- Run Zero Host as a Windows service/startup task so it survives reboots.
- Set a fallback model so one provider outage does not stop chat.
- Two-way voice: verify the full speak → reply → speak loop on real hardware.

## Phase 7 — Company work  (`todo`)

- Workspaces/projects with their own memory and files.
- Email, calendar and document connectors.
- Delegation to specialist agents with review before anything is sent out.
