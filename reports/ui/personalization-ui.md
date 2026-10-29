# UI-03 — Skills / memory / workspace controls + task–artifact timeline

Status: READY FOR REVIEW (2026-10-23 ~08:43 Asia/Calcutta). Claimed
immediately after the UI-02/integration CopilotKit HTTP/SSE exercise closed
(`reports/ui/build-readiness.md` §7). This file is the UI-03 evidence register;
the native Control UI page is live with memory-file search, a workspace
inspector, an enriched task/workspace timeline, and Zero branding. Actual
desktop input remains CU-01.

## 1. Objective (board row)

Zero's personalization surfaces — skills, memory, workspace controls, and the
task/artifact timeline — inside ONE integrated application (D-012): the OpenClaw
Control UI-based product. The validated bridge capabilities from UI-02
(run/stop/history/activity contracts, `reports/ui/mvp-ui.md` §7) carry over
unchanged at the Gateway boundary; UI-03 work is surface + integration only.

## 2. D-012 seam audit — source-backed contract (complete)

Pinned upstream: `upstream/openclaw` (OpenClaw 2026.10.6 checkout in the
workspace; app pins the npm release `2026.10.6`). The installed release at
`backend/node_modules/openclaw` is the runtime authority where the checkout and
release differ; both are cited below.

**Chosen seam:** one Zero-owned native plugin package,
`app/zero-control-ui/`, declared through `openclaw.plugin.json` →
`controlUi.entry`, exporting a browser module whose default export is
`defineControlUiPlugin({ id, activate(host) })`. It registers one
`ControlUiPage` + one `ControlUiNavigationItem` in the existing sidebar. No
second navigation, transcript, model route, or app shell. This is the smallest
surface that yields a real Zero entry inside the shipped product.

**Registration contract (source of truth: installed
`backend/node_modules/openclaw/dist/plugin-sdk/control-ui.d.ts`):**

- `ControlUiPage` = `{ id, label, mount: ControlUiView }` (L213–217).
- `ControlUiNavigationItem` = `{ id, parent?, label, page: { id, params?, path? },
  icon?, order?, defaultVisible?, actions? }` (L225–237).
- `ControlUiView` = `(container, { host, signal, props, presented,
  mountDefault }) => { update?, focus?, dispose? }` (L199–212).
- `ControlUiHost` exposes `connection`, `components`, `request`, `onEvent`,
  `subscribe`, `sessions` (rows/observe/open/create/patch), `agents`
  (rows/select/refresh), `navigation`, and `ui`
  (`registerPage`/`registerNavigation`/`registerPanel`/`registerAction`/…)
  (L283–371). Registration methods return a `ControlUiDisposer`.
- `ControlUiPlugin` = `{ id, activate(host) => void | disposer | Promise }`
  (L372–376); `defineControlUiPlugin` is only the identity helper (L376).
- Loader gate: `module.default.id` must equal the Gateway descriptor
  `pluginId`, `default.activate` must be a function, and activation has a 15 s
  deadline (`ui/src/plugins/control-ui-loader.ts` L31–54;
  `ui/src/plugins/control-ui-runtime.ts` L69, L408–419).
- Capability gate: registering a contribution kind that is absent from
  `uiCapabilities` produces a host warning
  (`ui/src/plugins/control-ui-runtime.ts` L55–66, L92–110). Zero therefore
  declares `["page","navigation"]`.
- Fixed contract: the browser entry must not import Control UI internals; it
  receives `host` and owns only its own DOM
  (`docs/plugins/feature-plugins.md` L96–97, L136–194).

**Solid vs React:** the host shell is Solid 2, but a native Control UI plugin
is framework-agnostic. The host calls `mount(container, context)` and passes
plain DOM back; nothing in a plugin must be Solid or React. The Zero slice is
plain DOM with no framework runtime (verified: the built bundle imports no
`react`/`solid` and no Control UI internals), so it cannot create a second
rendering shell. Solid is only required if a plugin wants to replace a built-in
surface as a component; Zero does not.

**Manifest/package contract and an installed-release correction:**

