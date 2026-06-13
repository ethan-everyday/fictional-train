@echo off
title Seven Nights - Story Editor
cd /d "%~dp0"

REM ============================================================
REM  Seven Nights - visual story editor
REM  Edit events, connections, and characters; saves straight
REM  back to the game's content. A dev tool, not the game.
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
echo    SEVEN NIGHTS - STORY EDITOR
echo   ===========================================
echo    Open:  http://localhost:4100
echo    Close this window to stop the editor.
echo   ===========================================
echo.

REM Open the editor once the server has had a moment to boot.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:4100"

node scripts/editor-server.js

pause
