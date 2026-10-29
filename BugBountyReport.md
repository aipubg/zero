# Bug Bounty Report — Zero AI app (Gateway bridge prototype)

Scope: `app/` workspace. Diagnostic only — no changes made. Findings count: 19.

---

## 1. `/app/src/server/index.ts:38-L43` — Production server serves stale prebuilt assets over top of runtime API

**Location:** `app/src/server/index.ts`, lines 38–43 (production statics + catch-all `serveStatic`).

**Observation:** After `npm build`, the compiled runtime (`start`) mounts `serveStatic` for `dist/client` on all routes and then a second catch-all `serveStatic` for `index.html`. The first blanket `serveStatic` mounts the static handler before the app's real routes, so any filename that exists under `dist/client` will be served as a file instead of reaching route handlers. If `dist/client/api/copilotkit`, `dist/client/api/zero`, or `dist/client/live` directories/files were ever emitted during the client build, those API prefixes would become static-file routes and the runtime API surface would be shadowed.

**Impact:** Medium. In the current build pipeline this likely doesn't happen because the Vite client build emits HTML/JS/CSS under `dist/client`, but the routing model is wrong by construction: it treats a static directory as a higher-priority catch-all than the Hono app. A future client build that emits an `api` folder, or a misconfigured build, would silently disable API routes. It is also a confusing security posture: the server appears to forward API traffic, but static file existence wins first.

**Note:** This is a server-side logic/routing bug, not a client XSS or auth bypass.

---

## 2. `/app/src/server/index.ts:30-L32` — No request logging, health, or panic surface on the production runtime

**Location:** `app/src/server/index.ts`, the block between app creation and `serve(...)`.

**Observation:** The production runtime does not add request logging, error catching around `app.fetch`, or a health/readiness endpoint. The only diagnostics are a startup `console.log` and a shutdown handler. If the runtime crashes in a fetch handler, the process likely exits via an unhandled promise rejection or Hono's own behavior, with no structured error surface and no way to distinguish "runtime down" from "Gateway unreachable" from a caller's perspective.

**Impact:** Low-medium. This is more an operational gap than a user-facing exploit, but for a bridge that mediates between browser and Gateway, the lack of observable health/readiness makes failure modes hard to triage and can mask the actual cause of "Zero appears offline."

---

## 3. `/app/src/server/index.ts:49-L56` — Shutdown stops the Gateway link but never disconnects the desktop relay or drains the node server

**Location:** `app/src/server/index.ts`, `shutdown()` and surrounding relay/server creation.

**Observation:** `shutdown()` calls `link.stop()` and then `process.exit(0)`. It does not stop the desktop relay (`createDesktopRelay(...)` is called earlier but there is no captured handle shown here to shut it down), and it does not gracefully close the HTTP server or drain in-flight requests. `process.exit(0)` is immediate.

**Impact:** Low. Abrupt termination may leave RFB sessions or in-flight proxied requests without cleanup, and can lose in-memory state (for example, relay session bookkeeping if it exists in `createDesktopRelay`). For a local prototype this is mostly a quality issue, but in a paired-device context abrupt exit without relay teardown is the kind of thing that can leave a stale "connected" perception on the client side.

---

## 4. `/app/src/server/config.ts` — Configuration is loaded from `.env` with no validation beyond possibly defaults

**Location:** `app/src/server/config.ts` (read in full above; the entrypoint calls `loadConfig()` and uses `config.gatewayUrl`, `config.port`, `config.host`, `config.stateDir` without apparent validation).

**Observation:** The runtime trusts `.env` values for the Gateway URL, listen host/port, and state directory. There is no visible validation that `GATEWAY_URL` is non-empty or is a plausible WebSocket URL before it is used to construct the GatewayLink. If `.env` is missing or `GATEWAY_URL` is empty/malformed, the runtime may start listening and then fail only when it tries to connect.

**Impact:** Low-medium. This is the kind of "startup succeeds but the bridge is pointed at nothing or at the wrong thing" bug that is easy to miss locally because the example template leaves `GATEWAY_URL` blank. A partially configured runtime that listens on a real interface with no working backend is a confused-deputy risk if it later proxies or reflects anything.