- Authored package metadata lives in `package.json` →
  `openclaw.extensions` (runtime entry, required non-empty) and
  `openclaw.controlUi` (browser source). The runtime manifest
  (`openclaw.plugin.json`) must contain `controlUi: { entry, styles? }`.
- Installed release: `loadPluginManifest` normalizes `raw.controlUi` from the
  **root** `openclaw.plugin.json` (`backend/node_modules/openclaw/dist/
  manifest--jjvMb9t.mjs` L983–1124, esp. L1090/L1100). It does not read
  `dist/openclaw.plugin.json`.
- Newer checkout: `loadPluginControlUiDeclaration` prefers a generated
  `dist/openclaw.plugin.json` overlay when the package still declares
  `openclaw.controlUi` (`upstream/openclaw/src/plugins/
  control-ui-build-manifest.ts` L12–57).
- Therefore the build must publish **both**: `controlUi` in the root manifest
  (installed release) and `dist/openclaw.plugin.json` (checkout/newer flow).
  `controlUi.entry` must sit in a dedicated `dist/<segment>/…js` directory and
  styles must share that directory (`src/plugins/manifest-control-ui.ts`
  L83–106).
- `openclaw plugins validate` is a **tool/feature authoring** gate
  (`src/cli/plugins-authoring-command.ts` → `loadToolPlugin` requires tool
  metadata); a UI-only plugin cannot pass it and does not need to. The correct
  static gates are the installed manifest loader plus an activation-contract
  smoke (below).
- Custom native plugin UI is same-origin and off by default
  (`gateway.controlUi.experimental.customPlugins: true`); enabling/installing
  and the Gateway config change remain Qoder's backend-owned wiring
  (`reports/backend/control-ui-backend-contract.md`).

**Canonical data surfaces (reuse, never re-own):**

| Surface | Built-in owner | Zero contribution |
|---|---|---|
| Chat, transcripts, run/stop | `pages/chat`, `chat.send`/`chat.abort` | Zero opens an ordinary session via `host.sessions.open`; no transcript copy |
| Roster | `agents.list` via `host.agents.rows` | Agent cards with live `hasActiveRun` from the session list |
| Session history/activity | `sessions.list` via `host.sessions.observe` | Read-only team timeline from the same rows (active/delegated badges) |
| Skills | `/skills`, `skills.status` etc. | Read-only readiness summary (`skills.status`) + link to the built-in page |
| Memory | `/settings/memory`, `memory.search`/`memory.status` | Memory-files search card (`agentId`, memory scope) + link to the built-in page; no second index, editor, or transcript search |
| Task/artifact timeline | `/activity`, `/workboard`, `/sessions` | Read-only session timeline with task-board and workspace badges, plus links; no new task store |
| Workspaces | `/worktrees`, `/settings/agents` | Active agent workspace path + read-only `worktrees.list` summary + links; edits stay in the built-in pages |
| Computer | `/systems` Desktop panel | Hold card + link only; `/live/desktop` relay stays retired |
| Usage | `/usage` | Link only; reporting, never enforcement |

**File list (Zero-owned, upstream read-only):**

- `app/zero-control-ui/package.json` — package, runtime + browser entries.
- `app/zero-control-ui/openclaw.plugin.json` — id/config/activation/
  `uiCapabilities`; `controlUi` written by the build.
- `app/zero-control-ui/index.js` — minimal `definePluginEntry` runtime entry
  (no backend behavior; satisfies the non-empty `openclaw.extensions` rule).
- `app/zero-control-ui/browser.js` — `defineControlUiPlugin` default export;
  page mount, roster, timeline, skills summary, workspace links.
- `app/zero-control-ui/index.css` — namespaced `zero-team__*` styles.
- `app/zero-control-ui/build.mjs` — esbuild bundle + immutable hashed asset
  directory + both manifests.
- `app/zero-control-ui/test/mount.test.mjs` — DOM-stub mount/activation smoke
  (`node --test`), no browser or framework required.

## 2b. Implemented slice and verification (2026-10-23)

The Zero Team page now carries the integrated personalization slice:

- Agent roster cards from `host.agents.rows`, opening/creating ordinary
  sessions through `host.sessions` (canonical chat, no transcript copy).
