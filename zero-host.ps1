$ErrorActionPreference = 'Stop'
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

# Apply Zero branding
node 'E:\zero\backend\scripts\apply-zero-branding.mjs'

$env:OPENCLAW_STATE_DIR = 'E:\zero\zero-system\state'
$env:OPENCLAW_CONFIG_PATH = 'E:\zero\zero-system\config\zero.json'
$env:OPENCLAW_NO_AUTO_UPDATE = '1'
$env:DO_NOT_TRACK = '1'
Remove-Item Env:\ZERO_GATEWAY_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\OPENCLAW_GATEWAY_TOKEN -ErrorAction SilentlyContinue
Set-Location 'E:\zero\backend'
Write-Host "[Zero Host] Launching Zero Host on port 18789..." -ForegroundColor Green
& 'E:\zero\backend\node_modules\.bin\openclaw.cmd' gateway --port 18789
