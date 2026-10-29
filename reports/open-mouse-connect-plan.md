# Open Mouse Connect Plan

**Purpose:** integrate eligible OpenMausBot backend capabilities into Zero by connecting them to Zero's existing Gateway, native Control UI, approval system, sessions, and tools. This document is the durable implementation roadmap and the single-shot developer handoff.

**Product invariants:** Zero's existing native UI stays the only UI; `/chat/zero` remains the only user-facing conversation; OpenClaw Gateway remains the only runtime/session/history source; no OpenMausBot UI, Electron shell, chat account, transcript database, parallel harness, or duplicate approval/desktop transport is introduced. Preserve the current model/provider catalog, defaults, bindings, credentials, and session overrides unless the owner separately authorizes a named change.

**Status:** Phase 0 source/license reconciliation, read-only baselines, the Phase 1 contract map
(§10), and the next-phase candidate decision (§11) are complete. Offline source/test slices are implemented for native CLI discovery/readiness and
for native MCP config + cached-capability projection in the existing About surface. A backend MCP
probe was investigated and **blocked** by the trusted-official plugin dispatch gate; no probe method
was shipped. Nothing is live; no restart/reload or external action was performed. This is not a claim
that full parity is achieved or can be completed without external prerequisites.

## 1. Executive assessment

OpenMausBot is a complete local-first product, not a backend library. Its `server/` contains a large harness, its own bot/thread/group model, storage, driver registry, tool and approval lifecycle, computer runtimes, connectors, phone sidecar, and many HTTP routes. Its top-level package also includes a web UI, Electron app, companion app, Cloudflare services, and an enterprise carve-out. Copying its server or wiring its HTTP API wholesale into Zero would create a second product runtime and violate the one-chat/one-Gateway requirements.

The integration strategy is therefore **capability-by-capability backend adaptation**:

1. Reuse a capability already provided by OpenClaw through its supported Gateway API/plugin/tool surface.
2. Where a genuine gap remains, implement a small Zero-owned Gateway plugin adapter that delegates execution to an existing host capability and preserves host approvals, cancellation, streaming, and session identity.
3. Do not recreate an OpenMausBot server route merely because it exists. Map its user-visible outcome to the existing Zero chat/tool/session APIs.
4. Mark unsupported cloud, mobile, enterprise, or account-dependent features as gated; never simulate them with success-shaped stubs.

Literal parity with every OpenMausBot feature is incompatible with two hard requirements: OpenMausBot's multi-bot/per-bot chat model conflicts with one Zero chat identity, and its hosted/team/Electron/mobile capabilities require services or clients outside the current Zero deployment. The achievable target is **eligible OSS backend capability parity inside the single Zero conversation**, with explicit exclusions and prerequisites.

## 2. Source and workspace findings

### 2.1 OpenMausBot snapshot identity gate — reconciled 2026-10-26

The requested directory is `upstream/OpenMausBot-main`. Its `package.json` identifies `openmausbot` version `0.1.127`, Node `>=24`, and pnpm `10.33.0`. The directory has **no `.git` metadata**, so an upstream commit cannot be recovered from this checkout. Phase 0 therefore recorded a deterministic tree identity instead: 5,111 files / 150,508,407 bytes, tree SHA-256 `f0e8df3757811e4254b51589b020ed6a5b23a9acacbb495919b414f6c3c25b62` (sorted relative path + per-file SHA-256), with `LICENSE`, `NOTICE`, and `LICENSING.md` read. The existing [source inventory](source-inventory.md) describes a different path, `upstream/openmausbot`, pinned at `d393b7a…`, version `0.1.123`; it is a **different snapshot** and is not evidence for this tree.

The tree digest is a reproducible content identity, not a claim that the directory came from a specific upstream commit. No code was copied, and no exhaustive feature claim is based on the older checkout. See §9.1 for the full gate record.

### 2.2 Architecture and licensing

- The OpenMausBot root package includes `server/`, `shared/`, `src/`, `electron/`, `companion/`, `apps/`, `cloudflare/`, `skills/`, and `enterprise/`; its scripts build/test/package several separate products and runtimes.
- `server/index.ts` composes the harness and a large route table. The `server/routes/` APIs are backed by OpenMausBot-owned stores, coordinator, provider registry, and runtime services; they are not drop-in Gateway methods.
- `server/contracts.ts` defines its own turn/driver SPI, including bot/thread ids, approvals, model/effort selection, transcript replay, integrations, and process/session recovery.
- Core outside `enterprise/` declares Apache-2.0. `LICENSING.md` expressly puts `enterprise/` under a separate source-available license, with production license requirements. OpenMausBot/MausBot names and mascot are trademarks; Apache-2.0 does not grant those rights. Third-party dependencies retain their own notices.
- The prompt below forbids copying `enterprise/`, UI/Electron/companion code, mascots, brand assets, and large server modules. Any source-level reuse must first pass exact provenance, file-level license, attribution, dependency, and security review. Prefer a clean-room adapter using documented behavior.

### 2.3 Zero integration points found in source

- `app/zero-control-ui/` is a native Control UI plugin. Its browser code is the presentation layer; its `runtime-core.mjs` registers Gateway methods using the plugin SDK and durable plugin-scoped stores.
- `backend/plugin/index.js` owns the existing `zero.computer.control` hold/action-budget method. `backend/plugin/provider-manager/index.mjs` owns provider discovery/test/capabilities. These are existing Zero backend seams, not permission to add competing APIs.
- `zero.integrations.cli.status` reports Claude Code/Codex PATH discovery, bounded version strings, and native CLI-backend dispatch readiness. It does **not** run either CLI, stream a turn, cancel a process, or map CLI approvals. The supported execution path is the native OpenClaw CLI backend; binding it to Zero requires an owner-approved model/runtime change.
- `zero.integrations.connectors.status` reports configured native MCP server names. The existing About surface separately reads the Gateway's **cached** `tools.effective` catalog (read-only host request) and shows sanitized tool names; cached catalog does not prove live reachability. A plugin-side `openclaw mcp probe` was investigated and blocked by the trusted-official dispatch gate, so no probe method is shipped. Native `/settings/mcp` remains the setup surface.
- The existing parity report is refreshed against the exact `OpenMausBot-main` snapshot and current Zero source. The current authoritative config is zero-only; historical statements about Researcher/Operator workers are marked superseded. The implementation preserves the owner's **single Zero user-facing chat** requirement and does not recreate worker identities, chats, or delegation edges.

## 3. Target architecture

```text
User
  -> existing native Zero chat at /chat/zero
     -> OpenClaw Gateway turn/session/history (single source of truth)
        -> existing native tools, approvals, MCP, browser, automation, memory, skills
        -> Zero-owned backend adapter only where a verified capability gap exists
           -> host-managed CLI/process/tool API or configured native MCP server
           -> result/error/progress returned into the same Zero turn
```

