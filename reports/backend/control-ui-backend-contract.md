# Zero backend contract for the integrated Control UI

**Original author:** DeepSeek Harness · **Current maintainer:** Qoder (handover under D-013)
**Date:** 2026-10-23
**Decision basis:** D-008 and owner-accepted D-012
**Status:** Static contract reconciled to the pinned OpenClaw protocol and installed release; prior live Gateway/chat/hold proofs remain recorded in `gateway-proof.md` and `build-readiness.md`.

## Product boundary

The existing OpenClaw Gateway remains the sole backend, agent runtime, model route, and canonical owner of session transcripts/history. The Zero UI is a single integrated Control UI shell. No CopilotKit Intelligence runtime, second session database, transcript mirror, separate chat backend, or UI-owned agent-run coordinator is required by this backend contract. HTTP chat-completions stays disabled; the UI uses the Gateway WebSocket protocol.

The current Control UI already owns the primary chat/session surfaces. Zero-specific functionality should be contributed through that shell's supported extension seam, not through a parallel assistant window. Gateway credentials remain in the Gateway/host pairing boundary; never ship `OPENCLAW_GATEWAY_TOKEN` or `ZERO_GATEWAY_KEY` to browser code.

## Minimum Gateway surface for the unified UI

| User-facing need | Gateway owner / methods | Events and rules |
|---|---|---|
| Agent picker | `agents.list` (`operator.read`) | Use the Gateway roster; filter system entries by `kind` when present. Current configured IDs are `zero`, `researcher`, `operator`. |
| Model picker / route display | `models.list` (`operator.read`) | Current config intentionally exposes one selected model to all three roles. Do not add a second UI-side provider catalog. |
| Conversation list and lifecycle | `sessions.list`, `sessions.subscribe`, `sessions.create`, `sessions.patch`, `sessions.delete` | Session key is the durable identity. Use `excludeSubagents` for the ordinary chat list; child sessions can be shown in nested task/activity views. Reconcile on `sessions.changed` and refetch after reconnect. |
| Canonical transcript | `chat.history`; `sessions.messages.subscribe` / `sessions.messages.unsubscribe` | History is fetched from Gateway storage. A cold archive may return `status: "cold"`; show that state instead of treating it as an empty new conversation. |
| Send/stream/stop | `chat.send` (include required `idempotencyKey`, exact `sessionKey`, and `agentId` where needed); `chat.abort` | Subscribe to the selected session before relying on events. The Gateway's `chat` event is the display text projection; clients may advertise `chat-only-assistant-text` to avoid duplicate assistant text from `agent` events. |
| Team activity | `sessions.list` active-run/child-session fields; session `agent` and `session.tool` activity; `sessions.changed` | Render delegated work as nested activity under the owning user session, not as duplicate top-level chats. Treat exact active run IDs as authoritative only when supplied. Tool payloads may be intentionally bounded or omitted. |
| Skill inventory and inspection | `skills.status` (`operator.read`); Workshop/library content: `skills.workshop.read` / `skills.library.read` (`operator.read`, require a known skill/version) | Show eligibility, missing requirements, config checks, and sanitized install options. **`skills.files.get` is absent from the installed release** (it exists only in the older checkout docs); there is no general "read any installed skill file" RPC. Do not build an affordance that assumes one. |
| Skill discovery/install | `skills.search`, `skills.detail` (`operator.read`); `skills.install`/`skills.update` (`operator.admin`); personal library mutations under `skills.library.*` (`operator.write` generally, verify each row) | Reuse the built-in skills and Control UI plugin management flow. Inspect publisher metadata/scan before install; install individually. Do not bulk-import a reference repository. Admin install runs only through the Control UI's per-method scope upgrade. |
| Memory search/read/status | `memory.search` v2, `memory.get`, `memory.status` (`operator.read`); `doctor.memory.status` (`operator.read`) | Use the built-in Memory Core index. Current config is **FTS-only** (`memory.search.provider:"none"`) so recall works without an embedding key or model download. Search is scoped to **memory files** by default (`searchSources=["memory"]`); session transcripts are indexed but not searched unless `memory.search.sources:["memory","sessions"]` is set. Pass `agentId` to every memory method; `memory.get` takes a workspace path (`USER.md`), not a chunk id. Do not create a second memory index. Existing user-authored agent workspace memory files remain the durable editable source. There is no generic memory-edit RPC in this protocol surface. |
| Usage and cost | `usage.status`, `usage.cost`, `sessions.usage`, `sessions.usage.logs` | These are reporting surfaces. Display measured provider/session usage; do not invent estimates as if they were provider billing facts. |
| Zero computer hold | `zero.computer.control` via the Zero Policy plugin (`operator.write`) | `status`/`take`/`release`; snapshot scope is global and `recent` is the bounded audit view. `controlLeaseId` is only present when the caller owns the hold. Display that the hold applies across sessions. |
| Human desktop view | `desktop.observe` and ticketed relay; `desktop.release` | Separate from chat and hold. The pinned release requires `operator.admin` for observe/release. Do not widen the ordinary long-lived chat connection's scope to make this work; use Control UI's existing scope-upgrade behavior. |

**Reconnect authority (2026-10-23):** the Gateway releases a human hold when the owning connection closes, even with no `pagehide`, and arms `resumeSnapshotRequired:true`. A reconnecting client keeps its connect-time operator scopes; the first `status` on the new connection is authoritative. Do not retain a cached `owned:true`/`controlLeaseId` across a connection identity change: force one status read, clear the snapshot while disconnected, and render a checking state until it returns. `controlLeaseId` must never be shown, stored, or acted on when `owned:false`.

References: `upstream/openclaw/docs/gateway/protocol/rpc-session-control.md`, `rpc-bootstrap-and-events.md`, `rpc-talk-config-and-agents.md`, `rpc-system-and-channels.md`, `operator-methods.md`, `docs/plugins/feature-plugins.md`; installed runtime is `backend/node_modules/openclaw` 2026.10.6. OpenClaw Gateway remains the authority for method authorization and state. Plugin Gateway methods do not get host-side parameter/result schema validation; Zero Policy validates its own method contract.

## Control UI plugin packaging finding for OpenCode

