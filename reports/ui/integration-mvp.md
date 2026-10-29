# Zero native Control UI integration — live MVP slice

Status: **live-verified UI integration; READY FOR REVIEW**. Native personalization (memory
files, workspaces, timeline, Zero branding) is live. Actual desktop input remains CU-01.
Owner: OpenCode (UI) with Qoder (backend/computer). Written 2026-10-23 ~08:10 IST;
updated ~08:43 IST.

## Goal and boundaries

Make Zero one native OpenClaw Control UI product:

- one shell, one navigation, one Gateway runtime, one session/history source;
- no Gateway token/auth prompt in the private deployment;
- OpenMausBot-style computer control integrated into the existing Desktop surface;
- no second UI, backend, session store, chat surface, or `/live/desktop` relay.

The canonical UI is the Control UI shell (D-012). The old React/CopilotKit app was bridge
evidence only and was deleted on 2026-10-25; `app/src/bridge/` is a non-running library.
`upstream/openclaw` and `upstream/openmausbot` stay read-only.

## Auth gate

The live token screen was the **pre-restart** Gateway process. Evidence:

- log `unauthorized ... authMode=token` at 07:41:39 (PID 14700);
- config watcher applied `gateway.auth.mode:"none"` at 07:49:22, restarted via SIGUSR2, and
  completed `config.auth` startup;
- live Control UI `http://127.0.0.1:18789/` loads `Zero — OpenClaw` with
  `loginGateCount: 0` on `/`, the Zero Team plugin route, and `/systems`;
- no Zero-owned credential input remains; the old React pairing banner is gone, and the
  legacy `app/src/client/style.css` (including its dead `.unlock` rules) was deleted with
  the whole client on 2026-10-25.

The upstream login gate is config-driven. Do not edit it to hide it. Keep the private
deployment loopback-only with `auth.mode:"none"`; if auth is enabled later, native Control UI
pairing is authoritative. No backend auth/pairing/upstream change was made; no secret printed.

## Computer control

The Zero Team page now has a thin **Computer control** card backed only by the existing
`zero.computer.control` Gateway method (`status` / `take` / `release`). It uses the existing
operator connection; no new transport, viewer, or lease store.

Live proof on the final bundle:

| Check | Observation |
|---|---|
| Page | `Computer control`, `Global hold · all sessions`, `Computer control is free` |
| Take | `You hold computer control`, `Held since …`, `Hand back`; snapshot `scope:"global"`, `owned:true` |
| Hand back | lease-scoped release; `held:false`, `resumeSnapshotRequired:true` |
| Page leave | simulated `pagehide` → live status `held:false`, `takes:4`, `releases:4`; UI refreshes to free |
| Desktop link | `Open Desktop` → `/systems`; the built-in page says “Set up a desktop server” (no VNC configured) |
| Login gate | `loginGateCount:0` on the same page |

The hold is global, not per-session. Agent input is refused, never queued; observation stays
allowed; only the owning client releases; `resumeSnapshotRequired` asks for a fresh frame before
the next action. These are OpenMausBot Apache-2.0 patterns, attributed in
`app/zero-control-ui/THIRD_PARTY_NOTICES.md`; no enterprise code, product name, or mascot is used.

Actual desktop view/input remains the built-in Systems → Desktop panel and is owner-gated by
CU-01. The card is not a second desktop viewer, and it does not drive input by itself.

## Native personalization surfaces

The Zero Team page now includes the UI-03 surfaces without adding a second shell, store, or index:

- **Memory files** - explicit `MEMORY.md`, `USER.md`, and `memory/*.md` scope, selected-agent label, and an
  explicit `memory.search` (`agentId`, `maxResults: 5`) with memory-source filtering, path/line/
  snippet rows, and a built-in Memory link. Empty results are scoped copy (“No memory-file
  matches … session transcripts are outside this search”), never a claim that the agent has no
  memories.
- **Skills** — read-only `skills.status` counts for the selected agent; installs/enablement stay
  in the built-in Skills page.
- **Workspaces** — selected-agent workspace path plus a read-only `worktrees.list` summary.
  Creation, restore, and cleanup remain in the built-in `/worktrees` page.
- **Team activity** — latest 8 canonical sessions with task-board (`hasBoard`), working/delegated,
  and workspace-branch metadata, plus Activity/Workboard links.
- **Zero branding** — “0” mark, Zero wordmark, private-assistant descriptor, and plugin display
  name `Zero`; the id remains `zero-control-ui`.

Live proof: `loginGateCount: 0`; the Skills, Memory files, Workspaces, timeline, and branding
surfaces render. `memory.search` for `directive` returned 4 `USER.md` memory-file
matches, while `delegation` returned the scoped empty state and no “No memories” text;
`worktrees.list` returned 0 active managed worktrees on this host and the card rendered the agent
workspace path and link correctly. Qoder's 08:34 Gateway-layer hold-recovery evidence closes the
stale-hold concern at that layer; the Control UI connection-death path and the agent-side
stale-frame refusal remain CU-01.

## Build and activation

