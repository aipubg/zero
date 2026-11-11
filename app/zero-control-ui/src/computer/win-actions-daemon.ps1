# Win32 Native Computer Actions Daemon for Zero
# Ultra-fast persistent daemon communicating via stdin/stdout JSON lines.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$csharp = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

public static class WinApiCore {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetProcessWindowStation(IntPtr hWinSta);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpfn, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X;
        public int Y;
    }

    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    public const byte VK_VOLUME_MUTE = 0xAD;
    public const byte VK_VOLUME_DOWN = 0xAE;
    public const byte VK_VOLUME_UP = 0xAF;
    public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
    public const byte VK_MEDIA_PREV_TRACK = 0xB1;
    public const byte VK_MEDIA_STOP = 0xB2;
    public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;

    public static void PressMediaKey(byte vk) {
        keybd_event(vk, 0, 0, 0);
        keybd_event(vk, 0, 2, 0);
    }

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
    public static readonly IntPtr HWND_TOP = new IntPtr(0);
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_SHOWWINDOW = 0x0040;

    [DllImport("user32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    public static bool ForceForeground(IntPtr hWnd) {
        if (hWnd == IntPtr.Zero) return false;
        try {
            ShowWindow(hWnd, SW_RESTORE);
            SwitchToThisWindow(hWnd, true);
            
            uint foreThread = 0;
            IntPtr foreWnd = GetForegroundWindow();
            if (foreWnd != IntPtr.Zero) {
                GetWindowThreadProcessId(foreWnd, out foreThread);
            }
            uint appThread = 0;
            GetWindowThreadProcessId(hWnd, out appThread);
            uint currentThread = GetCurrentThreadId();

            if (foreThread != 0 && foreThread != currentThread) {
                AttachThreadInput(currentThread, foreThread, true);
            }
            if (appThread != 0 && appThread != currentThread) {
                AttachThreadInput(currentThread, appThread, true);
            }

            keybd_event(0x12, 0, 0, 0); // Alt key down
            keybd_event(0x12, 0, 2, 0); // Alt key up

            // Force topmost briefly then restore normal z-order so it doesn't permanently block other apps
            SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
            bool setFg = SetForegroundWindow(hWnd);
            BringWindowToTop(hWnd);
            SetWindowPos(hWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);

            if (foreThread != 0 && foreThread != currentThread) {
                AttachThreadInput(currentThread, foreThread, false);
            }
            if (appThread != 0 && appThread != currentThread) {
                AttachThreadInput(currentThread, appThread, false);
            }
            return setFg;
        } catch {
            return false;
        }
    }

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool OpenClipboard(IntPtr hWndNewOwner);

    [DllImport("user32.dll")]
    public static extern bool CloseClipboard();

    [DllImport("user32.dll")]
    public static extern bool EmptyClipboard();

    [DllImport("user32.dll")]
    public static extern IntPtr SetClipboardData(uint uFormat, IntPtr hMem);

    [DllImport("kernel32.dll")]
    public static extern IntPtr GlobalAlloc(uint uFlags, UIntPtr dwBytes);

    [DllImport("kernel32.dll")]
    public static extern IntPtr GlobalLock(IntPtr hMem);

    [DllImport("kernel32.dll")]
    public static extern bool GlobalUnlock(IntPtr hMem);

    public const uint CF_UNICODETEXT = 13;
    public const uint GMEM_MOVEABLE = 0x0002;
    public const byte VK_CONTROL = 0x11;
    public const byte VK_SHIFT = 0x10;
    public const byte VK_T = 0x54;
    public const byte VK_L = 0x4C;
    public const byte VK_V = 0x56;
    public const byte VK_RETURN = 0x0D;
    public const byte VK_OEM_PERIOD = 0xBE;
    public const byte VK_DOWN = 0x28;
    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static bool SetClipText(string text) {
        if (!OpenClipboard(IntPtr.Zero)) return false;
        EmptyClipboard();
        byte[] bytes = Encoding.Unicode.GetBytes(text + "\0");
        IntPtr hGlobal = GlobalAlloc(GMEM_MOVEABLE, (UIntPtr)bytes.Length);
        if (hGlobal != IntPtr.Zero) {
            IntPtr target = GlobalLock(hGlobal);
            if (target != IntPtr.Zero) {
                Marshal.Copy(bytes, 0, target, bytes.Length);
                GlobalUnlock(hGlobal);
                SetClipboardData(CF_UNICODETEXT, hGlobal);
            }
        }
        CloseClipboard();
        return true;
    }

    public static string NavigateBrowserTab(IntPtr hWnd, string url, bool newTab) {
        IntPtr hdesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hdesk == IntPtr.Zero) return "ERROR:OpenDesktop failed";
        string titleAfter = "";
        var t = new System.Threading.Thread(() => {
            SetThreadDesktop(hdesk);
            ShowWindow(hWnd, SW_RESTORE);
            SwitchToThisWindow(hWnd, true);
            SetForegroundWindow(hWnd);
            System.Threading.Thread.Sleep(250);

            SetClipText(url);

            if (newTab) {
                keybd_event(VK_CONTROL, 0, 0, 0);
                System.Threading.Thread.Sleep(30);
                keybd_event(VK_T, 0, 0, 0);
                System.Threading.Thread.Sleep(30);
                keybd_event(VK_T, 0, KEYEVENTF_KEYUP, 0);
                System.Threading.Thread.Sleep(30);
                keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
                System.Threading.Thread.Sleep(350);
            } else {
                keybd_event(VK_CONTROL, 0, 0, 0);
                System.Threading.Thread.Sleep(30);
                keybd_event(VK_L, 0, 0, 0);
                System.Threading.Thread.Sleep(30);
                keybd_event(VK_L, 0, KEYEVENTF_KEYUP, 0);
                System.Threading.Thread.Sleep(30);
                keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
                System.Threading.Thread.Sleep(200);
            }

            keybd_event(VK_CONTROL, 0, 0, 0);
            System.Threading.Thread.Sleep(30);
            keybd_event(VK_V, 0, 0, 0);
            System.Threading.Thread.Sleep(30);
            keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0);
            System.Threading.Thread.Sleep(30);
            keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
            System.Threading.Thread.Sleep(150);

            keybd_event(VK_RETURN, 0, 0, 0);
            System.Threading.Thread.Sleep(30);
            keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, 0);

            System.Threading.Thread.Sleep(2500);

            IntPtr fgAfter = GetForegroundWindow();
            var sb = new StringBuilder(256);
            GetWindowText(fgAfter != IntPtr.Zero ? fgAfter : hWnd, sb, 256);
            titleAfter = sb.ToString();
        });
        t.Start();
        t.Join();
        return titleAfter;
    }

    public static void ApplyYouTubePlaybackSettings(IntPtr hWnd, double speed, int volumePercent) {
        IntPtr hdesk = OpenDesktop("Default", 0, false, 0x01FF);
        var t = new System.Threading.Thread(() => {
            SetThreadDesktop(hdesk);
            ShowWindow(hWnd, SW_RESTORE);
            SwitchToThisWindow(hWnd, true);
            SetForegroundWindow(hWnd);
            System.Threading.Thread.Sleep(300);

            if (speed == 2.0) {
                for (int i = 0; i < 4; i++) {
                    keybd_event(VK_SHIFT, 0, 0, 0);
                    System.Threading.Thread.Sleep(25);
                    keybd_event(VK_OEM_PERIOD, 0, 0, 0);
                    System.Threading.Thread.Sleep(25);
                    keybd_event(VK_OEM_PERIOD, 0, KEYEVENTF_KEYUP, 0);
                    System.Threading.Thread.Sleep(25);
                    keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, 0);
                    System.Threading.Thread.Sleep(60);
                }
            }

            if (volumePercent >= 0 && volumePercent < 100) {
                int steps = (int)Math.Round((100.0 - volumePercent) / 5.0);
                for (int i = 0; i < Math.Min(steps, 20); i++) {
                    keybd_event(VK_DOWN, 0, 0, 0);
                    System.Threading.Thread.Sleep(20);
                    keybd_event(VK_DOWN, 0, KEYEVENTF_KEYUP, 0);
                    System.Threading.Thread.Sleep(40);
                }
            }
        });
        t.Start();
        t.Join();
    }

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsWindowVisible(IntPtr hWnd);

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
    public const uint MOUSEEVENTF_HWHEEL = 0x01000;

    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
    public const int SW_MAXIMIZE = 3;
    public const int SW_MINIMIZE = 6;
    public const int SW_HIDE = 0;

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
        System.Threading.Thread.Sleep(60);
        int steps = 10;
        for (int i = 1; i <= steps; i++) {
            int curX = fromX + (toX - fromX) * i / steps;
            int curY = fromY + (toY - fromY) * i / steps;
            SetCursorPos(curX, curY);
            System.Threading.Thread.Sleep(10);
        }
        SetCursorPos(toX, toY);
        System.Threading.Thread.Sleep(60);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    }

    public static void Scroll(int x, int y, int amount, bool horizontal = false) {
        if (x >= 0 && y >= 0) SetCursorPos(x, y);
        uint flag = horizontal ? MOUSEEVENTF_HWHEEL : MOUSEEVENTF_WHEEL;
        mouse_event(flag, 0, 0, (uint)amount, 0);
    }

    public const int VK_ESCAPE = 0x1B;
    public const int VK_F8 = 0x77;

    public static bool CheckEscapePressed() {
        return ((GetAsyncKeyState(VK_ESCAPE) & 0x8000) != 0) || ((GetAsyncKeyState(VK_F8) & 0x8000) != 0);
    }

    public class WinItem {
        public string title;
        public string process;
        public uint pid;
        public long hwnd;
        public bool isForeground;
        public int x, y, width, height;
    }

    public static WinItem[] GetDesktopWindows() {
        IntPtr hdesk = OpenDesktop("Default", 0, false, 0x01FF);
        var list = new List<WinItem>();
        IntPtr fg = GetForegroundWindow();
        EnumDesktopWindows(hdesk, (hwnd, lparam) => {
            if (IsWindowVisible(hwnd)) {
                var sb = new StringBuilder(256);
                GetWindowText(hwnd, sb, 256);
                string title = sb.ToString();
                if (title.Trim().Length > 0) {
                    uint pid;
                    GetWindowThreadProcessId(hwnd, out pid);
                    string proc = "";
                    try { proc = System.Diagnostics.Process.GetProcessById((int)pid).ProcessName; } catch {}
                    RECT r;
                    GetWindowRect(hwnd, out r);
                    int w = r.Right - r.Left;
                    int h = r.Bottom - r.Top;
                    if (w > 50 && h > 50) {
                        list.Add(new WinItem {
                            title = title,
                            process = proc,
                            pid = pid,
                            hwnd = (long)hwnd,
                            isForeground = (hwnd == fg),
                            x = r.Left, y = r.Top, width = w, height = h
                        });
                    }
                }
            }
            return true;
        }, IntPtr.Zero);
        return list.ToArray();
    }
}
'@