The official native Control UI plugin declaration is `openclaw.plugin.json` → `controlUi.entry` (+ optional styles), generated from package metadata/build output. It is loaded as a same-origin native UI contribution inside the connected Gateway's Control UI; it is not a separate app window. The custom plugin UI Lab flag defaults off for custom/local plugin assets (`gateway.controlUi.experimental.customPlugins: true` enables them). Bundled plugin UI has different origin treatment.

A browser-only package is not a valid native plugin install by itself: the package manifest/install path requires a non-empty `openclaw.extensions` runtime entry. Recommended package boundary is a distinct `zero-control-ui` plugin with a tiny backend registration entry and its own Control UI bundle/manifest. Keep this separate from `zero-policy` so computer policy and presentation remain independently owned. OpenCode owns its package and app assets; backend can verify the generated manifest and adjust the Gateway template when the accepted bundle/config proposal is ready. Do not add `controlUi` paths to the `zero-policy` manifest as a shortcut.

Native plugin UI is trusted JavaScript in the Control UI origin and shares that operator connection's Gateway authority. Keep it same-origin, use the existing host APIs and Gateway scopes, and avoid putting raw bearer credentials into plugin/browser storage.

## BE-03 implementation posture

1. **Skills:** reuse OpenClaw's existing Settings/Plugins/Skills discovery, inspection, and install/update RPCs. Add a Zero-specific wrapper only if the integrated UI proves a missing interaction or review gate. Install only individually reviewed skills.
2. **Memory:** preserve the built-in provider/index and workspace files. `memory.search/get/status` cover discovery/read health; there is no general edit RPC. Before implementing a memory editor, define a narrowly scoped operation that edits only the selected agent's documented memory files and retains OpenClaw's file ownership/refresh semantics. Do not add SQLite/JSON memory sidecars or rewrite the search provider.
3. **Model routing:** `models.list` and per-agent model settings are authoritative. Current owner choice is a single NVIDIA NIM model for all configured roles; alternate providers may be added through the configured gateway after capability proof, not as a second UI routing system.
4. **Budgets/audit:** reuse Gateway usage RPCs and the Zero Policy plugin's existing bounded computer-action counters/audit ring. Do not claim token/cost enforcement from these reporting APIs. Add a custom model budget only after a verified Gateway hook can enforce it at the model-run boundary and a persistence owner is selected.
5. **Team workflow:** retain built-in `sessions_spawn`, `agents.list`, and session activity. `TEAM-00` stays conditional until live acceptance shows a concrete built-in workflow gap.

## Verification in this turn

- `node backend/plugin/selftest.mjs`: **94 passed, 0 failed**.
- `node backend/scripts/preflight.mjs --json`: **30 pass, 0 fail, 2 warn**. Current environment has the runtime installed and config/plugin checks pass; port 18789 is free; `ZERO_GATEWAY_KEY` and `OPENCLAW_GATEWAY_TOKEN` are absent in this process.
- Therefore no live provider call, Gateway run, or delegation test was attempted this turn. Previous live model, app bridge, and `zero.computer.control` proofs remain as documented historical evidence; they do not imply the Gateway is running now.

**D-013 recheck (Qoder, 2026-10-23):** the runtime state has changed since the handoff above. The Gateway is live on loopback and the app link is paired/connected. Checks this turn: plugin selftest **94/94**; preflight **32 checks — 29 pass / 3 warn / 0 fail** (warnings: live Gateway owns 18789, and both credential variables are absent in the verifying shell); `zero.computer.control` take/release/status round trip succeeded with the lease never printed; live plain chat stored an assistant turn in canonical history. Delegation is proven in the canonical transcripts (three researcher children returned `RESEARCH_OK`, parent stored the completion results); the app SSE prototype's 45 s run cap is a prototype limitation, not a Gateway gap. Memory is now explicitly FTS-only and index-valid. Full evidence: `build-readiness.md` §D-013 and `personalization.md`.

## Next

The native contribution is wired and live. OpenCode's UI-01 continues against the same canonical
agents/sessions; backend's open items are BE-02 A6/A7 plus trusted-policy firing (both need CU-01)
and BE-03's reviewed external skill install (owner choice). Do not create a duplicate provider,
session, transcript, or memory owner.

## zero-control-ui package validation — 2026-10-23 (Qoder)

OpenCode's native slice in `app/zero-control-ui/` was validated against the **installed release**
(`openclaw@2026.10.6`, `fe06181`) using the host's own loader code. I did not edit the package and
did not restart the Gateway.

### Passed

| Check | Evidence |
|---|---|
| Browser API surface | `browser.js` uses only declared `ControlUiHost` members: `connection.connected/canWrite`, `agents.rows`, `sessions.observe/open/create`, `subscribe`, `ui.registerPage/registerNavigation` (`dist/plugin-sdk/control-ui.d.ts:283-376`). |
| Session query/row fields | `archived`, `configuredAgentsOnly`, `includeGlobal`, `includeLastMessage`, `limit` are all in `ControlUiSessionListQuery`; `key`, `agentId`, `label`, `displayName`, `hasActiveRun` are in `SessionRow` / `ControlUiSession`. |
| `sessions.open` params | `{sessionKey, agentId}` matches `BoardGetParams` (`index-_LB5F-l3.d.ts:2547-2550`). |
| Navigation/page shapes | `ControlUiNavigationItem` accepts `icon`, `order`, `defaultVisible`; `ControlUiPage` accepts `{id,label,mount}` and the mount gets `{host, signal, presented, …}`. |
| Runtime extension entry | `index.js` imports `definePluginEntry` / `emptyPluginConfigSchema`, both exported by `openclaw/plugin-sdk/plugin-entry`; the host installs SDK aliases for plugin parent roots at load time (`plugin-module-loader-cache-P8KfvwLe.mjs:266-299`). The CLI validator's resolution failure is expected outside that loader context. |
| Manifest activation | `activation.onStartup: true` is a valid normalized field (`manifest--jjvMb9t.mjs:521-539`). |
| Built assets | With `controlUi` merged into a scratch copy, the host's own `loadPluginManifest` returned `ok`, and `readPluginControlUiAssets` resolved `index.js` + `index.css` (5,752 bytes) from `dist/control-ui/<sha256>/`. |
| Bundle hygiene | 3,406-byte minified ESM; no bare imports, `fetch`, `XMLHttpRequest`, storage, `innerHTML`, `eval`, token names or key prefixes. It renders with `textContent` only. |

