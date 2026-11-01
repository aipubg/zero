# Zero AI — Official Acceptance & Verification Ledger

**Repository:** `https://github.com/aipubg/zero.git`  
**Evaluation Date:** 2026-11-01  
**Audit Target:** Zero AI Platform (Windows 11, Node.js v24, Port 18789)  
**Historical Release Baseline:** `v2026.11.01-release` (`153891722c5ae4055cf5a0f943fbf7a820bca2dd` - preserved untouched)  
**Corrective Branch:** `fix/security-integrity-hotfix`  
**Status:** **24 PASS / 0 FAIL / 1 BLOCKED / 0 NOT_RUN**  
**Release Gate Recommendation:** Supported as **Zero Local AI Desktop & Agent Automation Platform v2026.11.02** (Standalone Windows Automation & Cloud Model Fabric Scope). External Telegram/Discord channel messaging is classified as **BLOCKED / OPTIONAL INTEGRATION** pending user-supplied bot credentials.

---

## 1. Executive Summary & Gate Status

This document is the official accreditation ledger for Zero AI, adhering strictly to non-negotiable verification rules: zero mock proof, zero synthetic success responses, zero broad process termination, zero token disclosure, and truthful classification.

```
Total Acceptance Scenarios:  25
  ✔ PASS:                     24
  ✖ FAIL:                      0
  ﹣ BLOCKED:                  1  (T22: External Channel Transport - requires user-provided BOT_TOKEN)
  ○ NOT_RUN:                  0
```

### Scope Classification

1. **Fully Supported Core Scope:**
   - Standalone `ZeroNativeHost` on port 18789 with 0 runtime dependencies on legacy openclaw.
   - Real local browser control UI (`/chat/zero` and all 29 `/settings/*` surfaces) verified in Chrome and Edge.
   - Complete WebSocket Protocol 4 RPC engine with server-side role/scope enforcement.
   - Unified Model Fabric with single-pass SSE streaming (1:1 upstream counting) and live switching.
   - Verified Windows desktop automation: Notepad execution with PID-targeted cleanup and UIAutomation read-back.
   - Verified web browser automation: YouTube playback state confirmation (`PLAYING`) and position progression.
   - Multi-step model-driven tool orchestration loop (`chat.send`).
   - SQLite persistent storage for sessions, preferences, semantic memory, cron automations, and recovery sweep.
   - Zero credentials in tracked repository (`scan-secrets.mjs`).

2. **Blocked / User-Dependent Scope:**
   - **T22 (Channel Message Round-Trip):** Real external transport requires live `TELEGRAM_BOT_TOKEN` or `DISCORD_BOT_TOKEN`. In accordance with integrity rules, this scenario is reported truthfully as **BLOCKED**, not simulated or bypassed.

---

## 2. Complete Acceptance Scenario Matrix (T01–T25)

