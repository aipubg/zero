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

The revised phase11 suite subsequently passed all four leaves against an owned
disposable process via `node scripts/verify-automation-isolated.mjs`. Evidence:
[automation-isolated-pass.json](automation-isolated-pass.json). The initial run
[automation-isolated-failure.json](automation-isolated-failure.json) exposed a
generic RPC error for an actual HTTP 503; the probe now surfaces that status in
its error message. Failure assertions match the gateway's actual error envelope.
Both runs retain their logs in `artifacts/automation-acceptance/`. This closes
the scoped scheduling/event/template/local-probe suite, not third-party service
execution. The owner host and its stored jobs were not used by either run.

Automation failure propagation follow-up: scheduled/event executors that resolve
with `ok:false` or `success:false` now produce failed runs, rather than completed
runs merely because no exception was thrown. A CONTRACT regression verifies both
paths and the persisted scheduled error. Six component tests pass, and the four
isolated RPC leaves pass again in
`artifacts/automation-acceptance/1793598792402/report.json`. Positive native output
assertions beyond execution status still require expansion; no broad workflow
completion claim follows from this failure-propagation correction.

Positive native outputs are now checked by the isolated phase11 suite as well:
the scheduled window query must return an actual PID and positive window bounds,
and persisted history must exactly retain that tool result. The conditional event
test must return positive native screen dimensions while retaining
`verified:false`. [automation-native-outcomes.json](automation-native-outcomes.json)
records the passing four-leaf rerun. Events in this test are explicitly emitted
test inputs; actual OS event-source wiring remains a separate open requirement.

Screen-event wiring implementation now connects native observer change events to
the configured automation rule engine. It dispatches only actual application/title
transitions after a baseline, carries observation provenance and excludes raw OCR
text. It does not create rules from observed content. Teardown removes the
listener and drains pending dispatches. A deterministic CONTRACT test passes and
the four existing isolated RPC leaves still pass. A real captured window change
causing a configured action through this new bridge remains NOT_RUN; neither the
contract test nor manually emitted RPC events close that acceptance gate. Owner
PID 6172 does not load the new bridge until a subsequent verified restart.

The bounded real captured-transition gate subsequently passed:
[screen-automation-real-os.json](screen-automation-real-os.json). A visible Chrome
test window changed its native title; four real captures observed one transition,
which matched the persisted rule and executed a native screen-size query returning
1920×1080. Repeated captures of the same window did not retrigger. No handcrafted
screen event was dispatched in this runner. The initial
[screen-automation-title-race.json](screen-automation-title-race.json) remains FAIL:
DOM title change had not yet reached the OS title at the immediate capture. The
runner now waits for the actual captured title rather than assuming propagation.
This proves the screen-to-rule/action seam; UI configuration, broader event types
and sustained event execution remain separate acceptance work.

Screen automation status now also counts configured rule failures returned as
resolved dispatch results, rather than only thrown dispatcher exceptions.
Observation status exposes the bridge's counters/error. Both bridge CONTRACT
tests pass and the real Windows transition/native action runner passes again in
`artifacts/screen-automation/1793599071198/report.json`. Owner host reload and UI
rendering of these additional diagnostic fields remain unverified separately.

## Automation/resource deployment checkpoint — 05:59 UTC

[browser-after-screen-automation.json](browser-after-screen-automation.json)
passes the eleven real browser workflows after all automation/resource changes.
Six targeted component/contract/integration regressions also pass. The owned
host PID 6172 was replaced by PID 15384 after confirming zero running durable
tasks and creating `.backup/functional-correction-1793599149884` (21 files,
SQLite integrity OK). The live native host health is operational, with no startup
stderr. Connector probes, native resource instrumentation, screen-event wiring
and failure diagnostics are now loaded in that process.

[owner-data-after-automation.json](owner-data-after-automation.json) again
preserves the original 5,115 rows across 29 tables under the explicit monotonic
runtime-clock policy. This live deployment checkpoint does not expand the scoped
browser/OS tests into production sign-off or certify unfinished workflows.

Durable assistant request receipts are now integrated at the shared chat/voice
executor entry. Identical concurrent requests share execution; completed results
survive database reopen. Reusing an ID for different input is rejected. Failed
or interrupted requests are never automatically re-executed under that ID.
A file-backed integration test verifies a single filesystem effect across
concurrent retries/reopen and rejection of collisions/failures/interrupted state.
Session continuity regressions also pass. Actual WebSocket retry, UI reconnect
replay and receipt/task crash recovery gates still require real execution; this
component evidence alone does not close them. Owner PID 15384 retains its prior
loaded executor until the updated path passes those gates and is reloaded.

The real authenticated WebSocket retry gate now passes in
[websocket-retry-voice.json](websocket-retry-voice.json): concurrent identical
requests return the same actual NVIDIA-backed task, completed replay makes zero
additional upstream model calls, and only one user message is persisted. The
same run also passes actual Windows STT/TTS and shared chat/voice continuity.
This uses genuinely synthesized speech, not a human microphone utterance.
Fresh-process receipt replay, UI reconnect replay and interrupted-task recovery
still require their own gates; no owner host reload was performed for this test.

Fresh-process completed receipt replay subsequently passes in
[browser-restart-request-replay.json](browser-restart-request-replay.json).
All eleven browser workflows pass; after actual process stop/restart and the
same page's new WebSocket handshake, replaying its recorded UI request through
RPC returns the same task/content, makes zero additional model calls and keeps
one original user message. The original reply remains visible in the browser.
This verifies completed replay across process restart, not a retry-button click,
unsent outbox recovery or interrupted in-flight side-effect recovery.
Four receipt/session regression tests pass. The separate live capture/OCR
endurance PID 15716 remains running with fresh telemetry: 5.012 hours, 7,527
successful captures and no capture failures at 06:03 UTC. It is not a 24-hour
certificate and still excludes the newer local vision/resource pipeline.

Interrupted assistant receipts now retain their real durable task ID. Startup
reclassifies surviving running receipts as interrupted; retry errors identify
the linked task and never silently rerun it. The schema migration adds the task
reference without replacing existing receipts. Four file-backed receipt/session
regressions pass, including interrupted-state classification and task identity.
This is component evidence, not a real mid-execution process-kill acceptance run;
that crash/effect-reconciliation gate remains open before owner deployment.

Startup recovery sequencing correction: the host now invokes the existing task
recovery routine only after acquiring its listening port. Interrupted tasks move
to WAITING with a recovery reason instead of appearing actively RUNNING in a new
process. Receipt recovery is also deferred until that ownership point, avoiding
constructor-time reclassification by another instance. Receipt integration and
four isolated automation RPC leaves pass after this change. Actual in-flight
process termination and effect reconciliation remain the required next gate.

The actual bounded process-kill gate now passes in
[assistant-real-crash-recovery.json](assistant-real-crash-recovery.json).
A genuine model task executed write_file and created the expected test artifact.
The owning test host was terminated while its receipt was still running, then
replaced by a new process. The linked original task recovered to WAITING, its
file effect remained intact, replay returned the interrupted task reference,
zero new model calls occurred, and exactly one original user message remained.
No fake model, manually injected task/receipt or dummy side effect was used.
The runner retains isolated state and the actual artifact. This proves bounded
crash evidence/replay protection, not automatic task resumption or reconciliation
of arbitrary external side effects; those broader recovery workflows remain open.

Assistant resume implementation now invokes the shared model/tool executor for
the original WAITING task, preserves its task ID/user transcript, and supplies
an explicit instruction to inspect existing effects before repeating actions.
Unsupported task types retain state and reject instead of pretending execution.
Successful execution would reconcile the original receipt to its real result.
This path is NOT accepted yet: the expanded real crash/resume runner failed with
an upstream timeout, retained in
[assistant-resume-timeout.json](assistant-resume-timeout.json). Four receipt/session
regressions pass, but they do not substitute for the failed real resumption gate.
The change remains undeployed to owner PID 15384 pending successful verification.

Streaming deadline correction separates the bounded connection timeout from
per-read inactivity timeout. A progressing stream may exceed the initial
connection deadline; a stalled stream still fails, and reader cancellation
releases its transport. Two real local SSE transport CONTRACT tests pass, plus
the receipt regression. This removes the previous hard cutoff on long responses
without extending a stalled request indefinitely.

[assistant-resume-real-pass.json](assistant-resume-real-pass.json) records the
subsequent successful actual crash/resume run (about 72 seconds). The model/tool
executor continued the original task to COMPLETED, preserving its file effect.
Independent SQLite inspection found 1,800 words / 13,515 characters in the final
persisted assistant reply; this verifies substantial generated output, not exact
word-count compliance. The earlier timeout remains FAIL. Broader side-effect
reconciliation and owner deployment remain separate unfinished work.

Shared assistant write-scope follow-up: `agent`/`gateway.agent` aliases and
`tasks.retry` now enforce the same existing operator write/admin scopes as
chat/resume. An authenticated read-only session cannot invoke the guarded
executors through these routes. The contract test confirms zero execution for
read-only calls and successful existing owner/admin calls. No approval dialog,
new owner permission requirement or change to full-access owner mode was added.
This is dispatch-contract evidence, not a complete authentication/security audit.
Receipt regression and the four isolated automation leaves also pass.

The existing Skills page now has an SDK-backed import form for real local or
GitHub bundles, including explicit revision/subdirectory fields. Its actual
Chrome gate passes in
[skills-external-ui-import.json](skills-external-ui-import.json): imported
`anthropics/skills` frontend-design at pinned revision
`ca45fc496a3436251f191354091d557da31c15b5`, independently read the installed
9,434-character bundle, restarted the isolated host, and verified the skill in
the native installed list. Nine selected browser workflows passed in that run
and 19 UI component regressions passed after rebuilding the native bundle.
This gate does not certify execution/update/uninstall of that imported skill;
earlier real SDK execution evidence is separate. No replacement Skills page or
owner permission dialog was added.

[skills-external-ui-toggle.json](skills-external-ui-toggle.json) extends that gate
to the imported external skill's actual native detail switch: disable through UI,
verify SDK state, reload and confirm disabled state, then re-enable through UI
and independently confirm SDK enabled state. Nine selected workflows pass.
Inspection found no native uninstall action in that detail view; removal/update
and execution UI acceptance remain open rather than inferred from the toggle.

The existing Skills page now exposes named-bundle refresh/uninstall controls,
using the real SDK handlers without a new permission popup. Refresh explicitly
uses the saved source/revision; it does not claim to upgrade a pinned revision.
[skills-external-ui-refresh-remove.json](skills-external-ui-refresh-remove.json)
passes actual GitHub import, native disable/enable persistence, real source
refresh and uninstall across process restart. The test modifies only its isolated
installed bundle, refreshes from the pinned remote source, and independently
checks the original 9,434-character content is restored while enabled state stays
enabled. UI uninstall removes that isolated file and the skill remains absent
after restarting the process. Nine selected browser workflows and 19 UI
component regressions pass. Execution through the imported skill's UI/task flow
is still a separate unfinished gate; these lifecycle checks do not replace it.

The bounded external skill UI/task gate now passes in
[skills-external-ui-execution.json](skills-external-ui-execution.json). The same
actual imported pinned frontend-design bundle was launched from the existing
Skills page with a real goal. Its durable model/tool task created a self-contained
HTML counter; an independent Chrome page opened that file and verified a real
click changed count 0→1. The task was independently read as COMPLETED. The same
run also verifies import/restart, disable/reload/enable, saved-source refresh and
uninstall/restart persistence; nine selected browser workflows passed.

Implementation fixed the native skills.execute adapter passing an undefined
capability engine instead of the actual registered canonical engine. The UI now
shows the real durable task ID/status/output, renders errors as failures, and
adds no owner permission dialog. Nineteen UI regressions plus write-scope
contract pass. This scoped result does not certify every community skill,
external prerequisite, long-running execution interruption or marketplace format.