### Packaging defect — fixed and verified

The loader reads **only `<pluginRoot>/openclaw.plugin.json`** (`manifest--jjvMb9t.mjs:913,983-996`),
and `record.controlUi` is taken from that manifest (`manifest-registry-build-BGqXwGUm.mjs:375`). The
package originally wrote the declaration only to `dist/openclaw.plugin.json`, which nothing reads, so
it loaded as a backend extension with **no UI contribution**. OpenCode fixed `build.mjs` at 07:37 IST
to merge `{controlUi}` (and `uiCapabilities`) into the root manifest while preserving
`id/name/version/configSchema/activation`.

Re-validated against the installed release at 07:42 IST:

| Check | Result |
|---|---|
| `loadPluginManifest(root)` | `ok`; id `zero-control-ui`, version `0.1.0`, `uiCapabilities ["page","navigation"]`, `controlUi` entry + style present |
| `readPluginControlUiAssets` | **2 assets, 13,412 B total** (`index.js` 8,791 B, `index.css` 4,621 B); no declared asset missing |
| Bundle hygiene (new build) | no imports, `fetch`, `XMLHttpRequest`, storage, `innerHTML`, `eval`, cookie or WebSocket use; renders via `textContent` |
| Entry shape | `dist/control-ui/<sha256>/index.js`; style in the same asset directory |

### Backend wiring — applied and verified live (2026-10-23)

Applied to `backend/config/openclaw.template.json` first, then `backend/config/openclaw.json`
(semantically identical afterwards):

```jsonc
"plugins": {
  "load": { "paths": ["E:\\zero\\backend\\plugin", "E:\\zero\\app\\zero-control-ui"] },
  "entries": {
    "zero-policy": { /* unchanged */ },
    "zero-control-ui": { "enabled": true }
  }
},
"gateway": {
  "controlUi": {
    "experimental": { "customPlugins": true }
  }
}
```

**No Gateway restart was needed.** `gateway.reload.mode` is `hybrid`; the valid edit hot-applied to
the running process (PID 14700, started 07:10:39, unchanged). Live proof through the Gateway's own
RPC surface:

| Check | Evidence |
|---|---|
| `plugins.controlUi.list` | catalog revision `9edd48eb…`, one plugin `zero-control-ui`, entry + style URLs, `uiCapabilities ["page","navigation"]`, `diagnostics []` |
| `plugins.controlUi.reload {pluginId}` | revision `152263ab…`, plugin revision `784dadb1…`, `diagnostics []`; the host re-read the root manifest and both assets successfully |
| Asset route without cookie | `401` for both entry and style — the route exists and is auth-gated, not `404` |
| `plugins list` / `inspect` | `zero-control-ui` enabled, `activated: true`, `status: "loaded"`, exposes `controlUi` + `uiCapabilities` |
| Preflight | 32 checks: 29 pass / 3 warn / 0 fail (same expected warnings) |

Security note: `customPlugins` lets local plugin JavaScript run with the signed-in operator's
Gateway authority. It is enabled only for this reviewed local package and remains a deliberate
experimental flag; disabling it later removes the page with a `custom-plugin-ui-disabled`
diagnostic while the Gateway keeps running.

Trust note: `plugins list` reports `trust.reason: "record-missing"` (config-path origin) and a
`persisted-registry-stale-policy` warning, because this is a config-loaded path rather than a
store-installed package. Load, activation, and native UI are unaffected; a managed install would
use `plugins install` / `plugins registry --refresh` later.

### Rebuild re-check — `5b0f4121…` (2026-10-23 07:58 IST)

OpenCode's later UI-03 build changed the asset directory. Re-validated against the installed
release without editing the package:

| Check | Result |
|---|---|
| `loadPluginManifest(root)` | `ok`; id `zero-control-ui`, `uiCapabilities ["page","navigation"]` |
| `readPluginControlUiAssets` | **2 assets, 18,538 B total** (`index.js` 13,415 B, `index.css` 5,123 B); no declared asset missing |
| Bundle hygiene | no `fetch`/XHR/storage/`innerHTML`/`eval`/cookie use; no bare imports |
| Live `plugins inspect zero-control-ui` | enabled, `activated: true`, `status: "loaded"`; `controlUi.entry` = `dist/control-ui/5b0f4121…/index.js`, new style present |
| Preflight | 32 checks: 29 pass / 3 warn / 0 fail (unchanged) |

Two tooling caveats, neither a product defect:

- `plugins reload zero-control-ui` through the CLI failed in **prepare** with
  `EPERM … symlink … .openclaw\tmp\plugin-captures\…` and “replacement not applied”. That is a
  Windows symlink-permission limit of the managed capture path; the running Gateway already
  reports the new manifest entry, so no retry is needed.
- `plugins validate --root` returns `valid:false` with “plugin entry does not expose tool or
  feature authoring metadata”. The CLI validator expects a tool/feature plugin; the host's plugin
  loader accepts this UI-only package. Treat the loader result above as authoritative.

### Served-bundle reconciliation — `bd289974…` (2026-10-23 08:30 IST)

OpenCode replaced the manifest again while the previous check was being written. After the
intentional Gateway restart, live `plugins inspect zero-control-ui` reports:

| Check | Result |
|---|---|
| Live `controlUi.entry` | `dist/control-ui/bd28997490e347994765178037a2fdc287a8ad7a72fef8508451968110406867/index.js` |
| Live style | same asset directory, `index.css` |
| On-disk assets | **13,606 B JS + 5,123 B CSS = 18,729 B**; manifest mtime `08:05:17 IST` |
| Plugin state | `status: "loaded"`, `uiCapabilities ["page","navigation"]` |
| Catalog path | OpenCode's `f26b42cb…` is the Control UI catalog revision, not the asset hash |

Correction to the 07:58 row above: it paired the **`5b0f4121…` label** with the 13,415 B size.
`5b0f4121…` (and `5a7fd326…`) are the older 8,791 B JS pre-card bundles; `40f9c589…` is the
13,415 B JS intermediate card build. The currently served final card is `bd289974…`. This was a
reporting-label error only; the package itself was not edited by me.

### UI availability (D-014)

