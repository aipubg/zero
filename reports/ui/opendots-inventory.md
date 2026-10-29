# UI-00 — OpenDots / CopilotKit / AG-UI Inventory + OpenClaw Control UI Comparison

**Owner:** OpenCode (frontend/integration) · **Ticket:** UI-00 · **Date:** 23 Oct 2026, 03:45–04:35 Asia/Calcutta
**Method:** Documentation and source inspection only. **No installs, no builds, no upstream edits, no heavy jobs.** Live behavior in this report is documentation- or source-derived and is explicitly labeled; nothing here is a live verification result.
**Commit pins** take from `reports/source-inventory.md` (authoritative checkout snapshot):

| Repo | Path | Pinned commit | License |
|---|---|---|---|
| OpenDots | `upstream/opendots` | `8091324942b86789ed0da7facbee855145d933b0` | MIT (Atai Barkai) |
| OpenClaw | `upstream/openclaw` | `013240515205573248c27ab6b8eec7303f0da1a8` | MIT (OpenClaw Foundation) + `THIRD_PARTY_NOTICES.md` |

Limitation: `git` is not on this shell's PATH, so the pins were taken from the senior-maintained source inventory, not re-verified with `git log`. Read-only file access was confirmed and all quoted paths exist under those checkouts.

---

## 1. What OpenDots is (snapshot)

A self-hosted "personal-agent template" (`package.json` name `opendots`, v0.1.0, Node ≥24, npm): React 19 + Vite client, Hono server, `node:sqlite` metadata store, TanStack AI model streaming, CopilotKit React SDK + Runtime, and **CopilotKit Intelligence for durable conversation threads**. 82 source files under `src/` (`client` 33, `server` 34, `shared` 7, `client/editor` 6 + 2 CSS) — a small, readable codebase, favorable for selective reuse.

## 2. Dependency inventory and Intelligence coupling

From `upstream/opendots/package.json` (warnings: several versions are ahead of what we know; treat as "as pinned in snapshot"):

| Dependency (pinned range) | Role | Intelligence-coupled? |
|---|---|---|
| `@copilotkit/react-core` ^1.75.0 (`/v2` subpath) | UI provider, hooks (`useAgent`, `useCopilotKit`, `useHumanInTheLoop`, `useRenderTool`, `useThreads`), `CopilotChatToolCallsView` | **Yes** — conversation/thread state flows through the runtime; `useThreads` lists Intelligence threads |
| `@copilotkit/runtime` ^1.75.0 (`/v2` subpath) | Server: `CopilotRuntime`, `CopilotKitIntelligence`, `createCopilotHonoHandler`, `BuiltInAgent` | **Yes** — `CopilotKitIntelligence` is constructed with an Intelligence key; it persists all messages/tool calls/run events |
| `@copilotkit/core` ^1.75.0 | Error codes (`CopilotKitCoreErrorCode`) used in chat error handling | Yes (SDK-internal) |
| `@copilotkit/channels` ^0.11.0 | Slack channel integration | Yes (Intelligence-backed channels) |
| `@ag-ui/core`, `@ag-ui/client` ^0.0.59 | AG-UI event types, `AbstractAgent`, `RunAgentInput`, `BaseEvent`, `EventType` | **No** — protocol layer only. `DotAgent extends AbstractAgent` (server); `ChatTranscript.tsx` consumes AG-UI message shapes |
| `@tanstack/ai`, `@tanstack/ai-openai` | Model loop (`chat`, `maxIterations`) + `openaiCompatibleText` adapter (OpenAI-compatible chat-completions, configurable `baseURL`) | No — **already points at an OpenAI-compatible endpoint** via `OPENAI_BASE_URL` foreshadows the Zero gateway |
| `@modelcontextprotocol/sdk` | MCP connections (per-Dot tools) | No |
| `@composio/core` | "Connected apps" | No (optional service, requires `COMPOSIO_API_KEY`) |
| `hono`, `@hono/node-server` | HTTP server / copilot handler mount | No |
| TipTap suite + `lucide-react` + `react-markdown`/`remark-gfm` | Rich page editor, icons, markdown | No |
| `rxjs` | AG-UI event observables | No |
| `playwright` (server `browser` script) | Optional isolated read-only public-page browser service (separate container) | No |

