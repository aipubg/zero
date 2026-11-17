$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class ZeroForegroundWindow {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
}
"@

$maxDepth = 4
$maxNodes = 300
$maxText = 8000
$lines = New-Object System.Collections.Generic.List[string]
$count = 0

function Add-NodeText([System.Windows.Automation.AutomationElement]$node, [int]$depth) {
  if ($null -eq $node -or $script:count -ge $maxNodes -or $depth -gt $maxDepth) { return }
  $script:count++
  try {
    $name = [string]$node.Current.Name
    $type = [string]$node.Current.ControlType.ProgrammaticName
    $id = [string]$node.Current.AutomationId
    if ($name.Trim().Length -gt 0 -or $id.Trim().Length -gt 0) {
      $script:lines.Add(("{0}|{1}|{2}" -f $type, $name.Trim(), $id.Trim()))
    }
  } catch {
    return
  }
  try {
    $child = [System.Windows.Automation.TreeWalker]::ControlViewWalker.GetFirstChild($node)
    while ($null -ne $child -and $script:count -lt $maxNodes) {
      Add-NodeText $child ($depth + 1)
      $child = [System.Windows.Automation.TreeWalker]::ControlViewWalker.GetNextSibling($child)
    }
  } catch {
    return
  }
}

try {
  $hwnd = [ZeroForegroundWindow]::GetForegroundWindow()
  if ($hwnd -eq [IntPtr]::Zero) { throw 'no foreground window' }
  $root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
  Add-NodeText $root 0
  $processId = 0
  $windowTitle = ''
  try {
    $processId = [int]$root.Current.ProcessId
    $windowTitle = [string]$root.Current.Name
  } catch { }
  $app = ''
  if ($processId -gt 0) {
    try { $app = [string](Get-Process -Id $processId -ErrorAction Stop).ProcessName } catch { }
  }
  $joined = [string]::Join("`n", $script:lines)
  if ($joined.Length -gt $maxText) { $joined = $joined.Substring(0, $maxText) }
  [pscustomobject]@{
    ok = $true
    app = $app
    window = $windowTitle
    text = $joined
    nodes = $script:count
  } | ConvertTo-Json -Compress
} catch {
  [pscustomobject]@{
    ok = $false
    reason = 'uia-unavailable'
    text = ''
  } | ConvertTo-Json -Compress
}