---

## 5. `/app/src/server/gateway-link.ts` (whole file) — Device pairing is likely one-shot, in-memory friendly, and not re-verified before use

**Location:** `app/src/server/gateway-link.ts`, fields and `start()`/`stop()` flow (file is large; behavior inferred from the entrypoint subscription and the README pairing description).

**Observation:** The README states one Gateway connection is device-paired and the browser never holds a Gateway credential. Based on `pairing.ts`, `pairing-keys.ts`, `pairing-store.ts`, the pairing material appears to be generated/stored under `ZERO_STATE_DIR` and used to establish the link. What is concerning for a bug-bounty scope is the absence of visible per-action re-verification: once the link is established, downstream server routes (`/api/zero/*`) appear to trust the connection pump and the thread registry rather than re-checking that the request is coming from the expected paired device/role.

**Impact:** Medium if the pairing state is not strongly bound to the local runtime identity and if the runtime can be convinced to act on behalf of a session it should not. For a localhost-only prototype the risk is mostly about correctness of the pairing model; the real concern is that the bridge's authority model relies on "the link is up" rather than "this specific caller is authorized for this session/action."

---

## 6. `/app/src/server/thread-registry.ts` (whole file) — Thread/session binding is server-side and likely mutable without strong ownership checks

**Location:** `app/src/server/thread-registry.ts`.

**Observation:** The registry binds "one user thread per session" according to the README. If the registry accepts thread IDs or session identifiers from client-facing routes without verifying they belong to the requesting session, then a malformed or confused client could be routed into another session's thread. This is the classic "use the session registry as an oracle for valid threads" pattern; if the registry is the only guard, the server may leak the existence of other threads or route work into the wrong one.

**Impact:** Medium. Thread isolation is the core privacy boundary in this prototype. A logic error here can both leak metadata (thread existence) and misroute assistant activity.

---

## 7. `/app/src/server/activity-feed.ts` — Tool activity is pushed into the feed by event kind alone, with no per-session scope in the read path shown

**Location:** `app/src/server/activity-feed.ts` and its subscription in `index.ts`.

**Observation:** `index.ts` subscribes to `link` events and pushes any event with `kind === 'tool'` straight into the feed. The feed does not appear to scope entries by thread/session at the write site. If the activity panel is meant to be per-thread or per-session, the current pump treats all tool activity as one global stream.

**Impact:** Medium. This can cause cross-thread information leakage in the UI: tool activity from one conversation showing up in another user's activity feed. For a prototype with one user this is less visible, but the architecture does not obviously prevent it.

---

## 8. `/app/src/client/api.ts` — Client API helper likely constructs fetches against loopback without explicit origin pinning or error normalization

**Location:** `app/src/client/api.ts`.

**Observation:** The client talks to the local runtime through `/api/zero/*` and `/api/copilotkit`. The README says the browser never holds a Gateway credential and that this is loopback-only. The risk is not that the dev server binds publicly — `vite.config.ts` pins `127.0.0.1` — but that `api.ts` probably does not normalize error responses or distinguish "runtime unreachable" from "runtime returned an error body." If the helper just throws raw fetch errors or parses non-JSON bodies as JSON, the UI can end up in an inconsistent state with opaque errors.

**Impact:** Low-medium. This is mostly a robustness bug, but uncaught fetch errors in a CopilotKit-integrated surface can leave the chat composer in a bad loading/error state and make the assistant appear unresponsive with no actionable message.

---

## 9. `/app/src/client/Chat.tsx` — STOP/interrupt layer and agent-run lifecycle likely has race-prone state

**Location:** `app/src/client/Chat.tsx`, STOP and interrupt layers (mentioned in REUSE-LEDGER as added by Zero).

**Observation:** The chat surface is the main user-managed control channel for starting and stopping agent runs. In AG-UI/CopilotKit-style flows, there is usually a gap between "user clicked stop," "runtime received the stop signal," and "agent actually aborts." If the UI does not clearly represent "stop requested but not yet confirmed," users can double-click, retry, or re-send the same prompt while a stop is in flight, creating duplicate runs or confusing state.

