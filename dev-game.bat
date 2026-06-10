@echo off
title Seven Nights (dev)
cd /d "%~dp0"

REM ============================================================
REM  Seven Nights - development mode
REM  Hot reload via next dev on 3100 + the game's WebSocket
REM  server on 3199. For playing (not coding), use start-game.bat.
REM ============================================================

if not exist node_modules (
    echo Installing dependencies - first run only...
    call npm install
)

echo Checking for old servers...
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort 3100,3199 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Write-Host ('  stopping old server (pid ' + $_ + ')'); Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

set LANIP=localhost
for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1).IPAddress"') do set LANIP=%%i

echo.
echo   Dev server:   http://%LANIP%:3100/host
echo   Phones join:  http://%LANIP%:3100/play
echo.

REM Game WebSocket server in the background (port 3199).
start "Seven Nights WS" /min cmd /c "node server.js --dev"

REM Next dev with hot reload in this window (port 3100).
call npm run dev -- -H 0.0.0.0 -p 3100

pause
