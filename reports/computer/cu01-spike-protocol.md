# CU-01 Prep — Windows CUA Spike Protocol (written before any live run)

**Ticket:** CU-01 preparation (Qoder) · **Written:** 2026-10-23, immediately after CU-00 · **Updated 2026-10-23 08:50 IST:** G-G item 15 (connection death without `pagehide`) folded in; k7 runner implemented offline; rig 152/152.
**Status:** **PLAN ONLY. Nothing here has been executed.** No environment was created, no driver installed, no desktop touched.
**Purpose:** make CU-01 one-shot repeatable and honest, so that when the designated Zero environment and an approved install window exist, the run produces evidence rather than impressions.

Source of every step: [`windows-cua-inventory.md`](windows-cua-inventory.md) (CU-00). Requirements are cited there, not repeated here.

---

## 0. Go / no-go gates (stop the run if any fails)

| Gate | Required state | If missing |
|---|---|---|
| G1 Environment | A **VM or separate Windows test account**, not the everyday profile (D-003) | Do not run. Ask `@manager`. **Hard stop — no substitution with the user's own desktop.** |
| G2 Install approval | Senior-approved, announced, non-overlapping install window; ≈ **28 MiB** driver delta + OpenClaw itself (CU-00 §8.1) | Do not install. CU-01 stays WAITING |
| G3 One heavy job | No other developer mid-install/build | Defer; announce in `AGENT_CHAT.txt` first |
| G4 Vision model | Gateway route exposes a vision-capable model (shared with BE-01, D-002) | No live proof possible; record as blocked, do not fake with a text-only model |
| G5 Single display | One monitor, and **100 % scaling measured** | If multi-monitor/scaling ≠ 100 %, run anyway *only* to record the failure mode — CU-00 §5 predicts `COMPUTER_UNSUPPORTED_DISPLAY` |
| G6 Synthetic content only | Fixture text like `ZERO CU01 SENTINEL <runid>`; no personal files, no credentials, no real accounts | Abort |

## 1. Environment snapshot (record before any action)

**Automated, prepared, not executed:** [`computer/spike/preflight.ps1`](../../computer/spike/preflight.ps1) — read-only (no install, no launch, no input, writes only `-OutFile`, account name redacted). Run it first and merge its JSON into `result.json`; it already computes the abort verdict.

Capture into `result.json` (no screenshots of private content):
Windows edition + build (`winver` equivalent via a read-only command), session type (console / RDP / disconnected), whether the desktop is unlocked, user account name **redacted to a role label**, display count, resolution, **per-monitor scaling %**, Node version, OpenClaw version + how it was installed, `@trycua/cua-driver` resolved version, doctor check output.

Rationale: CU-00 found the non-macOS capture path asserts `screen geometry == screenshot geometry`; scaling behaviour on Windows is the single most likely silent breakage.

## 2. Setup sequence (each step: command → expected → observed)
All CLI steps run from `E:\zero\backend` through the local pnpm shim — **`openclaw` is not on PATH**, and that shim is what sets `NODE_PATH` into the pnpm store (verified read-only; `corepack.cmd pnpm exec openclaw …` is the equivalent form). Shown below as `openclaw …` for brevity.

1. `openclaw plugins enable cua-computer` → expect explicit enablement, not policy-only load.
2. `openclaw doctor --lint --only cua-computer/driver-artifacts` → expect `no findings`. Any `COMPUTER_DRIVER_*` = stop and record which code. Expect the **release's** driver version `0.32.0` and its digests, not the `0.34.1` record in my CU-00 inventory ([release-pin-reconciliation.md](release-pin-reconciliation.md)).
3. Start the node **from inside the interactive desktop session**: `openclaw node run`. Record which session it inherited and whether it survives that session locking later (step 9).
4. `openclaw nodes pending` → approve the pairing update; confirm the approved surface carries **`computer.act` + `screen.snapshot` + `desktop.stream`**.
5. Confirm the tool surface: `computer` exposed by policy (Full, or `tools.alsoAllow:["computer"]` if a `coding` profile is set). Record the provider descriptor as advertised (expected: `contractVersion 2`, `multiDisplay:false`, `agentCursor:false`, `recording:true`).
6. Live view: start/confirm the node's loopback RFB server (VNC auth on, loopback bound), then open the Control UI Desktop panel and select the node. Record whether the panel is view-only or interactive and whether input reaches the desktop.

