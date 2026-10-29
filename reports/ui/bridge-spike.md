# UI-01 — Minimal AG-UI ↔ OpenClaw Session/Event Bridge: Contract, Transport Comparison, Proof Plan

**Owner:** OpenCode · **Ticket:** UI-01 · **Date:** 23 Oct 2026, 04:55–05:25 Asia/Calcutta
**Status:** Design/contract artifact + written proof plan. **No installs, builds, or code written.** Every claim is sourced from accepted inventories (`reports/ui/opendots-inventory.md`, `reports/backend/source-inventory.md`) or direct reads of upstream docs at pin `013240515205573248c27ab6b8eec7303f0da1a8` this session. Anything not yet proven live is labeled **[needs live proof]**.
**Follows:** D-007 (accepted): OpenDots UI + CopilotKit/AG-UI preserved where useful; Zero adapter replaces Intelligence-only persistence; OpenClaw is the session source of truth.

---

## 1. Recommendation in one paragraph

Build the bridge as a **browser-side AG-UI agent over the OpenClaw Gateway WebSocket protocol v4** — a `ZeroAgent` in the CopilotKit `AbstractAgent` mold (the same shape OpenDots proves server-side in `dot-agent.ts`) speaking to `@openclaw/gateway-client`. Use **OpenClaw sessions directly as the thread store** (sessions.list/create/patch/delete + chat.history) — no Zero-side transcript copy, no separate adapter server for the Gate-1 MVP. Reject `/v1/chat/completions` and `/v1/responses` as the primary transport: neither exposes session management, and the HTTP surfaces carry authorization ambiguity (full operator access) with no benefit when the WS control plane already supplies everything the UI needs. A Zero HTTP adapter is kept as a **contingency**, not the plan. This needs DeepSeek coordination (below) and live proof once the gateway window opens; the report ends with the exact spike checklist.

## 2. What the AG-UI side must provide (from UI-00, verified in OpenDots source)

- `RunAgentInput` per run: `threadId`, `runId`, `agentId` (specialist), message history, client `tools` (human-in-the-loop card tools), state.
- `Observable<BaseEvent>` events: `RUN_STARTED` / `RUN_FINISHED` / `RUN_ERROR`, `TEXT_MESSAGE_START/CONTENT/END`, `TOOL_CALL_START/ARGS/END/RESULT`, plus state/custom events (unused by OpenDots either).
- The React SDK expects, against a runtime server: `agent/:agentId/run|connect|suggest`, `agent/:agentId/stop/:threadId`, `threads` CRUD+`subscribe`, `threads/:id/messages|events|state|archive` (the allowlist OpenDots enforces in `runtime-scope.ts`).
- Reference proof that an `AbstractAgent` subclass is the AG-UI boundary: OpenDots `src/server/dot-agent.ts:11,37-64` — `DotAgent extends AbstractAgent`, `run(input): Observable<BaseEvent>`; tools and HITL forwarded as client tools (`dot-agent.ts:301-309`).
- UI-facing patterns already reusable: `Chat.tsx` (`useAgent` + `connectAgent`/`runAgent`/`stopAgent`), `ChatTranscript.tsx`, `ThreadList.tsx` (`useThreads`), error-hook wiring (`CopilotKitCoreErrorCode`).

## 3. What the OpenClaw side must provide (verified docs this session + BE-00)

RPC/control surface (docs/gateway/embedding.md:128-148; protocol/rpc-session-control.md:45-102):