Rules:

- The browser never launches a process, receives a provider/connector secret, or calls OpenMausBot's private HTTP server.
- Do not add a second backend server, port, websocket/SSE protocol, transcript store, bot/thread/group database, model registry, approval-card renderer, or chat route.
- All state is keyed to the existing Zero conversation/session or stored as narrowly scoped non-secret plugin metadata. Gateway sessions remain authoritative for messages/history.
- Tool work must use supported Gateway/host methods and their existing authorization. New mutating operations need input schemas, actor/scope checks, timeouts, cancellation, idempotency where appropriate, bounded outputs, sanitized errors, and audit behavior consistent with the host.
- Reuse existing native screens. Add no OpenMausBot UI or duplicate Plugins, Skills, MCP, Models, Desktop, or About screen.

## 4. Feature parity matrix

| OpenMausBot capability family | Zero status / integration decision | Completion evidence / gate |
|---|---|---|
| Chat turns, streaming, transcript history, cancellation | Reuse native Gateway chat/session lifecycle. Do not port `server/chat-*`, thread store, or renderer. | Same `/chat/zero` session receives user turn, progress/tool events, final result, errors, stop/cancel. No second transcript source. |
| Bot roster, per-bot persona/model, groups/rooms/team chats | Product-excluded where it creates user-facing bot/chat accounts. User has one Zero conversation. Backend delegation may be used only if it already exists and is owner-approved; do not recreate Researcher/Operator. | One user-facing chat identity/routes; no roster/switcher/chat duplication. Inspect config and honor latest owner decision. |
| Claude/Codex/Grok/custom CLI drivers | Current Zero code provides Claude/Codex discovery only. First look for a supported Gateway CLI/runtime/exec adapter. Implement only missing adapter behavior; do not launch from browser or run without host approval. Grok/custom engines require explicit host contract and credentials decisions. | Installed/authenticated CLI, bounded process lifecycle, streamed output, cancel/stop, resume semantics, cwd restrictions, approval/refusal, sanitized errors; mock tests then owner-approved local smoke. |
| Shell/file/question approvals | Reuse native host approvals and execution permissions. Do not port OpenMausBot approval mode, auto-approve, or chat widgets as a second system. | Verify each action maps to native allow/deny/answer and is denied by default where host policy requires. |
| Connected apps: Gmail/Slack/GitHub/Notion/Linear and Composio | Current connector card is status-only. Prefer native Gateway MCP servers and existing approval policy. Composio is a separate external broker/account dependency; integrate only if a supported Zero/Gateway MCP-compatible contract is approved. | Per-app configured status contains no URLs/tokens; read and write actions use native MCP + approval; test mocks; live test requires account/connector authorization. |
| Custom MCP servers / MCP Apps | Reuse native `/settings/mcp`, Gateway MCP configuration, plugin catalog, and host tool routing. Do not create a second MCP registry. | Existing native server config and tool results visible in Zero chat; transport/auth errors handled without leaking headers. |
| Computer observe/input/takeover | Zero already has the hold/control method and native Desktop surface; OpenMausBot's viewer/relay is not a second transport to port. Current evidence says hold lifecycle is partly proven, while live viewer/vision prerequisites remain. | Re-audit `computer/` and host viewer; prove hold, fresh frame, stop/takeover/recovery in the designated scope. Do not add RFB/noVNC transport. |
| Browser | Reuse native Gateway browser plugin and its policies. Do not port OpenMausBot browser runtime or persistent per-bot browser profiles. | Existing browser tools remain available through the Zero turn, with host policy/approval and no duplicate browser UI. |
| Skills, plugins, memory, attachments/files | Reuse native Gateway surfaces and storage. Do not duplicate catalogs, install flows, or memory engines. | Native routes/services remain canonical; attachment scope and access policy verified. |
| Routines, schedules, webhooks, proactive triggers | Reuse native Gateway automation/cron/events where supported. Do not port OpenMausBot routine scheduler or webhook route table. | Trigger runs through canonical Zero session/host automation, with ownership, dedupe, cancellation, and audit semantics. External webhook exposure requires separate security review. |
| Voice/TTS/live calling | Reuse installed native host voice capability. OpenMausBot-specific TTS providers or call orchestration are not automatically compatible. | Identify exact host voice APIs and optional provider dependencies; no credentials/API calls without approved setup. |
| Phone pairing/device apps/mobile companion | Existing Gateway device-pairing is not equivalent to OpenMausBot's phone sidecar/app-job protocol. No companion UI is allowed by this scope. | Gated unless the host provides the needed phone app/tool API. No copied phone server or new chat client. |
| Channels | Reuse native Gateway channel plugins. Do not create OpenMausBot channel adapters in parallel. | Channel account setup and messaging use existing Gateway channel configuration and security model. |
| Data tools / DuckDB / HighLevel CRM / dweb | Not assumed available in Zero. Reuse a supported native tool/plugin if present; otherwise each requires a separate architecture, dependency, data-scope, and owner decision. | Do not silently add native binaries, database, external CRM, or network service. Explicit per-capability acceptance. |
| Local VM, Linux bot-box, cloud desktop, Boat/VPS | Not portable as-is to the current Windows local Gateway. Existing Zero computer/host capabilities are preferred. | Platform-specific prerequisites and threat model; cloud/hypervisor accounts and installs require separate owner approval. |
| Cloud control plane, team sharing, org library/escalations | Excluded: hosted/team/multi-user product and separate service/auth boundary. Enterprise code is not available for reuse. | No implementation under this single-user local Zero plan. Reopen only with a new product decision and legal review. |
| Electron desktop shell, mobile app, OpenMausBot UI | Excluded explicitly. Zero native Control UI remains the only product UI. | Regression audit proves no duplicate shell, chat, routes, or navigation. |
| Updates, analytics/telemetry, branding, community feed | Preserve Zero policy: no upstream branding/marketing/update calls or hidden telemetry. A future Zero update service is a distinct project. | Static source audit and network-deny route tests; retain required legal notices and third-party attribution. |

## 5. “Open Mouse Connect Plan” roadmap

### Phase 0 — Freeze scope and establish trustworthy baselines

1. Record user-facing invariant: one Zero chat at `/chat/zero`; one Gateway; no OpenMausBot UI; no additional chat accounts.
2. Reconcile source provenance. Obtain the real Git checkout/commit or owner-provided archive digest for `OpenMausBot-main`; record `package.json` version, `LICENSE`, `NOTICE`, `LICENSING.md`, and the exact paths inspected. Resolve the mismatch against `reports/source-inventory.md` (`0.1.123`/`d393b7a…` vs current `0.1.127` no-Git tree).
3. Refresh a file-level OSS feature inventory for the verified snapshot. Exclude `enterprise/`, UI/Electron/companion assets, generated outputs, dependencies, trademarks, and mascot.
4. Capture read-only Zero baselines: active plugin manifests and methods; native routes; host capabilities; model/provider projection hash; session/chat invariants; computer hold state if available. Never print credential values.
5. Reconcile contradictory project docs about worker definitions. Do not change the model/provider state and do not create specialist agents/chat interfaces.

