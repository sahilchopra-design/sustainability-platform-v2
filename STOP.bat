@echo off
setlocal

:: ============================================================
::  A2 Intelligence - Stop all servers
::  Kills processes on port 8001 (backend) and 4000 (frontend)
:: ============================================================

echo.
echo  ============================================================
echo   A2 Intelligence   Stopping Servers
echo  ============================================================
echo.

set "FOUND=0"

:: Kill backend on port 8001
echo  Stopping Backend  (port 8001)...
for /f "tokens=5" %%P in ('netstat -ano 2^>nul ^| findstr "LISTENING" ^| findstr ":8001 "') do (
    taskkill /F /PID %%P >nul 2>&1
    echo    Stopped PID %%P
    set "FOUND=1"
)

:: Kill frontend on port 4000
echo  Stopping Frontend (port 4000)...
for /f "tokens=5" %%P in ('netstat -ano 2^>nul ^| findstr "LISTENING" ^| findstr ":4000 "') do (
    taskkill /F /PID %%P >nul 2>&1
    echo    Stopped PID %%P
    set "FOUND=1"
)

echo.
if "%FOUND%"=="0" (
    echo  No servers were running on ports 8001 or 4000.
) else (
    echo  Done. All servers stopped.
)
echo.
pause
endlocal