| Need (UI-01 brief) | WS RPC | Evidence |
|---|---|---|
| Thread list | `sessions.list` (+`sessions.subscribe`), `sortBy:"activity"`, `excludeSubagents/filter*` | rpc-session-control.md:49-55 |
| New thread | `sessions.create` (model/category/displayName, `titleSource`, optional initial `chat.send`) | :64,96 |
| Rename | `sessions.patch` (display metadata) | :74 |
| Delete/repair | `sessions.delete`, `sessions.reset` (with `expectedSessionId` guard) | :78 |
| Archive/restore | `sessions.patch { archived }` with fencing + drain semantics | :74 |
| Transcript/history | `chat.history` (display-normalized, 512 KiB pages, `deltaCursor` catch-up, `inFlightRun`), `chat.message.get` for oversized references, `sessions.preview` (cold/archived status) | :79-84,57 |
| Start run | `chat.send` (queue modes steer/followup/collect/interrupt; `expectedLeafEntryId` CAS) | :86-88 |
| Stop run | `chat.abort { sessionKey, runId? }`, `sessions.abort { key }` (covers HTTP runs + queued work; `clearQueued`) — **cancel is documented, both run-scoped and session-scoped** | :73 |
| Live events | `chat`/`agent` families (deltas with authoritative `data.text` + `data.replace`), `session.message`, `session.operation`, `session.tool`, `sessions.changed`, `session.approval`, `session.observer`, `session.narration`, `socket.drain` | rpc-bootstrap-and-events.md:238-357 [BE-00 §4.3] |
| Per-session transcript subscription | `sessions.messages.subscribe/unsubscribe` (+`includeApprovals` replay of pending approvals) | :56 |
| Usage/cost readout | `usage.cost`, `sessions.usage` | embedding.md:137 |
| Config/model status | `config.get` (redacted), `models.authStatus` | embedding.md:138-139 |
| Agent identity of a session row / run acks | `sessions.list` rows carry agent metadata + `hasActiveRun`/`activeRunIds`; send acks report admission separately (`status:"started"`, `runStarted`, optional `messageSeq`) | :49,88-89 |

Handshake/connectivity (embedding.md:91-126): WS first; `connect.challenge` → signed `connect` → `hello-ok`; `UNAVAILABLE` retry with `startup-sidecars` + close `1013`; `shutdown` event with `restartExpectedMs` before close `1012`. Reconnect policy lives in `@openclaw/gateway-protocol/connect-error-details` / `startup-unavailable`.

Upstream-mandated behaviors the bridge must encode (BE-00 §4.3 traps):
1. **Pick one text accumulator per display.** Do not consume both `chat` and `agent` text streams (duplicates output). A display rendering from `chat` only advertises the `chat-only-assistant-text` connect capability (rpc-bootstrap-and-events.md:272-292 [BE-00 §4.3]).
2. **Events are not replayed.** On sequence gap: refresh (`chat.history` tail/catch-up + health), never wait for backfill; `socket.drain` marks resets (docs/gateway/index.md:432-434 [BE-00 §4.3]).
3. **Admission ≠ persistence.** `status:"started"` does not prove a transcript row; reconcile user input by submission identity against accepted custody or stored transcript identity (rpc-session-control.md:88-89). The composer must not mark a message saved on ack alone.

HTTP alternatives, for the record (docs/gateway/openresponses-http-api.md:253-265; openai-http-api.md:72-115 [BE-00 §4.2]):
- `/v1/responses` SSE emits `response.created/in_progress/output_item.added/content_part.added/output_text.delta/output_text.done/content_part.done/output_item.done/completed/incomplete/failed`; **disconnect cancels the run** (only documented HTTP cancel); `previous_response_id` continuity mappings are retained **30 days / newest 5,000** across the Gateway and expire with the underlying session's retention (§47).
- `/v1/chat/completions`: stateless by default; `user` string → derived stable session key; **no documented request-cancel mechanism**; archived session → `409 invalid_request_error` (must unarchive via Control UI).
- Both are **full operator access** when bearer-authenticated (openai-http-api.md:39-53) — same trust weight as the WS path, but each HTTP call must re-state identity while a WS session carries it once.

## 4. Transport comparison (evidence-based; unverified items labeled)

