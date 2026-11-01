# Zero AI — Data Migration & State Preservation Plan (Phase 0)

**Document Reference:** `docs/audit/DATA-MIGRATION-PLAN.md`  
**Classification:** Phase 0 Deliverable (Task 0.16)  
**Authoritative Location:** `zero-system/state/`  
**Core Directive:** Section 05 Class E — Never delete or truncate user data without explicit verified migration and backup.

---

## 1. Executive Summary & State Inventory

Zero AI maintains durable local-first state within `zero-system/state/`. This plan establishes the canonical mapping from legacy table schemas into the unified ZERO AI target schema, guarantees atomic backups, and defines rollback procedures.

### Primary Data Stores

| Storage Path | Engine | Purpose | Size / Activity | Preservation Category |
|---|---|---|---|---|
| `zero-system/state/state/openclaw.sqlite` | SQLite3 (WAL mode) | Primary operational store (sessions, tasks, cron, preferences, plugins, skills, audit) | ~4.5 MB | **Class E (Crucial User State)** |
| `zero-system/state/state/openclaw-quarantine.sqlite` | SQLite3 | Isolation store for quarantined jobs/plugins | ~20 KB | **Class E** |
| `zero-system/config/zero.json` | JSON | Active system configuration, provider endpoints, keys references | ~4 KB | **Class E** |
| `zero-system/config/zero.template.json` | JSON | Default bootstrap template | ~4 KB | **Class A** |
| `models/gateway-providers.json` | JSON | Cloud and local model provider registry | ~12 KB | **Class A** |
| `models/gateway-defaults.json` | JSON | Agent model bindings and default alias mapping | ~1 KB | **Class A** |

---

## 2. Table-to-Target Entity Mapping

The operational database contains 105 active tables. During the phased transformation, these tables will be migrated to the target ZERO schema without data loss:

| Legacy Source Table | Target ZERO Domain | Target Entity / Table | Migration Strategy |
|---|---|---|---|
| `session_state_events`, `session_state_heads` | Domain F / Domain A | `zero_sessions`, `zero_messages` | In-place view abstraction; zero transcript loss |
| `task_runs`, `subagent_runs` | Domain J / Domain C | `zero_tasks`, `zero_task_steps` | Maintain execution audit trails; map to durable state machine |
| `cron_jobs`, `cron_run_receipts` | Domain J | `zero_automation_jobs`, `zero_automation_runs` | Preserve schedules, intervals, and historical execution receipts |
| `user_preferences` | Domain F | `zero_user_preferences` | Direct passthrough via `users.prefs.*` RPCs |
| `skill_usage`, `skill_workshop_changes` | Domain G | `zero_skills`, `zero_skill_executions` | Maintain skill execution analytics and custom user skills |
| `plugin_state_entries`, `plugin_blob_entries` | Domain H | `zero_plugins`, `zero_plugin_configs` | Map to Native Plugin SDK state store |
| `device_pairing_paired`, `device_identities` | Domain K | `zero_devices`, `zero_device_tokens` | Retain local hardware identity and paired companion records |
| `projects`, `session_groups`, `worktrees` | Domain L | `zero_workspaces`, `zero_projects` | Organizational multi-project grouping |
| `audit_events`, `diagnostic_events` | Observability | `zero_event_log` | Unified structured append-only event ledger |

---

## 3. Atomic Backup & Snapshot Procedure

Before any schema mutation, table rename, or migration step:

### Step 1: SQLite Safe Checkpoint & Vacuum Copy
Execute atomic backup using SQLite's online backup API or VACUUM INTO:

```powershell
# Create timestamped backup snapshot directory
$backupDir = "zero-system/backups/snapshot-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force

# Execute SQLite vacuum copy (preserves WAL integrity)
node -e "
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('zero-system/state/state/openclaw.sqlite');
db.exec(\`VACUUM INTO '${backupDir.Replace('\\', '/')}/openclaw.backup.sqlite'\`);
console.log('Safe snapshot created at ${backupDir}');
"
```

### Step 2: Configuration & Credentials Snapshot
```powershell
Copy-Item "zero-system/config/zero.json" "$backupDir/zero.json.bak"
Copy-Item "models/gateway-providers.json" "$backupDir/gateway-providers.json.bak"
Copy-Item "models/gateway-defaults.json" "$backupDir/gateway-defaults.json.bak"
```

---

## 4. Rollback Verification

If any migration script detects constraint violations or schema corruption:
1. The transaction is aborted immediately (`ROLLBACK`).
2. The active database pointer reverts to the snapshot backup.
3. System logs report exact migration step failure reason and line number.
4. Host restarts with original schema intact.
