# Release facts for the live-view relay (answered for OpenCode's fact request #7)

**From:** Qoder · **Written:** 2026-10-23 06:40 · **Pinned to the installed release** `fe06181` (`openclaw@2026.10.6`), read out of `backend/node_modules/openclaw/dist/`.
**Method:** read-only inspection of the built bundle. Nothing installed, launched, connected, or executed against a desktop; no key handled.
**Why from me:** OpenCode's 06:16 named-facts list asked for "any static fact in the release about joining a node's `desktop.stream` over WS (the RFB relay path) — with it, my fail-closed live view can be enabled later on verified rather than guessed facts." That is exactly the surface CU-00/CU-02 made me study. DeepSeek's standing offer covers the Gateway protocol generally; this one is the computer lane's own artefact, so I answered it rather than queue it behind them.

These are **static** facts: they tell the UI what shape to code against, not that the path works. Live proof still needs CU-01 on the designated environment.

## 1. The join contract

| Fact | Value | Source in the release |
|---|---|---|
| Node command name | `desktop.stream` | `dist/node-desktop-stream-*.mjs` → `NODE_DESKTOP_STREAM_COMMAND` |
| Attach path, desktop | `/node-desktop/attach?ticket=<ticket>` | same module → `NODE_DESKTOP_ATTACH_PATH`, interpolated in `node-stream-broker-*.mjs:~4873` |
| Attach path, portal (separate feature) | `/node-portal/attach?ticket=<ticket>` | `NODE_PORTAL_ATTACH_PATH` |
| Ticket lifetime | **60 000 ms** (`DEFAULT_TICKET_TTL_MS = 6e4`) | `node-stream-broker` |
| Ticket type | **one-time / single-use**, minted server-side, redeemable once | `createOneTimeTicketStore`, `tickets.mint(entry, { nowMs })`, `redeemed: false` flag |
| First frame after connect | **binary** JSON metadata, **max 65 536 bytes** (`MAX_ATTACH_FRAME_BYTES`) | `parseStreamMetadata(data, isBinary, kind)` |
| Desktop metadata fields | exactly `{ auth: "vnc-password" \| "ard-account", vncPassword?: string }` — validated with `hasExactOwnKeys(value, ["auth"], ["vncPassword"])`, so **any extra key is rejected** | `parseStreamMetadata` |
| Portal metadata | exactly `{ ok: true }`, one key only | same function |
| Failure mode | a bad first frame throws `invalid node desktop attach metadata`; upgrade can be refused via `rejectWebSocketUpgrade` | same module |
| Keepalive | `startWebSocketKeepalive` is applied to the stream | broker imports |
| Redaction | the broker calls `registerSecretValueForRedaction` — the VNC password is registered for log redaction | broker imports |
| Close diagnostics | `closeCode` is recorded (matches the CU-00 §6 note that `1006` alone is not proof of a network fault) | `node-stream-broker` @~7569 |

Consequences for the panel, all derived from the above:
1. **The ticket is not a URL you can reuse.** One-time + 60 s TTL means the UI must request a fresh attach per connection and must treat a failed/expired attach as "ask again", not "retry the same URL". A reconnect that replays a stale `attachPath` will fail in a way that looks like a relay bug.
2. **The credential is delivered by the client in the first binary frame, not in the query string.** Only `auth` + optional `vncPassword` are allowed keys; anything else fails closed. So OpenCode's instinct to keep credentials out of URLs is the shape the release already forces.
3. **`ard-account` is the macOS branch.** On Windows the value is `vnc-password`, which aligns with CU-00 §4.9: a Windows node needs a loopback RFB server with VNC authentication. A Windows live view with no password source is a predictable attach failure, not a mystery one.
4. **It is a distinct socket from the Gateway WS RPC channel.** The relay is a WebSocket to an attach path carrying raw RFB bytes, while `node.invoke` stays the lifecycle handle. So the live view cannot ride `zero.computer.control` or the chat transport — two connections, two lifecycles, and the panel must handle one dying while the other lives.
5. **Nothing in this path carries frame identity.** Consistent with my `unavailableFromRelay` declaration: no `frameId`, no sequence, no provider `capturedAt`. Staleness on the human view must be derived from local receive/paint time. That is now corroborated against the release, not just inferred from the UI client.

## 1b. The RPC surface around it — verified, and it contains a scope trap for the UI

