$ErrorActionPreference = 'Stop'

# Always apply pure Zero branding to all Control UI assets before starting
node 'E:\zero\backend\scripts\apply-zero-branding.mjs'

Set-Location 'E:\zero\.zero-data\fresh-workspace'
& 'powershell.exe' -ExecutionPolicy Bypass -File 'E:\zero\.zero-data\fresh-workspace\start-all.ps1'
