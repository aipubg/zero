param([Parameter(Mandatory=$true)][int]$RootProcessId)
$ErrorActionPreference = 'Stop'
$began = [DateTime]::UtcNow
$inventory = @(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate)
$rootEntry = $inventory | Where-Object { $_.ProcessId -eq $RootProcessId } | Select-Object -First 1
if ($null -eq $rootEntry) { throw 'Owned root process absent from inventory' }
$selected = [System.Collections.Generic.HashSet[int]]::new()
[void]$selected.Add($RootProcessId)
do {
  $changed = $false
  foreach ($entry in $inventory) {
    if ($entry.ProcessId -ne $PID -and $selected.Contains([int]$entry.ParentProcessId)) {
      $parentEntry = $inventory | Where-Object { $_.ProcessId -eq $entry.ParentProcessId } | Select-Object -First 1
      if ($null -ne $parentEntry -and $entry.CreationDate -ge $parentEntry.CreationDate -and $selected.Add([int]$entry.ProcessId)) { $changed = $true }
    }
  }
} while ($changed)
if ($selected.Count -gt 256) { throw 'Owned process tree exceeds sampling bound' }
$rows = @(); $missing = @()
foreach ($targetId in $selected) {
  $measured = $null
  try {
    $measured = [System.Diagnostics.Process]::GetProcessById($targetId)
    $measured.Refresh()
    $expected = $inventory | Where-Object { $_.ProcessId -eq $targetId } | Select-Object -First 1
    if ($null -eq $expected -or [Math]::Abs(($measured.StartTime.ToUniversalTime() - $expected.CreationDate.ToUniversalTime()).TotalMilliseconds) -gt 1) { throw 'Process identity changed during sample' }
    $rows += [pscustomobject][ordered]@{ pid=$measured.Id; processName=$measured.ProcessName; startedAt=$measured.StartTime.ToUniversalTime().ToString('o'); measuredAt=[DateTime]::UtcNow.ToString('o'); cpuMs=$measured.TotalProcessorTime.TotalMilliseconds; workingSetBytes=$measured.WorkingSet64; privateMemoryBytes=$measured.PrivateMemorySize64 }
  } catch { $missing += $targetId }
  finally { if ($null -ne $measured) { $measured.Dispose() } }
}
if (-not ($rows | Where-Object { $_.pid -eq $RootProcessId })) { throw 'Owned root process not measured' }
[ordered]@{ status=$(if ($missing.Count) {'partial'} else {'measured'}); rootPid=$RootProcessId; excludedSamplerPid=$PID; startedAt=$began.ToString('o'); completedAt=[DateTime]::UtcNow.ToString('o'); processes=@($rows); missingPids=@($missing); sampledWorkingSetBytes=($rows | Measure-Object workingSetBytes -Sum).Sum; sampledPrivateMemoryBytes=($rows | Measure-Object privateMemoryBytes -Sum).Sum; scope='Observed owned process tree during bounded sampling window; working sets may share pages; not continuous peak or lifetime CPU' } | ConvertTo-Json -Depth 5 -Compress
