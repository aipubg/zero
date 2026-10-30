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

    public const int VK_ESCAPE = 0x1B;

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

    public static bool CheckEscapePressed() {
        return (GetAsyncKeyState(VK_ESCAPE) & 0x8000) != 0;
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
} catch {}

$script:lastBotX = -1
$script:lastBotY = -1

function Check-HumanBailout() {
    if ([WinApiCore]::CheckEscapePressed()) {
        return "Escape key was pressed by user."
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
                try {
                    [System.Windows.Forms.Clipboard]::SetText($text)
                    [System.Windows.Forms.SendKeys]::SendWait("^v")
                    $result["typedChars"] = $text.Length
                } catch {
                    $escaped = $text.Replace("{", "{{}").Replace("}", "{}}").Replace("+", "{+}").Replace("^", "{^}").Replace("%", "{%}")
                    [System.Windows.Forms.SendKeys]::SendWait($escaped)
                    $result["typedChars"] = $text.Length
                }
            } else {
                $result["typedChars"] = 0
            }
        }

        { $_ -in "press", "press_key", "hotkey" } {
            $key = if ($null -ne $req.key) { [string]$req.key } else { "" }
            if ($key.Length -gt 0) {
                $keyMap = @{
                    "enter" = "{ENTER}"; "return" = "{ENTER}"; "tab" = "{TAB}";
                    "esc" = "{ESC}"; "escape" = "{ESC}"; "backspace" = "{BACKSPACE}";
                    "delete" = "{DELETE}"; "del" = "{DELETE}"; "space" = " ";
                    "up" = "{UP}"; "down" = "{DOWN}"; "left" = "{LEFT}"; "right" = "{RIGHT}";
                    "home" = "{HOME}"; "end" = "{END}"; "pageup" = "{PGUP}"; "pagedown" = "{PGDN}";
                    "ctrl+c" = "^c"; "ctrl+v" = "^v"; "ctrl+x" = "^x"; "ctrl+z" = "^z"; "ctrl+a" = "^a";
                    "alt+f4" = "%{F4}"; "alt+tab" = "%{TAB}"; "win+r" = "^{ESC}r"
                }
                $lowered = $key.ToLower().Trim()
                $sendKey = if ($keyMap.ContainsKey($lowered)) { $keyMap[$lowered] } else { $key }
                [System.Windows.Forms.SendKeys]::SendWait($sendKey)
                $result["key"] = $key
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
            $rect = New-Object WinApiCore+RECT
            [WinApiCore]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
            $result["title"] = $title
            $result["process"] = $procName
            $result["pid"] = $targetPid
            $result["hwnd"] = [int64]$hwnd
            $result["bounds"] = @{
                x = $rect.Left
                y = $rect.Top
                width = $rect.Right - $rect.Left
                height = $rect.Bottom - $rect.Top
            }
        }

        "list_windows" {
            $windowsList = New-Object System.Collections.Generic.List[psobject]
            $fgHwnd = [WinApiCore]::GetForegroundWindow()

            $callback = [WinApiCore+EnumWindowsProc]{
                param($hwnd, $lparam)
                if ([WinApiCore]::IsWindowVisible($hwnd)) {
                    $sb = New-Object System.Text.StringBuilder 256
                    [WinApiCore]::GetWindowText($hwnd, $sb, 256) | Out-Null
                    $title = $sb.ToString()
                    if ($title.Trim().Length -gt 0) {
                        $targetPid = 0
                        [WinApiCore]::GetWindowThreadProcessId($hwnd, [ref]$targetPid) | Out-Null
                        $pName = ""
                        try { $pName = (Get-Process -Id $targetPid -ErrorAction SilentlyContinue).ProcessName } catch {}
                        $rect = New-Object WinApiCore+RECT
                        [WinApiCore]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
                        $w = $rect.Right - $rect.Left
                        $h = $rect.Bottom - $rect.Top
                        if ($w -gt 50 -and $h -gt 50) {
                            $windowsList.Add([pscustomobject]@{
                                title = $title
                                process = $pName
                                pid = $targetPid
                                hwnd = [int64]$hwnd
                                isForeground = ($hwnd -eq $fgHwnd)
                                bounds = @{ x = $rect.Left; y = $rect.Top; width = $w; height = $h }
                            })
                        }
                    }
                }
                return $true
            }

            [WinApiCore]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
            $result["windows"] = $windowsList
            $result["count"] = $windowsList.Count
        }

        { $_ -in "focus_window", "control_window", "bring_to_front" } {
            $target = Coalesce-Val $req.target $req.title (Coalesce-Val $req.pid $req.app "")
            $cmd = if ($null -ne $req.command) { [string]$req.command } else { "restore" }
            $foundHwnd = [IntPtr]::Zero

            if ($target -match '^\d+$') {
                $targetPid = [int]$target
                $p = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) {
                    $foundHwnd = $p.MainWindowHandle
                }
            } else {
                $targetStr = [string]$target
                $callback = [WinApiCore+EnumWindowsProc]{
                    param($hwnd, $lparam)
                    if ([WinApiCore]::IsWindowVisible($hwnd)) {
                        $sb = New-Object System.Text.StringBuilder 256
                        [WinApiCore]::GetWindowText($hwnd, $sb, 256) | Out-Null
                        if ($sb.ToString() -like "*$targetStr*") {
                            $script:matchedHwnd = $hwnd
                            return $false
                        }
                    }
                    return $true
                }
                $script:matchedHwnd = [IntPtr]::Zero
                [WinApiCore]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
                $foundHwnd = $script:matchedHwnd
            }

            if ($foundHwnd -ne [IntPtr]::Zero) {
                if ($cmd -eq "minimize") {
                    [WinApiCore]::ShowWindow($foundHwnd, [WinApiCore]::SW_MINIMIZE) | Out-Null
                } elseif ($cmd -eq "maximize") {
                    [WinApiCore]::ShowWindow($foundHwnd, [WinApiCore]::SW_MAXIMIZE) | Out-Null
                    [WinApiCore]::SetForegroundWindow($foundHwnd) | Out-Null
                } elseif ($cmd -eq "close") {
                    [WinApiCore]::CloseWindow($foundHwnd) | Out-Null
                } else {
                    [WinApiCore]::ShowWindow($foundHwnd, [WinApiCore]::SW_RESTORE) | Out-Null
                    [WinApiCore]::SetForegroundWindow($foundHwnd) | Out-Null
                }
                $result["focused"] = $true
                $result["hwnd"] = [int64]$foundHwnd
            } else {
                $result["focused"] = $false
                $result["message"] = "Window not found for target: $target"
            }
        }

        { $_ -in "launch_app", "open_app" } {
            $app = Coalesce-Val $req.app $req.name (Coalesce-Val $req.command "" "")
            if ($app) {
                $p = Start-Process -FilePath $app -PassThru -ErrorAction Stop
                $result["launched"] = $app
                $result["pid"] = $p.Id
            } else {
                throw "Missing app parameter"
            }
        }

        "open_url" {
            $url = if ($null -ne $req.url) { [string]$req.url } else { "" }
            if ($url) {
                Start-Process $url
                $result["url"] = $url
            } else {
                throw "Missing url parameter"
            }
        }

        { $_ -in "get_elements", "get_uia_elements" } {
            $elements = New-Object System.Collections.Generic.List[psobject]
            $hwnd = [WinApiCore]::GetForegroundWindow()
            if ($hwnd -ne [IntPtr]::Zero) {
                try {
                    $root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
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
                    $orCond = New-Object System.Windows.Automation.OrCondition($conditions.ToArray())
                    $found = $root.FindAll([System.Windows.Automation.TreeScope]::Subtree, $orCond)

                    $limit = [Math]::Min($found.Count, 40)
                    for ($i = 0; $i -lt $limit; $i++) {
                        $el = $found[$i]
                        try {
                            $name = [string]$el.Current.Name
                            $type = [string]$el.Current.ControlType.ProgrammaticName.Replace("ControlType.", "")
                            $rect = $el.Current.BoundingRectangle
                            if ($rect.Width -gt 5 -and $rect.Height -gt 5) {
                                $cX = [int]($rect.X + ($rect.Width / 2))
                                $cY = [int]($rect.Y + ($rect.Height / 2))
                                $elements.Add([pscustomobject]@{
                                    name = $name.Trim()
                                    type = $type
                                    x = [int]$rect.X
                                    y = [int]$rect.Y
                                    width = [int]$rect.Width
                                    height = [int]$rect.Height
                                    centerX = $cX
                                    centerY = $cY
                                    automationId = [string]$el.Current.AutomationId
                                })
                            }
                        } catch {}
                    }
                } catch {}
            }
            $result["elements"] = $elements
            $result["count"] = $elements.Count
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
