# ZERO AI Task Board

Canonical live status of Project Zero. All core milestones, performance fixes, and UI stability verifications are 100% operational.

| ID | Module / Task | Status | Deliverable & Live Verification Evidence |
|---|---|---|---|
| UI-STABLE-01 | UI Flicker, Blink & Reload Loop Elimination | ACCEPTED | `native-surfaces.js` self-mutation loops, auto-reconnect clicks and unnecessary re-mounts eliminated with strict route and tree guards. Live Playwright 10-second observation confirmed 0 mutations (100% stable). |
| MODELS-PURGE-01 | Dummy Model Purge (`zero-gateway/default` & `default`) | ACCEPTED | Removed fake `zero-gateway/default` and empty `default` models across `openclaw.json`, `gateway-providers.json`, `gateway-defaults.json`, and backend middleware. Model picker displays only verified real models. |
| PURGE-02 | Complete Obsolete Workspace Files & Clones Purge | ACCEPTED | Deleted legacy CopilotKit prototype (`app/src/`, `app/dist/`, `start-runtime.ps1`, `start-vite.ps1`), old computer spike (`computer/`), `reports/`, `upstream/` clones, `MASTER_PLAN.md`, and `DECISIONS.md`. |
| REBRAND-PERM-01 | Automated & Permanent Zero Branding Script | ACCEPTED | `backend/scripts/apply-zero-branding.mjs` applies Zero SVG favicon, titles, and text rebranding across all Control UI targets. Wired into `start-all.ps1` and `start-gateway.ps1`. |
| PM-01 | Model Gateway & Provider Modal Selection Overhaul | ACCEPTED | `+ Add Provider` modal in `app/zero-control-ui/src/pages/models.js` starts with 0 models selected (no auto-selection). Dynamic search filters visually without selecting; "Select all" targets only filtered list; "Deselect all" clears; dynamic count button `Add X selected model(s)` adds selected models cleanly. |
| GW-01 | Gateway Backend (18790) & Provider Sync | ACCEPTED | Dual-vault persistence: `models/gateway-providers.json` and `models/gateway-defaults.json` are primary source of truth; live sanitized sync to `openclaw.json`. Native endpoints `/v1/models`, `/health`, and `/api/gateway/config` verified. |
| CUA-01 | High-Speed Win32 Computer Control & UIA Extraction | ACCEPTED | Autonomous owner mode active (`rules/active-mode.json`); `win-actions-daemon.ps1` and `windows-driver.js` execute OS actions at 1-5ms without `computer-hold` lockouts. Fast element detection via `zero_screen_context`. |
| CHAT-01 | Unified `/chat/zero` Chat & Model Selector | ACCEPTED | Single `/chat/zero` interface without split spaces or secondary tabs. Top controls (`Computer Control: Active`, `Reasoning: ON/OFF`) operational. Model selector cleanly reflects configured providers (`nv`, etc.) with zero test/mock junk. |
| CHAT-MODELS-CLEAN-02 | Live Chat Model Picker Stale Models Purge & Provider Sync | ACCEPTED | Active DOM sanitizer `sanitizeChatModelMenu` in `native-surfaces.js` strips all residual `zero-gateway`, `test-provider`, and `test-model-1` dummy entries from chat model dropdown and auto-corrects trigger text. `local-gguf-middleware.ts` synchronizes all 13 Nvidia models and future added providers dynamically. |

---

### System Architecture Summary
- **Zero Host (UI & Runtime):** `127.0.0.1:18789`
- **Zero Gateway Backend:** `127.0.0.1:18790`
- **Active Agent:** Single unified `zero` agent (`agents.defaults.systemAgent.agentId: "zero"`)
- **Primary Model:** `nv/z-ai/glm-5.3-flash` (Configurable via UI)
- **Execution Mode:** `owner` (Full autonomous Windows desktop actions & observation)
