# CU-01 + CU-02 build-readiness packet — prepared in full, executed in none of it

**Owner:** Qoder · **Written:** 2026-10-23, **updated after D-011 and the model-route decision** · **For:** @manager GO/no-GO
**Pins:** OpenClaw `2026.10.6` @ `013240515205573248c27ab6b8eec7303f0da1a8` (my read-only source checkout); `@openclaw/cua-computer` `2026.10.6`. **Runtime authority is now the installed release `fe06181dc5ecc01cf8904abbfc26925925efefbc`**, which ships driver `@trycua/cua-driver` **0.32.0**, not the 0.34.1 my checkout declares — see [`release-pin-reconciliation.md`](release-pin-reconciliation.md). Zero policy plugin `zero-policy` **`0.1.3`** (selftest **111/111**, exit 0 — re-run by me, not taken on note; 0.1.3 adds connection-bound hold recovery, and two focused reconnect/lease-secrecy checks were added at 09:39 IST).
**Supersedes:** my 04:55 handoff entry, whose O7/O8 rows are now closed by D-011 and whose O4 row is closed by the NVIDIA NIM selection. §1 below is the current truth.
**This is the stop line.** Nothing below has been run. Everything in my lane is read-only source/doc analysis, npm registry metadata reads (no download), prepared-but-unexecuted scripts/schemas, and one local file-analysis script (`computer/tools/derive-windows-actions.mjs`, 9/9 self-checks, exit 0).
**Covers:** CU-01 (the harmless Notepad spike) and CU-02 (integration + the D-009 hold live proof). The gated actions are shared, so one packet and one window.

Prep artifacts: [release-pin-reconciliation.md](release-pin-reconciliation.md) (checkout `0132405` vs installed release `fe06181` — verified cross-check that corrected my driver version, digests and footprint), [`cu01-spike-protocol.md`](cu01-spike-protocol.md) (step sequence), [`windows-cua-inventory.md`](windows-cua-inventory.md) (capability/limits), [`../computer/contracts/windows-action-taxonomy.md`](../computer/contracts/windows-action-taxonomy.md) (action names), [`../computer/contracts/takeover-hold-contract.md`](../computer/contracts/takeover-hold-contract.md) (hold contract + verified API surfaces), [`../computer/spike/preflight.ps1`](../computer/spike/preflight.ps1) (written, never executed).

---

## 1. Owner inputs — status as of D-011 and the model-route decision

**Resolved (no owner action left on these):**

| # | Item | Resolution | Verified by me |
|---|---|---|---|
| O4 | Vision-capable model | **NVIDIA NIM** `https://integrate.api.nvidia.com/v1`, single model `z-ai/glm-5.3-flash` for Lead/Vision/Utility; **deployed as the three-segment ref `zero-gw/z-ai/glm-5.3-flash`** (DeepSeek verified the parsing rule from source and encoded it as `config.modelRefParsing`). NVIDIA's catalogue describes it as OpenAI-compatible, image-input capable, tool-calling capable | `[OWNER-SUPPLIED]` `PROJECT_MEMORY.md:19` + senior MODEL ROUTE CHANGE + DeepSeek 05:58. **Still `[needs live proof]`** — Phase 1 has not run (`ZERO_GATEWAY_KEY` unset as of 05:58, so no request was made and nothing was spent). The catalogue claim is not evidence for my lane: image input is load-bearing here, and the narrower check is whether the model reads OUR delivered frame (G-G item 11). Use the `zero-gw/...` ref form in any computer-lane command so a model id never drifts by hand. |
| O7 | Code-mode route around the hold | **D-011:** Operator `tools.exec.mode` stays `deny` for MVP; the plugin's code-mode matcher remains as **defence in depth**, and exec must not be re-enabled until live G-G proves a code-mode computer action is refused during a hold | `[VERIFIED 05:2x]` `backend/config/openclaw.template.json` — researcher `:96-101` and operator `:104-110` region carry `"mode": "deny"`; plugin `index.js:79-80` `holdToolNames:["computer"]` + `codeModeToolNames:["exec"]`, opaque-input classification at `:228-247`. `node backend/plugin/selftest.mjs` → **111 passed / 0 failed, exit 0** on my shell. C6′ is therefore closed **in code**, not by a note. |
| O8 | Scope-widening default | **D-011:** `blockedActions: ["escalate_scope"]` ships in the template; the plugin's own code default stays neutral (audited, not blocked) so it remains a visible, strikable config line | `[VERIFIED]` `backend/config/openclaw.template.json:143`. Their reasoning is better than my ask: a policy default buried in code is less reviewable than a config line. |

