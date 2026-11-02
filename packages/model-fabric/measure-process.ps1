param([Parameter(Mandatory=$true)][int]$TargetProcessId, [Parameter(Mandatory=$true)][string]$ExpectedName)
$ErrorActionPreference = 'Stop'
$measured = [System.Diagnostics.Process]::GetProcessById($TargetProcessId)
try {
  $measured.Refresh()
  if ($measured.ProcessName -ne $ExpectedName) { throw 'Measured process identity mismatch' }
  [ordered]@{
    pid = $measured.Id
    processName = $measured.ProcessName
    startedAt = $measured.StartTime.ToUniversalTime().ToString('o')
    measuredAt = [DateTime]::UtcNow.ToString('o')
    cpuMs = $measured.TotalProcessorTime.TotalMilliseconds
    workingSetBytes = $measured.WorkingSet64
    peakWorkingSetBytes = $measured.PeakWorkingSet64
    privateMemoryBytes = $measured.PrivateMemorySize64
  } | ConvertTo-Json -Compress
} finally { $measured.Dispose() }
