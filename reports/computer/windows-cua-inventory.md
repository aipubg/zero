# CU-00 — Windows Computer-Use Source Inventory

**Ticket:** CU-00 (Qoder, Computer-Use Developer) · **Date:** 2026-10-23 04:08 Asia/Calcutta (22:38 UTC)
**Scope:** source and documentation review only. **No driver installation, no dependency install, no desktop action, no VM/container was touched.**
**Pins:** OpenClaw `013240515205573248c27ab6b8eec7303f0da1a8` (package `2026.10.6`), OpenMausBot `d393b7a728068cd6b0e9e96fd6997c13b6b10ba6`, OpenDots `8091324942b86789ed0da7facbee855145d933b0` (see `reports/source-inventory.md`).

**Evidence labels used below.**
- `[CODE]` — verified by reading the pinned source file at the cited line.
- `[DOC]` — asserted by the pinned repo's own documentation; not independently confirmed.
- `[REG]` — npm registry metadata read over HTTPS on 2026-10-23. No package was downloaded or installed.
- `[REF]` — reference-project finding from a read-only scan of the pinned OpenMausBot/OpenDots checkout. Citation paths were spot-checked by me; unspot-checked lines are marked.
- `[UNVERIFIED]` — needs live proof. Nothing in this report proves a working Windows desktop action.

---

## 1. Bottom line

Zero's intended route **exists in the pinned OpenClaw commit and is wired for Windows**, so CU-01 should attempt it before any custom service is proposed.

- One built-in model-facing `computer` tool; the agent emits a single node command `computer.act`, plus `screen.snapshot` for capture `[CODE src/agents/tools/computer-tool-schema.ts:65-84]` `[DOC docs/nodes/computer-use.md:11]`.
- On Windows the fulfiller is the bundled, **experimental** `cua-computer` plugin, which calls the pinned **CUA Driver SDK in-process** — not a `cua-driver` executable, daemon, or MCP server `[DOC docs/nodes/computer-use.md:19,29,246]`.
- `computer.act` is already a **Windows platform default** in Gateway node-command policy `[DOC docs/nodes/command-policy.md:35]`.
- A Windows node can also expose its own desktop to the Control UI through a **node-local loopback RFB (VNC) server**, which is the practical live-view path `[DOC docs/gateway/config-browser-ui-desktop.md:345-348]`.

**Three blockers/decisions gate CU-01**, detailed in §8: (1) nothing is installed yet and D-006 forbids installs without senior approval; (2) OpenClaw ships **no Windows live-proof rig** — the maintainer rigs are macOS and Linux-X11 only `[DOC docs/nodes/computer-use.md:142-204]`; (3) **takeover arbitration does not exist for paired-node or Gateway desktops** — it is a cloud/attached-desktop feature only `[DOC docs/nodes/computer-use.md:17]` `[CODE src/agents/tools/computer-tool-node.ts:363-369]`.

---

## 2. Route options found on Windows

| # | Route | What it is | Windows status | Fit for Zero |
|---|---|---|---|---|
| R1 | **Paired Windows node + `cua-computer`** | Gateway (anywhere) → `node.invoke computer.act` → node's in-process CUA SDK | Supported, experimental `[DOC computer-use.md:19,29,208-248]` | **Best CU-01 candidate.** Separates the agent's desktop from the Gateway host and matches "designated environment" |
| R2 | **Gateway-host CUA on the same Windows box** | Plugin loaded into the Gateway's own private desktop helper | Supported; needs explicit `plugins enable` `[DOC computer-use.md:36-45,210]` | Simplest single-machine topology; no pairing. Higher coupling |
| R3 | **Cloud/attached desktop (Crabbox/cloud session)** | Session-bound desktop with real takeover arbitration `[DOC computer-use.md:13-17]` | Not evaluated; external infra | Has the takeover behaviour Zero wants, but needs cloud workers — out of scope for a private local product |
| R4 | **Codex Computer Use MCP** | Codex app-server owns a Codex-native Computer-Use MCP plugin | Separate path `[DOC docs/plugins/codex-computer-use.md:10-30]` | Only if Zero adopts the Codex harness. Not the built-in agent contract |
| R5 | **Custom Windows UIA/vision service** | New Zero-owned provider registered via `registerComputerUseProvider` | Not built | **Only after CU-01 evidences a specific gap** (per CU-02 and D-006). The SDK entry point exists for exactly this `[DOC docs/plugins/sdk-entrypoints/native-providers.md:43-58]` |