**Still open — these five are what actually block CU-01/CU-02, plus the explicit GO:**

| # | Input | Who | Why it is not mine to decide |
|---|---|---|---|
| O1 | **Which machine is the designated Zero environment** — new VM, or a separate Windows test account | @manager | D-003 forbids the everyday profile; VM creation/image pull is itself a gated action. |
| O2 | **Consent + product choice for a third-party VNC/RFB server** on that environment | @manager | Extra third-party software plus a service credential. CU-00 found no managed Windows desktop, so this is the only live-view path. |
| O3 | **Install ordering** — the computer provider ships *inside* OpenClaw, so my install rides inside DeepSeek's window rather than being a second concurrent job | @manager + DeepSeek | One heavy job at a time (MASTER_PLAN §7, D-006). DeepSeek is currently the only lane with an approved next install. |
| O5 | **CU-01 takeover scope** — accept that step S11 is a *measured gap* (upstream throws `take_control is only available for an attached or session desktop`) or redirect to the cloud/attached-desktop path | @manager | The ticket text asks for takeover; D-009 solves it with the plugin, so my recommendation is: CU-01 proves the unmodified baseline and records the gap, then G-G proves the hold. |
| O6 | **Hold live-test order** — before or after CU-01. My recommendation is **after**, so CU-01 measures the unmodified upstream baseline and the CU-02 delta stays attributable | @manager + DeepSeek | Sequencing changes what each run proves. |

**Key hygiene, recorded because my lane touches the same machine:** per `PROJECT_MEMORY.md:19` a provider key pasted into chat is **exposed** — it must not be copied into any file, log, report, prompt, or command line, and the owner should revoke/rotate it and supply the replacement through the host secret store or process environment. I have handled no key and will not.

**Also noted from DeepSeek's `reports/backend/security-boundary.md`, relevant to my GO decision:** enabling `gateway.http.endpoints.chatCompletions` for their Phase 4 acceptance grants **full operator access** over the HTTP surface while D-008 keeps the UI on WS, so it must be switched back off afterwards. My lane does not need that endpoint at all — CU-01/CU-02 go through the WS node path — so if a computer run and their acceptance run ever share a window, the HTTP endpoint's state should be recorded at the start and end of mine.

### Cross-lane status addendum — OpenCode, 2026-10-24 07:35 IST

This addendum corrects the status of O3/O4 above without rewriting Qoder's historical analysis:

- **O4's "Phase 1 has not run" is stale.** Owner-authorized bounded provider-capability probes did
  run at 03:40-04:19 IST against `zero-gw` / `z-ai/glm-5.3-flash`: text passed once at 64 tokens
  (4/32 returned `empty_content`); image failed at 4, was mixed at 32, and passed once at 64
  (27.3 s); streaming/tools passed in every observed run. That is **observed-once/mixed evidence,
  not stable verification**, and no fifth probe was made.
- Those were provider-capability probes, **not the computer-frame read**. G-G item 11 — whether the
  model reads OUR delivered desktop frame — remains unproven and gated. O4's catalogue/provider
  question is partly answered; the computer-frame proof is still required before a GO that depends
  on vision.
- **O3 is resolved.** The OpenClaw backend install is complete (see the Senior runtime addendum),
  so install ordering no longer blocks this lane. The active owner inputs are **O1, O2, O5, O6**,
  not the five listed above. O1 (designated environment), O2 (VNC/RFB consent and product choice),
  O5 (CU-01 takeover scope), and O6 (hold-test order) remain owner decisions; no agent may
  self-designate the environment or write `computer/spike/designated-environment.json`.

## 2. Resource estimates (labelled by how much I actually know)