D-014 changed the local Gateway to `gateway.bind: "loopback"` and `gateway.auth.mode: "none"` and
removed the token/password prompt. OpenCode live-confirmed `loginGateCount: 0` on `/`, the Zero
Team route, and `/systems`. No token was entered or persisted in a browser. The Gateway remains
loopback-only; this section supersedes the earlier "token gate" note.

### Served-bundle revision digest — canonical reconciliation (2026-10-23 09:28 IST)

OpenCode's `6e4ce04e…` and the manifest asset directory `725de545…` were both correct; they are
different scopes. The canonical served identifier is the **revision digest**, not the manifest
directory name and not `sha256(index.js)`.

| Scope | Example (08:52 build) | Example (09:20 build) |
|---|---|---|
| Manifest / build-output asset directory | `725de545…` | `347530c4…` |
| `sha256(index.js)` only | `615a6eb8…` | `ecfd215f…` |
| **Gateway served revision** | **`6e4ce04e…`** | **`1a1d2ce3…`** |
| Control UI catalog revision | `a19220a4…` | `9590177e…` |
| Live `entryUrl` revision segment | `…/6e4ce04e…/index.js` | `…/1a1d2ce3…/index.js` |

Algorithm, verified in the installed release (not inferred from the UI report):
`dist/control-ui-plugin-assets-DG79lyrs.mjs:46-73` (`snapshotBrowserBuild`) and
`dist/control-ui-assets-CFCf9kiS.mjs:11-45` (`readPluginControlUiAssets`). It hashes
`JSON.stringify({ declaration, uiCapabilities })`, then each admitted `.js`/`.css` asset in the
entry directory sorted by relative name, feeding `name + NUL + byteLength + NUL + body` into the
same SHA-256. The result is the `revision` and the URL segment served by
`/__openclaw__/plugins/control-ui/zero-control-ui/<revision>/…`.

Reproducer added in the backend lane:
`node backend/scripts/control-ui-digest.mjs --root app/zero-control-ui --expect <revision>`.
It is read-only (no Gateway call, no network, no config change) and exits `1` on mismatch.

Live reconciliation this turn:

- **08:52 build:** manifest `725de545…`; `index.js` 22,053 B + `index.css` 7,119 B = 29,172 B;
  helper/one-off revision `6e4ce04e4d58…`; live catalog `a19220a4…`, `entryUrl` segment
  `6e4ce04e…`, inspector entry `725de545…`, `diagnostics []`.
- **09:20 build:** OpenCode rebuilt while this was being verified. Manifest `347530c4…`;
  `index.js` 27,605 B + `index.css` 9,662 B = 37,267 B; helper revision
  `1a1d2ce3a6a1…` with `--expect` exit `0`; live catalog `9590177e…`, `entryUrl` segment
  `1a1d2ce3…`, inspector entry `347530c4…`, `diagnostics []`. I did not restart the Gateway or run
  a plugin reload; the running Gateway was serving the new build at the next check.

**Canonical result as of 09:28 IST:** served revision `1a1d2ce3…` from manifest asset directory
`347530c4…`, catalog `9590177e…`, no diagnostics. The earlier `725de545→6e4ce04e` pair was
live-verified before the rebuild. A rebuild invalidates the recorded hash by design; OpenCode
must freeze the final bundle, paste the helper output, and re-run the comparison after any later
build. No backend configuration change is implied by any of these hashes.

**Re-check 09:31 IST:** manifest still points at `347530c4…`; the helper still returns
`1a1d2ce3…` (exit `0` against `--expect`). No rebuild had landed since 09:20.


## zero-control-ui runtime registration review — 2026-10-25 01:55 IST (Qoder)

Read-only review of OpenCode's new `zero-control-ui` Gateway methods; no Gateway start/reload, no
config/secret write, no provider call, no credential read.

### Source evidence (wired, but not proof of runtime registration)

- `app/zero-control-ui/openclaw.plugin.json` declares `activation.onStartup:true` and a browser
  `controlUi.entry`; `app/zero-control-ui/package.json` declares `openclaw.extensions:["./index.js"]`.
- `app/zero-control-ui/index.js` default plugin entry imports
  `registerZeroUiRuntime` from `runtime-core.mjs` and calls it from `register(api)`.
- `runtime-core.mjs` defines exactly four methods and registers each one only when
  `api.registerGatewayMethod` exists:
  - `zero.ui.providerNames.list`
  - `zero.ui.providerNames.set`
  - `zero.ui.providerNames.delete`
  - `zero.ui.providerCredentialRef`
- Live config (read-only, no secrets printed) has `plugins.entries.zero-control-ui.enabled:true`
  and `E:\zero\app\zero-control-ui` in `plugins.load.paths`. No config change is required for the
  source to be eligible.
- `index.js`/`runtime-core.mjs` parse cleanly (`node --check`).

### Runtime evidence (methods are not currently registered/callable)

- **No Gateway is running:** `openclaw gateway status` reports `Runtime: stopped` and
  `connect ECONNREFUSED 127.0.0.1:18789`; no `openclaw.mjs gateway run` process is present.
  Therefore no Gateway method, old or new, is callable right now.
- `plugins inspect zero-control-ui --json` reports `activated:true`, `status:"loaded"`,
  `activationSource:"explicit"` from persisted metadata; this is **not** proof that Gateway methods
  are registered in a live process.
- The 2026-10-24 Gateway log lists `zero-control-ui` among the loaded plugins at recent starts, but
  contains **no** `[zero-control-ui] runtime registration requested:` line, while
  `zero-policy` and `zero-provider-manager` registration lines are present. This is consistent with
  the PM-01 handoff's statement that Gateway-method registration is the remaining activation gate,
  but the absence of an info line alone is not treated as runtime proof.
- No behavioral call to the new methods was made: `set`/`delete` mutate the plugin keyed store, and
  the Gateway is stopped. The registration status is therefore **not registered / not callable**
  until a live behavioral check.

### Supported activation path

1. Owner-authorized **Gateway start/restart** with the current entry (the Gateway is currently
   stopped, so this is a start). No config/secret change is needed: entry enabled, load path present,
   `activation.onStartup` true.
