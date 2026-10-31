$ErrorActionPreference = 'Stop'
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

$ZeroRoot = $PSScriptRoot
if (-not $ZeroRoot) {
  $ZeroRoot = (Get-Location).Path
}
$env:ZERO_ROOT = $ZeroRoot

Set-Location $ZeroRoot
Write-Host "[Zero Gateway] Launching Zero Gateway on port 18789 from $ZeroRoot..." -ForegroundColor Green
$ServerScript = Join-Path $ZeroRoot 'backend\gateway\server.mjs'
node $ServerScript