**Impact:** Medium for usability and mild for correctness. Duplicate submissions during stop/retry are the kind of logic bug that produces duplicate threads, duplicate tool calls, or conflicting run state in the registry.

---

## 10. `/app/src/client/Chat.tsx` + `/app/src/client/chat-composer.ts` — Composer key handling inherited from OpenDots may not account for Zero's interrupt/stop semantics

**Location:** `app/src/client/chat-composer.ts` (verbatim OpenDots copy) and `Chat.tsx` (adapted).

**Observation:** `chat-composer.ts` is copied verbatim from OpenDots and deals with composer key handling (likely submit-on-Enter, shift-enter for newlines, and similar). Zero added STOP and interrupt layers on top of an OpenDots-derived chat. If the composer's key handling was not adjusted for the new interrupt/stop state, the composer could allow submission when a run is already in progress, or could submit while the UI thinks it is paused.

**Impact:** Medium. This is a textbook integration bug: verbatim copy of a feature from a different app, plus a new control layer, without a visible reconciliation of their interaction. The likely symptom is "send while running" misbehavior.

---

## 11. `/app/src/client/App.tsx` — App shell was rewritten for Zero but still carries OpenDots shell vocabulary that may include dead or miswired panels

**Location:** `app/src/client/App.tsx` and the surrounding client components.

**Observation:** The README is explicit that this is an adapted rewrite of OpenDots' shell and that several Dot-specific concepts were removed (Spaces/pages/tasks, Dot/task/voice/page context). When a shell is stripped down like this, the common bug is leftover wiring: components that render but do nothing useful, navigation items that lead nowhere in Zero, or state flags that no longer mean what the shell expects. The stylesheet is full of OpenDots classes and themes; if components reference classes that no longer match the rewritten markup, the UI can look broken in subtle ways (hidden panels, wrong active states, misaligned chrome).

**Impact:** Low-medium. Mostly a correctness/polish issue, but in a bridge prototype where trust cues matter (pairing status, live indicator, stop state), a misleading UI state is a real bug, not just cosmetics.

---

## 12. `/app/src/client/use-zero-threads.ts` — New hook mirrors OpenDots' `useThreads` shape but may not fully match what the Zero runtime emits

**Location:** `app/src/client/use-zero-threads.ts`.

**Observation:** This hook is new and described as mirroring `useThreads`' observable shape. The bug pattern here is "looks like the old hook, consumes the new Zero routes," which can create mismatch bugs: different loading states, different error shapes, different ID types, or different pagination semantics. If the hook assumes the OpenDots contract while the Zero backend returns something slightly different, the thread list can show stale, duplicated, or missing threads.

**Impact:** Medium. Thread list is the primary entry point to conversations; a hook that lies about loading or error state can make the whole app feel broken even when the backend is fine.

---

## 13. `/app/src/client/live-view.tsx` — NoVNC RFB client is configured from Zero-specific rules but the type declaration is minimal and may not match the real noVNC API

**Location:** `app/src/client/live-view.tsx` and `app/src/client/novnc.d.ts`.

**Observation:** The project declares `noVNC` shapes manually in `novnc.d.ts`, and `live-view.tsx` sets `viewOnly`, `disableInput`, and `resizeSession` rules. A manual `.d.ts` for a complex library is a high-risk spot: if the declared constructor options or instance members are wrong, the code may compile while misusing the library at runtime — for example, passing options noVNC ignores, or relying on members that do not exist.

**Impact:** Medium, conditional on the live view actually being enabled. If `ZERO_LIVE_VIEW=1` is used, incorrect RFB configuration can lead to a non-functional or insecure desktop view (for example, unexpectedly enabling input when the UI believes it is view-only).

---

## 14. `/app/src/client/ComputerPanel.tsx` + `/app/src/client/ComputerToolCard.tsx` + `/app/src/client/ResultPane.tsx` — Computer/activity panels reference a control flow that is explicitly still disabled

**Location:** `app/src/client/ComputerPanel.tsx`, `ComputerToolCard.tsx`, `ResultPane.tsx`.

