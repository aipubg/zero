$ErrorActionPreference = 'Stop'
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

# 1. Apply pure Zero branding and session cleanups
node 'E:\zero\backend\scripts\apply-zero-branding.mjs'
node 'E:\zero\backend\scripts\purge-all-test-sessions.mjs'

# 2. Start Zero Model Gateway (Port 18790) if not running
if (-not (Get-NetTCPConnection -LocalPort 18790 -State Listen -ErrorAction SilentlyContinue)) {
  Write-Host "[Zero Gateway] Launching Zero Gateway on port 18790..." -ForegroundColor Green
  Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File E:\zero\zero-gateway.ps1" -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

# 3. Start Zero Host (Port 18789) if not running
if (-not (Get-NetTCPConnection -LocalPort 18789 -State Listen -ErrorAction SilentlyContinue)) {
  Write-Host "[Zero Host] Launching Zero Host on port 18789..." -ForegroundColor Green
  Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File E:\zero\zero-host.ps1" -WindowStyle Hidden
  Start-Sleep -Seconds 5
}

Write-Host "[Zero] Project Zero is ready at http://127.0.0.1:18789/" -ForegroundColor Cyan
