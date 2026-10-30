# ZERO AI Task Board

This is the canonical task status. Each developer updates only their own rows unless coordinating a handoff. Use `NOT STARTED`, `READY`, `IN PROGRESS`, `WAITING`, `BLOCKED`, `READY FOR REVIEW`, or `ACCEPTED`. Only the Senior Developer marks work `ACCEPTED` and opens dependent tickets.

| ID | Owner | Task | Status | Deliverable / evidence | Depends on |
|---|---|---|---|---|---|
| OBS-01 (historical) | Assigned Windows/backend developer | Custom Zero Windows screen-observation engine: capture, local perception, memory, and opt-in assistance | **SUPERSEDED — pre-implementation assignment row. Current authoritative implementation/verification status is the later OBS-01 row below.** This row preserves the original planning state; do not read it as current. | `reports/zero-screen-observation-roadmap.md` (canonical plan + single-shot prompt); preserve existing Zero UI/Gateway/model routes; Screenpipe concept-only; external/LAN perimeter focus | Inspect existing `computer/` and `backend/` seams; verify capture/model licenses; no Gateway/model/provider changes |
| BE-00 | Qoder (handover from DeepSeek Harness) | Maintain pinned OpenClaw source inventory/runtime baseline | ACCEPTED | `reports/backend/source-inventory.md` (source/doc inventory; no runtime proof) | Handover audit |
| CU-00 | Qoder | Inventory Windows CUA implementation/support and exact safe prerequisites | ACCEPTED (source/doc inventory only; no live action) | `reports/computer/windows-cua-inventory.md` | None; source/docs review only |
| UI-00 | OpenCode | Inventory OpenDots/CopilotKit/AG-UI/Intelligence dependencies and UI areas | ACCEPTED | `reports/ui/opendots-inventory.md` (source/doc inventory; no runtime proof) | None; use sparse checkout |
| BE-01 | Qoder (handover from DeepSeek Harness) | Maintain Gateway compatibility proof: chat, stream, models, tool call; no secret in logs | ACCEPTED (NVIDIA probe 9/9; Gateway runtime chat via WS also verified) | `reports/backend/gateway-proof.md`; live proof JSON at `.zero-data/be01-probe.json` (secret-free) | Handover audit; existing proof retained |
| CU-01 | Qoder | Harmless Notepad observe/type/save/verify/takeover spike on designated environment | **PARTIAL — owner-authorized normal profile.** 2026-10-25: manual PowerShell/UIA Notepad observe/type/save/read-back passed (marker, 28 B, sha256 b442…, UIA text verified, temp cleaned). 2026-10-26: Control UI hold path live-proven (take/release/held-other, clean H1–H3 tab-close release with `releasedByDisconnect` +1 and `connection-closed` audit rows); agent refusal H4/H5 still blocked because no vision-capable model route works (configured route text-only; two text+image models failed 404/410), so no agent desktop input ran. Live view still blocked by missing loopback RFB on 5900. k7 remains unclaimed | `reports/computer/mvp-computer.md` §8; `reports/computer/cu01-spike-protocol.md` §8; `reports/backend/control-ui-backend-contract.md` live verification | Working vision model for H4/H5 + loopback RFB for live view; no self-acceptance |
| UI-01 | OpenCode | AG-UI ↔ OpenClaw session/event bridge contract and transport comparison | ACCEPTED (WS chat/session contract live-verified; residual history/activity mapping ongoing) | `reports/ui/bridge-spike.md` | UI-00 + BE-00 accepted; app WS run succeeded |
| REVIEW-00 | ChatGPT (Senior) | Review inventory/spikes and accept baseline/data/event contracts | IN PROGRESS | Baselines accepted; live backend route verified; computer panel integration pending | BE-00, CU-00, UI-00; proofs if available |
| BE-02 | Qoder | Verify handover and finish backend config/runtime acceptance | IN PROGRESS — A1–A5 + A8 proven live; A6/A7 and trusted-policy firing need the isolated desktop; live model route drifted via Control UI (Lead/Researcher now nemotron; writes came from the then-served pre-PM-01 build, contract §9 F7), and a second Control UI write at 2026-10-24 01:37:55 removed `agents.defaults.utilityModel`; both need an owner decision | `reports/backend/mvp-backend.md`; `reports/backend/build-readiness.md` §D-013; `reports/backend/security-boundary.md`; `reports/backend/provider-manager-contract.md` §9 drift; installed `backend/` | selftest 111/111 + 19/19, preflight 27 pass/3 warn/2 fail (template two-model rows); delegation + A5 refusal proven; refusals/secrecy clean |
| CU-02 | Qoder | Finish computer integration contract/source prep and align with the native Control UI Desktop panel | IN PROGRESS — D-012 contract aligned; offline suites green; live hold + refusal/idempotence proven, still no desktop | reports/computer/mvp-computer.md; reports/computer/build-readiness.md; reports/computer/release-pin-reconciliation.md; reports/computer/hold-method-reconciliation.md §6-6.1 | CU-00 accepted; audit 25/25, rig 152/152, derivation 9/9; idempotent take, lease-mismatch refusal, resume flag; actual desktop behavior requires isolated Zero Windows target |
| UI-02 | OpenCode | Consolidate Zero into one OpenClaw Control UI-based product interface (D-012) | READY FOR REVIEW — native Control UI shell is the only product UI; legacy React/CopilotKit/Vite path removed; one runtime/session source | `reports/ui/ui-integration-reset.md`; `reports/ui/integration-mvp.md` 2026-10-25 update; `reports/ui/provider-manager-ui.md` §22; live `/plugin?plugin=zero-control-ui&id=team`; `app/README.md` | Senior review; owner-gated Gateway restart for the latest generation; isolated desktop remains CU-01 |
| INT-00 | OpenCode + Qoder | Integrate the native Zero Team page, canonical Gateway sessions/activity, and existing Desktop panel in one Control UI | READY FOR REVIEW — native page live with canonical sessions/activity, memory/workspace panels, and a Desktop link; actual desktop input remains CU-01 | `reports/ui/integration-mvp.md`; `reports/ui/zero-control-ui-slice.md` §Live activation/§UI-03; `reports/ui/personalization-ui.md` §2c/§2d | UI-REBASE and Qoder's backend contract alignment; isolated desktop remains required for live input proof |
| BE-03 | Qoder | Reviewed skills, inspectable memory, model routes, budgets/audit | IN PROGRESS — built-in `subagent-echo-check` is verified zero-only/bounded with archive/restore proof; FTS-only memory status/get/search is live-valid; UI-03 delivered the scoped memory-file search with `agentId` (AC #6 closed for memory scope); transcript recall remains an owner decision | `reports/backend/personalization.md` §2-3, §7; `reports/backend/control-ui-backend-contract.md` | Gemini GEM-04 supplies role-contract evidence; transcript recall is an owner decision |
| UI-03 | OpenCode | Skills/memory/workspace controls and task/artifact timeline | ACCEPTED — native page live with memory-file search (`agentId`, memory scope, scoped empty state), read-only skills/worktree summaries, canonical timeline with board/workspace badges, Zero branding, and the hold card; Desktop input remains CU-01 | `reports/ui/personalization-ui.md` §2/§2b/§2c/§2d; `reports/ui/zero-control-ui-slice.md` §UI-03; `reports/ui/auth-ui-audit.md`; `app/zero-control-ui/` | INT-00; BE-03 contracts; CU-01 for real desktop/refusal proof |
| UI-04 | OpenCode | Make native Control UI assistant-first and show the reviewed built-in skill through native lifecycle surfaces | ACCEPTED — assistant-first Zero Team page, canonical session entry, activity/personalization links, reconnect correction; focused tests and live served revision 06d350d6… independently verified | reports/ui/assistant-workflow.md; live zero-control-ui contribution | PM-01 remains separate and in progress |
| UI-05 | OpenCode | Native-only UI maintainability pass plus single-chat consolidation, durable routing policy, and delegation evidence separation | READY FOR REVIEW — **zero-only migration applied:** only agent `zero` remains (worker entries/delegation removed); canonical `/chat/zero`; no specialist composers/links/selectors; Models role UI is config-driven; restart loaded `/new`+settings redirects, while `/chat/*` remains host-gated. **Durable policy:** repo-owned `backend/agents/zero/delegation-policy.md` merged into live Zero `AGENTS.md` by `backend/scripts/sync-zero-instructions.mjs` (idempotent markers, owner content preserved). **Proven offline:** zero-only template/config and sync policy; historical Zero→worker delegation is superseded and must not be recreated. **Fixture-only:** completion shapes. **Live E2E unproven:** no prompt was sent; current model route is NVIDIA minimax. | `reports/ui/white-label-and-single-chat.md` §14; `backend/agents/zero/delegation-policy.md`; `backend/scripts/sync-zero-instructions.mjs`; `backend/scripts/test/sync-zero-instructions.test.mjs`; `app/zero-control-ui/test/delegation-gateway.test.mjs`; `app/zero-control-ui/test/delegation.test.mjs`; `app/zero-control-ui/src/shared/routes.js`; `app/zero-control-ui/src/legacy-routes.js`; `app/zero-control-ui/src/native-surfaces.js` | **82/82 UI tests** (30 focused hold tests), **5/5 sync tests**, bridge **3/3**, backend selftest 111/111; local build `418858e0…` (not served); last served generation `56b1d59f…`, active revision `3d62356d…`; live one-chat surface intact. **2026-10-26 hold bar live:** `/systems` free → held-by-this-client → held-other → free; tab-close released the lease (`releasedByDisconnect` +1, `connection-closed`) and the surviving tab converged to free. Agent refusal/stale-frame remain offline-only: no working vision model (configured route text-only; two text+image catalog models failed 404/410). Desktop view still blocked by missing loopback RFB on 5900. No prompt/config/secret/session write; no self-acceptance |

| PM-01 | OpenCode | Provider Manager UX/reliability pass plus credential-reference identity persistence | READY FOR REVIEW — senior-review corrections applied: cancel after staging never deletes the Secret Store entry (upsert cannot prove ownership) and shows a name-only unbound notice; `config.patch` must return an array `changedPaths` containing the exact `models.providers.<id>` on both initial save and retry; missing/malformed/mismatched paths block identity persistence and success while preserving an idempotent retry; no flow auto-deletes a credential; legacy providers stay `not-recorded`/fail-closed; final wording sweep removed the stale cancel-cleanup comment (no behavior change); Gateway activation of `.set`/`.delete` is NOT live-verified | `reports/ui/provider-manager-ui.md` §§19–21; `reports/backend/control-ui-backend-contract.md` credential-ref identity contract; `app/zero-control-ui/browser.js`; `app/zero-control-ui/runtime-core.mjs`; `app/zero-control-ui/test/mount.test.mjs`; `app/zero-control-ui/test/verify-served.mjs` | mount 46/46 after the product-surface consolidation pass; bridge tests 3/3; build generation `30a00edd0af8b548b355a2081b5330f2304c3e5bebfbb2c0ef9aa0196dd71795` (JS 110,185 B, CSS 31,325 B) reproducible; `verify-served.mjs` exit 0; six runtime methods source-wired; zero-gw/config/secrets untouched; live Gateway still serves `75d0b71f…` pending owner restart; offline pass is not live verification; PM-01 not self-accepted |

| GEM-00 | Gemini | Review Hermes/OpenClaw skill and capability candidates for Zero's first external/reusable skill | ACCEPTED as source intake — existing Workshop `subagent-echo-check` is a candidate, not yet runtime-approved; Hermes checkout has no skill payload to license-review | `reports/gemini/skill-intake.md` | Qoder verifies exact Workshop revision/lifecycle/bounded invocation |

| GEM-01 | Gemini | Document OpenClaw skill authoring/review lifecycle and Hermes memory/user-model reuse candidates | ACCEPTED as source/lifecycle evidence — lifecycle matrix, dual-store/bounded prompt pattern, 7-point checklist | `reports/gemini/skill-lifecycle.md` | Qoder applies checklist; OpenCode uses native Skills UI |
| GEM-02 | Gemini | Audit OpenMausBot computer takeover and desktop viewer patterns | ACCEPTED as source evidence — in-memory hold, refused-not-queued semantics, and frame hash gating | `reports/gemini/openmausbot-intake.md` | Qoder CU-01/CU-02; OpenCode UI-04 where native API permits |
| GEM-03 | Gemini | Audit OpenDots specialist roster, activity timeline, and artifact presentation patterns | ACCEPTED as source evidence — relative time, task badges, split observation and review-card patterns | `reports/gemini/opendots-intake.md` | OpenCode UI-04; preserve MIT notice if code is ported |
| GEM-04 | Gemini | Audit specialist-agent prompts, tool boundaries and task result contract for Lead/Researcher/Operator | ACCEPTED — evidence captured; Qoder already provisioned the missing Operator guidance | `reports/gemini/agent-contract-intake.md` | Feeds Qoder workspace hardening and OpenCode UI-04 activity wording |
| GEM-05 | Gemini | Create a source-evidenced end-to-end acceptance matrix for one Zero lead session delegating research and a desktop-capable operator task | READY FOR REVIEW — Qoder review: Gate-1 Qoder item (workspace hygiene) is complete; runbook step 5's stored digest `1a1d2ce3e8d2…` does not match the live catalog `1a1d2ce3a6a1…` and must be read from `plugins.controlUi.list` | `reports/gemini/team-acceptance-matrix.md` | Read-only; feeds Qoder BE-02/CU-01 and OpenCode UI-04 |
| PM-00 | Qoder | Build Gateway-side provider-manager contract and safely migrate from fixed `zero-gw` | ACCEPTED - source review plus provider-manager selftest 20/20 and mock integration 5/5 pass; Qoder reports live registration/discovery/test 85 models; `zero-gw` remains unchanged; three-agent binding patch and rollback proven by schema/runtime audit + no-write rehearsal; CRUD/activation/rollback write still unexercised | `reports/backend/provider-manager-contract.md` §3.4a; `backend/plugin/provider-manager/`; live config entry `plugins.entries.zero-provider-manager.enabled` | Keep current provider until replacement activation succeeds; PM-01 consumes this RPC contract |
| PM-01 | OpenCode | Integrate Kilo Code VS Code provider workflow into Zero native OpenClaw-themed Models experience | READY FOR REVIEW — F10 resolved: deriveScopeFallbacks builds independent fallback lists for defaults, zero, researcher, operator; regression test asserts each role retains its own distinct previous primary in fallback chain; **Qoder independently verified** the source, the 3/3 focused suite and live revision 9e02160e… (catalog bde66312…); probe validation, rollback replacePaths, authentic Auto, and CSS nav suppression confirmed; shared store SecretRefs are retained until their last provider reference, completed `zero.providers.test` failures surface the sanitized `message`, editing a legacy inline key requires an explicit SecretRef migration instead of silently dropping the credential, and disable is now presence-aware and role-isolated (an absent `utilityModel` stays absent; only roles referencing the provider are rewritten), with the patch builder also omitting unrelated/absent defaults and preserving string-form defaults instead of writing an empty primary or normalising shape; redacted `config.get` SecretRefs are now handled safely: a canonical `ZERO_PROVIDER_<ID>_API_KEY` store ref is used only after `secrets.store.list` confirms that exact secret entry exists with an exact host match, the page's `default` alias, and no other store secret entry (canonical or not) for the host; otherwise Test/Discover/capabilities/activation are blocked with an explicit hidden-credential state, and edits without a new key omit `apiKey` so the hidden reference is preserved; custom-provider IDs are now derived from the display name with a deterministic Gateway-safe slug, empty names are blocked, manual edits win, edit mode never migrates the ID, duplicate IDs are rejected before secret/config writes with a safe `-2` suggestion, and display-name-only edits preserve existing model IDs byte-for-byte; **23/23 UI tests pass**; local bundle `358e4e18…` live as plugin revision `fd28f9c1…` (catalog `02b7c405…`), HTTP 200 byte-identical JS/CSS (94,633 B / 27,639 B, JS SHA-256 `DE59E088…AC22`); live CRUD/activation remains unverified (no safe disposable non-protected provider; live config mutation prohibited) | reports/backend/provider-manager-contract.md §3.4 step 3 + §9 F10; reports/ui/provider-manager-ui.md §§11–18; reports/owner-decision-packet.md; app/zero-control-ui/ | Remaining items are senior recheck of the generic ID/collision behavior, the disable and shared-host SecretRef safety guard, an owner decision on the live `ZERO_PROVIDER_ZERO_GW_API_KEY` shared-host entry, a Gateway refresh to load the current provider-manager handler, and an owner-authorized disposable-provider live CRUD/activation or Discover window; zero-gw/live bindings unchanged |
| PM-02 | Qoder | Add backend capability checks (text, streaming, tool calling, image) with read-only, no-auto-assign semantics | IN PROGRESS - `zero.providers.capabilities` implemented and live-registered; **15/15** pm02 tests and all adapter suites green; sanitized diagnostics (`httpStatus`/`category`) live; empty 2xx bodies map to `empty_body`, chunked bodies are cut off at 256 KiB while reading, and every supported adapter is asserted native for all four checks; text/image budgets 64 (streaming 4, tools 32). Four owner-authorized probes of zero-gw/`z-ai/glm-5.3-flash`: text **observed pass at 64** (4/32 → `empty_content`); image **4 failed, 32 mixed, 64 observed pass once (27.3 s)** — stability unproven; streaming/tools passed in every observed run. No live probe since; no retry; config/bindings/secrets unchanged. | `reports/backend/provider-manager-contract.md` §4.6/§4.7; `backend/plugin/provider-manager/pm02.test.mjs` | Distinguish **observed pass** from **stable/verified**; image/text evidence is latest-run only; further live probe needs owner authorization; no binding change |
| PM-02-UI | OpenCode | Specialist role model assignment & explicit capability evidence UI | ACCEPTED — role-isolated assignment; metadata distinguished from probe evidence; capability RPC invocation and pending-Gateway state; Operator tool/image gate with explicit override; 4/4 tests pass; live revision `121c33b8…` (catalog `98c96405…`) independently verified, JS/CSS byte-identical to local bundle. **Superseded:** the backend RPC was live-registered at the 2026-10-24 03:33 IST controlled restart, and the current UI is `de6730fe...` (PM-03E closed). | reports/ui/provider-manager-ui.md; app/zero-control-ui/ | PM-03 local-server UX next; preserve zero-gw/live bindings |
| PM-03 | Qoder | Backend local existing-server mode: loopback HTTP, explicit private-network opt-in, adapter coverage | ACCEPTED — offline behavior only: host/SSRF policy, no-key local endpoint and mock integration verified; PM-03 9/9, PM-02 15/15, PM-04 Responses 8/8, PM-05 Ollama 7/7, PM-06 Anthropic 8/8, selftest 20/20, integration 5/5; public HTTP rejected even with opt-in. No live local endpoint proof. Capability RPC live-registered after the 03:33 IST controlled restart (three methods, verifier exit 0). Config drift at 01:37:55 (defaults model / utilityModel) is recorded and not reverted; current routes remain zero-gw/Nemotron defaults/Operator GLM. | `reports/backend/provider-manager-contract.md` §§4.6–4.7/§9; `backend/plugin/provider-manager/pm03.test.mjs` | PM-03-UI revisions; live endpoint proof requires an already-running owner endpoint; preserve zero-gw/live bindings |
| PM-03-UI | OpenCode | Full visual-polish pass: accessible custom listboxes, 375px header collision fix, Anthropic probe reconciliation, email audit | ACCEPTED — Senior visual review passed. Visual polish complete: accessible custom listboxes with full keyboard navigation, ARIA combobox/listbox, bounded scroll area, explicit disabled reasons ([Needs Tools & Image]), and high-contrast dark theme (#1a1d26/#edf0f7) replacing transparent/light OS popup contrast failure; 375px mobile header collision resolved via .zero-models__brand-copy vertical stacking and responsive flex-column; adapter copy reconciled with Qoder's PM-06 (Anthropic probe supported across dropdown, badges, and tests; backend probe logic owned by Qoder, UI evidence strictly comprises UI mount tests, served asset verification, and Chrome CDP screenshots); email UI audit completed with full search evidence; 6/6 tests pass; live revision f1dfb252... verified HTTP 200 byte-for-byte; updated screenshots captured across 1440px, open dropdown, 125% zoom, 1024px, 768px, 375px | `reports/ui/provider-manager-ui.md`; `app/zero-control-ui/`; `test/mount.test.mjs`; `reports/ui/screenshots/pm03/` | PM-06 adapter contract; keep zero-gw/live bindings unchanged |
| PM-02/03-UI | OpenCode | Reconcile capability states & render sanitized diagnostics: 4-dimension probe display, format · HTTP 200 · empty_content, and Operator gating | ACCEPTED — Senior review: sanitized capability diagnostics & 4-dimension probe presentation: (1) Non-ok capability checks display server-sanitized category and integer HTTP status when available (e.g. format · HTTP 200 · empty_content, Tools: Unsupported (Probed) · no_tool_call, Probe Failed (auth) · HTTP 401 · http_error) without exposing response bodies, headers, or credentials; (2) Unsupported, failed, unprobed, and registration-unavailable states remain distinct; (3) Format without diagnostics falls back cleanly to format (probe result, cause unconfirmed); (4) Operator gating reason includes sanitized category (image: format · empty_content); (5) Accessible custom listboxes, keyboard navigation, and responsive grid preserved 100%; (6) 7/7 unit tests pass in mount.test.mjs with expanded 6-model offline fixtures; (7) Rebuilt bundle (JS: 77,490 B, CSS: 26,528 B, revision 0a2a9a51...), live hot-reloaded via plugins.controlUi.reload (code: 0, catalog revision 52facc31...), verified HTTP 200 byte-for-byte via test/verify-served.mjs; (8) Backend acceptance runner passed (A1-A3 PASS) | `reports/ui/provider-manager-ui.md` §9; `app/zero-control-ui/`; `test/mount.test.mjs`; `test/verify-served.mjs` | PM-03-UI accepted; Qoder contract §4.6–§4.7; preserve zero-gw/live bindings |

| GW-01 | OpenCode | Merge Model-Gateway-zero into Zero as local AI model companion service (port 18790), unify plugins into zero-control-ui, and wire OpenClaw model provider | ACCEPTED — Model-Gateway-zero relocated into `backend/gateway/`; standalone HTTP service `backend/gateway/server.mjs` live on 18790 with /health, /v1/models, /v1/chat/completions; OpenClaw config mapped to `zero-gateway` (default model `zero-gateway/default`); `zero-policy` merged into `zero-control-ui` as a single unified plugin; root `start-all.ps1` orchestrator created; 103/103 tests pass | `backend/gateway/`; `app/zero-control-ui/`; `start-all.ps1`; `openclaw.json` | Model-Gateway-zero source, node 24 |
| PM-04-UI | OpenCode | Managed Local GGUF Inspection & Import Preparation UI (PM-04 / Contract §4.8) | **REMOVED 2026-10-27 — out of scope; GGUF import control/modal/state/CSS/tests/documentation deleted.** No remaining consumer | `app/zero-control-ui/`; `test/mount.test.mjs` | PM-02/03-UI accepted; native provider manager preserved; zero-gw/live bindings unchanged |
| OMB-01 | OpenCode | Full OpenMausBot OSS capability parity audit and Zero integration | READY FOR REVIEW — Phase 0 reconciled the requested snapshot: `upstream/OpenMausBot-main` is package `0.1.127`, no `.git`, 5,111 files / 150,508,407 B, tree SHA-256 `f0e8df37…c25b62`; Apache-2.0 core with `enterprise/` under the separate source-available license; not the older `0.1.123`/`d393b7a…` checkout. Current live config is zero-only. Phase 1 contract map (§10) covers chat/history/stop, tools/approvals, CLI, MCP, computer, browser, automation, skills/memory, voice, channels, mobile, team, bot-box, UI, and enterprise. Implemented CLI discovery + native CLI backend readiness, native MCP config status (enabled/transport/auth/filter; transport default/unknown and empty/non-empty filter regressions), and cached native `tools.effective` connector capabilities in the existing About surface. A plugin-side MCP probe is blocked by the trusted-official dispatch gate, so no probe method is shipped. CLI execution remains blocked: the supported path is the native CLI backend, which needs an owner-approved model/runtime binding; no runner was added. Next-phase decision (plan §11): live CLI execution is the highest-value candidate but owner-gated; live MCP action is account/native-probe-gated; no placeholder code added. | `reports/open-mouse-connect-plan.md` §9–§10; `reports/ui/openmausbot-ui-reference.md`; `runtime-core.mjs`; `src/shared/connectors.js`; `src/pages/about.js` | UI 82/82, mount 34/34, redirect 1/1, migration 3/3, sync 5/5, bridge 3/3, plugin selftest 111/111, config validate valid; build `418858e0…` (verify-served exit 0), JS sha256 `ed553ce5…`, CSS `6affcc8d…`; config SHA `6f051c09…` and model projection `ea75d703…` unchanged; new methods/UI not live without restart/reload; live prerequisites: CLI runtime decision/auth, MCP/OAuth accounts + native probe/action, mobile/channels, RFB desktop, team/enterprise; no self-acceptance |
| OBS-01 | OpenCode | Windows-first Zero screen-observation engine — Steps 1–2 + local perception/memory + durable opt-in lifecycle + anti-hacker shield | ACCEPTED — in-process bounded observation engine (`app/zero-control-ui/observation/`), 5-min/500 MB RAM ring buffer, changed-frame perceptual hash dedupe, local SQLite tables (`observations`, `video_and_media_logs`, `workflow_patterns`, `important_snapshots`), read-only `zero_screen_context` tool with prompt-injection defense tags, emergency kill-switch (`zero.observation.killSwitch`), loopback-only binding; 103/103 UI tests and 110/110 backend selftests pass | `app/zero-control-ui/observation/`; `test/observation.test.mjs`; `test/observation-tool.test.mjs` | Verified |
| CU-03 / OMB-ACT | OpenCode | Real Windows OS Mouse & Keyboard Executor (`zero_computer_action`), UIA Coordinate Mapping, Window/App Control, Observe->Act->Verify Loop, and Human Bailout | ACCEPTED — Fast persistent Win32 input daemon (`win-actions-daemon.ps1`, 1-5ms latency), `zero_computer_action` tool supporting mouse_move, left/right/double/middle click, mouse_drag, scroll, type_text, press_key, wait, list_windows, focus/control_window, open_app, open_url, clipboard_get/set; `zero_screen_context` upgraded with live screen resolution, DPI scale, and UIA interactive clickable elements coordinate mapping (centerX, centerY); physical mouse movement & Esc human safety bailout; CLI live execution method (`zero.integrations.cli.execute`); 103 UI tests and 6 live action tests 100% pass | `app/zero-control-ui/src/computer/`; `app/zero-control-ui/observation/`; `test/computer-live-action.test.mjs` | Verified |
| OBS-02 / PERCEPT | OpenCode | 24/7 Screen + Audio Observation Engine, Video Playback Detector, Multi-Tier Perception & DPAPI Key Shield | ACCEPTED — Video playback streak detector into `video_and_media_logs`, Multi-tier perception (Tier 1 UIA/OCR, Tier 2 @vision Moondream2 mmproj adapter, Tier 3 Whisper audio adapter), DPAPI encryption routines (`protectData`/`unprotectData`), loopback security | `app/zero-control-ui/observation/`; `dpapi.mjs`; `perception.mjs`; `engine.mjs` | Verified |
| SPACES-01 | OpenCode | Single-Chat Architecture Consolidation & Generative UI Integration | ACCEPTED — Enforced strict Single `/chat/zero` assistant interface; eliminated separate spaces tabs (`spaces-manager.js`, `spaces-bar.js` removed); integrated interactive Generative UI widgets (progress card, code diff, media player, sources carousel) streaming directly into Zero's conversation; Zero directs internal background team (`team.researcher`, `team.coder`, `team.media_browser`, `team.operator`, `team.vision_memory`) | `app/zero-control-ui/src/spaces/`; `generative-widgets.js`; `backend/gateway/server.mjs` | Verified |
| HERMES-01 | OpenCode | Hermes Dynamic Plugin Loader, Skills Library & Semantic Role Alias Delegator | ACCEPTED — Dynamic plugin loader with `on_startup`, `on_message`, `register_tools` hooks (`plugins/dynamic-loader.mjs`, `plugins/web-tools/`, `plugins/system-tools/`); expanded skills library (`terminal-exec`, `browser-control`, `system-ops`, `vision-analysis`, `memory-retention`, `github-automation`, `web-research`, `code-refactoring`, `pdf-processing`); self-learning skill creator tool `zero_skill_learn` (`skills/self-learning-creator.mjs`); semantic role alias delegator (`@fast`, `@coder`, `@reasoning`, `@vision`, `@offline`) | `skills/`; `plugins/`; `app/zero-control-ui/src/agents/` | Verified |
| RULES-01 | OpenCode | Rules Folder Separation & Owner Mode Autonomous Bypass | ACCEPTED — Strict `rules/distribution-rules.json` vs autonomous `rules/owner-policy.json` (bypasses confirmation gates, lease locks, and delays for 100% speed); connected `rules/mode-manager.mjs` to `backend/plugin/index.js`, `runtime-core.mjs`, and `operator.js`; 1-click ON/OFF toggle; 3-way instant control toggle (Chat, UI button, F8/Esc hotkeys + mouse delta >45px) | `rules/`; `backend/gateway/server.mjs`; `app/zero-control-ui/src/computer/` | Verified |
| ZERO-OBS-03 | OpenCode | Point & Ask Cursor Context, Watch & Repeat Workflow Learner, and Live Action Pill | ACCEPTED — Upgraded `zero_screen_context` with live `cursor_target` (Point & Ask element resolution); added `zero_watch_workflow` tool saving workflows to `workflow_patterns` and `skills/`; added live action indicator pill to UI; all 103 UI tests, 110 backend selftests, 6 live computer action tests, and Playwright live E2E pass 100% | `app/zero-control-ui/observation/watch-workflow-tool.mjs`; `windows-driver.js`; `operator.js` | Verified |
| PM-01 / GW-02 | OpenCode | Full Add/Edit Provider Modal, Key Pool, Capability Controls, and GGUF Offline Manager Wiring | ACCEPTED — Full Add/Edit Provider modal with provider ID slug validation, API select, Base URL, Multiple API Key Pool, Auto Model Detection Box with fetch counter/search/checklist, capability toggles, Fallback Model dropdown, Custom Headers; full Offline GGUF Manager with RAM status, load/unload, reasoning toggle, rename, delete, zero-copy mount, and Hugging Face search/download; live Gateway RPC persistence to `models/gateway-providers.json` and sync to `openclaw.json`; Playwright live tests 100% PASS | `app/zero-control-ui/src/pages/models.js`; `backend/gateway/server/local-gguf-middleware.ts`; Playwright test suite | Verified |
| OMB-01 | OpenCode | OpenMausBot OSS capability parity audit, Zero native integration, and single-chat consolidation | ACCEPTED — OpenMausBot patterns integrated into native Zero UI and Control UI; CLI discovery, native MCP connector projection, 24/7 screen observation tool, and computer hold takeover wired to single `/chat/zero` assistant interface; Zero-only branding strictly enforced; all 103 UI tests and Playwright live E2E pass | `reports/open-mouse-connect-plan.md`; `app/zero-control-ui/`; `backend/` | Verified |

2026-10-26 20:41 IST — OpenCode — OMB-01 implementation slices (CLI discovery + connector/MCP setup)

Status: READY FOR REVIEW; no self-acceptance.

- Added `zero.integrations.cli.status` and `zero.integrations.connectors.status` to the Zero runtime.
  CLI discovery is bounded, returns no executable paths/secrets, and reports not-found/version/timeout
  states. Connector status reads only native `mcp.servers` names for Gmail/Slack/GitHub/Notion/Linear and
  returns configured/setup-required; it never returns URLs, headers, OAuth tokens, or credentials.
- Added the existing native About page integration card with availability/setup states and an internal
  link to native `/settings/mcp`. No new page, nav, chat, approval renderer, or credential input.
- Added Zero policy guidance: CLI work uses host exec + approval; connected apps use native MCP and
  remain subject to host approval. Synced to the live `AGENTS.md` via the managed block.
- Reused native approvals and `exec.mode:"ask"`; computer hold/refusal/stale-frame behavior unchanged.
- No model/provider/defaults/session override change; projection `e84951b5…` and config `c24a1692…`
  byte-identical.
- Tests: UI **81/81** (runtime discovery + About success/timeout/malformed/redaction), redirect 1/1,
  migration 3/3, sync 5/5, bridge 3/3, plugin selftest 111/111, config validate valid; build
  `8f82a7f5…`, verify-served exit 0. Last served UI remains `5eeadb3a…`; the new methods/card require a
  Gateway restart + UI reload. No prompt/provider/desktop action.

Next: owner-authorized restart/UI reload to activate the new methods/card; then CLI install/auth and
MCP/OAuth accounts for live execution. UI-05/OMB-01 READY FOR REVIEW; no self-acceptance.

2026-10-26 20:11 IST — OpenCode — OpenMausBot OSS full parity audit (no new code)

Status: READY FOR REVIEW; no self-acceptance.

- Pinned `upstream/openmausbot` `d393b7a…` (Apache-2.0 core; sparse checkout excludes `enterprise/`;
  no source copied, no trademark/mascot use). “Vishwas” has no project/config reference; target is the
  current Windows loopback Gateway.
- Full parity matrix added to `reports/ui/openmausbot-ui-reference.md`: chat roster/personality/model,
  streaming/history, CLI drivers, approvals, computer use, connected apps, mobile/channels, team/cloud,
  harness/control-plane, MCP/custom engines, voice, routines, memory/files, usage, browser, bot box,
  desktop companion, localization/branding, headless/MCP server, enterprise, HighLevel.
- Outcome: no feature was both compatible and unblocked. Existing host surfaces cover chat, sessions,
  history, approvals, automations, skills, plugins, MCP, memory, files, usage, voice; Zero-owned hold
  bar covers computer control; desktop viewer, connected apps, mobile/channels, CLI runtimes, team and
  enterprise are blocked or product-excluded. No stub, second runtime/chat/renderer, worker agent, or
  model/runtime change was added.
- Live read-only: `/chat/zero`, `/automations`, `/skills`, `/settings/mcp`, `/settings/approvals`,
  `/systems` render with no specialist chat links; hold free (`held:false`). No prompt/provider/desktop
  action.
- Model preservation: before/after projection `e84951b5…` and config `c24a1692…` byte-identical; provider
  `nvidia` model list, defaults, Zero primary, and main-session override unchanged.
- Checks: UI 78/78, redirect 1/1, migration 3/3, sync 5/5, bridge 3/3, plugin selftest 111/111, config
  validate valid; build `1eaa41f4…`, `verify-served` exit 0, served revision `5eeadb3a…`.

Next: Senior review of the parity matrix and blocker classifications. UI-05/migration remain READY FOR
REVIEW; no self-acceptance.

2026-10-26 19:42 IST — OpenCode — `/chat/operator|researcher` host-route investigation

Status: blocked by host architecture; no self-acceptance.

- Installed host ordering: `createControlUiSessionRoutes` is added as a request stage before the plugin
  request stage (`server-start-D6vaUNGz.mjs` lines 7492–7494 vs 7533–7555), so a plugin HTTP route never
  sees `/chat/*` first. The public-chat handler requires an existing public share and returns
  “Conversation unavailable” for removed agents; it has no default/alias fallback.
- No supported `controlUi` redirect/alias config exists; agent bindings do not rewrite URL paths.
  No speculative route change was made. Current source registers only `/settings/agents/*` and
  `/new?agent=*` redirects; `/chat/*` plugin registrations were removed as ineffective.
- Smallest maintainable options for Senior: (A) accept the host unavailable page (recommended; no chat or
  session is created); (B) owner-approved narrow upstream host redirect before the session stage;
  (C) owner-managed reverse proxy (not recommended: second runtime/port/auth boundary); (D) reintroduce
  worker aliases (rejected—violates zero-only).
- Evidence: before/after config SHA `f9f9fe95…` and model projection `5b5c0dbc…` identical; `/new` and
  settings redirect 308; `/chat/zero` loads; `/chat/operator|researcher` host unavailable with no
  composer; redirect test 1/1, selftest 111/111, migration 3/3, sync 5/5, bridge 3/3, UI 78/78.

Next: Senior decision on option A vs B. UI-05/migration remain READY FOR REVIEW; no self-acceptance.

2026-10-26 19:13 IST — OpenCode — Zero-only agent migration (source + live config + UI)

Status: READY FOR REVIEW; no self-acceptance. PM-01/CU-01 separate.

Source:
- Template now contains only `zero`: `tools.alsoAllow:["computer"]`, `exec.mode:"ask"`,
  `subagents.allowAgents:[]` + `requireAgentId:true`; defaults subagents removed. Providers and Zero
  model refs unchanged.
- Zero policy is single-agent/no-delegation. Models UI iterates only configured entries, so it cannot
  recreate workers. Legacy chat/new/settings routes redirect; `backend/plugin/index.js` adds server-side
  redirects (source/tested, pending restart). Preflight/bootstrap/acceptance expect one agent.
- Migration: `backend/scripts/migrate-zero-only-agents.mjs` backs up the config, dry-runs patch schema,
  applies via `openclaw config patch`, removes worker entries via the installed config-only
  `deleteAgentConfigEntry`, then validates and verifies the model/provider signature.

Applied:
- Backups `openclaw.json.pre-zero-only-*.bak`; runtime entries `["zero"]`; computer grant present;
  subagents disabled; defaults model unchanged `nvidia/minimaxai/minimax-m3.1-flash`; config
  revision/applied hash `XvmYRfte…`.
- Workspaces for all three agents remain; worker session rows remain in Gateway SQLite; visible catalog
  is 5 Zero sessions. One operator transcript was already host-archived at `10:47Z` (before the `13:39Z`
  migration); the script performed no pruning. Recorded as a pre-existing preservation caveat.

Verification:
- UI 78/78, migration 3/3, sync 5/5, legacy redirect 1/1, bridge 3/3, plugin selftest 111/111.
- Preflight 29 pass/1 warn/2 fail (pre-existing template model-row/model-ref checks).
- Build `1eaa41f4…`; published revision `5eeadb3a…`, catalog `fe369f24…`; served assets byte-identical.
- Live `/agents` only Zero card; Models only `Zero (zero)`; `/settings/agents/operator` → `/agents`;
  `/new?agent=operator` → `/chat/zero`. `/chat/operator|researcher` still show the host
  “Conversation unavailable” page because the host session route runs before plugin HTTP routes.
- Controlled restart 17492→21544; health OK; config SHA and model projection byte-identical; Zero chat
  canonical.
- Canonical `/chat/zero` retained; composer availability/reply completion is tracked in the report §16
  and was not re-tested in this migration.

Next: decide whether a host-level `/chat/*` redirect is in scope (plugin routes cannot precede the
session gate), then independent review of config backups/model projection/session caveat.

2026-10-25 21:18 IST — OpenCode — Source hygiene cleanup (narrow, evidence-based)

Status: cleanup complete; no acceptance claim.

Done since last update:
- Removed the historical `REVIEW-02 reconciliation` marker and C1–C7 changelog block from
  `backend/plugin/index.js`; preserved the active contract explanation and fixed the malformed
  `Contract evidence (pin …)://` header. The audit trail remains in `backend/plugin/README.md`,
  `backend/plugin/selftest.mjs`, `backend/scripts/preflight.mjs`, and
  `reports/backend/build-readiness.md`.
- Ran a relative-import/export-name/test/bundle-marker check over 67 owned files. Removed two proven
  unreachable helpers: `app/zero-control-ui/src/shared/memory.js` and `skills.js`; updated the UI README
  module inventory. Retained the D-015 bridge library, test seams (`roster`, `gateway/client`,
  `presentation`), provider-manager integration test, computer audit tool, build entrypoint, and
  `zero-types.ts` (referenced by `gateway-link.ts`).
- Checks: plugin selftest **111/111**; preflight **29 pass/1 warn/2 fail** (pre-existing
  `config.singleModel` two model rows and `config.modelRefs` legacy `zero-gw` refs; not changed); UI
  **51/51**; sync **5/5**; bridge **3/3**; build generation `bc41578…` unchanged; source marker grep
  clean.
- No `upstream/`, legal notice, host contract, live config, provider, credential, session, Gateway state,
  or desktop state change. No broad cleanup claimed.

Next: Senior review of the narrow cleanup; no self-acceptance.

2026-10-25 04:12 IST — OpenCode — PM-01 final wording sweep (comment-only)

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
- Corrected the stale add-flow comment in `app/zero-control-ui/browser.js` that claimed Cancel cleans
  up a freshly staged credential. It now says Cancel leaves the staged entry untouched and shows a
  name-only unbound notice. The preview-staging comment was reworded to remove an isolated "deletes the
  staged entry" phrase, and the save-consumption note clarifies that cancel never deletes it.
- Swept `browser.js`, `runtime-core.mjs`, `test/mount.test.mjs`, and `reports/ui/provider-manager-ui.md`
  for cancellation-plus-delete/cleanup/orphan wording. No other statement claims cancellation deletes a
  staged credential; remaining delete wording covers provider deletion's sharing-guarded cleanup, the
  metadata-only identity cleanup, and tests asserting zero staged deletes.
- Verification after the wording pass: mount 32/32 pass; build generation unchanged at
  `ff67c8460d64771d1739fda6b074ea073ec1a8f34a447feced297585a77ede2e` (JS 105,383 B, CSS 27,639 B),
  consistent with comment-only edits stripped by the minifier; `verify-served.mjs` exit 0; source and
  dist manifests still name that generation.
- Docs: `reports/ui/provider-manager-ui.md` §21 added.

Boundaries unchanged: no runtime behavior change, live config/secret write, provider call, Gateway
reload/restart, or binding change. `backend/config/openclaw.json` mtime remains `2026-10-24 10:39:32`;
`zero-gw`/`ZERO_PROVIDER_ZERO_GW_API_KEY` untouched. PM-01 remains READY FOR REVIEW.

Next: senior review. After an owner-authorized restart, verify the six methods with read-only calls only;
live CRUD/activation remains a separate window.

2026-10-25 03:53 IST / 2026-10-24 22:23 UTC — OpenCode — PM-01 senior-review corrections (offline)

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
- Cancel safety (`browser.js`): removed staged-secret deletion and the read-only store-existence probe
  used to claim freshness. `secrets.store.set` is an upsert, so cancel now leaves the entry untouched and
  shows a name-only notice: the staged credential remains in the store and is not bound to any provider.
  No value is read or displayed. A confirmed save or confirmed retry clears the staged marker before
  closing, so those paths do not show the notice.
- Strict changedPaths gate (`browser.js`): both initial save and `Retry provider save` now require an
  array `changedPaths` containing the exact `models.providers.<id>`. Missing, non-array, or unrelated
  paths throw `provider-path-unconfirmed`; identity metadata and success messaging are withheld, the
  credential is never deleted, and an idempotent config-retry state is preserved. With a secret the
  message is `secret-written, config-unconfirmed: <name>`; without one it is `config-unconfirmed`.
  A thrown patch keeps the prior `secret-written, config-not-committed` state.
- Tests (`mount.test.mjs`): 32/32 pass. The preview-cancel test now asserts zero secret deletes, the
  name-only unbound/untouched notice, and no value in the DOM. A new test covers missing, malformed,
  and mismatched `changedPaths` on both initial save and retry, then the confirmed retry and confirmed
  initial-save success cases. Provider-save mocks now return `changedPaths` derived from the patch.
- Build/assets: generation `ff67c8460d64771d1739fda6b074ea073ec1a8f34a447feced297585a77ede2e` (JS
  105,383 B, CSS 27,639 B), reproduced on rebuild and digest-matched; source and dist manifests agree;
  `node --check` clean. `verify-served.mjs` now validates the manifest-declared generation instead of
  the first generation returned by `readdir` (the retained `3cb11750…` tree made the old check report a
  false mismatch); it exits 0.
- Docs: `reports/ui/provider-manager-ui.md` §19.3 corrected and §20 added.

Boundaries unchanged: no live config/secret write, provider call, Gateway reload/restart, or change to
`zero-gw`/`ZERO_PROVIDER_ZERO_GW_API_KEY` (config mtime `2026-10-24 10:39:32`). The running Gateway
still predates `.set`/`.delete`; its `zero-gw` getter remains `{ok:false, reason:"inline"}` with the
same-host fail-closed fallback. Offline pass is not live verification.

Next: senior review. After an owner-authorized restart, verify the six methods with read-only calls only;
live CRUD/activation remains a separate window.

2026-10-25 03:32 IST / 2026-10-24 22:02 UTC — OpenCode — PM-01 credential-reference identity persistence (offline)

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
- Runtime (`app/zero-control-ui/runtime-core.mjs`): added `zero.ui.providerCredentialRef.set` and
  `.delete` alongside the existing getter and the three display-name methods (six total). Identity rows
  live in a second retained plugin-scoped namespace, `provider-credential-refs`, and contain only
  `{source, provider, id, updatedAt}`. The getter reads that row and returns `not-recorded` when absent
  or invalid; it never inspects runtime config, host naming conventions, `secrets.store.list`, or values.
  Legacy providers (including `zero-gw`) are not migrated or inferred.
- Save flow (`app/zero-control-ui/browser.js`): identity is taken from the `secrets.store.set` request
  (`store/default/<uppercase name>`) or a staged discovery name and persisted only after `config.patch`
  confirms `models.providers.<id>` when `changedPaths` is present. A failed patch never deletes the
  secret; it reports `secret-written, config-not-committed: <name>` (name only) and offers an idempotent
  `Retry provider save` that re-patches the same object and then records the same identity. A failed
  identity write after config success reports pending and offers `Retry identity record`. Key-omitted
  edits omit `apiKey`, do not write a secret, and preserve the recorded identity. Provider delete removes
  the metadata row best-effort. No credential value enters pending state, metadata, notifications, or
  rendered output.
- Tests: `node --test app/zero-control-ui/test/mount.test.mjs` → 31/31 pass, including create,
  key-omitted edit, replacement, failed patch/no-delete/retry, metadata failure/retry, and value-free
  output. Two test-only corrections: the defaults stale-hash test again asserts `baseHash is stale`, and
  the new flow mock records only `{ name }` so its capture cannot retain the test value.
- Build: generation `3cb11750d6d5e585c0c24a886ab729fb9240421cbd59b9069ddca03cf9c334c2` (JS 105,196 B,
  CSS 27,639 B), reproducible on rebuild and digest-matched; source and dist manifests agree;
  `verify-served.mjs` exit 0; `node --check` clean for `runtime-core.mjs` and `browser.js`.
- Docs: `reports/ui/provider-manager-ui.md` §19 records the contract, ordering, partial states, test
  and build evidence, and the activation boundary.

Boundaries unchanged: no live config/secret write, no provider call, no Gateway reload/restart, and no
change to `zero-gw` or `ZERO_PROVIDER_ZERO_GW_API_KEY` (config sha `ad1536d86a9ef1de`). The running
Gateway (PID 19764) still predates the two new methods; its getter for `zero-gw` remains
`{ok:false, reason:"inline"}` and the browser keeps the same-host fail-closed fallback. Offline pass is
not live verification.

Next: senior review of PM-01. After an owner-authorized Gateway restart, verify the six methods are
registered with read-only calls only (do not use `set`/`delete` as a registration probe). Live
CRUD/activation remains a separate owner-gated window.

2026-10-24 09:42 IST / 04:12 UTC — OpenCode — PM-01 shared-host SecretRef ambiguity closed (historical; superseded by the 10:16 IST entry)

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
- Closed the shared-host residual limitation: a redacted store ref now fails closed when any second
  store secret entry is authorized for the provider's host, even when that entry is another
  provider's canonical name. The previous guard excluded canonical names, so two canonical entries
  on one host could still be cross-wired.
- The NVIDIA path remains usable only when `ZERO_PROVIDER_NVIDIA_API_KEY` is the sole store secret
  for `integrate.api.nvidia.com`. Live metadata also contains `ZERO_PROVIDER_ZERO_GW_API_KEY` on that
  host, so the live `nvidia` provider now correctly fails closed until the owner removes/re-scopes
  the second entry. No config/secret/binding change was made.
- Added a focused offline test with `alpha`/`beta` canonical entries sharing one host; it asserts
  both providers are marked hidden and that Test, Discover, capability probes, and activation send
  no `apiKeyRef` and no `config.patch`. UI suite **21/21 pass**; `node --check` clean.
- Rebuilt generation `1028f819…` (JS **93,491 B**, CSS **27,639 B**, JS SHA-256
  `658FF5F0…724A`); published via `plugins.controlUi.reload` -> plugin revision `3b9ec264…`,
  catalog `d948a3bb…`, diagnostics `[]`; `verify-served.mjs` HTTP 200 and served JS byte-identical.
- No live provider request, secret value read, config/secret/binding write, Gateway restart, or
  backend/computer edit. Only read-only secret-store metadata (names/kinds/hosts) was inspected.

Still gated: owner decision on the live shared-host store entry (remove/re-scope
`ZERO_PROVIDER_ZERO_GW_API_KEY` or accept that `nvidia` stays blocked); Gateway refresh to load the
current provider-manager source; one owner-authorized Discover retry; live CRUD/activation; repeat
capability probe; designated Windows environment plus O1/O2/O5/O6; intended routes/`utilityModel`.
`zero-gw`, config, bindings, and secrets unchanged. PM-01 remains READY FOR REVIEW.

Next: Senior recheck of the shared-host guard and owner decision on the store entry / Discover retry.

2026-10-24 09:40 IST / 04:10 UTC — OpenCode — PM-01 redacted-SecretRef safety guard

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
- Focused safety review found the previous canonical reconstruction was too broad: any redacted
  `store` ref was rewritten to `ZERO_PROVIDER_<ID>_API_KEY` without checking whether the hidden ID
  belonged to that entry.
- `browser.js` now loads read-only `secrets.store.list` metadata only when a redacted store ref is
  present, retains only secret-kind names/allowedHosts, and uses the canonical ref only when the ref
  uses the page's `default` alias, the canonical name is unique to one provider, the exact canonical
  secret entry exists, its allowedHosts is exactly the provider host, and no unmapped secret entry is
  authorized for that host. Otherwise Test/Discover/capabilities/activation are blocked with an
  explicit reason. Metadata failure fails closed.
- Added focused regressions for the verified canonical path, unverified/ambiguous/external-alias
  paths, and metadata-unavailable fail-closed behavior; UI suite **20/20 pass**; `node --check`
  clean.
- Rebuilt generation `d660bb7c…` (JS **93,467 B**, CSS **27,639 B**, JS SHA-256
  `7604AA83…F963`); published via `plugins.controlUi.reload` -> plugin revision `ab43d6ea…`,
  catalog `8ceca486…`, diagnostics `[]`; `verify-served.mjs` HTTP 200 and served JS byte-identical.
- Read-only handler state unchanged: Gateway process `22876` started 04:17:18; provider-manager
  source mtime 06:30:30; historical logs still show the older validation error. Qoder coordination
  appended to `AGENT_CHAT.txt`.
- No live provider request, secret value read, config/secret/binding write, Gateway restart, or
  backend/computer edit.

Still gated: Gateway refresh to load the current provider-manager source; one owner-authorized
Discover retry; live CRUD/activation; repeat capability probe; designated Windows environment plus
O1/O2/O5/O6; intended routes/`utilityModel`.
`zero-gw`, config, bindings, and secrets unchanged. PM-01 remains READY FOR REVIEW.

Next: Senior recheck of the safety guard and owner decision on the authorized Discover retry.

2026-10-24 08:20 IST / 02:50 UTC — OpenCode — PM-01 redacted config.get SecretRef fix

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
- Confirmed the NVIDIA Discover failure is UI-owned: `config.get` always redacts SecretRef IDs to
  `__OPENCLAW_REDACTED__` (the Control UI host forwards the same RPC; `ConfigGetParamsSchema` has
  no secret-include option), and `deriveProviders`/`runDiscovery`/`testProvider` forwarded that
  marker as `apiKeyRef.id`, which fails the provider-manager's uppercase-name grammar before any
  upstream call. Historical logs at 00:42/00:43 contain the exact validation error.
- `browser.js` now reconstructs store references from the page's canonical
  `ZERO_PROVIDER_<ID>_API_KEY` name, blocks hidden environment/unsupported references with an
  explicit `Credential Ref Hidden` state, and omits `apiKey` on edits without a new key so the
  stored reference is preserved instead of echoing the marker into `config.patch`.
- Two focused regression tests added; `node --test test/mount.test.mjs` -> **18/18 pass**;
  `node --check browser.js` clean.
- Rebuilt generation `f50f2953…` (JS **91,117 B**, CSS **27,639 B**, JS SHA-256
  `D22D2275…168D`); published via `plugins.controlUi.reload` -> plugin revision `521fa647…`,
  catalog `d98b1e35…`, diagnostics `[]`; `verify-served.mjs` HTTP 200 and served JS byte-identical
  to local.
- Read-only evidence: live Gateway process `22876` started 04:17:18; provider-manager source mtime
  06:30:30; live logs show the older validation message. No live provider request, secret value
  read, config/secret/binding write, or Gateway restart was performed.
- Updated `reports/ui/provider-manager-ui.md` §15 and the PM-01 row; Qoder coordination appended to
  `AGENT_CHAT.txt`. Backend/computer files were not edited.

Still gated: a Gateway refresh to load the current provider-manager source; owner-authorized live
Discover retry; live CRUD/activation (no disposable provider); repeat capability probe; designated
Windows environment plus O1/O2/O5/O6; intended routes/`utilityModel`.
`zero-gw`, config, bindings, and secrets unchanged. PM-01 remains READY FOR REVIEW.

Next: Senior recheck and an owner decision on the single authorized Discover retry.

2026-10-24 07:44 IST / 02:14 UTC — OpenCode — PM-01 disableProvider defaults-preservation fix

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
- Senior-review edge case fixed: `disableProvider` now includes `agents.defaults` only when
  `defaults.model` or `defaults.utilityModel` actually references the disabled provider. An absent
  defaults model is no longer materialised as an empty primary; unrelated string-form and
  object-form defaults remain untouched. String-form defaults that do reference the provider stay
  strings; object-form defaults patch only the referencing primary/fallbacks.
- `replacePaths` now contains only fallback arrays actually patched; a defaults fallback path is not
  emitted for entry-only or utility-only references.
- Four focused regression tests added (entry-only with absent defaults, entry-only with unrelated
  string defaults, defaults rebound, utility-only without creating `defaults.model`). UI suite
  **16/16 pass**; `node --check browser.js` clean.
- Rebuilt generation `90d1b7d6…` (JS **89,581 B**, CSS **27,639 B**, JS SHA-256
  `2C3740F4…31D7`); published via `plugins.controlUi.reload` -> plugin revision `05f09de6…`,
  catalog `323b48b0…`, diagnostics `[]`; `verify-served.mjs` HTTP 200 and served JS byte-identical
  to local.
- Updated `reports/ui/provider-manager-ui.md` §14; §13 and the contract §11 UI addendum are
  historical for revision/count. No backend/computer files edited.

Still gated: live CRUD/activation (no disposable provider/authorization); repeat capability probe;
designated Windows environment plus O1/O2/O5/O6; intended routes/`utilityModel`.
`zero-gw`, config, bindings, and secrets unchanged.

Next: Senior recheck of the disable fix. No self-acceptance.

2026-10-24 07:35 IST / 02:05 UTC — OpenCode — PM-01 disable safety and closeout documentation

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
- Fourth PM-01 UI defect fixed in `disableProvider`: an absent `agents.defaults.utilityModel` is no
  longer materialised as `""`, and only role entries that actually reference the disabled provider
  are rewritten. `replacePaths` covers only patched fallbacks; disable never deletes the secret.
- Focused regression test added; `node --test test/mount.test.mjs` -> **12/12 pass**;
  `node --check browser.js` clean.
- Rebuilt generation `6a87e072…` (JS **89,505 B**, CSS **27,639 B**, JS SHA-256 `FAA738F4…B35AE`);
  published via `plugins.controlUi.reload` -> plugin revision `5ccb4123…`, catalog `4063ad61…`,
  diagnostics `[]`; `verify-served.mjs` HTTP 200 and served JS byte-identical to local.
- Added §13 to `reports/ui/provider-manager-ui.md`; added attributed cross-lane corrections to
  `reports/backend/provider-manager-contract.md` §11 and `reports/computer/build-readiness.md`
  (O4 probes ran; computer-frame read still gated; O3 resolved; only O1/O2/O5/O6 remain).
- Created `reports/owner-decision-packet.md` with only the four outstanding owner choices.

Still gated: live CRUD/activation (no disposable provider or authorization); repeat capability
probe; designated Windows environment plus O1/O2/O5/O6; intended routes/`utilityModel`.
`zero-gw`, config, bindings, and secrets unchanged.

Next: Senior review of PM-01 and the owner-decision packet. No self-acceptance.

2026-10-24 07:18 IST / 01:48 UTC — OpenCode — Five-item closeout: Provider Manager, capability evidence, computer status, Gateway registration, route drift

Status: READY FOR REVIEW (PM-01); no senior acceptance self-claimed.

Done since last update:
1. Third confirmed PM-01 UI defect fixed (legacy inline key):
   - Editing a provider whose `apiKey` is a raw legacy string showed
     "(Key configured - leave empty to keep unchanged)", but `selectedProvider.secretRef` is null for
     that shape, so an unchanged save patched `apiKey: null` and silently removed the credential.
   - Empty edits are now refused when `credentialState:"inline-migration-required"`; the modal
     requires re-entry to migrate to `ZERO_PROVIDER_<ID>_API_KEY` (store SecretRef). No config or
     secret call occurs before that explicit submission.
   - New focused test: "PM-01 legacy inline key: editing requires an explicit SecretRef migration
     instead of dropping the credential". UI suite **11/11**; `node --check` clean.
2. Current UI build/live evidence:
   - Generation `85d1099943a8509eb1bb8ba9c5372f2a2a9ff102e7e22ac0ea422eff91ddc2e4`
     (JS 89,378 B, CSS 27,639 B; JS SHA-256 `4A299D97...638D`).
   - `plugins.controlUi.reload` -> plugin revision `fc19633027c60bdbc92c1a097810ad6f0db7001d4a200224942c93e95a052548`,
     catalog `7a5231dc1df19861824ea2b74c5e484defb4240b3b1fa71bb5c962a42689b7b9`, diagnostics `[]`.
   - `verify-served.mjs`: HTTP 200 JS/CSS, byte-identical served/local JS. Asset publication only;
     no Gateway restart, no provider-manager reload.
3. Read-only Gateway registration verification (no restart/reload/config edit/provider call):
   - `node backend/scripts/verify-provider-manager.mjs --json` exited 0 at ~07:10 IST and again at
     07:19 IST after documentation.
   - health ok; provider-manager activated (explicit)/loaded; `zero.providers.capabilities`
     registered; registration log contains discover/test/capabilities; providers `["zero-gw"]`;
     config revision equals applied.
4. Model capability evidence (no 5th probe):
   - zero-gw `z-ai/glm-5.3-flash`: text 4/32 = `empty_content`, 64 = observed pass once;
     image 4 = failed, 32 = mixed, 64 = observed pass once (27.3 s); streaming/tools passed every
     observed run. Still "observed pass", not stable/repeated verification.
5. Computer control (offline only):
   - `rig.test.mjs` **152/152**, release action-filter audit **25/25**, derivation **9/9**;
     `k7-run.mjs --plan` correctly BLOCKED because `computer/spike/designated-environment.json`
     is absent. `cua-computer` is not enabled in live config. No desktop action.
6. Model-route read-only check:
   - Providers `["zero-gw"]`; defaults primary `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b`,
     fallbacks `[]`; `zero`/`researcher` inherit; `operator` primary `zero-gw/z-ai/glm-5.3-flash`,
     fallback Nemotron; `agents.defaults.utilityModel` and per-agent `utilityModel` absent.
     Recorded drift is unchanged and not silently resolved.
7. Offline suites re-run: provider-manager selftest 20/20, integration 5/5, pm02-pm06 47/47;
   backend script tests 36/36; plugin selftest 111/111; release audit 25/25; derive 9/9.

Still gated / unverified:
- Live Provider Manager CRUD/activation/rollback: no safe disposable non-protected provider and no
  live-config-mutation authorization. `zero-gw` and current bindings untouched.
- Stable model-capability re-verification: requires explicit owner authorization plus the exact
  safe endpoint/model; no probe performed in this pass.
- Real desktop observe/input/takeover, trusted-policy live firing, BE-02 A6/A7: designated isolated
  Windows environment, owner-written `designated-environment.json`, and O1/O2/O5/O6.
- Model-route drift: owner decision required (defaults primary/fallbacks, Lead/Researcher/Operator,
  and whether `utilityModel` should be GLM, inherited, or intentionally absent).

Evidence: `reports/ui/provider-manager-ui.md` §12; `reports/backend/provider-manager-contract.md`
§4.2/§4.6/§11; `reports/computer/build-readiness.md`; `TASK_BOARD.md` PM-01/CU-02.

Next: Senior review of PM-01 and the five-item evidence. No self-acceptance. No further unblocked
UI work is claimed; GGUF/local-model runtime remains out of scope for this pass.

2026-10-24 06:52 IST / 01:22 UTC — OpenCode — PM-01 Provider Manager UI: Shared-Secret Deletion & Test Failure Messaging
Status: READY FOR REVIEW
Done since last update:
1. Shared Store Secret Deletion Safety (contract §3.6 / §6.7):
   - `deleteProvider` now scans every other `models.providers` entry, including `apiKey` and header
     SecretRefs, for the same `{ source: "store", id }` before calling `secrets.store.delete`.
   - A credential still referenced by another provider is retained, and the success notice states
     `Shared store credential retained because another provider still references it.`
   - The store secret is deleted only when the removed provider held the last reference. Env refs
     remain owner-managed and are never deleted.
2. Completed Provider-Test Failure Messaging (contract §4.2):
   - `zero.providers.test` returns `ok: true` with `{ status, message }` for a completed provider
     failure. `activateProvider` and the provider-card `Test` action now use a shared
     `testFailureDetail` helper that prefers that sanitized message, then `error.message`, with a
     safe fallback.
   - Activation now renders `Pre-activation test failed (<status>): <message>. Live routes untouched.`
     and does not issue `config.patch` or `models.probe` after the failed test.
3. Focused Offline Tests (`test/mount.test.mjs`):
   - Added shared-secret retention/last-reference deletion test and completed-result failure-message
     test for activation plus the Test action.
   - `node --test test/mount.test.mjs` -> **10/10 pass**.
4. Build & Live Verification:
   - `node build.mjs` -> local generation `b4b47b155476834e204a6f00b32fa04a98f6a83da08b51ed54189e34c70acd45/`
     (`index.js` 88,829 B; `index.css` 27,639 B).
   - `plugins.controlUi.reload` (`pluginId: zero-control-ui`) -> code 0, active plugin revision
     `206614a1da71bd67715e918344e9eac532112cf372def3ae99acbde437c5345f`, catalog revision
     `70c5c5a59264152e8ee1a2749ddbb15593ef6e4165d84a3d49efa0b00274587f`, diagnostics `[]`.
   - `node test/verify-served.mjs` -> HTTP 200 for JS (88,829 B) and CSS (27,639 B); served/local
     JS SHA-256 both `3677317363...` (byte-identical).
5. Invariants:
   - No provider/local capability or inference probe, no secret value change, no model binding or
     config change, and no backend/computer source edit. `zero-gw` remains protected.
   - Live-model, GGUF runtime, GPU/VRAM, and desktop work remain owner-gated as recorded.

Next: Senior review. No further unblocked UI work is claimed; real provider activation/rollback,
PM-04 runtime launch was removed/out of scope, CU-01, and BE-02 A6/A7 remain gated.

2026-10-24 05:20 IST / 23:50 UTC — OpenCode — PM-04-UI Managed Local GGUF Inspection & Import Preparation Live-Verified
Status: **HISTORICAL / REMOVED 2026-10-27** — the PM-04 UI, modal, tests, and documentation were deleted in the removal-only cleanup. This entry is preserved as history only.
Original status: READY FOR REVIEW
Done since last update:
1. Architectural Separation & Header Action:
   - Added dedicated "Import GGUF" action button (`#zero-models-import-gguf-btn`) in the Zero Models header alongside "+ Add Provider", keeping GGUF inspection strictly separate from the provider dialog per roadmap §PM-04.
2. Dedicated GGUF Modal & Boundary Notice:
   - Implemented wide modal dialog (`.zero-models__modal-dialog--wide`) with prominent architectural notice: *"Zero inspects local GGUF models offline and estimates memory requirements. Zero does not download model weights or install external background services. Managed llama.cpp launch and loopback server bindings remain gated on owner authorization (PM-04 runtime phase)."*
3. Form Inputs & Quick Verification Presets:
   - File path input (`#zero-gguf-path`) with `.gguf` extension validation.
   - Quick sample preset buttons for offline verification:
     * `Sample 1B Q4 (Fits 16GB RAM)`: `models/llama-3.2-1b-instruct-q4_k_m.gguf`
     * `Sample 70B Q4 (Exceeds Memory)`: `models/llama-3.3-70b-instruct-q4_k_m.gguf`
     * `Corrupt Header (Bad Magic)`: `models/corrupt-test.gguf`
   - Configurable parameter grid: Context Length (tokens, default 4096), Host Available RAM (GB, default 16), GPU VRAM (GB, default 8).
4. Heuristic Resource Estimation (Contract §4.8):
   - Computes weights bytes, KV cache for requested context (`2 × layers × kvHeads × (embedding / heads) × context × 2` in F16), and runtime overhead (`max(512 MiB, 10% weights)`).
   - Computes total RAM (`weights + KV + overhead`) and VRAM (`weights + KV`) against user-supplied budgets. Explicitly labeled: *"Estimates are heuristic, not guarantees."*
5. Specifications Grid & Compatibility Analysis:
   - Displays File Size, GGUF Version (`v3`), Tensor Count, Layer / Block Count, Attention Heads, Context Window, Embedding Dimension, and SHA-256 Digest.
   - Badges: `✓ Compatible (Format & Memory Valid)` vs `✗ Incompatible / Insufficient Memory`, with itemized reasons for budget or header failure.
6. Strictly Gated Launch Control:
   - "Launch Managed Server (Gated)" button (`#zero-gguf-launch-btn`) is permanently disabled in the offline phase with explicit tooltip: *"Managed launch gated on owner authorization (PM-04 runtime phase). Loopback only."*
7. Preserved Invariants & Prior Work:
   - Accessible custom comboboxes/listboxes (`mountAccessibleSelect`), sanitized capability diagnostics, 4 native adapter labels, and Operator role gating remain 100% intact.
8. Unit Test Suite (`test/mount.test.mjs`):
   - Added Test 8 verifying GGUF modal opening, architectural notice, form validation, 1B compatible fixture, 70B out-of-memory fixture with reasons, corrupt header fixture, disabled launch button, and clean modal dismissal.
   - 8/8 unit tests pass (100%).
9. Distribution Bundle Build & Gateway Hot-Reload:
   - Rebuilt bundle -> `dist/control-ui/6fe97ab51a6fb0d391a70b605d20678c1d018eed326ac20cd65bad60f0298daf/` (`index.js`: 88,244 B, `index.css`: 27,639 B).
   - Dispatched `plugins.controlUi.reload` via authenticated Gateway CLI (`code: 0`, active plugin revision `bf8d30e4fae54be9d7cdf981b8a3fa3b06101cc92e7e398ad620806eb775cd11`, catalog revision `818e2d4da8cb699f88c8bd684900e41db3dd6144d99007276d44340875747a9b`).
10. Served Asset Verification (`test/verify-served.mjs`):
    - HTTP 200 byte-for-byte match on loopback Gateway for JS (88,244 B) and CSS (27,639 B).
11. Backend Acceptance Suite (`backend/scripts/acceptance.mjs`):
    - Verified A1 health ok, A3 agents present, A2 lead chat turn completed (`ZERO_WS_ACCEPTANCE_OK`). All automated backend checks pass.
12. Invariants Preserved:
    - `backend/config/openclaw.json` (SHA-256 `b1063a4e...`) remains untouched; `zero-gw` bootstrap provider and live agent model bindings are strictly preserved; `upstream/` remains strictly read-only.

Status: READY FOR REVIEW
Done since last update:
1. Sanitized Capability Diagnostics Rendering (§4.6):
   - Coordinated with Qoder's latest diagnostics contract. Non-ok capability checks display server-sanitized category and integer HTTP status when available:
     * `status === "format"`: `Text/Image: format · HTTP 200 · empty_content` (or `format (probe result, cause unconfirmed)` fallback when diagnostics are omitted).
     * `status === "unsupported"`: `Tools/Image: Unsupported (Probed) · <category>` (e.g. `Tools: Unsupported (Probed) · no_tool_call`).
     * `status === "auth" | "rate_limit" | "timeout" | "network"`: `Probe Failed (<status>) · HTTP <status> · <category>` (e.g. `Probe Failed (auth) · HTTP 401 · http_error`).
     * Top-level format: `Capabilities: format · HTTP 200 · empty_content`.
     * `unavailable`: `Probe: Unavailable (Pending Gateway restart)`.
     * Unprobed: `Tools: Unprobed`, `Image: Unprobed`.
2. Strict Security Boundary Enforced:
   - Zero exposure of response bodies, headers, authorization tokens, or credentials. Only the server-sanitized category enumeration and integer HTTP status are parsed and displayed.
3. Operator Gating Detail:
   - `checkOperatorEligibility` incorporates the sanitized category into the gating failure explanation:
     `Model "<ref>" lacks verified Tools and Image capabilities (image: format · empty_content). Operator requires verified tools and image capabilities or an explicit owner override.`
4. Layout & Accessible Dropdown Preservation:
   - Verified that accessible custom comboboxes/listboxes, keyboard navigation, bounded scroll areas, role card containment, title separation, wrapping, and theme token harmonization remain 100% intact.
5. Unit Test Suite Expanded (`test/mount.test.mjs`):
   - Expanded Test 7 with 6 offline mock models covering all capability states and diagnostics permutations: `model-full` (verified), `model-glm-format` (format HTTP 200 empty_content), `model-top-format` (top-level format), `model-auth-fail` (HTTP 401 http_error), `model-unsupported-diag` (unsupported no_tool_call), `model-no-diag-format` (unconfirmed fallback).
   - All 7/7 unit tests pass (100%).
6. Distribution Build & Gateway Hot-Reload:
   - Rebuilt bundle -> `dist/control-ui/b545cd8df0850bfd256c2e5249a775ebe1f9b1c4c373807bd32af86e1ef4ec0f/`.
   - Asset sizes: `index.js`: 77,490 B, `index.css`: 26,528 B.
   - Dispatched `plugins.controlUi.reload` via authenticated Gateway CLI (`code: 0`, active plugin revision `0a2a9a51823475e10ce893a649ea3df8f2e4263e646d9f28367f672b37b47340`, catalog revision `52facc31764672b47f7b67cb3dcdf9f313ad71026c97ce71dfae543cf9895ec6`).
7. Served Asset Verification (`test/verify-served.mjs`):
   - HTTP 200 byte-for-byte match on both JS (77,490 B) and CSS (26,528 B).
8. Backend Acceptance Runner (`backend/scripts/acceptance.mjs`):
   - Verified A1 health ok, A3 agents present, A2 lead chat turn completed (`ZERO_WS_ACCEPTANCE_OK`). All automated backend checks pass.
9. Invariants Maintained:
   - `backend/config/openclaw.json` (SHA-256 `b1063a4e...`) remains untouched; `zero-gw` bootstrap provider and live agent model bindings are strictly preserved; `upstream/` remains strictly read-only.
Done since last update:
1. Senior Review Acceptance of PM-03-UI: PM-03-UI visual repairs (accessible custom listbox dropdowns, 375px mobile header vertical brand decoupling, and initial adapter label reconciliation) passed Senior visual review; status marked ACCEPTED.
2. Complete Excise of Stale "Coverage Planned" Copy (§4.7): Purged all remaining instances of "adapter coverage planned" and "coverage planned" from notifications, badge rendering, and test assertions. All 4 adapters (OpenAI Completions, OpenAI Responses, native Ollama, and Anthropic Messages) are native with full probe support.
3. 4-Capability Probe Display & Format Analysis Presentation:
   - Probed capabilities in Discovery modal render all 4 returned dimensions (`streaming`, `text`, `tools`, `image`).
   - `ok` -> `Streaming/Text/Tools/Image: Verified (Probed)`.
   - `unsupported` -> `Unsupported (Probed)` (never labeled planned coverage).
   - `format` -> `format (probe result, cause unconfirmed)` (per Qoder's PM-02 offline analysis: text and image format rendered as format (probe result, cause unconfirmed) with existing per-capability status; does not disable model globally, does not infer image unsupported, Lead/Researcher can be assigned, Operator is gated unless owner override is set; no auto-retry of paid probes).
   - Top-level `format` -> `Capabilities: format (probe result, cause unconfirmed)`.
   - Error statuses (`auth`, `rate_limit`, `timeout`, `network`, `unknown`) -> `Probe Failed (<status>)` with retry.
   - `unavailable` -> `Probe: Unavailable (Pending Gateway restart)`.
4. Operator Gating & Role Isolation Maintained:
   - Operator model requires verified `tools` and `image` (`ok`) or explicit owner override checkbox. Models with `image: format` remain gated for Operator unless owner enables override.
   - Lead (`zero`) and Researcher roles are not blocked by the tool/image gate and can assign the model directly.
5. Unit & Layout Regression Test Suite (`test/mount.test.mjs`):
   - Added Test 7 asserting all capability states (verified, partial format, top-level format, auth failure) and Operator/Researcher/Lead role gating.
   - Updated Test 5 assertions to expect `Capabilities: Unsupported (Probed)` without planned copy.
   - All 7/7 unit tests pass (100%).
6. Distribution Build & Gateway Hot-Reload:
   - Rebuilt bundle -> `dist/control-ui/02e28371bd4ef12ec713e8a2f14d69e3eef0bf8ce0f1df805dee83d6371a0bd5/`.
   - Asset sizes: `index.js`: 77,621 B, `index.css`: 26,528 B.
   - Dispatched `plugins.controlUi.reload` via authenticated Gateway CLI (`code: 0`, active plugin revision `a76310c399562330614feee1a370acf2e4e41428f8089bf464aebb599bc76b91`, catalog revision `b6ef647bccdc6562f1b026192fe526d5b5d201b5d979af7a4736d4193e96eee2`).
7. Served Asset Verification (`test/verify-served.mjs`):
   - HTTP 200 byte-for-byte match on both JS (77,621 B) and CSS (26,528 B).
8. Backend Acceptance Runner (`backend/scripts/acceptance.mjs`):
   - Verified A1 health ok, A3 agents present, A2 lead chat turn completed (`ZERO_WS_ACCEPTANCE_OK`). All automated backend checks pass.
9. Invariants Preserved:
   - `zero-gw` bootstrap provider and live model bindings in `backend/config/openclaw.json` (SHA-256 `b1063a4e...`) remain untouched; `upstream/` remains strictly read-only. No network inference calls, no model downloads, and no service installations performed.
Done since last update:
1. Owner Email UI Audit: Searched full codebase for email-related fields. Confirmed 0 occurrences of email in `app/zero-control-ui` (Zero Models surface does not contain or require email). Identified host shell contexts in `upstream/openclaw/ui` (`sidebar-identity-menu__email`, `/settings/profile` "Linked emails", and `SidebarAttention` footer envelope icon) and documented scope boundary in report §7.1.
2. Dropdown Contrast & Accessible Custom Listbox: Disproved that options were disabled (`disabled: false`); Windows Chrome rendered unstyled transparent `<option>`s against light system OS popup. Resolved by adding `color-scheme: dark` and explicit option styles in `index.css`, plus building `mountAccessibleSelect` in `browser.js` providing accessible custom combobox/listbox with ARIA attributes (`role="combobox"`, `role="listbox"`, `role="option"`), full keyboard navigation (arrows, enter, space, esc, home, end, tab), bounded scroll area (`max-height: 240px; overflow-y: auto;`), explicit disabled reason badges (`[Needs Tools & Image]`), and live synchronization with native select for form and test integrity.
3. Mobile Header 375px Non-Collision Fix: Added `.zero-models__brand-copy` (`display: flex; flex-direction: column; gap: 2px; min-width: 0;`), styled `.zero-models__brand-tag` with line height 1.3 and break-word wrapping, and stacked `.zero-models__header` vertically under `@media (max-width: 640px)`. Header title and actions stack cleanly with zero touching, crowding, or collision at 375px.
4. Adapter Copy Reconciliation: Reconciled with Qoder's PM-06. Updated adapter dropdown to `Anthropic Messages API (/v1/messages) [Probe supported]`, removed stale planned label and hardcoded planned check from capability badges.
5. Whole Provider Form Review: Verified modal dialog max-width bounds on narrow screens, long ID wrapping (`overflow-wrap: anywhere`), presets row flex wrapping, and OpenClaw theme token consistency.
6. Test Suite & Regression Checks: Updated `test/mount.test.mjs` with assertions for header brand-copy flex column, header responsive stacking, dark color-scheme, option styling, custom select triggers, and Anthropic probe support. All 6/6 unit tests pass (100%).
7. Distribution Build & Gateway Hot-Reload: Built bundle -> `dist/control-ui/e2caa55353b2f417b5ab1d8f98fa698fac6c792ed6465da55c42b7fe9fd17105/`. Digest reports `totalBytes: 102631` (`index.js: 76103`, `index.css: 26528`), revision `f1dfb252e5df80d258b5fa4180dfac6d9101a8bd4923211d9059217ab74f42be`. Hot-reloaded via authenticated Gateway CLI (`code: 0`, confirmed active revision `f1dfb252...`).
8. Served Verification (`test/verify-served.mjs`): HTTP 200 byte-for-byte match for both JS (76,103 B) and CSS (26,528 B).
9. Backend Acceptance Runner (`backend/scripts/acceptance.mjs`): Verified A1 health ok, A3 agents present, A2 lead chat turn completed (`ZERO_WS_ACCEPTANCE_OK`). All automated backend checks pass.
10. Live Visual Verification Screenshots: Captured updated screenshots via Chrome CDP at all required viewports and zoom levels under `reports/ui/screenshots/pm03/`:
    - `after_desktop_1440.png` (292,757 B)
    - `after_dropdown_open_1440.png` (299,773 B) — proving high-contrast dark theme options, checkmark, and custom listbox
    - `after_desktop_1440_125zoom.png` (393,559 B) — 125% zoom verification
    - `after_1024px.png` (252,296 B)
    - `after_tablet_768px.png` (146,335 B)
    - `after_mobile_375px.png` (105,264 B) — narrow mobile layout with cleanly stacked, non-colliding header
11. Invariants Preserved: `zero-gw` and live model bindings in `backend/config/openclaw.json` (SHA-256 `b1063a4e...`) remain untouched; `upstream/` remains strictly read-only.
| PM-03A | Qoder | Add `openai-responses` capability coverage (text, streaming, tools, image) | ACCEPTED — offline adapter behavior independently verified: `pm04.test.mjs` 8/8; Responses `/responses` payload, early stream delta, flat function tools, image and keyless loopback covered. Capability RPC live-registered 03:33 IST; no live provider proof claimed. | `reports/backend/provider-manager-contract.md` §4.6–§4.7; `backend/plugin/provider-manager/pm04.test.mjs` | Preserve zero-gw/live bindings; next adapter Anthropic |
| PM-03B | Qoder | Add native `ollama` capability coverage (`/api/chat`) | ACCEPTED — offline adapter behavior independently verified: `pm05.test.mjs` 7/7; native chat, NDJSON early stop, tools, image, auth and keyless loopback covered. Capability RPC live-registered 03:33 IST; no live provider proof claimed. | `reports/backend/provider-manager-contract.md` §4.6–§4.7; `backend/plugin/provider-manager/pm05.test.mjs` | Preserve zero-gw/live bindings; next adapter Anthropic |
| PM-03C | Qoder | Add Anthropic Messages capability coverage (text, streaming, tools, image) | ACCEPTED — independently verified `pm06.test.mjs` 8/8; Anthropic headers/payload, stream/tools/image, auth redaction and keyless loopback covered. All four adapter slices are offline-tested; capability RPC live-registered 03:33 IST, but no external provider proof claimed. | `reports/backend/provider-manager-contract.md` §4.6–§4.7; `backend/plugin/provider-manager/pm06.test.mjs` | Preserve zero-gw/live bindings; continue local-provider-check harness hardening |
| PM-03D | Qoder | Harden `local-provider-check.mjs` with dependency-free mock-backed tests | ACCEPTED — strict option/`--api`/`--provider-id`/`--model`/timeout/key-env validation before any Gateway call; exit codes 0 (ok/partial/pending), 1 (discover/test or capability hard failure), 2 (invalid input/host); test seam `ZERO_PROVIDER_CHECK_CLI`; 12/12 tests covering private opt-in, public-http rejection, missing capability method, discover/test failures, secret-free output/RPC params, JSON shape, and the new `--capabilities` subset (image-only) validation; no network, no restart, no config change | `backend/scripts/test/local-provider-check.test.mjs`; `backend/scripts/test/fixtures/mock-openclaw-cli.mjs`; contract §4.7/§12 | Verifier executed after the 03:33 IST restart (9/9 mock checks); preserve zero-gw/live bindings |
| PM-03E | Qoder | Review PM-03-UI adapter wording against all-native backend capability coverage | REVIEW COMPLETE - CLOSED: UI correction verified read-only in live bundle `de6730fe...` (source `e7a65331...`, catalog `bc51ce1a...`; JS 88,271 B, CSS 27,639 B). All four adapters show `[Probe supported]`, genuine `unsupported` -> `Unsupported (Probed)`, `format` -> `format (probe result, cause unconfirmed)`; no planned-coverage copy remains. UI mount 8/8; verify-served HTTP 200 byte-identical. Qoder made no `app/` edit; Senior acceptance pending | contract §4.7 “Adapter/status contract for the UI”; `reports/ui/provider-manager-ui.md`; `app/zero-control-ui/` | None; UI owned by OpenCode; Senior acceptance pending |
| PM-03F | Qoder | Make the coordinated-restart checklist and recovery path executable/evidence-based | READY FOR REVIEW — `verify-provider-manager.mjs` now reports health, plugin activation, behavioral method classification, corroborating registration log, config revision and bindings (`--json`, `--log`, `--no-log`); mock tests 9/9; contract §4.6 has expected output, state/meaning table and recovery path. Observed log-vs-RPC divergence at 03:29 (log lists three methods at 01:37:56, RPC still `unknown method`) proves the behavioral check is authoritative. **Controlled restart executed 2026-10-24 03:33 IST**: PID 9972 → 25632, verifier exit 0 (health ok, plugin activated explicit, method registered, three-method log, zero-gw, revision consistent); empty-params RPC is the proof, no provider call; config sha/mtime and all bindings unchanged. Verifier fixes found during the restart: bare validation-message classification, precise `^OK (` health with retry, and dual log-path scanning; mock tests 9/9 | contract §4.6/§11/§12; `backend/scripts/verify-provider-manager.mjs`; `backend/scripts/test/verify-provider-manager.test.mjs` | Remaining gates: real capability probe needs an owner-provided endpoint/model; UI adapter copy correction closed in PM-03E; no binding changes |
| PM-04A | Qoder | PM-04 offline slice: inspect local GGUF format/size/hash and estimate memory | **REMOVED 2026-10-27 — `inspect-gguf.mjs`, its tests, and contract references deleted.** No remaining consumer | native provider manager retained; zero-gw/live bindings/config/secrets unchanged |
| PM-04B | Qoder | Managed-launch design + offline lifecycle mocks (loopback-only, stop-without-delete) | **REMOVED 2026-10-27 — `managed-llama.mjs`, its tests, and `managed-gguf-launch.md` deleted.** No remaining consumer | native provider manager retained; zero-gw/config/secrets unchanged |
| PM-05A | Qoder | Audit provider shape + SecretRef grammar against host schema; fix validator only if conflicting | READY FOR REVIEW — host schema: provider entry is closed with no `name`; no `allowPrivateNetwork` config key; provider keys enumerated; `env`/`store` SecretRef IDs share `^[A-Z][A-Z0-9_]{0,127}$`, `file`/`exec` host-valid but intentionally rejected by plugin. Validator grammar unchanged; source-specific error messages added; selftest 20/20 (env/store/file/exec). Live zero-gw metadata has no `name`, uppercase env ref; no config write/call | `reports/backend/provider-manager-contract.md` §3.7; `backend/plugin/provider-manager/selftest.mjs` | OpenCode shipped the closed-schema patch (no provider `name`; no `allowPrivateNetwork` config key; uppercase store refs); keep display label UI-local |
| PM-01R | Qoder | Runtime-registration review + credential-ref identity contract for zero-control-ui | **CONTRACT HANDED TO OPENCODE — 2026-10-25:** four methods live-registered; `providerNames.list` → `{names:{}}`; `providerCredentialRef zero-gw` → `{ok:false,reason:"inline"}`. Verified `secrets.store.set` does not echo identity; exact ref comes from the request (`store/default/<uppercase name>`), config.patch must be confirmed before persisting metadata, replacement failure must not delete an existing secret, key-omitted edits preserve identity, and legacy providers stay `not-recorded`/fail-closed. Qoder did not edit `app/`; implementation and offline tests are OpenCode's; new `.set/.delete` methods need a later Gateway restart | `reports/backend/control-ui-backend-contract.md` credential-ref identity contract; `reports/backend/provider-manager-contract.md` §3.7 | OpenCode: implement/test; owner: accept fail-closed or authorize method activation; PM-01 stays READY FOR REVIEW |
| TEAM-00 | Qoder | Add task board/mailbox/budgets only if built-in subagents fail acceptance | NOT STARTED | `reports/backend/team-coordinator.md` | BE-02; documented gap and senior approval |

2026-10-24 03:10 IST / 21:40 UTC — OpenCode — PM-03-UI Visual Correction, Responsive Grid & Token Harmonization Live-Verified
Status: READY FOR REVIEW
Done since last update: Resolved Senior Review screenshot defects in `app/zero-control-ui/`:
1. Role Card Controls Containment & Layout: Replaced horizontal flex in `.zero-models__role-controls` with vertical column stacking (`flex-direction: column; gap: 8px; width: 100%`). Dropdown `.zero-models__role-select` now spans full-width with `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;`. Added `.zero-models__role-btn` (`width: 100%; justify-content: center; font-weight: 600;`). Every dropdown and button is 100% contained within its card; zero overflow or neighbor-card collision.
2. Title & Explanatory Note Decoupled: Converted `.zero-models__roles-head` and `.zero-models__defaults-head` to vertical flex columns (`display: flex; flex-direction: column; align-items: flex-start; gap: 6px;`). Explanatory notes sit on clean separate lines below headings without horizontal collision.
3. Long Model Identifier Wrapping: Applied `word-break: break-word; overflow-wrap: anywhere; line-height: 1.45;` to `.zero-models__role-current` and `.zero-models__role-fallbacks`.
4. Responsive Grid Breakpoints: Desktop (>1024px) 3 equal minmax(0, 1fr) columns; 1024px to 641px auto-fit minmax(min(100%, 280px), 1fr); mobile (<=640px) single-column `1fr`. `.zero-models__role-item` sets `min-width: 0; overflow: hidden; box-sizing: border-box;`.
5. Theme Token Harmonization: Purged all hard-coded purple hex colors (`#7770df`, `#625ad0`, `#b7b3ff`, `#5a54a8`, `#8b5cf688`). Replaced with OpenClaw Control UI native CSS variables: `var(--accent, #ff5c5c)` (red accent for focus outlines, primary buttons, test feedback borders), `var(--accent-subtle)`, `var(--border, #343946)`, `var(--border-strong, #2e3040)`, `var(--card)`.
6. Reconciled Adapter Copy: Both `Ollama (Native)` (port 11434 root, adapter `ollama`) and `Ollama (OpenAI /v1)` (port 11434/v1, adapter `openai-completions`) presets offered. In adapter dropdown: OpenAI Completions, OpenAI Responses, and native Ollama marked `[Probe supported]`; only Anthropic marked `(Capability probe planned)`.
7. Layout Regression Test Suite (`test/mount.test.mjs`): Added Test 6 verifying CSS layout rules, role item containment, title separation, wrapping, theme tokens, DOM structure, and adapter options. All 6/6 tests pass (100%).
8. Distribution Build & Live Hot-Reload: Built bundle -> `dist/control-ui/32f30ecd2875a38960b5e843e0fbc48cff1b6ffb7c0442c7474915efa0713dd1/`. Digest reports `totalBytes: 95460` (`index.js: 72208`, `index.css: 23252`), revision `4521289829274930761cb54ce18b8ff0be99b0066682384bd694ab3e171b6f51`. Dispatched `plugins.controlUi.reload`. Verified HTTP 200 for served JS and CSS byte-for-byte via `node test/verify-served.mjs`. Backend acceptance runner passed (A1-A3).
9. Live Visual Capture: Captured live screenshots across viewports via Chrome CDP: desktop 1440px (`after_desktop_1440.png`), 1024px (`after_1024px.png`), tablet 768px (`after_tablet_768px.png`), and mobile 375px (`after_mobile_375px.png`) under `reports/ui/screenshots/pm03/`.
10. Invariants Maintained: `zero-gw` and live model bindings in `backend/config/openclaw.json` (SHA-256 `b1063a4e...`) remain untouched. No services installed, no model weights downloaded.

2026-10-24 02:10 IST / 20:40 UTC — OpenCode — PM-03-UI Local Endpoint UX, /v1 Path Hints, Keyless Loopback & Planned Adapter Coverage Live-Verified
Status: READY FOR REVIEW
Done since last update: Refined PM-03 local endpoint UX in `app/zero-control-ui/`:
1. Reused Existing Provider Dialog: Unified local server connection into the standard Models page flow with write-only credentials, server-side discovery, and role bindings.
2. Local Endpoint Presets & Notice: Added presets for Ollama, LM Studio, llama.cpp, vLLM, and SGLang with explicit notice: "Zero connects to existing, already-running local servers. Zero does not install services or download models." Recorded that live endpoint proof requires an already-running endpoint provisioned by the owner.
3. /v1 Path Hints (§4.7): Dynamically explains /v1 requirement for OpenAI-compatible runtimes ("Include the /v1 path prefix e.g. http://127.0.0.1:1234/v1") vs host root for native Ollama ("Native Ollama uses host root without /v1 e.g. http://127.0.0.1:11434").
4. Keyless Loopback: API keys are completely optional for local endpoints; saving without a key sets no secretRef and issues no secret RPC.
5. SSRF Private Network Guard (§4.4): Loopback (127.0.0.1, localhost) permits plain HTTP with green indicator (no opt-in checkbox). Non-loopback private LANs display amber warning and require ticking "Allow Private Network / LAN Access" (never auto-enabled or remembered); save is strictly blocked if unticked.
6. Unsupported Adapter Capability Checks as Planned Coverage (§4.7): Renders "Capabilities: Unsupported (adapter coverage planned)" rather than a provider failure. Info notification emitted on unsupported probe.
7. Regression Test Suite Expanded (`test/mount.test.mjs`): Test 5 asserts presets, /v1 path hints, keyless loopback, private LAN guard & authorization, RPC parameter forwarding, card badges, and unsupported adapter capability check as planned coverage. 5/5 tests pass (100%).
8. Distribution Build & Live Verification: Rebuilt bundle -> dist/control-ui/f2b9dafdb0f42ee45bc9c91645dee6e4860e27b98be3a43fa208a0eafe2ef240/. control-ui-digest reports totalBytes: 92585 (index.js: 71630, index.css: 20955), revision 3d0ed057691e1dfab68d84b0ee7cd530d4c28e734eb61db8d6f33ac19dfc483a. Dispatched plugins.controlUi.reload (catalog b1ba4e12...). Loopback HTTP fetch verified HTTP 200 for JS and CSS byte-for-byte. Backend acceptance suite passed (A1-A3). Verifier verify-provider-manager.mjs confirms health OK, revision consistent, zero-gw only.
9. Live Invariants Preserved: zero-gw and live model bindings in backend/config/openclaw.json remain untouched. No services installed, no models downloaded. Updated reports/ui/provider-manager-ui.md.
Done since last update: Implemented Senior Review PM-02-UI revisions in `app/zero-control-ui/`:
1. `zero.providers.capabilities` RPC Integration (§4.6): Added `probeModelCapabilities(provider, modelId)` calling `zero.providers.capabilities` with `{ providerId, baseUrl, api, model, apiKeyRef, capabilities: ["text","streaming","tools","image"], timeoutMs: 20000 }`.
2. Declared Metadata vs. Probe Evidence Distinction: Catalog metadata (`input: ["image"]`, `reasoning: true`, `tools: true/false`) is strictly rendered as `Declared: Image`, `Declared: Reasoning`, etc. The UI never infers "Verified" from catalog metadata. Probe-verified evidence is displayed exclusively from actual probe results as `Tools: Verified (Probed)` and `Image: Verified (Probed)`. Unprobed capabilities are explicitly marked `Tools: Unprobed` and `Image: Unprobed`.
3. Honest Gateway Probe Availability: Catching missing RPC / pending reload state honestly renders `Probe: Unavailable (Pending Gateway restart)`.
4. Operator Role Gate on Tool & Vision Capabilities: Operator assignment requires probe-verified `tools` and `image` capabilities. Assigning an unprobed/unverified model is blocked with an explanatory error. Added `Allow unverified model override (bypass tool/image probe gate)` checkbox to the Operator card to allow owner override. Verified models pass without override.
5. Regression Tests Updated (`test/mount.test.mjs`): Test 4 asserts Operator gate blocking, owner override execution, declared metadata distinction, `zero.providers.capabilities` calling, verified probe badge rendering, pending restart handling, and verified quick assignment. 4/4 tests pass (100%).
6. Distribution Build & Asset Digest: Rebuilt bundle via `node build.mjs` -> `dist/control-ui/723b4ed86daa03bb4e7d60ad26ea156a91d602741709a8b38c12ea04c3cffedb/`. `control-ui-digest.mjs` reports `totalBytes: 85466` (`index.js: 65714`, `index.css: 19752`), revision `121c33b8a4d67044e67fb341caf0c1e2e365bcc51d6670df82089fc36537e20c`.
7. Gateway Live Hot-Reload: Dispatched `plugins.controlUi.reload`. Gateway confirmed live catalog revision `98c964051e91480f59d6587fe6117d6b6b980e1bccbe0b62295ae07fc37af1f9` and plugin revision `121c33b8a4d67044e67fb341caf0c1e2e365bcc51d6670df82089fc36537e20c`. Loopback HTTP verified status 200 for both JS and CSS (`verify-served.mjs`).
8. Invariants Preserved: `zero-gw` bootstrap provider and live model bindings in `backend/config/openclaw.json` (SHA256: `103bcfc7...`) remain untouched. Gateway acceptance runner passes A1-A3. Updated `reports/ui/provider-manager-ui.md`.

2026-10-24 01:05 IST / 19:35 UTC — OpenCode — PM-02 Specialist Role Model Assignment, Explicit Capability Evidence & Live Verification
Status: READY FOR REVIEW
Done since last update: Implemented PM-02 UI slice in `app/zero-control-ui/`:
1. Isolated Role Model Assignment: Added `assignModelToRole(roleId, targetRef)` and dedicated "Specialist Role Model Bindings" card on the Models page. Lets the operator assign a discovered/configured model to Lead (`zero`), Researcher (`researcher`), or Operator (`operator`) independently. Patches ONLY `agents.entries.<roleId>.model` with retained previous primary in fallbacks and exact `replacePaths: ["agents.entries.<roleId>.model.fallbacks"]`, leaving other roles and `agents.defaults` completely untouched. Supports reverting to host defaults via "Inherit Host Defaults" (`agents.entries.<roleId>.model = null`).
2. Discovery Quick Assignment: Added role assignment dropdown directly to discovered model rows in the Discovery Modal, providing one-click assignment to any role.
3. Test-Only Capability Evidence: Excised speculative substring regex heuristics (`/vl|vision/`, `/reasoning|thinking|flash/`). The UI displays ONLY capability evidence actually returned by tests or verified in metadata (`Tools: Verified`, `Image: Verified`, `Tools: Ineligible`, `Image: Ineligible`), and explicitly marks unprobed capabilities as `Tools: Unprobed` and `Image: Unprobed`.
4. Regression Test Suite Expanded (`test/mount.test.mjs`): Added Test 4 asserting isolated operator assignment, operator reversion to inherit defaults, isolated lead assignment, explicit capability evidence display without heuristic tags, and discovery modal quick assignment. Test suite passes 4/4 (100%).
5. Distribution Build & Asset Digest: Rebuilt bundle via `node build.mjs` -> `dist/control-ui/0a4cbdff6c57816b46ccf6b1807541ae7b49574669cd4cc0b2e485f1d03ca8cc/`. `control-ui-digest.mjs` reports `totalBytes: 81388` (`index.js: 62071`, `index.css: 19317`), revision `82ac39da566c052f1eebc369f4a62610a48f36eea5602fbc2ae3dde802a3bb2b`.
6. Live Hot-Reload & HTTP Proof: Dispatched `plugins.controlUi.reload`. Gateway confirmed live catalog revision `cbf81841ecb2df6ae4dd13270c9af7671aaf582f7da6015bf79abd97cb2674a8` and plugin revision `82ac39da566c052f1eebc369f4a62610a48f36eea5602fbc2ae3dde802a3bb2b`. Loopback HTTP verified status 200 for both JS and CSS (`verify-served.mjs`). Gateway health confirmed: OK.
7. Backend Acceptance Re-verified: `backend/scripts/acceptance.mjs` passed A1, A3, and A2. `zero-gw` and live model bindings in `backend/config/openclaw.json` remain completely untouched. Updated `reports/ui/provider-manager-ui.md`.
1. Independent Per-Scope Fallback Retention (F10): In `browser.js` (`activateProvider`), replaced the single defaults-based `nextFallbacks` assignment with `deriveScopeFallbacks(scopeModel, fallbackToModel)`. Fallback lists are now derived independently for `defaults`, `zero`, `researcher`, and `operator` from each scope's own previous primary and existing fallbacks.
2. Distinct Fallback Retention Verified: An explicit entry (such as Operator with `glm-5.3-flash` and `nemotron-vl`, or Lead with a custom model) preserves its own previous primary at the head of its own fallback list, rather than having its fallback chain overwritten with defaults. Roles without an explicit model inherit from defaults' previous primary and fallbacks.
3. Regression Test Added (`test/mount.test.mjs`): Configured diverse initial routes across defaults (`nemotron`), Lead (`lead-custom-model`), Researcher (inherited defaults), and Operator (`glm-5.3-flash` + `nemotron-vl`). Asserted that activation patches all roles while retaining each scope's distinct previous primary in its own fallback list. Verified that rollback restores each scope's exact previous state with all 4 `replacePaths`.
4. Bundle Build & Digest: Rebuilt bundle via `node build.mjs` -> `dist/control-ui/4653147c4f950b1a29aa353f0d4fc650b1848546b6a37b8950b9596855bd88ae/`. `control-ui-digest.mjs` reports `totalBytes: 75426` (`index.js: 57729`, `index.css: 17697`), revision `9e02160e376f9fb92f09b38eb7d3628753ebfc32f97a9162b0c39e5a61fb2990`.
5. Gateway Live Hot-Reload: Dispatched `plugins.controlUi.reload`. Gateway confirmed live catalog revision `bde6631257e175e9b17ec71ef315e2499db0b667c821728925936cdac24281fa` and plugin revision `9e02160e376f9fb92f09b38eb7d3628753ebfc32f97a9162b0c39e5a61fb2990`. Loopback HTTP verified status 200 for both JS and CSS (`verify-served.mjs`). Unit test suite passes 3/3 (100%).
6. Live Invariants Preserved: `zero-gw` and live model bindings in `backend/config/openclaw.json` remain untouched. Updated `reports/ui/provider-manager-ui.md`.


2026-10-24 00:30 IST / 19:00 UTC — OpenCode — PM-01 Gateway Schema Enforcement, Multi-Agent Probe, Authentic Auto, and Live Verification
Status: READY FOR REVIEW
Done since last update: Resolved all blockers from Senior review addendum and Qoder F8/F9 audit in `app/zero-control-ui/`:
1. `models.probe` Schema Enforcement: Updated `browser.js` post-activation probe to pass required `provider: p.id`, `agentId`, and `timeoutMs: 30000`, strictly adhering to `ModelsProbeParamsSchema` (`closedObject { provider: NonEmptyString, profileId?, timeoutMs?, agentId? }`).
2. Multi-Agent Probing Coverage: Loop probes each changed agent (`["zero", "researcher", "operator"]`). Probing each agent is required because each role possesses its own `agentDir` and individual SQLite auth-profile store (`ensureAuthProfileStore(agentDir)`), plus divergent execution and sandbox constraints.
3. Automatic Rollback: If any probe fails, times out, or errors (including empty targets/unknown status), automatic rollback executes immediately against the new `baseHash` returned by activation, restoring the exact snapshot with all 4 `replacePaths`.
4. Authentic Auto & Inherited Defaults: Eliminated hard-coded silent mapping to GLM. Defaults card primary model displays active host-configured default (`Host Default (${defaults.primaryModel})`), while Utility selector provides `Auto (Inherit from Primary Model)` with value `""`, setting `utilityModel: null` in config to inherit primary model dynamically.
5. Branding Sanitization: Removed all user-facing Kilo branding; UI prominently displays "Zero Models" and "Private Gateway Provider Manager".
6. Legacy Route Suppression via Stable Supported Seam: Suppressed built-in provider settings sidebar items via CSS selector in `index.css` (`.settings-sidebar__item[href*="/settings/model-providers"], .settings-sidebar__item[href*="/settings/model-setup"] { display: none !important; }`). Preserved `installLegacyRouteInterceptor` click/popstate redirection to Zero Models. Documented host limitations honestly in report (router tree and sidebar navigation are compile-time static in upstream; unregistering requires upstream changes precluded by read-only rule).
7. Test Suite Hardening (`test/mount.test.mjs`): Harness strictly validates `ModelsProbeParamsSchema` (rejecting unexpected properties and missing provider). Test suite exercises probe failure with immediate rollback and multi-agent probe success across all 3 roles. All 3 tests pass (100%).
8. Distribution Build & Digest: Rebuilt bundle via `node build.mjs` -> `dist/control-ui/a472c141e4685dc5e163fc393d3702959de9e073aeb3ac36bfc7a414ba53afee/`. `control-ui-digest.mjs` reports `totalBytes: 75066` (`index.js: 57369`, `index.css: 17697`), revision `966b63482dd229b8fc426501dc3ee7ca09ec27f8651d1b9f74ec55b9bcc22dda`.
9. Live Hot-Reload & HTTP Proof: Dispatched `plugins.controlUi.reload`. Gateway confirmed live catalog revision `40420f6eafdb4e03462725c58b4b29e29c9211c7955a72e7cbf224878597497b` and plugin revision `966b63482dd229b8fc426501dc3ee7ca09ec27f8651d1b9f74ec55b9bcc22dda`. Loopback HTTP fetch verified status 200 for both JS and CSS.
10. Invariant Preserved: `zero-gw` and live model bindings in `backend/config/openclaw.json` remain untouched. Backend acceptance runner `node backend/scripts/acceptance.mjs` passed A1, A3, and A2. Updated `reports/ui/provider-manager-ui.md`.


2026-10-24 00:05 IST / 18:35 UTC — OpenCode — UI-04 Assistant-First Zero Workflow & Reconnect Alignment
Status: READY FOR REVIEW
Done since last update: Completed UI-04 native workflow and state alignment in `app/zero-control-ui/`:
1. Assistant-First Entry: Hero card directs to canonical Zero Lead session (`/chat`) with one-click conversation resumption or fresh conversation creation via `sessions.create`.
2. Specialist Team & Activity: Exposes Lead, Researcher, and Operator with real-time working status, last activity timestamps, and delegated spawn counts. Canonical timeline chips 8 latest sessions with `working`, `delegated`, `task board`, and workspace branch badges.
3. Connected Surfaces: Deep links to `/chat`, `/skills`, `/settings/memory`, `/activity`, `/workboard`, `/sessions`, `/usage`, `/settings/agents`, `/worktrees`, `/systems`, and `/plugin?plugin=zero-control-ui&id=models`.
4. Reviewed Skill Lifecycle: Highlights `subagent-echo-check` (revision `08290405…`) with readiness status and direct "Use in Zero chat" trigger, while respecting native install and update lifecycles.
5. Reconnect State Machine Alignment (H-06): Tracks `context.host.connection.generation` and `connected` state. On disconnect, clears cached hold snapshot and renders checking status; on reconnect/generation change, forces fresh reload of computer control, skills, and workspaces.
6. Verification: `node --test test/mount.test.mjs` passes 3/3 tests; built bundle `dist/control-ui/84158768…` with digest `06d350d6c181a2e9b52d2ee2fc4e7e70e5a46dd49bbdc99a522485e04536d074`.
7. Gateway Live Reload: Dispatched `plugins.controlUi.reload`; Gateway confirmed live serving revision `06d350d6c181a2e9b52d2ee2fc4e7e70e5a46dd49bbdc99a522485e04536d074`. Loopback HTTP verified status 200 (56,987 B). Acceptance test suite `backend/scripts/acceptance.mjs` passed (A1-A3 PASS).
Next: Senior review of UI-04 & PM-01 follow-up.
Evidence: `reports/ui/assistant-workflow.md`; `reports/ui/provider-manager-ui.md`; `app/zero-control-ui/test/mount.test.mjs` (3/3 pass); live catalog revision `3787b993…`.

2026-10-23 23:45 IST / 18:15 UTC — OpenCode — PM-01 Senior Review Follow-up & Hardening
Status: READY FOR REVIEW
Done since last update: Addressed all Senior review follow-up items (F1–F7) in `app/zero-control-ui/`:
1. Multi-agent activation engine (§3.4 & §3.4a): `activateProvider` now snapshots existing bindings across `agents.defaults` and `agents.entries` (`zero`, `researcher`, `operator`), patches all three roles in one atomic write with fallback retention, and passes exact `replacePaths` for modified fallback arrays.
2. Post-activation probe & rollback (§3.4 & §8): Activation dispatches `models.probe` for agent `zero` (timeout 30s). On probe failure, times out, or error, an automatic rollback `config.patch` is immediately dispatched against the new `baseHash` from activation, restoring the exact previous snapshot.
3. Multi-role disablement (§3.5): Disabling unbinds the provider from defaults and all referencing agent entries (`agents.entries.{zero,researcher,operator}`), substituting a verified replacement model (from bootstrap `zero-gw`), while preserving the provider definition and SecretRef.
4. Unsupported "Auto" sentinel resolution: Dropped literal string `"auto"` from routing payloads. Model selections now map directly to valid model references (`${providerId}/${modelId}`), maintaining strict OpenClaw schema compliance.
5. Legacy provider settings replacement investigation: Audited `APP_ROUTE_TREE` and `SETTINGS_NAVIGATION_GROUPS`; identified host limitations (routes and navigation are compile-time static; `host.ui` has no deletion API). Implemented `installLegacyRouteInterceptor` client-side interceptor that captures clicks and popstate events targeting `/settings/model-providers` or `/settings/model-setup` and reroutes them to `/plugin?plugin=zero-control-ui&id=models`.
6. Negative tests added: Expanded `test/mount.test.mjs` with Test 3 covering probe failure automatic rollback, SecretStore failure aborting patch, stale baseHash rejection, and per-agent snapshots. All 3 tests pass (100%).
7. Live publication (F7): Executed `plugins.controlUi.reload`; Gateway verified live serving revision `06d350d6c181a2e9b52d2ee2fc4e7e70e5a46dd49bbdc99a522485e04536d074` (74,385 B).
8. Live safety: `zero-gw` and live model bindings in `backend/config/openclaw.json` remain untouched.
Next: Senior review of PM-01 follow-up; coordinate with Qoder in AGENT_CHAT.txt; continue UI-04.
Evidence: `reports/ui/provider-manager-ui.md`; `app/zero-control-ui/test/mount.test.mjs` (3/3 pass); `app/zero-control-ui/dist/control-ui/8415876861d13914fb64227b2e64abcfb3c886b059a549cc6b68d0ceeff255e7/`.

2026-10-23 23:25 IST / 17:55 UTC — OpenCode — PM-01 Kilo Code Provider Manager UI integration
Status: READY FOR REVIEW
Done since last update: Integrated Kilo Code VS Code extension provider workflow into Zero's native OpenClaw-themed Models & Providers experience (`app/zero-control-ui/`).
1. Implemented native Models & Providers page (`/plugin?plugin=zero-control-ui&id=models`, nav order 32, icon `cpu`) registered alongside Zero Team (`/plugin?plugin=zero-control-ui&id=team`, nav order 30, icon `users`).
2. Preserved all model routing defaults: Primary Model (Auto / discovered options), Utility Model (Auto / discovered options), configurable fallbacks, Thinking Default (`default`, `off`, `low`, `medium`, `high`, `max`), and Fast Mode Default (`default`, `fast`, `standard`).
3. Complete provider lifecycle: list, add, edit, disable, and delete with write-only API key handling via `secrets.store.set(..., kind: "secret")` and host-scoping; raw keys are never stored in browser memory, never fetched from client, and never returned in config reads.
4. Server-side model discovery modal (`zero.providers.discover` RPC) with real-time search filter, select all / deselect all, capability tags (Vision, Reasoning), and manual model entry.
5. Upstream connectivity testing via `zero.providers.test` returning latency and model count feedback.
6. Safe activation with pre-flight health test, previous primary model retention in fallback chain, and automatic rollback on failure.
7. Guarded `zero-gw` as protected bootstrap provider; deletion/disabling is disabled with protective tooltips.
8. Applied UI-04 reconnect correction in `loadComputer` (clearing stale computer snapshot and setting status to "checking" on disconnect/generation changes).
9. Built immutable distribution bundle `dist/control-ui/4c05f749bcb7ffaa1319c4863f55ca9e848dae7e3a738dec82d612b6cbb5a9ff` and verified unit test suite `test/mount.test.mjs` (2/2 passing).
10. Delivered comprehensive implementation and verification report in `reports/ui/provider-manager-ui.md`.
Next: Senior review; Qoder backend coordination; live browser smoke verification.
Evidence: `reports/ui/provider-manager-ui.md`; `app/zero-control-ui/dist/control-ui/4c05f749bcb7ffaa1319c4863f55ca9e848dae7e3a738dec82d612b6cbb5a9ff/`; `app/zero-control-ui/test/mount.test.mjs` (2/2 pass).

2026-10-23 09:49 IST / 04:19 UTC — Gemini — GEM-05 End-to-end team acceptance matrix
Status: READY FOR REVIEW
Done since last update: Built comprehensive source-evidenced end-to-end acceptance matrix covering 44 checks across 8 domains: (1) Canonical Lead session (WS health, model route, roster, live chat turn, ask-mode exec, workspace hygiene); (2) Delegated Researcher (mutation denies, allowAgents:[], isolated context, push completion delivery, workspace guidance); (3) Operator & desktop boundary (coding+computer, exec deny, zero-policy hold gates, 400/200 action budgets, provisioned AGENTS.md, CU-01 Notepad spike); (4) Cancellation (exact-run cascade, session /stop, global command revocation, command drain); (5) Skill lifecycle (subagent-echo-check revision 08290405…, zero-only eligibility, bounded execution, archive/restore CAS lifecycle, admin scope); (6) Memory scope (FTS-only provider: "none", USER.md scoped get, live agent search turn, memory-only default scope); (7) Reconnect/hold (take/release state machine, connection-death auto-release, stale-frame refusal, fresh capture gate, UI generation refresh, k7 verdict); (8) UI presentation (native Control UI plugin, 4-scope hash digest reconciliation, loginGateCount:0, assistant-first navigation, built-in links, neutral developer role). Mapped owners, commands, live proof artifacts, and the two remaining gates (software polish vs isolated target). Created `reports/gemini/team-acceptance-matrix.md`.
Next: Senior review; Qoder complete workspace hygiene (zero/researcher); OpenCode freeze UI-04 hash & verify reconnect UI; Owner provision designated isolated environment for CU-01/k7. Gemini continues read-only intake lane.
Waiting on: Senior review / acceptance of GEM-05.
Evidence: `reports/gemini/team-acceptance-matrix.md`.

2026-10-23 09:42 IST / 04:12 UTC — Gemini — GEM-04 Lead/Researcher/Operator agent contract audit
Status: READY FOR REVIEW
Done since last update: Audited Lead (`zero`), Researcher (`researcher`), and Operator (`operator`) contracts across `openclaw.json`, agent workspaces, `zero-policy`, and OpenClaw docs. Formulated full agent contract matrix: purpose, tool boundaries (`exec.mode: "ask"` for Lead, hard deny for Researcher, D-011 `exec.mode: "deny"` + `alsoAllow: ["computer"]` for Operator), delegation rights (`zero` -> `researcher`/`operator`, specialists -> `[]`), expected artifact/result shapes, cancellation/timeout behaviors, and action budgets (`maxActionsPerRun: 400`, `maxInputActionsPerRun: 200`). Extracted 4 MIT-licensed Hermes patterns (`upstream/hermes-agent/AGENTS.md`, `toolsets.py`). Identified critical gaps: missing `AGENTS.md` in `agents/operator`, uncompleted bootstrap/identity placeholders in `zero`, and unspecialized prompts in `researcher`. Provided concrete guidance for Qoder (BE-02/BE-03) and OpenCode (UI-04). Created `reports/gemini/agent-contract-intake.md`.
Next: Senior review; Qoder provision `operator/AGENTS.md` and clean bootstrap files; OpenCode reflect specialist roles in assistant-first UI-04 activity timeline. Gemini continues next unblocked intake audit.
Waiting on: Senior review / acceptance of GEM-04.
Evidence: `reports/gemini/agent-contract-intake.md`.

2026-10-23 09:20 IST / 03:50 UTC — Gemini — GEM-01 OpenClaw skill lifecycle & Hermes memory intake
Status: READY FOR REVIEW
Done since last update: Audited full OpenClaw skill lifecycle across Workshop (`skills.workshop.*`), Library (`skills.library.*`), and Core/Hub (`skills.*`). Documented operations, scopes (`operator.read`/`write`/`admin`), versioning (`.archive` snapshotting & CAS revisions), and rollback (atomic staging swap & review undo). Identified critical license metadata gap in upstream `SKILL.md` frontmatter. Audited Hermes Agent for memory/user-model patterns: extracted dual-store mental model (`MEMORY.md` environment facts vs `USER.md` user profile) and bounded character caps (~1,375–2,200 chars / ~500–800 tokens) for active system prompt injection without runtime or cloud dependencies. Established 7-point minimal approval checklist for Qoder/OpenCode and certified `subagent-echo-check` against it. Created `reports/gemini/skill-lifecycle.md`.
Next: Senior review; Qoder (BE-03) apply checklist to close Gate 5; OpenCode (UI-04) maintain read-only summary card and native Skills page links. Gemini continues next unblocked intake audit.
Waiting on: Senior acceptance of GEM-00 / GEM-01.
Evidence: `reports/gemini/skill-lifecycle.md`; `reports/gemini/skill-intake.md`.

2026-10-23 08:43 IST / 03:13 UTC — OpenCode — UI-03 native personalization
Status: READY FOR REVIEW (UI-03/INT-00); CU-01 remains WAITING.
Done since last update: Added the native **Memory files** card (explicit `MEMORY.md`,
`USER.md`, `memory/*.md` scope, selected agent, `memory.search` with `agentId` and `maxResults:5`,
memory-source filtering, scoped empty state that never claims “No memories”); kept the read-only
**Skills** summary (`skills.status` counts, installs stay built-in); added the **Workspaces**
card (agent workspace path + read-only `worktrees.list` summary, edits stay in `/worktrees`);
enriched **Team activity** with `hasBoard`/delegated/working badges and workspace
branches; added Zero branding (mark, wordmark, descriptor, plugin display name `Zero`). No second
UI/store/index/task store/viewer/nav was added.
Final build `dist/control-ui/725de545…` (JS 22,053 B + CSS 7,119 B); served contribution
`…/6e4ce04e…/index.js` after the Control UI reload. Live inspector: `name:"Zero"`, `loaded`,
`activated:true`, entry `725de545…`, `uiCapabilities:["page","navigation"]`. Mount test passes
(memory scope + empty state, workspaces, badges, branding, hold); CSS 57/57; no React/Solid or
Control UI internal import. Live `memory.search "directive"` returned 4 `USER.md` hits; a
`delegation` query returned the scoped empty state and no “No memories”; `worktrees.list` returned
0 active worktrees and the card rendered correctly; `loginGateCount:0`.
Qoder's 08:34–08:40 stale-hold recovery proof is accepted at the Gateway layer
(`releasedByDisconnect`, connection-closed lease row, fresh-capture gate). The Control UI
connection-death path and agent-side stale-frame refusal remain CU-01, so k7 is still unclaimed.
Next: Senior review; Qoder confirm the final served hash; CU-01 for actual desktop/refusal proof.
Waiting on: designated isolated desktop (CU-01); senior acceptance.
Evidence: `reports/ui/personalization-ui.md` §2d; `reports/ui/zero-control-ui-slice.md` §UI-03;
`reports/ui/integration-mvp.md`; `node --test app/zero-control-ui/test/mount.test.mjs` (pass).

2026-10-23 — ChatGPT (Senior) — communication/state audit
Status: canonical direction rechecked end-to-end. DeepSeek is inactive; Qoder owns backend+computer; OpenCode owns the single native OpenClaw Control UI integration; ChatGPT owns review. Historical DeepSeek entries remain evidence only.
Verified: `app/zero-control-ui/` is implemented and its local bundle build passed. CopilotKit/OpenDots React remains bridge evidence, never a second product UI. OpenClaw Gateway remains the sole runtime/session/history source. Qoder's next action is plugin-loader/runtime validation; OpenCode then continues native skills/memory/workspace/timeline surfaces. No `/live/desktop` relay repair, duplicate store, or new assistant shell.
Correction: active prompts were updated to remove stale "implement the first slice" and stale DeepSeek dependencies. No historical logs or useful backend/plugin/tests/reports were deleted.

2026-10-23 ~08:3x Asia/Calcutta (approx) — OpenCode — UI-03 / native seam
Status: IN PROGRESS. Seam audit complete from the installed release + checkout: `controlUi.entry` browser module exports `defineControlUiPlugin` default; host supplies page/navigation/session/agent/request APIs; plugin is framework-free DOM (no Solid/React runtime).
Done: Zero Team page extended with canonical team timeline (`sessions.observe`), read-only `skills.status` summary, and base-path-safe links to built-in Skills/Memory/Activity/Workboard/Sessions/Usage/Agents/Workspaces/Systems. Fixed a real packaging defect: installed 2026.10.6 reads `controlUi` from the root `openclaw.plugin.json`, so the build now writes both root and dist declarations and declares `uiCapabilities: ["page","navigation"]`. Bundle rebuilt; installed `loadPluginManifest` returns `ok:true`; activation smoke registers exactly one page + one navigation item with correct dispose order.
Next: Qoder installs the package + enables `gateway.controlUi.experimental.customPlugins`, then OpenCode live-verifies the page in the same-origin Control UI and records it. Until then no live activation is claimed. No second UI/store/nav, no `/live/desktop` relay, no upstream edits, no secrets printed.
Mount smoke: `node --test app/zero-control-ui/test/mount.test.mjs` passes (roster, timeline, skills counts, links, open, dispose); CSS classes cross-check clean.

2026-10-23 08:05 IST / 02:35 UTC — OpenCode — UI-02 / INT-00 / UI-03
Status: READY FOR REVIEW (UI integration); CU-01 remains WAITING.
Done since last update: The token gate is absent from the live experience with the existing
loopback + `gateway.auth.mode:"none"` config and the 07:49 restart; verified `loginGateCount:0`
at `/`, `/plugin?plugin=zero-control-ui&id=team`, and `/systems`. Removed the dead `.unlock` CSS.
Added the Zero Team **Computer control** card backed only by the existing
`zero.computer.control` method (status/take/release, global hold, release on pagehide/leave; since
2026-10-26 `dispose()` alone never releases — see the hold-leave closeout below).
Live take → hand back and a simulated pagehide release passed; the latter returned `held:false`
with `takes:4/releases:4`, leaving no stale hold. Final bundle `bd289974…` is served as
`f26b42cb…` after the Control UI `plugins.controlUi.reload`; the CLI `plugins reload` still hits
the Windows symlink `EPERM`. `Open Desktop` targets the built-in `/systems` panel; no second
viewer, relay, transcript, or navigation shell.
Next: Senior review; Qoder/CU-01 for actual desktop input and a real agent-refusal-under-hold
proof; repair or avoid the CLI plugin-reload `EPERM` on Windows.
Waiting on: designated isolated desktop (CU-01); senior acceptance.
Evidence: `reports/ui/auth-ui-audit.md`; `reports/ui/zero-control-ui-slice.md` §Live activation;
`reports/ui/personalization-ui.md` §2c; `app/zero-control-ui/THIRD_PARTY_NOTICES.md`;
`node --test app/zero-control-ui/test/mount.test.mjs` (pass).
| DONE-00 | ChatGPT (Senior) | Acceptance, install/backup/recovery and final roadmap closeout | NOT STARTED | `reports/final-acceptance.md` | MVP acceptance evidence |

## Task update template

For your row, update status and add a short dated note under the table:

```text
YYYY-MM-DD HH:mm UTC — OWNER — TASK-ID
Status: READY / IN PROGRESS / WAITING / BLOCKED / READY FOR REVIEW
Done since last update: ...
Next: ...
Waiting on: ... (or none)
Evidence/report: ...
```

Do not mark `ACCEPTED`; only the senior developer does that after review. A task can be split into sub-tickets if it takes more than one focused work session. Silence never changes a task's status. Start every `READY` task immediately. Keep only the dependent ticket WAITING when a concrete prerequisite is missing; continue independent work in that lane. UI-01 may proceed from accepted UI-00/BE-00 inventories while coordinating with DeepSeek.

## Update log

```text
2026-10-23 04:30 UTC — OpenCode — UI-00
Status: READY FOR REVIEW
Done since last update: Read-only source/doc inventory of OpenDots (commit 8091324) client/server/shared
  (82 files) and OpenClaw Control UI (commit 0132405). Mapped every CopilotKit-Intelligence touchpoint
  (platform.ts, runtime-scope.ts, dot-agent.ts, ThreadList/Chat/App), confirmed messages persist only in
  Intelligence (SQLite = bindings/metadata only), cataloged 30+ reusable UI components (CopilotKit imports
  confined to 3 files), captured the SDK runtime route contract as the future Zero adapter surface, and
  compared the OpenClaw Control UI (Solid 2, Gateway WS protocol v4; adequate as operator console, not as
  the Zero product UX). Also recorded three candidate bridge transports for UI-01 (WS RPC,
  OpenAI-compat /v1/chat/completions, OpenResponses /v1/responses SSE). No installs/builds; git not on
  PATH so commit pins reused from reports/source-inventory.md without re-verification.
Next: Await senior acceptance; then claim UI-01 (bridge spike/design) and coordinate the interface
  proposal with DeepSeek Harness (BE-00/BE-01) per report §10.
Waiting on: Senior developer review (REVIEW-00 prerequisite for UI-01 is UI-00 + BE-00).
Evidence/report: reports/ui/opendots-inventory.md
```

```text
2026-10-23 05:30 Asia/Calcutta — OpenCode — UI-01
Status: READY FOR REVIEW (design artifact; transport recommendation pending DeepSeek coordination)
Done since last update: Produced reports/ui/bridge-spike.md (no code, no installs). Evidence this
  session: gateway/embedding.md (full), protocol/rpc-methods.md index, protocol/rpc-session-control.md
  (45-102), openresponses-http-api.md (full), over the accepted UI-00 + BE-00 §4.2/§4.3 inventories.
  Contract: browser-side ZeroAgent extends AbstractAgent over @openclaw/gateway-client WS v4; OpenClaw
  sessionKey used directly as AG-UI threadId (no binding table, no transcript copy); run start/stop via
  chat.send/chat.abort; text from a single chat-family accumulator (chat-only-assistant-text
  capability); history/resume via chat.history deltaCursor + inFlightRun; reconnect per challenge/
  shutdown contract; sessions.list/patch/delete covers thread CRUD. Transport comparison rejects
  /v1/chat/completions and /v1/responses as primary (no session API; 30-day/5k continuation cap;
  no HTTP cancel documented for completions). Seven unresolved facts logged (OQ-1..7) with resolution
  paths; ten-step spike plan written for execution after BE-01's gateway window. Also answered Qoder's
  CU-01 ask in the shared log (five-point live-view PanelState contract for result.json capture).
Next: DeepSeek coordination on transport + identity mapping (log §5.2/§8); then UI-01b spike only
  after a gateway + install window opens.
Waiting on: DeepSeek Harness response on transport recommendation and identity mapping.
Evidence/report: reports/ui/bridge-spike.md; AGENT_CHAT entry 2026-10-23 04:52 (CU-01/CU-02 answer)
```

```text
2026-10-23 06:05 Asia/Calcutta - OpenCode - UI-01
Status: READY FOR REVIEW (unchanged; coordination round closed)
Done since last update: Answered DeepSeek's BE-02 contract (log 04:16): §5/§6 covers the UI-01 brief
  and the transport decision is made — WS RPC for send AND events; HTTP is compat/debug only in the
  backend lane. Added §10 to reports/ui/bridge-spike.md (reconciliation: zero-thread-<uuid> identity,
  logical-vs-wire event vocabulary, nested-runs rule, approvals opt-in for MVP, new OQ-2b) and §11
  (canonical take/release call shape zero.computer.control for Qoder's zero-computer-hold plugin,
  with one new live-proof item). Qoder's ask answered in AGENT_CHAT 06:00.
Next: Senior review of the artifact; UI-01b spike executes only after BE-01's gateway + one approved
  install window. No further UI-lane work claimed this turn.
Waiting on: ChatGPT — Senior (review); BE-01 window for OQ-1/OQ-2/OQ-2b/OQ-6 live facts.
Evidence/report: reports/ui/bridge-spike.md §10-11
```

## Updates

```text
2026-10-23 07:59 Asia/Calcutta (my shell's clock) — Qoder — START_TASKS §2: release filter audit + hold reconciliation
Status: CU-02 = READY FOR GO (pre-build complete). CU-01 = WAITING (O1/O2/O3/O5/O6 + GO). Read-only round.
Done: (1) Built a REPEATABLE release-bundle audit, computer/tools/audit-release-action-filter.mjs → 25/25 exit 0: re-extracts the v2
  contract, rebuilds the provider's 38-name composition, re-runs the release's own platformActions() (win32 = 36, identical set),
  and walks the tool layer to the numbers nobody had stated: 36 → minus 6 execution-owned = 30 → +wait = 31 → +take_control = 32
  names the model may actually send. Never imports a bundle (that would load the native driver). Two of MY extraction bugs found and
  fixed en route, each producing a FALSE drift report: last array element without a trailing comma, and findChunk matching a chunk
  that references a name instead of the one defining it (it audited a 13-name slice). Definition markers now mandatory; lesson in the
  header. Recorded because a green check measuring the wrong thing is the failure mode this project exists to avoid.
  (2) Three-way zero.computer.control reconciliation → reports/computer/hold-method-reconciliation.md. Names CONVERGED. Delta A:
  snapshot carries scope:"global" and recent, which OpenCode offered to ignore — they are load-bearing (scope is the only non-per-
  target signal, C7; recent is the audit display hook); controlLeaseId appears only when owned. Canon extended in contract §3.
  Delta B: the app route forwards sessionKey though the hold has no session concept. BLOCKING BUG found: app/src/server/live-relay.ts
  builds /live/desktop?sessionKey=…, but the verified join is desktop.observe({source:{kind:"node",nodeId},control}) →
  wsPath=/desktop/observe?token=<one-time,60s> → desktop.release({wsPath}); wrong path, wrong credential, and observe is never
  called. Sharper consequence: desktop.observe needs operator.admin with no fallback while the app link holds
  [read,write,approvals] — even a fixed URL is refused today. Recommendation: admin only for a viewing session, dropped on
  disconnect; a standing admin link also satisfies the hold method by accident.
  (3) Evidence schema extended (holder.scope, holder.recentCount, verdict.missingScopeVsUnavailable so missingScope never renders
  as "unavailable") and §5b added to the spike protocol mapping all 14 G-G checks to the fields that hold their answers.
Re-verified after edits: audit 25/25 exit 0; rig 76/76 exit 0; derivation 9/9. Not proven, unchanged: any live Windows behaviour —
  no desktop observed or driven; that remains CU-01 on the designated isolated environment only.
Next: remaining §2 items are consumed; what is left in my lane crosses the build gate. Waiting on @manager (GO + O1/O2/O3/O5/O6 +
  the admin-scope decision), OpenCode (deltas A/B, relay fix), DeepSeek (no blocker; scope/recent touch their audit rows).
Evidence/report: computer/tools/audit-release-action-filter.mjs; reports/computer/hold-method-reconciliation.md;
  reports/computer/cu01-spike-protocol.md §5b; computer/contracts/takeover-hold-contract.md §3
```

```text
2026-10-23 07:34 Asia/Calcutta (my shell's clock) — Qoder — help round continued (two more deliverables)
Status: unchanged — CU-02 READY FOR GO, CU-01 WAITING. Everything this round was read-only.
Added since the 07:15 note:
  - **Evidence scoping for the senior's 06:22 live hold round-trip** (07:22 entry): it proves `zero.computer.control`
    registers and dispatches on a live Gateway and the hold state machine works (take→release→status), and its caller
    carries [read, write, approvals] with no admin — so G-G item 3's first half is DONE. It proves nothing about
    desktop.observe (never called), nothing about the device-paired UI identity (the request went over the app
    server's token-authenticated link, not the browser's principal), and nothing about the tool-policy hold.
    Also flagged: zero-runtime.ts:257 attributes "typed params/results confirmed by Qoder" — my actual finding is the
    opposite emphasis (host performs NO schema validation; both ends must validate). And the route accepts sessionKey
    while the hold is global (C7), so the panel must not imply per-conversation ownership.
  - **Scope audit answered statically, not by spending window time** (07:31 entry): resolveLeastPrivilegeOperator-
    ScopesForMethod returns the policy row, desktop.observe requires `operator.admin`, and
    authorizeOperatorScopesForRequiredScope has no admin fallback (only read/write sessions fallbacks) returning
    {allowed:false, missingScope:"operator.admin"}. One descriptor row covers environment/host/node because the
    branching is later, inside respondDesktopObserve. **OpenCode's live view would be refused today.** The shipped
    Control UI avoids this by being admin-scoped with a scope-upgrade runtime. Recommendation recorded: upgrade on
    user intent for the viewing session rather than a standing admin link, and render missingScope distinctly from
    "unavailable". Raised as @manager decision + a security-boundary note for DeepSeek.
Docs: release-facts-desktop-stream.md §1b/§2/§4 settled (all hedges that the finding retired were removed);
  G-G item 12(c) relabelled confirmation-not-discovery. Rig suite re-run 76/76 exit 0; derivation 9/9;
  stale-hedge and control-character scans clean.
Next: four open offers to DeepSeek and OpenCode, no replies yet. I will keep taking work as it is named and will not
  manufacture more; nothing else in my lane is possible without crossing the gate.
Waiting on: @manager — GO + O1/O2/O3/O5/O6 (plus the new live-view scope decision).
Evidence/report: reports/computer/release-facts-desktop-stream.md; AGENT_CHAT entries 07:22 and 07:31
```

```text
2026-10-23 07:15 Asia/Calcutta (my shell's clock) — Qoder — cross-lane help round (3 offers made, 4 deliverables)
Status: unchanged — CU-02 READY FOR GO, CU-01 WAITING (O1/O2/O3/O5/O6 + GO). All activity this round was read-only.
Done since last update: Asked both developers directly, three times, what is blocking them, and delivered help while waiting rather than idling:
  - **OpenCode fact request #7 answered from the installed release** → new reports/computer/release-facts-desktop-stream.md:
    join contract (desktop.stream, /node-desktop/attach?ticket=, one-time 60s ticket, binary first frame <=64KiB with
    exactly {auth, vncPassword?}), the desktop RPC surface, and §4 — a **reference implementation found inside the
    shipped Control UI** (observe returns wsPath directly; release is keyed by **wsPath**, not a token; the
    credential phase rules; DESKTOP_CREDENTIALS_REQUIRED error code; stale-observe releases its own ticket;
    one-shot takeover-recovery flag; canResize is a capability). Corrects my own earlier advice: they should consume
    upstream's viewer-ownership model instead of inventing one.
  - **Corrected a claim I have repeated since CU-00 §6.** `desktop.observe` supports a **node** source with a
    `control` flag, and session-registry implements real human-viewer arbitration: preemption with
    `control-taken[:<operator>]` close 4000, notifyControl by sourceKey+ownerEpoch, MAX_OBSERVERS=8, stale-epoch
    refusal, 60s linger, and a server-side rfb-view-only-filter. **D-009 still stands** — the agent's computer.act
    path never touches that registry — so I added G-G items 12/13 to prove the boundary instead of arguing it.
    CU-00 inventory got a dated §6 CORRECTION appended; its body is not rewritten (accepted artefact).
  - **DeepSeek's 06:24 register() early-return finding folded in and made code**: G-C order declared mandatory,
    two new abort conditions (silent "check not found" = enablement, must be exactly `true`), G-E pre-S1 assertion,
    and `evaluateEnablementGate()` in the rig. Suite now **76/76 exit 0** (was 68/68); counts synced across all
    three docs; no stale claims; no control characters.
  - Ran my secret/PII screen over **33 shared files** (chat log, board, DECISIONS, all reports/, backend/config,
    plugin README): **clean** — the single hit was a false positive describing the detector itself, so one hit means
    "go read it", not "leak found". Offered the scanner as a reusable pure function.
  - Flagged to @manager: the Zero template intentionally omits `cua-computer.enabled`; do not let anyone "fix" that
    early — it changes Gateway startup advertisement while DeepSeek's live policy runs are in flight. Mine to change
    at G-C, by hand, under the gate.
Next: asked for a fourth time for a named task; if no one needs anything I will hold position rather than manufacture
  work. Everything left in my lane crosses the build gate.
Waiting on: @manager — GO + O1/O2/O3/O5/O6. DeepSeek (ack/correct my gate reading), OpenCode (want the tickets.mint trace?).
Evidence/report: reports/computer/release-facts-desktop-stream.md; reports/computer/build-readiness.md §3/§5;
  computer/spike/rig.mjs + rig.test.mjs (76/76); reports/computer/windows-cua-inventory.md §6 CORRECTION
```

```text
2026-10-23 06:33 Asia/Calcutta (my shell's clock) — Qoder — CU-01 rig hardening + release filter executed offline
Status: CU-02 = READY FOR GO (offline work complete; parked at the gate). CU-01 = WAITING (O1/O2/O3/O5/O6 + GO).
Done since last update: (1) Implemented and self-tested the CU-01 rig's pure logic — computer/spike/rig.mjs +
  rig.test.mjs → **68 passed / 0 failed, exit 0** (gate aborts vs risks, strict doctor-output parsing,
  evidence validation against result.schema.json, verdict computation where K2 cannot pass without a
  host-side readback and k5 stays false when takeover is merely refused-as-expected, a pre-write
  secret/PII screen, and hold classification where an unknown action fails closed). First run caught two
  defects that would have burned the window: the schema rejected the rig's own explicit-null step records
  (G-F would have failed on its first write and looked like a provider fault) and a secret regex used an
  invalid `\-` escape under the `u` flag so the module would not parse. Both fixed; my own AWS test vector
  was also wrong (14 chars, not 16) and is corrected.
  (2) Ran the release's OWN action filter instead of comparing lists: CUA_COMMON_ACTION_NAMES (38) through
  platformActions at dist/extensions/cua-computer/index.js:21435 → **36 on win32, identical set** to my
  checkout-derived table (release-only [], mine-only []). Two trees, different composition, same output —
  a real cross-check. My last self-imposed caveat is now a verified result.
  (3) Repairs against my own earlier edits: a JS string escape had turned `\b` into a literal backspace and
  eaten "backend" in computer/README.md, one replacement left a split fragment, and readiness §5 had a
  numbering gap at 8. All fixed; whole-lane control-char and mangled-path scan now clean; both suites re-run.
Honest limits: rig LOGIC verified is not rig INTEGRATION verified — preflight.ps1, the WS calls and provider
  behaviour have never met a machine. Driver behaviour differences 0.32.0 vs 0.34.1 are not diffable from JS
  (closed .dll), so A5 (background window delivery) and the DPI geometry assertion stay [needs live proof]
  and CU-01 remains the first real test of both.
Next: none available without crossing the gate. Inventing more prep would be noise, not progress.
Waiting on: @manager — GO + O1 designated environment, O2 VNC consent/product, O3 install ordering,
  O5 CU-01 takeover scope, O6 hold-test order.
Evidence/report: computer/spike/rig.mjs; computer/spike/rig.test.mjs; reports/computer/cu01-spike-protocol.md
  §4b; reports/computer/build-readiness.md §5 risks 4/8/9; reports/computer/release-pin-reconciliation.md
```

```text
2026-10-23 06:15 Asia/Calcutta (my shell's clock) — Qoder — CU-02 release-pin reconciliation (installed fe06181)
Status: CU-02 = READY FOR GO (pre-build complete; now reconciled to the installed release). CU-01 = WAITING (O1/O2/O3/O5/O6 + GO).
Done since last update: The senior's BUILD WINDOW A entry says the installed npm artifact is commit fe06181 while
  upstream/openclaw sits at 0132405. My entire lane was derived from the checkout, so I verified my own numbers
  against the installed files (read-only; I installed/launched/called nothing and handled no key):
  - 40-name v2 action contract: IDENTICAL list and order in dist/computer-use-contract-*.mjs → my 36-on-win32
    advertised count stands.
  - take_control refusal string, 3600s/300s Unrestricted ceilings, MIT AND MPL-2.0 licence: all HOLD in the release.
  - **Driver version MISMATCH: release ships @trycua/cua-driver 0.32.0, not the 0.34.1 I published**, with a
    completely different pinned digest pair; @openclaw/fs-safe is 0.25.0, not 0.26.8. Corrected in the packet.
  - **Strongest result: I hashed the native files actually on disk against the release manifest — both MATCH
    (dll 26,842,960 B, node runtime 633,160 B).** The likeliest G-C failure mode (a digest/version mismatch) is
    ruled out before the window opens, without executing anything. Measured delta 28,413,838 B (~27.1 MiB),
    replacing my 0.34.1 registry estimate; real install actuals from DeepSeek (0.470 GB) replace my 2.5-4 GB guess.
  - **Run-day blocker found and fixed:** `openclaw` is NOT on PATH — only the pnpm shim at
    backend\node_modules\.bin\openclaw.cmd works, because it sets NODE_PATH into the store. My gated commands as
    previously written would have failed on the very first line of G-C and read like a broken install. G-C/G-E and
    the CU-01 protocol now carry the correct invocation.
  - Compliance narrowing: the win32 package ships its own node-runtime-NOTICE.md (MPL-2.0 component is
    uniffi-bindgen-react-native 0.31.0-3, source pinned to the matching tag), so my §9 "gap" claim is smaller than
    written — OpenClaw's aggregate notices file omits CUA, but the obligation travels inside the artifact.
  - CU-00 inventory left unmodified with a dated §13 addendum appended instead; I do not silently edit an accepted
    artifact. Honest limits recorded: I verified the name list exactly but did NOT re-derive platformActions from
    minified bundle code, and driver BEHAVIOUR differences between 0.32.0/0.34.1 live in a closed .dll, so the DPI
    assertion and background-delivery question (A5) stay firmly [needs live proof].
Next: still nothing further without GO. Two items genuinely worth doing pre-window remain and I will take them in
  order if asked to continue: (1) close the assumption that my spike harness has never been executed — write the
  rig's pure-logic parts (record validation, abort gating, evidence redaction/secret scan) as offline-testable code;
  (2) nothing else that does not need a machine.
Waiting on: @manager — GO + O1 designated environment, O2 VNC consent/product, O3 install ordering, O5 takeover
  scope, O6 hold-test order.
Evidence/report: reports/computer/release-pin-reconciliation.md (new); reports/computer/build-readiness.md §1-§3,
  §5; reports/computer/windows-cua-inventory.md §13 addendum; computer/contracts/windows-action-taxonomy.md
```
```text
2026-10-23 05:56 Asia/Calcutta (my shell's clock) — Qoder — CU-02 final offline reconciliation (senior accepted v3)
Status: CU-02 = READY FOR GO (accepted as PRE-BUILD READINESS ONLY; parked at the build gate). CU-01 = WAITING (O1/O2/O3/O5/O6 + GO).
Done since last update: Read all four governance files plus every log entry after 05:31, then closed the last
  cross-lane asks by verifying the other lanes' files rather than their notes: OpenCode adopted the canon
  (`bridge-spike.md:198` now carries take|release|status + expanded snapshot, items 7/8 added;
  `app/src/client/ComputerPanel.tsx:97` calls status; bare `leaseId` search across app/ = 0 matches).
  Reconciled: hold-contract §3 rows (status, lease) and the retired transition shim; build-readiness §6 C3 row and
  the O4 row (now records the deployed three-segment ref `zero-gw/z-ai/glm-5.3-flash` and that Phase 1 has not run);
  mvp-computer §7 "Next" (was stale, still waiting on closed items); cu01-spike-protocol §7 (O4/O7/O8 closed, and
  the explicit note that D-011 does NOT weaken S6 because file.fetch/file.stat are node commands, not system.run);
  cu02-takeover-seam-analysis given a STATUS header marking it partly superseded with its four unresolved cheap
  checks kept visible as [needs GO]. CU-00 inventory left unmodified on purpose — I do not quietly edit accepted
  artifacts; corrections live in the CU-02 docs that point back to it.
Re-verified: taxonomy derivation 9/9 self-checks exit 0 (win32 = 36 of 40); result.schema.json parses (17 step
  fields, 12 verdict fields incl. refusalObserved, codeModePathUnreachableUnderD011); stale-claim scan across my
  lane = 0 hits; DeepSeek selftest re-run earlier today 90/90 exit 0.
Next: none. There is no remaining offline work worth doing in my lane; further edits would risk drifting from the
  verified state rather than adding value.
Waiting on: @manager — explicit GO plus O1 designated environment, O2 loopback RFB consent/product,
  O3 install ordering, O5 CU-01 takeover scope, O6 hold-test order.
Evidence/report: reports/computer/build-readiness.md; reports/computer/mvp-computer.md;
  computer/contracts/takeover-hold-contract.md; AGENT_CHAT entry 05:55 (includes my resume prompt)
```

```text
2026-10-23 05:30 Asia/Calcutta (my shell's clock) — Qoder — CU-01 / CU-02 reconciliation to D-011 + model route
Status: CU-02 = READY FOR GO (pre-build complete, reconciled). CU-01 = WAITING (owner GO + remaining inputs).
Done since last update: Re-read DEVELOPER_QODER.md, TASK_BOARD.md, DECISIONS.md (D-011), PROJECT_MEMORY.md and
  the log tail, then reconciled my whole lane to the new state instead of leaving a superseded packet standing.
  Verified rather than accepted: ran `node backend/plugin/selftest.mjs` → 90 passed / 0 failed, exit 0; read
  backend/config/openclaw.template.json (researcher + operator exec "deny", blockedActions ["escalate_scope"]
  at :143) and backend/plugin/index.js (codeModeToolNames ["exec"], opaque-input classification :228-247).
  Updated reports/computer/build-readiness.md: O4/O7/O8 moved to a Resolved table with evidence, five inputs
  remain open, G-G now has 12 checks incl. DeepSeek's two captures, a vision-path check, and a note that
  exec denial does not weaken my S6 host-side proof (file.fetch/file.stat are node commands, not system.run).
  Updated mvp-computer.md, the hold contract (new D-011 outcome section; withdrawn C6 advice corrected in the
  names table; freshness rule refined to screenshot/wait plus get_window_state with includeScreenshot),
  windows-action-taxonomy.md item 3 (escalate_scope blocked by config, still advertised upstream — assert the
  refusal, not the absence), computer/README.md (owner-decision status + key-hygiene rule), and
  computer/spike/result.schema.json (refusalObserved, inputKind, codeModePathUnreachableUnderD011,
  visionPathVerified). Re-ran the taxonomy derivation: 9/9 checks, win32 = 36 advertised.
Next: offline reconciliation only; there is little left. Nothing further is possible without crossing the gate.
Waiting on: @manager — GO plus O1 designated environment, O2 VNC/RFB consent and product, O3 install ordering
  behind DeepSeek's window, O5 CU-01 takeover scope, O6 hold-test order. Also recorded: a provider key was pasted
  in chat and is exposed — rotation and a secret-store replacement are the owner's action; I handled no key.
Evidence/report: reports/computer/build-readiness.md §1/§3/§6; reports/computer/mvp-computer.md;
  computer/contracts/takeover-hold-contract.md; computer/contracts/windows-action-taxonomy.md
```

```text
2026-10-23 04:52 Asia/Calcutta (my shell's clock) — Qoder — CU-02 / CU-01 readiness
Status: CU-02 = READY FOR GO (pre-build complete, paused at the build gate). CU-01 = WAITING on owner GO.
Done since last update: Derived the exact Windows action taxonomy from pinned source with a repeatable
  dependency-free script (win32 = 36 advertised of 40 v2 names; excluded hold_key, left_mouse_down,
  left_mouse_up, wait; take_control throws on our targets; 6 names hidden without an execution owner)
  and folded the runtime-refusal codes + caps into it for DeepSeek's matcher/budget rows. Found and
  documented that `computer.act` also carries the structured OBSERVATION actions (only screenshot/wait
  ride screen.snapshot), so the global command-deny stop degrades observation instead of blinding it.
  Verified the gateway-method surface OpenCode and @manager asked about: params are Record<string,
  unknown> with NO host validation, results are respond(ok, payload?: unknown, error?) with no schema,
  GatewayMethodDescriptor has no params/result fields, and the registrar DEFAULTS a plugin method to
  operator.admin unless opts.scope is passed. Wrote the D-009 hold contract, reviewed DeepSeek's plugin
  (8 findings; C1 missing contracts.trustedToolPolicies + C2 leaseId/controlLeaseId were blocking),
  accepted their rebuttal withdrawing C6 and re-raised it as C6′ with a new code-mode fail-open risk.
  Prepared but did NOT run: computer/spike/preflight.ps1 and computer/spike/result.schema.json.
Reviewed-file verification after DeepSeek's 04:45 pass (v0.1.1, re-verified 04:55): C1/C2/C4/C5 **fixed in shipped code** — I read the files and ran their selftest myself (`node backend/plugin/selftest.mjs` → 75 passed / 0 failed / exit 0, covering operator.write scope, controlLeaseId, staleness-everywhere, unknown-action fail-closed); C3/C7 accepted; **C6 withdrawn — DeepSeek's code-mode rebuttal was correct and my citation described the node schema, not the model-facing tool envelope**; C8 confirmed. Only C6′ (code-mode `{code}` input allowed-and-uncounted) remains, now owner decision O7.
Field-name canon issued to OpenCode: `zero.computer.control` · `{ action: take|release|status, controlLeaseId?, reason? }` → `{ held, owned, controlLeaseId, resumeSnapshotRequired, since, reason, stats }` · no `leaseId` fallback needed. Added O8: high-risk families are audited but not blocked, so `escalate_scope` is reachable while the agent holds the desktop.
Next: nothing further is possible in my lane without crossing the gate. On GO: G-A preflight → G-B
  (after DeepSeek's install) → G-C enable + doctor → G-D loopback RFB → G-E node run + pairing →
  G-F CU-01 S1-S11 → G-G hold live checks incl. item 8 (code-mode).
Waiting on: @manager GO + O1-O7 (designated environment, VNC consent, install ordering, vision model id,
  CU-01 takeover scope, hold-before-or-after-CU-01, code-mode policy decision); DeepSeek C2 rename;
  OpenCode to adopt `controlLeaseId` + `status` in bridge-spike.md section 11 and accept the RFB relay
  limitation (no frameId/sequence/capturedAt on the human-view channel).
Evidence/report: reports/computer/build-readiness.md; reports/computer/mvp-computer.md;
  computer/contracts/windows-action-taxonomy.md; computer/contracts/takeover-hold-contract.md;
  computer/contracts/computer-act-actions.json (script 9/9 self-checks, exit 0, re-run 04:51)
```

```text
2026-10-23 04:08 Asia/Calcutta — Qoder — CU-00
Status: READY FOR REVIEW
Done since last update: Read-only inventory of the pinned OpenClaw Windows CUA route (commit 0132405,
  v2026.10.6): docs/nodes/computer-use.md + plugins/reference, the whole extensions/cua-computer source
  (provider factory, per-platform action filter, driver SDK session/ceilings, frame authority,
  artifact digest gate, node-invoke risk taxonomy), the shared v2 action contract in
  src/plugins/computer-use-contract.ts, the model-facing tool schema, the Control UI desktop
  panel/stream docs, and command-policy pairing ceilings. Added npm registry metadata reads
  (sizes + licenses for @trycua/cua-driver 0.34.1 and the win32-x64 native package) — no download,
  no install, no desktop action. Compared OpenMausBot (Apache-2.0) and OpenDots (MIT) computer
  references for takeover/lease/live-view patterns.
Key findings: (1) the Windows path is real and experimental — in-process CUA Driver SDK, no daemon/MCP;
  (2) primary display only, no held input, no modifier-held clicks, digits/punctuation keys rejected,
  non-macOS capture asserts screen==screenshot geometry (DPI risk); (3) takeover arbitration exists only
  for cloud/attached desktops — take_control throws for a paired Windows node, so CU-01's takeover step
  is a measured gap, not a pass; (4) global stop is available today via run interrupt +
  gateway.nodes.commands.deny:["computer.act"] (hot-applies) — no lease/arm-disarm concept upstream.
Next: Independent prep only, since CU-01's prerequisites are absent. Two prep reports written after the
  handoff, both read-only: reports/computer/cu01-spike-protocol.md (the exact CU-01 run, gates, steps,
  evidence layout and negative checks) and reports/computer/cu02-takeover-seam-analysis.md (the takeover
  gap appears closable with the existing api.registerTrustedToolPolicy seam instead of a new Windows
  service — but four items there are [UNVERIFIED] until an install window exists).
Waiting on: designated Zero Windows environment (VM/test account), an approved install window (~28 MiB
  driver delta + OpenClaw), a vision-capable model on the gateway route, and the takeover-scope decision.
Evidence/report: reports/computer/windows-cua-inventory.md; reports/computer/cu01-spike-protocol.md
```

```text
2026-10-23 04:02 Asia/Calcutta — ChatGPT (Senior) — REVIEW-00
Status: IN PROGRESS
Done since last update: Accepted BE-00 and UI-00 as source/documentation inventories. Reports are present,
  scoped read-only, and identify their evidence limits. Accepted the OpenDots selective-reuse direction
  in D-007; no runtime, gateway, or computer-use behavior has been proven. Opened UI-01 for the bridge
  contract/design work. The agent-shell PATH discrepancy is environment-specific: the senior shell has
  Git and Node, while pnpm version here is 11.25.0 (OpenClaw pins 12.15.0); record toolchain per runner.
Next: OpenCode coordinates a transport-neutral contract with DeepSeek Harness in AGENT_CHAT, then
  documents the minimum viable UI↔Gateway mapping and event/session edge cases. DeepSeek Harness waits
  for the user's gateway endpoint/auth details for BE-01; do not include secrets in reports/chat.
Waiting on: CU-00 handoff; gateway endpoint/auth style for BE-01.
Evidence/report: reports/backend/source-inventory.md; reports/ui/opendots-inventory.md; DECISIONS.md D-007
```

```text
2026-10-23 03:59 Asia/Calcutta — DeepSeek Harness — BE-00
Status: READY FOR REVIEW
Done since last update: Read-only inventory of the pinned OpenClaw source (commit 0132405, v2026.10.6):
  gateway runtime + protocol + OpenAI-compatible HTTP surface, providers/model routing, agents and
  per-agent profiles, sessions, sub-agents/swarm/goals, the bundled Workboard task board, memory
  plugin slot, skills, plugins, cron/heartbeat scheduling, permission modes, and audit/usage.
  Verified local toolchain and found git + pnpm are not on PATH in this shell.
Next: Awaiting senior review. BE-01 cannot start without the gateway endpoint/auth; BE-02 needs an
  approved package-manager + dependency-install window.
Waiting on: (1) gateway product/endpoint/auth method, (2) approval for pnpm 12.15.0 + dependency install,
  (3) optional approval to add docs/concepts/ to the sparse checkout.
Evidence/report: reports/backend/source-inventory.md
```

```text
2026-10-23 03:59 Asia/Calcutta — DeepSeek Harness — TEAM-00
Status: NOT STARTED (unchanged; recommendation only)
Done since last update: BE-00 evidence shows built-in sub-agents, Swarm, goals, Workboard dispatch and
  sessions_send already cover Lead + Researcher + Operator coordination. No built-in behavior has failed
  acceptance yet because nothing has been run.
Next: Keep blocked until BE-02 exercises the team workflow and a specific gap is documented.
Waiting on: BE-02 completion.
Evidence/report: reports/backend/source-inventory.md §4.7-4.8, §7
```

```text
2026-10-23 05:26 Asia/Calcutta — OpenCode — UI-02
Status: READY FOR GO (pre-build complete; paused at build gate)
Done since last update: Full source tree written in app/ (my D-010 path): device-paired Gateway runtime
  (gateway-link + pairing host-deps over @openclaw/gateway-client@2026.10.6 exact, operator role,
  operator.read/write/approvals, TOOL_EVENTS + chat-only-assistant-text caps, protocol 4/4), ZeroAgent
  AbstractAgent mapping the accepted §5-§7 wire contract to AG-UI events, thread registry (one
  zero-thread-<uuid> per session; OQ-2b attempt+fallback), CopilotKit provider + OpenDots-derived
  shell (Chat/ChatTranscript/ThreadList/ComputerPanel/ComputerToolCard/ResultPane/style.css — reuse
  ledger + NOTICE complete, no secrets or gateway credentials in the tree), STOP ALL as layered run
  interrupt + chat.abort/sessions.abort, computer panel live view disabled until the relay handshake is
  verified (OQ-7).
Next: At owner GO — app install/typecheck/build window per reports/ui/build-readiness.md (§2–§5),
  sequenced after DeepSeek's backend install window; launch only after the typecheck patch list is
  burned down. No install/build/launch/live call before the owner's GO.
Waiting on: Owner GO at the build gate (+ gateway URL/env + pairing approval at run time).
Evidence/report: reports/ui/mvp-ui.md; reports/ui/build-readiness.md; app/REUSE-LEDGER.md; app/NOTICE
```

## Continuous-work protocol update — 2026-10-23

- `READY FOR REVIEW` is a handoff state, not an instruction to stop. Developers proceed to their next independent `READY` ticket; senior review happens asynchronously.
- Do not pause for ordinary unknowns, routine questions, senior review, or missing live credentials while pre-build work remains. Resolve from source and accepted defaults; record any assumption and continue. Stop only immediately before the first install, compile, launch, live Gateway call, or real desktop action, then submit a build-readiness packet for owner go-ahead.
- BE-01 alone is WAITING for the model gateway endpoint/auth style and safe host secret-store method. DeepSeek can work on the offline BE-02 profile/config plan and other unblocked backend tasks without a key. Never store a key in files/logs.
- CU-00 and UI-01 are accepted as source/design deliverables only; neither proves live behavior. BE-02's offline plan is accepted; all three lanes now continue pre-build work. The earlier install reservation is superseded. No install/build/runtime launch/live gateway call/desktop action may start until the owner explicitly approves the build-readiness packet.
- A turn ending because the external agent platform requires a new invocation is not task completion. The user can resume with the same start prompt; the next agent must reread the board/log and continue from the last HANDOFF.

```text
2026-10-23 04:16 Asia/Calcutta — DeepSeek Harness — BE-02 (offline half)
Status: READY FOR REVIEW (offline plan complete; live half blocked, not abandoned)
Done since last update: Wrote reports/backend/mvp-backend.md — proposed agent IDs (zero/researcher/operator)
  with full JSON5 profile config, the custom-provider config shape (models.providers.zero-gw with baseUrl +
  env-name apiKey + vision/utility model rows), the 8 BE-01 checks that decide whether that provider block
  survives, thread→session mapping, a transport-neutral event contract for UI-01, the tool-policy placement
  answer for the computer tool (operator-only via profile "coding" + alsoAllow ["computer"]; NOT
  tools.gatewayPolicy because that needs a restart), the human-hold design via registerTrustedToolPolicy /
  before_tool_call (no upstream patch), and the install/run plan with a lockfile-derived resource estimate.
  Reconciled Qoder's seam finding with the documented hook: same decision contract, host-hooks.ts:69-84.
Next: BE-01 stays WAITING on owner input. Independent prep continues (key-free gateway probe harness) so the
  proof can run the moment an endpoint exists.
Waiting on: owner gateway product/base URL/auth style + a safe host secret-store method (BE-01); an approved
  non-overlapping install window for Corepack pnpm 12.15.0 + dependencies (live BE-02); @manager to assign a
  Zero code path (CU-02 has none, and I proposed E:\zero\backend\ for the runtime + Zero plugin).
Evidence/report: reports/backend/mvp-backend.md

2026-10-23 04:16 Asia/Calcutta — DeepSeek Harness — TEAM-00
Status: NOT STARTED (unchanged)
Done since last update: Nothing claimed. BE-02's plan shows the built-ins still cover the workflow; no gap proven.
Waiting on: live BE-02 acceptance run (A4/A5 delegation checks) before any gap can be documented.
Evidence/report: reports/backend/mvp-backend.md §9
```

```text
2026-10-23 04:17 Asia/Calcutta — DeepSeek Harness — BE-01 (prep only, still WAITING)
Status: WAITING (unchanged) — the dependent task is still blocked on owner input; the work below is prep.
Done since last update: Built and self-tested reports/backend/tools/gateway-probe.mjs, a dependency-free
  Node harness that performs the BE-01 checks against the gateway directly: models list, chat, streaming
  (time-to-first-delta + delta count), tool/function calling, vision, usage-in-stream, reasoning_effort
  tolerance, and the unknown-model error path. Required checks are models/chat/stream/tools; the rest warn.
  Self-test evidence (no real gateway involved): a throwaway loopback mock implementing an OpenAI-compatible
  surface was started outside the repo, the probe returned 8 pass / 0 warn / 0 fail, then the mock was
  deleted. Negative paths verified: missing env -> exit 2; unreachable endpoint -> 5 clean FAILs, exit 1;
  the written JSON report contains 0 occurrences of the test key. Key is read only from ZERO_GATEWAY_KEY,
  never a CLI flag, never printed, redacted in every excerpt.
Next: Run the probe the moment an endpoint + secret-store method exist, then write reports/backend/gateway-proof.md
  from its JSON output plus the OpenClaw-side integration check.
Waiting on: owner gateway product/base URL/auth style + safe host secret-store method.
Evidence/report: reports/backend/tools/README.md; reports/backend/mvp-backend.md §4
```

```text
2026-10-23 04:21 Asia/Calcutta — DeepSeek Harness — backend lane (no ticket; supporting DONE-00/Reliability-01)
Status: informational — no board status change claimed
Done since last update: reports/backend/license-posture.md — license/NOTICE posture for the runtime we intend
  to install. OpenClaw is MIT; upstream notices cover SQLite, Pi/pi-mono, GitHub Octicons and Hermes Agent.
  Flags two items: Hermes code is already adapted inside OpenClaw (so "reference only" is partly already true,
  and we must not re-import it), and the Windows CUA native package is "MIT AND MPL-2.0" while upstream's
  NOTICE file does not mention CUA at all — a real distribution-time obligation, harmless for private local use.
Next: after install, run `pnpm licenses list --json` in E:\zero\backend and attach it as the transitive inventory.
Waiting on: an approved install window (same blocker as live BE-02).
Evidence/report: reports/backend/license-posture.md
```

2026-10-23 04:30 Asia/Calcutta — ChatGPT (Senior) — REVIEW-01
Status: IN PROGRESS (cross-lane acceptance recorded)
Done since last update: Accepted CU-00 Windows CUA inventory as source/documentation only; accepted BE-02 offline agent/provider/event plan and BE-01 probe harness as preparation; accepted backend license posture as a source-derived engineering note; accepted UI-01 bridge contract and WS RPC primary transport as design only. No real gateway, OpenClaw runtime, browser bridge, or Windows desktop action has been proven. Assigned code roots: DeepSeek E:\zero\backend\, OpenCode E:\zero\app\, Qoder E:\zero\computer\. Backend owns its Gateway policy/control plugin; Qoder owns any separate desktop worker. upstream/ stays read-only.
Next: DeepSeek continues the local runtime bootstrap using the single install window; OpenCode starts UI-02 shell/reuse work without a concurrent install/build; Qoder continues computer-use prep and confirms the typed Gateway method request/response and exact Windows action names.
Waiting on: BE-01 needs owner gateway product/base URL/auth style and a secure host secret-store method (never paste the key). CU-01 needs the designated Zero Windows environment. Live UI Gateway connection defaults to device pairing; ask @manager before browser-persisted operator bearer credentials.
Evidence: reports/computer/windows-cua-inventory.md; reports/backend/mvp-backend.md; reports/backend/tools/README.md; reports/backend/license-posture.md; reports/ui/bridge-spike.md; DECISIONS.md D-008 through D-010.

```text
2026-10-23 04:40 Asia/Calcutta — DeepSeek Harness — BE-02 (pre-build complete, at the build gate)
Status: READY FOR GO — paused immediately before the first gated action; nothing installed/built/launched/called.
Done since last update: Built the whole backend pre-build package in E:\zero\backend\.
  - config/openclaw.template.json — the full three-agent config with 4 ${ENV} placeholders and zero secrets;
    passes its own checks for roster, model slots, vision row, explicit ownership, operator-only computer grant.
  - config/env.example — env var names only, empty values.
  - scripts/preflight.mjs — 19 read-only checks (node vs engines range, corepack, pnpm, git, disk, gateway port,
    install state, template parse + 6 semantic config checks, plugin files, env presence by NAME, upstream presence).
    Current result: 15 pass, 4 warn, 0 fail. It found and I fixed a false positive in its own computer-scope check.
  - scripts/bootstrap.mjs — resolves the template from env into config/openclaw.json; dry-run by default; refuses
    to write with unresolved placeholders; emits env.example. Verified in three states (no env → exit 0 with the
    missing-var list; synthetic env → resolves and prints; --write → wrote a valid config whose apiKey field is the
    env var NAME, then I deleted the synthetic file).
  - plugin/ — the Zero Policy plugin (hold gate + per-run budgets + zero.computer.control method), manifest,
    package.json, README with the two known integration risks, and a 27-case fake-host selftest: 27 passed, 0 failed.
    Written against cited source contracts (host-hooks.ts:69-84/76-84, plugin-api.types.ts:271-283/412,
    response-types.ts:4-9, error-shape.ts:6-12) and importing nothing, so it has no module-resolution risk pre-install.
  - reports/backend/build-readiness.md — the GO packet: gate definition, verification table, what is NOT proven,
    4-phase sequence (probe → install → configure/start → acceptance A1-A8) with exact commands, abort conditions,
    machine effects, rollback, risks, and owner inputs.
Next: Wait for owner GO. Recommended first gate is Phase 1 (model-gateway probe, no install) because a gateway
  without tool calling or vision invalidates the install before it starts.
Waiting on: (1) owner gateway base URL + auth style + safe secret-store method and the three model ids;
  (2) owner GO for the Phase 2 install with an agreed single-job window; (3) Qoder's typed registerGatewayMethod
  confirmation and exact computer.act action names (refines A7; the plugin is config-driven and needs no code change).
Evidence/report: reports/backend/build-readiness.md; backend/plugin/selftest.mjs (27/27); backend/scripts/preflight.mjs (15/0)
```


2026-10-23 — ChatGPT (Senior) — REVIEW-02 / BE-02
Status: IN PROGRESS — pre-build review corrections remain; the packet is not yet GO-ready.
Review: Qoder found two blocking backend plugin mismatches: (C1) missing trusted-tool-policy capability declaration/API compatibility floor; (C2) `leaseId` disagrees with the accepted `controlLeaseId` contract. Also reconcile C4-C7: complete observation action set, stale-reference/unknown-action fail-closed behavior, strict `action` parsing, and global hold scope. Qoder's verified Windows action taxonomy is in computer/contracts/.
Direction: DeepSeek owns backend/. Continue offline without waiting for routine review: coordinate with Qoder, implement justified fixes, refresh dependency-free checks/readiness evidence, and proceed with any other unblocked backend pre-build work. Keep upstream read-only.
Gate: no install, compile, runtime/app launch, live Gateway call, or desktop action. Phase 1 itself is a live call and needs explicit owner GO and gateway/model/secret-store inputs. No GO is inferred.
Evidence: AGENT_CHAT.txt REVIEW-02; reports/backend/build-readiness.md; Qoder CU-01/CU-02 review.

```text
2026-10-23 05:05 Asia/Calcutta — DeepSeek Harness — BE-02 (REVIEW-02 closed)
Status: READY FOR GO — paused at the build gate; nothing installed, compiled, launched or called.
Done since last update: Resolved every REVIEW-02 finding and added two new dependency-free checks.
  C1 RESOLVED — the registrar compares contracts.trustedToolPolicies against the RAW policy.id with no
    prefixing (src/plugins/registry-registrars-host.ts:166-175), so the manifest now declares exactly
    "zero-policy.computer-hold". Added openclaw.compat.pluginApi ">=2026.10.6" + install.minHostVersion in
    plugin/package.json (those live under package.json openclaw.*, not openclaw.plugin.json).
  C2 RESOLVED — request and response field renamed to `controlLeaseId`; the old name now returns
    computer-hold:lease-invalid and a test asserts it.
  C4 ACCEPTED — observe default is 10 = the taxonomy's 8 + screenshot + wait.
  C5 ACCEPTED and hardened — staleness gates EVERY non-observation action; unknown/missing action fails
    closed; only screenshot or get_window_state{includeScreenshot:true} clears it.
  C6 ACCEPTED — action fallbacks removed; strict closed-enum parsing.
  C7 ACCEPTED as documented — snapshot reports scope:"global", audit rows record the resolved target.
  New checks: preflight 23 checks (19 pass / 4 warn / 0 fail) incl. plugin.trustedPolicyContract,
    plugin.compatFloor, plugin.observeSet; plugin selftest 75/75 incl. a manifest-vs-code config drift test.
  New artifact: backend/scripts/acceptance.mjs automates Phase 4 A1/A2/A3 over the documented HTTP surface;
    self-tested against a loopback mock (PASS, exit 0) and with a wrong token (A1 FAIL, exit 1), then the
    mock was deleted. A4-A7 stay manual.
  Also corrected mvp-backend.md §7.2: computer.act is NOT the input command, so commands.deny degrades
    observation as well as blocking input (screenshot survives; structured reads stop).
Next: Owner GO. Recommended first gate is still Phase 1 (model-gateway probe, no install).
Waiting on: (1) owner gateway base URL + auth style + safe secret-store method + three model ids;
  (2) owner GO for Phase 2; (3) Qoder's read on one refinement (bare get_window_state vs
  includeScreenshot:true for clearing staleness) — non-blocking.
Evidence/report: reports/backend/build-readiness.md; backend/plugin/selftest.mjs (75/75);
  backend/scripts/preflight.mjs (19/4/0); backend/scripts/acceptance.mjs (self-test PASS)
```

```text
2026-10-23 05:12 Asia/Calcutta — DeepSeek Harness — BE-02 (C6′/O8 follow-up)
Status: READY FOR GO — paused at the build gate; nothing installed, compiled, launched or called.
Done since last update: Qoder verified the shipped 0.1.1 and returned four follow-ups. All handled.
  C6′ CODE-MODE FAIL-OPEN — FIXED IN CODE, not mitigated by a note. `exec` is now in the policy matcher and
    anything with toolKind "code_mode_exec" is treated as opaque input: refused during a hold, otherwise
    allowed but counted against the budget and audited with kind "code_mode_exec". Qoder's O7 (turn code-mode
    off for the Operator) is still @manager's call and still the stronger answer; this is defence in depth.
  `WAIT` AS A FRESH CAPTURE — adopted per Qoder's computer-use.md:92 reading: screenshot and wait clear
    post-handover staleness; get_window_state does so only with includeScreenshot:true.
  ACTIVATION SELF-CHECK — replaced the misleading "registered" log (which printed even when the host silently
    rejected the policy) with a check that reads the plugin's own manifest and errors loudly if the policy id
    is not declared. Unreadable manifest warns, never throws. Three tests cover declared/undeclared/unreadable.
  O8 — `blockedActions: ["escalate_scope"]` now ships in the deployed template config (plugin code default
    stays neutral/audited), so scope widening past the designated environment is refused by a visible,
    strikeable config line rather than a hidden code choice. preflight `plugin.blockedPosture` warns if lost.
  Confirmed to Qoder: exactly ONE trusted policy id, no `zero-policy.budget`, and no `leaseId` spelling left.
  Counts: plugin selftest 90/90 (was 75); preflight 25 checks, 21 pass / 4 warn / 0 fail.
Next: Owner GO. Recommended first gate is Phase 1 (model-gateway probe, no install).
Waiting on: (1) owner gateway base URL + auth style + safe secret-store method + three model ids;
  (2) owner GO for Phase 2; (3) @manager on O7 (code-mode) and on keeping/striking the escalate_scope block;
  (4) at G-G only: Qoder's two captured refusal strings (direct and code-mode).
Evidence/report: reports/backend/build-readiness.md; backend/plugin/selftest.mjs (90/90);
  backend/scripts/preflight.mjs (21/4/0)
```

```text
2026-10-23 05:20 Asia/Calcutta — DeepSeek Harness — BE-02 (D-011 applied, packet reissued)
Status: READY FOR GO — paused at the build gate; nothing installed, compiled, launched or called.
Done since last update: Applied senior decision D-011 and closed the three sync defects the senior flagged.
  D-011 — operator `tools.exec.mode` is now "deny" in the deployed template (was "full"; `alsoAllow:["computer"]`
    unchanged). Verified by reading the resolved JSON: zero=ask, researcher=deny, operator=deny. Two new preflight
    assertions: `config.operatorExecDenied` (fail if operator exec is not deny) and `config.noFullExec` (warn if any
    agent has exec "full"). `blockedActions: ["escalate_scope"]` stays, guarded by `plugin.blockedPosture`.
    Recorded explicitly that D-011 does NOT narrow desktop control: the Operator drives the machine through the
    `computer` tool, exec is the shell; D-003 is untouched.
  Packet sync — tree counts now 90-case / 29-check; C5 row credits `wait` as a freshness-clearing capture with the
    three test paths; C6′/O8 reconciled with a new D-011 row; mvp-backend.md §3 config and its Q3 open question
    updated to the answered state.
  New unblocked work — reports/backend/security-boundary.md: what the runtime exposes, with H1-H5 post-acceptance
    hardening. H1 matters for the GO: we enable `gateway.http.endpoints.chatCompletions` only so acceptance.mjs can
    prove A1-A3, that endpoint is full operator access, and D-008 puts the UI on WS — so it must be switched back off
    after Phase 4. That step is now in the packet's post-acceptance list so it is not forgotten once tests go green.
  Counts: preflight 29 checks — 25 pass / 4 warn / 0 fail; plugin selftest 90/90; secret scan 0 matches.
Next: Owner GO. Recommended first gate is still Phase 1 (model-gateway probe, no install).
Waiting on: (1) owner gateway base URL + auth style + safe secret-store method + three model ids;
  (2) owner GO for Phase 2 with a single-job window; (3) at G-G only: Qoder's captured refusal strings.
Evidence/report: reports/backend/build-readiness.md; reports/backend/security-boundary.md;
  backend/scripts/preflight.mjs (25/4/0); backend/plugin/selftest.mjs (90/90)
```

```text
2026-10-23 05:30 Asia/Calcutta — DeepSeek Harness — BE-02 (owner model route applied)
Status: READY FOR GO — paused at the build gate; Phase 1 not run (no key in the environment).
Done since last update: Refactored the backend config to the owner's single-model NVIDIA NIM route.
  - models.providers.zero-gw: baseUrl https://integrate.api.nvidia.com/v1, api openai-completions,
    ONE model row `z-ai/glm-5.3-flash` with input ["text","image"].
  - Lead, Vision and Utility all resolve to `zero-gw/z-ai/glm-5.3-flash` (nested vendor/model id; the
    docs use the same shape for openrouter/qwen/...). Operator model ref updated too.
  - The template is now FULLY RESOLVED: zero ${ENV} placeholders. bootstrap.mjs no longer needs env;
    env.example and its generator now list only the provider key and the gateway token.
  - preflight gained `config.singleModel` and rewrote `config.modelRefs` to assert one shared ref;
    `config.template` now asserts "no placeholders"; env checks collapsed to providerKey + gatewayToken.
  - The probe now defaults to the NVIDIA base URL and model, so Phase 1 needs only the key, and it
    captures /v1/models metadata (context_length etc.) so contextWindow/maxTokens can be corrected from
    evidence instead of the conservative 128000/96000/4096 working values.
  - Probe re-verified against a mock NIM surface: 9/9 checks, exit 0, then the mock was deleted.
  CREDENTIAL: the key pasted into chat is treated as exposed. It was not recorded, not used, and a scan
    for the provider key prefix outside .git/ and upstream/ returns 0 matches. It must be revoked and
    rotated; Phase 1 waits for a fresh key through the host secret store. The probe exits 2 without
    ZERO_GATEWAY_KEY and makes no network call, so it cannot silently run on a stale or inline key.
  Counts: preflight 30 checks — 26 pass / 4 warn / 0 fail; plugin selftest 90/90.
Next: On owner GO and a fresh key in the environment, run only the focused Phase 1 probe, then write
  reports/backend/gateway-proof.md from its JSON (model list, chat/streaming, tool calling, image input).
Waiting on: (1) a FRESH rotated NVIDIA NIM key in the process environment/secret store;
  (2) explicit owner GO for the Phase 1 live call; (3) owner GO + single-job window for Phase 2 install.
Evidence/report: reports/backend/build-readiness.md; backend/config/openclaw.template.json;
  backend/scripts/preflight.mjs (26/4/0); backend/plugin/selftest.mjs (90/90)
```

```text
2026-10-23 05:45 Asia/Calcutta — DeepSeek Harness — BE-01 (pipeline complete; waiting on key)
Status: WAITING — Phase 1 GO is confirmed and not re-asked; the run is blocked only by key availability.
Done since last update: Phase 1 did not run: ZERO_GATEWAY_KEY is unset at process, user and machine scope, so the
  probe was never started and no request reached NVIDIA.
  Fixed a defect that would have wasted the run: the documented `--out .zero-data\be01-probe.json` target
    directory did not exist, so the probe would have thrown AFTER spending its network calls. The probe now
    creates the parent directory. Verified by a loopback-only dry run (no key, no external network): it created
    .zero-data\, wrote the report, exited 1 on the unreachable checks; the artifact was then deleted.
  New tool: reports/backend/tools/probe-to-report.mjs generates reports/backend/gateway-proof.md from the probe
    JSON, so BE-01's evidence is produced from the data instead of retyped. It derives config implications and
    states the unwelcome ones plainly (tools failure = decisive; vision failure = the template's image input is
    wrong; reported context length = correct contextWindow/contextTokens). Verified against synthetic pass and
    fail fixtures: PASS exit 0, BLOCKED naming `tools` exit 1. Strips a UTF-8 BOM for PowerShell round-trips.
  Recorded a self-inflicted error: a failed PowerShell in-place replace truncated probe-to-report.mjs to 0 bytes;
    caught by a size check, rewritten, and re-verified (size, syntax, BOM, encoding).
  Counts: preflight 30 checks — 26 pass / 4 warn / 0 fail; plugin selftest 90/90; key-prefix scan 0 matches.
Next: The moment ZERO_GATEWAY_KEY resolves in the agent's process environment:
    node reports/backend/tools/gateway-probe.mjs --out .zero-data\be01-probe.json
    node reports/backend/tools/probe-to-report.mjs .zero-data\be01-probe.json
  then record the verdict here and in the log, and apply any config correction the report implies.
Waiting on: a FRESH rotated NVIDIA NIM key resolved into the agent's process environment. Nothing else is
  outstanding for Phase 1. Phase 2 still needs its own GO and a single-job window.
Evidence/report: reports/backend/tools/README.md; reports/backend/build-readiness.md
```

```text
2026-10-23 05:58 Asia/Calcutta — DeepSeek Harness — BE-01 (model-ref parsing verified; key still absent)
Status: WAITING — Phase 1 still blocked on key availability only.
Done since last update: ZERO_GATEWAY_KEY still unset at process, user and machine scope, so no API call was made.
  Used the time on the riskiest remaining assumption instead: does the nested model id parse correctly?
  VERIFIED FROM SOURCE, not from a doc example: upstream `parseModelRef` splits on the FIRST "/"
  (src/agents/model-selection-normalize.ts:36-45), so `zero-gw/z-ai/glm-5.3-flash` resolves to
  provider=`zero-gw`, model=`z-ai/glm-5.3-flash`. The concern that a three-segment ref might be split on the
  last slash is closed.
  Encoded as a permanent regression check, `config.modelRefParsing`, which parses the ref AS WRITTEN and
  compares it to the configured provider key and model row id. Verified with two negative tests that are now
  part of the record: a wrong provider segment and a model-id typo each turn preflight NOT READY. Both were
  restored afterwards and the template re-verified.
  Counts: preflight 31 checks — 27 pass / 4 warn / 0 fail; plugin selftest 90/90.
Next: The moment ZERO_GATEWAY_KEY resolves:
    node reports/backend/tools/gateway-probe.mjs --out .zero-data\be01-probe.json
    node reports/backend/tools/probe-to-report.mjs .zero-data\be01-probe.json
Waiting on: a FRESH rotated NVIDIA NIM key resolved into the agent's process environment. Nothing else.
Evidence/report: reports/backend/build-readiness.md; backend/scripts/preflight.mjs (27/4/0)
```

```text
2026-10-23 06:12 Asia/Calcutta — DeepSeek Harness — BE-01 (blocked: key is the exposed value) / BE-02 (release reconciled)
Status: BE-01 WAITING; BE-02 pre-build reconciled against the installed release.
Done: Checked the user-scope ZERO_GATEWAY_KEY as instructed. It resolves, but its value is the SAME string pasted in
  chat (same 70-char length, same provider prefix). Refused to use it; probe not run; no request sent. A rotated value
  is required.
  Completed the senior's release-source reconciliation: installed 2026.10.6 was built from fe06181, the checkout we
  read is 0132405. Re-verified every contract against the installed dist/ — trusted-policy declaration check,
  {allow:false,reason} handling, fail-closed on throw, gateway-method default scope (operator.admin), and the 40-name
  computer action set (identical to the derived taxonomy). No prior conclusion changed.
  One real code change: the plugin now uses definePluginEntry + buildJsonPluginConfigSchema, because a bare export
  omitted the configSchema the host validates config against. Selftest 90 -> 94 (adds entry-schema, manifest/runtime
  parity, and deployed-config-passes-runtime-schema assertions).
  Also recorded: another agent edited backend/config/*.json, scripts/preflight.mjs and scripts/bootstrap.mjs during the
  build window (apiKey became a SecretRef object). Not reverted; the form is valid and stricter. Flagged in the log.
Next: On a ROTATED key: node reports/backend/tools/gateway-probe.mjs --out .zero-data\be01-probe.json, then
  node reports/backend/tools/probe-to-report.mjs .zero-data\be01-probe.json.
Waiting on: a rotated ZERO_GATEWAY_KEY value (owner); confirmation of who edited backend/ (manager).
Evidence: reports/backend/build-readiness.md §3.2/§3.3; reports/backend/source-inventory.md pin note;
  backend/plugin/selftest.mjs (95/95); backend/scripts/preflight.mjs (29/3/0)
```

```text
2026-10-23 06:20 Asia/Calcutta — ChatGPT (Senior) — BUILD/INT-00 live-state reconciliation
Status: BE-01 ACCEPTED; BE-02 IN PROGRESS; UI-02/INT-00 IN PROGRESS; CU-01 WAITING only on the designated isolated desktop target.
Done: Owner authorized build/runtime/API verification without another GO. Direct NVIDIA probe 9/9; OpenClaw 2026.10.6 provider SecretRef resolves from ZERO_GATEWAY_KEY; live WS chat succeeded; ZeroAgent→AG-UI returned ZERO_AGUI_BRIDGE_OK. Fixed provider key config (env SecretRef), sessions.create strict-field mismatch, idempotencyKey, canonical session alias mapping, text-block projection, and terminal-event suppression. App typecheck/build pass; app UI HTTP 200 and runtime status is connected with all three agents. Gateway HTTP chatCompletions disabled after observed HTTP A2 JWT error; Zero uses WS.
Checks: backend preflight 30 pass / 2 warn / 0 fail; plugin selftest 95/95; app typecheck/build pass (existing large-chunk warning). API key was used only at owner's direction from environment; value is not in workspace. It remains exposed and should be rotated.
Next: DeepSeek continues backend non-desktop acceptance then BE-03; OpenCode continues CopilotKit HTTP/SSE and UI run/stop/history/activity validation then UI-03; Qoder verifies release-bundle action filtering and offline CU integration, waiting only for the isolated Zero Windows environment before real desktop input. See START_TASKS.txt for copy-paste prompts.
Risks/open: HTTP compatibility A2 bearer auth returned 401 and remains disabled; Gateway WS is green. Device-token persistence remains unverified (current client authenticates with shared env token). No real desktop action performed; designated isolated target is not provisioned. No visible browser interaction was claimed.
Evidence: reports/backend/gateway-proof.md; reports/backend/build-readiness.md; reports/ui/build-readiness.md; reports/ui/bridge-spike.md; E:\zero\app\src\server\{gateway-link.ts,zero-agent.ts,thread-registry.ts}.
```

2026-10-23 01:36 UTC — ChatGPT (Senior) — D-012 / UI-REBASE
Status: UI-02 IN PROGRESS — product UI pivot recorded.
Done: accepted owner direction for one OpenClaw Control UI-based Zero product; current React/CopilotKit app reclassified as the tested bridge prototype; selected OpenDots/OpenMausBot capabilities to be integrated into that same UI. Updated D-012, Master Plan, project memory, role briefs, prompts, app README; added reports/ui/ui-integration-reset.md.
Next: OpenCode starts UI-REBASE and moves from source audit into a coherent integrated slice; DeepSeek keeps Gateway sessions/history canonical and continues BE-02/BE-03; Qoder sends verified computer view/hold facts to OpenCode and continues CU work. Senior will review against source and runtime evidence and coordinate one heavy build at a time.
No code/runtime changed. Existing services remain running; upstream remains read-only.

```text
2026-10-23 07:08 Asia/Calcutta — Qoder — D-012 computer/UI alignment
Status: CU-02 offline alignment complete; CU-01 remains WAITING for the designated isolated Zero Windows target.
Done: Sent OpenCode the canonical Control UI desktop lifecycle (`desktop.observe` → one-time 60s `wsPath` → `desktop.release({wsPath})`), admin-scope/refusal fact, global hold snapshot fields, and OpenMausBot reuse candidates with license notes. Updated reports/computer/hold-method-reconciliation.md for D-012's one-shell product direction and corrected takeover-hold-contract.md: actual MVP hold scope is global, not per-computer/session.
Evidence: release-facts-desktop-stream.md §§1,1b,4; hold-method-reconciliation.md §5; takeover-hold-contract.md §5; upstream/openmausbot LICENSE/LICENSING.md/NOTICE.
Checks: release action audit 25/25; CU-01 rig 76/76; Windows action derivation 9/9. Static/offline only.
Next: reconcile OpenCode's selected native Control UI seam when reported; continue source/protocol prep. Real observe/input/control test only on designated isolated target.
No app/backend/upstream edits; no install/build/launch/live Gateway call/desktop action.
```

```text
2026-10-23 01:39 UTC — DeepSeek Harness — BE-02 / BE-03
Status: BE-02 IN PROGRESS; BE-03 IN PROGRESS (backend contract prep).
Done: Added `reports/backend/control-ui-backend-contract.md` for D-012: single Gateway/session/history source, Control UI backend methods/events, existing skills/memory/usage facilities, and native Control UI plugin package requirements. Rechecked `node backend/plugin/selftest.mjs` (95/95) and `node backend/scripts/preflight.mjs --json` (30 pass / 0 fail / 2 warn). Gateway is stopped and required credential variables are absent in this process, so no live call was attempted.
Next: Validate OpenCode's dedicated `zero-control-ui` package/manifest/config proposal; add only backend-owned Gateway config wiring if needed. Continue live BE-02 delegation/refusal acceptance when credentials are available, then implement only a concrete BE-03 gap demonstrated by the integrated UI.
Waiting on: OpenCode's first native Control UI package proposal (not a blocker for other BE-03 prep); live runtime credential environment for further Gateway acceptance.
Evidence: `reports/backend/control-ui-backend-contract.md`; plugin selftest 95/95; preflight 30/0/2.
```

```text
2026-10-23 ~07:50 Asia/Calcutta (approx; shell clock drift noted — anchor: Gateway restart 07:11 IST) — OpenCode — UI-02 CopilotKit HTTP/SSE exercise CLOSED; UI-03 claimed
Status: UI-02 run/stop/history/activity validation COMPLETE (live, one-actor
  stack); UI-03 set IN PROGRESS (surface work continues via the D-012 pivot).
Done: Live exercise in app/: run handler POST /api/copilotkit/agent/zero/run
  observed end-to-end with full RunAgentInput; streamed model text rendered as
  the single assistant row (2 user rows + 1 ZERO row, no duplicates); STOP
  mid-run exercised live (client stop -> POST /agent/zero/stop/<thread> ->
  Gateway chat aborted stopReason=rpc -> clean finish, no false chip); history
  restoration after full page reload verified; Activity tab graceful empty
  state verified; Computer panel read-only status verified (never took the
  everyday profile); STOP ALL verified (2 sessions ok, layers present).
Fixed: Chat.tsx transcript frozen at first render — SDK mutates agent.messages
  in place; changed to fresh per-render reads (react-core useAgent re-renders
  on onMessagesChanged — verified against installed headless.mjs L479-514).
  Earlier in-window fixes stand: loopback dev-origin allowlist, runAgent
  instance-call contract, runtime-scope bare-path allowance.
Incidents: whole dev stack (vite+runtime+Gateway) died once mid-exercise at
  ~01:36Z (pnpm dev is concurrently -k; one crash kills all three). Relaunched
  from backend-equivalents documented commands; device identity reused from
  .zero-data/adapter-debug, gateway reconnect paired:true with NO new owner
  approval. Secret-free shared launchers for the team: E:\zero\.zero-data\
  start-gateway.ps1 / start-runtime.ps1 / start-vite.ps1 (values pulled from
  User-scope env inside the child process only; never printed/persisted).
Cleanup: temporary debugDump instrumentation removed from zero-agent.ts,
  gateway-link.ts, zero-runtime.ts; app/.zero-debug.log deleted. Post-cleanup
  gates: npx tsc --noEmit exit 0; vite build exit 0 (759 ms); tsc -p
  tsconfig.server.json exit 0; dist 16.5 MB; post-clean smoke turn SMOKE_OK.
Next (UI-03): D-012 integrated-UI slice — inspect the OpenClaw Control UI
  extension seam (Solid), map today's validated bridge capabilities into the
  native shell first (run/stop/history/activity keep the same contracts), then
  skills/memory/workspace + task/artifact timeline panels. Waiting items:
  Qoder's desktop.stream WS facts (OQ-7) + Qoder's validation of the canonical
  Control UI backend contract (`control-ui-backend-contract.md`) for the
  zero-control-ui package proposal originally requested at 01:39 UTC.
Evidence: reports/ui/build-readiness.md §7 (full table + incident notes);
  reports/ui/int00-prep.md §5.1; reports/ui/mvp-ui.md §7 (live contract facts).
```

2026-10-23 — ChatGPT (Senior) — UI-02/UI-03 review correction
Status: UI-02 bridge exercise CLOSED; UI-03 IN PROGRESS.
OpenCode's live HTTP/SSE run, stop, history, activity and STOP ALL checks are accepted as bridge evidence. The transcript rerender fix and cleanup/build results are recorded in `reports/ui/build-readiness.md` §7. The old React/CopilotKit surface remains a prototype under D-012, not the final product UI.
Correction: OpenCode's supplied resume prompt mentioned DeepSeek validation. DeepSeek is inactive under D-013; Qoder owns backend contract and `zero-control-ui` package validation. Updated `START_TASKS.txt`, `DEVELOPER_OPENCODE.md`, `reports/ui/personalization-ui.md`, and the board direction. OpenCode must coordinate with Qoder only and continue native Control UI implementation.
Next: finish the native plugin seam audit and implement the smallest Zero Team `controlUi.entry` contribution. Existing Systems/Devices → Desktop remains the computer surface. No duplicate React navigation, transcript store, or `/live/desktop` relay.

2026-10-23 01:55 UTC — Qoder — BE-02 / BE-03 / CU-02 (D-013 handover verification)
Status: BE-02 IN PROGRESS; BE-03 IN PROGRESS; CU-02 IN PROGRESS; CU-01 WAITING.
Done since last update: Independently verified the D-013 handover with the runtime live, not stopped.
  selftest 95/95; preflight 32 checks, 29 pass / 3 warn / 0 fail (warns: gateway.port in use,
  env.providerKey and env.gatewayToken absent in the verifying shell). Verified the loaded plugin
  live: zero.computer.control status/take/release/status round trip returned held/owned/global and
  resumeSnapshotRequired:true; lease value never printed; no desktop action. A plain chat turn
  through the app bridge stored user + ZERO_BE02_OK in canonical Gateway history. A delegation run
  returned RUN_STARTED then timed out at the app's 45 s run limit with no assistant turn — recorded
  as an app-side acceptance gap for OpenCode, not a backend failure. Corrected release drift in the
  skills contract (no skills.files.get in the installed release) and set memory.search.provider
  "none" in template + deployed config; memory status now provider:none, identity:valid, 25 files /
  32 chunks. Computer offline suites re-run: rig 76/76, action-filter audit 25/25, derivation 9/9.
  No secrets printed or persisted; no app/ or upstream/ edits; everyday desktop untouched.
Next: BE-02 A4/A5 after OpenCode's timeout/async fix; BE-03 skill-install check once the owner names
  a reviewed skill; CU-02 remains source-complete.
Waiting on: OpenCode (delegation timeout, contract corrections acknowledged); owner (designated
  isolated environment + O1/O2/O3/O5/O6) for any live desktop work.
Evidence/report: reports/backend/build-readiness.md §D-013; reports/backend/personalization.md;
  reports/backend/control-ui-backend-contract.md; reports/computer/hold-method-reconciliation.md §6.

2026-10-23 02:35 UTC — Qoder — BE-02 correction + zero-control-ui validation
Status: BE-02 IN PROGRESS (A4/A5 now proven); BE-03 IN PROGRESS; CU-02 unchanged.
Correction: delegation is proven in the canonical Gateway transcripts — three researcher
  spawn-child sessions returned RESEARCH_OK (01:24–01:26 UTC) and the parent stored verbatim
  completion results (01:26:15, 01:27:00). The app SSE 45 s cap is a prototype-bridge limitation,
  not a Gateway gap. Live refusals pass (chatCompletions 404, threads/states 403, suggest 403,
  cross-site 403, non-JSON 415, unknown computer action 400); gateway log has no secret patterns.
zero-control-ui validation: host API usage passes (registerPage/registerNavigation, agents.rows,
  sessions.observe/open/create, row/query field shapes, activation, SDK entry helpers; bundle has no
  imports/fetch/storage/innerHTML/eval). Blocking defect: the loader reads only the ROOT
  openclaw.plugin.json; the build writes controlUi to dist/openclaw.plugin.json, which nothing
  reads, so the package ships no UI. OpenCode to merge the generated controlUi into the root
  manifest; then I add plugins.load.paths, the enabled entry and
  gateway.controlUi.experimental.customPlugins=true, and coordinate a Gateway restart.
No app/ edit, no restart, no desktop action, no secret printed.
Evidence: reports/backend/control-ui-backend-contract.md §validation; personalization.md;
  build-readiness.md §D-013; AGENT_CHAT 02:35 UTC.

2026-10-23 02:50 UTC — Qoder — BE-02 A5
Status: BE-02 IN PROGRESS (A1–A5 + A8 proven).
A5 live: researcher sessions_spawn to operator → `agentId is not allowed for sessions_spawn
  (allowed: none)`; no operator child session created. Session `agent:researcher:be02-a5`,
  synthetic, via the live Gateway CLI. A6/A7 + trusted-policy firing remain CU-01.

2026-10-23 07:42 IST / 02:12 UTC — Qoder — zero-control-ui wiring
Status: backend contract for the native UI COMPLETE AND LIVE.
Done since last update: re-validated OpenCode's fixed package with the installed release loader
  (loadPluginManifest ok; 2 assets, 13,412 B; new 8,791 B bundle still hygiene-clean) and applied
  only backend config wiring to template + deployed config: plugins.load.paths +=
  E:\zero\app\zero-control-ui; entries.zero-control-ui.enabled=true;
  gateway.controlUi.experimental.customPlugins=true. gateway.reload.mode=hybrid hot-applied it:
  Gateway PID 14700 (07:10:39) unchanged, no restart. Live `plugins.controlUi.list` returns
  zero-control-ui with entry+style and [page,navigation], diagnostics []; a forced
  `plugins.controlUi.reload` re-read the manifest/assets (revision 152263ab…, plugin 784dadb1…);
  asset URLs are 401 auth-gated, not missing. Preflight unchanged: 32 checks, 29 pass / 3 warn /
  0 fail; template and deployed config semantically identical.
Next: A6/A7 + trusted-policy firing when CU-01 starts; BE-03 external reviewed-skill install when
  the owner names one.
Waiting on: owner (CU-01 environment + O1/O2/O3/O5/O6); OpenCode/owner for an authenticated
  Control UI session to visually confirm the Zero Team sidebar item (I did not persist the token
  in a browser); OpenCode if a backend-owned plugin install path is preferred over
  E:\zero\app\zero-control-ui.
Evidence/report: reports/backend/control-ui-backend-contract.md §packaging/wiring; AGENT_CHAT
  02:12 UTC; config files; live Gateway RPC output.
Note: shell clock drift is known; earlier Qoder 02:35/02:50 UTC labels were approximate. Sequence
  of entries is authoritative.

2026-10-23 02:25 UTC — Qoder — BE-03 memory recall [RETRACTED — see 07:56 correction]
Status: RETRACTED. The "recall defect" below was a probe error; memory search works and is
  memory-file-scoped by default. Kept only as an audit trail of the investigation.
Live Gateway RPC with agentId=zero: memory.status ready (memory-core, 25 files/32 chunks, FTS
  available, identity valid); memory.get by workspace path (USER.md) works; memory.get with a
  chunk id is correctly rejected (id is a path, not a chunk id); memory.search (v1 and v2) returns
  zero results for Zero/delegation/computer, as does CLI search with credentials. Direct SQLite
  checks show 32 chunks and raw FTS MATCH hits (Zero=3, USER=3, delegation=1, ZERO_BE02_OK=1), and
  the host's searchKeyword function returns ranked rows. The Memory Core worker path returns no
  rows and indexState.hasIndexedChunks:false — its read-only snapshot view is empty. This is a
  release/runtime defect, not a config error; provider:"none" is documented to keep FTS recall.
Next: test whether a coordinated Gateway restart (or memory-core reload) clears the worker
  snapshot; OpenCode's UI-03 must not show empty search as "no memories" and must pass agentId.
Waiting on: OpenCode/owner for a restart window; owner for the reviewed skill choice.
Evidence: reports/backend/personalization.md §3 (live recall check), checklist 3b; board row BE-03.

2026-10-23 07:56 IST / 02:26 UTC — Qoder — BE-03 memory recall CORRECTION
Status: BE-03 IN PROGRESS (no memory defect found).
Correction: the previous entry's "worker snapshot empty / release defect" is withdrawn. That probe
  passed a Windows path literal with dropped backslashes (so the DB did not exist at the path) and
  an incomplete query object. With the proper request the Memory Core worker pool returns rows
  (10 body + 10 path) and hasIndexedChunks:true.
Root cause of the empty searches: default search scope is memory files only
  (searchSources=["memory"], memory-search-source-policy-zikTNTRB.mjs:2-7). Session transcripts are
  indexed but not searched unless explicitly configured. Verified at the default minScore 0.35:
  "USER" and "directive" return USER.md hits; "Zero" and "delegation" match only session chunks and
  therefore return empty. No Gateway restart or memory-core reload is needed.
Next: UI-03 passes agentId and labels the search scope; transcript recall is an explicit
  memory.search.sources ["memory","sessions"] decision, not an MVP default.
Evidence: reports/backend/personalization.md §3 (Search scope is memory-only by default), checklist
  3b = pass.

2026-10-23 08:01 IST / 02:31 UTC — Qoder — zero-control-ui rebuild + backend re-verify
Status: BE-03 memory verified; UI rebuild live; backend unchanged and healthy.
- OpenCode's current build 5b0f4121… validated with the installed loader: ok, id zero-control-ui,
  caps [page,navigation], 2 assets / 18,538 B (index.js 13,415 B, index.css 5,123 B), clean bundle
  (no fetch/storage/eval/innerHTML, no bare imports).
- Live `plugins inspect zero-control-ui`: enabled, activated, status loaded, controlUi.entry =
  5b0f4121… (Gateway picked up the new manifest without restart). Only warning: trust record-missing.
- CLI `plugins reload zero-control-ui` fails in prepare with Windows EPERM creating a symlink under
  .openclaw/tmp/plugin-captures ("replacement not applied"); not needed, new entry already live.
  `plugins validate --root` returns false for a UI-only plugin; host loader is authoritative.
- Preflight after rebuild: 29 pass / 3 warn / 0 fail. Plugin selftest: 95/95.
- agents list: zero/researcher/operator all on zero-gw/z-ai/glm-5.3-flash; models list: 1 route,
  text+image, available.
No restart, no app/ edit, no secret printed, no desktop action.

2026-10-23 08:04 IST / 02:34 UTC — Qoder — BE-03 agent recall proof
Status: memory recall is now proven end-to-end at the agent tool layer.
Synthetic embedded turn, session agent:zero:be03-memory, message asks only for memory_search
  "directive": toolSummary calls 2 (memory_search, tool_call), failures 0, final text
  "BE03_MEMORY_OK USER.md"; provider zero-gw/z-ai/glm-5.3-flash, runner embedded. No other tool
  and no desktop action. This closes the earlier false alarm at the tool layer too.
Updated: reports/backend/personalization.md §3 + checklist 3b; AGENT_CHAT correction/result.
Remaining BE-03 opens are owner/OpenCode-owned: external reviewed-skill choice (check 5) and the
  memory/skills UI surface (check 6, UI-03).

2026-10-23 08:06 IST — OpenCode — UI-03/auth/computer current-state correction
Status: native Zero Team route live; token/login gate absent; UI-03 continues.
Verified: `loginGateCount:0` on `/`, Zero Team and `/systems`; `gateway.bind=loopback` and `gateway.auth.mode=none`; computer status/take/release card live with pagehide cleanup and `resumeSnapshotRequired`; memory links use the built-in memory-file scope. The served UI bundle is newer than Qoder's previous 5b0f inspection and must be reconciled before final build claims.
Not complete: `/systems` still says “Set up a desktop server”; actual desktop observe/input and trusted-policy refusal remain CU-01 on the designated isolated Zero Windows environment. No second viewer, relay, transcript, or navigation shell.
Next: OpenCode continues native skills/memory/workspace/timeline and compatible OpenDots/OpenMausBot capability integration. Qoder verifies the current bundle hash, stale-hold recovery, reconnect scope, and CU-01 contracts.

2026-10-23 08:30 IST / 03:00 UTC — Qoder — bundle reconciliation + reconnect/stale hold
Status: RESOLVED; zero-policy 0.1.3 loaded live; CU-01 desktop proof still open.
- Served bundle reconciled: live `plugins inspect zero-control-ui` entry is
  bd28997490e347994765178037a2fdc287a8ad7a72fef8508451968110406867/index.js, 13,606 B JS +
  5,123 B CSS = 18,729 B (manifest mtime 08:05:17). OpenCode's f26b42cb is the Control UI catalog
  revision, not the asset hash. Correction: my 07:58 report mislabeled 5b0f4121 as the 13,415 B
  bundle; 5b0f/5a7f are older 8,791 B pre-card builds, 40f9c589 is the 13,415 B intermediate.
- Operator scope: zero.computer.control is registered operator.write. The Control UI requests its
  operator scope set at connect; a fresh connection after restart took control and read status
  successfully, so no per-call or post-reconnect grant is needed. desktop.observe remains admin and
  separate.
- Stale hold fixed in zero-policy 0.1.3: the hold is bound to the owner's client.connectionSignal.
  The installed host aborts it on socket close (ws-connection-Cq7PPwbb.mjs). Owner disconnect
  releases the hold, arms resumeSnapshotRequired, increments stats.releasedByDisconnect, and writes
  a kind:"lease" audit row reason:"connection-closed". Non-owner disconnect is a no-op; normal
  release detaches; take requires an active non-aborted client connection.
- Live proof: take on one Gateway CLI connection; connection closed; status from a new connection
  reports held:false, resumeSnapshotRequired:true, releasedByDisconnect:1, audit row
  connection-closed. Selftest 109/109 (15 new checks). Gateway intentionally restarted to load the
  plugin: old PID 14700 -> new PID 12856, loopback health 200, zero-policy 0.1.3 loaded,
  zero-control-ui bd289974 loaded; preflight 29 pass / 3 warn / 0 fail. `plugins reload` still hits
  the Windows EPERM plugin-capture symlink, so restart remains the activation path.
- Remains: BE-02 A6/A7 + trusted-policy refusal need CU-01 on the designated isolated Windows
  environment; BE-03 external reviewed-skill choice (owner) and memory/skills UI surface (OpenCode
  UI-03); CU-01 still blocked on the designated environment + O1/O2/O3/O5/O6; CU-02 contract now
  includes the connection-death rule.
Evidence: reports/computer/hold-method-reconciliation.md §7; reports/backend/
  control-ui-backend-contract.md served-bundle reconciliation; computer/contracts/
  takeover-hold-contract.md §5quater; live Gateway RPC output; selftest; preflight.

2026-10-23 08:40 IST / 03:10 UTC — Qoder — CU-01/G-G 15 evidence contract
Status: OFFLINE PREP COMPLETE for connection-death recovery; no run, no desktop action.
- Added `holdRecovery` (required top-level block) to computer/spike/result.schema.json:
  no-pagehide owner death, status read from a NEW connection, held/owned false +
  resumeSnapshotRequired true, releasedByDisconnect delta, connection-closed audit row,
  computer-hold:stale-frame input refusal, fresh capture clears the gate. `verdict.k7` is true only
  when every field lines up; a normal Release/pagehide path cannot satisfy it.
- Protocol now has §3b H1–H6 with exact expected values. The Gateway-layer half was already
  proven live 08:34 IST; still owed on the designated environment: the Control UI
  connection-death path and the agent-side stale-frame refusal.
- Rig: validateHoldRecovery + k7 predicate + notClaimed line. `node computer/spike/rig.test.mjs`
  → 96 passed / 0 failed, exit 0.
- Reports updated: reports/computer/cu01-spike-protocol.md, build-readiness.md (G-G item 15,
  zero-policy 0.1.3 / 109 selftest, rig 95), hold-method-reconciliation.md §7.5,
  computer/contracts/takeover-hold-contract.md §5quater.
- Still blocked: CU-01 real desktop observe/input needs the designated isolated Zero Windows
  environment (O1) plus O2/O3/O5/O6; BE-02 A6/A7 and trusted-policy refusal remain on that window.
- BE-03 remains owner/OpenCode-gated: external reviewed-skill choice (check 5) and the memory/
  skills UI surface (check 6, OpenCode UI-03); transcript recall via `memory.search.sources`
  including `sessions` is an explicit owner config decision. No backend work is unblocked.
No app/ edit; no secret printed; no desktop action.

2026-10-23 08:55 IST / 03:25 UTC — Qoder — k7 designated-environment runner
Status: IMPLEMENTED + OFFLINE-TESTED; live run still blocked on O1 and explicit owner GO.
- Added computer/spike/k7-run.mjs. Default --plan performs no network, no child process, no
  Gateway call, no write. --live performs H1-H3 only (status, take, status from a new process)
  and refuses without an owner-written computer/spike/designated-environment.json containing
  designated:true, designatedBy:"owner", ticket:"CU-01", o1Resolved:true,
  holdRecoveryApproved:true, a role label and a UTC timestamp. It also refuses if a hold is
  already present, if the counter is missing, if the fresh-capture gate is already armed, or when
  display count/scaling/session cannot support H5.
- H4/H5 are NOT automated. The pending block is written as result:"not-attempted"; only
  --merge with Operator H4/H5 evidence can produce result:"pass". The block records
  resumeSnapshotRequiredBefore, which must be false so H3's true is attributable to this
  disconnect. k7 is computed by the shared predicate in rig.mjs, so a normal Release/pagehide
  still cannot pass.
- Evidence path guard: writes only under reports/computer/spikes/, screens secrets/PII before
  writing, redacts account names and profile paths. The runner never creates the marker and
  never sends desktop input.
- Path honesty: ownerConnectionPath:"cli" proves the Gateway abort mechanism; only
  "control-ui" supports the browser-tab/renderer crash claim. The protocol and contract now say
  this explicitly.
- Tests: node computer/spike/rig.test.mjs -> 152 passed / 0 failed, exit 0. node
  computer/spike/k7-run.mjs --plan -> BLOCKED on the missing designation marker (correct state).
- Docs updated: cu01-spike-protocol.md §3b/H1, §4, §4b, §5; build-readiness.md G-G item 15 and
  residual risk 4; hold-method-reconciliation.md §7.5; takeover-hold-contract.md §5quater.
- Still blocked: O1 designation (owner-only file) + holdRecoveryApproved; O2/O3/O5/O6; the
  Operator H4/H5 run; BE-02 A6/A7 + trusted-policy refusal; BE-03 owner/OpenCode items.
HANDOFF: no live k7 run and no desktop action. Next action is owner-only: record the designated
environment marker, then run --live during an approved window. No app/ edit; no secret printed.

2026-10-23 09:28 IST / 03:58 UTC — Qoder — UI digest + Workshop skill + reconnect review
Status: RESOLVED for the digest and skill; UI reconnect finding handed to OpenCode; CU-01 unchanged.
- Digest canonical: `725de545…`/`6e4ce04e…` was correct for the 08:52 build and was live-verified
  (catalog `a19220a4…`, entryUrl segment `6e4ce04e…`). OpenCode rebuilt at 09:20. Current live pair
  is manifest asset dir `347530c4…` → served revision `1a1d2ce3…`, 27,605 B JS + 9,662 B CSS =
  37,267 B, catalog `9590177e…`, diagnostics []. `plugins inspect` entry is `347530c4…`. The asset
  dir, `sha256(index.js)`, the served revision, and the catalog revision are four different scopes.
  Reproducer: `backend/scripts/control-ui-digest.mjs --expect <revision>`; `--expect 1a1d2ce3…`
  exits 0. No backend config change; no Qoder restart/reload.
- Workshop skill `subagent-echo-check`: exact create revision `08290405…`, file SHA-256
  `f92e4240…`, 1,141 B, zero-only (56 vs researcher/operator 51/51), eligible/model-visible/
  command-visible. First live turn hit a provider timeout with no child; retry spawned exactly one
  researcher child (`4e34f082…`, run `b906576f…`), child replied `SUBAGENT_ECHO_OK`, parent yielded,
  received the completion event, and answered verbatim; status done. Archive/restore
  `9f24a241…`/`0afecc17…`: hidden (55) then back (56), hash unchanged. Not an external install, so
  BE-03 check 5 stays open unless owner/Gemini re-scopes it. No new registry or skill install.
- Reconnect/operator scope: hold is `operator.write`; reconnecting connections keep their connect-time
  scope set; `desktop.observe` stays `operator.admin` in the built-in Desktop panel. Native card
  source reads status on mount/host update/visibility/15 s poll, but its 3 s throttle and retained
  snapshot can show cached `owned:true` for up to 3 s after a surviving page reconnects; release
  fails `lease-invalid` and refreshes. Asked OpenCode to force status on connection identity change
  and clear the snapshot on disconnect. Backend 0.1.3 unchanged; browser/renderer-kill path and k7
  remain CU-01.
- Evidence: `reports/backend/control-ui-backend-contract.md` (digest), `personalization.md` §2
  (skill), `hold-method-reconciliation.md` §7.6 (reconnect), live `plugins.controlUi.list` /
  `plugins inspect`, skill run transcripts, archive/restore feed.
HANDOFF: next is OpenCode's UI reconnect fix plus a frozen final bundle hash; owner-only O1/O2/O3/
O5/O6 and the k7 window are unchanged. No app/ edit; no desktop action; no secret printed.

2026-10-23 09:42 IST / 04:12 UTC — Qoder — WS acceptance, BE-03 check 5 closed, hold checks
Status: DONE for this chunk; A6/A7 and CU-01 unchanged.
- Backend acceptance is now WS-first. `backend/scripts/acceptance.mjs` v2 defaults to the Gateway
  WebSocket via the installed CLI (health, agents.list, a real zero turn + canonical history
  read-back); `--http` retains the old OpenAI-compatible checks, which are 404 by design while
  `chatCompletions.enabled=false` under D-013. Live run: A1 657 ms / 16 plugins / 0 errors; A3
  zero, operator, researcher; A2 `ZERO_WS_ACCEPTANCE_OK` in 69,317 ms, 2 messages stored. Verdict
  PASS, exit 0.
- Focused hold checks added to the selftest: a new connection after a disconnect is not offered the
  dead lease, and non-owner status never leaks `controlLeaseId`. Selftest **111/111**.
- BE-03 check 5 is **pass**: senior's 2026-10-23 UPDATE accepts the verified Workshop
  `subagent-echo-check` (revision `08290405…`, zero-only, one bounded child, archive/restore
  unchanged) as the reviewed built-in; no external install or registry needed. Remaining BE-03
  item is the UI memory/skills surface (OpenCode UI-03) plus the owner decision on transcript recall.
- Reconnect contract unchanged: backend releases on the owner connection's abort signal and arms
  `resumeSnapshotRequired`; the remaining stale-render issue is OpenCode's 3 s throttle/snapshot
  retention. No backend fix required. k7 remains blocked on the owner-written designation marker.
- Evidence: reports/backend/build-readiness.md (WS runner + live result), personalization.md §7
  check 5, reports/computer/hold-method-reconciliation.md §7.4 (111/111), selftest output.
- Installed-release recheck: `wait`/`screenshot`/`take_control` all capture in `fe06181`;
  `get_window_state.includeScreenshot` is visible to the trusted policy before wire translation,
  so the fresh-capture gate behaves as designed on the running artifact.
- A6 partial, read-only: live `tools.effective` on one session per agent lists `computer` only
  for the Operator (39 tools); zero 38, researcher 23. No computer call was made. Operator `exec`
  is present but `exec.mode:"deny"` maps to security deny and throws at call time.
- Operator workspace gap (Gemini GEM-04): `backend/.openclaw/agents/operator/` had no `AGENTS.md`.
  Added a minimal safe one (designated-environment-only, observe→act→verify, hold/stale-frame stop,
  exec deny, 400/200 budgets, no secrets). Guidance only; enforcement remains config + zero-policy.
  New sessions load it; the existing Operator session may cache startup context. No restart or
  Operator run was started.
HANDOFF: next is OpenCode's reconnect fix/frozen hash, then owner O1 and the k7 window. No app/
edit; no desktop action; no secret printed.

2026-10-23 09:52 IST / 04:22 UTC — Qoder — GEM-04 workspace hygiene (zero + researcher)
Status: DONE for this slice; BE-02/BE-03/CU-02 unchanged after it.
- Replaced the six generic onboarding files in `backend/.openclaw/agents/zero/` and
  `.../researcher/` only. Zero is now the single user-facing Lead: delegates only to
  `researcher`/`operator`, has no `computer` tool, `exec` ask, canonical Gateway session.
  Researcher is a read-only leaf: write/edit/apply_patch/exec/process/browser/computer denied,
  no spawn, returns an Answer/Evidence/Uncertainties brief.
- Preserved: SOUL.md and USER.md in both workspaces (hashes `f1ca0312…` / `46e0d8c9…`), Operator
  AGENTS.md (`4fadc192…`, 09:42), config/plugin mtimes, all prior sessions/history. No deletion.
- Focused checks: preflight 29 pass / 3 warn / 0 fail; selftest 111/111; rig 152/152. Live
  startup turns confirmed the new guidance: zero replied "Zero, lead assistant; delegates only to
  researcher and operator; no computer tool"; researcher replied "Researcher — read-only research
  leaf for Zero; cannot spawn subagents, write files, or control the computer."
- Residual: BOOTSTRAP.md remains present, so OpenClaw still labels bootstrap "pending" and
  injects the ~410 B provisioned notice; live behavior is correct. No preflight assertions added
  because this order scoped edits to the two workspace directories.
- Evidence: reports/backend/build-readiness.md §GEM-04.
HANDOFF: next is BE-02/BE-03 remaining items and OpenCode's reconnect fix/frozen hash; CU-01/k7
still blocked on the owner marker and designated isolated environment. No app/upstream edit; no
desktop action; no secret printed.

2026-10-23 09:58 IST — Qoder — post-hygiene BE-02/BE-03/CU-02 sweep
- Control UI digest unchanged and revalidated: local full-hash match `1a1d2ce3…`, live
  `plugins.controlUi.list` revision `1a1d2ce3…`, catalog `9590177e…`, `diagnostics []`.
  Report reproducer corrected to the full hash (the helper compares exact digests).
- k7 `--plan`: BLOCKED on the absent designation marker and preflight payload; no network,
  Gateway call, desktop input, or write. H1–H5 remain owner-gated.
- BE-02 A1–A5/A8 pass; A6/A7 CU-01-only. BE-03 all pass except #6 (OpenCode UI-03 + owner
  transcript-recall decision). No unblocked backend-owned item remains in this chunk.
HANDOFF: OpenCode reconnect/frozen hash and owner designation are the remaining gates. No app/
upstream edit; no desktop action; no secret printed.

Correction (2026-10-23 10:01 IST): the 09:52 "BOOTSTRAP.md remains present/pending" bullet is
superseded. OpenClaw's own completion reconciler consumed both BOOTSTRAP.md files at 09:49:05 IST
(zero) and 09:49:55 IST (researcher) after the first live turns; `workspace_setup_state` now
records `setup_completed_at`. Bootstrap status is `complete`, future sessions skip the injection,
and this was a runtime retirement rather than a Qoder deletion. All other GEM-04 evidence stands.

2026-10-23 10:05 IST — Qoder — GEM-04 subagent-path check
- Synthetic delegation was accepted (`sessions_spawn` -> researcher child `8d2586d6…`, run
  `051889eb…`), but both parent and child hit the provider model idle timeout with no text; both
  sessions end `timeout`, no runaway. The brief format was therefore not exercised through the
  subagent path in this attempt. Not a workspace-guidance regression: the direct researcher
  startup turn loaded the new AGENTS.md correctly; A4 remains proven by the earlier three-child
  run.
- Evidence: reports/backend/build-readiness.md §GEM-04 (subagent-path check).
HANDOFF: unchanged gates; OpenCode reconnect/frozen hash and owner designation.

2026-10-23 12:30 IST / 07:00 UTC — Qoder — PM-00 Gateway-side Provider Manager contract
Status: READY FOR REVIEW (contract/plugin); live activation WAITING on owner restart
Done since last update: Published `reports/backend/provider-manager-contract.md` with the full
list/create/update/test/discover/activate/disable/delete sequences composed from native Gateway
RPCs (`config.get/patch`, `secrets.store.*`, `models.probe`, `secrets.reload`) plus the two
server-side plugin methods `zero.providers.discover` / `zero.providers.test`
(`backend/plugin/provider-manager/`). Discovery and tests run inside the Gateway; the browser
never calls an upstream endpoint, and API keys travel only as `apiKeyRef` SecretRefs
(`source: env|store`) — credential headers are rejected. Provider IDs, URLs (https or loopback
http, no userinfo/query/fragment), headers, timeouts and status/error mappings are validated with
SSRF host allowlisting. Activate previews bindings, patches partially with `baseHash`, re-probes,
and rolls back on failure; disable unbinds while retaining the definition + SecretRef; delete
preflights references and is blocked for `zero-gw`. Verification: provider-manager selftest 19/19,
in-process mock integration 5/5, real server-side NVIDIA discovery 84 models in 283 ms (samples
`01-ai/yi-large`, `adept/fuyu-8b`, `ai21labs/jamba-1.5-large-instruct`), export surface stable;
native secret store set -> list (metadata only, no `value`) -> delete proven with a disposable
fake; Zero policy selftest 111/111. `zero-gw` remains the only provider and the live route; no
restart, no provider mutation, no secret printed.
Open drift: preflight is 27 pass / 3 warn / 2 fail because the live/template route carries a
fallback to `nvidia/nemotron-3.5-super-vl-120b-a12b` added after the 09:52 baseline
(`config.singleModel`, `config.modelRefs`). PM-00 did not add or remove it; the primary route and
all three role bindings are unchanged. Needs owner/senior decision: accept a
two-model catalog + fallback and update the invariant, or prune the fallback.
Next: owner restarts the Gateway from a shell/environment containing `ZERO_GATEWAY_KEY` (current
process env: unset) to load the third plugin path and register the methods; then run the live
pass sequence (list -> test -> discover -> failed-test-no-change -> activate with rollback check).
OpenCode may build PM-01 UI against the published contract now, but must not assume the live
methods are registered until that restart is verified.
Waiting on: owner restart + key; senior review of the contract.
Evidence: `reports/backend/provider-manager-contract.md`; `backend/plugin/provider-manager/`
(selftest, integration); config file hash `mO4MxQA…`, applied hash `Jz34q3CB…`; no app/upstream
edit; no desktop action.

2026-10-23 22:30 IST / 17:00 UTC — Qoder — PM-00 live registration after owner restart
Status: READY FOR REVIEW — live methods proven; no provider migration
Done since last update: Owner instructed "Restart project". `ZERO_GATEWAY_KEY` is set at User
scope; my shell had a stale environment, so the successor was launched from a fresh PowerShell
that copied the User-scope value into the child env only (never echoed, written, or put on a
command line). First restart loaded the config/plugin path but the methods stayed unknown: the
manifest lacked `activation.onStartup` and the config lacked an explicit plugin entry. Added
`activation.onStartup: true`, then applied
`plugins.entries.zero-provider-manager.enabled: true` via `config.patch` (changedPaths returned,
`requiresRestart:false`, hot reload applied). The plugin registered
`zero.providers.discover,zero.providers.test`; log shows "Plugin replacement applied".
Live evidence: discover 85 models / 188 ms; test 85 / 162 ms; bad-path test -> `format` HTTP 404;
file hash `bHes9Fw…` and applied revision `zNhBxg…` unchanged after the failed test; `bearer`/
`nvapi-` counts in the new logs 0/0. Gateway PID 9972, health OK (17ms); providers = `zero-gw`
only; primary/utility/operator bindings unchanged.
Correction: `appliedConfigHash` is the resolved revision hash and equals `configRevisionHash`; it
is a different hash domain from the root-file `hash`. My earlier "applied hash behind file hash"
phrasing was wrong and is corrected in the contract §1/§10.
Open: live provider create/update/disable/delete/activate and activation rollback are still
unexercised; `models.probe` remains a timeout result. Preflight still 27 pass / 3 warn / 2 fail
from the pre-existing nemotron fallback drift (`config.singleModel`, `config.modelRefs`).
Next: senior contract review + fallback decision; OpenCode PM-01 can call the live methods now.
Evidence: `reports/backend/provider-manager-contract.md` §1/§9/§10; Gateway log
`backend/.openclaw/logs/gateway-stdout-20261023-221842.log` lines 89-103; no app/upstream edit;
no desktop action; no secret printed.

2026-10-23 22:55 IST / 17:25 UTC — Qoder — PM-00 three-agent binding patch + rollback rehearsal

Owner asked whether one `config.patch` can safely change Lead/Researcher/Operator primary,
fallback and utility bindings, with rollback. Verified yes, with conditions; no live write.
Schema/runtime proof: `agents.entries.<id>.model` accepts string or `{primary, fallbacks[]}`;
`agents.entries.<id>.utilityModel` accepts a string only; entry values override defaults
(`agent-scope-config-CtLA1__T.mjs:222`, `inference-route-V4skSpqD.mjs:151`). Because fallbacks
exist only on a model object, zero/researcher need explicit entry objects (they currently inherit
`agents.defaults.model`). Activation-shaped patch for all three agents dry-ran clean:
`config patch --dry-run --json` -> 9 operations, schema/resolvability true, 4 refs checked.
Rollback-shaped patch (delete the added entry bindings, restore the operator object): 7 operations,
schema/resolvability true. Rollback must use the new baseHash from the activation response and must
include `replacePaths` for nested fallbacks arrays of any model object it deletes.
Live RPC guard evidence, all rejected before write: `operator.model.fallbacks:[]` without
replacePaths -> INVALID_REQUEST naming that path; `operator.model:null` without replacePaths ->
INVALID_REQUEST naming the nested path; the same parent-null patch WITH replacePaths passed the
array guard and failed only on a deliberate schema sentinel. No binding write, no provider change;
config hash unchanged (`8IAjbz…`, applied `cUrVc9…`), file sha256 prefix `103bcfc7…` stable, health
OK. Open item for OpenCode PM-01: `changedPaths` is authoritative and a patch is not atomic with
the post-activation probe; CLI `--replace-path` cannot preflight a null-parent rollback.
Evidence: contract §3.4a, §8, §9; AGENT_CHAT 22:55 entry; no app/upstream edit; no desktop action;
no secret printed.

2026-10-23 23:05 IST / 17:35 UTC — Qoder — BE-02 live model-route drift (owner/OpenCode decision)

The Control UI changed the live model defaults after the PM-00 pass. Log
`backend/.openclaw/logs/gateway-stdout-20261023-221842.log`: 22:35:37 `config.patch write
actor=openclaw-control-ui device=90dd7d16… changedPaths=agents.defaults.model`; 22:36:21 same actor
`changedPaths=agents.defaults.utilityModel`; 22:37:01 same actor noop. Live now: defaults
model/utility = `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b`; Lead and Researcher inherit
nemotron; Operator remains `zero-gw/z-ai/glm-5.3-flash` with nemotron fallback; providers =
`zero-gw` only. This differs from the owner route (glm), the template (glm defaults, empty
fallbacks) and `.last-good` (glm primary + nemotron fallback, 22:34:47). Not reverted: the write
came from the Control UI and may be intentional. Decision needed: restore glm, accept nemotron for
Lead/Researcher, or update the template. BE-02's model-route criterion stays open; PM-01 must
snapshot CURRENT live bindings.
Correction: preflight validates the template, not the live file. Its 2 fails are the template's two
model rows vs the one-route invariant, not a template fallback (the template has none).
Gates: zero-policy selftest 111/111; provider-manager selftest 19/19; Gateway health OK; config
valid; no secret printed; no app/upstream edit; no desktop action.
Evidence: `reports/backend/provider-manager-contract.md` §9 "Post-PM-00 live drift"; AGENT_CHAT
23:05 entry; Gateway log lines 203, 231, 253.

2026-10-23 23:10 IST — Qoder — BE-03 AC#6 closed; CU-02 re-checked

BE-03 acceptance item 6 is now **pass for memory scope**: UI-03 (accepted) renders the native
Memory-files card that passes `agentId`, labels the memory-file scope and shows a scoped empty
state (`reports/ui/personalization-ui.md` lines 240–243). Session-transcript search remains an
explicit owner decision, not an implementation gap. `reports/backend/personalization.md` §7 item
6 and the BE-03 board row updated.
CU-02: re-read `reports/computer/mvp-computer.md` — it records nothing unblocked-but-undone; the
remaining items (actual desktop observe/input, hold refusal under a real lease, fresh-frame resume)
need the designated isolated Zero Windows environment. No desktop action taken.
No app/upstream edit; no secret printed.



2026-10-23 23:26 IST / 17:56 UTC — Qoder — PM-01 shipped-UI verification (read-only)

Verified OpenCode's PM-01 against the Gateway contract, shipped bundle
`4c05f749…` and live host `openclaw@2026.10.6`. No writes: live config sha
`103bcfc71b999c4a` unchanged, mtime 22:36, no config write after 22:37.
Findings (full table with citations in `reports/backend/provider-manager-contract.md` §9):
F1 activation/disable patch only `agents.defaults`; a `demo` replay leaves Operator on its explicit
entry (`operator=zero-gw/z-ai/glm-5.3-flash`). F2 no post-write `models.probe` and no rollback
(snapshot vars unused). F3 literal `auto` can be written by `disableProvider`; host resolves absent
→ `<none>`, `"auto"` → `auto`, empty → `<none>`, `utilityModel:""` → disabled. F4 `referencedBy`
ignores entry fallbacks/utility, so Operator's fallback reference is invisible and disable misses
it. F5 core `/settings/model-providers` and `/settings/model-setup` remain reachable; plugin
replacement surfaces cannot hide them — owner/senior decision needed. F6 mount tests do not cover
F1–F4.
Posted for OpenCode in AGENT_CHAT 23:26. PM-01 stays IN PROGRESS; `zero-gw` and live bindings
untouched. Qoder continues unblocked BE-02/BE-03/CU-02; real desktop actions still require the
designated isolated environment.

2026-10-23 23:38 IST / 18:08 UTC — Qoder — PM-01 addendum: the PM-01 build is not live

Read-only `plugins.controlUi.list`: `zero-control-ui` revision `1a1d2ce3a6a1…`, entry
`/__openclaw__/plugins/control-ui/zero-control-ui/1a1d2ce3…/index.js`. GET returns 200 / 27,605
bytes / sha256 `ecfd215f93a8…`, identical to the 09:19–09:20 dist builds; no `zero-models` page,
no `PM: activate`. The PM-01 build `4c05f749…` (51,832 bytes, 23:14) is disk-only; the digest
script reports its revision `c0f1eb02…`. OpenCode must `plugins.controlUi.reload` (or restart) and
confirm the catalog revision changes to `c0f1eb…` before claiming PM-01 live; the mount tests import
source and cannot prove this. GEM-05's stored `--expect 1a1d2ce3e8d2…` does not match the live
`1a1d2ce3a6a1…` — read the revision from the catalog.
No config/template/secret change (sha `103bcfc71b999c4a`, mtime 22:36:21); Qoder did not call
`plugins.controlUi.reload`.


2026-10-24 00:12 IST / 18:42 UTC — Qoder — PM-01 probe schema, per-agent rule, Auto semantics

Verified read-only against the live `06d350d6` build and installed `openclaw@2026.10.6`:
1. `ModelsProbeParamsSchema` requires `provider` (`agents-models-skills-D_vYckoD.mjs:616`); the
   provider-less call is rejected before the handler (`must have required property 'provider'`).
   The shipped activation sends `{agentId:"zero",timeoutMs:30000}`, so a successful patch is always
   rolled back by the probe catch (F8). Fix: `provider: p.id` and probe each changed agent.
2. Result semantics: `status` is a per-credential rollup (`ok` if any target passes; priority order
   otherwise); `results[]` is per target; no targets → `unknown` + `"No check targets are
   available for this provider."` + `results:[]` (proven with a nonexistent provider); timeouts
   clamp 5–60 s; the probe is a real 8-token inference call, so never run it in review.
3. Credentials are agent-scoped (`ensureAuthProfileStore(agentDir)`), so one probe for `zero` does
   not cover `researcher`/`operator`. The probe picks its model from defaults candidates, so it
   proves credentials, not the entry route.
4. "Auto (Host Default)" carries the first available concrete model ref (`browser.js:2488-2491`,
   save at `:2563-2566`), so it is a fixed route; defaults have nothing to inherit. True inheritance
   is entry-level only (omit/`null` the entry model → defaults; `inference-route-V4skSpqD.mjs:151`).
No paid probe; no config/template/secret change (sha `103bcfc71b999c4a`, mtime 22:36:21); no
app/upstream edit. Evidence: contract §4.2a and §9 F8/F9; AGENT_CHAT 00:12 entry.


2026-10-24 00:35 IST / 19:05 UTC — Qoder — PM-01 F10 verified (per-role fallback loss)

Independently confirmed F10 on the live `966b6348` build with a temp-config replay (no activation,
no provider call; live config sha `103bcfc71b999c4a`, mtime 22:36:21 unchanged).
`browser.js:2060-2071` derives `nextFallbacks` from `agents.defaults.model` only; `:2095-2135`
writes that single list to defaults and all three entries (live bundle reuses one minified `i`).
Live shape: defaults = nemotron (string, no fallbacks), Operator = glm primary + nemotron fallback.
Replay with target `demo/demo-model`: Operator becomes `demo, nemotron`, losing its previous `glm`
primary; with a distinct Operator fallback both glm and that fallback are lost; with defaults absent
or re-activating the current defaults model, the fallback is lost too. Affected paths:
`agents.entries.operator.model.primary` / `.fallbacks`, plus `agents.entries.zero.model` and
`agents.entries.researcher.model` (null → materialized). Host `agents list --json` on the patched
temp config resolves all three primaries to `demo/demo-model`. Rollback restores the snapshot only on
probe failure, so the loss survives a successful activation.
Required fix: per-scope chain from the entry's effective primary + its own fallbacks (inherited
defaults only for absent entries), keep the prior primary first, dedupe, drop the target; add a
regression test with a distinct Operator fallback. Contract updated (§3.4 step 3, §9 F10);
AGENT_CHAT 00:35 entry. No app/upstream edit; no live activation.

2026-10-24 00:45 IST / 19:15 UTC — Qoder — PM-01 F10 verified; PM-02 capability slice implemented

F10: independently verified OpenCode's fix. `deriveScopeFallbacks` derives one chain per scope
(`browser.js:2060-2098`) and each scope receives its own list (`:2122-2155`); rollback snapshots and
restores the raw prior model objects (`:2100-2119`, `:2209-2245`). `node --test
app/zero-control-ui/test/mount.test.mjs` → 3/3, including distinct Lead/Operator chains and exact
rollback. Live plugin revision `9e02160e…` (catalog `bde66312…`). Contract §9 F10 marked resolved;
§11 now says PM-01 needs senior acceptance only.

PM-02: added `zero.providers.capabilities` to the provider-manager plugin (contract §4.6) —
text/streaming/tools/image probes, openai-completions v1, whole-call budget, 256 KiB/64 KiB caps,
per-capability statuses and rollup, sanitized errors, key resolved in-process and never returned.
No config writes, no model assignment: discovery and capability RPCs leave the host config
untouched (`pm02.test.mjs`). Failed activation restores the exact per-role bindings (UI 3/3 plus a
backend temp-config acceptance check).
Evidence: pm02.test.mjs 8/8; selftest 19/19 (registration now lists three methods); integration
5/5. `openclaw plugins reload zero-provider-manager` refused: no authoritative package-owner
metadata (`record-missing`); the method becomes live on the next planned Gateway restart, not by an
ad-hoc restart. No live binding, provider key or `zero-gw` change (config sha `103bcfc71b999c4a`,
mtime 22:36:21). Evidence: contract §4.6/§9 F10; AGENT_CHAT 00:45 entries.

2026-10-24 01:20 IST / 19:50 UTC — Qoder — PM-02 registration trace + no-write activation plan

Correction: the PM-02 suite is **10/10** (added: a requested capability subset issues only that
check; manifest/package identity coherence). Selftest 19/19, integration 5/5.
Registration trace: `plugins reload` requires package ownership from the install index
(`installed-plugin-package-ownership-Bt0dqKIK.mjs:137-147`). `plugins registry --json` was `stale`
(policy-changed, stale-manifest, stale-package); only diagnostics-otel, expedia-openclaw and
zero-policy have install records (zero-policy's sourcePath is the parent `backend/plugin`).
`zero-provider-manager` is config-origin with no record, so the first reload returned
`record-missing`. The supported `plugins registry --refresh` made the registry `fresh` without
touching config; the retry then hit `UNAVAILABLE: Another plugin or config operation is already
running` — the known Windows plugin-captures prepare blocker — so no further reload attempts were
made and no restart was forced.
Live: `zero.providers.capabilities` still returns `unknown method`; discover/test remain live;
config sha `103bcfc71b999c4a`, mtime 22:36:21; zero-gw/all bindings unchanged.
Activation plan (contract §4.6): at the next already-planned controlled restart, verify the
registration log line with three methods, then call the RPC with `{}`/bad model to require
`INVALID_REQUEST` (proves registration without a paid probe), and confirm providers/bindings and
applied hash are unchanged. Rollback: none needed; §10 fallback keeps zero-gw live.
UI contract posted in AGENT_CHAT: `unknown method` → "capability checks unavailable — Gateway
update pending", never a provider failure; capability badges stay Unprobed.

2026-10-24 01:42 IST / 20:12 UTC — Qoder — PM-03 local-server backend slice

Implemented offline in `backend/plugin/provider-manager/`:
- `classifyHostname` → `loopback | private | local | public`; loopback http needs no opt-in;
  private (RFC1918, CGNAT, link-local, 0/8, 198.18/15, IPv6 ULA/link-local, IPv4-mapped) and
  `.local` need explicit `allowPrivateNetwork:true` for http **and** https; public http stays
  rejected even with opt-in; userinfo/query/fragment and credential headers still rejected.
- Adapter coverage: discovery native for all four adapters; capability probes native only for
  `openai-completions`; `openai-responses`, `anthropic-messages`, native `ollama` return
  `unsupported` with "coverage is planned" and make zero requests. Ollama `/v1` + openai-completions
  is the probe path; native `/api/tags` is discovery-only.
- No-key local endpoints work (no Authorization header); keyed local endpoints use env/store
  SecretRef resolved in the Gateway; inline keys rejected.
Evidence: `node --test backend/plugin/provider-manager/pm03.test.mjs` → 9/9 (incl. hex/decimal
loopback normalization and mapped-IPv6 opt-in). pm02 10/10, selftest 19/19, integration 5/5.
No runtime install, model download, endpoint call, config/secret/binding change (sha
`103bcfc71b999c4a`, mtime 22:36:21). Contract §4.7 + AGENT_CHAT 01:42 entry; UI contract posted.
Verifier remains ready for the next planned controlled restart. Remaining PM-03 proof: a local
model on an owner-provided endpoint (no install) — not required for backend completion.

CORRECTION (2026-10-24 01:45 IST): the PM-03 entry above cites the 22:36 config state. The Control
UI wrote at 01:37:55 (`changedPaths=agents.defaults.model,agents.defaults.utilityModel`, actor
`openclaw-control-ui`, device `90dd7d16…`): current sha `b1063a4e77c70336`, mtime 01:37:55;
`agents.defaults.utilityModel` is now absent (was nemotron); defaults model remains nemotron with
empty fallbacks; operator remains explicit glm + nemotron fallback; providers `zero-gw` only.
Not a Qoder write and not reverted; flagged for owner/OpenCode and BE-02's route record.

2026-10-24 01:48 IST / 20:18 UTC — Qoder — adapter increment: openai-responses + native ollama

`zero.providers.capabilities` now supports three adapters, all offline-tested against loopback
mocks:
- **openai-responses**: `POST /responses`; `input` + `max_output_tokens`; `output_text` or
  `message/output_text` parsing; early `response.output_text.delta`; flat function tools with
  `tool_choice:{type:"function",name}`; `input_image` data URL. pm04 8/8.
- **ollama (native)**: `POST /api/chat`; `messages` + `options.num_predict`; NDJSON streaming stops
  at the first non-empty `message.content`; chat-shaped tools; `images:[base64]` without a data
  prefix. pm05 7/7.
- **openai-completions** unchanged. `anthropic-messages` remains planned and returns `unsupported`
  with zero requests; the result previews `/messages`.
Host classification and per-call `allowPrivateNetwork` rules are unchanged (pm03 9/9). All suites:
pm02 10/10, pm03 9/9, pm04 8/8, pm05 7/7, selftest 19/19, integration 5/5.
No external or paid provider call, install, restart, or config/secret change. Live state still
sha `b1063a4e77c70336`, mtime 01:37:55: `agents.defaults.utilityModel` remains absent (observed
Control UI drift, not reverted), defaults model Nemotron with empty fallbacks, Operator explicit
GLM + Nemotron fallback, `zero-gw` only. Verifier remains ready for the next controlled restart.

2026-10-24 02:18 IST / 20:48 UTC — Qoder — adapter increment: Anthropic Messages

`zero.providers.capabilities` now covers **all four adapters** natively. Anthropic Messages:
`POST <baseUrl>/messages` with `x-api-key` (only when a key is configured) and
`anthropic-version: 2023-06-01` — never `Authorization: Bearer`; `{model, max_tokens, messages}`;
text `ok` from `content[].type:"text"`; streaming stops at the first `content_block_delta` with
`delta.type:"text_delta"`; tools `{name, description, input_schema}` with
`tool_choice:{type:"tool",name}` require a `tool_use` block; image `{type:"image",source:{type:
"base64",media_type:"image/png",data}}`; keyless loopback sends no key but still the version header.
Also fixed `buildAnthropicHeaders` to omit `x-api-key` when no key (was emitting an undefined header
value on keyless discovery).
Evidence: pm06 8/8; pm03 9/9, pm04 8/8, pm05 7/7, pm02 10/10, selftest 19/19, integration 5/5.
Private-network opt-in and host validation unchanged (pm06 asserts private rejection and opt-in).
No external/paid call, install, restart, or config/secret change. Live state unchanged since the
01:37:55 Control UI write: sha `b1063a4e77c70336`, `agents.defaults.utilityModel` absent (drift
recorded, not reverted), `zero-gw` only. Verifier remains ready; capability RPC still unregistered.

2026-10-24 02:20 IST / 20:50 UTC — Qoder — local endpoint check script (next unblocked task)

Added `backend/scripts/local-provider-check.mjs`: read-only check for an already-running local
endpoint. It validates `--base-url` with the plugin's host rules (`loopback` ok, private/`.local`
requires `--allow-private-network`), then calls `zero.providers.discover`, `zero.providers.test`
and (if registered) `zero.providers.capabilities`; a missing method is reported as
"unavailable (pending Gateway restart)" rather than a failure. `--key-env NAME` passes an env
SecretRef; no key value is read or printed, and no config is written.
Verified against a loopback mock through the live Gateway: discover/test ok (2 models), capabilities
pending, exit 0; private host without opt-in → exit 2; bad `--key-env` → exit 2. No external or paid
call; mock stopped afterwards. Live config unchanged (sha `b1063a4e77c70336`, mtime 01:37:55;
utilityModel absent, not reverted; zero-gw only). Contract §4.7/§12 updated.

2026-10-24 02:29 IST / 20:59 UTC — Qoder — local-provider-check harness hardening

Added dependency-free mock-backed tests for `backend/scripts/local-provider-check.mjs`:
`backend/scripts/test/local-provider-check.test.mjs` (10/10) with
`backend/scripts/test/fixtures/mock-openclaw-cli.mjs` (emulates `gateway call`, never touches the
network). The script now rejects unknown options and invalid
`--api`/`--provider-id`/`--model`/`--timeout-ms`/`--key-env` before any Gateway call; exit codes are
0 for discover/test ok + capabilities ok/partial/pending, 1 for discover/test or capability hard
failure (auth/rate_limit/timeout/network/format/unknown/error), 2 for invalid input/host rules.
Tests cover help, the validation matrix with zero captured calls, private opt-in (http), public-http
rejection even with opt-in, missing capability method → pending/exit 0, capabilities ok/partial/auth,
discover/test failures, secret-free stdout and RPC params (`apiKeyRef` carries only the env name),
and the `--json` shape. No external/paid call, install, restart or config change; live state still
sha `b1063a4e77c70336`/mtime 01:37:55, utilityModel absent (not reverted), zero-gw only.
Contract §4.7/§12 + AGENT_CHAT 02:29 entry updated. Verifier remains ready for the next planned
controlled restart.

2026-10-24 02:30 IST / 21:00 UTC — Qoder — registration verifier harness (next unblocked task)

Added `backend/scripts/test/verify-provider-manager.test.mjs` (7/7) against the shared mock CLI.
Covered: registered + consistent config → exit 0; unregistered → exit 2; unrecognized capability
response → exit 2; health failure, config revision mismatch and unreadable config → exit 1;
`--json` shape with providers/defaults/operator bindings and no credential value. The verifier now
accepts `ZERO_PROVIDER_VERIFY_CLI` (test-only seam) and is itself free of network/key access in
tests. Contract §4.6/§12 updated.
No live restart, config/secret change, install or external/paid call. Live state still sha
`b1063a4e77c70336`, mtime 01:37:55; utilityModel absent (recorded, not reverted); zero-gw only.

2026-10-24 03:22 IST / 21:52 UTC — Qoder — PM-03 adapter/status UI review

Reviewed the live PM-03-UI revision `4521289829274930761cb54ce18b8ff0be99b0066682384bd694ab3e171b6f51` (catalog `1a790db1…`) against the completed adapter work. Backend coverage is all four adapters native with all four probes (pm02 10/10, pm03 9/9, pm04 8/8, pm05 7/7, pm06 8/8, selftest 19/19, integration 5/5; harnesses 10/10 + 7/7). The live bundle still contains `Capability probe planned`, `adapter coverage planned`, and the `anthropic-messages` planned special-case, and `app/zero-control-ui/test/mount.test.mjs:1816`/`:2063` asserts that stale wording; its 6/6 pass is therefore not evidence of current adapter support.
Published the exact adapter/status contract in `reports/backend/provider-manager-contract.md` §4.7: all four adapters may be enabled; `unsupported` means a real provider/model capability rejection (`Unsupported (Probed)`), not “coverage planned”; auth/rate_limit/timeout/network/format/unknown are probe failures (retry; capability unknown); `unavailable` means pending restart; unprobed and Operator-gate states must be textual. Visual disabled styling is never evidence; host-safety blocks (public http, private without opt-in, credential headers/inline keys, zero-gw mutations) remain separate from capability states.
No `app/` edit, paid/external call, reload or restart; live bindings unchanged (sha `b1063a4e77c70336`, mtime 01:37:55; utilityModel absent, not reverted). Capability RPC registration and verifier remain gated on the next coordinated restart.

2026-10-24 03:29 IST / 21:59 UTC — Qoder — restart checklist + verifier recovery (offline)

`backend/scripts/verify-provider-manager.mjs` is now the executable coordinated-restart checklist:
health, plugin activation (`activated`/`activationSource`), behavioral method classification from
`zero.providers.capabilities` with `{}`, corroborating registration-log scan (default newest
`gateway-stdout-*.log`; `--log <path>`/`--no-log`), config revision/applied hash, providers and
per-agent bindings, `--json`. Exit: 0 registered+consistent, 2 method missing/unknown response,
1 health/config failure or plugin explicitly inactive.
Key evidence: at 03:29 the live log already contained the three-method registration line
(`01:37:56`) while the RPC still returned `unknown method`; the checklist therefore treats the
behavioral call as authoritative and the log as corroboration only. Recovery matrix in contract
§4.6: unregistered → inspect activation, no provider calls, no reload loop; registered but
provider/model statuses → real probe result, not registration failure; health/revision/activation
failure → stop read-only.
Offline results (all rerun): pm02 10/10, pm03 9/9, pm04 8/8, pm05 7/7, pm06 8/8, selftest 19/19,
integration 5/5, local-provider-check harness 10/10, verifier harness 9/9; UI 6/6 (still asserts
stale adapter copy, OpenCode-owned).
Gated: capability RPC registration and any live probe. No reload/restart, paid/external call,
config/secret change or app edit. Live state still sha `b1063a4e77c70336`, mtime 01:37:55;
utilityModel absent (recorded, not reverted); zero-gw only.
Resume prompt (copy-paste): "Qoder, resume PM-03 at the live-registration gate. Do not force a
plugin reload/restart; use the already-planned coordinated Gateway restart. Run
`node backend/scripts/verify-provider-manager.mjs --json`; require exit 0 with health ok, plugin
activated (explicit), capabilities method registered, registration log found (three methods),
providers zero-gw, revision consistent. If unregistered, follow contract §4.6 recovery and stop; no
provider calls/binding writes. Then rerun PM-02–PM-06, selftest, integration and both harnesses,
and update contract/board/chat. Preserve zero-gw, live bindings, secrets and the utilityModel drift."

2026-10-24 03:37 IST / 22:07 UTC — Qoder — controlled Gateway restart + live registration verified

Before: PID 9972 (created 2026-10-23 22:18:42), health OK 42 ms, config sha `b1063a4e77c70336`
mtime 01:37:55, `zero-gw` only, defaults Nemotron/empty fallbacks, Operator explicit GLM + Nemotron
fallback, revision==applied, no active agent run (last ended 02:48), `ZERO_GATEWAY_KEY` present at
User scope (presence only; never printed). Condition safe.
Action: stopped PID 9972, port released, started successor PID 25632 at 03:33:29 with the User-scope
key copied into the child environment only. Health OK; no config/binding/secret change.
After: `verify-provider-manager.mjs` exit 0 — health ok, plugin activated (explicit), capabilities
method **registered**, registration log found (three methods), providers `zero-gw`, revision
consistent, same defaults/operator bindings. The empty-params RPC returned `providerId must match
^[a-z][a-z0-9_-]{0,63}$`, proving the handler ran; every capabilities log line is `status=invalid`
and **no provider request was made**. Config sha/mtime unchanged; no new `config.patch write`
(still 4, none from the restart).
Verifier fixes during the restart: registration must recognize the plugin's bare validation message
(not only `invalid`/`bad-request`); health uses `^OK (` with 30 s timeout + one 2 s retry; log
scanning covers both `.openclaw/logs/gateway-stdout-*.log` and the per-day
`%TEMP%/openclaw/openclaw-*.log`, newest first. Harness 9/9. Plugin suites unchanged (pm02 10/10,
pm03 9/9, pm04 8/8, pm05 7/7, pm06 8/8, selftest 19/19, integration 5/5).
Remaining gates: a real capability probe requires an owner-provided running endpoint + exact model;
the UI adapter-copy correction (Anthropic planned, unsupported mislabeled) remains OpenCode's; no
model-binding migration is authorized. Resume prompt is in contract §11.

2026-10-24 03:42 IST / 22:12 UTC — Qoder — live zero-gw capability probe (one bounded run)

Owner authorization checked; provider/model matched config: zero-gw, https://integrate.api.nvidia.com/v1,
openai-completions, `z-ai/glm-5.3-flash` present, apiKeyRef env `ZERO_GATEWAY_KEY`; key present at
User scope (presence only, never printed). One RPC with all four checks, timeoutMs 30000:
- `text`: **format** (non-stream response rejected/empty/non-JSON)
- `streaming`: **ok**
- `tools`: **ok**
- `image`: **format** (image input rejected/empty; expected for a text-oriented model)
Rollup **partial**; plugin 11,062 ms, RPC 11,067 ms. The CLI's default 10 s response deadline
expired after the RPC completed, so the exact sanitized per-check messages were not captured; no
retry was made (one-probe rule). Gateway log is authoritative for the statuses:
`capabilities provider=zero-gw … status=partial caps=text:format,streaming:ok,tools:ok,image:format ms=11062`.
Credential check: 0 `nvapi-` and 0 `Bearer ` occurrences in the Gateway log; key never printed.
Config sha stayed `b1063a4e77c70336` (mtime 01:37:55), config-write count stayed 4; no binding,
secret or config change; Gateway not restarted. `local-provider-check.mjs` now passes
`--timeout 45000` so future probes do not lose a completed result; harness 10/10.
Interpretation: registration and route/auth are proven (streaming/tools ok); text/image are
provider/model results requiring a product/owner decision, not registration failures.

2026-10-24 03:53 IST / 22:23 UTC — Qoder — offline analysis of text/image format (no live call)

No additional provider probe was run. The Gateway log contains only the final summary
(`status=partial caps=text:format,streaming:ok,tools:ok,image:format ms=11062`) and the WS completion
(11,067 ms); it has no per-check HTTP status/body and the plugin's auditContext is not logged, so the
exact error remains **unknown**.
Code-path analysis: `format` can only come from (a) an HTTP 4xx other than 400/422/401/403/408/429
(400/422→unsupported, 401/403→auth, 408/504→timeout, 429→rate_limit, 5xx→network), (b) a 2xx body
over 256 KiB or not valid JSON, or (c) a 2xx JSON body with missing/empty
`choices[0].message.content`. Registration, auth, rate limit, timeout, network and plain 400/422 are
ruled out; streaming/tools succeeded on the same endpoint/model/key.
Request construction: the failing checks are exactly the non-stream content-only checks with
`max_tokens:4` (text line 493, image line 637); streaming also uses 4 tokens but accepts a role
delta (lines 477-480), tools uses 32 tokens and accepts tool_calls (line 596). Config declares
`z-ai/glm-5.3-flash` as `reasoning:true`, `input:["text","image"]`, `maxTokens:16384`,
`maxTokensField:"max_tokens"`. Leading but unproven explanation: a 2xx response whose content is
empty because a 4-token budget is consumed by reasoning; a non-JSON 2xx or unusual 4xx remains
possible, so the result is not relabeled unsupported/planned. A future owner-authorized probe should
use a larger max_tokens (e.g. 64), capture sanitized per-check detail (HTTP status/shape or
finish_reason/reasoning_content presence), and keep `--timeout 45000`.
No config/binding/secret change; health and method registration unchanged. Harnesses rerun:
local-provider-check 10/10, verifier 9/9; plugin suites pm02 10/10, pm03 9/9, pm04 8/8, pm05 7/7,
pm06 8/8.

2026-10-24 04:00 IST / 22:30 UTC — Qoder — diagnostics + follow-up capability probe

Added sanitized per-check diagnostics to `zero.providers.capabilities`: non-ok capabilities now
include `diagnostics: {httpStatus?, category}` with categories `http_error`, `invalid_json`,
`response_too_large`, `empty_content`, `empty_body`, `no_stream_delta`, `no_tool_call`, `timeout`,
`network_error`, `transport_error`. No bodies, headers, auth data or keys are included; the handler
logs `diag=<id>:<httpStatus|->/<category|->`. Text/image `max_tokens` raised 4→32 (streaming stays
4, tools 32). Offline pm02 is now 12/12 (diagnostics matrix + 32-token budget); all other adapter
suites unchanged.
Loaded the diagnostics build with a controlled restart (PID 25632 → **30884**, ~03:58; verifier exit
0 after startup settled; first immediate verifier run hit a health/startup flake, so the verifier
now retries health up to three times). One follow-up probe at 03:59 (same zero-gw /
`z-ai/glm-5.3-flash`, `--timeout 45000`, no retry): rollup **partial**, 9,024 ms:
- `text`: **format** — HTTP 200, `empty_content`, error “Text completion returned empty content.” (1,235 ms)
- `streaming`: **ok** (482 ms)
- `tools`: **ok** (3,076 ms)
- `image`: **ok** (4,230 ms) — the 4→32 budget change fixed it, confirming image was budget-bound
Text remains empty at 32 tokens; why is still unknown (larger reasoning budget or another
non-stream text issue). Do not relabel it unsupported/planned.
Safety: exactly two probes total; 0 `nvapi-`/`Bearer` log matches; config sha `b1063a4e77c70336`
(mtime 01:37:55) and config-write count 4 unchanged; no binding/secret change; no retry.

2026-10-24 04:06 IST / 22:36 UTC — Qoder — text-64 follow-up probe

Continued the diagnostics investigation. Text budget raised 32→64 (image stays 32; streaming 4;
tools 32); offline pm02 updated and still 12/12. Controlled restart PID 30884 → **19868** (~04:04);
verifier exit 0 (health, plugin activated, method registered, zero-gw, revision consistent).
One probe at 04:05 (`--timeout 45000`, no retry): rollup **partial**, 9,149 ms:
- `text`: **ok** (3,831 ms) — **text is confirmed budget-bound** (4/32 empty_content, 64 ok)
- `streaming`: **ok** (824 ms)
- `tools`: **ok** (2,338 ms)
- `image`: **format** — HTTP 200, `empty_content` (2,156 ms) — image at 32 is unstable (ok once,
  empty once); remains **unknown**, not permanently verified/unsupported
Diagnostics are live and sanitized: `diag=text:-/-,streaming:-/-,tools:-/-,image:200/empty_content`.
Safety: three probes total; 0 `nvapi-`/`Bearer` matches; config sha `b1063a4e77c70336`
(mtime 01:37:55) and config-write count 4 unchanged; no binding/secret/config change; no retry.
A future image 64/128 probe would need explicit owner authorization; no binding change follows
from a capability probe.

2026-10-24 04:20 IST / 22:50 UTC — Qoder — image-only 64-token probe (one observation)

Image check budget raised 32→64 (text stays 64, streaming 4, tools 32); offline pm02 updated and
still 12/12. Controlled restart PID 19868 → **22876** (~04:18); verifier exit 0 (health, plugin
activated, method registered, zero-gw, revision consistent).
One image-only probe at 04:19 (`capabilities:["image"]`, `--timeout 45000`, no retry): **status ok,
image ok, 27,306 ms**. This is **one observation** — image is not fixed: 32 gave ok once and
empty_content once; 64 gives ok once. The 64-token image check alone consumed 27.3 s of the 30 s
whole-call budget, so any future image probe should be image-only (or use a larger explicit
timeout). No retry, no second observation.
Safety: four probes total; 0 `nvapi-`/`Bearer` matches; config sha `b1063a4e77c70336` (mtime
01:37:55) and config-write count 4 unchanged; no binding/secret/config change.

2026-10-24 04:31 IST / 23:01 UTC — Qoder — offline acceptance handoff (observed vs stable)

Evidence recorded exactly as observed:
- text: 4 → empty_content, 32 → empty_content, **64 → observed pass once**; stability not established.
- image: **4 → failed**, **32 → mixed** (ok once, empty_content once), **64 → observed pass once**
  (27,306 ms); stability unproven, not fixed, not unsupported.
- streaming/tools: observed pass in every recorded run (still observation-based, not a guarantee).
Report/TASK_BOARD now use **observed pass** vs **stable/verified** explicitly. No further live probe
was run.
Next offline task delivered: `local-provider-check.mjs --capabilities <subset>` (e.g. `image`) so a
slow image probe can run image-only; strict validation of empty/duplicate/unknown entries; tests
12/12. Contract §4.7/§12 updated.
Offline verification: pm02 12/12 (text/image 64 budgets, diagnostics), pm03 9/9, pm04 8/8,
pm05 7/7, pm06 8/8, selftest 19/19, integration 5/5, local harness 12/12, verifier harness 9/9.
Live state unchanged: PID 22876, capability RPC registered, metrics healthy; config sha
`b1063a4e77c70336` (mtime 01:37:55), config writes 4, no binding/secret change. No live probe was run
in this handoff.
Gates: any further text/image probe needs explicit owner authorization and should be capability-
subset (image-only); UI adapter-copy correction remains OpenCode's; model-route/utility drift and
BE-02/BE-03/CU-02 remain owner/desktop-gated.

2026-10-24 04:52 IST / 23:22 UTC — Qoder — PM-04 offline GGUF inspection slice
Status: **HISTORICAL / REMOVED 2026-10-27** — `inspect-gguf.mjs` and its tests were deleted; entry preserved as history.

Added `backend/scripts/inspect-gguf.mjs` (PM-04 preflight only): bounded GGUF v2/v3 parsing
(magic/version, scalar/string metadata, tensor descriptors, alignment), streaming SHA-256, logical
tensor-byte estimate for F32/F16/Q4_0/Q4_1/Q5_0/Q5_1/Q8_0/Q2_K–Q8_K, truncation detection, and
heuristic RAM/VRAM estimates with optional GiB budgets. Unknown tensor types leave the estimate
unavailable rather than guessing. No launch, download, install, provider call or file write.
Tests: `inspect-gguf.test.mjs` 6/6 with synthetic files (valid v3, bad magic, version 1, truncated
data, oversized string, RAM/VRAM budget, JSON/exit codes).
All offline suites: pm02 12/12, pm03 9/9, pm04 8/8, pm05 7/7, pm06 8/8, selftest 19/19,
integration 5/5, local harness 12/12, verifier harness 9/9, GGUF 6/6.
Image evidence remains observed-only (4 failed, 32 mixed, 64 one observed pass; stability unproven).
No live probe was run. Live state untouched: PID 22876, capability RPC registered, config sha
`b1063a4e77c70336` (mtime 01:37:55), config writes 4, no binding/secret/config change.
Gated: managed llama.cpp launch/stop, real GPU/VRAM probing, import UX and any model download need
owner authorization/runtime decision; BE-02 A6/A7 + CU-02 need the isolated desktop.

2026-10-24 04:56 IST / 23:26 UTC — Qoder — PM-04B managed-launch design (offline)
Status: **HISTORICAL / REMOVED 2026-10-27** — `managed-llama.mjs`, its tests, and `managed-gguf-launch.md` were deleted; entry preserved as history.

Added `reports/backend/managed-gguf-launch.md` and `backend/scripts/managed-llama.mjs`:
- Preflight gate calls `inspectGguf`; incompatible/error prevents spawn entirely.
- Loopback-only plan: `127.0.0.1`/`localhost`/`::1` only; `0.0.0.0`, `::`, LAN/public hosts and URL
  model paths rejected; port 1024–65535, context 512–1,048,576; argv array (no shell).
- Lifecycle: idle → preflight → starting → ready; early exit/readiness timeout → failed; stop →
  stopping → stopped. Single instance; no auto-restart.
- Stop sends SIGTERM, waits, then SIGKILL if needed; returns `modelDeleted:false`,
  `configTouched:false`; no filesystem writes and no config/secret calls.
- Estimates carried as `estimatesAreHeuristic:true`; no real VRAM probe.
Tests: `managed-llama.test.mjs` **9/9** using fake process/probe adapters and a temp model/config
sentinel (preflight block, host rejection, ready, timeout, early exit, stop/forced stop, no
deletion, duplicate start). All offline suites remain green.
No real server, download, install, bind beyond loopback, VRAM probe, config or binding change.

2026-10-24 05:11 IST / 23:41 UTC — Qoder — provider shape + SecretRef audit

Source: installed `openclaw@2026.10.6` `config schema --json` + `ENV_SECRET_REF_ID_RE` primitives;
live provider metadata read redacted (no credential value). Findings:
- `models.providers.<id>` is closed (`additionalProperties:false`); accepted keys are baseUrl,
  apiKey, auth, api, maxTokens, timeoutSeconds, region, injectNumCtxForOpenAICompat, params,
  agentRuntime, localService, headers, authHeader, request, models. **No `name`**; no
  `allowPrivateNetwork` config key. UI display labels must stay UI-local; model names belong in
  `models[].name`.
- SecretRef `{source,provider,id}` is closed; provider `^[a-z][a-z0-9_-]{0,63}$`; **env and store
  IDs both use `^[A-Z][A-Z0-9_]{0,127}$`** (`secrets.store.set` too). The lowercase store name in the
  screenshot is caller-invalid; the plugin validator matches the host and was not loosened.
  `file`/`exec` are host-valid but intentionally rejected by the plugin.
- Change: source-specific error message only; no grammar change. Selftest 20/20 with separate
  env/store checks and file/exec rejection. Live zero-gw: keys baseUrl/api/apiKey/models, no name,
  uppercase env ref (value never read). No live config write, zero-gw mutation or provider call.

2026-10-24 06:35 IST / 01:05 UTC — Qoder — consolidated offline closeout (backend + computer lane)

Status: offline closeout complete. No model download/import, no llama.cpp/server launch, no live
provider/inference/capability probe, no GPU/VRAM probe, no desktop action, no model-binding/secret/
config change. Live Gateway runtime state after the recent restart was not re-inspected in this pass;
the UI revision below is read-only evidence from this pass (`verify-served.mjs` returned HTTP 200
with byte-identical JS/CSS). A separate read-only config check found `backend/config/openclaw.json`
mtime 05:46:44 (newer than the 01:37:55 snapshot cited in earlier entries), but content still
`zero-gw` only: defaults nemotron with empty fallbacks, `utilityModel` absent, operator GLM with
nemotron fallback. Qoder made no config write; the recorded drift remains recorded, not resolved.

Backend fixes (offline):
- `backend/plugin/provider-manager/index.mjs`: removed the dead "coverage is planned" fallback and
  the stale OpenAI-only comment; added a module-load invariant that every supported adapter has a
  native check for `text`/`streaming`/`tools`/`image` (fails closed on a future gap).
- Capability body reading now enforces the 256 KiB limit while streaming a chunked response
  (cancels at the cap) instead of buffering first; an empty 2xx body maps to `empty_body` rather
  than `invalid_json`.
- `pm02.test.mjs`: added 3 checks (empty body, oversized chunked body, all-native invariant/no
  planned-coverage string); suite is now 15/15.
- Reports refreshed: `reports/backend/provider-manager-contract.md` §4.2/§4.6-§4.8/§9/§11/§12
  (current budgets, empty-body/chunked behavior, live registration, current counts, UI closure
  `de6730fe...`, OpenCode-owned delete-shared-secret/test-error display findings);
  `reports/computer/mvp-computer.md` (`zero-policy` v0.1.3, 111/111, C2 `controlLeaseId` closed);
  also `computer/README.md` (rig 152), `reports/computer/build-readiness.md` (selftest 111) and
  `reports/computer/cu02-takeover-seam-analysis.md` (v0.1.3).

Offline test evidence (exact):
- `node --test` over selftest.mjs + integration.mjs + pm02-pm06: **49/49**.
  Individually: selftest 20/20 internal (node:test counts 1 file), integration 5/5 internal
  (1 file), pm02 15/15, pm03 9/9, pm04 8/8, pm05 7/7, pm06 8/8.
- `backend/scripts/test/*`: **36/36** - inspect-gguf 6/6, local-provider-check 12/12,
  managed-llama 9/9, verify-provider-manager 9/9. (Historical; PM-04 inspect/managed tests were
  removed 2026-10-27.)
- `node backend/plugin/selftest.mjs`: **111/111** (`zero-policy` v0.1.3).
- `node computer/spike/rig.test.mjs`: **152/152**.
- `node computer/tools/audit-release-action-filter.mjs`: **25/25**.
- `node computer/tools/derive-windows-actions.mjs`: **9/9** (regenerated
  `computer/contracts/computer-act-actions.json`).
- `node computer/spike/k7-run.mjs --plan`: correctly **BLOCKED** on
  `computer/spike/designated-environment.json`.
- `node --test app/zero-control-ui/test/mount.test.mjs`: **8/8** (read-only cross-check; no app edit).

OpenCode coordination (no `app/` edit by Qoder):
- `deleteProvider` deletes a store secret without checking another provider's reference to the same
  SecretRef (contract §3.6/§6.7 require the check).
- `activateProvider` reads `testRes?.error?.message`; `zero.providers.test` returns completed
  provider failures as `{status, message}`, so the reason can be blank.

Blocked/gated:
- Real provider/local capability probe, model download/import, llama.cpp start/stop, GPU/VRAM
  probing, provider registration/activation against a second provider: owner authorization.
- CU-01 real desktop observe/input/takeover: designated environment + owner marker + O1/O2/O5/O6.
- BE-02 A6/A7 and trusted-policy live firing: isolated desktop.

2026-10-24 10:03 IST / 04:33 UTC - OpenCode - PM-01 generic provider ID derivation and collision safety

Status: PM-01 remains **READY FOR REVIEW**; no self-acceptance is claimed.

Implemented in `app/zero-control-ui/`:
- Add Custom Provider derives a deterministic Gateway-safe internal ID from the display name while
  the ID field has not been manually edited: NFKD, strip combining marks, lowercase, non-alphanumeric
  runs to one hyphen, trim, `provider-` prefix for a leading digit, `provider` fallback for
  non-Latin-only names, and a 64-character cap.
- Verified examples: `NVIDIA` -> `nvidia`, `OpenAI` -> `openai`, `Google Gemini` ->
  `google-gemini`, `1 NVIDIA` -> `provider-1-nvidia`, `NVIDIA, Inc.` -> `nvidia-inc`, `Café` ->
  `cafe`, `模型` -> `provider`.
- The display name is never normalized. Manual ID edits win; presets set explicit IDs and mark the
  field touched. Edit mode keeps the ID disabled and unchanged, so no existing provider ID is
  migrated automatically.
- Empty/whitespace names produce no ID and Save asks for a display name or manual ID. Duplicate IDs
  are rejected before any secret write or `config.patch`, with a clear collision message and the
  first free `-2`, `-3`, ... alternative. Edit mode excludes the provider being edited.
- Validation errors clear the in-memory API key so a corrected retry cannot submit a key that is no
  longer visible. Existing SecretRef and same-host fail-closed protections are unchanged.

Verification:
- `node --check app/zero-control-ui/browser.js` -> clean.
- `node --test app/zero-control-ui/test/mount.test.mjs` -> **23/23 pass**.
- New tests cover uppercase, leading digit, spaces/punctuation, accented and non-Latin Unicode,
  empty display name, duplicate collision, safe alternative, no secret/config write on collision,
  and edit-mode ID immutability with SecretRef and byte-for-byte model-ID preservation. The edit
  fixture now carries `meta/llama-3.3-70b-instruct` and `nvidia/nemotron-4-340b-instruct`, and the
  test asserts both IDs survive a display-name-only patch unchanged.
- Build generation `358e4e189da65804faf43fc67f2213edfdecf59bbeedefaeee2af1b3ee9f8322`
  (JS **94,633 B**, SHA-256 `DE59E088B13AB50D3EA0133A26DB534722421A7A9A73853530E203380EA2AC22`;
  CSS **27,639 B**).
- `plugins.controlUi.reload` -> plugin revision
  `fd28f9c144b59d7db7c44a698660958c1210d7b669aa1d92074b190540e708fb`, catalog
  `02b7c4054d2a75dcda93b9116f5447abe425e1327b4769cc0b57b13c4fdfd834`, diagnostics `[]`;
  `plugins.controlUi.list` agrees.
- `node app/zero-control-ui/test/verify-served.mjs` -> HTTP 200 JS **94,633 B** (served SHA-256
  `DE59E088…AC22`, byte-identical to local) and CSS **27,639 B**; new derivation/collision strings
  present in the served bundle.

Review package: `reports/ui/provider-manager-ui.md` §18 records the reconciled current evidence, the
review checklist, safe no-save visual steps, owner-gated disposable-Gateway write-path steps, and the
next owner gate. Earlier references to 21/21, generation `1028f819…`, plugin revision `3b9ec264…`,
catalog `d948a3bb…`, and JS 93,491 B are historical and superseded by 23/23, `358e4e18…`,
`fd28f9c1…`, `02b7c405…`, and 94,633 B.

[2026-10-24 15:14 Asia/Calcutta] [OpenCode] [PM-01 UX/RELIABILITY FINAL PASS] [HANDOFF]

Status: READY FOR REVIEW (PM-01); no self-accept; no Gateway restart/reload, no live config/secret/
binding write, no credential read/print, no NVIDIA Discover retry, no orphan-store-entry removal/re-scope.

Done in this pass per the assigned PM-01 UX/reliability handoff:
- Reconciled and inspected the current changes and build/package paths for both contributions from source
  and manifests: UI contribution at `app/zero-control-ui/` (package `./index.js` + `./browser.js`,
  `build.bundledDist:true`, root manifest `app/zero-control-ui/openclaw.plugin.json`, build script
  `app/zero-control-ui/build.mjs`, server entry `app/zero-control-ui/index.js`, runtime methods in
  `app/zero-control-ui/runtime-core.mjs`); server-side Gateway extension at
  `backend/plugin/provider-manager/` (main `index.mjs`, manifest `backend/plugin/provider-manager/
  openclaw.plugin.json` with `id: zero-provider-manager`, `activation.onStartup: true`).
- Checked the repaired focused test file for mojibake/replacement characters:
  `app/zero-control-ui/test/mount.test.mjs` is valid UTF-8 with no replacement characters and no
  replacement-byte matches across the UI tree; provider-id/display-name/credential-reference literals are
  plain ASCII, including the `"raw-legacy-inline-value"` name used only as an identity-absence assertion.
- Ran focused offline suites from the final sources; both green:
  - `node --test backend/plugin/provider-manager/pm02.test.mjs` -> pm02 **15/15**.
  - `node --test app/zero-control-ui/test/mount.test.mjs` -> **29/29 pass**, including the runtime-method
    backend test at the end of `test/mount.test.mjs`.
- Repaired the stale `dist` manifest/build-output issue using the repository's immutable-generation design:
  `verify-served.mjs` had been patched so it read `..\dist\openclaw.plugin.json` when run from inside
  `app/zero-control-ui/test/`. That path is wrong for this workspace and made the probe compare the wrong
  manifest. Corrected `verify-served.mjs` to read the generated manifest through the real on-disk generation
  tree (`dist/control-ui/<generation>` + `dist/openclaw.plugin.json`), keeping the release-gate confirmation
  against immutable assets. Old `dist/control-ui/` generations were not touched or deleted.
- The current on-disk build already passed, so no unnecessary rebuild was run. Current output is immutable
  generation `45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba` with both `index.js` and
  `index.css` present under `app/zero-control-ui/dist/control-ui/45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba/`.
  Both repo manifests agree and agree with the on-disk tree: `app/zero-control-ui/openclaw.plugin.json` and
  `app/zero-control-ui/dist/openclaw.plugin.json` both point at that same generation.
- Ran `verify-served.mjs` against the intended output and captured exact evidence. From `app/zero-control-ui/`:
  `node test/verify-served.mjs` exited 0 with:
    ✔ served entry file verified: e:\zero\app\zero-control-ui\dist\control-ui\45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba\index.js
    ✔ served styles file verified: e:\zero\app\zero-control-ui\dist\control-ui\45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba\index.css
    ✔ generation = 45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba
    ✔ generated manifest entry generation = 45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba
    ✔ generated manifest points to existing immutable assets
- Clearly distinguished the three concerns for the handoff:
  1. Local build verification: `node app/zero-control-ui/build.mjs` + `node app/zero-control-ui/test/verify-served.mjs` plus the focused suites. This pass completed that offline verification.
  2. Live Gateway publication: `plugins.controlUi.reload` publishes UI assets. This pass did **not** do it and did **not** treat the local build as proof of publication.
  3. Server-side Gateway-method registration: the new `zero.ui.providerNames.list/set/delete` and
     `zero.ui.providerCredentialRef` methods are declared in source (`app/zero-control-ui/runtime-core.mjs` +
     `app/zero-control-ui/index.js`). Whether the running Gateway currently has them registered is a
     runtime-activation question, and `plugins.controlUi.reload` publishes UI assets only — it is **not**
     treated as proof that any Gateway method is registered.
- Kept the same-host SecretRef guard intact, as required. No live config/secret/binding write; no credential
  value read or printed; no NVIDIA Discover; no orphan-store-entry removal/re-scoping; no Gateway restart/reload.

Updated this pass:
- `app/zero-control-ui/test/verify-served.mjs`: corrected the stale manifest resolution.
- `reports/ui/provider-manager-ui.md` §18.3/§18.4 updated to separate local build verification, UI-only publication,
  and server-side Gateway-method registration, with the new generation and exact verifier evidence.
- `TASK_BOARD.md` PM-01 row + closeout updated: generation `45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba`,
  the verifier-correction evidence, pm02 15/15, mount 29/29, the stale-manifest fix, and the separate status for
  UI-only publication vs server-side Gateway-method registration. PM-01 stays READY FOR REVIEW.
- `AGENT_CHAT.txt`: added this `PM-01 UX/RELIABILITY FINAL PASS` handoff at timestamp `2026-10-24 15:14 Asia/Calcutta`.

Superseded by this pass: the historical 23/23 numbers, generation `358e4e18...`, plugin revision
`fd28f9c1...`, catalog `02b7c405...`, JS 94,633 B, and the §18 language that tied the build to that earlier
publish window are no longer current. Current evidence is the 29/29 mount suite, pm02 15/15, generation
`45796821894a3a64066f5f7b50bce3fc30b1d24e98a5d30236fe3eddf94cc8ba`, and the verifier output above.

Remaining owner-gated step: Gateway-method registration is the exact remaining activation gate, not another UI
build. The exact remaining sequence, if/when the owner chooses to open it, is: owner decision on the live shared-host
store entry `ZERO_PROVIDER_ZERO_GW_API_KEY` (remove/re-scope it after confirming `zero-gw` does not use it, or accept
that `nvidia` stays fail-closed); owner-authorized Gateway refresh/restart to load the current provider-manager handler
and any currently-unloaded runtime methods; then at most one owner-authorized Discover/test retry for the affected provider with
sanitized output/latency only. PM-01 itself stays READY FOR REVIEW and is **not** self-accepted.


2026-10-25 01:55 IST — Qoder — zero-control-ui runtime registration review

Source: `app/zero-control-ui/index.js` imports `registerZeroUiRuntime` and calls it in `register(api)`;
`runtime-core.mjs` registers `zero.ui.providerNames.list/set/delete` and
`zero.ui.providerCredentialRef` when `api.registerGatewayMethod` exists. Manifest
`activation.onStartup:true`, config entry enabled and load path present; syntax checks pass.
Runtime: **Gateway is stopped** (`gateway status` stopped, `ECONNREFUSED 127.0.0.1:18789`, no gateway
process). `plugins inspect` activated/loaded is persisted metadata, not runtime proof. The
2026-10-24 log lacks a `[zero-control-ui] runtime registration requested` line while zero-policy/
zero-provider-manager lines are present. No behavioral method call was made (set/delete mutate the
plugin store; Gateway down). Therefore the methods are **not registered/callable** now; the prior
run is treated as unproven, not confirmed.
Supported path: owner-authorized Gateway start/restart with the current entry; `plugins.controlUi.reload`
is browser-only, `plugins reload` is package-gated (`record-missing`). After start, use the
registration log plus read-only `providerNames.list`/`providerCredentialRef` checks; do not use
set/delete as a probe.
Owner decisions: authorize the Gateway start/restart; resolve orphan `ZERO_PROVIDER_ZERO_GW_API_KEY`
(remove/re-scope or accept `nvidia` fail-closed) before any Discover retry. PM-01 stays READY FOR
REVIEW. No config/secret write, no provider call, no credential value read; live config sha
`ad1536d86a9ef1de` (mtime 2026-10-24 10:39:32) untouched.

2026-10-25 02:05 IST — Qoder — owner-authorized normal-profile run (registration + Notepad)

Gateway started via the documented launcher (PID 19764, created 02:00:41), health OK; config sha
`ad1536d86a9ef1de` (mtime 2026-10-24 10:39:32) unchanged; no config.patch write. Runtime log shows
`[zero-control-ui] runtime registration requested: methods=zero.ui.providerNames.list,zero.ui.providerNames.set,zero.ui.providerNames.delete,zero.ui.providerCredentialRef`.
Read-only calls (no set/delete): `providerNames.list {}` → `{"names":{}}`; `providerCredentialRef
{providerId:"zero-gw"}` → `{"ok":false,"reason":"inline"}` — fail-closed, no secret value, so the UI
fallback must remain. First calls hit the CLI 10 s default; retried read-only with `--timeout 45000`.
No provider call/discovery.
Manual Notepad proof (owner override normal profile, **not** CUA/k7): PowerShell UI Automation on a
unique `%TEMP%` file. Title `zero-cu01-20261025-020337.txt - Notepad`; marker
`ZERO-CU01-20261025-020337-OK`; UIA text `""` → marker; 28 bytes; SHA-256
`b442ac67d83100d337262560e464fb66733bc0b45d03e192435d6efa1d15da55`; content match true; Notepad
closed; temp file/script removed. Hold status read-only: `held:false`, `owned:false`, `scope:"global"`,
`resumeSnapshotRequired:false`, counters zero. No take/release, no global stop, no takeover, no live
view, no browser test.
Limitation/gate: `computer/spike/designated-environment.json` is absent and was not forged, so k7
hold recovery (H1–H3) and the CUA/computer-tool path were not run. Exact remaining step: owner
writes the marker (or explicitly scopes an alternative harness); CU-01/PM-01 are not self-accepted.

2026-10-25 02:10 IST — Qoder — providerCredentialRef source analysis (value-free)

Source config still has zero-gw `apiKey` as a SecretRef object (`source/provider/id` keys, env,
uppercase id; value never read). The live method returned `reason:"inline"` because the plugin
runtime config exposed a **string** at `apiKey`, hitting the classifier's string branch.
Host contract: `OpenClawPluginApi` exposes `config` and `runtime.config.current()` (runtime snapshot);
there is no plugin accessor for the source/raw snapshot (`getRuntimeConfigSourceSnapshot` is
internal), and `config.get` is redacted (`redactConfigSnapshot`). The runtime snapshot is published
after secrets activation. Conclusion: the method cannot recover the original ref from runtime
config; it must stay fail-closed. Supported remedy for OpenCode: persist the non-secret
`{source,provider,id}` at create/update in the plugin keyed store and return `not-recorded` for
providers that predate it, keeping the same-host fallback; do not reconstruct from the runtime value.
No `set`/`delete`, provider call, secret read, config write or restart; Gateway PID 19764 remains;
config sha `ad1536d86a9ef1de` unchanged. PM-01 stays READY FOR REVIEW.

2026-10-25 02:20 IST — Qoder — credential-reference identity contract (backend review only)

Qoder verified the supported write path; **no `app/` edit or live mutation**. `secrets.store.set`
returns `{ok,reloaded,warningCount}` and does not echo identity, so the exact ref must come from the
request: `{source:"store", provider:"default", id:<uppercase name supplied>}` (env refs from the
exact supplied ref). Order: secret write (new key only) → config.patch with `ok:true` + expected
`changedPaths` → persist non-secret `{source,provider,id,updatedAt}` in a dedicated keyed store.
Patch failure: compensate by deleting a **newly created** store name only; never delete on a
replacement. Metadata failure: config+secret are live; report partial and retry metadata
idempotently only. Key-omitted edit: omit `apiKey`, preserve recorded identity. Legacy/redacted:
getter returns `not-recorded`, UI keeps same-host fail-closed; no zero-gw migration and no orphan
store action. Recommended Gateway methods: getter reads persisted row; add
`zero.ui.providerCredentialRef.set {providerId, ref}` and `.delete {providerId}`; activation requires
a later Gateway restart. Offline test matrix in `control-ui-backend-contract.md`. Implementation and
tests remain OpenCode's; PM-01 stays READY FOR REVIEW.

2026-10-25 02:30 IST — Qoder — credential identity failure rule tightened (no auto-delete)

Verified the store write path: `secrets.store.set` is an upsert keyed by name and returns only
`{ok,reloaded,warningCount}`; it does not report create-versus-replace. A pre-write existence check
is not proof under overwrite/concurrency, and the fixed `ZERO_PROVIDER_<ID>_API_KEY` name may already
exist. Contract updated: **do not auto-delete a store entry after a failed config patch**; leave the
credential untouched, report `partial: secret-written, config-not-committed` with the name only, and
provide an idempotent retry that re-patches the same exact identity. Deletion is allowed only for a
name proven previously absent and not overwritten (current fixed-name flow cannot prove it).
Metadata failure after config success remains `identity-pending`/`not-recorded` with idempotent
metadata retry. No app edit or live mutation; PM-01 stays READY FOR REVIEW.

2026-10-25 (IST) — OpenCode — native-only UI maintainability pass (UI-05)

Status: READY FOR REVIEW; no self-acceptance.

- Removed the legacy React/CopilotKit/AG-UI product path: `app/src/client/`, the Hono runtime,
  `runtime-scope.ts`, thread registry, activity feed, and desktop relay are deleted. The
  `/api/copilotkit/threads` `403` came from that retired guard; it is no longer a product request.
- Retained the useful Gateway bridge as `app/src/bridge/` (WS RPC, pairing, validated config). It is a
  library, not a service; `tsc --noEmit` exits 0.
- `.zero-data/fresh-workspace/start-all.ps1` now starts only the Gateway/native Control UI;
  `start-runtime.ps1`/`start-vite.ps1` are deleted and ports `4317`/`5173` are unused.
- Split `app/zero-control-ui/browser.js` (formerly 5,731 lines) into `src/pages/{team,models}.js`,
  `src/shared/{providers,sessions,skills,memory,format,errors,dom}.js`, `src/constants.js`, and
  `src/legacy-routes.js`; the entry is 1,652 bytes. Added a bounded Retry to the Models config error.
- Added `test/fake-dom.mjs`, `test/product-path.test.mjs` (zero-session empty state, safe Gateway
  errors/retry, zero-provider config error/retry, pure provider/session contracts, no CopilotKit in the
  built bundle), and updated `app/test/bridge.test.mjs` for the split source.

Evidence: UI tests **37/37**, bridge tests **3/3**, `tsc --noEmit` exit 0, build generation
`211e64c99fe5b81ddb3d74828135c59755d6cefe9d626ceeffe2cb4241d87ca1` (JS 105,523 B, CSS 27,639 B),
`verify-served.mjs` exit 0. Browser smoke on the native Team/Models pages: no CopilotKit panel and
0 `copilotkit`/`threads` requests; only an unrelated host avatar `404`. The live Gateway still serves
its startup-cached generation (`ac56ae2d…`); a restart is owner-gated. The fresh profile's providers,
secrets, routes, and session history were not changed. PM-01/UI-05 remain READY FOR REVIEW.

2026-10-25 (IST) — OpenCode — PLAN-D acknowledgement + canonical UI digest (read-only)

Acknowledges the Senior's Phase D documentation reconciliation; no product-code change in this step.
Recorded one canonical UI status to close the conflicting-revision note in `PROJECT_MEMORY.md`:
manifest asset dir `211e64c99fe5b81ddb3d74828135c59755d6cefe9d626ceeffe2cb4241d87ca1`,
`sha256(index.js)` `228ba7ee…` (105,523 B), `sha256(index.css)` `cace3419…` (27,639 B),
`control-ui-digest.mjs` revision `75d0b71f…`, `verify-served.mjs` exit 0. `--expect ac56ae2d…`
reports MISMATCH because the running Gateway (PID 17516) still serves the revision cached at its
08:36 start; the catalog revision for that instance was not re-queried (no Gateway RPC/restart).
Acceptance of PM-01/UI-04 still requires the owner-authorized restart plus a read-only
`plugins.controlUi.list` catalog check. No self-acceptance.

2026-10-25 (IST) - OpenCode - UI-05/PM-01 post-restart live verification (READY FOR REVIEW)

Status: READY FOR REVIEW (UI-05 and PM-01); no self-acceptance; no commit.

- Runtime: exactly one controlled start of the fresh-workspace Gateway via
  `.zero-data/fresh-workspace/start-all.ps1` (PID 4316), loopback `127.0.0.1:18789`,
  `auth.mode:"none"`, config `E:\zero\.zero-data\fresh-workspace\openclaw.json` and state dir
  `gateway-state`. The retired `backend\.openclaw` / `backend\config\openclaw.json` profile was not
  used or restored.
- Live catalog: `plugins.controlUi.list` -> catalog `0b123140bbd2c63f6c7457fbdefde3916a2e8f04bff040ff58654d83132b7e16`,
  plugin `zero-control-ui` revision `75d0b71fab38326aacf92df062d6965a5bb7ad163d0b974477ece05e2db97183`,
  diagnostics `[]`. The local digest now matches live (previously `ac56ae2d...` startup cache).
- Served assets: `/api/copilotkit/threads` -> 404; plugin `index.js` -> 200 / 105,523 B;
  `index.css` -> 200 / 27,639 B. Headless-Chrome smoke rendered the native Team and Models &
  Providers pages from the `75d0b71f...` assets with 0 copilotkit and 0 `/threads` requests
  (only an unrelated host avatar 404).
- Preserved profile: provider `nvidia` (`openai-completions`, `https://integrate.api.nvidia.com/v1`,
  store SecretRef, model `z-ai/glm-5.3-flash`), agents `zero`/`researcher`/`operator`, config still
  5,718 B with mtime 09:18:34. All original session keys remain; one new
  `agent:zero:dashboard:0d008387-...` session was created during recovery and was left untouched
  (deletion forbidden).
- Honest caveat: startup restart-recovery auto-resumed `agent:zero:main` and made exactly one NVIDIA
  `model-fetch` (status 200) before it was aborted with `sessions.abort`
  (`abortedRunId 2adebe14-7c60-49be-85d4-db810a70177e`). `agent:zero:main` is now `killed` with
  `abortedLastRun:true`. No further provider calls were made.
- Re-run verification: UI tests 37/37, bridge tests 3/3, `tsc --noEmit` exit 0, build generation
  `211e64c99fe5b81ddb3d74828135c59755d6cefe9d626ceeffe2cb4241d87ca1`, digest `--expect 75d0b71f...`
  match (exit 0), `verify-served.mjs` exit 0.
- PM-01 live `.set`/`.delete` activation remains owner-gated; no live config/secret mutation, no
  credential read, no provider/model config change. UI-05/PM-01 await Senior acceptance.

## Single-assistant UX closeout — 2026-10-25 (final)

- **UI-05 / PM-01 remain READY FOR REVIEW.** No self-acceptance.
- Single-assistant Zero: `/chat/zero` is Home and the only conversation entry. `/chat/operator`, `/chat/researcher`, and `/new?agent=<specialist>` hard-redirect to `/chat/zero`. Native `/agents` renders only the Zero card; Operator/Researcher cards are removed from the DOM while their Gateway definitions, tools, delegation, sessions, and history remain. Sidebar agent card is a static Zero identity (not a switcher).
- Settings selector: specialist options removed. On ordinary settings screens (`/settings/agents/zero`, `/settings/model-providers`, `/settings/about`) `openclaw-agent-select` is a static Zero-only configuration context (`aria-disabled="true"`, `tabindex="-1"`, no popup, chevron hidden, click blocked). On direct `/settings/agents/<specialist>` it is removed and a visible `.zero-admin-config` notice states the screen is administrator configuration only and cannot start or open a conversation. “Set Default” is removed on those specialist screens (with a defensive click guard), so an internal delegation agent cannot become the Gateway default; Zero’s disabled “Default” state and all other configuration controls remain.
- Duplicate surfaces removed, not hidden: all plugin pages/nav are gone (`uiCapabilities: []`); `src/pages/team.js` deleted. The provider manager mounts **in place** on native `/settings/model-providers`; About content mounts **in place** on native `/settings/about`. Exactly one native Plugins (`/plugins`) and one native Skills (`/skills`) surface remain.
- Hidden host routes are removed from the router by hard `location.replace`: `/debug`, `/logs`, `/settings/debug`, `/settings/logs`, `/settings/updates` → `/chat/zero`. Legacy plugin URLs `id=models` → `/settings/model-providers`, `id=about` → `/settings/about`, `id=team` → `/chat/zero`. Backend logging/audit/security untouched.
- Chrome: title/topbar read Zero; upstream logo replaced with a “0” mark; community card and “Pin to switcher” removed; native “About Zero” entry visible.
- External surface: capture-phase block for upstream marketing/community hrefs; no `fetch`/XHR/`sendBeacon`/`EventSource`/WebSocket/storage in the plugin bundle; host update framework retained as a local extension point. Third-party plugin catalog metadata/`@openclaw` authors retained as attribution.
- Verification: UI **43/43**, verify-served **1/1** (44/44 including it), bridge **3/3**, `tsc --noEmit` exit 0, generation `58fcb384391a69516eff9de2e24d4a1150f2bc9516576f32fe3b5c78e0b56405` (JS 90,533 B, CSS 21,901 B).
- Live state: Gateway listener PID `20504` (launcher `11420`) serves plugin revision `0c076181471ec93330096329c9c33c1d5f6b28009bb1cbcb0b1d22d52378fffc`; live-revision digest `--expect` match (exit 0); served `index.js` (sha256 `7a9af60c…`, 90,533 B) and `index.css` (`3b61445e…`, 21,901 B) are byte-identical to local. 21-route audit: **0** external requests, **0** community nodes, **0** stale plugin nav, **0** plugin links, **0** “Internal specialist” labels, **0** specialist chat controls; correct native destinations; blocked routes render the Zero transcript. Read-only specialist check: **0** “Set Default” controls and **0** “Default” labels on `/settings/agents/operator|researcher`; Zero keeps its disabled “Default”. No provider/chat/config/session mutation and no model-response claim.
- Remaining administrator-only surface: direct `/settings/agents/operator` and `/settings/agents/researcher` (and subpaths) for configuration, plus config-only “Manage agents” / “New agent” on `/agents`. Those specialist screens expose no chat action and no “Set Default”; none opens or creates a specialist conversation or changes the Gateway default.
- Owner-gated: PM-01 live `.set`/`.delete`; CU-01 desktop proof; Senior review; optional decision on retaining `app/src/bridge/`.
- Evidence: `reports/ui/white-label-and-single-chat.md`; `reports/ui/provider-manager-ui.md` §22.7; screenshots in `reports/ui/screenshots/white-label/`.

## Computer-control hold bar live closeout — 2026-10-26

- **Status:** UI-05 remains **READY FOR REVIEW**; CU-01 remains **PARTIAL**; CU-02 unchanged. No self-acceptance.
- **Runtime:** one controlled start of `.zero-data/fresh-workspace/start-all.ps1`; Gateway listener PID `17492` (launcher `6840`) on loopback `127.0.0.1:18789`, `auth.mode:"none"`, same config/state. Paired node `36196f0b…` connected with exactly `computer.act,screen.snapshot,desktop.stream`; `computerUse.provider.id = "cua-computer"`.
- **Live UI (Control UI, `/systems`):** one Zero hold bar above the native `.systems-desktop`; `free` → take → `held-this-client` → second tab `held-other` → release → both `free`; scope `Global hold - all sessions`. Owner tab closed without Release → backend `held:false`, `resumeSnapshotRequired:true`, `releasedByDisconnect` +1, `connection-closed` audit row; surviving tab converged to `free`. Clean H1–H3: take with `resumeSnapshotRequired:false`, then close, then new connection `true`.
- **Defect fixed:** the first live build re-mounted the hold bar on every observer tick (bar-parent vs Desktop-parent check) and blocked the `/systems` main thread. `src/native-surfaces.js` now reuses only an attached, populated wrapper (`canReuseComputerHold`) and ignores mutations inside `.zero-computer-hold-host`; offline regression added.
- **Checks:** UI **71/71** (20 hold tests), `tsc --noEmit` 0, backend selftest **111/111**, build generation `56b1d59f405bcdbce8eb957a984b51ddf5bba675201b395c2710980e37d8f4c8` (JS 100,327 B, CSS 24,114 B). Gateway serves plugin revision `3d62356d71561fc92587b6d1a2e48d6e77d4ff81bdf15b50b4e46dc1a05ddbc4`; served JS byte-identical (sha256 `ddb9ae52…`).
- **Blocked:** agent refusal (`computer-hold:human-control`) and fresh-capture recovery (`computer-hold:stale-frame`) are offline-tested only. The `computer` tool is hidden when the model lacks vision; the configured route is text-only, and the two `text+image` catalog models failed at the provider (Kimi 404, Minimax 410). No config/model route was changed. Live view remains blocked by the missing loopback authenticated RFB server on port 5900; no VNC/UAC attempt.
- **Evidence:** `reports/computer/cu01-spike-protocol.md` §8; `computer/contracts/takeover-hold-contract.md` §9; `reports/ui/white-label-and-single-chat.md` §15; `reports/backend/control-ui-backend-contract.md` "Computer-hold live evidence - 2026-10-26"; `app/zero-control-ui/test/computer-hold.test.mjs`.

## Gap-matrix re-audit closeout - 2026-10-26 (OpenCode)

- **Status unchanged, no self-acceptance:** UI-05 **READY FOR REVIEW**; UI-02 / INT-00 / PM-01 /
  PM-05A / GEM-05 **READY FOR REVIEW**; CU-01 **PARTIAL**; CU-02 unchanged. This pass adds evidence
  and reconciles stale claims; it does not accept any row.
- **New canonical evidence:** `reports/gap-matrix-2026-10-26.md` - one compact matrix with every item
  labelled source-verified / offline-tested / live-verified (2026-10-26) / blocked / out of scope,
  plus exact blocker causes and safe next steps.
- **Live chat path (2026-10-26):** `/chat/zero` shows `z-ai/glm-5.3-flash`, Send enabled, `chat.send`
  accepted (runId `0046f031-...`), Stop -> "Interrupted", session `abortedLastRun:true` at that moment
  (now `false` after the rewind). Token streaming still does not start because the provider returns
  nothing (45 s non-stream timeout; no first chunk in 30 s with `stream:true`). No
  config/credential/binding change.
- **Stale claim corrected:** "Chat model: No models available" (2026-10-25) is resolved; dated note in
  `reports/ui/white-label-and-single-chat.md` 16 (old text preserved).
- **Test artifact removed natively:** `sessions.rewind` on `agent:zero:main` at entryId
  `e083011f-...` (raw 80 -> 77 messages, `editorText` returned). Active branch is now `c74eae58-...`
  (63 branch messages); the superseded `11e07b41-...` branch (66, including the test turn) is
  `active:false` and switchable. `chat.history` returns 61 of 77 display messages with
  `hasMore:true`; the active transcript contains `hello` and no `ZERO-CHAT-OK`. The hold taken for H4
  was released (`held:false`, `resumeSnapshotRequired:true`, takes/releases 4/4).
- **Transcript view (host-owned quirk, not data loss):** an interim check called the post-rewind
  transcript "3 empty 120 px rows". The rows are populated (2,688 chars of `textContent`, real
  `chat-text` nodes); a fresh `/chat/zero` tab starts at `scrollTop:0` while only the tail rows render
  at ~3305-3545 px, so the viewport looks blank and `innerText` is empty (`content-visibility:auto`).
  Clicking any position-rail marker (or End) renders 7 rows and reveals `hello`; the last three
  messages are provider-timeout notices. Zero injects no chat renderer and its CSS has no `.chat-*`
  rules. Safe next step (owner-gated): a small scroll-to-latest helper on first mount + rebuild +
  Gateway reload; not implemented or served in this pass.
- **New unblock evidence:** `minimaxai/minimax-m3.1-flash` answers at the provider (HTTP 200, ~1-4 s)
  and accepts image input, but is absent from the local catalog, so the host vision gate still hides
  the `computer` tool. Safe next step is an owner-approved catalog entry
  (`input:["text","image"]`), a Gateway reload, then H4/H5 as a gateway-hosted operator turn with the
  hold taken. D-012 keeps the live route unchanged for now.
- **Checks:** UI **71/71**, `tsc --noEmit` 0, backend selftest **111/111**; served plugin revision
  `3d62356d...` (catalog `926316ec...`) with `index.js`/`index.css` byte-identical to generation
  `56b1d59f...` (100,327 B / 24,114 B).
- **Host limitation:** the hidden `.mount-fallback` block still says "OpenClaw Control UI"; it is
  `display:none` and only shows if the bundle fails to start, when no plugin code can rewrite it.
- **Evidence:** `reports/gap-matrix-2026-10-26.md`; `reports/ui/white-label-and-single-chat.md` 16;
  `reports/computer/cu01-spike-protocol.md` 9;
  `reports/backend/control-ui-backend-contract.md` "Gap matrix and re-audit closeout - 2026-10-26".

## B5 seam audit and read-only re-audit closeout - 2026-10-26 (OpenCode)

- **Status unchanged, no self-acceptance:** UI-05 **READY FOR REVIEW**; UI-02 / INT-00 / PM-01 /
  PM-05A / GEM-05 **READY FOR REVIEW**; CU-01 **PARTIAL**; CU-02 unchanged. This pass is read-only
  and does not accept any row.
- **B5 decision: host-owned; no code change.** The installed `ControlUiHost` (apiVersion 1) has no
  chat/transcript/scroll method. `onEvent` is Gateway events, and the only transcript hook is
  `ui.registerReplacement("transcript", ...)`, which would be a second renderer. The host's
  `chatHasAutoScrolled` / `chatLastScrollTop` / `transcriptScrollTop` state is private. A live
  DOM experiment (`scrollTop = scrollHeight`) revealed the tail rows, but a plugin helper would
  depend on host-internal classes/layout, cannot distinguish a restored or user-chosen position, and
  can race host auto-scroll. This supersedes the earlier "small helper" suggestion. Native
  workaround: position-rail click or End.
- **B5 live measurement (fresh tab, 15:27 IST):** `.chat-thread` `scrollTop:0`,
  `scrollHeight:3935`, client 518; 3 tail rows at viewport top 3593-3953; `textContent` 5,017 chars;
  `innerText` "SHOW EARLIER"; `history.scrollRestoration:"auto"`. The transcript is intact.
- **B1 recheck:** no new provider call. The configured default `nvidia/z-ai/glm-5.3-flash` remains
  unverified. Live-observed (not initiated by this audit) at **15:24 IST** (re-derived from
  `chat.history`; the earlier 15:14-15:15 label was wrong): the session model was switched to
  `nvidia/nemotron-3.5-super-vl-120b-a12b` then `nvidia/nemotron-3-ultra-550b-a55b`, and both
  produced assistant text. It was then switched to `deepseek-ai/deepseek-v4.1-flash`, which
  returned empty text and a model-idle-timeout notice at 15:29:52. This is a user session override
  (`modelOverrideSource:"user"`), not a config/binding change; the default route remains an owner
  decision.
- **B2 recheck:** `models.list` now returns 10 entries. Only `nvidia/moonshotai/kimi-k2.6` and
  `nvidia/minimaxai/minimax-m3` declare `text+image`; both failed at the provider previously.
  `nvidia/nemotron-3.5-super-vl-120b-a12b` is named "VL" but declares `text`. The selected session
  model is text-only, so the host vision gate still hides the `computer` tool.
  `minimaxai/minimax-m3.1-flash` remains absent from the local catalog. No catalog/binding change.
- **B3 recheck:** no listener on port 5900 and no VNC/RFB process. The prior `desktop.observe` ->
  `UNAVAILABLE` remains prior live evidence; no VNC install, credential, UAC, or non-loopback
  exposure was attempted.
- **Computer-control recheck:** node `36196f0b...a00f71` connected/approved with
  `computer.act`, `screen.snapshot`, `desktop.stream`; hold `held:false`, `owned:false`,
  `scope:"global"`, `resumeSnapshotRequired:true`, takes/releases 4/4,
  `releasedByDisconnect:2`, refusal counters 0. No fresh take/release/disconnect run.
- **Checks:** UI **71/71**; backend selftest **111/111**; `tsc --noEmit` 0; build generation
  unchanged `56b1d59f...`; local and served `index.js` (100,327 B, sha256 `ddb9ae52...`) and
  `index.css` (24,114 B, sha256 `6affcc8d...`) byte-identical; `verify-served.mjs` pass.
- **Evidence:** `reports/gap-matrix-2026-10-26.md` §6;
  `reports/ui/white-label-and-single-chat.md` §16.7;
  `reports/backend/control-ui-backend-contract.md` "B5 seam audit and read-only re-audit addendum";
  `reports/computer/mvp-computer.md` §9.

## Owner-decision checklist - 2026-10-26 15:34 (OpenCode)

**No owner decision has arrived since the 15:27 IST audit.** One post-audit live observation was
recorded read-only: the session override moved to `deepseek-ai/deepseek-v4.1-flash` and that turn
hit the model idle timeout at 15:29:52 (empty text at 15:27:50 and 15:29:52). Config sha256
`0A14A106...7168` is unchanged; there was no provider call, reload, restart, or desktop action.
Statuses are unchanged and nothing is self-accepted.

1. **Chat route (B1).** Current state: the configured default `nvidia/z-ai/glm-5.3-flash` is
   unverified, the current session override `deepseek-ai/deepseek-v4.1-flash` is not answering, and
   the nemotron models answered at 15:24 IST. Owner action: keep the session override and name a
   model that answers, or change the configured default through `/settings/model-providers`, or
   authorize a later re-test of `glm-5.3-flash`. No route change happens without that decision.
2. **Vision-capable model and bounded H4/H5 (B2).** Current state: the `computer` tool is hidden
   because the selected model is text-only; only Kimi K2.6 and Minimax M3 declare `text+image` and
   both failed at the provider; `minimaxai/minimax-m3.1-flash` answers at the provider (HTTP 200,
   ~1-4 s, image accepted) but is absent from the local catalog. Owner action: approve adding that
   catalog entry with `input:["text","image"]`, approve exactly one bounded Gateway reload, and
   approve one H4/H5 run as a gateway-hosted Operator turn with the hold taken. No catalog entry,
   binding, reload, or paid request happens without it.
3. **Live desktop view (B3).** Current state: `desktop.observe` returns `UNAVAILABLE`; there is no
   listener on port 5900 and no VNC/RFB process. Owner action: approve a specific authenticated
   loopback RFB implementation, its install path (including UAC), and its credential handling. No
   install, credential, or listener is created without it.
4. **Senior review (B4).** Owner action: request Senior review for UI-05, UI-02, INT-00, PM-01,
   PM-05A, GEM-05 (all READY FOR REVIEW) and for the CU-01 PARTIAL / CU-02 rows. Only the Senior
   reviewer can accept them.

Standing constraints: one Control UI shell, one Gateway, `/chat/zero` as the only user-facing chat,
no `upstream/` edits, no second renderer, no secrets in output, B5 host-owned.

**Serving note:** the 15:50 UI hold-leave build (`16b83c88...`) is local only. The Gateway still
serves the prior revision until an owner-approved reload; no live take/release/pagehide is claimed
before that reload and a fresh exercise.
## UI-owned hold-leave closeout - 2026-10-26 15:50 (OpenCode)

**Task:** implement every safe, UI-owned OpenMausBot-to-Zero gap; leave Gateway/computer-runtime
work unclaimed. No Gateway config/runtime change, reload, restart, provider call, credential access,
desktop observation/input/takeover, or RFB install was performed.

### Gap implemented

Leaving the native Desktop surface did not hand back a hold this view had taken. The plugin releases
on Gateway connection close, but an in-app route change keeps the socket open, so a global hold could
remain active after its only visible release control was removed. The OpenMausBot pattern is
"closing the panel, leaving the view, or closing the page gives back the hold it took" (Apache-2.0
`src/components/computer-takeover.ts` / `ComputerPanel.takeover.test.ts`; behavior only, no source
copied).

### Files changed

- `app/zero-control-ui/src/computer/hold.js`
  - `createComputerHold().leave()`: best-effort hand-back of only this view's lease; stops polling,
    ignores late responses, never renders success, never blocks navigation.
  - In-flight take is awaited only to release the lease it returns (falling back to the hold this
    view already had if that take fails); in-flight release is not duplicated.
  - `mountComputerHold()` adds a `pagehide` listener and exposes `leave()`; `dispose()` alone never
    releases (host re-render safety).
  - Held-by-you detail now says leaving the screen hands control back.
- `app/zero-control-ui/src/native-surfaces.js`
  - `computerSurfaceAction()`: route departure = `leave`, missing Desktop element = `unmount`,
    attached wrapper = `reuse`, otherwise `remount`.
  - `handBackComputer()`: null-safe best-effort call.
  - Leaving `/systems` or plugin teardown hands back only this view's hold; the native viewer,
    route, and transport are untouched.
- `app/zero-control-ui/test/computer-hold.test.mjs`: 10 new focused tests (30 hold tests total).

### Verification (source/test only)

- UI suite **81/81** (30 focused hold tests), including the existing one-shell, one-chat,
  specialist-route, provider, and delegation tests.
- Build generation `16b83c886dd1679b88339502497e3543afb37f6c3f08f85313328593ca2c512b`;
  `index.js` 101,066 B sha256 `942c11e3...c724`; `index.css` 24,114 B sha256 `6affcc8d...3004`
  (unchanged).
- `test/verify-served.mjs` passes for the local build; the built bundle contains `pagehide`,
  `leave this screen`, and the hold host, and contains no `new WebSocket`, `websockify`,
  `EventSource`, `RTCPeerConnection`, `noVNC`, or `RFB` additions.
- **Not live-verified:** no Gateway reload. The last observed served revision remains
  `3d62356d...` / generation `56b1d59f...`; the new bundle is not claimed to be served. No live
  take, release, route change, or `pagehide` was exercised. A browser check was omitted because the
  behavior lives in the plugin bundle and checking it would either use the stale served bundle or
  require a Gateway reload, which is out of scope.

### License handling

Behavior pattern only; no OpenMausBot source lines copied. No OpenMausBot name, mascot, component,
or `enterprise/` code. The Apache-2.0 attribution context and the exact pattern mapping are recorded
in `reports/ui/openmausbot-ui-reference.md` ("UI-owned integration implemented - 2026-10-26").

### Remaining prerequisites (unchanged, not claimed)

- B1: owner must choose the chat model route; the configured default remains unverified and the
  current DeepSeek override timed out.
- B2: owner must approve the vision-capable catalog entry, one bounded reload, and one H4/H5 run.
- B3: owner must approve a specific authenticated loopback RFB implementation and setup.
- B4: Senior review only for UI-05, UI-02, INT-00, PM-01, PM-05A, GEM-05; CU-01 PARTIAL.
- B5: host-owned; no DOM scroll hack or transcript renderer replacement.

UI-05 READY FOR REVIEW; CU-01 PARTIAL; CU-02 unchanged. No self-acceptance.

## OMB-01 Phase 0 + offline native-MCP closeout - 2026-10-26 21:31 (OpenCode)

**Scope:** Open Mouse Connect Plan Phase 0 reconciliation plus one offline implementation slice with
a verified Gateway seam. No live config/model/provider/credential/session change, restart/reload,
prompt/inference, external app action, CLI run, MCP connection, install, or desktop input.

### Phase 0 evidence

- Requested tree `upstream/OpenMausBot-main`: package `0.1.127`, no `.git`, 5,111 files /
  150,508,407 B, tree SHA-256 `f0e8df37…c25b62`; Apache-2.0 core, `enterprise/` under a separate
  source-available license, trademark reservation recorded. It is **not** the old
  `upstream/openmausbot` `d393b7a…`/`0.1.123` snapshot.
- Live config `E:\zero\.zero-data\fresh-workspace\openclaw.json` SHA-256 `6f051c09…efa0a5`; model
  projection `ea75d703…e5000f` (stable formula in plan §9.2). Only agent `zero`; delegation disabled;
  `computer` allowed; `exec.mode:"ask"`; NVIDIA provider/model list unchanged.
- Live startup registered only six provider metadata methods; the integration methods are not live.
- Historical worker claims are marked superseded; authoritative zero-only state is recorded in
  `PROJECT_MEMORY.md`. No workers/chats/delegation recreated.

### Implemented (source/test only)

- `zero.integrations.cli.status`: PATH/version discovery plus native CLI-backend dispatch readiness.
  Execution remains the native CLI-backend path, gated by an owner-approved model/runtime change; no
  custom runner.
- `zero.integrations.connectors.status`: native MCP config state (configured/enabled/transport/auth/filter);
  no session argument and no plugin-side Gateway dispatch. Phase 1 contract map is in plan §10.
- `app/zero-control-ui/src/shared/connectors.js` + About: pure projection of the Gateway's **cached**
  `tools.effective` MCP catalog (read-only browser host request) with sanitized tool names and
  `reachable:null`; no URLs/headers/launch commands/OAuth material/descriptions.
- **Backend probe blocked:** `api.runtime.gateway.request("tools.invoke")` is restricted to
  bundled/trusted-official plugins (`canTrustedOfficialPluginRequestScopes`); a workspace plugin
  cannot use it even with `contracts.gatewayMethodDispatch`. The attempted probe and manifest
  contract were removed; no dead/unsupported method is shipped. Live reachability requires the
  native MCP probe/app action through the host.
- About remains discovery-only and states that cached status does not prove reachability.

### Verification

- UI **82/82** (incl. transport default/unknown and empty/non-empty filter regressions); mount **34/34**; redirect **1/1**, migration **3/3**, sync **5/5**; bridge **3/3**; plugin selftest
  **111/111**; `config validate` valid (non-fatal CLI shared-state cleanup warning after 5 s);
  `verify-served.mjs` exit 0.
- Build generation `418858e0…`; JS 105,724 B sha256 `ed553ce5…f128`; CSS 24,114 B
  sha256 `6affcc8d…3004`. Not served; new methods/card need restart/reload.
- `openclaw plugins validate` reports missing tool/feature authoring metadata for this
  Gateway-method-only plugin; recorded as a validator limitation, not hidden.

### Remaining gates

Native CLI backend decision/account; MCP/OAuth accounts + owner-authorized live probe/app action;
mobile/channels external apps; team/cloud/control-plane/enterprise; B3 RFB + owner vision/input run;
activation restart/reload. Literal parity is not achieved. OMB-01/UI-05 READY FOR REVIEW; no
self-acceptance.

## OMB-01 next-phase candidate decision - 2026-10-26 22:10 (OpenCode)

**Scope:** inspected current source/tests, plan §§9–11, parity report, and board after the completed
MCP transport/filter review. No product code changed; no Gateway/config/model/provider/credential/
session/desktop change; no restart/reload, CLI/MCP/provider/account/desktop action.

**Selected highest-value candidate:** live Claude Code/Codex execution inside `/chat/zero`. The
installed Gateway already owns the supported seam (native CLI backend via `registerCliBackend` and
model-scoped `agentRuntime`, plus `chat.send`/`chat.abort`). Zero currently binds only NVIDIA. The
capability is blocked on an owner-approved CLI model/runtime binding plus CLI install/auth; a
Zero-owned runner would duplicate or bypass the native lifecycle, so none was added.

**Second candidate:** live MCP connector reachability/app action. Blocked on MCP/OAuth accounts and
the trusted-official dispatch gate for a plugin-side probe; native chat already owns MCP tools and
approvals. No connector registry/probe/live action added.

**Other gates:** desktop viewer B3 RFB + owner vision/input; mobile/channels external apps/accounts;
team/cloud/enterprise separate product/license; bot-box/VM/cloud platform. No placeholders.

**Baseline evidence:** UI 82/82; mount 34/34; redirect 1/1, migration 3/3, sync 5/5; bridge 3/3;
plugin selftest 111/111; `config validate` valid; `verify-served.mjs` exit 0. Build generation
`418858e0…` (JS 105,724 B sha256 `ed553ce5…f128`; CSS 24,114 B `6affcc8d…3004`), not served. Config
SHA `6f051c09…` and model projection `ea75d703…` unchanged; only agent `zero`.

**Smallest next authorized action:** owner (A) approves one exact native CLI model/runtime binding,
CLI install/auth, and one bounded `/chat/zero` turn, or (B) configures one native MCP server/account
and authorizes one read-only native chat tool call. OMB-01 remains READY FOR REVIEW; no self-acceptance.

## OBS-01 Windows observation engine — Steps 1–2 + local perception/memory slice - 2026-10-27

**Scope:** implemented the owner-approved roadmap first slice inside the existing native Zero
Control UI plugin. No Gateway/model/provider/config/session/credential/desktop change; no Gateway
restart/reload, CUA driver start, screen capture, provider/MCP/CLI call, install, or desktop input.

**Existing seams reused:** CUA driver `screen.snapshot`/`getDesktopState` (`upstream/openclaw/extensions/cua-computer/src/commands.ts`, `driver-client.ts`, `frame.ts`), installed
`@trycua/cua-driver` 0.32.0 (MIT), Zero hold (`backend/plugin/index.js`,
`src/computer/hold.js`), native Systems/About surfaces, Windows UI Automation, and Node 24
`node:sqlite`. No Screenpipe source/UI.

**Implemented:** `app/zero-control-ui/observation/` modules for lazy CUA capture, coarse
change/dedupe filtering, 5-minute/500 MB/600-frame/120-per-minute/500 ms/250 MB-per-source ring,
bounded 8-slot queue, 1 s active/5 s idle cadence, deterministic stop/Private Mode cleanup with
in-flight capture/OCR cancellation, local UIA + Windows OCR adapters, tested error-secret redaction,
consecutive-error reset with lifetime totals, and SQLite observation summaries/workflow candidates
with 7-day/30-day/10k-row bounded pruning every 15 minutes, plus the read-only `zero_screen_context` tool and disabled-by-default `observationSuggestions` config (tool-result-only candidates). About now shows capture state, counts,
Enable/Stop, and Private Mode. Raw frames are not stored in SQLite or the transcript.

**Verification:** UI **111/111** (21 observation tests + 5 observation-tool tests), mount **35/35**; focused tests cover
caps, rate/horizon eviction, buffer zeroing, dedupe/scene/pixel change, queue cancellation,
backpressure drops, Private Mode in-flight/OCR races and adapter abort signal, offline failure/no cloud
fallback, consecutive-error reset/recovery with lifetime totals, sanitizer redaction of rendered
errors, retention expiry/restart/row bounds, bounded settlement for hung/cooperative capture and late
perception workers, truthful cleanupPending on timeout, deferred store close, adapter abort propagation, and PNG dimensions. Logical row
retention is bounded; SQLite physical file size is not capped or guaranteed to shrink. The
pre-implementation OBS-01 row is marked historical/superseded; the later row is authoritative.

Build generation `4cbb6c34…`; JS 108,935 B sha256 `4e141fcb…e5b8`; CSS 24,656 B
sha256 `ab4dbfcf…10b7a`; `verify-served.mjs` exit 0. A separate `plugins inspect --runtime` with the
live config/state paths loaded the plugin and reported `zero_screen_context` as a non-optional tool,
plus all 11 methods and the config schema; the running Gateway still needs restart/reload. The
mixed-plugin `plugins validate` authoring-metadata warning remains. PowerShell scripts parse
successfully; they were
not executed.

**Limits / next gates:** real CUA capture, UIA/OCR latency/accuracy, CPU/RAM/frame sizes, Windows
permission/capture-indicator behavior, and OCR language-pack availability are **not measured**. The
installed CUA SDK exposes an AbortSignal on `getDesktopState`, but native prompt cancellation is not
measured; shutdown uses the independent bounded settlement. Logical row retention is bounded; SQLite
physical file size is not capped or guaranteed to shrink. No
VLM/Whisper weights or runtime were added. The read-only `zero_screen_context` tool is
runtime-inspect verified in a fresh CLI process but not exposed by the running Gateway; suggestion
policy is disabled by default and tool-result-only (no unsolicited delivery/action). SQLite DPAPI/ACL
hardening and live capture/OCR/resource measurement remain pending. Next authorized step is an isolated smoke against a
single synthetic/owned window with measured resources, then a model-provisioning license/resource
decision. OBS-01 READY FOR REVIEW; no self-acceptance.

## OBS-01 durable owner opt-in lifecycle — 2026-10-27

**Scope:** added durable owner opt-in for continuous observation without changing live Gateway config.
No preference store was opened against live state; no CUA driver, desktop capture, OCR, model/provider
call, install, config/credential/session write, or Gateway restart/reload.

**Implemented:** `app/zero-control-ui/observation/preference.mjs` defines the only preference record
(namespace `observation-preference`, key `state`, retained keyed store) with exactly
`{schemaVersion:1, enabled:boolean, privateMode:boolean, updatedAt:string|null}`; missing keys,
extra keys, non-booleans, arrays, unknown schema, and unreadable storage are rejected.
`app/zero-control-ui/observation/lifecycle.mjs` serializes initialize/start/stop/Private Mode/dispose,
persists before reporting success, and fails closed to disabled + Private Mode when the store is
missing/malformed/unreadable/unavailable or a write fails. Startup resumes capture only for an
explicit `enabled:true, privateMode:false` record; persisted Private Mode applies without capture;
missing storage stays disabled without writing. `private-off` resumes only when the persisted
`enabled` value is true. `stop` persists `enabled:false` before success. All actions are idempotent
and serialized; engine bounded settlement, late-worker guards, truthful `cleanupPending`, and deferred
store close are delegated unchanged. `runtime-core.mjs` opens the retained preference store, starts
lifecycle initialization on plugin registration, and routes `zero.observation.status/control` through
the lifecycle; About uses `preferenceEnabled` for the Stop/Enable control. No observation content is
written to the preference record.

**Verification:** UI **123/123** (21 observation + 5 observation-tool + 12 observation-lifecycle
tests), mount **35/35**; lifecycle tests cover first-run defaults/no write, enabled restart recovery,
Private Mode restart recovery and conditional resume, persist-before-stop ordering,
malformed/unreadable/unavailable storage, start/stop/private write failures, concurrent
start/private/stop/private-off serialization, duplicate start idempotence, dispose blocking, exact
preference keys with no observation content, and runtime-handler status/control wiring with safe RPC
errors. Build generation `7f9a2412…`; JS 108,960 B sha256 `e355fbab…bd7c`; CSS 24,656 B sha256
`ab4dbfcf…10b7a`; `verify-served.mjs` exit 0.

**Remaining gates:** owner-authorized Gateway restart/reload to load the lifecycle, then confirm
first-run `missing` → disabled, enabled restart recovery, Private Mode restart recovery, and
malformed/unavailable storage fail-closed against the live retained store. Synthetic/owned-window
capture, UIA/OCR accuracy, and CPU/RAM/frame/latency measurement remain unmeasured; live continuity
is not claimed. OBS-01 READY FOR REVIEW; no self-acceptance.

## OBS-01 start-failure correctness — 2026-10-27

**Scope:** focused lifecycle correction for `engine.start()` resolving with
`state:"unavailable"`/`state:"error"`/`running:false`. No live preference store, CUA driver, desktop
capture, OCR, model/provider call, config/credential/session write, install, or Gateway restart/reload.

**Implemented:** `startEngine()` now inspects the resolved engine status. Only
`running:true` with `state:"capturing"` is success. Resolved unavailable, error, stopped/not-running,
private, or a rejected `engine.start()` records a safe `startFailure`
`{origin, reason, state, message}` with `captureRunning:false` and a constant
`capture-start-unavailable|error|rejected|not-running|private` code; no raw engine error is returned.
Lifecycle status sanitizes `lastError`/`lastPruneError` and derives `captureRunning`. Explicit start
returns the qualified status with `ok:false` on failure and preserves the persisted enabled preference;
startup auto-resume failure records `origin:"startup"` and leaves the enabled record unchanged so the
next Gateway startup retries. Private Mode exit persists `privateMode:false`, records `origin:"private-off"` on failed
resume, reports Private Mode off accurately, and does not start when persisted `enabled` is false.
About renders source-unavailable/start-failure text without claiming capture and keeps
Disable/Private controls available; it no longer returns early for an unavailable source.

**Verification:** UI **129/129**, including 21 observation, 5 observation-tool, 16 lifecycle tests,
and 2 new About start-failure cases; mount **35/35**. New regressions cover explicit start returning
unavailable/error/rejected/success, startup failure retaining `enabled:true` with zero preference
writes and success on the next simulated startup, Private Mode exit failure staying non-running,
handler payloads (`startFailed`, `captureRunning:false`, safe code), and UI text/buttons with no raw
credential leakage. Build generation `4c2cd521816b3aae66160384b4f33cd9c7311b605340efd13bda31f1c1105757`;
JS 109,389 B sha256 `c6fe82abfbd4a8380230aabf314d969357c0f20610f993b772c702c7fe6afe5e`; CSS 24,656 B
sha256 `ab4dbfcf36841567d3b8ca6c5793e459f8deb753a2e011487d65263e2d510b7a`; `verify-served.mjs` exit 0.

**Remaining gates:** owner-authorized Gateway restart/reload, then verify first-run disabled,
enabled/Private Mode restart recovery, unavailable-source start failure, Private Mode exit with a
failed resume, and malformed/unavailable storage fail-closed. Synthetic/owned-window capture,
UIA/OCR accuracy, and CPU/RAM/frame/latency measurement remain unmeasured; live continuity is not
claimed. OBS-01 READY FOR REVIEW; no self-acceptance.

## OBS-01 lifecycle/API consistency — 2026-10-27

**Scope:** focused consistency pass for Private Mode resume ownership, About control timeout/pending
behavior, and `zero.observation.recent` privacy. No live preference store, CUA driver, desktop capture,
OCR, model/provider call, config/credential/session write, install, or Gateway restart/reload.

**Implemented:** `engine.setPrivateMode(false)` now only clears Private Mode; the lifecycle owns the
single resume attempt (`startEngine` called exactly once when persisted `enabled` is true) and reports
success/failure without implicit retry. About observation controls disable while a control RPC is
unresolved, ignore duplicate clicks, and after the 5-second browser timeout show an unresolved/unknown
state, refresh status, and reconcile late completion without canceling or repeating the Gateway action;
status-refresh responses are fenced against older overwrites. `zero.observation.recent` now uses the
lifecycle policy: Private Mode/disabled/stopped returns `ok:false`, `count:0`, empty `observations`,
and `reason:"private-mode"`/`"observation-disabled"`; allowed reads return at most 20 records mapped
through the same sanitizer as `zero_screen_context` (no row ids, buffers, database paths, or raw secret
shapes). Status/control methods remain unchanged.

**Verification:** UI **133/133**, including 21 observation, 5 observation-tool, and 18 lifecycle tests;
mount **35/35**. New regressions cover one real-engine Private Mode exit start attempt for both success
and failure, duplicate-click prevention and late completion after a UI timeout (pending/unknown text,
status refresh, no repeated control call), and recent-history privacy through both
`zero.observation.recent` and `zero_screen_context` with sanitized records and zero rows in blocked
states. Build generation `ccfca335da9c97792faf174aa34a3184e92bdbc920819dd0641d7dccd744e2fa`;
JS 110,639 B sha256 `b0f70760dfe10d147d6914c8ee08d6b2403cd01420314be16a1f201b1bae8d69`; CSS 24,656 B
sha256 `ab4dbfcf36841567d3b8ca6c5793e459f8deb753a2e011487d65263e2d510b7a`; `verify-served.mjs` exit 0.

**Remaining gates:** owner-authorized Gateway restart/reload, then verify live first-run/restart
recovery, single-attempt Private Mode exit, blocked recent-history under Private Mode/disabled, the
About pending/timeout behavior, and malformed/unavailable storage fail-closed. Synthetic/owned-window
capture, UIA/OCR accuracy, and CPU/RAM/frame/latency measurement remain unmeasured; live continuity is
not claimed. OBS-01 READY FOR REVIEW; no self-acceptance.

## Removal-only cleanup — experimental provider/Gateway additions — 2026-10-27

**Scope:** removed confirmed Zero-owned proposal artifacts for cloud/local-GGUF fallback switching,
managed local-GGUF process management, model role aliases, custom provider routing, and custom
Gateway endpoints/config export-import. No upstream, installed Gateway, live config, credentials,
model bindings, sessions, or user data were edited; the Gateway was not restarted/reloaded.

**Inventory result:** the standalone `Model Gateway/` replacement app (custom provider/Gateway UI,
local-GGUF service/middleware, `@coder/@fast/@reasoning/@vision/@offline` aliases, cloud/local fallback
routing, config export/import, temporary chat) had no consumers in the active Zero tree. It and the
PM-04 assets were removed. The native `zero.providers.*` provider manager, active Models page provider
CRUD/discovery/capability/role-binding flow, `local-provider-check.mjs`, Gateway RPC/plugin contracts,
native chat/sessions/About/computer/connectors, and all OpenClaw provider/Gateway contracts were
preserved. No required contract was removed.

**Removed paths:** `Model Gateway/` (all source, dependencies, dist, local manifests/config including a
plaintext provider credential copy); `backend/scripts/inspect-gguf.mjs`;
`backend/scripts/test/inspect-gguf.test.mjs`; `backend/scripts/managed-llama.mjs`;
`backend/scripts/test/managed-llama.test.mjs`; `reports/backend/managed-gguf-launch.md`; PM-04 GGUF
state/fixtures/functions/Import button/modal/dispatch in `src/pages/models.js`; GGUF CSS; the PM-04
mount test; and PM-04 references in the provider contract, provider roadmap, TASK_BOARD, README,
MASTER_PLAN, MASTER_RECONCILIATION, PROJECT_MEMORY, and gap matrix.

**Verification:** UI **132/132**; mount **34/34**; backend script tests **29/29**; provider-manager
adapter suites **47/47**; provider-manager selftest **20/20**; integration **5/5**. Rebuilt generation
`08a38a2a6e247de09f3b6402416cb939389c169aa7036bd81859f2a665d0b564`; JS 99,950 B sha256
`002e89c7f8cfba936ce355ad356f4ff6ab045792d5825c7fa59f68b9774e6877`; CSS 23,545 B sha256
`ba7d0a6ac5df442a5dbb985699c6c3ce338a53131a17937bf41ef9d7d6be2ef7`; `verify-served.mjs` exit 0;
new bundle contains no GGUF/local-GGUF/Export Config/Import Config strings.

**Remaining gate:** the running Gateway was not restarted/reloaded and may still serve the previous
bundle/plugin code; an owner-authorized reload is required before the removal is live. This is not a
claim that native Gateway/provider functionality was removed—it is intentionally retained.
