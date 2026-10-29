# ZERO AI Architecture Decisions

Record decisions that affect more than one developer. Proposed decisions stay marked `PROPOSED` until ChatGPT (Senior Developer) accepts or rejects them. Use timestamps and link to evidence/reports.

## D-001 — OpenClaw as provisional backend baseline

- **Status:** PROVISIONAL, pending Gate 0.
- **Decision:** Evaluate the unmodified OpenClaw runtime first; avoid a fork until the built-in gateway, agents, skills, and provider route are tested.
- **Reason:** Reduce maintenance and avoid deleting useful upstream features before knowing what the prototype needs.
- **Revisit when:** Gate 0 finds a blocker that cannot be handled through configuration, an existing plugin, or a small companion component.

## D-002 — One model-gateway entry point

- **Status:** PROPOSED, pending backend spike and confirmation of gateway product.
- **Decision:** Use one configured gateway endpoint for model access; it may route to multiple underlying providers/models if the user's gateway and OpenClaw support the needed capabilities.
- **Required checks:** chat completions, streaming, model list, tool/function calling, vision if computer use needs it, provider-specific limits, and error/fallback behavior.

## D-003 — Computer-use starts in the designated Zero environment

- **Status:** ACCEPTED for Gate 0.
- **Decision:** Run initial computer-use experiments in the designated SELF environment (VM/test account preferred for the spike), with visible screen, global stop, user takeover, and a recovery path. The intended product may give the agent full control inside that dedicated environment without asking approval for every action.
- **Reason:** Separate the assistant's full-control workspace from the user's everyday Windows profile and personal credentials while retaining a way to stop and recover from errors.

## D-004 — Keep CopilotKit/OpenDots UI where useful; bridge to OpenClaw

- **Status:** SUPERSEDED by D-012 and D-015 for the product UI. Retained as historical prototype evidence only.
- **Decision:** Preserve useful OpenDots/CopilotKit UI and AG-UI packages. Do not remove CopilotKit wholesale. Build/retain only a small adapter that maps AG-UI ↔ OpenClaw Gateway and replace Intelligence-only durable threads with OpenClaw session-backed behavior or a Zero store. Keep OpenClaw as the backend source of truth where feasible.
- **Reason:** Reuse more existing UI code while using OpenClaw's gateway, memory, and agent runtime. A protocol/session bridge is required; changing a base URL alone is not enough.
- **Revisit when:** the spike shows the bridge is too costly or misses important UI/runtime behavior; compare against using OpenClaw Control UI directly.

## D-007 — OpenDots selective UI reuse; OpenClaw remains runtime candidate

- **Status:** SUPERSEDED by D-012 and D-015 for the product UI. The session/transport findings remain historical evidence.
- **Decision:** Keep the OpenDots React UI and CopilotKit/AG-UI dependencies where useful; replace Intelligence-backed conversation persistence with a Zero adapter backed by OpenClaw sessions. Treat OpenClaw as the provisional runtime and keep its Control UI as an operator fallback. UI-00 and BE-00 are accepted as source/documentation inventories only; this does not prove runtime behavior, gateway compatibility, or the final transport choice.
- **Reason:** Reports show Intelligence coupling is concentrated in a small number of files, while the reusable UI is largely plain React. OpenClaw documents an embedding contract and several candidate transports.
- **Evidence:** `reports/ui/opendots-inventory.md`; `reports/backend/source-inventory.md`.
- **Next gate:** UI-01 accepted WS RPC as the prototype direction. Prove WS session creation, streaming, stop, reconnect/history, tool events, and client-chosen session keys during runtime work before locking implementation details.

## D-005 — Build Zero as a product, reuse OpenClaw as upstream runtime

- **Status:** SUPERSEDED for the UI stack by D-012 and D-015; the product-ownership and OpenClaw-runtime principles remain.
- **Decision:** The product is named Zero AI and owns its UX, product structure, and extensions. Reuse the pinned OpenClaw runtime and selected OpenDots/OpenMausBot patterns instead of wholesale repository merging or a clean-room rewrite. The CopilotKit prototype was retired in D-015.
- **Reason:** Satisfy the user's request for a real Zero product while maximizing reliable code reuse and minimizing maintenance/load.

## D-006 — Low-resource execution

- **Status:** ACCEPTED.
- **Decision:** Keep shallow/partial source checkouts; do not install dependencies, download model weights, pull computer VM images, or run concurrent heavy builds before the owner approves a build-readiness packet. Preparation remains unrestricted by that gate.

## D-008 — OpenClaw Gateway WS RPC is the primary Zero UI transport

- **Status:** ACCEPTED for UI-01 design and UI-02 prototype; live compatibility remains unproven.
- **Decision:** Use Gateway WS RPC for UI chat sends, session lifecycle, and event subscriptions. Keep OpenAI-compatible HTTP as a backend compatibility/debug surface only; the UI must not depend on it for sessions/tool events. Use one user-facing thread per OpenClaw session with the proposed zero-thread UUID key, subject to live/schema verification of the WS session argument.
- **Constraints:** One assistant text projection only; reconnect refetches canonical history because events are not replayed; sub-agent work is nested activity, not a user thread. Resolve browser credential custody before any live browser-to-Gateway connection.
- **Evidence:** reports/ui/bridge-spike.md §§4–7, 10; reports/backend/mvp-backend.md §§5–6.