Key structural fact: **the UI's conversation store IS Intelligence.** `src/server/platform.ts` wraps every conversation action in `requireReady()` which throws "Conversations require CopilotKit Intelligence." unless the Intelligence key + model are configured. Local SQLite deliberately does **not** store messages (README "Data and privacy": "OpenDots has no standalone SQLite conversation store. SQLite stores pages, workspace metadata, and thread bindings separately.").

## 3. Where Intelligence is used (exact map)

| File | Usage |
|---|---|
| `src/server/platform.ts` | `CopilotKitIntelligence({apiKey, apiUrl, wsUrl, getLearningContainerId})`; `CopilotRuntime({intelligence, agents: dots → DotAgent, generateThreadNames})`; handler mounted at base path `/api/copilotkit`; `createThread` / `getThreadMessages` for conversation lifecycle and history |
| `src/server/platform-config.ts` | Env: `CPK_INTELLIGENCE_API_KEY`/`INTELLIGENCE_API_KEY`, `INTELLIGENCE_API_URL`, `INTELLIGENCE_GATEWAY_WS_URL`/`INTELLIGENCE_WS_URL`; setup status reports `intelligence`, `model`, `browser`, `voice`, `composio`, `slack` |
| `src/server/runtime-scope.ts` | Allowlists SDK runtime routes: `info`, `threads`, `threads/subscribe`, `agent/:agentId/run|connect|suggest`, `agent/:agentId/stop/:threadId`, `threads/:threadId/messages|events|state|archive`, `threads/:threadId` PATCH/DELETE. **This is the concrete surface the React SDK expects — the exact contract list a Zero replacement must implement** |
| `src/server/dot-agent.ts` | `DotAgent extends AbstractAgent` (AG-UI), returns `Observable<BaseEvent>`; requires `intelligenceKey + apiKey + model` before any run; wraps `BuiltInAgent` (TanStack AI) + tools (computer, pages, connections, Composio, Parallel, learned skills) |
| `src/server/workspace.ts` | `thread_bindings` SQLite table (id, dotId, ownerId, title, createdAt, learningContainerId) — **binding only, no messages** |
| `src/client/App.tsx` | Mounts `CopilotKitProvider` |
| `src/client/Chat.tsx` | `useAgent({agentId: chat-<threadId>, runtimeAgentId: dotId, threadId})`; `connectAgent`/`runAgent`/`stopAgent`; tool renderers |
| `src/client/ThreadList.tsx` | `useThreads({agentId, includeArchived, limit: 20})` — lists remote threads and matches against local bindings |

Optional Intelligence features beyond threads: Automatic Learning (`learning.ts`, per-Dot learning containers, requires Intelligence + license) and Slack channel activation (Intelligence-backed). Both optional; Slack also needs external reachability.

Local Intelligence evaluation (docs/SETUP.md): Docker Desktop with ≥4 CPUs, 12 GiB RAM, 40 GiB storage, macOS-focused, CopilotKit account sign-in, 30-day renewable evaluation license, "not a production installation," User Memory and Product Analytics not included. **For `E:\zero` (resource-constrained Windows box) this is a poor fit; treat hosted-Intelligence as out of scope for a private assistant and the local preview as a large resource claim requiring senior coordination.**

What works **without** Intelligence (per `app.ts` routes + README): Spaces/pages editing (local SQLite), memory CRUD, task scheduling UI surface, settings, workspace metadata. What breaks: creating conversations, chat runs, thread list, page-per-conversation chat, calls, Slack, background work in conversations.

## 4. Thread history lifecycle today

