# Zero gap matrix - 2026-10-26 (post live audit)

**Owner:** OpenCode (UI/computer lane) · **Scope:** one Zero product, one Gateway, one user-facing chat.
**Purpose:** replace scattered status claims with one compact, evidence-labelled matrix. Every row is
labelled `source-verified`, `offline-tested`, `live-verified (date + evidence)`, `blocked (exact cause)`,
or `out of scope`. Nothing here is accepted on behalf of the Senior reviewer.

## 0. Runtime snapshot used for this audit

| Fact | Value |
|---|---|
| Gateway | PID `17492` (launcher `6840`), listener `127.0.0.1:18789`, `auth.mode:"none"`, loopback only |
| Config | `.zero-data/fresh-workspace/openclaw.json`, 6,001 B, mtime `2026-10-26 13:10:51`, sha256 `0A14A1068F0183A3D027B152EFBDC2BD29D0ADE2DBDDD97CE89BC084280D7168` (unchanged by this audit) |
| Served Zero plugin | revision `3d62356d71561fc92587b6d1a2e48d6e77d4ff81bdf15b50b4e46dc1a05ddbc4`, catalog `926316ec9c98d4779da8b5f5787d32ac1bd18e48b5f7ff1478d728dec0c0cbaa`, `uiCapabilities: []` |
| Built generation | `56b1d59f405bcdbce8eb957a984b51ddf5bba675201b395c2710980e37d8f4c8`; `index.js` 100,327 B sha256 `ddb9ae528aff697d44816198c1da2b1925822053b966f0cea9bcbca28d9a7422`; `index.css` 24,114 B sha256 `6affcc8dfa5f356e34194381a87dcd2abe6f9948c9ccac766229e8f439053004` |
| Served = built | HTTP 200 on the served `index.js`/`index.css`; byte-identical to the local generation (same sizes and sha256) |
| Paired node | `36196f0b...a00f71` (DESKTOP-M24DI0N), connected, `approvalState:"approved"`, commands exactly `computer.act`, `screen.snapshot`, `desktop.stream`; `computerUse.provider.id = "cua-computer"` |
| Hold | `held:false`, `resumeSnapshotRequired:true`, `takes:4`, `releases:4`, `releasedByDisconnect:2`, all refusal counters `0` |
| Canonical chat | `agent:zero:main`, sessionId `d382082f-49c1-4a28-bd66-9a4a73a45903`, active branch `c74eae58-d62a-4fbc-81bd-75cd3aa4ac4b` (63 branch messages), superseded branch `11e07b41-2c51-49a3-a598-d36c086bd032` (66, `active:false`); `chat.history` 61 of 77 display messages (`hasMore:true`); no active run; `abortedLastRun:false` |

## 1. Matrix