**Gate 0 acceptance:** exact source identity and licenses documented; current Zero state is evidence-backed; feature inventory has explicit `reuse / adapt / gated / excluded` labels. No product changes.

### Phase 1 — Build a behavior/API mapping, not a route port

For each eligible OpenMausBot API/driver family, document its input/output/events/error/cancel/auth contract and map it to an existing Zero host API. Cover at least: turn start/stream/stop, tool invocation, approval/question decisions, MCP actions, browser, computer, attachments, memory, automation, voice, CLI process lifecycle, and integration setup. Where an equivalent host method is unknown, mark it `unresolved` rather than inventing one.

Create a contract table containing: capability ID, OpenMausBot source paths/API, Gateway method/tool, input schema, authorization scope, secret boundary, timeout/cancellation semantics, error mapping, state owner, offline test, live prerequisite, and disposition.

**Gate 1 acceptance:** every in-scope row has a supported host seam or a named blocker; no proposed second server/API/chat/history system.

### Phase 2 — Formalize the Zero adapter boundary

1. Keep browser/UI code under `app/zero-control-ui/`; it only presents status and invokes supported host requests.
2. Put backend-only adapters in existing `backend/plugin/` ownership after checking its manifest, SDK compatibility, method naming, and security review. Extend an existing plugin when practical; do not add an always-on server.
3. Keep shared request/response schemas small, versioned, strict, and secret-free. Define stable status/error enums and bounded payload sizes.
4. Bind all operations to the calling Zero session/actor and host authorization context. Never accept caller-supplied account, workspace, role, or path identity without host verification.
5. Add lifecycle controls: timeout, cancellation/stop, idempotency, concurrency cap, process cleanup, and Gateway restart behavior. Secrets remain in Gateway's protected secret/MCP configuration; never persist them in plugin keyed stores, browser storage, argv, logs, or reports.

**Gate 2 acceptance:** SDK/API compatibility checked against installed Gateway; handlers fail closed; mocks cover schema/auth/error/timeouts/cancel; no model/config changes.

### Phase 3 — Close CLI capability gap, if host seam permits

1. Determine whether the installed Gateway's existing CLI backend can invoke Claude Code/Codex within the Zero turn. If yes, configure/document that existing path instead of writing another runner.
2. If not, implement a narrow Gateway-side adapter only through supported plugin APIs. It must use the host execution-approval mechanism, never spawn from the browser.
3. Map OpenMausBot driver behavior to the adapter: availability, authenticated/unavailable state without secret disclosure, one-turn input, incremental output, stop/cancel, process exit, timeout, resume/session behavior, model selection only if the owner explicitly permits it.
4. Keep current model/provider routes untouched; CLI adapters are opt-in and do not replace the configured provider.

**Gate 3 acceptance:** deterministic mocked lifecycle tests; manual local test only after user authorizes the specific installed CLI/account and safe command scope; every process terminates on stop/timeout/Gateway shutdown.

### Phase 4 — Connect apps through native MCP

1. Treat current connector status as discovery-only, not app integration.
2. Confirm whether native MCP server setup supports each desired app. Use the existing `/settings/mcp` and host tool execution path.
3. If a Composio-compatible adapter is needed, specify broker/auth/storage/tenant/approval contracts first. Do not add Cloudflare broker dependencies or expose OAuth/token material as part of an unreviewed “parity” pass.
4. Map read/write actions to native approval behavior, including denial, user answer, timeout, retries, and sanitized app errors.

**Gate 4 acceptance:** mock tests prove correct MCP routing and approval; live connection/action requires the owner's explicit account/operation authorization.

### Phase 5 — Reuse computer, browser, and automation capabilities

1. Audit existing Zero computer plugin, hold manager, native Desktop, browser plugin, and automation APIs; adapt only verified gaps.
2. Preserve global hold/stop, fresh-frame gate, ownership, and release-on-exit behavior. Do not add OpenMausBot RFB/noVNC, cloud desktop, local VM, or Bot Box alongside host control.
3. Translate routines/triggers into native automation only where the Gateway offers an equivalent. Preserve actor identity, scope, deduplication, safe defaults, and audit.
4. Treat vision-model capability, RFB viewer, cloud/VM, and external trigger prerequisites as explicit blockers; never change models/providers implicitly.

**Gate 5 acceptance:** unit/integration evidence for host seam; live desktop/action only in the authorized target and only after prerequisites. No second control path.

### Phase 6 — Classify optional and incompatible capabilities

For channels, voice, mobile/phone, data/DB, HighLevel, dweb, local VM, cloud services, team sharing, enterprise and desktop packaging:

1. Confirm whether the current Gateway already provides the capability.
2. If yes, document how to configure it on the existing native surface.
3. If not, mark it blocked/excluded with exact external dependency/platform/security/legal decision. Do not create placeholders that imply it works.

**Gate 6 acceptance:** each feature has a truthful state and no duplicate service or UI.

### Phase 7 — Migration, reliability, and security hardening

1. Do not import OpenMausBot bot/thread/group records into a parallel store. If any user data migration is later needed, design a separate owner-approved, reversible migration to Gateway-native entities, with preview, backup, idempotency, and rollback.
2. Validate path/cwd boundaries, process environment filtering, secret redaction, output size limits, rate/concurrency caps, timeouts, cancellation, retry semantics, and crash cleanup.
3. Test malformed Gateway replies, unsupported methods, plugin unloaded/restarted, partial writes, stale session, permission denied, user cancel, downstream timeout, and sanitized logs.
4. Add dependency/license inventory for any new package; use only required dependencies and retain notices/SBOM. No enterprise dependencies or OpenMausBot package wholesale.

**Gate 7 acceptance:** security review, migration/no-migration decision recorded, offline suites pass, no sensitive values in artifacts/logs.

### Phase 8 — End-to-end rollout and honest parity sign-off

1. Build/test the exact local source and record hashes.
2. Publish only through the supported Zero plugin publication path; restart/reload only after a concrete bundle and approval scope are ready.
3. Re-read health, plugin registration, served digest, and model/provider projection before and after. Do not issue provider inference or app/desktop side effects as a hidden smoke test.
4. Run one capability at a time with explicit user authorization for provider calls, external app actions, CLI account use, computer input, or desktop changes.
5. Update the parity matrix with `source snapshot`, `implemented`, `host reused`, `blocked`, or `excluded`; include exact evidence and residual limits. Never declare “all features complete” while blocked/excluded rows remain.