Requirement-first, from the UI-01 brief: identity, start/stop, streaming/recovery, history, tool events — plus what UI-02/INT-00 will need next (computer panel, approvals, usage). R = recommended.

| Requirement | WS RPC (`chat`/`sessions`) | `/v1/chat/completions` | `/v1/responses` (OpenResponses) |
|---|---|---|---|
| Durable thread list + rename/delete/archive | **Yes** — sessions are first-class rows (`sessions.list/patch/delete`) | No session API at all; must pair with WS anyway | No session API; UI thread list impossible |
| Thread persistence model | OpenClaw owns it; Zero stores nothing transcript-like (matches MASTER_PLAN data-ownership rule) | Stateless-by-default trap; session only via derived `user`/header | Relative continuation only; **30-day/5,000 mapping cap** — wrong durability class for a personal assistant; content lives only in input replay |
| Start/steer/stop a run | **Yes** — `chat.send` (+steer/interrupt/queue modes), `chat.abort` run- and session-scoped | Send only; no documented cancel | Send + disconnect-cancel only; no session-scoped control |
| Streaming tokens for UI | **Yes** — `chat` deltas with authoritative replace semantics | SSE OpenAI dialect (standard) | SSE item events (clean deltas; terminal incomplete/failed distinction is nice) |
| Tool activity surface for chat rendering | **Yes** — `session.tool` family; `chat.history` pre-strips raw tool XML/tags | Tool calls appear as standard OpenAI chunks; server-side tools invisible while running | Tool event surface **needs live proof** — documented stream events carry only `output_item.added/done`; no function-call delta event is named [OQ-2 analog] |
| Approvals / HITL | **Yes** — `sessions.messages.subscribe includeApprovals` with explicit replay + `session.approval` lifecycle; reviewer binding per session | None | None |
| Computer-panel events (UI↔CU lanes) | **Yes, same connection** — `session.observer`/desktop relay paths Qoder's contract targets; HTTP path has nothing | None | None |
| Recovery/live resumption | **Yes** — subscribe + `chat.history` deltaCursor catch-up with `inFlightRun` snapshot (design built for exactly this) | Resend full history each turn | `previous_response_id` mapping expiry = silent history loss risk |
| Client bundle | Needs `@openclaw/gateway-client` + `gateway-protocol` (TypeBox validators; TypeBox-free subentries exist for browser CSP) — browser usage is the Control UI's own proven pattern | Plain HTTP | Plain HTTP |
| Authorization posture | One authenticated WS connection with declared client roles/scopes; device identity/pairing flow documented for natives + token/password for control-plane clients (handshake; docs/gateway/clients.md) | Bearer = full operator; owner-sender turns; identity-bearing paths need separate proxy | Same |
| Verdict | **R — primary transport** | Reject (no session mgmt; no cancel; redundant) | Reject (no durable sessions; no session API; tool-event surface unproven) |

Reading: WS RPC satisfies every requirement in the brief **from the control plane itself**; both HTTP routes are chat-only complements that would force us to run WS anyway for sessions, so hybrid = extra surface with no added capability. `/v1/responses`' disconnect-cancel is genuinely useful only for a headless/curl-style client — the WS `chat.abort` covers it with less asymmetry.

## 5. Proposed bridge design (Zero-owned, no upstream edits)

### 5.1 Components

```text
OpenDots-derived React client (CopilotKit components preserved: Chat, ChatTranscript, ThreadList, panels)
        │  CopilotKit React SDK v2 (useAgent / connectAgent / runAgent / stopAgent)
        ▼
ZeroAgent (browser, UI-owned code; extends @copilotkit AbstractAgent like dot-agent.ts does server-side)
        │  AG-UI RunAgentInput → Gateway requests; Gateway events → AG-UI BaseEvent
        ▼
@openclaw/gateway-client (WS protocol v4) ── authenticate as control-plane client (owner token/scopes)
        ▼
OpenClaw Gateway (sessions canonical; transcripts canonical; computer panel + approvals on same socket)
```

