# Zero AI — Architectural Gaps & Defect Analysis

**Audit Date:** 2026-11-01  
**Repository:** https://github.com/aipubg/zero  
**Scope:** Root-cause analysis of verified architectural gaps, technical debt, and security vulnerabilities

---

## 1. Upstream Runtime Dependency (Directive §3.1)

### Root Cause
- `backend/package.json` depends directly on `openclaw@2026.10.6`.
- `zero-host.ps1` boots the system by invoking `backend/node_modules/.bin/openclaw.cmd gateway --port 18789`.
- The system is architecturally dependent on the upstream binary for HTTP routing, WebSocket protocol negotiation, session state synchronization, and agent turn loops.

### Technical & Architectural Impact
- Any upstream package update or reinstall destroys customized runtime behaviors.
- The platform cannot independently evolve its core communication protocols or agent execution lifecycle without bumping or hacking an upstream binary package.

### Remediation Path
1. Establish a native Zero Host service (`services/zero-host/` or `backend/server/`) that directly instantiates the HTTP/WebSocket gateway.
2. Abstract the Gateway protocol behind Zero-owned service contracts (`packages/gateway-protocol/`).
3. Transition `zero-host.ps1` to launch `node backend/server/index.mjs` directly without wrapping `openclaw.cmd`.

---

## 2. Startup-Time Source Patching (Directive §3.2)

### Root Cause
- `backend/scripts/apply-zero-branding.mjs` is an 823-line script executed on every application launch (`start-all.ps1` and `zero-host.ps1`).
- The script traverses `node_modules` and compiled release directories, searching for generated JavaScript bundles (e.g. `server-start-D6vaUNGz.mjs`, `models-qLzDNS0G.mjs`) and performs string replacements to inject Zero gateway hooks, strip crab logos, and filter models.
- It also injects `<link>` and `<script>` tags into `dist/index.html` files inside node_modules.

### Technical & Architectural Impact
- Fragile runtime: Any change in bundle hashing or code generation breaks string replacement targets.
- High startup latency: Disk walking and regex search across thousands of files slows down application boot.
- Violates clean release engineering principles: A production application should never rewrite its installed dependencies at startup.

### Remediation Path
1. Replace runtime monkeypatching with source-level component implementation.
2. Build UI assets ahead of time into a dedicated, Zero-owned distribution directory (`apps/web/dist` or `app/zero-control-ui/dist`).
3. Serve UI assets directly from Zero Host through static middleware.
4. Retire `apply-zero-branding.mjs` completely.

---

## 3. Conflicting Gateway Architecture (Directive §3.3)

### Root Cause
- The repository previously ran two conflicting servers:
  1. Port `18789`: OpenClaw Gateway (served UI, WebSocket RPC, agent transcripts).
  2. Port `18790`: Custom Node HTTP server (`backend/gateway/server.mjs`) serving `/v1/chat/completions` and `/api/gateway/*`.
- When requests from port 18789 attempted to communicate with port 18790 or vice versa, cross-origin blocks, port mismatch errors, or connection refused errors occurred whenever one service crashed or was restarted separately.

### Technical & Architectural Impact
- Split-brain state: Model configurations were duplicated between `zero-system/config/zero.json` and `models/gateway-providers.json`.
- Dual launchers: `start-all.ps1` started both processes in the background, making debugging and process monitoring difficult.

### Remediation Path
- Maintain a single authoritative control plane listening exclusively on port `18789`.
- Consolidate all model routing, proxy endpoints, local GGUF services, and Control UI static hosting inside the single Zero Host.

---

## 4. Hardcoded Environment Assumptions (Directive §3.4)

### Root Cause
- Hardcoded absolute paths to `E:\zero` exist across multiple configuration and source files:
  - `backend/config/zero.json`: `"workspace": "E:\\\\zero\\\\zero-system\\\\state\\\\agents\\\\zero"`
  - `zero-system/config/zero.json`: `"paths": ["E:\\zero\\app\\zero-control-ui"]`
  - `backend/gateway/server.mjs`: `E:\\zero` in `getRepoRoot()` candidates and hardcoded provider path references.
  - Startup scripts (`start-all.ps1`, `zero-host.ps1`, `zero-gateway.ps1`).

### Technical & Architectural Impact
- Non-portable codebase: Cloning or deploying the repository on any drive or path other than `E:\zero` causes immediate startup crashes.

### Remediation Path
1. Introduce a central environment resolution helper:
   ```javascript
   const ZERO_ROOT = process.env.ZERO_ROOT || path.resolve(__dirname, '..');
   const ZERO_DATA_DIR = process.env.ZERO_DATA_DIR || path.resolve(ZERO_ROOT, 'data');
   ```
2. Convert all configuration file templates to use relative paths or environment substitution tokens (`${ZERO_ROOT}`).

---

## 5. Session Lifecycle Risk (Directive §3.5)

