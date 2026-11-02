# Run the existing OCR implementation in this process, then measure its real lifetime.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$result = & (Join-Path $PSScriptRoot 'winrt-ocr.ps1') | ConvertFrom-Json
$currentProcess = [System.Diagnostics.Process]::GetCurrentProcess()
$currentProcess.Refresh()
$usage = [pscustomobject]@{
  pid = $currentProcess.Id
  cpuMs = $currentProcess.TotalProcessorTime.TotalMilliseconds
  workingSetBytes = $currentProcess.WorkingSet64
  peakWorkingSetBytes = $currentProcess.PeakWorkingSet64
  scope = 'whole-ocr-process-through-measurement'
}
$result | Add-Member -NotePropertyName resourceUsage -NotePropertyValue $usage
$result | ConvertTo-Json -Compress -Depth 4
