# ZERO AI Task Board

Canonical live status of Project Zero. All core milestones and fixes are 100% verified and operational.

| ID | Module / Task | Status | Deliverable & Live Verification Evidence |
|---|---|---|---|
| REBRAND-01 | Complete Zero / Client Zero Rebranding | ACCEPTED | Upstream OpenClaw crab/lobster logos, favicons, telemetry, docs links (`openclaw.ai`, `docs.openclaw.ai`), and "Gateway unreachable" screens purged. Title rebranded to "Zero Control UI" and clean Zero SVG favicon active. |
| PURGE-01 | Obsolete Files, Old Planners & Test Junk Purge | ACCEPTED | Obsolete developer harness files (`DEVELOPER_*.md`, `AGENT_CHAT.txt`, `START_TASKS.txt`, `MASTER_RECONCILIATION.md`, `plans/`, `reports/gemini/`) purged. All test sessions (`tool-live-exec-*`, `be02-acceptance-*`) and test models cleaned from SQLite and UI. |
| PM-01 | Model Gateway & Provider Modal Selection Overhaul | ACCEPTED | `+ Add Provider` modal in `app/zero-control-ui/src/pages/models.js` starts with 0 models selected (no auto-selection). Dynamic search filters visually without selecting; "Select all" targets only filtered list; "Deselect all" clears; dynamic count button `Add X selected model(s)` adds selected models cleanly. |
| GW-01 | Gateway Backend (18790) & Provider Sync | ACCEPTED | Dual-vault persistence: `models/gateway-providers.json` and `models/gateway-defaults.json` are primary source of truth; live sanitized sync to `openclaw.json`. Native endpoints `/v1/models`, `/health`, and `/api/gateway/config` verified. |
| CUA-01 | High-Speed Win32 Computer Control & UIA Extraction | ACCEPTED | Autonomous owner mode active (`rules/active-mode.json`); `win-actions-daemon.ps1` and `windows-driver.js` execute OS actions at 1-5ms without `computer-hold` lockouts. Fast element detection via `zero_screen_context`. |
| CHAT-01 | Unified `/chat/zero` Chat & Model Selector | ACCEPTED | Single `/chat/zero` interface without split spaces or secondary tabs. Top controls (`Computer Control: Active`, `Reasoning: ON/OFF`) operational. Model selector cleanly reflects configured providers (`zero-gateway`, `nv`, etc.) with zero test/mock junk. |

---

### System Architecture Summary
- **Zero Host (UI & Runtime):** `127.0.0.1:18789`
- **Zero Gateway Backend:** `127.0.0.1:18790`
- **Active Agent:** Single unified `zero` agent (`agents.defaults.systemAgent.agentId: "zero"`)
- **Primary Source of Truth for Models:** `models/gateway-providers.json` & `models/gateway-defaults.json`
- **Execution Mode:** `owner` (Full autonomous Windows desktop actions & observation)
