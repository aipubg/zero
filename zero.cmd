@echo off
setlocal
if "%~1"=="--version" (
    echo v2026.10.6
    exit /b 0
)
if "%~1"=="-v" (
    echo v2026.10.6
    exit /b 0
)
cd /d "%~dp0"
set "ZERO_ROOT=%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
set "ZERO_STATE_DIR=%ZERO_ROOT%zero-system\state"
set "ZERO_CONFIG_PATH=%ZERO_ROOT%zero-system\config\zero.json"
set "ZERO_NO_AUTO_UPDATE=1"
set "DO_NOT_TRACK=1"
node "%ZERO_ROOT%backend\server\zero-host.mjs" %*
endlocal
