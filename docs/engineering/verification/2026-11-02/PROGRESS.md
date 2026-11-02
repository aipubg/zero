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
- Persistent observation fields now default to authenticated AES-256-GCM with a
  Windows-user DPAPI-protected key. Three actual Windows tests verify ciphertext,
  reopen, missing-key/field-swap rejection and recoverable plaintext migration.
  Explicit pre-migration rollback snapshots retain plaintext; backup encryption
  and key rotation are still separate remaining work.
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
| Encrypted endurance | IN_PROGRESS at checkpoint | PID 15716, `artifacts/screen-intelligence/endurance-encrypted-20261102/summary.json`, started 2026-11-02 01:03:02 UTC (06:33 IST), requested 86400000 ms. Recheck process and fresh telemetry before any later claim. Earliest completion November 3 around 06:33 IST if uninterrupted. The older PID 10656 run was intentionally stopped and remains incomplete. |
| External mobile/cloud | BLOCKED | Owner confirmed no actual devices/remote or cloud worker. Local registration/protocol tests do not close these gates. |

Initial browser runs retained in `artifacts/functional-browser/` caught an invalid
native `closest()` selector, unauthenticated fallback panel, incorrect filter
locator, and incomplete uninstall confirmation. They were repaired and rerun;
their failures are not rewritten as past passes.

## Required remaining work — do not narrow the master scope

1. Finish observation backup encryption and key-rotation recovery tests. Current
   field encryption and user-bound key unlock pass their three Windows tests;
   legacy rollback snapshots remain plaintext and are explicitly reported.
   Extend the bounded local vision validation below to wider screen accuracy,
   model selection/routing and longer resource measurements.
   Complete sleep/lock/multi-monitor and full 24-hour resource gates.
2. Complete acoustic voice reliability and genuine spoken barge-in. Speech-end,
   transcription, shared durable chat/task execution and reply synthesis now pass
   their real OS/external gate; microphone/device playback pass a separate native
   gate. Voice stays PARTIAL. No new owner permission popups were added.
3. Complete real Models/Providers and Agents editing/assignment UI tests, novel
   planning, all retained important screens and settings. Current planning is
   explicitly heuristic-partial; one configured chat identity is not a full
   dynamic agent-management workflow.
4. Complete external skill import/update/removal through UI; verify an actual
   third-party executable plugin and adapter. The passing UI plugin test uses
   the existing Zero System Tools package, not an external marketplace plugin.
5. Verify genuine multi-provider and local offline inference, cancellation,
   contextual memory use, durable restart recovery and general desktop actions
   through chat. Browser chat sending/reply/reload now pass the scoped gate below.
6. Complete connected service workflows, distributed/mobile supported clients,
   release packaging, clean-machine install, restore/rollback and full regression.
   Preserve prerequisites as BLOCKED where unavailable, not PASS.
7. Extend classification beyond the 137 historical audited leaves to all new
   acceptance runners; current historical inventory integrity is valid, while
   its NOT_RUN result is not a current product test run.

## Continuation

Encryption follow-up: the new field protection passes all 13 targeted screen and
encryption tests, and `artifacts/screen-intelligence/20261102-encrypted-real-os/report.json`
passes actual capture/OCR/persistence after the encryption change. The eight real
browser workflows also passed again in `artifacts/functional-browser/1793581323377/report.json`.
The unencrypted endurance run PID 10656 was intentionally stopped through its
STOP control after 400341 ms to test the updated encrypted implementation; it
retains `verdict: incomplete`, 166 successful captures and no 24-hour certificate.
The replacement run lives under
`artifacts/screen-intelligence/endurance-encrypted-20261102/`. Its live PID and fresh
telemetry must be revalidated before reporting continued operation or completion.

Verified source milestones: `bd4607f` research/backups; `9e811aa` execution/lifecycle;
`d3670ee` actual screen/OCR and Windows speech. See the following UI commit for
host integration and browser runners. No modules or owner data were removed.
Backup `.backup/functional-correction-1793549776379` contains 19 prior DB/config
snapshots with SQLite integrity checks; full restore remains unverified.

Run the scoped browser runner with `node scripts/functional-browser-check.mjs`.
It launches/stops only its own isolated hosts and preserves disposable state for
inspection. External skill verification is `node scripts/verify-external-skill.mjs`;
`--resume-directory DIR` only rechecks a recorded completed task/artifact.

## Chat and voice correction — 01:30 UTC checkpoint

- [browser-chat-voice-ten-flows.json](browser-chat-voice-ten-flows.json): ten actual
  Chrome workflows pass, including sending a message through the existing
  composer, a real NVIDIA reply rendered in chat, persisted reply after reload,
  actual Windows microphone start/stop, and automatic microphone cleanup when
  its owning browser connection closes. Eight existing flows remain passing.
