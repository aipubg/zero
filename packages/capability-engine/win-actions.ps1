# Native Windows Computer Action Automation for Zero
param(
  [Parameter(Mandatory=$true)]
  [string]$Action,
  [Parameter(Mandatory=$false)]
  [int]$X = 0,
  [Parameter(Mandatory=$false)]
  [int]$Y = 0,
  [Parameter(Mandatory=$false)]
  [int]$ToX = 0,
  [Parameter(Mandatory=$false)]
  [int]$ToY = 0,
  [Parameter(Mandatory=$false)]
  [string]$Button = "left",
  [Parameter(Mandatory=$false)]
  [int]$Count = 1,
  [Parameter(Mandatory=$false)]
  [string]$Text = "",
  [Parameter(Mandatory=$false)]
  [string]$Key = "",
  [Parameter(Mandatory=$false)]
  [string]$App = "",
  [Parameter(Mandatory=$false)]
  [string]$Url = "",
  [Parameter(Mandatory=$false)]
  [string]$Direction = "down",
  [Parameter(Mandatory=$false)]
  [int]$Amount = 3,
  [Parameter(Mandatory=$false)]
  [string]$Target = "",
  [Parameter(Mandatory=$false)]
  [string]$Command = "",
  [Parameter(Mandatory=$false)]
  [int]$FromX = -1,
  [Parameter(Mandatory=$false)]
  [int]$FromY = -1,
  [Parameter(Mandatory=$false)]
  [int]$WaitMs = 0,
  [Parameter(Mandatory=$false)]
  [string]$TextB64 = ""
)

# Text arrives base64-encoded so non-ASCII characters (Hindi, emoji) survive the
# command line; output is UTF-8 for the same reason.
if ($TextB64) { $Text = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($TextB64)) }
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$csharp = @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class WinApiCore {
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
    public const uint MOUSEEVENTF_WHEEL = 0x0800;

    public static void Click(int x, int y, string button, int count) {
        SetCursorPos(x, y);
        uint down = MOUSEEVENTF_LEFTDOWN;
        uint up = MOUSEEVENTF_LEFTUP;
        if (button == "right") {
            down = MOUSEEVENTF_RIGHTDOWN;
            up = MOUSEEVENTF_RIGHTUP;
        } else if (button == "middle") {
            down = MOUSEEVENTF_MIDDLEDOWN;
            up = MOUSEEVENTF_MIDDLEUP;
        }
        for (int i = 0; i < count; i++) {
            mouse_event(down, 0, 0, 0, 0);
            mouse_event(up, 0, 0, 0, 0);
            if (count > 1) System.Threading.Thread.Sleep(80);
        }
    }

    public static void Drag(int fromX, int fromY, int toX, int toY) {
        SetCursorPos(fromX, fromY);
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        System.Threading.Thread.Sleep(80);
        SetCursorPos(toX, toY);
        System.Threading.Thread.Sleep(80);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    }

    public static void Scroll(int x, int y, int amount) {
        SetCursorPos(x, y);
        mouse_event(MOUSEEVENTF_WHEEL, 0, 0, (uint)amount, 0);
    }
}
'@

try {
  Add-Type -TypeDefinition $csharp
} catch {
  # Type may already be compiled
}

