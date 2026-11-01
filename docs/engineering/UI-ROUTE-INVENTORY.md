# Zero AI — Control UI Route Inventory & Asset Mount Architecture

**Document ID:** `UI-ROUTE-INVENTORY-V1`  
**Host Authority:** `ZeroNativeHost` (`services/host/native-gateway.mjs`)  
**Target Port:** `18789`  
**Control Plane Root:** `dist/web`  

---

## 1. Executive Summary

This inventory catalogs every web route, static asset mount, and SPA fallback endpoint served by the Zero Native Host control plane on port `18789`.
The native HTTP router operates independently of legacy runtime wrappers, serving compiled web distribution assets from the first-party `dist/web` directory with fallback to `app/zero-control-ui/dist`.

---

## 2. All 29 Primary Application & Settings Routes

Every route listed below is served by the first-party SPA router with HTTP status `200 OK`, `Content-Type: text/html; charset=utf-8`, and automatic dynamic asset resolution (`<base href="/">` root injection).

| Index | Route Path | Title / Surface | Description | HTTP Status | Content-Type |
|---|---|---|---|---|---|
| 01 | `/` | Zero Control Home | Root navigation redirect / app shell | `200 OK` | `text/html; charset=utf-8` |
| 02 | `/chat` | Zero Active Chat | Autonomous AI multi-turn conversational view | `200 OK` | `text/html; charset=utf-8` |
| 03 | `/chat/zero` | Zero Personal Commander | Personal AI commander chat and desktop execution interface | `200 OK` | `text/html; charset=utf-8` |
| 04 | `/settings` | Settings Overview | Configuration hub dashboard | `200 OK` | `text/html; charset=utf-8` |
| 05 | `/settings/general` | General Settings | Base system language, startup, and workspace options | `200 OK` | `text/html; charset=utf-8` |
| 06 | `/settings/model-providers` | Model Providers | Cloud and local LLM/VLM provider credentials & base URLs | `200 OK` | `text/html; charset=utf-8` |
| 07 | `/settings/models` | Models Configuration | Model routing, alias mapping, and fallback cascade | `200 OK` | `text/html; charset=utf-8` |
| 08 | `/settings/agents` | Agent Management | Agent identity, system prompts, and capabilities | `200 OK` | `text/html; charset=utf-8` |
| 09 | `/settings/sessions` | Session Store | Active and archived conversation transcripts & SQLite states | `200 OK` | `text/html; charset=utf-8` |
| 10 | `/settings/memory` | Long-Term Memory | Semantic and episodic persistent memory store inspector | `200 OK` | `text/html; charset=utf-8` |
| 11 | `/settings/automation` | Durable Automation | Background cron jobs, recurring actions, and run history | `200 OK` | `text/html; charset=utf-8` |
| 12 | `/settings/tasks` | Task State Machine | Autonomous multi-step background tasks and state inspector | `200 OK` | `text/html; charset=utf-8` |
| 13 | `/settings/computer-control` | Desktop Automation | Windows mouse, keyboard, and app automation permissions | `200 OK` | `text/html; charset=utf-8` |
| 14 | `/settings/safety` | Safety & Arbitration | Human takeover hold leases, emergency stop, and audit logs | `200 OK` | `text/html; charset=utf-8` |
| 15 | `/settings/connections` | Active Connections | WebSocket presence, client tokens, and role scopes | `200 OK` | `text/html; charset=utf-8` |
| 16 | `/settings/appearance` | Appearance & Themes | Light/dark theme selection, fonts, and layout density | `200 OK` | `text/html; charset=utf-8` |
| 17 | `/settings/shortcuts` | Keyboard Shortcuts | Global hotkeys, escape triggers, and safety bailouts | `200 OK` | `text/html; charset=utf-8` |
| 18 | `/settings/voice` | Voice & Audio | TTS playback, speech generation, and WASAPI audio settings | `200 OK` | `text/html; charset=utf-8` |
| 19 | `/settings/notifications` | Notifications | Desktop toasts, audio alerts, and task completion notices | `200 OK` | `text/html; charset=utf-8` |
| 20 | `/settings/about` | About Zero AI | Version info, build commit, license, and system diagnostics | `200 OK` | `text/html; charset=utf-8` |
| 21 | `/settings/plugins` | Plugin Ecosystem | Zero Control UI plugins, native hooks, and extensions | `200 OK` | `text/html; charset=utf-8` |
| 22 | `/settings/system` | System Status | Node.js runtime, memory footprint, PID, and uptime | `200 OK` | `text/html; charset=utf-8` |
| 23 | `/settings/diagnostics` | Diagnostics | Live RPC latency, token counters, and error trace logs | `200 OK` | `text/html; charset=utf-8` |
| 24 | `/settings/logs` | Audit Logs | Capability execution events, safety decisions, and turns | `200 OK` | `text/html; charset=utf-8` |
| 25 | `/settings/security` | Security & Auth | Gateway tokens, local loopback protection, and CSP headers | `200 OK` | `text/html; charset=utf-8` |
| 26 | `/settings/privacy` | Privacy & Telemetry | Zero data retention rules, telemetry block, and isolation | `200 OK` | `text/html; charset=utf-8` |
| 27 | `/settings/data-management` | Data Management | SQLite vacuuming, session export, and storage quotas | `200 OK` | `text/html; charset=utf-8` |
| 28 | `/settings/updates` | Platform Updates | Local build status, git branch, and release versioning | `200 OK` | `text/html; charset=utf-8` |
| 29 | `/settings/developer` | Developer Tools | Raw JSON-RPC console, mock dispatch, and inspection | `200 OK` | `text/html; charset=utf-8` |