1. **Create:** client → server `POST /conversations` (workspace routes) → `intelligence.createThread({threadId: uuid, userId: ownerId, agentId: dotId, name})` → then SQLite `thread_bindings` row. Thread names in-chat are generated by the runtime (`generateThreadNames: true`).
2. **List:** `useThreads` fetches from `/api/copilotkit/threads` (Intelligence), decorated with local binding titles.
3. **Messages:** the React SDK GETs `/api/copkitkit/threads/:id/messages`; there is no server-side proxy cache — messages live in Intelligence and are re-fetched on load.
4. **Rename/archive/delete:** `PATCH`/`DELETE`/`archive` routes on the same base path (allowlisted in runtime-scope).
5. **Binding:** local row keeps id ↔ dot ↔ title after upstream data is gone, but cannot render history without Intelligence.

Consequence for Zero (per D-004 and MASTER_PLAN §3): replacing Intelligence means implementing exactly the `runtime-scope.ts` route list plus a message-history source. The natural Zero source is **OpenClaw sessions** (canonical), accessed via the Gateway. No duplicate transcript store; the local store keeps only binding/metadata (same pattern OpenDots already uses).

## 5. Reusable UI components (client)

CopilotKit imports are confined to 3 files (`App.tsx`, `Chat.tsx`, `ThreadList.tsx`); one more file (`ChatTranscript.tsx`) consumes AG-UI message types. Everything else is plain React + CSS — high reuse value. Zero product naming applies (no "Dot/Dots/OpenBot" wording in user-visible copy).

| Component | CopilotKit/AG-UI dependent | Zero MVP relevance | Reuse verdict |
|---|---|---|---|
| `Chat.tsx` | Yes (hooks) | Core chat streaming, stop button, thinking indicator, error/reconnect | **Pattern to keep**; rewrite behind a Zero adapter (UI-01) |
| `ChatTranscript.tsx` | AG-UI message types only | Message rendering incl. tool calls | Reusable with typing adjustment |
| `ThreadList.tsx` | `useThreads` (Intelligence) | Session list/resume | Pattern to keep; back with OpenClaw session list |
| `chat-composer.ts` (composer key handling) | No | Chat input UX | Reusable |
| `ComputerPanel.tsx` (24 KB) | No | Compute live view: browser control, files, terminal, activity, **takeover** | High value for computer live view (coordinate semantics with Qoder CU-01/CU-02) |
| `ComputerToolCard.tsx` | No (rendered via `useRenderTool`) | Inline computer tool activity card (screenshots, progress) | Reusable |
| `ResultPane.tsx` | No | Side pane tabs (brief/computer), markdown, sources list | Reusable shell |
| `ComputerToolCard`/`PageReviewCard`/`ConnectionActionCard` + `useHumanInTheLoop` wiring | Card components are plain React (rendered through CopilotKit hook) | Human-in-the-loop approve/decline cards | Keep pattern; keep CopilotKit hook if we keep CopilotKit; else small custom event wiring |
| `SpaceNav`, `SpaceLibrary`, `SpaceWorkspace`, `PageDocument`, `PageOutline`, `editor/*` (TipTap) | No | Spaces/pages document workspace | **Out of MVP scope** (MASTER_PLAN "later"), but intact and reusable later |
| `TaskPresentation`, `TaskActions`, `poll-notice.ts` | No | Background task rows/actions/cancel | Reusable for scheduled work |
| `WorkspaceDialog.tsx`, `ConnectionsSection`, `api.ts`, `theme.ts`, `watchSystemTheme` | No | Settings dialogs, per-Dot connections, API client, theming (light/dark) | Reusable |
| `Mascot.tsx`, `style.css` (75 KB design system), `editor.css` | No | Avatar + full visual design | Reusable foundation; rebrand copy/colors for Zero |
| `useVoice.ts`, `CallView.tsx`, `voice-receipt` | No (runtime uses Intelligence thread) | Text-and-call continuous conversation | **Later** (voice not in MVP) |
| `setup-telemetry.ts` (client+server) | CopilotKit telemetry | Install/usage tracking | Optional; default **off** for a private product (`DO_NOT_TRACK=1` is supported upstream) |