Follow-up: starting another skill execution now clears the previous task ID from
the status element before awaiting the request. A failed second attempt cannot
retain a successful earlier task's identifier. The UI rebuild and 19 component
regressions pass; this small change has no additional real-browser claim.

Endurance checkpoint at 2026-11-02T06:31:17Z: the existing capture/OCR run reports
5.47 hours, 8,219 successful captures/OCR operations and zero capture failures.
It remains IN_PROGRESS, not a completed 24-hour gate, and does not cover the
newer combined local-vision pipeline or all subprocess resource accounting.

External executable plugin remains OPEN. The current SDK requires a Zero
manifest and executable named handlers; bundled System Tools lifecycle evidence
does not demonstrate compatibility with arbitrary OpenClaw community packages.

Browser acceptance reporting now classifies every selected workflow separately.
An unknown workflow name fails before execution rather than inheriting a broad
report label. The report-level classification is the union of selected checks;
REAL_OS is attached to actual microphone/capture workflows and REAL_EXTERNAL
to remote model, GitHub import and search workflows. These labels describe
scope for failures as well as successes, not production completion.
[browser-per-workflow-classification.json](browser-per-workflow-classification.json)
records a fresh isolated real-browser run: all eight default workflows PASS,
including persisted memory/skill/plugin effects, real wheel scrolling and actual
gateway process restart/reconnect, with no page errors. Optional external chat,
external skill, microphone and observation checks were not selected in this run.
The historical 18-suite/137-leaf inventory integrity check also remains VALID;
it still does not inventory every newer acceptance runner, which remains open.

Screen automation now bounds outstanding dispatches to eight by default
(configurable integer 1..128). Previously a slow executor could retain unlimited
promises and dispatch delayed actions for every observed transition. Once full,
new transitions are deliberately dropped and counted as droppedTransitions in
the existing observation status; they are not counted as successful actions or
replayed later. Capture itself continues and does not become blocked by actions.
This is a bounded overload policy, not lossless event delivery or cancellation of
already executing external effects.

Three CONTRACT checks pass, including a stalled executor with 100 transitions:
two dispatched at a configured limit of two, 98 explicitly dropped, capacity
recovered after completion, and close waited for active work. The separate
[screen-automation-bounded.json](screen-automation-bounded.json) REAL_OS /
REAL_BROWSER / INTEGRATION run also passes: four actual captures, one native
window transition, one real get_screen_size result (1920x1080), no dropped events
or failures. Synthetic overload checks do not stand in for this real capture
workflow, and this run does not certify arbitrary OS event types or 24-hour use.

tasks.retry now executes the registered assistant task rather than only changing
FAILED to QUEUED. It validates the task/receipt before mutation, uses the original
task ID, preserves the existing user transcript, records continuation instructions
to inspect prior effects, and reconciles the durable request receipt on success
or failure. Unsupported task types retain their state and return an explicit
missing-executor error. The original write/admin authorization still applies;
there is no additional owner approval flow.

The real runner's new --retry-only mode failed first with a null AbortSignal:
[assistant-retry-signal-failure.json](assistant-retry-signal-failure.json). This
exposed retryFailedTask retaining completed_at from the failed attempt; retry now
clears that terminal timestamp so the actual executor gets a fresh signal.
[assistant-retry-real-pass.json](assistant-retry-real-pass.json) then passes an
actual isolated host hold-induced failure, release and explicit task retry using
the real configured model/write_file/read_file tools. The file content, original
task COMPLETED status, one original user message, completed SQLite receipt and
zero additional model calls on original chat request replay were checked.
This verifies assistant retry after that bounded failure, not arbitrary external
side-effect reconciliation, every task family or a provider/model reassignment UI.

Assistant requests now resolve their effective model once before execution and
persist its ID in an additive receipt model_id column. Explicit retry/resume
reuses that recorded selection rather than silently following later chat/default
model changes. Input hashing still uses the original request, so durable replay
identity remains unchanged. Existing rows/columns/transcripts are preserved;
legacy receipts lacking a model ID retain the previous fallback behavior because
their original model cannot be reconstructed reliably.

[assistant-retry-model-pinning.json](assistant-retry-model-pinning.json) records
a fresh real configured-model/tool run. After a hold-induced failure, the test
changes the session's model to an unavailable name before retry. Retry still
completes the same task using its pinned nvidia/nemotron-3.5-lightning-30b-a3b
selection, creates and reads the actual file, preserves one user message and
replays the original completed request with zero additional upstream calls.
Receipt integration and write-scope contracts pass. This is not broad provider
failover, a clean-machine migration or proof of every model assignment UI.

Concurrent retry verification now sends two real tasks.retry RPCs for the same
FAILED task. Exactly one executes; the second fails the state precondition
without starting another assistant turn. A concurrent original chat.send replay
receives an explicit currently-running status rather than the misleading
interrupted message previously used for this live receipt state.
[assistant-retry-concurrent.json](assistant-retry-concurrent.json) passes this
real model/tool workflow, the changed-session-model regression, actual file
verification, one original user message and zero upstream calls on completed
replay. The receipt integration regression also passes. Scope is one assistant
task on an owned isolated host; distributed multi-host locking is not certified.

Skill instruction execution now resolves the selected agent's assigned canonical
model once per task, after explicit context/parameter overrides. Previously it
always fell back to the zero-lead alias even for a differently assigned agent.
Every model-turn step and the completed task result now record that stable
selection and agent ID, allowing assignment and execution to be compared.

[external-skill-model-assignment.json](external-skill-model-assignment.json)
passes a fresh real GitHub import of pinned frontend-design followed by three
real NVIDIA model rounds, write_file/read_file effects and an independently
opened Chrome artifact: count 0 becomes 2 after two clicks, no browser errors.
All three persisted model steps match the assigned canonical model
nvidia/nemotron-3.5-lightning-30b-a3b. Nine SDK regression checks also pass.
This bounded result verifies the default agent's actual skill assignment path;
it does not certify every specialist assignment UI or every external model.

Skill uninstall now retains the removed bundle and original registry/config
record in a hidden local .skill-removed-* archive instead of permanently deleting
them. Archives are excluded from active discovery. The existing uninstall UI
still removes the active skill immediately without another permission prompt.
State-write failure restores the original bundle; an archive still owning data
is retained on error. Archive metadata contains the original local configuration
and inherits the same local trust boundary; encryption/rotation is not claimed.
There is no restore UI or automatic archive cleanup yet.

Nine SDK regressions pass, including exact asset/content/config preservation.
[skill-uninstall-browser.json](skill-uninstall-browser.json) passes nine real UI
workflows including actual pinned GitHub import, disable/enable, refresh,
uninstall and process restart persistence. Separate independent inspection in
[skill-uninstall-archive.json](skill-uninstall-archive.json) confirms the removed
UI-installed bundle's 9,434-character SKILL.md, enabled flag and pinned source
revision remain in its archive. Skill execution was not selected in this UI run.

Skill update/refresh/save now also retain the previous bundle and registry
configuration in a hidden .skill-previous-* archive outside the temporary staging
directory. Previously success removed the previous copy with staging cleanup,
including local edits. Failed publication still restores the previous active
bundle. Active discovery excludes these archives, and returned update results
include their path. Archive restore UI, encryption and retention management remain
unfinished; no automatic deletion policy was introduced.

Nine SDK regressions verify the previous asset bytes, version, enabled flag and
configuration alongside active updated content.
[skill-refresh-browser.json](skill-refresh-browser.json) records nine passing
real UI workflows including actual pinned GitHub refresh and process restarts.
[skill-refresh-archive.json](skill-refresh-archive.json) independently inspects
that retained state: the original disposable local edit remains in the previous
bundle while the active source refresh succeeded. This scope is preservation
during refresh, not a completed rollback/restore user workflow.

Search provider deadlines now cover response body consumption/JSON parsing as
well as headers. Previously timers were cleared on headers, permitting a stalled
body to hang indefinitely. A provider is recorded retrieved only after valid JSON
with the expected top-level structure is parsed. Malformed JSON/shape is failed,
not an empty retrieval; HTTP errors remain failed and network/deadline failures
remain unavailable. No fabricated citation or verified=true fallback was added.

Five search checks pass, including an INTEGRATION check using actual loopback
HTTP sockets that send headers and an unfinished JSON body: both provider reads
abort in about eight seconds total. This controlled transport test does not claim
external search results. Separate actual UI/live-provider search in
[search-body-deadline-browser.json](search-body-deadline-browser.json) passes
alongside the eight selected browser workflows, checking retrieved provenance,
verified=false and fetching the real returned source URL. Source reachability
does not independently verify the factual contents of a citation.

New --screen --screen-recall browser gate verifies retrieval through ZERO's actual
assistant/tool loop, not only direct store queries. A unique visible Chrome title
is captured through native observation and persisted; the assistant is asked for
the last recorded title without receiving the marker in its prompt. It must call
screen_context, the real tool result must contain the captured title, and the
assistant answer must return it. Transcript tool call/result checks are required.

[screen-recall-title-not-observed.json](screen-recall-title-not-observed.json)
retains the first FAIL: changing the SPA page title before clicking Enable did
not produce the required actual native capture. The corrected harness uses its
own separate visible page and waits for the native observation instead of
assuming DOM updates prove desktop capture.
[screen-recall-through-zero.json](screen-recall-through-zero.json) then passes
all nine selected workflows, including real captured-title retrieval via the
configured external model, Private Mode clearing, preference restart recovery,
scrolling and gateway reconnect. This does not certify general scene reasoning,
human voice interaction, every UI screen or a completed 24-hour endurance gate.

Native connector status no longer hardcodes Windows, model fabric and browser
as connected without live execution. It returns configured/untested with
liveVerified:false (Windows unavailable on non-Windows); model configuration is
derived from the actual provider catalog. This status call performs no live probe
and is deliberately not proof of availability. About now describes the real
single-conversation/delegated-worker design instead of incorrectly claiming that
no specialist workers exist, and removes the stale generic host-approval wording.
No additional approval mechanism was added.

The UI rebuild and 19 component checks pass.
[about-truthful-status-browser.json](about-truthful-status-browser.json) records
eight passing isolated browser workflows, including the rendered corrected About
description, actual status RPC showing no unverified connected claim, real wheel
scrolling and gateway process reconnect. Text checks cover these specific content
claims; they are not used to substitute for the other actual interaction tests.

Endurance checkpoint 2026-11-02T06:48:58Z: PID 15716 confirmed live, 5.77 hours,
8,663 completed actual captures/OCR, zero capture failures. Still IN_PROGRESS;
not 24 hours and not the newer combined vision/subprocess resource gate.

Assistant task completion now checks actual tool outcomes. Previously the chat
could record FAILED tool output and a failed progress card yet still complete its
durable task/receipt because the final model explanation was nonempty. Explicit
ok:false, success:false, executed:false and failed/blocked/cancelled outcomes now
prevent completion. Malformed/non-object tool arguments are recorded as failures.
The model explanation and original tool results remain in the transcript.

An initial conservative implementation rejected a real retry which first read a
missing file, then created and verified it; that failed regression is preserved
in [assistant-tool-recovery-conservative-failure.json](assistant-tool-recovery-conservative-failure.json).
The final rule permits recovery only when a later action with the same action
name and deeply equal arguments returns verified:true and no failure outcome.
It preserves earlier failure records, and does not treat arbitrary subsequent
successes or prose as evidence that a failure was repaired.

[assistant-tool-failure-real.json](assistant-tool-failure-real.json) verifies a
fresh real model read_file failure: the file stays absent, actual tool error is
persisted and both task and receipt are FAILED despite a final model response.
[assistant-retry-after-tool-outcome-fix.json](assistant-retry-after-tool-outcome-fix.json)
passes the real successful task retry/concurrency/model-pinning/file workflow.
Two receipt/write-scope regressions pass. This is not proof of arbitrary external
effect recovery or independent verification of every assistant deliverable.