| # | Requirement | Source | Offline | Live | Status |
|---|---|---|---|---|---|
| 1 | One native Control UI shell, one Gateway, no second app | `src/native-surfaces.js`, `src/shared/routes.js`, plugin manifest | 71/71 UI tests incl. "no duplicate product backend" | `/chat/zero`, `/`, `/agents`, `/plugins`, `/automations`, `/dashboards`, `/systems`, `/settings/*` all render Zero chrome; no second shell | **live-verified 2026-10-26** |
| 2 | `/chat/zero` is the only user-facing chat | route interceptor + hard redirects | 71/71 incl. specialist-route and selector tests | `/chat/operator`, `/chat/researcher` redirect to `/chat/zero`; `/agents` shows only the Zero card | **live-verified 2026-10-26** |
| 3 | Researcher/Operator remain internal, definitions preserved | `backend/config/openclaw.template.json`, live config, `AGENTS.md` delegation block | delegation + gateway admission tests | specialist config pages reachable only as admin config; no chat action, no Set Default | **live-verified 2026-10-26** (config-only) |
| 4 | Chat send / stop / abort on the canonical session | host chat + `sessions.abort` | covered by host bundle (not Zero-owned) | Send enabled with model `z-ai/glm-5.3-flash`; `chat.send` accepted runId `0046f031-b45f-4d2f-a93f-350054e5606c`; Stop produced "Interrupted"; `abortedLastRun:true` at that moment (now `false` after the rewind) | **live-verified 2026-10-26** |
| 4a | Transcript visible and reachable on `/chat/zero` | host chat bundle + `chat.history` | n/a (host-owned) | Content intact: the 15:27 IST re-read (`limit:200`) returned 67 display messages, `hasMore:true`, `nextOffset:82`, 70,656 B, with `hello` present and no `ZERO-CHAT-OK` (the count is a moving snapshot because the session was active). A fresh tab still starts at `scrollTop:0`, `scrollHeight:3935`, client 518, with only the 3 tail rows at viewport top 3593-3953, so the viewport looks blank; a position-rail click (or End) reveals them. Seam audit: no supported plugin/UI scroll API; B5 is host-owned. | **live-verified 2026-10-26** - content intact; host-owned initial-scroll quirk (B5) |
| 5 | Streamed reply text (token deltas) in the same conversation | host chat bundle (`delta` handlers) | n/a (host-owned) | Configured default `z-ai/glm-5.3-flash` still unverified (no new provider call). Live-observed (not initiated by this audit): the session model was switched to `nvidia/nemotron-3.5-super-vl-120b-a12b` then `nvidia/nemotron-3-ultra-550b-a55b`, and both produced assistant text at **15:24 IST** (re-derived from `chat.history`; the earlier "15:14-15:15" label was a transcription error). It was then switched to `deepseek-ai/deepseek-v4.1-flash`, which returned empty text at 15:27:50/15:29:52 and a model-idle-timeout notice at 15:29:52 | **default route blocked/unverified** - override worked at 15:24; current override timed out 15:29 (B1) |
| 6 | Visible tool/delegation progress in the same conversation | host `chat-subagents-panel`, tool cards | delegation fixtures | not reachable: no completed model turn | **blocked** - provider (B1) |
| 7 | Native approval cards (exec / plugin / question / connected app) | host `approval-page-registration`, `approvals-page`, boot-chat approval UI | n/a (host-owned) | `/settings/approvals` renders standing grants, history, decision columns; Zero agent `tools.exec.mode:"ask"`; no pending approval exists to exercise | **source-verified + live page**; card flow blocked by B1 |
| 8 | Provider/model access for chat replies | config provider `nvidia` (`openai-completions`, SecretRef store) | n/a | Prior: `z-ai/glm-5.3-flash` / `glm-5.3` produced no response. Re-audit: `models.list` 10 entries; session `agent:zero:main` carries a user model override, and replies arrived at **15:24 IST** (nemotron 3.5 VL then nemotron 3 ultra). The override was then changed to `deepseek-ai/deepseek-v4.1-flash`, whose 15:25:49 turn produced empty text and a model-idle-timeout notice at 15:29:52. Default route not re-tested | **default route blocked/unverified** - earlier override worked; current override timed out (B1) |
| 9 | Per-agent model configuration without exposing secrets | `src/pages/models.js`, provider manager | provider-manager + PM-01/PM-02/PM-03 suites | `/settings/model-providers` live, admin notice on specialist config, no `Set Default` | **live-verified 2026-10-26** |
| 10 | Computer hold take/release, global scope, held-other | `src/computer/hold.js` + `zero.computer.control` | 20 hold tests + 111/111 backend selftest | free -> take -> `held-this-client` -> second tab `held-other` -> release -> both `free`; `held:false` after this audit's release | **live-verified 2026-10-26** |
| 11 | Disconnect releases the lease, no stale ownership | plugin lease binding | backend selftest | tab close without Release -> `releasedByDisconnect` 1 -> 2, `connection-closed` audit rows, surviving tab converged to `free` | **live-verified 2026-10-26** |
| 12 | Agent input refused under hold (`computer-hold:human-control`) | `backend/plugin/index.js`, host `computer` tool | backend selftest | cannot be exercised: the selected session model is `input:"text"` (`nvidia/nemotron-3-ultra-550b-a55b` at 15:27 IST; `deepseek-ai/deepseek-v4.1-flash` from 15:29 IST), so `modelHasVision:false` and the host never creates the `computer` tool. Only Kimi K2.6 / Minimax M3 declare `text+image`; both failed at the provider previously | **blocked** - model metadata, see B2 |
| 13 | Fresh-capture gate after release (`computer-hold:stale-frame`) | plugin + contract §5quater | backend selftest | same blocker as #12 | **blocked** - B2 |
| 14 | Live desktop view | host Desktop panel + paired node `desktop.stream` | n/a | `desktop.observe` -> `UNAVAILABLE: desktop stream loopback RFB server is unavailable on port 5900`; no VNC service, no 5900-5910 listener; panel shows "Set up a desktop server" | **blocked** - RFB prerequisite, see B3 |
| 15 | Plugins / Skills / MCP / Memory / Workspaces reuse native surfaces | host pages, no Zero copies | UI tests assert no duplicate pages | `/plugins` (catalog), `/settings/skills` (55 skills), `/settings/mcp` (0 servers), `/settings/memory` (memory-core, keyword), `/settings/agents/zero` all live and Zero-branded | **live-verified 2026-10-26** |
| 16 | Connected apps / approvals history | host surfaces | n/a | approvals history shows the resolved exec request and rolling 30-day window | **live-verified 2026-10-26** |
| 17 | Phone/remote access without a parallel backend | host pairing (`nodes list`, paired node) | n/a | a paired local node exists; no tunnel/relay/cloud service is configured or permitted | **out of scope** for this pass (would need an explicit owner decision; no new cloud service) |
| 18 | macOS runtime, accessibility permission, signing, packaging | none | none | Windows host only | **out of scope** - no macOS host in this environment |
| 19 | Local GGUF / managed llama.cpp / GPU probing | removed 2026-10-27 | n/a | n/a | **out of scope** - owner decision 2026-10-25; PM-04 artifacts removed |