**Topology choice, decided before the run:** R1 (Gateway elsewhere + paired Windows node) is the product shape, but R2 (Gateway on the same Windows host, plugin enabled) is the faster first proof. Run R2 first, then R1 once, and report both — CU-00 §2 notes they share the provider implementation, so a result transfers.

## 3. The harmless task (the actual spike)

Fixture: Notepad (in-box, no install, no network, no personal data).

| Step | Verb | Action | Evidence to keep | Pass condition |
|---|---|---|---|---|
| S1 | observe | `screenshot` | `frameId`, width/height | frame returned, geometry matches §1 |
| S2 | act | `launch_app` Notepad (or Win-key + `type` if launch is refused) | new frame | window visible in next frame |
| S3 | observe | `list_windows` → `get_window_state(windowRef, includeScreenshot:true)` | `windowRef`, `observationId`, before-image | window found; **record whether background observation works on Windows** (CU-00 §5: desktop input is foreground-only) |
| S4 | act | `type` the sentinel string | observation after action | sentinel present in the window observation |
| S5 | act | `key` **`ctrl+s`** (allowed chord: modifier + ASCII letter) then `key` **`Return`** to accept Save; if a Save dialog appears, `type` the synthetic filename into it | before/after frames | file created under a scratch dir owned by the run |
| S6 | verify (host-side, independent of the screen) | read the saved file back with `file.fetch` / `file.stat` | byte size + sha256 + decoded text | text **equals** the sentinel — this is the only real proof; a screenshot is not |
| S7 | verify (re-open) | close the window, relaunch by opening the file, screenshot | frame | sentinel visible again |
| S8 | live view | while S2–S7 run, the human watches the Desktop panel | note latency + whether actions are visible in the relay | human can see the work without asking the model |
| S9 | stop | interrupt the run mid-action, then (separately) apply `gateway.nodes.commands.deny:["computer.act"]` | logs + next-call error | in-flight call cancelled; after deny, further `computer.act` is refused and **hot-applies without a Gateway restart** |
| S10 | recovery | unlock/lock the session, re-run one action | codes observed | `COMPUTER_DRIVER_UNAVAILABLE` vs a fresh session after `prepareExecution` expiry recovery; **verify the interrupted action was NOT replayed** |
| S11 | takeover | try `take_control` | exact error | CU-00 §6 predicts `take_control is only available for an attached or session desktop` → **this is a documented gap result, not a pass** |

Deliberate negative checks (cheap, and they prove the guardrails rather than the happy path):
`key:"1"` → expect `COMPUTER_UNSUPPORTED_KEY`; `shift`-modifier click → expect `COMPUTER_UNSUPPORTED_ACTION`; `screenIndex:1` → expect `COMPUTER_UNSUPPORTED_DISPLAY`; a `hold_key` action → expect refusal; a stale `displayFrameId` → expect `COMPUTER_STALE_FRAME`.

### 3b. Hold-recovery check — G-G item 15 (CU-02, no Notepad content)

**Why this belongs in the same window:** the D-009 hold is the only thing stopping a human and the agent from fighting over one cursor. If the browser dies while holding, a lease that cannot be released is a stuck control state, and "refresh the page" must not be the recovery procedure. The plugin fix is live (`zero-policy` 0.1.3, proven at the Gateway layer 2026-10-23 08:34 IST), but the **Control UI path** and the **agent-side stale-frame half** have not been re-proven on the designated environment.

**Do not simulate this with the Release button.** A clicked release runs `pagehide` and is the normal path. This check requires the owning connection to die without its `pagehide` handler: kill the renderer/tab, drop the network, or close the raw WS. Say which one was used in `note`.

