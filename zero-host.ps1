$ErrorActionPreference = 'Stop'
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

$ZeroRoot = $PSScriptRoot
if (-not $ZeroRoot) {
  $ZeroRoot = (Get-Location).Path
}
$env:ZERO_ROOT = $ZeroRoot

# Ensure config paths match dynamic installation location
$ConfigPath = Join-Path $ZeroRoot 'zero-system\config\zero.json'
if (Test-Path $ConfigPath) {
  $PluginEscaped = (Join-Path $ZeroRoot 'app\zero-control-ui').Replace('\', '\\')
  $WorkspaceEscaped = (Join-Path $ZeroRoot 'zero-system\state\agents\zero').Replace('\', '\\\\')
  $Content = Get-Content $ConfigPath -Raw
  $Patched = $Content -replace '"[^"]*app\\\\zero-control-ui"', "`"$PluginEscaped`""
  $Patched = $Patched -replace '"[^"]*state\\\\agents\\\\zero"', "`"$WorkspaceEscaped`""
  if ($Patched -ne $Content) {
    Set-Content -Path $ConfigPath -Value $Patched -NoNewline
  }
}

$env:OPENCLAW_STATE_DIR = Join-Path $ZeroRoot 'zero-system\state'
$env:OPENCLAW_CONFIG_PATH = $ConfigPath
$env:OPENCLAW_NO_AUTO_UPDATE = '1'
$env:DO_NOT_TRACK = '1'
Remove-Item Env:\ZERO_GATEWAY_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\OPENCLAW_GATEWAY_TOKEN -ErrorAction SilentlyContinue

Set-Location (Join-Path $ZeroRoot 'backend')
Write-Host "[Zero Host] Launching Native Zero Host on port 18789 from $ZeroRoot..." -ForegroundColor Green
$ZeroHostRunner = Join-Path $ZeroRoot 'backend\server\zero-host.mjs'
node $ZeroHostRunner
