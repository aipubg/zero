# Zero AI — Complete System Inventory Report

**Audit Date:** 2026-11-01  
**Repository:** https://github.com/aipubg/zero  
**Reference Baseline:** OpenClaw 2026.10.6  
**Auditor:** Antigravity (Google DeepMind - Advanced Agentic Coding)  
**Status:** Canonical Audit Baseline

---

## 1. Executive Summary

This system inventory provides a recursive, file-by-file audit of the Zero AI repository. Every root directory, nested workspace, entry point, server, database, test suite, and configuration file has been inspected and classified.

### Module Classification Taxonomy
- **`WORKING`**: The module executes correctly, passes unit/integration tests, and functions without relying on hacks or mock intercepts.
- **`PARTIAL`**: The module operates in a limited capacity or contains hardcoded bypasses, incomplete feature coverage, or unvalidated proxy routes.
- **`BROKEN`**: The module fails to load or execute, crashes in its execution environment, or throws fatal errors during automated tests.
- **`MISSING`**: Required source modules or directories referenced by code or tests that do not exist in the working tree.
- **`DUPLICATED`**: Redundant, identical source trees or parallel services that create split-brain state or confusing ownership.
- **`OBSOLETE`**: Legacy development scripts, destructive cleanup fixtures, or runtime patching mechanisms that violate production stability.

---

## 2. Directory & Workspace Breakdown

### 2.1 Repository Root
| Path | Type | Status | Assessment & Description |
|---|---|---|---|
| `start-all.ps1` | PowerShell Script | `OBSOLETE` | Legacy launcher that invokes runtime patching (`apply-zero-branding.mjs`) and destructive session wipes (`purge-all-test-sessions.mjs`). Starts two separate ports (`18790` and `18789`). |
| `zero-host.ps1` | PowerShell Script | `PARTIAL` | Launches `openclaw.cmd gateway` on port `18789` with environment variables. Contains hardcoded absolute paths (`E:\zero`) and executes startup patching. |
| `zero-gateway.ps1` | PowerShell Script | `OBSOLETE` | Launches secondary standalone server (`backend/gateway/server.mjs`) on port `18790`. Creates architectural collision with single-port `18789` architecture. |
| `README.md` | Markdown | `WORKING` | Clean Zero AI product entry point documenting single-port `18789` architecture, physical desktop automation, and quick start guides. |
| `.gitignore` | Config | `WORKING` | Standard git exclusions for `node_modules`, state journals, credentials, and local test artifacts. |

---

### 2.2 `app/` — Application Layer & Bridge
| Path | Type | Status | Assessment & Description |
|---|---|---|---|
| `app/package.json` | Manifest | `PARTIAL` | Declares dependencies on `@openclaw/gateway-client` and `@openclaw/gateway-protocol`. Lacks local Zero Host client package. |
| `app/pnpm-workspace.yaml` | Workspace Config | `WORKING` | Workspace definition managing `app` packages. |
| `app/tsconfig.json` | TS Config | `PARTIAL` | TypeScript configuration for bridge library. References `src/` which was removed. |
| `app/test/bridge.test.mjs` | Test Suite | `BROKEN` | Fails with `ERR_MODULE_NOT_FOUND` on `E:\zero\app\src\bridge\config.ts` and `ENOENT` on `E:\zero\app\src`. |
| `app/src/` | Directory | `MISSING` | Referenced by `bridge.test.mjs` and `package.json`, but absent on disk. |

---