Actual tool recovery now has positive and negative external-model evidence:
[assistant-identical-read-recovery.json](assistant-identical-read-recovery.json)
passes intentional missing-file read, actual write and verified read of the same
path with deeply equal original arguments. The first real error remains in the
transcript and the task completes only after actual verified recovery.
[assistant-unrelated-success-still-failed.json](assistant-unrelated-success-still-failed.json)
passes the inverse: the model reads a missing file, successfully writes/reads a
different file and gives an explanation, but the original file remains absent
and task/receipt stay FAILED. Unrelated success cannot erase the earlier failure.
Both are new executions through an owned isolated host and the real configured
model/capability engine; no substituted model/tool responses. These bounded file
cases do not establish general compensation for arbitrary external side effects.

Streaming completion integrity: ModelFabric now preserves an explicit length /
content-filter finish reason when a later DONE marker arrives; previously DONE
overwrote it with stop. A stream that closes without a terminal reason or DONE
throws, and the host rejects non-completing finish reasons before executing
partial tool calls or completing a task. Non-stream fallback preserves the
provider's actual finish reason rather than inventing stop.

Three actual-loopback SSE CONTRACT checks pass (length then DONE, truncated
socket, reasoning separation and progress/idle deadlines).
[assistant-retry-stream-terminal-regression.json](assistant-retry-stream-terminal-regression.json)
passes a fresh real NVIDIA model/tool retry, actual file verification, assignment
pinning, duplicate retry exclusion and durable replay. Transport contract checks
are not claimed as real external token-limit acceptance.

Endurance terminal revalidation at 2026-11-02T16:41Z: Get-Process confirms PID
15716 is missing. Its last persisted summary is 2026-11-02T07:26:30Z, 6.391 hours,
9,550 actual successful captures/OCR and completed24Hours:false. The on-disk
running label is stale; the run is INTERRUPTED / INCOMPLETE, not a verified wait
or PASS. The reason/time of process loss is unknown. Original summary is retained
unchanged; a separate audit records the missing live handle. Combined vision and
all subprocess resource endurance remain outstanding, so the old capture-only
run is not silently restarted or counted toward those gates.

The endurance runner now optionally uses the actual local GGUF vision runtime
with --local-vision 1 and --vision-interval-ms, records native capture/metadata/OCR
resourceUsage for each real frame, and verifies persisted inferred observations
after reopening encrypted SQLite. Classification uses the required separate
REAL_OS / INTEGRATION / ENDURANCE labels. Missing SDK/model subprocess accounting
now explicitly prevents overall completed24Hours and keeps verdict PARTIAL even
when the bounded capture/OCR/vision pipeline succeeds. captureOcrCompleted24Hours
is a separately named subset and cannot certify the full requirement.

[endurance-combined-short-partial.json](endurance-combined-short-partial.json)
records a real 30-second run: 13 captures/OCR, two completed local inferences,
encrypted persistence/reopen verified, zero capture/OCR/buffer budget failures.
One in-flight model request is aborted during orderly stop (runtime failures=1,
observer inference failures=0); this is visible, not hidden. Pipeline verdict is
passed, overall verdict partial, completed24Hours false and process exit 1.
The earlier development run remains in artifacts with its superseded verdict;
it is not accepted for overall resource verification. No new 24-hour run has been
launched yet: full subprocess measurements remain required before that gate.

LocalInferenceRuntime now samples its owned llama-server process using actual
Windows Process counters: PID, process name/start time, measurement time,
cumulative CPU milliseconds, working set/peak and private bytes. Sampling is
single-flight, bounded to five seconds, validates the owned live child and never
starts a model merely to read status. Historical samples are marked
currentProcess:false after exit/restart; cumulative CPU must not be summed across
repeated samples. No global PowerShell policy is changed.

[local-vision-resource-policy-failure.json](local-vision-resource-policy-failure.json)
retains the initial measurement failure under the machine script policy. Using
the same process-scoped launch setting as existing native capture fixes it.
[local-vision-process-resources.json](local-vision-process-resources.json) passes
real local text/color inference, CPU monotonicity for the same start time,
positive working-set/peak counters, interruption and fresh-process recovery.
[endurance-model-resource-short.json](endurance-model-resource-short.json) also
records an actual combined short run with model counters, encrypted persistence,
eight completed captures/OCR and one capture aborted on orderly shutdown.
Overall acceptance stays PARTIAL. The final source refines gap wording to SDK
accounting plus whole-lifetime aggregation/final counters and writes model
snapshots into sample rows; this last sample-row field was not separately rerun.

Capture SDK topology correction: installed @trycua/cua-driver 0.32.0 documents
create() as same-process/no daemon IPC, and its actual executionMode() returns
Embedded. The driver now validates that mode using the SDK enum and records the
current Node PID's real CPU/RSS/peak as a same-process total. Unknown/remote modes
retain missing resource data. Embedded SDK CPU/RSS must NOT be added to Node
totals again; per-frame counters explicitly state this accounting scope.

[capture-embedded-process-resources.json](capture-embedded-process-resources.json)
passes actual Windows capture/OCR with counters for embedded Node capture, native
metadata daemon and separate OCR process. Ten screen-intelligence regressions
pass. [endurance-embedded-capture-short.json](endurance-embedded-capture-short.json)
records eight actual captured/OCR frames with measured same-process capture
counters and zero missing capture measurements. Independent JSONL inspection
checks all captured PIDs equal the runner PID and confirms model resource
measurements are present in sample rows. Pipeline/persistence pass; overall
verdict remains PARTIAL for whole-lifetime aggregation/final counters. One
in-flight capture is aborted during orderly stop. This 20-second run is not a
24-hour endurance result and does not validate other SDK execution modes.

Native OCR/action counters now include actual Windows process start time.
ResourceTotals maintains bounded per-role cumulative CPU deltas keyed by PID and
start time, separating a reused PID from the previous process. Repeated samples
do not inflate CPU; stale older-process samples are ignored and counter
regressions/missing identity remain visible. Embedded capture is prohibited as a
separate subprocess role to prevent double counting with Node totals. RAM peaks
remain per role and are not misrepresented as simultaneous whole-pipeline RAM.

Two UNIT accounting checks pass. The separate actual combined run in
[endurance-resource-deltas-short.json](endurance-resource-deltas-short.json)
records positive native metadata/OCR/local-model CPU, eight distinct OCR process
lifetimes for eight real successful frames, zero invalid resource samples and
zero counter regressions. Capture/OCR/vision/persistence pass for this short
duration; final process-lifetime tails and simultaneous resource acceptance remain
incomplete, so overall verdict stays PARTIAL and completed24Hours remains false.

A fresh combined 24-hour measured run is now active, launched independently of
the interrupted prior run: PID 724, process start 2026-11-02T16:52:16Z, evidence
artifacts/screen-intelligence/endurance-combined-20261102T165216Z. It captures/OCRs
every two seconds, samples resources every ten seconds and attempts changed-frame
local vision at most once per minute. The real PID/start time was revalidated
after launch and after approximately 100 seconds. It is IN_PROGRESS, not PASS;
its current implementation still reports resource acceptance PARTIAL and cannot
certify final lifetime counters. The initial launch/summary snapshot is retained
in [endurance-combined-24h-launch.json](endurance-combined-24h-launch.json).

New runner classification coverage now complements the historical inventory:
runner-classification-inventory.json audits all 12 matching modern acceptance
entry points with exact source hashes, implemented mode labels and explicit
limitations. --check validates both catalogs and reports execution NOT_RUN and
release BLOCKED. Labels describe the union of possible modes; actual selected
per-check reports take precedence. It does not silently execute hardware/provider
tests or turn catalog integrity into product acceptance. The CONTRACT test proves
source changes, new unclassified runners and invalid labels fail closed. The
historical inventory still covers 18 suites / 137 leaves; new component-test
leaves are not all independently inventoried by this runner-entry-point catalog.

External executable plugin work now has a real MCP stdio transport foundation:
owned Node executable, explicit arguments/no shell, minimal inherited environment,
bounded outstanding requests/response buffering, timeout/abort cancellation,
initialization and tool RPCs, UTF-8 stream decoding and process cleanup. This is
not yet integrated into PluginManager or the Plugins UI and does not close the
third-party executable plugin acceptance requirement.

[external-mcp-transport.json](external-mcp-transport.json) records an actual
downloaded @modelcontextprotocol/server-filesystem@2.0.1 execution: negotiated
2025-06-18 protocol, 14 discovered tools, real tools/call write_file/read_text_file,
independent filesystem content verification including Hindi/Unicode, and owned
process shutdown. Package version/tarball integrity are recorded from the actual
installed package/lockfile. No new fixture package substitutes for the external
executable. Plugin adapter registration, enable/disable, persisted restart,
uninstall and current-UI lifecycle remain OPEN. OpenClaw plugin-format coverage
is not claimed by this MCP transport result.

Executable MCP packages now integrate with the real PluginManager. Installation
uses npm with install scripts disabled, resolves a contained declared bin,
discovers actual MCP tools, registers namespaced executable handlers with their
real schemas and persists the package snapshot/catalog/arguments. Disable drains
handlers and closes the owned process; enable starts its real executable. Restore
copies the installed source and respects disabled state without launching a
disabled server. Invalid/missing tool results fail explicitly; returned successful
tool output remains verified:false until independently checked. This adapter is
for executable MCP packages, not arbitrary OpenClaw extension compatibility.

[external-mcp-plugin-manager.json](external-mcp-plugin-manager.json) passes real
official filesystem package registration, handler file effect, manager reopen,
disabled no-effect, reenable and uninstall. Eleven existing plugin lifecycle
regressions and 19 UI component checks pass. The current Plugins form adds an
executable MCP source option/JSON arguments without new permission dialogs.

[external-mcp-ui-card-failure.json](external-mcp-ui-card-failure.json) retains the
first UI FAIL (detail card not opened). Two subsequent FAIL reports retain the
optimistic UI/async persistence races. The final harness waits for actual durable
disable/uninstall before killing its own host; button text alone is not evidence.
[external-mcp-ui-real-pass.json](external-mcp-ui-real-pass.json) passes all nine
selected workflows: real npm install through existing UI, chat-model invocation
of the namespaced plugin write handler with a completed durable task and actual
file verification, disabled state across real host restart, blocked disabled
effect, reenable/real effect, UI uninstall and absence after another real restart.
No page errors. Source catalog hash/mode audit updated for this runner change.
This closes that bounded MCP package lifecycle workflow; third-party update/
rollback, every plugin format and broader product acceptance remain unfinished.

MCP saved-source refresh now preserves executable arguments/bin selection.
Previously generic update reconstruction kept only kind/spec, so filesystem
packages lost their allowed-directory arguments and failed initialization.
[external-mcp-refresh-preservation.json](external-mcp-refresh-preservation.json)
passes a real pinned source refresh, executable restart and actual handler effect;
an invalid replacement fails during preparation and preserves the original source
revision and executable handler, which successfully writes afterward. This is
preservation on preparation failure, not a new proof of every post-detach rollback.

The existing Plugins surface now exposes named-plugin saved-source refresh and
executable restart controls. MCP arguments are shown only for MCP installation;
new installations populate the managed ID. No extra permission popup was added.
[external-mcp-ui-refresh-restart.json](external-mcp-ui-refresh-restart.json) passes
all nine real browser workflows, including those actual UI operations followed
by independent handler/file effects, plus existing disable/restart/enable/uninstall
checks. Thirty plugin/UI regressions pass. Pinned 2.0.1 is refreshed, not upgraded
to a different version. Browser source hash was re-audited for the expanded gate.

Executable plugin health is now distinct from a loaded JavaScript module.
The MCP adapter reports its owned process availability/PID; PluginManager derives
unavailable runtime status and an explicit restart error when an enabled child
has exited, instead of retaining active. Disabled plugins remain disabled, and
ordinary in-process plugins need no process-health hook. Signal-terminated child
processes are also rejected as unavailable by the stdio transport.

