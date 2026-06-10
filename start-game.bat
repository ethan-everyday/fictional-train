@echo off
title Seven Nights
cd /d "%~dp0"

REM ============================================================
REM  Seven Nights - play mode
REM  Builds once (first run / after --rebuild), then serves the
REM  finished game from one process. No internet needed: phones
REM  join over your Wi-Fi.
REM ============================================================

REM First run: install dependencies if they're missing.
if not exist node_modules (
    echo Installing dependencies - first run only...
    call npm install
)

REM Kill anything still holding the game's ports (old/crashed servers),
REM so a double-click always gets a clean start.
echo Checking for old servers...
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort 3100,3199 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Write-Host ('  stopping old server (pid ' + $_ + ')'); Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

REM Build the game if it has never been built (or if asked to).
if "%1"=="--rebuild" goto build
if not exist out goto build
goto run

:build
echo Building the game - takes about half a minute...
call npm run build
if errorlevel 1 (
    echo Build failed - see the errors above.
    pause
    exit /b 1
)

:run
REM Find this PC's Wi-Fi/LAN IP so the phones know where to point.
set LANIP=localhost
for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1).IPAddress"') do set LANIP=%%i

echo.
echo   ===========================================
echo    SEVEN NIGHTS
echo   ===========================================
echo    Host screen:  http://%LANIP%:3100/host
echo    Phones join:  http://%LANIP%:3100/play
echo   ===========================================
echo    Open the HOST page via that IP, not
echo    localhost, or the QR code won't work.
echo    Close this window to stop the game.
echo    (Run with --rebuild after changing code.)
echo   ===========================================
echo.

REM Open the host page once the server has had a moment to boot.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://%LANIP%:3100/host"

node server.js

REM Keep the window open if the server exits with an error.
pause