## 2. Blockers, exact cause, safe next step

### B1 - Chat replies time out at the provider (class: external provider)

- `POST https://integrate.api.nvidia.com/v1/chat/completions` with `z-ai/glm-5.3-flash`:
  `AbortError` at 45,005 ms (non-stream) and no first chunk at 30,011 ms (`stream:true`).
  `z-ai/glm-5.3` behaves the same at 45,016 ms. `GET /v1/models` still returns 200 and lists both.
- Gateway log shows the matching run error: "The model did not produce a response before the model idle
  timeout", and the session's last turn is a `custom` failure notice.
- Safe next step: re-test the configured model later, or have the owner choose a different model through
  the existing `/settings/model-providers` surface (a decision, not an implementation task). No route,
  credential, or binding was changed by this audit.
- **Re-audit 2026-10-26 15:27 IST:** no new provider call was made. The canonical session
  `agent:zero:main` then had `modelOverrideSource:"user"` and
  `model:"nvidia/nemotron-3-ultra-550b-a55b"`; live-observed assistant replies to "kkrho" and
  "hello" at **15:24:03-15:24:18 IST** (re-derived from `chat.history`; the earlier "15:14-15:15"
  label was a transcription error) used `nvidia/nemotron-3.5-super-vl-120b-a12b` and then
  `nvidia/nemotron-3-ultra-550b-a55b`. That proves the chat path worked with the then-selected
  model, not that the configured default `z-ai/glm-5.3-flash` recovered.
- **Post-audit observation 2026-10-26 15:34 IST (read-only):** no owner decision arrived and no
  provider call was made. The session override changed again, to
  `deepseek-ai/deepseek-v4.1-flash` (`modelOverrideSource:"user"`, provider `nvidia`). The
  15:25:49 "hello" turn persisted two assistant records with empty text
  (`[{"type":"text","text":""}]`) at 15:27:50 and 15:29:52, then a `custom` notice at 15:29:52:
  "The model did not produce a response before the model idle timeout." The session is therefore
  **not currently answering** on its selected model. This shows the idle timeout is not unique to
  `glm-5.3-flash`, but it still does not test the configured default route. Config sha256
  `0A14A106...7168` unchanged; B1 remains an owner route decision.