- [browser-chat-startup-failure.json](browser-chat-startup-failure.json) retains
  the real missing `chat.startup` failure. Other attempts under
  `artifacts/functional-browser/` preserve missing session defaults, outbox
  recovery scope, locator failures, an upstream 60-second timeout, and missing
  native `chat` stream events. Fixed contracts now carry actual session IDs,
  pagination, a stable recovery namespace, and native delta/final events.
- [voice-shared-chat.json](voice-shared-chat.json): real Windows speech PCM enters
  the actual authenticated WebSocket/VAD/STT path; the same durable executor
  answers from the preceding chat context and synthesizes its real reply.
  Input speech was Windows synthesized speech, not a human microphone utterance.
- [voice-real-devices.json](voice-real-devices.json): real default microphone
  returned 99 frames / 95040 bytes; actual output playback consumed 77600 PCM
  bytes. Human audibility and acoustic barge-in remain UNVERIFIED. No raw
  microphone audio was saved. Voice remains PARTIAL.
- Model SSE reasoning tokens are now separated from assistant content and speech.
  A transport contract test checks the two channels directly. One live rerun
  failed an over-restrictive 200-character answer assertion; answer length is
  not evidence of channel separation, so that assertion was removed rather than
  misreporting the failed run as a pass. Later success is a separate execution.
- Session compaction now archives only from model context instead of deleting
  history. File-backed reopen checks preserve every original message, complete
  tool exchanges and their tool-call IDs. Incomplete/orphan tool chains are
  excluded from provider context without inventing results or changing history.
- Combined voice/session/model/UI regression: 64 tests passed, comprising
  UNIT/CONTRACT/INTEGRATION checks; this is not 64 real-world acceptance gates.
- Remaining native chat work includes durable idempotency receipts and interrupted
  request recovery. Successful ordinary sends do not certify those scenarios.
- Observation adapter verification is recorded separately below.

## Native observation lifecycle — 01:33 UTC checkpoint

[browser-observation-eleven-flows.json](browser-observation-eleven-flows.json)
passes eleven real Chrome workflows. About now uses the existing durable
observation lifecycle with actual native capture, instead of a wrapped telemetry
object its controls could not interpret. Enable waits for a real first capture;
failure never becomes a successful capture status. Private Mode stops capture
and clears app-owned frames. Actual process restarts verify Private Mode remains
on, enabled observation resumes when private mode is off, and disabled capture
stays disabled. Real summary retrieval and encrypted field status are checked.
No owner permission prompt or new screen was added.

The native adapter preserves unrelated preference fields and uses atomic
replacement of the preference file. Three additional CONTRACT/INTEGRATION tests
exercise file-backed reopen, original settings preservation, private buffer
clearing and capture/storage failures; all 21 native/legacy lifecycle tests pass.
These deterministic adapter tests are not counted as real screen capture.
The standalone encrypted 24-hour run is separate, remains incomplete, and was
not restarted by these isolated browser process tests. Local vision installation
and bounded validation followed at the checkpoint below.

## Local GGUF vision — 01:47 UTC checkpoint

- [local-vision-provisioning.json](local-vision-provisioning.json) records official
  llama.cpp `b11960` Windows CPU runtime and `ggml-org/SmolVLM-256M-Instruct-GGUF`
  revision `b9e4379657e1450d04d02eec8e345667265b0a00`, including exact sizes,
  download URLs and verified SHA-256 values for runtime/model/projector.
  `node scripts/install-local-vision.mjs` reproduces installation; weights and
  binaries remain ignored local dependencies, not committed project source.
- [local-vision-inference.json](local-vision-inference.json) passes actual local
  text generation and red/blue/green pixel recognition, followed by cancellation
  of a real in-flight request, termination of its owned process and successful
  fresh-process inference. Child CPU threads are bounded to two. Provider
  credentials are excluded from the native child environment. Inference uses
  local model files and loopback HTTP; no cloud image fallback is present.
- [local-vision-screen-memory.json](local-vision-screen-memory.json) passes two
  actual visible Windows desktop changes. Native capture and Windows OCR see the
  controlled Chrome window, the local model identifies blue then green, and
  image SHA/model/timestamps accompany the encrypted observation. Reopen retains
  both retrievable results. No dummy frames/buffers or manually inserted model
  answers were used. The test explicitly asks the model for the dominant page
  background color; the production description prompt remains general.
- [local-vision-unrequested-color-failure.json](local-vision-unrequested-color-failure.json)
  retains an earlier failed expectation: the general prompt accurately described
  the browser/marker but did not mention an unrequested color. A separate earlier
  OCR exact-match failure is retained under `artifacts/local-vision-screen/`;
  marker matching now tolerates intervening recognition artifacts while requiring
  all marker words in real OCR. These runs remain failures, not rewritten passes.
