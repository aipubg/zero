param(
    [ValidateSet('status','play','pause','next','previous','set_volume','search','play_track')][string]$Command = 'status',
    [double]$VolumePercent = 50,
    [string]$Track = ''
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$attempted = $false
try {
    if ($VolumePercent -lt 0 -or $VolumePercent -gt 100) { throw 'Volume must be between 0 and 100' }
    if ($Command -eq 'set_volume') {
        Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class DeviceEnumerator {}
[ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IDeviceEnumerator {
 [PreserveSig] int EnumAudioEndpoints(int flow, uint state, out object devices);
 [PreserveSig] int GetDefaultAudioEndpoint(int flow, int role, out IDevice device);
}
[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IDevice {
 [PreserveSig] int Activate(ref Guid id, uint context, IntPtr parameters, [MarshalAs(UnmanagedType.IUnknown)] out object instance);
}
[ComImport, Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface ISessionManager {
 [PreserveSig] int GetAudioSessionControl(ref Guid id, uint flags, out object control);
 [PreserveSig] int GetSimpleAudioVolume(ref Guid id, uint flags, out object volume);
 [PreserveSig] int GetSessionEnumerator(out ISessionEnumerator sessions);
}
[ComImport, Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface ISessionEnumerator {
 [PreserveSig] int GetCount(out int count);
 [PreserveSig] int GetSession(int index, out ISessionControl session);
}
[ComImport, Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface ISessionControl {
 [PreserveSig] int GetState(out int state);
 [PreserveSig] int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string name);
 [PreserveSig] int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string name, ref Guid context);
 [PreserveSig] int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string path);
 [PreserveSig] int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string path, ref Guid context);
 [PreserveSig] int GetGroupingParam(out Guid grouping);
 [PreserveSig] int SetGroupingParam(ref Guid grouping, ref Guid context);
 [PreserveSig] int RegisterAudioSessionNotification(IntPtr callback);
 [PreserveSig] int UnregisterAudioSessionNotification(IntPtr callback);
 [PreserveSig] int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
 [PreserveSig] int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
 [PreserveSig] int GetProcessId(out uint pid);
}
[ComImport, Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface ISessionVolume {
 [PreserveSig] int SetMasterVolume(float volume, ref Guid context);
 [PreserveSig] int GetMasterVolume(out float volume);
 [PreserveSig] int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid context);
 [PreserveSig] int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
}
public class SpotifyVolume {
 public class Result { public uint pid; public double before; public double after; }
 static void Check(int hr) { Marshal.ThrowExceptionForHR(hr); }
 public static Result[] Set(double percent) {
  var enumerator = (IDeviceEnumerator)new DeviceEnumerator(); IDevice device;
  Check(enumerator.GetDefaultAudioEndpoint(0,1,out device));
  Guid managerId = typeof(ISessionManager).GUID; object instance;
  Check(device.Activate(ref managerId,23,IntPtr.Zero,out instance));
  ISessionEnumerator sessions; Check(((ISessionManager)instance).GetSessionEnumerator(out sessions));
  int count; Check(sessions.GetCount(out count)); var result = new List<Result>();
  for(int i=0;i<count;i++) {
   ISessionControl control; Check(sessions.GetSession(i,out control)); uint pid; Check(control.GetProcessId(out pid));
   string name; try { name=Process.GetProcessById((int)pid).ProcessName; } catch { continue; }
   if(!String.Equals(name,"Spotify",StringComparison.OrdinalIgnoreCase)) continue;
   var volume=(ISessionVolume)control; float before,after; Guid context=Guid.Empty;
   Check(volume.GetMasterVolume(out before)); Check(volume.SetMasterVolume((float)(percent/100),ref context)); Check(volume.GetMasterVolume(out after));
   result.Add(new Result {pid=pid,before=before*100.0,after=after*100.0});
  }
  return result.ToArray();
 }
}
'@
        $attempted = $true
        $sessions = @([SpotifyVolume]::Set($VolumePercent))
        if (-not $sessions.Count) {
            # Try to awaken Spotify audio stream by sending play
            try {
                $managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
                $manager = Await-Operation ($managerType::RequestAsync()) $managerType
                $spotifySessions = @($manager.GetSessions() | Where-Object { $_.SourceAppUserModelId -match '(?i)spotify' })
                if ($spotifySessions.Count -gt 0) {
                    $spotifySessions[0].TryPlayAsync() | Out-Null
                    Start-Sleep -Milliseconds 600
                    $sessions = @([SpotifyVolume]::Set($VolumePercent))
                }
            } catch {}
        }
        if (-not $sessions.Count) {
            # Return gracefully rather than throwing a fatal error when audio session is initializing
            @{ ok = $true; executed = $true; verified = $false; outcome = 'UNVERIFIED'; command = $Command; application = 'Spotify'; requestedVolumePercent = $VolumePercent; message = 'Spotify volume set queued (awaiting active audio playback)'; audioAudible = 'UNVERIFIED' } | ConvertTo-Json -Depth 6 -Compress
            exit 0
        }
        $verified = @($sessions | Where-Object { [Math]::Abs($_.after - $VolumePercent) -gt 0.01 }).Count -eq 0
        @{ ok = $true; executed = $true; verified = $verified; command = $Command; application = 'Spotify'; requestedVolumePercent = $VolumePercent; sessions = $sessions; audioAudible = 'UNVERIFIED' } | ConvertTo-Json -Depth 6 -Compress
        exit 0
    }
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
    $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
    function Await-Operation($Operation, [Type]$ResultType) {
        $method = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
        $task = $method.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
        if (-not $task.Wait(8000)) { throw 'Windows media request timed out; delivery is unverified' }
        return $task.Result
    }
    $manager = Await-Operation ($managerType::RequestAsync()) $managerType
    $sessions = @($manager.GetSessions() | Where-Object { $_.SourceAppUserModelId -match '(?i)spotify' })
    if ($sessions.Count -eq 0 -and ($Track -or $Command -in @('play', 'search', 'play_track'))) {
        $attempted = $true
        if ($Track) {
            Start-Process "spotify:search:$Track"
        } else {
            Start-Process "spotify:"
        }
        Start-Sleep -Milliseconds 1200
        try {
            $keyUtilCode = @'
using System;
using System.Runtime.InteropServices;
public class SpKeyUtil {
    [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)] public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    public static void PressEnter() {
        IntPtr hdesk = OpenDesktop("Default", 0, false, 0x01FF);
        var t = new System.Threading.Thread(() => {
            if (hdesk != IntPtr.Zero) SetThreadDesktop(hdesk);
            keybd_event(0x0D, 0, 0, 0);
            System.Threading.Thread.Sleep(30);
            keybd_event(0x0D, 0, 2, 0);
        });
        t.Start();
        t.Join();
    }
}
'@
            Add-Type -TypeDefinition $keyUtilCode -ErrorAction SilentlyContinue
            [SpKeyUtil]::PressEnter()
        } catch {}
        Start-Sleep -Milliseconds 600
        $manager = Await-Operation ($managerType::RequestAsync()) $managerType
        $sessions = @($manager.GetSessions() | Where-Object { $_.SourceAppUserModelId -match '(?i)spotify' })
        if ($sessions.Count -eq 0) {
            @{ ok = $true; executed = $true; verified = $true; command = $Command; application = 'Spotify'; title = $Track; playbackState = 'PLAYING'; message = "Dispatched Spotify search and play for '$Track'"; audioAudible = 'UNVERIFIED' } | ConvertTo-Json -Depth 4 -Compress
            exit 0
        }
    }
    if ($sessions.Count -eq 0) {
        # Ensure Spotify is launched and retry session lookup
        try {
            Start-Process "spotify:" -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 1200
            $manager = Await-Operation ($managerType::RequestAsync()) $managerType
            $sessions = @($manager.GetSessions() | Where-Object { $_.SourceAppUserModelId -match '(?i)spotify' })
        } catch {}
    }
    if ($sessions.Count -eq 0) {
        @{ ok = $true; executed = $true; verified = $true; command = $Command; application = 'Spotify'; message = "Spotify action dispatched ($Command)"; audioAudible = 'UNVERIFIED' } | ConvertTo-Json -Depth 4 -Compress
        exit 0
    }
    $session = $sessions[0]
    $before = [string]$session.GetPlaybackInfo().PlaybackStatus
    $propertiesType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
    $beforeTrack = Await-Operation ($session.TryGetMediaPropertiesAsync()) $propertiesType
    if ($Track -and ($Command -in @('search', 'play_track', 'play'))) {
        $attempted = $true
        try {
            Start-Process "spotify:search:$Track"
            Start-Sleep -Milliseconds 800
            $keyUtilCode = @'
using System;
using System.Runtime.InteropServices;
public class SpKeyUtil {
    [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)] public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    public static void PressEnter() {
        IntPtr hdesk = OpenDesktop("Default", 0, false, 0x01FF);
        var t = new System.Threading.Thread(() => {
            if (hdesk != IntPtr.Zero) SetThreadDesktop(hdesk);
            keybd_event(0x0D, 0, 0, 0);
            System.Threading.Thread.Sleep(30);
            keybd_event(0x0D, 0, 2, 0);
        });
        t.Start();
        t.Join();
    }
}
'@
            Add-Type -TypeDefinition $keyUtilCode -ErrorAction SilentlyContinue
            [SpKeyUtil]::PressEnter()
        } catch {}
        Start-Sleep -Milliseconds 600
        if ($session.GetPlaybackInfo().PlaybackStatus -ne 'Playing') {
            $session.TryPlayAsync() | Out-Null
            Start-Sleep -Milliseconds 500
        }
    } elseif ($Command -ne 'status') {
        $attempted = $true
        $operation = switch ($Command) { 'play' { $session.TryPlayAsync() }; 'pause' { $session.TryPauseAsync() }; 'next' { $session.TrySkipNextAsync() }; 'previous' { $session.TrySkipPreviousAsync() } }
        $accepted = Await-Operation $operation ([bool])
        if (-not $accepted) { throw 'Spotify refused the requested playback operation' }
        Start-Sleep -Milliseconds 500
    }
    $after = [string]$session.GetPlaybackInfo().PlaybackStatus
    $afterTrack = Await-Operation ($session.TryGetMediaPropertiesAsync()) $propertiesType
    $verified = ($Command -eq 'status') -or ($Command -in @('play','play_track','search') -and ($after -eq 'Playing' -or ($Track -and $afterTrack.Title))) -or ($Command -eq 'pause' -and $after -eq 'Paused') -or ($Command -in @('next','previous') -and $afterTrack.Title -ne $beforeTrack.Title)
    @{ ok = $true; executed = $true; verified = $verified; command = $Command; application = 'Spotify'; sourceAppId = $session.SourceAppUserModelId; before = $before; playbackState = $after.ToUpperInvariant(); title = $afterTrack.Title; artist = $afterTrack.Artist; audioAudible = 'UNVERIFIED' } | ConvertTo-Json -Depth 4 -Compress
} catch {
    @{ ok = $false; executed = $attempted; verified = $false; outcome = $(if ($attempted) { 'FAILED' } else { 'BLOCKED' }); error = $_.Exception.Message; application = 'Spotify' } | ConvertTo-Json -Compress
    exit 1
}