2. On startup `register(api)` runs; `registerZeroUiRuntime` should log
   `[zero-control-ui] runtime registration requested: methods=zero.ui.providerNames.list,zero.ui.providerNames.set,zero.ui.providerNames.delete,zero.ui.providerCredentialRef`.
3. Behavioral registration check (read-only, do not use `set`/`delete`):
   `zero.ui.providerNames.list {}` → expected `{names:{}}` or stored names;
   `zero.ui.providerCredentialRef {providerId:"zero-gw"}` → expected `{ok:true,ref:{source:"env",provider:"default",id:"ZERO_GATEWAY_KEY"}}`
   or a safe `ok:false` reason; no secret value is returned.
4. `plugins.controlUi.reload` is **browser-asset/catalog only** (`plugins-control-ui-DAD4K3zn.mjs:47`),
   and `plugins reload` is package-maintenance gated (this plugin previously returned
   `record-missing`). Neither is the supported path for loading the Node entry. A Gateway start is.

### Owner decisions still required

- **Authorize the Gateway start/restart** to load the current `zero-control-ui` Node entry and
  register the four methods; then run the read-only behavioral check above. Until then the methods
  are unavailable and PM-01 cannot claim server-side registration.
- **Resolve the orphaned `ZERO_PROVIDER_ZERO_GW_API_KEY` store entry** (remove/re-scope after
  confirming `zero-gw` does not use it, or accept that `nvidia` stays fail-closed) before any
  owner-authorized Discover retry, per the PM-01 handoff.

PM-01 remains **READY FOR REVIEW**; this review does not accept it. Live config sha
`ad1536d86a9ef1de` (mtime 2026-10-24 10:39:32) was read only; no live binding/config/secret change.

### Live verification — owner-authorized normal-profile run (2026-10-25 02:00–02:04 IST)

The owner explicitly authorized controlled testing on the current normal Windows profile for this
run and instructed the stopped Gateway to be started. No config/model binding/secret was changed.

- **Gateway:** started with the documented PowerShell launcher (`Start-Process` with
  `OPENCLAW_STATE_DIR=backend/.openclaw`, `OPENCLAW_CONFIG_PATH=backend/config/openclaw.json`, and
  `ZERO_GATEWAY_KEY` read from User scope into the child only; value never printed). PID **19764**,
  created `02:00:41`; health `OK` after startup; config sha `ad1536d86a9ef1de` (mtime 2026-10-24
  10:39:32) unchanged; no `config.patch write`.
- **Runtime registration:** the 2026-10-25 log contains
  `[zero-control-ui] runtime registration requested: methods=zero.ui.providerNames.list,zero.ui.providerNames.set,zero.ui.providerNames.delete,zero.ui.providerCredentialRef`.
  The four methods are registered in the live process.
- **Read-only calls (no `set`/`delete`):**
  - `zero.ui.providerNames.list {}` → `{"names":{}}` (empty durable store; read-only).
  - `zero.ui.providerCredentialRef {"providerId":"zero-gw"}` → `{"ok":false,"providerId":"zero-gw","reason":"inline"}`.
    This is a **fail-closed** result: no SecretRef identity was returned and no credential value was
    exposed. The runtime config snapshot presents zero-gw's `apiKey` as a non-object value, so the
    method reports `inline`; the UI's reconstruction/fallback path must remain in use. Do not treat
    this as a successful exact-ref lookup.
- **Initial CLI behavior:** the first list/ref calls hit the CLI's default 10 s response deadline
  and reported “took too long”; the read-only calls were retried once with `--timeout 45000` and
  returned the values above. No provider call, discovery, secret read or config write occurred.
- **Hold status (read-only):** `zero.computer.control {"action":"status"}` returned
  `held:false`, `owned:false`, `scope:"global"`, `resumeSnapshotRequired:false`, counters zero and
  `recent:[]`. No take/release was performed.
- **Owner decisions:** (1) decide whether `providerCredentialRef`'s `inline` result for `zero-gw`
  is acceptable fail-closed behavior (UI fallback) or needs a method-side fix; (2) resolve the
  orphaned `ZERO_PROVIDER_ZERO_GW_API_KEY` store entry; (3) for CU-01 hold-recovery k7, the owner
  must write `computer/spike/designated-environment.json` — the normal-profile authorization did
  not create it and it was not forged. PM-01 remains **READY FOR REVIEW**.

### `providerCredentialRef` source analysis — 2026-10-25 02:10 IST (value-free)

Follow-up to the live `{"ok":false,"reason":"inline"}` result. No credential value was read,
printed, hashed, copied or logged; only types/keys/reason and source code were inspected.

**Source config vs runtime config.** The live config file still stores zero-gw's `apiKey` as a
SecretRef **object** with keys `source`,`provider`,`id` (source `env`, id matches the SecretRef
grammar; value not read). The plugin handler returned `reason:"inline"` because
`classifyProviderCredential` only sees a non-empty **string** at `apiKey`: its `typeof apiKey ===
"string"` branch. It did not see the original object.

**Installed API contract.** `OpenClawPluginApi` exposes `config` and
`runtime.config.current(): DeepReadonly<OpenClawConfig>`; the latter is documented as the “current
process runtime config snapshot.” There is no plugin-facing accessor for the source/raw config
snapshot (`getRuntimeConfigSourceSnapshot` is internal). `config.get` is not a substitute: the
handler builds its response with `redactConfigSnapshot` (`config-get-response-BfJTLgep.mjs:8`).
The Gateway runtime publishes the secrets-activated config snapshot at startup
(`activateRuntimeSecrets` / `setAppliedRuntimeConfigSnapshot`); plugin handlers receive that runtime
snapshot.

**Conclusion.** `api.runtime.config.current()` supplies a **string**, not the original
`{source, provider, id}` object. Whether that string is the resolved secret or an opaque marker
cannot be determined without reading it (forbidden), but it must be treated as resolved/opaque and
never exposed. The method must remain fail-closed for such providers. There is no supported
plugin-runtime source for the original reference.

**Supported remedy (OpenCode-owned):** persist the non-secret reference identity at the moment the
plugin/UI creates or updates a provider (`{source:"store", provider:"default", id:"<uppercase name>"}`)
in the plugin-scoped durable keyed store (alongside display names), and have
`providerCredentialRef` read that identity. Do **not** reconstruct it from runtime config, the
resolved value, or host conventions. For providers that predate this persistence (including
`zero-gw`), return `unknown`/`not-recorded` and keep the existing same-host fail-closed fallback; the
owner can re-save the provider to record the identity without changing the key. A host-side raw-ref
accessor would need an upstream change and is outside this lane.

