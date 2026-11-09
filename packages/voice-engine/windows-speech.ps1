param([ValidateSet('probe', 'synthesize', 'transcribe', 'capture', 'play')][string]$Operation)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)

function Send-Message($message) {
    [Console]::WriteLine(($message | ConvertTo-Json -Depth 8 -Compress))
}
function Load-NativeAudio {
    Add-Type -Path (Join-Path $PSScriptRoot 'windows-audio.cs')
}
function Load-Speech {
    Add-Type -AssemblyName System.Speech
}

try {
    $request = [Console]::ReadLine() | ConvertFrom-Json
    if ($Operation -eq 'probe') {
        $synthesis = @{ available = $false; reason = 'No enabled Windows speech voices installed'; voices = @() }
        $recognition = @{ available = $false; reason = 'No Windows speech recognizers installed'; languages = @() }
        try {
            Load-Speech
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
            try {
                $voices = @($synth.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { @{ name = $_.VoiceInfo.Name; language = $_.VoiceInfo.Culture.Name } })
                if ($voices.Count -gt 0) { $synthesis = @{ available = $true; voices = $voices } }
            } finally { $synth.Dispose() }
        } catch { $synthesis.reason = $_.Exception.GetBaseException().Message }
        try {
            Load-Speech
            $languages = @([System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() | ForEach-Object { $_.Culture.Name })
            if ($languages.Count -gt 0) { $recognition = @{ available = $true; languages = $languages } }
        } catch { $recognition.reason = $_.Exception.GetBaseException().Message }
        try {
            Load-NativeAudio
            $inputDevices = @([Zero.Voice.NativeAudio]::GetInputs())
            $outputDevices = @([Zero.Voice.NativeAudio]::GetOutputs())
            $inputs = $inputDevices.Count
            $outputs = $outputDevices.Count
            $microphone = @{ available = ($inputs -gt 0); deviceCount = $inputs; devices = $inputDevices; selection = 'windows-default-mapper'; permission = 'not-checked'; verified = $false }
            $output = @{ available = ($outputs -gt 0); deviceCount = $outputs; devices = $outputDevices; selection = 'windows-default-mapper'; verified = $false }
            if (!$microphone.available) { $microphone.reason = 'No Windows recording devices detected' }
            if (!$output.available) { $output.reason = 'No Windows playback devices detected' }
        } catch {
            $reason = $_.Exception.GetBaseException().Message
            $microphone = @{ available = $false; reason = $reason; permission = 'not-checked'; verified = $false }
            $output = @{ available = $false; reason = $reason; verified = $false }
        }
        Send-Message @{ type = 'result'; synthesis = $synthesis; recognition = $recognition; microphone = $microphone; output = $output }
    } elseif ($Operation -eq 'synthesize') {
        Load-Speech
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $stream = New-Object System.IO.MemoryStream
        try {
            if ($request.voice) { $synth.SelectVoice([string]$request.voice) }
            $synth.Rate = [int]$request.rate
            $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo ([int]$request.sampleRate), ([System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen), ([System.Speech.AudioFormat.AudioChannel]::Mono)
            $synth.SetOutputToAudioStream($stream, $format)
            $synth.Speak([string]$request.text)
            Send-Message @{ type = 'result'; pcm = [Convert]::ToBase64String($stream.ToArray()); voice = $synth.Voice.Name }
        } finally { $synth.Dispose(); $stream.Dispose() }
    } elseif ($Operation -eq 'transcribe') {
        Load-Speech
        $speechAssembly = [System.Speech.Recognition.SpeechRecognitionEngine].Assembly.Location
        Add-Type -Path (Join-Path $PSScriptRoot 'windows-recognition.cs') -ReferencedAssemblies $speechAssembly
        $segments = @([Zero.Voice.Recognition]::Transcribe([Convert]::FromBase64String($request.pcm), [int]$request.sampleRate, [string]$request.language))
        $text = ($segments | ForEach-Object { $_.text }) -join ' '
        Send-Message @{ type = 'result'; text = $text; segments = $segments; transcribed = ($text.Length -gt 0); reason = $(if ($text.Length -eq 0) { 'no_speech_recognized' } else { $null }) }
    } elseif ($Operation -eq 'play') {
        Load-NativeAudio
        [Zero.Voice.NativeAudio]::ListenForCancellation()
        $pcm = [Convert]::FromBase64String($request.pcm)
        [Zero.Voice.NativeAudio]::Play($pcm, [int]$request.sampleRate)
        Send-Message @{ type = 'result'; played = $true; pcmByteLength = $pcm.Length }
    } elseif ($Operation -eq 'capture') {
        Load-NativeAudio
        [Zero.Voice.NativeAudio]::ListenForCancellation()
        $deviceId = -1
        if ($null -ne $request.deviceId) { $deviceId = [int]$request.deviceId }
        [Zero.Voice.NativeAudio]::Capture([int]$request.sampleRate, [int]$request.durationMs, $deviceId)
        Send-Message @{ type = 'result'; captured = $true }
    }
} catch {
    Send-Message @{ type = 'error'; code = "VOICE_$($Operation.ToUpper())_FAILED"; message = $_.Exception.GetBaseException().Message }
    exit 1
}