[external-mcp-process-crash.json](external-mcp-process-crash.json) passes actual
external process kill, unavailable diagnostics, failed invocation with no file
effect, new-PID restart and verified real file effect. The new reusable command
`node scripts/verify-external-mcp.mjs` repeats actual package install, registered
handler effects, disabled persistence, saved-source refresh, failed-preparation
preservation, real process crash/restart and uninstall while preserving the output
file. [external-mcp-reproducible-lifecycle.json](external-mcp-reproducible-lifecycle.json)
passes that fresh execution. Eleven plugin regressions and catalog contract pass;
the modern source-hash classification catalog now covers 13 entry points. This
run tests manager/diagnostic state, not a new browser crash-status interaction or
arbitrary post-detach rollback, distributed recovery or all plugin formats.

The current Plugins management card now has Check plugin runtime, displaying
the actual runtime status/error instead of assuming a loaded module is active.
The native projection includes the owned PID/availability for diagnostics. The
new browser --external-plugins --plugin-crash mode kills only its isolated
official MCP child, clicks the real status control, asserts unavailable is
rendered, confirms the dead tool call fails with no file change, then clicks
Restart and checks a different PID plus actual file output. Normal source refresh,
disable/enable/uninstall and host restart tests continue afterward.

[external-mcp-ui-crash-contract-failure.json](external-mcp-ui-crash-contract-failure.json)
preserves the first FAIL: the negative RPC rejected explicitly rather than
returning the failed payload shape the harness expected. The final run in
[external-mcp-ui-crash-recovery.json](external-mcp-ui-crash-recovery.json) passes
all nine selected real browser workflows with no page errors, including actual
rendered crash status and UI recovery/effects. Thirty plugin/UI regressions pass;
the runner hash and conditional REAL_OS classification/mode are re-audited.
This verifies explicit UI restart, not automatic replay of interrupted effects
or every external executable/process topology.

Models assignment now uses a real admin RPC, validates the selected configured
model, atomically persists the Zero binding/defaults, preserves unrelated fields
and saves exact original bytes to a local backup. Provider list now supplies the
actual model catalog without credential/model-secret fields. Configurable provider
and binding paths allow fully isolated acceptance runs; provider configuration
writes use the selected fabric path. Existing owner paths remain the default.
Canonical Models RPC errors now throw instead of falling through to another
loopback host or being treated by save handlers as success. Standalone legacy
fallback code is retained; remaining provider CRUD/discovery/local-GGUF native
RPC integration is not declared complete.

[models-ui-wrong-route-failure.json](models-ui-wrong-route-failure.json) retains
the initial harness route error. [models-provider-identity-mismatch.json](models-provider-identity-mismatch.json)
retains the actual strict-name mismatch: requested nvidia/nemotron-3.5-super-vl-120b-a12b
but NVIDIA reports private/nvidia/nemotron-3.5-super-120b-a12b. That provider identity
mapping is NOT verified or rewritten. The final routing gate adds stronger
independent request evidence: an owned loopback forwarding proxy records only
the outgoing model field and forwards the actual request/stream to NVIDIA, without
logging credentials or prompts. The selected model is observed in the real
upstream payload; the distinct response name remains explicit in evidence.

[models-ui-assignment-real-routing.json](models-ui-assignment-real-routing.json)
passes nine selected browser workflows, including UI model selection/save,
actual host stop/restart, persisted selection, real inference returning 4,
independent outgoing model verification and unchanged owner settings. All test
model files are isolated copies. Twenty-two regressions pass, including exact
backup preservation, file-backed settings reopen, unknown-model rejection and
credential omission. This is model-selection/request-routing acceptance, not
independent validation of NVIDIA's internal alias or all Models/Agents screens.

Provider save/delete/configure now use the canonical admin RPC and selected
isolated provider path. Saves merge existing data, retain blank/redacted private
credentials on edits, validate URL/model IDs and write atomically with original
configuration backups. Catalog responses omit credentials; disabled providers
are excluded from inference resolution and selectable model lists. Empty provider
catalogs no longer fabricate a default model. Provider Delete is the explicit
action and no longer adds a confirm popup.

Provider Test Connection no longer treats credential existence as success. It
performs a real bounded GET /models, parses the actual returned catalog and fails
on HTTP/response errors. Configured credentials/headers stay server-side, are only
inherited for the configured endpoint, and redirects are refused. The UI states
that model-list retrieval is not inference verification. Controlled HTTP CONTRACT
checks test real requests/headers and 503 handling; they do not stand in for live
external execution.

[providers-ui-persistence-and-live-probe.json](providers-ui-persistence-and-live-probe.json)
passes ten selected real browser workflows: actual form create/edit/delete,
two real host restarts, preserved blank-edit secret, no secret in catalog, no
synthetic model, unchanged owner provider file, and a separate UI NVIDIA probe
retrieving a real nonempty external model catalog. The inert provider used for
CRUD is explicitly not claimed as an executable service. Twenty-six regressions
pass across settings, model streaming, authorization and UI components. Provider
import/export, all API variants, local-GGUF UI integration and internal provider
alias identity remain separate open work; this is not full Models sign-off.

Saved model routing now fails explicitly when an assigned/default model cannot
resolve or its configuration is unreadable; it no longer silently selects
zero-lead after those failures. In-memory provider fabrics no longer read/write owner
provider or assignment files unless explicit paths are supplied. Configured owner
hosts keep their existing paths. Catalog/settings reads still expose providers
for repair and return assignmentError/effectiveModel:null when resolution fails.
The Models UI displays Unavailable, excludes disabled choices and no longer
mutates saved selections in memory to the first available model. Model-catalog
default selection is derived from actual settings instead of a hard-coded ID.

[models-no-silent-fallback-ui.json](models-no-silent-fallback-ui.json) passes
all nine selected browser workflows. The positive case now sends through the
actual chat composer after UI assignment/process restart; the independent proxy
observes the selected NVIDIA model request and the real reply is 4. Negative
cases disable the assigned provider and inject an actual invalid saved binding
while a valid default remains configured: both fail before any extra upstream
call, preserve the saved selection, and display the error. A real UI selection
repairs the invalid binding. Owner files stay unchanged; provider internal alias
mapping remains explicitly unverified. Fifteen settings/stream/skill regressions
and 22 settings/UI checks pass. This is explicit failure/repair behavior, not
general automatic provider failover or all alternate-provider compatibility.

Provider discovery now bounds response bodies at 8 MiB and parses JSON without
echoing malformed remote contents. Blank/whitespace/duplicate IDs and invalid
catalog structure fail explicitly; actual empty catalogs return status empty
rather than pretending usable models were found. Returned names are strings and
extra remote fields are not projected as credentials/capability proof. The UI
distinguishes an empty catalog from a retrieved nonempty list.

Four settings/HTTP checks pass, including real loopback responses for malformed
JSON/IDs, empty data, duplicate entries, secret-field omission and oversized body
cancellation. [provider-catalog-validation-live-ui.json](provider-catalog-validation-live-ui.json)
passes nine selected real browser workflows and the actual NVIDIA probe returns
85 real model entries with inferenceVerifiedByThisProbe:false. This does not
claim each catalog entry can execute inference. Endurance PID 724 was confirmed
live at 2026-11-02T17:46Z: 0.904 hours, 1,343 successful captures, zero capture
failures, 54 completed local inferences and zero inference failures. Still
IN_PROGRESS, not a 24-hour PASS.

### Recoverable model configuration import and honest interrupted endurance

Canonical config import validates the entire provider/binding batch before any
write, merges unrelated settings, preserves privately stored credentials during
redacted export/import, and retains original-byte backups. A flushed recovery
journal protects the two files: exceptions roll back and a fresh owning host
restores both originals after an actually killed writer. Inference refuses a
pending journal. This proves process interruption recovery, not power-loss or
arbitrary provider-format compatibility. Backups contain original private data;
backup encryption/rotation remains open.

Real browser testing exposed reference-wire errors being sent as strings;
the browser ignored those invalid error frames and never displayed import failure.
Structured code/message errors now reach the UI. Notice timers also cancel older
timers so a previous success cannot hide a newer failure.

[model-import-live-ui.json](model-import-live-ui.json) records nine passing
browser workflows, including actual file chooser/download, two process restarts,
private round-trip preservation, invalid batch with byte-identical files, and
host startup restoration after a killed writer. Three earlier failed runs are
retained as failures. Seven component/HTTP integration checks pass. Runner catalog
integrity is VALID, execution NOT_RUN and release BLOCKED; catalog validation is
not feature execution.

[endurance-combined-interruption-audit.json](endurance-combined-interruption-audit.json)
records PID 724 absent from both process APIs at reinspection. Its last checkpoint
was 2026-11-02T19:55:55.595Z: 3.061 hours, 4,532 successful actual captures/OCR,
zero capture failures. Original evidence remains untouched; stale running status
does not count as live execution. This run is INTERRUPTED, never 24-hour PASS.
The overall objective remains incomplete, including full endurance/resource,
acoustic voice, remaining agent/model workflows and unavailable mobile/cloud gates.

### Independent specialist assignments on the existing Models screen

The existing agent binding card now selects Zero, researcher, coder, reviewer or
operator. Canonical model assignment validates known specialist IDs and configured
enabled models, atomically saves the selected binding, and preserves coordinator
defaults and other bindings for specialist edits. Existing Zero assignment behavior
is retained. Selection is held during save to prevent applying a completed request
to a newly selected agent. Unknown IDs fail visibly through the real error wire.

[specialist-assignment-live-ui.json](specialist-assignment-live-ui.json) records
nine passing real browser checks. Coder was assigned through actual controls,
persisted to the isolated file, survived an actual host restart, and rendered the
saved model afterward; coordinator settings remained equal. Component integration
also reopens ModelFabric and confirms coder resolves its model independently of
Zero. Seven settings/import checks pass. This gate explicitly does not certify
specialist inference or arbitrary planning; prior real multi-agent execution is
separate evidence, and a combined UI-to-execution gate remains to be completed.

### UI assignment to real specialist inference and parent consolidation

[specialist-ui-execution-live.json](specialist-ui-execution-live.json) closes the
combined single-specialist gate above. After actual UI assignment and host restart,
the coder executed through agent.task.execute without an explicit subtask model
override. Its real read_file tool retrieved an independently created UUID marker
not included in the prompt, and model output reproduced that content. The real
NVIDIA forwarding proxy recorded two requests to the UI-assigned super-VL model
and a separate lightning request for Zero consolidation. The parent completed and
returned its synthesis with the actual marker. Nine selected browser checks pass.

This is REAL_BROWSER + INTEGRATION + REAL_EXTERNAL evidence for the selected
workflow, not multi-specialist parallel/interruption acceptance or arbitrary agent
planning. Provider-reported model alias verification remains separate from the
actual requested model observed in outgoing requests. No owner files were used
for assignment writes; all settings and evidence source files were isolated.

### Reject explicitly incomplete specialist and coordinator completions

Inspection found nonempty prose with finish_reason length/content_filter could
complete specialist or consolidation tasks. Both paths now reject explicit
non-success reasons before accepting prose or executing partial tool calls.
Refusal messages and coordinator tool calls that have no executor also fail.
Specialist failed inference records preserve partial message, finish reason and
error. Missing finish_reason remains tolerated for existing compatible adapters;
this change does not claim every malformed upstream response is rejected.

The new [agent-completion-contract.test.mjs](../../../../test/agent-completion-contract.test.mjs)
uses actual loopback HTTP through ModelFabric for four combinations of truncated
or filtered specialist/coordinator responses. All persist FAILED parent state;
specialist failures retain failed child/inference evidence and never consolidate.
All 17 selected contract/runtime checks pass, including real subprocess lifecycle,
cancellation and restart reconciliation. Controlled HTTP responses are CONTRACT
evidence, not proof of external-provider behavior under those failure conditions.

[specialist-terminal-validation-live-ui.json](specialist-terminal-validation-live-ui.json)
passes nine real browser workflows after the implementation change, including
actual NVIDIA specialist inference, file tool result and parent consolidation.
This verifies successful execution still works. Overall completion remains unproven.