R1/R2 share the same provider implementation, so a CU-01 result on either transfers to the other.

---

## 3. Architecture of the built-in route (Windows)

```
agent run (Gateway)
  └─ built-in `computer` tool            src/agents/tools/computer-tool*.ts
       └─ Gateway tool policy + profiles (must expose "computer")
            └─ node-invoke policy seam    extensions/cua-computer/src/node-invoke-policy.ts
                 └─ node.invoke "computer.act" / "screen.snapshot"   (Gateway ⇄ node WS)
                      └─ node host: openclaw node run, interactive desktop session
                           └─ registerComputerUseProvider → CuaComputerProvider   src/commands.ts:366-417
                                └─ LazyCuaDriverSession → DirectCuaDriverSession  src/driver-client.ts:78-291,311-463
                                     └─ @trycua/cua-driver 0.34.1 native SDK (in-process)
                                          └─ Windows primary display (SendInput-class foreground injection)
live view (separate): browser Control UI ⇄ Gateway relay ⇄ node loopback RFB server (third-party VNC)
```

Key mechanics, all `[CODE]` unless noted:

- **Provider identity/capabilities** — `contractVersion: 2`, targets `screen|window|element|browser`, delivery modes `background|foreground`, observations `image|accessibility|browser`, and `features: { recording: true, agentCursor: false, multiDisplay: false }` (`src/commands.ts:405-417`).
- **Action surface on Windows** — the v2 name list is filtered by `platformActions()`: `hold_key` and `wait` are always removed, and `left_mouse_down`/`left_mouse_up` are kept only on Linux (`src/driver-result.ts:91-98`; v2 list at `src/plugins/computer-use-contract.ts:8-49`). `wait` is re-added locally as pacing (`src/agents/tools/computer-tool-schema.ts:37-40`).
- **Authorization ceiling is OpenClaw-owned** — `CuaDriver.createConfigured` with `SessionPermissionMode.Unrestricted`, `unrestrictedAcknowledged: true`, `maxSessionTtlSeconds: 3600`, `maxIdleTtlSeconds: 300` (`src/driver-client.ts:88-109`). `CuaDriver.create()` is deliberately never used. Model input cannot select a native session or widen authority.
- **Desktop input is always foreground** — clicks pin `InputDeliveryMode.Foreground` and every desktop action targets `ActionTarget.Desktop.new({ displayId: "primary" })` (`src/driver-client.ts:112,184`). `deliveryMode` is honoured for window-targeted input only; desktop actions set `deliveryModeApplicable: false` (`src/commands.ts:358-363`).
- **Serialisation & frame authority** — one `KeyedAsyncQueue` per execution (`src/commands.ts:447`); `screen.snapshot` issues a `displayFrameId` bound to session generation + live geometry, and input verifies it (`src/commands.ts:521-534`, `src/frame.ts`, `src/actions.ts:119-140`). A snapshot without `executionId` is standalone and cannot authorise later input `[DOC computer-use.md:267]`.
- **Capture pipeline** — native PNG from `get_desktop_state`, then rastermill resize/encode; defaults `jpeg`, `maxWidth 1600` (png 900), `quality 0.72`; input-pixel cap 40 MP so 8K primaries survive (`src/commands.ts:47-49,489-520`).
- **Session/authority recovery** — `prepareExecution` reads native session state before dispatch; a positively identified *authorization expired* error disposes and replaces the session, rotates the generation (revoking frames/refs), and **never replays the requested input** (`src/driver-client.ts:387-428`, `extensions/cua-computer/README.md:23-38`).
- **Teardown** — completion, cancellation, Gateway disconnect, provider switch, local Stop, and command-host shutdown close the execution, finalize/discard recording resources, close the session, shut down the runtime (`src/commands.ts:551-581`) `[DOC computer-use.md:228]`.
- **Risk classification** — `computer.act` is registered `dangerous: true`; high-risk families are `kill_app`→process_termination, `browser_navigate`, `browser_download`, `browser_set_input_files`, `start_recording`, `replay_trajectory`, `escalate_scope`; observation vs input are separated (`src/node-invoke-policy.ts:13-35,67-88`). Classification adds no per-action prompt `[DOC computer-use.md:120]`.