- **Team activity** read-only timeline from `host.sessions.observe` over the
  canonical `sessions.list` rows: active (`hasActiveRun`) and delegated
  (`parentSessionKey`/`spawnDepth`) badges, recent-first, "Open" delegates to
  `host.sessions.open`.
- **Skills** summary: `host.request("skills.status", { agentId })` →
  ready / need-setup / disabled counts using the installed entry fields
  (`eligible`, `blockedByAgentFilter`, `disabled`). Read-only; installs stay in
  the built-in admin flow.
- **Workspace surfaces** link grid to built-in routes from
  `ui/src/app-route-paths.ts`: `/skills`, `/settings/memory`, `/activity`,
  `/workboard`, `/sessions`, `/usage`, `/settings/agents`, `/worktrees`,
  `/systems` (the Desktop panel). No new page is reimplemented.
- Base-path-safe hrefs (`host.basePath + path`); no hard-coded origin.

Build and static proofs (this turn):

| Gate | Command | Result |
|---|---|---|
| Bundle build | `node app/zero-control-ui/build.mjs` | pass — `dist/control-ui/5b0f4121…/index.js` 8,791 B + `index.css` 4,633 B |
| Bundle hygiene | inspect bundle | no `react`, no `solid`, no Control UI internal import |
| Manifest load (installed release) | installed `loadPluginManifest(root)` | `ok:true`, `controlUi` + `uiCapabilities:["page","navigation"]` present |
| Activation contract smoke | temp Node script calling `default.activate(host)` | 1 page (`team`, mount fn) + 1 navigation (`team`, page `team`, icon `users`, order 30, visible); dispose order navigation→page |
| Mount smoke (repeatable) | `node --test app/zero-control-ui/test/mount.test.mjs` | pass — roster, active/delegated timeline, `skills.status` counts (`2 ready · 1 need setup · 1 disabled`), all 9 base-path links, session open, clean dispose |
| Tool-authoring CLI | `openclaw plugins validate --root …` | not applicable — it requires tool/feature metadata; UI-only plugin loads through the manifest/activation gates instead |

Not yet proven: same-origin runtime activation inside a live Gateway Control UI.
That needs Qoder's install/config wiring (plugin install + custom plugin UI
Lab flag) and then a browser verification. The page cannot be "live-verified"
before the package is installed; it is not claimed as such.



## 3. Existing OpenCode-owned components that continue (not dropped)

- `app/src/client/Chat.tsx`, `ChatTranscript` — validated bridge evidence (the
  composer, STOP, error-chip, and transcript mapping: per-render message reads;
  single user row; assistant row from streamed text). Kept as evidence and for
  reference; not the product UI under D-012.
- `app/src/client/ComputerToolCard` + Activity tab — graceful empty state and
  tool-card rendering for future `session.tool` rows. OQ-6 casing is Qoder's
  backend fact under D-013.
- `app/src/server/*` — validated GatewayLink/ZeroAgent/thread adapter evidence
  (run/stop/history/activity/STOP ALL). The native Control UI now owns the
  product path; the adapter is not extended as a second assistant.

## 3a. Handoff status correction

DeepSeek Harness is inactive under D-013. Any earlier references to its pending
validation are historical; Qoder owns the backend contract and must validate
the `zero-control-ui` package/manifest/config proposal. The current OpenCode
resume flow must coordinate with Qoder only.

## 4. Open items from the handoff

- Qoder has supplied the desktop lifecycle facts: `desktop.observe` returns a
  one-time `wsPath`, followed by `desktop.release`; there is no `desktop.stream`
  Gateway method. The native Control UI Desktop panel owns this lifecycle.
- Waiting: Qoder's runtime activation of the corrected `zero-control-ui`
  package: install it through the Gateway plugin path and enable
  `gateway.controlUi.experimental.customPlugins` (same-origin Control UI). The
  manifest now loads under the installed release's own loader; the remaining
  step is install/config, which belongs to backend under D-013.
- Designated isolated Zero Windows environment (UI/CU live proof beyond
  read-only) remains owner-gated.

## 5. Fate ledger (append-only; one row per UI-03-affecting change)