**Final acceptance:** Zero has one chat and Gateway; eligible OSS workflows work through that chat using native Gateway approvals and tools; each feature has repeatable tests/evidence; all blocked/excluded items are explicitly disclosed; no unintended model/provider/config/credential/session mutation.

## 6. Required API contract checklist

Before implementing any adapter, the developer must fill this table from actual installed Gateway docs/types/source and verified OpenMausBot source. Do not guess method names.

| Contract field | Required decision |
|---|---|
| Invocation | Existing Gateway method/tool/plugin hook; source and SDK version |
| Caller identity | Zero chat session, owner/user, and authorization source |
| Input | Strict schema, max lengths, path and URL rules, accepted content types |
| Output/events | Progress/stream framing and final result returned to the same Zero turn |
| Approval | Native host allow/deny/answer semantics; no second card system |
| Secret handling | Gateway SecretRef/MCP config only; no values in browser, argv, logs, stores, or test snapshots |
| Lifecycle | Deadline, cancellation, stop, shutdown cleanup, idempotency, concurrency bounds |
| Errors | Stable sanitized categories; preserve actionable detail without upstream bodies/secrets |
| Persistence | Gateway session for chat; minimal plugin metadata only when necessary and non-secret |
| Tests | Offline mocks plus host contract test; live test prerequisites and explicit authorization |

## 7. Single-shot implementation prompt

Copy the following prompt to the developer responsible for the Zero implementation. It deliberately requires the developer to execute all unblocked work in one coordinated pass while stopping at real external/legal/owner gates; “single-shot” does not mean bypassing prerequisites or claiming blocked features work.

```text
You are the implementation engineer for Zero. Execute the “Open Mouse Connect Plan” in
reports/open-mouse-connect-plan.md against the existing Zero workspace. Your goal is to connect
eligible OpenMausBot backend capabilities to Zero's current native product and Gateway—not to port
OpenMausBot as a second application.

NON-NEGOTIABLE PRODUCT RULES
1. Preserve the existing Zero UI as the only UI. Do not add OpenMausBot UI, React/Electron shell,
   navigation, pages, plugins/skills catalog, chat renderer, or mascot/branding.
2. Preserve exactly one user-facing chat identity and conversation route: the existing Zero chat.
   Do not add bot accounts, chat accounts, specialist chats, groups/rooms, or a second transcript store.
3. OpenClaw Gateway remains the sole runtime/session/history/tool/approval authority. Do not start a
   parallel OpenMausBot server, listener, websocket/SSE protocol, broker, database, or process manager.
4. Do not alter, reduce, replace, or “fix” model/provider catalogs, defaults, bindings, credentials,
   session overrides, or inference routes. Record before/after non-secret projection hashes and stop
   if unrelated live drift is detected.
5. Keep every `upstream/` directory read-only. Never copy from `enterprise/`, UI/Electron/companion
   product code, generated output, mascot, or trademark assets. Preserve Apache-2.0/third-party
   notices for any source actually reused; otherwise prefer a small clean-room adapter.
6. Never expose credentials in browser state, argv, logs, test fixtures, screenshots, docs, or plugin
   keyed stores. Use only Gateway protected SecretRef/MCP credential mechanisms.
7. Do not run a live provider inference, external-app mutation, CLI account action, desktop input,
   download/install, or Gateway restart/reload unless that exact action is already explicitly
   authorized by the owner. Offline/mock tests and read-only inspections are allowed.

PHASE 0 — PROVE THE INPUTS BEFORE CODING
A. Read `PROJECT_MEMORY.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `TASK_BOARD.md`, the latest
   `AGENT_CHAT.txt` handoff, this plan, `reports/source-inventory.md`, and the existing
   `reports/ui/openmausbot-ui-reference.md`.
B. Verify the exact source snapshot. The current `upstream/OpenMausBot-main` directory reports
   package version 0.1.127 and has no `.git`; the old inventory refers to a different 0.1.123
   checkout at d393b7a. Do not claim those are identical. Record a verified archive/tree digest or
   obtain the proper pinned checkout before asserting exhaustive source parity or copying code.
C. Read its `LICENSE`, `NOTICE`, `LICENSING.md`, and file-level notices. Exclude `enterprise/`.
D. Reconcile current Zero agent/chat/config state from the authoritative config without printing
   secrets. Project docs disagree historically about worker definitions; do not recreate workers or
   chats. Preserve the owner's single-Zero-chat requirement.
E. Capture read-only baselines: Gateway/Zero plugin registrations, native routes/tools, current
   model/provider projection hash, UI generation/served digest if reachable, and relevant test status.
   Do not make a live write or model/provider call.

PHASE 1 — BUILD A COMPLETE, EVIDENCE-BASED PARITY MAP
Inventory the verified OSS backend capabilities and map each to one disposition: (a) reuse an
existing Gateway feature, (b) implement a narrow Zero backend adapter, (c) blocked on account,
platform, host API, or owner approval, or (d) excluded because it conflicts with one chat/local
single-user scope or is enterprise-only. For each row capture the OpenMausBot source path/API,
Gateway equivalent, input/output/events, auth scope, approval semantics, state owner, secrets,
cancellation/timeout behavior, tests, and exact prerequisites. Refresh the existing parity report;
do not copy its old version assumptions forward without verification.

At minimum audit: chat streaming/history/stop; CLI drivers; action/question approvals; MCP and
Composio connectors; computer/browser; skills/plugins; memory/attachments; routines/triggers;
voice/TTS; channels; phone/mobile; data/HighLevel/dweb; local VM/cloud/Boat; team/control-plane;
desktop/Electron; analytics/telemetry and updates. Keep multi-bot/per-bot chat/model/team features
explicitly excluded under the single-chat rule, and enterprise code excluded under its license.

PHASE 2 — IMPLEMENT ONLY REAL ZERO-OWNED GAPS
Work in the existing owners' directories and preserve responsibilities:
- `backend/plugin/`: Gateway-side handler/adapters only when the installed Plugin SDK documents a
  supported seam. Prefer extending an existing Zero plugin over adding another runtime.
- `app/zero-control-ui/`: only necessary status/presentation in existing native screens; do not add
  a second page/navigation or execution logic. Browser code must not spawn processes or carry keys.
- `backend/agents/zero/`: policy guidance only when needed, with the managed sync script and no
  duplicated prompt/policy store.
- `computer/`: only coordinate with its owner and reuse its existing hold/control contracts; do not
  add noVNC/RFB relay, new desktop transport, cloud VM, or second hold system.
- `reports/`: refresh the parity matrix, contract, security decisions, and evidence as work lands.
Do not edit `upstream/`, live user data, or unrelated package/build outputs.