---

## 4. Exact prerequisites for a Windows CU-01 spike

Confirmed, in the order they must be satisfied. Each must be *observed*, not assumed.

1. **OS/CPU:** Windows **x64 or ARM64** only — `win32-x64-msvc` / `win32-arm64-msvc` artifact keys; anything else yields `COMPUTER_DRIVER_PLATFORM_UNSUPPORTED` (`src/driver-artifact-verification.ts:68-72`, `extensions/cua-computer/package.json:35-46`) `[CODE]`. **Win32 ARM64 is untested by me; treat x64 as the target.**
2. **OpenClaw installed** on the Windows host — installer path exists for Windows PowerShell `[DOC docs/index.md:165-172]`. Node floor `>=24.22.1 <25 || >=26.12.1`; local Node satisfies it `[REF reports/source-inventory.md:21]`.
3. **Plugin explicitly enabled** — on non-macOS the provider registers **only if** `plugins.entries["cua-computer"].enabled === true`; the node-invoke policy registers regardless (`extensions/cua-computer/index.ts:30-38`) `[CODE]`. `openclaw.plugins` default-enables the manifest at install (`openclaw.plugin.json:5-7`), yet the docs still require the explicit enable for local control `[DOC computer-use.md:210-218]`. **This contradiction is a CU-01 check item, not a settled fact.**
4. **Driver artifacts verified** — `openclaw doctor --lint --only cua-computer/driver-artifacts` must print `no findings`; it checks SDK package version, OS/CPU package version, regular-file identity, and pinned SHA-256 of the native lib + Node runtime (`src/doctor.ts:10-32`, `src/driver-artifacts.ts:79-88`) `[CODE]`. Do **not** install a standalone `cua-driver` exe or put one on `PATH` `[DOC computer-use.md:226]`.
5. **Node started from the interactive desktop session** — `openclaw node run` in a logged-in, unlocked Windows session; a running service or visible VNC does not prove availability `[DOC computer-use.md:228,49]`. `[UNVERIFIED]` whether a disconnected/RDP/idle session survives — likely the biggest Windows reliability question.
6. **Pairing approval** — approve the update declaring `computer.act` (built-in desktop default, no allow-entry needed) **and** `screen.snapshot` **and** `desktop.stream`; the last two are *not* platform defaults and arrive only via an approved pairing surface `[DOC command-policy.md:53]` `[DOC computer-use.md:230-240]`, `[DOC config-browser-ui-desktop.md:384-390]`.
7. **Vision-capable model** on the gateway route `[DOC computer-use.md:31]` — shared with DeepSeek Harness (BE-01); `D-002` still requires the vision check.
8. **Tool policy exposing `computer`** — local onboarding picks Full when no profile is configured; an explicit `coding` profile excludes it, so add `tools.alsoAllow: ["computer"]` (plus `tools.sandbox.tools.alsoAllow` for sandboxed agents) `[DOC computer-use.md:32,275-285]`. Full selection ≠ computer-control permission.
9. **Third-party RFB server on loopback for live view** — a Windows node's desktop share "always uses an existing node-local RFB server on `127.0.0.1`"; OpenClaw never tells the node which host/port to connect to, and on Windows you must enable VNC authentication + loopback binding in that server `[DOC config-browser-ui-desktop.md:345-348,282-283]`. `desktop.host.enabled` defaults on; port/password file configurable under `desktop.host` `[DOC :361-378]`. **Managed desktop mode is Linux-only** (Xtigervnc/XFCE/dbus) — no managed Windows desktop exists `[DOC :250-254]`.
10. **Gateway-side policy room** — `gateway.nodes.commands.deny` always wins and is the durable kill switch `[DOC computer-use.md:291]`; `screen.record` (the node command, distinct from CUA's `start_recording`) needs a persistent allow entry `[DOC command-policy.md:55]`.

---

## 5. Windows-specific limitations (this is the risk list)

All `[CODE]` in the pinned plugin unless marked.

| Limitation | Evidence | Consequence for Zero |
|---|---|---|
| **Primary display only** — `screenIndex !== 0` throws `COMPUTER_UNSUPPORTED_DISPLAY`; capability reports `multiDisplay: false` | `src/commands.ts:103-109,487`, `:416` | The designated environment must be a **single-display session**. Multi-monitor is a CU-03 item, not free |
| **No held input** — `hold_key`, `left_mouse_down`, `left_mouse_up` rejected (`left_mouse_down/up` are Linux-only even for window targets) | `src/commands.ts:243-253`, `src/window-actions.ts:111-119` | No drag-with-held-button beyond `left_click_drag`; some apps (canvas/game/Signature pads) unattainable |
| **No modifier-held pointer/scroll** — modifiers on click or scroll throw | `src/commands.ts:201-206,280-284` | Shift-click, Ctrl-scroll must be composed as separate steps or avoided |
| **`key` is layout-limited** — named keys, `f1`–`f12`, single ASCII letters and modifier chords only; digits/punctuation throw `COMPUTER_UNSUPPORTED_KEY` | `src/actions.ts:52-56,88-117` | Send text via `type`; a `key: "1"`-style action is a hard error, not a silent misfire (good) |
| **DPI handling is an equality assertion, not a correction** — on non-macOS, `screen_width/height` must equal `screenshot_width/height` or capture throws | `src/commands.ts:498-506` | **100 % scaling is the safe assumption.** Non-100 % display scaling on the Windows node is an explicit CU-01 measurement item |
| Frame tokens are not freshness guarantees; same-geometry display substitution inside one session is undetectable | `[DOC]` `computer-use.md:78,244` | Re-observe before every mutation; prefer a stable single-display session |
| Desktop actions are inherently **foreground** — real cursor, real focus | `src/driver-client.ts:112,184`, `src/commands.ts:254-258`, `[DOC] computer-use.md:130` | The agent and a human physically at that desktop collide. **This is exactly why takeover arbitration matters** |
| "Acknowledged ≠ effective": an accepted input is not proof the app responded | `[DOC] computer-use.md:130` | Verification must be an observation, not a return code → drives the §7 contract |
| **No takeover arbitration on paired-node/Gateway desktops** — `take_control` throws for anything but an attached/session desktop | `src/agents/tools/computer-tool-node.ts:363-369`, `[DOC] computer-use.md:17` | The product requirement "user can take over" is **not met by the built-in Windows path today**. See §6 |
| No per-action approval; availability is durable once enabled + paired | `[DOC] computer-use.md:287-291` | Matches Zero's preference (no per-action prompts) but means **stop must be explicit** |
| Screenshots are model-only, never auto-delivered to chat | `[DOC] computer-use.md:104,306` (issue #44759) | The **user's live view is not the model's view**; the RFB relay is the only human-visible surface |
| On-screen content is untrusted (prompt injection) | `[DOC] computer-use.md:307` | Keep an injection warning in Zero's UI copy; do not feed screen text into approvals |
| No desktop audio for paired nodes/Windows | `[DOC] config-browser-ui-desktop.md:331-333` | Fine for MVP |
| macOS safety panels' hiding does **not** cover the CUA driver | `[DOC] computer-use.md:295-300` | "hardening, not an isolation boundary" — do not present CUA as containment |
| Cancellation is per-invocation and passed to the SDK | `[DOC] computer-use.md:242,303` | Mid-action cancellation on Windows `[UNVERIFIED]`; the grapheme-by-grapheme guarantee is macOS-only |
| Browser family limited to isolated profiles; no existing-session/CDP attach through this adapter | `[DOC] computer-use.md:136` | If Zero needs the user's real browser session, that is a different OpenClaw browser tool |

Also `[DOC]`: recording/replay and browser file ops are **unavailable on the MCP tool path** where computer control belongs to an admitted run (`computer-use.md:76`), and their outputs are host-owned opaque `openclaw:computer-resource` handles — the model never sees native paths (`:96,305`, `[CODE] src/plugins/computer-use-contract.ts:69-70`, `src/execution-resources.ts:9`).

---

## 6. Observation → action → verification → stop/takeover: what exists today

- **Observe:** `screenshot` (desktop, returns `frameId`, unchanged-frame dedupe), `get_window_state` (optionally image-less refresh), `get_accessibility_tree`, `list_apps`/`list_windows`, `zoom`, `get_cursor_position`, `get_browser_state` `[DOC computer-use.md:80-94]`. Accessibility/UIA-style element targeting **is present** in this stack — relevant to the "separate UIA service" question, which looks far less necessary than the plan assumed.
- **Act:** pointer set (`left_click`,`right_click`,`middle_click`,`double_click`,`triple_click`,`mouse_move`,`left_click_drag`), `scroll` (ticks, capped 50, default 3), `type`, `key`, plus window/element ops `launch_app`,`kill_app`,`bring_to_front`,`set_value`,`invoke_menu`,`escalate_scope` `[CODE src/commands.ts:280-352]` `[DOC computer-use.md:81-86]`.
- **Verify:** post-action the provider returns a fresh desktop screenshot, or — for window targets — the action outcome **plus** a new window observation `[DOC computer-use.md:100-102]`. Structured effect/refusal evidence and escalation records are preserved (`computer-use.md:130`, `[CODE] src/driver-result.ts` effect/evidence projection). Stale frame/observation errors are explicit (`COMPUTER_STALE_FRAME`, `COMPUTER_STALE_OBSERVATION`).
- **Stop (global):** three real levers, in increasing blast radius — (a) interrupt the agent run, which cancels the in-flight invocation (`computer-use.md:242,303`); (b) `gateway.nodes.commands.deny: ["computer.act"]`, hot-applied to connected nodes under default hybrid reload without Gateway restart (`computer-use.md:230-240`, `config-browser-ui-desktop.md:409-413`); (c) disable the plugin / stop the node host locally. There is **no lease, expiry, or arm/disarm command** (`computer-use.md:287`).
- **Takeover:** **only** for cloud/attached desktops. For a Windows node the viewer is a noVNC relay that can be interactive — the UI client carries `viewOnly` and a `disableInput()` path that releases held keys before flipping `viewOnly = true` (`[REF] ui/src/components/desktop/desktop-client.ts:34,40,99-107,140-167,240`; `desktop-panel-connection.ts:10` `control: boolean`, `desktop-panel-owner.ts:516` `viewOnly: !pending.observed.control`) — but nothing tells the *agent* to stop injecting while the human holds the desktop. **Concurrent input is the gap.** Note the sparse checkout does **not** contain the server-side `desktop.stream` relay/arbitration code (only a test file matched), so this asymmetry is inferred from docs + UI client and must be confirmed live.

**This single gap is the main thing CU-01 must measure.** If it cannot be closed by configuration, it is the evidenced justification for a Zero-owned arbitration layer in CU-02/CU-03 — and note that arbitration belongs at the Gateway (policy seam) rather than inside a new driver, because `registerComputerUseProvider` already owns the command registration and invoke-policy seams `[DOC native-providers.md:43-58]`.

---

## 7. Proposed minimal computer contract (for decision, not implementation)

I am **not** editing shared schema. Proposal for DeepSeek Harness (backend routing) and OpenCode (live view/controls):

Zero-facing verbs, each a thin mapping onto what already exists — deliberately no new driver:

| Verb | Maps to | Required result fields |
|---|---|---|
| `observe(scope)` | `computer` `screenshot` / `get_window_state(windowRef, includeScreenshot)` | `frameId`/`observationId`, `width`,`height`, `coordinateSpace`, `capturedAt` |
| `act(intent)` | `computer.act` with echoed `displayFrameId` + `refWidth` | structured `outcome` (`applied` \| `refused` \| `unverified`), `errorCode`, fresh observation |
| `verify(check)` | a fresh `observe` **plus** a host-side read: `file.fetch`/`file.stat` for saved artifacts `[DOC docs/nodes/file-transfers.md:57-66]`, `exec host=node` where needed | pass/fail + evidence reference. Never treat an acknowledged action as success |
| `stop` / `takeover` | run interrupt + `commands.deny` for stop; **takeover needs a new Gateway-side hold on `computer.act` while a human viewer holds control** | `state` (`agent` \| `human` \| `transitioning`), lease identity, "interrupted actions are not replayed" |

Reference designs worth copying (both spot-checked by me):
- OpenMausBot `server/computer-control.ts:1-2,65-107` `[REF]` — a small in-memory control holder with an opaque `controlLeaseId`; the decisive rule is *"while the person holds control the bot's actions are **refused, never queued**: a queued click would land on whatever is under it later"*, and a hold is intentionally **not** persisted across restart. Agent cannot take control; only the person takes/releases.
- OpenDots `src/shared/computer-types.ts:18-32` `[REF]` — `ComputerControl { holder: 'bot'|'human', requested, transitioning, resumeSnapshotRequired }` inside `ComputerStatus`, plus `ComputerAudit { actor: 'owner'|'agent', outcome: 'pending'|'succeeded'|'failed' }` (`:11-17`); routes `POST /dots/:id/computer/take|release` (`src/server/computer-routes.ts:40-44`, `computer-service.ts:269-298`).
- OpenDots frames are **polled base64 PNG every 3–4 s over REST**, not a stream `[REF src/client/ComputerPanel.tsx, ComputerToolCard.tsx]`. OpenClaw's RFB WebSocket relay is strictly better for a live view, so prefer OpenClaw here.

`resumeSnapshotRequired` is the right shape for Zero: after any handover, prior `frameId`s are void and a fresh observation is mandatory before input. OpenClaw already enforces that on its cloud path (`computer-use.md:17`) — so the semantics we want exist upstream; only the paired-node plumbing is missing.

---

## 8. Gate items before CU-01 can run

1. **Install decision (blocks everything).** Nothing is installed. Announced sizes so far, `[REG]` 2026-10-23, registry metadata only, no download:
   - `@trycua/cua-driver@0.34.1` — **MIT**, `unpackedSize` **960,428 B** (~0.9 MB), with per-platform `optionalDependencies`
   - `@trycua/cua-driver-win32-x64-msvc@0.34.1` — license **`MIT AND MPL-2.0`**, `unpackedSize` **27,937,921 B (~26.6 MiB)**
   - plus `rastermill@0.4.0` (MIT) and `@openclaw/fs-safe@0.26.8` (MIT, has a `win32-x64-msvc` native optional dep)
   So the **computer-provider delta is ≈ 28 MiB**, on top of OpenClaw itself (DeepSeek Harness's BE-00/BE-01 number). No dependency tree resolution was performed; treat 28 MiB as the driver floor, not the install total. Per D-006 this needs the senior developer's go-ahead, and **only one heavy job runs at a time** — coordinate with whoever is installing.
2. **Designated Zero environment.** Per D-003: a VM or separate test Windows account, single display, primary display only, and (for live view) a loopback-authenticated VNC server. A specific Windows build/DPI/scaling snapshot is required in the CU-01 report. **I have not chosen or created any environment.**
3. **Takeover expectation must be re-scoped for CU-01.** The ticket as written asks for "live view → stop/takeover". On the built-in Windows path, *takeover of the agent* is unsupported (§6). I propose CU-01 prove **observe → act → verify → live view → stop** and record takeover as a measured gap, rather than faking it.
4. **No Windows proof rig upstream.** The rig at `computer-use.md:142-204` is macOS + Linux/X11 only. CU-01 therefore needs its own small, repeatable proof script — I plan to write a scripted Notepad flow with before/after window captures and a `result.json`, mirroring the upstream rig's evidence style, under `reports/computer/` (no shared code) unless the senior developer assigns a code path.
5. **Vision-model check** is a shared prerequisite with BE-01 (`D-002`). If the gateway exposes no vision model, the built-in `computer` route cannot drive the surface at all.

---

## 9. Licensing / provenance notes

- OpenClaw: **MIT**, © 2026 OpenClaw Foundation (`upstream/openclaw/LICENSE`, `package.json:28`). Reusing its provider path obliges keeping the MIT license/copyright notice for any copied code.
- The Windows driver is a **third-party binary dependency**: `@trycua/cua-driver` **MIT**, but the win32-x64 native package declares **`MIT AND MPL-2.0`** `[REG]`. MPL-2.0 is file-level copyleft: fine to ship as-is, but any modification to MPL-covered source files triggers disclosure obligations. **Action for CU-02:** pin the exact native package versions, keep the `NOTICE`/third-party inventory entry, and confirm which bundled component carries MPL — `upstream/openclaw/THIRD_PARTY_NOTICES.md` does **not** mention CUA at all, so the obligation currently lives only in npm metadata.
- `@trycua` is an external upstream, and `docs/nodes/computer-use.md:375` also references a separate "direct `cua-driver` MCP" path. Zero must not rebrand the driver and must not add it to `PATH` (§4.4).
- OpenMausBot: **Apache-2.0** (relicensed from MIT) with an `enterprise/` proprietary carve-out and trademark reservation `[REF LICENSING.md, NOTICE]`. Its local desktop driver is the **closed-ish `@trycua/cua-driver` binary too (v0.28.2 there vs 0.34.1 in OpenClaw)** — versions differ; do not mix.
- OpenDots: **MIT**; its computer runtime is pinned **CopilotKit/OpenBot rev `b6932d3…` (MIT)** `[REF deployment/computers/LICENSE.openbot]`. Its durable threads depend on CopilotKit **Intelligence**, which is OpenCode's finding, not a computer-use dependency.

---

## 10. Reuse shortlist

From OpenClaw (preferred — no second runtime):
- `extensions/cua-computer/src/*` as the **reference provider skeleton** if Zero ever registers its own provider: `commands.ts` (provider factory, capabilities, lifecycle), `frame.ts` (generation/frame/ref authority), `driver-client.ts` (safe SDK session + expiry recovery), `node-invoke-policy.ts` (risk taxonomy), `driver-artifact-verification.ts` (pinned-digest gate).
- `screen.snapshot` + `computer.act` command pair, `executionId` binding, and the error-code vocabulary — reuse these names in the Zero contract instead of inventing new ones.
- Control UI Desktop panel + `desktop.stream` relay for live view (OpenCode's lane to evaluate; the contract for me is "an approved desktop node appears in the picker while `desktop.stream` is allowed").
- `file.fetch` / `file.stat` / `file.write` node commands for verification evidence on the Windows host.

From OpenMausBot `[REF]` — patterns, small and licence-compatible (Apache-2.0):
- `server/computer-control.ts` (refuse-while-held lease), `server/private-screen-capture.ts` + `server/screen-frame-source.ts` (hold-aware capture gating with a revision guard), `server/computer-observation.ts` (sha256 frame dedupe), `src/components/computer-takeover.ts` + `LiveDesktop.tsx` + `src/lib/desktop-connection.ts` (takeover/live-view UI + noVNC view_only promotion/demotion fail-closed), `server/computer-frames.ts` (budgeted multi-machine thumbnail watcher, 4 fps token bucket), `server/safety-floor.ts` (never-approvable floor incl. Windows folders).
- `electron/cua.mjs` is useful as a **cautionary pattern**: it embeds the driver in Electron main and requires an interactive desktop — the same desktop-session coupling we must prove on Windows, but it is not a drop-in for an API-only backend.

From OpenDots `[REF]` — shapes only: `ComputerStatus`/`ComputerControl`/`ComputerAudit` types and the take/release route layout. Its computer runtime is a **headless Linux Chromium container**, so nothing about Windows desktop control is reusable there.

---

## 11. Sparse-checkout gaps I hit (for CU-01 prep, not urgent)

The current OpenClaw sparse paths omit: `src/desktop`-style server relay code (server side of `desktop.stream`), `docs/platforms/*` (Windows install/service docs), `docs/cli/*` (`openclaw node`, `nodes approve`), `scripts/dev/computer-use-*` rigs, and the `@trycua/cua-driver` package contents themselves (not installed, by design). **Requested expansion, when approved:** `docs/platforms`, `docs/cli`, `scripts/dev` (read-only) — small text paths; I did not expand anything myself.

## 12. Result

CU-00 deliverable complete as a **documentation/source inventory only**. No live Windows action has been attempted or claimed.

**Ready for senior review.** Decisions needed before CU-01: install approval + environment choice (VM vs separate Windows test account), takeover re-scope (§8.3), and the §7 contract. Next dependency: REVIEW-00 / the designated Zero computer environment.

---

## 13. Dated addendum (2026-10-23, after BUILD WINDOW A) — appended, not a rewrite

This report was accepted as a source inventory of commit `013240515205573248c27ab6b8eec7303f0da1a8`. I am leaving §1–§12 exactly as accepted rather than editing an approved artifact, but a later reader must know that **the installed runtime is a different commit** (`fe06181`, the official `v2026.10.6` tag), and that three numbers in §4.4 / §8.1 / §9 belong to the checkout, not the runtime:

- **driver SDK:** §4.4 and §9 say `@trycua/cua-driver` **0.34.1**; the installed release ships **0.32.0**.
- **pinned SHA-256 digests** in §4.4 are the 0.34.1 set; the release manifest pins a different pair (both verified against the files actually on disk).
- **footprint** in §8.1 (~26.6 MiB from registry metadata for 0.34.1) is superseded by a measured **28,413,838 B (~27.1 MiB)** for 0.32.0.

What **did not change** under the pin shift, each re-verified in the installed bundle: the 40-name v2 action contract (identical, same order) and therefore the **36 advertised on win32**; the `take_control is only available for an attached or session desktop` refusal, i.e. the headline takeover gap in §6; the `Unrestricted` ceilings (3600 s session / 300 s idle); the primary-display, no-held-input, no-modifier-click and key-layout limits in §5; and the `MIT AND MPL-2.0` licence — with the improvement that the win32 package **ships its own `node-runtime-NOTICE.md`** identifying the MPL component as `uniffi-bindgen-react-native` 0.31.0-3, so §9's "compliance gap" is narrower than I wrote: OpenClaw's aggregate notices file omits CUA, but the obligation travels inside the artifact.

Authoritative reconciliation: [release-pin-reconciliation.md](release-pin-reconciliation.md). The gated commands in [build-readiness.md](build-readiness.md) §3 now carry the corrected values and the real CLI invocation path (`openclaw` is not on PATH).

**§6 CORRECTION (added 06:50, same day).** My sentence that the viewer layer offers no arbitration for paired nodes was **too broad**, and I have since read the release code. `desktop.observe` does support a `node` source carrying a `control` flag, and `src/gateway/desktop/session-registry.ts` implements real human-viewer control arbitration: preemption of the current controller with a `control-taken[:<operator>]` close (code 4000), `notifyControl` listeners keyed on `sourceKey` + `ownerEpoch`, `MAX_OBSERVERS = 8`, stale-epoch refusal (`DesktopSessionStaleOwnerError`), a 60 s linger, and a server-side `rfb-view-only-filter` so a non-control viewer genuinely cannot inject. **The D-009 conclusion is unchanged** — none of that touches the agent's `computer.act` → native SendInput path, so a human taking the viewer still does not stop the agent — but the human-vs-human half exists and the panel should use it rather than reinvent it. Detail and what remains unproven: [release-facts-desktop-stream.md](release-facts-desktop-stream.md) §1c.
