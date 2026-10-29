# Zero native Control UI slice

Status: live-activated in the native Control UI (2026-10-23). Earlier loader-gate notes are historical.

The first D-012 slice lives in `app/zero-control-ui/`. It is a separate native OpenClaw plugin
package with a server entry (`index.js`) and a browser entry (`browser.js`). The browser entry
registers one `Zero Team` navigation page inside the existing Control UI shell. It reads agent
and session snapshots through the host SDK (`agents.rows`, `sessions.observe`) and opens or creates
conversations through `host.sessions`; it never owns a transcript, model connection, or runtime.

The existing Systems/Devices → Desktop page remains the computer surface. This slice does not
revive the old React `/live/desktop` relay and does not add CopilotKit or a second navigation shell.

## Build evidence

`node app/zero-control-ui/build.mjs` completed successfully and emitted the immutable bundle under
`app/zero-control-ui/dist/control-ui/<sha>/` plus generated `dist/openclaw.plugin.json` with the
`controlUi.entry` and stylesheet paths. The package manifest contains the required non-empty
`openclaw.extensions` runtime entry and `openclaw.controlUi` browser entry.

The installed CLI's local `plugins validate/build --root` command could not resolve the package's
peer import `openclaw/plugin-sdk/plugin-entry` from this workspace, so it returned a generic
metadata error. This is an environment resolution limitation, not a claim of runtime validation.
Qoder must validate the package from the Gateway's plugin loader context before enabling it.

## Next integration

Qoder validates the generated manifest/package and adds only the required Gateway plugin/config
wiring. After that, OpenCode verifies the page through the native Control UI and extends it with
links to the existing skills, memory, workspace and task/timeline surfaces, preserving Gateway as
the single source of truth.

## Senior audit update — 2026-10-23

The implementation and local bundle build are accepted as the current UI handoff. The CLI peer
resolution failure remains an environment limitation, not runtime proof. DeepSeek is inactive;
Qoder is the sole backend/package validation owner under D-013. No separate React/CopilotKit UI,
conversation store, model route, or desktop relay may be added while this validation is pending.

## Implementation update — 2026-10-23 (installed-release correction + integrated surfaces)

Source audit against the installed runtime found one real packaging defect and it is fixed:
`openclaw@2026.10.6` reads `controlUi` from the **root** `openclaw.plugin.json`, not from
`dist/openclaw.plugin.json`. The earlier build wrote only the dist declaration, so the UI would
not have activated on the installed release. The build now writes `controlUi` into the root
manifest (preserving the authored fields) and still writes `dist/openclaw.plugin.json` for the
newer checkout overlay flow. `uiCapabilities: ["page", "navigation"]` is declared.

The Zero Team page now also carries the UI-03 personalization slice:

- canonical roster cards (`host.agents.rows`) opening/creating ordinary sessions;
- a read-only team timeline from `host.sessions.observe` with active/delegated markers;
- a read-only `skills.status` readiness summary for the selected agent;
- base-path-safe links to the built-in Skills, Memory, Activity, Workboard, Sessions, Usage,
  Agents, Workspaces, and Systems/Desktop pages.

No transcript, memory index, task store, second navigation, CopilotKit runtime, or desktop relay
was added.

Verification (static, no live activation claimed):

- `node app/zero-control-ui/build.mjs` → `dist/control-ui/5b0f4121…/` (8,791 B JS + 4,633 B CSS).
- Installed `loadPluginManifest(app/zero-control-ui)` → `ok:true` with `controlUi` and
  `uiCapabilities` present.
- Activation smoke → one page (`team`) and one navigation item (`team` → page `team`, icon
  `users`, order 30), with the disposer unwinding navigation then page.
- Repeatable mount test: `node --test app/zero-control-ui/test/mount.test.mjs` → pass (roster,
  active/delegated timeline, `skills.status` counts, all nine base-path links, session open,
  clean dispose). CSS class cross-check: 40 used / 40 defined, no missing or unused.
- `openclaw plugins validate` is a tool/feature authoring gate and rejects a UI-only plugin by
  design; it is not the activation proof and no fake tool metadata was added.

Remaining gate: Qoder installs the package through the Gateway plugin path and enables
`gateway.controlUi.experimental.customPlugins`; then the page can be live-verified in the
same-origin Control UI (one shell, one navigation, one canonical history).

## Live activation + computer control — 2026-10-23 ~08:05 IST

The earlier install gate is resolved; the page is live in the same-origin Control UI.

**Build and activation**

- `node app/zero-control-ui/build.mjs` → `dist/control-ui/bd289974…/` (JS 13,606 B, CSS 5,123 B);
  both root and dist manifests point at it.
- The Gateway initially served the cached old contribution (`784dadb…`) even after the build.
  `openclaw plugins reload zero-control-ui --json` failed during prepare with
  `EPERM: operation not permitted, symlink ...\.openclaw\tmp\plugin-captures\...` and reported
  `Gateway generation 7: replacement not applied.` This is the known Windows symlink limitation,
  not a bundle error.
- The Control UI's own `plugins.controlUi.reload` path succeeded (invoked through the connected
  app's `context.plugins.reload()`), and the page loaded the new contribution at
  `…/zero-control-ui/f26b42cb…/index.js` without a Gateway restart.

**Live proof** (`http://127.0.0.1:18789/plugin?plugin=zero-control-ui&id=team`)

- `loginGateCount: 0`; page renders `Computer control`, `Global hold · all sessions`,
  `Computer control is free`, `Take control`, `Open Desktop`.