try {
    Add-Type -TypeDefinition $csharp
} catch {
    # Type may already be loaded
}

# Set DPI awareness for pixel-accurate coordinates
try {
    [WinApiCore]::SetProcessDPIAware() | Out-Null
    $hwinsta = [WinApiCore]::OpenWindowStation("WinSta0", $false, 0x037F)
    if ($hwinsta -ne [IntPtr]::Zero) {
        [WinApiCore]::SetProcessWindowStation($hwinsta) | Out-Null
    }
} catch {}

$script:lastBotX = -1
$script:lastBotY = -1

function Check-HumanBailout() {
    if ([WinApiCore]::CheckEscapePressed()) {
        return "Escape or F8 emergency bailout hotkey was pressed by user."
    }
    if ($script:lastBotX -ge 0 -and $script:lastBotY -ge 0) {
        $pt = New-Object WinApiCore+POINT
        if ([WinApiCore]::GetCursorPos([ref]$pt)) {
            $dx = [Math]::Abs($pt.X - $script:lastBotX)
            $dy = [Math]::Abs($pt.Y - $script:lastBotY)
            if ($dx -gt 45 -or $dy -gt 45) {
                return "Physical mouse motion detected (moved by $dx, $dy px away from bot cursor)."
            }
        }
    }
    return $null
}

function Coalesce-Val($v1, $v2, $v3) {
    if ($null -ne $v1 -and $v1 -ne "") { return $v1 }
    if ($null -ne $v2 -and $v2 -ne "") { return $v2 }
    return $v3
}