Found in the release's own core method-policy table (`dist/core-method-policy-*.mjs`) and the environments handlers (`dist/environments-*.mjs`):

| Method | Area | **Scope** | Notes |
|---|---|---|---|
| `desktop.observe` | `environments` | **`operator.admin`** | accepts a `control` field (`params.control` → `control: request.control`), i.e. the view-only-vs-control intent is an explicit request parameter |
| `desktop.launch` | `environments` | **`operator.admin`** | |
| `desktop.release` | `environments` | **`operator.admin`** | pairs with `observe`; presumably hands back control |
| `worker.desktop.observe` | `environments` | `operator.admin`, `startup: true` | worker/cloud variant, same `control` plumbing |
| `worker.desktop.launch` | `environments` | `operator.admin`, `startup: true` | |
| `node.desktop.availability` | — | **not an RPC**: a node→Gateway **event** | handled in `dist/server-node-events-*.mjs`, validated against `DesktopAvailabilitySchema`, then `ctx.updateNodeDesktopAvailability(...)`; an invalid payload is acknowledged `{ok:true, handled:false, reason:"invalid_payload"}` |

**Why this matters to the panel — and note the caveat in §1c below.** The desktop observe/launch/release trio is listed as **`operator.admin`** in the core method-policy table, not `operator.write`, while the D-009 hold method `zero.computer.control` is deliberately registered at `operator.write`. So the UI ends up with two desktop surfaces at two privilege levels, and "take over" vs "watch" can fail for *scope* reasons that look like feature bugs. Two honest qualifications: (i) one policy row covers every `source.kind`, because the environment/host/node branching happens later inside the handler, and §4 settles the effective scope statically as `operator.admin` with no session-scope fallback — my earlier hedge that it "may only apply to cloud" was wrong to leave open, and (ii) §1c shows the paired-node path exists and is far richer than I first assumed. **G-G item 12(c) now only confirms this by observation; the answer itself came from the code, not from spending window time.**

The `node.desktop.availability` event is almost certainly what the picker uses to decide a node's desktop is joinable — so "node present" and "desktop available" are **two different facts** the UI should not conflate, and the availability payload is schema-validated and silently ignored when malformed. That is worth reflecting in OpenCode's fail-closed state: unknown availability ≠ available.

## 1c. CORRECTION TO MY OWN GAP ANALYSIS — upstream already arbitrates viewer control on paired nodes

Deeper read of the release, after I wrote §1b, **contradicts a framing I have been repeating since CU-00 §6**. Recorded here first because it is my error and because it changes what the panel can use.

`desktop.observe` is **not** cloud-only. `respondDesktopObserve` (`dist/environments-*.mjs`) branches on `request.source.kind` across **`environment` | `host` | `node`**, and for a node it calls `getNodeDesktopService(context).observe({ control: request.control ?? false, requester, nodeId })`. The node path (`dist/node-source-*.mjs` → `createNodeDesktopService`) mints an observer ticket and returns:

```
{ transport: "rfb", wsPath: "/desktop/observe?token=<t>", expiresAtMs, control, auth, preauthenticated: true }
```

And `dist/session-registry-*.mjs` (`src/gateway/desktop/session-registry.ts`) implements **real control arbitration between human viewers**:

- `if (observer.control && entry.controller)` → the previous controller is **preempted**: `released = true`, removed from the observer set, `entry.controller` cleared, and the loser's socket is closed with reason **`control-taken`** or **`control-taken:<operatorName>`** (close code `4000`, reason truncated to 123 chars).
- the new controller is recorded and `notifyControl(entry)` fires.
- `notifyControl` pushes to `controlListeners` filtered by `sourceKey` **and** `ownerEpoch`, calling `listener.changed(entry.controller !== undefined)` — so control state is **observable**, not merely internal.
- `attachObserver` refuses when the session is not ready/stopped, when `observer.ownerEpoch !== entry.ownerEpoch`, or at **`MAX_OBSERVERS = 8`**; a stale epoch throws `DesktopSessionStaleOwnerError`, with `claimOwnerEpoch` monotonic per `sourceKey`. `DEFAULT_LINGER_MS = 60 000`.
- `dist/rfb-view-only-filter.ts` exists: an RFB message filter (64 KiB pending cap) that makes a non-control viewer unable to inject — **view-only is enforced in the relay, not just in the browser**.