### Validate complete tool batches before side effects

Specialist tool call arrays now reject malformed shapes, declared-but-empty calls,
missing/duplicate call IDs, unavailable names and invalid JSON/object arguments
before executing any earlier call from that batch. This prevents the prior
valid-first-action/invalid-second-action partial side effect. This validation is
not a transaction across successful tools or a claim of schema-level argument
validation for every capability. Eighteen selected contract/runtime checks pass;
four actual loopback HTTP malformed-batch scenarios execute zero handlers.

[agent-batch-validation-live.json](agent-batch-validation-live.json) preserves
both external outcomes. The first actual NVIDIA run failed because coordinator
finish_reason was length: durable parent FAILED, successful specialist/read_file
retained. That failure is not converted to PASS. A subsequent independent run
passes nine browser checks including assigned specialist tool execution and
consolidation. Failed team RPCs now include task ID, status and recorded errors
instead of losing the cause behind generic Operation failed.

After confirming no endurance process existed, launched a fresh separate 24-hour
capture/OCR/local-vision run at 2026-11-02T21:52:41Z, PID 16744, directory
artifacts/screen-intelligence/endurance-combined-20261102T215241Z. Actual handle
and start time revalidated; initial checkpoints contain actual captured/OCR frames.
State IN_PROGRESS, completed24Hours false, resourceAcceptance PARTIAL. Previous
interrupted evidence remains intact. This is not 24-hour acceptance evidence.

### Two UI-assigned specialists execute independently in parallel

[parallel-agents-ui-live.json](parallel-agents-ui-live.json) records actual UI
assignment of coder to super-VL and researcher to lightning, another real host
restart, and independent read_file subtasks without explicit model overrides.
Two separate UUID file contents were absent from prompts and appeared in actual
tool results, model outputs and parent synthesis. The independent forwarding
proxy observed assigned upstream models and 723 ms overlap between their first
requests. Nine selected browser workflows pass. This is functional evidence,
not a latency benchmark or provider-internal model identity certification.

An independent read-only reopen of the stopped host's task database confirms two
COMPLETED children attached to the parent and stored TASK_ASSIGNED messages from
Zero to each agent plus TASK_COMPLETED messages back to Zero. Real interruption
and recovery of this combined UI parallel workflow remain a separate open gate.
Endurance PID 16744 remained live with its original start time at reinspection,
still early IN_PROGRESS with resourceAcceptance PARTIAL, never 24-hour PASS.

### Actual interrupted-team resume executor

Team checkpoints now persist workflow kind, child task IDs, execution budgets and
resolved provider-qualified specialist model IDs before model requests. Resume
requires interrupted WAITING state and matching checkpoint/child ownership;
concurrent live resume and incompatible legacy checkpoints are rejected. The
executor continues the same parent and same children, imports durable COMPLETED
child results, preserves saved artifacts, and only restarts unfinished children.
Canonical tasks.resume dispatches saved team workflows to this executor instead
of the assistant receipt executor. No approval popup was introduced.

The new test/team-process-recovery.test.mjs is INTEGRATION evidence using a real
Node writer process, actual file effect, parallel pending child, SIGKILL, database
reopen/startup recovery and actual resumed file effect. It confirms original task
IDs, zero replay of the completed child's effect, and final COMPLETED state; a
second resume is rejected. Nineteen selected contract/runtime checks pass.

[team-resume-regression-live-ui.json](team-resume-regression-live-ui.json) passes
nine browser workflows after these runtime changes, including two actual external
models, separate file results and parent consolidation. This is a successful-run
regression gate, not an external-provider crash/resume gate. The real process-kill
recovery test uses local executors; the combined external kill/resume gate remains
open. Resuming an unfinished child may replay its uncommitted tool effects; this
is not exactly-once semantics for arbitrary side effects or mid-tool recovery.
Endurance PID 16744 was independently confirmed live around 0.086 hours; still
IN_PROGRESS and whole-process lifetime resource accounting remains PARTIAL.

### External host-kill and pinned team resume; reconnect regression remains open

[external-team-recovery-mixed-results.json](external-team-recovery-mixed-results.json)
preserves three actual external runs, all overall FAIL. In each run the new team
recovery check itself PASS: researcher response is held after actual upstream
HTTP response, coder reaches durable COMPLETED, owned host is killed and restarted,
and canonical tasks.resume completes the same parent and same two children.
The isolated researcher's current binding is deliberately changed before restart;
resume still sends the original checkpoint-pinned lightning model. Independent
proxy confirms no completed coder model replay, and both real file markers are
returned. This closes the selected external interrupted-team gate, not arbitrary
uncommitted side-effect replay or mid-tool exactly-once behavior.

The broader selected run exposed a separate repeated-reconnect UI failure. First
two runs reached Server updated / Refresh required, despite completed handshake.
The frontend's local build comparison expects a configured custom UI declaration;
native handshake now truthfully sets controlUiBuildSource configured while
retaining the native server's actual version. Plugin status also reads current
manifest revision instead of an obsolete hard-coded generation. Third run clears
the build-refresh barrier and reconnects, but composer stays disabled with
Sending messages is unavailable with your current access. That final composer
gate remains FAIL and must be fixed; no combined overall PASS is claimed.

Three focused contract/process-recovery checks pass after these changes. The
endurance original PID 16744/start time remains live at recent reinspection,
about 0.147 hours at the recorded checkpoint; still IN_PROGRESS, resources PARTIAL.

### Preserve authenticated desktop session across host restart

Connection diagnostics isolated the disabled composer cause: valid browser
sessions lived only in RAM, so after host restart the cookie no longer resolved
and hello downgraded to viewer/operator.read. The prior failure report and safe
role/scope diagnostics are retained in
[durable-owner-reconnect-live.json](durable-owner-reconnect-live.json).

DesktopSessionStore now optionally persists atomic, flushed metadata keyed by a
SHA-256 hash of its random 256-bit bearer token. Raw tokens are excluded from disk
records; current roles/scopes and expiry are restored. Revocation and clear persist,
expired sessions do not reopen, malformed metadata fails instead of silently
granting authority. Native host uses its isolated/owner data directory consistently.
This preserves established authorization; it does not ignore expiry or promote
viewer identities. No permission popup or new approval flow was added.

test/desktop-session-persistence.test.mjs uses a fresh actual Node process to
restore the original scopes and revoke the token, confirms raw token absence,
expiry and malformed-file behavior. Six reported protocol/session checks pass.
The actual combined browser/external run passes all ten workflows: two distinct
assigned models with real file tools, host kill/restart, same-child pinned resume,
and final same-page reconnect with preserved operator/write scopes and editable
composer. An additional import/settings browser run also passed
(artifacts/functional-browser/1793657152654/report.json). This closes the observed
reconnect regression; it does not certify 24-hour auth expiry renewal or every
possible interrupted tool effect. Endurance PID 16744 remains live with original
start time around 0.234 hours at reinspection, still IN_PROGRESS/resources PARTIAL.

### Await the final local-model pre-close resource measurement

The endurance shutdown previously launched asynchronous resource sampling and
could close the owned model before it finished. First real short run confirmed
the lifecycle order: observer.stop itself stops the runtime, so sampling after
that point was unavailable. LocalInferenceRuntime.stop now awaits any existing
measurement, obtains a fresh owned-process sample before kill, retains it in
lastStopResources, and rechecks process termination before waiting for close.
Endurance records that sample and includes its final CPU delta without starting
another measurement after shutdown. Teardown CPU is explicitly excluded.

[final-local-process-counter-evidence.json](final-local-process-counter-evidence.json)
retains both actual 20-second runs. Corrected run captures/OCRs eight real frames,
reopens eight stored observations including actual local vision, and records the
final model PID/start identity, CPU 21,828.125 ms, working set and peak RAM. Independent
assertions confirm the final counter equals the aggregate role's last CPU sample.
Overall short-run exit remains 1/resources PARTIAL/completed24Hours false; this is
not a full endurance PASS. First unavailable final-sample result remains visible.

Two resource-accounting unit checks pass. The actual pinned local GGUF verifier
also passes its text/color recognition, measured resource and abort/restart
workflows after the lifecycle change, with real pre-close counters retained.
The original 24-hour PID 16744 was independently confirmed live and was not
restarted to load these edits; that running process still uses its original code.
Whole-lifetime process teardown counters and simultaneous system-wide RAM bounds
remain unverified; full resource acceptance is still PARTIAL.

### Measure owned process tree within a bounded RAM sampling window

New Windows process-tree sampler selects only the current live Node root and
observed descendants, excludes its own PowerShell branch, validates process start
identity against the inventory, and rejects parent/PID reuse by creation order.
It records per-process timestamps, working sets, private committed memory and
cumulative CPU; observed vanished identities are explicit missingPids/partial.
Execution is bounded to five seconds, 256 processes and 256 KiB output. No command
lines, credentials or unrelated process details are returned. Endurance sampling
is single-flight and keeps only the latest tree plus peak sampled working-set sum.

[owned-tree-resource-window.json](owned-tree-resource-window.json) contains the
actual 20-second capture/OCR/local-model run and its sample windows. The live
model window includes Node, Windows metadata daemon, llama-server and console
helpers, with sampled working-set sum 634,912,768 bytes. Eight captures/OCR and
stored vision results persist; final local-model pre-close counters are measured.
Overall exit remains 1, resources PARTIAL and completed24Hours false.

test/owned-process-resources.test.mjs creates an actual 64 MiB allocated Node
child, confirms its measured RAM and exact aggregation, sampler exclusion, then
confirms the terminated child disappears. It and two accounting checks pass.
First harness attempt timed out because cleanup waited again after a signalled
exit; this failed attempt is recorded and the cleanup guard corrected. Creation
order hardening was subsequently checked by rerunning the real allocation test.

Working sets may count shared pages and samples have bounded time skew; these
are sampled sums, not unique physical RAM or continuous maximum. Short-lived
processes between windows and final process teardown CPU remain uncovered. The
existing 24-hour run was not stopped/reloaded for these changes and still runs
its original source; the newer sampler's short run cannot certify that run.

### Require real voice playback completion and preserve failed adapter states

VoiceEngine previously converted any resolved play promise into played:true.
It now requires both onStarted and a played:true completion result, rejects
explicit adapter synthesis/transcription failures instead of overriding ok:false,
and retains existing cancellation/buffer-restoration behavior. New CONTRACT
negative checks cover absent result/start/completion and failed recognition with
plausible text. Twenty-seven selected voice checks pass; an initial test harness
used a nonexistent ingestion method and that failure was corrected explicitly.

[voice-playback-completion-honesty.json](voice-playback-completion-honesty.json)
preserves an actual external failure: model selected memory layer codeword,
because tool schema exposed an unrestricted string. The real memory operation
failed and task remained FAILED. The canonical tool schema now enumerates all
eight actual layers and describes semantic facts; invalid layers still fail,
never silently normalize. A subsequent Windows/NVIDIA run PASS uses real STT
on actual synthesized PCM, shared durable chat context, real reply synthesis,
and actual microphone frames. Device playback now goes through canonical
voice.synthesize RPC and VoiceEngine's stricter start/completion check instead
of bypassing the engine with a direct backend call.

Recorded microphone: 99 frames/95,040 bytes; Microsoft David output: 77,600 PCM
bytes, played:true. This is device/API evidence, not human spoken input or a
human intelligibility/acoustic barge-in sign-off. No raw mic audio was saved.
Asked the user asynchronously whether the phrase was audible; until an answer,
human audibility stays UNVERIFIED. Voice remains PARTIAL. The long endurance PID
16744 remained live at reinspection; its original run is not upgraded by this work.

### Persist assistant tool outcomes as task steps

Assistant tools previously persisted observations in session transcripts and
capability audits but the durable task step list contained only assistant_input.
The owning task ID now reaches the model/tool executor, which records every tool
result with its original arguments and outcome. Failed/blocked/errors are failed;
verified successes are completed; other successes remain unverified. Malformed
arguments also retain a failed step. Exact recovery does not erase the original
failed observation or rewrite history.

