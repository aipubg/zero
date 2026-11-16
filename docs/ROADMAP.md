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
- `done` `see_screen`, browser actions and typing moved out of
  `services/host/native-gateway.mjs` into
  `packages/capability-engine/desktop-actions.mjs`. The gateway's chat loop
  now only routes (the file went from 5010 to 4626 lines). Chat, RPC and
  automations get the same behaviour.
- `done` The model is shown real arguments for every capability.
- `done` The engine's click "reflex" is limited to a named control (three or
  more characters) and never types. Before, a failed typing could click any
  control whose name loosely matched and type into it.
- `done` A screen frame goes to a vision model once, as an image, instead of
  also being pasted into the text of the tool result.
- `done` `backend/gateway/server.mjs` retired. The routes still in use
  (`/health`, `/v1/models`, `/v1/chat/completions`, `/api/gateway/proxy`,
  `/api/gateway/local-gguf/*`) moved to `services/host/model-http-api.mjs`.
  Removed with it: a third agent loop inside `/v1/chat/completions` that ran
  computer actions for any local caller, the unauthenticated
  `/api/zero/computer` and `/api/zero/media` control routes, and a second
  set of task, memory and automation stores on the same database files.
  `/v1/chat/completions` is now a plain model proxy and uses the same API
  key resolution as the assistant.
- `todo` `/health/readiness` and `/health/features` return fixed text, not
  measured state.
- `todo` Unknown `GET /api/...` paths fall through to the UI page instead of
  a 404.
- `todo` The remaining `backend/gateway/*.ts` files (client, sdk, registry,
  hooks, cache, telemetry) are only used by each other; confirm and remove.
- `todo` The keyboard-destination rule lives in the gateway loop; move it
  into the engine so RPC callers get it too.

## Phase 3 — Eyes and hands  (`partial`)

- `done` Screenshot fallback no longer fails on large frames.
- `done` Every screen/input action waited 4 s for a daemon that never starts;
  it now falls back at once (capture 4.3 s -> 0.35 s).
- `done` The one-off action script (`win-actions.ps1`) is now a real set of
  hands: UI Automation element discovery, window focus/minimize/maximize/close
  by title or app, the real top-level window list, Unicode typing (any
  language), hotkey combinations, and every action name the driver uses.
- `done` Typing inserts at the caret and never rewrites a control. The old
  path could replace a whole document with the typed text.
- `done` `open_app` waits for the app's window and brings it to the front.
- `done` Keyboard input is only sent to a named window, or to one Zero opened
  or focused in the same request. Closing a window needs an exact match.
- `done` The model is shown the arguments of `zero_computer_action`,
  `browser`, `open_app` and `spotify_control`.
- `todo` Windows Defender blocks `win-actions-daemon.ps1`, so each action
  starts a new PowerShell (0.35–0.6 s). A persistent helper that the
  antivirus accepts would bring this under 0.1 s. Do not hide code from it.
- `todo` `uia_invoke`, `uia_set_value`, `apply_playback_settings` and
  `inspect_media_playback` exist only in the blocked daemon.
- `todo` Desktop runtime is not installed (`artifacts/zero-desktop-runtime/bin/zero-desktop.exe`
  is missing), so accessibility snapshots are off. `scripts/install-agent-desktop.mjs`
  points at a release URL that was broken by a blanket rename; fix the URL and
  checksum before running it.
- `todo` A simple WinForms test window exposed only 2 elements; check
  element discovery on more app types.
- `todo` Each GUI step costs one model round trip (~5 s). Let the model send
  a short batch of actions in one call.
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
