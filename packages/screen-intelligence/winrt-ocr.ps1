$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$stream = $null
$writer = $null
$bitmap = $null
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.DataWriter, Windows.Foundation, ContentType = WindowsRuntime]
  $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  } | Select-Object -First 1
  if ($null -eq $asTaskGeneric) { throw 'WindowsRuntime AsTask helper unavailable' }
  function Await-Result($operation, [Type]$resultType) {
    $task = $asTaskGeneric.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $task.Wait(-1) | Out-Null
    return $task.Result
  }
  $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
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
  if ($payload.language) {
    $language = New-Object Windows.Globalization.Language([string]$payload.language)
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
  } else {
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  }
  if ($null -eq $engine) {
    [pscustomobject]@{ ok = $false; reason = 'ocr-language-pack-unavailable'; text = '' } | ConvertTo-Json -Compress
  } elseif ($bitmap.PixelWidth -gt [Windows.Media.Ocr.OcrEngine]::MaxImageDimension -or $bitmap.PixelHeight -gt [Windows.Media.Ocr.OcrEngine]::MaxImageDimension) {
    [pscustomobject]@{ ok = $false; reason = 'ocr-image-dimensions-exceeded'; text = '' } | ConvertTo-Json -Compress
  } else {
    $result = Await-Result ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    $text = [string]$result.Text
    if ($text.Length -gt 12000) { $text = $text.Substring(0, 12000) }
    [pscustomobject]@{ ok = $true; text = $text; language = $engine.RecognizerLanguage.LanguageTag } | ConvertTo-Json -Compress
  }
} catch {
  [pscustomobject]@{ ok = $false; reason = ('ocr-unavailable: ' + $_.Exception.Message); text = '' } | ConvertTo-Json -Compress
} finally {
  if ($null -ne $bitmap) { $bitmap.Dispose() }
  if ($null -ne $writer) { $writer.Dispose() }
  if ($null -ne $stream) { $stream.Dispose() }
}
