# INT-00 integration prep — UI-lane checklist (OpenCode)

**Type:** preparation only. INT-00 is `NOT STARTED` on the board and the
senior opens it. Nothing in this file claims the ticket.
**Source of every fact below:** files in the workspace or dated AGENT_CHAT
entries (cited inline). Runtime claims stay unproven until Window D / INT-00
live checks; everything here is static or release-read fact.

---

## 1. What INT-00 will need from the UI lane

A working `E:\zero\app` build whose runtime connects to the live Gateway and
accepts the other lanes' canon with no code change, plus this checklist
executed against the live system with measured actuals. The lane's wire
contract is `reports/ui/bridge-spike.md` §5–§7 (accepted) — this file does
not restate it; it tracks what changed under it during the build wave.

## 2. Post-wave facts already implemented in `app/` (to verify, not restest)

| Area | Artifacts | Evidence source |
|---|---|---|
| Device identity + first-pairing token path | `src/server/pairing-keys.ts`, `pairing.ts`, `gateway-link.ts` token option | wave edits 05:48–06:12; `.env.example` OPENCLAW_GATEWAY_TOKEN (name-only) |
| Chat send/stream/stop chain | `src/server/gateway-link.ts`, `zero-agent.ts`, `thread-registry.ts` | §5–§7 contract; OQ-2b answer applied (see §3) |
| Computer control surface | `src/client/ComputerPanel.tsx`, `ComputerToolCard.tsx`, `src/server/zero-runtime.ts` passthrough | canon §11 items 7–13; case-sensitive `leaseId` sweep = 0 matches |
| Live view | `src/client/live-view.tsx`, `src/server/live-relay.ts`, `novnc.d.ts` | fail-closed until OQ-7 (`ZERO_LIVE_VIEW=1` opt-in) |

## 3. Canon decisions INT-00 should cite (with sources)

1. **chat.send params (OQ-2b CLOSED)** — from the installed release
   (DeepSeek, AGENT_CHAT 06:28): `sessionKey` REQUIRED (1–512 chars, no
   charset guard → `zero-thread-<uuid>` valid); `agentId` optional (direct
   specialist addressing); `sessionId` optional — reconnect semantics:
   `sessionKey` = stable identity, `sessionId` = lifecycle-rotation
   detector. Reserved-prefix rule is HTTP-header-only (`x-openclaw-
   session-key`), NOT WS-enforced; keep the prefix as transport-consistency
   preference. Dispatch-time semantic rejection of reserved keys is still
   unproven without one live call.
2. **Hold contract AS IMPLEMENTED (DeepSeek, AGENT_CHAT ~06:20)** — request
   `{action: take|release|status, controlLeaseId?, reason?}`; snapshot
   `{held, owned, scope:"global", controlLeaseId?, since?, reason?,
   resumeSnapshotRequired, stats, recent}`; refusals `computer-hold:*` +
   `zero-policy:*` reach the transcript as denies with the same reason
   strings — the panel renders refusals as text (D-009), no second channel.
   `scope`/`recent` are additive: my `ComputerControlResult` ignores unknown
   extras per §11 — no UI change needed.
3. **Refusal capture cross-link (Qoder)** — `computer/spike/result.schema.json`
   `steps[].refusalObserved.surfacesInSessionToolEvents` is the evidence key
   the Window-D/INT-00 check references when asserting my refusal rendering.
4. **Tool-layer global hold limits (Qoder standing points 05:55)** — no
   cover for raw node.invoke, in-flight native actions, reload clearing the
   lease, or a human at the physical console. Accepted MVP limits; INT-00
   must not promise more.
5. **Run-day PATH fact (Qoder ~06:15)** — `openclaw` is not on PATH; any
   docs/banner/owner command uses
   `.\node_modules\.bin\openclaw.cmd …` from `E:\zero\backend` (or
   `corepack.cmd pnpm exec openclaw …`). Applied to the pairing banner and
   my reports.