| # | Action | Expected | Evidence field |
|---|---|---|---|
| H1 | From the connection under test — Control UI for the UI claim, CLI/raw-WS for the Gateway-layer claim — `take`; read `stats.releasedByDisconnect` (= N) | `held:true`, `owned:true`, opaque `controlLeaseId`, and `resumeSnapshotRequired:false` before the take | `holdRecovery.releasedByDisconnectBefore`, `holdRecovery.resumeSnapshotRequiredBefore` |
| H2 | Kill the owning connection **without** `pagehide` (renderer/tab kill, network drop, or raw WS close) | host aborts the per-WS `AbortController` (`socket.once("close")`) | `holdRecovery.ownerConnectionClosedWithoutPagehide` |
| H3 | From a **new** connection, `status` | `held:false`, `owned:false`, `resumeSnapshotRequired:true`, `stats.releasedByDisconnect = N+1`, newest `recent[]` row = `{kind:"lease", action:"release", reason:"connection-closed", decision:"allow"}` (the ring appends, so it is the last element) | `statusFromNewConnection`, `statusReadFromNewConnection`, `releasedByDisconnectAfter`, `connectionClosedAuditRow` |
| H4 | Issue one agent input action (`left_click` at a synthetic coordinate, or `type`) before any fresh capture | refusal `computer-hold:stale-frame`; the input **must not land** | `holdRecovery.inputBeforeFreshCapture` |
| H5 | `screenshot`, then repeat the same input action | screenshot allowed; the repeated action is no longer stale-frame refused | `holdRecovery.freshCaptureClearedGate` |
| H6 | Disconnect a **non-owner** connection | `releasedByDisconnect` unchanged; the hold is untouched | note only |

Pass condition: H3 and H4 exact, H5 true. H1 must start from a clear gate: if `resumeSnapshotRequired` is already true before the take, capture a fresh frame first, otherwise H3's `true` cannot be attributed to this disconnect. If `pagehide` ran, set `ownerConnectionClosedWithoutPagehide:false` — H1/H3 may still look right, but **k7 stays false** and the run must not claim crash recovery. A `get_window_state` without `includeScreenshot:true` does not clear the gate.

**Already proven, not to be re-litigated:** the Gateway-layer half (H1/H3) was proven live on 2026-10-23 08:34 IST — a CLI connection took the hold, closed, and a new connection saw `held:false`, `resumeSnapshotRequired:true`, `releasedByDisconnect:1`, and a `connection-closed` lease row. What remains to record is the agent-side refusal (H4/H5) and, if the UI claim is to be made, the Control UI connection-death path; until then `verdict.k7` stays unclaimed.

**Runner (implemented offline, gated):** [`computer/spike/k7-run.mjs`](../../computer/spike/k7-run.mjs) automates H1–H3 only. It makes three `zero.computer.control` calls from separate CLI processes: status, take, then status from a new process. `--live` refuses unless the owner has written `computer/spike/designated-environment.json` with `designated:true`, `designatedBy:"owner"`, `ticket:"CU-01"`, `o1Resolved:true`, `holdRecoveryApproved:true`, a role label (not an account name) and a UTC timestamp. It also refuses to take when the hold is already held, the counter is missing, the fresh-capture gate is already armed, or display/scaling/session cannot support H5. It writes `holdRecovery.pending.json` with `result:"not-attempted"` and `ownerConnectionPath:"cli"`. H4/H5 are recorded by the Operator run and merged with `--merge`; only that merge can produce `result:"pass"`. The runner never creates the marker, never sends desktop input, and never performs H4/H5. `--plan` is the default and performs no network, no child process and no write. The marker's hold approval does not authorize the H4/H5 input run; O5/O6 still gate that Operator action.

**Path honesty:** a k7 pass with `ownerConnectionPath:"cli"` proves the Gateway mechanism and the agent-side gate; only `control-ui` proves the browser-tab/renderer death path. The report must keep that distinction rather than collapsing both into "crash recovery".

