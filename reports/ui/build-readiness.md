# UI-02 build-readiness handoff — Zero app (OpenCode lane)

**Owner:** OpenCode · **Date:** 23 Oct 2026 · **Gate position:** Window A
(install) and most of Window B (typecheck-fix wave) EXECUTED under the
owner's chat-recorded build authorization (senior entry "Owner
authorization received in chat to proceed with builds without asking for
another GO", AGENT_CHAT ~05:58). Execution was performed by the coordinator
actor flagged in AGENT_CHAT 06:12/06:16 (one-line attribution requested);
this lane audited every observed change, holds its own src edits until the
wave quiesces, and will then run the formal verification pass.

**Executed so far (measured):** `pnpm install` via Corepack pnpm 12.15.0
(node 24.22.1): app node_modules 0.73 GB / 88,160 files; local
`@openclaw/gateway-client` + `@openclaw/gateway-protocol` 2026.10.6 and
`@copilotkit/runtime` 1.79.1 resolved from npm. First `tsc --noEmit` pass
FAILED with 4 errors (app/typecheck.log) — all four are §3.2 verify-first
items; fixes are landing file-by-file in src/ (last observed src edit
06:17:49, zero-agent.ts). dist/client rebuilt 06:11:51; dist/server still
05:50:03 → server-half outcome pending. Zero key/token material anywhere in
the tree (audit re-run after the wave edits; identity and tokens are
generated at runtime under `ZERO_STATE_DIR`).

---

## 1. Owner inputs required before any gated action

