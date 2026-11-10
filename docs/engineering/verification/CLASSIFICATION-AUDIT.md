# Current supplement — 2026-11-10

See the [current correction matrix](CURRENT-ACCEPTANCE.md) for actual workflow evidence and open gates. The [additional test audit](ADDITIONAL-TEST-CLASSIFICATION.md) now records 107 source files, 25 reviewed additional files and 64 unreviewed files beyond the 18 original suite files. Integrity validation is not exhaustive classification or test execution. Source fingerprints explicitly normalize CRLF/LF; original audit byte hashes are retained. The detailed coverage tables below are the historical November 1 assertion audit, not current feature status.

# Historical test classification and acceptance correction — 2026-11-01

Current product status: **PARTIAL. Release acceptance: BLOCKED.** No phase is established as production complete by this audit. The existing test assertions provide useful component coverage, but their titles and historical PASS totals overstate the workflows they verify.

This report supersedes completion/readiness interpretations of the older engineering reports. Those reports remain below their dated correction notices as historical records. Their execution counts are not fresh results. README remains the master planning directive, with a current verification notice added above it.

The authoritative static inventory is [test-classification-inventory.json](test-classification-inventory.json). It covers **18 files, 137 leaf declarations: 89 phase leaves and 48 requirement leaves**. Every leaf has its exact title, source line, source-file SHA-256, actual assertion labels, required workflow labels, limited proof, explicit gap, and `PARTIAL` claim / `UNVERIFIED` verification status. These statuses describe the audited coverage; they do not claim that the implementations are absent or that the legacy assertions failed.

## Exact classification labels

| Label | Audited leaves | Meaning and limit |
|---|---:|---|
| `UNIT` | 19 | Isolated logic or static source/manifest checks; includes allocated buffers and supplied counters. |
| `CONTRACT` | 41 | HTTP/RPC response shapes, flags, catalogs and refusals. No independent workflow outcome. |
| `INTEGRATION` | 54 | Actual local component/store/filesystem/RPC state interactions. Handwritten fixtures do not prove remote execution. |
| `REAL_BROWSER` | 12 | A real browser engine navigates or interacts with the DOM. Generic selectors/text and weak assertions still leave acceptance gaps. |
| `REAL_OS` | 8 | Calls native desktop observation surfaces. All eight are observations; none proves a successful click, keyboard input, UIA invocation or multiple monitors. |
| `REAL_EXTERNAL` | 3 | Attempts a configured model through a live host or ModelFabric. This label does not independently establish upstream provenance or response quality. |
| `ENDURANCE` | 0 | Requires measured elapsed sustained operation and resource/outcome checks. A tight loop does not qualify. |

Each leaf currently has one actual label. `requiredLabels` may contain multiple exact labels. Classification is static assertion scope if executed, not a run result. All legacy assertions were **NOT_RUN by this audit**.

## Phase coverage and current acceptance status

| Suite | Leaf count | Current phase acceptance | Principal missing evidence |
|---|---:|---|---|
| Phase 1 | 6 | PARTIAL | Readiness flags are not startup/supervision or fault recovery. |
| Phase 2 | 8 | PARTIAL; browser gate BLOCKED | Generic root/branding checks; preferences use RPC rather than a form. Concurrent parent scrolling fix now requires wheel movement and a real scroll increase on the about page; not rerun here. |
| Phase 3 | 6 | PARTIAL | One configured provider attempt; no two-provider execution, parallel agent models, measured incremental streaming or failover. |
| Phase 4 | 6 | PARTIAL | Metadata/messages and sequential DAG statuses; no independent artifact/provenance or parallel-overlap assertions. |
| Phase 5 | 6 | PARTIAL | `:memory:` recovery and idempotency checks; no killed/restarted process resuming disk checkpoints. |
| Phase 6 | 4 | PARTIAL | Bundled metadata and test manifests; no external package execution. Function handlers disappear during JSON serialization and no computed dot product is checked. |
| Phase 7 | 6 | PARTIAL | Desktop reads and hold/lease contracts; no successful physical input with readback or multi-monitor operation. |
| Phase 8 | 4 | PARTIAL | Synthetic buffer ingestion and handwritten observations; no actual OCR/capture or elapsed soak assertion. |
| Phase 9 | 5 | PARTIAL | Local fixture retrieval/RPC changes; no disk reopen or retrieval quality benchmark. Consolidation mutates shared host data. |
| Phase 10 | 5 | PARTIAL; retrieval UNVERIFIED | Citation shapes and local files/artifacts; no independently fetched-source validation. |
| Phase 11 | 4 | PARTIAL | Manual scheduler/event triggers; no unattended timer or external service outcome. Event test deletes existing screen rules. |
| Phase 12 | 3 | PARTIAL; real cloud-worker gate BLOCKED | Local worker registration/handoff history is not remote execution; no cloud worker available. |
| Phase 13 | 3 | PARTIAL | Approval comparison is performed in the test, followed by cancellation; no production approval enforcement. |
| Phase 14 | 7 | PARTIAL; physical-device gate BLOCKED | Server records and notification queue; no physical device available. |
| Phase 15 | 7 | PARTIAL | Synthetic tone VAD and lifecycle/byte-count assertions; no recognized utterance, audible speech or voice-directed task. |
| Phase 16 | 5 | PARTIAL; browser gate BLOCKED | Indicators and toggle text; no backend outcome. One specific HTML error search misses other browser exceptions. |
| Phase 17 | 4 | PARTIAL; release BLOCKED | Launcher strings, backup integrity and flags; no clean-machine install/restore/update/rollback/uninstall, compatibility matrix or endurance. Secret scan is not invoked by this suite. |
| Requirements 1–48 | 48 | PARTIAL; required workflow gates BLOCKED | See each exact requirement entry in the inventory. |

