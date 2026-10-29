# UI-02 — Zero MVP UI source: OpenDots reuse over a device-paired Gateway runtime
**Owner:** OpenCode (frontend/integration) · **Date:** 23 Oct 2026, ~04:50–05:4x Asia/Calcutta
**Method:** source preparation only. **No installs, no builds, no app launches, no live Gateway calls** (build gate; see `build-readiness.md`). Upstream checkouts untouched; every reuse is recorded in `E:\zero\app\REUSE-LEDGER.md` + `E:\zero\app\NOTICE`.

---

## 1. What was built (`E:\zero\app\`, D-010)

```
app/
  package.json            deps pinned to OpenDots' exact ranges + @openclaw/gateway-*@2026.10.6 (exact)
  vite.config.ts          Vite + react plugin; /api + /live proxied to the runtime (127.0.0.1)
  index.html, .env.example, .gitignore, README, NOTICE, REUSE-LEDGER
  tsconfig.json / tsconfig.server.json
  src/shared/zero-types.ts          wire-contract types + static specialist set
  src/server/
    config.ts                       env config; loopback-only guard; no secrets from files
    pairing.ts / pairing-keys.ts    Ed25519 identity + runtime-custodied device token (OQ-4 default)
    pairing-store.ts                identity/token files under ZERO_STATE_DIR (0600, git-ignored)
    gateway-link.ts                 THE Gateway connection owner: pairing host-deps, connect
                                    (operator role, operator.read/write/approvals, TOOL_EVENTS +
                                    CHAT_ONLY_ASSISTANT_TEXT caps, protocol 4/4), chat stream pump
                                    (GatewayChatStreamProjection), sessions re-subscribe per
                                    (re)connect, gap→refetch, chat.send/abort, chat.history,
                                    sessions.list/create/subscribe, zero.computer.control
    thread-registry.ts             zero-thread-<uuid> ⇄ session bindings, chat.history→AG-UI
                                    message projection, stop-all per the §8 layers
    zero-agent.ts                   AbstractAgent subclass: wire contract → AG-UI events (§5.2)
    zero-runtime.ts                 Hono app: guarded SDK surface + /api/zero/* routes
    runtime-scope.ts                route allowlist (OpenDots-derived; Intelligence routes denied)
    activity-feed.ts                session.tool → panel activity ring buffer
    live-relay.ts                   /live/desktop localhost RFB relay (disabled until verified)
    index.ts                        bootstrap: serve + statics + graceful shutdown
  src/client/                       OpenDots-derived shell (see REUSE-LEDGER.md): App (Zero shell),
    Chat, ChatTranscript, ThreadList/use-zero-threads, ComputerPanel, ComputerToolCard,
    ResultPane, live-view (noVNC), Zerologo, api, theme, chat-composer, zero.css
```

Transport: the browser talks **only to the Zero runtime** on localhost
(`/api/copilotkit` AG-UI for the SDK; `/api/zero/*` for sessions/threads/
computer/activity; `/live/desktop` RFB bytes). One process holds the Gateway
connection; the browser holds **no Gateway credential** — the runtime is the
paired device (OQ-4 custody resolved in favor of device pairing).

## 2. Conformance to the accepted decisions

- **D-007 (selective reuse, Zero adapter replaces Intelligence):** every
  copied file is inventoried (REUSE-LEDGER); Intelligence is fully absent
  from the client surface (thread list via zero routes; no `useThreads`),
  replaced by GatewayLink + ThreadRegistry + ZeroAgent.
- **D-008 (WS RPC primary; one thread per session; single text stream;
  refetch recovery; nested activity):**
  - send AND events ride one Gateway WS (`chat.send` + `chat` stream +
    subscription coordinator-ready `sessions.subscribe` after hello-ok);
  - thread binding = `zero-thread-<uuid>` (client-chosen key attempt first —
    OQ-2b live check; server-derived fallback recorded);
  - one text projection per run: ZeroAgent projects merged chat snapshots
    (`GatewayChatStreamProjection`) into TEXT_MESSAGE_* once (no double
    dispatch) — `chat-only-assistant-text` cap advertised;
  - reconnect = refetch: projection + roster re-established per hello-ok,
    `chat-gap` surfaces → consumers refetch `chat.history` + `health`; the
    app never replays events;
  - sub-agent outputs surface as activity/artifacts only.
- **D-009 (takeover via plugin + tool-policy hold; refuse, never queue):**
  Control tab calls `zero.computer.control` (take/release/status) through the
  runtime; refusals render text and disable nothing silently; STOP in the
  composer interrupts the run (`chat.abort` → `sessions.abort` fallback) and
  STOP ALL sweeps every bound session. The typed params/results signature is
  Qoder's confirmation ([needs live proof §11]) before any live take.
