@echo off
title Seven Nights
cd /d "%~dp0"

REM First run: install dependencies if they're missing.
if not exist node_modules (
    echo Installing dependencies - first run only...
    call npm install
)

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
echo   ===========================================
echo.

REM Open the host page once the server has had a moment to boot.
start "" cmd /c "timeout /t 6 /nobreak >nul & start http://%LANIP%:3100/host"

call npm run dev -- -H 0.0.0.0 -p 3100

REM Keep the window open if the server exits with an error.
pause
