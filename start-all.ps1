$ErrorActionPreference = 'Stop'
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

# 1. Start Zero Host (Port 18789) if not running
if (-not (Get-NetTCPConnection -LocalPort 18789 -State Listen -ErrorAction SilentlyContinue)) {
  Write-Host "[Zero Host] Launching Zero Host on port 18789..." -ForegroundColor Green
  Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File E:\zero\zero-host.ps1" -WindowStyle Hidden
  Start-Sleep -Seconds 5
}

Write-Host "[Zero] Project Zero is ready at http://127.0.0.1:18789/" -ForegroundColor Cyan