| Item | Estimate | Basis |
|---|---|---|
| CUA driver delta, win32-x64 | **`28,413,838 B` (~27.1 MiB) total**: native package dir `27,477,129 B` (dll `26,842,960 B` + node runtime `633,160 B`) + JS SDK `936,709 B` | `[MEASURED ON DISK]` from DeepSeek's completed install at `backend/node_modules/.pnpm/@trycua+*` — replaced my earlier registry estimate, which was for driver **0.34.1** while the release ships **0.32.0** |
| `rastermill` / `@openclaw/fs-safe` | `rastermill 0.4.0` (matches my pin); **`fs-safe 0.25.0` installed, not the `0.26.8` my checkout declares** | `[MEASURED]` `.pnpm` listing. Minor drift, recorded so no report cites the wrong running version |
| Full OpenClaw install disk | **actual: `0.470 GB` / 43,430 files** node_modules + `0.469 GB` pnpm store | `[ACTUAL — DeepSeek's BUILD WINDOW A report]`. My earlier 2.5–4 GB estimate was ~10× too high. E: free `~398 GiB`, so disk is not a constraint |
| RAM during spike | **~1–2 GB** + in-process driver RSS (unmeasured, expected small) | `[ESTIMATE]` — no runtime has been started yet |
| VNC server footprint | single-digit to ~25 MB installer; not measured | `[UNMEASURED]` verify at GO time before committing |
| Time | OpenClaw install **already done**; VNC 2–10 min `[UNMEASURED]` · **S1–S11 25–45 min** incl. evidence · CU-02 hold live checks +15–30 min | `[ESTIMATE]` mine, from step counts |
| Evidence output | tens of MB, synthetic content only | `[ESTIMATE]` |

## 3. Gated sequence — exact commands, expected effects, abort conditions