| When (Asia/Calcutta) | What | Evidence |
|---|---|---|
| ~07:5x 2026-10-23 | UI-03 claimed; seam audit opened; no runtime change | this file §1–2 |
| ~08:3x 2026-10-23 | Seam contract completed from the installed release + checkout; Solid-vs-React answered (host Solid, plugin plain DOM); `controlUi.entry` + `defineControlUiPlugin` + host API contract pinned | this file §2 |
| ~08:3x 2026-10-23 | Implemented integrated Zero Team slice: canonical roster/session timeline, read-only `skills.status` summary, base-path-safe links to built-in Skills/Memory/Activity/Workboard/Sessions/Usage/Agents/Workspaces/Systems; no new transcript, memory index, task store, or desktop panel | `app/zero-control-ui/browser.js`; this file §2b |
| ~08:3x 2026-10-23 | Fixed package for the installed release: root `openclaw.plugin.json` now carries `controlUi` + `uiCapabilities`; build writes both root and `dist` declarations; bundle rebuilt | `app/zero-control-ui/build.mjs`; manifest load `ok:true`; activation smoke pass |
| ~08:3x 2026-10-23 | Refused: `openclaw plugins validate` path for this package — it is a tool/feature authoring gate, not a UI-only plugin gate; documented instead of adding fake tool metadata | this file §2b |
| ~08:3x 2026-10-23 | Not done (owner/backend gate): live activation in the running Control UI — needs install + custom-plugin Lab flag by Qoder | this file §4 |
| ~09:0x 2026-10-23 | Added repeatable DOM-stub mount test; `node --test app/zero-control-ui/test/mount.test.mjs` passes (roster, timeline, skills counts, links, open, dispose) | `app/zero-control-ui/test/mount.test.mjs`; this file §2b |
| ~08:05 2026-10-23 | Live activation proven in the same-origin Control UI; the login gate is absent (`loginGateCount:0`) and the new bundle is served after `plugins.controlUi.reload` | `reports/ui/zero-control-ui-slice.md` §Live activation; `reports/ui/auth-ui-audit.md` §Live verification |
| ~08:05 2026-10-23 | Added the thin `zero.computer.control` status/take/release card to the Zero Team page; live take → hand back and pagehide release passed; desktop viewing/input stays the built-in `/systems` panel and CU-01 | `app/zero-control-ui/browser.js`; `app/zero-control-ui/index.css`; `THIRD_PARTY_NOTICES.md` |

## 2c. Live activation correction — 2026-10-23 08:05 IST

The §2b “Not yet proven: same-origin runtime activation” line and the §4 waiting item are now
historical. Live proof:

- `http://127.0.0.1:18789/plugin?plugin=zero-control-ui&id=team` renders the native Zero Team page
  with `loginGateCount: 0`; the earlier token screen was the pre-07:49 Gateway process.
- The new contribution is served at `…/zero-control-ui/9932a66…/index.js`. The Gateway's
  `openclaw plugins reload` CLI still hits the Windows `EPERM` symlink in
  `.openclaw/tmp/plugin-captures`; the Control UI `plugins.controlUi.reload` path worked instead.
- The page now has a **Computer control** card: `Global hold · all sessions`, free/held/owned
  states, Take control, Hand back, and an `Open Desktop` link to `/systems`. Take → Hand back and
  a simulated pagehide release were live-verified; the latter returned `held:false` with
  `takes:4/releases:4`, so no stale global hold was left.
- Actual desktop view/input is still the built-in Systems → Desktop surface. This host currently
  shows “Set up a desktop server”, so CU-01 remains the live-input prerequisite. No second
  viewer/relay, transcript, memory store, or navigation shell was added.
- Qoder's memory correction is accepted: `memory.search` works with the memory-files scope (pass
  `agentId`; session transcripts are not searched by default). The built-in Memory page remains
  the inspectable surface; do not render an empty result as “no memories” for session-only
  queries.

## 2d. Native personalization surfaces — 2026-10-23 ~08:43 IST

The Zero Team page now carries the first complete UI-03 surface set inside the same native plugin.
No additional runner, store, index, shell, or relay was created.

**Implemented**