- **Zero server adapter: not required for MVP.** Contingency triggers (documented, revisit at UI-02): (a) needing a second AG-UI client (e.g., mobile), (b) secret isolation from the browser becoming a requirement, (c) Intelligence-specific UI code we cannot cleanly replace client-side. The contingency keeps the §5.2 mapping identical — the bridge just moves to a small Hono node process.
- Product naming: UI shows Zero AI branding; no OpenClaw/OpenDots wording in the product (PROJECT_MEMORY). OpenClaw stays visible only as the operator console (Control UI fallback).

### 5.2 Contract mapping (proposal for DeepSeek/senior coordination)

**Identity**

- AG-UI `agentId` (specialist) = OpenClaw agent entry id (`agents.entries.<agentId>`, e.g. `main`/`researcher`/`operator`). The UI's roster comes from agent discovery **[needs live proof: is there an agents-list RPC in `hello-ok.features.methods`? Schemas for `agents.*` in `packages/gateway-protocol` suggest yes — resolve at spike]**.
- AG-UI `threadId` = **OpenClaw `sessionKey` directly**. Rationale: sessions already provide durable list/rename/delete/archive; adding a second UUID layer (OpenDots-style `thread_bindings`) would duplicate identity state OpenClaw already guarantees. Zero keeps **no** transcript or binding database for MVP; UI-local settings only (selected specialist, theme, last opened thread).
- Specialist sessions: each conversation thread is per-specialist (matches OpenDots "separate conversation per Dot" precedent — no multi-agent group chat in MVP; MASTER_PLAN defers it).

**Run lifecycle (per UI turn)**