- Native observation now schedules at most one background vision request, while
  capture/OCR continue. Model results update their original observation with an
  image hash and `verified:false`; no confidence is invented. Failure preserves
  OCR context and never creates a successful vision result. Stop/Private Mode
  cancel work and unload model/KV buffers. Generation checks discard late work.
  Four additional UNIT/CONTRACT/INTEGRATION tests pass; 17 scoped screen tests
  pass in total. They are not substituted for the real inference runners.
- `models/local-vision.json` configures the installed small model, two CPU threads
  and at most one sampled changed frame per minute. Loading is lazy; enabling
  this model does not start screen capture. Existing observation preference and
  Private Mode remain authoritative. Missing binaries/weights report unavailable.
- [browser-with-local-vision.json](browser-with-local-vision.json) passes all
  eleven browser workflows after integration, including real NVIDIA chat,
  microphone, observation and actual restart cases. Its labels now also include
  REAL_EXTERNAL/REAL_OS; older reports used narrower runner labels.

This proves bounded local execution and controlled color recognition, not broad
vision accuracy, general local chat/tool routing, or 24-hour vision endurance.
The older PID 15716 endurance run measures capture/OCR without this new local
vision pipeline; it cannot certify the new model's resource behavior. A full
combined resource/endurance gate is still required. Production sign-off remains
BLOCKED and external mobile/cloud prerequisites remain unavailable.

## Owner deployment and data preservation — 02:00 UTC checkpoint

Verified code is running on the owner's native host at port 18789, PID 6172.
The previous owned PID 8972 was checked for active durable tasks before restart;
the intermediate PID 16380 was subsequently replaced after the startup settings
correction below. No active durable task was interrupted. Health is operational;
this is a deployment checkpoint, not a production completion declaration.

[owner-data-after-upgrade.json](owner-data-after-upgrade.json) compares all 5,115
original rows across 29 SQLite tables against the consistent owner backup at
`.backup/functional-correction-1793584247114`. Original columns are compared by
row-content digest, allowing added columns/rows. Scheduler `last_run`/`next_run`,
connector `updated_at`, and worker `last_heartbeat` are explicitly checked for
monotonic progress; definitions/configuration and message contents remain exact.
The earlier timestamp review in
[owner-data-runtime-timestamp-review.json](owner-data-runtime-timestamp-review.json)
remains recorded as FAIL; review identified advancing runtime timestamps, not
lost definitions. The subsequent audit states its narrower preservation policy.

Review also found default seeding could overwrite owner-customized built-in
connector/worker definitions on restart. Defaults now only fill missing connector
records and preserve local worker definitions while refreshing liveness. Actual
file-backed restart tests preserve custom names/configuration/capabilities.
Automation/worker regressions pass 22 tests. A separate real-SQLite audit test
accepts additive schema/data changes and rejects original message mutation and
deletion; it does not merely compare row counts.

Backup now includes paired `.key.dpapi` files, which the earlier backup glob
omitted. [backup-encrypted-pair.json](backup-encrypted-pair.json) checks an actual
captured observation snapshot, SQLite integrity, and authentication of seven
encrypted fields through its copied DPAPI key. Full restore/rollback and
cross-machine/key-rotation recovery remain separate unfinished gates.

## Native resource instrumentation — 05:49 UTC checkpoint

[native-resource-partial.json](native-resource-partial.json) records actual
Windows process CPU and peak working-set counters for OCR and native foreground
metadata. The OCR wrapper runs the existing OCR script in the same measured
process, so its startup/recognition CPU is included. Native action processes
report cumulative counters; consumers must deduplicate by PID rather than sum
the same daemon repeatedly. Capture records retain the resource provenance.

The actual capture backend was `cua-driver`, whose process accounting is not yet
available. The runner correctly reports PARTIAL, not whole-pipeline resource
PASS. Model process accounting and a combined capture/OCR/vision endurance run
remain required. Fourteen scoped screen/pipeline regression tests passed after
instrumentation. The owner host has not been restarted for this instrumentation
alone; its existing loaded modules retain the prior OCR path until next restart.

PID 15716 was independently checked alive with fresh telemetry at 05:48 UTC:
4.759 measured hours, 7,145 successful actual captures/OCR and zero capture
failures. It remains incomplete and covers the earlier capture/OCR pipeline,
not the new vision model or full subprocess resource accounting. Its original
loaded OCR path remains unchanged; no early completion certificate was issued.

## Connector probe honesty correction

`testConnector()` no longer fabricates healthy/connected responses. Webhook
probes perform an actual bounded HEAD request and report only reachability;
CLI probes actually execute the configured binary with literal `--version` and
no implicit shell. Nonzero/missing binaries and HTTP errors fail; unsupported
adapters remain unavailable. Neither successful probe claims functional service
execution. Real local HTTP/CLI tests plus automation/settings regressions pass
seven tests. The historical phase11 healthy-status expectation is superseded
and still requires re-audit; it is not counted as currently passing. Owner host
PID 6172 retains the previous loaded connector implementation until next restart.