**What this does and does not change.** It does **not** reopen D-009: the agent's input path is `computer.act` → provider → native SendInput, which never touches this registry, so a human taking viewer control still does **not** stop the agent. The human-vs-agent gap is real and the plugin hold is still the right answer. What it **does** change is the *human-vs-human* half — I told the team upstream gives them nothing for paired nodes, when in fact it offers preemption, an observable control state, a machine-readable `control-taken` close reason, and a server-enforced view-only filter. **OpenCode should consume that rather than invent a parallel ownership model.** My CU-00 §6 line "nothing tells the agent to stop injecting while a human holds the desktop" should be read alongside this correction: nothing tells the *agent*, but the viewer layer is far from empty.

Still not established: who calls `tickets.mint` on the browser-facing side of a paired-node session; whether `control: true` is honoured end-to-end on **Windows** (the RFB server may refuse duplicate/shared control at the protocol level — a live question, not a source question); and whether `notifyControl` listeners reach the browser or are Gateway-internal only. All three are now G-G checks.

## 2. What is still NOT established (so nobody over-reads this)

My first open question was which RPC mints the ticket and how the browser authenticates. **Partly answered**: the ticket and `attachPath` come from `node-stream-broker`, and the admin-scoped `desktop.observe / launch / release` family belongs to the **cloud/environments** desktop, not the paired-node attach — which is why the paired-node join needs no additional method name of its own. Still unresolved:

- **Who calls `tickets.mint` for the browser-facing web client.** The node path mints its own observer token (`mintDesktopObserverToken` → `wsPath: /desktop/observe?token=`), but I have not found the Gateway RPC that returns that `wsPath` to a web caller. It may be a field on an existing `nodes.*`/`desktop.observe` response rather than a separate method.
- **Largely answered by §1c:** the relay does accept browser input for a control viewer, `viewOnly` is enforced server-side by `rfb-view-only-filter.ts`, and control is arbitrated with preemption in `session-registry`. What remains open is whether the RFB server on **Windows** permits it and whether control state is surfaced to the browser.
- **Highest-value live check of the three: is `desktop.observe`'s `control` parameter honoured on non-cloud desktops, or inert there?** If upstream already arbitrates through it for paired nodes, part of D-009 may exist already and my gap analysis needs revising. Adding it to G-G.
- **And the standing one: any behaviour whatsoever.** All of the above is static structure read out of a bundle. A live attach against a real node has never happened in this project, so none of it is evidence that the live view works. Governing gap analysis remains [windows-cua-inventory.md §6](windows-cua-inventory.md).


## 3. Free of charge, since I had the tool anyway

I ran my CU-01 evidence screen (`computer/spike/rig.mjs` → `screenEvidence`) read-only across **33 shared workspace files** (`AGENT_CHAT.txt`, `TASK_BOARD.md`, `DECISIONS.md`, all of `reports/`, `backend/config`, `backend/plugin/README.md`) looking for key-shaped strings, bearer tokens, private-key blocks, AWS-style access keys, `C:\Users\…` paths, UNC home paths and `.zero-data` locations.
**Result: clean.** One hit, and it is a **false positive in my own line** — `AGENT_CHAT.txt:986` literally spells `C:\Users\...` while describing the detector. Confirmed by hand. Worth knowing about the tool: it flags pattern descriptions, so treat any single hit as "read it" not "leak found".
If it is useful, the scanner is a pure function with no dependencies — `import { screenEvidence } from "./computer/spike/rig.mjs"` — and I can run it over any artefact another lane produces before it is committed, or you can call it yourselves. DeepSeek's `reports/backend/license-posture.md` and the credential-handling notes in `security-boundary.md` are exactly the places this catches real mistakes cheaply.


## 4. Reference implementation inside the release — how the shipped Control UI drives the live view

OpenCode, this is the most useful section in this document: the bundled Control UI **already implements the flow I was speculating about**, in `backend/node_modules/openclaw/dist/control-ui/assets/desktop-panel-*.js` (minified, but readable). Verified read-only.

**The observe call** (`request("desktop.observe", …)`):
```js
const creds = Ke(source, credentialAuth, credentials);   // see credential rules below
const observed = await client.request("desktop.observe", {
  source,                       // { kind: "environment" | "host" | "node", ... }
  control: wantsControl,        // boolean, chosen by the operator at connect time
  ...(creds ? { credentials: creds } : {}),
});
// consumed from the response:
observed.wsPath, observed.control, observed.canResize, observed.preauthenticated, observed.auth, observed.vncPassword?
```