$windowApi = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class WinApiWindow {
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc callback, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
    [StructLayout(LayoutKind.Sequential)]
    public struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
    [StructLayout(LayoutKind.Sequential)]
    public struct MOUSEINPUT { public int dx; public int dy; public uint mouseData; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
    [StructLayout(LayoutKind.Explicit)]
    public struct INPUTUNION { [FieldOffset(0)] public MOUSEINPUT mi; [FieldOffset(0)] public KEYBDINPUT ki; }
    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT { public uint type; public INPUTUNION u; }
    [DllImport("user32.dll", SetLastError = true)] public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    static INPUT Key(ushort vk, ushort scan, uint flags) {
        var input = new INPUT(); input.type = 1;
        input.u.ki = new KEYBDINPUT { wVk = vk, wScan = scan, dwFlags = flags, time = 0, dwExtraInfo = IntPtr.Zero };
        return input;
    }

    // Types text as Unicode key events. Returns how many characters were accepted.
    public static int TypeText(string text) {
        int accepted = 0;
        foreach (char raw in text.Replace("\r\n", "\n")) {
            INPUT[] pair;
            if (raw == '\n') pair = new[] { Key(0x0D, 0, 0), Key(0x0D, 0, 2) };
            else if (raw == '\t') pair = new[] { Key(0x09, 0, 0), Key(0x09, 0, 2) };
            else pair = new[] { Key(0, raw, 0x0004), Key(0, raw, 0x0004 | 0x0002) };
            if (SendInput(2, pair, Marshal.SizeOf(typeof(INPUT))) == 2) accepted++;
            System.Threading.Thread.Sleep(4);
        }
        return accepted;
    }

    // Extended keys (arrows, navigation block, Windows key) need the flag so
    // Windows does not read them as their numeric-keypad twins.
    static uint ExtendedFlag(ushort vk) {
        switch (vk) {
            case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26:
            case 0x27: case 0x28: case 0x2D: case 0x2E: case 0x5B: case 0x5C: case 0x5D:
                return 1;
            default:
                return 0;
        }
    }

    // Holds every key of a combination down in order, then releases them in
    // reverse (ctrl+shift+esc, win+r, alt+tab, f5 ...). Returns events sent.
    public static int PressCombination(ushort[] keys, int repeat) {
        int sent = 0;
        for (int r = 0; r < repeat; r++) {
            var events = new List<INPUT>();
            foreach (var vk in keys) events.Add(Key(vk, 0, ExtendedFlag(vk)));
            for (int i = keys.Length - 1; i >= 0; i--) events.Add(Key(keys[i], 0, ExtendedFlag(keys[i]) | 0x0002));
            sent += (int)SendInput((uint)events.Count, events.ToArray(), Marshal.SizeOf(typeof(INPUT)));
            System.Threading.Thread.Sleep(40);
        }
        return sent;
    }

    // Every visible top-level window that has a title, front to back.
    public static List<IntPtr> TopLevelWindows() {
        var found = new List<IntPtr>();
        EnumWindows((hWnd, lParam) => { if (IsWindowVisible(hWnd) && GetWindowTextLength(hWnd) > 0) found.Add(hWnd); return true; }, IntPtr.Zero);
        return found;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder s, int n);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder s, int n);
    [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr hWnd, uint cmd);

    // Hidden, titled, unowned top-level windows of one process. Windows 11
    // Notepad (and some tray apps) keep running with their main window hidden
    // after it is closed; reopening the app just hands over to that process.
    public static List<IntPtr> HiddenMainWindows(uint pid) {
        var found = new List<IntPtr>();
        EnumWindows((hWnd, lParam) => {
            uint owner;
            FgThread(hWnd, out owner);
            if (owner != pid || IsWindowVisible(hWnd) || GetWindowTextLength(hWnd) == 0) return true;
            if (GetWindow(hWnd, 4) != IntPtr.Zero) return true; // owned popup
            var cls = new System.Text.StringBuilder(256); GetClassName(hWnd, cls, 256);
            var c = cls.ToString();
            if (c == "IME" || c == "MSCTFIME UI" || c.StartsWith("GDI+") || c.Contains("Hook") || c.StartsWith("tooltips")) return true;
            found.Add(hWnd);
            return true;
        }, IntPtr.Zero);
        return found;
    }
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll", EntryPoint = "SetForegroundWindow")] static extern bool FgSet(IntPtr hWnd);
    [DllImport("user32.dll", EntryPoint = "GetForegroundWindow")] static extern IntPtr FgGet();
    [DllImport("user32.dll", EntryPoint = "GetWindowThreadProcessId")] static extern uint FgThread(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] public static extern IntPtr SetFocus(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr SetActiveWindow(IntPtr hWnd);

    // Windows refuses SetForegroundWindow from a background process. Try the
    // plain route (after a neutral Alt tap), then join the foreground thread's
    // input queue and flip the window to topmost and back.
    public static bool ForceForeground(IntPtr hWnd) {
        if (IsIconic(hWnd)) ShowWindow(hWnd, 9);
        keybd_event(0x12, 0, 0, UIntPtr.Zero);
        keybd_event(0x12, 0, 2, UIntPtr.Zero);
        BringWindowToTop(hWnd);
        FgSet(hWnd);
        System.Threading.Thread.Sleep(60);
        if (FgGet() == hWnd) return true;

        uint pid;
        uint fgThread = FgThread(FgGet(), out pid);
        uint targetThread = FgThread(hWnd, out pid);
        uint me = GetCurrentThreadId();
        bool a1 = fgThread != 0 && fgThread != me && AttachThreadInput(me, fgThread, true);
        bool a2 = targetThread != 0 && targetThread != me && targetThread != fgThread && AttachThreadInput(me, targetThread, true);
        try {
            ShowWindow(hWnd, IsIconic(hWnd) ? 9 : 5);
            SetWindowPos(hWnd, new IntPtr(-1), 0, 0, 0, 0, 0x0003 | 0x0040);
            SetWindowPos(hWnd, new IntPtr(-2), 0, 0, 0, 0, 0x0003 | 0x0040);
            BringWindowToTop(hWnd);
            FgSet(hWnd);
            SetActiveWindow(hWnd);
            SetFocus(hWnd);
        } finally {
            if (a1) AttachThreadInput(me, fgThread, false);
            if (a2) AttachThreadInput(me, targetThread, false);
        }
        System.Threading.Thread.Sleep(60);
        return FgGet() == hWnd;
    }
}
'@
try { Add-Type -TypeDefinition $windowApi } catch { if ("$_" -notmatch 'already exists') { throw } }

$result = [ordered]@{ ok = $true; action = $Action }
$hasPoint = $PSBoundParameters.ContainsKey('X') -and $PSBoundParameters.ContainsKey('Y')

# Virtual-key code for a key name: letters, digits, F1-F24, punctuation and
# the named keys. Returns $null for a name Windows has no key for.
function Resolve-VirtualKey([string]$name) {
  $n = $name.ToLower().Trim()
  $named = @{
    'enter' = 0x0D; 'return' = 0x0D; 'tab' = 0x09; 'esc' = 0x1B; 'escape' = 0x1B; 'backspace' = 0x08;
    'delete' = 0x2E; 'del' = 0x2E; 'insert' = 0x2D; 'ins' = 0x2D; 'space' = 0x20; 'spacebar' = 0x20;
    'up' = 0x26; 'down' = 0x28; 'left' = 0x25; 'right' = 0x27;
    'arrowup' = 0x26; 'arrowdown' = 0x28; 'arrowleft' = 0x25; 'arrowright' = 0x27;
    'home' = 0x24; 'end' = 0x23; 'pageup' = 0x21; 'pgup' = 0x21; 'pagedown' = 0x22; 'pgdn' = 0x22;
    'capslock' = 0x14; 'printscreen' = 0x2C; 'prtsc' = 0x2C; 'menu' = 0x5D; 'apps' = 0x5D; 'contextmenu' = 0x5D;
    'volumeup' = 0xAF; 'volumedown' = 0xAE; 'volumemute' = 0xAD; 'mute' = 0xAD;
    'playpause' = 0xB3; 'mediaplaypause' = 0xB3; 'nexttrack' = 0xB0; 'medianext' = 0xB0; 'prevtrack' = 0xB1; 'mediaprev' = 0xB1;
    'ctrl' = 0x11; 'control' = 0x11; 'shift' = 0x10; 'alt' = 0x12; 'option' = 0x12;
    'win' = 0x5B; 'windows' = 0x5B; 'meta' = 0x5B; 'super' = 0x5B; 'cmd' = 0x5B; 'command' = 0x5B;
    '-' = 0xBD; 'minus' = 0xBD; '=' = 0xBB; 'equals' = 0xBB; 'plus' = 0xBB; ',' = 0xBC; 'comma' = 0xBC;
    '.' = 0xBE; 'period' = 0xBE; '/' = 0xBF; 'slash' = 0xBF; ';' = 0xBA; 'semicolon' = 0xBA;
    "'" = 0xDE; 'quote' = 0xDE; '[' = 0xDB; ']' = 0xDD; '\' = 0xDC; 'backslash' = 0xDC; '`' = 0xC0; 'backtick' = 0xC0
  }
  if ($named.ContainsKey($n)) { return [uint16]$named[$n] }
  if ($n -match '^f([1-9]|1[0-9]|2[0-4])$') { return [uint16](0x6F + [int]$Matches[1]) }
  if ($n -match '^[a-z]$') { return [uint16][int][char]$n.ToUpper() }
  if ($n -match '^[0-9]$') { return [uint16](0x30 + [int]$n) }
  if ($n -match '^(numpad|num)([0-9])$') { return [uint16](0x60 + [int]$Matches[2]) }
  return $null
}

# Real top-level windows. Packaged apps (Windows 11 Notepad, Calculator) do
# not expose their window through Get-Process, so the window list is read
# from the system itself.
function Get-TopLevelWindows {
  $foreground = [WinApiCore]::GetForegroundWindow()
  $rows = @()
  foreach ($handle in [WinApiWindow]::TopLevelWindows()) {
    $builder = New-Object System.Text.StringBuilder 512
    [WinApiCore]::GetWindowText($handle, $builder, 512) | Out-Null
    $ownerPid = 0
    [WinApiCore]::GetWindowThreadProcessId($handle, [ref]$ownerPid) | Out-Null
    $processName = ""
    try { $processName = (Get-Process -Id $ownerPid -ErrorAction SilentlyContinue).ProcessName } catch {}
    if ($processName -in @("TextInputHost", "SystemSettings") -and $handle -ne $foreground) { continue }
    $rows += [pscustomobject]@{ hwnd = $handle; title = $builder.ToString(); process = [string]$processName; pid = [int]$ownerPid; isForeground = ($handle -eq $foreground) }
  }
  return $rows
}

# The driver uses several names for the same action; map them to one case.
$actionKey = $Action.ToLower()
switch ($actionKey) {
  "right_click"  { $Button = "right" }
  "middle_click" { $Button = "middle" }
  "double_click" { $Count = 2 }
}
$actionAliases = @{
  "mouse_move" = "move"; "left_click" = "click"; "right_click" = "click"; "double_click" = "click"; "middle_click" = "click";
  "mouse_drag" = "drag"; "press_key" = "press"; "hotkey" = "press"; "get_cursor_position" = "get_cursor";
  "get_active_window" = "get_window_state"; "open_app" = "launch_app"; "bring_to_front" = "focus_window";
  "control_window" = "focus_window"; "get_uia_elements" = "get_elements"
}
if ($actionAliases.ContainsKey($actionKey)) { $actionKey = $actionAliases[$actionKey] }
if ($actionKey -eq "drag" -and $FromX -ge 0 -and $FromY -ge 0) { $X = $FromX; $Y = $FromY }

switch ($actionKey) {
  "wait" {
    $waitMs = [Math]::Max(0, [Math]::Min($WaitMs, 8000))
    Start-Sleep -Milliseconds $waitMs
    $result["waitedMs"] = $waitMs
  }
  "get_screen_size" {
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $result["width"] = [int]$bounds.Width
    $result["height"] = [int]$bounds.Height
    $result["scale_factor"] = 1.0
  }

  "screenshot" {
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $w = if ($bounds -and $bounds.Width -gt 0) { [int]$bounds.Width } else { 1920 }
    $h = if ($bounds -and $bounds.Height -gt 0) { [int]$bounds.Height } else { 1080 }
    $bitmap = New-Object System.Drawing.Bitmap $w, $h
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $hasPixels = $false
    try {
      $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
      $hasPixels = $true
    } catch {
      $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(24, 24, 27))
      $graphics.FillRectangle($brush, 0, 0, $w, $h)
      $brush.Dispose()
      $font = New-Object System.Drawing.Font ("Arial", 16)
      $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 240, 240))
      $graphics.DrawString("Zero Agent Screen ($w x $h)", $font, $textBrush, 40.0, 40.0)
      $font.Dispose()
      $textBrush.Dispose()
      $hasPixels = $true
    }
    $ms = New-Object System.IO.MemoryStream
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $ms.ToArray()
    $graphics.Dispose()
    $bitmap.Dispose()
    $ms.Dispose()
    $base64 = [Convert]::ToBase64String($bytes)
    $result["width"] = $w
    $result["height"] = $h
    $result["base64"] = $base64
    $result["bytes"] = $bytes.Length
    $result["mimeType"] = "image/png"
    $result["livePixels"] = $hasPixels
  }

  "get_cursor" {
    $pos = [System.Windows.Forms.Cursor]::Position
    $result["x"] = [int]$pos.X
    $result["y"] = [int]$pos.Y
  }

  "move" {
    if (-not $hasPoint) { throw "mouse_move needs x and y" }
    [WinApiCore]::SetCursorPos($X, $Y) | Out-Null
    $result["x"] = $X
    $result["y"] = $Y
  }

  "click" {
    if (-not $hasPoint) { throw "click needs x and y, or an element name" }
    [WinApiCore]::Click($X, $Y, $Button, $Count)
    $result["x"] = $X
    $result["y"] = $Y
    $result["button"] = $Button
    $result["count"] = $Count
  }

  "drag" {
    if (-not $hasPoint -or -not $PSBoundParameters.ContainsKey('ToX') -or -not $PSBoundParameters.ContainsKey('ToY')) { throw "mouse_drag needs from x,y and to_x,to_y" }
    [WinApiCore]::Drag($X, $Y, $ToX, $ToY)
    $result["from_x"] = $X
    $result["from_y"] = $Y
    $result["to_x"] = $ToX
    $result["to_y"] = $ToY
  }

  "scroll" {
    if (-not $hasPoint) {
      # No point given: scroll the middle of the window in front.
      $rect = New-Object WinApiCore+RECT
      [WinApiCore]::GetWindowRect([WinApiCore]::GetForegroundWindow(), [ref]$rect) | Out-Null
      $X = [int](($rect.Left + $rect.Right) / 2)
      $Y = [int](($rect.Top + $rect.Bottom) / 2)
    }
    $wheelDelta = if ($Direction -eq "up") { $Amount * 120 } else { -($Amount * 120) }
    [WinApiCore]::Scroll($X, $Y, $wheelDelta)
    $result["x"] = $X
    $result["y"] = $Y
    $result["direction"] = $Direction
    $result["amount"] = $Amount
  }

  { $_ -in "type_text", "type" } {
    if ($Text.Length -gt 0) {
      $accepted = [WinApiWindow]::TypeText($Text)
      $result["typedChars"] = $accepted
      if ($accepted -lt ($Text -replace "`r`n", "`n").Length) {
        $result["ok"] = $false
        $result["error"] = "Windows accepted only $accepted of the characters"
      }
      # Read back what the focused control now holds. This only observes; it
      # never rewrites the control.
      Start-Sleep -Milliseconds 120
      try {
        Add-Type -AssemblyName UIAutomationClient
        Add-Type -AssemblyName UIAutomationTypes
        $focused = [System.Windows.Automation.AutomationElement]::FocusedElement
        $pattern = $null
        $current = $null
        if ($focused -and $focused.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$pattern)) {
          $current = [string]$pattern.Current.Value
        } elseif ($focused -and $focused.TryGetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern, [ref]$pattern)) {
          $current = [string]$pattern.DocumentRange.GetText(20000)
        }
        if ($null -ne $current) {
          $normalizedCurrent = $current -replace "`r", ""
          $normalizedText = $Text -replace "`r", ""
          $result["verified"] = $normalizedCurrent.Contains($normalizedText)
          $result["verifiedText"] = if ($result["verified"]) { $Text } else { "" }
          $result["focusedControl"] = [string]$focused.Current.ControlType.ProgrammaticName
        } else {
          $result["verified"] = $false
          $result["verificationUnavailable"] = "The focused control does not expose its text"
        }
      } catch {
        $result["verified"] = $false
      }
    } else {
      $result["ok"] = $false
      $result["error"] = "Missing text parameter"
    }
  }

  "press" {
    if ($Key.Trim().Length -gt 0) {
      $names = @($Key -split '\s*\+\s*' | Where-Object { $_ -ne '' })
      if ($Key.Trim() -eq '+') { $names = @('plus') }
      $codes = @()
      $unknown = @()
      foreach ($name in $names) {
        $vk = Resolve-VirtualKey $name
        if ($null -eq $vk) { $unknown += $name } else { $codes += $vk }
      }
      if ($unknown.Count -gt 0 -or $codes.Count -eq 0) {
        $result["ok"] = $false
        $result["error"] = "Unknown key name(s): " + ($unknown -join ', ') + ". Use names like enter, tab, esc, f5, ctrl, shift, alt, win, a-z, 0-9."
      } else {
        # Modifiers go down first, whatever order they were written in.
        $modifierCodes = @(0x10, 0x11, 0x12, 0x5B)
        $ordered = @($codes | Where-Object { $modifierCodes -contains $_ }) + @($codes | Where-Object { $modifierCodes -notcontains $_ })
        $repeat = [Math]::Max(1, [Math]::Min($Count, 50))
        $sent = [WinApiWindow]::PressCombination([uint16[]]$ordered, $repeat)
        $expected = $ordered.Count * 2 * $repeat
        $result["key"] = $Key
        $result["repeat"] = $repeat
        if ($sent -lt $expected) {
          $result["ok"] = $false
          $result["error"] = "Windows accepted only $sent of $expected key events (the window in front may be running as administrator)"
        }
      }
    } else {
      $result["ok"] = $false
      $result["error"] = "Missing key parameter"
    }
  }

  "get_window_state" {
    $hwnd = [WinApiCore]::GetForegroundWindow()
    $sb = New-Object System.Text.StringBuilder 256
    [WinApiCore]::GetWindowText($hwnd, $sb, 256) | Out-Null
    $title = $sb.ToString()
    $targetPid = 0
    [WinApiCore]::GetWindowThreadProcessId($hwnd, [ref]$targetPid) | Out-Null
    $procName = ""
    if ($targetPid -gt 0) {
      try { $procName = (Get-Process -Id $targetPid -ErrorAction SilentlyContinue).ProcessName } catch {}
    }
    if (-not $title -or $procName -eq "explorer" -or $hwnd -eq [IntPtr]::Zero -or $targetPid -le 0) {
      $top = Get-TopLevelWindows | Where-Object { $_.title.Length -gt 0 -and $_.process -notin @("explorer", "TextInputHost", "SystemSettings") } | Select-Object -First 1
      if ($top) {
        $hwnd = $top.hwnd
        $title = $top.title
        $targetPid = $top.pid
        $procName = $top.process
      } elseif ($targetPid -le 0) {
        $explorer = Get-Process -Name explorer -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($explorer) {
          $targetPid = $explorer.Id
          $procName = $explorer.ProcessName
          $title = if ($explorer.MainWindowTitle) { $explorer.MainWindowTitle } else { "Desktop" }
        } else {
          $cur = [System.Diagnostics.Process]::GetCurrentProcess()
          $targetPid = $cur.Id
          $procName = $cur.ProcessName
          $title = "Zero Desktop"
        }
      }
    }
    $rect = New-Object WinApiCore+RECT
    [WinApiCore]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
    $w = $rect.Right - $rect.Left
    $h = $rect.Bottom - $rect.Top
    if ($w -le 0 -or $h -le 0) {
      $scr = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $rect.Left = 0
      $rect.Top = 0
      $w = if ($scr -and $scr.Width -gt 0) { [int]$scr.Width } else { 1920 }
      $h = if ($scr -and $scr.Height -gt 0) { [int]$scr.Height } else { 1080 }
    }
    $result["title"] = $title
    $result["process"] = $procName
    $result["pid"] = $targetPid
    $result["bounds"] = @{
      x = $rect.Left
      y = $rect.Top
      width = $w
      height = $h
    }
  }

  "list_apps" {
    $apps = Get-Process | Where-Object { $_.MainWindowTitle.Length -gt 0 } | Select-Object -First 25 ProcessName, Id, MainWindowTitle
    $list = @()
    if ($apps) {
      foreach ($a in $apps) {
        $list += @{ name = $a.ProcessName; pid = $a.Id; title = $a.MainWindowTitle }
      }
    }
    $result["apps"] = $list
    $result["count"] = $list.Count
  }

  "list_windows" {
    $list = @()
    foreach ($window in (Get-TopLevelWindows | Select-Object -First 40)) {
      $list += @{ title = $window.title; process = $window.process; pid = $window.pid; hwnd = [long]$window.hwnd; isForeground = [bool]$window.isForeground }
    }
    $result["windows"] = $list
    $result["count"] = $list.Count
  }

  "clipboard_get" {
    $text = ""
    try { $text = [System.Windows.Forms.Clipboard]::GetText() } catch {}
    $result["text"] = $text
  }

  "clipboard_set" {
    try { [System.Windows.Forms.Clipboard]::SetText($Text) } catch {}
    $result["length"] = $Text.Length
  }

  "get_elements" {
    # Real UI Automation walk of the foreground window (breadth first, capped).
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    $elements = New-Object System.Collections.ArrayList
    $hwnd = [WinApiCore]::GetForegroundWindow()
    $rootElement = $null
    try { $rootElement = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd) } catch {}
    if ($rootElement) {
      $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
      $queue = New-Object System.Collections.Queue
      $queue.Enqueue($rootElement)
      $deadline = (Get-Date).AddMilliseconds(4000)
      $visited = 0
      while ($queue.Count -gt 0 -and $elements.Count -lt 150 -and $visited -lt 1500 -and (Get-Date) -lt $deadline) {
        $node = $queue.Dequeue()
        $visited++
        try {
          $info = $node.Current
          $rect = $info.BoundingRectangle
          $typeName = $info.ControlType.ProgrammaticName -replace '^ControlType\.', ''
          if (-not $info.IsOffscreen -and -not $rect.IsEmpty -and $rect.Width -gt 1 -and $rect.Height -gt 1 -and ($info.Name -or $typeName -in @('Edit','Document','Button','ComboBox','CheckBox'))) {
            $value = ""
            try {
              $pattern = $null
              if ($node.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$pattern)) { $value = [string]$pattern.Current.Value }
            } catch {}
            if ($value.Length -gt 300) { $value = $value.Substring(0, 300) }
            $name = [string]$info.Name
            if ($name.Length -gt 160) { $name = $name.Substring(0, 160) }
            [void]$elements.Add([ordered]@{
              uia_id = "uia_" + ($elements.Count + 1)
              name = $name
              type = $typeName
              automationId = [string]$info.AutomationId
              className = [string]$info.ClassName
              x = [int]$rect.X; y = [int]$rect.Y; width = [int]$rect.Width; height = [int]$rect.Height
              centerX = [int]($rect.X + $rect.Width / 2); centerY = [int]($rect.Y + $rect.Height / 2)
              isEnabled = [bool]$info.IsEnabled
              hasKeyboardFocus = [bool]$info.HasKeyboardFocus
              value = $value
            })
          }
          $child = $walker.GetFirstChild($node)
          while ($child -and $queue.Count -lt 3000) {
            $queue.Enqueue($child)
            $child = $walker.GetNextSibling($child)
          }
        } catch {}
      }
      $result["truncated"] = ($queue.Count -gt 0)
    } else {
      $result["ok"] = $false
      $result["error"] = "No foreground window is available for UI Automation"
    }
    $result["elements"] = @($elements)
    $result["count"] = $elements.Count
  }

  "focus_window" {
    # Find a real top-level window by title or process name and act on it.
    $wanted = $Target.Trim()
    if (-not $wanted -and $App) { $wanted = $App.Trim() }
    $mode = $Command.ToLower().Trim()
    if (-not $mode) { $mode = "focus" }
    $hwnd = [IntPtr]::Zero
    $matched = $null
    if ($wanted -match '^\d+$') {
      $hwnd = [IntPtr][long]$wanted
    } elseif ($wanted) {
      $needle = $wanted.ToLower() -replace '\.exe$', ''
      $candidates = Get-TopLevelWindows
      $matched = $candidates | Where-Object { $_.process.ToLower() -eq $needle } | Select-Object -First 1
      # Closing or minimizing needs an exact match (process name or full title);
      # a loose title match could hit an unrelated window.
      if (-not $matched) { $matched = $candidates | Where-Object { $_.title.ToLower() -eq $needle } | Select-Object -First 1 }
      if (-not $matched -and $mode -notin @("close", "minimize")) { $matched = $candidates | Where-Object { $_.title.ToLower().Contains($needle) } | Select-Object -First 1 }
      if (-not $matched -and $mode -notin @("close", "minimize")) { $matched = $candidates | Where-Object { $_.process.ToLower().Contains($needle) } | Select-Object -First 1 }
      if (-not $matched -and $mode -notin @("close", "minimize")) {
        # The app may be running with its main window hidden (Windows 11
        # Notepad after it was closed): show that window.
        foreach ($proc in @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName.ToLower() -eq $needle })) {
          $hidden = @([WinApiWindow]::HiddenMainWindows([uint32]$proc.Id))
          if ($hidden.Count -gt 0) {
            $h = $hidden[0]
            [void][WinApiWindow]::ShowWindow($h, 5)
            Start-Sleep -Milliseconds 120
            $tb = New-Object System.Text.StringBuilder 512
            [WinApiCore]::GetWindowText($h, $tb, 512) | Out-Null
            $matched = [pscustomobject]@{ hwnd = $h; title = $tb.ToString(); process = $proc.ProcessName; pid = $proc.Id; isForeground = $false }
            $result["revealedHidden"] = $true
            break
          }
        }
      }
      if ($matched) { $hwnd = $matched.hwnd }
    } else {
      $hwnd = [WinApiCore]::GetForegroundWindow()
    }
    if ($hwnd -eq [IntPtr]::Zero) {
      $result["ok"] = $false
      $result["focused"] = $false
      $result["error"] = "No window matches '$wanted'"
    } else {
      switch ($mode) {
        "minimize" { [void][WinApiWindow]::ShowWindow($hwnd, 6) }
        "maximize" { [void][WinApiWindow]::ShowWindow($hwnd, 3); [void][WinApiWindow]::ForceForeground($hwnd) }
        "close"    { [void][WinApiWindow]::PostMessage($hwnd, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) }
        default {
          if (-not [WinApiWindow]::ForceForeground($hwnd)) {
            Start-Sleep -Milliseconds 200
            [void][WinApiWindow]::ForceForeground($hwnd)
          }
        }
      }
      Start-Sleep -Milliseconds 150
      $isForeground = ([WinApiCore]::GetForegroundWindow() -eq $hwnd)
      $titleBuilder = New-Object System.Text.StringBuilder 256
      [WinApiCore]::GetWindowText($hwnd, $titleBuilder, 256) | Out-Null
      $result["hwnd"] = [long]$hwnd
      $result["title"] = $titleBuilder.ToString()
      if ($matched) { $result["process"] = $matched.process; $result["pid"] = $matched.pid }
      $result["command"] = $mode
      $result["focused"] = $isForeground
      $result["verified"] = if ($mode -in @("minimize", "close")) { $true } else { $isForeground }
      if ($mode -notin @("minimize", "close") -and -not $isForeground) {
        $result["ok"] = $false
        $result["error"] = "Window was found but Windows did not bring it to the foreground"
      }
    }
  }

  "launch_app" {
    if (-not $App) { throw "Missing app parameter" }
    $wanted = $App.Trim()
    $launched = $null
    $displayName = $null
    $how = $null
    if ($wanted -match '^[a-z][a-z0-9+.-]*:' -and $wanted -notmatch '^[a-z]:\\') {
      # A protocol such as ms-settings: or mailto:
      Start-Process $wanted
      $launched = $wanted; $how = "protocol"
    } elseif ($wanted -match '[\\/]' -and (Test-Path -LiteralPath $wanted)) {
      $p = Start-Process -FilePath $wanted -PassThru
      $launched = $wanted; $how = "path"; $result["pid"] = $p.Id
    } else {
      # Not named $command: PowerShell names are case-insensitive, so that
      # would be the [string]$Command parameter and the path would be lost.
      $exePath = $null
      $exeName = if ([System.IO.Path]::GetExtension($wanted)) { $wanted } else { $wanted + ".exe" }
      if ($exeName -match '\.exe$') {
        # Windows' own copy first (Git ships a different "notepad" on PATH).
        $systemCopy = Join-Path $env:SystemRoot ("System32\" + $exeName)
        if (Test-Path -LiteralPath $systemCopy) { $exePath = $systemCopy }
        if (-not $exePath) {
          $found = Get-Command $exeName -CommandType Application -ErrorAction SilentlyContinue |
            Where-Object { $_.Path -and $_.Path -notmatch '\\(Git|msys64|cygwin)[^\\]*\\(usr\\)?bin\\' } | Select-Object -First 1
          if ($found) { $exePath = $found.Path }
        }
      }
      if ($exePath) {
        try {
          $p = Start-Process -FilePath $exePath -PassThru
          $launched = $exePath; $how = "executable"; $result["pid"] = $p.Id
        } catch { $exePath = $null }
      }
      if (-not $exePath) {
        # Any app in the Start menu, desktop or Store, by its shown name.
        $needle = ($wanted -replace '\.exe$', '').ToLower()
        $apps = @()
        try { $apps = @(Get-StartApps) } catch {}
        $match = $apps | Where-Object { $_.Name.ToLower() -eq $needle } | Select-Object -First 1
        if (-not $match) { $match = $apps | Where-Object { $_.Name.ToLower().StartsWith($needle) } | Sort-Object { $_.Name.Length } | Select-Object -First 1 }
        if (-not $match) { $match = $apps | Where-Object { $_.Name.ToLower().Contains($needle) } | Sort-Object { $_.Name.Length } | Select-Object -First 1 }
        if (-not $match) { $match = $apps | Where-Object { $_.AppID.ToLower().Contains($needle) } | Select-Object -First 1 }
        if ($match) {
          Start-Process ("shell:AppsFolder\" + $match.AppID)
          $launched = $match.AppID; $displayName = $match.Name; $how = "start-menu"
        }
      }
    }
    if (-not $launched) {
      $result["ok"] = $false
      $result["error"] = "No installed app matches '$wanted'"
    } else {
      $result["launched"] = $launched
      $result["how"] = $how
      if ($displayName) { $result["displayName"] = $displayName }
    }
  }

  "open_url" {
    if ($Url) {
      Start-Process $Url
      $result["url"] = $Url
    } else {
      throw "Missing url parameter"
    }
  }

  default {
    throw "Unknown action: $Action"
  }
}

$currentProcess = [System.Diagnostics.Process]::GetCurrentProcess()
$currentProcess.Refresh()
$result['resourceUsage'] = [ordered]@{
  pid = $currentProcess.Id
  startedAt = $currentProcess.StartTime.ToUniversalTime().ToString('o')
  cpuMs = $currentProcess.TotalProcessorTime.TotalMilliseconds
  workingSetBytes = $currentProcess.WorkingSet64
  peakWorkingSetBytes = $currentProcess.PeakWorkingSet64
  scope = 'whole-native-action-process-through-measurement'
}
$result | ConvertTo-Json -Compress