CLI REQUIREMENTS
First determine whether the installed Gateway can route a Zero turn through its existing Claude/Codex
CLI backend. The current `zero.integrations.cli.status` is discovery-only; do not represent it as
execution. If a host capability exists, document/use it. If it does not, propose/implement only a
minimal Gateway-side adapter using supported host process and approval APIs. Require approved exec,
bounded cwd/environment, allowlisted executable, no secret values in argv, output limits, streaming
to the same Zero turn, stop/cancel, timeout and shutdown cleanup, and sanitized status/errors. Do not
install or authenticate a CLI in this pass.

CONNECTED-APP REQUIREMENTS
The existing connector status method is discovery-only. Prefer existing native MCP configuration
and tool execution through Gateway. Gmail/Slack/GitHub/Notion/Linear actions must inherit host
authorization and approval; never create a second connector registry or OAuth store. Do not add a
Composio broker/dependency unless its API, account, secret, privacy, approval, and deployment contract
has been separately proven and approved. No live app action in this pass.

COMPUTER/BROWSER/AUTOMATION REQUIREMENTS
Reuse existing Gateway tools, native browser, Zero hold, global stop, fresh-frame, and automation
seams. Preserve hold ownership/release/recovery invariants. If vision model, viewer, RFB, phone,
Linux VM, cloud service, or account prerequisites are missing, record the blocker; do not change
models/providers or install/start a new service.

QUALITY AND SECURITY
- Use strict schemas and stable error categories; validate URLs, paths, sizes, and IDs at the
  backend boundary. Fail closed on unsupported or ambiguous capability.
- Preserve host approval, auth, cancellation, idempotency, concurrency/deadline controls, and audit.
- Do not log request bodies, provider response bodies, headers, SecretRefs, keys, or personal data.
- Avoid dead code and duplicate abstractions, but remove existing code only after repository-wide
  reference/build/test proof and a documented deletion rationale. Do not delete logs/audit/security
  mechanisms needed for operation or incident response.
- Add focused offline tests for each changed contract: success, invalid input, unavailable host API,
  denial, timeout, cancellation, redaction, restart/unload, and partial failure as applicable.
- Run only the relevant Zero-owned tests/build/type checks; do not run OpenMausBot installs, packaging,
  cloud deployments, downloads, model inference, or destructive/live end-to-end actions.

DELIVERABLES
1. Update `reports/open-mouse-connect-plan.md` with actual status/evidence, retaining all exclusions
   and source provenance caveats.
2. Update `reports/ui/openmausbot-ui-reference.md` (or its successor) with the refreshed parity map
   for the verified source revision.
3. Implement every unblocked, compatible, narrowly scoped backend integration that is supported by
   existing Gateway APIs, and add tests. Do not stop after merely writing an audit if implementation
   is possible without an unresolved owner/external prerequisite.
4. Update `TASK_BOARD.md`, `PROJECT_MEMORY.md`, and append a timestamped `AGENT_CHAT.txt` handoff with
   source revision, exact files, test/build results, live actions (if any), before/after model
   projection hashes, and remaining gates. Never self-accept a review-gated milestone.
5. Provide a concise final matrix: feature, implemented/reused/blocked/excluded, evidence, exact next
   prerequisite. Explicitly state that literal OpenMausBot parity is not achieved if any excluded or
   blocked capability remains.

STOP CONDITIONS
Stop only the affected feature if exact source licensing/provenance is unclear, the Gateway seam is
unsupported, model/provider/config drift appears, the operation would need credentials or external
accounts, or the requested behavior conflicts with the one-chat rule. Continue all independent offline
work. Do not invent methods, APIs, test evidence, or success states. Do not ask for approval already
granted for offline work; request a decision only for a genuinely owner-gated live/external action.
```

## 8. Persistence and continuation

- Canonical roadmap: this file, `reports/open-mouse-connect-plan.md`.
- Existing feature history: `reports/ui/openmausbot-ui-reference.md` (refresh after source provenance is settled).
- Cross-lane decisions/evidence: append to `AGENT_CHAT.txt`; update `TASK_BOARD.md` only with evidence-backed status and preserve reviewer ownership.
- Persistent memory index points to this roadmap. Future implementation must start with Phase 0 and follow the gates in order; do not treat this plan as authorization for external accounts, provider inference, config/model edits, installs, or desktop actions.

## 9. Phase 0 evidence and offline implementation — 2026-10-26

### 9.1 Source identity and license scope (verified)

| Field | Value |
|---|---|
| Path | `upstream/OpenMausBot-main` |
| Package | `openmausbot` `0.1.127`; Node `>=24`; package manager `pnpm@10.33.0` |
| VCS identity | **No `.git` metadata**; package version alone is not a cryptographic revision |
| Tree size | 5,111 files / 150,508,407 bytes |
| Deterministic tree digest | SHA-256 `f0e8df3757811e4254b51589b020ed6a5b23a9acacbb495919b414f6c3c25b62` (sorted relative path + per-file SHA-256) |
| Core license | Apache-2.0 (`LICENSE`; `NOTICE` records the MIT→Apache-2.0 relicensing and third-party terms) |
| Carve-out | `enterprise/` (10 files) is source-available under a separate license with production/partner conditions; not copied, read, or used |
| Trademarks | OpenMausBot/MausBot names and mascot are trademarks; Apache-2.0 grants no trademark rights |

This tree is **not** the older `upstream/openmausbot` `d393b7a…` / `0.1.123` checkout in
`reports/source-inventory.md`. The older audit remains historical evidence; it is not proof of this
requested snapshot. No source lines were copied. The existing pattern-only reference in
`app/zero-control-ui/THIRD_PARTY_NOTICES.md` remains.

### 9.2 Read-only Zero baseline

| Field | Observed value |
|---|---|
| Authoritative live config | `E:\zero\.zero-data\fresh-workspace\openclaw.json` |
| Config SHA-256 | `6f051c090f27d89ac039275946600250fb3724adfbed9165c9881f2b1eefa0a5` |
| Model projection SHA-256 | `ea75d703cc4d7c34579b580f42f9653c460d8b9d10ea662482c57a83dce5000f` (provider model IDs + base URL presence + API + defaults/entry bindings) |
| Agents | exactly `zero`; `subagents.allowAgents: []`; `requireAgentId: true` |
| Zero tools | `profile: "coding"`, `alsoAllow: ["computer"]`, `exec.mode: "ask"` |
| Provider | `nvidia` (`openai-completions`, base URL present) |
| Models | `minimaxai/minimax-m3.1-flash`, `nvidia/nemotron-3.5-bolt-e4b`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-super-vl-120b-a12b` |
| Defaults / Zero primary | `nvidia/minimaxai/minimax-m3.1-flash`, no fallbacks |
| Loaded plugin methods | six provider metadata methods only (startup log at 19:36); the two integration status methods are **not live** |
| Local UI generation | `418858e0a02247114def7c046abb00467f50d2bfacb3a697c0fef0c1e80b1f3d` (new, not served) |
| BUILT JS / CSS | `index.js` 105,724 B sha256 `ed553ce5…f128`; `index.css` 24,114 B sha256 `6affcc8d…3004` |
| Verification | UI 82/82 (incl. transport default `sse`, unknown/remote-`stdio` → `invalid`, command→`stdio`, empty/non-empty filter); mount 34/34; redirect 1/1, migration 3/3, sync 5/5; bridge 3/3; plugin selftest 111/111; `config validate` valid; `verify-served.mjs` exit 0 |
| Live actions | none: no prompt/inference, external app action, CLI/MCP connection, install, desktop input, config/secret/session write, Gateway restart, or UI reload |

