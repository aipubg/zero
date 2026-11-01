# Zero AI — Operational Rollback Procedure

**Baseline Revision:** `d57454d14bfe3922c0da4320b98ebfe3e3eb62db` (Tag: `v2026.11.01-baseline`)  
**Target Platform:** Windows 10/11, Node.js v24.22.1  
**State Directory:** `zero-system/`  
**Data Directory:** `.zero-data/`  
**Backup Location:** `.backup/baseline-20261101/`

---

## 1. Rollback Trigger Criteria
Initiate rollback immediately if any of the following occur during migration:
1. Native runtime initialization fails and cannot establish HTTP or WebSocket listeners on port 18789.
2. Structural database migration causes unrecoverable data loss in sessions, memories, tasks, or cron automations.
3. Live Windows OS automation loses safety takeover hold or fails to execute approved desktop actions.
4. Regression in Playwright UI verification reveals broken routes, login gates, or non-functional settings panels.

---

## 2. Step-by-Step Restoration Procedure

### Step 1: Terminate Active Host Processes
Stop any running Zero Host instances listening on port 18789:
```powershell
Get-Process node -ErrorAction SilentlyContinue | Where-Object {
  $_.MainWindowTitle -like '*zero*' -or (Get-NetTCPConnection -OwningProcess $_.Id -LocalPort 18789 -ErrorAction SilentlyContinue)
} | Stop-Process -Force -ErrorAction SilentlyContinue
```

### Step 2: Restore Source Code & Git State
Reset tracked files to the baseline tag:
```powershell
git checkout main
git reset --hard v2026.11.01-baseline
git clean -fd -e .env -e .zero-data -e .backup
```

### Step 3: Restore Database and Configuration State
Restore the verified snapshot of configuration and SQLite stores:
```powershell
# Restore configuration
Copy-Item -Path ".backup\baseline-20261101\config\*" -Destination "zero-system\config\" -Force

# Restore SQLite databases with WAL consistency
Copy-Item -Path ".backup\baseline-20261101\data\*" -Destination ".zero-data\" -Force
```

### Step 4: Verify Environment and Credentials
Verify that secrets remain isolated in `.env` without exposure in tracked sources:
```powershell
node backend/scripts/scan-secrets.mjs
node backend/scripts/preflight.mjs
```

### Step 5: Restart Baseline Zero Host
Launch the verified baseline host:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\zero-host.ps1
```

### Step 6: Post-Rollback Sanity Verification
Confirm health, models, and chat responses:
```powershell
Invoke-RestMethod http://127.0.0.1:18789/health
Invoke-RestMethod http://127.0.0.1:18789/v1/models
node backend/scripts/acceptance.mjs
```