Server patterns worth copying for the adapter (not UI): `runtime-scope.ts` route allowlist, `dot-agent.ts` AG-UI agent shape, `workspace.ts` binding tables, `runner.ts` background-run leases.

## 6. AG-UI boundary observations (verified in source)

- The UI speaks AG-UI only through the CopilotKit SDK: typed events (`EventType`, `BaseEvent`), `RunAgentInput`, tool forwarding, and human-in-the-loop tool pausing. `DotAgent.run()` returns `Observable<BaseEvent>` — i.e., the server-side "agent" is already an AG-UI event source; it is *not* CopilotKit Intelligence itself. Intelligence is the *persistence* engine beside it.
- Route allowlist shows the full SDK↔runtime contract (see §3) — a list of runtime routes in the OpenDots style is implementable by Zero without Intelligence.
- **Correctness note:** the OpenClaw Gateway is NOT an AG-UI endpoint (confirmed below); changing a URL cannot bridge these stacks. An adapter is required either way.

## 7. OpenClaw Control UI — comparison and "is it enough?"

Structure (`upstream/openclaw/ui`, `openclaw-control-ui`): a large **Solid 2** SPA, ~6,749 files, with pages for areas like: `chat`, `new-session`, `sessions`, `agents`, `approvals`, `workboard`, `worktrees`, `terminal`, `devices`, `channels`, `model-providers`, `expansion packs` (skills, plugins, hooks, cron, secrets, logs, usage, frameworks). Speaks the **Gateway WebSocket protocol v4** through `@openclaw/gateway-client` + `@openclaw/gateway-protocol` (TypeBox schemas, frame guards, client-info, version envelopes).

Operator-facing facts observed that matter for Zero:

- Full operator control plane: session list, chat streaming, agent config, approvals, device pairing, terminal, CRUD on sessions (archive etc.). Everything the Zero backend work (DeepSeek Harness) will rely on is visible here.
- **Gateway coupling:** "UI/Gateway ship as one install/version. Never older-Gateway method fallbacks; handshake rejects version skew." Bundled into the gateway build (`ui/AGENTS.md`, build-chunking manifest). Any reuse is "same-version, same-host" — it is not a library to lift components out of.
- i18n/generated assets and governance make wholesale reuse heavier (locale catalogs, lint discipline, Solid skill requirements inside the repo).
- Protocol comparison: OpenClaw WS protocol = RPC + event families + approvals + presence; AG-UI = agent-run event stream (`RUN_STARTED`, `TEXT_MESSAGE_*`, `TOOL_CALL_*`, …). Different shapes, different session semantics (OpenClaw sessions vs AG-UI threads). Bridging = translation layer (UI-01), as suspected.

**Answer to the brief's question:** for MVP **operations/administration** (and as an emergency fallback if the bridge stalls) the Control UI is likely sufficient "as-is" because it already exercises every Gateway capability we plan to use. For the **Zero product UX** it is not the target: React-vs-Solid mismatch, operator-first (not single-assistant) information architecture, and version coupling make component transplant impractical. Recommendation for D-004 evidence: keep Control UI as the operator console; build Zero's UI from OpenDots components + a small adapter. Do **not** build Zero's assistant UI from Control UI code.

## 8. Bridge surface candidates (feeds UI-01 design, not a decision)

OpenClaw has three possible integration surfaces, all running full operator-level access when bearer-authenticated (security: local-only, loopback/private ingress):