No credential value was printed or persisted. The config projection is generated from non-secret
fields only. `openclaw plugins validate` reports "plugin entry does not expose tool or feature
authoring metadata" for this Gateway-method-only Control UI plugin; this is a validator
authoring-metadata limitation, not a manifest schema error, and is recorded rather than hidden.

### 9.3 Documentation reconciliation: agent configuration

The workspace contains historical statements that Researcher/Operator worker definitions and
delegation remained (2026-10-25 reports) and a 2026-10-26 zero-only migration. The authoritative
current live config has exactly one agent, `zero`, with all delegation disabled. This pass:

- records the zero-only state as canonical in `PROJECT_MEMORY.md`;
- marks the older worker claims as historical/superseded;
- does not recreate workers, chats, delegation edges, or specialist surfaces;
- keeps `/chat/zero` as the only user-facing conversation.

### 9.4 Offline implementation with verified Gateway seams

**Verified seam and a real blocker.** `tools.effective` (read-only) and `tools.invoke`
(operator.write, native exec approval) are valid Gateway methods for the browser's authenticated
`host.request`. They are **not** callable from this workspace plugin through
`api.runtime.gateway.request`: `dispatchTrustedPluginGatewayMethod` admits only bundled or
trusted-official plugins (`canTrustedOfficialPluginRequestScopes` checks `pluginOrigin`/registry
trust). Declaring `contracts.gatewayMethodDispatch` is an additional manifest gate, not a way to make
an untrusted workspace plugin trusted. The attempted plugin-side probe was therefore removed rather
than shipped as dead/unsupported code. This is the exact missing contract for a backend MCP probe:
the plugin must be bundled/trusted-official, or the owner must authorize a different host seam.

**Implemented in source/tests (not live):**

1. `zero.integrations.cli.status` now also reports `nativeProvider` and `nativeDispatch` using the
   installed plugin runtime's `resolveCliBackendDispatchEligibilityAsync`. This is discovery only.
   The supported CLI execution path is the native OpenClaw CLI backend; binding it to Zero needs an
   owner-approved model/runtime change. No custom process runner, streaming adapter, or cancellation
   store was added.
2. `app/zero-control-ui/src/shared/connectors.js` is a browser-safe, pure projection of native MCP
   config and the Gateway's **cached** `tools.effective` catalog. It reports configured/enabled,
   transport (`stdio`/`sse`/`streamable-http`), auth (`oauth`/`none`), valid non-empty tool-filter
   presence, status (`ready`/`disabled`/`invalid`/`not-configured`), catalog state
   (`listed`/`not-connected`/`not-listed`/`not-requested`), sanitized tool names, and
   `reachable: null`. Transport validation mirrors the installed contract: `McpServerSchema`
   accepts only `stdio`/`sse`/`streamable-http`; a command-bearing entry is stdio; a remote URL with
   no declared transport uses the installed runtime fallback `sse`; unknown/remote-`stdio` values are
   `invalid`. `toolFiltered` is true only for a non-empty string `include` or `exclude` rule; `{}`,
   empty arrays, and malformed values are false. It never returns URLs, headers, launch commands,
   OAuth material, filter patterns, descriptions, or diagnostics text. Cached catalog does not prove
   reachability.
3. `app/zero-control-ui/src/pages/about.js` calls the existing native `tools.effective` read-only
   method for the current Zero session and projects its result. This is a supported host request, not
   a process spawn or a new execution path. If the call fails or no Zero session is selected, the
   card shows configured-only state.
4. The About card remains discovery-only: it renders CLI availability/version/native readiness and
   connector configured/cached-capability state plus the explicit "cached status does not prove live
   reachability; this card does not run a connector" limit. No new page, navigation, chat, transcript
   store, broker, connector registry, credential input, approval renderer, or probe control was added.

**Files changed:** `app/zero-control-ui/runtime-core.mjs`,
`app/zero-control-ui/src/shared/connectors.js`, `app/zero-control-ui/src/pages/about.js`,
`app/zero-control-ui/test/mount.test.mjs`, `app/zero-control-ui/test/product-surface.test.mjs`;
evidence/report/board/memory updates.

### 9.5 Remaining gates (no parity claim)

- **CLI execution:** owner must choose and approve a native CLI backend model/runtime binding; then
  install/authenticate the CLI and exercise one bounded turn. No Zero-owned runner is planned.
- **Connected apps — reachability/actions:** configure native MCP/OAuth accounts, then use the native
  MCP probe or app action under host approval. A backend probe from this workspace plugin is blocked
  by the trusted-official dispatch gate; no probe method is shipped.
- **Mobile/phone, channels:** external apps/accounts, host pairing/channel configuration; excluded
  from a Zero-owned surface.
- **Team/cloud/control-plane/enterprise:** multi-user service and separate license boundary; excluded.
- **Desktop viewer/computer:** B3 authenticated loopback RFB plus an owner-authorized vision/input run.
- **Activation:** the two integration status methods and About card need a Gateway restart/UI reload.
  Not performed here.

Literal OpenMausBot parity is **not** achieved while these rows remain blocked or excluded.

## 10. Phase 1 contract map — OpenMausBot behavior → installed Gateway seam

**Method source:** installed OpenClaw `2026.10.6` docs/types/source under `upstream/openclaw`; no
method below is invented. “Host-owned” means Zero adds no parallel store, runtime, or approval path.
The current implementation only adds status/projection surfaces; execution rows remain gated as noted.