[durable-assistant-tool-steps.json](durable-assistant-tool-steps.json) records
actual NVIDIA cases and independent read-only task DB assertions. A missing read
followed by unrelated successful write/read remains FAILED while task history
shows failed, completed, completed. An intentional missing read followed by a
write and identical-argument verified read reaches COMPLETED with the same three
step outcomes retained. File content is independently checked. The first edit
incorrectly referenced an out-of-scope task variable and the real test failed;
that failed attempt is retained, and the explicit taskId fix is verified by both
subsequent external runs. Two receipt/scope regression checks also pass.

Endurance PID 16744 remains present with its original start time at this audit;
its checkpoint is still IN_PROGRESS, completed24Hours false and resources PARTIAL.
No current source edit is claimed to have hot-loaded into that long-running process.

### Main assistant validates the whole streamed tool batch before execution

Main Zero loop now validates every reconstructed tool call before admitting the
assistant tool message or running the first action. Missing/duplicate IDs,
undeclared tools, malformed JSON and non-object arguments fail the whole batch.
Missing IDs are no longer synthesized. A terminal tool_calls/function_call reason
with no actual calls also fails rather than accepting prose as completion.
Rejected batches preserve their original calls in a failed task validation step
with executed:false; malformed tool messages do not poison later model context.
This is structural validation, not full JSON Schema validation or transactional
rollback of successfully validated tools that fail during execution.

[assistant-whole-batch-validation.json](assistant-whole-batch-validation.json)
records a real HTTP/SSE controlled upstream through the actual native host,
ModelFabric and assistant execution path. Five malformed scenarios all prevent
the valid leading write_file from creating its target and retain FAILED receipts,
tasks and non-executed validation evidence. This is CONTRACT evidence. Two reported
checks, including scope isolation, pass. Actual external NVIDIA missing-file,
write and identical-read recovery also PASS after the final edit, independently
verifies file contents, and preserves failed/completed/completed durable steps.

### Skills reject incomplete model responses and validate the complete batch

Skill execution previously marked its model step completed before checking
length/content_filter, accepted other unsupported/missing finish reasons, and
could execute a valid leading call before discovering a malformed second call.
It now validates terminal reason, assistant role, refusal, declared tool batch,
permission, IDs and all argument objects before executing any call. Failed
validation records the original response/reason/error as a failed model step;
no completed model step is substituted. Existing per-tool cancellation and
verified/unverified outcome handling remains in place.

[skill-terminal-batch-validation.json](skill-terminal-batch-validation.json)
records ten passing integration checks, including eight controlled actual HTTP
negative scenarios through ModelFabric. All retain FAILED task/model state and
no leading file artifact. These negative responses are CONTRACT evidence, not
external-provider failure behavior. Actual pinned anthropics/frontend-design
skill ca45fc496a3436251f191354091d557da31c15b5 also installs and executes through
the real NVIDIA assigned model. Actual write_file/read_file steps create the
2,175-byte HTML deliverable; independent Chrome clicks change count 0 to 2 with
zero browser errors. Model/task records and artifact SHA are preserved.

Validation is structural, not comprehensive JSON Schema validation or rollback
of effects after valid tool execution begins. This does not certify every skill
format or all deterministic operations batches. Endurance PID 16744 remains
live with its original start time, still not a completed 24-hour gate.

### Validate explicit deterministic skill operations before side effects

The explicit operations path now validates the entire array, permitted capability
names and argument objects before running any action. Explicit null/empty arrays
or malformed shortcut arguments no longer silently fall through to model execution
or become empty argument objects. Invalid batches persist one failed
operations_validation step with executed:false and preserve FAILED task state.

[skill-deterministic-operation-validation.json](skill-deterministic-operation-validation.json)
records eleven passing skill integration checks. Six invalid operation scenarios
produce no real file artifact, including a valid leading write followed by an
invalid operation. The valid two-operation path actually writes FIRST then FINAL,
independently reads FINAL, and persists two successful tool steps. Structural
validation does not promise rollback after valid operations begin or comprehensive
per-capability schema validation. Endurance PID 16744 remains live with its original
start time; its ongoing run still does not establish 24-hour acceptance.

### Protect user files before connecting native GGUF UI controls

Inspection of the existing GGUF service found delete identifiers joined directly
to paths, prefix sweeps removing unrelated sibling files, and deleteAll deleting
almost every JSON/TXT in modelsDir. These are corrected before exposing more native
RPC operations. Model identifiers are validated before path operations; owned
binary deletion uses realpath containment rather than string-prefix containment.
Unknown IDs fail without deleting guessed paths. Delete-all iterates discovered
models; guides, arbitrary same-prefix files and unrelated JSON/TXT are preserved.
Binary/manifest unlink errors now propagate. Provider pruning retains an exact
original-byte backup before changing entries. The service accepts an isolated
models directory for actual tests while retaining its existing default behavior.

[local-gguf-removal-preservation.json](local-gguf-removal-preservation.json) records
actual GGUF copy/removal and zero-copy registration using the existing pinned
SmolVLM source, with the external source untouched. Real filesystem tests verify
traversal rejection, unrelated file preservation and provider backup bytes.
This is service/data-preservation evidence, not completion of the still-missing
canonical Models local-GGUF RPC bridge or arbitrary GGUF inference compatibility.

The user explicitly confirmed the real speaker phrase was clearly audible:
[voice-human-audibility-confirmation.json](voice-human-audibility-confirmation.json).
That selected audibility/intelligibility gate is now user-confirmed PASS. Human
microphone recognition, acoustic barge-in and general spoken conversation remain
unverified, and overall Voice status remains PARTIAL. Endurance PID 16744 remains
live with its original start time at reinspection; no 24-hour PASS is claimed.

### Connect native Models GGUF registry and remove fabricated setup feedback

Native host now owns an injectable LocalGgufEngineService instance and canonical
zero.gateway.localGguf admin RPC, uses the actual scanned catalog in providers.list,
and closes only its owned runtime instance. List/scan/status/engine ps, removal,
load/unload, self-test, settings update and local setup dispatch to existing real
service methods; unsupported actions fail explicitly. Browser hosts use a separate
ZERO_LOCAL_MODELS_DIR so tests never mutate owner model registrations. Host default
retains the existing repository models location. Engine allocation estimates are
labelled distinct from OS measurements.

Existing Models UI keeps its layout. Explicit remove clicks no longer show
permission confirmations, matching the user's owner mode instruction. Setup no
longer marks stages done before work or displays fabricated 28.4 tok/s. Self-test
speed appears only if a numeric engine result exists; setup errors remain errors.
The local card describes the local registry instead of a hard-coded owner port.

[local-gguf-native-ui.json](local-gguf-native-ui.json) passes nine selected actual
browser workflows. It copies the real pinned GGUF into an isolated registry,
renders its card across process restart, clicks remove with zero dialogs, verifies
physical binary absence and exact guide/settings preservation, restarts again and
confirms persisted catalog absence. Original source SHA-256 before/after matches.
Actual local mount form with missing path renders the real failure and creates
no registration. Escaped delete ID is rejected. Five service/provider checks pass.

These gates certify catalog/removal and failure UI, not successful arbitrary GGUF
setup, local chat assignment/inference, model load/self-test/settings workflows,
or HF download. Those remain open; dispatch existence is not their acceptance.
Endurance original PID 16744 remains live at about 0.690 hours, still IN_PROGRESS
and resources PARTIAL. No owner running backend deployment is inferred from tests.

### Repair real GGUF edit controls and persist validated settings atomically

Actual edit workflow exposed a product UI bug: labels and Save button were passed
to the text-only DOM helper and rendered as [object HTMLLabelElement] and
[object HTMLButtonElement]. They now append as actual DOM controls, retaining
the existing edit-panel layout. Earlier harness selectors also targeted the
underlying cloud Edit button; those two failed attempts are retained separately
from the third attempt that exposed the real missing controls.

Manifest writes use exclusive temporary files, flush and atomic rename, retaining
an exact prior-byte backup. Settings validate primitive field types, capability
booleans, context bounds and parameters before writes; unknown models cannot be
edited into a false success. Service test confirms invalid inputs leave original
bytes intact, valid update reopens with unchanged model path/zero-copy state and
the backup matches the original manifest.

[local-gguf-settings-live-ui.json](local-gguf-settings-live-ui.json) records nine
passing browser workflows plus all three earlier failed attempts. Actual dialog
controls save the display name, context 4096 and reasoning false; independent file
read and a real host restart confirm persistence in registry/UI. Subsequent actual
removal, exact source SHA preservation and failed source mount checks also pass.
This certifies metadata settings, not model inference or advertised capabilities.
The real GGUF service preservation/backup test passes. Full arbitrary model runtime,
local chat routing and HF download gates remain open. Endurance original PID 16744
is still live; this source change is not hot-loaded or a 24-hour sign-off.

### Install pinned native GGUF runtime and verify actual load/self-test/unload

Backend now pins node-llama-cpp 3.22.2 with its optional Windows x64 CPU binary,
and explicitly pins the existing CUA SDK 0.32.0/Windows platform binary so native
feature dependencies are declared instead of relying solely on transitive hoisting.
OpenClaw remains pinned 2026.10.6. GPU probing uses installed prebuilt binaries;
CPU fallback has a two-thread budget and missing runtime never triggers an
unbounded source compilation inside a user task. GPU execution is not certified.

Self-test token counts now use actual generated token ID callbacks, not text
chunks. Its measured rate explicitly includes loading/prompt evaluation. Load
failure enters the persisted failed self-test path, and successful self-test
restores the exact previous native chat history instead of clearing owner context.
Success certifies selected model load/generation, not semantic readiness.

[native-gguf-runtime-and-capture-regression.json](native-gguf-runtime-and-capture-regression.json)
records an actual pinned SmolVLM run, native token count, original source SHA,
prior-history restoration, persisted self-test and actual unload. The selected
model's original Jinja template triggers library fallback; generic generation
success is not certification of that template or all model architectures.
Two actual runtime/preservation checks pass. Nine actual browser workflows also
PASS, including UI Load RAM, Self-Test with native token telemetry and Unload RAM,
plus settings/restart/removal/source preservation/failure paths. Full native
ModelFabric chat routing, semantic conversation/tool use and HF remain separate.

Dependency maintenance encountered optional-package native file locking: the
installer's driver update failed with ERR_PNPM_EPERM while endurance held the DLL.
The endurance process was never stopped. Fresh capture initially fell back to
Windows GDI; this was not treated as equivalent SDK acceptance. The pinned npm
driver tarball integrity matched the existing lockfile, both existing native
binary SHA-256 hashes matched, and only missing metadata files were restored.
Dependency links were repaired and a fresh process again loaded embedded CUA;
actual SDK capture/OCR/resource provenance PASS is retained. No locked native
binary was overwritten. Installation guidance is in backend/LOCAL_RUNTIME.md.

Original endurance PID 16744/start identity remains live at 2026-11-03T02:59Z,
about 5.107 hours; the recent checkpoint has over 7,000 successful captures and
no capture failure. Still IN_PROGRESS/completed24Hours false/resources PARTIAL.
This long process retains original loaded code; newer short gates do not upgrade it.

### Correct native local-chat terminal reasons and token accounting

Local GGUF chat used text-chunk counts for completion usage, character/4 estimates
for prompt usage, omitted SSE terminal reason and always returned stop for JSON.
It now uses native promptWithMeta stop reason, generated token-ID callbacks and
native input token meter deltas. maxTokens is length; actual end/stop triggers map
to stop; unknown termination or repetition watchdog cannot claim normal success.
Stream cancellation emits an explicit error and ends without a fabricated DONE.
Input usage explicitly describes actual evaluations: reused cached prefix tokens
may be excluded, rather than pretending this is an uncached logical prompt count.

