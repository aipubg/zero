# CU-02 - Computer integration: pre-build report (offline preparation only; no live integration)

**Owner:** Qoder · **Written:** 2026-10-23 · **Pins:** OpenClaw `2026.10.6` @ `013240515205573248c27ab6b8eec7303f0da1a8`
**Status:** **PRE-BUILD ONLY.** D-011 has since settled the two owner questions I raised (O7 code-mode, O8 `escalate_scope`), and O4 is settled by the NVIDIA NIM model selection — see [`build-readiness.md`](build-readiness.md) §1 for what is still open. This is design + configuration preparation + contract reconciliation. **No driver installed, no VM created, nothing compiled, no runtime launched, no live Gateway called, no desktop action performed.** The gated steps and their order are in [`build-readiness.md`](build-readiness.md). Per MASTER_PLAN §6 and the corrected D-006, integration *proof* is impossible before the owner's GO, so this report deliberately stops there.

Do not read this file as "computer use works". It says: here is exactly what will be turned on, by whom, with what evidence, and what could still fall apart.

---

## 1. Integration shape decided: reuse upstream, add no daemon

CU-02's brief says "integrate the supported OpenClaw computer provider first; build a separate Windows UIA/vision service only if CU-01 demonstrates a specific gap." CU-00's source reading says the supported provider is complete enough that **a separate Zero desktop worker is not needed for the MVP**:

- `openclaw node run` on the designated machine **is** the worker — it hosts the provider, and the CUA SDK runs **in-process** there ([inventory §3](windows-cua-inventory.md); `extensions/cua-computer/src/driver-client.ts:88-113`).
- Observation, input, window/element/UIA targeting, frame authority, cancellation, teardown, and the live-view relay all already have upstream implementations.
- Adding a second capture/input path would duplicate the driver and break the single frame-authority model (a `displayFrameId` issued by one provider cannot authorise another).