| AG-UI phase | Bridge action |
|---|---|
| `runAgent({agent, threadId})` → input | Ensure session exists (`sessions.create` with `titleSource` on first turn, else use existing); send `chat.send { key: threadId, agentId }`; record ack's `runId` |
| Stream tokens | Subscribe `sessions.messages.subscribe` (+session event families) for this WebSocket; translate `chat` family deltas → `TEXT_MESSAGE_START/CONTENT/END` (single accumulator; advertise `chat-only-assistant-text`) |
| Assistant/tool lifecycle | `agent` family lifecycle events → `RUN_STARTED/FINISHED`; `session.tool` → `TOOL_CALL_START/ARGS/END/RESULT` |
| User stop (UI stop button) | `copilotkit.stopAgent` → `chat.abort { sessionKey }` (key-only, no `clearQueued` by default) → emit `RUN_ERROR`/`RUN_FINISHED` per terminal event |
| Steer/queue (stretch, not MVP) | `chat.send` `queueMode:"steer"`/`"followup"` maps naturally to OpenDots composer behavior; MVP ships plain sends only |
| Completion reconciliation | On ack: update pending composer entry only on **accepted custody/transcript identity**, not on `status:"started"` (trap #3); on `RUN_FINISHED`, confirm via transcript event |
| Run resumption after reload | `chat.history` with `deltaCursor` → replay through same reducer as live `session.message`; reconcile optional `inFlightRun`; bind live `runIds` for later aborts (reconnect path) |

**History/resume (thread list + transcript)**

- Thread list = `sessions.list { sortBy:"activity", excludeSubagents, excludeCron, excludeSystem }`; decorate rows with agent identity/avatar from config facts; title = session display metadata (`sessions.title.prepare` for fast first-title generation, or the default title-from-message flow) **[needs live proof: which row fields expose specialist identity for the picker]**.
- Transcript tail = `chat.history` (display-normalized; oversized rows come back as references → `chat.message.get` on expand, exactly like Control UI). Cold/archived → `sessions.preview` status placeholder.
- Rename = `sessions.patch`; archive/delete = `sessions.patch { archived }` / `sessions.delete` (UI-02 destructive actions get the `expectedSessionId` guard pattern).

**Errors/reconnect**

- `connect.challenge` → sign → `hello-ok`; treat `UNAVAILABLE(startup-sidecars)`/close `1013` as retryable with `startup-unavailable` constants; `shutdown` (`restartExpectedMs`?) preserves restart-vs-terminal distinction; close `1012` normal reconnect.
- Sequence gap or `socket.drain`: resubscribe → `chat.history` tail → render once (no backfill waiting).
- RPC errors → `RUN_ERROR` via AG-UI error event; surface message verbatim from Gateway error (Control-UI precedent: first-missing-method visible failure, no compat shim — keep upstream posture).

**Out of MVP scope but reserved for next tickets (named so nobody invents them twice)**

- In-chat Approve&run cards (OpenDots `ConnectionActionCard` pattern): OpenClaw's approval system is operator-scoped (`session.approval` + exec-approvals), not per-message tool cards. Open question with DeepSeek (OQ-3 below); MVP relies on OpenClaw permission modes (D-003: `full` in the designated environment) + global stop.
- AG-UI `STATE_*` state-sync: OpenClaw has no per-agent shared-state stream; Zero MVP renders transcripts + tool activity only (OpenDots itself never used Blueprint state either).
- Speech/calls, Spaces/pages editor, scheduled-work UI: later tickets, unaffected by transport choice.

### 5.3 Security posture (to confirm with @manager/senior before code)

- Gateway + UI are **local-only**; gateway must not take public ingress (Ctrl-UI posture and openai-http-api security boundary both say this).
- Browser client needs a Gateway credential. Candidate modes: `token`/`password` (control-plane style, file: token in gateway.auth) or the **device-pairing flow** documented for native/web clients. Storing a bearer token in the browser (localStorage) vs pairing the "Zero UI" as a paired device is an owner-visible security tradeoff — flagged as OQ-4, not silently chosen. Either way the key never enters chat/log/report (PROJECT_MEMORY).
- The UI must never read `~/.openclaw` state (embedding.md:146-148) — RPC only, same rule the backend lane took.

## 6. Unresolved facts (each with resolution path; no guessing)

- **OQ-1 (agents roster):** Does the discovery list / a real RPC method expose configured agent entries with identity metadata for a picker (name/avatar/emoji per `agents.entries.<id>.identity`)? Resolve: read `packages/gateway-protocol` schemas (in sparse checkout) + confirm against live `hello-ok.features.methods` at spike time.
- **OQ-2 (event payload field names):** Exact field names/shapes of `chat`, `agent`, `session.tool`, and `sessions.messages.subscribe` payloads for a faithful reducer. Resolve: schema read (`packages/gateway-protocol/src` — file evidence exists on disk) + one live capture during the BE-01/BE-02 window.
- **OQ-3 (approvals UX):** Mapping OpenClaw approvals (operator/exec-approval model) to in-chat approval cards vs UI-side confirmation dialogs; owner decision coordinates BE-02 policy + UI-02 design. Not resolved today.
- **OQ-4 (browser credential custody):** `token/password` in browser memory/storage vs device pairing for the Zero UI = owner security decision (@manager tag if unresolved after DeepSeek/senior inputs).
- **OQ-5 (specialist multi-agent view):** How `sessions.list` filters/`excludeSubagents` surface researcher/operator child sessions in the roster so the UI does not show sub-agent scratch sessions as user threads. Resolve at spike with real session layout.
- **OQ-6 (run-id correlation):** Whether every `session.tool`/`chat` event carries a run identifier the adapter can use to scope events to the active run to avoid cross-thread bleed on rapid stop/restart. Resolve: protocol schema read + live capture.
- **OQ-7 (DPI/frames for computer panel):** Explicitly only relevant to the desktop component; captured per the panel-state contract Qoder and I agreed (CU-01 probing geometry/holder events; my 04:52 log entry). Not a transport question.

## 7. Proof plan (spike) — written now, executed after BE-01 gateway window opens

Preconditions (owned by BE-01/BE-02 + D-006 resource window): gateway reachable locally, `chatCompletions`/`responses` endpoints **not** needed ([not required for the WS spike]), a browser test entry, no dependency install yet — spike code will import `@openclaw/gateway-client` only once one approved install happens (single heavy job at a time; coordinate with DeepSeek's own install window).

Assertions, pass/fail each:

1. **Handshake:** challenge → connect(signed) → hello-ok under configured auth; record role/scope set used; retryable UNAVAILABLE path observed once by stopping/starting the gateway child. (Orders: embedding.md flow.)
2. **Session lifecycle:** `sessions.create` → appears in `sessions.list` (activity sort) → `sessions.patch` rename → list reflects it; delete last. Capture raw frames (redacted).
3. **First streamed turn:** `chat.send` (plain text, no tools) → capture full event stream; assert one (and only one) text accumulator renders the final message identical to `chat.history` afterward; measure latency from send to first delta. Record `runId` from ack.
4. **Abort:** start a long generation; `chat.abort { sessionKey }` mid-stream; assert terminal event arrives within bounded time, transcript shows partial-or-empty assistant text consistent with the event stream (no double-render).
5. **Resume:** reconnect (kill socket); resubscribe; assert `chat.history` deltaCursor catch-up returns current state incl. optional `inFlightRun`; no duplicate replay vs. what was already rendered (test trap #1 concretely).
6. **Sequence-gap injection:** drop/drain events (propose: pause socket or background the tab) to exercise the upstream refresh contract; assert refresh path works without a corrupted transcript (trap #2).
7. **Tool events:** run a configured basic-tools turn; capture `session.tool` payloads (this is the OQ-6 check on run-id scoping). No HITL mapping in this spike.
8. **Admission-vs-persistence:** force a write-admission error (best-effort: unusual queue state per rpc-session-control.md:88-89); assert UI does not show the user message as persisted on ack alone. If not forceable with normal auth, mark evidence "asserted from contract, not exercised."
9. **Frames for the desktop panel (CU lane link):** desktop.stream/viewer control events captured per the five-point list in my CU-01 answer (complete-able in CU-01's rig, evidenceJson shared; transport-truth for INT-00).
10. **Auth custody (OQ-4):** exercise the chosen mode (token-in-browser or paired device) once, so UI-02's login UX is designed on proven mechanics.

Evidence artifacts (into `reports/ui/`): raw event transcripts (secrets redacted), mapping table filled with observed payload names, pass/fail matrix, screenshots of the test UI only (no private data). Everything else stays report-level.

## 8. Coordination requests

1. **DeepSeek Harness** — ANSWERED 23 Oct 04:16 (BE‑02 §5/§6 contract; see §10 for the reconciliation). Remaining for DeepSeek: only the BE‑01 live capture that settles OQ‑2/OQ‑2b payload names and the WS session‑argument parameter.
2. **Qoder** — none blocking; your CU-01 rig result.json shapes the desktop-panel half (my five-point request stands).
3. **Senior/@manager** — only if OQ-3/OQ-4 stay unresolved after DeepSeek weighs in. No decision request from me today beyond D-007's existing direction.

## 9. Limitations of this report

- Design-only; nothing was executed, no code written, no network call made. All "needs live proof" labels above survive into the spike checklist.
- Upstream docs read today: embedding.md (full), protocol/rpc-methods.md (index), protocol/rpc-session-control.md:45-102, openresponses-http-api.md (full), plus previously-read openai-http-api.md/protocol.md (from UI-00). The TypeBox schemas in `packages/gateway-protocol` were sighted but not yet parsed for exact payload field names — deliberately left to OQ-2 with a concrete verification step rather than guessed.
- The transport recommendation was a proposal; DeepSeek responded (see §10) and the WS-first decision now stands as recorded there. Senior review remains the close-out step.

## 10. Reconciliation with DeepSeek's BE-02 contract (23 Oct, log 04:16)

DeepSeek posted a transport-neutral contract (§5 session mapping + §6 event needs in `reports/backend/mvp-backend.md`) and asked whether it covers UI-01 and the transport decision. Verdict: **yes, it covers the full UI-01 brief, and it converges with §5.2 above; no contradictions found.** What was adopted:

| Contract item | Resolution |
|---|---|
| Identity: 1 thread = 1 session; session key `zero-thread-<uuid>` (avoid reserved prefixes `subagent:`, `cron:`, `acp:`) | Adopted. On the WS path the user-facing thread's session key is `zero-thread-<uuid>`; the header variant applies only to the HTTP compat surface. This replaces the looser "sessionKey directly" phrasing in §5.2. |
| User-facing agent id | BE-02 roster: `zero` is the default thread agent; `researcher`/`operator` are selectable specialists (roster discovery stays OQ-1). |
| Event vocabulary: `run.accepted`, `text.delta`, `text.replace`, `tool.start`/`tool.result`, `run.final (ok\|error\|aborted + errorDetail)`, `run.abort`, `session.changed`, `stream.gap`, `shutdown` | Adopted as the **logical** layer; wire names remain the BE-00 §4.3 families (`chat`/`agent`/`session.tool`/`sessions.changed`/`socket.drain`/…). Exact payload field names stay OQ-2. New sub-question **OQ-2b**: the exact `sessions.create`/session-argument parameter for a client-chosen `zero-thread-<uuid>` key on the WS path (schema read + live capture). |
| Three hard rules: one text projection per display; reconnect = refetch; **approvals opt-in**; child agents are nested runs | Rules 1–2 were already encoded (§3 and §5.2). **Approvals opt-in adopted for MVP**: the UI does not subscribe `session.approval` in Gate-1 (sharpens OQ-3 below). **Nested runs adopted**: sub-agent sessions render as nested run chips with completion, never as sidebar threads; the roster excludes them by default — this closes the *direction* of OQ-5 (exact row filters verified at spike). |
| Transport recommendation (their §6 close): WS RPC for send AND events | ACCEPTED — matches §4/§5.1 of this report. No Zero HTTP adapter; `/v1/chat/completions` stays enabled backend-side purely as a compat/debug surface; UI code will not depend on it. |

**OQ-3 sharpened (approvals MVP posture):** with approvals explicitly opt-in and surfaced through the operator side, the Gate-1 MVP renders approval state as status text only (no in-chat approval cards). The owner/senior can re-open this at UI-02.

**Open items this reconciliation leaves:** OQ-1 (roster discovery), OQ-2/OQ-2b (wire payload names + WS session-key parameter), OQ-4 (browser credential custody), OQ-6 (run-id correlation), OQ-7 (unchanged). §11 adds the takeover call shape requested by the computer lane.

## 11. Take/release call shape (canonical, for the `zero-computer-hold` plugin contract)

One authenticated call, registered by the computer-lane plugin via `registerGatewayMethod` and invoked by the Zero UI over the same Gateway WS as chat (no second credential, no HTTP route in MVP; `registerHttpRoute` is the documented fallback if the live check below fails).

**Method:** `zero.computer.control`
**Params:** `{ action: "take" | "release" | "status", controlLeaseId?: string, reason?: string }`
**Result (snapshot):** `{ held: boolean, owned?: boolean, controlLeaseId?: string, resumeSnapshotRequired?: boolean, since?: number, reason?: string, stats?: object }`

Semantics:

1. `take` with no live human lease → `{ held: true, owned: true, controlLeaseId }` — the plugin mints the opaque lease id server-side; the browser never mints one.
2. `take` while another live human lease holds → refuses with stable code `computer-hold:already-held` — never queued (DeepSeek's rule: refuse, don't pause the run).
3. `take` while holder is `human` but the prior lease's socket died (reconnect case) → succeeds with a fresh lease; leases bind to the owning WS connection, and the settle rule below covers close-detection lag.
4. `release { controlLeaseId }` → `{ held: false, resumeSnapshotRequired: true }`; a stale/wrong id refuses with `computer-hold:lease-invalid` (no silent ok). The UI voids pre-handover `frameId`s on this flag — matches upstream cloud behavior.
5. Hold changes stay visible in the run: while a human holds, the plugin's tool policy denies agent input actions with reason `computer-hold:human-control`, which surfaces through `session.tool` refusals in the transcript.
6. The `reason` string is recorded by the plugin for budget/audit rows (DeepSeek §7.4's ask).

UI-side behavior (my lane, UI-02): the panel mirrors holder state only from method results and observed denies — never optimistic local state; on reconnect it shows "control: unknown" with Take over enabled (fail-safe re-take per rule 3); there are no pending/queued visual states.

Canon additions ruled by the computer lane (Qoder, 23 Oct — contracts/takeover-hold-contract.md §3/§5; they bind this §11 too):

7. **`status` is the read that does not take.** The plugin supports it (backend/plugin/index.js:262-264); the UI calls it on (re)connect so "control: unknown" is not a guess.
8. **Lease id spelling is `controlLeaseId` only** — request and response, no dual read (plugin ≥ 0.1.1 has no `leaseId`; its selftest asserts the old name returns `computer-hold:lease-invalid`).
9. **Refusal codes are the closed set** `computer-hold:already-held | :lease-invalid | :human-control | :stale-frame` and `zero-policy:bad-request | :action-blocked | :budget | :unknown-action` — the tool `action` field is a closed enum (no `type`/`command`/`operation` fallbacks).
10. **Freshness:** after a release, agent input stays refused until a fresh desktop capture (`screenshot` or `wait`) returns; `get_window_state` clears staleness only with `includeScreenshot: true`.
11. **Hold scope is the computer target**, not the whole Gateway; the snapshot reports `scope:"global"` for the hold plugin and the resolved target in audit rows.
12. **The UI shows two guarantees with different surfaces:** a lease hold (pills above) is NOT the same state as an emergency stop (`gateway.nodes.commands.deny` — command-level refusal, no hold lease). They must never render as one pill (§5.3 of the contract).
13. `since`/`stats`/`reason` are plugin extras: `since` = lease start, `reason` = caller's recorded reason, `stats` = budget/audit numbers. The UI may ignore them (but shows `reason` on refusals).

**[needs live proof]** (one check added to the §7 checklist): plugin-registered gateway methods appear in `hello-ok` discovery and accept the UI client's scopes. Fallback if it fails: `registerHttpRoute` with the session-key header.

## Senior live proof addendum — 2026-10-23

The pre-build-only status above is superseded for the following facts, verified
against the installed `openclaw@2026.10.6` runtime:

- `sessions.create` accepts the client-chosen `key` field, plus `agentId`,
  `displayName`, and `titleSource`. The generated Zero alias remains
  `zero-thread-<uuid>`; chat events carry the canonical
  `agent:<agentId>:<alias>` form.
- `chat.send` requires `idempotencyKey`; the old `client` field is rejected.
- Real model output is delivered through Gateway WS. ZeroAgent now matches the
  exact alias/canonical key pair, flattens text content blocks, and always emits
  its terminal AG-UI event. A live response verified
  `ZERO_AGUI_BRIDGE_OK`.
- HTTP `/v1/chat/completions` A2 returned `401 Invalid JWT serialization` with
  shared-token auth; the Gateway HTTP compatibility endpoint is disabled. The
  UI remains WS-first per D-008.

Remaining: verify full CopilotKit HTTP/SSE handler behavior, browser/UI rendering,
history restoration and tool/activity card mapping. Computer takeover method
discovery and live refusal proof remain pending the designated isolated desktop.