- **Memory files** card: explicit `MEMORY.md`, `USER.md`, and `memory/*.md` scope, selected agent name, and a
  user-triggered search (no search-as-you-type). It calls `memory.search` with `agentId` and
  `maxResults: 5`; rows are filtered to memory-file sources, show `path:lines` and a bounded
  snippet, and link to the built-in Memory page for full reads. Empty results use
  “No memory-file matches” and explicitly say session transcripts are outside this search; the
  card never renders “No memories”.
- **Skills** card: read-only `skills.status` counts for the selected agent (ready / need setup /
  disabled / total), with the built-in Skills page owning installs and enablement.
- **Workspaces** card: shows the selected agent's configured `workspace` path and a read-only
  `worktrees.list` summary (name, branch, owner kind, last active). Creation, restore, and cleanup
  remain in the built-in `/worktrees` page. `worktrees.list` is `operator.read`; no write methods
  are used.
- **Team activity** timeline: now shows the latest 8 canonical sessions, task-board badges from
  `hasBoard`, delegated/working badges, and workspace branch metadata from
  `session.worktree.branch` / `session.repository.branch`. Links go to the built-in Activity and
  Workboard pages; the Gateway still owns the rows.
- **Zero branding**: native `Zero` wordmark and “0” mark, “Private assistant · specialist team”
  descriptor, and the plugin display name is now `Zero` (id remains `zero-control-ui`). The page
  still reuses the existing Control UI shell.

**Build and activation**

| Gate | Result |
|---|---|
| Build | `dist/control-ui/725de545…/` — JS 22,053 B, CSS 7,119 B |
| Bundle hygiene | no React/Solid runtime or Control UI internal import |
| Mount test | `node --test app/zero-control-ui/test/mount.test.mjs` → pass (memory scoped search + empty state, workspaces, board/workspace badges, branding, links, computer hold) |
| CSS cross-check | 57 used / 57 defined classes; no missing or unused |
| Manifest | installed inspector: `name:"Zero"`, `status:"loaded"`, `activated:true`, `entry:"dist/control-ui/725de545…/index.js"`, `uiCapabilities:["page","navigation"]` |
| Served contribution | `…/__openclaw__/plugins/control-ui/zero-control-ui/6e4ce04e…/index.js` after the Control UI `plugins.controlUi.reload` |

**Live proof** (`http://127.0.0.1:18789/plugin?plugin=zero-control-ui&id=team`)

- `loginGateCount: 0`; brand descriptor, Skills, Memory files, Workspaces, and the enriched
  timeline render.
- `memory.search` for `directive` returned 4 `USER.md` memory-file matches with snippets (full-text
  search). A `delegation` query returned no memory-file matches and the scoped empty copy; the page
  contained no “No memories” text.
- `worktrees.list` returned 0 active managed worktrees on this host; the card showed the agent
  workspace path and the built-in Workspaces link without an error.
- The live manifest and served segment differ by design: the build directory is content-hashed;
  the served path is the Gateway's Control UI revision digest (`725de545…` vs `6e4ce04e…`).
  `snapshotBrowserBuild` hashes `JSON.stringify({declaration, uiCapabilities})`, then each asset
  in the entry directory sorted by name as `${name}\0${byteLength}\0` + body. Local reproduction
  from `index.css` (7,119 B) + `index.js` (22,053 B) is `6e4ce04e4d58…`; Qoder's `615a6eb8…` is
  only `sha256(index.js)`.

Qoder's 08:00 note still cited `5b0f4121…`; the live inspector now reports `bd289974…` (previous
card build) and `725de545…` (this build), so that earlier hash is stale rather than the install.
The CLI `plugins reload` Windows `EPERM` remains; the Control UI reload path is authoritative here.

Qoder's 08:34–08:40 Gateway-layer hold-recovery evidence closes the stale-hold concern at that
layer: a connection-closed lease released the hold, a new connection read `held:false` with
`resumeSnapshotRequired:true`, and `releasedByDisconnect` advanced with a `connection-closed`
lease row. The Control UI connection-death path and the agent-side stale-frame refusal remain
CU-01 evidence, so the `k7` suite claim is still open. The card's first-status-after-reconnect
read is already the correct behavior; no further UI change is required for this proof.