### 2.3 `app/zero-control-ui/` — Native Product UI Shell
| Path | Type | Status | Assessment & Description |
|---|---|---|---|
| `browser.js` | JS Entry | `WORKING` | Control UI browser bundle entry importing `native-surfaces.js`. |
| `build.mjs` | Build Script | `WORKING` | Uses `esbuild` to compile `browser.js` and `index.css` into content-hashed bundles in `dist/control-ui/`. |
| `index.css` | Stylesheet | `WORKING` | Pure Zero dark theme stylesheet with custom CSS variables, modal dropdown reset, and top-right control button styling. |
| `index.js` | Plugin Entry | `WORKING` | OpenClaw plugin registration entry point binding computer-hold policy, observation engine, and control UI. |
| `runtime-core.mjs` | Module | `WORKING` | Backend runtime handlers for provider display-names, CLI status, connectors, and observation RPCs. |
| `openclaw.plugin.json` | Manifest | `WORKING` | Plugin manifest configuring `zero-control-ui` extensions and control UI assets. |
| `src/constants.js` | Module | `WORKING` | UI constants and surface identifier declarations. |
| `src/legacy-routes.js` | Module | `WORKING` | Route interceptor keeping native routes and redirecting legacy upstream chrome to canonical `/chat/zero`. |
| `src/native-surfaces.js` | Module | `WORKING` | DOM manipulation and custom Lit component mounts: permanent top actions, theme-synced custom dropdowns, skeleton cleanup. |
| `src/agents/subagent-delegator.mjs` | Module | `WORKING` | Coordinates subagent tasks and delegates execution events to Gateway at `http://127.0.0.1:18789`. |
| `src/computer/driver.js` | Module | `WORKING` | Abstract computer driver interface. |
| `src/computer/windows-driver.js` | Module | `WORKING` | Native Windows OS driver executing PowerShell scripts for physical mouse, keyboard, and window state. |
| `src/computer/operator.js` | Module | `WORKING` | `ComputerOperator` engine running `Observe -> Act -> Verify` execution pattern. |
| `src/computer/tools.js` | Module | `WORKING` | Tool schema declarations and factories for `zero_computer_action`. |
| `src/computer/hold.js` | Module | `WORKING` | Client-side computer hold UI bar and human-safety takeover logic. |
| `src/computer/win-actions-daemon.ps1`| PowerShell Daemon | `WORKING` | Persistent PowerShell action daemon executing User32 and UIA calls with sub-millisecond latency. |
| `src/computer/win-actions.ps1` | PowerShell Script | `WORKING` | Standalone CLI script for single-action execution. |
| `src/gateway/client.js` | Module | `WORKING` | Thin gateway wrapper around `host.request`. |
| `src/pages/about.js` | UI Page | `WORKING` | Pure Zero About page showing system diagnostics, integrations, and private mode toggles without external links. |
| `src/pages/models.js` | UI Page | `WORKING` | Models and providers management surface. |
| `src/shared/` | Modules | `WORKING` | Shared helpers for connectors, DOM utils, error sanitizers, routes, sessions, and formatting. |
| `src/spaces/generative-widgets.js` | UI Widgets | `WORKING` | Custom UI cards for progress timelines and media playback cards (`zero-ui:media`, `zero-ui:progress`). |
| `observation/` | Subsystem | `WORKING` | 24/7 background observation pipeline: ring buffer, change detector, perception (UIA/OCR), memory store, and privacy controls. |
| `test/*.test.mjs` | Test Suites | `WORKING` | 11 unit test suites passing 128 tests covering mount, computer hold, observation lifecycle, and surfaces. |

---

### 2.4 `backend/` — Server Runtime & Services
| Path | Type | Status | Assessment & Description |
|---|---|---|---|
| `backend/package.json` | Manifest | `PARTIAL` | Directly pins `openclaw: 2026.10.6`. Lacks native Zero Host package definition. |
| `backend/config/zero.json` | Config | `PARTIAL` | Canonical active configuration. Contains hardcoded `E:\zero` absolute paths. |
| `backend/config/zero.template.json` | Config Template | `PARTIAL` | Template used for bootstrapping. Contains hardcoded `E:\zero` absolute paths. |
| `backend/agents/zero/delegation-policy.md` | Policy Doc | `WORKING` | Single-agent delegation policy enforcing explicit permissions. |
| `backend/gateway/server.mjs` | Server | `PARTIAL` | HTTP server providing `/v1/chat/completions`, `/v1/models`, `/health`, and `/api/gateway/*`. Contains hardcoded regex intercepts for `isYouTubeCmd`/`isNotepadCmd` and unvalidated proxy. |
| `backend/gateway/registry.ts` | Module | `BROKEN` | References `localStorage` directly in Node.js environment; fails during server-side execution. |
| `backend/gateway/client.ts` | Module | `WORKING` | Client interfaces for gateway communication. |
| `backend/gateway/sanitizer.ts` | Module | `WORKING` | Request and secret sanitization logic. |
| `backend/gateway/server/local-gguf-service.ts`| Service | `WORKING` | Local model manager scanning and scheduling GGUF inference tasks. |
| `backend/gateway/test-final-suite.mjs` | Test Suite | `BROKEN` | Fails due to `ReferenceError: localStorage is not defined`, invalid URL parsing, and port 18789 health assertion. |
| `backend/plugin/index.js` | Plugin Entry | `WORKING` | `zero-policy` plugin implementing `zero-policy.computer-hold` and `zero.computer.control`. |
| `backend/plugin/selftest.mjs` | Test Suite | `WORKING` | 110 passed contract tests verifying lease state machine, stale-frame gating, and budgets. |
| `backend/scripts/apply-zero-branding.mjs` | Script | `OBSOLETE` | 823-line startup patching script that mutates installed node_modules files at runtime. |
| `backend/scripts/purge-all-test-sessions.mjs`| Script | `OBSOLETE` | Destructive script that drops SQLite session tables on startup. |
| `backend/scripts/test/migrate-zero-only-agents.test.mjs` | Test Suite | `BROKEN` | Fails with `ENOENT` looking for deleted `openclaw.template.json`. |
| `backend/scripts/test/sync-zero-instructions.test.mjs` | Test Suite | `WORKING` | Passes managed block instruction synchronization tests. |