Additional client-side routes handled by the SPA router include:
- `/settings/advanced`
- `/agents`
- `/sessions`

---

## 3. Static Asset Mount Paths & MIME Contracts

| Mount Prefix | Underlying Root | Typical Files | MIME Type | Cache Policy |
|---|---|---|---|---|
| `/assets/*` | `dist/web/assets` | `index-*.js`, `control-ui-*.css`, `zero-control-ui.js`, `zero-control-ui.css` | `application/javascript`, `text/css` | `public, max-age=31536000, immutable` (hashed) |
| `/themes/*` | `dist/web/themes` | `claw.css`, `knot.css`, `dash.css`, `tide.css`, etc. | `text/css; charset=utf-8` | `public, max-age=3600` |
| `/fonts/*` | `dist/web/fonts` | `.woff2`, `.woff`, `.ttf` | `font/woff2`, `font/woff`, `font/ttf` | `public, max-age=31536000, immutable` |
| `/favicon.svg` | `dist/web/favicon.svg` | Zero Emerald SVG Icon | `image/svg+xml` | `public, max-age=86400` |
| `/manifest.webmanifest`| `dist/web/manifest.webmanifest` | PWA web manifest | `application/json; charset=utf-8` | `public, max-age=3600` |
| `/avatar/*` | Builtin SVG generator | Dynamic Zero avatar icon | `image/svg+xml` | `public, max-age=86400` |
| `/control-ui-config.json` | Synthetic JSON | Control UI client bootstrap config | `application/json; charset=utf-8` | `no-cache, must-revalidate` |
| `/plugins/control-ui/*` | `dist/web/plugins/control-ui` | Zero Control UI plugin bundle | `application/javascript`, `text/css` | `public, max-age=31536000, immutable` |
| `/__openclaw__/plugins/control-ui/*` | `dist/web/__openclaw__/plugins/control-ui` | Legacy plugin bundle namespace | `application/javascript`, `text/css` | `public, max-age=31536000, immutable` |

---

## 4. Security & Isolation Controls

1. **Path Traversal Protection:**
   All requested asset paths are decoded and resolved against authoritative roots (`dist/web`, `app/zero-control-ui/dist`). Any path attempting directory breakout (`..`, `%2e%2e`, null bytes) is rejected with `404 Not Found`.
2. **Security Headers:**
   - `X-Content-Type-Options: nosniff` (applied on all responses)
   - `Access-Control-Allow-Origin: *` (CORS enabled for localhost/127.0.0.1 control plane)
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD`
   - `Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With`
3. **SPA Relative Path Rewriting:**
   When delivering `index.html`, `<base href="/">` is injected into `<head>`, and relative references to `./assets/` are normalized to `/assets/`, guaranteeing nested routes (`/settings/model-providers`, `/chat/zero`) resolve stylesheets and script chunks flawlessly.
