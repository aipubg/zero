$ErrorActionPreference = 'Stop'
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

Set-Location 'E:\zero'
Write-Host "[Zero Gateway] Launching Zero Gateway on port 18790..." -ForegroundColor Green
node 'E:\zero\backend\gateway\server.mjs'