### Root Cause
- `start-all.ps1` includes:
  ```powershell
  node 'E:\zero\backend\scripts\purge-all-test-sessions.mjs'
  ```
- `purge-all-test-sessions.mjs` executes destructive SQL operations on startup:
  ```javascript
  db.prepare("DELETE FROM session_state_events").run();
  db.prepare("DELETE FROM session_state_heads").run();
  ```

### Technical & Architectural Impact
- User conversations, ongoing tasks, and historical transcripts are permanently deleted whenever the application is restarted.
- Contradicts the core requirement for persistent agent memory and task resumption across restarts.

### Remediation Path
1. Immediately remove `purge-all-test-sessions.mjs` from all startup scripts.
2. Isolate test fixtures and test database migrations into `tests/fixtures/` and run cleanup routines only in isolated temporary test databases.
3. Protect production SQLite tables with transaction safeguards and automatic backup snapshots.

---

## 6. Model Gateway Reliability & Security (Directive §3.6)

### Root Cause & Defect 1: Unvalidated Proxy (`handleProxy`)
- `backend/gateway/server.mjs` exposes `/api/gateway/proxy` which forwards incoming HTTP requests to whatever `targetUrl` or `baseUrl` the caller specifies:
  ```javascript
  const upstreamRes = await fetch(fullDestinationUrl, { method, headers: upstreamHeaders, body: upstreamBodyStr });
  ```
- No URL domain allowlist, no validation against configured providers, and no restriction preventing Server-Side Request Forgery (SSRF) to internal network addresses (e.g. `169.254.169.254` or internal LANs).

### Root Cause & Defect 2: Plaintext API Keys in Git
- `models/gateway-providers.json` contains unencrypted API keys committed in git:
  ```json
  "apiKey": "nvapi-REDACTED"
  ```

### Root Cause & Defect 3: Loose Model Substring Matching
- `resolveUpstreamProvider(modelId)` uses loose substring checks:
  ```javascript
  (rawId && norm && (rawId.includes(norm) || norm.includes(rawId)))
  ```
- And falls back to the first available active provider if no match is found:
  ```javascript
  const firstActive = providers.find((p) => p && p.id && ...);
  ```
- If a user requests a specific model or provider that is unavailable, the gateway silently redirects the prompt to an arbitrary other model without notifying the user.

### Root Cause & Defect 4: Hardcoded Regex Intercepts vs True Tool Loop
- `handleChatCompletions` checks incoming user prompt text using regex:
  ```javascript
  const isYouTubeCmd = (/youtube/i.test(userText) || /song|music/i.test(userText)) && /open|play/i.test(userText);
  const isNotepadCmd = /notepad/i.test(userText) && /open|launch|write|type/i.test(userText);
  ```
- If matched, it circumvents the AI model completely, performs a scripted action, and returns canned JSON progress cards!
- While this made simple test cases pass, it is not autonomous agent execution. The model must actually emit tool calls, and the gateway/runtime must execute them through a verified agent loop.

### Remediation Path
1. Enforce strict server-side provider allowlists for proxy requests.
2. Move credentials to a secure local credential store (DPAPI / encrypted vault / local `.env`), never committed to source control.
3. Implement deterministic provider resolution with explicit error reporting (no silent fallbacks).
4. Remove regex command intercepts and rely purely on the model's function-calling outputs and the `ComputerOperator` tool execution engine.

---

## 7. Additional Discovered Codebase Defects

### 7.1 Duplicate Directory Tree (`src/gateway` vs `backend/gateway`)
- `E:\zero\src\gateway\` is a byte-for-byte duplicate of `E:\zero\backend\gateway\`.
- Any changes made in one directory are not reflected in the other, causing developer confusion and split maintenance.
- **Action:** Delete `src/gateway` or consolidate into a single package.

### 7.2 Missing Source Directory (`app/src/`)
- `app/test/bridge.test.mjs` fails with:
  ```
  Error: ENOENT: no such file or directory, scandir 'E:\zero\app\src'
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'E:\zero\app\src\bridge\config.ts'
  ```
- `app/src` was deleted during earlier refactorings, but tests were not updated to reflect the new architecture.
- **Action:** Fix or remove obsolete bridge test references.

### 7.3 Broken Test Fixtures (`openclaw.template.json`)
- `backend/scripts/test/migrate-zero-only-agents.test.mjs` fails looking for `openclaw.template.json` which was renamed to `zero.template.json`.
- **Action:** Update test fixture path to point to `zero.template.json`.

### 7.4 Node.js vs Browser Environment Mismatch (`registry.ts`)
- `backend/gateway/registry.ts` directly calls `localStorage.getItem("zero_gateway_providers")`. When imported in Node.js by `test-final-suite.mjs`, it throws `ReferenceError: localStorage is not defined`.
- **Action:** Abstract client-side storage from server-side registry persistence.
