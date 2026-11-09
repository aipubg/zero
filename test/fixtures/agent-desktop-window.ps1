param([string]$Title, [string]$Output)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class FixtureWindow { [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr handle, int command); }'
$form = New-Object System.Windows.Forms.Form
$form.Text = $Title
$form.Width = 460
$form.Height = 240
$inputBox = New-Object System.Windows.Forms.TextBox
$inputBox.AccessibleName = 'ZERO verification input'
$inputBox.SetBounds(20, 20, 380, 30)
$button = New-Object System.Windows.Forms.Button
$button.Text = 'Apply value'
$button.AccessibleName = 'ZERO verification apply'
$button.SetBounds(20, 65, 160, 35)
$status = New-Object System.Windows.Forms.Label
$status.Text = 'Not applied'
$status.SetBounds(20, 115, 380, 30)
$script:clicks = 0
$button.Add_Click({
  $script:clicks++
  $status.Text = 'Applied ' + $script:clicks
  @{ text = $inputBox.Text; clicks = $script:clicks } | ConvertTo-Json -Compress | Set-Content -LiteralPath $Output -Encoding UTF8
})
$form.Controls.AddRange(@($inputBox, $button, $status))
$form.Add_Shown({ [void][FixtureWindow]::ShowWindow($form.Handle, 8); [Console]::WriteLine('READY'); [Console]::Out.Flush() })
[System.Windows.Forms.Application]::Run($form)