### B2 - `computer` tool hidden because no declared model has vision (class: config decision + owner gate)

- Host gate: `dist/computer-tool-BYo9lKTd.mjs:156` returns early when
  `modelHasVision === false || embeddedMode === true`.
- Configured model is `input:["text"]`; `openclaw models list` marks only
  `nvidia/moonshotai/kimi-k2.6` and `nvidia/minimaxai/minimax-m3` as `text+image`, and both fail at the
  provider (404 / 410 EOL).
- New evidence (2026-10-26): `minimaxai/minimax-m3.1-flash` is in the provider model list, returns 200
  with content in ~1-3.7 s, and accepts an image part (its reasoning described the supplied solid-colour
  test image). It is **not** in the local catalog, so the host gate still says "no vision".
- Safe next step (owner-gated, not performed): approve adding `nvidia/minimaxai/minimax-m3.1-flash`
  with `input:["text","image"]` to the live provider model list, reload the Gateway, then run H4/H5 as a
  **gateway-hosted** operator turn with the hold taken (gateway-hosted only; `openclaw agent` is
  embedded and never receives the tool). No config was mutated for this audit.
- **Re-audit 2026-10-26 15:27 IST:** `models.list` returns 10 entries. `openclaw models list` marks
  only `nvidia/moonshotai/kimi-k2.6` and `nvidia/minimaxai/minimax-m3` as `text+image`;
  `nvidia/nemotron-3.5-super-vl-120b-a12b` is named "VL" but declares `input:"text"`, so it does not
  satisfy the gate. The selected session model is text-only
  (`nvidia/nemotron-3-ultra-550b-a55b` at 15:27 IST; `deepseek-ai/deepseek-v4.1-flash` from
  15:29 IST). `minimaxai/minimax-m3.1-flash` is still absent from the local catalog. No
  binding/catalog change was made.

### B3 - Live desktop view needs a loopback authenticated RFB server (class: third-party install + credential + UAC)

- `desktop.observe` returns `UNAVAILABLE` on port 5900; no VNC service/dirs; no listener in 5900-5910.
- Safe next step: owner-approved TightVNC/TigerVNC bound to `127.0.0.1` with VNC authentication, then
  re-run the desktop observe path. No VNC was installed and no admin prompt was attempted.

### B4 - Review-gated items (class: governance)

- UI-05, UI-02, INT-00, PM-01, PM-05A, GEM-05 remain `READY FOR REVIEW`; CU-01 remains `PARTIAL`.
- Only the Senior reviewer can accept these; this audit does not self-accept.

### B5 - Fresh `/chat/zero` load starts at scrollTop 0 with only tail rows rendered (class: host client, not Zero-owned)

- Reproduced in a brand-new tab after the rewind: `.chat-thread` `scrollTop:0`, `scrollHeight:3695`,
  client height 518, and 3 virtual rows at `top 3305-3545` (only the last failure/system notices). The
  viewport is blank and `innerText` is only "Show earlier"; `chat.history` and the DOM `textContent`
  (2,688 characters, real `chat-text` nodes) contain the transcript.
- Any position-rail marker click (or End) re-syncs the virtualizer: 7 rows render, `hello` appears,
  and the latest provider-timeout notice is visible. The last three messages are failure notices, so
  the tail alone looks sparse even when rendered.
- Zero injects no chat renderer and the Zero stylesheet has no `.chat-*` rules; this is host chat
  code. **Seam audit 2026-10-26 15:27 IST (supersedes the earlier "small Zero helper" suggestion):**
  no supported Zero plugin/UI seam exists. `ControlUiHost` (apiVersion 1) exposes no
  chat/transcript/scroll method; `onEvent` is Gateway events; the only transcript hook is
  `ui.registerReplacement("transcript", ...)`, which would replace the native renderer (forbidden).
  The host's scroll/virtualizer state (`chatHasAutoScrolled`, `chatLastScrollTop`,
  `transcriptScrollTop`, `handleTranscriptScroll`) is private to the host Lit controller.