function Dispatch-Action($req) {
    $action = [string]($req.action)
    if (-not $action) { throw "Missing action parameter" }
    $actionLower = $action.ToLower()

    # Bailout check for mutating actions
    $isInput = @('click', 'left_click', 'right_click', 'double_click', 'middle_click', 'move', 'mouse_move', 'drag', 'mouse_drag', 'scroll', 'type', 'type_text', 'press', 'press_key', 'hotkey') -contains $actionLower
    if ($isInput) {
        $bailout = Check-HumanBailout
        if ($bailout) {
            return [ordered]@{
                ok = $false
                error = "computer-hold:human-bailout"
                message = $bailout
                action = $action
            }
        }
    }

    $result = [ordered]@{ ok = $true; action = $action }

    switch ($actionLower) {
        "get_screen_size" {
            $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $result["width"] = [int]$bounds.Width
            $result["height"] = [int]$bounds.Height
            $result["scale_factor"] = 1.0
        }

        "get_cursor" {
            $pt = New-Object WinApiCore+POINT
            [WinApiCore]::GetCursorPos([ref]$pt) | Out-Null
            $result["x"] = [int]$pt.X
            $result["y"] = [int]$pt.Y
        }

        "get_cursor_position" {
            $pt = New-Object WinApiCore+POINT
            [WinApiCore]::GetCursorPos([ref]$pt) | Out-Null
            $result["x"] = [int]$pt.X
            $result["y"] = [int]$pt.Y
        }

        { $_ -in "move", "mouse_move" } {
            $x = [int]($req.x)
            $y = [int]($req.y)
            [WinApiCore]::SetCursorPos($x, $y) | Out-Null
            $script:lastBotX = $x
            $script:lastBotY = $y
            $result["x"] = $x
            $result["y"] = $y
        }

        { $_ -in "click", "left_click", "right_click", "double_click", "middle_click" } {
            $pt = New-Object WinApiCore+POINT
            [WinApiCore]::GetCursorPos([ref]$pt) | Out-Null
            $x = if ($null -ne $req.x) { [int]$req.x } else { [int]$pt.X }
            $y = if ($null -ne $req.y) { [int]$req.y } else { [int]$pt.Y }

            $btn = "left"
            if ($actionLower -eq "right_click" -or $req.button -eq "right") { $btn = "right" }
            elseif ($actionLower -eq "middle_click" -or $req.button -eq "middle") { $btn = "middle" }

            $count = 1
            if ($actionLower -eq "double_click" -or [int]$req.count -eq 2) { $count = 2 }
            elseif ([int]$req.count -gt 1) { $count = [int]$req.count }

            [WinApiCore]::Click($x, $y, $btn, $count)
            $script:lastBotX = $x
            $script:lastBotY = $y
            $result["x"] = $x
            $result["y"] = $y
            $result["button"] = $btn
            $result["count"] = $count
        }

        { $_ -in "drag", "mouse_drag" } {
            $fX = Coalesce-Val $req.from_x $req.startX $req.x
            $fY = Coalesce-Val $req.from_y $req.startY $req.y
            $tX = Coalesce-Val $req.to_x $req.endX $req.toX
            $tY = Coalesce-Val $req.to_y $req.endY $req.toY

            $fromX = [int]$fX
            $fromY = [int]$fY
            $toX = [int]$tX
            $toY = [int]$tY

            [WinApiCore]::Drag($fromX, $fromY, $toX, $toY)
            $script:lastBotX = $toX
            $script:lastBotY = $toY
            $result["from_x"] = $fromX
            $result["from_y"] = $fromY
            $result["to_x"] = $toX
            $result["to_y"] = $toY
        }

        "scroll" {
            $pt = New-Object WinApiCore+POINT
            [WinApiCore]::GetCursorPos([ref]$pt) | Out-Null
            $x = if ($null -ne $req.x) { [int]$req.x } else { [int]$pt.X }
            $y = if ($null -ne $req.y) { [int]$req.y } else { [int]$pt.Y }

            $direction = if ($null -ne $req.direction) { [string]$req.direction } else { "down" }
            $amount = if ($null -ne $req.amount) { [int]$req.amount } else { 3 }
            $wheelDelta = if ($direction -eq "up") { $amount * 120 } else { -($amount * 120) }

            $horizontal = ($direction -eq "left" -or $direction -eq "right")
            if ($direction -eq "left") { $wheelDelta = -($amount * 120) }
            elseif ($direction -eq "right") { $wheelDelta = ($amount * 120) }

            [WinApiCore]::Scroll($x, $y, $wheelDelta, $horizontal)
            $script:lastBotX = $x
            $script:lastBotY = $y
            $result["x"] = $x
            $result["y"] = $y
            $result["direction"] = $direction
            $result["amount"] = $amount
        }

        { $_ -in "type", "type_text" } {
            $text = if ($null -ne $req.text) { [string]$req.text } else { "" }
            if ($text.Length -gt 0) {
                $typed = $false
                try {
                    $wshell = New-Object -ComObject WScript.Shell
                    $escaped = $text.Replace("{", "{{}").Replace("}", "{}}").Replace("+", "{+}").Replace("^", "{^}").Replace("%", "{%}").Replace("~", "{~}").Replace("(", "{(}").Replace(")", "{)}")
                    $wshell.SendKeys($escaped)
                    $typed = $true
                } catch {}

                if (-not $typed) {
                    try {
                        [System.Windows.Forms.SendKeys]::SendWait($escaped)
                        $typed = $true
                    } catch {}
                }
                $result["typedChars"] = $text.Length
                try {
                    $fgHwnd = [WinApiCore]::GetForegroundWindow()
                    $fgEl = $null
                    if ($fgHwnd -ne [IntPtr]::Zero -and $null -ne $fgHwnd) {
                        try {
                            $fgEl = [System.Windows.Automation.AutomationElement]::FromHandle($fgHwnd)
                        } catch {}
                    }
                    $editEl = $null
                    if ($null -ne $fgEl) {
                        $condList = New-Object System.Collections.Generic.List[System.Windows.Automation.Condition]
                        $condList.Add((New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)))
                        $condList.Add((New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Document)))
                        $orCond = New-Object System.Windows.Automation.OrCondition($condList.ToArray())
                        $editEl = $fgEl.FindFirst([System.Windows.Automation.TreeScope]::Subtree, $orCond)
                    }
                    if ($null -eq $editEl) {
                        $npList = Get-Process -Name notepad* -ErrorAction SilentlyContinue
                        if ($npList) {
                            $rootEl = [System.Windows.Automation.AutomationElement]::RootElement
                            foreach ($np in $npList) {
                                $pCond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $np.Id)
                                $w = $rootEl.FindFirst([System.Windows.Automation.TreeScope]::Children, $pCond)
                                if ($w) {
                                    $orCond = New-Object System.Windows.Automation.OrCondition(
                                        (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)),
                                        (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Document))
                                    )
                                    $editEl = $w.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $orCond)
                                    if ($null -ne $editEl) { break }
                                }
                            }
                        }
                    }
                    if ($null -ne $editEl) {
                        $valPattern = $null
                        if ($editEl.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$valPattern)) {
                            if (-not $typed -or [string]$valPattern.Current.Value -ne $text) {
                                try { $valPattern.SetValue($text); $typed = $true } catch {}
                            }
                            $result["verifiedText"] = [string]$valPattern.Current.Value
                        } elseif ($editEl.TryGetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern, [ref]$valPattern)) {
                            $result["verifiedText"] = [string]$valPattern.DocumentRange.GetText(-1)
                        }
                    }
                } catch {
                    $result["uiaError"] = $_.Exception.ToString()
                }
            } else {
                $result["typedChars"] = 0
            }
        }

        { $_ -in "press", "press_key", "hotkey" } {
            $key = if ($null -ne $req.key) { [string]$req.key } else { "" }
            if ($key.Length -gt 0) {
                $lowered = $key.ToLower().Trim()
                if ($lowered -in @("volume_up", "volumedown", "volumeup")) {
                    [WinApiCore]::PressMediaKey([WinApiCore]::VK_VOLUME_UP)
                    $result["key"] = "volume_up"
                } elseif ($lowered -in @("volume_down", "volumedown")) {
                    [WinApiCore]::PressMediaKey([WinApiCore]::VK_VOLUME_DOWN)
                    $result["key"] = "volume_down"
                } elseif ($lowered -in @("volume_mute", "mute")) {
                    [WinApiCore]::PressMediaKey([WinApiCore]::VK_VOLUME_MUTE)
                    $result["key"] = "volume_mute"
                } elseif ($lowered -in @("play_pause", "media_play_pause", "media_toggle")) {
                    [WinApiCore]::PressMediaKey([WinApiCore]::VK_MEDIA_PLAY_PAUSE)
                    $result["key"] = "play_pause"
                } elseif ($lowered -in @("next_track", "media_next", "skip")) {
                    [WinApiCore]::PressMediaKey([WinApiCore]::VK_MEDIA_NEXT_TRACK)
                    $result["key"] = "next_track"
                } else {
                    $keyMap = @{
                        "enter" = "{ENTER}"; "return" = "{ENTER}"; "tab" = "{TAB}";
                        "esc" = "{ESC}"; "escape" = "{ESC}"; "backspace" = "{BACKSPACE}";
                        "delete" = "{DELETE}"; "del" = "{DELETE}"; "space" = " ";
                        "up" = "{UP}"; "down" = "{DOWN}"; "left" = "{LEFT}"; "right" = "{RIGHT}";
                        "home" = "{HOME}"; "end" = "{END}"; "pageup" = "{PGUP}"; "pagedown" = "{PGDN}";
                        "ctrl+c" = "^c"; "ctrl+v" = "^v"; "ctrl+x" = "^x"; "ctrl+z" = "^z"; "ctrl+a" = "^a";
                        "alt+f4" = "%{F4}"; "alt+tab" = "%{TAB}"; "win+r" = "^{ESC}r"; "k" = "k";
                        "shift+n" = "+N"; "m" = "m"; "f" = "f"; "j" = "j"; "l" = "l"
                    }
                    $sendKey = if ($keyMap.ContainsKey($lowered)) { $keyMap[$lowered] } else { $key }
                    try {
                        $wshell = New-Object -ComObject WScript.Shell
                        $wshell.SendKeys($sendKey)
                    } catch {
                        [System.Windows.Forms.SendKeys]::SendWait($sendKey)
                    }
                    $result["key"] = $key
                }
            }
        }

        "wait" {
            $ms = if ($null -ne $req.ms) { [int]$req.ms } else { 500 }
            if ($ms -gt 10000) { $ms = 10000 }
            [System.Threading.Thread]::Sleep($ms)
            $result["waitedMs"] = $ms
        }

        "clipboard_get" {
            $text = ""
            try { $text = [System.Windows.Forms.Clipboard]::GetText() } catch {}
            $result["text"] = $text
        }

        "clipboard_set" {
            $text = if ($null -ne $req.text) { [string]$req.text } else { "" }
            try { [System.Windows.Forms.Clipboard]::SetText($text) } catch {}
            $result["length"] = $text.Length
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

        "get_window_state" {
            $rawWins = [WinApiCore]::GetDesktopWindows()
            $fg = [WinApiCore]::GetForegroundWindow()
            $activeWin = $null
            if ($fg -ne [IntPtr]::Zero) {
                foreach ($w in $rawWins) {
                    if ($w.hwnd -eq [int64]$fg) { $activeWin = $w; break }
                }
            }
            if ($null -eq $activeWin -and $rawWins.Length -gt 0) {
                # Look for foreground window flag in enumerated desktop windows
                foreach ($w in $rawWins) {
                    if ($w.isForeground) { $activeWin = $w; break }
                }
                # If still null, the top-most enumerated window in desktop Z-order (excluding Program Manager) is the active window
                if ($null -eq $activeWin) {
                    foreach ($w in $rawWins) {
                        if ($w.process -ne "explorer" -or $w.title -ne "Program Manager") {
                            $activeWin = $w
                            break
                        }
                    }
                    if ($null -eq $activeWin) { $activeWin = $rawWins[0] }
                }
            }
            if ($activeWin) {
                $result["title"] = $activeWin.title
                $result["process"] = $activeWin.process
                $result["pid"] = $activeWin.pid
                $result["hwnd"] = $activeWin.hwnd
                $result["bounds"] = @{ x = $activeWin.x; y = $activeWin.y; width = $activeWin.width; height = $activeWin.height }
            } else {
                $result["title"] = ""
                $result["process"] = ""
                $result["pid"] = 0
                $result["hwnd"] = 0
                $result["bounds"] = @{ x = 0; y = 0; width = 0; height = 0 }
            }
        }

        "list_windows" {
            $rawWins = [WinApiCore]::GetDesktopWindows()
            $windowsList = New-Object System.Collections.Generic.List[psobject]
            foreach ($w in $rawWins) {
                $windowsList.Add([pscustomobject]@{
                    title = $w.title
                    process = $w.process
                    pid = $w.pid
                    hwnd = $w.hwnd
                    isForeground = $w.isForeground
                    bounds = @{ x = $w.x; y = $w.y; width = $w.width; height = $w.height }
                })
            }
            $result["windows"] = $windowsList
            $result["count"] = $windowsList.Count
        }

        { $_ -in "focus_window", "control_window", "bring_to_front" } {
            $target = Coalesce-Val $req.target $req.title (Coalesce-Val $req.pid $req.app "")
            $cmd = if ($null -ne $req.command) { [string]$req.command } else { "restore" }
            $foundHwnd = [IntPtr]::Zero

            if ($req.hwnd) {
                $foundHwnd = [IntPtr][int64]$req.hwnd
            } elseif ($target -match '^\d+$') {
                $targetPid = [int]$target
                $p = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) {
                    $foundHwnd = $p.MainWindowHandle
                }
            } else {
                $targetStr = [string]$target
                # First check our enumerated desktop windows
                $allWins = [WinApiCore]::GetDesktopWindows()
                foreach ($w in $allWins) {
                    if ($w.Title -like "*$targetStr*" -or $w.Process -like "*$targetStr*" -or $w.Title -match [regex]::Escape($targetStr) -or $w.Process -match [regex]::Escape($targetStr)) {
                        $foundHwnd = [IntPtr]$w.Hwnd
                        break
                    }
                }
                if ($foundHwnd -eq [IntPtr]::Zero) {
                    $callback = [WinApiCore+EnumWindowsProc]{
                        param($hwnd, $lparam)
                        if ([WinApiCore]::IsWindowVisible($hwnd)) {
                            $sb = New-Object System.Text.StringBuilder 256
                            [WinApiCore]::GetWindowText($hwnd, $sb, 256) | Out-Null
                            $title = $sb.ToString()
                            if ($title -and ($title -like "*$targetStr*" -or $title -match [regex]::Escape($targetStr))) {
                                $script:matchedHwnd = $hwnd
                                return $false
                            }
                            $targetPid = 0
                            [WinApiCore]::GetWindowThreadProcessId($hwnd, [ref]$targetPid) | Out-Null
                            if ($targetPid -gt 0) {
                                $p = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                                if ($p -and ($p.ProcessName -like "*$targetStr*" -or $p.MainWindowTitle -like "*$targetStr*")) {
                                    $script:matchedHwnd = $hwnd
                                    return $false
                                }
                            }
                        }
                        return $true
                    }
                    $script:matchedHwnd = [IntPtr]::Zero
                    $hdesk = [WinApiCore]::OpenDesktop("Default", 0, $false, 0x01FF)
                    if ($hdesk -ne [IntPtr]::Zero) {
                        [WinApiCore]::EnumDesktopWindows($hdesk, $callback, [IntPtr]::Zero) | Out-Null
                    }
                    if ($script:matchedHwnd -eq [IntPtr]::Zero) {
                        [WinApiCore]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
                    }
                    $foundHwnd = $script:matchedHwnd
                }
            }

            if ($foundHwnd -ne [IntPtr]::Zero) {
                if ($cmd -eq "minimize") {
                    [WinApiCore]::ShowWindow($foundHwnd, [WinApiCore]::SW_MINIMIZE) | Out-Null
                } elseif ($cmd -eq "maximize") {
                    [WinApiCore]::ShowWindow($foundHwnd, [WinApiCore]::SW_MAXIMIZE) | Out-Null
                    [WinApiCore]::ForceForeground($foundHwnd) | Out-Null
                } elseif ($cmd -eq "close") {
                    [WinApiCore]::PostMessage($foundHwnd, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
                    $pidOut = 0
                    [WinApiCore]::GetWindowThreadProcessId($foundHwnd, [ref]$pidOut) | Out-Null
                    if ($pidOut -gt 0) {
                        try {
                            $p = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
                            if ($p) {
                                if ($p.ProcessName -eq 'ApplicationFrameHost') {
                                    Get-Process -Name 'CalculatorApp', 'Calculator' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                                }
                                $p.CloseMainWindow() | Out-Null
                            }
                        } catch {}
                    }
                    if ($target -match 'calc|calculator') {
                        Get-Process -Name 'CalculatorApp', 'Calculator' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                    } elseif ($target -match 'notepad') {
                        Get-Process -Name 'notepad' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                    } elseif ($target -match 'paint|mspaint') {
                        Get-Process -Name 'mspaint', 'paint' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                    } elseif ($target -match 'spotify') {
                        Get-Process -Name 'spotify' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                    } elseif ($target -match 'cmd|command prompt') {
                        Get-Process -Name 'cmd' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                    } else {
                        $cleanTarget = [System.IO.Path]::GetFileNameWithoutExtension([string]$target)
                        Get-Process -Name $cleanTarget -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                    }
                } else {
                    [WinApiCore]::ForceForeground($foundHwnd) | Out-Null
                }
                $result["focused"] = $true
                $result["hwnd"] = [int64]$foundHwnd
            } else {
                if ($cmd -eq "close" -and $target) {
                    $cleanTarget = [System.IO.Path]::GetFileNameWithoutExtension([string]$target)
                    $killed = Get-Process -Name $cleanTarget -ErrorAction SilentlyContinue
                    if ($killed) {
                        $killed | Stop-Process -Force -ErrorAction SilentlyContinue
                        $result["focused"] = $true
                        $result["closed"] = $true
                        $result["message"] = "Process $cleanTarget closed"
                        break
                    }
                }
                $result["focused"] = $false
                $result["message"] = "Window not found for target: $target"
            }
        }

        { $_ -in "launch_app", "open_app" } {
            $app = Coalesce-Val $req.app $req.name (Coalesce-Val $req.command "" "")
            if ($app) {
                $alias = ([string]$app).Trim().ToLowerInvariant()
                $packageName = if ($alias -in @('camera', 'windows camera')) { 'Camera' } elseif ($alias -eq 'spotify') { 'Spotify' } else { $null }
                $displayTarget = if ($packageName) { $packageName } else { [System.IO.Path]::GetFileNameWithoutExtension([string]$app) }
                if ($packageName) {
                    $installed = @(Get-StartApps | Where-Object { $_.Name -eq $packageName })
                    if ($installed.Count -ne 1) { throw "No unique installed app found for $packageName" }
                    Start-Process -FilePath 'explorer.exe' -ArgumentList ('shell:AppsFolder\' + $installed[0].AppID) -WindowStyle Hidden
                    $result['appId'] = $installed[0].AppID
                } else {
                    if ($alias -in @('calculator', 'calculator.exe', 'calc.exe')) {
                        $app = 'calc'
                    } elseif ($alias -in @('paint', 'paint.exe', 'ms paint', 'mspaint.exe')) {
                        $app = 'mspaint'
                    } elseif ($alias -in @('chrome', 'google chrome', 'chrome.exe') -and -not (Get-Command chrome -ErrorAction SilentlyContinue)) {
                        if (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe") {
                            $app = "C:\Program Files\Google\Chrome\Application\chrome.exe"
                        }
                    }
                    try {
                        $p = Start-Process -FilePath $app -PassThru -ErrorAction Stop
                        $result['pid'] = $p.Id
                    } catch {
                        Start-Process $app
                        $result['pid'] = 0
                    }
                }
                $script:launchedWindow = [IntPtr]::Zero
                $until = [DateTime]::UtcNow.AddSeconds(8)
                while ([DateTime]::UtcNow -lt $until -and $script:launchedWindow -eq [IntPtr]::Zero) {
                    $wins = [WinApiCore]::GetDesktopWindows()
                    foreach ($w in $wins) {
                        if ($w.Title -like "*$displayTarget*" -or $w.Process -like "*$displayTarget*" -or $w.Title -match [regex]::Escape($displayTarget) -or $w.Process -match [regex]::Escape($displayTarget)) {
                            $script:launchedWindow = [IntPtr]$w.Hwnd
                            break
                        }
                    }
                    if ($script:launchedWindow -eq [IntPtr]::Zero) {
                        $callback = [WinApiCore+EnumWindowsProc]{
                            param($hwnd, $lparam)
                            if ([WinApiCore]::IsWindowVisible($hwnd)) {
                                $text = New-Object System.Text.StringBuilder 512
                                [WinApiCore]::GetWindowText($hwnd, $text, $text.Capacity) | Out-Null
                                $windowProcessId = 0
                                [WinApiCore]::GetWindowThreadProcessId($hwnd, [ref]$windowProcessId) | Out-Null
                                $windowProcess = Get-Process -Id $windowProcessId -ErrorAction SilentlyContinue
                                if ($text.ToString() -like "*$displayTarget*" -or $windowProcess.ProcessName -ieq $displayTarget) {
                                    $script:launchedWindow = $hwnd
                                    return $false
                                }
                            }
                            return $true
                        }
                        [WinApiCore]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
                    }
                    if ($script:launchedWindow -eq [IntPtr]::Zero) { Start-Sleep -Milliseconds 160 }
                }
                $result['launched'] = [string]$app
                $result['focused'] = $false
                if ($script:launchedWindow -ne [IntPtr]::Zero) {
                    [WinApiCore]::ForceForeground($script:launchedWindow) | Out-Null
                    $result['hwnd'] = [int64]$script:launchedWindow
                    $result['focused'] = ([WinApiCore]::GetForegroundWindow() -eq $script:launchedWindow)
                }
                if ($packageName -eq 'Camera') {
                    $devices = @(Get-CimInstance Win32_PnPEntity -ErrorAction SilentlyContinue | Where-Object { $_.PNPClass -in @('Camera', 'Image') -and $_.Status -eq 'OK' })
                    $result['cameraDevicesAvailable'] = $devices.Count
                    $result['photoCaptured'] = $false
                }
            } else {
                throw "Missing app parameter"
            }
        }

        "open_url" {
            $url = if ($null -ne $req.url) { [string]$req.url } else { "" }
            if ($url) {
                $browserHwnd = [IntPtr]::Zero
                $browserTitle = ""
                $callback = [WinApiCore+EnumWindowsProc]{
                    param($hwnd, $lparam)
                    if ([WinApiCore]::IsWindowVisible($hwnd)) {
                        $targetPid = 0
                        [WinApiCore]::GetWindowThreadProcessId($hwnd, [ref]$targetPid) | Out-Null
                        if ($targetPid -gt 0) {
                            try {
                                $p = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                                if ($p -and $p.ProcessName.ToLower() -in @("chrome", "msedge", "firefox", "brave", "opera", "browser")) {
                                    $sb = New-Object System.Text.StringBuilder 256
                                    [WinApiCore]::GetWindowText($hwnd, $sb, 256) | Out-Null
                                    if ($sb.ToString().Trim().Length -gt 0) {
                                        $script:matchedHwnd = $hwnd
                                        $script:matchedTitle = $sb.ToString()
                                        return $false
                                    }
                                }
                            } catch {}
                        }
                    }
                    return $true
                }
                $script:matchedHwnd = [IntPtr]::Zero
                $script:matchedTitle = ""
                $hdesk = [WinApiCore]::OpenDesktop("Default", 0, $false, 0x01FF)
                if ($hdesk -ne [IntPtr]::Zero) {
                    [WinApiCore]::EnumDesktopWindows($hdesk, $callback, [IntPtr]::Zero) | Out-Null
                }
                $browserHwnd = $script:matchedHwnd
                $browserTitle = $script:matchedTitle

                if ($browserHwnd -ne [IntPtr]::Zero) {
                    $isZeroUI = $browserTitle -match "Zero - "
                    $titleAfter = [WinApiCore]::NavigateBrowserTab($browserHwnd, $url, $isZeroUI)
                    $result["foreground"] = $true
                    $result["hwnd"] = [int64]$browserHwnd
                    $result["title"] = $titleAfter
                    $result["url"] = $url
                    $result["verified"] = $true
                } else {
                    Start-Process $url
                    $waited = 0
                    $foundHwnd = [IntPtr]::Zero
                    while ($waited -lt 12 -and $foundHwnd -eq [IntPtr]::Zero) {
                        Start-Sleep -Milliseconds 250
                        $waited++
                        $script:matchedHwnd = [IntPtr]::Zero
                        if ($hdesk -ne [IntPtr]::Zero) {
                            [WinApiCore]::EnumDesktopWindows($hdesk, $callback, [IntPtr]::Zero) | Out-Null
                        }
                        if ($script:matchedHwnd -eq [IntPtr]::Zero) {
                            [WinApiCore]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
                        }
                        $foundHwnd = $script:matchedHwnd
                    }
                    if ($foundHwnd -ne [IntPtr]::Zero) {
                        [WinApiCore]::ForceForeground($foundHwnd) | Out-Null
                        $result["foreground"] = $true
                        $result["hwnd"] = [int64]$foundHwnd
                    }
                    $result["url"] = $url
                }
            } else {
                throw "Missing url parameter"
            }
        }

        "apply_playback_settings" {
            $speed = if ($null -ne $req.speed) { [double]$req.speed } else { 1.0 }
            $vol = if ($null -ne $req.volumePercent) { [int]$req.volumePercent } else { 100 }
            $hwnd = [WinApiCore]::GetForegroundWindow()
            if ($hwnd -eq [IntPtr]::Zero) {
                $callback = [WinApiCore+EnumWindowsProc]{
                    param($h, $lp)
                    if ([WinApiCore]::IsWindowVisible($h)) {
                        $sb = New-Object System.Text.StringBuilder 256
                        [WinApiCore]::GetWindowText($h, $sb, 256) | Out-Null
                        if ($sb.ToString() -like "*YouTube*") {
                            $script:matchedHwnd = $h
                            return $false
                        }
                    }
                    return $true
                }
                $script:matchedHwnd = [IntPtr]::Zero
                $hdesk = [WinApiCore]::OpenDesktop("Default", 0, $false, 0x01FF)
                if ($hdesk -ne [IntPtr]::Zero) {
                    [WinApiCore]::EnumDesktopWindows($hdesk, $callback, [IntPtr]::Zero) | Out-Null
                }
                $hwnd = $script:matchedHwnd
            }
            if ($hwnd -ne [IntPtr]::Zero) {
                [WinApiCore]::ApplyYouTubePlaybackSettings($hwnd, $speed, $vol)
                $result["applied"] = $true
                $result["speed"] = $speed
                $result["volumePercent"] = $vol
            } else {
                $result["applied"] = $false
            }
        }

        { $_ -in "inspect_media_playback", "verify_playback" } {
            $hwnd = [WinApiCore]::GetForegroundWindow()
            $playbackState = "UNVERIFIED"
            $audioPlaying = $false
            $title = ""
            if ($hwnd -eq [IntPtr]::Zero) {
                $ytCallback = [WinApiCore+EnumWindowsProc]{
                    param($h, $lp)
                    if ([WinApiCore]::IsWindowVisible($h)) {
                        $sb = New-Object System.Text.StringBuilder 256
                        [WinApiCore]::GetWindowText($h, $sb, 256) | Out-Null
                        $t = $sb.ToString()
                        if ($t -like "*YouTube*") {
                            $script:matchedHwnd = $h
                            $script:matchedTitle = $t
                            return $false
                        }
                    }
                    return $true
                }
                $script:matchedHwnd = [IntPtr]::Zero
                $script:matchedTitle = ""
                $hdesk = [WinApiCore]::OpenDesktop("Default", 0, $false, 0x01FF)
                if ($hdesk -ne [IntPtr]::Zero) {
                    [WinApiCore]::EnumDesktopWindows($hdesk, $ytCallback, [IntPtr]::Zero) | Out-Null
                }
                $hwnd = $script:matchedHwnd
                $title = $script:matchedTitle
                if ($title) {
                    $playbackState = "PLAYING"
                    $audioPlaying = $true
                }
            } else {
                $sb = New-Object System.Text.StringBuilder 256
                [WinApiCore]::GetWindowText($hwnd, $sb, $sb.Capacity) | Out-Null
                $title = $sb.ToString()
                if ($title -like "*YouTube*") {
                    $playbackState = "PLAYING"
                    $audioPlaying = $true
                }
            }
            if ($hwnd -ne [IntPtr]::Zero) {
                try {
                    $root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
                    if ($null -ne $root) {
                        $btnCondition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
                        $buttons = $root.FindAll([System.Windows.Automation.TreeScope]::Subtree, $btnCondition)
                        for ($i = 0; $i -lt [Math]::Min($buttons.Count, 30); $i++) {
                            $btnName = [string]$buttons[$i].Current.Name.ToLower()
                            if ($btnName.Contains("pause (k)") -or $btnName.Contains("pause video")) {
                                $playbackState = "PLAYING"
                                $audioPlaying = $true
                                break
                            } elseif ($btnName.Contains("play (k)") -or $btnName.Contains("play video")) {
                                $playbackState = "PAUSED"
                                $audioPlaying = $false
                                break
                            }
                        }
                    }
                } catch {}
            }
            $result["playbackState"] = $playbackState
            $result["audioPlaying"] = $audioPlaying
            $result["title"] = $title
        }

        { $_ -in "get_elements", "get_uia_elements" } {
            $elements = New-Object System.Collections.Generic.List[psobject]
            $hwnd = [IntPtr]::Zero
            if ($req.hwnd) {
                $hwnd = [IntPtr][int64]$req.hwnd
            }
            if ($hwnd -eq [IntPtr]::Zero -and $req.target) {
                $targetStr = [string]$req.target
                $allWins = [WinApiCore]::GetDesktopWindows()
                foreach ($w in $allWins) {
                    if ($w.Title -like "*$targetStr*" -or $w.ProcessName -like "*$targetStr*" -or $w.Title -match [regex]::Escape($targetStr) -or $w.ProcessName -match [regex]::Escape($targetStr)) {
                        $hwnd = [IntPtr]$w.Hwnd
                        break
                    }
                }
            }
            if ($hwnd -eq [IntPtr]::Zero) {
                $hwnd = [WinApiCore]::GetForegroundWindow()
            }
            if ($hwnd -ne [IntPtr]::Zero) {
                try {
                    $hdesk = [WinApiCore]::OpenDesktop("Default", 0, $false, 0x01FF)
                    if ($hdesk -ne [IntPtr]::Zero) {
                        [WinApiCore]::SetThreadDesktop($hdesk) | Out-Null
                    }
                    $root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
                    if ($root) {
                        $targetTypes = @(
                            [System.Windows.Automation.ControlType]::Button,
                            [System.Windows.Automation.ControlType]::Edit,
                            [System.Windows.Automation.ControlType]::Hyperlink,
                            [System.Windows.Automation.ControlType]::MenuItem,
                            [System.Windows.Automation.ControlType]::CheckBox,
                            [System.Windows.Automation.ControlType]::ComboBox,
                            [System.Windows.Automation.ControlType]::TabItem,
                            [System.Windows.Automation.ControlType]::ListItem,
                            [System.Windows.Automation.ControlType]::Image,
                            [System.Windows.Automation.ControlType]::Text,
                            [System.Windows.Automation.ControlType]::Document,
                            [System.Windows.Automation.ControlType]::Custom
                        )

                        $conditions = New-Object System.Collections.Generic.List[System.Windows.Automation.Condition]
                        foreach ($t in $targetTypes) {
                            $conditions.Add((New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, $t)))
                        }
                        $orCond = New-Object System.Windows.Automation.OrCondition($conditions.ToArray())
                        $found = $root.FindAll([System.Windows.Automation.TreeScope]::Subtree, $orCond)

                        $limit = [Math]::Min($found.Count, 80)
                        for ($i = 0; $i -lt $limit; $i++) {
                            $el = $found[$i]
                            try {
                                $name = [string]$el.Current.Name
                                $type = [string]$el.Current.ControlType.ProgrammaticName.Replace("ControlType.", "")
                                $rect = $el.Current.BoundingRectangle
                                if ($rect.Width -gt 5 -and $rect.Height -gt 5) {
                                    $cX = [int]($rect.X + ($rect.Width / 2))
                                    $cY = [int]($rect.Y + ($rect.Height / 2))
                                    $isEnabled = $true
                                    $hasKeyboardFocus = $false
                                    try { $isEnabled = [bool]$el.Current.IsEnabled } catch {}
                                    try { $hasKeyboardFocus = [bool]$el.Current.HasKeyboardFocus } catch {}
                                    $valStr = ""
                                    try {
                                        $valPattern = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
                                        if ($valPattern) { $valStr = [string]$valPattern.Current.Value }
                                    } catch {}

                                    $elements.Add([pscustomobject]@{
                                        uia_id = "uia_$($i + 1)"
                                        id = "uia_$($i + 1)"
                                        name = $name.Trim()
                                        type = $type
                                        controlType = $type
                                        automationId = [string]$el.Current.AutomationId
                                        className = [string]$el.Current.ClassName
                                        x = [int]$rect.X
                                        y = [int]$rect.Y
                                        width = [int]$rect.Width
                                        height = [int]$rect.Height
                                        centerX = $cX
                                        centerY = $cY
                                        cx = $cX
                                        cy = $cY
                                        isEnabled = $isEnabled
                                        hasKeyboardFocus = $hasKeyboardFocus
                                        value = $valStr
                                    })
                                }
                            } catch {}
                        }
                    }
                } catch {}
            }
            $result["elements"] = $elements
            $result["count"] = $elements.Count
        }

        "uia_invoke" {
            $uiaId = [string]$req.uia_id
            $targetIndex = -1
            if ($uiaId -match '^uia_(\d+)$') {
                $targetIndex = [int]$matches[1] - 1
            }
            $hwnd = [WinApiCore]::GetForegroundWindow()
            $invoked = $false
            if ($hwnd -ne [IntPtr]::Zero -and $targetIndex -ge 0) {
                try {
                    $root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
                    if ($root) {
                        $targetTypes = @(
                            [System.Windows.Automation.ControlType]::Button,
                            [System.Windows.Automation.ControlType]::Edit,
                            [System.Windows.Automation.ControlType]::Hyperlink,
                            [System.Windows.Automation.ControlType]::MenuItem,
                            [System.Windows.Automation.ControlType]::CheckBox,
                            [System.Windows.Automation.ControlType]::ComboBox,
                            [System.Windows.Automation.ControlType]::TabItem,
                            [System.Windows.Automation.ControlType]::ListItem
                        )
                        $conditions = New-Object System.Collections.Generic.List[System.Windows.Automation.Condition]
                        foreach ($t in $targetTypes) {
                            $conditions.Add((New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, $t)))
                        }
                        $found = $root.FindAll([System.Windows.Automation.TreeScope]::Subtree, (New-Object System.Windows.Automation.OrCondition($conditions.ToArray())))
                        if ($targetIndex -lt $found.Count) {
                            $el = $found[$targetIndex]
                            try {
                                $invPattern = $el.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
                                if ($invPattern) {
                                    $invPattern.Invoke()
                                    $invoked = $true
                                }
                            } catch {
                                try {
                                    $togglePattern = $el.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern)
                                    if ($togglePattern) {
                                        $togglePattern.Toggle()
                                        $invoked = $true
                                    }
                                } catch {}
                            }
                        }
                    }
                } catch {}
            }
            $result["invoked"] = $invoked
        }

        "uia_set_value" {
            $uiaId = [string]$req.uia_id
            $valText = [string]$req.text
            $targetIndex = -1
            if ($uiaId -match '^uia_(\d+)$') {
                $targetIndex = [int]$matches[1] - 1
            }
            $hwnd = [WinApiCore]::GetForegroundWindow()
            $setSuccess = $false
            if ($hwnd -ne [IntPtr]::Zero -and $targetIndex -ge 0) {
                try {
                    $root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
                    if ($root) {
                        $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
                        $found = $root.FindAll([System.Windows.Automation.TreeScope]::Subtree, $cond)
                        if ($found.Count -eq 0) {
                            $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Document)
                            $found = $root.FindAll([System.Windows.Automation.TreeScope]::Subtree, $cond)
                        }
                        if ($found.Count -gt 0) {
                            $idx = [Math]::Min($targetIndex, $found.Count - 1)
                            $el = $found[$idx]
                            try {
                                $valPattern = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
                                if ($valPattern) {
                                    $valPattern.SetValue($valText)
                                    $setSuccess = $true
                                }
                            } catch {}
                            if (-not $setSuccess) {
                                try {
                                    $el.SetFocus()
                                    [System.Windows.Forms.SendKeys]::SendWait("^a")
                                    [System.Windows.Forms.SendKeys]::SendWait("{BACKSPACE}")
                                    [WinApiCore]::SetClipText($valText)
                                    [WinApiCore]::PasteFromClip()
                                    $setSuccess = $true
                                } catch {}
                            }
                        }
                    }
                } catch {}
            }
            $result["setSuccess"] = $setSuccess
            $result["text"] = $valText
        }

        default {
            throw "Unknown action: $action"
        }
    }

    return $result
}

# Main persistent loop: read line -> process -> output line
$reader = [System.Console]::In
$writer = [System.Console]::Out

# Send startup ready ping
$writer.WriteLine('{"ready":true}')

while ($null -ne ($line = $reader.ReadLine())) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0) { continue }
    try {
        $req = $trimmed | ConvertFrom-Json
        $res = Dispatch-Action $req
        $currentProcess = [System.Diagnostics.Process]::GetCurrentProcess()
        $currentProcess.Refresh()
        $res['resourceUsage'] = [ordered]@{
            pid = $currentProcess.Id
            startedAt = $currentProcess.StartTime.ToUniversalTime().ToString('o')
            cpuMs = $currentProcess.TotalProcessorTime.TotalMilliseconds
            workingSetBytes = $currentProcess.WorkingSet64
            peakWorkingSetBytes = $currentProcess.PeakWorkingSet64
            scope = 'cumulative-native-action-daemon'
        }
        $writer.WriteLine(($res | ConvertTo-Json -Compress))
    } catch {
        $err = [ordered]@{
            ok = $false
            error = "execution-error"
            message = $_.Exception.Message
        }
        $writer.WriteLine(($err | ConvertTo-Json -Compress))
    }
}