- **OQ-4 (device pairing default):** `pairing.ts` + `gateway-link.ts` host
  deps implement identity → signed connect → PAIRING_REQUIRED surfaced as an
  operator banner with the working command form
  (`.\node_modules\.bin\openclaw.cmd devices approve <requestId>` — bare
  `openclaw` is not on PATH; Qoder's run-day finding) → store the
  `hello-ok` device token at runtime only. No token ever enters the browser,
  chat, or repository (perm 0600, .gitignore'd, never logged). The build
  wave additionally wired `OPENCLAW_GATEWAY_TOKEN` (name-only in
  `.env.example`) as a first-pairing exchange path — if the owner supplies
  it, the banner path may not appear.

## 3. What was deliberately NOT built (MVP cut)

- Spaces/Pages/Tasks/Voice/Slack/memories; TipTap editor; editor.css.
- Approvals subscription in the browser (opt-in per bridge-spike §9; the
  connection can add `includeApprovals` later without UI changes).
- Browser-side Files/Terminal panels (OpenDots' own local computer service
  is not Zero's stack — the Gateway nodes own those runs).
- Binary artifact rendering (`artifacts.download` client flow) — deferred
  until the schema lands live; ResultPane keeps a visible empty state.
- Specialist roster discovery (OQ-1): static `zero/researcher/operator` ids
  ship now; runtime agents are registered as the same ids.

## 4. Open questions — updated state

| OQ | Topic | State after UI-02 prep |
|---|---|---|
| OQ-1 | Agent roster discovery | static set; discovery call isolated to /api/zero/status (`rosterDiscovered: false`) — live window item |
| OQ-2 | chat stream/message + tool event payloads | mapping written defensively in ZeroAgent + ActivityFeed; payload-faithful typing requires capture [needs live proof] |
| OQ-2b | `sessions.create` session-argument param for `zero-thread-<uuid>` | both spellings attempted + fallback recorded; schema check at the BE-01 window |
| OQ-3 | Approvals UX posture | unsubscribed in MVP browser (accepted); no code blocking opt-in |
| OQ-4 | Browser credential custody | device pairing, runtime-custodied (implemented) |
| OQ-5 | Roster row filters | not touched by UI MVP paths (sessions.list params isolated in gateway-link) |
| OQ-6 | session.tool payload casing | generous multi-key projection; real casing recorded live |
| OQ-7 | Desktop relay handshake | relay disabled by default (`ZERO_LIVE_VIEW=1`); command shape [needs live proof]. Qoder upstream |
| **new** | CopilotRuntime viability without Intelligence | guarded construction + visible 503 fallback; **the first thing to typecheck/run at the window** [needs live proof] |
| **new** | CopilotKit v2 SDK↔runtime wire shapes for run/stop without Intelligence | written only against the OpenDots-verified surface (useAgent/runAgent/stopAgent + agent/:id/run|stop routes); connect/suggest routes denied — the check that decides whether the Chat layer needs plan-B re-wiring is 10 minutes of typecheck + one run |

## 5. STOP semantics (accepted §8 layers)

1. Composer STOP: SDK run cancel (`stopAgent`) **+** gateway run interrupt
   via `/api/zero/interrupt` → `chat.abort`, falling back to
   `sessions.abort` (delivery is guaranteed to be attempted; failures are
   visible).
2. Topbar STOP ALL: `/api/zero/stop-all` → interrupt every bound session+
   per-session result text (refusals named, never queued).
3. Run timeout guard (45 s default) interrupts + finishes with a visible
   error naming the next step.
4. Backend deny/interrupt config remains backend-owned (DeepSeek BE-01);
   the UI only calls the plugin method and reports refusals.

## 6. Known limitations of this prep

- TypeScript correctness against the real packages is unproven until
  install+typecheck: the @openclaw/gateway-client host-dep exact signatures,
  the @copilotkit hook param types (`useAgent` third-building naming), and
  AG-UI event field spellings are written from pinned source reads and
  marked for compile-time verification (build-readiness §3).
- `zero.css` adds layout fallbacks for Zero-specific classes; pixel-level
  polish is a post-compile pass.
- `sessions.subscribe` merge side (sessions.changed handling) is kept as a
  signal-only path in MVP (list refetches on signal) — Control-UI-grade
  merging arrives with INT-00/work when validated against real payloads.

## 7. Live-verified exercise facts (2026-10-23 ~07:5x IST, OpenCode)

The §6 items about unproven packages are RESOLVED: install, typecheck, build,
and the full live exercise all passed (see `reports/ui/build-readiness.md` §7
for the evidence table). Live-verified contract facts, replacing earlier
[needs live proof] markers:

- Run transport: `POST /api/copilotkit/agent/<runtimeAgentId>/run` with the
  full AG-UI `RunAgentInput` (`protocolVersion:"1.0"`); stop:
  `POST /api/copilotkit/agent/<id>/stop/<threadId>`. Server streams
  `text/event-stream` (`EventEncoder` binary events; keepAlive supported).
- Run lifecycle: chat status frames (preparing_workspace/preparing_context/
  starting_model) → mapped delta (no content, harmless empty start); real
  delta frames carry BOTH `deltaText` (full-so-far) and a merged `message`;
  `replace:true` resets the snapshot; `final` carries the full message;
  `aborted` carries `stopReason:"rpc"` for user STOP.
- The InMemory runner keys thread bookkeeping by `threadId`; a run whose
  observable never completes keeps the thread "running" (next run on the
  same thread errors) — run the full lifecycle or rely on the runtime's own
  finalize path; our ZeroAgent completes every run (timeout, error, abort,
  or final) so UI recovery never depends on a torn-down subscriber.
- `useAgent` re-renders on `onMessagesChanged`; the agent's `messages` array
  is mutated in place, so consumers must read it per render (Chat.tsx fix of
  2026-10-23). `pendingUser` clears immediately after `addMessage` — one
  user row only.
- History restore: page reload + thread select restores `chat.history` rows
  through the App-owned fetch into the transcript (verified live after the
  aborted-run turn).