| Capability | OpenMausBot behavior / source | Supported Zero/Gateway seam | Input → output / events | Approval / cancellation | State / secrets | Error mapping | Disposition |
|---|---|---|---|---|---|---|---|
| Chat turn send + stream | `server/index.ts` chat routes; `server/chat-*`; `docs/chat*` | `chat.send` (`operator.write`); `session.message`, `session.tool`, `session.operation`, `sessions.changed` events | `{sessionKey, message, timeoutMs?, queueMode?}` → `runId/status`; streamed `session.*` events and final transcript row | Native tool approvals inside the turn; `chat.abort` / `sessions.abort` cancel the exact run | Gateway owns session/transcript/run; model credentials stay server-side | `INVALID_REQUEST` (bad/ambiguous key), `UNAVAILABLE`, no-active-run | **Reuse (host)**; `/chat/zero` is the only UI |
| Transcript/history | `server/chat-replay*`, `chat-pages*`, transcript stores | `chat.history`, `chat.message.get`, `sessions.get`, `sessions.describe` (`operator.read`) | `{sessionKey, cursor/offset/messageId?, maxBytes?}` → display-normalized messages, `deltaCursor`, `sessionInfo` | Read-only; no approval; no cancellation | Gateway transcript is authoritative; no second store | `INVALID_REQUEST`, `FORBIDDEN`, stale cursor/reset | **Reuse (host)** |
| Stop / cancel | `server/chat-*` stop routes; driver abort | `chat.abort` (`{sessionKey, runId?}`), `sessions.abort` (`{key, runId?, clearQueued?}`) | exact session/run → `{runIds}` / `abortedRunId`; `no-active-run` when settled | Native operator action; cancellation scoped to exact run | Gateway run registry; no Zero-owned queue | `INVALID_REQUEST`, `FORBIDDEN`, `no-active-run` | **Reuse (host)** |
| Session roster/maintenance (single chat) | Bot/thread/group store; `server/routes/*` | `sessions.list`, `sessions.create`, `sessions.patch`, `sessions.reset`, `sessions.delete`, `sessions.compact` | typed session params → rows/ack; `sessions.changed` | Archive/delete require live authority; no second chat identity | Gateway session store; Zero uses one agent | `INVALID_REQUEST`, `FORBIDDEN`, retryable `UNAVAILABLE` | **Reuse, constrained** to `/chat/zero`; no roster/switcher |
| Agent tool calls | `server/drivers/chat-tool-approval.ts`, harness tools | Agent turn native tools; `tools.catalog`, `tools.effective` (`operator.read`), `tools.invoke` (`operator.write`) | tool name/args/session → tool result envelope | Host tool policy + `exec.mode:"ask"`; abort signal cancels | Tool runtime is Gateway-owned; no plugin tool store | `requires_approval`, `forbidden`, `not_found`, `internal_error` | **Reuse (host)**; no extra tool bridge |
| Exec approvals | `shared/approval-mode.ts`, `shared/live-approval.ts`, `server/drivers/chat-tool-approval.ts`, `server/drivers/acp/question-requests.ts` | `exec.approvals.get/set`, `exec.approval.request/get/list/resolve/waitDecision`; `exec.approval.requested/resolved` events | approval id + decision → decision/receipt | Native approval registry; resolve requires `operator.approvals`; timeout/deny supported | Durable Gateway approval registry; no Zero approval store | approval denied/timeout/expired; invalid decision | **Reuse (host)**; no second card system |
| CLI backends (Claude/Codex/Grok) | `server/drivers/claude.ts`, `codex.ts`, `grok.ts`, `acp/*` | Native OpenClaw CLI backend: `registerCliBackend`, model `agentRuntime`; Zero `zero.integrations.cli.status` (PATH/version + native dispatch readiness) | adapter id → `{available,version,nativeDispatch}`; execution would bind a model/runtime and use the native turn lifecycle | Host turn/tool approval; stop via `chat.abort`/`sessions.abort`; no Zero process manager | Gateway session + CLI-owned auth; Zero stores no CLI credentials | `not-found`, `version-failed`, `not-eligible`; live auth errors stay native | **Status implemented; execution blocked** on owner-approved CLI runtime/model binding; no custom runner |
| MCP server config/status | `server/mcp*`, `server/connectors*`, `docs/custom-mcp-servers.md` | Native `mcp.servers` via `/settings/mcp`; Zero `zero.integrations.connectors.status` reads enabled/transport/auth/filter + presence | no caller input → per-connector `{configured,server,enabled,transport,auth,toolFiltered,status}` | No connection/approval; config edits are native admin actions | Gateway config; no URLs/headers/tokens/filter patterns returned; credentials server-side | `not-configured`, `disabled`, `invalid`; remote omitted transport → runtime `sse`; unknown/remote-`stdio` → invalid; empty/malformed filter → not filtered | **Implemented (config status)**; no broker/registry |
| MCP tool catalog / invocation | `server/connector-tools*`, `chat-apps-mcp.ts`; MCP Apps | Cached `tools.effective` (`source:"mcp"`, `mcpServer`, `mcpToolName`) for About; live MCP tools inside native chat; `openclaw mcp probe` only as native CLI | sessionKey → cached groups/notices; tool names only; live call uses native MCP tool + args | Native MCP/tool approval; abort via native turn stop; plugin-side `tools.invoke` dispatch is blocked | Gateway MCP runtime/config; Zero stores no tool data | `mcp-not-yet-connected/listed/stale`; native tool errors pass through | **Catalog projection implemented; live connection/action blocked** on MCP/OAuth accounts + native probe/action |
| Computer observe/input/takeover | `server/computer-control.ts`, `computer-observation.ts`, `computer-frames.ts`, `local-computer*` | `desktop.observe` (`operator.admin`), `desktop.release`; agent `computer` tool; Zero `zero.computer.control` hold | observe → `{transport,wsPath,expiresAtMs,control}`; hold actions → snapshot/result | Global hold; owner release/stop; `pagehide`/leave hand-back; fresh-frame gate | Gateway desktop/computer + Zero hold; no RFB relay | `UNAVAILABLE` (no authenticated loopback RFB), denied/stale-frame | **Partial**: hold live; viewer/B3 blocked; no new transport |
| Browser | `server/browser/*`, `server/browser/egress/*` | `browser.request` (`operator.admin`), agent `browser` tool; native profiles/policy | target/node/profile/action → browser result/screenshot | Host browser/SSRF policy + approvals; stop via native turn | Gateway-owned browser profiles; no Zero browser runtime | policy/SSRF/route errors; auth failures | **Reuse (host)** |
| Routines / automations / triggers | `server/routines.ts`, `routine-*.ts`, hooks | `cron.list/get/status/add/update/remove/run/runs`; native automation UI | job/schedule/run params → job/run row; `cron` events | Operator/admin scopes; manual run and cancellation via native cron; tool approvals inside run | Gateway cron store + canonical session | validation/visibility/run errors; no local scheduler | **Reuse (host)** |
| Skills / plugins | `server/skills*`, plugin catalog | `skills.status/search/detail/install/update`, `plugins.list/catalog` | skill/plugin id or query → inventory/details | Admin for install/update; read-only status otherwise | Gateway skill/plugin stores; no Zero catalog | eligibility/install/registry errors | **Reuse (host)** |
| Memory / attachments / files | `server/memory-*`, `attachments.ts`, file routes | Agent `memory_*`, attachment/file tools, native memory/files pages | query/path/attachment → records/content | Host file/tool policy; no extra approval store | Gateway memory/files/session; no duplicate index/store | not-found/permission/size errors | **Reuse (host)** |
| Voice / TTS / calls | `server/tts/*`, `server/phones/*` | `talk.*` / talk-voice plugin; native voice UI | voice/session params → audio/transcript/call state | Host voice/call approvals; stop via native control | Gateway voice provider config; secrets server-side | provider/auth/unavailable | **Reuse (host), provider-gated** |
| Usage / analytics | `server/usage*` | Native `/usage`, `usage.*`/summary projections | time range → usage rows | Read-only | Gateway usage store | not-found/range errors | **Reuse (host)** |
| Channels | `server/routes` channel modules, `docs/channels*` | Native Gateway channel plugins/config | account/send params → channel delivery | Channel/native approvals; stop via run/session | Gateway channel accounts; credentials server-side | auth/route/delivery errors | **Blocked** on accounts/workspace; no Zero channel surface |
| Mobile / phone pairing | `server/phones/*`, companion app | Host device pairing/node flow; no Zero pairing API | pair/device params → device rows/setup handoff | Pairing approval; no Zero token store | Gateway device state; no companion runtime | pairing/auth errors | **Blocked/excluded**; no phone app |
| Team/cloud/control-plane | `server/team-*.ts`, `cloud-team*`, `team-library*` | No single-user Zero seam | — | — | Separate service/auth boundary | — | **Excluded** |
| Bot box / local VM / cloud desktop | `server/bot-box/*`, `server/container-computer*` | Not portable to current Windows loopback Gateway | — | — | Separate Linux/VM/cloud runtime | — | **Not applicable/excluded** |
| Electron/desktop shell, OpenMausBot UI, branding | `electron/`, `src/`, companion | Existing native Control UI only | — | — | One shell; no second window | — | **Excluded** |
| Enterprise / hosted sign-in | `enterprise/`, `LICENSING.md` | Not available for reuse | — | — | Separate license/service | — | **Enterprise-excluded** |

