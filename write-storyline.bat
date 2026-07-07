@echo off
title Seven Nights - Storyline Scribe
cd /d "%~dp0"

REM ============================================================
REM  Seven Nights - the Storyline Scribe
REM  A guided, step-by-step page for writing a storyline by
REM  hand. Same server + validation as the full editor.
REM ============================================================

if not exist node_modules (
    echo Installing dependencies - first run only...
    call npm install
)

REM Kill any old editor still holding the port.
echo Checking for an old editor...
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort 4100 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo.
echo   ===========================================
echo    SEVEN NIGHTS - STORYLINE SCRIBE
echo   ===========================================
echo    Open:  http://localhost:4100/write
echo    Close this window to stop it.
echo   ===========================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:4100/write"

node scripts/editor-server.js

pause
