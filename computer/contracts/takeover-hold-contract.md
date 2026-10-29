# CU-02/CU-03 — Reconciled human-hold contract (D-009) and verified API surfaces

**Owner:** Qoder · **Written:** 2026-10-23 · **Pins:** OpenClaw `013240515205573248c27ab6b8eec7303f0da1a8`
**Answers three asks:** @manager's "reconcile the tool hold design" + "verify `registerGatewayMethod` request/result types from source"; OpenCode's "confirm the registration API supports typed params/results for `zero.computer.control`"; DeepSeek's reconciliation points (a)–(d) in `AGENT_CHAT.txt` 04:16.
**Status:** design + source verification only. **No plugin written, nothing installed, nothing launched.** Every claim below is `[CODE]` from the pinned commit unless marked `[needs live proof]`.

---

## 1. Direct answer to OpenCode: the API supports the shape, but "typed" is not what it sounds like

`zero.computer.control { action, controlLeaseId?, reason? } → { held, owned?, controlLeaseId?, resumeSnapshotRequired? }` is registerable exactly as specified — **but the host performs no schema validation on either side.** Verified:

| Question | Answer | Evidence |
|---|---|---|
| Signature | `registerGatewayMethod(method, handler, opts?)` with `opts = { scope?, profileAccess?, sessionAccess?, shareKey?, shareInvalidationEvents?, shareMaxAgeMs? }` | `src/plugins/plugin-api.types.ts:271-283` |
| Are **params** validated by the host? | **No.** The handler receives `params: Record<string, unknown>`. The plugin must parse and reject unknown keys itself. | `src/gateway/server-methods/shared-types.ts:584-588` |
| Are **results** typed? | **No.** `RespondFn = (ok: boolean, payload?: unknown, error?: ErrorShape, meta?: Record<string, unknown>) => void`. Payload is arbitrary JSON; there is no `ErrorShape` schema per method. | `src/gateway/server-methods/response-types.ts:4-9` |
| Does the method descriptor carry a schema? | **No.** `GatewayMethodDescriptor` has `name/handler/scope/owner/profileAccess/sessionAccess/...` and **no params or result schema field**. | `src/gateway/methods/descriptor.ts:48-61` |
| Can we choose a name like `zero.computer.control`? | Yes — any non-empty trimmed string; registration **fails with an error** if it collides with a core method or an already-registered plugin method (no silent override). | `src/plugins/registry-registrars-network.ts:175-181` |
| Is it advertised to clients? | Descriptor default is advertised (`advertise` is only honoured when explicitly `false`), and the attached plugin registry's advertised list is published as the method surface. | `src/gateway/methods/registry.ts:69,91-93`; `src/gateway/server-core-runtime.ts:424-429` |
| Scopes available | `operator.admin / .read / .write / .sessions.read / .sessions.write / .approvals / .questions / .pairing / .talk / .talk.secrets`, plus non-operator markers `node` and `dynamic`. | `src/gateway/operator-scopes.ts:1-10`; `src/gateway/methods/descriptor.ts:16-27` |

### ⚠ The trap I want recorded before anyone writes this plugin

`createPluginGatewayMethodDescriptor` ends with **`scope: normalizedScope ?? ADMIN_SCOPE`** and **`profileAccess: params.profileAccess ?? "required"`** (`src/gateway/methods/descriptor.ts:70-101`, reached from the plugin registrar at `src/plugins/registry-registrars-network.ts:196-201`). So:

- **Omitting `opts.scope` gives the method `operator.admin`.** A Zero UI that authenticates with `operator.write` would get a permission failure on *take*, i.e. the takeover button fails exactly when the user needs it, and it would look like an OpenClaw bug.
- **`profileAccess` defaults to `"required"`** — the caller must carry an authenticated profile.