[native-gguf-chat-terminal-accounting.json](native-gguf-chat-terminal-accounting.json)
preserves the first two actual 500 failure attempts. Real HTTP execution exposed
an undefined target variable in the previously untested chat path; catalog lookup
now resolves it. The subsequent real pinned model test passes four HTTP cases:
JSON and SSE one-token caps report length/maxTokens and exactly one generated token;
JSON and SSE native custom stop triggers report stop/customStopTrigger. Usage sums
match, prior self-test history/source SHA remain preserved, and actual unload works.
No mocked inference replaced these native tests. Two selected runtime/preservation
checks pass. This is terminal/accounting acceptance for selected native HTTP calls,
not main chat UI routing, general semantic correctness or arbitrary tool use.
Original endurance PID 16744 remains live with matching start identity at about
5.262 hours, still IN_PROGRESS/completed24Hours false/resources PARTIAL.

### Native GGUF tool-call wire contract correction
- Local generated tool envelopes now become OpenAI function objects with JSON-string arguments; streamed entries include indexes. Multiple calls are retained, malformed/incomplete batches fail rather than silently becoming ordinary completion.
- CONTRACT: two parser tests pass, including Unicode arguments, multiple calls and five malformed/incomplete forms. These prove parsing, not model tool competence or execution.
- REAL_OS / INTEGRATION: pinned native GGUF test passes again, including four actual HTTP generation terminal/accounting cases. Evidence: artifacts/local-gguf-runtime/1793675551878/report.json. CPU fallback and original Jinja-template fallback warning remain visible.
- Main ModelFabric local routing and actual local assistant tool execution remain unfinished. Speaker audibility was separately confirmed by the owner; microphone semantic conversation and acoustic barge-in remain unverified. Mobile/cloud prerequisites remain unavailable.

### Local tool-result continuation preservation
- Found local executeChat discarded every assistant/tool message after the latest user turn, making tool loops repeat the original prompt without results. The text-wrapper adapter now preserves ordered assistant calls (including null content), exact tool result content and tool_call_id in an explicit continuation transcript; unsupported roles and unattributed tool results fail explicitly.
- CONTRACT test verifies ordered lossless selected wire fields, Unicode failure result retention, unchanged no-continuation input, and rejection cases. This is prompt preservation, not proof that a selected model follows or understands tool results.
- All four selected test leaves pass, including the actual native load/generation/history/unload and four HTTP cases. Latest actual runtime artifact: artifacts/local-gguf-runtime/1793675617471/report.json.
- Independently observed endurance PID 16744 live with original start time 2026-11-03 03:22:41 local; 24-hour acceptance not yet established.
- Main ModelFabric/UI local inference routing and real local tool-loop acceptance remain open.

### Main ModelFabric local native inference transport
- Added in-process local transport backed by actual LocalGgufEngineService, serialized inference requests, native JSON/SSE output, abort propagation, strict local catalog resolution, and no credential lookup/cloud fallback. Local model IDs are explicitly namespaced local-gguf/<id> to avoid cloud collisions.
- Native host initializes the local catalog and refreshes it for provider listing/assignment. Existing offline model Set Active actions/dropdowns now save namespaced IDs; current-active display follows those IDs. No UI redesign.
- REAL_OS/INTEGRATION evidence artifacts/local-gguf-runtime/1793675777004/report.json: actual ModelFabric JSON generation and stream termination, persisted local assignment reopened, two simultaneous requests serialized successfully, pre-aborted request rejected and later native inference recovered; upstreamRequestCount zero. Existing native four HTTP cases/history/source preservation still pass.
- First transport attempt failed because writeHead was absent; failed artifact retained (1793675692740). Corrected writable adapter passed afterward. CPU fallback/template warning remain visible.
- Existing isolated browser runner --gguf --gguf-runtime passes nine workflows, evidence artifacts/functional-browser/1793675757052/report.json, including real UI load/self-test/unload, edit/delete persistence, scroll, search, reconnect. This run does NOT yet assert Set Active followed by actual local chat reply or tool execution.
- Five existing ModelFabric tests also pass; source syntax checks pass. Local chat UI end-to-end, model tool competence, all administrative/inference concurrency interactions and full release acceptance remain open.

### Real UI local model activation and current-build verification
- Actual browser activation initially FAILED twice: artifacts/functional-browser/1793675833489/report.json and 1793675880441/report.json. UI notice exposed raw ui-proof ID rejected by configured catalog: immutable built UI was stale despite updated source. These failures are retained, not converted to PASS.
- Rebuilt UI generation 0fae7412797f01a87e11803cfe8f0217298b04ced78c0da6a9eed2bf5cf1dc94 and updated manifest. Browser runner now builds current source before every test, preventing stale UI source/bundle verification gaps.
- Added actual Set Active click, exact namespaced assignment on disk, process stop/restart, effective model resolution and visible Active state after restart. Isolated prior binding restored before deleting the test model; owner files untouched.
- Two passing subsequent runs: artifacts/functional-browser/1793675915667/report.json and 1793675942201/report.json, nine workflows each, including actual native UI self-test, settings persistence, source SHA, deletion without popup and reconnect. Runner inventory digest and scope updated, integrity VALID.
- This proves UI assignment persistence and native self-test separately, not main chat local semantic answers or local tool execution. Those acceptance gates remain open. Endurance PID16744 independently observed live with original start time; full 24-hour acceptance not asserted.

### Actual local native stream interruption and deadline recovery
- REAL_OS native test now starts a genuine generated stream, reads an actual first chunk, cancels the reader, awaits the original engine queue, and verifies a subsequent native generation succeeds. Native log records AbortSignal interruption.
- Added local transport deadline (default 60s, configurable timeoutMs), abort propagation to output and native engine, and cleanup on completion/failure. Previously local transport ignored the ModelFabric timeout option.
- Real 1ms deadline test rejects with TimeoutError during an actual native request; waits for original queue settlement and verifies next native generation succeeds. No replacement fake inference.
- Evidence artifacts/local-gguf-runtime/1793676010682/report.json records stream interruption and deadline recovery; all existing direct HTTP, ModelFabric JSON/SSE, assignment persistence, concurrent request, source/history preservation checks still pass. CPU/template fallback limitations remain.
- Main local chat UI semantic and tool-loop acceptance still open; this change establishes transport recovery only.

### Main UI local chat real outcome: acceptance FAIL
- Added opt-in --gguf-chat (requires --gguf-runtime), actual composer/send, saved-history equality, requested local model identity and exact city-only answer requirement. Inventory digest/scope updated.
- First run artifacts/functional-browser/1793676049116/report.json originally passed a weak contains-Paris assertion. Review found model ignored exact instruction and invented false additional facts. This is explicitly reclassified FAIL for semantic acceptance; original artifact preserved. The weak assertion has been replaced by exact equality.
- Strict rerun artifacts/functional-browser/1793676100113/report.json FAIL: actual chat request hit real 60-second Local inference timed out. No successful response is claimed. Evidence summary local-main-chat-real-outcome.json records both outcomes and limitations.
- UI activation, native transport and persisted answer from the first run are engineering evidence only. Selected tiny SmolVLM model is not certified as a reliable main assistant. Need compatible instruction-capable model, exact UI outcomes and actual local tool execution.
- Independent live handle check PID16744 retained original process start; endurance summary about 5.501h, completed24Hours false, resourceAcceptance PARTIAL. No restart or completion claim.

### Exact metadata-based text template fixes actual main local chat
- Read actual pinned GGUF tokenizer.chat_template. It expects multimodal content arrays, capitalized roles, end_of_utterance boundaries and Assistant: completion prefix; SDK automatic Jinja sanity test rejected string content and fell back to a different wrapper.
- Added adapter selected ONLY by exact template SHA256 830005085ddd94cec605b6e21b885b28ffad6e3f82ee6a212c523533e8f04f01, independent of display name. Text role formats match stored metadata; unknown templates retain existing resolution. Does not certify image input.
- SDK 3.22.2 TemplateChatWrapper additionally drops completionPrefix for empty model response, discovered by exact context-string CONTRACT test. Adapter appends Assistant: for that precise generation-history case. Initial failing contract corrected, not weakened.
- Intermediate actual browser artifact 1793676269283 FAIL: reply The capital of France is Paris. ignored city-only instruction. Retained.
- After prefix fix artifacts/functional-browser/1793676308307/report.json PASS, nine workflows. Actual main UI sends question, model requestedModel local-gguf/ui-proof, answer ' Paris' (trimmed exactly Paris), saved history matches and UI renders it. This proves selected exact outcome and routing; not general model reliability or tool competence.
- Native REAL_OS and wrapper CONTRACT tests pass; native evidence artifacts/local-gguf-runtime/1793676301594/report.json. CPU fallback remains; recognized template no longer triggers generic Jinja fallback. Other architectures/templates remain separately unverified.
- Prior failures and acceptance reassessments remain valid historical evidence. Local main chat selected case now passes; real local tool execution and full release gates remain unfinished.

### Actual local agent tool execution acceptance FAIL; unsupported inputs explicit
- Added opt-in --gguf-tools actual main UI request to write an isolated file, independently assert exact disk bytes and persisted verified tool result. Captures actual response and observed effect before assertions.
- Real browser artifact artifacts/functional-browser/1793676385798/report.json FAIL: SmolVLM returned explanatory prose claiming an exec command, no tool call and no file effect. Chat RPC returned ok true for the prose-only turn, which is not proof that requested work occurred. No fake tool result or substitute output inserted.
- Selected local model remains unverified for tool competence; main chat exact-answer case from prior turn does not establish this gate. Need instruction/tool-capable compatible model and actual tool/result continuation.
- Local text transport now rejects unsupported image/non-text parts explicitly instead of silently dropping them. Native integration test checks rejection alongside actual inference, stream cancellation/deadline recovery and subsequent successful generation. Native evidence artifacts/local-gguf-runtime/1793676415010/report.json; wrapper contract also passes.
- Runner classification digest/mode updated. Full release acceptance remains BLOCKED; goal remains active.

### Pinned official text-model provisioning started; inference NOT_RUN
- Official Qwen/Qwen2.5-0.5B-Instruct-GGUF model card inspected. Live official API metadata pins revision 9217f5db79a29953eb74d5343926648285ec7e67, qwen2.5-0.5b-instruct-q5_k_m.gguf, 522186592 bytes, SHA256 041474553fcabfc2a2d67903f9d2c2e50bd92528e670da4f33b5d0ce6e59fd55.
- Added install-local-chat.mjs: isolated artifacts directory, bounded download, streaming size/hash validation, exclusive destination copy, existing-file preservation, provisioning report only after full verification. Does not alter owner assignments or native dependencies.
- Download is currently IN_PROGRESS, not installed: tool session25666, actual node PID20928 creation 2026-11-03 08:58:07 local independently observed. Latest partial file 0 bytes; process remains live. Do not restart based solely on output timeout. Installer has total network deadline10minutes and cleans only its unique partial file on terminal failure.
- Added --gguf-qwen to select separately provisioned actual weights for the SAME real UI/tool outcome tests; no assertion relaxation. Browser execution awaits successful artifact hash validation; tool competence is UNVERIFIED.
- Source syntax and runner inventory integrity VALID. This is preparatory implementation plus live external wait, not successful provisioning or local tool acceptance.
- Endurance PID16744 independently revalidated with original start via Get-Process and CIM; latest summary5.601h,8154measuredframes,0missingframes, completed24Hoursfalse, resourceAcceptancePARTIAL.

