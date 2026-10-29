# CU-01 spike preflight — read-only environment snapshot for the designated Zero Windows box.
# STATUS: PREPARED, NOT EXECUTED. Run it only inside the designated Zero environment during an
#         approved window. It performs NO install, NO download, NO process launch, NO input,
#         NO desktop control, and NO writes outside -OutFile.
# Why it exists: CU-00 found that the non-macOS CUA capture path THROWS unless reported screen
#         geometry equals screenshot geometry, and that only the primary display is controllable.
#         Those two facts decide whether the spike can pass at all, so we measure them first.
# Usage (in the designated environment):
#         powershell -NoProfile -ExecutionPolicy Bypass -File preflight.ps1 -OutFile preflight.json
#   -NoProfile keeps the user's PowerShell profile from running; -ExecutionPolicy Bypass is
#   process-scoped for this file only and touches no persistent setting.

param(
  [string]$OutFile = "preflight.json"
)

$ErrorActionPreference = 'Stop'

function Read-Only([string]$name, [scriptblock]$body) {
  # Never let one unavailable probe abort the snapshot; record the failure instead.
  try { return & $body }
  catch { return @{ __error = "$name : $($_.Exception.Message)" } }
}

$snap = [ordered]@{
  capturedAtUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  computerRoleLabel = 'designated-zero-environment'   # never record the account name
  checks = [ordered]@{}

  # --- OS build (CU-00 4.1: win32-x64-msvc and win32-arm64-msvc are the only published targets)
  os = Read-Only 'os' {
    $ci = Get-CimInstance -ClassName Win32_OperatingSystem
    [ordered]@{
      caption      = $ci.Caption
      version      = $ci.Version
      buildNumber  = $ci.BuildNumber
      arch         = $env:PROCESSOR_ARCHITECTURE
      uefiOrBios   = $null
      productName  = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\Current Version' -Name ProductName -ErrorAction SilentlyContinue).ProductName
    }
  }

  # --- CPU arch must map to a published native package
  cpuTarget = Read-Only 'cpuTarget' {
    switch ($env:PROCESSOR_ARCHITECTURE) {
      'AMD64' { 'win32-x64-msvc' }
      'ARM64' { 'win32-arm64-msvc' }
      default { "UNSUPPORTED:$($env:PROCESSOR_ARCHITECTURE)" }
    }
  }

  # --- SESSION STATE IS THE BIG ONE. CU-00 4.5: the node must start from the interactive desktop
  #     session. Record how we are connected and whether the console session is the active one,
  #     so a later "COMPUTER_DRIVER_UNAVAILABLE" is explainable from evidence, not guesswork.
  session = Read-Only 'session' {
    $q = (query session 2>$null) -join "`n"
    $console = Get-CimInstance -ClassName Win32_ComputerSystem
    [ordered]@{
      querySessionRaw = $q
      userName        = $env:USERNAME        # a test account is expected; redact before sharing
      rdpSession      = ($env:SESSIONNAME -eq 'RDP')
      consoleSession  = ($env:SESSIONNAME -eq 'Console')
      parts           = $console.TotalPhysicalMemory
    }
  }

  # --- Displays: primary-only control, and scaling must be 100% or the capture path is expected
  #     to throw COMPUTER_UNSUPPORTED_DISPLAY.
  displays = Read-Only 'displays' {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
    [System.Windows.Forms.Screen]::AllScreens | ForEach-Object {
      [ordered]@{
        deviceName = $_.DeviceName
        primary    = $_.Primary
        bounds     = "$($_.Bounds.Width)x$($_.Bounds.Height)"
        workArea   = "$($_.WorkArea.Width)x$($_.WorkArea.Height)"
        bitsPerPix = $_.BitsPerPixel
      }
    }
  }

  scaling = Read-Only 'scaling' {
    $logPixels = (Get-ItemProperty 'HKCU:\Control Panel\Desktop' -Name LogPixels -ErrorAction SilentlyContinue).LogPixels
    $dpiScale  = (Get-ItemProperty 'HKCU:\Control Panel\Desktop\WindowMetrics' -Name AppliedDPI -ErrorAction SilentlyContinue).AppliedDPI
    [ordered]@{
      logPixels      = $logPixels
      appliedDpi     = $dpiScale
      effectivePct   = if ($dpiScale) { [int](($dpiScale / 96.0) * 100) } else { $null }
      # CU-00 5 "DPI handling is an equality assertion, not a correction": expect 100 or record the
      # predicted failure instead of calling it a driver bug later.
      predictedRisk  = if ($dpiScale -and $dpiScale -ne 96) { 'non-100-percent scaling: expect COMPUTER_UNSUPPORTED_DISPLAY' } else { 'ok-baseline' }
    }
  }

  # --- VNC/RFB relay prerequisite for live view (CU-00 4.9). READ-ONLY port presence check;
  #     we do not start, stop, or configure anything here.
  rfbLoopback = Read-Only 'rfbLoopback' {
    $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.LocalAddress -in @('127.0.0.1','::1') -and $_.LocalPort -in 5900..5910 }
    [ordered]@{
      loopbackRfbListenersFound = @($listeners).Count
      ports                     = @($listeners | ForEach-Object { $_.LocalPort }) | Sort-Object -Unique
      # No listener => the Control UI Desktop panel has nothing to relay and step S8 cannot pass.
      expected                  = 'at least one 127.0.0.1:590x listener from the VNC server'
    }
  }

  # --- Toolchain presence only (never install, never activate Corepack, never launch anything).
  toolchain = Read-Only 'toolchain' {
    [ordered]@{
      node = (Get-Command node -ErrorAction SilentlyContinue).Source
      npm  = (Get-Command npm  -ErrorAction SilentlyContinue).Source
      pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue).Source
      git  = (Get-Command git  -ErrorAction SilentlyContinue).Source
      openclaw = (Get-Command openclaw -ErrorAction SilentlyContinue).Source
    }
  }

  # --- Free space, so the ≈28 MiB driver delta + OpenClaw estimate is checked against reality.
  disk = Read-Only 'disk' {
    Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
      [ordered]@{ device = $_.DeviceID; freeGB = [math]::Round($_.FreeSpace / 1GB, 1); sizeGB = [math]::Round($_.Size / 1GB, 1) }
    }
  }

  ram = Read-Only 'ram' {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    [ordered]@{ totalGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1); freeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 1) }
  }
}