- A DOM-level workaround is technically possible: in a live tab, setting
  `.chat-thread.scrollTop = scrollHeight` revealed the tail rows (scrollTop 3417; row tops
  176/296/416). But it relies on host-internal class names and absolute-row layout, cannot
  distinguish a browser-restored or user-chosen position from the quirk, and can race the host's own
  auto-scroll/new-message logic. It is not robust or supported. B5 therefore remains host-owned; the
  native workaround is a position-rail marker click or End. No chat code was changed.

## 3. Corrections to stale claims (history preserved, dated notes added)

1. `reports/ui/white-label-and-single-chat.md` §14.2/§14.3 recorded "Chat model: No models available"
   and "send did not create a run" on 2026-10-25. **Resolved 2026-10-26:** the composer shows
   `z-ai/glm-5.3-flash`, Send is enabled, and `chat.send` created a run. A dated note is appended in
   §16 of that report; the old text is left intact.
2. `reports/computer/cu01-spike-protocol.md` §8.2 lists Kimi 404 / Minimax 410 as the only vision
   candidates. **Extended 2026-10-26:** a third candidate (`minimaxai/minimax-m3.1-flash`) works at the
   provider but is not in the local catalog. Recorded as §9.
3. Any earlier statement that the hold had never been released cleanly is superseded by §15 of the UI
   report and §8.1 of the CU-01 protocol (live 2026-10-26).
4. An interim note in this audit called the post-rewind transcript "3 empty 120 px rows". **Corrected
   2026-10-26:** the rows are populated (2,688 characters of `textContent`, real `chat-text` nodes);
   `innerText` was empty because `content-visibility:auto` skipped off-screen rows and the fresh tab
   started at `scrollTop:0` with only the tail rows rendered. The transcript is intact; see B5.

## 4. Test artifact cleanup (native, reversible)

The bounded chat send left one user turn ("Reply with exactly: ZERO-CHAT-OK") plus the core
continuation prompt it triggered in `agent:zero:main`. Removed with the native
`sessions.rewind { sessionKey:"agent:zero:main", entryId:"e083011f-1246-4857-92bf-201ad7cce7cf" }`
(returned `editorText`, raw 80 -> 77 messages). The active branch is now
`c74eae58-d62a-4fbc-81bd-75cd3aa4ac4b` (63 branch messages); the superseded
`11e07b41-2c51-49a3-a598-d36c086bd032` branch (66 messages, including the test turn) remains
`active:false` and switchable. `chat.history` exposes 61 of 77 display messages with `hasMore:true`;
the active transcript contains `hello` and no `ZERO-CHAT-OK` (later 15:27 IST re-read: 67 of 82
display messages; see §6). No other session, config, credential, or transcript was touched. Permanently pruning the inactive test branch would be a separate destructive
owner decision.

## 5. Attribution

The hold/lease/disconnect semantics and the refused-not-queued behaviour follow OpenMausBot
(Apache-2.0) patterns only; no `enterprise/` code, product name, or mascot is used. Attribution lives in
`app/zero-control-ui/THIRD_PARTY_NOTICES.md` and `reports/backend/license-posture.md`. All Zero UI code
is original to this repository.

## 6. Re-audit addendum - 2026-10-26 15:27 IST

**Scope:** read-only. No source, config, credential, binding, model, or desktop change; no provider
call; no Gateway restart/reload.

- Gateway health `ok`; PID `17492`; listener `127.0.0.1:18789`; config 6,001 B, sha256
  `0A14A1068F0183A3D027B152EFBDC2BD29D0ADE2DBDDD97CE89BC084280D7168` (unchanged);
  `plugins.controlUi.list` still catalog `926316ec...`, plugin revision `3d62356d...`,
  `uiCapabilities: []`.
- `node.list` -> `36196f0b...a00f71` connected/approved, commands exactly `computer.act`,
  `screen.snapshot`, `desktop.stream`.
- `zero.computer.control {action:"status"}` -> `held:false`, `owned:false`, `scope:"global"`,
  `resumeSnapshotRequired:true`, `takes:4`, `releases:4`, `releasedByDisconnect:2`, refusal counters
  `0`.