### JSON-aware local call envelopes and real pinned Qwen outcome
- Fixed regex parser that truncated tool arguments containing literal </tool_call> text. Parser now scans JSON quoting/escapes/braces before envelope termination, rejects stray closing tags and malformed batches, retains nested arguments and gives UUID call IDs. CONTRACT covers literal nested tags, escaped quotes, nested object/list data and distinct IDs; existing malformed batch cases still pass.
- Four selected leaves pass including actual native runtime test; artifacts/local-gguf-runtime/1793676610863/report.json. Parsing tests do not establish model tool competence.
- Original download session25666 completed successfully without restart. Official pinned Qwen artifact522186592bytes and SHA verified; provisioning evidence copied to local-qwen-provisioning.json. No owner assignment changed.
- Actual browser --gguf --gguf-runtime --gguf-qwen --gguf-tools artifact1793676627047 FAIL: actual Qwen generated a bash write_file code block, no executable tool call and no file effect. Strict effect assertion caught it despite chat RPC ok=true. Do not execute arbitrary prose/code blocks to manufacture a pass.
- Real local tool acceptance remains unresolved for both selected small models. Follow-up needs appropriate model/tool protocol integration and real effects; no synthetic handler evidence accepted.
- Endurance original PID16744 independently observed live; no24hcompletion claim.

### Qwen-trained tool prompt protocol yields actual local side effects; workflow still PARTIAL
- Inspected pinned Qwen GGUF tokenizer.chat_template directly. Replaced nonstandard pretty-printed tool instructions with its compact # Tools / <tools> signature protocol and matching <tool_call> instruction. Removed contradictory appended requirement to answer in1-2sentences when reasoning disabled; reasoning suppression now preserves tool format.
- Native REAL_OS plus parser/wrapper CONTRACT regression: five leaves PASS, artifacts/local-gguf-runtime/1793676726524/report.json.
- Real UI run1793676709580: selected local tool workflow PASS with actual file exact ZERO_LOCAL_TOOL_EFFECT, persisted verified write_file evidence/hash and assistant final response. Model repeated write twice. Overall suite FAIL in later reconnect composer editability check. Selected evidence in local-qwen-real-tool-effect.json; no entire-suite or exactly-once claim.
- Independent rerun1793676765963: actual file effect again present, but subsequent model turn supplied malformed arguments and request correctly failed Local tool arguments must be an object. Overall FAIL retained. Do not count early side effect as full successful completion.
- Integration now reaches actual tools/results; continuation reliability/repeated calls and reconnect failure remain unresolved. Native prompt correction is verified progress, not production acceptance.
- Endurance PID16744 original start independently live at2026-11-03T03:33Z;24h gate remains open.

### Native role-preserving tool continuation; real local reliability remains FAIL
- Added native history projection: original user turn, assistant model call and user-role raw <tool_response> content following pinned Qwen convention. Avoids JSON-escaping the entire continuation transcript and paths inside the original user prompt. Groups adjacent results, validates known pending call IDs, rejects duplicate/unattributed results and incomplete pending sets.
- Added CONTRACT exact role/raw-content and invalid-ID checks. Native runtime +2contract leaves PASS, artifacts/local-gguf-runtime/1793676962393/report.json.
- First actual browser1793676892603 FAIL: one write_file executed and final response returned, but model changed requested filename to actual-local-tool-0001.txt. Exact requested file absent; no pass manufactured from neighboring file.
- Tool requests now default to temperature0 unless request/manifest explicitly specifies temperature. Actual rerun1793676941306 FAIL at60-second inference timeout, expected file absent. Deterministic sampling is not evidence of improved competence.
- Native continuation integration is implemented; selected small model reliability, exact requested effects, interruption/restart continuity and general local agent competence remain unfinished. Existing failed artifacts retained.
- Endurance original PID16744 independently observed alive;24-hour acceptance remains open.

### Authoritative native history replaces incorrect prefix cache; selected real local tool suite PASS
- Reproduced actual bug with real native inference: cached-history heuristic ignored changed model response arrays and skipped newly appended history when only prefix type/text matched. Artifact1793677081692 FAIL asserted NEW_CONTEXT must replace OLD_CONTEXT; native log incorrectly claimed prefix match.
- Removed heuristic and unused duplicate cached history. Always give full authoritative wire-derived history to SDK; SDK retains responsibility for safe token-cache reconciliation. Added real sequential inference assertions for changed assistant response, additional user history and absence of stale old response.
- Native real test PASS artifact1793677122220, plus wrapper/continuation contract checks pass; inventory VALID.
- Actual UI --gguf --gguf-runtime --gguf-qwen --gguf-tools artifact1793677103373 PASS, nine workflows. Correct requested path contains exact ZERO_LOCAL_TOOL_EFFECT, selected model local-gguf/ui-proof, one actual write_file result verified with SHA, successful final assistant turn; reconnect composer check also passes.
- Summary local-qwen-history-replacement-pass.json links failing reproduction and passing native/browser evidence. Prior failures retained. Selected workflow achieved, not arbitrary local model reliability or full production acceptance.
- Original endurance PID16744 independently live; 24-hour, remaining voice/mobile/cloud/general acceptance still open.

### Local assignment config export/import/restart fixed with actual UI evidence
- Reproduced real import rejection of valid registered local model: native artifact1793677185414 FAIL Imported assignment references an unavailable model. Prospective import validation created a cloud-only ModelFabric and omitted local transport catalog.
- Prospective validation now uses current local transport; host refreshes actual catalog before config import. Missing local assignments still rejected before transaction writes; no permissive fallback.
- Native integration1793677194020 PASS includes valid local default/coder import, reopened assignment resolution, rejected missing local model and both files byte-identical after rejection. Five selected native/settings leaves pass.
- Extended existing --gguf UI check: real Export Config download contains namespaced local assignment; actual Import Config file chooser submits it; host stopped/restarted and local effective model/Active state retained. Latest browser report printed with this commit; nine workflows PASS, including selected native UI runtime checks, removal/data preservation and reconnect.
- Runner inventory SHA/mode updated; inventory integrity VALID, not release sign-off. Full endurance/voice/external prerequisites and original master scope remain open.
- Exact browser evidence: artifacts/functional-browser/1793677221034/report.json (PASS, nine workflows, localAssignmentUIExportImportRestart=true).

### Local catalog and context-budget honesty
- ModelFabric listModels now includes actual registered namespaced local models. Text-only runtime entries advertise text input even if source model metadata has image flags.
- Native status now reports actual allocated contextSize (null when no allocation). Local catalog uses current native allocation for loaded model; unloaded entries show configured runtime cap and explicitly note allocation may be smaller. Local context budget no longer inherits hardcoded131072 window.
- Added real native assertions: selected loaded512-token model appears in catalog with native-allocation source and text-only input;4000-character prompt is out of budget with0completion tokens. Budget result explicitly labels character estimate and omitted tool/template overhead; no exact-token accounting claim.
- Eleven selected native/settings/ModelFabric test leaves PASS, native evidence artifacts/local-gguf-runtime/1793677290354/report.json. Existing actual history replacement, JSON/SSE terminal, tool import, abort/deadline recovery still pass.
- Actual browser --gguf --gguf-runtime artifacts/functional-browser/1793677307053/report.json PASS,nineworkflows, including config export/import/restart and UI runtime. No claim this run repeats local tool-generation acceptance.
- Runner integrity VALID; original endurance PID16744 independently live,24-hour acceptance still incomplete. Full master objective remains active.

### Local JSON/SSE usage attributed to actual selected model
- Local nonstream execution previously returned without recording real response usage; local streaming responses without model field were counted under generic streamed-model. Now actual local JSON usage is recorded once by namespaced requested ID, and SSE fallback attribution uses requested model when provider omits ID.
- Native test executes real JSON and streamed one-token generations, independently asserts2requests/2completion IDs under local-gguf/real-smol, no generic streamed-model entry. Selected measured usage snapshot persisted in artifacts/local-gguf-runtime/1793677385315/report.json.
- Seven selected ModelFabric/native leaves pass; native evidence still includes real import/history replacement, context allocation, terminal reasons, abort/deadline recovery and source preservation. Inventory VALID; no entire-release claim.
- Counts represent completed responses with reported usage, not every aborted/failed attempt. Native input counts are evaluated-token deltas and may exclude cached prefix; no billing or logical-prompt equivalence claim. Existing cloud JSON accounting is outside this specific correction.
- Original endurance PID16744 independently revalidated live; remaining24h/voice/external acceptance gates open.

### Local native management and inference share ownership queue
- Native host mutation RPCs (load/unload/self-test/update/delete/setup) previously accessed the same mutable engine outside inference serialization. Added shared exclusive queue and routed native host mutations through it. Read-only status/catalog requests remain available.
- Inference refreshes and revalidates local model availability after acquiring queue ownership, so a model removed while request waited is not silently substituted or executed from stale resolution.
- REAL_OS test starts genuine stream, schedules queued actual unload, cancels reader, observes unload completion and actual isLoadedfalse, then verifies real inference reload and successful generation. Native artifact1793677445274 PASS; no dummy native context.
- Actual browser --gguf --gguf-runtime artifact1793677472203 PASS,nineworkflows, including actual management controls, metadata/import/export persistence, removal/user-data preservation and reconnect. No claim that every possible management race has been stress-tested.
- Inventory VALID; original endurance PID16744 independently observed live. General endurance/release acceptance remains incomplete.

### Local generation parameter validation and explicit tool-choice support
- Local ModelFabric transport now rejects invalid/nonfinite/fractional token limits, invalid temperature/top_p/seed, and invalid timer bounds before native request admission. Prevents zero/negative limits silently reaching native generation and timer overflow behavior.
- Only implemented tool_choice auto/none accepted; required or named forcing explicitly unsupported instead of ignored. none omits definitions from native prompt, and parsed unexpected tool calls are rejected in both JSON/SSE service paths before tool request delivery.
- Native integration tests7invalid payloads, invalid timeout and unsupported required choice; usage remains0 before actual generation. Actual none request with declared sentinel tool still generates real token, native history contains no sentinel definition. Existing actual native sequence/usage/history/abort/unload/reload tests pass.
- Seven selected ModelFabric/native leaves PASS; latest native artifact artifacts/local-gguf-runtime/1793677565163/report.json. Unexpected model-generated call under none rejection is implemented but not independently induced with real model in this run; no claim of that behavioral test.
- No permissions popup introduced. Inventory VALID, original endurance PID16744 independently alive; remaining full acceptance stays open.

### Preserve earlier local tool turns across subsequent user messages
- Prior-to-latest-user projection previously dropped all tool-role results and null-content assistant calls. Added historical role projection that retains tool-call envelopes, exact failed/success result text and model responses; system instructions remain separately combined.
- Historical result IDs must match known calls; malformed/unattributed histories fail explicitly. Incomplete historical calls remain visible instead of invented results. Assistant prose plus separate tool_calls now retains both, rather than dropping calls when prose is nonempty. Existing XML call content avoids duplicate rendering.
- Three CONTRACT plus actual native regression PASS, artifacts/local-gguf-runtime/1793677679786/report.json. Historical tool examples are controlled transcript inputs testing serialization, not claims of tool execution in those tests.
- Existing actual browser --gguf --gguf-runtime artifacts/functional-browser/1793677654625/report.json PASS,nineworkflows. This run checks management/import/restart regression, not semantic recall of older tool results. Real multi-user tool recall acceptance remains unproven.
- Inventory VALID; original endurance PID16744 independently alive. Full master requirements remain active.

### Real second-user tool-history recall test exposes UI terminal-state bug
- Added --gguf-recall requiring real tool workflow. After actual verified write, second composer/send asks only prior tool-result SHA256 (not supplied in question), independently computed from real disk bytes; requires same local model, exact answer, persisted history and no new tool result count.
- Actual artifact1793677725935 FAIL Second actual local UI turn must settle; expected file was created with22bytes. No recall semantic pass claimed.
- Investigation: rpcDiagnostics contains only ONE chat.send request/response. Screenshot2.png shows first assistant reply complete in history but UI still Lobstering after1m25s; second user message sits queued above composer. Thus this run did not reach second model generation and exposes frontend terminal-state/queued-delivery issue, not proof of missing model recall.
- Added runner mode/digest; inventory VALID. Original artifacts preserved. Next required work is terminal chat event/UI state settlement and queued message delivery, then same strict recall test.
- Endurance original PID16744 independently live; summary5.946h, completed24Hoursfalse/resourceAcceptancePARTIAL. Full goal remains active.