## D-009 — Computer takeover uses a Zero plugin gate plus a separate global stop

- **Status:** ACCEPTED as architecture direction; API details and behavior require Qoder review and live proof.
- **Decision:** Keep upstream OpenClaw unmodified. A Zero plugin may expose a zero.computer.control Gateway method and block the operator's computer tool during a human hold through the documented tool-policy hook. Human hold refuses actions; it does not queue or pause a run. Keep run interruption and gateway.nodes.commands.deny as distinct emergency-stop layers.
- **Constraints:** Plugin policy does not cover raw node.invoke clients or in-flight native actions; Qoder must confirm typed method params/results and the computer action taxonomy before implementation. The designated Zero computer environment remains the containment boundary.
- **Evidence:** reports/backend/mvp-backend.md §7; reports/ui/bridge-spike.md §11; Qoder's forthcoming CU-02 contract review.

## D-010 — Zero code ownership paths

- **Status:** ACCEPTED.
- **Decision:** DeepSeek Harness owns E:\zero\backend\; OpenCode owns E:\zero\app\; Qoder owns E:\zero\computer\. The backend may own the OpenClaw-hosted policy plugin under backend/; Qoder owns the separate computer worker/desktop integration under computer/. upstream/ remains read-only.
- **Reason:** Establish non-overlapping implementation areas while allowing contracts to meet at the documented Gateway/plugin boundary.
- **Superseded:** Backend ownership moved to Qoder by D-013; retain this entry as historical provenance for the original path split.

## D-011 — Operator code-mode and scope-widening defaults

- **Status:** ACCEPTED for the MVP template; revisit only with live G-G evidence and a concrete product need.
- **Decision:** Keep the Operator's `exec` mode set to `deny` for the MVP. Keep the Zero Policy plugin's code-mode matcher as defense in depth and do not enable Operator exec until the live hold test proves that a code-mode computer action is refused during human takeover and the refusal behavior is understood. Keep `blockedActions: ["escalate_scope"]` in the deployed template.
- **Reason:** A personal assistant should not have a hidden path around the human-control hold. The plugin code-mode path is locally self-tested but not yet loaded in the pinned Gateway; disabling exec for the computer Operator removes that unproven route in the MVP. Scope widening conflicts with the dedicated-environment containment decision D-003, and no MVP requirement currently needs it.
- **Revisit when:** G-G confirms the actual host behavior and the owner has a concrete need for Operator exec or scope escalation. Any change remains a visible template/config change.
- **Evidence:** `reports/backend/build-readiness.md`; Qoder's 2026-10-23 O7/O8 review in `AGENT_CHAT.txt`.

## D-012 — One Zero UI, based on OpenClaw Control UI

- **Status:** ACCEPTED by owner direction, 2026-10-23.
- **Decision:** The canonical Zero product is one integrated UI built from the existing OpenClaw Control UI as its starting shell. Integrate selected OpenDots and OpenMausBot UI capabilities into that same application/codebase after checking compatibility and license obligations. Do not ship the current standalone CopilotKit/OpenDots-derived assistant as a second UI. CopilotKit is a client/server library, not an AI model or required external service; retain it only if a concrete capability cannot be integrated through the OpenClaw UI with less cost. The default is to migrate/replace its chat path and then remove unused CopilotKit runtime/SDK dependencies.
- **Runtime/data:** Keep OpenClaw Gateway as the sole agent runtime, model gateway route, and canonical session/history source. Do not add a second conversation database or a separate assistant backend. Zero-owned code may provide UI extensions/adapters inside the one application.
- **Implementation constraint:** `upstream/openclaw` stays read-only. OpenCode must inspect the pinned Control UI extension/packaging seams and existing Zero app before choosing a low-diff integration. OpenClaw's Control UI is Solid while OpenDots-derived `app/` is React, so do not claim source components can be directly mixed without proof. Prefer using the Control UI shell and adapting only selected capability code/patterns into its native extension surface; if a small React mount is demonstrably cheaper, keep it inside the same product window and avoid parallel navigation/chat/session stacks.
- **Current state/next action:** OpenCode has implemented the first `app/zero-control-ui/` native slice and passed its local bundle build. Qoder validates plugin-loader/runtime activation; OpenCode then extends the same shell with native personalization/timeline surfaces. Qoder keeps backend/session and computer contracts single-source; the designated isolated desktop remains required for live computer actions.
- **Supersedes:** D-004 and D-007 only where they imply the standalone CopilotKit/OpenDots-derived interface is Zero's canonical product UI. Their session, protocol-bridge, and selective-reuse evidence remains valid.

## D-013 — Backend ownership reassigned to Qoder