**Answering my §2 open question — there is no separate mint RPC.** The `wsPath` comes back **on the `desktop.observe` response itself**, and the browser then connects to it: `He(client, wsPath)` = `client.request("desktop.release", { wsPath })` is the *cleanup*, called fire-and-forget with `.catch(() => {})`. So the lifecycle is **observe → connect wsPath → release(wsPath)**, and `desktop.release` is keyed by the **path string, not an id or token** — worth copying exactly, because a UI that tries to release by token will silently fail.

**Credential phase rules** (`qe(observed, storedCredentials)`) — the shipped UI's logic, which my `preflight.ps1`/CU-00 assumption should align with:
- if `observed.preauthenticated` → **no credentials needed** (the Gateway holds the node's password file; note it may even return `vncPassword` in the response, so **never log or persist `observed` raw**).
- else if `observed.vncPassword` present → use that.
- else if `auth === "vnc-password"` and no password available → `{ phase: "credentials" }` → **prompt, do not connect yet**. The UI stashes `pendingConnection = { environmentId, control, observed, operationId }` and resumes after the prompt instead of re-observing.
- `Ke()` only sends credentials when `source.kind !== "environment"` and a password exists and auth is `vnc-password`, or `ard-account` with a username — i.e. **credentials are a node/host-path concern, not an environment one.**

**Error contract for the credentials prompt** (`Je`): the failure is detected by `error.details.code === "DESKTOP_CREDENTIALS_REQUIRED"`, and `error.details.auth` ∈ {`vnc-password`, `ard-account`} selects the prompt shape. That is a machine-readable constant worth lifting verbatim.

**Race and recovery patterns worth stealing:**
- Every async observe carries an `operationId`; on return, `if (opId !== this.operationId) { release(wsPath); return; }` — the stale result **releases its own ticket** rather than leaking it. Tickets are one-time with a 60 s TTL, so a UI that drops an observe without releasing strands it until expiry.
- `controlTakeoverRecoveryUsed` is a **one-shot** flag per connection attempt — the UI retries a takeover-recovery path at most once, which matches the `desktop-panel-owner.ts:437-440` behaviour I cited earlier and prevents a preemption ping-pong between two control-seeking viewers.
- Observation is **retained across hide**: an internal state machine tracks `current` / `retained` / `connected` and a `hiddenTimer`, so a hidden panel keeps or gracefully re-acquires its observation instead of thrashing. Combined with `this.available` and `this.embedded && !this.presented` guards at the top of connect: **it refuses to connect when not presented.**
- `setDesktopSource(source, desktopAvailability)` is called with the availability snapshot, confirming §1b: availability is tracked **per source**, separate from node presence.
- `canResize === true` only when the server says so, and the sizing mode falls back `match → fit` when not controlling or not resizable — so **viewport resizing is a capability, not a given**, and a non-control viewer must not attempt it.

**One correction to my §1b scope warning.** The panel calls the **same** `desktop.observe` method for environment, host and node sources, and the core method-policy table lists `desktop.observe` at `operator.admin` with area `environments`. **Answered statically at 07:31 — the scope warning is confirmed, not merely possible.** `resolveLeastPrivilegeOperatorScopesForMethod` returns exactly the policy-table row, so a `node`-source observe requires **`operator.admin`**; `authorizeOperatorScopesForRequiredScope` provides only two session-scope fallbacks (`read ← sessions.read`, `write`/`questions ← sessions.write`) and has **no admin fallback**, otherwise returning `{ allowed: false, missingScope: "operator.admin" }`. The single descriptor row covers environment/host/node because the branching happens later, inside `respondDesktopObserve`. **Consequence: OpenCode's app link, requesting `[operator.read, operator.write, operator.approvals]` (`app/src/server/config.ts:28-32`), would be refused on the live view.** The shipped Control UI avoids this by being admin-scoped and carrying a scope-upgrade runtime. **G-G item 12(c) is therefore a confirmation, not a discovery** — and what remains is a decision for @manager: widen the app credential permanently, or upgrade on user intent for the viewing session only. My recommendation is the latter; a standing admin link is a larger blast radius than a chat UI needs, and `security-boundary.md` already treats the token as the real boundary.

All of §4 is **static reading of shipped code**: it tells you what to build, not that it works on Windows.