Phase 0 and the other legacy suites (`e2e-*`, RPC, native gateway and ad hoc browser scripts) are **not re-audited or rerun** here. This inventory must not be represented as all repository test coverage.

Historical totals such as “106 phase PASS” and “49 PASS across 48 requirements” include suite containers. The current phase sources contain **89 leaves plus 17 parents = 106 reported nodes**; the requirement source contains **48 leaves plus one parent = 49 nodes**. A parent is not an additional acceptance test. Historical run totals cannot establish that any current workflow passed.

## Reported integration evidence and open blockers

The following are **user-reported during this audit**, not independently rerun or inspected by this runner:

- An earlier real browser audit reproduced a `trim` on undefined failure in `control-ui-boot-shared` (`fT`) and missing RPCs `skills.status`, `library.list`, `config.schema`, `doctor.memory.status`, `webSearch.status`: that earlier workflow result was **FAIL**. The latest reported smoke after the canonical `__openclaw__/` asset-path fix activates the native UI plugin, with **no chat trim crash**, model picker displayed, Voice **PARTIAL**, Workforce **1 configured**, Screen **Stopped**, **9 actual skills** listed, Search form and real Memory status rendered. This is a reported smoke improvement; **persisted interaction and reconnect have not passed**, so full browser acceptance remains **BLOCKED**. The five previously missing RPCs were not individually revalidated by this audit. The earlier finding is retained in the inventory's browser history.
- Actual NVIDIA `zero-lead` inference returned literal `ZERO_CONNECTION_OK` in **1938 ms**. This supports one inference path only. It does not close multi-provider, streaming, concurrent-agent or end-to-end workflow gates.
- The search provenance contract passed **3/3**. A later real query, **Windows UI Automation**, returned **status empty**, **both APIs HTTP 200**, and **zero citations**. This is not source retrieval PASS. Real source retrieval remains **UNVERIFIED**; transport success and truthful empty reporting do not establish retrieved evidence.
- `scripts/backup-user-state.mjs` reportedly captured **19 database/config files** at `.backup/functional-correction-1793549776379`, with integrity reported OK. This is backup evidence only; restore, migration, crash recovery and logical state preservation remain unverified.
- The user confirmed **no actual mobile/device/cloud worker is available**. Physical-device, mobile delivery and real remote/cloud execution gates are **BLOCKED**, never PASS from local registration fixtures.

The user identified milestone commit **`bd4607f`** for search provenance and the backup script. Read-only Git inspection confirmed that commit changes `packages/research-engine/search.mjs`, `scripts/backup-user-state.mjs` and `test/search-provenance.test.mjs`. This audit created no commit and does not take ownership of that parallel implementation work.

The ten explicit unimplemented evidence gates in the inventory cover browser workflows, real input/multiple monitors, capture/OCR, model/agent execution, external extensions/connectors, process recovery/state preservation, 24-hour observation, clean Windows release, physical device/voice workflows, and actual remote/cloud workers. A gate records missing required evidence; it is not a claim that parent implementation work is absent.

## Runner and integration contract

Safe operations in the shared checkout:

```powershell
node test/run-classified-verification.mjs --check
node test/run-classified-verification.mjs --output docs/engineering/verification/classified-audit-run.json
node --test test/verification/classification-runner.test.mjs
```

The default is a **dry static audit**. It does not import existing test suites or production packages, read `.env`, obtain credentials, probe port 18789, launch/restart the owner host, run broad tests, open owner databases or alter owner config. The self-checks use only invented fixture events and short-lived fixture processes in a fresh OS temporary directory. Fixture results are runner correctness evidence, never product evidence.

`--check` returns **0** only for inventory integrity and prints `execution: NOT_RUN`, `releaseStatus: BLOCKED`. A normal dry audit returns **2**, with all selected legacy leaves `NOT_RUN`, zero verified requirements, and release `BLOCKED`. Exit **1** means executed assertions failed; exit **2** also covers blocked prerequisites, skipped/TODO/missing leaves, timeouts, protocol problems and open release gates. The runner never returns 0 as a product acceptance verdict.

The report distinguishes `summary.assertionStatus` from `summary.releaseStatus`, counts leaf assertions only, and retains gaps even if assertions pass. Node skip/TODO directives (including an empty reason), missing children after a suite skip/setup failure, cancellation, timeout, duplicate/unknown child results and nonzero process exit prevent an overall assertion PASS. An ordinary failing assertion remains FAIL. A suite/container PASS adds no test to the count. Required workflow gates remain BLOCKED even when all selected legacy assertions pass.

The optional legacy-execution interface requires **both** explicit suite IDs and `--disposable-environment`:

```powershell
# Only in a disposable checkout with isolated state/config and a separate host environment.
node test/run-classified-verification.mjs --execute --suite phase8 --disposable-environment --timeout-ms 60000
```

**Do not execute legacy suites in `E:\zero` against the owner host or owner databases.** The acknowledgement flag is not a sandbox and does not rewrite the existing hardcoded port 18789 or state paths. Isolation must exist before invoking execution. Chrome/playwright/Windows prerequisites are checked when applicable; other setup/provider failures are recorded from the child rather than presumed satisfied. Child processes have bounded deadlines, no shell invocation and hidden windows. Raw child logs, payloads and error stacks are not saved, avoiding accidental credential disclosure. Reports contain a compact failure category; use isolated child diagnostics for deeper troubleshooting.

Inventory source hashes deliberately fail closed after any existing test changes. Review the changed test bodies and update exact titles, lines, hashes and claims/gaps together; do not blindly refresh a hash to silence drift. Parent package/host/UI work is not frozen by these test-source hashes and needs its own later integration evidence. New legacy test files also require inventory review.

During final validation this guard detected a concurrent parent edit to phase 2: its earlier `scrollY >= 0` check was replaced by finding an overflowing element, sending a browser mouse-wheel action, and requiring an increased scroll position. That diff was reviewed statically and the phase-2 inventory updated, retaining the earlier audit description/hash in `auditHistory`. This improves assertion scope, but no browser run or owner-state test was performed by this audit. The separate 48-requirement scrolling test still only searches CSS.

## Verification and ownership

- Inventory integrity: **18 files / 137 leaves matched**, exact labels/titles/lines/source hashes checked.
- Runner checks: **16 passed, 0 failed, 0 skipped**. They cover real Node reporter pass/fail/skip/TODO, pre-declaration suite skip, setup failure, deadline enforcement, source drift, count/label drift, release aggregation, full CLI dry audit and integrity-only exit behavior.
- Legacy suites against owner host/state: **NOT_RUN**.
- Broad regression, real retrieval, native input/capture/OCR, clean installation, 24-hour endurance, physical device and cloud execution: **NOT_RUN / BLOCKED**, according to the individual inventory gaps and unavailable prerequisites.
- New code is restricted to `test/run-classified-verification.mjs` and `test/verification/`. Other changes are README and engineering verification/tracker reports. No existing test implementation, package or host/UI implementation was edited by this audit. Other workers have concurrent changes in those areas.
- No commit was made. To revert this audit, remove its new runner/report files and the added documentation correction notices; retain other workers' edits.

Execution evidence is saved in [classified-audit-run-latest.json](classified-audit-run-latest.json) and [classification-runner-checks.tap](classification-runner-checks.tap). The [initial dry report](classified-audit-run.json) is retained as an earlier evidence snapshot. The dry reports' nonzero exit is intentional evidence that required acceptance has not passed.