No `providerNames.set/delete`, config write, secret read, provider call or NVIDIA Discover was made;
the Gateway remains PID 19764 and config sha `ad1536d86a9ef1de` is unchanged. PM-01 stays **READY
FOR REVIEW**.

## Credential-reference identity persistence contract — 2026-10-25 (Qoder, backend review)

This is the backend-side contract for OpenCode's PM-01 fix. Qoder did not edit `app/` and made no
live config/secret/provider change. Verified against the installed 2026.10.6 schemas:

### Exact identity from the supported write path

- `secrets.store.set` request is `{name, value, kind:"secret", allowedHosts?}`; `name` must match
  `^[A-Z][A-Z0-9_]{0,127}$` (same grammar as env/store SecretRef IDs). Its response is only
  `{ok:true, reloaded, warningCount}` — **it does not echo the name or a ref**.
- The exact identity must therefore come from the **request**: for a store-backed key,
  `{source:"store", provider:"default", id:<name supplied to secrets.store.set>}`. The store provider
  alias is `default`; do not derive it from runtime config or `secrets.store.list`.
- For an env-backed key, identity is the exact `{source:"env", provider, id}` supplied for the
  provider; no secret write occurs.
- Never read, log, hash or persist `value`; persist only `{source, provider, id}`.

### Ordering and confirmation

1. **Store/replacement write (only when a new key is supplied):**
   `secrets.store.set` with the uppercase generated name and host allowlist. On failure stop; no
   config or metadata write.
2. **Config patch:** `config.patch` with the provider object and the exact SecretRef. Require
   `ok:true` **and** the expected provider path in `changedPaths`; the response `config` is redacted
   and must not be used to recover identity. **Do not auto-delete the store entry on a failed
   patch.** `secrets.store.set`/`secrets.store.delete` are upsert/delete by name; the mutation result
   does not report create-versus-replace, and a pre-write existence check is not proof under a
   concurrent writer or an overwritten fixed name. The fixed `ZERO_PROVIDER_<ID>_API_KEY` name can
   already exist, so deletion could destroy a still-referenced credential. On a failed patch, leave
   the credential untouched, report `partial: secret-written, config-not-committed` with the name
   only (never the value), and offer an idempotent retry that re-patches the same exact identity.
   Only a name that the implementation can prove was previously absent and not overwritten could be
   deleted; the current fixed-name flow cannot prove that. If the patch persisted but runtime
   application failed (`ok:false` + `details.persistedConfig`), keep the secret, report partial
   state, and recover via
   config apply/restart; do not persist identity yet.
3. **Metadata persistence:** only after step 2 is confirmed, persist the non-secret identity in a
   dedicated plugin keyed-store namespace (for example `provider-credential-refs`), value exactly
   `{source, provider, id, updatedAt}`. If this write fails, config+secret are already live but no
   identity is recorded: report `partial: config-committed, identity-not-recorded`, keep the exact
   ref in memory for the retry, and make retry idempotent (metadata only; do not re-write the secret
   or config). Never fall back to runtime config values.

### Edit/delete behavior

- **Key-omitted edit:** omit `apiKey` from the patch (merge preserves the existing ref) and do not
  write a secret. After the patch is confirmed, preserve the existing recorded identity byte-for-byte;
  if none is recorded (legacy), leave it unrecorded.
- **Provider deletion:** delete config first; after confirmation delete only the metadata row and,
  when this plugin created the store entry and no config references it, the store secret. Never
  touch `ZERO_PROVIDER_ZERO_GW_API_KEY` or legacy refs.
- **Legacy/redacted providers:** `zero.ui.providerCredentialRef` must return
  `{ok:false, reason:"not-recorded"}` (not `inline`) when no identity row exists; the UI keeps the
  same-host fail-closed fallback. Do not migrate, rewrite or infer `zero-gw`.

### Gateway-method contract change (coordinate with Qoder)

The current getter reads runtime config, which supplies a resolved/opaque **string**; the source
`{source,provider,id}` is not exposed by the plugin API and `config.get` is redacted. Recommended
supported shape:

- `zero.ui.providerCredentialRef` (existing getter): read the persisted identity row first; if absent
  return `not-recorded`; never read `apiKey` values.
- `zero.ui.providerCredentialRef.set {providerId, ref:{source,provider,id}}`: closed params; validate
  provider id and ref grammar; store only the identity + `updatedAt`; idempotent.
- `zero.ui.providerCredentialRef.delete {providerId}`: remove the metadata row only.

Adding methods requires a later Gateway restart to load the Node entry; offline tests can be written
now, but runtime availability is a separate activation gate.

### Offline test matrix for OpenCode

New-provider save (store ref persists only after config ok); credential replacement (new identity
overwrites only after config ok; no delete on replacement failure); key-omitted edit (no secret write,
identity preserved); failed config patch (no metadata; **no auto-delete** because create-vs-replace is not provable; partial state + idempotent config retry; deletion only with a proven-new name); failed metadata write (config committed, `not-recorded`/partial surfaced, idempotent retry);
legacy unknown identity (`not-recorded`, same-host fallback); edit/delete never touches zero-gw or the
orphan store entry. No live provider call/restart required for these tests.

## Computer-hold live evidence - 2026-10-26 (OpenCode, UI/backend integration run)

Owner-authorized bounded run on the normal interactive Windows profile, against the existing
fresh-workspace Gateway and the existing native Control UI. No second Gateway, viewer, relay,
route, or desktop service was created. This section records what the backend actually did; it is
not an acceptance of CU-01, CU-02, or UI-05.

### Runtime and wiring

- Gateway listener PID `17492` (launcher `6840`), loopback `127.0.0.1:18789`, `auth.mode:"none"`,
  config `.zero-data/fresh-workspace/openclaw.json`, state `.zero-data/fresh-workspace/gateway-state`.
- Paired node `36196f0b071a4fc7fdc51c7343db1185c21346eec48e8eaaca91fb02e9a00f71`, connected and
  paired, advertising exactly `computer.act,screen.snapshot,desktop.stream`;
  `computerUse.provider.id = "cua-computer"`.