6. **Release-pin rule (DeepSeek reconciliation + Qoder "checkout ahead of
   release")** — every runtime claim names its source: installed release
   `fe06181`, NOT the `upstream/` checkout `0132405`.

## 4. INT-00 live-check sequence (first Gateway window)

Run in order; each step is aborted-able and records measured actuals:

1. **Connect + pairing path**: with `OPENCLAW_GATEWAY_TOKEN` set →
   token-exchange path, `hello-ok` token stored under `ZERO_STATE_DIR` (0600);
   without it → PAIRING_REQUIRED banner renders the working approve command,
   owner runs it, Retry → `connected` pill.
2. **Thread create + history**: `sessions.create` with
   `zero-thread-<uuid>` (OQ-2b: no create-time conflict expected at schema
   level); `chat.history` projection restores transcript rows prefixed.
3. **Send/stream**: first message → ONE text run, single dispatch; text
   accumulates via the chat-family projection (no chat/agent double
   accumulation); `session.tool` entries appear in Activity (OQ-6 casing —
   assert whatever the release emits, then align).
4. **STOP**: run interrupt via chat abort → sessions.abort fallback; STOP
   ALL reports per-session rows (`StopAllResult`).
5. **Computer control**: `status` on mount (read, does not take); `take` →
   pill "yours"; refusal paths render delivered reason; `release` sends
   `controlLeaseId`, honors `resumeSnapshotRequired` note.
6. **STOP ALL vs hold pill separation**: §5.3 two-distinct-surfaces rule —
   assert both surfaces stay independent under live refusals.
7. **Gap recovery**: force a reconnect; roster refetch + resubscribe;
   `sessionId` rotation detection flags lifecycle change (OQ-2b).
8. **Live view stays dark**: `ZERO_LIVE_VIEW` unset → relay disabled
   (fail-closed); enabling it is a separate verified-fact window, not part
   of INT-00's first pass.

## 5. Open items carried INTO INT-00 (owners)

| Item | Owner | Status |
|---|---|---|
| OQ-1 roster discovery shape | DeepSeek (release facts) / me (consume) | named-fact request open |
| OQ-6 `session.tool` casing | DeepSeek → release fact | named-fact request open |
| OQ-7 desktop.stream WS path | DeepSeek (facts) / me (relay enable) | fail-closed default; request #7 open |
| rxjs 7.8.1/7.8.2 + @ag-ui dual-zod dedupe | wave actor (fix) → my typecheck re-run | CLOSED — final typecheck exit 0 (07:5x IST, OpenCode) |
| `dist/server` refresh + refreshed typecheck evidence | wave actor or me at quiescence | CLOSED — vite build exit 0 (759 ms) + server tsc exit 0; dist 16.5 MB |
| Wave attribution claim | @actor/@manager | requested 06:12/06:16 |
| Rotated NVIDIA key | owner | exercise used existing key under owner authorization; rotation still requested |
| Backend runtime / process auth token | DeepSeek (their deferral list) | resolved in practice — Gateway restarted locally, device identity reused (adapter-debug), paired:true |


## 5.1 CopilotKit HTTP/SSE exercise — CLOSED (2026-10-23 ~07:5x IST)

run/stop/history/activity all validated live in `app/`. Full result table,
bug list (client transcript in-place-mutation fix), stack-recovery notes
(gateway + vite + runtime relaunched from `E:\zero\.zero-data\start-*.ps1`
secure-source-free launchers; device identity reused), and evidence pointers
are in `reports/ui/build-readiness.md` §7. The validated bridge behavior is
the functional baseline the D-012 integrated-UI slice inherits.

## 6. UI-lane exit criteria inside INT-00

Every §4 step executed live with actuals recorded in the integration report
(`reports/integration-mvp.md` — senior-owned file; UI-lane rows contributed
by me), failures converted to evidenced gap rows rather than silent passes,
and my board row moving `ACCEPTED` only on senior review.
