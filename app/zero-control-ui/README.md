# Zero Control UI contribution

This is a native Control UI plugin package for Zero. It extends the existing
**Models & Providers** and **About** routes in place, applies Zero chrome, and
adds the computer-control hold bar to the built-in **Systems → Desktop** surface.
It does not start another web app, assistant runtime, navigation shell, chat
transcript store, desktop viewer, or model connection. The pages read the
canonical Gateway agent roster, session catalog, history, and provider config
through the host SDK, and open sessions through the existing Control UI chat
route.

Zero is the only configured agent and the only user-facing chat entry. There are
no Researcher or Operator agents; no specialist chat, roster card, switcher,
composer, or session picker exists.

## Layout

| Path | Purpose |
|---|---|
| `browser.js` | Small plugin registration entry; installs the route interceptor and the native-surface seam. |
| `src/native-surfaces.js` | Extends the native Models/About routes in place, adds the hold bar above the built-in Desktop viewer, and applies Zero chrome. Registers no page or route. |
| `src/computer/hold.js` | Thin `zero.computer.control` client and hold bar: status/take/release, opaque server-minted lease, fail-closed hand-back on `pagehide` and on leaving `/systems`. |
| `src/pages/models.js` | Models & Providers page state/rendering: provider CRUD, discovery/probes, and role bindings. |
| `src/pages/about.js` | Native About Zero page: identity, privacy, updates policy, legal notice pointers. No external links. |
| `src/gateway/client.js` | Guarded `host.request` wrapper; no socket, credential, or transcript ownership. |
| `src/state/roster.js` | Explicit Gateway session-snapshot reducer for roster state (test seam; no page imports it). |
| `src/computer/presentation.js` | Pure hold-state presentation helpers for the canonical computer lease. |
| `src/shared/routes.js` | Pure route/identifier policy: hidden host routes, About, legacy specialist redirects, upstream hrefs. |
| `src/shared/providers.js` | Pure provider validation, URL/private-network guards, SecretRef projection, model-entry helpers. |
| `src/shared/sessions.js` | Canonical Gateway session/agent projections and `surfaceHref`. |
| `src/shared/{format,errors,dom}.js` | Safe error, formatting, and DOM helpers. |
| `src/constants.js`, `src/legacy-routes.js` | Shared constants and the one host route interceptor. |
| `runtime-core.mjs` | Provider metadata/credential identity, CLI discovery + native backend readiness, cached MCP connector capabilities, and observation status/control/recent methods; never secret values, executable paths, URLs, or raw CLI output. |
| `observation/` | In-process Windows observation engine: lazy CUA capture, bounded ring/queue, change filtering, Private Mode, local UIA/OCR adapters, SQLite summaries, durable owner opt-in preference, and the read-only `zero_screen_context` agent tool. Suggestions are config-disabled by default. No second server, chat, or transcript store. |
| `index.js` | Server-side plugin entry (`openclaw/plugin-sdk`). |

The Control UI asset is a framework-neutral browser module. It uses the Control
UI plugin mount lifecycle and does not embed React or CopilotKit. The Gateway's
`controlUi.experimental.customPlugins` setting must be enabled for a locally
installed custom native UI package. Install/enable this package through the
existing Gateway plugin loader; do not host it as another frontend server.

The stock Control UI already owns chat, session history, agent selection,
activity, and the desktop viewer. Zero reuses those surfaces. The Zero seam hides
the host Debug, Logs, and Updates entry points and sends those routes to the
single `/chat/zero` conversation; the native About screen is replaced in place
with About Zero. Backend logging, audit records, and security controls are
untouched.

## Build and verify

From `E:\zero`:

```powershell
node app/zero-control-ui/build.mjs
node --test app/zero-control-ui/test/mount.test.mjs app/zero-control-ui/test/product-path.test.mjs app/zero-control-ui/test/product-surface.test.mjs app/zero-control-ui/test/delegation-gateway.test.mjs app/zero-control-ui/test/computer-hold.test.mjs app/zero-control-ui/test/observation.test.mjs app/zero-control-ui/test/observation-tool.test.mjs app/zero-control-ui/test/observation-lifecycle.test.mjs
node app/zero-control-ui/test/verify-served.mjs
```

`build.mjs` writes an immutable `dist/control-ui/<generation>/` directory and
updates both manifests. It does not reload the Gateway or mutate config/secrets.
The tests use a small fake DOM; no browser or framework is required.

## Contract and provenance

- OpenClaw `2026.10.6` native Control UI plugin API, documented in
  `upstream/openclaw/docs/plugins/feature-plugins.md` and
  `upstream/openclaw/docs/plugins/sdk-overview/host-hooks.md`.
- The About connector card reads the existing native `tools.effective` method (read-only) to project
  cached MCP tool names. It does not run a connector or claim live reachability. A plugin-side probe
  is not used: in-process `api.runtime.gateway.request` is restricted to bundled/trusted-official
  plugins, and declaring `contracts.gatewayMethodDispatch` does not grant that trust.
- OpenClaw is MIT licensed; see `upstream/openclaw/LICENSE` and
  `upstream/openclaw/THIRD_PARTY_NOTICES.md`.
- This package's browser view is original Zero code. No OpenDots or
  OpenMausBot source files are copied into this slice. The hold hand-back
  behavior references OpenMausBot's Apache-2.0 `src/components/computer-takeover.ts`
  as a pattern only; provenance and notice pointers are in
  `THIRD_PARTY_NOTICES.md` and `../REUSE-LEDGER.md`.

## Observation tool

`zero_screen_context` is a read-only assistant tool over local OBS-01 summaries. It is declared in
`contracts.tools`/`toolMetadata` and registered through `api.registerTool`; results quote observed
text as untrusted, never return raw frames, and are capped/sanitized. `observationSuggestions` is a
disabled-by-default plugin config setting for tool-result-only workflow candidates; enabling it is an
owner config change. Runtime registration is source/inspect-verified but the running Gateway needs a
restart/reload before the tool is exposed.

Durable owner opt-in is stored in the existing retained plugin keyed store (`observation-preference` /
`state`) as exactly `{schemaVersion, enabled, privateMode, updatedAt}`; no frames, OCR text, summaries,
or credentials are stored there. Startup resumes only an explicitly enabled, non-private preference.
Private Mode and Stop persist before success. Missing first-run data stays disabled without a write;
malformed, unreadable, unavailable, or write-failed storage fails closed to disabled + Private Mode.
A resolved `engine.start()` counts as success only when `running:true` and `state:"capturing"`;
unavailable/error/rejected starts return a safe `startFailure` and `captureRunning:false`, preserve an
explicit enabled preference for retry, and never claim capture. Private Mode exit is reported
accurately when a resume fails. `zero.observation.recent` applies the same Private Mode/disabled policy
as `zero_screen_context` and returns only sanitized, bounded records when allowed. About marks a
pending control request, blocks duplicate clicks, and reports a timeout as unresolved/unknown while
refreshing status; it never cancels or repeats the Gateway action. The running Gateway needs the same
owner-authorized restart/reload before this lifecycle is active.

The plugin API is experimental and this package must remain pinned to the
tested Gateway release.