H4/H5 evidence file for `--merge` (synthetic values; `desktopEffect` must be `none`, and the action must be an input action from the rig taxonomy):

```json
{
  "inputBeforeFreshCapture": {
    "action": "left_click",
    "errorCode": "computer-hold:stale-frame",
    "refused": true,
    "desktopEffect": "none"
  },
  "freshCaptureClearedGate": true,
  "note": "Operator: input refused before capture; screenshot; same input no longer stale-frame"
}
```

## 4. Evidence output layout

Under `reports/computer/spikes/<runid>/` (my owned area; synthetic content only, no credentials, no private pixels):
`result.json` (per-step status + error codes + versions + the `holdRecovery` block), `holdRecovery.pending.json` (H1–H3 from the runner; `result:"not-attempted"`), `holdRecovery.json` (after H4/H5 merge; the only file that can carry `result:"pass"`), `s1..s8` frame images, `doctor.txt`, `nodes-pending.json` (node ids redacted), `env.txt`, and a short `run-notes.md`. Screenshots must show only synthetic fixture content — if the relay catches anything personal, do not keep it.

## 4b. The rig that runs this (implemented + self-tested offline, never run against a machine)

`computer/spike/rig.mjs` holds the pure logic; `computer/spike/rig.test.mjs` proves it (**152 passed / 0 failed, exit 0** — run it, it is offline and dependency-free). It is deliberately not a driver: no network, no child process, no Gateway, no desktop. `computer/spike/k7-run.mjs` is the gated designated-environment runner for H1–H3 (default `--plan`; `--live` requires the owner marker; H4/H5 are merged afterwards). Its pure functions are covered by the same suite, and `node computer/spike/k7-run.mjs --plan` currently prints `BLOCKED` on the missing designation marker — which is the correct offline state.

What it enforces, so a run cannot drift into a claim the evidence does not support:
- **G-A gates** (`evaluateGates`): unsupported CPU target and zero-displays **abort**; multi-display, scaling ≠ 100 %, missing loopback RFB and a non-interactive session are recorded as **risks**, not silently passed — matching CU-00 §5's specific predictions.
- **Doctor output** (`doctorPassed`): only a clean `no findings` is a pass. A line that says `no findings` *and* carries a `COMPUTER_DRIVER_*` code is **not** a pass, and unparsable output is flagged rather than treated as success.
- **Evidence validation** (`validateStep` against `result.schema.json`): closed object, required fields, enums, nested types, explicit-null acceptance.
- **Verdict honesty** (`computeVerdict`): **K2 cannot pass without a host-side readback** whose `sha256` is well-formed and whose `sentinelMatched === true`. A screenshot-only S6, a malformed digest, or mismatched content all force `k2 = false`, and each shortfall is appended to `notClaimed`. `k5` (takeover) stays **false** when S11 is `refused-as-expected` — the gap is recorded as `takeoverGapConfirmed`, never as a pass.
- **Connection-death recovery** (`validateHoldRecovery` / `k7`): the no-pagehide path cannot pass on a normal release, a status read from the same connection, an unchanged `releasedByDisconnect` counter, a missing `connection-closed` audit row, a hold refusal masquerading as `computer-hold:stale-frame`, or an uncleared fresh-capture gate. A `not-attempted` block adds the shortfall to `notClaimed`.
- **Designation gate** (`validateDesignationMarker` / `evaluateK7Readiness`): live H1–H3 refuses without an owner-written marker, refuses to self-designate, and refuses to take when a hold already exists. A display count other than one, scaling other than 100 %, or a non-interactive session blocks the run before the hold is taken, because H5 could not clear the gate in that environment.
- **Pre-write screen** (`screenEvidence` / `redact`): refuses evidence containing key-shaped strings, bearer tokens, private-key blocks, user-profile paths, UNC home paths or the `.zero-data` location, and redacts account names. My §5 rule "no personal data in evidence" is now enforced by code rather than by memory.
- **Hold classification** (`classifyActionForHold`): the 10-name observation set and the input set, with an unknown/empty action returning `unknown` so the caller must fail closed.

