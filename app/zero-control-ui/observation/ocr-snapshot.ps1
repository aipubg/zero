$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.DataWriter, Windows.Foundation, ContentType = WindowsRuntime]

  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  } | Select-Object -First 1)
  if ($null -eq $asTaskGeneric) { throw 'WindowsRuntime AsTask helper unavailable' }

  function Await-Result($operation, [Type]$resultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($resultType)
    $netTask = $asTask.Invoke($null, @($operation))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
  }

  $raw = [Console]::In.ReadToEnd()
  if ([string]::IsNullOrWhiteSpace($raw)) { throw 'empty OCR input' }
  $payload = $raw | ConvertFrom-Json
  $bytes = [Convert]::FromBase64String([string]$payload.dataBase64)
  if ($bytes.Length -eq 0 -or $bytes.Length -gt 8MB) { throw 'OCR input size rejected' }

  $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
  $writer = New-Object Windows.Storage.Streams.DataWriter($stream)
  $writer.WriteBytes($bytes)
  Await-Result ($writer.StoreAsync()) ([UInt32]) | Out-Null
  $writer.DetachStream() | Out-Null
  $stream.Seek(0)

  $decoder = Await-Result ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await-Result ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  if ($null -eq $engine) {
    [pscustomobject]@{ ok = $false; reason = 'ocr-language-pack-unavailable'; text = '' } | ConvertTo-Json -Compress
    exit 0
  }
  $result = Await-Result ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
  $text = [string]$result.Text
  if ($text.Length -gt 12000) { $text = $text.Substring(0, 12000) }
  [pscustomobject]@{ ok = $true; text = $text } | ConvertTo-Json -Compress
} catch {
  [pscustomobject]@{ ok = $false; reason = 'ocr-unavailable'; text = '' } | ConvertTo-Json -Compress
}