- `plugins.controlUi.list` -> catalog `926316ec9c98d4779da8b5f5787d32ac1bd18e48b5f7ff1478d728dec0c0cbaa`,
  plugin revision `3d62356d71561fc92587b6d1a2e48d6e77d4ff81bdf15b50b4e46dc1a05ddbc4`;
  served `index.js` byte-identical to the local build (100,327 B,
  sha256 `ddb9ae528aff697d44816198c1da2b1925822053b966f0cea9bcbca28d9a7422`).

### `zero.computer.control` behaviour proven live

| Step | Observed backend response |
|---|---|
| `status` while free | `held:false, owned:false, scope:"global", resumeSnapshotRequired` present, counters intact |
| `take` from Control UI tab A | `held:true`; tab A renders `held-this-client`; `Return control` enabled |
| `status` from a separate connection during the hold | `held:true, owned:false` - ownership is per connection, not global |
| Tab B after take | `held-other`; Take and Return disabled; copy states the hold is global and affects all sessions |
| `release` from tab A | both tabs converge to `free`; `resumeSnapshotRequired:true`; copy requires a fresh capture before agent input |
| Close tab A without `release` | `held:false`, `resumeSnapshotRequired:true`, `stats.releasedByDisconnect` incremented, newest `recent[]` row `{kind:"lease", action:"release", reason:"connection-closed", decision:"allow"}`; surviving tab converged to `free` |

Clean H1-H3 ordering was confirmed separately: `take` with `resumeSnapshotRequired:false` (gate
started clear) -> close the owning tab -> new connection reads `held:false`,
`resumeSnapshotRequired:true`, `releasedByDisconnect` 1 -> 2.

The hold is connection-bound. A CLI `gateway call` hold releases as soon as that CLI connection
closes, so hold-refusal testing must use the Control UI (or another persistent client). Raw
`node.invoke` remains outside the backend policy path by design and was not used as a substitute.

### Exact blockers (not backend regressions)

1. **Agent refusal and fresh-capture recovery are offline-tested only.** The installed gate is
   `modelHasVision === false -> no computer tool` (`dist/computer-tool-BYo9lKTd.mjs`). The
   configured route `nvidia/z-ai/glm-5.3-flash` is `input:"text"`, and a bounded Operator turn on
   that route received no `computer` tool. Two catalog entries advertising `text+image` were tried
   as explicit one-turn `--model` overrides (no config change) and both failed at the provider:
   `nvidia/moonshotai/kimi-k2.6` -> 404 "This model was not found";
   `nvidia/minimaxai/minimax-m3` -> 410 "The request took too long". Consequently
   `stats.refusedByHold` and `stats.refusedByStaleFrame` stayed 0, no agent desktop input was
   issued, and no Notepad document was created. The pre-existing `API.txt - Notepad` window was
   not touched.
2. **Live desktop view is unavailable.** `desktop.observe` returns
   `UNAVAILABLE: desktop stream loopback RFB server is unavailable on port 5900`; the native
   Desktop panel shows "Set up a desktop server". `desktop.stream` needs `desktop.host.enabled`
   plus an authenticated loopback RFB server. No VNC was installed and no UAC/admin prompt was
   attempted.

### Evidence labels

- Live-tested this run: hold status/take/release RPC, per-connection ownership, global scope
  reporting, disconnect release with audit row, served bundle identity, node command advertisement.
- Offline-tested only: `computer-hold:human-control` refusal and `computer-hold:stale-frame`
  recovery (backend `plugin/selftest.mjs` 111/111; UI `computer-hold.test.mjs` 20/20).
- Source-verified only: vision gate, catalog model metadata, RFB prerequisite.

UI-05 remains READY FOR REVIEW; CU-01 PARTIAL; CU-02 unchanged. No self-acceptance.

## Gap matrix and re-audit closeout - 2026-10-26

**Scope:** read-only re-audit of the live Gateway plus one bounded chat send/stop, one hold
take/release, and one native session rewind. No backend source changed in this pass; the matrix is
`reports/gap-matrix-2026-10-26.md`.

**Backend/runtime facts**

- `zero.computer.control { action:"status" }` returns `held:false`, `owned:false`, `scope:"global"`,
  `resumeSnapshotRequired:true`, `takes:4`, `releases:4`, `releasedByDisconnect:2`, all refusal
  counters `0`. The hold taken for the earlier H4 attempt was released at 14:29:01 IST.
- Paired node `36196f0b...a00f71` is connected and approved with exactly
  `computer.act,screen.snapshot,desktop.stream`; `computerUse.provider.id = "cua-computer"`.
- `plugins.controlUi.list` returns catalog `926316ec...` with plugin revision
  `3d62356d...` and `uiCapabilities: []`.
- `models.list {agentId:"zero"}` returns `nvidia/z-ai/glm-5.3-flash` (`available:true`).

**Chat path**

- `chat.send` on `agent:zero:main` was accepted (runId `0046f031-...`); Stop produced "Interrupted".
- The provider produced no tokens: 45 s timeout non-stream, no first chunk in 30 s with
  `stream:true`. This is the same external blocker recorded above, not a gateway defect.
- The test turn was removed with the native `sessions.rewind` (entryId
  `e083011f-1246-4857-92bf-201ad7cce7cf`), raw 80 -> 77 messages. The active branch is now
  `c74eae58-d62a-4fbc-81bd-75cd3aa4ac4b` (63 branch messages); the superseded
  `11e07b41-2c51-49a3-a598-d36c086bd032` branch (66, including the test turn) remains `active:false`
  and switchable. `abortedLastRun:false`. No session/config/credential mutation otherwise.
- `chat.history {sessionKey:"agent:zero:main"}` returns 91,542 B / 61 of 77 display messages with
  `hasMore:true`; the active transcript contains `hello` and no `ZERO-CHAT-OK`. A fresh `/chat/zero`
  tab starts at `scrollTop:0` with only the tail rows rendered, so the viewport looks blank until a
  position-rail marker (or End) re-syncs the virtualizer. That is a host client scroll/virtualization
  quirk (UI report §16.6), not a gateway/session defect; no backend change was made.

**Checks**