- Take control → `You hold computer control`, `Held since 08:01 AM`, `Hand back`; the method
  snapshot reports `scope:"global"`, `owned:true`, and mints `controlLeaseId` only for the owner.
- Hand back → `Computer control is free` and `resumeSnapshotRequired:true`.
- Simulated page leave (`pagehide`) → live `status` returns `held:false`, `owned:false`,
  `takes:4`, `releases:4`; the page refreshes to free. This exercises the release-on-leave rule
  without leaving a stale global hold.
- `Open Desktop` href is `/systems`. That built-in page currently says
  “Set up a desktop server” (no VNC/desktop configured on this host), so actual desktop
  viewing/input remains CU-01. No second viewer, relay, or `/live/desktop` route was added.
- Mount test passes: roster/timeline/skills, take/release, and a second take followed by
  `dispose()` sending the release without another click. **Superseded 2026-10-26:** `dispose()`
  alone never releases; `pagehide` and leaving `/systems` hand the hold back — see
  `reports/ui/openmausbot-ui-reference.md`.

**Attribution and boundaries**

- `app/zero-control-ui/THIRD_PARTY_NOTICES.md` records the OpenMausBot Apache-2.0 pattern reuse:
  lease ownership, refuse-not-queue hold, release on leave, global hold status. No `enterprise/`
  code, product name, or mascot is included.
- The card is a thin client for the existing `zero.computer.control` Gateway method. It does not
  own a transport, session, transcript, or desktop viewer; the built-in Desktop panel remains the
  only view/input surface.
- Still unproven: whether the trusted policy refuses a real agent desktop action during a live
  hold, and real desktop input. Both need the designated isolated environment (CU-01).

## UI-03 personalization surfaces — 2026-10-23 ~08:43 IST

The page now carries the complete native UI-03 surface set in the same plugin. No second UI,
runtime, memory index, task store, viewer, or navigation shell was added.

**Build and served asset**

- `node app/zero-control-ui/build.mjs` → `dist/control-ui/725de545…/` (JS 22,053 B, CSS 7,119 B);
  both root and dist manifests point at it.
- Installed inspect: `name:"Zero"`, `status:"loaded"`, `activated:true`,
  `entry:"dist/control-ui/725de545…/index.js"`, `uiCapabilities:["page","navigation"]`.
- Served contribution after the Control UI `plugins.controlUi.reload`:
  `…/__openclaw__/plugins/control-ui/zero-control-ui/6e4ce04e…/index.js`.
- Windows CLI `plugins reload` still fails with `EPERM`; the Control UI reload is the working path.
- The build hash and the served segment differ by design: the build directory is content-hashed,
  while the served segment is the Gateway's Control UI revision digest. `snapshotBrowserBuild` in
  `src/gateway/control-ui-plugin-assets.ts` hashes `JSON.stringify({declaration, uiCapabilities})`,
  then each asset in the entry directory sorted by name as `${name}\0${byteLength}\0` + body.
  Local reproduction: `6e4ce04e4d58…` from `index.css` (7,119 B) + `index.js` (22,053 B).
  `615a6eb8…` is only `sha256(index.js)`, so it is not the served revision.

**Surfaces added**

- **Memory files** card: explicit `MEMORY.md`, `USER.md`, and `memory/*.md` scope, selected agent, explicit
  `memory.search` with `agentId` and `maxResults: 5`, memory-source filtering, path/line/snippet
  rows, and a built-in Memory link. Empty results say “No memory-file matches” and state that
  session transcripts are outside the search; the card never says “No memories”.
- **Skills** card: read-only `skills.status` counts (ready / need setup / disabled / total) for the
  selected agent; installs and enablement stay in the built-in Skills page.
- **Workspaces** card: selected agent `workspace` path plus a read-only `worktrees.list` summary
  (name, branch, owner kind, last active). Creation/restore/cleanup stay in `/worktrees`.
- **Team activity**: latest 8 sessions, task-board badges from `hasBoard`, delegated/working
  badges, and workspace branch metadata from `session.worktree.branch` /
  `session.repository.branch`; links to Activity and Workboard.
- **Zero branding**: “0” mark, Zero wordmark, “Private assistant · specialist team”, and plugin
  display name `Zero`; id remains `zero-control-ui`.

**Live proof**

- `loginGateCount: 0`; the branded page and the Skills, Memory files, Workspaces, and enriched
  timeline panels render in the native route.
- `memory.search` for `directive` returned 4 `USER.md` memory-file matches with snippets
  (full-text search). `delegation` returned the scoped empty state and no “No memories” text.
- `worktrees.list` returned 0 active managed worktrees on this host; the card showed the agent
  workspace path and the built-in link without an error.
- Mount test passes with the scoped search/empty-state, workspaces, board/workspace badges,
  branding, links, and computer hold cases. CSS cross-check: 57 used / 57 defined.
- Bundle contains no React/Solid runtime or Control UI internal import.

Qoder's 08:00 note still cited `5b0f4121…`; the live inspector reported `bd289974…` for the
previous card build and reports `725de545…` for this build. The earlier hash is stale, not the
install. Qoder's 08:34 Gateway-layer hold-recovery proof (connection-closed release with
`releasedByDisconnect` and the connection-closed lease row) removes the stale-hold blocker at the
Gateway layer; the Control UI connection-death path and the agent-side stale-frame refusal remain
CU-01 evidence, so k7 stays unclaimed.