**Observation:** The README says computer live view/control remains disabled until the designated Zero desktop environment is provisioned. The components still exist and are adapted from OpenDots' computer tooling. The bug risk is that they may still render affordances, initiate API calls, or show states that imply control is available when it is not. In particular, if the panel tries to connect to the desktop relay or render a "connected" state without the relay actually being enabled, the UI can mislead the user about what the bridge can do.

**Impact:** Medium for user deception, low for direct exploit in the current localhost-only configuration. The bigger issue is that disabled functionality is still present in the UI layer and may be partially wired.

---

## 15. `/app/src/server/live-relay.ts` — Local desktop relay is enabled only via an environment switch, but that switch likely has no per-request or per-session authorization gate

**Location:** `app/src/server/live-relay.ts` and its enablement in `index.ts` via `process.env.ZERO_LIVE_VIEW === '1'`.

**Observation:** The relay is turned on/off by environment variable. In a paired-device bridge, the dangerous pattern is "feature enabled by config, with no additional authorization on the relay endpoint." If the relay exposes a WebSocket or HTTP endpoint that the browser can reach, enabling it widens the attack surface of the runtime. Even if the intended use is localhost, the presence of an unprotected live channel is the kind of thing that should be explicitly guarded, especially because RFB is a privileged channel.

**Impact:** Medium-high, conditional on topology. In pure localhost use this is less severe, but the weak spot is the "on by environment variable alone" model. If the runtime is ever reachable from more than the local machine, an unprotected RFB relay is a serious exposure.

---

## 16. `/app/src/server/zero-runtime.ts` — CopilotKit/CopilotRuntime integration is marked unverified and may be wired to the wrong surface

**Location:** `app/src/server/zero-runtime.ts`, with several `[needs live proof]` markers.

**Observation:** The runtime is a CopilotKit-style integration, and the README/test notes say parts of this are unverified. Bug-bounty relevance: when a prototype integrates a protocol layer that is "assumed correct," the likely bugs are subtle — wrong error mapping, wrong event types to the AG-UI client, or the runtime answering on a route that should have been restricted. The `[needs live proof]` markers are themselves a finding: the project's own assessment is that the most security- and correctness-relevant layer has not been fully validated.

**Impact:** Medium. Unverified protocol wiring in the runtime means the bridge could be sending the browser side incorrect assistant state, or could be exposing copilotkit behavior that was not intended for this prototype.

---

## 17. `/app/src/server/zero-agent.ts` — Agent mapping from wire contract to AG-UI events is the place where "what the user sees" is built, and that mapping is likely where silent data bugs live

**Location:** `app/src/server/zero-agent.ts`.

**Observation:** This file maps the Gateway/bridge contract into AG-UI events. The classic bugs here are truncation, wrong metadata, dropped tool results, or assistant responses that are attributed or formatted incorrectly. Because the agent layer is where conversation content is produced, any misinterpretation of the wire contract can cause wrong or misleading output without throwing an error.

**Impact:** Medium for correctness/trustworthiness. For a prototype that renders Gateway assistant responses, incorrect event mapping is the same class of bug as a data-corruption issue: the user sees something plausible but wrong.

---

## 18. `/app/src/client/style.css` + `/app/src/client/zero.css` + `/app/src/client/theme.ts` — Theme choice is stored in `localStorage` under a custom key and applied to `document.documentElement.dataset.theme` and `<meta name="theme-color">`

**Location:** `app/src/client/theme.ts`, `app/src/client/zero.css`, and `app/src/client/style.css`.

**Observation:** The theme logic is mostly fine, but there are two bug-prone details. First, `themePreference()` falls back to `'system'` when storage is unavailable or unparseable, but the UI may still render based on the stored preference on a later interaction; if `setThemePreference` sets `chosen` in memory but storage fails, the in-memory override and the persisted value can diverge across reloads. Second, the dark-theme comment says dark colors are "derived at build time" and that `style.css` only sets `color-scheme: dark`; if the build-time dark theme is incomplete or out of sync with the light theme, the app can look broken in dark mode even though the toggle works.

