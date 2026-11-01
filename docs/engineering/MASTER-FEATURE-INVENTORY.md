# Zero AI — Master Feature & Subsystem Inventory

**Document Reference:** `docs/engineering/MASTER-FEATURE-INVENTORY.md`  
**Classification:** Phase 0 Root Audit Deliverable  
**Tracking Standard:** Strict status classification with verifiable evidence links.

---

## 1. Feature Status Inventory Table

| ID | Feature Name | Canonical Path | Status | Verification Evidence / Notes |
|---|---|---|---|---|
| **F01** | Native Zero Host (Port 18789) | `services/host/native-gateway.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T02, T25; single listener |
| **F02** | Local Browser Security Boundary | `services/host/security.mjs` | **VERIFIED** | `test/rpc-contracts.test.mjs` tests 17–20; DNS rebinding + SameSite cookie |
| **F03** | Redacted Config RPC (`config.get`/`patch`) | `services/host/native-gateway.mjs` | **VERIFIED** | `test/rpc-contracts.test.mjs` tests 1–3; secrets redacted with `[REDACTED]` |
| **F04** | Role & Scope Authorization Enforcement | `services/host/native-gateway.mjs` | **VERIFIED** | `test/rpc-contracts.test.mjs` tests 9–15; viewer restricted, admin guarded |
| **F05** | Real Control UI SPA Bundle (Generation 36a42d) | `dist/web/assets/zero-control-ui.js` | **VERIFIED** | `test/e2e-matrix.test.mjs` T03; generation hash match; 114KB JS |
| **F06** | 29 Settings & UI Route Catalog | `app/zero-control-ui/src/legacy-routes.js` | **VERIFIED** | `test/e2e-matrix.test.mjs` T04; rendered in real Chrome & Edge via Playwright |
| **F07** | WebSocket Protocol 4 Handshake | `packages/gateway-protocol/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T05; frame negotiation |
| **F08** | Multi-Model Registry & Discovery | `models/gateway-providers.json` | **VERIFIED** | `test/e2e-matrix.test.mjs` T06; `/v1/models` matches configured catalog |
| **F09** | Dynamic Model Switching | `packages/model-fabric/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T07; resolves distinct provider endpoints |
| **F10** | Real Cloud Model Inference | `packages/model-fabric/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T08; finish_reason `stop` |
| **F11** | Local GGUF Model Inference | `backend/gateway/server/local-gguf-middleware.ts` | **TESTED** | Local GGUF scanner and execution path |
| **F12** | Single-Pass SSE Streaming (1:1 Upstream) | `packages/model-fabric/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T09; strictly 1 request increment |
| **F13** | Model-Driven Tool Loop (`chat.send`) | `services/host/native-gateway.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T10; observation feedback re-injection |
| **F14** | PID-Targeted Notepad Automation | `app/zero-control-ui/src/computer/operator.js` | **VERIFIED** | `test/e2e-matrix.test.mjs` T11; UIAutomation exact match & single-PID kill |
| **F15** | YouTube Browser Playback Automation | `app/zero-control-ui/src/computer/operator.js` | **VERIFIED** | `test/e2e-matrix.test.mjs` T12; HTML5 video playback progression verified |
| **F16** | Real-Time Execution Cards (Media/Progress) | `app/zero-control-ui/src/browser.js` | **VERIFIED** | `test/e2e-matrix.test.mjs` T13; live Chromium DOM verification |
| **F17** | Physical Human Takeover Hold | `app/zero-control-ui/src/computer/operator.js` | **VERIFIED** | `test/e2e-matrix.test.mjs` T14; computer action rejection |
| **F18** | Turn Cancellation (`chat.abort`) | `services/host/native-gateway.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T15; returns `{ ok: true, aborted: true }` |
| **F19** | Session State Lifecycle & Involvement | `packages/sessions/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T16; SQLite CRUD and involvement level |
| **F20** | Reboot Recovery Sweep (RUNNING -> WAITING) | `packages/tasks/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T17; SQLite state sweep on startup |
| **F21** | Persistent Semantic Memory Store | `packages/memory/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T18; tag/keyword recall from SQLite |
| **F22** | Canonical Agent Delegation | `packages/agent-runtime/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T19; parent-child execution |
| **F23** | Durable Cron Automation Engine | `packages/automation/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T20; persistent job sweep |
| **F24** | Dynamic Plugin Capability Registration | `packages/capability-engine/index.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T21; manifest registration and audit |
| **F25** | External Channel Message Transport | `packages/channels/index.mjs` | **BLOCKED** | `test/e2e-matrix.test.mjs` T22; requires bot token |
| **F26** | Secret Scanner Verification | `backend/scripts/scan-secrets.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T24; 0 credentials in repo |
| **F27** | Windows Packaging & Supervisor Launcher | `zero-host.ps1` / `zero-host.mjs` | **VERIFIED** | `test/e2e-matrix.test.mjs` T25; daemon management |
| **F28** | Continuous Screen Intelligence Engine | `packages/screen-intelligence/` | **NOT_STARTED** | Phase 8 target; Screenpipe architecture |
| **F29** | 5-Minute Rolling RAM Visual Buffer | `packages/screen-intelligence/buffer.mjs` | **NOT_STARTED** | Phase 8 target; bounded memory (<250MB) |
| **F30** | Local Moondream2 / OCR Vision Grounding | `packages/screen-intelligence/vision.mjs` | **NOT_STARTED** | Phase 8 target; CPU-first inference |
| **F31** | Real-Time Voice Streaming Assistant | `services/voice-service/` | **NOT_STARTED** | Phase 15 target; post-chat stabilization |
| **F32** | Original ZERO Unified User Interface | `apps/control-ui/` | **NOT_STARTED** | Phase 16 target; post-backend stabilization |