- `models.list {agentId:"zero"}` -> 10 entries. `openclaw models list` marks only
  `nvidia/moonshotai/kimi-k2.6` and `nvidia/minimaxai/minimax-m3` as `text+image`;
  `nvidia/nemotron-3.5-super-vl-120b-a12b` declares `text`.
- Session `agent:zero:main`: `modelOverrideSource:"user"`, `hasActiveRun:false`; the model at
  15:27 IST was `nvidia/nemotron-3-ultra-550b-a55b`. Live-observed assistant replies (not initiated
  by this audit) at **15:24 IST** (re-derived; the earlier 15:14-15:15 label was wrong) used
  `nvidia/nemotron-3.5-super-vl-120b-a12b` then `nvidia/nemotron-3-ultra-550b-a55b`.
  `chat.history` (`limit:200`) returned 67 display messages, `hasMore:true`, `nextOffset:82`,
  70,656 B; `hello` present, `ZERO-CHAT-OK` absent. The count is a moving snapshot because the
  session was active.
- B5 fresh tab: `.chat-thread` `scrollTop:0`, `scrollHeight:3935`, client 518; 3 rows at viewport top
  3593-3953; `textContent` 5,017 chars; `innerText` "SHOW EARLIER";
  `history.scrollRestoration:"auto"`. Setting `scrollTop = scrollHeight` revealed the rows only
  through host-internal DOM. No supported seam; B5 remains host-owned.
- Checks: UI 71/71; backend selftest 111/111; `tsc --noEmit` exit 0; build generation unchanged
  `56b1d59f...`; local and served `index.js` (100,327 B, sha256 `ddb9ae52...`) and `index.css`
  (24,114 B, sha256 `6affcc8d...`) byte-identical; `verify-served.mjs` pass.
- B3: port 5900 has no listener and no VNC/RFB process; the prior `desktop.observe` UNAVAILABLE
  remains prior live evidence. No VNC install, credential, UAC, or non-loopback exposure was
  attempted.

### Post-audit observation - 2026-10-26 15:34 IST (read-only)

No owner decision arrived and no source, config, credential, binding, or Gateway state was changed
by this observation.

- Session `agent:zero:main` now selects `deepseek-ai/deepseek-v4.1-flash` (provider `nvidia`,
  `modelOverrideSource:"user"`, session model revision `hPOGZSQ4...`). Config sha256 is unchanged
  at `0A14A106...7168`, so this is a session choice, not a binding change.
- `chat.history` (last 8) shows the 15:25:49 IST "hello" turn persisted two assistant records with
  empty text at 15:27:50 and 15:29:52, then a `custom` failure notice at 15:29:52: "The model did
  not produce a response before the model idle timeout." `hasActiveRun:false`;
  `lastMessagePreview:"hello"`.
- The earlier reply times were 15:24:03-15:24:18 IST, not 15:14-15:15; this pass corrected that
  label in rows 5/8 and the B1/B2 notes. The 15:14 time was when the audit tab was opened.
- Consequence: the configured default `z-ai/glm-5.3-flash` is still untested, and the *current*
  session override is not answering. B1 is now a route decision with two failing candidates, not a
  working override. B2 is unchanged: `deepseek-ai/deepseek-v4.1-flash` is `input:"text"`, so the
  host vision gate still hides the `computer` tool. B3 unchanged (no 5900 listener). B4 unchanged.
- No provider call, no `plugins.controlUi.reload`, no Gateway restart, no desktop action. UI
  71/71 and backend 111/111 were not re-run because no product source changed since 15:27.

UI-05 READY FOR REVIEW; CU-01 PARTIAL; CU-02 unchanged; PM-01 separate. No self-acceptance.

### UI-owned hold-leave integration - 2026-10-26 15:50 IST (source/test only)

This is the concrete OpenMausBot-to-Zero gap that was still UI-owned after the read-only audit.
The §0 runtime snapshot and the `71/71` / `56b1d59f...` figures above describe the 15:27 audit and
are now **historical**; this block is authoritative for the hold client's source/test state.

