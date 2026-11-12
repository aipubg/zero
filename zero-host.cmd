@echo off
setlocal
cd /d "%~dp0"
set "ZERO_ROOT=%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

set "ZERO_STATE_DIR=%ZERO_ROOT%zero-system\state"
set "ZERO_CONFIG_PATH=%ZERO_ROOT%zero-system\config\zero.json"
rem Internal compatibility fallback only; ZERO_* stays canonical.
if not defined OPENCLAW_STATE_DIR set "OPENCLAW_STATE_DIR=%ZERO_STATE_DIR%"
if not defined OPENCLAW_CONFIG_PATH set "OPENCLAW_CONFIG_PATH=%ZERO_CONFIG_PATH%"
set "OPENCLAW_NO_AUTO_UPDATE=1"
set "DO_NOT_TRACK=1"

echo [Zero Host] Launching Native Zero Host on port 18789...
node "%ZERO_ROOT%backend\server\zero-host.mjs" %*
endlocal
