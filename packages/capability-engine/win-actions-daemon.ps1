# Win32 Native Computer Actions Daemon for Zero
# Ultra-fast persistent daemon communicating via stdin/stdout JSON lines.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$actionScript = Join-Path $PSScriptRoot 'win-actions.ps1'
$allowed = @('Action','X','Y','ToX','ToY','Button','Count','Text','Key','App','Url','Direction','Amount','Target','Command','FromX','FromY','WaitMs','TextB64')

# Send startup ready ping
[Console]::Out.WriteLine('{"ready":true}')

$reader = [System.Console]::In
$writer = [System.Console]::Out

while ($null -ne ($line = $reader.ReadLine())) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0) { continue }
    try {
        $req = $trimmed | ConvertFrom-Json
        $splat = @{}
        foreach ($prop in $req.PSObject.Properties) {
            # Case-insensitive match against allowed parameters
            $matched = $allowed | Where-Object { $_ -eq $prop.Name } | Select-Object -First 1
            if ($matched) {
                $splat[$matched] = $prop.Value
            }
        }
        if (-not $splat.ContainsKey('Action') -and $req.action) {
            $splat['Action'] = $req.action
        }
        $out = & $actionScript @splat
        $writer.WriteLine($out)
    } catch {
        $err = [ordered]@{
            ok = $false
            error = "execution-error"
            message = $_.Exception.Message
        }
        $writer.WriteLine(($err | ConvertTo-Json -Compress))
    }
}