1. **Gateway WebSocket protocol v4** (`docs/gateway/protocol.md`, `packages/gateway-protocol`) — full control plane: sessions list/CRUD, chat streaming, approvals events, presence. Best for **session management + events**, not directly usable as AG-UI.
2. **OpenAI-compatible HTTP** (`docs/gateway/openai-http-api.md`, disabled by default) — `POST /v1/chat/completions`, `GET /v1/models`, plus `/v1/embeddings`. Runs a full Gateway agent run. `model` is an **agent target** (`openclaw/<agentId>`), `user`/`x-openclaw-session-key` route sessions, streaming supported. Stateless per request unless session fields are used.
3. **OpenResponses HTTP** (`docs/gateway/openresponses-http-api.md`, disabled by default) — SSE item events (`response.*`), `previous_response_id` continuation mapping (30-day/5,000 store), `user`/`x-openclaw-session-key` session routing. SSE shape maps more naturally to streaming UI than chat-completions REST.

Smallest plausible bridge (proposal only — needs senior review and coordination with DeepSeek Harness before design freeze):

- **Side A:** Opendots-derived React client (keep CopilotKit where useful) expecting the `runtime-scope.ts` route surface on a Zero-hosted `/api/*`.
- **Zero adapter:** implements that surface; maps AG-UI thread IDs ↔ OpenClaw session keys; translates Gateway chat/responses streaming into AG-UI events (and tool events when usable); kills runs on stop/cancel.
- **Session truth:** OpenClaw canonical; adapter holds binding tables only (thread_id ↔ session_key ↔ agent_id), honoring MASTER_PLAN data-ownership rules.
- **Unverified assumptions to flag:** (a) does `/v1/responses` streaming include tool-call events suitable for UI rendering, or do tool results arrive only in final content? (b) cancel semantics via HTTP chat/responses (no request cancel doc seen); (c) whether "stop" mid-stream is needed via the WS RPC surface instead.

## 9. Gaps, risks, and honest limits of this report

- Every statement above is from source/docs of the pinned snapshot. No runtime was started; no HTTP request was made; sizes and behavior claims are documentation-derived.
- Exact behavioral compatibility between the OpenDots React SDK v2 (`^1.75.0`) and a hand-rolled replacement of some endpoints needs a running SDK — the next ticket (UI-01 spike) should test the minimal route set (list/create/rename/delete/messages/subscribe + run).
- License/trademark hygiene before copying any file: MIT text + copyright lines required; user-visible "Dot/Dots" copy must be rebranded; CopilotKit telemetry defaults off.
- OpenClaw app/AGENTS.md rules (read, not edited): Solid code standards, generated-asset policies, and Gateway-coupling constraints apply and would burden Control UI reuse — one more reason for the chosen direction.
- OpenMausBot is intentionally out of scope for this ticket (UI-00 covers OpenDots/CopilotKit/AG-UI/OpenClaw); reuse check for its computer panel patterns can piggyback later when Qoder's CU-01/CU-02 contracts are known.

## 10. Proposed next-ticket scope (UI-01) — for senior review

1. Define and document the adapter contract precisely: route-by-route (`threads` CRUD, `agent/:id/run`, events, `stop`) with AG-UI ↔ Gateway/OpenResponses event mapping table.
2. Pick the upstream stream: chat-completions vs OpenResponses (SSE) — recommend proving `/v1/responses` first; fall back to WS-protocol `chat` if SSE tool events are inadequate. Coordinate with DeepSeek Harness so /v1 HTTP endpoints get enabled in the Zero OpenClaw config exactly once.
3. Store binding table only (thread↔session↔agent) in the Zero-side store; sessions/history stay canonical in OpenClaw.
4. Spike priority if time is limited: (a) list+create+rename+delete sessions, (b) a streaming chat turn through the adapter with agency status + stop, (c) leave tool translation for the later spike.
5. No dependency installs in UI-01; use only what a running OpenClaw gateway + minimal Hono adapter on Zero-owned path needs, and only after the senior developer approves enabling upstream HTTP endpoints.

**Next dependency:** senior review of this report + DeepSeek Harness BE-00/BE-01 Gateway inventory (needed before the adapter picks its transport), plus UI-00/task-board status update by ChatGPT to `ACCEPTED`.