| ID | Scenario Title | Category | Verified Evidence | Sub-Conditions & Integrity Constraints |
|---|---|---|---|---|
| **T01** | Clean installation & environment validation | **PASS** | Node.js v24+, config paths, model provider configurations verified on disk | No missing essential runtime files |
| **T02** | Independent native startup without legacy runtime | **PASS** | Subprocess launched in isolated directory with empty `node_modules`; port 18798 bound; `/health`, `/v1/models`, WebSocket handshake, model inference, and capability execution confirmed | 0 openclaw imports; runs purely on native gateway |
| **T03** | Chat page loads without broken assets | **PASS** | `/chat/zero` HTML shell returns 200 OK; `/assets/zero-control-ui.js` (>100KB) and CSS bundles load cleanly | Asset generation hash `36a42defcd8df5b5112abb20e7ac5632ac511b36de5e755644122d0182bd5e46` |
| **T04** | Settings & UI route catalog, RPC data, form persistence | **PASS** | Real Playwright browser (Chrome & Edge) navigates all 29 routes; form controls and live RPC data validated | Actual DOM component verification |
| **T05** | WebSocket RPC Protocol 4 handshake & contract dispatch | **PASS** | Protocol 4 handshake with auth validation; `sessions.subscribe`, `models.authStatus` return valid frames | No legacy protocol degradation |
| **T06** | Provider catalog reflects actual configured models | **PASS** | `/v1/models` and `models.authStatus` reflect configured NVIDIA Nemotron models (30B, 120B, 550B) | Real catalog match |
| **T07** | Model switching reaches selected provider | **PASS** | Model switch updates runtime state; `/v1/chat/completions` dispatches directly to selected model | Real distinct model invocation |
| **T08** | Normal chat turn produces real model-generated completion | **PASS** | Real inference completion returned with finish_reason `stop` | Real tokens generated |
| **T09** | Streaming produces genuine token deltas with strictly 1 upstream request | **PASS** | Single SSE streaming consumer; upstream request count incremented by exactly 1; accumulated stream text matches payload | No double-inference; single-pass stream |
| **T10** | Multi-step tool orchestration loop with execution feedback | **PASS** | Real model selected tool (`list_windows`), capability executed, observation injected back into model context, grounded final completion produced | Dispatched via `chat.send` through native host |
| **T11** | Safe Notepad automation with verified UIAutomation read-back | **PASS** | Spawns test Notepad process, tracks specific PID, focuses window, types unique token, verifies exact match via UIAutomation, terminates ONLY test PID | `outcome: 'COMPLETED'`, `verified: true`; 0 broad `notepad*` kills |
| **T12** | YouTube browser automation with playback verification | **PASS** | Chrome/Edge navigates to YouTube, physical click on player executed, HTML5 video `paused === false` and time advancement confirmed, `outcome: 'COMPLETED'`, `verified: true` | `audioAudible` explicitly reported as `UNVERIFIED` (no fake acoustic claim) |
| **T13** | Media and progress cards emitted from real execution events | **PASS** | Real browser session receives live execution frames; `zero-gen-media` and `zero-gen-progress` cards rendered in live DOM | Rendered in real Chromium DOM |
| **T14** | Human takeover hold blocks unauthorized computer actions | **PASS** | Active human hold rejects computer action with `outcome: 'BLOCKED'` and `error: 'computer-hold:human-control'` | Physical safety hold verified |
| **T15** | Turn cancellation halts active execution via chat.abort | **PASS** | Active `chat.send` aborted via `chat.abort`; returns `{ ok: true, aborted: true }` | Clean turn abort |
| **T16** | Session lifecycle (create, get, list, patch, delete, setInvolvement) | **PASS** | Full CRUD and involvement level persisted to SQLite | Durable state persistence |
| **T17** | Restart recovery sweeps and persists across reboots | **PASS** | Orphaned `RUNNING`/`QUEUED` tasks transitioned to safe `WAITING` state upon reboot sweep | No stuck tasks |
| **T18** | Persistent semantic memory store (remember & recall) | **PASS** | Memory stored with metadata and recalled by tag/keyword | Real retrieval from SQLite |
| **T19** | Sub-agent delegation and child task execution | **PASS** | Parent delegates to child agent through canonical Agent Runtime; child executes steps; parent resumes | Full agent hierarchy |
| **T20** | Durable cron automation triggers due jobs | **PASS** | Scheduler sweeps and triggers due automations; execution timestamp updated | Persistent cron store |
| **T21** | Plugin capability registration and execution | **PASS** | Dynamic plugin capability registered, listed, and executed with audit record | Production lifecycle verified |
| **T22** | Channel message round-trip handling | **BLOCKED** | **BLOCKED**: Requires live `TELEGRAM_BOT_TOKEN` or `DISCORD_BOT_TOKEN`. Test skipped truthfully | Never mocked with synthetic pass |
| **T23** | Negative testing: unauthorized, forbidden, and invalid frames | **PASS** | DNS rebinding rejected (403), untrusted Origin rejected (403), tokenless client restricted to viewer, unauthorized privileged RPC rejected (-32003) | Comprehensive security negative coverage |
| **T24** | Secret scan proves 0 credentials in tracked repository | **PASS** | `node backend/scripts/scan-secrets.mjs` scans all tracked files; 0 leaks found | 0 credentials exposed |
| **T25** | Windows packaging and single supervisor launcher integrity | **PASS** | `zero-host.ps1` and `start-all.ps1` verified; authoritative port 18789 enforced; daemon management checked | Windows runtime packaging |