**Gate result:** every row has either a supported host seam or a named blocker. No row proposes a
second server, port, transcript store, connector registry, approval card, or chat identity.

## 11. Next-phase candidate decision — 2026-10-26

**Selection method:** re-read the current source/tests, plan §§9–10, parity report, and TASK_BOARD.
MCP transport/filter review fixes are treated as completed. Candidates were scored by user-visible
value, availability of an installed Gateway seam, and whether implementation would require a new
UI/runtime/store/approval path. No candidate that passes all three gates remains.

| Candidate | Value | Installed seam | Why no code in this phase | Exact prerequisite | Smallest next authorized action |
|---|---|---|---|---|---|
| Live Claude Code/Codex CLI execution inside `/chat/zero` | Highest: unlocks the OpenMausBot local-driver family | Native OpenClaw CLI backend (`registerCliBackend`, model-scoped `agentRuntime`); `chat.send`/`chat.abort` own the turn | Zero currently binds the NVIDIA provider only. Enabling a CLI backend requires an owner-approved model/runtime binding (forbidden in this task). A Zero adapter would duplicate the native backend or bypass its lifecycle. No CLI was installed/authenticated/executed. | Owner decision on an exact CLI model/runtime binding + CLI install/auth + one bounded prompt scope | Owner approves one exact binding (or explicitly rejects it), then authorizes one bounded `/chat/zero` turn; no provider/config change until then |
| Live MCP connector reachability/app action | High: turns cached catalog evidence into real Gmail/Slack/GitHub/Notion/Linear work | Native `mcp.servers` + native chat MCP tools/approvals; cached `tools.effective` already shown | No MCP/OAuth account is configured. Plugin-side `tools.invoke`/`openclaw mcp probe` is blocked by `canTrustedOfficialPluginRequestScopes`; native chat already owns app tools. No live probe/action was run. | Configure one native MCP server/account via `/settings/mcp`; owner authorizes one read-only native tool call | Owner configures one server and authorizes one read-only call in `/chat/zero`; no connector registry/store added |
| Native CLI auth/status detail | Low: discovery only; does not execute | `models.authStatus` (read-only) / existing CLI readiness | Adding more status would not close the execution gap and risks another status-only claim | Same CLI binding/auth as above | Owner answers the CLI runtime decision |
| Live desktop viewer / computer input | High but platform-gated | `desktop.observe`/`desktop.release` + Zero hold | No authenticated loopback RFB listener; vision route unverified; desktop input needs owner authorization | B3 authenticated loopback RFB + owner-approved vision/input run | Owner approves B3 setup and one bounded observation; no Zero transport added |
| Mobile/phone, channels | Product/account-gated | Host device pairing / native channel plugins | No companion app, account credentials, or Zero-owned pairing surface; adding one would be a second product client | External app/accounts + product decision | Owner provides a specific account/app scope; no placeholder |
| Team/cloud/control-plane/enterprise | Out of scope | None for single-user Zero | Requires multi-user service/auth boundary and separate enterprise license | New product + legal decision | None under OMB-01 |
| Bot box / Linux VM / cloud desktop | Platform-gated | None on current Windows loopback host | Requires Linux/VM/cloud runtime and threat model | Separate platform decision | None under OMB-01 |

**Decision:** no product code or placeholder was added in this phase. The highest-value unblocked
candidate (live CLI execution) is blocked on an owner model/runtime decision; the alternative (live
MCP action) is blocked on external accounts and a native/trusted host action. Existing CLI/MCP
status and cached-catalog slices remain the truthful boundary. Literal parity is not claimed.

### 11.1 Baseline evidence for this phase (no code change)

- UI **82/82**; mount **34/34**; redirect **1/1**, migration **3/3**, sync **5/5**; bridge **3/3**;
  plugin selftest **111/111**; `config validate` valid; `verify-served.mjs` exit 0.
- Local build generation `418858e0a02247114def7c046abb00467f50d2bfacb3a697c0fef0c1e80b1f3d`
  (JS 105,724 B sha256 `ed553ce5…f128`; CSS 24,114 B sha256 `6affcc8d…3004`); not served.
- Config SHA `6f051c09…` and model projection `ea75d703…` unchanged; only agent `zero`.
- **Verified locally in this pass:** the listed test commands, build asset checks, and config/model
  hashes. **Reported/not re-verified:** nothing live. **Not verified:** any live CLI execution, MCP
  reachability/action, provider inference, desktop input, or Gateway restart/reload. Test counts are
  not evidence of live feature behavior.