Writing this paid for itself immediately: the first run caught **two defects that would have burned the window** — the schema rejected the rig's own step records (G-F would have failed on its first write and looked like a provider fault), and one detection regex was invalid under the `u` flag so the module would not parse. Both fixed. Logic verified ≠ integration verified: nothing here has met a real machine.
## 5. What I will **not** claim

- Not a pass if only the model saw the frame (screenshots are model-only upstream; the human's view is the RFB relay).
- Not a pass on "action acknowledged" alone — CU-00 §5: an acknowledged input is not proof the app responded. S6 host-side readback is mandatory.
- Not crash recovery if `pagehide` ran or the Release button was used. That is the normal release path; `k7` requires a no-pagehide owner death **and** the stale-frame refusal.
- Not browser-UI crash recovery when `ownerConnectionPath` is `cli` or `raw-ws`. That proves the Gateway mechanism, not the Control UI tab/renderer path; only `control-ui` supports the UI claim.
- Not a Windows proof from a Linux container or from the macOS rig.
- No mock fixtures presented as live results.

## 5b. Evidence mapping — every live check has a field that holds its answer

Rationale: an evidence schema that no check writes into is decoration, and a check with nowhere to record its result gets "remembered". Each G-G item from [build-readiness.md §3](build-readiness.md) names its destination in [`computer/spike/result.schema.json`](../../computer/spike/result.schema.json).

| G-G item | Question | Schema field(s) |
|---|---|---|
| 1 | Does a trusted policy fire for the core `computer` tool? | `steps[].refusalObserved.{reasonAsSeenByModel, structuredErrorPresent}` + `steps[].result` |
| 2 | Was the policy accepted at registration? | `run.doctorDriverArtifacts`-adjacent activation evidence in `run.note`; absence must appear as `steps[].result = "fail"` on S5, never silently |
| 3 | Method scope + discovery for `zero.computer.control` | `steps[].holder.{held, owned, controlLeaseId, scope}`; already partly discharged by the senior's 06:22 round-trip |
| 4 | Post-handover staleness enforced? | `steps[].holder.{resumeSnapshotRequired, inputRefusedWithReason}` + `frame.displayFrameId` predating `holdEndedAt` |
| 5 | Fail-closed on policy crash | `refusalObserved.degradedToGenericPolicyFailure` (must be false for our reason to survive) |
| 6 | Emergency-stop layering | `steps[].stop.{lever, hotAppliedWithoutGatewayRestart, screenshotStillWorkedAfterDeny}` |
| 7 | In-flight action not cancelled by a hold | `steps[].stop.inFlightNativeActionStopped` (expected false for the tool layer) |
| 8 | Code-mode route under D-011 | `steps[].inputKind` + `verdict.codeModePathUnreachableUnderD011` |
| 9 | Verbatim refusal string the model sees | `steps[].refusalObserved.rawToolResultText` |
| 10 | Code-mode refusal visibility | same, with `inputKind = "code_mode_exec"` |
| 11 | Vision path reads the delivered frame | `steps[].frame.{width, height, referenceWidth, coordinateSpace}` + `verdict.visionPathVerified` |
| 12 | Upstream viewer arbitration + effective observe scope | `verdict.missingScopeVsUnavailable` (`missingScope` ≠ `unavailable`), `steps[].liveView.relayState`, `closeCode` |
| 13 | Hold necessary, not duplicative | `steps[].result` for the agent action issued while a human holds viewer control |
| 14 | exec denial does not weaken verification | `steps[].hostSideVerification.{command, approved, sha256, sentinelMatched}` |
| 15 | Does a dead owner connection free the hold without `pagehide`, and is the fresh-capture gate armed? | `holdRecovery.{ownerConnectionClosedWithoutPagehide, statusReadFromNewConnection, statusFromNewConnection, releasedByDisconnectBefore/After, connectionClosedAuditRow, inputBeforeFreshCapture, freshCaptureClearedGate}` + `verdict.k7` |

Rules that make the mapping trustworthy rather than decorative: `K2` is computed from the host-side readback and **cannot** pass on a frame; `additionalProperties: false` means a new field must be added deliberately, not smuggled in; and `screenEvidence` screens the serialised payload before it is written, so "no credentials or personal content in evidence" is enforced in code.
## 6. Known risks to watch during the run

1. **Session state** — docs require `openclaw node run` from the interactive session; whether an RDP/disconnected/idle-locked Windows session survives is `[UNVERIFIED]` and is the top CU-03 reliability item.
2. **DPI** — the geometry equality assertion (§1) may make a 125 %-scaled laptop display unusable.
3. **Foreground collision** — the agent moves the real cursor; a human at that desktop and the agent will fight. That is the takeover gap.
4. **Plugin-enablement contradiction** — manifest `enabledByDefault: true` vs docs demanding explicit enable (CU-00 §4.3); record which actually gates the provider on Windows.
5. **fs-safe native package on win32-arm64** — unverified; run on x64.

## 7. Inputs outstanding (reconciled after D-011 and the model route)

Canonical owner-input list, gated commands and resource estimates: [`build-readiness.md`](build-readiness.md) §1 (O1–O8 marked resolved/open) and §3 (gates G-A…G-G).

**Closed since this protocol was drafted — no owner action left on these:** O4 model route (NVIDIA NIM `z-ai/glm-5.3-flash`; the image-input claim is still `[needs live proof]` through BE-01, and my G-G item 11 checks the narrower thing that actually matters — whether the model reads *our* delivered frame and returns coordinates in that space). O7 code-mode (D-011 denies Operator `exec`; the plugin matcher stays as defence in depth). O8 `escalate_scope` blocked by template config, not by code.
**One consequence worth pinning here:** D-011 does **not** weaken S6. The host-side readback uses `file.fetch` / `file.stat`, which are separate pairing-approved node commands, not `system.run`. The strongest proof in the spike survives exec denial, so re-enabling `exec` to "simplify" verification would be a regression, not a shortcut.
**Cross-lane asks are answered:** OpenCode's five-point live-view surface is folded into `computer/spike/result.schema.json`, with the relay's missing frame identity declared rather than hidden; DeepSeek's placement is settled (Operator agent, profile + `alsoAllow`, never `tools.gatewayPolicy`, because that needs a Gateway restart and would break a stop button).

**Still open — owner only:** O1 designated environment · O2 loopback RFB server consent and product · O3 install ordering behind DeepSeek's single job · O5 CU-01 takeover scope (my recommendation: accept S11 as a measured gap on unmodified upstream, then prove the hold at G-G) · O6 hold-test order (recommendation: after CU-01, so the baseline stays attributable) · plus explicit GO.



## 8. 2026-10-26 bounded Control UI run: H1-H3 live, H4/H5 blocked

Owner authorization covered a bounded, harmless run on the owner's normal interactive Windows
profile. The runtime was the existing fresh-workspace Gateway and the existing native Control UI;
no second viewer, relay, route, or desktop service was created.

### 8.1 H1-H3 now live on the Control UI connection path

- Take through the Zero hold bar on `/systems`: `held-this-client`; CLI status from a separate
  connection read `held:true, resumeSnapshotRequired:false`, proving the gate started clear.
- Closed the owning Control UI tab without Release and without relying on `pagehide`.
- A new connection read `held:false`, `resumeSnapshotRequired:true`,
  `stats.releasedByDisconnect` 1 -> 2, and two newest audit rows with
  `kind:"lease", action:"release", reason:"connection-closed", decision:"allow"`.
- The surviving second tab converged to `free` and did not retain a stale `held-this-client`.

This satisfies H1-H3 with `ownerConnectionPath:"control-ui"`. It does **not** satisfy H4/H5, so
`verdict.k7` remains unclaimed.

### 8.2 H4/H5 exact blocker: no working vision-capable model route

The `computer` tool is not created when `modelHasVision === false`
(`dist/computer-tool-BYo9lKTd.mjs:156`). The configured route `nvidia/z-ai/glm-5.3-flash` is
`input:"text"`. A bounded Operator turn on that route produced a tool list with no `computer`
tool, so no refusal path existed. Two catalog entries advertising `text+image` were tried as
explicit one-turn `--model` overrides (no config change):

| Model | Result |
|---|---|
| `nvidia/moonshotai/kimi-k2.6` | provider 404 "This model was not found" |
| `nvidia/minimaxai/minimax-m3` | provider 410 "The request took too long", repeated retries |

No agent input was issued; `stats.refusedByHold` and `stats.refusedByStaleFrame` stayed 0. The
pre-existing `API.txt - Notepad` window was not touched, and no Notepad document was created by
this test. H4/H5 therefore remain offline-tested only (backend selftest 111/111) and must be
re-run once a working vision-capable route exists.

### 8.3 Live view

`desktop.observe` for the paired node returns
`UNAVAILABLE: desktop stream loopback RFB server is unavailable on port 5900`. The native
Desktop panel shows "Set up a desktop server". No VNC/RFB server was installed and no
UAC/admin prompt was attempted. This is the exact remaining prerequisite.

### 8.4 UI defect found by the run

The first live build re-mounted the hold bar on every observer tick (wrong parent comparison),
blocking the `/systems` main thread. Fixed in `src/native-surfaces.js` (`canReuseComputerHold`,
ignore mutations inside the hold wrapper) with an offline regression; rebuilt generation
`56b1d59f...` is served byte-identically.

## 9. 2026-10-26 re-check: hold released, third vision candidate found, H4 still blocked

### 9.1 Hold state after the audit

The hold taken for the H4 attempt was released through the `/systems` bar at 14:29:01 IST
(`zero-policy: human hold released (zl-00096b...)`). A CLI status read afterwards returns
`held:false, owned:false, scope:"global", resumeSnapshotRequired:true`, `takes:4`, `releases:4`,
`releasedByDisconnect:2`, and every refusal counter `0`. No lease was left behind.

### 9.2 H4 retry with `nemotron-3.5-super-vl` (no config change)

A bounded `openclaw agent --agent operator --model nvidia/nemotron-3.5-super-vl-120b-a12b` turn
returned "there is no `computer` tool" (run `3191e19c-...`). Two independent reasons:

1. the CLI path is embedded (`embeddedMode === true`), and the host gate returns early for embedded
   runs (`dist/computer-tool-BYo9lKTd.mjs:156`);
2. `openclaw models list` still declares the model `input:"text"`, so `modelHasVision === false`.

The provider itself answers that model with HTTP 200, but its reply was `content:null` plus
`reasoning_content`, i.e. not a usable assistant turn at `max_tokens:8`.

### 9.3 New evidence: a working vision-capable candidate exists on this account

`minimaxai/minimax-m3.1-flash` (present in `GET /v1/models`, absent from the local catalog):

| Probe | Result |
|---|---|
| text, `max_tokens:16` | HTTP 200, content `PING`, ~3.7 s |
| 8x8 solid-red PNG + "dominant colour?" | HTTP 200, `reasoning_content` describes "a solid color... uniform color block" (image input accepted; answer truncated by `max_tokens:24`) |

So the blocker is now a **declaration/decision** problem, not an absence of vision models: the live
catalog has no entry for this model, and D-012 keeps live providers/model routes unchanged. The safe
next step is an owner-approved catalog entry (`input:["text","image"]`), a Gateway reload, and then
H4/H5 as a **gateway-hosted** operator turn with the hold taken. No config, credential, or model
binding was changed for this check.

### 9.4 What remains offline-only

`computer-hold:human-control` and `computer-hold:stale-frame` are still offline-tested only
(backend selftest 111/111). Live view is unchanged: `desktop.observe` still returns
`UNAVAILABLE` for the missing loopback RFB server on port 5900.