- **Gap:** the hold client never handed back on an in-app route departure or on `pagehide`. The
  plugin releases when the Gateway connection closes, but leaving `/systems` keeps the socket open,
  so a global hold could stay active after its only visible release control was removed.
- **Implemented (pattern-only, no copied source; upstream untouched):**
  - `src/computer/hold.js`: `createComputerHold().leave()` releases only this view's lease,
    best-effort; stops polling; ignores late responses; never renders success. An in-flight take is
    awaited only to release the lease it returns (or, if it fails, the hold already held); an
    in-flight release is not duplicated.
    `mountComputerHold()` adds `pagehide` and exposes `leave()`; `dispose()` alone never releases
    (host re-render safety).
  - `src/native-surfaces.js`: `computerSurfaceAction()` separates route departure (`leave`) from
    transient re-render (`remount`) and missing Desktop element (`unmount`); `handBackComputer()` is
    null-safe; leaving `/systems` or plugin teardown hands back only this view's hold.
- **Tests:** `test/computer-hold.test.mjs` adds 10 focused tests (30 hold tests total): leave once,
  never another client's hold, no release while disconnected, dispose does not release, in-flight
  take hand-back, failed in-flight take falls back to the existing hold, in-flight release not
  duplicated, `pagehide`, helper safety, route-action choice.
- **Checks:** UI suite **81/81**; build generation
  `16b83c886dd1679b88339502497e3543afb37f6c3f08f85313328593ca2c512b`
  (`index.js` 101,066 B sha256 `942c11e3...c724`; `index.css` 24,114 B sha256 `6affcc8d...3004`
  unchanged); `verify-served.mjs` passes for the local build.
- **Not live-verified:** no Gateway reload was performed. The last observed served revision remains
  `3d62356d...` / generation `56b1d59f...`; this block does **not** claim the new bundle is served.
  No take, release, route change, or `pagehide` ran against a live Gateway/desktop in this pass.
- **License:** behavior pattern only from OpenMausBot's Apache-2.0
  `src/components/computer-takeover.ts` / `ComputerPanel.takeover.test.ts`; no lines copied, no
  OpenMausBot branding or mascot, no `enterprise/` code. Details in
  `reports/ui/openmausbot-ui-reference.md`.
- **Unchanged:** B1 route decision, B2 vision/catalog/H4-H5, B3 loopback RFB, B4 review, B5
  host-owned scroll. UI-05 READY FOR REVIEW; CU-01 PARTIAL; CU-02 unchanged. No self-acceptance.


### OpenMausBot audit closeout - 2026-10-26 17:49 IST (documentation only)

Re-audited every GEM-02 pattern against the current source. **No safe UI-owned code change remains:**
`RELEASE_SETTLE_MS` is not applicable (the server snapshot is authoritative and the generation
counter ignores stale responses), client-minted leases and `keepalive` HTTP release do not fit the
Gateway RPC, RFB hygiene is host-owned (B3), and conversation-scoped takeover is intentionally global.
The existing client already covers the rest.

Corrected documentation only: per-pattern status and the exact Apache-2.0 position in
`reports/ui/openmausbot-ui-reference.md`; the Systems -> Desktop surface and pattern-only wording in
`app/zero-control-ui/THIRD_PARTY_NOTICES.md`; a pattern-provenance row in `app/REUSE-LEDGER.md`;
removed the nonexistent Team page / page-registration claims from `app/zero-control-ui/README.md`;
recorded Qoder's reconnect request as resolved in
`reports/computer/hold-method-reconciliation.md` section 7.6; labelled historical dispose-release
claims as superseded.

**No source change:** hold tests **30/30**, UI suite **81/81**, `tsc --noEmit` 0, generation unchanged
`16b83c886dd1679b88339502497e3543afb37f6c3f08f85313328593ca2c512b`, `verify-served.mjs` pass.
Not served/live. B1-B5 unchanged. UI-05 READY FOR REVIEW; CU-01 PARTIAL; no self-acceptance.
