# Reuse ledger — Zero app workspace

Upstream checkouts are read-only. This file records file-level provenance.
`upstream/openclaw` @ `013240515205573248c27ab6b8eec7303f0da1a8` (MIT);
`upstream/opendots` @ `8091324942b86789ed0da7facbee855145d933b0` (MIT) was used
by the retired prototype and is no longer part of the product.

## Current product: native Control UI plugin

| Zero file | Origin | Kind | Notes |
|---|---|---|---|
| `zero-control-ui/browser.js` + `src/` modules | Zero-authored | new | Plain DOM/ES modules; no React, CopilotKit, AG-UI, or OpenDots runtime |
| `zero-control-ui/src/computer/hold.js`, `src/native-surfaces.js` | Zero-authored; pattern reference: OpenMausBot `src/components/computer-takeover.ts` (Apache-2.0) | pattern-only | Hold hand-back on `pagehide` and on leaving `/systems`; no source lines copied; see `zero-control-ui/THIRD_PARTY_NOTICES.md` |
| `zero-control-ui/runtime-core.mjs` | Zero-authored | new | Six `zero.ui.*` Gateway metadata methods; no credentials stored |
| `zero-control-ui/index.js` | Zero-authored | new | Plugin entry using `openclaw/plugin-sdk` |
| `zero-control-ui/index.css` | Zero-authored | new | Uses the host theme tokens; no copied OpenDots design system |

## Retained bridge library

| Zero file | Origin | Kind | Notes |
|---|---|---|---|
| `src/bridge/gateway-link.ts` | OpenClaw Gateway client contract + Zero | adapted | WS RPC, chat send/abort/history, roster, computer hold; no UI |
| `src/bridge/pairing.ts`, `pairing-keys.ts`, `pairing-store.ts` | OpenClaw device-pairing contract + Zero | adapted | Ed25519 identity, scoped token storage; never exposes token material |
| `src/bridge/config.ts` | Zero | new | Environment validation for the bridge |
| `src/shared/zero-types.ts` | Zero | new | Bridge wire-contract types |

## Removed prototype (historical, no longer built or shipped)

The following files were deleted on 2026-10-25 after reference checks showed
they were used only by the retired React/CopilotKit prototype:

| Removed file | Origin | Why removed |
|---|---|---|
| `src/client/*` (App, Chat, ThreadList, ComputerPanel, ResultPane, live-view, theme, styles, etc.) | OpenDots (MIT), adapted | CopilotKit/AG-UI product path; native Control UI replaces it |
| `src/server/zero-runtime.ts` | OpenDots `platform.ts`/`app.ts` pattern | CopilotKit Hono runtime; source of the `/api/copilotkit/threads` 403 |
| `src/server/zero-agent.ts` | OpenDots `dot-agent.ts` pattern | AG-UI event projection; native chat owns the transcript |
| `src/server/runtime-scope.ts` | OpenDots | Intelligence route allow/deny guard |
| `src/server/thread-registry.ts` | Zero | CopilotKit thread-to-session binding; Gateway sessions are canonical |
| `src/server/index.ts` | Zero | Started the legacy runtime and Vite stack |
| `src/server/live-relay.ts` | OpenClaw desktop pattern | Unverified second desktop relay; native Desktop panel owns input |
| `src/server/activity-feed.ts` | Zero | Only consumed by the retired runtime; Gateway activity is canonical |
| `index.html`, `vite.config.ts`, `.env.example`, `tsconfig.server.json` | Zero/OpenDots | Legacy build/dev configuration |

Deliberately not copied or retained: OpenDots editor.css, Spaces/page/task/voice
components, Intelligence store/workspace services, local browser-control
service, Slack channels, telemetry, and testing scaffold.