# Verdicts are deliberately phrased as predictions to test, not as capability claims.
$snap.checks = [ordered]@{
  supportedCpuTarget = ($snap.cpuTarget -in @('win32-x64-msvc','win32-arm64-msvc'))
  singleDisplayOnly  = (@($snap.displays).Count -eq 1)
  scalingIs100       = ($snap.scaling.effectivePct -eq 100)
  rfbLoopbackPresent = ($snap.rfbLoopback.loopbackRfbListenersFound -gt 0)
  openclawInstalled  = ($null -ne $snap.toolchain.openclaw)
  consoleSession     = ($snap.session.consoleSession -eq $true)
}
$snap.verdict = if (-not $snap.checks.supportedCpuTarget) { 'BLOCKED: unsupported CPU target' }
                elseif (-not $snap.checks.singleDisplayOnly) { 'RISK: multi-display; only the primary is controllable (CU-00 5)' }
                elseif (-not $snap.checks.scalingIs100) { 'RISK: non-100 percent scaling; capture geometry assertion is expected to fail (CU-00 5)' }
                elseif (-not $snap.checks.rfbLoopbackPresent) { 'RISK: no loopback RFB listener; live-view step S8 cannot pass yet (CU-00 4.9)' }
                elseif (-not $snap.checks.openclawInstalled) { 'PRE-INSTALL: OpenClaw absent; install step is the gated action' }
                else { 'READY for the CU-01 sequence' }

# Redaction guard: refuse to write if the snapshot accidentally carries the account name.
$json = $snap | ConvertTo-Json -Depth 8
if ($snap.session.userName -and $json -match [regex]::Escape($snap.session.userName)) {
  $json = $json -replace [regex]::Escape($snap.session.userName), '<redacted-test-account>'
}
Set-Content -Path $OutFile -Value $json -Encoding UTF8
Write-Output "preflight written to $OutFile ; verdict = $($snap.verdict)"