- **Status:** ACCEPTED by owner direction, 2026-10-23.
- **Decision:** DeepSeek Harness is no longer an active project developer. Qoder takes responsibility for maintaining and completing `backend/` and `reports/backend/`, in addition to the existing `computer/` lane. OpenCode remains responsible for `app/` and `reports/ui/`. ChatGPT owns senior integration/acceptance.
- **Preservation:** Existing backend source/config/plugin/tests/reports created during DeepSeek's work remain in place unless Qoder verifies a specific file is obsolete and documents its replacement. Do not bulk-delete backend work or runtime data based only on author identity.
- **Coordination:** Qoder first verifies the current shipped files and actual runtime state, then continues BE-02 acceptance and BE-03 in small steps. One heavy build/install at a time; coordinate with OpenCode via `AGENT_CHAT.txt`.
- **Reason:** Owner reports DeepSeek is unavailable and explicitly released Qoder for additional work.

## D-014 — Local loopback Gateway without the token/login gate

- **Status:** ACCEPTED by owner direction, 2026-10-23.
- **Decision:** For the private local Zero instance, run the Gateway loopback-only with `gateway.auth.mode: "none"`; remove the Zero-owned token prompt and token-pull launcher wiring. Do not expose the Gateway beyond loopback. This does not remove computer hold, global stop, recovery, or isolated-environment controls.
- **Evidence:** `reports/ui/auth-ui-audit.md`, `reports/ui/integration-mvp.md`, OpenCode live report at the end of `AGENT_CHAT.txt`.

## D-015 — Native Control UI is the only Zero product UI; legacy bridge removed

- **Status:** IMPLEMENTED under D-012 on 2026-10-25; owner acceptance remains with the Senior Developer.
- **Decision:** Zero's product UI is the native `app/zero-control-ui` plugin inside the OpenClaw Control UI. The legacy React/CopilotKit/AG-UI client, its Hono runtime, the Intelligence-style thread registry/route guard, the unverified desktop relay, and the Vite/`5173`/`4317` startup path are removed from the product and dependency graph. `app/src/bridge/` is retained only as a reusable, non-running Gateway bridge library (WS RPC, device pairing, config validation); it owns no UI, transcript, or session store.
- **Reason:** The old CopilotKit panel fetched `/api/copilotkit/threads`, which `runtime-scope.ts` intentionally rejected with `403` because the Intelligence thread store was disabled. The correct fix is to remove the second product path, not to weaken Gateway authorization or embed credentials. Native Gateway sessions and chat are the single source of truth and already provide the required history, empty states, and reconnect behavior.
- **Constraints:** Keep `upstream/` read-only; keep the fresh profile's providers, secrets, model routes, and session history unchanged; never place credentials in browser code, logs, or committed files. A Gateway restart is required before a live profile serves a newly built plugin generation; that activation remains owner-gated.
- **Evidence:** `app/README.md`, `app/src/bridge/README.md`, `app/test/bridge.test.mjs`, `app/zero-control-ui/test/product-path.test.mjs`, `reports/ui/provider-manager-ui.md` §22, and `reports/ui/integration-mvp.md` 2026-10-25 update.

### D-015 addendum — 2026-10-25 product-surface consolidation

- **Single chat:** Zero (the Lead agent) is the only user-facing conversation. Researcher and Operator remain internal specialists reached through Zero's delegation flow; the Team page describes them as internal, offers no chat button, and renders their canonical Gateway sessions as read-only delegated activity. Direct specialist chat routes and sidebar entries are hidden/re-targeted. No second transcript store is created.
- **Hidden host surfaces:** Debug, Logs, Updates, and the upstream About page are removed from the Zero surface with the established host seam (CSS suppression + capture-phase route interceptor). Backend logging, audit records, security controls, and diagnostics remain intact.
- **Native About Zero:** `/settings/about` re-targets to a Zero-owned page (name Zero, description "Private assistant for local Gateway-backed work") with no upstream marketing, repository, community, or release links. Legal/dependency notices stay in `app/NOTICE` and `app/zero-control-ui/THIRD_PARTY_NOTICES.md`.
- **No upstream outbound surface:** upstream marketing/community anchors are blocked and hidden; the plugin bundle has no direct network or browser-storage primitive. The host update framework is retained as a local no-op/extension point for a future Zero update server.
- **Bridge retention rationale:** `app/src/bridge/` is **not** imported by `browser.js` or the built bundle and is not a running product path. It is retained because (a) it is the tested reusable Gateway contract library (3/3 tests), (b) it has no build output or runtime activation, (c) the working tree is uncommitted, so destructive deletion is unsafe without an explicit owner decision, and (d) it may serve future local clients without rebuilding the WS/pairing/config contracts. It must be removed or archived only after an owner decision plus a replacement/retirement plan for its tests and documented contracts.
- **Evidence:** `reports/ui/white-label-and-single-chat.md`; `reports/ui/provider-manager-ui.md` §22.7; `app/zero-control-ui/test/product-surface.test.mjs`; `app/zero-control-ui/src/shared/routes.js`.