### G-A · Provision the environment `[gated by O1]`
First action inside it — the already-written, read-only snapshot:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File E:\zero\computer\spike\preflight.ps1 -OutFile E:\zero\computer\spike\preflight.json
```
No install, no launch, no input, no writes outside `-OutFile`; account name redacted before writing. Reports OS build, CPU→native-package target, console-vs-RDP session, display count/geometry, **effective scaling %**, **loopback RFB listener presence**, toolchain presence, disk/RAM, verdict.
**Stop immediately if:** `cpuTarget` ∉ {`win32-x64-msvc`, `win32-arm64-msvc`} (`COMPUTER_DRIVER_PLATFORM_UNSUPPORTED` is certain); displays > 1 (primary-only control); `effectivePct ≠ 100` (CU-00 §5 predicts the capture geometry assertion throws — set 100 % and re-run).
### G-B · OpenClaw runtime install — **already done, do not repeat**
BUILD WINDOW A ran it: `openclaw@2026.10.6` (commit `fe06181`) installed into `E:\zero\backend\` via pnpm 12.15.0; node_modules 0.470 GB. For my lane this is a fact to build on, not a step: the driver packages were already on disk, which is what let me verify G-C's inputs offline in [release-pin-reconciliation.md](release-pin-reconciliation.md). If any later computer step needs a new heavy install, confirm no other job is running first (O3).

### G-C · Enable the computer provider + verify pinned artifacts `[gated: config write + runtime]`
**Command form matters — a bare `openclaw` will not resolve.** Verified read-only: `openclaw` is **not on PATH** in this shell; it exists only as the local pnpm shim `E:\zero\backend\node_modules\.bin\openclaw.cmd`, and that shim is what sets `NODE_PATH` into the pnpm store. Calling the `.mjs` directly without it risks a module-resolution failure that would look like a broken install. Run from `E:\zero\backend`:

```powershell
cd E:\zero\backend
.\node_modules\.bin\openclaw.cmd plugins enable cua-computer
.\node_modules\.bin\openclaw.cmd doctor --lint --only cua-computer/driver-artifacts
```

Equivalent form: `corepack.cmd pnpm exec openclaw doctor --lint --only cua-computer/driver-artifacts` (pnpm 12.15.0 is activated, but `pnpm` is not on PATH either).

Expected: explicit enablement (CU-00 §4.3 — on non-macOS the provider registers **only** when `plugins.entries.cua-computer.enabled === true`), then the focused check validates SDK version, OS/CPU package version, regular-file identity, and the pinned SHA-256 of `cua_driver_sdk.dll` + `cua_driver_node_runtime.node`. **Expect the release's values, not my checkout's: driver `0.32.0` with the digests listed in [release-pin-reconciliation.md](release-pin-reconciliation.md) §1.** I have already hashed the installed files against that manifest and both matched, so a `_DIGEST_MISMATCH` at run time would mean the disk changed under us — not that my expectation was wrong.
**Pass:** prints `no findings`.
**Order is mandatory, not cosmetic (DeepSeek, 06:24 — verified against the release bundle).** `dist/extensions/cua-computer/index.js` early-returns in `register()` on non-macOS unless `plugins.entries["cua-computer"].enabled === true`, and that return happens **before** the doctor check and the provider are registered — `CUA_DRIVER_ARTIFACT_CHECK_ID` is real in the release (`dist/extensions/cua-computer/api-*.mjs:237`) but simply never registered if the enable has not happened. So running doctor **first** yields "check not found", which reads like a missing artifact and is actually a missing enablement. Enable, then doctor.
**Abort:** `COMPUTER_DRIVER_PACKAGE_MISSING` / `_VERSION_MISMATCH` / `_DIGEST_MISMATCH` → reinstall OpenClaw; **never** hand-place or replace the DLL; `COMPUTER_DRIVER_PLATFORM_UNSUPPORTED` → wrong arch. Never fetch a standalone `cua-driver` exe or add one to `PATH` — that is the retired 0.10 daemon/MCP route.
**Abort (silent-failure class, the one that burns a whole window):** if the doctor check is not found at all, treat it as **enablement did not take**, not as a driver problem, and re-read `plugins.entries.cua-computer.enabled`. Being present in `plugins.load.paths` or `plugins.allow` is **not** sufficient — the value must be exactly `true`.
**Starting state note:** DeepSeek's Zero template deliberately does **not** enable `cua-computer` yet, so that enabling it here is an expected, owned change at G-C — not evidence that something was misconfigured. It changes what the Gateway advertises at startup, which is why it waits for this gate.

### G-D · Loopback RFB server for live view `[gated by O2: third-party software + credential]`
Candidates needing consent: **TigerVNC**, **TightVNC Standard**, **UltraVNC** — must bind `127.0.0.1` and support **VNC authentication**. Avoid Enterprise-tier RealVNC paths unless licensing is reviewed. RDP and Windows Remote Assistance are **not** an RFB server OpenClaw can relay.
Node config only if a non-default port or password file is needed:
```json5
{ desktop: { host: { enabled: true /* port: 5900, passwordFile: "<stays on the node>" */ } } }
```
**Pass:** `preflight.ps1` shows a 127.0.0.1:590x listener **and** the Control UI Desktop panel lists the node. `desktop.host.enabled` defaults on; managed desktop mode is Linux-only, so there is no Windows fallback.

### G-E · Start the node + pair it `[gated: runtime launch + live Gateway]`
Same PATH caveat as G-C — use the local shim from `E:\zero\backend`:
```powershell
cd E:\zero\backend
.\node_modules\.bin\openclaw.cmd node run          # MUST start inside the interactive desktop session
.\node_modules\.bin\openclaw.cmd nodes pending     # read the declared surface before approving
.\node_modules\.bin\openclaw.cmd nodes approve <requestId>
.\node_modules\.bin\openclaw.cmd nodes status
```
Expected: node advertises `computer.act`, `screen.snapshot`, `desktop.stream`. **Only `computer.act` is a platform default**; the other two come through the approved pairing surface — approve all three deliberately, not reflexively.
**Pass:** exactly one connected computer-capable node whose `computerUse` descriptor reports `contractVersion: 2`, `provider.id: "cua-computer"`, `features: {recording:true, agentCursor:false, multiDisplay:false}`, and the **36-name** Windows action list.
**Abort:** `COMPUTER_DRIVER_UNAVAILABLE` (in practice "not in an interactive desktop session"); descriptor missing → enablement from G-C did not take.
**Pre-flight assertion before S1, worth its own line (DeepSeek, 06:24):** the same registration gate that hides the doctor check also governs this step. If `plugins.entries["cua-computer"].enabled` is not exactly `true`, the provider is **never registered on Windows** and `node run` advertises **no computer capability at all** — silently, with no error. So before spending the window on S1–S11, assert **both**: the plugin reports enabled, **and** the connected node advertises `computer.act`. Absent capability with a clean log is this condition, not a driver fault.

### G-F · CU-01 live desktop actions `[gated: real desktop action]`
S1→S11 + the negative checks per [`cu01-spike-protocol.md`](cu01-spike-protocol.md). Evidence into `reports/computer/spikes/<runid>/`. Pass/fail per step, with the mandatory host-side `file.fetch` readback at S6 (a screenshot is never the pass condition).

### G-G · CU-02 hold live proof `[gated; run only after O6]`
Checks that only a running Gateway can answer, in priority order:
1. **Does the trusted policy fire for the core `computer` tool at all?** Assumption A3 in the hold contract; everything else is moot if it does not. Test: take a hold, issue one `left_click`, expect refusal `computer-hold:human-control`; then a `screenshot`, expect success.
2. **Policy registration accepted, proven from the host side.** The manifest now declares `zero-policy.computer-hold` and the plugin self-checks its own manifest at activation, logging either `manifest declares trusted policy "..." - registration should be accepted` or a loud error. In the live Gateway, confirm the trusted-policy diagnostics actually list it — that is the only proof the hold exists, and it is what §6 C1 was about.
3. **Effective method scope + discovery:** confirm `zero.computer.control` resolves to `operator.write` (not the `operator.admin` default) and appears in the client's advertised method list.
4. **Post-handover staleness:** release a hold, then attempt input with a pre-handover `displayFrameId`; expect refusal until a fresh `screenshot`.
5. **Fail-closed behaviour:** temporarily throw inside `evaluate`; confirm the refusal reason is `…policy evaluation failed` and not a silent allow.
6. **Emergency-stop layering:** `gateway.nodes.commands.deny: ["computer.act"]` mid-run → expect refusal without a Gateway restart, and confirm `screenshot` still works (it rides `screen.snapshot`).
7. **In-flight cancellation:** start a slow action (a long `type`), take a hold → measure that the already-dispatched action is *not* stopped, and that run interrupt does stop it. This is the honest limit of a tool-layer hold.
8. **Code-mode route, under D-011 (two independent controls).** Operator `tools.exec.mode` is `deny` in the shipped template, so a code-mode computer action should not be reachable for the Operator at all; the plugin's opaque-input matcher (`index.js:228-247`) is defence in depth, not the primary control. Record **both**: (a) that exec denial really removes the route for the Operator, and (b) — only if @manager later re-enables exec in the test environment — that a `{code}` computer action is refused while held with `computer-hold:human-control` rather than allowed-and-uncounted. My earlier "expected today: not refused" is obsolete: it described the pre-0.1.2 plugin, and C6′ is now closed in code (retained in 0.1.3; 111/111 selftest).
9. **Refusal-reason fidelity — DeepSeek's capture (a), and OpenCode's dependency.** Bring back the **verbatim refusal string** a held direct action produces as the model sees it, not what the plugin returns internally. If the host wraps or re-serialises it, OpenCode's panel cannot render "the agent was refused because you took control" and DeepSeek's audit rows key on the wrong string. Record the raw tool result text plus the structured error field separately in `result.json`.
10. **Code-mode refusal visibility — DeepSeek's capture (b).** If/when item 8(b) is exercised, capture whether a code-mode refusal surfaces to the model as our reason string or as a generic `…policy evaluation failed`. That decides whether the Operator can explain the hold to the user at all.
11. **Vision path end-to-end (new, from the model route).** With `z-ai/glm-5.3-flash` selected for Lead/Vision/Utility, confirm the *Gateway-side* image path actually carries a desktop screenshot to the model and that the model returns coordinates in the delivered image space. The catalogue's image-input claim is not evidence for this lane: a vision model that cannot see our resized JPEG frame (default `jpeg`, `maxWidth 1600`) produces confidently wrong clicks. This is the first thing CU-01 S1-S2 will reveal if it is wrong, so capture the exact frame dimensions and the model's reported screen size in `result.json`.
12. **Upstream viewer-control arbitration, live** (new, from release-facts §1c). Request `desktop.observe` with `source.kind: "node"` and `control: true`, then a second viewer with `control: true`. Expected from the release code: the first is preempted with close code 4000 and reason `control-taken[:<operator>]`, and control state is notified. Record (a) whether Windows' RFB server actually permits it, (b) whether the notification reaches the browser or is Gateway-internal, and (c) the **effective scope** — the policy table lists `desktop.observe` as `operator.admin`, and I have not proven that applies to a `node` source. If it does, the panel needs a different credential than the hold method does.
13. **The boundary claim that decides whether D-009 is necessary.** With a human holding *viewer* control, issue one agent `left_click`. Expected from the code: it **still lands**, because `computer.act` never passes through the viewer registry. That single observation is the cleanest possible evidence that the plugin hold is necessary rather than a duplicate of upstream. Contrast it with item 9's plugin refusal string.
14. **D-011 side effect on my own verification step.** Operator `exec` denial does **not** weaken CU-01's host-side proof: S6 uses the node file commands `file.fetch` / `file.stat`, which are separate pairing-approved node commands, not `system.run`. Recorded here so a later reader does not "fix" S6 by re-enabling exec.
15. **Connection death without `pagehide`.** Take the hold from the connection under test — Control UI for the UI claim, the one-shot CLI process for the Gateway-layer claim — after confirming `resumeSnapshotRequired:false` (capture a fresh frame first if it is true), then kill the owning connection without running its `pagehide` handler (renderer/tab kill, network drop, or raw WS close), and read `status` from a **new** connection: expect `held:false`, `owned:false`, `resumeSnapshotRequired:true`, `stats.releasedByDisconnect` incremented by exactly one, and a `recent[]` row `{kind:"lease", action:"release", reason:"connection-closed"}`. Then issue an agent input action before any fresh capture: expect `computer-hold:stale-frame` and no desktop effect; a `screenshot` must clear the gate. A clicked Release is **not** this check — if `pagehide` ran, `k7` cannot pass. Evidence: `holdRecovery` block and `verdict.k7` in `result.schema.json`; sequence H1–H6 in [`cu01-spike-protocol.md`](cu01-spike-protocol.md) §3b. The runner [`computer/spike/k7-run.mjs`](../../computer/spike/k7-run.mjs) automates the CLI half (H1–H3) and writes a `not-attempted` pending block; `--live` refuses without the owner-written `computer/spike/designated-environment.json` (including `holdRecoveryApproved:true`), and H4/H5 are Operator evidence merged with `--merge`. Gateway-layer half was already proven live 2026-10-23 08:34 IST; the UI path and the agent-side refusal are what this item adds. A CLI-path pass must not be reported as browser-UI crash recovery.

## 4. Rollback (cheap; state it before the first gated step)

- `openclaw plugins disable cua-computer` → provider deregisters; the node keeps its other commands.
- Stop ladder during a run: interrupt the agent run → `gateway.nodes.commands.deny:["computer.act"]` (hot-applies under default hybrid reload; also removes structured observation, leaves `screenshot`) → stop `openclaw node run`.
- Driver rollback = install the previous known-good OpenClaw package, re-run the focused doctor check, then restart the node. There is no independent Windows driver updater or rollback directory.
- Writes are limited to `E:\zero\computer\`, `E:\zero\reports\computer\`, and the designated machine's own OpenClaw/VNC service state.

## 5. Residual risks I will not pretend away

1. **Session model** — whether the node survives lock/disconnect/RDP teardown is unproven; the likeliest cause of a "green setup, first action fails" outcome (G-E).
2. **DPI** — non-macOS capture throws on geometry mismatch instead of compensating; a 125 %-scaled display may simply be unusable for this provider.
3. **Foreground collision** — the agent drives the real cursor. Until the D-009 hold is proven (G-G), a human and the agent on that box interfere. Keep it dedicated.
4. **No upstream Windows rig exists** — my harness is new code, and a bug in it can masquerade as a driver failure. **Now materially reduced, not eliminated:** the rig's pure logic is implemented and self-tested offline — `node computer/spike/rig.test.mjs` → **152 passed / 0 failed, exit 0** (`computer/spike/rig.mjs` + `k7-run.mjs` + `rig.test.mjs`). It covers gate aborts, the enablement gate below, doctor-output parsing, evidence validation against `result.schema.json`, verdict computation (including the no-pagehide `k7` path), the designation gate and pending/merge flow for the designated-environment runner, and a pre-write secret/PII screen. That testing found **two real defects that would have cost the window**: the schema rejected the rig's own explicit-null step records (so G-F would have failed on its first write, looking like a provider problem), and one secret-detection regex was an invalid escape under the `u` flag so the module would not even parse. **Still unproven, and unprovable offline:** everything that crosses the boundary to a real machine — the PowerShell preflight itself, the WS calls, and the provider's behaviour. Rig logic verified ≠ rig integration verified. The runner's `--plan` output is now the offline readiness check; it currently reports `BLOCKED` on the absent designation marker, which is correct.
5. **`get_window_state` background delivery on Windows** — unknown (taxonomy §6.2). If it always refuses, UIA-style targeting gains shrink and pixel-only driving becomes the norm, which strengthens the eventual custom-provider case.
6. **Compliance, not function** — win32 native package is `MIT AND MPL-2.0` and upstream `THIRD_PARTY_NOTICES.md` omits CUA. Harmless locally; needs a NOTICE entry before any distribution (DeepSeek logged the same).
7. **Hold is a silent no-op if the policy is not accepted by the host** — the manifest declaration and the plugin self-check are in place, but neither has met a real Gateway. G-G item 2 exists specifically so a manifest problem is never mistaken for a driver problem.
8. **Two source trees now exist and they disagree — verified, not theoretical.** My read-only checkout is `0132405`; the installed runtime is `fe06181`. I cross-checked my load-bearing claims against the installed artifact: the 40-name action contract is **identical** and the release’s own executed filter reproduces my **36-name win32 set exactly**, the `take_control` refusal string, the 3600 s/300 s ceilings and the `MIT AND MPL-2.0` licence all **hold**, but the **driver version (0.34.1 → 0.32.0), the pinned digests, `fs-safe` (0.26.8 → 0.25.0) and my footprint numbers did not**. Full table: [release-pin-reconciliation.md](release-pin-reconciliation.md). Residual risk: driver *behaviour* differences between 0.32.0 and 0.34.1 live inside a closed `.dll` and cannot be diffed from source — so A5 (background window delivery) and the DPI equality assertion stay firmly `[needs live proof]` and could still surprise at G-F.
9. **`openclaw` is not on PATH** (verified read-only). Only the pnpm shim under `backend\node_modules\.bin\` works, and it is what sets `NODE_PATH` into the store. A literal transcription of my earlier commands would have failed on the first line of G-C and looked like an install problem; the packet now carries the correct invocation.


## 6. Plugin review findings for DeepSeek — closed status

From the [hold contract](../computer/contracts/takeover-hold-contract.md) against `backend/plugin/index.js` **v0.1.3**, verified by reading the shipped files and by running their selftest on my own shell (`node backend/plugin/selftest.mjs` → **111 passed / 0 failed, exit 0**), not from any developer's note.

| # | Finding | Final status | Verification |
|---|---|---|---|
| **C1** | Missing `contracts.trustedToolPolicies` → hold rejected before registration, silently | **FIXED, and improved** | `openclaw.plugin.json` declares `["zero-policy.computer-hold"]`; exactly one policy is registered and there is no `zero-policy.budget` id anywhere (DeepSeek's earlier note describing a second id did not match the file; the single-id read is correct). My "no activation log" objection is **withdrawn and superseded**: they replaced it with a self-check that reads the plugin's own manifest and logs either a declared-id confirmation or a loud error — strictly better than the log I asked for, and it cannot claim success on a silent rejection. Preflight `plugin.trustedPolicyContract` plus a selftest assertion guard the pairing. Live G-G item 2 still confirms it from the host side. |
| **C2** | `leaseId` vs the accepted `controlLeaseId` | **FIXED** | `controlLeaseId` is the only spelling in the file (`:163/:311/:341/:346`, matched `:355`); the old name now tests as `lease-invalid`. OpenCode implements the canonical name with **no transition shim** — my proposed dual read was retired as soon as I verified the rename had already landed. |
| **C3** | `status` verb undocumented | **CLOSED cross-lane** | Implemented in the plugin, adopted into `bridge-spike.md` §11 item 7, and the panel already calls it on reconnect (`app/src/client/ComputerPanel.tsx:97`) — verified by me, not by note. |
| **C4** | Observation allowlist narrower than upstream's set | **FIXED** | `DEFAULT_OBSERVE_ACTIONS` = the 10 names I recommended (`screenshot, wait, list_apps, list_windows, get_accessibility_tree, get_cursor_position, get_window_state, zoom, get_browser_state, get_recording_state`), with the source citation in a comment. |
| **C5** | Staleness gated only coordinate-looking names; unknown action fell open | **FIXED, better than asked** | Staleness gates every non-observation action; unknown/missing action fails closed (`zero-policy:unknown-action`); freshness clears on `screenshot`/`wait`, and on `get_window_state` **only with `includeScreenshot: true`** — a refinement of my own ruling, and correct: a window observation without an image proves nothing about the desktop underneath. |
| **C6** | `readAction()` multi-field fallbacks | **WITHDRAWN BY ME** | The policy sees the model-facing tool envelope, not the `computer.act` node schema; the fallbacks are load-bearing for code-mode visibility. My citation described the wrong envelope. |
| **C6′** | A `{code}` input resolved to an empty action → allowed **and uncounted** | **CLOSED IN CODE (0.1.2, retained in 0.1.3)** | `exec` joined the matcher (`codeModeToolNames`, `index.js:79-80`) and code-mode input is classified **opaque** (`:228-247`): refused during a hold with `computer-hold:human-control`, and when not held it is allowed but **counted** against the budget and audited with `kind: "code_mode_exec"`. So "allowed and uncounted" is gone on both branches. D-011 then removed the route entirely for the MVP by denying Operator `exec`; the matcher is now defence in depth. Covered by G-G item 8. |
| **C7** | Hold is global, not per computer target | **ACCEPTED as MVP limitation** | Correct for one designated environment, and as DeepSeek notes it errs fail-safe. A target is already recorded in every audit row; keying the hold properly is a pre-multi-machine requirement, not a pre-CU-01 one. |
| **C8** | Confirmed-good choices | **UNCHANGED** | Explicit `scope:"operator.write"` against the `operator.admin` registrar default; refuse-not-queue; `requireApproval` unused; server-minted lease; §11 reason codes. |

**F1, retained as a design constraint:** `code-mode:gateway` executes tool calls *inside* the before-tool-call policy layer, so a Zero `computer.*` wrapper is governed by the Gateway tool policy rather than `registerTrustedToolPolicy`. D-011's exec denial plus the opaque-input matcher now cover both sides of that.
**F2:** the loopback `dangerouslyDisableToolValidation` bypass is DeepSeek's lane; agreed, a computer tool must never be reachable through it.
**Not mine, but worth @manager's eye:** DeepSeek's new `reports/backend/security-boundary.md` flags that `gateway.http.endpoints.chatCompletions` grants full operator access while D-008 keeps the UI on WS, so it must be turned back off after Phase 4. My lane never needs it.

## 7. One-line ask

**Historical gate state.** The owner has since authorized the build/runtime work without another GO. Backend and app installs/builds are complete. O3 sequencing is resolved; O5 is bounded by D-009's global human takeover hold; O6 should follow CU-01 observe/input/verify/takeover, then CU-02 policy/live-refusal checks. The only hard blocker for real desktop input is **O1: identify/provision the designated isolated Zero Windows environment**. The owner has already stated the product needs desktop visibility/control; Qoder may pick a loopback-only authenticated RFB implementation inside that isolated target. Do not use the everyday Windows profile. Continue all installed-release verification and offline prep now.

## Senior runtime addendum — 2026-10-23

The installed OpenClaw release and Gateway policy are active; plugin selftest
94/94 (later re-run after the 0.1.3 connection-bound fix: **109/109**; **111/111** after the
09:39 IST reconnect/lease-secrecy checks) and live Zero
chat/model execution pass. The backend exposes
`zero.computer.control {action: take|release|status}` with `controlLeaseId`.
Senior live check confirmed status → take → release and verified the global
hold returned to `held:false`; no computer action was issued.
No computer provider was activated against a real desktop, no screenshot was
read, and no input was sent. The desktop relay remains disabled. Qoder should
continue the release-bundle action-filter audit and reconcile UI fields with
the other lanes; actual CU-01/CU-02 desktop steps begin only on the designated
isolated target.

## Operator workspace guidance — 2026-10-23 09:45 IST

Gemini's GEM-04 audit found that `backend/.openclaw/agents/operator/` had **no `AGENTS.md`** (only
the agent SQLite store), so an Operator run started with no workspace guidance. I added a minimal,
Zero-owned `backend/.openclaw/agents/operator/AGENTS.md`:

- designated-environment-only scope; never the owner's everyday desktop;
- observe before input, act in small steps, verify with a fresh capture after acting;
- stop immediately on `computer-hold:human-control`; after release, take a fresh capture before
  input because `computer-hold:stale-frame` is expected;
- host `exec` is denied and `escalate_scope` is blocked — no code-mode workaround;
- 400 actions / 200 input actions per run, compact step log, no secrets, reversible actions first;
- no claim of success without a fresh observation.

This is guidance, not enforcement; the config and the zero-policy plugin remain the controls. New
Operator sessions read it at startup; the existing `agent:operator:zero-thread-…` session may keep
its cached startup context until it is recreated or the Gateway is restarted. I did not restart the
Gateway or start a new Operator run. Senior review of the wording is welcome. No app/ or upstream
edit; no desktop action.


