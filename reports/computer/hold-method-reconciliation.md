# `zero.computer.control` — three-way reconciliation (plugin ↔ app ↔ contract)

**Owner:** Qoder · **Written:** 2026-10-23 07:50 · **Task:** START_TASKS §2 — "reconcile `zero.computer.control` method/status with DeepSeek and OpenCode".
**Method:** every line below was read out of the shipped files, not from anyone's summary. **Read-only: nothing installed, launched, connected, or executed. No desktop action.**

Sources: [`backend/plugin/index.js`](../../backend/plugin/index.js) v0.1.3 · [`app/src/shared/zero-types.ts`](../../app/src/shared/zero-types.ts) · [`app/src/server/zero-runtime.ts`](../../app/src/server/zero-runtime.ts) · [`computer/contracts/takeover-hold-contract.md`](../contracts/takeover-hold-contract.md) · [`reports/ui/bridge-spike.md`](../ui/bridge-spike.md) §11 · release bundle facts in [release-facts-desktop-stream.md](release-facts-desktop-stream.md).

## 1. Status: CONVERGED on names, with two real deltas

| Element | Plugin (shipped) | App (shipped) | My contract | Verdict |
|---|---|---|---|---|
| Method name | `zero.computer.control` | called via `link.computerControl` | same | ✅ |
| Request field | `params.action` ∈ `take`\|`release`\|`status` | route validates the same three | same | ✅ |
| Lease field | `controlLeaseId` (`:349`, `:355`, `:394`) | typed as `controlLeaseId?` | same, no fallback shim | ✅ closed |
| Snapshot | `held, owned, scope:"global", controlLeaseId?, since?, reason?, resumeSnapshotRequired, stats, recent` | `held?, owned?, controlLeaseId?, resumeSnapshotRequired?, since?, reason?, stats?, code?` | §3 lists all but `scope`/`recent` | ⚠ **delta A** below |
| Unknown verb | `fail(badRequest, "Unknown action …")` | 400 before reaching Gateway | not specified | ⚠ **delta B** below |
| Error envelope | `respond(false, undefined, { code, message, details? })` | wraps into `{ result: {…, code:"runtime-error"} }` | codes listed, envelope not stated | note |
| Registration scope | `operator.write` (`:492`) | link asks for `[read, write, approvals]` | I demanded explicit non-admin | ✅ consistent, and the senior's 06:22 live round-trip worked |

**Delta A — `scope` and `recent` are load-bearing, not ignorable extras.** OpenCode's own note offered to treat them as ignorable. `scope: "global"` is the *only* place a UI can learn that the hold is not per-target (C7) — silently ignoring it lets the panel imply per-conversation ownership. `recent` is a bounded audit ring; it is what turns "the agent was refused" into a displayable fact. **My recommendation: type them explicitly.** `controlLeaseId` is present **only when `owned`** — a UI must not assume it on a status poll by a non-holding client.

I have therefore extended the canon in [takeover-hold-contract.md §3](takeover-hold-contract.md): snapshot becomes
`{ held, owned, scope:"global", controlLeaseId?, resumeSnapshotRequired, since?, reason?, stats?, recent? }`.

**Delta B — the app's route accepts `sessionKey` and forwards it, but the hold has no notion of a session.** `zero-runtime.ts:245` reads `sessionKey?` and passes it to a method whose state is one global record. Harmless at the transport level, misleading at the product level: it invites a "this chat's desktop is held" label for a lock that blocks every computer action everywhere. Either drop the field from the route or label it as "computer control (all sessions)". Flagged to OpenCode, their lane to decide.

## 2. Release semantics, verified — for the record

- `release` with **no active hold** → `computer-hold:lease-invalid` (not `ok`). Right way round: a UI showing "release" affordances only when `held`.
- `release` with **wrong owner or wrong lease** → same `lease-invalid`; no silent success. Matches my contract requirement.
- `release` sets `resumeSnapshotRequired = cfg.requireFreshSnapshotAfterRelease` (default true) → the plugin, not the UI, owns the freshness gate; the UI must obey the flag rather than infer it.
- `take` while already held by **the same** owner is idempotent; by a **different** owner → `already-held` with `since` in details. Never queued. Matches D-009 and the OpenMausBot refuse-not-queue rule I cited.
- `status` is the non-taking read OpenCode's reconnect rule needs. Confirmed implemented (`:369`) and already called by the app (`ComputerPanel.tsx:97`).

## 3. The one blocking issue this pass found — OpenCode's live relay points at a path that does not exist

Not a naming problem, a **wrong-by-construction** one, and cheap to fix now rather than at INT-00. [`app/src/server/live-relay.ts`](../../app/src/server/live-relay.ts) builds:

```ts
workerUrlBuilder = (sessionKey) => `${gatewayBase}/live/desktop?sessionKey=${…}`
```

Verified against the release, the real paired-node join is: **call `desktop.observe` with `{ source: { kind:"node", nodeId }, control }`, and it returns `wsPath = "/desktop/observe?token=<one-time, 60 s>"`**, released later via `desktop.release({ wsPath })`. So three concrete errors: (1) the upstream path is `/desktop/observe`, not `/live/desktop`; (2) it is authenticated by a **single-use ticket**, not a `sessionKey`; (3) the code **never calls `desktop.observe`**, so no ticket can exist. Reusing the same constant for the browser-facing local path and the Gateway path is what made the mistake invisible. The file's own `[needs live proof OQ-7]` tag was honest — but the answer was already available statically, so it can be closed now instead of in the window.

**And the sharpest consequence, which is a decision, not a bug:** `desktop.observe` requires **`operator.admin`** with no session-scope fallback, while the app link requests `[operator.read, operator.write, operator.approvals]`. **Even with the URL fixed, that relay would be refused today.** Options, all legitimate, none mine to pick: upgrade the app link to admin (largest blast radius, and it would also satisfy the hold method by accident rather than by design); request admin only for a viewing session and drop it on disconnect (my recommendation — it mirrors upstream's own scope-upgrade runtime and keeps "watch" distinct from "chat"); or ship CU-01/CU-02 without the live view and keep the transcript-level hold evidence. Flagged to @manager and OpenCode at 07:55.

## 4. What I changed and what I deliberately did not

Changed, in my own lane only: canon snapshot row extended with `scope`/`recent` and the owned-only lease note; a `missingScope` vs `unavailable` distinction added to the evidence schema; G-G item 12(c) reclassified from *discovery* to *confirmation*; the audit script added and green (25/25).

**Not changed:** `backend/` and `app/` are other lanes — I report and cite, I do not patch. The plugin's `scope:"global"` and the relay URL are OpenCode's and DeepSeek's calls. No contract name changed that anyone is already building against.

**Still unproven by all of this:** any live behaviour. The senior's round-trip proved registration and the state machine; the action filter and the model-facing surface are now audit-verified against the release; **no Windows desktop has been observed or driven, and that remains CU-01 on the designated isolated environment only.**

## 5. D-012 alignment — one Control UI shell

D-012 makes the pinned OpenClaw Control UI the single Zero product shell. The old `app/src/server/live-relay.ts` finding above remains useful as a warning about the retired React bridge prototype, but it is **not** an instruction to repair that second UI. OpenCode should adapt the shipped Control UI desktop panel and its Gateway client flow, preserving its existing navigation, session/history model, and computer-view lifecycle.

The integration contract for that shell is:

- Reuse the shipped desktop panel flow: `desktop.observe({ source: { kind: "node", nodeId }, control, credentials? })` returns the one-time `wsPath`; connect that path, then call `desktop.release({ wsPath })` on disconnect and when discarding a stale observe result. Ticket lifetime is 60 seconds. Do not construct a `/live/desktop?sessionKey=...` Gateway URL.
- Keep scope errors distinct from unavailable-node errors. The method policy requires `operator.admin` for node `desktop.observe`/`desktop.release`; ordinary read/write/approvals scopes have no admin fallback. Prefer the Control UI's user-intent scope upgrade for the viewing lifecycle, released when the view ends, rather than a permanently admin-scoped chat connection.
- Render the plugin hold snapshot as a **global** computer-control state. Preserve `scope`, `recent`, `resumeSnapshotRequired`, `held`, `owned`, and `controlLeaseId?` (only present for the owning client). Do not attach the hold to a chat/session or silently drop the audit ring.
- OpenMausBot is a source of small behavior/pattern references, not a second desktop stack. Candidate adaptations for the native Control UI shell: fail-closed takeover/input demotion from `src/components/computer-takeover.ts` and `src/lib/desktop-connection.ts`; lease/refuse-never-queue semantics from `server/computer-control.ts`; capture revision checks from `server/private-screen-capture.ts` and `server/screen-frame-source.ts`; frame dedupe from `server/computer-observation.ts`. The main live view should stay on OpenClaw's existing RFB WebSocket path rather than adding OpenMausBot polling/transport.
- The Control UI is Solid and OpenMausBot components are React/TSX; treat these as behavior references unless the UI lane proves a very small, cohesive React island is lower-maintenance. Do not add another window, navigation stack, or transcript store.
- **OpenCode's selected seam (confirmed 2026-10-23):** use the existing Control UI native **Systems/Devices → Desktop** panel for computer view/control. It already owns the ticket → RFB `wsPath` → `desktop.release` lifecycle and scope-upgrade UX. Do not copy OpenMausBot's viewer or revive the prototype `/live/desktop` relay. Zero's first UI slice is a separate native `controlUi.entry` Zero Team sidebar page using host agent/session APIs; computer controls remain in the built-in Systems/Desktop route, with no duplicate desktop panel. This is the UI lane's chosen implementation direction; source/build proof is OpenCode's responsibility.
- OpenMausBot is Apache-2.0, but `enterprise/` is separately licensed/proprietary. Any copied/adapted files need retained attribution/NOTICE and their dependency notices; do not copy `enterprise/`, trademarks, or mascot assets. See `upstream/openmausbot/LICENSE`, `LICENSING.md`, `NOTICE`, and `reports/computer/windows-cua-inventory.md` §§9–10.

These are source-derived integration facts, not Windows behavior proof. Actual paired-node observation, control, and takeover remain CU-01 work in the designated isolated Zero environment.

## 6. Live method round trip — registration and state machine proven (D-013 recheck)

The Gateway was already running under D-013, so the previously source-only `zero.computer.control` contract could be checked live **without touching a desktop**. All calls were `POST /api/zero/computer/<action>` through the app bridge; the lease was inspected only as a boolean and never printed.

| Step | Result |
|---|---|
| `status` before | `held:false`, `owned:false`, `scope:"global"` |
| `take` | `held:true`, `owned:true`, `scope:"global"`, `controlLeaseId` present (value not printed) |
| `release` | `held:false`, `owned:false`, `resumeSnapshotRequired:true`, `scope:"global"` |
| `status` after | `held:false`, `owned:false`, lease absent, `resumeSnapshotRequired:true` |

This confirms four things that were previously only read from source: the plugin is **loaded** in the installed release, the gateway method is registered and reachable through the app link, the global-scope snapshot matches the contract, and the release path sets the freshness flag. It does **not** prove the trusted tool policy fires for the core `computer` tool — no tool call was made, by design. That remains CU-01 on the designated isolated environment.

Also confirmed live: a plain chat turn through the app bridge stored both the user message and `ZERO_BE02_OK` in canonical Gateway history. A delegation turn returned `RUN_STARTED` and then timed out at the app's 45 s run limit with no assistant turn — an app-side timeout/serving gap, reported to OpenCode, not a backend runtime failure.

No desktop was observed, captured, or driven. The everyday Windows desktop was never the target.

### 6.1 Refusal and idempotence probe (same live method, no desktop)

| Step | Observed |
|---|---|
| `take` (first) | `held:true`, `owned:true`, lease present (not printed) |
| `take` (second, same owner) | `held:true`, `owned:true`, **same lease** — idempotent |
| `release` with a bogus lease | refused: `controlLeaseId does not match the active hold`; hold **stayed active** |
| `status` after refusal | `held:true`, `owned:true` |
| `release` with the real lease | `held:false`, `owned:false`, `resumeSnapshotRequired:true` |
| final `status` | `held:false`, `owned:false`, no lease |

This confirms D-009's refuse-never-queue behaviour and the server-owned lease at the live method.
One UI note: the retired app bridge wraps any gateway error as `{code:"runtime-error", held:false,
owned:false, reason}`. The lease-mismatch refusal therefore arrives with the right message but a
generic code and `owned:false` even though the hold remains owned. The native Control UI calls the
plugin method directly and should keep rendering the last known hold until a fresh `status`, rather
than treating an error response as "unheld".

## 7. Reconnect scope and stale-hold recovery — fixed and proven live (2026-10-23 08:30 IST)

### 7.1 Operator scope after reconnect

`zero.computer.control` is registered with explicit `operator.write`. A Control UI connection
requests its operator scope set at connect time; scopes are not consumed per call and no per-action
or post-reconnect approval is involved. Live proof after the intentional Gateway restart: a fresh
Gateway CLI connection (a new connection, same loopback/auth-none configuration) executed `take`
successfully, and a second fresh connection read `status` successfully. This matches OpenCode's
live card exercise. `desktop.observe` remains a separate `operator.admin` capability and is not
covered by the hold method.

### 7.2 The stale-hold defect (verified against the installed release)

The plugin stored `hold.owner` as the per-connection Gateway client object and compared it by
identity. A browser reconnect (or CLI reconnect) is a new client object, so:

- `status` correctly showed `held: true, owned: false`;
- `take` by the new connection returned `computer-hold:already-held`;
- `release` by the new connection returned `computer-hold:lease-invalid`;
- the hold is in memory with no TTL, so the agent's input stayed refused until a process restart.

The host contract that makes a clean fix possible is in the installed release:
`ws-connection-Cq7PPwbb.mjs` creates one `AbortController` per socket, assigns
`next.connectionSignal = connectionController.signal`, and calls `connectionController.abort()` in
`socket.once("close", ...)`. The signal therefore fires for a tab crash, a network drop, and a
missed `pagehide` — not just a graceful UI close.

### 7.3 Fix in `zero-policy` 0.1.3

- On `take`, the hold is bound to the owner's `connectionSignal`. The listener is detached on a
  normal release and is `once` on abort.
- On owner disconnect, the plugin releases the hold, sets
  `resumeSnapshotRequired = requireFreshSnapshotAfterRelease`, increments
  `stats.releasedByDisconnect`, and appends a bounded `recent` audit row
  `{kind:"lease", action:"release", reason:"connection-closed", decision:"allow"}`.
- A non-owner connection closing is a no-op. A normal release does not increment
  `releasedByDisconnect`.
- `take` now requires an active, non-aborted Gateway client connection; a hold can no longer be
  created without a connection that the plugin can monitor.
- The explicit hand-back path and its fresh-snapshot gate are unchanged.

**Trade-off recorded deliberately:** a human whose connection dies is no longer present to hold
control, so the hold is released rather than left blocking the agent forever. The agent still
cannot act on a pre-handover frame because the same fresh-capture gate is armed. A transient
disconnect therefore requires the user to take control again; that is the fail-safe choice, not an
oversight.

### 7.4 Focused checks and live evidence

| Check | Result |
|---|---|
| Selftest | **111/111** (15 connection-bound checks: owner release, non-owner no-op, listener detach, closed-connection take, audit row, stale-frame gate; plus 2 focused checks added 09:39 IST: a new connection is not offered the dead lease, and non-owner status never leaks the lease id) |
| Live activation | `plugins reload zero-policy` still fails on the Windows `EPERM` plugin-capture symlink; intentional Gateway restart loaded `zero-policy` **0.1.3**, `status:"loaded"` |
| Live take on connection A | `held:true`, `owned:true`, lease minted |
| Connection A closes | CLI process exit; no desktop action |
| `status` from a new connection | `held:false`, `resumeSnapshotRequired:true`, `releasedByDisconnect:1` |
| Audit | newest `recent[]` row (the only row in that run) = `{kind:"lease", reason:"connection-closed", decision:"allow"}` |
| Preflight | 29 pass / 3 warn / 0 fail |

This closes the backend side of OpenCode's ask 2 and the stale-hold portion of ask 1. It does not
prove the trusted tool policy or any desktop observe/input; those remain CU-01 on the designated
isolated Zero Windows environment.

**Installed-release recheck (2026-10-23 09:44 IST).** The gate's clearing paths were verified in
the running release `fe06181`, not only in the checkout:

- `dist/computer-tool-BYo9lKTd.mjs:1364-1383` routes `screenshot`, `wait`, and `take_control` through
  `captureAndDeliverScreenshot`; `wait` sleeps and then captures, so clearing the gate on `wait` is
  correct on this artifact.
- `get_window_state` accepts `includeScreenshot` (`:494-495`; schema `dist/computer-use-contract-
  Ctek0XlQ.mjs:172,219`). The trusted policy receives the model-facing params before
  `prepareComputerArguments` runs (`dist/agent-tools.before-tool-call-B71Yo63P.mjs:3289-3296`), so
  the explicit `includeScreenshot:true` is visible to the gate. Omitted or `false` stays
  non-clearing, which is the conservative direction.

### 7.5 Evidence contract for the designated environment (G-G item 15)

The fix above is proven at the Gateway layer. To keep a later run from claiming it on a normal
release, the CU-01 evidence now carries a dedicated block:

- `result.schema.json` → `holdRecovery` (required top-level object) with
  `ownerConnectionClosedWithoutPagehide`, `ownerConnectionPath` (`control-ui|raw-ws|cli`),
  `statusReadFromNewConnection`, `resumeSnapshotRequiredBefore`,
  `statusFromNewConnection.{held,owned,resumeSnapshotRequired}`,
  `releasedByDisconnectBefore/After`, `connectionClosedAuditRow`,
  `inputBeforeFreshCapture.{action,errorCode,refused,desktopEffect}`, `freshCaptureClearedGate`,
  `result`.
- `verdict.k7` is **true only if all of them line up**: no-pagehide death, status from a new
  connection, the gate clear before the take (`resumeSnapshotRequiredBefore:false`),
  `held:false`, `owned:false`, `resumeSnapshotRequired:true`, counter `+1`,
  `connection-closed` audit row, `computer-hold:stale-frame` refusal with
  `desktopEffect:"none"`, and a fresh capture that clears the gate. A clicked Release, a
  same-connection status read, a hold refusal masquerading as stale-frame, a refused input that
  still landed, or an uncleared gate each force `k7 = false` and add a line to `notClaimed`.
- Sequence and expected values: [`cu01-spike-protocol.md`](cu01-spike-protocol.md) §3b H1–H6.
- Runner: [`computer/spike/k7-run.mjs`](../../computer/spike/k7-run.mjs) performs H1–H3 through
  separate CLI processes and requires an owner-written
  `computer/spike/designated-environment.json` (`designatedBy:"owner"`, `o1Resolved:true`,
  `holdRecoveryApproved:true`, role label, UTC timestamp). It cannot perform H4/H5; the pending
  block stays `result:"not-attempted"` until `--merge` combines Operator evidence.
- Rig coverage: `validateHoldRecovery` + `computeVerdict` k7 + runner pure functions,
  **152/152** offline (`node computer/spike/rig.test.mjs`).

Still owed on the designated environment: the agent-side stale-frame refusal (H4) and the
fresh-capture clear (H5), plus the Control UI connection-death path if the UI claim is to be
made. The runner's `ownerConnectionPath:"cli"` exercises the same host abort path but does not
prove the browser tab/renderer path. Until those are recorded, k7 is unclaimed even though the
Gateway-layer behavior is live.

### 7.6 Native card reconnect review — source-level finding (2026-10-23 09:28 IST)

Reviewed OpenCode's current `app/zero-control-ui/browser.js` (mtime 09:19:54 IST) against the live
served revision `1a1d2ce3…`. Read-only; no app/ edit.

- **Status read path:** the card requests `zero.computer.control {action:"status"}` on mount, on
  every host update, when the tab becomes visible, and on a 15 s poll
  (`browser.js:355-388`, `:1401-1410`, `:1416-1429`). `pagehide` calls `releaseOnLeave`
  (`:1413-1428`, `:523-528`), which is the normal hand-back path, not the no-pagehide case.
- **Operator scope:** the hold method is `operator.write`; a reconnecting Control UI connection
  receives its operator scope set at connect time, with no per-call or post-reconnect grant.
  `desktop.observe` / `desktop.release` remain `operator.admin` in the built-in
  Systems/Devices → Desktop panel and are deliberately separate. No backend change.
- **Finding (UI, not hold state):** `loadComputer()` has a 3 s throttle (`:360`) and does not force
  a read when the host's connection identity changes; `computer.snapshot` is also not cleared when
  the connection drops. On a transient drop/reconnect where the page survives, the card can show a
  cached `owned:true` and a "Hand back" action for up to 3 s (longer if no host update arrives)
  before the first new status replaces it. The server remains authoritative: a release on the new
  connection returns `lease-invalid`, and `refreshAfterConflict` forces a status (`:473-480`), so
  the stale display cannot outlive the next refresh. This is a UI-contract violation of "the first
  status after reconnect is authoritative", not a stale-hold backend defect.
- **Request to OpenCode:** force `loadComputer(true)` when the connection object/generation changes,
  clear `computer.snapshot`/`owned` when disconnected, and render "checking" rather than cached
  ownership. No backend or contract field change is required.
- **Still CU-01:** a browser tab/renderer killed without `pagehide` (`ownerConnectionPath:
  "control-ui"`) has not been exercised; the Gateway-layer release is proven with the CLI path, and
  k7 stays unclaimed.

**Resolution (2026-10-26, source/test only).** The reconnect request above was implemented during
the native source split, so the `browser.js:...` line references are historical: `browser.js` is now
a 28-line registration entry and the hold client lives in `src/computer/hold.js`.

- `setConnected(false)` clears the cached snapshot and lease and renders `unknown`; the first
  successful status after reconnect is authoritative; generation guards ignore stale responses.
  Tests: "disconnect clears the lease, blocks actions, and reconnect re-reads state" and "a stale
  status that resolves after a disconnect is ignored".
- The same module now hands back only this view's lease on `pagehide` and when `/systems` is left;
  `dispose()` alone never releases (host re-render safety), and a failed hand-back is recoverable by
  returning to `/systems`. No Gateway method, payload, or permission changed.
- This does not change k7: browser tab/renderer death without `pagehide` remains unexercised, and
  `ownerConnectionPath:"control-ui"` is still owed on the designated environment.