| # | Input | What it unblocks | Notes |
|---|---|---|---|
| 1 | **GO** for the app install/build window | everything below | single heavy job at a time; sequence after DeepSeek's `openclaw@2026.10.6` backend install (BE-02 §8.3) completes — do not overlap |
| 2 | **GATEWAY_URL** (ws://… / wss://…) typed into `app/.env` at the window, by the owner | runtime connect + pairing | owner-only secret handling; never sent in chat |
| 3 | **OPENCLAW_GATEWAY_TOKEN** value (owner-only secret; first pairing only) | the client token-exchange path the wave added (`.env.example` added 06:02) | name appears in files only, value never in chat/files; if supplied, first pairing uses the exchange path and the banner path below may not appear |
| 4 | Pairing approval command — **not the bare doc form**: `openclaw` is NOT on PATH on this machine (Qoder run-day finding) | working form from `E:\zero\backend`: `.\node_modules\.bin\openclaw.cmd devices approve <requestId>` (or `corepack.cmd pnpm exec openclaw devices approve <requestId>`) | src banner + docs updated to the working form |
| 5 | Designated Windows environment (the one desktop target) | Computer panel live view/control | needed only past §5 step 3 |
| 6 | (Optional) `ZERO_LIVE_VIEW=1` once §7 items are verified | RFB relay | default OFF |

## 2. Window A — dependency install (estimates before GO)

Environment: repo-local `E:\zero\app`; Node ≥ 24 currently present (24.22.1).
Package manager: follow DeepSeek's Corepack/pnpm 12.15.0 activation to keep
one shared toolchain; npm fallback also works:

```
# A1 (est 1–2 min, ~50 MB disk)
cd E:\zero\app
corepack enable          # only if pnpm not already active (owner GO covers this)
corepack prepare pnpm@12.15.0 --activate   # reuse backend's pinned manager

# A2 (est 3–8 min, ~700 MB–1.2 GB node_modules incl. @openclaw/gateway-client
#     exact 2026.10.6 pins; registry-only, no optional extras)
pnpm install --frozen-lockfile=false

# Fallback (if registry/pnpm resolution blocks): npm install
```

Expected effects: `node_modules/` + lockfile created in `E:\zero\app` only.
No services started; `app/.gitignore` already excludes artifacts.

## 3. Window B — typecheck + targeted fixes (est 10–20 min, reviewable)

```
# B1 (est 1–3 min)
pnpm typecheck        # tsc --noEmit
```

**Verify-first list (this is the chat-flow decisive check):**
1. `@openclaw/gateway-client` host-dep signatures in `gateway-link.ts` /
   `pairing.ts` — patch call sites only if names differ (low risk: written
   against package source read at `client.ts:92-241`, `client-device-auth.ts`).
1a. Connect identity fields (`clientName` registry value, `mode: 'app'`) —
   if the closed registries reject `zero-app`/`app`, patch to the nearest
   allowed id and record it (single spot: `gateway-link.ts buildClient`).
2. `@copilotkit/react-core/v2` hook surface in `Chat.tsx` (`useAgent`,
   `runAgent`, `stopAgent`) — confirm option names; patch is local.
3. AG-UI event fields in `zero-agent.ts` (RUN_STARTED/TEXT_MESSAGE_*) —
   field spelling fix only.
4. **CopilotRuntime without Intelligence** (`zero-runtime.ts`) — if the SDK
   requires an Intelligence arg or its agents-only mode misbehaves, options:
   (a) adjust constructor args, or (b) plan-B = drop the SDK runtime layer
   and serve the AG-UI run route from ZeroAgent directly (the §5.2 mapping
   is unchanged; documented fallback, ~1 file).
5. `ws` types in `live-relay.ts` (relay stays disabled default).

**Wave status (observed 05:48–06:17 during the coordinator actor's run):**
items 1/1a/2/5 have fixes IN FILES (audited: `onRunFailed` hook in
Chat.tsx; EventFrame via `@openclaw/gateway-protocol/frame-guards` +
registries via `client-info` — both subpaths verified present in the
installed tarball export maps; `CopilotSseRuntime` from
`@copilotkit/runtime/v2` in zero-runtime.ts; ambient `novnc.d.ts`). Item 3
is in progress (zero-agent.ts edited 06:17:49). OPEN at dependency level:
@ag-ui/core still carries BOTH zod@3.25.76 and zod@4.6.7 variants and rxjs
7.8.1 + 7.8.2 coexist in `.pnpm` — the TS2416 root cause resolves only when
tsc sees one instantiation. `app/typecheck.log` still records only the
PRE-fix pass (4 errors, exit 2); this lane re-runs the authoritative
check on quiescence.

## 4. Window C — build (est 2–5 min)

```
pnpm build    # vite build (client, ~30–60 s) && tsc -p tsconfig.server.json
```

Expected: `dist/client/` + `dist/server/`. (~120 MB disk.)

## 5. Window D — first run + pairing (est 10–15 min; live Gateway!)

Prereq: backend lane reports a reachable Gateway (BE-01/BE-02) — coordinate.
```
# D1 owner writes app/.env with GATEWAY_URL (and, for the exchange path,
#    OPENCLAW_GATEWAY_TOKEN) — owner-only secrets, typed by the owner
pnpm dev          # runtime on 127.0.0.1:4317 + Vite on 127.0.0.1:5173
# D2 browser http://127.0.0.1:5173
```
Expected behavior:
1. If pairing is required: red banner with the WORKING command form —
   `.\node_modules\.bin\openclaw.cmd devices approve <requestId>` run from
   `E:\zero\backend` (bare `openclaw …` is NOT on PATH on this machine;
   Qoder's run-day finding, AGENT_CHAT 06:15). With OPENCLAW_GATEWAY_TOKEN
   set, first pairing uses the client token-exchange path instead (wave
   design comment), so the banner may never appear. Owner-run either way,
   never through the log/chat. Then Retry → connection pill `connected`.
2. "New session" → binding created (check `/api/zero/threads`), first
   message streams as a single text run; STOP interrupts; Activity tab
   shows session.tool entries; STOP ALL reports per-session results.
3. Record actuals: install/build durations, RAM (~300–500 MiB runtime),
   versions — as BE-02's §8.3 requires.

## 6. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| CopilotRuntime agents-only mode needs adaptations | medium | guarded construction + plan-B (§3.4); UI components unaffected |
| SDK hook option names differ from pinned OpenDots usage | low | typecheck patch list (§3.2) |
| gateway wire params (chat.send response, OQ-2b key param) differ | medium | responses treated opaque; binding fallback; BE-01 capture closes |
| device pairing flow mismatch (signature encoding) | low | hex sentinel choice marked; challenge will prove or reject visibly |
| port 4317/5173 conflicts | low | configurable via env; loopback only |
| overlap with DeepSeek's install job | medium if missequenced | **GO ordering rule: backend window first, app second**; both recorded |

## 7. Deferred to later windows (not part of first GO)

Desktop RFB relay verification (OQ-7), `artifacts.download` client flow,
approvals opt-in UI, roster discovery (OQ-1), Control-UI-grade session
merge, Windows CUA taxonomy labels (Qoder input).

## Senior live-build addendum — 2026-10-23

The earlier pre-build/gate statements above are historical and superseded by
the completed build window. The owner authorized implementation/build/runtime
verification without another GO.

- `pnpm install` completed; `pnpm typecheck` and `pnpm build` pass. The build
  reports the existing large-chunk warning (largest JS chunk about 1.1 MB).
- Local app: `http://127.0.0.1:5173/` returns 200; Hono runtime status returns
  `copilotReady:true`, Gateway `connected`, and all three configured agents.
- Created `zero-thread-*` through Zero's own thread route and fetched its empty
  history. Fixed the unsupported `sessions.create.sessionKey` field, Gateway's
  canonical `agent:<agentId>:<alias>` event key mapping, array-text extraction,
  and a terminal-event suppression bug in `ZeroAgent`.
- Verified the real `ZeroAgent` adapter through a live model response; AG-UI
  terminal stream contained `ZERO_AGUI_BRIDGE_OK`.
- The Gateway device token store remains empty because the running local client
  currently authenticates with the shared token; connection itself is healthy.
  Continue pairing/token persistence review before calling device pairing
  complete.
- Computer relay remains disabled and unverified; no physical desktop actions
  were made. The designated isolated Zero Windows target is still required.

Next: OpenCode continues INT-00/UI-02 in `app/`: exercise CopilotKit's actual
HTTP/SSE handler and UI run/stop/history rendering, then reconcile event/history
and Activity mapping. Keep the Gateway token server-side and read it from the
environment only.

## §7 Closed exercise (2026-10-23, ~07:5x Asia/Calcutta, OpenCode) — CopilotKit
HTTP/SSE run/stop/history/activity validated live in `app/`

Result: every exercise gate below was driven against the live app + Gateway,
with the actor stack relaunch and one stream turn completed before each check.
Evidence is the accessibility-tree snapshot at each state plus the server-side
SDK behavior evidence; DOM snapshots + this section replace a screenshot (the
harness screenshot API needs a visible desktop window that is not available in
this session).

### §7.1 Verified behaviors (all live)

| Check | Result | Evidence |
|---|---|---|
| Run dispatch + streaming render | PASS — reply text (`PROBE_STREAM_2`, post-cleanup rerun `SMOKE_OK`) rendered as the ONE assistant row after ~23–26 s model latency; transcript ended exact: 2 user rows + 1 assistant row, no duplicates | browser evaluate counts; DOM snapshot with `[article] YOU/ZERO` rows |
| Run handler visibility | POST `/api/copilotkit/agent/zero/run` observed with the full `RunAgentInput` (threadId, runId, `protocolVersion:"1.0"`, messages carrying the added user turn, state/tools/context/forwardedProps) | host browser + live fetch trace |
| STOP mid-run | PASS — client STOP → `POST /api/copilotkit/agent/zero/stop/<threadId>`; ~0.3 s later the Gateway emitted chat `state:"aborted", stopReason:"rpc"`; ZeroAgent projected `TEXT_MESSAGE_END` + normal finish; UI returned to `Ready` with NO false error chip | debug trace timestamps 01:42:12.968→.983 |
| History restoration | PASS — full page reload + thread re-select restored the restored user turn from the history path; the aborted (text-less) assistant turn was correctly absent | DOM snapshot after reload |
| User-row dedupe | PASS — user row renders exactly once (pendingUser cleared immediately after `addMessage`; live `agent.messages` is the only row source) | DOM counts |
| Activity tab | PASS — graceful empty state `No tool activity yet.` for text-only turns (no `session.tool` frames exist in this exercise; OQ-6 names the live mapping remains open) | DOM snapshot |
| Computer panel read-only | PASS — status pill `none`/`unheld`, `Return control` disabled, `Take control` deliberately NOT clicked (no designated isolated target; everyday profile is forbidden) | DOM snapshot |
| STOP ALL | PASS — per-session rows with `ok:true` for both bound sessions + layersNote; idle-run aborting verified additionally via direct `POST /api/zero/stop-all` | API probe output |

### §7.2 Bugs found and fixed in this exercise (all typechecked + re-verified live)

1. **Client transcript frozen at first render (UI kept `Running…` with an empty
   transcript)** — `Chat.tsx` memoized `agent.messages` keyed on the agent
   instance, but the SDK mutates the array in place, so the memo never
   recomputed. Fixed by reading `agent.messages` fresh every render (the v2
   `useAgent` contract re-renders on `onMessagesChanged`, verified against the
   installed `react-core` — retained in `headless.mjs` L479–514).
2. earlier in this window (already recorded): cross-origin 403 on the new-session
   POST (loopback dev-origin allowlist in `zero-runtime.ts`), `runAgent`
   method-detachment error (call `copilotkit.runAgent({ agent })` directly on
   the instance), runtime-scope bare-path denial for the v2 transport.
3. **Stack recovery**: the whole dev stack (vite 5173 + runtime 4317 + Gateway
   18789) died at ~01:36Z (single `pnpm dev` = `concurrently -k`, one crash takes
   all three). Relaunched from documented commands with the Gateway device
   identity REUSED (`E:\zero\.zero-data\adapter-debug`, identity approved earlier;
   reconnected straight to `paired:true` — no new owner approval needed).
   Reusable launchers, secret-free, committing User-scope env into child process
   env at runtime only: `E:\zero\.zero-data\start-gateway.ps1`,
   `start-runtime.ps1`, `start-vite.ps1` (values never printed/logged/persisted).

### §7.3 Instrumentation note

Temporary `debugDump` instrumentation (`zero-agent.ts`, `gateway-link.ts`,
`zero-runtime.ts` → `app/.zero-debug.log`) was removed after the root causes
were confirmed live; `app/.zero-debug.log` deleted. Rerun gate after cleanup:
`npx tsc --noEmit` exit 0; `npx vite build` exit 0 (759 ms); server
`tsc -p tsconfig.server.json` exit 0; `dist/` 16.5 MB; post-cleanup smoke turn
rendered `SMOKE_OK` with transcript final state 2 rows (1 user, 1 ZERO).