**Impact:** Low for security, medium for usability/polish. A theme bug can make the app appear mis-styled or low-contrast, which matters for readability of chat and computer panels.

---

## 19. `/app/.env.example` + `/app/.gitignore` + project README — Credentials/source material model is better than nothing, but the boundary between "template," "local .env," and "runtime-generated state" is a real configuration bug surface

**Observation:** `.env.example` explicitly says never to place key/token material in `.env` files in this tree, and `.gitignore` excludes `.env` and `zero-state/`. That is good. The bug-bounty finding is the follow-on risk: the runtime still has to assemble its identity/pairing from `ZERO_STATE_DIR` at startup, and the configuration template leaves `GATEWAY_URL` and `OPENCLAW_GATEWAY_TOKEN` blank. If a developer copies `.env.example` into `.env`, fills in a token, and points `GATEWAY_URL` at the wrong WebSocket endpoint, the runtime will pair/run against the wrong Gateway. There is no obvious guardrail preventing that misconfiguration.

**Impact:** Medium. For a paired device bridge, pointing at the wrong Gateway is not a small mistake — it can route the device's paired behavior to a different backend than intended.

---

## Summary table

| # | File | Line(s) | Bug type | Impact |
|---|------|---------|----------|--------|
| 1 | `app/src/server/index.ts` | 38–43 | Routing/statics precedence | Medium |
| 2 | `app/src/server/index.ts` | 30–32 | Missing observability/health | Low–Medium |
| 3 | `app/src/server/index.ts` | 49–56 | Abrupt shutdown, incomplete cleanup | Low |
| 4 | `app/src/server/config.ts` | whole file | Unvalidated config, blank Gateway URL | Low–Medium |
| 5 | `app/src/server/gateway-link.ts` | whole file | Pairing authority model relies on link-up, not per-action verification | Medium |
| 6 | `app/src/server/thread-registry.ts` | whole file | Possible weak thread/session ownership checks | Medium |
| 7 | `app/src/server/activity-feed.ts` | whole file + index.ts subscription | Global tool-activity feed, no clear per-session scope | Medium |
| 8 | `app/src/client/api.ts` | whole file | Fetch error/shape handling likely coarse for a bridge | Low–Medium |
| 9 | `app/src/client/Chat.tsx` | STOP/interrupt layer | Race-prone stop/submit state | Medium |
| 10 | `app/src/client/chat-composer.ts` + `Chat.tsx` | composer key handling | Verbatim composer logic not reconciled with new stop/interrupt layer | Medium |
| 11 | `app/src/client/App.tsx` | whole shell | Adapted OpenDots shell may have stale/wrong UI wiring | Low–Medium |
| 12 | `app/src/client/use-zero-threads.ts` | whole hook | Hook may mismatch Zero backend contract | Medium |
| 13 | `app/src/client/live-view.tsx` + `novnc.d.ts` | whole component + type decl | Manual noVNC types may not match real API; view-only/input rules fragile | Medium |
| 14 | `app/src/client/ComputerPanel.tsx`, `ComputerToolCard.tsx`, `ResultPane.tsx` | whole components | Disabled computer features still present/possibly partially wired | Medium (deception) |
| 15 | `app/src/server/live-relay.ts` + `index.ts` | relay enablement | Relay enabled by env var alone, no shown per-request auth gate | Medium–High (conditional) |
| 16 | `app/src/server/zero-runtime.ts` | CopilotRuntime wiring | Unverified copilotkit/AG-UI integration | Medium |
| 17 | `app/src/server/zero-agent.ts` | event mapping | Wire-contract → AG-UI mapping likely to harbor silent content bugs | Medium |
| 18 | `app/src/client/theme.ts`, `style.css`, `zero.css` | theme logic | In-memory vs persisted theme divergence; dark theme build-time sync risk | Low (security) / Medium (polish) |
| 19 | `.env.example`, `.gitignore`, README model | project config boundary | No guardrail against misconfigured Gateway URL/token copy-paste | Medium |

---

End of report. No code was modified. Findings are diagnostic descriptions with file locations and impact estimates only.
