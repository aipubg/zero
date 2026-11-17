param([switch]$WithOfflineSpeech, [switch]$UseNpmBootstrap, [string]$StoreDirectory)
$ErrorActionPreference = 'Stop'
$ZeroSetupRoot = $PSScriptRoot
$SetupId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ') + '-' + [Guid]::NewGuid().ToString('N')
$SetupOutput = Join-Path $ZeroSetupRoot "artifacts\setup\$SetupId"
[System.IO.Directory]::CreateDirectory($SetupOutput) | Out-Null
$SetupReportPath = Join-Path $SetupOutput 'report.json'
$SetupReport = [ordered]@{ status = 'RUNNING'; startedAt = [DateTime]::UtcNow.ToString('o'); functionalAcceptance = 'NOT_ESTABLISHED_BY_SETUP'; ownerPreferenceWrites = 'NONE_REQUESTED_BY_SETUP' }
$PinnedPnpm = '11.25.0'

function Invoke-ZeroSetupPnpm {
  param([string]$Directory, [string[]]$Arguments)
  Push-Location -LiteralPath $Directory
  try {
    if ($script:UseInstalledPnpm) { & $script:PnpmExecutable @Arguments }
    else { & $script:NpmExecutable exec --yes "--package=pnpm@$PinnedPnpm" -- pnpm @Arguments }
    if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed in $Directory (exit $LASTEXITCODE)" }
  } finally { Pop-Location }
}

try {
  $NodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
  $NodeVersion = (& $NodeExecutable -p 'process.versions.node').Trim()
  if ($LASTEXITCODE -ne 0 -or [version]$NodeVersion -lt [version]'24.11.0') { throw 'Install Node.js 24.11 or later before running ZERO setup.' }
  if ((& $NodeExecutable -p "process.platform + '/' + process.arch").Trim() -ne 'win32/x64') { throw 'This setup provisions Windows x64 only.' }
  $SetupReport['nodeVersion'] = $NodeVersion
  $PnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
  $UseInstalledPnpm = $false
  if ($PnpmCommand -and -not $UseNpmBootstrap) {
    $PnpmExecutable = $PnpmCommand.Source
    $ObservedPnpm = (& $PnpmExecutable --version).Trim()
    $UseInstalledPnpm = $LASTEXITCODE -eq 0 -and $ObservedPnpm -eq $PinnedPnpm
  }
  if (-not $UseInstalledPnpm) { $NpmExecutable = (Get-Command npm.cmd -ErrorAction Stop).Source }
  $SetupReport['pnpmVersion'] = $PinnedPnpm
  $SetupReport['pnpmSource'] = if ($UseInstalledPnpm) { 'existing-exact-version' } else { 'npm-exec-pinned-version' }
  # No upstream lifecycle scripts, global installation, approval dialog or owner
  # config rewrite. Native runtime packages and esbuild ship pinned binaries.
  $InstallArguments = @('install', '--frozen-lockfile', '--ignore-scripts')
  if ($StoreDirectory) { $InstallArguments += @('--store-dir', $StoreDirectory) }
  Invoke-ZeroSetupPnpm -Directory (Join-Path $ZeroSetupRoot 'backend') -Arguments $InstallArguments
  Invoke-ZeroSetupPnpm -Directory (Join-Path $ZeroSetupRoot 'app\zero-control-ui') -Arguments $InstallArguments
  $SetupReport['dependencies'] = 'FROZEN_LOCKFILE_INSTALLED'
  & $NodeExecutable (Join-Path $ZeroSetupRoot 'app\zero-control-ui\build.mjs')
  if ($LASTEXITCODE -ne 0) { throw "UI build failed (exit $LASTEXITCODE)" }
  $SetupReport['ui'] = 'BUILT_FROM_SOURCE'
  & $NodeExecutable (Join-Path $ZeroSetupRoot 'scripts\install-agent-desktop.mjs')
  if ($LASTEXITCODE -ne 0) { throw "Primary desktop runtime installation failed (exit $LASTEXITCODE)" }
  $SetupReport['desktop'] = 'PINNED_ASSETS_VERIFIED'
  if ($WithOfflineSpeech) {
    & $NodeExecutable (Join-Path $ZeroSetupRoot 'scripts\install-local-stt.mjs')
    if ($LASTEXITCODE -ne 0) { throw "Offline speech assets failed (exit $LASTEXITCODE)" }
    $SetupReport['offlineSpeech'] = 'PINNED_ASSETS_VERIFIED_NOT_SELECTED'
  }
  $SetupReport['status'] = 'PASS'
  Write-Host 'ZERO dependencies, UI and primary desktop runtime are prepared. Launch zero-host.cmd to start.'
  Write-Host 'Setup does not certify model inference, device accuracy or production acceptance.'
} catch {
  $SetupReport['status'] = 'FAIL'
  $SetupReport['error'] = $_.Exception.Message
  throw
} finally {
  $SetupReport['finishedAt'] = [DateTime]::UtcNow.ToString('o')
  [System.IO.File]::WriteAllText($SetupReportPath, ($SetupReport | ConvertTo-Json -Depth 8), (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "Setup evidence: $SetupReportPath"
}