**Contract requirement (mine to demand, backend's to implement):** register with `opts = { scope: "operator.write", profileAccess: "required" }` explicitly, and add a doctor/readiness check that asserts the effective scope, because the default is the wrong one for a human-facing control. Reserved admin namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) are forced to `operator.admin` regardless — `zero.*` is not reserved, so this is achievable (`plugin-api.types.ts:265-269`).

**Assumption recorded, not waited on:** `normalizePluginGatewayMethodScope()` lives in `src/shared/gateway-method-policy.ts`, which is **not in the sparse checkout**, so I could not read the coercion table directly. I rely on the API doc comment for the reserved-prefix list. `[needs live proof]` in the CU-01/BE-01 window: confirm `zero.computer.control` with `scope:"operator.write"` is not coerced, and that it appears in the client's advertised method list.

## 2. Direct answer to DeepSeek: your (a)–(d) are correct; here is the verified detail

**(a) Same mechanism — confirmed.** `registerTrustedToolPolicy` is a declarative, name-matched registration over the identical decision contract (`src/plugins/host-hooks.ts:69-84`). The matcher is `readonly [string, ...string[]]` of tool names (`src/plugins/hook-types.ts:205`) and is applied by `pluginToolMatcherCoversTool(matcher, event.toolName)` (`src/plugins/trusted-tool-policy.ts:266-272`), so `matcher: ["computer"]` is sufficient. `event.params` is the raw tool input (`hook-types.ts:569-575`), which is how we read `params.action`. I agree: use `registerTrustedToolPolicy`; the generic `before_tool_call` hook is only needed for ordering.

**Ordering, verified:** there is **no priority field** for trusted policies — they "run in order" (`trusted-tool-policy.ts:298`, iterating `policies` at `:244`). That order is registration order, i.e. plugin load order we do not control. **So Zero must not depend on running before/after another trusted policy.** If we ever need that, it's the generic hook (your point) — flagged now, not later.

**(b) Refuse, never pause — confirmed, and the failure mode you warned about is real.** `{ allow:false, reason }` normalises to `{ block:true, blockReason }` (`:299-304`); `block:true` is terminal (`:307-312`); `block:false` is a **no-op that does not short-circuit the chain** (`:313-316`); `requireApproval` is merely *collected* (`:333-335`) and is an approval pause, not a refusal. Therefore: **the hold returns `{ allow:false, reason:"computer-hold:human-control" }` and never uses `requireApproval`.** Also set the reason explicitly — a missing one becomes `blocked by <policyId>` (`:138-140`), which would break OpenCode's stable-code matching.

**New, and it changes your §7 risk table:** a trusted policy is **fail-closed**. If `evaluate` throws, or the owner/matcher/policy is unreadable, the runner returns `block:true` with `blocked by <id>: policy evaluation failed` (`:247,264,268,291-293`). Good for safety, bad for debuggability: a crash in the hold code silently looks like "the agent can never use the computer". **Requirement:** the hold's reason strings must stay distinguishable from `policy evaluation failed`, and Zero's diagnostics should surface the trusted-policy list (there is already a helper: `getTrustedToolPolicyDiagnosticEntries`, `:152-166`).
**Also required:** the policy id must be declared in the plugin manifest under `contracts.trustedToolPolicies` or it won't be enabled (`plugin-api.types.ts:408-411`; `src/plugins/gateway-startup-plugin-activation.ts:293`).

**(c) Agreed, and I will not duplicate it.** Raw `node.invoke` coverage stays your `gateway.nodes.commands.deny: ["computer.act"]` global layer. One precise consequence from the taxonomy doc that belongs in your design: **`computer.act` also carries the structured observation actions** (`list_windows`, `get_window_state`, `get_accessibility_tree`, `zoom`, `get_browser_state`, …) — only `screenshot`/`wait` ride `screen.snapshot` (`src/agents/tools/computer-tool-request.ts:20-23`). So the global kill switch removes window/element observation but leaves plain screen capture. That is acceptable and arguably useful; just don't describe it as "blinds the agent".

**(d) Agreed** — `computer` on the operator agent via profile + `tools.alsoAllow`, never `tools.gatewayPolicy` (needs a Gateway restart, so it can't be a stop button).

## 3. FINAL field names (ruled; this is what `computer/spike/result.schema.json` now encodes)

`reports/ui/bridge-spike.md` §11 is the accepted contract and it is unambiguous, so the contract wins over the implementation:

| Position | Canonical name | Notes |
|---|---|---|
| Method | `zero.computer.control` | unchanged |
| Request verb | `action: "take" | "release" | "status"` | **CLOSED — OpenCode adopted `status`** into `bridge-spike.md` §11 item 7, and the panel calls it on (re)connect (`app/src/client/ComputerPanel.tsx:97`, verified by me). The UI’s "control: unknown" is now a read, not a guess. |
| Lease id, in request **and** response | **`controlLeaseId`** | **CLOSED on both sides.** Plugin: `controlLeaseId` is the only spelling in `backend/plugin/index.js`. UI: a case-sensitive search for bare `leaseId` across `app/` returns **0 matches** (verified by me; OpenCode also renamed a surviving local state variable). §11 item 8 states "no dual read". |
| Snapshot fields | `held`, `owned`, `scope: "global"`, `controlLeaseId?` (only when owned), `resumeSnapshotRequired`, `since?`, `reason?`, `stats?`, `recent?` | **Amended 07:50 from the shipped plugin** (`index.js:344-353`). `scope` and `recent` are **load-bearing, not ignorable extras**: `scope` is the only signal that the hold is not per-target (C7) so a panel must not imply per-conversation ownership, and `recent` is what turns "refused" into a displayable audit fact. `controlLeaseId` absent while `!owned` is correct, not a failure. |
| Refusal codes | `computer-hold:already-held`, `computer-hold:lease-invalid`, `computer-hold:human-control`, `computer-hold:stale-frame`, `zero-policy:bad-request`, `zero-policy:action-blocked`, `zero-policy:budget` | Match `backend/plugin/index.js:52-58`. |
| Tool action field | **`action` for direct calls; `exec`/`{code}` is classified opaque, not parsed** | My original ask ("read only `action`, delete the fallbacks") is **withdrawn** — it would have blinded the hold to code-mode calls. The plugin now reads `action` for direct tool calls and treats a `code_mode_exec` input as opaque: refused while held, counted and audited when not. |

**Transition rule — NOT NEEDED, retired on verification.** I had proposed a one-release `controlLeaseId ?? leaseId` dual read so neither owner blocks the other. Reading `backend/plugin/index.js` v0.1.1 directly (`:163`, `:311`, `:341/:346`, matched at `:355`) shows **no `leaseId` spelling remains**, and their selftest asserts the old name yields `lease-invalid` (75/75, exit 0, run by me). So OpenCode implements `controlLeaseId` with no fallback. I keep this note instead of deleting it: a temporary documented dual read is a legitimate way to decouple two owners, and it was simply unnecessary here once the rename had already landed.

## 3ter. D-011 outcome on this contract

Two of the three owner decisions this contract were waiting on have landed, and both went the way of *less* agent power rather than more:

- **O7 → Operator `tools.exec.mode: "deny"`** in the shipped template, with the plugin’s code-mode matcher retained as defence in depth and exec not to be re-enabled until a live G-G proves the hold refuses a code-mode computer action. This removes the path I could not close at the tool layer, and it does **not** narrow desktop control: the Operator drives the machine through `computer`, and `exec` is the shell. Full control inside the designated environment (D-003) is unchanged.
- **O8 → `blockedActions: ["escalate_scope"]`** ships as a **config line**, not a code default, so the owner can strike it deliberately. I asked for a safer default; they delivered a safer *reviewable* default. I accept their form as better than mine.

Net effect on the hold semantics I specified: nothing in §3 or §5 changed. What changed is that one of my recorded residual risks (§6, "a raw `node.invoke` client" aside) no longer has a live route in the MVP.

## 4. What remains genuinely contested, and who decides

*Nothing about names.* The open questions are behavioural and all resolve at G-G: whether a trusted policy fires for the core `computer` tool (A3), whether hold refusal reaches the model as a clean non-retryable reason, and whether `get_window_state` background delivery works on Windows (A5). Those are owner-GO items, not chat items.


## 5. OpenCode's §11 call shape: accepted verbatim, with three additions

I adopt `reports/ui/bridge-spike.md` §11 as written — one plugin-registered gateway method on the same WS, server-side minted opaque lease, take-while-held refuses with `computer-hold:already-held`, release requires the lease id and returns `resumeSnapshotRequired=true`, stale id refuses `computer-hold:lease-invalid`, leases bind to the owning WS connection, no HTTP route in MVP, pixel streaming and `commands.deny` explicitly out of scope. Nothing in your shape needs changing given §1 above except the **scope default**.

Additions that are mine to specify because they decide what the user experiences:

1. **`resumeSnapshotRequired` needs an enforcement rule, not just a flag** (settled, and refined by DeepSeek: freshness clears on `screenshot` and `wait`, and on `get_window_state` **only with `includeScreenshot: true`**, because a window observation without an image proves nothing about the desktop underneath). At the tool layer we cannot revoke a `displayFrameId` the driver already issued (frame authority lives inside the provider and rotates only on generation change — `extensions/cua-computer/src/commands.ts:222-227`, `frame.ts`). So the hold plugin must track, per computer session, `lastObservationAllowedAt` (set when it *allows* an observation action) and `holdEndedAt`, and **deny input actions until an observation has been allowed after `holdEndedAt`**. That is implementable purely from `event.params.action` and closes the "click on a pre-handover frame" hole behaviourally. `[needs live proof]`.
2. **Actual MVP hold scope is global.** The shipped plugin snapshot reports `scope: "global"`; the current implementation is one global hold, not a per-computer or per-session lease. The UI must label it accordingly (for example, “Computer control held — all sessions”) and must not imply that one chat owns it. Per-target scoping is a future design change requiring a new contract and live verification, not a UI assumption.
3. **Two hold states the UI must show distinctly**, because they are different guarantees: `held by human` (input refused with `computer-hold:human-control`) versus `emergency stop` (`commands.deny`, no hold concept, agent gets a command-level refusal). Do not render them with the same pill.

## 5quater. Connection death and stale-hold recovery (accepted 2026-10-23)

The hold is bound to the live Gateway connection that took it, not just to an opaque owner label.
The installed host creates one `AbortController` per WebSocket, exposes
`client.connectionSignal`, and aborts it when the socket closes (`ws-connection-Cq7PPwbb.mjs`:
`socket.once("close") → connectionController.abort()`). `zero-policy` 0.1.3 listens to that signal
for the owning client:

- owner disconnect → release the hold, arm `resumeSnapshotRequired`, increment
  `stats.releasedByDisconnect`, and append a `kind:"lease"` audit row with
  `reason:"connection-closed"`;
- non-owner disconnect → no-op;
- normal release → detach the listener; the explicit fresh-snapshot gate is unchanged;
- `take` requires an active, non-aborted Gateway client connection.

Product rule: a lost connection means the human is no longer holding control. The UI must treat
`held:false` on the first `status` after reconnect as authoritative and take control again if the
user still wants it. It must not cache `owned:true` across a reconnect. This deliberately prevents
a crashed tab or dropped network link from blocking agent input until a process restart, while the
fresh-capture gate prevents action on a pre-handover frame. Verified live: take on connection A,
close A, `status` from a new connection → `held:false`, `resumeSnapshotRequired:true`,
`releasedByDisconnect:1`, audit `connection-closed`; selftest 109/109.

Evidence rule for the designated environment: this is `holdRecovery` + `verdict.k7` in
`computer/spike/result.schema.json`, sequence H1–H6 in `reports/computer/cu01-spike-protocol.md`
§3b. A clicked Release or a `pagehide` that actually ran is the normal hand-back path and cannot
satisfy k7; the no-pagehide death and the subsequent `computer-hold:stale-frame` refusal are both
required. `computer/spike/k7-run.mjs` automates H1–H3 through separate CLI processes; `--live`
refuses without the owner-written `computer/spike/designated-environment.json`, and H4/H5 must be
merged from Operator evidence. A `cli`-path pass proves the host abort path but not the browser
tab/renderer path; only `ownerConnectionPath:"control-ui"` supports the UI claim.

## 6. What this hold still does **not** cover (repeat, so nobody re-discovers it later)

- An **in-flight native action** is not cancelled by a tool-layer refusal → pair with run interruption; upstream passes per-invocation cancellation to the SDK (`docs/nodes/computer-use.md:242,303`). `[needs live proof]` on Windows.
- A **raw `node.invoke` client** bypasses the tool layer entirely → your deny layer, §2(c).
- A human at the **physical console** is invisible to us; there is no local-input sensor on Windows. Product rule: takeover happens through Zero's surface. Accept the race or don't ship unattended control to that box.
- **Plugin reload/restart drops the in-memory lease**, and **owner connection death releases it**
  (5quater). Keep it in memory only (the OpenMausBot reference does the same deliberately — a hold
  surviving restart would brick the computer), and have `activate` report the cleared state loudly.
- It is **not a containment boundary**. The designated Zero environment remains the boundary (D-003/D-009).

## 7. Ownership recommendation for CU-02 (needs @manager, one line)

Per D-010 the **policy/control plugin is backend-owned** (`E:\zero\backend\`) and I own **any separate desktop worker** (`E:\zero\computer\`). My recommendation: **there is no separate desktop worker in the MVP** — `openclaw node run` on the designated machine *is* the worker, and the CUA provider runs in-process there. So my lane stays as (i) this contract + taxonomy, (ii) the CU-01 spike harness and readiness packet, and (iii) `E:\zero\computer\provider\` **only if** CU-01 evidences a driver-level gap (multi-display, DPI, held input). If @manager expects a worker component now, say so and I will scope it; otherwise CU-02's deliverable is "integrate + prove", not "build a daemon".

## 8. Assumptions register (recorded, not blocking)

| # | Assumption | Basis | If wrong |
|---|---|---|---|
| A1 | `zero.*` is not a reserved admin namespace, so `operator.write` is achievable | doc comment `plugin-api.types.ts:265-269`; helper body absent from checkout | scope forced to admin → UI needs admin or pairing-scope upgrade; would surface immediately in the BE-01/CU-01 window |
| A2 | Plugin methods appear in the client's advertised method list | `registry.ts:69,91-93` + `server-core-runtime.ts:424-429` | OpenCode must hardcode the method name instead of discovering it |
| A3 | A trusted policy with `matcher:["computer"]` fires for the **core** `computer` tool | runner is name-based, no core/plugin distinction in `trusted-tool-policy.ts:266-272` | the hold cannot be implemented at the tool layer → fall back to owning a provider plugin (bigger change; escalate to @manager) |
| **A3′** | **NARROWED by DeepSeek's F1 rebuttal:** even if A3 holds it does **not** cover the code-mode path — `code-mode:gateway` executes tool calls inside the before-tool-call layer, so a `{code}` envelope reaches the computer with no name-matchable action | `docs/plugins/code-mode/guest-api.md:27-29`, `code-mode/exec-hosts.md:29`; observed as `readAction` → `""` → `undefined` → allowed | Was a real fail-open adjacent path. **Now closed twice over by D-011:** Operator `exec` is denied in the shipped template (route unreachable) **and** the plugin treats code-mode input as opaque (refused while held, counted and audited when not). G-G item 8 still verifies both, because neither has met a live Gateway. |
| **A3″** | My original C6 advice ("read only `action`") was **wrong and is withdrawn**: the policy sees the model-facing tool envelope, not the `computer.act` node schema, so the fallbacks are load-bearing for code-mode visibility. **C6′ is now CLOSED in plugin v0.1.2** (opaque-input refuse-while-held + count-and-audit when not; retained in 0.1.3), and **D-011** additionally denies Operator `exec` for the MVP so the route is unreachable, with the matcher kept as defence in depth | DeepSeek's rebuttal is consistent with the cited docs; my citation described the *node command* schema | Replaced by **C6′**: keep the fallback list explicit and closed, and make an unresolvable action **fail closed** rather than allowed-and-uncounted. |
| A4 | Observation-during-hold is achievable because observation actions are distinguishable in `params.action` | `hook-types.ts:569-575` + taxonomy §5 | hold becomes all-or-nothing |
| A5 | Windows `get_window_state` background delivery works well enough to be useful | only docs + code comments, no behaviour read | CU-01 S3 records it; UIA-provider case gets stronger |
| A6 | `requireApproval` is never used for the hold | §2(b) | run pauses instead of refusing — user-visible hang |

## 9. Live Control UI verification (2026-10-26)

Owner-authorized bounded test on the normal interactive Windows profile, through the single
existing Control UI at `/systems`. The Zero bar is the hold surface; no second viewer, route,
page, or stream was added.

**Live-proven this run (Control UI connection path):**
- Initial render: explicit `loading`, then `free`; exactly one bar, mounted above the native
  `.systems-desktop`; text `Global hold - all sessions`.
- Take control through the UI button -> `held-this-client`; `Return control` enabled; the text
  states that agent input is refused while held and observation remains available.
- A second Control UI tab -> `held-other`; both Take and Return disabled; the text states the
  hold is global and affects all sessions.
- Release through the owning tab -> both tabs converge to `free`; the text requires a fresh
  desktop capture before the next action.
- Clean H1-H3 sequence: take -> CLI status `held:true, resumeSnapshotRequired:false`; close the
  owning tab without Release; new connection -> `held:false`, `resumeSnapshotRequired:true`,
  `stats.releasedByDisconnect` 1 -> 2, newest audit rows
  `{kind:"lease", action:"release", reason:"connection-closed", decision:"allow"}`. The
  surviving tab converged to `free`; no stale `held-this-client` was retained.

**Defect found and fixed by this live run:** the first build re-mounted the hold bar on every
MutationObserver tick because the reuse check compared the bar's parent with the Desktop
element while the bar actually lives inside a wrapper. Each mount produced another mutation,
which blocked the `/systems` main thread. Fixed by reusing only an attached, populated wrapper
and by ignoring mutations inside `.zero-computer-hold-host`; offline regression added
(`canReuseComputerHold`). The rebuilt bundle was served byte-identically after a controlled
Gateway restart.

**Not proven this run - exact blocker:** the agent-side refusal
(`computer-hold:human-control`) and the post-release `computer-hold:stale-frame` recovery
require an agent turn that actually exposes the `computer` tool. The installed gate is
`modelHasVision === false -> no tool` (`computer-tool-*.mjs`). The configured route
`nvidia/z-ai/glm-5.3-flash` is `input:"text"`. The two catalog entries advertising `text+image`
both failed at the provider on this run: `nvidia/moonshotai/kimi-k2.6` -> 404 "This model was
not found"; `nvidia/minimaxai/minimax-m3` -> 410 "The request took too long" (repeated
retries). No config or model route was changed. Consequently `stats.refusedByHold` and
`stats.refusedByStaleFrame` stayed 0, no desktop input was issued, and no Notepad document was
created by this test. A Notepad window titled `API.txt - Notepad` existed before the hold was
taken; it was not touched.

**Live view still blocked:** the native Desktop panel reports "Set up a desktop server" and
`desktop.observe` returns `UNAVAILABLE: desktop stream loopback RFB server is unavailable on
port 5900`. No VNC/RFB server was installed; no UAC/admin prompt was attempted. This remains
the exact prerequisite, not a code claim.

**Evidence labels:** UI states, disconnect release, served bundle, and live-view blocker =
live-tested this run. Refusal and fresh-capture recovery = offline-tested only. Source gate and
catalog metadata = source-verified.