**So `E:\zero\computer\` contains no daemon.** Its real contents are the analysis tool, the two contracts, the spike preflight, and this lane's reports (`computer/README.md` lists them). A release-pin cross-check now sits at [release-pin-reconciliation.md](release-pin-reconciliation.md): the installed runtime is `fe06181`, not the `0132405` my earlier reports were derived from — same 40-name action contract, but driver **0.32.0** (not 0.34.1) with different pinned digests, and the installed native files hash-match the release manifest, which predicts a clean G-C before anything runs. If CU-01/CU-02 evidence a genuine driver-level gap (multi-display, DPI ≠ 100 %, held-input actions, physical-console arbitration), the shape is already defined for that: a Zero-owned **provider plugin** registered via `registerComputerUseProvider` (`docs/plugins/sdk-entrypoints/native-providers.md:43-58`) placed in `computer/provider/` — a replacement for `cua-computer` on that machine, not a parallel service, because exactly one provider fulfils `computer.act`/`screen.snapshot` per node and one policy owns the command ([contract §1](../computer/contracts/takeover-hold-contract.md)).

**@manager, this is the CU-02 scope question** (readiness O-#6/D-010): if you expect a worker component in my lane now, say so; otherwise CU-02's deliverable is "integrate + prove", and `computer/provider/` stays empty.

## 2. Division of work, as actually implemented

| Piece | Owner | Artifact | State |
|---|---|---|---|
| Gateway config, agent roster, tool policy, `computer` placement | DeepSeek | `backend/config/openclaw.template.json` | prepared, unrun |
| Human-hold + budgets trusted tool policy + `zero.computer.control` method | DeepSeek (D-010) | `backend/plugin/index.js` @ **v0.1.3** | written, self-tested offline (**111/111, exit 0 — re-run by me, not taken on note**); manifest declares `contracts.trustedToolPolicies: ["zero-policy.computer-hold"]`. Review closed: **C1–C5, C7, C8 done; C6 withdrawn by me** (their code-mode rebuttal was right, my citation described the node schema, not the model-facing tool envelope); **C6′ closed in code** (opaque code-mode input: refused while held, counted and audited when not) **and made unreachable by D-011** (Operator `exec: deny` + `blockedActions:["escalate_scope"]`). Nothing in my review remains open against the plugin. |
| Hold contract, action taxonomy, API verification, spike harness, provider gap watch | Qoder | `computer/contracts/`, `computer/spike/`, `computer/tools/` | this round |
| Computer panel, take/release UI, frame freshness, activity rendering | OpenCode | `app/` + `reports/ui/bridge-spike.md` §11 | design accepted; **§11 now carries the canon names (items 7 and 8) and the panel implements `status`** — my additions are adopted, not pending |
| Upstream runtime | read-only | `upstream/openclaw` | untouched by all three |

## 3. What "integrate" will actually do, step by step (gated)

1. `openclaw plugins enable cua-computer` on the designated machine — required explicitly, because on non-macOS the provider registers only when `plugins.entries.cua-computer.enabled === true` (`extensions/cua-computer/index.ts:30-38`).
2. `openclaw doctor --lint --only cua-computer/driver-artifacts` → must print `no findings`; this is the pinned SHA-256 gate on `cua_driver_sdk.dll` + `cua_driver_node_runtime.node`.
3. Start `openclaw node run` inside the interactive desktop session; approve the pairing surface (`computer.act` + `screen.snapshot` + `desktop.stream`).
4. Verify the advertised descriptor equals the derived expectation: `contractVersion 2`, `provider.id cua-computer`, `multiDisplay false`, **36 actions** ([taxonomy §3](../computer/contracts/windows-action-taxonomy.md)).
5. Expose `computer` to the Operator agent only, via profile + `tools.alsoAllow`, never `tools.gatewayPolicy` (restart-only, so unusable as a stop button) — DeepSeek's placement, accepted.
6. Load `zero-policy` v0.1.3 (C1 manifest fix and C2 `controlLeaseId` rename shipped) and run the G-G live checks in [readiness §3](build-readiness.md).
7. Run CU-01's S1→S11 against the integrated setup as the acceptance pass.

## 4. Contract additions I contributed this round (and where they came from)

- **The exact action taxonomy, machine-derived**: 40 v2 names → **36 advertised on Windows**; excluded `hold_key`, `left_mouse_down`, `left_mouse_up`, `wait`; `take_control` is tool-layer and always throws for our targets; 6 recording/browser-file names are hidden without an execution owner. Plus the routing table and the runtime-refusal code list DeepSeek asked for. Generated by `computer/tools/derive-windows-actions.mjs` with 9 self-checks so a future upstream drift fails loudly instead of quietly stale-ing a ticket.
- **A correction nobody had**: `computer.act` is *not* the input command — it carries most **observation** actions too; only `screenshot`/`wait` ride `screen.snapshot` (`src/agents/tools/computer-tool-request.ts:20-23`). So the global `commands.deny` stop degrades observation rather than blinding the agent, and an emergency-stop UI must say so.
- **The `operator.admin` default trap** on plugin gateway methods (`src/gateway/methods/descriptor.ts:70-101`) and the proof that params/results are **not** schema-validated (`shared-types.ts:584-588`, `response-types.ts:4-9`) — the plugin must validate its own input; the UI must not assume a server-side schema.
- **Fail-closed policy semantics** (`src/plugins/trusted-tool-policy.ts:247,264,268,291-293`) and the default reason string `blocked by <id>` (`:138-140`) — so hold refusals must carry an explicit stable reason, and a crashing hold looks like "computer never works".
- **`resumeSnapshotRequired` enforcement rule** the contract lacked: the tool layer cannot revoke an issued `displayFrameId`, so gate *all* non-observation input until a fresh observation is allowed after release (implemented partially in DeepSeek's plugin; gap C5).
- **`contracts.trustedToolPolicies` is mandatory for installed plugins** — the current manifest omitted it, which would have made the hold a silent no-op (C1 — since fixed by DeepSeek, with a startup log assertion).
- **FINAL field names for the take/release contract — OpenCode's ask.** Ruled in favour of the accepted `bridge-spike.md` §11, because the contract came first and §11 is unambiguous:
  - method `zero.computer.control`; request verb field **`action`**, values **`take | release | status`** — **adopted**: §11 item 7 now carries `status` and the panel calls it (`app/src/client/ComputerPanel.tsx:97`). The UI’s "control: unknown" on reconnect is now a read rather than a guess.
  - lease field **`controlLeaseId`** in *both* request and result - the implementation's old `leaseId` was the wrong name; C2 shipped in `zero-policy` v0.1.3 and the canonical name is used on both sides.
  - result snapshot fields `held`, `owned`, `controlLeaseId`, `resumeSnapshotRequired` (+ `since`, `reason`, `stats` as extras the UI may ignore).
  - refusal codes exactly as implemented: `computer-hold:already-held`, `computer-hold:lease-invalid`, `computer-hold:human-control`, `computer-hold:stale-frame`, `zero-policy:bad-request`, `zero-policy:action-blocked`, `zero-policy:budget`.
  - the tool-action field inside a `computer` call is **`action` only** — no `type`/`command`/`operation`/`name` fallbacks (upstream is a closed object with a required enum).
  - **transition rule: not needed.** `backend/plugin/index.js` v0.1.3 uses `controlLeaseId` everywhere (`:355/:432/:455`) and the old name tests as `lease-invalid`. OpenCode implements the canonical name with no fallback shim - my proposed dual read was retired the moment I verified the rename had landed.
  - Machine-consumable copy: `computer/spike/result.schema.json` (`holder.controlLeaseId`) and [contract §3](../computer/contracts/takeover-hold-contract.md).

## 5. Acceptance criteria I will hold CU-02 to

| # | Check | Pass condition | Current state |
|---|---|---|---|
| K1 | provider registered on Windows | descriptor matches the 36-name expectation | `[needs GO]` |
| K2 | end-to-end harmless task | observe→act→**host-side readback** verify passes at S6 (`file.fetch` equals the sentinel) | `[needs GO]` |
| K3 | live view | a human watches the run through the Desktop panel relay | `[needs GO]` |
| K4 | global stop | interrupt and/or `commands.deny` stop further input without a Gateway restart | `[needs GO]` |
| K5 | takeover | **not expected to pass upstream** — expected result is `take_control is only available for an attached or session desktop` (O5), then K5′ = the D-009 hold refuses input while held and enforces freshness after release | `[needs GO]` |
| K6 | recovery | lock/unlock and driver-restart paths revoke refs without replaying an interrupted action | `[needs GO]` |
| K7 | no upstream modified, no secrets in evidence, synthetic fixtures only | file diffs + evidence scan | holds so far (this round included) |

## 6. Recorded assumptions (not blocking, not hidden)

A1–A6 are in [contract §8](../computer/contracts/takeover-hold-contract.md); the driver-behaviour ones are in [readiness §5](build-readiness.md). The two that would change the design rather than just the config: **A3** (trusted policy fires for the core `computer` tool) and **A5** (`get_window_state` background delivery works on Windows). Both are answerable in one G-G/G-F session, and both are the honest gate on whether CU-03 stays "small plugin + config" or becomes "own the provider".

## 7. Next

**Nothing in my lane is unblocked-but-undone, and nothing is blocked on another developer.** My plugin review is fully closed on `zero-policy` v0.1.3 (selftest 111/111, exit 0 — re-run and verified by me, not taken on note); the field-name question is settled and already implemented on both sides (`controlLeaseId`, `status`); O4/O7/O8 are recorded as resolved by the model route and D-011.

Waiting only on **@manager**: explicit GO plus **O1** designated environment, **O2** loopback RFB server consent and product, **O3** install ordering behind DeepSeek's single job, **O5** CU-01 takeover scope, **O6** hold-test order. The spike protocol, preflight rig, evidence schema, taxonomy, contracts and readiness packet are complete to the gate; every remaining step in [`build-readiness.md`](build-readiness.md) §3 crosses it, so I stay stopped.

Standing caveat, repeated so it is never lost between handoffs: this is **pre-build readiness only**. No Windows desktop action has been performed or proven, CU-01's outcome is genuinely unknown, and the vision path for the selected model is owner-supplied rather than probed.

## 8. Owner-authorized normal-profile Notepad proof — 2026-10-25 (manual UIA, not CU-01 harness)

The owner explicitly authorized controlled testing on the **current normal Windows profile** for this
run, overriding the isolated-environment-only restriction. The owner-created designation marker
(`computer/spike/designated-environment.json`) is still **absent** and was not forged, so the
designated-environment runner (`k7-run.mjs`) and the CUA/computer-tool path were **not** used.

**Method:** a one-off PowerShell + Windows UI Automation script (not the OpenClaw CUA provider),
acting only on Notepad and a newly created file under `%TEMP%`. No browser, network, project-folder
write, unrelated file, account setting or external action was involved.

Observed result (one run):

| Field | Value |
|---|---|
| Window | `zero-cu01-20261025-020337.txt - Notepad` (title observed before and after) |
| Marker | `ZERO-CU01-20261025-020337-OK` |
| UIA text before → after | `""` → `ZERO-CU01-20261025-020337-OK` |
| Save | `ValuePattern` set + `Ctrl+S`; file read back host-side |
| Bytes / SHA-256 | `28` / `b442ac67d83100d337262560e464fb66733bc0b45d03e192435d6efa1d15da55` |
| Content equals marker | **true** |
| Notepad closed | true; temp test file removed |
| Cleanup | temp file and helper script removed; no Notepad process left |

A first attempt used the `notepad.exe` launcher process handle and observed an empty file because
Windows 11 hands off to the packaged Notepad process; it was closed, the temp file was empty, and
the corrected run located the real window by title. No unrelated application received input.

**Checklist impact (claims limited to what was demonstrated):**
- K2 (host-side readback): **partial evidence** — manual observe/type/save/read-back succeeded; this
  is not the OpenClaw CUA `file.fetch`/`get_window_state` path.
- K1 (provider descriptor), K3 (live human view), K4 (global stop/commands.deny), K5 (takeover),
  K6 (lock/unlock recovery): **not demonstrated** here.
- Hold status was read only: `zero.computer.control {action:"status"}` → `held:false`,
  `owned:false`, `scope:"global"`, `resumeSnapshotRequired:false`, counters zero, `recent:[]`.
  No take/release or global stop was exercised.
- k7 hold recovery: **not run** — the designation marker is absent. Exact remaining step: the owner
  writes `computer/spike/designated-environment.json` with the required fields if the k7 run is
  wanted; an agent must not create it. Normal-profile authorization did not create this marker.
- Browser testing: none was performed, so no isolated test page was needed.

**Limitations:** this is a manual UI-automation proof on the normal profile, not a CU-01/CU-02
acceptance run. It does not prove the OpenClaw CUA driver, the `computer` tool, policy firing,
visible Desktop panel status, user takeover, global stop or connection-death recovery. CU-01 stays
open in the board.

## 9. Read-only prerequisite recheck - 2026-10-26 15:27 IST

No fresh computer action. The take/release/disconnect results recorded above remain **prior live
evidence**, not a fresh run.

- Node `36196f0b...a00f71` is connected and approved, with commands exactly `computer.act`,
  `screen.snapshot`, `desktop.stream`; `computerUse.provider.id = "cua-computer"`.
- Hold status: `held:false`, `owned:false`, `scope:"global"`, `resumeSnapshotRequired:true`,
  `takes:4`, `releases:4`, `releasedByDisconnect:2`; all refusal counters `0`.
- Port 5900 has no listener and no VNC/RFB process. The prior `desktop.observe` -> `UNAVAILABLE`
  result remains the live evidence. No VNC install, credential, UAC, or non-loopback exposure was
  attempted.
- B2 vision gate: the selected session model is `input:"text"`
  (`nvidia/nemotron-3-ultra-550b-a55b` at 15:27 IST; `deepseek-ai/deepseek-v4.1-flash` from
  15:29 IST), so `modelHasVision:false` and the host does not create the `computer` tool. Only
  `nvidia/moonshotai/kimi-k2.6` and `nvidia/minimaxai/minimax-m3` declare `text+image`; both failed
  at the provider previously. `minimaxai/minimax-m3.1-flash` is still absent from the local catalog.
- Post-audit observation 15:34 IST (read-only): the session override changed to
  `deepseek-ai/deepseek-v4.1-flash` and that turn hit the model idle timeout at 15:29:52. B2 is
  unchanged - both the old and new selected models are text-only, so the `computer` tool stays
  hidden. No fresh computer action, hold take, or desktop observe was performed.
- UI-owned hold-leave integration 15:50 IST (source/test only): `src/computer/hold.js` now hands
  back only this view's lease on `pagehide` or a real `/systems` route departure; an in-flight take
  is awaited only to release the lease it returns, and `dispose()` alone never releases. The plugin's
  connection-close release remains the backstop. `src/native-surfaces.js` separates a route departure
  from a host re-render. 10 new tests (30 hold tests, UI **81/81**); local build `16b83c88...`. No
  Gateway reload, no live take/release/route-change/pagehide, so this is **not** live evidence and
  does not change the desktop-view or agent-refusal status.
- CU-01 remains **PARTIAL**; CU-02 unchanged. No self-acceptance.