---

### 2.5 `models/` — Configuration & Vault
| Path | Type | Status | Assessment & Description |
|---|---|---|---|
| `gateway-defaults.json` | JSON Config | `WORKING` | Defines default primary model (`nvidia/nemotron-3.5-super-vl-120b-a12b`) and agent bindings. |
| `gateway-providers.json` | JSON Config | `PARTIAL` | Provider configurations. **Security issue:** Contains plaintext API keys committed in git repository. |

---

### 2.6 `plugins/`, `rules/`, `skills/`
| Path | Type | Status | Assessment & Description |
|---|---|---|---|
| `plugins/dynamic-loader.mjs` | Module | `WORKING` | Discovers and mounts drop-in plugins with `on_startup`, `on_message`, and `register_tools` hooks. |
| `plugins/system-tools/` | Plugin | `WORKING` | System utility tools. |
| `plugins/web-tools/` | Plugin | `WORKING` | Web utility tools. |
| `rules/mode-manager.mjs` | Module | `WORKING` | Manages Owner vs Distribution operating modes with persistent state in `active-mode.json`. |
| `rules/owner-policy.json` | Policy Config | `WORKING` | Autonomous Owner mode permissions. |
| `rules/distribution-rules.json` | Policy Config | `WORKING` | Restricted Distribution mode permissions. |
| `skills/self-learning-creator.mjs` | Module | `WORKING` | Automated skill creation tool allowing Zero to author new skills into `skills/`. |
| `skills/*/SKILL.md` (9 skills) | Skill Manifests | `WORKING` | Structured capability guides (browser-control, code-refactoring, github-automation, memory-retention, pdf-processing, system-ops, terminal-exec, vision-analysis, web-research). |

---

### 2.7 `src/` — Duplicate Tree
| Path | Type | Status | Assessment & Description |
|---|---|---|---|
| `src/gateway/` | Directory | `DUPLICATED` | Exact 1:1 duplicate of `backend/gateway/`. Has identical file hashes for `server.mjs`, `client.ts`, `registry.ts`, etc. |

---

### 2.8 `zero-system/` — System Configuration & State
| Path | Type | Status | Assessment & Description |
|---|---|---|---|
| `zero-system/config/zero.json` | Config | `PARTIAL` | Main system configuration file for OpenClaw gateway. Contains hardcoded absolute paths `E:\zero`. |
| `zero-system/config/zero.template.json` | Config Template | `PARTIAL` | System template with hardcoded absolute paths `E:\zero`. |
| `zero-system/state/state/openclaw.sqlite` | Database | `PARTIAL` | Primary SQLite database storing sessions, audit logs, devices, and cron jobs. Retains legacy naming. |
| `zero-system/state/openclaw-agent.sqlite`| Database | `WORKING` | Secondary agent state database. |

---

## 3. Module Classification Summary Table

| Classification | Count | Key Components |
|---|---|---|
| **WORKING** | 42 | Lit UI bundle, `windows-driver.js`, `win-actions-daemon.ps1`, `ComputerOperator`, `observation/` subsystem, `zero-policy` plugin, `dynamic-loader.mjs`, `mode-manager.mjs`, 9 skill definitions, 128 UI tests, 110 policy tests. |
| **PARTIAL** | 8 | `backend/gateway/server.mjs` (hardcoded regex intercepts & open proxy), `zero-host.ps1` (hardcoded paths & runtime patching), `zero.json` / `zero.template.json` (hardcoded `E:\zero` paths), `gateway-providers.json` (plaintext API keys), `openclaw.sqlite` (legacy schema/table names). |
| **BROKEN** | 4 | `app/test/bridge.test.mjs` (missing `app/src`), `backend/gateway/registry.ts` (`localStorage` ReferenceError), `backend/gateway/test-final-suite.mjs` (crashes on fetch/assert), `backend/scripts/test/migrate-zero-only-agents.test.mjs` (missing `openclaw.template.json`). |
| **MISSING** | 2 | `app/src/` directory, Zero-native host daemon (pure Node.js process launcher replacing `openclaw.cmd`). |
| **DUPLICATED** | 1 | `src/gateway/` (identical copy of `backend/gateway/`). |
| **OBSOLETE** | 4 | `backend/scripts/apply-zero-branding.mjs` (runtime patching of node_modules), `backend/scripts/purge-all-test-sessions.mjs` (destructive session drop), `start-all.ps1` (dual-port launcher), `zero-gateway.ps1` (redundant secondary port 18790 launcher). |