---

## 3. Security Architecture & Threat Model Resolution (P0)

### 3.1 Bootstrap Credential Disclosure Eliminated
- **Defect:** Prior versions returned `gatewayToken` in public `/control-ui-config.json` with wildcard CORS headers.
- **Remediation:**
  1. `gatewayToken` is completely removed from `/control-ui-config.json`. The endpoint returns only public metadata (`gatewayPort`, `protocolVersion`, `defaultTheme`, `runtime`).
  2. Gateway secrets are never exposed in HTML, JSON, script tags, logs, or error responses.

### 3.2 Local Desktop Session Authentication (`zero_session`)
- Local browser desktop visits to `GET /` or `GET /chat/zero` are issued an encrypted, cryptographically random `zero_session` cookie with `HttpOnly; SameSite=Strict; Path=/`.
- Explicit session exchange is available via `POST /api/auth/session` (loopback callers only).
- WebSocket upgrades authenticate via `zero_session` cookie or `Authorization: Bearer <token>`.
- Client role and scopes (`operator.admin`, `operator.write`, `operator.read`, or `viewer`) are determined strictly by server-side authoritative token matching. Untrusted or tokenless clients are assigned `viewer` with read-only access.

### 3.3 DNS Rebinding & Host Header Validation
- All HTTP requests and WebSocket upgrade handshakes inspect the `Host` header via `isValidLoopbackHost()`.
- Requests with non-loopback `Host` headers (e.g. `Host: evil.com`) are rejected with `403 Forbidden` before body processing or upgrade negotiation.

### 3.4 Strict Loopback CORS Policy
- Wildcard `Access-Control-Allow-Origin: *` has been completely eliminated.
- CORS policy allows only trusted loopback origins (`http://127.0.0.1:18789`, `http://localhost:18789`, `http://[::1]:18789`).
- Untrusted cross-origin requests receive no CORS grant and are rejected with `403 Forbidden`.

---

## 4. Hardware Automation & Safety Contracts (P1/P2)

### 4.1 Process-Isolated Notepad Automation (T11)
- The test launches Notepad via `child_process.spawn('notepad.exe')` and retains its exact OS Process ID (`pid`).
- Focused window verification and UIAutomation text inspection ensure that only the test window receives input.
- Process teardown invokes `taskkill /F /PID <pid>` targeting strictly the test process. Broad wildcards (`Stop-Process -Name notepad*`) are prohibited.

### 4.2 YouTube Automation Playback & Audio Semantics (T12)
- Playback confirmation requires:
  1. Verified media identity.
  2. Active `PLAYING` state confirmed via HTML5 video element evaluation (`paused === false`).
  3. Continuous playback position progression (`currentTime > initialTime`).
  4. Final outcome `COMPLETED` and `verified === true`.
- Audibility: Because headless/background environments do not have physical acoustic decibel meters, acoustic audibility is truthfully categorized as `UNVERIFIED` rather than fabricating acoustic measurement.

---

## 5. UI Build & Asset Provenance
- Source repository: `app/zero-control-ui/`
- Build script: `node app/zero-control-ui/build.mjs`
- Canonical generation hash: `36a42defcd8df5b5112abb20e7ac5632ac511b36de5e755644122d0182bd5e46`
- Output targets:
  - `dist/web/assets/zero-control-ui.js` (114,126 bytes)
  - `dist/web/assets/zero-control-ui.css` (40,702 bytes)
- Independence: 100% first-party code, zero runtime reliance on legacy bundlers or external packages.