- Source: `app/zero-control-ui/browser.js`, `index.css`, `test/mount.test.mjs`.
- Build: `node app/zero-control-ui/build.mjs` → `dist/control-ui/725de545…/`
  (JS 22,053 B, CSS 7,119 B); root + dist manifests point at it. The previous card build was
  `bd289974…` (JS 13,606 B, CSS 5,123 B).
- Served contribution: `…/__openclaw__/plugins/control-ui/zero-control-ui/6e4ce04e…/index.js`.
  That segment is the Gateway revision digest, not `sha256(index.js)`: SHA-256 over
  `JSON.stringify({declaration, uiCapabilities})`, then each asset sorted by name as
  `${name}\0${byteLength}\0` + body. `615a6eb8…` is only `sha256(index.js)`.
- Mount test: `node --test app/zero-control-ui/test/mount.test.mjs` → pass (roster, timeline,
  scoped memory search/empty state, workspaces, board/workspace badges, branding, take/release,
  dispose release; **superseded 2026-10-26:** `dispose()` alone never releases, `pagehide` and
  leaving `/systems` do). CSS cross-check: 57 used / 57 defined; bundle has no React/Solid runtime or
  Control UI internal import.
- Activation path: the Control UI's `plugins.controlUi.reload` succeeded. The CLI
  `openclaw plugins reload zero-control-ui --json` still fails with the Windows symlink
  `EPERM` in `.openclaw/tmp/plugin-captures` (“replacement not applied”); this is a loader
  limitation, not a bundle error.
- Live inspector: `name:"Zero"`, `status:"loaded"`, `activated:true`, entry
  `dist/control-ui/725de545…/index.js`, `uiCapabilities:["page","navigation"]`.

## Risks and remaining work

1. **Stale hold on abnormal disconnect — Gateway layer resolved; UI/CU-01 tail open.** Qoder's
   live 08:34 proof closed a CLI connection holding the lease and then read `held:false` from a
   new connection with `resumeSnapshotRequired:true`, `releasedByDisconnect` advanced, and a
   `connection-closed` lease row was recorded. The Control UI connection-death path and the
   agent-side stale-frame refusal remain CU-01 evidence, so `k7` is still unclaimed.
2. **Real refusal proof.** The live card exercised method state, not a real agent desktop action.
   CU-01 must prove the trusted policy refuses agent input during a hold and honors the fresh
   snapshot after release.
3. **Desktop input.** This host has no configured desktop/VNC; the built-in panel only offers
   setup. Actual view/input needs the designated isolated environment (CU-01).
4. **CLI plugin reload.** Use the Control UI reload path in this Windows workspace until the
   symlink privilege/loader issue is repaired.
5. **Memory scope — UI resolved.** The card searches only memory files, passes `agentId`, labels
   the scope, and uses the scoped empty state. Transcript recall remains an explicit owner config
   decision (`memory.search.sources`), not an MVP default.

## Files changed in this slice

- `app/zero-control-ui/browser.js` — native page, computer-control card and hold lifecycle,
  memory-files search, workspace inspector, enriched timeline, branding, and built-in links.
- `app/zero-control-ui/index.css` — panel/input/memory/workspace/timeline styles.
- `app/zero-control-ui/test/mount.test.mjs` — fake hold state machine, scoped memory search and
  empty state, worktrees, board/workspace badges, branding, and dispose tests.
- `app/zero-control-ui/openclaw.plugin.json`, `app/zero-control-ui/dist/openclaw.plugin.json` —
  generated manifest with the current bundle entry and display name `Zero`.
- `app/zero-control-ui/THIRD_PARTY_NOTICES.md` — OpenMausBot attribution.
- `app/src/client/style.css` — removed dead `.unlock` rules; the whole legacy client was
  deleted on 2026-10-25 (historical entry).
- `reports/ui/auth-ui-audit.md`, `reports/ui/zero-control-ui-slice.md`,
  `reports/ui/personalization-ui.md` — live evidence, hash reconciliation, and corrections.
- `TASK_BOARD.md`, `AGENT_CHAT.txt` — status and Qoder handoff.

## 2026-10-25 update — native-only product path

This report's live evidence remains historical. The UI lane has since completed the
D-012/D-015 consolidation:

- the legacy React/CopilotKit/AG-UI client and its Hono runtime are deleted; the
  `403` on `/api/copilotkit/threads` came from the retired `runtime-scope.ts` guard
  and is no longer a product request;
- `app/src/bridge/` is a reusable, non-running Gateway bridge library only;
- `.zero-data/fresh-workspace/start-all.ps1` starts only the Gateway/native Control UI;
  `4317`/`5173` services and scripts are retired;
- `browser.js` is now a registration entry over `src/pages/` and `src/shared/`;
- offline evidence is 37/37 native UI tests, 3/3 bridge tests, bridge typecheck exit 0,
  generation `211e64c99fe5b81ddb3d74828135c59755d6cefe9d626ceeffe2cb4241d87ca1`, and
  `verify-served.mjs` exit 0;
- the live Gateway still serves the generation cached at its last start, so a
  Gateway restart is required before the new generation is live; that remains
  owner-gated. The fresh profile's providers, secrets, routes, and session history
  were not changed.

See `reports/ui/provider-manager-ui.md` §22 for the exact test/browser-smoke evidence.