- UI suite **71/71**; `tsc --noEmit` exit 0; backend selftest **111/111**.
- `control-ui-digest.mjs --expect 3d62356d...` -> match; served `index.js` (100,327 B, sha256
  `ddb9ae52...`) and `index.css` (24,114 B, sha256 `6affcc8d...`) are byte-identical to local.

**New blocker evidence (backend-relevant)**

- `minimaxai/minimax-m3.1-flash` is in the provider catalog, returns 200 with content in ~1-4 s, and
  accepts image parts, but the local model catalog has no entry for it, so the host vision gate keeps
  the `computer` tool hidden. This is a config-declaration decision under D-012, not a code defect.
- Live desktop view still needs a loopback authenticated RFB server on port 5900; none is installed.

UI-05 READY FOR REVIEW; CU-01 PARTIAL; CU-02 unchanged. No self-acceptance.

## B5 seam audit and read-only re-audit addendum - 2026-10-26 15:27 IST

**Scope:** read-only. No backend/UI source changed; no config, credential, binding, or model change;
no provider call; no desktop observe/input; no Gateway restart/reload.

**Runtime**

- Gateway health `ok`; PID `17492`; listener `127.0.0.1:18789`; config 6,001 B, sha256
  `0A14A1068F0183A3D027B152EFBDC2BD29D0ADE2DBDDD97CE89BC084280D7168` (unchanged).
- `plugins.controlUi.list` -> catalog `926316ec...`, plugin revision `3d62356d...`,
  `uiCapabilities: []`.
- `node.list` -> `36196f0b...a00f71` connected/approved, commands exactly `computer.act`,
  `screen.snapshot`, `desktop.stream`; `computerUse.provider.id = "cua-computer"`.
- `zero.computer.control {action:"status"}` -> `held:false`, `owned:false`, `scope:"global"`,
  `resumeSnapshotRequired:true`, `takes:4`, `releases:4`, `releasedByDisconnect:2`, all refusal
  counters `0`.

**Model/chat**

- `models.list {agentId:"zero"}` -> 10 entries (catalog discovery). `openclaw models list` marks
  only `nvidia/moonshotai/kimi-k2.6` and `nvidia/minimaxai/minimax-m3` as `text+image`;
  `nvidia/nemotron-3.5-super-vl-120b-a12b` declares `input:"text"` despite its name.
- Session `agent:zero:main` has `modelOverrideSource:"user"` and `hasActiveRun:false`; the model at
  15:27 IST was `nvidia/nemotron-3-ultra-550b-a55b`. Live-observed assistant replies (not initiated
  by this audit) at **15:24 IST** (re-derived from `chat.history`; the earlier 15:14-15:15 label was
  a transcription error) used `nvidia/nemotron-3.5-super-vl-120b-a12b` then
  `nvidia/nemotron-3-ultra-550b-a55b`. The configured default `nvidia/z-ai/glm-5.3-flash` was not
  re-tested and remains unverified.
- `chat.history` (`limit:200`) at 15:27 IST returned 67 display messages, `hasMore:true`,
  `nextOffset:82`, 70,656 B; `hello` present, `ZERO-CHAT-OK` absent. The count is a moving snapshot
  because the session was active; this audit sent no messages.

**Post-audit observation - 2026-10-26 15:34 IST (read-only)**

- The session override changed to `deepseek-ai/deepseek-v4.1-flash` (provider `nvidia`,
  `modelOverrideSource:"user"`, session model revision `hPOGZSQ4...`). Config sha256 remains
  `0A14A106...7168`, so no binding changed.
- The 15:25:49 IST "hello" turn persisted empty assistant text at 15:27:50 and 15:29:52, then a
  `custom` notice at 15:29:52: "The model did not produce a response before the model idle
  timeout." `hasActiveRun:false`; `lastMessagePreview:"hello"`.
- The 15:24 IST replies remain valid evidence for the then-selected nemotron models; they are not
  evidence for the configured default or for the current override. B1 stays open; B2 is unchanged
  because `deepseek-ai/deepseek-v4.1-flash` is `input:"text"`.
- No provider call, no reload/restart, no desktop action, no config/secret/binding mutation. No
  tests were re-run because no product source changed since 15:27.

**B5**

- Fresh `/chat/zero` tab: `.chat-thread` `scrollTop:0`, `scrollHeight:3935`, client 518; 3 rows at
  viewport top 3593-3953; `textContent` 5,017 chars; `innerText` "SHOW EARLIER";
  `history.scrollRestoration:"auto"`. Setting `scrollTop = scrollHeight` revealed the tail rows,
  but only through host-internal DOM.
- No supported plugin/UI scroll seam exists: `ControlUiHost` has no chat/transcript/scroll method,
  `onEvent` is Gateway events, and `registerReplacement("transcript")` would be a second renderer.
  The host's `chatHasAutoScrolled`/`chatLastScrollTop`/`transcriptScrollTop` state is private. B5
  remains host-owned; the native workaround is a position-rail click or End.

**Checks**

- UI 71/71; backend selftest 111/111; `tsc --noEmit` exit 0; build generation unchanged
  `56b1d59f405bcdbce8eb957a984b51ddf5bba675201b395c2710980e37d8f4c8`; local and served
  `index.js` (100,327 B, sha256 `ddb9ae52...`) and `index.css` (24,114 B, sha256 `6affcc8d...`)
  byte-identical; `verify-served.mjs` pass.
- No `plugins.controlUi.reload`, no Gateway restart, no provider call, no desktop observe/input, no
  config/secret/binding mutation.

UI-05 READY FOR REVIEW; CU-01 PARTIAL; CU-02 unchanged. No self-acceptance.

**UI-only follow-up - 2026-10-26 15:50 (source/test only)**

The UI now calls the existing `release` action with `controlLeaseId` when the page hides or the
`/systems` route is left. No Gateway method, payload shape, permission, or plugin behavior changed;
the plugin's connection-close release remains the backstop. UI suite **81/81** (30 hold tests); local
build `16b83c886dd1679b88339502497e3543afb37f6c3f08f85313328593ca2c512b`. No reload was performed,
so the served revision and byte-identical checks above remain the last live observation and are not
superseded by the new local build. Details: `reports/ui/openmausbot-ui-reference.md`.