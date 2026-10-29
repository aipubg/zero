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
  [int]$Amount = 3
)

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

$result = [ordered]@{ ok = $true; action = $Action }

switch ($Action.ToLower()) {
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
    [WinApiCore]::SetCursorPos($X, $Y) | Out-Null
    $result["x"] = $X
    $result["y"] = $Y
  }

  "click" {
    [WinApiCore]::Click($X, $Y, $Button, $Count)
    $result["x"] = $X
    $result["y"] = $Y
    $result["button"] = $Button
    $result["count"] = $Count
  }

  "drag" {
    [WinApiCore]::Drag($X, $Y, $ToX, $ToY)
    $result["from_x"] = $X
    $result["from_y"] = $Y
    $result["to_x"] = $ToX
    $result["to_y"] = $ToY
  }

  "scroll" {
    $wheelDelta = if ($Direction -eq "up") { $Amount * 120 } else { -($Amount * 120) }
    [WinApiCore]::Scroll($X, $Y, $wheelDelta)
    $result["x"] = $X
    $result["y"] = $Y
    $result["direction"] = $Direction
    $result["amount"] = $Amount
  }

  "type" {
    if ($Text.Length -gt 0) {
      try {
        [System.Windows.Forms.Clipboard]::SetText($Text)
        [System.Windows.Forms.SendKeys]::SendWait("^v")
        $result["typedChars"] = $Text.Length
      } catch {
        $escaped = $Text.Replace("{", "{{}").Replace("}", "{}}").Replace("+", "{+}").Replace("^", "{^}").Replace("%", "{%}")
        [System.Windows.Forms.SendKeys]::SendWait($escaped)
        $result["typedChars"] = $Text.Length
      }
    }
  }

  "press" {
    if ($Key.Length -gt 0) {
      $keyMap = @{
        "enter" = "{ENTER}";
        "return" = "{ENTER}";
        "tab" = "{TAB}";
        "esc" = "{ESC}";
        "escape" = "{ESC}";
        "backspace" = "{BACKSPACE}";
        "delete" = "{DELETE}";
        "del" = "{DELETE}";
        "space" = " ";
        "up" = "{UP}";
        "down" = "{DOWN}";
        "left" = "{LEFT}";
        "right" = "{RIGHT}";
        "home" = "{HOME}";
        "end" = "{END}";
        "pageup" = "{PGUP}";
        "pagedown" = "{PGDN}";
        "ctrl+c" = "^c";
        "ctrl+v" = "^v";
        "ctrl+x" = "^x";
        "ctrl+z" = "^z";
        "ctrl+a" = "^a";
        "alt+f4" = "%{F4}";
        "alt+tab" = "%{TAB}"
      }
      $lowered = $Key.ToLower().Trim()
      $sendKey = if ($keyMap.ContainsKey($lowered)) { $keyMap[$lowered] } else { $Key }
      [System.Windows.Forms.SendKeys]::SendWait($sendKey)
      $result["key"] = $Key
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
    $rect = New-Object WinApiCore+RECT
    [WinApiCore]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
    $result["title"] = $title
    $result["process"] = $procName
    $result["pid"] = $targetPid
    $result["bounds"] = @{
      x = $rect.Left
      y = $rect.Top
      width = $rect.Right - $rect.Left
      height = $rect.Bottom - $rect.Top
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

  "launch_app" {
    if ($App) {
      $p = Start-Process -FilePath $App -PassThru -ErrorAction Stop
      $result["launched"] = $App
      $result["pid"] = $p.Id
    } else {
      throw "Missing app parameter"
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

$result | ConvertTo-Json -Compress
