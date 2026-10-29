# UI Reference Note — OpenMausBot computer-panel/takeover UI patterns (UI-02 preparation)

**Owner:** OpenCode · **Context:** independent read-only prep while UI-01 awaits DeepSeek coordination; feeds UI-02's desktop live-view/takeover panel and INT-00's wiring list.
**Date:** 23 October 2026, ~05:40 Asia/Calcutta · **Source:** `upstream/openmausbot` (pinned `d393b7a728068cd6b0e9e96fd6997c13b6b10ba6` per `reports/source-inventory.md`); read files only — **no edits, no installs, no builds, no desktop actions**.
**Relationship to other reports:** the *server-side* contract analysis of these same files is Qoder's (CU-00 report §7/§10, `reports/computer/windows-cua-inventory.md`). This note adds the UI-side specifics: what the components actually do, and their license obligations.

**Current status (2026-10-26):** this note is historical prep for UI-02. The one UI-owned gap found
later - handing the hold back when the view is left - is implemented and source/test-verified in the
section below. UI-02 and UI-05 are READY FOR REVIEW. Every other OpenMausBot pattern is either
already covered by the existing Zero hold client, host-owned, or not applicable; the inline status
notes below say which, so the items are not re-implemented.

## License summary (verified from repo files)

- OpenMausBot core: **Apache-2.0** (`LICENSE`), relicensed from MIT with contributor consent (`NOTICE`: "Copyright 2026 Milind Soni and OpenMausBot contributors"). Apache-2.0 §4 attribution obligations attach to redistribution of the source or of derivative works. This repository already records the pattern-only reference in `app/zero-control-ui/THIRD_PARTY_NOTICES.md`; no source lines were copied. If source lines are later copied, add the NOTICE entry and license text before that copy lands.
- **`enterprise/` carve-out**: source-available under a separate license (LICENSING.md); development/test use is free, **production requires a license key**. None of the computer UI files noted below are under `enterprise/` paths — but verify file-level license at copy time (D-006/MASTER_PLAN rule).
- Trademark reservation applies (per Qoder's CU-00 verification) — do not reuse the name/mascot branding in Zero.

## Files read (exact, small set)

| File (src/…) | Size | Purpose | Zero relevance |
|---|---|---|---|
| `components/computer-takeover.ts` | 6.4 KB | Takeover lease UX: `useComputerTakeover` hook + `openProviderDesktop` | **Pattern reference for the hold client; hand-back on leave implemented** |
| `lib/desktop-connection.ts` | 3.3 KB | noVNC/RFB client connect (`connectDesktop`, `DesktopUnreachable`) | **Connection logic template** for Control-UI/desktop relay equivalent |
| `components/LiveDesktop.tsx`, `components/DesktopViewer.tsx` | 7.4/12.6 KB | Viewer components | Pattern only; likely superseded by OpenClaw RFB relay path |

## Concrete patterns worth preserving (UI-02 contract feed)

1. **`TakeoverSnapshot { held, owned? }` + opaque `controlLeaseId`** (`computer-takeover.ts:4-8`): taking control returns server-confirmed facts; the UI never *assumes* it holds control. Matches Qoder's contract row ("state: agent | human | transitioning") and OpenDots `holder` shape — all three represent the same idea; propose Zero adopt **one** name for it (recommend OpenDots-style `holder` since that is already in the accepted inventory). **Status:** implemented as `held`/`owned`; `holder` was not adopted, so the existing contract name stays.
2. **`RELEASE_SETTLE_MS = 1500` release-settle rule** (`:10-11`): an out-of-order `release` — e.g. another device's hand-back arriving before this view's take — does NOT end a takeover session; only a release that persists does. Prevents hand-back/take-again flapping. Zero's desktop panel should carry this as a named rule (test "release settle"). **Status:** not implemented — Zero has no local takeover session to settle; the server snapshot is authoritative and the generation counter ignores stale responses (see "Deliberately not implemented").
3. **Lease generation + fail-closed release** (`:16,68-72,101-121`): lease id from `crypto.getRandomValues` (works on plain-LAN HTTP where `crypto.randomUUID` is unavailable); every failure path still POSTs `release` with `keepalive: true` so closing the tab/panel gives the computer back even when the page unloads. **Zero must have this "release on exit" behavior, including unload, without negotiation.** **Status:** the Zero plugin mints the opaque lease; `pagehide` and leaving `/systems` hand the hold back; `dispose()` alone never releases (host re-render safety).
4. **"Another conversation changed" guard** (`changed()` AbortError, `:46`): a takeover session is scoped to (bot, conversation, computer); switching selection aborts the join and releases. Zero scoping: (thread/session, computer node). **Status:** the Zero hold is global by design; leaving `/systems` is the scope boundary.
5. **RFB client hygiene** (`desktop-connection.ts:21-60`): URL allow-list (`DESKTOP_VIEWER_TARGET` pattern check → `DesktopUnreachable(invalid)`), 30 s join timeout, 15 s connect deadline, `credentials: same-origin`, `cache: no-store`, `scaleViewport`, abort wiring — a fail-closed checklist Zero's `connectDesktop` equivalent should mirror. Only desktop pixels/input cross the boundary; the client never accepts page code from the VM. **Status:** host-owned; Zero does not open a second transport. Remaining prerequisite B3 (authenticated loopback RFB).
6. **Heavy lifting lives in giant files** (`ComputerPanel.tsx` 87.8 KB, `Sidebar.tsx` 123 KB, `ChatView.tsx` 69.9 KB, `GroupView.tsx` 75.7 KB): these are NOT transplant sources. At the time this was written UI-02 planned to keep OpenDots React components (D-007) and borrow at most the small logic-file patterns above. **Status:** the OpenDots React path was removed; the current UI is native plain DOM, so only the small logic patterns apply. OpenMausBot is a pattern reference, not a component library, for Zero.

## Not carried into Zero unless a named gap appears

- Provider-desktop split viewers (`openProviderDesktop`'s desktopViewer window/tab/fallback chain) — Zero's MVP has the designated local computer only; do not port the provider-hosted-desktop/tunnel infra.
- VPS tunnels and provider offboarding flow — out of MVP scope (private local single machine).

## Open questions / dependency notes

- **OQ-UI-1:** exact wiring between Zero's WebSocket Gateway session (auth mode per bridge report OQ-4) and a desktop relay the RFB client can reach securely. Owner answer needed before UI-02 coding (feeds from Qoder's takeover-arbitration decision and my five-point CU-01 request in AGENT_CHAT 04:52 entry). **Status:** resolved for the hold bar - it uses the existing authenticated Gateway RPC and adds no relay; the desktop viewer itself remains host-owned (B3).
- **License action before any copy:** file-level provenance is now recorded in `app/REUSE-LEDGER.md`, and the pattern-only reference is recorded in `app/zero-control-ui/THIRD_PARTY_NOTICES.md`. Add the Apache-2.0 license text and any additional NOTICE entry only if source lines are actually copied.

**Evidence:** file paths + direct reads above; nothing executed. This prep note changed no board row at the time; UI-02 and UI-05 are now READY FOR REVIEW (see the status note at the top and the implementation section below).

## UI-owned integration implemented - 2026-10-26 (OpenCode)

**Scope:** one behavior only - leaving the native Desktop surface or the page hands back the hold
this view took. This is a **pattern-only adaptation** from the Apache-2.0 files above
(`src/components/computer-takeover.ts` and `ComputerPanel.takeover.test.ts`); no source lines were
copied, and `upstream/openmausbot` remains unmodified. No OpenMausBot name, mascot, component, or
`enterprise/` code is used. The Zero implementation is original JavaScript over the existing
`zero.computer.control` method. The existing `app/zero-control-ui/THIRD_PARTY_NOTICES.md` already
records this pattern-only OpenMausBot reference, and `app/REUSE-LEDGER.md` records the file
provenance; no source lines were copied. If any source line is later copied, the Apache-2.0 NOTICE
entry and license text must be added before that copy lands.

### Why this was the genuine gap

The existing Zero hold client already covered the server-arbitrated hold, opaque lease,
conflict re-read, disconnect invalidation, polling/visibility refresh, refused-not-queued
semantics, and the post-release fresh-capture gate. What it did **not** do was release on a real
departure from `/systems` or on `pagehide`. The plugin releases when the Gateway connection closes,
but an in-app route change keeps the socket open, so a global hold could remain active with its
only visible release control removed. That is the OpenMausBot "closing the panel left the bot
waiting" case.

### Implemented

- `app/zero-control-ui/src/computer/hold.js`
  - `createComputerHold().leave()`: best-effort hand-back that releases only a hold this view owns
    (`releaseLeaseId` is populated only for `owned` snapshots). It stops polling, ignores late
    responses, never renders success, and never blocks navigation.
  - A take still in flight is awaited only long enough to release the lease it returns; if that
    take fails, the hold this view already had is handed back instead. A release already in flight
    is not duplicated.
  - `mountComputerHold()` registers a `pagehide` listener and exposes `leave()`. `dispose()` alone
    never releases, so a host re-render while the user is still on Systems cannot silently end a
    human hold.
  - The held-by-you detail now tells the user that leaving the screen hands control back. If the
    hand-back request fails, returning to `/systems` re-reads the authoritative status and shows the
    still-owned hold with its Release button, so the hold is never silently stranded.
- `app/zero-control-ui/src/native-surfaces.js`
  - `computerSurfaceAction()` distinguishes a real route departure (`leave`) from a transient host
    re-render (`remount`) and a missing Desktop element (`unmount`).
  - `handBackComputer()` is null-safe and best-effort.
  - Leaving `/systems` (and plugin teardown) hands back only this view's hold before the wrapper is
    removed. The native Desktop viewer, route, and transport are untouched.
- `app/zero-control-ui/test/computer-hold.test.mjs`: 10 new focused tests (30 hold tests total):
  leave once, never another client's hold, no release while disconnected, dispose does not release,
  in-flight take hand-back, failed in-flight take falls back to the existing hold, in-flight release
  not duplicated, `pagehide`, helper safety, and the route-action decision.

### Deliberately not implemented (already covered or not Zero-owned)

- **`RELEASE_SETTLE_MS` (pattern 2):** Zero has no local takeover session to settle. The server
  snapshot is authoritative and the generation counter ignores stale responses; a display delay
  would hide a real release without improving safety.
- **Client-minted lease IDs (pattern 3):** the Zero plugin mints the opaque lease; the client never
  supplies one.
- **`keepalive` fetch release (pattern 3):** the Zero hold is a Gateway RPC over the existing
  socket, not an HTTP POST. The plugin's connection-close release is the guaranteed backstop;
  `pagehide` is best-effort on top of it.
- **RFB target allow-list, 30 s join / 15 s connect deadlines, same-origin no-store (pattern 5):**
  Zero does not own the desktop transport; the native host viewer does. Adding a viewer or an
  allow-list here would be a second transport. Remaining prerequisite: host-owned viewer hygiene
  plus an authenticated loopback RFB listener on port 5900 (B3).
- **Conversation-scoped takeover (pattern 4):** the Zero hold is intentionally global; leaving the
  Systems route is the scope boundary.

### Verification

- UI suite **81/81** (30 focused hold tests); build generation
  `16b83c886dd1679b88339502497e3543afb37f6c3f08f85313328593ca2c512b`
  (`index.js` 101,066 B sha256 `942c11e3...c724`; `index.css` 24,114 B unchanged sha256
  `6affcc8d...3004`); `verify-served.mjs` passes for the local build.
- **Source/test evidence only.** No Gateway reload was performed, so the in-memory plugin revision
  from the 15:27 audit (`3d62356d...`, generation `56b1d59f...`) is not claimed to serve this build.
  No take, release, route change, or `pagehide` was exercised against a live Gateway or desktop in
  this pass. The next live check needs an owner-approved reload and a fresh hold take/release; it
  must not be described as proven until then.

---

## Full OSS parity audit — 2026-10-26

**Target.** No project/document/config reference to “Vishwas” exists in the workspace or the pinned
OpenMausBot checkout. The target is therefore the current Zero deployment: Windows, loopback Gateway
`127.0.0.1:18789`, one agent `zero`, native Control UI, existing `/chat/zero`.

**Pinned source.** The requested tree consumed for the Open Mouse Connect Plan is
`upstream/OpenMausBot-main`: package `0.1.127`, **no `.git` metadata**, 5,111 files /
150,508,407 bytes, deterministic tree SHA-256
`f0e8df3757811e4254b51589b020ed6a5b23a9acacbb495919b414f6c3c25b62` (sorted relative path +
per-file SHA-256). `LICENSE` is Apache-2.0; `LICENSING.md` puts `enterprise/` under a separate
source-available license with production/partner conditions; `NOTICE` carries third-party and
trademark terms. The older `upstream/openmausbot` checkout at `d393b7a…` / `0.1.123` recorded in
`reports/source-inventory.md` is a **different snapshot**; do not use it as proof of the requested
tree. No `enterprise/`, UI/Electron/companion product code, mascot, or brand asset is copied or used.
Trademark rights are not granted by Apache-2.0. The existing pattern-only attribution in
`app/zero-control-ui/THIRD_PARTY_NOTICES.md` remains; no source lines were copied in this audit.

**Method.** Read the pinned README feature/architecture sections, the `docs/` feature set, server module
inventory (`server/index.ts`, `server/drivers`, `server/computer-*`, `server/composio*`,
`server/team*`, `server/routines*`, `server/bot-box`, `server/tts`, `server/chat-*`,
`server/approval-*`, `server/mcp*`), and the current Zero config/UI/routes. Live checks were read-only.

### Parity matrix

| Feature | OpenMausBot source/API | License scope | Current Zero equivalent | Gap | Proposed/reused seam | Status | Tests / prerequisite |
|---|---|---|---|---|---|---|---|
| Chat roster, per-bot personality, per-bot model selection | README “Pick a brain per bot”; `docs/presets.md`, `docs/decision-model.md`; `server/bot-profile*`, model catalog | Apache-2.0 | One agent `zero`; native model/model-defaults UI; no roster | Roster/personality/per-bot model intentionally absent | Do not add agents; existing native chat/model defaults | Product-excluded | Zero-only tests; reversing requires owner product decision |
| Streaming, history, transcripts | `server/index.ts` `/api/events`, `server/chat-*` | Apache-2.0 | Native Control UI chat, Gateway sessions/history | None | Host reuse; no second renderer/store | Covered (host) | UI/session suites; live `/chat/zero` |
| Claude Code / Codex / Grok local CLI drivers | README “Powered By”; `server/drivers/`; `docs/custom-engines.md`, `docs/cursor.md`, `docs/opencode-go.md` | Apache-2.0 + third-party CLI licenses | Native OpenClaw CLI backend is the supported runtime seam (`registerCliBackend`, `agentRuntime`, bundled `anthropic` plugin); Zero adds bounded `zero.integrations.cli.status` PATH/version discovery and native dispatch-readiness via `resolveCliBackendDispatchEligibilityAsync` | Execution requires an owner-approved model/runtime binding; no Zero-owned runner/stream/cancel adapter | Host CLI backend + host exec approval; no custom process runner | Discovery/readiness implemented (source/test); execution blocked | CLI install/auth + model/runtime decision; UI 82/82; restart needed for method/UI |
| Approval cards: commands, file edits, questions | `docs/approval-levels.md`; `shared/approval-mode.ts`, `shared/live-approval.ts`; `server/chat-widgets.ts`; `server/drivers/chat-tool-approval.ts` | Apache-2.0 | Native `/settings/approvals`, chat execution-permission menu, `exec.mode:"ask"` | None for native tools | Host reuse; no new approval renderer | Host-owned | Route present; no approval action exercised; plugin selftest |
| Approval cards for connected-app actions | `docs/composio.md`; `server/composio*`, `server/connectors*` | Apache-2.0 core + external Composio | No connected apps | Missing app accounts/broker | None without external service | Blocked | Composio key + per-app accounts + approval policy |
| Computer panel: observe/input, takeover, release, stale-frame, recovery | `docs/computer-use-integration.md`; `server/computer-*`; `docs/approval-levels.md` | Apache-2.0 + CUA third-party | Zero hold bar over `zero.computer.control`, `cua-computer`, native Desktop panel | Live desktop viewer absent; vision route unverified | Existing hold/control seam; host-owned viewer | Partial | 30 hold tests; live status `held:false`; needs B3 RFB + owner vision run |
| Gmail, Slack, GitHub, Notion, Linear app actions | `docs/composio.md`; `server/composio*`, `connectors*` | Apache-2.0 core + external Composio | Native MCP `/settings/mcp`; Zero status reports configured/enabled/transport/auth/filter; About projects cached native `tools.effective` MCP tool names | Live account/OAuth not configured; no live reachability; plugin-side probe blocked by trusted-official dispatch gate | Native MCP config/catalog (read-only host request); no broker/store/probe method | Config/capability discovery implemented (source/test); live action blocked | Projection/config tests; owner must configure MCP/OAuth and use the native MCP probe/app action; UI 82/82 |
| Mobile/phone pairing and companion apps | `docs/phone-web-app.md`, `ios-companion.md`, `electron/android-device*` | Apache-2.0 + app/third-party | Host device pairing exists; Zero is a local native web app | No mobile companion/pairing surface | Host/pairing only | Blocked | Owner mobile app/device decision |
| Channels (Slack, WhatsApp, etc.) | README “Channels”; server channel modules | Apache-2.0 | Host channel plugins | No channel credentials/workspace | Host-native channel seam | Blocked | Account credentials |
| Team packages, team clouds, sharing, escalations | `docs/team-*.md`; `server/cloud-team*`, `team-*` | Apache-2.0 core; enterprise carve-out not present | Zero is single-user, one agent | Multi-user/team product absent | None | Product-excluded | Would reverse single-assistant/zero-only decision |
| Local harness/runtime | README “Harness”; `server/harness/` | Apache-2.0 | OpenClaw Gateway is the single harness/runtime | None | Host reuse | Covered (host) | Health, sessions |
| Control-plane and Composio broker | `server/index.ts` internal routes; `docs/composio.md` | Apache-2.0 core + external | No control-plane/broker | Missing external service | None | Blocked | External service/owner |
| MCP servers and custom OpenAI-compatible engines | `docs/custom-mcp-servers.md`, `docs/custom-engines.md`; `server/mcp*` | Apache-2.0 | Native `/settings/mcp`; provider manager; native plugin catalog | CLI engines not configured | Host MCP + provider manager | Covered/partial | Route audit; MCP/CLI credentials for extensions |
| Voice/TTS/call mode | `docs/voice-mode.md`; `server/tts/` | Apache-2.0 + external TTS services | Host `talk-voice` plugin loaded; native voice UI | No Zero-specific voice surface | Host reuse | Covered/partial | Talk plugin loaded; TTS keys if used |
| Routines, automations, triggers, proactive work | `docs/routines*`, `proactive-routines.md`, `automation-*`; `server/routines*` | Apache-2.0 | Native `/automations`; host triggers | None | Host reuse | Covered (host) | Route audit |
| Memory, files, attachments | `docs/memory.md`, `files.md`; `server/memory*`, `attachments*` | Apache-2.0 | Native memory page and chat attachments | None | Host reuse | Covered (host) | Route/session checks |
| Usage/analytics | `docs/analytics.md`; `server/usage*` | Apache-2.0 | Native `/usage` | None | Host reuse | Covered (host) | Route audit |
| Browser use | `docs/computer-use-integration.md`; `server/browser*`, `browser-live-routes*` | Apache-2.0 + third-party | Host `browser` plugin; no Zero browser panel | No Zero-owned browser surface | Host reuse | Covered/partial | Browser policy/account prerequisites |
| Bot box / sandbox | `docs/bot-box.md`; `server/bot-box/` | Apache-2.0 | Host sandbox mode `off`; Windows | Linux seccomp/bubblewrap model not portable | None on current platform | Not applicable | Linux/owner sandbox decision |
| Desktop companion/packaging/deep chat links | `docs/desktop-companion.md`, `desktop-library.md`, `desktop-chat-links.md`; `electron/` | Apache-2.0 + app deps | Native web UI; `/chat/zero` is the existing deep link | No Electron companion/second desktop shell | None | Product-excluded | Would be a second shell |
| Localization, avatars, organization branding | `docs/localization.md`, `avatar-storage.md`, `organization-branding.md` | Apache-2.0 / enterprise branding | Host localization/identity/avatar | Branding/organization features absent | Host-native | Covered/excluded | Owner branding decision |
| Headless CLI, MCP server, agent tool bridge | `docs/headless-cli.md`, `mcp-server.md`, `agents-tool-bridge.md` | Apache-2.0 | OpenClaw CLI/Gateway and native MCP settings | None | Host reuse | Covered (host) | CLI/health/MCP routes |
| HighLevel CRM native integration | `docs/highlevel.md` | Apache-2.0 + external account | None | Missing account/connector | None | Blocked | HighLevel account |
| Enterprise hosted sign-in, org library, enterprise features | `LICENSING.md`, enterprise carve-out | Separate enterprise license | Not present; sparse checkout excludes enterprise | Not usable without license | None (forbidden) | Enterprise-excluded | License/owner |

### Cross-cutting inventory

- **API surface:** `server/index.ts` exposes bots, turns, chat, approvals, model catalog, computer
  lifecycle, connectors, config, routines, TTS, pairing/email auth, internal hook/tool-result/options-card
  routes, and `/api/events` SSE. Zero uses the Gateway WebSocket/session APIs and native Control UI; no
  parallel HTTP surface is added.
- **Authentication:** pairing/email/hosted sign-in in OpenMausBot; Zero remains loopback with host device
  pairing/auth mode and no new auth surface.
- **Persistence:** OpenMausBot uses its own data directory/SQLite/transcript store; Zero keeps the
  Gateway state directory and native session history only.
- **Lifecycle/failure:** OpenMausBot drivers degrade to “unavailable”; harness/turn lifecycle handles
  approvals, cancellation, recovery. Zero reuses Gateway turn/session/approval lifecycle; blocked
  external drivers are not stubbed.

### Implemented Zero-owned slices — 2026-10-26 (Phase 0/2 refresh)

1. **Local CLI discovery + native backend readiness**
   - `app/zero-control-ui/runtime-core.mjs`: `zero.integrations.cli.status` discovers `claude` and
     `codex` via `where`/`which` with a 2 s bound, reads `--version` with a 2.5 s bound, and returns only
     `{id,label,available,version,error,nativeProvider,nativeDispatch}`. It also asks the installed
     plugin runtime whether the native CLI backend (`claude-cli` / `codex`) could dispatch for Zero.
     Executable paths, environment, prompts, and credentials are never returned.
   - The supported execution path is the **native OpenClaw CLI backend**, not a Zero process runner.
     The installed Gateway documents `registerCliBackend` / model-scoped `agentRuntime` and loads the
     bundled `anthropic` plugin. Enabling it for Zero requires an owner-approved model/runtime binding;
     that config change was not made. No `child_process.spawn` runner, CLI streaming adapter, or
     separate cancellation store was added.
   - `app/zero-control-ui/src/pages/about.js` renders PATH/version/not-found states and adds
     `native CLI backend ready` only when native dispatch eligibility is true. Execution remains the
     host's CLI-backend/exec approval path.

2. **Connector/MCP status + cached capability projection**
   - `zero.integrations.connectors.status` reads only native `mcp.servers` and returns configured,
     enabled/disabled, transport (`stdio`/`sse`/`streamable-http`), auth (`oauth`/`none`), valid
     non-empty tool-filter presence, and `ready`/`disabled`/`invalid`/`not-configured` state. It
     mirrors the installed contract: `McpServerSchema` accepts only those three transport values; a
     command-bearing entry is stdio; a remote URL with no declared transport uses the installed
     runtime fallback `sse`; unknown/remote-`stdio` values are `invalid`. `toolFiltered` is true only
     for a non-empty string `include`/`exclude` rule; `{}`, empty arrays, and malformed values are
     false. It never returns MCP URLs, headers, launch commands, filter patterns, OAuth tokens, tool
     descriptions, or credentials.
   - `app/zero-control-ui/src/shared/connectors.js` is a browser-safe pure projection. About calls the
     existing native `tools.effective` read-only method for the current Zero session and applies that
     projection, returning sanitized tool names plus `listed` / `not-connected` / `not-listed` /
     `not-requested` state. No URLs, headers, launch commands, OAuth material, descriptions, or
     diagnostics text are returned.
   - About renders configured state, transport/auth/filter presence, and cached tool names, with the
     explicit limit that neither configuration nor a cached catalog proves live reachability and that
     the card does not run a connector. No new connector page, credential input, broker, or store was
     created.

3. **Backend MCP probe — blocked seam (no method shipped)**
   - A plugin-side `zero.integrations.connectors.probe` using
     `api.runtime.gateway.request("tools.invoke")` is not supported for this workspace plugin.
     `dispatchTrustedPluginGatewayMethod` admits only bundled/trusted-official plugins
     (`canTrustedOfficialPluginRequestScopes`); declaring `contracts.gatewayMethodDispatch` is an
     additional gate, not a trust grant. The attempted implementation and manifest contract were
     removed instead of shipping dead/unsupported code.
   - Live reachability requires the native MCP probe/app action through the host, or a future
     owner-approved trust/host seam.

4. **Native approvals/computer reuse**
   - No approval renderer was added. Commands/file edits use host approvals and `exec.mode:"ask"`;
     connected-app actions use native MCP/tool approval; computer input uses the existing
     `zero.computer.control` hold + fresh-frame gate.
   - Computer hold tests (30) remain the evidence for refusal, release, stale-frame, and reconnect
     behavior; no RFB/VNC or second desktop transport was added.

### Remaining gaps / exact prerequisites

- **Live CLI execution:** install/authenticate Claude Code and/or Codex. The supported seam is the
  native OpenClaw CLI backend; binding it to Zero needs an owner-approved model/runtime change. No
  Zero process runner, streaming adapter, or separate cancellation store was added. The status card
  reports PATH/version and native dispatch readiness only.
- **Connected apps:** configure MCP servers/OAuth accounts through native `/settings/mcp` (or the
  provider's Composio setup), then use the native MCP probe or an app action under host approval.
  A plugin-side probe is blocked by the trusted-official dispatch gate; no probe method is shipped.
  The About card shows cached `tools.effective` tool names only, never live reachability.
- **Mobile/phone pairing:** no Zero-owned pairing interface; the host device-pairing flow is the only
  seam. A mobile companion would be a separate app/runtime, outside the single-product boundary.
- **Channels:** native channel plugins/config; no Zero channel surface. Requires account credentials.
- **Team packages/cloud, control-plane, enterprise:** no supported single-agent Zero seam; excluded or
  enterprise-licensed.
- **Live desktop viewer:** host-owned Desktop panel; requires B3 authenticated loopback RFB. No
  workaround transport is permitted.
- **Activation:** the two integration status methods require a Gateway restart; the About card
  requires a UI reload/publish. Until then the card shows the explicit fallback state. No
  restart/reload was performed in this pass.

### Unsupported host/platform contracts

- **Mobile/phone pairing:** supported host seam is the Gateway device-pairing flow; the plugin API has no
  pairing-token/QR endpoint for a Zero-owned card. A future Zero interface would be a read-only
  `zero.integrations.pairing.status` returning paired-device counts/expiry (no token), plus an owner-run
  host pairing flow. A phone companion/WebRTC transport is a separate app/runtime and remains excluded.
- **Channels:** supported seam is the host channel plugins/config; no Zero-owned channel API exists.
  A future adapter would expose channel account status/approval state only, never credentials. Requires
  account credentials and a separate product decision on messaging surfaces.
- **Team packages/cloud/control-plane:** no supported single-agent Zero API; these require multi-agent
  routing, signed team packages, and external control-plane services. Excluded from this product.
- **Live desktop viewer:** host `desktop.observe` is the only transport seam; it currently returns
  `UNAVAILABLE` because no authenticated loopback RFB listener exists. Interface contract: a paired
  desktop node must expose RFB on loopback with auth, and the native viewer owns connect/join/teardown;
  Zero adds only the existing hold/status UI. No second relay is permitted.

### Reuse inventory

- Native chat/session/history/streaming: unchanged `/chat/zero` and Gateway APIs.
- Approvals/permissions: native `/settings/approvals`, execution-permission menu, `exec.mode:"ask"`.
- Computer: `zero.computer.control` hold bar, `cua-computer`, native Desktop panel; live status
  `held:false`, global scope, no takeover/input performed.
- Automations, Skills, Plugins, MCP, Memory, Usage, Models/Providers: native routes; no duplicates.
- Zero plugin remains `uiCapabilities: []`; no new page, nav, transport, transcript store, or reload.

### Model/provider preservation

- Before/after config SHA-256 `6f051c090f27d89ac039275946600250fb3724adfbed9165c9881f2b1eefa0a5`;
  model projection SHA-256
  `ea75d703cc4d7c34579b580f42f9653c460d8b9d10ea662482c57a83dce5000f` (identical before/after this
  pass; projection = provider model IDs + base URL presence + API + defaults/entry model bindings).
  Earlier `e84951b5…`/`c24a1692…` values were a different snapshot/formula and are superseded.
- Provider `nvidia`: `minimaxai/minimax-m3.1-flash`, `nemotron-3.5-bolt-e4b`,
  `nemotron-3.5-lightning-30b-a3b`, `nemotron-3.5-super-vl-120b-a12b` unchanged.
- Defaults/Zero primary `nvidia/minimaxai/minimax-m3.1-flash`; no probe or provider call.

### Verification

- UI **82/82**, including connector catalog projection, transport default/unknown regression
  (`sse` fallback; unknown/remote-`stdio` → `invalid`; command precedence → `stdio`), empty vs
  non-empty include/exclude filter regression, and About success/timeout/malformed tests; mount
  **34/34**; redirect **1/1**, migration **3/3**, sync **5/5**; bridge **3/3**; plugin selftest
  **111/111**; `config validate` valid (non-fatal CLI shared-state cleanup warning after 5 s).
- Build generation `418858e0a02247114def7c046abb00467f50d2bfacb3a697c0fef0c1e80b1f3d`; `index.js`
  105,724 B sha256 `ed553ce5903970b972b158cf86dbbfb5eb22cca04492777d585296b394f2f128`;
  `index.css` 24,114 B sha256 `6affcc8dfa5f356e34194381a87dcd2abe6f9948c9ccac766229e8f439053004`;
  `verify-served.mjs` exit 0. The last loaded UI remains the older six-method plugin (startup log);
  new methods/About card await a Gateway restart/UI reload. No live prompt/provider/desktop/CLI/MCP
  action and no restart/reload.
- Live read-only routes audited before the source slices: `/chat/zero` (Zero composer), `/automations`,
  `/skills`, `/settings/mcp`, `/settings/approvals`, and `/systems` (hold bar, free) render with no
  specialist chat links or duplicate plugin navigation.

### Remaining owner/blocker decisions

1. Connected apps (Gmail/Slack/GitHub/Notion/Linear) need native MCP/OAuth accounts and a native
   probe/app action under host approval. A plugin-side probe is blocked by the trusted-official
   dispatch gate; no probe method is shipped.
2. Mobile companion/pairing and channels need external apps/accounts.
3. CLI drivers need a model/runtime decision and CLI accounts; the native CLI backend is the supported
   path, and model/runtime preservation forbids this pass from changing it.
4. Live desktop viewer needs B3 (authenticated loopback RFB); vision/computer input needs an owner-run
   probe, not an offline claim.
5. Team/cloud/enterprise/branding features are outside the single-user Zero product and enterprise
   license scope.
6. Direct `/chat/operator|researcher` redirect remains a host-route limitation (§17/§18 of the UI
   report); new-chat/settings redirects are live.


## Next-phase candidate decision — 2026-10-26 (no code change)

After the MCP transport/filter review fixes, the highest-value remaining OpenMausBot backend
capability is **live Claude Code/Codex execution inside `/chat/zero`**. It is not implementable in
this phase without an owner decision:

- The installed Gateway already owns the supported seam: native CLI backends (`registerCliBackend`,
  model-scoped `agentRuntime`) and `chat.send`/`chat.abort`. Zero currently binds only the NVIDIA
  provider.
- Enabling a CLI backend requires an owner-approved model/runtime binding; changing model/provider
  configuration is outside this task. A Zero-owned runner would duplicate the native backend or
  bypass its approval/cancellation lifecycle, so none was added.
- CLI install/auth is not proven; no CLI was run.

The next-highest candidate is **live MCP connector reachability/app action**. It is blocked by the
absence of MCP/OAuth accounts and by the trusted-official dispatch gate for a plugin-side probe;
native chat already owns MCP tools/approvals. No connector registry, probe method, or live action was
added.

Other candidates remain platform/product/account-gated: desktop viewer (B3 RFB + owner run), mobile/
channels (external apps/accounts), team/cloud/enterprise (separate product/license), bot-box/VM/cloud
(platform). No placeholder code was added.

**Baseline evidence (no code change; commands re-run in this pass):** UI 82/82; mount 34/34;
redirect 1/1, migration 3/3, sync 5/5; bridge 3/3; plugin selftest 111/111; `config validate` valid;
`verify-served.mjs` exit 0. These are offline/build checks, not live feature evidence. Build
generation `418858e0…`; config SHA `6f051c09…` and model projection `ea75d703…` unchanged. No live
CLI/MCP/provider/account/desktop action or Gateway restart/reload.

**Smallest next authorized action:** owner either (A) approves one exact native CLI model/runtime
binding, CLI install/auth, and one bounded `/chat/zero` turn, or (B) configures one native MCP
server/account and authorizes one read-only native chat tool call. Until then, OMB-01 stays at the
truthful status/catalog boundary and is not claimed as parity.
