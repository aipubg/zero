# Functional correction checkpoint — 2026-11-02

Product status remains **PARTIAL**. The complete master objective remains active;
these scoped results are not a production sign-off. Existing UI and owner data are
retained. Tests that mutate state use disposable directories and host processes.

## Implemented and observed

- Native UI plugin uses its actual authenticated host connection. The fallback
  mount against `window` was removed; that fallback created controls without a
  working RPC client. Canonical plugin asset URLs now pass the native loader's
  origin/path check. Project display-name projection fixes the chat render crash.
- Skills package acquisition, configuration, enable/disable, update, removal and
  durable execution now use actual bundles, models, capability calls and outputs.
  Unverified successful tool observations can inform a skill; task completion does
  not assert independent verification of its requested outcome.
- Plugin installation loads actual executable handlers, persists source revisions,
  restores them in fresh processes, gates disabled handlers, and preserves plugin
  data on removal. Missing handlers no longer receive fabricated success handlers.
  Existing Plugins settings now include a local-directory/npm install form.
- Independent specialist inference and tool loops run with assigned models.
  Worker handoffs execute actual local child processes and preserve results;
  registrations and interrupted handoffs do not imply completion.
- Windows screen capture produces actual PNGs and metadata; WinRT OCR recognizes
  real text. Capture serializes, stops invalidate late work, and summaries persist.
  Native Windows speech replaces tone/transcription placeholders.
- Search separates retrieved citations from independently verified claims.
  The legacy `plugins/web-tools` search/extraction placeholders were also replaced
  with actual retrieval. Health/features reports no longer invent loaded plugins,
  active screen capture, or a fixed installed skill count.

## Evidence and limitations

| Gate | Current result | Exact evidence scope |
|---|---|---|
| Component regression | PASS: 87 tests | Targeted capability, task, skills, plugins, workers, screen, voice and search suites. Includes fixture-backed UNIT/CONTRACT/INTEGRATION tests; not 87 real-world features. |
| Generic local tools | PASS: 2 tests | Actual file write/read, literal subprocess arguments, process failure, deadline and cancellation (`test/local-tools.integration.test.mjs`). |
| Existing UI component regression | PASS: 27 tests | Mount/product-path/product-surface suites; fake-DOM component contracts, not browser acceptance. |
| Eight browser workflows | PASS | [browser-eight-flows.json](browser-eight-flows.json), actual Chrome: composer input, persisted memory search, skills filtering and enable/disable persistence, actual search and separately fetched source, executable bundled plugin install/invoke/disable/restart/enable/remove, wheel scrollTop 0→500, same-page new WebSocket handshake after actual process restart. |
| Two-model external execution | PASS after a retained failure | [agents-budget-failure.json](agents-budget-failure.json) retained: both children executed, coordinator exhausted 256 output tokens. [agents-live-pass.json](agents-live-pass.json): 2048-token budget, two distinct NVIDIA models, 732 ms initial-request overlap, two actual tool-created files, consolidation and persisted task/messages/checkpoint. |
| Real external skill | PASS, independently checked artifact | [external-skill-artifact-pass.json](external-skill-artifact-pass.json): actual `anthropics/skills` frontend-design at `ca45fc496a3436251f191354091d557da31c15b5`, three NVIDIA model rounds, actual write/read calls. HTML SHA-256 `fc331f1d361298a6bf13a67a541ea1bd6ef3c9f72aa3a6a2f0cd6c48a436790b`; Chrome counter 0→1→2, no page errors. Initial accessible-name locator failure retained in [external-skill-initial-locator-failure.json](external-skill-initial-locator-failure.json). Successful verification reopened the same completed task and checked the unchanged artifact; it did not fabricate another model execution. |
| Native speech | PASS: 4 native tests | Real Windows synthesis produced 100320 PCM bytes using Microsoft David; real dictation recognized “The boys engine can now speak real words”. This proves synthesis/STT in memory, not microphone recording, audible speaker output or acoustic barge-in. |
| Native capture/OCR | PASS, bounded integration | `artifacts/screen-intelligence/20261102-real-os/report.json`: known rendered text OCR, actual desktop PNG/OCR/foreground metadata and SQLite reopen. Does not prove local vision or 24-hour operation. |
| Prior endurance | INCOMPLETE | Previous PID 13732 absent when rechecked; final sample only 170173 ms. Stale `running` file is not live-process evidence and does not pass endurance. |
| New endurance | IN_PROGRESS at checkpoint | PID 10656, `artifacts/screen-intelligence/endurance-20261102/summary.json`, started 2026-11-02 00:55:28 UTC (06:25 IST), requested 86400000 ms. Recheck process and fresh telemetry before any later claim. Earliest completion November 3 around 06:25 IST if uninterrupted. |
| External mobile/cloud | BLOCKED | Owner confirmed no actual devices/remote or cloud worker. Local registration/protocol tests do not close these gates. |

Initial browser runs retained in `artifacts/functional-browser/` caught an invalid
native `closest()` selector, unauthenticated fallback panel, incorrect filter
locator, and incomplete uninstall confirmation. They were repaired and rerun;
their failures are not rewritten as past passes.

## Required remaining work — do not narrow the master scope

1. Observation field encryption and key lifecycle; current summary SQLite is not
   encrypted. Validate local vision model/runtime/projector and actual inference.
   Complete sleep/lock/multi-monitor and full 24-hour resource gates.
2. Connect voice speech-end/transcription to the same durable chat/task context,
   synthesize the real reply, and verify microphone, actual output and barge-in.
   Voice stays PARTIAL. No new owner permission popups are required by this design.
3. Complete real Models/Providers and Agents editing/assignment UI tests, novel
   planning, all retained important screens and settings. Current planning is
   explicitly heuristic-partial; one configured chat identity is not a full
   dynamic agent-management workflow.
4. Complete external skill import/update/removal through UI; verify an actual
   third-party executable plugin and adapter. The passing UI plugin test uses
   the existing Zero System Tools package, not an external marketplace plugin.
5. Verify genuine multi-provider and local offline inference, cancellation,
   contextual memory use, durable restart recovery and general desktop actions
   through chat. Current browser composer gate tests draft entry, not chat reply.
6. Complete connected service workflows, distributed/mobile supported clients,
   release packaging, clean-machine install, restore/rollback and full regression.
   Preserve prerequisites as BLOCKED where unavailable, not PASS.
7. Extend classification beyond the 137 historical audited leaves to all new
   acceptance runners; current historical inventory integrity is valid, while
   its NOT_RUN result is not a current product test run.

## Continuation

Verified source milestones: `bd4607f` research/backups; `9e811aa` execution/lifecycle;
`d3670ee` actual screen/OCR and Windows speech. See the following UI commit for
host integration and browser runners. No modules or owner data were removed.
Backup `.backup/functional-correction-1793549776379` contains 19 prior DB/config
snapshots with SQLite integrity checks; full restore remains unverified.

Run the scoped browser runner with `node scripts/functional-browser-check.mjs`.
It launches/stops only its own isolated hosts and preserves disposable state for
inspection. External skill verification is `node scripts/verify-external-skill.mjs`;
`--resume-directory DIR` only rechecks a recorded completed task/artifact.
